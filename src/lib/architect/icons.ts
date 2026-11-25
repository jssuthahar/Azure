/**
 * Simple outline icons for the Architecture Builder (24×24, stroke only), one
 * style for every resource. Our own drawings, not Microsoft's icon set.
 */
import type { Kind } from './model';

export const ICON_PATHS: Record<Kind, string> = {
  vnet: '<path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/><circle cx="8.5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="15.5" cy="12" r="1"/>',
  subnet: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M12 3v18"/>',
  vm: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  nsg: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  pip: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  lb: '<circle cx="12" cy="5" r="2"/><path d="M12 7v10M12 9l-7 8M12 9l7 8"/><circle cx="5" cy="19" r="2"/><circle cx="12" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>',
  appgw: '<circle cx="4" cy="12" r="1.8"/><path d="M5.8 12H10l4-6h6M10 12l4 6h6M10 12h10"/>',
  storage: '<rect x="3" y="4" width="18" height="4.5" rx="1"/><rect x="3" y="10" width="18" height="4.5" rx="1"/><rect x="3" y="16" width="18" height="4.5" rx="1"/><path d="M6 6.2h.01M6 12.2h.01M6 18.2h.01"/>',
  sql: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>',
  pe: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3M12 15v2"/>',
  vpngw: '<path d="M3 20v-8a9 9 0 0 1 18 0v8"/><path d="M8 20v-6a4 4 0 0 1 8 0v6"/>',
  dns: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  firewall: '<path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z"/>',
  bastion: '<path d="M5 21V9l3-2V4h2v2h4V4h2v3l3 2v12z"/><path d="M10 21v-4a2 2 0 0 1 4 0v4"/>',
  onprem: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/>',
};

/** For HTML (palette, Properties panel). */
export const iconSvg = (k: Kind, size = 18) => `<svg class="ab-ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[k]}</svg>`;
/** Inside the canvas SVG. */
export const iconG = (k: Kind, x: number, y: number, size = 26) => `<g class="ab-gico" transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[k]}</g>`;
