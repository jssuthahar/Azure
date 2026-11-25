/**
 * AI-103 "text" practice labs (Text & Speech). Ids start agt-. Every task is
 * checked from simulator events, and every `cli` hint completes its task when
 * run as written, in order, in a fresh simulator (scripts/qa/lab-check.ts).
 * The Python apps live in src/lib/sim/agentdev/text.ts.
 */
import type { Sim } from '../engine';
import type { Lab } from '../labs';

const ev = (s: Sim, type: string, pred: (d: Record<string, any>) => boolean = () => true) => s.events.some((e) => e.type === type && pred(e.data));
const ran = (s: Sim, file: string) => ev(s, 'py.run', (d) => d.file === file && d.ok);

const RG = 'rg-agents-text';
const RES = 'contoso-agents-text';
const EP = `https://${RES}.services.ai.azure.com/`;
const SETUP = `az group create -n ${RG} -l eastus && az cognitiveservices account create -n ${RES} -g ${RG} -l eastus --kind AIServices --sku S0 --custom-domain ${RES} && az cognitiveservices account deployment create -n ${RES} -g ${RG} --deployment-name gpt-4.1-mini --model-name gpt-4.1-mini --model-format OpenAI --sku-name GlobalStandard --sku-capacity 10`;
const setupDone = (s: Sim) => ev(s, 'foundry.create', (d) => d.name === RES) && ev(s, 'ai.deploy', (d) => d.resource === RES && d.name === 'gpt-4.1-mini');

export const LABS: Lab[] = [
  /* ------------------------------------------------ entities, summaries, JSON */
  {
    id: 'agt-text-extract-json', title: 'Entities, summaries and strict JSON', icon: '🧾', level: 'Intermediate', minutes: 12, start: 'shell',
    intro: 'Fabrikam\'s support tickets arrive as free text. Your app must pull out who, what and when, mask personal data, summarise each ticket, and hand the ticketing system JSON it can trust. Try Azure Language first, then a model with structured outputs, then a compliance summary tuned to the domain.',
    learn: ['Named entities, PII redaction and abstractive summaries with Azure Language', 'Plain text vs JSON mode vs structured outputs (strict JSON schema)', 'Domain instructions and examples for compliance summaries', 'Resource endpoint and keyless sign-in (DefaultAzureCredential)'],
    topics: ['extract-entities-summaries-and-json'],
    tasks: [
      { text: `Create **${RG}**, a Foundry resource **${RES}** and a **gpt-4.1-mini** deployment (Global Standard).`, cli: SETUP, check: setupDone },
      { text: 'Install **azure-ai-textanalytics**, **azure-identity** and **openai**, then point **FOUNDRY_ENDPOINT** at the resource endpoint.', cli: `pip install azure-ai-textanalytics azure-identity openai && export FOUNDRY_ENDPOINT="${EP}"`, check: (s) => ev(s, 'pip.install', (d) => d.pkgs.includes('azure-ai-textanalytics') && d.pkgs.includes('openai')) && ev(s, 'env.set', (d) => d.name === 'FOUNDRY_ENDPOINT') },
      { text: 'Run **lang_entities.py** on **ticket.txt**: entities, redacted PII and a two-sentence abstractive summary from Azure Language.', cli: 'python lang_entities.py ticket.txt', check: (s) => ev(s, 'agt.text.language', (d) => d.features.includes('entities') && d.features.includes('pii') && d.summary === 'abstractive') },
      { text: 'Ask the model for the ticket in **JSON mode** (`--mode json_object`). Look at what\'s missing.', cli: 'python lang_json.py ticket.txt --mode json_object', check: (s) => ev(s, 'agt.text.json', (d) => d.mode === 'json_object') },
      { text: 'Read **ticket_schema.json**, then run again with **structured outputs** (`--schema`) so every reply matches it.', cli: 'cat ticket_schema.json && python lang_json.py ticket.txt --schema', check: (s) => ev(s, 'py.view', (d) => d.file === 'ticket_schema.json') && ev(s, 'agt.text.json', (d) => d.mode === 'json_schema' && d.strict && d.valid) },
      { text: 'Summarise **policy-update.txt** for the compliance team: first with no domain prompt, then with `--domain`.', cli: 'python lang_compliance.py policy-update.txt && python lang_compliance.py policy-update.txt --domain', check: (s) => ev(s, 'agt.text.compliance', (d) => !d.domain) && ev(s, 'agt.text.compliance', (d) => d.domain) },
    ],
    wrap: 'Azure Language gives you fixed, predictable outputs: prebuilt entity categories with confidence scores, PII redaction and summaries, from the resource endpoint. A model is more flexible, but free text and even JSON mode can\'t be trusted by code. Structured outputs with a strict JSON schema make the model return exactly your keys and types. For domain work such as compliance, the same model gets much better with a developer message that sets the role, the checklist, a glossary and a worked example, at temperature 0.',
  },

  /* ------------------------------------------------ sentiment, safety, PII, shields */
  {
    id: 'agt-text-safety', title: 'Sentiment, tone, harmful content and PII', icon: '🛡️', level: 'Intermediate', minutes: 12, start: 'shell',
    intro: 'Contoso\'s community app shows customer reviews and comments, and its support agent reads vendor emails. Score the reviews, catch the tone a classifier misses, hold back a threat, redact only the personal data policy requires, and stop a hidden prompt injection.',
    learn: ['Sentiment analysis with opinion mining', 'Tone labels from a model when sentiment isn\'t enough', 'Azure AI Content Safety severity levels and a block threshold', 'PII categories filter and Prompt Shields for documents'],
    topics: ['sentiment-safety-and-sensitive-content'],
    tasks: [
      { text: `Create **${RG}**, the Foundry resource **${RES}** and a **gpt-4.1-mini** deployment.`, cli: SETUP, check: setupDone },
      { text: 'Install **azure-ai-textanalytics**, **azure-ai-contentsafety**, **azure-identity**, **openai** and **requests**, and set **FOUNDRY_ENDPOINT**.', cli: `pip install azure-ai-textanalytics azure-ai-contentsafety azure-identity openai requests && export FOUNDRY_ENDPOINT="${EP}"`, check: (s) => ev(s, 'pip.install', (d) => d.pkgs.includes('azure-ai-contentsafety')) && ev(s, 'env.set', (d) => d.name === 'FOUNDRY_ENDPOINT') },
      { text: 'Score **reviews.txt** with opinion mining, then add `--tone` so a model labels the sarcastic one.', cli: 'python lang_sentiment.py reviews.txt && python lang_sentiment.py reviews.txt --tone', check: (s) => ev(s, 'agt.text.sentiment', (d) => d.opinion && !d.tone) && ev(s, 'agt.text.sentiment', (d) => d.tone) },
      { text: 'Moderate **comments.txt** with the default threshold (6), then set **BLOCK_AT=4** so the threat is held back.', cli: 'python lang_moderate.py comments.txt && export BLOCK_AT=4 && python lang_moderate.py comments.txt', check: (s) => ev(s, 'agt.text.moderate', (d) => d.blockAt === 6 && d.blocked === 0) && ev(s, 'agt.text.moderate', (d) => d.blockAt === 4 && d.blocked >= 1) },
      { text: 'Redact **chat-log.txt** but keep names readable: only **CreditCardNumber**, **PhoneNumber** and **Email**.', cli: 'python lang_pii.py chat-log.txt --categories CreditCardNumber PhoneNumber Email', check: (s) => ev(s, 'agt.text.pii', (d) => d.filtered && d.redacted.includes('CreditCardNumber') && !d.redacted.includes('Person')) },
      { text: 'Check **vendor-email.txt** with **Prompt Shields** before the agent reads it.', cli: 'python lang_shields.py vendor-email.txt', check: (s) => ev(s, 'agt.text.shield', (d) => d.documentAttack) },
    ],
    wrap: 'Sentiment analysis returns positive, neutral, negative or mixed with confidence scores, and opinion mining ties each opinion to its target. It\'s cheap and consistent but misses sarcasm, so a model with a schema-bound tone label fills that gap. Content Safety scores Hate, Sexual, Violence and Self-harm at severities 0, 2, 4 and 6; you pick the threshold. PII detection can redact every category or only the ones you list. Prompt Shields checks the user prompt and every document you add, which is how you catch an indirect prompt injection hidden in an email.',
  },

  /* ------------------------------------------------ translation */
  {
    id: 'agt-text-translate', title: 'Translate with Azure Translator or a model', icon: '🌐', level: 'Intermediate', minutes: 10, start: 'shell',
    intro: 'Contoso Pay sends refund messages in Tamil, Hindi and French. Translate with Azure Translator, keep the brand name intact, then try an LLM translation with a set tone and compare.',
    learn: ['Text translation to several languages in one call', 'The region header for multi-service resources', 'Dynamic dictionary to protect brand names', 'LLM translation with tone and glossary instructions'],
    topics: ['translate-text-with-foundry'],
    tasks: [
      { text: `Create **${RG}**, the Foundry resource **${RES}** and a **gpt-4.1-mini** deployment.`, cli: SETUP, check: setupDone },
      { text: 'Install **azure-ai-translation-text**, **azure-identity** and **openai**. Set **FOUNDRY_ENDPOINT**, **TRANSLATOR_KEY** and **TRANSLATOR_REGION** (eastus).', cli: `pip install azure-ai-translation-text azure-identity openai && export FOUNDRY_ENDPOINT="${EP}" && export TRANSLATOR_KEY="<key 1>" && export TRANSLATOR_REGION="eastus"`, check: (s) => ev(s, 'pip.install', (d) => d.pkgs.includes('azure-ai-translation-text')) && ev(s, 'env.set', (d) => d.name === 'TRANSLATOR_REGION') },
      { text: 'Translate the refund message into **Tamil, Hindi and French** in one call. Spot what happened to the brand name.', cli: 'python translate_text.py --to ta hi fr', check: (s) => ev(s, 'agt.text.translate', (d) => d.engine === 'translator' && d.targets.length >= 3 && !d.glossary) },
      { text: 'Run again with the **dynamic dictionary** (`--glossary`) so "Contoso Pay" stays as written.', cli: 'python translate_text.py --to ta hi fr --glossary', check: (s) => ev(s, 'agt.text.translate', (d) => d.engine === 'translator' && d.glossary) },
      { text: 'Translate into Hindi with the **model deployment** in a **formal** tone.', cli: 'export MODEL_DEPLOYMENT="gpt-4.1-mini" && python translate_llm.py --to hi --tone formal', check: (s) => ev(s, 'agt.text.translate', (d) => d.engine === 'llm' && d.tone === 'formal') },
    ],
    wrap: 'Azure Translator is the fast, predictable, per-character option: one call can return many target languages, it detects the source language, and a dynamic dictionary or a Custom Translator model keeps your terms right. A multi-service Foundry resource needs the region on every call. An LLM translation flow is slower and costs more, but it can follow a tone, a glossary and formatting rules written in plain words, so test it with an evaluation set before you ship it.',
  },

  /* ------------------------------------------------ speech */
  {
    id: 'agt-speech-agent', title: 'Give an agent a voice, then translate and reason over audio', icon: '🎙️', level: 'Intermediate', minutes: 15, start: 'shell',
    intro: 'Contoso Pharmacy wants a phone agent: it listens, answers and speaks back. Then it has to handle Hindi callers and let supervisors ask questions about recorded calls. Build the speech loop, fix misheard drug names, translate speech and send audio to an audio-capable model.',
    learn: ['Speech to text → model → text to speech for an agent', 'Phrase lists vs custom speech for domain words', 'SSML for clearer replies', 'Speech translation with TranslationRecognizer', 'Audio input to gpt-4o-audio-preview'],
    topics: ['speech-to-text-and-text-to-speech', 'speech-translation-and-audio-reasoning'],
    tasks: [
      { text: `Create **${RG}**, the Foundry resource **${RES}**, a **gpt-4.1-mini** deployment and a **gpt-4o-audio-preview** deployment.`, cli: `${SETUP} && az cognitiveservices account deployment create -n ${RES} -g ${RG} --deployment-name gpt-4o-audio-preview --model-name gpt-4o-audio-preview --model-format OpenAI --sku-name GlobalStandard --sku-capacity 10`, check: (s) => setupDone(s) && ev(s, 'ai.deploy', (d) => d.resource === RES && d.kind === 'audio') },
      { text: 'Install the **Speech SDK**, **azure-identity** and **openai**, then set **FOUNDRY_ENDPOINT** and **SPEECH_KEY**.', cli: `pip install azure-cognitiveservices-speech azure-identity openai && export FOUNDRY_ENDPOINT="${EP}" && export SPEECH_KEY="<key 1>"`, check: (s) => ev(s, 'pip.install', (d) => d.pkgs.includes('azure-cognitiveservices-speech')) && ev(s, 'env.set', (d) => d.name === 'SPEECH_KEY') },
      { text: 'Run the voice loop on **question.wav**: speech to text, the model, then text to speech with an **SSML** reply.', cli: 'python voice_agent.py question.wav --ssml', check: (s) => ev(s, 'agt.speech.loop', (d) => d.file === 'question.wav' && d.ssml) },
      { text: 'Run **pharmacy-call.wav** and watch the drug names go wrong. Then add a **phrase list** for Metformin and Atorvastatin.', cli: 'python voice_agent.py pharmacy-call.wav && python voice_agent.py pharmacy-call.wav --phrases "Metformin,Atorvastatin"', check: (s) => ev(s, 'agt.speech.loop', (d) => d.file === 'pharmacy-call.wav' && !d.correct) && ev(s, 'agt.speech.loop', (d) => d.file === 'pharmacy-call.wav' && d.correct) },
      { text: 'Translate the Hindi call **support-call-hi.wav** into **English and Tamil**, and speak the translation (`--voice`).', cli: 'python speech_translate.py support-call-hi.wav --from hi-IN --to en ta --voice', check: (s) => ev(s, 'agt.speech.translate', (d) => d.ok && d.targets.includes('en') && d.targets.includes('ta') && d.voice) },
      { text: 'Point **AUDIO_DEPLOYMENT** at the text-only **gpt-4.1-mini** and ask about **support-call.wav**. Read why it\'s refused.', cli: 'export AUDIO_DEPLOYMENT="gpt-4.1-mini" && python audio_reason.py support-call.wav "How did the customer feel?"', check: (s) => ev(s, 'agt.audio.reason', (d) => !d.ok) },
      { text: 'Switch **AUDIO_DEPLOYMENT** to **gpt-4o-audio-preview** and ask how the customer felt at the start and at the end.', cli: 'export AUDIO_DEPLOYMENT="gpt-4o-audio-preview" && python audio_reason.py support-call.wav "How did the customer feel at the start and at the end?"', check: (s) => ev(s, 'agt.audio.reason', (d) => d.ok) && ran(s, 'audio_reason.py') },
    ],
    wrap: 'A voice agent is three steps you can swap: speech to text, the model or agent, and text to speech with a neural voice and SSML. When domain words come out wrong, try a phrase list first; train a custom speech model when phrase lists aren\'t enough. Speech translation recognises one spoken language and returns text in several, and can speak the result. For questions about how something was said, send the audio itself to an audio-capable model; a text-only deployment rejects input_audio.',
  },
];
