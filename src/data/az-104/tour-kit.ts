/**
 * Helpers for AZ-104 guided portal walkthroughs (<PortalTour id="..." />).
 * Same building blocks as the AZ-900 and AI-200 tours: one Step = one screen
 * of the simplified new Azure portal, the element to click (`t`) and what
 * Nimbus says (`say`). Education only; nothing here talks to Azure.
 *
 * Click targets (`t`): 'search', 'res:<name>', 'btn:<label>', 'menu:<blade>',
 * 'tab:<name>', 'cmd:<label>', 'row:<text>' … see src/lib/portal-tour.ts and
 * the AZ-900 / AI-200 tours for working examples of every screen kind.
 */
import type { Tour, Step, Group, Body, Screen, Field, Pane } from '../../lib/portal-tour';
export type { Tour, Step, Group, Body, Screen, Field, Pane };

export const RG = 'rg-admin-prod';
export type Menu = (string | [string, string[]])[];
export const HOME: Screen = { s: 'home' };

/** Home → search → pick a service. */
export const find = (q: string, name: string, icon: string, sayHome: string, more: { g: string; n: string; i: string }[] = []): Step[] => [
  { sc: HOME, t: 'search', say: sayHome },
  { sc: { s: 'search', q, results: [{ g: 'Services', n: name, i: icon }, ...more] }, t: `res:${name}`, say: `Type **${q}** in the search bar and pick **${name}** under *Services*.` },
];
export const list = (title: string, i: string, cols: string[] = ['Type', 'Resource group', 'Location'], rows: string[][] = []): Screen => ({ s: 'list', title, i, cols, rows });

export interface Page { tab: number; groups: Group[]; say: string; t?: string; intro?: string }
/** A create wizard, one Step per tab page. The last tab's button is Create. */
export function wizard(title: string, crumbs: string[], tabs: string[], pages: Page[]): Step[] {
  const last = tabs.length - 1;
  return pages.map((p) => ({
    sc: { s: 'create', title, crumbs, tabs, tab: p.tab, groups: p.groups, intro: p.intro, valid: p.tab === last },
    t: p.t ?? (p.tab === last ? 'btn:Create' : 'btn:Next'),
    say: p.say,
  }));
}
export const wiz = (title: string, crumbs: string[], tabs: string[], tab: number, groups: Group[], intro?: string): Screen => ({ s: 'create', title, crumbs, tabs, tab, groups, intro, valid: tab === tabs.length - 1 });
export const done = (name: string, say: string, rg = RG): Step => ({ sc: { s: 'deploy', name, done: true, rg }, t: 'btn:Go to resource', say, toast: '✅ **Deployment succeeded**' });
export const proj = (rg = RG): Group => ({ h: 'Project details', p: 'Select the subscription to manage deployed resources and costs. Use resource groups like folders to organize and manage all your resources.', f: [['Subscription *', 'Contoso Production'], ['Resource group *', rg, 's', 'Create new']] });
export const summary = (rows: [string, string][]): Group[] => [{ h: 'Summary', f: rows.map(([k, v]) => [k, v, 'i'] as Field) }];

export type ResBase = { title: string; type: string; i: string; menu: Menu; ess?: [string, string][]; cmds?: string[]; crumbs?: string[] };
/** Screen factory for one resource: blade name, body, command bar. */
export const resOf = (b: ResBase) => (active: string, body?: Body[], cmds?: string[]): Screen => ({ s: 'res', title: b.title, type: b.type, i: b.i, menu: b.menu, crumbs: b.crumbs ?? [RG], active, body, cmds: cmds ?? (active === 'Overview' ? b.cmds : undefined), ess: active === 'Overview' ? b.ess : undefined });

export const form = (groups: Group[], save?: string, title?: string): Body => ({ b: 'form', groups, save, title });
export const note = (text: string, tone: 'ok' | 'bad' | 'warn' | 'info' = 'info'): Body => ({ b: 'note', text, tone });
export const code = (text: string, title?: string): Body => ({ b: 'code', text, title });
export const tbl = (cols: string[], rows: string[][], title?: string, cmds?: string[]): Body => ({ b: 'table', cols, rows, title, cmds });
export const sel = (l: string, v: string, n?: string): Field => (n ? [l, v, 's', n] : [l, v, 's']);
export const txt = (l: string, v: string, n?: string): Field => (n ? [l, v, 't', n] : [l, v, 't']);
export const ro = (l: string, v: string, n?: string): Field => (n ? [l, v, 'i', n] : [l, v, 'i']);
export const pane = (title: string, groups: Group[], btns: string[], body?: Body[], sub?: string): Pane => ({ title, sub, groups, body, btns });
