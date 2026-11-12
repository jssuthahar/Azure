/**
 * Exam-format practice items for the AZ-900 mock exam: Yes/No statement series,
 * drag-and-drop matching, build-a-list ordering and drop-down sentence
 * completion. Every item is ORIGINAL, written for this site from the official
 * skills outline. None are real, recalled or leaked Microsoft exam questions.
 */
export interface Base { id: string; domain: number; objective?: string; scenario?: string; explanation: string }
export interface YesNo extends Base { kind: 'yesno'; statements: { text: string; answer: boolean }[] }
export interface Match extends Base { kind: 'match'; question: string; itemsLabel: string; items: string[]; targets: { text: string; answer: number }[] }
export interface Order extends Base { kind: 'order'; question: string; actions: string[]; answer: number[] }
export interface Dropdown extends Base { kind: 'dropdown'; question: string; parts: (string | { options: string[]; answer: number })[] }
export type FormatItem = YesNo | Match | Order | Dropdown;

export const EXAM_ITEMS: FormatItem[] = [
  /* ---------------- Domain 1: cloud concepts ---------------- */
  { kind: 'yesno', id: 'x1-yn-shared', domain: 1, objective: '1.1.2', statements: [
    { text: 'In the shared responsibility model, Microsoft is responsible for the physical security of datacenters for every service type.', answer: true },
    { text: 'When you use a SaaS application, you are responsible for patching its operating system.', answer: false },
    { text: 'For every service type, the customer remains responsible for their data and their accounts.', answer: true },
  ], explanation: 'The physical datacenter is always Microsoft’s. With SaaS the provider patches everything below the app. Information and data, devices, and accounts and identities always stay with the customer.' },
  { kind: 'yesno', id: 'x1-yn-scale', domain: 1, objective: '1.2.1', statements: [
    { text: 'Elasticity means resources can be added or removed automatically as demand changes.', answer: true },
    { text: 'Scaling up means adding more virtual machines to share the load.', answer: false },
    { text: 'Scaling a virtual machine vertically can require it to restart.', answer: true },
  ], explanation: 'Adding more machines is scaling **out** (horizontal). Scaling **up** gives one machine more CPU/memory, which usually restarts it. Elasticity is scaling automatically with demand.' },
  { kind: 'yesno', id: 'x1-yn-cost', domain: 1, objective: '1.1.5', statements: [
    { text: 'With a consumption-based model, you pay only for the resources you use.', answer: true },
    { text: 'Buying servers for your own datacenter is an operational expenditure (OpEx).', answer: false },
    { text: 'Azure reservations reduce the price in exchange for a one-year or three-year commitment.', answer: true },
  ], explanation: 'Buying hardware up front is **capital** expenditure (CapEx). Pay-as-you-go cloud spending is OpEx. Reservations trade a 1- or 3-year commitment for a lower price.' },
  { kind: 'match', id: 'x1-dd-models', domain: 1, objective: '1.1.3', itemsLabel: 'Cloud models', question: 'Match each cloud model to its description. To answer, drag the appropriate model to each description. Each model may be used once, more than once, or not at all.',
    items: ['Public cloud', 'Private cloud', 'Hybrid cloud', 'Multicloud'],
    targets: [
      { text: 'Resources are owned and operated by a third-party provider and shared by many organizations.', answer: 0 },
      { text: 'Resources are used exclusively by a single organization.', answer: 1 },
      { text: 'On-premises resources are connected to a public cloud so workloads can move between them.', answer: 2 },
    ], explanation: 'Public = provider-owned, shared. Private = one organization. Hybrid = public + private working together. Multicloud (several public providers) is a distractor here.' },
  { kind: 'match', id: 'x1-dd-services', domain: 1, objective: '1.3.1', itemsLabel: 'Service types', question: 'Match each example to the correct cloud service type. To answer, drag the appropriate service type to each example. Each service type may be used once, more than once, or not at all.',
    items: ['IaaS', 'PaaS', 'SaaS'],
    targets: [
      { text: 'Microsoft 365 email for your staff', answer: 2 },
      { text: 'A virtual machine on which you install and patch your own software', answer: 0 },
      { text: 'Azure App Service hosting your company website', answer: 1 },
      { text: 'Azure SQL Database', answer: 1 },
    ], explanation: 'A VM is IaaS. App Service and Azure SQL Database are PaaS (you bring code and data). Microsoft 365 is SaaS.' },
  { kind: 'dropdown', id: 'x1-sel-ha', domain: 1, objective: '1.2.2', question: 'To complete the sentence, select the appropriate option in the answer area.', parts: [
    'An application that keeps running when one datacenter in the region fails demonstrates ',
    { options: ['elasticity', 'high availability', 'scalability', 'predictability'], answer: 1 }, '.',
  ], explanation: 'Staying up through a failure is **high availability**. Elasticity and scalability are about handling demand; predictability is about performance and cost.' },
  { kind: 'dropdown', id: 'x1-sel-capex', domain: 1, objective: '1.1.5', question: 'To complete the sentence, select the appropriate options in the answer area.', parts: [
    'Moving from buying your own servers to pay-as-you-go cloud services shifts spending from ',
    { options: ['capital expenditure (CapEx)', 'operational expenditure (OpEx)'], answer: 0 }, ' to ',
    { options: ['capital expenditure (CapEx)', 'operational expenditure (OpEx)'], answer: 1 }, '.',
  ], explanation: 'Up-front purchases of hardware are CapEx; renting cloud services as you use them is OpEx.' },
  { kind: 'dropdown', id: 'x1-sel-serverless', domain: 1, objective: '1.1.6', question: 'To complete the sentence, select the appropriate option in the answer area.', parts: [
    'With serverless computing such as Azure Functions on a Consumption plan, you are billed ',
    { options: ['for every hour the server exists', 'only while your code runs', 'a fixed monthly fee per function'], answer: 1 }, '.',
  ], explanation: 'Serverless is event-driven: no events, no executions, no compute charge.' },

  /* ---------------- Domain 2: architecture and services ---------------- */
  { kind: 'yesno', id: 'x2-yn-regions', domain: 2, objective: '2.1.1', statements: [
    { text: 'The two regions in an Azure region pair are in the same geography.', answer: true },
    { text: 'Every Azure region supports availability zones.', answer: false },
    { text: 'Each availability zone has independent power, cooling and networking.', answer: true },
  ], explanation: 'Region pairs stay within one geography (data residency). Many, but not all, regions have zones. Zones are independent by design.' },
  { kind: 'yesno', id: 'x2-yn-rg', domain: 2, objective: '2.1.2', statements: [
    { text: 'A resource can belong to more than one resource group at the same time.', answer: false },
    { text: 'A resource group can contain resources that are located in different regions.', answer: true },
    { text: 'Deleting a resource group deletes every resource in it.', answer: true },
  ], explanation: 'Each resource is in exactly one resource group. The group’s region only stores metadata. Deleting the group deletes its contents.' },
  { kind: 'yesno', id: 'x2-yn-net', domain: 2, objective: '2.3.3', statements: [
    { text: 'Azure ExpressRoute connections travel over the public internet.', answer: false },
    { text: 'A site-to-site VPN sends traffic through an encrypted IPsec tunnel.', answer: true },
    { text: 'Traffic between peered virtual networks travels over the Microsoft backbone network.', answer: true },
  ], explanation: 'ExpressRoute is a private connection through a provider and does not use the internet. VPN Gateway uses IPsec over the internet. Peering uses Microsoft’s backbone with private IPs.' },
  { kind: 'yesno', id: 'x2-yn-identity', domain: 2, objective: '2.5.2', statements: [
    { text: 'Microsoft Entra ID supports multifactor authentication.', answer: true },
    { text: 'Conditional Access can block sign-ins based on the user’s location.', answer: true },
    { text: 'Azure role-based access control (RBAC) is used to deny deployments to unapproved regions.', answer: false },
  ], explanation: 'Restricting regions is **Azure Policy**, not RBAC. RBAC controls who can perform which actions.' },
  { kind: 'match', id: 'x2-dd-storage', domain: 2, objective: '2.4.1', itemsLabel: 'Storage services', question: 'Match each requirement to the Azure storage service that meets it. To answer, drag the appropriate service to each requirement. Each service may be used once, more than once, or not at all.',
    items: ['Blob Storage', 'Azure Files', 'Queue Storage', 'Managed Disks', 'Table Storage'],
    targets: [
      { text: 'Shared folders mounted over SMB by several servers', answer: 1 },
      { text: 'Messages passed between parts of an application', answer: 2 },
      { text: 'Unstructured data such as images and videos', answer: 0 },
      { text: 'The operating system disk of a virtual machine', answer: 3 },
    ], explanation: 'SMB share = Azure Files. Messages = Queue Storage. Unstructured objects = Blob. VM disk = Managed Disks. Table Storage is the distractor.' },
  { kind: 'match', id: 'x2-dd-network', domain: 2, objective: '2.3.2', itemsLabel: 'Networking services', question: 'Match each requirement to the networking service that meets it. To answer, drag the appropriate service to each requirement. Each service may be used once, more than once, or not at all.',
    items: ['VPN Gateway', 'ExpressRoute', 'Virtual network peering', 'Network security group', 'Azure DNS'],
    targets: [
      { text: 'Allow or deny inbound traffic to a subnet by port', answer: 3 },
      { text: 'A private connection to Azure that does not use the internet', answer: 1 },
      { text: 'Connect two Azure virtual networks with private IP addresses', answer: 2 },
      { text: 'Host the name records for your domain', answer: 4 },
    ], explanation: 'Port filtering = NSG. No internet = ExpressRoute. VNet-to-VNet = peering. Name records = Azure DNS. VPN Gateway is unused.' },
  { kind: 'match', id: 'x2-dd-redundancy', domain: 2, objective: '2.4.2', itemsLabel: 'Redundancy options', question: 'Match each storage redundancy option to its description. To answer, drag the appropriate option to each description. Each option may be used once, more than once, or not at all.',
    items: ['LRS', 'ZRS', 'GRS', 'GZRS'],
    targets: [
      { text: 'Three copies in a single datacenter in the primary region', answer: 0 },
      { text: 'Copies spread across three availability zones in the primary region only', answer: 1 },
      { text: 'Copies in one datacenter in the primary region plus copies in the paired region', answer: 2 },
      { text: 'Copies across zones in the primary region plus copies in the paired region', answer: 3 },
    ], explanation: 'L = local (one datacenter), Z = zones, G = geo (second region), GZ = both.' },
  { kind: 'match', id: 'x2-dd-compute', domain: 2, objective: '2.2.1', itemsLabel: 'Compute services', question: 'Match each requirement to the compute service that meets it. To answer, drag the appropriate service to each requirement. Each service may be used once, more than once, or not at all.',
    items: ['Virtual Machines', 'App Service', 'Azure Functions', 'Azure Kubernetes Service (AKS)', 'Azure Virtual Desktop'],
    targets: [
      { text: 'Run code in response to an event without managing any servers', answer: 2 },
      { text: 'Orchestrate many containers at scale', answer: 3 },
      { text: 'Full control over the operating system', answer: 0 },
      { text: 'Stream Windows desktops to remote users', answer: 4 },
    ], explanation: 'Event-driven code = Functions. Container orchestration = AKS. OS control = VMs. Desktops = Azure Virtual Desktop. App Service is unused.' },
  { kind: 'order', id: 'x2-ord-rbac', domain: 2, objective: '2.5.3', question: 'A user named Ben must be able to manage only the virtual machines in a resource group named rg-web. Which three actions should you perform in sequence? To answer, move the appropriate actions from the list of actions to the answer area and arrange them in the correct order.',
    actions: ['Open the rg-web resource group in the Azure portal', 'Create a new subscription for Ben', 'Select Access control (IAM) and then Add role assignment', 'Select the Virtual Machine Contributor role and assign it to Ben', 'Assign the Allowed locations policy'],
    answer: [0, 2, 3], explanation: 'Go to the **scope** (rg-web), open **Access control (IAM)**, then assign the least-privilege **role** to the user. A new subscription or a policy does not grant access.' },
  { kind: 'order', id: 'x2-ord-vpn', domain: 2, objective: '2.3.3', question: 'You need to connect an on-premises office to an Azure virtual network by using a site-to-site VPN. Which four actions should you perform in sequence? To answer, move the appropriate actions from the list of actions to the answer area and arrange them in the correct order.',
    actions: ['Create a virtual network that includes a GatewaySubnet', 'Create an ExpressRoute circuit', 'Create a virtual network gateway of type VPN', 'Create a local network gateway that represents the office VPN device', 'Create a private endpoint', 'Create a connection between the virtual network gateway and the local network gateway'],
    answer: [0, 2, 3, 5], explanation: 'The gateway needs a VNet with a GatewaySubnet; then the VPN gateway, the local network gateway (the office side), and finally the connection with a shared key. ExpressRoute and private endpoints are not part of a site-to-site VPN.' },
  { kind: 'dropdown', id: 'x2-sel-pe', domain: 2, objective: '2.3.4', question: 'To complete the sentence, select the appropriate option in the answer area.', parts: [
    'To give an Azure Storage account a private IP address inside your virtual network, you create a ',
    { options: ['public IP address', 'private endpoint', 'network security group', 'VPN gateway'], answer: 1 }, '.',
  ], explanation: 'A private endpoint maps the service to a private IP in your subnet.' },
  { kind: 'dropdown', id: 'x2-sel-rg', domain: 2, objective: '2.1.2', question: 'To complete the sentence, select the appropriate option in the answer area.', parts: [
    'A ', { options: ['management group', 'subscription', 'resource group', 'region'], answer: 2 }, ' is a logical container for resources that share the same lifecycle.',
  ], explanation: 'Resource groups hold resources you deploy, manage and delete together.' },
  { kind: 'dropdown', id: 'x2-sel-containers', domain: 2, objective: '2.2.2', question: 'To complete the sentence, select the appropriate options in the answer area.', parts: [
    'Azure Container Instances is best for ', { options: ['running a single container quickly', 'orchestrating many containers at scale', 'streaming virtual desktops'], answer: 0 },
    ', while Azure Kubernetes Service is best for ', { options: ['running a single container quickly', 'orchestrating many containers at scale', 'streaming virtual desktops'], answer: 1 }, '.',
  ], explanation: 'ACI runs one container with no cluster. AKS orchestrates containers across node pools.' },
  { kind: 'dropdown', id: 'x2-sel-mfa', domain: 2, objective: '2.5.2', question: 'To complete the sentence, select the appropriate option in the answer area.', parts: [
    'Users must sign in with a password and then approve a notification on their phone. This is an example of ',
    { options: ['single sign-on (SSO)', 'multifactor authentication (MFA)', 'role-based access control (RBAC)', 'a resource lock'], answer: 1 }, '.',
  ], explanation: 'Something you know (password) plus something you have (phone) is MFA.' },

  /* ---------------- Domain 3: management and governance ---------------- */
  { kind: 'yesno', id: 'x3-yn-gov', domain: 3, objective: '3.2.2', statements: [
    { text: 'Azure Policy can prevent resources from being created in a specific region.', answer: true },
    { text: 'A user with the Owner role must remove a delete lock before deleting the locked resource.', answer: true },
    { text: 'Tags applied to a resource group are automatically inherited by every resource in it.', answer: false },
  ], explanation: 'Policy can deny non-compliant deployments. Locks apply to everyone, including Owners. Tags are **not** inherited automatically (use a policy to inherit them).' },
  { kind: 'yesno', id: 'x3-yn-cost', domain: 3, objective: '3.1.2', statements: [
    { text: 'The Azure Pricing Calculator estimates the cost of Azure services before you deploy them.', answer: true },
    { text: 'The TCO Calculator compares the cost of running workloads on-premises with running them in Azure.', answer: true },
    { text: 'Data transferred into Azure datacenters (ingress) is normally charged per GB.', answer: false },
  ], explanation: 'Use the Pricing Calculator to estimate Azure costs and the TCO Calculator to compare with on-premises. Inbound data transfer is generally free; outbound (egress) is charged.' },
  { kind: 'yesno', id: 'x3-yn-monitor', domain: 3, objective: '3.4.1', statements: [
    { text: 'Azure Advisor provides recommendations about cost, security, reliability, operational excellence and performance.', answer: true },
    { text: 'The public Azure status page shows personalized information about your own resources.', answer: false },
    { text: 'An Azure Monitor alert can notify an action group by email.', answer: true },
  ], explanation: 'Advisor covers five categories. The Azure status page is public and general; **Service Health** is personalized. Alerts notify action groups (email, SMS, webhooks…).' },
  { kind: 'match', id: 'x3-dd-tools', domain: 3, objective: '3.3.1', itemsLabel: 'Tools', question: 'Match each description to the correct tool. To answer, drag the appropriate tool to each description. Each tool may be used once, more than once, or not at all.',
    items: ['Azure portal', 'Azure CLI', 'Azure PowerShell', 'Azure Cloud Shell', 'ARM templates / Bicep'],
    targets: [
      { text: 'A browser-based terminal with management tools already installed', answer: 3 },
      { text: 'Declarative files that deploy identical environments repeatedly', answer: 4 },
      { text: 'A web-based graphical user interface', answer: 0 },
      { text: 'Cmdlets such as New-AzVM and Get-AzResourceGroup', answer: 2 },
    ], explanation: 'Cloud Shell runs in the browser. Templates/Bicep are infrastructure as code. The portal is the GUI. Verb-Noun cmdlets are PowerShell. The Azure CLI is unused.' },
  { kind: 'match', id: 'x3-dd-gov', domain: 3, objective: '3.2.1', itemsLabel: 'Governance features', question: 'Match each requirement to the feature that meets it. To answer, drag the appropriate feature to each requirement. Each feature may be used once, more than once, or not at all.',
    items: ['Azure Policy', 'Resource locks', 'Azure RBAC', 'Tags', 'Management groups'],
    targets: [
      { text: 'Prevent accidental deletion of a production resource group', answer: 1 },
      { text: 'Control which users can manage virtual machines', answer: 2 },
      { text: 'Allow only approved virtual machine sizes', answer: 0 },
      { text: 'Report costs by department', answer: 3 },
      { text: 'Apply the same governance rules to many subscriptions', answer: 4 },
    ], explanation: 'Locks prevent deletion, RBAC controls who, Policy controls what, tags categorize (cost by department), management groups organise subscriptions.' },
  { kind: 'match', id: 'x3-dd-monitoring', domain: 3, objective: '3.4.1', itemsLabel: 'Services', question: 'Match each scenario to the service that provides it. To answer, drag the appropriate service to each scenario. Each service may be used once, more than once, or not at all.',
    items: ['Azure Advisor', 'Azure Monitor', 'Azure Service Health', 'Microsoft Defender for Cloud', 'Cost Management'],
    targets: [
      { text: 'A recommendation to resize an underused virtual machine', answer: 0 },
      { text: 'An alert when a virtual machine’s CPU stays above 80%', answer: 1 },
      { text: 'A notification about planned maintenance in your region', answer: 2 },
      { text: 'A secure score for your subscription', answer: 3 },
      { text: 'A budget alert at 80% of monthly spending', answer: 4 },
    ], explanation: 'Advisor recommends, Monitor alerts on metrics, Service Health reports Azure events, Defender gives secure score, Cost Management handles budgets.' },
  { kind: 'order', id: 'x3-ord-policy', domain: 3, objective: '3.2.2', question: 'Your company must allow resources only in European regions across a subscription. Which four actions should you perform in sequence? To answer, move the appropriate actions from the list of actions to the answer area and arrange them in the correct order.',
    actions: ['Open Azure Policy', 'Add a delete lock to the subscription', 'Select the built-in Allowed locations policy definition', 'Assign the definition at the subscription scope and choose the European regions as parameters', 'Add the tag Region=EU to every resource group', 'Review the compliance results'],
    answer: [0, 2, 3, 5], explanation: 'Find the built-in definition, assign it at the right scope with parameters, then check compliance. Locks and tags do not restrict regions.' },
  { kind: 'order', id: 'x3-ord-budget', domain: 3, objective: '3.1.3', question: 'You need to be emailed when monthly spending reaches 80% of 500 USD. Which four actions should you perform in sequence? To answer, move the appropriate actions from the list of actions to the answer area and arrange them in the correct order.',
    actions: ['Open Cost Management', 'Purchase a one-year reservation', 'Select Budgets and then Add', 'Set the amount to 500 USD with a monthly reset period', 'Open Azure Advisor', 'Add an alert condition at 80% with your email address'],
    answer: [0, 2, 3, 5], explanation: 'Budgets live in Cost Management: create one, set amount and period, then add alert conditions and recipients.' },
  { kind: 'dropdown', id: 'x3-sel-iac', domain: 3, objective: '3.3.3', question: 'To complete the sentence, select the appropriate option in the answer area.', parts: [
    'To deploy identical environments repeatedly from a file that describes the resources, use ',
    { options: ['Azure Advisor', 'infrastructure as code such as Bicep or ARM templates', 'Azure Monitor', 'resource locks'], answer: 1 }, '.',
  ], explanation: 'Declarative templates (Bicep/ARM) are infrastructure as code.' },
  { kind: 'dropdown', id: 'x3-sel-arc', domain: 3, objective: '3.3.2', question: 'To complete the sentence, select the appropriate option in the answer area.', parts: [
    'To manage servers that run in your own datacenter with Azure Policy and Microsoft Defender for Cloud, use ',
    { options: ['Azure Arc', 'Azure Migrate', 'Azure ExpressRoute', 'Azure Virtual Desktop'], answer: 0 }, '.',
  ], explanation: 'Azure Arc projects on-premises and multicloud servers into Azure for management.' },
  { kind: 'dropdown', id: 'x3-sel-sla', domain: 3, objective: '3.4.2', question: 'To complete the sentence, select the appropriate options in the answer area.', parts: [
    'Features in ', { options: ['public preview', 'general availability (GA)'], answer: 0 },
    ' are usually not covered by a service level agreement, while features in ', { options: ['public preview', 'general availability (GA)'], answer: 1 }, ' are.',
  ], explanation: 'Previews are offered "as is" without an SLA; generally available services carry SLAs.' },
];
