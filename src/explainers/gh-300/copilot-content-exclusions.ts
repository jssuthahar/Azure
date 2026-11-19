import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const spec: ExplainerSpec = {
  id: 'copilot-content-exclusions',
  lesson: 'content-exclusions',
  title: {
    main: 'Keep a file <em>out of Copilot</em>',
    sub: 'What Copilot reads from your open tabs, how a content exclusion removes a file, and what it does and does not cover.',
  },
  summary:
    'An animation of content exclusions in GitHub Copilot. A developer in the contoso-shop repository has cart.js, discount.js and config/secrets.js open, and all three feed the prompt. A repository admin adds /config/secrets.js under Settings, Copilot, Content exclusion. After up to 30 minutes (or a window reload) the excluded file stops being sent as context, and opening it shows no inline suggestions with a status bar note. An organization YAML rule then excludes every .env file in all repositories. The video ends with the limits: exclusions are for Business and Enterprise, not every Copilot feature honours them, and the github.copilot.enable setting is a personal editor switch, not a security control.',
  html: `
  <div class="ce">
    <div class="ce-ide msd-editor msd-reveal">
      <div class="ed-bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i>
        <span class="ce-tab ce-t1 msd-mono">cart.js</span><span class="ce-tab ce-t2 msd-mono">discount.js</span><span class="ce-tab ce-t3 msd-mono">secrets.js</span></div>
      <div class="body ce-body">
        <div class="ce-cart">
          <div><span class="kw">import</span> { applyDiscount } <span class="kw">from</span> <span class="st">'./discount.js'</span>;</div>
          <div><span class="kw">export function</span> <span class="fn">cartTotal</span>(items, code) {</div>
          <div class="ce-ghost">  return applyDiscount(sum(items), code);</div>
          <div>}</div>
        </div>
        <div class="ce-sec">
          <div class="cm">// config/secrets.js</div>
          <div><span class="kw">export const</span> PAYMENT_KEY = <span class="st">'pk_live_…'</span>; <span class="cm">// example</span></div>
          <div class="ce-none cm">// no inline suggestions here</div>
        </div>
      </div>
      <div class="ce-status msd-mono"><span class="ce-s1">Copilot: ready</span><span class="ce-s2">Copilot: content excluded for this file</span></div>
    </div>
    <div class="ce-prompt msd-card msd-reveal">
      <div class="msd-label">Context sent with the prompt</div>
      <div class="ce-chips msd-stagger">
        <span class="msd-chip ce-c1">src/cart.js</span><span class="msd-chip ce-c2">src/discount.js</span><span class="msd-chip ce-c3">config/secrets.js</span>
      </div>
      <span class="ce-leak msd-pill bad msd-reveal">${I.warn}A secret file is in the context</span>
      <span class="ce-safe msd-pill ok msd-reveal">${I.shield}Excluded file left out</span>
    </div>
    <div class="ce-set msd-card msd-reveal">
      <div class="ce-sh">${I.gear}<b>contoso/contoso-shop · Settings › Copilot</b></div>
      <div class="msd-label">Content exclusion · paths</div>
      <code class="ce-path msd-mono"></code>
      <span class="ce-wait msd-pill accent msd-reveal">${I.clock}<span>up to <b class="ce-min">0</b> min to reach open IDEs</span></span>
      <div class="ce-org msd-reveal">
        <div class="msd-label">Organization · contoso</div>
        <pre class="msd-mono">"*":
  - "**/.env"</pre>
      </div>
    </div>
    <div class="ce-lim msd-card accent msd-reveal">
      <div class="ce-li">${I.check}<span>Business and Enterprise plans</span></div>
      <div class="ce-li">${I.warn}<span>Not every Copilot feature honours exclusions</span></div>
      <div class="ce-li">${I.gear}<span>github.copilot.enable is a personal switch, not a control</span></div>
    </div>
    <div class="ce-flow"></div>
  </div>`,
  css: `
  @S code, @S pre{ background:none; padding:0; border-radius:0; margin:0; }
  @S .ce{ position:relative; height:100%; display:grid; grid-template-columns:1fr 1fr; grid-template-rows:auto 1fr; gap:20px; }
  @S .ce-ide{ grid-column:1 / 3; display:flex; flex-direction:column; }
  @S .ce-tab{ margin-left:14px; color:#9aa4b4; font-size:19px; padding:6px 12px; border-radius:8px; transition:all .3s; }
  @S .ce-tab.on{ background:#1e1e1e; color:#fff; }
  @S .ce-tab.ex{ color:var(--x-bad); text-decoration:line-through; }
  @S .ce-body{ font-size:22px; line-height:1.55; padding:16px 22px; min-height:176px; position:relative; }
  @S .ce-cart, @S .ce-sec{ transition:opacity .3s; }
  @S .ce-sec{ position:absolute; inset:16px 22px; opacity:0; }
  @S .ce.ce-insec .ce-cart{ opacity:0; } @S .ce.ce-insec .ce-sec{ opacity:1; }
  @S .ce-ghost{ color:#6e7681; font-style:italic; }
  @S .ce-none{ font-style:italic; }
  @S .ce-status{ height:40px; display:flex; align-items:center; padding:0 18px; background:#007acc; color:#fff; font-size:18px; position:relative; }
  @S .ce-s2{ display:none; } @S .ce.ce-insec .ce-s1{ display:none; } @S .ce.ce-insec .ce-s2{ display:inline; }
  @S .ce.ce-insec .ce-status{ background:#6e3a00; }
  @S .ce-prompt, @S .ce-set, @S .ce-lim{ padding:20px; display:flex; flex-direction:column; gap:14px; }
  @S .ce-chips{ display:flex; flex-wrap:wrap; gap:10px; }
  @S .ce-chips .msd-chip{ transition:all .3s; }
  @S .ce-c3.bad{ color:var(--x-bad); background:rgb(244 74 106 / .14); border-color:rgb(244 74 106 / .5); }
  @S .ce-c3.cut{ opacity:.3; text-decoration:line-through; }
  @S .ce-prompt .msd-pill{ align-self:flex-start; font-size:19px; padding:8px 14px; }
  @S .ce-note{ position:relative; }
  @S .ce-sh{ display:flex; align-items:center; gap:10px; color:#fff; font-size:20px; }
  @S .ce-sh svg{ width:24px; height:24px; color:var(--x-cyan); }
  @S .ce-path{ color:var(--x-ok); font-size:22px; min-height:30px; }
  @S .ce-wait{ align-self:flex-start; font-size:18px; padding:8px 14px; }
  @S .ce-org pre{ color:var(--x-text); font-size:20px; line-height:1.4; padding:10px 14px; border-radius:12px; background:rgb(255 255 255 / .04); }
  @S .ce-org{ display:flex; flex-direction:column; gap:8px; }
  @S .ce-lim{ position:absolute; left:0; right:0; bottom:0; z-index:9; }
  @S .ce-li{ display:flex; align-items:center; gap:12px; color:#fff; font-size:22px; }
  @S .ce-li svg{ width:26px; height:26px; color:var(--x-cyan); flex-shrink:0; }
  @S .ce-flow{ position:absolute; inset:0; pointer-events:none; z-index:8; }
  @P .ce{ grid-template-columns:1fr; grid-template-rows:auto auto auto; gap:16px; }
  @P .ce-ide{ grid-column:1; }
  @P .ce-body{ font-size:21px; }
  @P .ce-set{ gap:10px; }
  `,
  stages: [
    {
      title: 'Copilot reads your open tabs',
      key: 'open tabs',
      desc: 'For an inline suggestion in cart.js, Copilot sends nearby code plus snippets from other open files.',
      status: 'contoso-shop · 3 tabs open · building prompt',
      say: "You're working in cart.js in the contoso-shop repo. To suggest the next line, Copilot sends the code around your cursor, plus snippets from the other files you have open.",
      run: (m) => {
        m.show('.ce-ide', 0, true);
        m.cls('.ce-t1', 'on');
        m.show('.ce-prompt', 0, true);
        m.after(300, () => m.show('.ce-chips > *', 180));
        m.after(400, () => m.particles('.ce-flow', { from: '.ce-ide', to: '.ce-chips', count: 6, duration: 800 }));
      },
    },
    {
      title: 'A secret file goes along too',
      key: 'secret file',
      desc: 'config/secrets.js is open in a tab, so its contents can end up in the context.',
      status: 'context includes config/secrets.js',
      say: "But secrets.js is open too. Nothing stops its contents from going along as context. That's the file your security team wants Copilot to ignore.",
      run: (m) => {
        m.cls('.ce-c3', 'bad');
        m.shake('.ce-c3');
        m.show('.ce-leak', 0, true);
        m.sfx.error();
      },
    },
    {
      title: 'Exclude the path in the repository',
      key: 'Exclude',
      desc: 'Settings › Copilot › Content exclusion: list paths, one per line. Business and Enterprise only.',
      status: 'repo settings · content exclusion',
      say: "A repository admin opens Settings, then Copilot, then Content exclusion, and adds the path. This needs Copilot Business or Enterprise.",
      run: (m) => {
        m.show('.ce-set', 0, true);
        m.after(300, () => m.type('.ce-path', '- "/config/secrets.js"', 35));
      },
    },
    {
      title: 'Give it time to reach the IDE',
      key: 'time',
      desc: 'Changes can take up to 30 minutes to reach editors that are already open. Reloading the window helps.',
      status: 'waiting · reload window to pick it up sooner',
      say: "The change isn't instant. It can take up to thirty minutes to reach an editor that's already open. Reloading the window picks it up sooner.",
      run: (m) => {
        m.show('.ce-wait', 0, true);
        m.after(200, () => { m.count('.ce-min', 30, 1200); m.sfx.riser(1200); });
      },
    },
    {
      title: 'The file stays out of the prompt',
      key: 'out of the prompt',
      desc: 'Copilot no longer uses the excluded file as context for suggestions in other files.',
      status: 'context · cart.js, discount.js only',
      say: "Now when you type in cart.js, only cart.js and discount.js go into the prompt. The excluded file is left out.",
      run: (m) => {
        m.hide('.ce-leak');
        m.cls('.ce-c3', 'bad', false);
        m.cls('.ce-c3', 'cut');
        m.cls('.ce-t3', 'ex');
        m.after(200, () => m.particles('.ce-flow', { from: '.ce-ide', to: '.ce-c1', count: 4, duration: 700 }));
        m.after(700, () => { m.show('.ce-safe', 0, true); m.sfx.lock(); });
      },
    },
    {
      title: 'Open the excluded file',
      key: 'excluded file',
      desc: 'Inside secrets.js there is no ghost text, and the Copilot status icon says the file is excluded.',
      status: 'secrets.js · content excluded',
      say: "Open secrets.js itself and you get no inline suggestions at all. The Copilot icon in the status bar tells you the file is excluded, so you know it isn't broken.",
      run: (m) => {
        m.cls('.ce-t1', 'on', false);
        m.cls('.ce-t3', 'on');
        m.cls('.ce', 'ce-insec');
        m.flash('.ce-status');
        m.sfx.pop();
      },
    },
    {
      title: 'One rule for every repository',
      key: 'every repository',
      desc: 'Organization admins write YAML: a repository name, or "*" for all, followed by its paths.',
      status: 'org · "*" → **/.env',
      say: "Organization admins can go wider. They write a little YAML: a repo name, or a star for every repo, and the paths. Here, every dot env file in contoso is excluded.",
      run: (m) => {
        m.show('.ce-org', 0, true);
        m.punch('.ce-org', 2);
      },
    },
    {
      title: 'Know what it covers',
      key: 'covers',
      desc: 'Not every Copilot feature honours exclusions, so check the docs. The language setting in your editor is personal.',
      status: 'exclusions · check which features honour them',
      say: "Last, know the limits. Not every Copilot feature honours exclusions, so check the docs for the ones you use. And turning Copilot off for a language in your editor is a personal choice, not a security control.",
      run: (m) => {
        m.show('.ce-lim', 0);
        m.after(400, () => m.sfx.chime());
      },
    },
  ],
  end: {
    title: 'List it, wait for it, check it',
    sub: 'Exclude paths in repo or org settings, allow up to 30 minutes, then confirm with the status bar icon.',
  },
};

export default spec;
