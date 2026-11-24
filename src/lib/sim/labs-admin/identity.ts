/**
 * AZ-104 identity and governance practice labs (Cloud Shell). Every task is
 * checked from simulator events, and every task's `cli` hint completes it when
 * run as written, in order, in a fresh simulator.
 */
import { SUB_ID, type Sim } from '../engine';
import type { Lab } from '../labs';

const ev = (s: Sim, type: string, pred: (d: Record<string, any>) => boolean = () => true) => s.events.some((e) => e.type === type && pred(e.data));
const lc = (x?: string) => (x ?? '').toLowerCase();
const T = 'msdevbuild.onmicrosoft.com';
const ran = (s: Sim, path: string) => ev(s, 'cli', (d) => d.path === path);

export const LABS: Lab[] = [
  /* ------------------------------------------------ users, groups, licenses, guests */
  {
    id: 'adm-entra-users-licenses', title: 'Users, dynamic groups, licenses and guests', icon: '👥', level: 'Intermediate', minutes: 12, start: 'shell',
    intro: 'Contoso hired Sam for the sales team. Create the account, see why the license won\'t stick yet, fix the user\'s properties so a dynamic group picks Sam up on its own, license the whole group in one go, then invite a partner as a guest.',
    learn: ['Creating users and editing properties such as department and usage location', 'Assigned vs dynamic membership, and why you can\'t add people to a dynamic group by hand', 'Direct vs group-based licensing', 'B2B guests keep their own account'],
    topics: ['entra-users-and-groups', 'entra-licenses-and-guest-users'],
    tasks: [
      { text: `Create the user **Sam Rivera** (sam@${T}) with a temporary password that must be changed at first sign-in.`, cli: `az ad user create --display-name "Sam Rivera" --user-principal-name sam@${T} --password "Contoso!2026x" --force-change-password-next-sign-in true`, check: (s) => ev(s, 'user.create', (d) => lc(d.upn) === `sam@${T}`) },
      { text: 'Try to give Sam a **Microsoft 365 E3** license directly. It fails. Read why.', cli: `az ad user license assign --id sam@${T} --sku SPE_E3`, check: (s) => ev(s, 'adm.license.blocked', (d) => d.reason === 'usageLocation') },
      { text: 'Set Sam\'s **usage location** to IN and **department** to Sales.', cli: `az ad user update --id sam@${T} --usage-location IN --department Sales`, check: (s) => ev(s, 'adm.user.update', (d) => d.changes.usageLocation === 'IN' && lc(d.changes.department) === 'sales') },
      { text: 'Create a **dynamic** security group **Sales-Team** with the rule *user.department -eq "Sales"* and check that Sam joined on his own. Then try to add yourself by hand.', cli: `az ad group create --display-name Sales-Team --mail-nickname sales-team --membership-rule "user.department -eq 'Sales'" && az ad group member list --group Sales-Team -o table && az ad group member add --group Sales-Team --member-id learner@msdevbuild.com`, check: (s) => ev(s, 'adm.group.dynamic', (d) => d.name === 'Sales-Team' && d.users.includes(`sam@${T}`)) && ev(s, 'adm.group.manual-blocked') },
      { text: 'Assign **Microsoft 365 E3** to the whole **Sales-Team** group instead of user by user.', cli: 'az ad group license assign --group Sales-Team --sku SPE_E3 && az ad license list -o table', check: (s) => ev(s, 'adm.license.assign', (d) => d.target === 'group' && d.group === 'Sales-Team' && d.users >= 1) },
      { text: 'Invite **priya@fabrikam.com** as a guest, then list the users and spot her **UserType**.', cli: 'az ad guest invite --email priya@fabrikam.com && az ad user list -o table', check: (s) => ev(s, 'guest.invite', (d) => lc(d.email) === 'priya@fabrikam.com') && ran(s, 'ad user list') },
    ],
    wrap: 'Direct license assignment needs a usage location on the user. Group-based licensing (Entra ID P1) licenses everyone in a group, and a dynamic group keeps that group right by itself: change the department and membership follows. Guests sign in with their own company account; their user type is Guest.',
  },

  /* ------------------------------------------------ SSPR */
  {
    id: 'adm-sspr-pilot', title: 'Roll out self-service password reset to a pilot group', icon: '🔑', level: 'Intermediate', minutes: 8, start: 'shell',
    intro: 'The helpdesk spends Monday mornings resetting passwords. Turn on SSPR for a pilot group, require two methods, and watch a user get stopped until they\'ve registered enough of them.',
    learn: ['SSPR scope: None, Selected (one group) or All', 'Number of methods required and which methods are allowed', 'Registration comes before reset'],
    topics: ['self-service-password-reset'],
    tasks: [
      { text: `Create **Ana Silva** (ana@${T}) and an assigned group **SSPR-Pilot**, and add Ana to it.`, cli: `az ad user create --display-name "Ana Silva" --user-principal-name ana@${T} --password "Contoso!2026x" && az ad group create --display-name SSPR-Pilot --mail-nickname sspr-pilot && az ad group member add --group SSPR-Pilot --member-id ana@${T}`, check: (s) => ev(s, 'group.member', (d) => d.group === 'SSPR-Pilot' && lc(d.upn) === `ana@${T}`) },
      { text: 'Turn on SSPR for **Selected** users (SSPR-Pilot), require **2** methods, and allow the **Microsoft Authenticator** app and **email**.', cli: 'az ad sspr update --enabled Selected --group SSPR-Pilot --methods-required 2 --methods mobileAppNotification email', check: (s) => ev(s, 'adm.sspr.update', (d) => d.enabled === 'Selected' && d.group === 'SSPR-Pilot' && d.required === 2) },
      { text: 'Ana registers only her **email**. Then she tries to reset her password. It\'s refused.', cli: `az ad sspr register --user ana@${T} --method email && az ad sspr reset --user ana@${T}`, check: (s) => ev(s, 'adm.sspr.reset', (d) => !d.ok && d.reason === 'methods') },
      { text: 'Ana adds the **Authenticator app** and tries again.', cli: `az ad sspr register --user ana@${T} --method mobileAppNotification && az ad sspr reset --user ana@${T}`, check: (s) => ev(s, 'adm.sspr.reset', (d) => d.ok && lc(d.upn) === `ana@${T}`) },
      { text: 'Check the final settings.', cli: 'az ad sspr show', check: (s) => ran(s, 'ad sspr show') },
    ],
    wrap: 'SSPR only works for users in scope (Selected means one group), and only after they\'ve registered at least the number of methods you require. Turning on "require users to register when signing in" closes that gap before the first forgotten password.',
  },

  /* ------------------------------------------------ RBAC and the hierarchy */
  {
    id: 'adm-rbac-hierarchy', title: 'Role assignments across management groups, subscriptions and resource groups', icon: '🎭', level: 'Intermediate', minutes: 14, start: 'shell',
    intro: 'Ben needs to read everything in the company and manage one app. Put the subscription under a management group, give Ben Reader high up and Contributor low down, read his effective access, see what Contributor still can\'t do, and move a resource between resource groups.',
    learn: ['Scopes: management group → subscription → resource group → resource', 'Role assignments inherit downward and add up', 'Contributor can\'t grant access; Owner and User Access Administrator can', 'Moving a resource changes its ID but not its region'],
    topics: ['rbac-roles-and-scopes', 'interpret-access-assignments', 'resource-groups-subscriptions-management-groups'],
    tasks: [
      { text: 'Create the management group **mg-contoso** and move the subscription under it.', cli: 'az account management-group create --name mg-contoso && az account management-group subscription add --name mg-contoso --subscription "Learning subscription (simulated)"', check: (s) => ev(s, 'mg.sub', (d) => d.mg === 'mg-contoso') },
      { text: `Create the resource group **rg-app** and the user **Ben Okafor** (ben@${T}).`, cli: `az group create -n rg-app -l westeurope && az ad user create --display-name "Ben Okafor" --user-principal-name ben@${T} --password "Contoso!2026x"`, check: (s) => !!s.rg('rg-app') && ev(s, 'user.create', (d) => lc(d.upn) === `ben@${T}`) },
      { text: 'Give Ben **Reader** at **mg-contoso** and **Contributor** on **rg-app**.', cli: `az role assignment create --assignee ben@${T} --role Reader --scope /providers/Microsoft.Management/managementGroups/mg-contoso && az role assignment create --assignee ben@${T} --role Contributor --resource-group rg-app`, check: (s) => ev(s, 'adm.role.assign', (d) => d.role === 'Reader' && d.scope === 'mg/mg-contoso') && ev(s, 'role.assign', (d) => d.role === 'Contributor' && d.scope === 'rg/rg-app') },
      { text: 'List Ben\'s assignments **including inherited ones** on rg-app, then read the **NotActions** of Contributor.', cli: `az role assignment list --assignee ben@${T} --resource-group rg-app --include-inherited -o table && az role definition list --name Contributor`, check: (s) => ev(s, 'adm.access.view', (d) => d.inherited && d.rows >= 2) && ev(s, 'adm.roledef.view', (d) => lc(d.name) === 'contributor') },
      { text: 'Sign in as Ben and try to make himself **Owner** of rg-app. It\'s blocked.', cli: `az login --username ben@${T} && az role assignment create --assignee ben@${T} --role Owner --resource-group rg-app`, check: (s) => ev(s, 'rbac.denied', (d) => lc(d.user) === `ben@${T}` && d.action === 'authorize') },
      { text: 'Sign back in as yourself, create **rg-archive** and a storage account in rg-app, then **move** the storage account to rg-archive.', cli: `az logout && az group create -n rg-archive -l westeurope && az storage account create -n stapp0424 -g rg-app && az resource move --destination-group rg-archive --ids /subscriptions/${SUB_ID}/resourceGroups/rg-app/providers/Microsoft.Storage/storageAccounts/stapp0424`, check: (s) => ev(s, 'adm.resource.move', (d) => d.name === 'stapp0424' && d.to === 'rg-archive') },
    ],
    wrap: 'Azure RBAC adds up every role a user has at the scope and everything above it. Reader at a management group reaches every subscription below; Contributor on one resource group adds write access there. Contributor\'s NotActions remove Microsoft.Authorization writes, which is why Ben couldn\'t promote himself. Moving a resource keeps its region and changes its ID.',
  },

  /* ------------------------------------------------ policy, locks, tags, cost */
  {
    id: 'adm-policy-locks-cost', title: 'Policy, locks, tag inheritance and a budget', icon: '📜', level: 'Intermediate', minutes: 15, start: 'shell',
    intro: 'Finance wants every resource tagged with its cost center, nothing outside Europe, production frozen during the audit, and an alert before the month\'s spend runs away. Build all four guardrails and see each one bite.',
    learn: ['Deny vs Modify policy effects, and why Modify needs a managed identity', 'Remediation tasks fix resources that already exist', 'ReadOnly vs CanNotDelete locks', 'Budgets alert at thresholds; Advisor suggests savings'],
    topics: ['azure-policy-for-admins', 'locks-and-tags-at-scale', 'budgets-cost-alerts-and-advisor'],
    tasks: [
      { text: 'Create **rg-finance** with the tag **costcenter=FIN-042**, and a storage account in it.', cli: 'az group create -n rg-finance -l westeurope --tags costcenter=FIN-042 && az storage account create -n stfin0424 -g rg-finance', check: (s) => ev(s, 'storage.create', (d) => d.name === 'stfin0424') },
      { text: 'Assign **Allowed locations** (West Europe, North Europe) to rg-finance, then try to create a storage account in **East US**.', cli: 'az policy assignment create -n eu-only --policy allowed-locations --params locations=westeurope,northeurope -g rg-finance && az storage account create -n stfinus0424 -g rg-finance -l eastus', check: (s) => ev(s, 'policy.deny', (d) => lc(d.rg) === 'rg-finance') },
      { text: 'Assign **Inherit a tag from the resource group if missing** for *costcenter* with a system-assigned identity, then run a **remediation task** so the existing storage account gets the tag.', cli: 'az policy assignment create -n inherit-cc --policy inherit-rg-tag --params tagName=costcenter -g rg-finance --mi-system-assigned --location westeurope && az policy remediation create -n fix-cc --policy-assignment inherit-cc -g rg-finance', check: (s) => ev(s, 'adm.policy.remediate', (d) => d.assignment === 'inherit-cc' && d.fixed >= 1) },
      { text: 'Freeze rg-finance with a **ReadOnly** lock, then try to change its tags.', cli: 'az lock create -n audit-freeze -t ReadOnly -g rg-finance && az group update -n rg-finance --tags costcenter=FIN-042 env=prod', check: (s) => ev(s, 'blocked', (d) => lc(d.rg) === 'rg-finance') },
      { text: 'The audit is over. Swap it for a **CanNotDelete** lock and try to delete the group.', cli: 'az lock delete -n audit-freeze -g rg-finance && az lock create -n no-delete -t CanNotDelete -g rg-finance && az group delete -n rg-finance --yes', check: (s) => ev(s, 'lock.delete', (d) => d.name === 'audit-freeze') && ev(s, 'delete.blocked', (d) => lc(d.rg) === 'rg-finance') },
      { text: 'Add a VM, create a **$40 monthly budget**, and read **Azure Advisor**.', cli: 'az vm create -g rg-finance -n vm-fin01 --image Ubuntu2204 --size Standard_B2s --generate-ssh-keys && az consumption budget create --budget-name fin-monthly --amount 40 --category cost --time-grain monthly && az advisor recommendation list -o table', check: (s) => ev(s, 'budget.alert', (d) => d.name === 'fin-monthly') && ev(s, 'advisor.list') },
    ],
    wrap: 'Deny stops a bad resource before it exists. Modify fixes new resources as they\'re deployed and needs a managed identity; a remediation task fixes the ones that already exist. ReadOnly blocks every write, even a tag change; CanNotDelete only blocks deletes. A budget doesn\'t stop spending: it alerts at the thresholds you set, and Advisor tells you where to save.',
  },
];
