/**
 * Problem → Solution cards shown near the top of every lesson.
 * Each pair is one real pain and how the cloud (or Azure) fixes it.
 * Keep lines short: they are read aloud and shown on small screens.
 */
export interface ProblemSolution {
  problem: string;
  solution: string;
  pairs: { pain: string; fix: string; icon: string }[];
  /** The Azure feature or concept that does the fixing. */
  tool: string;
}

export const PROBLEM_SOLUTION: Record<string, ProblemSolution> = {
  'what-is-cloud-computing': {
    problem: 'Your website crashes when 10,000 students log in at once.',
    solution: 'Borrow extra computers from the cloud for exam day, then give them back.',
    tool: 'Cloud computing',
    pairs: [
      { icon: '💸', pain: 'Buying servers costs a fortune up front', fix: 'Rent them and pay only for what you use' },
      { icon: '⏳', pain: 'New servers take weeks to arrive', fix: 'Cloud servers are ready in minutes' },
      { icon: '😴', pain: 'Servers sit idle most of the year', fix: 'Give them back when you are done' },
    ],
  },
  'what-is-microsoft-azure': {
    problem: 'A small team wants to launch an app but has no servers or datacenter.',
    solution: 'Use Azure: hundreds of ready-made services in regions all over the world.',
    tool: 'Microsoft Azure',
    pairs: [
      { icon: '🏗️', pain: 'Building a datacenter is impossible for a start-up', fix: 'Use Microsoft’s datacenters instead' },
      { icon: '🧩', pain: 'You need web hosting, a database and storage', fix: 'Azure has a ready service for each' },
      { icon: '🌍', pain: 'Customers are in different countries', fix: 'Deploy to an Azure region near them' },
    ],
  },
  'why-companies-use-cloud': {
    problem: 'A shop’s website goes down on its busiest sale day, and customers leave.',
    solution: 'Move to the cloud: capacity grows in minutes and costs follow demand.',
    tool: 'Cloud benefits',
    pairs: [
      { icon: '🐢', pain: 'IT projects wait weeks for hardware', fix: 'Start building the same day' },
      { icon: '📈', pain: 'Traffic spikes crash the site', fix: 'Scale up for the rush, down afterwards' },
      { icon: '🔧', pain: 'Engineers spend days fixing servers', fix: 'The provider runs the hardware' },
    ],
  },
  'on-premises-vs-cloud': {
    problem: 'The server room is full, hot and out of warranty next year.',
    solution: 'Move suitable systems to the cloud and stop buying hardware.',
    tool: 'Cloud migration',
    pairs: [
      { icon: '💰', pain: 'A hardware refresh costs millions', fix: 'No hardware to buy in the cloud' },
      { icon: '🔥', pain: 'Power, cooling and repairs never stop', fix: 'Microsoft handles the datacenter' },
      { icon: '📦', pain: 'Capacity is stuck at what you bought', fix: 'Add or remove capacity any time' },
    ],
  },
  'public-cloud': {
    problem: 'A start-up needs servers now but has no money for hardware.',
    solution: 'Use the public cloud: shared infrastructure, nothing to buy, pay as you go.',
    tool: 'Public cloud',
    pairs: [
      { icon: '🏦', pain: 'No budget for servers', fix: 'No up-front cost at all' },
      { icon: '🎢', pain: 'Nobody knows how many users will come', fix: 'Scale with demand on shared capacity' },
      { icon: '🛠️', pain: 'No staff to run hardware', fix: 'The provider maintains everything physical' },
    ],
  },
  'private-cloud': {
    problem: 'A regulation says this system must run on hardware only your organisation uses.',
    solution: 'Build a private cloud: cloud-style self-service on dedicated hardware.',
    tool: 'Private cloud',
    pairs: [
      { icon: '🔐', pain: 'Data cannot share hardware with others', fix: 'Single-tenant, dedicated infrastructure' },
      { icon: '🎫', pain: 'Teams wait weeks for each server', fix: 'Self-service portal gives VMs in minutes' },
      { icon: '🎛️', pain: 'You need full control of the setup', fix: 'You own and configure everything' },
    ],
  },
  'hybrid-cloud': {
    problem: 'Patient records must stay in the hospital, but the new AI tools are in the cloud.',
    solution: 'Go hybrid: keep the records on-premises and connect them securely to Azure.',
    tool: 'Hybrid cloud + Azure Arc',
    pairs: [
      { icon: '🏥', pain: 'Some data must stay on-premises', fix: 'Keep it there and use cloud for the rest' },
      { icon: '🔗', pain: 'Two worlds that cannot talk', fix: 'Connect them with VPN Gateway or ExpressRoute' },
      { icon: '🧭', pain: 'Two sets of tools to manage', fix: 'Azure Arc manages both from one place' },
    ],
  },
  iaas: {
    problem: 'An old app only installs on one specific version of Windows.',
    solution: 'Rent a virtual machine (IaaS) and install exactly what you need.',
    tool: 'Azure Virtual Machines',
    pairs: [
      { icon: '🧱', pain: 'You need full control of the OS', fix: 'IaaS gives you the whole virtual machine' },
      { icon: '🚚', pain: 'You must move 30 servers fast', fix: 'Lift and shift them with no code changes' },
      { icon: '🔌', pain: 'Old hardware is about to fail', fix: 'Microsoft runs the physical servers now' },
    ],
  },
  paas: {
    problem: 'Two developers spend a day every week patching servers instead of coding.',
    solution: 'Use PaaS: Microsoft runs the platform, you just deploy your app.',
    tool: 'Azure App Service',
    pairs: [
      { icon: '🩹', pain: 'Monthly OS patching eats time', fix: 'Microsoft patches the platform' },
      { icon: '📈', pain: 'Adding servers before busy weeks', fix: 'Built-in autoscale does it for you' },
      { icon: '💾', pain: 'Worrying about database backups', fix: 'Managed databases back up automatically' },
    ],
  },
  saas: {
    problem: 'A charity needs email and video calls by next week and has no IT staff.',
    solution: 'Subscribe to SaaS: ready-to-use software, nothing to install or maintain.',
    tool: 'Microsoft 365',
    pairs: [
      { icon: '🖥️', pain: 'No servers or IT team', fix: 'The provider runs everything' },
      { icon: '⏰', pain: 'Needed immediately', fix: 'Sign up and start using it today' },
      { icon: '🔄', pain: 'Software goes out of date', fix: 'Updates arrive automatically' },
    ],
  },
  'choosing-iaas-paas-saas': {
    problem: 'One company needs to move an old app, build a new portal and give staff email.',
    solution: 'Pick per job: IaaS for the old app, PaaS for the portal, SaaS for email.',
    tool: 'IaaS · PaaS · SaaS',
    pairs: [
      { icon: '🧱', pain: 'Legacy app needs a specific OS', fix: 'IaaS virtual machine' },
      { icon: '🧰', pain: 'New portal, no time for servers', fix: 'PaaS: App Service and Azure SQL' },
      { icon: '📦', pain: 'Staff need email and chat', fix: 'SaaS: Microsoft 365' },
    ],
  },
  'shared-responsibility-model': {
    problem: '“It’s in the cloud, so Microsoft keeps it safe”, until a weak password lets an attacker in.',
    solution: 'Know the split: Microsoft secures the cloud, you secure what you put in it.',
    tool: 'Shared responsibility model',
    pairs: [
      { icon: '🤷', pain: 'Nobody knows who patches what', fix: 'The model shows each layer’s owner' },
      { icon: '🔑', pain: 'Accounts protected only by passwords', fix: 'Identities are yours: turn on MFA' },
      { icon: '🏢', pain: 'Worrying about datacenter break-ins', fix: 'Physical security is always Microsoft’s' },
    ],
  },
  serverless: {
    problem: 'A server runs 24/7 just to resize a photo a few times an hour.',
    solution: 'Use serverless: code wakes up on each event and you pay only while it runs.',
    tool: 'Azure Functions',
    pairs: [
      { icon: '💤', pain: 'Paying for a server that is idle', fix: 'Scale to zero and pay nothing when idle' },
      { icon: '🩹', pain: 'Patching a server for tiny jobs', fix: 'No servers to manage at all' },
      { icon: '🎢', pain: 'Sudden bursts of work', fix: 'Scales out automatically per event' },
    ],
  },
  'consumption-based-model': {
    problem: 'You paid for a huge server all year, but used it fully only one month.',
    solution: 'Use consumption-based pricing: pay for what you actually use.',
    tool: 'Pay-as-you-go',
    pairs: [
      { icon: '💸', pain: 'Big up-front purchase', fix: 'No up-front cost' },
      { icon: '😴', pain: 'Paying for idle capacity', fix: 'Delete or switch off and stop paying' },
      { icon: '😱', pain: 'Surprise bills', fix: 'Budgets and alerts in Cost Management' },
    ],
  },
  'cloud-pricing-models': {
    problem: 'Your database runs 24/7 for years, and you pay full price every hour.',
    solution: 'Match each workload to a pricing model and save a lot.',
    tool: 'Reservations · Savings plan · Spot',
    pairs: [
      { icon: '🗓️', pain: 'Steady workload at full price', fix: 'Reservation: commit 1–3 years, pay less' },
      { icon: '🔀', pain: 'Steady spend but changing VM sizes', fix: 'Savings plan for compute' },
      { icon: '🎞️', pain: 'Expensive overnight batch jobs', fix: 'Spot VMs, if interruptions are OK' },
    ],
  },
  'capex-vs-opex': {
    problem: 'A new bakery must spend all its savings on an oven before selling a single loaf.',
    solution: 'Rent instead of buy: small monthly payments (OpEx) instead of one huge one (CapEx).',
    tool: 'OpEx via the cloud',
    pairs: [
      { icon: '🏦', pain: 'Huge payment on day one', fix: 'Small, regular monthly bill' },
      { icon: '📉', pain: 'Equipment loses value every year', fix: 'Nothing to own or depreciate' },
      { icon: '🔄', pain: 'Stuck if your needs change', fix: 'Scale up, down or stop any time' },
    ],
  },
  'high-availability': {
    problem: 'The only server crashes at 9:15 during an online exam.',
    solution: 'Run copies in several availability zones, so one failure changes nothing.',
    tool: 'Availability zones + load balancer',
    pairs: [
      { icon: '1️⃣', pain: 'One server = one point of failure', fix: 'Run two or more instances' },
      { icon: '🏚️', pain: 'A whole datacenter loses power', fix: 'Spread across availability zones' },
      { icon: '❓', pain: 'Not sure how much downtime is OK', fix: 'Check the SLA percentage' },
    ],
  },
  scalability: {
    problem: 'Sale traffic triples and the website slows to a crawl.',
    solution: 'Scale: make servers bigger (up) or add more of them (out).',
    tool: 'Scale up · Scale out',
    pairs: [
      { icon: '🐌', pain: 'One server is too slow', fix: 'Scale up: more CPU and memory' },
      { icon: '👥', pain: 'Too many users for one server', fix: 'Scale out: add more servers' },
      { icon: '💸', pain: 'Extra servers after the sale', fix: 'Scale back down and stop paying' },
    ],
  },
  elasticity: {
    problem: 'Results go live at 10:00 and visitors jump from 300 to 300,000 in a minute.',
    solution: 'Use autoscale: servers are added and removed automatically, in real time.',
    tool: 'Autoscale',
    pairs: [
      { icon: '⏱️', pain: 'Humans react too slowly', fix: 'Autoscale reacts in minutes, automatically' },
      { icon: '🌙', pain: 'Paying for servers overnight', fix: 'It scales back in when demand drops' },
      { icon: '🔮', pain: 'Impossible to predict the peak', fix: 'Capacity follows real demand' },
    ],
  },
  reliability: {
    problem: 'A flood knocks out the region where your booking system runs.',
    solution: 'Keep a copy in another region and fail over to it.',
    tool: 'Region pairs · Azure Site Recovery · Backup',
    pairs: [
      { icon: '🌊', pain: 'A whole region goes down', fix: 'Fail over to a second region' },
      { icon: '🗑️', pain: 'Data is deleted or corrupted', fix: 'Restore from Azure Backup' },
      { icon: '🙏', pain: 'Hoping the DR plan works', fix: 'Test failover regularly' },
    ],
  },
  predictability: {
    problem: 'The app is fast one day and slow the next, and the bill keeps surprising finance.',
    solution: 'Make performance and cost predictable with autoscale, estimates and budgets.',
    tool: 'Pricing calculator · Cost Management',
    pairs: [
      { icon: '🎢', pain: 'Performance goes up and down', fix: 'Autoscale and load balancing' },
      { icon: '🤔', pain: 'No idea what it will cost', fix: 'Estimate first with the pricing calculator' },
      { icon: '😱', pain: 'Surprise bills', fix: 'Budgets with alerts in Cost Management' },
    ],
  },
  security: {
    problem: 'Servers in an office cupboard, patched “when someone remembers”.',
    solution: 'Use Azure’s layers of security and its tools to protect your part.',
    tool: 'Defender for Cloud · DDoS Protection · Entra ID',
    pairs: [
      { icon: '🚪', pain: 'Anyone can walk into the server room', fix: 'Guarded Microsoft datacenters' },
      { icon: '🌊', pain: 'Floods of fake traffic take the site down', fix: 'Azure DDoS Protection' },
      { icon: '🩹', pain: 'Missed security patches', fix: 'PaaS is patched for you; Defender flags gaps' },
    ],
  },
  governance: {
    problem: 'Someone creates an expensive server in the wrong country on a Friday afternoon.',
    solution: 'Set rules once and let Azure enforce them automatically.',
    tool: 'Azure Policy · Resource locks',
    pairs: [
      { icon: '🌍', pain: 'Resources created in forbidden regions', fix: 'Azure Policy denies them' },
      { icon: '🗑️', pain: 'Critical database deleted by mistake', fix: 'A resource lock blocks deletion' },
      { icon: '🏷️', pain: 'Nobody knows who owns a resource', fix: 'Required tags via policy' },
    ],
  },
  manageability: {
    problem: 'One of 300 servers fails at 3 a.m. and nobody notices until morning.',
    solution: 'Monitor, automate and let failed resources replace themselves.',
    tool: 'Azure Monitor · Portal · CLI · IaC',
    pairs: [
      { icon: '🌙', pain: 'Failures go unnoticed', fix: 'Alerts reach the on-call engineer' },
      { icon: '🖱️', pain: 'Clicking the same setup 50 times', fix: 'Scripts and infrastructure as code' },
      { icon: '🧯', pain: 'Broken servers need manual fixing', fix: 'Scale sets replace unhealthy instances' },
    ],
  },
  'regions-and-region-pairs': {
    problem: "Customers in Asia wait seconds for pages served from the United States, and some data must stay in-country.",
    solution: "Choose an Azure region near your users, with its pair for disaster recovery.",
    tool: "Azure regions and region pairs",
    pairs: [
      { icon: "🐢", pain: "Users far from the servers get slow pages", fix: "Deploy to a region near them" },
      { icon: "📜", pain: "Rules say data must stay in a country", fix: "Pick a region in that geography" },
      { icon: "🌪️", pain: "A disaster could hit one region", fix: "Use the paired region for recovery" },
    ],
  },
  'availability-zones': {
    problem: "All your servers sit in one datacenter, and one power failure takes everything down.",
    solution: "Spread resources across availability zones in the region.",
    tool: "Availability zones",
    pairs: [
      { icon: "🔌", pain: "One datacenter loses power", fix: "Other zones keep running" },
      { icon: "🧩", pain: "Copies are needed close together", fix: "Zones are linked by fast private fibre" },
      { icon: "🗄️", pain: "Data could be lost with the building", fix: "Zone-redundant storage keeps 3 copies" },
    ],
  },
  'datacenters': {
    problem: "Your company would need a building, power, cooling and guards just to run servers.",
    solution: "Use Microsoft’s datacenters, grouped into zones and regions.",
    tool: "Azure datacenters",
    pairs: [
      { icon: "🏗️", pain: "Building a datacenter costs millions", fix: "Rent capacity in Microsoft’s" },
      { icon: "🛡️", pain: "Physical security is hard to do well", fix: "Microsoft secures every building" },
      { icon: "🧾", pain: "Auditors want proof", fix: "Download reports from the Service Trust Portal" },
    ],
  },
  'resources-and-resource-groups': {
    problem: "Hundreds of resources in one place, and someone deletes a production database by mistake.",
    solution: "Group related resources into resource groups by app and environment.",
    tool: "Resource groups",
    pairs: [
      { icon: "🔍", pain: "Hard to find what belongs to which app", fix: "One resource group per app and environment" },
      { icon: "🧹", pain: "Cleaning up 15 test resources one by one", fix: "Delete the whole test resource group" },
      { icon: "🔐", pain: "Testers can touch production", fix: "Set permissions per resource group" },
    ],
  },
  'subscriptions': {
    problem: "One giant Azure bill, and nobody knows which department spent what.",
    solution: "Use separate subscriptions as billing and access boundaries.",
    tool: "Azure subscriptions",
    pairs: [
      { icon: "🧾", pain: "One bill for everyone", fix: "A separate bill per subscription" },
      { icon: "🔓", pain: "Everyone can access everything", fix: "Access rules per subscription" },
      { icon: "🧪", pain: "Dev experiments next to production", fix: "Separate dev and prod subscriptions" },
    ],
  },
  'management-groups': {
    problem: "50 subscriptions, and the same rule has to be set 50 times by hand.",
    solution: "Put subscriptions in management groups and assign the rule once.",
    tool: "Management groups",
    pairs: [
      { icon: "🔁", pain: "Repeating settings in every subscription", fix: "Assign once at the management group" },
      { icon: "🆕", pain: "New subscriptions miss the rules", fix: "They inherit rules automatically" },
      { icon: "🗺️", pain: "No structure across teams", fix: "A tree that mirrors your governance" },
    ],
  },
  'management-hierarchy': {
    problem: "Rules and permissions are set in random places and nobody knows what applies where.",
    solution: "Use the four-level hierarchy and apply each rule at the right scope.",
    tool: "Azure management hierarchy",
    pairs: [
      { icon: "🌀", pain: "Settings scattered everywhere", fix: "Broad rules high, specific rules low" },
      { icon: "❓", pain: "Unsure who can access what", fix: "Permissions inherit down predictably" },
      { icon: "🧾", pain: "Auditors want one view", fix: "One policy at the top covers all" },
    ],
  },
  'compute-types': {
    problem: "Every workload runs on big VMs, even tiny jobs that run twice a day.",
    solution: "Match each workload to the lightest compute type: VM, container or function.",
    tool: "VMs · Containers · Functions",
    pairs: [
      { icon: "🧱", pain: "Legacy app needs full OS control", fix: "Virtual machine" },
      { icon: "📦", pain: "Microservices must start fast and move easily", fix: "Containers" },
      { icon: "⚡", pain: "A tiny job runs on an event", fix: "Azure Functions" },
    ],
  },
  'virtual-machines': {
    problem: "The server needed next week will take a month to buy and install.",
    solution: "Create an Azure virtual machine in minutes.",
    tool: "Azure Virtual Machines",
    pairs: [
      { icon: "⏳", pain: "Weeks waiting for hardware", fix: "A VM is ready in minutes" },
      { icon: "🔧", pain: "Old server failing", fix: "Microsoft runs the physical host" },
      { icon: "💸", pain: "Paying while it is idle", fix: "Deallocate it to stop compute charges" },
    ],
  },
  'vm-scale-sets-and-availability-sets': {
    problem: "Fixed servers crash on sale day, and one failed rack can take them all down.",
    solution: "Scale sets for automatic capacity, availability sets or zones for resilience.",
    tool: "VM Scale Sets · Availability sets",
    pairs: [
      { icon: "📈", pain: "Traffic triples on sale day", fix: "Scale set adds VMs automatically" },
      { icon: "🧯", pain: "One rack loses power", fix: "VMs spread across fault domains" },
      { icon: "🔄", pain: "Maintenance reboots everything", fix: "Update domains reboot in groups" },
    ],
  },
  'azure-virtual-desktop': {
    problem: "Contractors need company apps on their own laptops, but data must not be stored there.",
    solution: "Stream Windows desktops from Azure Virtual Desktop.",
    tool: "Azure Virtual Desktop",
    pairs: [
      { icon: "💻", pain: "Shipping company laptops", fix: "Use any device to connect" },
      { icon: "🔓", pain: "Data copied onto personal PCs", fix: "Data stays in Azure" },
      { icon: "💰", pain: "One VM per user is expensive", fix: "Windows multi-session shares VMs" },
    ],
  },
  'app-service': {
    problem: "Developers spend days patching and scaling the VMs that host a simple website.",
    solution: "Host it on Azure App Service and let Microsoft run the platform.",
    tool: "Azure App Service",
    pairs: [
      { icon: "🩹", pain: "OS patching every month", fix: "Microsoft patches the platform" },
      { icon: "📈", pain: "Manual scaling before busy days", fix: "Built-in autoscale" },
      { icon: "😬", pain: "Risky releases", fix: "Deployment slots: swap with zero downtime" },
    ],
  },
  'azure-functions': {
    problem: "A VM runs all day just to handle a few events an hour.",
    solution: "Run the code as an Azure Function triggered by the event.",
    tool: "Azure Functions",
    pairs: [
      { icon: "💤", pain: "Paying for an idle server", fix: "Pay per execution" },
      { icon: "🎢", pain: "Sudden bursts of events", fix: "Scales out automatically" },
      { icon: "🔌", pain: "Lots of plumbing code", fix: "Bindings connect data declaratively" },
    ],
  },
  'container-instances-and-aks': {
    problem: "“It works on my machine” but breaks on the server, and deploying many services is chaos.",
    solution: "Package apps as containers and run them on ACI, Container Apps or AKS.",
    tool: "ACI · Container Apps · AKS",
    pairs: [
      { icon: "💥", pain: "Different settings break the app", fix: "Containers include their dependencies" },
      { icon: "⏱️", pain: "One quick task needs a server", fix: "Azure Container Instances, per second" },
      { icon: "🕸️", pain: "Hundreds of services to manage", fix: "AKS orchestrates and self-heals" },
    ],
  },
  'virtual-networks-and-subnets': {
    problem: "Cloud servers need to talk privately, and the database must not be reachable from everywhere.",
    solution: "Put resources in a virtual network and separate them with subnets.",
    tool: "Azure Virtual Network",
    pairs: [
      { icon: "📢", pain: "Servers exposed to the whole internet", fix: "Private addresses inside a VNet" },
      { icon: "🔀", pain: "Web and database mixed together", fix: "Separate subnets per tier" },
      { icon: "🏢", pain: "Cloud cannot reach the office", fix: "Connect with VPN or ExpressRoute" },
    ],
  },
  'vnet-peering': {
    problem: "Two Azure networks need to talk, but data must not cross the public internet.",
    solution: "Peer the virtual networks over the Microsoft backbone.",
    tool: "VNet peering",
    pairs: [
      { icon: "🌍", pain: "Networks in different regions", fix: "Global peering connects them" },
      { icon: "🐢", pain: "Gateways add latency", fix: "Peering is direct and fast" },
      { icon: "👀", pain: "Traffic on the internet", fix: "Stays on Microsoft’s backbone" },
    ],
  },
  'network-security-groups': {
    problem: "A VM with RDP open to the internet is attacked by bots within hours.",
    solution: "Use NSG rules to allow only the traffic you need.",
    tool: "Network security groups",
    pairs: [
      { icon: "🤖", pain: "Bots guessing passwords on port 3389", fix: "Deny RDP from the internet" },
      { icon: "🧱", pain: "Database open to all subnets", fix: "Allow only the web subnet" },
      { icon: "📋", pain: "No idea what is allowed", fix: "Clear, prioritised rule list" },
    ],
  },
  'vpn-gateway': {
    problem: "Shops must reach a system in Azure, but a private line to each one is too expensive.",
    solution: "Use an encrypted site-to-site VPN over existing internet lines.",
    tool: "Azure VPN Gateway",
    pairs: [
      { icon: "💸", pain: "Private lines cost too much", fix: "Use existing internet, encrypted" },
      { icon: "🏠", pain: "Staff work from home", fix: "Point-to-site VPN per laptop" },
      { icon: "👂", pain: "Data could be read in transit", fix: "IPsec encryption" },
    ],
  },
  'expressroute': {
    problem: "Huge nightly transfers over the internet are slow, unpredictable and worry regulators.",
    solution: "Connect privately to Azure with ExpressRoute.",
    tool: "Azure ExpressRoute",
    pairs: [
      { icon: "🐌", pain: "Speeds vary on the internet", fix: "Dedicated bandwidth" },
      { icon: "⏱️", pain: "Latency jumps around", fix: "Consistent, predictable latency" },
      { icon: "🌐", pain: "Regulators dislike internet paths", fix: "Traffic never touches the internet" },
    ],
  },
  'azure-dns': {
    problem: "DNS records are spread across many registrars and changes are slow and risky.",
    solution: "Host DNS zones in Azure DNS with Azure tools, access control and locks.",
    tool: "Azure DNS",
    pairs: [
      { icon: "🗂️", pain: "Records scattered everywhere", fix: "One place for all zones" },
      { icon: "🗑️", pain: "Accidental record deletion", fix: "Resource locks and RBAC" },
      { icon: "🔒", pain: "Private names inside networks", fix: "Private DNS zones" },
    ],
  },
  'public-and-private-endpoints': {
    problem: "Your database and storage can be reached from anywhere on the internet.",
    solution: "Connect through private endpoints and switch off public access.",
    tool: "Private endpoints (Private Link)",
    pairs: [
      { icon: "🌐", pain: "Data services exposed to the internet", fix: "Private IP in your VNet" },
      { icon: "🛣️", pain: "Traffic crosses public networks", fix: "Stays on Microsoft’s backbone" },
      { icon: "🏢", pain: "Office needs private access", fix: "Reach it over VPN or ExpressRoute" },
    ],
  },
  'load-balancer-application-gateway-front-door': {
    problem: "One server gets all the traffic while others sit idle, and global users get slow pages.",
    solution: "Spread traffic with Load Balancer, Application Gateway or Front Door.",
    tool: "Load Balancer · App Gateway · Front Door",
    pairs: [
      { icon: "🔥", pain: "One server overloaded", fix: "Traffic spread across many" },
      { icon: "🧭", pain: "Different URLs need different servers", fix: "Application Gateway routes by path" },
      { icon: "🌏", pain: "Users far from the region", fix: "Front Door sends them to the nearest region" },
    ],
  },
  'virtual-wan': {
    problem: "Hundreds of offices and networks connected point-to-point, making a fragile spaghetti network.",
    solution: "Connect everything to Microsoft-managed Virtual WAN hubs.",
    tool: "Azure Virtual WAN",
    pairs: [
      { icon: "🍝", pain: "A tangle of separate VPNs", fix: "One managed hub per region" },
      { icon: "🐢", pain: "Branch traffic via head office", fix: "Any-to-any transit" },
      { icon: "🛠️", pain: "Building hubs yourself", fix: "Microsoft manages the hub" },
    ],
  },
  'storage-accounts': {
    problem: "Images fill up VM disks and are impossible to share or scale.",
    solution: "Keep them in an Azure storage account built for massive, durable storage.",
    tool: "Azure Storage account",
    pairs: [
      { icon: "💾", pain: "VM disks keep filling up", fix: "Storage that grows automatically" },
      { icon: "🔗", pain: "Files not reachable by other apps", fix: "HTTPS endpoint for each service" },
      { icon: "🛡️", pain: "Fear of losing data", fix: "Multiple copies with redundancy" },
    ],
  },
  'blob-storage-and-tiers': {
    problem: "Years of rarely viewed videos cost as much to store as today’s files.",
    solution: "Use blob access tiers and lifecycle rules to move old data to cheaper tiers.",
    tool: "Blob Storage access tiers",
    pairs: [
      { icon: "💰", pain: "Paying hot prices for old data", fix: "Cool, Cold or Archive tiers" },
      { icon: "🗓️", pain: "Moving files by hand", fix: "Lifecycle management rules" },
      { icon: "⏳", pain: "Need old data occasionally", fix: "Rehydrate from Archive when needed" },
    ],
  },
  'files-queues-tables-disks': {
    problem: "An old file server is full, and app components crash when traffic spikes.",
    solution: "Use Azure Files for shares and Queue Storage to smooth out work.",
    tool: "Azure Files · Queues · Tables · Disks",
    pairs: [
      { icon: "🗄️", pain: "Ageing on-premises file server", fix: "Azure Files SMB shares" },
      { icon: "💥", pain: "Back end overwhelmed by spikes", fix: "Queue messages and process steadily" },
      { icon: "📋", pain: "Simple settings need a home", fix: "Table Storage" },
    ],
  },
  'storage-redundancy': {
    problem: "One datacenter incident could make critical data unavailable or lost.",
    solution: "Choose the right redundancy: ZRS for zones, GZRS for regions too.",
    tool: "LRS · ZRS · GRS · GZRS",
    pairs: [
      { icon: "🔥", pain: "Datacenter failure", fix: "ZRS copies across zones" },
      { icon: "🌪️", pain: "Regional disaster", fix: "GRS / GZRS copy to another region" },
      { icon: "👀", pain: "Need to read during an outage", fix: "RA-GRS / RA-GZRS" },
    ],
  },
  'moving-files': {
    problem: "Thousands of files need to get into Azure, and offices keep different copies.",
    solution: "Use AzCopy, Storage Explorer or Azure File Sync for the job.",
    tool: "AzCopy · Storage Explorer · File Sync",
    pairs: [
      { icon: "🔁", pain: "Nightly copies done by hand", fix: "Script them with AzCopy" },
      { icon: "🖱️", pain: "Not comfortable with commands", fix: "Storage Explorer GUI" },
      { icon: "🏢", pain: "Each office has different files", fix: "Azure File Sync" },
    ],
  },
  'azure-migrate-and-data-box': {
    problem: "Hundreds of servers to move, and uploading the data would take months.",
    solution: "Plan with Azure Migrate; ship bulk data with Azure Data Box.",
    tool: "Azure Migrate · Azure Data Box",
    pairs: [
      { icon: "❓", pain: "Don’t know what’s ready to move", fix: "Discover and assess with Azure Migrate" },
      { icon: "🐌", pain: "Uploading 300 TB takes months", fix: "Ship it on Data Box" },
      { icon: "📊", pain: "No overall progress view", fix: "One migration dashboard" },
    ],
  },
  'azure-databases': {
    problem: "The team runs its own database servers and spends nights patching and fixing backups.",
    solution: "Choose a managed Azure database such as SQL Database or Cosmos DB.",
    tool: "Azure SQL · Managed Instance · Cosmos DB",
    pairs: [
      { icon: "🩹", pain: "Patching database servers", fix: "PaaS databases are patched for you" },
      { icon: "🌍", pain: "Global users need fast data", fix: "Cosmos DB multi-region" },
      { icon: "🚚", pain: "Migrating old SQL Server", fix: "SQL Managed Instance" },
    ],
  },
  'microsoft-entra-id': {
    problem: "Staff juggle a different password for every app and keep getting locked out.",
    solution: "Use Microsoft Entra ID as one identity for every app.",
    tool: "Microsoft Entra ID",
    pairs: [
      { icon: "🔑", pain: "Dozens of passwords", fix: "One identity with single sign-on" },
      { icon: "🏢", pain: "On-premises accounts separate from cloud", fix: "Sync with Entra Connect" },
      { icon: "🧓", pain: "Legacy app needs a domain", fix: "Entra Domain Services" },
    ],
  },
  'authentication-methods': {
    problem: "Phished passwords let attackers walk straight into accounts.",
    solution: "Turn on MFA, single sign-on and passwordless sign-in.",
    tool: "SSO · MFA · Passwordless",
    pairs: [
      { icon: "🎣", pain: "Phished passwords", fix: "MFA needs a second factor" },
      { icon: "🤯", pain: "Too many logins", fix: "Single sign-on" },
      { icon: "🔓", pain: "Weak, reused passwords", fix: "Passwordless: Hello, passkeys" },
    ],
  },
  'external-identities': {
    problem: "IT creates and forgets accounts for every partner, and customers need yet another password.",
    solution: "Use external identities: B2B guests and customer sign-in.",
    tool: "Microsoft Entra External ID",
    pairs: [
      { icon: "🧾", pain: "Creating accounts for partners", fix: "Invite them as B2B guests" },
      { icon: "🧹", pain: "Old partner accounts never removed", fix: "Access reviews" },
      { icon: "🛒", pain: "Customers need easy sign-up", fix: "External ID for customers" },
    ],
  },
  'conditional-access': {
    problem: "Every sign-in is treated the same, from the office desk or an unknown country at 3 a.m.",
    solution: "Use Conditional Access policies based on signals.",
    tool: "Microsoft Entra Conditional Access",
    pairs: [
      { icon: "🌍", pain: "Sign-ins from risky places", fix: "Require MFA or block" },
      { icon: "💻", pain: "Unmanaged devices reach sensitive apps", fix: "Require a compliant device" },
      { icon: "👑", pain: "Admins with weak sign-in", fix: "MFA for all admins" },
    ],
  },
  'azure-rbac': {
    problem: "Everyone is an Owner, and a new hire deletes production by accident.",
    solution: "Assign least-privilege roles at the right scope with Azure RBAC.",
    tool: "Azure RBAC",
    pairs: [
      { icon: "👑", pain: "Everyone has full control", fix: "Contributor or Reader roles" },
      { icon: "🎯", pain: "Access too broad", fix: "Assign at the right scope" },
      { icon: "👥", pain: "Managing people one by one", fix: "Assign roles to groups" },
    ],
  },
  'zero-trust': {
    problem: "Once inside the network, an attacker can reach almost everything.",
    solution: "Adopt Zero Trust: verify explicitly, least privilege, assume breach.",
    tool: "Zero Trust model",
    pairs: [
      { icon: "🏰", pain: "Trusting everything inside", fix: "Verify every request" },
      { icon: "🔑", pain: "Broad standing access", fix: "Just-in-time, just-enough" },
      { icon: "🚶", pain: "Attackers move freely", fix: "Segment and monitor" },
    ],
  },
  'defense-in-depth': {
    problem: "One firewall is the only protection, and once it fails everything is exposed.",
    solution: "Protect every layer, from the building to the data.",
    tool: "Defense in depth",
    pairs: [
      { icon: "🧱", pain: "One wall of defence", fix: "Seven layers of protection" },
      { icon: "🌐", pain: "Attacks at the edge", fix: "DDoS Protection and firewalls" },
      { icon: "🗄️", pain: "Data stolen if reached", fix: "Encryption and access control" },
    ],
  },
  'microsoft-defender-for-cloud': {
    problem: "300 resources across two clouds, and nobody knows which ones are misconfigured.",
    solution: "Use Microsoft Defender for Cloud for posture and threat protection.",
    tool: "Microsoft Defender for Cloud",
    pairs: [
      { icon: "❓", pain: "No view of security weaknesses", fix: "Secure score and recommendations" },
      { icon: "🕵️", pain: "Attacks go unnoticed", fix: "Threat detection alerts" },
      { icon: "☁️", pain: "Several clouds to watch", fix: "Azure, AWS, GCP and on-premises" },
    ],
  },
  'factors-affecting-cost': {
    problem: "The bill doubled this month without any new features.",
    solution: "Understand the cost factors and check each one.",
    tool: "Azure cost factors",
    pairs: [
      { icon: "🗑️", pain: "Forgotten disks and IPs", fix: "Clean up orphaned resources" },
      { icon: "🌍", pain: "Expensive region chosen", fix: "Compare regional prices" },
      { icon: "📤", pain: "Data flowing out of Azure", fix: "Reduce egress and cross-region traffic" },
    ],
  },
  'pricing-calculator': {
    problem: "The manager wants a monthly cost before approving the project.",
    solution: "Build an estimate in the Azure pricing calculator.",
    tool: "Azure pricing calculator",
    pairs: [
      { icon: "🤷", pain: "Guessing the cost", fix: "Estimate each service" },
      { icon: "⚖️", pain: "Unsure which option is cheaper", fix: "Compare regions and pricing models" },
      { icon: "📧", pain: "Need to share numbers", fix: "Save and export the estimate" },
    ],
  },
  'tco-calculator': {
    problem: "Leaders think the old servers are free because they were already bought.",
    solution: "Compare total cost of ownership with the TCO calculator or Azure Migrate business case.",
    tool: "TCO calculator · Azure Migrate business case",
    pairs: [
      { icon: "🏷️", pain: "Only comparing purchase prices", fix: "Include power, space and staff" },
      { icon: "📉", pain: "No long-term view", fix: "Multi-year cost comparison" },
      { icon: "📊", pain: "Guesswork about servers", fix: "Business case from real discovery data" },
    ],
  },
  'cost-management': {
    problem: "A GPU VM ran for a month unnoticed until the invoice arrived.",
    solution: "Use Cost Management budgets, alerts and cost analysis.",
    tool: "Microsoft Cost Management",
    pairs: [
      { icon: "😱", pain: "Surprise invoices", fix: "Budget alerts at 50%, 80%, 100%" },
      { icon: "🔍", pain: "No idea what costs most", fix: "Cost analysis by resource and tag" },
      { icon: "💡", pain: "Missed savings", fix: "Advisor recommendations" },
    ],
  },
  'resource-tags': {
    problem: "Finance asks what Marketing spent, and nobody can tell.",
    solution: "Tag resources with owner, department and environment.",
    tool: "Resource tags",
    pairs: [
      { icon: "💸", pain: "Costs can’t be split by team", fix: "Group cost analysis by tag" },
      { icon: "👤", pain: "Unknown resource owners", fix: "owner tag on everything" },
      { icon: "🤖", pain: "Manual shutdowns", fix: "Automate by env=dev tag" },
    ],
  },
  'microsoft-purview': {
    problem: "Nobody knows where customer personal data is stored across dozens of systems.",
    solution: "Scan, classify and map data with Microsoft Purview.",
    tool: "Microsoft Purview",
    pairs: [
      { icon: "🗺️", pain: "Data scattered everywhere", fix: "One data map across sources" },
      { icon: "🏷️", pain: "Sensitive data not labelled", fix: "Automatic classification" },
      { icon: "🧾", pain: "Auditors ask where data flows", fix: "Data lineage reports" },
    ],
  },
  'azure-policy': {
    problem: "Teams keep creating resources in the wrong regions and without required settings.",
    solution: "Enforce standards automatically with Azure Policy.",
    tool: "Azure Policy",
    pairs: [
      { icon: "🌍", pain: "Resources in forbidden regions", fix: "Deny with allowed-locations policy" },
      { icon: "🏷️", pain: "Missing tags", fix: "Modify effect adds them" },
      { icon: "📋", pain: "Manual compliance checks", fix: "Live compliance dashboard" },
    ],
  },
  'resource-locks': {
    problem: "A clean-up script deletes the production resource group by mistake.",
    solution: "Put Delete or ReadOnly locks on critical resources.",
    tool: "Resource locks",
    pairs: [
      { icon: "🗑️", pain: "Accidental deletion", fix: "Delete lock blocks it" },
      { icon: "✏️", pain: "Unwanted changes", fix: "ReadOnly lock" },
      { icon: "👑", pain: "Admins can do anything", fix: "Locks apply even to Owners" },
    ],
  },
  'azure-portal': {
    problem: "New users don’t know where to start, and managers want to see status without commands.",
    solution: "Use the Azure portal and custom dashboards.",
    tool: "Azure portal",
    pairs: [
      { icon: "🤔", pain: "Don’t know command-line tools", fix: "Point-and-click wizards" },
      { icon: "📊", pain: "No overview of health and cost", fix: "Custom dashboards" },
      { icon: "⌨️", pain: "Sometimes need a quick command", fix: "Cloud Shell built into the portal" },
    ],
  },
  'cloud-shell-cli-powershell': {
    problem: "Engineers click through the same setup again and again, making mistakes.",
    solution: "Script it with Azure CLI or PowerShell, run in Cloud Shell.",
    tool: "Azure CLI · PowerShell · Cloud Shell",
    pairs: [
      { icon: "🖱️", pain: "Hundreds of repetitive clicks", fix: "One script" },
      { icon: "💻", pain: "Tools not installed on this PC", fix: "Cloud Shell in the browser" },
      { icon: "❌", pain: "Human mistakes", fix: "Same result every time" },
    ],
  },
  'azure-arc': {
    problem: "Servers in the datacenter, Azure and another cloud each have different tools and rules.",
    solution: "Connect them all with Azure Arc and manage them from Azure.",
    tool: "Azure Arc",
    pairs: [
      { icon: "🧰", pain: "Different tools for each environment", fix: "One Azure control plane" },
      { icon: "📜", pain: "Inconsistent policies", fix: "Azure Policy everywhere" },
      { icon: "🛡️", pain: "Security gaps on-premises", fix: "Defender for Cloud via Arc" },
    ],
  },
  'infrastructure-as-code': {
    problem: "Test and production were built by hand and behave differently.",
    solution: "Define infrastructure in code with Bicep, ARM templates or Terraform.",
    tool: "Infrastructure as code",
    pairs: [
      { icon: "🧩", pain: "Environments don’t match", fix: "Same code, same result" },
      { icon: "📅", pain: "New regions take weeks", fix: "Deploy from templates in hours" },
      { icon: "🕵️", pain: "No record of changes", fix: "Version control and reviews" },
    ],
  },
  'azure-resource-manager': {
    problem: "Resources made in different tools end up inconsistent and hard to control.",
    solution: "Rely on Azure Resource Manager and declarative templates.",
    tool: "Azure Resource Manager · ARM templates",
    pairs: [
      { icon: "🔀", pain: "Different tools, different results", fix: "All go through ARM" },
      { icon: "🔐", pain: "Access checked inconsistently", fix: "ARM enforces RBAC and Policy" },
      { icon: "🔁", pain: "Redeployments create duplicates", fix: "Idempotent templates" },
    ],
  },
  'azure-advisor': {
    problem: "Bills grow and risks pile up, but nobody has time to review every resource.",
    solution: "Follow Azure Advisor’s personalised recommendations.",
    tool: "Azure Advisor",
    pairs: [
      { icon: "💸", pain: "Paying for idle VMs", fix: "Cost recommendations to resize or shut down" },
      { icon: "💾", pain: "No backups on critical servers", fix: "Reliability recommendations" },
      { icon: "🔓", pain: "Security gaps", fix: "Security recommendations" },
    ],
  },
  'service-health-and-azure-status': {
    problem: "The team debugs its own code for an hour during an Azure regional incident.",
    solution: "Use Service Health and Resource Health alerts.",
    tool: "Azure Service Health",
    pairs: [
      { icon: "🕵️", pain: "Unsure if Azure has a problem", fix: "Service Health for your regions" },
      { icon: "🔧", pain: "Surprised by maintenance", fix: "Planned maintenance notices" },
      { icon: "🖥️", pain: "Is my VM healthy?", fix: "Resource Health" },
    ],
  },
  'azure-monitor': {
    problem: "The site slows down at night and nobody knows why or when.",
    solution: "Collect metrics and logs with Azure Monitor and set meaningful alerts.",
    tool: "Azure Monitor · Log Analytics · App Insights",
    pairs: [
      { icon: "❓", pain: "No data to investigate", fix: "Metrics and logs in one place" },
      { icon: "🔍", pain: "Searching logs by hand", fix: "Log Analytics with KQL" },
      { icon: "🌙", pain: "Problems found by customers", fix: "Alerts and Application Insights" },
    ],
  },
  'slas-and-service-lifecycle': {
    problem: "A team builds production payments on a preview feature with no uptime promise.",
    solution: "Check SLAs and use generally available services for production.",
    tool: "SLAs · Preview → GA",
    pairs: [
      { icon: "🧪", pain: "Preview features in production", fix: "Wait for general availability" },
      { icon: "🔢", pain: "Unsure how much downtime to expect", fix: "Read the SLA percentage" },
      { icon: "🔗", pain: "Several services depend on each other", fix: "Multiply SLAs, add redundancy" },
    ],
  },
};
