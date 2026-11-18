/**
 * AI-901 course details copy: the "understand before you start" page at /ai-901/.
 * Exam facts come from syllabus.ts; this file holds the course's own promise.
 */
import type { CourseInfo } from '../types';

export const COURSE: CourseInfo = {
  title: 'Microsoft AI-901: Azure AI Fundamentals',
  subtitle: 'Learn how AI works and build real AI apps with Microsoft Foundry: prompts, agents, speech, vision and document extraction. No Azure account needed.',
  intro: [
    'AI-901 replaced AI-900 in 2026 and earns the same Microsoft Certified: Azure AI Fundamentals certification. It is more hands-on than the old exam: you need to understand how generative AI and agents work, and you need to build small apps with Microsoft Foundry and a little Python.',
    'This course follows the official skills outline topic by topic. Every lesson starts with a 30-second answer, then lets you try the idea in a Foundry portal walkthrough, a 3D scene and a practice lab with a simulated Foundry and Cloud Shell. A quiz closes each lesson.',
  ],
  audience: [
    { icon: '🎒', title: 'Students and career changers', text: 'You hear about AI every day and want to understand it properly, from tokens to agents.' },
    { icon: '💻', title: 'Developers', text: 'You know some Python and want to add chat, agents, speech, vision or document extraction to your apps.' },
    { icon: '☁️', title: 'AZ-900 graduates', text: 'You know Azure basics and want the next fundamentals badge, the one everyone is asking about.' },
    { icon: '🗂️', title: 'Business and product roles', text: 'You plan AI projects and want to speak confidently about models, costs and responsible AI.' },
  ],
  outcomes: [
    'Explain how generative AI models work: tokens, embeddings, attention, next-token prediction',
    'Apply the six principles of responsible AI and the guardrails that enforce them',
    'Choose the right model and deployment type, and tune temperature and max tokens',
    'Tell AI workloads apart: generative, agentic, text, speech, vision and extraction',
    'Create a Foundry resource and project, deploy a model and chat with it',
    'Write system and user prompts that keep answers on topic and grounded',
    'Build a chat client and an agent client in Python with the Foundry SDK',
    'Create and test a single agent with tools such as file search and code interpreter',
    'Add Azure Language and Azure Speech to a small app',
    'Use images in prompts and generate new images with gpt-image-1',
    'Extract fields from documents, images, audio and video with Content Understanding',
  ],
  requirements: [
    'Basic Python: variables, functions, loops and pip install',
    'A little Azure familiarity helps (resource groups, regions). Our AZ-900 course covers it free',
    'No Azure subscription or credit card: every lab runs in a simulator in your browser',
  ],
  roadmap: [
    { title: 'Week 1: How AI works', text: 'What AI is, how generative models produce text, and the six principles of responsible AI. Try the generative model in 3D.' },
    { title: 'Week 2: Models and workloads', text: 'Choosing and deploying models, parameters, and the workload lanes: agents, text, speech, vision and extraction.' },
    { title: 'Week 3: Build with Foundry', text: 'Create a Foundry project, write prompts, deploy a model, then build a chat app and an agent in the practice labs.' },
    { title: 'Week 4: Text, speech, vision, extraction', text: 'Azure Language, Azure Speech, multimodal prompts, image generation and Content Understanding, each with a lab.' },
    { title: 'Exam week: Mock exams and revision', text: 'Take full mock exams until you score 80% or more twice, read the cheat sheet and the exam day guide, then book.' },
  ],
  faq: [
    { q: 'What happened to AI-900?', a: 'Microsoft retired AI-900 on 30 June 2026. AI-901 replaces it and earns the same Azure AI Fundamentals certification, with more hands-on Foundry and Python skills.' },
    { q: 'Is this AI-901 course free?', a: 'Yes. Every lesson, simulation, lab, quiz, mock exam and the practice certificate is free. Signing in is optional and only syncs your progress.' },
    { q: 'Do I need to know Python?', a: 'A little. The exam expects you to read and complete short Python snippets that call the Foundry SDK, Azure Language, Azure Speech and Content Understanding. The labs walk you through each one.' },
    { q: 'Do I need an Azure account?', a: 'No. The Foundry portal walkthroughs, 3D scenes and Cloud Shell are simulations in your browser, so there is no bill and no sign-up.' },
    { q: 'Are these real AI-901 exam questions?', a: 'No. Every question here is original and written to practise the skills in the official outline. We never publish real, recalled or leaked exam questions.' },
    { q: 'Is the practice certificate a Microsoft certification?', a: 'No. It is an MSDEVBUILD practice certificate that shows you passed our mock exam. To become Microsoft certified you sit AI-901 with Microsoft.' },
  ],
  hubs: {
    compare: 'AI-901 comparisons side by side: Foundry deployment types, Azure Language vs LLM prompts, speech pipeline vs audio models, generative AI vs agents.',
    games: 'Learn AI-901 the fun way: sort AI workloads and responsible AI principles, pick deployment types, Who Am I riddles and a daily challenge, with XP.',
    servicesTitle: 'Azure AI Services Reference: Foundry, Speech, Language and More',
    services: 'Every AI-901 service in 60 seconds: Microsoft Foundry, Agent Service, Speech, Language, Vision and Content Understanding, with price feel and a simulation.',
    sandboxTitle: 'AI-901 Sandbox: Free Foundry and Azure Simulator | MSDEVBUILD',
    whoAmI: 'Who Am I? Guess the Azure AI Service Game | MSDEVBUILD',
  },
  labs: {
    title: 'AI-901 Practice Labs: Free Foundry Simulator | MSDEVBUILD',
    description: 'Free AI-901 hands-on labs: deploy models, write prompts, build agents, add speech, vision and Content Understanding in a simulated Foundry. No account.',
    h1: 'AI-901 Practice Labs',
    intro: 'A safe, simulated Microsoft Foundry and Cloud Shell in your browser. Deploy models, chat in the playground, build an agent, run Python apps with the Foundry SDK and pull fields out of invoices.',
    shell: [
      ['pip install azure-ai-projects azure-identity', 'Successfully installed azure-ai-projects-2.11.0'],
      ['python chat_app.py "When does the Chennai store open?"', 'At 10 AM on Sundays and 9 AM on other days.'],
    ],
  },
};
