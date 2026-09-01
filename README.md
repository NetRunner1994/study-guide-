# SecPlus Arcade — CompTIA Security+ SY0-701

A mobile-first React study guide and quiz game built from a 611-question SY0-701 practice
set. Every question carries the correct answer, a full explanation, and a note on why each
other option is wrong — so a wrong answer teaches you something instead of just costing points.

It installs to a phone home screen, runs offline, and keeps all progress on the device.

## Features

**Study guide**
- All 610 parsed questions, searchable across prompts, options and explanations
- Filter by exam objective, or by flagged / missed / due / unseen
- The five performance-based simulations (hotspot and drag-and-drop) shown as matching cards
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

**Scoring and progression**
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

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle in dist/
npm run preview    # serve the built bundle
npm test           # 15 data-integrity and scoring tests
```

The question bank is a lazily-loaded chunk (~200 KB gzipped), so the shell paints before it
arrives.

## Regenerating the question bank

`src/data/questions.json` is generated from the source PDF, which is not committed. To rebuild it:

```bash
pip install pypdf
npm run data -- "CompTIA Security+ SY0-701 Exam Practice Questions.pdf" src/data/questions.json
```

`tools/parse_pdf.py` rejoins the PDF's hard line-wraps, splits each item into stem, options,
correct answer, explanation and per-distractor notes, handles both the single-answer and
"choose two" formats, converts the five performance-based items into matching pairs, and tags
every question with an exam objective by keyword scoring.

Of the 611 questions in the source, **610 parse**. Question #321 is skipped because its answer
options exist only as an image in the PDF, so there is no option text to extract. The parser
reports it rather than guessing at the content.

`npm test` re-validates the output: unique ids, answers that exist among the options, an
explanation for every distractor, and no leftover extraction artifacts.

## Layout

```
src/
  lib/          scoring, Leitner scheduling, session building, storage, audio/haptics
  components/   icons, progress ring, bottom nav, sheet, shared question detail
  screens/      home, play, quiz engine, results, study, stats, settings
  data/         generated questions.json
  state.tsx     progress store (localStorage-backed)
tools/          PDF → JSON parser
tests/          node:test suites, no test framework needed
```

## A note on the content

The questions come from a third-party practice set, not from CompTIA. Objective tags are
assigned by keyword heuristics, so treat them as a study filter rather than an authoritative
classification, and doing well here does not guarantee passing the real exam.
