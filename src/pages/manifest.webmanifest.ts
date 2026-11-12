import type { APIRoute } from 'astro';
import { SITE } from '../config';
import { getExam } from '../data/exams';

/** Web app manifest: makes the site installable on Android, iPhone/iPad, Windows, macOS and ChromeOS. */
export const GET: APIRoute = () => {
  const exam = getExam();
  const icon = (src: string, size: number, purpose: 'any' | 'maskable') => ({ src, sizes: `${size}x${size}`, type: 'image/png', purpose });
  const manifest = {
    id: '/',
    name: `${SITE.name}: ${exam.code} course, simulators and mock exams`,
    short_name: 'MSDEVBUILD',
    description: `${SITE.description} ${SITE.brandLine}.`,
    lang: SITE.lang,
    dir: 'ltr',
    start_url: '/?source=app',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'any',
    background_color: '#ffffff',
    theme_color: '#0078d4',
    categories: ['education', 'productivity'],
    prefer_related_applications: false,
    icons: [
      icon('/icons/icon-192.png', 192, 'any'),
      icon('/icons/icon-512.png', 512, 'any'),
      icon('/icons/maskable-192.png', 192, 'maskable'),
      icon('/icons/maskable-512.png', 512, 'maskable'),
    ],
    shortcuts: [
      { name: `${exam.code} course`, short_name: 'Course', url: `/${exam.slug}/?source=app-shortcut`, description: 'All lessons in exam order' },
      { name: 'Mock exam', short_name: 'Mock exam', url: `/${exam.slug}/mock-exam/?source=app-shortcut`, description: 'Timed, exam-style practice test' },
      { name: 'Azure Simulator', short_name: 'Simulator', url: '/simulator/?source=app-shortcut', description: '“What happens if…?” in 3D' },
      { name: 'Daily Challenge', short_name: 'Daily', url: `/${exam.slug}/games/daily/?source=app-shortcut`, description: '5 questions a day, keep your streak' },
      { name: 'My progress', short_name: 'Progress', url: '/progress/?source=app-shortcut', description: 'XP, streak and lessons done' },
    ].map((s) => ({ ...s, icons: [icon('/icons/icon-192.png', 192, 'any')] })),
    screenshots: [
      { src: '/screenshots/wide-home.webp', sizes: '1280x800', type: 'image/webp', form_factor: 'wide', label: 'Course home on a laptop or iPad' },
      { src: '/screenshots/wide-lesson.webp', sizes: '1280x800', type: 'image/webp', form_factor: 'wide', label: 'A lesson with its 3D simulation' },
      { src: '/screenshots/narrow-lesson.webp', sizes: '780x1688', type: 'image/webp', form_factor: 'narrow', label: 'A lesson on a phone' },
      { src: '/screenshots/narrow-exam.webp', sizes: '780x1688', type: 'image/webp', form_factor: 'narrow', label: 'The mock exam on a phone' },
    ],
  };
  return new Response(JSON.stringify(manifest, null, 2), { headers: { 'Content-Type': 'application/manifest+json' } });
};
