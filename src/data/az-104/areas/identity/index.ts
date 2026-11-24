/**
 * AZ-104 "identity" area (module identity-and-governance): everything this part
 * of the course plugs into the shared engines. The merge files in
 * src/data/az-104/*.ts import these names.
 */
import type { LessonSims } from '../../../az-900/lesson-sims';
import type { Sim3D } from '../../../az-900/sims3d';
export { TOURS } from './tours';
export { PROBLEMS, ITEMS, SORT, RIDDLES, COMPARE, SERVICES } from './content';

const M = 'adminidentity' as const;

/** Lesson slug → 3D step + portal walkthrough. */
export const SIMS: Record<string, LessonSims> = {
  'entra-users-and-groups': { d3: { mode: M, start: 0, intro: 'Change Sam\'s department and watch which group follows.' }, tour: { id: 'adm-entra-user-group', intro: 'Create a user, then a dynamic group with a rule.' } },
  'entra-licenses-and-guest-users': { d3: { mode: M, start: 1, intro: 'License the group, then try a direct license with no usage location.' }, tour: { id: 'adm-entra-license-guest', intro: 'License a group and invite a partner as a guest.' } },
  'self-service-password-reset': { d3: { mode: M, start: 2, intro: 'Reset with two methods, then with only one.' }, tour: { id: 'adm-sspr', intro: 'Turn on SSPR for a pilot group and require two methods.' } },
  'rbac-roles-and-scopes': { d3: { mode: M, start: 4, intro: 'Assign a role at the management group, then at one resource group.' }, tour: { id: 'adm-rbac-assign', intro: 'Add a role assignment to a group at resource group scope.' } },
  'interpret-access-assignments': { d3: { mode: M, start: 5, intro: 'Try each role, then add a deny assignment.' }, tour: { id: 'adm-check-access', intro: 'Use Check access and read Contributor\'s NotActions.' } },
  'azure-policy-for-admins': { d3: { mode: M, start: 6, intro: 'Deploy against Deny, Audit and Modify, then remediate.' }, tour: { id: 'adm-policy-assign', intro: 'Assign a Modify policy with a managed identity and remediate.' } },
  'locks-and-tags-at-scale': { d3: { mode: M, start: 7, intro: 'Delete and update under each lock, then let policy copy a tag.' }, tour: { id: 'adm-locks-tags', intro: 'Add a Delete lock and tag a resource group.' } },
  'resource-groups-subscriptions-management-groups': { d3: { mode: M, start: 3, intro: 'Move a subscription to a new parent, then move a resource.' }, tour: { id: 'adm-mg-sub-rg', intro: 'Create a management group and move resources.' } },
  'budgets-cost-alerts-and-advisor': { d3: { mode: M, start: 8, intro: 'Let the month run and see which alerts fire.' }, tour: { id: 'adm-budget-advisor', intro: 'Create a budget with alerts and read Advisor\'s cost tips.' } },
};

/** Narration for the 'adminidentity' 3D scene (builder: src/lib/dc3d/admin/adminidentity.ts). */
export const SCENE: Sim3D = {
  title: 'Run identity and governance: Entra ID, RBAC, Policy, locks and cost',
  steps: [
    { title: 'Users and groups in your tenant', text: 'Your **Microsoft Entra tenant** holds **users** and **groups**. In an **assigned** group you add people yourself. In a **dynamic** group a **rule** such as `user.department -eq "Sales"` adds and removes them as their properties change (Entra ID P1).', actions: [{ id: 'assigned', label: '➕ …I add Ana to the assigned IT group?', kind: 'ok' }, { id: 'dynamic', label: '🔄 …Sam\'s department changes to Sales?', kind: 'ok' }] },
    { title: 'Licenses and guests', text: '**Group-based licensing** gives every member of a group a license, and takes it back when they leave. A **direct** assignment needs the user\'s **usage location** first. A **guest** from a partner tenant signs in with their **own** account (B2B collaboration).', actions: [{ id: 'grouplic', label: '🎫 …we license the Sales group?', kind: 'ok' }, { id: 'direct', label: '🚫 …we license Lee directly with no usage location?', kind: 'danger' }, { id: 'guest', label: '🤝 …Priya from Fabrikam accepts the invite?', kind: 'ok' }] },
    { title: 'Self-service password reset', text: '**SSPR** lets users reset their own password at aka.ms/sspr. You choose who it\'s for (**None**, **Selected** group or **All**) and how many methods they must prove (**1 or 2**). Users must **register** methods before they can use them.', actions: [{ id: 'reset2', label: '✅ …Ana resets with app + email?', kind: 'ok' }, { id: 'reset1', label: '⛔ …Lee registered only one method?', kind: 'danger' }] },
    { title: 'The management ladder', text: '**Management groups** sit above **subscriptions**, which hold **resource groups**, which hold **resources**. You can nest management groups six levels below the **Tenant Root Group**. Move a subscription and it takes on its new parent\'s policies and roles.', actions: [{ id: 'movesub', label: '🚚 …we move Dev/Test under mg-nonprod?', kind: 'plain' }, { id: 'moveres', label: '📦 …we move a storage account to rg-archive?', kind: 'plain' }] },
    { title: 'Role assignments flow down', text: 'An **Azure role assignment** = **who** (user, group, service principal, managed identity) + **role definition** + **scope**. Assign it at a management group and it **inherits** to every subscription, resource group and resource below.', actions: [{ id: 'assignmg', label: '🎭 …Ben gets Reader at mg-contoso?', kind: 'ok' }, { id: 'assignrg', label: '🛠️ …Ben gets Contributor on rg-app only?', kind: 'ok' }] },
    { title: 'Effective access', text: 'Roles **add up**. **Owner** does everything, **Contributor** everything except grant access, **Reader** only looks, and **User Access Administrator** only manages access. A **deny assignment** beats every role.', actions: [{ id: 'contrib', label: '🛠️ …the Contributor deploys a VM?', kind: 'ok' }, { id: 'grant', label: '🔑 …the Contributor tries to grant access?', kind: 'danger' }, { id: 'reader', label: '👀 …the Reader tries to delete?', kind: 'danger' }, { id: 'uaa', label: '🗝️ …the User Access Administrator grants a role?', kind: 'ok' }, { id: 'deny', label: '⛔ …a deny assignment covers the Owner?', kind: 'danger' }] },
    { title: 'Azure Policy: deny, audit, modify', text: '**Azure Policy** checks what gets deployed. **Deny** refuses it, **Audit** lets it in but flags it non-compliant, **Modify** changes it (for example adds a tag) and needs a managed identity. A **remediation task** fixes resources that already exist.', actions: [{ id: 'deny-pol', label: '🇺🇸 …someone deploys in East US under Deny?', kind: 'danger' }, { id: 'audit', label: '📝 …an unencrypted disk meets an Audit policy?', kind: 'plain' }, { id: 'modify', label: '🏷️ …a new VM arrives without a tag under Modify?', kind: 'ok' }, { id: 'remediate', label: '🧹 …we run a remediation task?', kind: 'ok' }] },
    { title: 'Locks and tags', text: 'A **CanNotDelete** lock lets people change a resource but not delete it. A **ReadOnly** lock blocks every write. Locks apply to everyone, Owners too. **Tags** on a resource group aren\'t inherited unless a **policy** copies them down.', actions: [{ id: 'del-locked', label: '🗑️ …someone deletes under CanNotDelete?', kind: 'danger' }, { id: 'upd-cnd', label: '⚙️ …someone resizes a VM under CanNotDelete?', kind: 'ok' }, { id: 'upd-ro', label: '🧊 …someone adds a tag under ReadOnly?', kind: 'danger' }, { id: 'tags', label: '🏷️ …the inherit-tag policy runs?', kind: 'ok' }] },
    { title: 'Budgets and Advisor', text: 'A **budget** watches spend for a scope and sends **alerts** at thresholds, on **actual** or **forecasted** cost, optionally to an **action group**. It doesn\'t stop anything by itself. **Azure Advisor** points at savings like idle VMs.', actions: [{ id: 'spend', label: '📈 …the month runs and spend climbs?', kind: 'danger' }, { id: 'advisor', label: '💡 …we act on Advisor\'s right-size tip?', kind: 'ok' }] },
  ],
};
