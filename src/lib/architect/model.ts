/**
 * Architecture Builder: the design model (EDUCATION ONLY, nothing is deployed).
 * A design is a list of nodes (Azure components) and links between them.
 * VNets contain subnets; subnets contain VMs, private endpoints and the
 * services that need their own subnet. NSGs, public IPs, DNS zones and the
 * outside world (Internet, on-premises) attach with links.
 */

export type Kind =
  | 'vnet' | 'subnet' | 'vm' | 'nsg' | 'pip' | 'lb' | 'appgw' | 'storage' | 'sql'
  | 'pe' | 'vpngw' | 'dns' | 'firewall' | 'bastion' | 'onprem';

export interface NsgRule { name: string; priority: number; source: 'Internet' | 'VirtualNetwork' | 'AzureLoadBalancer' | 'Any'; port: number | '*'; access: 'Allow' | 'Deny' }
export interface ArchNode { id: string; kind: Kind; name: string; x: number; y: number; parent?: string; props: Record<string, any> }
export type LinkKind = 'backend' | 'pe' | 'peer' | 'nsg' | 'pip' | 'dnslink' | 'vpn' | 'route';
export interface ArchLink { id: string; from: string; to: string; kind: LinkKind }
export interface Design { v: 1; name: string; nodes: ArchNode[]; links: ArchLink[] }

export interface Field { key: string; label: string; type: 'text' | 'select' | 'number'; options?: string[]; hint?: string }
export interface KindInfo {
  label: string; icon: string; group: 'Networking' | 'Compute' | 'Data' | 'Security' | 'Connectivity';
  /** Kinds this one can sit inside (none = free on the canvas). */
  parents: Kind[];
  container?: boolean;
  defaults: () => Record<string, any>;
  fields: Field[];
  blurb: string;
  /** AZ-104 lesson that teaches it. */
  lesson?: string;
}

const ZONES = ['None', '1', '2', '3'];
export const CATALOG: Record<Kind, KindInfo> = {
  vnet: { label: 'Virtual network', icon: '🕸️', group: 'Networking', parents: [], container: true, defaults: () => ({ addressSpace: '10.0.0.0/16', region: 'West Europe' }), fields: [{ key: 'addressSpace', label: 'Address space', type: 'text', hint: 'CIDR, e.g. 10.0.0.0/16' }, { key: 'region', label: 'Region', type: 'select', options: ['West Europe', 'North Europe', 'East US', 'Central India', 'Southeast Asia'] }], blurb: 'A private network in one region. Subnets go inside it.', lesson: 'networking/vnets-subnets-and-public-ips' },
  subnet: { label: 'Subnet', icon: '▦', group: 'Networking', parents: ['vnet'], container: true, defaults: () => ({ prefix: '10.0.1.0/24' }), fields: [{ key: 'prefix', label: 'Address prefix', type: 'text', hint: 'Must sit inside the VNet range' }], blurb: 'A slice of the VNet. Azure keeps 5 addresses in every subnet. Some services need a subnet with a fixed name.', lesson: 'networking/vnets-subnets-and-public-ips' },
  vm: { label: 'Virtual machine', icon: '🖥️', group: 'Compute', parents: ['subnet'], defaults: () => ({ os: 'Linux', size: 'Standard_B2s', zone: 'None', appPort: '80' }), fields: [{ key: 'os', label: 'Operating system', type: 'select', options: ['Linux', 'Windows'] }, { key: 'size', label: 'Size', type: 'select', options: ['Standard_B2s', 'Standard_D2s_v5', 'Standard_D4s_v5', 'Standard_E4s_v5'] }, { key: 'zone', label: 'Availability zone', type: 'select', options: ZONES }, { key: 'appPort', label: 'App listens on port', type: 'select', options: ['80', '443', '8080'] }], blurb: 'Put it in a subnet. Attach a public IP only if the internet must reach it directly.', lesson: 'compute/create-and-size-virtual-machines' },
  nsg: { label: 'Network security group', icon: '🛡️', group: 'Security', parents: [], defaults: () => ({ rules: [] as NsgRule[] }), fields: [], blurb: 'Allow/deny rules by priority. Link it to a subnet or a VM (its NIC). Default rules allow VNet and load balancer traffic and deny the rest inbound.', lesson: 'networking/nsgs-asgs-and-effective-rules' },
  pip: { label: 'Public IP address', icon: '🌐', group: 'Networking', parents: [], defaults: () => ({ sku: 'Standard' }), fields: [{ key: 'sku', label: 'SKU', type: 'select', options: ['Standard', 'Basic'], hint: 'Basic public IPs retired on 30 September 2025' }], blurb: 'Link it to a VM, a public load balancer, an Application Gateway, a VPN gateway, a firewall or Bastion. Standard IPs are closed to inbound traffic until an NSG allows it.', lesson: 'networking/vnets-subnets-and-public-ips' },
  lb: { label: 'Load balancer', icon: '⚖️', group: 'Networking', parents: ['subnet'], defaults: () => ({ type: 'Public', sku: 'Standard', rulePort: '80', probePort: '80' }), fields: [{ key: 'type', label: 'Type', type: 'select', options: ['Public', 'Internal'], hint: 'Public: link a public IP. Internal: place it in a subnet.' }, { key: 'sku', label: 'SKU', type: 'select', options: ['Standard', 'Basic'], hint: 'Basic Load Balancer retired on 30 September 2025' }, { key: 'rulePort', label: 'Load-balancing rule port', type: 'select', options: ['80', '443', '8080'] }, { key: 'probePort', label: 'Health probe port', type: 'select', options: ['80', '443', '8080'] }], blurb: 'Layer 4 (TCP/UDP). Link it to backend VMs. The health probe comes from the AzureLoadBalancer tag, so NSGs must allow it.', lesson: 'networking/azure-load-balancer-for-admins' },
  appgw: { label: 'Application Gateway', icon: '🚪', group: 'Networking', parents: ['subnet'], defaults: () => ({ waf: 'Off', listenerPort: '443', backendPort: '80' }), fields: [{ key: 'waf', label: 'Web application firewall', type: 'select', options: ['Off', 'On'] }, { key: 'listenerPort', label: 'Listener port', type: 'select', options: ['80', '443'] }, { key: 'backendPort', label: 'Backend port', type: 'select', options: ['80', '443', '8080'] }], blurb: 'Layer 7 (HTTP/HTTPS) load balancer with URL routing and an optional WAF. It needs a subnet of its own.', lesson: 'networking/azure-load-balancer-for-admins' },
  storage: { label: 'Storage account', icon: '🗄️', group: 'Data', parents: [], defaults: () => ({ publicAccess: 'Enabled', redundancy: 'ZRS' }), fields: [{ key: 'publicAccess', label: 'Public network access', type: 'select', options: ['Enabled', 'Disabled'] }, { key: 'redundancy', label: 'Redundancy', type: 'select', options: ['LRS', 'ZRS', 'GRS', 'GZRS'] }], blurb: 'A PaaS service with a public endpoint. A private endpoint gives it a private IP in your VNet.', lesson: 'storage/storage-firewalls-and-virtual-networks' },
  sql: { label: 'Azure SQL Database', icon: '🛢️', group: 'Data', parents: [], defaults: () => ({ publicAccess: 'Enabled' }), fields: [{ key: 'publicAccess', label: 'Public network access', type: 'select', options: ['Enabled', 'Disabled'] }], blurb: 'Managed SQL with a public endpoint. Reach it privately with a private endpoint and private DNS.', lesson: 'networking/service-endpoints-and-private-endpoints' },
  pe: { label: 'Private endpoint', icon: '🔒', group: 'Networking', parents: ['subnet'], defaults: () => ({}), fields: [], blurb: 'A NIC in your subnet that maps to one storage account or database. Link it to the service, and link a private DNS zone to the VNet.', lesson: 'networking/service-endpoints-and-private-endpoints' },
  vpngw: { label: 'VPN gateway', icon: '🚇', group: 'Connectivity', parents: ['subnet'], defaults: () => ({ sku: 'VpnGw1AZ' }), fields: [{ key: 'sku', label: 'SKU', type: 'select', options: ['VpnGw1AZ', 'VpnGw2AZ', 'VpnGw3AZ'] }], blurb: 'Encrypted tunnel to on-premises. It must sit in a subnet named GatewaySubnet (/27 or larger).', lesson: 'networking/configure-vnet-peering' },
  dns: { label: 'Private DNS zone', icon: '📒', group: 'Networking', parents: [], defaults: () => ({ zone: 'privatelink.blob.core.windows.net' }), fields: [{ key: 'zone', label: 'Zone name', type: 'select', options: ['privatelink.blob.core.windows.net', 'privatelink.database.windows.net', 'contoso.internal'] }], blurb: 'Answers names for VNets you link it to. Private endpoints need the matching privatelink zone.', lesson: 'networking/azure-dns-zones-and-records' },
  firewall: { label: 'Azure Firewall', icon: '🔥', group: 'Security', parents: ['subnet'], defaults: () => ({}), fields: [], blurb: 'Central, stateful firewall. It must sit in AzureFirewallSubnet (/26). Link a subnet to it to route that subnet’s traffic through it.', lesson: 'networking/user-defined-routes' },
  bastion: { label: 'Azure Bastion', icon: '🏰', group: 'Security', parents: ['subnet'], defaults: () => ({ sku: 'Standard' }), fields: [{ key: 'sku', label: 'SKU', type: 'select', options: ['Developer', 'Basic', 'Standard', 'Premium'] }], blurb: 'RDP/SSH in the browser with no public IP on the VMs. It must sit in AzureBastionSubnet (/26 or larger).', lesson: 'networking/azure-bastion' },
  onprem: { label: 'On-premises network', icon: '🏢', group: 'Connectivity', parents: [], defaults: () => ({ addressSpace: '192.168.0.0/16' }), fields: [{ key: 'addressSpace', label: 'Address space', type: 'text' }], blurb: 'Your office or datacenter. Link it to a VPN gateway.', lesson: 'networking/configure-vnet-peering' },
};
export const KINDS = Object.keys(CATALOG) as Kind[];

/** Which link a pair of kinds makes (either direction), or null if they can't be linked. */
export function linkKindFor(a: Kind, b: Kind): { kind: LinkKind; from: 'a' | 'b' } | null {
  const pairs: [Kind[], Kind[], LinkKind][] = [
    [['lb', 'appgw'], ['vm'], 'backend'],
    [['pe'], ['storage', 'sql'], 'pe'],
    [['vnet'], ['vnet'], 'peer'],
    [['nsg'], ['subnet', 'vm'], 'nsg'],
    [['pip'], ['vm', 'lb', 'appgw', 'vpngw', 'firewall', 'bastion'], 'pip'],
    [['dns'], ['vnet'], 'dnslink'],
    [['vpngw'], ['onprem'], 'vpn'],
    [['subnet'], ['firewall'], 'route'],
  ];
  for (const [x, y, kind] of pairs) {
    if (x.includes(a) && y.includes(b)) return { kind, from: 'a' };
    if (x.includes(b) && y.includes(a)) return { kind, from: 'b' };
  }
  return null;
}
export const LINK_LABEL: Record<LinkKind, string> = { backend: 'backend pool', pe: 'private link', peer: 'peering', nsg: 'NSG', pip: 'public IP', dnslink: 'DNS link', vpn: 'site-to-site VPN', route: 'UDR 0.0.0.0/0' };

/* ---------------- CIDR maths ---------------- */
export interface Cidr { base: number; bits: number; size: number }
export function cidr(s: string): Cidr | null {
  const m = /^\s*(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})\s*$/.exec(s ?? '');
  if (!m) return null;
  const o = m.slice(1, 5).map(Number);
  const bits = Number(m[5]);
  if (o.some((x) => x > 255) || bits > 32) return null;
  const ip = ((o[0] << 24) >>> 0) + (o[1] << 16) + (o[2] << 8) + o[3];
  const size = 2 ** (32 - bits);
  return { base: ip - (ip % size), bits, size };
}
export const contains = (outer: Cidr, inner: Cidr) => inner.base >= outer.base && inner.base + inner.size <= outer.base + outer.size;
export const overlaps = (a: Cidr, b: Cidr) => a.base < b.base + b.size && b.base < a.base + a.size;

/* ---------------- design helpers ---------------- */
export const byId = (d: Design, id?: string) => d.nodes.find((n) => n.id === id);
export const childrenOf = (d: Design, id: string) => d.nodes.filter((n) => n.parent === id);
export const ofKind = (d: Design, k: Kind) => d.nodes.filter((n) => n.kind === k);
/** Nodes linked to `id` with a link of `kind` (either direction). */
export function linked(d: Design, id: string, kind?: LinkKind): ArchNode[] {
  return d.links.filter((l) => (l.from === id || l.to === id) && (!kind || l.kind === kind)).map((l) => byId(d, l.from === id ? l.to : l.from)!).filter(Boolean);
}
export const subnetOf = (d: Design, n: ArchNode) => (n.kind === 'subnet' ? n : byId(d, n.parent));
export const vnetOf = (d: Design, n: ArchNode): ArchNode | undefined => {
  if (n.kind === 'vnet') return n;
  const s = subnetOf(d, n);
  return s ? byId(d, s.parent) : undefined;
};
/** VNets that can reach each other directly (same VNet or a direct peering). */
export const peered = (d: Design, a: ArchNode, b: ArchNode) => a.id === b.id || linked(d, a.id, 'peer').some((x) => x.id === b.id);

let seq = 0;
export const newId = (k: string) => `${k}-${Date.now().toString(36)}${(seq++).toString(36)}`;
export function makeNode(kind: Kind, x: number, y: number, d?: Design, parent?: string): ArchNode {
  const info = CATALOG[kind];
  const n = d ? d.nodes.filter((z) => z.kind === kind).length + 1 : 1;
  const base: Record<Kind, string> = { vnet: 'vnet', subnet: 'snet', vm: 'vm', nsg: 'nsg', pip: 'pip', lb: 'lb', appgw: 'agw', storage: 'stcontoso', sql: 'sql', pe: 'pe', vpngw: 'vpngw', dns: 'dns', firewall: 'afw', bastion: 'bastion', onprem: 'office' };
  const name = kind === 'storage' ? `stcontoso${String(n).padStart(2, '0')}` : `${base[kind]}-${String(n).padStart(2, '0')}`;
  return { id: newId(kind), kind, name, x, y, parent, props: info.defaults() };
}
export const emptyDesign = (name = 'My design'): Design => ({ v: 1, name, nodes: [], links: [] });

/** Validate a parsed JSON design (import, saved data). */
export function isDesign(x: any): x is Design {
  return !!x && x.v === 1 && Array.isArray(x.nodes) && Array.isArray(x.links)
    && x.nodes.every((n: any) => typeof n.id === 'string' && n.kind in CATALOG && typeof n.x === 'number' && typeof n.y === 'number' && typeof n.props === 'object')
    && x.links.every((l: any) => typeof l.id === 'string' && typeof l.from === 'string' && typeof l.to === 'string');
}
