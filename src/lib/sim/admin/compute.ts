/**
 * AZ-104 "compute" Cloud Shell commands (EDUCATION ONLY): Bicep and ARM files
 * you can read, edit (sed), build, decompile, what-if and deploy in
 * Incremental or Complete mode; template export; VM resize rules; data disks
 * and disk SKU changes; encryption at host; region moves with Azure Resource
 * Mover (az resource move itself lives in identity.ts); availability sets,
 * zones, Flexible scale sets and autoscale rules.
 * Returns null for anything it doesn't handle so the base CLI keeps working.
 */
import { REGIONS, VM_SIZES } from '../engine';
import type { World } from '../world';
import { run, one, many, has, req, lc, json, out, need, adm, uuid, now, SimError, SUB_ID, TYPE_INFO, type Cmd, type Handler, type Parsed, type AdminOut, type Res } from './kit';

/* ------------------------------------------------------------------ files */
const STORAGE_BICEP = `// storage.bicep: one storage account for Contoso's app logs
@description('Globally unique name, 3-24 lowercase letters and numbers')
@minLength(3)
@maxLength(24)
param storageName string

@description('Region for the account. Defaults to the resource group region.')
param location string = resourceGroup().location

@allowed([
  'Standard_LRS'
  'Standard_ZRS'
  'Standard_GRS'
])
param skuName string = 'Standard_LRS'

var tags = {
  env: 'prod'
  owner: 'platform-team'
}

resource st 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageName
  location: location
  sku: {
    name: skuName
  }
  kind: 'StorageV2'
  tags: tags
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
  }
}

output blobEndpoint string = st.properties.primaryEndpoints.blob`;

const armOf = (sku: string) => json({
  $schema: 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#',
  contentVersion: '1.0.0.0',
  parameters: {
    storageName: { type: 'string', minLength: 3, maxLength: 24, metadata: { description: 'Globally unique name, 3-24 lowercase letters and numbers' } },
    location: { type: 'string', defaultValue: '[resourceGroup().location]' },
    skuName: { type: 'string', defaultValue: sku, allowedValues: ['Standard_LRS', 'Standard_ZRS', 'Standard_GRS'] },
  },
  variables: { tags: { env: 'prod', owner: 'platform-team' } },
  resources: [{
    type: 'Microsoft.Storage/storageAccounts', apiVersion: '2023-05-01', name: "[parameters('storageName')]", location: "[parameters('location')]",
    sku: { name: "[parameters('skuName')]" }, kind: 'StorageV2', tags: "[variables('tags')]",
    properties: { minimumTlsVersion: 'TLS1_2', allowBlobPublicAccess: false },
  }],
  outputs: { blobEndpoint: { type: 'string', value: "[reference(parameters('storageName')).primaryEndpoints.blob]" } },
});

interface Dep { name: string; rg: string; file: string; mode: string; state: string; at: string; template: string }
interface Mover { name: string; rg: string; source: string; target: string; items: { name: string; id: string; type: string; state: string }[] }
interface Scale { name: string; rg: string; target: string; min: number; max: number; count: number; rules: { dir: 'out' | 'in'; metric: string; op: string; threshold: number; by: number }[] }
interface State { files: Record<string, string>; features: Record<string, string>; deps: Dep[]; movers: Record<string, Mover>; autoscale: Record<string, Scale> }
const S = (w: World): State => (adm(w).compute ??= { files: { 'storage.bicep': STORAGE_BICEP, 'azuredeploy.json': armOf('Standard_LRS') }, features: {}, deps: [], movers: {}, autoscale: {} });
const fileOf = (w: World, f?: string) => {
  const name = (f ?? '').replace(/^\.\//, '');
  const t = S(w).files[name];
  if (t === undefined) throw new SimError(`Could not find file '${name}'. Files here: ${Object.keys(S(w).files).join(', ')}.`, 'FileNotFound');
  return { name, text: t };
};

/* ---------------------------------------------------- template helpers */
interface Tpl { storageParam: boolean; sku?: string; allowed: string[] }
function readTemplate(name: string, text: string): Tpl {
  if (name.endsWith('.bicep')) {
    const allowed = /@allowed\(\[([\s\S]*?)\]\)\s*param skuName/.exec(text)?.[1].match(/'([^']+)'/g)?.map((s) => s.slice(1, -1)) ?? [];
    return { storageParam: /param storageName string/.test(text), sku: /param skuName string\s*=\s*'([^']+)'/.exec(text)?.[1], allowed };
  }
  try {
    const j = JSON.parse(text);
    const p = j.parameters ?? {};
    return { storageParam: !!p.storageName, sku: p.skuName?.defaultValue, allowed: p.skuName?.allowedValues ?? [] };
  } catch {
    throw new SimError(`'${name}' is not valid JSON. Check the last edit you made.`, 'InvalidTemplate');
  }
}
const params = (p: Parsed) => Object.fromEntries(many(p, '--parameters').flatMap((x) => x.split(/\s+/)).filter((x) => x.includes('=')).map((x) => x.split('=', 2) as [string, string]));

function plan(w: World, p: Parsed) {
  req(p, [['--resource-group', '-g'], ['--template-file', '-f']]);
  const g = w.needRg(one(p, '--resource-group')!);
  const f = fileOf(w, one(p, '--template-file'));
  if (/^exported\./.test(f.name)) throw new SimError(`'${f.name}' is an exported template. Its names and values are hard-coded and some resources may be missing, so tidy it into parameters before you redeploy it. Deploy storage.bicep in this lab.`, 'InvalidTemplate');
  const t = readTemplate(f.name, f.text);
  const pv = params(p);
  const name = pv.storageName;
  if (t.storageParam && !name) throw new SimError(`Deployment template validation failed: 'The value for the template parameter 'storageName' is not provided. Please see https://aka.ms/arm-create-parameter-file for usage details.'`, 'InvalidTemplate');
  const sku = pv.skuName ?? t.sku ?? 'Standard_LRS';
  if (t.allowed.length && !t.allowed.includes(sku)) {
    w.emit('adm.deploy.invalid', { rg: g.name, param: 'skuName', value: sku });
    throw new SimError(`Deployment template validation failed: 'The provided value '${sku}' for the template parameter 'skuName' is not valid. The parameter value is not part of the allowed value(s): '${t.allowed.join(',')}'.'`, 'InvalidTemplate');
  }
  const mode = lc(one(p, '--mode')) === 'complete' ? 'Complete' : 'Incremental';
  const existing = w.find('storage', g.name, name);
  const lines: string[] = [];
  const stId = w.idFor('storage', g.name, name);
  if (!existing) lines.push(`  + ${stId} [2023-05-01]`, `      kind: "StorageV2"`, `      sku.name: "${sku}"`);
  else if (existing.props.sku !== sku) lines.push(`  ~ ${stId} [2023-05-01]`, `    ~ sku.name: "${existing.props.sku}" => "${sku}"`);
  else lines.push(`  = ${stId}`);
  const extra = mode === 'Complete' ? w.inRg(g.name).filter((r) => !(r.type === 'storage' && lc(r.name) === lc(name))) : [];
  extra.forEach((r) => lines.push(`  - ${r.id}`));
  return { g, f, name, sku, mode, existing, lines, extra, create: !existing ? 1 : 0, modify: existing && existing.props.sku !== sku ? 1 : 0 };
}

function genExport(w: World, rg: string) {
  const list = w.inRg(rg);
  const resources = list.map((r) => ({ type: TYPE_INFO[r.type].arm, apiVersion: '2024-03-01', name: r.name, location: r.location, ...(r.props.sku ? { sku: { name: r.props.sku } } : {}), ...(r.props.size ? { properties: { hardwareProfile: { vmSize: r.props.size } } } : {}) }));
  return { list, text: json({ $schema: 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#', contentVersion: '1.0.0.0', parameters: {}, variables: {}, resources }) };
}
function decompile(text: string) {
  const j = JSON.parse(text);
  const out: string[] = [];
  for (const [k, v] of Object.entries<any>(j.parameters ?? {})) out.push(`param ${k} ${v.type ?? 'string'}${v.defaultValue !== undefined ? ` = ${/^\[/.test(String(v.defaultValue)) ? String(v.defaultValue).slice(1, -1) : `'${v.defaultValue}'`}` : ''}`);
  if (Object.keys(j.variables ?? {}).length) out.push('', ...Object.keys(j.variables).map((k) => `var ${k} = { /* … */ }`));
  for (const r of j.resources ?? []) {
    const pn = /parameters\('(\w+)'\)/.exec(String(r.name))?.[1];
    const sym = pn ? `${pn}_resource` : String(r.name).replace(/[^A-Za-z0-9]/g, '_').replace(/^(\d)/, '_$1');
    out.push('', `resource ${sym} '${r.type}@${r.apiVersion}' = {`, `  name: ${/^\[/.test(r.name) ? String(r.name).slice(1, -1).replace(/parameters\('(\w+)'\)/, '$1') : `'${r.name}'`}`, `  location: ${/^\[/.test(r.location) ? 'location' : `'${r.location}'`}`, ...(r.sku ? [`  sku: {`, `    name: ${/^\[/.test(r.sku.name) ? 'skuName' : `'${r.sku.name}'`}`, `  }`] : []), '}');
  }
  for (const [k, v] of Object.entries<any>(j.outputs ?? {})) out.push('', `output ${k} ${v.type ?? 'string'} = ${String(v.value).replace(/^\[|\]$/g, '').replace(/parameters\('(\w+)'\)/g, '$1')}`);
  return out.join('\n').trim();
}

/* ------------------------------------------------------------ VM helpers */
const family = (size: string) => /^Standard_([A-Z]+)/.exec(size)?.[1] ?? '';
const MAX_DISKS: Record<string, number> = { Standard_B1s: 2, Standard_B2s: 4, Standard_D2s_v5: 4, Standard_D4s_v5: 8 };
const sizeName = (s?: string) => Object.keys(VM_SIZES).find((k) => lc(k) === lc(s));
const dataDisks = (w: World, vm: Res) => w.inRg(vm.rg).filter((r) => r.type === 'disk' && r.props.attachedTo === vm.name && r.props.role === 'data');
const vmById = (w: World, id: string) => w.res.find((r) => lc(r.id) === lc(id));
const sizesRows = (names: string[]) => names.map((n) => ({ Name: n, NumberOfCores: VM_SIZES[n].cpu, MemoryInMB: VM_SIZES[n].ram * 1024 }));

function vmCreate(p: Parsed, w: World): AdminOut {
  req(p, [['--resource-group', '-g'], ['--name', '-n'], ['--image', '']]);
  const rg = one(p, '--resource-group')!, name = one(p, '--name')!;
  const avName = one(p, '--availability-set');
  const zone = one(p, '--zone');
  const eah = has(p, '--encryption-at-host') && !/^(false|0)$/i.test(one(p, '--encryption-at-host') ?? 'true');
  let av: Res | undefined;
  if (avName) {
    if (zone) {
      w.emit('adm.vm.blocked', { rg, name, reason: 'avset+zone' });
      throw new SimError(`A virtual machine can't be placed in both an availability set and an availability zone. Choose --availability-set ${avName} or --zone ${zone}, not both.`, 'InvalidParameter');
    }
    av = need(w, 'avset', rg, avName.split('/').pop());
  }
  if (eah && S(w).features.EncryptionAtHost !== 'Registered') {
    w.emit('adm.vm.blocked', { rg, name, reason: 'eah-feature' });
    throw new SimError(`The property 'securityProfile.encryptionAtHost' is not valid because the 'Microsoft.Compute/EncryptionAtHost' feature is not enabled for this subscription. Run: az feature register --name EncryptionAtHost --namespace Microsoft.Compute`, 'InvalidParameter');
  }
  const vm = w.createVm({ rg, name, image: one(p, '--image')!, size: one(p, '--size'), location: one(p, '--location'), zone, admin: one(p, '--admin-username') }, 'cli');
  if (av) {
    const members = w.res.filter((r) => r.type === 'vm' && r.props.avset === av!.name && r.rg === av!.rg);
    const k = members.length;
    Object.assign(vm.props, { avset: av.name, fd: k % av.props.fd, ud: k % av.props.ud });
    w.emit('adm.vm.avset', { rg: vm.rg, name: vm.name, avset: av.name, fd: vm.props.fd, ud: vm.props.ud });
  }
  if (eah) { vm.props.eah = true; w.emit('adm.vm.eah', { rg: vm.rg, name: vm.name, enabled: true, at: 'create' }); }
  const sizes = many(p, '--data-disk-sizes-gb').flatMap((x) => x.split(/\s+/)).map(Number).filter((n) => n > 0);
  sizes.forEach((gb, lun) => { w.addRes('disk', vm.rg, `${vm.name}_DataDisk_${lun}`, { sizeGb: gb, sku: one(p, '--storage-sku') ?? 'Premium_LRS', attachedTo: vm.name, role: 'data', lun, caching: 'ReadOnly', auto: true }, { location: vm.location }); });
  if (sizes.length) w.emit('adm.disk.attach', { rg: vm.rg, vm: vm.name, count: sizes.length, at: 'create' });
  return out(p, { id: vm.id, location: vm.location, powerState: 'VM running', privateIpAddress: vm.props.privateIp, publicIpAddress: vm.props.publicIp, resourceGroup: vm.rg, zones: vm.props.zone || '', availabilitySet: av ? { name: av.name, faultDomain: vm.props.fd, updateDomain: vm.props.ud } : undefined, securityProfile: eah ? { encryptionAtHost: true } : undefined, dataDisks: sizes.length || undefined });
}

/* ---------------------------------------------------------- commands */
/** The world of the command being dispatched, so `when` can look at this area's state. */
let CUR: World | null = null;
const myFile = (p: Parsed) => !!CUR && S(CUR).files[(one(p, '--template-file') ?? '').replace(/^\.\//, '')] !== undefined;
const mineScale = (name?: string) => !!CUR && !!name && !!S(CUR).autoscale[lc(name)];

const T: Record<string, Cmd | Handler> = {
  /* ---- templates ---- */
  'deployment group what-if': { when: myFile, extra: { '-f': '--template-file' }, run: (p, w) => {
    const r = plan(w, p);
    w.emit('adm.deploy.whatif', { rg: r.g.name, file: r.f.name, mode: r.mode, creates: r.create, modifies: r.modify, deletes: r.extra.length });
    return { out: [
      'Note: The result may contain false positive predictions (noise).',
      'Resource and property changes are indicated with these symbols:',
      '  - Delete', '  + Create', '  ~ Modify', '  = Nochange', '',
      `The deployment will update the following scope:`, '', `Scope: /subscriptions/${SUB_ID}/resourceGroups/${r.g.name}`, '', ...r.lines, '',
      `Resource changes: ${[r.extra.length && `${r.extra.length} to delete`, r.create && '1 to create', r.modify && '1 to modify', !r.create && !r.modify && '1 no change'].filter(Boolean).join(', ')}.`,
      r.extra.length ? `\n⚠ Complete mode deletes every resource in ${r.g.name} that isn't in the template. Nothing was deployed: this was a preview.` : 'Nothing was deployed: this was a preview.',
    ].join('\n') };
  } },
  'deployment group create': { when: myFile, extra: { '-f': '--template-file' }, run: (p, w) => {
    const r = plan(w, p);
    w.assertWritable(r.g.name, 'deploy');
    for (const x of r.extra) w.deleteRes(x, 'cli');
    let st = r.existing;
    if (!st) st = w.createStorage({ rg: r.g.name, name: r.name, sku: r.sku, tags: { env: 'prod', owner: 'platform-team' } }, 'cli');
    else if (st.props.sku !== r.sku) st = w.updateStorageSku(r.g.name, r.name, r.sku, 'cli');
    const depName = one(p, '--name') ?? r.f.name.replace(/\.(bicep|json)$/, '');
    S(w).deps = S(w).deps.filter((d) => !(d.rg === r.g.name && d.name === depName)).concat({ name: depName, rg: r.g.name, file: r.f.name, mode: r.mode, state: 'Succeeded', at: now(), template: r.f.name.endsWith('.bicep') ? armOf(r.sku) : r.f.text });
    w.emit('adm.deploy.create', { rg: r.g.name, file: r.f.name, name: depName, mode: r.mode, sku: r.sku, storage: r.name, deleted: r.extra.map((x) => x.name) });
    return out(p, { id: `/subscriptions/${SUB_ID}/resourceGroups/${r.g.name}/providers/Microsoft.Resources/deployments/${depName}`, name: depName, properties: { mode: r.mode, provisioningState: 'Succeeded', timestamp: now(), outputs: { blobEndpoint: { type: 'String', value: `https://${r.name}.blob.core.windows.net/` } }, outputResources: [{ id: st.id }], parameters: { storageName: { value: r.name }, skuName: { value: r.sku } } }, resourceGroup: r.g.name, deleted: r.extra.length ? r.extra.map((x) => x.name) : undefined });
  } },
  'deployment group list': (p, w) => {
    req(p, [['--resource-group', '-g']]);
    const l = S(w).deps.filter((d) => lc(d.rg) === lc(one(p, '--resource-group')));
    return out(p, l.map((d) => ({ name: d.name, properties: { mode: d.mode, provisioningState: d.state, timestamp: d.at } })), l.map((d) => ({ Name: d.name, State: d.state, Timestamp: d.at, Mode: d.mode })), ['Name', 'State', 'Timestamp', 'Mode']);
  },
  'deployment group export': (p, w) => {
    req(p, [['--resource-group', '-g'], ['--name', '-n']]);
    const d = S(w).deps.find((x) => lc(x.rg) === lc(one(p, '--resource-group')) && lc(x.name) === lc(one(p, '--name')));
    if (!d) throw new SimError(`Deployment '${one(p, '--name')}' could not be found. List them with az deployment group list -g ${one(p, '--resource-group')} -o table.`, 'DeploymentNotFound');
    w.emit('adm.deploy.export', { rg: d.rg, name: d.name });
    return { out: d.template };
  },
  'group export': (p, w) => {
    req(p, [['--name', '-n']]);
    const g = w.needRg(one(p, '--name')!);
    const e = genExport(w, g.name);
    w.emit('adm.group.export', { rg: g.name, count: e.list.length });
    return { out: e.text };
  },
  'bicep decompile': { extra: { '-f': '--file' }, run: (p, w) => {
    req(p, [['--file', '-f']]);
    const f = fileOf(w, one(p, '--file'));
    if (!f.name.endsWith('.json')) throw new SimError('az bicep decompile converts an ARM template (.json) into Bicep. To go the other way use az bicep build.', 'InvalidArgument');
    const target = f.name.replace(/\.json$/, '.bicep');
    S(w).files[target] = decompile(f.text);
    w.emit('adm.bicep.decompile', { from: f.name, to: target });
    return { out: `WARNING: Decompilation is a best-effort process, as there is no guaranteed mapping from ARM JSON to Bicep.\nYou may need to fix warnings and errors in the generated bicep file(s), or decompilation may fail entirely if an accurate conversion is not possible.\nIf you would like to report any issues or inaccurate conversions, please see https://github.com/Azure/bicep/issues.\n\nCreated ${target}. Read it with: cat ${target}` };
  } },
  'bicep build': { extra: { '-f': '--file' }, run: (p, w) => {
    req(p, [['--file', '-f']]);
    const f = fileOf(w, one(p, '--file'));
    if (!f.name.endsWith('.bicep')) throw new SimError('az bicep build compiles a .bicep file into an ARM template (.json).', 'InvalidArgument');
    const t = readTemplate(f.name, f.text);
    const target = f.name.replace(/\.bicep$/, '.json');
    S(w).files[target] = armOf(t.sku ?? 'Standard_LRS');
    w.emit('adm.bicep.build', { from: f.name, to: target });
    return { out: `Compiled ${f.name} into ${target} (ARM JSON). Resource Manager only ever deploys JSON: the CLI does this step for you whenever you deploy a .bicep file.` };
  } },

  /* ---- VM sizes ---- */
  'vm list-vm-resize-options': (p, w) => {
    req(p, [['--resource-group', '-g'], ['--name', '-n']]);
    const vm = need(w, 'vm', one(p, '--resource-group'), one(p, '--name'));
    const running = vm.props.power !== 'deallocated';
    const names = Object.keys(VM_SIZES).filter((n) => n !== vm.props.size && (!running || family(n) === family(vm.props.size)));
    w.emit('adm.vm.resizeoptions', { rg: vm.rg, name: vm.name, running });
    const note = running ? `\n(${vm.name} is running, so you only see sizes available on its current hardware cluster. Deallocate it to see every size in ${REGIONS[vm.location] ?? vm.location}.)` : '';
    const r = out(p, sizesRows(names), sizesRows(names), ['Name', 'NumberOfCores', 'MemoryInMB']);
    return { out: (r.out ?? '') + note };
  },
  'vm resize': (p, w) => {
    req(p, [['--resource-group', '-g'], ['--name', '-n'], ['--size', '']]);
    const vm = need(w, 'vm', one(p, '--resource-group'), one(p, '--name'));
    const to = sizeName(one(p, '--size'));
    if (!to) throw new SimError(`The requested size '${one(p, '--size')}' is not available in this simulator. Try: ${Object.keys(VM_SIZES).join(', ')}.`, 'SkuNotAvailable');
    w.assertWritable(vm.rg, 'resize');
    w.guard('vm', vm.rg, vm.location, vm.tags, to);
    const from = vm.props.size as string;
    const running = vm.props.power !== 'deallocated';
    if (running && family(to) !== family(from)) {
      w.emit('adm.vm.resize.blocked', { rg: vm.rg, name: vm.name, from, to });
      throw new SimError(`Unable to resize the VM '${vm.name}' because the requested size ${to} is not available in the current hardware cluster. Deallocate the VM first (az vm deallocate -g ${vm.rg} -n ${vm.name}), then resize: every size in the region becomes available.`, 'OperationNotAllowed');
    }
    const n = dataDisks(w, vm).length;
    if (n > (MAX_DISKS[to] ?? 4)) throw new SimError(`${to} supports up to ${MAX_DISKS[to]} data disks and ${vm.name} has ${n}. Detach some disks first.`, 'OperationNotAllowed');
    vm.props.size = to;
    w.emit('adm.vm.resize', { rg: vm.rg, name: vm.name, from, to, restarted: running });
    return out(p, { name: vm.name, hardwareProfile: { vmSize: to }, powerState: running ? 'VM running' : 'VM deallocated', note: running ? `Resized from ${from}. The VM restarted to pick up the new size, so plan a short outage.` : `Resized from ${from} while deallocated. Start it with az vm start.` });
  },

  /* ---- disks ---- */
  'vm disk attach': (p, w) => {
    req(p, [['--resource-group', '-g'], ['--vm-name', ''], ['--name', '-n']]);
    const vm = need(w, 'vm', one(p, '--resource-group'), one(p, '--vm-name'));
    w.assertWritable(vm.rg, 'attach disk');
    const name = one(p, '--name')!;
    const used = dataDisks(w, vm);
    const max = MAX_DISKS[vm.props.size] ?? 4;
    if (used.length >= max) {
      w.emit('adm.disk.blocked', { rg: vm.rg, vm: vm.name, reason: 'max-disks' });
      throw new SimError(`The maximum number of data disks allowed to be attached to a VM of size ${vm.props.size} is ${max}. Resize the VM to a bigger size to attach more.`, 'OperationNotAllowed');
    }
    const lun = Number(one(p, '--lun') ?? used.length);
    const caching = one(p, '--caching') ?? 'ReadOnly';
    let d = w.find('disk', vm.rg, name);
    if (has(p, '--new')) {
      if (d) throw new SimError(`A disk named '${name}' already exists. Drop --new to attach it.`, 'Conflict');
      d = w.addRes('disk', vm.rg, name, { sizeGb: Number(one(p, '--size-gb') ?? 1023), sku: one(p, '--sku') ?? 'Premium_LRS', attachedTo: vm.name, role: 'data', lun, caching }, { location: vm.location });
    } else {
      if (!d) throw new SimError(`Disk '${name}' was not found in '${vm.rg}'. Add --new --size-gb 128 to create it.`, 'ResourceNotFound');
      if (d.props.attachedTo) throw new SimError(`Disk '${name}' is already attached to '${d.props.attachedTo}'. A managed disk (without shared disk enabled) attaches to one VM at a time.`, 'OperationNotAllowed');
      Object.assign(d.props, { attachedTo: vm.name, role: 'data', lun, caching });
    }
    w.emit('adm.disk.attach', { rg: vm.rg, vm: vm.name, disk: d.name, sku: d.props.sku, sizeGb: d.props.sizeGb, caching, lun, live: vm.props.power === 'running' });
    return out(p, { vm: vm.name, dataDisks: dataDisks(w, vm).map((x) => ({ lun: x.props.lun, name: x.name, caching: x.props.caching, diskSizeGb: x.props.sizeGb, managedDisk: { storageAccountType: x.props.sku } })) });
  },
  'vm disk detach': (p, w) => {
    req(p, [['--resource-group', '-g'], ['--vm-name', ''], ['--name', '-n']]);
    const vm = need(w, 'vm', one(p, '--resource-group'), one(p, '--vm-name'));
    const d = need(w, 'disk', vm.rg, one(p, '--name'));
    if (d.props.attachedTo !== vm.name) throw new SimError(`Disk '${d.name}' isn't attached to '${vm.name}'.`, 'NotFound');
    if (d.props.role !== 'data') throw new SimError(`'${d.name}' is the OS disk. You can't detach the OS disk from a VM; swap it instead (az vm update --os-disk).`, 'OperationNotAllowed');
    w.assertWritable(vm.rg, 'detach disk');
    d.props.attachedTo = null;
    w.emit('adm.disk.detach', { rg: vm.rg, vm: vm.name, disk: d.name });
    return { out: `Detached ${d.name}. The managed disk still exists (and is still billed) until you delete it.` };
  },
  'disk create': (p, w) => {
    req(p, [['--resource-group', '-g'], ['--name', '-n']]);
    const d = w.addRes('disk', one(p, '--resource-group')!, one(p, '--name')!, { sizeGb: Number(one(p, '--size-gb') ?? 128), sku: one(p, '--sku') ?? 'Premium_LRS', attachedTo: null, role: 'data', zone: one(p, '--zone') ?? '' }, { location: one(p, '--location') });
    w.emit('adm.disk.create', { rg: d.rg, name: d.name, sku: d.props.sku, sizeGb: d.props.sizeGb });
    return out(p, { name: d.name, diskSizeGb: d.props.sizeGb, sku: { name: d.props.sku }, diskState: 'Unattached', location: d.location });
  },
  'disk update': (p, w) => {
    req(p, [['--resource-group', '-g'], ['--name', '-n']]);
    const d = need(w, 'disk', one(p, '--resource-group'), one(p, '--name'));
    w.assertWritable(d.rg, 'update disk');
    const vm = d.props.attachedTo ? w.find('vm', d.rg, d.props.attachedTo) : undefined;
    const live = vm && vm.props.power !== 'deallocated';
    const sku = one(p, '--sku'), gb = one(p, '--size-gb') ? Number(one(p, '--size-gb')) : undefined;
    if (!sku && gb === undefined) throw new SimError('Nothing to update. Try --sku StandardSSD_LRS or --size-gb 256.', 'MissingArgs');
    if (sku && sku !== d.props.sku && live) {
      w.emit('adm.disk.blocked', { rg: d.rg, disk: d.name, reason: 'sku-live' });
      throw new SimError(`Changing the disk type of '${d.name}' isn't allowed while '${vm!.name}' is running. Deallocate the VM (or detach the disk), change the SKU, then start the VM again.`, 'OperationNotAllowed');
    }
    if (gb !== undefined && gb < d.props.sizeGb) throw new SimError(`Disk size can only grow. '${d.name}' is ${d.props.sizeGb} GiB; shrinking a managed disk isn't supported.`, 'BadRequest');
    if (gb !== undefined && gb > d.props.sizeGb && live && d.props.role !== 'data') throw new SimError(`Expanding the OS disk needs the VM deallocated. Data disks can grow while the VM runs.`, 'OperationNotAllowed');
    const from = { sku: d.props.sku, sizeGb: d.props.sizeGb };
    if (sku) d.props.sku = sku;
    if (gb !== undefined) d.props.sizeGb = gb;
    w.emit('adm.disk.update', { rg: d.rg, name: d.name, from, sku: d.props.sku, sizeGb: d.props.sizeGb });
    return out(p, { name: d.name, diskSizeGb: d.props.sizeGb, sku: { name: d.props.sku }, diskState: d.props.attachedTo ? 'Attached' : 'Unattached', note: gb && gb > from.sizeGb ? 'Now extend the partition and file system inside the OS to use the new space.' : undefined });
  },
  'disk list': (p, w) => {
    const g = one(p, '--resource-group');
    const l = w.res.filter((r) => r.type === 'disk' && (!g || lc(r.rg) === lc(g)));
    return out(p, l.map((d) => ({ name: d.name, diskSizeGb: d.props.sizeGb, sku: { name: d.props.sku }, managedBy: d.props.attachedTo ?? null })), l.map((d) => ({ Name: d.name, ResourceGroup: d.rg, SizeGb: d.props.sizeGb, Sku: d.props.sku, State: d.props.attachedTo ? `Attached (${d.props.attachedTo})` : 'Unattached' })), ['Name', 'ResourceGroup', 'SizeGb', 'Sku', 'State']);
  },

  /* ---- encryption at host ---- */
  'feature register': { when: (p) => lc(one(p, '--namespace')) === 'microsoft.compute', run: (p, w) => {
    req(p, [['--name', '-n'], ['--namespace', '']]);
    const name = one(p, '--name')!;
    S(w).features[name] = 'Registered';
    w.emit('adm.feature.register', { namespace: 'Microsoft.Compute', name });
    return { out: `Once the feature '${name}' is registered, invoking 'az provider register -n Microsoft.Compute' is required to get the change propagated\n` + json({ id: `/subscriptions/${SUB_ID}/providers/Microsoft.Features/providers/Microsoft.Compute/features/${name}`, name: `Microsoft.Compute/${name}`, properties: { state: 'Registered' }, type: 'Microsoft.Features/providers/features' }) + '\n(Simulated: real registration can take a few minutes. Check with az feature show.)' };
  } },
  'feature show': { when: (p) => lc(one(p, '--namespace')) === 'microsoft.compute', run: (p, w) => {
    req(p, [['--name', '-n'], ['--namespace', '']]);
    const name = one(p, '--name')!;
    return out(p, { name: `Microsoft.Compute/${name}`, properties: { state: S(w).features[name] ?? 'NotRegistered' } });
  } },
  'vm update': { when: (p) => has(p, '--encryption-at-host') || many(p, '--set').some((x) => /encryptionathost|availabilityset/i.test(x)), run: (p, w) => {
    req(p, [['--resource-group', '-g'], ['--name', '-n']]);
    const vm = need(w, 'vm', one(p, '--resource-group'), one(p, '--name'));
    if (many(p, '--set').some((x) => /availabilityset/i.test(x))) {
      w.emit('adm.vm.blocked', { rg: vm.rg, name: vm.name, reason: 'avset-existing' });
      throw new SimError(`Changing property 'availabilitySet' is not allowed. A VM can only be added to an availability set when it is created: recreate it from its disks with --availability-set.`, 'PropertyChangeNotAllowed');
    }
    const want = has(p, '--encryption-at-host') ? !/^(false|0)$/i.test(one(p, '--encryption-at-host') ?? 'true') : many(p, '--set').some((x) => /encryptionathost\s*=\s*true/i.test(x));
    w.assertWritable(vm.rg, 'update');
    if (want && S(w).features.EncryptionAtHost !== 'Registered') {
      w.emit('adm.vm.eah.blocked', { rg: vm.rg, name: vm.name, reason: 'feature' });
      throw new SimError(`The property 'securityProfile.encryptionAtHost' is not valid because the 'Microsoft.Compute/EncryptionAtHost' feature is not enabled for this subscription. Run: az feature register --name EncryptionAtHost --namespace Microsoft.Compute`, 'InvalidParameter');
    }
    if (vm.props.power !== 'deallocated') {
      w.emit('adm.vm.eah.blocked', { rg: vm.rg, name: vm.name, reason: 'running' });
      throw new SimError(`Encryption at host can only be changed while the VM is deallocated. Run az vm deallocate -g ${vm.rg} -n ${vm.name} first.`, 'OperationNotAllowed');
    }
    vm.props.eah = want;
    w.emit('adm.vm.eah', { rg: vm.rg, name: vm.name, enabled: want, at: 'update' });
    return out(p, { name: vm.name, securityProfile: { encryptionAtHost: want }, powerState: 'VM deallocated', note: want ? 'Temp disk and OS/data disk caches are now encrypted on the host, and data flows encrypted to Storage. Start the VM with az vm start.' : 'Encryption at host turned off.' });
  } },

  /* ---- moves ---- */
  'resource-mover move-collection create': (p, w) => {
    req(p, [['--resource-group', '-g'], ['--name', '-n'], ['--source-region', ''], ['--target-region', '']]);
    const rg = w.needRg(one(p, '--resource-group')!).name;
    const source = w.checkLocation(one(p, '--source-region')!), target = w.checkLocation(one(p, '--target-region')!);
    if (source === target) throw new SimError('Source and target regions must be different.', 'BadRequest');
    const name = one(p, '--name')!;
    S(w).movers[lc(name)] = { name, rg, source, target, items: [] };
    w.emit('adm.mover.create', { name, rg, source, target });
    return out(p, { id: `/subscriptions/${SUB_ID}/resourceGroups/${rg}/providers/Microsoft.Migrate/moveCollections/${name}`, name, location: one(p, '--location') ?? 'eastus2', identity: { type: 'SystemAssigned', principalId: uuid() }, properties: { sourceRegion: source, targetRegion: target, provisioningState: 'Succeeded' } });
  },
  'resource-mover move-resource add': (p, w) => {
    req(p, [['--resource-group', '-g'], ['--move-collection-name', ''], ['--name', '-n'], ['--source-id', '']]);
    const m = mover(w, one(p, '--move-collection-name'));
    const r = vmById(w, one(p, '--source-id')!);
    if (!r) throw new SimError(`Source resource '${one(p, '--source-id')}' was not found.`, 'ResourceNotFound');
    if (r.location !== m.source) throw new SimError(`'${r.name}' is in ${r.location}, but this move collection moves from ${m.source}.`, 'BadRequest');
    m.items.push({ name: one(p, '--name')!, id: r.id, type: r.type, state: 'Prepare pending' });
    w.emit('adm.mover.add', { collection: m.name, resource: r.name, type: r.type });
    return out(p, { name: one(p, '--name'), properties: { sourceId: r.id, moveStatus: { moveState: 'PreparePending' } } });
  },
  'resource-mover move-collection resolve-dependency': (p, w) => {
    const m = mover(w, one(p, '--name', '--move-collection-name'));
    const added: string[] = [];
    for (const it of [...m.items]) {
      const r = vmById(w, it.id);
      if (r?.type !== 'vm') continue;
      const nic = w.find('nic', r.rg, r.props.nic);
      const deps = w.res.filter((x) => (x.rg === r.rg && ((x.type === 'disk' && x.props.attachedTo === r.name) || x === nic || (x.type === 'pip' && x.name === r.props.pip) || (x.type === 'nsg' && x.name === r.props.nsg))) || (x.type === 'vnet' && x.name === nic?.props.vnet && x.location === r.location));
      for (const d of deps) if (!m.items.some((i) => i.id === d.id)) { m.items.push({ name: d.name, id: d.id, type: d.type, state: 'Prepare pending' }); added.push(`${TYPE_INFO[d.type].label}: ${d.name}`); }
    }
    w.emit('adm.mover.deps', { collection: m.name, added: added.length });
    return { out: added.length ? `Validated dependencies and added ${added.length} required resource(s) to ${m.name}:\n  ${added.join('\n  ')}` : `All dependencies of ${m.name} are already in the collection.` };
  },
  'resource-mover move-collection prepare': (p, w) => step(p, w, 'Prepare pending', 'Initiate move pending', 'prepare'),
  'resource-mover move-collection initiate-move': (p, w) => step(p, w, 'Initiate move pending', 'Commit pending', 'initiate'),
  'resource-mover move-collection commit': (p, w) => step(p, w, 'Commit pending', 'Delete source pending', 'commit'),
  'resource-mover move-collection discard': (p, w) => step(p, w, 'Commit pending', 'Initiate move pending', 'discard'),
  'resource-mover move-resource list': (p, w) => {
    const m = mover(w, one(p, '--move-collection-name'));
    const rows = m.items.map((i) => ({ Name: i.name, Type: TYPE_INFO[i.type as keyof typeof TYPE_INFO]?.label ?? i.type, MoveState: i.state }));
    return out(p, rows, rows, ['Name', 'Type', 'MoveState']);
  },

  /* ---- availability ---- */
  'vm availability-set create': (p, w) => {
    req(p, [['--resource-group', '-g'], ['--name', '-n']]);
    const fd = Number(one(p, '--platform-fault-domain-count') ?? 2), ud = Number(one(p, '--platform-update-domain-count') ?? 5);
    if (!(fd >= 1 && fd <= 3)) throw new SimError('--platform-fault-domain-count must be 1, 2 or 3 (the maximum depends on the region).', 'InvalidParameter');
    if (!(ud >= 1 && ud <= 20)) throw new SimError('--platform-update-domain-count must be between 1 and 20.', 'InvalidParameter');
    const a = w.addRes('avset', one(p, '--resource-group')!, one(p, '--name')!, { fd, ud, sku: 'Aligned' }, { location: one(p, '--location') });
    w.emit('adm.avset.create', { rg: a.rg, name: a.name, fd, ud });
    return out(p, { id: a.id, name: a.name, location: a.location, platformFaultDomainCount: fd, platformUpdateDomainCount: ud, sku: { name: 'Aligned' }, virtualMachines: [] });
  },
  'vm availability-set show': (p, w) => {
    req(p, [['--resource-group', '-g'], ['--name', '-n']]);
    const a = need(w, 'avset', one(p, '--resource-group'), one(p, '--name'));
    const vms = w.res.filter((r) => r.type === 'vm' && r.rg === a.rg && r.props.avset === a.name);
    return out(p, { name: a.name, platformFaultDomainCount: a.props.fd, platformUpdateDomainCount: a.props.ud, virtualMachines: vms.map((v) => ({ name: v.name, faultDomain: v.props.fd, updateDomain: v.props.ud })) }, vms.map((v) => ({ VM: v.name, FaultDomain: v.props.fd, UpdateDomain: v.props.ud })), ['VM', 'FaultDomain', 'UpdateDomain']);
  },
  'vm create': { when: (p) => has(p, '--availability-set') || has(p, '--encryption-at-host') || has(p, '--data-disk-sizes-gb'), run: vmCreate },
  'vmss create': { when: (p) => has(p, '--zones') || has(p, '--orchestration-mode') || has(p, '--upgrade-policy-mode'), run: (p, w) => {
    req(p, [['--resource-group', '-g'], ['--name', '-n'], ['--image', '']]);
    const zones = many(p, '--zones').flatMap((z) => z.split(/[\s,]+/)).filter(Boolean);
    if (zones.some((z) => !['1', '2', '3'].includes(z))) throw new SimError('--zones takes zone numbers 1, 2 and/or 3.', 'InvalidParameter');
    const mode = lc(one(p, '--orchestration-mode')) === 'uniform' ? 'Uniform' : 'Flexible';
    const s = w.createVmss({ rg: one(p, '--resource-group')!, name: one(p, '--name')!, image: one(p, '--image'), count: Number(one(p, '--instance-count') ?? 2), size: one(p, '--vm-sku') }, 'cli');
    Object.assign(s.props, { zones, mode, upgrade: one(p, '--upgrade-policy-mode') ?? 'Manual' });
    w.emit('adm.vmss.create', { rg: s.rg, name: s.name, zones, mode, capacity: s.props.capacity });
    return out(p, { vmss: { name: s.name, orchestrationMode: mode, sku: { name: s.props.size, capacity: s.props.capacity }, zones: zones.length ? zones : null, upgradePolicy: mode === 'Uniform' ? { mode: s.props.upgrade } : undefined, provisioningState: 'Succeeded' } });
  } },
  'vmss list-instances': (p, w) => {
    req(p, [['--resource-group', '-g'], ['--name', '-n']]);
    const s = need(w, 'vmss', one(p, '--resource-group'), one(p, '--name'));
    const z: string[] = s.props.zones ?? [];
    const rows = Array.from({ length: s.props.capacity }, (_, i) => ({ Name: `${s.name}_${(i + 1).toString(16).padStart(8, '0')}`, Zone: z.length ? z[i % z.length] : '', Size: s.props.size, State: 'Succeeded' }));
    w.emit('adm.vmss.instances', { rg: s.rg, name: s.name, count: rows.length });
    return out(p, rows, rows, ['Name', 'Zone', 'Size', 'State']);
  },
  'vmss update': { when: (p) => has(p, '--set'), run: (p, w) => {
    req(p, [['--resource-group', '-g'], ['--name', '-n']]);
    const s = need(w, 'vmss', one(p, '--resource-group'), one(p, '--name'));
    w.assertWritable(s.rg, 'update');
    const mode = many(p, '--set').map((x) => /upgradePolicy\.mode=(\w+)/i.exec(x)?.[1]).find(Boolean);
    if (mode) s.props.upgrade = mode;
    w.emit('adm.vmss.update', { rg: s.rg, name: s.name, upgrade: s.props.upgrade });
    return out(p, { name: s.name, upgradePolicy: { mode: s.props.upgrade } });
  } },
  'monitor autoscale create': { when: (p) => /virtualmachinescalesets/i.test(`${one(p, '--resource-type') ?? ''} ${one(p, '--resource') ?? ''}`), run: (p, w) => {
    req(p, [['--resource-group', '-g'], ['--resource', ''], ['--min-count', ''], ['--max-count', ''], ['--count', '']]);
    const rg = one(p, '--resource-group')!;
    const s = need(w, 'vmss', rg, one(p, '--resource')!.split('/').pop());
    const [min, max, count] = ['--min-count', '--max-count', '--count'].map((k) => Number(one(p, k)));
    if (!(min <= count && count <= max)) throw new SimError('The default instance count must be between the minimum and the maximum.', 'InvalidParameter');
    const name = one(p, '--name') ?? s.name;
    S(w).autoscale[lc(name)] = { name, rg: s.rg, target: s.name, min, max, count, rules: [] };
    if (s.props.capacity < min || s.props.capacity > max) s.props.capacity = Math.min(max, Math.max(min, s.props.capacity));
    w.emit('adm.autoscale.create', { rg: s.rg, name, target: s.name, min, max, count });
    return out(p, { name, targetResourceUri: s.id, enabled: true, profiles: [{ name: 'default', capacity: { minimum: String(min), maximum: String(max), default: String(count) }, rules: [] }] });
  } },
  'monitor autoscale rule create': { when: (p) => mineScale(one(p, '--autoscale-name')), run: (p, w) => {
    req(p, [['--resource-group', '-g'], ['--autoscale-name', ''], ['--condition', ''], ['--scale', '']]);
    const a = S(w).autoscale[lc(one(p, '--autoscale-name'))];
    if (!a) throw new SimError(`Autoscale setting '${one(p, '--autoscale-name')}' was not found.`, 'ResourceNotFound');
    const m = /^(.+?)\s*(>=|<=|>|<)\s*(\d+)/.exec(one(p, '--condition')!);
    if (!m) throw new SimError('Write the condition like "Percentage CPU > 70 avg 5m".', 'InvalidParameter');
    const [dir, byS] = many(p, '--scale');
    if (!['out', 'in'].includes(lc(dir))) throw new SimError('--scale takes out or in, then a count, e.g. --scale out 2', 'InvalidParameter');
    const rule = { dir: lc(dir) as 'out' | 'in', metric: m[1].trim(), op: m[2], threshold: Number(m[3]), by: Number(byS ?? 1) };
    a.rules.push(rule);
    w.emit('adm.autoscale.rule', { name: a.name, target: a.target, ...rule });
    return out(p, { metricTrigger: { metricName: rule.metric, operator: rule.op === '>' ? 'GreaterThan' : rule.op === '<' ? 'LessThan' : rule.op, threshold: rule.threshold, timeAggregation: 'Average', timeWindow: 'PT5M' }, scaleAction: { direction: rule.dir === 'out' ? 'Increase' : 'Decrease', type: 'ChangeCount', value: String(rule.by), cooldown: 'PT5M' } });
  } },
  'monitor autoscale show': { when: (p) => mineScale(one(p, '--name')), run: (p, w) => {
    const a = S(w).autoscale[lc(one(p, '--name'))];
    if (!a) throw new SimError(`Autoscale setting '${one(p, '--name')}' was not found.`, 'ResourceNotFound');
    return out(p, { name: a.name, target: a.target, capacity: { minimum: a.min, maximum: a.max, default: a.count }, rules: a.rules.map((r) => `${r.metric} ${r.op} ${r.threshold} → scale ${r.dir} by ${r.by}`) });
  } },
};

function mover(w: World, name?: string) {
  const m = S(w).movers[lc(name)];
  if (!m) throw new SimError(`Move collection '${name ?? ''}' was not found. Create it with az resource-mover move-collection create.`, 'ResourceNotFound');
  return m;
}
function step(p: Parsed, w: World, from: string, to: string, what: string): AdminOut {
  const m = mover(w, one(p, '--name', '--move-collection-name'));
  if (!m.items.length) throw new SimError(`${m.name} has no resources. Add them with az resource-mover move-resource add.`, 'BadRequest');
  const wanted = many(p, '--move-resources').flatMap((x) => x.split(/\s+/)).map((x) => lc(x.split('/').pop()));
  const items = wanted.length ? m.items.filter((i) => wanted.includes(lc(i.name))) : m.items;
  const wrong = items.filter((i) => i.state !== from);
  if (wrong.length) {
    w.emit('adm.mover.blocked', { collection: m.name, step: what, state: wrong[0].state });
    throw new SimError(`Can't ${what === 'initiate' ? 'initiate the move' : what} yet: '${wrong[0].name}' is in state '${wrong[0].state}'. The order is: resolve dependencies → prepare → initiate move → commit (or discard) → delete the source.`, 'MoveStateInvalid');
  }
  if (what === 'prepare' && m.items.some((i) => i.type === 'vm') && !m.items.some((i) => i.type === 'disk')) {
    w.emit('adm.mover.blocked', { collection: m.name, step: what, state: 'dependencies' });
    throw new SimError('Validation found unresolved dependencies (disks, network interface, virtual network). Run az resource-mover move-collection resolve-dependency first.', 'DependenciesNotResolved');
  }
  items.forEach((i) => (i.state = to));
  let note = '';
  if (what === 'commit') {
    const targetRg = `${(vmById(w, items[0].id)?.rg ?? m.rg)}-${m.target}`;
    w.createRg(targetRg, m.target, {}, 'cli');
    for (const i of items) {
      const r = vmById(w, i.id);
      if (r && !w.find(r.type, targetRg, r.name)) w.addRes(r.type, targetRg, r.name, { ...r.props, movedFrom: r.id }, { location: m.target });
    }
    note = `\nCommitted. Copies now run in ${REGIONS[m.target]} in resource group ${targetRg}. The source resources in ${REGIONS[m.source]} still exist (and still cost money): delete them once you've tested the target.`;
  }
  if (what === 'initiate') note = `\nTarget resources are being created in ${REGIONS[m.target]}. For VMs this replicates the disks with Azure Site Recovery. Test them, then commit (keep) or discard (throw away).`;
  if (what === 'prepare') note = `\nPrepared: replication of the VM disks to ${REGIONS[m.target]} has started.`;
  w.emit(`adm.mover.${what}`, { collection: m.name, count: items.length, target: m.target });
  return { out: `${items.length} resource(s) moved to state '${to}'.${note}` };
}

/* ----------------------------------------------------------- shell side */
function sed(args: string[], w: World): AdminOut {
  const inPlace = args[0] === '-i';
  const rest = inPlace ? args.slice(1) : args;
  const [expr, file] = rest;
  const m = /^s(.)(.*?)\1(.*?)\1(g?)$/.exec(expr ?? '');
  if (!m || !file) return { error: `Usage: sed -i "s/old/new/" ${Object.keys(S(w).files)[0]}` };
  let f;
  try { f = fileOf(w, file); } catch (e) { return { error: `sed: can't read ${file}: No such file or directory` }; }
  const [, , from, to, g] = m;
  if (!f.text.includes(from)) return { error: `sed: pattern '${from}' not found in ${f.name}. Nothing changed. (Check spaces and quotes with cat ${f.name}.)` };
  const next = g ? f.text.split(from).join(to) : f.text.split('\n').map((l) => (l.includes(from) ? l.replace(from, to) : l)).join('\n');
  if (!inPlace) return { out: next };
  S(w).files[f.name] = next;
  w.emit('adm.file.edit', { file: f.name, from, to });
  return { out: '' };
}

/** `az …` (tokens after "az"). */
export function az(tokens: string[], w: World): AdminOut | null {
  CUR = w;
  const gt = tokens.indexOf('>');
  if (gt >= 0) {
    const target = tokens[gt + 1];
    const r = run(T, tokens.slice(0, gt), w);
    if (!r || r.error || !target) return r;
    S(w).files[target] = r.out ?? '';
    w.emit('adm.file.write', { file: target });
    return { out: `(saved to ${target})` };
  }
  return run(T, tokens, w);
}
/** Shell tools: cat / sed / ls on the lab's template files. */
export function shell(tokens: string[], w: World): AdminOut | null {
  const [cmd, ...rest] = tokens;
  const c = lc(cmd);
  const files = S(w).files;
  if (c === 'cat' && rest[0] && files[rest[0].replace(/^\.\//, '')] !== undefined) {
    const name = rest[0].replace(/^\.\//, '');
    w.emit('adm.file.view', { file: name });
    return { out: files[name] };
  }
  if (c === 'sed' && rest.some((x) => files[x] !== undefined)) return sed(rest, w);
  if (c === 'ls') return { out: ['main.bicep', ...Object.keys(files)].join('  ') };
  return null;
}
export const COMPLETIONS: string[] = [
  'az deployment group what-if', 'az deployment group create', 'az deployment group list', 'az deployment group export', 'az group export', 'az bicep decompile', 'az bicep build',
  'az vm list-vm-resize-options', 'az vm resize', 'az vm disk attach', 'az vm disk detach', 'az disk create', 'az disk update', 'az disk list',
  'az feature register', 'az feature show', 'az vm update',
  'az resource-mover move-collection create', 'az resource-mover move-resource add', 'az resource-mover move-collection resolve-dependency', 'az resource-mover move-collection prepare', 'az resource-mover move-collection initiate-move', 'az resource-mover move-collection commit',
  'az vm availability-set create', 'az vm availability-set show', 'az vmss list-instances', 'az vmss update', 'az monitor autoscale create', 'az monitor autoscale rule create', 'az monitor autoscale show',
  'cat storage.bicep', 'cat azuredeploy.json', 'sed -i',
];
