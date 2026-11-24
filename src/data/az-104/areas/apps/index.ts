/**
 * AZ-104 "apps" area: Azure Container Registry, Container Instances,
 * Container Apps and App Service from the administrator's side (objectives
 * 3.3.1–3.3.4 and 3.4.1–3.4.8). The merge files in src/data/az-104/*.ts
 * import these names. Exam items are ORIGINAL, written from the skills
 * outline. Prices ($) are illustrative and shown in the learner's currency.
 */
import type { LessonSims } from '../../../az-900/lesson-sims';
import type { Sim3D } from '../../../az-900/sims3d';
import type { ProblemSolution } from '../../../az-900/problem-solution';
import type { FormatItem } from '../../../az-900/exam-items';
import type { SortSet, Riddle } from '../../../az-900/games';
import type { Comparison } from '../../../az-900/compare';
import type { Service } from '../../../az-900/services';
export { TOURS } from './tours';

/** Lesson slug → 3D step (adminapps) and portal walkthrough. */
export const SIMS: Record<string, LessonSims> = {
  'container-registry-and-instances': { d3: { mode: 'adminapps', start: 0, intro: 'Run the job, flood it with traffic, then try a geo-replica.' }, tour: { id: 'adm-acr-aci-create', intro: 'Create a registry, then run a container group from it.' } },
  'container-apps-for-admins': { d3: { mode: 'adminapps', start: 1, intro: 'Send a burst of requests, then let it go quiet.' }, tour: { id: 'adm-container-app-scale', intro: 'Size a container app and give it an HTTP scale rule.' } },
  'app-service-plans-and-scaling': { d3: { mode: 'adminapps', start: 2, intro: 'Scale out, then scale up. The next step adds autoscale.' }, tour: { id: 'adm-app-plan-scale', intro: 'Create a plan and a web app, then scale up and out.' } },
  'app-service-tls-and-custom-domains': { d3: { mode: 'adminapps', start: 4, intro: 'Try the domain before and after the DNS records.' }, tour: { id: 'adm-app-domain-tls', intro: 'Map www, add a managed certificate and enforce TLS 1.2.' } },
  'app-service-backup-and-networking': { d3: { mode: 'adminapps', start: 6, intro: 'Back it up and restore, then step on to networking.' }, tour: { id: 'adm-app-backup-network', intro: 'Set a daily backup, VNet integration and an office-only rule.' } },
  'app-service-deployment-slots': { d3: { mode: 'adminapps', start: 8, intro: 'Swap staging into production, then roll back.' }, tour: { id: 'adm-app-slots-swap', intro: 'Add a staging slot, mark slot settings and swap.' } },
};

/** Narration for the 'adminapps' 3D scene. Step order matches src/lib/dc3d/admin/adminapps.ts. */
export const SCENE: Sim3D = {
  title: 'Run apps on Azure: containers and App Service, the administrator’s view',
  steps: [
    { title: 'A registry feeds Container Instances', text: '**Azure Container Registry** stores your private images. **Container Instances** runs them as a **container group** with the **CPU and memory you set** and a **restart policy**: Always, OnFailure or Never. It doesn’t scale itself, and only **Premium** registries can **geo-replicate**.', actions: [{ id: 'run', label: '▶️ …we run the nightly job (OnFailure)?', kind: 'ok' }, { id: 'spike', label: '🔥 …traffic triples on the ACI container?', kind: 'danger' }, { id: 'replicate', label: '🌍 …we add a West Europe replica? (try twice)', kind: 'plain' }] },
    { title: 'Container Apps scale on HTTP traffic', text: 'Each **replica** gets an allowed **CPU and memory** pair (0.5 vCPU with 1 Gi here). An **HTTP scale rule** adds a replica per 50 concurrent requests, between **min** and **max replicas**. With **min 0**, a quiet app **scales to zero**.', actions: [{ id: 'load', label: '📈 …400 users arrive at once?', kind: 'ok' }, { id: 'quiet', label: '🌙 …traffic stops?', kind: 'plain' }] },
    { title: 'The plan is the VMs', text: 'An **App Service plan** is a set of VMs. Every app on the plan runs on every instance. **Scale out** adds instances (Basic: up to 3). **Scale up** moves to a bigger or richer **tier**, which also decides the features you get.', actions: [{ id: 'out', label: '➕ …we scale out?', kind: 'ok' }, { id: 'up', label: '⬆️ …we scale up to Standard?', kind: 'ok' }] },
    { title: 'Autoscale rules (Standard and up)', text: 'On **Standard** or **Premium**, a **rules-based autoscale** setting watches a metric such as **CPU Percentage** and adds or removes instances between a **minimum** and **maximum**, with a **cool-down** so it doesn’t flap.', actions: [{ id: 'cpu', label: '🔥 …CPU stays above 70% for 10 minutes?', kind: 'danger' }, { id: 'max', label: '🧱 …demand keeps growing?', kind: 'plain' }] },
    { title: 'Prove you own the domain', text: 'To map **www.contoso-learn.com**, App Service needs a **TXT** record **asuid.www** holding the app’s **verification ID**, plus a **CNAME** from www to the app (an **A** record for the root domain). Free tier can’t do custom domains.', actions: [{ id: 'unverified', label: '❌ …we add the domain with no DNS records?', kind: 'danger' }, { id: 'verify', label: '✅ …the TXT and CNAME records exist?', kind: 'ok' }] },
    { title: 'Certificate, HTTPS Only, TLS 1.2', text: 'A free **App Service managed certificate** (Basic and up, no wildcards, not exportable) is bound with **SNI SSL**. **HTTPS Only** redirects HTTP, and the **minimum TLS version** (1.2 by default) turns away old clients.', actions: [{ id: 'https', label: '🔒 …someone opens http://www.contoso-learn.com?', kind: 'ok' }, { id: 'oldtls', label: '🕰️ …a TLS 1.0 client connects?', kind: 'danger' }] },
    { title: 'Back up to your own storage', text: '**Automatic backups** run hourly with no setup. **Custom backups** write files, configuration and linked databases (up to 10 GB) to a **blob container** you own, on demand or on a **schedule** with **retention**. Basic tier and up.', actions: [{ id: 'backup', label: '🗃️ …the daily backup runs?', kind: 'ok' }, { id: 'restore', label: '♻️ …a release breaks the app and we restore?', kind: 'plain' }] },
    { title: 'Outbound and inbound are different switches', text: '**VNet integration** is **outbound**: the app reaches private resources through a delegated subnet. **Inbound** is controlled by **access restrictions** (allow and deny rules by priority) or a **private endpoint**.', actions: [{ id: 'outbound', label: '🛢️ …the app calls the private database?', kind: 'ok' }, { id: 'office', label: '🏢 …the office opens the app?', kind: 'ok' }, { id: 'stranger', label: '🌐 …someone on the internet tries?', kind: 'danger' }] },
    { title: 'Staging slot, warm-up, swap', text: 'A **deployment slot** (Standard: 5, Premium v3: 20) is a live copy of the app. Deploy to **staging**, then **swap**: App Service warms staging up first, so users never hit a cold start. **Slot settings** stay with their slot.', actions: [{ id: 'swap', label: '🔁 …we swap staging into production?', kind: 'ok' }, { id: 'rollback', label: '⏪ …v2 has a bug?', kind: 'danger' }] },
  ],
};

const ps = (problem: string, solution: string, tool: string, pairs: [string, string, string][]): ProblemSolution => ({ problem, solution, tool, pairs: pairs.map(([icon, pain, fix]) => ({ icon, pain, fix })) });
export const PROBLEMS: Record<string, ProblemSolution> = {
  'container-registry-and-instances': ps('A nightly job runs on a VM that sits idle 23 hours a day.', 'Keep the image in a private registry and run it in Container Instances only when needed.', 'ACR + Container Instances', [['💸', 'Paying for an idle VM', 'Per-second billing, restart policy OnFailure'], ['🔓', 'Images on a public hub', 'Private registry with AcrPull'], ['🌍', 'Slow pulls in Europe', 'Premium geo-replication']]),
  'container-apps-for-admins': ps('The orders API needs 1 replica at night and 20 on sale day.', 'Run it in Container Apps with an HTTP scale rule and min replicas 0.', 'Container Apps scale rules', [['🌙', 'Idle replicas cost money', 'Scale to zero'], ['📈', 'Sale-day traffic', 'HTTP concurrency rule'], ['💥', 'Runaway bill', 'Max replicas cap']]),
  'app-service-plans-and-scaling': ps('Black Friday is coming and the shop runs on one small instance.', 'Pick the right plan tier, then scale out with autoscale rules.', 'App Service plan scaling', [['🐢', 'One busy instance', 'Scale out'], ['🧰', 'Missing features', 'Scale up a tier'], ['🙈', 'Nobody watching at 3 AM', 'Autoscale rules']]),
  'app-service-tls-and-custom-domains': ps('Customers see app-contoso-www01.azurewebsites.net and a browser warning on your own name.', 'Verify the domain with DNS, bind a certificate, and force HTTPS with TLS 1.2.', 'Custom domains and TLS', [['🔤', 'Ugly default URL', 'CNAME + asuid TXT'], ['⚠️', 'Certificate warning', 'Managed certificate, SNI binding'], ['🕳️', 'Plain HTTP and old TLS', 'HTTPS Only, minimum TLS 1.2']]),
  'app-service-backup-and-networking': ps('A bad release wiped config, and the app can’t reach the private database.', 'Schedule custom backups, add VNet integration, and restrict inbound access.', 'Backups, VNet integration, access restrictions', [['🗑️', 'No copy to restore', 'Daily custom backup'], ['🔒', 'Database is private', 'VNet integration (outbound)'], ['🌐', 'Open to the internet', 'Access restrictions or private endpoint']]),
  'app-service-deployment-slots': ps('Every release means a minute of errors while the app restarts.', 'Deploy to a staging slot, let it warm up, then swap.', 'Deployment slots', [['🥶', 'Cold starts after deploy', 'Swap warms up first'], ['⏪', 'Slow rollback', 'Swap back in seconds'], ['🔀', 'Prod settings leak to test', 'Slot settings stay put']]),
};

export const ITEMS: FormatItem[] = [
  { kind: 'yesno', id: 'adm-x3-app-yn-tiers', domain: 3, objective: '3.4.2', statements: [
    { text: 'An App Service plan in the Basic tier can use rules-based autoscale.', answer: false },
    { text: 'Scaling out an App Service plan adds instances that run every app in the plan.', answer: true },
    { text: 'A Standard tier App Service plan supports up to five deployment slots per app in addition to production.', answer: true },
  ], explanation: 'Rules-based **autoscale** starts at **Standard**; Basic scales out manually to 3 instances. Scaling applies to the **plan**, so every app on it runs on every instance. **Standard** gives **5** slots and Premium v3 gives **20**.' },
  { kind: 'order', id: 'adm-x3-app-order-domain', domain: 3, objective: '3.4.5', question: 'You need to map www.contoso.com to an existing web app and serve it over HTTPS by using a free certificate. Which four actions should you perform in sequence?', actions: ['Create a TXT record named asuid.www that contains the custom domain verification ID', 'Create a CNAME record for www that points to the default domain of the app', 'Add the custom domain to the web app and validate it', 'Create an App Service managed certificate and bind it with SNI SSL', 'Scale the App Service plan down to the Free tier'], answer: [0, 1, 2, 3], explanation: 'Create the **asuid** TXT record (ownership) and the **CNAME** (routing) first, then add and validate the hostname. A managed certificate can only be issued for a hostname that is already added. The Free tier does not support custom domains.' },
  { kind: 'dropdown', id: 'adm-x3-app-dd-containers', domain: 3, objective: '3.3.4', question: 'Complete the configuration.', parts: [
    'A batch container must run once each night, stop when it exits successfully, and run again only if it fails. In Azure Container Instances, set the restart policy to ',
    { options: ['Always', 'OnFailure', 'Never'], answer: 1 },
    '. An API in Azure Container Apps must stop all replicas when there is no traffic. Set the minimum replicas to ',
    { options: ['0', '1', '10'], answer: 0 },
    ' and use a scale rule of type ',
    { options: ['HTTP', 'CPU', 'memory'], answer: 0 },
    '.',
  ], explanation: '**OnFailure** restarts the container only if it exits with an error. **Min replicas 0** allows scale to zero, and an **HTTP** rule can wake the app; CPU and memory rules cannot scale to zero.' },
  { kind: 'match', id: 'adm-x3-app-match-tier', domain: 3, objective: '3.4.1', question: 'Match each requirement to the lowest App Service plan tier that meets it. Each tier may be used once, more than once, or not at all.', itemsLabel: 'Tiers', items: ['Free (F1)', 'Basic (B1)', 'Standard (S1)', 'Premium v3 (P1v3)'], targets: [
    { text: 'Bind a custom domain to an App Service managed certificate', answer: 1 },
    { text: 'Scale out automatically based on CPU percentage', answer: 2 },
    { text: 'Use 15 deployment slots for one app', answer: 3 },
    { text: 'Connect the app to a virtual network for outbound traffic', answer: 1 },
  ], explanation: '**Basic** adds custom domains with TLS bindings and VNet integration. **Standard** adds autoscale and 5 slots. **Premium v3** allows 20 slots. Free supports none of these.' },
  { kind: 'yesno', id: 'adm-x3-app-yn-slots', domain: 3, objective: '3.4.8', statements: [
    { text: 'An app setting marked as a deployment slot setting moves to the production slot when you swap.', answer: false },
    { text: 'During a swap, App Service warms up the source slot instances before it switches traffic.', answer: true },
    { text: 'Custom domain names and TLS bindings are swapped together with the app content.', answer: false },
  ], explanation: 'A **slot setting** sticks to its slot. A swap applies the target’s settings to the source, **warms up** its instances, then switches routing. Custom domains, non-public certificates and TLS settings **stay** with the slot.' },
  { kind: 'yesno', id: 'adm-x3-app-yn-network', domain: 3, objective: '3.4.7', statements: [
    { text: 'Virtual network integration lets clients in the virtual network reach the web app privately.', answer: false },
    { text: 'Access restriction rules are evaluated in priority order, lowest number first.', answer: true },
    { text: 'Custom App Service backups are written to a blob container in a storage account.', answer: true },
  ], explanation: '**VNet integration** is **outbound** only; for private **inbound** access use a **private endpoint**. Access restrictions run in **priority** order. **Custom backups** go to a blob container you choose.' },
];

export const SORT: SortSet[] = [
  {
    id: 'adm-app-tiers', title: 'Which App Service tier do you need?', icon: '📄', intro: 'Sort each feature into the lowest plan tier that has it.', topic: 'app-service-plans-and-scaling',
    buckets: ['Basic', 'Standard', 'Premium v3'],
    items: [
      { text: 'Custom domain with a TLS certificate', bucket: 0, why: 'Basic is the first tier with TLS bindings.' },
      { text: 'VNet integration for outbound calls', bucket: 0, why: 'Available from Basic.' },
      { text: 'Custom backups to a storage account', bucket: 0, why: 'Backup and restore start at Basic.' },
      { text: 'Autoscale on CPU percentage', bucket: 1, why: 'Rules-based autoscale starts at Standard.' },
      { text: 'Five deployment slots', bucket: 1, why: 'Standard allows 5 slots.' },
      { text: '20 deployment slots', bucket: 2, why: 'Premium v3 allows 20.' },
      { text: 'Up to 30 instances', bucket: 2, why: 'Standard stops at 10, Premium v3 goes to 30.' },
    ],
  },
];

export const RIDDLES: Riddle[] = [
  { answer: 'Azure Container Registry', topic: 'container-registry-and-instances', clues: ['I keep your container images private.', 'My login server ends in azurecr.io.', 'Only my Premium tier can copy me to other regions.'] },
  { answer: 'Azure Container Instances', topic: 'container-registry-and-instances', clues: ['I run a container group in seconds, with no VM to manage.', 'You fix my CPU and memory when you create me.', 'My restart policy can be Always, OnFailure or Never.'] },
  { answer: 'Azure Container Apps', topic: 'container-apps-for-admins', clues: ['I live inside an environment with my neighbours.', 'I add replicas as HTTP requests pile up.', 'Set my minimum to zero and I cost nothing when idle.'] },
  { answer: 'App Service plan', topic: 'app-service-plans-and-scaling', clues: ['I am the set of VMs your web apps share.', 'Scale me up for features, out for instances.', 'My tier decides whether you get autoscale and slots.'] },
  { answer: 'Deployment slot', topic: 'app-service-deployment-slots', clues: ['I am a live copy of your web app with my own hostname.', 'You test in me before going live.', 'Swap me with production and I warm up first.'] },
];

export const COMPARE: Comparison[] = [
  {
    slug: 'container-instances-vs-container-apps-vs-app-service',
    title: 'Container Instances vs Container Apps vs App Service',
    seoTitle: 'Container Instances vs Container Apps vs App Service | AZ-104',
    description: 'Azure Container Instances vs Container Apps vs App Service for administrators: sizing, scaling, restart policies, slots, domains and when each one fits on AZ-104.',
    answer: 'Use **Container Instances** for a single container group that runs on demand with fixed CPU and memory, like a nightly job. Use **Container Apps** for container APIs and workers that must **scale on traffic or events**, down to zero. Use **App Service** for web apps that need **deployment slots, custom domains with TLS and backups** on a plan you scale yourself.',
    cols: ['Container Instances', 'Container Apps', 'App Service'],
    rows: [
      ['What you run', 'A container group (one or more containers)', 'Container apps in a shared environment', 'Web apps from code or a container on an App Service plan'],
      ['Sizing', 'CPU and memory fixed at creation', 'CPU and memory pair per replica', 'The plan’s tier and instance size'],
      ['Scaling', 'None built in; run more groups', 'Scale rules (HTTP, TCP, events) between min and max replicas', 'Manual scale out; autoscale rules from Standard'],
      ['Scale to zero', 'Stops when the job ends (OnFailure or Never)', 'Yes, with min replicas 0', 'No, the plan always runs'],
      ['Releases', 'Redeploy the group', 'Revisions and traffic splitting', 'Deployment slots and swap'],
      ['Billing', 'Per second of vCPU and memory', 'Per vCPU-second and GiB-second (Consumption)', 'Per plan instance per hour'],
    ],
    pick: [['Container Instances', 'a short job or a simple container that runs and stops'], ['Container Apps', 'traffic goes up and down and you want scale to zero'], ['App Service', 'a web app needs slots, custom domains, TLS and backups']],
    examTip: '“Must scale automatically on HTTP requests and scale to zero” = **Container Apps**. “Runs once and stops, billed per second” = **Container Instances** with **OnFailure** or **Never**. “Swap staging and production” = **App Service** slots (Standard or higher).',
    sim: { mode: 'adminapps', start: 0, tour: 'adm-acr-aci-create', intro: 'Run a job in ACI, then flood it. Step on to see Container Apps scale.' },
    lessons: ['container-registry-and-instances', 'container-apps-for-admins', 'app-service-plans-and-scaling'],
    faq: [['Can I change the CPU of a running container group?', 'No. CPU, memory and the restart policy are fixed; you delete and recreate the group with new values.'], ['Do Container Apps need a registry?', 'They pull images from any registry. With Azure Container Registry, give the app a managed identity with AcrPull instead of an admin password.']],
  },
  {
    slug: 'app-service-scale-up-vs-scale-out',
    title: 'App Service scale up vs scale out',
    seoTitle: 'App Service Scale Up vs Scale Out Explained | AZ-104',
    description: 'Scale up vs scale out for an Azure App Service plan: what changes, tier limits, autoscale rules, cost and the exam wording that tells you which one is meant.',
    answer: '**Scale up** changes the plan’s **tier or size**: more CPU and memory per instance and more features (autoscale, slots, zone redundancy). **Scale out** changes the **number of instances**, by hand or with **autoscale rules** from Standard up. Both act on the **App Service plan**, so every app on it is affected.',
    cols: ['Scale up', 'Scale out'],
    rows: [
      ['What changes', 'Tier and instance size', 'Number of instances'],
      ['Where in the portal', 'Scale up (App Service plan)', 'Scale out (App Service plan)'],
      ['Automatic?', 'No, you choose a tier', 'Yes from Standard (rules-based), manual on Basic'],
      ['Limits', 'Tiers from Free to Isolated v2', 'Basic 3, Standard 10, Premium v3 30 instances'],
      ['Unlocks features', 'Yes: Standard adds autoscale and slots', 'No'],
      ['CLI', 'az appservice plan update --sku S1', 'az appservice plan update --number-of-workers 3'],
    ],
    pick: [['Scale up', 'one instance is too small, or you need a feature the tier lacks'], ['Scale out', 'load is spread over many requests and you want more copies']],
    examTip: '“Add instances when CPU is high” = **scale out** with an **autoscale rule**, which needs **Standard or higher**. “Need deployment slots on a Basic plan” = **scale up** to Standard first.',
    sim: { mode: 'adminapps', start: 2, tour: 'adm-app-plan-scale', intro: 'Scale out, then scale up, then trigger an autoscale rule.' },
    lessons: ['app-service-plans-and-scaling', 'app-service-deployment-slots'],
    faq: [['Does scaling restart my app?', 'Scaling up moves the app to new instances, so it restarts. Scaling out adds instances and leaves the running ones alone.'], ['Can I scale one app on a shared plan?', 'Not by itself. Move the busy app to its own plan, then scale that plan.']],
  },
];

export const SERVICES: Service[] = [
  { slug: 'azure-container-registry', name: 'Azure Container Registry', cat: 'Containers', icon: '🐳', model: 'Managed registry', what: 'A private registry for container images and artifacts. Tiers decide included storage and features: Premium adds geo-replication and private endpoints. Access is controlled with Microsoft Entra ID roles such as AcrPull.', use: ['Private images for ACI, Container Apps, App Service and AKS', 'Importing public base images into your own registry', 'Replicating images close to teams in other regions (Premium)'], avoid: ['Public images you only pull and never change'], feel: 1, price: 'Basic ≈ $5/month, Standard ≈ $20/month, Premium ≈ $50/month per registry (illustrative)', sim: { mode: 'adminapps', start: 0, tour: 'adm-acr-aci-create', intro: 'Try a geo-replica on Standard, then on Premium.' }, similar: ['azure-container-instances', 'azure-container-apps'], aws: 'Amazon ECR', lesson: 'container-registry-and-instances', compare: 'container-instances-vs-container-apps-vs-app-service' },
  { slug: 'azure-container-instances', name: 'Azure Container Instances', cat: 'Containers', icon: '📦', model: 'Serverless containers', what: 'Runs a container group in seconds without a VM or cluster. You set CPU, memory and a restart policy (Always, OnFailure, Never) when you create it, and pay per second while it runs. It doesn’t autoscale.', use: ['Nightly jobs and one-off tasks', 'Simple single-container services', 'Build agents and test runs'], avoid: ['Apps that must scale with traffic (Container Apps)', 'Web apps that need slots and custom domains (App Service)'], feel: 1, price: 'Per second of vCPU and memory; 1 vCPU and 1.5 GB for an hour ≈ $0.05 (illustrative)', sim: { mode: 'adminapps', start: 0, tour: 'adm-acr-aci-create', intro: 'Run the job, then flood it with traffic.' }, similar: ['azure-container-apps', 'azure-container-registry'], aws: 'AWS Fargate (run task)', lesson: 'container-registry-and-instances', compare: 'container-instances-vs-container-apps-vs-app-service' },
  { slug: 'azure-container-apps', name: 'Azure Container Apps', cat: 'Containers', icon: '🧊', model: 'Serverless containers', what: 'Runs container apps in a shared environment without managing Kubernetes. Each replica gets a CPU and memory pair; scale rules on HTTP, TCP or events add replicas between min and max, down to zero.', use: ['APIs with spiky traffic', 'Queue workers that idle at night', 'Microservices that share one environment'], avoid: ['Workloads that need the Kubernetes API (AKS)'], feel: 2, price: 'Consumption: monthly free grant, then about $0.000024 per vCPU-second (illustrative)', sim: { mode: 'adminapps', start: 1, tour: 'adm-container-app-scale', intro: 'Send 400 users, then let it scale to zero.' }, similar: ['azure-container-instances', 'azure-app-service-admin'], aws: 'AWS App Runner / ECS on Fargate', lesson: 'container-apps-for-admins', compare: 'container-instances-vs-container-apps-vs-app-service' },
  { slug: 'azure-app-service-admin', name: 'Azure App Service', cat: 'Compute', icon: '🌐', model: 'PaaS', what: 'Hosts web apps and APIs on an App Service plan, a set of VMs whose tier decides instances and features: custom domains and TLS from Basic, autoscale and slots from Standard, more slots and zone redundancy on Premium v3.', use: ['Web apps that need slots and zero-downtime swaps', 'Sites on a custom domain with a free managed certificate', 'Apps that call private resources through VNet integration'], avoid: ['Jobs that run once and stop (Container Instances)', 'Workloads that should scale to zero (Container Apps)'], feel: 2, price: 'Basic B1 ≈ $13/month, Standard S1 ≈ $73/month, Premium v3 P1v3 ≈ $124/month per instance (illustrative, Linux)', sim: { mode: 'adminapps', start: 2, tour: 'adm-app-plan-scale', intro: 'Scale out, scale up, then autoscale.' }, similar: ['azure-container-apps', 'azure-container-instances'], aws: 'AWS Elastic Beanstalk', lesson: 'app-service-plans-and-scaling', compare: 'app-service-scale-up-vs-scale-out' },
];
