/**
 * "Explain my design": a plain-English walkthrough of a design, written from
 * the design itself and the rule checker. No AI service is called; nothing
 * leaves the browser.
 */
import { CATALOG, byId, childrenOf, linked, ofKind, vnetOf, type Design } from './model';
import { check } from './rules';

export interface Explanation { overview: string[]; flows: string[]; risks: string[]; improve: string[] }

export function explain(d: Design): Explanation {
  const f = check(d);
  const overview: string[] = [];
  const flows: string[] = [];
  const counts = Object.entries(d.nodes.reduce<Record<string, number>>((a, n) => ((a[n.kind] = (a[n.kind] ?? 0) + 1), a), {}))
    .map(([k, n]) => `${n} ${CATALOG[k as keyof typeof CATALOG].label.toLowerCase()}${n > 1 ? 's' : ''}`);
  if (!d.nodes.length) return { overview: ['The canvas is empty. Add a virtual network to start, or load a starter design.'], flows: [], risks: [], improve: [] };
  overview.push(`“${d.name}” has ${counts.join(', ')}.`);
  for (const v of ofKind(d, 'vnet')) {
    const subs = childrenOf(d, v.id).filter((s) => s.kind === 'subnet');
    overview.push(`${v.name} (${v.props.addressSpace}, ${v.props.region}) holds ${subs.length ? subs.map((s) => `${s.name} ${s.props.prefix}${childrenOf(d, s.id).length ? ` with ${childrenOf(d, s.id).map((c) => c.name).join(', ')}` : ''}`).join('; ') : 'no subnets yet'}.`);
    const peers = linked(d, v.id, 'peer');
    if (peers.length) overview.push(`${v.name} is peered with ${peers.map((p) => p.name).join(', ')}. Peering connects only those two VNets: it isn’t transitive.`);
  }
  for (const lb of ofKind(d, 'lb')) {
    const be = linked(d, lb.id, 'backend');
    flows.push(`${lb.props.type === 'Public' ? 'Users on the internet' : 'Clients inside the network'} connect to ${lb.name} on port ${lb.props.rulePort}. It probes ${be.length ? be.map((b) => b.name).join(', ') : 'no backends'} on port ${lb.props.probePort} and only sends traffic to the ones that answer.`);
  }
  for (const g of ofKind(d, 'appgw')) flows.push(`HTTP(S) requests reach ${g.name} on port ${g.props.listenerPort}${g.props.waf === 'On' ? ', pass the WAF,' : ''} and go to ${linked(d, g.id, 'backend').map((b) => b.name).join(', ') || 'no backends yet'} on port ${g.props.backendPort}.`);
  for (const vm of ofKind(d, 'vm')) {
    const pip = linked(d, vm.id, 'pip')[0];
    if (pip) flows.push(`${vm.name} has its own public IP (${pip.name}), so it can be reached directly from the internet wherever its NSGs allow.`);
  }
  for (const pe of ofKind(d, 'pe')) {
    const svc = linked(d, pe.id, 'pe')[0];
    const v = vnetOf(d, pe);
    if (svc && v) flows.push(`VMs in ${v.name} (and peered VNets that use the same private DNS zone) reach ${svc.name} through ${pe.name}, a private IP in ${byId(d, pe.parent)?.name}. Traffic stays on the Microsoft network.`);
  }
  for (const s of ofKind(d, 'subnet')) for (const fw of linked(d, s.id, 'route')) flows.push(`A user-defined route on ${s.name} sends traffic for 0.0.0.0/0 to ${fw.name}, so the firewall inspects it before it leaves.`);
  for (const g of ofKind(d, 'vpngw')) for (const o of linked(d, g.id, 'vpn')) flows.push(`${o.name} (${o.props.addressSpace}) connects over an encrypted site-to-site tunnel to ${g.name}.`);
  for (const b of ofKind(d, 'bastion')) flows.push(`Admins open RDP or SSH in the Azure portal through ${b.name}, so the VMs don’t need public IPs or open management ports.`);
  if (!flows.length) flows.push('Nothing talks to anything yet. Link a public IP, a load balancer or a private endpoint to see traffic paths.');

  const risks = f.filter((x) => x.level !== 'tip').map((x) => `${x.level === 'error' ? '❌' : '⚠️'} ${x.title}. ${x.detail}`);
  const improve = f.map((x) => `${x.title}: ${x.fix}`);
  if (!risks.length) risks.push('✅ No errors or warnings. Try the Traffic tab to prove each path works.');
  if (!improve.length) improve.push('Spread VMs across availability zones, keep management ports closed (use Bastion) and send PaaS traffic through private endpoints.');
  return { overview, flows, risks, improve };
}
