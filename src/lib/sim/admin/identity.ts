/**
 * AZ-104 "identity and governance" commands for the simulated Cloud Shell
 * (EDUCATION ONLY). Adds what the base CLI doesn't have: user property
 * updates, dynamic groups, license assignment, SSPR (practice shortcuts),
 * role definitions, extra built-in roles and management-group scopes, an
 * effective-access view, a Modify policy with remediation, and resource moves.
 *
 * Commands that only exist here as practice shortcuts say so in their output.
 * Real equivalents are named next to each one (Microsoft Graph PowerShell or
 * the portal blade). Every state change emits an `adm.*` event.
 */
import { run, one, many, has, req, lc, json, out, adm, uuid, table, SimError, SUB_ID, TYPE_INFO, type Cmd, type Handler, type Parsed, type World, type AdminOut } from './kit';

const NOTE = 'ℹ Practice shortcut:';
const DIRECTORY_COUNTRY = 'IN';

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */
interface UserProps { department?: string; jobTitle?: string; usageLocation?: string; enabled: boolean; mustChange?: boolean }
interface Seat { name: string; total: number }
interface ExtraRole { principal: string; role: string; scope: string } // scope: 'mg/<n>' | 'subscription' | 'rg/<n>' | 'res/<rg>/<name>'
interface ModifyAssignment { name: string; tagName: string; scope: string; identity: string }
interface IdState {
  props: Record<string, UserProps>;
  dynamic: Record<string, string>;
  userLic: Record<string, string[]>;
  groupLic: Record<string, string[]>;
  sspr: { enabled: 'None' | 'Selected' | 'All'; group?: string; required: 1 | 2; methods: string[] };
  ssprReg: Record<string, string[]>;
  roles: ExtraRole[];
  modify: ModifyAssignment[];
  remediations: { name: string; assignment: string; fixed: number }[];
}
const st = (w: World): IdState => {
  const a = adm(w);
  return (a.identity ??= {
    props: {}, dynamic: {}, userLic: {}, groupLic: {},
    sspr: { enabled: 'None', required: 1, methods: ['mobileAppNotification', 'mobileAppCode', 'email', 'mobilePhone'] },
    ssprReg: {}, roles: [], modify: [], remediations: [],
  } as IdState);
};

export const SKUS: Record<string, Seat> = {
  SPE_E3: { name: 'Microsoft 365 E3', total: 25 },
  SPE_E5: { name: 'Microsoft 365 E5', total: 5 },
  AAD_PREMIUM: { name: 'Microsoft Entra ID P1', total: 50 },
  AAD_PREMIUM_P2: { name: 'Microsoft Entra ID P2', total: 10 },
};
const SSPR_METHODS: Record<string, string> = {
  mobileappnotification: 'mobileAppNotification', mobileappcode: 'mobileAppCode', mobileapp: 'mobileAppNotification',
  email: 'email', mobilephone: 'mobilePhone', phone: 'mobilePhone', officephone: 'officePhone', securityquestions: 'securityQuestions',
};

/** Built-in Azure roles this practice tenant knows (simplified permissions). */
export const ROLE_DEFS: Record<string, { description: string; actions: string[]; notActions: string[]; dataActions?: string[]; kind: 'privileged' | 'job' }> = {
  Owner: { kind: 'privileged', description: 'Grants full access to manage all resources, including the ability to assign roles in Azure RBAC.', actions: ['*'], notActions: [] },
  Contributor: { kind: 'privileged', description: 'Grants full access to manage all resources, but does not allow you to assign roles in Azure RBAC, manage assignments in Azure Blueprints, or share image galleries.', actions: ['*'], notActions: ['Microsoft.Authorization/*/Delete', 'Microsoft.Authorization/*/Write', 'Microsoft.Authorization/elevateAccess/Action', 'Microsoft.Blueprint/blueprintAssignments/write', 'Microsoft.Blueprint/blueprintAssignments/delete', 'Microsoft.Compute/galleries/share/action', 'Microsoft.Purview/consents/write', 'Microsoft.Purview/consents/delete'] },
  Reader: { kind: 'job', description: 'View all resources, but does not allow you to make any changes.', actions: ['*/read'], notActions: [] },
  'User Access Administrator': { kind: 'privileged', description: 'Lets you manage user access to Azure resources.', actions: ['*/read', 'Microsoft.Authorization/*', 'Microsoft.Support/*'], notActions: [] },
  'Role Based Access Control Administrator': { kind: 'privileged', description: 'Manage access to Azure resources by assigning roles using Azure RBAC. This role does not allow you to manage access using other ways, such as Azure Policy.', actions: ['Microsoft.Authorization/roleAssignments/write', 'Microsoft.Authorization/roleAssignments/delete', '*/read', 'Microsoft.Support/*'], notActions: [] },
  'Virtual Machine Contributor': { kind: 'job', description: 'Create and manage virtual machines, manage disks, install and run software. Does not grant access to the virtual network or storage account the VMs connect to, and does not let you sign in to the VM.', actions: ['Microsoft.Compute/virtualMachines/*', 'Microsoft.Compute/disks/*', 'Microsoft.Network/networkInterfaces/*', 'Microsoft.Resources/subscriptions/resourceGroups/read', '*/read'], notActions: [] },
  'Network Contributor': { kind: 'job', description: 'Lets you manage networks, but not access to them.', actions: ['Microsoft.Network/*', 'Microsoft.Resources/subscriptions/resourceGroups/read'], notActions: [] },
  'Storage Account Contributor': { kind: 'job', description: 'Lets you manage storage accounts, including accessing storage account keys which provide full access to storage account data.', actions: ['Microsoft.Storage/storageAccounts/*', 'Microsoft.Resources/subscriptions/resourceGroups/read'], notActions: [] },
  'Storage Blob Data Reader': { kind: 'job', description: 'Read and list Azure Storage containers and blobs.', actions: ['Microsoft.Storage/storageAccounts/blobServices/containers/read'], notActions: [], dataActions: ['Microsoft.Storage/storageAccounts/blobServices/containers/blobs/read'] },
  'Cost Management Reader': { kind: 'job', description: 'Can view cost data and configuration (e.g. budgets, exports).', actions: ['Microsoft.Consumption/*/read', 'Microsoft.CostManagement/*/read', 'Microsoft.Billing/billingPeriods/read', 'Microsoft.Resources/subscriptions/read'], notActions: [] },
  'Resource Policy Contributor': { kind: 'job', description: 'Users with rights to create/modify resource policy, create support ticket and read resources/hierarchy.', actions: ['Microsoft.Authorization/policyassignments/*', 'Microsoft.Authorization/policydefinitions/*', 'Microsoft.PolicyInsights/*', '*/read'], notActions: [] },
};
const BASE_ROLES = ['owner', 'contributor', 'reader'];
const roleName = (r?: string) => Object.keys(ROLE_DEFS).find((k) => lc(k) === lc(r));

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const needUser = (w: World, id?: string) => {
  const u = w.findUser(id ?? '');
  if (!u) throw new SimError(`Resource '${id}' does not exist or one of its queried reference-property objects are not present.`, 'Request_ResourceNotFound');
  return u;
};
const propsOf = (w: World, upn: string): UserProps => (st(w).props[upn] ??= { enabled: true });
const needGroup = (w: World, g?: string) => {
  const x = w.groups.find((y) => lc(y.name) === lc(g));
  if (!x) throw new SimError(`Group '${g}' was not found.`, 'NotFound');
  return x;
};
const isDynamic = (w: World, g: string) => Object.keys(st(w).dynamic).some((k) => lc(k) === lc(g));

/** Very small dynamic-rule evaluator: user.<prop> -eq|-ne|-startsWith|-contains "value", joined by -and. */
function matches(rule: string, u: { upn: string; name: string; guest?: boolean }, p: UserProps) {
  const parts = rule.replace(/^\s*\(|\)\s*$/g, '').split(/\s+-and\s+/i);
  return parts.every((c) => {
    const m = /\(?\s*user\.(\w+)\s+-(eq|ne|startswith|contains)\s+["']?([^"')]*)["']?\s*\)?/i.exec(c);
    if (!m) return false;
    const field = lc(m[1]);
    const val = lc(m[3]);
    const have = lc(field === 'department' ? p.department : field === 'jobtitle' ? p.jobTitle : field === 'usagelocation' ? p.usageLocation : field === 'usertype' ? (u.guest ? 'Guest' : 'Member') : field === 'accountenabled' ? String(p.enabled) : field === 'userprincipalname' ? u.upn : field === 'displayname' ? u.name : '');
    const op = lc(m[2]);
    return op === 'eq' ? have === val : op === 'ne' ? have !== val : op === 'startswith' ? have.startsWith(val) : have.includes(val);
  });
}
function validRule(rule: string) {
  return rule.split(/\s+-and\s+/i).every((c) => /\(?\s*user\.\w+\s+-(eq|ne|startswith|contains)\s+\S+/i.test(c));
}
/** Re-evaluate every dynamic group (Entra does this in the background). */
function sync(w: World) {
  const s = st(w);
  for (const [gName, rule] of Object.entries(s.dynamic)) {
    const g = w.groups.find((x) => x.name === gName);
    if (!g) continue;
    const want = w.users.filter((u) => matches(rule, u, propsOf(w, u.upn))).map((u) => u.upn);
    const added = want.filter((u) => !g.members.includes(u));
    const removed = g.members.filter((u) => !want.includes(u));
    g.members = want;
    if (added.length || removed.length) w.emit('adm.group.dynamic.sync', { group: g.name, added, removed, members: want.length });
  }
}
const seatsUsed = (w: World, sku: string) => {
  const s = st(w);
  const users = new Set<string>();
  for (const [upn, l] of Object.entries(s.userLic)) if (l.includes(sku)) users.add(upn);
  for (const [g, l] of Object.entries(s.groupLic)) if (l.includes(sku)) w.groups.find((x) => x.name === g)?.members.forEach((m) => users.add(m));
  return users.size;
};
const licensesOf = (w: World, upn: string) => {
  const s = st(w);
  const direct = (s.userLic[upn] ?? []).map((k) => ({ sku: k, via: 'Direct' }));
  const inherited = Object.entries(s.groupLic).flatMap(([g, l]) => (w.groups.find((x) => x.name === g)?.members.includes(upn) ? l.map((k) => ({ sku: k, via: `Inherited (${g})` })) : []));
  return [...direct, ...inherited];
};
const skuOf = (v?: string) => {
  const k = Object.keys(SKUS).find((x) => lc(x) === lc(v) || lc(SKUS[x].name) === lc(v));
  if (!k) throw new SimError(`License '${v}' isn't available in this tenant. Try: ${Object.keys(SKUS).join(', ')}.`, 'InvalidLicense');
  return k;
};

/** Scope string from --scope / --resource-group, including management groups and single resources. */
function scopeOf(w: World, p: Parsed): { key: string; label: string; rg?: string } {
  const g = one(p, '--resource-group');
  if (g) { const rg = w.needRg(g).name; return { key: `rg/${rg}`, label: `/subscriptions/${SUB_ID}/resourceGroups/${rg}`, rg }; }
  const sc = one(p, '--scope') ?? '';
  const mg = /managementGroups\/([^/\s]+)/i.exec(sc)?.[1];
  if (mg) {
    const m = w.mgs.find((x) => lc(x.name) === lc(mg));
    if (!m) throw new SimError(`Management group '${mg}' was not found.`, 'ManagementGroupNotFound');
    return { key: `mg/${m.name}`, label: `/providers/Microsoft.Management/managementGroups/${m.name}` };
  }
  const rgm = /resourceGroups\/([^/\s]+)(?:\/providers\/[^/]+\/[^/]+\/([^/\s]+))?/i.exec(sc);
  if (rgm) {
    const rg = w.needRg(rgm[1]).name;
    if (rgm[2]) {
      const r = w.res.find((x) => lc(x.rg) === lc(rg) && lc(x.name) === lc(rgm[2]));
      if (!r) throw new SimError(`The resource '${rgm[2]}' was not found in resource group '${rg}'.`, 'ResourceNotFound');
      return { key: `res/${rg}/${r.name}`, label: r.id, rg };
    }
    return { key: `rg/${rg}`, label: `/subscriptions/${SUB_ID}/resourceGroups/${rg}`, rg };
  }
  return { key: 'subscription', label: `/subscriptions/${SUB_ID}` };
}
const labelOf = (key: string) => key === 'subscription' ? `/subscriptions/${SUB_ID}` : key.startsWith('mg/') ? `/providers/Microsoft.Management/managementGroups/${key.slice(3)}` : key.startsWith('rg/') ? `/subscriptions/${SUB_ID}/resourceGroups/${key.slice(3)}` : `/subscriptions/${SUB_ID}/resourceGroups/${key.split('/')[1]}/…/${key.split('/')[2]}`;
const principalOf = (w: World, assignee?: string) => {
  const g = w.groups.find((x) => lc(x.name) === lc(assignee));
  if (g) return `group:${g.name}`;
  const u = w.findUser(assignee ?? '');
  if (!u) throw new SimError(`Cannot find user or service principal in graph database for '${assignee}'. If the assignee is an appId, make sure the corresponding service principal is created with 'az ad sp create --id ${assignee}'.`, 'PrincipalNotFound');
  return u.upn;
};
/** Is `key` (where the assignment sits) at or above `target` (the scope being checked)? */
function covers(w: World, key: string, target: string) {
  if (key === target) return true;
  if (key.startsWith('mg/')) return w.mgChain().map(lc).includes(lc(key.slice(3)));
  if (key === 'subscription') return true;
  if (key.startsWith('rg/') && target.startsWith('res/')) return lc(target.split('/')[1]) === lc(key.slice(3));
  return false;
}
const allAssignments = (w: World): ExtraRole[] => [
  ...w.roles.map((r) => ({ principal: r.principal, role: r.role as string, scope: r.scope })),
  ...st(w).roles,
];

/* ------------------------------------------------------------------ */
/* Commands                                                            */
/* ------------------------------------------------------------------ */
const userUpdate: Handler = (p, w) => {
  req(p, [['--id', '']]);
  const u = needUser(w, one(p, '--id'));
  w.allow('authorize', undefined, 'Microsoft.Directory/users/update');
  const pr = propsOf(w, u.upn);
  const changes: Record<string, unknown> = {};
  if (has(p, '--display-name')) { u.name = one(p, '--display-name') ?? u.name; changes.displayName = u.name; }
  if (has(p, '--account-enabled')) { pr.enabled = !/^(false|0|no)$/i.test(one(p, '--account-enabled') ?? 'true'); changes.accountEnabled = pr.enabled; }
  if (has(p, '--force-change-password-next-sign-in')) { pr.mustChange = !/^(false|0|no)$/i.test(one(p, '--force-change-password-next-sign-in') ?? 'true'); changes.forceChangePasswordNextSignIn = pr.mustChange; }
  if (has(p, '--password')) changes.passwordProfile = 'reset';
  const extra: string[] = [];
  if (has(p, '--department')) { pr.department = one(p, '--department'); changes.department = pr.department; extra.push('--department'); }
  if (has(p, '--job-title')) { pr.jobTitle = one(p, '--job-title'); changes.jobTitle = pr.jobTitle; extra.push('--job-title'); }
  if (has(p, '--usage-location')) {
    const loc = (one(p, '--usage-location') ?? '').toUpperCase();
    if (!/^[A-Z]{2}$/.test(loc)) throw new SimError('Usage location is a two-letter country code (ISO 3166), such as IN, GB or US.', 'InvalidUsageLocation');
    pr.usageLocation = loc; changes.usageLocation = loc; extra.push('--usage-location');
  }
  if (!Object.keys(changes).length) throw new SimError('Nothing to update. Try --display-name, --account-enabled false, --force-change-password-next-sign-in true, or (practice) --department / --job-title / --usage-location.', 'MissingArgs');
  w.emit('adm.user.update', { upn: u.upn, changes });
  sync(w);
  const tip = extra.length ? `\n${NOTE} real 'az ad user update' doesn't take ${extra.join(', ')}. Use Edit properties on the user in the portal, or Update-MgUser -UserId ${u.upn} -Department … -UsageLocation … in Microsoft Graph PowerShell.` : '';
  const groups = w.groups.filter((g) => g.members.includes(u.upn)).map((g) => g.name);
  return { out: `${tip.trim() ? tip.trim() + '\n' : ''}Updated ${u.upn}. Groups now: ${groups.join(', ') || '(none)'}` };
};

const userShow: Handler = (p, w) => {
  req(p, [['--id', '']]);
  const u = needUser(w, one(p, '--id'));
  const pr = propsOf(w, u.upn);
  return out(p, {
    displayName: u.name, userPrincipalName: u.upn, userType: u.guest ? 'Guest' : 'Member', accountEnabled: pr.enabled,
    department: pr.department ?? null, jobTitle: pr.jobTitle ?? null, usageLocation: pr.usageLocation ?? null,
    memberOf: w.groups.filter((g) => g.members.includes(u.upn)).map((g) => g.name),
    licenses: licensesOf(w, u.upn).map((l) => `${l.sku} (${l.via})`),
  });
};

const groupCreateDynamic: Cmd = {
  when: (p) => has(p, '--membership-rule'),
  run: (p, w) => {
    req(p, [['--display-name', ''], ['--membership-rule', '']]);
    const rule = one(p, '--membership-rule')!;
    if (!validRule(rule)) throw new SimError(`'${rule}' isn't a valid membership rule. Example: user.department -eq "Sales"`, 'InvalidMembershipRule');
    const name = one(p, '--display-name')!;
    w.createGroup(name, 'cli');
    st(w).dynamic[name] = rule;
    sync(w);
    const g = needGroup(w, name);
    w.emit('adm.group.dynamic', { name, rule, members: g.members.length, users: [...g.members] });
    return { out: `${NOTE} 'az ad group create' can't make dynamic groups. In real Azure choose Membership type: Dynamic User in the portal, or New-MgGroup -GroupTypes DynamicMembership -MembershipRule '…' -MembershipRuleProcessingState On. Dynamic groups need Microsoft Entra ID P1.\n` + json({ displayName: name, groupTypes: ['DynamicMembership'], membershipRule: rule, membershipRuleProcessingState: 'On', securityEnabled: true, members: g.members }) };
  },
};

const memberList: Handler = (p, w) => {
  req(p, [['--group', '']]);
  const g = needGroup(w, one(p, '--group'));
  const rows = g.members.map((m) => { const u = w.findUser(m)!; return { DisplayName: u?.name ?? m, UserPrincipalName: m, UserType: u?.guest ? 'Guest' : 'Member' }; });
  return out(p, rows, rows, ['DisplayName', 'UserPrincipalName', 'UserType']);
};

const userLicense: Handler = (p, w) => {
  req(p, [['--id', ''], ['--sku', '']]);
  const u = needUser(w, one(p, '--id'));
  const sku = skuOf(one(p, '--sku'));
  const pr = propsOf(w, u.upn);
  if (!pr.usageLocation) {
    w.emit('adm.license.blocked', { upn: u.upn, sku, reason: 'usageLocation' });
    throw new SimError(`License assignment failed because ${u.upn} has no usage location. Set it first (portal: user → Edit properties → Usage location), then assign the license.`, 'UsageLocationNotSet');
  }
  if (seatsUsed(w, sku) >= SKUS[sku].total) {
    w.emit('adm.license.blocked', { upn: u.upn, sku, reason: 'seats' });
    throw new SimError(`There aren't enough ${SKUS[sku].name} licenses. All ${SKUS[sku].total} are assigned.`, 'CountViolation');
  }
  const l = (st(w).userLic[u.upn] ??= []);
  if (!l.includes(sku)) l.push(sku);
  w.emit('adm.license.assign', { target: 'user', upn: u.upn, sku });
  return { out: `${NOTE} real equivalent: Set-MgUserLicense -UserId ${u.upn} -AddLicenses @{SkuId=…} -RemoveLicenses @(), or the user's Licenses blade.\nAssigned ${SKUS[sku].name} to ${u.upn} directly. Seats used: ${seatsUsed(w, sku)}/${SKUS[sku].total}.` };
};

const groupLicense: Handler = (p, w) => {
  req(p, [['--group', ''], ['--sku', '']]);
  const g = needGroup(w, one(p, '--group'));
  const sku = skuOf(one(p, '--sku'));
  const l = (st(w).groupLic[g.name] ??= []);
  if (!l.includes(sku)) l.push(sku);
  const used = seatsUsed(w, sku);
  const fallback = g.members.filter((m) => !propsOf(w, m).usageLocation);
  w.emit('adm.license.assign', { target: 'group', group: g.name, sku, users: g.members.length });
  return { out: `${NOTE} real equivalent: the group's Licenses blade (+ Assignments), or Set-MgGroupLicense. Group-based licensing needs Microsoft Entra ID P1 (or a plan that includes it).\nAssigned ${SKUS[sku].name} to group '${g.name}'. ${g.members.length} member(s) now inherit it, and anyone who joins later gets it automatically. Seats used: ${used}/${SKUS[sku].total}.` + (fallback.length ? `\n${fallback.length} member(s) have no usage location, so the directory's location (${DIRECTORY_COUNTRY}) is used for them.` : '') };
};

const licenseList: Handler = (p, w) => {
  const rows = Object.entries(SKUS).map(([k, s]) => ({ SkuPartNumber: k, Product: s.name, Assigned: seatsUsed(w, k), Total: s.total }));
  return out(p, rows, rows, ['SkuPartNumber', 'Product', 'Assigned', 'Total']);
};

const ssprUpdate: Handler = (p, w) => {
  const s = st(w).sspr;
  const en = one(p, '--enabled');
  if (en) {
    const v = ['None', 'Selected', 'All'].find((x) => lc(x) === lc(en));
    if (!v) throw new SimError('--enabled must be None, Selected or All.', 'InvalidValue');
    s.enabled = v as IdState['sspr']['enabled'];
  }
  if (has(p, '--group')) s.group = needGroup(w, one(p, '--group')).name;
  if (s.enabled === 'Selected' && !s.group) throw new SimError('With --enabled Selected you also need --group: the one group SSPR applies to.', 'MissingArgs');
  if (has(p, '--methods-required')) {
    const n = Number(one(p, '--methods-required'));
    if (n !== 1 && n !== 2) throw new SimError('--methods-required must be 1 or 2.', 'InvalidValue');
    s.required = n;
  }
  if (has(p, '--methods')) {
    const ms = many(p, '--methods').flatMap((x) => x.split(',')).map((x) => SSPR_METHODS[lc(x).replace(/[^a-z]/g, '')]).filter(Boolean);
    if (!ms.length) throw new SimError('Pick methods from: mobileAppNotification, mobileAppCode, email, mobilePhone, officePhone, securityQuestions.', 'InvalidValue');
    s.methods = [...new Set(ms)];
  }
  if (s.methods.length < s.required) throw new SimError(`You require ${s.required} methods but only allow ${s.methods.length}. Allow more methods.`, 'InvalidValue');
  w.emit('adm.sspr.update', { enabled: s.enabled, group: s.group, required: s.required, methods: [...s.methods] });
  return { out: `${NOTE} in real Azure this is Microsoft Entra ID → Password reset (Properties, Authentication methods, Registration), not a CLI command.\n` + json({ selfServicePasswordReset: s.enabled, selectedGroup: s.enabled === 'Selected' ? s.group : null, numberOfMethodsRequired: s.required, methodsAvailable: s.methods, requireRegistrationAtSignIn: true, daysBeforeReconfirm: 180 }) };
};

const ssprRegister: Handler = (p, w) => {
  req(p, [['--user', ''], ['--method', '']]);
  const u = needUser(w, one(p, '--user'));
  const m = SSPR_METHODS[lc(one(p, '--method')).replace(/[^a-z]/g, '')];
  if (!m) throw new SimError('Unknown method. Try email, mobileAppNotification, mobileAppCode or mobilePhone.', 'InvalidValue');
  const l = (st(w).ssprReg[u.upn] ??= []);
  if (!l.includes(m)) l.push(m);
  w.emit('adm.sspr.register', { upn: u.upn, method: m, count: l.length });
  return { out: `${NOTE} users register at https://aka.ms/mysecurityinfo (or are prompted at sign-in).\n${u.upn} has registered: ${l.join(', ')}.` };
};

const ssprReset: Handler = (p, w) => {
  req(p, [['--user', '']]);
  const u = needUser(w, one(p, '--user'));
  const s = st(w).sspr;
  const fail = (reason: string, msg: string) => { w.emit('adm.sspr.reset', { upn: u.upn, ok: false, reason }); throw new SimError(msg, 'PasswordResetDenied'); };
  if (u.guest) fail('guest', 'Guests reset their password in their own home tenant, not in yours.');
  const inScope = s.enabled === 'All' || (s.enabled === 'Selected' && !!s.group && !!w.groups.find((g) => g.name === s.group)?.members.includes(u.upn));
  if (!inScope) fail('scope', `SSPR isn't enabled for ${u.upn}. Self service password reset enabled is '${s.enabled}'${s.enabled === 'Selected' ? ` and they aren't in '${s.group}'` : ''}. Contact your administrator.`);
  const usable = (st(w).ssprReg[u.upn] ?? []).filter((m) => s.methods.includes(m));
  if (usable.length < s.required) fail('methods', `${u.upn} has ${usable.length} usable method(s) registered, but the policy needs ${s.required}. They can't reset until they register more at https://aka.ms/mysecurityinfo.`);
  w.emit('adm.sspr.reset', { upn: u.upn, ok: true, methods: usable.slice(0, s.required) });
  return { out: `${NOTE} users do this at https://aka.ms/sspr.\n✅ ${u.upn} verified with ${usable.slice(0, s.required).join(' + ')} and set a new password. No helpdesk ticket needed.` };
};

const ssprShow: Handler = (p, w) => out(p, { ...st(w).sspr, registrations: st(w).ssprReg });

const roleDefList: Handler = (p, w) => {
  const n = one(p, '--name');
  const keys = Object.keys(ROLE_DEFS).filter((k) => !n || lc(k) === lc(n));
  if (n && !keys.length) return { out: '[]' };
  w.emit('adm.roledef.view', { name: n ?? 'all' });
  const rows = keys.map((k) => ({ RoleName: k, Type: 'BuiltInRole', Kind: ROLE_DEFS[k].kind === 'privileged' ? 'Privileged administrator' : 'Job function', Description: ROLE_DEFS[k].description.slice(0, 70) + (ROLE_DEFS[k].description.length > 70 ? '…' : '') }));
  return out(p, keys.map((k) => ({ roleName: k, roleType: 'BuiltInRole', description: ROLE_DEFS[k].description, assignableScopes: ['/'], permissions: [{ actions: ROLE_DEFS[k].actions, notActions: ROLE_DEFS[k].notActions, dataActions: ROLE_DEFS[k].dataActions ?? [], notDataActions: [] }] })), rows, ['RoleName', 'Kind', 'Description']);
};

const roleAssignCreate: Cmd = {
  // The base CLI handles Owner/Contributor/Reader at subscription or resource-group scope.
  when: (p) => !BASE_ROLES.includes(lc(one(p, '--role'))) || /managementGroups\/|\/providers\/(?!Microsoft\.Management)[^/]+\/[^/]+\/[^/\s]+/i.test(one(p, '--scope') ?? ''),
  run: (p, w) => {
    req(p, [['--assignee', ''], ['--role', '']]);
    const role = roleName(one(p, '--role'));
    if (!role) throw new SimError(`Role '${one(p, '--role')}' doesn't exist. Run 'az role definition list -o table' to see built-in roles.`, 'RoleDefinitionNotFound');
    const sc = scopeOf(w, p);
    w.allow('authorize', sc.rg, 'Microsoft.Authorization/roleAssignments/write');
    const principal = principalOf(w, one(p, '--assignee'));
    const s = st(w);
    if (!s.roles.some((r) => r.principal === principal && r.role === role && r.scope === sc.key)) s.roles.push({ principal, role, scope: sc.key });
    w.emit('adm.role.assign', { principal, role, scope: sc.key });
    return out(p, { id: `${sc.label}/providers/Microsoft.Authorization/roleAssignments/${uuid()}`, principalName: principal.replace(/^group:/, ''), principalType: principal.startsWith('group:') ? 'Group' : 'User', roleDefinitionName: role, scope: sc.label });
  },
};

const roleAssignList: Cmd = {
  when: (p) => has(p, '--assignee') || has(p, '--include-inherited') || has(p, '--all') || has(p, '--scope'),
  run: (p, w) => {
    const who = one(p, '--assignee');
    const inherited = has(p, '--include-inherited');
    let target = 'subscription';
    if (has(p, '--resource-group') || has(p, '--scope')) target = scopeOf(w, p).key;
    let principals: string[] | null = null;
    if (who) {
      const g = w.groups.find((x) => lc(x.name) === lc(who));
      if (g) principals = [`group:${g.name}`];
      else { const u = needUser(w, who); principals = w.principalsOf(u.upn); }
    }
    const rows = allAssignments(w)
      .filter((r) => !principals || principals.includes(r.principal))
      .filter((r) => has(p, '--all') || r.scope === target || (inherited && covers(w, r.scope, target)))
      .map((r) => ({
        Principal: r.principal.replace(/^group:/, '') + (r.principal.startsWith('group:') ? ' (group)' : ''),
        Role: r.role,
        Scope: r.scope === 'subscription' ? 'Subscription' : r.scope.startsWith('mg/') ? `Management group ${r.scope.slice(3)}` : r.scope.startsWith('rg/') ? `Resource group ${r.scope.slice(3)}` : `Resource ${r.scope.split('/')[2]}`,
        Inherited: r.scope === target ? 'This scope' : covers(w, r.scope, target) ? 'Inherited' : 'Below this scope',
        Via: r.principal.startsWith('group:') ? `Group ${r.principal.slice(6)}` : 'Direct',
      }));
    w.emit('adm.access.view', { assignee: who ?? 'all', rows: rows.length, inherited });
    const tip = who ? `\nTip: roles add up. Effective access = every role here, at every scope listed, unless a deny assignment blocks an action.` : '';
    if (lc(one(p, '--output')) === 'table') return { out: (table(rows, ['Principal', 'Role', 'Scope', 'Inherited', 'Via']) || '(no role assignments)') + tip };
    return out(p, rows.map((r) => ({ principalName: r.Principal, roleDefinitionName: r.Role, scope: r.Scope, inherited: r.Inherited })));
  },
};

const roleAssignDelete: Handler = (p, w) => {
  req(p, [['--assignee', '']]);
  const principal = principalOf(w, one(p, '--assignee'));
  const role = roleName(one(p, '--role'));
  const sc = has(p, '--scope') || has(p, '--resource-group') ? scopeOf(w, p) : null;
  w.allow('authorize', sc?.rg, 'Microsoft.Authorization/roleAssignments/delete');
  const hit = (r: { principal: string; role: string; scope: string }) => r.principal === principal && (!role || r.role === role) && (!sc || r.scope === sc.key);
  const before = w.roles.length + st(w).roles.length;
  w.roles = w.roles.filter((r) => !hit(r));
  st(w).roles = st(w).roles.filter((r) => !hit(r));
  const removed = before - w.roles.length - st(w).roles.length;
  if (!removed) throw new SimError('No matched assignments were found to delete.', 'RoleAssignmentNotFound');
  w.emit('adm.role.remove', { principal, role, scope: sc?.key, removed });
  return { out: `Deleted ${removed} role assignment(s) for ${principal.replace(/^group:/, '')}.` };
};

/* ---- Azure Policy: Modify effect + remediation ---- */
const MODIFY_DEFS = ['inherit-rg-tag', 'inherit a tag from the resource group if missing', 'ea3f2387-9b95-492a-a190-fcdc54f7b070'];
const policyModify: Cmd = {
  when: (p) => MODIFY_DEFS.includes(lc(one(p, '--policy'))),
  run: (p, w) => {
    req(p, [['--name', '-n'], ['--policy', '']]);
    const sc = scopeOf(w, p);
    w.allow('authorize', sc.rg, 'Microsoft.Authorization/policyAssignments/write');
    const tagName = /tagName=([^\s,]+)/i.exec((p.flags['--params'] ?? []).join(' '))?.[1];
    if (!tagName) throw new SimError('This policy needs a value for tagName, e.g. --params tagName=costcenter', 'MissingArgs');
    if (!has(p, '--mi-system-assigned') && !has(p, '--mi-user-assigned')) {
      w.emit('adm.policy.noidentity', { name: one(p, '--name') });
      throw new SimError('Policy assignments with a Modify or DeployIfNotExists effect need a managed identity to make changes. Add --mi-system-assigned --location westeurope (and give it the roles it needs).', 'InvalidPolicyAssignmentIdentity');
    }
    if (has(p, '--mi-system-assigned') && !has(p, '--location')) throw new SimError('A system-assigned identity needs --location for the assignment.', 'MissingArgs');
    const name = one(p, '--name')!;
    const s = st(w);
    s.modify = s.modify.filter((m) => m.name !== name).concat({ name, tagName, scope: sc.key, identity: has(p, '--mi-system-assigned') ? 'SystemAssigned' : 'UserAssigned' });
    const missing = w.res.filter((r) => covers(w, sc.key, `res/${r.rg}/${r.name}`) && !r.props.auto && w.rg(r.rg)?.tags[tagName] !== undefined && r.tags[tagName] === undefined).length;
    w.emit('adm.policy.assign', { name, effect: 'Modify', tagName, scope: sc.key });
    return { out: json({ name, displayName: 'Inherit a tag from the resource group if missing', policyDefinitionId: '/providers/Microsoft.Authorization/policyDefinitions/ea3f2387-9b95-492a-a190-fcdc54f7b070', scope: sc.label, parameters: { tagName: { value: tagName } }, identity: { type: has(p, '--mi-system-assigned') ? 'SystemAssigned' : 'UserAssigned' }, enforcementMode: 'Default' }) + `\nNew and updated resources get the tag when they're deployed. ${missing} existing resource(s) are missing it: they stay non-compliant until a remediation task runs (az policy remediation create).` };
  },
};

const remediationCreate: Handler = (p, w) => {
  req(p, [['--name', '-n'], ['--policy-assignment', '']]);
  const s = st(w);
  const aName = (one(p, '--policy-assignment') ?? '').split('/').pop()!;
  const a = s.modify.find((m) => lc(m.name) === lc(aName));
  if (!a) {
    if (w.policies.some((x) => lc(x.name) === lc(aName))) throw new SimError(`Assignment '${aName}' uses a Deny effect. Remediation tasks only work for DeployIfNotExists and Modify policies; Deny stops bad resources at creation instead.`, 'InvalidRemediation');
    throw new SimError(`Policy assignment '${aName}' was not found.`, 'PolicyAssignmentNotFound');
  }
  const fixedNames: string[] = [];
  for (const r of w.res.filter((x) => covers(w, a.scope, `res/${x.rg}/${x.name}`) && !x.props.auto)) {
    const v = w.rg(r.rg)?.tags[a.tagName];
    if (v === undefined || r.tags[a.tagName] !== undefined) continue;
    w.assertWritable(r.rg, `remediate tag on ${r.name}`);
    r.tags[a.tagName] = v;
    fixedNames.push(r.name);
  }
  s.remediations.push({ name: one(p, '--name')!, assignment: a.name, fixed: fixedNames.length });
  w.emit('adm.policy.remediate', { name: one(p, '--name'), assignment: a.name, fixed: fixedNames.length, resources: fixedNames });
  return { out: json({ name: one(p, '--name'), policyAssignmentId: labelOf(a.scope) + `/providers/Microsoft.Authorization/policyAssignments/${a.name}`, provisioningState: 'Succeeded', deploymentStatus: { totalDeployments: fixedNames.length, successfulDeployments: fixedNames.length, failedDeployments: 0 } }) + (fixedNames.length ? `\nTagged ${a.tagName} on: ${fixedNames.join(', ')}` : '\nNothing to fix: every resource already has the tag (or its resource group has no value for it).') };
};
const remediationList: Handler = (p, w) => {
  const rows = st(w).remediations.map((r) => ({ Name: r.name, Assignment: r.assignment, Fixed: r.fixed, State: 'Succeeded' }));
  return out(p, rows, rows, ['Name', 'Assignment', 'Fixed', 'State']);
};

/* ---- Moving resources between resource groups ---- */
const resourceMove: Handler = (p, w) => {
  req(p, [['--destination-group', ''], ['--ids', '']]);
  const dest = w.needRg(one(p, '--destination-group')!);
  if (has(p, '--destination-subscription-id') && lc(one(p, '--destination-subscription-id')) !== lc(SUB_ID)) throw new SimError('This practice tenant has one subscription. Move between resource groups instead.', 'SubscriptionNotFound');
  const ids = many(p, '--ids').flatMap((x) => x.split(/\s+/)).filter(Boolean);
  const list = ids.map((id) => {
    const m = /resourceGroups\/([^/]+)\/providers\/(.+)\/([^/]+)$/i.exec(id);
    const r = m && w.res.find((x) => lc(x.rg) === lc(m[1]) && lc(x.name) === lc(m[3]) && lc(TYPE_INFO[x.type].arm) === lc(m[2]));
    if (!r) throw new SimError(`Resource '${id}' was not found.`, 'ResourceNotFound');
    if (lc(r.rg) === lc(dest.name)) throw new SimError(`'${r.name}' is already in '${dest.name}'.`, 'InvalidMove');
    return r;
  });
  // A VM must move together with its disks and network interfaces (validation fails otherwise).
  for (const vmRes of list.filter((r) => r.type === 'vm')) {
    const deps = w.res.filter((x) => lc(x.rg) === lc(vmRes.rg) && (
      (x.type === 'disk' && (lc(x.name) === lc(vmRes.props.disk) || lc(x.props.attachedTo) === lc(vmRes.name))) ||
      (x.type === 'nic' && lc(x.name) === lc(vmRes.props.nic))));
    const missing = deps.filter((d) => !list.includes(d));
    if (missing.length) {
      w.emit('adm.move.blocked', { name: vmRes.name, missing: missing.map((d) => d.name), reason: 'dependencies' });
      throw new SimError(`Move validation failed: virtual machine '${vmRes.name}' must move together with its dependent resources. Add these to --ids: ${missing.map((d) => `${d.name} (${TYPE_INFO[d.type].label.toLowerCase()})`).join(', ')}. Across subscriptions, its virtual network must move too.`, 'ResourceMoveValidationFailed');
    }
  }
  const moved: string[] = [];
  for (const r of list) {
    w.assertWritable(r.rg, `move ${r.name} out`);
    w.assertWritable(dest.name, `move ${r.name} in`);
  }
  for (const r of list) {
    const from = r.rg;
    r.rg = dest.name;
    r.id = w.idFor(r.type, dest.name, r.name);
    moved.push(r.name);
    w.emit('adm.resource.move', { name: r.name, from, to: dest.name, location: r.location });
  }
  return { out: `Moved ${moved.join(', ')} to '${dest.name}'. The resource ID changed (it contains the resource group name), but the region didn't: it's still in the same location. Update any scripts that use the old ID.` };
};

/* ------------------------------------------------------------------ */
const T: Record<string, Cmd | Handler> = {
  'ad user update': userUpdate,
  'ad user show': userShow,
  'ad user license assign': userLicense,
  'ad group create': groupCreateDynamic,
  'ad group member list': memberList,
  'ad group license assign': groupLicense,
  'ad license list': licenseList,
  'ad sspr update': ssprUpdate,
  'ad sspr register': ssprRegister,
  'ad sspr reset': ssprReset,
  'ad sspr show': ssprShow,
  'role definition list': roleDefList,
  'role assignment create': roleAssignCreate,
  'role assignment list': roleAssignList,
  'role assignment delete': roleAssignDelete,
  'policy assignment create': policyModify,
  'policy remediation create': remediationCreate,
  'policy remediation list': remediationList,
  'resource move': resourceMove,
};

export function az(tokens: string[], w: World): AdminOut | null {
  // Members of a dynamic group come from its rule; Entra ID refuses manual adds.
  const words = tokens.filter((t) => !t.startsWith('-')).slice(0, 4).map(lc).join(' ');
  if (words.startsWith('ad group member add')) {
    const i = tokens.findIndex((t) => lc(t) === '--group');
    const g = i >= 0 ? tokens[i + 1] : undefined;
    if (g && isDynamic(w, g)) {
      w.emit('cli', { command: 'az ad group member add', path: 'ad group member add', line: `az ${tokens.join(' ')}` });
      w.emit('adm.group.manual-blocked', { group: g });
      return { error: `(Request_BadRequest) Insufficient privileges or invalid operation: you can't add members to the dynamic group '${g}' by hand. Its membership comes from the rule '${st(w).dynamic[Object.keys(st(w).dynamic).find((k) => lc(k) === lc(g))!]}'. Change the user's properties instead.` };
    }
  }
  return run(T, tokens, w);
}
export function shell(_tokens: string[], _w: World): AdminOut | null { return null; }
export const COMPLETIONS: string[] = Object.keys(T).map((k) => `az ${k}`).concat(['az ad group create --membership-rule']);
