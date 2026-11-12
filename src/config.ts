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
  /** Brand promise. Shown everywhere as: MSDEVBUILD · Multi-Stack Dev Build · by Suthahar Jegatheesan */
  orgFull: 'Multi-Stack Dev Build',
  tagline: 'Multi-Stack Dev Build · by Suthahar Jegatheesan',
  brandLine: 'MSDEVBUILD · Multi-Stack Dev Build · by Suthahar Jegatheesan',
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
