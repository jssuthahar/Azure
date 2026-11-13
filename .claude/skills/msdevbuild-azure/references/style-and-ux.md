# Style, UX, devices and accessibility

The look is W3Schools-friendly (clear bands, big buttons, grouped menus) in the MSDEVBUILD blog palette, with Azure blue as the accent.

## Tokens (src/styles/global.css)

Use CSS variables, never raw hex for themeable colours. Dark mode is `[data-theme='dark']` on `<html>` (set before paint in `Base.astro`); every token has a dark value.

| Token | Light | Use |
| --- | --- | --- |
| `--bg`, `--text`, `--text-muted` | `#fff`, `#0b1020`, `#4a5163` | page, body text, secondary text |
| `--accent`, `--accent-deep`, `--accent-soft` | `#0078d4`, `#005a9e`, `#deecf9` | links, primary actions |
| `--card`, `--card-line`, `--border` | | cards and lines |
| `--pastel-blue/yellow/green/lilac/grey` | | soft section bands, callouts |
| `--navy-band`, `--topbar` | `#1b2a3d` | dark hero bands, top menu |
| `--ok`, `--bad` | `#107c10`, `#c50f1f` | right / wrong |

Fixed brand colours that may be literal: Azure blue `#0078d4`, highlight yellow `#ffd75e`.

## Classes and components to reuse

- Buttons: `.btn` + `.btn-accent | .btn-primary | .btn-outline | .btn-sm`; large CTAs `.big-btn`, `.big-btn-light`.
- Surfaces: `.card`, `.chip`, `.chip-muted`, `.eyebrow`, `.answer-box`, bands `.band-blue | -yellow | -green | -lilac | -navy`, progress `.bar > span`.
- Layout: `Base.astro` (every page), `GameLayout`, `EmbedLayout` (iframes, noindex), `LearnShell` (lesson sidebar + content + TOC).
- Shared: `Header` (grouped menus), `Footer`, `Sidebar`, `BrandLine`, `Mascot` (Nimbus: `happy | thinking | cheer`), `ShareButtons`, `CurrencySelect`, `AppInstall`.
- Font: Inter variable. Icons: inline SVG with `aria-hidden="true"`, or emoji in `aria-hidden` spans.

Prefer Tailwind utilities in markup; put shared or stateful styles in `global.css` (`@layer components`) or the component's `<style>`.

## Navigation principles

- Grouped top menu: Learn · Simulate & Practice · Exam & Certificate · Reference · Play · My Progress. Add items to an existing group; don't add a new top-level entry casually.
- Lesson sidebar: collapsible domains, progress per domain, filter, expand/collapse all, desktop rail mode.
- Keep learners in place: simulations, labs and quizzes run inside the page.
- **Slide mode** (owner's request, 13 Nov 2026): every lesson can be read full screen, one part per screen, with Next / Previous, ← → keys, swipe and Escape to exit. Button in `LessonTools.astro`, engine `src/lib/present.ts`, check `npm run qa -- present`. It hides parts in place, so quizzes and simulations keep working. Each `## ` section is one slide; when you add a new part to the lesson template, give it a hint if it shouldn't be its own slide: `data-slide-group="intro|finish"`, `data-slide-join`, `data-slide-with-prev` or `data-slide-skip`.

## Phones and iPads (checked by `npm run qa -- layout`)

- Test sizes: 320/360/393 px phones, iPhone landscape, iPad mini 744, iPad Air 820/1180, iPad Pro 1032/1376.
- No horizontal page scroll, nothing past the right edge. Wide tables go in a scroll wrapper (markdown tables do this automatically).
- Tap targets ≥ 36px. Inputs ≥ 16px font on phones (prevents iOS zoom).
- Header on small phones: the wordmark yields to the photo logo when the XP chip shows; Install shows as an icon. Any new header item must pass the 320px check.
- Respect safe areas: `env(safe-area-inset-*)` is applied to body sides, header top and footer bottom; fixed bottom UI adds `env(safe-area-inset-bottom)`.
- Hover must never be the only way to reach something (iPad has no hover).

## Installable app (PWA)

| Piece | File |
| --- | --- |
| Manifest (name, icons, shortcuts, screenshots) | `src/pages/manifest.webmanifest.ts` |
| Service worker: pages network-first → saved copy → `/offline/`; `/_astro/` cache-first; images stale-while-revalidate | `src/sw/sw.js` (version stamped each build by `src/pages/sw.js.ts`) |
| Install button, iPhone/iPad steps sheet, banner, offline notice, iOS Back button | `src/components/AppInstall.astro`, `src/lib/pwa.ts` |
| Install + "Save the whole course" page | `src/pages/app.astro` |
| Icons | `npm run icons` (from `public/images/author.jpg`) |

Rules: don't cache cross-origin or `/og/` images; never cache redirected responses; new page types that should work offline go in the `/app/` save list. iOS home-screen apps have separate storage from Safari; keep saying so in the app FAQ. Run `npm run qa -- pwa` after any change here.

## Accessibility (checked by `npm run qa -- a11y`, WCAG 2.1 AA)

- Contrast ≥ 4.5:1 in light **and** dark. Don't dim text with opacity; dim icons or backgrounds instead.
- Every button has a name; icon-only buttons get `aria-label`. Dialogs use `<dialog>` with a labelled title and a close button.
- Keyboard: visible focus, Escape closes menus and dialogs, nothing traps focus.
- Respect `prefers-reduced-motion`. Live updates use `aria-live`.
- 3D scenes have text steps and buttons, so nothing depends on the canvas alone.
