/**
 * AZ-104 syllabus: the single source of truth for navigation, the syllabus
 * page, the mock exam's domain weights and objective coverage.
 *
 * Source: "Study guide for Exam AZ-104: Microsoft Azure Administrator",
 * skills measured as of April 17, 2026 (checked on Microsoft Learn 24 Nov 2026).
 * https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104
 *
 * Earns Microsoft Certified: Azure Administrator Associate. Candidates should
 * know PowerShell, Azure CLI, the Azure portal, ARM templates or Bicep and
 * Microsoft Entra ID.
 *
 * Objective ids are ours (domain.group.bullet), numbered in the order the
 * study guide lists the bullets. Whether a topic is published is derived from
 * the existence of src/content/tutorials/az-104/<module>/<slug>.mdx.
 * Lesson slugs must not repeat AZ-900 slugs (labsForTopic looks up by slug).
 */

import type { ObjectiveGroup, SyllabusTopic, SyllabusModule, ExamFacts } from '../types';
export type { ObjectiveGroup, SyllabusTopic, SyllabusModule, ExamFacts };

export const SKILLS_MEASURED_AS_OF = 'April 17, 2026';
export const SYLLABUS_VERIFIED_ON = '2026-11-24';
export const STUDY_GUIDE_URL =
  'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104';
export const EXAM_FACTS: ExamFacts = {
  passingScore: 700,
  scoreScale: '1–1000',
  durationMinutes: 100,
  practiceAssessmentUrl: 'http://aka.ms/AZ104-PA',
};

export const MODULES: SyllabusModule[] = [
  {
    slug: 'identity-and-governance',
    domain: 1,
    title: 'Manage Azure identities and governance',
    shortTitle: 'Identity & Governance',
    weight: '20–25%',
    weightMid: 22.5,
    summary:
      'Run Microsoft Entra ID day to day (users, groups, licenses, guests and self-service password reset), give people exactly the access they need with Azure RBAC, and keep subscriptions in order with Azure Policy, locks, tags, management groups and cost controls.',
    groups: [
      {
        title: 'Manage Microsoft Entra users and groups',
        objectives: [
          { id: '1.1.1', text: 'Create users and groups' },
          { id: '1.1.2', text: 'Manage user and group properties' },
          { id: '1.1.3', text: 'Manage licenses in Microsoft Entra ID' },
          { id: '1.1.4', text: 'Manage external users' },
          { id: '1.1.5', text: 'Configure self-service password reset (SSPR)' },
        ],
      },
      {
        title: 'Manage access to Azure resources',
        objectives: [
          { id: '1.2.1', text: 'Manage built-in Azure roles' },
          { id: '1.2.2', text: 'Assign roles at different scopes' },
          { id: '1.2.3', text: 'Interpret access assignments' },
        ],
      },
      {
        title: 'Manage Azure subscriptions and governance',
        objectives: [
          { id: '1.3.1', text: 'Implement and manage Azure Policy' },
          { id: '1.3.2', text: 'Configure resource locks' },
          { id: '1.3.3', text: 'Apply and manage tags on resources' },
          { id: '1.3.4', text: 'Manage resource groups' },
          { id: '1.3.5', text: 'Manage subscriptions' },
          { id: '1.3.6', text: 'Manage costs by using alerts, budgets, and Azure Advisor recommendations' },
          { id: '1.3.7', text: 'Configure management groups' },
        ],
      },
    ],
    topics: [
      { slug: 'entra-users-and-groups', title: 'Microsoft Entra Users and Groups: Create and Manage', objectives: ['1.1.1', '1.1.2'] },
      { slug: 'entra-licenses-and-guest-users', title: 'Licenses and External Users in Microsoft Entra ID', objectives: ['1.1.3', '1.1.4'] },
      { slug: 'self-service-password-reset', title: 'Configure Self-Service Password Reset (SSPR)', objectives: ['1.1.5'] },
      { slug: 'rbac-roles-and-scopes', title: 'Azure RBAC: Built-in Roles and Scopes', objectives: ['1.2.1', '1.2.2'] },
      { slug: 'interpret-access-assignments', title: 'Interpret Access Assignments and Effective Access', objectives: ['1.2.3'] },
      { slug: 'azure-policy-for-admins', title: 'Implement and Manage Azure Policy', objectives: ['1.3.1'] },
      { slug: 'locks-and-tags-at-scale', title: 'Resource Locks and Tags for Administrators', objectives: ['1.3.2', '1.3.3'] },
      { slug: 'resource-groups-subscriptions-management-groups', title: 'Resource Groups, Subscriptions and Management Groups', objectives: ['1.3.4', '1.3.5', '1.3.7'] },
      { slug: 'budgets-cost-alerts-and-advisor', title: 'Manage Costs with Budgets, Alerts and Azure Advisor', objectives: ['1.3.6'] },
    ],
  },
  {
    slug: 'storage',
    domain: 2,
    title: 'Implement and manage storage',
    shortTitle: 'Storage',
    weight: '15–20%',
    weightMid: 17.5,
    summary:
      'Lock storage down with firewalls, SAS tokens, stored access policies, access keys and identity-based access for Azure Files, then configure accounts (redundancy, object replication, encryption, AzCopy) and the data inside them: file shares, blob containers, tiers, lifecycle rules, soft delete, snapshots and versioning.',
    groups: [
      {
        title: 'Configure access to storage',
        objectives: [
          { id: '2.1.1', text: 'Configure Azure Storage firewalls and virtual networks' },
          { id: '2.1.2', text: 'Create and use shared access signature (SAS) tokens' },
          { id: '2.1.3', text: 'Configure stored access policies' },
          { id: '2.1.4', text: 'Manage access keys' },
          { id: '2.1.5', text: 'Configure identity-based access for Azure Files' },
        ],
      },
      {
        title: 'Configure and manage storage accounts',
        objectives: [
          { id: '2.2.1', text: 'Create and configure storage accounts' },
          { id: '2.2.2', text: 'Configure Azure Storage redundancy' },
          { id: '2.2.3', text: 'Configure object replication' },
          { id: '2.2.4', text: 'Configure storage account encryption' },
          { id: '2.2.5', text: 'Manage data by using Azure Storage Explorer and AzCopy' },
        ],
      },
      {
        title: 'Configure Azure Files and Azure Blob Storage',
        objectives: [
          { id: '2.3.1', text: 'Create and configure a file share in Azure Files' },
          { id: '2.3.2', text: 'Create and configure a container in Azure Blob Storage' },
          { id: '2.3.3', text: 'Configure storage tiers' },
          { id: '2.3.4', text: 'Configure soft delete for blobs and containers' },
          { id: '2.3.5', text: 'Configure snapshots and soft delete for Azure Files' },
          { id: '2.3.6', text: 'Configure blob lifecycle management' },
          { id: '2.3.7', text: 'Configure blob versioning' },
        ],
      },
    ],
    topics: [
      { slug: 'storage-firewalls-and-virtual-networks', title: 'Storage Firewalls and Virtual Network Rules', objectives: ['2.1.1'] },
      { slug: 'sas-tokens-and-stored-access-policies', title: 'SAS Tokens and Stored Access Policies', objectives: ['2.1.2', '2.1.3'] },
      { slug: 'storage-access-keys', title: 'Manage and Rotate Storage Access Keys', objectives: ['2.1.4'] },
      { slug: 'azure-files-identity-based-access', title: 'Identity-Based Access for Azure Files', objectives: ['2.1.5'] },
      { slug: 'configure-storage-accounts-and-encryption', title: 'Create and Configure Storage Accounts and Encryption', objectives: ['2.2.1', '2.2.4'] },
      { slug: 'storage-redundancy-and-object-replication', title: 'Storage Redundancy and Object Replication', objectives: ['2.2.2', '2.2.3'] },
      { slug: 'storage-explorer-and-azcopy', title: 'Move Data with Azure Storage Explorer and AzCopy', objectives: ['2.2.5'] },
      { slug: 'azure-file-shares-snapshots-soft-delete', title: 'Azure File Shares, Snapshots and Soft Delete', objectives: ['2.3.1', '2.3.5'] },
      { slug: 'blob-containers-tiers-and-lifecycle', title: 'Blob Containers, Access Tiers and Lifecycle Management', objectives: ['2.3.2', '2.3.3', '2.3.6'] },
      { slug: 'blob-soft-delete-and-versioning', title: 'Blob Soft Delete and Versioning', objectives: ['2.3.4', '2.3.7'] },
    ],
  },
  {
    slug: 'compute',
    domain: 3,
    title: 'Deploy and manage Azure compute resources',
    shortTitle: 'Compute',
    weight: '20–25%',
    weightMid: 22.5,
    summary:
      'Read, edit and deploy ARM templates and Bicep files, build and run virtual machines (sizes, disks, encryption at host, moves, availability zones and sets, scale sets), provision containers in Container Registry, Container Instances and Container Apps, and run web apps on App Service with scaling, TLS, custom domains, backups, networking and deployment slots.',
    groups: [
      {
        title: 'Automate deployment of resources by using Azure Resource Manager (ARM) templates or Bicep files',
        objectives: [
          { id: '3.1.1', text: 'Interpret an Azure Resource Manager template or a Bicep file' },
          { id: '3.1.2', text: 'Modify an existing Azure Resource Manager template' },
          { id: '3.1.3', text: 'Modify an existing Bicep file' },
          { id: '3.1.4', text: 'Deploy resources by using an Azure Resource Manager template or a Bicep file' },
          { id: '3.1.5', text: 'Export a deployment as an Azure Resource Manager template or convert an Azure Resource Manager template to a Bicep file' },
        ],
      },
      {
        title: 'Create and configure virtual machines',
        objectives: [
          { id: '3.2.1', text: 'Create a virtual machine' },
          { id: '3.2.2', text: 'Configure encryption at host for Azure virtual machines' },
          { id: '3.2.3', text: 'Move a virtual machine to another resource group, subscription, or region' },
          { id: '3.2.4', text: 'Manage virtual machine sizes' },
          { id: '3.2.5', text: 'Manage virtual machine disks' },
          { id: '3.2.6', text: 'Deploy virtual machines to availability zones and availability sets' },
          { id: '3.2.7', text: 'Deploy and configure an Azure Virtual Machine Scale Sets' },
        ],
      },
      {
        title: 'Provision and manage containers in the Azure portal',
        objectives: [
          { id: '3.3.1', text: 'Create and manage an Azure Container Registry' },
          { id: '3.3.2', text: 'Provision a container by using Azure Container Instances' },
          { id: '3.3.3', text: 'Provision a container by using Azure Container Apps' },
          { id: '3.3.4', text: 'Manage sizing and scaling for containers, including Azure Container Instances and Azure Container Apps' },
        ],
      },
      {
        title: 'Create and configure Azure App Service',
        objectives: [
          { id: '3.4.1', text: 'Provision an App Service plan' },
          { id: '3.4.2', text: 'Configure scaling for an App Service plan' },
          { id: '3.4.3', text: 'Create an App Service' },
          { id: '3.4.4', text: 'Configure certificates and Transport Layer Security (TLS) for an App Service' },
          { id: '3.4.5', text: 'Map an existing custom DNS name to an App Service' },
          { id: '3.4.6', text: 'Configure backup for an App Service' },
          { id: '3.4.7', text: 'Configure networking settings for an App Service' },
          { id: '3.4.8', text: 'Configure deployment slots for an App Service' },
        ],
      },
    ],
    topics: [
      { slug: 'interpret-and-modify-arm-and-bicep', title: 'Read and Modify ARM Templates and Bicep Files', objectives: ['3.1.1', '3.1.2', '3.1.3'] },
      { slug: 'deploy-and-export-templates', title: 'Deploy, Export and Convert Templates to Bicep', objectives: ['3.1.4', '3.1.5'] },
      { slug: 'create-and-size-virtual-machines', title: 'Create Virtual Machines and Manage VM Sizes', objectives: ['3.2.1', '3.2.4'] },
      { slug: 'vm-disks-and-encryption-at-host', title: 'VM Disks and Encryption at Host', objectives: ['3.2.5', '3.2.2'] },
      { slug: 'move-virtual-machines', title: 'Move a VM to Another Resource Group, Subscription or Region', objectives: ['3.2.3'] },
      { slug: 'vm-availability-and-scale-sets', title: 'Availability Zones, Availability Sets and VM Scale Sets', objectives: ['3.2.6', '3.2.7'] },
      { slug: 'container-registry-and-instances', title: 'Azure Container Registry and Container Instances for Admins', objectives: ['3.3.1', '3.3.2', '3.3.4'] },
      { slug: 'container-apps-for-admins', title: 'Provision and Scale Azure Container Apps', objectives: ['3.3.3', '3.3.4'] },
      { slug: 'app-service-plans-and-scaling', title: 'App Service Plans, Scaling and Creating a Web App', objectives: ['3.4.1', '3.4.2', '3.4.3'] },
      { slug: 'app-service-tls-and-custom-domains', title: 'App Service Custom Domains, Certificates and TLS', objectives: ['3.4.4', '3.4.5'] },
      { slug: 'app-service-backup-and-networking', title: 'App Service Backup and Networking', objectives: ['3.4.6', '3.4.7'] },
      { slug: 'app-service-deployment-slots', title: 'App Service Deployment Slots and Swaps', objectives: ['3.4.8'] },
    ],
  },
  {
    slug: 'networking',
    domain: 4,
    title: 'Implement and manage virtual networking',
    shortTitle: 'Networking',
    weight: '15–20%',
    weightMid: 17.5,
    summary:
      'Build virtual networks, subnets, peering, public IPs and user-defined routes, secure them with NSGs, application security groups, Azure Bastion, service endpoints and private endpoints, resolve names with Azure DNS, balance traffic with Azure Load Balancer, and troubleshoot when packets go missing.',
    groups: [
      {
        title: 'Configure and manage virtual networks in Azure',
        objectives: [
          { id: '4.1.1', text: 'Create and configure virtual networks and subnets' },
          { id: '4.1.2', text: 'Create and configure virtual network peering' },
          { id: '4.1.3', text: 'Configure public IP addresses' },
          { id: '4.1.4', text: 'Configure user-defined routes' },
          { id: '4.1.5', text: 'Troubleshoot network connectivity' },
        ],
      },
      {
        title: 'Configure secure access to virtual networks',
        objectives: [
          { id: '4.2.1', text: 'Create and configure network security groups (NSGs) and application security groups' },
          { id: '4.2.2', text: 'Evaluate effective security rules in NSGs' },
          { id: '4.2.3', text: 'Implement Azure Bastion' },
          { id: '4.2.4', text: 'Configure service endpoints for Azure platform as a service (PaaS)' },
          { id: '4.2.5', text: 'Configure private endpoints for Azure PaaS' },
        ],
      },
      {
        title: 'Configure name resolution and load balancing',
        objectives: [
          { id: '4.3.1', text: 'Configure Azure DNS' },
          { id: '4.3.2', text: 'Configure an internal or public load balancer' },
          { id: '4.3.3', text: 'Troubleshoot load balancing' },
        ],
      },
    ],
    topics: [
      { slug: 'vnets-subnets-and-public-ips', title: 'Virtual Networks, Subnets and Public IP Addresses', objectives: ['4.1.1', '4.1.3'] },
      { slug: 'configure-vnet-peering', title: 'Configure Virtual Network Peering and Gateway Transit', objectives: ['4.1.2'] },
      { slug: 'user-defined-routes', title: 'User-Defined Routes and Route Tables', objectives: ['4.1.4'] },
      { slug: 'nsgs-asgs-and-effective-rules', title: 'NSGs, Application Security Groups and Effective Rules', objectives: ['4.2.1', '4.2.2'] },
      { slug: 'azure-bastion', title: 'Connect to VMs Securely with Azure Bastion', objectives: ['4.2.3'] },
      { slug: 'service-endpoints-and-private-endpoints', title: 'Service Endpoints vs Private Endpoints for PaaS', objectives: ['4.2.4', '4.2.5'] },
      { slug: 'azure-dns-zones-and-records', title: 'Azure DNS: Public and Private Zones and Records', objectives: ['4.3.1'] },
      { slug: 'azure-load-balancer-for-admins', title: 'Configure and Troubleshoot Azure Load Balancer', objectives: ['4.3.2', '4.3.3'] },
      { slug: 'troubleshoot-network-connectivity', title: 'Troubleshoot Virtual Network Connectivity', objectives: ['4.1.5'] },
    ],
  },
  {
    slug: 'monitor-and-backup',
    domain: 5,
    title: 'Monitor and maintain Azure resources',
    shortTitle: 'Monitor & Backup',
    weight: '10–15%',
    weightMid: 12.5,
    summary:
      'Read metrics and logs in Azure Monitor, write KQL, alert the right people with action groups and alert processing rules, use Insights and Network Watcher, then protect workloads with Recovery Services and Backup vaults, backup policies, restores and Azure Site Recovery failover.',
    groups: [
      {
        title: 'Monitor resources in Azure',
        objectives: [
          { id: '5.1.1', text: 'Interpret metrics in Azure Monitor' },
          { id: '5.1.2', text: 'Configure log settings in Azure Monitor' },
          { id: '5.1.3', text: 'Query and analyze logs in Azure Monitor' },
          { id: '5.1.4', text: 'Set up alert rules, action groups, and alert processing rules in Azure Monitor' },
          { id: '5.1.5', text: 'Configure and interpret monitoring of virtual machines, storage accounts, and networks by using Azure Monitor Insights' },
          { id: '5.1.6', text: 'Use Azure Network Watcher and Connection monitor' },
        ],
      },
      {
        title: 'Implement backup and recovery',
        objectives: [
          { id: '5.2.1', text: 'Create a Recovery Services vault' },
          { id: '5.2.2', text: 'Create an Azure Backup vault' },
          { id: '5.2.3', text: 'Create and configure a backup policy' },
          { id: '5.2.4', text: 'Perform backup and restore operations by using Azure Backup' },
          { id: '5.2.5', text: 'Configure Azure Site Recovery for Azure resources' },
          { id: '5.2.6', text: 'Perform a failover to a secondary region by using Site Recovery' },
          { id: '5.2.7', text: 'Configure and interpret reports and alerts for backups' },
        ],
      },
    ],
    topics: [
      { slug: 'monitor-metrics-and-diagnostic-settings', title: 'Azure Monitor Metrics and Diagnostic Settings', objectives: ['5.1.1', '5.1.2'] },
      { slug: 'kql-for-azure-admins', title: 'Query Azure Monitor Logs with KQL', objectives: ['5.1.3'] },
      { slug: 'alerts-action-groups-processing-rules', title: 'Alert Rules, Action Groups and Alert Processing Rules', objectives: ['5.1.4'] },
      { slug: 'monitor-insights-and-network-watcher', title: 'Azure Monitor Insights, Network Watcher and Connection Monitor', objectives: ['5.1.5', '5.1.6'] },
      { slug: 'recovery-services-and-backup-vaults', title: 'Recovery Services Vaults, Backup Vaults and Backup Policies', objectives: ['5.2.1', '5.2.2', '5.2.3'] },
      { slug: 'backup-restore-reports-and-alerts', title: 'Back Up and Restore, Backup Reports and Alerts', objectives: ['5.2.4', '5.2.7'] },
      { slug: 'site-recovery-failover', title: 'Azure Site Recovery: Replicate and Fail Over to Another Region', objectives: ['5.2.5', '5.2.6'] },
    ],
  },
];

export const moduleBySlug = (slug: string) => MODULES.find((m) => m.slug === slug);
export const allObjectives = () => MODULES.flatMap((m) => m.groups.flatMap((g) => g.objectives));
export const objectiveText = (id: string) => allObjectives().find((o) => o.id === id)?.text ?? id;
