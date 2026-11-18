/**
 * Microsoft Foundry in the practice simulator (EDUCATION ONLY).
 * A Foundry resource (Microsoft.CognitiveServices/accounts, kind AIServices)
 * with projects, model deployments, a chat playground, prompt agents with
 * tools, guardrails, Azure Language, Azure Speech, image generation and
 * Azure Content Understanding, plus the small Python SDK apps the AI-901
 * labs run from Cloud Shell. Nothing here calls a real model: answers are
 * worked out by simple rules so the lab can check what the learner did.
 * Names, SDK calls and settings follow Microsoft Learn (checked 18 Nov 2026).
 */
import { SimError, REGIONS, type Res, type Via } from './engine';
import type { World } from './world';

/* ------------------------------------------------------------------ */
/* catalog                                                             */
/* ------------------------------------------------------------------ */
export type ModelKind = 'chat' | 'reasoning' | 'slm' | 'image' | 'embedding' | 'audio';
export interface ModelInfo {
  label: string;
  by: string;
  kind: ModelKind;
  /** Input types the model accepts. */
  inputs: ('text' | 'image' | 'audio')[];
  ctx: string;
  /** Illustrative USD per 1M input / output tokens (images: per image). */
  price: [number, number];
  quality: number;
  speed: number;
  desc: string;
}
export const MODELS: Record<string, ModelInfo> = {
  'gpt-4.1': { label: 'gpt-4.1', by: 'OpenAI', kind: 'chat', inputs: ['text', 'image'], ctx: '1M tokens', price: [2, 8], quality: 5, speed: 3, desc: 'Flagship GPT model for complex instructions, coding and long documents. Reads images.' },
  'gpt-4.1-mini': { label: 'gpt-4.1-mini', by: 'OpenAI', kind: 'chat', inputs: ['text', 'image'], ctx: '1M tokens', price: [0.4, 1.6], quality: 4, speed: 4, desc: 'Smaller, cheaper and faster than gpt-4.1. A good default for chat apps. Reads images.' },
  'gpt-4.1-nano': { label: 'gpt-4.1-nano', by: 'OpenAI', kind: 'chat', inputs: ['text', 'image'], ctx: '1M tokens', price: [0.1, 0.4], quality: 3, speed: 5, desc: 'The fastest and cheapest GPT-4.1 model, for classification and simple tasks.' },
  'gpt-4o': { label: 'gpt-4o', by: 'OpenAI', kind: 'chat', inputs: ['text', 'image'], ctx: '128K tokens', price: [2.5, 10], quality: 4, speed: 4, desc: 'Multimodal model that reads text and images.' },
  'gpt-4o-audio-preview': { label: 'gpt-4o-audio-preview', by: 'OpenAI', kind: 'audio', inputs: ['text', 'audio'], ctx: '128K tokens', price: [2.5, 10], quality: 4, speed: 4, desc: 'Accepts spoken audio as input and can answer in text or audio.' },
  'o4-mini': { label: 'o4-mini', by: 'OpenAI', kind: 'reasoning', inputs: ['text', 'image'], ctx: '200K tokens', price: [1.1, 4.4], quality: 5, speed: 2, desc: 'Reasoning model: thinks step by step before answering. Uses reasoning effort instead of temperature.' },
  'Phi-4-mini-instruct': { label: 'Phi-4-mini-instruct', by: 'Microsoft', kind: 'slm', inputs: ['text'], ctx: '128K tokens', price: [0.08, 0.3], quality: 3, speed: 5, desc: 'Small language model (3.8B parameters). Cheap and fast for focused tasks; can run on devices.' },
  'Phi-4-multimodal-instruct': { label: 'Phi-4-multimodal-instruct', by: 'Microsoft', kind: 'slm', inputs: ['text', 'image', 'audio'], ctx: '128K tokens', price: [0.08, 0.32], quality: 3, speed: 5, desc: 'Small multimodal model that accepts text, images and audio.' },
  'Llama-3.3-70B-Instruct': { label: 'Llama-3.3-70B-Instruct', by: 'Meta', kind: 'chat', inputs: ['text'], ctx: '128K tokens', price: [0.71, 0.71], quality: 4, speed: 3, desc: 'Open-weight large language model from Meta.' },
  'gpt-image-1': { label: 'gpt-image-1', by: 'OpenAI', kind: 'image', inputs: ['text', 'image'], ctx: 'n/a', price: [0.04, 0.04], quality: 5, speed: 2, desc: 'Generates and edits images from text prompts.' },
  'text-embedding-3-small': { label: 'text-embedding-3-small', by: 'OpenAI', kind: 'embedding', inputs: ['text'], ctx: '8K tokens', price: [0.02, 0], quality: 4, speed: 5, desc: 'Turns text into vectors for search and RAG. It does not chat.' },
};
export const DEPLOY_TYPES: Record<string, { label: string; note: string }> = {
  GlobalStandard: { label: 'Global Standard', note: 'Pay per token. Newest models first. Data may be processed in any Azure region.' },
  DataZoneStandard: { label: 'Data Zone Standard', note: 'Pay per token. Processing stays in the US, EU or Asia Pacific data zone.' },
  Standard: { label: 'Standard', note: 'Pay per token. Processing stays in the resource’s Azure geography.' },
  GlobalProvisionedManaged: { label: 'Global Provisioned', note: 'Reserved throughput (PTUs) for steady, high volume with low latency variance.' },
  GlobalBatch: { label: 'Global Batch', note: 'Send a file of requests; results within 24 hours at about half the price.' },
};
export const VOICES = ['en-US-AvaMultilingualNeural', 'en-US-AndrewMultilingualNeural', 'en-IN-NeerjaNeural', 'en-IN-PrabhatNeural', 'hi-IN-SwaraNeural', 'ta-IN-PallaviNeural', 'en-GB-SoniaNeural'];

export interface Sample { kind: 'document' | 'image' | 'audio' | 'video'; label: string; analyzer: string; transcript?: string; fields: [string, string, number][]; markdown: string }
export const SAMPLES: Record<string, Sample> = {
  'invoice-contoso.pdf': { kind: 'document', label: 'Contoso Supplies invoice (PDF, 1 page)', analyzer: 'prebuilt-invoice', fields: [['VendorName', 'Contoso Supplies Pvt Ltd', 0.97], ['CustomerName', 'Fabrikam Retail', 0.95], ['InvoiceId', 'INV-2026-0417', 0.99], ['InvoiceDate', '2026-10-28', 0.96], ['DueDate', '2026-11-27', 0.93], ['InvoiceTotal', '₹48,260.00', 0.98], ['TotalTax', '₹7,362.00', 0.91], ['PurchaseOrder', 'PO-55120', 0.62]], markdown: '# INVOICE\nContoso Supplies Pvt Ltd · Chennai\nBill to: Fabrikam Retail\nInvoice INV-2026-0417 · 28 Oct 2026\n| Item | Qty | Amount |\n| Barcode scanners | 4 | ₹32,000 |\n| Label printer | 1 | ₹8,898 |\nTotal ₹48,260.00' },
  'receipt-cafe.jpg': { kind: 'document', label: 'Café receipt (photo)', analyzer: 'prebuilt-receipt', fields: [['MerchantName', 'Filter Coffee House', 0.94], ['TransactionDate', '2026-11-02', 0.9], ['Total', '₹386.00', 0.96], ['Items', '2 × filter coffee, 1 × masala dosa', 0.88]], markdown: 'FILTER COFFEE HOUSE\n2 Filter coffee 120\n1 Masala dosa 230\nGST 36\nTOTAL 386.00' },
  'shelf-photo.jpg': { kind: 'image', label: 'Supermarket shelf (photo)', analyzer: 'prebuilt-imageSearch', fields: [['Summary', 'A supermarket shelf with rows of cereal boxes and juice bottles. The second shelf from the top has three empty spaces.', 0.9], ['EmptySlots', '3', 0.86], ['Brands', 'Contoso Oats, Northwind Juice', 0.81]], markdown: '' },
  'car-damage.jpg': { kind: 'image', label: 'Car with a dented door (photo)', analyzer: 'prebuilt-imageSearch', fields: [['Summary', 'A silver hatchback parked on a street with a large dent and scratches on the rear passenger door.', 0.92], ['DamageType', 'Dent (classified: dent / scratch / broken glass / none)', 0.89], ['Severity', 'Moderate', 0.74]], markdown: '' },
  'street-chennai.jpg': { kind: 'image', label: 'Rainy street in Chennai (photo)', analyzer: 'prebuilt-imageSearch', fields: [['Summary', 'A busy street in the rain with auto-rickshaws, umbrellas and a tea stall lit by warm lights.', 0.91]], markdown: '' },
  'support-call.wav': { kind: 'audio', label: 'Customer support call (3 min)', analyzer: 'prebuilt-audioSearch', transcript: 'Speaker 1 (agent): Thanks for calling Contoso Mobile, this is Ravi.\nSpeaker 2 (customer): Hi, I was charged twice for my October bill.\nSpeaker 1: I’m sorry about that. I can see the duplicate charge and I’ve raised a refund. It’ll reach your account in five working days.\nSpeaker 2: Great, thank you.', fields: [['Summary', 'The customer was charged twice for October. The agent confirmed the duplicate charge and raised a refund due in five working days.', 0.9], ['Speakers', '2', 0.97], ['Sentiment', 'Starts negative, ends positive (classified)', 0.84]], markdown: '' },
  'question.wav': { kind: 'audio', label: 'Spoken question (6 s)', analyzer: 'prebuilt-audioSearch', transcript: 'What time does the Chennai store open on Sundays?', fields: [['Summary', 'A customer asks when the Chennai store opens on Sundays.', 0.93]], markdown: '' },
  'safety-training.mp4': { kind: 'video', label: 'Warehouse safety training (12 min video)', analyzer: 'prebuilt-videoSearch', transcript: '[00:00] Welcome to the warehouse safety briefing… [03:10] Always wear your high-visibility vest… [07:45] Forklift lanes are marked in yellow…', fields: [['Segment 1 (00:00–03:10)', 'Trainer introduces the course in front of loading bay 2.', 0.9], ['Segment 2 (03:10–07:45)', 'Close-ups of safety vests, helmets and gloves; trainer demonstrates fitting a helmet.', 0.88], ['Segment 3 (07:45–12:00)', 'A forklift drives along a yellow-marked lane while workers wait behind the line.', 0.87], ['Summary', 'A 12-minute warehouse safety briefing covering protective equipment and forklift lanes.', 0.9]], markdown: '' },
};
export const ANALYZERS: Record<string, { kind: Sample['kind']; label: string }> = {
  'prebuilt-invoice': { kind: 'document', label: 'Invoice: vendor, customer, totals, line items' },
  'prebuilt-receipt': { kind: 'document', label: 'Receipt: merchant, date, total, items' },
  'prebuilt-documentSearch': { kind: 'document', label: 'Document search (RAG): Markdown, figures, summary' },
  'prebuilt-layout': { kind: 'document', label: 'Layout: text, tables, selection marks' },
  'prebuilt-imageSearch': { kind: 'image', label: 'Image description' },
  'prebuilt-audioSearch': { kind: 'audio', label: 'Audio: transcript, summary, speakers' },
  'prebuilt-videoSearch': { kind: 'video', label: 'Video: segments, key frames, transcript' },
};
export const SCRIPTS: Record<string, string> = {
  'chat_app.py': `# chat_app.py: a lightweight chat client (Foundry SDK, Azure AI Projects 2.x)
# pip install "azure-ai-projects>=2.3.0" azure-identity
import os, sys
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient

endpoint = os.environ["FOUNDRY_PROJECT_ENDPOINT"]          # https://<resource>.services.ai.azure.com/api/projects/<project>
deployment = os.environ.get("MODEL_DEPLOYMENT", "gpt-4.1-mini")  # the DEPLOYMENT name, not the model name

project = AIProjectClient(endpoint=endpoint, credential=DefaultAzureCredential())  # Entra ID sign-in
openai = project.get_openai_client()

instructions = "You are a friendly assistant for Contoso Retail. Answer in two sentences or fewer."
question = sys.argv[1] if len(sys.argv) > 1 else "What can you help me with?"

response = openai.responses.create(model=deployment, instructions=instructions, input=question)
print(response.output_text)

# Follow-up that remembers the first turn
follow_up = openai.responses.create(model=deployment, instructions=instructions,
                                    previous_response_id=response.id, input="Say that again in one short line.")
print(follow_up.output_text)`,
  'agent_app.py': `# agent_app.py: a lightweight client for a Foundry prompt agent
import os
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient

project = AIProjectClient(endpoint=os.environ["FOUNDRY_PROJECT_ENDPOINT"], credential=DefaultAzureCredential())
agent_name = os.environ.get("AGENT_NAME", "support-agent")

openai = project.get_openai_client(agent_name=agent_name)   # client bound to the agent
conversation = openai.conversations.create()                 # keeps history between turns

for question in ["What is the refund limit for a damaged item?",
                 "And what is 15% of 4200?"]:
    response = openai.responses.create(conversation=conversation.id, input=question)
    print(f"You:   {question}\\nAgent: {response.output_text}\\n")`,
  'text_app.py': `# text_app.py: text analysis with Azure Language in Foundry Tools
# pip install azure-ai-textanalytics azure-identity
import os, sys
from azure.identity import DefaultAzureCredential
from azure.ai.textanalytics import TextAnalyticsClient

client = TextAnalyticsClient(endpoint=os.environ["FOUNDRY_ENDPOINT"], credential=DefaultAzureCredential())
docs = [sys.argv[1] if len(sys.argv) > 1 else "The room in Chennai was spotless and Priya at the front desk was lovely, but breakfast was cold."]

print("Language:  ", client.detect_language(docs)[0].primary_language.name)
s = client.analyze_sentiment(docs)[0];  print("Sentiment: ", s.sentiment, s.confidence_scores)
print("Key phrases:", client.extract_key_phrases(docs)[0].key_phrases)
print("Entities:  ", [(e.text, e.category) for e in client.recognize_entities(docs)[0].entities])
print("PII masked:", client.recognize_pii_entities(docs)[0].redacted_text)`,
  'speech_app.py': `# speech_app.py: Azure Speech in Foundry Tools (Speech SDK)
# pip install azure-cognitiveservices-speech
import os, sys
import azure.cognitiveservices.speech as speechsdk

speech_config = speechsdk.SpeechConfig(subscription=os.environ["SPEECH_KEY"], endpoint=os.environ["FOUNDRY_ENDPOINT"])

# Speech to text: transcribe a short audio file (up to ~30 seconds with recognize_once)
audio = speechsdk.audio.AudioConfig(filename="question.wav")
heard = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio).recognize_once_async().get()
print("Heard:", heard.text)

# Text to speech: answer with a neural voice
speech_config.speech_synthesis_voice_name = os.environ.get("VOICE", "en-IN-NeerjaNeural")
reply = sys.argv[1] if len(sys.argv) > 1 else "Our Chennai store opens at 10 AM on Sundays."
speechsdk.SpeechSynthesizer(speech_config=speech_config).speak_text_async(reply).get()
print("Spoke:", reply)`,
  'vision_app.py': `# vision_app.py: send a photo to a multimodal deployment (Foundry SDK)
import os, sys, base64
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient

project = AIProjectClient(endpoint=os.environ["FOUNDRY_PROJECT_ENDPOINT"], credential=DefaultAzureCredential())
openai = project.get_openai_client()
image_file = sys.argv[1] if len(sys.argv) > 1 else "shelf-photo.jpg"
b64 = base64.b64encode(open(image_file, "rb").read()).decode()

response = openai.responses.create(
    model=os.environ.get("MODEL_DEPLOYMENT", "gpt-4.1-mini"),
    input=[{"role": "user", "content": [
        {"type": "input_text", "text": "Describe this photo and list anything that needs attention."},
        {"type": "input_image", "image_url": f"data:image/jpeg;base64,{b64}"},
    ]}],
)
print(response.output_text)

# Optional: --generate "a prompt" creates a new image with gpt-image-1
if "--generate" in sys.argv:
    prompt = sys.argv[sys.argv.index("--generate") + 1]
    img = openai.images.generate(model=os.environ.get("IMAGE_DEPLOYMENT", "gpt-image-1"), prompt=prompt, size="1024x1024")
    open("generated.png", "wb").write(base64.b64decode(img.data[0].b64_json))
    print("Saved generated.png")`,
  'extract_app.py': `# extract_app.py: Azure Content Understanding in Foundry Tools
# pip install azure-ai-contentunderstanding azure-identity
import os, sys
from azure.identity import DefaultAzureCredential
from azure.ai.contentunderstanding import ContentUnderstandingClient
from azure.ai.contentunderstanding.models import AnalysisInput

client = ContentUnderstandingClient(endpoint=os.environ["FOUNDRY_ENDPOINT"], credential=DefaultAzureCredential())
file_name = sys.argv[1] if len(sys.argv) > 1 else "invoice-contoso.pdf"
analyzer = sys.argv[2] if len(sys.argv) > 2 else "prebuilt-invoice"

poller = client.begin_analyze(analyzer_id=analyzer, inputs=[AnalysisInput(url=f"https://example.blob.core.windows.net/samples/{file_name}")])
result = poller.result()
for name, field in result.contents[0].fields.items():
    flag = "  <-- send to a person" if field.confidence is not None and field.confidence < 0.8 else ""
    print(f"{name}: {field.value}  (confidence {field.confidence}){flag}")`,
};

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
export interface Deployment { name: string; model: string; sku: string; capacity: number; created: number }
export interface Agent { name: string; deployment: string; instructions: string; tools: string[]; version: number }
const rnd = (n: number) => Math.floor(Math.random() * n);
const words = (s: string) => (s.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? []);
const STOP = new Set(['the', 'and', 'you', 'are', 'for', 'with', 'that', 'this', 'what', 'how', 'can', 'your', 'about', 'only', 'answer', 'questions', 'question', 'help', 'assistant', 'helpful', 'friendly', 'please', 'tell', 'give', 'from', 'into', 'have', 'does', 'will', 'who', 'when', 'where', 'which', 'should', 'would', 'they', 'them', 'our', 'any', 'all', 'not', 'use', 'reply', 'respond', 'politely', 'sentences', 'sentence', 'short', 'always', 'never', 'must', 'customers', 'customer', 'users', 'user']);

export const isFoundry = (r?: Res): r is Res => !!r && r.type === 'foundry';
export const foundries = (w: World) => w.res.filter((r) => r.type === 'foundry');
export function needFoundry(w: World, name: string) {
  const r = w.res.find((x) => x.type === 'foundry' && x.name.toLowerCase() === (name ?? '').toLowerCase());
  if (!r) throw new SimError(`The Foundry resource '${name}' was not found. Create one first (Create a resource ➜ Microsoft Foundry).`, 'ResourceNotFound');
  return r;
}
export const projectEndpoint = (r: Res, project?: string) => `https://${r.name}.services.ai.azure.com/api/projects/${project ?? r.props.projects[0] ?? '<project>'}`;
export const resourceEndpoint = (r: Res) => `https://${r.name}.services.ai.azure.com/`;
export function deploymentOf(r: Res, name: string): Deployment {
  const d = (r.props.deployments as Deployment[]).find((x) => x.name.toLowerCase() === (name ?? '').toLowerCase());
  if (!d) throw new SimError(`The API deployment '${name}' does not exist on '${r.name}'. Deploy a model first and use its deployment name.`, 'DeploymentNotFound');
  return d;
}
const W = (r: Res) => r.props as Record<string, any>;

/* ------------------------------------------------------------------ */
/* resource, projects, deployments                                     */
/* ------------------------------------------------------------------ */
export function createFoundry(w: World, o: { rg: string; name: string; location?: string; project?: string; tags?: Record<string, string> }, via: Via = 'portal') {
  const g = w.needRg(o.rg);
  const name = (o.name ?? '').trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,62}[a-zA-Z0-9]$/.test(name)) throw new SimError(`The name '${name}' is invalid. Use 3–64 letters, numbers and hyphens, starting and ending with a letter or number. It becomes the custom subdomain https://${name || '<name>'}.services.ai.azure.com.`, 'InvalidName');
  if (w.res.some((r) => r.type === 'foundry' && r.name.toLowerCase() === name.toLowerCase())) throw new SimError(`The custom subdomain '${name}' is already in use. Pick another name.`, 'CustomDomainInUse');
  const location = o.location ? w.checkLocation(o.location) : g.location;
  w.guard('foundry', g.name, location, o.tags ?? {});
  const projects = o.project ? [o.project.trim()] : [];
  const r = (w as any).add('foundry', g, name, location, {
    kind: 'AIServices', sku: 'S0', projects, deployments: [] as Deployment[], agents: [] as Agent[], analyzers: [] as { id: string; base: string; fields: [string, string, string][] }[],
    guard: { level: 'Medium', shields: true, pii: false, blocked: 0 }, chat: [] as { role: string; text: string }[], usage: 0, last: {} as Record<string, string>,
  }, o.tags ?? {}) as Res;
  w.emit('foundry.create', { name, rg: g.name, location, project: projects[0] ?? '', via });
  return r;
}
export function addProject(w: World, r: Res, name: string, via: Via = 'portal') {
  const n = (name ?? '').trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,62}$/.test(n)) throw new SimError('Project names use 3–64 letters, numbers and hyphens.', 'InvalidName');
  if (W(r).projects.includes(n)) throw new SimError(`A project named '${n}' already exists.`, 'Conflict');
  W(r).projects.push(n);
  w.emit('foundry.project', { resource: r.name, name: n, via });
}
export function deployModel(w: World, r: Res, o: { name?: string; model: string; sku?: string; capacity?: number }, via: Via = 'portal') {
  const key = Object.keys(MODELS).find((k) => k.toLowerCase() === (o.model ?? '').toLowerCase());
  if (!key) throw new SimError(`Model '${o.model}' isn't in this simulator's catalog. Try: ${Object.keys(MODELS).join(', ')}.`, 'ModelNotFound');
  const sku = Object.keys(DEPLOY_TYPES).find((k) => k.toLowerCase() === (o.sku ?? 'GlobalStandard').toLowerCase().replace(/[\s-]/g, ''));
  if (!sku) throw new SimError(`Deployment type '${o.sku}' is not valid. Use one of: ${Object.keys(DEPLOY_TYPES).join(', ')}.`, 'InvalidSku');
  if (MODELS[key].kind === 'image' && !/^GlobalStandard$|^Standard$/.test(sku)) throw new SimError(`${key} supports Global Standard and Standard deployments in this simulator.`, 'InvalidSku');
  const name = (o.name || key).trim();
  if (!/^[a-zA-Z0-9._-]{2,64}$/.test(name)) throw new SimError('Deployment names use 2–64 letters, numbers, dots, hyphens and underscores.', 'InvalidName');
  if ((W(r).deployments as Deployment[]).some((d) => d.name.toLowerCase() === name.toLowerCase())) throw new SimError(`A deployment named '${name}' already exists. Each deployment name must be unique in the resource.`, 'Conflict');
  const d: Deployment = { name, model: key, sku, capacity: Math.max(1, Math.min(500, Number(o.capacity) || 10)), created: Date.now() };
  W(r).deployments.push(d);
  w.emit('ai.deploy', { resource: r.name, name, model: key, kind: MODELS[key].kind, sku, capacity: d.capacity, via });
  return d;
}
export function deleteDeployment(w: World, r: Res, name: string, via: Via = 'portal') {
  const d = deploymentOf(r, name);
  if ((W(r).agents as Agent[]).some((a) => a.deployment === d.name)) throw new SimError(`Deployment '${d.name}' is used by an agent. Change or delete the agent first.`, 'InUse');
  W(r).deployments = (W(r).deployments as Deployment[]).filter((x) => x !== d);
  w.emit('ai.deploy.delete', { resource: r.name, name: d.name, via });
}

/* ------------------------------------------------------------------ */
/* guardrails                                                          */
/* ------------------------------------------------------------------ */
const HARM: [RegExp, string][] = [
  [/ignore (all |your |the )?(previous|prior|above) (instructions|rules)|pretend you have no rules|developer mode|jailbreak|\bDAN\b/i, 'Jailbreak attempt (Prompt Shields)'],
  [/\b(make|build|create)\b.{0,20}\b(bomb|explosive|weapon)|\bkill\b.{0,15}\b(someone|people|him|her)\b|\bhurt (someone|people)\b/i, 'Violence'],
  [/\bhate\b.{0,15}\b(all|those)\b|\binferior race\b/i, 'Hate'],
  [/\bhack\b.{0,20}\b(account|password|bank|wifi)|\bsteal\b.{0,20}\b(password|card|data)/i, 'Harmful activity'],
  [/\bself[- ]harm\b|\bhurt myself\b/i, 'Self-harm'],
];
const PII = /(\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b|[\w.]+@[\w-]+\.\w+|\b\d{4}\s?\d{4}\s?\d{4}\b/g;
export function screen(r: Res, text: string): string | null {
  const g = W(r).guard;
  for (const [re, cat] of HARM) {
    if (!re.test(text)) continue;
    if (cat.startsWith('Jailbreak') && !g.shields) continue;
    if (g.level === 'Off' && !cat.startsWith('Jailbreak')) continue;
    return cat;
  }
  return null;
}
export function setGuardrail(w: World, r: Res, o: { level: string; shields: boolean; pii: boolean }, via: Via = 'portal') {
  const level = ['Low', 'Medium', 'High', 'Off'].includes(o.level) ? o.level : 'Medium';
  Object.assign(W(r).guard, { level, shields: !!o.shields, pii: !!o.pii });
  w.emit('ai.guardrail', { resource: r.name, level, shields: !!o.shields, pii: !!o.pii, via });
}

/* ------------------------------------------------------------------ */
/* the "model"                                                         */
/* ------------------------------------------------------------------ */
export interface ChatIn { deployment: string; system?: string; user: string; temperature?: number; maxTokens?: number; attach?: string; history?: { role: string; text: string }[] }
export interface ChatOut { text: string; blocked?: string; tokensIn: number; tokensOut: number; finish: 'stop' | 'length' | 'content_filter'; grounded: boolean; refused: boolean }

const KNOWLEDGE: [RegExp, string][] = [
  [/france/i, 'France covers about 213,000 square miles (551,700 km²), which makes it the largest country in the European Union.'],
  [/capital/i, 'The capital of France is Paris.'],
  [/refund/i, 'Most items can be refunded within 30 days with a receipt. Damaged items are refunded up to ₹5,000 without a manager’s approval.'],
  [/open|hours|sunday/i, 'The Chennai store opens at 10 AM on Sundays and at 9 AM on other days.'],
  [/thank/i, 'Team, thank you for the late nights and the good humour this quarter. We shipped on time because of you.'],
  [/poem|haiku/i, 'Soft rain on the roof,\nchai steam curls toward the window,\nthe city slows down.'],
  [/what can you|help me with/i, 'I can answer questions about Contoso Retail: orders, returns, store hours and products.'],
  [/temperature|token|context/i, 'Temperature controls how random the next-token choice is; the context window is how many tokens the model can see at once.'],
  [/password|reset/i, 'To reset your password, choose “Forgot password” on the sign-in page and follow the link sent to your registered email.'],
  [/leave|holiday|vacation/i, 'I don’t have your company’s leave policy, so I can’t give you a reliable number. Add the policy to the prompt (grounding) and I’ll answer from it.'],
];
const CREATIVE = ['✨ Fun fact: the same question can get a different answer every time at this temperature.', '(Said with a little flair, because the temperature is high.)', 'Here’s a more playful take on it!'];

function topicOf(system: string) {
  const m = system.match(/only (?:answer|help|respond|talk)?\s*(?:with|about|questions about|to questions about)?\s*([^.;\n]+)/i);
  return { raw: m ? m[1].trim() : '', words: m ? words(m[1]).filter((x) => !STOP.has(x)) : [] };
}
function groundingOf(system: string) {
  const m = system.match(/(?:context|policy|data|use this|facts?|knowledge)\s*:\s*([\s\S]+)/i);
  return m ? m[1].trim() : '';
}
export function generate(r: Res, o: ChatIn): ChatOut {
  const d = deploymentOf(r, o.deployment);
  const m = MODELS[d.model];
  if (m.kind === 'embedding') throw new SimError(`'${d.name}' is an embedding model (${d.model}). It turns text into vectors and can't chat. Deploy a chat model such as gpt-4.1-mini.`, 'OperationNotSupported');
  if (m.kind === 'image') throw new SimError(`'${d.name}' is an image-generation model. Use the Images playground or images.generate(), not chat.`, 'OperationNotSupported');
  const att = o.attach && o.attach !== 'none' ? SAMPLES[o.attach] : undefined;
  if (att?.kind === 'image' && !m.inputs.includes('image')) throw new SimError(`${d.model} doesn't accept images. Deploy a multimodal model such as gpt-4.1-mini or gpt-4o.`, 'UnsupportedInput');
  if (att?.kind === 'audio' && !m.inputs.includes('audio')) throw new SimError(`${d.model} doesn't accept audio input. Deploy an audio-capable model such as gpt-4o-audio-preview, or transcribe first with Azure Speech.`, 'UnsupportedInput');
  const system = (o.system ?? '').trim();
  const user = (o.user ?? '').trim() || (att?.kind === 'audio' ? att.transcript ?? '' : '');
  const tokensIn = Math.ceil((system.length + user.length) / 4) + (att ? (att.kind === 'image' ? 765 : 300) : 0) + (o.history ?? []).reduce((s, h) => s + Math.ceil(h.text.length / 4), 0);
  const blocked = screen(r, `${user}`);
  if (blocked) { W(r).guard.blocked++; return { text: `🛡️ This prompt was blocked by the guardrail (${blocked}). The model never saw it.`, blocked, tokensIn, tokensOut: 0, finish: 'content_filter', grounded: false, refused: false }; }

  const s = system.toLowerCase();
  const topic = topicOf(system);
  const ground = groundingOf(system);
  const uw = new Set(words(user));
  let refused = false;
  let body = '';
  if (att?.kind === 'image') body = `${att.fields[0][1]}${att.fields[1] ? ` ${att.fields.slice(1).map((f) => `${f[0].replace(/([A-Z])/g, ' $1').trim()}: ${f[1]}.`).join(' ')}` : ''}`;
  else if (att?.kind === 'audio') body = `You asked (spoken): “${att.transcript}” ${KNOWLEDGE.find(([re]) => re.test(att.transcript ?? ''))?.[1] ?? 'Here is what I found.'}`;
  if (!body && topic.words.length && ![...uw].some((x) => topic.words.some((t) => x.startsWith(t.slice(0, 5)) || t.startsWith(x.slice(0, 5))))) {
    refused = true;
    body = `Sorry, I can only help with ${topic.raw.replace(/^questions about /i, '')}. Is there something about that I can do for you?`;
  }
  if (!body && ground) {
    const sentences = ground.split(/(?<=[.!?])\s+/);
    const best = sentences.map((x) => [x, words(x).filter((t) => uw.has(t)).length] as const).sort((a, b) => b[1] - a[1])[0];
    body = best && best[1] > 0 ? `According to the information you provided: ${best[0]}` : 'The information you provided doesn’t cover that, so I won’t guess.';
  }
  if (!body) body = KNOWLEDGE.find(([re]) => re.test(user))?.[1] ?? `Here’s a short answer about “${user.slice(0, 60)}”: ${['it depends on what you need, but the key idea is to start small and test.', 'the best first step is to check the official documentation and try it in a sandbox.', 'it is a common question, and the short version is to keep it simple.'][user.length % 3]}`;

  // Formatting rules from the system message
  if (/json/.test(s) && !refused) body = JSON.stringify({ answer: body.replace(/\n/g, ' ') }, null, 2);
  else if (/bullet|list/.test(s) && !refused) body = body.split(/(?<=[.!?])\s+/).filter(Boolean).map((x) => `• ${x}`).join('\n');
  if (/one sentence|short|brief|concise/.test(s) && !/json/.test(s)) body = body.split(/(?<=[.!?])\s+/)[0];
  if (/pirate/.test(s)) body = `Arr! ${body}`;
  if (/hindi/.test(s)) body = `(Hindi) ${body}`;
  if (/example|category:/i.test(system) && /category/i.test(system)) body = `Category: ${/refund|charge|bill|price/i.test(user) ? 'Billing' : /late|deliver|ship/i.test(user) ? 'Delivery' : 'General'}`;
  const t = o.temperature ?? 0.7;
  if (t >= 1 && !refused) body = `${body}\n${CREATIVE[rnd(CREATIVE.length)]}`;
  let finish: ChatOut['finish'] = 'stop';
  let tokensOut = Math.ceil(body.length / 4);
  const max = o.maxTokens ?? 800;
  if (tokensOut > max) { body = `${body.slice(0, Math.max(8, max * 4))}…`; tokensOut = max; finish = 'length'; }
  if (W(r).guard.pii) body = body.replace(PII, '[REDACTED]');
  W(r).usage += tokensIn + tokensOut;
  return { text: body, tokensIn, tokensOut, finish, grounded: !!ground && !refused, refused };
}

export function chat(w: World, r: Res, o: ChatIn, via: Via = 'portal') {
  const out = generate(r, o);
  const d = deploymentOf(r, o.deployment);
  w.emit('ai.chat', { resource: r.name, deployment: d.name, model: d.model, system: o.system ?? '', user: o.user, temperature: o.temperature ?? 0.7, maxTokens: o.maxTokens ?? 800, attach: o.attach ?? 'none', blocked: out.blocked ?? '', finish: out.finish, grounded: out.grounded, refused: out.refused, turns: (o.history?.length ?? 0) / 2 + 1, via });
  if (out.blocked) w.emit('ai.blocked', { resource: r.name, category: out.blocked, where: 'chat', via });
  return out;
}

/* ------------------------------------------------------------------ */
/* agents                                                              */
/* ------------------------------------------------------------------ */
export const TOOLS: Record<string, string> = { file_search: 'File search (refund-policy.pdf)', code_interpreter: 'Code interpreter', web_search: 'Web search (grounding)', function: 'Function: get_order_status' };
export function createAgent(w: World, r: Res, o: { name: string; deployment: string; instructions: string; tools: string[] }, via: Via = 'portal') {
  const name = (o.name ?? '').trim();
  if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(name)) throw new SimError('Agent names start and end with a letter or number, can contain hyphens and have up to 63 characters.', 'InvalidName');
  if (!W(r).projects.length) throw new SimError('Agents live in a project. Create a project first.', 'NoProject');
  const d = deploymentOf(r, o.deployment);
  if (!['chat', 'reasoning', 'slm'].includes(MODELS[d.model].kind)) throw new SimError(`${d.model} can't power an agent. Pick a chat model deployment.`, 'OperationNotSupported');
  if (!(o.instructions ?? '').trim()) throw new SimError('Give the agent instructions: who it is, what it should do and what it must not do.', 'MissingInstructions');
  const agents = W(r).agents as Agent[];
  const prev = agents.find((a) => a.name.toLowerCase() === name.toLowerCase());
  const tools = o.tools.filter((t) => t in TOOLS);
  const a: Agent = { name: prev?.name ?? name, deployment: d.name, instructions: o.instructions.trim(), tools, version: (prev?.version ?? 0) + 1 };
  W(r).agents = [...agents.filter((x) => x !== prev), a];
  w.emit('ai.agent.create', { resource: r.name, name: a.name, version: a.version, deployment: d.name, tools, instructions: a.instructions, via });
  return a;
}
export function agentOf(r: Res, name: string) {
  const a = (W(r).agents as Agent[]).find((x) => x.name.toLowerCase() === (name ?? '').toLowerCase());
  if (!a) throw new SimError(`Agent '${name}' was not found in this project. Create it first.`, 'AgentNotFound');
  return a;
}
export function runAgent(w: World, r: Res, o: { agent: string; input: string; turn?: number }, via: Via = 'portal') {
  const a = agentOf(r, o.agent);
  const q = (o.input ?? '').trim();
  const blocked = screen(r, q);
  if (blocked) { W(r).guard.blocked++; w.emit('ai.blocked', { resource: r.name, category: blocked, where: 'agent', via }); return { text: `🛡️ Blocked by the guardrail (${blocked}).`, used: [] as string[] }; }
  const used: string[] = [];
  const parts: string[] = [];
  if (/refund|policy|return|damag/i.test(q)) {
    if (a.tools.includes('file_search')) { used.push('file_search'); parts.push('Damaged items can be refunded up to ₹5,000 without a manager’s approval 【refund-policy.pdf】.'); }
    else parts.push('I don’t have the refund policy document, so I can’t say for sure. (Tip: add the File search tool with the policy.)');
  }
  const pct = q.match(/(\d+(?:\.\d+)?)\s*%\s*of\s*₹?\s*([\d,]+(?:\.\d+)?)/i);
  if (pct) {
    const val = (Number(pct[1]) / 100) * Number(pct[2].replace(/,/g, ''));
    if (a.tools.includes('code_interpreter')) { used.push('code_interpreter'); parts.push(`I ran the calculation: ${pct[1]}% of ${pct[2]} = ${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}.`); }
    else parts.push(`That’s roughly ${Math.round(val)}, but I worked it out without a calculator tool, so double-check it.`);
  }
  if (/latest|today|news|weather|current/i.test(q)) {
    if (a.tools.includes('web_search')) { used.push('web_search'); parts.push('I searched the web and found up-to-date results (with citations).'); }
    else parts.push('My training data has a cut-off date, so I can’t give you current information without a web search tool.');
  }
  if (/order|status|track/i.test(q)) {
    if (a.tools.includes('function')) { used.push('function'); parts.push('I called get_order_status(order_id="ORD-1042"): it was shipped yesterday and arrives Friday.'); }
    else parts.push('I can’t look up orders without a function tool connected to the order system.');
  }
  if (!parts.length) parts.push(KNOWLEDGE.find(([re]) => re.test(q))?.[1] ?? `Following my instructions (“${a.instructions.slice(0, 50)}${a.instructions.length > 50 ? '…' : ''}”), here’s my answer: I can help with that.`);
  const text = parts.join(' ');
  w.emit('ai.agent.run', { resource: r.name, agent: a.name, version: a.version, input: q, used, turn: o.turn ?? 1, via });
  return { text, used };
}

/* ------------------------------------------------------------------ */
/* Foundry Tools: Language, Speech, Vision/images, Content Understanding */
/* ------------------------------------------------------------------ */
export const TEXT_FEATURES = ['language', 'sentiment', 'keyphrases', 'entities', 'pii', 'summary'] as const;
export function analyzeText(w: World, r: Res, text: string, features: string[], via: Via = 'portal') {
  const t = (text ?? '').trim();
  if (!t) throw new SimError('Enter some text to analyse.', 'MissingText');
  if (!features.length) throw new SimError('Pick at least one feature.', 'MissingFeature');
  const neg = (t.match(/\b(cold|bad|terrible|slow|rude|dirty|late|broken|worst|disappoint\w*|charged twice|never)\b/gi) ?? []).length;
  const pos = (t.match(/\b(great|lovely|spotless|excellent|friendly|good|amazing|fast|clean|helpful|best|love\w*)\b/gi) ?? []).length;
  const sentiment = pos && neg ? 'mixed' : pos ? 'positive' : neg ? 'negative' : 'neutral';
  const out: Record<string, string> = {};
  if (features.includes('language')) out.Language = /[஀-௿]/.test(t) ? 'Tamil (ta)' : /[ऀ-ॿ]/.test(t) ? 'Hindi (hi)' : /\b(le|la|est|bonjour)\b/i.test(t) ? 'French (fr)' : 'English (en)';
  if (features.includes('sentiment')) out.Sentiment = `${sentiment} (positive ${(pos / Math.max(1, pos + neg) || 0.1).toFixed(2)}, negative ${(neg / Math.max(1, pos + neg) || 0.1).toFixed(2)})`;
  if (features.includes('keyphrases')) out['Key phrases'] = [...new Set((t.match(/\b(?:room|breakfast|front desk|staff|service|delivery|box|price|food|wifi|pool|bill|refund|store|app|battery|screen)\b/gi) ?? []).map((x) => x.toLowerCase()))].join(', ') || words(t).filter((x) => !STOP.has(x)).slice(0, 4).join(', ');
  if (features.includes('entities')) {
    const ents: string[] = [];
    for (const m of t.matchAll(/\b(Chennai|Mumbai|Bengaluru|Delhi|London|Seattle|Paris)\b/g)) ents.push(`${m[1]} (Location)`);
    for (const m of t.matchAll(/\b(Priya|Ravi|Anika|Arjun|Ana|Ben)\b/g)) ents.push(`${m[1]} (Person)`);
    for (const m of t.matchAll(/\b(Contoso|Fabrikam|Microsoft|Northwind)\b/g)) ents.push(`${m[1]} (Organization)`);
    for (const m of t.matchAll(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|yesterday|today|\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*)\b/gi)) ents.push(`${m[1]} (DateTime)`);
    out.Entities = [...new Set(ents)].join(', ') || 'none found';
  }
  if (features.includes('pii')) out['PII redacted'] = t.replace(PII, (x) => '*'.repeat(x.length)).replace(/\b(Priya|Ravi|Anika|Arjun|Ana|Ben)\b/g, (x) => '*'.repeat(x.length));
  if (features.includes('summary')) out.Summary = t.split(/(?<=[.!?])\s+/).slice(0, 1).join(' ');
  W(r).last.text = JSON.stringify(out);
  w.emit('ai.text', { resource: r.name, features, sentiment, via });
  return out;
}
export function tts(w: World, r: Res, text: string, voice: string, ssml = false, via: Via = 'portal') {
  if (!(text ?? '').trim()) throw new SimError('Enter text to speak.', 'MissingText');
  const v = VOICES.find((x) => x.toLowerCase() === (voice ?? '').toLowerCase());
  if (!v) throw new SimError(`Voice '${voice}' is not available here. Try ${VOICES.slice(0, 3).join(', ')}.`, 'VoiceNotFound');
  w.emit('ai.tts', { resource: r.name, voice: v, ssml: ssml || /<speak|<prosody/i.test(text), chars: text.length, via });
  return `🔊 Synthesized ${text.length} characters with ${v}${ssml ? ' (SSML)' : ''}. Audio: output.wav (${Math.max(1, Math.round(text.length / 15))} s)`;
}
export function stt(w: World, r: Res, sample: string, via: Via = 'portal') {
  const s = SAMPLES[sample];
  if (!s || (s.kind !== 'audio' && s.kind !== 'video')) throw new SimError('Pick an audio file to transcribe.', 'InvalidInput');
  w.emit('ai.stt', { resource: r.name, sample, via });
  return s.transcript ?? '';
}
export function generateImage(w: World, r: Res, o: { deployment: string; prompt: string; size?: string }, via: Via = 'portal') {
  const d = deploymentOf(r, o.deployment);
  if (MODELS[d.model].kind !== 'image') throw new SimError(`'${d.name}' (${d.model}) can't generate images. Deploy gpt-image-1.`, 'OperationNotSupported');
  const prompt = (o.prompt ?? '').trim();
  if (prompt.length < 4) throw new SimError('Describe the image you want: subject, style, colours, mood.', 'MissingPrompt');
  const blocked = screen(r, prompt);
  const size = ['1024x1024', '1024x1536', '1536x1024'].includes(o.size ?? '') ? o.size! : '1024x1024';
  w.emit('ai.image', { resource: r.name, deployment: d.name, prompt, size, blocked: blocked ?? '', via });
  if (blocked) { W(r).guard.blocked++; w.emit('ai.blocked', { resource: r.name, category: blocked, where: 'image', via }); return { blocked, size, file: '' }; }
  W(r).last.image = JSON.stringify({ prompt, size });
  return { blocked: '', size, file: `generated-${Date.now().toString().slice(-5)}.png` };
}
export function createAnalyzer(w: World, r: Res, o: { id: string; base: string; fields: [string, string, string][] }, via: Via = 'portal') {
  const id = (o.id ?? '').trim();
  if (!/^[a-zA-Z][a-zA-Z0-9._-]{1,63}$/.test(id) || id.startsWith('prebuilt-')) throw new SimError('Analyzer ids start with a letter, use letters, numbers, dots, hyphens or underscores, and can’t start with “prebuilt-”.', 'InvalidName');
  if (!['prebuilt-document', 'prebuilt-image', 'prebuilt-audio', 'prebuilt-video'].includes(o.base)) throw new SimError('Custom analyzers derive from a base analyzer: prebuilt-document, prebuilt-image, prebuilt-audio or prebuilt-video.', 'InvalidBase');
  if (!o.fields.length) throw new SimError('Add at least one field to the schema.', 'MissingField');
  for (const [n, m] of o.fields) if (m === 'extract' && o.base !== 'prebuilt-document') throw new SimError(`Field '${n}': the "extract" method works for documents only. Use "generate" or "classify" for ${o.base.replace('prebuilt-', '')}.`, 'InvalidMethod');
  const list = (W(r).analyzers as { id: string }[]).filter((a) => a.id !== id);
  W(r).analyzers = [...list, { id, base: o.base, fields: o.fields }];
  w.emit('ai.analyzer.create', { resource: r.name, id, base: o.base, fields: o.fields.map((f) => f[0]), methods: o.fields.map((f) => f[1]), via });
}
export function analyzeContent(w: World, r: Res, analyzerId: string, file: string, via: Via = 'portal') {
  const s = SAMPLES[file];
  if (!s) throw new SimError(`File '${file}' not found. Samples: ${Object.keys(SAMPLES).join(', ')}.`, 'InvalidInput');
  const custom = (W(r).analyzers as { id: string; base: string; fields: [string, string, string][] }[]).find((a) => a.id === analyzerId);
  const pre = ANALYZERS[analyzerId];
  if (!custom && !pre) throw new SimError(`Analyzer '${analyzerId}' doesn't exist. Use a prebuilt analyzer or create a custom one first.`, 'AnalyzerNotFound');
  const kind = custom ? custom.base.replace('prebuilt-', '') : pre.kind;
  if (kind !== s.kind) throw new SimError(`'${analyzerId}' analyses ${kind} content, but '${file}' is ${s.kind === 'image' ? 'an image' : `a ${s.kind}`} file.`, 'UnsupportedContent');
  if (!W(r).deployments.length) throw new SimError('Content Understanding needs default model deployments on the resource (for example gpt-4.1-mini and text-embedding-3-small). Deploy a chat model first.', 'NoDefaults');
  let fields: [string, string, number][] = analyzerId === 'prebuilt-receipt' || analyzerId === 'prebuilt-invoice' || analyzerId === s.analyzer ? s.fields : s.fields.filter((f) => f[0] === 'Summary').concat(s.fields.length ? [] : []);
  if (analyzerId === 'prebuilt-layout') fields = [['Pages', '1', 0.99], ['Tables', '1', 0.97], ['Paragraphs', '6', 0.98]];
  if (analyzerId === 'prebuilt-documentSearch') fields = [['Summary', 'An invoice from Contoso Supplies to Fabrikam Retail for barcode scanners and a label printer.', 0.9]];
  if (custom) fields = custom.fields.map(([n, m, desc]) => {
    const hit = s.fields.find((f) => f[0].toLowerCase() === n.toLowerCase());
    if (hit) return [n, hit[1], hit[2]] as [string, string, number];
    if (m === 'classify') return [n, `${desc.split('|')[0]?.trim() || 'Other'} (classified)`, 0.78];
    return [n, m === 'generate' ? `Generated from the ${s.kind}: ${s.fields[0][1].slice(0, 80)}` : 'Not found', m === 'generate' ? 0.81 : 0.4];
  });
  const low = fields.filter((f) => f[2] < 0.8).map((f) => f[0]);
  W(r).last.cu = JSON.stringify({ analyzer: analyzerId, file, fields, transcript: s.transcript ?? '', markdown: s.markdown });
  w.emit('ai.cu', { resource: r.name, analyzer: analyzerId, custom: !!custom, file, kind: s.kind, low, via });
  return { fields, transcript: s.transcript ?? '', markdown: s.markdown, low };
}
export function runEvaluation(w: World, r: Res, deployment: string, evaluators: string[], via: Via = 'portal') {
  const d = deploymentOf(r, deployment);
  if (!evaluators.length) throw new SimError('Pick at least one evaluator.', 'MissingEvaluator');
  const score: Record<string, string> = {
    groundedness: d.model.includes('nano') ? '3.6 / 5' : '4.4 / 5', relevance: '4.5 / 5', coherence: '4.7 / 5',
    fairness: 'Approval rate by group: A 81%, B 79%, C 63% ⚠️ check group C', violence: '0 of 50 responses flagged', jailbreak: W(r).guard.shields ? '0 of 20 attacks succeeded' : '6 of 20 attacks succeeded ⚠️ turn on Prompt Shields',
  };
  const res = Object.fromEntries(evaluators.filter((e) => e in score).map((e) => [e, score[e]]));
  W(r).last.eval = JSON.stringify(res);
  w.emit('ai.eval', { resource: r.name, deployment: d.name, evaluators, via });
  return res;
}
export const foundryHourly = (r: Res) => (W(r).deployments as Deployment[]).reduce((s, d) => s + (/Provisioned/.test(d.sku) ? 1 * d.capacity : 0), 0) + (W(r).usage ?? 0) * 0.0000004;

/* ------------------------------------------------------------------ */
/* Cloud Shell: python, pip, export, ls, cat                           */
/* ------------------------------------------------------------------ */
export interface ShellOut { out?: string; error?: string }
const envOf = (w: World): Record<string, string> => ((w as any).env ??= {});
function fromProjectEndpoint(w: World, varName = 'FOUNDRY_PROJECT_ENDPOINT'): [Res, string] {
  const v = envOf(w)[varName];
  if (!v) throw new SimError(`KeyError: '${varName}'\nSet it first: export ${varName}="https://<resource>.services.ai.azure.com/api/projects/<project>" (copy it from the Foundry resource's Overview).`, 'Python');
  const m = v.match(/^https:\/\/([a-z0-9-]+)\.services\.ai\.azure\.com\/api\/projects\/([\w-]+)\/?$/i);
  if (!m) throw new SimError(`ValueError: '${v}' is not a project endpoint. The format is https://<resource>.services.ai.azure.com/api/projects/<project>.`, 'Python');
  const r = foundries(w).find((x) => x.name.toLowerCase() === m[1].toLowerCase());
  if (!r) throw new SimError(`azure.core.exceptions.ServiceRequestError: can't reach ${m[1]}.services.ai.azure.com. Is the resource name right?`, 'Python');
  if (!W(r).projects.includes(m[2])) throw new SimError(`azure.core.exceptions.ResourceNotFoundError: (NotFound) Project '${m[2]}' not found in '${r.name}'.`, 'Python');
  return [r, m[2]];
}
function fromResourceEndpoint(w: World): Res {
  const v = envOf(w).FOUNDRY_ENDPOINT;
  if (!v) throw new SimError(`KeyError: 'FOUNDRY_ENDPOINT'\nSet it first: export FOUNDRY_ENDPOINT="https://<resource>.services.ai.azure.com/" (Keys and Endpoint on the Foundry resource).`, 'Python');
  const m = v.match(/^https:\/\/([a-z0-9-]+)\.(?:services\.ai|cognitiveservices)\.azure\.com\/?$/i);
  const r = m && foundries(w).find((x) => x.name.toLowerCase() === m[1].toLowerCase());
  if (!r) throw new SimError(`azure.core.exceptions.ServiceRequestError: '${v}' doesn't match a Foundry resource. Use https://<resource>.services.ai.azure.com/`, 'Python');
  return r;
}
function needPkgs(w: World, pkgs: string[]) {
  const have: string[] = (w as any).pip ?? [];
  const miss = pkgs.filter((p) => !have.includes(p));
  if (miss.length) throw new SimError(`ModuleNotFoundError: No module named '${miss[0].replace(/-/g, '.').replace('azure.cognitiveservices.speech', 'azure.cognitiveservices.speech')}'\nInstall it: pip install ${miss.join(' ')}`, 'Python');
}
export function shell(tokens: string[], w: World): ShellOut | null {
  const c = tokens[0]?.toLowerCase();
  const rest = tokens.slice(1);
  try {
    if (c === 'export') {
      const raw = rest.join(' ');
      const m = raw.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!m) return { error: 'usage: export NAME="value"' };
      const val = m[2].replace(/^["']|["']$/g, '').trim();
      envOf(w)[m[1]] = val;
      w.emit('env.set', { name: m[1], value: val });
      return { out: '' };
    }
    if (c === 'env' || c === 'printenv') return { out: Object.entries(envOf(w)).map(([k, v]) => `${k}=${v}`).join('\n') || '(no variables set; use export NAME="value")' };
    if (c === 'echo' && /^\$\w+$/.test(rest[0] ?? '')) return { out: envOf(w)[rest[0].slice(1)] ?? '' };
    if (c === 'pip' || c === 'pip3') {
      if (rest[0] !== 'install') return { error: 'usage: pip install <package> [<package> ...]' };
      const pkgs = rest.slice(1).map((p) => p.replace(/^["']|["']$/g, '').replace(/[<>=].*$/, '').toLowerCase()).filter((p) => !p.startsWith('-'));
      const known = ['azure-ai-projects', 'azure-identity', 'azure-ai-textanalytics', 'azure-cognitiveservices-speech', 'azure-ai-contentunderstanding', 'openai', 'python-dotenv'];
      const bad = pkgs.find((p) => !known.includes(p));
      if (bad) return { error: `ERROR: Could not find a version that satisfies the requirement ${bad} (simulated index has: ${known.join(', ')})` };
      (w as any).pip = [...new Set([...((w as any).pip ?? []), ...pkgs])];
      w.emit('pip.install', { pkgs });
      return { out: `${pkgs.map((p) => `Collecting ${p}\n  Downloading ${p}-${p === 'azure-ai-projects' ? '2.11.0' : '1.0.0'}-py3-none-any.whl`).join('\n')}\nSuccessfully installed ${pkgs.join(' ')}` };
    }
    if (c === 'ls' || c === 'dir') return { out: ['main.bicep', ...Object.keys(SCRIPTS), ...Object.keys(SAMPLES)].join('  ') };
    if (c === 'cat' && rest[0] && SCRIPTS[rest[0]]) { w.emit('py.view', { file: rest[0] }); return { out: SCRIPTS[rest[0]] }; }
    if (c === 'cat' && rest[0] && SAMPLES[rest[0]]) return { out: `(binary ${SAMPLES[rest[0]].kind} file: ${SAMPLES[rest[0]].label})` };
    if (c === 'az' && rest[0]?.toLowerCase() === 'login') { w.emit('az.login', {}); return { out: 'Cloud Shell is already signed in as learner@msdevbuild.com. DefaultAzureCredential will use this sign-in (Microsoft Entra ID).' }; }
    if (c === 'python' || c === 'python3') return python(rest, w);
  } catch (e) {
    if (e instanceof SimError) return { error: e.message };
    throw e;
  }
  return null;
}

function python(args: string[], w: World): ShellOut {
  const file = args[0];
  if (!file) return { error: 'Python 3.12 (simulated). Run a script: python chat_app.py "your question"' };
  if (!SCRIPTS[file]) return { error: `python: can't open file '/home/learner/${file}': [Errno 2] No such file or directory\nScripts here: ${Object.keys(SCRIPTS).join(', ')}` };
  const argv = args.slice(1);
  const env = envOf(w);
  const emit = (ok: boolean, extra: Record<string, any> = {}) => w.emit('py.run', { file, ok, args: argv, ...extra });
  try {
    if (file === 'chat_app.py') {
      needPkgs(w, ['azure-ai-projects', 'azure-identity']);
      const [r] = fromProjectEndpoint(w);
      const dep = env.MODEL_DEPLOYMENT ?? 'gpt-4.1-mini';
      const q = argv.join(' ') || 'What can you help me with?';
      const sys = 'You are a friendly assistant for Contoso Retail. Answer in two sentences or fewer.';
      const a = chat(w, r, { deployment: dep, system: sys, user: q }, 'cli');
      const b = chat(w, r, { deployment: dep, system: `${sys} one sentence`, user: q, history: [{ role: 'user', text: q }, { role: 'assistant', text: a.text }] }, 'cli');
      emit(!a.blocked, { deployment: dep, multiTurn: true });
      return { out: `${a.text}\nIn short: ${b.text.split(/(?<=[.!?])\s+/)[0]}` };
    }
    if (file === 'agent_app.py') {
      needPkgs(w, ['azure-ai-projects', 'azure-identity']);
      const [r] = fromProjectEndpoint(w);
      const name = env.AGENT_NAME ?? 'support-agent';
      const qs = ['What is the refund limit for a damaged item?', 'And what is 15% of 4200?'];
      const outs = qs.map((q, i) => `You:   ${q}\nAgent: ${runAgent(w, r, { agent: name, input: q, turn: i + 1 }, 'cli').text}`);
      emit(true, { agent: name, turns: 2 });
      return { out: outs.join('\n\n') };
    }
    if (file === 'text_app.py') {
      needPkgs(w, ['azure-ai-textanalytics', 'azure-identity']);
      const r = fromResourceEndpoint(w);
      const t = argv.join(' ') || 'The room in Chennai was spotless and Priya at the front desk was lovely, but breakfast was cold.';
      const o = analyzeText(w, r, t, [...TEXT_FEATURES], 'cli');
      emit(true);
      return { out: Object.entries(o).map(([k, v]) => `${(k + ':').padEnd(13)} ${v}`).join('\n') };
    }
    if (file === 'speech_app.py') {
      needPkgs(w, ['azure-cognitiveservices-speech']);
      const r = fromResourceEndpoint(w);
      if (!env.SPEECH_KEY) throw new SimError(`KeyError: 'SPEECH_KEY'\nCopy key 1 from Keys and Endpoint: export SPEECH_KEY="<key>"`, 'Python');
      const heard = stt(w, r, 'question.wav', 'cli');
      const reply = argv.join(' ') || 'Our Chennai store opens at 10 AM on Sundays.';
      const spoke = tts(w, r, reply, env.VOICE ?? 'en-IN-NeerjaNeural', false, 'cli');
      emit(true, { voice: env.VOICE ?? 'en-IN-NeerjaNeural' });
      return { out: `Heard: ${heard}\n${spoke}\nSpoke: ${reply}` };
    }
    if (file === 'vision_app.py') {
      needPkgs(w, ['azure-ai-projects', 'azure-identity']);
      const [r] = fromProjectEndpoint(w);
      const img = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'shelf-photo.jpg';
      if (!SAMPLES[img] || SAMPLES[img].kind !== 'image') throw new SimError(`FileNotFoundError: '${img}' is not an image here. Try shelf-photo.jpg, car-damage.jpg or street-chennai.jpg.`, 'Python');
      const dep = env.MODEL_DEPLOYMENT ?? 'gpt-4.1-mini';
      const a = chat(w, r, { deployment: dep, user: 'Describe this photo and list anything that needs attention.', attach: img }, 'cli');
      let extra = '';
      const gi = argv.indexOf('--generate');
      if (gi >= 0) {
        const g = generateImage(w, r, { deployment: env.IMAGE_DEPLOYMENT ?? 'gpt-image-1', prompt: argv.slice(gi + 1).join(' ') }, 'cli');
        extra = g.blocked ? `\nImage blocked by the guardrail (${g.blocked}).` : '\nSaved generated.png';
      }
      emit(!a.blocked, { image: img, generated: gi >= 0 });
      return { out: `${a.text}${extra}` };
    }
    if (file === 'extract_app.py') {
      needPkgs(w, ['azure-ai-contentunderstanding', 'azure-identity']);
      const r = fromResourceEndpoint(w);
      const f = argv[0] ?? 'invoice-contoso.pdf';
      const an = argv[1] ?? SAMPLES[f]?.analyzer ?? 'prebuilt-invoice';
      const o = analyzeContent(w, r, an, f, 'cli');
      emit(true, { analyzer: an, sample: f });
      return { out: `${o.transcript ? `Transcript:\n${o.transcript}\n\n` : ''}${o.fields.map(([n, v, c]) => `${n}: ${v}  (confidence ${c.toFixed(2)})${c < 0.8 ? '  <-- send to a person' : ''}`).join('\n')}` };
    }
  } catch (e) {
    if (e instanceof SimError) { emit(false, { error: e.message.split('\n')[0] }); return { error: e.code === 'Python' ? `Traceback (most recent call last):\n  File "/home/learner/${file}", line 9, in <module>\n${e.message}` : `Traceback (most recent call last):\n  File "/home/learner/${file}"\nazure.core.exceptions.HttpResponseError: (${e.code}) ${e.message}` }; }
    throw e;
  }
  return { error: 'Not supported.' };
}

export const regionOk = (k: string) => k in REGIONS;
