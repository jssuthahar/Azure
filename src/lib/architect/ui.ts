/**
 * Architecture Builder UI: an SVG canvas you build on by drag-and-drop or tap,
 * a link mode, an inspector, and Check / Traffic / Explain tabs. Everything
 * runs in the browser; designs are saved in localStorage (per browser) and can
 * be exported as SVG, PNG or JSON. EDUCATION ONLY: nothing is deployed.
 */
import { iconSvg, iconG } from './icons';
import { CATALOG, KINDS, LINK_LABEL, linkKindFor, makeNode, byId, childrenOf, linked, newId, emptyDesign, isDesign, type Design, type ArchNode, type Kind, type NsgRule } from './model';
import { check, summary, type Finding } from './rules';
import { simulate, sources, targets } from './traffic';
import { explain } from './explain';
import { TEMPLATES } from './templates';

const W = 1600, H = 1000;
const LEAF = { w: 182, h: 66 };
const PAD = { top: 34, side: 18, bottom: 18 };
const MIN: Partial<Record<Kind, { w: number; h: number }>> = { vnet: { w: 340, h: 210 }, subnet: { w: 190, h: 100 } };
const KEY = 'msdb-architect-v1';
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

interface Rect { x: number; y: number; w: number; h: number }
interface Saved { projects: Record<string, Design>; draft?: Design }
const load = (): Saved => { try { const v = JSON.parse(localStorage.getItem(KEY) ?? 'null'); return v && typeof v === 'object' ? { projects: v.projects ?? {}, draft: isDesign(v.draft) ? v.draft : undefined } : { projects: {} }; } catch { return { projects: {} }; } };
const store = (s: Saved) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode or full: designs stay in memory */ } };

export function mountBuilder(root: HTMLElement, lessonBase: string) {
  const $ = <T extends Element = HTMLElement>(sel: string) => root.querySelector(sel) as T;
  const svg = $<SVGSVGElement>('[data-ab-svg]');
  const wrap = $('[data-ab-wrap]');
  const live = $('[data-ab-live]');
  const saved = load();
  let d: Design = saved.draft ?? TEMPLATES.find((t) => t.id === 'web-ha')!.design();
  let sel: string | null = null;
  let linkFrom: string | null = null;
  let linkMode = false;
  let zoom = 1;
  /** Visible part of the 1600 × 1000 drawing area: fitted to the design, and only grows while you work. */
  let vb = { x: 0, y: 0, w: W, h: H };
  let refit = true;
  function fitView(grow: boolean) {
    const rs = [...rects.values()];
    if (!rs.length) { vb = { x: 0, y: 0, w: 1000, h: 600 }; return; }
    const x0 = Math.max(0, Math.min(...rs.map((r) => r.x)) - 40), y0 = Math.max(0, Math.min(...rs.map((r) => r.y)) - 40);
    const x1 = Math.min(W, Math.max(...rs.map((r) => r.x + r.w)) + 60), y1 = Math.min(H, Math.max(...rs.map((r) => r.y + r.h)) + 60);
    let nx = x0, ny = y0, nw = Math.max(x1 - x0, 720), nh = Math.max(y1 - y0, 420);
    if (grow) { nx = Math.min(nx, vb.x); ny = Math.min(ny, vb.y); nw = Math.max(x1, vb.x + vb.w) - nx; nh = Math.max(y1, vb.y + vb.h) - ny; }
    nh = Math.max(nh, nw * 0.5);
    vb = { x: nx, y: ny, w: Math.min(nw, W - nx), h: Math.min(nh, H - ny) };
  }
  let findings: Finding[] = [];
  let trafficPath: string[] = [];
  let trafficOk = true;
  const undo: string[] = [];

  const say = (msg: string) => { live.textContent = ''; requestAnimationFrame(() => { live.textContent = msg; }); };
  const toast = (msg: string, tone: 'ok' | 'bad' | 'info' = 'info') => {
    const t = $('[data-ab-toast]');
    t.textContent = msg; t.dataset.tone = tone; t.hidden = false;
    clearTimeout((t as any)._h); (t as any)._h = setTimeout(() => { t.hidden = true; }, 4200);
    say(msg);
  };
  const snapshot = () => { undo.push(JSON.stringify(d)); if (undo.length > 60) undo.shift(); };
  const persist = () => { saved.draft = d; store(saved); };
  const changed = (panel = true) => { trafficPath = []; persist(); render(); if (panel) renderPanel(); };

  /* ---------------- geometry ---------------- */
  const rects = new Map<string, Rect>();
  function layout() {
    rects.clear();
    const size = (n: ArchNode): Rect => {
      if (rects.has(n.id)) return rects.get(n.id)!;
      if (!CATALOG[n.kind].container) { const r = { x: n.x, y: n.y, ...LEAF }; rects.set(n.id, r); return r; }
      const kids = childrenOf(d, n.id).map(size);
      const base = MIN[n.kind]!;
      // wide enough for "icon name" on the left and the address range on the right
      const sub = String(n.kind === 'vnet' ? n.props.addressSpace : n.props.prefix);
      const m = { w: Math.max(base.w, 54 + n.name.length * 9 + sub.length * 7.5), h: base.h };
      const right = Math.max(n.x + m.w, ...kids.map((k) => k.x + k.w + PAD.side));
      const bottom = Math.max(n.y + m.h, ...kids.map((k) => k.y + k.h + PAD.bottom));
      const r = { x: n.x, y: n.y, w: right - n.x, h: bottom - n.y };
      rects.set(n.id, r);
      return r;
    };
    d.nodes.forEach(size);
  }
  const center = (id: string) => { const r = rects.get(id); return r ? { x: r.x + r.w / 2, y: CATALOG[byId(d, id)!.kind].container ? r.y + 16 : r.y + r.h / 2 } : { x: 0, y: 0 }; };
  const inside = (p: { x: number; y: number }, r: Rect) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  /** Deepest container at a point that accepts `kind`. */
  function parentAt(p: { x: number; y: number }, kind: Kind, skip?: string): string | undefined {
    const ok = CATALOG[kind].parents;
    const hits = d.nodes.filter((n) => n.id !== skip && ok.includes(n.kind) && rects.get(n.id) && inside(p, rects.get(n.id)!) && !isDescendant(n.id, skip));
    hits.sort((a, b) => (rects.get(a.id)!.w * rects.get(a.id)!.h) - (rects.get(b.id)!.w * rects.get(b.id)!.h));
    return hits[0]?.id;
  }
  function isDescendant(id: string, of?: string): boolean {
    if (!of) return false;
    let n = byId(d, id);
    while (n?.parent) { if (n.parent === of) return true; n = byId(d, n.parent); }
    return false;
  }
  const descendants = (id: string): ArchNode[] => childrenOf(d, id).flatMap((c) => [c, ...descendants(c.id)]);
  function freeSpot(kind: Kind, parent?: string) {
    layout();
    const pr = parent ? rects.get(parent) : undefined;
    const box = pr ? { x: pr.x + PAD.side, y: pr.y + PAD.top, w: Math.max(pr.w - 2 * PAD.side, LEAF.w), h: 600 } : { x: 60, y: 60, w: W - 260, h: H - 120 };
    const size = CATALOG[kind].container ? MIN[kind]! : LEAF;
    const busy = d.nodes.filter((n) => n.parent === parent).map((n) => rects.get(n.id)!).filter(Boolean);
    for (let y = box.y; y < box.y + box.h; y += 24) for (let x = box.x; x <= box.x + Math.max(box.w - size.w, 0); x += 24) {
      const r = { x, y, w: size.w, h: size.h };
      if (!busy.some((b) => r.x < b.x + b.w + 12 && b.x < r.x + r.w + 12 && r.y < b.y + b.h + 12 && b.y < r.y + r.h + 12)) return { x, y };
    }
    return { x: box.x, y: box.y + 20 };
  }

  /* ---------------- rendering ---------------- */
  const flagOf = (id: string) => { const f = findings.filter((x) => x.nodes.includes(id)); return f.some((x) => x.level === 'error') ? 'error' : f.some((x) => x.level === 'warn') ? 'warn' : ''; };
  const where = (n: ArchNode) => (n.parent ? ` in ${byId(d, n.parent)?.name}` : '');
  function render() {
    findings = check(d);
    layout();
    const order = (n: ArchNode) => (n.kind === 'vnet' ? 0 : n.kind === 'subnet' ? 1 : 3);
    const nodes = [...d.nodes].sort((a, b) => order(a) - order(b));
    let html = '<defs><marker id="ab-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="ab-arrowhead"/></marker></defs>';
    html += `<rect class="ab-bg" x="0" y="0" width="${W}" height="${H}" data-bg="1"/>`;
    const drawNode = (n: ArchNode) => {
      const r = rects.get(n.id)!;
      const info = CATALOG[n.kind];
      const flag = flagOf(n.id);
      const cls = `ab-node ab-${info.container ? n.kind : 'leaf'} ab-g-${info.group.toLowerCase()}${sel === n.id ? ' is-sel' : ''}${linkFrom === n.id ? ' is-linkfrom' : ''}${flag ? ` is-${flag}` : ''}${trafficPath.includes(n.id) ? (trafficOk ? ' is-path' : ' is-pathbad') : ''}`;
      const label = `${info.label} ${n.name}${where(n)}${flag ? `, has ${flag === 'error' ? 'an error' : 'a warning'}` : ''}`;
      const sub = info.container ? (n.kind === 'vnet' ? n.props.addressSpace : n.props.prefix) : n.kind === 'vm' ? `${n.props.os} · zone ${n.props.zone}` : n.kind === 'lb' ? `${n.props.type} · ${n.props.sku}` : n.kind === 'nsg' ? `${(n.props.rules ?? []).length} custom rule(s)` : n.kind === 'storage' || n.kind === 'sql' ? `public: ${n.props.publicAccess}` : n.kind === 'pip' ? n.props.sku : n.kind === 'dns' ? n.props.zone : info.label;
      html += `<g class="${cls}" data-id="${n.id}" tabindex="0" role="button" aria-label="${esc(label)}" aria-pressed="${sel === n.id}">`;
      if (info.container) {
        html += `<rect class="ab-box" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="10"/>${iconG(n.kind, r.x + 10, r.y + 7, 18)}<text class="ab-ctitle" x="${r.x + 34}" y="${r.y + 21}">${esc(n.name)}</text><text class="ab-csub" x="${r.x + r.w - 12}" y="${r.y + 21}" text-anchor="end">${esc(sub)}</text>`;
      } else {
        html += `<rect class="ab-card" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="9"/><rect class="ab-stripe" x="${r.x}" y="${r.y}" width="6" height="${r.h}" rx="3"/><rect class="ab-icobg" x="${r.x + 13}" y="${r.y + 15}" width="36" height="36" rx="9"/>${iconG(n.kind, r.x + 18, r.y + 20, 26)}<text class="ab-name" x="${r.x + 58}" y="${r.y + 29}">${esc(n.name.length > 15 ? n.name.slice(0, 14) + '…' : n.name)}</text><text class="ab-sub" x="${r.x + 58}" y="${r.y + 49}">${esc(String(sub).length > 18 ? String(sub).slice(0, 17) + '…' : sub)}</text>`;
      }
      if (flag) html += `<circle class="ab-flag ab-flag-${flag}" cx="${r.x + r.w - 4}" cy="${r.y + 4}" r="9"/><text class="ab-flagt" x="${r.x + r.w - 4}" y="${r.y + 8.5}" text-anchor="middle">${flag === 'error' ? '!' : '?'}</text>`;
      html += '</g>';
    };
    nodes.filter((n) => CATALOG[n.kind].container).forEach(drawNode);
    for (const l of d.links) {
      const a = center(l.from), b = center(l.to);
      if (!byId(d, l.from) || !byId(d, l.to)) continue;
      const on = trafficPath.includes(l.from) && trafficPath.includes(l.to);
      html += `<g class="ab-link ab-link-${l.kind}${on ? (trafficOk ? ' is-path' : ' is-pathbad') : ''}"><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"${l.kind === 'backend' || l.kind === 'pe' || l.kind === 'route' ? ' marker-end="url(#ab-arrow)"' : ''}/><text x="${(a.x + b.x) / 2}" y="${(a.y + b.y) / 2 - 6}" text-anchor="middle">${esc(LINK_LABEL[l.kind])}</text></g>`;
    }
    nodes.filter((n) => !CATALOG[n.kind].container).forEach(drawNode);
    if (trafficPath.length > 1) {
      const pts = trafficPath.map(center);
      const dpath = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
      html += `<path class="ab-flow ${trafficOk ? 'ok' : 'bad'}" d="${dpath}"/>`;
      if (!reduced()) html += `<circle class="ab-packet ${trafficOk ? 'ok' : 'bad'}" r="8"><animateMotion dur="${Math.max(1.2, pts.length * 0.6)}s" repeatCount="indefinite" path="${dpath}"/></circle>`;
    }
    svg.innerHTML = html;
    if (!drag) { fitView(!refit); refit = false; svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`); }
    const s = summary(findings);
    $('[data-ab-badge]').textContent = s.error + s.warn ? `${s.error} error${s.error === 1 ? '' : 's'} · ${s.warn} warning${s.warn === 1 ? '' : 's'}` : '✓ No problems';
    ($('[data-ab-badge]') as HTMLElement).dataset.tone = s.error ? 'bad' : s.warn ? 'warn' : 'ok';
    $('[data-ab-mode]').textContent = linkMode ? (linkFrom ? `Link: now tap the second resource (Esc to cancel)` : 'Link: tap the first resource') : '';
    ($('[data-ab-link]') as HTMLElement).setAttribute('aria-pressed', String(linkMode));
    const nm = $<HTMLInputElement>('[data-ab-name]');
    if (document.activeElement !== nm) nm.value = d.name;
  }
  const focusSel = () => { if (sel) (svg.querySelector(`[data-id="${sel}"]`) as SVGGElement | null)?.focus({ preventScroll: false }); };

  /* ---------------- actions ---------------- */
  function addNode(kind: Kind, at?: { x: number; y: number }) {
    snapshot();
    layout();
    let parent: string | undefined;
    if (at) parent = parentAt(at, kind);
    else if (sel && CATALOG[kind].parents.includes(byId(d, sel)!.kind)) parent = sel;
    // Nothing suitable selected: use the first box that accepts it (easier than dragging on a phone).
    else if (CATALOG[kind].parents.length) parent = d.nodes.find((n) => CATALOG[kind].parents.includes(n.kind))?.id;
    const pos = at ? { x: Math.max(0, Math.min(W - LEAF.w, at.x - LEAF.w / 2)), y: Math.max(0, Math.min(H - LEAF.h, at.y - 16)) } : freeSpot(kind, parent);
    const n = makeNode(kind, pos.x, pos.y, d, parent);
    if (kind === 'subnet' && parent) {
      const v = byId(d, parent)!;
      const used = childrenOf(d, parent).filter((x) => x.kind === 'subnet').length;
      n.props.prefix = String(v.props.addressSpace).replace(/^(\d+\.\d+)\.\d+\.\d+\/\d+$/, `$1.${used + 1}.0/24`);
    }
    if (kind === 'vnet') n.props.addressSpace = `10.${d.nodes.filter((x) => x.kind === 'vnet').length}.0.0/16`;
    d.nodes.push(n);
    sel = n.id;
    changed();
    focusSel();
    const needs = CATALOG[kind].parents;
    toast(needs.length && !parent ? `Added ${n.name}. Drag it into a ${needs.map((p) => CATALOG[p].label.toLowerCase()).join(' or ')}.` : `Added ${n.name}${parent ? ` to ${byId(d, parent)!.name}` : ''}.`, 'ok');
  }
  function removeNode(id: string) {
    const n = byId(d, id);
    if (!n) return;
    snapshot();
    const gone = new Set([id, ...descendants(id).map((x) => x.id)]);
    d.nodes = d.nodes.filter((x) => !gone.has(x.id));
    d.links = d.links.filter((l) => !gone.has(l.from) && !gone.has(l.to));
    sel = null;
    changed();
    toast(`Deleted ${n.name}${gone.size > 1 ? ` and ${gone.size - 1} resource(s) inside it` : ''}.`);
  }
  function addLink(a: string, b: string): boolean {
    const na = byId(d, a), nb = byId(d, b);
    if (!na || !nb || a === b) return false;
    const k = linkKindFor(na.kind, nb.kind);
    if (!k) { toast(`${CATALOG[na.kind].label} and ${CATALOG[nb.kind].label.toLowerCase()} can’t be linked. ${hintFor(na.kind)}`, 'bad'); return false; }
    const [from, to] = k.from === 'a' ? [a, b] : [b, a];
    if (d.links.some((l) => (l.from === from && l.to === to) || (l.from === to && l.to === from))) { toast('They’re already linked.'); return false; }
    snapshot();
    d.links.push({ id: newId('l'), from, to, kind: k.kind });
    changed();
    toast(`Linked ${na.name} → ${nb.name} (${LINK_LABEL[k.kind]}).`, 'ok');
    return true;
  }
  function hintFor(k: Kind) {
    const t = KINDS.filter((x) => linkKindFor(k, x));
    return t.length ? `A ${CATALOG[k].label.toLowerCase()} links to: ${t.map((x) => CATALOG[x].label.toLowerCase()).join(', ')}.` : `A ${CATALOG[k].label.toLowerCase()} is placed inside a box instead of linked.`;
  }
  function setDesign(nd: Design, msg: string) { snapshot(); d = nd; sel = null; linkFrom = null; refit = true; changed(); toast(msg, 'ok'); }

  /* ---------------- pointer: drag on canvas ---------------- */
  const toSvg = (e: PointerEvent | MouseEvent) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const m = svg.getScreenCTM(); return m ? p.matrixTransform(m.inverse()) : { x: 0, y: 0 }; };
  let drag: { id: string; dx: number; dy: number; sx: number; sy: number; moved: boolean; pid: number } | null = null;
  svg.addEventListener('pointerdown', (e) => {
    const g = (e.target as Element).closest('[data-id]') as SVGGElement | null;
    if (!g) { if (!linkMode) { sel = null; render(); renderPanel(); } return; }
    const id = g.dataset.id!;
    if (linkMode) {
      e.preventDefault();
      if (!linkFrom) { linkFrom = id; sel = id; render(); say(`Linking from ${byId(d, id)!.name}. Tap the second resource.`); }
      else { const ok = addLink(linkFrom, id); linkFrom = null; if (ok) { linkMode = false; } render(); }
      return;
    }
    const n = byId(d, id)!;
    const p = toSvg(e);
    drag = { id, dx: p.x - n.x, dy: p.y - n.y, sx: e.clientX, sy: e.clientY, moved: false, pid: e.pointerId };
    if (sel !== id) { sel = id; render(); renderPanel(); }
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pid) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 5) return;
    if (!drag.moved) { snapshot(); drag.moved = true; }
    e.preventDefault();
    const n = byId(d, drag.id)!;
    const p = toSvg(e);
    const nx = Math.max(0, Math.min(W - 60, p.x - drag.dx)), ny = Math.max(0, Math.min(H - 40, p.y - drag.dy));
    const ddx = nx - n.x, ddy = ny - n.y;
    n.x = nx; n.y = ny;
    for (const c of descendants(n.id)) { c.x += ddx; c.y += ddy; }
    render();
  });
  const endDrag = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.pid) return;
    const n = byId(d, drag.id)!;
    if (drag.moved) {
      layout();
      const r = rects.get(n.id)!;
      const probe = CATALOG[n.kind].container ? { x: r.x + 20, y: r.y + 10 } : { x: r.x + r.w / 2, y: r.y + r.h / 2 };
      const before = n.parent;
      n.parent = CATALOG[n.kind].parents.length ? parentAt(probe, n.kind, n.id) : undefined;
      if (n.parent !== before) toast(n.parent ? `${n.name} is now in ${byId(d, n.parent)!.name}.` : `${n.name} is no longer in ${byId(d, before!)?.name ?? 'a box'}.`, 'info');
      changed();
    }
    drag = null;
  };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);

  /* ---------------- keyboard on nodes ---------------- */
  svg.addEventListener('focusin', (e) => {
    const g = (e.target as Element).closest('[data-id]') as SVGGElement | null;
    if (g && sel !== g.dataset.id && !drag) { sel = g.dataset.id!; renderPanel(); svg.querySelectorAll('.is-sel').forEach((x) => x.classList.remove('is-sel')); g.classList.add('is-sel'); }
  });
  svg.addEventListener('keydown', (e) => {
    const g = (e.target as Element).closest('[data-id]') as SVGGElement | null;
    if (!g) return;
    const n = byId(d, g.dataset.id!)!;
    const step = e.shiftKey ? 40 : 10;
    const mv: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (mv[e.key]) {
      e.preventDefault();
      snapshot();
      const [dx, dy] = mv[e.key];
      for (const x of [n, ...descendants(n.id)]) { x.x = Math.max(0, x.x + dx); x.y = Math.max(0, x.y + dy); }
      layout();
      const r = rects.get(n.id)!;
      if (CATALOG[n.kind].parents.length) n.parent = parentAt(CATALOG[n.kind].container ? { x: r.x + 20, y: r.y + 10 } : { x: r.x + r.w / 2, y: r.y + r.h / 2 }, n.kind, n.id);
      changed(false); focusSel();
    } else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeNode(n.id); svg.focus(); }
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (linkMode) { if (!linkFrom) { linkFrom = n.id; render(); focusSel(); say(`Linking from ${n.name}. Choose the second resource and press Enter.`); } else { if (addLink(linkFrom, n.id)) linkMode = false; linkFrom = null; render(); focusSel(); } }
      else { showTab('props'); ($('[data-ab-props] input, [data-ab-props] select') as HTMLElement | null)?.focus(); }
    }
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && linkMode) { linkMode = false; linkFrom = null; render(); say('Link mode off.'); }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !(e.target as HTMLElement).matches('input, textarea')) { e.preventDefault(); doUndo(); }
  });

  /* ---------------- palette: tap to add, or drag onto the canvas ---------------- */
  const pal = $('[data-ab-palette]');
  pal.innerHTML = (['Networking', 'Compute', 'Data', 'Security', 'Connectivity'] as const).map((grp) => `<div class="ab-pgroup"><p class="ab-pgh">${grp}</p>${KINDS.filter((k) => CATALOG[k].group === grp).map((k) => `<button type="button" class="ab-pal" data-kind="${k}" title="${esc(CATALOG[k].blurb)}">${iconSvg(k)} ${esc(CATALOG[k].label)}</button>`).join('')}</div>`).join('');
  let pdrag: { kind: Kind; sx: number; sy: number; moved: boolean; ghost?: HTMLElement } | null = null;
  pal.addEventListener('pointerdown', (e) => {
    const b = (e.target as Element).closest('[data-kind]') as HTMLButtonElement | null;
    if (!b || e.button > 0) return;
    pdrag = { kind: b.dataset.kind as Kind, sx: e.clientX, sy: e.clientY, moved: false };
  });
  window.addEventListener('pointermove', (e) => {
    if (!pdrag) return;
    if (!pdrag.moved && Math.hypot(e.clientX - pdrag.sx, e.clientY - pdrag.sy) < 8) return;
    if (!pdrag.moved) { pdrag.moved = true; const gh = document.createElement('div'); gh.className = 'ab-ghost'; gh.textContent = `${CATALOG[pdrag.kind].icon} ${CATALOG[pdrag.kind].label}`; document.body.append(gh); pdrag.ghost = gh; }
    pdrag.ghost!.style.transform = `translate(${e.clientX + 8}px, ${e.clientY + 8}px)`;
  });
  window.addEventListener('pointerup', (e) => {
    if (!pdrag) return;
    const p = pdrag; pdrag = null;
    p.ghost?.remove();
    if (!p.moved) return; // a tap: the click handler adds it
    const over = document.elementFromPoint(e.clientX, e.clientY);
    if (over && svg.contains(over)) addNode(p.kind, toSvg(e)); else toast('Drop it on the canvas to add it.');
    suppressClick = true;
  });
  let suppressClick = false;
  pal.addEventListener('click', (e) => {
    const b = (e.target as Element).closest('[data-kind]') as HTMLButtonElement | null;
    if (!b) return;
    if (suppressClick) { suppressClick = false; return; }
    addNode(b.dataset.kind as Kind);
  });

  /* ---------------- toolbar ---------------- */
  const tplSel = $<HTMLSelectElement>('[data-ab-template]');
  tplSel.innerHTML = TEMPLATES.map((t) => `<option value="${t.id}">${esc(t.title)}</option>`).join('');
  $('[data-ab-load]').addEventListener('click', () => {
    const t = TEMPLATES.find((x) => x.id === tplSel.value)!;
    if (d.nodes.length && !confirm(`Replace the current design with “${t.title}”? (Undo brings it back.)`)) return;
    setDesign(t.design(), `Loaded “${t.title}”.${t.goal ? ` Goal: ${t.goal}` : ''}`);
    const goal = $('[data-ab-goal]'); goal.hidden = !t.goal; goal.textContent = t.goal ? `🎯 Goal: ${t.goal}` : '';
  });
  $('[data-ab-link]').addEventListener('click', () => { linkMode = !linkMode; linkFrom = null; render(); say(linkMode ? 'Link mode on. Tap the first resource, then the second.' : 'Link mode off.'); });
  const doUndo = () => { const prev = undo.pop(); if (!prev) { toast('Nothing to undo.'); return; } d = JSON.parse(prev); sel = null; trafficPath = []; refit = true; persist(); render(); renderPanel(); toast('Undone.'); };
  $('[data-ab-undo]').addEventListener('click', doUndo);
  $('[data-ab-zoom]').addEventListener('click', (e) => {
    const b = (e.target as Element).closest('[data-z]') as HTMLElement | null;
    if (!b) return;
    if (b.dataset.z === 'fit') { refit = true; render(); }
    zoom = b.dataset.z === 'fit' ? 1 : Math.max(0.6, Math.min(2.4, zoom * (b.dataset.z === 'in' ? 1.25 : 0.8)));
    svg.style.width = `${zoom * 100}%`;
    say(`Zoom ${Math.round(zoom * 100)}%.`);
  });
  $<HTMLInputElement>('[data-ab-name]').addEventListener('change', (e) => { snapshot(); d.name = (e.target as HTMLInputElement).value.trim().slice(0, 60) || 'My design'; persist(); });

  // Saved projects (this browser only)
  const projSel = $<HTMLSelectElement>('[data-ab-projects]');
  const renderProjects = () => {
    const names = Object.keys(saved.projects).sort();
    projSel.innerHTML = names.length ? names.map((n) => `<option>${esc(n)}</option>`).join('') : '<option value="">No saved designs yet</option>';
    projSel.disabled = !names.length;
  };
  renderProjects();
  $('[data-ab-save]').addEventListener('click', () => { saved.projects[d.name] = JSON.parse(JSON.stringify(d)); store(saved); renderProjects(); projSel.value = d.name; toast(`Saved “${d.name}” in this browser.`, 'ok'); });
  $('[data-ab-open]').addEventListener('click', () => { const p = saved.projects[projSel.value]; if (p) setDesign(JSON.parse(JSON.stringify(p)), `Opened “${p.name}”.`); });
  $('[data-ab-del]').addEventListener('click', () => { const n = projSel.value; if (!n || !saved.projects[n] || !confirm(`Delete the saved design “${n}”?`)) return; delete saved.projects[n]; store(saved); renderProjects(); toast(`Deleted “${n}”.`); });

  // Export / import
  const download = (blob: Blob, name: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
  const fileBase = () => (d.name || 'design').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'design';
  const svgText = () => {
    sel = null; linkFrom = null; render();
    layout();
    const rs = [...rects.values()];
    const minX = Math.max(0, Math.min(...rs.map((r) => r.x)) - 30), minY = Math.max(0, Math.min(...rs.map((r) => r.y)) - 30);
    const maxX = Math.max(...rs.map((r) => r.x + r.w)) + 30, maxY = Math.max(...rs.map((r) => r.y + r.h)) + 50;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('viewBox', `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);
    clone.setAttribute('width', String(maxX - minX)); clone.setAttribute('height', String(maxY - minY));
    clone.removeAttribute('style');
    clone.querySelectorAll('[tabindex]').forEach((x) => { x.removeAttribute('tabindex'); x.removeAttribute('role'); x.removeAttribute('aria-pressed'); });
    clone.querySelectorAll('.ab-packet').forEach((x) => x.remove());
    const st = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    st.textContent = EXPORT_CSS;
    clone.prepend(st);
    const foot = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    foot.setAttribute('x', String(minX + 12)); foot.setAttribute('y', String(maxY - 14)); foot.setAttribute('class', 'ab-foot');
    foot.textContent = `${d.name} · drawn in the MSDEVBUILD Azure Architecture Builder (simulation, not deployed)`;
    clone.append(foot);
    return { text: new XMLSerializer().serializeToString(clone), w: maxX - minX, h: maxY - minY };
  };
  $('[data-ab-export]').addEventListener('change', async (e) => {
    const s = e.target as HTMLSelectElement;
    const kind = s.value; s.value = '';
    if (!d.nodes.length) { toast('Add something first.'); return; }
    if (kind === 'json') download(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }), `${fileBase()}.json`);
    if (kind === 'svg') download(new Blob([svgText().text], { type: 'image/svg+xml' }), `${fileBase()}.svg`);
    if (kind === 'png') {
      const { text, w, h } = svgText();
      const img = new Image();
      img.onload = () => { const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2; const x = c.getContext('2d')!; x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height); x.scale(2, 2); x.drawImage(img, 0, 0); c.toBlob((b) => b && download(b, `${fileBase()}.png`)); };
      img.onerror = () => toast('PNG export failed in this browser. Try SVG.', 'bad');
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
    }
    if (kind) toast(`Exported ${kind.toUpperCase()}.`, 'ok');
  });
  $<HTMLInputElement>('[data-ab-import]').addEventListener('change', async (e) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    (e.target as HTMLInputElement).value = '';
    if (!f) return;
    try { const v = JSON.parse(await f.text()); if (!isDesign(v)) throw new Error('shape'); setDesign(v, `Imported “${v.name}”.`); } catch { toast('That file isn’t a design exported from this builder.', 'bad'); }
  });
  $('[data-ab-clear]').addEventListener('click', () => { if (!d.nodes.length || confirm('Clear the canvas? (Undo brings it back.)')) setDesign(emptyDesign(d.name), 'Canvas cleared.'); });

  /* ---------------- side panel ---------------- */
  const tabs = root.querySelectorAll<HTMLButtonElement>('[data-ab-tab]');
  function showTab(id: string) {
    tabs.forEach((t) => { const on = t.dataset.abTab === id; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    root.querySelectorAll<HTMLElement>('[data-ab-pane]').forEach((p) => { p.hidden = p.dataset.abPane !== id; });
    renderPanel();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => showTab(t.dataset.abTab!));
    t.addEventListener('keydown', (e) => { const k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!k) return; const n = tabs[(i + k + tabs.length) % tabs.length]; n.focus(); showTab(n.dataset.abTab!); });
  });
  const current = () => [...tabs].find((t) => t.getAttribute('aria-selected') === 'true')?.dataset.abTab ?? 'props';
  const learn = (slug?: string) => (slug ? ` <a class="ab-learn" href="${lessonBase}${slug}/" target="_blank" rel="noopener">Learn it ↗</a>` : '');

  function renderPanel() {
    const tab = current();
    if (tab === 'props') renderProps();
    if (tab === 'check') renderCheck();
    if (tab === 'traffic') renderTraffic();
  }
  function renderProps() {
    const el = $('[data-ab-props]');
    const n = sel ? byId(d, sel) : undefined;
    if (!n) {
      el.innerHTML = `<p class="ab-muted">Select a resource on the canvas to see and change its settings. Tap a palette button to add one (it goes into the selected box when it fits), or drag it onto the canvas.</p><ul class="ab-help"><li><b>Boxes:</b> virtual networks hold subnets; subnets hold VMs, private endpoints, gateways, Bastion and the firewall.</li><li><b>Links:</b> press 🔗 Link, then tap two resources (NSG → subnet, public IP → VM, load balancer → VMs, private endpoint → storage, DNS zone → VNet, VNet ↔ VNet for peering).</li><li><b>Keyboard:</b> Tab to a resource, arrows move it (Shift = faster), Delete removes it, Enter edits it.</li></ul>`;
      return;
    }
    const info = CATALOG[n.kind];
    const field = (f: (typeof info.fields)[number]) => {
      const v = n.props[f.key] ?? '';
      const id = `abf-${f.key}`;
      const input = f.type === 'select' ? `<select id="${id}" data-prop="${f.key}">${f.options!.map((o) => `<option${String(v) === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>` : `<input id="${id}" data-prop="${f.key}" type="${f.type}" value="${esc(v)}" autocomplete="off" spellcheck="false">`;
      return `<div class="ab-field"><label for="${id}">${esc(f.label)}</label>${input}${f.hint ? `<p class="ab-hint">${esc(f.hint)}</p>` : ''}</div>`;
    };
    const links = d.links.filter((l) => l.from === n.id || l.to === n.id);
    const options = d.nodes.filter((x) => x.id !== n.id && linkKindFor(n.kind, x.kind) && !links.some((l) => l.from === x.id || l.to === x.id));
    const rules = (n.props.rules ?? []) as NsgRule[];
    const PORTS = ['*', '22', '80', '443', '3389', '8080'];
    const nsgEditor = n.kind === 'nsg' ? `<fieldset class="ab-rules"><legend>Inbound rules</legend>${rules.length ? '' : '<p class="ab-muted">No custom rules: the defaults allow traffic from inside the VNet and from the load balancer probe, and deny everything else inbound.</p>'}${rules.map((r, i) => `<div class="ab-rule" data-rule="${i}"><input aria-label="Rule ${i + 1} name" data-r="name" value="${esc(r.name)}"><input aria-label="Rule ${i + 1} priority" data-r="priority" type="number" min="100" max="4096" value="${r.priority}"><select aria-label="Rule ${i + 1} source" data-r="source">${['Internet', 'VirtualNetwork', 'AzureLoadBalancer', 'Any'].map((o) => `<option${r.source === o ? ' selected' : ''}>${o}</option>`).join('')}</select><select aria-label="Rule ${i + 1} port" data-r="port">${PORTS.map((o) => `<option${String(r.port) === o ? ' selected' : ''}>${o}</option>`).join('')}</select><select aria-label="Rule ${i + 1} action" data-r="access">${['Allow', 'Deny'].map((o) => `<option${r.access === o ? ' selected' : ''}>${o}</option>`).join('')}</select><button type="button" class="ab-x" data-rule-del="${i}" aria-label="Remove rule ${esc(r.name)}">✕</button></div>`).join('')}<button type="button" class="btn btn-outline btn-sm" data-rule-add>+ Add rule</button><p class="ab-hint">Lower priority numbers win. Defaults: AllowVnetInBound 65000, AllowAzureLoadBalancerInBound 65001, DenyAllInBound 65500.</p></fieldset>` : '';
    el.innerHTML = `
      <div class="ab-ph"><span class="ab-pi" aria-hidden="true">${iconSvg(n.kind, 26)}</span><div><p class="ab-pt">${esc(info.label)}</p><p class="ab-muted">${esc(info.blurb)}${learn(info.lesson)}</p></div></div>
      <div class="ab-field"><label for="abf-name">Name</label><input id="abf-name" data-prop="__name" value="${esc(n.name)}" autocomplete="off" spellcheck="false"></div>
      ${n.parent ? `<p class="ab-muted">Inside <b>${esc(byId(d, n.parent)?.name)}</b>.</p>` : info.parents.length ? `<p class="ab-warnline">Not inside a ${info.parents.map((p) => CATALOG[p].label.toLowerCase()).join(' or ')} yet. Drag it into one.</p>` : ''}
      ${info.fields.map(field).join('')}
      ${nsgEditor}
      <fieldset class="ab-links"><legend>Links</legend>
        ${links.length ? `<ul>${links.map((l) => { const o = byId(d, l.from === n.id ? l.to : l.from); return `<li>${esc(LINK_LABEL[l.kind])}: <b>${esc(o?.name)}</b> <button type="button" class="ab-x" data-unlink="${l.id}" aria-label="Remove link to ${esc(o?.name)}">✕</button></li>`; }).join('')}</ul>` : '<p class="ab-muted">No links yet.</p>'}
        ${options.length ? `<div class="ab-linkadd"><label class="sr-only" for="abf-linkto">Link to</label><select id="abf-linkto">${options.map((o) => `<option value="${o.id}">${esc(CATALOG[o.kind].icon)} ${esc(o.name)} (${esc(LINK_LABEL[linkKindFor(n.kind, o.kind)!.kind])})</option>`).join('')}</select><button type="button" class="btn btn-outline btn-sm" data-linkto>Link</button></div>` : `<p class="ab-hint">${esc(hintFor(n.kind))}</p>`}
      </fieldset>
      <button type="button" class="btn btn-outline btn-sm ab-del" data-del>🗑️ Delete ${esc(n.name)}${info.container && childrenOf(d, n.id).length ? ' and what’s inside' : ''}</button>`;
  }
  $('[data-ab-props]').addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    const n = sel ? byId(d, sel) : undefined;
    if (!n) return;
    if (t.dataset.prop) {
      snapshot();
      if (t.dataset.prop === '__name') n.name = t.value.trim().replace(/\s+/g, '-').slice(0, 40) || n.name;
      else n.props[t.dataset.prop] = t.value.trim();
      changed(false);
      return;
    }
    const row = t.closest('[data-rule]') as HTMLElement | null;
    if (row && t.dataset.r) {
      snapshot();
      const r = (n.props.rules as NsgRule[])[Number(row.dataset.rule)];
      const k = t.dataset.r as keyof NsgRule;
      (r as any)[k] = k === 'priority' ? Math.max(100, Math.min(4096, Number(t.value) || 100)) : k === 'port' ? (t.value === '*' ? '*' : Number(t.value)) : t.value;
      changed(false);
    }
  });
  $('[data-ab-props]').addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const n = sel ? byId(d, sel) : undefined;
    if (!n) return;
    if (t.closest('[data-del]')) { removeNode(n.id); return; }
    const un = t.closest('[data-unlink]') as HTMLElement | null;
    if (un) { snapshot(); d.links = d.links.filter((l) => l.id !== un.dataset.unlink); changed(); toast('Link removed.'); return; }
    if (t.closest('[data-linkto]')) { const v = ($('#abf-linkto') as HTMLSelectElement).value; addLink(n.id, v); renderProps(); return; }
    if (t.closest('[data-rule-add]')) {
      snapshot();
      const rules = (n.props.rules ??= []) as NsgRule[];
      rules.push({ name: `Rule-${rules.length + 1}`, priority: 100 + rules.length * 10, source: 'Internet', port: 443, access: 'Allow' });
      changed();
      return;
    }
    const rd = t.closest('[data-rule-del]') as HTMLElement | null;
    if (rd) { snapshot(); (n.props.rules as NsgRule[]).splice(Number(rd.dataset.ruleDel), 1); changed(); }
  });

  function renderCheck() {
    const el = $('[data-ab-check]');
    if (!findings.length) { el.innerHTML = '<p class="ab-ok">✓ No problems found. Prove it on the Traffic tab.</p>'; return; }
    const s = summary(findings);
    el.innerHTML = `<p class="ab-muted">${s.error} error(s), ${s.warn} warning(s), ${s.tip} tip(s). Select one to highlight it on the canvas.</p><ol class="ab-findings">${findings.map((f, i) => `<li class="ab-f ab-f-${f.level}"><button type="button" class="ab-fbtn" data-f="${i}"><span class="ab-flv">${f.level === 'error' ? 'Error' : f.level === 'warn' ? 'Warning' : 'Tip'}</span> ${esc(f.title)}</button><p>${esc(f.detail)}</p><p class="ab-fix"><b>Fix:</b> ${esc(f.fix)}${learn(f.lesson)}</p></li>`).join('')}</ol>`;
  }
  $('[data-ab-check]').addEventListener('click', (e) => {
    const b = (e.target as Element).closest('[data-f]') as HTMLElement | null;
    if (!b) return;
    const f = findings[Number(b.dataset.f)];
    if (f.nodes[0]) { sel = f.nodes[0]; render(); focusSel(); wrap.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' }); }
  });

  function renderTraffic() {
    const el = $('[data-ab-traffic]');
    const src = sources(d), tg = targets(d);
    const prev = { from: ($('#abt-from') as HTMLSelectElement | null)?.value, to: ($('#abt-to') as HTMLSelectElement | null)?.value, port: ($('#abt-port') as HTMLSelectElement | null)?.value };
    if (!tg.length) { el.innerHTML = '<p class="ab-muted">Add a VM, load balancer, Application Gateway, storage account or database to test traffic to it.</p>'; return; }
    el.innerHTML = `<div class="ab-field"><label for="abt-from">From</label><select id="abt-from">${src.map((s) => `<option value="${s.id}"${prev.from === s.id ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>
      <div class="ab-field"><label for="abt-to">To</label><select id="abt-to">${tg.map((t) => `<option value="${t.id}"${prev.to === t.id ? ' selected' : ''}>${esc(CATALOG[t.kind].icon)} ${esc(t.name)}</option>`).join('')}</select></div>
      <div class="ab-field"><label for="abt-port">Port</label><select id="abt-port">${['80', '443', '22', '3389', '8080', '1433'].map((p) => `<option${prev.port === p ? ' selected' : ''}>${p}</option>`).join('')}</select></div>
      <button type="button" class="btn btn-accent btn-sm" data-ab-run>▶ Send traffic</button>
      <div data-ab-result></div>`;
  }
  $('[data-ab-traffic]').addEventListener('click', (e) => {
    if (!(e.target as Element).closest('[data-ab-run]')) return;
    const from = ($('#abt-from') as HTMLSelectElement).value, to = ($('#abt-to') as HTMLSelectElement).value, port = Number(($('#abt-port') as HTMLSelectElement).value);
    const r = simulate(d, from, to, port);
    trafficPath = r.path; trafficOk = r.ok;
    render();
    $('[data-ab-result]').innerHTML = `<p class="ab-verdict ${r.ok ? 'ok' : 'bad'}">${r.ok ? '✓' : '✗'} ${esc(r.verdict)}</p><ol class="ab-hops">${r.hops.map((h) => `<li class="${h.ok ? 'ok' : 'bad'}"><span aria-hidden="true">${h.ok ? '✓' : '✗'}</span> ${esc(h.text)}</li>`).join('')}</ol>`;
    say(`${r.ok ? 'Traffic got through.' : 'Traffic was blocked.'} ${r.verdict}`);
  });

  $('[data-ab-explain-run]').addEventListener('click', () => {
    const x = explain(d);
    const sec = (h: string, items: string[]) => `<h3>${h}</h3><ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
    $('[data-ab-explain]').innerHTML = sec('What you built', x.overview) + sec('How traffic flows', x.flows) + sec('Security and reliability risks', x.risks) + sec('How to improve it', x.improve);
    say('Explanation ready.');
  });

  render();
  renderPanel();
  if (saved.draft) toast('Welcome back: your last design is restored (saved in this browser).');
}

/** Fixed colours for exported diagrams (no CSS variables outside the page). */
const EXPORT_CSS = `
text{font-family:Inter,Segoe UI,system-ui,sans-serif}
.ab-bg{fill:#ffffff}.ab-vnet .ab-box{fill:#eef5fc;stroke:#0078d4;stroke-width:2}.ab-subnet .ab-box{fill:#f6f8fa;stroke:#8a99a8;stroke-dasharray:6 4}
.ab-ctitle{font-size:16px;font-weight:700;fill:#0b1020}.ab-csub{font-size:13px;fill:#4a5163}
.ab-card{fill:#ffffff;stroke:#c8d1dc}.ab-stripe{fill:#0078d4}.ab-g-security .ab-stripe{fill:#c50f1f}.ab-g-data .ab-stripe{fill:#8764b8}.ab-g-compute .ab-stripe{fill:#107c10}.ab-g-connectivity .ab-stripe{fill:#ca5010}
.ab-name{font-size:16.5px;font-weight:600;fill:#0b1020}.ab-sub{font-size:13.5px;fill:#4a5163}.ab-icobg{fill:#e8f1fb}.ab-gico{stroke:#0078d4}.ab-g-compute .ab-gico{stroke:#107c10}.ab-g-data .ab-gico{stroke:#7a4fc0}.ab-g-security .ab-gico{stroke:#c42b30}.ab-g-connectivity .ab-gico{stroke:#ca5010}
.ab-link line{stroke:#5b6b7c;stroke-width:2.5}.ab-link-peer line,.ab-link-dnslink line,.ab-link-vpn line,.ab-link-route line{stroke-dasharray:7 5}.ab-link text{font-size:13px;font-weight:700;fill:#4a5163;paint-order:stroke;stroke:#fff;stroke-width:6px}.ab-link-backend line{stroke:#107c10}.ab-link-backend text{fill:#107c10}.ab-link-nsg line{stroke:#ca5010}.ab-link-nsg text{fill:#ca5010}.ab-link-pip line{stroke:#7a4fc0}.ab-link-pip text{fill:#7a4fc0}.ab-link-peer line{stroke:#0078d4}.ab-link-peer text{fill:#0078d4}.ab-link-pe line,.ab-link-dnslink line{stroke:#00838f}.ab-link-pe text,.ab-link-dnslink text{fill:#00838f}.ab-link-vpn line{stroke:#2b4f8c}.ab-link-vpn text{fill:#2b4f8c}.ab-link-route line{stroke:#c42b30}.ab-link-route text{fill:#c42b30}.ab-arrowhead{fill:#5b6b7c}
.ab-flag-error{fill:#c50f1f}.ab-flag-warn{fill:#b35c00}.ab-flagt{font-size:12px;font-weight:700;fill:#fff}
.ab-flow{fill:none;stroke-width:5;stroke-linecap:round;opacity:.5}.ab-flow.ok{stroke:#107c10}.ab-flow.bad{stroke:#c50f1f}
.ab-foot{font-size:12px;fill:#4a5163}`;
