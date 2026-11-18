/**
 * AI-901 syllabus: the single source of truth for navigation, the syllabus
 * page, the mock exam's domain weights and objective coverage.
 *
 * Source: "Study guide for Exam AI-901: Microsoft Azure AI Fundamentals",
 * skills measured as of April 15, 2026 (checked on Microsoft Learn 18 Nov 2026).
 * https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-901
 *
 * AI-901 replaced AI-900 (retired 30 June 2026) and earns the same
 * Microsoft Certified: Azure AI Fundamentals certification. Candidates need
 * basic Python and some familiarity with Azure resources.
 *
 * Objective ids are ours (domain.group.bullet), numbered in the order the
 * study guide lists the bullets. Whether a topic is published is derived from
 * the existence of src/content/tutorials/ai-901/<module>/<slug>.mdx.
 */

import type { ObjectiveGroup, SyllabusTopic, SyllabusModule, ExamFacts } from '../types';
export type { ObjectiveGroup, SyllabusTopic, SyllabusModule, ExamFacts };

export const SKILLS_MEASURED_AS_OF = 'April 15, 2026';
export const SYLLABUS_VERIFIED_ON = '2026-11-18';
export const STUDY_GUIDE_URL =
  'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-901';
export const EXAM_FACTS: ExamFacts = {
  passingScore: 700,
  scoreScale: '1–1000',
  durationMinutes: 45,
  practiceAssessmentUrl:
    'https://aiskillsnavigator.microsoft.com/credentials/cert-83587e0a0754cfee561ade3e27d9fa1cdaf15ae03be52d2413b2b858d1b4eda4',
};

export const MODULES: SyllabusModule[] = [
  {
    slug: 'ai-concepts',
    domain: 1,
    title: 'Identify AI concepts and capabilities',
    shortTitle: 'AI Concepts',
    weight: '40–45%',
    weightMid: 42.5,
    summary:
      'What AI is and how generative models actually work, the six principles of responsible AI, how to pick and configure a model, and the everyday AI workloads: agents, text, speech, vision and information extraction.',
    groups: [
      {
        title: 'Describe principles of responsible AI',
        objectives: [
          { id: '1.1.1', text: 'Describe considerations for fairness in an AI solution' },
          { id: '1.1.2', text: 'Describe considerations for reliability and safety in an AI solution' },
          { id: '1.1.3', text: 'Describe considerations for privacy and security in an AI solution' },
          { id: '1.1.4', text: 'Describe considerations for inclusiveness in an AI solution' },
          { id: '1.1.5', text: 'Describe considerations for transparency in an AI solution' },
          { id: '1.1.6', text: 'Describe considerations for accountability in an AI solution' },
        ],
      },
      {
        title: 'Identify AI model components and configurations',
        objectives: [
          { id: '1.2.1', text: 'Describe how generative AI models work' },
          { id: '1.2.2', text: 'Identify an appropriate AI model, based on capabilities' },
          { id: '1.2.3', text: 'Identify appropriate model deployment options and configuration parameters' },
        ],
      },
      {
        title: 'Identify AI workloads',
        objectives: [
          { id: '1.3.1', text: 'Identify scenarios for common AI workloads, including generative and agentic AI, text analysis, speech, computer vision, and information extraction' },
          { id: '1.3.2', text: 'Describe common text analysis techniques, including keyword extraction, entity detection, sentiment analysis, and summarization' },
          { id: '1.3.3', text: 'Identify features and capabilities of speech recognition and speech synthesis' },
          { id: '1.3.4', text: 'Identify features and capabilities of computer vision and image-generation models' },
          { id: '1.3.5', text: 'Identify techniques to extract information from text, images, audio, and videos' },
        ],
      },
    ],
    topics: [
      { slug: 'what-is-ai', title: 'What is AI? Machine Learning, Generative AI and Agents', objectives: ['1.3.1', '1.2.1'] },
      { slug: 'responsible-ai-principles', title: 'The Six Principles of Responsible AI', objectives: ['1.1.1', '1.1.2', '1.1.3', '1.1.4', '1.1.5', '1.1.6'] },
      { slug: 'fairness-and-inclusiveness', title: 'Fairness and Inclusiveness', objectives: ['1.1.1', '1.1.4'] },
      { slug: 'reliability-safety-privacy-security', title: 'Reliability, Safety, Privacy and Security', objectives: ['1.1.2', '1.1.3'] },
      { slug: 'transparency-and-accountability', title: 'Transparency and Accountability', objectives: ['1.1.5', '1.1.6'] },
      { slug: 'how-generative-ai-works', title: 'How Generative AI Models Work', objectives: ['1.2.1'] },
      { slug: 'choosing-an-ai-model', title: 'Choosing the Right AI Model', objectives: ['1.2.2'] },
      { slug: 'model-deployment-and-parameters', title: 'Model Deployment Options and Parameters', objectives: ['1.2.3'] },
      { slug: 'ai-workloads', title: 'Common AI Workloads', objectives: ['1.3.1'] },
      { slug: 'generative-and-agentic-ai', title: 'Generative AI and AI Agents', objectives: ['1.3.1', '1.2.1'] },
      { slug: 'text-analysis', title: 'Text Analysis: Key Phrases, Entities, Sentiment and Summaries', objectives: ['1.3.2'] },
      { slug: 'speech-recognition-and-synthesis', title: 'Speech Recognition and Speech Synthesis', objectives: ['1.3.3'] },
      { slug: 'computer-vision-and-image-generation', title: 'Computer Vision and Image Generation', objectives: ['1.3.4'] },
      { slug: 'information-extraction', title: 'Extracting Information from Text, Images, Audio and Video', objectives: ['1.3.5'] },
    ],
  },
  {
    slug: 'foundry',
    domain: 2,
    title: 'Implement AI solutions by using Microsoft Foundry',
    shortTitle: 'Microsoft Foundry',
    weight: '55–60%',
    weightMid: 57.5,
    summary:
      'Hands-on Microsoft Foundry: write prompts, deploy and test models, build chat apps and agents with the Foundry SDK, and add text, speech, vision and Content Understanding to small Python apps.',
    groups: [
      {
        title: 'Implement generative AI apps and agents by using Foundry',
        objectives: [
          { id: '2.1.1', text: 'Create effective system and user prompts for generative AI models' },
          { id: '2.1.2', text: 'Deploy a model and interact with it in the Foundry portal' },
          { id: '2.1.3', text: 'Create a lightweight chat client application by using the Foundry SDK' },
          { id: '2.1.4', text: 'Create and test a single-agent solution in the Foundry portal' },
          { id: '2.1.5', text: 'Create a lightweight client application for an agent' },
        ],
      },
      {
        title: 'Implement AI solutions for text and speech by using Foundry',
        objectives: [
          { id: '2.2.1', text: 'Build a lightweight application that includes text analysis' },
          { id: '2.2.2', text: 'Respond to spoken prompts by using a deployed multimodal model' },
          { id: '2.2.3', text: 'Build a lightweight application by using Azure Speech in Foundry Tools' },
        ],
      },
      {
        title: 'Implement AI solutions with computer vision and image-generation capabilities by using Foundry',
        objectives: [
          { id: '2.3.1', text: 'Interpret visual input in prompts by using a deployed multimodal model' },
          { id: '2.3.2', text: 'Create new visual outputs by using generative models' },
          { id: '2.3.3', text: 'Build a lightweight application that includes vision capabilities' },
        ],
      },
      {
        title: 'Implement AI solutions for information extraction by using Foundry',
        objectives: [
          { id: '2.4.1', text: 'Extract information from documents and forms by using Azure Content Understanding in Foundry Tools' },
          { id: '2.4.2', text: 'Extract information from images by using Content Understanding' },
          { id: '2.4.3', text: 'Extract information from audio and video by using Content Understanding' },
          { id: '2.4.4', text: 'Build a lightweight application with information extraction capabilities by using Content Understanding' },
        ],
      },
    ],
    topics: [
      { slug: 'what-is-microsoft-foundry', title: 'What is Microsoft Foundry?', objectives: ['2.1.2'] },
      { slug: 'prompt-engineering', title: 'Writing System and User Prompts', objectives: ['2.1.1'] },
      { slug: 'deploy-and-chat-in-foundry', title: 'Deploy a Model and Chat in the Foundry Portal', objectives: ['2.1.2'] },
      { slug: 'chat-app-with-foundry-sdk', title: 'Build a Chat App with the Foundry SDK', objectives: ['2.1.3'] },
      { slug: 'build-an-agent-in-foundry', title: 'Create and Test an Agent in the Foundry Portal', objectives: ['2.1.4'] },
      { slug: 'agent-client-app', title: 'Build a Client App for an Agent', objectives: ['2.1.5'] },
      { slug: 'text-analysis-app', title: 'Build a Text Analysis App', objectives: ['2.2.1'] },
      { slug: 'spoken-prompts-multimodal', title: 'Answer Spoken Prompts with a Multimodal Model', objectives: ['2.2.2'] },
      { slug: 'azure-speech-app', title: 'Build an App with Azure Speech in Foundry Tools', objectives: ['2.2.3'] },
      { slug: 'visual-prompts-multimodal', title: 'Use Images in Prompts with a Multimodal Model', objectives: ['2.3.1'] },
      { slug: 'image-generation', title: 'Generate Images with Generative Models', objectives: ['2.3.2'] },
      { slug: 'vision-app', title: 'Build an App with Vision Capabilities', objectives: ['2.3.3'] },
      { slug: 'content-understanding-documents', title: 'Content Understanding for Documents and Forms', objectives: ['2.4.1'] },
      { slug: 'content-understanding-images', title: 'Content Understanding for Images', objectives: ['2.4.2'] },
      { slug: 'content-understanding-audio-video', title: 'Content Understanding for Audio and Video', objectives: ['2.4.3'] },
      { slug: 'content-understanding-app', title: 'Build an Information Extraction App', objectives: ['2.4.4'] },
    ],
  },
];

export const moduleBySlug = (slug: string) => MODULES.find((m) => m.slug === slug);
export const allObjectives = () => MODULES.flatMap((m) => m.groups.flatMap((g) => g.objectives));
export const objectiveText = (id: string) => allObjectives().find((o) => o.id === id)?.text ?? id;
