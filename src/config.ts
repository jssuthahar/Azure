import { BRAND, SOCIAL as SHARED_SOCIAL } from '@msdevbuild/config';

export const SITE = {
  url: 'https://azure.msdevbuild.com',
  name: 'MSDEVBUILD Azure',
  title: 'MSDEVBUILD Azure — Azure Certification Tutorials',
  description:
    'Free, beginner-friendly Azure certification tutorials, quizzes, mock exams and interview preparation. Start with AZ-900 Azure Fundamentals.',
  lang: 'en',
  blog: BRAND.blog,
  main: BRAND.main,
  author: BRAND.author,
  org: BRAND.org,
  /** Identity comes from @msdevbuild/config (msdevbuild-config repo), shared with blog.msdevbuild.com */
  authorTitle: BRAND.authorTitle,
  authorLocation: BRAND.authorLocation,
  authorImage: '/images/author.jpg',
  authorImageSmall: '/images/author-160.jpg',
  profile: BRAND.profile,
  /** Brand line. Shown everywhere as: MSDEVBUILD · Multi-Stack Dev Build (no author name; owner's decision, 13 Nov 2026) */
  orgFull: BRAND.orgFull,
  tagline: BRAND.orgFull,
  brandLine: BRAND.brandLine,
} as const;

/**
 * Google Analytics 4 (owner's decision, 20 Nov 2026). Paste the Measurement ID (G-XXXXXXXXXX) from
 * analytics.google.com > Admin > Data streams. Empty = off. Loaded by AnalyticsHead.astro, live site only.
 */
export const ANALYTICS = {
  measurementId: 'G-WE1YPG1387',
} as const;

/** Buy Me a Coffee: the only way to support the site. Shown by <SupportCoffee /> (footer, About, certificate). Never mid-lesson. */
export const SUPPORT = {
  url: BRAND.support.url,
  label: BRAND.support.label,
} as const;

/** Social profiles, shared across MSDEVBUILD sites (msdevbuild-config). Used in the footer, About page and schema sameAs. */
export const SOCIAL = SHARED_SOCIAL;

export const NAV = [
  { label: 'Azure Tutorials', href: '/#certifications' },
  { label: 'AZ-900', href: '/az-900/' },
  { label: 'Mock Exams', href: '/az-900/mock-exam/' },
  { label: 'Interview Questions', href: '/az-900/interview/' },
  { label: 'My Progress', href: '/progress/' },
  { label: 'About', href: '/about/' },
] as const;

/**
 * Firebase web config (project msdevbuild-azure). These values are public by design:
 * access is controlled by firestore.rules, not by keeping this secret.
 * Used for optional Google sign-in (progress sync) and anonymous usage counts.
 */
export const FIREBASE = {
  apiKey: 'AIzaSyAUkdCvWJ-1_IaIe_PHa7xqqy3ZBDtGd4Q',
  authDomain: 'msdevbuild-azure.firebaseapp.com',
  projectId: 'msdevbuild-azure',
  storageBucket: 'msdevbuild-azure.firebasestorage.app',
  messagingSenderId: '716410365766',
  appId: '1:716410365766:web:2bef18ffc01314eb51a747',
} as const;

/**
 * Sign-in options shown in the sign-in dialog. Turn one on only after its provider is
 * enabled in Firebase Authentication (Microsoft: Azure app registration; LinkedIn: OIDC
 * provider, needs Identity Platform). Off = shown as "Coming soon".
 */
export const AUTH_PROVIDERS = { google: true, microsoft: false, linkedin: false } as const;
export type AuthProviderId = keyof typeof AUTH_PROVIDERS;

/**
 * On the live site, sign-in runs on our own domain (self-hosted helper in public/__/auth,
 * refreshed by `npm run auth-helper`), so Google says "continue to azure.msdevbuild.com".
 * Everywhere else (localhost, previews) it uses the default firebaseapp.com handler.
 * Needs https://azure.msdevbuild.com/__/auth/handler as an authorized redirect URI on the
 * OAuth web client in Google Cloud.
 */
export const AUTH_HOST = 'azure.msdevbuild.com';

/** Usage counts are only sent from the live site, never from localhost, previews or QA runs. */
export const COUNT_HOSTS = ['azure.msdevbuild.com'] as const;

/**
 * Course discussion with Giscus (comments in GitHub Discussions, no database of ours).
 * Shown only on course details pages (/<exam>/#discussion), one discussion per exam.
 * Setup: enable Discussions on the repo, install https://github.com/apps/giscus on it,
 * then copy repoId and categoryId from https://giscus.app (pick the category below).
 * Set up 18 Nov 2026. The section stays hidden if either id is emptied.
 */
export const GISCUS = {
  repo: 'jssuthahar/Azure',
  repoId: 'R_kgDOVqlSfQ',
  category: 'General',
  categoryId: 'DIC_kwDOVqlSfc4DLYKM',
} as const;
