"""Parse a CompTIA practice-question PDF into the app's questions JSON.

Usage: python tools/parse_pdf.py <exam-id> <source.pdf> <out.json>

`exam-id` selects the objective taxonomy used to tag questions; see
tools/taxonomies.py for the exams that are supported.

Requires: pypdf
"""
import json
import re
import sys

from taxonomies import TAXONOMIES, classify

ANSWER_RE = re.compile(
    r"(?m)^\s*Correct Answer[s]?:\s*([A-H](?:\s*,\s*[A-H])*)\s*(?:—\s*(.*?))?\s*✅\s*$"
)
COMPLETED_RE = re.compile(r"(?m)^\s*Completed Answer\s*✅\s*$")
OPTION_RE = re.compile(r"(?m)^([A-H])\.\s+")
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


LEAD_ANSWER_RE = re.compile(r"(?m)\A(?:\s*[A-H]\.\s+[^\n]*\n)+")


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


def main(exam_id, pdf_path, out_path):
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
                "domain": classify(exam_id, " ".join(stem) + " " + " ".join(t for _, t in options)),
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
            "domain": classify(exam_id, " ".join(stem)),
        })

    questions.sort(key=lambda q: q["id"])
    with open(out_path, "w") as handle:
        json.dump(questions, handle, indent=1, ensure_ascii=False)

    kinds, by_domain = {}, {}
    for q in questions:
        kinds[q["type"]] = kinds.get(q["type"], 0) + 1
        by_domain[q["domain"]] = by_domain.get(q["domain"], 0) + 1
    print(f"{exam_id}: parsed {len(questions)}", kinds)
    for name, _ in TAXONOMIES[exam_id]:
        print(f"   {by_domain.get(name, 0):4d}  {name}")
    if problems:
        print("   problems:", problems)


if __name__ == "__main__":
    if len(sys.argv) != 4 or sys.argv[1] not in TAXONOMIES:
        sys.exit(
            "usage: parse_pdf.py <exam-id> <source.pdf> <out.json>\n"
            f"exam-id is one of: {', '.join(TAXONOMIES)}"
        )
    main(sys.argv[1], sys.argv[2], sys.argv[3])
