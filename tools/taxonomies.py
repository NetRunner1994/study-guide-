"""Per-exam objective taxonomies and the keywords used to tag questions.

Tagging is a keyword heuristic, not an authoritative classification. It exists
so the app can offer a "drill one objective" filter; the app labels it as such.
"""

SECURITY_PLUS = [
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
        "reporting", "metrics",
    ]),
]

A_PLUS_CORE_1 = [
    ("1.0 Mobile Devices", [
        "laptop", "notebook", "battery", "digitizer", "inverter", "touchpad",
        "docking station", "port replicator", "keyboard replacement", "palmrest",
        "mobile device", "smartphone", "tablet", "e-reader", "wearable", "smart watch",
        "fitness monitor", "vr headset", "stylus", "hotspot", "tethering", "cellular",
        "esim", "sim card", "imei", "imsi", "nfc", "bluetooth pairing", "gps",
        "mobile display", "oled", "lcd panel", "backlight", "webcam", "microphone module",
        "wireless card", "screen replacement", "trackpad", "biometric reader",
        "mobile synchronization", "airplane mode",
    ]),
    ("2.0 Networking", [
        "tcp", "udp", "port 80", "port 443", "port 22", "port 25", "port 53",
        "dns", "dhcp", "subnet", "subnet mask", "ipv4", "ipv6", "apipa", "default gateway",
        "static ip", "vlan", "router", "switch", "unmanaged switch", "managed switch",
        "patch panel", "poe", "access point", "wireless access point", "firewall",
        "wi-fi", "wifi", "802.11", "2.4ghz", "5ghz", "6ghz", "channel", "wpa2", "wpa3",
        "cable modem", "ont", "fiber", "dsl", "satellite internet", "wisp",
        "cat5", "cat6", "cat 6", "plenum", "coaxial", "rj45", "rj11", "sfp",
        "crimper", "punchdown", "toner probe", "cable tester", "loopback plug",
        "lan", "wan", "pan", "man", "wlan", "san", "vpn", "nat", "qos",
        "network share", "print server", "dns server", "proxy server", "nas",
        "screened subnet", "port forwarding", "upnp", "ip configuration",
    ]),
    ("3.0 Hardware", [
        "motherboard", "cpu socket", "chipset", "form factor", "atx", "itx",
        "ram", "ddr3", "ddr4", "ddr5", "sodimm", "dimm", "ecc", "dual channel",
        "power supply", "psu", "wattage", "rail", "modular power", "connector",
        "sata", "nvme", "m.2", "pcie", "hdd", "ssd", "raid 0", "raid 1", "raid 5",
        "raid 10", "expansion card", "gpu", "graphics card", "sound card",
        "capture card", "cooling", "fan", "heat sink", "thermal paste", "liquid cooling",
        "bios", "uefi", "cmos", "tpm", "secure boot", "boot order",
        "printer", "laser printer", "inkjet", "thermal printer", "impact printer",
        "3d printer", "toner", "fuser", "imaging drum", "transfer belt", "duplex",
        "adf", "printer calibration", "print spooler", "usb", "thunderbolt", "hdmi",
        "displayport", "vga", "dvi", "peripheral", "monitor", "projector", "kvm",
        "scanner", "barcode", "signature pad", "touch screen", "adapter cable",
    ]),
    ("4.0 Virtualization and Cloud Computing", [
        "virtual machine", "hypervisor", "type 1 hypervisor", "type 2 hypervisor",
        "vdi", "virtual desktop", "sandbox", "cloud", "saas", "iaas", "paas",
        "public cloud", "private cloud", "hybrid cloud", "community cloud",
        "elasticity", "rapid elasticity", "scalability", "metered utilization",
        "measured service", "file synchronization", "cloud storage", "cloud file storage",
        "resource pooling", "shared resources", "cross-platform virtualization",
        "emulator", "guest os", "host machine", "virtual network", "snapshot",
        "on-demand", "high availability cloud", "desktop as a service",
    ]),
    ("5.0 Hardware and Network Troubleshooting", [
        "troubleshoot", "troubleshooting", "beep code", "post", "no power",
        "power on self-test", "overheating", "blue screen", "bsod", "black screen",
        "artifact", "distorted image", "distorted geometry", "burn-in", "dead pixel",
        "flickering", "intermittent shutdown", "grinding noise", "clicking noise",
        "smoke", "burning smell", "capacitor swelling", "inaccurate system date",
        "boot loop", "drive not recognized", "raid failure", "extended read/write",
        "missing drives", "sluggish drive", "led status", "diagnostic",
        "print quality", "streak", "faded print", "ghost image", "paper jam",
        "garbled print", "multipage misfeed", "toner not fusing", "double/echo images",
        "incorrect chroma", "grinding printer", "finishing issue",
        "no connectivity", "limited connectivity", "intermittent wireless",
        "slow network speeds", "jitter", "latency", "high latency", "port flapping",
        "vertical line", "horizontal line", "symptom", "first step", "isolate the issue",
    ]),
]

A_PLUS_CORE_2 = [
    ("1.0 Operating Systems", [
        "windows 10", "windows 11", "macos", "linux", "chromeos", "android", "ios",
        "workstation", "file system", "ntfs", "fat32", "exfat", "ext4", "apfs",
        "command line", "command prompt", "cmd", "powershell", "terminal",
        "ipconfig", "ifconfig", "ping", "tracert", "netstat", "nslookup", "pathping",
        "chkdsk", "sfc", "diskpart", "gpupdate", "gpresult", "robocopy", "xcopy",
        "winver", "shutdown command", "format command", "control panel", "settings app",
        "task manager", "device manager", "disk management", "event viewer",
        "msconfig", "regedit", "registry editor", "local users and groups",
        "certificate manager", "group policy", "active directory", "domain join",
        "workgroup", "user account control", "uac", "in-place upgrade", "clean install",
        "partition", "gpt", "mbr", "drive format", "boot method", "recovery partition",
        "remote desktop", "rdp", "ssh", "vnc", "file explorer", "task scheduler",
        "services.msc", "resource monitor", "performance monitor", "system properties",
        "network and sharing center", "mapped drive", "printer sharing",
        "time machine", "disk utility", "finder", "dock", "gestures", "spotlight",
        "keychain", "filevault", "package manager", "apt", "yum", "samba", "grep", "chmod",
    ]),
    ("2.0 Security", [
        "malware", "ransomware", "trojan", "keylogger", "rootkit", "virus", "spyware",
        "boot sector virus", "cryptominer", "phishing", "vishing", "smishing",
        "shoulder surfing", "tailgating", "piggybacking", "dumpster diving",
        "evil twin", "ddos", "denial of service", "zero-day", "spoofing", "on-path",
        "brute force", "dictionary attack", "insider threat", "sql injection",
        "cross-site scripting", "xss", "firewall", "antivirus", "anti-malware",
        "windows defender", "acl", "principle of least privilege", "permissions",
        "ntfs permissions", "share permissions", "inheritance", "bitlocker", "efs",
        "encryption", "password complexity", "password expiration", "password best practice",
        "multifactor", "mfa", "authenticator", "hard token", "soft token", "sms",
        "badge reader", "biometrics", "key fob", "smart card", "bollard", "fence",
        "access control vestibule", "video surveillance", "alarm system", "magnetometer",
        "data destruction", "degaussing", "shredding", "incinerating", "drilling",
        "wiping", "low-level format", "standard formatting", "certificate of destruction",
        "browser security", "pop-up blocker", "browser extension", "plug-in",
        "password manager", "valid certificate", "secure connection", "private browsing",
        "ad blocker", "guest account", "autorun", "autoplay", "screensaver lock",
        "wireless security", "radius", "tacacs", "kerberos", "port security",
    ]),
    ("3.0 Software Troubleshooting", [
        "bsod", "blue screen", "pinwheel", "sluggish performance", "boot problem",
        "frequent shutdown", "service not starting", "application crash",
        "low memory warning", "usb controller resource warning", "system instability",
        "no os found", "slow profile load", "time drift", "application will not install",
        "os update failure", "fails to launch", "slow to respond", "battery life",
        "randomly reboots", "screen does not autorotate", "connectivity issue",
        "malware removal", "quarantine", "remediate", "system restore", "safe mode",
        "uninstall", "reinstall", "repair install", "rollback update", "reimage",
        "recovery mode", "startup repair", "disable system restore", "update anti-malware",
        "educate the end user", "verify full system functionality", "scan and removal",
        "troubleshoot the application", "restart the service", "reboot the device",
        "clear cache", "force stop", "app permission", "developer mode",
    ]),
    ("4.0 Operational Procedures", [
        "documentation", "ticketing system", "asset management", "asset tag",
        "knowledge base", "standard operating procedure", "sop", "topology diagram",
        "acceptable use policy", "change management", "rollback plan", "sandbox testing",
        "change board", "request form", "risk analysis", "scope of the change",
        "end-user acceptance", "backup", "full backup", "incremental", "differential",
        "synthetic backup", "3-2-1", "backup testing", "grandfather-father-son",
        "safety procedure", "esd strap", "esd mat", "equipment grounding",
        "antistatic bag", "proper power handling", "lifting technique", "electrical fire",
        "compliance", "msds", "sds", "temperature", "humidity", "ventilation",
        "power surge", "ups", "surge suppressor", "battery backup", "brownout",
        "incident response", "chain of custody", "first response", "preserve the data",
        "licensing", "eula", "drm", "open-source", "personal license", "enterprise license",
        "pii", "phi", "pci", "gdpr", "regulated data", "professionalism",
        "communication technique", "difficult customer", "set expectations",
        "avoid distractions", "scripting", ".bat", ".ps1", ".vbs", ".sh", ".py", ".js",
        "remote access", "rmm", "screen-sharing", "msra", "third-party tools",
        "ticket", "escalate", "escalation", "maintenance window", "approval",
        "inventory", "procurement", "purchase order", "warranty", "end of life",
        "recycling", "battery disposal", "toner disposal", "environmental impact",
        "air filter", "compressed air", "dust", "safety goggles", "fire extinguisher",
        "cable management", "trip hazard", "prohibited content", "prohibited activity",
        "licensing agreement", "non-compliant", "offsite", "on-site", "restore test",
        "backup rotation", "retention policy", "corporate policy", "company policy",
        "best practice", "proper procedure", "document the", "notify the",
        "report the incident", "follow up", "surveillance footage",
    ]),
]

# Troubleshooting objectives are scored differently: a question belongs to them
# because it describes a fault to diagnose, not because of the parts it names.
# Without this, "the laptop screen flickers" is tagged Hardware, and the
# troubleshooting domain ends up nearly empty.
TROUBLESHOOTING_DOMAINS = {
    "5.0 Hardware and Network Troubleshooting",
    "3.0 Software Troubleshooting",
}

SYMPTOM_SIGNALS = [
    "troubleshoot", "issue", "problem", "error", "symptom", "fails", "failing",
    "failed", "unable to", "not working", "no longer", "does not", "will not",
    "won't", "cannot", "intermittent", "randomly", "slow", "sluggish", "freezes",
    "frozen", "crash", "crashes", "hangs", "unresponsive", "stops responding",
    "reboots", "restarts", "shuts down", "overheat", "noise", "smell", "flicker",
    "distorted", "garbled", "blank screen", "black screen", "blue screen",
    "no power", "no display", "no connectivity", "dropped", "disconnects",
    "most likely cause", "likely cause", "root cause", "resolve", "resolution",
    "fix", "repair", "diagnose", "next step", "first step", "should the technician do",
    "corrupted", "missing", "denied", "rejected", "timeout", "times out",
    "degraded", "poor performance", "high usage", "spikes", "leaking", "stuck",
    "jam", "streak", "smudge", "faded", "ghost", "artifact", "dead pixel",
]

# How hard a symptom-shaped question is pushed toward its troubleshooting domain.
# Tuned per exam: Core 1's troubleshooting objective covers hardware *and*
# network faults, so it should claim far more symptom questions than Core 2's,
# which covers software only. Security+ has no troubleshooting objective.
TROUBLE_WEIGHT = {"sy0-701": 0.0, "220-1201": 1.3, "220-1202": 0.4}
DEFAULT_TROUBLE_WEIGHT = 1.0


TAXONOMIES = {
    "sy0-701": SECURITY_PLUS,
    "220-1201": A_PLUS_CORE_1,
    "220-1202": A_PLUS_CORE_2,
}


def classify(exam_id, text):
    """Pick the objective whose keywords best match this question's text."""
    domains = TAXONOMIES[exam_id]
    low = text.lower()
    trouble = sum(1 for signal in SYMPTOM_SIGNALS if signal in low)

    best_name, best_score = domains[0][0], -1.0
    for name, keywords in domains:
        score = 0.0
        for keyword in keywords:
            if keyword in low:
                # Multi-word phrases are more specific, so they count for more.
                score += 1.0 + 0.75 * keyword.count(" ")
        if name in TROUBLESHOOTING_DOMAINS:
            score += trouble * TROUBLE_WEIGHT.get(exam_id, DEFAULT_TROUBLE_WEIGHT)
        if score > best_score:
            best_name, best_score = name, score
    return best_name


def domain_names(exam_id):
    return [name for name, _ in TAXONOMIES[exam_id]]
