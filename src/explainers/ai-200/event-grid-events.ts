import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const file = (k: string, name: string) => `<div class="egv-f ${k} msd-pop">${I.file}<b class="msd-mono">${name}</b></div>`;
/** Event Grid's documented retry schedule starts roughly like this (best effort). */
const gaps = ['10s', '30s', '1m', '5m', '10m', '30m', '1h', '3h', '6h'];

const spec: ExplainerSpec = {
  id: 'event-grid-events',
  lesson: 'event-grid',
  title: {
    main: 'Something happened. <em>Event Grid rings the bell.</em>',
    sub: 'A blob is created, a small event goes to a topic, subscriptions filter it, push it to a handler, retry with backoff and dead-letter.',
  },
  summary:
    'An animation of Azure Event Grid. contract-88.pdf is created in Blob Storage, which publishes a small BlobCreated event to a system topic. An event subscription filtered to subjects ending in .pdf pushes it to an Azure Function, while a draft.tmp event is dropped by the filter. When the function returns 503, Event Grid retries with growing gaps, up to 30 attempts or 24 hours by default, then writes the event to a dead-letter blob container. It ends by contrasting an event with a Service Bus message.',
  html: `
  <div class="egv">
    <div class="egv-src msd-card">
      <div class="egv-hd">${I.disk}<b>Blob Storage</b><span class="msd-chip egv-ct">contracts</span></div>
      <div class="egv-files">${file('f88', 'contract-88.pdf')}${file('ftmp', 'draft.tmp')}${file('f91', 'contract-91.pdf')}</div>
    </div>
    <div class="egv-topic msd-node"><span class="ic">${I.net}</span><span>System topic<small>storage account events</small></span></div>
    <div class="egv-evt msd-card msd-reveal">
      <div class="msd-label">The event · a small fact</div>
      <div class="egv-kv msd-mono">
        <span>type</span><b>Microsoft.Storage.BlobCreated</b>
        <span>subject</span><b class="egv-sj">…/contracts/blobs/contract-88.pdf</b>
        <span>data.url</span><b class="egv-url">https://…/contract-88.pdf</b>
      </div>
      <small class="egv-note">The PDF stays in storage. The event only points to it.</small>
    </div>
    <div class="egv-sub msd-card msd-reveal">
      <div class="egv-hd">${I.tag}<b>Event subscription</b></div>
      <div class="egv-filt"><span class="msd-chip">type = BlobCreated</span><span class="msd-chip">subject ends with .pdf</span></div>
      <span class="egv-res msd-mono"></span>
    </div>
    <div class="egv-fn">
      <div class="egv-fh"><span class="egv-fi">${I.bolt}</span><span><b>Azure Function</b><small>or any HTTPS webhook</small></span></div>
      <span class="egv-code msd-mono">waiting</span>
    </div>
    <div class="egv-rty msd-card msd-reveal">
      <div class="egv-rh"><b>Retry with backoff</b><span class="egv-att msd-mono">attempt 1</span></div>
      <div class="egv-dots">${gaps.map((g, i) => `<span class="egv-dot d${i}"><i></i><small class="msd-mono">${g}</small></span>`).join('')}</div>
      <small class="egv-rough">gaps between tries, roughly · best effort</small>
      <div class="egv-lim msd-stagger"><span class="msd-pill">max 30 attempts</span><span class="msd-pill">TTL 1,440 min (24 h)</span><span class="msd-pill accent">first limit wins</span></div>
    </div>
    <div class="egv-dl msd-card">
      <div class="egv-hd">${I.warn}<b class="msd-mono">eg-deadletter</b></div>
      <small class="egv-dls">blob container · without one, the event is dropped</small>
      <div class="egv-dli msd-pop">${I.file}<span class="msd-mono">contract-91 event + reason</span></div>
    </div>
    <div class="egv-vs msd-reveal">
      <div class="egv-col egv-ce"><div class="egv-ch">${I.bolt}<b>Event</b></div><p>A fact: "contract-88.pdf was created"</p><p>Small. Points to the data.</p><p>Pushed. The publisher doesn't care who listens.</p><span class="msd-pill accent">Event Grid</span></div>
      <div class="egv-col egv-cm"><div class="egv-ch">${I.chat}<b>Message</b></div><p>Work: "summarise contract-88"</p><p>Carries the job itself.</p><p>Pulled. The receiver locks and settles it.</p><span class="msd-pill ok">Service Bus</span></div>
    </div>
    <div class="egv-flow"></div>
  </div>`,
  css: `
  @S .egv{ position:relative; height:100%; display:grid; grid-template-columns:280px 1fr 330px; grid-template-rows:auto auto 1fr; grid-template-areas:"src topic sub" "src evt fn" "rty rty dl"; gap:18px; }
  @S .egv-src{ grid-area:src; padding:18px; display:flex; flex-direction:column; gap:12px; }
  @S .egv-hd{ display:flex; align-items:center; gap:10px; color:var(--x-a1); }
  @S .egv-hd svg{ width:28px; height:28px; flex-shrink:0; } @S .egv-hd b{ color:#fff; font-size:23px; }
  @S .egv-src .egv-hd{ flex-wrap:wrap; }
  @S .egv-files{ display:flex; flex-direction:column; gap:10px; }
  @S .egv-f{ display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:12px; border:1.5px solid var(--x-line); background:rgb(14 20 32 / .85); color:var(--x-a1); }
  @S .egv-f svg{ width:24px; height:24px; flex-shrink:0; } @S .egv-f b{ color:#fff; font-size:19px; }
  @S .ftmp{ color:var(--x-dim); }
  @S .egv-topic{ grid-area:topic; align-self:start; transition:all .3s; }
  @S .egv-topic small{ display:block; color:var(--x-dim); font-size:18px; font-weight:600; margin-top:4px; }
  @S .egv-evt{ grid-area:evt; padding:16px 18px; display:flex; flex-direction:column; gap:10px; }
  @S .egv-kv{ display:grid; grid-template-columns:96px 1fr; gap:6px 12px; font-size:17px; }
  @S .egv-kv span{ color:var(--x-dim); } @S .egv-kv b{ color:var(--x-cyan); font-weight:600; word-break:break-all; }
  @S .egv-note{ color:var(--x-dim); font-size:17px; font-style:italic; }
  @S .egv-sub{ grid-area:sub; padding:16px 18px; display:flex; flex-direction:column; gap:10px; transition:border-color .3s; }
  @S .egv-filt{ display:flex; flex-direction:column; gap:8px; align-items:flex-start; }
  @S .egv-filt .msd-chip{ font-size:18px; }
  @S .egv-res{ align-self:flex-start; font-size:19px; font-weight:700; padding:6px 12px; border-radius:9px; }
  @S .egv-res:empty{ display:none; }
  @S .egv-sub.egv-pass{ border-color:var(--x-ok); } @S .egv-sub.egv-pass .egv-res{ color:var(--x-ok); background:rgb(63 185 80 / .14); }
  @S .egv-sub.egv-drop{ border-color:var(--x-bad); } @S .egv-sub.egv-drop .egv-res{ color:var(--x-bad); background:rgb(244 74 106 / .14); }
  @S .egv-fn{ grid-area:fn; padding:16px 18px; display:flex; flex-direction:column; gap:12px; border-radius:22px; border:1.5px solid var(--x-line); background:linear-gradient(180deg, var(--x-panel), var(--x-panel-2)); transition:all .3s; }
  @S .egv-fh{ display:flex; align-items:center; gap:14px; }
  @S .egv-fi{ width:54px; height:54px; border-radius:15px; flex-shrink:0; display:grid; place-items:center; background:rgb(240 166 74 / .14); color:var(--x-warn); }
  @S .egv-fi svg{ width:30px; height:30px; }
  @S .egv-fh b{ display:block; color:#fff; font-size:23px; } @S .egv-fh small{ color:var(--x-dim); font-size:17px; }
  @S .egv-code{ align-self:flex-start; font-size:20px; font-weight:700; color:var(--x-dim); padding:6px 12px; border-radius:9px; background:rgb(255 255 255 / .05); }
  @S .egv-fn.egv-ok{ border-color:var(--x-ok); } @S .egv-fn.egv-ok .egv-code{ color:var(--x-ok); background:rgb(63 185 80 / .14); }
  @S .egv-fn.egv-down{ border-color:var(--x-bad); } @S .egv-fn.egv-down .egv-code{ color:var(--x-bad); background:rgb(244 74 106 / .14); }
  @S .egv-rty{ grid-area:rty; padding:16px 20px; display:flex; flex-direction:column; gap:12px; }
  @S .egv-rh{ display:flex; align-items:baseline; gap:14px; } @S .egv-rh b{ color:#fff; font-size:24px; }
  @S .egv-att{ margin-left:auto; color:var(--x-warn); font-size:20px; font-weight:700; }
  @S .egv-dots{ display:flex; justify-content:space-between; gap:6px; }
  @S .egv-dot{ display:flex; flex-direction:column; align-items:center; gap:6px; }
  @S .egv-dot i{ width:22px; height:22px; border-radius:50%; border:2px solid var(--x-line); transition:all .25s; }
  @S .egv-dot small{ color:var(--x-dim); font-size:16px; }
  @S .egv-dot.egv-hit i{ background:var(--x-bad); border-color:var(--x-bad); box-shadow:0 0 14px rgb(244 74 106 / .5); }
  @S .egv-dot.egv-hit small{ color:var(--x-text); }
  @S .egv-rough{ color:var(--x-dim); font-size:16px; font-style:italic; }
  @S .egv-lim{ display:flex; gap:8px; flex-wrap:wrap; }
  @S .egv-lim .msd-pill{ font-size:18px; padding:7px 14px; }
  @S .egv-dl{ grid-area:dl; padding:16px 18px; display:flex; flex-direction:column; gap:10px; border-color:rgb(244 74 106 / .45); }
  @S .egv-dl .egv-hd{ color:var(--x-bad); }
  @S .egv-dls{ color:var(--x-dim); font-size:17px; line-height:1.35; }
  @S .egv-dli{ display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:12px; border:1.5px solid rgb(244 74 106 / .5); background:rgb(244 74 106 / .1); color:var(--x-bad); }
  @S .egv-dli svg{ width:24px; height:24px; flex-shrink:0; } @S .egv-dli span{ color:#fff; font-size:18px; }
  @S .egv-vs{ position:absolute; inset:40px 30px; z-index:7; display:grid; grid-template-columns:1fr 1fr; gap:20px; padding:24px; border-radius:26px; background:rgb(14 20 32 / .97); border:1.5px solid rgb(58 160 255 / .5); box-shadow:0 24px 70px rgb(0 0 0 / .5); }
  @S .egv-col{ display:flex; flex-direction:column; gap:14px; padding:22px; border-radius:20px; border:1.5px solid var(--x-line); }
  @S .egv-ce{ border-color:rgb(58 160 255 / .5); } @S .egv-cm{ border-color:rgb(63 185 80 / .5); }
  @S .egv-ch{ display:flex; align-items:center; gap:12px; color:var(--x-a1); } @S .egv-cm .egv-ch{ color:var(--x-ok); }
  @S .egv-ch svg{ width:38px; height:38px; } @S .egv-ch b{ color:#fff; font-size:34px; }
  @S .egv-col p{ margin:0; color:var(--x-text); font-size:23px; line-height:1.4; }
  @S .egv-col .msd-pill{ align-self:flex-start; margin-top:auto; }
  @S .egv-flow{ position:absolute; inset:0; pointer-events:none; z-index:8; }
  @P .egv{ grid-template-columns:1fr 1fr; grid-template-rows:auto auto auto auto; grid-template-areas:"src topic" "evt evt" "sub fn" "rty dl"; gap:14px; align-content:start; }
  @P .egv-topic{ align-self:center; }
  @P .egv-kv{ grid-template-columns:110px 1fr; font-size:19px; }
  @P .egv-rty{ padding:14px 16px; gap:10px; }
  @P .egv-rh b{ font-size:22px; }
  @P .egv-rh{ flex-wrap:wrap; } @P .egv-att{ margin-left:0; font-size:18px; }
  @P .egv-dots{ flex-wrap:wrap; justify-content:flex-start; gap:10px 12px; }
  @P .egv-dot small{ font-size:15px; }
  @P .egv-lim .msd-pill{ font-size:16px; padding:6px 10px; }
  @P .egv-vs{ inset:20px 0; grid-template-columns:1fr; padding:20px; gap:16px; }
  @P .egv-col{ padding:18px; gap:10px; }
  @P .egv-col p{ font-size:24px; }
  `,
  stages: [
    {
      title: 'Something happens',
      key: 'happens',
      desc: 'contract-88.pdf is uploaded to the contracts container. Nobody has to poll for it.',
      status: 'BlobCreated · contracts/contract-88.pdf',
      say: "A PDF called contract-88 lands in the contracts container. Nobody's polling the folder. Storage just knows something happened.",
      run: (m) => {
        m.show('.f88', 0);
        m.after(300, () => m.punch('.egv-src', 1));
      },
    },
    {
      title: 'An event is a small fact',
      key: 'small fact',
      desc: 'It says what happened and where. The file stays in storage and the event only points to it.',
      status: 'event · Microsoft.Storage.BlobCreated',
      say: "Storage publishes an event, a small fact: a blob was created, here's its subject and URL. The PDF doesn't travel. The event only points to it.",
      run: (m) => {
        m.particles('.egv-flow', { from: '.f88', to: '.egv-evt', count: 4, duration: 700 });
        m.after(500, () => m.show('.egv-evt', 0));
      },
    },
    {
      title: 'Into a topic',
      key: 'topic',
      desc: 'Azure services publish to a system topic. Your own apps publish to custom topics.',
      status: 'system topic · storage account',
      say: "The event goes to a topic. Azure services publish to system topics, and your own apps publish to custom topics.",
      run: (m) => {
        m.particles('.egv-flow', { from: '.egv-evt', to: '.egv-topic .ic', count: 5, duration: 700 });
        m.after(600, () => { m.cls('.egv-topic', 'hot'); m.sfx.lock(); });
      },
    },
    {
      title: 'Filters choose what gets through',
      key: 'Filters',
      desc: 'The subscription only wants BlobCreated with a subject ending in .pdf. This one matches, so it is pushed.',
      status: 'filter · ends with .pdf · match → push',
      say: "An event subscription links the topic to a handler and holds the filters. This one only wants subjects ending in .pdf. It matches, so Event Grid pushes it to the function.",
      run: (m) => {
        m.show('.egv-sub', 0, true);
        m.after(400, () => m.particles('.egv-flow', { from: '.egv-topic .ic', to: '.egv-sub', count: 4, duration: 600 }));
        m.after(1000, () => { m.cls('.egv-sub', 'egv-pass'); m.text('.egv-res', '✓ match'); m.sfx.ding(); });
        m.after(1500, () => m.particles('.egv-flow', { from: '.egv-sub', to: '.egv-fi', count: 4, duration: 600, color: '#3fb950' }));
        m.after(2100, () => { m.cls('.egv-fn', 'egv-ok'); m.text('.egv-code', '200 OK'); });
      },
    },
    {
      title: 'A .tmp file? Dropped',
      key: 'Dropped',
      desc: 'draft.tmp also raises BlobCreated, but the subject filter rejects it. The handler never hears about it.',
      status: 'draft.tmp · subject filter · no match',
      say: "Then someone saves draft.tmp. It's a blob created event too, but it doesn't end in .pdf, so the subscription drops it. Your function never wakes up.",
      run: (m) => {
        m.cls('.egv-fn', 'egv-ok', false);
        m.text('.egv-code', 'not called');
        m.cls('.egv-sub', 'egv-pass', false);
        m.text('.egv-res', '');
        m.show('.ftmp', 0);
        m.after(300, () => { m.text('.egv-sj', '…/contracts/blobs/draft.tmp'); m.text('.egv-url', 'https://…/draft.tmp'); m.flash('.egv-evt'); });
        m.after(700, () => m.particles('.egv-flow', { from: '.egv-topic .ic', to: '.egv-sub', count: 4, duration: 600 }));
        m.after(1300, () => { m.cls('.egv-sub', 'egv-drop'); m.text('.egv-res', '✗ dropped'); m.shake('.egv-sub'); });
      },
    },
    {
      title: '503? Back off and retry',
      key: 'retry',
      desc: 'contract-91.pdf arrives while the function is down. Event Grid waits longer between each try.',
      status: '503 Service Unavailable · retrying',
      say: "The next PDF arrives while the function is returning 503. Event Grid waits and tries again, after ten seconds, thirty, a minute, five, with longer gaps each time.",
      run: (m) => {
        m.cls('.egv-sub', 'egv-drop', false);
        m.show('.f91', 0);
        m.text('.egv-sj', '…/contracts/blobs/contract-91.pdf');
        m.text('.egv-url', 'https://…/contract-91.pdf');
        m.after(500, () => { m.cls('.egv-sub', 'egv-pass'); m.text('.egv-res', '✓ match'); });
        m.after(900, () => m.particles('.egv-flow', { from: '.egv-sub', to: '.egv-fi', count: 4, duration: 600 }));
        m.after(1500, () => { m.cls('.egv-fn', 'egv-down'); m.text('.egv-code', '503'); m.shake('.egv-fn'); m.show('.egv-rty', 0, true); });
        [0, 1, 2, 3].forEach((i) => m.after(2100 + i * 650, () => {
          m.cls(`.d${i}`, 'egv-hit');
          m.text('.egv-att', `attempt ${i + 2}`);
          m.sfx.blip(i);
        }));
      },
    },
    {
      title: 'Limits, then dead-letter',
      key: 'dead-letter',
      desc: 'Defaults: 30 attempts or 1,440 minutes (24 hours), whichever comes first. Then the event goes to your dead-letter container.',
      status: 'retries over → eg-deadletter container',
      say: "By default it stops after thirty attempts or twenty-four hours, whichever comes first. With a dead-letter container set, the event lands there with the reason. Without one, it's dropped.",
      run: (m) => {
        [4, 5, 6, 7, 8].forEach((i, k) => m.after(k * 280, () => { m.cls(`.d${i}`, 'egv-hit'); m.text('.egv-att', `attempt ${i + 2} …`); m.sfx.tick(); }));
        m.after(1500, () => { m.show('.egv-lim > *', 200); m.text('.egv-att', 'limit reached'); });
        m.after(2400, () => m.particles('.egv-flow', { from: '.egv-fi', to: '.egv-dl', count: 5, duration: 700, color: '#f44a6a' }));
        m.after(3000, () => { m.show('.egv-dli', 0); m.sfx.thud(); });
      },
    },
    {
      title: 'An event, not a message',
      key: 'not a message',
      desc: 'An event announces a fact and points to data. A message carries work that a receiver must process and settle.',
      status: 'Event Grid = facts · Service Bus = work',
      say: "That's the difference. An event announces a fact and doesn't care who listens. A Service Bus message carries work that a receiver pulls, locks and settles.",
      run: (m) => {
        m.show('.egv-vs', 0);
        m.after(800, () => m.sfx.resolve());
      },
    },
  ],
  end: {
    title: 'Filter it, push it, retry it, keep it',
    sub: 'Subject filters pick the events, failed pushes back off and retry, and a dead-letter container keeps what never landed.',
  },
};

export default spec;
