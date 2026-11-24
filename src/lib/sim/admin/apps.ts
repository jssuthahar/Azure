/**
 * AZ-104 "apps" Cloud Shell commands (EDUCATION ONLY): the administrator side
 * of Azure Container Registry, Container Instances, Container Apps and App
 * Service. Plan tiers decide what works, just like in Azure:
 *   Free F1: 1 instance, no custom domain, no TLS binding, no backup
 *   Basic B1: up to 3 instances (manual), custom domains, TLS, backup, VNet integration
 *   Standard S1: up to 10 instances, autoscale rules, 5 deployment slots
 *   Premium v3 P1v3: up to 30 instances, 20 deployment slots
 * Commands and flags follow Microsoft Learn; output is simplified.
 * Base commands this builds on: az appservice plan create, az webapp create
 * (cli.ts), az acr create/import, az containerapp env create/create/update
 * (devsvc.ts). Every state change emits an `adm.*` event for lab checks.
 */
import { az as devAz } from '../devsvc';
import {
  run, parse, one, has, many, req, lc, out, json, hex, now, adm, SimError,
  type Cmd, type Handler, type Parsed, type World, type Res, type AdminOut,
} from './kit';

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
const RG: [string, string] = ['--resource-group', '-g'];
const NM: [string, string] = ['--name', '-n'];
const rgOf = (p: Parsed) => one(p, '--resource-group')!;

type Tier = 'Free' | 'Basic' | 'Standard' | 'PremiumV3';
const TIERS: Record<string, { tier: Tier; workers: number; slots: number; rank: number }> = {
  F1: { tier: 'Free', workers: 1, slots: 0, rank: 0 },
  B1: { tier: 'Basic', workers: 3, slots: 0, rank: 1 },
  S1: { tier: 'Standard', workers: 10, slots: 5, rank: 2 },
  P1v3: { tier: 'PremiumV3', workers: 30, slots: 20, rank: 3 },
};
const skuKey = (s?: string) => Object.keys(TIERS).find((k) => lc(k) === lc(s));
const tierOf = (plan: Res) => TIERS[skuKey(plan.props.sku) ?? 'B1'];
const planOfApp = (w: World, app: Res) => w.find('plan', app.rg, app.props.plan)!;
const needApp = (w: World, rg: string | undefined, name: string | undefined) => w.need('webapp', rg ?? '', name ?? '');
const appFrom = (p: Parsed, w: World) => needApp(w, rgOf(p), one(p, '--webapp-name', '--name'));

/** Per-app admin state kept on the web app's props. */
interface Slot { settings: Record<string, string>; version: string }
interface AppAdm {
  hostnames: string[]; certs: { hostname: string; thumbprint: string; bound: boolean; sslType?: string }[];
  httpsOnly: boolean; minTls: string; backups: { name: string; at: string; storage: string; size: string }[];
  schedule: { frequency: string; retention: number; keepOne: boolean } | null;
  vnet: { vnet: string; subnet: string } | null;
  rules: { name: string; action: string; priority: number; source: string }[];
  slots: Record<string, Slot>; sticky: string[]; version: string; routing: Record<string, number>;
}
function aa(app: Res): AppAdm {
  return (app.props.adm ??= {
    hostnames: [], certs: [], httpsOnly: false, minTls: '1.2', backups: [], schedule: null, vnet: null, rules: [],
    slots: {}, sticky: [], version: 'v1', routing: {},
  } as AppAdm);
}
const settingsOf = (app: Res) => (app.props.settings ??= {}) as Record<string, string>;

/** Stable fake hash so a learner sees the same verification ID every time. */
function hashHex(s: string, n: number) {
  let h = 2166136261;
  let outS = '';
  while (outS.length < n) {
    for (const c of s + outS.length) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
    outS += h.toString(16).padStart(8, '0');
  }
  return outS.slice(0, n).toUpperCase();
}
const verificationId = (app: Res) => hashHex(`asuid:${app.id}`, 64);

/** Only the most useful `--query` values; anything else falls back to JSON. */
function queried(p: Parsed, value: Record<string, unknown>): AdminOut {
  const q = one(p, '--query');
  if (q && q in value) {
    const v = value[q];
    return { out: lc(one(p, '--output')) === 'tsv' || typeof v !== 'object' ? String(v) : json(v) };
  }
  return out(p, value);
}

function needTier(w: World, plan: Res, min: Tier, what: string, ev: string, data: Record<string, unknown>) {
  const t = tierOf(plan);
  const minRank = Object.values(TIERS).find((x) => x.tier === min)!.rank;
  if (t.rank >= minRank) return;
  w.emit(ev, { ...data, ok: false, reason: 'tier', sku: plan.props.sku });
  throw new SimError(`The ${t.tier} (${plan.props.sku}) tier of App Service plan '${plan.name}' doesn't include ${what}. Scale up to ${min === 'Basic' ? 'Basic (B1)' : min === 'Standard' ? 'Standard (S1)' : 'Premium v3'} or higher first: az appservice plan update -g ${plan.rg} -n ${plan.name} --sku ${min === 'Basic' ? 'B1' : min === 'Standard' ? 'S1' : 'P1V3'}`, 'SkuNotSupported');
}

/* ------------------------------------------------------------------ */
/* App Service plans: scale up, scale out, autoscale                   */
/* ------------------------------------------------------------------ */
const planUpdate: Handler = (p, w) => {
  req(p, [RG, NM]);
  const plan = w.need('plan', rgOf(p), one(p, '--name')!);
  w.assertWritable(plan.rg, 'update App Service plan');
  const want = one(p, '--sku');
  const key = want ? skuKey(want) : skuKey(plan.props.sku);
  if (!key) throw new SimError(`SKU '${want}' isn't in this practice simulator. Try F1, B1, S1 or P1V3 (each stands for its whole tier).`, 'InvalidSku');
  const t = TIERS[key];
  const workers = has(p, '--number-of-workers') ? Number(one(p, '--number-of-workers')) : Math.min(Number(plan.props.workers ?? 1), t.workers);
  const apps = w.res.filter((r) => r.type === 'webapp' && r.rg === plan.rg && r.props.plan === plan.name);
  const slots = apps.reduce((n, a) => n + Object.keys(aa(a).slots).length, 0);
  if (slots > t.slots) {
    w.emit('adm.app.plan', { plan: plan.name, sku: key, workers, ok: false, reason: 'slots' });
    throw new SimError(`Can't scale '${plan.name}' to ${t.tier}: its apps have ${slots} deployment slot(s) and ${t.tier} allows ${t.slots}. Delete the slots first.`, 'Conflict');
  }
  if (!Number.isInteger(workers) || workers < 1 || workers > t.workers) {
    w.emit('adm.app.plan', { plan: plan.name, sku: key, workers, ok: false, reason: 'workers' });
    throw new SimError(`The ${t.tier} tier allows 1 to ${t.workers} instance(s); you asked for ${one(p, '--number-of-workers')}. ${t.rank < 2 ? 'Scale up to Standard or Premium for more instances and autoscale.' : ''}`.trim(), 'InvalidWorkerCount');
  }
  const fromSku = plan.props.sku, fromWorkers = Number(plan.props.workers ?? 1);
  plan.props.sku = key;
  plan.props.workers = workers;
  if (fromSku !== key) w.emit('plan.scale', { rg: plan.rg, name: plan.name, sku: key, via: 'cli' });
  w.emit('adm.app.plan', { plan: plan.name, rg: plan.rg, sku: key, tier: t.tier, workers, fromSku, fromWorkers, ok: true, up: fromSku !== key, out: workers !== fromWorkers });
  return out(p, { name: plan.name, sku: { name: key, tier: t.tier, capacity: workers }, numberOfWorkers: workers, maximumNumberOfWorkers: t.workers, numberOfSites: apps.length, provisioningState: 'Succeeded' });
};
const planShow: Handler = (p, w) => {
  req(p, [RG, NM]);
  const plan = w.need('plan', rgOf(p), one(p, '--name')!);
  const t = tierOf(plan);
  return out(p, { name: plan.name, location: plan.location, sku: { name: plan.props.sku, tier: t.tier, capacity: Number(plan.props.workers ?? 1) }, maximumNumberOfWorkers: t.workers, kind: 'linux', reserved: true });
};

interface Autoscale { name: string; rg: string; plan: string; min: number; max: number; count: number; rules: { metric: string; op: string; threshold: number; direction: string; by: number; window: string }[] }
const scales = (w: World) => ((adm(w).appAutoscale ??= {}) as Record<string, Autoscale>);
const planFromResource = (w: World, rg: string, ref: string) => {
  const name = ref.includes('/') ? ref.split('/').filter(Boolean).at(-1)! : ref;
  const prg = ref.match(/resourceGroups\/([^/]+)/i)?.[1] ?? rg;
  return w.need('plan', prg, name);
};
const isPlanAutoscale = (p: Parsed) => /serverfarms/i.test(one(p, '--resource-type') ?? '') || /\/serverfarms\//i.test(one(p, '--resource') ?? '');

const autoscaleCreate: Cmd = {
  when: isPlanAutoscale,
  run: (p, w) => {
    req(p, [RG, ['--resource', ''], ['--count', '']]);
    const plan = planFromResource(w, rgOf(p), one(p, '--resource')!);
    const name = one(p, '--name') ?? `${plan.name}-autoscale`;
    w.assertWritable(rgOf(p), 'create autoscale setting');
    const min = Number(one(p, '--min-count') ?? one(p, '--count')), max = Number(one(p, '--max-count') ?? one(p, '--count')), count = Number(one(p, '--count'));
    needTier(w, plan, 'Standard', 'autoscale (rules-based scale out)', 'adm.app.autoscale', { name, plan: plan.name });
    const t = tierOf(plan);
    if (!(min <= count && count <= max) || max > t.workers || min < 1) {
      w.emit('adm.app.autoscale', { name, plan: plan.name, ok: false, reason: 'limits', min, max, count });
      throw new SimError(`Instance limits must satisfy 1 <= minimum <= default <= maximum <= ${t.workers} (the ${t.tier} tier maximum). You gave min ${min}, default ${count}, max ${max}.`, 'InvalidLimits');
    }
    scales(w)[lc(name)] = { name, rg: rgOf(p), plan: plan.name, min, max, count, rules: [] };
    plan.props.workers = Math.max(count, Math.min(Number(plan.props.workers ?? 1), max));
    w.emit('adm.app.autoscale', { name, plan: plan.name, rg: rgOf(p), ok: true, min, max, count });
    return out(p, { name, location: plan.location, enabled: true, targetResourceUri: plan.id, profiles: [{ name: 'default', capacity: { minimum: String(min), maximum: String(max), default: String(count) }, rules: [] }], note: 'An autoscale setting with no rules keeps the default count. Add a scale-out and a scale-in rule with az monitor autoscale rule create.' });
  },
};
const autoscaleRule: Cmd = {
  when: (p) => !!one(p, '--autoscale-name'),
  run: (p, w) => {
    req(p, [RG, ['--autoscale-name', ''], ['--condition', '']]);
    const s = scales(w)[lc(one(p, '--autoscale-name'))];
    if (!s) throw new SimError(`Autoscale setting '${one(p, '--autoscale-name')}' was not found in '${rgOf(p)}'. Create it with az monitor autoscale create --resource-type Microsoft.Web/serverfarms.`, 'ResourceNotFound');
    w.assertWritable(s.rg, 'update autoscale setting');
    const cond = one(p, '--condition')!;
    const m = cond.match(/^\s*([A-Za-z][\w ]*?)\s*(>=|<=|>|<|==)\s*([\d.]+)\s+avg\s+(\d+[mh])\s*$/i);
    if (!m) throw new SimError(`Couldn't read the condition "${cond}". Use the form "CpuPercentage > 70 avg 10m".`, 'InvalidCondition');
    const metric = m[1].replace(/\s+/g, '');
    if (!['cpupercentage', 'memorypercentage', 'httpqueuelength', 'diskqueuelength', 'bytesreceived', 'bytessent'].includes(lc(metric)))
      throw new SimError(`'${metric}' isn't an App Service plan metric. Try CpuPercentage, MemoryPercentage or HttpQueueLength.`, 'InvalidMetric');
    const sc = many(p, '--scale');
    const direction = lc(sc[0]), by = Number(sc[1] ?? 1);
    if (!['out', 'in', 'to'].includes(direction)) throw new SimError('--scale must be "out <n>", "in <n>" or "to <n>".', 'MissingArgs');
    const rule = { metric, op: m[2], threshold: Number(m[3]), direction, by, window: m[4] };
    s.rules.push(rule);
    w.emit('adm.app.autoscale.rule', { autoscale: s.name, plan: s.plan, ...rule });
    const pairNote = s.rules.some((r) => r.direction === 'out') && !s.rules.some((r) => r.direction === 'in')
      ? '\nTip: add a matching scale-in rule (for example CpuPercentage < 30 avg 10m, scale in 1), or the plan never shrinks back.' : '';
    return { out: json({ metricTrigger: { metricName: metric, operator: m[2], threshold: Number(m[3]), timeAggregation: 'Average', timeWindow: `PT${m[4].toUpperCase()}` }, scaleAction: { direction: direction === 'out' ? 'Increase' : direction === 'in' ? 'Decrease' : 'Exact', type: 'ChangeCount', value: String(by), cooldown: 'PT5M' } }) + pairNote };
  },
};

/* ------------------------------------------------------------------ */
/* Web app: show, update, TLS, custom domains                          */
/* ------------------------------------------------------------------ */
const webappShow: Handler = (p, w) => {
  req(p, [RG, NM]);
  const app = needApp(w, rgOf(p), one(p, '--name'));
  const a = aa(app);
  return queried(p, { name: app.name, state: app.props.state ?? 'Running', defaultHostName: app.props.host, customDomainVerificationId: verificationId(app), httpsOnly: a.httpsOnly, hostNames: [app.props.host, ...a.hostnames], serverFarmId: planOfApp(w, app)?.id, outboundIpAddresses: '20.119.0.12,20.119.0.13,20.119.0.14' });
};
const webappUpdate: Handler = (p, w) => {
  req(p, [RG, NM]);
  const app = needApp(w, rgOf(p), one(p, '--name'));
  w.assertWritable(app.rg, 'update web app');
  const a = aa(app);
  if (!has(p, '--https-only')) return { out: 'Nothing to update. Try --https-only true.' };
  a.httpsOnly = !/^(false|0|no)$/i.test(one(p, '--https-only') ?? 'true');
  w.emit('adm.app.https', { app: app.name, httpsOnly: a.httpsOnly });
  return out(p, { name: app.name, httpsOnly: a.httpsOnly, note: a.httpsOnly ? `http://${app.props.host} now redirects (301) to https://.` : 'HTTP requests are served without redirecting to HTTPS.' });
};
const configSet: Cmd = {
  when: (p) => has(p, '--min-tls-version') || has(p, '--always-on') || has(p, '--ftps-state') || has(p, '--http20-enabled'),
  run: (p, w) => {
    req(p, [RG, NM]);
    const app = needApp(w, rgOf(p), one(p, '--name'));
    w.assertWritable(app.rg, 'update web app configuration');
    const a = aa(app);
    if (has(p, '--min-tls-version')) {
      const v = one(p, '--min-tls-version')!;
      if (!['1.0', '1.1', '1.2', '1.3'].includes(v)) throw new SimError(`--min-tls-version must be 1.0, 1.1, 1.2 or 1.3 (default 1.2).`, 'InvalidValue');
      a.minTls = v;
      w.emit('adm.app.tls', { app: app.name, minTls: v });
    }
    if (has(p, '--always-on')) { app.props.alwaysOn = !/^(false|0)$/i.test(one(p, '--always-on') ?? 'true'); w.emit('adm.app.config', { app: app.name, alwaysOn: app.props.alwaysOn }); }
    if (has(p, '--ftps-state')) { app.props.ftps = one(p, '--ftps-state'); w.emit('adm.app.config', { app: app.name, ftpsState: app.props.ftps }); }
    return out(p, { name: app.name, minTlsVersion: a.minTls, alwaysOn: !!app.props.alwaysOn, ftpsState: app.props.ftps ?? 'FtpsOnly', http20Enabled: true });
  },
};

/** DNS records an App Service custom domain needs. Claimed narrowly so the network area keeps the rest. */
function zoneFor(w: World, host: string) {
  const h = lc(host).replace(/\.$/, '');
  const z = w.res.filter((r) => r.type === 'dnszone' && (h === lc(r.name) || h.endsWith('.' + lc(r.name)))).sort((x, y) => y.name.length - x.name.length)[0];
  if (!z) return null;
  return { z, label: h === lc(z.name) ? '@' : h.slice(0, -z.name.length - 1) };
}
type Rec = { name: string; type: string; value: string };
const txtAsuid: Cmd = {
  extra: { '-z': '--zone-name' },
  when: (p) => /^asuid(\.|$)/i.test(one(p, '--record-set-name', '--name') ?? ''),
  run: (p, w) => {
    req(p, [RG, ['--zone-name', '-z'], ['--value', '-v']]);
    const name = one(p, '--record-set-name', '--name')!;
    const z = w.need('dnszone', rgOf(p), one(p, '--zone-name')!);
    w.assertWritable(z.rg, 'update DNS zone');
    const value = many(p, '--value').join('');
    (z.props.records as Rec[]).push({ name: lc(name), type: 'TXT', value });
    w.emit('dns.record', { zone: z.name, name, type: 'TXT', value, via: 'cli' });
    w.emit('adm.app.dns', { zone: z.name, name, type: 'TXT', value });
    return out(p, { name, type: 'Microsoft.Network/dnszones/TXT', TTL: 3600, TXTRecords: [{ value: [value] }], fqdn: `${name}.${z.name}.` });
  },
};
const cnameToApp: Cmd = {
  extra: { '-z': '--zone-name', '-c': '--cname' },
  when: (p) => /\.azurewebsites\.net\.?$/i.test(one(p, '--cname') ?? ''),
  run: (p, w) => {
    req(p, [RG, ['--zone-name', '-z'], ['--cname', '-c']]);
    const name = one(p, '--record-set-name', '--name');
    if (!name) throw new SimError('the following arguments are required: --record-set-name/-n', 'MissingArgs');
    const z = w.need('dnszone', rgOf(p), one(p, '--zone-name')!);
    w.assertWritable(z.rg, 'update DNS zone');
    if (name === '@') throw new SimError('A CNAME record can\'t sit at the zone apex (@). For the root domain, add an A record to the app\'s IP plus the asuid TXT record.', 'BadRequest');
    const value = lc(one(p, '--cname')!).replace(/\.$/, '');
    const recs = z.props.records as Rec[];
    z.props.records = recs.filter((r) => !(r.type === 'CNAME' && r.name === lc(name)));
    (z.props.records as Rec[]).push({ name: lc(name), type: 'CNAME', value });
    w.emit('dns.record', { zone: z.name, name, type: 'CNAME', value, via: 'cli' });
    w.emit('adm.app.dns', { zone: z.name, name, type: 'CNAME', value });
    return out(p, { name, type: 'Microsoft.Network/dnszones/CNAME', TTL: 3600, CNAMERecord: { cname: value }, fqdn: `${name}.${z.name}.` });
  },
};

const hostnameAdd: Cmd = {
  run: (p, w) => {
    req(p, [RG, ['--webapp-name', ''], ['--hostname', '']]);
    const app = appFrom(p, w);
    const host = lc(one(p, '--hostname')!).replace(/\.$/, '');
    w.assertWritable(app.rg, 'add custom domain');
    const plan = planOfApp(w, app);
    needTier(w, plan, 'Basic', 'custom domains', 'adm.app.hostname', { app: app.name, hostname: host });
    const fail = (reason: string, msg: string) => { w.emit('adm.app.hostname', { app: app.name, hostname: host, ok: false, reason }); throw new SimError(msg, 'BadRequest'); };
    const zl = zoneFor(w, host);
    if (!zl) fail('nozone', `A TXT record pointing from asuid.${host.split('.')[0]} to ${verificationId(app).slice(0, 12)}… was not found. This simulator checks records in Azure DNS zones; create the zone first (az network dns zone create).`);
    const { z, label } = zl!;
    const recs = z.props.records as Rec[];
    const txtName = label === '@' ? 'asuid' : `asuid.${label}`;
    const txt = recs.find((r) => r.type === 'TXT' && r.name === txtName);
    if (!txt) fail('txt', `Custom domain verification failed. Add a TXT record named ${txtName} in zone ${z.name} with the value of the app's customDomainVerificationId:\n  az webapp show -g ${app.rg} -n ${app.name} --query customDomainVerificationId -o tsv`);
    if (lc(txt!.value) !== lc(verificationId(app))) fail('txtvalue', `The TXT record ${txtName} exists, but its value doesn't match this app's customDomainVerificationId. Copy it exactly from az webapp show.`);
    if (label === '@') {
      if (!recs.some((r) => r.type === 'A' && r.name === '@')) fail('a', `The root domain ${host} needs an A record (@) pointing to the app's inbound IP address.`);
    } else {
      const cname = recs.find((r) => r.type === 'CNAME' && r.name === label);
      if (!cname) fail('cname', `No CNAME record found for ${host}. Add one named ${label} that points to ${app.props.host}.`);
      if (lc(cname!.value) !== lc(app.props.host)) fail('cnamevalue', `${host} is a CNAME to ${cname!.value}, not to ${app.props.host}.`);
    }
    const a = aa(app);
    if (!a.hostnames.includes(host)) a.hostnames.push(host);
    w.emit('adm.app.hostname', { app: app.name, hostname: host, ok: true, record: label === '@' ? 'A' : 'CNAME' });
    return out(p, [{ name: host, hostNameType: 'Verified', sslState: 'Disabled', siteName: app.name, note: 'The domain works over HTTP now. Browsers will warn on HTTPS until you bind a certificate.' }]);
  },
};
const hostnameList: Handler = (p, w) => {
  const app = appFrom(p, w);
  const a = aa(app);
  const rows = [app.props.host, ...a.hostnames].map((h) => ({ Name: h, SslState: a.certs.find((c) => c.hostname === h && c.bound) ? 'SniEnabled' : h === app.props.host ? 'Enabled (*.azurewebsites.net)' : 'Disabled' }));
  return out(p, rows, rows, ['Name', 'SslState']);
};

const sslCreate: Handler = (p, w) => {
  req(p, [RG, NM, ['--hostname', '']]);
  const app = needApp(w, rgOf(p), one(p, '--name'));
  const host = lc(one(p, '--hostname')!);
  w.assertWritable(app.rg, 'create managed certificate');
  needTier(w, planOfApp(w, app), 'Basic', 'App Service managed certificates', 'adm.app.cert', { app: app.name, hostname: host });
  const a = aa(app);
  if (host.startsWith('*.')) { w.emit('adm.app.cert', { app: app.name, hostname: host, ok: false, reason: 'wildcard' }); throw new SimError('App Service managed certificates don\'t support wildcard names. Buy an App Service certificate or import one from Key Vault.', 'BadRequest'); }
  if (!a.hostnames.includes(host)) { w.emit('adm.app.cert', { app: app.name, hostname: host, ok: false, reason: 'hostname' }); throw new SimError(`'${host}' isn't a verified custom domain on ${app.name}. Add it first with az webapp config hostname add.`, 'BadRequest'); }
  let c = a.certs.find((x) => x.hostname === host);
  if (!c) { c = { hostname: host, thumbprint: hashHex(`cert:${app.id}:${host}`, 40), bound: false }; a.certs.push(c); }
  w.emit('adm.app.cert', { app: app.name, hostname: host, ok: true, managed: true, thumbprint: c.thumbprint });
  return out(p, { name: host, subjectName: host, issuer: 'Microsoft Azure RSA TLS Issuing CA (simulated)', thumbprint: c.thumbprint, expirationDate: '2027-05-24T00:00:00Z', canonicalName: host, keyVaultId: null, note: 'Free, renews itself about every six months, and can\'t be exported.' });
};
const sslShow: Handler = (p, w) => {
  req(p, [RG, ['--certificate-name', '']]);
  const name = lc(one(p, '--certificate-name')!);
  const app = w.res.find((r) => r.type === 'webapp' && lc(r.rg) === lc(rgOf(p)) && aa(r).certs.some((c) => c.hostname === name));
  if (!app) throw new SimError(`Certificate '${name}' was not found in resource group '${rgOf(p)}'. Create it with az webapp config ssl create.`, 'ResourceNotFound');
  const c = aa(app).certs.find((x) => x.hostname === name)!;
  return queried(p, { name, thumbprint: c.thumbprint, subjectName: name, hostNames: [name], issuer: 'Microsoft Azure RSA TLS Issuing CA (simulated)' });
};
const sslList: Handler = (p, w) => {
  const certs = w.res.filter((r) => r.type === 'webapp' && lc(r.rg) === lc(rgOf(p))).flatMap((r) => aa(r).certs.map((c) => ({ Name: c.hostname, Thumbprint: c.thumbprint, App: r.name, Bound: c.bound ? 'Yes' : 'No' })));
  return out(p, certs, certs, ['Name', 'Thumbprint', 'App', 'Bound']);
};
const sslBind: Handler = (p, w) => {
  req(p, [RG, NM, ['--certificate-thumbprint', ''], ['--ssl-type', '']]);
  const app = needApp(w, rgOf(p), one(p, '--name'));
  w.assertWritable(app.rg, 'bind certificate');
  const a = aa(app);
  const type = (one(p, '--ssl-type') ?? '').toUpperCase();
  if (!['SNI', 'IP'].includes(type)) throw new SimError('--ssl-type must be SNI or IP.', 'InvalidValue');
  const c = a.certs.find((x) => lc(x.thumbprint) === lc(one(p, '--certificate-thumbprint')));
  if (!c) { w.emit('adm.app.bind', { app: app.name, ok: false }); throw new SimError(`No certificate with thumbprint ${one(p, '--certificate-thumbprint')} is available to ${app.name}. Run az webapp config ssl list -g ${app.rg}.`, 'ResourceNotFound'); }
  c.bound = true; c.sslType = type;
  w.emit('adm.app.bind', { app: app.name, hostname: c.hostname, sslType: type, ok: true });
  return out(p, [{ name: c.hostname, sslState: type === 'SNI' ? 'SniEnabled' : 'IpBasedEnabled', thumbprint: c.thumbprint }]);
};

/* ------------------------------------------------------------------ */
/* Backup                                                              */
/* ------------------------------------------------------------------ */
function storageFromUrl(w: World, url: string) {
  const m = url.match(/^https:\/\/([a-z0-9]{3,24})\.blob\.core\.windows\.net\/([a-z0-9-]{3,63})(\?.*)?$/);
  if (!m) throw new SimError('--container-url must look like https://<account>.blob.core.windows.net/<container>?<SAS token>.', 'InvalidValue');
  if (!m[3] || !/sig=|sv=/.test(m[3])) throw new SimError('The container URL needs a SAS token with read, write, list and delete permissions (…?sv=…&sig=…). App Service writes the backup with it.', 'InvalidValue');
  const st = w.res.find((r) => r.type === 'storage' && r.name === m[1]);
  if (!st) throw new SimError(`Storage account '${m[1]}' was not found in this subscription. Custom backups need a storage account in the same subscription.`, 'ResourceNotFound');
  return { st, container: m[2] };
}
const backupCreate: Handler = (p, w) => {
  req(p, [RG, ['--webapp-name', ''], ['--container-url', '']]);
  const app = appFrom(p, w);
  needTier(w, planOfApp(w, app), 'Basic', 'backup and restore', 'adm.app.backup', { app: app.name });
  const { st, container } = storageFromUrl(w, one(p, '--container-url')!);
  const name = one(p, '--backup-name') ?? `${app.name}_${now().slice(0, 16).replace(/[-:T]/g, '')}`;
  const a = aa(app);
  a.backups.push({ name, at: now(), storage: `${st.name}/${container}`, size: '84 MB' });
  w.emit('adm.app.backup', { app: app.name, name, storage: st.name, container, ok: true });
  return out(p, { backupName: name, status: 'Succeeded', storageAccountUrl: `https://${st.name}.blob.core.windows.net/${container}`, sizeInBytes: 88080384, created: now(), note: 'A custom backup holds the app files and configuration (and linked databases you choose), up to 10 GB.' });
};
const backupUpdate: Handler = (p, w) => {
  req(p, [RG, ['--webapp-name', ''], ['--container-url', '']]);
  const app = appFrom(p, w);
  needTier(w, planOfApp(w, app), 'Basic', 'scheduled backups', 'adm.app.backup.schedule', { app: app.name });
  const { st } = storageFromUrl(w, one(p, '--container-url')!);
  const frequency = one(p, '--frequency') ?? '1d';
  if (!/^\d+[dh]$/.test(frequency)) throw new SimError('--frequency must be a number followed by d (days) or h (hours), for example 1d or 12h.', 'InvalidValue');
  const retention = Number(one(p, '--retention') ?? 30);
  const keepOne = !/^(false|0|no)$/i.test(one(p, '--retain-one') ?? 'true');
  aa(app).schedule = { frequency, retention, keepOne };
  w.emit('adm.app.backup.schedule', { app: app.name, frequency, retention, keepOne, storage: st.name, ok: true });
  return out(p, { name: app.name, backupSchedule: { frequencyInterval: Number(frequency.slice(0, -1)), frequencyUnit: frequency.endsWith('d') ? 'Day' : 'Hour', retentionPeriodInDays: retention, keepAtLeastOneBackup: keepOne, startTime: now() }, enabled: true });
};
const backupList: Handler = (p, w) => {
  const app = appFrom(p, w);
  const rows = aa(app).backups.map((b) => ({ BackupName: b.name, Status: 'Succeeded', Created: b.at, Storage: b.storage, Size: b.size }));
  return out(p, rows, rows, ['BackupName', 'Status', 'Created', 'Storage', 'Size']);
};
const backupRestore: Handler = (p, w) => {
  req(p, [RG, ['--webapp-name', ''], ['--backup-name', ''], ['--container-url', '']]);
  const app = appFrom(p, w);
  const b = aa(app).backups.find((x) => x.name === one(p, '--backup-name'));
  if (!b) throw new SimError(`Backup '${one(p, '--backup-name')}' wasn't found for ${app.name}. List them with az webapp config backup list.`, 'ResourceNotFound');
  if (!has(p, '--overwrite') && !one(p, '--target-name')) throw new SimError('Restoring over the same app needs --overwrite, or restore to another app with --target-name.', 'MissingArgs');
  w.assertWritable(app.rg, 'restore web app');
  w.emit('adm.app.restore', { app: app.name, backup: b.name, overwrite: has(p, '--overwrite') });
  return { out: `Restore of ${b.name} to ${one(p, '--target-name') ?? app.name} started. The app restarts when it finishes.` };
};

/* ------------------------------------------------------------------ */
/* Networking: VNet integration (outbound), access restrictions (inbound) */
/* ------------------------------------------------------------------ */
const vnetAdd: Handler = (p, w) => {
  req(p, [RG, NM, ['--vnet', ''], ['--subnet', '']]);
  const app = needApp(w, rgOf(p), one(p, '--name'));
  w.assertWritable(app.rg, 'add VNet integration');
  needTier(w, planOfApp(w, app), 'Basic', 'virtual network integration', 'adm.app.vnet', { app: app.name });
  const v = w.vnetOf(rgOf(p), one(p, '--vnet')!);
  const subName = one(p, '--subnet')!;
  const s = (v.props.subnetList as { name: string; prefix: string; nsg?: string; delegation?: string; usedBy?: string }[]).find((x) => lc(x.name) === lc(subName));
  if (!s) throw new SimError(`Subnet '${subName}' was not found in virtual network '${v.name}'.`, 'ResourceNotFound');
  const bits = Number(s.prefix.split('/')[1]);
  const fail = (reason: string, msg: string) => { w.emit('adm.app.vnet', { app: app.name, vnet: v.name, subnet: s.name, prefix: s.prefix, ok: false, reason }); throw new SimError(msg, 'BadRequest'); };
  if (bits > 28) fail('size', `Subnet ${s.name} (${s.prefix}) is too small. VNet integration needs a /28 or larger subnet, and /26 is recommended so the plan can scale out.`);
  if (s.delegation && s.delegation !== 'Microsoft.Web/serverFarms') fail('delegated', `Subnet ${s.name} is delegated to ${s.delegation}. VNet integration needs a subnet delegated to Microsoft.Web/serverFarms.`);
  const busy = w.res.some((r) => (r.type === 'vm' || r.type === 'nic' || r.type === 'pe') && lc(r.props.subnet ?? '') === lc(s.name) && lc(r.props.vnet ?? '') === lc(v.name));
  if (busy) fail('inuse', `Subnet ${s.name} already has other resources in it. Use an empty subnet just for App Service.`);
  s.delegation = 'Microsoft.Web/serverFarms';
  s.usedBy = app.props.plan;
  aa(app).vnet = { vnet: v.name, subnet: s.name };
  w.emit('adm.app.vnet', { app: app.name, vnet: v.name, subnet: s.name, prefix: s.prefix, ok: true });
  return out(p, { name: s.name, vnetResourceId: `${v.id}/subnets/${s.name}`, delegation: 'Microsoft.Web/serverFarms', routeAllEnabled: true, note: 'Outbound calls from the app now leave through this subnet. Inbound traffic is unchanged: use access restrictions or a private endpoint for that.' });
};
const vnetList: Handler = (p, w) => {
  const app = needApp(w, rgOf(p), one(p, '--name'));
  const v = aa(app).vnet;
  return out(p, v ? [{ name: v.subnet, vnetResourceId: v.vnet }] : [], v ? [{ Name: v.subnet, VNet: v.vnet }] : [], ['Name', 'VNet']);
};
const accessAdd: Handler = (p, w) => {
  req(p, [RG, NM, ['--priority', '']]);
  const app = needApp(w, rgOf(p), one(p, '--name'));
  w.assertWritable(app.rg, 'add access restriction');
  const a = aa(app);
  const action = ['Allow', 'Deny'].find((x) => lc(x) === lc(one(p, '--action') ?? 'Allow'));
  if (!action) throw new SimError('--action must be Allow or Deny.', 'InvalidValue');
  const priority = Number(one(p, '--priority'));
  if (!Number.isInteger(priority) || priority < 1 || priority > 2147483647) throw new SimError('--priority must be a whole number; lower numbers are checked first.', 'InvalidValue');
  const ip = one(p, '--ip-address'), tag = one(p, '--service-tag'), vnet = one(p, '--vnet-name'), sub = one(p, '--subnet');
  const source = ip ?? (tag ? `ServiceTag:${tag}` : vnet && sub ? `Subnet:${vnet}/${sub}` : '');
  if (!source) throw new SimError('Give a source: --ip-address 203.0.113.0/24, --service-tag AzureFrontDoor.Backend, or --vnet-name <vnet> --subnet <subnet>.', 'MissingArgs');
  if (ip && !/^\d{1,3}(\.\d{1,3}){3}(\/\d{1,2})?$/.test(ip)) throw new SimError(`'${ip}' isn't an IPv4 address or CIDR range.`, 'InvalidValue');
  const name = one(p, '--rule-name') ?? `rule-${priority}`;
  a.rules = a.rules.filter((r) => r.name !== name).concat({ name, action, priority, source }).sort((x, y) => x.priority - y.priority);
  w.emit('adm.app.access', { app: app.name, rule: name, action, priority, source });
  const rows = [...a.rules.map((r) => ({ Name: r.name, Action: r.action, Priority: r.priority, Source: r.source })), ...(a.rules.some((r) => r.action === 'Allow') ? [{ Name: 'Deny all', Action: 'Deny', Priority: 2147483647, Source: 'Any (unmatched rule action)' }] : [])];
  return out(p, rows, rows, ['Name', 'Action', 'Priority', 'Source']);
};
const accessShow: Handler = (p, w) => {
  req(p, [RG, NM]);
  const app = needApp(w, rgOf(p), one(p, '--name'));
  const a = aa(app);
  const rows = a.rules.length ? [...a.rules.map((r) => ({ Name: r.name, Action: r.action, Priority: r.priority, Source: r.source })), ...(a.rules.some((r) => r.action === 'Allow') ? [{ Name: 'Deny all', Action: 'Deny', Priority: 2147483647, Source: 'Any' }] : [])] : [{ Name: 'Allow all', Action: 'Allow', Priority: 2147483647, Source: 'Any' }];
  return out(p, { ipSecurityRestrictions: rows, scmIpSecurityRestrictionsUseMain: false }, rows, ['Name', 'Action', 'Priority', 'Source']);
};

/* ------------------------------------------------------------------ */
/* Deployment slots                                                    */
/* ------------------------------------------------------------------ */
const slotCreate: Handler = (p, w) => {
  req(p, [RG, NM, ['--slot', '-s']]);
  const app = needApp(w, rgOf(p), one(p, '--name'));
  w.assertWritable(app.rg, 'create deployment slot');
  const plan = planOfApp(w, app);
  const slot = lc(one(p, '--slot')!);
  needTier(w, plan, 'Standard', 'deployment slots', 'adm.app.slot', { app: app.name, slot });
  const a = aa(app);
  const t = tierOf(plan);
  if (slot === 'production') throw new SimError('"production" is the app itself. Pick another slot name, such as staging.', 'Conflict');
  if (a.slots[slot]) throw new SimError(`Slot '${slot}' already exists on ${app.name}.`, 'Conflict');
  if (Object.keys(a.slots).length >= t.slots) { w.emit('adm.app.slot', { app: app.name, slot, ok: false, reason: 'limit' }); throw new SimError(`The ${t.tier} tier allows ${t.slots} deployment slots per app (plus production). Scale up for more.`, 'Conflict'); }
  const src = one(p, '--configuration-source');
  const settings = src ? Object.fromEntries(Object.entries(settingsOf(app)).filter(([k]) => !a.sticky.includes(k))) : {};
  a.slots[slot] = { settings, version: a.version };
  w.emit('adm.app.slot', { app: app.name, slot, ok: true, cloned: !!src });
  return out(p, { name: `${app.name}/${slot}`, defaultHostName: `${app.name}-${slot}.azurewebsites.net`, state: 'Running', clonedSettings: Object.keys(settings), note: src ? 'Copied app settings and connection strings that aren\'t slot settings.' : 'Started with no app settings. Use --configuration-source to clone them.' });
};
const slotList: Handler = (p, w) => {
  req(p, [RG, NM]);
  const app = needApp(w, rgOf(p), one(p, '--name'));
  const a = aa(app);
  const rows = Object.entries(a.slots).map(([n, s]) => ({ Name: n, State: 'Running', DefaultHostName: `${app.name}-${n}.azurewebsites.net`, Version: s.version, Traffic: `${a.routing[n] ?? 0}%` }));
  return out(p, rows, rows, ['Name', 'State', 'DefaultHostName', 'Version', 'Traffic']);
};
const slotSwap: Handler = (p, w) => {
  req(p, [RG, NM, ['--slot', '-s']]);
  const app = needApp(w, rgOf(p), one(p, '--name'));
  w.assertWritable(app.rg, 'swap deployment slots');
  const a = aa(app);
  const slot = lc(one(p, '--slot')!), target = lc(one(p, '--target-slot') ?? 'production');
  const s = a.slots[slot];
  if (!s) throw new SimError(`Slot '${slot}' doesn't exist on ${app.name}. Create it with az webapp deployment slot create.`, 'ResourceNotFound');
  if (target !== 'production') throw new SimError('This simulator swaps a slot with production. Use --target-slot production (the default).', 'BadRequest');
  const action = lc(one(p, '--action') ?? 'swap');
  if (!['swap', 'preview', 'reset'].includes(action)) throw new SimError('--action must be swap, preview or reset.', 'InvalidValue');
  if (action === 'preview') {
    a.routing.__preview = 1;
    w.emit('adm.app.swap', { app: app.name, slot, target, action, sticky: [...a.sticky] });
    return { out: `Phase 1 of swap with preview: production's slot settings were applied to '${slot}' and its instances restarted and warmed up. Browse https://${app.name}-${slot}.azurewebsites.net to check it, then run --action swap to finish or --action reset to cancel.` };
  }
  if (action === 'reset') { delete a.routing.__preview; w.emit('adm.app.swap', { app: app.name, slot, target, action, sticky: [...a.sticky] }); return { out: `Swap with preview cancelled. '${slot}' got its own settings back.` }; }
  delete a.routing.__preview;
  const prod = settingsOf(app);
  const movable = (o: Record<string, string>) => Object.fromEntries(Object.entries(o).filter(([k]) => !a.sticky.includes(k)));
  const stay = (o: Record<string, string>) => Object.fromEntries(Object.entries(o).filter(([k]) => a.sticky.includes(k)));
  const prodMove = movable(prod), slotMove = movable(s.settings), prodStay = stay(prod), slotStay = stay(s.settings);
  app.props.settings = { ...slotMove, ...prodStay };
  s.settings = { ...prodMove, ...slotStay };
  const from = a.version;
  a.version = s.version; s.version = from;
  w.emit('adm.app.swap', { app: app.name, slot, target, action: 'swap', sticky: [...a.sticky], production: a.version, slotVersion: s.version });
  return { out: `Swapped '${slot}' with production on ${app.name}.\n  production now runs ${a.version} (warmed up before traffic moved, so no cold start)\n  ${slot} now runs ${s.version} (swap again to roll back)\n  Stayed with their slot: ${a.sticky.length ? a.sticky.join(', ') : '(no slot settings)'}` };
};
const deploy: Handler = (p, w) => {
  req(p, [RG, NM, ['--src-path', '']]);
  const app = needApp(w, rgOf(p), one(p, '--name'));
  w.assertWritable(app.rg, 'deploy');
  const a = aa(app);
  const src = one(p, '--src-path')!;
  const version = src.match(/v\d+(\.\d+)*/)?.[0] ?? `build-${hex(4)}`;
  const slot = lc(one(p, '--slot') ?? 'production');
  if (slot === 'production') a.version = version;
  else if (!a.slots[slot]) throw new SimError(`Slot '${slot}' doesn't exist on ${app.name}.`, 'ResourceNotFound');
  else a.slots[slot].version = version;
  w.emit('adm.app.deploy', { app: app.name, slot, version });
  return { out: `Deployment to ${app.name}${slot === 'production' ? '' : ` (slot ${slot})`} succeeded: ${src} → ${version}.${slot === 'production' ? '\nTip: deploy to a staging slot and swap, so users never hit a cold or half-deployed app.' : ''}` };
};
const routingSet: Handler = (p, w) => {
  req(p, [RG, NM, ['--distribution', '']]);
  const app = needApp(w, rgOf(p), one(p, '--name'));
  const a = aa(app);
  for (const d of many(p, '--distribution')) {
    const [slot, pct] = d.split('=');
    if (!a.slots[lc(slot)]) throw new SimError(`Slot '${slot}' doesn't exist on ${app.name}.`, 'ResourceNotFound');
    a.routing[lc(slot)] = Number(pct);
  }
  w.emit('adm.app.routing', { app: app.name, routing: { ...a.routing } });
  return { out: `Traffic routing on ${app.name}: ${Object.entries(a.routing).filter(([k]) => k !== '__preview').map(([k, v]) => `${k} ${v}%`).join(', ')}, production gets the rest. A visitor's choice sticks through the x-ms-routing-name cookie.` };
};
const appSettings: Cmd = {
  when: (p) => has(p, '--slot') || has(p, '--slot-settings'),
  run: (p, w) => {
    req(p, [RG, NM]);
    const app = needApp(w, rgOf(p), one(p, '--name'));
    w.assertWritable(app.rg, 'update app settings');
    const a = aa(app);
    const slot = lc(one(p, '--slot') ?? 'production');
    const parse = (xs: string[]) => Object.fromEntries(xs.filter((x) => x.includes('=')).map((x) => [x.slice(0, x.indexOf('=')), x.slice(x.indexOf('=') + 1)]));
    const plain = parse(many(p, '--settings')), sticky = parse(many(p, '--slot-settings'));
    if (!Object.keys(plain).length && !Object.keys(sticky).length) throw new SimError('Use --settings KEY=value and/or --slot-settings KEY=value.', 'MissingArgs');
    const target = slot === 'production' ? settingsOf(app) : a.slots[slot]?.settings;
    if (!target) throw new SimError(`Slot '${slot}' doesn't exist on ${app.name}.`, 'ResourceNotFound');
    Object.assign(target, plain, sticky);
    for (const k of Object.keys(sticky)) if (!a.sticky.includes(k)) a.sticky.push(k);
    w.emit('adm.app.settings', { app: app.name, slot, keys: [...Object.keys(plain), ...Object.keys(sticky)], sticky: Object.keys(sticky) });
    w.emit('appsettings.set', { kind: 'webapp', name: app.name, keys: [...Object.keys(plain), ...Object.keys(sticky)], kvRefs: 0 });
    return out(p, Object.entries(target).map(([name, value]) => ({ name, value, slotSetting: a.sticky.includes(name) })));
  },
};

/* ------------------------------------------------------------------ */
/* Containers: ACR SKUs and replication, ACI sizing, Container Apps     */
/* ------------------------------------------------------------------ */
const needAcr = (w: World, name?: string) => {
  const r = w.res.find((x) => x.type === 'acr' && lc(x.name) === lc(name));
  if (!r) throw new SimError(`Container registry '${name}' was not found. Create it with az acr create.`, 'ResourceNotFound');
  return r;
};
const acrUpdate: Handler = (p, w) => {
  req(p, [NM]);
  const acr = needAcr(w, one(p, '--name'));
  w.assertWritable(acr.rg, 'update container registry');
  const from = acr.props.sku;
  if (has(p, '--sku')) {
    const sku = ['Basic', 'Standard', 'Premium'].find((s) => lc(s) === lc(one(p, '--sku')));
    if (!sku) throw new SimError('--sku must be Basic, Standard or Premium.', 'InvalidSku');
    if (sku !== 'Premium' && ((acr.props.replicas ?? []) as string[]).length) throw new SimError(`Remove the geo-replications first: only Premium supports them.`, 'Conflict');
    acr.props.sku = sku;
  }
  if (has(p, '--admin-enabled')) acr.props.adminUserEnabled = !/^(false|0)$/i.test(one(p, '--admin-enabled') ?? 'true');
  w.emit('adm.acr.update', { name: acr.name, sku: acr.props.sku, from, adminUserEnabled: !!acr.props.adminUserEnabled });
  return out(p, { name: acr.name, sku: { name: acr.props.sku, tier: acr.props.sku }, adminUserEnabled: !!acr.props.adminUserEnabled, loginServer: acr.props.loginServer, includedStorageGiB: { Basic: 10, Standard: 100, Premium: 500 }[acr.props.sku as 'Basic'] });
};
const acrReplica: Cmd = {
  extra: { '-r': '--registry' },
  run: (p, w) => {
    req(p, [['--registry', '-r'], ['--location', '-l']]);
    const acr = needAcr(w, one(p, '--registry'));
    w.assertWritable(acr.rg, 'create replication');
    const loc = w.checkLocation(one(p, '--location')!);
    if (acr.props.sku !== 'Premium') {
      w.emit('adm.acr.replication', { registry: acr.name, location: loc, ok: false, sku: acr.props.sku });
      throw new SimError(`Geo-replication is only available in the Premium tier. Registry '${acr.name}' is ${acr.props.sku}. Upgrade with az acr update -n ${acr.name} --sku Premium (no downtime, images stay).`, 'SkuNotSupported');
    }
    if (lc(loc) === lc(acr.location)) throw new SimError(`${loc} is the registry's home region. Pick another region for the replica.`, 'Conflict');
    const reps = ((acr.props.replicas ??= []) as string[]);
    if (!reps.includes(loc)) reps.push(loc);
    w.emit('adm.acr.replication', { registry: acr.name, location: loc, ok: true });
    return out(p, { name: loc, location: loc, provisioningState: 'Succeeded', status: { displayStatus: 'Ready' }, note: `Pulls from ${loc} now hit the local replica; pushes to any replica sync everywhere.` });
  },
};
const acrReplicaList: Cmd = {
  extra: { '-r': '--registry' },
  run: (p, w) => {
    const acr = needAcr(w, one(p, '--registry'));
    const rows = [acr.location, ...((acr.props.replicas ?? []) as string[])].map((l, i) => ({ Name: l, Location: l, Status: 'Ready', Home: i === 0 ? 'Yes' : '' }));
    return out(p, rows, rows, ['Name', 'Location', 'Status', 'Home']);
  },
};

const RESTART = ['Always', 'OnFailure', 'Never'];
const containerCreate: Cmd = {
  when: (p) => has(p, '--cpu') || has(p, '--memory') || has(p, '--restart-policy') || has(p, '--os-type') || has(p, '--dns-name-label'),
  run: (p, w) => {
    req(p, [RG, NM, ['--image', '']]);
    const cpu = Number(one(p, '--cpu') ?? 1), memory = Number(one(p, '--memory') ?? 1.5);
    const restart = RESTART.find((r) => lc(r) === lc(one(p, '--restart-policy') ?? 'Always'));
    const name = one(p, '--name')!;
    const bad = (reason: string, msg: string) => { w.emit('adm.aci.create', { name, ok: false, reason, cpu, memory }); throw new SimError(msg, 'InvalidContainerGroup'); };
    if (!restart) bad('restart', '--restart-policy must be Always (default), OnFailure or Never.');
    if (!(cpu > 0) || cpu > 4) bad('cpu', `--cpu ${one(p, '--cpu')} is outside what a standard Linux container group gets in most regions (up to 4 vCPU). Use a value such as 1 or 2.`);
    if (!(memory > 0) || memory > 16) bad('memory', `--memory ${one(p, '--memory')} GB is outside what a standard Linux container group gets in most regions (up to 16 GB).`);
    const image = one(p, '--image')!;
    if (/\.azurecr\.io\//i.test(image) && !has(p, '--registry-password') && !has(p, '--acr-identity'))
      bad('auth', `The image is in a private registry. Add --registry-login-server, --registry-username and --registry-password, or --acr-identity with a managed identity that has AcrPull.`);
    const c = w.createAci({ rg: rgOf(p), name, image, ports: one(p, '--ports') }, 'cli');
    const os = one(p, '--os-type') ?? 'Linux';
    const label = one(p, '--dns-name-label');
    Object.assign(c.props, { cpu, memory, restartPolicy: restart, osType: os, fqdn: label ? `${lc(label)}.${c.location}.azurecontainer.io` : null, state: restart === 'Always' ? 'Running' : 'Succeeded' });
    w.emit('adm.aci.create', { name, rg: c.rg, cpu, memory, restartPolicy: restart, osType: os, ok: true });
    return out(p, { name, containers: [{ image, resources: { requests: { cpu, memoryInGB: memory } } }], osType: os, restartPolicy: restart, ipAddress: { ip: c.props.ip, fqdn: c.props.fqdn, ports: [{ port: Number(c.props.ports) }] }, provisioningState: 'Succeeded', instanceView: { state: c.props.state },
      note: restart === 'Always' ? 'Always restarts the container whenever it stops: right for a long-running service.' : `${restart}: the container group stops (and stops billing) after the job ends${restart === 'OnFailure' ? ', unless it exits with an error' : ''}.` });
  },
};
const containerShow: Handler = (p, w) => {
  req(p, [RG, NM]);
  const c = w.need('aci', rgOf(p), one(p, '--name')!);
  return out(p, { name: c.name, containers: [{ image: c.props.image, resources: { requests: { cpu: c.props.cpu ?? 1, memoryInGB: c.props.memory ?? 1.5 } } }], restartPolicy: c.props.restartPolicy ?? 'Always', osType: c.props.osType ?? 'Linux', ipAddress: { ip: c.props.ip, fqdn: c.props.fqdn ?? null }, instanceView: { state: c.props.state } });
};

/** Container Apps (Consumption): CPU in 0.25 steps up to 4, memory exactly 2 GiB per vCPU. */
function acaSize(p: Parsed, w: World, app: string) {
  const cpuS = one(p, '--cpu'), memS = one(p, '--memory');
  if (!cpuS && !memS) return null;
  if (!cpuS || !memS) throw new SimError('Set --cpu and --memory together, for example --cpu 0.5 --memory 1.0Gi.', 'MissingArgs');
  const cpu = Number(cpuS), mem = Number(memS.replace(/gi$/i, ''));
  const okCpu = cpu >= 0.25 && cpu <= 4 && Math.abs(cpu * 4 - Math.round(cpu * 4)) < 1e-9;
  if (!okCpu || Math.abs(mem - cpu * 2) > 1e-9) {
    w.emit('adm.aca.size', { app, cpu, memory: mem, ok: false });
    throw new SimError(`--cpu ${cpuS} --memory ${memS} isn't an allowed pair on the Consumption profile. CPU goes from 0.25 to 4 in steps of 0.25, and memory must be twice the CPU in Gi (0.25/0.5Gi, 0.5/1.0Gi, 1/2.0Gi … 4/8.0Gi).`, 'ContainerAppInvalidResourceTotal');
  }
  return { cpu, memory: mem };
}
const stripFlags = (tokens: string[], names: string[]) => {
  const outT: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (names.includes(lc(tokens[i]))) { i++; continue; }
    outT.push(tokens[i]);
  }
  return outT;
};
function acaWrap(tokens: string[], w: World): AdminOut | null {
  const words = tokens.filter((t) => !t.startsWith('-')).slice(0, 2).map(lc);
  if (words[0] !== 'containerapp' || (words[1] !== 'create' && words[1] !== 'update')) return null;
  const parsed = parse(tokens);
  if (!has(parsed, '--cpu') && !has(parsed, '--memory') && !has(parsed, '--scale-rule-http-concurrency')) return null;
  const name = one(parsed, '--name') ?? '';
  w.emit('cli', { command: `az containerapp ${words[1]}`, path: `containerapp ${words[1]}`, line: `az ${tokens.join(' ')}` });
  try {
    const size = acaSize(parsed, w, name);
    const conc = one(parsed, '--scale-rule-http-concurrency');
    if (conc && !(Number(conc) >= 1)) throw new SimError('--scale-rule-http-concurrency must be 1 or more (concurrent requests per replica).', 'InvalidValue');
    if (conc && !one(parsed, '--scale-rule-name')) throw new SimError('Add --scale-rule-name (for example http-scale) with --scale-rule-type http.', 'MissingArgs');
    const rest = stripFlags(tokens, ['--cpu', '--memory', '--scale-rule-http-concurrency']);
    let r = devAz(rest, w);
    if (!r) return null;
    if (r.error) return r;
    if (words[1] === 'update' && /Nothing to update/.test(r.out ?? '')) r = devAz([...rest, '--revision-suffix', `r${hex(5)}`], w) ?? r;
    if (r.error) return r;
    const app = w.find('containerapp', one(parsed, '--resource-group') ?? '', name);
    if (!app) return r;
    if (size) { app.props.cpu = size.cpu; app.props.memory = size.memory; w.emit('adm.aca.size', { app: name, cpu: size.cpu, memory: size.memory, ok: true }); }
    if (conc) {
      const rule = (app.props.rules as { name: string; type: string; metadata: Record<string, string> }[]).find((x) => x.type === 'http') ?? app.props.rules[0];
      if (rule) { rule.type = 'http'; rule.metadata = { ...rule.metadata, concurrentRequests: conc }; }
    }
    const httpRule = (app.props.rules as { type: string; metadata: Record<string, string> }[]).find((x) => x.type === 'http');
    if (conc || has(parsed, '--min-replicas') || has(parsed, '--max-replicas'))
      w.emit('adm.aca.scale', { app: name, min: app.props.min, max: app.props.max, type: httpRule ? 'http' : 'default-http', concurrency: Number(httpRule?.metadata?.concurrentRequests ?? 10) });
    return { out: `${r.out ?? ''}${size ? `\nResources per replica: ${size.cpu} vCPU, ${size.memory} Gi memory.` : ''}${conc ? `\nHTTP scale rule: add a replica for every ${conc} concurrent requests, between ${app.props.min} and ${app.props.max} replicas.` : ''}` };
  } catch (e) {
    if (e instanceof SimError) return { error: `(${e.code}) ${e.message}` };
    throw e;
  }
}

/* ------------------------------------------------------------------ */
/* tables                                                              */
/* ------------------------------------------------------------------ */
const P_EXTRA = { '-p': '--plan', '-s': '--slot' };
const TABLE: Record<string, Cmd | Handler> = {
  'appservice plan update': planUpdate,
  'appservice plan show': planShow,
  'monitor autoscale create': autoscaleCreate,
  'monitor autoscale rule create': autoscaleRule,
  'webapp show': webappShow,
  'webapp update': webappUpdate,
  'webapp config set': configSet,
  'webapp config hostname add': hostnameAdd,
  'webapp config hostname list': hostnameList,
  'webapp config ssl create': sslCreate,
  'webapp config ssl show': sslShow,
  'webapp config ssl list': sslList,
  'webapp config ssl bind': sslBind,
  'webapp config backup create': backupCreate,
  'webapp config backup update': backupUpdate,
  'webapp config backup list': backupList,
  'webapp config backup restore': backupRestore,
  'webapp vnet-integration add': vnetAdd,
  'webapp vnet-integration list': vnetList,
  'webapp config access-restriction add': accessAdd,
  'webapp config access-restriction show': accessShow,
  'webapp deployment slot create': { extra: P_EXTRA, run: slotCreate },
  'webapp deployment slot list': slotList,
  'webapp deployment slot swap': { extra: P_EXTRA, run: slotSwap },
  'webapp deploy': { extra: P_EXTRA, run: deploy },
  'webapp traffic-routing set': routingSet,
  'webapp config appsettings set': { ...appSettings, extra: P_EXTRA },
  'network dns record-set txt add-record': txtAsuid,
  'network dns record-set cname set-record': cnameToApp,
  'acr update': acrUpdate,
  'acr replication create': acrReplica,
  'acr replication list': acrReplicaList,
  'container create': containerCreate,
  'container show': containerShow,
};

export function az(tokens: string[], w: World): AdminOut | null {
  const aca = acaWrap(tokens, w);
  if (aca) return aca;
  return run(TABLE, tokens, w);
}

/** `hey`: a small HTTP load generator, used here to watch a container app scale on concurrent requests. */
export function shell(tokens: string[], w: World): AdminOut | null {
  if (lc(tokens[0]) !== 'hey') return null;
  const args = tokens.slice(1);
  const url = args.find((a) => /^https?:\/\//.test(a));
  const ci = args.indexOf('-c');
  const conc = ci >= 0 ? Number(args[ci + 1]) : 50;
  if (!url) return { error: 'usage: hey -z 60s -c 200 https://<app-url>' };
  const host = lc(url.replace(/^https?:\/\//, '').split('/')[0]);
  const app = w.res.find((r) => r.type === 'containerapp' && lc(r.props.fqdn ?? '') === host);
  if (!app) {
    const web = w.res.find((r) => r.type === 'webapp' && (lc(r.props.host) === host || (aa(r).hostnames ?? []).includes(host)));
    if (web) { w.emit('adm.app.load', { app: web.name, concurrency: conc }); return { out: `Summary:\n  Requests/sec: ${Math.round(conc * 9.5)}\n  Status 200: ${conc * 570}\n(App Service: the plan's instances share this load. Autoscale rules react to CPU or HTTP queue length after their time window.)` }; }
    return { error: `Get "${url}": dial tcp: lookup ${host}: no such host` };
  }
  if (!app.props.ingress) return { error: `Get "${url}": the app has no ingress enabled.` };
  const rule = (app.props.rules as { type: string; metadata: Record<string, string> }[]).find((x) => x.type === 'http');
  const per = Number(rule?.metadata?.concurrentRequests ?? 10);
  const from = Number(app.props.replicas ?? app.props.min ?? 0);
  const to = Math.min(Number(app.props.max ?? 10), Math.max(Number(app.props.min ?? 0), 1, Math.ceil(conc / per)));
  app.props.replicas = to;
  w.emit('adm.aca.load', { app: app.name, concurrency: conc, per, from, to, max: app.props.max, capped: Math.ceil(conc / per) > Number(app.props.max ?? 10) });
  const capped = Math.ceil(conc / per) > Number(app.props.max ?? 10);
  return { out: [
    `Summary:`, `  Total:        60.0 secs`, `  Requests/sec: ${Math.round(Math.min(conc, to * per) * 8.7)}`, ``,
    `Status code distribution:`, `  [200] ${Math.round(Math.min(conc, to * per) * 520)} responses`, ...(capped ? [`  [503] ${Math.round((conc - to * per) * 40)} responses (queued past the max)`] : []), ``,
    `Container Apps scaled ${app.name}: ${from} → ${to} replica(s) (${conc} concurrent requests ÷ ${per} per replica${capped ? `, capped at max replicas ${app.props.max}` : ''}).`,
    `When traffic stops, it scales back to ${app.props.min} after the cool-down period (300 seconds by default).`,
  ].join('\n') };
}

export const COMPLETIONS: string[] = [
  'az appservice plan update --sku', 'az appservice plan update --number-of-workers', 'az monitor autoscale create --resource-type Microsoft.Web/serverfarms', 'az monitor autoscale rule create --condition',
  'az webapp show --query customDomainVerificationId', 'az webapp update --https-only true', 'az webapp config set --min-tls-version 1.2',
  'az webapp config hostname add --hostname', 'az webapp config ssl create --hostname', 'az webapp config ssl bind --ssl-type SNI', 'az webapp config ssl show --certificate-name',
  'az webapp config backup create --container-url', 'az webapp config backup update --frequency', 'az webapp config backup list', 'az webapp config backup restore',
  'az webapp vnet-integration add --vnet', 'az webapp config access-restriction add --rule-name', 'az webapp config access-restriction show',
  'az webapp deployment slot create --slot', 'az webapp deployment slot swap --slot', 'az webapp deployment slot list', 'az webapp deploy --src-path', 'az webapp traffic-routing set --distribution',
  'az webapp config appsettings set --slot-settings', 'az network dns record-set txt add-record', 'az network dns record-set cname set-record',
  'az acr update --sku Premium', 'az acr replication create', 'az acr replication list', 'az container create --cpu', 'az container show', 'hey -z 60s -c',
];
