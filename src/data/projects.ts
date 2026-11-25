/**
 * Guided projects (/projects/): real-world builds that chain existing labs in
 * order. Progress comes from completed labs (progress.ts `labs`), so nothing
 * new is stored. Every lab id must exist in src/lib/sim/labs.ts.
 */
export interface ProjectStep { lab: string; why: string }
export interface Project { id: string; icon: string; title: string; story: string; outcome: string; level: 'Beginner' | 'Intermediate'; exams: string[]; steps: ProjectStep[] }

export const PROJECTS: Project[] = [
  {
    id: 'startup-on-azure', icon: '🚀', title: 'Put a small startup on Azure', level: 'Beginner', exams: ['az-900'],
    story: 'A two-person bakery wants its order site in the cloud without a surprise bill. You set up the basics properly from day one.',
    outcome: 'A web app, safe storage, a lock on production and a budget alert, plus the habit of checking cost.',
    steps: [
      { lab: 'first-resource-group', why: 'Every project starts with a home for its resources.' },
      { lab: 'cloud-shell-webapp', why: 'Get the order site online from the command line.' },
      { lab: 'storage-redundancy', why: 'Keep product photos safe even if a datacenter fails.' },
      { lab: 'locks-and-tags', why: 'Stop anyone deleting production by accident.' },
      { lab: 'monitor-alerts', why: 'Hear about problems, and about spending, before customers do.' },
      { lab: 'cost-detective', why: 'Find the forgotten resource that quietly costs money.' },
    ],
  },
  {
    id: 'secure-web-app', icon: '🌐', title: 'Launch a secure web app', level: 'Intermediate', exams: ['az-104'],
    story: 'Marketing needs a new campaign site by Friday. It has to be on its own domain with HTTPS, survive a bad deployment and alert the team if it slows down.',
    outcome: 'A scaled App Service with slots, a custom domain and TLS, backups and private networking, locked-down network rules and alerts.',
    steps: [
      { lab: 'adm-net-nsg-asg', why: 'Decide what traffic is allowed before anything goes live.' },
      { lab: 'adm-app-service-plan', why: 'Pick a plan that scales and use a staging slot for safe releases.' },
      { lab: 'adm-app-service-domain-tls', why: 'Put the site on its own domain with a certificate.' },
      { lab: 'adm-app-service-backup-network', why: 'Back it up and keep its back end off the public internet.' },
      { lab: 'adm-ops-alerts-insights', why: 'Alert the team when response times climb.' },
    ],
  },
  {
    id: 'landing-zone', icon: '🏛️', title: 'Build a governed landing zone', level: 'Intermediate', exams: ['az-104'],
    story: 'Contoso is moving three teams to Azure. Before anyone deploys, you set up who can do what, the rules everyone follows and a network they all share.',
    outcome: 'Role assignments at the right scopes, policy and budgets, a hub and spoke network with private access, and central logging.',
    steps: [
      { lab: 'adm-rbac-hierarchy', why: 'Give each team exactly the access it needs, at the right scope.' },
      { lab: 'adm-policy-locks-cost', why: 'Set the rules, the tags and the budget everyone works within.' },
      { lab: 'adm-net-hub-spoke', why: 'One shared hub, one spoke per team.' },
      { lab: 'adm-net-private-access', why: 'Reach PaaS services privately and manage VMs without public IPs.' },
      { lab: 'adm-ops-monitor-logs', why: 'Send every team’s logs to one place you can query.' },
    ],
  },
  {
    id: 'protect-data', icon: '🛡️', title: 'Protect a company’s data', level: 'Intermediate', exams: ['az-104'],
    story: 'An auditor asks: if someone deletes the invoices or a region goes down tomorrow, what happens? You make sure the answer is “we restore it”.',
    outcome: 'Locked-down storage, undo for deletes, VM backups and a disaster recovery failover you have actually tested.',
    steps: [
      { lab: 'adm-storage-lockdown', why: 'Only the right networks and tokens can reach the data.' },
      { lab: 'adm-storage-protect', why: 'Undo accidental deletes and overwrites.' },
      { lab: 'adm-ops-vm-backup', why: 'Back up a server and prove you can restore it.' },
      { lab: 'adm-ops-bcdr', why: 'Protect blobs and fail a VM over to another region.' },
    ],
  },
  {
    id: 'support-agent', icon: '🤖', title: 'Build a customer-service agent', level: 'Beginner', exams: ['ai-901'],
    story: 'An online shop wants an assistant that answers order questions politely, uses real tools and never says anything harmful.',
    outcome: 'A deployed model, prompts that work, an agent with tools, a small client app and responsible AI guardrails.',
    steps: [
      { lab: 'ai-foundry-setup', why: 'Create the Foundry resource and project everything lives in.' },
      { lab: 'ai-prompt-craft', why: 'Write the system message that sets the agent’s tone and limits.' },
      { lab: 'ai-first-agent', why: 'Give the agent instructions and tools.' },
      { lab: 'ai-agent-client', why: 'Call the agent from your own code.' },
      { lab: 'ai-guardrails', why: 'Filter harmful input and output before customers see it.' },
    ],
  },
  {
    id: 'rag-backend', icon: '🧠', title: 'Ship a RAG chatbot back end', level: 'Intermediate', exams: ['ai-901', 'ai-200'],
    story: 'A support team wants a chatbot that answers from their own manuals. You build the back end that stores, searches and serves the answers.',
    outcome: 'A deployed model, vectors in a database, a serverless pipeline, secrets kept safe and traces you can debug.',
    steps: [
      { lab: 'ai-deploy-chat', why: 'Deploy the model the chatbot will use.' },
      { lab: 'dev-postgres', why: 'Store the manuals as vectors and search them with pgvector.' },
      { lab: 'dev-functions', why: 'Run the question-to-answer pipeline without servers.' },
      { lab: 'dev-key-vault', why: 'Keep keys and settings out of the code.' },
      { lab: 'dev-observe', why: 'Trace a slow answer to the step that caused it.' },
    ],
  },
];
