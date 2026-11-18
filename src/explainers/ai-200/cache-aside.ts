import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const node = (k: string, icon: string, name: string, sub: string) =>
  `<div class="ca-n ${k}"><span class="ca-ic">${icon}</span><b>${name}</b><small>${sub}</small></div>`;

const ln = (k: string, cmd: string, res: string, tone: string) =>
  `<div class="ca-ln ${k}"><code>${cmd}</code><span class="ca-r ${tone}">${res}</span></div>`;

const spec: ExplainerSpec = {
  id: 'cache-aside',
  lesson: 'redis-caching',
  title: {
    main: 'Check Redis first, <em>the database only on a miss</em>',
    sub: 'Cache-aside with Azure Managed Redis: miss, SET with a TTL, hit in about a millisecond, expiry, and DEL when the price changes.',
  },
  summary:
    'An animation of the cache-aside pattern. A product API checks Azure Managed Redis for product:42, misses, reads PostgreSQL and stores the row with SET EX 300. The next request hits Redis in about a millisecond. The TTL counts down and the key expires, then a price update writes the database and deletes the key so the next read loads the new price. Timings are examples.',
  html: `
  <div class="ca">
    <div class="ca-nodes">
      ${node('ca-app', I.app, 'Product API', 'your code')}
      ${node('ca-redis', I.bolt, 'Azure Managed Redis', 'in memory · port 10000')}
      ${node('ca-db', I.db, 'PostgreSQL', 'source of truth')}
    </div>
    <div class="ca-mid">
      <div class="ca-key msd-card">
        <div class="msd-label">Redis key</div>
        <p class="ca-empty">No key yet</p>
        <div class="ca-kv">
          <code class="ca-kn">product:42</code>
          <code class="ca-val">{"id":42,"name":"Trail bike",…}</code>
          <div class="ca-ttlrow"><span>TTL</span><b class="ca-ttl msd-num">300</b><span>s</span><em class="ca-fast">clock sped up</em></div>
          <span class="ca-badge"></span>
        </div>
      </div>
      <div class="ca-time msd-card">
        <div class="msd-label">Read time · example timings</div>
        <div class="ca-bar ca-bdb msd-reveal"><span>Database read</span><i><u></u></i><b class="msd-mono">~40 ms</b></div>
        <div class="ca-bar ca-bhit msd-reveal"><span>Redis hit</span><i><u></u></i><b class="msd-mono">~1 ms</b></div>
      </div>
    </div>
    <div class="ca-log msd-editor">
      <div class="ed-bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span class="ca-file msd-mono">request log</span></div>
      <div class="ca-lines">
        ${ln('l1', 'GET product:42', '(nil) · miss', 'ca-bad')}
        ${ln('l2', 'SELECT … FROM products WHERE id = 42', '~40 ms (example)', 'ca-warn')}
        ${ln('l3', 'SET product:42 {…} EX 300', 'OK', 'ca-ok')}
        ${ln('l4', 'GET product:42', 'hit · ~1 ms (example)', 'ca-ok')}
        ${ln('l5', 'TTL product:42', '-2 · expired, next GET reloads', 'ca-bad')}
        ${ln('l6', 'UPDATE products SET price = … ; DEL product:42', 'invalidated', 'ca-warn')}
        ${ln('l7', 'GET product:42 → miss → SET … EX 300', 'new price cached', 'ca-ok')}
      </div>
    </div>
    <div class="ca-sum msd-stagger">
      <span class="msd-pill ok">Hit: answer from memory</span><span class="msd-pill accent">Miss: database, then SET … EX</span><span class="msd-pill bad">Write: database, then DEL</span>
    </div>
    <div class="ca-flow"></div>
  </div>`,
  css: `
  @S code{ background:none; padding:0; border-radius:0; } /* the lesson's light inline-code chip doesn't belong on the dark stage */
  @S .ca{ position:relative; height:100%; display:flex; flex-direction:column; gap:18px; }
  @S .ca-nodes{ display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
  @S .ca-n{ display:flex; flex-direction:column; align-items:center; text-align:center; gap:8px; padding:18px 12px; border-radius:22px; border:1.5px solid var(--x-line); background:linear-gradient(180deg, var(--x-panel), var(--x-panel-2)); transition:border-color .3s, box-shadow .3s; }
  @S .ca-ic{ width:62px; height:62px; border-radius:16px; display:grid; place-items:center; background:rgb(58 160 255 / .12); color:var(--x-a1); }
  @S .ca-ic svg{ width:34px; height:34px; }
  @S .ca-redis .ca-ic{ background:rgb(244 74 106 / .14); color:#ff6b6b; }
  @S .ca-n b{ color:#fff; font-size:25px; } @S .ca-n small{ color:var(--x-dim); font-size:18px; font-family:var(--x-mono); }
  @S .ca-n.ca-on{ border-color:var(--x-a1); box-shadow:0 0 0 1px var(--x-a1), 0 0 34px rgb(58 160 255 / .25); }
  @S .ca-n.ca-miss{ border-color:var(--x-bad); box-shadow:0 0 0 1px var(--x-bad), 0 0 34px rgb(244 74 106 / .2); }
  @S .ca-n.ca-hit{ border-color:var(--x-ok); box-shadow:0 0 0 1px var(--x-ok), 0 0 34px rgb(63 185 80 / .25); }
  @S .ca-mid{ display:grid; grid-template-columns:1fr 1fr; gap:18px; }
  @S .ca-key, @S .ca-time{ padding:18px 20px; display:flex; flex-direction:column; gap:10px; min-height:230px; }
  @S .ca-empty{ margin:auto 0; color:var(--x-dim); font-size:24px; font-style:italic; text-align:center; }
  @S .ca-kv{ display:none; flex-direction:column; gap:8px; transition:opacity .3s; }
  @S .ca-key.ca-has .ca-empty{ display:none; } @S .ca-key.ca-has .ca-kv{ display:flex; }
  @S .ca-kn{ color:var(--x-cyan); font-family:var(--x-mono); font-size:28px; font-weight:700; }
  @S .ca-val{ color:var(--x-text); font-family:var(--x-mono); font-size:19px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  @S .ca-ttlrow{ display:flex; align-items:baseline; gap:10px; color:var(--x-dim); font-size:22px; font-weight:700; }
  @S .ca-ttl{ font-size:46px; min-width:90px; text-align:right; }
  @S .ca-fast{ margin-left:auto; font-style:normal; font-size:16px; padding:4px 10px; border-radius:8px; color:var(--x-warn); border:1px solid rgb(240 166 74 / .5); opacity:0; transition:opacity .3s; }
  @S .ca-key.ca-tick .ca-fast{ opacity:1; }
  @S .ca-badge{ align-self:flex-start; font-family:var(--x-mono); font-size:18px; font-weight:700; padding:5px 12px; border-radius:9px; color:var(--x-ok); background:rgb(63 185 80 / .14); }
  @S .ca-badge:empty{ display:none; }
  @S .ca-key.ca-exp{ border-color:var(--x-bad); }
  @S .ca-key.ca-exp .ca-kv{ opacity:.4; } @S .ca-key.ca-exp .ca-badge{ color:var(--x-bad); background:rgb(244 74 106 / .14); opacity:1; }
  @S .ca-key.ca-exp .ca-ttl{ color:var(--x-bad); }
  @S .ca-bar{ display:grid; grid-template-columns:1fr auto; gap:8px 12px; align-items:center; }
  @S .ca-bar span{ color:#fff; font-size:22px; font-weight:700; } @S .ca-bar b{ font-size:22px; }
  @S .ca-bar i{ grid-column:1 / -1; grid-row:2; height:20px; border-radius:10px; background:var(--x-line); overflow:hidden; }
  @S .ca-bar u{ display:block; height:100%; width:0; border-radius:10px; transition:width 1s cubic-bezier(.4,0,.2,1); }
  @S .ca-bdb u{ background:var(--x-warn); } @S .ca-bdb b{ color:var(--x-warn); }
  @S .ca-bhit u{ background:var(--x-ok); } @S .ca-bhit b{ color:var(--x-ok); }
  @S .ca-bdb.show u{ width:100%; } @S .ca-bhit.show u{ width:3%; }
  @S .ca-log{ flex:1; min-height:0; display:flex; flex-direction:column; }
  @S .ca-file{ margin-left:12px; color:#9aa4b4; font-size:18px; }
  @S .ca-lines{ flex:1; min-height:0; overflow:hidden; display:flex; flex-direction:column; justify-content:flex-end; gap:4px; padding:12px 20px; }
  @S .ca-ln{ display:flex; gap:14px; align-items:baseline; max-height:0; opacity:0; overflow:hidden; transition:max-height .35s ease, opacity .35s ease; font-family:var(--x-mono); font-size:20px; flex-shrink:0; }
  @S .ca-ln.show{ max-height:40px; opacity:1; }
  @S .ca-ln code{ color:#d4d4d4; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; }
  @S .ca-r{ margin-left:auto; white-space:nowrap; font-weight:700; }
  @S .ca-ok{ color:var(--x-ok); } @S .ca-bad{ color:var(--x-bad); } @S .ca-warn{ color:var(--x-warn); }
  @S .ca-sum{ position:absolute; left:0; right:0; bottom:0; z-index:7; display:flex; gap:10px; justify-content:center; flex-wrap:wrap; padding:16px; border-radius:20px; background:rgb(14 20 32 / .96); border:1.5px solid rgb(58 160 255 / .5); pointer-events:none; opacity:0; transition:opacity .3s ease; }
  @S .ca-sum.ca-sumon{ opacity:1; }
  @S .ca-flow{ position:absolute; inset:0; pointer-events:none; z-index:8; }
  @L .ca-n b{ font-size:24px; }
  @P .ca{ gap:16px; }
  @P .ca-nodes{ gap:12px; }
  @P .ca-n{ padding:16px 8px; } @P .ca-n b{ font-size:23px; } @P .ca-n small{ font-size:16px; }
  @P .ca-mid{ gap:14px; }
  @P .ca-key, @P .ca-time{ padding:16px; }
  @P .ca-bar span{ font-size:20px; }
  @P .ca-ln{ flex-direction:column; gap:2px; font-size:20px; }
  @P .ca-ln.show{ max-height:64px; }
  @P .ca-r{ margin-left:0; font-size:18px; }
  `,
  stages: [
    {
      title: 'Check the cache first',
      key: 'cache first',
      desc: "GET product:42 comes back empty. That's a cache miss.",
      status: 'GET product:42 → (nil) · miss',
      say: "A request for product 42 comes in. Before touching the database, the app asks Redis. Nothing's there. That's a miss.",
      run: (m) => {
        m.cls('.ca-app', 'ca-on');
        m.after(200, () => m.particles('.ca-flow', { from: '.ca-app .ca-ic', to: '.ca-redis .ca-ic', count: 4, duration: 600 }));
        m.after(900, () => { m.cls('.ca-redis', 'ca-miss'); m.shake('.ca-redis'); m.show('.l1', 0, true); });
      },
    },
    {
      title: 'Miss, so read the database',
      key: 'read the database',
      desc: "The app loads the row from PostgreSQL. It works, but it's the slow path.",
      status: 'SELECT … WHERE id = 42 · ~40 ms (example)',
      say: "On a miss, the app reads the database. That works, but it's the slow path. Call it forty milliseconds here, just as an example.",
      run: (m) => {
        m.cls('.ca-redis', 'ca-miss', false);
        m.particles('.ca-flow', { from: '.ca-app .ca-ic', to: '.ca-db .ca-ic', count: 5, duration: 900 });
        m.after(800, () => { m.cls('.ca-db', 'ca-on'); m.show('.l2', 0, true); m.show('.ca-bdb', 0); });
      },
    },
    {
      title: 'Save it with a TTL',
      key: 'TTL',
      desc: 'SET product:42 … EX 300 keeps the row in memory for 300 seconds.',
      status: 'SET product:42 EX 300 · OK',
      say: "Then it saves the result in Redis with a time to live. SET, the key, the value, then EX 300. That copy lives for five minutes.",
      run: (m) => {
        m.cls('.ca-db', 'ca-on', false);
        m.particles('.ca-flow', { from: '.ca-db .ca-ic', to: '.ca-redis .ca-ic', count: 5, duration: 800 });
        m.after(700, () => {
          m.cls('.ca-key', 'ca-has');
          m.text('.ca-ttl', '300');
          m.text('.ca-badge', 'cached');
          m.punch('.ca-key', 2);
          m.show('.l3', 0, true);
        });
      },
    },
    {
      title: 'The next request hits',
      key: 'hits',
      desc: "Same product, same key. Redis answers from memory in about a millisecond.",
      status: 'GET product:42 → hit · ~1 ms (example)',
      say: "The next person asks for the same product. This time Redis has it, so the answer comes straight from memory in about a millisecond. The database isn't touched at all.",
      run: (m) => {
        m.particles('.ca-flow', { from: '.ca-app .ca-ic', to: '.ca-redis .ca-ic', count: 3, duration: 350 });
        m.after(400, () => { m.cls('.ca-redis', 'ca-hit'); m.sfx.ding(); m.show('.l4', 0, true); m.show('.ca-bhit', 0, true); });
        m.after(500, () => m.particles('.ca-flow', { from: '.ca-redis .ca-ic', to: '.ca-app .ca-ic', count: 3, duration: 350, color: '#3fb950' }));
      },
    },
    {
      title: 'The TTL runs out',
      key: 'runs out',
      desc: 'At zero, Redis removes the key. The next read is a miss and loads a fresh copy.',
      status: 'TTL product:42 → -2 · expired',
      say: "Meanwhile the TTL counts down. At zero Redis drops the key, and the next read misses and reloads it. A little random jitter stops thousands of keys expiring together.",
      run: (m) => {
        m.cls('.ca-redis', 'ca-hit', false);
        m.cls('.ca-key', 'ca-tick');
        let t = 300;
        m.every(60, () => { if (t > 10) { t -= 10; m.text('.ca-ttl', String(t)); if (t % 50 === 0) m.sfx.tick(); } });
        m.after(2000, () => {
          m.cls('.ca-key', 'ca-tick', false);
          m.text('.ca-ttl', '0');
          m.cls('.ca-key', 'ca-exp');
          m.text('.ca-badge', 'expired');
          m.sfx.error();
          m.show('.l5', 0, true);
        });
        m.after(4200, () => {
          m.cls('.ca-key', 'ca-exp', false);
          m.text('.ca-ttl', '300');
          m.text('.ca-badge', 'cached');
          m.punch('.ca-key', 1);
        });
      },
    },
    {
      title: 'Price changes? Delete the key',
      key: 'Delete the key',
      desc: 'Write the database first, then DEL product:42, so nobody keeps seeing the old price.',
      status: 'UPDATE products … · DEL product:42',
      say: "Now the price changes. The app writes the database first, then deletes the key. Skip that and people see the old price until the TTL runs out. Delete after the commit, not before.",
      run: (m) => {
        m.particles('.ca-flow', { from: '.ca-app .ca-ic', to: '.ca-db .ca-ic', count: 4, duration: 700 });
        m.after(700, () => { m.cls('.ca-db', 'ca-on'); m.flash('.ca-db'); });
        m.after(1300, () => m.particles('.ca-flow', { from: '.ca-app .ca-ic', to: '.ca-redis .ca-ic', count: 4, duration: 600, color: '#f44a6a' }));
        m.after(1900, () => {
          m.cls('.ca-db', 'ca-on', false);
          m.cls('.ca-key', 'ca-has', false);
          m.text('.ca-empty', 'product:42 deleted');
          m.sfx.swipe();
          m.show('.l6', 0, true);
        });
      },
    },
    {
      title: 'Fresh on the next read',
      key: 'Fresh',
      desc: 'The next GET misses, loads the new price and caches it again. Hit, miss, invalidate.',
      status: 'GET → miss → SET … EX 300 · new price',
      say: "The next request misses, loads the new price and caches it again. That's cache-aside: check Redis, fall back to the database, set a TTL, and delete the key on every write.",
      run: (m) => {
        m.particles('.ca-flow', { from: '.ca-db .ca-ic', to: '.ca-redis .ca-ic', count: 4, duration: 700 });
        m.after(700, () => {
          m.cls('.ca-key', 'ca-has');
          m.text('.ca-ttl', '300');
          m.text('.ca-badge', 'new price');
          m.show('.l7', 0, true);
        });
        m.after(1300, () => { m.cls('.ca-sum', 'ca-sumon'); m.show('.ca-sum > *', 220); });
        m.after(2100, () => m.sfx.chime());
      },
    },
  ],
  end: {
    title: 'Read through Redis, write through the database',
    sub: 'Miss: load and SET with a TTL. Hit: answer from memory. Write: update the database, then DEL the key.',
  },
};

export default spec;
