/**
 * Headless check for the Architecture Builder logic (rules, traffic, explain,
 * templates). Proves the good design is clean, the broken templates show their
 * problems, and the documented fixes make traffic flow.
 *
 *   npx esbuild scripts/qa/architect-check.ts --bundle --platform=node --format=esm --log-level=error --outfile=<tmp>/arch.mjs && node <tmp>/arch.mjs
 */
import { TEMPLATES } from '../../src/lib/architect/templates';
import { check } from '../../src/lib/architect/rules';
import { simulate } from '../../src/lib/architect/traffic';
import { explain } from '../../src/lib/architect/explain';
import { isDesign, makeNode, type Design } from '../../src/lib/architect/model';

let bad = 0;
const t = (name: string, ok: boolean, info = '') => { if (!ok) bad++; console.log(`${ok ? '✓' : '✗'} ${name}${!ok && info ? `\n    ${info}` : ''}`); };
const tpl = (id: string): Design => TEMPLATES.find((x) => x.id === id)!.design();
const ids = (d: Design) => check(d).map((f) => f.id.replace(/-[^-]*$/, '').replace(/-[a-z0-9]+$/i, ''));
const has = (d: Design, prefix: string) => check(d).some((f) => f.id.startsWith(prefix));
const show = (d: Design) => check(d).map((f) => `${f.level} ${f.id}`).join(' | ');

for (const x of TEMPLATES) { const d = x.design(); t(`template ${x.id} is a valid design`, isDesign(d)); explain(d); }

// Highly available web app: clean, and traffic flows end to end
const web = tpl('web-ha');
t('web-ha has no errors or warnings', !check(web).some((f) => f.level !== 'tip'), show(web));
t('web-ha: internet → lb-web:80 reaches a VM', simulate(web, 'internet', 'lb1', 80).ok, JSON.stringify(simulate(web, 'internet', 'lb1', 80).hops));
t('web-ha: internet → vm directly is blocked (no public IP)', !simulate(web, 'internet', 'vm1', 80).ok);
// Break the probe: deny AzureLoadBalancer on the subnet NSG
web.nodes.find((n) => n.id === 'nsg1')!.props.rules.push({ name: 'Deny-LB', priority: 90, source: 'AzureLoadBalancer', port: '*', access: 'Deny' });
t('web-ha: blocking AzureLoadBalancer is flagged as a failed probe', has(web, 'lb-probe'), show(web));
t('web-ha: … and traffic is dropped', !simulate(web, 'internet', 'lb1', 80).ok);

// Hub and spoke: 2 problems, then fixed
const hub = tpl('hub-spoke-broken');
t('hub-spoke: transit problem found', has(hub, 'transit'), show(hub));
t('hub-spoke: open RDP found', has(hub, 'vm-mgmt'), show(hub));
t('hub-spoke: spoke1 → spoke2 fails before the fix', !simulate(hub, 'vma', 'vmb', 443).ok);
hub.links.push({ id: 'r1', from: 'as1', to: 'fw', kind: 'route' }, { id: 'r2', from: 'bs1', to: 'fw', kind: 'route' });
hub.nodes.find((n) => n.id === 'nsga')!.props.rules = [];
t('hub-spoke: transit fixed by routing both spokes to the firewall', !has(hub, 'transit'), show(hub));
t('hub-spoke: RDP warning gone after removing the rule', !has(hub, 'vm-mgmt'), show(hub));
const hs = simulate(hub, 'vma', 'vmb', 443);
t('hub-spoke: spoke1 → spoke2 now goes through afw-hub', hs.ok && hs.path.includes('fw'), JSON.stringify(hs.hops));

// Private storage: 3 problems, then fixed
const ps = tpl('private-storage-broken');
t('private-storage: subnet outside VNet found', has(ps, 'sub-out'), show(ps));
t('private-storage: missing private DNS found', has(ps, 'pe-dns'), show(ps));
t('private-storage: public access still on found', has(ps, 'paas-pub'), show(ps));
const before = simulate(ps, 'vm', 'st', 443);
t('private-storage: VM reaches storage only over the public endpoint', before.ok && !before.path.includes('pe'), JSON.stringify(before.hops));
ps.nodes.find((n) => n.id === 's2')!.props.prefix = '10.30.2.0/24';
ps.nodes.find((n) => n.id === 'st')!.props.publicAccess = 'Disabled';
const z = makeNode('dns', 700, 600, ps); z.props.zone = 'privatelink.blob.core.windows.net'; ps.nodes.push(z);
ps.links.push({ id: 'dl', from: z.id, to: 'v', kind: 'dnslink' });
t('private-storage: no errors or warnings after the fix', !check(ps).some((f) => f.level !== 'tip'), show(ps));
const after = simulate(ps, 'vm', 'st', 443);
t('private-storage: VM reaches storage privately through the endpoint', after.ok && after.path.includes('pe'), JSON.stringify(after.hops));
t('private-storage: internet → storage is blocked', !simulate(ps, 'internet', 'st', 443).ok);

void ids;
console.log(bad ? `\n${bad} architect check(s) failed` : '\nArchitecture Builder logic: all checks passed');
process.exit(bad ? 1 : 0);
