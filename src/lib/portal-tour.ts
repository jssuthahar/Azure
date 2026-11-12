/**
 * Renders one step of a guided Azure portal walkthrough (<PortalTour id="..." />)
 * as HTML. The look follows the current Azure portal: dark top bar with global
 * search and Copilot, Fluent 2 surfaces, create wizards with tabs and a sticky
 * Review + create bar, resource blades with a searchable left menu.
 * Everything is a simulation for learning; nothing talks to Azure.
 */

export type Field = [label: string, value: string, kind?: 's' | 't' | 'r' | 'c' | 'i' | 'tg', note?: string];
export interface Group { h?: string; p?: string; f?: Field[] }
export type Body =
  | { b: 'table'; title?: string; cmds?: string[]; cols: string[]; rows: string[][] }
  | { b: 'form'; title?: string; groups: Group[]; save?: string }
  | { b: 'cards'; title?: string; items: { t: string; v: string; s?: string; c?: Tone }[] }
  | { b: 'chart'; title: string; data: number[]; unit?: string; line?: number; lineLabel?: string; color?: string }
  | { b: 'note'; tone?: Tone; text: string }
  | { b: 'tree'; nodes: { n: string; d: number; i: string; tag?: string }[] }
  | { b: 'code'; title?: string; text: string };
export type Tone = 'ok' | 'bad' | 'warn' | 'info';
export type Screen =
  | { s: 'home' }
  | { s: 'search'; q: string; results: { g: string; n: string; i: string }[] }
  | { s: 'list'; title: string; i: string; cmds?: string[]; cols: string[]; rows: string[][]; crumbs?: string[]; empty?: string }
  | { s: 'create'; title: string; crumbs?: string[]; tabs: string[]; tab: number; intro?: string; groups: Group[]; valid?: boolean }
  | { s: 'deploy'; name: string; done: boolean; rg?: string }
  | { s: 'res'; title: string; type: string; i: string; menu: (string | [string, string[]])[]; active: string; cmds?: string[]; ess?: [string, string][]; body?: Body[]; crumbs?: string[] }
  | { s: 'market'; q?: string; cats: string[]; cat: number; items: { n: string; by: string; d: string; i: string }[] };
export interface Pane { title: string; sub?: string; groups?: Group[]; body?: Body[]; btns?: string[]; chat?: { q: string; a: string }[] }
export interface Step { sc: Screen; t?: string; say: string; pane?: Pane; shell?: string[]; toast?: string }
export interface Tour { title: string; steps: Step[] }

/* Icons: emoji in a tinted tile (deliberately not Microsoft's artwork). */
const ICONS: Record<string, [string, string]> = {
  create: ['＋', '#0f6cbd'], vm: ['🖥️', '#0078d4'], rg: ['📦', '#5c2d91'], storage: ['🗄️', '#2f8f9d'], web: ['🌐', '#0078d4'],
  func: ['⚡', '#c19c00'], sql: ['🛢️', '#0063b1'], cosmos: ['🪐', '#3a96dd'], vnet: ['🔷', '#0078d4'], nsg: ['🛡️', '#5c2d91'],
  lb: ['⚖️', '#0078d4'], agw: ['🚦', '#0078d4'], fd: ['🌍', '#0078d4'], dns: ['🔎', '#0078d4'], vpn: ['🔐', '#0078d4'],
  er: ['🛣️', '#5c2d91'], wan: ['🕸️', '#0078d4'], pe: ['🔒', '#107c10'], kv: ['🔑', '#c19c00'], monitor: ['📈', '#0078d4'],
  policy: ['📜', '#5c2d91'], advisor: ['💡', '#c19c00'], cost: ['💲', '#107c10'], entra: ['👤', '#0078d4'], users: ['👥', '#0078d4'],
  sub: ['🔑', '#c19c00'], mg: ['🏛️', '#5c2d91'], all: ['▦', '#0078d4'], dash: ['▤', '#0078d4'], learn: ['🎓', '#0078d4'],
  defender: ['🛡️', '#107c10'], health: ['❤️', '#c50f1f'], arc: ['🧭', '#0078d4'], aks: ['☸️', '#326ce5'], aci: ['📦', '#0078d4'],
  vmss: ['🖥️', '#5c2d91'], avset: ['🧱', '#0078d4'], avd: ['🪟', '#0078d4'], migrate: ['🚚', '#0078d4'], databox: ['📦', '#c19c00'],
  purview: ['🧾', '#008575'], lock: ['🔒', '#5c2d91'], tag: ['🏷️', '#0078d4'], shell: ['⌨️', '#1b1a19'], template: ['🧩', '#0078d4'],
  deploy: ['🚀', '#0078d4'], ca: ['🚥', '#0078d4'], mfa: ['📱', '#0078d4'], guest: ['🤝', '#0078d4'], copilot: ['✨', '#8764b8'],
  asr: ['♻️', '#0078d4'], backup: ['🗃️', '#0078d4'], share: ['📁', '#2f8f9d'], container: ['🪣', '#2f8f9d'], plan: ['📄', '#0078d4'],
  ip: ['📍', '#0078d4'], disk: ['💽', '#0078d4'], nic: ['🔌', '#0078d4'], alert: ['🔔', '#c19c00'], log: ['📊', '#0078d4'],
  marketplace: ['🛍️', '#0078d4'], role: ['🎭', '#0078d4'], status: ['📶', '#107c10'], reserve: ['📅', '#0078d4'], doc: ['📘', '#0078d4'],
};
export const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const md = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/`(.+?)`/g, '<code>$1</code>');
const ico = (k: string, size = '') => { const [e, c] = ICONS[k] ?? ['▫️', '#0078d4']; return `<span class="pt-ico ${size}" style="--ic:${c}" aria-hidden="true">${e}</span>`; };
const T = (key: string) => `data-t="${esc(key)}"`;
const strip = (l: string) => l.replace(/\s*\*$/, '');

/* ---------------- chrome ---------------- */
function topbar() {
  return `<div class="pt-top">
    <button class="pt-tb pt-burger" ${T('menu')} aria-label="Portal menu">☰</button>
    <span class="pt-brand">Microsoft Azure</span><span class="pt-sim">SIMULATION</span>
    <div class="pt-search" ${T('search')}><span aria-hidden="true">🔍</span><span class="pt-search-txt">Search resources, services, and docs (G+/)</span></div>
    <button class="pt-copilot" ${T('copilot')}><span aria-hidden="true">✨</span> Copilot</button>
    <span class="pt-tbs">
      <button class="pt-tb" ${T('shell')} title="Cloud Shell">⌨️</button>
      <button class="pt-tb" ${T('bell')} title="Notifications">🔔</button>
      <button class="pt-tb" ${T('settings')} title="Settings">⚙️</button>
      <button class="pt-tb" title="Help">？</button>
      <span class="pt-acct"><span class="pt-acct-n">learner@contoso.com</span><span class="pt-acct-d">DEFAULT DIRECTORY</span></span>
      <span class="pt-avatar">L</span>
    </span>
  </div>`;
}
const crumbs = (c: string[] = []) => `<nav class="pt-crumbs">${['Home', ...c].map((x) => `<span>${esc(x)}</span>`).join('<span class="pt-sep">›</span>')}</nav>`;
const cmdbar = (cmds: string[] = []) => cmds.length ? `<div class="pt-cmds">${cmds.map((c) => `<button class="pt-cmd" ${T(`cmd:${c}`)}>${esc(c)}</button>`).join('')}</div>` : '';

/* ---------------- fields & bodies ---------------- */
function field([label, value, kind = 's', note]: Field) {
  const req = /\*$/.test(label);
  const name = strip(label);
  let ctl = '';
  if (kind === 's') ctl = `<span class="pt-select">${esc(value)}<span aria-hidden="true">⌄</span></span>`;
  else if (kind === 't') ctl = `<span class="pt-input ${value ? '' : 'pt-ph'}">${esc(value || 'Enter a value')}</span>`;
  else if (kind === 'r') ctl = `<span class="pt-radios">${value.split('|').map((o) => `<span class="pt-radio ${o.startsWith('*') ? 'on' : ''}"><i></i>${esc(o.replace(/^\*/, ''))}</span>`).join('')}</span>`;
  else if (kind === 'c') ctl = `<span class="pt-radios">${value.split('|').map((o) => `<span class="pt-check ${o.startsWith('*') ? 'on' : ''}"><i>${o.startsWith('*') ? '✓' : ''}</i>${esc(o.replace(/^\*/, ''))}</span>`).join('')}</span>`;
  else if (kind === 'tg') ctl = `<span class="pt-toggle ${value === 'On' ? 'on' : ''}"><i></i>${esc(value)}</span>`;
  else ctl = `<span class="pt-ro">${md(value)}</span>`;
  return `<div class="pt-field" ${T(`f:${name}`)}><span class="pt-label">${esc(name)}${req ? '<b class="pt-req"> *</b>' : ''} <span class="pt-info" aria-hidden="true">ⓘ</span></span><span class="pt-ctl">${ctl}${note ? `<span class="pt-note">${md(note)}</span>` : ''}</span></div>`;
}
const group = (g: Group) => `<section class="pt-group">${g.h ? `<h4>${esc(g.h)}</h4>` : ''}${g.p ? `<p class="pt-p">${md(g.p)}</p>` : ''}${(g.f ?? []).map(field).join('')}</section>`;

function table(cols: string[], rows: string[][]) {
  if (rows.length && rows[0].length === cols.length + 1) cols = ['Name', ...cols];
  return `<div class="pt-tablewrap"><table class="pt-table"><thead><tr><th class="pt-cb"><i></i></th>${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr ${T(`row:${r[0]}`)}><td class="pt-cb"><i></i></td>${r.map((c, i) => `<td>${i === 0 ? `<span class="pt-link">${md(c)}</span>` : statusCell(c)}</td>`).join('')}</tr>`)
    .join('')}</tbody></table></div>`;
}
function statusCell(c: string) {
  if (/^(Running|Succeeded|Healthy|Available|Enabled|Compliant|Connected|Ready|Active|On)$/i.test(c)) return `<span class="pt-dot ok"></span>${esc(c)}`;
  if (/^(Stopped|Stopped \(deallocated\)|Failed|Non-compliant|Disabled|Unhealthy|Off|Denied|High)$/i.test(c)) return `<span class="pt-dot bad"></span>${esc(c)}`;
  if (/^(Updating|Creating|Pending|Medium|Warning|In progress)$/i.test(c)) return `<span class="pt-dot warn"></span>${esc(c)}`;
  return md(c);
}

function chart(b: Extract<Body, { b: 'chart' }>) {
  const W = 520, H = 150, max = Math.max(...b.data, b.line ?? 0) * 1.15 || 1;
  const pts = b.data.map((d, i) => `${(i / (b.data.length - 1)) * W},${H - (d / max) * H}`).join(' ');
  const ly = b.line !== undefined ? H - (b.line / max) * H : null;
  return `<div class="pt-card"><p class="pt-card-h">${esc(b.title)}</p>
    <svg viewBox="-4 -8 ${W + 8} ${H + 22}" class="pt-chart" role="img" aria-label="${esc(b.title)}">
      ${[0.25, 0.5, 0.75].map((f) => `<line x1="0" x2="${W}" y1="${H * f}" y2="${H * f}" class="pt-grid"/>`).join('')}
      <polyline points="0,${H} ${pts} ${W},${H}" fill="${b.color ?? '#0f6cbd'}" opacity=".12"/>
      <polyline points="${pts}" fill="none" stroke="${b.color ?? '#0f6cbd'}" stroke-width="2.5"/>
      ${ly !== null ? `<line x1="0" x2="${W}" y1="${ly}" y2="${ly}" stroke="#c50f1f" stroke-dasharray="6 4" stroke-width="1.5"/><text x="${W}" y="${ly - 5}" text-anchor="end" class="pt-chart-l">${esc(b.lineLabel ?? '')}</text>` : ''}
      <text x="0" y="${H + 16}" class="pt-chart-l">${esc(b.unit ?? '')}</text>
    </svg></div>`;
}

function body(b: Body): string {
  switch (b.b) {
    case 'table': return `${b.title ? `<p class="pt-sec-h">${esc(b.title)}</p>` : ''}${cmdbar(b.cmds)}${table(b.cols, b.rows)}`;
    case 'form': return `${b.title ? `<p class="pt-sec-h">${esc(b.title)}</p>` : ''}${b.groups.map(group).join('')}${b.save ? `<div class="pt-savebar"><button class="pt-btn pt-primary" ${T(`btn:${b.save}`)}>${esc(b.save)}</button><button class="pt-btn">Discard</button></div>` : ''}`;
    case 'cards': return `${b.title ? `<p class="pt-sec-h">${esc(b.title)}</p>` : ''}<div class="pt-cards">${b.items.map((c) => `<div class="pt-card pt-kpi ${c.c ?? ''}" ${T(`card:${c.t}`)}><p class="pt-card-h">${esc(c.t)}</p><p class="pt-kpi-v">${md(c.v)}</p>${c.s ? `<p class="pt-kpi-s">${md(c.s)}</p>` : ''}</div>`).join('')}</div>`;
    case 'chart': return chart(b);
    case 'note': return `<div class="pt-note-bar ${b.tone ?? 'info'}">${md(b.text)}</div>`;
    case 'tree': return `<div class="pt-tree">${b.nodes.map((n) => `<div class="pt-tree-n" style="--d:${n.d}" ${T(`row:${n.n}`)}>${ico(n.i, 'sm')}<span>${esc(n.n)}</span>${n.tag ? `<span class="pt-pill">${esc(n.tag)}</span>` : ''}</div>`).join('')}</div>`;
    case 'code': return `${b.title ? `<p class="pt-sec-h">${esc(b.title)}</p>` : ''}<pre class="pt-code">${esc(b.text)}</pre>`;
  }
}

/* ---------------- screens ---------------- */
const HOME_SVCS: [string, string][] = [['Create a resource', 'create'], ['Virtual machines', 'vm'], ['Resource groups', 'rg'], ['Storage accounts', 'storage'], ['App Services', 'web'], ['Virtual networks', 'vnet'], ['Microsoft Entra ID', 'entra'], ['Cost Management', 'cost'], ['Azure Monitor', 'monitor'], ['More services', 'all']];

function home() {
  return `<div class="pt-page pt-home">
    <p class="pt-h2">Azure services</p>
    <div class="pt-svcs">${HOME_SVCS.map(([n, i]) => `<button class="pt-svc" ${T(`svc:${n}`)}>${ico(i, 'lg')}<span>${esc(n)}</span></button>`).join('')}</div>
    <p class="pt-h2">Resources</p>
    <div class="pt-tabs-s"><span class="on">Recent</span><span>Favorite</span></div>
    ${table(['Type', 'Last viewed'], [['rg-learn', 'Resource group', '2 hours ago'], ['vm-web-01', 'Virtual machine', 'Yesterday'], ['stlearn2026', 'Storage account', '3 days ago']])}
    <p class="pt-h2">Navigate</p>
    <div class="pt-navs">${[['Subscriptions', 'sub'], ['Resource groups', 'rg'], ['All resources', 'all'], ['Dashboard', 'dash']].map(([n, i]) => `<button class="pt-nav" ${T(`nav:${n}`)}>${ico(i, 'sm')}${esc(n)}</button>`).join('')}</div>
    <p class="pt-h2">Tools</p>
    <div class="pt-navs">${[['Microsoft Learn', 'learn'], ['Azure Monitor', 'monitor'], ['Microsoft Defender for Cloud', 'defender'], ['Cost Management', 'cost']].map(([n, i]) => `<button class="pt-nav" ${T(`nav:${n}`)}>${ico(i, 'sm')}${esc(n)}</button>`).join('')}</div>
  </div>`;
}

function search(sc: Extract<Screen, { s: 'search' }>) {
  const groups = [...new Set(sc.results.map((r) => r.g))];
  return `${home()}<div class="pt-dim"></div><div class="pt-drop">
    <div class="pt-drop-q"><span aria-hidden="true">🔍</span> ${esc(sc.q)}<span class="pt-caret"></span></div>
    <div class="pt-drop-tabs"><span class="on">All</span><span>Services (${sc.results.filter((r) => r.g === 'Services').length})</span><span>Resources</span><span>Marketplace</span><span>Documentation</span></div>
    ${groups.map((g) => `<p class="pt-drop-g">${esc(g)}</p>${sc.results.filter((r) => r.g === g).map((r) => `<button class="pt-drop-r" ${T(`res:${r.n}`)}>${ico(r.i, 'sm')}${esc(r.n)}</button>`).join('')}`).join('')}
  </div>`;
}

function list(sc: Extract<Screen, { s: 'list' }>) {
  return `<div class="pt-page">${crumbs(sc.crumbs)}
    <div class="pt-title">${ico(sc.i, 'lg')}<div><h3>${esc(sc.title)} <span class="pt-pin">☆ ⋯</span></h3><p class="pt-sub">Default Directory</p></div></div>
    ${cmdbar(sc.cmds ?? ['+ Create', 'Manage view', 'Refresh', 'Export to CSV', 'Open query', 'Assign tags'])}
    <div class="pt-filters"><span class="pt-filter">🔍 Filter for any field...</span><span class="pt-filter">Subscription equals <b>all</b></span><span class="pt-filter">Resource group equals <b>all</b> ×</span><span class="pt-filter">Location equals <b>all</b> ×</span><span class="pt-filter pt-add">+ Add filter</span></div>
    <p class="pt-count">Showing 1 to ${sc.rows.length} of ${sc.rows.length} records.</p>
    ${sc.rows.length ? table(sc.cols, sc.rows) : `<div class="pt-empty">${ico(sc.i, 'xl')}<p class="pt-empty-h">${esc(sc.empty ?? `No ${sc.title.toLowerCase()} to display`)}</p><button class="pt-btn pt-primary" ${T('cmd:+ Create')}>+ Create</button></div>`}
  </div>`;
}

function create(sc: Extract<Screen, { s: 'create' }>) {
  const last = sc.tab === sc.tabs.length - 1;
  return `<div class="pt-page pt-wiz">${crumbs(sc.crumbs)}
    <div class="pt-title"><div><h3>${esc(sc.title)} <span class="pt-pin">⋯</span></h3></div></div>
    <div class="pt-tabs">${sc.tabs.map((t, i) => `<button class="pt-tab ${i === sc.tab ? 'on' : ''}" ${T(`tab:${t}`)}>${esc(t)}</button>`).join('')}</div>
    <div class="pt-wiz-body">
      ${sc.valid ? `<div class="pt-note-bar ok">✔ Validation passed</div>` : ''}
      ${sc.intro ? `<p class="pt-p">${md(sc.intro)}</p>` : ''}
      ${sc.groups.map(group).join('')}
    </div>
    <div class="pt-wiz-foot">
      ${last ? `<button class="pt-btn pt-primary" ${T('btn:Create')}>Create</button>` : `<button class="pt-btn pt-primary" ${T('btn:Review + create')}>Review + create</button>`}
      <button class="pt-btn" ${sc.tab === 0 ? 'disabled' : ''}>&lt; Previous</button>
      <button class="pt-btn" ${T('btn:Next')} ${last ? 'disabled' : ''}>Next${last ? '' : ` : ${esc(sc.tabs[sc.tab + 1])}`} &gt;</button>
      ${last ? '<span class="pt-dl">Download a template for automation</span>' : ''}
    </div>
  </div>`;
}

function deploy(sc: Extract<Screen, { s: 'deploy' }>) {
  return `<div class="pt-page">${crumbs()}
    <div class="pt-title">${ico('deploy', 'lg')}<div><h3>${esc(sc.name)} | Overview <span class="pt-pin">☆ ⋯</span></h3><p class="pt-sub">Deployment</p></div></div>
    ${cmdbar(['Delete', 'Cancel', 'Redeploy', 'Download', 'Refresh'])}
    <div class="pt-deploy">
      <div class="pt-deploy-h">${sc.done ? '<span class="pt-big ok">✔</span><span>Your deployment is complete</span>' : '<span class="pt-spinner"></span><span>Deployment is in progress</span>'}</div>
      <dl class="pt-ess">${[['Deployment name', sc.name], ['Subscription', 'Azure subscription 1'], ['Resource group', sc.rg ?? 'rg-learn'], ['Start time', '12/11/2026, 10:24:31']].map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
      ${sc.done ? `<p class="pt-sec-h">Next steps</p><button class="pt-btn pt-primary" ${T('btn:Go to resource')}>Go to resource</button>` : '<p class="pt-p">Azure Resource Manager is creating your resources. You can leave this page; a notification tells you when it finishes.</p>'}
    </div></div>`;
}

function res(sc: Extract<Screen, { s: 'res' }>) {
  const items = sc.menu.map((m) => typeof m === 'string'
    ? `<button class="pt-mi ${m === sc.active ? 'on' : ''}" ${T(`menu:${m}`)}>${esc(m)}</button>`
    : `<p class="pt-mg">⌄ ${esc(m[0])}</p>${m[1].map((x) => `<button class="pt-mi pt-mi-in ${x === sc.active ? 'on' : ''}" ${T(`menu:${x}`)}>${esc(x)}</button>`).join('')}`).join('');
  const title = sc.active === 'Overview' ? sc.title : `${sc.title} | ${sc.active}`;
  return `<div class="pt-page pt-res">${crumbs(sc.crumbs)}
    <div class="pt-title">${ico(sc.i, 'lg')}<div><h3>${esc(title)} <span class="pt-pin">☆ ⋯</span></h3><p class="pt-sub">${esc(sc.type)}</p></div></div>
    <div class="pt-res-grid">
      <aside class="pt-menu"><span class="pt-menu-s">🔍 Search</span>${items}</aside>
      <div class="pt-res-main">
        ${cmdbar(sc.cmds)}
        ${sc.ess ? `<p class="pt-sec-h pt-ess-h">⌄ Essentials <span class="pt-json">JSON View</span></p><dl class="pt-ess pt-ess2">${sc.ess.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${statusCell(v)}</dd>`).join('')}</dl>` : ''}
        ${(sc.body ?? []).map(body).join('')}
      </div>
    </div></div>`;
}

function market(sc: Extract<Screen, { s: 'market' }>) {
  return `<div class="pt-page">${crumbs()}
    <div class="pt-title">${ico('create', 'lg')}<div><h3>Create a resource</h3></div></div>
    <div class="pt-market">
      <aside class="pt-menu"><p class="pt-mg">Get Started</p>${sc.cats.map((c, i) => `<button class="pt-mi ${i === sc.cat ? 'on' : ''}" ${T(`cat:${c}`)}>${esc(c)}</button>`).join('')}</aside>
      <div><div class="pt-search pt-search-in"><span aria-hidden="true">🔍</span><span class="pt-search-txt">${esc(sc.q ?? 'Search services and marketplace')}</span></div>
      <p class="pt-sec-h">Popular Azure services</p>
      <div class="pt-mkt">${sc.items.map((it) => `<div class="pt-mkt-i" ${T(`item:${it.n}`)}>${ico(it.i, 'lg')}<div><p class="pt-mkt-n">${esc(it.n)}</p><p class="pt-mkt-b">${esc(it.by)}</p><p class="pt-mkt-d">${esc(it.d)}</p><span class="pt-link">Create ⌄</span> <span class="pt-link pt-learn">Learn more</span></div></div>`).join('')}</div></div>
    </div></div>`;
}

function pane(p: Pane) {
  const chat = p.chat ? `<div class="pt-chat">${p.chat.map((c) => `<div class="pt-bub me">${md(c.q)}</div><div class="pt-bub ai">${md(c.a)}</div>`).join('')}<div class="pt-chat-in">Ask a question or describe a task…</div><p class="pt-chat-f">AI-generated content may be incorrect.</p></div>` : '';
  return `<aside class="pt-pane ${p.chat ? 'pt-copane' : ''}"><div class="pt-pane-h"><div><h4>${p.chat ? '✨ ' : ''}${esc(p.title)}</h4>${p.sub ? `<p class="pt-sub">${esc(p.sub)}</p>` : ''}</div><span aria-hidden="true">✕</span></div>
    <div class="pt-pane-b">${(p.groups ?? []).map(group).join('')}${(p.body ?? []).map(body).join('')}${chat}</div>
    ${p.btns ? `<div class="pt-pane-f">${p.btns.map((b, i) => `<button class="pt-btn ${i === 0 ? 'pt-primary' : ''}" ${T(`btn:${b}`)}>${esc(b)}</button>`).join('')}</div>` : ''}</aside>`;
}

export function renderStep(st: Step): string {
  const sc = st.sc;
  const main = sc.s === 'home' ? home() : sc.s === 'search' ? search(sc) : sc.s === 'list' ? list(sc) : sc.s === 'create' ? create(sc) : sc.s === 'deploy' ? deploy(sc) : sc.s === 'market' ? market(sc) : res(sc);
  const shell = st.shell ? `<div class="pt-shell"><div class="pt-shell-h"><span>Bash ⌄</span><span>⏻ ？ ⚙️ ⧉ ✕</span></div><pre>${st.shell.map((l) => (l.startsWith('$ ') ? `<span class="pt-ps">learner@Azure:~$</span> ${esc(l.slice(2))}` : esc(l))).join('\n')}<span class="pt-caret"></span></pre></div>` : '';
  const toast = st.toast ? `<div class="pt-toast">${md(st.toast)}</div>` : '';
  return `${topbar()}<div class="pt-body">${main}${st.pane ? pane(st.pane) : ''}${toast}</div>${shell}`;
}
