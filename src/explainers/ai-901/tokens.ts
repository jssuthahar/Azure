import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

// Illustrative split, close to how GPT-style tokenizers break English text.
const TOKENS = ['Un', 'believ', 'able', '!', ' Book', ' a', ' table', ' for', ' two', ' at', ' 7', 'pm', '.'];
const IDS = [1844, 31141, 481, 0, 5677, 261, 3293, 395, 1920, 540, 220, 6587, 13];
const chips = TOKENS.map(
  (t, i) => `<span class="tk-chip c${i % 6} msd-pop"><b>${t.replace(/ /g, '·')}</b><small class="tk-id">${IDS[i]}</small></span>`,
).join('');

const spec: ExplainerSpec = {
  id: 'tokens',
  lesson: 'how-generative-ai-works',
  title: {
    main: 'Models don’t read words. <em>They read tokens.</em>',
    sub: 'How text becomes tokens, why you pay per token, and what the context window limits.',
  },
  summary: 'An animation that splits a sentence into tokens, shows each token as a number, counts characters against tokens, adds input and output tokens into a bill, fills a context window, and compares token counts for English and Hindi.',
  html: `
  <div class="tk">
    <div class="tk-prompt msd-card"><span class="msd-label">Your prompt</span><div class="tk-text msd-mono"></div></div>
    <div class="tk-chips">${chips}</div>
    <div class="tk-ids msd-reveal msd-mono">token IDs (example) → the model only sees these numbers</div>
    <div class="tk-stats msd-stagger">
      <div><b class="tk-chars">0</b><span>characters</span></div>
      <div><b class="tk-count">0</b><span>tokens</span></div>
      <div><b>≈ 4</b><span>characters per token in English</span></div>
      <div><b>100</b><span>tokens ≈ 75 words</span></div>
    </div>
    <div class="tk-bill msd-reveal">
      <span class="msd-pill">${I.arrow}Input <b>13</b></span><b class="tk-plus">+</b>
      <span class="msd-pill">${I.chat}Output <b>40</b></span><b class="tk-plus">=</b>
      <span class="msd-pill ok">${I.coin}Billed <b class="tk-billed">0</b> tokens</span>
    </div>
    <div class="tk-window msd-reveal">
      <div class="tk-wh"><span class="msd-label">Context window</span><span class="msd-mono tk-used">0 / 128,000 tokens</span></div>
      <div class="tk-bar"><i class="p"></i><i class="h"></i><i class="r"></i></div>
      <div class="tk-legend"><span class="p">prompt</span><span class="h">chat history</span><span class="r">reply</span></div>
    </div>
    <div class="tk-lang msd-stagger">
      <div><b>English</b><span class="msd-mono">“Thank you very much”</span><em>4 tokens</em></div>
      <div><b>Hindi</b><span class="msd-mono">“बहुत बहुत धन्यवाद”</span><em class="more">more tokens</em></div>
    </div>
  </div>`,
  css: `
  @S .tk{ position:relative; height:100%; display:flex; flex-direction:column; gap:18px; }
  @S .tk-prompt{ padding:20px 24px; display:flex; flex-direction:column; gap:10px; }
  @S .tk-text{ font-size:36px; color:#fff; min-height:48px; }
  @S .tk-chips{ display:flex; flex-wrap:wrap; gap:10px; }
  @S .tk-chip{ display:inline-flex; flex-direction:column; align-items:center; gap:4px; padding:10px 14px; border-radius:12px; border:1.5px solid; }
  @S .tk-chip b{ font-family:var(--x-mono); font-size:30px; color:#fff; white-space:pre; }
  @S .tk-chip small{ font-family:var(--x-mono); font-size:18px; color:var(--x-dim); max-height:0; overflow:hidden; transition:max-height .35s; }
  @S .tk.ids .tk-chip small{ max-height:30px; }
  @S .tk-chip.c0{ background:rgb(58 160 255 / .16); border-color:rgb(58 160 255 / .5); }
  @S .tk-chip.c1{ background:rgb(34 211 238 / .14); border-color:rgb(34 211 238 / .5); }
  @S .tk-chip.c2{ background:rgb(180 140 255 / .16); border-color:rgb(180 140 255 / .5); }
  @S .tk-chip.c3{ background:rgb(63 185 80 / .14); border-color:rgb(63 185 80 / .5); }
  @S .tk-chip.c4{ background:rgb(240 166 74 / .14); border-color:rgb(240 166 74 / .5); }
  @S .tk-chip.c5{ background:rgb(244 74 106 / .14); border-color:rgb(244 74 106 / .5); }
  @S .tk-ids{ font-size:20px; color:var(--x-cyan); }
  @S .tk-stats{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
  @S .tk-stats > div{ display:flex; flex-direction:column; gap:4px; padding:14px 16px; border-radius:16px; background:rgb(255 255 255 / .04); border:1.5px solid var(--x-line); }
  @S .tk-stats b{ font-family:var(--x-mono); font-size:38px; color:var(--x-a1); }
  @S .tk-stats span{ color:var(--x-dim); font-size:19px; }
  @S .tk-bill{ display:flex; gap:12px; align-items:center; justify-content:center; flex-wrap:wrap; }
  @S .tk-bill svg{ width:24px; height:24px; }
  @S .tk-bill b{ color:#fff; }
  @S .tk-plus{ color:var(--x-a1); font-size:34px; }
  @S .tk-window{ display:flex; flex-direction:column; gap:10px; }
  @S .tk-wh{ display:flex; justify-content:space-between; gap:10px; }
  @S .tk-used{ color:var(--x-text); font-size:21px; }
  @S .tk-bar{ height:34px; border-radius:12px; background:rgb(255 255 255 / .06); border:1.5px solid var(--x-line); display:flex; overflow:hidden; }
  @S .tk-bar i{ display:block; width:0; transition:width 1s cubic-bezier(.22,1,.36,1); }
  @S .tk-bar .p, @S .tk-legend .p::before{ background:var(--x-a1); }
  @S .tk-bar .h, @S .tk-legend .h::before{ background:var(--x-you); }
  @S .tk-bar .r, @S .tk-legend .r::before{ background:var(--x-ok); }
  @S .tk.win .tk-bar .p{ width:8%; } @S .tk.win .tk-bar .h{ width:58%; } @S .tk.win .tk-bar .r{ width:12%; }
  @S .tk-legend{ display:flex; gap:18px; font-size:19px; color:var(--x-dim); }
  @S .tk-legend span{ display:inline-flex; align-items:center; gap:8px; }
  @S .tk-legend span::before{ content:''; width:16px; height:16px; border-radius:5px; }
  @S .tk-lang{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  @S .tk-lang > div{ display:flex; flex-direction:column; gap:6px; padding:14px 18px; border-radius:16px; border:1.5px solid var(--x-line); background:rgb(255 255 255 / .04); }
  @S .tk-lang b{ color:#fff; font-size:23px; } @S .tk-lang span{ color:var(--x-text); font-size:23px; }
  @S .tk-lang em{ font-style:normal; font-family:var(--x-mono); color:var(--x-ok); font-size:21px; } @S .tk-lang em.more{ color:var(--x-warn); }
  @S .tk.late .tk-stats, @S .tk.late .tk-ids{ display:none; }
  @P .tk-stats{ grid-template-columns:1fr 1fr; }
  @P .tk-text{ font-size:32px; }
  @P .tk-chip b{ font-size:27px; }
  @P .tk-lang{ grid-template-columns:1fr; }
  `,
  stages: [
    {
      title: 'Your text goes in',
      key: 'text',
      desc: 'Before a model can do anything with your prompt, the text is chopped into tokens.',
      status: 'prompt · 42 characters',
      say: 'A language model never sees your words as words. First, your text gets chopped into tokens.',
      run: (m) => {
        m.type('.tk-text', 'Unbelievable! Book a table for two at 7pm.', 38);
      },
    },
    {
      title: 'Text becomes tokens',
      key: 'tokens',
      desc: 'A token can be a whole word, part of a word, or punctuation. “Unbelievable” is three.',
      status: 'tokenizer · 13 tokens',
      say: 'A token can be a whole word, part of a word, or a punctuation mark. Unbelievable splits into three pieces.',
      run: (m) => {
        m.show('.tk-chip', 120);
        m.after(1900, () => m.punch('.tk-chip.c0, .tk-chip.c1, .tk-chip.c2', 4));
      },
    },
    {
      title: 'Each token is a number',
      key: 'number',
      desc: 'Every token maps to an ID in the model’s vocabulary. The model works only with numbers.',
      status: 'vocabulary lookup · IDs',
      say: "Each token maps to a number in the model's vocabulary. The model only ever works with these numbers.",
      run: (m) => {
        m.cls('.tk', 'ids');
        m.show('.tk-ids', 0);
        m.sfx.lock();
      },
    },
    {
      title: 'About four characters each',
      key: 'four characters',
      desc: 'In English a token averages about four characters: 100 tokens is roughly 75 words.',
      status: '42 characters · 13 tokens',
      say: 'In English, a token is about four characters on average, so a hundred tokens is roughly seventy five words. Short words like these pack fewer characters into each token.',
      run: (m) => {
        m.show('.tk-stats > *', 250);
        m.count('.tk-chars', 42, 900);
        m.count('.tk-count', 13, 900);
      },
    },
    {
      title: 'You pay per token',
      key: 'pay per token',
      desc: 'Billing counts the tokens you send and the tokens the model writes back.',
      status: 'usage · 13 in + 40 out',
      say: "Tokens are how you're billed. You pay for the tokens you send in, and for the tokens the model writes back.",
      run: (m) => {
        m.cls('.tk', 'late');
        m.show('.tk-bill', 0);
        m.after(700, () => m.count('.tk-billed', 53, 900));
        m.after(1600, () => m.sfx.ding());
      },
    },
    {
      title: 'The context window has a limit',
      key: 'context window',
      desc: 'Prompt, chat history and reply all count toward one maximum per request.',
      status: 'context · 99,840 / 128,000',
      say: 'Every model also has a context window. That is the most tokens it can handle in one request, counting your prompt, the chat history and its reply together.',
      run: (m) => {
        m.show('.tk-window', 0);
        m.after(300, () => { m.cls('.tk', 'win'); m.sfx.riser(1000); });
        m.after(400, () => m.count('.tk-used', 99840, 1200, { suffix: ' / 128,000 tokens' }));
      },
    },
    {
      title: 'Some languages use more',
      key: 'more',
      desc: 'Hindi or Tamil usually needs more tokens for the same meaning, so it costs more.',
      status: 'same meaning · more tokens',
      say: 'One more thing. Languages like Hindi or Tamil usually need more tokens for the same meaning, so the same message can cost more.',
      run: (m) => {
        m.show('.tk-lang > *', 400);
      },
    },
  ],
  end: {
    title: 'Tokens are the unit of everything',
    sub: 'Cost, speed and limits are all counted in tokens. Roughly four characters each in English.',
  },
};

export default spec;
