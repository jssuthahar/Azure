/**
 * AZ-104 ops area: problem cards, exam-format items, games, comparisons and
 * service cards. Every item is ORIGINAL, written from the official skills
 * outline; none are real or recalled exam questions. Prices ($) are
 * illustrative and shown in the learner's currency.
 */
import type { ProblemSolution } from '../../../az-900/problem-solution';
import type { FormatItem } from '../../../az-900/exam-items';
import type { SortSet, Riddle } from '../../../az-900/games';
import type { Comparison } from '../../../az-900/compare';
import type { Service } from '../../../az-900/services';

const ps = (problem: string, solution: string, tool: string, pairs: [string, string, string][]): ProblemSolution => ({ problem, solution, tool, pairs: pairs.map(([icon, pain, fix]) => ({ icon, pain, fix })) });

export const PROBLEMS: Record<string, ProblemSolution> = {
  'monitor-metrics-and-diagnostic-settings': ps('A storage account throws 403 errors and nobody knows who is calling it.', 'Read the metrics, then route the blob logs to a workspace with a diagnostic setting.', 'Metrics and diagnostic settings', [['📈', 'Only a vague spike', 'Metrics split by response type'], ['🕳️', 'Logs thrown away', 'A diagnostic setting on the blob service'], ['🕵️', 'Who deleted the VM?', 'The activity log']]),
  'kql-for-azure-admins': ps('You have 4 GB of logs and one question: what failed, and when?', 'Write a short KQL query: filter, summarize, chart.', 'KQL in Log Analytics', [['🔍', 'Scrolling through raw rows', 'where to filter'], ['🧮', 'Counting by hand', 'summarize count() by'], ['📉', 'No idea when it started', 'bin() and render timechart']]),
  'alerts-action-groups-processing-rules': ps('The on-call phone buzzes 40 times every Saturday night during patching.', 'Alert through action groups, and suppress them in the maintenance window.', 'Alerts and processing rules', [['🙈', 'Nobody notices high CPU', 'A metric alert rule'], ['📇', 'Same contacts in 30 rules', 'One reusable action group'], ['🔕', 'Pages during planned reboots', 'A recurring suppression rule']]),
  'monitor-insights-and-network-watcher': ps('The app can’t reach SQL and three teams blame each other.', 'Let Connection monitor test the path and point at the hop that drops it.', 'Insights and Connection monitor', [['🤷', 'Is it the VM or the network?', 'VM insights performance and map'], ['⏱️', 'Problems found by users', 'Tests every 30 seconds with alerts'], ['🧱', 'Which rule blocks 1433?', 'Topology plus IP flow verify']]),
  'recovery-services-and-backup-vaults': ps('The ERP VM has no backup and the contracts storage account has none either.', 'A Recovery Services vault for the VM, a Backup vault for blobs, each with a policy.', 'Backup vaults and policies', [['📍', 'Vault in the wrong region', 'Same region as the VM'], ['📆', 'Backups whenever someone remembers', 'A scheduled backup policy'], ['🗃️', 'Blobs and disks unprotected', 'A Backup vault']]),
  'backup-restore-reports-and-alerts': ps('Someone deleted one spreadsheet, and someone else deleted all the backups.', 'Restore just the file, and undelete the backups from soft delete.', 'Restore, reports and alerts', [['📄', 'Whole-VM restore for one file', 'File Recovery'], ['🗑️', 'Backups deleted by an attacker', 'Soft delete for 14 days'], ['📊', 'No view across 40 vaults', 'Backup reports and Azure Monitor alerts']]),
  'site-recovery-failover': ps('If East US goes down, the order system goes down with it.', 'Replicate the VMs to West US 2 and rehearse the failover.', 'Azure Site Recovery', [['🌪️', 'Region-wide outage', 'Continuous replication to another region'], ['😬', 'DR plan never tested', 'Test failover into an isolated VNet'], ['↩️', 'No way back', 'Commit, re-protect and fail back']]),
};

export const ITEMS: FormatItem[] = [
  { kind: 'yesno', id: 'adm-x5-yn-logs', domain: 5, objective: '5.1.2', statements: [
    { text: 'Platform metrics for a virtual machine are collected without creating a diagnostic setting.', answer: true },
    { text: 'A diagnostic setting on a virtual machine can send guest operating system event logs to a Log Analytics workspace.', answer: false },
    { text: 'One diagnostic setting can send resource logs to a Log Analytics workspace, a storage account and an event hub at the same time.', answer: true },
  ], explanation: 'Platform metrics are always collected. A VM has **no resource log categories**, so guest OS data needs the **Azure Monitor Agent** and a **data collection rule**. A single diagnostic setting can use several destination types at once.' },
  { kind: 'dropdown', id: 'adm-x5-dd-kql', domain: 5, objective: '5.1.3', question: 'Complete the query that charts failed blob requests in 15-minute intervals.', parts: [
    'StorageBlobLogs | ',
    { options: ['where StatusCode >= 400', 'project StatusCode >= 400', 'extend StatusCode >= 400', 'take StatusCode >= 400'], answer: 0 },
    ' | summarize count() by ',
    { options: ['bin(TimeGenerated, 15m)', 'TimeGenerated(15m)', 'interval(15m)', 'ago(15m)'], answer: 0 },
    ' | render timechart',
  ], explanation: '**where** filters rows. **bin(TimeGenerated, 15m)** groups timestamps into 15-minute buckets for **summarize**. `ago()` returns a point in time and is used in filters.' },
  { kind: 'match', id: 'adm-x5-match-alerts', domain: 5, objective: '5.1.4', question: 'Match each requirement to the Azure Monitor component.', itemsLabel: 'Components', items: ['Alert rule', 'Action group', 'Alert processing rule', 'Diagnostic setting'], targets: [
    { text: 'Detect when average CPU exceeds 85 percent for 10 minutes', answer: 0 },
    { text: 'Send an SMS and call a webhook when an alert fires', answer: 1 },
    { text: 'Stop notifications for all alerts in a resource group every Sunday from 01:00 to 03:00', answer: 2 },
    { text: 'Send Key Vault audit events to a Log Analytics workspace', answer: 3 },
  ], explanation: 'An **alert rule** evaluates a condition. An **action group** holds notifications and actions. An **alert processing rule** suppresses or adds action groups for fired alerts on a schedule. A **diagnostic setting** routes resource logs.' },
  { kind: 'order', id: 'adm-x5-order-backup', domain: 5, objective: '5.2.3', question: 'You need to back up an Azure VM in East US with locally redundant backup storage and a custom schedule. Which four actions should you perform in sequence?', actions: ['Create a Recovery Services vault in East US', 'Set the vault backup storage redundancy to locally redundant', 'Create a backup policy with the required schedule and retention', 'Enable backup for the VM by using the policy', 'Create a Recovery Services vault in West US 2'], answer: [0, 1, 2, 3], explanation: 'The vault must be in the **VM’s region**. Storage redundancy can be changed only **before** items are protected. Then create the policy and enable protection with it.' },
  { kind: 'yesno', id: 'adm-x5-yn-restore', domain: 5, objective: '5.2.4', statements: [
    { text: 'File Recovery lets you copy individual files from a VM recovery point without restoring the whole VM.', answer: true },
    { text: 'After backup data is deleted from a Recovery Services vault with soft delete enabled, it can be undeleted for 14 days by default.', answer: true },
    { text: 'The Replace existing restore option creates a second VM next to the original.', answer: false },
  ], explanation: '**File Recovery** mounts a recovery point through a script. **Soft delete** keeps deleted backup data 14 days by default. **Replace existing** swaps the disks of the existing VM; **Create new** builds another VM.' },
  { kind: 'order', id: 'adm-x5-order-asr', domain: 5, objective: '5.2.6', question: 'A VM replicates to a secondary region by using Azure Site Recovery. You must validate the disaster recovery plan, then fail over during a real outage and protect the VM again. Which five actions should you perform in sequence?', actions: ['Run a test failover to an isolated virtual network', 'Clean up the test failover', 'Run a failover to the secondary region', 'Commit the failover', 'Re-protect the VM', 'Disable replication'], answer: [0, 1, 2, 3, 4], explanation: 'Test failover, then **cleanup**. In an outage, **failover**, **commit** (which removes the other recovery points), then **re-protect** to replicate back. Disabling replication would remove protection.' },
];

export const SORT: SortSet[] = [
  {
    id: 'adm-monitor-or-backup', title: 'Which tool fixes it?', icon: '🛠️', intro: 'Pick the Azure tool for each admin need.', topic: 'monitor-metrics-and-diagnostic-settings',
    buckets: ['Azure Monitor', 'Network Watcher', 'Azure Backup', 'Site Recovery'],
    items: [
      { text: 'Send Key Vault audit logs to a workspace', bucket: 0, why: 'A diagnostic setting in Azure Monitor.' },
      { text: 'Text the on-call engineer when CPU passes 90%', bucket: 0, why: 'An alert rule with an action group.' },
      { text: 'Test TCP 1433 from the app VM to SQL every 30 seconds', bucket: 1, why: 'Connection monitor.' },
      { text: 'Find which NSG rule blocks a packet', bucket: 1, why: 'IP flow verify or NSG diagnostics.' },
      { text: 'Restore one deleted spreadsheet from last night', bucket: 2, why: 'File Recovery from a VM recovery point.' },
      { text: 'Protect blobs in a storage account', bucket: 2, why: 'A Backup vault with a blob policy.' },
      { text: 'Keep the order system running if East US goes down', bucket: 3, why: 'Replication and failover to another region.' },
      { text: 'Rehearse disaster recovery without touching production', bucket: 3, why: 'Test failover into an isolated VNet.' },
    ],
  },
];

export const RIDDLES: Riddle[] = [
  { answer: 'Diagnostic setting', topic: 'monitor-metrics-and-diagnostic-settings', clues: ['Without me, resource logs are thrown away.', 'I can send to a workspace, a storage account and an event hub at once.', 'A resource can have up to five of me.'] },
  { answer: 'Action group', topic: 'alerts-action-groups-processing-rules', clues: ['I don’t decide when something is wrong.', 'I hold emails, SMS numbers, webhooks and runbooks.', 'Many alert rules can share me, and my display name has 12 characters at most.'] },
  { answer: 'Alert processing rule', topic: 'alerts-action-groups-processing-rules', clues: ['I act after an alert has fired.', 'I can quietly remove every action group during a patch window.', 'I used to be called an action rule.'] },
  { answer: 'Connection monitor', topic: 'monitor-insights-and-network-watcher', clues: ['I live inside Network Watcher.', 'An agent on your VM runs my tests every few seconds.', 'I report checks failed (%) and round-trip time.'] },
  { answer: 'Soft delete', topic: 'backup-restore-reports-and-alerts', clues: ['An attacker deleted your backups, and I shrugged.', 'I keep deleted backup data for 14 days by default.', 'I cost nothing while I hold it.'] },
  { answer: 'Azure Site Recovery', topic: 'site-recovery-failover', clues: ['I copy every disk write to another region.', 'You can rehearse with me in an isolated network.', 'After a failover, commit me and then re-protect.'] },
];

export const COMPARE: Comparison[] = [
  {
    slug: 'recovery-services-vault-vs-backup-vault',
    title: 'Recovery Services Vault vs Backup Vault',
    seoTitle: 'Recovery Services Vault vs Backup Vault | AZ-104',
    description: 'Which Azure Backup vault protects what: Recovery Services vaults for VMs, SQL in VMs, Azure Files and Site Recovery, Backup vaults for blobs, disks and more.',
    answer: 'Use a **Recovery Services vault** for **Azure VMs**, SQL Server and SAP HANA in VMs, **Azure Files**, the MARS agent and **Azure Site Recovery**. Use a **Backup vault** for **Azure Blobs**, **managed disks**, **Azure Database for PostgreSQL flexible server** and **AKS**. Both use backup policies, soft delete and Azure Monitor alerts.',
    cols: ['Recovery Services vault', 'Backup vault'],
    rows: [
      ['Protects', 'Azure VMs, SQL/SAP HANA in VMs, Azure Files, on-premises files (MARS), MABS/DPM', 'Azure Blobs, managed disks, PostgreSQL flexible server, AKS'],
      ['Disaster recovery', 'Also hosts Azure Site Recovery replication', 'No'],
      ['Resource type', 'Microsoft.RecoveryServices/vaults', 'Microsoft.DataProtection/backupVaults'],
      ['CLI', 'az backup …', 'az dataprotection …'],
      ['Region rule', 'Same region as the VM you back up', 'Same region as the data source'],
      ['Permissions', 'Backup service handles VM access', 'Vault managed identity needs a role on each data source'],
      ['Soft delete', '14 days by default (up to 180)', '14 days by default'],
    ],
    pick: [['Recovery Services vault', 'you back up VMs, Azure Files or SQL in a VM, or need Site Recovery'], ['Backup vault', 'you protect blobs, managed disks, PostgreSQL flexible servers or AKS clusters']],
    examTip: '“Back up blob containers” or “back up a managed disk on its own” = **Backup vault**. “Back up an Azure VM” or “replicate a VM to another region” = **Recovery Services vault**.',
    sim: { mode: 'adminops', start: 6, tour: 'adm-rsv-policy', intro: 'Protect a VM and some blobs, and see which vault each goes to.' },
    lessons: ['recovery-services-and-backup-vaults', 'backup-restore-reports-and-alerts'],
    faq: [['Can one vault back up VMs from several regions?', 'No. For Azure VM backup, the Recovery Services vault must be in the same region as the VMs. Create one vault per region.'], ['Can I change storage redundancy later?', 'Only before any item is protected. After that, create a new vault.']],
  },
  {
    slug: 'azure-backup-vs-site-recovery',
    title: 'Azure Backup vs Azure Site Recovery',
    seoTitle: 'Azure Backup vs Azure Site Recovery for Admins | AZ-104',
    description: 'Azure Backup keeps copies you can restore to a point in time; Site Recovery keeps a VM running in another region. RPO, RTO, cost and when to pick each.',
    answer: '**Azure Backup** keeps point-in-time copies for days to years, so you can restore files, disks or VMs after deletion, corruption or ransomware. **Azure Site Recovery** continuously replicates VMs to another region and **fails over** in minutes when a region is down. Most production VMs use both.',
    cols: ['Azure Backup', 'Azure Site Recovery'],
    rows: [
      ['Protects against', 'Deletion, corruption, ransomware, bad changes', 'Region or datacenter outage'],
      ['How', 'Scheduled backups to a vault', 'Continuous replication to another region'],
      ['RPO', 'Hours (daily or every few hours)', 'Minutes (crash-consistent points every 5 minutes)'],
      ['RTO', 'Hours (restore and start)', 'Minutes (fail over)'],
      ['Retention', 'Days to 99 years', 'Up to 15 days of recovery points'],
      ['Test it', 'Restore to a new VM', 'Test failover into an isolated VNet'],
      ['Price feel', '≈ $10 per VM a month plus storage', '≈ $25 per VM a month plus storage and compute at failover'],
    ],
    pick: [['Azure Backup', 'you need to go back in time or keep copies for compliance'], ['Site Recovery', 'the business can’t wait hours for a restore when a region fails']],
    examTip: '“Recover a file deleted last week” = **Backup**. “Minimise downtime if the primary region fails” = **Site Recovery**. Ransomware that encrypted data hours ago also replicates, so you still need Backup.',
    sim: { mode: 'adminops', start: 8, tour: 'adm-site-recovery', intro: 'Run a DR drill, then a real failover.' },
    lessons: ['site-recovery-failover', 'backup-restore-reports-and-alerts', 'recovery-services-and-backup-vaults'],
    faq: [['Does Site Recovery replace backup?', 'No. Replication copies mistakes and encryption too, within minutes. Backup lets you go back to before the problem.'], ['Do I pay for VMs in the target region?', 'Only after failover (or during a test failover). While replicating you pay the Site Recovery fee and storage.']],
  },
];

export const SERVICES: Service[] = [
  { slug: 'azure-monitor-admin', name: 'Azure Monitor (metrics, logs and alerts)', cat: 'Management & Governance', icon: '📈', model: 'Monitoring platform', what: 'Collects platform metrics automatically, routes resource logs and the activity log with diagnostic settings, and raises alerts through action groups, with alert processing rules for maintenance windows.', use: ['Watching CPU, storage transactions and availability', 'Alerting the on-call team by email, SMS or webhook', 'Muting notifications during planned maintenance'], avoid: ['Long-term archives you never query (archive to storage instead)'], feel: 2, price: 'Platform metrics free; metric alert ≈ $0.10 per time series a month; SMS and voice notifications charged per message', sim: { mode: 'adminops', start: 3, tour: 'adm-alert-action-group', intro: 'Fire an alert and then mute it.' }, similar: ['log-analytics-kql-admin', 'network-watcher'], aws: 'Amazon CloudWatch', lesson: 'alerts-action-groups-processing-rules' },
  { slug: 'log-analytics-kql-admin', name: 'Log Analytics workspace and KQL', cat: 'Management & Governance', icon: '📊', model: 'Log store + query', what: 'A workspace that stores logs in tables (AzureDiagnostics, StorageBlobLogs, AzureActivity, InsightsMetrics) and answers questions with Kusto Query Language.', use: ['Finding who called a storage account', 'Charting failures over time', 'Log search alert rules'], avoid: ['Real-time metric thresholds (metric alerts are faster and cheaper)'], feel: 2, price: 'Analytics logs ≈ $2.30 per GB ingested; 31 days of retention included, longer costs extra', sim: { mode: 'adminops', start: 2, tour: 'adm-kql-logs', intro: 'Chart failures with KQL.' }, similar: ['azure-monitor-admin'], aws: 'CloudWatch Logs Insights', lesson: 'kql-for-azure-admins' },
  { slug: 'network-watcher', name: 'Azure Network Watcher', cat: 'Networking', icon: '🔍', model: 'Network diagnostics', what: 'Regional network monitoring and diagnostics: topology, Connection monitor, IP flow verify, NSG diagnostics, next hop, packet capture, VPN troubleshoot and flow logs.', use: ['Continuous tests between VMs and endpoints', 'Finding the rule or route that drops traffic', 'Capturing packets on a VM'], avoid: ['Application performance tracing (use Application Insights)'], feel: 1, price: 'Connection monitor ≈ $0.30 per test a month after the first 10; diagnostics checks cost per 1,000 checks', sim: { mode: 'adminops', start: 5, tour: 'adm-insights-connection-monitor', intro: 'Break the path and watch it go red.' }, similar: ['azure-monitor-admin'], aws: 'VPC Reachability Analyzer', lesson: 'monitor-insights-and-network-watcher' },
  { slug: 'recovery-services-vault', name: 'Recovery Services vault (Azure Backup)', cat: 'Management & Governance', icon: '🛟', model: 'Backup and DR vault', what: 'Holds backups of Azure VMs, SQL and SAP HANA in VMs, Azure Files and on-premises files, plus Site Recovery replication. Policies set the schedule and retention; soft delete protects against deletion.', use: ['Nightly VM backups with long retention', 'File-level restores', 'Site Recovery for VMs'], avoid: ['Blob and managed disk backup (use a Backup vault)'], feel: 2, price: '≈ $10 per VM up to 50 GB a month plus backup storage (illustrative)', sim: { mode: 'adminops', start: 6, tour: 'adm-rsv-policy', intro: 'Run the nightly backup.' }, similar: ['backup-vault', 'azure-site-recovery'], aws: 'AWS Backup', lesson: 'recovery-services-and-backup-vaults', compare: 'recovery-services-vault-vs-backup-vault' },
  { slug: 'backup-vault', name: 'Backup vault (Azure Backup)', cat: 'Management & Governance', icon: '🗃️', model: 'Backup vault', what: 'The newer Azure Backup vault for Azure Blobs, managed disks, PostgreSQL flexible server and AKS. Uses backup policies and backup instances; the vault’s managed identity needs a role on each data source.', use: ['Operational or vaulted blob backup', 'Snapshot-based managed disk backup', 'AKS cluster backup'], avoid: ['Azure VM backup (use a Recovery Services vault)'], feel: 2, price: 'Per protected instance plus storage; blob operational backup has no instance fee (illustrative)', sim: { mode: 'adminops', start: 6, tour: 'adm-rsv-policy', intro: 'Protect blobs and disks.' }, similar: ['recovery-services-vault'], aws: 'AWS Backup', lesson: 'recovery-services-and-backup-vaults', compare: 'recovery-services-vault-vs-backup-vault' },
  { slug: 'azure-site-recovery', name: 'Azure Site Recovery', cat: 'Migration & Hybrid', icon: '♻️', model: 'Disaster recovery', what: 'Replicates VMs continuously to another Azure region (or from on-premises), with test failover, failover, commit, re-protect and failback, plus recovery plans for multi-VM apps.', use: ['Region-level disaster recovery for VMs', 'DR drills without downtime', 'Ordered failover of multi-tier apps'], avoid: ['Recovering from deletion or ransomware (use Azure Backup)'], feel: 3, price: '≈ $25 per protected VM a month plus storage; target VMs are billed only after failover', sim: { mode: 'adminops', start: 8, tour: 'adm-site-recovery', intro: 'Test, fail over and commit.' }, similar: ['recovery-services-vault'], aws: 'AWS Elastic Disaster Recovery', lesson: 'site-recovery-failover', compare: 'azure-backup-vs-site-recovery' },
];
