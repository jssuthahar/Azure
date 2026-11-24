/**
 * AZ-104 "network" Cloud Shell commands (EDUCATION ONLY): public IPs, subnet
 * updates, NICs, ASGs, route tables, effective rules and routes, Network
 * Watcher troubleshooting (IP flow verify, next hop, connection troubleshoot),
 * Azure Bastion, private DNS, private endpoint DNS zone groups, DNS alias and
 * CNAME records, and Azure Load Balancer. Builds on the base vnet/nsg/dns/
 * private-endpoint commands in cli.ts and world.ts.
 *
 * Network model (simplified, but it follows the real rules):
 * - A NIC sits in one subnet and may have an NSG and ASGs. The subnet may have
 *   an NSG, a route table and service endpoints.
 * - Inbound traffic is checked by the subnet NSG, then the NIC NSG. Outbound:
 *   NIC NSG, then subnet NSG. Lowest priority number wins; defaults at 65000+.
 * - Routes: system routes (VnetLocal, VNetPeering, Internet, None) plus user
 *   routes from the subnet's route table. Longest prefix wins; on a tie a
 *   user route beats a system route. Peering isn't transitive.
 */
import { SimError, run, one, many, has, bool, req, lc, json, out, adm, idOf, type Cmd, type Handler, type AdminOut, type Parsed, type World, type Res } from './kit';
import { cidr } from '../world';

/* ------------------------------------------------------------------ */
/* IP helpers                                                          */
/* ------------------------------------------------------------------ */
const ipN = (ip: string) => ip.split('.').reduce((a, o) => a * 256 + Number(o), 0);
const nIp = (n: number) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.');
const isIp = (s?: string) => !!s && /^\d{1,3}(\.\d{1,3}){3}$/.test(s);
const inC = (ip: string, c: string) => { try { const [a, b] = cidr(c); const n = ipN(ip); return n >= a && n <= b; } catch { return false; } };
const plen = (c: string) => Number(c.split('/')[1] ?? 32);
const PRIVATE = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '100.64.0.0/10'];
const LB_PROBE_IP = '168.63.129.16';
const isPrivate = (ip: string) => PRIVATE.some((c) => inC(ip, c));

/* ------------------------------------------------------------------ */
/* World lookups                                                       */
/* ------------------------------------------------------------------ */
type Sub = { name: string; prefix: string; nsg?: string; routeTable?: string; serviceEndpoints?: string[] };
const st = (w: World) => { const a = adm(w); a.net ??= { pdns: {} as Record<string, PZone>, rr: 0 }; return a.net as { pdns: Record<string, PZone>; rr: number }; };
interface PZone { name: string; rg: string; records: { name: string; type: string; value: string; auto?: boolean }[]; links: { name: string; vnet: string; registration: boolean }[] }

const vnetByName = (w: World, name: string) => w.res.find((r) => r.type === 'vnet' && (lc(r.name) === lc(name) || lc(r.id) === lc(name)));
const vnetOf = (w: World, rg: string, name: string) => w.vnetOf(rg, name);
function subnetOf(v: Res, name: string): Sub {
  const s = (v.props.subnetList ?? []).find((x: Sub) => lc(x.name) === lc(name));
  if (!s) throw new SimError(`Subnet '${name}' was not found in virtual network '${v.name}'.`, 'NotFound');
  return s;
}
const nics = (w: World) => w.res.filter((r) => r.type === 'nic' && r.props.subnet);
const nicByIp = (w: World, ip: string) => nics(w).find((n) => n.props.privateIp === ip);
/** NIC by name, or the NIC that stands in for a VM (nic-web01 belongs to VM web01). */
function nicFor(w: World, rg: string | undefined, ref: string | undefined): Res {
  const r = lc(ref).split('/').pop() ?? '';
  const bare = r.replace(/^vm-/, '');
  const n = nics(w).find((x) => (!rg || lc(x.rg) === lc(rg)) && (lc(x.name) === r || lc(x.props.vm) === r || lc(x.props.vm) === bare));
  if (!n) throw new SimError(`Network interface or VM '${ref}' was not found${rg ? ` in '${rg}'` : ''}. In this practice shell, create one with: az network nic create -g <rg> -n nic-<vm> --vnet-name <vnet> --subnet <subnet>`, 'NotFound');
  return n;
}
const vnetOfIp = (w: World, ip: string) => w.res.find((r) => r.type === 'vnet' && inC(ip, r.props.addressSpace));
const peerings = (v: Res) => (v.props.peerings ?? []) as { name: string; remote: string; state: string; allowForwardedTraffic?: boolean; allowGatewayTransit?: boolean; useRemoteGateways?: boolean; allowVnetAccess?: boolean }[];
const connectedPeers = (w: World, v: Res) => peerings(v).filter((p) => p.state === 'Connected').map((p) => vnetByName(w, p.remote)).filter(Boolean) as Res[];

/** Next free private IP in a subnet: Azure keeps the first four and the last address. */
function freeIp(w: World, v: Res, s: Sub, want?: string) {
  const [a, b] = cidr(s.prefix);
  const used = new Set<string>([
    ...nics(w).map((n) => n.props.privateIp),
    ...w.res.filter((r) => r.type === 'pe').map((r) => r.props.ip),
    ...w.res.filter((r) => r.type === 'lb').flatMap((r) => (r.props.frontends ?? []).map((f: any) => f.ip)),
  ]);
  if (want) {
    if (!inC(want, s.prefix)) throw new SimError(`Private IP ${want} is not in subnet '${s.name}' (${s.prefix}).`, 'PrivateIPAddressNotInSubnet');
    const n = ipN(want);
    if (n < a + 4 || n === b) throw new SimError(`${want} is one of the 5 addresses Azure reserves in ${s.prefix} (network, gateway, 2 x Azure DNS, broadcast).`, 'PrivateIPAddressInReservedRange');
    if (used.has(want)) throw new SimError(`Private IP ${want} is already in use in subnet '${s.name}'.`, 'PrivateIPAddressInUse');
    return want;
  }
  for (let n = a + 4; n < b; n++) if (!used.has(nIp(n))) return nIp(n);
  throw new SimError(`Subnet '${s.name}' (${s.prefix}) has no free addresses left.`, 'SubnetIsFull');
}

/* ------------------------------------------------------------------ */
/* NSG evaluation                                                      */
/* ------------------------------------------------------------------ */
type Dir = 'Inbound' | 'Outbound';
interface Flow { dir: Dir; proto: string; port: number; src: string; dst: string; srcNic?: Res; dstNic?: Res }
const DEFAULTS: Record<Dir, any[]> = {
  Inbound: [
    { name: 'AllowVnetInBound', priority: 65000, access: 'Allow', protocol: '*', port: '*', source: 'VirtualNetwork', dest: 'VirtualNetwork', def: true },
    { name: 'AllowAzureLoadBalancerInBound', priority: 65001, access: 'Allow', protocol: '*', port: '*', source: 'AzureLoadBalancer', dest: '*', def: true },
    { name: 'DenyAllInBound', priority: 65500, access: 'Deny', protocol: '*', port: '*', source: '*', dest: '*', def: true },
  ],
  Outbound: [
    { name: 'AllowVnetOutBound', priority: 65000, access: 'Allow', protocol: '*', port: '*', source: 'VirtualNetwork', dest: 'VirtualNetwork', def: true },
    { name: 'AllowInternetOutBound', priority: 65001, access: 'Allow', protocol: '*', port: '*', source: '*', dest: 'Internet', def: true },
    { name: 'DenyAllOutBound', priority: 65500, access: 'Deny', protocol: '*', port: '*', source: '*', dest: '*', def: true },
  ],
};
function vnetSpaces(w: World, nic?: Res) {
  if (!nic) return [] as string[];
  const v = vnetByName(w, nic.props.vnet);
  if (!v) return [];
  return [v.props.addressSpace, ...connectedPeers(w, v).map((x) => x.props.addressSpace)];
}
function addrMatch(w: World, pref: string, ip: string, nic: Res | undefined, ctxNic: Res | undefined) {
  const p = lc(pref);
  if (!p || p === '*' || p === 'any' || p === '0.0.0.0/0') return true;
  if (p === 'internet') return !isPrivate(ip) && ip !== LB_PROBE_IP;
  if (p === 'azureloadbalancer') return ip === LB_PROBE_IP;
  if (p === 'virtualnetwork') return vnetSpaces(w, ctxNic).some((c) => inC(ip, c)) || vnetSpaces(w, nic).some((c) => inC(ip, c));
  if (isIp(pref)) return pref === ip;
  return inC(ip, pref);
}
const portMatch = (spec: string, port: number) => String(spec ?? '*').split(/[\s,]+/).filter(Boolean).some((x) => {
  if (x === '*' || lc(x) === 'any') return true;
  const [a, b] = x.split('-').map(Number);
  return b ? port >= a && port <= b : port === a;
});
const protoMatch = (r: string, f: string) => !r || r === '*' || lc(r) === 'any' || lc(r) === lc(f);
function rulesOf(w: World, nsg: Res, dir: Dir) {
  const own = (nsg.props.rules ?? []).filter((r: any) => lc(r.direction ?? 'Inbound') === lc(dir));
  return [...own, ...DEFAULTS[dir]].sort((a, b) => a.priority - b.priority);
}
function evalNsg(w: World, nsg: Res, f: Flow) {
  for (const r of rulesOf(w, nsg, f.dir)) {
    if (!protoMatch(r.protocol, f.proto) || !portMatch(r.port, f.port)) continue;
    const srcOk = r.srcAsgs?.length ? r.srcAsgs.some((a: string) => (f.srcNic?.props.asgs ?? []).map(lc).includes(lc(a))) : addrMatch(w, r.source, f.src, f.srcNic, f.dir === 'Inbound' ? f.dstNic : f.srcNic);
    const dstOk = r.destAsgs?.length ? r.destAsgs.some((a: string) => (f.dstNic?.props.asgs ?? []).map(lc).includes(lc(a))) : addrMatch(w, r.dest ?? '*', f.dst, f.dstNic, f.dir === 'Inbound' ? f.dstNic : f.srcNic);
    if (srcOk && dstOk) return { access: r.access === 'Deny' || lc(r.access) === 'deny' ? 'Deny' : 'Allow', rule: `${r.def ? 'defaultSecurityRules' : 'securityRules'}/${r.name}`, nsg: nsg.name, priority: r.priority };
  }
  return { access: 'Allow', rule: '(none)', nsg: nsg.name, priority: 0 };
}
/** The NSGs that apply to a NIC, in the order a packet meets them. */
function nsgChain(w: World, nic: Res, dir: Dir) {
  const v = vnetByName(w, nic.props.vnet);
  const s = v ? (v.props.subnetList ?? []).find((x: Sub) => lc(x.name) === lc(nic.props.subnet)) : undefined;
  const sub = s?.nsg ? w.find('nsg', nic.rg, s.nsg) ?? w.res.find((r) => r.type === 'nsg' && lc(r.name) === lc(s.nsg)) : undefined;
  const own = nic.props.nsg ? w.res.find((r) => r.type === 'nsg' && lc(r.name) === lc(nic.props.nsg)) : undefined;
  const list: { at: string; nsg: Res }[] = [];
  if (sub) list.push({ at: `subnet ${s!.name}`, nsg: sub });
  if (own) list.push({ at: `NIC ${nic.name}`, nsg: own });
  return dir === 'Inbound' ? list : list.reverse();
}
function checkNic(w: World, nic: Res, f: Flow) {
  for (const c of nsgChain(w, nic, f.dir)) {
    const r = evalNsg(w, c.nsg, f);
    if (r.access === 'Deny') return { ...r, at: c.at };
  }
  const chain = nsgChain(w, nic, f.dir);
  const last = chain.length ? evalNsg(w, chain[chain.length - 1].nsg, f) : null;
  return { access: 'Allow', rule: last?.rule ?? '(no NSG on the subnet or NIC)', nsg: last?.nsg ?? '', at: chain.length ? chain.map((c) => c.at).join(' + ') : 'no NSG', priority: last?.priority ?? 0 };
}

/* ------------------------------------------------------------------ */
/* Routes                                                              */
/* ------------------------------------------------------------------ */
interface Route { source: 'Default' | 'User'; state: 'Active' | 'Invalid'; prefix: string; nextHopType: string; nextHopIp?: string; name?: string }
function effectiveRoutes(w: World, nic: Res): Route[] {
  const v = vnetByName(w, nic.props.vnet);
  if (!v) return [];
  const s = (v.props.subnetList ?? []).find((x: Sub) => lc(x.name) === lc(nic.props.subnet)) as Sub | undefined;
  const sys: Route[] = [{ source: 'Default', state: 'Active', prefix: v.props.addressSpace, nextHopType: 'VnetLocal' }];
  for (const p of connectedPeers(w, v)) sys.push({ source: 'Default', state: 'Active', prefix: p.props.addressSpace, nextHopType: 'VNetPeering' });
  const gw = w.res.find((r) => r.type === 'vpngw' && lc(r.props.vnet) === lc(v.name));
  const remoteGw = peerings(v).some((p) => p.useRemoteGateways && p.state === 'Connected');
  if (gw || remoteGw) sys.push({ source: 'Default', state: 'Active', prefix: '192.168.100.0/24', nextHopType: 'VirtualNetworkGateway', name: 'on-premises (learned over the VPN)' });
  sys.push({ source: 'Default', state: 'Active', prefix: '0.0.0.0/0', nextHopType: 'Internet' });
  for (const c of PRIVATE) sys.push({ source: 'Default', state: 'Active', prefix: c, nextHopType: 'None' });
  if (s?.serviceEndpoints?.some((e) => /storage/i.test(e))) sys.push({ source: 'Default', state: 'Active', prefix: '20.60.0.0/16 (Storage public IPs)', nextHopType: 'VirtualNetworkServiceEndpoint' });
  const rt = s?.routeTable ? w.res.find((r) => r.type === 'routetable' && lc(r.name) === lc(s.routeTable)) : undefined;
  const user: Route[] = (rt?.props.routes ?? []).map((r: any) => ({ source: 'User', state: 'Active', prefix: r.prefix, nextHopType: r.nextHopType, nextHopIp: r.nextHopIp, name: r.name }));
  if (rt?.props.disableBgp) for (const r of sys) if (r.nextHopType === 'VirtualNetworkGateway') r.state = 'Invalid';
  for (const u of user) for (const r of sys) if (r.prefix === u.prefix) r.state = 'Invalid';
  return [...sys, ...user];
}
function pickRoute(routes: Route[], ip: string) {
  return routes.filter((r) => r.state === 'Active' && /^\d/.test(r.prefix) && !r.prefix.includes(' ') && inC(ip, r.prefix)).sort((a, b) => plen(b.prefix) - plen(a.prefix) || (a.source === 'User' ? -1 : 1))[0];
}
const routeTable = (routes: Route[]) => {
  const rows = routes.map((r) => ({ Source: r.source, State: r.state, AddressPrefix: r.prefix, NextHopType: r.nextHopType, NextHopIP: r.nextHopIp ?? '' }));
  const cols = ['Source', 'State', 'AddressPrefix', 'NextHopType', 'NextHopIP'];
  const wd = cols.map((c) => Math.max(c.length, ...rows.map((r) => String((r as any)[c]).length)));
  const line = (vals: string[]) => vals.map((x, i) => x.padEnd(wd[i])).join('  ');
  return [line(cols), line(wd.map((n) => '-'.repeat(n))), ...rows.map((r) => line(cols.map((c) => String((r as any)[c]))))].join('\n');
};

/* ------------------------------------------------------------------ */
/* Connection troubleshoot                                             */
/* ------------------------------------------------------------------ */
interface Hop { type: string; address: string; note: string }
function trace(w: World, src: Res, dst: string, port: number, proto = 'Tcp') {
  const hops: Hop[] = [{ type: 'Source', address: src.props.privateIp, note: `${src.name} in ${src.props.vnet}/${src.props.subnet}` }];
  const fail = (reason: string, issue: string) => ({ status: 'Unreachable', reason, issue, hops });
  const dstNic = nicByIp(w, dst);
  const outCheck = checkNic(w, src, { dir: 'Outbound', proto, port, src: src.props.privateIp, dst, srcNic: src, dstNic });
  if (outCheck.access === 'Deny') return fail('NetworkSecurityRule', `Outbound traffic is denied by ${outCheck.rule} in NSG ${outCheck.nsg} (${outCheck.at}).`);
  let at = src;
  let viaNva: Res | undefined;
  for (let k = 0; k < 3; k++) {
    const r = pickRoute(effectiveRoutes(w, at), dst);
    if (!r || r.nextHopType === 'None') {
      const peerOfPeer = !vnetSpaces(w, at).some((c) => inC(dst, c)) && vnetOfIp(w, dst);
      return fail('NoRoute', peerOfPeer
        ? `Next hop type None from ${at.name}: ${dst} is in ${peerOfPeer.name}, which isn't peered with ${at.props.vnet}. VNet peering isn't transitive, so traffic doesn't hop through the hub on its own. Add a user-defined route to an NVA in the hub, or peer the two VNets directly.`
        : `Next hop type None from ${at.name}: there's no route to ${dst}, so Azure drops the packet.`);
    }
    if (r.nextHopType === 'VirtualAppliance') {
      hops.push({ type: 'VirtualAppliance', address: r.nextHopIp ?? '', note: `user route ${r.name ?? ''} (${r.prefix})` });
      const nva = nicByIp(w, r.nextHopIp ?? '');
      if (!nva) return fail('UserDefinedRoute', `The route sends traffic to virtual appliance ${r.nextHopIp}, but nothing has that IP. Traffic is dropped.`);
      if (!nva.props.ipForwarding) return fail('IpForwarding', `The appliance ${nva.name} (${nva.props.privateIp}) received the packet, but IP forwarding is off on its NIC, so Azure drops traffic that isn't addressed to it. Turn it on: az network nic update -g ${nva.rg} -n ${nva.name} --ip-forwarding true (and inside the OS too).`);
      viaNva = nva;
      at = nva;
      continue;
    }
    if (r.nextHopType === 'Internet') {
      hops.push({ type: 'Internet', address: dst, note: 'system route 0.0.0.0/0' });
      return { status: 'Reachable', reason: '', issue: '', hops };
    }
    if (r.nextHopType === 'VirtualNetworkGateway') {
      hops.push({ type: 'VirtualNetworkGateway', address: dst, note: 'learned over the VPN gateway' });
      return { status: 'Reachable', reason: '', issue: '', hops };
    }
    // VnetLocal or VNetPeering: deliver
    if (viaNva && r.nextHopType === 'VNetPeering' && dstNic) {
      const dv = vnetByName(w, dstNic.props.vnet)!;
      const back = peerings(dv).find((p) => lc(p.remote) === lc(at.props.vnet));
      if (back && !back.allowForwardedTraffic) return fail('ForwardedTraffic', `The NVA forwarded the packet into ${dv.name}, but the peering ${back.name} doesn't allow forwarded traffic. Set --allow-forwarded-traffic true on it.`);
    }
    hops.push({ type: r.nextHopType, address: dst, note: r.nextHopType === 'VNetPeering' ? 'over the peering, on the Microsoft backbone' : 'inside the VNet' });
    break;
  }
  if (dstNic) {
    // return path must exist too
    const back = pickRoute(effectiveRoutes(w, dstNic), src.props.privateIp);
    if (!back || back.nextHopType === 'None') return fail('NoRoute', `The packet arrived, but the reply has no route: from ${dstNic.name} the next hop to ${src.props.privateIp} is None. Add the matching user-defined route on the other side too.`);
    const inCheck = checkNic(w, dstNic, { dir: 'Inbound', proto, port, src: src.props.privateIp, dst, srcNic: src, dstNic });
    if (inCheck.access === 'Deny') return fail('NetworkSecurityRule', `Inbound traffic on port ${port} is denied by ${inCheck.rule} in NSG ${inCheck.nsg} (${inCheck.at}).`);
    hops.push({ type: 'Destination', address: dst, note: `${dstNic.name} port ${port} (allowed by ${inCheck.rule})` });
  }
  return { status: 'Reachable', reason: '', issue: '', hops };
}

/* ------------------------------------------------------------------ */
/* Load balancer                                                       */
/* ------------------------------------------------------------------ */
const APP_PORT = 80;
const APP_PATHS = ['/', '/health', '/healthz'];
interface BState { nic: Res; vm: string; up: boolean; why: string; data: { access: string; rule: string; nsg: string; at: string } }
function backendState(w: World, lb: Res, rule: any): BState[] {
  const pool = (lb.props.pools ?? []).find((p: any) => lc(p.name) === lc(rule.pool));
  const probe = (lb.props.probes ?? []).find((p: any) => lc(p.name) === lc(rule.probe));
  return (pool?.members ?? []).map((m: string) => {
    const nic = w.res.find((r) => r.type === 'nic' && lc(r.name) === lc(m))!;
    let up = true, why = 'probe answered';
    if (!probe) why = 'no health probe on the rule, so Azure assumes it is up';
    else if (probe.port !== APP_PORT) { up = false; why = `probe on port ${probe.port}, but the web server listens on ${APP_PORT}`; }
    else if (/^https?$/i.test(probe.protocol) && !APP_PATHS.includes(probe.path ?? '/')) { up = false; why = `HTTP probe to ${probe.path} returns 404, not 200`; }
    else {
      const c = checkNic(w, nic, { dir: 'Inbound', proto: 'Tcp', port: probe.port, src: LB_PROBE_IP, dst: nic.props.privateIp, dstNic: nic });
      if (c.access === 'Deny') { up = false; why = `probe from ${LB_PROBE_IP} (AzureLoadBalancer) is blocked by ${c.rule} in ${c.nsg}`; }
    }
    const client = lb.props.type === 'Public' ? '203.0.113.50' : nIp(cidr(vnetByName(w, nic.props.vnet)!.props.addressSpace)[0] + 100);
    let data = checkNic(w, nic, { dir: 'Inbound', proto: 'Tcp', port: rule.bePort, src: client, dst: nic.props.privateIp, dstNic: nic });
    if (lb.props.type === 'Public' && !nsgChain(w, nic, 'Inbound').length) data = { ...data, access: 'Deny', rule: 'secure by default', nsg: '(none)', at: 'no NSG' };
    return { nic, vm: nic.props.vm, up, why, data };
  });
}

/* ------------------------------------------------------------------ */
/* Command table                                                       */
/* ------------------------------------------------------------------ */
const RG = '--resource-group';
const g = (p: Parsed) => one(p, RG)!;
const nm = (p: Parsed) => one(p, '--name')!;
const words = (p: Parsed, f: string) => many(p, f).flatMap((x) => x.split(/[\s,]+/)).filter(Boolean);
const sku = (s?: string) => (lc(s) === 'basic' ? 'Basic' : lc(s) === 'standard' || !s ? 'Standard' : s);

function pipCreate(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--name', '-n']]);
  const s = sku(one(p, '--sku'));
  const alloc = one(p, '--allocation-method') ?? (s === 'Standard' ? 'Static' : 'Dynamic');
  if (s === 'Basic') {
    w.emit('adm.pip.blocked', { rg: g(p), name: nm(p), sku: s, reason: 'basic-retired' });
    throw new SimError('Basic SKU public IP addresses were retired on 30 September 2025 and new ones can\'t be created. Use --sku Standard (always static, secure by default, zone-redundant where the region has zones).', 'BasicSkuRetired');
  }
  if (lc(alloc) === 'dynamic') {
    w.emit('adm.pip.blocked', { rg: g(p), name: nm(p), sku: s, reason: 'dynamic' });
    throw new SimError('Standard SKU public IP addresses only support static allocation. Use --allocation-method Static.', 'StandardSkuPublicIPAddressesMustBeStatic');
  }
  const zones = words(p, '--zone');
  const last = w.res.filter((r) => r.type === 'pip').length;
  const pip = w.addRes('pip', g(p), nm(p), { address: `20.${80 + (nm(p).length % 90)}.${17 + last}.${10 + (nm(p).length * 7) % 230}`, sku: 'Standard', allocation: 'Static', zones: zones.length ? zones : ['1', '2', '3'], tier: one(p, '--tier') ?? 'Regional', version: one(p, '--version') ?? 'IPv4', routing: one(p, '--ip-tags') ? 'Internet' : 'Microsoft network' }, { location: one(p, '--location') });
  w.emit('adm.pip', { rg: pip.rg, name: pip.name, sku: 'Standard', allocation: 'Static', zones: pip.props.zones, tier: pip.props.tier });
  return out(p, { publicIp: { name: pip.name, ipAddress: pip.props.address, publicIPAllocationMethod: 'Static', publicIPAddressVersion: pip.props.version, sku: { name: 'Standard', tier: pip.props.tier }, zones: pip.props.zones, provisioningState: 'Succeeded' } });
}
function pipShow(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--name', '-n']]);
  const pip = w.need('pip', g(p), nm(p));
  const v: Record<string, unknown> = { id: pip.id, name: pip.name, ipAddress: pip.props.address, publicIPAllocationMethod: pip.props.allocation ?? 'Static', sku: { name: pip.props.sku ?? 'Standard' }, zones: pip.props.zones ?? null, ipConfiguration: pip.props.attachedTo ?? null };
  const q = one(p, '--query');
  if (q) return { out: String((v as any)[q] ?? (q === 'sku.name' ? pip.props.sku : '')) };
  return out(p, v);
}

function subnetUpdate(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--vnet-name', ''], ['--name', '-n']]);
  const v = vnetOf(w, g(p), one(p, '--vnet-name')!);
  w.assertWritable(v.rg, 'update subnet');
  const s = subnetOf(v, nm(p));
  const changed: Record<string, unknown> = {};
  const pre = one(p, '--address-prefixes', '--address-prefix');
  if (pre) {
    const [a, b] = cidr(pre);
    const [va, vb] = cidr(v.props.addressSpace);
    if (a < va || b > vb) throw new SimError(`Subnet prefix ${pre} is not within the VNet address space ${v.props.addressSpace}.`, 'NetcfgSubnetRangeOutsideVnet');
    const clash = (v.props.subnetList as Sub[]).find((x) => x !== s && (() => { const [c, d] = cidr(x.prefix); return a <= d && c <= b; })());
    if (clash) throw new SimError(`Subnet '${s.name}' (${pre}) would overlap subnet '${clash.name}' (${clash.prefix}).`, 'NetcfgSubnetRangesOverlap');
    if (nics(w).some((n) => lc(n.props.vnet) === lc(v.name) && lc(n.props.subnet) === lc(s.name))) throw new SimError(`Subnet '${s.name}' has resources in it. Remove them before you change its address range.`, 'InUseSubnetCannotBeUpdated');
    s.prefix = pre; changed.addressPrefix = pre;
  }
  const nsg = one(p, '--network-security-group', '--nsg');
  if (nsg !== undefined) {
    if (nsg === '' || lc(nsg) === 'null' || lc(nsg) === '""') { delete s.nsg; changed.networkSecurityGroup = null; }
    else { w.setSubnetNsg(v.rg, v.name, s.name, nsg.split('/').pop()!, 'cli'); changed.networkSecurityGroup = s.nsg; }
  }
  const rt = one(p, '--route-table');
  if (rt !== undefined) {
    if (rt === '' || lc(rt) === 'null' || lc(rt) === '""') { delete s.routeTable; changed.routeTable = null; }
    else {
      const t = w.res.find((r) => r.type === 'routetable' && lc(r.name) === lc(rt.split('/').pop()));
      if (!t) throw new SimError(`Route table '${rt}' was not found.`, 'NotFound');
      if (t.location !== v.location) throw new SimError(`Route table '${t.name}' is in ${t.location}, but virtual network '${v.name}' is in ${v.location}. A route table must be in the same region and subscription as the VNet.`, 'InvalidResourceReference');
      s.routeTable = t.name; changed.routeTable = t.name;
    }
  }
  if (has(p, '--service-endpoints')) {
    const eps = words(p, '--service-endpoints');
    s.serviceEndpoints = eps; changed.serviceEndpoints = eps;
  }
  if (!Object.keys(changed).length) throw new SimError('Nothing to update. Try --route-table, --network-security-group, --service-endpoints or --address-prefixes.', 'MissingArgs');
  w.emit('adm.subnet.update', { rg: v.rg, vnet: v.name, subnet: s.name, ...changed });
  return out(p, { name: s.name, addressPrefix: s.prefix, networkSecurityGroup: s.nsg ? { id: idOf(w, 'nsg', v.rg, s.nsg) } : null, routeTable: s.routeTable ? { id: idOf(w, 'routetable', v.rg, s.routeTable) } : null, serviceEndpoints: (s.serviceEndpoints ?? []).map((e) => ({ service: e, locations: [v.location], provisioningState: 'Succeeded' })), provisioningState: 'Succeeded' });
}
function subnetIps(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--vnet-name', ''], ['--name', '-n']]);
  const v = vnetOf(w, g(p), one(p, '--vnet-name')!);
  const s = subnetOf(v, nm(p));
  const [a, b] = cidr(s.prefix);
  const total = b - a + 1;
  const usable = Math.max(0, total - 5);
  const used = new Set(nics(w).map((n) => n.props.privateIp));
  const free: string[] = [];
  for (let n = a + 4; n < b && free.length < 5; n++) if (!used.has(nIp(n))) free.push(nIp(n));
  w.emit('adm.subnet.ips', { rg: v.rg, vnet: v.name, subnet: s.name, prefix: s.prefix, total, usable });
  return { out: `${json(free)}\n# ${s.prefix} has ${total} addresses. Azure reserves 5 (${nIp(a)} network, ${nIp(a + 1)} default gateway, ${nIp(a + 2)} and ${nIp(a + 3)} Azure DNS, ${nIp(b)} broadcast), so ${usable} are usable.` };
}

function peeringFlags(pe: any, p: Parsed) {
  if (has(p, '--allow-vnet-access')) pe.allowVnetAccess = bool(p, '--allow-vnet-access', true);
  if (has(p, '--allow-forwarded-traffic')) pe.allowForwardedTraffic = bool(p, '--allow-forwarded-traffic', true);
  if (has(p, '--allow-gateway-transit')) pe.allowGatewayTransit = bool(p, '--allow-gateway-transit', true);
  if (has(p, '--use-remote-gateways')) pe.useRemoteGateways = bool(p, '--use-remote-gateways', true);
  for (const s of many(p, '--set')) {
    const [k, val] = s.split('=');
    if (['allowForwardedTraffic', 'allowGatewayTransit', 'useRemoteGateways', 'allowVirtualNetworkAccess'].includes(k)) pe[k === 'allowVirtualNetworkAccess' ? 'allowVnetAccess' : k] = /^true$/i.test(val ?? '');
  }
}
function checkRemoteGw(w: World, local: Res, pe: any) {
  if (!pe.useRemoteGateways) return;
  const remote = vnetByName(w, pe.remote)!;
  const gw = w.res.find((r) => r.type === 'vpngw' && lc(r.props.vnet) === lc(remote.name));
  const back = peerings(remote).find((x) => lc(x.remote) === lc(local.name));
  if (w.res.some((r) => r.type === 'vpngw' && lc(r.props.vnet) === lc(local.name))) { pe.useRemoteGateways = false; w.emit('adm.peering.blocked', { vnet: local.name, remote: remote.name, reason: 'local-gateway' }); throw new SimError(`'${local.name}' has its own gateway, so it can't use the remote gateway in '${remote.name}'.`, 'VnetHasGateway'); }
  if (!gw) { pe.useRemoteGateways = false; w.emit('adm.peering.blocked', { vnet: local.name, remote: remote.name, reason: 'no-gateway' }); throw new SimError(`'${remote.name}' has no VPN or ExpressRoute gateway, so '${local.name}' can't use remote gateways. Create the gateway in the hub first.`, 'RemoteVnetHasNoGateways'); }
  if (!back?.allowGatewayTransit) { pe.useRemoteGateways = false; w.emit('adm.peering.blocked', { vnet: local.name, remote: remote.name, reason: 'no-transit' }); throw new SimError(`The peering from '${remote.name}' back to '${local.name}' must have --allow-gateway-transit set before '${local.name}' can use its gateway.`, 'RemotePeeringIsNotAllowedToUseGateway'); }
}
const peerOut = (pe: any) => ({ name: pe.name, remoteVirtualNetwork: pe.remote, peeringState: pe.state, peeringSyncLevel: 'FullyInSync', allowVirtualNetworkAccess: pe.allowVnetAccess ?? true, allowForwardedTraffic: !!pe.allowForwardedTraffic, allowGatewayTransit: !!pe.allowGatewayTransit, useRemoteGateways: !!pe.useRemoteGateways });
const PEER_FLAGS = ['--allow-vnet-access', '--allow-forwarded-traffic', '--allow-gateway-transit', '--use-remote-gateways'];
function peeringCreate(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--name', '-n'], ['--vnet-name', ''], ['--remote-vnet', '']]);
  let pe: any;
  try { pe = w.peer(g(p), nm(p), one(p, '--vnet-name')!, one(p, '--remote-vnet')!, 'cli'); }
  catch (e) { if (e instanceof SimError) w.emit('adm.peering.blocked', { vnet: one(p, '--vnet-name'), remote: one(p, '--remote-vnet'), reason: e.code }); throw e; }
  const local = vnetOf(w, g(p), one(p, '--vnet-name')!);
  peeringFlags(pe, p);
  checkRemoteGw(w, local, pe);
  w.emit('adm.peering', { vnet: local.name, remote: pe.remote, name: pe.name, state: pe.state, forwarded: !!pe.allowForwardedTraffic, gatewayTransit: !!pe.allowGatewayTransit, useRemoteGateways: !!pe.useRemoteGateways });
  const note = pe.state === 'Connected' ? '' : `\nPeering is 'Initiated'. Create the peering from '${pe.remote}' back to '${local.name}' too, then both show 'Connected'.`;
  return { out: json(peerOut(pe)) + note };
}
function peeringUpdate(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--name', '-n'], ['--vnet-name', '']]);
  const local = vnetOf(w, g(p), one(p, '--vnet-name')!);
  w.assertWritable(local.rg, 'update peering');
  const pe: any = peerings(local).find((x) => lc(x.name) === lc(nm(p)));
  if (!pe) throw new SimError(`Peering '${nm(p)}' was not found on '${local.name}'.`, 'NotFound');
  peeringFlags(pe, p);
  checkRemoteGw(w, local, pe);
  w.emit('adm.peering', { vnet: local.name, remote: pe.remote, name: pe.name, state: pe.state, forwarded: !!pe.allowForwardedTraffic, gatewayTransit: !!pe.allowGatewayTransit, useRemoteGateways: !!pe.useRemoteGateways, update: true });
  return { out: json(peerOut(pe)) };
}

function nicCreate(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--name', '-n'], ['--vnet-name', ''], ['--subnet', '']]);
  const v = vnetOf(w, g(p), one(p, '--vnet-name')!);
  const s = subnetOf(v, one(p, '--subnet')!.split('/').pop()!);
  if (/^(GatewaySubnet|AzureBastionSubnet|AzureFirewallSubnet)$/i.test(s.name)) throw new SimError(`'${s.name}' is reserved for its Azure service. Put VM network interfaces in another subnet.`, 'SubnetReserved');
  const nsg = one(p, '--network-security-group');
  if (nsg) w.need('nsg', g(p), nsg);
  const asgs = words(p, '--application-security-groups').map((a) => a.split('/').pop()!);
  for (const a of asgs) w.need('asg', g(p), a);
  const ip = freeIp(w, v, s, one(p, '--private-ip-address'));
  const name = nm(p);
  const nic = w.addRes('nic', g(p), name, { vnet: v.name, subnet: s.name, privateIp: ip, nsg, asgs, ipForwarding: bool(p, '--ip-forwarding', false), vm: name.replace(/^nic-/i, ''), ipConfig: 'ipconfig1' }, { location: v.location });
  autoRegister(w, nic);
  w.emit('adm.nic', { rg: nic.rg, name, vnet: v.name, subnet: s.name, ip, nsg, asgs, ipForwarding: nic.props.ipForwarding });
  return { out: json({ NewNIC: { name, ipConfigurations: [{ name: 'ipconfig1', privateIPAddress: ip, subnet: { id: `${v.id}/subnets/${s.name}` }, applicationSecurityGroups: asgs.map((a) => ({ id: idOf(w, 'asg', g(p), a) })) }], networkSecurityGroup: nsg ? { id: idOf(w, 'nsg', g(p), nsg) } : null, enableIPForwarding: nic.props.ipForwarding, provisioningState: 'Succeeded' } }) + `\n(Practice shell: ${name} stands in for VM '${nic.props.vm}'. Network Watcher and Bastion commands accept either name.)` };
}
function nicUpdate(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--name', '-n']]);
  const nic = nicFor(w, g(p), nm(p));
  w.assertWritable(nic.rg, 'update network interface');
  const changed: Record<string, unknown> = {};
  const nsg = one(p, '--network-security-group');
  if (nsg !== undefined) {
    if (nsg === '' || lc(nsg) === 'null' || lc(nsg) === '""') nic.props.nsg = undefined;
    else { w.need('nsg', nic.rg, nsg.split('/').pop()!); nic.props.nsg = nsg.split('/').pop(); }
    changed.nsg = nic.props.nsg ?? null;
  }
  if (has(p, '--ip-forwarding')) { nic.props.ipForwarding = bool(p, '--ip-forwarding', true); changed.ipForwarding = nic.props.ipForwarding; }
  if (has(p, '--application-security-groups')) { const a = words(p, '--application-security-groups').map((x) => x.split('/').pop()!); a.forEach((x) => w.need('asg', nic.rg, x)); nic.props.asgs = a; changed.asgs = a; }
  if (!Object.keys(changed).length) throw new SimError('Nothing to update. Try --network-security-group, --ip-forwarding or --application-security-groups.', 'MissingArgs');
  w.emit('adm.nic.update', { rg: nic.rg, name: nic.name, ...changed });
  return out(p, { name: nic.name, enableIPForwarding: !!nic.props.ipForwarding, networkSecurityGroup: nic.props.nsg ? { id: idOf(w, 'nsg', nic.rg, nic.props.nsg) } : null, applicationSecurityGroups: (nic.props.asgs ?? []).map((a: string) => ({ id: idOf(w, 'asg', nic.rg, a) })), provisioningState: 'Succeeded' });
}
function nicList(p: Parsed, w: World): AdminOut {
  const l = nics(w).filter((n) => !one(p, RG) || lc(n.rg) === lc(g(p)));
  const rows = l.map((n) => ({ Name: n.name, VNet: n.props.vnet, Subnet: n.props.subnet, PrivateIp: n.props.privateIp, NSG: n.props.nsg ?? '', ASGs: (n.props.asgs ?? []).join(','), IpForwarding: !!n.props.ipForwarding }));
  return out(p, l.map((n) => ({ name: n.name, privateIp: n.props.privateIp })), rows, ['Name', 'VNet', 'Subnet', 'PrivateIp', 'NSG', 'ASGs', 'IpForwarding']);
}
function effNsg(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--name', '-n']]);
  const nic = nicFor(w, g(p), nm(p));
  const chain = nsgChain(w, nic, 'Inbound');
  w.emit('adm.effective.nsg', { rg: nic.rg, nic: nic.name, nsgs: chain.map((c) => c.nsg.name) });
  if (!chain.length) return { out: `No NSG is associated with ${nic.name} or its subnet ${nic.props.subnet}, so every flow is allowed (a Standard public IP or load balancer still needs an NSG to open inbound traffic).` };
  const parts = chain.map((c) => {
    const rows = (['Inbound', 'Outbound'] as Dir[]).flatMap((d) => rulesOf(w, c.nsg, d).map((r: any) => `${String(r.priority).padEnd(8)} ${d.padEnd(9)} ${(r.access === 'Deny' || lc(r.access) === 'deny' ? 'Deny' : 'Allow').padEnd(6)} ${String(r.protocol ?? '*').padEnd(5)} ${String(r.port ?? '*').padEnd(7)} ${(r.srcAsgs?.length ? 'ASG:' + r.srcAsgs.join(',') : r.source ?? '*').padEnd(18)} ${(r.destAsgs?.length ? 'ASG:' + r.destAsgs.join(',') : r.dest ?? '*').padEnd(18)} ${r.def ? 'defaultSecurityRules/' : 'securityRules/'}${r.name}`));
    return `Association: ${c.at}  ·  NSG: ${c.nsg.name}\nPriority Direction Access Proto Port    Source             Destination        Rule\n${rows.join('\n')}`;
  });
  return { out: parts.join('\n\n') + '\n\n# Inbound: the subnet NSG is checked first, then the NIC NSG. Both must allow. Outbound runs the other way.\n# (In real Azure the NIC must be attached to a running VM to show effective rules.)' };
}
function effRoutes(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--name', '-n']]);
  const nic = nicFor(w, g(p), nm(p));
  const r = effectiveRoutes(w, nic);
  w.emit('adm.effective.routes', { rg: nic.rg, nic: nic.name, user: r.filter((x) => x.source === 'User').map((x) => `${x.prefix}>${x.nextHopType}`), userDefault: r.some((x) => x.source === 'User' && x.prefix === '0.0.0.0/0'), serviceEndpoint: r.some((x) => x.nextHopType === 'VirtualNetworkServiceEndpoint'), peering: r.some((x) => x.nextHopType === 'VNetPeering') });
  if (lc(one(p, '--output')) === 'json') return { out: json({ value: r.map((x) => ({ source: x.source, state: x.state, addressPrefix: [x.prefix], nextHopType: x.nextHopType, nextHopIpAddress: x.nextHopIp ? [x.nextHopIp] : [] })) }) };
  return { out: routeTable(r) + '\n# Longest prefix wins. On the same prefix a User route makes the system route Invalid.' };
}

function asgCreate(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--name', '-n']]);
  const a = w.addRes('asg', g(p), nm(p), {}, { location: one(p, '--location') });
  w.emit('adm.asg', { rg: a.rg, name: a.name });
  return out(p, { name: a.name, location: a.location, provisioningState: 'Succeeded', type: 'Microsoft.Network/applicationSecurityGroups' });
}
function nsgRuleCreate(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--nsg-name', ''], ['--name', '-n'], ['--priority', '']]);
  const destAsgs = words(p, '--destination-asgs').map((a) => a.split('/').pop()!);
  const srcAsgs = words(p, '--source-asgs').map((a) => a.split('/').pop()!);
  for (const a of [...destAsgs, ...srcAsgs]) w.need('asg', g(p), a);
  const r: any = { name: nm(p), priority: Number(one(p, '--priority')), port: words(p, '--destination-port-ranges').concat(words(p, '--destination-port-range')).join(',') || '*', access: one(p, '--access') ?? 'Allow', direction: one(p, '--direction') ?? 'Inbound', source: words(p, '--source-address-prefixes').concat(words(p, '--source-address-prefix')).join(',') || '*', dest: words(p, '--destination-address-prefixes').concat(words(p, '--destination-address-prefix')).join(',') || '*', protocol: one(p, '--protocol') ?? 'Tcp', destAsgs, srcAsgs };
  if (r.source.includes(',')) r.source = r.source.split(',')[0];
  w.addNsgRule(g(p), one(p, '--nsg-name')!, r, 'cli');
  w.emit('adm.nsg.rule', { rg: g(p), nsg: one(p, '--nsg-name'), name: r.name, priority: r.priority, access: r.access, direction: r.direction, port: r.port, source: r.source, destAsgs, srcAsgs });
  return out(p, { name: r.name, priority: r.priority, access: r.access, direction: r.direction, protocol: r.protocol, destinationPortRange: r.port, sourceAddressPrefix: srcAsgs.length ? null : r.source, sourceApplicationSecurityGroups: srcAsgs.map((a) => ({ id: idOf(w, 'asg', g(p), a) })), destinationApplicationSecurityGroups: destAsgs.map((a) => ({ id: idOf(w, 'asg', g(p), a) })), provisioningState: 'Succeeded' });
}
function nsgRuleDelete(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--nsg-name', ''], ['--name', '-n']]);
  w.assertWritable(g(p), 'delete security rule');
  w.deleteNsgRule(g(p), one(p, '--nsg-name')!, nm(p), 'cli');
  w.emit('adm.nsg.rule.delete', { rg: g(p), nsg: one(p, '--nsg-name'), name: nm(p) });
  return { out: '' };
}

function rtCreate(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--name', '-n']]);
  const t = w.addRes('routetable', g(p), nm(p), { routes: [] as any[], disableBgp: bool(p, '--disable-bgp-route-propagation', false) }, { location: one(p, '--location') });
  w.emit('adm.rt', { rg: t.rg, name: t.name, disableBgp: t.props.disableBgp });
  return out(p, { name: t.name, location: t.location, disableBgpRoutePropagation: t.props.disableBgp, routes: [], provisioningState: 'Succeeded' });
}
const HOPS = ['VirtualNetworkGateway', 'VnetLocal', 'Internet', 'VirtualAppliance', 'None'];
function routeCreate(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--route-table-name', ''], ['--name', '-n'], ['--address-prefix', ''], ['--next-hop-type', '']]);
  const t = w.need('routetable', g(p), one(p, '--route-table-name')!);
  w.assertWritable(t.rg, 'create route');
  const hop = HOPS.find((h) => lc(h) === lc(one(p, '--next-hop-type')));
  if (!hop) throw new SimError(`--next-hop-type must be one of: ${HOPS.join(', ')}.`, 'InvalidNextHopType');
  const prefix = one(p, '--address-prefix')!;
  if (/^\d/.test(prefix)) cidr(prefix);
  const ipAddr = one(p, '--next-hop-ip-address');
  if (hop === 'VirtualAppliance' && !isIp(ipAddr)) throw new SimError('A route with --next-hop-type VirtualAppliance needs --next-hop-ip-address, the private IP of the firewall or NVA (for example 10.0.2.4).', 'NextHopIpAddressRequired');
  if (hop !== 'VirtualAppliance' && ipAddr) throw new SimError(`--next-hop-ip-address is only allowed with VirtualAppliance, not ${hop}.`, 'NextHopIpAddressNotAllowed');
  t.props.routes = (t.props.routes as any[]).filter((r) => lc(r.name) !== lc(nm(p))).concat({ name: nm(p), prefix, nextHopType: hop, nextHopIp: ipAddr });
  w.emit('adm.route', { rg: t.rg, table: t.name, name: nm(p), prefix, nextHopType: hop, nextHopIp: ipAddr });
  return out(p, { name: nm(p), addressPrefix: prefix, nextHopType: hop, nextHopIpAddress: ipAddr ?? null, provisioningState: 'Succeeded' });
}
function rtList(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--route-table-name', '']]);
  const t = w.need('routetable', g(p), one(p, '--route-table-name')!);
  const rows = (t.props.routes as any[]).map((r) => ({ Name: r.name, AddressPrefix: r.prefix, NextHopType: r.nextHopType, NextHopIpAddress: r.nextHopIp ?? '' }));
  return out(p, rows, rows, ['Name', 'AddressPrefix', 'NextHopType', 'NextHopIpAddress']);
}

const nicArg = (p: Parsed, w: World) => (one(p, '--nic') ? nicFor(w, one(p, RG), one(p, '--nic')) : nicFor(w, one(p, RG), one(p, '--vm')));
function ipFlow(p: Parsed, w: World): AdminOut {
  req(p, [['--vm', ''], ['--direction', ''], ['--protocol', ''], ['--local', ''], ['--remote', '']]);
  const nic = nicArg(p, w);
  const [lip, lport] = one(p, '--local')!.split(':');
  const [rip, rport] = one(p, '--remote')!.split(':');
  const dir: Dir = lc(one(p, '--direction')) === 'outbound' ? 'Outbound' : 'Inbound';
  if (lip !== nic.props.privateIp) throw new SimError(`--local must be the VM's own IP (${nic.props.privateIp}) followed by a port, for example ${nic.props.privateIp}:443.`, 'InvalidLocalAddress');
  const proto = lc(one(p, '--protocol')) === 'udp' ? 'Udp' : 'Tcp';
  const f: Flow = dir === 'Inbound' ? { dir, proto, port: Number(lport), src: rip, dst: lip, dstNic: nic, srcNic: nicByIp(w, rip) } : { dir, proto, port: Number(rport), src: lip, dst: rip, srcNic: nic, dstNic: nicByIp(w, rip) };
  const r = checkNic(w, nic, f);
  w.emit('adm.ipflow', { nic: nic.name, vm: nic.props.vm, direction: dir, port: f.port, remote: rip, access: r.access, rule: r.rule, nsg: r.nsg });
  return { out: json({ access: r.access, ruleName: r.nsg ? `${r.nsg}/${r.rule}` : r.rule }) + `\n# ${dir} ${proto} ${f.src} -> ${f.dst}:${f.port} is ${r.access === 'Allow' ? 'ALLOWED' : 'DENIED'} at ${r.at}.` };
}
function nextHop(p: Parsed, w: World): AdminOut {
  req(p, [['--vm', ''], ['--source-ip', ''], ['--dest-ip', '']]);
  const nic = nicArg(p, w);
  const dst = one(p, '--dest-ip')!;
  const r = pickRoute(effectiveRoutes(w, nic), dst);
  const hop = r?.nextHopType ?? 'None';
  const s = (vnetByName(w, nic.props.vnet)?.props.subnetList ?? []).find((x: Sub) => lc(x.name) === lc(nic.props.subnet)) as Sub | undefined;
  w.emit('adm.nexthop', { nic: nic.name, vm: nic.props.vm, dest: dst, nextHopType: hop, nextHopIp: r?.nextHopIp ?? '', user: r?.source === 'User' });
  return { out: json({ nextHopType: hop, nextHopIpAddress: r?.nextHopIp ?? null, routeTableId: r?.source === 'User' && s?.routeTable ? idOf(w, 'routetable', nic.rg, s.routeTable) : 'System Route' }) + (hop === 'None' ? '\n# Next hop None: Azure drops the packet. If the destination is in another spoke, remember peering is not transitive.' : '') };
}
function testConn(p: Parsed, w: World): AdminOut {
  req(p, [['--source-resource', ''], ['--dest-port', '']]);
  const src = nicFor(w, one(p, RG), one(p, '--source-resource'));
  let dst = one(p, '--dest-address');
  const dres = one(p, '--dest-resource');
  if (!dst && dres) dst = nicFor(w, one(p, RG), dres).props.privateIp;
  if (!dst) throw new SimError('Give --dest-address (an IP or host name) or --dest-resource (a VM).', 'MissingArgs');
  if (!isIp(dst)) { const r = w.resolve(dst); if (!r) throw new SimError(`Could not resolve '${dst}'.`, 'DnsResolutionFailed'); dst = r.ip; }
  const port = Number(one(p, '--dest-port'));
  const t = trace(w, src, dst!, port, lc(one(p, '--protocol')) === 'udp' ? 'Udp' : 'Tcp');
  w.emit('adm.connectivity', { source: src.name, dest: dst, port, status: t.status, reason: t.reason });
  const hops = t.hops.map((h, i) => `  ${i + 1}. ${h.type.padEnd(22)} ${h.address.padEnd(15)} ${h.note}`).join('\n');
  return { out: json({ connectionStatus: t.status, avgLatencyInMs: t.status === 'Reachable' ? 2 : null, probesSent: 66, probesFailed: t.status === 'Reachable' ? 0 : 66 }) + `\nHops:\n${hops}${t.issue ? `\nIssue (${t.reason}): ${t.issue}` : ''}` };
}

function bastionCreate(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--name', '-n'], ['--vnet-name', '']]);
  const s0 = one(p, '--sku') ?? 'Standard';
  const skuName = ['Developer', 'Basic', 'Standard', 'Premium'].find((x) => lc(x) === lc(s0));
  if (!skuName) throw new SimError('--sku must be Developer, Basic, Standard or Premium.', 'InvalidSku');
  const v = vnetOf(w, g(p), one(p, '--vnet-name')!);
  const tunneling = bool(p, '--enable-tunneling', false);
  if (skuName !== 'Developer') {
    const sub = (v.props.subnetList as Sub[]).find((x) => x.name === 'AzureBastionSubnet');
    if (!sub) { w.emit('adm.bastion.blocked', { reason: 'no-subnet', vnet: v.name }); throw new SimError(`Virtual network '${v.name}' needs a subnet named exactly 'AzureBastionSubnet' (/26 or larger). Example: az network vnet subnet create -g ${v.rg} --vnet-name ${v.name} -n AzureBastionSubnet --address-prefixes 10.30.3.0/26`, 'BastionSubnetMissing'); }
    if (plen(sub.prefix) > 26) { w.emit('adm.bastion.blocked', { reason: 'subnet-too-small', vnet: v.name, prefix: sub.prefix }); throw new SimError(`AzureBastionSubnet is ${sub.prefix}, but Azure Bastion needs a /26 or larger subnet. Make it /26 (64 addresses) with az network vnet subnet update --address-prefixes.`, 'BastionSubnetTooSmall'); }
    const pipName = one(p, '--public-ip-address');
    if (!pipName) throw new SimError('the following arguments are required: --public-ip-address', 'MissingArgs');
    const pip = w.need('pip', g(p), pipName.split('/').pop()!);
    if (pip.props.sku && pip.props.sku !== 'Standard') throw new SimError('Azure Bastion needs a Standard SKU public IP address.', 'InvalidPublicIpSku');
    pip.props.attachedTo = nm(p);
  }
  if (tunneling && !['Standard', 'Premium'].includes(skuName)) { w.emit('adm.bastion.blocked', { reason: 'tunneling-sku', sku: skuName }); throw new SimError(`Native client support (--enable-tunneling) needs the Standard or Premium SKU, not ${skuName}.`, 'FeatureNotSupportedBySku'); }
  const b = w.addRes('bastion', g(p), nm(p), { vnet: v.name, sku: skuName, tunneling, scaleUnits: Number(one(p, '--scale-units') ?? 2), pip: one(p, '--public-ip-address') }, { location: one(p, '--location') ?? v.location });
  w.emit('adm.bastion', { rg: b.rg, name: b.name, vnet: v.name, sku: skuName, tunneling });
  return { out: json({ name: b.name, sku: { name: skuName }, enableTunneling: tunneling, scaleUnits: b.props.scaleUnits, ipConfigurations: skuName === 'Developer' ? [] : [{ subnet: { id: `${v.id}/subnets/AzureBastionSubnet` }, publicIPAddress: { id: idOf(w, 'pip', g(p), String(b.props.pip)) } }], provisioningState: 'Succeeded' }) + '\n(Simulated: a real Bastion host takes about 10 minutes to deploy.)' };
}
function bastionUpdate(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--name', '-n']]);
  const b = w.need('bastion', g(p), nm(p));
  w.assertWritable(b.rg, 'update bastion');
  const s0 = one(p, '--sku');
  if (s0) {
    const order = ['Developer', 'Basic', 'Standard', 'Premium'];
    const to = order.find((x) => lc(x) === lc(s0));
    if (!to) throw new SimError('--sku must be Basic, Standard or Premium.', 'InvalidSku');
    if (order.indexOf(to) < order.indexOf(b.props.sku)) throw new SimError(`You can upgrade a Bastion SKU but not downgrade it (${b.props.sku} → ${to}). Delete and redeploy instead.`, 'SkuDowngradeNotSupported');
    b.props.sku = to;
  }
  if (has(p, '--enable-tunneling')) {
    const t = bool(p, '--enable-tunneling', true);
    if (t && !['Standard', 'Premium'].includes(b.props.sku)) { w.emit('adm.bastion.blocked', { reason: 'tunneling-sku', sku: b.props.sku }); throw new SimError(`Native client support needs the Standard or Premium SKU. Upgrade with --sku Standard first.`, 'FeatureNotSupportedBySku'); }
    b.props.tunneling = t;
  }
  if (has(p, '--scale-units')) b.props.scaleUnits = Number(one(p, '--scale-units'));
  w.emit('adm.bastion.update', { rg: b.rg, name: b.name, sku: b.props.sku, tunneling: b.props.tunneling });
  return out(p, { name: b.name, sku: { name: b.props.sku }, enableTunneling: b.props.tunneling, scaleUnits: b.props.scaleUnits, provisioningState: 'Succeeded' });
}
function bastionConnect(kind: 'ssh' | 'rdp'): Handler {
  return (p, w) => {
    req(p, [[RG, '-g'], ['--name', '-n'], ['--target-resource-id', '']]);
    const b = w.need('bastion', g(p), nm(p));
    if (!['Standard', 'Premium'].includes(b.props.sku) || !b.props.tunneling) {
      w.emit('adm.bastion.blocked', { reason: 'native-client', name: b.name, sku: b.props.sku });
      throw new SimError(`'az network bastion ${kind}' uses the native client, which needs a Standard or Premium Bastion with native client support turned on. ${b.name} is ${b.props.sku}${b.props.tunneling ? '' : ' with tunneling off'}. Run: az network bastion update -g ${b.rg} -n ${b.name} --sku Standard --enable-tunneling true (or connect from the portal in the browser).`, 'NativeClientNotEnabled');
    }
    const target = one(p, '--target-resource-id')!;
    const nic = nicFor(w, undefined, target);
    const bv = vnetByName(w, b.props.vnet)!;
    if (lc(nic.props.vnet) !== lc(bv.name) && !connectedPeers(w, bv).some((x) => lc(x.name) === lc(nic.props.vnet))) {
      w.emit('adm.bastion.blocked', { reason: 'not-reachable', name: b.name, vm: nic.props.vm });
      throw new SimError(`VM '${nic.props.vm}' is in ${nic.props.vnet}, which is neither ${bv.name} nor peered with it. Bastion reaches VMs in its own VNet and in peered VNets.`, 'TargetNotReachable');
    }
    w.emit('adm.bastion.connect', { name: b.name, vm: nic.props.vm, kind, ip: nic.props.privateIp });
    return { out: kind === 'ssh'
      ? `Opening tunnel through ${b.name} (TLS 443)...\nConnected to ${nic.props.vm} (${nic.props.privateIp}) over its private IP.\nazureuser@${nic.props.vm}:~$\n(Practice shell: the session isn't interactive. No public IP and no open port 22 on the VM were needed.)`
      : `Starting the native RDP client through ${b.name}...\nConnected to ${nic.props.vm} (${nic.props.privateIp}) on its private IP. No public IP or open 3389 needed.\n(Practice shell: no desktop opens here.)` };
  };
}

/* ---------- DNS ---------- */
function autoRegister(w: World, nic: Res) {
  for (const z of Object.values(st(w).pdns)) if (z.links.some((l) => l.registration && lc(l.vnet) === lc(nic.props.vnet)) && !z.records.some((r) => lc(r.name) === lc(nic.props.vm))) {
    z.records.push({ name: nic.props.vm, type: 'A', value: nic.props.privateIp, auto: true });
    w.emit('adm.pdns.autoreg', { zone: z.name, name: nic.props.vm, ip: nic.props.privateIp });
  }
}
const pzone = (w: World, rg: string, name: string) => {
  const z = st(w).pdns[lc(name)];
  if (!z || lc(z.rg) !== lc(rg)) throw new SimError(`Private DNS zone '${name}' was not found in resource group '${rg}'.`, 'ResourceNotFound');
  return z;
};
function pdnsCreate(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--name', '-n']]);
  w.assertWritable(g(p), 'create private DNS zone');
  w.needRg(g(p));
  const name = lc(nm(p));
  if (!/^([a-z0-9-]+\.)+[a-z0-9-]{2,}$/.test(name)) throw new SimError(`'${nm(p)}' is not a valid zone name, such as contoso.internal.`);
  if (st(w).pdns[name]) throw new SimError(`Private DNS zone '${name}' already exists.`, 'Conflict');
  st(w).pdns[name] = { name, rg: g(p), records: [], links: [] };
  w.emit('adm.pdns.zone', { rg: g(p), name });
  return out(p, { name, location: 'global', numberOfRecordSets: 1, numberOfVirtualNetworkLinks: 0, provisioningState: 'Succeeded', type: 'Microsoft.Network/privateDnsZones' });
}
function pdnsList(p: Parsed, w: World): AdminOut {
  const l = Object.values(st(w).pdns);
  const rows = l.map((z) => ({ ZoneName: z.name, ResourceGroup: z.rg, RecordSets: 1 + z.records.length, VNetLinks: z.links.length }));
  return out(p, l.map((z) => ({ name: z.name })), rows, ['ZoneName', 'ResourceGroup', 'RecordSets', 'VNetLinks']);
}
function pdnsLink(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--name', '-n'], ['--zone-name', '-z'], ['--virtual-network', '-v']]);
  const z = pzone(w, g(p), one(p, '--zone-name')!);
  const vref = one(p, '--virtual-network')!;
  const v = vnetByName(w, vref.split('/').pop()!) ?? vnetByName(w, vref);
  if (!v) throw new SimError(`Virtual network '${vref}' was not found.`, 'NotFound');
  const reg = bool(p, '--registration-enabled', false);
  if (reg) {
    const other = Object.values(st(w).pdns).find((x) => x !== z && x.links.some((l) => l.registration && lc(l.vnet) === lc(v.name)));
    if (other) { w.emit('adm.pdns.blocked', { zone: z.name, vnet: v.name, reason: 'one-registration-zone' }); throw new SimError(`'${v.name}' already has auto-registration on with zone '${other.name}'. A virtual network can have only one registration zone (it can still be linked to others for resolution).`, 'BadRequest'); }
  }
  z.links = z.links.filter((l) => lc(l.name) !== lc(nm(p))).concat({ name: nm(p), vnet: v.name, registration: reg });
  if (reg) nics(w).filter((n) => lc(n.props.vnet) === lc(v.name)).forEach((n) => autoRegister(w, n));
  w.emit('adm.pdns.link', { zone: z.name, vnet: v.name, name: nm(p), registration: reg });
  return out(p, { name: nm(p), virtualNetwork: { id: v.id }, registrationEnabled: reg, virtualNetworkLinkState: 'Completed', provisioningState: 'Succeeded' });
}
function pdnsRecord(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--zone-name', '-z'], ['--record-set-name', '-n'], ['--ipv4-address', '-a']]);
  const z = pzone(w, g(p), one(p, '--zone-name')!);
  const ip = one(p, '--ipv4-address')!;
  if (!isIp(ip)) throw new SimError(`'${ip}' is not a valid IPv4 address.`);
  z.records.push({ name: one(p, '--record-set-name')!, type: 'A', value: ip });
  w.emit('adm.pdns.record', { zone: z.name, name: one(p, '--record-set-name'), ip });
  return out(p, { name: one(p, '--record-set-name'), fqdn: `${one(p, '--record-set-name')}.${z.name}.`, aRecords: [{ ipv4Address: ip }], ttl: 3600, isAutoRegistered: false });
}
function pdnsRecList(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--zone-name', '-z']]);
  const z = pzone(w, g(p), one(p, '--zone-name')!);
  const rows = [{ Name: '@', Type: 'SOA', Value: 'azureprivatedns.net', AutoRegistered: false }, ...z.records.map((r) => ({ Name: r.name, Type: r.type, Value: r.value, AutoRegistered: !!r.auto }))];
  return out(p, rows, rows, ['Name', 'Type', 'Value', 'AutoRegistered']);
}
function peZoneGroup(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--endpoint-name', ''], ['--name', '-n'], ['--private-dns-zone', ''], ['--zone-name', '']]);
  const pe = w.need('pe', g(p), one(p, '--endpoint-name')!);
  const zn = one(p, '--private-dns-zone')!.split('/').pop()!;
  const z = st(w).pdns[lc(zn)];
  if (!z) throw new SimError(`Private DNS zone '${zn}' was not found. Create it first: az network private-dns zone create -g ${g(p)} -n privatelink.blob.core.windows.net`, 'NotFound');
  z.records = z.records.filter((r) => lc(r.name) !== lc(pe.props.target)).concat({ name: pe.props.target, type: 'A', value: pe.props.ip });
  pe.props.dnsZone = z.name;
  w.emit('adm.pe.dnsgroup', { rg: g(p), endpoint: pe.name, zone: z.name, record: pe.props.target, ip: pe.props.ip });
  return out(p, { name: nm(p), privateDnsZoneConfigs: [{ name: one(p, '--zone-name'), privateDnsZoneId: `/subscriptions/.../privateDnsZones/${z.name}`, recordSets: [{ fqdn: `${pe.props.target}.${z.name}`, ipAddresses: [pe.props.ip], recordType: 'A' }] }], provisioningState: 'Succeeded' });
}
function dnsZoneShow(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--name', '-n']]);
  const z = w.need('dnszone', g(p), nm(p));
  const v = { id: z.id, name: z.name, nameServers: z.props.nameServers, numberOfRecordSets: 2 + z.props.records.length, zoneType: 'Public' };
  const q = one(p, '--query');
  if (q === 'nameServers') return { out: (z.props.nameServers as string[]).join('\n') };
  return out(p, v);
}
function dnsCname(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--zone-name', '-z'], ['--record-set-name', '-n'], ['--cname', '-c']]);
  const z = w.need('dnszone', g(p), one(p, '--zone-name')!);
  const n = one(p, '--record-set-name')!;
  if (n === '@') { w.emit('adm.dns.blocked', { zone: z.name, reason: 'cname-apex' }); throw new SimError('A CNAME record can\'t be created at the zone apex (@), because the apex already holds the SOA and NS records. Use an alias A record instead: az network dns record-set a create -g <rg> -z <zone> -n @ --target-resource <resource id>.', 'BadRequest'); }
  if (z.props.records.some((r: any) => lc(r.name) === lc(n) && r.type !== 'CNAME')) throw new SimError(`'${n}' already has other records. A CNAME can't share its name with any other record.`, 'Conflict');
  z.props.records = z.props.records.filter((r: any) => !(lc(r.name) === lc(n) && r.type === 'CNAME')).concat({ name: n, type: 'CNAME', value: one(p, '--cname')!.replace(/\.$/, '') });
  w.emit('adm.dns.cname', { zone: z.name, name: n, cname: one(p, '--cname') });
  return out(p, { name: n, fqdn: `${n}.${z.name}.`, CNAMERecord: { cname: one(p, '--cname') }, TTL: 3600, type: 'Microsoft.Network/dnszones/CNAME' });
}
function dnsAliasA(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--zone-name', '-z'], ['--name', '-n']]);
  const z = w.need('dnszone', g(p), one(p, '--zone-name')!);
  const target = one(p, '--target-resource');
  if (!target) throw new SimError('Add --target-resource <public IP resource ID> to make an alias record, or use az network dns record-set a add-record for a plain A record.', 'MissingArgs');
  const pip = w.res.find((r) => r.type === 'pip' && (lc(r.id) === lc(target) || lc(r.name) === lc(target.split('/').pop())));
  if (!pip) throw new SimError(`Target resource '${target}' was not found. Alias A records point at a public IP, Traffic Manager profile, Front Door or CDN endpoint.`, 'NotFound');
  z.props.records = z.props.records.filter((r: any) => !(lc(r.name) === lc(nm(p)) && r.type === 'A')).concat({ name: nm(p), type: 'A', value: pip.props.address, alias: pip.id });
  w.emit('adm.dns.alias', { zone: z.name, name: nm(p), target: pip.name, ip: pip.props.address });
  return out(p, { name: nm(p), fqdn: `${nm(p) === '@' ? '' : nm(p) + '.'}${z.name}.`, targetResource: { id: pip.id }, TTL: 3600, type: 'Microsoft.Network/dnszones/A' });
}

/* ---------- Load balancer ---------- */
const needLb = (w: World, rg: string, name: string) => w.need('lb', rg, name);
function lbCreate(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--name', '-n']]);
  const s = sku(one(p, '--sku'));
  if (s === 'Basic') { w.emit('adm.lb.blocked', { reason: 'basic-retired' }); throw new SimError('Basic SKU load balancers were retired on 30 September 2025. Use --sku Standard.', 'BasicSkuRetired'); }
  if (s === 'Gateway') throw new SimError('Gateway Load Balancer is for chaining third-party NVAs and isn\'t covered in this practice shell. Use --sku Standard.', 'NotSupported');
  const fe = one(p, '--frontend-ip-name') ?? 'LoadBalancerFrontEnd';
  const pool = one(p, '--backend-pool-name') ?? `${nm(p)}bepool`;
  const pipName = one(p, '--public-ip-address');
  let frontend: any;
  let type: 'Public' | 'Internal';
  if (pipName) {
    const pip = w.need('pip', g(p), pipName.split('/').pop()!);
    if (pip.props.sku && pip.props.sku !== 'Standard') throw new SimError('A Standard load balancer needs a Standard public IP address.', 'SkuMismatch');
    if (pip.props.attachedTo) throw new SimError(`Public IP '${pip.name}' is already used by ${pip.props.attachedTo}.`, 'PublicIPAddressInUse');
    pip.props.attachedTo = nm(p);
    frontend = { name: fe, ip: pip.props.address, pip: pip.name };
    type = 'Public';
  } else {
    const vn = one(p, '--vnet-name'), sn = one(p, '--subnet');
    if (!vn || !sn) throw new SimError('Give --public-ip-address for a public load balancer, or --vnet-name and --subnet (optionally --private-ip-address) for an internal one.', 'MissingArgs');
    const v = vnetOf(w, g(p), vn);
    const sub = subnetOf(v, sn);
    frontend = { name: fe, ip: freeIp(w, v, sub, one(p, '--private-ip-address')), vnet: v.name, subnet: sub.name };
    type = 'Internal';
  }
  const lb = w.addRes('lb', g(p), nm(p), { sku: 'Standard', type, frontends: [frontend], pools: [{ name: pool, members: [] as string[] }], probes: [] as any[], rules: [] as any[] }, { location: one(p, '--location') });
  w.emit('adm.lb', { rg: lb.rg, name: lb.name, type, sku: 'Standard', frontendIp: frontend.ip });
  return { out: json({ loadBalancer: { name: lb.name, sku: { name: 'Standard', tier: 'Regional' }, frontendIPConfigurations: [{ name: fe, privateIPAddress: type === 'Internal' ? frontend.ip : null, publicIPAddress: type === 'Public' ? { id: idOf(w, 'pip', g(p), frontend.pip), ipAddress: frontend.ip } : null }], backendAddressPools: [{ name: pool }], provisioningState: 'Succeeded' } }) + `\n# ${type} load balancer. Frontend IP: ${frontend.ip}` };
}
function lbPool(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--lb-name', ''], ['--name', '-n']]);
  const lb = needLb(w, g(p), one(p, '--lb-name')!);
  if (!(lb.props.pools as any[]).some((x) => lc(x.name) === lc(nm(p)))) lb.props.pools.push({ name: nm(p), members: [] });
  w.emit('adm.lb.pool', { lb: lb.name, name: nm(p) });
  return out(p, { name: nm(p), loadBalancerBackendAddresses: [], provisioningState: 'Succeeded' });
}
function lbProbe(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--lb-name', ''], ['--name', '-n'], ['--protocol', ''], ['--port', '']]);
  const lb = needLb(w, g(p), one(p, '--lb-name')!);
  w.assertWritable(lb.rg, 'create probe');
  const protocol = ['Tcp', 'Http', 'Https'].find((x) => lc(x) === lc(one(p, '--protocol')));
  if (!protocol) throw new SimError('--protocol must be Tcp, Http or Https.', 'InvalidProtocol');
  if (protocol !== 'Tcp' && !one(p, '--path')) throw new SimError('An HTTP or HTTPS probe needs --path, for example --path /health. It counts as healthy only on HTTP 200.', 'MissingArgs');
  const probe = { name: nm(p), protocol, port: Number(one(p, '--port')), path: one(p, '--path'), interval: Number(one(p, '--interval') ?? 5) };
  lb.props.probes = (lb.props.probes as any[]).filter((x) => lc(x.name) !== lc(probe.name)).concat(probe);
  w.emit('adm.lb.probe', { lb: lb.name, ...probe });
  return out(p, { name: probe.name, protocol, port: probe.port, requestPath: probe.path ?? null, intervalInSeconds: probe.interval, provisioningState: 'Succeeded' });
}
function lbProbeUpdate(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--lb-name', ''], ['--name', '-n']]);
  const lb = needLb(w, g(p), one(p, '--lb-name')!);
  const probe = (lb.props.probes as any[]).find((x) => lc(x.name) === lc(nm(p)));
  if (!probe) throw new SimError(`Probe '${nm(p)}' was not found on '${lb.name}'.`, 'NotFound');
  if (one(p, '--port')) probe.port = Number(one(p, '--port'));
  if (one(p, '--path')) probe.path = one(p, '--path');
  if (one(p, '--protocol')) probe.protocol = ['Tcp', 'Http', 'Https'].find((x) => lc(x) === lc(one(p, '--protocol'))) ?? probe.protocol;
  w.emit('adm.lb.probe', { lb: lb.name, ...probe, update: true });
  return out(p, { name: probe.name, protocol: probe.protocol, port: probe.port, requestPath: probe.path ?? null, provisioningState: 'Succeeded' });
}
function lbRule(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--lb-name', ''], ['--name', '-n'], ['--protocol', ''], ['--frontend-port', ''], ['--backend-port', '']]);
  const lb = needLb(w, g(p), one(p, '--lb-name')!);
  w.assertWritable(lb.rg, 'create rule');
  const fe = one(p, '--frontend-ip-name', '--frontend-ip') ?? lb.props.frontends[0].name;
  const pool = one(p, '--backend-pool-name') ?? lb.props.pools[0].name;
  const probe = one(p, '--probe-name', '--probe');
  if (probe && !(lb.props.probes as any[]).some((x) => lc(x.name) === lc(probe))) throw new SimError(`Probe '${probe}' was not found on '${lb.name}'. Create it first with az network lb probe create.`, 'NotFound');
  const dist = one(p, '--load-distribution') ?? 'Default';
  const rule = { name: nm(p), protocol: one(p, '--protocol'), fePort: Number(one(p, '--frontend-port')), bePort: Number(one(p, '--backend-port')), fe, pool, probe, dist, floatingIp: bool(p, '--floating-ip', false) };
  lb.props.rules = (lb.props.rules as any[]).filter((x) => lc(x.name) !== lc(rule.name)).concat(rule);
  w.emit('adm.lb.rule', { lb: lb.name, ...rule });
  return out(p, { name: rule.name, protocol: rule.protocol, frontendPort: rule.fePort, backendPort: rule.bePort, loadDistribution: dist, probe: probe ? { id: `${lb.id}/probes/${probe}` } : null, enableFloatingIP: rule.floatingIp, provisioningState: 'Succeeded' });
}
function poolAdd(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--nic-name', ''], ['--ip-config-name', ''], ['--lb-name', ''], ['--address-pool', '']]);
  const nic = nicFor(w, g(p), one(p, '--nic-name'));
  const lb = needLb(w, g(p), one(p, '--lb-name')!);
  const pool = (lb.props.pools as any[]).find((x) => lc(x.name) === lc(one(p, '--address-pool')));
  if (!pool) throw new SimError(`Backend pool '${one(p, '--address-pool')}' was not found on '${lb.name}'.`, 'NotFound');
  const others = (pool.members as string[]).map((m) => w.res.find((r) => r.type === 'nic' && lc(r.name) === lc(m))).filter(Boolean) as Res[];
  if (others.some((o) => lc(o.props.vnet) !== lc(nic.props.vnet))) { w.emit('adm.lb.blocked', { reason: 'vnet-mismatch', nic: nic.name }); throw new SimError(`All NIC-based members of a backend pool must be in the same virtual network. ${nic.name} is in ${nic.props.vnet}; the pool already uses ${others[0].props.vnet}.`, 'BackendAddressPoolVnetMismatch'); }
  if (lb.props.type === 'Internal' && lc(lb.props.frontends[0].vnet) !== lc(nic.props.vnet)) throw new SimError(`Internal load balancer ${lb.name} is in ${lb.props.frontends[0].vnet}; ${nic.name} is in ${nic.props.vnet}.`, 'BackendAddressPoolVnetMismatch');
  if (!pool.members.includes(nic.name)) pool.members.push(nic.name);
  w.emit('adm.lb.member', { lb: lb.name, pool: pool.name, nic: nic.name });
  return out(p, { name: nic.props.ipConfig ?? 'ipconfig1', privateIPAddress: nic.props.privateIp, loadBalancerBackendAddressPools: [{ id: `${lb.id}/backendAddressPools/${pool.name}` }], provisioningState: 'Succeeded' });
}
function lbShow(p: Parsed, w: World): AdminOut {
  req(p, [[RG, '-g'], ['--name', '-n']]);
  const lb = needLb(w, g(p), nm(p));
  return out(p, { name: lb.name, sku: { name: 'Standard' }, type: lb.props.type, frontendIPConfigurations: lb.props.frontends, backendAddressPools: lb.props.pools, probes: lb.props.probes, loadBalancingRules: lb.props.rules });
}

const TABLE: Record<string, Cmd | Handler> = {
  'network public-ip create': pipCreate,
  'network public-ip show': pipShow,
  'network public-ip list': (p, w) => { const l = w.res.filter((r) => r.type === 'pip' && (!one(p, RG) || lc(r.rg) === lc(g(p)))); const rows = l.map((r) => ({ Name: r.name, ResourceGroup: r.rg, IpAddress: r.props.address, Sku: r.props.sku ?? 'Standard', Allocation: r.props.allocation ?? 'Static', Zones: (r.props.zones ?? []).join(',') })); return out(p, rows, rows, ['Name', 'ResourceGroup', 'IpAddress', 'Sku', 'Allocation', 'Zones']); },
  'network vnet subnet update': subnetUpdate,
  'network vnet subnet list-available-ips': subnetIps,
  'network vnet peering create': { run: peeringCreate, when: (p) => PEER_FLAGS.some((f) => has(p, f)) },
  'network vnet peering update': peeringUpdate,
  'network nic create': nicCreate,
  'network nic update': nicUpdate,
  'network nic list': nicList,
  'network nic list-effective-nsg': effNsg,
  'network nic show-effective-route-table': effRoutes,
  'network nic ip-config address-pool add': poolAdd,
  'network asg create': asgCreate,
  'network asg list': (p, w) => { const l = w.res.filter((r) => r.type === 'asg'); const rows = l.map((a) => ({ Name: a.name, ResourceGroup: a.rg, Location: a.location, Members: nics(w).filter((n) => (n.props.asgs ?? []).includes(a.name)).map((n) => n.name).join(',') })); return out(p, rows, rows, ['Name', 'ResourceGroup', 'Location', 'Members']); },
  'network nsg rule create': { run: nsgRuleCreate, when: (p) => has(p, '--destination-asgs') || has(p, '--source-asgs') || has(p, '--destination-address-prefixes') || has(p, '--destination-address-prefix') },
  'network nsg rule delete': nsgRuleDelete,
  'network route-table create': rtCreate,
  'network route-table route create': routeCreate,
  'network route-table route list': rtList,
  'network watcher test-ip-flow': ipFlow,
  'network watcher show-next-hop': nextHop,
  'network watcher test-connectivity': testConn,
  'network bastion create': bastionCreate,
  'network bastion update': bastionUpdate,
  'network bastion ssh': bastionConnect('ssh'),
  'network bastion rdp': bastionConnect('rdp'),
  'network private-dns zone create': pdnsCreate,
  'network private-dns zone list': pdnsList,
  'network private-dns link vnet create': { run: pdnsLink, extra: { '-v': '--virtual-network', '-e': '--registration-enabled', '-z': '--zone-name' } },
  'network private-dns record-set a add-record': { run: pdnsRecord, extra: { '-z': '--zone-name', '-a': '--ipv4-address', '-n': '--record-set-name' } },
  'network private-dns record-set list': { run: pdnsRecList, extra: { '-z': '--zone-name' } },
  'network private-endpoint dns-zone-group create': peZoneGroup,
  'network dns zone show': dnsZoneShow,
  'network dns record-set cname set-record': { run: dnsCname, extra: { '-z': '--zone-name', '-c': '--cname', '-n': '--record-set-name' } },
  'network dns record-set a create': { run: dnsAliasA, extra: { '-z': '--zone-name' } },
  'network lb create': lbCreate,
  'network lb show': lbShow,
  'network lb address-pool create': lbPool,
  'network lb probe create': lbProbe,
  'network lb probe update': lbProbeUpdate,
  'network lb rule create': lbRule,
};

export function az(tokens: string[], w: World): AdminOut | null {
  return run(TABLE, tokens, w);
}

/* ---------- shell tools: nslookup (private DNS, CNAMEs, private endpoints) and curl to a load balancer ---------- */
const stPublicIp = (name: string) => `20.60.${10 + (name.length % 200)}.${30 + (name.length % 100)}`;
function nslookup(host: string, w: World): AdminOut | null {
  const h = lc(host).replace(/\.$/, '');
  const N = st(w);
  // storage account behind a private endpoint
  const acct = w.res.find((r) => r.type === 'storage' && h === `${lc(r.name)}.blob.core.windows.net`);
  const pe = acct && w.res.find((r) => r.type === 'pe' && r.props.target === acct.name);
  if (acct && pe) {
    const z = N.pdns['privatelink.blob.core.windows.net'];
    const linked = z?.links.some((l) => lc(l.vnet) === lc(pe.props.vnet));
    const rec = z?.records.find((r) => lc(r.name) === lc(acct.name));
    const priv = !!(linked && rec);
    w.emit('adm.dns.lookup', { host: h, private: priv, pe: true, ip: priv ? rec!.value : stPublicIp(acct.name) });
    const head = `Server:  168.63.129.16\nAddress: 168.63.129.16#53\n\nNon-authoritative answer:\n${h}  canonical name = ${lc(acct.name)}.privatelink.blob.core.windows.net.`;
    if (priv) return { out: `${head}\nName:    ${lc(acct.name)}.privatelink.blob.core.windows.net\nAddress: ${rec!.value}\n# Private IP: the private DNS zone answered, so traffic goes to the private endpoint.` };
    const why = !z ? 'there is no privatelink.blob.core.windows.net private DNS zone' : !linked ? `the privatelink zone isn't linked to ${pe.props.vnet}` : 'the privatelink zone has no A record for the account (add a DNS zone group)';
    return { out: `${head}\n${lc(acct.name)}.privatelink.blob.core.windows.net  canonical name = blob.${acct.location}.store.core.windows.net.\nName:    blob.${acct.location}.store.core.windows.net\nAddress: ${stPublicIp(acct.name)}\n# Public IP. The private endpoint exists, but ${why}, so clients still go to the public endpoint.` };
  }
  // private DNS zones
  const pz = Object.values(N.pdns).find((z) => h === z.name || h.endsWith('.' + z.name));
  if (pz && !(acct && !pe)) {
    const label = h === pz.name ? '@' : h.slice(0, -pz.name.length - 1);
    if (!pz.links.length) { w.emit('adm.dns.lookup', { host: h, private: false, zone: pz.name, unlinked: true }); return { error: `** server can't find ${h}: NXDOMAIN\n# Private zone ${pz.name} exists but isn't linked to any virtual network, so no VM can resolve it. Add a virtual network link.` }; }
    const rec = pz.records.find((r) => lc(r.name) === label);
    w.emit('adm.dns.lookup', { host: h, private: !!rec, zone: pz.name, ip: rec?.value });
    if (!rec) return { error: `** server can't find ${h}: NXDOMAIN` };
    return { out: `Server:  168.63.129.16\nAddress: 168.63.129.16#53\n\nName:    ${h}\nAddress: ${rec.value}\n# Answered by Azure DNS (168.63.129.16) for VMs in a linked VNet (${pz.links.map((l) => l.vnet).join(', ')})${rec.auto ? '. This record was auto-registered.' : '.'}` };
  }
  // public zone CNAME
  const z = w.res.find((r) => r.type === 'dnszone' && (h === lc(r.name) || h.endsWith('.' + lc(r.name))));
  if (z) {
    const label = h === lc(z.name) ? '@' : h.slice(0, -z.name.length - 1);
    const c = (z.props.records as any[]).find((r) => lc(r.name) === label && r.type === 'CNAME');
    if (c) { w.emit('adm.dns.lookup', { host: h, cname: c.value }); return { out: `Server:  ${z.props.nameServers[0]}\n\n${h}  canonical name = ${c.value}.\nName:    ${c.value}\nAddress: 20.119.8.${10 + (c.value.length % 200)}` }; }
    const a = (z.props.records as any[]).find((r) => lc(r.name) === label && r.alias);
    if (a) { w.emit('adm.dns.lookup', { host: h, alias: true, ip: a.value }); return { out: `Server:  ${z.props.nameServers[0]}\n\nName:    ${h}\nAddress: ${a.value}\n# Alias record: it follows the public IP resource, so it can't go stale.` }; }
  }
  return null;
}
function curl(rest: string[], w: World): AdminOut | null {
  const url = rest.find((x) => !x.startsWith('-'));
  if (!url) return null;
  const m = /^(?:https?:\/\/)?([^/:]+)(?::(\d+))?/i.exec(url);
  if (!m) return null;
  let ip = m[1];
  const port = Number(m[2] ?? (/^https/i.test(url) ? 443 : 80));
  if (!isIp(ip)) {
    const z = w.res.find((r) => r.type === 'dnszone' && (lc(ip) === lc(r.name) || lc(ip).endsWith('.' + lc(r.name))));
    if (!z) return null;
    const label = lc(ip) === lc(z.name) ? '@' : lc(ip).slice(0, -z.name.length - 1);
    const rec = (z.props.records as any[]).find((r) => lc(r.name) === label && r.type === 'A');
    if (!rec) return null;
    ip = rec.value;
  }
  const lb = w.res.find((r) => r.type === 'lb' && (r.props.frontends ?? []).some((f: any) => f.ip === ip));
  if (!lb) return null;
  const rule = (lb.props.rules as any[]).find((r) => r.fePort === port);
  if (!rule) { w.emit('adm.lb.curl', { lb: lb.name, ok: false, reason: 'no-rule', port }); return { error: `curl: (28) Failed to connect to ${m[1]} port ${port}: Connection timed out\n# ${lb.name} has no load-balancing rule for port ${port}. Add one with az network lb rule create.` }; }
  const state = backendState(w, lb, rule);
  const status = state.map((s) => `#   ${s.vm.padEnd(8)} ${s.up ? 'Up  ' : 'Down'}  ${s.why}${s.up && s.data.access === 'Deny' ? `; but client traffic on ${rule.bePort} is blocked (${s.data.rule}${s.data.nsg ? ' in ' + s.data.nsg : ''})` : ''}`).join('\n');
  const ok = state.filter((s) => s.up && s.data.access === 'Allow');
  const up = state.filter((s) => s.up).map((s) => s.nic.name);
  const down = state.filter((s) => !s.up).map((s) => s.nic.name);
  if (!state.length) { w.emit('adm.lb.curl', { lb: lb.name, ok: false, reason: 'empty-pool', up, down }); return { error: `curl: (28) Connection timed out\n# The backend pool '${rule.pool}' is empty. Add NICs with az network nic ip-config address-pool add.` }; }
  if (!ok.length) {
    w.emit('adm.lb.curl', { lb: lb.name, ok: false, reason: up.length ? 'nsg' : 'all-down', up, down });
    const secure = state.some((s) => s.data.rule === 'secure by default');
    return { error: `curl: (28) Failed to connect to ${m[1]} port ${port}: Connection timed out\n# Health probe status (simulated):\n${status}${secure ? '\n# A Standard load balancer is secure by default: with no NSG on the subnet or NIC, inbound traffic is not allowed. Add an NSG that allows the port.' : ''}` };
  }
  const N = st(w);
  const pick = ok[N.rr++ % ok.length];
  w.emit('adm.lb.curl', { lb: lb.name, ok: true, served: pick.nic.name, up, down });
  return { out: `HTTP/1.1 200 OK\nServer: nginx\n\n<h1>Hello from ${pick.vm}</h1>\n# Health probe status (simulated):\n${status}\n# Only healthy backends get new flows. Run curl again to see the distribution.` };
}
export function shell(tokens: string[], w: World): AdminOut | null {
  const [cmd, ...rest] = tokens;
  const c = lc(cmd);
  if (c === 'nslookup' && rest[0]) return nslookup(rest[0], w);
  if (c === 'curl') return curl(rest, w);
  return null;
}

export const COMPLETIONS: string[] = Object.keys(TABLE).map((k) => `az ${k}`).concat(['nslookup', 'curl']);
