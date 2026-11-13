# The lesson pattern (use it for every lesson, every exam)

Every lesson on the site is built the same way. Use this checklist for a new lesson, a rewrite, or a lesson in a new exam (AI-900 and later). Field-level rules are in [content.md](content.md) and wording rules are in [voice.md](voice.md).

## Page flow (fixed, checked by `npm run qa -- lessons`)

```
30-second answer  →  Simulations [ 3D View | Azure Portal | Practice Lab ]  →  Explanation  →  Exam tip  →  Quiz  →  Previous / Next
```

The learner stays on the page from the answer to the quiz. Don't add same-tab links that leave the page. `<TryIt>` switches simulation tabs on the same page.

## The three simulation tabs (all three, every lesson)

| Tab | What it must do | Wire it in |
| --- | --- | --- |
| **3D View** | Show how the concept works with something the learner can act on: fail a zone, scale out, apply a policy, send blocked traffic. It should behave like the real thing, not just look nice. | `src/data/<exam>/lesson-sims.ts` → `d3: { mode, start, intro }`. Modes and their numbered steps live in `sims3d.ts` (`datacenter, zones, regions, redundancy, scale, network, governance, identity`). `start` is the step index to open on. |
| **Azure Portal** | A guided walk through the **new** Azure portal (search bar, Copilot, create-wizard tabs, resource blades) doing the task the lesson teaches. Real field names and order, simplified screens, labelled education-only. | `lesson-sims.ts` → `tour: { id, intro }`. Tours live in `portal-tours.ts` (`TOURS`), built with the helpers there (`find`, `wizard`, `done`, `resOf`, `proj`, `review`). |
| **Practice Lab** | Hands-on tasks in the simulated portal that the browser checks. | `src/lib/sim/labs.ts` → add the lesson slug to a lab's `topics`. If no lab fits, the free sandbox is used. Add a new lab when the lesson teaches something you do in the portal. |

If no 3D mode or tour fits a new concept, add a step to the closest mode or write a new tour. Don't skip a tab. `intro` lines are one short, human sentence that tells the learner what to try ("Fail one zone.", "Try both actions.").

For a new exam, create `src/data/<exam>/lesson-sims.ts`, `portal-tours.ts` and `sims3d.ts` by following the az-900 files. AI-900 may need new 3D modes (for example a model training or inference flow). Add them to `Mode3D` and don't hard-code `az-900` in shared code.

## Lesson body, in order (exact headings)

1. `## Start with a question` → `<Story>`
2. `## Explain it like I'm 10` → `<Eli10>`
3. `## The technical explanation` → detail, tables, visual components, `<Callout type="exam">`, `<DeepDive>`
4. `## Real-world business scenario` → `<Scenario>`
5. `## When to use it and when not to` → `<UseWhen>`

Optional: `## Visual: …`, `## Simulate it: …`, and `<Activity id>` placed right after the idea it practises (see "Interactive activities" in content.md, roll out a few lessons at a time).

## Files a complete lesson touches

- [ ] `src/content/tutorials/<exam>/<module>/<topic>.mdx`: frontmatter (`answer` = 30-second answer, `revision`, `interview`, `keyTerms`, `references`, `related`) and the body above
- [ ] topic exists in `src/data/<exam>/syllabus.ts`
- [ ] `src/data/<exam>/lesson-sims.ts`: `d3` + `tour` entry
- [ ] `portal-tours.ts`: tour exists (new one if needed)
- [ ] `sims3d.ts`: mode/step exists (new step if needed)
- [ ] `src/lib/sim/labs.ts`: slug in a lab's `topics` (or a new lab)
- [ ] `src/content/questions/<exam>/<topic>.json`: original quiz questions, every option has a `why`
- [ ] facts checked on Microsoft Learn (current names, such as Microsoft Entra ID)
- [ ] No byline on lessons (owner's decision); the layout adds the `Updated <date>` chip from `updated:`, so keep that date honest

## Done

`npm run verify` passes. Then look at the lesson at phone and iPad width (`msdb-qa-shots/`) and click through all three tabs.
