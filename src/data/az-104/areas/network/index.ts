/**
 * AZ-104 "network" area (domain 4: Implement and manage virtual networking):
 * everything this part of the course plugs into the shared engines. The merge
 * files in src/data/az-104/*.ts import these names.
 * 3D builder: src/lib/dc3d/admin/adminnet.ts · Cloud Shell: src/lib/sim/admin/network.ts
 * Labs: src/lib/sim/labs-admin/network.ts · Tours: ./tours.ts
 */
import type { LessonSims } from '../../../az-900/lesson-sims';
import type { Sim3D } from '../../../az-900/sims3d';
import type { Tour } from '../../tour-kit';
import type { ProblemSolution } from '../../../az-900/problem-solution';
import type { FormatItem } from '../../../az-900/exam-items';
import type { SortSet, Riddle } from '../../../az-900/games';
import type { Comparison } from '../../../az-900/compare';
import type { Service } from '../../../az-900/services';
import { TOURS as NET_TOURS } from './tours';

/** Lesson slug → { d3: { mode: 'adminnet', start, intro }, tour: { id, intro } }. */
export const SIMS: Record<string, LessonSims> = {
  'vnets-subnets-and-public-ips': { d3: { mode: 'adminnet', start: 0, intro: 'Count the reserved addresses, then ask for a public IP.' }, tour: { id: 'adm-vnet-subnets-pip', intro: 'Plan a VNet with subnets and create a Standard static public IP.' } },
  'configure-vnet-peering': { d3: { mode: 'adminnet', start: 1, intro: 'Peer a spoke, then try spoke to spoke.' }, tour: { id: 'adm-vnet-peering-transit', intro: 'Peer a spoke with the hub and share the hub gateway.' } },
  'user-defined-routes': { d3: { mode: 'adminnet', start: 2, intro: 'Route through the NVA, then switch IP forwarding off.' }, tour: { id: 'adm-route-table', intro: 'Create a route table, add a route and associate it with a subnet.' } },
  'nsgs-asgs-and-effective-rules': { d3: { mode: 'adminnet', start: 3, intro: 'Send HTTPS, RDP and a packet the NIC NSG blocks.' }, tour: { id: 'adm-nsg-asg-effective', intro: 'Write a rule against an ASG and read the effective rules.' } },
  'azure-bastion': { d3: { mode: 'adminnet', start: 4, intro: 'Connect through Bastion, then try RDP straight to the VM.' }, tour: { id: 'adm-bastion', intro: 'Deploy Bastion and connect to a VM with no public IP.' } },
  'service-endpoints-and-private-endpoints': { d3: { mode: 'adminnet', start: 5, intro: 'Try the service endpoint, the private endpoint, then forget the DNS.' }, tour: { id: 'adm-endpoints-private-dns', intro: 'Add a service endpoint, then a private endpoint with private DNS.' } },
  'azure-dns-zones-and-records': { d3: { mode: 'adminnet', start: 6, intro: 'Resolve a public name, a private name, then from an unlinked VNet.' }, tour: { id: 'adm-dns-zones', intro: 'Host a public zone with an alias record and link a private zone.' } },
  'azure-load-balancer-for-admins': { d3: { mode: 'adminnet', start: 7, intro: 'Send traffic, fail a probe, send traffic again.' }, tour: { id: 'adm-load-balancer', intro: 'Create a Standard load balancer and fix an unhealthy backend.' } },
  'troubleshoot-network-connectivity': { d3: { mode: 'adminnet', start: 8, intro: 'Run each Network Watcher tool and read what it says.' }, tour: { id: 'adm-network-watcher-troubleshoot', intro: 'Use connection troubleshoot, next hop and IP flow verify.' } },
};

/** Narration for the 'adminnet' 3D scene. Step order matches the builder. */
export const SCENE: Sim3D = {
  title: 'Azure networking for admins: hub, spokes, routes, NSGs and load balancing',
  steps: [
    { title: 'VNets, subnets and a public IP', text: 'A **virtual network** is your private range in one region, split into **subnets**. Azure keeps **5 addresses** in every subnet. A **Standard public IP** is static, zone-redundant where the region has zones, and closed to inbound traffic until an NSG opens it.', actions: [{ id: 'reserved', label: '🔢 …we look inside a /29 subnet?', kind: 'ok' }, { id: 'pip', label: '📍 …we ask for a Basic IP, then a Standard one?', kind: 'plain' }] },
    { title: 'Peering is not transitive', text: '**VNet peering** joins two VNets over the Microsoft backbone. Each side has its own link, address spaces can\'t overlap, and the hub can share its VPN gateway (**gateway transit**). Peering never chains: spoke 1 and spoke 2 can\'t talk through the hub on their own.', actions: [{ id: 'peer', label: '🔗 …spoke 1 talks to the hub?', kind: 'ok' }, { id: 'transit', label: '🚫 …spoke 1 tries to reach spoke 2?', kind: 'danger' }] },
    { title: 'User-defined routes to the NVA', text: 'A **route table** on a subnet overrides system routes. Next hop **Virtual appliance** sends traffic to a firewall or NVA, which needs **IP forwarding** on its NIC. Longest prefix wins, and a user route beats a system route on the same prefix.', actions: [{ id: 'udr', label: '🧭 …spoke 1 → spoke 2 with a UDR?', kind: 'ok' }, { id: 'nofwd', label: '🛑 …IP forwarding is off on the NVA?', kind: 'danger' }, { id: 'internet', label: '🌍 …0.0.0.0/0 points at the firewall?', kind: 'plain' }] },
    { title: 'NSGs, ASGs and effective rules', text: 'An **NSG** has rules checked by **priority** (100 to 4096, lowest first). Inbound traffic meets the **subnet NSG first, then the NIC NSG**, and both must allow. An **application security group** lets a rule say "to the web servers" instead of listing IPs.', actions: [{ id: 'https', label: '✅ …HTTPS from the internet to asg-web?', kind: 'ok' }, { id: 'rdp', label: '⛔ …RDP from the internet?', kind: 'danger' }, { id: 'nicblock', label: '🧱 …the NIC has an empty NSG?', kind: 'danger' }] },
    { title: 'Azure Bastion', text: '**Azure Bastion** lives in **AzureBastionSubnet** (/26 or larger) and opens RDP and SSH to VMs on their **private IPs**, from the portal over TLS 443 or with the native client on Standard and Premium. One Bastion in the hub serves peered spokes.', actions: [{ id: 'bastion', label: '🏰 …the admin connects through Bastion?', kind: 'ok' }, { id: 'direct', label: '🚫 …the admin tries RDP straight to the VM?', kind: 'danger' }] },
    { title: 'Service endpoint vs private endpoint', text: 'A **service endpoint** sends a subnet\'s traffic to the service\'s **public** IP over the backbone, and the service firewall allows that subnet. A **private endpoint** gives the service a **private IP** in your VNet, and a **privatelink** private DNS zone makes the name resolve to it.', actions: [{ id: 'se', label: '🛣️ …we use a service endpoint?', kind: 'ok' }, { id: 'pe', label: '🔒 …we use a private endpoint?', kind: 'ok' }, { id: 'nodns', label: '🧭 …the private DNS zone is missing?', kind: 'danger' }] },
    { title: 'Azure DNS: public and private zones', text: 'A **public zone** answers the internet once you delegate the domain to Azure\'s name servers. **Alias records** point at Azure resources such as a public IP. A **private zone** answers only VNets with a **virtual network link**, and can auto-register VM names.', actions: [{ id: 'public', label: '🌐 …a customer looks up www?', kind: 'ok' }, { id: 'private', label: '🔐 …a VM looks up db.contoso.internal?', kind: 'ok' }, { id: 'unlinked', label: '❓ …the VNet isn\'t linked to the zone?', kind: 'danger' }] },
    { title: 'Standard load balancer and health probes', text: 'A **load balancer** spreads TCP/UDP flows from a **frontend** (public or internal) to a **backend pool** by **load-balancing rules**. A **health probe** pulls a VM out of rotation when it stops answering. Probes come from **168.63.129.16**.', actions: [{ id: 'traffic', label: '⚖️ …customers send traffic?', kind: 'ok' }, { id: 'fail', label: '❌ …web02 fails its health probe?', kind: 'danger' }, { id: 'internal', label: '🏠 …we switch to an internal frontend?', kind: 'plain' }] },
    { title: 'Troubleshoot with Network Watcher', text: '**Network Watcher** tools answer one question each. **IP flow verify**: which NSG rule allows or denies this flow? **Next hop**: where does this packet go? **Connection troubleshoot**: can A reach B, and if not, at which hop?', actions: [{ id: 'ipflow', label: '🔍 …we run IP flow verify?', kind: 'danger' }, { id: 'nexthop', label: '🧭 …we ask for the next hop?', kind: 'danger' }, { id: 'connect', label: '✅ …we test the connection after the fix?', kind: 'ok' }] },
  ],
};

export const TOURS: Record<string, Tour> = NET_TOURS;

const ps = (problem: string, solution: string, tool: string, pairs: [string, string, string][]): ProblemSolution => ({ problem, solution, tool, pairs: pairs.map(([icon, pain, fix]) => ({ icon, pain, fix })) });
export const PROBLEMS: Record<string, ProblemSolution> = {
  'vnets-subnets-and-public-ips': ps('The new subnet ran out of addresses after 10 VMs and the IP ranges clash with the office.', 'Plan non-overlapping address spaces, size subnets for growth and use Standard static public IPs.', 'VNets, subnets and public IPs', [['🧮', 'Subnet too small', 'Remember the 5 reserved addresses'], ['💥', 'Ranges overlap on-premises', 'Plan the address space first'], ['🔁', 'Public IP changes after a restart', 'Standard SKU, always static']]),
  'configure-vnet-peering': ps('Each team has its own VNet and its own VPN gateway, and the bill shows it.', 'Peer the spokes to a hub and let them share the hub gateway with gateway transit.', 'VNet peering', [['💸', 'One gateway per VNet', 'Gateway transit from the hub'], ['🌍', 'Traffic over the internet', 'Private backbone peering'], ['🚫', 'Spokes can\'t reach each other', 'Peer directly or route via the hub NVA']]),
  'user-defined-routes': ps('Security says every packet leaving a spoke must pass the hub firewall, and today none do.', 'Add a route table with next hop Virtual appliance and associate it with the spoke subnets.', 'User-defined routes', [['🕳️', 'Traffic skips the firewall', 'UDR to the firewall IP'], ['🛑', 'Firewall drops forwarded packets', 'Turn on IP forwarding'], ['↩️', 'Replies take another path', 'Mirror routes on both sides']]),
  'nsgs-asgs-and-effective-rules': ps('Every new web server means editing five NSG rules with new IP addresses.', 'Group the NICs in an application security group and write rules against the group.', 'NSGs and ASGs', [['📋', 'IP lists in every rule', 'Rules that target an ASG'], ['🤔', 'Allowed on the subnet, still blocked', 'Check the NIC NSG too'], ['🔍', 'Guessing which rule wins', 'Effective rules and IP flow verify']]),
  'azure-bastion': ps('Admins RDP to VMs through public IPs and the logs show brute-force attempts all day.', 'Remove the public IPs and connect through Azure Bastion on private IPs.', 'Azure Bastion', [['🎯', 'Port 3389 open to the world', 'No public IP on the VM'], ['🧳', 'Jump box to patch and secure', 'Managed PaaS host'], ['💻', 'Admins want their own client', 'Standard SKU with native client']]),
  'service-endpoints-and-private-endpoints': ps('The storage account is reachable from the whole internet just so one app subnet can use it.', 'Lock the account to the subnet with a service endpoint, or give it a private IP with a private endpoint.', 'Service and private endpoints', [['🌐', 'Open public endpoint', 'Firewall allows only your subnet'], ['🏢', 'On-premises needs access too', 'Private endpoint over VPN'], ['🧭', 'Name still resolves public', 'privatelink private DNS zone']]),
  'azure-dns-zones-and-records': ps('DNS lives at the registrar, private names live in a hosts file, and nobody can change either.', 'Host public zones in Azure DNS and give VNets private zones with auto-registration.', 'Azure DNS', [['📒', 'Records in three places', 'Zones as Azure resources with RBAC'], ['🔗', 'Record points at an old IP', 'Alias record to the resource'], ['🖥️', 'VM names typed into hosts files', 'Private zone auto-registration']]),
  'azure-load-balancer-for-admins': ps('One web server crashes and a third of customers get errors until someone notices.', 'Put the servers behind a Standard load balancer with a health probe.', 'Azure Load Balancer', [['💀', 'Dead server keeps getting traffic', 'Health probe takes it out'], ['🧱', 'Probe blocked by an NSG', 'Allow the AzureLoadBalancer tag'], ['🔒', 'Database tier exposed', 'Internal frontend']]),
  'troubleshoot-network-connectivity': ps('"The app can\'t reach the database" and three teams blame each other.', 'Use Network Watcher to test the path hop by hop and name the exact route or rule.', 'Network Watcher', [['🧭', 'Is it routing?', 'Next hop and effective routes'], ['🛡️', 'Is it an NSG?', 'IP flow verify and effective rules'], ['🔗', 'Where does it break?', 'Connection troubleshoot']]),
};

export const ITEMS: FormatItem[] = [
  { kind: 'yesno', id: 'adm-x4-yn-peering', domain: 4, objective: '4.1.2', statements: [
    { text: 'VNet1 is peered with VNet2, and VNet2 is peered with VNet3. Virtual machines in VNet1 can communicate with virtual machines in VNet3 without further configuration.', answer: false },
    { text: 'Two virtual networks that have overlapping address spaces can be peered.', answer: false },
    { text: 'A spoke virtual network can use a VPN gateway in a peered hub virtual network if the hub peering allows gateway transit and the spoke peering uses remote gateways.', answer: true },
  ], explanation: 'Peering is **not transitive**, so VNet1 and VNet3 need their own peering or a route through an NVA. Address spaces must **not overlap**. **Gateway transit** on the hub side plus **use remote gateways** on the spoke side lets spokes share the hub gateway.' },
  { kind: 'order', id: 'adm-x4-order-udr', domain: 4, objective: '4.1.4', question: 'You need to force all internet-bound traffic from Subnet1 through a network virtual appliance (NVA) that has the IP address 10.0.2.4. Which three actions should you perform in sequence?', actions: ['Create a route table', 'Add a route for 0.0.0.0/0 with the next hop type Virtual appliance and the next hop address 10.0.2.4', 'Associate the route table with Subnet1', 'Associate the route table with the NIC of the NVA', 'Add a route for 0.0.0.0/0 with the next hop type Internet'], answer: [0, 1, 2], explanation: 'Create the **route table**, add the **0.0.0.0/0 → Virtual appliance** route, then **associate it with the subnet**. Route tables associate with subnets, not NICs. IP forwarding must also be enabled on the NVA NIC.' },
  { kind: 'dropdown', id: 'adm-x4-dd-bastion', domain: 4, objective: '4.2.3', question: 'Complete the configuration.', parts: [
    'To deploy Azure Bastion in VNet1, create a subnet named ',
    { options: ['BastionSubnet', 'AzureBastionSubnet', 'GatewaySubnet'], answer: 1 },
    ' with a prefix of at least ',
    { options: ['/24', '/26', '/29'], answer: 1 },
    '. To connect by using the native SSH client from an administrator workstation, use the ',
    { options: ['Developer', 'Basic', 'Standard'], answer: 2 },
    ' SKU with native client support enabled.',
  ], explanation: 'Bastion needs a subnet named exactly **AzureBastionSubnet**, **/26 or larger**. Native client support (az network bastion ssh / rdp) requires **Standard** or Premium.' },
  { kind: 'match', id: 'adm-x4-match-watcher', domain: 4, objective: '4.1.5', question: 'Match each requirement to the Azure Network Watcher tool you should use. Each tool may be used once, more than once, or not at all.', itemsLabel: 'Tools', items: ['IP flow verify', 'Next hop', 'Connection troubleshoot', 'Packet capture'], targets: [
    { text: 'Identify which security rule denies inbound TCP 443 to VM1', answer: 0 },
    { text: 'Determine whether traffic from VM1 to 10.2.1.4 is sent to a virtual appliance', answer: 1 },
    { text: 'Test whether VM1 can reach an FQDN on port 1433 and identify the failing hop', answer: 2 },
    { text: 'Record the packets that VM1 sends for later analysis', answer: 3 },
  ], explanation: '**IP flow verify** names the NSG rule for one flow. **Next hop** shows the next hop type and route table. **Connection troubleshoot** tests end to end and reports the failing hop. **Packet capture** records traffic.' },
  { kind: 'yesno', id: 'adm-x4-yn-lb', domain: 4, objective: '4.3.3', statements: [
    { text: 'A network security group rule that denies inbound traffic from the AzureLoadBalancer service tag can cause backend virtual machines to be marked unhealthy.', answer: true },
    { text: 'An HTTP health probe treats an HTTP 404 response as healthy.', answer: false },
    { text: 'A Standard public load balancer allows inbound traffic to backend virtual machines that have no network security group on their subnet or network interface.', answer: false },
  ], explanation: 'Probes come from **168.63.129.16** (the **AzureLoadBalancer** tag), so denying it fails the probe. An HTTP probe needs **200**. A Standard load balancer is **secure by default**: an NSG must allow the traffic.' },
  { kind: 'match', id: 'adm-x4-match-endpoints', domain: 4, objective: '4.2.5', question: 'Match each requirement to the feature you should configure. Each feature may be used once, more than once, or not at all.', itemsLabel: 'Features', items: ['Service endpoint', 'Private endpoint', 'Private DNS zone virtual network link'], targets: [
    { text: 'Give a storage account a private IP address in VNet1 so that on-premises clients can reach it over a VPN', answer: 1 },
    { text: 'Allow only Subnet1 through the storage account firewall while the account keeps its public IP address', answer: 0 },
    { text: 'Ensure that VMs in VNet2 resolve the storage account name to the private IP address of an existing private endpoint', answer: 2 },
  ], explanation: 'A **private endpoint** gives the service a private IP usable from peered and on-premises networks. A **service endpoint** lets the service firewall allow a subnet. VMs in another VNet need the privatelink **private DNS zone linked** to their VNet.' },
];

export const SORT: SortSet[] = [
  {
    id: 'adm-net-which-tool', title: 'Route, rule or resolver?', icon: '🧭', topic: 'troubleshoot-network-connectivity',
    intro: 'Put each fix in the layer it belongs to.',
    buckets: ['Routing', 'Network security', 'Name resolution'],
    items: [
      { text: 'Route table with next hop Virtual appliance', bucket: 0, why: 'User-defined routes change where packets go.' },
      { text: 'Enable IP forwarding on the NVA NIC', bucket: 0, why: 'Without it the NVA drops traffic not addressed to it.' },
      { text: 'Peer the two spokes directly', bucket: 0, why: 'Peering adds VNetPeering routes between the two VNets.' },
      { text: 'Inbound rule on priority 200 allowing TCP 443', bucket: 1, why: 'NSG rules allow or deny flows.' },
      { text: 'Application security group as the rule destination', bucket: 1, why: 'ASGs are targets inside NSG rules.' },
      { text: 'Allow the AzureLoadBalancer service tag', bucket: 1, why: 'Health probes need the NSG to let them in.' },
      { text: 'Link the privatelink zone to the VNet', bucket: 2, why: 'Without the link the name resolves to the public IP.' },
      { text: 'Alias A record at the zone apex', bucket: 2, why: 'Alias records are DNS records that follow an Azure resource.' },
      { text: 'Enable auto-registration on a private zone link', bucket: 2, why: 'It creates DNS records for VMs automatically.' },
    ],
  },
];

export const RIDDLES: Riddle[] = [
  { answer: 'Azure Bastion', topic: 'azure-bastion', clues: ['I let admins reach VMs that have no public IP.', 'I live in a subnet with a very specific name.', 'Give me a /26 and a Standard public IP, and RDP and SSH go over TLS 443.'] },
  { answer: 'Application security group', topic: 'nsgs-asgs-and-effective-rules', clues: ['I am only a label, but rules love me.', 'NICs join me instead of being listed by IP.', 'An NSG rule can name me as its source or destination.'] },
  { answer: 'User-defined route', topic: 'user-defined-routes', clues: ['I override the paths Azure picks for you.', 'I live in a table that belongs to subnets.', 'Point me at a virtual appliance and every packet visits the firewall.'] },
  { answer: 'Private endpoint', topic: 'service-endpoints-and-private-endpoints', clues: ['I am a network interface for someone else\'s service.', 'I give a storage account an address like 10.30.2.4.', 'Without my privatelink DNS zone, nobody finds me.'] },
  { answer: 'Health probe', topic: 'azure-load-balancer-for-admins', clues: ['I knock on every backend every few seconds.', 'I come from 168.63.129.16.', 'If you don\'t answer me with a 200, the load balancer stops sending you users.'] },
  { answer: 'IP flow verify', topic: 'troubleshoot-network-connectivity', clues: ['I test exactly one flow: protocol, IPs and ports.', 'I live in Network Watcher.', 'I tell you the name of the NSG rule that let you in or kept you out.'] },
];

export const COMPARE: Comparison[] = [
  {
    slug: 'service-endpoint-vs-private-endpoint',
    title: 'Service Endpoint vs Private Endpoint',
    seoTitle: 'Service Endpoint vs Private Endpoint in Azure | AZ-104',
    description: 'Azure service endpoints vs private endpoints compared: IP address, DNS, on-premises access, data exfiltration, cost and which one AZ-104 scenarios expect you to pick.',
    answer: 'A **service endpoint** keeps the PaaS service on its **public IP** but sends your subnet\'s traffic over the Microsoft backbone, so the service firewall can allow that subnet. It\'s free and quick. A **private endpoint** gives one service instance a **private IP** in your VNet through **Private Link**, works from peered VNets and on-premises, and needs a **privatelink private DNS zone**.',
    cols: ['Service endpoint', 'Private endpoint'],
    rows: [
      ['Service address', 'Public IP of the service', 'Private IP in your subnet (a NIC)'],
      ['Configured on', 'The subnet (Microsoft.Storage, Microsoft.Sql…) plus the service firewall', 'A private endpoint resource for one instance and sub-resource (blob, file…)'],
      ['DNS changes', 'None', 'privatelink zone (for example privatelink.blob.core.windows.net) linked to the VNet'],
      ['On-premises and peered VNets', 'No', 'Yes, over VPN, ExpressRoute or peering'],
      ['Scope', 'All instances of the service, unless you add a service endpoint policy', 'Exactly one resource'],
      ['Public access can be disabled', 'No, the firewall limits it', 'Yes'],
      ['Price feel', 'Free', '≈ $7.30/month per endpoint plus per GB (illustrative)'],
    ],
    pick: [['Service endpoint', 'only Azure subnets need access and you want a free, quick lock-down'], ['Private endpoint', 'on-premises or peered networks need access, or public access must be switched off']],
    examTip: '"Reach the storage account from on-premises over the VPN without the internet" = **private endpoint**. "Allow only Subnet1 through the storage firewall" = **service endpoint**. "Private endpoint created but the name still resolves to a public IP" = fix the **private DNS zone or its VNet link**.',
    sim: { mode: 'adminnet', start: 5, tour: 'adm-endpoints-private-dns', intro: 'Send traffic both ways, then remove the DNS.' },
    lessons: ['service-endpoints-and-private-endpoints', 'azure-dns-zones-and-records', 'troubleshoot-network-connectivity'],
    faq: [['Can I use both on the same subnet?', 'Yes. A subnet can have a Microsoft.Storage service endpoint and still reach other accounts through private endpoints.'], ['Do private endpoints need NSG changes?', 'Not by default. Network policies for private endpoints are off unless you turn them on for the subnet, after which NSGs and UDRs apply to them.']],
  },
  {
    slug: 'nsg-vs-asg-vs-udr',
    title: 'NSG vs ASG vs Route Table',
    seoTitle: 'NSG vs Application Security Group vs Route Table | AZ-104',
    description: 'Network security groups, application security groups and route tables (UDRs) compared: what each controls, where it attaches and how to troubleshoot each for AZ-104.',
    answer: 'An **NSG** decides whether a flow is **allowed or denied**, attached to a subnet or NIC. An **application security group** is a **label for NICs** that NSG rules can target instead of IP addresses. A **route table** with **user-defined routes** decides **where** packets go next, attached to subnets.',
    cols: ['NSG', 'ASG', 'Route table'],
    rows: [
      ['Question it answers', 'Allow or deny?', 'Which servers is this rule about?', 'Where does the packet go next?'],
      ['Attaches to', 'Subnet and/or NIC', 'NICs join it', 'Subnets (one table per subnet)'],
      ['Order', 'Priority 100 to 4096, lowest wins; defaults at 65000+', 'Not applicable', 'Longest prefix; user route beats system on a tie'],
      ['Troubleshoot with', 'Effective security rules, IP flow verify', 'Effective security rules', 'Effective routes, next hop'],
      ['Price', 'Free', 'Free', 'Free (the NVA is not)'],
    ],
    pick: [['NSG', 'you need to block or allow ports and sources'], ['ASG', 'rules should follow a role (web, db) rather than IP addresses'], ['Route table', 'traffic must go through a firewall or NVA, or be dropped']],
    examTip: 'Blocked port = **NSG** (IP flow verify). Packet goes the wrong way or nowhere = **route** (next hop). "Rules shouldn\'t change when new web VMs are added" = **ASG**.',
    sim: { mode: 'adminnet', start: 3, tour: 'adm-nsg-asg-effective', intro: 'Send three packets at two NSGs.' },
    lessons: ['nsgs-asgs-and-effective-rules', 'user-defined-routes', 'troubleshoot-network-connectivity'],
    faq: [['Are NSGs stateful?', 'Yes. If an inbound flow is allowed, its replies are allowed out automatically.'], ['Can an ASG span VNets?', 'No. All NICs in an ASG, and ASGs used together in one rule, must be in the same virtual network.']],
  },
];

export const SERVICES: Service[] = [
  { slug: 'virtual-network', name: 'Azure Virtual Network', cat: 'Networking', icon: '🕸️', model: 'Networking', what: 'Your private address space in one Azure region, split into subnets, joined to other VNets by peering and to on-premises by VPN or ExpressRoute.', use: ['Isolating workloads in subnets', 'Hub and spoke designs with a shared firewall and gateway'], avoid: ['Ranges that overlap on-premises or other VNets you\'ll peer'], feel: 1, price: 'Free; peering ≈ $0.01 per GB each way (illustrative).', sim: { mode: 'adminnet', start: 0, tour: 'adm-vnet-subnets-pip', intro: 'Count the reserved addresses.' }, similar: ['network-security-groups', 'azure-bastion'], aws: 'Amazon VPC', lesson: 'vnets-subnets-and-public-ips' },
  { slug: 'network-security-groups', name: 'Network Security Groups (NSG)', cat: 'Networking', icon: '🛡️', model: 'Networking', what: 'Stateful allow and deny rules by source, destination, port and protocol, attached to subnets or NICs, with application security groups as rule targets.', use: ['Filtering traffic on every subnet', 'Opening only the ports a tier needs'], avoid: ['FQDN filtering or threat intelligence (use Azure Firewall)'], feel: 1, price: 'Free.', sim: { mode: 'adminnet', start: 3, tour: 'adm-nsg-asg-effective', intro: 'Send HTTPS and RDP at two NSGs.' }, similar: ['virtual-network', 'azure-bastion'], aws: 'Security groups', lesson: 'nsgs-asgs-and-effective-rules', compare: 'nsg-vs-asg-vs-udr' },
  { slug: 'azure-bastion', name: 'Azure Bastion', cat: 'Networking', icon: '🏰', model: 'PaaS', what: 'A managed jump host in AzureBastionSubnet that opens RDP and SSH to VMs on their private IPs from the portal or a native client.', use: ['Admin access with no public IPs on VMs', 'One access point for a hub and its peered spokes'], avoid: ['Site-to-site connectivity (use VPN Gateway)'], feel: 3, price: 'Basic ≈ $0.19/hour plus data out; Standard costs more (illustrative).', sim: { mode: 'adminnet', start: 4, tour: 'adm-bastion', intro: 'Connect without a public IP.' }, similar: ['virtual-network', 'network-security-groups'], aws: 'EC2 Instance Connect Endpoint / Session Manager', lesson: 'azure-bastion' },
  { slug: 'azure-private-link', name: 'Azure Private Link (private endpoints)', cat: 'Networking', icon: '🔒', model: 'Networking', what: 'Private endpoints give a PaaS resource a private IP in your VNet, reachable from peered VNets and on-premises, with name resolution through a privatelink private DNS zone.', use: ['Turning off public access to storage or SQL', 'On-premises access to PaaS over VPN or ExpressRoute'], avoid: ['Forgetting the private DNS zone'], feel: 2, price: '≈ $0.01 per hour per endpoint plus per GB processed (illustrative).', sim: { mode: 'adminnet', start: 5, tour: 'adm-endpoints-private-dns', intro: 'Use the private path, then break the DNS.' }, similar: ['azure-dns', 'virtual-network'], aws: 'AWS PrivateLink', lesson: 'service-endpoints-and-private-endpoints', compare: 'service-endpoint-vs-private-endpoint' },
  { slug: 'azure-dns', name: 'Azure DNS', cat: 'Networking', icon: '📒', model: 'Networking', what: 'Hosts public DNS zones on Azure name servers and private DNS zones that answer only linked VNets, with alias records and VM auto-registration.', use: ['Managing your domain with RBAC and the CLI', 'Private names for VMs and private endpoints'], avoid: ['Buying domains (Azure DNS hosts, it doesn\'t register)'], feel: 1, price: '≈ $0.50 per zone per month plus ≈ $0.40 per million queries (illustrative).', sim: { mode: 'adminnet', start: 6, tour: 'adm-dns-zones', intro: 'Resolve public and private names.' }, similar: ['azure-private-link', 'load-balancer'], aws: 'Route 53', lesson: 'azure-dns-zones-and-records' },
  { slug: 'load-balancer', name: 'Azure Load Balancer', cat: 'Networking', icon: '⚖️', model: 'Networking', what: 'A layer 4 (TCP/UDP) load balancer with a public or internal frontend, backend pools, health probes and load-balancing rules. Standard SKU is zone-redundant and secure by default.', use: ['Spreading traffic over VMs or scale sets', 'An internal frontend for app or database tiers'], avoid: ['URL routing, TLS offload or a WAF (use Application Gateway)'], feel: 2, price: 'Standard ≈ $0.025/hour for the first 5 rules plus ≈ $0.005 per GB (illustrative).', sim: { mode: 'adminnet', start: 7, tour: 'adm-load-balancer', intro: 'Fail a probe and watch the traffic move.' }, similar: ['virtual-network', 'azure-dns'], aws: 'Network Load Balancer', lesson: 'azure-load-balancer-for-admins' },
];
