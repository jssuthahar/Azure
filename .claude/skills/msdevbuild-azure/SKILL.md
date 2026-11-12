---
name: msdevbuild-azure
description: House rules for azure.msdevbuild.com (MSDEVBUILD Azure certification site). Use for ANY change in this repo - writing or editing lessons, questions, comparisons, services, simulations, pages, components, styles, SEO/AEO/GEO, the installable app, or adding a new exam such as AI-900. Covers product decisions, lesson flow, brand line, human-sounding writing, SEO/AEO/GEO, visual style, phone/iPad/PWA support, accessibility and the verification commands that must pass before work is done.
---

# MSDEVBUILD Azure: how we build

Astro 5 static site (MDX content collections, Tailwind 4), deployed to GitHub Pages at https://azure.msdevbuild.com.
Owner and author: **Suthahar Jegatheesan**. Brand: **MSDEVBUILD · Multi-Stack Dev Build · by Suthahar Jegatheesan**.
Promise to learners: *feel Azure without an Azure account*, then pass the exam and the interview.

Read the reference file for the area you are touching before you start:

| Working on | Read |
| --- | --- |
| A lesson, quiz questions, comparisons, services, what-ifs | [references/content.md](references/content.md) |
| Any wording a learner or search engine will see | [references/voice.md](references/voice.md) |
| Titles, descriptions, schema, llms.txt, sitemap, share images | [references/seo-aeo-geo.md](references/seo-aeo-geo.md) |
| Components, CSS, layout, phone/iPad, installable app, accessibility | [references/style-and-ux.md](references/style-and-ux.md) |
| Adding or changing an exam (AI-900 next) | [references/new-exam.md](references/new-exam.md) |

## Non-negotiables

**Product decisions (made by the owner; do not change without asking)**
- Free, no account. Progress, XP, streak, certificate, currency and lab state live **in the browser only** (localStorage). Sign-in sync comes later.
- Currency defaults to **INR** and the learner can change it (every picker stays in sync).
- The certificate is an MSDEVBUILD **practice** certificate, shareable by link, stored in the browser. Never imply it is a Microsoft credential.
- **Only original practice questions.** Never real, recalled or leaked Microsoft exam questions, even if asked. Say so on exam pages.
- The Azure portal simulator and labs are **for education only** and say so; never claim affiliation with Microsoft.
- Do not run `npm run indexnow` (it pings search engines) and do not commit or push unless the owner asks.

**Every lesson** (enforced by `npm run qa -- lessons`)
- Fixed flow: **30-second answer → Simulations → Explanation → Exam tip → Quiz → Previous / Next**.
- One **Simulations** section with tabs **3D View | Azure Portal | Practice Lab**. Every lesson has all three.
- The learner never leaves the lesson mid-way: no same-tab links between the answer and the quiz (except `#` anchors, new-tab references).
- Body sections, in order: `## Start with a question` (Story) → `## Explain it like I'm 10` (Eli10) → `## The technical explanation` → `## Real-world business scenario` → `## When to use it and when not to`. These exact headings drive Beginner view.

**Brand line everywhere**
- Wording is always `MSDEVBUILD · Multi-Stack Dev Build · by Suthahar Jegatheesan`. Never retype it: use `SITE.brandLine`, `SITE.tagline`, `SITE.orgFull` from `src/config.ts`, or the `<BrandLine />` component (`variant="byline" | "inline" | "light"`).
- Articles (lessons, comparisons, service pages) show `<BrandLine variant="byline" />` under the title.
- It already lives in the header, footer, home hero, share images, certificate, embeds, manifest, llms files and schema. New surfaces get it too.

**Writing sounds like a person** (enforced by `npm run check:human`)
- No stock AI phrasing, few em dashes, contractions in lesson prose, concrete examples. Details in [references/voice.md](references/voice.md).
- Exam questions stay formal, like Microsoft's.

**Works on every screen**
- Phones from 320px, iPad mini to iPad Pro, portrait and landscape: no horizontal scroll, tap targets ≥ 36px, header fits with the Install icon and XP chip showing.
- The site is an installable app (PWA). Don't break the manifest, service worker, offline page or install flow.

**Multi-exam engine**
- Never hard-code `az-900`, `AZ-900` or AZ-900 data in shared code. Get the exam from `src/data/exams.ts`: `getExam(Astro.params.cert)` on exam pages, `examFromPath(Astro.url.pathname)` in shared components, `getExam()` on site-wide pages.

## Workflow

1. Read the relevant reference file(s) above and look at a neighbouring example (an existing lesson, page or component) before writing.
2. Make the change in the existing patterns: tokens and utility classes, shared components, data in `src/data/<exam>/`.
3. Verify. Work is **not done** until these pass:

```bash
npm run check:all      # meta lengths, question rules, humanizer, full build
npm run qa:seo         # SEO / AEO / GEO audit of dist/ (no browser)
npm run qa             # browser checks on the build: lessons, layout, a11y, pwa (needs Google Chrome)
# or all at once:
npm run verify
```

`npm run qa -- lessons` (or `layout`, `a11y`, `pwa`) runs one check. Screenshots for a visual check go to the OS temp folder `msdb-qa-shots/`; look at phone and iPad sizes for anything visual you changed.

4. Report what changed and what was verified, plainly. If a check fails, say so and fix it; do not weaken a check to make it pass.

## Repo map

```
src/config.ts                  SITE (name, url, author, brandLine, tagline…), SOCIAL, NAV
src/data/exams.ts              exam registry: getExam, liveExams, examFromPath, examStaticPaths
src/data/types.ts              SyllabusModule, ObjectiveGroup, ExamFacts
src/data/az-900/               syllabus, lesson-sims, portal-tours, sims3d, compare, services, whatifs,
                               exam-items, games, visuals, problem-solution, embeds
src/content/tutorials/<exam>/<module>/<topic>.mdx    lessons (URL = path)
src/content/questions/<exam>/*.json                  original practice questions
src/pages/[cert]/              every exam page (course, module, lesson, compare, services, labs,
                               games, mock-exam, revision, interview, glossary)
src/pages/                     site-wide: home, simulator, progress, certificate, app, offline, embed,
                               sitemap, llms.txt, llms-full.txt, manifest.webmanifest, sw.js, og/
src/components/                Header, Footer, Sidebar, BrandLine, AppInstall, LessonSimulations, mdx/*
src/lib/                       learn, exam (mock exam engine), progress, certificate, currency, pwa, og, sim/*
src/sw/sw.js                   service worker source (stamped with a build version by pages/sw.js.ts)
scripts/                       check-meta, check-questions, check-human, contractions, make-og, make-icons
scripts/qa/                    seo-audit.py, run.mjs, lessons, layout, a11y, pwa
```
