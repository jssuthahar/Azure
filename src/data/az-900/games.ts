/**
 * Content for the Play & Learn games. Kept separate from code, like the
 * question banks. Every item must be unambiguous and match what the lessons teach.
 */

export interface SortSet {
  id: string;
  title: string;
  icon: string;
  intro: string;
  topic: string; // lesson slug to revise
  buckets: string[];
  items: { text: string; bucket: number; why: string }[];
}

export const SORT_SETS: SortSet[] = [
  {
    id: 'service-types',
    title: 'IaaS, PaaS or SaaS?',
    icon: '🍕',
    intro: 'Put each Microsoft service in the right cloud service type.',
    topic: 'choosing-iaas-paas-saas',
    buckets: ['IaaS', 'PaaS', 'SaaS'],
    items: [
      { text: 'Azure Virtual Machines', bucket: 0, why: 'You manage the OS: classic IaaS.' },
      { text: 'Virtual Machine Scale Sets', bucket: 0, why: 'Groups of IaaS VMs.' },
      { text: 'Azure App Service', bucket: 1, why: 'Managed platform for your web apps.' },
      { text: 'Azure SQL Database', bucket: 1, why: 'Managed database engine: PaaS.' },
      { text: 'Azure Cosmos DB', bucket: 1, why: 'Managed NoSQL database: PaaS.' },
      { text: 'Azure Container Apps', bucket: 1, why: 'Run containers without managing servers: PaaS.' },
      { text: 'Microsoft 365', bucket: 2, why: 'Finished software you just use.' },
      { text: 'Dynamics 365', bucket: 2, why: 'Ready-made CRM/ERP: SaaS.' },
      { text: 'Outlook.com', bucket: 2, why: 'Email as a finished service.' },
    ],
  },
  {
    id: 'capex-opex',
    title: 'CapEx or OpEx?',
    icon: '💰',
    intro: 'Is it a big up-front purchase (CapEx) or ongoing pay-as-you-go spending (OpEx)?',
    topic: 'capex-vs-opex',
    buckets: ['CapEx', 'OpEx'],
    items: [
      { text: 'Buying 20 servers for the office', bucket: 0, why: 'Up-front purchase of physical assets.' },
      { text: 'Building a new datacenter', bucket: 0, why: 'Large capital investment.' },
      { text: 'Buying network switches', bucket: 0, why: 'Owned hardware, depreciated over years.' },
      { text: 'Replacing all servers every five years', bucket: 0, why: 'A hardware refresh is a capital cost.' },
      { text: 'Your monthly Azure bill', bucket: 1, why: 'Ongoing spending for services used.' },
      { text: 'A pay-as-you-go virtual machine', bucket: 1, why: 'Billed for usage.' },
      { text: 'A SaaS subscription per user per month', bucket: 1, why: 'Recurring operational spending.' },
      { text: 'Paying per GB of storage each month', bucket: 1, why: 'Consumption-based cost.' },
    ],
  },
  {
    id: 'cloud-models',
    title: 'Public, private or hybrid?',
    icon: '☁️',
    intro: 'Which cloud model fits each situation?',
    topic: 'hybrid-cloud',
    buckets: ['Public', 'Private', 'Hybrid'],
    items: [
      { text: 'A start-up launches an app with no hardware budget', bucket: 0, why: 'No CapEx, fast start: public cloud.' },
      { text: 'Dev/test environments created and deleted every day', bucket: 0, why: 'On-demand, pay-as-you-go: public.' },
      { text: 'A game expecting unpredictable worldwide traffic', bucket: 0, why: 'Massive, elastic scale: public.' },
      { text: 'Cloud-style self-service on dedicated hardware in your own datacenter', bucket: 1, why: 'Single-tenant: private cloud.' },
      { text: 'Rules require hardware used only by your organisation', bucket: 1, why: 'Exclusive use: private cloud.' },
      { text: 'Core banking stays on-premises; the mobile app runs in Azure', bucket: 2, why: 'On-premises + public, connected: hybrid.' },
      { text: 'On-premises shop bursts into the cloud on Black Friday', bucket: 2, why: 'Cloud bursting is a hybrid pattern.' },
    ],
  },
  {
    id: 'responsibility',
    title: 'Who is responsible? (Azure VM)',
    icon: '🤝',
    intro: 'For an Azure virtual machine (IaaS), is each job yours or Microsoft’s?',
    topic: 'shared-responsibility-model',
    buckets: ['You', 'Microsoft'],
    items: [
      { text: 'Patching the guest operating system', bucket: 0, why: 'In IaaS the OS is yours.' },
      { text: 'Deciding who can sign in', bucket: 0, why: 'Accounts and identities are always yours.' },
      { text: 'Classifying your data', bucket: 0, why: 'Data is always yours.' },
      { text: 'Network security group rules', bucket: 0, why: 'Network controls are yours in IaaS.' },
      { text: 'Security guards at the datacenter', bucket: 1, why: 'Physical security is always Microsoft’s.' },
      { text: 'Replacing a failed physical server', bucket: 1, why: 'Physical hosts are Microsoft’s.' },
      { text: 'Cabling inside the datacenter', bucket: 1, why: 'Physical network is Microsoft’s.' },
    ],
  },
  {
    id: 'benefits',
    title: 'Name that benefit!',
    icon: '🚀',
    intro: 'Scalability, elasticity, high availability or reliability?',
    topic: 'elasticity',
    buckets: ['Scalability', 'Elasticity', 'High availability', 'Reliability'],
    items: [
      { text: 'An admin resizes a VM to more CPUs before a sale', bucket: 0, why: 'Manually changing capacity: scalability.' },
      { text: 'Adding more web servers to handle growth', bucket: 0, why: 'Adjusting resources to demand: scalability.' },
      { text: 'Autoscale adds instances when CPU passes 70%', bucket: 1, why: 'Automatic, real-time scaling: elasticity.' },
      { text: 'Functions scale to zero when nobody uses them', bucket: 1, why: 'Automatic shrink with demand: elasticity.' },
      { text: 'The app runs across three availability zones to stay up', bucket: 2, why: 'Redundancy for maximum uptime: HA.' },
      { text: 'A 99.99% uptime SLA', bucket: 2, why: 'SLAs measure availability.' },
      { text: 'Failing over to another region after a disaster', bucket: 3, why: 'Recovering and continuing to work: reliability.' },
      { text: 'Tested backups and disaster-recovery drills', bucket: 3, why: 'Ability to recover from failure: reliability.' },
    ],
  },
];

export interface Riddle {
  answer: string;
  clues: [string, string, string];
  topic?: string;
}

export const RIDDLES: Riddle[] = [
  { answer: 'Azure Functions', topic: 'serverless', clues: ['I run your code only when something happens.', 'Timers, queues and HTTP requests can wake me up.', 'I am serverless compute, and you can pay me per execution.'] },
  { answer: 'Azure Arc', topic: 'hybrid-cloud', clues: ['I help you manage things that are not in Azure.', 'I work in your datacenter and in other clouds.', 'With me, Azure Policy can govern a server running somewhere else.'] },
  { answer: 'Azure ExpressRoute', topic: 'hybrid-cloud', clues: ['I connect your office network to Azure.', 'I never travel over the public internet.', 'You order me through a connectivity provider for a private, dedicated link.'] },
  { answer: 'Azure VPN Gateway', clues: ['I connect your network to Azure too.', 'I use the public internet, but I keep traffic encrypted.', 'Site-to-site and point-to-site are my favourite tricks.'] },
  { answer: 'Azure Policy', topic: 'governance', clues: ['I check whether resources follow your rules.', 'I can deny a resource created in the wrong region.', 'Group several of me together and you get an initiative.'] },
  { answer: 'Azure Advisor', clues: ['I study what you have already deployed.', 'I give tips on cost, security, reliability, performance and operations.', 'I might tell you that a VM is much bigger than it needs to be.'] },
  { answer: 'Azure Blob Storage', clues: ['I store huge amounts of unstructured data.', 'Images, videos and backups love living with me.', 'My access tiers are hot, cool, cold and archive.'] },
  { answer: 'Microsoft Entra ID', clues: ['I know who you are.', 'Single sign-on and multifactor authentication are my jobs.', 'My old name was Azure Active Directory.'] },
  { answer: 'Resource locks', topic: 'governance', clues: ['I exist to stop accidents.', 'Even an Owner cannot delete what I protect until I am removed.', 'I come in two flavours: Delete and ReadOnly.'] },
  { answer: 'Azure Virtual Desktop', clues: ['I give people a computer screen they can reach from anywhere.', 'Company data stays in Azure while staff use their own devices.', 'I deliver Windows desktops and apps from the cloud.'] },
  { answer: 'Azure Data Box', clues: ['I am a real, physical object.', 'When the internet is too slow, I travel by courier instead.', 'Load me with terabytes of data and ship me to Microsoft.'] },
  { answer: 'Azure Service Health', clues: ['I keep an eye on Azure itself, not your app.', 'I tell you about incidents and planned maintenance.', 'I only show what affects your regions and services.'] },
  { answer: 'Microsoft Cost Management', topic: 'predictability', clues: ['I watch your money.', 'Budgets and alerts are my speciality.', 'I show where every bit of your Azure spend goes.'] },
  { answer: 'Azure pricing calculator', topic: 'predictability', clues: ['I help you before you build anything.', 'Pick services, sizes and regions, and I do the maths.', 'I estimate what your monthly bill might be.'] },
  { answer: 'Availability zones', topic: 'high-availability', clues: ['I live inside an Azure region.', 'I have my own power, cooling and networking.', 'Spread your app across three of me to survive a datacenter failure.'] },
  { answer: 'Microsoft Defender for Cloud', topic: 'security', clues: ['I am a security guard for your workloads.', 'I give you a secure score and recommendations.', 'I protect Azure, on-premises and even other clouds.'] },
  { answer: 'Azure Cloud Shell', topic: 'manageability', clues: ['I live inside your web browser.', 'I already have Azure CLI and Azure PowerShell installed.', 'Open me from the portal and start typing commands.'] },
  { answer: 'Microsoft Purview', clues: ['I care about data, wherever it lives.', 'I discover and classify sensitive information.', 'Data governance, risk and compliance are my world.'] },
];
