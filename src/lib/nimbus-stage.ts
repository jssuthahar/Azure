/**
 * "Meet my Nimbus!" logic (see NimbusStage.astro), loaded on the first tap of
 * a [data-nimbus-meet] button.
 */
import { SKINS, setSkin, currentSkin, skinName, miniSvg, type SkinId } from './nimbus-skins';
import { canSpeak, speak, stopSpeaking } from './speech';
import { hint } from './cloud/account';
import { loadCoach } from './coach';

let mounted = false;
export function mountStage() {
  if (mounted) return;
  mounted = true;
  const dlg = document.getElementById('ns') as HTMLDialogElement;
  const bot = dlg.querySelector<SVGElement>('.ns-bot .nb')!;
  const views = dlg.querySelectorAll<HTMLElement>('[data-ns-view]');
  const exams: string[] = JSON.parse(dlg.dataset.exams || '[]');
  const VOICE = 'msdb-nimbus-voice', CALM = 'msdb-nimbus-calm';
  const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
  const put = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* blocked */ } };
  const voice = dlg.querySelector<HTMLInputElement>('#ns-voice')!;
  const calm = dlg.querySelector<HTMLInputElement>('#ns-calm')!;
  voice.checked = get(VOICE) !== '0';
  calm.checked = get(CALM) === '1';
  if (!canSpeak()) voice.closest('label')!.hidden = true;
  voice.addEventListener('change', () => put(VOICE, voice.checked ? '1' : '0'));
  calm.addEventListener('change', () => {
    put(CALM, calm.checked ? '1' : '0');
    document.documentElement.toggleAttribute('data-nimbus-calm', calm.checked);
  });

  const firstName = () => (hint()?.name || '').trim().split(/\s+/)[0] || '';
  const exam = () => {
    const seg = location.pathname.split('/')[1];
    return exams.includes(seg) ? seg : (loadCoach().focus && exams.includes(loadCoach().focus!) ? loadCoach().focus! : exams[0]);
  };
  const onLesson = () => !!document.getElementById('listen-btn');

  function show(v: string) {
    views.forEach((x) => (x.hidden = x.dataset.nsView !== v));
    const h = dlg.querySelector<HTMLElement>(`[data-ns-view="${v}"] .ns-h2`);
    h?.focus();
  }

  function greet(text: string) {
    if (voice.checked && canSpeak()) { bot.dataset.mood = 'talk'; speak(text).finally(() => { if (bot.dataset.mood === 'talk') bot.dataset.mood = 'wave'; }); }
  }

  function open() {
    const n = firstName();
    const skin = currentSkin();
    const name = skin === 'cloud' ? 'Nimbus' : `your ${skinName(skin)} Nimbus`;
    dlg.querySelector('#ns-h')!.textContent = n ? `Hi ${n}, I’m ${name}` : `Hi, I’m ${name}`;
    dlg.querySelector('#ns-listen-note')!.textContent = onLesson() ? 'I’ll read this lesson to you' : 'Open a lesson and I’ll read it';
    (dlg.querySelector('#ns-games') as HTMLAnchorElement).href = `/${exam()}/games/`;
    show('home');
    bot.dataset.mood = 'wave';
    dlg.classList.remove('is-in');
    dlg.showModal();
    dlg.classList.remove('is-done');
    requestAnimationFrame(() => dlg.classList.add('is-in'));
    setTimeout(() => dlg.classList.add('is-done'), 1400);
    greet(`${n ? `Hi ${n}!` : 'Hi!'} I’m ${name}. What shall we learn today?`);
  }
  function close() { stopSpeaking(); dlg.close(); }

  document.addEventListener('click', (e) => {
    if ((e.target as Element).closest?.('[data-nimbus-meet]')) { e.preventDefault(); open(); }
  });
  dlg.addEventListener('close', () => stopSpeaking());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  dlg.querySelector('[data-ns-close]')!.addEventListener('click', close);

  // character picker
  const grid = dlg.querySelector('#ns-skins')!;
  function paintSkins() {
    const cur = currentSkin();
    grid.replaceChildren(...SKINS.map((s) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ns-skin';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(s.id === cur));
      b.tabIndex = s.id === cur ? 0 : -1;
      b.dataset.skin = s.id;
      b.innerHTML = `${miniSvg(s.id, 72)}<b>${s.name}</b><span>${s.blurb}</span>`;
      return b;
    }));
  }
  grid.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('.ns-skin');
    if (!b) return;
    const s = b.dataset.skin as SkinId;
    setSkin(s);
    paintSkins();
    (grid.querySelector(`[data-skin="${s}"]`) as HTMLElement | null)?.focus();
    bot.dataset.mood = 'cheer';
    setTimeout(() => (bot.dataset.mood = 'wave'), 1600);
    greet(s === 'cloud' ? 'I’m back to the original Nimbus!' : `Hi! I’m your ${skinName(s)} Nimbus now.`);
  });
  grid.addEventListener('keydown', (e) => {
    const k = (e as KeyboardEvent).key;
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(k)) return;
    e.preventDefault();
    const items = [...grid.querySelectorAll<HTMLElement>('.ns-skin')];
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next = items[(i + (k === 'ArrowRight' || k === 'ArrowDown' ? 1 : -1) + items.length) % items.length];
    next.click();
  });

  dlg.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLElement>('[data-ns]')?.dataset.ns;
    if (!a) return;
    if (a === 'chat') { close(); window.dispatchEvent(new CustomEvent('nimbus-chat')); }
    else if (a === 'listen') {
      close();
      if (onLesson()) document.getElementById('listen-btn')!.click();
      else window.dispatchEvent(new CustomEvent('nimbus-chat', { detail: { say: 'Open any lesson and tap “Listen with Nimbus”. I’ll read it to you sentence by sentence.' } }));
    }
    else if (a === 'pick') { paintSkins(); show('pick'); }
    else if (a === 'play') show('play');
    else if (a === 'quiz') { close(); window.dispatchEvent(new CustomEvent('nimbus-chat', { detail: { quiz: true } })); }
    else if (a === 'back') show('home');
  });
}
