/**
 * Personal study plan: exam date + minutes a day → a day-by-day schedule.
 * Stored per exam in this browser. The schedule is rebuilt from today each time
 * it is shown, so finished lessons drop out and a missed day just moves the
 * work forward. Reminders are an .ics calendar file the learner imports.
 */
import { today } from './progress';

const KEY = 'msdb-azure-plan-v1';

export interface PlanSettings {
  examDate: string;
  minutes: number;
  weekends: boolean;
  /** Reminder time, HH:MM local. */
  time: string;
  created: string;
  /** Ticked non-lesson items, keyed `<date>|<kind>`. */
  checked: Record<string, true>;
}

export interface PlanLesson { key: string; title: string; url: string; minutes: number; domain: number }

export type ItemKind = 'lesson' | 'practice' | 'mock' | 'revise' | 'examday' | 'exam';
export interface PlanItem { kind: ItemKind; title: string; url: string; minutes: number; key?: string }
export interface PlanDay { date: string; items: PlanItem[]; review: boolean }

export interface Schedule {
  days: PlanDay[];
  lessonsLeft: number;
  studyDays: number;
  /** Minutes a day the lessons actually need to finish before review days begin. */
  neededMinutes: number;
  /** Last day with a lesson on it. */
  lessonsEnd: string | null;
  daysToExam: number;
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = (s: string) => new Date(`${s}T00:00:00`);
export const addDays = (s: string, n: number) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
export const daysBetween = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 86_400_000);

export function loadPlan(cert: string): PlanSettings | null {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '{}');
    return all[cert] ?? null;
  } catch {
    return null;
  }
}

export function savePlan(cert: string, plan: PlanSettings | null) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (plan) all[cert] = plan; else delete all[cert];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage blocked: the plan shows but won't be remembered */
  }
  window.dispatchEvent(new CustomEvent('plan-change'));
}

/** Time a lesson takes with its simulations and quiz, not just the reading. */
const lessonCost = (l: PlanLesson) => l.minutes + 10;

export function buildSchedule(plan: PlanSettings, lessons: PlanLesson[], done: Set<string>, base: string, from = today()): Schedule {
  const daysToExam = daysBetween(from, plan.examDate);
  const left = lessons.filter((l) => !done.has(l.key));
  const empty: Schedule = { days: [], lessonsLeft: left.length, studyDays: 0, neededMinutes: 0, lessonsEnd: null, daysToExam };
  if (daysToExam < 0) return empty;

  const study: string[] = [];
  for (let d = from; d < plan.examDate; d = addDays(d, 1)) {
    const wd = parse(d).getDay();
    if (plan.weekends || (wd !== 0 && wd !== 6)) study.push(d);
  }
  const url = (p: string) => `${base}${p}/`;
  const practice = (minutes: number): PlanItem => ({ kind: 'practice', title: 'Smart practice: reviews due today', url: url('practice'), minutes });

  // Keep the last fifth of the study days (1 to 5 days) for mocks and revision.
  const reviewCount = study.length < 2 ? 0 : Math.min(5, Math.max(1, Math.round(study.length * 0.2)));
  const lessonDays = study.slice(0, study.length - reviewCount);
  const reviewDays = study.slice(study.length - reviewCount);

  const total = left.reduce((s, l) => s + lessonCost(l), 0);
  const slots = lessonDays.length || study.length;
  const target = slots ? Math.max(plan.minutes, Math.ceil(total / slots)) : total;
  const days: PlanDay[] = [];
  let i = 0;
  for (const d of lessonDays.length ? lessonDays : study) {
    const items: PlanItem[] = [];
    let used = 0;
    while (i < left.length && (items.length === 0 || used + lessonCost(left[i]) <= target)) {
      const l = left[i++];
      items.push({ kind: 'lesson', title: l.title, url: l.url, minutes: lessonCost(l), key: l.key });
      used += lessonCost(l);
    }
    if (plan.minutes - used >= 10) items.push(practice(Math.min(15, plan.minutes - used)));
    days.push({ date: d, items, review: false });
  }
  const lessonsEnd = [...days].reverse().find((d) => d.items.some((x) => x.kind === 'lesson'))?.date ?? null;

  reviewDays.forEach((d, n) => {
    const last = n === reviewDays.length - 1;
    const items: PlanItem[] = last
      ? [
          { kind: 'revise', title: 'Cheat sheet: the last 30 minutes', url: url('cheat-sheet'), minutes: 30 },
          { kind: 'examday', title: 'Exam-day checklist', url: url('exam-day'), minutes: 10 },
        ]
      : n % 2 === 0
        ? [{ kind: 'mock', title: 'Full mock exam (45 minutes), then read every explanation', url: url('mock-exam'), minutes: 60 }]
        : [practice(Math.max(20, Math.min(40, plan.minutes))), { kind: 'revise', title: 'Cheat sheet for your weakest area', url: url('cheat-sheet'), minutes: 15 }];
    days.push({ date: d, items, review: true });
  });
  days.push({ date: plan.examDate, items: [{ kind: 'exam', title: 'Exam day. You have got this.', url: url('exam-day'), minutes: 0 }], review: true });

  return { days, lessonsLeft: left.length, studyDays: study.length, neededMinutes: target, lessonsEnd, daysToExam };
}

/* ---------------- calendar reminders (.ics) ---------------- */
const icsDate = (d: string) => d.replace(/-/g, '');
const icsEsc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** A calendar file with a repeating study reminder and the exam itself. */
export function planIcs(plan: PlanSettings, code: string, planUrl: string, examDayUrl: string): string {
  const [hh, mm] = (plan.time || '19:00').split(':');
  const start = `${icsDate(today())}T${hh}${mm}00`;
  const endMin = Number(hh) * 60 + Number(mm) + plan.minutes;
  const end = `${icsDate(today())}T${String(Math.floor(endMin / 60) % 24).padStart(2, '0')}${String(endMin % 60).padStart(2, '0')}00`;
  const until = `${icsDate(addDays(plan.examDate, -1))}T235959`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const uid = (s: string) => `${s}-${icsDate(plan.created)}@azure.msdevbuild.com`;
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MSDEVBUILD//Azure study plan//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', `UID:${uid(`${code}-study`)}`, `DTSTAMP:${stamp}`, `DTSTART:${start}`, `DTEND:${end}`,
    `RRULE:FREQ=DAILY;UNTIL=${until}${plan.weekends ? '' : ';BYDAY=MO,TU,WE,TH,FR'}`,
    `SUMMARY:${icsEsc(`${code} study: ${plan.minutes} minutes`)}`,
    `DESCRIPTION:${icsEsc(`Open today's plan: ${planUrl}`)}`, `URL:${planUrl}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEsc(`${code} study time`)}`, 'TRIGGER:-PT10M', 'END:VALARM',
    'END:VEVENT',
    'BEGIN:VEVENT', `UID:${uid(`${code}-exam`)}`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${icsDate(plan.examDate)}`, `DTEND;VALUE=DATE:${icsDate(addDays(plan.examDate, 1))}`,
    `SUMMARY:${icsEsc(`${code} exam day`)}`, `DESCRIPTION:${icsEsc(`Checklist: ${examDayUrl}`)}`, `URL:${examDayUrl}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEsc(`${code} exam tomorrow: run the system test and check your ID`)}`, 'TRIGGER:-PT15H', 'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n') + '\r\n';
}
