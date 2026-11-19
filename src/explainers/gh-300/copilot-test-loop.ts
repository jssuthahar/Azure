import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

/** Generated tests for applyDiscount: [row id, name, first-run result, detail]. */
const tests: [string, string, 'pass' | 'fail', string][] = [
  ['t1', "SAVE10 takes 10% off", 'pass', '90'],
  ['t2', 'HALF takes 50% off', 'pass', '50'],
  ['t3', 'unknown code leaves the total unchanged', 'fail', 'expected 100, got NaN'],
  ['t4', 'no code leaves the total unchanged', 'fail', 'expected 100, got NaN'],
  ['t5', 'empty cart stays at 0', 'pass', '0'],
  ['t6', 'very large total: 10% off 1e12', 'pass', '9e11'],
];

const row = ([id, name]: [string, string, string, string]) =>
  `<div class="tl-row ${id}"><span class="tl-st"></span><p>${name}</p><span class="tl-res msd-mono"></span></div>`;

const spec: ExplainerSpec = {
  id: 'copilot-test-loop',
  lesson: 'unit-and-integration-tests',
  title: {
    main: 'Ask for edge cases, <em>let the failures talk</em>',
    sub: 'GitHub Copilot writes unit tests for applyDiscount, two fail, and the smallest fix turns the suite green. Then an integration test checks the pieces together.',
  },
  summary:
    'An animation of testing with GitHub Copilot in the contoso-shop sample repo. A developer selects applyDiscount and asks /tests with named edge cases, and Copilot suggests more. Six tests are written with exact assertions instead of weak ones. npm test shows two failures: an unknown code and no code return NaN because CODES[code] is undefined. The developer decides the code is wrong, applies a one-line fix with a default of 0, reruns and all six pass. Finally an integration test posts a cart to the API and checks the total of 90.',
  html: `
  <div class="tl">
    <div class="tl-a">
      <div class="tl-prompt msd-card msd-reveal">
        <span class="tl-av">${I.user}</span>
        <code class="tl-pt msd-mono"></code>
      </div>
      <div class="tl-edge msd-stagger">
        <span class="msd-chip">unknown code</span><span class="msd-chip">no code</span><span class="msd-chip">total 0</span><span class="msd-chip tl-sug">${I.sparkle}very large total</span><span class="msd-chip tl-sug">${I.sparkle}lowercase code?</span>
      </div>
      <div class="tl-code msd-editor msd-reveal">
        <div class="ed-bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span class="tl-file msd-mono">src/discount.js</span></div>
        <div class="body">
          <div><span class="kw">const</span> CODES = { SAVE10: <span class="st">10</span>, HALF: <span class="st">50</span> };</div>
          <div><span class="kw">export function</span> <span class="fn">applyDiscount</span>(total, code) {</div>
          <div class="tl-bug">&nbsp;&nbsp;<span class="kw">const</span> pct = CODES[code];</div>
          <div class="tl-fix">&nbsp;&nbsp;<span class="kw">const</span> pct = CODES[code] ?? <span class="st">0</span>;</div>
          <div>&nbsp;&nbsp;<span class="kw">return</span> total - (total * pct) / <span class="st">100</span>;</div>
          <div>}</div>
        </div>
        <div class="tl-why msd-reveal">${I.warn}<span>CODES['NOPE'] is undefined, so the maths gives NaN</span></div>
      </div>
    </div>
    <div class="tl-b">
      <div class="tl-tests msd-card msd-reveal">
        <div class="tl-th"><b class="msd-mono">tests/discount.test.js</b><span class="tl-sum msd-mono">not run yet</span></div>
        <div class="tl-rows">${tests.map(row).join('')}</div>
      </div>
      <div class="tl-slot">
        <div class="tl-cmp msd-card msd-reveal">
          <div class="msd-label">Assertions that can fail</div>
          <div class="tl-ab tl-weak"><span>Weak</span><code class="msd-mono">assert.ok(applyDiscount(100, 'NOPE'))</code><small>passes even if the maths is wrong</small></div>
          <div class="tl-ab tl-strong"><span>Strong</span><code class="msd-mono">assert.equal(applyDiscount(100, 'NOPE'), 100)</code><small>one behaviour, exact expected value</small></div>
        </div>
        <div class="tl-int msd-card accent msd-reveal">
          <div class="msd-label">Integration test · parts working together</div>
          <div class="tl-chain msd-stagger">
            <span class="msd-pill">POST /cart/total</span><span class="tl-arw">${I.arrow}</span><span class="msd-pill">cart.js</span><span class="tl-arw">${I.arrow}</span><span class="msd-pill">discount.js</span><span class="tl-arw">${I.arrow}</span><span class="msd-pill ok">200 · total 90</span>
          </div>
        </div>
      </div>
    </div>
    <div class="tl-flow"></div>
  </div>`,
  css: `
  @S code{ background:none; padding:0; border-radius:0; } /* the lesson's light inline-code chip doesn't belong on the dark stage */
  @S .tl{ position:relative; height:100%; display:grid; grid-template-columns:1fr 1fr; gap:22px; }
  @S .tl-a, @S .tl-b{ display:flex; flex-direction:column; gap:18px; min-height:0; }
  @S .tl-prompt{ display:flex; gap:14px; align-items:center; padding:18px 20px; }
  @S .tl-av{ width:52px; height:52px; flex-shrink:0; border-radius:14px; display:grid; place-items:center; background:rgb(180 140 255 / .16); color:var(--x-you); }
  @S .tl-av svg{ width:30px; height:30px; }
  @S .tl-pt{ color:#fff; font-size:23px; line-height:1.4; min-height:32px; }
  @S .tl-edge{ display:flex; flex-wrap:wrap; gap:10px; min-height:46px; }
  @S .tl-sug{ color:var(--x-cyan); border-color:rgb(34 211 238 / .45); background:rgb(34 211 238 / .1); }
  @S .tl-code .body{ font-size:22px; line-height:1.6; padding:14px 20px; }
  @S .tl-file{ margin-left:12px; color:#9aa4b4; font-size:18px; }
  @S .tl-bug{ border-radius:6px; transition:background .3s, opacity .3s; }
  @S .tl-bug.tl-hot{ background:rgb(244 74 106 / .2); }
  @S .tl-bug.tl-old{ opacity:.45; text-decoration:line-through; background:rgb(244 74 106 / .12); }
  @S .tl-fix{ max-height:0; opacity:0; overflow:hidden; border-radius:6px; transition:max-height .35s ease, opacity .35s ease; }
  @S .tl-fix.show{ max-height:44px; opacity:1; background:rgb(63 185 80 / .18); }
  @S .tl-why{ display:flex; gap:10px; align-items:center; margin:0 16px 14px; padding:10px 14px; border-radius:12px; color:var(--x-warn); background:rgb(240 166 74 / .1); border:1.5px solid rgb(240 166 74 / .45); font-size:19px; }
  @S .tl-why svg{ width:24px; height:24px; flex-shrink:0; }
  @S .tl-tests{ padding:18px; display:flex; flex-direction:column; gap:10px; }
  @S .tl-th{ display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; }
  @S .tl-th b{ color:#fff; font-size:22px; }
  @S .tl-sum{ margin-left:auto; font-size:19px; font-weight:700; color:var(--x-dim); }
  @S .tl-sum.tl-red{ color:var(--x-bad); } @S .tl-sum.tl-green{ color:var(--x-ok); }
  @S .tl-rows{ display:flex; flex-direction:column; gap:6px; }
  @S .tl-row{ display:grid; grid-template-columns:34px 1fr auto; align-items:center; gap:10px; padding:7px 12px; border-radius:12px; border:1.5px solid var(--x-line); background:rgb(14 20 32 / .7); transition:all .3s ease; }
  @S .tl-row p{ margin:0; color:var(--x-text); font-size:19px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  @S .tl-st::before{ content:'○'; color:var(--x-dim); font-size:22px; font-weight:700; }
  @S .tl-res{ font-size:17px; color:var(--x-dim); white-space:nowrap; }
  @S .tl-row.tl-pass{ border-color:rgb(63 185 80 / .55); }
  @S .tl-row.tl-pass .tl-st::before{ content:'✔'; color:var(--x-ok); }
  @S .tl-row.tl-pass .tl-res{ color:var(--x-ok); }
  @S .tl-row.tl-fail{ border-color:var(--x-bad); background:rgb(244 74 106 / .12); }
  @S .tl-row.tl-fail .tl-st::before{ content:'✖'; color:var(--x-bad); }
  @S .tl-row.tl-fail .tl-res{ color:var(--x-bad); }
  @S .tl-slot{ position:relative; flex:1; min-height:220px; }
  @S .tl-cmp, @S .tl-int{ position:absolute; inset:0; padding:18px 20px; display:flex; flex-direction:column; gap:12px; }
  @S .tl-ab{ display:grid; grid-template-columns:96px 1fr; gap:4px 12px; align-items:center; padding:10px 12px; border-radius:12px; }
  @S .tl-ab span{ font-weight:700; font-size:20px; }
  @S .tl-ab code{ color:#fff; font-size:18px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  @S .tl-ab small{ grid-column:2; color:var(--x-dim); font-size:16px; }
  @S .tl-weak{ border:1.5px dashed rgb(240 166 74 / .55); } @S .tl-weak span{ color:var(--x-warn); }
  @S .tl-strong{ border:1.5px solid rgb(63 185 80 / .6); background:rgb(63 185 80 / .07); } @S .tl-strong span{ color:var(--x-ok); }
  @S .tl-chain{ display:flex; flex-wrap:wrap; align-items:center; gap:10px; }
  @S .tl-chain .msd-pill{ font-size:19px; padding:8px 14px; }
  @S .tl-arw{ color:var(--x-dim); display:grid; place-items:center; } @S .tl-arw svg{ width:24px; height:24px; }
  @S .tl-flow{ position:absolute; inset:0; pointer-events:none; z-index:8; }
  @L .tl-code .body{ font-size:21px; line-height:1.5; }
  @P .tl{ grid-template-columns:1fr; display:flex; flex-direction:column; gap:16px; }
  @P .tl-a, @P .tl-b{ gap:14px; }
  @P .tl-pt{ font-size:22px; }
  @P .tl-code .body{ font-size:21px; line-height:1.45; padding:12px 18px; }
  @P .tl-row p{ font-size:19px; }
  @P .tl-row{ grid-template-columns:30px 1fr; }
  @P .tl-res{ grid-column:2; font-size:16px; }
  @P .tl-slot{ min-height:250px; }
  `,
  stages: [
    {
      title: 'Ask for tests, name the edge cases',
      key: 'edge cases',
      desc: 'Select applyDiscount and run /tests, listing the awkward inputs you already know about.',
      status: '/tests · src/discount.js selected',
      say: "Start by selecting applyDiscount and typing slash tests. Don't just say write tests. Name the awkward inputs you already know: an unknown code, no code, a zero total.",
      run: (m) => {
        m.show('.tl-prompt', 0);
        m.show('.tl-code', 0, true);
        m.after(300, () => m.type('.tl-pt', '/tests applyDiscount: unknown code, no code, total 0', 28));
      },
    },
    {
      title: 'Copilot adds the ones you missed',
      key: 'missed',
      desc: 'It suggests more edge cases. You still decide the business rule for each one.',
      status: 'edge cases · 3 named · 2 suggested',
      say: "Copilot adds a couple you didn't think of, like a very large total or a lowercase code. Useful, but you decide the rule. Should save10 in lowercase work? That's a business call, not Copilot's.",
      run: (m) => {
        m.show('.tl-edge > *', 160);
        m.after(900, () => m.sfx.sparkle());
      },
    },
    {
      title: 'Six tests, one behaviour each',
      key: 'one behaviour',
      desc: 'Copilot writes tests in the framework the repo already uses, each named after one behaviour.',
      status: 'tests/discount.test.js · 6 tests · node --test',
      say: "Copilot writes six tests in the framework the repo already uses. Each one is named after a single behaviour, so when one fails you know exactly what broke.",
      run: (m) => {
        m.show('.tl-tests', 0, true);
        m.after(200, () => m.particles('.tl-flow', { from: '.tl-prompt', to: '.tl-rows', count: 6, duration: 800 }));
      },
    },
    {
      title: 'Assertions that can fail',
      key: 'can fail',
      desc: '"Is it truthy?" passes even when the maths is wrong. An exact expected value catches the bug.',
      status: 'assert.equal(actual, expected)',
      say: "Now read the assertions. A weak one only checks the result exists, and it passes even when the maths is wrong. A strong one checks an exact value: one hundred in, one hundred out.",
      run: (m) => {
        m.show('.tl-cmp', 0);
        m.after(700, () => m.punch('.tl-strong', 2));
      },
    },
    {
      title: 'Run them: two fail',
      key: 'two fail',
      desc: 'An unknown code and no code both return NaN instead of the original total.',
      status: 'npm test · pass 4 · fail 2',
      say: "Run npm test. Four pass, two fail. An unknown code and no code both come back as not a number instead of the original total.",
      run: (m) => {
        m.hide('.tl-cmp');
        tests.forEach(([id, , res, detail], i) =>
          m.after(250 + i * 180, () => {
            m.cls(`.${id}`, res === 'pass' ? 'tl-pass' : 'tl-fail');
            m.text(`.${id} .tl-res`, detail);
            if (res === 'fail') { m.shake(`.${id}`); m.sfx.error(); } else m.sfx.tick();
          }),
        );
        m.after(1400, () => { m.text('.tl-sum', 'pass 4 · fail 2'); m.cls('.tl-sum', 'tl-red'); });
      },
    },
    {
      title: 'Bug in the code, or in the test?',
      key: 'Bug',
      desc: "Read the code. CODES['NOPE'] is undefined, so the code is wrong and the tests are right.",
      status: 'decide · code bug, keep the tests',
      say: "This is the moment that matters. Is the code wrong or the test? Read the code: an unknown code gives undefined, and the maths turns that into NaN. The tests are right. They just found a real bug.",
      run: (m) => {
        m.cls('.tl-bug', 'tl-hot');
        m.focus('.tl-code', '.tl-a > *, .tl-b > *');
        m.after(500, () => m.show('.tl-why', 0));
      },
    },
    {
      title: 'Smallest fix, then green',
      key: 'green',
      desc: 'Default unknown codes to 0 percent, review the one-line diff, and rerun the whole suite.',
      status: 'npm test · pass 6 · fail 0',
      say: "Ask for the smallest fix: default the percentage to zero. Review the one-line diff, run the whole suite again, and now all six pass. Only then do you commit.",
      run: (m) => {
        m.unfocus();
        m.hide('.tl-why');
        m.cls('.tl-bug', 'tl-hot', false);
        m.cls('.tl-bug', 'tl-old');
        m.show('.tl-fix', 0, true);
        m.after(300, () => m.sfx.pop());
        ['t3', 't4'].forEach((id, i) =>
          m.after(800 + i * 250, () => { m.cls(`.${id}`, 'tl-fail', false); m.cls(`.${id}`, 'tl-pass'); m.text(`.${id} .tl-res`, '100'); }),
        );
        m.after(1400, () => { m.text('.tl-sum', 'pass 6 · fail 0'); m.cls('.tl-sum', 'tl-red', false); m.cls('.tl-sum', 'tl-green'); m.sfx.chime(); });
      },
    },
    {
      title: 'Then test the pieces together',
      key: 'together',
      desc: 'An integration test posts a cart to the API and checks the route, cart and discount code work as one.',
      status: 'supertest · POST /cart/total · 200 · total 90',
      say: "Unit tests check one function at a time. An integration test checks the pieces together: post a cart to the API, and expect a two hundred status and a total of ninety.",
      run: (m) => {
        m.show('.tl-int', 0);
        m.after(300, () => m.show('.tl-chain > *', 140));
        m.after(1400, () => m.sfx.ding());
      },
    },
  ],
  end: {
    title: 'Name the edge cases, read the failures',
    sub: 'Exact assertions, a failing test treated as a clue, the smallest fix, and an integration test on top.',
  },
};

export default spec;
