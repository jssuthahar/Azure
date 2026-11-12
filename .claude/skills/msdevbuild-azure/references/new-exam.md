# Adding an exam (AI-900 next)

The engine is exam-aware: shared pages and components read everything from the registry in `src/data/exams.ts`. Adding an exam means adding data and content, not new pages.

Design reference (approved by the owner): https://claude.ai/artifact/DSB44hzwHVYzAYks8sBTib

## Steps

1. **Check the official outline on Microsoft Learn** (skills measured date, domains and weights, passing score, duration). Use the Microsoft Learn MCP tools; record the date you checked.
2. **Certification entry**: in `src/data/certifications.ts` set the exam's `status` to `'active'` (only when its content is ready).
3. **Data folder** `src/data/<exam>/` with the same files as `az-900/`:
   `syllabus.ts` (MODULES with `domain`, `weight`, `weightMid`, groups/objectives/topics; EXAM_FACTS; SKILLS_MEASURED_AS_OF; SYLLABUS_VERIFIED_ON; STUDY_GUIDE_URL), `lesson-sims.ts`, `portal-tours.ts` / `sims3d.ts` additions, `compare.ts`, `whatifs.ts`, `exam-items.ts`, `games.ts`, `visuals.ts`, `problem-solution.ts`. Services stay shared in `az-900/services.ts` unless the exam needs its own.
4. **Register it** in `EXAMS` in `src/data/exams.ts` (slug, code, name, accent colour, courseUrl, and every data field).
5. **Content**: lessons in `src/content/tutorials/<exam>/<module>/<topic>.mdx` and **original** questions in `src/content/questions/<exam>/` with `cert: '<exam>'` and the right `domain` (1..n). Follow [content.md](content.md) and [voice.md](voice.md).
6. **Site-wide surfaces** that still assume one exam must list all live exams: home page, sitemap page, llms.txt / llms-full.txt, progress page, header Learn menu, manifest shortcuts, `/app/` save list, offline page groups, OG hub cards in `og-pages.ts`.
7. **Certificate**: give each exam its own ID prefix and storage key (today it is `MSDB-AZ900-…` in `src/lib/certificate.ts`, one shared key). Keep existing AZ-900 certificates valid.
8. **Verify**: `npm run verify`. The lessons check reads every exam folder automatically; extend `scripts/qa/layout.mjs` and `a11y.mjs` page lists with the new exam's hub, a lesson and its mock exam.

## Rules while doing it

- No visible change for existing AZ-900 learners unless intended: same URLs, same storage keys, same certificate validity.
- Never hard-code an exam slug, code or data import in shared code. Use `getExam(Astro.params.cert)`, `examFromPath(pathname)`, `liveExams()`.
- `getStaticPaths` can't see page-level variables; loop `liveExams()` inside it.
- The mock exam builds papers from the exam's own `examItems` and module `weightMid` values; check the domain mix of a full paper matches the official weights.
