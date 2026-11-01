# RoundZero

**A practical placement-preparation workspace for the work before the offer.**

RoundZero brings structured CS learning, interview question practice, timed screening tests and application tracking into one calm, local-first workspace. The content is written as short, original explanations and prompts; external sources are linked for deeper reading.

## What is included

- **Learning paths:** 50 guided lessons across DSA, Operating Systems, Computer Networks, DBMS & SQL, OOP, System Design, and Aptitude & Reasoning. Each lesson includes a plain-language explanation, a concrete example, an interview framing, common mistakes, quick checks and further reading.
- **Coding drills:** 20 recognisable LeetCode problems across hash maps, windows, binary search, stacks, linked lists, graphs, heaps and DP. Track what you have solved locally; code execution stays on the linked platform.
- **Question bank:** 45 curated prompts covering technical fundamentals, DSA, system design, behavioural questions and project deep-dives. Search and filter by subject and level, reveal answer frameworks, and save questions for revision.
- **Assessment lab:** a 20-question mixed screening test with a 24-minute timer, question navigation, scoring, per-answer explanations and attempt history.
- **Interview room:** technical, system design, project and behavioural practice rounds with follow-up prompts, answer guidance and personal practice notes.
- **Hiring tracker:** track companies from resume shortlist through online assessment, technical rounds, design/manager discussion and HR/offer.
- **Study plan & revision desk:** a daily checklist, saved lessons/questions, personal notes and assessment history.
- **Resource shelf:** links to primary documentation, free textbooks, structured learning roadmaps and assessment practice platforms.

## Run locally

Requirements: Node.js 20 or newer. The project has **no third-party runtime or development dependencies**.

```bash
# From the project root (the folder containing package.json)
npm run dev
```

Open <http://localhost:4173>.

Build and preview the static output:

```bash
npm run build
npm run preview
```

Publish this directory as a new **private** GitHub repository (requires GitHub CLI authentication):

```bash
gh auth login
gh repo create Anvith-Kanchan/roundzero-placement-prep --private --source=. --remote=origin --push
```

Run the checks:

```bash
npm test
npm run check
```

## Data and privacy

This version is local-first. Learning progress, saved questions, personal notes, application tracker entries and assessment history are stored in the browser's `localStorage` under `roundzero:v1`. No account, external API, analytics service or server-side database is required. Data does not sync between browsers or devices. Clearing browser storage will clear this local workspace, so export/backup is not yet provided.

The assessment and interview modules are practice tools, not official company tests or a predictor of hiring outcomes. Hiring stages differ by employer and role; use the tracker as a flexible checklist rather than a claim about any one company's process.

## Project structure

```text
roundzero/
├── .github/workflows/ci.yml   # Node 22 test/build workflow
├── public/mark.svg            # Custom brand mark
├── scripts/
│   ├── build.mjs              # Dependency-free static build
│   └── check.mjs              # Structural project checks
├── src/
│   ├── content.js             # Tracks, original lessons, prompts and tests
│   ├── main.js                # UI, navigation and interactions
│   ├── styles.css             # Responsive visual system
│   └── lib/
│       ├── core.js             # Search, progress, storage and scoring helpers
│       ├── core.test.js        # State and helper tests
│       ├── content.test.js     # Curriculum/source integrity tests
│       └── server.test.js      # HTTP source/build integration tests
├── index.html
├── server.mjs
└── package.json
```

## Quality checks

The repository includes 19 automated tests covering curriculum integrity, external links, question and coding-drill structure, state persistence, malformed storage, progress calculations, search/filter behaviour, quiz scoring, timer formatting, output escaping, and source/build HTTP responses. `npm run check` verifies the static entry point, application module, styles, core state helpers, curriculum and brand asset. CI runs these checks and the static build on Node 22.

## Content approach and acknowledgements

The curriculum is independently written and uses the following public sources as references and further reading. It does not copy paid lessons or reproduce third-party question sets wholesale. See [CONTENT_SOURCES.md](./CONTENT_SOURCES.md) for a subject-by-subject source map.

## Roadmap ideas

- Optional account-backed sync and database persistence.
- Export/import for progress, notes and applications.
- More topic checks and adaptive assessments.
- Company-specific public hiring-process notes with dates and citations.
- Accessibility audit and browser automation in CI.
