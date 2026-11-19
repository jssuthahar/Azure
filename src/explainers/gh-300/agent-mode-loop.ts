import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

/** One line in the chat log. Lines start collapsed and grow in when shown. */
const ln = (k: string, icon: string, text: string, extra = '') =>
  `<div class="ag-ln ${k}"><span class="ag-ic">${icon}</span><div class="ag-tx"><p>${text}</p>${extra}</div></div>`;

const btns = (k: string, labels: string[]) =>
  `<div class="ag-btns">${labels.map((l, i) => `<span class="ag-b ${k}${i}">${l}</span>`).join('')}</div>`;

const spec: ExplainerSpec = {
  id: 'agent-mode-loop',
  lesson: 'agent-mode-mcp-and-subagents',
  title: {
    main: 'One request, <em>a whole task</em>',
    sub: 'GitHub Copilot agent mode: plan, edit, run tests after you approve, fix what fails, call an MCP tool and hand research to a sub-agent.',
  },
  summary:
    'An animation of GitHub Copilot agent mode in VS Code. A developer asks for a FREE discount code with tests. The agent searches the codebase, edits src/discount.js and creates a test file, then asks before running npm test. One test fails, so it fixes the code and runs the tests again until all pass. It asks before calling the list_issues tool on the GitHub MCP server, sends a research question to a sub-agent that works in its own context and returns a short summary, and finishes with diffs the developer can keep or undo.',
  html: `
  <div class="ag">
    <div class="ag-chat msd-card">
      <div class="ag-ch">
        <span class="ag-mode msd-chip">${I.bolt}Agent</span>
        <div class="ag-ctx"><span>main context</span><i><u></u></i></div>
      </div>
      <div class="ag-log">
        ${ln('l-me ag-me', I.user, 'Add a FREE code (100% off), keep totals at 0 or more, and add tests.')}
        ${ln('l-plan', I.search, 'Searched codebase: <code>discount</code>, <code>CODES</code>')}
        ${ln('l-edit', I.code, 'Edited <code>src/discount.js</code> · created <code>tests/discount.test.js</code>')}
        ${ln('l-run', I.play, 'Run in terminal: <code>npm test</code>', btns('rb', ['Allow', 'Allow for this session', 'Skip']))}
        ${ln('l-fix', I.code, 'Unknown codes gave NaN. Defaulted them to 0% in <code>src/discount.js</code>, ran again.')}
        ${ln('l-mcp', I.plug, 'Call <code>github › list_issues</code>?', btns('mb', ['Allow', 'Skip']))}
        ${ln('l-sub', I.layers, 'Sub-agent: where else is the discount applied?')}
        ${ln('l-done ag-ai', I.check, 'Done. FREE gives 100% off, totals never go below 0, 5 tests pass.', btns('db', ['Keep', 'Undo']))}
      </div>
    </div>
    <div class="ag-r">
      <div class="ag-files msd-card msd-reveal">
        <div class="msd-label">Files</div>
        <div class="ag-f f1"><b class="msd-mono">src/discount.js</b><span class="ag-st msd-mono">+3 −1</span></div>
        <div class="ag-f f2"><b class="msd-mono">tests/discount.test.js</b><span class="ag-st msd-mono">new</span></div>
        <div class="ag-f f3"><b class="msd-mono">src/cart.js</b><span class="ag-st msd-mono">read</span></div>
      </div>
      <div class="ag-term msd-editor msd-reveal">
        <div class="ed-bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span class="ag-tt msd-mono">terminal</span></div>
        <div class="body">
          <div class="ag-cmd">$ npm test</div>
          <div class="ag-out"></div>
        </div>
      </div>
      <div class="ag-slot">
        <div class="ag-mcpc msd-card msd-reveal">
          <div class="ag-sh">${I.plug}<b>MCP server: github</b></div>
          <span class="msd-chip ag-url">https://api.githubcopilot.com/mcp/</span>
          <div class="ag-res msd-stagger"><span class="ag-is msd-mono">#41 HALF applies twice on refresh</span><span class="ag-is msd-mono">#44 NaN for unknown codes</span></div>
        </div>
        <div class="ag-subc msd-card msd-reveal">
          <div class="ag-sh">${I.layers}<b>Sub-agent</b><small>its own context</small></div>
          <div class="ag-subm"><span>sub-agent context</span><i><u></u></i><small class="msd-mono">read 14 files (example)</small></div>
          <div class="ag-sum msd-pop">${I.arrow}<p>Summary back: <b>only cartTotal calls applyDiscount</b></p></div>
        </div>
        <div class="ag-endc msd-card accent msd-reveal">
          <div class="msd-label">You stay in charge</div>
          <div class="ag-pills msd-stagger">
            <span class="msd-pill ok">${I.check}review every diff</span>
            <span class="msd-pill accent">${I.play}approve commands</span>
            <span class="msd-pill accent">${I.plug}approve tool calls</span>
            <span class="msd-pill">${I.layers}side tasks in their own context</span>
          </div>
        </div>
      </div>
    </div>
    <div class="ag-flow"></div>
  </div>`,
  css: `
  @S code{ background:none; padding:0; border-radius:0; color:var(--x-cyan); font-family:var(--x-mono); }
  @S .ag{ position:relative; height:100%; display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  @S .ag-chat{ padding:18px; display:flex; flex-direction:column; gap:14px; min-height:0; }
  @S .ag-ch{ display:flex; align-items:center; gap:16px; }
  @S .ag-mode{ font-size:20px; }
  @S .ag-ctx{ flex:1; display:flex; flex-direction:column; gap:6px; }
  @S .ag-ctx span, @S .ag-subm span{ color:var(--x-dim); font-size:16px; font-weight:700; letter-spacing:1px; text-transform:uppercase; }
  @S .ag-ctx i, @S .ag-subm i{ display:block; height:14px; border-radius:7px; background:var(--x-line); overflow:hidden; }
  @S .ag-ctx u, @S .ag-subm u{ display:block; height:100%; width:4%; border-radius:7px; background:var(--x-a1); transition:width .8s cubic-bezier(.4,0,.2,1); }
  @S .ag-ctx.c1 u{ width:14%; } @S .ag-ctx.c2 u{ width:26%; } @S .ag-ctx.c3 u{ width:38%; } @S .ag-ctx.c4 u{ width:46%; } @S .ag-ctx.c5 u{ width:52%; } @S .ag-ctx.c6 u{ width:55%; }
  @S .ag-log{ flex:1; min-height:0; display:flex; flex-direction:column; justify-content:flex-end; gap:10px; overflow:hidden; }
  @S .ag-ln{ display:flex; gap:12px; align-items:flex-start; max-height:0; opacity:0; overflow:hidden; flex-shrink:0; padding:0 14px; border-radius:16px; border:1.5px solid transparent; background:rgb(14 20 32 / .7); transition:max-height .4s ease, opacity .35s ease, padding .35s ease, border-color .3s; }
  @S .ag-ln.show{ max-height:220px; opacity:1; padding:12px 14px; border-color:var(--x-line); }
  @S .ag-ic{ width:40px; height:40px; flex-shrink:0; display:grid; place-items:center; border-radius:12px; background:rgb(58 160 255 / .12); color:var(--x-a1); }
  @S .ag-ic svg{ width:24px; height:24px; }
  @S .ag-tx{ display:flex; flex-direction:column; gap:10px; min-width:0; }
  @S .ag-tx p{ margin:0; color:var(--x-text); font-size:21px; line-height:1.4; }
  @S .ag-me .ag-ic{ background:rgb(180 140 255 / .16); color:var(--x-you); }
  @S .ag-me .ag-tx p{ color:#fff; font-weight:700; }
  @S .ag-ln.ag-wait{ border-color:var(--x-warn); }
  @S .ag-ln.ag-wait .ag-ic{ color:var(--x-warn); background:rgb(240 166 74 / .14); }
  @S .ag-ai.show{ border-color:var(--x-ok); background:rgb(63 185 80 / .08); }
  @S .ag-ai .ag-ic{ color:var(--x-ok); background:rgb(63 185 80 / .14); }
  @S .ag-btns{ display:flex; gap:8px; flex-wrap:wrap; }
  @S .ag-b{ font-size:16px; font-weight:700; padding:6px 12px; border-radius:9px; border:1.5px solid var(--x-line); color:var(--x-dim); transition:all .25s; }
  @S .ag-b.ag-on{ color:#fff; border-color:var(--x-ok); background:rgb(63 185 80 / .22); }
  @S .ag-r{ display:flex; flex-direction:column; gap:16px; min-height:0; }
  @S .ag-files{ padding:16px 18px; display:flex; flex-direction:column; gap:8px; }
  @S .ag-f{ display:flex; align-items:center; gap:12px; padding:8px 12px; border-radius:12px; border:1.5px solid var(--x-line); transition:all .3s; }
  @S .ag-f b{ color:var(--x-text); font-size:19px; flex:1; }
  @S .ag-st{ font-size:16px; font-weight:700; opacity:0; transition:opacity .3s; }
  @S .ag-f.ag-hit{ border-color:var(--x-a1); background:rgb(58 160 255 / .08); }
  @S .ag-f.ag-ch1 .ag-st{ opacity:1; color:var(--x-ok); }
  @S .f3.ag-ch1 .ag-st{ color:var(--x-dim); }
  @S .ag-term .body{ font-size:20px; line-height:1.55; padding:14px 18px; min-height:110px; }
  @S .ag-tt{ margin-left:12px; color:#9aa4b4; font-size:16px; }
  @S .ag-cmd{ color:#d4d4d4; opacity:0; transition:opacity .3s; }
  @S .ag-term.ag-ran .ag-cmd{ opacity:1; }
  @S .ag-out{ white-space:pre-line; }
  @S .ag-out.ag-fail{ color:var(--x-bad); } @S .ag-out.ag-pass{ color:var(--x-ok); }
  @S .ag-slot{ position:relative; flex:1; min-height:0; }
  @S .ag-mcpc, @S .ag-subc, @S .ag-endc{ position:absolute; inset:0; padding:18px; display:flex; flex-direction:column; gap:14px; pointer-events:none; }
  @S .ag-sh{ display:flex; align-items:center; gap:10px; color:var(--x-a1); }
  @S .ag-sh svg{ width:28px; height:28px; } @S .ag-sh b{ color:#fff; font-size:23px; } @S .ag-sh small{ margin-left:auto; color:var(--x-dim); font-size:17px; }
  @S .ag-url{ align-self:flex-start; font-size:17px; }
  @S .ag-res{ display:flex; flex-direction:column; gap:8px; }
  @S .ag-is{ color:var(--x-text); font-size:19px; padding:8px 12px; border-radius:10px; background:rgb(255 255 255 / .04); border:1px solid var(--x-line); }
  @S .ag-subm{ display:flex; flex-direction:column; gap:6px; }
  @S .ag-subm u{ background:var(--x-you); }
  @S .ag-subc.ag-busy .ag-subm u{ width:88%; }
  @S .ag-subm small{ color:var(--x-dim); font-size:16px; }
  @S .ag-sum{ display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:14px; border:1.5px solid var(--x-ok); background:rgb(63 185 80 / .08); color:var(--x-ok); }
  @S .ag-sum svg{ width:26px; height:26px; flex-shrink:0; }
  @S .ag-sum p{ margin:0; color:#fff; font-size:20px; line-height:1.35; } @S .ag-sum b{ color:var(--x-cyan); }
  @S .ag-pills{ display:flex; flex-wrap:wrap; gap:10px; }
  @S .ag-pills .msd-pill{ font-size:18px; padding:8px 14px; }
  @S .ag-flow{ position:absolute; inset:0; pointer-events:none; z-index:8; }
  @P .ag{ grid-template-columns:1fr; grid-template-rows:440px 1fr; gap:14px; }
  @P .ag-chat{ padding:14px 16px; gap:10px; }
  @P .ag-tx p{ font-size:22px; }
  @P .ag-r{ gap:12px; }
  @P .ag-files{ padding:12px 16px; gap:6px; }
  @P .ag-f{ padding:6px 12px; }
  @P .ag-term .body{ min-height:96px; padding:10px 16px; }
  @P .ag-mcpc, @P .ag-subc, @P .ag-endc{ padding:14px 16px; gap:10px; }
  @P .ag-ln.msd-punch{ animation-name:ag-nudge; }
  @keyframes ag-nudge{ 0%, 100%{ transform:none; } 42%{ transform:scale(1.02); } }
  `,
  stages: [
    {
      title: 'Ask for the outcome',
      key: 'outcome',
      desc: 'In agent mode you describe what done looks like, not the steps to get there.',
      status: 'Chat view · mode: Agent',
      say: "Switch the chat to agent mode and ask for the result you want: a FREE code that gives a hundred percent off, totals that never go below zero, and tests.",
      run: (m) => {
        m.show('.l-me', 0);
        m.cls('.ag-ctx', 'c1');
      },
    },
    {
      title: 'It plans and finds the files',
      key: 'plans',
      desc: 'The agent searches the codebase and picks the files to change. You never listed them.',
      status: 'tool · search codebase · 3 files',
      thinking: true,
      say: "First it plans. It searches the codebase for discount code and works out which files matter. You didn't have to list them, which is the big difference from edit mode.",
      run: (m) => {
        m.show('.l-plan', 0, true);
        m.show('.ag-files', 0, true);
        m.cls('.ag-ctx', 'c1', false);
        m.cls('.ag-ctx', 'c2');
        m.after(400, () => m.particles('.ag-flow', { from: '.l-plan', to: '.ag-files', count: 5, duration: 700 }));
        m.after(700, () => { m.cls('.ag-f', 'ag-hit'); m.sfx.lock(); });
      },
    },
    {
      title: 'It edits, and you see each diff',
      key: 'edits',
      desc: 'One file changed, one test file created, one only read. Every change is a diff you can review.',
      status: 'edit · src/discount.js +3 −1 · tests/discount.test.js new',
      say: "Next it edits. It changes discount dot js, creates a test file, and only reads cart dot js. Every change shows up as a diff you can review.",
      run: (m) => {
        m.show('.l-edit', 0, true);
        m.after(300, () => { m.cls('.ag-f', 'ag-ch1'); m.cls('.ag-f', 'ag-hit', false); m.sfx.pop(); });
      },
    },
    {
      title: 'It asks before it runs a command',
      key: 'asks',
      desc: 'npm test needs your approval: allow once, allow for this session, or skip.',
      status: 'approval needed · npm test',
      say: "Now it wants to run npm test. It asks first. You can allow it once, allow it for the rest of the session, or skip it. Here we allow it once, and one test fails.",
      run: (m) => {
        m.show('.l-run', 0, true);
        m.cls('.l-run', 'ag-wait');
        m.cls('.ag-ctx', 'c2', false);
        m.cls('.ag-ctx', 'c3');
        m.after(900, () => {
          m.cls('.l-run', 'ag-wait', false);
          m.cls('.rb0', 'ag-on');
          m.show('.ag-term', 0, true);
          m.cls('.ag-term', 'ag-ran');
          m.sfx.pop();
        });
        m.after(1500, () => {
          m.cls('.ag-out', 'ag-fail');
          m.text('.ag-out', '✖ 4 passed, 1 failed\n  unknown code: expected 100, got NaN');
          m.shake('.ag-term');
          m.sfx.error();
        });
      },
    },
    {
      title: 'It reads the failure and iterates',
      key: 'iterates',
      desc: 'The agent reads the test output, fixes the code and runs the tests again until they pass.',
      status: 'iterate · npm test · 5 passed',
      say: "This is the loop. The agent reads the failing test, fixes the code, and runs the tests again. Now all five pass. Edit mode can't do this part: it never runs anything.",
      run: (m) => {
        m.show('.l-fix', 0, true);
        m.cls('.ag-ctx', 'c3', false);
        m.cls('.ag-ctx', 'c4');
        m.after(600, () => {
          m.cls('.ag-out', 'ag-fail', false);
          m.cls('.ag-out', 'ag-pass');
          m.text('.ag-out', '✔ 5 passed, 0 failed');
          m.punch('.ag-term', 2);
          m.sfx.chime();
        });
      },
    },
    {
      title: 'MCP gives it new tools',
      key: 'MCP',
      desc: 'The GitHub MCP server, listed in .vscode/mcp.json, lets the agent read issues. Each tool call is approved.',
      status: 'mcp · github › list_issues · approved',
      say: "To check related bugs, it calls a tool from the GitHub MCP server, set up in dot vscode slash mcp dot json. Again it asks first. You allow it, and the open issues come back.",
      run: (m) => {
        m.show('.l-mcp', 0, true);
        m.show('.ag-mcpc', 0, true);
        m.cls('.ag-ctx', 'c4', false);
        m.cls('.ag-ctx', 'c5');
        m.after(700, () => { m.cls('.mb0', 'ag-on'); m.sfx.pop(); });
        m.after(900, () => m.particles('.ag-flow', { from: '.ag-url', to: '.ag-res', count: 4, duration: 600 }));
        m.after(1300, () => m.show('.ag-is', 200));
      },
    },
    {
      title: 'A sub-agent keeps context lean',
      key: 'sub-agent',
      desc: 'Research runs in its own context window. Only a short summary comes back to the main conversation.',
      status: 'sub-agent · own context · summary returned',
      say: "One more question: where else is the discount applied? A sub-agent goes off and reads the files in its own context. Its meter fills up, but the main one barely moves, because only a one-line summary comes back.",
      run: (m) => {
        m.hide('.ag-mcpc');
        m.show('.l-sub', 0, true);
        m.show('.ag-subc', 0, true);
        m.after(400, () => { m.cls('.ag-subc', 'ag-busy'); m.sfx.riser(900); });
        m.after(1500, () => {
          m.show('.ag-sum', 0, true);
          m.particles('.ag-flow', { from: '.ag-sum', to: '.l-sub', count: 3, duration: 600 });
          m.cls('.ag-ctx', 'c5', false);
          m.cls('.ag-ctx', 'c6');
          m.sfx.lock();
        });
      },
    },
    {
      title: 'You keep or undo',
      key: 'keep or undo',
      desc: 'The agent reports what it did. You review the diffs, then Keep or Undo. A person still owns the change.',
      status: 'done · 2 files changed · Keep / Undo',
      say: "Finally it reports back. You read the diffs, then keep or undo them. The agent did the legwork, but every command, every tool call and every change went past you.",
      run: (m) => {
        m.hide('.ag-subc');
        m.show('.l-done', 0, true);
        m.show('.ag-endc', 0, true);
        m.after(400, () => m.show('.ag-pills > *', 160));
        m.after(1200, () => { m.cls('.db0', 'ag-on'); m.sfx.chime(); });
      },
    },
  ],
  end: {
    title: 'Plan, edit, run, iterate',
    sub: 'Agent mode does the legwork, MCP adds tools, sub-agents keep the context lean, and you approve and review every step.',
  },
};

export default spec;
