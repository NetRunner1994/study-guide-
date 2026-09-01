"""Parse the CompTIA Security+ SY0-701 practice-question PDF into questions.json.

Usage: python tools/parse_pdf.py <source.pdf> <out.json>
Requires: pypdf
"""
import json
import re
import sys

ANSWER_RE = re.compile(
    r"(?m)^\s*Correct Answer[s]?:\s*([A-G](?:\s*,\s*[A-G])*)\s*(?:—\s*(.*?))?\s*✅\s*$"
)
COMPLETED_RE = re.compile(r"(?m)^\s*Completed Answer\s*✅\s*$")
OPTION_RE = re.compile(r"(?m)^([A-G])\.\s+")
WHY_RE = re.compile(r"(?m)^\s*Why The Other Options Are Incorrect\s*$")
HOWTO_RE = re.compile(r"(?m)^\s*How To Work It Out\s*$")
PAIR_RE = re.compile(r"^(.*?)\s+→\s+(.*)$")
FORMAT_RE = re.compile(r"^(HOTSPOT|SIMULATION|DRAG DROP)$", re.I)
# Simulation items repeat this UI boilerplate; it says nothing about the question.
BOILERPLATE = "if at any time you would like to bring back the initial state"


def unwrap(block):
    """Rejoin PDF hard-wraps. Wrapped lines keep a trailing space; final lines do not."""
    paragraphs, current = [], ""
    for raw in block.split("\n"):
        line = raw.rstrip("\r")
        if not line.strip():
            if current:
                paragraphs.append(current.strip())
                current = ""
            continue
        stripped = line.strip()
        if current.endswith("-"):
            # Wraps fall on real hyphens here ("non-" + "encrypted"), so keep the hyphen.
            current = current + stripped
        elif current:
            current = current + " " + stripped
        else:
            current = stripped
        if not line.endswith(" ") and not stripped.endswith("-"):
            paragraphs.append(current.strip())
            current = ""
    if current:
        paragraphs.append(current.strip())

    merged: list[str] = []
    for para in paragraphs:
        if not para:
            continue
        # A trailing qualifier such as "(Choose two.)" belongs to the line above it.
        if merged and para.startswith("(") and len(para) < 40:
            merged[-1] = merged[-1] + " " + para
        else:
            merged.append(para)
    return merged


def split_options(pre):
    """Split the pre-answer block into (stem, [(letter, text), ...])."""
    marks = [m for m in OPTION_RE.finditer(pre)]
    if not marks:
        return unwrap(pre), []
    # Find the run that starts at 'A' and increments; prefer the last valid run.
    best = None
    for i, m in enumerate(marks):
        if m.group(1) != "A":
            continue
        run, expected = [m], 1
        for nxt in marks[i + 1:]:
            if nxt.group(1) == chr(ord("A") + expected):
                run.append(nxt)
                expected += 1
            else:
                break
        if len(run) >= 2 and (best is None or len(run) >= len(best)):
            best = run
    if not best:
        return unwrap(pre), []
    stem = unwrap(pre[: best[0].start()])
    options = []
    for i, m in enumerate(best):
        end = best[i + 1].start() if i + 1 < len(best) else len(pre)
        text = " ".join(unwrap(pre[m.end():end]))
        options.append((m.group(1), text.strip()))
    return stem, options


LEAD_ANSWER_RE = re.compile(r"(?m)\A(?:\s*[A-G]\.\s+[^\n]*\n)+")


def strip_lead_answers(post, letters):
    """Multi-answer items restate each chosen option on its own line before the prose."""
    m = LEAD_ANSWER_RE.match(post)
    if not m:
        return post, []
    lines = [l.strip() for l in m.group(0).strip().split("\n") if l.strip()]
    if [l[0] for l in lines] != letters:
        return post, []
    return post[m.end():], [l[2:].strip() for l in lines]


def split_why(post):
    """Split post-answer text into (explanation paragraphs, {letter: reason})."""
    m = WHY_RE.search(post)
    if not m:
        return unwrap(post), {}
    explanation = unwrap(post[: m.start()])
    tail = post[m.end():]
    why, marks = {}, list(OPTION_RE.finditer(tail))
    for i, mk in enumerate(marks):
        end = marks[i + 1].start() if i + 1 < len(marks) else len(tail)
        why[mk.group(1)] = " ".join(unwrap(tail[mk.end():end])).strip()
    return explanation, why


DOMAINS = [
    ("1.0 General Security Concepts", [
        "cia triad", "confidentiality", "non-repudiation", "aaa", "authentication",
        "authorization", "gap analysis", "zero trust", "control plane", "data plane",
        "policy engine", "honeypot", "honeytoken", "honeyfile", "deceptive",
        "change management", "certificate", "public key", "private key", "pki",
        "encryption", "cryptograph", "hashing", "salting", "key exchange",
        "digital signature", "tpm", "hsm", "key escrow", "obfuscation", "tokenization",
        "steganography", "blockchain", "secure enclave", "cipher", "aes", "rsa",
        "physical control", "deterrent control", "compensating control", "directive",
    ]),
    ("2.0 Threats, Vulnerabilities & Mitigations", [
        "threat actor", "nation-state", "hacktivist", "insider threat", "shadow it",
        "phishing", "vishing", "smishing", "pretexting", "impersonation",
        "business email compromise", "watering hole", "typosquatting",
        "social engineering", "malware", "ransomware", "trojan", "worm", "spyware",
        "rootkit", "keylogger", "logic bomb", "virus", "botnet", "backdoor",
        "vulnerability", "zero-day", "buffer overflow", "race condition",
        "sql injection", "xss", "cross-site", "privilege escalation", "replay attack",
        "ddos", "dos attack", "dns poisoning", "on-path", "arp poisoning",
        "brute-force", "brute force", "password spray", "downgrade attack",
        "side channel", "supply chain attack", "misconfiguration", "jailbreak",
        "sideload", "indicator of compromise", "exploit", "patching", "hardening",
        "segmentation", "least privilege", "attack surface",
    ]),
    ("3.0 Security Architecture", [
        "cloud", "iaas", "paas", "saas", "hybrid", "on-premises", "virtualization",
        "container", "serverless", "microservice", "iot", "scada", "ics", "embedded",
        "rtos", "infrastructure as code", "high availability", "load balanc",
        "clustering", "failover", "site resilienc", "hot site", "cold site",
        "warm site", "backup", "snapshot", "replication", "journaling",
        "disaster recovery", "capacity planning", "power", "generator", "ups",
        "firewall", "waf", "ids", "ips", "proxy", "vpn", "ipsec", "sd-wan", "sase",
        "network appliance", "port security", "802.1x", "eap", "vlan", "screened subnet",
        "dlp", "data sovereignty", "data classification", "data at rest",
        "data in transit", "geographic restriction", "masking", "resilience",
        "architecture", "topology", "air gap", "jump server", "tunneling",
    ]),
    ("4.0 Security Operations", [
        "baseline", "hardening", "mobile device management", "mdm", "byod", "cope",
        "cyod", "wpa3", "wireless", "sase", "asset management", "inventory",
        "disposal", "sanitization", "certification of destruction",
        "vulnerability scan", "penetration test", "bug bounty", "cvss", "cve",
        "false positive", "false negative", "remediation", "monitoring", "alerting",
        "siem", "soar", "netflow", "log aggregation", "syslog", "antivirus", "edr",
        "xdr", "dns filtering", "email security", "dkim", "spf", "dmarc",
        "user behavior analytics", "firewall rule", "acl", "web filter",
        "operating system security", "group policy", "selinux", "automation",
        "orchestration", "scripting", "incident response", "forensic", "chain of custody",
        "e-discovery", "legal hold", "root cause analysis", "tabletop", "simulation exercise",
        "identity", "provisioning", "deprovisioning", "sso", "saml", "oauth", "ldap",
        "federation", "mfa", "multifactor", "biometric", "token", "password manager",
        "just-in-time permission", "privileged access", "vault", "rbac", "abac",
        "mandatory access control", "discretionary access", "playbook", "ticket",
    ]),
    ("5.0 Security Program Management & Oversight", [
        "governance", "policy", "standard", "procedure", "guideline", "acceptable use",
        "board", "committee", "regulatory", "compliance", "gdpr", "pci dss", "hipaa",
        "sox", "attestation", "audit", "internal audit", "external audit",
        "risk assessment", "risk register", "risk appetite", "risk tolerance",
        "risk analysis", "qualitative", "quantitative", "ale", "aro", "sle",
        "risk transfer", "risk acceptance", "risk avoidance", "risk mitigation",
        "business impact analysis", "rto", "rpo", "mttr", "mtbf",
        "third-party", "vendor", "supply chain", "due diligence", "sla", "mou", "moa",
        "nda", "sow", "master service agreement", "bpa", "vendor monitoring",
        "questionnaire", "right-to-audit", "penetration testing agreement",
        "privacy", "data owner", "data controller", "data processor", "data custodian",
        "data steward", "retention", "security awareness", "training", "phishing campaign",
        "reporting", "metrics", "attestation",
    ]),
]


def classify(text):
    low = text.lower()
    scores = []
    for name, keywords in DOMAINS:
        score = sum(len(k) for k in keywords if k in low)
        scores.append((score, name))
    scores.sort(reverse=True)
    return scores[0][1] if scores[0][0] else "1.0 General Security Concepts"


def main(pdf_path, out_path):
    from pypdf import PdfReader

    reader = PdfReader(pdf_path)
    text = "\n".join(page.extract_text() for page in reader.pages)
    chunks = re.split(r"(?m)^Question #(\d+)\s*$", text)
    numbers, bodies = chunks[1::2], chunks[2::2]

    questions, problems = [], []
    for number, body in zip(numbers, bodies):
        number = int(number)
        answer = ANSWER_RE.search(body)
        if answer:
            letters = [x.strip() for x in answer.group(1).split(",")]
            stem, options = split_options(body[: answer.start()])
            post, restated = strip_lead_answers(body[answer.end():], letters)
            explanation, why = split_why(post)
            valid = {letter for letter, _ in options}
            if len(options) < 2 or not set(letters) <= valid:
                problems.append((number, "options", len(options), letters))
                continue
            questions.append({
                "id": number,
                "type": "multi" if len(letters) > 1 else "single",
                "prompt": stem,
                "options": [{"letter": letter, "text": text_} for letter, text_ in options],
                "answer": letters,
                "answerText": "; ".join(restated) if restated else (answer.group(2) or "").strip(),
                "explanation": explanation,
                "why": why,
                "domain": classify(" ".join(stem) + " " + " ".join(t for _, t in options)),
            })
            continue

        completed = COMPLETED_RE.search(body)
        if not completed:
            problems.append((number, "no-answer", 0, []))
            continue
        raw_stem = unwrap(body[: completed.start()])
        fmt = "Simulation"
        stem = []
        for line in raw_stem:
            if FORMAT_RE.match(line):
                fmt = line.title()
                continue
            if line.lower().startswith(BOILERPLATE):
                continue
            stem.append(line)
        tail = body[completed.end():]
        howto = HOWTO_RE.search(tail)
        answer_block = tail[: howto.start()] if howto else tail
        steps = unwrap(tail[howto.end():]) if howto else []
        lead, pairs = [], []
        for line in unwrap(answer_block):
            pair = PAIR_RE.match(line)
            if pair:
                pairs.append({"item": pair.group(1).strip(), "match": pair.group(2).strip()})
            else:
                lead.append(line)
        questions.append({
            "id": number,
            "type": "pbq",
            "format": fmt,
            "prompt": stem,
            "summary": lead,
            "pairs": pairs,
            "steps": steps,
            "domain": classify(" ".join(stem)),
        })

    questions.sort(key=lambda q: q["id"])
    with open(out_path, "w") as handle:
        json.dump(questions, handle, indent=1, ensure_ascii=False)

    kinds = {}
    for q in questions:
        kinds[q["type"]] = kinds.get(q["type"], 0) + 1
    print("parsed:", len(questions), kinds)
    print("problems:", problems)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
