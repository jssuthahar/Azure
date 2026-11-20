# Monetization: status (updated 20 Nov 2026)

## DONE
- Client ID `ca-pub-3425499927549926`: loaded once from `<head>` (`src/components/monetization/AdsHead.astro`), plus the `google-adsense-account` meta tag for site verification.
- In-article unit `5752980891`, multiplex `8399772643`, leaderboard 970x90 `4562204994`, all wired in `src/lib/monetization/config.ts`.
- `ads.txt` at the site root (`public/ads.txt`).
- Ad engine `src/lib/monetization/ads.ts`: ad-free paths, supporters, offline, viewport and container width, 3-per-page cap, lazy loading (200px), reserved space (no layout shift), 150px guard, debug boxes with `?ads=debug`, focus mode that hides the mobile anchor ad.
- Placements: lessons (after the answer, mid-explanation when >600 words, multiplex after the quiz, sidebar ≥1200px), glossary, service and comparison pages (leaderboard, in-article, multiplex), course pages (in-article below exam domains, leaderboard above the footer), game results (multiplex).
- Supporter stub (`localStorage['msdb-supporter-v1'] = '1'`), "Supporter 💙" badge and "Go ad-free" card on My Progress, one-per-session "Prefer no ads?" line.
- Sponsor strip per track (course page + lesson footer), `/sponsor` page, affiliate cards (course pages + mock exam results), footer affiliate note.
- Buy Me a Coffee in the footer, About, My Progress and certificate pages.
- Privacy Policy section "Google AdSense and cookies" (`/privacy/#ads`), About "Advertising and sponsorship".
- `npm run qa -- ads` (part of `npm run verify`) checks every rule in Part 6 with debug boxes only.

## TODO (owner)
- [ ] AdSense dashboard: Auto ads ON (anchor), vignette OFF or low, URL exclusions = `adFreePaths`, and turn on the GDPR consent message in Privacy & messaging (EEA/UK/CH). Google serves it through the same script, so no code change.
- [ ] Sidebar unit: create a 300x600 or responsive vertical unit and replace `SLOT_ID_SIDEBAR` in `config.ts`. Until then it shows nothing to learners. The lesson's right column is about 224px wide, so a responsive vertical unit fits better than a fixed 300px one.
- [ ] Supporter checkout URL and price (`supporter.checkoutUrl`, `priceLabel`). The "Go ad-free" card stays hidden until both are real. Real supporter status needs a payment webhook writing `users/<uid>.isSupporter` (protected in `firestore.rules`); see `src/lib/monetization/supporter.ts`.
- [ ] Decide on the "Early access to new courses" perk: it conflicts with "everything free, nothing gated". Suggest replacing it with something like "Name on the supporters page".
- [ ] Sponsor details per track (`sponsors[track]`: name, logo, url, `enabled: true`).
- [ ] Affiliate links (`affiliates`): real titles and URLs. Placeholders stay hidden.
- [ ] `/sponsor` audience stats (`audience.monthlyLearners`, `countries`). Hidden until set. Confirm `sponsor@msdevbuild.com` receives mail.
- [ ] Review every `[EDIT]` paragraph on the Privacy Policy page and remove the markers.
- [ ] Mock exam: the spec lists `/mock-exam` as ad-free and also asks for a multiplex on the score page. Ad-free won, so there are no ads there (only Recommended resources). Remove `/mock-exam` from `adFreePaths` and add `<AdSlot unit="multiplex" reveal="#results" />` if you want the ad.

---

# Original spec

You are working on azure.msdevbuild.com — a free Azure certification learning site
(AZ-900, AI-901, AI-200, GH-300 and all Microsoft exam). It has:
- Lesson pages (5-step pattern: 30-second answer → simulation → explanation → exam tip → quiz)
- Simulations (3D scenes, simulated Azure portal, Cloud Shell, labs, "what happens if" scenarios)
- Timed mock exams, games (Daily Challenge, Sort It, Match the Pairs, Lightning Round, Who Am I?)
- Interview practice (Nimbus chat), flashcards
- Glossary, service reference, service comparison pages
- Progress, badges, certificate pages
- Optional Google sign-in and an installable PWA (offline mode)

GOAL
Add Google AdSense monetization plus placeholder slots for non-ad revenue WITHOUT
disturbing learning. Learning flow always wins over ad revenue. Do NOT change lesson
content, quiz logic, game logic, or simulation behaviour.

══════════════════════════════════════════
PART 1 — ADSENSE SETUP
══════════════════════════════════════════

1. Load the script ONCE in <head> of the base layout (never repeat it per ad,
   even though Google's snippets include it every time):
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3425499927549926" crossorigin="anonymous"></script>

2. Create /ads.txt at the site root with exactly:
google.com, pub-3425499927549926, DIRECT, f08c47fec0942fa0

3. Create /js/monetization-config.js:

const MONETIZATION = {
  adsEnabled: true,                       // global kill switch
  adClient: "ca-pub-3425499927549926",
  units: {
    inArticle: {                          // fluid in-article ad, between content blocks
      slot: "5752980891",
      attrs: { "data-ad-layout": "in-article", "data-ad-format": "fluid" },
      style: "display:block; text-align:center;",
      minHeight: { desktop: 280, mobile: 250 }
    },
    multiplex: {                          // grid-style ad (autorelaxed), end of page only
      slot: "8399772643",
      attrs: { "data-ad-format": "autorelaxed" },
      style: "display:block",
      minHeight: { desktop: 300, mobile: 300 }
    },
    leaderboard: {                        // fixed 970x90 banner, desktop ≥1024px only
      slot: "4562204994",
      attrs: {},
      style: "display:inline-block;width:970px;height:90px",
      minHeight: { desktop: 90, mobile: 0 },
      minViewport: 1024
    },
    sidebar: {                            // PLACEHOLDER — create 300x600 or responsive vertical unit
      slot: "SLOT_ID_SIDEBAR",
      attrs: { "data-ad-format": "auto", "data-full-width-responsive": "true" },
      style: "display:block",
      minHeight: { desktop: 600, mobile: 0 },
      minViewport: 1200
    }
  },
  adFreePaths: [
    "/simulations", "/labs", "/3d", "/portal", "/cloud-shell", "/what-if",
    "/mock-exam", "/interview", "/flashcards",
    "/progress", "/badges", "/certificate",
    "/signin", "/legal", "/privacy", "/terms"
  ],
  maxInContentAdsPerPage: 3,              // inArticle + multiplex + leaderboard (sidebar not counted)
  supporterAdFree: true,

  supporter: {
    enabled: true,
    checkoutUrl: "https://buymeacoffee.com/PLACEHOLDER",      // PLACEHOLDER
    priceLabel: "RM 15 / month",                               // PLACEHOLDER
    perks: ["Ad-free learning", "Supporter badge", "Early access to new courses"]
  },

  sponsors: {
    "az-900": { enabled: false, name: "SPONSOR NAME", logo: "/img/sponsor-placeholder.svg",
                url: "https://PLACEHOLDER", tagline: "AZ-900 track supported by SPONSOR NAME" },
    "ai-901": { enabled: false, name: "SPONSOR NAME", logo: "/img/sponsor-placeholder.svg",
                url: "https://PLACEHOLDER", tagline: "AI-901 track supported by SPONSOR NAME" },
    "ai-200": { enabled: false, name: "SPONSOR NAME", logo: "/img/sponsor-placeholder.svg",
                url: "https://PLACEHOLDER", tagline: "AI-200 track supported by SPONSOR NAME" },
    "gh-300": { enabled: false, name: "SPONSOR NAME", logo: "/img/sponsor-placeholder.svg",
                url: "https://PLACEHOLDER", tagline: "GH-300 track supported by SPONSOR NAME" }
  },

  affiliates: [
    { track: "az-900", title: "PLACEHOLDER Exam Guide Book", url: "https://PLACEHOLDER",
      note: "Good for revision before exam day", type: "book" },
    { track: "az-900", title: "PLACEHOLDER Practice Course", url: "https://PLACEHOLDER",
      note: "Extra practice tests", type: "course" }
  ],

  sponsorContactEmail: "sponsor@msdevbuild.com"                // PLACEHOLDER
};

══════════════════════════════════════════
PART 2 — AD RENDERING
══════════════════════════════════════════

Build renderAd(unitKey, containerEl), which outputs:
  <div class="ad-wrap" data-unit="{unitKey}">
    <span class="ad-label">Advertisement</span>
    <ins class="adsbygoogle" style="{style}"
         data-ad-client="ca-pub-3425499927549926"
         data-ad-slot="{slot}" {attrs}></ins>
  </div>
then calls (window.adsbygoogle = window.adsbygoogle || []).push({}); exactly once.

Do NOT render if any of these is true:
- adsEnabled is false
- the current path matches adFreePaths
- the user is a supporter
- the page has reached maxInContentAdsPerPage
- navigator.onLine is false (PWA offline)
- the unit has a minViewport and window.innerWidth is below it
  (check again on resize and route change; remove the ad if the viewport shrinks below it)

Other rules:
- Never push to an <ins> that is already filled (check data-adsbygoogle-status).
- Lazy-load with IntersectionObserver (rootMargin 200px); never load ads before the
  page's main content.
- Reserve each unit's minHeight up front so the content doesn't jump (CLS).
- Keep every ad at least 150px from buttons, quiz options, game controls, and
  simulation canvases.
- Ads must look clearly different from site content: no card styling that matches
  certification cards or lesson buttons, and no arrows or "click here" text nearby.
- SPA routing: request new ads ONLY on a real route change, and clean up old ad
  containers when leaving a route. NEVER refresh ads on a timer.
- Debug mode: if the URL has ?ads=debug OR a slot starts with "SLOT_ID_",
  render a grey dashed box labelled with the unit name and size instead of the real
  ad. In production, a "SLOT_ID_" unit renders nothing.

Styling:
.ad-wrap { margin: 32px 0; }
.ad-label { display:block; font-size:12px; color: var(--muted); margin-bottom:6px; }
.ad-wrap[data-unit="multiplex"] { margin-top: 48px; border-top: 1px solid var(--border); padding-top: 16px; }
.ad-wrap[data-unit="leaderboard"] { text-align:center; margin: 24px auto; overflow:hidden; }
.ad-wrap[data-unit="sidebar"] { position: sticky; top: 88px; width: 300px; margin: 0; }
(Set min-height for each wrapper from the unit's minHeight config.)

══════════════════════════════════════════
PART 3 — AD PLACEMENTS
══════════════════════════════════════════

LESSON PAGES
  1. After the "30-second answer" block, before the simulation    → inArticle
  2. Inside the explanation, only if it's longer than ~600 words → inArticle
  3. After the quiz is submitted: show "Lesson complete ✓" + "Next lesson" first,
     then a 48px gap and a divider, then                           → multiplex
     (render only after quiz completion, never on page load; never place it directly
     beside the Next lesson button or our own related-lesson cards)
  4. Desktop ≥1200px: sticky right column beside the lesson text  → sidebar
  ✗ No leaderboard on lesson pages (it would push the 30-second answer down).

GLOSSARY / SERVICE REFERENCE / COMPARISON PAGES (highest-earning pages)
  1. Below the page title, above the first section (desktop only) → leaderboard
  2. Between sections, every ~3 sections                          → inArticle
  3. End of page, before the footer                               → multiplex
  (still max 3 in-content ads total; on mobile the leaderboard is skipped, so an
   extra inArticle may take its place)

CERTIFICATION LANDING PAGES
  1. Below the exam domain breakdown (never above "Start free")   → inArticle
  2. Just above the footer (desktop only)                         → leaderboard

GAME RESULTS SCREEN / MOCK EXAM SCORE PAGE (NOT during play or the exam)
  - Below the score summary and action buttons                   → multiplex

MOBILE
  - Bottom anchor ad through Auto ads only.
  - While a simulation, quiz, or game is active, add class "focus-mode" to <body> and
    hide the anchor ad with CSS.

Leave a comment in the base layout noting the AdSense dashboard settings: Auto ads ON,
vignette ads OFF (or low frequency), URL exclusions = adFreePaths.

══════════════════════════════════════════
PART 4 — OTHER WAYS TO EARN (PLACEHOLDERS)
══════════════════════════════════════════

A. SUPPORTER / AD-FREE
   - Add an isSupporter field for signed-in users (read from the user profile; use a
     localStorage stub for now, with a TODO for real verification via a payment webhook).
   - isSupporter === true → no ads anywhere + a "Supporter 💙" badge on My Progress.
   - "Go ad-free & support free learning" card on the My Progress page.
   - One small line under the post-quiz multiplex ad:
     "Prefer no ads? Support the site →" (at most once per session; no pop-ups,
     no nagging).

B. SPONSOR SLOT PER TRACK
   - When sponsors[track].enabled is true, show a small "Sponsor · Supported by
     [logo] [name]" strip under the certification landing page title and in the
     lesson footer for that track.
   - Links use rel="sponsored noopener".
   - Create a /sponsor page ("Sponsor a learning track") with:
     Monthly learners: [X] // PLACEHOLDER, Countries: [X] // PLACEHOLDER,
     167 lessons, 778 practice questions, 4 certification tracks,
     and a contact button using sponsorContactEmail.

C. AFFILIATE RECOMMENDATIONS
   - "Recommended resources" cards ONLY on certification landing pages and the
     mock exam results page. Never inside lessons.
   - Each card shows a visible "Affiliate link" tag and uses rel="sponsored noopener".
   - Footer note: "Some links are affiliate links. They help keep this site free."

D. BUY ME A COFFEE (existing)
   - Keep it. Show it in the footer, on My Progress, and on the certificate page:
     "Enjoyed learning? Buy me a coffee ☕"

══════════════════════════════════════════
PART 5 — PRIVACY & COMPLIANCE
══════════════════════════════════════════
- Add a consent banner for EEA/UK visitors using AdSense "Privacy & messaging" or a
  Google-certified CMP.
- Add a "Google AdSense & cookies" section to the Privacy Policy page; mark text
  [EDIT] for me to review.
- Add an "Advertising & sponsorship" note to the About or legal page.

══════════════════════════════════════════
PART 6 — TESTING & DELIVERY
══════════════════════════════════════════
- Verify with ?ads=debug:
  • no ads on any adFreePaths page
  • at most 3 in-content ads per page
  • leaderboard appears only at ≥1024px and never on lesson pages
  • sidebar appears only at ≥1200px, sticky, and doesn't overlap content
  • multiplex appears only at the end of the page / after quiz completion
  • no horizontal scroll at any width (check 375, 768, 1024, 1280, 1440px)
  • no layout shift when ads load
  • mobile 375px: lesson → quiz → next lesson flow is unchanged
  • supporters see zero ads
  • offline PWA shows no empty ad boxes
- Never click live ads during testing.
- Output: a list of every file changed, plus MONETIZATION_TODO.md with:
  DONE → client ID, in-article (5752980891), multiplex (8399772643),
         leaderboard 970x90 (4562204994), ads.txt
  TODO → sidebar unit (300x600 or responsive vertical), supporter checkout URL &
         price, sponsor details, affiliate links, /sponsor audience stats,
         privacy policy [EDIT] text