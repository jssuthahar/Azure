/**
 * The ten learning features every course offers, shared by the course details
 * page, the home page and the learning dashboard. Links are built per exam so
 * a new exam gets the same set without copying anything.
 */
export interface CourseFeature {
  id: string;
  icon: string;
  title: string;
  text: string;
  href: (slug: string) => string;
  cta: string;
}

export const COURSE_FEATURES: CourseFeature[] = [
  { id: 'lessons', icon: '📘', title: 'Step-by-step lessons', text: 'Each lesson opens with a 30-second answer, then a story, a plain explanation, a business scenario and when not to use it. Beginner view hides the deep parts until you want them.', href: (s) => `/${s}/learn/`, cta: 'Open the lessons' },
  { id: 'practice', icon: '🧠', title: 'Topic-wise practice questions', text: 'Original exam-style questions grouped by topic and domain. Smart practice brings back the ones you miss until they stick, and gives you a readiness score.', href: (s) => `/${s}/practice/`, cta: 'Start practising' },
  { id: 'quiz', icon: '✅', title: 'Interactive quizzes', text: 'A short quiz closes every lesson. You see why each option is right or wrong straight away, and a good score marks the lesson complete.', href: (s) => `/${s}/learn/`, cta: 'Try a lesson quiz' },
  { id: 'labs', icon: '🧪', title: 'Hands-on practice labs', text: 'Guided tasks you complete by clicking and typing, with each step ticked off as you go. Create VMs, storage and web apps and watch the cost meter move.', href: (s) => `/${s}/labs/`, cta: 'Open the labs' },
  { id: 'portal', icon: '🖥️', title: 'Azure portal simulation', text: 'Walk through a simulated Azure portal screen by screen. You learn where things live before you ever sign in to the real one. For education only.', href: (s) => `/${s}/labs/sandbox/`, cta: 'Open the sandbox' },
  { id: 'shell', icon: '⌨️', title: 'Cloud Shell simulation', text: 'Type real Azure CLI commands in a practice Cloud Shell. Chain them with &&, break things on purpose and read the same errors you would see at work.', href: (s) => `/${s}/labs/sandbox/`, cta: 'Type your first command' },
  { id: '3d', icon: '🧊', title: '3D cloud and datacenter explorer', text: 'Walk through a datacenter, fail an availability zone, move data between regions and watch identity checks happen, all in 3D with text steps beside it.', href: (s) => `/${s}/3d-explorer/`, cta: 'Explore in 3D' },
  { id: 'mock', icon: '⏱️', title: 'Mock examinations', text: 'A timed exam room weighted like the real exam, with mark-for-review, a review grid and a score report by domain. Pass it to earn the practice certificate.', href: (s) => `/${s}/mock-exam/`, cta: 'Take a mock exam' },
  { id: 'interview', icon: '💼', title: 'Interview preparation', text: 'Beginner to architect-level questions with model answers and the follow-ups interviewers really ask, so the exam turns into job conversations.', href: (s) => `/${s}/interview/`, cta: 'Practise interviews' },
  { id: 'resources', icon: '📚', title: 'Learning resources', text: 'Printable cheat sheets, flashcards, a glossary, service comparisons, a study plan with calendar reminders and an exam day guide.', href: (s) => `/${s}/cheat-sheet/`, cta: 'Browse resources' },
];
