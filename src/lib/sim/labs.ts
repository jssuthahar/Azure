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
