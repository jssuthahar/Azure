/**
 * Share rows built in the browser (mock exam score, Architecture Builder
 * design, Career Metro route). Same look as <ShareButtons />: LinkedIn, X,
 * WhatsApp, Facebook, copy link, and the device share sheet where there is one.
 * Styles: `.share-row` / `.share-b` in src/styles/global.css. Nothing is tracked.
 */
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function shareLinks(url: string, text: string) {
  return {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  };
}

/** HTML for a share row. Call bindShareRows(container) after inserting it. */
export function shareRowHTML(url: string, text: string, label = 'Share:') {
  const l = shareLinks(url, text);
  return `<div class="share-row flex flex-wrap items-center gap-2" data-share-url="${esc(url)}" data-share-text="${esc(text)}">
    <span class="text-sm font-semibold">${esc(label)}</span>
    <a class="share-b" target="_blank" rel="noopener" href="${esc(l.linkedin)}">in LinkedIn</a>
    <a class="share-b" target="_blank" rel="noopener" href="${esc(l.x)}">𝕏 Post</a>
    <a class="share-b" target="_blank" rel="noopener" href="${esc(l.whatsapp)}">💬 WhatsApp</a>
    <a class="share-b" target="_blank" rel="noopener" href="${esc(l.facebook)}">f Facebook</a>
    <button type="button" class="share-b" data-net="copy">🔗 Copy link</button>
    <button type="button" class="share-b" data-net="native" hidden>📤 Share…</button>
  </div>`;
}

export function bindShareRows(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('.share-row:not([data-bound])').forEach((row) => {
    row.dataset.bound = '1';
    const url = () => row.dataset.shareUrl!;
    const text = () => row.dataset.shareText!;
    const native = row.querySelector<HTMLButtonElement>('[data-net="native"]');
    if (native && 'share' in navigator) { native.hidden = false; native.addEventListener('click', () => navigator.share({ title: text(), text: text(), url: url() }).catch(() => {})); }
    row.querySelector<HTMLButtonElement>('[data-net="copy"]')?.addEventListener('click', async (e) => {
      const b = e.currentTarget as HTMLButtonElement;
      try { await navigator.clipboard.writeText(url()); b.textContent = '✅ Copied'; } catch { prompt('Copy this link:', url()); }
      setTimeout(() => (b.textContent = '🔗 Copy link'), 2000);
    });
  });
}
