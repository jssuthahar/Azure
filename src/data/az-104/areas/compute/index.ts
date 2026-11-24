/**
 * AZ-104 "compute" area (first six topics of the compute module): ARM and
 * Bicep templates, VM creation and sizes, disks and encryption at host, moves,
 * availability sets, zones and scale sets. The merge files in
 * src/data/az-104/*.ts import these names.
 */
import type { LessonSims } from '../../../az-900/lesson-sims';
import type { Sim3D } from '../../../az-900/sims3d';
import type { Tour } from '../../tour-kit';
import type { ProblemSolution } from '../../../az-900/problem-solution';
import type { FormatItem } from '../../../az-900/exam-items';
import type { SortSet, Riddle } from '../../../az-900/games';
import type { Comparison } from '../../../az-900/compare';
import type { Service } from '../../../az-900/services';
import { TOURS as COMPUTE_TOURS } from './tours';

/** Lesson slug → 3D step and portal walkthrough. */
export const SIMS: Record<string, LessonSims> = {
  'interpret-and-modify-arm-and-bicep': { d3: { mode: 'admincompute', start: 0, intro: 'Deploy the Bicep file, then try a SKU the template doesn\'t allow.' }, tour: { id: 'adm-vm-template-edit', intro: 'Read a template in the editor, change a parameter and deploy it.' } },
  'deploy-and-export-templates': { d3: { mode: 'admincompute', start: 1, intro: 'Preview with what-if, then compare Incremental and Complete.' }, tour: { id: 'adm-vm-template-export', intro: 'Open deployment history, export the group and convert it to Bicep.' } },
  'create-and-size-virtual-machines': { d3: { mode: 'admincompute', start: 3, intro: 'Resize within the cluster, then try a size that needs a deallocation.' }, tour: { id: 'adm-vm-create-size', intro: 'Create a VM, then resize it from the Size blade.' } },
  'vm-disks-and-encryption-at-host': { d3: { mode: 'admincompute', start: 4, intro: 'Attach a data disk, lose the temp disk, then encrypt at host.' }, tour: { id: 'adm-vm-disks-eah', intro: 'Attach a disk, turn on encryption at host and change a disk tier.' } },
  'move-virtual-machines': { d3: { mode: 'admincompute', start: 5, intro: 'Move the VM alone, then with its disk and NIC.' }, tour: { id: 'adm-vm-move', intro: 'Move a VM to another resource group, then to another region.' } },
  'vm-availability-and-scale-sets': { d3: { mode: 'admincompute', start: 7, intro: 'Fail a rack, then fail a whole zone.' }, tour: { id: 'adm-vm-availability-vmss', intro: 'Pick zones or a set, then build a scale set with autoscale.' } },
};

/** Narration for the 'admincompute' scene. Step order and action ids match src/lib/dc3d/admin/admincompute.ts. */
export const SCENE: Sim3D = {
  title: 'AZ-104 compute: templates, VMs, disks, moves and availability',
  steps: [
    { title: 'A Bicep file becomes resources', text: 'A template has four parts: **parameters** (inputs such as `storageName` and `skuName`), **variables** (values worked out once), **resources** (what gets built) and **outputs** (values handed back). The CLI compiles **Bicep** to **ARM JSON** and **Azure Resource Manager** validates it, then builds it.', actions: [{ id: 'deploy', label: '🚀 …we deploy storage.bicep?', kind: 'ok' }, { id: 'badparam', label: '⛔ …skuName is Premium_LRS, which isn\'t @allowed?', kind: 'danger' }] },
    { title: 'what-if, Incremental and Complete', text: '**what-if** previews the changes (`+` create, `~` modify, `-` delete) without touching anything. **Incremental** mode, the default, adds and updates. **Complete** mode also **deletes** whatever in the resource group isn\'t in the template.', actions: [{ id: 'whatif', label: '🔍 …we run what-if first?', kind: 'plain' }, { id: 'incremental', label: '➕ …we deploy in Incremental mode?', kind: 'ok' }, { id: 'complete', label: '🗑️ …we deploy in Complete mode?', kind: 'danger' }] },
    { title: 'Export and decompile', text: '**Export template** (portal, or `az group export`) writes what exists now as ARM JSON. `az bicep decompile` turns JSON into Bicep. Both are starting points: names and values are hard-coded and some properties are missing.', actions: [{ id: 'export', label: '📤 …we export the resource group?', kind: 'ok' }, { id: 'decompile', label: '🔁 …we decompile the JSON to Bicep?', kind: 'ok' }] },
    { title: 'A VM, its host and its size', text: 'A VM runs on a **physical host** in a hardware cluster. Its **size** (Standard_D2s_v5: D family, 2 vCPUs, premium storage, v5) sets CPU, memory, disk count and price. A resize **restarts** the VM; a size that isn\'t on the current cluster needs the VM **deallocated** first.', actions: [{ id: 'resize', label: '🔄 …we resize D2s_v5 to D4s_v5?', kind: 'ok' }, { id: 'family', label: '⛔ …we pick E4s_v5 while it runs?', kind: 'danger' }, { id: 'dealloc', label: '⏹️ …we deallocate, then resize?', kind: 'ok' }] },
    { title: 'Disks and encryption at host', text: '**OS** and **data disks** are managed disks in Azure Storage, encrypted at rest by default. The **temp disk** and the **disk caches** live on the host. **Encryption at host** encrypts those too, end to end; it needs the feature registered and the VM deallocated.', actions: [{ id: 'attach', label: '💽 …we attach a data disk?', kind: 'ok' }, { id: 'redeploy', label: '⚠️ …the VM moves to another host?', kind: 'danger' }, { id: 'eah', label: '🛡️ …we turn on encryption at host?', kind: 'ok' }] },
    { title: 'Move to another resource group or subscription', text: 'A move keeps the **region** and the VM keeps **running**, but every **resource ID changes**. The VM must travel with its **disks** and **network interface**; across subscriptions the **virtual network** goes too.', actions: [{ id: 'movealone', label: '⛔ …we move only the VM?', kind: 'danger' }, { id: 'movedeps', label: '📦 …we move it with its disk and NIC?', kind: 'ok' }] },
    { title: 'Move to another region', text: '**Azure Resource Mover** copies resources to another region: add them, **validate dependencies**, **prepare**, **initiate move**, then **commit** (or discard) and **delete the source**.', actions: [{ id: 'mover', label: '🚚 …we move vm-rpt-01 to West US 2?', kind: 'ok' }] },
    { title: 'Availability sets vs zones', text: 'An **availability set** spreads VMs over **fault domains** (racks with their own power and network) and **update domains** in one datacenter: 99.95%. **Availability zones** spread VMs over separate datacenters: 99.99%. A VM uses one or the other, chosen at creation.', actions: [{ id: 'rack', label: '🔥 …a rack loses power?', kind: 'danger' }, { id: 'zone', label: '🏢 …zone 1 goes down?', kind: 'danger' }] },
    { title: 'Scale sets grow on a rule', text: 'A **Virtual Machine Scale Set** (Flexible orchestration recommended) runs identical VMs across zones. **Autoscale** rules add instances when average CPU is high and remove them when it\'s low, always between the **minimum** and **maximum**.', actions: [{ id: 'spike', label: '📈 …CPU stays above 70% for 5 minutes?', kind: 'ok' }, { id: 'quiet', label: '🌙 …it goes quiet?', kind: 'plain' }] },
  ],
};

export const TOURS: Record<string, Tour> = COMPUTE_TOURS;

const ps = (problem: string, solution: string, tool: string, pairs: [string, string, string][]): ProblemSolution => ({ problem, solution, tool, pairs: pairs.map(([icon, pain, fix]) => ({ icon, pain, fix })) });
export const PROBLEMS: Record<string, ProblemSolution> = {
  'interpret-and-modify-arm-and-bicep': ps('Someone deployed a storage account with the wrong SKU by hand.', 'Describe it in a template with parameters and an allowed list.', 'ARM templates and Bicep', [['✍️', 'Hand-built resources drift', 'One template, same result every time'], ['🎲', 'Any value goes', '@allowed and other decorators'], ['📜', 'Unreadable JSON', 'Bicep says the same in fewer lines']]),
  'deploy-and-export-templates': ps('A Complete-mode deployment deleted a database nobody had put in the template.', 'Preview with what-if and know what each deployment mode does.', 'Deployment modes, what-if and export', [['💥', 'Surprise deletions', 'what-if before Complete mode'], ['🤷', 'No template for old resources', 'Export template'], ['🔁', 'JSON is hard to maintain', 'az bicep decompile']]),
  'create-and-size-virtual-machines': ps('The reporting VM runs out of memory every month-end.', 'Resize it to a memory-optimised size in a short maintenance window.', 'VM sizes and resizing', [['🐢', 'Undersized VM', 'Resize to the E family'], ['🔘', 'Size greyed out', 'Deallocate, then resize'], ['💸', 'Oversized VM', 'Resize down and save']]),
  'vm-disks-and-encryption-at-host': ps('Auditors ask whether the temp disk and disk caches are encrypted.', 'Turn on encryption at host so data is encrypted from the host to Storage.', 'Managed disks and encryption at host', [['🗂️', 'App data on the OS disk', 'A separate data disk'], ['🔓', 'Temp disk and cache not covered', 'Encryption at host'], ['💸', 'Premium disk for cold data', 'Change to Standard SSD']]),
  'move-virtual-machines': ps('The VM was built in the wrong resource group, and now it must also run in another region.', 'Move it with its dependencies, then copy it across regions with Resource Mover.', 'Resource moves and Azure Resource Mover', [['📦', 'Wrong resource group', 'az resource move'], ['🔗', 'Move fails validation', 'Include disks and NIC'], ['🌎', 'Needs another region', 'Azure Resource Mover']]),
  'vm-availability-and-scale-sets': ps('One rack failure took the whole web tier offline.', 'Spread VMs across fault domains or zones and let a scale set add instances on demand.', 'Availability sets, zones and scale sets', [['🔥', 'All VMs in one rack', 'Fault domains'], ['🏢', 'Datacenter outage', 'Availability zones'], ['📈', 'Busy afternoons', 'Autoscale rules']]),
};

export const ITEMS: FormatItem[] = [
  { kind: 'yesno', id: 'adm-x3-vm-yn-modes', domain: 3, objective: '3.1.4', statements: [
    { text: 'If you do not specify a mode, an Azure Resource Manager deployment to a resource group runs in Incremental mode.', answer: true },
    { text: 'A deployment in Complete mode deletes resources in the resource group that are not defined in the template.', answer: true },
    { text: 'Running az deployment group what-if creates the resources so that you can review them before you commit.', answer: false },
  ], explanation: '**Incremental** is the default. **Complete** removes resources that the template does not list. **what-if** only previews changes; it does not create or delete anything.' },
  { kind: 'dropdown', id: 'adm-x3-vm-dd-convert', domain: 3, objective: '3.1.5', question: 'Complete the commands.', parts: [
    'To save the current state of resource group RG1 as an ARM template, run az group ',
    { options: ['export', 'show', 'deployment create', 'lock'], answer: 0 },
    ' --name RG1. To convert the resulting template.json file to a Bicep file, run az bicep ',
    { options: ['build', 'decompile', 'publish', 'format'], answer: 1 },
    ' --file template.json.',
  ], explanation: '`az group export` writes the resource group as an ARM template. `az bicep decompile` converts ARM JSON to Bicep; `az bicep build` goes the other way.' },
  { kind: 'order', id: 'adm-x3-vm-order-eah', domain: 3, objective: '3.2.2', question: 'You need to enable encryption at host for an existing running virtual machine named VM1. The feature has never been used in the subscription. Which four actions should you perform in sequence?', actions: ['Register the EncryptionAtHost feature for the Microsoft.Compute resource provider', 'Stop (deallocate) VM1', 'Set securityProfile.encryptionAtHost to true on VM1', 'Start VM1', 'Enable Azure Disk Encryption on VM1'], answer: [0, 1, 2, 3], explanation: 'Register the feature once per subscription, deallocate the VM, enable **encryption at host**, then start it. Azure Disk Encryption is a different feature and cannot be combined with encryption at host on the same VM.' },
  { kind: 'match', id: 'adm-x3-vm-match-move', domain: 3, objective: '3.2.3', question: 'Match each requirement to the correct tool.', itemsLabel: 'Tools', items: ['az resource move', 'Azure Resource Mover', 'Azure Site Recovery failover only', 'Export template and redeploy'], targets: [
    { text: 'Move VM1 and its disk and NIC from RG1 to RG2 in the same region', answer: 0 },
    { text: 'Move VM1 and its dependencies from East US to West Europe with a prepare and commit process', answer: 1 },
    { text: 'Move VM1 to a resource group in another subscription in the same Microsoft Entra tenant', answer: 0 },
  ], explanation: '**az resource move** (or the portal Move command) handles resource group and subscription moves; the region does not change. **Azure Resource Mover** handles moves to another region.' },
  { kind: 'match', id: 'adm-x3-vm-match-avail', domain: 3, objective: '3.2.6', question: 'Match each requirement to the deployment option that meets it with the least administrative effort.', itemsLabel: 'Options', items: ['Availability set', 'Availability zones', 'Virtual Machine Scale Set with autoscale', 'Single VM with Premium SSD disks'], targets: [
    { text: 'Two VMs must survive the failure of an entire datacenter in the region', answer: 1 },
    { text: 'Two VMs must not share a rack or be rebooted together during planned maintenance, in a region without zones', answer: 0 },
    { text: 'The number of identical web servers must increase when average CPU exceeds 70 percent', answer: 2 },
  ], explanation: '**Zones** protect against a datacenter failure. An **availability set** spreads VMs across fault and update domains in one datacenter. A **scale set** with **autoscale** adds instances on a metric rule.' },
  { kind: 'yesno', id: 'adm-x3-vm-yn-sizes', domain: 3, objective: '3.2.4', statements: [
    { text: 'Resizing a running virtual machine restarts it.', answer: true },
    { text: 'If a size is not available on the hardware cluster that hosts a VM, you can select it after you deallocate the VM.', answer: true },
    { text: 'You can reduce the size of a managed disk from 256 GiB to 128 GiB.', answer: false },
  ], explanation: 'A resize restarts the VM. Deallocating releases the VM from its cluster so every size in the region is available. Managed disks can only grow.' },
];

export const SORT: SortSet[] = [
  {
    id: 'adm-vm-running-or-deallocated', title: 'Running or deallocated?', icon: '🖥️', topic: 'vm-disks-and-encryption-at-host',
    intro: 'Some VM changes work while it runs. Others need it stopped (deallocated) first. Sort them.',
    buckets: ['Works while the VM runs', 'Needs the VM deallocated'],
    items: [
      { text: 'Attach a new data disk', bucket: 0, why: 'Data disks can be hot-attached to a running VM.' },
      { text: 'Detach a data disk', bucket: 0, why: 'You can detach a data disk while the VM runs (unmount it in the OS first).' },
      { text: 'Grow a data disk', bucket: 0, why: 'Data disks can be expanded without downtime, then you extend the partition.' },
      { text: 'Move the VM to another resource group', bucket: 0, why: 'Resource group moves don\'t stop the VM. Only the resource ID changes.' },
      { text: 'Turn on encryption at host on an existing VM', bucket: 1, why: 'The VM must be deallocated to change encryption at host.' },
      { text: 'Change an attached disk from Premium SSD to Standard SSD', bucket: 1, why: 'Changing the disk type needs the VM deallocated or the disk detached.' },
      { text: 'Resize to a size that isn\'t on the current hardware cluster', bucket: 1, why: 'Deallocate so the VM can start on a cluster that has that size.' },
    ],
  },
];

export const RIDDLES: Riddle[] = [
  { answer: 'Bicep', topic: 'interpret-and-modify-arm-and-bicep', clues: ['I describe Azure resources in a file.', 'I compile to ARM JSON before Resource Manager sees me.', 'My params can have @allowed and @minLength decorators.'] },
  { answer: 'what-if', topic: 'deploy-and-export-templates', clues: ['I run before a deployment.', 'I show + for create, ~ for modify and - for delete.', 'I change nothing at all.'] },
  { answer: 'Encryption at host', topic: 'vm-disks-and-encryption-at-host', clues: ['I care about the temp disk and the disk caches.', 'You must register me once per subscription.', 'I can only be switched on while the VM is deallocated.'] },
  { answer: 'Azure Resource Mover', topic: 'move-virtual-machines', clues: ['I move things between regions.', 'I validate dependencies, prepare and initiate.', 'Nothing is final until you commit me.'] },
  { answer: 'Availability set', topic: 'vm-availability-and-scale-sets', clues: ['I spread your VMs across racks.', 'Fault domains and update domains are my parts.', 'You can only join me when a VM is created.'] },
  { answer: 'Virtual Machine Scale Sets', topic: 'vm-availability-and-scale-sets', clues: ['I run identical VMs.', 'Autoscale rules make me grow and shrink.', 'Flexible orchestration is my recommended mode.'] },
];

export const COMPARE: Comparison[] = [
  {
    slug: 'arm-json-vs-bicep-templates',
    title: 'ARM JSON Templates vs Bicep Files',
    seoTitle: 'ARM JSON Templates vs Bicep Files for Admins | AZ-104',
    description: 'ARM JSON templates and Bicep files compared for AZ-104: syntax, parameters, deployment commands, export and decompile, and when to use each one.',
    answer: '**Bicep** and **ARM JSON** deploy exactly the same resources: the CLI compiles Bicep to ARM JSON before Resource Manager runs it. Bicep is shorter and easier to read and modify. ARM JSON is what the portal exports and what older automation uses. Convert JSON to Bicep with `az bicep decompile` and Bicep to JSON with `az bicep build`.',
    cols: ['ARM JSON template', 'Bicep file'],
    rows: [
      ['Syntax', 'JSON with [expressions] in strings', 'Its own concise language'],
      ['Parameters', '"parameters": { "x": { "type": "string" } }', 'param x string'],
      ['Allowed values', '"allowedValues": [...]', '@allowed([...]) decorator'],
      ['References', '[reference(...)], dependsOn often needed', 'symbolic names, dependencies inferred'],
      ['Deploy', 'az deployment group create --template-file azuredeploy.json', 'Same command with main.bicep'],
      ['Convert', 'az bicep decompile → .bicep', 'az bicep build → .json'],
    ],
    pick: [['ARM JSON', 'you were handed an exported or legacy template and only need a small change'], ['Bicep', 'you write or maintain templates yourself and want readable, reviewable files']],
    examTip: 'Both are read on the exam. Find the **parameters**, check **allowedValues** or **@allowed**, and remember the default deployment mode is **Incremental**. "Convert an ARM template to Bicep" = **az bicep decompile**.',
    sim: { mode: 'admincompute', start: 0, tour: 'adm-vm-template-edit', intro: 'Deploy a Bicep file, then edit an ARM template in the portal.' },
    lessons: ['interpret-and-modify-arm-and-bicep', 'deploy-and-export-templates'],
    faq: [['Does Bicep need anything installed?', 'Azure CLI installs the Bicep CLI for you the first time you deploy a .bicep file. Azure PowerShell needs the Bicep CLI installed separately.'], ['Can the portal deploy a Bicep file directly?', 'The custom deployment editor takes ARM JSON. Build the Bicep file to JSON first, or deploy it with the CLI or PowerShell.']],
  },
  {
    slug: 'availability-set-vs-zones-vs-flexible-scale-set',
    title: 'Availability Set vs Availability Zones vs Flexible Scale Set',
    seoTitle: 'Availability Set vs Zones vs Flexible Scale Set | AZ-104',
    description: 'How availability sets, availability zones and Flexible VM scale sets protect Azure VMs: failure scope, SLA, autoscale and which one to pick for AZ-104.',
    answer: 'An **availability set** spreads VMs across **fault domains** and **update domains** in one datacenter (99.95% SLA with two or more VMs). **Availability zones** place VMs in separate datacenters in a region (99.99%). A **Flexible scale set** runs identical VMs across zones or fault domains and adds **autoscale**.',
    cols: ['Availability set', 'Availability zones', 'Flexible scale set'],
    rows: [
      ['Protects against', 'Rack and maintenance failures', 'A whole datacenter failing', 'Both, depending on how you spread it'],
      ['VM SLA', '99.95% (2+ VMs)', '99.99% (2+ VMs in 2+ zones)', 'Same as zones or set it uses'],
      ['Scaling', 'Manual', 'Manual', 'Autoscale rules on metrics or schedules'],
      ['When chosen', 'At VM creation only', 'At VM creation only', 'At creation; instances added any time'],
      ['Price feel', 'Free; pay for the VMs', 'Free; small cross-zone data charge', 'Free; pay per instance, e.g. 3 × B2s ≈ $105/month'],
    ],
    pick: [['Availability set', 'the region has no zones or the app needs very low latency inside one datacenter'], ['Availability zones', 'a few named VMs must survive a datacenter outage'], ['Flexible scale set', 'you run many identical VMs that should grow and shrink with load']],
    examTip: '"Survive a datacenter failure" = **zones**. "Survive a rack failure or host maintenance" = **availability set**. "Add VMs automatically when CPU is high" = **scale set + autoscale**. A VM can\'t be in a set and a zone at the same time.',
    sim: { mode: 'admincompute', start: 7, tour: 'adm-vm-availability-vmss', intro: 'Fail a rack, fail a zone, then let a scale set grow.' },
    lessons: ['vm-availability-and-scale-sets', 'create-and-size-virtual-machines'],
    faq: [['Can I add an existing VM to an availability set?', 'No. The availability set is set when the VM is created. Recreate the VM from its disks with the set selected.'], ['How many fault domains can a set have?', 'Up to 3, depending on the region, and up to 20 update domains (5 by default).']],
  },
];

export const SERVICES: Service[] = [
  { slug: 'bicep-and-arm-templates', name: 'ARM templates and Bicep', cat: 'Management & Governance', icon: '🧩', model: 'Infrastructure as code', what: 'Declarative files that describe Azure resources. Azure Resource Manager deploys them the same way every time, with what-if previews, Incremental or Complete modes and a deployment history per resource group.', use: ['Repeatable environments (dev, test, prod)', 'Reviewing infrastructure changes in pull requests', 'Rebuilding resources after an incident'], avoid: ['One-off experiments you will delete in an hour'], feel: 1, price: 'Free. You pay only for the resources the template creates.', sim: { mode: 'admincompute', start: 0, tour: 'adm-vm-template-edit', intro: 'Deploy a Bicep file and break its allowed list.' }, similar: ['vms-for-administrators'], aws: 'AWS CloudFormation', lesson: 'interpret-and-modify-arm-and-bicep', compare: 'arm-json-vs-bicep-templates' },
  { slug: 'vms-for-administrators', name: 'Azure Virtual Machines (admin view)', cat: 'Compute', icon: '🖥️', model: 'IaaS', what: 'Windows and Linux VMs you size, resize, attach disks to, encrypt, move and spread across zones or availability sets. You manage the OS; Azure runs the hosts.', use: ['Lift-and-shift servers', 'Software that needs OS-level control', 'Line-of-business apps with fixed licensing'], avoid: ['Plain web apps (App Service is less work)', 'Event-driven code (use Functions)'], feel: 2, price: 'Standard_D2s_v5 ≈ $70/month running 24/7; nothing for compute while deallocated (disks still cost).', sim: { mode: 'admincompute', start: 3, tour: 'adm-vm-create-size', intro: 'Create a VM and resize it.' }, similar: ['vmss-flexible', 'azure-managed-disks-admin'], aws: 'Amazon EC2', lesson: 'create-and-size-virtual-machines' },
  { slug: 'azure-managed-disks-admin', name: 'Managed disks and encryption at host', cat: 'Storage', icon: '💽', model: 'Block storage', what: 'OS and data disks stored in Azure Storage: Ultra Disk, Premium SSD v2, Premium SSD, Standard SSD and Standard HDD. Encrypted at rest by default; encryption at host also covers the temp disk and caches.', use: ['App data on separate data disks', 'Tuning cost and speed per disk', 'End-to-end encryption requirements'], avoid: ['Files shared by many machines (use Azure Files)'], feel: 2, price: 'A 128 GiB Premium SSD (P10) ≈ $20/month; Standard SSD (E10) ≈ $10/month (illustrative).', sim: { mode: 'admincompute', start: 4, tour: 'adm-vm-disks-eah', intro: 'Attach a disk and encrypt at host.' }, similar: ['vms-for-administrators'], aws: 'Amazon EBS', lesson: 'vm-disks-and-encryption-at-host' },
  { slug: 'azure-resource-mover', name: 'Azure Resource Mover', cat: 'Migration & Hybrid', icon: '🚚', model: 'Move service', what: 'Moves VMs and related resources to another Azure region: you add resources, validate dependencies, prepare, initiate the move, then commit or discard and delete the source.', use: ['Moving workloads closer to users', 'A region with zones you need', 'Data residency changes'], avoid: ['Moving between resource groups or subscriptions (use Move)'], feel: 2, price: 'Resource Mover itself is free; replication and the copies in the target region are billed.', sim: { mode: 'admincompute', start: 6, tour: 'adm-vm-move', intro: 'Move a VM to West US 2.' }, similar: ['vms-for-administrators'], aws: 'AWS Application Migration Service', lesson: 'move-virtual-machines' },
  { slug: 'vmss-flexible', name: 'Virtual Machine Scale Sets (Flexible)', cat: 'Compute', icon: '🧮', model: 'IaaS', what: 'A group of VMs that Azure spreads across zones or fault domains and grows or shrinks with autoscale rules. Flexible orchestration is the recommended mode for new scale sets.', use: ['Web tiers with changing load', 'Batch workers', 'High availability across zones'], avoid: ['One special server', 'Apps that fit App Service'], feel: 2, price: 'Free; you pay per instance, e.g. 3 × B2s ≈ $105/month.', sim: { mode: 'admincompute', start: 8, tour: 'adm-vm-availability-vmss', intro: 'Push CPU over 70% and watch it grow.' }, similar: ['vms-for-administrators'], aws: 'EC2 Auto Scaling', lesson: 'vm-availability-and-scale-sets', compare: 'availability-set-vs-zones-vs-flexible-scale-set' },
];
