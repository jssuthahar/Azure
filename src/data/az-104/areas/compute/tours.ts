/**
 * AZ-104 compute portal walkthroughs (education only): template editor,
 * deployment history and export, VM create and resize, disks and encryption
 * at host, moves (resource group and region), zones, availability sets and
 * Flexible scale sets with autoscale.
 */
import { HOME, find, list, wiz, done, proj, summary, resOf, form, note, code, tbl, sel, txt, ro, pane, type Tour, type Menu, type Group } from '../../tour-kit';

const RG = 'rg-contoso-prod';
const VM_MENU: Menu = ['Overview', 'Activity log', 'Access control (IAM)', 'Tags', 'Diagnose and solve problems', ['Connect', ['Connect', 'Bastion']], ['Networking', ['Network settings', 'Load balancing']], ['Settings', ['Disks', 'Extensions + applications', 'Operating system', 'Configuration', 'Properties', 'Locks']], ['Availability + scale', ['Size', 'Availability + scaling']], ['Backup + disaster recovery', ['Backup', 'Disaster recovery']], ['Monitoring', ['Insights', 'Alerts', 'Metrics']], ['Automation', ['Tasks', 'Export template']]];
const RG_MENU: Menu = ['Overview', 'Activity log', 'Access control (IAM)', 'Tags', 'Resource visualizer', 'Events', ['Settings', ['Deployments', 'Deployment stacks', 'Policies', 'Properties', 'Locks']], ['Cost Management', ['Cost analysis', 'Budgets']], ['Monitoring', ['Alerts', 'Metrics', 'Logs']], ['Automation', ['Export template', 'Tasks']]];
const DISK_MENU: Menu = ['Overview', 'Activity log', 'Access control (IAM)', 'Tags', ['Settings', ['Configuration', 'Size + performance', 'Encryption', 'Networking', 'Disk Export', 'Properties', 'Locks']], ['Monitoring', ['Metrics']]];
const VMSS_MENU: Menu = ['Overview', 'Activity log', 'Access control (IAM)', 'Tags', ['Settings', ['Instances', 'Networking', 'Scaling', 'Disks', 'Upgrade policy', 'Health and repair', 'Properties', 'Locks']], ['Monitoring', ['Insights', 'Alerts', 'Metrics']]];

const vmEss = (status: string, size = 'Standard D2s v5 (2 vcpus, 8 GiB memory)'): [string, string][] => [['Resource group', RG], ['Status', status], ['Location', 'East US (Zone 1)'], ['Subscription', 'Contoso Production'], ['Operating system', 'Linux (ubuntu 24.04)'], ['Size', size], ['Public IP address', '20.114.18.7'], ['Virtual network/subnet', 'vnet-prod/app']];
const vm = (status = 'Running', size?: string) => resOf({ title: 'vm-app-01', type: 'Virtual machine', i: 'vm', menu: VM_MENU, crumbs: [RG], cmds: ['Connect', 'Start', 'Restart', 'Stop', 'Hibernate', 'Capture', 'Move', 'Delete', 'Refresh'], ess: vmEss(status, size) });
const rg = resOf({ title: RG, type: 'Resource group', i: 'rg', menu: RG_MENU, cmds: ['+ Create', 'Manage view', 'Delete resource group', 'Refresh', 'Export to CSV', 'Move'], ess: [['Subscription', 'Contoso Production'], ['Deployments', '4 Succeeded'], ['Location', 'East US'], ['Tags', 'env : prod']] });
const disk = resOf({ title: 'vm-app-01-data1', type: 'Disk', i: 'disk', menu: DISK_MENU, crumbs: [RG, 'vm-app-01'], cmds: ['Create snapshot', 'Create VM', 'Delete', 'Refresh'], ess: [['Resource group', RG], ['Disk state', 'Reserved'], ['Managed by', 'vm-app-01'], ['Size', '128 GiB'], ['Storage type', 'Premium SSD LRS'], ['Location', 'East US (Zone 1)']] });
const vmss = resOf({ title: 'vmss-web', type: 'Virtual machine scale set', i: 'vmss', menu: VMSS_MENU, crumbs: [RG], cmds: ['Start', 'Restart', 'Stop', 'Delete', 'Refresh'], ess: [['Resource group', RG], ['Orchestration mode', 'Flexible'], ['Instances', '3 (3 Succeeded)'], ['Availability zone', '1, 2, 3'], ['Size', 'Standard_B2s'], ['Location', 'East US']] });

const ARM_JSON = `{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "storageName": { "type": "string", "minLength": 3, "maxLength": 24 },
    "skuName": {
      "type": "string",
      "defaultValue": "Standard_LRS",
      "allowedValues": [ "Standard_LRS", "Standard_GRS" ]
    }
  },
  "variables": { "tags": { "env": "prod" } },
  "resources": [{
    "type": "Microsoft.Storage/storageAccounts",
    "apiVersion": "2023-05-01",
    "name": "[parameters('storageName')]",
    "location": "[resourceGroup().location]",
    "sku": { "name": "[parameters('skuName')]" },
    "kind": "StorageV2",
    "tags": "[variables('tags')]"
  }],
  "outputs": {
    "blobEndpoint": { "type": "string", "value": "[reference(parameters('storageName')).primaryEndpoints.blob]" }
  }
}`;
const BICEP = `param storageName string
param location string = resourceGroup().location

@allowed([ 'Standard_LRS', 'Standard_ZRS', 'Standard_GRS' ])
param skuName string = 'Standard_ZRS'

resource st 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageName
  location: location
  sku: { name: skuName }
  kind: 'StorageV2'
}

output blobEndpoint string = st.properties.primaryEndpoints.blob`;

const CD_TABS = ['Select a template', 'Basics', 'Review + create'];
const VM_TABS = ['Basics', 'Disks', 'Networking', 'Management', 'Monitoring', 'Advanced', 'Tags', 'Review + create'];
const VMSS_TABS = ['Basics', 'Spot', 'Disks', 'Networking', 'Management', 'Health', 'Advanced', 'Tags', 'Review + create'];
const vmBasics = (avail: Group['f'], size = 'Standard_D2s_v5 - 2 vcpus, 8 GiB memory ($70.08/month)'): Group[] => [
  proj(RG),
  { h: 'Instance details', f: [txt('Virtual machine name *', 'vm-app-01'), sel('Region *', '(US) East US'), ...(avail ?? []), sel('Security type', 'Trusted launch virtual machines'), sel('Image *', 'Ubuntu Server 24.04 LTS - x64 Gen2'), ['VM architecture', '*x64|Arm64', 'r'], ['Run with Azure Spot discount', 'Run with Azure Spot discount', 'c'], sel('Size *', size, 'See all sizes')] },
  { h: 'Administrator account', f: [['Authentication type', '*SSH public key|Password', 'r'], txt('Username *', 'azureuser')] },
  { h: 'Inbound port rules', f: [['Public inbound ports *', '*None|Allow selected ports', 'r']] },
];

export const TOURS: Record<string, Tour> = {
  'adm-vm-template-edit': {
    title: 'Read and modify a template in the portal editor',
    steps: [
      ...find('deploy a custom template', 'Deploy a custom template', 'template', 'Contoso\'s storage template needs a change. Open the **search** bar.', [{ g: 'Services', n: 'Template specs', i: 'template' }, { g: 'Marketplace', n: 'Template deployment (deploy using custom templates)', i: 'marketplace' }]),
      { sc: wiz('Custom deployment', ['Deploy a custom template'], CD_TABS, 0, [{ h: 'Start with a quickstart template or template spec', f: [['Template source', '*Quickstart template|Template spec', 'r'], sel('Quickstart template (disclaimer)', 'Select a template')] }, { h: 'Build your own template in the editor', p: 'Paste or load an ARM template (JSON). Bicep files are compiled to this JSON before deployment.' }, { h: 'Common templates', p: 'Create a Linux virtual machine · Create a Windows virtual machine · Create a web app · Create a SQL database' }]), t: 'f:Template source', say: 'On **Select a template**, choose **Build your own template in the editor**. You can also start from a quickstart or a **template spec** your team shares.' },
      { sc: { s: 'res', title: 'Edit template', type: 'Custom deployment', i: 'template', menu: ['Parameters (2)', 'Variables (1)', 'Resources (1)', 'Outputs (1)'], active: 'Parameters (2)', crumbs: ['Deploy a custom template'], cmds: ['+ Add resource', 'Quickstart template', 'Load file', 'Download'], body: [code(ARM_JSON, 'template.json')] }, t: 'menu:Parameters (2)', say: 'Read it top to bottom. **parameters** are the inputs, **variables** are values worked out once, **resources** is what gets built, **outputs** come back after deployment. `[parameters(\'skuName\')]` is an expression that Resource Manager evaluates.' },
      { sc: { s: 'res', title: 'Edit template', type: 'Custom deployment', i: 'template', menu: ['Parameters (2)', 'Variables (1)', 'Resources (1)', 'Outputs (1)'], active: 'Parameters (2)', crumbs: ['Deploy a custom template'], cmds: ['+ Add resource', 'Quickstart template', 'Load file', 'Download'], body: [code('"skuName": {\n  "type": "string",\n  "defaultValue": "Standard_ZRS",\n  "allowedValues": [ "Standard_LRS", "Standard_ZRS", "Standard_GRS" ]\n}', 'Your change'), note('You added **Standard_ZRS** to **allowedValues** and made it the default. In a Bicep file the same edit is the `@allowed` decorator and `param skuName string = \'Standard_ZRS\'`.', 'info'), form([], 'Save')] }, t: 'btn:Save', say: 'Modify it: add **Standard_ZRS** to `allowedValues` and set it as `defaultValue`. Then select **Save**.' },
      { sc: wiz('Custom deployment', ['Deploy a custom template'], CD_TABS, 1, [proj(RG), { h: 'Instance details', f: [sel('Region *', 'East US'), txt('Storage Name *', 'stcontosologs'), sel('Sku Name', 'Standard_ZRS', 'Allowed: Standard_LRS, Standard_ZRS, Standard_GRS')] }]), t: 'btn:Review + create', say: 'The **Basics** form is built from the template\'s parameters. **Sku Name** is a drop-down because of `allowedValues`; a value outside the list can\'t be picked.' },
      { sc: wiz('Custom deployment', ['Deploy a custom template'], CD_TABS, 2, summary([['Storage Name', 'stcontosologs'], ['Sku Name', 'Standard_ZRS'], ['Deployment mode', 'Incremental']])), t: 'btn:Create', say: 'The portal always deploys in **Incremental** mode. Select **Create**.' },
      done('Microsoft.Template-20261124', 'Done. The deployment is saved in the resource group\'s **Deployments** history with the exact template and parameters used.', RG),
    ],
  },

  'adm-vm-template-export': {
    title: 'Deployment history, export template and convert to Bicep',
    steps: [
      { sc: list('Resource groups', 'rg', ['Subscription', 'Location'], [[RG, 'Contoso Production', 'East US'], ['rg-contoso-dev', 'Contoso Dev/Test', 'East US']]), t: `row:${RG}`, say: 'Open **Resource groups** and select **rg-contoso-prod**.' },
      { sc: rg('Overview', [tbl(['Type', 'Location'], [['stcontosologs', 'Storage account', 'East US'], ['vm-app-01', 'Virtual machine', 'East US']], 'Resources')]), t: 'menu:Deployments', say: 'Under **Settings**, open **Deployments**. Every template deployment into this group is recorded here.' },
      { sc: rg('Deployments', [tbl(['Status', 'Last modified', 'Duration'], [['storage', 'Succeeded', '11/24/2026, 10:12 AM', '21 seconds'], ['Microsoft.Template-20261124', 'Succeeded', '11/24/2026, 9:40 AM', '18 seconds'], ['vm-app-01-20261120', 'Succeeded', '11/20/2026, 4:05 PM', '2 minutes']])], ['Refresh', 'Cancel', 'Redeploy', 'Delete']), t: 'row:storage', say: 'Each row keeps the **template**, **inputs** and **outputs**. Open **storage**. From here you can download its template or **Redeploy** it.' },
      { sc: rg('Export template', [form([{ f: [['Include parameters', '*Include parameters', 'c']] }]), note('Exporting the resource group shows what exists **now**. Names and values are hard-coded unless you include parameters, and some resource types or properties can\'t be exported.', 'warn'), code(ARM_JSON.split('\n').slice(0, 12).join('\n') + '\n  …', 'ARM Template')], ['Download', 'Deploy', 'Visualize template']), t: 'cmd:Download', say: 'Back on the resource group, **Automation › Export template** generates a template from the current resources. The **ARM Template** tab is JSON; the **Bicep** tab shows the same thing converted.' },
      { sc: rg('Export template', [code(BICEP, 'Bicep')], ['Download', 'Deploy', 'Visualize template']), t: 'shell', say: 'The **Bicep** version is shorter and easier to review. To convert a JSON file yourself, use `az bicep decompile` in Cloud Shell.' },
      { sc: rg('Overview'), t: 'shell', shell: ['$ az group export -n rg-contoso-prod > exported.json', '$ az bicep decompile --file exported.json', 'WARNING: Decompilation is a best-effort process, as there is no guaranteed mapping from ARM JSON to Bicep.', '$ az deployment group what-if -g rg-contoso-prod --template-file main.bicep --parameters storageName=stcontosologs', '  ~ Microsoft.Storage/storageAccounts/stcontosologs', '    ~ sku.name: "Standard_LRS" => "Standard_ZRS"', 'Resource changes: 1 to modify.'], say: 'Export, decompile, then preview with **what-if**: `~` means modify, `+` create, `-` delete. Nothing changes until you deploy.' },
      { sc: rg('Overview'), shell: ['$ az deployment group create -g rg-contoso-prod --template-file main.bicep --parameters storageName=stcontosologs', '  "mode": "Incremental", "provisioningState": "Succeeded"', '$ az deployment group create -g rg-contoso-prod --template-file main.bicep --mode Complete', 'Are you sure you want to perform this operation? Resources not in the template will be DELETED.', '# PowerShell: New-AzResourceGroupDeployment -ResourceGroupName rg-contoso-prod -TemplateFile main.bicep -Mode Incremental'], say: 'Deploy with **Incremental** (the default: add and update). **Complete** also deletes anything in the group that the template doesn\'t list, so run what-if first and think twice.' },
    ],
  },

  'adm-vm-create-size': {
    title: 'Create a virtual machine and change its size',
    steps: [
      ...find('virtual machines', 'Virtual machines', 'vm', 'Let\'s build Contoso\'s app server. Open the **search** bar.', [{ g: 'Services', n: 'Virtual machine scale sets', i: 'vmss' }, { g: 'Services', n: 'Availability sets', i: 'avset' }]),
      { sc: list('Virtual machines', 'vm', ['Type', 'Resource group', 'Location', 'Status']), t: 'cmd:+ Create', say: 'Select **+ Create › Azure virtual machine**.' },
      { sc: wiz('Create a virtual machine', ['Virtual machines'], VM_TABS, 0, vmBasics([sel('Availability options', 'Availability zone'), sel('Zone options', 'Self-selected zone'), sel('Availability zone *', 'Zone 1')])), t: 'tab:Disks', say: 'On **Basics** pick the region, availability, **security type**, **image** and **size**. The size name tells you a lot: **D** family (general purpose), **2** vCPUs, **s** (premium storage capable), **v5** (generation).' },
      { sc: wiz('Create a virtual machine', ['Virtual machines'], VM_TABS, 1, [{ h: 'OS disk', f: [sel('OS disk size', 'Image default (30 GiB)'), sel('OS disk type *', 'Premium SSD (locally-redundant storage)'), ['Delete with VM', '*Delete with VM', 'c'], sel('Key management', 'Platform-managed key'), ['Encryption at host', 'Encryption at host', 'c']] }, { h: 'Data disks for vm-app-01', p: 'Create and attach a new disk · Attach an existing disk' }]), t: 'tab:Review + create', say: 'On **Disks** choose the OS disk type. Data disks can be added now or later.' },
      { sc: wiz('Create a virtual machine', ['Virtual machines'], VM_TABS, 7, summary([['Virtual machine name', 'vm-app-01'], ['Availability zone', '1'], ['Size', 'Standard D2s v5 (2 vcpus, 8 GiB memory)'], ['Image', 'Ubuntu Server 24.04 LTS - Gen2'], ['Cost', '$70.08/month (illustrative)']])), t: 'btn:Create', say: 'Review and **Create**. CLI: `az vm create -g rg-contoso-prod -n vm-app-01 --image Ubuntu2404 --size Standard_D2s_v5 --zone 1 --generate-ssh-keys`.' },
      done('CreateVm-vm-app-01', 'The VM, its OS disk, NIC, public IP and NSG were created.', RG),
      { sc: vm('Running')('Size', [note('vm-app-01 is **running**. Sizes not available on its current hardware cluster are greyed out. Resizing a running VM **restarts** it.', 'warn'), tbl(['Family', 'vCPUs', 'RAM (GiB)', 'Cost/month'], [['D4s_v5', 'General purpose', '4', '16', '$140.16'], ['E4s_v5', 'Memory optimized', '4', '32', '$183.96'], ['F4s_v2', 'Compute optimized', '4', '8', '$123.37'], ['B2ms', 'Burstable', '2', '8', '$60.74']]), form([], 'Resize')]), t: 'btn:Resize', say: 'Under **Availability + scale › Size**, pick **D4s_v5** and select **Resize**. The VM restarts. If the size you want is greyed out, **Stop** (deallocate) the VM first. CLI: `az vm resize --size Standard_D4s_v5`.' },
    ],
  },

  'adm-vm-disks-eah': {
    title: 'Add a data disk, change a disk tier and turn on encryption at host',
    steps: [
      { sc: HOME, t: 'shell', shell: ['$ az feature register --name EncryptionAtHost --namespace Microsoft.Compute', '$ az feature show --name EncryptionAtHost --namespace Microsoft.Compute --query properties.state', '"Registered"', '$ az provider register --namespace Microsoft.Compute'], say: 'Encryption at host must be **registered once per subscription**. Do it in Cloud Shell (or under **Subscriptions › Preview features**).' },
      { sc: vm('Stopped (deallocated)')('Overview'), t: 'menu:Disks', say: 'Open **vm-app-01**. It\'s **Stopped (deallocated)**, which encryption at host needs before you can switch it on. Open **Settings › Disks**.' },
      { sc: vm('Stopped (deallocated)')('Disks', [tbl(['Storage type', 'Size (GiB)', 'Max IOPS', 'Encryption', 'Host caching'], [['vm-app-01_OsDisk_1', 'Premium SSD LRS', '30', '120', 'SSE with PMK', 'Read/write']], 'OS disk'), tbl(['LUN', 'Storage type', 'Size (GiB)', 'Host caching'], [], 'Data disks', ['+ Create and attach a new disk', '+ Attach existing disks'])], ['Save', 'Discard', 'Swap OS disk', 'Additional settings', 'Refresh']), t: 'cmd:+ Create and attach a new disk', say: 'The **OS disk** is listed first. Under **Data disks**, select **+ Create and attach a new disk**.' },
      { sc: vm('Stopped (deallocated)')('Disks', [tbl(['LUN', 'Storage type', 'Size (GiB)', 'Max IOPS', 'Host caching'], [['vm-app-01-data1', '0', 'Premium SSD LRS', '128', '500', 'Read-only']], 'Data disks', ['+ Create and attach a new disk', '+ Attach existing disks']), note('**Host caching**: Read-only for read-heavy data, None for write-heavy logs, Read/write only when the app handles caching safely. The temporary disk isn\'t listed: it lives on the host and isn\'t a managed disk.', 'info'), form([], 'Save')], ['Save', 'Discard', 'Swap OS disk', 'Additional settings', 'Refresh']), t: 'btn:Save', say: 'Name it, keep **Premium SSD**, set **128 GiB** and **Read-only** caching, then **Save**. Data disks can also be attached while the VM runs.' },
      { sc: vm('Stopped (deallocated)')('Disks'), t: 'btn:Save', say: 'Select **Additional settings** and set **Encryption at host** to **Yes**. It encrypts the **temp disk** and the **OS and data disk caches** on the host, and the data flows to Storage already encrypted.', pane: pane('Additional settings', [{ h: 'Encryption settings', f: [['Encryption at host', '*Yes|No', 'r']] }, { h: 'Disk compatibility', f: [['Enable Ultra disk compatibility', 'Yes|*No', 'r']] }], ['Save', 'Cancel'], [note('Available only when the VM is deallocated and the EncryptionAtHost feature is registered. It can\'t be combined with Azure Disk Encryption on the same VM.', 'warn')]) },
      { sc: disk('Size + performance', [tbl(['Disk tier', 'Size', 'Max IOPS', 'Max throughput'], [['Standard SSD LRS', 'E15', '256 GiB', '500', '60 MB/s'], ['Premium SSD LRS', 'P15', '256 GiB', '1100', '125 MB/s'], ['Standard HDD LRS', 'S15', '256 GiB', '500', '60 MB/s']]), form([{ f: [sel('Disk SKU', 'Standard SSD (locally-redundant storage)'), txt('Custom disk size (GiB)', '256')] }], 'Save')]), t: 'btn:Save', say: 'Open the data disk and **Size + performance**. Switch to **Standard SSD** and grow it to **256 GiB**. Changing the type needs the VM deallocated (or the disk detached), and you can grow a disk but never shrink it.' },
      { sc: vm('Running', 'Standard D2s v5 (2 vcpus, 8 GiB memory)')('Overview', [note('🔒 **Encryption at host: Enabled** · Managed disks: server-side encryption with platform-managed keys', 'ok')]), say: 'Start the VM. CLI for the whole job: `az vm deallocate`, `az vm update --set securityProfile.encryptionAtHost=true`, `az disk update --sku StandardSSD_LRS --size-gb 256`, `az vm start`.', toast: '✅ **Updated virtual machine vm-app-01**' },
    ],
  },

  'adm-vm-move': {
    title: 'Move a VM to another resource group, then to another region',
    steps: [
      { sc: rg('Overview', [tbl(['Type', 'Location'], [['vm-rpt-01', 'Virtual machine', 'East US'], ['vm-rpt-01_OsDisk_1', 'Disk', 'East US'], ['vm-rpt-01VMNic', 'Network interface', 'East US'], ['vm-rpt-01PublicIP', 'Public IP address', 'East US'], ['vm-rpt-01NSG', 'Network security group', 'East US']], 'Resources')]), t: 'cmd:Move', say: 'In **rg-contoso-prod**, select the VM **and** its disk, NIC, public IP and NSG, then select **Move**.' },
      { sc: rg('Overview'), t: 'btn:Move to another resource group', say: 'Pick where it goes. A resource group or subscription move keeps the region; a region move is a different tool.', pane: pane('Move', [], ['Move to another resource group', 'Move to another subscription', 'Move to another region']) },
      { sc: wiz('Move resources', [RG], ['Source + target', 'Resources to move', 'Review'], 0, [{ h: 'Source', f: [ro('Subscription', 'Contoso Production'), ro('Resource group', RG)] }, { h: 'Target', f: [sel('Subscription', 'Contoso Production'), sel('Resource group *', 'rg-finance', 'Create new')] }]), t: 'btn:Next', say: 'Choose the **target resource group**, here **rg-finance**.' },
      { sc: wiz('Move resources', [RG], ['Source + target', 'Resources to move', 'Review'], 1, [{ h: 'Validation', p: 'Azure checks that dependent resources move together and that the target supports every resource type.', f: [ro('vm-rpt-01', '✔ Succeeded'), ro('vm-rpt-01_OsDisk_1', '✔ Succeeded'), ro('vm-rpt-01VMNic', '✔ Succeeded'), ro('vm-rpt-01PublicIP', '✔ Succeeded'), ro('vm-rpt-01NSG', '✔ Succeeded')] }]), t: 'btn:Next', say: 'On **Resources to move**, validation runs. Leave out the disk or NIC and it fails: a VM moves with its dependent resources. Across subscriptions the virtual network has to come too.' },
      { sc: wiz('Move resources', [RG], ['Source + target', 'Resources to move', 'Review'], 2, [{ f: [['Confirm', '*I understand that tools and scripts associated with moved resources will not work until I update them to use new resource IDs', 'c']] }, ...summary([['Resources', '5'], ['Target', 'rg-finance'], ['Region after move', 'East US (unchanged)']])]), t: 'btn:Create', say: 'Tick the box: every **resource ID changes** because it contains the resource group name. Both groups are locked for writes while the move runs, but the VM keeps running. CLI: `az resource move --destination-group rg-finance --ids …`.' },
      { sc: vm('Running')('Overview'), t: 'btn:Move to another region', say: 'Now a copy has to run in **West US 2**. On the VM, select **Move › Move to another region**. That opens **Azure Resource Mover**.', pane: pane('Move', [], ['Move to another resource group', 'Move to another subscription', 'Move to another region']) },
      { sc: { s: 'res', title: 'Azure Resource Mover', type: 'Across regions', i: 'migrate', menu: ['Overview', 'Across regions', 'Across zones'], active: 'Across regions', cmds: ['Add resources', 'Validate dependencies', 'Prepare', 'Initiate move', 'Commit move', 'Discard move', 'Delete source'], body: [tbl(['Source region', 'Destination region', 'Issues', 'Status'], [['vm-rpt-01', 'East US', 'West US 2', '1 dependency', 'Prepare pending'], ['rg-finance', 'East US', 'West US 2', '', 'Prepare pending']])] }, t: 'cmd:Validate dependencies', say: 'Select **Validate dependencies**. Resource Mover finds the disk, NIC and virtual network the VM needs and offers to add them.' },
      { sc: { s: 'res', title: 'Azure Resource Mover', type: 'Across regions', i: 'migrate', menu: ['Overview', 'Across regions', 'Across zones'], active: 'Across regions', cmds: ['Add resources', 'Validate dependencies', 'Prepare', 'Initiate move', 'Commit move', 'Discard move', 'Delete source'], body: [tbl(['Source region', 'Destination region', 'Status'], [['vm-rpt-01', 'East US', 'West US 2', 'Commit move pending'], ['vm-rpt-01VMNic', 'East US', 'West US 2', 'Commit move pending'], ['vnet-prod', 'East US', 'West US 2', 'Commit move pending']]), note('**Prepare** started replicating the disks, **Initiate move** created the copies in West US 2. Test them now: **Commit move** keeps them, **Discard move** throws them away.', 'info')] }, t: 'cmd:Commit move', say: 'Then **Prepare** and **Initiate move**. Test the copy, then **Commit move**.' },
      { sc: { s: 'res', title: 'Azure Resource Mover', type: 'Across regions', i: 'migrate', menu: ['Overview', 'Across regions', 'Across zones'], active: 'Across regions', cmds: ['Delete source'], body: [tbl(['Destination region', 'Status'], [['vm-rpt-01', 'West US 2', 'Delete source pending'], ['vm-rpt-01VMNic', 'West US 2', 'Delete source pending']]), note('The source VM in East US still exists and still costs money. Select **Delete source** once you\'re happy with the target.', 'warn')] }, t: 'cmd:Delete source', say: 'Finally **Delete source**. A region move is really copy, test, commit and clean up.' },
    ],
  },

  'adm-vm-availability-vmss': {
    title: 'Zones, availability sets and a Flexible scale set with autoscale',
    steps: [
      { sc: wiz('Create a virtual machine', ['Virtual machines'], VM_TABS, 0, vmBasics([sel('Availability options', 'Availability zone'), sel('Zone options', 'Self-selected zone'), sel('Availability zone *', 'Zones 1, 2, 3', 'You can now create multiple VMs, one per selected zone')])), t: 'f:Availability options', say: 'In **Create a virtual machine › Basics**, **Availability options** decides how the VM survives failures. **Availability zone** with zones **1, 2, 3** creates three VMs, one per datacenter: 99.99% SLA.' },
      { sc: wiz('Create a virtual machine', ['Virtual machines'], VM_TABS, 0, vmBasics([sel('Availability options', 'Availability set'), sel('Availability set *', 'avset-web', 'Create new · Fault domains: 2 · Update domains: 5')])), t: 'tab:Review + create', say: 'Pick **Availability set** instead and the VM is spread across **fault domains** (racks) and **update domains** (maintenance groups) in one datacenter: 99.95% with two or more VMs. You choose this at creation; an existing VM can\'t join a set later.' },
      { sc: list('Virtual machine scale sets', 'vmss', ['Resource group', 'Location', 'Orchestration mode']), t: 'cmd:+ Create', say: 'For identical VMs that grow and shrink, open **Virtual machine scale sets** and select **+ Create**.' },
      { sc: wiz('Create a Virtual Machine Scale Set', ['Virtual machine scale sets'], VMSS_TABS, 0, [proj(RG), { h: 'Scale set details', f: [txt('Virtual machine scale set name *', 'vmss-web'), sel('Region *', '(US) East US'), sel('Availability zone', 'Zones 1, 2, 3')] }, { h: 'Orchestration', f: [['Orchestration mode *', '*Flexible|Uniform', 'r'], sel('Security type', 'Trusted launch virtual machines')] }, { h: 'Scaling', f: [['Scaling mode', 'Manually update the capacity|*Autoscaling|No scaling profile', 'r'], ro('Scaling configuration', '**Configure**: min 3, max 10, default 3')] }, { h: 'Instance details', f: [sel('Image *', 'Ubuntu Server 24.04 LTS - x64 Gen2'), sel('Size *', 'Standard_B2s - 2 vcpus, 4 GiB memory')] }]), t: 'f:Scaling configuration', say: '**Flexible** orchestration is the recommended mode: instances spread across **zones 1, 2, 3** and you can mix sizes. Set **Scaling mode** to **Autoscaling** and open the configuration.' },
      { sc: wiz('Create a Virtual Machine Scale Set', ['Virtual machine scale sets'], VMSS_TABS, 0, []), t: 'btn:Save', say: 'The default condition: keep **3 to 10** instances, add one when average CPU is above the scale-out threshold, remove one when it\'s below the scale-in threshold. The **scale-in policy** picks which instance goes first.', pane: pane('Scaling configuration', [{ h: 'Default condition', f: [txt('Minimum', '3'), txt('Maximum', '10'), txt('Default instance count', '3')] }, { h: 'Scale out', f: [txt('CPU threshold (%)', '70'), txt('Duration in minutes', '5'), txt('Number of instances to increase by', '2')] }, { h: 'Scale in', f: [txt('CPU threshold (%)', '30'), txt('Number of instances to decrease by', '1')] }, { h: 'Scale-in policy', f: [sel('Scale-in policy', 'Default - Balance across availability zones and fault domains, then delete VM with highest instance ID')] }], ['Save', 'Cancel']) },
      done('CreateVmss-vmss-web', 'The scale set is created with three instances, one per zone.', RG),
      { sc: vmss('Instances', [tbl(['Computer name', 'Status', 'Availability zone', 'Health state'], [['vmss-web_1a2b3c4d', 'vmss-web00000', 'Running', '1', 'Healthy'], ['vmss-web_5e6f7a8b', 'vmss-web00001', 'Running', '2', 'Healthy'], ['vmss-web_9c0d1e2f', 'vmss-web00002', 'Running', '3', 'Healthy']])], ['Start', 'Restart', 'Stop', 'Delete', 'Refresh']), t: 'menu:Scaling', say: 'On **Instances**, one VM landed in each zone. Now open **Scaling**.' },
      { sc: vmss('Scaling', [form([{ f: [['Choose how to scale your resource', 'Manual scale|*Custom autoscale', 'r'], ro('Scale mode', 'Scale based on a metric'), ro('Rules', 'Scale out: Percentage CPU > 70 (avg 5 min) → increase count by 2 · Scale in: Percentage CPU < 30 (avg 5 min) → decrease count by 1'), ro('Instance limits', 'Minimum 3 · Maximum 10 · Default 3')] }], 'Save'), { b: 'chart', title: 'Percentage CPU (average) · vmss-web', data: [32, 35, 41, 58, 76, 81, 74, 52, 38, 29], unit: 'Last 4 hours, %', line: 70, lineLabel: 'Scale out at 70%' }]), t: 'btn:Save', say: '**Custom autoscale** holds the rules (Azure Monitor autoscale). When CPU crossed 70% the set grew by 2, then shrank as it cooled. CLI: `az monitor autoscale create` and `az monitor autoscale rule create`.' },
    ],
  },
};
