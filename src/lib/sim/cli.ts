/**
 * Simulated Azure CLI ("az") for the practice Cloud Shell. Supports the
 * commands AZ-900 learners meet, with real-looking output and errors.
 */
import { Sim, SimError, SUB_ID, SUB_NAME, REGIONS, VM_SIZES, IMAGES, TYPE_INFO, type Res } from './engine';
import { World, BICEP_FILE, POLICY_DEFS, ONPREM_SERVERS, DATABOX_STEPS } from './world';
import * as F from './foundry';
import * as D from './devsvc';

export interface CliResult {
  out?: string;
  error?: string;
  /** Ask the learner y/n before running `then`. */
  confirm?: { question: string; then: () => CliResult };
  clear?: boolean;
  open?: string;
}

/* ---------------- parsing ---------------- */
function tokenize(line: string): string[] {
  const out: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(line))) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}

const ALIAS: Record<string, string> = { '-n': '--name', '-g': '--resource-group', '-l': '--location', '-o': '--output', '-y': '--yes', '-h': '--help', '-p': '--plan', '-t': '--lock-type', '-r': '--runtime', '-c': '--container-name', '-f': '--file', '-w': '--workspace', '-u': '--username', '-z': '--zone-name' };

interface Parsed { words: string[]; flags: Record<string, string[]> }
function parse(tokens: string[]): Parsed {
  const words: string[] = [];
  const flags: Record<string, string[]> = {};
  let cur: string | null = null;
  for (const raw of tokens) {
    if (raw.startsWith('-') && !/^-\d/.test(raw)) {
      const [k, v] = raw.split('=', 2);
      cur = ALIAS[k] ?? k.toLowerCase();
      flags[cur] ??= [];
      if (v !== undefined && raw.startsWith('--')) flags[cur].push(v);
    } else if (cur) flags[cur].push(raw);
    else words.push(raw.toLowerCase());
  }
  return { words, flags };
}
const one = (p: Parsed, ...names: string[]) => {
  for (const n of names) if (p.flags[n]?.length) return p.flags[n].join(' ');
  return undefined;
};
const has = (p: Parsed, name: string) => name in p.flags;
const tags = (p: Parsed) => Object.fromEntries((p.flags['--tags'] ?? []).map((t) => t.split('=') as [string, string]).filter(([k]) => k).map(([k, v]) => [k, v ?? '']));

function required(p: Parsed, spec: [string, string][]) {
  const missing = spec.filter(([long]) => !p.flags[long]?.length).map(([long, short]) => (short ? `${long}/${short}` : long));
  if (missing.length) throw new SimError(`the following arguments are required: ${missing.join(', ')}`, 'MissingArgs');
}

/* ---------------- output helpers ---------------- */
const json = (v: unknown) => JSON.stringify(v, null, 2);
function table(rows: Record<string, unknown>[], cols: string[]): string {
  if (!rows.length) return '';
  const w = cols.map((c) => Math.max(c.length, ...rows.map((r) => String(r[c] ?? '').length)));
  const line = (vals: string[]) => vals.map((v, i) => v.padEnd(w[i])).join('  ');
  return [line(cols), line(w.map((n) => '-'.repeat(n))), ...rows.map((r) => line(cols.map((c) => String(r[c] ?? ''))))].join('\n');
}
const out = (p: Parsed, value: unknown, rows?: Record<string, unknown>[], cols?: string[]): CliResult => {
  const fmt = (one(p, '--output') ?? 'json').toLowerCase();
  if (fmt === 'table' && rows && cols) return { out: table(rows, cols) };
  if (fmt === 'none') return { out: '' };
  if (fmt === 'tsv' && rows && cols) return { out: rows.map((r) => cols.map((c) => r[c]).join('\t')).join('\n') };
  return { out: json(value) };
};
const rgJson = (g: { name: string; location: string; tags: Record<string, string> }) => ({
  id: `/subscriptions/${SUB_ID}/resourceGroups/${g.name}`,
  location: g.location,
  managedBy: null,
  name: g.name,
  properties: { provisioningState: 'Succeeded' },
  tags: Object.keys(g.tags).length ? g.tags : null,
  type: 'Microsoft.Resources/resourceGroups',
});
const resRow = (r: Res) => ({ Name: r.name, ResourceGroup: r.rg, Location: r.location, Type: TYPE_INFO[r.type].arm });

/* ---------------- help ---------------- */
const GROUPS: Record<string, [string, string][]> = {
  group: [['create', 'Create a new resource group.'], ['list', 'List resource groups.'], ['show', 'Show one resource group.'], ['update', 'Update tags on a resource group.'], ['delete', 'Delete a resource group and everything in it.']],
  vm: [['create', 'Create a virtual machine.'], ['list', 'List virtual machines.'], ['show', 'Show details of a VM.'], ['start', 'Start a VM.'], ['stop', 'Power off a VM (still billed for compute!).'], ['deallocate', 'Deallocate a VM (stops compute billing).'], ['restart', 'Restart a VM.'], ['delete', 'Delete a VM.'], ['list-sizes', 'List available VM sizes.']],
  'storage account': [['create', 'Create a storage account.'], ['list', 'List storage accounts.'], ['show', 'Show a storage account.'], ['update', 'Change redundancy with --sku.'], ['delete', 'Delete a storage account.']],
  'appservice plan': [['create', 'Create an App Service plan.'], ['list', 'List App Service plans.']],
  webapp: [['create', 'Create a web app.'], ['list', 'List web apps.'], ['browse', 'Open a web app in the browser.']],
  vmss: [['create', 'Create a virtual machine scale set.'], ['scale', 'Change the number of instances.'], ['list', 'List scale sets.']],
  lock: [['create', 'Create a management lock.'], ['list', 'List locks.'], ['delete', 'Delete a lock.']],
  resource: [['list', 'List all resources.']],
  account: [['show', 'Show the current subscription.'], ['list-locations', 'List Azure regions.']],
  'cognitiveservices account': [['create', 'Create a Foundry resource (--kind AIServices).'], ['list', 'List Foundry / AI services resources.'], ['show', 'Show one resource and its endpoint.'], ['keys list', 'Show the access keys.']],
  'cognitiveservices account deployment': [['create', 'Deploy a model (--model-name, --sku-name GlobalStandard).'], ['list', 'List model deployments.'], ['delete', 'Delete a deployment.']],
};
function helpFor(path: string): string {
  if (!path)
    return [
      'Welcome to the simulated Azure CLI! 🎉 (Practice only, nothing here touches real Azure.)',
      '',
      'Use `az [group] [subgroup] [command] [args]`. Groups you can try:',
      ...[...new Set(Object.keys(GROUPS).map((g) => g.split(' ')[0]))].map((g) => `    ${g.padEnd(18)}`),
      '',
      'Examples:',
      '    az group create --name rg-learn --location westeurope',
      '    az vm create -g rg-learn -n web01 --image Ubuntu2204 --size Standard_B1s',
      '    az group list -o table',
      '',
      'Add --help to any group, e.g. `az vm --help`. Type `clear` to clear the screen.',
      D.SHELL_HELP + '.',
    ].join('\n');
  const cmds = GROUPS[path];
  if (!cmds) return `No help found for '${path}'. Try 'az --help'.`;
  return [`Group\n    az ${path}\n\nCommands:`, ...cmds.map(([c, d]) => `    ${c.padEnd(14)}: ${d}`)].join('\n');
}

/* ---------------- commands ---------------- */
type Handler = (p: Parsed, sim: Sim) => CliResult;
function vmPower(p: Parsed, sim: Sim, action: 'start' | 'stop' | 'deallocate' | 'restart'): CliResult {
  required(p, [['--resource-group', '-g'], ['--name', '-n']]);
  sim.powerVm(one(p, '--resource-group')!, one(p, '--name')!, action, 'cli');
  return { out: '' };
}
const C: Record<string, Handler> = {
  'login': () => ({ out: 'Cloud Shell is already signed in as learner@msdevbuild.com. DefaultAzureCredential in your Python apps uses this Microsoft Entra ID sign-in.' }),
  'cognitiveservices account create': (p, sim) => {
    required(p, [['--name', '-n'], ['--resource-group', '-g'], ['--kind', '']]);
    const kind = one(p, '--kind')!;
    if (kind.toLowerCase() !== 'aiservices') throw new SimError(`This simulator creates Foundry resources only. Use --kind AIServices (you passed '${kind}').`, 'InvalidKind');
    const r = F.createFoundry(W(sim), { rg: one(p, '--resource-group')!, name: one(p, '--name')!, location: one(p, '--location'), tags: tags(p) }, 'cli');
    return out(p, { id: r.id, kind: 'AIServices', location: r.location, name: r.name, properties: { endpoint: F.resourceEndpoint(r), customSubDomainName: r.name, provisioningState: 'Succeeded' }, sku: { name: 'S0' }, note: 'Create a project in the portal: open the resource ➜ Projects ➜ + New project.' });
  },
  'cognitiveservices account list': (p, sim) => {
    const l = F.foundries(W(sim));
    return out(p, l.map((r) => ({ name: r.name, kind: 'AIServices', location: r.location, resourceGroup: r.rg, endpoint: F.resourceEndpoint(r) })), l.map((r) => ({ Name: r.name, Kind: 'AIServices', Location: r.location, ResourceGroup: r.rg })), ['Name', 'Kind', 'Location', 'ResourceGroup']);
  },
  'cognitiveservices account show': (p, sim) => {
    required(p, [['--name', '-n'], ['--resource-group', '-g']]);
    const r = sim.need('foundry', one(p, '--resource-group')!, one(p, '--name')!);
    return out(p, { name: r.name, kind: 'AIServices', location: r.location, properties: { endpoint: F.resourceEndpoint(r), projects: r.props.projects.map((x: string) => ({ name: x, endpoint: F.projectEndpoint(r, x) })) } });
  },
  'cognitiveservices account keys list': (p, sim) => {
    required(p, [['--name', '-n'], ['--resource-group', '-g']]);
    sim.need('foundry', one(p, '--resource-group')!, one(p, '--name')!);
    sim.emit('ai.keys', { name: one(p, '--name'), via: 'cli' });
    return out(p, { key1: 'SIMULATEDKEY1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d', key2: 'SIMULATEDKEY2f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c', note: 'Prefer Microsoft Entra ID (DefaultAzureCredential) over keys; rotate keys if you use them.' });
  },
  'cognitiveservices account deployment create': (p, sim) => {
    required(p, [['--name', '-n'], ['--resource-group', '-g'], ['--deployment-name', ''], ['--model-name', '']]);
    const r = sim.need('foundry', one(p, '--resource-group')!, one(p, '--name')!);
    const d = F.deployModel(W(sim), r, { name: one(p, '--deployment-name'), model: one(p, '--model-name')!, sku: one(p, '--sku-name', '--sku') ?? 'GlobalStandard', capacity: Number(one(p, '--sku-capacity', '--capacity') ?? 10) }, 'cli');
    return out(p, { name: d.name, properties: { model: { format: d.model.startsWith('gpt') || d.model.startsWith('o') || d.model.startsWith('text-') ? 'OpenAI' : 'Microsoft', name: d.model }, provisioningState: 'Succeeded' }, sku: { name: d.sku, capacity: d.capacity } });
  },
  'cognitiveservices account deployment list': (p, sim) => {
    required(p, [['--name', '-n'], ['--resource-group', '-g']]);
    const r = sim.need('foundry', one(p, '--resource-group')!, one(p, '--name')!);
    const l = r.props.deployments as F.Deployment[];
    return out(p, l.map((d) => ({ name: d.name, properties: { model: { name: d.model } }, sku: { name: d.sku, capacity: d.capacity } })), l.map((d) => ({ Name: d.name, Model: d.model, Sku: d.sku, Capacity: d.capacity })), ['Name', 'Model', 'Sku', 'Capacity']);
  },
  'cognitiveservices account deployment delete': (p, sim) => {
    required(p, [['--name', '-n'], ['--resource-group', '-g'], ['--deployment-name', '']]);
    const r = sim.need('foundry', one(p, '--resource-group')!, one(p, '--name')!);
    F.deleteDeployment(W(sim), r, one(p, '--deployment-name')!, 'cli');
    return { out: '' };
  },
  'account show': (p) => out(p, { id: SUB_ID, name: SUB_NAME, isDefault: true, state: 'Enabled', tenantId: '11111111-2222-3333-4444-555555555555', user: { name: 'learner@msdevbuild.com', type: 'user' } }),
  'account list-locations': (p) => {
    const rows = Object.entries(REGIONS).map(([name, displayName]) => ({ DisplayName: displayName, Name: name }));
    return out(p, rows.map((r) => ({ displayName: r.DisplayName, name: r.Name })), rows, ['DisplayName', 'Name']);
  },

  'group create': (p, sim) => {
    required(p, [['--name', '-n'], ['--location', '-l']]);
    return out(p, rgJson(sim.createRg(one(p, '--name')!, one(p, '--location')!, tags(p), 'cli')));
  },
  'group list': (p, sim) => out(p, sim.rgs.map(rgJson), sim.rgs.map((g) => ({ Name: g.name, Location: g.location, Status: 'Succeeded' })), ['Name', 'Location', 'Status']),
  'group show': (p, sim) => {
    required(p, [['--name', '-n']]);
    return out(p, rgJson(sim.needRg(one(p, '--name')!)));
  },
  'group update': (p, sim) => {
    required(p, [['--name', '-n']]);
    if (!has(p, '--tags')) throw new SimError('Nothing to update. Try --tags env=learning owner=you');
    return out(p, rgJson(sim.tagRg(one(p, '--name')!, tags(p), 'cli', true)));
  },
  'group delete': (p, sim) => {
    required(p, [['--name', '-n']]);
    const name = one(p, '--name')!;
    const g = sim.needRg(name);
    const run = () => { sim.deleteRg(g.name, 'cli'); return { out: '' }; };
    return has(p, '--yes') ? run() : { confirm: { question: 'Are you sure you want to perform this operation? (y/n): ', then: run } };
  },

  'vm create': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--name', '-n'], ['--image', '']]);
    const vm = sim.createVm({
      rg: one(p, '--resource-group')!, name: one(p, '--name')!, image: one(p, '--image')!, size: one(p, '--size'),
      location: one(p, '--location'), zone: one(p, '--zone'), admin: one(p, '--admin-username'),
      ports: has(p, '--public-ip-address') && one(p, '--public-ip-address') === '' ? 'none' : undefined,
    }, 'cli');
    const note = IMAGES[vm.props.image].os === 'Linux' && !has(p, '--generate-ssh-keys') ? '\n(Simulated: in real Azure, add --generate-ssh-keys or --admin-password.)' : '';
    return { out: json({ fqdns: '', id: vm.id, location: vm.location, macAddress: '00-0D-3A-4B-' + Math.floor(10 + Math.random() * 89) + '-1F', powerState: 'VM running', privateIpAddress: vm.props.privateIp, publicIpAddress: vm.props.publicIp, resourceGroup: vm.rg, zones: vm.props.zone }) + note };
  },
  'vm list': (p, sim) => {
    const g = one(p, '--resource-group');
    const vms = sim.res.filter((r) => r.type === 'vm' && (!g || r.rg.toLowerCase() === g.toLowerCase()));
    return out(p, vms.map((v) => ({ name: v.name, resourceGroup: v.rg, location: v.location, hardwareProfile: { vmSize: v.props.size }, storageProfile: { imageReference: v.props.image } })),
      vms.map((v) => ({ Name: v.name, ResourceGroup: v.rg, Location: v.location, Size: v.props.size, PowerState: `VM ${v.props.power}` })), ['Name', 'ResourceGroup', 'Location', 'Size', 'PowerState']);
  },
  'vm show': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--name', '-n']]);
    const v = sim.need('vm', one(p, '--resource-group')!, one(p, '--name')!);
    return out(p, { name: v.name, location: v.location, powerState: `VM ${v.props.power}`, hardwareProfile: { vmSize: v.props.size }, osProfile: { adminUsername: v.props.admin }, storageProfile: { image: IMAGES[v.props.image].label, osDisk: v.props.disk }, networkProfile: { nic: v.props.nic }, publicIps: v.props.publicIp, privateIps: v.props.privateIp, zones: v.props.zone || null });
  },
  'vm start': (p, sim) => vmPower(p, sim, 'start'),
  'vm stop': (p, sim) => {
    const r = vmPower(p, sim, 'stop');
    return { out: `${r.out ?? ''}\nWarning: 'az vm stop' powers off the VM but keeps it ALLOCATED, so you are still billed for compute. Use 'az vm deallocate' to stop paying for compute.`.trim() };
  },
  'vm deallocate': (p, sim) => vmPower(p, sim, 'deallocate'),
  'vm restart': (p, sim) => vmPower(p, sim, 'restart'),
  'vm list-sizes': (p) => {
    const rows = Object.entries(VM_SIZES).map(([n, s]) => ({ Name: n, NumberOfCores: s.cpu, MemoryInMB: s.ram * 1024 }));
    return out(p, rows, rows, ['Name', 'NumberOfCores', 'MemoryInMB']);
  },
  'vm delete': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--name', '-n']]);
    const v = sim.need('vm', one(p, '--resource-group')!, one(p, '--name')!);
    const run = () => { sim.deleteVm(v.rg, v.name, 'cli'); return { out: `(Note: the VM's disk, network interface and public IP were not deleted. Check 'az resource list -g ${v.rg} -o table'. Disks still cost money!)` }; };
    return has(p, '--yes') ? run() : { confirm: { question: 'Are you sure you want to perform this operation? (y/n): ', then: run } };
  },

  'storage account create': (p, sim) => {
    required(p, [['--name', '-n'], ['--resource-group', '-g']]);
    const st = sim.createStorage({ rg: one(p, '--resource-group')!, name: one(p, '--name')!, location: one(p, '--location'), sku: one(p, '--sku'), kind: one(p, '--kind') }, 'cli');
    return { out: json({ id: st.id, kind: st.props.kind, location: st.location, name: st.name, primaryEndpoints: { blob: st.props.endpoint }, provisioningState: 'Succeeded', resourceGroup: st.rg, sku: { name: st.props.sku, tier: st.props.sku.split('_')[0] } }) };
  },
  'storage account list': (p, sim) => {
    const list = sim.res.filter((r) => r.type === 'storage' && (!one(p, '--resource-group') || r.rg.toLowerCase() === one(p, '--resource-group')!.toLowerCase()));
    return out(p, list.map((s) => ({ name: s.name, resourceGroup: s.rg, location: s.location, sku: { name: s.props.sku } })), list.map((s) => ({ Name: s.name, ResourceGroup: s.rg, Location: s.location, Sku: s.props.sku, Kind: s.props.kind })), ['Name', 'ResourceGroup', 'Location', 'Sku', 'Kind']);
  },
  'storage account show': (p, sim) => {
    required(p, [['--name', '-n'], ['--resource-group', '-g']]);
    const s = sim.need('storage', one(p, '--resource-group')!, one(p, '--name')!);
    return out(p, { name: s.name, location: s.location, sku: { name: s.props.sku }, kind: s.props.kind, accessTier: s.props.accessTier, primaryEndpoints: { blob: s.props.endpoint } });
  },
  'storage account update': (p, sim) => {
    required(p, [['--name', '-n'], ['--resource-group', '-g']]);
    const g = one(p, '--resource-group')!, n = one(p, '--name')!;
    if (!has(p, '--sku') && !has(p, '--public-network-access')) throw new SimError('Nothing to update. Try --sku Standard_GRS or --public-network-access Disabled', 'MissingArgs');
    if (has(p, '--public-network-access')) W(sim).setPublicAccess(g, n, one(p, '--public-network-access') ?? '', 'cli');
    const s = has(p, '--sku') ? sim.updateStorageSku(g, n, one(p, '--sku')!, 'cli') : sim.need('storage', g, n);
    return out(p, { name: s.name, sku: { name: s.props.sku }, publicNetworkAccess: s.props.publicAccess ?? 'Enabled', provisioningState: 'Succeeded' });
  },
  'storage account delete': (p, sim) => {
    required(p, [['--name', '-n'], ['--resource-group', '-g']]);
    const g = one(p, '--resource-group')!, n = one(p, '--name')!;
    sim.need('storage', g, n);
    const run = () => { sim.deleteStorage(g, n, 'cli'); return { out: '' }; };
    return has(p, '--yes') ? run() : { confirm: { question: 'Are you sure you want to perform this operation? (y/n): ', then: run } };
  },

  'appservice plan create': (p, sim) => {
    required(p, [['--name', '-n'], ['--resource-group', '-g']]);
    const pl = sim.createPlan({ rg: one(p, '--resource-group')!, name: one(p, '--name')!, sku: one(p, '--sku'), location: one(p, '--location') }, 'cli');
    return out(p, { id: pl.id, name: pl.name, location: pl.location, sku: { name: pl.props.sku }, kind: 'linux', provisioningState: 'Succeeded' });
  },
  'appservice plan list': (p, sim) => {
    const l = sim.res.filter((r) => r.type === 'plan');
    return out(p, l.map((x) => ({ name: x.name, sku: x.props.sku })), l.map((x) => ({ Name: x.name, ResourceGroup: x.rg, Location: x.location, Sku: x.props.sku })), ['Name', 'ResourceGroup', 'Location', 'Sku']);
  },
  'webapp create': (p, sim) => {
    required(p, [['--name', '-n'], ['--resource-group', '-g'], ['--plan', '-p']]);
    const w = sim.createWebapp({ rg: one(p, '--resource-group')!, plan: one(p, '--plan')!, name: one(p, '--name')!, runtime: one(p, '--runtime') }, 'cli');
    return out(p, { defaultHostName: w.props.host, id: w.id, name: w.name, state: 'Running', resourceGroup: w.rg, siteConfig: { linuxFxVersion: w.props.runtime.replace(':', '|') } });
  },
  'webapp list': (p, sim) => {
    const l = sim.res.filter((r) => r.type === 'webapp');
    return out(p, l.map((w) => ({ name: w.name, defaultHostName: w.props.host, state: w.props.state })), l.map((w) => ({ Name: w.name, Location: w.location, State: w.props.state, ResourceGroup: w.rg, DefaultHostName: w.props.host })), ['Name', 'Location', 'State', 'ResourceGroup', 'DefaultHostName']);
  },
  'webapp browse': (p, sim) => {
    required(p, [['--name', '-n'], ['--resource-group', '-g']]);
    const w = sim.need('webapp', one(p, '--resource-group')!, one(p, '--name')!);
    sim.emit('webapp.browse', { rg: w.rg, name: w.name, via: 'cli' });
    return { out: `Opening https://${w.props.host} …`, open: w.id };
  },

  'vmss create': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--name', '-n'], ['--image', '']]);
    const s = sim.createVmss({ rg: one(p, '--resource-group')!, name: one(p, '--name')!, image: one(p, '--image'), count: Number(one(p, '--instance-count') ?? 2), size: one(p, '--vm-sku') }, 'cli');
    return out(p, { vmss: { name: s.name, sku: { name: s.props.size, capacity: s.props.capacity }, provisioningState: 'Succeeded', resourceGroup: s.rg } });
  },
  'vmss scale': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--name', '-n'], ['--new-capacity', '']]);
    const s = sim.scaleVmss(one(p, '--resource-group')!, one(p, '--name')!, Number(one(p, '--new-capacity')), 'cli');
    return out(p, { name: s.name, sku: { name: s.props.size, capacity: s.props.capacity }, provisioningState: 'Succeeded' });
  },
  'vmss list': (p, sim) => {
    const l = sim.res.filter((r) => r.type === 'vmss');
    return out(p, l.map((s) => ({ name: s.name, sku: { capacity: s.props.capacity } })), l.map((s) => ({ Name: s.name, ResourceGroup: s.rg, Location: s.location, Capacity: s.props.capacity, Size: s.props.size })), ['Name', 'ResourceGroup', 'Location', 'Capacity', 'Size']);
  },

  'lock create': (p, sim) => {
    required(p, [['--name', '-n'], ['--lock-type', '-t'], ['--resource-group', '-g']]);
    const l = sim.addLock(one(p, '--resource-group')!, one(p, '--name')!, one(p, '--lock-type')!, 'cli');
    return out(p, { id: `/subscriptions/${SUB_ID}/resourceGroups/${one(p, '--resource-group')}/providers/Microsoft.Authorization/locks/${l.name}`, level: l.level, name: l.name, notes: null, type: 'Microsoft.Authorization/locks' });
  },
  'lock list': (p, sim) => {
    const g = one(p, '--resource-group');
    const rows = sim.rgs.filter((r) => !g || r.name.toLowerCase() === g.toLowerCase()).flatMap((r) => r.locks.map((l) => ({ Name: l.name, ResourceGroup: r.name, Level: l.level })));
    return out(p, rows.map((r) => ({ name: r.Name, level: r.Level, resourceGroup: r.ResourceGroup })), rows, ['Name', 'ResourceGroup', 'Level']);
  },
  'lock delete': (p, sim) => {
    required(p, [['--name', '-n'], ['--resource-group', '-g']]);
    sim.removeLock(one(p, '--resource-group')!, one(p, '--name')!, 'cli');
    return { out: '' };
  },

  'resource list': (p, sim) => {
    const g = one(p, '--resource-group');
    const l = sim.res.filter((r) => !g || r.rg.toLowerCase() === g.toLowerCase());
    return out(p, l.map((r) => ({ id: r.id, name: r.name, type: TYPE_INFO[r.type].arm, location: r.location, resourceGroup: r.rg })), l.map(resRow), ['Name', 'ResourceGroup', 'Location', 'Type']);
  },
};

/* ---------------- the extended practice world: networking, identity, governance, serverless, hybrid, monitoring ---------------- */
const W = (sim: Sim): World => {
  if (!(sim instanceof World)) throw new SimError('This command is not available in this simulator.', 'NotSupported');
  return sim;
};
const SHORTCUT = 'ℹ Practice shortcut: in real Azure you do this in the portal or admin center, not with this exact command.';
const list = (v?: string) => (v ?? '').split(/[\s,]+/).filter(Boolean);
const scopeOf = (p: Parsed): string => {
  const g = one(p, '--resource-group');
  if (g) return `rg/${g}`;
  const sc = one(p, '--scope') ?? '';
  const mg = /managementGroups\/([^/\s]+)/i.exec(sc)?.[1];
  if (mg) return `mg/${mg}`;
  const rg = /resourceGroups\/([^/\s]+)/i.exec(sc)?.[1];
  return rg ? `rg/${rg}` : 'subscription';
};

Object.assign(GROUPS, {
  network: [['vnet', 'Virtual networks, subnets and peering.'], ['nsg', 'Network security groups and rules.'], ['vnet-gateway', 'VPN gateways.'], ['dns', 'DNS zones and records.'], ['private-endpoint', 'Private endpoints.']],
  'network dns': [['zone', 'DNS zones.'], ['record-set', 'Records such as A records.']],
  'network vnet': [['create', 'Create a virtual network.'], ['list', 'List virtual networks.'], ['subnet', 'Manage subnets.'], ['peering', 'Connect two virtual networks.']],
  'network vnet subnet': [['create', 'Add a subnet to a virtual network.'], ['list', 'List subnets.']],
  'network vnet peering': [['create', 'Peer two virtual networks (run it from both sides).'], ['list', 'List peerings.']],
  'network nsg': [['create', 'Create a network security group.'], ['rule', 'Manage rules.']],
  'network nsg rule': [['create', 'Add an allow or deny rule.'], ['list', 'List rules.']],
  'network vnet-gateway': [['create', 'Create a VPN gateway (needs a GatewaySubnet).']],
  'network dns zone': [['create', 'Host a DNS zone in Azure.'], ['list', 'List DNS zones.']],
  'network dns record-set a': [['add-record', 'Add an A record.']],
  'network private-endpoint': [['create', 'Give a storage account a private IP in your VNet.']],
  'storage container': [['create', 'Create a blob container.']],
  'storage blob': [['upload', 'Upload a blob.'], ['list', 'List blobs.'], ['set-tier', 'Change Hot, Cool, Cold or Archive.']],
  functionapp: [['create', 'Create a serverless function app.'], ['list', 'List function apps.'], ['logs', 'Show recent executions (practice).']],
  container: [['create', 'Run a container in Azure Container Instances.'], ['list', 'List container groups.']],
  aks: [['create', 'Create a Kubernetes cluster.'], ['scale', 'Change the number of nodes.'], ['list', 'List clusters.']],
  connectedmachine: [['list', 'List Azure Arc-enabled servers.']],
  ad: [['user', 'Users.'], ['group', 'Groups.'], ['guest', 'Guests (practice).'], ['conditional-access', 'Conditional Access (practice).']],
  'ad user': [['create', 'Create a user.'], ['list', 'List users.']],
  'ad group': [['create', 'Create a group.'], ['list', 'List groups.'], ['member', 'Manage members.']],
  'ad group member': [['add', 'Add a user to a group.']],
  'ad guest': [['invite', 'Invite a partner as a guest (practice shortcut).']],
  'ad conditional-access': [['create', 'Create a policy (practice shortcut).'], ['what-if', 'Test a sign-in (practice shortcut).']],
  'role assignment': [['create', 'Give someone a role at a scope.'], ['list', 'List role assignments.']],
  'account management-group': [['create', 'Create a management group.'], ['list', 'List management groups.'], ['subscription', 'Move a subscription under a group.']],
  'account management-group subscription': [['add', 'Move the subscription under a management group.']],
  'policy definition': [['list', 'List built-in policy definitions.']],
  'policy assignment': [['create', 'Assign a policy at a scope.'], ['list', 'List assignments.'], ['delete', 'Remove an assignment.']],
  'policy state': [['summarize', 'Show compliance.']],
  'deployment group': [['what-if', 'Preview a template deployment.'], ['create', 'Deploy a Bicep or ARM template.']],
  'monitor log-analytics workspace': [['create', 'Create a Log Analytics workspace.']],
  'monitor log-analytics': [['query', 'Run a KQL query.']],
  'monitor metrics alert': [['create', 'Alert when a metric crosses a threshold.']],
  'vm run-command': [['invoke', 'Run a script inside a VM.']],
  'consumption budget': [['create', 'Create a monthly budget with alerts.'], ['list', 'List budgets.']],
  'advisor recommendation': [['list', 'Show Advisor recommendations.']],
  migrate: [['discover', 'Discover on-premises servers (practice).'], ['assess', 'Assess them for Azure (practice).'], ['server', 'Migrate one server (practice).']],
  'databox job': [['create', 'Order a Data Box (practice).'], ['advance', 'Move the order to its next step (practice).'], ['list', 'Show orders.']],
});

Object.assign(C, {
  /* networking */
  'network vnet create': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--name', '-n']]);
    const v = W(sim).createVnet({ rg: one(p, '--resource-group')!, name: one(p, '--name')!, prefix: one(p, '--address-prefixes', '--address-prefix'), location: one(p, '--location'), subnet: one(p, '--subnet-name'), subnetPrefix: one(p, '--subnet-prefixes', '--subnet-prefix') }, 'cli');
    return out(p, { newVNet: { name: v.name, location: v.location, addressSpace: { addressPrefixes: [v.props.addressSpace] }, subnets: v.props.subnetList, provisioningState: 'Succeeded' } });
  },
  'network vnet list': (p, sim) => {
    const l = sim.res.filter((r) => r.type === 'vnet' && !r.props.auto);
    return out(p, l.map((v) => ({ name: v.name, addressSpace: v.props.addressSpace, location: v.location })), l.map((v) => ({ Name: v.name, ResourceGroup: v.rg, Location: v.location, AddressSpace: v.props.addressSpace, Subnets: (v.props.subnetList ?? []).length })), ['Name', 'ResourceGroup', 'Location', 'AddressSpace', 'Subnets']);
  },
  'network vnet subnet create': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--vnet-name', ''], ['--name', '-n'], ['--address-prefixes', '']]);
    W(sim).createSubnet(one(p, '--resource-group')!, one(p, '--vnet-name')!, one(p, '--name')!, one(p, '--address-prefixes')!, one(p, '--network-security-group', '--nsg'), 'cli');
    return out(p, { name: one(p, '--name'), addressPrefix: one(p, '--address-prefixes'), networkSecurityGroup: one(p, '--network-security-group') ?? null, provisioningState: 'Succeeded' });
  },
  'network vnet subnet list': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--vnet-name', '']]);
    const v = W(sim).vnetOf(one(p, '--resource-group')!, one(p, '--vnet-name')!);
    const rows = v.props.subnetList.map((s: any) => ({ Name: s.name, AddressPrefix: s.prefix, NSG: s.nsg ?? '' }));
    return out(p, rows, rows, ['Name', 'AddressPrefix', 'NSG']);
  },
  'network vnet peering create': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--name', '-n'], ['--vnet-name', ''], ['--remote-vnet', '']]);
    const pe = W(sim).peer(one(p, '--resource-group')!, one(p, '--name')!, one(p, '--vnet-name')!, one(p, '--remote-vnet')!, 'cli');
    const note = pe.state === 'Connected' ? '' : `\nPeering is 'Initiated'. Create the peering from '${one(p, '--remote-vnet')}' back to '${one(p, '--vnet-name')}' too, then it shows 'Connected'.`;
    return { out: json({ name: pe.name, remoteVirtualNetwork: pe.remote, peeringState: pe.state, allowVirtualNetworkAccess: true }) + note };
  },
  'network vnet peering list': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--vnet-name', '']]);
    const v = W(sim).vnetOf(one(p, '--resource-group')!, one(p, '--vnet-name')!);
    const rows = v.props.peerings.map((x: any) => ({ Name: x.name, Remote: x.remote, PeeringState: x.state }));
    return out(p, rows, rows, ['Name', 'Remote', 'PeeringState']);
  },
  'network nsg create': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--name', '-n']]);
    W(sim).createNsg(one(p, '--resource-group')!, one(p, '--name')!, 'cli');
    return out(p, { NewNSG: { name: one(p, '--name'), provisioningState: 'Succeeded', defaultSecurityRules: ['AllowVnetInBound', 'AllowAzureLoadBalancerInBound', 'DenyAllInBound'] } });
  },
  'network nsg rule create': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--nsg-name', ''], ['--name', '-n'], ['--priority', '']]);
    const r = { name: one(p, '--name')!, priority: Number(one(p, '--priority')), port: one(p, '--destination-port-ranges', '--destination-port-range') ?? '*', access: one(p, '--access') ?? 'Allow', direction: one(p, '--direction') ?? 'Inbound', source: one(p, '--source-address-prefixes', '--source-address-prefix') ?? '*', protocol: one(p, '--protocol') ?? 'Tcp' };
    W(sim).addNsgRule(one(p, '--resource-group')!, one(p, '--nsg-name')!, r, 'cli');
    return out(p, { ...r, provisioningState: 'Succeeded' });
  },
  'network nsg rule list': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--nsg-name', '']]);
    const n = sim.need('nsg', one(p, '--resource-group')!, one(p, '--nsg-name')!);
    const rows = (n.props.rules ?? []).map((r: any) => ({ Name: r.name, Priority: r.priority, Port: r.port, Access: r.access, Direction: r.direction, Source: r.source }));
    return out(p, rows, rows, ['Name', 'Priority', 'Port', 'Access', 'Direction', 'Source']);
  },
  'network vnet-gateway create': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--name', '-n'], ['--vnet', '']]);
    const gw = W(sim).createVpnGateway(one(p, '--resource-group')!, one(p, '--name')!, one(p, '--vnet')!, one(p, '--sku') ?? 'VpnGw1', 'cli');
    return { out: json({ vnetGateway: { name: gw.name, gatewayType: 'Vpn', vpnType: 'RouteBased', sku: { name: gw.props.sku }, publicIp: gw.props.publicIp, provisioningState: 'Succeeded' } }) + '\n(Simulated: a real VPN gateway takes 30-45 minutes to create.)' };
  },
  'network dns zone create': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--name', '-n']]);
    const z = W(sim).createDnsZone(one(p, '--resource-group')!, one(p, '--name')!, 'cli');
    return out(p, { name: z.name, nameServers: z.props.nameServers, numberOfRecordSets: 2, zoneType: 'Public' });
  },
  'network dns zone list': (p, sim) => {
    const l = sim.res.filter((r) => r.type === 'dnszone');
    return out(p, l.map((z) => ({ name: z.name })), l.map((z) => ({ ZoneName: z.name, ResourceGroup: z.rg, RecordSets: 2 + z.props.records.length })), ['ZoneName', 'ResourceGroup', 'RecordSets']);
  },
  'network dns record-set a add-record': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--zone-name', '-z'], ['--ipv4-address', '']]);
    if (!one(p, '--record-set-name', '--name')) throw new SimError('the following arguments are required: --record-set-name/-n', 'MissingArgs');
    W(sim).addARecord(one(p, '--resource-group')!, one(p, '--zone-name')!, one(p, '--record-set-name', '--name')!, one(p, '--ipv4-address')!, 'cli');
    return out(p, { name: one(p, '--record-set-name', '--name'), type: 'Microsoft.Network/dnszones/A', ARecords: [{ ipv4Address: one(p, '--ipv4-address') }], TTL: 3600 });
  },
  'network private-endpoint create': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--name', '-n'], ['--vnet-name', ''], ['--subnet', ''], ['--private-connection-resource-id', '']]);
    const pe = W(sim).createPrivateEndpoint(one(p, '--resource-group')!, one(p, '--name')!, one(p, '--vnet-name')!, one(p, '--subnet')!, one(p, '--private-connection-resource-id')!, 'cli');
    return out(p, { name: pe.name, privateIp: pe.props.ip, target: pe.props.target, groupIds: ['blob'], provisioningState: 'Succeeded' });
  },

  /* storage data */
  'storage container create': (p, sim) => {
    required(p, [['--account-name', ''], ['--name', '-n']]);
    return out(p, W(sim).createContainer(one(p, '--account-name')!, one(p, '--name')!, 'cli'));
  },
  'storage blob upload': (p, sim) => {
    required(p, [['--account-name', ''], ['--container-name', '-c']]);
    const name = one(p, '--name') ?? one(p, '--file')?.split('/').pop();
    const ran = W(sim).uploadBlob(one(p, '--account-name')!, one(p, '--container-name')!, name ?? '', one(p, '--tier') ?? 'Hot', 'cli');
    return { out: json({ name, container: one(p, '--container-name'), lastModified: new Date().toISOString() }) + (ran.length ? `\n⚡ The upload triggered function app '${ran.join(', ')}'. Run 'az functionapp logs -g <group> -n ${ran[0]}' to see it.` : '') };
  },
  'storage blob list': (p, sim) => {
    required(p, [['--account-name', ''], ['--container-name', '-c']]);
    const st = W(sim).storageByName(one(p, '--account-name')!);
    const rows = (st.props.containers[one(p, '--container-name')!] ?? []).map((b: any) => ({ Name: b.name, Tier: b.tier, Length: b.size }));
    return out(p, rows, rows, ['Name', 'Tier', 'Length']);
  },
  'storage blob set-tier': (p, sim) => {
    required(p, [['--account-name', ''], ['--container-name', '-c'], ['--name', '-n'], ['--tier', '']]);
    W(sim).setTier(one(p, '--account-name')!, one(p, '--container-name')!, one(p, '--name')!, one(p, '--tier')!, 'cli');
    return { out: '' };
  },

  /* serverless and containers */
  'functionapp create': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--name', '-n'], ['--storage-account', '']]);
    const f = W(sim).createFunctionApp({ rg: one(p, '--resource-group')!, name: one(p, '--name')!, storage: one(p, '--storage-account')!, runtime: one(p, '--runtime') }, 'cli');
    return out(p, { name: f.name, defaultHostName: f.props.host, kind: 'functionapp,linux', plan: f.props.plan, state: 'Running', note: 'Billed per execution. When nothing runs, you pay close to nothing.' });
  },
  'functionapp list': (p, sim) => {
    const l = sim.res.filter((r) => r.type === 'functionapp');
    return out(p, l.map((f) => ({ name: f.name, executions: f.props.executions })), l.map((f) => ({ Name: f.name, ResourceGroup: f.rg, Plan: f.props.plan, Executions: f.props.executions })), ['Name', 'ResourceGroup', 'Plan', 'Executions']);
  },
  'functionapp logs': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--name', '-n']]);
    const f = sim.need('functionapp', one(p, '--resource-group')!, one(p, '--name')!);
    sim.emit('function.logs', { app: f.name });
    return { out: f.props.log?.length ? f.props.log.join('\n') : 'No executions yet. Upload a blob to the storage account to trigger the function.' };
  },
  'container create': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--name', '-n'], ['--image', '']]);
    const c = W(sim).createAci({ rg: one(p, '--resource-group')!, name: one(p, '--name')!, image: one(p, '--image')!, ports: one(p, '--ports') }, 'cli');
    return out(p, { name: c.name, containers: [{ image: c.props.image }], ipAddress: { ip: c.props.ip, ports: [{ port: Number(c.props.ports) }] }, provisioningState: 'Succeeded', instanceView: { state: 'Running' } });
  },
  'container list': (p, sim) => {
    const l = sim.res.filter((r) => r.type === 'aci');
    return out(p, l.map((c) => ({ name: c.name, image: c.props.image })), l.map((c) => ({ Name: c.name, ResourceGroup: c.rg, Status: c.props.state, Image: c.props.image, IP: c.props.ip })), ['Name', 'ResourceGroup', 'Status', 'Image', 'IP']);
  },
  'aks create': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--name', '-n']]);
    const k = W(sim).createAks({ rg: one(p, '--resource-group')!, name: one(p, '--name')!, nodes: Number(one(p, '--node-count') ?? 3) }, 'cli');
    return out(p, { name: k.name, kubernetesVersion: k.props.version, agentPoolProfiles: [{ name: 'nodepool1', count: k.props.nodes, vmSize: 'Standard_B2s' }], provisioningState: 'Succeeded' });
  },
  'aks scale': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--name', '-n'], ['--node-count', '']]);
    const k = W(sim).scaleAks(one(p, '--resource-group')!, one(p, '--name')!, Number(one(p, '--node-count')), 'cli');
    return out(p, { name: k.name, agentPoolProfiles: [{ name: 'nodepool1', count: k.props.nodes }], provisioningState: 'Succeeded' });
  },
  'aks list': (p, sim) => {
    const l = sim.res.filter((r) => r.type === 'aks');
    return out(p, l.map((k) => ({ name: k.name, nodes: k.props.nodes })), l.map((k) => ({ Name: k.name, ResourceGroup: k.rg, Nodes: k.props.nodes, KubernetesVersion: k.props.version })), ['Name', 'ResourceGroup', 'Nodes', 'KubernetesVersion']);
  },

  /* hybrid */
  'connectedmachine list': (p, sim) => {
    const l = sim.res.filter((r) => r.type === 'arc');
    return out(p, l.map((a) => ({ name: a.name, status: a.props.status, osName: a.props.os })), l.map((a) => ({ Name: a.name, ResourceGroup: a.rg, Status: a.props.status, OS: a.props.os, Where: a.props.where })), ['Name', 'ResourceGroup', 'Status', 'OS', 'Where']);
  },
  'resource tag': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--name', '-n'], ['--tags', '']]);
    const g = one(p, '--resource-group')!, n = one(p, '--name')!;
    const r = sim.res.find((x) => x.rg.toLowerCase() === g.toLowerCase() && x.name.toLowerCase() === n.toLowerCase());
    if (!r) throw new SimError(`The Resource '${n}' under resource group '${g}' was not found.`, 'ResourceNotFound');
    W(sim).tagResource(r, tags(p), 'cli');
    return out(p, { name: r.name, type: TYPE_INFO[r.type].arm, tags: r.tags });
  },

  /* identity */
  'ad user create': (p, sim) => {
    required(p, [['--display-name', ''], ['--user-principal-name', '']]);
    const u = W(sim).createUser(one(p, '--display-name')!, one(p, '--user-principal-name')!, 'cli');
    return out(p, { displayName: u.name, userPrincipalName: u.upn, accountEnabled: true });
  },
  'ad user list': (p, sim) => {
    const rows = W(sim).users.map((u) => ({ DisplayName: u.name, UserPrincipalName: u.upn, UserType: u.guest ? 'Guest' : 'Member' }));
    return out(p, rows, rows, ['DisplayName', 'UserPrincipalName', 'UserType']);
  },
  'ad group create': (p, sim) => {
    required(p, [['--display-name', '']]);
    W(sim).createGroup(one(p, '--display-name')!, 'cli');
    return out(p, { displayName: one(p, '--display-name'), mailNickname: one(p, '--mail-nickname') ?? one(p, '--display-name'), securityEnabled: true });
  },
  'ad group list': (p, sim) => {
    const rows = W(sim).groups.map((g) => ({ DisplayName: g.name, Members: g.members.length }));
    return out(p, rows, rows, ['DisplayName', 'Members']);
  },
  'ad group member add': (p, sim) => {
    required(p, [['--group', ''], ['--member-id', '']]);
    W(sim).addMember(one(p, '--group')!, one(p, '--member-id')!, 'cli');
    return { out: '' };
  },
  'ad guest invite': (p, sim) => {
    required(p, [['--email', '']]);
    W(sim).inviteGuest(one(p, '--email')!, 'cli');
    return { out: `${SHORTCUT}\nInvitation sent to ${one(p, '--email')}. They sign in with their own company account as a guest (B2B collaboration).` };
  },
  'ad conditional-access create': (p, sim) => {
    required(p, [['--name', '-n'], ['--grant', '']]);
    const grant = (one(p, '--grant') ?? '').toLowerCase();
    if (!['mfa', 'block', 'compliant'].includes(grant)) throw new SimError("--grant must be mfa, block or compliant.");
    const loc = (one(p, '--location') ?? 'any').toLowerCase();
    W(sim).addCa({ name: one(p, '--name')!, target: one(p, '--users') ?? 'all', location: loc === 'outside-office' ? 'outside-office' : 'any', device: (one(p, '--device') ?? 'any').toLowerCase() === 'personal' ? 'personal' : 'any', grant: grant as 'mfa' }, 'cli');
    return { out: `${SHORTCUT}\nPolicy '${one(p, '--name')}' is on: IF ${one(p, '--users') ?? 'all users'} sign in${loc === 'outside-office' ? ' from outside the office' : ''} THEN ${grant === 'mfa' ? 'require MFA' : grant === 'block' ? 'block access' : 'require a compliant device'}.` };
  },
  'ad conditional-access what-if': (p, sim) => {
    required(p, [['--user', ''], ['--location', '']]);
    const loc = (one(p, '--location') ?? '').toLowerCase();
    if (!['office', 'home', 'unknown-country'].includes(loc)) throw new SimError('--location must be office, home or unknown-country.');
    const r = W(sim).whatIf(one(p, '--user')!, loc as 'office', (one(p, '--device') ?? 'company').toLowerCase() === 'personal' ? 'personal' : 'company');
    return { out: `${SHORTCUT}\nDecision: ${r.decision}${r.policies.length ? `  (policies applied: ${r.policies.join(', ')})` : '  (no policy matched)'}` };
  },
  'role assignment create': (p, sim) => {
    required(p, [['--assignee', ''], ['--role', '']]);
    const sc = scopeOf(p);
    const r = W(sim).assignRole(one(p, '--assignee')!, one(p, '--role')!, sc.startsWith('rg/') ? sc.slice(3) : undefined, 'cli');
    return out(p, { principalName: r.principal, roleDefinitionName: r.role, scope: r.scope === 'subscription' ? `/subscriptions/${SUB_ID}` : `/subscriptions/${SUB_ID}/resourceGroups/${r.scope.slice(3)}` });
  },
  'role assignment list': (p, sim) => {
    const rows = W(sim).roles.map((r) => ({ Principal: r.principal, Role: r.role, Scope: r.scope }));
    return out(p, rows, rows, ['Principal', 'Role', 'Scope']);
  },
  login: (p, sim) => {
    const u = one(p, '--username');
    if (!u) { W(sim).logout(); return { out: `Signed in as ${W(sim).current}.` }; }
    const who = W(sim).login(u);
    return { out: `Signed in as ${who.upn}. Run 'az logout' to switch back to your own account.` };
  },
  logout: (_p, sim) => { W(sim).logout(); return { out: `Signed out. You are back to ${W(sim).current}.` }; },

  /* governance */
  'account management-group create': (p, sim) => {
    required(p, [['--name', '-n']]);
    W(sim).createMg(one(p, '--name')!, one(p, '--parent') ?? 'Tenant Root Group', 'cli');
    return out(p, { name: one(p, '--name'), displayName: one(p, '--display-name') ?? one(p, '--name'), parent: one(p, '--parent') ?? 'Tenant Root Group' });
  },
  'account management-group list': (p, sim) => {
    const rows = W(sim).mgs.map((m) => ({ Name: m.name, Parent: m.parent ?? '' }));
    return out(p, rows, rows, ['Name', 'Parent']);
  },
  'account management-group subscription add': (p, sim) => {
    required(p, [['--name', '-n'], ['--subscription', '']]);
    W(sim).moveSub(one(p, '--name')!, 'cli');
    return { out: `Subscription now sits under: ${W(sim).mgChain().join(' → ')}` };
  },
  'policy definition list': (p) => {
    const rows = Object.entries(POLICY_DEFS).map(([k, d]) => ({ Name: k, DisplayName: d.display, Parameter: d.param }));
    return out(p, rows, rows, ['Name', 'DisplayName', 'Parameter']);
  },
  'policy assignment create': (p, sim) => {
    required(p, [['--name', '-n'], ['--policy', '']]);
    const params = Object.fromEntries((p.flags['--params'] ?? []).map((x) => x.split('=') as [string, string]));
    const a = W(sim).assignPolicy(one(p, '--name')!, one(p, '--policy')!, list(Object.values(params)[0]), scopeOf(p), 'cli');
    return out(p, { name: a.name, policyDefinition: POLICY_DEFS[a.def].display, scope: a.scope, parameters: { [POLICY_DEFS[a.def].param]: a.value }, enforcementMode: 'Default' });
  },
  'policy assignment list': (p, sim) => {
    const rows = W(sim).policies.map((a) => ({ Name: a.name, Policy: POLICY_DEFS[a.def].display, Scope: a.scope, Value: a.value.join(',') }));
    return out(p, rows, rows, ['Name', 'Policy', 'Scope', 'Value']);
  },
  'policy assignment delete': (p, sim) => {
    required(p, [['--name', '-n']]);
    W(sim).removePolicy(one(p, '--name')!);
    return { out: '' };
  },
  'policy state summarize': (p, sim) => {
    const rows = W(sim).compliance().map((c) => ({ Resource: c.res.name, Type: TYPE_INFO[c.res.type].label, State: c.compliant ? 'Compliant' : 'NonCompliant', Reason: c.reasons.join('; ') }));
    sim.emit('policy.summary', { rows: rows.length });
    return out(p, rows, rows, ['Resource', 'Type', 'State', 'Reason']);
  },

  /* infrastructure as code */
  'deployment group what-if': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--template-file', '']]);
    const prefix = /prefix=(\S+)/.exec((p.flags['--parameters'] ?? []).join(' '))?.[1];
    const r = W(sim).deployBicep(one(p, '--resource-group')!, prefix, true, 'cli');
    return { out: ['Resource and property changes are indicated with this symbol:', '  + Create', '', ...r.changes, '', `Resource changes: ${r.changes.length} to create. Nothing was deployed.`].join('\n') };
  },
  'deployment group create': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--template-file', '']]);
    const prefix = /prefix=(\S+)/.exec((p.flags['--parameters'] ?? []).join(' '))?.[1];
    const r = W(sim).deployBicep(one(p, '--resource-group')!, prefix, false, 'cli');
    return out(p, { name: 'main', properties: { provisioningState: 'Succeeded', mode: 'Incremental', outputResources: r.changes.map((c) => c.slice(2)) }, note: r.created ? undefined : 'Nothing changed: the resources already match the template (deployments are idempotent).' });
  },

  /* monitoring and cost */
  'monitor log-analytics workspace create': (p, sim) => {
    required(p, [['--resource-group', '-g']]);
    const name = one(p, '--workspace-name', '--name');
    if (!name) throw new SimError('the following arguments are required: --workspace-name/-n', 'MissingArgs');
    const w = W(sim).createWorkspace(one(p, '--resource-group')!, name, 'cli');
    return out(p, { name: w.name, retentionInDays: w.props.retention, sku: { name: 'PerGB2018' }, provisioningState: 'Succeeded' });
  },
  'monitor log-analytics query': (p, sim) => {
    required(p, [['--workspace', '-w'], ['--analytics-query', '']]);
    const rows = W(sim).query(one(p, '--analytics-query')!);
    const cols = rows.length ? Object.keys(rows[0]) : [];
    return rows.length ? { out: table(rows, cols) } : { out: '(no rows)' };
  },
  'monitor metrics alert create': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--name', '-n'], ['--scopes', ''], ['--condition', '']]);
    const th = Number(/>\s*(\d+)/.exec(one(p, '--condition') ?? '')?.[1]);
    const vm = (one(p, '--scopes') ?? '').split('/').pop()!;
    const a = W(sim).createAlert(one(p, '--resource-group')!, one(p, '--name')!, vm, th, 'cli');
    return out(p, { name: a.name, criteria: `avg Percentage CPU > ${th}`, scopes: [vm], severity: 2, enabled: true });
  },
  'vm run-command invoke': (p, sim) => {
    required(p, [['--resource-group', '-g'], ['--name', '-n'], ['--scripts', '']]);
    const script = one(p, '--scripts') ?? '';
    const w = W(sim);
    const busy = /stress|load|yes/i.test(script);
    const vm = w.setLoad(one(p, '--resource-group')!, one(p, '--name')!, busy ? 95 : 10);
    const fired = w.notices.find((n) => n.title.includes('Alert fired') && Date.now() - n.at < 2000);
    return { out: json({ value: [{ code: 'ProvisioningState/succeeded', message: busy ? `CPU is now ${vm.props.cpu}%.` : `Script ran. CPU is ${vm.props.cpu}%.` }] }) + (fired ? `\n🔔 ${fired.title}: ${fired.text}` : '') };
  },
  'consumption budget create': (p, sim) => {
    required(p, [['--budget-name', ''], ['--amount', '']]);
    const w = W(sim);
    w.createBudget(one(p, '--budget-name')!, Number(one(p, '--amount')), 'cli');
    const b = w.budgets.find((x) => x.name === one(p, '--budget-name'))!;
    return out(p, { name: b.name, amount: b.amount, timeGrain: one(p, '--time-grain') ?? 'Monthly', category: 'Cost', notifications: ['50%', '80%', '100%'], alreadyReached: b.fired.map((t) => `${t}%`) });
  },
  'consumption budget list': (p, sim) => {
    const rows = W(sim).budgets.map((b) => ({ Name: b.name, Amount: b.amount, Reached: b.fired.map((t) => `${t}%`).join(' ') }));
    return out(p, rows, rows, ['Name', 'Amount', 'Reached']);
  },
  'advisor recommendation list': (p, sim) => {
    const recs = W(sim).advisor();
    sim.emit('advisor.list', { count: recs.length });
    const rows = recs.map((r) => ({ Category: r.category, Impact: r.impact, Recommendation: r.text }));
    return out(p, recs, rows, ['Category', 'Impact', 'Recommendation']);
  },

  /* migration (practice shortcuts) */
  'migrate discover': (_p, sim) => {
    W(sim).discover();
    return { out: `${SHORTCUT}\nThe Azure Migrate appliance found ${ONPREM_SERVERS.length} servers:\n` + table(ONPREM_SERVERS.map((s) => ({ Name: s.name, OS: s.os, Cores: s.cpu, RAMGB: s.ram, AvgCPU: `${s.util}%` })), ['Name', 'OS', 'Cores', 'RAMGB', 'AvgCPU']) };
  },
  'migrate assess': (_p, sim) => {
    W(sim).assess();
    return { out: `${SHORTCUT}\nAssessment ready: every server is Ready for Azure.\n` + table(ONPREM_SERVERS.map((s) => ({ Name: s.name, RecommendedSize: s.size, Readiness: 'Ready' })), ['Name', 'RecommendedSize', 'Readiness']) };
  },
  'migrate server': (p, sim) => {
    required(p, [['--name', '-n'], ['--resource-group', '-g']]);
    W(sim).migrateServer(one(p, '--name')!, one(p, '--resource-group')!);
    return { out: `${SHORTCUT}\n${one(p, '--name')} was replicated and is now running as an Azure VM in ${one(p, '--resource-group')}.` };
  },
  'databox job create': (p, sim) => {
    required(p, [['--name', '-n'], ['--size-tb', '']]);
    W(sim).orderDataBox(one(p, '--name')!, Number(one(p, '--size-tb')));
    const tb = Number(one(p, '--size-tb'));
    return { out: `${SHORTCUT}\nOrdered ${tb <= 7 ? 'a Data Box Disk' : tb <= 80 ? 'a Data Box' : 'a Data Box Heavy'} for ${tb} TB. Status: ${DATABOX_STEPS[0]}.` };
  },
  'databox job advance': (p, sim) => {
    required(p, [['--name', '-n']]);
    W(sim).advanceDataBox(one(p, '--name')!);
    const o = W(sim).databox.find((d) => d.name === one(p, '--name'))!;
    return { out: `${SHORTCUT}\nStep ${o.step}/5: ${DATABOX_STEPS[o.step]}` };
  },
  'databox job list': (p, sim) => {
    const rows = W(sim).databox.map((d) => ({ Name: d.name, TB: d.tb, Status: DATABOX_STEPS[d.step] }));
    return out(p, rows, rows, ['Name', 'TB', 'Status']);
  },
} satisfies Record<string, Handler>);

/** Shell commands outside `az` that the practice world understands. */
function shellExtra(tokens: string[], sim: Sim): CliResult | null {
  if (!(sim instanceof World)) return null;
  const dv = D.shell(tokens, sim);
  if (dv) return dv;
  const ai = F.shell(tokens, sim);
  if (ai) return ai;
  const [cmd, ...rest] = tokens;
  const c = cmd.toLowerCase();
  if (c === 'nslookup') {
    if (!rest[0]) return { error: 'Usage: nslookup <host name>' };
    const r = sim.resolve(rest[0]);
    return r ? { out: `Server:  ${r.server}\n\nName:    ${rest[0]}\nAddress: ${r.ip}${'private' in r && r.private ? '   (private IP from your private endpoint)' : ''}` } : { error: `** server can't find ${rest[0]}: NXDOMAIN` };
  }
  if (c === 'cat' && /main\.bicep$/i.test(rest[0] ?? '')) { sim.emit('bicep.view', {}); return { out: BICEP_FILE }; }
  if (c === 'ls') return { out: 'main.bicep' };
  if (c === 'azcmagent') {
    const p = parse(rest);
    if (p.words[0] !== 'connect') return { error: "Try: azcmagent connect --resource-group rg-hybrid --location westeurope --resource-name web-srv-01" };
    try {
      required(p, [['--resource-group', ''], ['--resource-name', '']]);
      const name = one(p, '--resource-name')!;
      const os = ONPREM_SERVERS.find((s) => s.name === name)?.os;
      const a = sim.connectArc(one(p, '--resource-group')!, name, os, 'cli');
      return { out: `INFO  Connecting machine to Azure... This might take a few minutes.\nINFO  Connected machine to Azure\nINFO  Machine overview page: Azure Arc > Servers > ${a.name}\n(This command runs on the on-premises server itself, not in Cloud Shell. Here we pretend you're signed in to ${a.name}.)` };
    } catch (e) {
      if (e instanceof SimError) return { error: e.message };
      throw e;
    }
  }
  return null;
}

// AI-200 developer services: add their help groups (merging into groups that already exist, such as aks).
for (const [k, list] of Object.entries(D.DEV_GROUPS)) GROUPS[k] = [...(GROUPS[k] ?? []), ...list.filter(([c]) => !(GROUPS[k] ?? []).some(([x]) => x === c))];
const KNOWN = [...Object.keys(C), ...D.DEV_COMMANDS];
function lev(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
function suggest(path: string): string {
  const score = (a: string, b: string) => {
    const A = a.split(' '), B = b.split(' ');
    return B.reduce((s, w, i) => s + (A[i] === w ? 1 : A[i] && lev(A[i], w) <= 2 ? 0.8 : 0), 0) - Math.abs(B.length - A.length) * 0.2;
  };
  const best = KNOWN.map((k) => [k, score(path, k)] as const).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? `\nDid you mean 'az ${best[0]}'?` : '';
}

/** Run one command line and return what the terminal should print. `a && b` runs b only if a worked, like bash. */
export function runCli(line: string, sim: Sim): CliResult {
  const parts = line.split(/\s+&&\s+/).filter((x) => x.trim());
  if (parts.length < 2) return runOne(line, sim);
  const outs: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const r = runOne(parts[i], sim);
    if (r.clear) continue;
    if (r.confirm) {
      // Ask first; after a yes, carry on with the rest of the chain.
      const { question, then } = r.confirm;
      const rest = parts.slice(i + 1).join(' && ');
      return { out: outs.join('\n') || undefined, confirm: { question, then: () => { const a = then(); if (a.error || !rest) return a; const b = runCli(rest, sim); return { ...b, out: [a.out, b.out].filter(Boolean).join('\n') || undefined }; } } };
    }
    if (r.error) return { ...r, error: [...outs, r.error].join('\n') };
    if (r.out) outs.push(r.out);
  }
  return { out: outs.join('\n') };
}

/** Bash-style command substitution: `$(az … --query id -o tsv)` runs first and its output replaces it. */
function substitute(line: string, sim: Sim): { line: string; error?: string } {
  let err: string | undefined;
  const next = line.replace(/\$\(([^()]*)\)/g, (_m, inner: string) => {
    if (err) return '';
    const r = runOne(inner, sim);
    if (r.error) { err = r.error; return ''; }
    const v = (r.out ?? '').trim();
    return /\s/.test(v) ? `"${v}"` : v;
  });
  return { line: next, error: err };
}

function runOne(line: string, sim: Sim): CliResult {
  if (line.includes('$(')) {
    const s = substitute(line, sim);
    if (s.error) return { error: s.error };
    line = s.line;
  }
  const tokens = tokenize(line.trim());
  if (!tokens.length) return { out: '' };
  const first = tokens[0].toLowerCase();
  if (first === 'clear' || first === 'cls') return { clear: true };
  if (first === 'help') return { out: helpFor('') };
  if (first !== 'az') {
    const extra = shellExtra(tokens, sim);
    if (extra) return extra;
    if (/^(ls|pwd|cd|echo|whoami|dir)$/.test(first)) return { out: first === 'whoami' ? 'learner' : first === 'pwd' ? '/home/learner' : '' };
    return { error: `bash: ${tokens[0]}: command not found. This practice shell understands Azure CLI commands that start with 'az'. Type 'help'.` };
  }
  if (sim instanceof World) {
    const dv = D.az(tokens.slice(1), sim);
    if (dv) return dv;
  }
  const p = parse(tokens.slice(1));
  if (!p.words.length || (p.words[0] === 'help')) return { out: helpFor('') };
  if (has(p, '--version')) return { out: 'azure-cli (simulated) 2.x — practice mode' };
  // Match the longest known command path.
  let path = '';
  for (let n = Math.min(5, p.words.length); n > 0; n--) {
    const cand = p.words.slice(0, n).join(' ');
    if (C[cand] || GROUPS[cand]) { path = cand; break; }
  }
  if (has(p, '--help')) return { out: helpFor(GROUPS[path] ? path : p.words.slice(0, -1).join(' ') || path) };
  if (!path) return { error: `'${p.words[0]}' is misspelled or not recognized by the system.${suggest(p.words.join(' '))}\nType 'az --help' to see what you can try.` };
  if (GROUPS[path] && !C[path]) {
    const extra = p.words.slice(path.split(' ').length);
    if (extra.length) return { error: `'${extra[0]}' is misspelled or not recognized by the system.${suggest(p.words.join(' '))}` };
    return { out: helpFor(path) };
  }
  try {
    sim.emit('cli', { command: `az ${p.words.join(' ')}`, path, line });
    return C[path](p, sim);
  } catch (e) {
    if (e instanceof SimError) {
      const fix = e.code === 'MissingArgs' ? `\nTry 'az ${path} --help' for examples.` : '';
      return { error: `${e.code === 'MissingArgs' ? '' : `(${e.code}) `}${e.message}${fix}` };
    }
    throw e;
  }
}

/** Known command prefixes for Tab completion. */
export const COMPLETIONS = [...KNOWN.map((k) => `az ${k}`), ...D.SHELL_COMPLETIONS];
