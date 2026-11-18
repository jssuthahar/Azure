import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const msg = (k: string, name: string) =>
  `<div class="sbq-m ${k} msd-pop"><span class="sbq-mi">${I.file}</span><b class="msd-mono">${name}</b><span class="sbq-lk">${I.lock}<small class="sbq-by"></small></span><span class="sbq-dc msd-mono">delivery count 0</span></div>`;

const worker = (k: string, name: string) => `
  <div class="sbq-w ${k}">
    <div class="sbq-wh"><span class="sbq-wi">${I.cpu}</span><b>${name}</b><span class="sbq-st msd-mono">idle</span></div>
    <div class="sbq-hold"><b class="sbq-hn msd-mono"></b><span class="sbq-lt">${I.clock}<em class="msd-mono">60</em>s lock</span><span class="sbq-res msd-mono"></span></div>
  </div>`;

const spec: ExplainerSpec = {
  id: 'service-bus-queue',
  lesson: 'service-bus-queues',
  title: {
    main: 'Hand the slow work <em>to a queue</em>',
    sub: 'Azure Service Bus in peek-lock mode: send and reply 202, lock, complete or abandon, lock expiry, and the dead-letter queue.',
  },
  summary:
    'An animation of an Azure Service Bus queue. An upload API sends three messages and replies 202 Accepted. Worker A receives invoice-42 in peek-lock mode, it stays locked in the queue, then complete removes it. Worker B abandons contract-88 so it returns with a higher delivery count, a crashed worker lets its lock expire, and after the default max delivery count of 10 the message moves to the dead-letter queue.',
  html: `
  <div class="sbq">
    <div class="sbq-api msd-card">
      <div class="sbq-ah"><span class="sbq-ai">${I.app}</span><b>Upload API</b></div>
      <span class="sbq-202 msd-pill ok msd-reveal">${I.check}202 Accepted</span>
      <small class="msd-mono">ServiceBusMessage → summarise-jobs</small>
    </div>
    <div class="sbq-q msd-card">
      <div class="sbq-qh">${I.layers}<b class="msd-mono">summarise-jobs</b><span>queue</span></div>
      <div class="sbq-lane">${msg('m1', 'invoice-42')}${msg('m2', 'contract-88')}${msg('m3', 'memo-7')}</div>
    </div>
    <div class="sbq-ws">${worker('wa', 'Worker A')}${worker('wb', 'Worker B')}</div>
    <div class="sbq-dlq msd-card">
      <div class="sbq-dh">${I.warn}<b class="msd-mono">summarise-jobs/$deadletterqueue</b></div>
      <div class="sbq-dm msd-pop"><b class="msd-mono">contract-88</b><span class="msd-mono">MaxDeliveryCountExceeded</span></div>
    </div>
    <div class="sbq-sum msd-stagger">
      <span class="msd-pill ok">complete = remove</span><span class="msd-pill accent">abandon = try again</span><span class="msd-pill bad">10 failures = dead-letter</span><span class="msd-pill">handler safe to run twice</span>
    </div>
    <div class="sbq-flow"></div>
  </div>`,
  css: `
  @S .sbq{ position:relative; height:100%; display:grid; grid-template-columns:250px 1fr 320px; grid-template-rows:1fr auto; grid-template-areas:"api q ws" "api dlq ws"; gap:20px; }
  @S .sbq-api{ grid-area:api; padding:20px; display:flex; flex-direction:column; justify-content:center; gap:16px; }
  @S .sbq-ah{ display:flex; flex-direction:column; align-items:flex-start; gap:10px; }
  @S .sbq-ai, @S .sbq-wi, @S .sbq-mi{ display:grid; place-items:center; flex-shrink:0; border-radius:14px; background:rgb(58 160 255 / .12); color:var(--x-a1); }
  @S .sbq-ai{ width:60px; height:60px; } @S .sbq-ai svg{ width:34px; height:34px; }
  @S .sbq-ah b{ color:#fff; font-size:27px; }
  @S .sbq-api small{ color:var(--x-dim); font-size:17px; line-height:1.4; }
  @S .sbq-202{ align-self:flex-start; font-size:20px; }
  @S .sbq-q{ grid-area:q; padding:20px; display:flex; flex-direction:column; gap:14px; border-style:dashed; border-color:rgb(58 160 255 / .5); }
  @S .sbq-qh{ display:flex; align-items:center; gap:12px; color:var(--x-a1); }
  @S .sbq-qh svg{ width:32px; height:32px; } @S .sbq-qh b{ color:#fff; font-size:25px; } @S .sbq-qh span{ color:var(--x-dim); font-size:19px; }
  @S .sbq-lane{ display:flex; flex-direction:column; gap:12px; }
  @S .sbq-m{ display:grid; grid-template-columns:auto 1fr auto; grid-template-rows:auto auto; gap:4px 14px; align-items:center; padding:14px 16px; border-radius:16px; border:1.5px solid var(--x-line); background:rgb(14 20 32 / .85); max-height:140px; overflow:hidden; }
  @S .sbq-mi{ grid-row:1 / 3; width:50px; height:50px; } @S .sbq-mi svg{ width:28px; height:28px; }
  @S .sbq-m > b{ color:#fff; font-size:23px; }
  @S .sbq-dc{ grid-column:2 / 4; color:var(--x-dim); font-size:17px; }
  @S .sbq-lk{ display:flex; align-items:center; gap:6px; color:var(--x-warn); opacity:0; transition:opacity .3s; }
  @S .sbq-lk svg{ width:24px; height:24px; } @S .sbq-lk small{ font-size:16px; font-family:var(--x-mono); }
  @S .sbq-m.sbq-locked{ border-color:rgb(240 166 74 / .7); background:rgb(240 166 74 / .06); }
  @S .sbq-m.sbq-locked > b, @S .sbq-m.sbq-locked .sbq-mi{ opacity:.45; }
  @S .sbq-m.sbq-locked .sbq-lk{ opacity:1; }
  @S .sbq-m.sbq-bump .sbq-dc{ color:var(--x-warn); }
  @S .sbq-m.sbq-gone{ max-height:0; padding-top:0; padding-bottom:0; margin-bottom:-12px; opacity:0; border-width:0; transition:all .45s ease; }
  @S .sbq-ws{ grid-area:ws; display:flex; flex-direction:column; gap:16px; }
  @S .sbq-w{ flex:1; padding:18px; display:flex; flex-direction:column; gap:12px; border-radius:22px; border:1.5px solid var(--x-line); background:linear-gradient(180deg, var(--x-panel), var(--x-panel-2)); transition:all .3s; }
  @S .sbq-wh{ display:flex; align-items:center; gap:12px; }
  @S .sbq-wi{ width:50px; height:50px; } @S .sbq-wi svg{ width:28px; height:28px; }
  @S .sbq-wh b{ color:#fff; font-size:24px; }
  @S .sbq-st{ margin-left:auto; color:var(--x-dim); font-size:17px; }
  @S .sbq-hold{ display:flex; flex-direction:column; gap:8px; padding:12px 14px; border-radius:14px; border:1.5px dashed var(--x-line); opacity:0; transition:opacity .3s; }
  @S .sbq-hn{ color:#fff; font-size:21px; }
  @S .sbq-lt{ display:flex; align-items:center; gap:6px; color:var(--x-warn); font-size:18px; }
  @S .sbq-lt svg{ width:22px; height:22px; } @S .sbq-lt em{ font-style:normal; font-weight:700; }
  @S .sbq-res{ font-size:19px; font-weight:700; }
  @S .sbq-res:empty{ display:none; }
  @S .sbq-w.sbq-busy{ border-color:var(--x-warn); }
  @S .sbq-w.sbq-busy .sbq-hold{ opacity:1; }
  @S .sbq-w.sbq-busy .sbq-st{ color:var(--x-warn); }
  @S .sbq-w.sbq-done{ border-color:var(--x-ok); } @S .sbq-w.sbq-done .sbq-res{ color:var(--x-ok); }
  @S .sbq-w.sbq-back .sbq-res{ color:var(--x-a1); }
  @S .sbq-w.sbq-crash{ border-color:var(--x-bad); opacity:.6; filter:saturate(.5); }
  @S .sbq-w.sbq-crash .sbq-res{ color:var(--x-bad); }
  @S .sbq-dlq{ grid-area:dlq; padding:16px 20px; display:flex; flex-direction:column; gap:10px; border-color:rgb(244 74 106 / .45); }
  @S .sbq-dh{ display:flex; align-items:center; gap:10px; color:var(--x-bad); }
  @S .sbq-dh svg{ width:26px; height:26px; } @S .sbq-dh b{ color:var(--x-text); font-size:20px; }
  @S .sbq-dm{ display:flex; flex-wrap:wrap; gap:6px 16px; align-items:baseline; padding:10px 14px; border-radius:12px; background:rgb(244 74 106 / .1); border:1.5px solid rgb(244 74 106 / .5); }
  @S .sbq-dm b{ color:#fff; font-size:21px; } @S .sbq-dm span{ color:var(--x-bad); font-size:17px; }
  @S .sbq-sum{ position:absolute; left:0; right:0; bottom:0; z-index:7; display:flex; gap:10px; justify-content:center; flex-wrap:wrap; padding:16px; border-radius:20px; background:rgb(14 20 32 / .96); border:1.5px solid rgb(58 160 255 / .5); opacity:0; transition:opacity .3s ease; pointer-events:none; }
  @S .sbq-sum.sbq-sumon{ opacity:1; }
  @S .sbq-flow{ position:absolute; inset:0; pointer-events:none; z-index:8; }
  @P .sbq{ grid-template-columns:1fr; grid-template-rows:auto auto auto auto; grid-template-areas:"api" "q" "ws" "dlq"; gap:16px; align-content:start; }
  @P .sbq-api{ flex-direction:row; flex-wrap:wrap; align-items:center; justify-content:flex-start; padding:16px 20px; }
  @P .sbq-ah{ flex-direction:row; align-items:center; }
  @P .sbq-api small{ width:100%; }
  @P .sbq-202{ align-self:center; margin-left:auto; }
  @P .sbq-ws{ flex-direction:row; }
  @P .sbq-w{ padding:16px; min-height:230px; }
  `,
  stages: [
    {
      title: 'Reply now, work later',
      key: 'Reply now',
      desc: 'For each upload, the API sends a message to the queue and returns 202 Accepted straight away.',
      status: 'send · summarise-jobs · 202 Accepted',
      say: "Three PDFs get uploaded. Instead of summarising while the user waits, the API sends one message per file to a Service Bus queue and replies 202 Accepted.",
      run: (m) => {
        m.show('.sbq-202', 0, true);
        m.after(200, () => m.particles('.sbq-flow', { from: '.sbq-ai', to: '.sbq-lane', count: 6, duration: 800 }));
        m.after(500, () => m.show('.sbq-m', 380));
      },
    },
    {
      title: 'Peek-lock: take it, keep it locked',
      key: 'Peek-lock',
      desc: "Worker A receives invoice-42. It stays in the queue, locked, so no other worker can see it.",
      status: 'receive · peek-lock · lock 60 s (default)',
      say: "Worker A receives invoice-42 in peek-lock mode. It isn't deleted. It stays in the queue, locked to Worker A for a minute by default and hidden from other workers.",
      run: (m) => {
        m.particles('.sbq-flow', { from: '.m1', to: '.wa .sbq-wi', count: 4, duration: 700 });
        m.after(600, () => {
          m.cls('.m1', 'sbq-locked');
          m.text('.m1 .sbq-by', 'Worker A');
          m.text('.m1 .sbq-dc', 'delivery count 1');
          m.cls('.wa', 'sbq-busy');
          m.text('.wa .sbq-st', 'working');
          m.text('.wa .sbq-hn', 'invoice-42');
          m.sfx.lock();
        });
        let s = 60;
        m.after(900, () => m.every(1000, () => { if (s > 50) { s--; m.text('.wa .sbq-lt em', String(s)); } }));
      },
    },
    {
      title: 'Complete: gone for good',
      key: 'Complete',
      desc: 'The summary is saved, so the worker calls complete_message and only then is the message removed.',
      status: 'complete_message · invoice-42 removed',
      say: "Worker A saves the summary, then calls complete. Only now is the message removed. If the worker had died halfway, the job would still be there.",
      run: (m) => {
        m.text('.wa .sbq-res', 'complete_message ✓');
        m.cls('.wa', 'sbq-done');
        m.sfx.chime();
        m.after(800, () => m.cls('.m1', 'sbq-gone'));
        m.after(1600, () => {
          m.cls('.wa', 'sbq-busy', false);
          m.cls('.wa', 'sbq-done', false);
          m.text('.wa .sbq-res', '');
          m.text('.wa .sbq-st', 'idle');
        });
      },
    },
    {
      title: 'Abandon: back in the queue',
      key: 'Abandon',
      desc: "Worker B hits a temporary error on contract-88 and abandons it. It's available again, and its delivery count goes up by one.",
      status: 'abandon_message · contract-88 · delivery count 2',
      say: "Worker B takes contract-88, hits a temporary error and abandons it. The lock's released, the message is back for anyone, and its delivery count goes up by one.",
      run: (m) => {
        m.particles('.sbq-flow', { from: '.m2', to: '.wb .sbq-wi', count: 4, duration: 700 });
        m.after(600, () => {
          m.cls('.m2', 'sbq-locked');
          m.text('.m2 .sbq-by', 'Worker B');
          m.text('.m2 .sbq-dc', 'delivery count 1');
          m.cls('.wb', 'sbq-busy');
          m.text('.wb .sbq-st', 'working');
          m.text('.wb .sbq-hn', 'contract-88');
          m.sfx.lock();
        });
        m.after(1700, () => { m.cls('.wb', 'sbq-back'); m.text('.wb .sbq-res', 'abandon_message ↩'); m.sfx.swipe(); });
        m.after(2400, () => {
          m.cls('.m2', 'sbq-locked', false);
          m.cls('.m2', 'sbq-bump');
          m.text('.m2 .sbq-dc', 'delivery count 2');
          m.punch('.m2', 2);
          m.cls('.wb', 'sbq-busy', false);
          m.cls('.wb', 'sbq-back', false);
          m.text('.wb .sbq-res', '');
          m.text('.wb .sbq-st', 'idle');
        });
      },
    },
    {
      title: 'A crash? The lock runs out',
      key: 'lock runs out',
      desc: "Worker A takes contract-88 and crashes. Nobody settles it, so when the lock expires it's visible again.",
      status: 'lock expired · contract-88 visible again',
      say: "Now Worker A takes it and crashes before settling. Nobody has to tell Service Bus. When the lock runs out, the message reappears and the count goes up again.",
      run: (m) => {
        m.particles('.sbq-flow', { from: '.m2', to: '.wa .sbq-wi', count: 4, duration: 700 });
        m.after(600, () => {
          m.cls('.m2', 'sbq-locked');
          m.text('.m2 .sbq-by', 'Worker A');
          m.cls('.wa', 'sbq-busy');
          m.text('.wa .sbq-hn', 'contract-88');
          m.text('.wa .sbq-lt em', '60');
          m.text('.wa .sbq-st', 'working');
        });
        m.after(1200, () => { m.cls('.wa', 'sbq-crash'); m.text('.wa .sbq-st', 'crashed'); m.text('.wa .sbq-res', 'no settle'); m.shake('.wa'); });
        let s = 60;
        m.after(1400, () => m.every(40, () => { if (s > 1) { s -= 2; m.text('.wa .sbq-lt em', String(Math.max(s, 0))); } }));
        m.after(3100, () => {
          m.text('.wa .sbq-lt em', '0');
          m.cls('.m2', 'sbq-locked', false);
          m.text('.m2 .sbq-dc', 'delivery count 3');
          m.punch('.m2', 3);
        });
      },
    },
    {
      title: 'Ten tries, then the dead-letter queue',
      key: 'dead-letter queue',
      desc: 'After the max delivery count (10 by default), Service Bus moves the message to the dead-letter queue.',
      status: 'MaxDeliveryCountExceeded → $deadletterqueue',
      say: "contract-88 keeps failing. After ten deliveries, the default max, Service Bus moves it to the dead-letter queue so it can't cycle forever. You inspect it there and fix the cause.",
      run: (m) => {
        m.cls('.wa', 'sbq-crash', false);
        m.cls('.wa', 'sbq-busy', false);
        m.text('.wa .sbq-res', '');
        m.text('.wa .sbq-st', 'restarted');
        let n = 3;
        m.every(180, () => { if (n < 10) { n++; m.text('.m2 .sbq-dc', `delivery count ${n}`); m.sfx.tick(); } });
        m.after(1400, () => { m.text('.m2 .sbq-dc', 'delivery count 10'); m.shake('.m2'); });
        m.after(2000, () => m.particles('.sbq-flow', { from: '.m2', to: '.sbq-dlq', count: 5, duration: 700, color: '#f44a6a' }));
        m.after(2500, () => { m.cls('.m2', 'sbq-gone'); m.show('.sbq-dm', 0); m.sfx.thud(); });
      },
    },
    {
      title: 'Built for at-least-once',
      key: 'at-least-once',
      desc: 'Peek-lock never loses a job, but a job can run twice. Make the handler idempotent.',
      status: 'complete · abandon · dead-letter',
      say: "Peek-lock never loses a job, but a job can arrive twice, say if a worker crashes right after finishing. So make running it twice harmless, like an upsert keyed on the document id.",
      run: (m) => {
        m.cls('.sbq-sum', 'sbq-sumon');
        m.show('.sbq-sum > *', 220);
        m.after(1000, () => m.sfx.resolve());
      },
    },
  ],
  end: {
    title: 'Lock it, finish it, then complete it',
    sub: 'Abandon or a lost lock brings it back. Ten failed deliveries send it to the dead-letter queue.',
  },
};

export default spec;
