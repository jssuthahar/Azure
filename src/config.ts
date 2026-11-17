export const SITE = {
  url: 'https://azure.msdevbuild.com',
  name: 'MSDEVBUILD Azure',
  title: 'MSDEVBUILD Azure — Azure Certification Tutorials',
  description:
    'Free, beginner-friendly Azure certification tutorials, quizzes, mock exams and interview preparation. Start with AZ-900 Azure Fundamentals.',
  lang: 'en',
  blog: 'https://blog.msdevbuild.com',
  main: 'https://msdevbuild.com',
  author: 'Suthahar Jegatheesan',
  org: 'MSDEVBUILD',
  /** Same identity as blog.msdevbuild.com */
  authorTitle: 'Cloud, AI & Mobile Solutions Architect',
  authorLocation: 'Malaysia',
  authorImage: '/images/author.jpg',
  authorImageSmall: '/images/author-160.jpg',
  profile: 'https://suthahar.msdevbuild.com',
  /** Brand line. Shown everywhere as: MSDEVBUILD · Multi-Stack Dev Build (no author name; owner's decision, 13 Nov 2026) */
  orgFull: 'Multi-Stack Dev Build',
  tagline: 'Multi-Stack Dev Build',
  brandLine: 'MSDEVBUILD · Multi-Stack Dev Build',
} as const;

/** Social profiles (from blog.msdevbuild.com). Used in the footer, About page and schema sameAs. */
export const SOCIAL = [
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/jssuthahar', icon: 'in', color: '#0a66c2' },
  { name: 'YouTube', href: 'https://www.youtube.com/@MSDEVBUILD?sub_confirmation=1', icon: '▶', color: '#ff0000' },
  { name: 'X', href: 'https://x.com/jssuthahar', icon: '𝕏', color: '#000000' },
  { name: 'GitHub', href: 'https://github.com/jssuthahar', icon: 'GH', color: '#24292f' },
  { name: 'Instagram', href: 'https://www.instagram.com/msdevbuild/', icon: '◎', color: '#d62976' },
  { name: 'WhatsApp channel', href: 'https://whatsapp.com/channel/0029Va5j2rHEFeXcTlUhQB0J', icon: '✆', color: '#25d366' },
  { name: 'MSDEVBUILD on LinkedIn', href: 'https://www.linkedin.com/company/31318247/', icon: 'in', color: '#0a66c2' },
] as const;

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

/** Usage counts are only sent from the live site, never from localhost, previews or QA runs. */
export const COUNT_HOSTS = ['azure.msdevbuild.com'] as const;
