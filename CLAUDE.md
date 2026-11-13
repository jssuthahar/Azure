# azure.msdevbuild.com

Free Azure certification learning site (AZ-900 live, AI-900 next) by **MSDEVBUILD · Multi-Stack Dev Build · by Suthahar Jegatheesan**. Astro 5 + MDX + Tailwind 4, static, GitHub Pages.

**Before any change, use the `msdevbuild-azure` skill** (`.claude/skills/msdevbuild-azure/`). It holds the house rules for content, voice, SEO/AEO/GEO, style, phones/iPad/PWA, accessibility and adding exams.

Always:
- Lesson flow: 30-second answer → Simulations (3D View | Azure Portal | Practice Lab) → Explanation → Exam tip → Quiz → Previous/Next. Learners never leave the lesson mid-way.
- Every new or rewritten lesson (any exam) follows `.claude/skills/msdevbuild-azure/references/lesson-pattern.md`; use the `lesson-agent` (`.claude/agents/lesson-agent.md`) for lesson work.
- Brand line on every surface via `SITE.brandLine` / `<BrandLine />`; never retype it.
- Writing must read as human-written (`npm run check:human`); exam questions stay formal.
- Original practice questions only, never real exam content. Simulators are labelled education-only.
- INR default currency (user can change); no sign-in; progress and certificate stay in the browser.
- No hard-coded `az-900` in shared code: use `src/data/exams.ts`.
- Don't run `npm run indexnow`, commit or push unless asked.

Done means `npm run verify` passes (checks + build + SEO/AEO/GEO audit + browser QA for lessons, phone/iPad layout, accessibility and the installable app).
