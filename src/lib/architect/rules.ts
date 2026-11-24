/**
 * Architecture Builder rule checker. Pure functions over a Design, so the same
 * rules drive the Check tab, "Explain my design" and the headless QA check.
 * Rules follow Microsoft Learn (subnet names and sizes, retired Basic SKUs,
 * NSG default rules, private endpoint DNS). Written by us, no AI involved.
 */
import { CATALOG, cidr, contains, overlaps, byId, childrenOf, ofKind, linked, subnetOf, vnetOf, peered, type Design, type ArchNode, type NsgRule } from './model';

export type Level = 'error' | 'warn' | 'tip';
export interface Finding { id: string; level: Level; nodes: string[]; title: string; detail: string; fix: string; lesson?: string }

/* ---------------- NSG evaluation (shared with traffic.ts) ---------------- */
const DEFAULT_IN: NsgRule[] = [
  { name: 'AllowVnetInBound', priority: 65000, source: 'VirtualNetwork', port: '*', access: 'Allow' },
  { name: 'AllowAzureLoadBalancerInBound', priority: 65001, source: 'AzureLoadBalancer', port: '*', access: 'Allow' },
  { name: 'DenyAllInBound', priority: 65500, source: 'Any', port: '*', access: 'Deny' },
];
export type Source = 'Internet' | 'VirtualNetwork' | 'AzureLoadBalancer';
/** First matching rule of one NSG (custom rules by priority, then the defaults). */
export function nsgDecision(nsg: ArchNode, source: Source, port: number): { access: 'Allow' | 'Deny'; rule: string } {
  const rules = [...((nsg.props.rules ?? []) as NsgRule[])].sort((a, b) => a.priority - b.priority).concat(DEFAULT_IN);
  const hit = rules.find((r) => (r.source === 'Any' || r.source === source) && (r.port === '*' || Number(r.port) === port))!;
  return { access: hit.access, rule: hit.name };
}
/** NSGs that filter inbound traffic to a VM: the subnet's, then the NIC's. */
export function nsgsFor(d: Design, vm: ArchNode): ArchNode[] {
  const s = subnetOf(d, vm);
  return [...(s ? linked(d, s.id, 'nsg') : []), ...linked(d, vm.id, 'nsg')];
}
/** Inbound decision for a VM: every NSG in the path must allow. */
export function inbound(d: Design, vm: ArchNode, source: Source, port: number): { ok: boolean; why: string; nsgs: ArchNode[] } {
  const nsgs = nsgsFor(d, vm);
  for (const n of nsgs) {
    const r = nsgDecision(n, source, port);
    if (r.access === 'Deny') return { ok: false, why: `${n.name} denies it (rule ${r.rule})`, nsgs };
  }
  return { ok: true, why: nsgs.length ? `allowed by ${nsgs.map((n) => `${n.name} (${nsgDecision(n, source, port).rule})`).join(' and ')}` : 'no NSG in the path', nsgs };
}
const allowsFromInternet = (n: ArchNode, port: number) => ((n.props.rules ?? []) as NsgRule[]).some((r) => r.access === 'Allow' && (r.source === 'Internet' || r.source === 'Any') && (r.port === '*' || Number(r.port) === port) && nsgDecision(n, 'Internet', port).access === 'Allow');

export const PRIVATELINK_ZONE = { storage: 'privatelink.blob.core.windows.net', sql: 'privatelink.database.windows.net' } as const;

/* ---------------- rules ---------------- */
export function check(d: Design): Finding[] {
  const f: Finding[] = [];
  const add = (x: Finding) => f.push(x);
  const L = (k: keyof typeof CATALOG) => CATALOG[k].lesson;

  if (!d.nodes.length) add({ id: 'empty', level: 'tip', nodes: [], title: 'Start with a virtual network', detail: 'Add a virtual network, then a subnet inside it, then a VM inside the subnet.', fix: 'Pick “Virtual network” in the palette, or load a starter design.' });

  // VNets and subnets
  for (const v of ofKind(d, 'vnet')) {
    const vc = cidr(v.props.addressSpace);
    if (!vc) { add({ id: `vnet-cidr-${v.id}`, level: 'error', nodes: [v.id], title: `${v.name}: address space isn’t valid`, detail: `“${v.props.addressSpace}” isn’t a CIDR range.`, fix: 'Use a private range such as 10.0.0.0/16.', lesson: L('vnet') }); continue; }
    const subs = childrenOf(d, v.id).filter((n) => n.kind === 'subnet');
    for (const s of subs) {
      const sc = cidr(s.props.prefix);
      if (!sc) add({ id: `sub-cidr-${s.id}`, level: 'error', nodes: [s.id], title: `${s.name}: prefix isn’t valid`, detail: `“${s.props.prefix}” isn’t a CIDR range.`, fix: `Use a range inside ${v.props.addressSpace}, such as ${v.props.addressSpace.replace(/\.0\.0\/\d+$/, '.1.0/24')}.`, lesson: L('subnet') });
      else if (!contains(vc, sc)) add({ id: `sub-out-${s.id}`, level: 'error', nodes: [s.id, v.id], title: `${s.name} is outside ${v.name}`, detail: `${s.props.prefix} isn’t inside the VNet’s ${v.props.addressSpace}. Azure refuses to create it.`, fix: `Pick a prefix inside ${v.props.addressSpace}, or add that range to the VNet’s address space.`, lesson: L('subnet') });
    }
    for (let i = 0; i < subs.length; i++) for (let j = i + 1; j < subs.length; j++) {
      const a = cidr(subs[i].props.prefix), b = cidr(subs[j].props.prefix);
      if (a && b && overlaps(a, b)) add({ id: `sub-ovl-${subs[i].id}-${subs[j].id}`, level: 'error', nodes: [subs[i].id, subs[j].id], title: `${subs[i].name} and ${subs[j].name} overlap`, detail: `${subs[i].props.prefix} and ${subs[j].props.prefix} share addresses. Subnets in one VNet can’t overlap.`, fix: 'Give each subnet its own range, for example 10.0.1.0/24 and 10.0.2.0/24.', lesson: L('subnet') });
    }
    for (const p of linked(d, v.id, 'peer')) {
      const pc = cidr(p.props.addressSpace);
      if (pc && v.id < p.id && overlaps(vc, pc)) add({ id: `peer-ovl-${v.id}-${p.id}`, level: 'error', nodes: [v.id, p.id], title: `${v.name} and ${p.name} can’t be peered`, detail: `Their address spaces (${v.props.addressSpace} and ${p.props.addressSpace}) overlap. Peering needs ranges that don’t overlap.`, fix: 'Re-address one VNet, for example 10.1.0.0/16 for the second one.', lesson: 'networking/configure-vnet-peering' });
    }
  }
  for (const s of ofKind(d, 'subnet')) if (!s.parent) add({ id: `sub-orphan-${s.id}`, level: 'error', nodes: [s.id], title: `${s.name} isn’t in a virtual network`, detail: 'A subnet only exists inside a VNet.', fix: 'Drag the subnet into a virtual network box.', lesson: L('subnet') });

  // Things that must live in a subnet
  for (const n of d.nodes.filter((x) => (['vm', 'pe', 'vpngw', 'firewall', 'bastion', 'appgw'] as string[]).includes(x.kind) && !x.parent))
    add({ id: `nosub-${n.id}`, level: 'error', nodes: [n.id], title: `${n.name} isn’t in a subnet`, detail: `A ${CATALOG[n.kind].label.toLowerCase()} gets its IP address from a subnet.`, fix: 'Drag it into a subnet box.', lesson: L(n.kind) });

  // Special subnets
  const special: [ArchNode['kind'], string, number, string][] = [['vpngw', 'GatewaySubnet', 27, 'networking/configure-vnet-peering'], ['bastion', 'AzureBastionSubnet', 26, 'networking/azure-bastion'], ['firewall', 'AzureFirewallSubnet', 26, 'networking/user-defined-routes']];
  for (const [kind, sname, minBits, lesson] of special) for (const n of ofKind(d, kind)) {
    const s = subnetOf(d, n);
    if (!s) continue;
    if (s.name !== sname) add({ id: `subname-${n.id}`, level: 'error', nodes: [n.id, s.id], title: `${n.name} needs a subnet named ${sname}`, detail: `Azure only deploys a ${CATALOG[kind].label.toLowerCase()} into a subnet called exactly “${sname}”. This one is in “${s.name}”.`, fix: `Rename the subnet to ${sname} (select it, change the name) or move ${n.name} into one.`, lesson });
    const c = cidr(s.props.prefix);
    if (c && c.bits > minBits) add({ id: `subsize-${n.id}`, level: kind === 'vpngw' ? 'warn' : 'error', nodes: [s.id], title: `${s.name} is too small (/${c.bits})`, detail: `${CATALOG[kind].label} needs /${minBits} or larger.`, fix: `Use a /${minBits} prefix, for example ${s.props.prefix.replace(/\/\d+$/, `/${minBits}`)}.`, lesson });
    const others = childrenOf(d, s.id).filter((x) => x.kind !== kind);
    if (others.length) add({ id: `subdedicated-${n.id}`, level: 'error', nodes: [s.id, ...others.map((o) => o.id)], title: `${s.name} must only hold the ${CATALOG[kind].label.toLowerCase()}`, detail: `${others.map((o) => o.name).join(', ')} can’t share ${s.name}.`, fix: 'Move the other resources into a normal subnet.', lesson });
  }
  for (const g of ofKind(d, 'appgw')) {
    const s = subnetOf(d, g);
    const others = s ? childrenOf(d, s.id).filter((x) => x.kind !== 'appgw') : [];
    if (others.length) add({ id: `agw-sub-${g.id}`, level: 'error', nodes: [g.id, ...others.map((o) => o.id)], title: `${g.name} needs a dedicated subnet`, detail: `An Application Gateway subnet can only contain Application Gateways. ${others.map((o) => o.name).join(', ')} must move.`, fix: 'Add a subnet just for the gateway (for example snet-agw, /24) and move it there.', lesson: L('appgw') });
    if (!linked(d, g.id, 'pip').length) add({ id: `agw-pip-${g.id}`, level: 'warn', nodes: [g.id], title: `${g.name} has no public IP`, detail: 'Users on the internet can’t reach a gateway without a public frontend IP.', fix: 'Add a Standard public IP and link it to the gateway.', lesson: L('appgw') });
    if (g.props.waf === 'Off' && linked(d, g.id, 'pip').length) add({ id: `agw-waf-${g.id}`, level: 'tip', nodes: [g.id], title: `Turn on WAF for ${g.name}`, detail: 'An internet-facing web app benefits from the web application firewall (OWASP rules).', fix: 'Set Web application firewall to On (WAF_v2 tier).', lesson: L('appgw') });
    if (linked(d, g.id, 'backend').length === 0) add({ id: `agw-be-${g.id}`, level: 'warn', nodes: [g.id], title: `${g.name} has no backends`, detail: 'Requests have nowhere to go.', fix: 'Link the gateway to the VMs that run the app.', lesson: L('appgw') });
  }

  // Public IPs and retired SKUs
  for (const p of ofKind(d, 'pip')) {
    if (p.props.sku === 'Basic') add({ id: `pip-basic-${p.id}`, level: 'error', nodes: [p.id], title: `${p.name} uses the Basic SKU`, detail: 'Basic public IP addresses were retired on 30 September 2025.', fix: 'Change the SKU to Standard.', lesson: L('pip') });
    const users = linked(d, p.id, 'pip');
    if (users.length > 1) add({ id: `pip-multi-${p.id}`, level: 'error', nodes: [p.id, ...users.map((u) => u.id)], title: `${p.name} is linked to ${users.length} resources`, detail: 'One public IP belongs to one resource.', fix: 'Add a separate public IP for each resource.', lesson: L('pip') });
    if (!users.length) add({ id: `pip-idle-${p.id}`, level: 'tip', nodes: [p.id], title: `${p.name} isn’t attached`, detail: 'An unattached Standard public IP still costs money.', fix: 'Link it to a resource or delete it.', lesson: L('pip') });
  }

  // VMs exposed to the internet
  for (const vm of ofKind(d, 'vm')) {
    const pip = linked(d, vm.id, 'pip')[0];
    const nsgs = nsgsFor(d, vm);
    const mgmt = vm.props.os === 'Windows' ? 3389 : 22;
    if (pip && !nsgs.length) add({ id: `vm-nonsg-${vm.id}`, level: pip.props.sku === 'Basic' ? 'error' : 'warn', nodes: [vm.id, pip.id], title: `${vm.name} has a public IP but no NSG`, detail: pip.props.sku === 'Basic' ? 'A Basic public IP is open by default, so every port is exposed to the internet.' : 'A Standard public IP is closed by default, so nothing can reach this VM until an NSG allows it. Add an NSG with only the ports you need.', fix: 'Add an NSG, link it to the subnet, and allow only the app port from Internet.', lesson: L('nsg') });
    for (const n of nsgs) if (pip && allowsFromInternet(n, mgmt)) add({ id: `vm-mgmt-${vm.id}-${n.id}`, level: 'warn', nodes: [vm.id, n.id], title: `${vm.props.os === 'Windows' ? 'RDP' : 'SSH'} to ${vm.name} is open to the internet`, detail: `${n.name} allows port ${mgmt} from Internet. Bots scan for open ${mgmt} ports within minutes.`, fix: ofKind(d, 'bastion').length ? `You already have Bastion: remove the port ${mgmt} rule and connect through it.` : `Remove the port ${mgmt} rule and add Azure Bastion in an AzureBastionSubnet.`, lesson: 'networking/azure-bastion' });
  }

  // Load balancers
  for (const lb of ofKind(d, 'lb')) {
    const pip = linked(d, lb.id, 'pip')[0];
    const be = linked(d, lb.id, 'backend');
    if (lb.props.sku === 'Basic') add({ id: `lb-basic-${lb.id}`, level: 'error', nodes: [lb.id], title: `${lb.name} uses the Basic SKU`, detail: 'Basic Load Balancer was retired on 30 September 2025.', fix: 'Change the SKU to Standard.', lesson: L('lb') });
    if (lb.props.type === 'Public' && !pip) add({ id: `lb-nopip-${lb.id}`, level: 'error', nodes: [lb.id], title: `Public ${lb.name} has no public IP`, detail: 'A public load balancer’s frontend is a public IP address.', fix: 'Link a Standard public IP to it, or set Type to Internal.', lesson: L('lb') });
    if (lb.props.type === 'Internal' && pip) add({ id: `lb-intpip-${lb.id}`, level: 'error', nodes: [lb.id, pip.id], title: `Internal ${lb.name} has a public IP`, detail: 'An internal load balancer’s frontend is a private IP from a subnet.', fix: 'Remove the public IP link, or set Type to Public.', lesson: L('lb') });
    if (lb.props.type === 'Internal' && !lb.parent) add({ id: `lb-intsub-${lb.id}`, level: 'error', nodes: [lb.id], title: `Internal ${lb.name} isn’t in a subnet`, detail: 'Its private frontend IP comes from a subnet.', fix: 'Drag it into a subnet.', lesson: L('lb') });
    if (!be.length) add({ id: `lb-nobe-${lb.id}`, level: 'warn', nodes: [lb.id], title: `${lb.name} has an empty backend pool`, detail: 'Traffic arrives and has nowhere to go.', fix: 'Link the load balancer to two or more VMs.', lesson: L('lb') });
    else if (be.length === 1) add({ id: `lb-onebe-${lb.id}`, level: 'warn', nodes: [lb.id, be[0].id], title: `${lb.name} has only one backend`, detail: 'If that VM fails or reboots for updates, the app is down.', fix: 'Add a second VM, ideally in another availability zone.', lesson: 'compute/vm-availability-and-scale-sets' });
    else if (new Set(be.map((v) => v.props.zone)).size === 1) add({ id: `lb-zones-${lb.id}`, level: 'tip', nodes: be.map((v) => v.id), title: `Spread ${lb.name}’s VMs across zones`, detail: `All backends are in zone “${be[0].props.zone}”. One zone failure takes them all down.`, fix: 'Put the VMs in zones 1, 2 and 3. The SLA rises to 99.99% for two or more VMs across zones.', lesson: 'compute/vm-availability-and-scale-sets' });
    const vnets = new Set(be.map((v) => vnetOf(d, v)?.id));
    if (vnets.size > 1) add({ id: `lb-vnets-${lb.id}`, level: 'error', nodes: [lb.id, ...be.map((v) => v.id)], title: `${lb.name}’s backends are in different VNets`, detail: 'A load balancer’s backend pool must be in one virtual network.', fix: 'Move all backend VMs into the same VNet.', lesson: L('lb') });
    for (const vm of be) {
      const probe = inbound(d, vm, 'AzureLoadBalancer', Number(lb.props.probePort));
      if (!probe.ok) add({ id: `lb-probe-${lb.id}-${vm.id}`, level: 'error', nodes: [vm.id, ...probe.nsgs.map((n) => n.id)], title: `Health probe can’t reach ${vm.name}`, detail: `The probe comes from the AzureLoadBalancer tag on port ${lb.props.probePort}, and ${probe.why}. ${lb.name} marks ${vm.name} Down and sends it nothing.`, fix: 'Allow AzureLoadBalancer (or leave the default AllowAzureLoadBalancerInBound rule unblocked) on the probe port.', lesson: L('lb') });
      if (lb.props.type === 'Public') {
        const app = inbound(d, vm, 'Internet', Number(lb.props.rulePort));
        if (!app.ok) add({ id: `lb-app-${lb.id}-${vm.id}`, level: 'error', nodes: [vm.id, ...app.nsgs.map((n) => n.id)], title: `Users can’t reach ${vm.name} through ${lb.name}`, detail: `A Standard load balancer keeps the client’s IP, so the NSG sees traffic from Internet on port ${lb.props.rulePort}, and ${app.why}.`, fix: `Allow port ${lb.props.rulePort} from Internet in the NSG on the subnet (and on the NIC, if it has one).`, lesson: L('nsg') });
      }
      if (String(vm.props.appPort) !== String(lb.props.rulePort)) add({ id: `lb-port-${lb.id}-${vm.id}`, level: 'warn', nodes: [vm.id, lb.id], title: `${vm.name} listens on ${vm.props.appPort}, ${lb.name} sends ${lb.props.rulePort}`, detail: 'The load-balancing rule’s backend port must match the port the app listens on.', fix: `Set the rule port (or the app port) so both are ${vm.props.appPort}.`, lesson: L('lb') });
    }
  }

  // PaaS: storage and SQL with private endpoints and DNS
  for (const svc of [...ofKind(d, 'storage'), ...ofKind(d, 'sql')]) {
    const pes = linked(d, svc.id, 'pe');
    const zone = PRIVATELINK_ZONE[svc.kind as 'storage' | 'sql'];
    if (pes.length && svc.props.publicAccess === 'Enabled') add({ id: `paas-pub-${svc.id}`, level: 'warn', nodes: [svc.id], title: `${svc.name} is still public`, detail: 'It has a private endpoint, but public network access is still Enabled, so anyone with a key or SAS can reach it from the internet.', fix: 'Set Public network access to Disabled once clients use the private endpoint.', lesson: 'storage/storage-firewalls-and-virtual-networks' });
    if (!pes.length && svc.props.publicAccess === 'Disabled') add({ id: `paas-locked-${svc.id}`, level: 'error', nodes: [svc.id], title: `Nothing can reach ${svc.name}`, detail: 'Public access is Disabled and there’s no private endpoint.', fix: 'Add a private endpoint in a subnet and link it to the service.', lesson: L('pe') });
    if (!pes.length && svc.props.publicAccess === 'Enabled' && ofKind(d, 'vm').length) add({ id: `paas-tip-${svc.id}`, level: 'tip', nodes: [svc.id], title: `Reach ${svc.name} privately`, detail: 'VMs reach it over its public endpoint today.', fix: 'Add a private endpoint and the matching private DNS zone, then disable public access.', lesson: L('pe') });
    for (const pe of pes) {
      const v = vnetOf(d, pe);
      if (!v) continue;
      const ok = ofKind(d, 'dns').some((z) => z.props.zone === zone && linked(d, z.id, 'dnslink').some((x) => x.id === v.id));
      if (!ok) add({ id: `pe-dns-${pe.id}`, level: 'warn', nodes: [pe.id, svc.id], title: `${svc.name} still resolves to its public IP`, detail: `There’s no ${zone} private DNS zone linked to ${v.name}, so VMs get the public address and skip ${pe.name}.`, fix: `Add a private DNS zone “${zone}” and link it to ${v.name}.`, lesson: 'networking/service-endpoints-and-private-endpoints' });
    }
  }
  for (const pe of ofKind(d, 'pe')) if (!linked(d, pe.id, 'pe').length) add({ id: `pe-none-${pe.id}`, level: 'error', nodes: [pe.id], title: `${pe.name} isn’t connected to a service`, detail: 'A private endpoint maps to one storage account or database.', fix: 'Link it to a storage account or Azure SQL Database.', lesson: L('pe') });

  // Hub and spoke: peering isn't transitive
  const vnets = ofKind(d, 'vnet');
  for (let i = 0; i < vnets.length; i++) for (let j = i + 1; j < vnets.length; j++) {
    const a = vnets[i], b = vnets[j];
    if (peered(d, a, b)) continue;
    const hub = vnets.find((h) => h !== a && h !== b && peered(d, a, h) && peered(d, b, h));
    if (!hub) continue;
    const routed = childrenOf(d, a.id).some((s) => linked(d, s.id, 'route').length) && childrenOf(d, b.id).some((s) => linked(d, s.id, 'route').length);
    if (!routed) add({ id: `transit-${a.id}-${b.id}`, level: 'warn', nodes: [a.id, b.id, hub.id], title: `${a.name} and ${b.name} can’t talk through ${hub.name}`, detail: 'VNet peering isn’t transitive. Two spokes peered to the same hub can’t reach each other on their own.', fix: `Add Azure Firewall in ${hub.name} and route both spokes through it (link each spoke subnet to the firewall), or peer the spokes directly.`, lesson: 'networking/user-defined-routes' });
  }

  // Firewall routing and VPN
  for (const fw of ofKind(d, 'firewall')) {
    if (!linked(d, fw.id, 'pip').length) add({ id: `fw-pip-${fw.id}`, level: 'warn', nodes: [fw.id], title: `${fw.name} has no public IP`, detail: 'Azure Firewall needs a public IP for outbound internet traffic.', fix: 'Link a Standard public IP to the firewall.', lesson: L('firewall') });
    for (const s of linked(d, fw.id, 'route')) {
      const sv = vnetOf(d, s), fv = vnetOf(d, fw);
      if (sv && fv && !peered(d, sv, fv)) add({ id: `fw-route-${s.id}`, level: 'error', nodes: [s.id, fw.id], title: `${s.name} routes to a firewall it can’t reach`, detail: `${sv.name} isn’t peered with ${fv.name}, so the next hop is unreachable and traffic is dropped.`, fix: `Peer ${sv.name} with ${fv.name}.`, lesson: L('firewall') });
    }
  }
  for (const g of ofKind(d, 'vpngw')) {
    const op = linked(d, g.id, 'vpn');
    if (!op.length) add({ id: `vpn-none-${g.id}`, level: 'tip', nodes: [g.id], title: `${g.name} has no connection`, detail: 'The gateway is ready but nothing connects to it.', fix: 'Add an on-premises network and link it to the gateway.', lesson: L('vpngw') });
    const v = vnetOf(d, g);
    for (const o of op) {
      const a = cidr(o.props.addressSpace), b = v && cidr(v.props.addressSpace);
      if (a && b && overlaps(a, b)) add({ id: `vpn-ovl-${o.id}`, level: 'error', nodes: [o.id, v!.id], title: `${o.name} overlaps ${v!.name}`, detail: `On-premises ${o.props.addressSpace} and the VNet’s ${v!.props.addressSpace} share addresses, so routes conflict.`, fix: 'Use non-overlapping ranges on each side.', lesson: L('vpngw') });
    }
  }
  for (const b of ofKind(d, 'bastion')) {
    const v = vnetOf(d, b);
    const reach = ofKind(d, 'vm').filter((vm) => { const vv = vnetOf(d, vm); return v && vv && peered(d, v, vv); });
    if (!reach.length) add({ id: `bastion-novm-${b.id}`, level: 'tip', nodes: [b.id], title: `${b.name} has no VMs to reach`, detail: 'Bastion connects to VMs in its own VNet and in peered VNets.', fix: 'Add VMs in this VNet or a peered one.', lesson: L('bastion') });
  }

  const order: Record<Level, number> = { error: 0, warn: 1, tip: 2 };
  return f.sort((a, b) => order[a.level] - order[b.level]);
}

export const summary = (f: Finding[]) => ({ error: f.filter((x) => x.level === 'error').length, warn: f.filter((x) => x.level === 'warn').length, tip: f.filter((x) => x.level === 'tip').length });
export { byId };
