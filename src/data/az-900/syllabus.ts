/**
 * AZ-900 syllabus — the single source of truth for navigation, the syllabus
 * page, the mock exam's domain weights and objective coverage.
 *
 * Source: "Study guide for Exam AZ-900: Microsoft Azure Fundamentals",
 * skills measured as of July 20, 2026.
 * https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-900
 *
 * Whether a topic is *published* is not stored here: it is derived from the
 * existence of src/content/tutorials/az-900/<module>/<slug>.mdx. Topics with no
 * tutorial file are shown as "coming next" and are never linked.
 *
 * `beyondExam: true` marks topics we teach because they matter in real
 * projects and interviews, even though the current outline does not list them.
 */

export const SKILLS_MEASURED_AS_OF = 'July 20, 2026';
export const SYLLABUS_VERIFIED_ON = '2026-11-11';
export const STUDY_GUIDE_URL =
  'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-900';
export const EXAM_FACTS = {
  passingScore: 700,
  scoreScale: '1–1000',
  durationMinutes: 45,
  practiceAssessmentUrl:
    'https://learn.microsoft.com/en-us/credentials/certifications/exams/az-900/practice/assessment?assessment-type=practice&assessmentId=23',
};

export interface ObjectiveGroup {
  title: string;
  objectives: { id: string; text: string }[];
}

export interface SyllabusTopic {
  slug: string;
  title: string;
  /** Objective ids from the official outline this topic covers. */
  objectives: string[];
  beyondExam?: boolean;
}

export interface SyllabusModule {
  slug: string;
  domain: 1 | 2 | 3;
  title: string;
  shortTitle: string;
  weight: string;
  /** Midpoint of the weight range, used to size mock exams. */
  weightMid: number;
  summary: string;
  groups: ObjectiveGroup[];
  topics: SyllabusTopic[];
}

export const MODULES: SyllabusModule[] = [
  {
    slug: 'cloud-concepts',
    domain: 1,
    title: 'Describe cloud concepts',
    shortTitle: 'Cloud Concepts',
    weight: '25–30%',
    weightMid: 27.5,
    summary:
      'What the cloud actually is, why businesses moved to it, the cloud models and service types, and the benefits every Azure conversation is built on.',
    groups: [
      {
        title: 'Describe cloud computing',
        objectives: [
          { id: '1.1.1', text: 'Define cloud computing' },
          { id: '1.1.2', text: 'Describe the shared responsibility model' },
          { id: '1.1.3', text: 'Define cloud models, including public, private, and hybrid' },
          { id: '1.1.4', text: 'Identify appropriate use cases for each cloud model' },
          { id: '1.1.5', text: 'Describe the consumption-based model' },
          { id: '1.1.6', text: 'Compare cloud pricing models' },
          { id: '1.1.7', text: 'Describe serverless' },
        ],
      },
      {
        title: 'Describe the benefits of using cloud services',
        objectives: [
          { id: '1.2.1', text: 'Describe the benefits of high availability and scalability in the cloud' },
          { id: '1.2.2', text: 'Describe the benefits of reliability and predictability in the cloud' },
          { id: '1.2.3', text: 'Describe the benefits of security and governance in the cloud' },
          { id: '1.2.4', text: 'Describe the benefits of manageability in the cloud' },
        ],
      },
      {
        title: 'Describe cloud service types',
        objectives: [
          { id: '1.3.1', text: 'Describe infrastructure as a service (IaaS)' },
          { id: '1.3.2', text: 'Describe platform as a service (PaaS)' },
          { id: '1.3.3', text: 'Describe software as a service (SaaS)' },
          { id: '1.3.4', text: 'Identify appropriate use cases for each cloud service type (IaaS, PaaS, and SaaS)' },
        ],
      },
    ],
    topics: [
      { slug: 'what-is-cloud-computing', title: 'What is Cloud Computing?', objectives: ['1.1.1'] },
      { slug: 'what-is-microsoft-azure', title: 'What is Microsoft Azure?', objectives: ['1.1.1'] },
      { slug: 'why-companies-use-cloud', title: 'Why Companies Use the Cloud', objectives: ['1.1.1', '1.2.1'] },
      { slug: 'on-premises-vs-cloud', title: 'On-premises vs Cloud', objectives: ['1.1.1', '1.1.4'] },
      { slug: 'public-cloud', title: 'Public Cloud', objectives: ['1.1.3', '1.1.4'] },
      { slug: 'private-cloud', title: 'Private Cloud', objectives: ['1.1.3', '1.1.4'] },
      { slug: 'hybrid-cloud', title: 'Hybrid and Multi-cloud', objectives: ['1.1.3', '1.1.4'] },
      { slug: 'iaas', title: 'IaaS – Infrastructure as a Service', objectives: ['1.3.1'] },
      { slug: 'paas', title: 'PaaS – Platform as a Service', objectives: ['1.3.2'] },
      { slug: 'saas', title: 'SaaS – Software as a Service', objectives: ['1.3.3'] },
      { slug: 'choosing-iaas-paas-saas', title: 'Choosing IaaS, PaaS or SaaS', objectives: ['1.3.4'] },
      { slug: 'shared-responsibility-model', title: 'Shared Responsibility Model', objectives: ['1.1.2'] },
      { slug: 'serverless', title: 'Serverless Computing', objectives: ['1.1.7'] },
      { slug: 'consumption-based-model', title: 'Consumption-Based Model', objectives: ['1.1.5'] },
      { slug: 'cloud-pricing-models', title: 'Cloud Pricing Models', objectives: ['1.1.6'] },
      { slug: 'capex-vs-opex', title: 'CapEx vs OpEx', objectives: ['1.1.5'] },
      { slug: 'high-availability', title: 'High Availability', objectives: ['1.2.1'] },
      { slug: 'scalability', title: 'Scalability', objectives: ['1.2.1'] },
      { slug: 'elasticity', title: 'Elasticity', objectives: ['1.2.1'] },
      { slug: 'reliability', title: 'Reliability', objectives: ['1.2.2'] },
      { slug: 'predictability', title: 'Predictability', objectives: ['1.2.2'] },
      { slug: 'security', title: 'Security in the Cloud', objectives: ['1.2.3'] },
      { slug: 'governance', title: 'Governance in the Cloud', objectives: ['1.2.3'] },
      { slug: 'manageability', title: 'Manageability', objectives: ['1.2.4'] },
    ],
  },
  {
    slug: 'azure-architecture-and-services',
    domain: 2,
    title: 'Describe Azure architecture and services',
    shortTitle: 'Architecture & Services',
    weight: '35–40%',
    weightMid: 37.5,
    summary:
      'How Azure is physically and logically organised, and the core compute, networking, storage, identity and security services you will meet in every project.',
    groups: [
      {
        title: 'Describe the core architectural components of Azure',
        objectives: [
          { id: '2.1.1', text: 'Describe Azure regions, region pairs, and sovereign regions' },
          { id: '2.1.2', text: 'Describe availability zones' },
          { id: '2.1.3', text: 'Describe Azure datacenters' },
          { id: '2.1.4', text: 'Describe Azure resources and resource groups' },
          { id: '2.1.5', text: 'Describe subscriptions' },
          { id: '2.1.6', text: 'Describe management groups' },
          { id: '2.1.7', text: 'Describe the hierarchy of resource groups, subscriptions, and management groups' },
        ],
      },
      {
        title: 'Describe Azure compute and networking services',
        objectives: [
          { id: '2.2.1', text: 'Compare compute types, including containers, virtual machines, and functions' },
          { id: '2.2.2', text: 'Describe virtual machine options, including Azure virtual machines, Azure Virtual Machine Scale Sets, availability sets, and Azure Virtual Desktop' },
          { id: '2.2.3', text: 'Describe the resources required for virtual machines' },
          { id: '2.2.4', text: 'Describe application hosting options, including web apps, containers, and virtual machines' },
          { id: '2.2.5', text: 'Describe virtual networking, including the purpose of Azure virtual networks, subnets, peering, Azure DNS, Azure VPN Gateway, and ExpressRoute' },
          { id: '2.2.6', text: 'Define public and private endpoints' },
        ],
      },
      {
        title: 'Describe Azure storage services',
        objectives: [
          { id: '2.3.1', text: 'Compare Azure Storage services' },
          { id: '2.3.2', text: 'Describe storage tiers' },
          { id: '2.3.3', text: 'Describe redundancy options' },
          { id: '2.3.4', text: 'Describe storage account options and storage types' },
          { id: '2.3.5', text: 'Identify options for moving files, including AzCopy, Azure Storage Explorer, and Azure File Sync' },
          { id: '2.3.6', text: 'Describe migration options, including Azure Migrate and Azure Data Box' },
        ],
      },
      {
        title: 'Describe Azure identity, access, and security',
        objectives: [
          { id: '2.4.1', text: 'Describe directory services in Azure, including Microsoft Entra ID and Microsoft Entra Domain Services' },
          { id: '2.4.2', text: 'Describe authentication methods in Azure, including single sign-on (SSO), multifactor authentication (MFA), and passwordless' },
          { id: '2.4.3', text: 'Describe external identities in Azure' },
          { id: '2.4.4', text: 'Describe Microsoft Entra Conditional Access' },
          { id: '2.4.5', text: 'Describe Azure role-based access control (RBAC)' },
          { id: '2.4.6', text: 'Describe the concept of Zero Trust' },
          { id: '2.4.7', text: 'Describe the purpose of the defense-in-depth model' },
          { id: '2.4.8', text: 'Describe the purpose of Microsoft Defender for Cloud' },
        ],
      },
    ],
    topics: [
      { slug: 'regions-and-region-pairs', title: 'Azure Regions, Region Pairs and Sovereign Regions', objectives: ['2.1.1'] },
      { slug: 'availability-zones', title: 'Availability Zones', objectives: ['2.1.2'] },
      { slug: 'datacenters', title: 'Azure Datacenters', objectives: ['2.1.3'] },
      { slug: 'resources-and-resource-groups', title: 'Resources and Resource Groups', objectives: ['2.1.4'] },
      { slug: 'subscriptions', title: 'Azure Subscriptions', objectives: ['2.1.5'] },
      { slug: 'management-groups', title: 'Management Groups', objectives: ['2.1.6'] },
      { slug: 'management-hierarchy', title: 'The Azure Management Hierarchy', objectives: ['2.1.7'] },
      { slug: 'compute-types', title: 'Compute Types: VMs, Containers and Functions', objectives: ['2.2.1'] },
      { slug: 'virtual-machines', title: 'Azure Virtual Machines', objectives: ['2.2.2', '2.2.3'] },
      { slug: 'vm-scale-sets-and-availability-sets', title: 'VM Scale Sets and Availability Sets', objectives: ['2.2.2'] },
      { slug: 'azure-virtual-desktop', title: 'Azure Virtual Desktop', objectives: ['2.2.2'] },
      { slug: 'app-service', title: 'Azure App Service', objectives: ['2.2.4'] },
      { slug: 'azure-functions', title: 'Azure Functions', objectives: ['2.2.1'] },
      { slug: 'container-instances-and-aks', title: 'Container Instances, Container Apps and AKS', objectives: ['2.2.1', '2.2.4'] },
      { slug: 'virtual-networks-and-subnets', title: 'Virtual Networks and Subnets', objectives: ['2.2.5'] },
      { slug: 'vnet-peering', title: 'Virtual Network Peering', objectives: ['2.2.5'] },
      { slug: 'network-security-groups', title: 'Network Security Groups', objectives: ['2.2.5'], beyondExam: true },
      { slug: 'vpn-gateway', title: 'Azure VPN Gateway', objectives: ['2.2.5'] },
      { slug: 'expressroute', title: 'Azure ExpressRoute', objectives: ['2.2.5'] },
      { slug: 'azure-dns', title: 'Azure DNS', objectives: ['2.2.5'] },
      { slug: 'public-and-private-endpoints', title: 'Public and Private Endpoints', objectives: ['2.2.6'] },
      { slug: 'load-balancer-application-gateway-front-door', title: 'Load Balancer, Application Gateway and Front Door', objectives: [], beyondExam: true },
      { slug: 'virtual-wan', title: 'Azure Virtual WAN', objectives: [], beyondExam: true },
      { slug: 'storage-accounts', title: 'Storage Accounts and Storage Types', objectives: ['2.3.1', '2.3.4'] },
      { slug: 'blob-storage-and-tiers', title: 'Blob Storage and Access Tiers', objectives: ['2.3.1', '2.3.2'] },
      { slug: 'files-queues-tables-disks', title: 'Azure Files, Queues, Tables and Managed Disks', objectives: ['2.3.1'] },
      { slug: 'storage-redundancy', title: 'Storage Redundancy: LRS, ZRS, GRS, GZRS', objectives: ['2.3.3'] },
      { slug: 'moving-files', title: 'AzCopy, Storage Explorer and Azure File Sync', objectives: ['2.3.5'] },
      { slug: 'azure-migrate-and-data-box', title: 'Azure Migrate and Azure Data Box', objectives: ['2.3.6'] },
      { slug: 'azure-databases', title: 'Azure SQL, SQL Managed Instance and Cosmos DB', objectives: [], beyondExam: true },
      { slug: 'microsoft-entra-id', title: 'Microsoft Entra ID and Entra Domain Services', objectives: ['2.4.1'] },
      { slug: 'authentication-methods', title: 'Authentication: SSO, MFA and Passwordless', objectives: ['2.4.2'] },
      { slug: 'external-identities', title: 'External Identities', objectives: ['2.4.3'] },
      { slug: 'conditional-access', title: 'Conditional Access', objectives: ['2.4.4'] },
      { slug: 'azure-rbac', title: 'Azure Role-Based Access Control (RBAC)', objectives: ['2.4.5'] },
      { slug: 'zero-trust', title: 'Zero Trust', objectives: ['2.4.6'] },
      { slug: 'defense-in-depth', title: 'Defense in Depth', objectives: ['2.4.7'] },
      { slug: 'microsoft-defender-for-cloud', title: 'Microsoft Defender for Cloud', objectives: ['2.4.8'] },
    ],
  },
  {
    slug: 'management-and-governance',
    domain: 3,
    title: 'Describe Azure management and governance',
    shortTitle: 'Management & Governance',
    weight: '30–35%',
    weightMid: 32.5,
    summary:
      'Keeping Azure under control: cost, compliance, policy, the tools you deploy and manage with, and how you monitor what is running.',
    groups: [
      {
        title: 'Describe cost management in Azure',
        objectives: [
          { id: '3.1.1', text: 'Describe factors that can affect costs in Azure' },
          { id: '3.1.2', text: 'Explore the pricing calculator' },
          { id: '3.1.3', text: 'Describe cost management capabilities in Azure' },
          { id: '3.1.4', text: 'Describe the purpose of tags' },
        ],
      },
      {
        title: 'Describe features and tools in Azure for governance and compliance',
        objectives: [
          { id: '3.2.1', text: 'Describe the purpose of Microsoft Purview in Azure' },
          { id: '3.2.2', text: 'Describe the purpose of Azure Policy' },
          { id: '3.2.3', text: 'Describe the purpose of resource locks' },
        ],
      },
      {
        title: 'Describe features and tools for managing and deploying Azure resources',
        objectives: [
          { id: '3.3.1', text: 'Describe the Azure portal' },
          { id: '3.3.2', text: 'Describe Azure Cloud Shell, Azure CLI, and Azure PowerShell' },
          { id: '3.3.3', text: 'Describe the purpose of Azure Arc' },
          { id: '3.3.4', text: 'Describe infrastructure as code (IaC)' },
          { id: '3.3.5', text: 'Describe Azure Resource Manager (ARM) and ARM templates' },
        ],
      },
      {
        title: 'Describe monitoring tools in Azure',
        objectives: [
          { id: '3.4.1', text: 'Describe the purpose of Azure Advisor' },
          { id: '3.4.2', text: 'Describe Azure Service Health' },
          { id: '3.4.3', text: 'Describe Azure Monitor, including Log Analytics, Azure Monitor alerts, and Azure Monitor Application Insights' },
        ],
      },
    ],
    topics: [
      { slug: 'factors-affecting-cost', title: 'Factors That Affect Azure Costs', objectives: ['3.1.1'] },
      { slug: 'pricing-calculator', title: 'Pricing Calculator', objectives: ['3.1.2'] },
      { slug: 'tco-calculator', title: 'Total Cost of Ownership (TCO)', objectives: [], beyondExam: true },
      { slug: 'cost-management', title: 'Microsoft Cost Management', objectives: ['3.1.3'] },
      { slug: 'resource-tags', title: 'Resource Tags', objectives: ['3.1.4'] },
      { slug: 'microsoft-purview', title: 'Microsoft Purview', objectives: ['3.2.1'] },
      { slug: 'azure-policy', title: 'Azure Policy', objectives: ['3.2.2'] },
      { slug: 'resource-locks', title: 'Resource Locks', objectives: ['3.2.3'] },
      { slug: 'azure-portal', title: 'Azure Portal', objectives: ['3.3.1'] },
      { slug: 'cloud-shell-cli-powershell', title: 'Cloud Shell, Azure CLI and Azure PowerShell', objectives: ['3.3.2'] },
      { slug: 'azure-arc', title: 'Azure Arc', objectives: ['3.3.3'] },
      { slug: 'infrastructure-as-code', title: 'Infrastructure as Code (IaC)', objectives: ['3.3.4'] },
      { slug: 'azure-resource-manager', title: 'Azure Resource Manager and ARM Templates', objectives: ['3.3.5'] },
      { slug: 'azure-advisor', title: 'Azure Advisor', objectives: ['3.4.1'] },
      { slug: 'service-health-and-azure-status', title: 'Azure Service Health and Azure Status', objectives: ['3.4.2'] },
      { slug: 'azure-monitor', title: 'Azure Monitor, Log Analytics, Alerts and Application Insights', objectives: ['3.4.3'] },
      { slug: 'slas-and-service-lifecycle', title: 'SLAs and the Service Lifecycle', objectives: [], beyondExam: true },
    ],
  },
];

export const moduleBySlug = (slug: string) => MODULES.find((m) => m.slug === slug);
export const allObjectives = () => MODULES.flatMap((m) => m.groups.flatMap((g) => g.objectives));
export const objectiveText = (id: string) => allObjectives().find((o) => o.id === id)?.text ?? id;
