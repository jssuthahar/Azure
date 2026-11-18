/**
 * Simulations shown in each AI-901 lesson's "Simulations" section
 * (Azure Portal | 3D View | Practice Lab). Tours are Foundry portal
 * walkthroughs from ./portal-tours.ts; 3D modes come from ./sims3d.ts;
 * Practice Labs are the AI-901 labs in src/lib/sim/labs.ts.
 */
import type { LessonSims } from '../az-900/lesson-sims';

export const LESSON_SIMS: Record<string, LessonSims> = {
  /* Domain 1: AI concepts */
  'what-is-ai': { d3: { mode: 'perception', start: 0, intro: 'Five kinds of AI work side by side. Try each lane.' }, tour: { id: 'foundry-home', intro: 'Look around the Foundry portal, where AI apps get built.' } },
  'responsible-ai-principles': { d3: { mode: 'responsible', start: 0, intro: 'Six pillars hold up one AI system. Step through each one.' }, tour: { id: 'guardrails', intro: 'Set up guardrails that put the principles into practice.' } },
  'fairness-and-inclusiveness': { d3: { mode: 'responsible', start: 1, intro: 'Train on skewed data, then fix it.' }, tour: { id: 'evaluations', intro: 'Run an evaluation that checks answers group by group.' } },
  'reliability-safety-privacy-security': { d3: { mode: 'responsible', start: 2, intro: 'Send a jailbreak prompt and watch the guardrail catch it.' }, tour: { id: 'guardrails', intro: 'Tune content filters and turn on PII protection.' } },
  'transparency-and-accountability': { d3: { mode: 'responsible', start: 5, intro: 'Show the sources, then put a person in charge of the big decisions.' }, tour: { id: 'model-card-tracing', intro: 'Read a model card, then follow a trace of every step.' } },
  'how-generative-ai-works': { d3: { mode: 'genai', start: 0, intro: 'Follow one prompt through tokens, attention and next-token prediction.' }, tour: { id: 'chat-playground', intro: 'Change temperature and max tokens and compare the answers.' } },
  'choosing-an-ai-model': { d3: { mode: 'genai', start: 7, intro: 'A small model and a large model get the same jobs.' }, tour: { id: 'model-catalog', intro: 'Filter the catalog, read a model card and compare benchmarks.' } },
  'model-deployment-and-parameters': { d3: { mode: 'foundry', start: 2, intro: 'Deploy the same model two ways and compare.' }, tour: { id: 'deploy-model', intro: 'Pick a deployment type, then tune the parameters.' } },
  'ai-workloads': { d3: { mode: 'perception', start: 0, intro: 'Send something into every lane.' }, tour: { id: 'foundry-tools', intro: 'Find the Foundry Tool for each workload.' } },
  'generative-and-agentic-ai': { d3: { mode: 'foundry', start: 5, intro: 'Ask the agent something that needs a document and a calculation.' }, tour: { id: 'create-agent', intro: 'Give a model instructions and tools, and it becomes an agent.' } },
  'text-analysis': { d3: { mode: 'perception', start: 1, intro: 'Feed a review in and see what comes out.' }, tour: { id: 'language-playground', intro: 'Try sentiment, key phrases, entities and summaries in the Language playground.' } },
  'speech-recognition-and-synthesis': { d3: { mode: 'perception', start: 2, intro: 'Speech in, text out. Then the other way round.' }, tour: { id: 'speech-playground', intro: 'Transcribe audio, then pick a neural voice.' } },
  'computer-vision-and-image-generation': { d3: { mode: 'perception', start: 4, intro: 'Analyse a photo, then generate a new one.' }, tour: { id: 'image-prompt', intro: 'Attach an image to a prompt and ask about it.' } },
  'information-extraction': { d3: { mode: 'perception', start: 6, intro: 'An invoice, a call and a video go in. Structured data comes out.' }, tour: { id: 'content-understanding', intro: 'Pick an analyzer and pull fields out of an invoice.' } },

  /* Domain 2: Microsoft Foundry */
  'what-is-microsoft-foundry': { d3: { mode: 'foundry', start: 0, intro: 'A Foundry resource, a project, and everything a team builds inside it.' }, tour: { id: 'create-foundry', intro: 'Create a Foundry resource and your first project.' } },
  'prompt-engineering': { d3: { mode: 'foundry', start: 3, intro: 'The system message sets the rules. The user message asks.' }, tour: { id: 'system-prompts', intro: 'Write a system message, add an example and watch the answers change.' } },
  'deploy-and-chat-in-foundry': { d3: { mode: 'foundry', start: 2, intro: 'Deploy a model, then talk to it.' }, tour: { id: 'deploy-model', intro: 'Deploy gpt-4.1-mini and chat with it in the playground.' } },
  'chat-app-with-foundry-sdk': { d3: { mode: 'foundry', start: 4, intro: 'Your Python app calls the project endpoint. Try it without signing in too.' }, tour: { id: 'sdk-chat', intro: 'Copy the endpoint, view the code and run a chat client.' } },
  'build-an-agent-in-foundry': { d3: { mode: 'foundry', start: 5, intro: 'Ask the agent a question and watch it choose a tool.' }, tour: { id: 'create-agent', intro: 'Create an agent, add a tool and test it in the agent playground.' } },
  'agent-client-app': { d3: { mode: 'foundry', start: 6, intro: 'One question, two tools, one answer.' }, tour: { id: 'agent-code', intro: 'Get the agent’s code and hold a two-turn conversation.' } },
  'text-analysis-app': { d3: { mode: 'perception', start: 1, intro: 'The same review your app will send.' }, tour: { id: 'language-playground', intro: 'Test the features first, then grab the code.' } },
  'spoken-prompts-multimodal': { d3: { mode: 'perception', start: 2, intro: 'Spoken words go in. A multimodal model answers.' }, tour: { id: 'audio-prompt', intro: 'Send a voice question to an audio-capable model.' } },
  'azure-speech-app': { d3: { mode: 'perception', start: 3, intro: 'Text becomes a natural voice.' }, tour: { id: 'speech-playground', intro: 'Pick a voice, tweak it with SSML and copy the code.' } },
  'visual-prompts-multimodal': { d3: { mode: 'perception', start: 4, intro: 'Ask a model about a photo.' }, tour: { id: 'image-prompt', intro: 'Attach a photo and ask questions about it.' } },
  'image-generation': { d3: { mode: 'perception', start: 5, intro: 'A sentence goes in. A new image comes out.' }, tour: { id: 'image-generation', intro: 'Deploy an image model and generate a poster.' } },
  'vision-app': { d3: { mode: 'perception', start: 4, intro: 'The photo your app will send.' }, tour: { id: 'image-prompt', intro: 'Test in the playground, then View code.' } },
  'content-understanding-documents': { d3: { mode: 'perception', start: 6, intro: 'A scanned invoice becomes fields with confidence scores.' }, tour: { id: 'content-understanding', intro: 'Analyse an invoice with a prebuilt analyzer, then add your own field.' } },
  'content-understanding-images': { d3: { mode: 'perception', start: 4, intro: 'Images carry information too.' }, tour: { id: 'cu-image', intro: 'Describe a photo and pull out the fields you define.' } },
  'content-understanding-audio-video': { d3: { mode: 'perception', start: 7, intro: 'A call and a video become transcripts, summaries and chapters.' }, tour: { id: 'cu-media', intro: 'Analyse a call recording and a training video.' } },
  'content-understanding-app': { d3: { mode: 'perception', start: 6, intro: 'What your app sends, and what comes back.' }, tour: { id: 'cu-code', intro: 'Call an analyzer from Python and read the fields.' } },
};
