/**
 * Slide mode for lessons: the same lesson, one part per screen.
 *
 * Nothing is cloned. The <article> becomes a full-screen layer and every part
 * except the current slide is hidden, so quizzes, simulations and activities
 * keep working exactly as they do on the scrolling page.
 *
 * Template hints:
 *   data-slide-group="<name>"  units with the same name share one slide
 *   data-slide-join            this unit goes on the same slide as the next one
 *   data-slide-with-prev       this unit goes on the same slide as the one before
 *   data-slide-skip            never shown in slide mode
 */

const RESUME_KEY = 'msdb-present';

type Slide = { units: HTMLElement[]; title: string };

const article = () => document.querySelector<HTMLElement>('article[data-present-root]');

function isShown(el: HTMLElement) {
  return getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0;
}

/** Top-level parts of the lesson, with wrapper divs (.lesson, .full-only) opened up. */
function units(root: HTMLElement): HTMLElement[] {
  const out: HTMLElement[] = [];
  const walk = (parent: HTMLElement) => {
    for (const el of Array.from(parent.children) as HTMLElement[]) {
      if (el.matches('.present-ui, script, style, template')) continue;
      if (el.hasAttribute('data-slide-skip')) continue;
      if (el.matches('.lesson, .full-only, .simple-only') && !el.matches('.lesson-section') && el.querySelector(':scope > section, :scope > div, :scope > aside')) {
        if (!isShown(el)) continue;
        walk(el);
        continue;
      }
      if (!isShown(el)) continue;
      out.push(el);
    }
  };
  walk(root);
  return out;
}

const GROUP_TITLES: Record<string, string> = { intro: 'The 30-second answer', finish: 'Lesson complete' };

function titleOf(slide: HTMLElement[]): string {
  const group = slide[0].dataset.slideGroup;
  if (group && GROUP_TITLES[group]) return GROUP_TITLES[group];
  for (const el of slide) {
    if (el.id === 'simulations' || el.querySelector('#simulations')) return 'Simulations';
    if (el.id === 'exam-tip') return 'Exam tip';
    const h = el.querySelector<HTMLElement>('[data-slide-title], h2, h3');
    const t = (el.dataset.slideTitle || h?.dataset.slideTitle || h?.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
    if (t) return t.length > 60 ? `${t.slice(0, 57)}…` : t;
  }
  return 'Lesson';
}

function buildSlides(root: HTMLElement): Slide[] {
  const slides: HTMLElement[][] = [];
  let pending: HTMLElement[] = [];
  let lastGroup: string | undefined;
  for (const el of units(root)) {
    const group = el.dataset.slideGroup;
    if (slides.length && ((group && group === lastGroup) || el.hasAttribute('data-slide-with-prev'))) {
      slides[slides.length - 1].push(...pending, el);
    } else {
      slides.push([...pending, el]);
    }
    pending = [];
    lastGroup = group;
    if (el.hasAttribute('data-slide-join')) {
      // Carry this unit over to the next slide instead.
      const cur = slides[slides.length - 1];
      cur.pop();
      if (!cur.length) slides.pop();
      pending.push(el);
      lastGroup = undefined;
    }
  }
  if (pending.length) slides.push(pending);
  return slides.map((u) => ({ units: u, title: titleOf(u) }));
}

export function initPresent() {
  const root = article();
  const openBtns = document.querySelectorAll<HTMLButtonElement>('[data-present-open]');
  if (!root || !openBtns.length) return;

  // Controls live inside the article so they share its stacking layer.
  const ui = document.createElement('div');
  ui.className = 'present-ui';
  ui.innerHTML = `
    <div class="present-top" role="region" aria-label="Slide mode controls">
      <p class="present-pos" aria-live="polite"><span class="present-count"></span> <span class="present-title"></span></p>
      <button type="button" class="present-btn present-exit" aria-label="Exit slide mode (Escape)">✕ <span class="present-word">Exit</span></button>
      <div class="present-bar" aria-hidden="true"><span></span></div>
    </div>
    <div class="present-bottom" role="group" aria-label="Slide navigation">
      <button type="button" class="present-btn present-prev">❮ <span class="present-word">Previous</span></button>
      <span class="present-hint">← → keys or swipe</span>
      <button type="button" class="present-btn present-next present-primary"><span class="present-word">Next</span> ❯</button>
    </div>`;
  root.prepend(ui);

  const $ = <T extends HTMLElement>(s: string) => ui.querySelector<T>(s)!;
  const countEl = $('.present-count');
  const titleEl = $('.present-title');
  const barEl = $('.present-bar span');
  const prevBtn = $<HTMLButtonElement>('.present-prev');
  const nextBtn = $<HTMLButtonElement>('.present-next');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let slides: Slide[] = [];
  let at = 0;
  let active = false;
  let opener: HTMLElement | null = null;

  const nextLessonUrl = () => root.querySelector<HTMLAnchorElement>('a[rel="next"]')?.href;

  function show(i: number, focus = true) {
    at = Math.max(0, Math.min(slides.length - 1, i));
    const current = new Set(slides[at].units);
    slides.forEach((s) => s.units.forEach((u) => u.toggleAttribute('data-slide-off', !current.has(u))));
    root!.querySelectorAll('.present-first').forEach((e) => e.classList.remove('present-first'));
    slides[at].units[0].classList.add('present-first');
    for (const u of current) {
      u.classList.remove('present-in');
      if (!reduced) {
        void u.offsetWidth;
        u.classList.add('present-in');
      }
    }
    countEl.textContent = `${at + 1} / ${slides.length}`;
    titleEl.textContent = slides[at].title;
    barEl.style.width = `${((at + 1) / slides.length) * 100}%`;
    prevBtn.disabled = at === 0;
    const last = at === slides.length - 1;
    const nextUrl = nextLessonUrl();
    nextBtn.disabled = last && !nextUrl;
    nextBtn.querySelector('.present-word')!.textContent = last ? 'Next lesson' : 'Next';
    root.scrollTop = 0;
    // Canvases (3D View) measure themselves on resize; they were hidden until now.
    window.dispatchEvent(new Event('resize'));
    if (focus) {
      const target = slides[at].units[0];
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  }

  function goNext() {
    if (at < slides.length - 1) return show(at + 1);
    const url = nextLessonUrl();
    if (!url) return;
    try {
      sessionStorage.setItem(RESUME_KEY, '1');
    } catch {}
    location.href = url;
  }

  function open(fromClick: boolean) {
    if (active) return;
    window.dispatchEvent(new Event('speech-stop-all'));
    slides = buildSlides(root!);
    if (!slides.length) return;
    active = true;
    document.documentElement.classList.add('presenting');
    root!.setAttribute('role', 'dialog');
    root!.setAttribute('aria-modal', 'true');
    root!.setAttribute('aria-label', 'Lesson in slide mode');
    show(0);
    // Real full screen where the browser allows it (needs a click; iPhone Safari has none).
    if (fromClick && document.fullscreenEnabled && !document.fullscreenElement && matchMedia('(min-width: 768px)').matches) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
    try {
      sessionStorage.setItem(RESUME_KEY, '1');
    } catch {}
  }

  function close() {
    if (!active) return;
    active = false;
    document.documentElement.classList.remove('presenting');
    root!.removeAttribute('role');
    root!.removeAttribute('aria-modal');
    root!.removeAttribute('aria-label');
    root!.querySelectorAll('[data-slide-off]').forEach((e) => e.removeAttribute('data-slide-off'));
    root!.querySelectorAll('.present-in, .present-first').forEach((e) => e.classList.remove('present-in', 'present-first'));
    const back = slides[at]?.units[0];
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    window.dispatchEvent(new Event('resize'));
    back?.scrollIntoView({ block: 'start' });
    (opener ?? openBtns[0]).focus({ preventScroll: true });
    try {
      sessionStorage.removeItem(RESUME_KEY);
    } catch {}
  }

  openBtns.forEach((b) =>
    b.addEventListener('click', () => {
      opener = b;
      open(true);
    }),
  );
  $('.present-exit').addEventListener('click', close);
  prevBtn.addEventListener('click', () => show(at - 1));
  nextBtn.addEventListener('click', goNext);

  // In-page links (e.g. "Simulate it »" → #simulations) jump to the slide that holds the target.
  root.addEventListener(
    'click',
    (e) => {
      if (!active) return;
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a || a.closest('.present-ui')) return;
      const id = decodeURIComponent(a.getAttribute('href')!.slice(1));
      const el = id && document.getElementById(id);
      if (!el) return;
      const i = slides.findIndex((s) => s.units.some((u) => u === el || u.contains(el)));
      if (i < 0) return;
      // Let it bubble on: LessonSimulations still switches tabs for data-sim-tab links.
      e.preventDefault();
      show(i, false);
      el.scrollIntoView({ block: 'start' });
    },
    true,
  );

  const typing = (t: EventTarget | null) =>
    t instanceof HTMLElement && (t.isContentEditable || Boolean(t.closest('input, textarea, select, [role="textbox"], .pt-terminal, .xterm')));

  document.addEventListener('keydown', (e) => {
    if (!active || e.altKey || e.ctrlKey || e.metaKey || typing(e.target)) return;
    if (document.querySelector('dialog[open]')) return;
    const onControl = e.target instanceof HTMLElement && e.target.closest('button, a, [role="tab"], [role="radio"], summary');
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !onControl)) {
      if ((e.target as HTMLElement).closest?.('[role="tablist"], [role="radiogroup"]')) return;
      e.preventDefault();
      goNext();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      if ((e.target as HTMLElement).closest?.('[role="tablist"], [role="radiogroup"]')) return;
      e.preventDefault();
      show(at - 1);
    } else if (e.key === 'Home' && !onControl) {
      e.preventDefault();
      show(0);
    } else if (e.key === 'End' && !onControl) {
      e.preventDefault();
      show(slides.length - 1);
    }
  });

  // Swipe left / right on phones and iPads. Drags on 3D scenes, sliders and wide tables don't count.
  let sx = 0;
  let sy = 0;
  let swipeOk = false;
  root.addEventListener(
    'touchstart',
    (e) => {
      if (!active || e.touches.length !== 1) return (swipeOk = false), undefined;
      const t = e.target as HTMLElement;
      swipeOk = !t.closest('canvas, input, textarea, select, .table-wrap, pre, [data-no-swipe], .present-ui');
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    },
    { passive: true },
  );
  root.addEventListener(
    'touchend',
    (e) => {
      if (!active || !swipeOk) return;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
      if (dx < 0) goNext();
      else show(at - 1);
    },
    { passive: true },
  );

  // Arrived here with "Next lesson" from slide mode: carry on in slide mode.
  let resume = false;
  try {
    resume = sessionStorage.getItem(RESUME_KEY) === '1';
  } catch {}
  if (resume) requestAnimationFrame(() => open(false));
}
