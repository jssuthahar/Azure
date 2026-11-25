/**
 * Nimbus Coach: what to study after each exam. Only live exams are offered
 * (coach.json filters the list), so a planned exam here simply stays hidden
 * until its course goes live. Order matters: the first entry is the suggestion
 * most learners take. Keep each `why` to one short line.
 */
export interface NextExam { slug: string; why: string }

export const NEXT_EXAMS: Record<string, NextExam[]> = {
  'az-900': [
    { slug: 'az-104', why: 'Run Azure day to day: users, networks, storage and VMs.' },
    { slug: 'ai-901', why: 'Learn how AI works on Azure before you build with it.' },
    { slug: 'ai-200', why: 'Build the apps and backends that run on Azure.' },
  ],
  'ai-901': [
    { slug: 'ai-103', why: 'Build real AI apps and agents with Microsoft Foundry.' },
    { slug: 'az-900', why: 'Fill in the cloud basics that every Azure role expects.' },
    { slug: 'gh-300', why: 'Get faster at coding with GitHub Copilot.' },
  ],
  'ai-200': [
    { slug: 'ai-103', why: 'Put AI features on top of the backends you can now build.' },
    { slug: 'az-104', why: 'Learn to run and secure what you deploy.' },
    { slug: 'gh-300', why: 'Ship code faster with GitHub Copilot.' },
  ],
  'az-104': [
    { slug: 'ai-200', why: 'Move from running Azure to building on it.' },
    { slug: 'ai-103', why: 'Add AI apps and agents to the platform you manage.' },
  ],
  'ai-103': [
    { slug: 'ai-200', why: 'Build the cloud backend your agents run on.' },
    { slug: 'gh-300', why: 'Use GitHub Copilot to build agents faster.' },
  ],
  'gh-300': [
    { slug: 'ai-103', why: 'Go from using AI to building AI apps and agents.' },
    { slug: 'ai-200', why: 'Build and ship cloud apps on Azure.' },
  ],
};
