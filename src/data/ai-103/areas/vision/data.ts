/**
 * AI-103 vision area: problem cards, exam-format items, games, comparisons and
 * service cards. Every item is ORIGINAL, written from the official skills
 * outline; none are real or recalled exam questions. Prices ($) are
 * illustrative and shown in the learner's currency. Facts checked on
 * Microsoft Learn, 25 Nov 2026 (Sora 2 is in preview and may change).
 */
import type { ProblemSolution } from '../../../az-900/problem-solution';
import type { FormatItem } from '../../../az-900/exam-items';
import type { SortSet, Riddle } from '../../../az-900/games';
import type { Comparison } from '../../../az-900/compare';
import type { Service } from '../../../az-900/services';

const ps = (problem: string, solution: string, tool: string, pairs: [string, string, string][]): ProblemSolution => ({ problem, solution, tool, pairs: pairs.map(([icon, pain, fix]) => ({ icon, pain, fix })) });

export const PROBLEMS: Record<string, ProblemSolution> = {
  'image-generation-and-editing': ps('The design team needs fifty product backgrounds by Friday, and every edit redraws the whole picture.', 'Generate with a gpt-image deployment and use a mask so only the background changes.', 'gpt-image in Foundry', [['🎨', 'Blank page for every banner', 'Prompt with size, quality and format'], ['🖌️', 'An edit changes the logo too', 'A mask: transparent where change is allowed'], ['🧊', 'A cut-out needs a clear background', 'PNG with background set to transparent']]),
  'video-generation-and-editing': ps('Marketing wants a ten-second product clip in two formats, and one small lighting change means starting over.', 'Create the video as an asynchronous Sora 2 job, anchor it with a reference image and remix instead of regenerating.', 'Sora 2 in Foundry', [['⏳', 'The web request times out', 'Create, poll the status, then download'], ['🖼️', 'The kettle looks different in every shot', 'An input reference of the same size'], ['🔁', 'A tiny change means a new video', 'Remix the finished video with one change']]),
  'multimodal-image-understanding': ps('A claims team reads 2,000 car photos a day, and the website images have no alt text.', 'Send the photos to a multimodal model with a prompt per job: caption, grounded question or alt text.', 'Vision-enabled chat models', [['💬', 'Gallery needs short captions', 'A concise caption prompt'], ['❓', 'Which door is damaged?', 'A question grounded in visible evidence'], ['♿', 'Screen readers hear nothing', 'Alt text with purpose, short and readable text']]),
  'content-understanding-for-images-and-video': ps('Free-text answers about photos and videos can\'t go straight into the claims or training database.', 'Run an analyzer so every photo or video segment returns the same typed fields.', 'Content Understanding in Foundry Tools', [['🧩', 'Every reply has a different shape', 'A custom analyzer with a field schema'], ['🎞️', 'A 12-minute video is one blob', 'Segmentation into scenes with key frames'], ['📍', 'Where in the picture is it?', 'Generate fields or model-returned regions']]),
  'responsible-ai-for-visual-content': ps('A customer photo with a sticky note almost made the agent refund an order, and an ad went out with a competitor\'s logo.', 'Gate images with guardrails, treat text in images as data and enforce brand rules with a custom analyzer.', 'Guardrails, Prompt Shields and Content Understanding', [['🚫', 'Harmful images reach users', 'Image harm controls with a threshold'], ['🧨', 'Orders hidden inside a photo', 'Prompt Shields, data-only system message, approval'], ['📋', 'Banned logo in an ad', 'A classify field in a custom analyzer']]),
};

export const ITEMS: FormatItem[] = [
  { kind: 'yesno', id: 'agt-x3-yn-imageedit', domain: 3, objective: '3.1.3', statements: [
    { text: 'In an image edit request, the transparent area of the mask identifies the part of the image that may be changed.', answer: true },
    { text: 'The mask for an image edit can have different dimensions from the image if it is a PNG.', answer: false },
    { text: 'If no mask is supplied, the model is guaranteed to change only the area described in the prompt.', answer: false },
  ], explanation: 'The **transparent** pixels in the mask mark what may be repainted. The mask must have the **same dimensions** as the image. Without a mask the prompt is the only guide, so the model can change other areas too.' },
  { kind: 'dropdown', id: 'agt-x3-dd-imageformat', domain: 3, objective: '3.1.5', question: 'Complete the statements about gpt-image generation settings.', parts: [
    'To produce a logo with a transparent background, set the output format to ',
    { options: ['PNG', 'JPEG', 'WEBP', 'GIF'], answer: 0 },
    ' and the background to transparent. The model returns the image as ',
    { options: ['base64-encoded data', 'a temporary download URL', 'a Blob Storage SAS link', 'a streaming MP4'], answer: 0 },
    '.',
  ], explanation: 'A transparent background needs **PNG**, and WEBP isn\'t supported for output here. gpt-image models return **base64** image data, not a URL.' },
  { kind: 'order', id: 'agt-x3-order-video', domain: 3, objective: '3.1.2', question: 'An application must create a video with Sora 2 from a reference image. Which four actions should the application perform in sequence?', actions: ['Submit the create request with the prompt, size, duration and input reference', 'Poll the video job until its status is completed', 'Download the video content', 'Deploy the sora-2 model on the Foundry resource', 'Delete all existing videos from storage'], answer: [3, 0, 1, 2], explanation: 'Deploy the model first. Then create the job, poll until it is **completed**, and download the content. Deleting other videos is not part of the flow.' },
  { kind: 'match', id: 'agt-x3-match-understanding', domain: 3, objective: '3.2.4', question: 'Match each requirement to the technique that meets it.', itemsLabel: 'Techniques', items: ['Concise caption prompt', 'Alt text prompt with accessibility rules', 'Grounded visual question prompt', 'Custom Content Understanding analyzer'], targets: [
    { text: 'Show a one-sentence description under each thumbnail in a gallery', answer: 0 },
    { text: 'Give a screen reader the purpose of an image on a web page', answer: 1 },
    { text: 'Answer “which door is damaged?” and say so when the photo does not show the answer', answer: 2 },
    { text: 'Store the same typed fields for every submitted photo in a claims database', answer: 3 },
  ], explanation: 'A **concise** prompt gives short captions. **Alt text** follows accessibility rules (purpose, brevity). A **grounded** prompt limits answers to visible evidence. A **custom analyzer** returns the same field schema every time.' },
  { kind: 'yesno', id: 'agt-x3-yn-cu', domain: 3, objective: '3.2.6', statements: [
    { text: 'A video analyzer with segmentation enabled can return separate fields, key frames and transcript lines for each segment.', answer: true },
    { text: 'The extract method can be used for fields in a custom image analyzer.', answer: false },
    { text: 'With segmentation disabled, a video analyzer treats the whole video as one segment.', answer: true },
  ], explanation: 'Segmentation splits video into scenes, each with its own results. The **extract** method reads values written in a document; for images use **generate** or **classify**. Without segmentation the whole video is one content item.' },
  { kind: 'match', id: 'agt-x3-match-safety', domain: 3, objective: '3.3.2', question: 'Match each risk to the mitigation that addresses it most directly.', itemsLabel: 'Mitigations', items: ['Image harm controls in a guardrail', 'Prompt Shields on text read from the image', 'A custom analyzer with classify fields', 'Require approval on the refund tool'], targets: [
    { text: 'Uploaded images show graphic violence', answer: 0 },
    { text: 'A photo contains handwriting that tells the model to ignore its instructions', answer: 1 },
    { text: 'Advertising images must be rejected when a competitor logo appears', answer: 2 },
    { text: 'An injection succeeds, but money must still never move without a person agreeing', answer: 3 },
  ], explanation: 'Harm categories are handled by **guardrail image controls**. Hidden orders in an image are **indirect prompt injection**, found with Prompt Shields. Brand rules are **your own policy**, so classify them with a custom analyzer. **Approval** limits the damage when a defence fails.' },
];

export const SORT: SortSet[] = [
  {
    id: 'agt-vision-which-tool', title: 'Which vision tool?', icon: '👁️', intro: 'Pick the Foundry capability that fits each visual job.', topic: 'multimodal-image-understanding',
    buckets: ['Generate or edit pixels', 'Understand with a model', 'Extract typed fields', 'Keep it safe'],
    items: [
      { text: 'Make a banner from a text brief', bucket: 0, why: 'A gpt-image deployment generates images from prompts.' },
      { text: 'Repaint only the sky in a shop photo', bucket: 0, why: 'An image edit with a mask limits the change.' },
      { text: 'Write alt text for a product page', bucket: 1, why: 'A multimodal chat model with accessibility rules in the prompt.' },
      { text: 'Answer “what is damaged?” from a photo', bucket: 1, why: 'Visual question answering grounded in what is visible.' },
      { text: 'Return DamageType and Notes for every claim photo', bucket: 2, why: 'A Content Understanding custom analyzer with a field schema.' },
      { text: 'Split a training video into topics with transcripts', bucket: 2, why: 'Video segmentation in a Content Understanding analyzer.' },
      { text: 'Stop a note inside a photo from steering the agent', bucket: 3, why: 'Prompt Shields, a data-only system message and approvals.' },
      { text: 'Reject ads that carry a banned logo', bucket: 3, why: 'A visual policy check with classify fields.' },
    ],
  },
  {
    id: 'agt-vision-sora-rules', title: 'Sora 2: allowed or rejected?', icon: '🎬', intro: 'Decide how the service treats each input.', topic: 'video-generation-and-editing',
    buckets: ['Works', 'Rejected'],
    items: [
      { text: 'A 1280x720 product photo as the reference for a 1280x720 video', bucket: 0, why: 'The reference matches the video size.' },
      { text: 'A 12-second video', bucket: 0, why: 'Supported durations are 4, 8 and 12 seconds.' },
      { text: 'A remix of a completed video with one lighting change', bucket: 0, why: 'Remix starts from a completed video id.' },
      { text: 'A 1280x720 reference for a 720x1280 video', bucket: 1, why: 'Reference and video sizes must match exactly.' },
      { text: 'A team photo with faces as the reference', bucket: 1, why: 'Input images with human faces are rejected.' },
      { text: 'A 10-second video', bucket: 1, why: 'Only 4, 8 or 12 seconds are accepted.' },
    ],
  },
];

export const RIDDLES: Riddle[] = [
  { answer: 'An image edit mask', topic: 'image-generation-and-editing', clues: ['I am a PNG with the same size as your picture.', 'Where I am transparent, the model may repaint.', 'Without me, the whole picture is up for grabs.'] },
  { answer: 'Remix (Sora 2)', topic: 'video-generation-and-editing', clues: ['I start from a video that already finished.', 'One short change is my sweet spot.', 'Ask for five changes and the clip drifts.'] },
  { answer: 'Alt text', topic: 'multimodal-image-understanding', clues: ['Screen readers read me aloud.', 'I say what the picture is for, not “image of”.', 'A decorative picture gets me empty.'] },
  { answer: 'Segmentation (Content Understanding)', topic: 'content-understanding-for-images-and-video', clues: ['Turn me off and a video is one big piece.', 'Turn me on and every scene gets its own fields.', 'Key frames and transcript lines follow each piece.'] },
  { answer: 'Indirect prompt injection through an image', topic: 'responsible-ai-for-visual-content', clues: ['The user typed nothing wrong.', 'The orders were written on a sticky note in a photo.', 'Treat the text as data and add approvals for risky tools.'] },
];

export const COMPARE: Comparison[] = [
  {
    slug: 'image-generation-vs-image-editing-vs-multimodal-understanding',
    title: 'Generate, Edit or Understand? Vision Features in Foundry',
    seoTitle: 'Image Generation vs Editing vs Understanding | AI-103',
    description: 'gpt-image generation, mask-based image edits, multimodal chat models and Content Understanding compared: input, output and the exam signal for each.',
    answer: 'Use **image generation** to create a new picture from a prompt, an **image edit** (with a **mask**) to change part of an existing picture, a **multimodal chat model** to describe or answer questions about a picture, and **Content Understanding** when every picture must return the same **typed fields**.',
    cols: ['Image generation', 'Image edit with mask', 'Multimodal chat model', 'Content Understanding analyzer'],
    rows: [
      ['Input', 'Text prompt (and optional reference images)', 'Image, mask and prompt', 'Images plus a prompt', 'Image or video file'],
      ['Output', 'A new image (base64)', 'A changed image (base64)', 'Text, in whatever shape the prompt asks', 'Structured fields with confidence'],
      ['Model or service', 'gpt-image deployment', 'gpt-image deployment', 'Chat deployment that accepts images', 'Analyzer on a Foundry resource'],
      ['Repeatable shape?', 'No, creative', 'No, creative', 'Only if you force a schema', 'Yes, by design'],
      ['Typical use', 'Banners, product concepts', 'Replace a sky, remove an object', 'Captions, alt text, grounded Q&A', 'Claims photos, video chapters'],
    ],
    pick: [['Image generation', 'you need a picture that doesn\'t exist yet'], ['Image edit with mask', 'most of the picture must stay exactly as it is'], ['Multimodal chat model', 'a person or app wants a flexible description'], ['Content Understanding', 'a database needs the same fields for every file']],
    examTip: '“Change only the background” = **edit with a mask**. “Describe the photo for a screen reader” = **multimodal model with an alt text prompt**. “Same fields for every photo” = **custom analyzer**.',
    sim: { mode: 'agentvision', start: 0, tour: 'agt-vision-image', intro: 'Generate, then edit with and without a mask.' },
    lessons: ['image-generation-and-editing', 'multimodal-image-understanding', 'content-understanding-for-images-and-video'],
    faq: [['Can the same gpt-image deployment generate and edit?', 'Yes. The images generate and images edit operations use the same deployment; edits also take the image and optional mask.'], ['Do I need Content Understanding to caption photos?', 'No. A multimodal chat model with a caption prompt is enough. Choose Content Understanding when you need typed fields every time.']],
  },
  {
    slug: 'prompt-shields-vs-image-harm-controls-vs-custom-visual-policy',
    title: 'Image Harm Controls vs Prompt Shields vs a Custom Visual Policy',
    seoTitle: 'Image Safety: Harm Controls vs Prompt Shields | AI-103',
    description: 'Which control stops which visual risk: image harm categories, Prompt Shields for text hidden in images, and custom analyzers for brand and watermark rules.',
    answer: 'Use **image harm controls** for hate, sexual, violence and self-harm in pictures. Use **Prompt Shields** (indirect attack detection) for **instructions hidden in the text of an image**. Use a **custom analyzer** for **your own visual rules**, such as banned logos or a required watermark.',
    cols: ['Image harm controls', 'Prompt Shields', 'Custom visual policy analyzer'],
    rows: [
      ['Looks for', 'Hate, sexual, violence, self-harm', 'Instructions aimed at the model, found in text', 'Your logos, symbols, watermark'],
      ['Set up in', 'Guardrail controls and Content Safety', 'Guardrail (indirect attacks) or the Prompt Shields API', 'A Content Understanding analyzer'],
      ['Result', 'Severity per category', 'Attack detected or not', 'Typed fields with confidence'],
      ['Who defines the rule?', 'Microsoft categories, your threshold', 'Microsoft', 'You'],
      ['Example', 'Graphic violence in an upload', 'A sticky note saying to approve a refund', 'A competitor logo in an ad'],
    ],
    pick: [['Image harm controls', 'users or models may produce unsafe pictures'], ['Prompt Shields', 'the model reads text from untrusted images or documents'], ['A custom analyzer', 'the rule is specific to your brand or law']],
    examTip: '“Text in an uploaded image tells the model what to do” = **indirect prompt injection**. “Reject images with our competitor’s logo” = **custom policy**, not a built-in harm category.',
    sim: { mode: 'agentvision', start: 4, tour: 'agt-vision-safety', intro: 'Send a harmful image, then the injected photo.' },
    lessons: ['responsible-ai-for-visual-content'],
    faq: [['Does a harm filter catch an injected instruction?', 'Not reliably. The note isn\'t harmful content, so use Prompt Shields, a data-only system message and approvals.'], ['Can OCR text from images go through Prompt Shields?', 'Yes. Extract the text, then scan it as a document before the model acts on it.']],
  },
];

export const SERVICES: Service[] = [
  { slug: 'foundry-image-generation', name: 'gpt-image models in Foundry', cat: 'AI platform', icon: '🎨', model: 'Image generation and editing', what: 'Deployments that generate images from prompts and edit existing ones, with size, quality, count, format, transparent background, masks and input fidelity as request settings. Images come back as base64 and carry content credentials.', use: ['Banners and product concepts', 'Replacing a background with a mask', 'Variations in PNG or JPEG'], avoid: ['Exact brand logos from memory (supply a reference and review)', 'Reading or classifying photos (use a chat model or Content Understanding)'], feel: 3, price: 'Billed per image or token by quality and size (illustrative)', sim: { mode: 'agentvision', start: 0, tour: 'agt-vision-image', intro: 'Generate, then edit with a mask.' }, similar: ['foundry-video-generation', 'content-understanding-media'], aws: 'Amazon Nova Canvas / Titan Image', lesson: 'image-generation-and-editing', compare: 'image-generation-vs-image-editing-vs-multimodal-understanding' },
  { slug: 'foundry-video-generation', name: 'Sora 2 in Foundry', cat: 'AI platform', icon: '🎬', model: 'Video generation (preview)', what: 'Asynchronous text-to-video and image-to-video jobs: create, poll, download. Sizes 720x1280 and 1280x720, durations of 4, 8 or 12 seconds, optional input reference, and remix of finished videos.', use: ['Short product clips', 'Storyboards from a reference image', 'Small edits through remix'], avoid: ['Real people or protected characters', 'Long videos (clips are 12 seconds at most)'], feel: 3, price: 'Billed per second of generated video (illustrative)', sim: { mode: 'agentvision', start: 1, tour: 'agt-vision-video', intro: 'Create a video and remix it.' }, similar: ['foundry-image-generation'], aws: 'Amazon Nova Reel', lesson: 'video-generation-and-editing' },
  { slug: 'content-understanding-media', name: 'Content Understanding for images and video', cat: 'AI tools', icon: '🔍', model: 'Analyzers for media', what: 'Analyzers that turn photos and videos into structured fields. Start from prebuilt-imageSearch or prebuilt-videoSearch, or build a custom analyzer with classify and generate fields; video can be segmented with key frames and transcripts.', use: ['The same fields from every claim photo', 'Chaptering and searching training video', 'Visual policy checks such as logos and watermarks'], avoid: ['One-off descriptions (a chat model is simpler)', 'Reading values from documents (use extract on document analyzers)'], feel: 2, price: 'Billed by content processed plus the model tokens it uses (illustrative)', sim: { mode: 'agentvision', start: 3, tour: 'agt-vision-cu', intro: 'Build an image analyzer and a segmented video analyzer.' }, similar: ['foundry-image-generation'], aws: 'Amazon Bedrock Data Automation', lesson: 'content-understanding-for-images-and-video', compare: 'image-generation-vs-image-editing-vs-multimodal-understanding' },
];
