import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const spec: ExplainerSpec = {
  id: 'computer-vision',
  lesson: 'computer-vision-and-image-generation',
  title: {
    main: 'Teach software <em>to see</em>',
    sub: 'Captions, tags, object detection, OCR, multimodal questions and image generation, on one street photo.',
  },
  summary: 'An animation of one street photo analysed by Azure Vision: a caption, tags with confidence scores, bounding boxes around a bicycle, a taxi and a person, and OCR reading a receipt. A multimodal model then answers a question about the photo, and an image-generation model creates a new image marked with content credentials.',
  html: `
  <div class="cv">
    <div class="cv-photo msd-card">
      <div class="cv-scene">
        <div class="cv-sky"></div><div class="cv-road"></div>
        <span class="cv-o o-bike" aria-hidden="true">🚴</span><span class="cv-o o-taxi" aria-hidden="true">🚕</span><span class="cv-o o-man" aria-hidden="true">🚶</span>
        <i class="cv-box b-bike msd-reveal"><em>bicycle 0.98</em></i><i class="cv-box b-taxi msd-reveal"><em>taxi 0.96</em></i><i class="cv-box b-man msd-reveal"><em>person 0.93</em></i>
        <div class="cv-scanline"></div>
      </div>
      <div class="cv-gen msd-reveal"><span aria-hidden="true">🛺</span><div class="cv-sun"></div><span class="cv-cc msd-chip">${I.shield}Content credentials · AI-generated</span></div>
    </div>
    <div class="cv-out">
      <div class="cv-cap msd-reveal msd-pill accent">${I.chat}<span class="cv-captext"></span></div>
      <div class="cv-tags msd-stagger"><span class="msd-chip">street 0.99</span><span class="msd-chip">bicycle 0.98</span><span class="msd-chip">taxi 0.96</span><span class="msd-chip">outdoor 0.95</span><span class="msd-chip">person 0.93</span></div>
      <div class="cv-receipt msd-reveal"><div class="cv-paper"><b>CHAI POINT</b><span>Masala chai ×2 ... ₹80</span><span>Thank you, visit again</span></div><div class="cv-read msd-mono"></div></div>
      <div class="cv-qa msd-reveal"><p class="q">${I.user}<span>Is the taxi waiting for the cyclist?</span></p><p class="a">${I.sparkle}<span class="cv-ans"></span></p></div>
      <div class="cv-prompt msd-reveal msd-mono">prompt: “an autorickshaw at sunset, watercolour”</div>
    </div>
  </div>`,
  css: `
  @S .cv{ height:100%; display:grid; grid-template-columns:1.1fr 1fr; gap:20px; }
  @S .cv-photo{ position:relative; padding:16px; display:flex; }
  @S .cv-scene{ position:relative; flex:1; border-radius:18px; overflow:hidden; }
  @S .cv-sky{ position:absolute; inset:0 0 40% 0; background:linear-gradient(180deg, #7cc4ff, #d7ecff); }
  @S .cv-road{ position:absolute; inset:60% 0 0 0; background:linear-gradient(180deg, #4b5563, #374151); }
  @S .cv-road::after{ content:''; position:absolute; left:0; right:0; top:45%; border-top:6px dashed #f8fafc; opacity:.7; }
  @S .cv-o{ position:absolute; font-size:120px; line-height:1; }
  @S .o-bike{ left:8%; top:44%; } @S .o-taxi{ right:8%; top:46%; } @S .o-man{ left:46%; top:40%; font-size:110px; }
  @S .cv-box{ position:absolute; border:4px solid var(--x-cyan); border-radius:8px; box-shadow:0 0 18px rgb(34 211 238 / .6); }
  @S .cv-box em{ position:absolute; left:-4px; top:-36px; font-style:normal; font-family:var(--x-mono); font-size:18px; font-weight:800; color:#0e1420; background:var(--x-cyan); padding:3px 8px; border-radius:6px; white-space:nowrap; }
  @S .b-bike{ left:6%; top:41%; width:28%; height:33%; } @S .b-taxi{ right:6%; top:43%; width:28%; height:30%; } @S .b-man{ left:44%; top:37%; width:16%; height:35%; border-color:var(--x-you); } @S .b-man em{ background:var(--x-you); }
  @S .cv-scanline{ position:absolute; left:0; right:0; height:6px; top:-10px; background:var(--x-cyan); box-shadow:0 0 24px var(--x-cyan); opacity:0; }
  @S .cv.scan .cv-scanline{ animation:cv-scan 1.6s ease-in-out 2; opacity:1; }
  @keyframes cv-scan{ 0%{ top:0; } 100%{ top:100%; } }
  @S .cv-gen{ position:absolute; inset:16px; border-radius:18px; overflow:hidden; display:grid; place-items:center; background:linear-gradient(180deg, #ff9a5a, #ff5f8a 55%, #6d4bd8); }
  @S .cv-gen > span:first-child{ font-size:200px; position:relative; z-index:1; margin-top:80px; }
  @S .cv-sun{ position:absolute; width:220px; height:220px; border-radius:50%; background:#ffd36b; top:14%; left:50%; transform:translateX(-50%); filter:blur(2px); }
  @S .cv-cc{ position:absolute; left:16px; bottom:16px; z-index:2; background:rgb(14 20 32 / .85); }
  @S .cv-out{ display:flex; flex-direction:column; gap:14px; }
  @S .cv-cap{ font-size:21px; align-self:flex-start; } @S .cv-captext{ min-height:28px; }
  @S .cv-tags{ display:flex; flex-wrap:wrap; gap:8px; }
  @S .cv-receipt{ display:grid; grid-template-columns:auto 1fr; gap:14px; align-items:center; }
  @S .cv-paper{ display:flex; flex-direction:column; gap:4px; padding:14px 16px; background:#f8fafc; color:#111; font-family:var(--x-mono); font-size:17px; border-radius:6px; transform:rotate(-2deg); }
  @S .cv-paper b{ font-size:20px; }
  @S .cv-read{ font-size:19px; color:var(--x-cyan); padding:10px 12px; border-radius:12px; background:rgb(34 211 238 / .06); min-height:60px; }
  @S .cv-qa{ display:flex; flex-direction:column; gap:8px; }
  @S .cv-qa p{ margin:0; display:flex; gap:10px; align-items:flex-start; font-size:21px; color:#fff; padding:12px 14px; border-radius:14px; background:rgb(255 255 255 / .05); border:1.5px solid var(--x-line); }
  @S .cv-qa p svg{ width:26px; height:26px; flex-shrink:0; color:var(--x-you); }
  @S .cv-qa p.a{ border-color:rgb(58 160 255 / .5); } @S .cv-qa p.a svg{ color:var(--x-a1); }
  @S .cv-prompt{ font-size:20px; color:var(--x-warn); padding:12px 14px; border-radius:12px; background:rgb(240 166 74 / .08); }
  @S .cv.late .cv-receipt, @S .cv.late .cv-tags{ display:none; }
  @P .cv{ grid-template-columns:1fr; grid-template-rows:440px 1fr; gap:14px; }
  @P .cv-o{ font-size:96px; }
  @P .cv-gen > span:first-child{ font-size:150px; margin-top:60px; }
  `,
  stages: [
    {
      title: 'To software, a photo is numbers',
      key: 'numbers',
      desc: 'Every pixel is a set of numbers. A vision model learned what patterns of numbers mean.',
      status: 'image · 1280 × 720 pixels',
      say: "To software, a photo is just a grid of numbers. A vision model has learned which patterns of numbers mean a bicycle, a taxi or a person.",
      run: (m) => {
        m.cls('.cv', 'scan');
        m.sfx.riser(1400);
      },
    },
    {
      title: 'Caption the whole image',
      key: 'Caption',
      desc: 'Azure Vision in Foundry Tools describes the scene in one sentence.',
      status: 'analyze · caption',
      say: 'Azure Vision in Foundry Tools can caption the whole image in one sentence.',
      run: (m) => {
        m.cls('.cv', 'scan', false);
        m.show('.cv-cap', 0, true);
        m.type('.cv-captext', 'A person cycling on a city street next to a taxi', 30);
      },
    },
    {
      title: 'Tag what’s in it',
      key: 'Tag',
      desc: 'Tags are keywords with confidence scores, handy for search and sorting.',
      status: 'analyze · tags',
      say: 'It can tag what is in the picture, each tag with a confidence score, which is handy for search.',
      run: (m) => {
        m.show('.cv-tags > *', 200);
      },
    },
    {
      title: 'Detect objects with boxes',
      key: 'Detect objects',
      desc: 'Object detection returns each object’s name, confidence and exact position.',
      status: 'analyze · objects · 3 found',
      say: 'Object detection goes further. It finds each object, and returns its name, a confidence score and a box with its exact position.',
      run: (m) => {
        m.show('.cv-box', 400);
      },
    },
    {
      title: 'Read text with OCR',
      key: 'OCR',
      desc: 'The Read feature pulls printed or handwritten text out of images.',
      status: 'read · 3 lines',
      say: 'And the Read feature, called OCR, pulls printed or handwritten text out of an image, like the lines on this receipt.',
      run: (m) => {
        m.show('.cv-receipt', 0);
        m.after(600, () => m.type('.cv-read', 'CHAI POINT / Masala chai ×2 ... ₹80 / Thank you, visit again', 22));
      },
    },
    {
      title: 'Ask a multimodal model anything',
      key: 'multimodal',
      desc: 'Put the image in the prompt and ask a question. The answer is generated, so check it.',
      status: 'gpt-4.1 · image + question',
      say: 'A multimodal model takes the image inside the prompt, so you can ask it anything. The answer is generated, so it is flexible, but it can be wrong.',
      run: (m) => {
        m.cls('.cv', 'late');
        m.show('.cv-qa', 0);
        m.after(700, () => m.type('.cv-ans', 'It looks like it. The taxi is stopped and the cyclist is passing in front of it.', 22));
      },
    },
    {
      title: 'Or create a brand-new image',
      key: 'create',
      desc: 'Image generation goes the other way: text in, picture out, marked as AI-made.',
      status: 'gpt-image-1 · generate',
      say: 'Image generation works the other way round. A model like gpt-image-1 turns a text prompt into a new picture, and content credentials mark it as AI-made.',
      run: (m) => {
        m.show('.cv-prompt', 0);
        m.after(900, () => { m.show('.cv-gen', 0, true); m.sfx.sparkle(); });
      },
    },
  ],
  end: {
    title: 'Describe, tag, detect, read, ask, create',
    sub: 'Analysing an image points to Azure Vision or a multimodal model. Making one points to image generation.',
  },
};

export default spec;
