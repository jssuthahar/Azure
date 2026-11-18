/**
 * Animated explainer videos for lesson theory sections.
 *
 * Same contract as the MSDEVBUILD short-video kit (msdevbuild-video → ReelSpec):
 * the locked brand frame (title screen, caption card, progress track, status
 * bar, end card, sound engine) is owned by the player; each explainer only
 * authors its stage markup, scoped CSS, copy, narration and per-step
 * choreography. One spec plays in two layouts: 16:9 landscape on desktop and
 * tablet, 9:16 portrait on phones.
 *
 * Spec files live in src/explainers/<exam>/<id>.ts and are placed in a lesson
 * with <Explainer id="<id>" />.
 */
import type { XApi } from './player';

export interface XStage {
  /** Caption card heading, e.g. "Three copies, one building". */
  title: string;
  /** A substring of `title` shown in the accent colour. */
  key?: string;
  /** Caption card body line (what the learner reads). */
  desc: string;
  /** Status bar text, monospace, e.g. "zone 2 · offline". */
  status: string;
  /** Animated thinking dots in the status bar. */
  thinking?: boolean;
  /**
   * The spoken line, written to be heard. Also the subtitle and the script.
   * The step holds until this has been spoken (voice on) or for an estimated
   * reading time (voice off), whichever is longer than `ms`.
   */
  say: string;
  /** Minimum hold in milliseconds. Defaults to the narration estimate. */
  ms?: number;
  /**
   * Choreography for this step. Must leave the stage in the state the next
   * step expects: seeking replays earlier steps instantly to rebuild it.
   */
  run?: (m: XApi) => void;
}

export interface ExplainerSpec {
  /** Unique id, kebab-case. Used by <Explainer id>. */
  id: string;
  /** Lesson topic slug this explainer belongs to (for the script link and QA). */
  lesson: string;
  title: {
    /** Title-screen headline. May contain one <em> for the accent phrase. */
    main: string;
    sub: string;
  };
  /** Accessible one-line summary of what the video shows. */
  summary: string;
  /** Stage markup, injected into the stage area. */
  html: string;
  /**
   * Stage CSS. Start every selector with `@S` (both layouts), `@L` (landscape
   * only) or `@P` (portrait only); the component scopes them to this player.
   */
  css: string;
  stages: XStage[];
  end: { title: string; sub: string };
}

/** How long a step holds: its `ms`, or a reading-time estimate for `say`. */
export const holdFor = (s: Pick<XStage, 'ms' | 'say'>) =>
  Math.max(s.ms ?? 0, 2400, Math.round((s.say.split(/\s+/).length / 2.5) * 1000 + 900));
/** Pause between steps, after the narration finishes. */
export const STEP_GAP = 400;

/**
 * Fingerprint of a narration line (FNV-1a, 32-bit, whitespace-normalised).
 * A recorded clip is used only while its fingerprint matches the current
 * `say` text, so editing a line can never leave stale audio playing.
 * scripts/voice.mjs computes the same hash. Keep the two in step.
 */
export function voiceHash(text: string): string {
  let h = 0x811c9dc5;
  for (const ch of text.replace(/\s+/g, ' ').trim()) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** src/explainers/voice.json: written by `npm run voice`. id → step number → clip. */
export type VoiceManifest = Record<string, Record<string, { hash: string; ms: number; file: string; /** Made with a voice clone (npm run voice:clone). */ ai?: boolean }>>;
