import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const file = (k: string, path: string, note: string) =>
  `<div class="ci-f ${k} msd-reveal"><span class="ci-ic">${I.file}</span><b class="msd-mono">${path}</b><small>${note}</small></div>`;

const spec: ExplainerSpec = {
  id: 'copilot-custom-instructions',
  lesson: 'custom-instructions-and-prompt-files',
  title: {
    main: 'House rules that <em>ride along</em>',
    sub: 'Repository instructions, path-specific rules with applyTo, and a prompt file the whole team runs with one slash command.',
  },
  summary:
    'An animation in the contoso-shop repository. Asked for a test with no instructions, Copilot writes Jest with require. A .github/copilot-instructions.md file is added and its rules join the next request, so the test uses the Node test runner. A path-specific tests.instructions.md with applyTo tests/**/*.js joins only when a test file is involved and stays out when src/discount.js is edited. A prompt file runs with /new-endpoint and fills its input variable. The answer lists the files it used, and the same repository instructions are read by Copilot Chat, the coding agent and code review. Instructions steer the model, so review and tests still decide.',
  html: `
  <div class="ci">
    <div class="ci-l">
      <div class="ci-tree msd-card">
        <div class="msd-label">contoso-shop / .github</div>
        ${file('f-repo', 'copilot-instructions.md', 'whole repo')}
        ${file('f-path', 'instructions/tests.instructions.md', 'applyTo tests/**/*.js')}
        ${file('f-prompt', 'prompts/new-endpoint.prompt.md', 'run with /new-endpoint')}
      </div>
      <div class="ci-ed msd-editor msd-reveal">
        <div class="ed-bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span class="ci-fn msd-mono">copilot-instructions.md</span></div>
        <div class="ci-bodies">
          <div class="body b-repo msd-reveal"><div class="cm"># contoso-shop rules</div><div>- Node.js 22, ES modules</div><div>- Tests: node --test</div><div>- Never log secrets</div></div>
          <div class="body b-path msd-reveal"><div class="cm">---</div><div><span class="kw">applyTo</span>: <span class="st ci-glob">"tests/**/*.js"</span></div><div class="cm">---</div><div>Arrange, act, assert.</div><div>One behaviour per test.</div></div>
          <div class="body b-prompt msd-reveal"><div class="cm">---</div><div><span class="kw">mode</span>: agent</div><div class="cm">---</div><div>Create an endpoint for</div><div><span class="fn ci-var">\${input:resource}</span>, with tests.</div></div>
        </div>
      </div>
    </div>
    <div class="ci-r">
      <div class="ci-ask msd-card msd-reveal">
        <div class="ci-askh"><span class="ci-av">${I.user}</span><p class="ci-q">Write a test for cartTotal</p></div>
        <span class="msd-chip ci-in">working in tests/cart.test.js</span>
      </div>
      <div class="ci-pr msd-card accent msd-reveal">
        <div class="msd-label">What Copilot receives</div>
        <div class="ci-chips">
          <span class="ci-c c-q">your request</span>
          <span class="ci-c c-prompt msd-reveal">new-endpoint.prompt.md</span>
          <span class="ci-c c-repo msd-reveal">copilot-instructions.md</span>
          <span class="ci-c c-path msd-reveal">tests.instructions.md</span>
        </div>
      </div>
      <div class="ci-ans msd-card msd-reveal">
        <span class="ci-mark">${I.code}</span>
        <p class="ci-a msd-mono">const { expect } = require('jest')</p>
      </div>
      <div class="ci-refs msd-reveal">
        <span class="msd-pill accent ci-used">Used 2 references</span>
        <div class="ci-who msd-stagger"><span class="msd-pill">Copilot Chat</span><span class="msd-pill">Coding agent</span><span class="msd-pill">Code review</span></div>
      </div>
      <div class="ci-gate msd-pill ok msd-reveal">${I.shield}Instructions steer. Review and tests decide.</div>
    </div>
    <div class="ci-flow"></div>
  </div>`,
  css: `
  @S code{ background:none; padding:0; border-radius:0; }
  @S .ci{ position:relative; height:100%; display:grid; grid-template-columns:500px 1fr; gap:22px; }
  @S .ci-l, @S .ci-r{ display:flex; flex-direction:column; gap:16px; min-height:0; }
  @S .ci-tree{ padding:16px 18px; display:flex; flex-direction:column; gap:10px; }
  @S .ci-tree .msd-label{ font-size:18px; }
  @S .ci-f{ display:grid; grid-template-columns:36px 1fr; column-gap:10px; align-items:center; padding:8px 10px; border-radius:12px; border:1.5px solid var(--x-line); background:rgb(14 20 32 / .7); transition:border-color .3s, background .3s, opacity .3s; }
  @S .ci-ic{ grid-row:span 2; color:var(--x-a1); } @S .ci-ic svg{ width:30px; height:30px; }
  @S .ci-f b{ color:#fff; font-size:19px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  @S .ci-f small{ color:var(--x-dim); font-size:16px; }
  @S .ci-f.on{ border-color:var(--x-a1); background:rgb(58 160 255 / .12); }
  @S .ci-ed{ flex:1; min-height:0; display:flex; flex-direction:column; }
  @S .ci-fn{ margin-left:12px; color:#9aa4b4; font-size:18px; }
  @S .ci-bodies{ position:relative; flex:1; }
  @S .ci-bodies .body{ position:absolute; inset:0; font-size:22px; line-height:1.55; padding:16px 20px; }
  @S .ci-glob, @S .ci-var{ border-radius:6px; transition:background .3s; }
  @S .ci-glob.hit{ background:rgb(63 185 80 / .25); } @S .ci-glob.miss{ background:rgb(244 74 106 / .22); }
  @S .ci-var.hit{ background:rgb(34 211 238 / .22); }
  @S .ci-ask{ padding:16px 18px; display:flex; flex-direction:column; gap:10px; }
  @S .ci-askh{ display:flex; gap:12px; align-items:center; }
  @S .ci-av{ width:46px; height:46px; flex-shrink:0; border-radius:12px; display:grid; place-items:center; background:rgb(180 140 255 / .16); color:var(--x-you); }
  @S .ci-av svg{ width:28px; height:28px; }
  @S .ci-q{ margin:0; color:#fff; font-size:25px; font-weight:700; }
  @S .ci-in{ align-self:flex-start; font-size:18px; }
  @S .ci-pr{ padding:16px 18px; display:flex; flex-direction:column; gap:12px; }
  @S .ci-pr .msd-label{ font-size:18px; }
  @S .ci-chips{ display:flex; flex-wrap:wrap; gap:10px; min-height:46px; }
  @S .ci-c{ font-family:var(--x-mono); font-size:18px; font-weight:700; padding:8px 12px; border-radius:10px; border:1.5px solid var(--x-line); color:var(--x-text); background:rgb(255 255 255 / .05); transition:opacity .3s, border-color .3s; }
  @S .ci-c.c-q{ color:var(--x-you); border-color:rgb(180 140 255 / .5); }
  @S .ci-c.c-repo, @S .ci-c.c-path, @S .ci-c.c-prompt{ color:var(--x-a1); border-color:rgb(58 160 255 / .5); }
  @S .ci-c.skip{ opacity:.35; border-style:dashed; text-decoration:line-through; }
  @S .ci-ans{ padding:14px 18px; display:flex; gap:12px; align-items:center; }
  @S .ci-mark{ color:var(--x-dim); } @S .ci-mark svg{ width:30px; height:30px; }
  @S .ci-a{ margin:0; font-size:21px; color:#fff; }
  @S .ci-ans.bad{ border-color:var(--x-bad); } @S .ci-ans.bad .ci-mark{ color:var(--x-bad); }
  @S .ci-ans.good{ border-color:var(--x-ok); } @S .ci-ans.good .ci-mark{ color:var(--x-ok); }
  @S .ci-refs{ display:flex; flex-direction:column; gap:10px; align-items:flex-start; }
  @S .ci-who{ display:flex; flex-wrap:wrap; gap:8px; }
  @S .ci-refs .msd-pill{ font-size:18px; padding:7px 14px; }
  @S .ci-gate{ align-self:flex-start; font-size:19px; padding:8px 16px; }
  @S .ci-flow{ position:absolute; inset:0; pointer-events:none; z-index:8; }
  @P .ci{ grid-template-columns:1fr; display:flex; flex-direction:column; gap:16px; }
  @P .ci-l{ height:470px; flex-shrink:0; }
  @P .ci-r{ gap:14px; }
  @P .ci-q{ font-size:26px; }
  `,
  stages: [
    {
      title: 'Copilot guesses your conventions',
      key: 'guesses',
      desc: 'With no instructions, a request for a test gets whatever is most common, not what your team uses.',
      status: 'contoso-shop · no instructions',
      say: "You ask Copilot for a test in contoso-shop. It doesn't know your team uses the Node test runner, so it writes Jest with require. Wrong for this repo.",
      run: (m) => {
        m.show('.ci-ask', 0);
        m.show('.ci-pr', 0, true);
        m.after(500, () => {
          m.show('.ci-ans', 0, true);
          m.text('.ci-a', "const { expect } = require('jest')");
          m.cls('.ci-ans', 'bad');
          m.sfx.error();
        });
      },
    },
    {
      title: 'Write the rules down once',
      key: 'once',
      desc: '.github/copilot-instructions.md holds rules that are true for the whole repository.',
      status: '.github/copilot-instructions.md · created',
      say: "So you write the house rules once, in dot github, copilot instructions dot md. Node 22, ES modules, tests with node dash dash test.",
      run: (m) => {
        m.show('.f-repo', 0);
        m.cls('.f-repo', 'on');
        m.show('.ci-ed', 0, true);
        m.text('.ci-fn', 'copilot-instructions.md');
        m.show('.b-repo', 0, true);
      },
    },
    {
      title: 'The rules join every request',
      key: 'every request',
      desc: 'Copilot adds the repository file to requests in this repo, so the next answer follows it.',
      status: 'prompt · request + repo rules',
      say: "Ask again. This time the repository file rides along with your request, and the test uses node test and ES imports.",
      run: (m) => {
        m.particles('.ci-flow', { from: '.f-repo', to: '.ci-chips', count: 5, duration: 800 });
        m.after(500, () => { m.show('.c-repo', 0, true); m.sfx.pop(); });
        m.after(1000, () => {
          m.cls('.ci-ans', 'bad', false);
          m.cls('.ci-ans', 'good');
          m.text('.ci-a', "import { test } from 'node:test'");
          m.sfx.lock();
        });
      },
    },
    {
      title: 'Rules for some files only',
      key: 'some files',
      desc: 'A tests.instructions.md file with applyTo joins only when the work matches its glob.',
      status: 'applyTo "tests/**/*.js" · match',
      say: "Test rules only matter for test files. Put them in a path-specific file with applyTo. You're working in tests slash cart dot test dot js, the glob matches, so it joins too.",
      run: (m) => {
        m.cls('.f-repo', 'on', false);
        m.show('.f-path', 0);
        m.cls('.f-path', 'on');
        m.hide('.b-repo');
        m.text('.ci-fn', 'tests.instructions.md');
        m.show('.b-path', 0, true);
        m.after(400, () => m.cls('.ci-glob', 'hit'));
        m.after(700, () => m.particles('.ci-flow', { from: '.f-path', to: '.ci-chips', count: 4, duration: 700 }));
        m.after(1100, () => { m.show('.c-path', 0, true); m.sfx.pop(); });
      },
    },
    {
      title: 'No match, no extra rules',
      key: 'No match',
      desc: 'Editing src/discount.js? The glob doesn’t match, so only the repository rules go in.',
      status: 'src/discount.js · applyTo no match',
      say: "Now you edit source discount dot js. The glob doesn't match, so the test rules stay out. Only the repository rules go in.",
      run: (m) => {
        m.text('.ci-q', 'Clamp the total at zero');
        m.text('.ci-in', 'working in src/discount.js');
        m.cls('.ci-glob', 'hit', false);
        m.cls('.ci-glob', 'miss');
        m.cls('.c-path', 'skip');
        m.hide('.ci-ans');
        m.after(300, () => m.sfx.swipe());
      },
    },
    {
      title: 'A prompt the team reuses',
      key: 'reuses',
      desc: 'A .prompt.md file in .github/prompts runs with /name. ${input:resource} is filled from what you type.',
      status: '/new-endpoint resource=orders',
      say: "For tasks you repeat, save a prompt file. Type slash new endpoint, resource equals orders, and the input variable becomes orders. Everyone sends the same request.",
      run: (m) => {
        m.cls('.f-path', 'on', false);
        m.show('.f-prompt', 0);
        m.cls('.f-prompt', 'on');
        m.hide('.b-path');
        m.text('.ci-fn', 'new-endpoint.prompt.md');
        m.show('.b-prompt', 0, true);
        m.text('.ci-q', '/new-endpoint resource=orders');
        m.text('.ci-in', 'agent mode');
        m.after(500, () => { m.cls('.ci-var', 'hit'); m.show('.c-prompt', 0, true); m.sfx.pop(); });
      },
    },
    {
      title: 'Check what was used',
      key: 'used',
      desc: 'The answer lists its references. Chat, the coding agent and code review all read the repository file.',
      status: 'references · instructions applied',
      say: "The answer lists the files it used, so you can check your rules applied. And the same repository file is read by Copilot Chat, the coding agent and code review.",
      run: (m) => {
        m.show('.ci-refs', 0, true);
        m.after(300, () => m.show('.ci-who > *', 160));
      },
    },
    {
      title: 'Steer, then verify',
      key: 'verify',
      desc: 'Instructions are added to the prompt. They guide the model; your review and tests still decide.',
      status: 'review · npm test',
      say: "Remember, instructions steer the model, they don't enforce anything. Keep them short and clear, and let review and tests have the final word.",
      run: (m) => {
        m.show('.ci-gate', 0);
        m.after(400, () => m.sfx.chime());
      },
    },
  ],
  end: {
    title: 'Write it once, reuse it everywhere',
    sub: 'copilot-instructions.md for the repo, applyTo for some files, .prompt.md for tasks you repeat.',
  },
};

export default spec;
