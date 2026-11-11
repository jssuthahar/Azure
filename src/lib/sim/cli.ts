/**
 * Simulated Azure CLI ("az") for the practice Cloud Shell. Supports the
 * commands AZ-900 learners meet, with real-looking output and errors.
 */
import { Sim, SimError, SUB_ID, SUB_NAME, REGIONS, VM_SIZES, IMAGES, TYPE_INFO, type Res } from './engine';

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

const ALIAS: Record<string, string> = { '-n': '--name', '-g': '--resource-group', '-l': '--location', '-o': '--output', '-y': '--yes', '-h': '--help', '-p': '--plan', '-t': '--lock-type', '-r': '--runtime' };

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
};
function helpFor(path: string): string {
  if (!path)
    return [
      'Welcome to the simulated Azure CLI! 🎉 (Practice only, nothing here touches real Azure.)',
      '',
      'Use `az [group] [subgroup] [command] [args]`. Groups you can try:',
      ...Object.keys(GROUPS).map((g) => `    ${g.padEnd(18)}`),
      '',
      'Examples:',
      '    az group create --name rg-learn --location westeurope',
      '    az vm create -g rg-learn -n web01 --image Ubuntu2204 --size Standard_B1s',
      '    az group list -o table',
      '',
      'Add --help to any group, e.g. `az vm --help`. Type `clear` to clear the screen.',
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
  'account show': (p) => out(p, { id: SUB_ID, name: SUB_NAME, isDefault: true, state: 'Enabled', tenantId: '11111111-2222-3333-4444-555555555555', user: { name: 'learner@example.com', type: 'user' } }),
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
    required(p, [['--name', '-n'], ['--resource-group', '-g'], ['--sku', '']]);
    const s = sim.updateStorageSku(one(p, '--resource-group')!, one(p, '--name')!, one(p, '--sku')!, 'cli');
    return out(p, { name: s.name, sku: { name: s.props.sku }, provisioningState: 'Succeeded' });
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

const KNOWN = Object.keys(C);
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

/** Run one command line and return what the terminal should print. */
export function runCli(line: string, sim: Sim): CliResult {
  const tokens = tokenize(line.trim());
  if (!tokens.length) return { out: '' };
  const first = tokens[0].toLowerCase();
  if (first === 'clear' || first === 'cls') return { clear: true };
  if (first === 'help') return { out: helpFor('') };
  if (first !== 'az') {
    if (/^(ls|pwd|cd|echo|whoami|dir)$/.test(first)) return { out: first === 'whoami' ? 'learner' : first === 'pwd' ? '/home/learner' : '' };
    return { error: `bash: ${tokens[0]}: command not found. This practice shell understands Azure CLI commands that start with 'az'. Type 'help'.` };
  }
  const p = parse(tokens.slice(1));
  if (!p.words.length || (p.words[0] === 'help')) return { out: helpFor('') };
  if (has(p, '--version')) return { out: 'azure-cli (simulated) 2.x — practice mode' };
  // Match the longest known command path.
  let path = '';
  for (let n = Math.min(3, p.words.length); n > 0; n--) {
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
export const COMPLETIONS = KNOWN.map((k) => `az ${k}`);
