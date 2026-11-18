/**
 * Narration for the AI-901 3D scenes (<Datacenter3D mode="..." />).
 * Same shape as az-900/sims3d.ts; the builders live in src/lib/dc3d/
 * (responsible.ts, genai.ts, foundry.ts, perception.ts). Step order matters:
 * lesson-sims.ts opens a scene at a step index.
 */
import type { Sim3D } from '../az-900/sims3d';

export type AiMode3D = 'responsible' | 'genai' | 'foundry' | 'perception';

export const SIMS3D_AI: Record<AiMode3D, Sim3D> = {
  responsible: {
    title: 'Responsible AI: six principles around one AI system',
    steps: [
      { title: 'Six pillars around one model', text: 'Microsoft builds AI on six principles: **fairness**, **reliability and safety**, **privacy and security**, **inclusiveness**, **transparency** and **accountability**. Each pillar here guards the AI system in the middle. Take one away and the whole thing wobbles.' },
      { title: 'Fairness', text: 'A loan model trained mostly on one group of people approves that group more often. **Fairness** means the system treats similar people the same way. Test the model on different groups, then fix the data.', actions: [{ id: 'biased', label: '⚖️ …the model learned from skewed data?', kind: 'danger' }, { id: 'rebalance', label: '🧪 …we test by group and rebalance the data?', kind: 'ok' }] },
      { title: 'Reliability and safety', text: 'The system has to behave well when inputs are strange or hostile. **Guardrails** (content filters) check every prompt and every answer for harmful content and jailbreak attempts.', actions: [{ id: 'harmful', label: '🧨 …someone sends a jailbreak prompt?', kind: 'danger' }, { id: 'normal', label: '💬 …someone asks a normal question?', kind: 'ok' }] },
      { title: 'Privacy and security', text: 'Personal data needs protecting before, during and after the model sees it. **PII detection** can mask names and phone numbers, and your prompts stay inside your Azure tenant. They are not used to train the shared models.', actions: [{ id: 'pii', label: '📇 …a support chat contains a phone number?', kind: 'plain' }, { id: 'mask', label: '🛡️ …we mask PII before it is stored?', kind: 'ok' }] },
      { title: 'Inclusiveness', text: 'AI should work for everyone, including people with disabilities and people who speak other languages. **Speech to text**, **text to speech**, captions and translation open the same app to more users.', actions: [{ id: 'include', label: '🦻 …a user who is deaf joins a video call?', kind: 'ok' }] },
      { title: 'Transparency', text: 'People should know when they are talking to AI, what it can and cannot do, and where an answer came from. **Transparency notes**, model cards and **citations** do that job.', actions: [{ id: 'cite', label: '📎 …the assistant shows its sources?', kind: 'ok' }, { id: 'hidden', label: '🙈 …it hides that it is an AI?', kind: 'danger' }] },
      { title: 'Accountability', text: 'People, not models, are answerable for what an AI system does. A **human in the loop** approves high-impact actions, and **monitoring and traces** show who did what and when.', actions: [{ id: 'approve', label: '🧑‍⚖️ …the agent wants to issue a big refund?', kind: 'plain' }] },
    ],
  },
  genai: {
    title: 'Inside a generative AI model: from prompt to answer',
    steps: [
      { title: 'A prompt goes in', text: 'You type a **prompt**: "Write a thank-you note to my team." The model never sees letters. First the text is cut into **tokens**, which are whole words or pieces of words.', actions: [{ id: 'tokenize', label: '✂️ …the prompt is split into tokens?', kind: 'ok' }] },
      { title: 'Tokens become numbers', text: 'Each token becomes a long list of numbers called an **embedding**. Words with similar meaning get similar numbers, so "team" sits near "colleagues" and far from "banana".' },
      { title: 'Layers of attention', text: 'The tokens flow through dozens of **transformer** layers. In each layer, **attention** lets every token look at the others to work out context, so "bank" means money in one sentence and a river in another.', actions: [{ id: 'attend', label: '🔦 …the model works out what “team” refers to?', kind: 'ok' }] },
      { title: 'Predict the next token', text: 'At the end the model scores every possible **next token** and picks one. Then it adds that token to the input and predicts again, one token at a time, until the answer is finished. That is all "generation" is.', actions: [{ id: 'next', label: '➡️ …the model writes the next word?', kind: 'ok' }] },
      { title: 'Temperature', text: '**Temperature** controls how adventurous the pick is. Low (0.1) almost always takes the top token, so answers are focused and repeatable. High (1.2) spreads the choice, so answers get more creative and less predictable.', actions: [{ id: 'cold', label: '🧊 …temperature is 0.1?', kind: 'plain' }, { id: 'hot', label: '🔥 …temperature is 1.2?', kind: 'danger' }] },
      { title: 'Context window and max tokens', text: 'A model can only "see" a limited number of tokens at once: its **context window**. **Max output tokens** caps how long the answer can be. Long chats eventually push the oldest messages out.', actions: [{ id: 'overflow', label: '📚 …the chat gets longer than the context window?', kind: 'danger' }] },
      { title: 'Grounding beats guessing', text: 'A model only knows its training data, so it can confidently make things up (a **hallucination**). **Grounding** adds trusted data to the prompt, for example your company handbook, so the answer is based on facts you supplied.', actions: [{ id: 'guess', label: '🤷 …we ask about our own leave policy, ungrounded?', kind: 'danger' }, { id: 'ground', label: '📘 …we add the handbook to the prompt?', kind: 'ok' }] },
      { title: 'Bigger is not always better', text: 'Large models reason better but cost more and answer slower. **Small language models** are cheap and fast for simple jobs. **Multimodal** models also read images and audio. Pick the smallest model that does the job well.', actions: [{ id: 'small', label: '🐇 …a small model answers an FAQ?', kind: 'ok' }, { id: 'large', label: '🐘 …a large model plans a complex task?', kind: 'plain' }] },
    ],
  },
  foundry: {
    title: 'Microsoft Foundry: from model catalog to working agent',
    steps: [
      { title: 'Resource and project', text: 'A **Foundry resource** is the Azure resource that holds your models, tools, security and billing. Inside it, a **project** is the workspace where a team builds one app: its deployments, agents, files and evaluations.' },
      { title: 'The model catalog', text: 'The **model catalog** lists thousands of models: OpenAI GPT models, Microsoft Phi, Meta Llama, Mistral, DeepSeek and more. Each has a model card, benchmarks and the deployment types it supports.', actions: [{ id: 'browse', label: '🔎 …I browse the catalog?', kind: 'ok' }] },
      { title: 'Deploy a model', text: 'Before an app can call a model you **deploy** it and give the deployment a name. **Global Standard** (pay per token, the default), **Data Zone** (keeps processing in the US or EU), **Provisioned** (reserved throughput) and **Batch** (cheaper, within 24 hours) trade price, speed and data location.', actions: [{ id: 'deploy-std', label: '🚀 …I deploy with Global Standard?', kind: 'ok' }, { id: 'deploy-batch', label: '🐢 …I deploy with Global Batch?', kind: 'plain' }] },
      { title: 'Test in the playground', text: 'The **chat playground** lets you try a deployment with no code. The **system message** sets the rules, the **user message** asks the question, and parameters such as temperature tune the answer.', actions: [{ id: 'chat', label: '💬 …I send a test message?', kind: 'ok' }] },
      { title: 'Call it from your app', text: 'Your Python app uses the **Foundry SDK** (`azure-ai-projects`): connect to the **project endpoint** with Microsoft Entra ID, get an OpenAI-compatible client and call the deployment by its name.', actions: [{ id: 'app', label: '🐍 …my Python app sends a request?', kind: 'ok' }, { id: 'noauth', label: '⛔ …it calls without signing in?', kind: 'danger' }] },
      { title: 'An agent: model + instructions + tools', text: 'An **agent** is a model with **instructions** and **tools** that can decide what to do next. Foundry Agent Service keeps the conversation and runs the tools for you.', actions: [{ id: 'agent', label: '🤖 …a user asks the agent a question?', kind: 'ok' }] },
      { title: 'Tools in action', text: 'Ask "What is our refund limit, and what is 15% of ₹4,200?" The agent uses **file search** for the policy and the **code interpreter** for the maths, then answers in one reply. That loop of plan, act and observe is what makes it agentic.', actions: [{ id: 'tools', label: '🧰 …the agent needs a document and a calculation?', kind: 'ok' }] },
      { title: 'Guardrails and monitoring', text: 'Every request passes **guardrails** (content filters) on the way in and out. **Tracing** and **evaluations** show what the agent did, how long it took and whether answers are grounded and safe.', actions: [{ id: 'blocked', label: '🧨 …someone sends a harmful prompt?', kind: 'danger' }, { id: 'trace', label: '📈 …I open the traces?', kind: 'plain' }] },
    ],
  },
  perception: {
    title: 'AI workloads: text, speech, vision and extraction',
    steps: [
      { title: 'Five workload lanes', text: 'Most AI apps fall into a few **workloads**: **generative and agentic AI**, **text analysis**, **speech**, **computer vision** and **information extraction**. Each lane here takes a different kind of input and turns it into something useful.' },
      { title: 'Text analysis', text: 'A hotel review goes in. **Azure Language** returns the **sentiment** (positive, neutral, negative), **key phrases**, **named entities** (people, places, dates), **PII** and a short **summary**.', actions: [{ id: 'review', label: '📝 …a guest writes a review?', kind: 'ok' }] },
      { title: 'Speech to text', text: '**Speech recognition** turns spoken audio into text: live captions, call transcripts, voice commands. It can also translate speech into another language as you talk.', actions: [{ id: 'stt', label: '🎙️ …a caller speaks?', kind: 'ok' }] },
      { title: 'Text to speech', text: '**Speech synthesis** turns text into natural speech with a neural voice. **SSML** lets you control speed, pitch and pauses. Think audiobooks, voice assistants and accessibility readers.', actions: [{ id: 'tts', label: '🔊 …the app reads an answer aloud?', kind: 'ok' }] },
      { title: 'Computer vision', text: 'A photo goes in. Vision models return a **caption**, **tags**, **objects** with boxes, and any printed or handwritten text (**OCR**). A **multimodal** chat model can also answer questions about the picture.', actions: [{ id: 'photo', label: '📷 …a shopper uploads a photo of a shelf?', kind: 'ok' }] },
      { title: 'Image generation', text: '**Image-generation** models work the other way round: a text prompt goes in and a brand-new image comes out. Guardrails block harmful requests, and generated images are marked with content credentials.', actions: [{ id: 'gen', label: '🎨 …I ask for a poster of a rainy Chennai street?', kind: 'ok' }] },
      { title: 'Extract from documents', text: '**Azure Content Understanding** reads an invoice and returns **fields** you defined (vendor, date, total) with a **confidence score** for each, so low-confidence values can go to a person.', actions: [{ id: 'invoice', label: '🧾 …a scanned invoice arrives?', kind: 'ok' }] },
      { title: 'Extract from audio and video', text: 'The same service handles media: an audio call becomes a **transcript** with speakers and a **summary**; a video is split into **segments** with key frames, descriptions and chapters.', actions: [{ id: 'video', label: '🎬 …a 30-minute training video is uploaded?', kind: 'ok' }] },
    ],
  },
};
