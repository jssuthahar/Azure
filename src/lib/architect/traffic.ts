/**
 * Architecture Builder traffic simulator: follows one flow through a design
 * and says, hop by hop, whether it gets through and why. A teaching model of
 * Azure networking (NSGs, public IP SKUs, load balancer probes, peering,
 * UDRs to a firewall, private endpoints and DNS), not a packet-level emulator.
 */
import { byId, linked, ofKind, vnetOf, subnetOf, peered, type Design, type ArchNode } from './model';
import { inbound, PRIVATELINK_ZONE } from './rules';

export interface Hop { node: string; text: string; ok: boolean }
export interface TrafficResult { ok: boolean; path: string[]; hops: Hop[]; verdict: string }
export type From = 'internet' | 'onprem' | string; // or a VM id

/** Things a learner can send traffic to. */
export const targets = (d: Design) => d.nodes.filter((n) => ['vm', 'lb', 'appgw', 'storage', 'sql'].includes(n.kind));
export const sources = (d: Design) => [{ id: 'internet', name: '🌍 Internet' }, ...(ofKind(d, 'onprem').length ? [{ id: 'onprem', name: '🏢 On-premises' }] : []), ...ofKind(d, 'vm').map((v) => ({ id: v.id, name: `🖥️ ${v.name}` }))];

export function simulate(d: Design, from: From, toId: string, port: number): TrafficResult {
  const to = byId(d, toId);
  const hops: Hop[] = [];
  const path: string[] = [];
  const done = (ok: boolean, verdict: string): TrafficResult => ({ ok, path, hops, verdict });
  const hop = (node: string, text: string, ok = true) => { hops.push({ node, text, ok }); if (!path.includes(node)) path.push(node); return ok; };
  if (!to) return done(false, 'Pick a destination.');

  /* ---------- from the internet ---------- */
  if (from === 'internet') {
    if (to.kind === 'storage' || to.kind === 'sql') {
      if (to.props.publicAccess === 'Disabled') { hop(to.id, `${to.name}: public network access is Disabled, so the public endpoint refuses the request.`, false); return done(false, 'Blocked: the service is private only.'); }
      hop(to.id, `${to.name}: public endpoint accepts the connection (it still needs a valid key, SAS or Entra ID token).`);
      return done(true, 'Reached over the public endpoint.');
    }
    if (to.kind === 'vm') return viaVmPip(to);
    if (to.kind === 'lb') {
      if (to.props.type !== 'Public') { hop(to.id, `${to.name} is internal: it has no public frontend.`, false); return done(false, 'Blocked: internal load balancers only answer inside the VNet.'); }
      const pip = linked(d, to.id, 'pip')[0];
      if (!pip) { hop(to.id, `${to.name} has no public IP, so there’s no address to connect to.`, false); return done(false, 'Blocked: no frontend IP.'); }
      hop(pip.id, `${pip.name} (${pip.props.sku}) receives the request on port ${port}.`);
      if (String(port) !== String(to.props.rulePort)) { hop(to.id, `${to.name} has no load-balancing rule for port ${port} (its rule is ${to.props.rulePort}).`, false); return done(false, 'Dropped: no rule for that port.'); }
      hop(to.id, `${to.name} matches its rule on port ${to.props.rulePort} and picks a healthy backend.`);
      return toBackends(to, 'Internet', Number(to.props.rulePort));
    }
    if (to.kind === 'appgw') {
      const pip = linked(d, to.id, 'pip')[0];
      if (!pip) { hop(to.id, `${to.name} has no public IP.`, false); return done(false, 'Blocked: no public frontend.'); }
      hop(pip.id, `${pip.name} receives HTTPS/HTTP on port ${to.props.listenerPort}.`);
      if (String(port) !== String(to.props.listenerPort)) { hop(to.id, `${to.name} has no listener on port ${port}.`, false); return done(false, 'Dropped: no listener on that port.'); }
      hop(to.id, `${to.name}${to.props.waf === 'On' ? ' inspects the request with WAF, then' : ''} forwards it to a backend on port ${to.props.backendPort}.`);
      // The gateway calls backends from its own subnet, so NSGs see VirtualNetwork.
      return toBackends(to, 'VirtualNetwork', Number(to.props.backendPort));
    }
  }

  /* ---------- from on-premises ---------- */
  if (from === 'onprem') {
    const office = ofKind(d, 'onprem')[0];
    hop(office.id, `${office.name} sends traffic to Azure.`);
    const gw = linked(d, office.id, 'vpn')[0];
    if (!gw) { hop(office.id, `${office.name} isn’t connected to a VPN gateway.`, false); return done(false, 'Blocked: no site-to-site connection.'); }
    hop(gw.id, `${gw.name} decrypts the tunnel traffic.`);
    if (to.kind !== 'vm') { hop(to.id, 'In this builder, on-premises traffic can be tested to a VM.', false); return done(false, 'Pick a VM as the destination.'); }
    const gv = vnetOf(d, gw), tv = vnetOf(d, to);
    if (!gv || !tv || !peered(d, gv, tv)) { hop(to.id, `${to.name} isn’t in the gateway’s VNet or a VNet peered with it.`, false); return done(false, 'Blocked: no route from the gateway.'); }
    if (gv.id !== tv.id) hop(tv.id, `Peering carries it to ${tv.name} (in real Azure: allow gateway transit on the hub side and use remote gateways on the spoke side).`);
    const r = inbound(d, to, 'VirtualNetwork', port);
    hop(to.id, `${to.name}: traffic over the gateway counts as VirtualNetwork, ${r.why}.`, r.ok);
    return done(r.ok, r.ok ? 'Reached over the VPN.' : 'Blocked by an NSG.');
  }

  /* ---------- from a VM ---------- */
  const src = byId(d, from);
  if (!src || src.kind !== 'vm') return done(false, 'Pick a source.');
  hop(src.id, `${src.name} sends a packet to port ${port}.`);
  const sv = vnetOf(d, src);
  if (!sv) { hop(src.id, `${src.name} isn’t in a subnet, so it has no network.`, false); return done(false, 'Blocked: the source VM has no network.'); }

  if (to.kind === 'storage' || to.kind === 'sql') {
    const zone = PRIVATELINK_ZONE[to.kind];
    const pe = linked(d, to.id, 'pe').find((p) => { const pv = vnetOf(d, p); return pv && peered(d, sv, pv); });
    const dnsOk = ofKind(d, 'dns').some((z) => z.props.zone === zone && linked(d, z.id, 'dnslink').some((x) => x.id === sv.id));
    if (pe && dnsOk) {
      hop(sv.id, `DNS: the ${zone} zone linked to ${sv.name} answers with ${pe.name}’s private IP.`);
      hop(pe.id, `${pe.name} carries the traffic over Private Link.`);
      hop(to.id, `${to.name} accepts it privately${to.props.publicAccess === 'Disabled' ? ', even though public access is off' : ''}.`);
      return done(true, 'Reached privately through the private endpoint.');
    }
    hop(sv.id, pe ? `DNS: no ${zone} zone is linked to ${sv.name}, so the name resolves to the PUBLIC IP and ${pe.name} is skipped.` : `DNS returns ${to.name}’s public IP (there’s no private endpoint).`, !!pe ? false : true);
    if (to.props.publicAccess === 'Disabled') { hop(to.id, `${to.name}: public network access is Disabled, so the public endpoint refuses it.`, false); return done(false, pe ? 'Blocked: fix the private DNS zone link.' : 'Blocked: add a private endpoint.'); }
    hop(to.id, `${to.name} accepts it on the public endpoint, out over the internet path.`);
    return done(true, 'Reached, but over the public endpoint.');
  }

  if (to.kind === 'vm' || to.kind === 'lb' || to.kind === 'appgw') {
    const dest = to.kind === 'vm' ? to : null;
    const tv = vnetOf(d, to) ?? (to.kind === 'lb' ? vnetOf(d, linked(d, to.id, 'backend')[0] ?? to) : undefined);
    if (!tv) { hop(to.id, `${to.name} isn’t in a VNet the VM can reach.`, false); return done(false, 'Blocked: no network path.'); }
    if (sv.id === tv.id) hop(sv.id, `Same VNet (${sv.name}): the system route sends it straight there.`);
    else if (peered(d, sv, tv)) hop(tv.id, `${sv.name} is peered with ${tv.name}, so the system route sends it across the peering.`);
    else {
      const ssub = subnetOf(d, src);
      const fw = ssub && linked(d, ssub.id, 'route')[0];
      const fv = fw && vnetOf(d, fw);
      if (fw && fv && peered(d, sv, fv) && peered(d, fv, tv)) {
        hop(fw.id, `UDR on ${ssub!.name} sends it to ${fw.name}, which forwards it into ${tv.name}.`);
      } else {
        const hub = ofKind(d, 'vnet').find((h) => peered(d, sv, h) && peered(d, tv, h) && h.id !== sv.id && h.id !== tv.id);
        hop(sv.id, hub ? `No route: ${sv.name} and ${tv.name} are both peered to ${hub.name}, but peering isn’t transitive.` : `No route from ${sv.name} to ${tv.name}: they aren’t peered.`, false);
        return done(false, 'Blocked: next hop None.');
      }
    }
    if (dest) {
      const r = inbound(d, dest, 'VirtualNetwork', port);
      hop(dest.id, `${dest.name}: ${r.why}.`, r.ok);
      return done(r.ok, r.ok ? 'Reached.' : 'Blocked by an NSG.');
    }
    if (to.kind === 'lb') { hop(to.id, `${to.name} picks a healthy backend.`); return toBackends(to, 'VirtualNetwork', Number(to.props.rulePort)); }
    hop(to.id, `${to.name} forwards it to a backend.`);
    return toBackends(to, 'VirtualNetwork', Number(to.props.backendPort));
  }
  return done(false, 'That destination isn’t supported yet.');

  /* ---------- helpers ---------- */
  function viaVmPip(vm: ArchNode): TrafficResult {
    const pip = linked(d, vm.id, 'pip')[0];
    if (!pip) { hop(vm.id, `${vm.name} has no public IP, so the internet can’t address it. (Good, if it sits behind a load balancer or Bastion.)`, false); return done(false, 'Blocked: no public IP on the VM.'); }
    hop(pip.id, `${pip.name} (${pip.props.sku}) receives the packet on port ${port}.`);
    const r = inbound(d, vm, 'Internet', port);
    if (!r.nsgs.length && pip.props.sku !== 'Basic') { hop(vm.id, `${vm.name}: a Standard public IP is closed by default and no NSG allows port ${port}.`, false); return done(false, 'Blocked: add an NSG that allows the port.'); }
    if (!r.nsgs.length) { hop(vm.id, `${vm.name}: Basic public IPs (retired) were open by default, so every port is reachable.`); return done(true, 'Reached, and dangerously open.'); }
    hop(vm.id, `${vm.name}: ${r.why}.`, r.ok);
    return done(r.ok, r.ok ? 'Reached.' : 'Blocked by an NSG.');
  }
  function toBackends(front: ArchNode, source: 'Internet' | 'VirtualNetwork', appPort: number): TrafficResult {
    const be = linked(d, front.id, 'backend');
    if (!be.length) { hop(front.id, `${front.name} has no backends.`, false); return done(false, 'Dropped: empty backend pool.'); }
    const probePort = Number(front.props.probePort ?? front.props.backendPort);
    const healthy = be.filter((vm) => front.kind === 'appgw' || inbound(d, vm, 'AzureLoadBalancer', probePort).ok);
    for (const vm of be.filter((v) => !healthy.includes(v))) hop(vm.id, `${vm.name} is marked Down: the health probe on port ${probePort} is blocked (${inbound(d, vm, 'AzureLoadBalancer', probePort).why}).`, false);
    if (!healthy.length) return done(false, 'Dropped: every backend failed its health probe.');
    const ok = healthy.filter((vm) => inbound(d, vm, source, appPort).ok);
    const vm = ok[0] ?? healthy[0];
    const r = inbound(d, vm, source, appPort);
    hop(vm.id, `${vm.name} (healthy): ${r.why}.`, r.ok);
    if (r.ok && healthy.length > 1) hops[hops.length - 1].text += ` The next request may land on ${healthy.filter((h) => h !== vm).map((h) => h.name).join(' or ')}.`;
    return done(r.ok, r.ok ? `Reached ${vm.name} through ${front.name}.` : 'Blocked by an NSG on the backend.');
  }
}
