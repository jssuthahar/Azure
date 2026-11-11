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
} as const;

export const NAV = [
  { label: 'Azure Tutorials', href: '/#certifications' },
  { label: 'AZ-900', href: '/az-900/' },
  { label: 'Mock Exams', href: '/az-900/mock-exam/' },
  { label: 'Interview Questions', href: '/az-900/interview/' },
  { label: 'My Progress', href: '/progress/' },
  { label: 'About', href: '/about/' },
] as const;
