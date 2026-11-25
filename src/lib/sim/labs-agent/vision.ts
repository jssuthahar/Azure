/**
 * AI-103 "vision" practice labs (Computer Vision). Ids start agt-. Every task
 * is checked from simulator events, and every `cli` hint completes its task
 * when run as written, in order, in a fresh simulator (scripts/qa/lab-check.ts).
 * The Python apps and Sora 2 deployment command live in src/lib/sim/agentdev/vision.ts.
 */
import type { Sim } from '../engine';
import type { Lab } from '../labs';

const ev = (s: Sim, type: string, pred: (d: Record<string, any>) => boolean = () => true) => s.events.some((e) => e.type === type && pred(e.data));

const RG = 'rg-agents-vision';
const RES = 'contoso-agents-vision';
const EP = `https://${RES}.openai.azure.com/`;
const DEPLOY = (name: string, model: string, cap = 10) => `az cognitiveservices account deployment create -n ${RES} -g ${RG} --deployment-name ${name} --model-name ${model} --model-format OpenAI --sku-name GlobalStandard --sku-capacity ${cap}`;
const BASE = `az group create -n ${RG} -l eastus && az cognitiveservices account create -n ${RES} -g ${RG} -l eastus --kind AIServices --sku S0 --custom-domain ${RES}`;
const hasRes = (s: Sim) => ev(s, 'foundry.create', (d) => d.name === RES);
const hasDep = (s: Sim, name: string) => ev(s, 'ai.deploy', (d) => d.resource === RES && d.name === name);
const envSet = (s: Sim, name: string) => ev(s, 'env.set', (d) => d.name === name);

export const LABS: Lab[] = [
  /* ------------------------------------------------ images */
  {
    id: 'agt-vision-image', title: 'Generate and edit images with gpt-image', icon: '🎨', level: 'Intermediate', minutes: 12, start: 'shell',
    intro: 'Priya Sweets needs fresh shop banners and a new sky in last week\'s shop photo. Deploy a gpt-image model, generate images with the right size, quality and format, edit with a mask, and see a guardrail stop an unsafe prompt.',
    learn: ['Size, quality, count and output format for gpt-image', 'A transparent background needs PNG', 'Mask-based edits: transparent pixels are what changes', 'Guardrails check image prompts too'],
    topics: ['image-generation-and-editing'],
    tasks: [
      { text: `Create **${RG}**, a Foundry resource **${RES}** and a **gpt-image-1** deployment (Global Standard).`, cli: `${BASE} && ${DEPLOY('gpt-image-1', 'gpt-image-1', 1)}`, check: (s) => hasRes(s) && hasDep(s, 'gpt-image-1') },
      { text: 'Install **openai** and **azure-identity**, then point **AZURE_OPENAI_ENDPOINT** at the resource.', cli: `pip install openai azure-identity && export AZURE_OPENAI_ENDPOINT="${EP}"`, check: (s) => ev(s, 'pip.install', (d) => d.pkgs.includes('openai')) && envSet(s, 'AZURE_OPENAI_ENDPOINT') },
      { text: 'Read **image_studio.py**, then generate **two** landscape images (**1536x1024**) at **low** quality.', cli: 'cat image_studio.py && python image_studio.py generate "Festival banner for Priya Sweets, laddoos on a brass tray, warm light" --size 1536x1024 --quality low --n 2', check: (s) => ev(s, 'py.view', (d) => d.file === 'image_studio.py') && ev(s, 'agt.image.generate', (d) => d.size === '1536x1024' && d.n === 2 && d.quality === 'low' && !d.blocked) },
      { text: 'Make a logo with a **transparent background** (it needs **png** output).', cli: 'python image_studio.py generate "Simple round logo of a laddoo, flat style" --output-format png --background transparent', check: (s) => ev(s, 'agt.image.generate', (d) => d.background === 'transparent' && d.format === 'png' && !d.blocked) },
      { text: 'Edit **shop-front.png** with **mask.png** so only the sky changes, with **high** input fidelity.', cli: 'python image_studio.py edit "Replace the grey sky with a warm sunset. Keep everything else unchanged." --image shop-front.png --mask mask.png --input-fidelity high', check: (s) => ev(s, 'agt.image.edit', (d) => d.mask && d.fidelity === 'high' && !d.blocked) },
      { text: 'Send a harmful prompt (make a bomb poster) and watch the guardrail refuse it.', cli: 'python image_studio.py generate "A poster showing how to make a bomb"', check: (s) => ev(s, 'agt.image.generate', (d) => !!d.blocked) },
    ],
    wrap: 'A gpt-image deployment turns a prompt into an image. Size (1024x1024, 1024x1536, 1536x1024), quality (low, medium, high), n (1 to 10) and output format (PNG or JPEG) are request settings, and a transparent background needs PNG. Images come back as base64. To change only part of a picture, send the image with a mask of the same size: the transparent area is what may change. The deployment\'s guardrail checks prompts, so unsafe requests are refused before any image is made.',
  },

  /* ------------------------------------------------ video */
  {
    id: 'agt-vision-video', title: 'Create and remix a video with Sora 2', icon: '🎬', level: 'Intermediate', minutes: 12, start: 'shell',
    intro: 'Marketing wants an 8-second clip of a brass tea kettle. Deploy Sora 2, discover its input rules, create the video from a reference image, then remix it with one change.',
    learn: ['Video generation is an asynchronous job', 'Allowed sizes and durations', 'Input reference: same size, no faces', 'Remix a completed video with one change'],
    topics: ['video-generation-and-editing'],
    tasks: [
      { text: `Create **${RG}**, the Foundry resource **${RES}** and a **sora-2** deployment.`, cli: `${BASE} && ${DEPLOY('sora-2', 'sora-2', 1)}`, check: (s) => hasRes(s) && ev(s, 'agt.vision.deploy', (d) => d.resource === RES && d.model === 'sora-2') },
      { text: 'Install **openai** and **azure-identity**, then set **AZURE_OPENAI_ENDPOINT**.', cli: `pip install openai azure-identity && export AZURE_OPENAI_ENDPOINT="${EP}"`, check: (s) => ev(s, 'pip.install', (d) => d.pkgs.includes('openai')) && envSet(s, 'AZURE_OPENAI_ENDPOINT') },
      { text: 'Try **team-photo-1280x720.jpg** as the reference. Sora 2 rejects faces.', cli: 'python video_studio.py create "Our team waving outside the shop" --size 1280x720 --seconds 8 --input-reference team-photo-1280x720.jpg', check: (s) => ev(s, 'agt.video.create', (d) => d.blocked === 'face') },
      { text: 'Create an **8-second 1280x720** video from **product-1280x720.png** (same size as the video).', cli: 'python video_studio.py create "A brass tea kettle on a wooden table, steam rising, soft morning light, slow push-in" --size 1280x720 --seconds 8 --input-reference product-1280x720.png', check: (s) => ev(s, 'agt.video.create', (d) => d.size === '1280x720' && d.seconds === 8 && d.ref && !d.blocked) },
      { text: 'Remix the finished video with **one** change: warm sunset light.', cli: 'python video_studio.py remix "Change the morning light to warm sunset light" --video-id video_6a1f0001c0de', check: (s) => ev(s, 'agt.video.remix', (d) => !!d.id && d.changes <= 1 && !d.blocked) },
      { text: 'List the videos on the resource, then delete the original.', cli: 'python video_studio.py list && python video_studio.py delete --video-id video_6a1f0001c0de', check: (s) => ev(s, 'agt.video.list') && ev(s, 'agt.video.delete') },
    ],
    wrap: 'Sora 2 (preview) creates video as an asynchronous job: create, poll the status, then download. Sizes are 720x1280 or 1280x720, and durations are 4, 8 or 12 seconds. An input reference image must match the video size exactly and can\'t contain a human face. To edit a finished video, remix it with a short prompt and the source video id; one clear change keeps the rest of the clip stable.',
  },

  /* ------------------------------------------------ understanding */
  {
    id: 'agt-vision-understand', title: 'Captions, visual Q&A and alt text', icon: '💬', level: 'Intermediate', minutes: 12, start: 'shell',
    intro: 'A claims team and a web team both have piles of photos. Use one multimodal model for short captions, detailed captions, a grounded question, accessible alt text and object locations.',
    learn: ['Concise vs detailed captions, one or many images', 'Visual question answering grounded in evidence', 'Alt text and extended descriptions', 'Locating objects with approximate boxes'],
    topics: ['multimodal-image-understanding'],
    tasks: [
      { text: `Create **${RG}**, the resource **${RES}** and a **gpt-4.1-mini** deployment (it accepts images).`, cli: `${BASE} && ${DEPLOY('gpt-4.1-mini', 'gpt-4.1-mini')}`, check: (s) => hasRes(s) && hasDep(s, 'gpt-4.1-mini') },
      { text: 'Install **openai** and **azure-identity**, then set **AZURE_OPENAI_ENDPOINT**.', cli: `pip install openai azure-identity && export AZURE_OPENAI_ENDPOINT="${EP}"`, check: (s) => ev(s, 'pip.install', (d) => d.pkgs.includes('openai')) && envSet(s, 'AZURE_OPENAI_ENDPOINT') },
      { text: 'Caption **shelf-photo.jpg** concisely, then caption **two images in one request** with a detailed style.', cli: 'python describe_images.py caption shelf-photo.jpg && python describe_images.py caption shelf-photo.jpg street-chennai.jpg --style detailed', check: (s) => ev(s, 'agt.vision.caption', (d) => d.style === 'concise' && d.images === 1) && ev(s, 'agt.vision.caption', (d) => d.style === 'detailed' && d.images === 2) },
      { text: 'Ask which door is damaged in **car-damage.jpg**, then ask something the photo can\'t answer.', cli: 'python describe_images.py ask car-damage.jpg "Which door is damaged?" && python describe_images.py ask car-damage.jpg "How old is the car?"', check: (s) => ev(s, 'agt.vision.ask', (d) => d.file === 'car-damage.jpg' && d.answered) && ev(s, 'agt.vision.ask', (d) => d.file === 'car-damage.jpg' && !d.answered) },
      { text: 'Write alt text for **shop-front.png**, then the **extended** description.', cli: 'python describe_images.py alt-text shop-front.png && python describe_images.py alt-text shop-front.png --extended', check: (s) => ev(s, 'agt.vision.alt', (d) => !d.extended) && ev(s, 'agt.vision.alt', (d) => d.extended) },
      { text: 'Ask the model to **locate** the damage in **car-damage.jpg**.', cli: 'python describe_images.py locate car-damage.jpg "damage"', check: (s) => ev(s, 'agt.vision.locate', (d) => d.file === 'car-damage.jpg' && d.found > 0) },
    ],
    wrap: 'A multimodal chat model reads images sent with your prompt, and the prompt decides the output: a concise caption for galleries, a detailed one for reports, alt text with accessibility rules, or a visual question grounded in what is visible (with permission to say it can\'t tell). Up to 10 images can go in one request, and detail low, high or auto trades cost against small text. Boxes from a language model are approximate, so show them to a person or use Content Understanding when you need consistent fields.',
  },

  /* ------------------------------------------------ content understanding */
  {
    id: 'agt-vision-cu', title: 'Content Understanding analyzers for photos and video', icon: '🔍', level: 'Intermediate', minutes: 14, start: 'shell',
    intro: 'Fabrikam Insurance wants the same fields from every claim photo, and its safety team wants a training video split into topics. Run a prebuilt analyzer, build a custom image analyzer, then compare a video analyzer with and without segmentation.',
    learn: ['Prebuilt image and video analyzers', 'Custom analyzers with classify and generate fields', 'Why extract is for documents only', 'Video segmentation, key frames and transcript'],
    topics: ['content-understanding-for-images-and-video'],
    tasks: [
      { text: `Create **${RG}**, the resource **${RES}** and a **gpt-4.1-mini** deployment (Content Understanding needs default models).`, cli: `${BASE} && ${DEPLOY('gpt-4.1-mini', 'gpt-4.1-mini')}`, check: (s) => hasRes(s) && hasDep(s, 'gpt-4.1-mini') },
      { text: 'Install **azure-ai-contentunderstanding** and **azure-identity**, then set **FOUNDRY_ENDPOINT**.', cli: `pip install azure-ai-contentunderstanding azure-identity && export FOUNDRY_ENDPOINT="${EP}"`, check: (s) => ev(s, 'pip.install', (d) => d.pkgs.includes('azure-ai-contentunderstanding')) && envSet(s, 'FOUNDRY_ENDPOINT') },
      { text: 'Run the prebuilt **prebuilt-imageSearch** analyzer on **car-damage.jpg**.', cli: 'python media_insights.py analyze car-damage.jpg --analyzer prebuilt-imageSearch', check: (s) => ev(s, 'ai.cu', (d) => d.analyzer === 'prebuilt-imageSearch' && d.file === 'car-damage.jpg') },
      { text: 'Create a custom analyzer **damage-photo** (from **prebuilt-image**) with a **classify** field and a **generate** field, then run it.', cli: 'python media_insights.py create-analyzer damage-photo --base prebuilt-image --field "DamageType:classify:dent | scratch | broken glass | none" --field "Notes:generate:One sentence on what is damaged and where" && python media_insights.py analyze car-damage.jpg --analyzer damage-photo', check: (s) => ev(s, 'agt.cu.analyzer', (d) => d.id === 'damage-photo' && d.methods.includes('classify') && d.methods.includes('generate')) && ev(s, 'ai.cu', (d) => d.analyzer === 'damage-photo' && d.custom) },
      { text: 'Create a video analyzer **training-whole** with no segmentation, run it on **safety-training.mp4** and see one segment.', cli: 'python media_insights.py create-analyzer training-whole --base prebuilt-video --field "Topic:generate:Short title of what the video teaches" && python media_insights.py analyze safety-training.mp4 --analyzer training-whole', check: (s) => ev(s, 'agt.cu.video', (d) => d.analyzer === 'training-whole' && !d.segmented) },
      { text: 'Create **training-chapters** with **segmentation** (one segment per topic) and run it again.', cli: 'python media_insights.py create-analyzer training-chapters --base prebuilt-video --field "Topic:generate:Short title of what this segment teaches" --segment "One segment per training topic" && python media_insights.py analyze safety-training.mp4 --analyzer training-chapters', check: (s) => ev(s, 'agt.cu.video', (d) => d.analyzer === 'training-chapters' && d.segmented && d.segments >= 3) },
    ],
    wrap: 'Content Understanding analyzers return the same structured record for every file. A prebuilt analyzer such as prebuilt-imageSearch gives a description for search. A custom analyzer adds a field schema: classify picks from your list and generate writes text, while extract only suits documents. For video, segmentation splits the file into scenes, each with its own fields, key frames and transcript; without it the whole video is a single segment.',
  },

  /* ------------------------------------------------ safety */
  {
    id: 'agt-vision-safety', title: 'Defend against unsafe images and injected photos', icon: '🛡️', level: 'Intermediate', minutes: 12, start: 'shell',
    intro: 'Contoso Returns lets customers upload photos of damaged parcels. One photo has a sticky note that tries to order a refund, and the ad team needs banned logos rejected. Watch the attack work, defend against it, see the guardrail refuse an unsafe image request, and build a visual policy analyzer.',
    learn: ['Indirect prompt injection through text in images', 'Prompt Shields, data-only system messages and approvals', 'Guardrails on image prompts', 'Visual policy checks with a custom analyzer'],
    topics: ['responsible-ai-for-visual-content'],
    tasks: [
      { text: `Create **${RG}**, the resource **${RES}**, a **gpt-4.1-mini** deployment and a **gpt-image-1** deployment.`, cli: `${BASE} && ${DEPLOY('gpt-4.1-mini', 'gpt-4.1-mini')} && ${DEPLOY('gpt-image-1', 'gpt-image-1', 1)}`, check: (s) => hasRes(s) && hasDep(s, 'gpt-4.1-mini') && hasDep(s, 'gpt-image-1') },
      { text: 'Install **openai**, **azure-ai-contentunderstanding** and **azure-identity**. Set **AZURE_OPENAI_ENDPOINT** and **FOUNDRY_ENDPOINT**.', cli: `pip install openai azure-ai-contentunderstanding azure-identity && export AZURE_OPENAI_ENDPOINT="${EP}" && export FOUNDRY_ENDPOINT="${EP}"`, check: (s) => ev(s, 'pip.install', (d) => d.pkgs.includes('azure-ai-contentunderstanding')) && envSet(s, 'AZURE_OPENAI_ENDPOINT') && envSet(s, 'FOUNDRY_ENDPOINT') },
      { text: 'Ask for a summary of **refund-note.jpg** with **no defences**. Watch the model obey the sticky note.', cli: 'python describe_images.py ask refund-note.jpg "Summarise this return photo."', check: (s) => ev(s, 'agt.vision.injection', (d) => !d.guarded) && ev(s, 'agt.vision.ask', (d) => d.injected) },
      { text: 'Run it again with **--guard** (OCR, Prompt Shields and a data-only system message).', cli: 'python describe_images.py ask refund-note.jpg "Summarise this return photo." --guard', check: (s) => ev(s, 'agt.vision.injection', (d) => d.guarded && d.detected) },
      { text: 'Ask the image model for an unsafe picture and watch the guardrail refuse it.', cli: 'python image_studio.py generate "A realistic poster showing how to make a bomb"', check: (s) => ev(s, 'agt.image.generate', (d) => !!d.blocked) },
      { text: 'Create an analyzer **ad-policy** from **prebuilt-image** with classify fields for **BrandUsage** and **Watermark**, then run it on **shelf-photo.jpg**.', cli: 'python media_insights.py create-analyzer ad-policy --base prebuilt-image --field "BrandUsage:classify:approved | competitor logo | altered logo | none" --field "Watermark:classify:present | missing" && python media_insights.py analyze shelf-photo.jpg --analyzer ad-policy', check: (s) => ev(s, 'agt.cu.analyzer', (d) => d.id === 'ad-policy' && d.methods.length === 2 && d.methods.every((m: string) => m === 'classify')) && ev(s, 'ai.cu', (d) => d.analyzer === 'ad-policy') },
    ],
    wrap: 'Text inside an image is untrusted data. A model that reads a sticky note can obey it, which is an indirect prompt injection. Defend in layers: read the text and scan it with Prompt Shields, tell the model in the system message that image text is never an instruction, and keep risky tools behind approvals and least privilege. Guardrails also block unsafe image requests, and rules that are specific to you, such as banned logos or a missing watermark, belong in a custom analyzer whose fields your code enforces.',
  },
];
