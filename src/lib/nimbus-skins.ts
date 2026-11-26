/**
 * Nimbus characters ("skins"). The learner picks one; every Nimbus on the site
 * (Ask button, chat, coach card, lesson reader) then wears it. Only the body
 * and face change: moods, hands, level items and the night cap stay the same,
 * so every skin keeps the classes the mood CSS animates (.nb-eye, .nb-eyes,
 * .nb-happy, .nb-mouth, .nb-talk, .nb-look, .nb-glow).
 *
 * Coordinates use NimbusBot's viewBox (-10 -8 140 140); the head sits at about
 * (62, 74), radius 30, so hats, glasses and medals line up on every skin.
 * `ID` in a template is replaced with the instance's gradient id prefix.
 */
import { loadCoach, saveCoach } from './coach';

export type SkinId = 'cloud' | 'puppy' | 'kitten' | 'panda' | 'bunny' | 'bird' | 'baby' | 'dragon';

export interface Skin { id: SkinId; name: string; blurb: string }

export const SKINS: Skin[] = [
  { id: 'cloud', name: 'Cloud Nimbus', blurb: 'The original study robot' },
  { id: 'puppy', name: 'Puppy', blurb: 'Loyal, never misses a day' },
  { id: 'kitten', name: 'Kitten', blurb: 'Curious about everything' },
  { id: 'panda', name: 'Panda', blurb: 'Calm, steady progress' },
  { id: 'bunny', name: 'Bunny', blurb: 'Quick learner, big ears' },
  { id: 'bird', name: 'Bluebird', blurb: 'Sings when you get it right' },
  { id: 'baby', name: 'Baby', blurb: 'Learning something new every day' },
  { id: 'dragon', name: 'Baby Dragon', blurb: 'Small now, mighty later' },
];

const isSkin = (s: unknown): s is SkinId => SKINS.some((k) => k.id === s);
export const skinOrDefault = (s: unknown): SkinId => (isSkin(s) ? s : 'cloud');

/** The learner's chosen character (saved with the coach state, so it syncs when signed in). */
export const currentSkin = (): SkinId => skinOrDefault(loadCoach().skin);
export function setSkin(skin: SkinId) {
  const st = loadCoach();
  st.skin = skin;
  saveCoach(st);
  window.dispatchEvent(new CustomEvent('nimbus-skin', { detail: skin }));
}
export const skinName = (s: SkinId = currentSkin()) => SKINS.find((k) => k.id === s)?.name ?? 'Nimbus';

/* Shared animal face: dark eyes with a shine, happy arcs, a small mouth. */
const face = (eye = '#2b1d14', mouth = '#2b1d14') => `
  <g class="nb-look">
    <g class="nb-eyes"><ellipse class="nb-eye" cx="51" cy="72" rx="4.6" ry="5.6" style="fill:${eye}"/><ellipse class="nb-eye" cx="73" cy="72" rx="4.6" ry="5.6" style="fill:${eye}"/><circle cx="52.6" cy="69.8" r="1.6" fill="#fff"/><circle cx="74.6" cy="69.8" r="1.6" fill="#fff"/></g>
    <path class="nb-happy" d="M46.5 73q4.5-6 9 0M68.5 73q4.5-6 9 0" style="stroke:${eye}"/>
    <path class="nb-mouth" d="M57 86q5 3.5 10 0" style="stroke:${mouth}"/>
    <ellipse class="nb-talk" cx="62" cy="87" rx="3.6" ry="2.6" style="fill:${mouth}"/>
  </g>`;
const cheeks = (c = '#ff7a93') => `<ellipse cx="42" cy="81" rx="3.4" ry="2.2" fill="${c}" opacity=".7"/><ellipse cx="82" cy="81" rx="3.4" ry="2.2" fill="${c}" opacity=".7"/>`;

const T: Record<SkinId, string> = {
  cloud: `
    <path d="M60 42V25" stroke="#0078d4" stroke-width="3.5" stroke-linecap="round"/>
    <circle class="nb-glow" cx="60" cy="18" r="11" fill="#ffc83d"/>
    <circle class="nb-orb" cx="60" cy="18" r="6" fill="url(#ID-orb)" stroke="#e08a00" stroke-width="1"/>
    <path d="M30 98h60a21 21 0 0 0 3.2-41.8A29 29 0 0 0 38.6 49.6 23 23 0 0 0 30 98z" fill="url(#ID-body)" stroke="#0078d4" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M43 56a19 19 0 0 1 17-9.5" stroke="#fff" stroke-width="4.5" stroke-linecap="round" fill="none"/>
    <circle cx="35" cy="66" r="2.2" fill="#fff"/>
    <rect x="37" y="60" width="50" height="29" rx="14" fill="url(#ID-visor)" stroke="#0a2a52" stroke-width="1.5"/>
    <g clip-path="url(#ID-clip)"><rect class="nb-sheen" x="20" y="54" width="14" height="44" transform="skewX(-20)" fill="url(#ID-sheen)"/></g>
    <g class="nb-look">
      <g class="nb-eyes"><rect class="nb-eye" x="48" y="67" width="8" height="12" rx="4"/><rect class="nb-eye" x="68" y="67" width="8" height="12" rx="4"/></g>
      <path class="nb-happy" d="M47 75q5-7 10 0M67 75q5-7 10 0"/>
      <path class="nb-mouth" d="M55 82q7 4.5 14 0"/>
      <ellipse class="nb-talk" cx="62" cy="83" rx="4" ry="2.6"/>
    </g>
    <ellipse cx="43.5" cy="81.5" rx="3" ry="2" fill="#ff7a93" opacity=".8"/><ellipse cx="80.5" cy="81.5" rx="3" ry="2" fill="#ff7a93" opacity=".8"/>`,
  puppy: `
    <path d="M38 52q-17 4-14 34q10-2 17-18z" fill="#9a6532" stroke="#6b4220" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M86 52q17 4 14 34q-10-2-17-18z" fill="#9a6532" stroke="#6b4220" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="62" cy="74" r="30" fill="#f2c48d" stroke="#6b4220" stroke-width="3"/>
    <ellipse cx="75" cy="70" rx="9" ry="9.5" fill="#d9a066" opacity=".75"/>
    <ellipse cx="62" cy="85" rx="14" ry="10.5" fill="#fff4e3"/>
    <ellipse cx="62" cy="80" rx="4.8" ry="3.4" fill="#2b1d14"/>
    ${face()}${cheeks()}`,
  kitten: `
    <path d="M37 60l3-28 18 15z" fill="#ffb066" stroke="#a65a18" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M87 60l-3-28-18 15z" fill="#ffb066" stroke="#a65a18" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M42 52l1.5-13 8 7z M82 52l-1.5-13-8 7z" fill="#ff9fb5"/>
    <circle cx="62" cy="74" r="30" fill="#ffc285" stroke="#a65a18" stroke-width="3"/>
    <path d="M56 47v6M62 45v7M68 47v6" stroke="#d9772b" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M59.5 80h5l-2.5 3z" fill="#ff7a93"/>
    <path d="M44 82h-10M44 86l-9 3M80 82h10M80 86l9 3" stroke="#a65a18" stroke-width="1.4" stroke-linecap="round"/>
    ${face('#2b1d14', '#7a3d10')}${cheeks()}`,
  panda: `
    <circle cx="40" cy="50" r="10" fill="#2b2b2b"/><circle cx="84" cy="50" r="10" fill="#2b2b2b"/>
    <circle cx="62" cy="74" r="30" fill="#ffffff" stroke="#2b2b2b" stroke-width="3"/>
    <ellipse cx="50" cy="73" rx="9" ry="11" transform="rotate(-20 50 73)" fill="#2b2b2b"/>
    <ellipse cx="74" cy="73" rx="9" ry="11" transform="rotate(20 74 73)" fill="#2b2b2b"/>
    <ellipse cx="62" cy="82" rx="4.4" ry="3" fill="#2b2b2b"/>
    ${face('#ffffff', '#2b2b2b')}${cheeks('#ff9fb5')}`,
  bunny: `
    <ellipse cx="49" cy="30" rx="8" ry="22" transform="rotate(-8 49 30)" fill="#ffffff" stroke="#b9879f" stroke-width="2.5"/>
    <ellipse cx="75" cy="30" rx="8" ry="22" transform="rotate(8 75 30)" fill="#ffffff" stroke="#b9879f" stroke-width="2.5"/>
    <ellipse cx="49" cy="31" rx="3.6" ry="15" transform="rotate(-8 49 31)" fill="#ffc2d4"/>
    <ellipse cx="75" cy="31" rx="3.6" ry="15" transform="rotate(8 75 31)" fill="#ffc2d4"/>
    <circle cx="62" cy="75" r="29" fill="#ffffff" stroke="#b9879f" stroke-width="3"/>
    <ellipse cx="62" cy="81" rx="3.6" ry="2.6" fill="#ff7a93"/>
    <rect x="59.5" y="88" width="5" height="4.5" rx="1" fill="#fff" stroke="#b9879f" stroke-width="1"/>
    ${face('#2b1d14', '#9a5a74')}${cheeks()}`,
  bird: `
    <path d="M60 45q-3-12 4-16q-1 8 3 13M64 44q4-10 11-10q-5 5-6 11" fill="#1f6fb2"/>
    <circle cx="62" cy="74" r="31" fill="#7cc7ff" stroke="#1f6fb2" stroke-width="3"/>
    <ellipse cx="62" cy="88" rx="17" ry="13" fill="#e3f4ff"/>
    <path d="M55 79l7 7 7-7z" fill="#ffb300" stroke="#c77a00" stroke-width="1.5" stroke-linejoin="round"/>
    ${face('#10243d', '#c77a00')}${cheeks('#ff8fa8')}`,
  baby: `
    <circle cx="31" cy="76" r="6" fill="#ffd2ad" stroke="#c98d68" stroke-width="2.5"/><circle cx="93" cy="76" r="6" fill="#ffd2ad" stroke="#c98d68" stroke-width="2.5"/>
    <circle cx="62" cy="74" r="30" fill="#ffdcbf" stroke="#c98d68" stroke-width="3"/>
    <path d="M57 46q2-12 12-10q-8 2-6 10q4-6 10-3" fill="none" stroke="#6b4226" stroke-width="3.4" stroke-linecap="round"/>
    ${face('#3a2416', '#a3543a')}${cheeks('#ff8a8a')}`,
  dragon: `
    <path d="M46 50l-6-16 12 9zM78 50l6-16-12 9z" fill="#ffd75e" stroke="#c98a00" stroke-width="2" stroke-linejoin="round"/>
    <path d="M58 45l4-8 4 8z" fill="#3fb36b"/>
    <circle cx="62" cy="74" r="30" fill="#8fe0a6" stroke="#2e8b57" stroke-width="3"/>
    <ellipse cx="62" cy="87" rx="15" ry="10" fill="#d6f7df"/>
    <circle cx="58" cy="83" r="1.4" fill="#2e8b57"/><circle cx="66" cy="83" r="1.4" fill="#2e8b57"/>
    ${face('#123d24', '#1f5c38')}${cheeks('#ff8fa8')}`,
};

/** The body-and-face markup for one skin, using this instance's gradient ids. */
export const skinMarkup = (skin: SkinId, id: string) => T[skin].replace(/ID-/g, `${id}-`);

/** A small static face (chat avatar, picker) for any skin. */
let miniN = 0;
export function miniSvg(skin: SkinId, size = 30) {
  const id = `mini${skin}${++miniN}`;
  const defs = skin === 'cloud'
    ? `<defs><linearGradient id="${id}-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#bcd9f7"/></linearGradient><linearGradient id="${id}-visor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b3f6e"/><stop offset="1" stop-color="#06142a"/></linearGradient><radialGradient id="${id}-orb"><stop offset="0" stop-color="#fff6cf"/><stop offset="1" stop-color="#f29d00"/></radialGradient><linearGradient id="${id}-sheen"><stop offset="0" stop-color="#fff" stop-opacity="0"/></linearGradient><clipPath id="${id}-clip"><rect x="37" y="60" width="50" height="29" rx="14"/></clipPath></defs>`
    : '';
  return `<svg class="nb nb-mini" data-skin="${skin}" data-mood="idle" viewBox="16 10 92 100" width="${size}" height="${size}" aria-hidden="true" focusable="false">${defs}<g class="nb-skin">${skinMarkup(skin, id)}</g></svg>`;
}
