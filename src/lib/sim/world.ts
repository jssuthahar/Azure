/**
 * The extended practice world: everything in Sim plus identity (users, groups,
 * RBAC, Conditional Access), governance (Azure Policy, management groups,
 * budgets), networking, storage data, monitoring, serverless, containers,
 * Arc, Bicep deployments, zone outages and migration.
 * PRACTICE ONLY — nothing here touches real Azure. Prices are illustrative.
 */
import { Sim, SimError, SUB_ID, SUB_NAME, REGIONS, VM_SIZES, type Res, type RG, type Via } from './engine';

export const TENANT = 'learn.onmicrosoft.com';
export const ME = `learner@${TENANT}`;
export type Role = 'Owner' | 'Contributor' | 'Reader';

export interface User { upn: string; name: string; guest?: boolean }
export interface Group { name: string; members: string[] }
export interface RoleAssignment { principal: string; role: Role; scope: string } // scope: 'subscription' | 'rg/<name>'
export interface CaPolicy { name: string; target: string; location: 'any' | 'outside-office'; device: 'any' | 'personal'; grant: 'mfa' | 'block' | 'compliant' }
export interface MG { name: string; parent: string | null }
export type PolicyDef = 'allowed-locations' | 'require-tag' | 'allowed-vm-sizes';
export const POLICY_DEFS: Record<PolicyDef, { display: string; param: string }> = {
  'allowed-locations': { display: 'Allowed locations', param: 'locations' },
  'require-tag': { display: 'Require a tag on resources', param: 'tagName' },
  'allowed-vm-sizes': { display: 'Allowed virtual machine size SKUs', param: 'sizes' },
};
export interface PolicyAssignment { name: string; def: PolicyDef; scope: string; value: string[] } // scope: 'subscription' | 'rg/<n>' | 'mg/<n>'
export interface Notice { kind: 'info' | 'warn' | 'bad' | 'ok'; title: string; text: string; at: number }

/* ---------- small IPv4/CIDR helpers ---------- */
const ipNum = (ip: string) => ip.split('.').reduce((a, o) => a * 256 + Number(o), 0);
export function cidr(c: string): [number, number] {
  const m = /^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/.exec(c?.trim() ?? '');
  if (!m || m[1].split('.').some((o) => Number(o) > 255) || Number(m[2]) > 32) throw new SimError(`'${c}' is not a valid CIDR range, such as 10.0.0.0/16.`, 'InvalidAddressPrefix');
  const size = 2 ** (32 - Number(m[2]));
  const start = Math.floor(ipNum(m[1]) / size) * size;
  return [start, start + size - 1];
}
const inside = (a: [number, number], b: [number, number]) => a[0] >= b[0] && a[1] <= b[1];
const overlaps = (a: [number, number], b: [number, number]) => a[0] <= b[1] && b[0] <= a[1];
const numIp = (n: number) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.');

export const BICEP_FILE = `// main.bicep — a tiny web app environment
param prefix string = 'learn'
param location string = resourceGroup().location

resource st 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: 'st\${prefix}data'
  location: location
  sku: { name: 'Standard_ZRS' }
  kind: 'StorageV2'
}

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: 'plan-\${prefix}'
  location: location
  sku: { name: 'B1' }
}

resource app 'Microsoft.Web/sites@2023-12-01' = {
  name: 'app-\${prefix}-\${uniqueString(resourceGroup().id)}'
  location: location
  properties: { serverFarmId: plan.id }
}`;

export const ONPREM_SERVERS = [
  { name: 'web-srv-01', os: 'Windows Server 2019', cpu: 4, ram: 8, util: 18, size: 'Standard_B2s' },
  { name: 'app-srv-02', os: 'Ubuntu 20.04', cpu: 2, ram: 4, util: 9, size: 'Standard_B1s' },
  { name: 'sql-srv-01', os: 'Windows Server 2016 + SQL', cpu: 8, ram: 32, util: 41, size: 'Standard_D4s_v5' },
];

export class World extends Sim {
  users: User[] = [{ upn: ME, name: 'Learner (you)' }];
  groups: Group[] = [];
  roles: RoleAssignment[] = [{ principal: ME, role: 'Owner', scope: 'subscription' }];
  current = ME;
  ca: CaPolicy[] = [];
  mgs: MG[] = [{ name: 'Tenant Root Group', parent: null }];
  subParent = 'Tenant Root Group';
  policies: PolicyAssignment[] = [];
  budgets: { name: string; amount: number; fired: number[] }[] = [];
  outage: { location: string; zone: string } | null = null;
  notices: Notice[] = [];
  migrate = { discovered: false, assessed: false, migrated: [] as string[] };
  databox: { name: string; tb: number; step: number }[] = [];

  notify(kind: Notice['kind'], title: string, text: string) {
    this.notices.unshift({ kind, title, text, at: Date.now() });
    this.notices = this.notices.slice(0, 30);
  }

  /* ================= identity & RBAC ================= */
  principalsOf(upn: string) {
    return [upn, ...this.groups.filter((g) => g.members.includes(upn)).map((g) => `group:${g.name}`)];
  }
  rolesAt(upn: string, rg?: string): Role[] {
    const who = this.principalsOf(upn);
    return this.roles.filter((r) => who.includes(r.principal) && (r.scope === 'subscription' || (rg && r.scope.toLowerCase() === `rg/${rg.toLowerCase()}`))).map((r) => r.role);
  }
  need(action: 'read' | 'write' | 'delete' | 'authorize', rg?: string, op = 'write') {
    const roles = this.rolesAt(this.current, rg);
    const ok = action === 'read' ? roles.length > 0 : action === 'authorize' ? roles.includes('Owner') : roles.some((r) => r === 'Owner' || r === 'Contributor');
    if (!ok) {
      this.emit('rbac.denied', { user: this.current, action, rg });
      const scope = rg ? `/subscriptions/${SUB_ID}/resourceGroups/${rg}` : `/subscriptions/${SUB_ID}`;
      throw new SimError(`The client '${this.current}' does not have authorization to perform action '${op}' over scope '${scope}'. Ask an Owner to assign you a role such as Contributor.`, 'AuthorizationFailed');
    }
  }
  findUser(id: string) {
    const v = (id ?? '').toLowerCase();
    return this.users.find((u) => u.upn.toLowerCase() === v || u.upn.split('@')[0].toLowerCase() === v || u.name.toLowerCase() === v);
  }
  createUser(name: string, upn: string, via: Via = 'cli') {
    this.need('authorize', undefined, 'Microsoft.Directory/users/create');
    if (!upn || !/^[^@\s]+@[^@\s]+$/.test(upn)) throw new SimError(`'${upn}' is not a valid user principal name, such as sam@${TENANT}.`);
    if (this.findUser(upn)) throw new SimError(`A user with the principal name '${upn}' already exists.`, 'Conflict');
    const u = { upn, name: name || upn.split('@')[0] };
    this.users.push(u);
    this.emit('user.create', { upn, via });
    return u;
  }
  inviteGuest(email: string, via: Via = 'portal') {
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) throw new SimError('Enter a valid email address for the guest.');
    const upn = `${email.replace('@', '_')}#EXT#@${TENANT}`;
    if (this.findUser(upn)) throw new SimError('That guest has already been invited.');
    this.users.push({ upn, name: email, guest: true });
    this.emit('guest.invite', { email, via });
    this.notify('ok', 'Invitation sent', `${email} can now sign in with their own account as a guest (B2B collaboration).`);
  }
  createGroup(name: string, via: Via = 'cli') {
    this.need('authorize', undefined, 'Microsoft.Directory/groups/create');
    if (!name) throw new SimError('A group display name is required.');
    if (this.groups.some((g) => g.name.toLowerCase() === name.toLowerCase())) throw new SimError(`Group '${name}' already exists.`, 'Conflict');
    this.groups.push({ name, members: [] });
    this.emit('group.create', { name, via });
  }
  addMember(group: string, member: string, via: Via = 'cli') {
    const g = this.groups.find((x) => x.name.toLowerCase() === group.toLowerCase());
    if (!g) throw new SimError(`Group '${group}' was not found.`, 'NotFound');
    const u = this.findUser(member);
    if (!u) throw new SimError(`User '${member}' was not found. Create it first with 'az ad user create'.`, 'NotFound');
    if (!g.members.includes(u.upn)) g.members.push(u.upn);
    this.emit('group.member', { group: g.name, upn: u.upn, via });
  }
  assignRole(assignee: string, role: string, rg: string | undefined, via: Via = 'cli') {
    this.need('authorize', rg, 'Microsoft.Authorization/roleAssignments/write');
    const r = (['Owner', 'Contributor', 'Reader'] as Role[]).find((x) => x.toLowerCase() === (role ?? '').toLowerCase());
    if (!r) throw new SimError(`Role '${role}' doesn't exist. Try Owner, Contributor or Reader.`, 'RoleDefinitionNotFound');
    let principal: string;
    const g = this.groups.find((x) => x.name.toLowerCase() === (assignee ?? '').toLowerCase());
    if (g) principal = `group:${g.name}`;
    else {
      const u = this.findUser(assignee);
      if (!u) throw new SimError(`Cannot find user or group '${assignee}'.`, 'PrincipalNotFound');
      principal = u.upn;
    }
    if (rg) this.needRg(rg);
    const scope = rg ? `rg/${this.needRg(rg).name}` : 'subscription';
    if (!this.roles.some((x) => x.principal === principal && x.role === r && x.scope === scope)) this.roles.push({ principal, role: r, scope });
    this.emit('role.assign', { principal, role: r, scope, via });
    return { principal, role: r, scope };
  }
  login(upn: string) {
    const u = this.findUser(upn);
    if (!u) throw new SimError(`User '${upn}' was not found in the directory.`, 'UserNotFound');
    this.current = u.upn;
    this.emit('login', { upn: u.upn });
    return u;
  }
  logout() {
    this.current = ME;
    this.emit('login', { upn: ME });
  }

  /* ================= Conditional Access ================= */
  addCa(p: CaPolicy, via: Via = 'portal') {
    if (!p.name) throw new SimError('Give the policy a name.');
    this.ca = this.ca.filter((x) => x.name !== p.name).concat(p);
    this.emit('ca.create', { ...p, via });
  }
  whatIf(upn: string, location: 'office' | 'home' | 'unknown-country', device: 'company' | 'personal') {
    const u = this.findUser(upn);
    if (!u) throw new SimError('Pick a user.');
    const groups = this.groups.filter((g) => g.members.includes(u.upn)).map((g) => g.name.toLowerCase());
    const hits = this.ca.filter((p) =>
      (p.target === 'all' || groups.includes(p.target.toLowerCase()) || p.target.toLowerCase() === u.upn.toLowerCase()) &&
      (p.location === 'any' || location !== 'office') &&
      (p.device === 'any' || device === 'personal'),
    );
    const decision = hits.some((h) => h.grant === 'block') ? 'Block access' : hits.some((h) => h.grant === 'mfa') ? 'Require MFA' : hits.some((h) => h.grant === 'compliant') ? 'Require compliant device' : 'Allow';
    this.emit('ca.whatif', { upn: u.upn, location, device, decision, policies: hits.map((h) => h.name) });
    return { decision, policies: hits.map((h) => h.name) };
  }

  /* ================= management groups & policy ================= */
  createMg(name: string, parent = 'Tenant Root Group', via: Via = 'cli') {
    if (!/^[\w.()-]{1,90}$/.test(name ?? '')) throw new SimError(`Management group name '${name}' is invalid.`);
    if (this.mgs.some((m) => m.name.toLowerCase() === name.toLowerCase())) throw new SimError(`Management group '${name}' already exists.`, 'Conflict');
    const p = this.mgs.find((m) => m.name.toLowerCase() === parent.toLowerCase());
    if (!p) throw new SimError(`Parent management group '${parent}' was not found.`);
    const depth = (n: string | null): number => (n ? 1 + depth(this.mgs.find((m) => m.name === n)!.parent) : 0);
    if (depth(p.name) >= 7) throw new SimError('Management groups can be nested only six levels below the root.');
    this.mgs.push({ name, parent: p.name });
    this.emit('mg.create', { name, parent: p.name, via });
  }
  moveSub(mg: string, via: Via = 'cli') {
    const m = this.mgs.find((x) => x.name.toLowerCase() === mg.toLowerCase());
    if (!m) throw new SimError(`Management group '${mg}' was not found.`);
    this.subParent = m.name;
    this.emit('mg.sub', { mg: m.name, via });
  }
  mgChain() {
    const chain: string[] = [];
    let n: string | null = this.subParent;
    while (n) { chain.push(n); n = this.mgs.find((m) => m.name === n)!.parent; }
    return chain;
  }
  assignPolicy(name: string, def: string, value: string[], scope: string, via: Via = 'cli') {
    this.need('authorize', scope.startsWith('rg/') ? scope.slice(3) : undefined, 'Microsoft.Authorization/policyAssignments/write');
    const d = (Object.keys(POLICY_DEFS) as PolicyDef[]).find((k) => k === def || POLICY_DEFS[k].display.toLowerCase() === (def ?? '').toLowerCase());
    if (!d) throw new SimError(`Policy definition '${def}' was not found. Run 'az policy definition list -o table' to see what's available.`, 'PolicyDefinitionNotFound');
    if (!value.length) throw new SimError(`This policy needs a value for '${POLICY_DEFS[d].param}', e.g. --params ${POLICY_DEFS[d].param}=${d === 'allowed-locations' ? 'westeurope,northeurope' : d === 'require-tag' ? 'owner' : 'Standard_B1s,Standard_B2s'}`);
    if (scope.startsWith('rg/')) scope = `rg/${this.needRg(scope.slice(3)).name}`;
    if (scope.startsWith('mg/') && !this.mgs.some((m) => m.name.toLowerCase() === scope.slice(3).toLowerCase())) throw new SimError(`Management group '${scope.slice(3)}' was not found.`);
    const a = { name, def: d, scope, value: d === 'allowed-locations' ? value.map((v) => v.toLowerCase()) : value };
    this.policies = this.policies.filter((p) => p.name !== name).concat(a);
    this.emit('policy.assign', { ...a, via });
    return a;
  }
  removePolicy(name: string) {
    if (!this.policies.some((p) => p.name === name)) throw new SimError(`Policy assignment '${name}' was not found.`);
    this.policies = this.policies.filter((p) => p.name !== name);
    this.emit('policy.remove', { name });
  }
  policiesFor(rg: string) {
    const chain = this.mgChain().map((m) => `mg/${m.toLowerCase()}`);
    return this.policies.filter((p) => p.scope === 'subscription' || p.scope.toLowerCase() === `rg/${rg.toLowerCase()}` || chain.includes(p.scope.toLowerCase()));
  }
  violations(rg: string, location: string, tags: Record<string, string>, size?: string) {
    const out: { policy: PolicyAssignment; reason: string }[] = [];
    for (const p of this.policiesFor(rg)) {
      if (p.def === 'allowed-locations' && !p.value.includes(location)) out.push({ policy: p, reason: `location '${location}' is not in the allowed list (${p.value.join(', ')})` });
      if (p.def === 'require-tag' && !p.value.every((t) => tags[t] !== undefined && tags[t] !== '')) out.push({ policy: p, reason: `the required tag '${p.value.join(', ')}' is missing` });
      if (p.def === 'allowed-vm-sizes' && size && !p.value.map((v) => v.toLowerCase()).includes(size.toLowerCase())) out.push({ policy: p, reason: `size '${size}' is not allowed` });
    }
    return out;
  }
  guard(type: string, rg: string, location: string, tags: Record<string, string> = {}, size?: string) {
    const v = this.violations(rg, location, tags, size);
    if (v.length) {
      this.emit('policy.deny', { type, rg, policy: v[0].policy.name, reason: v[0].reason });
      throw new SimError(`Resource was disallowed by policy '${v[0].policy.name}' (${POLICY_DEFS[v[0].policy.def].display}): ${v[0].reason}.`, 'RequestDisallowedByPolicy');
    }
  }
  compliance() {
    return this.res
      .filter((r) => !r.props.auto && ['vm', 'storage', 'webapp', 'plan', 'vmss', 'vnet', 'aci', 'aks', 'functionapp'].includes(r.type))
      .map((r) => {
        const v = this.violations(r.rg, r.location, r.tags, r.type === 'vm' ? r.props.size : undefined);
        return { res: r, compliant: v.length === 0, reasons: v.map((x) => `${x.policy.name}: ${x.reason}`) };
      });
  }

  /* ================= RBAC + policy hooks on core operations ================= */
  createRg(name: string, location: string, tags: Record<string, string> = {}, via: Via = 'portal') {
    this.need('write', undefined, 'Microsoft.Resources/subscriptions/resourceGroups/write');
    return super.createRg(name, location, tags, via);
  }
  deleteRg(name: string, via: Via = 'portal') {
    this.need('delete', name, 'Microsoft.Resources/subscriptions/resourceGroups/delete');
    return super.deleteRg(name, via);
  }
  protected add(type: any, rg: RG, name: string, location: string, props: Record<string, any>, tags: Record<string, string> = {}) {
    this.need('write', rg.name, `${type}/write`);
    if (this.outage && props.zone === this.outage.zone && location === this.outage.location) props.zoneDown = true;
    return super.add(type, rg, name, location, props, tags);
  }
  createVm(o: Parameters<Sim['createVm']>[0] & { tags?: Record<string, string> }, via: Via = 'portal') {
    const g = this.needRg(o.rg);
    const loc = o.location ? this.checkLocation(o.location) : g.location;
    this.guard('vm', g.name, loc, o.tags ?? {}, o.size ?? 'Standard_B1s');
    if (this.outage && o.zone === this.outage.zone && loc === this.outage.location) throw new SimError(`Zone ${o.zone} in ${REGIONS[loc]} is currently unavailable. Try another zone.`, 'ZonalAllocationFailed');
    const vm = super.createVm(o, via);
    const t = o.tags ?? {};
    for (const r of this.inRg(g.name)) if (r.props.attachedTo === vm.name || [vm.props.nic, vm.props.pip, vm.props.nsg].includes(r.name)) { r.props.auto = true; Object.assign(r.tags, t); }
    this.inRg(g.name).filter((r) => r.type === 'vnet' && r.name === `${vm.name}VNET`).forEach((r) => (r.props.auto = true));
    Object.assign(vm.tags, t);
    vm.props.cpu = 6 + Math.round(Math.random() * 8);
    return vm;
  }
  createStorage(o: Parameters<Sim['createStorage']>[0] & { tags?: Record<string, string> }, via: Via = 'portal') {
    const g = this.needRg(o.rg);
    const loc = o.location ? this.checkLocation(o.location) : g.location;
    this.guard('storage', g.name, loc, o.tags ?? {});
    const st = super.createStorage(o, via);
    Object.assign(st.tags, o.tags ?? {});
    Object.assign(st.props, { containers: {} as Record<string, { name: string; tier: string; size: number }[]>, shares: [] as string[], queues: {} as Record<string, string[]>, tables: [] as string[], publicAccess: 'Enabled' });
    return st;
  }
  createPlan(o: Parameters<Sim['createPlan']>[0] & { tags?: Record<string, string> }, via: Via = 'portal') {
    const g = this.needRg(o.rg);
    this.guard('plan', g.name, o.location ? this.checkLocation(o.location) : g.location, o.tags ?? {});
    return super.createPlan(o, via);
  }
  createVmss(o: Parameters<Sim['createVmss']>[0] & { tags?: Record<string, string> }, via: Via = 'cli') {
    const g = this.needRg(o.rg);
    this.guard('vmss', g.name, g.location, o.tags ?? {}, o.size ?? 'Standard_B1s');
    return super.createVmss(o, via);
  }
  powerVm(rg: string, name: string, action: 'start' | 'stop' | 'deallocate' | 'restart', via: Via = 'portal') {
    this.need('write', rg, `virtualMachines/${action}/action`);
    const vm = super.powerVm(rg, name, action, via);
    if (action !== 'start' && action !== 'restart') vm.props.cpu = 0;
    else vm.props.cpu = 8;
    return vm;
  }
  deleteRes(r: Res, via: Via = 'portal') {
    this.need('delete', r.rg, `${r.type}/delete`);
    return super.deleteRes(r, via);
  }
  deleteVm(rg: string, name: string, via: Via = 'portal') {
    this.need('delete', rg, 'virtualMachines/delete');
    return super.deleteVm(rg, name, via);
  }

  /* ================= networking ================= */
  createVnet(o: { rg: string; name: string; prefix?: string; location?: string; subnet?: string; subnetPrefix?: string; tags?: Record<string, string> }, via: Via = 'cli') {
    const g = this.needRg(o.rg);
    this.writable(g, 'create');
    const loc = o.location ? this.checkLocation(o.location) : g.location;
    this.guard('vnet', g.name, loc, o.tags ?? {});
    if (!/^[\w.-]{2,64}$/.test(o.name ?? '')) throw new SimError(`Virtual network name '${o.name ?? ''}' is invalid.`);
    if (this.find('vnet', g.name, o.name)) throw new SimError(`Virtual network '${o.name}' already exists.`, 'Conflict');
    const space = o.prefix ?? '10.0.0.0/16';
    const sp = cidr(space);
    const subnets: { name: string; prefix: string; nsg?: string }[] = [];
    if (o.subnet) {
      const sn = cidr(o.subnetPrefix ?? '10.0.0.0/24');
      if (!inside(sn, sp)) throw new SimError(`Subnet prefix ${o.subnetPrefix} is not within the VNet address space ${space}.`, 'NetcfgSubnetRangeOutsideVnet');
      subnets.push({ name: o.subnet, prefix: o.subnetPrefix ?? '10.0.0.0/24' });
    }
    const v = this.add('vnet', g, o.name, loc, { addressSpace: space, subnetList: subnets, peerings: [] as { name: string; remote: string; state: string }[] }, o.tags ?? {});
    this.emit('vnet.create', { rg: g.name, name: v.name, space, via });
    return v;
  }
  vnetOf(rg: string, name: string) {
    const v = this.need('vnet', rg, name);
    v.props.subnetList ??= (v.props.subnets ?? []).map((s: string) => ({ name: s.split(' ')[0], prefix: s.match(/\((.*)\)/)?.[1] ?? '10.0.0.0/24' }));
    v.props.peerings ??= [];
    return v;
  }
  createSubnet(rg: string, vnet: string, name: string, prefix: string, nsg?: string, via: Via = 'cli') {
    const v = this.vnetOf(rg, vnet);
    this.writable(this.needRg(rg), 'update');
    const sn = cidr(prefix);
    if (!inside(sn, cidr(v.props.addressSpace))) throw new SimError(`Subnet '${name}' prefix ${prefix} is not within the VNet address space ${v.props.addressSpace}.`, 'NetcfgSubnetRangeOutsideVnet');
    const clash = v.props.subnetList.find((s: any) => overlaps(cidr(s.prefix), sn));
    if (clash) throw new SimError(`Subnet '${name}' (${prefix}) overlaps with subnet '${clash.name}' (${clash.prefix}). Subnets in a VNet cannot overlap.`, 'NetcfgSubnetRangesOverlap');
    if (nsg) this.need('nsg' as any, rg, nsg);
    v.props.subnetList.push({ name, prefix, nsg });
    this.emit('subnet.create', { rg: v.rg, vnet: v.name, name, prefix, nsg, via });
    return v;
  }
  setSubnetNsg(rg: string, vnet: string, subnet: string, nsg: string, via: Via = 'cli') {
    const v = this.vnetOf(rg, vnet);
    const s = v.props.subnetList.find((x: any) => x.name.toLowerCase() === subnet.toLowerCase());
    if (!s) throw new SimError(`Subnet '${subnet}' was not found in '${vnet}'.`, 'NotFound');
    this.need('nsg' as any, rg, nsg);
    s.nsg = nsg;
    this.emit('subnet.nsg', { rg: v.rg, vnet: v.name, subnet: s.name, nsg, via });
    return v;
  }
  createNsg(rg: string, name: string, via: Via = 'cli') {
    const g = this.needRg(rg);
    this.writable(g, 'create');
    if (this.find('nsg', g.name, name)) throw new SimError(`Network security group '${name}' already exists.`, 'Conflict');
    const n = this.add('nsg', g, name, g.location, { inbound: [] as string[], rules: [] as any[] });
    this.emit('nsg.create', { rg: g.name, name, via });
    return n;
  }
  addNsgRule(rg: string, nsgName: string, r: { name: string; priority: number; port: string; access: string; direction: string; source: string; protocol: string }, via: Via = 'cli') {
    const n = this.need('nsg', rg, nsgName);
    n.props.rules ??= [];
    if (!Number.isInteger(r.priority) || r.priority < 100 || r.priority > 4096) throw new SimError('--priority must be a whole number from 100 to 4096.', 'SecurityRuleInvalidPriority');
    if (n.props.rules.some((x: any) => x.priority === r.priority && x.direction === r.direction)) throw new SimError(`Another rule already uses priority ${r.priority}.`, 'SecurityRuleConflict');
    n.props.rules.push(r);
    n.props.rules.sort((a: any, b: any) => a.priority - b.priority);
    if (r.access.toLowerCase() === 'allow' && r.direction.toLowerCase() === 'inbound') n.props.inbound = [...new Set([...(n.props.inbound ?? []), r.port])];
    this.emit('nsg.rule', { rg: n.rg, nsg: n.name, ...r, via });
    return n;
  }
  deleteNsgRule(rg: string, nsgName: string, rule: string, via: Via = 'cli') {
    const n = this.need('nsg', rg, nsgName);
    const r = (n.props.rules ?? []).find((x: any) => x.name.toLowerCase() === rule.toLowerCase());
    if (!r) throw new SimError(`Rule '${rule}' was not found in '${nsgName}'.`, 'NotFound');
    n.props.rules = n.props.rules.filter((x: any) => x !== r);
    n.props.inbound = (n.props.inbound ?? []).filter((p: string) => p !== r.port);
    this.emit('nsg.rule.delete', { rg: n.rg, nsg: n.name, rule: r.name, via });
  }
  /** Close the management port a VM was created with (removes the open inbound port). */
  closeVmPort(rg: string, nsgName: string, port: string, via: Via = 'cli') {
    const n = this.need('nsg', rg, nsgName);
    n.props.inbound = (n.props.inbound ?? []).filter((p: string) => p !== port);
    n.props.rules = (n.props.rules ?? []).filter((x: any) => x.port !== port);
    this.res.filter((r) => r.type === 'vm' && r.props.nsg === n.name).forEach((vm) => (vm.props.ports = 'none'));
    this.emit('nsg.rule.delete', { rg: n.rg, nsg: n.name, port, via });
  }
  peer(rg: string, name: string, vnet: string, remote: string, via: Via = 'cli') {
    const a = this.vnetOf(rg, vnet);
    const b = this.res.find((r) => r.type === 'vnet' && (r.name.toLowerCase() === remote.toLowerCase() || r.id.toLowerCase() === remote.toLowerCase()));
    if (!b) throw new SimError(`Remote virtual network '${remote}' was not found.`, 'NotFound');
    this.vnetOf(b.rg, b.name);
    if (a === b) throw new SimError('A virtual network cannot be peered with itself.');
    if (overlaps(cidr(a.props.addressSpace), cidr(b.props.addressSpace)))
      throw new SimError(`Cannot peer '${a.name}' (${a.props.addressSpace}) with '${b.name}' (${b.props.addressSpace}) because their address spaces overlap.`, 'VnetAddressSpacesOverlap');
    a.props.peerings = a.props.peerings.filter((p: any) => p.remote !== b.name).concat({ name, remote: b.name, state: 'Initiated' });
    const back = b.props.peerings.find((p: any) => p.remote === a.name);
    if (back) { back.state = 'Connected'; a.props.peerings.find((p: any) => p.remote === b.name).state = 'Connected'; }
    this.emit('vnet.peer', { from: a.name, to: b.name, connected: !!back, global: a.location !== b.location, via });
    return a.props.peerings.find((p: any) => p.remote === b.name);
  }
  createVpnGateway(rg: string, name: string, vnet: string, sku = 'VpnGw1', via: Via = 'cli') {
    const g = this.needRg(rg);
    const v = this.vnetOf(rg, vnet);
    if (!v.props.subnetList.some((s: any) => s.name === 'GatewaySubnet'))
      throw new SimError(`Virtual network '${vnet}' needs a subnet named exactly 'GatewaySubnet' before you can create a VPN gateway. Example: az network vnet subnet create -g ${rg} --vnet-name ${vnet} -n GatewaySubnet --address-prefixes 10.1.255.0/27`, 'GatewaySubnetMissing');
    const gw = this.add('vpngw', g, name, v.location, { vnet: v.name, sku, type: 'Vpn', publicIp: `20.${50 + Math.floor(Math.random() * 150)}.9.${Math.floor(Math.random() * 250)}` });
    this.emit('vpngw.create', { rg: g.name, name, via });
    return gw;
  }
  createDnsZone(rg: string, name: string, via: Via = 'cli') {
    const g = this.needRg(rg);
    if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(name ?? '')) throw new SimError(`'${name}' is not a valid domain name, such as contoso-learn.com.`);
    const z = this.add('dnszone', g, name, 'global', { records: [] as { name: string; type: string; value: string }[], nameServers: ['ns1-04.azure-dns.com.', 'ns2-04.azure-dns.net.', 'ns3-04.azure-dns.org.', 'ns4-04.azure-dns.info.'] });
    this.emit('dns.zone', { rg: g.name, name, via });
    return z;
  }
  addARecord(rg: string, zone: string, name: string, ip: string, via: Via = 'cli') {
    const z = this.need('dnszone', rg, zone);
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip ?? '')) throw new SimError(`'${ip}' is not a valid IPv4 address.`);
    z.props.records.push({ name, type: 'A', value: ip });
    this.emit('dns.record', { zone: z.name, name, ip, via });
    return z;
  }
  resolve(host: string) {
    const h = host.toLowerCase().replace(/\.$/, '');
    for (const z of this.res.filter((r) => r.type === 'dnszone')) {
      if (h === z.name || h.endsWith('.' + z.name)) {
        const label = h === z.name ? '@' : h.slice(0, -z.name.length - 1);
        const rec = z.props.records.find((r: any) => r.name.toLowerCase() === label);
        this.emit('dns.lookup', { host: h, found: !!rec });
        return rec ? { ip: rec.value, server: z.props.nameServers[0] } : null;
      }
    }
    const st = this.res.find((r) => r.type === 'storage' && h.startsWith(r.name + '.'));
    if (st) {
      const pe = this.res.find((r) => r.type === 'pe' && r.props.target === st.name);
      this.emit('dns.lookup', { host: h, found: true, private: !!pe });
      return { ip: pe ? pe.props.ip : `20.60.${10 + (st.name.length % 200)}.${30 + (st.name.length % 100)}`, server: '168.63.129.16', private: !!pe };
    }
    this.emit('dns.lookup', { host: h, found: false });
    return null;
  }
  createPrivateEndpoint(rg: string, name: string, vnet: string, subnet: string, target: string, via: Via = 'cli') {
    const g = this.needRg(rg);
    const v = this.vnetOf(rg, vnet);
    const s = v.props.subnetList.find((x: any) => x.name.toLowerCase() === subnet.toLowerCase());
    if (!s) throw new SimError(`Subnet '${subnet}' was not found in '${vnet}'.`, 'NotFound');
    const st = this.res.find((r) => r.type === 'storage' && (r.name === target || r.id.toLowerCase() === target.toLowerCase()));
    if (!st) throw new SimError(`Target resource '${target}' was not found. Use the storage account name or ID.`, 'NotFound');
    const used = this.res.filter((r) => r.type === 'pe').length;
    const ip = numIp(cidr(s.prefix)[0] + 4 + used);
    const pe = this.add('pe', g, name, v.location, { target: st.name, subnet: s.name, vnet: v.name, ip, groupId: 'blob' });
    this.emit('pe.create', { rg: g.name, name, target: st.name, ip, via });
    return pe;
  }
  setPublicAccess(rg: string, name: string, value: string, via: Via = 'cli') {
    const st = this.need('storage', rg, name);
    const v = /^dis/i.test(value) ? 'Disabled' : 'Enabled';
    st.props.publicAccess = v;
    this.emit('storage.public', { name: st.name, value: v, via });
    return st;
  }

  /* ================= storage data ================= */
  storageByName(account: string) {
    const st = this.res.find((r) => r.type === 'storage' && r.name === (account ?? '').toLowerCase());
    if (!st) throw new SimError(`The storage account '${account}' was not found.`, 'StorageAccountNotFound');
    st.props.containers ??= {};
    st.props.shares ??= [];
    st.props.queues ??= {};
    st.props.tables ??= [];
    return st;
  }
  createContainer(account: string, name: string, via: Via = 'cli') {
    const st = this.storageByName(account);
    if (!/^[a-z0-9](?!.*--)[a-z0-9-]{1,61}[a-z0-9]$/.test(name ?? '')) throw new SimError(`Container name '${name}' is invalid. Use 3-63 lowercase letters, numbers and single hyphens.`, 'InvalidResourceName');
    st.props.containers[name] ??= [];
    this.emit('container.create', { account: st.name, name, via });
    return { created: true };
  }
  uploadBlob(account: string, container: string, name: string, tier = 'Hot', via: Via = 'cli') {
    const st = this.storageByName(account);
    const c = st.props.containers[container];
    if (!c) throw new SimError(`The specified container '${container}' does not exist.`, 'ContainerNotFound');
    if (!name) throw new SimError('A blob name is required (--name).');
    const t = ['Hot', 'Cool', 'Cold', 'Archive'].find((x) => x.toLowerCase() === tier.toLowerCase());
    if (!t) throw new SimError(`Tier '${tier}' is invalid. Use Hot, Cool, Cold or Archive.`);
    const existing = c.find((b: any) => b.name === name);
    const size = 120_000 + Math.floor(Math.random() * 3_000_000);
    if (existing) Object.assign(existing, { tier: t, size });
    else c.push({ name, tier: t, size });
    this.emit('blob.upload', { account: st.name, container, name, tier: t, via });
    const triggered = this.res.filter((r) => r.type === 'functionapp' && r.props.storage === st.name && (!r.props.watch || r.props.watch === container));
    for (const f of triggered) {
      f.props.executions = (f.props.executions ?? 0) + 1;
      f.props.log = [`${new Date().toLocaleTimeString()}  Executed 'Functions.ProcessUpload' (Succeeded, Duration=${120 + Math.floor(Math.random() * 300)}ms) for ${container}/${name}`, ...(f.props.log ?? [])].slice(0, 20);
      this.emit('function.run', { app: f.name, blob: name });
    }
    return triggered.map((f) => f.name);
  }
  setTier(account: string, container: string, name: string, tier: string, via: Via = 'cli') {
    const st = this.storageByName(account);
    const b = (st.props.containers[container] ?? []).find((x: any) => x.name === name);
    if (!b) throw new SimError(`The specified blob '${name}' does not exist.`, 'BlobNotFound');
    const t = ['Hot', 'Cool', 'Cold', 'Archive'].find((x) => x.toLowerCase() === (tier ?? '').toLowerCase());
    if (!t) throw new SimError(`Tier '${tier}' is invalid. Use Hot, Cool, Cold or Archive.`);
    const from = b.tier;
    b.tier = t;
    this.emit('blob.tier', { account: st.name, container, name, from, to: t, via });
    return { from, to: t };
  }
  downloadBlob(account: string, container: string, name: string) {
    const st = this.storageByName(account);
    const b = (st.props.containers[container] ?? []).find((x: any) => x.name === name);
    if (!b) throw new SimError(`The specified blob '${name}' does not exist.`, 'BlobNotFound');
    if (b.tier === 'Archive') {
      this.emit('blob.archived-read', { name });
      throw new SimError(`This operation is not permitted on an archived blob. Rehydrate it first by changing its tier to Hot or Cool (in real Azure this can take up to 15 hours).`, 'BlobArchived');
    }
    this.emit('blob.download', { name });
    return b;
  }
  createShare(account: string, name: string, via: Via = 'cli') {
    const st = this.storageByName(account);
    if (!st.props.shares.includes(name)) st.props.shares.push(name);
    this.emit('share.create', { account: st.name, name, via });
  }
  createQueue(account: string, name: string, via: Via = 'cli') {
    const st = this.storageByName(account);
    st.props.queues[name] ??= [];
    this.emit('queue.create', { account: st.name, name, via });
  }
  putMessage(account: string, queue: string, content: string, via: Via = 'cli') {
    const st = this.storageByName(account);
    const q = st.props.queues[queue];
    if (!q) throw new SimError(`The specified queue '${queue}' does not exist.`, 'QueueNotFound');
    if (new Blob([content]).size > 64 * 1024) throw new SimError('Queue messages can be at most 64 KB.');
    q.push(content);
    this.emit('queue.put', { account: st.name, queue, via });
  }
  createTable(account: string, name: string, via: Via = 'cli') {
    const st = this.storageByName(account);
    if (!st.props.tables.includes(name)) st.props.tables.push(name);
    this.emit('table.create', { account: st.name, name, via });
  }

  /* ================= serverless & containers ================= */
  createFunctionApp(o: { rg: string; name: string; storage: string; runtime?: string; watch?: string }, via: Via = 'cli') {
    const g = this.needRg(o.rg);
    this.writable(g, 'create');
    const st = this.res.find((r) => r.type === 'storage' && r.name === (o.storage ?? '').toLowerCase());
    if (!st) throw new SimError(`Storage account '${o.storage}' was not found. A function app needs a storage account.`, 'StorageAccountNotFound');
    const p = this.webappNameProblem(o.name);
    if (p) throw new SimError(p.replace('Web app', 'Function app'), 'Conflict');
    this.guard('functionapp', g.name, g.location, {});
    const f = this.add('functionapp', g, o.name, g.location, { storage: st.name, runtime: o.runtime ?? 'node', plan: 'Flex Consumption', host: `${o.name.toLowerCase()}.azurewebsites.net`, executions: 0, log: [] as string[], watch: o.watch });
    this.emit('functionapp.create', { rg: g.name, name: f.name, via });
    return f;
  }
  createAci(o: { rg: string; name: string; image: string; ports?: string }, via: Via = 'cli') {
    const g = this.needRg(o.rg);
    this.writable(g, 'create');
    if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(o.name ?? '')) throw new SimError(`Container group name '${o.name}' is invalid. Use lowercase letters, numbers and hyphens.`);
    if (!o.image) throw new SimError('--image is required, e.g. mcr.microsoft.com/azuredocs/aci-helloworld');
    this.guard('aci', g.name, g.location, {});
    const c = this.add('aci', g, o.name, g.location, { image: o.image, state: 'Running', ip: `20.${60 + Math.floor(Math.random() * 100)}.4.${Math.floor(Math.random() * 250)}`, ports: o.ports ?? '80' });
    this.emit('aci.create', { rg: g.name, name: c.name, via });
    return c;
  }
  createAks(o: { rg: string; name: string; nodes?: number }, via: Via = 'cli') {
    const g = this.needRg(o.rg);
    this.writable(g, 'create');
    this.guard('aks', g.name, g.location, {});
    const n = Math.max(1, Math.min(100, Number(o.nodes ?? 3)));
    const k = this.add('aks', g, o.name, g.location, { nodes: n, version: '1.31', state: 'Succeeded' });
    this.emit('aks.create', { rg: g.name, name: k.name, nodes: n, via });
    return k;
  }
  scaleAks(rg: string, name: string, nodes: number, via: Via = 'cli') {
    const k = this.need('aks', rg, name);
    if (!Number.isInteger(nodes) || nodes < 1 || nodes > 100) throw new SimError('--node-count must be between 1 and 100.');
    const from = k.props.nodes;
    k.props.nodes = nodes;
    this.emit('aks.scale', { name: k.name, from, to: nodes, via });
    return k;
  }

  /* ================= hybrid, IaC ================= */
  connectArc(rg: string, name: string, os = 'Windows Server 2019', via: Via = 'cli') {
    const g = this.needRg(rg);
    this.writable(g, 'create');
    const a = this.add('arc', g, name, g.location, { os, status: 'Connected', where: 'On-premises datacenter', agent: '1.4x' });
    this.emit('arc.connect', { rg: g.name, name, via });
    return a;
  }
  tagResource(r: Res, tags: Record<string, string>, via: Via = 'cli') {
    this.need('write', r.rg, 'tags/write');
    Object.assign(r.tags, tags);
    this.emit('res.tag', { rg: r.rg, name: r.name, type: r.type, tags: r.tags, via });
    return r;
  }
  deployBicep(rg: string, prefix = 'learn', whatIf = false, via: Via = 'cli') {
    const g = this.needRg(rg);
    const p = (prefix || 'learn').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'learn';
    const stName = `st${p}data`;
    const planName = `plan-${p}`;
    const hash = Math.abs([...g.name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)).toString(36).slice(0, 6);
    const appName = `app-${p}-${hash}`;
    const changes: string[] = [];
    if (!this.find('storage', g.name, stName)) changes.push(`+ Microsoft.Storage/storageAccounts/${stName}`);
    if (!this.find('plan', g.name, planName)) changes.push(`+ Microsoft.Web/serverfarms/${planName}`);
    if (!this.find('webapp', g.name, appName)) changes.push(`+ Microsoft.Web/sites/${appName}`);
    if (whatIf) {
      this.emit('deploy.whatif', { rg: g.name, changes: changes.length });
      return { changes, created: 0 };
    }
    if (!this.find('storage', g.name, stName)) this.createStorage({ rg: g.name, name: stName, sku: 'Standard_ZRS' }, via);
    if (!this.find('plan', g.name, planName)) this.createPlan({ rg: g.name, name: planName, sku: 'B1' }, via);
    if (!this.find('webapp', g.name, appName)) this.createWebapp({ rg: g.name, plan: planName, name: appName, runtime: 'NODE:20-lts' }, via);
    this.emit('deploy.create', { rg: g.name, created: changes.length, via });
    return { changes, created: changes.length };
  }

  /* ================= monitoring, advisor, defender ================= */
  createWorkspace(rg: string, name: string, via: Via = 'cli') {
    const g = this.needRg(rg);
    const w = this.add('law', g, name, g.location, { retention: 30 });
    this.emit('law.create', { rg: g.name, name, via });
    return w;
  }
  createAlert(rg: string, name: string, vmName: string, threshold: number, via: Via = 'cli') {
    const g = this.needRg(rg);
    const vm = this.need('vm', rg, vmName);
    if (!Number.isFinite(threshold) || threshold <= 0 || threshold > 100) throw new SimError('Use a condition like "avg Percentage CPU > 80".');
    const a = this.add('alert', g, name, 'global', { target: vm.name, metric: 'Percentage CPU', threshold, fired: 0, severity: 2 });
    this.emit('alert.create', { rg: g.name, name, target: vm.name, threshold, via });
    this.checkAlerts();
    return a;
  }
  setLoad(rg: string, vmName: string, cpu: number) {
    const vm = this.need('vm', rg, vmName);
    if (vm.props.power !== 'running') throw new SimError(`VM '${vm.name}' is not running. Start it first.`);
    vm.props.cpu = Math.max(0, Math.min(100, cpu));
    this.emit('vm.load', { name: vm.name, cpu: vm.props.cpu });
    this.checkAlerts();
    return vm;
  }
  checkAlerts() {
    for (const a of this.res.filter((r) => r.type === 'alert')) {
      const vm = this.res.find((r) => r.type === 'vm' && r.name === a.props.target && r.rg === a.rg);
      if (vm && (vm.props.cpu ?? 0) > a.props.threshold && !a.props.active) {
        a.props.active = true;
        a.props.fired++;
        this.notify('bad', `🔔 Alert fired: ${a.name}`, `Percentage CPU on ${vm.name} is ${vm.props.cpu}% (threshold ${a.props.threshold}%). An email and SMS were sent to the action group.`);
        this.emit('alert.fired', { name: a.name, vm: vm.name });
      } else if (vm && (vm.props.cpu ?? 0) <= a.props.threshold && a.props.active) {
        a.props.active = false;
        this.notify('ok', `✅ Alert resolved: ${a.name}`, `CPU on ${vm.name} is back to normal.`);
      }
    }
  }
  query(kql: string) {
    const q = (kql ?? '').trim();
    const table = q.split(/[\s|]/)[0];
    const take = Number(/take\s+(\d+)/i.exec(q)?.[1] ?? 20);
    let rows: Record<string, unknown>[];
    if (/^heartbeat$/i.test(table)) rows = this.res.filter((r) => (r.type === 'vm' && r.props.power === 'running') || r.type === 'arc').map((r) => ({ TimeGenerated: new Date().toISOString().slice(0, 19), Computer: r.name, OSType: r.type === 'arc' ? 'Windows (Arc)' : r.props.os, Category: 'Azure Monitor Agent' }));
    else if (/^perf$/i.test(table)) rows = this.res.filter((r) => r.type === 'vm').map((r) => ({ Computer: r.name, CounterName: '% Processor Time', CounterValue: r.props.cpu ?? 0 }));
    else if (/^azureactivity$/i.test(table)) rows = this.events.filter((e) => /create|delete|deallocate|start|stop|assign|lock/.test(e.type)).slice(-take).reverse().map((e) => ({ TimeGenerated: new Date(e.at).toISOString().slice(11, 19), OperationName: e.type, Resource: e.data.name ?? e.data.rg ?? '', Caller: this.current }));
    else throw new SimError(`'${table}' is not a known table in this practice workspace. Try Heartbeat, Perf or AzureActivity, e.g. "Heartbeat | take 10".`, 'SemanticError');
    if (/summarize\s+count\(\)\s+by\s+(\w+)/i.test(q)) {
      const col = /by\s+(\w+)/i.exec(q)![1];
      const m = new Map<string, number>();
      rows.forEach((r) => m.set(String(r[col]), (m.get(String(r[col])) ?? 0) + 1));
      rows = [...m].map(([k, v]) => ({ [col]: k, count_: v }));
    }
    rows = rows.slice(0, take);
    this.emit('kql', { table: table.toLowerCase(), rows: rows.length, q });
    return rows;
  }
  advisor() {
    const recs: { category: string; impact: string; text: string; res: string; fix: string }[] = [];
    for (const r of this.res) {
      if (r.type === 'vm' && r.props.power === 'running' && (r.props.cpu ?? 10) < 15) recs.push({ category: 'Cost', impact: 'High', text: `Right-size or shut down underutilised virtual machine '${r.name}' (average CPU ${r.props.cpu ?? 8}%).`, res: r.name, fix: `az vm deallocate -g ${r.rg} -n ${r.name}` });
      if (r.type === 'vm' && r.props.power === 'stopped') recs.push({ category: 'Cost', impact: 'Medium', text: `'${r.name}' is stopped but still allocated, so you are paying for compute. Deallocate it.`, res: r.name, fix: `az vm deallocate -g ${r.rg} -n ${r.name}` });
      if (r.type === 'vm' && !r.props.zone) recs.push({ category: 'Reliability', impact: 'Medium', text: `Use availability zones for '${r.name}' to protect against datacenter failures.`, res: r.name, fix: 'Redeploy across zones (--zone 1/2/3) behind a load balancer.' });
      if (r.type === 'storage' && r.props.sku === 'Standard_LRS') recs.push({ category: 'Reliability', impact: 'Medium', text: `Storage account '${r.name}' uses LRS. Consider ZRS or GZRS for critical data.`, res: r.name, fix: `az storage account update -g ${r.rg} -n ${r.name} --sku Standard_ZRS` });
      if (r.type === 'nsg' && (r.props.inbound ?? []).some((p: string) => p === '22' || p === '3389')) recs.push({ category: 'Security', impact: 'High', text: `Management port open to the internet on '${r.name}'. Close it and use Azure Bastion or just-in-time access.`, res: r.name, fix: `az network nsg rule delete -g ${r.rg} --nsg-name ${r.name} -n default-allow-ssh` });
    }
    for (const g of this.rgs) if (g.tags.env?.toLowerCase().startsWith('prod') && !g.locks.length) recs.push({ category: 'Operational Excellence', impact: 'Medium', text: `Production resource group '${g.name}' has no delete lock.`, res: g.name, fix: `az lock create -n do-not-delete -t CanNotDelete -g ${g.name}` });
    if (!this.res.some((r) => r.type === 'alert') && this.res.some((r) => r.type === 'vm')) recs.push({ category: 'Operational Excellence', impact: 'Low', text: 'No metric alerts are configured for your virtual machines.', res: '–', fix: 'az monitor metrics alert create …' });
    return recs;
  }
  secureScore() {
    const checks = [
      { name: 'Close management ports on virtual machines', ok: !this.res.some((r) => r.type === 'nsg' && (r.props.inbound ?? []).some((p: string) => p === '22' || p === '3389')), weight: 30 },
      { name: 'Storage accounts should restrict public network access', ok: !this.res.some((r) => r.type === 'storage' && r.props.publicAccess !== 'Disabled'), weight: 20 },
      { name: 'Enable MFA with Conditional Access', ok: this.ca.some((c) => c.grant === 'mfa'), weight: 30 },
      { name: 'Protect production with resource locks', ok: !this.rgs.some((g) => g.tags.env?.toLowerCase().startsWith('prod') && !g.locks.length), weight: 10 },
      { name: 'Apply Azure Policy guardrails', ok: this.policies.length > 0, weight: 10 },
    ];
    const score = checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0);
    return { score, checks };
  }

  /* ================= budgets ================= */
  createBudget(name: string, amount: number, via: Via = 'cli') {
    if (!name) throw new SimError('--budget-name is required.');
    if (!Number.isFinite(amount) || amount <= 0) throw new SimError('--amount must be a positive number.');
    this.budgets = this.budgets.filter((b) => b.name !== name).concat({ name, amount, fired: [] });
    this.emit('budget.create', { name, amount, via });
    this.checkBudgets();
  }
  checkBudgets() {
    const monthly = this.totalHourly() * 730;
    for (const b of this.budgets) {
      for (const t of [50, 80, 100]) {
        if (monthly >= (b.amount * t) / 100 && !b.fired.includes(t)) {
          b.fired.push(t);
          this.notify(t >= 100 ? 'bad' : 'warn', `💰 Budget alert: ${b.name} at ${t}%`, `Forecast monthly cost $${monthly.toFixed(2)} has reached ${t}% of your $${b.amount} budget.`);
          this.emit('budget.alert', { name: b.name, threshold: t });
        }
      }
    }
  }

  /* ================= zone outage & service health ================= */
  zoneOutage(location: string, zone: string) {
    const loc = this.checkLocation(location);
    if (!['1', '2', '3'].includes(zone)) throw new SimError('--zone must be 1, 2 or 3.');
    this.outage = { location: loc, zone };
    for (const r of this.res) if (r.type === 'vm' && r.location === loc && r.props.zone === zone) r.props.zoneDown = true;
    this.notify('bad', `⚠️ Service Health: zone outage in ${REGIONS[loc]}`, `Availability zone ${zone} in ${REGIONS[loc]} is experiencing a power failure. Zonal resources in zone ${zone} are unavailable; zone-redundant services continue in the other zones.`);
    this.emit('zone.outage', { location: loc, zone });
  }
  recover() {
    if (!this.outage) throw new SimError('There is no outage to recover from.');
    for (const r of this.res) delete r.props.zoneDown;
    this.notify('ok', '✅ Service Health: resolved', `Zone ${this.outage.zone} in ${REGIONS[this.outage.location]} has recovered.`);
    this.outage = null;
    this.emit('zone.recover', {});
  }
  serviceHealth() {
    const regions = [...new Set(this.res.map((r) => r.location).filter((l) => REGIONS[l]))];
    const items: { type: string; title: string; region: string; status: string }[] = [];
    if (this.outage) items.push({ type: 'Service issue', title: `Power failure in availability zone ${this.outage.zone}: Virtual Machines`, region: REGIONS[this.outage.location], status: 'Active' });
    for (const r of regions.slice(0, 2)) items.push({ type: 'Planned maintenance', title: 'Host OS updates for Virtual Machines (rebootless where possible)', region: REGIONS[r], status: 'Scheduled' });
    if (regions.length) items.push({ type: 'Health advisory', title: 'Retirement notice: upgrade to TLS 1.2 or later for Storage', region: 'Global', status: 'Action recommended' });
    return items;
  }
  vmStatus(r: Res) {
    if (r.props.zoneDown) return 'Unavailable (zone outage)';
    return `VM ${r.props.power}`;
  }

  /* ================= migrate & data box ================= */
  discover() { this.migrate.discovered = true; this.emit('migrate.discover', {}); }
  assess() {
    if (!this.migrate.discovered) throw new SimError('Discover servers first.');
    this.migrate.assessed = true;
    this.emit('migrate.assess', {});
  }
  migrateServer(name: string, rg: string) {
    if (!this.migrate.assessed) throw new SimError('Run an assessment first so Azure Migrate can recommend sizes.');
    const s = ONPREM_SERVERS.find((x) => x.name === name);
    if (!s) throw new SimError('Unknown server.');
    if (this.migrate.migrated.includes(name)) throw new SimError(`${name} has already been migrated.`);
    this.createVm({ rg, name, image: /win/i.test(s.os) ? 'Win2022Datacenter' : 'Ubuntu2204', size: s.size, ports: 'none' }, 'portal');
    this.migrate.migrated.push(name);
    this.emit('migrate.server', { name, rg });
  }
  orderDataBox(name: string, tb: number) {
    if (!name) throw new SimError('Give the order a name.');
    if (!Number.isFinite(tb) || tb <= 0) throw new SimError('Enter how many terabytes you need to move.');
    this.databox.push({ name, tb, step: 0 });
    this.emit('databox.order', { name, tb });
  }
  advanceDataBox(name: string) {
    const o = this.databox.find((d) => d.name === name);
    if (!o) throw new SimError('Order not found.');
    if (o.step < 5) o.step++;
    this.emit('databox.step', { name, step: o.step });
    if (o.step === 5) this.emit('databox.complete', { name });
  }

  subInfo() {
    return { id: SUB_ID, name: SUB_NAME, parent: this.subParent };
  }
}

export const DATABOX_STEPS = ['Ordered', 'Device delivered to you', 'You copied the data and shipped it back', 'Received at the Azure datacenter', 'Data uploaded to your storage account', 'Device securely erased (NIST 800-88)'];
export { VM_SIZES };
