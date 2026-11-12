# Content: lessons, questions and data

## Lesson file

`src/content/tutorials/<exam>/<module>/<topic>.mdx`. The path is the URL (`/<exam>/<module>/<topic>/`).
The module and topic slugs must exist in `src/data/<exam>/syllabus.ts` (topic `slug`, `objectives`, `beyondExam`).

### Frontmatter (schema in `src/content.config.ts`; lengths checked by `npm run check:meta`)

| Field | Rule |
| --- | --- |
| `title` | Plain topic name, e.g. `CapEx vs OpEx` |
| `seoTitle` | ≤ 60 chars, ends with the exam: `CapEx vs OpEx in Cloud Computing Explained \| AZ-900` |
| `description` | 120–160 chars, says what the learner gets |
| `answer` | The 30-second answer: 2–3 sentences, **bold** the key terms, answers the question directly in the first sentence (this is the featured-snippet / AI-answer text) |
| `updated` | ISO date of the last real edit |
| `readingMinutes` | Honest estimate |
| `keyTerms` | `term` + one-line `definition` (feeds the glossary) |
| `interview` | ≥ 3 items, levels `beginner`, `intermediate`, `experienced`, `scenario`, `architecture`; spoken-style answers |
| `revision` | `keyPoints` ≥ 3, `mistakes` ≥ 1, `examTips` ≥ 1, `quick` exactly 5 Q&A; quote items containing `:` or starting with `"` |
| `references` | ≥ 1, official Microsoft Learn first |
| `related` | Sibling topic slugs |

Use `>-` block scalars for long text so apostrophes are safe.

### Body, in this order (exact `##` headings drive Beginner view)

```mdx
## Start with a question
<Story question="A real-life question a non-techie would ask">…everyday analogy, then name the concept…</Story>

## Explain it like I'm 10
<Eli10>…kid-level analogy, 3–6 short lines…</Eli10>

## The technical explanation
…accurate detail, tables, <Compare>, <Flow>, <ResponsibilityGrid>, <CostChart>, <DemandChart>, <SlaCalculator>…
<Callout type="exam">How the exam disguises this concept.</Callout>
<DeepDive title="…">Architect-level nuance (shown in Full lesson).</DeepDive>

## Real-world business scenario
<Scenario …>A named company, a problem, the Azure answer, the outcome.</Scenario>

## When to use it and when not to
<UseWhen use={['…']} avoid={['…']} />
```

Optional `## Visual: …` sections are allowed. Components are available without imports: Eli10, Callout (`tip | exam | warning | note`), Story, Scenario, UseWhen, DeepDive, Figure, Compare, Flow, ResponsibilityGrid, DemandChart, SlaCalculator, CostChart, TryIt, Datacenter3D, PortalTour; markdown tables are wrapped automatically.

Do not put same-tab links to other pages inside the lesson body: the learner must stay on the page. Use the `related` field, the comparison/service links the layout adds, or `target="_blank"` for external references.

### Simulations (all three are required per lesson)

| Tab | Where it's wired |
| --- | --- |
| 3D View | `src/data/<exam>/lesson-sims.ts` → `d3: { mode, start, intro }`; modes and steps in `sims3d.ts` (`datacenter, zones, regions, redundancy, scale, network, governance, identity`) |
| Azure Portal | `lesson-sims.ts` → `tour: { id, intro }`; tours in `portal-tours.ts` (simulated new Azure portal, education only) |
| Practice Lab | `src/lib/sim/labs.ts` → add the lesson slug to a lab's `topics` |

New concept that no 3D mode or tour fits? Add a step to the closest mode or a new tour rather than skipping a tab. Simulations explain with real behaviour (fail a zone, scale out, apply a policy), not decoration.

### Interactive activities (learn by doing)

Lessons get hands-on activities between the explanation sections, so the learner predicts, experiments and gets feedback instead of only reading. Pilot: `what-is-cloud-computing` (all 8 types). Roll out a few lessons at a time; don't add every type to every lesson.

- Data: `src/data/<exam>/activities.ts` → `{ [topicSlug]: { master: 'Cloud Computing Master', activities: [...] } }`. Types and default XP: `src/data/activities.ts`.
- Placement: `<Activity id="…" />` in the MDX, right after the idea it practises. A predict goes after the Story; a check after Eli10; a traffic simulator in a `## Simulate it: …` section (counts as a Beginner-view visual section).
- Types: `predict` (guess before the reveal), `quiz` (`style: 'check'` for 1–2 quick questions, `'scenario'` for business problems), `sort` (drag and drop, tap/keyboard alternative), `traffic` (on-premises vs cloud autoscale, illustrative numbers), `explore` (clickable architecture, one exam-style question per part), `match` (scenario → idea cards), `challenge` (30-second timer, can be switched off), `mission` (write a plan, compare with a model answer).
- Every option has a `why`. Feedback explains, never just "Correct". Exam-style questions stay formal and original.
- XP and badges go through `saveActivity` in `src/lib/progress.ts` (browser only). Finishing every activity in a lesson marks it mastered (+50 XP, Lesson Master badge).
- The `LessonActivities` strip near the top lists the lesson's activities with progress; it appears automatically when a lesson has activities.

## Practice questions

`src/content/questions/<exam>/<topic>.json` (`npm run check:questions` validates):

```json
{ "cert": "az-900", "domain": 1, "topic": "capex-vs-opex",
  "questions": [{ "id": "t-capex-1", "type": "single", "question": "…", "options": [{ "text": "…", "why": "why this is right/wrong" }], "answer": [0], "explanation": "…" }] }
```

- **Original questions only**, written from the official skills outline. Never real, recalled or leaked exam content.
- Every option has a `why`. Distractors are plausible, not silly. Formal exam register (no contractions needed).
- A file with `topic` feeds that lesson's quiz and the mock exam; without `topic` it's mock-exam only.
- Other mock-exam item types (Yes/No series, drag-and-drop match, build-list order, drop-down) live in `src/data/<exam>/exam-items.ts`.

## Other data (per exam, `src/data/<exam>/`)

| File | Feeds |
| --- | --- |
| `compare.ts` | `/<exam>/compare/<slug>/` pages: `answer`, table rows, `lessons` |
| `whatifs.ts` | `/simulator/<slug>/` "What happens if…?" scenarios |
| `services.ts` | `/<exam>/services/<slug>/` 60-second service cards (shared across exams) |
| `games.ts` | Sort It sets and Who Am I riddles |
| `visuals.ts`, `problem-solution.ts` | Lesson hero visual and problem → solution card |

## Facts

Check Azure facts against Microsoft Learn (the Microsoft Learn MCP tools are available) before writing them, especially SKUs, SLAs, prices and service names (e.g. Microsoft Entra ID, not Azure AD). Prices are shown via the currency system, never hard-coded in one currency.
