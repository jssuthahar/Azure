import type { Stage, V3 } from './kit';

export type Tone = 'ok' | 'bad' | 'info';
export interface Ctx {
  stage: Stage;
  /** Status message shown on top of the 3D view; empty string hides it. */
  hud: (html: string, tone?: Tone) => void;
  /** Update a control (e.g. the Users slider) from inside the scene. */
  setControl?: (name: string, value: number) => void;
  /** Fixed read-out in the corner of the 3D view (e.g. a cost meter). */
  meter?: (html: string) => void;
  /** Live cost meter: a USD price per hour or per month (shown in the learner's currency). */
  cost: (usd: number, per: 'hour' | 'month', note: string) => void;
  /** Format a USD amount in the learner's currency. */
  money: (usd: number) => string;
}
export interface Ctl {
  go(step: number): void;
  act(id: string): void;
  input?(name: string, value: number): void;
}

/** Labels that are only visible on some steps. */
export function stepLabels(stage: Stage) {
  const all: { h: ReturnType<Stage['label']>; steps: number[] | 'all' }[] = [];
  return {
    add(text: string, at: V3 | import('three').Vector3 | (() => import('three').Vector3), steps: number[] | 'all', cls = '') {
      const h = stage.label(text, at as never, cls);
      all.push({ h, steps });
      return h;
    },
    show(step: number) { for (const l of all) l.h.show(l.steps === 'all' || l.steps.includes(step)); },
  };
}
