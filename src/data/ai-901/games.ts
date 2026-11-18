/**
 * AI-901 content for the Play & Learn games. Every item matches what the lessons teach.
 */
import type { SortSet, Riddle } from '../az-900/games';

export const SORT_SETS: SortSet[] = [
  {
    id: 'ai-workloads', title: 'Which AI workload?', icon: '🧭', intro: 'Put each scenario in the right AI workload.', topic: 'ai-workloads',
    buckets: ['Text analysis', 'Speech', 'Computer vision', 'Information extraction'],
    items: [
      { text: 'Find angry tweets about a product launch', bucket: 0, why: 'Sentiment analysis is text analysis.' },
      { text: 'Mask Aadhaar numbers in support chats', bucket: 0, why: 'PII detection is a text analysis feature.' },
      { text: 'Caption a live webinar', bucket: 1, why: 'Speech to text.' },
      { text: 'Read bus arrival times aloud', bucket: 1, why: 'Text to speech.' },
      { text: 'Spot a dent in a car photo', bucket: 2, why: 'Analysing an image is computer vision.' },
      { text: 'Count people in a queue from a camera frame', bucket: 2, why: 'Object detection in an image.' },
      { text: 'Pull totals from 5,000 invoices', bucket: 3, why: 'Fields from documents: information extraction.' },
      { text: 'Chapter a training video and summarise it', bucket: 3, why: 'Extraction from video with Content Understanding.' },
    ],
  },
  {
    id: 'rai-principles', title: 'Which responsible AI principle?', icon: '⚖️', intro: 'Match each practice to the principle it supports.', topic: 'responsible-ai-principles',
    buckets: ['Fairness', 'Reliability & safety', 'Privacy & security', 'Transparency', 'Accountability'],
    items: [
      { text: 'Compare approval rates across groups', bucket: 0, why: 'Similar people should get similar outcomes.' },
      { text: 'Block jailbreak prompts with Prompt Shields', bucket: 1, why: 'The system behaves safely under attack.' },
      { text: 'Test the model on unusual, messy inputs', bucket: 1, why: 'Reliable behaviour beyond the happy path.' },
      { text: 'Redact phone numbers before storing chats', bucket: 2, why: 'Protects personal data.' },
      { text: 'Show sources next to every answer', bucket: 3, why: 'People can see where answers came from.' },
      { text: 'Publish what the system can and cannot do', bucket: 3, why: 'Transparency notes set expectations.' },
      { text: 'A manager approves refunds above the limit', bucket: 4, why: 'A human stays answerable for big decisions.' },
      { text: 'Keep traces of every agent action', bucket: 4, why: 'An audit trail supports accountability.' },
    ],
  },
  {
    id: 'deployment-types', title: 'Pick the deployment type', icon: '🚀', intro: 'Which Foundry deployment type fits each need?', topic: 'model-deployment-and-parameters',
    buckets: ['Global Standard', 'Data Zone Standard', 'Provisioned', 'Global Batch'],
    items: [
      { text: 'A prototype chatbot with unpredictable traffic', bucket: 0, why: 'Pay per token, newest models: the default.' },
      { text: 'Try the newest model the day it launches', bucket: 0, why: 'Global deployments get new models first.' },
      { text: 'EU customer data must be processed in the EU', bucket: 1, why: 'Data Zone keeps processing in the EU data zone.' },
      { text: 'A US bank that must keep processing in the US', bucket: 1, why: 'Data Zone (US).' },
      { text: 'Steady, high volume with predictable latency', bucket: 2, why: 'Reserved throughput (PTUs).' },
      { text: 'A call centre assistant running 24/7 at scale', bucket: 2, why: 'Consistent capacity for production.' },
      { text: 'Classify 2 million product reviews overnight', bucket: 3, why: 'Batch: about half price, 24-hour target.' },
      { text: 'Summarise last year’s tickets, no rush', bucket: 3, why: 'Not time-sensitive: Batch.' },
    ],
  },
];

export const RIDDLES: Riddle[] = [
  { answer: 'Microsoft Foundry', topic: 'what-is-microsoft-foundry', clues: ['I am where AI apps and agents get built on Azure.', 'I hold models, agents, guardrails and tools in projects.', 'My portal lives at ai.azure.com.'] },
  { answer: 'Temperature', topic: 'model-deployment-and-parameters', clues: ['I am a number you set on a model deployment call.', 'Turn me down and answers repeat; turn me up and they surprise you.', 'I usually go from 0 to 2.'] },
  { answer: 'Token', topic: 'how-generative-ai-works', clues: ['I am a word or a piece of a word.', 'Models read me and write me, one at a time.', 'You pay for me, coming in and going out.'] },
  { answer: 'Grounding', topic: 'prompt-engineering', clues: ['I stop a model from guessing.', 'I add trusted facts to the prompt.', 'RAG is one way to do me.'] },
  { answer: 'Content Understanding', topic: 'content-understanding-documents', clues: ['I read invoices, photos, calls and videos.', 'I return fields with confidence scores.', 'My analyzers can be prebuilt or custom.'] },
  { answer: 'Azure Speech', topic: 'speech-recognition-and-synthesis', clues: ['I turn talk into text.', 'I also turn text into a natural voice.', 'SSML lets you control how I sound.'] },
  { answer: 'AI agent', topic: 'generative-and-agentic-ai', clues: ['I am a model with instructions and tools.', 'I decide which tool to use, then check the result.', 'File search and the code interpreter are my favourite helpers.'] },
  { answer: 'Prompt Shields', topic: 'reliability-safety-privacy-security', clues: ['I guard the front door of a model.', 'I catch jailbreak and prompt-injection attacks.', 'I am part of Foundry guardrails.'] },
];
