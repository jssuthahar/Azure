/**
 * AZ-104 "compute" practice labs (Cloud Shell): Bicep and ARM templates,
 * VM sizes, disks and encryption at host, moves, availability sets, zones
 * and scale sets. Every task is checked from simulator events (plus the
 * world itself for moves), and every `cli` hint works when run in order.
 */
import { SUB_ID, type Sim } from '../engine';
import type { Lab } from '../labs';

const ev = (s: Sim, type: string, pred: (d: Record<string, any>) => boolean = () => true) => s.events.some((e) => e.type === type && pred(e.data));
const lc = (x?: string) => (x ?? '').toLowerCase();
const id = (rg: string, provider: string, name: string) => `/subscriptions/${SUB_ID}/resourceGroups/${rg}/providers/${provider}/${name}`;
const SRC = 'rg-adm-move-src';
const vmIds = (rg: string, vm: string) => [
  id(rg, 'Microsoft.Compute/virtualMachines', vm),
  id(rg, 'Microsoft.Compute/disks', `${vm}_OsDisk_1`),
  id(rg, 'Microsoft.Network/networkInterfaces', `${vm}VMNic`),
  id(rg, 'Microsoft.Network/publicIPAddresses', `${vm}PublicIP`),
  id(rg, 'Microsoft.Network/networkSecurityGroups', `${vm}NSG`),
];

export const LABS: Lab[] = [
  /* ------------------------------------------------------- templates */
  {
    id: 'adm-vm-bicep', title: 'Read, edit, deploy and export a Bicep file', icon: '🧩', level: 'Intermediate', minutes: 12, start: 'shell',
    intro: 'Contoso keeps its storage accounts in Bicep. Read the file, change its default SKU, preview the change with what-if, deploy it, see what Complete mode would delete, then export the resource group and turn the JSON back into Bicep.',
    learn: ['The four parts of a template: parameters, variables, resources, outputs', 'Editing a parameter default and an @allowed list', 'what-if, Incremental and Complete deployment modes', 'az group export and az bicep decompile'],
    topics: ['interpret-and-modify-arm-and-bicep', 'deploy-and-export-templates'],
    tasks: [
      { text: 'Create **rg-adm-iac** in East US, then read **storage.bicep** and its ARM twin **azuredeploy.json**. Find the parameters, the variable, the resource and the output.', cli: 'az group create -n rg-adm-iac -l eastus && cat storage.bicep && cat azuredeploy.json', check: (s) => ev(s, 'adm.file.view', (d) => d.file === 'storage.bicep') && ev(s, 'adm.file.view', (d) => d.file === 'azuredeploy.json') },
      { text: 'Try to deploy with **skuName=Premium_LRS**. The **@allowed** list stops it before anything is created.', cli: 'az deployment group create -g rg-adm-iac --template-file storage.bicep --parameters storageName=stadmiac01 skuName=Premium_LRS', check: (s) => ev(s, 'adm.deploy.invalid', (d) => d.value === 'Premium_LRS') },
      { text: 'Modify the file: change the default of **skuName** from Standard_LRS to **Standard_ZRS**.', cli: `sed -i "s/= 'Standard_LRS'/= 'Standard_ZRS'/" storage.bicep && cat storage.bicep`, check: (s) => ev(s, 'adm.file.edit', (d) => d.file === 'storage.bicep' && /Standard_ZRS/.test(d.to)) },
      { text: 'Preview with **what-if**, then deploy **storage.bicep** with storageName **stadmiac01**.', cli: 'az deployment group what-if -g rg-adm-iac --template-file storage.bicep --parameters storageName=stadmiac01 && az deployment group create -g rg-adm-iac --template-file storage.bicep --parameters storageName=stadmiac01', check: (s) => ev(s, 'adm.deploy.whatif', (d) => d.file === 'storage.bicep') && ev(s, 'adm.deploy.create', (d) => d.storage === 'stadmiac01' && d.sku === 'Standard_ZRS') },
      { text: 'Someone adds **stadmscratch01** by hand. Run what-if in **Complete** mode and read what it would delete. Don\'t deploy it.', cli: 'az storage account create -g rg-adm-iac -n stadmscratch01 --sku Standard_LRS && az deployment group what-if -g rg-adm-iac --template-file storage.bicep --parameters storageName=stadmiac01 --mode Complete', check: (s) => ev(s, 'adm.deploy.whatif', (d) => d.mode === 'Complete' && d.deletes > 0) },
      { text: 'Export the resource group to **exported.json**, then decompile it to Bicep and read the result.', cli: 'az group export -n rg-adm-iac > exported.json && az bicep decompile --file exported.json && cat exported.bicep', check: (s) => ev(s, 'adm.group.export', (d) => d.rg === 'rg-adm-iac') && ev(s, 'adm.bicep.decompile', (d) => d.from === 'exported.json') },
    ],
    wrap: 'A template has parameters (inputs), variables (values worked out once), resources and outputs. @allowed and other decorators reject bad input before Resource Manager creates anything. Incremental mode, the default, only adds and changes; Complete mode also deletes whatever the template doesn\'t mention, so always run what-if first. Exported templates hard-code names and values: decompile them, then tidy them into parameters before you reuse them.',
  },

  /* ------------------------------------------------- VMs, sizes, disks */
  {
    id: 'adm-vm-size-disks', title: 'Create a VM, resize it, add a disk and encrypt at host', icon: '🖥️', level: 'Intermediate', minutes: 12, start: 'shell',
    intro: 'Build Contoso\'s app server, then do the jobs an admin gets every week: a bigger size, a data disk, encryption at host and a cheaper disk tier. Some of these need the VM deallocated, and the shell will tell you when you forget.',
    learn: ['az vm create and the resources it makes', 'Resize rules: restart within the cluster, deallocate for other sizes', 'Attaching data disks with host caching', 'Registering and enabling encryption at host', 'Changing a disk SKU and size'],
    topics: ['create-and-size-virtual-machines', 'vm-disks-and-encryption-at-host'],
    tasks: [
      { text: 'Create **rg-adm-vm** and a Linux VM **vm-app-01** (Ubuntu2204, **Standard_B2s**).', cli: 'az group create -n rg-adm-vm -l eastus && az vm create -g rg-adm-vm -n vm-app-01 --image Ubuntu2204 --size Standard_B2s --admin-username azureuser --generate-ssh-keys', check: (s) => ev(s, 'vm.create', (d) => d.name === 'vm-app-01') },
      { text: 'List the sizes you can resize to, then try **Standard_D2s_v5** while the VM runs. Read why it\'s refused.', cli: 'az vm list-vm-resize-options -g rg-adm-vm -n vm-app-01 -o table && az vm resize -g rg-adm-vm -n vm-app-01 --size Standard_D2s_v5', check: (s) => ev(s, 'adm.vm.resize.blocked', (d) => d.to === 'Standard_D2s_v5') },
      { text: '**Deallocate** the VM, resize it to **Standard_D2s_v5**, and start it again.', cli: 'az vm deallocate -g rg-adm-vm -n vm-app-01 && az vm resize -g rg-adm-vm -n vm-app-01 --size Standard_D2s_v5 && az vm start -g rg-adm-vm -n vm-app-01', check: (s) => ev(s, 'adm.vm.resize', (d) => d.name === 'vm-app-01' && d.to === 'Standard_D2s_v5') },
      { text: 'Attach a new **128 GiB Premium SSD** data disk **vm-app-01-data1** with **ReadOnly** caching, without stopping the VM.', cli: 'az vm disk attach -g rg-adm-vm --vm-name vm-app-01 -n vm-app-01-data1 --new --size-gb 128 --sku Premium_LRS --caching ReadOnly', check: (s) => ev(s, 'adm.disk.attach', (d) => d.disk === 'vm-app-01-data1' && d.caching === 'ReadOnly') },
      { text: 'Register **EncryptionAtHost**, deallocate the VM, turn on **encryption at host** and start it.', cli: 'az feature register --name EncryptionAtHost --namespace Microsoft.Compute && az vm deallocate -g rg-adm-vm -n vm-app-01 && az vm update -g rg-adm-vm -n vm-app-01 --set securityProfile.encryptionAtHost=true && az vm start -g rg-adm-vm -n vm-app-01', check: (s) => ev(s, 'adm.vm.eah', (d) => d.name === 'vm-app-01' && d.enabled) },
      { text: 'The data disk is barely used. Deallocate, switch it to **StandardSSD_LRS** and grow it to **256 GiB**, then start the VM.', cli: 'az vm deallocate -g rg-adm-vm -n vm-app-01 && az disk update -g rg-adm-vm -n vm-app-01-data1 --sku StandardSSD_LRS --size-gb 256 && az vm start -g rg-adm-vm -n vm-app-01', check: (s) => ev(s, 'adm.disk.update', (d) => d.name === 'vm-app-01-data1' && d.sku === 'StandardSSD_LRS' && d.sizeGb === 256) },
    ],
    wrap: 'A resize restarts the VM. If the new size isn\'t on the VM\'s current hardware cluster, deallocate first and every size in the region opens up. Data disks can be attached while the VM runs. Encryption at host needs the feature registered once per subscription and the VM deallocated to switch on; then the temp disk and the disk caches are encrypted on the host. Changing a disk\'s type needs the VM deallocated (or the disk detached), and disks only grow.',
  },

  /* ------------------------------------------------------------ moves */
  {
    id: 'adm-vm-move', title: 'Move a VM to another resource group and another region', icon: '🚚', level: 'Intermediate', minutes: 12, start: 'shell',
    intro: 'Contoso is reorganising: the reporting VM moves to another resource group, and then a copy has to run in West US 2. You\'ll see which parts of a VM travel with it, and what Resource Mover checks before it copies anything.',
    learn: ['az resource move and dependent resources', 'Why resource IDs change after a move', 'Azure Resource Mover: dependencies, prepare, initiate, commit'],
    topics: ['move-virtual-machines'],
    tasks: [
      { text: `Create **${SRC}** and **rg-adm-move-dst** in East US, and a VM **vm-rpt-01** in the source group.`, cli: `az group create -n ${SRC} -l eastus && az group create -n rg-adm-move-dst -l eastus && az vm create -g ${SRC} -n vm-rpt-01 --image Ubuntu2204 --size Standard_B2s --generate-ssh-keys`, check: (s) => ev(s, 'vm.create', (d) => d.name === 'vm-rpt-01') },
      { text: 'Move the VM **with** its OS disk, network interface, public IP and NSG to **rg-adm-move-dst**. Note how every resource ID changes.', cli: `az resource move --destination-group rg-adm-move-dst --ids ${vmIds(SRC, 'vm-rpt-01').join(' ')}`, check: (s) => !!s.find('vm', 'rg-adm-move-dst', 'vm-rpt-01') && !!s.find('disk', 'rg-adm-move-dst', 'vm-rpt-01_OsDisk_1') && !!s.find('nic', 'rg-adm-move-dst', 'vm-rpt-01VMNic') },
      { text: 'Now a copy must run in **West US 2**. Create a Resource Mover **move collection**, add only the VM and try to **prepare** it straight away.', cli: `az group create -n rg-adm-mover -l eastus && az resource-mover move-collection create -g rg-adm-mover -n mc-rpt --source-region eastus --target-region westus2 --location eastus2 --identity type=SystemAssigned && az resource-mover move-resource add -g rg-adm-mover --move-collection-name mc-rpt -n vm-rpt-01 --source-id ${id('rg-adm-move-dst', 'Microsoft.Compute/virtualMachines', 'vm-rpt-01')} && az resource-mover move-collection prepare -g rg-adm-mover -n mc-rpt`, check: (s) => ev(s, 'adm.mover.blocked', (d) => d.collection === 'mc-rpt' && d.state === 'dependencies') },
      { text: '**Resolve dependencies** so the disk, NIC, public IP, NSG and virtual network join the collection, then list what will move.', cli: 'az resource-mover move-collection resolve-dependency -g rg-adm-mover -n mc-rpt && az resource-mover move-resource list -g rg-adm-mover --move-collection-name mc-rpt -o table', check: (s) => ev(s, 'adm.mover.deps', (d) => d.collection === 'mc-rpt' && d.added > 0) },
      { text: '**Prepare**, **initiate the move** and **commit** it. Then list the resources in the new region.', cli: 'az resource-mover move-collection prepare -g rg-adm-mover -n mc-rpt && az resource-mover move-collection initiate-move -g rg-adm-mover -n mc-rpt && az resource-mover move-collection commit -g rg-adm-mover -n mc-rpt && az resource list -g rg-adm-move-dst-westus2 -o table', check: (s) => ev(s, 'adm.mover.commit', (d) => d.collection === 'mc-rpt' && lc(d.target) === 'westus2') },
    ],
    wrap: 'Moving between resource groups or subscriptions keeps the region and keeps the VM running, but every resource ID changes, so scripts, alerts and role assignments that point at the old ID need updating. A VM has to travel with its disks and network interface; across subscriptions the virtual network goes too. Changing region is a different job: Azure Resource Mover copies the VM and its dependencies, then you commit and delete the source.',
  },

  /* ---------------------------------------------- availability + scale */
  {
    id: 'adm-vm-availability', title: 'Availability sets, zones and an autoscaling scale set', icon: '🧱', level: 'Intermediate', minutes: 12, start: 'shell',
    intro: 'Contoso\'s web tier must survive a rack failure and a datacenter failure, and grow on busy afternoons. Build an availability set, zonal VMs and a Flexible scale set across three zones with CPU autoscale.',
    learn: ['Fault domains and update domains', 'Why a VM can\'t be in a set and a zone at once', 'Zonal VMs', 'Flexible scale sets across zones', 'Autoscale settings and scale-out/in rules'],
    topics: ['vm-availability-and-scale-sets'],
    tasks: [
      { text: 'Create **rg-adm-ha** and an availability set **avset-web** with **2 fault domains** and **5 update domains**.', cli: 'az group create -n rg-adm-ha -l eastus && az vm availability-set create -g rg-adm-ha -n avset-web --platform-fault-domain-count 2 --platform-update-domain-count 5', check: (s) => ev(s, 'adm.avset.create', (d) => d.name === 'avset-web' && d.fd === 2) },
      { text: 'Create **vm-web-01** and **vm-web-02** in the set and see which fault and update domain each one got.', cli: 'az vm create -g rg-adm-ha -n vm-web-01 --image Ubuntu2204 --availability-set avset-web --generate-ssh-keys && az vm create -g rg-adm-ha -n vm-web-02 --image Ubuntu2204 --availability-set avset-web --generate-ssh-keys && az vm availability-set show -g rg-adm-ha -n avset-web -o table', check: (s) => s.events.filter((e) => e.type === 'adm.vm.avset' && e.data.avset === 'avset-web').length >= 2 },
      { text: 'Try to create **vm-web-03** in the set **and** in zone 1.', cli: 'az vm create -g rg-adm-ha -n vm-web-03 --image Ubuntu2204 --availability-set avset-web --zone 1 --generate-ssh-keys', check: (s) => ev(s, 'adm.vm.blocked', (d) => d.reason === 'avset+zone') },
      { text: 'Create two zonal VMs instead: **vm-api-z1** in zone 1 and **vm-api-z2** in zone 2.', cli: 'az vm create -g rg-adm-ha -n vm-api-z1 --image Ubuntu2204 --zone 1 --generate-ssh-keys && az vm create -g rg-adm-ha -n vm-api-z2 --image Ubuntu2204 --zone 2 --generate-ssh-keys', check: (s) => ev(s, 'vm.create', (d) => d.name === 'vm-api-z1' && d.zone === '1') && ev(s, 'vm.create', (d) => d.name === 'vm-api-z2' && d.zone === '2') },
      { text: 'Create a **Flexible** scale set **vmss-web** across zones **1 2 3** with **3** instances, and list where they landed.', cli: 'az vmss create -g rg-adm-ha -n vmss-web --image Ubuntu2204 --orchestration-mode Flexible --zones 1 2 3 --instance-count 3 --vm-sku Standard_B2s --generate-ssh-keys && az vmss list-instances -g rg-adm-ha -n vmss-web -o table', check: (s) => ev(s, 'adm.vmss.create', (d) => d.name === 'vmss-web' && d.zones.length === 3 && d.mode === 'Flexible') },
      { text: 'Add **autoscale**: 3 to 10 instances, **+2** when average CPU is over **70%**, **-1** when it\'s under **30%**.', cli: 'az monitor autoscale create -g rg-adm-ha --resource vmss-web --resource-type Microsoft.Compute/virtualMachineScaleSets --name as-vmss-web --min-count 3 --max-count 10 --count 3 && az monitor autoscale rule create -g rg-adm-ha --autoscale-name as-vmss-web --condition "Percentage CPU > 70 avg 5m" --scale out 2 && az monitor autoscale rule create -g rg-adm-ha --autoscale-name as-vmss-web --condition "Percentage CPU < 30 avg 5m" --scale in 1', check: (s) => ev(s, 'adm.autoscale.rule', (d) => d.dir === 'out' && d.threshold === 70) && ev(s, 'adm.autoscale.rule', (d) => d.dir === 'in') },
    ],
    wrap: 'An availability set spreads VMs across fault domains (racks with their own power and network) and update domains (groups rebooted one at a time), for a 99.95% SLA. Zones spread VMs across separate datacenters for 99.99%. A VM picks one or the other at creation time. A Flexible scale set can spread instances across zones, and autoscale adds instances on a CPU rule and removes them when it\'s quiet. Always pair a scale-out rule with a scale-in rule.',
  },
];
