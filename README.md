# azure.msdevbuild.com: Azure certification learning platform

Free, W3Schools-style Azure certification tutorials in the MSDEVBUILD visual identity (same palette, type and components as [blog.msdevbuild.com](https://blog.msdevbuild.com)). The first certification is **AZ-900: Microsoft Azure Fundamentals**.

Static Astro 5 + Tailwind 4 site with no backend. Learner progress is stored in the browser.

## Run

```bash
npm install
npm run dev          # http://localhost:4321
npm run check:all    # meta lengths + question bank validation + production build
```

Pushing to `main` deploys to GitHub Pages through `.github/workflows/deploy.yml`. `public/CNAME` points to azure.msdevbuild.com.

## How it is organised

| What | Where |
| --- | --- |
| Certification registry (active and planned exams) | `src/data/certifications.ts` |
| Official syllabus, domains, weights, objectives, topic order | `src/data/az-900/syllabus.ts` |
| Tutorials (one MDX file per topic) | `src/content/tutorials/az-900/<module>/<topic>.mdx` |
| Question banks (JSON, separate from content) | `src/content/questions/az-900/*.json` |
| Collection schemas (enforced at build) | `src/content.config.ts` |
| Lesson template (page route) | `src/pages/az-900/[module]/[topic].astro` |
| Teaching components usable in MDX without imports | `src/components/mdx/` |
| Mock exam, interview prep, revision, progress | `src/pages/az-900/*.astro`, `src/pages/progress.astro` |
| Browser-only progress, XP, levels, streaks and badges | `src/lib/progress.ts` |
| Game content (Sort It sets, Who Am I? riddles) | `src/data/az-900/games.ts` |
| Animated lesson scenes (12 SVG scenes) and which lesson uses which | `src/components/scenes/`, `src/data/az-900/visuals.ts` |
| Problem → Solution cards per lesson | `src/data/az-900/problem-solution.ts` |
| Voice (browser text-to-speech, no server) | `src/lib/speech.ts`, `src/components/LessonTools.astro` |
| Beginner/Full view (groups lesson sections at build time) | `src/lib/rehype-sections.mjs` |
| Azure practice simulator: engine, mock portal, mock CLI, labs | `src/lib/sim/` (`engine.ts`, `portal.ts`, `cli.ts`, `labs.ts`) |
| Simulator UI and lab pages | `src/components/Simulator.astro`, `src/pages/az-900/labs/` |
| Games (Daily Challenge, Sort It, Match the Pairs, Lightning Round, Who Am I?) | `src/pages/az-900/games/` |

A topic is **published only when its MDX file exists**. Otherwise the syllabus shows it as "coming next" and never links to it, so there are no empty pages.

## Adding a topic

1. Create `src/content/tutorials/az-900/<module>/<slug>.mdx`. Use a slug already listed in `syllabus.ts`, and copy the frontmatter from an existing lesson.
2. Follow the lesson template headings: *Start with a question* (`<Story>`), *Explain it like I'm 10* (`<Eli10>`), *The technical explanation*, *Real-world business scenario* (`<Scenario>`), a visual (`<Compare>`, `<Flow>`, `<ResponsibilityGrid>`, `<DemandChart>`, `<SlaCalculator>`, `<CostChart>`), and *When to use it and when not to* (`<UseWhen>`). Put architect-level depth in `<DeepDive>`.
3. Interview questions, quick revision and references go in frontmatter. The layout renders them.
   Add the lesson's animated scene and caption to `visuals.ts`, and its Problem → Solution card to `problem-solution.ts`. Sections titled "Start with a question", "Explain it like I'm 10" and "Real-world business scenario" show in Beginner view; the rest show only in Full lesson.
4. Add `src/content/questions/az-900/<slug>.json` with `"topic": "<slug>"`. Those questions power the topic's knowledge check **and** the mock exam.
5. Run `npm run check:all`.

YAML tip: wrap any value containing `: ` in quotes.

## Adding a certification

Add an entry to `CERTIFICATIONS` (set `status: 'active'` only after verifying the exam on Microsoft Learn), create `src/data/<code>/syllabus.ts`, then add tutorials and question banks under `<code>/` folders. Copy the `src/pages/az-900/` routes for the new code.

## Content rules

- Source of truth is the official study guide. AZ-900 currently follows *skills measured as of July 20, 2026* (checked 11 Nov 2026). Update `SKILLS_MEASURED_AS_OF` and `SYLLABUS_VERIFIED_ON` after each re-check.
- Every practice question is original. Never use real, recalled or leaked exam content.
- Check facts against Microsoft Learn and list the sources under `references`.
- SEO: `seoTitle` ≤ 60 characters, `description` 120–160 characters (`npm run check:meta`).

## Status

- ✅ Homepage, AZ-900 landing page with the full official syllabus, module pages
- ✅ All 79 AZ-900 lessons: Domain 1 Cloud Concepts (24), Domain 2 Architecture & Services (38), Domain 3 Management & Governance (17), each with an animated scene, a Problem → Solution card, voice, a knowledge check, interview questions and quick revision
- ✅ Mock exam (domain-weighted, timer, navigator, mark-for-review, multi-select, results by domain, full review), with 340 original questions covering every official objective
- ✅ Interview prep with mock interview mode, revision flashcards and glossary, progress tracking and badges
- ✅ Play & Learn: five games plus XP, levels (Cloud Seed → Azure Legend), daily streaks, confetti and game badges. Answer options are shuffled at build time (seeded by question id) so the correct answer is not always first.
- ✅ SEO, AEO and GEO: per-page meta, canonical URLs, breadcrumbs, JSON-LD (TechArticle, Course, BreadcrumbList), sitemap, robots.txt, llms.txt
- ✅ Visual learning: an animated scene and a Problem → Solution card on every lesson, Beginner view (default) vs Full lesson, 🔊 Listen (Nimbus reads the lesson with highlighting), speak buttons and ▶ Play step diagrams
- ✅ Practice labs: a fully simulated Azure portal and Cloud Shell (no Azure account), 6 guided labs with auto-checked tasks, a free sandbox and a live cost meter
- ⏳ Optional next steps: real Azure portal screenshots, more simulator labs (networking, Azure Policy), and a second certification.

## Adding a practice lab

Add an entry to `LABS` in `src/lib/sim/labs.ts`. Each task has text, optional portal steps and CLI command (shown under "Show me how", with a ▶ Try it button), and a `check(sim)` function that inspects the simulated state or `sim.events`. Put lesson slugs in `topics` so those lessons show a "Try it yourself" box. New commands go in `src/lib/sim/cli.ts`; new resource types and rules in `engine.ts`; new portal screens in `portal.ts`.
