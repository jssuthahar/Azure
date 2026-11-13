/**
 * Guided practice labs for the Azure simulator. Each task is checked
 * automatically against the simulated state and activity log.
 */
import type { Sim } from './engine';

export interface LabTask {
  text: string;
  portal?: string;
  cli?: string;
  check: (s: Sim) => boolean;
}
export interface Lab {
  id: string;
  title: string;
  icon: string;
  level: 'Beginner' | 'Intermediate';
  minutes: number;
  start: 'portal' | 'shell';
  intro: string;
  learn: string[];
  topics: string[]; // related lesson slugs
  tasks: LabTask[];
  wrap: string;
}

const ev = (s: Sim, type: string, pred: (d: Record<string, any>) => boolean = () => true) => s.events.some((e) => e.type === type && pred(e.data));
const eq = (a = '', b = '') => a.toLowerCase() === b.toLowerCase();

export const LABS: Lab[] = [
  {
    id: 'first-resource-group',
    title: 'Your first resource group',
    icon: '📦',
    level: 'Beginner',
    minutes: 5,
    start: 'portal',
    intro: 'Every Azure resource lives in a resource group: a folder for things that belong together. Create one, label it with a tag, and find it again.',
    learn: ['What a resource group is', 'How to pick a region', 'How tags help organise resources'],
    topics: ['what-is-cloud-computing', 'what-is-microsoft-azure', 'public-cloud', 'governance', 'resources-and-resource-groups', 'management-hierarchy', 'azure-portal'],
    tasks: [
      { text: 'Create a resource group named **rg-learn-azure** in any region.', portal: 'Create a resource ➜ Resource group ➜ name it rg-learn-azure ➜ Review + create.', cli: 'az group create --name rg-learn-azure --location westeurope', check: (s) => !!s.rg('rg-learn-azure') },
      { text: 'Add the tag **env = learning** to it.', portal: 'Open the resource group ➜ Tags ➜ name env, value learning ➜ Add.', cli: 'az group update --name rg-learn-azure --tags env=learning', check: (s) => s.rg('rg-learn-azure')?.tags.env?.toLowerCase() === 'learning' },
      { text: 'Open the **Resource groups** list and find your group.', portal: 'Click “Resource groups” in the left menu.', cli: 'az group list -o table', check: (s) => ev(s, 'view', (d) => d.page === 'rgs') || ev(s, 'cli', (d) => d.path === 'group list') },
    ],
    wrap: 'Resource groups keep related resources together, so you can manage, secure and delete them as one unit. Tags are labels that help with cost reports and ownership.',
  },
  {
    id: 'vm-and-cost',
    title: 'Launch a VM and save money',
    icon: '🖥️',
    level: 'Beginner',
    minutes: 10,
    start: 'portal',
    intro: 'Create a virtual machine (IaaS), discover the extra resources Azure creates for it, then stop it and watch the cost meter drop. That is the consumption model in action.',
    learn: ['Creating an IaaS virtual machine', 'Resources a VM needs (disk, NIC, network, IP)', 'Stopped vs deallocated, and why it matters for your bill'],
    topics: ['what-is-cloud-computing', 'why-companies-use-cloud', 'on-premises-vs-cloud', 'iaas', 'choosing-iaas-paas-saas', 'shared-responsibility-model', 'consumption-based-model', 'cloud-pricing-models', 'capex-vs-opex', 'predictability', 'security', 'virtual-machines', 'compute-types', 'virtual-networks-and-subnets', 'network-security-groups', 'factors-affecting-cost', 'pricing-calculator', 'cost-management'],
    tasks: [
      { text: 'Create a resource group named **rg-vm-lab**.', cli: 'az group create -n rg-vm-lab -l westeurope', portal: 'Create a resource ➜ Resource group.', check: (s) => !!s.rg('rg-vm-lab') || ev(s, 'rg.delete', (d) => eq(d.name, 'rg-vm-lab')) },
      { text: 'Create an **Ubuntu** virtual machine named **web01** (size Standard_B1s) in rg-vm-lab.', portal: 'Create a resource ➜ Virtual machine ➜ choose rg-vm-lab, name web01, Ubuntu, Standard_B1s ➜ Review + create.', cli: 'az vm create -g rg-vm-lab -n web01 --image Ubuntu2204 --size Standard_B1s --generate-ssh-keys', check: (s) => ev(s, 'vm.create', (d) => eq(d.rg, 'rg-vm-lab') && eq(d.name, 'web01')) },
      { text: 'Open **rg-vm-lab** and look at the extra resources Azure created for the VM.', portal: 'Resource groups ➜ rg-vm-lab. Spot the disk, network interface, virtual network, public IP and NSG.', cli: 'az resource list -g rg-vm-lab -o table', check: (s) => ev(s, 'vm.create', (d) => eq(d.rg, 'rg-vm-lab')) && (ev(s, 'view', (d) => d.page === 'rg' && eq(d.name, 'rg-vm-lab')) || ev(s, 'cli', (d) => d.path === 'resource list')) },
      { text: '**Stop (deallocate)** web01 and check the cost meter drop.', portal: 'Open web01 ➜ ⏹ Stop. Then open Cost Management.', cli: 'az vm deallocate -g rg-vm-lab -n web01', check: (s) => ev(s, 'vm.deallocate', (d) => eq(d.name, 'web01')) },
      { text: 'Clean up: **delete the resource group** rg-vm-lab (this deletes everything in it).', portal: 'Open rg-vm-lab ➜ Delete resource group ➜ type the name to confirm.', cli: 'az group delete -n rg-vm-lab --yes', check: (s) => ev(s, 'rg.delete', (d) => eq(d.name, 'rg-vm-lab')) },
    ],
    wrap: 'A VM is IaaS: you choose the OS and size, and Azure adds a disk, network and IP. A deallocated VM stops compute charges, but disks still cost money. Deleting the resource group is the cleanest way to remove everything.',
  },
  {
    id: 'storage-redundancy',
    title: 'Storage accounts and redundancy',
    icon: '🗄️',
    level: 'Beginner',
    minutes: 8,
    start: 'portal',
    intro: 'Storage account names have strict rules, and redundancy decides how many copies of your data exist and where. Break the rules on purpose, then do it right.',
    learn: ['Storage account naming rules (globally unique)', 'LRS, ZRS, GRS and GZRS', 'Changing redundancy later'],
    topics: ['high-availability', 'reliability', 'storage-accounts', 'storage-redundancy', 'availability-zones', 'files-queues-tables-disks'],
    tasks: [
      { text: 'Create a resource group named **rg-storage-lab**.', cli: 'az group create -n rg-storage-lab -l northeurope', portal: 'Create a resource ➜ Resource group.', check: (s) => !!s.rg('rg-storage-lab') },
      { text: 'Make a mistake on purpose: try to create a storage account named **My-Storage!** and read the error.', portal: 'Create a resource ➜ Storage account ➜ type My-Storage! ➜ Review + create.', cli: 'az storage account create -n My-Storage! -g rg-storage-lab', check: (s) => ev(s, 'storage.invalid') },
      { text: 'Now create one with a valid, unique name (e.g. **stlearn** + your birthday) using **ZRS**.', portal: 'Name: lowercase letters and numbers only. Redundancy: Zone-redundant storage (ZRS).', cli: 'az storage account create -n stlearn0412 -g rg-storage-lab --sku Standard_ZRS', check: (s) => ev(s, 'storage.create', (d) => d.sku === 'Standard_ZRS') },
      { text: 'Your company wants a copy in another region too. Change it to **GZRS**.', portal: 'Open the storage account ➜ Change redundancy ➜ Geo-zone-redundant storage (GZRS) ➜ Save.', cli: 'az storage account update -n stlearn0412 -g rg-storage-lab --sku Standard_GZRS', check: (s) => ev(s, 'storage.sku', (d) => d.sku === 'Standard_GZRS') },
    ],
    wrap: 'Storage names are 3–24 lowercase letters and numbers, unique across Azure, because they become part of a URL. ZRS protects against a datacenter failure. GZRS adds a copy in a second region to survive a regional disaster.',
  },
  {
    id: 'locks-and-tags',
    title: 'Protect resources with locks',
    icon: '🔒',
    level: 'Beginner',
    minutes: 7,
    start: 'portal',
    intro: 'Production resources should never be deleted by accident. Add a delete lock, watch it block even an admin, then remove it properly.',
    learn: ['CanNotDelete vs ReadOnly locks', 'Locks apply to everyone, even owners', 'Tags for ownership'],
    topics: ['governance', 'security', 'shared-responsibility-model', 'resource-locks', 'resource-tags', 'azure-policy'],
    tasks: [
      { text: 'Create a resource group **rg-prod** with the tag **owner = yourname**.', portal: 'Create a resource ➜ Resource group ➜ tag owner = your name.', cli: 'az group create -n rg-prod -l uksouth --tags owner=sam', check: (s) => !!s.rg('rg-prod')?.tags.owner || ev(s, 'rg.delete', (d) => eq(d.name, 'rg-prod')) },
      { text: 'Add a **Delete (CanNotDelete)** lock named **do-not-delete**.', portal: 'Open rg-prod ➜ Locks ➜ name do-not-delete, type Delete ➜ Add.', cli: 'az lock create --name do-not-delete --lock-type CanNotDelete -g rg-prod', check: (s) => ev(s, 'lock.create', (d) => eq(d.rg, 'rg-prod') && d.level === 'CanNotDelete') },
      { text: 'Try to **delete rg-prod**. It should be blocked!', portal: 'Open rg-prod ➜ Delete resource group.', cli: 'az group delete -n rg-prod --yes', check: (s) => ev(s, 'delete.blocked', (d) => eq(d.rg, 'rg-prod')) },
      { text: 'Remove the lock, then delete rg-prod for real.', portal: 'Locks ➜ Delete the lock ➜ then Delete resource group.', cli: 'az lock delete --name do-not-delete -g rg-prod', check: (s) => ev(s, 'lock.delete', (d) => eq(d.rg, 'rg-prod')) && ev(s, 'rg.delete', (d) => eq(d.name, 'rg-prod')) },
    ],
    wrap: 'A Delete lock stops deletion but allows changes; a ReadOnly lock stops changes too. Locks override permissions, so even an Owner must remove the lock first. That is exactly what you want for production.',
  },
  {
    id: 'cloud-shell-webapp',
    title: 'Cloud Shell: deploy a web app',
    icon: '⌨️',
    level: 'Intermediate',
    minutes: 10,
    start: 'shell',
    intro: 'Real cloud engineers script everything. Use the Azure CLI in Cloud Shell to create a PaaS web app, then see it appear in the portal.',
    learn: ['Azure CLI command structure', 'Table output', 'PaaS: App Service plan + web app'],
    topics: ['paas', 'choosing-iaas-paas-saas', 'manageability', 'app-service', 'cloud-shell-cli-powershell', 'azure-resource-manager', 'infrastructure-as-code'],
    tasks: [
      { text: 'Create a resource group **rg-shell** using the CLI.', cli: 'az group create --name rg-shell --location westeurope', check: (s) => ev(s, 'rg.create', (d) => eq(d.name, 'rg-shell') && d.via === 'cli') },
      { text: 'List your resource groups as a **table**.', cli: 'az group list --output table', check: (s) => s.events.some((e) => e.type === 'cli' && e.data.path === 'group list' && /(-o|--output)\s+table/i.test(e.data.line)) },
      { text: 'Create a **Free (F1)** App Service plan named **plan-shell**.', cli: 'az appservice plan create -n plan-shell -g rg-shell --sku F1', check: (s) => ev(s, 'plan.create', (d) => eq(d.name, 'plan-shell') && d.sku === 'F1') },
      { text: 'Create a web app on that plan with a **unique name**.', cli: 'az webapp create -n my-shell-app-4821 -g rg-shell -p plan-shell --runtime NODE:20-lts', check: (s) => ev(s, 'webapp.create', (d) => eq(d.rg, 'rg-shell')) },
      { text: 'Switch to the **Portal** tab and open your web app, then click 🌐 Browse.', portal: 'Portal ➜ App Services ➜ your app ➜ Browse.', cli: 'az webapp browse -n my-shell-app-4821 -g rg-shell', check: (s) => ev(s, 'webapp.browse') },
    ],
    wrap: 'The CLI and the portal both talk to Azure Resource Manager, so whatever you create in one appears in the other. App Service is PaaS: no VMs or OS patching, just your code.',
  },
  {
    id: 'scale-sets',
    title: 'Black Friday: scale out and in',
    icon: '🧮',
    level: 'Intermediate',
    minutes: 8,
    start: 'shell',
    intro: 'Your shop expects a huge sale. Use a Virtual Machine Scale Set to add servers for the rush, then remove them to stop paying. Watch the cost meter.',
    learn: ['Horizontal scaling (scale out/in)', 'VM Scale Sets', 'How scaling changes cost'],
    topics: ['scalability', 'elasticity', 'cloud-pricing-models', 'vm-scale-sets-and-availability-sets'],
    tasks: [
      { text: 'Create a resource group **rg-shop**.', cli: 'az group create -n rg-shop -l eastus', check: (s) => !!s.rg('rg-shop') },
      { text: 'Create a scale set **shop-web** with **2 instances**.', cli: 'az vmss create -g rg-shop -n shop-web --image Ubuntu2204 --instance-count 2', check: (s) => ev(s, 'vmss.create', (d) => eq(d.name, 'shop-web')) },
      { text: 'Black Friday! Scale out to **6 instances**.', cli: 'az vmss scale -g rg-shop -n shop-web --new-capacity 6', check: (s) => ev(s, 'vmss.scale', (d) => eq(d.name, 'shop-web') && d.to >= 6) },
      { text: 'The sale is over. Scale back in to **2 instances** and check the cost.', cli: 'az vmss scale -g rg-shop -n shop-web --new-capacity 2', check: (s) => s.events.some((e) => e.type === 'vmss.scale' && e.data.to >= 6) && s.events.some((e) => e.type === 'vmss.scale' && e.data.to <= 2 && e.data.from >= 6) },
    ],
    wrap: 'Scaling out adds identical instances to share the load; scaling in removes them so you stop paying. With autoscale rules, Azure does this automatically: that is elasticity.',
  },
  {
    id: 'zones-ha',
    title: 'Survive a datacenter failure',
    icon: '🏢',
    level: 'Intermediate',
    minutes: 10,
    start: 'portal',
    intro: 'One VM in one datacenter goes down when that building does. Spread two web servers across availability zones so one keeps running if a zone fails, then see what Azure Advisor thinks.',
    learn: ['What an availability zone is', 'Placing VMs in different zones', 'Advisor reliability recommendations'],
    topics: ['availability-zones', 'high-availability', 'reliability', 'datacenters', 'regions-and-region-pairs', 'vm-scale-sets-and-availability-sets', 'slas-and-service-lifecycle'],
    tasks: [
      { text: 'Create a resource group **rg-ha** in a region with zones, such as West Europe.', portal: 'Create a resource ➜ Resource group ➜ rg-ha, West Europe.', cli: 'az group create -n rg-ha -l westeurope', check: (s) => !!s.rg('rg-ha') || ev(s, 'rg.delete', (d) => eq(d.name, 'rg-ha')) },
      { text: 'Create a VM **web-a** in rg-ha, placed in **Zone 1**.', portal: 'Create a resource ➜ Virtual machine ➜ Availability options: Availability zone ➜ Zone 1.', cli: 'az vm create -g rg-ha -n web-a --image Ubuntu2204 --zone 1', check: (s) => ev(s, 'vm.create', (d) => eq(d.rg, 'rg-ha') && eq(d.name, 'web-a') && d.zone === '1') },
      { text: 'Create a second VM **web-b** in rg-ha, this time in **Zone 2**.', portal: 'Same steps, but pick Zone 2.', cli: 'az vm create -g rg-ha -n web-b --image Ubuntu2204 --zone 2', check: (s) => ev(s, 'vm.create', (d) => eq(d.rg, 'rg-ha') && eq(d.name, 'web-b') && d.zone === '2') },
      { text: 'Open **Azure Advisor** and read its reliability advice.', portal: 'Search or click Advisor in the left menu.', check: (s) => ev(s, 'view', (d) => d.page === 'advisor') },
      { text: 'Clean up: delete **rg-ha**.', portal: 'Open rg-ha ➜ Delete resource group.', cli: 'az group delete -n rg-ha --yes', check: (s) => ev(s, 'rg.delete', (d) => eq(d.name, 'rg-ha')) },
    ],
    wrap: 'Availability zones are separate datacenters inside one region, each with its own power, cooling and network. Two VMs in two zones survive the loss of one zone. To survive a whole region going down, you need a second region.',
  },
  {
    id: 'readonly-lock',
    title: 'Freeze production with a read-only lock',
    icon: '🧊',
    level: 'Beginner',
    minutes: 7,
    start: 'portal',
    intro: 'A Delete lock stops deletion. A ReadOnly lock goes further and stops changes too. Freeze a storage account during an audit and watch even a simple setting change get refused.',
    learn: ['ReadOnly vs CanNotDelete', 'Locks block changes for every user', 'Removing a lock before a planned change'],
    topics: ['resource-locks', 'governance', 'azure-rbac', 'azure-policy', 'storage-accounts'],
    tasks: [
      { text: 'Create a resource group **rg-finance** and a storage account in it with **LRS**.', portal: 'Create a resource group, then Create a resource ➜ Storage account ➜ Redundancy: LRS.', cli: 'az group create -n rg-finance -l uksouth && az storage account create -n stfinance2026 -g rg-finance --sku Standard_LRS', check: (s) => ev(s, 'storage.create', (d) => eq(d.rg, 'rg-finance')) },
      { text: 'Add a **Read-only** lock named **audit-freeze** to rg-finance.', portal: 'Open rg-finance ➜ Locks ➜ name audit-freeze, type Read-only ➜ Add.', cli: 'az lock create --name audit-freeze --lock-type ReadOnly -g rg-finance', check: (s) => ev(s, 'lock.create', (d) => eq(d.rg, 'rg-finance') && d.level === 'ReadOnly') },
      { text: 'Try to change the storage account to **GRS**. It should be refused.', portal: 'Open the storage account ➜ Change redundancy ➜ GRS ➜ Save.', cli: 'az storage account update -n stfinance2026 -g rg-finance --sku Standard_GRS', check: (s) => ev(s, 'blocked', (d) => eq(d.rg, 'rg-finance')) },
      { text: 'The audit is over. Remove the lock, then make the GRS change for real.', portal: 'Locks ➜ delete audit-freeze ➜ then change redundancy to GRS.', cli: 'az lock delete --name audit-freeze -g rg-finance && az storage account update -n stfinance2026 -g rg-finance --sku Standard_GRS', check: (s) => ev(s, 'lock.delete', (d) => eq(d.rg, 'rg-finance')) && ev(s, 'storage.sku', (d) => eq(d.rg, 'rg-finance') && d.sku === 'Standard_GRS') },
    ],
    wrap: 'ReadOnly locks block every write, which can break things you might not expect, such as listing storage keys. Use them for short freezes. CanNotDelete is the everyday choice for production. Either way, locks apply to everyone, Owners included.',
  },
  {
    id: 'cost-detective',
    title: 'Cost detective: find the expensive VM',
    icon: '🔍',
    level: 'Beginner',
    minutes: 8,
    start: 'portal',
    intro: 'Someone left a big VM running over the weekend. Find it in Cost Management, shrink the bill by deallocating it, and check what Advisor suggests.',
    learn: ['How VM size drives cost', 'Reading Cost Management', 'Deallocating to stop compute charges'],
    topics: ['cost-management', 'factors-affecting-cost', 'azure-advisor', 'pricing-calculator', 'tco-calculator', 'consumption-based-model', 'cloud-pricing-models'],
    tasks: [
      { text: 'Create **rg-weekend** and a **Standard_D4s_v5** VM named **bigbox** in it.', portal: 'Create a resource ➜ Virtual machine ➜ size Standard_D4s_v5.', cli: 'az group create -n rg-weekend -l eastus && az vm create -g rg-weekend -n bigbox --image Ubuntu2204 --size Standard_D4s_v5', check: (s) => ev(s, 'vm.create', (d) => eq(d.rg, 'rg-weekend') && d.size === 'Standard_D4s_v5') },
      { text: 'Open **Cost Management** and spot which resource costs the most.', portal: 'Click Cost Management in the left menu.', check: (s) => ev(s, 'view', (d) => d.page === 'cost') },
      { text: '**Deallocate** bigbox so compute charges stop.', portal: 'Open bigbox ➜ ⏹ Stop.', cli: 'az vm deallocate -g rg-weekend -n bigbox', check: (s) => ev(s, 'vm.deallocate', (d) => eq(d.name, 'bigbox')) },
      { text: 'Open **Azure Advisor** for more ways to save.', portal: 'Click Advisor in the left menu.', check: (s) => ev(s, 'view', (d) => d.page === 'advisor') },
    ],
    wrap: 'VM size is one of the biggest cost factors: a D4s_v5 costs many times more per hour than a B1s. Cost Management shows where the money goes, Advisor suggests savings, and deallocating stops compute charges. The disk is still billed.',
  },
  {
    id: 'tags-chargeback',
    title: 'Tags: who pays for what?',
    icon: '🏷️',
    level: 'Beginner',
    minutes: 6,
    start: 'shell',
    intro: 'Finance wants each department to pay for its own cloud use. Tag two departments’ resource groups from Cloud Shell, so cost reports can be split by the dept tag.',
    learn: ['Adding tags from the CLI', 'Tags for cost reporting (chargeback)', 'Updating tags later'],
    topics: ['resource-tags', 'cost-management', 'management-hierarchy', 'subscriptions', 'governance', 'resources-and-resource-groups'],
    tasks: [
      { text: 'Create **rg-marketing** with the tag **dept = marketing**.', cli: 'az group create -n rg-marketing -l westeurope --tags dept=marketing', portal: 'Create a resource ➜ Resource group ➜ Tags: dept = marketing.', check: (s) => s.rg('rg-marketing')?.tags.dept?.toLowerCase() === 'marketing' },
      { text: 'Create **rg-sales** with the tag **dept = sales**.', cli: 'az group create -n rg-sales -l westeurope --tags dept=sales', portal: 'Same steps with dept = sales.', check: (s) => s.rg('rg-sales')?.tags.dept?.toLowerCase() === 'sales' },
      { text: 'Sales also wants a cost centre. Add **costcenter = 4100** to rg-sales.', cli: 'az group update -n rg-sales --tags dept=sales costcenter=4100', portal: 'Open rg-sales ➜ Tags ➜ add costcenter = 4100.', check: (s) => s.rg('rg-sales')?.tags.costcenter === '4100' },
      { text: 'List your resource groups as a **table** to check the result.', cli: 'az group list -o table', check: (s) => s.events.some((e) => e.type === 'cli' && e.data.path === 'group list') },
    ],
    wrap: 'Tags are name and value pairs on resources and resource groups. Cost Management can group and filter by tag, which is how companies split one Azure bill between teams. Tags on a resource group aren’t inherited by the resources inside unless a policy adds them.',
  },
  {
    id: 'vm-power-states',
    title: 'Restart, stop or deallocate?',
    icon: '🔌',
    level: 'Beginner',
    minutes: 7,
    start: 'shell',
    intro: 'Three buttons, three different bills. Walk a VM through restart, stop and deallocate, and learn which one actually stops the compute meter.',
    learn: ['Restart keeps the VM running', 'Stop (from the OS or CLI) can leave the VM allocated', 'Deallocate releases the hardware and stops compute charges'],
    topics: ['virtual-machines', 'consumption-based-model', 'compute-types', 'iaas'],
    tasks: [
      { text: 'Create **rg-power** and a VM named **app01**.', cli: 'az group create -n rg-power -l westeurope && az vm create -g rg-power -n app01 --image Ubuntu2204', portal: 'Create a resource ➜ Virtual machine.', check: (s) => ev(s, 'vm.create', (d) => eq(d.rg, 'rg-power') && eq(d.name, 'app01')) },
      { text: '**Restart** app01, as you would after patching.', cli: 'az vm restart -g rg-power -n app01', portal: 'Open app01 ➜ Restart.', check: (s) => ev(s, 'vm.restart', (d) => eq(d.name, 'app01')) },
      { text: '**Stop** app01 with az vm stop and read the warning about billing.', cli: 'az vm stop -g rg-power -n app01', check: (s) => ev(s, 'vm.stop', (d) => eq(d.name, 'app01')) },
      { text: 'Now **deallocate** it so compute billing really stops, then **start** it again.', cli: 'az vm deallocate -g rg-power -n app01 && az vm start -g rg-power -n app01', portal: 'Open app01 ➜ Stop, then Start.', check: (s) => ev(s, 'vm.deallocate', (d) => eq(d.name, 'app01')) && s.events.some((e) => e.type === 'vm.start' && eq(e.data.name, 'app01')) },
    ],
    wrap: 'Restart reboots a running VM. A stopped-but-allocated VM still holds its hardware, so compute is still billed. Deallocate releases it and the compute meter stops. When you start it again it may get a new public IP unless that IP is static.',
  },
  {
    id: 'governance-tour',
    title: 'Tour the governance and security tools',
    icon: '🛡️',
    level: 'Beginner',
    minutes: 6,
    start: 'portal',
    intro: 'The exam asks which tool does what. Open each one in the portal and connect the name to the screen: Policy, Defender for Cloud, Monitor, Advisor and Microsoft Entra ID.',
    learn: ['Azure Policy enforces rules', 'Defender for Cloud scores your security', 'Monitor collects metrics and logs', 'Advisor recommends improvements', 'Entra ID manages identities'],
    topics: ['azure-policy', 'microsoft-defender-for-cloud', 'azure-monitor', 'azure-advisor', 'microsoft-entra-id', 'governance', 'defense-in-depth', 'zero-trust', 'azure-portal', 'service-health-and-azure-status'],
    tasks: [
      { text: 'Open **Azure Policy**: rules that allow or deny what people create.', portal: 'Click Policy in the left menu.', check: (s) => ev(s, 'view', (d) => d.page === 'policy') },
      { text: 'Open **Microsoft Defender for Cloud** and find the secure score.', portal: 'Click Defender for Cloud.', check: (s) => ev(s, 'view', (d) => d.page === 'defender') },
      { text: 'Open **Azure Monitor**: metrics, logs and alerts.', portal: 'Click Monitor.', check: (s) => ev(s, 'view', (d) => d.page === 'monitor') },
      { text: 'Open **Azure Advisor**: personalised recommendations.', portal: 'Click Advisor.', check: (s) => ev(s, 'view', (d) => d.page === 'advisor') },
      { text: 'Open **Microsoft Entra ID**: users, groups and sign-in.', portal: 'Click Microsoft Entra ID.', check: (s) => ev(s, 'view', (d) => d.page === 'entra') },
    ],
    wrap: 'A quick way to remember them: Policy says what is allowed, Defender says how secure you are, Monitor says what is happening, Advisor says what to improve, and Entra ID says who you are.',
  },
  {
    id: 'cli-storage',
    title: 'Storage from the command line',
    icon: '💾',
    level: 'Intermediate',
    minutes: 8,
    start: 'shell',
    intro: 'Create, inspect, upgrade and remove a storage account without touching the portal. The same commands work in a real Cloud Shell.',
    learn: ['az storage account commands', 'Redundancy SKUs on the command line', 'Deleting a single resource vs a whole group'],
    topics: ['storage-accounts', 'storage-redundancy', 'cloud-shell-cli-powershell', 'blob-storage-and-tiers', 'files-queues-tables-disks', 'moving-files'],
    tasks: [
      { text: 'Create **rg-data** and a storage account with **Standard_LRS**.', cli: 'az group create -n rg-data -l northeurope && az storage account create -n stdata0412 -g rg-data --sku Standard_LRS', check: (s) => ev(s, 'storage.create', (d) => eq(d.rg, 'rg-data') && d.sku === 'Standard_LRS') },
      { text: 'Show it with **az storage account show** and find its SKU.', cli: 'az storage account show -n stdata0412 -g rg-data', check: (s) => s.events.some((e) => e.type === 'cli' && e.data.path === 'storage account show') },
      { text: 'Upgrade it to **Standard_GRS** for a copy in the paired region.', cli: 'az storage account update -n stdata0412 -g rg-data --sku Standard_GRS', check: (s) => ev(s, 'storage.sku', (d) => eq(d.rg, 'rg-data') && d.sku === 'Standard_GRS') },
      { text: 'Delete just the storage account, keeping the resource group.', cli: 'az storage account delete -n stdata0412 -g rg-data --yes', check: (s) => ev(s, 'storage.delete', (d) => eq(d.rg, 'rg-data')) },
    ],
    wrap: 'Everything in the portal has a CLI command, and scripts are repeatable where clicking isn’t. LRS keeps three copies in one datacenter, GRS adds three more in the paired region. Deleting one resource leaves the rest of the group alone.',
  },
];

export const SANDBOX: Lab = {
  id: 'sandbox',
  title: 'Free sandbox',
  icon: '🎛️',
  level: 'Beginner',
  minutes: 0,
  start: 'portal',
  intro: 'No tasks, no rules. Create anything, break anything, and explore the portal and Cloud Shell freely. Nothing here costs real money.',
  learn: [],
  topics: [],
  tasks: [],
  wrap: '',
};

export const ALL_LABS = [...LABS, SANDBOX];
export const labsForTopic = (slug: string) => LABS.filter((l) => l.topics.includes(slug));
