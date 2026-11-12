/**
 * Narration for the interactive 3D scenes (<Datacenter3D mode="..." />).
 * Each step moves the camera and changes the scene; the text is rendered in
 * HTML too, so it is readable without WebGL and by search engines.
 */
export type Mode3D = 'datacenter' | 'zones' | 'regions' | 'redundancy' | 'scale' | 'network' | 'governance' | 'identity';

export interface Action3D { id: string; label: string; kind?: 'danger' | 'ok' | 'plain' }
export interface Step3D { title: string; text: string; actions?: Action3D[] }
export interface Sim3D { title: string; steps: Step3D[] }

export const SIMS3D: Record<Mode3D, Sim3D> = {
  governance: {
    title: 'Governing Azure: hierarchy, policy, access, locks and cost',
    steps: [
      { title: 'The Azure hierarchy', text: 'Everything sits in one tree: the **tenant root group**, then **management groups**, then **subscriptions**, then **resource groups**, then the **resources** themselves. Settings applied high up flow down to everything below.' },
      { title: 'Subscriptions: one bill each', text: 'A **subscription** is a **billing and access boundary**. Each one gets its own bill and its own limits, which is why companies split production, HR and dev-test.' },
      { title: 'Resource groups: live and die together', text: 'A **resource group** holds resources that share a lifecycle. Every resource is in exactly one group, and deleting the group deletes everything inside.', actions: [{ id: 'delrg', label: '🗑️ …I delete rg-dev?', kind: 'danger' }, { id: 'restore', label: '↺ Restore', kind: 'plain' }] },
      { title: 'Azure Policy: what is allowed', text: '**Azure Policy** enforces rules such as "only European regions". Assign it once to a management group and it applies to every subscription and resource group below, whoever deploys.', actions: [{ id: 'deploy-bad', label: '🇺🇸 …someone deploys a VM in East US?', kind: 'danger' }, { id: 'deploy-good', label: '🇪🇺 …they deploy in West Europe?', kind: 'ok' }] },
      { title: 'RBAC: who can do what, where', text: '**Azure RBAC** gives people a **role** at a **scope**. Ben is *Virtual Machine Contributor* on **rg-shop-web** only: least privilege.', actions: [{ id: 'ben-ok', label: '✅ …Ben restarts a VM in rg-shop-web?', kind: 'ok' }, { id: 'ben-no', label: '⛔ …Ben deletes a VM in rg-hr?', kind: 'danger' }] },
      { title: 'Resource locks: don’t touch', text: 'A **Delete lock** stops **anyone**, even an Owner, from deleting the resource group until the lock is removed. A **Read-only** lock blocks all changes.', actions: [{ id: 'del-locked', label: '🗑️ …someone deletes the locked rg-shop-data?', kind: 'danger' }, { id: 'unlock', label: '🔓 …the lock is removed first?', kind: 'plain' }] },
      { title: 'Tags and cost', text: '**Tags** such as *CostCenter* are name : value labels. Colour by tag, and **Cost Management** can split the bill per department in your currency.' },
      { title: 'Azure Resource Manager', text: 'The **portal, CLI, PowerShell and Bicep/ARM templates** all send requests to **Azure Resource Manager (ARM)**. ARM checks identity, RBAC, Policy and locks the same way for every tool, so results are consistent.', actions: [{ id: 'req', label: '⚙️ …all four tools send a request?', kind: 'ok' }] },
      { title: 'Monitor and Advisor', text: '**Azure Monitor** collects metrics and logs from every resource and raises **alerts**. **Azure Advisor** studies usage and recommends savings and fixes.', actions: [{ id: 'cpu', label: '🔥 …a VM’s CPU hits 95%?', kind: 'danger' }, { id: 'advisor', label: '💡 …the dev VMs sit idle all week?', kind: 'plain' }] },
    ],
  },
  identity: {
    title: 'Identity and security: Entra ID, MFA, Conditional Access, Zero Trust',
    steps: [
      { title: 'One identity hub', text: '**Microsoft Entra ID** is the cloud identity service for your organisation (the **tenant**). People and apps sign in through it before they reach Microsoft 365, the Azure portal or SaaS apps.' },
      { title: 'Single sign-on', text: 'With **single sign-on (SSO)** a user proves who they are once, and Entra ID gives each connected app a token. One account, many apps.', actions: [{ id: 'sso', label: '🔑 …Ana signs in once?', kind: 'ok' }] },
      { title: 'Multifactor authentication', text: '**MFA** asks for something you **know** (password) plus something you **have** (phone, key) or **are** (fingerprint, face). Passwords get stolen; MFA makes them useless on their own.', actions: [{ id: 'thief', label: '🕵️ …an attacker uses Ana’s stolen password?', kind: 'danger' }, { id: 'ana-mfa', label: '📱 …Ana signs in with her phone?', kind: 'ok' }] },
      { title: 'Conditional Access', text: '**Conditional Access** reads **signals** (who, where, which device, how risky) and decides: **allow**, **require MFA**, or **block**. It is an if-then policy engine.', actions: [{ id: 'ca-office', label: '🏢 …Ana signs in from the office?', kind: 'ok' }, { id: 'ca-travel', label: '✈️ …she signs in from a new country?', kind: 'plain' }, { id: 'ca-unmanaged', label: '💻 …she uses an unmanaged device at high risk?', kind: 'danger' }] },
      { title: 'External identities (B2B)', text: 'Partners keep their **own** accounts. Invite them as **guests** and give access only to what they need. Their company manages their identity; you manage their access.', actions: [{ id: 'guest', label: '🤝 …Priya from Fabrikam signs in?', kind: 'ok' }] },
      { title: 'Zero Trust', text: '**Zero Trust**: never trust, always verify. Every request is checked explicitly, with **least-privilege** access, assuming a breach could already have happened. Being "inside the office" is not a free pass.' },
      { title: 'Defender for Cloud', text: '**Microsoft Defender for Cloud** gives a **secure score**, recommendations (like closing open RDP ports) and threat protection for your workloads. Fix recommendations and the score goes up.', actions: [{ id: 'fix', label: '🛠️ …I fix the top recommendations?', kind: 'ok' }] },
    ],
  },
  datacenter: {
    title: 'Walk through an Azure datacenter',
    steps: [
      { title: 'The campus', text: 'This is a datacenter campus: a fenced site with a **data hall** full of servers, a **power yard** with generators, and **cooling** units. The cloud lives in real buildings like this one.' },
      { title: 'Layer 1: the perimeter', text: 'Security starts at the fence. Cameras, guards and a single gate. Visitors need an approved access request **before** they arrive. Try walking in without one.', actions: [{ id: 'intruder', label: '🚶 …someone walks in without approval?', kind: 'danger' }, { id: 'visitor', label: '🪪 …an engineer arrives with an approved request?', kind: 'ok' }] },
      { title: 'Layer 2: the building', text: 'At the door, staff pass a **badge check** and a **biometric scan** inside a two-door "mantrap": the second door only opens once the first has closed behind you.' },
      { title: 'Layer 3: the data hall', text: 'Inside are long rows of **racks**. Cold air is pushed into the blue aisles; hot air leaves through the red aisles. Only approved engineers enter, and only for an approved task.' },
      { title: 'One rack', text: 'A rack is a metal frame holding dozens of **servers** plus a network switch. Each blinking light is a server working for Azure customers right now.' },
      { title: 'Inside one server: virtual machines', text: 'One physical server runs a **hypervisor** that splits it into many **virtual machines**. Customer A, B and C share the hardware, but each VM is isolated from the others. This is how the public cloud shares hardware safely.', actions: [{ id: 'addvm', label: '➕ …another customer creates a VM here?', kind: 'ok' }] },
      { title: 'Power that never stops', text: 'Two utility feeds supply the site. If both fail, **batteries (UPS)** bridge the gap for seconds until the **diesel generators** start. Cut the power and watch the servers keep running.', actions: [{ id: 'cut', label: '⚡ …the utility power is cut?', kind: 'danger' }, { id: 'restore', label: '↺ Restore power', kind: 'plain' }] },
      { title: 'Cooling', text: 'Thousands of servers make a lot of heat. Cooling units blow cold air in (blue) and pull hot air out (red), keeping the servers at a safe temperature.' },
      { title: 'Networking', text: 'Fibre cables connect the building to **Microsoft’s global network**, one of the largest private networks in the world. Your data travels between datacenters on Microsoft’s own cables.' },
      { title: 'The bigger picture', text: 'One or more datacenters like this, with their own power, cooling and network, form an **availability zone**. Several zones form a **region**. You never choose a datacenter: you choose a region, and Microsoft secures and runs everything you just saw.' },
    ],
  },
  zones: {
    title: 'Availability zones inside one region',
    steps: [
      { title: 'One region, three zones', text: 'This plate is one Azure **region**. Inside it are three **availability zones**, each one or more datacenters in a separate location.' },
      { title: 'A zone is independent', text: 'Each zone has its **own power, cooling and networking**. A fire, flood or power cut in one zone does not reach the others.' },
      { title: 'Fast links between zones', text: 'The zones are close enough to be joined by high-speed private fibre (round trips under about 2 ms), but far enough apart to fail separately.' },
      { title: 'A zone-redundant app', text: 'This app runs one copy in **every zone**. The load balancer spreads users across all three.', actions: [{ id: 'failz1', label: '🔥 …Zone 1 goes down?', kind: 'danger' }, { id: 'restore', label: '↺ Restore', kind: 'plain' }] },
      { title: 'Zone failure', text: 'Zone 1 is down. Traffic goes only to Zones 2 and 3 and **users notice nothing**. That is high availability, and why spreading across zones raises the VM SLA to **99.99%**.', actions: [{ id: 'failz1', label: '🔥 …Zone 1 goes down?', kind: 'danger' }, { id: 'restore', label: '↺ Restore', kind: 'plain' }] },
      { title: 'Zonal vs zone-redundant', text: 'A **zonal** resource is pinned to one zone you pick. A **zone-redundant** resource is spread across zones automatically. Pick each option, then fail Zone 1 and compare.', actions: [{ id: 'zonal', label: '📌 …the app is pinned to Zone 1 only?', kind: 'plain' }, { id: 'redundant', label: '🧩 …the app is spread across all zones?', kind: 'ok' }, { id: 'failz1', label: '🔥 …Zone 1 goes down?', kind: 'danger' }, { id: 'restore', label: '↺ Restore', kind: 'plain' }] },
      { title: 'Inside one datacenter: availability sets', text: 'Without zones, an **availability set** spreads VMs across **fault domains** (separate racks with their own power and network switch) inside one datacenter. One rack failing takes down only one VM.', actions: [{ id: 'failrack', label: '💥 …one rack loses power?', kind: 'danger' }, { id: 'restore', label: '↺ Restore', kind: 'plain' }] },
    ],
  },
  regions: {
    title: 'Azure regions around the world',
    steps: [
      { title: 'A worldwide network of regions', text: 'Each glowing dot is an Azure **region**: a set of datacenters in one geographic area. Azure has more than 60 regions. Drag to spin the globe.' },
      { title: 'Zoom into one region', text: 'This is **West Europe** (Netherlands). Inside a region with zones you get **three or more availability zones**. You pick the region when you create a resource.' },
      { title: 'Region pairs', text: 'Many regions are **paired** with another in the same geography, usually 300+ miles apart: North Europe ↔ West Europe, East US ↔ West US. Updates roll out to one region of a pair at a time, and Microsoft prioritises recovering one of the pair in a wide outage.' },
      { title: 'Geographies and data residency', text: 'Regions are grouped into **geographies** such as Europe or the United States. Choosing regions inside one geography helps keep data where your laws require it.' },
      { title: 'Disaster in a region', text: 'Users in Europe reach the app in West Europe, and the data is copied to North Europe. Take West Europe offline and watch traffic **fail over** to its pair.', actions: [{ id: 'failwe', label: '🌪️ …the whole West Europe region goes down?', kind: 'danger' }, { id: 'restore', label: '↺ Restore', kind: 'plain' }] },
      { title: 'Sovereign clouds', text: 'Some clouds are **separate instances** of Azure: **Azure Government** for US public sector and **Azure China**, operated by 21Vianet. They are isolated from the public Azure regions.' },
      { title: 'Users go to the nearest region', text: 'With a global entry point such as Azure Front Door, users everywhere are sent to the **closest healthy region**, which keeps the app fast.', actions: [{ id: 'global', label: '🌍 …users come from all over the world?', kind: 'ok' }] },
      { title: 'Latency: distance costs time', text: 'Data travels through fibre at about two-thirds of the speed of light, so **distance adds delay (latency)**. Pick where you are and compare round-trip times to different regions. Choose a region close to your users.', actions: [{ id: 'from-chennai', label: '📍 …I am in Chennai?', kind: 'plain' }, { id: 'from-london', label: '📍 …I am in London?', kind: 'plain' }, { id: 'from-newyork', label: '📍 …I am in New York?', kind: 'plain' }, { id: 'from-sydney', label: '📍 …I am in Sydney?', kind: 'plain' }] },
    ],
  },
  redundancy: {
    title: 'Where Azure keeps copies of your data',
    steps: [
      { title: 'Why copies?', text: 'Azure Storage always keeps **at least three copies** of your data. The redundancy option decides **where** those copies live: one datacenter, three zones, or a second region. Left is your primary region, right is its paired region.' },
      { title: 'LRS: locally redundant', text: '**LRS** keeps 3 copies inside **one datacenter**. Cheapest option. It survives a disk or server failure, but not a disaster that hits the whole building.', actions: [{ id: 'dc', label: '🔥 …the datacenter catches fire?', kind: 'danger' }, { id: 'zone', label: '🌊 …a whole zone floods?', kind: 'danger' }, { id: 'region', label: '🌪️ …the whole region goes down?', kind: 'danger' }, { id: 'reset', label: '↺ Reset', kind: 'plain' }] },
      { title: 'ZRS: zone-redundant', text: '**ZRS** puts one copy in each of **three availability zones**. A whole zone can fail and your data is still readable and writable.', actions: [{ id: 'dc', label: '🔥 …the datacenter catches fire?', kind: 'danger' }, { id: 'zone', label: '🌊 …a whole zone floods?', kind: 'danger' }, { id: 'region', label: '🌪️ …the whole region goes down?', kind: 'danger' }, { id: 'reset', label: '↺ Reset', kind: 'plain' }] },
      { title: 'GRS: geo-redundant', text: '**GRS** is LRS in the primary region **plus** an asynchronous copy to LRS in the **paired region**: 6 copies. It survives a whole region going down.', actions: [{ id: 'dc', label: '🔥 …the datacenter catches fire?', kind: 'danger' }, { id: 'zone', label: '🌊 …a whole zone floods?', kind: 'danger' }, { id: 'region', label: '🌪️ …the whole region goes down?', kind: 'danger' }, { id: 'reset', label: '↺ Reset', kind: 'plain' }] },
      { title: 'GZRS: geo-zone-redundant', text: '**GZRS** combines both: three zones in the primary region **and** a copy in the paired region. Maximum durability.', actions: [{ id: 'dc', label: '🔥 …the datacenter catches fire?', kind: 'danger' }, { id: 'zone', label: '🌊 …a whole zone floods?', kind: 'danger' }, { id: 'region', label: '🌪️ …the whole region goes down?', kind: 'danger' }, { id: 'reset', label: '↺ Reset', kind: 'plain' }] },
      { title: 'RA-GRS and RA-GZRS: read the copy', text: 'With GRS and GZRS the secondary copy is normally **not readable** until a failover. The **RA-** (read-access) versions let your app **read** from the secondary region at any time.', actions: [{ id: 'read', label: '📖 …I need to read data during the outage?', kind: 'ok' }, { id: 'reset', label: '↺ Reset', kind: 'plain' }] },
    ],
  },
  scale: {
    title: 'Scaling servers up, out and down',
    steps: [
      { title: 'One server, normal day', text: 'One VM serves the website. CPU is comfortable. Use the **Users** slider to change the traffic.' },
      { title: 'A traffic spike', text: 'A sale starts and visitors flood in. One server is overloaded, so pages get slow or fail.', actions: [{ id: 'spike', label: '📈 …a big sale starts?', kind: 'danger' }] },
      { title: 'Scale up (vertical)', text: '**Scaling up** means a **bigger** server: more CPU and memory. It usually needs a restart, and there is always a largest size.', actions: [{ id: 'up', label: '⬆️ Scale up: bigger VM', kind: 'ok' }, { id: 'down', label: '⬇️ Scale down', kind: 'plain' }] },
      { title: 'Scale out (horizontal)', text: '**Scaling out** means **more** servers behind a load balancer. No restart, and almost no limit.', actions: [{ id: 'out', label: '➕ Add a server', kind: 'ok' }, { id: 'in', label: '➖ Remove a server', kind: 'plain' }] },
      { title: 'Elasticity: autoscale', text: 'Turn on **autoscale** with a rule: add a server when CPU > 70%, remove one when CPU < 30%. Move the slider and watch Azure match servers to demand, and the bill fall when users leave.', actions: [{ id: 'auto', label: '🤖 Autoscale on/off', kind: 'ok' }, { id: 'spike', label: '📈 …traffic spikes?', kind: 'danger' }, { id: 'quiet', label: '🌙 …everyone goes to sleep?', kind: 'plain' }] },
      { title: 'Serverless: scale to zero', text: 'With **serverless** (Azure Functions) there are no servers to manage. Each event runs a function instance, and with no events nothing runs and **nothing is billed**.', actions: [{ id: 'events', label: '⚡ …800 events arrive at once?', kind: 'ok' }] },
      { title: 'Bill shock: the forgotten VM', text: 'A developer creates a **D4s v5** test VM on Monday and forgets it. A running VM is billed **every hour, 24/7**, used or not. Fast-forward a month, then try again with **auto-shutdown** at 7 PM and weekends off.', actions: [{ id: 'forget', label: '😱 …I forget to stop the VM for a month?', kind: 'danger' }, { id: 'autoshut', label: '⏰ …I turn on auto-shutdown at 7 PM?', kind: 'ok' }] },
    ],
  },
  network: {
    title: 'Inside an Azure virtual network',
    steps: [
      { title: 'A virtual network', text: 'The blue glass box is a **virtual network (VNet)**: your private network in Azure with its own address range, **10.0.0.0/16**. Nothing gets in unless you allow it.' },
      { title: 'Subnets', text: 'The VNet is split into **subnets**: **web** (10.0.1.0/24) for web servers and **data** (10.0.2.0/24) for the database. Each VM gets a private IP from its subnet.' },
      { title: 'Network security group', text: 'An **NSG** is a list of allow and deny rules on a subnet or network card. Here: allow HTTPS 443 from the internet, deny RDP 3389. Send both and watch.', actions: [{ id: 'https', label: '🔒 …someone visits the site on HTTPS (443)?', kind: 'ok' }, { id: 'rdp', label: '🖥️ …an attacker tries RDP (3389)?', kind: 'danger' }] },
      { title: 'VNet peering', text: 'A second VNet joins with **peering**. Traffic between them uses private IPs over **Microsoft’s backbone**, never the public internet.', actions: [{ id: 'peer', label: '🔗 …VMs in the two VNets talk?', kind: 'ok' }] },
      { title: 'VPN gateway', text: 'The office on the left connects with a **site-to-site VPN**. Traffic travels **encrypted (IPsec) over the public internet** to the VPN gateway.', actions: [{ id: 'vpn', label: '🔐 …the office sends data through the VPN?', kind: 'ok' }] },
      { title: 'ExpressRoute', text: '**ExpressRoute** is a **private connection** from your office through a connectivity provider to Microsoft. It does **not** go over the internet, so it is more reliable and predictable.', actions: [{ id: 'er', label: '🛣️ …the office uses ExpressRoute instead?', kind: 'ok' }] },
      { title: 'Private endpoint', text: 'A storage account normally has a **public endpoint** on the internet. A **private endpoint** gives it a private IP (10.0.2.5) **inside your VNet**, so traffic never leaves your network.', actions: [{ id: 'public', label: '🌐 …the VM reaches storage without a private endpoint?', kind: 'plain' }, { id: 'private', label: '🔒 …I add a private endpoint?', kind: 'ok' }] },
      { title: 'Azure DNS', text: 'People type names, networks use numbers. **DNS** turns **www.contoso.com** into an IP address like **20.50.1.4**, and then the browser connects.', actions: [{ id: 'dns', label: '🔎 …I type www.contoso.com?', kind: 'ok' }] },
    ],
  },
};
