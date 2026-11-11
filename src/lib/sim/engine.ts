/**
 * A tiny, in-browser simulation of Azure Resource Manager.
 * Nothing here talks to real Azure. The portal and the Cloud Shell both call
 * these operations, so they always show the same world, as in real Azure.
 * Rules (name formats, locks, required resources) mirror real Azure closely
 * enough to teach AZ-900 concepts. Prices are ILLUSTRATIVE only.
 */

export const SUB_ID = '00000000-0000-0000-0000-00000000a900';
export const SUB_NAME = 'Learning subscription (simulated)';

export const REGIONS: Record<string, string> = {
  eastus: 'East US',
  westus2: 'West US 2',
  brazilsouth: 'Brazil South',
  uksouth: 'UK South',
  northeurope: 'North Europe',
  westeurope: 'West Europe',
  centralindia: 'Central India',
  southeastasia: 'Southeast Asia',
  japaneast: 'Japan East',
  australiaeast: 'Australia East',
};

export const VM_SIZES: Record<string, { cpu: number; ram: number; hr: number }> = {
  Standard_B1s: { cpu: 1, ram: 1, hr: 0.012 },
  Standard_B2s: { cpu: 2, ram: 4, hr: 0.05 },
  Standard_D2s_v5: { cpu: 2, ram: 8, hr: 0.1 },
  Standard_D4s_v5: { cpu: 4, ram: 16, hr: 0.2 },
};
export const IMAGES: Record<string, { label: string; os: 'Linux' | 'Windows' }> = {
  Ubuntu2204: { label: 'Ubuntu Server 22.04 LTS', os: 'Linux' },
  Win2022Datacenter: { label: 'Windows Server 2022 Datacenter', os: 'Windows' },
};
export const STORAGE_SKUS: Record<string, { label: string; mult: number }> = {
  Standard_LRS: { label: 'Locally-redundant storage (LRS)', mult: 1 },
  Standard_ZRS: { label: 'Zone-redundant storage (ZRS)', mult: 1.25 },
  Standard_GRS: { label: 'Geo-redundant storage (GRS)', mult: 2 },
  Standard_RAGRS: { label: 'Read-access geo-redundant storage (RA-GRS)', mult: 2.5 },
  Standard_GZRS: { label: 'Geo-zone-redundant storage (GZRS)', mult: 2.3 },
  Premium_LRS: { label: 'Premium, locally-redundant (LRS)', mult: 3 },
};
export const PLAN_SKUS: Record<string, { label: string; hr: number }> = {
  F1: { label: 'Free (F1)', hr: 0 },
  B1: { label: 'Basic (B1)', hr: 0.018 },
  S1: { label: 'Standard (S1)', hr: 0.1 },
  P1v3: { label: 'Premium v3 (P1v3)', hr: 0.17 },
};
export const RUNTIMES = ['DOTNETCORE:8.0', 'NODE:20-lts', 'PYTHON:3.12', 'JAVA:21-java21'];

/** Pretend these storage/web app names are already taken by other customers worldwide. */
const TAKEN = new Set(['storage', 'mystorage', 'test', 'teststorage', 'azure', 'myapp', 'webapp', 'hello', 'demo', 'contoso']);

export type ResType = 'vm' | 'disk' | 'nic' | 'pip' | 'vnet' | 'nsg' | 'storage' | 'plan' | 'webapp' | 'vmss'
  | 'dnszone' | 'pe' | 'vpngw' | 'functionapp' | 'aci' | 'aks' | 'arc' | 'alert' | 'law';
export const TYPE_INFO: Record<ResType, { label: string; arm: string; icon: string }> = {
  vm: { label: 'Virtual machine', arm: 'Microsoft.Compute/virtualMachines', icon: '🖥️' },
  disk: { label: 'Disk', arm: 'Microsoft.Compute/disks', icon: '💽' },
  nic: { label: 'Network interface', arm: 'Microsoft.Network/networkInterfaces', icon: '🔌' },
  pip: { label: 'Public IP address', arm: 'Microsoft.Network/publicIPAddresses', icon: '🌐' },
  vnet: { label: 'Virtual network', arm: 'Microsoft.Network/virtualNetworks', icon: '🕸️' },
  nsg: { label: 'Network security group', arm: 'Microsoft.Network/networkSecurityGroups', icon: '🛡️' },
  storage: { label: 'Storage account', arm: 'Microsoft.Storage/storageAccounts', icon: '🗄️' },
  plan: { label: 'App Service plan', arm: 'Microsoft.Web/serverFarms', icon: '📋' },
  webapp: { label: 'App Service (web app)', arm: 'Microsoft.Web/sites', icon: '🌍' },
  vmss: { label: 'Virtual machine scale set', arm: 'Microsoft.Compute/virtualMachineScaleSets', icon: '🧮' },
  dnszone: { label: 'DNS zone', arm: 'Microsoft.Network/dnsZones', icon: '📒' },
  pe: { label: 'Private endpoint', arm: 'Microsoft.Network/privateEndpoints', icon: '🔒' },
  vpngw: { label: 'Virtual network gateway', arm: 'Microsoft.Network/virtualNetworkGateways', icon: '🚇' },
  functionapp: { label: 'Function App', arm: 'Microsoft.Web/sites (functionapp)', icon: '⚡' },
  aci: { label: 'Container instance', arm: 'Microsoft.ContainerInstance/containerGroups', icon: '📦' },
  aks: { label: 'Kubernetes service', arm: 'Microsoft.ContainerService/managedClusters', icon: '☸️' },
  arc: { label: 'Machine - Azure Arc', arm: 'Microsoft.HybridCompute/machines', icon: '🛰️' },
  alert: { label: 'Alert rule', arm: 'Microsoft.Insights/metricAlerts', icon: '🔔' },
  law: { label: 'Log Analytics workspace', arm: 'Microsoft.OperationalInsights/workspaces', icon: '📈' },
};

export interface Lock { name: string; level: 'CanNotDelete' | 'ReadOnly' }
export interface RG { name: string; location: string; tags: Record<string, string>; locks: Lock[]; created: number }
export interface Res {
  id: string;
  name: string;
  type: ResType;
  rg: string;
  location: string;
  tags: Record<string, string>;
  props: Record<string, any>;
  created: number;
}
export interface SimEvent { type: string; data: Record<string, any>; at: number }
export type Via = 'portal' | 'cli';

export class SimError extends Error {
  constructor(message: string, public code = 'BadRequest') {
    super(message);
  }
}

const rnd = (n: number) => Math.floor(Math.random() * n);
const ip = () => `20.${50 + rnd(150)}.${rnd(255)}.${1 + rnd(250)}`;

export class Sim {
  rgs: RG[] = [];
  res: Res[] = [];
  events: SimEvent[] = [];
  private listeners: (() => void)[] = [];

  onChange(fn: () => void) {
    this.listeners.push(fn);
  }
  emit(type: string, data: Record<string, any> = {}) {
    this.events.push({ type, data, at: Date.now() });
    this.listeners.forEach((l) => l());
  }

  /* ---------- lookup helpers ---------- */
  rg(name: string) {
    return this.rgs.find((g) => g.name.toLowerCase() === name.toLowerCase());
  }
  needRg(name: string) {
    const g = this.rg(name ?? '');
    if (!g) throw new SimError(`Resource group '${name}' could not be found.`, 'ResourceGroupNotFound');
    return g;
  }
  find(type: ResType, rg: string, name: string) {
    return this.res.find((r) => r.type === type && r.rg.toLowerCase() === rg.toLowerCase() && r.name.toLowerCase() === name.toLowerCase());
  }
  need(type: ResType, rg: string, name: string) {
    this.needRg(rg);
    const r = this.find(type, rg, name);
    if (!r) throw new SimError(`The Resource '${TYPE_INFO[type].arm}/${name}' under resource group '${rg}' was not found.`, 'ResourceNotFound');
    return r;
  }
  inRg(rg: string) {
    return this.res.filter((r) => r.rg.toLowerCase() === rg.toLowerCase());
  }
  idFor(type: ResType, rg: string, name: string) {
    return `/subscriptions/${SUB_ID}/resourceGroups/${rg}/providers/${TYPE_INFO[type].arm}/${name}`;
  }
  checkLocation(loc: string) {
    const l = (loc ?? '').toLowerCase().replace(/\s+/g, '');
    if (!REGIONS[l]) throw new SimError(`The provided location '${loc}' is not available. Try one of: ${Object.keys(REGIONS).join(', ')}.`, 'LocationNotAvailable');
    return l;
  }
  protected writable(rg: RG, action: string) {
    const ro = rg.locks.find((l) => l.level === 'ReadOnly');
    if (ro) {
      this.emit('blocked', { rg: rg.name, action, lock: ro.name });
      throw new SimError(`The scope '${rg.name}' cannot perform write operation because the following scope(s) are locked: '${rg.name}'. Please remove the lock '${ro.name}' and try again.`, 'ScopeLocked');
    }
  }
  protected deletable(rg: RG, what: string) {
    const lock = rg.locks[0];
    if (lock) {
      this.emit('delete.blocked', { rg: rg.name, what, lock: lock.name });
      throw new SimError(`The scope '${what}' cannot perform delete operation because the following scope(s) are locked: '${rg.name}'. Please remove the lock '${lock.name}' and try again.`, 'ScopeLocked');
    }
  }
  protected add(type: ResType, rg: RG, name: string, location: string, props: Record<string, any>, tags: Record<string, string> = {}) {
    const r: Res = { id: this.idFor(type, rg.name, name), name, type, rg: rg.name, location, tags, props, created: Date.now() };
    this.res.push(r);
    return r;
  }

  /* ---------- resource groups ---------- */
  createRg(name: string, location: string, tags: Record<string, string> = {}, via: Via = 'portal') {
    if (!name) throw new SimError('A resource group name is required.');
    if (!/^[-\w.()]{1,90}$/.test(name) || name.endsWith('.')) throw new SimError(`Resource group name '${name}' is invalid. Use up to 90 letters, numbers, underscores, hyphens, periods and parentheses, and do not end with a period.`, 'InvalidResourceGroupName');
    const loc = this.checkLocation(location);
    const existing = this.rg(name);
    if (existing) {
      // Like the real CLI, creating an existing group just updates tags.
      Object.assign(existing.tags, tags);
      this.emit('rg.update', { name: existing.name, via });
      return existing;
    }
    const g: RG = { name, location: loc, tags, locks: [], created: Date.now() };
    this.rgs.push(g);
    this.emit('rg.create', { name, location: loc, via });
    return g;
  }
  tagRg(name: string, tags: Record<string, string>, via: Via = 'portal', replace = false) {
    const g = this.needRg(name);
    this.writable(g, 'tag');
    g.tags = replace ? { ...tags } : { ...g.tags, ...tags };
    this.emit('rg.tag', { name: g.name, tags: g.tags, via });
    return g;
  }
  deleteRg(name: string, via: Via = 'portal') {
    const g = this.needRg(name);
    this.deletable(g, g.name);
    this.res = this.res.filter((r) => r.rg !== g.name);
    this.rgs = this.rgs.filter((x) => x !== g);
    this.emit('rg.delete', { name: g.name, via });
  }

  /* ---------- locks ---------- */
  addLock(rgName: string, name: string, level: string, via: Via = 'portal') {
    const g = this.needRg(rgName);
    if (!name) throw new SimError('A lock name is required.');
    const lv = level.toLowerCase() === 'readonly' ? 'ReadOnly' : level.toLowerCase() === 'cannotdelete' || level.toLowerCase() === 'delete' ? 'CanNotDelete' : null;
    if (!lv) throw new SimError(`Lock type '${level}' is invalid. Use CanNotDelete or ReadOnly.`);
    g.locks = g.locks.filter((l) => l.name !== name).concat({ name, level: lv });
    this.emit('lock.create', { rg: g.name, name, level: lv, via });
    return { name, level: lv };
  }
  removeLock(rgName: string, name: string, via: Via = 'portal') {
    const g = this.needRg(rgName);
    if (!g.locks.some((l) => l.name === name)) throw new SimError(`Lock '${name}' was not found on resource group '${g.name}'.`, 'LockNotFound');
    g.locks = g.locks.filter((l) => l.name !== name);
    this.emit('lock.delete', { rg: g.name, name, via });
  }

  /* ---------- virtual machines ---------- */
  createVm(o: { rg: string; name: string; image: string; size?: string; location?: string; zone?: string; admin?: string; ports?: string }, via: Via = 'portal') {
    const g = this.needRg(o.rg);
    this.writable(g, 'create');
    const image = Object.keys(IMAGES).find((k) => k.toLowerCase() === (o.image ?? '').toLowerCase().replace(/[^a-z0-9]/gi, '')) ??
      (/(ubuntu|linux)/i.test(o.image ?? '') ? 'Ubuntu2204' : /win/i.test(o.image ?? '') ? 'Win2022Datacenter' : null);
    if (!image) throw new SimError(`Image '${o.image}' was not found. Try Ubuntu2204 or Win2022Datacenter.`, 'InvalidImage');
    const os = IMAGES[image].os;
    const max = os === 'Windows' ? 15 : 64;
    if (!o.name || !new RegExp(`^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,${max - 2}}[a-zA-Z0-9])?$`).test(o.name))
      throw new SimError(`Virtual machine name '${o.name ?? ''}' is invalid. Use 1-${max} letters, numbers and hyphens${os === 'Windows' ? ' (Windows names are limited to 15 characters)' : ''}, not starting or ending with a hyphen.`, 'InvalidParameter');
    if (this.find('vm', g.name, o.name)) throw new SimError(`A virtual machine named '${o.name}' already exists in '${g.name}'.`, 'Conflict');
    const size = Object.keys(VM_SIZES).find((s) => s.toLowerCase() === (o.size ?? 'Standard_B1s').toLowerCase());
    if (!size) throw new SimError(`Size '${o.size}' is not available. Try: ${Object.keys(VM_SIZES).join(', ')}.`, 'SkuNotAvailable');
    const location = o.location ? this.checkLocation(o.location) : g.location;
    const zone = o.zone && ['1', '2', '3'].includes(o.zone) ? o.zone : '';
    const ports = o.ports ?? (os === 'Linux' ? '22' : '3389');
    // A VM needs supporting resources: a disk, a NIC, a virtual network and (optionally) a public IP + NSG.
    let vnet = this.inRg(g.name).find((r) => r.type === 'vnet' && r.location === location);
    if (!vnet) vnet = this.add('vnet', g, `${o.name}VNET`, location, { addressSpace: '10.0.0.0/16', subnets: ['default (10.0.0.0/24)'] });
    const n = this.inRg(g.name).filter((r) => r.type === 'nic').length;
    const nsg = this.add('nsg', g, `${o.name}NSG`, location, { inbound: ports === 'none' ? [] : [ports] });
    const pip = this.add('pip', g, `${o.name}PublicIP`, location, { address: ip(), sku: 'Standard' });
    const nic = this.add('nic', g, `${o.name}VMNic`, location, { privateIp: `10.0.0.${4 + n}`, vnet: vnet.name });
    const disk = this.add('disk', g, `${o.name}_OsDisk_1`, location, { sizeGb: os === 'Windows' ? 127 : 30, sku: 'Premium_LRS', attachedTo: o.name });
    const vm = this.add('vm', g, o.name, location, {
      image, os, size, zone, admin: o.admin || 'azureuser', power: 'running',
      nic: nic.name, disk: disk.name, pip: pip.name, nsg: nsg.name, publicIp: pip.props.address, privateIp: nic.props.privateIp, ports,
    });
    this.emit('vm.create', { rg: g.name, name: vm.name, size, image, ports, zone, via });
    return vm;
  }
  powerVm(rg: string, name: string, action: 'start' | 'stop' | 'deallocate' | 'restart', via: Via = 'portal') {
    const vm = this.need('vm', rg, name);
    this.writable(this.needRg(rg), action);
    vm.props.power = action === 'start' || action === 'restart' ? 'running' : action === 'stop' ? 'stopped' : 'deallocated';
    this.emit(`vm.${action}`, { rg: vm.rg, name: vm.name, via });
    return vm;
  }
  deleteVm(rg: string, name: string, via: Via = 'portal') {
    const vm = this.need('vm', rg, name);
    this.deletable(this.needRg(rg), vm.name);
    this.res = this.res.filter((r) => r !== vm);
    this.emit('vm.delete', { rg: vm.rg, name: vm.name, via });
  }

  /* ---------- storage ---------- */
  storageNameProblem(name: string): string | null {
    if (!name) return 'A storage account name is required.';
    if (name.length < 3 || name.length > 24) return `'${name}' must be between 3 and 24 characters long.`;
    if (!/^[a-z0-9]+$/.test(name)) return `'${name}' can contain only lowercase letters and numbers (no capitals, spaces, hyphens or symbols).`;
    if (TAKEN.has(name) || this.res.some((r) => r.type === 'storage' && r.name === name)) return `The storage account name '${name}' is already taken. Names must be globally unique across all of Azure.`;
    return null;
  }
  createStorage(o: { rg: string; name: string; location?: string; sku?: string; kind?: string }, via: Via = 'portal') {
    const g = this.needRg(o.rg);
    this.writable(g, 'create');
    const problem = this.storageNameProblem(o.name);
    if (problem) {
      this.emit('storage.invalid', { name: o.name, problem, via });
      throw new SimError(problem, problem.includes('taken') ? 'StorageAccountAlreadyTaken' : 'AccountNameInvalid');
    }
    const sku = Object.keys(STORAGE_SKUS).find((s) => s.toLowerCase() === (o.sku ?? 'Standard_RAGRS').toLowerCase());
    if (!sku) throw new SimError(`SKU '${o.sku}' is invalid. Try: ${Object.keys(STORAGE_SKUS).join(', ')}.`);
    const location = o.location ? this.checkLocation(o.location) : g.location;
    const st = this.add('storage', g, o.name, location, {
      sku, kind: o.kind || 'StorageV2', accessTier: 'Hot',
      endpoint: `https://${o.name}.blob.core.windows.net/`,
    });
    this.emit('storage.create', { rg: g.name, name: st.name, sku, via });
    return st;
  }
  updateStorageSku(rg: string, name: string, sku: string, via: Via = 'portal') {
    const st = this.need('storage', rg, name);
    this.writable(this.needRg(rg), 'update');
    const s = Object.keys(STORAGE_SKUS).find((k) => k.toLowerCase() === sku.toLowerCase());
    if (!s) throw new SimError(`SKU '${sku}' is invalid. Try: ${Object.keys(STORAGE_SKUS).join(', ')}.`);
    if (s.startsWith('Premium') !== st.props.sku.startsWith('Premium')) throw new SimError('You cannot switch between Standard and Premium performance on an existing account.');
    st.props.sku = s;
    this.emit('storage.sku', { rg: st.rg, name: st.name, sku: s, via });
    return st;
  }
  deleteStorage(rg: string, name: string, via: Via = 'portal') {
    const st = this.need('storage', rg, name);
    this.deletable(this.needRg(rg), st.name);
    this.res = this.res.filter((r) => r !== st);
    this.emit('storage.delete', { rg: st.rg, name: st.name, via });
  }

  /* ---------- App Service ---------- */
  createPlan(o: { rg: string; name: string; sku?: string; location?: string }, via: Via = 'portal') {
    const g = this.needRg(o.rg);
    this.writable(g, 'create');
    if (!o.name || !/^[\w-]{1,60}$/.test(o.name)) throw new SimError(`App Service plan name '${o.name ?? ''}' is invalid.`);
    const sku = Object.keys(PLAN_SKUS).find((s) => s.toLowerCase() === (o.sku ?? 'B1').toLowerCase());
    if (!sku) throw new SimError(`SKU '${o.sku}' is invalid. Try: ${Object.keys(PLAN_SKUS).join(', ')}.`);
    const existing = this.find('plan', g.name, o.name);
    if (existing) return existing;
    const p = this.add('plan', g, o.name, o.location ? this.checkLocation(o.location) : g.location, { sku, os: 'Linux' });
    this.emit('plan.create', { rg: g.name, name: p.name, sku, via });
    return p;
  }
  webappNameProblem(name: string): string | null {
    if (!name || !/^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/i.test(name)) return `Web app name '${name ?? ''}' is invalid. Use 2-60 letters, numbers and hyphens.`;
    if (TAKEN.has(name.toLowerCase()) || this.res.some((r) => r.type === 'webapp' && r.name.toLowerCase() === name.toLowerCase()))
      return `Website with given name '${name}' already exists. Web app names are global because they become ${name}.azurewebsites.net.`;
    return null;
  }
  createWebapp(o: { rg: string; plan: string; name: string; runtime?: string }, via: Via = 'portal') {
    const g = this.needRg(o.rg);
    this.writable(g, 'create');
    const plan = this.find('plan', g.name, o.plan ?? '');
    if (!plan) throw new SimError(`The plan '${o.plan}' doesn't exist in the resource group '${g.name}'. Create it first with 'az appservice plan create'.`, 'NotFound');
    const problem = this.webappNameProblem(o.name);
    if (problem) throw new SimError(problem, 'Conflict');
    const rt = RUNTIMES.find((r) => r.toLowerCase() === (o.runtime ?? 'NODE:20-lts').toLowerCase().replace('|', ':')) ?? 'NODE:20-lts';
    const w = this.add('webapp', g, o.name, plan.location, { plan: plan.name, runtime: rt, host: `${o.name.toLowerCase()}.azurewebsites.net`, state: 'Running' });
    this.emit('webapp.create', { rg: g.name, name: w.name, via });
    return w;
  }

  /* ---------- VM scale sets ---------- */
  createVmss(o: { rg: string; name: string; image?: string; count?: number; size?: string }, via: Via = 'cli') {
    const g = this.needRg(o.rg);
    this.writable(g, 'create');
    if (!o.name || !/^[a-zA-Z0-9][-a-zA-Z0-9]{0,62}$/.test(o.name)) throw new SimError(`Scale set name '${o.name ?? ''}' is invalid.`);
    if (this.find('vmss', g.name, o.name)) throw new SimError(`A scale set named '${o.name}' already exists.`, 'Conflict');
    const count = Math.max(0, Math.min(100, Number(o.count ?? 2)));
    const size = Object.keys(VM_SIZES).find((s) => s.toLowerCase() === (o.size ?? 'Standard_B1s').toLowerCase()) ?? 'Standard_B1s';
    const s = this.add('vmss', g, o.name, g.location, { capacity: count, size, image: /win/i.test(o.image ?? '') ? 'Win2022Datacenter' : 'Ubuntu2204' });
    this.emit('vmss.create', { rg: g.name, name: s.name, capacity: count, via });
    return s;
  }
  scaleVmss(rg: string, name: string, capacity: number, via: Via = 'cli') {
    const s = this.need('vmss', rg, name);
    this.writable(this.needRg(rg), 'scale');
    if (!Number.isInteger(capacity) || capacity < 0 || capacity > 100) throw new SimError('--new-capacity must be a whole number between 0 and 100.');
    const from = s.props.capacity;
    s.props.capacity = capacity;
    this.emit('vmss.scale', { rg: s.rg, name: s.name, from, to: capacity, via });
    return s;
  }

  /* ---------- generic ---------- */
  deleteRes(r: Res, via: Via = 'portal') {
    this.deletable(this.needRg(r.rg), r.name);
    this.res = this.res.filter((x) => x !== r);
    this.emit(`${r.type}.delete`, { rg: r.rg, name: r.name, via });
  }

  /** Illustrative hourly cost of one resource (not real Azure prices). */
  hourly(r: Res): number {
    switch (r.type) {
      case 'vm': return r.props.power === 'running' || r.props.power === 'stopped' ? VM_SIZES[r.props.size].hr * (r.props.os === 'Windows' ? 1.4 : 1) : 0;
      case 'disk': return 0.006;
      case 'pip': return 0.005;
      case 'storage': return 0.003 * STORAGE_SKUS[r.props.sku].mult;
      case 'plan': return PLAN_SKUS[r.props.sku].hr;
      case 'vmss': return r.props.capacity * VM_SIZES[r.props.size].hr;
      case 'vpngw': return 0.19;
      case 'aci': return r.props.state === 'Running' ? 0.045 : 0;
      case 'aks': return r.props.nodes * VM_SIZES.Standard_B2s.hr;
      case 'functionapp': return (r.props.executions ?? 0) * 0.0000002 * 730 > 0 ? 0.0001 : 0;
      case 'law': return 0.004;
      case 'pe': return 0.01;
      default: return 0;
    }
  }
  totalHourly() {
    return this.res.reduce((s, r) => s + this.hourly(r), 0);
  }
}
