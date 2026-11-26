/**
 * Ask Nimbus chat logic, loaded on first use (AskBot.astro loads it when the
 * learner opens the chat, taps a [data-tutor-open] button, or another part of
 * the site sends nimbus-chat / nimbus-tutor). Keeping it out of the first page
 * load halves the JavaScript every page downloads.
 */
import { makeRanker, ask, type Ranker } from './ask';
import { canSpeak, speak, stopSpeaking, readableText } from './speech';
import type { AskIndex, AskEntry, TutorEntry, SimCard } from './ask-index';
import { load as loadProgress, streak, addXP } from './progress';
import { recordAnswers } from './review';
import { nextTask, percentDone, type CoachData, type CoachExam } from './coach';
import { hint } from './cloud/account';
import { isSupporter } from './monetization/supporter';
import { miniSvg, currentSkin } from './nimbus-skins';

let mounted = false;
export function mountChat() {
  if (mounted) return;
  mounted = true;

  type Exam = { slug: string; code: string; name: string };
  const root = document.getElementById('ask')!;
  const exams: Exam[] = JSON.parse(root.dataset.exams || '[]');
  const here = root.dataset.here || '';
  const fab = document.getElementById('ask-fab') as HTMLButtonElement;
  const panel = document.getElementById('ask-panel')!;
  const log = document.getElementById('ask-log')!;
  const form = document.getElementById('ask-form') as HTMLFormElement;
  const input = document.getElementById('ask-q') as HTMLInputElement;
  const send = form.querySelector('button') as HTMLButtonElement;
  const examChip = document.getElementById('ask-exam')!;
  const switchBtn = document.getElementById('ask-switch') as HTMLButtonElement;
  const KEY = 'msdb-ask-exam';
  // Below this the best match is usually off-topic (tuned on real and junk questions).
  const MIN_SCORE = 12;
  // On a lesson, links open in a new tab so the learner never loses their place.
  const newTab = !!document.querySelector('.lesson-updated');

  const loaded = new Map<string, { idx: AskIndex; r: Ranker }>();
  let current: { idx: AskIndex; r: Ranker } | null = null;
  let started = false;

  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = '') => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  };
  const link = (text: string, href: string, cls = 'ask-link') => {
    const a = el('a', cls, text);
    a.href = href;
    if (newTab) { a.target = '_blank'; a.rel = 'noopener'; }
    return a;
  };
  const scrollDown = () => requestAnimationFrame(() => (log.scrollTop = log.scrollHeight));

  /* ---------- Nimbus in the header: mood follows the chat ---------- */
  type Mood = 'idle' | 'wave' | 'think' | 'talk' | 'cheer' | 'listen';
  const headBot = panel.querySelector<SVGElement>('.ask-ava .nb');
  const status = document.getElementById('ask-status')!;
  let rest: Mood = 'wave', restLabel = 'Your study buddy';
  const setMood = (m: Mood) => { if (headBot) headBot.dataset.mood = m; };
  const sub = status.parentElement!;
  const setState = (st: 'ok' | 'busy' | 'off') => { sub.dataset.state = st; };
  const setRest = (m: Mood, label = 'Your study buddy', st: 'ok' | 'busy' | 'off' = 'ok') => { rest = m; restLabel = label; restState = st; setMood(m); status.textContent = label; setState(st); };
  const settle = () => { setMood(rest); status.textContent = restLabel; setState(restState); };
  let restState: 'ok' | 'busy' | 'off' = 'ok';
  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Tiny static Nimbus beside its messages wears the learner's chosen character (nimbus-skins.ts).
  addEventListener('nimbus-skin', () => log.querySelectorAll('.ask-ava-s').forEach((a) => (a.innerHTML = miniSvg(currentSkin(), 26))));
  // Listening: Nimbus tilts its head while the learner types.
  let listenT = 0;
  const listening = () => { setMood('listen'); clearTimeout(listenT); listenT = window.setTimeout(settle, 1400); };
  input.addEventListener('focus', listening);
  input.addEventListener('input', listening);
  // Bot replies go into the page at once (screen readers and QA read them straight away); a short "typing" bubble
  // hides them visually for a moment, one after another.
  let free = 0, settleT = 0;
  const say = (node: Node, who: 'bot' | 'me' = 'bot') => {
    const b = el('div', `ask-msg ask-${who}`);
    b.append(node);
    if (who === 'me') { log.append(b); scrollDown(); return b; }
    const r = el('div', 'ask-row');
    if (log.lastElementChild?.classList.contains('ask-row')) r.classList.add('is-cont');
    const a = el('span', 'ask-ava-s');
    a.innerHTML = miniSvg(currentSkin(), 26);
    r.append(a, b);
    log.append(r);
    if (!calm()) {
      const now = performance.now();
      const at = Math.max(now, free) + 420;
      free = at;
      b.classList.add('is-typing');
      setMood('talk');
      status.textContent = 'Typing…';
      setState('busy');
      setTimeout(() => {
        b.classList.remove('is-typing');
        scrollDown();
        if (performance.now() >= free - 5) { clearTimeout(settleT); settleT = window.setTimeout(settle, 700); }
      }, at - now);
    }
    scrollDown();
    return b;
  };
  const text = (s: string) => el('p', '', s);
  /** A friendly line that fits the time of day. */
  const greet = () => {
    const h = new Date().getHours();
    return h >= 22 || h < 5 ? 'Studying late? Short sessions stick better, so let’s keep this one light. 🌙'
      : h < 12 ? 'Good morning. A few minutes now is a great start to the day. ☀️'
      : h < 17 ? 'Good afternoon.' : 'Good evening.';
  };
  /** "Good evening, Priya" when signed in, "Good evening" when not. */
  const firstName = () => (hint()?.name || '').trim().split(/\s+/)[0] || '';
  const hello = () => {
    const h = new Date().getHours();
    const n = firstName();
    if (h >= 22 || h < 5) return n ? `Studying late, ${n}?` : 'Studying late?';
    const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    return n ? `${part}, ${n}` : part;
  };
  let currentSlug = '';
  let coachP: Promise<CoachData | null> | null = null;
  const coachData = () => (coachP ??= fetch('/coach.json').then((r) => (r.ok ? r.json() : null)).catch(() => { coachP = null; return null; }));
  /** 🔊 Listen: reads one answer aloud with the browser's own voice (nothing leaves the device). */
  let speaking: HTMLButtonElement | null = null;
  const listen = (target: () => Element | null) => {
    const b = el('button', 'ask-listen', '🔊 Listen');
    b.type = 'button';
    b.setAttribute('aria-label', 'Read this answer aloud');
    if (!canSpeak()) b.hidden = true;
    b.addEventListener('click', async () => {
      if (speaking) { stopSpeaking(); const was = speaking; speaking.textContent = '🔊 Listen'; speaking = null; if (was === b) return; }
      const t = target();
      if (!t) return;
      speaking = b;
      b.textContent = '⏹ Stop';
      setMood('talk');
      try { await speak(readableText(t).replace(/🔊 Listen|⏹ Stop/g, '')); } finally { if (speaking === b) { b.textContent = '🔊 Listen'; speaking = null; } settle(); }
    });
    return b;
  };
  const chips = (items: { label: string; on: () => void }[]) => {
    const w = el('div', 'ask-chips');
    for (const it of items) {
      const c = el('button', 'ask-chip', it.label);
      c.type = 'button';
      c.addEventListener('click', it.on);
      w.append(c);
    }
    return w;
  };
  const short = (s: string, max = 460) => {
    if (s.length <= max) return s;
    const cut = s.slice(0, max);
    const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '));
    return (end > 200 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, '')) + ' …';
  };

  function lockInput(on: boolean, placeholder: string) {
    input.disabled = send.disabled = on;
    input.placeholder = placeholder;
  }

  function pickExam() {
    current = null;
    examChip.textContent = '';
    switchBtn.hidden = true;
    lockInput(true, 'Pick an exam first');
    setRest('wave');
    const f = document.createDocumentFragment();
    f.append(el('p', 'ask-strong', 'Hi, I’m Nimbus 👋'));
    f.append(el('p', 'ask-more', greet()));
    f.append(text('I answer from this site’s lessons and show you each idea in 3D first. Which exam are you studying for?'));
    const g = el('div', 'ask-exams');
    for (const e of exams) {
      const c = el('button', 'ask-examcard');
      c.type = 'button';
      c.append(el('strong', '', e.code), el('span', '', e.name));
      c.addEventListener('click', () => { say(text(e.code), 'me'); choose(e.slug); });
      g.append(c);
    }
    f.append(g);
    say(f);
  }

  async function choose(slug: string) {
    const exam = exams.find((e) => e.slug === slug);
    if (!exam) return pickExam();
    try { localStorage.setItem(KEY, slug); } catch {}
    examChip.textContent = exam.code;
    switchBtn.hidden = exams.length < 2;
    lockInput(true, 'Loading answers…');
    setRest('think', 'Thinking…', 'busy');
    try {
      if (!loaded.has(slug)) {
        const res = await fetch(`/${slug}/ask-index.json`);
        if (!res.ok) throw new Error(String(res.status));
        const idx: AskIndex = await res.json();
        loaded.set(slug, { idx, r: makeRanker(idx.entries) });
      }
    } catch {
      lockInput(true, 'Waiting for a connection…');
      setRest('think', 'Offline', 'off');
      const f = document.createDocumentFragment();
      f.append(el('p', 'ask-strong', 'I can’t reach my notes right now.'));
      f.append(text(navigator.onLine ? 'The answers didn’t load. It usually works on a second try.' : 'You look offline. I’ll try again as soon as you’re back.'));
      const again = () => { loaded.delete(slug); choose(slug); };
      f.append(chips([{ label: '↻ Try again', on: again }, ...(exams.length > 1 ? [{ label: 'Pick another exam', on: pickExam }] : [])]));
      say(f);
      addEventListener('online', again, { once: true });
      return;
    }
    current = loaded.get(slug)!;
    lockInput(false, `Ask about ${exam.code}…`);
    setRest('idle', 'Online');
    currentSlug = slug;
    const lesson = current.idx.tutor?.[location.pathname];
    const ce = (await coachData())?.exams.find((x: CoachExam) => x.slug === slug);
    const party = ce ? celebrate(exam, ce) : null;
    if (lesson && slug === here) tutorHello(lesson, location.pathname);
    else home(exam, ce);
    if (party) requestAnimationFrame(() => requestAnimationFrame(() => (log.scrollTop = party.offsetTop - log.offsetTop - 8)));
    if (!matchMedia('(pointer: coarse)').matches) input.focus();
  }

  /* ---------- home: personal welcome, progress, today's step and four actions ---------- */
  const RING = (pct: number) => `<svg width="62" height="62" viewBox="0 0 62 62" aria-hidden="true" focusable="false"><circle cx="31" cy="31" r="26" fill="none" stroke="var(--ring-track)" stroke-width="7"/><circle cx="31" cy="31" r="26" fill="none" stroke="url(#ask-ring-g)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(163.4 * pct) / 100} 163.4" transform="rotate(-90 31 31)"/><defs><linearGradient id="ask-ring-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0078d4"/><stop offset="1" stop-color="#62e6ff"/></linearGradient></defs></svg>`;
  function tile(icon: string, title: string, note: string, act: (() => void) | string, cls = '') {
    const t = typeof act === 'string' ? link('', act, `ask-tile ${cls}`) : el('button', `ask-tile ${cls}`);
    if (t instanceof HTMLButtonElement) { t.type = 'button'; t.addEventListener('click', act as () => void); }
    const i = el('span', 'ask-tile-i');
    i.innerHTML = icon;
    t.append(i, el('b', '', title), el('span', 'ask-tile-n', note));
    return t;
  }
  const ICON = {
    ask: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    quiz: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5V14M12 17.5v.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    plan: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
    cube: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    sheet: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 11h7M9 15h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  };
  function home(exam: Exam, ce?: CoachExam) {
    const card = el('div', 'ask-home');
    const top = el('div', 'ask-home-top');
    const words = el('div', 'ask-home-w');
    words.append(el('p', 'ask-hello', hello()));
    let next: ReturnType<typeof nextTask> | null = null;
    if (ce && ce.lessons.length) {
      const p = loadProgress();
      const pct = percentDone(ce, p);
      const st = streak(p);
      const left = ce.lessons.filter((l: { key: string }) => !p.done[l.key]).length;
      next = nextTask(ce, p);
      const ring = el('div', 'ask-ring');
      ring.innerHTML = RING(pct);
      ring.append(el('span', '', `${pct}%`));
      ring.setAttribute('role', 'img');
      ring.setAttribute('aria-label', `${pct}% of ${exam.code} lessons done`);
      top.append(ring);
      words.append(el('p', 'ask-home-sub', `${st > 1 ? `Day ${st} in a row. ` : ''}${left ? `${left} ${exam.code} lesson${left === 1 ? '' : 's'} to go.` : `Every ${exam.code} lesson done. Time for mock exams.`}`));
    } else {
      words.append(el('p', 'ask-home-sub', `${exam.code}: ask me anything. I’ll show it in 3D first.`));
    }
    top.append(words);
    card.append(top);
    const meet = el('button', 'ask-meet', '✨ Meet my Nimbus');
    meet.type = 'button';
    meet.setAttribute('data-nimbus-meet', '');
    card.prepend(meet);
    if (next) {
      const n = el('p', 'ask-next');
      n.append(el('span', 'ask-next-l', next.kind === 'lesson' ? 'Next' : 'Today'), `${next.title}${next.minutes ? ` · ${next.minutes} min` : ''}`);
      card.append(n);
      const go = link(next.kind === 'lesson' ? 'Continue lesson' : 'Open', next.url, 'ask-cta');
      const q = el('button', 'ask-cta ask-cta-2', 'Quiz me');
      q.type = 'button';
      q.addEventListener('click', () => quizReal());
      card.append(row(go, q));
    }
    const d3 = next?.kind === 'lesson' && simsFor(next.url)?.d3;
    const tiles = el('div', 'ask-tiles');
    tiles.append(
      tile(ICON.ask, 'Ask a question', 'Answers from your lessons', () => input.focus()),
      tile(ICON.quiz, 'Quiz me', 'One question, right now', () => quizReal(), 'is-gold'),
    );
    const plan = tile(ICON.plan, 'My plan', 'Date, reminders, today', () => {});
    plan.setAttribute('data-coach-open', '');
    tiles.append(plan, d3 ? tile(ICON.cube, 'Show me in 3D', 'Spin today’s topic', `${next!.url}#sim-3d`) : tile(ICON.sheet, 'Cheat sheet', 'Last-minute revision', `/${exam.slug}/cheat-sheet/`));
    card.append(tiles);
    const f = document.createDocumentFragment();
    f.append(card);
    if (!firstName() && document.querySelector('[data-account-signin]')) {
      const si = el('button', 'ask-signin', 'Sign in to keep progress on every device');
      si.type = 'button';
      si.setAttribute('data-account-signin', '');
      f.append(si);
    }
    f.append(el('p', 'ask-more', 'Or try one of these:'));
    f.append(chips(current!.idx.suggest.map((q) => ({ label: `💡 ${q}`, on: () => question(q) }))));
    say(f);
  }

  /* ---------- Quiz me: one original practice question, recorded like every other quiz ---------- */
  type QuizQ = { id: string; s?: string; q: string; o: string[]; a: number; e: string; t?: string };
  const quizPools = new Map<string, Promise<QuizQ[] | null>>();
  const poolFor = (slug: string) => {
    if (!quizPools.has(slug)) quizPools.set(slug, fetch(`/${slug}/quiz.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null).then((v) => { if (!v) quizPools.delete(slug); return v; }));
    return quizPools.get(slug)!;
  };
  const askedQ = new Set<string>();
  async function quizReal() {
    if (!current || !currentSlug) return;
    say(text('Quiz me'), 'me');
    const pool = await poolFor(currentSlug);
    if (!pool?.length) { say(text('I couldn’t load a question just now. Try again in a moment.')); return; }
    const topic = location.pathname.split('/')[3] || '';
    let cands = pool.filter((q) => !askedQ.has(q.id) && (!topic || q.t === topic));
    if (!cands.length) cands = pool.filter((q) => !askedQ.has(q.id));
    if (!cands.length) { askedQ.clear(); cands = pool; }
    const q = cands[Math.floor(Math.random() * cands.length)];
    askedQ.add(q.id);
    const f = document.createDocumentFragment();
    f.append(el('p', 'ask-kicker', `❓ Quick quiz · ${current.idx.exam.code}`));
    if (q.s) f.append(el('p', 'ask-more', q.s));
    f.append(el('p', 'ask-strong', q.q));
    const opts = el('div', 'ask-opts');
    const out = el('div', 'ask-fb');
    q.o.forEach((o, i) => {
      const b = el('button', 'ask-opt');
      b.type = 'button';
      b.append(el('span', 'ask-opt-l', 'ABCDEF'[i]), el('span', '', o));
      b.addEventListener('click', () => {
        const ok = i === q.a;
        opts.querySelectorAll('button').forEach((x, j) => { x.disabled = true; if (j === q.a) x.classList.add('is-right'); });
        if (!ok) b.classList.add('is-wrong');
        recordAnswers(currentSlug, [{ id: q.id, ok }]);
        if (ok) addXP(5, 'Quick quiz');
        setMood(ok ? 'cheer' : 'wave');
        clearTimeout(settleT);
        settleT = window.setTimeout(settle, 1800);
        out.className = `ask-fb ${ok ? 'is-ok' : 'is-no'}`;
        out.append(el('p', 'ask-strong', ok ? 'Spot on. +5 XP' : `Not quite. The answer is ${'ABCDEF'[q.a]}. Good try, this one catches a lot of people.`), text(short(q.e, 520)));
        out.append(chips([{ label: 'Next question', on: () => quizReal() }, { label: 'Ask something else', on: () => input.focus() }]));
        requestAnimationFrame(() => out.scrollIntoView({ block: 'nearest' }));
      }, { once: true });
      opts.append(b);
    });
    f.append(opts, out);
    say(f);
  }

  /* ---------- milestones: celebrate, share on LinkedIn, maybe a coffee ---------- */
  const MS = 'msdb-milestones-v1';
  const PROMPTS = 'msdb-prompts-v1';
  const readJ = (k: string) => { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch { return {}; } };
  const writeJ = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* blocked */ } };
  function celebrate(exam: Exam, ce: CoachExam): HTMLElement | null {
    const p = loadProgress();
    const seen = readJ(MS) as Record<string, string>;
    const byMod = (slug: string) => ce.lessons.filter((l) => l.key.split('/')[1] === slug);
    const done = (ce.modules ?? []).filter((m) => { const ls = byMod(m.slug); return ls.length > 0 && ls.every((l) => p.done[l.key]); });
    const all = ce.lessons.length > 0 && ce.lessons.every((l) => p.done[l.key]);
    const fresh = done.filter((m) => !seen[`${exam.slug}/${m.slug}`]);
    const freshAll = all && !seen[`${exam.slug}/*`];
    if (!fresh.length && !freshAll) return null;
    const t = new Date().toISOString().slice(0, 10);
    for (const m of done) seen[`${exam.slug}/${m.slug}`] ??= t;
    if (all) seen[`${exam.slug}/*`] ??= t;
    writeJ(MS, seen);
    const mod = freshAll ? null : fresh[fresh.length - 1];
    const what = mod ? mod.title : `every ${exam.code} lesson`;
    const lessons = mod ? byMod(mod.slug) : ce.lessons;
    const qs = lessons.map((l) => p.quizzes[l.key]).filter(Boolean);
    const avg = qs.length ? Math.round((qs.reduce((s, q) => s + q.score / q.total, 0) / qs.length) * 100) : null;
    const n = firstName();

    setRest('cheer', 'Online');
    const f = document.createDocumentFragment();
    const hero = el('div', 'ask-party');
    hero.append(el('p', 'ask-party-t', `${n ? `${n}, you` : 'You'} finished ${what} 🎉`), el('p', 'ask-party-s', `${lessons.length} lessons${avg !== null ? ` · ${avg}% average on quizzes` : ''} · ${p.xp} XP`));
    f.append(hero);

    const site = root.dataset.site || location.origin;
    const shareUrl = `${site}/${exam.slug}/`;
    const share = el('div', 'ask-share');
    share.append(el('p', 'ask-strong', 'Share your win on LinkedIn'), el('p', 'ask-more', 'Recruiters notice steady progress. Edit the post if you like.'));
    const ta = el('textarea', 'ask-post');
    ta.id = `ask-post-${exam.slug}`;
    ta.rows = 4;
    ta.value = `I just finished ${what} for Microsoft ${exam.code} on MSDEVBUILD. Free lessons with 3D views and portal simulations: ${shareUrl}`;
    const lab = el('label', 'sr-only', 'LinkedIn post');
    lab.htmlFor = ta.id;
    const go = el('a', 'ask-cta ask-li', 'Copy post and open LinkedIn');
    go.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    go.target = '_blank';
    go.rel = 'noopener';
    const note = el('p', 'ask-more', '');
    note.setAttribute('role', 'status');
    go.addEventListener('click', () => { navigator.clipboard?.writeText(ta.value).then(() => { note.textContent = 'Post copied. Paste it into LinkedIn.'; }, () => {}); });
    share.append(lab, ta, go, note);
    f.append(share);

    // Coffee: at most once a week, shared with the share/coffee card's clock, never for supporters.
    const pr = readJ(PROMPTS) as { coffee?: number; last?: string; lastAt?: number };
    if (!isSupporter() && Date.now() - (pr.coffee ?? 0) >= 7 * 86_400_000 && root.dataset.coffee) {
      writeJ(PROMPTS, { ...pr, coffee: Date.now(), last: 'coffee', lastAt: Date.now() });
      const cof = el('div', 'ask-coffee');
      cof.append(el('p', 'ask-strong', '☕ Enjoying Nimbus?'), text('Every lesson here is free. A coffee helps keep it that way, and helps students who can’t afford courses.'));
      const buy = el('a', 'ask-cta ask-buy', 'Buy me a coffee');
      buy.href = root.dataset.coffee;
      buy.target = '_blank';
      buy.rel = 'noopener';
      const later = el('button', 'ask-cta ask-cta-2', 'Maybe later');
      later.type = 'button';
      later.addEventListener('click', () => cof.replaceChildren(el('p', 'ask-more', 'No problem. I won’t ask again this week.')));
      cof.append(row(buy, later));
      f.append(cof);
    }
    const b = say(f);
    window.setTimeout(() => setRest('idle', 'Online'), 4000);
    return b.closest('.ask-row') as HTMLElement;
  }

  /* ---------- simulations first: 3D, then the Azure portal, then the text ---------- */
  const simsFor = (url?: string): SimCard | undefined => (url ? current?.idx.sims?.[url] : undefined);
  const hasSims = (c?: SimCard) => !!c && !!(c.d3 || c.portal || c.labs.length);
  const head = (s: string) => el('p', 'ask-head2', s);
  /** Opens a simulation tab: in place when the learner is on that lesson, otherwise the lesson at that tab. */
  function simJump(url: string, hash: string, label: string) {
    const onLesson = location.pathname === url && !!document.getElementById('simulations');
    if (!onLesson) return link(label, `${url}${hash}`, 'ask-chip ask-go');
    const b = el('button', 'ask-chip ask-go', label);
    b.type = 'button';
    b.addEventListener('click', () => {
      // LessonSimulations listens for hashchange; replaceState + a synchronous event keeps the back button clean.
      history.replaceState(history.state, '', hash);
      dispatchEvent(new HashChangeEvent('hashchange'));
      if (matchMedia('(max-width: 640px)').matches) close();
    });
    return b;
  }
  const row = (...nodes: Node[]) => { const w = el('div', 'ask-chips'); w.append(...nodes); return w; };

  function show3d(url: string, c: SimCard) { const n = node3d(url, c); if (n) say(n); }
  function showPortal(url: string, c: SimCard) { const n = nodePortal(url, c); if (n) say(n); }
  function node3d(url: string, c: SimCard) {
    if (!c.d3) return null;
    const f = document.createDocumentFragment();
    f.append(head('🧊 1 · See it in 3D'));
    f.append(el('p', 'ask-strong', c.d3.step));
    f.append(text(c.d3.intro));
    f.append(el('p', 'ask-more', short(c.d3.text, 260)));
    f.append(row(simJump(url, '#sim-3d', '▶ Open the 3D view')));
    return f;
  }
  function nodePortal(url: string, c: SimCard) {
    if (!c.portal && !c.labs.length) return null;
    const f = document.createDocumentFragment();
    if (c.portal) {
      f.append(head(`🖥️ ${c.d3 ? 2 : 1} · Do it in ${current?.idx.simNoun ?? 'the Azure portal'}`));
      f.append(el('p', 'ask-strong', c.portal.title));
      f.append(text(c.portal.intro));
      const ol = el('ol', 'ask-list ask-steps');
      for (const st of c.portal.steps.slice(0, 4)) ol.append(el('li', '', short(st, 160)));
      f.append(ol);
      f.append(row(simJump(url, '#sim-portal', /portal/.test(current?.idx.simNoun ?? 'portal') ? '▶ Start the portal walkthrough' : '▶ Start the walkthrough')));
    }
    if (c.labs.length) {
      f.append(el('p', 'ask-more', '🧪 Then try it yourself, no account needed:'));
      f.append(row(...c.labs.map((l) => simJump(url, `#sim-lab-${l.id}`, `${l.icon} ${l.title} · ${l.tasks} tasks · ${l.minutes} min`))));
    }
    return f;
  }

  function answer(e: AskEntry, others: AskEntry[]) {
    const url = e.l;
    const card = simsFor(url);
    const visual = hasSims(card);
    const f = document.createDocumentFragment();
    if (visual) f.append(head(`📖 ${(card!.d3 ? 1 : 0) + (card!.portal ? 1 : 0) + 1} · The explanation`));
    f.append(text(short(e.a)));
    const src = el('p', 'ask-src');
    src.append(`${e.k} · ${e.t} · `, link(e.k === 'Glossary' ? 'See in glossary' : e.k === 'Comparison' ? 'Open comparison' : 'Open lesson', e.u));
    const answerP = f.lastChild as Element;
    src.append(' ', listen(() => answerP));
    f.append(src);
    const t = url ? current?.idx.tutor?.[url] : undefined;
    if (t) {
      f.append(el('p', 'ask-more', 'Want more on this?'));
      f.append(tutorChips(t, url!, true));
    }
    if (others.length) {
      f.append(el('p', 'ask-more', 'Related:'));
      f.append(chips(others.map((o) => ({ label: o.q, on: () => { const m = say(text(o.q), 'me'); answer(o, []); requestAnimationFrame(() => requestAnimationFrame(() => (log.scrollTop = m.offsetTop - log.offsetTop - 8))); } }))));
    }
    if (!visual) { say(f); return; }
    say(story(url!, card!, f, t));
  }

  /* ---------- Answer Story: See it → Try it → Get it → Check, one step at a time ---------- */
  let storyN = 0;
  function story(url: string, c: SimCard, explain: DocumentFragment, t?: TutorEntry) {
    const id = `ask-story-${++storyN}`;
    const steps: { label: string; body: Node }[] = [];
    const d3 = node3d(url, c);
    if (d3) steps.push({ label: 'See it', body: d3 });
    const pt = nodePortal(url, c);
    if (pt) steps.push({ label: 'Try it', body: pt });
    steps.push({ label: 'Get it', body: explain });
    const q = t?.quiz.length ? t.quiz[quizAt++ % t.quiz.length] : null;
    if (q) {
      const chk = document.createDocumentFragment();
      chk.append(el('p', 'ask-kicker', '✅ Check yourself'), el('p', 'ask-strong', q.q), el('p', 'ask-more', 'Say your answer in your head, then check.'));
      const reveal = el('div');
      chk.append(chips([{ label: 'Show the answer', on: () => { if (!reveal.childNodes.length) reveal.append(text(q.a)); } }]), reveal);
      steps.push({ label: 'Check', body: chk });
    }
    const wrap = el('div', 'ask-story');
    const tabs = el('div', 'ask-tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Answer steps');
    const panels: HTMLElement[] = [];
    const btns: HTMLButtonElement[] = [];
    const back = el('button', 'ask-cta ask-cta-2', 'Back');
    const fwd = el('button', 'ask-cta', '');
    back.type = fwd.type = 'button';
    let at = 0;
    const go = (i: number) => {
      at = Math.max(0, Math.min(steps.length - 1, i));
      panels.forEach((p, j) => (p.hidden = j !== at));
      btns.forEach((b, j) => { b.setAttribute('aria-selected', String(j === at)); b.tabIndex = j === at ? 0 : -1; b.classList.toggle('ask-tab-done', j < at); });
      back.disabled = at === 0;
      fwd.textContent = at === steps.length - 1 ? 'Done' : `Next: ${steps[at + 1].label}`;
    };
    steps.forEach((s, i) => {
      const b = el('button', 'ask-tab');
      b.type = 'button';
      b.id = `${id}-t${i}`;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', `${id}-p${i}`);
      b.append(el('span', 'ask-tab-bar'), el('span', '', s.label));
      b.addEventListener('click', () => go(i));
      b.addEventListener('keydown', (ev) => { if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') { go(at + (ev.key === 'ArrowRight' ? 1 : -1)); btns[at].focus(); } });
      btns.push(b);
      tabs.append(b);
      const p = el('div', 'ask-panel-step');
      p.id = `${id}-p${i}`;
      p.setAttribute('role', 'tabpanel');
      p.setAttribute('aria-labelledby', b.id);
      p.append(s.body);
      panels.push(p);
    });
    back.addEventListener('click', () => go(at - 1));
    fwd.addEventListener('click', () => { if (at === steps.length - 1) input.focus(); else go(at + 1); });
    const helped = el('div', 'ask-helped');
    const ask2 = el('span', '', 'Was this helpful?');
    const yes = el('button', 'ask-thumb', '👍');
    const no = el('button', 'ask-thumb', '👎');
    yes.type = no.type = 'button';
    yes.setAttribute('aria-label', 'Yes, this helped');
    no.setAttribute('aria-label', 'No, not really');
    yes.addEventListener('click', () => { helped.replaceChildren(el('span', '', 'Thanks. I’ll keep explaining it this way.')); setMood('cheer'); clearTimeout(settleT); settleT = window.setTimeout(settle, 1500); });
    no.addEventListener('click', () => { helped.replaceChildren(el('span', '', 'Thanks for telling me. Try it another way:')); if (t) helped.append(tutorChips(t, url, true)); });
    helped.append(ask2, yes, no);
    wrap.append(tabs, ...panels, row(back, fwd), helped);
    go(0);
    return wrap;
  }

  /* ---------- lesson tutor ---------- */
  let quizAt = 0, deepAt = 0;
  const list = (items: string[]) => { const ul = el('ul', 'ask-list'); for (const i of items) ul.append(el('li', '', i)); return ul; };
  function tutorChips(t: TutorEntry, url: string, compact = false) {
    const c = simsFor(url);
    const opts = [
      c?.d3 && { label: '🧊 Show me in 3D', on: () => { say(text('Show me in 3D'), 'me'); show3d(url, c); say(tutorMore(t, url)); } },
      c?.portal && { label: /portal/.test(current?.idx.simNoun ?? 'portal') ? '🖥️ Walk me through the portal' : '💻 Walk me through it', on: () => { say(text('Walk me through it'), 'me'); showPortal(url, { ...c, labs: [] }); say(tutorMore(t, url)); } },
      c?.labs.length && { label: '🧪 Let me try a lab', on: () => { say(text('Let me try a lab'), 'me'); showPortal(url, { ...c, portal: undefined }); say(tutorMore(t, url)); } },
      t.simple && { label: '🧒 Explain it simpler', on: () => tutorSay(t, url, 'Explain it simpler', [text(short(t.simple, 700))]) },
      t.example && !compact && { label: '🏢 Show me a real example', on: () => tutorSay(t, url, 'Show me a real example', [text(short(t.example, 700))]) },
      t.traps.length && { label: '🎯 What are the exam traps?', on: () => tutorSay(t, url, 'What are the exam traps?', [list(t.traps.slice(0, 5))]) },
      t.deeper.length && !compact && { label: '🔬 Go deeper', on: () => { const d = t.deeper[deepAt++ % t.deeper.length]; tutorSay(t, url, 'Go deeper', [el('p', 'ask-strong', d.q), text(short(d.a, 700))]); } },
      t.quiz.length && { label: '❓ Quiz me', on: () => quizMe(t, url) },
      t.terms.length && !compact && { label: '📖 Key terms', on: () => tutorSay(t, url, 'Key terms', [list(t.terms.slice(0, 6).map((k) => `${k.term}: ${k.def}`))]) },
    ].filter((o) => o && !(compact && /3D|portal|lab/.test(o.label))) as { label: string; on: () => void }[];
    return chips(opts);
  }
  function tutorMore(t: TutorEntry, url: string) {
    const f = document.createDocumentFragment();
    f.append(el('p', 'ask-more', 'Try another way:'));
    f.append(tutorChips(t, url));
    return f;
  }
  function tutorHello(t: TutorEntry, url: string) {
    const f = document.createDocumentFragment();
    f.append(el('p', 'ask-hello ask-hello-sm', hello()));
    f.append(text(`I’m your tutor for “${t.t}”. See it in 3D, click through it in ${current?.idx.simNoun ?? 'the Azure portal'}, try a lab, or pick another way to explain it. You can also type any question.`));
    f.append(tutorChips(t, url));
    say(f);
    input.focus();
  }
  function tutorSay(t: TutorEntry, url: string, ask: string, nodes: Node[]) {
    say(text(ask), 'me');
    const f = document.createDocumentFragment();
    const box = el('div');
    box.append(...nodes);
    f.append(box, listen(() => box));
    f.append(tutorMore(t, url));
    say(f);
  }
  function quizMe(t: TutorEntry, url: string) {
    const q = t.quiz[quizAt++ % t.quiz.length];
    say(text('Quiz me'), 'me');
    const f = document.createDocumentFragment();
    f.append(el('p', 'ask-strong', q.q));
    f.append(el('p', 'ask-more', 'Say your answer in your head, then check.'));
    f.append(chips([{ label: 'Show the answer', on: () => tutorSay(t, url, 'Show the answer', [text(q.a)]) }, { label: 'Skip, next question', on: () => quizMe(t, url) }]));
    say(f);
  }

  function question(q: string) {
    if (!current) return;
    const mine = say(text(q), 'me');
    const all = ask(current.r, q, 3);
    const hits = all.filter((h, i) => i === 0 || h.score >= Math.max(MIN_SCORE, all[0].score * 0.45));
    if (!hits.length || hits[0].score < MIN_SCORE) {
      rest = 'think';
      const f = document.createDocumentFragment();
      f.append(text(`I couldn’t find that in the ${current.idx.exam.code} lessons. Try other words, like the service name, or look here:`));
      const w = el('div', 'ask-chips');
      for (const l of current.idx.links) w.append(link(l.label, l.url, 'ask-chip'));
      f.append(w);
      say(f);
      return;
    }
    rest = 'idle';
    const top = hits[0].e;
    // Its own 3D, portal and lab cards already show above, so don't repeat them as related.
    const sim = /^(3D View|Azure Portal|Practice Lab)$/;
    answer(top, hits.slice(1).map((h) => h.e).filter((o) => !(o.l && o.l === top.l && sim.test(o.k))));
    // Land on the start of the answer (the 3D card), not the bottom of the text.
    requestAnimationFrame(() => requestAnimationFrame(() => (log.scrollTop = mine.offsetTop - log.offsetTop - 8)));
  }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    question(q);
  });

  function open() {
    panel.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
    root.classList.add('is-open');
    if (!started) {
      started = true;
      let saved = '';
      try { saved = localStorage.getItem(KEY) || ''; } catch {}
      const slug = here || (exams.some((e) => e.slug === saved) ? saved : '');
      if (slug) choose(slug);
      else pickExam();
    } else if (!input.disabled) input.focus();
  }
  function close() {
    if (speaking) { stopSpeaking(); speaking.textContent = '🔊 Listen'; speaking = null; }
    panel.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
    root.classList.remove('is-open');
    fab.focus();
  }
  fab.addEventListener('click', () => (panel.hidden ? open() : close()));

  /* ---------- requests from Meet My Nimbus and the lesson reader (no AI: lesson content only) ---------- */
  const ready = async () => { for (let i = 0; i < 50 && !current; i++) await new Promise((r) => setTimeout(r, 100)); return !!current; };
  addEventListener('nimbus-chat', async (e) => {
    const d = (e as CustomEvent).detail ?? {};
    open();
    if (!(await ready())) return;
    if (d.quiz) quizReal();
    if (d.say) say(text(d.say));
  });
  addEventListener('nimbus-tutor', async (e) => {
    const action = (e as CustomEvent).detail?.action as string;
    open();
    if (!(await ready())) return;
    const url = location.pathname;
    const t = current!.idx.tutor?.[url];
    if (!t) { if (action === 'quiz') quizReal(); return; }
    if (action === 'simple' && t.simple) tutorSay(t, url, 'Explain it simply', [text(short(t.simple, 700))]);
    else if (action === 'story' && t.example) tutorSay(t, url, 'Tell me a story about this', [text(short(t.example, 800))]);
    else if (action === 'quiz') (t.quiz.length ? quizMe(t, url) : quizReal());
    else tutorHello(t, url);
  });
  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest?.('[data-tutor-open]')) return;
    const wasStarted = started;
    open();
    // Already chatting: put the lesson tutor options back at the bottom.
    const lesson = current?.idx.tutor?.[location.pathname];
    if (wasStarted && lesson) tutorHello(lesson, location.pathname);
  });
  document.getElementById('ask-close')!.addEventListener('click', close);
  switchBtn.addEventListener('click', pickExam);
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}
