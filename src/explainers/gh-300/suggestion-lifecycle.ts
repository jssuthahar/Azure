import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const node = (k: string, icon: string, name: string, sub: string, tag: string, extra = '') =>
  `<div class="msd-node sl-n ${k}"><span class="ic">${icon}</span><div class="sl-nt"><b>${name}</b><small>${sub}</small>${extra}</div><span class="sl-tag msd-reveal">${tag}</span></div>`;

const spec: ExplainerSpec = {
  id: 'suggestion-lifecycle',
  lesson: 'suggestion-lifecycle-and-limits',
  title: {
    main: 'From your keystroke <em>to grey ghost text</em>',
    sub: 'One GitHub Copilot inline suggestion, step by step: context, prompt, proxy, model, post-processing and your decision.',
  },
  summary:
    'An animation of the life of one GitHub Copilot inline suggestion in VS Code. A developer pauses inside applyDiscount in src/discount.js. The extension gathers context (code before and after the cursor, the file name and language, an open tab), skips excluded files and trims the prompt to fit the context window. The prompt goes over HTTPS to the Copilot proxy, which authenticates it and runs pre-filters. The model predicts tokens, post-processing checks quality, insecure patterns, offensive content and public code matches, and the suggestion appears as ghost text. The developer accepts it with Tab, engagement data is recorded, and the video ends with the limits of large language models.',
  html: `
  <div class="sl">
    <div class="sl-a">
      <div class="sl-ed msd-editor">
        <div class="ed-bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span class="sl-file msd-mono">src/discount.js</span></div>
        <div class="body">
          <div><span class="kw">const</span> CODES = { SAVE10: 10, HALF: 50 };</div>
          <div class="sl-before"><span class="kw">export function</span> <span class="fn">applyDiscount</span>(total, code) {</div>
          <div class="sl-cur">&nbsp;&nbsp;<span class="sl-ghost">const pct = CODES[code] ?? 0;</span><span class="sl-caret msd-breathing"></span></div>
          <div class="sl-after">&nbsp;&nbsp;<span class="kw">return</span> total - (total * pct) / 100;</div>
          <div>}</div>
        </div>
        <div class="sl-hint msd-reveal"><span>Tab accept</span><span>Esc dismiss</span><span>Alt+] next</span><span>Ctrl+→ one word</span></div>
      </div>
      <div class="sl-ctx msd-card msd-reveal">
        <div class="msd-label">Context the extension gathers</div>
        <div class="sl-chips msd-stagger">
          <span class="msd-chip">code before the cursor</span>
          <span class="msd-chip">code after the cursor</span>
          <span class="msd-chip">discount.js · JavaScript</span>
          <span class="msd-chip">open tab: cart.js</span>
        </div>
        <div class="sl-pills">
          <span class="sl-skip msd-pill bad msd-reveal">${I.x}config/secrets.js excluded, skipped</span>
          <span class="sl-fit msd-pill ok msd-reveal">${I.check}prompt trimmed to fit the context window</span>
        </div>
      </div>
    </div>
    <div class="sl-pipe">
      ${node('n-proxy', I.shield, 'Copilot proxy', 'HTTPS · auth · pre-filters', 'request allowed')}
      ${node('n-llm', I.brain, 'Large language model', 'predicts the next tokens', 'tokens predicted', '<code class="sl-tok msd-mono"></code>')}
      ${node('n-post', I.search, 'Post-processing', 'checks before you see it', 'all checks passed', `<div class="sl-checks msd-stagger"><span>${I.check}quality and insecure patterns</span><span>${I.check}offensive content</span><span>${I.check}public code match (Block)</span></div>`)}
      <div class="sl-eng msd-pill accent msd-reveal">${I.meter}engagement data: accepted</div>
    </div>
    <div class="sl-lim">
      <div class="msd-label">Limits to keep in mind</div>
      <div class="sl-lims msd-stagger">
        <span class="msd-pill">${I.clock}knowledge cut-off</span>
        <span class="msd-pill">${I.layers}limited context window</span>
        <span class="msd-pill">${I.sparkle}different output each time</span>
        <span class="msd-pill bad">${I.warn}can be wrong or insecure</span>
      </div>
    </div>
    <div class="sl-flow"></div>
  </div>`,
  css: `
  @S code{ background:none; padding:0; border-radius:0; } /* the lesson's light inline-code chip doesn't belong on the dark stage */
  @S .sl{ position:relative; height:100%; display:grid; grid-template-columns:620px 1fr; gap:20px; }
  @S .sl-a{ display:flex; flex-direction:column; gap:18px; min-height:0; }
  @S .sl-ed .body{ font-size:22px; line-height:1.6; padding:16px 20px; }
  @S .sl-file{ margin-left:12px; color:#9aa4b4; font-size:18px; }
  @S .sl-before, @S .sl-after{ border-radius:6px; transition:background .3s; }
  @S .sl-ctxon .sl-before, @S .sl-ctxon .sl-after{ background:rgb(58 160 255 / .14); }
  @S .sl-caret{ display:inline-block; width:3px; height:26px; vertical-align:middle; background:#fff; }
  @S .sl-ghost{ display:none; color:#8b949e; font-style:italic; transition:color .3s; }
  @S .sl-ghost.show{ display:inline; }
  @S .sl-ghost.sl-in{ color:#d4d4d4; font-style:normal; }
  @S .sl-hint{ display:flex; flex-wrap:wrap; gap:8px; padding:0 20px 16px; }
  @S .sl-hint span{ font-family:var(--x-mono); font-size:17px; color:var(--x-dim); padding:4px 10px; border-radius:8px; border:1px solid var(--x-line); }
  @S .sl-ctx{ padding:18px 20px; display:flex; flex-direction:column; gap:12px; }
  @S .sl-chips{ display:flex; flex-wrap:wrap; gap:8px; }
  @S .sl-chips .msd-chip{ font-size:19px; }
  @S .sl-pills{ display:flex; flex-direction:column; gap:8px; align-items:flex-start; }
  @S .sl-pills .msd-pill{ font-size:18px; padding:7px 14px; }
  @S .sl-pills .msd-pill svg{ width:22px; height:22px; }
  @S .sl-pipe{ display:flex; flex-direction:column; gap:16px; min-height:0; }
  @S .sl-n{ position:relative; align-items:flex-start; padding:16px 18px; transition:border-color .3s, box-shadow .3s; }
  @S .sl-nt{ display:flex; flex-direction:column; gap:4px; min-width:0; flex:1; }
  @S .sl-nt b{ color:#fff; font-size:24px; } @S .sl-nt small{ color:var(--x-dim); font-size:17px; font-family:var(--x-mono); font-weight:600; }
  @S .sl-tag{ position:absolute; right:14px; top:14px; font-family:var(--x-mono); font-size:15px; font-weight:700; padding:4px 10px; border-radius:8px; color:var(--x-ok); background:rgb(63 185 80 / .14); }
  @S .sl-tok{ color:var(--x-cyan); font-size:19px; min-height:26px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  @S .sl-checks{ display:flex; flex-direction:column; gap:4px; margin-top:4px; }
  @S .sl-checks span{ display:flex; align-items:center; gap:8px; color:var(--x-text); font-size:18px; font-weight:600; }
  @S .sl-checks svg{ width:20px; height:20px; color:var(--x-ok); }
  @S .sl-eng{ align-self:flex-start; font-size:18px; padding:8px 14px; }
  @S .sl-eng svg{ width:22px; height:22px; }
  @S .sl-lim{ position:absolute; left:0; right:0; bottom:0; z-index:7; display:flex; flex-direction:column; gap:10px; padding:16px 18px; border-radius:20px; background:rgb(14 20 32 / .96); border:1.5px solid rgb(58 160 255 / .5); pointer-events:none; opacity:0; transition:opacity .3s ease; }
  @S .sl-lim.sl-limon{ opacity:1; }
  @S .sl-lims{ display:flex; flex-wrap:wrap; gap:10px; }
  @S .sl-lims .msd-pill{ font-size:19px; padding:8px 14px; }
  @S .sl-lims .msd-pill svg{ width:22px; height:22px; }
  @S .sl-flow{ position:absolute; inset:0; pointer-events:none; z-index:8; }
  @P .sl{ display:flex; flex-direction:column; gap:14px; }
  @P .sl-a{ gap:12px; flex-shrink:0; }
  @P .sl-ed .body{ font-size:21px; line-height:1.5; padding:12px 18px; }
  @P .sl-ctx{ padding:14px 16px; gap:10px; }
  @P .sl-pipe{ gap:10px; }
  @P .sl-n{ padding:12px 14px; }
  @P .sl-n .ic{ width:48px; height:48px; } @P .sl-n .ic svg{ width:28px; height:28px; }
  @P .sl-nt b{ font-size:22px; }
  @P .sl-checks{ flex-direction:row; flex-wrap:wrap; gap:4px 14px; }
  @P .sl-checks span{ font-size:17px; }
  `,
  stages: [
    {
      title: 'You type, then pause',
      key: 'pause',
      desc: 'Inside applyDiscount in src/discount.js, the cursor stops. The Copilot extension starts a request.',
      status: 'discount.js · line 3 · typing paused',
      say: "You're inside applyDiscount and you stop typing for a moment. That pause is the trigger. The Copilot extension in VS Code starts a request for a suggestion.",
      run: (m) => {
        m.punch('.sl-caret');
        m.sfx.tick();
      },
    },
    {
      title: 'The extension gathers context',
      key: 'context',
      desc: 'Code before and after the cursor, the file name and language, and snippets from open tabs.',
      status: 'context · prefix + suffix + open tabs',
      say: "Next, it gathers context. The code above the cursor, the code below it, the file name and language, and related bits from tabs you have open, like cart dot js.",
      run: (m) => {
        m.cls('.sl-ed', 'sl-ctxon');
        m.show('.sl-ctx', 0, true);
        m.after(300, () => m.show('.sl-chips > *', 180));
      },
    },
    {
      title: 'Exclusions, then a prompt that fits',
      key: 'fits',
      desc: 'Excluded files are left out. The rest is ranked and trimmed, because the context window is limited.',
      status: 'content exclusion checked · prompt built',
      say: "Files your admin has excluded are left out. Then the extension trims the rest, because the model can only read so much at once. What's left is the prompt.",
      run: (m) => {
        m.show('.sl-skip', 0, true);
        m.after(500, () => { m.show('.sl-fit', 0, true); m.sfx.lock(); });
      },
    },
    {
      title: 'Over HTTPS to the Copilot proxy',
      key: 'proxy',
      desc: 'The proxy checks who you are, then pre-filters for things like offensive text and prompt injection.',
      status: 'HTTPS · authenticated · pre-filters passed',
      say: "The prompt travels encrypted to the Copilot proxy. It checks you're allowed to use Copilot, then filters out harmful text and prompt injection attempts before the model sees anything.",
      run: (m) => {
        m.particles('.sl-flow', { from: '.sl-ed', to: '.n-proxy', count: 6, duration: 800 });
        m.after(600, () => { m.cls('.n-proxy', 'hot'); });
        m.after(1300, () => { m.cls('.n-proxy', 'hot', false); m.cls('.n-proxy', 'ok'); m.show('.n-proxy .sl-tag', 0, true); });
      },
    },
    {
      title: 'The model predicts tokens',
      key: 'predicts',
      desc: "The large language model guesses the most likely next tokens. It doesn't run or test your code.",
      status: 'model · predicting · 1 of several candidates',
      thinking: true,
      say: "The model predicts the most likely next tokens, one after another. It's matching patterns. It never runs your code, so a confident answer can still be wrong.",
      run: (m) => {
        m.particles('.sl-flow', { from: '.n-proxy', to: '.n-llm', count: 4, duration: 600 });
        m.cls('.n-llm', 'hot');
        m.after(500, () => m.type('.sl-tok', 'const pct = CODES[code] ?? 0;', 40));
        m.after(1900, () => { m.cls('.n-llm', 'hot', false); m.cls('.n-llm', 'ok'); m.show('.n-llm .sl-tag', 0, true); });
      },
    },
    {
      title: 'Post-processing checks the reply',
      key: 'Post-processing',
      desc: 'Quality and common insecure patterns, offensive content, and a public code match check if your policy says Block.',
      status: 'post-processing · 3 checks',
      say: "Before you see it, the reply is checked again. Quality and common insecure patterns, offensive content, and, if your policy blocks public code matches, a check for that too.",
      run: (m) => {
        m.particles('.sl-flow', { from: '.n-llm', to: '.n-post', count: 4, duration: 600 });
        m.cls('.n-post', 'hot');
        m.after(400, () => m.show('.sl-checks > *', 260));
        m.after(1400, () => { m.cls('.n-post', 'hot', false); m.cls('.n-post', 'ok'); m.show('.n-post .sl-tag', 0, true); });
      },
    },
    {
      title: 'Grey ghost text appears',
      key: 'ghost text',
      desc: 'The suggestion lands at your cursor. Tab accepts, Esc dismisses, Alt+] shows another one.',
      status: 'ghost text · suggestion 1/3',
      say: "The suggestion shows up as grey ghost text right where you paused. Tab takes it, Escape throws it away, and Alt plus the right bracket shows you another option.",
      run: (m) => {
        m.particles('.sl-flow', { from: '.n-post', to: '.sl-cur', count: 5, duration: 700 });
        m.after(600, () => { m.show('.sl-ghost'); m.show('.sl-hint', 0, true); });
      },
    },
    {
      title: 'You decide, then remember the limits',
      key: 'You decide',
      desc: 'You press Tab. Copilot records that you accepted it. The code is still a draft you review and test.',
      status: 'accepted · engagement data recorded',
      say: "You press Tab and the code is yours to check. Copilot records that you accepted it, which feeds usage metrics. And keep the limits in mind: a knowledge cut-off, a small window, answers that change, and mistakes.",
      run: (m) => {
        m.cls('.sl-ghost', 'sl-in');
        m.sfx.pop();
        m.after(400, () => m.show('.sl-eng', 0, true));
        m.after(1100, () => { m.cls('.sl-lim', 'sl-limon'); m.show('.sl-lims > *', 200); });
      },
    },
  ],
  end: {
    title: 'Context, proxy, model, filters, you',
    sub: 'Every inline suggestion makes the same trip, and every one is a draft until you review it.',
  },
};

export default spec;
