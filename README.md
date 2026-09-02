# CompTIA Arcade — a study guide and quiz game

A mobile-first React study app covering multiple CompTIA exams. Every question carries the
correct answer, a full explanation, and a note on why each other option is wrong — so a wrong
answer teaches you something instead of just costing points.

It installs to a phone home screen, runs offline, and keeps all progress on the device.

## Exams

| Exam | Code | Questions | Objectives |
| --- | --- | --- | --- |
| Security+ | SY0-701 | 610 | 5 |
| A+ Core 1 | 220-1201 | 462 | 5 |
| A+ Core 2 | 220-1202 | 396 | 4 |

**1,468 questions in total.** Switch exams from the button at the top of the Home screen, or
from Settings. Each exam keeps its own progress, XP, badges, mastery and review schedule; the
day streak is shared, so studying any exam keeps it alive. Only the active exam's question
bank is downloaded, so adding exams does not slow the app down.

## Features

**Study guide**
- Every parsed question for the active exam, searchable across prompts, options and explanations
- Filter by exam objective, or by flagged / missed / due / unseen
- Performance-based simulations (hotspot and drag-and-drop) shown as matching cards
- Flag anything for later review

**Six game modes**

| Mode | Shape |
| --- | --- |
| Quick Play | 10 questions, 45s each, instant feedback |
| Sprint | 90 seconds, as many as you can clear |
| Survival | 3 lives, endless, 30s per question |
| Domain Drill | 15 questions from one exam objective |
| Smart Review | Whatever is due, flagged or previously missed |
| Exam Simulation | 90 questions in 90 minutes, no feedback until the end, scaled 100–900 with 750 to pass |

**Scoring and progression** (tracked per exam)
- 100 points per correct answer, plus up to 60 for speed when a clock is running
- Streak multiplier rising to 2× at ten correct in a row
- XP and levels on a triangular curve, plus 17 badges
- Leitner spaced repetition: correct answers push a question further out (1 → 2 → 4 → 9 → 21 days),
  a miss drops it back to daily
- Per-objective mastery meters, a 14-day activity chart, and a session history

**App behaviour**
- Installable PWA with a service worker, so it works with no connection after the first load
- Bottom tab navigation, 48px+ tap targets, safe-area insets, and hardware-back support during a run
- Sound and haptics (both optional), and full keyboard control on a laptop — A–F to answer, Enter to advance
- Progress lives in `localStorage`; nothing is sent anywhere

## Running it

> **Do not open the `index.html` at the repo root in a browser.** That is Vite's *source*
> entry — it points at `/src/main.tsx`, raw TypeScript no browser can execute, so you get a
> blank white page. Use one of the three routes below instead.

**1. One file, no install.** Build a single self-contained HTML file and open it directly —
no server, no Node, works offline. Everything including the question bank is inlined.

```bash
npm install
npm run build:standalone   # -> dist-standalone/index.html, just open it
```

**2. Hosted.** Pushing to `main` builds and publishes to GitHub Pages via
`.github/workflows/deploy.yml`. Enable it once under **Settings → Pages → Source: GitHub
Actions**. A real HTTPS URL is what lets the PWA install to a phone home screen.

**3. Local development.**

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle in dist/ — serve this, don't open it from disk
npm run preview    # serve the built bundle
npm test           # 15 data-integrity and scoring tests
```

In the hosted and dev builds the question bank is a lazily-loaded chunk (~200 KB gzipped), so
the shell paints before it arrives. The standalone build inlines it into one ~960 KB file.

## Regenerating the question banks

`src/data/<exam-id>.json` is generated from a source PDF. The PDFs are not committed. To rebuild:

```bash
pip install pypdf
npm run data -- sy0-701  "CompTIA Security+ SY0-701 Exam Practice Questions.pdf" src/data/sy0-701.json
npm run data -- 220-1201 "CompTIA A+ 220-1201 Exam Practice Questions.pdf"       src/data/220-1201.json
npm run data -- 220-1202 "CompTIA A+ 220-1202 Exam Practice Questions.pdf"       src/data/220-1202.json
```

`tools/parse_pdf.py` rejoins the PDF's hard line-wraps, splits each item into stem, options,
correct answer, explanation and per-distractor notes, handles the single-answer, "choose two"
and "choose three" formats, converts performance-based items into matching pairs, and tags
every question with an exam objective.

Parse results: **610 of 611** Security+, **462 of 462** A+ Core 1, **396 of 396** A+ Core 2.
Security+ question #321 is skipped because its answer options exist only as an image in the
PDF, so there is no option text to extract. The parser reports it rather than guessing.

`npm test` re-validates every bank: unique ids, answers that exist among the options, an
explanation for every distractor, no leftover extraction artifacts, and that each exam's
objectives are all populated.

### About the objective tags

Objectives are assigned by keyword scoring in `tools/taxonomies.py`, not taken from the source
PDF, which does not label them. Troubleshooting objectives are scored separately, because a
question belongs to them for describing a fault to diagnose rather than for the parts it
names — without that, "the laptop screen flickers" tags as Hardware and the troubleshooting
objective ends up nearly empty.

Treat the tags as a study filter, not an authoritative classification. Published exam weights
are shown only for Security+, where they are known; for A+ the app shows how many questions in
the bank fall under each objective instead of asserting a weight.

## Adding another exam

The app is built around a catalog, so a new exam is data plus two small entries:

1. **Add the objective taxonomy** to `TAXONOMIES` in `tools/taxonomies.py`, as
   `(objective name, [keywords])` pairs. If it has a troubleshooting objective, add that name
   to `TROUBLESHOOTING_DOMAINS` and give the exam a weight in `TROUBLE_WEIGHT`.
2. **Parse the PDF**: `npm run data -- <exam-id> <source.pdf> src/data/<exam-id>.json`.
3. **Add a catalog entry** to `EXAMS` in `src/lib/exams.ts` — id, code, family, name, icon,
   accent, the objective list, and a `load` that dynamically imports the new JSON. The dynamic
   import is what keeps it a separate lazily-loaded chunk.
4. **Add it to the test list** at the top of `tests/data.test.js`.

Nothing else needs touching: the exam picker, per-exam progress, badges, mastery meters,
domain drills and the review schedule are all derived from the catalog. Exams sharing a
`family` are grouped together in the picker, which is how A+ Core 1 and Core 2 appear under
one heading — Network+ would slot in the same way.

## Layout

```
src/
  lib/          scoring, Leitner scheduling, session building, storage, audio/haptics
  components/   icons, progress ring, bottom nav, sheet, shared question detail
  screens/      home, play, quiz engine, results, study, stats, settings
  data/         generated question banks, one JSON per exam
  lib/exams.ts  the exam catalog everything else is derived from
  state.tsx     progress store (localStorage-backed)
tools/          PDF → JSON parser and the per-exam objective taxonomies
tests/          node:test suites, no test framework needed
```

## A note on the content

The questions come from a third-party practice set, not from CompTIA. Objective tags are
assigned by keyword heuristics, so treat them as a study filter rather than an authoritative
classification, and doing well here does not guarantee passing the real exam.
