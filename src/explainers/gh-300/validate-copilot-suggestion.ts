import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

/** The checks a suggestion passes on its way to main, in order. */
const checks: [string, string, string][] = [
  ['read', I.eye, 'Read it'],
  ['test', I.check, 'Run tests'],
  ['lint', I.code, 'Lint'],
  ['scan', I.shield, 'Code scanning'],
  ['deps', I.layers, 'Dependency review'],
  ['human', I.user, 'Human review'],
];

const ck = ([id, icon, label]: [string, string, string]) =>
  `<div class="vc-ck vc-${id}"><span class="vc-ic">${icon}</span><b>${label}</b><span class="vc-st msd-mono">waiting</span></div>`;

const spec: ExplainerSpec = {
  id: 'validate-copilot-suggestion',
  lesson: 'validate-copilot-output',
  title: {
    main: 'Looks right isn’t <em>the same as works</em>',
    sub: 'A Copilot suggestion for applyDiscount meets a test, a fix, the pipeline checks and a human reviewer before it merges.',
  },
  summary:
    'An animation of validating a GitHub Copilot suggestion in a sample shop app. Copilot suggests an applyDiscount function as ghost text and the developer accepts it. It works for a valid code, but a test with an unknown code fails because the result is NaN. The developer adds a default of zero, the tests pass, lint, code scanning and dependency review go green, and a person approves the pull request. Copilot code review only comments and does not count as the approval.',
  html: `
  <div class="vc">
    <div class="vc-a">
      <div class="vc-ed msd-editor msd-reveal">
        <div class="ed-bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span class="vc-file msd-mono">src/discount.js</span><span class="vc-cp msd-reveal">${I.sparkle}Copilot</span></div>
        <div class="body">
          <div><span class="kw">const</span> CODES = { SAVE10: <span class="st">10</span>, HALF: <span class="st">50</span> };</div>
          <div class="vc-gap"></div>
          <div><span class="kw">export function</span> <span class="fn">applyDiscount</span>(total, code) {</div>
          <div class="vc-g vc-l4">  <span class="kw">const</span> pct = CODES[code];</div>
          <div class="vc-fix">  <span class="kw">const</span> pct = CODES[code] <b>?? 0</b>;</div>
          <div class="vc-g">  <span class="kw">return</span> total - (total * pct) / <span class="st">100</span>;</div>
          <div class="vc-g">}</div>
        </div>
      </div>
      <div class="vc-term msd-card msd-reveal">
        <div class="msd-label">Terminal</div>
        <div class="vc-tl vc-try msd-reveal msd-mono">applyDiscount(100, 'SAVE10') <span class="vc-okc">→ 90</span></div>
        <div class="vc-tl vc-run msd-reveal msd-mono">$ npm test</div>
        <div class="vc-tl vc-fail msd-reveal msd-mono"><span class="vc-badc">✖ unknown code leaves the total unchanged</span><br><small>AssertionError: NaN !== 100</small></div>
        <div class="vc-tl vc-pass msd-reveal msd-mono"><span class="vc-okc">✔ 5 tests passed</span></div>
      </div>
    </div>
    <div class="vc-b">
      <div class="vc-cks msd-card msd-reveal">
        <div class="msd-label">On the way to main</div>
        <div class="vc-list">${checks.map(ck).join('')}</div>
      </div>
      <div class="vc-pr msd-card accent msd-reveal">
        <div class="vc-prh"><b class="msd-mono">#54</b><p>Fix NaN for unknown discount codes</p></div>
        <div class="vc-rv"><span class="vc-ai">${I.sparkle}Copilot · commented</span><small>doesn't count as an approval</small></div>
        <div class="vc-rv vc-hu msd-reveal"><span class="vc-okc">${I.check}asha-dev · approved</span></div>
        <span class="vc-merge msd-pill ok msd-reveal">${I.check}Merged by a person</span>
      </div>
    </div>
    <div class="vc-flow"></div>
  </div>`,
  css: `
  @S code{ background:none; padding:0; border-radius:0; }
  @S .vc{ position:relative; height:100%; display:grid; grid-template-columns:620px 1fr; gap:20px; }
  @S .vc-a, @S .vc-b{ display:flex; flex-direction:column; gap:18px; min-height:0; }
  @S .vc-ed .body{ font-size:22px; line-height:1.6; padding:16px 20px; }
  @S .vc-file{ margin-left:12px; color:#9aa4b4; font-size:18px; }
  @S .vc-cp{ margin-left:auto; display:inline-flex; align-items:center; gap:6px; color:var(--x-you); font-size:17px; font-weight:700; }
  @S .vc-cp svg{ width:20px; height:20px; }
  @S .vc-gap{ height:18px; }
  @S .vc-g{ opacity:0; transition:opacity .35s ease, color .35s ease; }
  @S .vc-g.show{ opacity:1; color:#7d8590; font-style:italic; }
  @S .vc-g.show .kw, @S .vc-g.show .st{ color:#7d8590; }
  @S .vc-g.vc-acc{ color:#d4d4d4; font-style:normal; }
  @S .vc-g.vc-acc .kw{ color:#ff7b72; } @S .vc-g.vc-acc .st{ color:#ce9178; }
  @S .vc-l4.vc-bug{ background:rgb(244 74 106 / .18); border-radius:6px; }
  @S .vc-l4.vc-gone{ max-height:0; opacity:0; overflow:hidden; }
  @S .vc-fix{ max-height:0; opacity:0; overflow:hidden; transition:max-height .35s ease, opacity .35s ease; }
  @S .vc-fix.show{ max-height:40px; opacity:1; background:rgb(63 185 80 / .16); border-radius:6px; }
  @S .vc-fix b{ color:var(--x-ok); font-weight:700; }
  @S .vc-term{ padding:18px 20px; display:flex; flex-direction:column; gap:10px; flex:1; min-height:0; }
  @S .vc-tl{ color:var(--x-text); font-size:20px; line-height:1.4; }
  @S .vc-tl small{ color:var(--x-dim); font-size:18px; }
  @S .vc-okc{ color:var(--x-ok); display:inline-flex; align-items:center; gap:8px; }
  @S .vc-okc svg{ width:24px; height:24px; }
  @S .vc-badc{ color:var(--x-bad); }
  @S .vc-tl.vc-hide{ display:none; }
  @S .vc-cks{ padding:18px 20px; display:flex; flex-direction:column; gap:12px; }
  @S .vc-list{ display:flex; flex-direction:column; gap:8px; }
  @S .vc-ck{ display:grid; grid-template-columns:44px 1fr auto; align-items:center; gap:12px; padding:8px 12px; border-radius:12px; border:1.5px solid var(--x-line); background:rgb(14 20 32 / .7); transition:all .3s ease; }
  @S .vc-ic{ width:40px; height:40px; border-radius:10px; display:grid; place-items:center; background:rgb(58 160 255 / .12); color:var(--x-a1); }
  @S .vc-ic svg{ width:24px; height:24px; }
  @S .vc-ck b{ color:#fff; font-size:21px; }
  @S .vc-st{ color:var(--x-dim); font-size:17px; }
  @S .vc-ck.vc-ok{ border-color:var(--x-ok); background:rgb(63 185 80 / .08); }
  @S .vc-ck.vc-ok .vc-ic{ background:rgb(63 185 80 / .18); color:var(--x-ok); } @S .vc-ck.vc-ok .vc-st{ color:var(--x-ok); }
  @S .vc-ck.vc-bad{ border-color:var(--x-bad); background:rgb(244 74 106 / .1); }
  @S .vc-ck.vc-bad .vc-ic{ background:rgb(244 74 106 / .18); color:var(--x-bad); } @S .vc-ck.vc-bad .vc-st{ color:var(--x-bad); }
  @S .vc-pr{ padding:18px 20px; display:flex; flex-direction:column; gap:12px; }
  @S .vc-prh{ display:flex; gap:12px; align-items:baseline; }
  @S .vc-prh b{ color:var(--x-dim); font-size:20px; } @S .vc-prh p{ margin:0; color:#fff; font-size:22px; font-weight:700; }
  @S .vc-rv{ display:flex; align-items:center; gap:12px; flex-wrap:wrap; font-size:19px; }
  @S .vc-ai{ display:inline-flex; align-items:center; gap:8px; color:var(--x-you); font-weight:700; }
  @S .vc-ai svg{ width:22px; height:22px; }
  @S .vc-rv small{ color:var(--x-dim); font-size:17px; }
  @S .vc-hu{ font-weight:700; }
  @S .vc-merge{ align-self:flex-start; font-size:19px; padding:8px 14px; }
  @S .vc-flow{ position:absolute; inset:0; pointer-events:none; z-index:8; }
  @L .vc-ck{ padding:6px 12px; }
  @P .vc{ display:flex; flex-direction:column; gap:14px; }
  @P .vc-a{ gap:14px; }
  @P .vc-ed .body{ font-size:21px; line-height:1.45; padding:12px 18px; }
  @P .vc-term{ flex:none; padding:14px 18px; gap:8px; }
  @P .vc-cks{ padding:14px 18px; gap:10px; }
  @P .vc-list{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  @P .vc-ck{ grid-template-columns:40px 1fr; padding:6px 10px; }
  @P .vc-st{ grid-column:2; font-size:16px; }
  @P .vc-ck b{ font-size:20px; }
  @P .vc-pr{ padding:14px 18px; gap:10px; }
  `,
  stages: [
    {
      title: 'A suggestion appears',
      key: 'suggestion',
      desc: 'You type the function signature and pause. Copilot fills in the body as grey ghost text.',
      status: 'src/discount.js · ghost text',
      say: "You type the start of applyDiscount and pause. Copilot fills in the rest as grey ghost text. It reads cleanly, and it took two seconds.",
      run: (m) => {
        m.show('.vc-ed', 0);
        m.after(300, () => { m.show('.vc-cp', 0, true); m.show('.vc-g', 180); });
      },
    },
    {
      title: 'Accepted, and it works',
      key: 'works',
      desc: 'Tab accepts it. A quick try with SAVE10 gives 90. So far, so good.',
      status: 'Tab · accepted · SAVE10 → 90',
      say: "You press Tab. You try it with SAVE10 and a hundred, and you get ninety. It's tempting to stop right here.",
      run: (m) => {
        m.cls('.vc-g', 'vc-acc');
        m.sfx.pop();
        m.show('.vc-term', 0, true);
        m.show('.vc-cks', 0, true);
        m.after(400, () => m.show('.vc-try', 0, true));
        m.after(700, () => { m.cls('.vc-read', 'vc-ok'); m.text('.vc-read .vc-st', 'done'); m.punch('.vc-read', 1); });
      },
    },
    {
      title: 'Test the odd case',
      key: 'odd case',
      desc: 'A test with an unknown code fails. The total comes back as NaN, not 100.',
      status: 'npm test · 1 failing · NaN !== 100',
      say: "Now the question Copilot never asked: what if the code doesn't exist? One small test, and it fails. The total comes back as not a number.",
      run: (m) => {
        m.show('.vc-run', 0, true);
        m.after(500, () => {
          m.show('.vc-fail', 0, true);
          m.cls('.vc-test', 'vc-bad');
          m.text('.vc-test .vc-st', '1 failing');
          m.shake('.vc-test');
        });
      },
    },
    {
      title: 'It predicted, it didn’t check',
      key: 'didn’t check',
      desc: 'An unknown code makes pct undefined, and total * undefined is NaN. Nothing in the suggestion warned you.',
      status: 'pct = undefined · Copilot never ran it',
      say: "Here's why. An unknown code makes pct undefined, and maths with undefined gives not a number. Copilot predicts what code usually looks like. It never ran this.",
      run: (m) => {
        m.cls('.vc-l4', 'vc-bug');
        m.focus('.vc-ed', '.vc-term, .vc-cks');
        m.sfx.focus();
      },
    },
    {
      title: 'Fix it, run it again',
      key: 'again',
      desc: 'Default the percentage to zero with ?? 0. Rerun the tests: all five pass.',
      status: 'npm test · 5 passed',
      say: "The fix is one line: default the percentage to zero. You run the tests again, and all five pass. Now you know it works, instead of hoping.",
      run: (m) => {
        m.unfocus();
        m.cls('.vc-l4', 'vc-gone');
        m.after(200, () => { m.show('.vc-fix', 0, true); m.sfx.pop(); });
        m.after(600, () => {
          m.cls('.vc-fail', 'vc-hide');
          m.show('.vc-pass', 0, true);
          m.cls('.vc-test', 'vc-bad', false);
          m.cls('.vc-test', 'vc-ok');
          m.text('.vc-test .vc-st', '5 passed');
          m.sfx.lock();
        });
      },
    },
    {
      title: 'The pipeline checks too',
      key: 'pipeline',
      desc: 'In the pull request, lint, code scanning and dependency review look for what tests miss.',
      status: 'lint ✓ · CodeQL ✓ · dependency review ✓',
      say: "You open a pull request. The linter, code scanning and dependency review run on it, because tests only catch what you thought to test.",
      run: (m) => {
        (['lint', 'scan', 'deps'] as const).forEach((id, i) =>
          m.after(250 + i * 380, () => {
            m.cls(`.vc-${id}`, 'vc-ok');
            m.text(`.vc-${id} .vc-st`, 'passed');
            m.punch(`.vc-${id}`, i + 2);
          }),
        );
      },
    },
    {
      title: 'A person signs off',
      key: 'person',
      desc: 'Copilot code review can comment, but it never approves. A teammate approves, and a person merges.',
      status: '#54 · approved by asha-dev · merged',
      say: "Copilot code review leaves a comment, but it can't approve. Your teammate reads it, approves, and a person merges. Copilot sped you up. The checks made it right.",
      run: (m) => {
        m.show('.vc-pr', 0, true);
        m.after(600, () => {
          m.show('.vc-hu', 0, true);
          m.cls('.vc-human', 'vc-ok');
          m.text('.vc-human .vc-st', 'approved');
        });
        m.after(1200, () => { m.show('.vc-merge', 0, true); m.sfx.chime(); });
      },
    },
  ],
  end: {
    title: 'Read, test, scan, review',
    sub: 'Every Copilot suggestion is a draft until it has passed the same checks as anyone else’s code.',
  },
};

export default spec;
