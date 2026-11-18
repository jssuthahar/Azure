/**
 * Exam-format practice items for the AI-901 mock exam (Yes/No series,
 * matching, ordering, drop-down completion). Every item is ORIGINAL, written
 * from the official skills outline; none are real or recalled exam questions.
 */
import type { FormatItem } from '../az-900/exam-items';

export const EXAM_ITEMS: FormatItem[] = [
  /* ---------------- Domain 1: AI concepts ---------------- */
  { kind: 'yesno', id: 'ai-x1-yn-rai', domain: 1, objective: '1.1.1', statements: [
    { text: 'Testing a loan-approval model separately for different demographic groups supports the fairness principle.', answer: true },
    { text: 'Telling users that they are chatting with an AI system supports the transparency principle.', answer: true },
    { text: 'Adding live captions to a video app primarily supports the accountability principle.', answer: false },
  ], explanation: 'Group-by-group testing checks **fairness**. Disclosing AI use is **transparency**. Captions make the app usable by more people, which is **inclusiveness**.' },
  { kind: 'match', id: 'ai-x1-match-workload', domain: 1, objective: '1.3.1', question: 'Match each scenario to the AI workload.', itemsLabel: 'Workloads', items: ['Text analysis', 'Speech', 'Computer vision', 'Information extraction'], targets: [
    { text: 'Detect whether hotel reviews are positive or negative', answer: 0 },
    { text: 'Produce live captions for a webinar', answer: 1 },
    { text: 'Count empty spaces on a supermarket shelf photo', answer: 2 },
    { text: 'Read the vendor name and total from scanned invoices', answer: 3 },
  ], explanation: 'Sentiment is **text analysis**, captions are **speech to text**, analysing a photo is **computer vision**, and pulling fields from documents is **information extraction**.' },
  { kind: 'dropdown', id: 'ai-x1-dd-temp', domain: 1, objective: '1.2.3', question: 'Complete the sentence.', parts: [
    'To make a model’s answers more consistent and repeatable, you should ',
    { options: ['increase the temperature', 'decrease the temperature', 'increase the max output tokens', 'add more past messages'], answer: 1 },
    '.',
  ], explanation: 'Lower **temperature** makes the model pick the most likely tokens, so answers vary less.' },
  { kind: 'order', id: 'ai-x1-order-genai', domain: 1, objective: '1.2.1', question: 'Put the steps a generative language model follows in order.', actions: ['Convert the prompt into tokens', 'Represent each token as an embedding', 'Process the embeddings through transformer layers using attention', 'Predict the probability of the next token', 'Append the chosen token and repeat'], answer: [0, 1, 2, 3, 4], explanation: 'Text becomes **tokens**, tokens become **embeddings**, **attention** layers build context, the model scores the **next token**, and generation repeats one token at a time.' },
  { kind: 'yesno', id: 'ai-x1-yn-models', domain: 1, objective: '1.2.2', statements: [
    { text: 'An embedding model can be used to answer chat questions directly.', answer: false },
    { text: 'A multimodal model can accept an image as part of a prompt.', answer: true },
    { text: 'A small language model is typically cheaper and faster than a large language model.', answer: true },
  ], explanation: 'Embedding models produce **vectors** for search, not chat answers. Multimodal models read images. Small language models trade some capability for speed and cost.' },
  { kind: 'match', id: 'ai-x1-match-text', domain: 1, objective: '1.3.2', question: 'Match each text analysis technique to its output.', itemsLabel: 'Techniques', items: ['Key phrase extraction', 'Named entity recognition', 'Sentiment analysis', 'Summarization'], targets: [
    { text: '“room”, “front desk”, “breakfast”', answer: 0 },
    { text: '“Chennai” (Location), “Priya” (Person)', answer: 1 },
    { text: 'Mixed: positive 0.61, negative 0.37', answer: 2 },
    { text: '“Clean room and friendly staff, but a cold breakfast.”', answer: 3 },
  ], explanation: 'Key phrases are the main talking points, entities are typed names, sentiment is a label with scores, and a summary is a shorter version of the text.' },
  /* ---------------- Domain 2: Microsoft Foundry ---------------- */
  { kind: 'order', id: 'ai-x2-order-chatapp', domain: 2, objective: '2.1.3', question: 'You are building a lightweight chat client with the Foundry SDK. Put the steps in order.', actions: ['Deploy a model in the Foundry project', 'Install azure-ai-projects and azure-identity', 'Create an AIProjectClient with the project endpoint and DefaultAzureCredential', 'Call get_openai_client()', 'Call responses.create with the deployment name and the user input'], answer: [0, 1, 2, 3, 4], explanation: 'The app needs a **deployment** first, then the SDK packages, then an **AIProjectClient** signed in with Entra ID, an OpenAI-compatible client, and a **responses.create** call that uses the **deployment name**.' },
  { kind: 'dropdown', id: 'ai-x2-dd-agent', domain: 2, objective: '2.1.4', question: 'Complete the sentence.', parts: [
    'An agent that must answer questions from your company’s policy PDF should be given the ',
    { options: ['code interpreter tool', 'file search tool', 'image generation tool', 'Batch deployment type'], answer: 1 },
    ' and instructions that tell it to use the policy.',
  ], explanation: '**File search** indexes uploaded documents so the agent can ground its answers in them.' },
  { kind: 'yesno', id: 'ai-x2-yn-cu', domain: 2, objective: '2.4.1', statements: [
    { text: 'Content Understanding returns a confidence score for extracted field values.', answer: true },
    { text: 'The “extract” field method can be used on video files.', answer: false },
    { text: 'You can create a custom analyzer that derives from prebuilt-image.', answer: true },
  ], explanation: 'Fields carry **confidence scores**. **Extract** works for documents only; image, audio and video fields use **classify** or **generate**. Custom analyzers derive from a base analyzer such as **prebuilt-image**.' },
  { kind: 'match', id: 'ai-x2-match-tool', domain: 2, objective: '2.2.3', question: 'Match each requirement to the Foundry capability.', itemsLabel: 'Capabilities', items: ['Azure Speech', 'Azure Language', 'Content Understanding', 'gpt-image-1'], targets: [
    { text: 'Read a reply aloud with an Indian English neural voice', answer: 0 },
    { text: 'Mask phone numbers in chat transcripts', answer: 1 },
    { text: 'Summarise recorded support calls and label speakers', answer: 2 },
    { text: 'Create a poster from a text description', answer: 3 },
  ], explanation: 'Neural voices are **Azure Speech**; PII redaction is **Azure Language**; **Content Understanding** (prebuilt-audioSearch) summarises calls with speaker labels; **gpt-image-1** generates images.' },
  { kind: 'dropdown', id: 'ai-x2-dd-image', domain: 2, objective: '2.3.1', question: 'Complete the code comment.', parts: [
    'To ask a multimodal deployment about a photo, add a content part of type ',
    { options: ['input_text', 'input_image', 'input_audio', 'output_image'], answer: 1 },
    ' that contains the image URL or base64 data.',
  ], explanation: 'Images go into the prompt as an **input_image** part next to the **input_text** question.' },
  { kind: 'yesno', id: 'ai-x2-yn-portal', domain: 2, objective: '2.1.2', statements: [
    { text: 'Your application calls a deployed model by using the deployment name.', answer: true },
    { text: 'The system message in the chat playground applies to every turn of the conversation.', answer: true },
    { text: 'You must write code before you can test a deployed model in Foundry.', answer: false },
  ], explanation: 'Apps reference the **deployment name**. The **system message** sets rules for every turn. The **playground** lets you test with no code.' },
];
