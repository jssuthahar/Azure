/**
 * Troubleshooting challenges (/troubleshoot/): labs that start BROKEN. Each
 * `setup` runs in the simulated Cloud Shell when the lab first opens, then the
 * event log is cleared, so only the learner's own fixes count. Symptoms are
 * written like a support ticket; tasks ask for the fix, not the steps.
 * Ids start fix-. Every task's `cli` hint completes it when run in order after
 * the setup (scripts/qa/lab-check.ts runs the setup first).
 */
import type { Lab } from './labs';
import type { Sim } from './engine';

const ev = (s: Sim, type: string, pred: (d: Record<string, any>) => boolean = () => true) => s.events.some((e) => e.type === type && pred(e.data));
const T = 'msdevbuild.com';
const SHELL_IP = '203.0.113.25';

export const CHALLENGES: Lab[] = [
  {
    id: 'fix-locked-cleanup', exam: 'az-104', kind: 'challenge', title: 'The resource group that won’t die', icon: '🔒', level: 'Beginner', minutes: 6, start: 'shell',
    symptom: 'Ticket #4102: “Our clean-up script fails on rg-legacy with ScopeLocked. Nobody remembers adding anything. Please delete the group today.”',
    setup: ['az group create -n rg-legacy -l eastus', 'az lock create --name keep-legacy --lock-type CanNotDelete -g rg-legacy'],
    intro: 'Someone protected rg-legacy long ago and forgot. Find out what is blocking the delete, remove it the right way and finish the clean-up.',
    learn: ['Read a ScopeLocked error', 'Find locks on a scope', 'Remove a lock before deleting'],
    topics: ['locks-and-tags-at-scale'],
    tasks: [
      { text: 'Find what is blocking the delete on **rg-legacy** and remove it.', portal: 'Open rg-legacy ➜ Locks ➜ delete the lock you find.', cli: 'az lock list -g rg-legacy -o table && az lock delete --name keep-legacy -g rg-legacy', check: (s) => ev(s, 'lock.delete', (d) => d.rg === 'rg-legacy') },
      { text: 'Now delete **rg-legacy**.', cli: 'az group delete -n rg-legacy --yes', check: (s) => ev(s, 'rg.delete', (d) => d.name === 'rg-legacy') },
    ],
    wrap: 'Locks override permissions, so even an Owner gets ScopeLocked. Locks can sit on the resource group or be inherited from the subscription, so check both with az lock list. In real life, ask who added it before you remove it.',
  },
  {
    id: 'fix-storage-firewall', exam: 'az-104', kind: 'challenge', title: 'The storage account that says no', icon: '🧱', level: 'Intermediate', minutes: 8, start: 'shell',
    symptom: 'Ticket #4117: “Since last night the invoice app (subnet snet-app in vnet-app) and our admin Cloud Shell get AuthorizationFailure on stinvoicefix01. Keys are fine. Nothing was deployed.”',
    setup: [
      'az group create -n rg-fix-st -l eastus',
      'az storage account create -g rg-fix-st -n stinvoicefix01 --sku Standard_LRS',
      'az storage container create --account-name stinvoicefix01 -n invoices',
      'az network vnet create -g rg-fix-st -n vnet-app --address-prefixes 10.20.0.0/16 --subnet-name snet-app --subnet-prefixes 10.20.1.0/24',
      'az storage account update -g rg-fix-st -n stinvoicefix01 --default-action Deny --bypass AzureServices',
    ],
    intro: 'The keys work, so this isn’t authentication. Somebody locked the account’s network down. Let the right callers back in without opening it to the whole internet.',
    learn: ['Spot a network block versus an auth problem', 'Add a virtual network rule', 'Add an IP rule'],
    topics: ['storage-firewalls-and-virtual-networks'],
    tasks: [
      { text: `Let the admin Cloud Shell (**${SHELL_IP}**) back in, without turning the firewall off.`, cli: `az storage account network-rule add -g rg-fix-st --account-name stinvoicefix01 --ip-address ${SHELL_IP}`, check: (s) => ev(s, 'adm.st.netrule', (d) => d.kind === 'ip' && d.value === SHELL_IP) },
      { text: 'Let the invoice app’s subnet **snet-app** in **vnet-app** back in.', cli: 'az storage account network-rule add -g rg-fix-st --account-name stinvoicefix01 --vnet-name vnet-app --subnet snet-app', check: (s) => ev(s, 'adm.st.netrule', (d) => d.kind === 'vnet') },
    ],
    wrap: 'AuthorizationFailure with working keys usually means the storage firewall. Default action Deny blocks everything not on an allow list; trusted Azure services still get through with the bypass. Turning public access back on would have “fixed” it too, and opened the data to the internet.',
  },
  {
    id: 'fix-license-assign', exam: 'az-104', kind: 'challenge', title: 'The licence that won’t stick', icon: '🪪', level: 'Beginner', minutes: 5, start: 'shell',
    symptom: `Ticket #4130: “New starter Priya (priya@${T}) can’t open Outlook. Assigning Microsoft 365 E3 fails every time.”`,
    setup: [`az ad user create --display-name "Priya Nair" --user-principal-name priya@${T} --password "Contoso!2026x" --force-change-password-next-sign-in true`],
    intro: 'The licence exists and there are seats. Something on Priya’s account is missing. Find it, fix it and assign the licence.',
    learn: ['Read a licence assignment error', 'Set usage location', 'Assign a licence'],
    topics: ['entra-licenses-and-guest-users'],
    tasks: [
      { text: 'Try the assignment and read the error, then fix Priya’s account (she works in India).', cli: `az ad user update --id priya@${T} --usage-location IN`, check: (s) => ev(s, 'adm.user.update', (d) => d.changes?.usageLocation === 'IN') },
      { text: 'Assign **Microsoft 365 E3** to Priya.', cli: `az ad user license assign --id priya@${T} --sku SPE_E3`, check: (s) => ev(s, 'adm.license.assign', (d) => d.upn === `priya@${T}`) },
    ],
    wrap: 'Microsoft Entra won’t assign a licence to a user with no usage location, because licence availability depends on the country. Set it once on the user, or license a group and let new joiners inherit it.',
  },
  {
    id: 'fix-acr-replica', exam: 'az-104', kind: 'challenge', title: 'Slow image pulls in Europe', icon: '🐢', level: 'Intermediate', minutes: 5, start: 'shell',
    symptom: 'Ticket #4144: “Our West Europe cluster takes minutes to pull images from acrcontosofix01 in East US. Adding a replica fails. Please make pulls local.”',
    setup: ['az group create -n rg-fix-acr -l eastus', 'az acr create -g rg-fix-acr -n acrcontosofix01 --sku Standard'],
    intro: 'Geo-replication would fix the latency, but the registry refuses it. Work out why and make the replica happen.',
    learn: ['Know which ACR tier supports geo-replication', 'Change a registry SKU', 'Add a replica'],
    topics: ['container-registry-and-instances'],
    tasks: [
      { text: 'Try to add a **West Europe** replica and read why it’s refused.', cli: 'az acr replication create -r acrcontosofix01 -l westeurope', check: (s) => ev(s, 'adm.acr.replication', (d) => d.ok === false) },
      { text: 'Fix the registry so the West Europe replica can be created, then create it.', cli: 'az acr update -n acrcontosofix01 --sku Premium && az acr replication create -r acrcontosofix01 -l westeurope', check: (s) => ev(s, 'adm.acr.update', (d) => d.sku === 'Premium') && ev(s, 'adm.acr.replication', (d) => d.ok && d.location === 'westeurope') },
    ],
    wrap: 'Geo-replication is a Premium feature. Basic and Standard registries live in one region. Premium also adds private endpoints and higher throughput, so it’s the usual choice for production clusters in more than one region.',
  },
  {
    id: 'fix-web-port-80', exam: 'az-104', kind: 'challenge', title: 'The website that times out', icon: '🌐', level: 'Intermediate', minutes: 7, start: 'shell',
    symptom: 'Ticket #4151: “web01 is running and nginx is up, but the site times out from the internet. The subnet has an NSG called nsg-web.”',
    setup: [
      'az group create -n rg-fix-web -l eastus',
      'az network vnet create -g rg-fix-web -n vnet-web --address-prefixes 10.50.0.0/16 --subnet-name snet-web --subnet-prefixes 10.50.1.0/24',
      'az network nsg create -g rg-fix-web -n nsg-web',
      'az network vnet subnet update -g rg-fix-web --vnet-name vnet-web -n snet-web --network-security-group nsg-web',
      'az network nic create -g rg-fix-web -n nic-web01 --vnet-name vnet-web --subnet snet-web',
      'az vm create -g rg-fix-web -n web01 --image Ubuntu2204 --nics nic-web01',
    ],
    intro: 'The VM is healthy, so look at the network path. An NSG with no custom rules only allows traffic from inside the virtual network and from the load balancer probe.',
    learn: ['Read NSG default rules', 'Add an inbound allow rule with the right priority', 'Open only the port you need'],
    topics: ['nsgs-asgs-and-effective-rules'],
    tasks: [
      { text: 'Allow **TCP 80** from the **Internet** into nsg-web, and nothing more.', cli: 'az network nsg rule create -g rg-fix-web --nsg-name nsg-web -n Allow-HTTP --priority 200 --direction Inbound --access Allow --protocol Tcp --source-address-prefixes Internet --destination-port-ranges 80', check: (s) => ['nsg.rule', 'adm.nsg.rule'].some((t) => ev(s, t, (d) => d.nsg === 'nsg-web' && d.access === 'Allow' && d.direction === 'Inbound' && String(d.port).split(',').includes('80'))) },
    ],
    wrap: 'DenyAllInbound (priority 65500) catches anything you haven’t allowed. Your rule at priority 200 is evaluated first. Opening * or 0-65535 would also “work”, and expose SSH and everything else to the internet.',
  },
];
