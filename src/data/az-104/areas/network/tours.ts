/**
 * AZ-104 networking portal walkthroughs (<PortalTour id="..." />). Simplified
 * screens of the new Azure portal with the real blade names and field order.
 * Education only; nothing here talks to Azure.
 */
import { find, list, wizard, wiz, done, proj, summary, resOf, form, note, tbl, sel, txt, ro, pane, type Tour, type Menu } from '../../tour-kit';

const RG = 'rg-net-hub';
const projN = (rg = RG) => proj(rg);

const VNET_MENU: Menu = ['Overview', 'Activity log', 'Access control (IAM)', 'Tags', 'Diagnose and solve problems', ['Settings', ['Address space', 'Connected devices', 'Subnets', 'Bastion', 'DDoS protection', 'Firewall', 'DNS servers', 'Peerings', 'Service endpoints', 'Private endpoints', 'Properties', 'Locks']], ['Monitoring', ['Diagram', 'Metrics']]];
const hub = resOf({ title: 'vnet-hub', type: 'Virtual network', i: 'vnet', menu: VNET_MENU, crumbs: [RG], cmds: ['Move', 'Delete', 'Refresh'], ess: [['Resource group', RG], ['Location', 'East US'], ['Address space', '10.0.0.0/16'], ['DNS servers', 'Azure provided DNS service']] });
const spoke1 = resOf({ title: 'vnet-spoke1', type: 'Virtual network', i: 'vnet', menu: VNET_MENU, crumbs: [RG], ess: [['Address space', '10.1.0.0/16'], ['Location', 'East US']] });
const PIP_MENU: Menu = ['Overview', 'Activity log', 'Access control (IAM)', 'Tags', ['Settings', ['Configuration', 'Properties', 'Locks']], ['Monitoring', ['Metrics']]];
const pip = resOf({ title: 'pip-hub-vpn', type: 'Public IP address', i: 'ip', menu: PIP_MENU, crumbs: [RG], cmds: ['Associate', 'Dissociate', 'Delete', 'Refresh'], ess: [['SKU', 'Standard'], ['Tier', 'Regional'], ['IP address', '20.85.4.10'], ['Assignment', 'Static'], ['Availability zone', 'Zone-redundant'], ['Associated to', '-']] });
const RT_MENU: Menu = ['Overview', 'Activity log', 'Access control (IAM)', 'Tags', ['Settings', ['Configuration', 'Routes', 'Subnets', 'Properties', 'Locks']]];
const rt = resOf({ title: 'rt-spoke1', type: 'Route table', i: 'vnet', menu: RT_MENU, crumbs: [RG], cmds: ['Move', 'Delete', 'Refresh'], ess: [['Resource group', RG], ['Location', 'East US'], ['Propagate gateway routes', 'Yes'], ['Associations', '0 subnets']] });
const NIC_MENU: Menu = ['Overview', 'Activity log', 'Access control (IAM)', 'Tags', ['Settings', ['IP configurations', 'DNS servers', 'Network security group', 'Application security groups', 'Properties', 'Locks']], ['Help', ['Effective security rules', 'Effective routes']]];
const nic = (n: string, rg: string) => resOf({ title: n, type: 'Network interface', i: 'nic', menu: NIC_MENU, crumbs: [rg], ess: [['Private IP address', n === 'nic-web01' ? '10.20.1.4' : '10.1.1.4'], ['Virtual network/subnet', n === 'nic-web01' ? 'vnet-app/snet-web' : 'vnet-spoke1/snet-app'], ['Attached to', n.replace('nic-', 'vm-')]] });
const nicApp1 = nic('nic-app1', RG);
const nicWeb = nic('nic-web01', 'rg-net-sec');
const NSG_MENU: Menu = ['Overview', 'Activity log', 'Access control (IAM)', 'Tags', ['Settings', ['Inbound security rules', 'Outbound security rules', 'Network interfaces', 'Subnets', 'Properties', 'Locks']]];
const nsg = resOf({ title: 'nsg-snet-web', type: 'Network security group', i: 'nsg', menu: NSG_MENU, crumbs: ['rg-net-sec'] });
const NW_MENU: Menu = ['Overview', ['Monitoring', ['Topology', 'Connection monitor']], ['Network diagnostic tools', ['IP flow verify', 'NSG diagnostics', 'Next hop', 'Effective security rules', 'VPN troubleshoot', 'Packet capture', 'Connection troubleshoot']], ['Logs', ['Flow logs', 'Traffic analytics']]];
const nw = resOf({ title: 'Network Watcher', type: 'Network Watcher', i: 'monitor', menu: NW_MENU, crumbs: [] });
const BAS_MENU: Menu = ['Overview', 'Activity log', 'Access control (IAM)', 'Tags', ['Settings', ['Configuration', 'Sessions', 'Shareable links', 'Properties', 'Locks']]];
const bas = resOf({ title: 'bas-paas', type: 'Bastion', i: 'vm', menu: BAS_MENU, crumbs: ['rg-net-paas'], ess: [['Tier', 'Standard'], ['Virtual network', 'vnet-paas'], ['Public IP address', 'pip-bastion'], ['Instance count', '2']] });
const VM_MENU: Menu = ['Overview', 'Activity log', 'Access control (IAM)', 'Tags', 'Connect', ['Networking', ['Network settings', 'Load balancing']], ['Settings', ['Disks', 'Extensions + applications', 'Configuration']]];
const vmApp = resOf({ title: 'app01', type: 'Virtual machine', i: 'vm', menu: VM_MENU, crumbs: ['rg-net-paas'], cmds: ['Connect', 'Start', 'Restart', 'Stop'], ess: [['Status', 'Running'], ['Public IP address', '-'], ['Private IP address', '10.30.1.4'], ['Virtual network/subnet', 'vnet-paas/snet-app']] });
const ST_MENU: Menu = ['Overview', 'Activity log', 'Access control (IAM)', 'Tags', ['Data storage', ['Containers', 'File shares']], ['Security + networking', ['Networking', 'Access keys', 'Encryption']], ['Settings', ['Configuration', 'Locks']]];
const stAcct = resOf({ title: 'stfabrikampaas01', type: 'Storage account', i: 'storage', menu: ST_MENU, crumbs: ['rg-net-paas'] });
const DNS_MENU: Menu = ['Overview', 'Activity log', 'Access control (IAM)', 'Tags', ['DNS Management', ['Recordsets']], ['Settings', ['Properties', 'Locks']]];
const zone = resOf({ title: 'contoso-shop.com', type: 'DNS zone', i: 'dns', menu: DNS_MENU, crumbs: ['rg-net-lb'], cmds: ['+ Record set', '+ Child zone', 'Delete zone', 'Refresh'], ess: [['Resource group', 'rg-net-lb'], ['Name server 1', 'ns1-04.azure-dns.com.'], ['Name server 2', 'ns2-04.azure-dns.net.'], ['Name server 3', 'ns3-04.azure-dns.org.'], ['Name server 4', 'ns4-04.azure-dns.info.']] });
const PDNS_MENU: Menu = ['Overview', 'Activity log', 'Access control (IAM)', 'Tags', ['DNS Management', ['Recordsets', 'Virtual Network Links']], ['Settings', ['Properties', 'Locks']]];
const pzone = resOf({ title: 'contoso.internal', type: 'Private DNS zone', i: 'dns', menu: PDNS_MENU, crumbs: ['rg-net-lb'] });
const LB_MENU: Menu = ['Overview', 'Activity log', 'Access control (IAM)', 'Tags', 'Diagnose and solve problems', ['Settings', ['Frontend IP configuration', 'Backend pools', 'Health probes', 'Load balancing rules', 'Inbound NAT rules', 'Outbound rules', 'Properties', 'Locks']], ['Monitoring', ['Insights', 'Metrics', 'Alerts']]];
const lb = resOf({ title: 'lb-web', type: 'Load balancer', i: 'lb', menu: LB_MENU, crumbs: ['rg-net-lb'], ess: [['SKU', 'Standard'], ['Tier', 'Regional'], ['Frontend IP', '20.85.4.10 (pip-lb)'], ['Backend pool', 'bepool-web (2 virtual machines)'], ['Load balancing rule', 'rule-http (TCP/80)'], ['Health probe', 'probe-http (HTTP:80/health)']] });

export const TOURS: Record<string, Tour> = {
  'adm-vnet-subnets-pip': {
    title: 'Create a VNet with subnets and a Standard static public IP',
    steps: [
      ...find('virtual networks', 'Virtual networks', 'vnet', 'Search for **virtual networks** to plan the hub.'),
      { sc: list('Virtual networks', 'vnet', ['Resource group', 'Location', 'Address space']), t: 'cmd:+ Create', say: 'Select **+ Create**.' },
      ...wizard('Create virtual network', ['Virtual networks'], ['Basics', 'Security', 'IP addresses', 'Tags', 'Review + create'], [
        { tab: 0, groups: [projN(), { h: 'Instance details', f: [txt('Virtual network name *', 'vnet-hub'), sel('Region *', '(US) East US')] }], say: 'A VNet lives in one region and one subscription. Pick the resource group and name it.' },
        { tab: 1, groups: [{ f: [['Enable Azure Bastion', 'Enable Azure Bastion', 'c'], ['Enable Azure Firewall', 'Enable Azure Firewall', 'c'], ['Enable Azure DDoS Network Protection', 'Enable Azure DDoS Network Protection', 'c']] }], say: 'You can add Bastion or Firewall here, but we\'ll do Bastion separately so you see its subnet rules.' },
        { tab: 2, t: 'f:snet-shared', groups: [{ h: 'IPv4 address space', f: [ro('10.0.0.0/16', '10.0.0.0 - 10.0.255.255 · **65,536 addresses**')] }, { h: 'Subnets', p: '+ Add a subnet', f: [ro('snet-shared', '10.0.1.0/24 · 256 addresses · **251 usable**'), ro('GatewaySubnet', '10.0.255.0/27 · for the VPN gateway'), ro('snet-tiny', '10.0.9.0/29 · 8 addresses · **3 usable**')] }], say: 'Plan ranges that **don\'t overlap** the spokes or on-premises. Azure keeps **5 addresses** in every subnet, so a /29 leaves you only 3.' },
        { tab: 4, groups: summary([['Name', 'vnet-hub'], ['Address space', '10.0.0.0/16'], ['Subnets', 'snet-shared, GatewaySubnet, snet-tiny'], ['Cost', 'Virtual networks are free']]), say: 'Review and **Create**.' },
      ]),
      done('vnet-hub', 'Deployment done. Now the public IP for the hub\'s VPN gateway.'),
      { sc: list('Public IP addresses', 'ip', ['Resource group', 'IP address', 'SKU']), t: 'cmd:+ Create', say: 'Search **Public IP addresses** and select **+ Create**.' },
      { sc: wiz('Create public IP address', ['Public IP addresses'], ['Basics', 'Tags', 'Review + create'], 0, [projN(), { h: 'Configuration', f: [sel('Region *', '(US) East US'), txt('Name *', 'pip-hub-vpn'), ['IP Version *', '*IPv4|IPv6', 'r'], ['SKU *', '*Standard', 'r', 'Basic SKU was retired on 30 September 2025.'], sel('Availability zone *', 'Zone-redundant'), ['Tier *', '*Regional|Global', 'r'], ['IP address assignment', '*Static', 'r', 'Standard is always static.'], ['Routing preference', '*Microsoft network|Internet', 'r'], txt('DNS name label', 'contoso-hub-vpn', '.eastus.cloudapp.azure.com')] }]), t: 'tab:Review + create', say: '**Standard** SKU, **Static**, **Zone-redundant**. A Standard IP is closed to inbound traffic until an NSG allows it.' },
      { sc: pip('Overview'), say: 'The address never changes while the resource exists, so firewalls and partners can allow it. Associate it later to a VPN gateway, load balancer, Bastion or NIC.', toast: '✅ **Deployment succeeded**' },
    ],
  },

  'adm-vnet-peering-transit': {
    title: 'Peer a spoke with the hub and share its VPN gateway',
    steps: [
      { sc: hub('Overview'), t: 'menu:Peerings', say: 'Open **vnet-hub → Settings → Peerings**. The hub already has a VPN gateway in its GatewaySubnet.' },
      { sc: hub('Peerings', [tbl(['Peering status', 'Remote virtual network', 'Gateway transit'], [], 'Peerings', ['+ Add', 'Refresh', 'Sync'])]), t: 'cmd:+ Add', say: 'Select **+ Add**. One form creates both links.' },
      { sc: hub('Peerings'), t: 'btn:Add', say: 'The **remote** section is the spoke\'s link: it may receive forwarded traffic and **uses the hub\'s gateway**. The **local** section is the hub\'s link: it **allows gateway transit**.', pane: pane('Add peering', [{ h: 'Remote virtual network summary', f: [txt('Peering link name *', 'spoke1-to-hub'), sel('Virtual network *', 'vnet-spoke1 (rg-net-hub)')] }, { h: 'Remote virtual network peering settings', f: [['Allow vnet-spoke1 to access vnet-hub', '*Allow vnet-spoke1 to access vnet-hub', 'c'], ['Allow vnet-spoke1 to receive forwarded traffic from vnet-hub', '*Allow vnet-spoke1 to receive forwarded traffic from vnet-hub', 'c'], ['Enable vnet-spoke1 to use vnet-hub\'s remote gateway or route server', '*Enable vnet-spoke1 to use vnet-hub\'s remote gateway or route server', 'c']] }, { h: 'Local virtual network summary', f: [txt('Peering link name *', 'hub-to-spoke1'), ['Allow vnet-hub to access vnet-spoke1', '*Allow vnet-hub to access vnet-spoke1', 'c'], ['Allow gateway or route server in vnet-hub to forward traffic to vnet-spoke1', '*Allow gateway or route server in vnet-hub to forward traffic to vnet-spoke1', 'c']] }], ['Add', 'Cancel']) },
      { sc: hub('Peerings', [tbl(['Peering status', 'Remote virtual network', 'Gateway transit'], [['hub-to-spoke1', 'Connected', 'vnet-spoke1', 'Enabled'], ['hub-to-spoke2', 'Connected', 'vnet-spoke2', 'Enabled']], 'Peerings', ['+ Add', 'Refresh', 'Sync'])]), t: 'row:hub-to-spoke1', say: 'Both links show **Connected**. Repeat for spoke 2. Spokes now reach on-premises through the hub gateway.' },
      { sc: spoke1('Peerings', [tbl(['Peering status', 'Remote virtual network'], [['spoke1-to-hub', 'Connected', 'vnet-hub']]), note('Spoke 1 has **no** peering to spoke 2. Peering isn\'t transitive, so spoke 1 can\'t reach spoke 2 through the hub on its own.', 'warn')]), say: 'From the spoke you only see the hub. To link spokes, peer them directly or route through an NVA in the hub with user-defined routes.' },
    ],
  },

  'adm-route-table': {
    title: 'Send spoke traffic through the hub firewall with a route table',
    steps: [
      ...find('route tables', 'Route tables', 'vnet', 'Search for **route tables**.'),
      { sc: wiz('Create Route table', ['Route tables'], ['Basics', 'Tags', 'Review + create'], 0, [projN(), { h: 'Instance details', f: [sel('Region *', '(US) East US', 'Same region as the VNet.'), txt('Name *', 'rt-spoke1'), ['Propagate gateway routes *', '*Yes|No', 'r', 'No stops VPN/BGP routes reaching these subnets.']] }]), t: 'btn:Review + create', say: 'Create **rt-spoke1** in the same region and subscription as the spoke.' },
      { sc: rt('Routes', [tbl(['Address prefix', 'Next hop type', 'Next hop IP address'], [], 'Routes', ['+ Add', 'Refresh'])]), t: 'cmd:+ Add', say: 'Open **Settings → Routes** and select **+ Add**.', toast: '✅ **Deployment succeeded**' },
      { sc: rt('Routes'), t: 'btn:Add', say: 'Send spoke 2\'s range to the firewall\'s private IP. Next hop type **Virtual appliance** needs a next hop address.', pane: pane('Add route', [{ f: [txt('Route name *', 'to-spoke2'), ['Destination type *', '*IP Addresses|Service Tag', 'r'], txt('Destination IP addresses/CIDR ranges *', '10.2.0.0/16'), sel('Next hop type *', 'Virtual appliance'), txt('Next hop address *', '10.0.2.4')] }], ['Add', 'Cancel']) },
      { sc: rt('Subnets', [tbl(['Address range', 'Virtual network'], [], 'Subnets', ['+ Associate', 'Refresh'])]), t: 'cmd:+ Associate', say: 'A route table does nothing until it\'s **associated with a subnet**. Open **Subnets → + Associate**.' },
      { sc: rt('Subnets'), t: 'btn:OK', say: 'Pick **vnet-spoke1 / snet-app**. One subnet can have one route table; one table can serve many subnets.', pane: pane('Associate subnet', [{ f: [sel('Virtual network', 'vnet-spoke1 (rg-net-hub)'), sel('Subnet', 'snet-app')] }], ['OK', 'Cancel']) },
      { sc: nicApp1('Effective routes', [tbl(['Source', 'State', 'Address prefixes', 'Next hop type', 'Next hop IP'], [['Default', 'Active', '10.1.0.0/16', 'Virtual network', '-'], ['Default', 'Active', '10.0.0.0/16', 'VNet peering', '-'], ['User', 'Active', '10.2.0.0/16', 'Virtual appliance', '10.0.2.4'], ['Default', 'Active', '0.0.0.0/0', 'Internet', '-']])]), say: 'On the VM\'s NIC, **Help → Effective routes** proves it: the **User** route sends 10.2.0.0/16 to 10.0.2.4. Remember IP forwarding on the NVA\'s NIC and the mirror route in spoke 2.' },
    ],
  },

  'adm-nsg-asg-effective': {
    title: 'Write NSG rules against an ASG and read the effective rules',
    steps: [
      ...find('application security groups', 'Application security groups', 'nsg', 'Search for **application security groups**.'),
      { sc: wiz('Create an application security group', ['Application security groups'], ['Basics', 'Tags', 'Review + create'], 0, [projN('rg-net-sec'), { h: 'Instance details', f: [txt('Name *', 'asg-web'), sel('Region *', '(US) East US')] }]), t: 'btn:Review + create', say: 'An ASG is just a label for NICs. Create **asg-web** in the same region as the VNet.' },
      { sc: nicWeb('Application security groups', [tbl(['Name', 'Resource group'], [], 'Application security groups', ['+ Add application security groups'])]), t: 'cmd:+ Add application security groups', say: 'On **nic-web01**, open **Application security groups** and add **asg-web**. All NICs in an ASG must be in the same VNet.' },
      { sc: nsg('Inbound security rules'), t: 'btn:Add', say: 'In **nsg-snet-web**, add an inbound rule whose **Destination** is the ASG, not an IP list. New web VMs are covered the moment they join asg-web.', pane: pane('Add inbound security rule', [{ f: [sel('Source', 'Service Tag'), sel('Source service tag', 'Internet'), txt('Source port ranges *', '*'), sel('Destination', 'Application security group'), sel('Destination application security groups', 'asg-web'), sel('Service', 'HTTPS'), txt('Destination port ranges *', '443'), ['Protocol', 'Any|*TCP|UDP|ICMPv4', 'r'], ['Action', '*Allow|Deny', 'r'], txt('Priority *', '200'), txt('Name *', 'Allow-HTTPS-to-web')] }], ['Add', 'Cancel']) },
      { sc: nsg('Inbound security rules', [tbl(['Priority', 'Port', 'Source', 'Destination', 'Action'], [['Allow-HTTPS-to-web', '200', '443', 'Internet', 'asg-web', 'Allow'], ['AllowVnetInBound', '65000', 'Any', 'VirtualNetwork', 'VirtualNetwork', 'Allow'], ['AllowAzureLoadBalancerInBound', '65001', 'Any', 'AzureLoadBalancer', 'Any', 'Allow'], ['DenyAllInBound', '65500', 'Any', 'Any', 'Any', 'Deny']])]), say: 'Lowest number wins. Anything not allowed falls to **DenyAllInBound** at 65500. Default rules can\'t be deleted, only overridden by a lower number.' },
      { sc: nicWeb('Effective security rules', [note('Associated NSGs: **nsg-snet-web** (subnet snet-web) and **nsg-web01** (network interface).', 'info'), tbl(['NSG', 'Priority', 'Port', 'Source', 'Action'], [['nsg-snet-web', 'Allow-HTTPS-to-web · 200', '443', 'Internet', 'Allow'], ['nsg-web01', 'DenyAllInBound · 65500', 'Any', 'Any', 'Deny']])]), say: '**Effective security rules** shows every NSG that applies. Inbound, the subnet NSG is checked first, then the NIC NSG, and **both** must allow. Here the NIC NSG blocks 443.' },
      { sc: nw('IP flow verify', [form([{ f: [sel('Virtual machine *', 'vm-web01'), sel('Network interface *', 'nic-web01'), ['Protocol', '*TCP|UDP', 'r'], ['Direction', '*Inbound|Outbound', 'r'], txt('Local IP address *', '10.20.1.4'), txt('Local port *', '443'), txt('Remote IP address *', '203.0.113.10'), txt('Remote port *', '50000')] }], 'Verify IP flow'), note('Access denied · Security rule: **DenyAllInBound** · Network security group: **nsg-web01**', 'bad')]), t: 'btn:Verify IP flow', say: '**Network Watcher → IP flow verify** names the exact rule. Add an allow for 443 on nsg-web01 (or remove that NSG) and verify again.' },
    ],
  },

  'adm-bastion': {
    title: 'Deploy Azure Bastion and connect to a VM with no public IP',
    steps: [
      ...find('bastions', 'Bastions', 'vm', 'Search for **Bastions**.'),
      ...wizard('Create a Bastion', ['Bastions'], ['Basics', 'Tags', 'Advanced', 'Review + create'], [
        { tab: 0, groups: [projN('rg-net-paas'), { h: 'Instance details', f: [txt('Name *', 'bas-paas'), sel('Region *', '(US) East US'), sel('Availability zone', 'None'), sel('Tier *', 'Standard', 'Developer, Basic, Standard or Premium'), txt('Instance count', '2', 'Host scaling: Standard and Premium only')] }, { h: 'Configure virtual networks', f: [sel('Virtual network *', 'vnet-paas'), ro('Subnet *', 'AzureBastionSubnet (10.30.3.0/26)', 'Must be named exactly this, **/26 or larger**')] }, { h: 'Public IP address', f: [['Public IP address *', '*Create new|Use existing', 'r'], txt('Public IP address name *', 'pip-bastion'), ro('Public IP address SKU', 'Standard'), ro('Assignment', 'Static')] }], say: 'Bastion needs **AzureBastionSubnet** (/26 or larger) and a **Standard** public IP. The VMs themselves need neither.' },
        { tab: 2, groups: [{ f: [['Copy and paste', '*Copy and paste', 'c'], ['IP-based connection', 'IP-based connection', 'c'], ['Kerberos authentication', 'Kerberos authentication', 'c'], ['Native client support', '*Native client support', 'c', 'Lets you use az network bastion ssh/rdp from your own machine'], ['Shareable link', 'Shareable link', 'c']] }], say: 'On **Advanced**, turn on **Native client support** (Standard or Premium only) if admins want to use their own SSH or RDP client.' },
        { tab: 3, groups: summary([['Tier', 'Standard'], ['Virtual network', 'vnet-paas'], ['Subnet', 'AzureBastionSubnet'], ['Native client support', 'Enabled'], ['Price', 'Billed per hour plus outbound data (illustrative)']]), say: 'Review and **Create**. It takes about 10 minutes.' },
      ]),
      { sc: vmApp('Overview'), t: 'cmd:Connect', say: 'Open the VM **app01**. It has **no public IP**. Select **Connect**.', toast: '✅ **Deployment succeeded**' },
      { sc: vmApp('Connect'), t: 'btn:Connect', say: 'Choose **Connect via Bastion**, enter the username and key or password, and the SSH session opens in a browser tab over TLS 443.', pane: pane('Connect via Bastion', [{ f: [sel('Authentication Type', 'SSH Private Key from Local File'), txt('Username', 'azureuser'), ro('Local File', 'app01_key.pem'), ['Open in new browser tab', '*Open in new browser tab', 'c']] }], ['Connect', 'Cancel']) },
      { sc: bas('Sessions', [tbl(['Target VM', 'Protocol', 'User', 'Started'], [['app01', 'SSH', 'azureuser', '10:42']]), note('Bastion can also reach VMs in **peered** VNets, so one Bastion in the hub serves every spoke.', 'info')]), say: 'Admins can see and end sessions here. No VM exposes port 22 or 3389 to the internet.' },
    ],
  },

  'adm-endpoints-private-dns': {
    title: 'Service endpoint vs private endpoint for a storage account',
    steps: [
      { sc: stAcct('Networking', [form([{ h: 'Firewalls and virtual networks', f: [['Public network access', 'Enabled from all networks|*Enabled from selected virtual networks and IP addresses|Disabled', 'r']] }, { h: 'Virtual networks', p: '+ Add existing virtual network', f: [ro('vnet-paas / snet-app', 'Endpoint status: **Enabled** (Microsoft.Storage)')] }], 'Save')]), t: 'btn:Save', say: '**Service endpoint**: in **Networking**, allow only selected networks and add **vnet-paas/snet-app**. The portal turns on the Microsoft.Storage endpoint on that subnet. The account keeps its public IP; traffic from the subnet just travels the Microsoft backbone.' },
      { sc: stAcct('Networking', [tbl(['Connection state', 'Private endpoint', 'Description'], [], 'Private endpoint connections', ['+ Private endpoint', 'Approve', 'Reject', 'Remove'])]), t: 'cmd:+ Private endpoint', say: '**Private endpoint**: switch to the **Private endpoint connections** tab and select **+ Private endpoint**.' },
      { sc: wiz('Create a private endpoint', ['stfabrikampaas01'], ['Basics', 'Resource', 'Virtual Network', 'DNS', 'Tags', 'Review + create'], 1, [{ f: [ro('Resource type', 'Microsoft.Storage/storageAccounts'), ro('Resource', 'stfabrikampaas01'), sel('Target sub-resource *', 'blob', 'One endpoint per sub-resource: blob, file, queue, table, dfs, web')] }]), t: 'tab:Virtual Network', say: 'Pick the **target sub-resource**. A blob endpoint doesn\'t cover Azure Files.' },
      { sc: wiz('Create a private endpoint', ['stfabrikampaas01'], ['Basics', 'Resource', 'Virtual Network', 'DNS', 'Tags', 'Review + create'], 2, [{ f: [sel('Virtual network *', 'vnet-paas (rg-net-paas)'), sel('Subnet *', 'snet-pe'), ['Private IP configuration', '*Dynamically allocate IP address|Statically allocate IP address', 'r']] }]), t: 'tab:DNS', say: 'The endpoint is a NIC in **snet-pe** with a private IP, for example 10.30.2.4.' },
      { sc: wiz('Create a private endpoint', ['stfabrikampaas01'], ['Basics', 'Resource', 'Virtual Network', 'DNS', 'Tags', 'Review + create'], 3, [{ f: [['Integrate with private DNS zone', '*Yes|No', 'r'], ro('Private DNS zone', '(New) **privatelink.blob.core.windows.net**')] }]), t: 'tab:Review + create', say: 'Keep **Integrate with private DNS zone: Yes**. Without it the name still resolves to the public IP and the endpoint goes unused.' },
      { sc: { s: 'res', title: 'privatelink.blob.core.windows.net', type: 'Private DNS zone', i: 'dns', menu: PDNS_MENU, crumbs: ['rg-net-paas'], active: 'Recordsets', body: [tbl(['Type', 'TTL', 'Value'], [['@', 'SOA', '3600', 'azureprivatedns.net'], ['stfabrikampaas01', 'A', '10', '10.30.2.4']]), note('From a VM in vnet-paas: `nslookup stfabrikampaas01.blob.core.windows.net` → CNAME privatelink → **10.30.2.4**.', 'ok')] }, say: 'The zone is linked to vnet-paas and holds the A record. Now set **Public network access: Disabled** and only the private path works.', toast: '✅ **Deployment succeeded**' },
    ],
  },

  'adm-dns-zones': {
    title: 'Public DNS zone with an alias record, and a private zone link',
    steps: [
      ...find('dns zones', 'DNS zones', 'dns', 'Search for **DNS zones**.', [{ g: 'Services', n: 'Private DNS zones', i: 'dns' }]),
      { sc: wiz('Create DNS zone', ['DNS zones'], ['Basics', 'Tags', 'Review + create'], 0, [projN('rg-net-lb'), { h: 'Instance details', f: [['This zone is a child of an existing zone already hosted in Azure DNS', 'This zone is a child of an existing zone already hosted in Azure DNS', 'c'], txt('Name *', 'contoso-shop.com')] }]), t: 'btn:Review + create', say: 'Host **contoso-shop.com**. The zone name is the domain you own.' },
      { sc: zone('Overview'), t: 'cmd:+ Record set', say: 'Azure gives the zone **four name servers**. Put them as the NS records at your **domain registrar** to delegate the domain to Azure DNS.', toast: '✅ **Deployment succeeded**' },
      { sc: zone('Overview'), t: 'btn:Add', say: 'Add **www** as an **alias** A record pointing at the load balancer\'s public IP resource. If the IP changes, the record follows. Alias records also work at the apex (@), where a CNAME isn\'t allowed.', pane: pane('Add record set', [{ f: [txt('Name', 'www', '.contoso-shop.com'), sel('Type', 'A - Address record'), ['Alias record set', '*Yes|No', 'r'], ['Alias type', '*Azure resource|Zone record set', 'r'], sel('Azure resource', 'pip-lb (20.85.4.10)'), txt('TTL', '1'), sel('TTL unit', 'Hours')] }], ['Add', 'Cancel']) },
      { sc: pzone('Virtual Network Links', [tbl(['Link status', 'Virtual network', 'Auto-registration'], [], 'Virtual Network Links', ['+ Add', 'Refresh'])]), t: 'cmd:+ Add', say: 'Now a **private DNS zone**, **contoso.internal**. It answers only VNets linked to it. Open **Virtual Network Links → + Add**.' },
      { sc: pzone('Virtual Network Links'), t: 'btn:Create', say: 'Link **vnet-web** and **enable auto registration**: VMs there get A records created and removed automatically. A VNet can have only one registration zone.', pane: pane('Add virtual network link', [{ f: [txt('Link name *', 'link-vnet-web'), sel('Virtual network *', 'vnet-web (rg-net-lb)'), ['Enable auto registration', '*Enable auto registration', 'c']] }], ['Create', 'Cancel']) },
      { sc: pzone('Recordsets', [tbl(['Type', 'Value', 'Auto registered'], [['@', 'SOA', 'azureprivatedns.net', 'False'], ['vm-web01', 'A', '10.40.1.4', 'True'], ['vm-web02', 'A', '10.40.1.5', 'True']])]), say: 'The VMs registered themselves. VMs in the linked VNet resolve `vm-web01.contoso.internal` through Azure DNS at **168.63.129.16**. An unlinked VNet gets NXDOMAIN.' },
    ],
  },

  'adm-load-balancer': {
    title: 'Create a Standard public load balancer and fix a failing backend',
    steps: [
      ...find('load balancers', 'Load balancers', 'lb', 'Search for **load balancers**.'),
      ...wizard('Create load balancer', ['Load balancing'], ['Basics', 'Frontend IP configuration', 'Backend pools', 'Inbound rules', 'Outbound rules', 'Tags', 'Review + create'], [
        { tab: 0, groups: [projN('rg-net-lb'), { h: 'Instance details', f: [txt('Name *', 'lb-web'), sel('Region *', '(US) East US'), ['SKU *', '*Standard|Gateway', 'r', 'Basic was retired on 30 September 2025.'], ['Type *', '*Public|Internal', 'r'], ['Tier *', '*Regional|Global', 'r']] }], say: '**Public** gives the frontend a public IP. **Internal** uses a private IP in a subnet, for tiers only the VNet should reach.' },
        { tab: 1, groups: [{ h: 'Frontend IP configuration', f: [ro('fe-web', 'IPv4 · Public IP **pip-lb** (Standard, Static, zone-redundant)')] }], say: 'Add a frontend that uses the Standard public IP **pip-lb**.' },
        { tab: 2, groups: [{ h: 'Backend pools', f: [ro('bepool-web', 'Virtual network **vnet-web** · Backend pool configuration: **NIC** · vm-web01, vm-web02')] }], say: 'The pool holds VMs from **one VNet**, by NIC or by IP address.' },
        { tab: 3, groups: [{ h: 'Load balancing rule', f: [ro('rule-http', 'fe-web:80 → bepool-web:80 · TCP · probe-http')] }, { h: 'Health probe', f: [ro('probe-http', 'HTTP · port 80 · path /health · every 5 seconds')] }], say: 'A rule maps frontend port 80 to backend port 80 and uses an **HTTP probe** on /health. Only a 200 counts as healthy.' },
        { tab: 6, groups: summary([['SKU', 'Standard'], ['Type', 'Public'], ['Frontend', 'fe-web (pip-lb)'], ['Rule', 'rule-http TCP 80'], ['Price', 'Per hour for rules plus per GB processed (illustrative)']]), say: 'Review and **Create**.' },
      ]),
      { sc: lb('Backend pools', [tbl(['Virtual machine', 'IP address', 'Health status'], [['vm-web01', 'web01', '10.40.1.4', 'Healthy'], ['vm-web02', 'web02', '10.40.1.5', 'Unhealthy']], 'bepool-web')]), t: 'row:vm-web02', say: 'Customers say pages are slow. **Backend pools** shows vm-web02 is **unhealthy**, so it gets no new flows.', toast: '✅ **Deployment succeeded**' },
      { sc: nic('nic-web02', 'rg-net-lb')('Effective security rules', [tbl(['NSG', 'Priority', 'Source', 'Action'], [['nsg-web02', 'Deny-LB · 100', 'AzureLoadBalancer', 'Deny'], ['nsg-web02', 'Allow-HTTP · 200', 'Internet', 'Allow']]), note('Health probes come from **168.63.129.16**, the **AzureLoadBalancer** service tag. A deny on it marks the backend Down.', 'bad')]), say: 'On web02\'s NIC the effective rules show a **Deny-LB** rule blocking the probe. Delete it (or never write it).' },
      { sc: lb('Insights', [{ b: 'cards', items: [{ t: 'Data path availability', v: '100%', c: 'ok' }, { t: 'Health probe status', v: '100%', s: '2 of 2 backends up', c: 'ok' }] }]), say: 'After the fix, **Insights** shows health probe status back at 100%. The **Health Probe Status** and **Data Path Availability** metrics are the first place to look next time.' },
    ],
  },

  'adm-network-watcher-troubleshoot': {
    title: 'Troubleshoot connectivity with Network Watcher',
    steps: [
      ...find('network watcher', 'Network Watcher', 'monitor', 'App1 in spoke 1 can\'t reach app2 in spoke 2. Search for **Network Watcher**.'),
      { sc: nw('Overview', [tbl(['Region', 'Status'], [['East US', 'Enabled'], ['West Europe', 'Enabled']], 'Network Watcher instances')]), t: 'menu:Connection troubleshoot', say: 'Network Watcher is turned on automatically per region (in **NetworkWatcherRG**). Start with **Connection troubleshoot**.' },
      { sc: nw('Connection troubleshoot', [form([{ f: [sel('Source type', 'Virtual machine'), sel('Virtual machine *', 'vm-app1'), sel('Destination type', 'Specify manually'), txt('URI, FQDN or IP address *', '10.2.1.4'), ['Probe settings', '*TCP|ICMP|HTTP', 'r'], txt('Destination port', '443')] }], 'Run diagnostic tests'), note('Connectivity test: **Unreachable** · Next hop: **None** · Route: System Route', 'bad')]), t: 'btn:Run diagnostic tests', say: 'Unreachable, and the next hop is **None**: there\'s no route. That points at routing, not an NSG.' },
      { sc: nw('Next hop', [form([{ f: [sel('Virtual machine *', 'vm-app1'), sel('Network interface *', 'nic-app1'), txt('Source IP address *', '10.1.1.4'), txt('Destination IP address *', '10.2.1.4')] }], 'Next hop'), note('Next hop type: **None** · Route table ID: System Route', 'warn')]), t: 'btn:Next hop', say: '**Next hop** confirms it. Spokes are peered with the hub, not with each other, and peering isn\'t transitive.' },
      { sc: nicApp1('Effective routes', [tbl(['Source', 'State', 'Address prefixes', 'Next hop type'], [['Default', 'Active', '10.1.0.0/16', 'Virtual network'], ['Default', 'Active', '10.0.0.0/16', 'VNet peering'], ['Default', 'Active', '10.0.0.0/8', 'None'], ['Default', 'Active', '0.0.0.0/0', 'Internet']])]), say: '**Effective routes** on the NIC shows why: 10.2.0.0/16 only matches the 10.0.0.0/8 **None** route. Add a UDR to the hub NVA (and one back from spoke 2).' },
      { sc: nw('IP flow verify', [form([{ f: [sel('Virtual machine *', 'vm-app2'), ['Protocol', '*TCP|UDP', 'r'], ['Direction', '*Inbound|Outbound', 'r'], txt('Local IP address *', '10.2.1.4'), txt('Local port *', '443'), txt('Remote IP address *', '10.1.1.4'), txt('Remote port *', '50000')] }], 'Verify IP flow'), note('Access allowed · Security rule: **AllowVnetInBound**', 'ok')]), t: 'btn:Verify IP flow', say: 'With the routes fixed, **IP flow verify** checks the NSGs on app2 for that exact flow. Allowed.' },
      { sc: nw('Connection troubleshoot', [note('Connectivity test: **Reachable** · Hops: nic-app1 → 10.0.2.4 (VirtualAppliance) → nic-app2 · Avg latency 2 ms', 'ok')]), say: 'Run Connection troubleshoot again: **Reachable** through the NVA. Order to remember: routes (next hop, effective routes), then NSGs (IP flow verify, effective rules), then the app.' },
    ],
  },
};
