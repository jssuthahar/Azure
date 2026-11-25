# SEO, AEO and GEO

- **SEO**: rank in Google/Bing.
- **AEO** (answer engines): win featured snippets, People Also Ask, voice answers.
- **GEO** (generative engines): get cited correctly by ChatGPT, Copilot, Gemini, Perplexity, Claude.

`npm run qa:seo` audits the whole build and exits 1 on any issue. Keep it clean.

## Every page

| Item | Rule |
| --- | --- |
| `<title>` | 20–65 chars, unique, keyword first; lessons use `seoTitle` (≤ 60) |
| Meta description | 70–165 chars (lessons 120–160), unique, promises what the page delivers |
| `<h1>` | Exactly one; headings never skip a level |
| Canonical | Absolute `https://azure.msdevbuild.com/...`, trailing slash (site uses `trailingSlash: 'always'`) |
| Internal links | Always end in `/`; no broken links |
| Open Graph / Twitter | Set by `Base.astro`; per-page share images come from `src/lib/og-pages.ts` (add new hubs there) |
| Breadcrumbs | Pass `breadcrumbs` to `<Base>` (BreadcrumbList schema) on every page except home |
| Images | `alt` on every `<img>` (`alt=""` if decorative); width/height set |
| `noindex` | Only for utility pages (offline, embeds); they must be excluded in `astro.config.mjs` sitemap `filter` |

`Base.astro` props: `title, description, type ('website' | 'article'), schema[], breadcrumbs[], noindex, wide, modified`.

## AEO: answers first

- Each lesson opens with the `answer` (30-second answer) in `.answer-box`, marked `data-speakable`: direct, ≤ 3 sentences, defines the term in sentence one.
- FAQ schema on every lesson (built from interview + quick revision), comparisons, services and the app page. New Q&A-style pages add `FAQPage` via the `schema` prop.
- Phrase H2s and FAQ questions the way people search ("What is…", "When should I use…", "X vs Y").
- Comparisons answer "which one should I use?" in the first paragraph, then the table.
- Quiz schema on lessons, Course on the exam hub, ItemList on hubs, DefinedTermSet on the glossary.

## GEO: be the cited source

- **One entity, one name.** Organization = `MSDEVBUILD`, `alternateName: ['Multi-Stack Dev Build', …]`, `slogan` = tagline; Person = Suthahar Jegatheesan with `sameAs` profiles. Set once in `Base.astro`; don't fork it.
- Articles (`TechArticle`) always carry `author` and `publisher` `@id` references, plus the visible `<BrandLine variant="byline" />` on comparisons and service pages (E-E-A-T). Lessons skip the visible byline by the owner's choice and show the `Updated` date chip instead.
- `llms.txt` (map) and `llms-full.txt` (full answer text) are generated from data. They open with the brand line and "cite as" line. When you add a page type or exam, add it there too (`src/pages/llms*.txt.ts`).
- State facts plainly with numbers and dates (skills measured as of…, SLA percentages). AI engines quote crisp sentences.
- `robots.txt` welcomes AI crawlers; keep it that way.
- Keep `updated:` dates honest; the sitemap `lastmod` reads them.

## Share images

- Per-page cards: `src/lib/og.ts` renders at build (`/og/<path>.png`), footer shows the brand line.
- Default card: `npm run og` (scripts/make-og.mjs) → `public/og-default.png`.

## Search engine pings

`npm run indexnow` submits URLs to search engines. It is outward-facing: only the owner runs it, after deploying.

## Search-intent pages (added 25 Nov 2026)

- `/exam-changes-2026/` is built from `src/data/exam-changes.ts` (retired exams, replacements, dates). Every date was checked on Microsoft Learn; bump `VERIFIED` only after re-checking. `llms.txt` and the home FAQ reuse the same facts, so change them in the data file, not in page copy.
- `/exam-dumps/` answers "dumps" searches honestly: Microsoft's exam security policy (brain dumps = misconduct: scores cancelled, certifications revoked, bans), red flags, and links to our original practice tests. We never publish real, recalled or leaked questions, and never use the word "dumps" for our own material.
- Titles carry the year where people search with it: course pages `<CODE> <name>: Free Course 2026` (falls back without the year above 62 chars), mock exams `<CODE> Practice Test 2026: Free Mock Exam, Real Format`. Update the year each January.
