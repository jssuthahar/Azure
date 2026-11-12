/**
 * Guided Azure portal walkthroughs used by <PortalTour id="..." />.
 * Each step is one screen of the (simulated) new Azure portal, the element to
 * click (`t`), and what Nimbus says. Screens are simplified but follow the real
 * portal's layout, names and order of fields.
 */
import type { Tour, Step, Group, Body, Screen, Field, Pane } from '../../lib/portal-tour';

const HOME: Screen = { s: 'home' };
type R = [g: string, n: string, i: string];

/** Home → search → pick a service. */
function find(q: string, name: string, icon: string, sayHome: string, more: R[] = []): Step[] {
  return [
    { sc: HOME, t: 'search', say: sayHome },
    { sc: { s: 'search', q, results: [{ g: 'Services', n: name, i: icon }, ...more.map(([g, n, i]) => ({ g, n, i }))] }, t: `res:${name}`, say: `Type **${q}** in the search bar and pick **${name}** under *Services*.` },
  ];
}

interface Page { tab: number; groups: Group[]; say: string; t?: string; intro?: string }
function wizard(title: string, crumbs: string[], tabs: string[], pages: Page[]): Step[] {
  const last = tabs.length - 1;
  return pages.map((p) => ({
    sc: { s: 'create', title, crumbs, tabs, tab: p.tab, groups: p.groups, intro: p.intro, valid: p.tab === last },
    t: p.t ?? (p.tab === last ? 'btn:Create' : 'btn:Next'),
    say: p.say,
  }));
}
const done = (name: string, say: string, rg = 'rg-learn'): Step => ({ sc: { s: 'deploy', name, done: true, rg }, t: 'btn:Go to resource', say, toast: '✅ **Deployment succeeded**' });

const proj = (rg = 'rg-learn'): Group => ({ h: 'Project details', p: 'Select the subscription to manage deployed resources and costs. Use resource groups like folders to organize and manage all your resources.', f: [['Subscription *', 'Azure subscription 1'], ['Resource group *', rg, 's', 'Create new']] });
const review = (rows: [string, string][]): Group[] => [{ h: 'Summary', f: rows.map(([k, v]) => [k, v, 'i'] as Field) }];

type ResBase = { title: string; type: string; i: string; menu: (string | [string, string[]])[]; ess?: [string, string][]; crumbs?: string[]; cmds?: string[] };
const resOf = (b: ResBase) => (active: string, body?: Body[], cmds?: string[]): Screen => ({ s: 'res', ...b, active, body, cmds: cmds ?? (active === 'Overview' ? b.cmds : undefined), ess: active === 'Overview' ? b.ess : undefined });

/* ---------------- standard menus ---------------- */
const VM_MENU: ResBase['menu'] = ['Overview', 'Activity log', 'Access control (IAM)', 'Tags', 'Diagnose and solve problems', ['Connect', ['Connect', 'Bastion']], ['Networking', ['Network settings', 'Load balancing']], ['Settings', ['Disks', 'Extensions + applications', 'Configuration', 'Locks']], ['Availability + scale', ['Size', 'Availability + scaling']], ['Backup + disaster recovery', ['Backup', 'Disaster recovery']], ['Monitoring', ['Insights', 'Alerts', 'Metrics', 'Logs']]];
const RG_MENU: ResBase['menu'] = ['Overview', 'Activity log', 'Access control (IAM)', 'Tags', 'Resource visualizer', ['Settings', ['Deployments', 'Policies', 'Properties', 'Locks']], ['Cost Management', ['Cost analysis', 'Budgets', 'Advisor recommendations']], ['Monitoring', ['Alerts', 'Metrics', 'Logs']]];
const ST_MENU: ResBase['menu'] = ['Overview', 'Activity log', 'Tags', 'Access control (IAM)', 'Storage browser', ['Data storage', ['Containers', 'File shares', 'Queues', 'Tables']], ['Security + networking', ['Networking', 'Access keys', 'Shared access signature', 'Encryption']], ['Data management', ['Redundancy', 'Data protection', 'Lifecycle management']], ['Settings', ['Configuration', 'Locks']]];
const ENTRA_MENU: ResBase['menu'] = ['Overview', ['Manage', ['Users', 'Groups', 'External Identities', 'Roles and administrators', 'Enterprise applications', 'Licenses']], ['Security', ['Conditional Access', 'Authentication methods', 'Identity Protection']], ['Monitoring', ['Sign-in logs', 'Audit logs']]];

const vm = resOf({ title: 'vm-web-01', type: 'Virtual machine', i: 'vm', menu: VM_MENU, crumbs: ['rg-learn'], cmds: ['Connect', 'Start', 'Restart', 'Stop', 'Hibernate', 'Capture', 'Delete', 'Refresh'], ess: [['Resource group', 'rg-learn'], ['Status', 'Running'], ['Location', 'West Europe (Zone 1)'], ['Subscription', 'Azure subscription 1'], ['Operating system', 'Linux (ubuntu 24.04)'], ['Size', 'Standard B2s (2 vcpus, 4 GiB memory)'], ['Public IP address', '20.50.1.4'], ['Virtual network/subnet', 'vnet-learn/web']] });
const rg = resOf({ title: 'rg-learn', type: 'Resource group', i: 'rg', menu: RG_MENU, cmds: ['+ Create', 'Manage view', 'Delete resource group', 'Refresh', 'Export to CSV', 'Move'], ess: [['Subscription', 'Azure subscription 1'], ['Deployments', '3 Succeeded'], ['Location', 'West Europe'], ['Tags', 'Environment : Learning']] });
const st = resOf({ title: 'stlearn2026', type: 'Storage account', i: 'storage', menu: ST_MENU, crumbs: ['rg-learn'], cmds: ['Upload', 'Open in Explorer', 'Delete', 'Move', 'Refresh'], ess: [['Resource group', 'rg-learn'], ['Location', 'West Europe'], ['Primary/Secondary Location', 'Primary: West Europe, Secondary: North Europe'], ['Performance', 'Standard'], ['Replication', 'Geo-redundant storage (GRS)'], ['Account kind', 'StorageV2 (general purpose v2)']] });
const entra = resOf({ title: 'Contoso', type: 'Microsoft Entra ID', i: 'entra', menu: ENTRA_MENU, cmds: ['+ Add', 'Manage tenants', 'What’s new', 'Preview features'], ess: [['Name', 'Contoso'], ['Tenant ID', 'f3a1…-9c2e'], ['Primary domain', 'contoso.onmicrosoft.com'], ['License', 'Microsoft Entra ID P1'], ['Users', '248'], ['Groups', '31']] });
const vnet = resOf({ title: 'vnet-learn', type: 'Virtual network', i: 'vnet', menu: ['Overview', 'Activity log', 'Access control (IAM)', 'Tags', ['Settings', ['Address space', 'Connected devices', 'Subnets', 'DNS servers', 'Peerings', 'Service endpoints', 'Private endpoints', 'Locks']], ['Monitoring', ['Diagram', 'Metrics']]], crumbs: ['rg-learn'], cmds: ['Move', 'Delete', 'Refresh'], ess: [['Resource group', 'rg-learn'], ['Location', 'West Europe'], ['Address space', '10.0.0.0/16'], ['DNS servers', 'Azure provided DNS service']] });
const VM_ROWS = [['vm-web-01', 'Virtual machine', 'rg-learn', 'West Europe', 'Running'], ['vm-web-02', 'Virtual machine', 'rg-learn', 'West Europe', 'Running']];

/* ---------------- shared wizard pages ---------------- */
const VM_TABS = ['Basics', 'Disks', 'Networking', 'Management', 'Monitoring', 'Advanced', 'Tags', 'Review + create'];
const vmBasics = (avail: Field[], size = 'Standard_B2s - 2 vcpus, 4 GiB memory ($35.04/month)', extra: Field[] = []): Group[] => [
  proj(),
  { h: 'Instance details', f: [['Virtual machine name *', 'vm-web-01', 't'], ['Region *', '(Europe) West Europe'], ...avail, ['Security type', 'Trusted launch virtual machines'], ['Image *', 'Ubuntu Server 24.04 LTS - x64 Gen2'], ['VM architecture', '*x64|Arm64', 'r'], ...extra, ['Size *', size, 's', 'See all sizes']] },
  { h: 'Administrator account', f: [['Authentication type', '*SSH public key|Password', 'r'], ['Username *', 'azureuser', 't']] },
  { h: 'Inbound port rules', f: [['Public inbound ports *', 'None|*Allow selected ports', 'r'], ['Select inbound ports *', 'HTTP (80), SSH (22)']] },
];
const noRedundancy: Field = ['Availability options', 'No infrastructure redundancy required'];

/* ---------------- tours ---------------- */
export const TOURS: Record<string, Tour> = {
  'portal-tour': {
    title: 'A first look at the Azure portal',
    steps: [
      { sc: HOME, t: 'svc:Create a resource', say: 'This is the **Azure portal** home page at portal.azure.com. The top row of **Azure services** is your shortcut bar, starting with **Create a resource**.' },
      { sc: HOME, t: 'search', say: 'The **global search** bar finds any service, resource, resource group or Microsoft Learn doc. Press **G** then **/** to jump to it.' },
      { sc: { s: 'search', q: 'virtual', results: [{ g: 'Services', n: 'Virtual machines', i: 'vm' }, { g: 'Services', n: 'Virtual networks', i: 'vnet' }, { g: 'Services', n: 'Virtual WANs', i: 'wan' }, { g: 'Resources', n: 'vm-web-01', i: 'vm' }, { g: 'Marketplace', n: 'Virtual machine', i: 'marketplace' }, { g: 'Documentation', n: 'Virtual machines in Azure', i: 'doc' }] }, t: 'copilot', say: 'Results are grouped: **Services**, your **Resources**, **Marketplace** offers and **Documentation**. Now open **Copilot**.' },
      { sc: HOME, pane: { title: 'Copilot', sub: 'Microsoft Copilot in Azure', chat: [{ q: 'Which of my VMs are stopped but still costing money?', a: '**vm-test-02** is *Stopped* (OS shutdown) but not deallocated, so compute is still billed. Select **Stop** in the portal to deallocate it.' }] }, say: '**Copilot in Azure** answers questions about your resources in plain language and can help write CLI commands or KQL. Always check what it suggests.' },
      { sc: HOME, t: 'shell', say: 'The **Cloud Shell** icon opens a browser terminal with Azure CLI and PowerShell already signed in.' },
      { sc: HOME, t: 'bell', shell: ['Requesting a Cloud Shell. Succeeded.', 'Connecting terminal...', '', '$ az group list -o table', 'Name       Location     Status', '---------  -----------  ---------', 'rg-learn   westeurope   Succeeded', '$ '], say: 'Cloud Shell opens at the bottom. Same Azure, different tool: anything you click can also be typed. Next, the **notifications** bell.' },
      { sc: HOME, t: 'nav:Dashboard', pane: { title: 'Notifications', body: [{ b: 'note', tone: 'ok', text: '✔ **Deployment succeeded** · Deployment to resource group rg-learn was successful. *2 minutes ago*' }, { b: 'note', tone: 'info', text: 'ℹ️ **Resource group created** · rg-learn · *10 minutes ago*' }] }, say: '**Notifications** track long-running work like deployments, so you can keep working.' },
      { sc: { s: 'res', title: 'My Dashboard', type: 'Private dashboard', i: 'dash', menu: ['Overview'], active: 'Overview', cmds: ['+ Create', 'Upload', 'Download', 'Edit', 'Share', 'Full screen', 'Clone'], body: [{ b: 'cards', items: [{ t: 'All resources', v: '12', s: 'rg-learn · 3 regions' }, { t: 'Cost this month', v: '$48.20', s: 'Forecast $71.00', c: 'info' }, { t: 'Service Health', v: 'No issues', c: 'ok' }] }, { b: 'chart', title: 'CPU (average) · vm-web-01', data: [12, 18, 15, 30, 42, 38, 25, 20, 22, 17], unit: 'Last 24 hours, %' }] }, say: '**Dashboards** pin the tiles you care about (costs, health, metrics) and can be **shared** with your team. That is the portal: one web page to build, manage and monitor everything.' },
    ],
  },

  'create-vm': {
    title: 'Create a virtual machine',
    steps: [
      ...find('virtual machines', 'Virtual machines', 'vm', 'Let’s create a VM. Click the **search** bar at the top.', [['Services', 'Virtual machine scale sets', 'vmss'], ['Marketplace', 'Virtual machine', 'marketplace']]),
      { sc: { s: 'list', title: 'Virtual machines', i: 'vm', cols: ['Type', 'Resource group', 'Location', 'Status'], rows: [] }, t: 'cmd:+ Create', say: 'No VMs yet. Select **+ Create** → *Azure virtual machine*.' },
      ...wizard('Create a virtual machine', ['Virtual machines'], VM_TABS, [
        { tab: 0, groups: vmBasics([noRedundancy]), t: 'f:Size', say: '**Basics**: pick the subscription and **resource group**, a name, a **region**, an **image** (the operating system) and a **size**. The size sets the CPU, memory and the price per month.' },
        { tab: 0, groups: vmBasics([noRedundancy]), say: '**Administrator account** and **inbound ports**: you decide who can sign in, and which ports are open. With IaaS, the OS is **your** responsibility. Select **Next : Disks**.' },
        { tab: 1, groups: [{ h: 'VM disk encryption', f: [['Encryption at host', '', 'c']] }, { h: 'OS disk', f: [['OS disk size', 'Image default (30 GiB)'], ['OS disk type *', 'Premium SSD (locally-redundant storage)'], ['Delete with VM', '*Delete with VM', 'c']] }, { h: 'Data disks', p: 'You can add and configure additional data disks for your virtual machine.' }], say: '**Disks**: the OS disk is a managed disk. Premium SSD is fast, Standard HDD is cheap. Disks are billed even when the VM is stopped.' },
        { tab: 2, groups: [{ h: 'Network interface', f: [['Virtual network *', '(new) vnet-learn'], ['Subnet *', '(new) default (10.0.0.0/24)'], ['Public IP', '(new) vm-web-01-ip'], ['NIC network security group', 'None|*Basic|Advanced', 'r'], ['Load balancing options', '*None|Azure load balancer|Application gateway', 'r']] }], say: '**Networking**: the VM is placed in a **virtual network** and subnet, gets a public IP and a basic **network security group** with the ports you allowed.' },
        { tab: 7, groups: review([['Price', '1 X Standard B2s by Microsoft · **0.0480 USD/hr**'], ['Subscription', 'Azure subscription 1'], ['Resource group', 'rg-learn'], ['Virtual machine name', 'vm-web-01'], ['Region', 'West Europe'], ['Image', 'Ubuntu Server 24.04 LTS'], ['Size', 'Standard B2s']]), say: '**Review + create** validates everything and shows the **hourly price**. Select **Create**.' },
      ]),
      done('CreateVm-ubuntu-20261112', 'Azure Resource Manager builds the VM, disk, NIC, public IP and NSG. **Your deployment is complete.** Select **Go to resource**.'),
      { sc: vm('Overview'), t: 'cmd:Stop', say: 'The VM **Overview**: status, size, IPs. Billing for compute runs while it’s *Running*. Select **Stop** to deallocate it and stop paying for compute (disks still cost a little).' },
      { sc: vm('Overview'), toast: '✅ Successfully stopped virtual machine **vm-web-01** (deallocated).', say: 'Done. You created a VM in minutes without buying hardware. That is **IaaS**: Microsoft runs the datacenter, you run the operating system.' },
    ],
  },

  'vm-availability': {
    title: 'Spread VMs across availability zones',
    steps: [
      ...find('virtual machines', 'Virtual machines', 'vm', 'Let’s make a VM highly available. Search for **virtual machines**.'),
      { sc: { s: 'list', title: 'Virtual machines', i: 'vm', cols: ['Type', 'Resource group', 'Location', 'Status'], rows: [] }, t: 'cmd:+ Create', say: 'Select **+ Create**.' },
      ...wizard('Create a virtual machine', ['Virtual machines'], VM_TABS, [
        { tab: 0, groups: vmBasics([noRedundancy]), t: 'f:Availability options', say: 'Look at **Availability options**. The default, *No infrastructure redundancy*, puts one VM in one place: if that datacenter fails, your app is down.' },
        { tab: 0, groups: vmBasics([['Availability options', 'Availability zone', 's', '**Availability zone**, Virtual machine scale set, Availability set'], ['Zone options', '*Self-selected zone|Azure-selected zone', 'r'], ['Availability zone *', '*Zone 1|*Zone 2|*Zone 3', 'c', 'You can now select multiple zones. Selecting multiple zones will create **one VM per zone**.']]), t: 'f:Availability zone', say: 'Choose **Availability zone** and tick **Zones 1, 2 and 3**. Azure creates **three VMs**, one in each zone: three separate datacenters with their own power, cooling and network.' },
        { tab: 7, groups: review([['Price', '3 X Standard B2s · **0.1440 USD/hr**'], ['Availability options', 'Availability zone'], ['Availability zone', '1, 2, 3'], ['Virtual machine name', 'vm-web-1, vm-web-2, vm-web-3']]), say: 'Three VMs cost three times as much, but the **SLA rises to 99.99%** for VMs in two or more zones. Select **Create**.' },
      ]),
      { sc: { s: 'list', title: 'Virtual machines', i: 'vm', cols: ['Type', 'Location', 'Availability zone', 'Status'], rows: [['vm-web-1', 'Virtual machine', 'West Europe', '1', 'Running'], ['vm-web-2', 'Virtual machine', 'West Europe', '2', 'Running'], ['vm-web-3', 'Virtual machine', 'West Europe', '3', 'Running']] }, say: 'One VM per zone. Put a **zone-redundant load balancer** in front and a whole zone can fail while users keep being served.' },
    ],
  },

  scaling: {
    title: 'Scale a VM up, then scale a scale set out',
    steps: [
      { sc: vm('Overview'), t: 'menu:Size', say: 'This VM is too small for today’s traffic. Under **Availability + scale**, open **Size**.' },
      { sc: vm('Size', [{ b: 'note', tone: 'warn', text: '⚠️ If the virtual machine is currently running, changing its size will cause it to be **restarted**.' }, { b: 'table', cols: ['VM Size', 'vCPUs', 'RAM (GiB)', 'Cost/month'], rows: [['B2s (current)', '2', '4', '$35.04'], ['D4s_v5', '4', '16', '$140.16'], ['D8s_v5', '8', '32', '$280.32'], ['D16s_v5', '16', '64', '$560.64']] }], ['Resize']), t: 'row:D4s_v5', say: '**Scale up (vertical)**: pick a bigger size such as **D4s_v5** and select **Resize**. Note the warning: the VM **restarts**, and there is always a biggest size.' },
      ...find('scale sets', 'Virtual machine scale sets', 'vmss', 'For no-restart growth, **scale out** instead. Search for **scale sets**.'),
      { sc: { s: 'res', title: 'vmss-web', type: 'Virtual machine scale set', i: 'vmss', crumbs: ['rg-learn'], menu: ['Overview', 'Activity log', 'Access control (IAM)', ['Settings', ['Instances', 'Networking', 'Scaling', 'Size', 'Upgrade policy']], ['Monitoring', ['Metrics', 'Alerts']]], active: 'Scaling', body: [{ b: 'form', groups: [{ f: [['Choose how to scale your resource', '*Manual scale|Custom autoscale', 'r'], ['Instance count', '2 → **5**', 'i', 'Drag the slider or type a number']] }], save: 'Save' }] }, t: 'btn:Save', say: '**Scale out (horizontal)**: in the scale set’s **Scaling** blade, raise the **instance count** from 2 to 5 and **Save**. New identical VMs join behind the load balancer with no restart.' },
      { sc: { s: 'res', title: 'vmss-web', type: 'Virtual machine scale set', i: 'vmss', crumbs: ['rg-learn'], menu: ['Overview', ['Settings', ['Instances', 'Scaling']]], active: 'Instances', body: [{ b: 'table', cmds: ['Start', 'Restart', 'Stop', 'Reimage', 'Delete', 'Upgrade'], cols: ['Computer name', 'Status', 'Health state', 'Zone'], rows: [['vmss-web_0', 'vmssweb000000', 'Running', 'Healthy', '1'], ['vmss-web_1', 'vmssweb000001', 'Running', 'Healthy', '2'], ['vmss-web_2', 'vmssweb000002', 'Creating', '', '3'], ['vmss-web_3', 'vmssweb000003', 'Creating', '', '1'], ['vmss-web_4', 'vmssweb000004', 'Creating', '', '2']] }] }, say: 'Three new instances are being created. **Scale up** = bigger machine. **Scale out** = more machines. In the next lesson Azure does this automatically.' },
    ],
  },

  autoscale: {
    title: 'Turn on autoscale (elasticity)',
    steps: [
      { sc: { s: 'res', title: 'vmss-web', type: 'Virtual machine scale set', i: 'vmss', crumbs: ['rg-learn'], menu: ['Overview', ['Settings', ['Instances', 'Scaling', 'Size']], ['Monitoring', ['Metrics']]], active: 'Overview', cmds: ['Start', 'Restart', 'Stop', 'Delete', 'Refresh'], ess: [['Instances', '2 (2 running)'], ['Location', 'West Europe'], ['Orchestration mode', 'Flexible'], ['Size', 'Standard_B2s']] }, t: 'menu:Scaling', say: 'A scale set with 2 VMs. Open **Scaling**.' },
      { sc: { s: 'res', title: 'vmss-web', type: 'Virtual machine scale set', i: 'vmss', menu: ['Overview', ['Settings', ['Instances', 'Scaling']]], active: 'Scaling', body: [{ b: 'form', groups: [{ f: [['Choose how to scale your resource', 'Manual scale|*Custom autoscale', 'r']] }, { h: 'Default · Auto created default scale condition', f: [['Scale mode', '*Scale based on a metric|Scale to a specific instance count', 'r'], ['Instance limits', 'Minimum **2** · Maximum **10** · Default **2**', 'i']] }] }], cmds: ['Save', 'Discard', 'Refresh', 'Logs', 'JSON'] }, t: 'f:Scale mode', say: 'Choose **Custom autoscale** → **Scale based on a metric**, with a minimum of 2 and maximum of 10 instances. You pay for at most 10, at least 2.' },
      { sc: { s: 'res', title: 'vmss-web', type: 'Virtual machine scale set', i: 'vmss', menu: ['Overview', ['Settings', ['Instances', 'Scaling']]], active: 'Scaling', body: [{ b: 'chart', title: 'Percentage CPU (Average) · last 1 hour', data: [32, 40, 55, 72, 81, 76, 64, 50, 38, 25], unit: 'Threshold 70%', line: 70, lineLabel: 'Scale out above 70%' }] }, pane: { title: 'Scale rule', groups: [{ h: 'Criteria', f: [['Metric name', 'Percentage CPU'], ['Operator', 'Greater than'], ['Metric threshold to trigger scale action', '70', 't'], ['Duration (minutes)', '10', 't']] }, { h: 'Action', f: [['Operation', 'Increase count by'], ['Instance count', '1', 't'], ['Cool down (minutes)', '5', 't']] }], btns: ['Add', 'Cancel'] }, t: 'btn:Add', say: 'Add a **scale-out rule**: when average CPU is **above 70%** for 10 minutes, **add 1 instance**. Then add a matching **scale-in rule**: below 30%, remove 1.' },
      { sc: { s: 'res', title: 'vmss-web', type: 'Virtual machine scale set', i: 'vmss', menu: ['Overview', ['Settings', ['Instances', 'Scaling']]], active: 'Scaling', body: [{ b: 'table', title: 'Run history', cols: ['Time', 'Operation', 'Instances'], rows: [['09:10', 'Scale out (CPU 81% > 70%)', '2 → 3'], ['09:25', 'Scale out (CPU 76% > 70%)', '3 → 4'], ['13:40', 'Scale in (CPU 24% < 30%)', '4 → 3'], ['22:05', 'Scale in (CPU 12% < 30%)', '3 → 2']] }] }, say: '**Run history** shows Azure adding instances in the morning rush and removing them at night. That is **elasticity**: capacity follows demand, and so does your bill.' },
    ],
  },

  'vmss-avset': {
    title: 'Create a scale set and an availability set',
    steps: [
      ...find('scale sets', 'Virtual machine scale sets', 'vmss', 'Search for **scale sets**.', [['Services', 'Availability sets', 'avset']]),
      { sc: { s: 'list', title: 'Virtual machine scale sets', i: 'vmss', cols: ['Type', 'Location', 'Instances'], rows: [] }, t: 'cmd:+ Create', say: 'Select **+ Create**.' },
      ...wizard('Create a virtual machine scale set', ['Virtual machine scale sets'], ['Basics', 'Spot', 'Disks', 'Networking', 'Scaling', 'Management', 'Health', 'Advanced', 'Tags', 'Review + create'], [
        { tab: 0, groups: [proj(), { h: 'Scale set details', f: [['Virtual machine scale set name *', 'vmss-web', 't'], ['Region *', '(Europe) West Europe'], ['Availability zone', '*Zone 1|*Zone 2|*Zone 3', 'c']] }, { h: 'Orchestration', f: [['Orchestration mode *', '*Flexible|Uniform', 'r']] }, { h: 'Instance details', f: [['Image *', 'Ubuntu Server 24.04 LTS - x64 Gen2'], ['Size *', 'Standard_B2s - 2 vcpus, 4 GiB memory']] }], say: 'A **scale set** is a group of **identical** VMs from one image. Spread it across **zones 1, 2 and 3**.' },
        { tab: 4, groups: [{ h: 'Scaling', f: [['Initial instance count *', '2', 't'], ['Scaling policy', 'Manual|*Autoscaling', 'r'], ['Minimum / maximum instances', '2 / 10', 'i'], ['Scale out CPU threshold (%)', '75', 't'], ['Scale in CPU threshold (%)', '25', 't']] }], say: 'On **Scaling**: start with 2, and let **autoscaling** grow to 10 when CPU is busy. Select **Review + create**.', t: 'btn:Review + create' },
      ]),
      ...find('availability sets', 'Availability sets', 'avset', 'Now the older option for one datacenter: search **availability sets**.'),
      ...wizard('Create availability set', ['Availability sets'], ['Basics', 'Advanced', 'Tags', 'Review + create'], [
        { tab: 0, groups: [proj(), { h: 'Instance details', f: [['Name *', 'avset-web', 't'], ['Region *', '(Europe) West Europe'], ['Fault domains', '2', 't', 'VMs in different fault domains are on **separate racks** (power + network switch).'], ['Update domains', '5', 't', 'VMs in different update domains are **rebooted at different times** during maintenance.']] }], t: 'f:Fault domains', say: 'An **availability set** spreads VMs over **fault domains** (racks) and **update domains** (maintenance groups) inside one datacenter: SLA 99.95%. Zones protect against more, a whole datacenter failing, for 99.99%.' },
      ]),
    ],
  },

  'create-webapp': {
    title: 'Create a web app (App Service)',
    steps: [
      ...find('app services', 'App Services', 'web', 'Search for **App Services**.', [['Services', 'App Service plans', 'plan']]),
      { sc: { s: 'list', title: 'App Services', i: 'web', cols: ['Status', 'Location', 'Pricing tier'], rows: [] }, t: 'cmd:+ Create', say: 'Select **+ Create** → **Web App**.' },
      ...wizard('Create Web App', ['App Services'], ['Basics', 'Database', 'Deployment', 'Networking', 'Monitor + secure', 'Tags', 'Review + create'], [
        { tab: 0, groups: [proj(), { h: 'Instance Details', f: [['Name *', 'contoso-shop', 't', '.azurewebsites.net · ✓ available'], ['Publish *', '*Code|Container', 'r'], ['Runtime stack *', '.NET 9 (STS)'], ['Operating System *', '*Linux|Windows', 'r'], ['Region *', 'West Europe']] }, { h: 'Pricing plans', p: 'App Service plan pricing tier determines the location, features, cost and compute resources associated with your app.', f: [['Linux Plan (West Europe) *', '(New) ASP-rglearn'], ['Pricing plan', 'Premium V3 P0V3 (195 minimum ACU/vCPU, 4 GB memory, 1 vCPU)']] }], t: 'f:Runtime stack', say: 'No VM to configure. Just a **name**, your **runtime stack** (.NET, Node, Python, Java, PHP) and a **pricing plan**. Microsoft runs the OS, patches and web server. That is **PaaS**.' },
        { tab: 2, groups: [{ h: 'GitHub Actions settings', f: [['Continuous deployment', 'Disable|*Enable', 'r'], ['Organization', 'contoso'], ['Repository', 'shop-web'], ['Branch', 'main']] }], say: '**Deployment**: connect GitHub and every push to *main* deploys automatically.', t: 'btn:Review + create' },
        { tab: 6, groups: review([['Name', 'contoso-shop'], ['Publish', 'Code'], ['Runtime stack', '.NET 9 (STS)'], ['SKU', 'Premium V3 P0V3']]), say: 'Review and **Create**.' },
      ]),
      done('Microsoft.Web-WebApp-Portal-20261112', 'Done in about a minute. **Go to resource**.'),
      { sc: { s: 'res', title: 'contoso-shop', type: 'Web App', i: 'web', crumbs: ['rg-learn'], menu: ['Overview', 'Activity log', 'Access control (IAM)', ['Deployment', ['Deployment slots', 'Deployment Center']], ['Settings', ['Environment variables', 'Configuration', 'Custom domains', 'Certificates', 'Scale up (App Service plan)', 'Scale out (App Service plan)']], ['Monitoring', ['Application Insights', 'Metrics', 'Log stream']]], active: 'Overview', cmds: ['Browse', 'Stop', 'Swap', 'Restart', 'Delete', 'Refresh'], ess: [['Status', 'Running'], ['Default domain', 'contoso-shop.azurewebsites.net'], ['Location', 'West Europe'], ['App Service plan', 'ASP-rglearn (P0v3: 1)'], ['Operating System', 'Linux'], ['Runtime Stack', 'Dotnetcore - 9.0']] }, t: 'menu:Scale out (App Service plan)', say: 'Your site is live at **contoso-shop.azurewebsites.net**. Scaling is a setting, not a project: open **Scale out**.' },
      { sc: { s: 'res', title: 'contoso-shop', type: 'Web App', i: 'web', menu: ['Overview', ['Settings', ['Scale up (App Service plan)', 'Scale out (App Service plan)']]], active: 'Scale out (App Service plan)', body: [{ b: 'form', groups: [{ f: [['Scale out method', 'Manual|*Automatic|Rules Based', 'r', '**Automatic**: the platform adds instances based on HTTP traffic.'], ['Maximum burst', '10', 't'], ['Always ready instances', '1', 't']] }], save: 'Save' }] }, say: 'Pick **Automatic** and App Service adds instances when traffic grows. No servers to build: you bring the code, Azure runs the platform.' },
    ],
  },

  'create-function': {
    title: 'Create a serverless Function App',
    steps: [
      ...find('function app', 'Function App', 'func', 'Search for **Function App**.'),
      { sc: { s: 'list', title: 'Function App', i: 'func', cols: ['Status', 'Location', 'Plan'], rows: [] }, t: 'cmd:+ Create', say: 'Select **+ Create**.' },
      { sc: { s: 'create', title: 'Create Function App', crumbs: ['Function App'], tabs: ['Select a hosting option'], tab: 0, groups: [{ h: 'Select a hosting option', f: [['Flex Consumption', '**Recommended.** Serverless, pay per execution, scale to zero, fast scale-out, virtual network support.', 'i'], ['Functions Premium', 'Always-ready instances, no cold start, VNet, longer runs.', 'i'], ['App Service', 'Run on an existing App Service plan you already pay for.', 'i'], ['Container Apps environment', 'Run functions as containers.', 'i']] }] }, t: 'f:Flex Consumption', say: 'First choose **how it is hosted**. **Flex Consumption** is truly serverless: no events, no instances, nothing to pay for compute.' },
      ...wizard('Create Function App (Flex Consumption)', ['Function App'], ['Basics', 'Storage', 'Azure OpenAI', 'Networking', 'Monitoring', 'Deployment', 'Authentication', 'Tags', 'Review + create'], [
        { tab: 0, groups: [proj(), { h: 'Instance Details', f: [['Function App name *', 'func-orders', 't', '.azurewebsites.net'], ['Region *', 'West Europe'], ['Runtime stack *', '.NET'], ['Version *', '9.0 (isolated worker model)'], ['Instance size', '2048 MB']] }], say: 'Name, region and runtime. No size, no instance count: the platform scales for you.', t: 'btn:Review + create' },
        { tab: 8, groups: review([['Hosting', 'Flex Consumption'], ['Runtime', '.NET 9 isolated'], ['Pricing', 'Pay per execution and GB-seconds · free monthly grant']]), say: 'Review and **Create**.' },
      ]),
      { sc: { s: 'res', title: 'func-orders', type: 'Function App', i: 'func', crumbs: ['rg-learn'], menu: ['Overview', 'Activity log', ['Functions', ['Functions', 'App keys']], ['Settings', ['Scale and concurrency', 'Environment variables']], ['Monitoring', ['Application Insights', 'Logs', 'Metrics']]], active: 'Functions', body: [{ b: 'table', cmds: ['+ Create', 'Refresh'], cols: ['Trigger', 'Status', 'Executions (24h)'], rows: [['NewOrder', 'HTTP', 'Enabled', '12,480'], ['ResizeImage', 'Blob', 'Enabled', '3,201'], ['NightlyReport', 'Timer', 'Enabled', '1']] }] }, say: 'Each **function** has a **trigger**: an HTTP request, a new blob, a timer, a queue message. Code runs only when the event happens.' },
      { sc: { s: 'res', title: 'func-orders', type: 'Function App', i: 'func', menu: ['Overview', ['Monitoring', ['Metrics']]], active: 'Metrics', body: [{ b: 'chart', title: 'Function execution count · last 24 hours', data: [0, 0, 5, 40, 210, 380, 260, 120, 30, 0], unit: 'Night → day → night' }, { b: 'note', tone: 'ok', text: '💤 At night executions fall to **0**, instances scale to **zero**, and compute cost is **$0**.' }] }, say: 'Executions follow demand and drop to **zero** at night. That is **serverless**: event-driven, automatic scale, pay only while code runs.' },
    ],
  },

  containers: {
    title: 'Run a container (ACI) and a Kubernetes cluster (AKS)',
    steps: [
      ...find('container instances', 'Container instances', 'aci', 'Search for **container instances**.', [['Services', 'Kubernetes services', 'aks'], ['Services', 'Container Apps', 'aci']]),
      ...wizard('Create container instance', ['Container instances'], ['Basics', 'Networking', 'Monitoring', 'Advanced', 'Tags', 'Review + create'], [
        { tab: 0, groups: [proj(), { h: 'Container details', f: [['Container name *', 'hello-aci', 't'], ['Region *', '(Europe) West Europe'], ['Availability zones', 'None'], ['Image source *', '*Quickstart images|Azure Container Registry|Other registry', 'r'], ['Image *', 'mcr.microsoft.com/azuredocs/aci-helloworld:latest (Linux)'], ['Size *', '1 vcpu, 1.5 GiB memory, 0 gpus']] }], say: '**Azure Container Instances** runs one container in seconds: pick an **image** and a size. No VM, no cluster. Great for quick jobs and simple apps.', t: 'btn:Review + create' },
      ]),
      ...find('kubernetes', 'Kubernetes services', 'aks', 'For many containers that must scale and heal themselves, use **AKS**. Search **kubernetes**.'),
      ...wizard('Create Kubernetes cluster', ['Kubernetes services'], ['Basics', 'Node pools', 'Networking', 'Integrations', 'Monitoring', 'Security', 'Advanced', 'Tags', 'Review + create'], [
        { tab: 0, groups: [proj(), { h: 'Cluster details', f: [['Cluster preset configuration', 'Production Standard'], ['Kubernetes cluster name *', 'aks-shop', 't'], ['Region *', '(Europe) West Europe'], ['Availability zones', 'Zones 1,2,3'], ['AKS pricing tier', 'Standard'], ['Kubernetes version *', '1.33.x (default)'], ['Automatic upgrade', 'Enabled with patch (recommended)']] }], say: '**AKS** is managed Kubernetes: Microsoft runs the **control plane** for you. You choose region, zones and version.' },
        { tab: 1, groups: [{ h: 'Node pools', p: 'In addition to the required primary node pool configured on the Basics tab, you can also add optional node pools.', f: [['agentpool (System)', 'Standard_D4ds_v5 · Autoscale **2–5** nodes · Zones 1,2,3', 'i'], ['userpool (User)', 'Standard_D8ds_v5 · Autoscale **0–20** nodes', 'i']] }], say: '**Node pools** are the VMs your containers run on. The cluster autoscaler adds and removes nodes with demand.', t: 'btn:Review + create' },
      ]),
    ],
  },

  avd: {
    title: 'Create an Azure Virtual Desktop host pool',
    steps: [
      ...find('virtual desktop', 'Azure Virtual Desktop', 'avd', 'Search for **Azure Virtual Desktop**.'),
      { sc: { s: 'res', title: 'Azure Virtual Desktop', type: 'Overview', i: 'avd', menu: ['Overview', ['Manage', ['Host pools', 'Application groups', 'Workspaces', 'Scaling plans', 'Users']]], active: 'Host pools', body: [{ b: 'table', cmds: ['+ Create', 'Refresh'], cols: ['Type', 'Location', 'Session hosts'], rows: [] }] }, t: 'cmd:+ Create', say: 'A **host pool** is a group of Azure VMs that serve desktops to your users. Select **+ Create**.' },
      ...wizard('Create a host pool', ['Azure Virtual Desktop'], ['Basics', 'Session hosts', 'Workspace', 'Advanced', 'Tags', 'Review + create'], [
        { tab: 0, groups: [proj(), { h: 'Host pool details', f: [['Host pool name *', 'hp-office', 't'], ['Location *', 'West Europe'], ['Preferred app group type *', 'Desktop'], ['Host pool type *', '*Pooled|Personal', 'r', '**Pooled**: many users share each VM. **Personal**: one VM per user.'], ['Load balancing algorithm *', 'Breadth-first'], ['Max session limit', '8', 't']] }], say: '**Pooled** desktops let several people share one multi-session Windows VM, which saves money.' },
        { tab: 1, groups: [{ f: [['Add virtual machines', 'No|*Yes', 'r'], ['Virtual machine size *', 'Standard D4s v5 (4 vCPUs, 16 GiB)'], ['Number of VMs *', '3', 't'], ['Image *', 'Windows 11 Enterprise multi-session + Microsoft 365 Apps'], ['Virtual network *', 'vnet-learn / web']] }], say: '**Session hosts** are the VMs. Windows 11 **multi-session** is only available in Azure Virtual Desktop.' },
        { tab: 2, groups: [{ f: [['Register desktop app group', 'No|*Yes', 'r'], ['To this workspace *', '(new) ws-office']] }], say: 'Publish the desktop to a **workspace** that users see in the Windows App.', t: 'btn:Review + create' },
      ]),
      { sc: { s: 'res', title: 'hp-office-DAG', type: 'Application group', i: 'avd', menu: ['Overview', ['Manage', ['Applications', 'Assignments']]], active: 'Assignments', body: [{ b: 'table', cmds: ['+ Add', 'Remove'], cols: ['Type', 'Email'], rows: [['Finance team', 'Group', 'finance@contoso.com']] }] }, say: 'Assign users or groups. They sign in from any device and stream the desktop: **data stays in Azure**, never on the laptop.' },
    ],
  },

  'create-rg': {
    title: 'Create and clean up a resource group',
    steps: [
      { sc: HOME, t: 'nav:Resource groups', say: 'Under **Navigate**, select **Resource groups**.' },
      { sc: { s: 'list', title: 'Resource groups', i: 'rg', cols: ['Subscription', 'Location'], rows: [['NetworkWatcherRG', 'Azure subscription 1', 'West Europe']] }, t: 'cmd:+ Create', say: 'A **resource group** is a folder for resources that share a lifecycle. Select **+ Create**.' },
      ...wizard('Create a resource group', ['Resource groups'], ['Basics', 'Tags', 'Review + create'], [
        { tab: 0, groups: [{ h: 'Project details', f: [['Subscription *', 'Azure subscription 1'], ['Resource group *', 'rg-learn', 't']] }, { h: 'Resource details', f: [['Region *', '(Europe) West Europe', 's', 'Where the group’s **metadata** is stored. Resources inside can be in any region.']] }], t: 'f:Region', say: 'Give it a name and a **region**. The region only stores the group’s metadata; resources inside can live anywhere.' },
        { tab: 1, groups: [{ p: 'Tags are name/value pairs that enable you to categorize resources and view consolidated billing.', f: [['Environment', 'Learning', 't'], ['Owner', 'ana@contoso.com', 't']] }], say: 'Add **tags** so costs and owners are easy to find later.', t: 'btn:Review + create' },
        { tab: 2, groups: review([['Subscription', 'Azure subscription 1'], ['Resource group', 'rg-learn'], ['Region', 'West Europe'], ['Tags', 'Environment: Learning, Owner: ana@contoso.com']]), say: 'Select **Create**. Resource groups are free.' },
      ]),
      { sc: rg('Overview', [{ b: 'table', title: 'Resources', cols: ['Type', 'Location'], rows: [['vm-web-01', 'Virtual machine', 'West Europe'], ['vm-web-01_OsDisk', 'Disk', 'West Europe'], ['vm-web-01-nic', 'Network interface', 'West Europe'], ['stlearn2026', 'Storage account', 'West Europe']] }]), t: 'cmd:Delete resource group', say: 'Every resource belongs to **exactly one** resource group. When the project ends, delete the group and **everything inside goes with it**.' },
      { sc: rg('Overview'), pane: { title: 'Delete a resource group', body: [{ b: 'note', tone: 'bad', text: 'The following resource group and **all its dependent resources will be permanently deleted**.' }], groups: [{ f: [['Enter resource group name to confirm deletion *', 'rg-learn', 't']] }], btns: ['Delete', 'Cancel'] }, t: 'btn:Delete', say: 'Type the name to confirm. One click cleans up the whole project, which is why related resources belong in the same group.' },
    ],
  },

  subscriptions: {
    title: 'Explore a subscription',
    steps: [
      { sc: HOME, t: 'nav:Subscriptions', say: 'Select **Subscriptions** under Navigate.' },
      { sc: { s: 'list', title: 'Subscriptions', i: 'sub', cmds: ['+ Add', 'Manage Policies', 'View Requests', 'Refresh'], cols: ['Subscription ID', 'My role', 'Current cost', 'Status'], rows: [['Contoso-Production', '1b2c…a71', 'Owner', '$4,812.40', 'Active'], ['Contoso-Dev', '9e44…0c3', 'Contributor', '$318.15', 'Active'], ['Azure subscription 1', '5d0f…e22', 'Owner', '$48.20', 'Active']] }, t: 'row:Contoso-Production', say: 'A **subscription** is a billing and access boundary. Companies often split **Production** and **Dev** so each has its own bill and permissions.' },
      { sc: { s: 'res', title: 'Contoso-Production', type: 'Subscription', i: 'sub', menu: ['Overview', 'Activity log', 'Access control (IAM)', 'Tags', ['Cost Management', ['Cost analysis', 'Budgets']], ['Billing', ['Invoices', 'Partner information']], ['Settings', ['Programmatic deployment', 'Resource groups', 'Resources', 'Preview features', 'Usage + quotas', 'Policies', 'Management certificates', 'Resource providers']]], active: 'Overview', cmds: ['Cancel subscription', 'Rename', 'Change directory', 'Feedback'], ess: [['Subscription ID', '1b2c…a71'], ['Directory', 'Contoso (contoso.onmicrosoft.com)'], ['Status', 'Active'], ['Offer', 'Microsoft Customer Agreement'], ['My role', 'Owner'], ['Parent management group', 'Production']], body: [{ b: 'cards', items: [{ t: 'Spending', v: '$4,812.40', s: 'This month · forecast $6,900' }, { t: 'Top service', v: 'Virtual Machines', s: '$2,904' }] }] }, t: 'menu:Usage + quotas', say: 'The overview shows the **directory** (Entra tenant) it trusts, its **offer** and its **cost**. Open **Usage + quotas**.' },
      { sc: { s: 'res', title: 'Contoso-Production', type: 'Subscription', i: 'sub', menu: ['Overview', ['Settings', ['Usage + quotas', 'Resource providers']]], active: 'Usage + quotas', body: [{ b: 'table', cmds: ['Request increase', 'Refresh'], cols: ['Region', 'Usage', 'Limit'], rows: [['Total Regional vCPUs', 'West Europe', '64', '100'], ['Standard Dv5 Family vCPUs', 'West Europe', '48', '50'], ['Public IP Addresses', 'West Europe', '9', '1000']] }] }, say: 'Subscriptions have **quotas** (limits) per region. Near a limit? **Request increase**. A subscription = one bill, one access boundary, its own limits.' },
    ],
  },

  'management-groups': {
    title: 'Organise subscriptions with management groups',
    steps: [
      ...find('management groups', 'Management groups', 'mg', 'Search for **management groups**.'),
      { sc: { s: 'res', title: 'Management groups', type: 'Contoso', i: 'mg', menu: ['Overview', 'Activity log', 'Access control (IAM)', ['Governance', ['Policies', 'Security', 'Cost Management']]], active: 'Overview', cmds: ['+ Create', 'Add subscription', 'Refresh', 'Expand all'], body: [{ b: 'tree', nodes: [{ n: 'Tenant Root Group', d: 0, i: 'mg' }, { n: 'Contoso', d: 1, i: 'mg' }, { n: 'Production', d: 2, i: 'mg', tag: 'Policy: Allowed locations' }, { n: 'Contoso-Production', d: 3, i: 'sub' }, { n: 'Contoso-Shop', d: 3, i: 'sub' }, { n: 'Development', d: 2, i: 'mg' }, { n: 'Contoso-Dev', d: 3, i: 'sub' }] }] }, t: 'cmd:+ Create', say: 'The hierarchy: **Tenant Root Group** → **management groups** → **subscriptions** → resource groups → resources. Up to **six levels** of management groups below the root.' },
      { sc: { s: 'res', title: 'Management groups', type: 'Contoso', i: 'mg', menu: ['Overview'], active: 'Overview', body: [] }, pane: { title: 'Create management group', groups: [{ f: [['Management group ID *', 'sandbox', 't', 'Cannot be changed later.'], ['Management group display name', 'Sandbox', 't']] }], btns: ['Submit', 'Cancel'] }, t: 'btn:Submit', say: 'Create a **Sandbox** group for experiments.' },
      { sc: { s: 'res', title: 'Production', type: 'Management group', i: 'mg', menu: ['Overview', 'Activity log', 'Access control (IAM)', ['Governance', ['Policies', 'Cost Management']]], active: 'Policies', body: [{ b: 'table', cols: ['Scope', 'Effect', 'Compliance'], rows: [['Allowed locations', 'Production', 'Deny', 'Compliant'], ['Require tag: CostCenter', 'Production', 'Deny', 'Compliant']] }, { b: 'note', tone: 'info', text: '⬇️ Assigned once here, these policies are **inherited** by every subscription, resource group and resource below.' }] }, say: 'Assign a **policy** or **role** once at a management group and it **flows down** to every subscription inside. Govern 100 subscriptions with one assignment.' },
    ],
  },

  'create-storage': {
    title: 'Create a storage account',
    steps: [
      ...find('storage accounts', 'Storage accounts', 'storage', 'Search for **storage accounts**.', [['Services', 'Storage browser', 'storage']]),
      { sc: { s: 'list', title: 'Storage accounts', i: 'storage', cols: ['Type', 'Kind', 'Location'], rows: [] }, t: 'cmd:+ Create', say: 'Select **+ Create**.' },
      ...wizard('Create a storage account', ['Storage accounts'], ['Basics', 'Advanced', 'Networking', 'Data protection', 'Encryption', 'Tags', 'Review + create'], [
        { tab: 0, groups: [proj(), { h: 'Instance details', f: [['Storage account name *', 'stlearn2026', 't', '3–24 characters, **lowercase letters and numbers only**, globally unique. Becomes https://stlearn2026.blob.core.windows.net'], ['Region *', '(Europe) West Europe'], ['Preferred storage type', 'Azure Blob Storage or Azure Data Lake Storage Gen 2'], ['Performance *', '*Standard: recommended for most scenarios (general-purpose v2 account)|Premium: low latency', 'r'], ['Redundancy *', 'Geo-redundant storage (GRS)', 's', 'LRS · ZRS · GRS · GZRS'], ['Make read access to data available in the event of regional unavailability', '', 'c']] }], t: 'f:Storage account name', say: 'The name must be **globally unique** because it becomes part of a public URL. Then choose **performance** and **redundancy** (how many copies, where).' },
        { tab: 1, groups: [{ h: 'Security', f: [['Require secure transfer for REST API operations', '*Enabled', 'c'], ['Allow enabling anonymous access on individual containers', '', 'c'], ['Minimum TLS version', 'Version 1.2']] }, { h: 'Blob storage', f: [['Access tier', '*Hot: frequently accessed data|Cool: infrequently accessed data|Cold: rarely accessed data', 'r']] }], say: '**Advanced**: secure transfer (HTTPS) on, anonymous access off, and the default **access tier** for blobs.' },
        { tab: 2, groups: [{ h: 'Network connectivity', f: [['Public network access', '*Enable|Disable', 'r'], ['Public network access scope', 'Enable from all networks|*Enable from selected networks', 'r']] }], say: '**Networking**: limit which networks can reach the account. Later you can add a **private endpoint**.', t: 'btn:Review + create' },
        { tab: 6, groups: review([['Storage account name', 'stlearn2026'], ['Performance', 'Standard'], ['Replication', 'Geo-redundant storage (GRS)'], ['Access tier', 'Hot']]), say: 'Select **Create**.' },
      ]),
      { sc: st('Overview'), t: 'menu:Containers', say: 'One account, several services under **Data storage**: **Containers** (blobs), **File shares**, **Queues** and **Tables**.' },
    ],
  },

  'storage-redundancy': {
    title: 'Change storage redundancy and see the paired region',
    steps: [
      { sc: st('Overview'), t: 'menu:Redundancy', say: 'In the storage account, under **Data management**, open **Redundancy**.' },
      { sc: st('Redundancy', [{ b: 'form', groups: [{ f: [['Redundancy', 'Geo-redundant storage (GRS)', 's', 'LRS · ZRS · **GRS** · GZRS · RA-GRS · RA-GZRS'], ['Primary location', 'West Europe · Available', 'i'], ['Secondary location', 'North Europe · Available', 'i'], ['Last sync time', '12/11/2026, 10:41:07', 'i']] }], save: 'Save' }], ['Save', 'Discard', 'Prepare for failover']), t: 'f:Redundancy', say: 'With **GRS** your data lives in **West Europe** and is copied to its **paired region, North Europe**. You never pick the secondary: Azure uses the region pair.' },
      { sc: st('Redundancy', [{ b: 'table', title: 'Options', cols: ['Copies', 'Survives', 'Secondary readable'], rows: [['LRS', '3 in one datacenter', 'Disk or server failure', 'No'], ['ZRS', '3 across zones', 'A whole zone failing', 'No'], ['GRS', '3 local + 3 in paired region', 'A region outage (after failover)', 'No'], ['RA-GRS', 'same as GRS', 'A region outage', '**Yes**'], ['GZRS', '3 zones + 3 in paired region', 'Zone and region outages', 'No'], ['RA-GZRS', 'same as GZRS', 'Zone and region outages', '**Yes**']] }], ['Save', 'Discard']), t: 'row:RA-GZRS', say: 'More copies in more places = more protection = higher price. Pick **RA-GZRS** for the most resilient option, and **Save**.' },
      { sc: st('Redundancy', [{ b: 'note', tone: 'warn', text: '⚠️ **Prepare for failover**: If the primary region becomes unavailable you can fail over so the secondary becomes the new primary. Data written after the **last sync time** may be lost.' }], ['Prepare for failover']), say: 'In a regional disaster you (or Microsoft) can **fail over** to the secondary region. Geo-replication is **asynchronous**, so check the last sync time.' },
    ],
  },

  'blob-tiers': {
    title: 'Upload blobs and move them between access tiers',
    steps: [
      { sc: st('Overview'), t: 'menu:Containers', say: 'Blobs live in **containers**. Open **Containers**.' },
      { sc: st('Containers', [{ b: 'table', cmds: ['+ Container', 'Change access level', 'Restore containers', 'Refresh', 'Delete'], cols: ['Last modified', 'Anonymous access level'], rows: [['$logs', '11/12/2026', 'Private']] }]), t: 'cmd:+ Container', pane: undefined, say: 'Select **+ Container**.' },
      { sc: st('Containers'), pane: { title: 'New container', groups: [{ f: [['Name *', 'invoices', 't'], ['Anonymous access level', 'Private (no anonymous access)']] }], btns: ['Create', 'Cancel'] }, t: 'btn:Create', say: 'Name it **invoices**. Keep it **Private**.' },
      { sc: st('Containers', [{ b: 'table', cmds: ['Upload', 'Change tier', 'Refresh', 'Delete'], cols: ['Modified', 'Access tier', 'Size'], rows: [] }]), pane: { title: 'Upload blob', groups: [{ f: [['Files', '📄 invoice-2026-11.pdf  📄 invoice-2025-01.pdf', 'i'], ['Overwrite if files already exist', '', 'c']] }, { h: 'Advanced', f: [['Blob type', 'Block blob'], ['Access tier', 'Hot (Inferred)', 's', 'Hot · Cool · Cold · Archive']] }], btns: ['Upload', 'Cancel'] }, t: 'btn:Upload', say: '**Upload** files. Each blob gets an **access tier**: **Hot** for frequent use, **Cool** (30+ days), **Cold** (90+ days), **Archive** (180+ days, offline).' },
      { sc: st('Containers', [{ b: 'table', cmds: ['Upload', 'Change tier', 'Refresh', 'Delete'], cols: ['Modified', 'Access tier', 'Size'], rows: [['invoice-2026-11.pdf', 'Today', 'Hot (Inferred)', '182 KiB'], ['invoice-2025-01.pdf', 'Today', 'Hot (Inferred)', '175 KiB']] }]), pane: { title: 'Change tier', groups: [{ f: [['Access tier', 'Archive', 's', 'Archived blobs are **offline**. Reading them needs **rehydration**, which can take up to 15 hours.']] }], btns: ['Save', 'Cancel'] }, t: 'btn:Save', say: 'The 2025 invoice is rarely read. **Change tier** → **Archive**: storage becomes very cheap, but reading it back is slow and costs more.' },
      { sc: st('Lifecycle management', [{ b: 'table', cmds: ['+ Add a rule', 'Delete', 'Refresh'], cols: ['Status', 'Actions'], rows: [['age-out-invoices', 'Enabled', 'Cool after 30 days · Archive after 180 days · Delete after 2,555 days']] }]), say: 'Do it automatically with **Lifecycle management** rules: data slides to cheaper tiers as it ages. Right tier, right price.' },
    ],
  },

  'storage-services': {
    title: 'File shares, queues, tables and disks',
    steps: [
      { sc: st('Overview'), t: 'menu:File shares', say: 'Open **File shares**.' },
      { sc: st('File shares'), pane: { title: 'New file share', groups: [{ f: [['Name *', 'team-docs', 't'], ['Access tier', 'Transaction optimized|*Hot|Cool', 'r']] }, { h: 'Backup', f: [['Enable backup', '*Enabled', 'c']] }], btns: ['Review + create', 'Cancel'] }, t: 'btn:Review + create', say: '**Azure Files** gives you a fully managed **SMB/NFS file share**, like a network drive in the cloud.' },
      { sc: st('File shares', [{ b: 'code', title: 'Connect · Windows · Drive letter Z', text: '$connectTestResult = Test-NetConnection -ComputerName stlearn2026.file.core.windows.net -Port 445\ncmd.exe /C "cmdkey /add:`"stlearn2026.file.core.windows.net`" /user:`"localhost\\stlearn2026`" /pass:`"••••`""\nNew-PSDrive -Name Z -PSProvider FileSystem -Root "\\\\stlearn2026.file.core.windows.net\\team-docs" -Persist' }]), t: 'menu:Queues', say: '**Connect** gives a ready-made script to map it as drive **Z:** on Windows, macOS or Linux. Next, **Queues**.' },
      { sc: st('Queues', [{ b: 'table', cmds: ['+ Queue', 'Refresh', 'Delete'], cols: ['URL'], rows: [['orders', 'https://stlearn2026.queue.core.windows.net/orders']] }]), t: 'menu:Tables', say: '**Queue Storage** holds messages between parts of an app: the website drops an *order* message, a worker picks it up later.' },
      { sc: st('Tables', [{ b: 'table', cmds: ['+ Table', 'Refresh', 'Delete'], cols: ['URL'], rows: [['devices', 'https://stlearn2026.table.core.windows.net/devices']] }]), say: '**Table Storage** stores simple structured NoSQL data: key-value rows without a fixed schema.' },
      { sc: { s: 'list', title: 'Disks', i: 'disk', cols: ['Storage type', 'Size (GiB)', 'Owner'], rows: [['vm-web-01_OsDisk', 'Premium SSD LRS', '30', 'vm-web-01'], ['data-disk-01', 'Standard SSD LRS', '128', 'vm-web-01'], ['old-disk', 'Standard HDD LRS', '256', '-']] }, say: '**Managed disks** are block storage for VMs. Note **old-disk** with no owner: unattached disks still cost money. Delete what you don’t use.' },
    ],
  },

  'moving-files': {
    title: 'Move files: Storage browser, SAS and AzCopy',
    steps: [
      { sc: st('Overview'), t: 'menu:Storage browser', say: 'For a few files, open **Storage browser** right in the portal.' },
      { sc: st('Storage browser', [{ b: 'table', cmds: ['Upload', 'Download', 'Add directory', 'Copy URL', 'Delete'], cols: ['Last modified', 'Size'], rows: [['images/', '', ''], ['report.xlsx', 'Today', '48 KiB']] }]), t: 'menu:Shared access signature', say: 'Upload and download with clicks. **Azure Storage Explorer** is the same idea as a desktop app. For big jobs use **AzCopy**. It needs a **SAS**: open **Shared access signature**.' },
      { sc: st('Shared access signature', [{ b: 'form', groups: [{ f: [['Allowed services', '*Blob|File|Queue|Table', 'c'], ['Allowed permissions', '*Read|*Write|Delete|*List|Add|*Create', 'c'], ['Start and expiry date/time', 'Today 09:00 → Today 17:00', 'i'], ['Allowed protocols', '*HTTPS only|HTTPS and HTTP', 'r']] }], save: 'Generate SAS and connection string' }]), t: 'btn:Generate SAS and connection string', say: 'A **SAS** is a time-limited token with only the permissions you choose: here read/write/list for **one working day**.' },
      { sc: st('Shared access signature'), shell: ['$ azcopy copy "./photos/*" "https://stlearn2026.blob.core.windows.net/images?sv=2026-...&sig=..." --recursive', 'INFO: Scanning...', 'Job 5c1e… has started', '100.0 %, 18,240 Done, 0 Failed, 0 Pending, Total 18,240, 2-sec Throughput (Mb/s): 912.4', 'Final Job Status: Completed', '$ '], say: '**AzCopy** is a command-line tool that copies thousands of files fast, here from Cloud Shell. For servers that must stay in sync, **Azure File Sync** keeps on-premises file servers synced with Azure Files.' },
    ],
  },

  'migrate-databox': {
    title: 'Plan a migration with Azure Migrate, ship data with Data Box',
    steps: [
      ...find('azure migrate', 'Azure Migrate', 'migrate', 'Search for **Azure Migrate**.', [['Services', 'Azure Data Box', 'databox']]),
      { sc: { s: 'res', title: 'Azure Migrate', type: 'Get started', i: 'migrate', menu: ['Get started', ['Migration goals', ['Servers, databases and web apps', 'Databases (only)', 'Data Box']], ['Manage', ['Discovered items', 'Assessments', 'Replications']]], active: 'Servers, databases and web apps', cmds: ['Create project', 'Refresh'], body: [{ b: 'cards', items: [{ t: '1 · Discover', v: '42 servers', s: 'via the Azure Migrate appliance' }, { t: '2 · Assess', v: '38 ready', s: '4 need changes', c: 'ok' }, { t: '3 · Migrate', v: '0 replicating', s: 'Start with a pilot' }] }] }, t: 'card:2 · Assess', say: 'Azure Migrate is one hub to **discover** your on-premises servers, **assess** them and **migrate**. A lightweight appliance inventories what you have.' },
      { sc: { s: 'res', title: 'Assessment: datacenter-A', type: 'Azure VM assessment', i: 'migrate', menu: ['Overview', 'Azure readiness', 'Cost details'], active: 'Overview', body: [{ b: 'cards', items: [{ t: 'Azure readiness', v: '38 / 42', s: 'Ready for Azure', c: 'ok' }, { t: 'Monthly cost estimate', v: '$6,240', s: 'Compute $5,100 · Storage $1,140' }, { t: 'Recommended sizes', v: 'D4s_v5 ×21', s: 'Based on performance history' }] }] }, say: 'The **assessment** says which servers are ready, the right Azure **size** for each, and the **monthly cost**. A business case before you move anything.' },
      ...wizard('Order Data Box', ['Azure Data Box'], ['Select product', 'Basics', 'Data destination', 'Contact details', 'Review + order'], [
        { tab: 0, groups: [{ f: [['Transfer type', 'Import to Azure', 's'], ['Source country/region', 'Netherlands'], ['Destination Azure region', 'West Europe']] }, { h: 'Choose a product', f: [['Data Box Disk', 'SSD disks shipped to you. For **smaller** offline transfers.', 'i'], ['Data Box', '**Rugged appliance** for **large** offline transfers (tens to hundreds of TB).', 'i']] }], say: 'Too much data for your internet link? Order a **Data Box**: Microsoft ships a rugged, encrypted device, you copy data onto it locally and ship it back. Microsoft uploads it in the datacenter.', t: 'f:Data Box' },
      ]),
    ],
  },

  'sql-database': {
    title: 'Create an Azure SQL Database',
    steps: [
      ...find('sql databases', 'SQL databases', 'sql', 'Search for **SQL databases**.', [['Services', 'Azure Cosmos DB', 'cosmos'], ['Services', 'Azure Database for PostgreSQL flexible servers', 'sql'], ['Services', 'Azure Database for MySQL flexible servers', 'sql']]),
      { sc: { s: 'list', title: 'SQL databases', i: 'sql', cols: ['Server', 'Pricing tier', 'Location'], rows: [] }, t: 'cmd:+ Create', say: 'Azure offers SQL Database, PostgreSQL, MySQL and **Cosmos DB** (NoSQL, global). Select **+ Create**.' },
      ...wizard('Create SQL Database', ['SQL databases'], ['Basics', 'Networking', 'Security', 'Additional settings', 'Tags', 'Review + create'], [
        { tab: 0, groups: [proj(), { h: 'Database details', f: [['Database name *', 'sqldb-shop', 't'], ['Server *', '(new) sql-contoso-shop (West Europe)', 's', 'Create new'], ['Want to use SQL elastic pool?', 'Yes|*No', 'r'], ['Workload environment', 'Development|*Production', 'r'], ['Compute + storage *', 'General Purpose - Serverless · Standard-series (Gen5), 2 vCores, 32 GB storage, zone redundant disabled', 's', 'Configure database'], ['Backup storage redundancy', 'Geo-redundant backup storage']] }], t: 'f:Compute + storage', say: 'A fully managed database: no OS, no patching, built-in backups and high availability. **Serverless** compute pauses when idle.' },
        { tab: 1, groups: [{ h: 'Network connectivity', f: [['Connectivity method', 'No access|Public endpoint|*Private endpoint', 'r']] }, { h: 'Private endpoints', f: [['pe-sqldb-shop', 'vnet-learn / data · privatelink.database.windows.net', 'i']] }], say: '**Networking**: keep the database private with a **private endpoint**.', t: 'btn:Review + create' },
        { tab: 5, groups: review([['Server', 'sql-contoso-shop'], ['Authentication', 'Microsoft Entra-only authentication'], ['Compute', 'General Purpose Serverless, 2 vCores'], ['Estimated cost', 'Per vCore-second used + storage']]), say: 'Select **Create**.' },
      ]),
      { sc: { s: 'res', title: 'sqldb-shop (sql-contoso-shop/sqldb-shop)', type: 'SQL database', i: 'sql', crumbs: ['rg-learn'], menu: ['Overview', 'Activity log', 'Access control (IAM)', 'Query editor (preview)', ['Settings', ['Compute + storage', 'Connection strings', 'Replicas', 'Maintenance']], ['Data management', ['Backups']], ['Security', ['Microsoft Defender for Cloud', 'Auditing']]], active: 'Overview', cmds: ['Copy', 'Restore', 'Export', 'Set server firewall', 'Delete'], ess: [['Status', 'Online'], ['Server name', 'sql-contoso-shop.database.windows.net'], ['Pricing tier', 'General Purpose - Serverless: Gen5, 2 vCores'], ['Earliest restore point', '12/11/2026, 10:31'], ['Location', 'West Europe']] }, say: 'Online, with **point-in-time restore** already running. That is a **PaaS** database: you design tables and queries, Microsoft runs the engine.' },
    ],
  },

  'create-vnet': {
    title: 'Create a virtual network with subnets',
    steps: [
      ...find('virtual networks', 'Virtual networks', 'vnet', 'Search for **virtual networks**.'),
      { sc: { s: 'list', title: 'Virtual networks', i: 'vnet', cols: ['Resource group', 'Location', 'Address space'], rows: [] }, t: 'cmd:+ Create', say: 'Select **+ Create**.' },
      ...wizard('Create virtual network', ['Virtual networks'], ['Basics', 'Security', 'IP addresses', 'Tags', 'Review + create'], [
        { tab: 0, groups: [proj(), { h: 'Instance details', f: [['Virtual network name *', 'vnet-learn', 't'], ['Region *', '(Europe) West Europe']] }], say: 'A VNet lives in **one region** and one subscription.' },
        { tab: 1, groups: [{ f: [['Enable Azure Bastion', '', 'c', 'Secure RDP/SSH from the browser, no public IP on VMs.'], ['Enable Azure Firewall', '', 'c'], ['Enable Azure DDoS Network Protection', '', 'c']] }], say: '**Security** add-ons: Bastion, Firewall and DDoS protection can be switched on here.' },
        { tab: 2, groups: [{ h: 'IPv4 address space', f: [['10.0.0.0/16', '10.0.0.0 – 10.0.255.255 · **65,536 addresses**', 'i']] }, { h: 'Subnets', p: '+ Add a subnet', f: [['web', '10.0.1.0/24 · 256 addresses', 'i'], ['data', '10.0.2.0/24 · 256 addresses', 'i']] }], t: 'f:web', say: '**IP addresses**: the VNet gets a private range, **10.0.0.0/16**, split into **subnets**: *web* and *data*. Azure reserves 5 addresses in every subnet.' },
        { tab: 4, groups: review([['Name', 'vnet-learn'], ['Address space', '10.0.0.0/16'], ['Subnets', 'web (10.0.1.0/24), data (10.0.2.0/24)'], ['Cost', 'Virtual networks are free']]), say: 'Virtual networks themselves are **free**. Select **Create**.' },
      ]),
      { sc: vnet('Subnets', [{ b: 'table', cmds: ['+ Subnet', '+ Gateway subnet', 'Refresh'], cols: ['IPv4', 'Available IPs', 'Security group'], rows: [['web', '10.0.1.0/24', '251', 'nsg-web'], ['data', '10.0.2.0/24', '251', 'nsg-data']] }]), say: 'Resources in the subnets talk privately. Nothing from the internet gets in unless you allow it.' },
    ],
  },

  'vnet-peering': {
    title: 'Peer two virtual networks',
    steps: [
      { sc: vnet('Overview'), t: 'menu:Peerings', say: 'In **vnet-learn**, under **Settings**, open **Peerings**.' },
      { sc: vnet('Peerings', [{ b: 'table', cmds: ['+ Add', 'Refresh', 'Sync'], cols: ['Peering status', 'Remote virtual network'], rows: [] }]), t: 'cmd:+ Add', say: 'Select **+ Add**.' },
      { sc: vnet('Peerings'), pane: { title: 'Add peering', sub: 'vnet-learn', groups: [{ h: 'Remote virtual network summary', f: [['Peering link name *', 'hub-to-learn', 't'], ['Virtual network *', 'vnet-hub (rg-network)'], ['Allow vnet-hub to access vnet-learn', '*', 'c']] }, { h: 'Local virtual network summary', f: [['Peering link name *', 'learn-to-hub', 't'], ['Allow vnet-learn to access vnet-hub', '*', 'c'], ['Allow gateway or route server in vnet-learn to forward traffic', '', 'c']] }], btns: ['Add', 'Cancel'] }, t: 'btn:Add', say: 'One form creates **both directions** of the peering. VNets can even be in different regions (global peering) or subscriptions.' },
      { sc: vnet('Peerings', [{ b: 'table', cmds: ['+ Add', 'Refresh'], cols: ['Peering status', 'Remote virtual network', 'Gateway transit'], rows: [['learn-to-hub', 'Connected', 'vnet-hub', 'Disabled']] }]), say: '**Connected**. VMs now reach each other on **private IPs** over **Microsoft’s backbone**, never the internet. Address ranges must not overlap.' },
    ],
  },

  nsg: {
    title: 'Allow HTTPS and block RDP with an NSG',
    steps: [
      ...find('network security groups', 'Network security groups', 'nsg', 'Search for **network security groups**.'),
      { sc: { s: 'list', title: 'Network security groups', i: 'nsg', cols: ['Resource group', 'Location', 'Associated with'], rows: [['nsg-web', 'rg-learn', 'West Europe', 'Subnet: web']] }, t: 'row:nsg-web', say: 'Open **nsg-web**, attached to the *web* subnet.' },
      { sc: { s: 'res', title: 'nsg-web', type: 'Network security group', i: 'nsg', crumbs: ['rg-learn'], menu: ['Overview', 'Activity log', ['Settings', ['Inbound security rules', 'Outbound security rules', 'Network interfaces', 'Subnets']]], active: 'Inbound security rules', body: [{ b: 'table', cmds: ['+ Add', 'Default rules', 'Refresh'], cols: ['Priority', 'Port', 'Source', 'Action'], rows: [['AllowVnetInBound', '65000', 'Any', 'VirtualNetwork', 'Allow'], ['AllowAzureLoadBalancerInBound', '65001', 'Any', 'AzureLoadBalancer', 'Allow'], ['DenyAllInBound', '65500', 'Any', 'Any', 'Denied']] }] }, t: 'cmd:+ Add', say: 'Every NSG starts with **default rules**: allow traffic inside the VNet and from the load balancer, **deny everything else**. Rules are checked by **priority**: lowest number first.' },
      { sc: { s: 'res', title: 'nsg-web', type: 'Network security group', i: 'nsg', menu: ['Overview', ['Settings', ['Inbound security rules']]], active: 'Inbound security rules', body: [] }, pane: { title: 'Add inbound security rule', sub: 'nsg-web', groups: [{ f: [['Source', 'Any'], ['Source port ranges *', '*', 't'], ['Destination', 'Any'], ['Service', 'HTTPS'], ['Destination port ranges *', '443', 't'], ['Protocol', 'Any|*TCP|UDP|ICMPv4', 'r'], ['Action', '*Allow|Deny', 'r'], ['Priority *', '100', 't'], ['Name *', 'AllowHTTPS', 't']] }], btns: ['Add', 'Cancel'] }, t: 'btn:Add', say: 'Allow **HTTPS (TCP 443)** from anywhere, priority **100**.' },
      { sc: { s: 'res', title: 'nsg-web', type: 'Network security group', i: 'nsg', menu: ['Overview', ['Settings', ['Inbound security rules']]], active: 'Inbound security rules', body: [{ b: 'table', cols: ['Priority', 'Port', 'Source', 'Action'], rows: [['AllowHTTPS', '100', '443', 'Any', 'Allow'], ['DenyRDP', '110', '3389', 'Any', 'Denied'], ['AllowVnetInBound', '65000', 'Any', 'VirtualNetwork', 'Allow'], ['DenyAllInBound', '65500', 'Any', 'Any', 'Denied']] }, { b: 'note', tone: 'info', text: '🔎 A request on port 3389 hits **DenyRDP (110)** first and is dropped. Port 443 matches **AllowHTTPS (100)** and is allowed.' }] }, say: 'Add **DenyRDP** too. The first matching rule wins, so 443 gets in and 3389 is blocked. For admin access use **Azure Bastion** instead of opening RDP.' },
    ],
  },

  'vpn-gateway': {
    title: 'Connect the office with a site-to-site VPN',
    steps: [
      ...find('virtual network gateways', 'Virtual network gateways', 'vpn', 'Search for **virtual network gateways**.', [['Services', 'Local network gateways', 'vpn'], ['Services', 'Connections', 'vpn']]),
      ...wizard('Create virtual network gateway', ['Virtual network gateways'], ['Basics', 'Tags', 'Review + create'], [
        { tab: 0, groups: [{ h: 'Instance details', f: [['Name *', 'vgw-learn', 't'], ['Region *', 'West Europe'], ['Gateway type *', '*VPN|ExpressRoute', 'r'], ['SKU *', 'VpnGw2AZ'], ['Generation', 'Generation2'], ['Virtual network *', 'vnet-learn'], ['Gateway subnet address range *', '10.0.255.0/27', 't', 'Creates the special **GatewaySubnet**.']] }, { h: 'Public IP address', f: [['Public IP address name *', 'pip-vgw-learn', 't'], ['Enable active-active mode', '*Enabled|Disabled', 'r']] }], t: 'f:Gateway type', say: 'A **VPN gateway** sits in its own **GatewaySubnet** and has a public IP. The **AZ** SKUs are zone-redundant. Creating one can take **30+ minutes**.', },
      ]),
      ...wizard('Create local network gateway', ['Local network gateways'], ['Basics', 'Advanced', 'Review + create'], [
        { tab: 0, groups: [{ h: 'Instance details', f: [['Name *', 'lng-office', 't'], ['Endpoint', '*IP address|FQDN', 'r'], ['IP address *', '203.0.113.10', 't', 'Your office VPN device'], ['Address space(s)', '192.168.0.0/16', 't', 'Your office network']] }], say: 'The **local network gateway** describes the **office side**: its VPN device’s public IP and its address range.' },
      ]),
      { sc: { s: 'res', title: 'cn-office', type: 'Connection', i: 'vpn', menu: ['Overview', ['Settings', ['Authentication type', 'Configuration', 'Shared key']]], active: 'Overview', cmds: ['Download configuration', 'Reset', 'Delete'], ess: [['Status', 'Connected'], ['Connection type', 'Site-to-site (IPsec)'], ['Virtual network gateway', 'vgw-learn'], ['Local network gateway', 'lng-office'], ['Data in / out', '2.1 GB / 640 MB']] }, say: 'The **connection** links the two with a shared key: **Connected**. Office traffic now travels to Azure **encrypted over the public internet**.' },
    ],
  },

  expressroute: {
    title: 'Order an ExpressRoute circuit',
    steps: [
      ...find('expressroute', 'ExpressRoute circuits', 'er', 'Search for **ExpressRoute**.'),
      ...wizard('Create ExpressRoute circuit', ['ExpressRoute circuits'], ['Basics', 'Configuration', 'Tags', 'Review + create'], [
        { tab: 0, groups: [proj(), { h: 'Instance details', f: [['Region *', 'West Europe'], ['Name *', 'er-amsterdam', 't'], ['Resiliency', 'Standard resiliency|*Maximum resiliency', 'r', 'Maximum: two circuits in **two different peering locations**.']] }], say: 'ExpressRoute is a **private connection** to Microsoft through a **connectivity provider**, not over the internet.' },
        { tab: 1, groups: [{ f: [['Port type', '*Provider|Direct', 'r'], ['Provider *', 'Equinix'], ['Peering location *', 'Amsterdam'], ['Bandwidth *', '1 Gbps'], ['SKU', 'Local|*Standard|Premium', 'r', '**Premium** adds global reach to every region.'], ['Billing model', '*Metered|Unlimited', 'r']] }], t: 'f:Bandwidth', say: 'Choose the **provider**, **peering location** and **bandwidth**. Speeds go from 50 Mbps up to 10 Gbps (100 Gbps with ExpressRoute Direct).', },
        { tab: 3, groups: review([['Provider', 'Equinix · Amsterdam'], ['Bandwidth', '1 Gbps'], ['SKU', 'Standard, Metered']]), say: 'Select **Create**.' },
      ]),
      { sc: { s: 'res', title: 'er-amsterdam', type: 'ExpressRoute circuit', i: 'er', menu: ['Overview', ['Settings', ['Configuration', 'Connections', 'Authorizations', 'Peerings']]], active: 'Overview', cmds: ['Delete', 'Refresh'], ess: [['Circuit status', 'Enabled'], ['Provider status', 'Not provisioned'], ['Service key', '6f2e…-41b8'], ['Peering location', 'Amsterdam'], ['Bandwidth', '1 Gbps']] }, say: 'Give the **Service key** to your provider. When their status shows *Provisioned*, set up **private peering** and link your VNet gateway. Private, predictable, and it never touches the internet.' },
    ],
  },

  'private-endpoint': {
    title: 'Lock a storage account behind a private endpoint',
    steps: [
      { sc: st('Overview'), t: 'menu:Networking', say: 'By default the storage account has a **public endpoint**: stlearn2026.blob.core.windows.net is reachable from the internet. Open **Networking**.' },
      { sc: st('Networking', [{ b: 'form', groups: [{ h: 'Public network access', f: [['Public network access', 'Enabled from all networks|Enabled from selected virtual networks and IP addresses|*Disabled', 'r']] }], save: 'Save' }], ['Firewalls and virtual networks', 'Private endpoints', 'Microsoft network routing']), t: 'cmd:Private endpoints', say: 'Turn public access **Disabled**. Then open **Private endpoints**.' },
      ...wizard('Create a private endpoint', ['stlearn2026', 'Networking'], ['Basics', 'Resource', 'Virtual Network', 'DNS', 'Tags', 'Review + create'], [
        { tab: 1, groups: [{ f: [['Connection method', '*Connect to an Azure resource in my directory', 'r'], ['Resource type', 'Microsoft.Storage/storageAccounts'], ['Resource', 'stlearn2026'], ['Target sub-resource *', 'blob']] }], say: 'Choose **what** to connect privately: the **blob** service of the account.' },
        { tab: 2, groups: [{ h: 'Networking', f: [['Virtual network *', 'vnet-learn (rg-learn)'], ['Subnet *', 'data (10.0.2.0/24)'], ['Private IP configuration', '*Dynamically allocate IP address|Statically allocate IP address', 'r']] }], say: 'Choose **where**: a subnet in your VNet. The endpoint gets a **private IP** from it.' },
        { tab: 3, groups: [{ h: 'Private DNS integration', f: [['Integrate with private DNS zone', 'No|*Yes', 'r'], ['Private DNS zone', '(new) privatelink.blob.core.windows.net', 'i']] }], say: '**DNS**: the same name now resolves to the private IP inside your VNet.', t: 'btn:Review + create' },
      ]),
      { sc: st('Networking', [{ b: 'table', title: 'Private endpoint connections', cols: ['Connection state', 'Private IP', 'Description'], rows: [['pe-stlearn-blob', 'Approved', '10.0.2.5', 'Auto-approved']] }]), say: 'Done: **10.0.2.5** inside your VNet. VMs reach storage privately, and the internet can’t reach it at all.' },
    ],
  },

  'azure-dns': {
    title: 'Host a domain in Azure DNS',
    steps: [
      ...find('dns zones', 'DNS zones', 'dns', 'Search for **DNS zones**.', [['Services', 'Private DNS zones', 'dns']]),
      ...wizard('Create DNS zone', ['DNS zones'], ['Basics', 'Tags', 'Review + create'], [
        { tab: 0, groups: [proj(), { h: 'Instance details', f: [['This zone is a child of an existing zone already hosted in Azure DNS', '', 'c'], ['Name *', 'contoso.com', 't']] }], say: 'A **DNS zone** holds the records for one domain. Azure DNS hosts it on Microsoft’s global name servers.', t: 'btn:Review + create' },
      ]),
      { sc: { s: 'res', title: 'contoso.com', type: 'DNS zone', i: 'dns', menu: ['Overview', 'Activity log', 'Access control (IAM)', ['DNS Management', ['Recordsets', 'DNSSEC']]], active: 'Recordsets', cmds: ['+ Add', 'Delete zone', 'Refresh'], body: [{ b: 'note', tone: 'info', text: 'Name servers: **ns1-04.azure-dns.com** · ns2-04.azure-dns.net · ns3-04.azure-dns.org · ns4-04.azure-dns.info  — set these at your domain registrar.' }, { b: 'table', cols: ['Type', 'TTL', 'Value'], rows: [['@', 'NS', '172800', 'ns1-04.azure-dns.com. …'], ['@', 'SOA', '3600', 'Email: azuredns-hostmaster.microsoft.com']] }] }, t: 'cmd:+ Add', say: 'Azure gives you four **name servers**. Point your registrar at them. Note: Azure DNS **hosts** zones; you buy the domain from a registrar.' },
      { sc: { s: 'res', title: 'contoso.com', type: 'DNS zone', i: 'dns', menu: ['Overview', ['DNS Management', ['Recordsets']]], active: 'Recordsets', body: [] }, pane: { title: 'Add record set', groups: [{ f: [['Name', 'www', 't', '.contoso.com'], ['Type', 'A – Address record'], ['Alias record set', '*No|Yes', 'r'], ['TTL', '1 Hours'], ['IP address', '20.50.1.4', 't']] }], btns: ['Add', 'Cancel'] }, t: 'btn:Add', say: 'Add an **A record**: **www.contoso.com → 20.50.1.4**. Use a **CNAME** to point one name at another name.' },
      { sc: { s: 'res', title: 'contoso.com', type: 'DNS zone', i: 'dns', menu: ['Overview', ['DNS Management', ['Recordsets']]], active: 'Recordsets', body: [{ b: 'table', cols: ['Type', 'TTL', 'Value'], rows: [['@', 'NS', '172800', 'ns1-04.azure-dns.com. …'], ['www', 'A', '3600', '20.50.1.4'], ['shop', 'CNAME', '3600', 'contoso-shop.azurewebsites.net']] }] }, say: 'Browsers asking for www.contoso.com now get **20.50.1.4**. **Private DNS zones** do the same for names inside your VNets.' },
    ],
  },

  'load-balancing': {
    title: 'Pick and create a load balancer',
    steps: [
      { sc: HOME, t: 'search', say: 'Azure has several ways to share traffic. Search **load balancing**.' },
      { sc: { s: 'search', q: 'load balancing', results: [{ g: 'Services', n: 'Load balancers', i: 'lb' }, { g: 'Services', n: 'Application gateways', i: 'agw' }, { g: 'Services', n: 'Front Door and CDN profiles', i: 'fd' }, { g: 'Services', n: 'Traffic Manager profiles', i: 'dns' }] }, t: 'res:Load balancers', say: '**Load Balancer**: layer 4 (TCP/UDP) in a region. **Application Gateway**: layer 7 web traffic with a WAF. **Front Door**: global layer 7 at the edge. **Traffic Manager**: DNS-based global routing. Open **Load balancers**.' },
      ...wizard('Create load balancer', ['Load balancers'], ['Basics', 'Frontend IP configuration', 'Backend pools', 'Inbound rules', 'Outbound rules', 'Tags', 'Review + create'], [
        { tab: 0, groups: [proj(), { h: 'Instance details', f: [['Name *', 'lb-web', 't'], ['Region *', 'West Europe'], ['SKU *', '*Standard|Gateway', 'r'], ['Type *', '*Public|Internal', 'r'], ['Tier *', '*Regional|Global', 'r']] }], say: 'A **public, Standard, regional** load balancer. Standard is **zone-redundant** by default.' },
        { tab: 2, groups: [{ h: 'Backend pools', f: [['pool-web', 'vm-web-1 (Zone 1) · vm-web-2 (Zone 2) · vm-web-3 (Zone 3)', 'i']] }], say: 'The **backend pool**: the VMs that share the work, one per zone.' },
        { tab: 3, groups: [{ h: 'Load balancing rule', f: [['Frontend IP address', 'fe-web (20.50.1.10)'], ['Backend pool', 'pool-web'], ['Protocol', '*TCP|UDP', 'r'], ['Port / Backend port', '443 / 443', 'i'], ['Health probe', 'probe-https (HTTPS:443 /health, every 5 s)']] }], say: 'A **rule** sends port 443 to the pool. The **health probe** checks each VM; unhealthy VMs stop getting traffic.', t: 'btn:Review + create' },
      ]),
      { sc: { s: 'res', title: 'lb-web', type: 'Load balancer', i: 'lb', menu: ['Overview', ['Settings', ['Frontend IP configuration', 'Backend pools', 'Health probes', 'Load balancing rules']], ['Monitoring', ['Insights', 'Metrics']]], active: 'Backend pools', body: [{ b: 'table', cols: ['IP address', 'Availability zone', 'Health'], rows: [['vm-web-1', '10.0.1.4', '1', 'Healthy'], ['vm-web-2', '10.0.1.5', '2', 'Unhealthy'], ['vm-web-3', '10.0.1.6', '3', 'Healthy']] }] }, say: 'vm-web-2 failed its probe, so traffic flows only to the two **healthy** VMs. Users never notice.' },
    ],
  },

  'virtual-wan': {
    title: 'Build a Virtual WAN hub',
    steps: [
      ...find('virtual wan', 'Virtual WANs', 'wan', 'Search for **Virtual WANs**.'),
      ...wizard('Create WAN', ['Virtual WANs'], ['Basics', 'Review + create'], [
        { tab: 0, groups: [proj(), { f: [['Region *', 'West Europe'], ['Name *', 'vwan-contoso', 't'], ['Type', 'Basic|*Standard', 'r', 'Standard adds ExpressRoute, VNet-to-VNet transit, Azure Firewall.']] }], say: '**Virtual WAN** is a Microsoft-managed **hub-and-spoke** network service that joins branches, VNets and users in one place.', t: 'btn:Review + create' },
      ]),
      { sc: { s: 'res', title: 'vwan-contoso', type: 'Virtual WAN', i: 'wan', menu: ['Overview', ['Connectivity', ['Hubs', 'VPN sites', 'User VPN configurations', 'ExpressRoute circuits', 'Virtual network connections']]], active: 'Hubs', body: [{ b: 'table', cmds: ['+ New Hub', 'Refresh'], cols: ['Region', 'Address space', 'Gateways'], rows: [['hub-weu', 'West Europe', '10.100.0.0/23', 'S2S VPN · ExpressRoute'], ['hub-eus', 'East US', '10.101.0.0/23', 'S2S VPN']] }] }, t: 'menu:Virtual network connections', say: 'Each region gets a **hub**, with VPN and ExpressRoute gateways inside it.' },
      { sc: { s: 'res', title: 'vwan-contoso', type: 'Virtual WAN', i: 'wan', menu: ['Overview', ['Connectivity', ['Hubs', 'VPN sites', 'Virtual network connections']]], active: 'Virtual network connections', body: [{ b: 'table', cols: ['Hub', 'Virtual network', 'Status'], rows: [['conn-shop', 'hub-weu', 'vnet-shop', 'Succeeded'], ['conn-hr', 'hub-weu', 'vnet-hr', 'Succeeded'], ['conn-us-app', 'hub-eus', 'vnet-us-app', 'Succeeded']] }, { b: 'table', title: 'VPN sites', cols: ['Location', 'Link speed', 'Status'], rows: [['Branch-Paris', 'France', '200 Mbps', 'Connected'], ['Branch-Berlin', 'Germany', '100 Mbps', 'Connected']] }] }, say: 'Branches and VNets connect **once** to a hub and can reach each other, across regions, over Microsoft’s network.' },
    ],
  },

  'entra-users': {
    title: 'Create a user in Microsoft Entra ID',
    steps: [
      { sc: HOME, t: 'svc:Microsoft Entra ID', say: 'Open **Microsoft Entra ID**, the cloud identity service behind every Azure and Microsoft 365 sign-in.' },
      { sc: entra('Overview'), t: 'menu:Users', say: 'The **tenant** overview: its name, primary domain and license edition. Open **Users**.' },
      { sc: entra('Users', [{ b: 'table', cmds: ['+ New user', 'Download users', 'Bulk operations', 'Refresh', 'Manage view', 'Delete'], cols: ['User principal name', 'User type', 'On-premises sync'], rows: [['Ana Silva', 'ana@contoso.com', 'Member', 'Yes'], ['Ben Okafor', 'ben@contoso.com', 'Member', 'No'], ['Priya (Fabrikam)', 'priya_fabrikam.com#EXT#@contoso.onmicrosoft.com', 'Guest', 'No']] }]), t: 'cmd:+ New user', say: 'Users can be created in the cloud or **synced** from on-premises Active Directory with Entra Connect. Select **+ New user** → *Create new user*.' },
      ...wizard('Create new user', ['Contoso', 'Users'], ['Basics', 'Properties', 'Assignments', 'Review + create'], [
        { tab: 0, groups: [{ h: 'Identity', f: [['User principal name *', 'chen @ contoso.com', 't'], ['Mail nickname', 'chen', 't'], ['Display name *', 'Chen Wei', 't'], ['Password', '•••••••••••• (auto-generated)', 'i'], ['Account enabled', '*', 'c']] }], say: 'The **user principal name** is the sign-in name. A temporary password is generated and must be changed at first sign-in.' },
        { tab: 2, groups: [{ f: [['Groups', 'Finance team', 'i'], ['Roles', 'User (no admin role)', 'i']] }], say: '**Assignments**: add to groups (which grant app and Azure access) and, only if needed, an admin **role**.', t: 'btn:Review + create' },
        { tab: 3, groups: review([['User principal name', 'chen@contoso.com'], ['Display name', 'Chen Wei'], ['Groups', 'Finance team']]), say: 'Select **Create**. Chen can now sign in once and reach every app the groups allow: **single sign-on**.' },
      ]),
    ],
  },

  'auth-methods': {
    title: 'Turn on MFA and passwordless sign-in',
    steps: [
      { sc: entra('Overview'), t: 'menu:Authentication methods', say: 'In **Microsoft Entra ID**, under Security, open **Authentication methods**.' },
      { sc: entra('Authentication methods', [{ b: 'table', title: 'Policies', cols: ['Target', 'Enabled'], rows: [['Passkey (FIDO2)', 'All users', 'Enabled'], ['Microsoft Authenticator', 'All users', 'Enabled'], ['SMS', '-', 'Disabled'], ['Temporary Access Pass', 'IT admins', 'Enabled'], ['Hardware OATH tokens', '-', 'Disabled'], ['Email OTP', 'Guests', 'Enabled']] }]), t: 'row:Microsoft Authenticator', say: 'Here you choose which **methods** people may use: something they **have** (phone, security key), **are** (fingerprint, face) or **know** (PIN).' },
      { sc: entra('Authentication methods', [{ b: 'form', title: 'Microsoft Authenticator settings', groups: [{ f: [['Enable', 'On', 'tg'], ['Include', 'All users', 'i'], ['Authentication mode', 'Any|*Passwordless|Push', 'r'], ['Show application name in push notifications', '*Enabled', 'c'], ['Require number matching', '*Enabled (always on)', 'c']] }], save: 'Save' }]), t: 'btn:Save', say: 'With **number matching**, the user types the number shown on screen into the app, which stops "MFA fatigue" attacks. **Passwordless** removes the password altogether.' },
      { sc: { s: 'res', title: 'Chen Wei', type: 'User', i: 'users', menu: ['Overview', 'Authentication methods', 'Sign-in logs', 'Groups'], active: 'Authentication methods', body: [{ b: 'table', title: 'Usable authentication methods', cols: ['Detail'], rows: [['Microsoft Authenticator', 'iPhone 16 · passwordless'], ['Passkey (FIDO2)', 'YubiKey 5C'], ['Windows Hello for Business', 'LAPTOP-CHEN']] }] }, say: 'Chen has registered **three** strong methods. A stolen password alone is now useless: that is **multifactor authentication**.' },
    ],
  },

  'external-identities': {
    title: 'Invite a partner as a guest (B2B)',
    steps: [
      { sc: entra('Users', [{ b: 'table', cmds: ['+ New user', 'Refresh'], cols: ['User principal name', 'User type'], rows: [['Ana Silva', 'ana@contoso.com', 'Member']] }]), t: 'cmd:+ New user', say: 'In **Users**, open **+ New user** → **Invite external user**.' },
      ...wizard('Invite external user', ['Contoso', 'Users'], ['Basics', 'Properties', 'Assignments', 'Review + invite'], [
        { tab: 0, groups: [{ h: 'Identity', f: [['Email *', 'priya@fabrikam.com', 't'], ['Display name', 'Priya (Fabrikam)', 't']] }, { h: 'Invitation message', f: [['Send invite message', '*', 'c'], ['Message', 'Welcome to the Contoso project site!', 't']] }], say: 'Priya works for a **partner**. She keeps her **own** Fabrikam account and password; you don’t create a new one.' },
        { tab: 3, groups: review([['Email', 'priya@fabrikam.com'], ['User type', 'Guest'], ['Groups', 'Project Phoenix']]), say: 'Select **Invite**.', t: 'btn:Create' },
      ]),
      { sc: entra('Users', [{ b: 'table', cols: ['User principal name', 'User type', 'Invitation state'], rows: [['Ana Silva', 'ana@contoso.com', 'Member', '-'], ['Priya (Fabrikam)', 'priya_fabrikam.com#EXT#@contoso.onmicrosoft.com', 'Guest', 'Accepted']] }]), say: 'Priya appears as a **Guest**. You control what she can reach; her company controls her account. That is **B2B collaboration**. For customer sign-up apps, use **External ID** tenants.' },
      { sc: entra('External Identities', [{ b: 'form', title: 'Cross-tenant access settings · Default settings', groups: [{ f: [['B2B collaboration inbound', 'Allowed for all external users', 'i'], ['Trust settings', 'Trust multifactor authentication from Microsoft Entra tenants', 'c'], ['Organizational settings', 'Fabrikam: **Allow** · Litware: **Block**', 'i']] }] }]), say: '**Cross-tenant access settings** decide which organisations may collaborate with you, and whether you trust their MFA.' },
    ],
  },

  'conditional-access': {
    title: 'Create a Conditional Access policy',
    steps: [
      { sc: entra('Overview'), t: 'menu:Conditional Access', say: 'Open **Conditional Access** under Security.' },
      { sc: entra('Conditional Access', [{ b: 'table', cmds: ['+ Create new policy', '+ Create new policy from templates', 'What If', 'Refresh'], cols: ['State', 'Created'], rows: [['Block legacy authentication', 'On', '01/03/2026']] }]), t: 'cmd:+ Create new policy', say: 'Each policy is an **if-then** statement: **if** these signals, **then** this decision. Select **+ Create new policy**.' },
      { sc: entra('Conditional Access', [{ b: 'form', title: 'New · Conditional Access policy', groups: [{ f: [['Name *', 'Require MFA outside the office', 't'], ['Users', '**All users** · Excluded: 2 break-glass accounts', 'i'], ['Target resources', '**All resources** (formerly "All cloud apps")', 'i'], ['Network', 'Any network or location · **Exclude: Contoso offices**', 'i'], ['Conditions', 'Device platforms: any · Sign-in risk: Medium and above', 'i']] }] }]), t: 'f:Conditions', say: 'The **signals**: *who* (all users, except emergency accounts), *what* (all apps), *where* (outside the offices) and *risk* (unusual sign-ins).' },
      { sc: entra('Conditional Access'), pane: { title: 'Grant', groups: [{ f: [['', 'Block access|*Grant access', 'r'], ['Controls', '*Require multifactor authentication|Require authentication strength|*Require device to be marked as compliant|Require Microsoft Entra hybrid joined device', 'c'], ['For multiple controls', 'Require all the selected controls|*Require one of the selected controls', 'r']] }], btns: ['Select'] }, t: 'btn:Select', say: 'The **decision**: grant access **only if** the user passes **MFA** or uses a **compliant device**. Other options: block, or allow freely.' },
      { sc: entra('Conditional Access', [{ b: 'form', groups: [{ f: [['Enable policy', '*Report-only|On|Off', 'r', 'Start in **Report-only** to see the impact before enforcing.']] }], save: 'Create' }]), t: 'btn:Create', say: 'Start in **Report-only**, check the sign-in logs, then switch it **On**. Conditional Access is the policy engine of **Zero Trust**: verify explicitly, every time.' },
    ],
  },

  rbac: {
    title: 'Give someone access with Azure RBAC',
    steps: [
      { sc: rg('Overview'), t: 'menu:Access control (IAM)', say: 'Ben needs to manage VMs in **rg-learn**, nothing else. Open **Access control (IAM)**.' },
      { sc: rg('Access control (IAM)', [{ b: 'table', title: 'Role assignments', cmds: ['+ Add', 'Download role assignments', 'Edit columns', 'Refresh', 'Delete'], cols: ['Type', 'Role', 'Scope'], rows: [['Ana Silva', 'User', 'Owner', 'Subscription (Inherited)'], ['Finance team', 'Group', 'Reader', 'This resource']] }]), t: 'cmd:+ Add', say: 'Role assignments **inherited** from above are listed too. Select **+ Add** → *Add role assignment*.' },
      ...wizard('Add role assignment', ['rg-learn', 'Access control (IAM)'], ['Role', 'Members', 'Conditions', 'Review + assign'], [
        { tab: 0, groups: [{ p: 'A role definition is a collection of permissions. **Job function roles** · Privileged administrator roles', f: [['Reader', 'View all resources, but make no changes.', 'i'], ['Virtual Machine Contributor', '**Selected** · Create and manage VMs, but not access to them, nor the network or storage they connect to.', 'i'], ['Contributor', 'Manage everything, but cannot grant access.', 'i'], ['Owner', 'Full access, including assigning roles to others.', 'i']] }], t: 'f:Virtual Machine Contributor', say: 'Pick the **least privilege** role that does the job: **Virtual Machine Contributor**, not Owner.' },
        { tab: 1, groups: [{ f: [['Assign access to', '*User, group, or service principal|Managed identity', 'r'], ['Members', 'Ben Okafor (ben@contoso.com)', 'i', '+ Select members']] }], say: '**Members**: who gets it. Ben, or better, a group Ben is in.' },
        { tab: 3, groups: review([['Role', 'Virtual Machine Contributor'], ['Scope', '/subscriptions/…/resourceGroups/rg-learn'], ['Members', 'Ben Okafor'], ['Assignment type', 'Active, permanent']]), say: '**Who** (Ben) + **what** (VM Contributor) + **where** (rg-learn) = a role assignment. Select **Review + assign**.', t: 'btn:Create' },
      ]),
      { sc: rg('Access control (IAM)', [{ b: 'table', title: 'Role assignments', cols: ['Type', 'Role', 'Scope'], rows: [['Ana Silva', 'User', 'Owner', 'Subscription (Inherited)'], ['Ben Okafor', 'User', 'Virtual Machine Contributor', 'This resource'], ['Finance team', 'Group', 'Reader', 'This resource']] }]), say: 'Ben can manage VMs in rg-learn and **nothing anywhere else**. Assignments made at a higher scope flow down to everything below.' },
    ],
  },

  defender: {
    title: 'Check your security posture in Defender for Cloud',
    steps: [
      { sc: HOME, t: 'nav:Microsoft Defender for Cloud', say: 'Open **Microsoft Defender for Cloud** from Tools.' },
      { sc: { s: 'res', title: 'Microsoft Defender for Cloud', type: 'Overview', i: 'defender', menu: ['Overview', 'Getting started', 'Recommendations', 'Attack path analysis', 'Security alerts', 'Inventory', ['Cloud Security', ['Security posture', 'Regulatory compliance', 'Workload protections']], ['Management', ['Environment settings']]], active: 'Overview', body: [{ b: 'cards', items: [{ t: 'Secure score', v: '62%', s: '41 of 66 points', c: 'warn' }, { t: 'Active recommendations', v: '23', s: '6 high severity', c: 'bad' }, { t: 'Security alerts', v: '2', s: '1 high', c: 'bad' }, { t: 'Regulatory compliance', v: 'MCSB 71%', s: 'Microsoft cloud security benchmark' }] }] }, t: 'menu:Recommendations', say: 'The **secure score** sums up your posture. Raise it by fixing **recommendations**. Open them.' },
      { sc: { s: 'res', title: 'Microsoft Defender for Cloud', type: 'Recommendations', i: 'defender', menu: ['Overview', 'Recommendations', 'Security alerts', ['Management', ['Environment settings']]], active: 'Recommendations', body: [{ b: 'table', cmds: ['Download CSV report', 'Open query', 'Governance'], cols: ['Risk level', 'Affected resources', 'Status'], rows: [['Accounts with owner permissions should have MFA enabled', 'High', '1 subscription', 'Unassigned'], ['Management ports should be closed on your VMs', 'High', '2 VMs', 'Unassigned'], ['Storage accounts should restrict network access', 'Medium', '1 storage account', 'Assigned'], ['Machines should have vulnerability findings resolved', 'Medium', '3 VMs', 'Unassigned']] }] }, t: 'row:Management ports should be closed on your VMs', say: 'Each recommendation says **what** is wrong, **where**, and the **risk**. Open the management ports one.' },
      { sc: { s: 'res', title: 'Management ports should be closed on your VMs', type: 'Recommendation', i: 'defender', menu: ['Overview'], active: 'Overview', cmds: ['Fix', 'Exempt', 'Assign owner', 'View policy definition'], body: [{ b: 'note', tone: 'bad', text: 'Open RDP (3389) or SSH (22) ports expose your VMs to brute-force attacks.' }, { b: 'table', title: 'Affected resources', cols: ['Resource group', 'Open ports'], rows: [['vm-web-01', 'rg-learn', '22'], ['vm-test-02', 'rg-dev', '3389']] }] }, t: 'cmd:Fix', say: 'Select **Fix**: Defender updates the NSG rules for you. Use **just-in-time** access or Bastion for admin logins instead.' },
      { sc: { s: 'res', title: 'Microsoft Defender for Cloud', type: 'Environment settings', i: 'defender', menu: ['Overview', ['Management', ['Environment settings']]], active: 'Environment settings', body: [{ b: 'table', title: 'Defender plans · Azure subscription 1', cols: ['Pricing', 'Status'], rows: [['Foundational CSPM', 'Free', 'On'], ['Defender CSPM', 'Per billable resource', 'Off'], ['Servers', 'Plan 2', 'On'], ['Storage', 'Per storage account', 'On'], ['Databases', 'Selected', 'On'], ['Containers', 'Per vCore', 'Off']] }] }, say: 'Free **posture management** for everyone; paid **Defender plans** add threat protection for servers, storage, databases and containers, in Azure, other clouds and on-premises.' },
    ],
  },

  policy: {
    title: 'Allow resources only in approved regions with Azure Policy',
    steps: [
      ...find('policy', 'Policy', 'policy', 'Search for **Policy**.'),
      { sc: { s: 'res', title: 'Policy', type: 'Definitions', i: 'policy', menu: ['Overview', 'Getting started', 'Compliance', 'Remediation', 'Events', ['Authoring', ['Definitions', 'Assignments', 'Exemptions']]], active: 'Definitions', body: [{ b: 'table', cmds: ['+ Policy definition', '+ Initiative definition', 'Export definitions', 'Refresh'], cols: ['Type', 'Category'], rows: [['Allowed locations', 'Built-in', 'General'], ['Require a tag on resources', 'Built-in', 'Tags'], ['Allowed virtual machine size SKUs', 'Built-in', 'Compute'], ['Microsoft cloud security benchmark', 'Built-in (initiative)', 'Security Center']] }] }, t: 'row:Allowed locations', say: 'Hundreds of **built-in** definitions exist. Open **Allowed locations**.' },
      ...wizard('Assign policy', ['Policy', 'Definitions', 'Allowed locations'], ['Basics', 'Parameters', 'Remediation', 'Non-compliance messages', 'Review + create'], [
        { tab: 0, groups: [{ h: 'Scope', f: [['Scope *', 'Azure subscription 1', 's', 'Management group, subscription or resource group'], ['Exclusions', 'Optionally select resources to exclude', 'i']] }, { h: 'Basics', f: [['Policy definition', 'Allowed locations', 'i'], ['Assignment name *', 'Allowed locations: EU only', 't'], ['Policy enforcement', '*Enabled|Disabled', 'r']] }], t: 'f:Scope', say: 'Assign it at a **scope**. Every resource group and resource below inherits it.' },
        { tab: 1, groups: [{ f: [['Allowed locations *', 'West Europe, North Europe', 's']] }], say: '**Parameters**: only **West Europe** and **North Europe** are allowed, for example for GDPR data residency.' },
        { tab: 4, groups: review([['Scope', 'Azure subscription 1'], ['Effect', 'Deny'], ['Allowed locations', 'westeurope, northeurope']]), say: 'Select **Create**.' },
      ]),
      { sc: { s: 'create', title: 'Create a virtual machine', crumbs: ['Virtual machines'], tabs: VM_TABS, tab: 7, groups: [{ f: [['Region', 'East US', 'i']] }] }, say: 'Now someone tries to create a VM in **East US**…' },
      { sc: { s: 'create', title: 'Create a virtual machine', crumbs: ['Virtual machines'], tabs: VM_TABS, tab: 7, groups: [] }, pane: { title: 'Validation failed', body: [{ b: 'note', tone: 'bad', text: '✖ **RequestDisallowedByPolicy**: Resource \'vm-test\' was disallowed by policy. Policy: **Allowed locations: EU only**.' }] }, say: '**Denied**, before anything is built. Azure Policy enforces rules automatically; **RBAC** decides *who* can act, **Policy** decides *what* is allowed.' },
      { sc: { s: 'res', title: 'Policy', type: 'Compliance', i: 'policy', menu: ['Overview', 'Compliance', 'Remediation'], active: 'Compliance', body: [{ b: 'cards', items: [{ t: 'Overall resource compliance', v: '94%', s: '47 of 50', c: 'ok' }, { t: 'Non-compliant initiatives', v: '1', c: 'warn' }, { t: 'Non-compliant resources', v: '3', s: 'Created before the policy', c: 'bad' }] }] }, say: 'The **Compliance** view also finds **existing** resources that break the rules, and **remediation** tasks can fix many automatically.' },
    ],
  },

  locks: {
    title: 'Protect a resource group with a lock',
    steps: [
      { sc: rg('Overview'), t: 'menu:Locks', say: 'Production must never be deleted by accident. In the resource group, open **Locks**.' },
      { sc: rg('Locks', [{ b: 'table', cmds: ['+ Add', 'Subscription', 'Resource group', 'Refresh'], cols: ['Lock type', 'Scope', 'Notes'], rows: [] }]), t: 'cmd:+ Add', say: 'Select **+ Add**.' },
      { sc: rg('Locks'), pane: { title: 'Add lock', groups: [{ f: [['Lock name *', 'do-not-delete', 't'], ['Lock type', '*Delete|Read-only', 'r', '**Delete**: can read and modify, cannot delete. **Read-only**: can only read.'], ['Notes', 'Production. Ask the platform team.', 't']] }], btns: ['OK', 'Cancel'] }, t: 'btn:OK', say: 'Two lock types: **Delete** (CanNotDelete) and **Read-only**. Pick **Delete**.' },
      { sc: rg('Overview'), pane: { title: 'Delete a resource group', body: [{ b: 'note', tone: 'bad', text: '✖ Failed to delete resource group **rg-learn**: The scope cannot perform delete operation because following scope(s) are locked: **\'/subscriptions/…/resourceGroups/rg-learn\'**. Please remove the lock and try again.' }] }, say: 'Even an **Owner** can’t delete it now. Locks apply to **everyone** and are inherited by every resource inside. To delete, someone must first remove the lock: a deliberate second step.' },
    ],
  },

  tags: {
    title: 'Tag resources and use tags to report costs',
    steps: [
      { sc: vm('Overview'), t: 'menu:Tags', say: 'Who owns this VM? Which department pays for it? Open **Tags**.' },
      { sc: vm('Tags', [{ b: 'form', groups: [{ p: 'Tags are name/value pairs that enable you to categorize resources and view consolidated billing by applying the same tag to multiple resources and resource groups.', f: [['Environment', 'Production', 't'], ['CostCenter', 'CC-1042', 't'], ['Owner', 'ana@contoso.com', 't']] }], save: 'Apply' }]), t: 'btn:Apply', say: 'Add **name : value** pairs: Environment, CostCenter, Owner. Up to 50 per resource. Select **Apply**.' },
      { sc: { s: 'list', title: 'All resources', i: 'all', cols: ['Type', 'Resource group', 'Tags'], rows: [['vm-web-01', 'Virtual machine', 'rg-learn', 'CostCenter : CC-1042'], ['stlearn2026', 'Storage account', 'rg-learn', 'CostCenter : CC-1042'], ['sqldb-shop', 'SQL database', 'rg-shop', 'CostCenter : CC-1042']], cmds: ['+ Create', 'Manage view', 'Assign tags', 'Refresh'] }, say: 'Filter **All resources** by tag to find everything for a cost centre, across resource groups and subscriptions.' },
      { sc: { s: 'res', title: 'Cost analysis', type: 'Cost Management', i: 'cost', menu: ['Cost analysis', 'Budgets'], active: 'Cost analysis', body: [{ b: 'table', title: 'Group by: Tag · CostCenter', cols: ['Cost (this month)'], rows: [['CC-1042 (Shop)', '$1,240.18'], ['CC-2001 (HR)', '$312.40'], ['untagged', '$88.02']] }] }, say: 'In **Cost analysis**, group by the **CostCenter** tag and charge each department. Tags aren’t inherited automatically: use **Azure Policy** to require or inherit them.' },
    ],
  },

  'arm-templates': {
    title: 'See ARM at work: deployments and templates',
    steps: [
      { sc: rg('Overview'), t: 'menu:Deployments', say: 'Every create, from portal, CLI, PowerShell or SDK, is a request to **Azure Resource Manager (ARM)**. Open **Deployments** to see its history.' },
      { sc: rg('Deployments', [{ b: 'table', cmds: ['Refresh', 'Cancel', 'Redeploy', 'Delete'], cols: ['Status', 'Last modified', 'Duration'], rows: [['CreateVm-ubuntu-20261112', 'Succeeded', '12/11/2026 10:26', '1 minute 48 seconds'], ['Microsoft.StorageAccount-2026', 'Succeeded', '12/11/2026 09:51', '22 seconds']] }]), t: 'row:CreateVm-ubuntu-20261112', say: 'The VM you clicked together earlier was a **deployment**. Open it.' },
      { sc: { s: 'res', title: 'CreateVm-ubuntu-20261112', type: 'Deployment', i: 'deploy', menu: ['Overview', 'Inputs', 'Outputs', 'Template'], active: 'Template', cmds: ['Download', 'Add to library', 'Deploy'], body: [{ b: 'code', title: 'Template (JSON)', text: '{\n  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",\n  "parameters": { "virtualMachineName": { "type": "string" } },\n  "resources": [\n    {\n      "type": "Microsoft.Compute/virtualMachines",\n      "apiVersion": "2024-07-01",\n      "name": "[parameters(\'virtualMachineName\')]",\n      "location": "westeurope",\n      "properties": { "hardwareProfile": { "vmSize": "Standard_B2s" } }\n    }\n  ]\n}' }] }, say: 'Behind the portal form was an **ARM template**: a **declarative** JSON file describing *what* you want, not *how* to build it.' },
      { sc: rg('Overview', [{ b: 'code', title: 'Export template · Bicep', text: 'param location string = resourceGroup().location\n\nresource st \'Microsoft.Storage/storageAccounts@2024-01-01\' = {\n  name: \'stlearn2026\'\n  location: location\n  sku: { name: \'Standard_GRS\' }\n  kind: \'StorageV2\'\n}' }], ['Download', 'Deploy', 'Copy']), say: '**Export template** turns existing resources into **Bicep** or JSON. Bicep is the friendlier language that compiles to ARM templates.' },
      { sc: HOME, shell: ['$ az deployment group create --resource-group rg-test --template-file main.bicep', '{', '  "name": "main",', '  "properties": {', '    "provisioningState": "Succeeded",', '    "outputResources": [ { "id": ".../storageAccounts/stlearn2026" } ]', '  }', '}', '$ '], say: 'Deploy the same file to **test**, **staging** and **production** and get identical environments, every time. That is **infrastructure as code**, powered by ARM.' },
    ],
  },

  'cloud-shell': {
    title: 'Use Cloud Shell: Azure CLI and PowerShell',
    steps: [
      { sc: HOME, t: 'shell', say: 'Select the **Cloud Shell** icon in the top bar.' },
      { sc: HOME, pane: { title: 'Welcome to Azure Cloud Shell', groups: [{ f: [['Select', '*Bash|PowerShell', 'r'], ['Getting started', '*No storage account required|Mount storage account', 'r', 'Mount storage to keep files between sessions.'], ['Subscription', 'Azure subscription 1']] }], btns: ['Apply', 'Cancel'] }, t: 'btn:Apply', say: 'Pick **Bash** or **PowerShell**. Cloud Shell is a free, browser-based terminal, already signed in, with **Azure CLI**, **Azure PowerShell**, git, Terraform and more installed.' },
      { sc: HOME, shell: ['Requesting a Cloud Shell. Succeeded.', '', '$ az vm list -d -o table', 'Name       ResourceGroup  PowerState      Location', '---------  -------------  --------------  ----------', 'vm-web-01  rg-learn       VM running      westeurope', 'vm-test-02 rg-dev         VM deallocated  westeurope', '$ az vm deallocate -g rg-learn -n vm-web-01', '$ '], say: '**Azure CLI** commands start with `az`: `az vm list`, `az vm deallocate`. Great in Bash scripts.' },
      { sc: HOME, shell: ['PS /home/learner> Get-AzVM -Status | Select Name, PowerState', '', 'Name       PowerState', '----       ----------', 'vm-web-01  VM deallocated', 'vm-test-02 VM deallocated', '', 'PS /home/learner> New-AzResourceGroup -Name rg-scripted -Location westeurope', 'ResourceGroupName : rg-scripted', 'ProvisioningState : Succeeded'], say: '**Azure PowerShell** uses Verb-Noun cmdlets like `Get-AzVM` and `New-AzResourceGroup`. Same Azure, same ARM underneath. Choose the one your team knows.' },
    ],
  },

  arc: {
    title: 'Bring on-premises servers into Azure with Azure Arc',
    steps: [
      ...find('azure arc', 'Azure Arc', 'arc', 'Search for **Azure Arc**.'),
      { sc: { s: 'res', title: 'Azure Arc', type: 'Machines', i: 'arc', menu: ['Overview', ['Azure Arc resources', ['Machines', 'Kubernetes clusters', 'Data services', 'SQL Server instances']], ['Host environments', ['VMware vCenters', 'System Center VMM']]], active: 'Machines', body: [{ b: 'table', cmds: ['+ Add/Create', 'Refresh'], cols: ['Status', 'Operating system', 'Location'], rows: [] }] }, t: 'cmd:+ Add/Create', say: 'Arc lets Azure manage machines that are **not** in Azure: your datacenter, branch offices, even other clouds. Select **+ Add/Create** → *Add a machine*.' },
      ...wizard('Add a server with Azure Arc', ['Azure Arc', 'Machines'], ['Prerequisites', 'Resource details', 'Tags', 'Download and run script'], [
        { tab: 1, groups: [proj('rg-onprem'), { h: 'Server details', f: [['Region *', 'West Europe'], ['Operating system', '*Windows|Linux', 'r'], ['Connectivity method', '*Public endpoint|Proxy server|Private endpoint', 'r']] }], say: 'Choose where the Azure representation lives and the OS. The server itself stays where it is.' },
        { tab: 3, groups: [{ f: [['Script', 'OnboardingScript.ps1 · installs the **Connected Machine agent** and registers the server', 'i']] }], say: '**Download and run** the script on the server. It installs a small agent that connects outbound to Azure.', t: 'btn:Create' },
      ]),
      { sc: { s: 'res', title: 'Azure Arc', type: 'Machines', i: 'arc', menu: ['Overview', ['Azure Arc resources', ['Machines', 'Kubernetes clusters']]], active: 'Machines', body: [{ b: 'table', cols: ['Status', 'Operating system', 'Kind'], rows: [['SRV-FILE01', 'Connected', 'Windows Server 2022', 'On-premises'], ['SRV-SQL02', 'Connected', 'Windows Server 2019', 'On-premises'], ['aws-web-03', 'Connected', 'Ubuntu 22.04', 'AWS EC2']] }, { b: 'note', tone: 'ok', text: '✔ These machines now get **Azure Policy**, **Defender for Cloud**, **Update Manager**, **Monitor**, tags and RBAC, just like Azure VMs.' }] }, say: 'On-premises and AWS servers now appear **as Azure resources**. One control plane, one set of policies, everywhere: the heart of a **hybrid** cloud.' },
    ],
  },

  advisor: {
    title: 'Follow Azure Advisor’s recommendations',
    steps: [
      ...find('advisor', 'Advisor', 'advisor', 'Search for **Advisor**.'),
      { sc: { s: 'res', title: 'Advisor', type: 'Overview', i: 'advisor', menu: ['Overview', 'Advisor score', ['Recommendations', ['Cost', 'Security', 'Reliability', 'Operational excellence', 'Performance']], ['Monitoring', ['Alerts', 'Recommendation digests']]], active: 'Overview', body: [{ b: 'cards', items: [{ t: 'Advisor score', v: '76%', c: 'warn' }, { t: 'Cost', v: '4 recommendations', s: 'Potential yearly savings **$4,212**', c: 'ok' }, { t: 'Security', v: '6', s: 'From Defender for Cloud', c: 'bad' }, { t: 'Reliability', v: '3', s: 'e.g. use availability zones' }, { t: 'Operational excellence', v: '5' }, { t: 'Performance', v: '1' }] }] }, t: 'menu:Cost', say: 'Advisor is a free **personalised consultant**. It studies your actual usage and gives advice in **five pillars**: Cost, Security, Reliability, Operational excellence and Performance.' },
      { sc: { s: 'res', title: 'Advisor', type: 'Cost recommendations', i: 'advisor', menu: ['Overview', ['Recommendations', ['Cost', 'Reliability']]], active: 'Cost', body: [{ b: 'table', cols: ['Impact', 'Impacted resources', 'Potential annual savings'], rows: [['Right-size or shutdown underutilized virtual machines', 'High', '2', '$1,704'], ['Buy reserved instances to save over pay-as-you-go', 'High', '3', '$2,140'], ['Delete unattached disks', 'Medium', '1', '$368']] }] }, t: 'row:Right-size or shutdown underutilized virtual machines', say: 'Cost advice is specific: **vm-test-02** averaged 3% CPU for a week, so shrink it or switch it off.' },
      { sc: { s: 'res', title: 'Right-size or shutdown underutilized virtual machines', type: 'Recommendation', i: 'advisor', menu: ['Overview'], active: 'Overview', cmds: ['Resize', 'Shut down', 'Postpone', 'Dismiss'], body: [{ b: 'table', cols: ['Current SKU', 'Recommended', 'Annual savings'], rows: [['vm-test-02', 'D8s_v5', 'D2s_v5', '$1,260'], ['vm-batch-01', 'D4s_v5', 'Shut down', '$444']] }] }, say: 'Act with one click (**Resize**, **Shut down**) or **postpone/dismiss**. Advisor recommends; you decide.' },
    ],
  },

  monitor: {
    title: 'Watch metrics and create an alert in Azure Monitor',
    steps: [
      { sc: HOME, t: 'nav:Azure Monitor', say: 'Open **Azure Monitor** from Tools.' },
      { sc: { s: 'res', title: 'Monitor', type: 'Metrics', i: 'monitor', menu: ['Overview', 'Activity log', 'Alerts', 'Metrics', 'Logs', 'Service Health', 'Workbooks', ['Insights', ['Applications', 'Virtual Machines', 'Containers', 'Networks']]], active: 'Metrics', body: [{ b: 'chart', title: 'Avg Percentage CPU for vm-web-01', data: [22, 25, 31, 48, 66, 88, 92, 85, 60, 40], unit: 'Last 24 hours', line: 80, lineLabel: '80%' }] }, t: 'menu:Logs', say: '**Metrics** are numbers over time (CPU, requests, latency), collected automatically for every resource. CPU hit 92% this afternoon.' },
      { sc: { s: 'res', title: 'Monitor', type: 'Logs', i: 'monitor', menu: ['Overview', 'Alerts', 'Metrics', 'Logs'], active: 'Logs', body: [{ b: 'code', title: 'KQL query · Log Analytics workspace', text: 'Perf\n| where ObjectName == "Processor" and CounterName == "% Processor Time"\n| summarize avg(CounterValue) by Computer, bin(TimeGenerated, 1h)\n| order by avg_CounterValue desc' }, { b: 'table', cols: ['TimeGenerated', 'avg_CounterValue'], rows: [['vm-web-01', '14:00', '91.7'], ['vm-web-02', '14:00', '43.2']] }] }, t: 'menu:Alerts', say: '**Logs** are detailed records stored in a **Log Analytics workspace** and searched with **KQL**. Now set an **alert** so you hear about it first.' },
      ...wizard('Create an alert rule', ['Monitor', 'Alerts'], ['Scope', 'Condition', 'Actions', 'Details', 'Tags', 'Review + create'], [
        { tab: 1, groups: [{ f: [['Signal name', 'Percentage CPU'], ['Threshold', '*Static|Dynamic', 'r'], ['Aggregation type', 'Average'], ['Operator', 'Greater than'], ['Threshold value', '80', 't'], ['Check every / Lookback period', '1 minute / 5 minutes', 'i']] }], say: '**Condition**: average CPU above **80%** over 5 minutes.' },
        { tab: 2, groups: [{ f: [['Action group', 'ag-oncall · Email ops@contoso.com · SMS · Teams webhook', 'i']] }], say: '**Actions**: an **action group** emails, texts, calls a webhook or runs automation.' },
        { tab: 5, groups: review([['Scope', 'vm-web-01'], ['Condition', 'Percentage CPU > 80 (avg, 5 min)'], ['Severity', '2 - Warning'], ['Action group', 'ag-oncall']]), say: 'Select **Create**.' },
      ]),
      { sc: { s: 'res', title: 'Monitor', type: 'Alerts', i: 'monitor', menu: ['Overview', 'Alerts', 'Metrics', 'Logs'], active: 'Alerts', body: [{ b: 'table', cols: ['Severity', 'Affected resource', 'Fired time'], rows: [['High CPU on vm-web-01', 'Sev2', 'vm-web-01', '12/11/2026, 14:06']] }] }, toast: '🔔 **Alert fired**: High CPU on vm-web-01 (Sev2) · email sent to ops@contoso.com', say: 'The alert fired and the on-call team was emailed before users complained. Add **Application Insights** for app-level telemetry.' },
    ],
  },

  'service-health': {
    title: 'Check Service Health and Resource Health',
    steps: [
      ...find('service health', 'Service Health', 'health', 'Is it your app or is it Azure? Search **Service Health**.', [['Documentation', 'Azure status page (azure.status.microsoft)', 'doc']]),
      { sc: { s: 'res', title: 'Service Health', type: 'Service issues', i: 'health', menu: [['Active events', ['Service issues', 'Planned maintenance', 'Health advisories', 'Security advisories']], ['History', ['Health history']], 'Resource health', 'Health alerts'], active: 'Service issues', body: [{ b: 'table', cols: ['Tracking ID', 'Services', 'Regions', 'Status'], rows: [['Degraded performance: Virtual Machines', 'VLQ8-2X9', 'Virtual Machines', 'West Europe', 'Active']] }, { b: 'note', tone: 'warn', text: '⚠️ Only events affecting **your** subscriptions, services and regions are shown, with updates and a final root-cause report.' }] }, t: 'menu:Resource health', say: '**Service Health** shows Azure incidents, planned maintenance and advisories that affect **you**. The public **Azure status** page shows only widespread issues.' },
      { sc: { s: 'res', title: 'vm-web-01', type: 'Resource health', i: 'vm', menu: VM_MENU, active: 'Overview', body: [{ b: 'note', tone: 'ok', text: '✔ **Available**: There aren’t any known Azure platform problems affecting this virtual machine.' }, { b: 'table', title: 'Health history', cols: ['Status', 'Reason'], rows: [['11/12/2026 03:10', 'Unavailable', 'Platform-initiated reboot (host maintenance)'], ['11/12/2026 03:14', 'Available', 'Recovered']] }] }, t: 'menu:Alerts', say: '**Resource Health** tells you about **one** resource: is *this* VM healthy, and if not, was it Azure or you?' },
      { sc: { s: 'res', title: 'Service Health', type: 'Health alerts', i: 'health', menu: ['Health alerts'], active: 'Health alerts', body: [] }, pane: { title: 'Create a service health alert', groups: [{ f: [['Services', 'Virtual Machines, Storage, SQL Database'], ['Regions', 'West Europe, North Europe'], ['Event types', '*Service issue|*Planned maintenance|*Health advisories|Security advisory', 'c'], ['Action group', 'ag-oncall']] }], btns: ['Create', 'Cancel'] }, say: 'Create a **health alert** so the team is told about Azure incidents in your regions automatically.' },
    ],
  },

  'cost-management': {
    title: 'Analyse costs and set a budget',
    steps: [
      { sc: HOME, t: 'nav:Cost Management', say: 'Open **Cost Management**.' },
      { sc: { s: 'res', title: 'Cost Management', type: 'Cost analysis · Azure subscription 1', i: 'cost', menu: ['Overview', ['Reporting + analytics', ['Cost analysis', 'Scheduled actions', 'Exports']], ['Monitoring', ['Budgets', 'Cost alerts', 'Anomaly alerts']], ['Optimization', ['Advisor recommendations', 'Reservations + Hybrid Benefit']]], active: 'Cost analysis', body: [{ b: 'cards', items: [{ t: 'Actual cost (MTD)', v: '$148.20' }, { t: 'Forecast', v: '$212.00', s: 'End of month', c: 'warn' }, { t: 'Budget', v: '$200', s: 'Forecast is **over budget**', c: 'bad' }] }, { b: 'chart', title: 'Accumulated cost · November', data: [5, 14, 25, 38, 52, 70, 88, 104, 126, 148], unit: 'Daily, USD', line: 200, lineLabel: 'Budget $200' }, { b: 'table', title: 'Cost by service', cols: ['Cost'], rows: [['Virtual Machines', '$96.40'], ['Storage', '$21.10'], ['Bandwidth (data out)', '$18.30'], ['SQL Database', '$12.40']] }] }, t: 'menu:Budgets', say: '**Cost analysis** shows what you spent, on what, and the **forecast**. Pay-as-you-go means costs rise and fall with usage, so watch it. Open **Budgets**.' },
      ...wizard('Create budget', ['Cost Management', 'Budgets'], ['Create a budget', 'Set alerts'], [
        { tab: 0, groups: [{ h: 'Budget scoping', f: [['Scope', 'Azure subscription 1', 'i'], ['Filters', '+ Add filter (e.g. tag CostCenter)', 'i']] }, { h: 'Budget details', f: [['Name *', 'monthly-200', 't'], ['Reset period *', 'Monthly'], ['Creation date', '11/1/2026', 'i'], ['Expiration date', '10/31/2028', 'i'], ['Amount *', '200', 't']] }], say: 'A **budget** of **$200 per month** for the subscription.' },
        { tab: 1, groups: [{ h: 'Alert conditions', f: [['Actual · 80%', '$160 → email', 'i'], ['Forecasted · 100%', '$200 → email', 'i']] }, { h: 'Alert recipients (email)', f: [['Email', 'finance@contoso.com', 't']] }], say: '**Alerts** at 80% actual and 100% **forecast**. Budgets **notify**; they do not stop resources. Use action groups to automate a response.', t: 'btn:Create' },
      ]),
      { sc: { s: 'res', title: 'Cost Management', type: 'Budgets', i: 'cost', menu: ['Overview', ['Monitoring', ['Budgets', 'Cost alerts']]], active: 'Budgets', body: [{ b: 'table', cols: ['Reset period', 'Amount', 'Evaluated spend', 'Progress'], rows: [['monthly-200', 'Monthly', '$200', '$148.20', '74%']] }] }, toast: '📧 Forecast alert: **monthly-200** is forecast to reach **106%**. Email sent to finance@contoso.com.', say: 'The forecast alert fires mid-month, while there is still time to act. Predictable costs come from **budgets + alerts + Advisor**.' },
    ],
  },

  'pricing-options': {
    title: 'See what changes a VM’s price',
    steps: [
      { sc: { s: 'create', title: 'Create a virtual machine', crumbs: ['Virtual machines'], tabs: VM_TABS, tab: 0, groups: vmBasics([noRedundancy], 'Standard_D4s_v5 - 4 vcpus, 16 GiB memory ($140.16/month)') }, t: 'f:Size', say: 'In the create form, the **size** shows a monthly price. Open **See all sizes**.' },
      { sc: { s: 'create', title: 'Create a virtual machine', crumbs: ['Virtual machines'], tabs: VM_TABS, tab: 0, groups: [] }, pane: { title: 'Select a VM size', body: [{ b: 'table', cols: ['vCPUs', 'RAM', 'Cost/month (West Europe)', 'Cost/month (Sweden Central)'], rows: [['B2s', '2', '4 GiB', '$35.04', '$31.39'], ['D4s_v5', '4', '16 GiB', '$140.16', '$128.48'], ['E8s_v5', '8', '64 GiB', '$467.20', '$420.48']] }] }, say: '**Size** and **region** both change the price: the same VM is cheaper in some regions. **Data leaving Azure (egress)** and **storage** add to the bill too.' },
      { sc: { s: 'create', title: 'Create a virtual machine', crumbs: ['Virtual machines'], tabs: VM_TABS, tab: 0, groups: vmBasics([noRedundancy], 'Standard_D4s_v5 - 4 vcpus ($140.16/month)', [['Run with Azure Spot discount', '*', 'c', 'Up to **90% off**, but Azure can **evict** the VM with 30 seconds’ notice when it needs capacity.'], ['Eviction type', '*Capacity only|Price or capacity', 'r']]) }, t: 'f:Run with Azure Spot discount', say: '**Spot**: spare capacity at a deep discount, for work that can be interrupted (batch jobs, tests).' },
      { sc: { s: 'create', title: 'Create a virtual machine', crumbs: ['Virtual machines'], tabs: VM_TABS, tab: 0, groups: [{ h: 'Licensing', f: [['Would you like to use an existing Windows Server license?', '*', 'c', '**Azure Hybrid Benefit**: bring licenses you already own and stop paying for the Windows licence in Azure.']] }] }, say: '**Azure Hybrid Benefit**: reuse Windows Server and SQL Server licences you already own.' },
      ...find('reservations', 'Reservations', 'reserve', 'For steady, always-on workloads, commit up front. Search **reservations**.', [['Services', 'Savings plans', 'reserve']]),
      { sc: { s: 'res', title: 'Purchase reservations', type: 'Virtual machine', i: 'reserve', menu: ['Overview'], active: 'Overview', body: [{ b: 'table', cols: ['Term', 'Billing', 'Monthly price', 'Savings vs pay-as-you-go'], rows: [['D4s_v5 · West Europe', '1 year', 'Monthly', '$88.30', '37%'], ['D4s_v5 · West Europe', '3 years', 'Monthly', '$56.06', '60%']] }] }, say: '**Reserved instances** (1 or 3 years) cut the price a lot. **Savings plans** commit to an hourly spend across services. Pay-as-you-go for flexible, reservations for steady, Spot for interruptible.' },
    ],
  },

  'site-recovery': {
    title: 'Replicate a VM to another region',
    steps: [
      { sc: vm('Overview'), t: 'menu:Disaster recovery', say: 'What if the whole West Europe region went down? Open **Disaster recovery**.' },
      ...wizard('Azure Site Recovery', ['vm-web-01'], ['Basics', 'Advanced settings', 'Review + Start replication'], [
        { tab: 0, groups: [{ f: [['Target region *', 'North Europe', 's', 'The paired region is suggested.'], ['Availability options', 'Availability zone']] }], say: 'Choose the **target region**. Azure suggests the **paired region**, North Europe.' },
        { tab: 1, groups: [{ f: [['Target resource group', '(new) rg-learn-asr'], ['Target virtual network', '(new) vnet-learn-asr'], ['Replication policy', '24-hour-retention-policy'], ['Cache storage account', '(new) cachestlearn']] }], say: 'Site Recovery creates matching resources in the target region and **continuously replicates** the disks.' },
        { tab: 2, groups: review([['Source', 'West Europe'], ['Target', 'North Europe'], ['Replication', 'Continuous, crash-consistent every 5 min']]), say: 'Select **Start replication**.', t: 'btn:Create' },
      ]),
      { sc: vm('Disaster recovery', [{ b: 'cards', items: [{ t: 'Replication health', v: 'Healthy', c: 'ok' }, { t: 'Status', v: 'Protected' }, { t: 'RPO', v: '43 seconds', s: 'Data you could lose' }] }], ['Failover', 'Test failover', 'Cleanup test failover', 'Disable replication']), t: 'cmd:Test failover', say: '**Protected**, with an RPO under a minute. Run a **Test failover** regularly: it spins up a copy in North Europe without touching production.' },
      { sc: vm('Disaster recovery', [{ b: 'note', tone: 'ok', text: '✔ Test failover succeeded. **vm-web-01-test** is running in North Europe (isolated test network).' }]), say: 'Practised, measured recovery: that is **reliability**. Pair it with **Azure Backup** to recover from mistakes like accidental deletes.' },
    ],
  },

  marketplace: {
    title: 'IaaS, PaaS, serverless or SaaS: choose in “Create a resource”',
    steps: [
      { sc: HOME, t: 'svc:Create a resource', say: 'Select **Create a resource**.' },
      { sc: { s: 'market', cats: ['Get Started', 'AI + Machine Learning', 'Compute', 'Containers', 'Databases', 'Networking', 'Storage', 'Web', 'Software as a service (SaaS)'], cat: 2, items: [{ n: 'Virtual machine', by: 'Microsoft | Azure Service', d: 'IaaS: you manage the OS. Full control.', i: 'vm' }, { n: 'Web App', by: 'Microsoft | Azure Service', d: 'PaaS: bring code, Microsoft runs the platform.', i: 'web' }, { n: 'Function App', by: 'Microsoft | Azure Service', d: 'Serverless: code runs on events, pay per execution.', i: 'func' }, { n: 'Kubernetes Service', by: 'Microsoft | Azure Service', d: 'Managed Kubernetes for containers.', i: 'aks' }] }, t: 'item:Virtual machine', say: 'The **Compute** category shows the spectrum: **VM** (IaaS, most control) → **Web App** (PaaS) → **Function App** (serverless, least to manage).' },
      { sc: { s: 'market', cats: ['Get Started', 'AI + Machine Learning', 'Compute', 'Containers', 'Databases', 'Networking', 'Storage', 'Web', 'Software as a service (SaaS)'], cat: 8, items: [{ n: 'Microsoft 365 E3', by: 'Microsoft', d: 'SaaS: finished apps, just add users.', i: 'marketplace' }, { n: 'Contoso CRM', by: 'Partner SaaS', d: 'Subscribe, configure, sign in. No infrastructure.', i: 'marketplace' }, { n: 'Elastic Cloud', by: 'Elastic', d: 'Managed search as a service, billed through Azure.', i: 'marketplace' }] }, t: 'cat:Software as a service (SaaS)', say: '**SaaS**: finished software you just subscribe to. Nothing to install or patch: you manage only your **data and users**.' },
      { sc: { s: 'market', cats: ['Get Started', 'Compute', 'Databases', 'Web', 'Software as a service (SaaS)'], cat: 2, items: [{ n: 'SQL Server 2022 on Windows Server', by: 'Microsoft', d: 'IaaS: you patch SQL and Windows.', i: 'vm' }, { n: 'Azure SQL', by: 'Microsoft | Azure Service', d: 'PaaS: Microsoft patches, backs up and scales.', i: 'sql' }, { n: 'Azure Cosmos DB', by: 'Microsoft | Azure Service', d: 'PaaS NoSQL, global distribution.', i: 'cosmos' }] }, say: 'Same choice for databases: SQL Server **on a VM** (IaaS) or **Azure SQL** (PaaS). The further right you go, the less you manage and the less you control.' },
    ],
  },

  purview: {
    title: 'Find and label sensitive data with Microsoft Purview',
    steps: [
      ...find('purview', 'Microsoft Purview accounts', 'purview', 'Search for **Purview**.'),
      { sc: { s: 'res', title: 'purview-contoso', type: 'Microsoft Purview account', i: 'purview', crumbs: ['rg-governance'], menu: ['Overview', 'Activity log', 'Access control (IAM)', 'Tags', ['Settings', ['Managed resources', 'Networking', 'Properties']]], active: 'Overview', cmds: ['Open Microsoft Purview portal', 'Delete', 'Refresh'], ess: [['Resource group', 'rg-governance'], ['Location', 'West Europe'], ['Status', 'Succeeded'], ['Data Map', 'Enabled']] }, t: 'cmd:Open Microsoft Purview portal', say: 'Purview is managed mostly from the **Microsoft Purview portal**, a unified place for data governance, security and compliance. Open it.' },
      { sc: { s: 'res', title: 'Data Map', type: 'Microsoft Purview portal', i: 'purview', menu: ['Data Map', ['Data sources', ['Sources', 'Scans']], ['Data Catalog', ['Search', 'Classifications', 'Sensitivity labels']]], active: 'Sources', cmds: ['+ Register', 'Refresh'], body: [{ b: 'tree', nodes: [{ n: 'Contoso (root collection)', d: 0, i: 'purview' }, { n: 'stlearn2026 (Azure Blob Storage)', d: 1, i: 'storage', tag: 'Scanned' }, { n: 'sqldb-shop (Azure SQL Database)', d: 1, i: 'sql', tag: 'Scanned' }, { n: 'SRV-FILE01 (on-premises file share)', d: 1, i: 'share', tag: 'Scan scheduled' }, { n: 'Amazon S3: contoso-logs', d: 1, i: 'storage', tag: 'Multicloud' }] }] }, t: 'row:sqldb-shop (Azure SQL Database)', say: '**Register** data sources across Azure, on-premises and other clouds, then **scan** them. Purview builds a **data map** of everything you own.' },
      { sc: { s: 'res', title: 'sqldb-shop', type: 'Asset · Azure SQL Database', i: 'sql', menu: ['Overview', 'Schema', 'Lineage', 'Classifications'], active: 'Classifications', body: [{ b: 'table', cols: ['Classification', 'Sensitivity label'], rows: [['dbo.Customers.Email', 'Email Address', 'Confidential'], ['dbo.Customers.CardNumber', 'Credit Card Number', 'Highly Confidential'], ['dbo.Orders.Total', '—', 'General']] }, { b: 'note', tone: 'warn', text: '⚠️ Purview found **credit card numbers** automatically. Apply protection and limit who can read this column.' }] }, say: 'Scans **classify** columns and files automatically (emails, card numbers, passport IDs) and suggest **sensitivity labels**. Now you know where your sensitive data lives.' },
      { sc: { s: 'res', title: 'sqldb-shop', type: 'Asset · Azure SQL Database', i: 'sql', menu: ['Overview', 'Schema', 'Lineage', 'Classifications'], active: 'Lineage', body: [{ b: 'tree', nodes: [{ n: 'Shop website (orders)', d: 0, i: 'web' }, { n: 'sqldb-shop', d: 1, i: 'sql' }, { n: 'Data Factory: nightly-export', d: 2, i: 'deploy' }, { n: 'Power BI: Sales report', d: 3, i: 'dash' }] }] }, say: '**Lineage** shows where data comes from and where it goes. Purview = **find, classify, label and govern** your data everywhere, while Azure Policy governs **resources**.' },
    ],
  },

  'preview-features': {
    title: 'Preview features and SLAs',
    steps: [
      { sc: { s: 'res', title: 'Azure subscription 1', type: 'Subscription', i: 'sub', menu: ['Overview', ['Settings', ['Preview features', 'Resource providers', 'Usage + quotas']]], active: 'Overview', ess: [['Status', 'Active'], ['Offer', 'Pay-As-You-Go']] }, t: 'menu:Preview features', say: 'Open the subscription’s **Preview features**.' },
      { sc: { s: 'res', title: 'Azure subscription 1', type: 'Subscription', i: 'sub', menu: ['Overview', ['Settings', ['Preview features']]], active: 'Preview features', body: [{ b: 'note', tone: 'warn', text: '⚠️ Previews are provided "as-is", **excluded from the service level agreements** and limited warranty, and may have reduced or different security, compliance and privacy commitments.' }, { b: 'table', cmds: ['Register', 'Unregister', 'Refresh'], cols: ['Type', 'State'], rows: [['Hibernation for VMs (preview)', 'Public preview', 'Not registered'], ['Shared disks for Ultra (preview)', 'Public preview', 'Registered'], ['Private preview feature', 'Private preview', 'Not registered']] }] }, say: 'Features move through **private preview** → **public preview** → **general availability (GA)**. Only **GA** services come with an **SLA**: test previews, don’t bet production on them.' },
    ],
  },
};

export const tourIds = Object.keys(TOURS);
export type { Tour, Step, Pane };
