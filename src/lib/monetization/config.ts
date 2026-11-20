/**
 * Monetization settings: Google AdSense units plus the non-ad ways to support the site.
 * Spec and status: .claude/skills/msdevbuild-azure/MONETIZATION_TODO.md
 *
 * Rule of thumb: learning flow always wins over ad revenue. Ads never sit inside a quiz,
 * game, simulation or exam, and nothing here gates learning. Every lesson, lab and mock
 * exam stays free.
 *
 * Any value that still contains PLACEHOLDER (or a slot that starts with SLOT_ID_) never
 * reaches learners. Open a page with ?ads=debug to preview it as a grey dashed box.
 */
import { SUPPORT } from '../../config';

export type UnitKey = 'inArticle' | 'multiplex' | 'leaderboard' | 'sidebar';

export interface AdUnit {
  slot: string;
  attrs: Record<string, string>;
  style: string;
  minHeight: { desktop: number; mobile: number };
  /** Render only at this window width or wider. */
  minViewport?: number;
  /** Size shown on the debug box. */
  size: string;
}

export const LIVE_HOST = 'azure.msdevbuild.com';

export const MONETIZATION = {
  adsEnabled: true, // global kill switch
  adClient: 'ca-pub-3425499927549926',
  units: {
    inArticle: {
      // fluid in-article ad, between content blocks
      slot: '5752980891',
      attrs: { 'data-ad-layout': 'in-article', 'data-ad-format': 'fluid' },
      style: 'display:block; text-align:center;',
      minHeight: { desktop: 280, mobile: 250 },
      size: 'fluid in-article',
    },
    multiplex: {
      // grid-style ad (autorelaxed), end of page only
      slot: '8399772643',
      attrs: { 'data-ad-format': 'autorelaxed' },
      style: 'display:block',
      minHeight: { desktop: 300, mobile: 300 },
      size: 'multiplex grid',
    },
    leaderboard: {
      // fixed 970x90 banner, desktop ≥1024px only (and only where 970px actually fits)
      slot: '4562204994',
      attrs: {},
      style: 'display:inline-block;width:970px;height:90px',
      minHeight: { desktop: 90, mobile: 0 },
      minViewport: 1024,
      size: '970 × 90',
    },
    sidebar: {
      // TODO: create a 300x600 or responsive vertical unit in AdSense and paste its slot id here.
      slot: 'SLOT_ID_SIDEBAR',
      attrs: { 'data-ad-format': 'auto', 'data-full-width-responsive': 'true' },
      style: 'display:block',
      minHeight: { desktop: 600, mobile: 0 },
      minViewport: 1200,
      size: '300 × 600 (responsive vertical)',
    },
  } satisfies Record<UnitKey, AdUnit>,

  /**
   * No ads at all on these paths: not even Auto ads, because the AdSense script isn't loaded.
   * Matched against whole path segments, so "labs" covers /az-900/labs/ and /az-900/labs/<lab>/
   * but a lesson slug such as app-service never matches "app". The first group is the owner's list; the second maps
   * it onto this site's real routes. Also set these as URL exclusions in the AdSense dashboard.
   */
  adFreePaths: [
    '/simulations', '/labs', '/3d', '/portal', '/cloud-shell', '/what-if',
    '/mock-exam', '/interview', '/flashcards',
    '/progress', '/badges', '/certificate',
    '/signin', '/legal', '/privacy', '/terms',
    // this site's routes
    '/simulator', '/3d-explorer', '/embed', '/practice', '/offline', '/voice-studio', '/app', '/sponsor', '/__',
  ],
  maxInContentAdsPerPage: 3, // inArticle + multiplex + leaderboard (sidebar not counted)
  supporterAdFree: true,

  supporter: {
    enabled: true,
    checkoutUrl: 'https://buymeacoffee.com/PLACEHOLDER', // PLACEHOLDER: membership checkout
    priceLabel: 'RM 15 / month', // PLACEHOLDER
    perks: ['Ad-free learning', 'Supporter badge', 'Early access to new courses'],
  },

  /** Keyed by exam slug (see src/data/exams.ts). A strip shows only when enabled is true. */
  sponsors: {
    'az-900': { enabled: false, name: 'SPONSOR NAME', logo: '/images/sponsor-placeholder.svg', url: 'https://PLACEHOLDER', tagline: 'AZ-900 track supported by SPONSOR NAME' },
    'ai-901': { enabled: false, name: 'SPONSOR NAME', logo: '/images/sponsor-placeholder.svg', url: 'https://PLACEHOLDER', tagline: 'AI-901 track supported by SPONSOR NAME' },
    'ai-200': { enabled: false, name: 'SPONSOR NAME', logo: '/images/sponsor-placeholder.svg', url: 'https://PLACEHOLDER', tagline: 'AI-200 track supported by SPONSOR NAME' },
    'gh-300': { enabled: false, name: 'SPONSOR NAME', logo: '/images/sponsor-placeholder.svg', url: 'https://PLACEHOLDER', tagline: 'GH-300 track supported by SPONSOR NAME' },
  } as Record<string, Sponsor>,

  /** Shown only on course details pages and mock exam results. Never inside lessons. */
  affiliates: [
    { track: 'az-900', title: 'PLACEHOLDER Exam Guide Book', url: 'https://PLACEHOLDER', note: 'Good for revision before exam day', type: 'book' },
    { track: 'az-900', title: 'PLACEHOLDER Practice Course', url: 'https://PLACEHOLDER', note: 'Extra practice tests', type: 'course' },
  ] as Affiliate[],

  /** /sponsor page audience numbers. null = not published yet (shown as [X] in ?ads=debug). */
  audience: { monthlyLearners: null as string | null, countries: null as string | null }, // PLACEHOLDER

  sponsorContactEmail: 'sponsor@msdevbuild.com', // PLACEHOLDER: confirm this mailbox exists
};

export interface Sponsor { enabled: boolean; name: string; logo: string; url: string; tagline: string }
export interface Affiliate { track: string; title: string; url: string; note: string; type: 'book' | 'course' | string }

/** True while a value is still the owner's placeholder. Placeholders never show to learners. */
export const isPlaceholder = (v: string | null | undefined) => !v || /PLACEHOLDER|SLOT_ID_/.test(v);

/** Where "support the site" links go: the supporter checkout once it exists, Buy Me a Coffee until then. */
export const supportUrl = () => (isPlaceholder(MONETIZATION.supporter.checkoutUrl) ? SUPPORT.url : MONETIZATION.supporter.checkoutUrl);

/** Does this path get no ads at all? */
export function isAdFreePath(pathname: string): boolean {
  const segs = pathname.split('/').filter(Boolean).map((s) => s.toLowerCase());
  return MONETIZATION.adFreePaths.some((p) => {
    const want = p.replace(/^\//, '').toLowerCase();
    return segs.includes(want);
  });
}

export const activeSponsor = (track: string): Sponsor | null => {
  const s = MONETIZATION.sponsors[track];
  return s?.enabled && !isPlaceholder(s.url) ? s : null;
};
