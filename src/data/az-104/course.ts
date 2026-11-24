/**
 * AZ-104 course details copy: the "understand before you start" page at /az-104/.
 * Exam facts come from syllabus.ts; this file holds the course's own promise.
 */
import type { CourseInfo } from '../types';

export const COURSE: CourseInfo = {
  title: 'Microsoft AZ-104: Azure Administrator Associate',
  subtitle: 'Run Azure for real: Entra users and RBAC, Azure Policy, storage security, VMs and Bicep, App Service and containers, VNets, NSGs and load balancers, monitoring and backup. No Azure account needed.',
  intro: [
    'AZ-104 earns the Microsoft Certified: Azure Administrator Associate certification. It is the hands-on exam for people who keep an Azure environment running: who gets access, where data lives and who can reach it, how VMs and web apps are built and scaled, how traffic flows through virtual networks, and what happens when something breaks at 2 AM.',
    'This course follows the official skills outline topic by topic. Every lesson starts with a 30-second answer, then lets you do the task in an Azure portal walkthrough, watch it happen in a 3D scene and repeat it in a practice lab with a simulated portal and Cloud Shell. Azure CLI and PowerShell commands sit next to the portal steps, because the exam expects both, and a quiz closes each lesson.',
  ],
  audience: [
    { icon: '🛠️', title: 'System administrators', text: 'You run Windows or Linux servers, Active Directory or VMware today and want to run the same things in Azure.' },
    { icon: '🎓', title: 'AZ-900 graduates', text: 'You know what a resource group and a VNet are. Now you want to configure them, secure them and fix them.' },
    { icon: '🧑‍💻', title: 'Developers and DevOps engineers', text: 'You deploy to Azure and want to understand RBAC, networking, storage access and monitoring properly.' },
    { icon: '🤖', title: 'AI engineers', text: 'You plan to run AI workloads yourself and want the platform depth: identity, private networking, storage and backup.' },
  ],
  outcomes: [
    'Create and manage Microsoft Entra users and groups, licenses, guest users and self-service password reset',
    'Assign built-in Azure roles at the right scope and read effective access like an auditor',
    'Govern subscriptions with Azure Policy, locks, tags, management groups, budgets and Advisor',
    'Secure storage with firewalls, SAS tokens, stored access policies, access keys and identity-based Azure Files access',
    'Configure redundancy, object replication, encryption, tiers, lifecycle rules, soft delete, snapshots and versioning',
    'Read, edit, deploy and export ARM templates and Bicep files',
    'Build VMs with the right size, disks, encryption at host, zones, availability sets and scale sets, and move them',
    'Provision Container Registry, Container Instances and Container Apps, and run web apps on App Service with TLS, custom domains, backups, VNet integration and slots',
    'Build VNets, peering, routes, NSGs, ASGs, Bastion, service and private endpoints, Azure DNS and load balancers, and troubleshoot them',
    'Monitor with metrics, KQL, alerts and Network Watcher, and protect workloads with Azure Backup and Site Recovery',
  ],
  requirements: [
    'Basic networking (IP addresses, subnets, DNS, ports) and some server administration experience',
    'Azure fundamentals help a lot: resource groups, regions, subscriptions. Our AZ-900 course covers them free',
    'No PowerShell or Azure CLI experience required: every command is explained and practised in the labs',
    'No Azure subscription or credit card: every lab runs in a simulator in your browser',
  ],
  roadmap: [
    { title: 'Week 1: Identity and governance', text: 'Entra users and groups, licenses, guests, SSPR, RBAC roles and scopes, Azure Policy, locks, tags, management groups and cost controls.' },
    { title: 'Week 2: Storage', text: 'Storage firewalls, SAS and stored access policies, access keys, Azure Files identity access, redundancy, replication, encryption, AzCopy, tiers, lifecycle, soft delete and versioning.' },
    { title: 'Week 3: Compute', text: 'ARM templates and Bicep, VM sizes, disks and encryption at host, moving VMs, zones, availability sets and scale sets, containers, and App Service from plans to slots.' },
    { title: 'Week 4: Networking', text: 'VNets, peering, public IPs, user-defined routes, NSGs and ASGs, Bastion, service and private endpoints, Azure DNS, load balancers and troubleshooting.' },
    { title: 'Week 5: Monitoring and backup', text: 'Metrics, diagnostic settings, KQL, alerts and action groups, Insights, Network Watcher, Recovery Services and Backup vaults, restores and Site Recovery.' },
    { title: 'Exam week: Mock exams and revision', text: 'Take full mock exams until you score 80% or more twice, read the cheat sheet and the exam day guide, then book.' },
  ],
  faq: [
    { q: 'Is this AZ-104 course free?', a: 'Yes. Every lesson, simulation, lab, quiz, mock exam and the practice certificate is free. Signing in is optional and only syncs your progress.' },
    { q: 'Do I need AZ-900 before AZ-104?', a: 'No, AZ-900 is not a prerequisite. If resource groups, regions and subscriptions are new to you, our free AZ-900 course is a quick way to get the basics first.' },
    { q: 'Do I need an Azure account?', a: 'No. The portal walkthroughs, 3D scenes and Cloud Shell are simulations in your browser, so there is no bill and no sign-up. When you are ready, a free Azure account lets you repeat the labs for real.' },
    { q: 'How much PowerShell and Azure CLI is on the exam?', a: 'You should recognise common Azure CLI and Azure PowerShell commands and know what they do. Each lesson shows the portal steps next to the CLI or PowerShell equivalent, and the labs make you type them.' },
    { q: 'Are these real AZ-104 exam questions?', a: 'No. Every question here is original and written to practise the skills in the official outline. We never publish real, recalled or leaked exam questions.' },
    { q: 'Is the practice certificate a Microsoft certification?', a: 'No. It is an MSDEVBUILD practice certificate that shows you passed our mock exam. To become Microsoft certified you sit AZ-104 with Microsoft.' },
  ],
  hubs: {
    compare: 'AZ-104 comparisons: SAS vs access keys vs Entra ID, service endpoints vs private endpoints, availability sets vs zones, Recovery Services vs Backup vaults and more.',
    games: 'Learn AZ-104 the fun way: sort roles, storage options, network controls and backup tools, Who Am I riddles and a daily challenge, with XP.',
    servicesTitle: 'Azure Administrator Services Reference',
    services: 'Every AZ-104 service in 60 seconds: Entra ID, Azure Policy, Storage, Azure Files, VMs, scale sets, App Service, Container Apps, Load Balancer, Bastion, Azure Monitor, Backup and Site Recovery.',
    sandboxTitle: 'AZ-104 Sandbox: Free Azure Administrator Simulator | MSDEVBUILD',
    whoAmI: 'Who Am I? Guess the Azure Administrator Service Game | MSDEVBUILD',
  },
  labs: {
    title: 'AZ-104 Practice Labs: Free Azure Administrator Simulator | MSDEVBUILD',
    description: 'Free AZ-104 hands-on labs: assign RBAC roles, lock down storage with SAS and firewalls, build VMs and VNets, fix NSG rules and set up backup. No account.',
    h1: 'AZ-104 Practice Labs',
    intro: 'A safe, simulated Azure portal and Cloud Shell in your browser. Create users and assign roles, apply policies, secure storage, deploy Bicep, build VMs, scale sets and web apps, wire VNets, routes and load balancers, and back it all up.',
    shell: [
      ['az role assignment create --assignee anna@contoso.com --role "Virtual Machine Contributor" -g rg-web', '"roleDefinitionName": "Virtual Machine Contributor"'],
      ['az storage account update -n stcontosoprod -g rg-data --default-action Deny', '"networkRuleSet": { "defaultAction": "Deny" }'],
    ],
  },
};
