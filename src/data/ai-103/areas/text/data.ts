/**
 * AI-103 text area: problem cards, exam-format items, games, comparisons and
 * service cards. Every item is ORIGINAL, written from the official skills
 * outline; none are real or recalled exam questions. Prices are illustrative
 * and shown in the learner's currency. Facts checked on Microsoft Learn,
 * 25 Nov 2026.
 */
import type { ProblemSolution } from '../../../az-900/problem-solution';
import type { FormatItem } from '../../../az-900/exam-items';
import type { SortSet, Riddle } from '../../../az-900/games';
import type { Comparison } from '../../../az-900/compare';
import type { Service } from '../../../az-900/services';

const ps = (problem: string, solution: string, tool: string, pairs: [string, string, string][]): ProblemSolution => ({ problem, solution, tool, pairs: pairs.map(([icon, pain, fix]) => ({ icon, pain, fix })) });

export const PROBLEMS: Record<string, ProblemSolution> = {
  'extract-entities-summaries-and-json': ps('Support tickets are free text, and the ticketing system needs clean fields it can trust.', 'Use Azure Language for fixed entity categories, and a model with a strict JSON schema for your own fields.', 'Azure Language and structured outputs', [['📝', 'People, places and dates buried in text', 'Azure Language named entity recognition'], ['🧾', 'The model invents its own JSON keys', 'A JSON schema with strict: true'], ['📜', 'Summaries that miss amounts and control IDs', 'A domain prompt with a checklist and an example']]),
  'sentiment-safety-and-sensitive-content': ps('A sarcastic complaint was scored positive, and a threat sat on the community page for two days.', 'Add a tone label from a model, score harm with Content Safety and check documents with Prompt Shields.', 'Sentiment, Content Safety and PII detection', [['😒', 'Sarcasm reads as positive', 'A model tone label with an enum schema'], ['🚨', 'Threats and abuse in comments', 'Content Safety severity with your own threshold'], ['🔏', 'Card numbers in chat logs', 'PII detection limited to the right categories'], ['🧨', 'Instructions hidden in an email', 'Prompt Shields for documents']]),
  'translate-text-with-foundry': ps('Refund messages must reach customers in three languages, and the brand name keeps getting translated.', 'Use Azure Translator for volume, protect terms with a dynamic dictionary, and use an LLM flow when tone matters.', 'Azure Translator and LLM translation', [['🌐', 'Many languages in one call', 'Translator with several target languages'], ['🏷️', 'Brand name translated like a normal word', 'Dynamic dictionary or Custom Translator'], ['🎩', 'Needs a formal, polite tone', 'A model with tone instructions']]),
  'speech-to-text-and-text-to-speech': ps('The phone agent mishears drug names and sounds like a robot reading numbers.', 'Use a phrase list or custom speech for the vocabulary and SSML for the delivery.', 'Azure Speech', [['💊', 'A few words misheard', 'A phrase list'], ['🎧', 'Many terms, accents or noisy lines', 'A custom speech model and endpoint ID'], ['🔊', 'Flat, rushed replies', 'SSML with breaks and prosody'], ['📞', 'Slow, stitched-together voice loop', 'Voice Live']]),
  'speech-translation-and-audio-reasoning': ps('Hindi callers need English and Tamil text, and supervisors ask how upset a caller sounded.', 'Translate the speech with Azure Speech, and send the recording to an audio-capable model for tone.', 'Speech translation and audio models', [['🗣️', 'Spoken Hindi to text in two languages', 'TranslationRecognizer with target languages'], ['🎧', 'A question about tone and pace', 'An audio-capable deployment such as gpt-4o-audio-preview'], ['⛔', '400 error on input_audio', 'Deploy an audio-capable model']]),
};

export const ITEMS: FormatItem[] = [
  { kind: 'yesno', id: 'agt-x4-yn-json', domain: 4, objective: '4.1.1', statements: [
    { text: 'JSON mode guarantees that the reply contains every field your application expects.', answer: false },
    { text: 'Structured outputs with strict set to true force the reply to follow the supplied JSON schema.', answer: true },
    { text: 'Azure Language named entity recognition can return categories that you invented without any training.', answer: false },
  ], explanation: '**JSON mode** only promises syntactically valid JSON. **Structured outputs** with a strict schema enforce the shape. Prebuilt entity recognition returns fixed categories; your own types need **custom NER** or a model prompt.' },
  { kind: 'match', id: 'agt-x4-match-safety', domain: 4, objective: '4.1.2', question: 'Match each requirement to the feature that meets it.', itemsLabel: 'Features', items: ['Sentiment analysis with opinion mining', 'Content Safety text moderation', 'PII detection with a categories filter', 'Prompt Shields'], targets: [
    { text: 'Find which part of a hotel stay a reviewer disliked', answer: 0 },
    { text: 'Hold back a comment that scores Violence 4', answer: 1 },
    { text: 'Mask card numbers but leave first names readable', answer: 2 },
    { text: 'Detect hidden instructions in an attached document', answer: 3 },
  ], explanation: '**Opinion mining** ties opinions to targets. **Content Safety** returns severities per harm category. **PII detection** can be limited to listed categories. **Prompt Shields** checks user prompts and documents for attacks.' },
  { kind: 'dropdown', id: 'agt-x4-dd-translate', domain: 4, objective: '4.1.3', question: 'Complete the statements about translation in Foundry.', parts: [
    'To keep the product name Contoso Pay unchanged in every language, add a ',
    { options: ['dynamic dictionary entry', 'second target language', 'higher temperature', 'content filter'], answer: 0 },
    '. When tone and formatting rules must be followed from plain instructions, use ',
    { options: ['an LLM translation flow', 'language detection only', 'a transliteration call', 'key phrase extraction'], answer: 0 },
    '.',
  ], explanation: 'A **dynamic dictionary** (or Custom Translator) protects terms. An **LLM flow** follows tone instructions but costs more and varies, so evaluate it.' },
  { kind: 'order', id: 'agt-x4-order-speech', domain: 4, objective: '4.2.1', question: 'A phone agent must answer spoken questions. Which four steps run in order for one turn?', actions: ['Convert the caller audio to text with speech to text', 'Send the text to the model or agent', 'Convert the reply to audio with text to speech', 'Play the audio to the caller', 'Train a custom neural voice'], answer: [0, 1, 2, 3], explanation: 'One turn is **speech to text**, the **model or agent**, **text to speech**, then playback. Training a custom voice is a separate project, not part of each turn.' },
  { kind: 'yesno', id: 'agt-x4-yn-audio', domain: 4, objective: '4.2.3', statements: [
    { text: 'A text-only deployment such as gpt-4.1-mini accepts input_audio content parts.', answer: false },
    { text: 'To judge how upset a caller sounded, an audio-capable model gives more than a transcript alone.', answer: true },
    { text: 'Speech translation can return text in several target languages from one recognition pass.', answer: true },
  ], explanation: 'Audio input needs an **audio-capable** deployment. A transcript drops tone and pace. **Speech translation** accepts several target languages in one pass.' },
];

export const SORT: SortSet[] = [
  {
    id: 'agt-text-which-tool', title: 'Which tool reads the text?', icon: '📝', intro: 'Pick the best fit for each text or speech job.', topic: 'extract-entities-summaries-and-json',
    buckets: ['Azure Language', 'A model deployment', 'Azure Translator', 'Azure Speech'],
    items: [
      { text: 'Redact phone numbers and emails from chat logs', bucket: 0, why: 'PII detection is a prebuilt Azure Language feature.' },
      { text: 'Return a ticket as JSON matching your own schema', bucket: 1, why: 'Structured outputs with a strict schema come from a model.' },
      { text: 'Label sarcasm with an enum of tones', bucket: 1, why: 'Sentiment misses sarcasm; a model with a schema catches it.' },
      { text: 'Translate 40,000 messages into Tamil, Hindi and French', bucket: 2, why: 'Translator is fast and priced per character.' },
      { text: 'Transcribe a pharmacy call', bucket: 3, why: 'Speech to text is Azure Speech.' },
      { text: 'Speak a reply with a pause before the time', bucket: 3, why: 'Text to speech with SSML.' },
      { text: 'Score each review as positive, neutral, negative or mixed', bucket: 0, why: 'Sentiment analysis is an Azure Language feature.' },
      { text: 'Write a compliance summary in a fixed layout', bucket: 1, why: 'A domain prompt on a model controls the layout.' },
    ],
  },
];

export const RIDDLES: Riddle[] = [
  { answer: 'Structured outputs', topic: 'extract-entities-summaries-and-json', clues: ['I make a model follow a schema.', 'Set strict to true and every field is required.', 'JSON mode is my weaker cousin.'] },
  { answer: 'Opinion mining', topic: 'sentiment-safety-and-sensitive-content', clues: ['I live inside sentiment analysis.', 'I tie each opinion to its target.', 'Breakfast was cold, wifi dropped: I tell you which.'] },
  { answer: 'Prompt Shields', topic: 'sentiment-safety-and-sensitive-content', clues: ['I read prompts and documents.', 'I look for jailbreaks and hidden instructions.', 'A vendor email saying “ignore previous instructions” is my catch.'] },
  { answer: 'Dynamic dictionary', topic: 'translate-text-with-foundry', clues: ['I live inside a Translator request.', 'I keep a brand name as written.', 'No training needed, unlike Custom Translator.'] },
  { answer: 'SSML', topic: 'speech-to-text-and-text-to-speech', clues: ['I am markup, not a service.', 'I add pauses and change the speaking rate.', 'I decide how a neural voice delivers the words.'] },
  { answer: 'Phrase list', topic: 'speech-to-text-and-text-to-speech', clues: ['I boost a few words in recognition.', 'I need no training and no data upload.', 'Use me before custom speech.'] },
];

export const COMPARE: Comparison[] = [
  {
    slug: 'azure-translator-vs-llm-translation',
    title: 'Azure Translator vs LLM Translation in Foundry',
    seoTitle: 'Azure Translator vs LLM Translation | AI-103',
    description: 'Azure Translator compared with an LLM translation flow in Microsoft Foundry: speed, cost, consistency, tone control and how to protect brand terms.',
    answer: 'Use **Azure Translator** for volume, speed and the same output every time. Use an **LLM translation flow** when tone, context or formatting rules matter, and evaluate it before release. Protect brand terms with a **dynamic dictionary** or **Custom Translator** in Translator, or a glossary in the prompt for a model.',
    cols: ['Azure Translator', 'LLM translation flow'],
    rows: [
      ['Billing', 'Per character', 'Per token, usually higher'],
      ['Speed', 'Very fast, many languages in one call', 'Slower, one prompt per language'],
      ['Consistency', 'Same input, same output', 'Can vary between runs'],
      ['Tone and style', 'Limited', 'Follows instructions in plain words'],
      ['Your terms', 'Dynamic dictionary, Custom Translator', 'Glossary written in the prompt'],
      ['Typical use', 'Chat, documents and catalogs at volume', 'Marketing copy, formal letters, mixed formats'],
    ],
    pick: [['Azure Translator', 'volume and speed matter, or output must be steady'], ['An LLM flow', 'tone, politeness or layout rules decide quality']],
    examTip: '“Translate 1 million messages cheaply and consistently” = **Translator**. “Keep a formal tone and keep numbers as digits” = **LLM flow**. “Brand name must not change” = **dynamic dictionary**.',
    sim: { mode: 'agenttext', start: 4, tour: 'agt-text-translate', intro: 'Translate three ways and compare.' },
    lessons: ['translate-text-with-foundry'],
    faq: [['Does Translator detect the source language?', 'Yes. Leave the source out and it detects the language and returns the detected language with a score.'], ['Can one Translator call return several languages?', 'Yes. Pass several target languages in the same request.']],
  },
  {
    slug: 'sentiment-vs-tone-vs-content-safety',
    title: 'Sentiment Analysis vs Model Tone Labels vs Content Safety',
    seoTitle: 'Sentiment vs Tone vs Content Safety | AI-103',
    description: 'How sentiment analysis, a model tone label and Azure Content Safety differ, and which one catches sarcasm, threats and hidden prompt attacks.',
    answer: 'Use **sentiment analysis** for cheap, steady scores at volume. Add a **model tone label** with an enum schema when sarcasm or anger matters. Use **Content Safety** to score harm, and **Prompt Shields** to catch attacks in prompts and documents.',
    cols: ['Sentiment analysis', 'Model tone label', 'Content Safety', 'Prompt Shields'],
    rows: [
      ['Question answered', 'Is this positive or negative?', 'What is the tone: sarcastic, angry, polite?', 'Is this harmful?', 'Is this an attack on the model?'],
      ['Output', 'Label and confidence scores', 'An enum value you define', 'Severity 0, 2, 4 or 6 per category', 'Attack detected or not'],
      ['Catches sarcasm', 'No', 'Yes, usually', 'No', 'No'],
      ['Checks documents', 'Per document or sentence', 'Per prompt', 'Per text', 'User prompt and documents'],
      ['Cost feel', 'Low', 'Higher (tokens)', 'Low', 'Low'],
    ],
    pick: [['Sentiment', 'you score thousands of reviews cheaply'], ['A tone label', 'escalation depends on anger or sarcasm'], ['Content Safety', 'you must hold back harmful content'], ['Prompt Shields', 'the agent reads outside text']],
    examTip: '“Which part of the review was negative?” = **opinion mining**. “Block violent comments” = **Content Safety** threshold. “Hidden instructions in a document” = **Prompt Shields**.',
    sim: { mode: 'agenttext', start: 2, tour: 'agt-text-sentiment-safety', intro: 'Score a review, then a sarcastic one.' },
    lessons: ['sentiment-safety-and-sensitive-content'],
    faq: [['What severity levels does text moderation return?', 'By default the four-level output returns 0, 2, 4 or 6 for each harm category.'], ['Is sentiment a safety feature?', 'No. It measures opinion, not harm. Use Content Safety for harm.']],
  },
];

export const SERVICES: Service[] = [
  { slug: 'azure-language-foundry', name: 'Azure Language in Foundry Tools', cat: 'AI tools', icon: '📝', model: 'Prebuilt and custom text analysis', what: 'Prebuilt text features such as named entity recognition, PII detection, sentiment with opinion mining, key phrases and summarization, plus custom NER and classification trained on your own labelled data.', use: ['Entities and PII in tickets and chats', 'Sentiment at volume', 'Summaries and your own entity types'], avoid: ['Free-form generation (use a model)', 'Sarcasm and tone judgments'], feel: 1, price: 'Billed per 1,000 text records, with a free tier for testing (illustrative)', sim: { mode: 'agenttext', start: 0, tour: 'agt-text-extract-json', intro: 'Extract entities from a ticket.' }, similar: ['azure-translator-foundry', 'azure-speech-foundry'], aws: 'Amazon Comprehend', lesson: 'extract-entities-summaries-and-json' },
  { slug: 'azure-translator-foundry', name: 'Azure Translator in Foundry Tools', cat: 'AI tools', icon: '🌐', model: 'Neural text translation', what: 'Text and document translation with language detection, several targets per call, dynamic dictionaries and Custom Translator for your domain terms.', use: ['Translating chat and email at volume', 'Keeping brand names unchanged', 'Multi-language customer messages'], avoid: ['Tone-sensitive marketing copy (try an LLM flow)'], feel: 1, price: 'Billed per million characters, with a free monthly allowance (illustrative)', sim: { mode: 'agenttext', start: 4, tour: 'agt-text-translate', intro: 'Translate to three languages.' }, similar: ['azure-language-foundry', 'azure-speech-foundry'], aws: 'Amazon Translate', lesson: 'translate-text-with-foundry', compare: 'azure-translator-vs-llm-translation' },
  { slug: 'azure-speech-foundry', name: 'Azure Speech in Foundry Tools', cat: 'AI tools', icon: '🎙️', model: 'Speech to text, text to speech, translation', what: 'Real-time and batch speech to text, neural text to speech with SSML, speech translation, custom speech models and Voice Live for low-latency speech agents.', use: ['Phone and voice agents', 'Call transcription', 'Speech translation across languages'], avoid: ['Judging tone from audio (use an audio-capable model)'], feel: 2, price: 'Billed per hour of audio for recognition and per million characters for synthesis (illustrative)', sim: { mode: 'agenttext', start: 5, tour: 'agt-speech-voice-agent', intro: 'Run the voice loop.' }, similar: ['azure-language-foundry', 'azure-translator-foundry'], aws: 'Amazon Transcribe and Polly', lesson: 'speech-to-text-and-text-to-speech' },
  { slug: 'azure-content-safety-text', name: 'Azure Content Safety text moderation', cat: 'AI tools', icon: '🛡️', model: 'Harm scoring and Prompt Shields', what: 'Scores text for Hate, Sexual, Violence and Self-harm at severity levels, and Prompt Shields detects user prompt attacks and indirect attacks in documents.', use: ['Moderating comments', 'Checking documents before an agent reads them'], avoid: ['Measuring opinion (use sentiment)'], feel: 1, price: 'Billed per 1,000 text records (illustrative)', sim: { mode: 'agenttext', start: 3, tour: 'agt-text-sentiment-safety', intro: 'Hold back a threat and stop an injection.' }, similar: ['azure-language-foundry'], aws: 'Amazon Bedrock Guardrails', lesson: 'sentiment-safety-and-sensitive-content', compare: 'sentiment-vs-tone-vs-content-safety' },
];
