/**
 * AZ-104 identity and governance: problem cards, exam-format items, games,
 * comparisons and service cards. Exam items are ORIGINAL, written from the
 * skills outline; none are real or recalled exam questions. Prices ($) are
 * illustrative and shown in the learner's currency.
 */
import type { ProblemSolution } from '../../../az-900/problem-solution';
import type { FormatItem } from '../../../az-900/exam-items';
import type { SortSet, Riddle } from '../../../az-900/games';
import type { Comparison } from '../../../az-900/compare';
import type { Service } from '../../../az-900/services';

const ps = (problem: string, solution: string, tool: string, pairs: [string, string, string][]): ProblemSolution => ({ problem, solution, tool, pairs: pairs.map(([icon, pain, fix]) => ({ icon, pain, fix })) });

export const PROBLEMS: Record<string, ProblemSolution> = {
  'entra-users-and-groups': ps('Forty new sales hires start Monday and someone has to set up every account by hand.', 'Create users in bulk and let a dynamic group add them by department.', 'Microsoft Entra users and groups', [['📋', 'One account at a time', 'Bulk create from a CSV'], ['🧮', 'Group membership drifts', 'Dynamic membership rules'], ['🚪', 'Leavers keep access', 'Disable the account; groups follow']]),
  'entra-licenses-and-guest-users': ps('People leave the sales team and still hold a Microsoft 365 license.', 'License the group, not the person, and invite partners as guests.', 'Group-based licensing and B2B', [['💸', 'Unused paid licenses', 'Group-based licensing'], ['🌍', 'Direct assignment fails', 'Set usage location first'], ['🤝', 'Partner accounts to manage', 'Guests use their own sign-in']]),
  'self-service-password-reset': ps('A third of helpdesk tickets are "I forgot my password".', 'Turn on SSPR for a pilot group with two verification methods.', 'Self-service password reset', [['☎️', 'Helpdesk queue on Monday', 'Users reset at aka.ms/sspr'], ['🎣', 'Easy-to-trick resets', 'Two methods required'], ['🏢', 'On-premises passwords out of sync', 'Password writeback']]),
  'rbac-roles-and-scopes': ps('Everyone in IT is an Owner of the production subscription.', 'Give each team the smallest built-in role at the smallest scope.', 'Azure RBAC', [['👑', 'Owner for everyone', 'Least-privilege built-in roles'], ['🌐', 'Access at the wrong level', 'Pick the right scope'], ['👤', 'Per-person assignments', 'Assign roles to groups']]),
  'interpret-access-assignments': ps('A developer says "I only have Reader" but just deleted a VM.', 'Check access: list every role, at every scope, through every group.', 'Check access and effective permissions', [['🕵️', 'Hidden inherited roles', 'Scope column shows Inherited'], ['👥', 'Access through groups', 'Check access lists group roles'], ['⛔', 'Who can override roles?', 'Deny assignments win']]),
  'azure-policy-for-admins': ps('Half the resources have no cost center tag and some sit in the wrong region.', 'Deny the wrong region, Modify in the missing tag, and remediate the rest.', 'Azure Policy', [['🗺️', 'Resources in any region', 'Allowed locations (Deny)'], ['🏷️', 'Missing tags', 'Inherit a tag (Modify)'], ['🧹', 'Old resources still wrong', 'Remediation tasks']]),
  'locks-and-tags-at-scale': ps('Someone deleted the production database resource group on a Friday evening.', 'Lock production against deletion and tag everything for ownership and cost.', 'Resource locks and tags', [['🗑️', 'Accidental deletes', 'CanNotDelete lock'], ['🧊', 'Changes during an audit', 'ReadOnly lock for a short freeze'], ['❓', 'Who owns this?', 'owner and costcenter tags']]),
  'resource-groups-subscriptions-management-groups': ps('Thirty subscriptions, and every policy has to be assigned thirty times.', 'Group subscriptions under management groups and assign once at the top.', 'Management groups and resource groups', [['🔁', 'Same setting everywhere', 'Assign at a management group'], ['📦', 'Resources in the wrong group', 'Move them between groups'], ['🧾', 'One bill for everything', 'Subscriptions per workload']]),
  'budgets-cost-alerts-and-advisor': ps('The finance team found out about a runaway bill when the invoice arrived.', 'Set budgets with actual and forecast alerts, and act on Advisor\'s cost tips.', 'Budgets, cost alerts and Advisor', [['😱', 'Surprise invoices', 'Budget alerts at 50, 80, 100%'], ['🔮', 'Overspend spotted too late', 'Forecasted alerts'], ['💤', 'Idle VMs running', 'Advisor right-size tips']]),
};

export const ITEMS: FormatItem[] = [
  { kind: 'yesno', id: 'adm-x1-yn-rbac', domain: 1, objective: '1.2.3', scenario: 'User1 is assigned the Reader role at the management group that contains Subscription1, and the Contributor role on resource group RG1 in Subscription1. User1 is also a member of Group1, which is assigned the Virtual Machine Contributor role on RG2.', statements: [
    { text: 'User1 can create a storage account in RG1.', answer: true },
    { text: 'User1 can assign the Reader role to another user on RG1.', answer: false },
    { text: 'User1 can restart a virtual machine in RG2.', answer: true },
  ], explanation: 'Role assignments are **additive** and inherit downward. Contributor on RG1 allows creating resources there but its **NotActions** exclude `Microsoft.Authorization/*/Write`, so User1 cannot assign roles. Through **Group1**, User1 holds Virtual Machine Contributor on RG2, which allows restarting VMs.' },
  { kind: 'order', id: 'adm-x1-order-modify', domain: 1, objective: '1.3.1', question: 'Every existing and new resource in RG1 must have the costcenter tag of its resource group. Which three actions should you perform in sequence?', actions: ['Add the costcenter tag to RG1', 'Assign the Inherit a tag from the resource group if missing policy to RG1 with a managed identity', 'Create a remediation task for the policy assignment', 'Assign the Require a tag on resources policy to RG1', 'Apply a ReadOnly lock to RG1'], answer: [0, 1, 2], explanation: 'The resource group needs the tag value first. The **Modify** policy adds the tag to new and updated resources and needs a **managed identity**. A **remediation task** fixes resources that already exist. Require a tag would deny deployments instead of adding the tag, and a ReadOnly lock would block the remediation.' },
  { kind: 'dropdown', id: 'adm-x1-dd-dynamic', domain: 1, objective: '1.1.2', question: 'Complete the configuration.', parts: [
    'Every user whose department is Sales must be added to a group automatically. Create a group with the membership type ',
    { options: ['Assigned', 'Dynamic User', 'Dynamic Device'], answer: 1 },
    ' and the rule ',
    { options: ['(user.department -eq "Sales")', '(device.department -eq "Sales")', '(user.memberOf -any "Sales")'], answer: 0 },
    '. The tenant must have a ',
    { options: ['Microsoft Entra ID Free', 'Microsoft Entra ID P1', 'Azure subscription Owner'], answer: 1 },
    ' license for the users in scope.',
  ], explanation: 'Dynamic user groups use rules on user properties such as `user.department`. Dynamic membership requires **Microsoft Entra ID P1** (or higher) licenses.' },
  { kind: 'match', id: 'adm-x1-match-locks', domain: 1, objective: '1.3.2', question: 'Match each requirement to the configuration that meets it. Each configuration may be used once, more than once, or not at all.', itemsLabel: 'Configurations', items: ['CanNotDelete lock', 'ReadOnly lock', 'Allowed locations policy', 'Budget with an action group'], targets: [
    { text: 'Administrators can change VM sizes in RG1 but nobody can delete RG1.', answer: 0 },
    { text: 'No settings in RG2 can be changed during a two-day audit.', answer: 1 },
    { text: 'Resources can be created only in West Europe.', answer: 2 },
    { text: 'The finance team is emailed when spending reaches 80 percent of the monthly limit.', answer: 3 },
  ], explanation: '**CanNotDelete** allows updates and blocks deletion. **ReadOnly** blocks all write operations. **Allowed locations** is a Deny policy that restricts regions. A **budget** sends alerts at thresholds and can call an action group.' },
  { kind: 'yesno', id: 'adm-x1-yn-entra', domain: 1, objective: '1.1.3', statements: [
    { text: 'You must set the usage location of a user before you can assign a license to that user directly.', answer: true },
    { text: 'A guest user invited through B2B collaboration signs in with a password that your tenant creates.', answer: false },
    { text: 'You can manually add a user to a group whose membership type is Dynamic User.', answer: false },
  ], explanation: 'Direct license assignment requires a **usage location**. B2B guests authenticate with their **own** identity provider. Dynamic group membership is controlled only by the **rule**.' },
  { kind: 'order', id: 'adm-x1-order-sspr', domain: 1, objective: '1.1.5', question: 'You need to enable self-service password reset for members of the Pilot group only, requiring two methods. Which three actions should you perform in sequence?', actions: ['Set Self service password reset enabled to Selected and choose the Pilot group', 'Set Number of methods required to reset to 2 and select the allowed methods', 'Set Require users to register when signing in to Yes', 'Set Self service password reset enabled to All', 'Assign the User Access Administrator role to the Pilot group'], answer: [0, 1, 2], explanation: '**Selected** limits SSPR to one group. Then set the **number of methods** and the allowed methods, and require **registration at sign-in** so users are ready before they need it. Azure RBAC roles are not involved.' },
];

export const SORT: SortSet[] = [
  {
    id: 'adm-governance-tools',
    title: 'Which governance tool?',
    icon: '🧭',
    intro: 'Drop each requirement into the tool that meets it.',
    topic: 'azure-policy-for-admins',
    buckets: ['Azure RBAC', 'Azure Policy', 'Resource lock', 'Budget'],
    items: [
      { text: 'Only the network team may change virtual networks', bucket: 0, why: 'Who may do what is RBAC: Network Contributor for the network team.' },
      { text: 'Storage accounts must not be created outside Europe', bucket: 1, why: 'What may exist is Azure Policy: Allowed locations with a Deny effect.' },
      { text: 'Nobody, not even an Owner, may delete the production resource group', bucket: 2, why: 'A CanNotDelete lock applies to everyone, Owners included.' },
      { text: 'Email finance when spend hits 80% of the monthly limit', bucket: 3, why: 'Budgets send alerts at thresholds you choose.' },
      { text: 'Add the costcenter tag to new resources automatically', bucket: 1, why: 'A Modify policy such as Inherit a tag from the resource group adds it.' },
      { text: 'Freeze every setting during a two-day audit', bucket: 2, why: 'A ReadOnly lock blocks all writes until it\'s removed.' },
      { text: 'Let the helpdesk read resources but change nothing', bucket: 0, why: 'The Reader role at the right scope.' },
      { text: 'Know before the month ends that you\'ll overspend', bucket: 3, why: 'A forecasted budget alert fires on predicted cost.' },
    ],
  },
];

export const RIDDLES: Riddle[] = [
  { answer: 'User Access Administrator', topic: 'rbac-roles-and-scopes', clues: ['I can\'t create a single virtual machine.', 'But I can decide who else is allowed to.', 'A Global Administrator can elevate to get me at root scope.'] },
  { answer: 'Dynamic group', topic: 'entra-users-and-groups', clues: ['Nobody adds people to me by hand.', 'A rule like user.department -eq "Sales" decides who belongs.', 'I need Microsoft Entra ID P1.'] },
  { answer: 'Remediation task', topic: 'azure-policy-for-admins', clues: ['I fix things that were wrong before the rule existed.', 'I only work with Modify and DeployIfNotExists policies.', 'I use the assignment\'s managed identity to do my job.'] },
  { answer: 'ReadOnly lock', topic: 'locks-and-tags-at-scale', clues: ['I\'m stricter than my sibling.', 'Even adding a tag is refused while I\'m here.', 'I can stop you listing storage account keys.'] },
  { answer: 'Usage location', topic: 'entra-licenses-and-guest-users', clues: ['I\'m a two-letter country code.', 'Without me, a direct license assignment fails.', 'Group-based licensing borrows the directory\'s value when I\'m missing.'] },
  { answer: 'Deny assignment', topic: 'interpret-access-assignments', clues: ['I beat every role assignment.', 'You can\'t create me directly.', 'Deployment stacks and managed applications bring me along.'] },
];

export const COMPARE: Comparison[] = [
  {
    slug: 'owner-vs-contributor-vs-user-access-administrator',
    title: 'Owner vs Contributor vs Reader vs User Access Administrator',
    seoTitle: 'Owner vs Contributor vs Reader vs UAA Roles | AZ-104',
    description: 'Azure built-in roles compared for AZ-104: what Owner, Contributor, Reader and User Access Administrator can and can\'t do, with scopes and a simulation.',
    answer: '**Owner** manages everything and grants access. **Contributor** manages everything but **can\'t grant access** (its NotActions remove Microsoft.Authorization writes). **Reader** only views. **User Access Administrator** manages **access only**, not resources. All four apply at the scope you assign and everything below it.',
    cols: ['Owner', 'Contributor', 'Reader', 'User Access Administrator'],
    rows: [
      ['Create and delete resources', 'Yes', 'Yes', 'No', 'No'],
      ['Assign Azure roles', 'Yes', 'No', 'No', 'Yes'],
      ['Read resources', 'Yes', 'Yes', 'Yes', 'Yes'],
      ['Category in the portal', 'Privileged administrator', 'Privileged administrator', 'Job function', 'Privileged administrator'],
      ['Typical holder', 'Subscription admins, few people', 'Workload teams on their resource group', 'Auditors, helpdesk', 'Security or access team'],
      ['Blocked by a lock or deny assignment', 'Yes', 'Yes', '—', 'Yes'],
    ],
    pick: [['Owner', 'someone must both run resources and hand out access, and you keep the number small'], ['Contributor', 'a team deploys and manages its own resources but shouldn\'t change who has access'], ['Reader', 'people need to look, report or audit without changing anything'], ['User Access Administrator', 'a central team manages access but shouldn\'t touch workloads']],
    examTip: '"Can deploy but can\'t give anyone access" = **Contributor**. "Can grant access but not create VMs" = **User Access Administrator**. If a question says the user "only has Reader", check for **inherited** and **group** assignments before you agree.',
    sim: { mode: 'adminidentity', start: 5, tour: 'adm-check-access', intro: 'Try each role and see what gets blocked.' },
    lessons: ['rbac-roles-and-scopes', 'interpret-access-assignments'],
    faq: [['Can a Contributor remove a resource lock?', 'No. Deleting a lock needs Microsoft.Authorization/locks/delete, which Contributor\'s NotActions exclude. Owner and User Access Administrator can.'], ['Is Global Administrator an Azure role?', 'No. It\'s a Microsoft Entra role for the directory. A Global Administrator can elevate access to get User Access Administrator at root scope, then assign Azure roles.']],
    wide: true,
  },
  {
    slug: 'azure-roles-vs-entra-roles',
    title: 'Azure RBAC Roles vs Microsoft Entra Roles',
    seoTitle: 'Azure RBAC Roles vs Microsoft Entra Roles | AZ-104',
    description: 'Azure roles vs Microsoft Entra roles explained for AZ-104: what each controls, where you assign them, scopes, examples and how Global Administrator elevation works.',
    answer: '**Azure roles** (Owner, Contributor, Reader…) control **Azure resources** and are assigned at management group, subscription, resource group or resource scope. **Microsoft Entra roles** (Global Administrator, User Administrator…) control the **directory**: users, groups, licenses and apps. They\'re separate systems, linked only by Global Administrator elevation.',
    cols: ['Azure roles (RBAC)', 'Microsoft Entra roles'],
    rows: [
      ['Controls', 'VMs, storage, networks and other Azure resources', 'Users, groups, licenses, app registrations, tenant settings'],
      ['Assign in', 'Access control (IAM) on the scope', 'Microsoft Entra ID → Roles and administrators'],
      ['Scopes', 'Management group, subscription, resource group, resource', 'Tenant or administrative unit'],
      ['Examples', 'Owner, Contributor, Reader, Virtual Machine Contributor', 'Global Administrator, User Administrator, License Administrator'],
      ['Custom roles', 'Yes, JSON with Actions and NotActions', 'Yes, with Entra ID P1 or P2'],
      ['CLI', 'az role assignment create', 'Portal or Microsoft Graph (New-MgRoleManagementDirectoryRoleAssignment)'],
    ],
    pick: [['Azure role', 'the task touches subscriptions or resources: deploy, read, delete, grant resource access'], ['Microsoft Entra role', 'the task touches identities: create users, reset passwords, assign licenses, manage groups']],
    examTip: '"Create users and reset passwords" = **User Administrator** (Entra). "Manage VMs in one resource group" = an **Azure role** at that resource group. Global Administrator alone **can\'t** manage Azure resources until it elevates.',
    sim: { mode: 'adminidentity', start: 4, tour: 'adm-rbac-assign', intro: 'Assign a role high up and watch it flow down.' },
    lessons: ['rbac-roles-and-scopes', 'entra-users-and-groups', 'interpret-access-assignments'],
    faq: [['How does a Global Administrator get access to Azure subscriptions?', 'In Microsoft Entra ID → Properties, turn on Access management for Azure resources. That grants User Access Administrator at root scope (/), which they should remove when done.'], ['Can a group hold both kinds of role?', 'A security group can hold Azure roles. To hold Entra roles it must be created with "Microsoft Entra roles can be assigned to the group" set to Yes.']],
  },
];

export const SERVICES: Service[] = [
  { slug: 'microsoft-entra-id', name: 'Microsoft Entra ID', cat: 'Identity & Security', icon: '👤', model: 'Identity (SaaS)', what: 'The directory behind every Azure sign-in: users, groups (assigned or dynamic), licenses, guests and self-service password reset, run from the portal or the Entra admin center.', use: ['Creating and managing users and groups', 'Group-based licensing and B2B guests', 'Self-service password reset'], avoid: ['Controlling access to Azure resources (that\'s Azure RBAC)'], feel: 1, price: 'Free tier included; P1 ≈ $6 per user per month adds dynamic groups, group licensing and SSPR with writeback.', sim: { mode: 'adminidentity', start: 0, tour: 'adm-entra-user-group', intro: 'Change a department and watch the dynamic group follow.' }, similar: ['azure-rbac', 'management-groups'], aws: 'IAM Identity Center', lesson: 'entra-users-and-groups', compare: 'azure-roles-vs-entra-roles' },
  { slug: 'azure-rbac', name: 'Azure role-based access control (RBAC)', cat: 'Identity & Security', icon: '🎭', model: 'Authorization', what: 'Grants a security principal a role definition at a scope. Assignments inherit downward and add up; deny assignments override them.', use: ['Least-privilege access per team', 'Delegating resource groups to app teams', 'Auditing who can do what'], avoid: ['Restricting what can be deployed (use Azure Policy)', 'Managing users and passwords (use Entra roles)'], feel: 1, price: 'Free.', sim: { mode: 'adminidentity', start: 5, tour: 'adm-check-access', intro: 'Test Owner, Contributor, Reader and User Access Administrator.' }, similar: ['microsoft-entra-id', 'azure-policy'], aws: 'IAM roles and policies', lesson: 'rbac-roles-and-scopes', compare: 'owner-vs-contributor-vs-user-access-administrator' },
  { slug: 'azure-policy', name: 'Azure Policy', cat: 'Management & Governance', icon: '📜', model: 'Governance', what: 'Evaluates resources against rules and applies an effect: Deny, Audit, Modify, Append, DeployIfNotExists and more. Remediation tasks fix existing resources.', use: ['Allowed regions and SKUs', 'Tag inheritance and enforcement', 'Compliance reporting across subscriptions'], avoid: ['Deciding who can act (use RBAC)', 'Protecting one resource from deletion (use a lock)'], feel: 1, price: 'Free for Azure resources.', sim: { mode: 'adminidentity', start: 6, tour: 'adm-policy-assign', intro: 'Deny, audit and modify, then remediate.' }, similar: ['azure-rbac', 'resource-locks'], aws: 'AWS Config rules / SCPs', lesson: 'azure-policy-for-admins' },
  { slug: 'resource-locks', name: 'Resource locks', cat: 'Management & Governance', icon: '🔒', model: 'Governance', what: 'CanNotDelete or ReadOnly locks on a subscription, resource group or resource. They apply to every user and are inherited by child resources.', use: ['Protecting production from accidental deletion', 'Short freezes during audits'], avoid: ['Long-term ReadOnly on busy resources (it blocks normal operations)'], feel: 1, price: 'Free.', sim: { mode: 'adminidentity', start: 7, tour: 'adm-locks-tags', intro: 'Try to delete and update under each lock.' }, similar: ['azure-policy', 'azure-rbac'], aws: 'Termination protection', lesson: 'locks-and-tags-at-scale' },
  { slug: 'management-groups', name: 'Management groups', cat: 'Management & Governance', icon: '🏛️', model: 'Governance', what: 'Containers above subscriptions, up to six levels below the Tenant Root Group. Policy and role assignments made here flow to every subscription below.', use: ['One policy for many subscriptions', 'Separating production from non-production'], avoid: ['Grouping resources inside one subscription (use resource groups)'], feel: 1, price: 'Free.', sim: { mode: 'adminidentity', start: 3, tour: 'adm-mg-sub-rg', intro: 'Move a subscription and a resource.' }, similar: ['azure-policy', 'azure-rbac'], aws: 'AWS Organizations OUs', lesson: 'resource-groups-subscriptions-management-groups' },
  { slug: 'cost-management', name: 'Microsoft Cost Management', cat: 'Management & Governance', icon: '💲', model: 'Cost tools', what: 'Cost analysis, budgets with actual and forecasted alerts, anomaly alerts and exports, alongside Azure Advisor\'s cost recommendations.', use: ['Budgets per subscription, resource group or tag', 'Spotting runaway spend early', 'Chargeback by tag'], avoid: ['Stopping resources automatically by itself (wire an action group to automation)'], feel: 1, price: 'Free for Azure spend.', sim: { mode: 'adminidentity', start: 8, tour: 'adm-budget-advisor', intro: 'Let the month run and watch the alerts.' }, similar: ['azure-policy', 'management-groups'], aws: 'AWS Budgets / Cost Explorer', lesson: 'budgets-cost-alerts-and-advisor' },
];
