/**
 * AZ-104 "ops" Cloud Shell commands (EDUCATION ONLY): Azure Monitor metrics,
 * diagnostic settings, the activity log, KQL over admin tables, action groups,
 * alert processing rules, VM insights data collection rules, Connection
 * monitor, Azure Backup (Recovery Services vaults and Backup vaults) and Site
 * Recovery practice shortcuts. Return null for anything this area doesn't handle.
 */
import type { World } from '../world';
import {
  run, parse, one, many, has, bool, req, lc, json, now, hex, uuid, adm, out, table, SimError, SUB_ID, TYPE_INFO,
  type AdminOut, type Cmd, type Handler, type Parsed, type Res, type ResType,
} from './kit';

/* ---------------- helpers ---------------- */
const SHORTCUT = 'ℹ Practice shortcut: the real az site-recovery extension also needs --fabric-name, --protection-container and --provider-details JSON. Most admins do this from the VM\'s Disaster recovery blade.';
const ops = (w: World) => (adm(w).ops ??= { alerting: false, clock: 'Saturday 23:15' }) as Record<string, any>;
const rgOf = (p: Parsed) => one(p, '--resource-group');
const anyRes = (w: World, name: string, types?: ResType[]) => w.res.find((r) => r.name.toLowerCase() === lc(name) && (!types || types.includes(r.type)));
/** Accepts a full ARM id or a plain name. Returns the resource and an optional sub-resource such as blobServices. */
function resolve(w: World, ref: string | undefined, types?: ResType[]): { res: Res; sub?: string } {
  const v = (ref ?? '').trim();
  if (!v) throw new SimError('the following arguments are required: --resource', 'MissingArgs');
  const m = /\/providers\/([^/]+)\/([^/]+)\/([^/]+)(?:\/([^/]+)\/([^/]+))?/i.exec(v);
  const name = m ? m[3] : v.split('/').pop()!;
  const res = anyRes(w, name, types);
  if (!res) throw new SimError(`The resource '${name}' was not found in this practice subscription.`, 'ResourceNotFound');
  return { res, sub: m?.[4] };
}
const vmByRef = (w: World, ref?: string) => resolve(w, ref, ['vm']).res;
/** Tiny --query support: "[0].name", "[].name", "name", "id". */
function q(p: Parsed, value: unknown): AdminOut | null {
  const expr = one(p, '--query');
  if (!expr) return null;
  const pick = (o: any, k: string) => (o && typeof o === 'object' ? o[k] : undefined);
  let r: unknown;
  const a = /^\[(\d+)\]\.(\w+)$/.exec(expr), b = /^\[\]\.(\w+)$/.exec(expr);
  if (a) r = pick((value as any[])[Number(a[1])], a[2]);
  else if (b) r = (value as any[]).map((x) => pick(x, b[1]));
  else r = pick(value, expr);
  if (lc(one(p, '--output')) === 'tsv') return { out: Array.isArray(r) ? r.join('\n') : String(r ?? '') };
  return { out: json(r ?? null) };
}
const emitBlocked = (w: World, what: string, why: string) => { w.emit('adm.blocked', { what, why }); return new SimError(why, 'BadRequest'); };

/* ---------------- Azure Monitor: metrics ---------------- */
const METRICS: Partial<Record<ResType, string[]>> = {
  vm: ['Percentage CPU', 'Available Memory Bytes', 'Network In Total', 'Network Out Total', 'Disk Read Bytes', 'OS Disk IOPS Consumed Percentage'],
  storage: ['Transactions', 'UsedCapacity', 'Availability', 'SuccessE2ELatency', 'Ingress', 'Egress'],
  rsv: ['Backup Health Events', 'Restore Health Events'],
  webapp: ['Requests', 'Http5xx', 'AverageResponseTime', 'CpuTime'],
};
const parseOffset = (s?: string) => { const m = /^(\d+)\s*([dhm])$/i.exec(s ?? ''); if (!m) return 0; return Number(m[1]) * ({ d: 1, h: 1 / 24, m: 1 / 1440 } as Record<string, number>)[m[2].toLowerCase()]; };

const metricsList: Handler = (p, w) => {
  req(p, [['--resource', '']]);
  const { res } = resolve(w, one(p, '--resource'));
  const names = METRICS[res.type] ?? ['Availability'];
  const metric = one(p, '--metric', '--metrics') ?? names[0];
  if (!names.some((n) => lc(n) === lc(metric))) throw new SimError(`Metric '${metric}' isn't available for ${res.type}. Run 'az monitor metrics list-definitions --resource ${res.name}' to see: ${names.join(', ')}.`, 'BadRequest');
  const agg = one(p, '--aggregation') ?? 'Average';
  const interval = one(p, '--interval') ?? 'PT1M';
  const days = parseOffset(one(p, '--offset'));
  const tooOld = days > 93;
  const base = res.type === 'vm' ? (res.props.cpu ?? 8) : lc(metric) === 'availability' ? 100 : 12;
  const rows = Array.from({ length: 6 }, (_, k) => ({ Timestamp: `2026-11-24T14:${String(k * 5).padStart(2, '0')}:00Z`, Name: metric, [agg]: Number((base * (0.85 + ((k * 37) % 30) / 100)).toFixed(2)) }));
  w.emit('adm.metrics', { resource: res.name, type: res.type, metric, aggregation: agg, interval, days, retentionHit: tooOld });
  const note = tooOld ? `\n⚠ You asked for ${days} days. Platform metrics are kept for 93 days, so only the last 93 days came back. To keep metrics longer, send AllMetrics to a Log Analytics workspace with a diagnostic setting.` : '';
  const o = out(p, { cost: 0, interval, namespace: TYPE_NS[res.type] ?? 'Microsoft.Resources', resourceregion: res.location, value: [{ name: { value: metric }, unit: lc(metric).includes('percent') ? 'Percent' : 'Count', timeseries: [{ data: rows }] }] }, rows, ['Timestamp', 'Name', agg]);
  return { out: (o.out ?? '') + note };
};
const TYPE_NS: Partial<Record<ResType, string>> = { vm: 'Microsoft.Compute/virtualMachines', storage: 'Microsoft.Storage/storageAccounts', rsv: 'Microsoft.RecoveryServices/vaults', webapp: 'Microsoft.Web/sites' };
const metricDefs: Handler = (p, w) => {
  const { res } = resolve(w, one(p, '--resource'));
  const rows = (METRICS[res.type] ?? ['Availability']).map((n) => ({ Name: n, Aggregations: 'Average, Minimum, Maximum, Total, Count' }));
  w.emit('adm.metrics.defs', { resource: res.name });
  return out(p, rows.map((r) => ({ name: { value: r.Name } })), rows, ['Name', 'Aggregations']);
};

/* ---------------- diagnostic settings ---------------- */
const LOGS: Record<string, string[]> = {
  'storage:blobservices': ['StorageRead', 'StorageWrite', 'StorageDelete'],
  'storage:fileservices': ['StorageRead', 'StorageWrite', 'StorageDelete'],
  'storage:queueservices': ['StorageRead', 'StorageWrite', 'StorageDelete'],
  'storage:tableservices': ['StorageRead', 'StorageWrite', 'StorageDelete'],
  kv: ['AuditEvent', 'AzurePolicyEvaluationDetails'],
  rsv: ['CoreAzureBackup', 'AddonAzureBackupJobs', 'AddonAzureBackupAlerts', 'AddonAzureBackupPolicy', 'AddonAzureBackupStorage', 'AddonAzureBackupProtectedInstance', 'AzureSiteRecoveryJobs', 'AzureSiteRecoveryEvents'],
  nsg: ['NetworkSecurityGroupEvent', 'NetworkSecurityGroupRuleCounter'],
  webapp: ['AppServiceHTTPLogs', 'AppServiceConsoleLogs', 'AppServiceAppLogs', 'AppServiceAuditLogs'],
  law: ['Audit', 'SummaryLogs'],
  sql: ['SQLInsights', 'Errors', 'Timeouts', 'Deadlocks'],
};
const logCats = (r: Res, sub?: string) => LOGS[sub ? `${r.type}:${lc(sub)}` : r.type] ?? (r.type === 'vm' || r.type === 'storage' || r.type === 'disk' ? [] : ['allLogs']);
const catsIn = (s?: string) => [...(s ?? '').matchAll(/"category(?:Group)?"\s*:\s*"([^"]+)"/g)].map((m) => m[1]);

const diagCreate: Handler = (p, w) => {
  req(p, [['--name', '-n'], ['--resource', '']]);
  const { res, sub } = resolve(w, one(p, '--resource'));
  const name = one(p, '--name')!;
  const logs = catsIn(one(p, '--logs'));
  const metrics = catsIn(one(p, '--metrics'));
  const wsRef = one(p, '--workspace'), stRef = one(p, '--storage-account'), ehRef = one(p, '--event-hub', '--event-hub-rule');
  if (!wsRef && !stRef && !ehRef) throw new SimError('Choose at least one destination: --workspace (Log Analytics), --storage-account or --event-hub with --event-hub-rule.', 'BadRequest');
  const allowed = logCats(res, sub);
  if (logs.length && !allowed.length) {
    throw emitBlocked(w, 'diag', res.type === 'vm'
      ? `Resource type 'Microsoft.Compute/virtualMachines' has no resource log categories. A diagnostic setting on a VM can only send platform metrics. For guest OS logs and performance counters, install the Azure Monitor Agent and use a data collection rule (VM insights does this for you).`
      : `'${res.name}' has no resource logs at this level. For a storage account, add the setting to the service, for example --resource <account id>/blobServices/default, to get StorageRead, StorageWrite and StorageDelete.`);
  }
  const bad = logs.filter((c) => !['allLogs', 'audit'].includes(c) && !allowed.includes(c) && !allowed.includes('allLogs'));
  if (bad.length) throw new SimError(`Category '${bad[0]}' is not supported for this resource. Supported categories: ${allowed.join(', ')} (or categoryGroup allLogs / audit).`, 'BadRequest');
  const dest: Record<string, string> = {};
  if (wsRef) { const ws = resolve(w, wsRef, ['law']).res; dest.workspace = ws.name; }
  if (stRef) {
    const st = resolve(w, stRef, ['storage']).res;
    if (st.location !== res.location && res.location !== 'global') throw new SimError(`The storage account '${st.name}' is in ${st.location}, but '${res.name}' is in ${res.location}. A diagnostic setting can only archive to a storage account in the same region as the resource.`, 'BadRequest');
    dest.storage = st.name;
  }
  if (ehRef) dest.eventHub = ehRef.split('/').pop()!;
  w.assertWritable(res.rg, 'create diagnostic setting');
  res.props.diag ??= [];
  if (res.props.diag.length >= 5 && !res.props.diag.some((d: any) => d.name === name)) throw new SimError('A resource can have at most 5 diagnostic settings.', 'BadRequest');
  const specific = bool(p, '--export-to-resource-specific', false);
  const entry = { name, sub: sub ? lc(sub) : '', logs, metrics, dest, resourceSpecific: specific };
  res.props.diag = [...res.props.diag.filter((d: any) => d.name !== name), entry];
  w.emit('adm.diag', { resource: res.name, type: res.type, sub: entry.sub, name, logs, metrics: metrics.length > 0, dest: Object.keys(dest), workspace: dest.workspace ?? '', resourceSpecific: specific });
  const warn = res.type === 'rsv' && !specific ? '\n⚠ Backup reports need resource-specific tables. Re-run with --export-to-resource-specific true.' : '';
  return { out: json({ name, id: `${res.id}${sub ? `/${sub}/default` : ''}/providers/microsoft.insights/diagnosticSettings/${name}`, logAnalyticsDestinationType: specific ? 'Dedicated' : null, logs: logs.map((c) => ({ [c === 'allLogs' || c === 'audit' ? 'categoryGroup' : 'category']: c, enabled: true })), metrics: metrics.map((c) => ({ category: c, enabled: true })), workspaceId: dest.workspace ? w.idFor('law', resolve(w, dest.workspace, ['law']).res.rg, dest.workspace) : null, storageAccountId: dest.storage ?? null, eventHubName: dest.eventHub ?? null }) + warn };
};
const diagList: Handler = (p, w) => {
  const { res } = resolve(w, one(p, '--resource'));
  const rows = (res.props.diag ?? []).map((d: any) => ({ Name: d.name, Logs: d.logs.join(' ') || '-', Metrics: d.metrics.join(' ') || '-', Destinations: Object.values(d.dest).join(', ') }));
  return out(p, res.props.diag ?? [], rows, ['Name', 'Logs', 'Metrics', 'Destinations']);
};
const diagCats: Handler = (p, w) => {
  const { res, sub } = resolve(w, one(p, '--resource'));
  const rows = [...logCats(res, sub).map((c) => ({ Name: c, CategoryType: 'Logs' })), { Name: res.type === 'storage' && !sub ? 'Transaction' : 'AllMetrics', CategoryType: 'Metrics' }];
  w.emit('adm.diag.categories', { resource: res.name, sub: sub ?? '' });
  return out(p, rows, rows, ['Name', 'CategoryType']);
};
const diagSub: Handler = (p, w) => {
  req(p, [['--name', '-n']]);
  const wsRef = one(p, '--workspace');
  if (!wsRef && !one(p, '--storage-account') && !one(p, '--event-hub-auth-rule')) throw new SimError('Choose a destination: --workspace, --storage-account or --event-hub-auth-rule.', 'BadRequest');
  const logs = catsIn(one(p, '--logs'));
  const ws = wsRef ? resolve(w, wsRef, ['law']).res.name : '';
  ops(w).activityExport = { name: one(p, '--name'), workspace: ws, logs };
  w.emit('adm.diag', { resource: 'subscription', type: 'subscription', sub: '', name: one(p, '--name'), logs, metrics: false, dest: ws ? ['workspace'] : ['other'], workspace: ws, resourceSpecific: false });
  return { out: json({ name: one(p, '--name'), id: `/subscriptions/${SUB_ID}/providers/microsoft.insights/diagnosticSettings/${one(p, '--name')}`, logs: logs.map((c) => ({ category: c, enabled: true })), workspaceId: ws }) + '\nThe activity log now flows to the workspace (AzureActivity table), where you can keep it longer than 90 days and join it with other logs.' };
};

/* ---------------- activity log ---------------- */
const ACT = /(\.create|\.delete|\.start|\.stop|\.deallocate|\.restart|role\.assign|lock\.|policy\.assign|adm\.(rsv|bvault|ag|apr|backup|restore|asr|diag)|nsg\.rule)/;
const activity: Handler = (p, w) => {
  const g = lc(rgOf(p));
  const days = parseOffset(one(p, '--offset')) || 6 / 24;
  const caller = lc(one(p, '--caller'));
  const max = Number(one(p, '--max-events') ?? 50);
  const rows = w.events.filter((e) => ACT.test(e.type) && (!g || lc(e.data.rg) === g || lc(e.data.resourceGroup) === g)).slice(-max).reverse()
    .map((e) => ({ EventTimestamp: new Date(e.at).toISOString().slice(0, 19), OperationName: opName(e.type), Status: 'Succeeded', Caller: w.current, ResourceGroup: e.data.rg ?? e.data.resourceGroup ?? '', Resource: e.data.name ?? e.data.vm ?? e.data.vault ?? '' }))
    .filter((r) => !caller || lc(r.Caller).includes(caller));
  w.emit('adm.activity', { rg: g, count: rows.length, days });
  const note = days > 90 ? '\n⚠ The activity log keeps events for 90 days. For longer, export it to a Log Analytics workspace with a subscription diagnostic setting.' : '';
  const o = out(p, rows.map((r) => ({ eventTimestamp: r.EventTimestamp, operationName: { localizedValue: r.OperationName }, status: { value: r.Status }, caller: r.Caller, resourceGroupName: r.ResourceGroup })), rows, ['EventTimestamp', 'OperationName', 'Status', 'Caller', 'Resource']);
  return { out: (o.out || '(no events in this time range)') + note };
};
const opName = (t: string) => {
  const [a, b] = t.replace(/^adm\./, '').split('.');
  const verb: Record<string, string> = { create: 'Create or Update', delete: 'Delete', start: 'Start', stop: 'Power Off', deallocate: 'Deallocate', restart: 'Restart', assign: 'Create role assignment', rule: 'Create or Update Security Rule' };
  const label = (TYPE_INFO as Record<string, { label: string }>)[a]?.label ?? a;
  return `${verb[b] ?? b ?? ''} ${label}`.trim();
};

/* ---------------- KQL over admin tables ---------------- */
const MY_TABLES = ['azurediagnostics', 'storagebloblogs', 'insightsmetrics', 'addonazurebackupjobs', 'nwconnectionmonitortestresult', 'azuremetrics'];
const tableOf = (qs: string) => lc((qs ?? '').trim().split(/[\s|(]/)[0]);
const T0 = Date.UTC(2026, 10, 24, 12, 0, 0);
const ts = (k: number) => new Date(T0 + k * 4 * 60000).toISOString().slice(0, 19) + 'Z';
function rowsFor(w: World, table: string, ws: string): Record<string, any>[] {
  const toWs = (r: Res, sub?: string) => (r.props.diag ?? []).some((d: any) => d.dest.workspace && lc(d.dest.workspace) === lc(ws) && (sub === undefined || d.sub === sub));
  if (table === 'storagebloblogs') {
    const sts = w.res.filter((r) => r.type === 'storage' && toWs(r, 'blobservices'));
    if (!sts.length) throw new SimError(`'StorageBlobLogs' has no data in '${ws}'. Add a diagnostic setting on <storage account id>/blobServices/default that sends StorageRead/StorageWrite/StorageDelete (or allLogs) to this workspace.`, 'SemanticError');
    const OPS = ['GetBlob', 'PutBlob', 'GetBlob', 'ListBlobs', 'DeleteBlob', 'GetBlob'];
    return sts.flatMap((st) => Array.from({ length: 30 }, (_, k) => ({ TimeGenerated: ts(k), AccountName: st.name, OperationName: OPS[k % 6], StatusCode: k % 7 === 3 ? 403 : k % 11 === 5 ? 404 : 200, AuthenticationType: k % 7 === 3 ? 'SAS' : 'OAuth', CallerIpAddress: k % 7 === 3 ? '203.0.113.50' : '10.0.0.4', Uri: `https://${st.name}.blob.core.windows.net/invoices/inv-${100 + k}.pdf` })));
  }
  if (table === 'azurediagnostics') {
    const any = w.res.filter((r) => toWs(r) && !['storage'].includes(r.type));
    if (!any.length) throw new SimError(`'AzureDiagnostics' has no data in '${ws}'. Send a resource's logs (for example a Key Vault's AuditEvent) to this workspace with a diagnostic setting first.`, 'SemanticError');
    return any.flatMap((r) => Array.from({ length: 24 }, (_, k) => ({ TimeGenerated: ts(k), Resource: r.name.toUpperCase(), ResourceType: TYPE_NS[r.type] ?? r.type, Category: logCats(r)[0], OperationName: r.type === 'kv' ? (k % 5 === 2 ? 'SecretGet' : 'VaultGet') : 'Request', ResultType: k % 6 === 4 ? 'Forbidden' : 'Success', httpStatusCode_d: k % 6 === 4 ? 403 : k >= 15 && k <= 17 ? 500 : 200, CallerIPAddress: k % 6 === 4 ? '198.51.100.7' : '10.0.0.5' })));
  }
  if (table === 'insightsmetrics') {
    const vms = w.res.filter((r) => r.type === 'vm' && r.props.vmInsights && lc(r.props.vmInsights) === lc(ws));
    if (!vms.length) throw new SimError(`'InsightsMetrics' has no data in '${ws}'. Enable VM insights: create a VM insights data collection rule that sends to this workspace and associate it with the VM.`, 'SemanticError');
    const NS: [string, string, number][] = [['Processor', 'UtilizationPercentage', 1], ['Memory', 'AvailableMB', 40], ['LogicalDisk', 'FreeSpacePercentage', 2], ['Network', 'WriteBytesPerSecond', 90]];
    return vms.flatMap((vm) => Array.from({ length: 12 }, (_, k) => { const [n, m, f] = NS[k % 4]; return { TimeGenerated: ts(k), Computer: vm.name, Origin: 'vm.azm.ms', Namespace: n, Name: m, Val: Math.round(((vm.props.cpu ?? 12) + k) * f) }; }));
  }
  if (table === 'addonazurebackupjobs') {
    const vaults = w.res.filter((r) => r.type === 'rsv' && (r.props.diag ?? []).some((d: any) => lc(d.dest.workspace ?? '') === lc(ws) && d.resourceSpecific));
    if (!vaults.length) throw new SimError(`'AddonAzureBackupJobs' has no data in '${ws}'. Add a diagnostic setting on the Recovery Services vault that sends the Addon* categories to this workspace with --export-to-resource-specific true.`, 'SemanticError');
    return vaults.flatMap((v) => {
      const hist = Array.from({ length: 14 }, (_, k) => ({ TimeGenerated: `2026-11-${String(10 + k).padStart(2, '0')}T23:0${k % 6}:00Z`, ResourceId: v.name, BackupItemUniqueId: 'vm-sample-history', JobOperation: 'Backup', JobStatus: k === 6 ? 'Failed' : 'Completed', JobFailureCode: k === 6 ? 'UserErrorVmNotInDesirableState' : 'Success', DataTransferredInMB: 900 + k * 12 }));
      const real = (v.props.jobs ?? []).map((j: any) => ({ TimeGenerated: j.start, ResourceId: v.name, BackupItemUniqueId: j.item, JobOperation: j.op, JobStatus: j.status, JobFailureCode: 'Success', DataTransferredInMB: j.op === 'Backup' ? 1210 : 0 }));
      return [...hist, ...real];
    });
  }
  if (table === 'nwconnectionmonitortestresult') {
    const cms = (adm(w).cms ?? []) as any[];
    if (!cms.length || !cms.some((c) => lc(c.workspace) === lc(ws))) throw new SimError(`'NWConnectionMonitorTestResult' has no data in '${ws}'. Create a Connection monitor that sends its results to this workspace.`, 'SemanticError');
    return cms.filter((c) => lc(c.workspace) === lc(ws)).flatMap((c) => Array.from({ length: 8 }, (_, k) => { const ok = cmPass(w, c); return { TimeGenerated: ts(k), ConnectionMonitorResourceId: c.name, SourceName: c.src, DestinationName: c.dst, DestinationPort: c.port, TestResult: ok ? 'Pass' : 'Fail', ChecksFailedPercent: ok ? 0 : 100, AvgRoundTripTimeMs: ok ? 2 + (k % 3) : null }; }));
  }
  return w.res.filter((r) => toWs(r)).map((r) => ({ TimeGenerated: ts(0), Resource: r.name, MetricName: 'Percentage CPU', Average: r.props.cpu ?? 8 }));
}
/** A small KQL engine: where, summarize (count/avg/max/min/sum by cols, bin()), project, extend-free, order/sort, take/limit, render. */
function kql(w: World, ws: string, text: string) {
  const parts = text.split('|').map((s) => s.trim()).filter(Boolean);
  const table = lc(parts[0]);
  let rows = rowsFor(w, table, ws);
  const ops: string[] = [];
  let render = '';
  for (const part of parts.slice(1)) {
    const [op0, ...rest] = part.split(/\s+/);
    const op = lc(op0), arg = rest.join(' ');
    ops.push(op);
    if (op === 'where') {
      const conds = arg.split(/\s+and\s+/i);
      for (const c of conds) {
        const m = /^(\w+)\s*(==|!=|>=|<=|>|<|=~|contains|has|startswith)\s*(.+)$/i.exec(c.trim());
        if (!m) throw new SimError(`Couldn't read the where clause '${c}'. Try: where StatusCode >= 400`, 'SyntaxError');
        const [, col, o, raw] = m;
        const val = raw.trim().replace(/^["']|["']$/g, '');
        const num = Number(val);
        rows = rows.filter((r) => {
          const x = r[col];
          if (x === undefined) throw new SimError(`'where' operator: Failed to resolve column named '${col}'.`, 'SemanticError');
          switch (lc(o)) {
            case '==': return String(x) === val;
            case '!=': return String(x) !== val;
            case '=~': return lc(String(x)) === lc(val);
            case '>': return Number(x) > num;
            case '<': return Number(x) < num;
            case '>=': return Number(x) >= num;
            case '<=': return Number(x) <= num;
            case 'contains': case 'has': return lc(String(x)).includes(lc(val));
            default: return lc(String(x)).startsWith(lc(val));
          }
        });
      }
    } else if (op === 'summarize') {
      const m = /^(?:(\w+)\s*=\s*)?(count|avg|max|min|sum|dcount)\((\w*)\)(?:\s+by\s+(.+))?$/i.exec(arg);
      if (!m) throw new SimError(`Couldn't read '${part}'. Try: summarize count() by OperationName`, 'SyntaxError');
      const [, alias, fn, col, by] = m;
      const keys = (by ?? '').split(/,(?![^(]*\))/).map((s) => s.trim()).filter(Boolean);
      const keyOf = (r: Record<string, any>) => keys.map((k) => { const b = /^bin\((\w+),\s*(\d+)([mh])\)$/i.exec(k); if (!b) return [k, r[k]]; const ms = Number(b[2]) * (lc(b[3]) === 'h' ? 3600000 : 60000); return [b[1], new Date(Math.floor(Date.parse(r[b[1]]) / ms) * ms).toISOString().slice(0, 19) + 'Z']; });
      const groups = new Map<string, { key: [string, any][]; vals: any[] }>();
      for (const r of rows) { const k = keyOf(r) as [string, any][]; const id = JSON.stringify(k); if (!groups.has(id)) groups.set(id, { key: k, vals: [] }); groups.get(id)!.vals.push(col ? r[col] : 1); }
      const name = alias ?? `${lc(fn)}_${col}`.replace(/_$/, '_');
      rows = [...groups.values()].map((g) => {
        const nums = g.vals.map(Number);
        const v = lc(fn) === 'count' ? g.vals.length : lc(fn) === 'avg' ? Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2)) : lc(fn) === 'max' ? Math.max(...nums) : lc(fn) === 'min' ? Math.min(...nums) : lc(fn) === 'dcount' ? new Set(g.vals).size : nums.reduce((a, b) => a + b, 0);
        return { ...Object.fromEntries(g.key), [lc(fn) === 'count' && !alias ? 'count_' : name]: v };
      });
    } else if (op === 'project') {
      const cols = arg.split(',').map((s) => s.trim());
      rows = rows.map((r) => Object.fromEntries(cols.map((c) => [c, r[c]])));
    } else if (op === 'order' || op === 'sort') {
      const m = /^by\s+(\w+)(?:\s+(asc|desc))?/i.exec(arg);
      if (m) { const [, c, d] = m; const s = lc(d) === 'asc' ? 1 : -1; rows = [...rows].sort((a, b) => (a[c] > b[c] ? s : a[c] < b[c] ? -s : 0)); }
    } else if (op === 'take' || op === 'limit' || op === 'top') {
      rows = rows.slice(0, Number(/\d+/.exec(arg)?.[0] ?? 10));
    } else if (op === 'render') {
      render = `📈 (A ${arg || 'chart'} would be drawn here in the Logs blade.)`;
    } else if (op !== 'extend') throw new SimError(`'${op}' isn't supported in this practice workspace. Try where, summarize, project, order by, take and render.`, 'SyntaxError');
  }
  w.emit('adm.kql', { table, ops, rows: rows.length, ws, q: text });
  return { rows, render };
}
const kqlRun: Cmd = {
  extra: { '-w': '--workspace' },
  when: (p) => MY_TABLES.includes(tableOf(one(p, '--analytics-query') ?? '')),
  run: (p, w) => {
    req(p, [['--workspace', '-w'], ['--analytics-query', '']]);
    const ws = resolve(w, one(p, '--workspace'), ['law']).res.name;
    const { rows, render } = kql(w, ws, one(p, '--analytics-query')!);
    const cols = rows.length ? Object.keys(rows[0]) : [];
    return { out: [rows.length ? table(rows.slice(0, 40), cols) : '(no rows)', render].filter(Boolean).join('\n') };
  },
};

/* ---------------- action groups, alerts, processing rules ---------------- */
const RX_ARGS: Record<string, number> = { email: 2, sms: 3, voice: 3, webhook: 2, azureapppush: 2, armrole: 2, logicapp: 3, azurefunction: 4, eventhub: 4, itsm: 4, automationrunbook: 4 };
const agCreate: Cmd = {
  extra: { '-a': '--action' },
  run: (p, w) => {
    req(p, [['--resource-group', '-g'], ['--name', '-n']]);
    const short = one(p, '--short-name') ?? one(p, '--name')!.slice(0, 12);
    if (short.length > 12) throw new SimError(`--short-name '${short}' is ${short.length} characters. An action group short name can be at most 12 characters; it appears in SMS and email notifications.`, 'BadRequest');
    const toks = many(p, '--action');
    const receivers: { type: string; name: string; target: string }[] = [];
    for (let i = 0; i < toks.length;) {
      const type = lc(toks[i]); const n = RX_ARGS[type];
      if (!n) throw new SimError(`Unknown action type '${toks[i]}'. Use email, sms, voice, webhook, azureapppush, armrole, logicapp, azurefunction, eventhub or automationrunbook.`, 'BadRequest');
      receivers.push({ type, name: toks[i + 1], target: toks.slice(i + 2, i + 1 + n).join(' ') });
      i += 1 + n;
    }
    if (!receivers.length) throw new SimError('Add at least one --action, for example --action email ops ops@contoso.com', 'BadRequest');
    const ag = w.addRes('actiongroup', rgOf(p)!, one(p, '--name')!, { short, receivers, enabled: true }, { location: 'global' === lc(one(p, '--location')) ? undefined : one(p, '--location') });
    ag.location = 'global';
    ops(w).alerting = true;
    w.emit('adm.ag', { rg: ag.rg, name: ag.name, short, receivers: receivers.map((r) => r.type) });
    return out(p, { name: ag.name, groupShortName: short, enabled: true, location: 'Global', emailReceivers: receivers.filter((r) => r.type === 'email').map((r) => ({ name: r.name, emailAddress: r.target })), smsReceivers: receivers.filter((r) => r.type === 'sms').map((r) => ({ name: r.name, countryCode: r.target.split(' ')[0], phoneNumber: r.target.split(' ')[1] })), webhookReceivers: receivers.filter((r) => r.type === 'webhook').map((r) => ({ name: r.name, serviceUri: r.target, useCommonAlertSchema: true })) });
  },
};
const agList: Handler = (p, w) => {
  const rows = w.res.filter((r) => r.type === 'actiongroup' && (!rgOf(p) || lc(r.rg) === lc(rgOf(p)))).map((r) => ({ Name: r.name, ShortName: r.props.short, Receivers: r.props.receivers.map((x: any) => `${x.type}:${x.name}`).join(' '), Enabled: r.props.enabled }));
  return out(p, rows, rows, ['Name', 'ShortName', 'Receivers', 'Enabled']);
};
const agOf = (w: World, ref: string) => resolve(w, ref, ['actiongroup']).res;

/** `az monitor metrics alert create … --action <ag>`: only claimed when an action group is attached. */
const alertCreate: Cmd = {
  when: (p) => has(p, '--action') || has(p, '-a'),
  extra: { '-a': '--action' },
  run: (p, w) => {
    req(p, [['--resource-group', '-g'], ['--name', '-n'], ['--scopes', ''], ['--condition', '']]);
    const cond = one(p, '--condition')!;
    const m = /^(avg|average|max|maximum|min|minimum|total|count)\s+(.+?)\s*(>=|<=|>|<)\s*([\d.]+)/i.exec(cond);
    if (!m) throw new SimError('Use a condition like "avg Percentage CPU > 80".', 'BadRequest');
    const target = resolve(w, many(p, '--scopes')[0]).res;
    const groups = many(p, '--action').map((a) => agOf(w, a).name);
    const window = one(p, '--window-size') ?? '5m', freq = one(p, '--evaluation-frequency') ?? '1m', sev = Number(one(p, '--severity') ?? 2);
    let a: Res;
    if (target.type === 'vm') {
      if (!/percentage cpu/i.test(m[2])) throw new SimError('This practice VM reports the Percentage CPU metric. Try "avg Percentage CPU > 80".', 'BadRequest');
      a = w.createAlert(rgOf(p)!, one(p, '--name')!, target.name, Number(m[4]), 'cli');
    } else a = w.addRes('alert', rgOf(p)!, one(p, '--name')!, { target: target.name, metric: m[2], threshold: Number(m[4]), fired: 0 }, {});
    a.location = 'global';
    Object.assign(a.props, { actionGroups: groups, window, freq, severity: sev, targetType: target.type, metric: m[2] });
    ops(w).alerting = true;
    w.emit('adm.alert', { rg: a.rg, name: a.name, target: target.name, metric: m[2], threshold: Number(m[4]), actionGroups: groups, window, severity: sev });
    return out(p, { name: a.name, criteria: { allOf: [{ metricName: m[2], operator: m[3] === '>' ? 'GreaterThan' : m[3], threshold: Number(m[4]), timeAggregation: m[1] }] }, scopes: [target.id], severity: sev, windowSize: `PT${window.toUpperCase()}`, evaluationFrequency: `PT${freq.toUpperCase()}`, actions: groups.map((g) => ({ actionGroupId: g })), enabled: true });
  },
};

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
/** The practice clock for processing-rule schedules is Saturday 23:15. */
function aprActive(r: Res): boolean {
  if (!r.props.enabled) return false;
  const s = r.props.schedule;
  if (!s) return true;
  const mins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); };
  const nowMin = 23 * 60 + 15;
  const days = (s.days as string[]).map(lc);
  if (s.type === 'weekly' && days.length && !days.includes('saturday')) return false;
  if (!s.start || !s.end) return true;
  const a = mins(s.start), b = mins(s.end);
  return a <= b ? nowMin >= a && nowMin < b : nowMin >= a || nowMin < b;
}
const aprCreate: Cmd = {
  extra: { '-a': '--action-groups' },
  run: (p, w) => {
    req(p, [['--resource-group', '-g'], ['--name', '-n'], ['--scopes', ''], ['--rule-type', '']]);
    const type = one(p, '--rule-type')!;
    if (!/^(RemoveAllActionGroups|AddActionGroups)$/i.test(type)) throw new SimError("--rule-type must be 'AddActionGroups' or 'RemoveAllActionGroups'.", 'BadRequest');
    const groups = many(p, '--action-groups').map((a) => agOf(w, a).name);
    if (/^AddActionGroups$/i.test(type) && !groups.length) throw new SimError('An AddActionGroups rule needs --action-groups.', 'BadRequest');
    const rtype = lc(one(p, '--schedule-recurrence-type'));
    const schedule = rtype ? { type: rtype, days: many(p, '--schedule-recurrence').map((d) => (DAYS.find((x) => x.startsWith(lc(d).slice(0, 3))) ?? lc(d))), start: one(p, '--schedule-recurrence-start-time')?.slice(0, 5), end: one(p, '--schedule-recurrence-end-time')?.slice(0, 5), tz: one(p, '--schedule-time-zone') ?? 'UTC' } : undefined;
    const sev = many(p, '--filter-severity');
    const r = w.addRes('apr', rgOf(p)!, one(p, '--name')!, { type: /^remove/i.test(type) ? 'RemoveAllActionGroups' : 'AddActionGroups', groups, scopes: many(p, '--scopes'), schedule, severity: sev.slice(1), enabled: bool(p, '--enabled', true), description: one(p, '--description') ?? '' });
    r.location = 'global';
    ops(w).alerting = true;
    w.emit('adm.apr', { rg: r.rg, name: r.name, type: r.props.type, scopes: r.props.scopes, schedule: !!schedule, days: schedule?.days ?? [], groups, enabled: r.props.enabled });
    const active = aprActive(r);
    return { out: json({ name: r.name, properties: { actions: [{ actionType: r.props.type, actionGroupIds: groups.length ? groups : undefined }], scopes: r.props.scopes, schedule: schedule ? { recurrences: [{ recurrenceType: schedule.type, daysOfWeek: schedule.days, startTime: schedule.start, endTime: schedule.end }], timeZone: schedule.tz } : null, enabled: r.props.enabled } }) + `\nℹ Practice clock: ${ops(w).clock}. This rule is ${active ? 'ACTIVE now' : 'not active right now'}.` };
  },
};
const aprUpdate: Handler = (p, w) => {
  req(p, [['--resource-group', '-g'], ['--name', '-n']]);
  const r = w.need('apr', rgOf(p)!, one(p, '--name')!);
  w.assertWritable(r.rg, 'update alert processing rule');
  if (has(p, '--enabled')) r.props.enabled = bool(p, '--enabled', true);
  w.emit('adm.apr.update', { rg: r.rg, name: r.name, enabled: r.props.enabled });
  return out(p, { name: r.name, enabled: r.props.enabled });
};
const aprList: Handler = (p, w) => {
  const rows = w.res.filter((r) => r.type === 'apr').map((r) => ({ Name: r.name, Type: r.props.type, Enabled: r.props.enabled, Schedule: r.props.schedule ? `${r.props.schedule.type} ${r.props.schedule.days.join(',')} ${r.props.schedule.start}-${r.props.schedule.end}` : 'Always', ActiveNow: aprActive(r) }));
  return out(p, rows, rows, ['Name', 'Type', 'Enabled', 'Schedule', 'ActiveNow']);
};
const covers = (scopes: string[], a: Res) => scopes.some((s) => {
  const v = lc(s);
  if (v === `/subscriptions/${lc(SUB_ID)}` || v === lc(a.rg)) return true;
  return v.includes(`/resourcegroups/${lc(a.rg)}`) && (!v.includes('/providers/') || v.endsWith(`/${lc(a.props.target)}`));
});

/** Takes over `az vm run-command invoke` once the learner has action groups or processing rules, so the notification outcome is shown. */
const runCommand: Handler = (p, w) => {
  req(p, [['--resource-group', '-g'], ['--name', '-n'], ['--scripts', '']]);
  const script = one(p, '--scripts') ?? '';
  const busy = /stress|load|yes/i.test(script);
  const before = new Map(w.res.filter((r) => r.type === 'alert').map((a) => [a.id, a.props.fired ?? 0]));
  const vm = w.setLoad(rgOf(p)!, one(p, '--name')!, busy ? 95 : 10);
  const lines = [busy ? `CPU is now ${vm.props.cpu}%.` : `Script ran. CPU is ${vm.props.cpu}%.`];
  for (const a of w.res.filter((r) => r.type === 'alert' && (r.props.fired ?? 0) > (before.get(r.id) ?? 0))) {
    const aprs = w.res.filter((r) => r.type === 'apr' && aprActive(r) && covers(r.props.scopes, a) && (!r.props.severity?.length || r.props.severity.includes(`Sev${a.props.severity ?? 2}`)));
    const mute = aprs.find((r) => r.props.type === 'RemoveAllActionGroups');
    const groups = [...new Set([...(a.props.actionGroups ?? []), ...aprs.filter((r) => r.props.type === 'AddActionGroups').flatMap((r) => r.props.groups)])];
    lines.push(`🔔 Alert fired: ${a.name} (Sev${a.props.severity ?? 2}) · Percentage CPU ${vm.props.cpu}% > ${a.props.threshold}%`);
    if (mute) lines.push(`🔕 Notifications suppressed by alert processing rule '${mute.name}' (RemoveAllActionGroups). The alert is still listed in Monitor > Alerts.`);
    else if (!groups.length) lines.push('⚠ The alert fired, but no action group is attached, so nobody was told.');
    else for (const g of groups) { const ag = w.res.find((r) => r.type === 'actiongroup' && r.name === g); lines.push(`📣 Action group '${g}' notified: ${(ag?.props.receivers ?? []).map((x: any) => `${x.type} ${x.name}`).join(', ')}`); }
    w.emit('adm.alert.notify', { alert: a.name, vm: vm.name, suppressed: !!mute, by: mute?.name ?? '', groups: mute ? [] : groups });
  }
  return { out: json({ value: [{ code: 'ProvisioningState/succeeded', message: lines[0] }] }) + (lines.length > 1 ? '\n' + lines.slice(1).join('\n') : '') };
};

/* ---------------- VM insights (data collection rules) ---------------- */
const dcrCreate: Handler = (p, w) => {
  req(p, [['--resource-group', '-g'], ['--name', '-n']]);
  const file = one(p, '--rule-file') ?? '';
  const wsRef = one(p, '--workspace') ?? /workspace[=:]\s*(\S+)/i.exec(one(p, '--destinations') ?? '')?.[1];
  const law = wsRef ? resolve(w, wsRef, ['law']).res : w.res.find((r) => r.type === 'law' && lc(r.rg) === lc(rgOf(p)));
  if (!law) throw new SimError('No Log Analytics workspace found. Create one first, or pass --workspace <name>.', 'BadRequest');
  const kind = /vminsights|insights/i.test(file + one(p, '--name')) ? 'VMInsights' : 'Custom';
  const r = w.addRes('dcr', rgOf(p)!, one(p, '--name')!, { kind, workspace: law.name, assoc: [] }, { location: one(p, '--location') });
  w.emit('adm.dcr', { rg: r.rg, name: r.name, kind, workspace: law.name });
  return out(p, { name: r.name, kind: kind === 'VMInsights' ? 'Linux/Windows' : null, location: r.location, dataFlows: [{ streams: kind === 'VMInsights' ? ['Microsoft-InsightsMetrics'] : ['Microsoft-Perf', 'Microsoft-Syslog'], destinations: [law.name] }], provisioningState: 'Succeeded' });
};
const dcrAssoc: Handler = (p, w) => {
  req(p, [['--name', '-n'], ['--rule-id', ''], ['--resource', '']]);
  const dcr = resolve(w, one(p, '--rule-id'), ['dcr']).res;
  const vm = vmByRef(w, one(p, '--resource'));
  if (vm.location !== dcr.location) throw new SimError(`The data collection rule is in ${dcr.location} but the VM is in ${vm.location}. A DCR must be in the same region as the VMs it's associated with.`, 'BadRequest');
  dcr.props.assoc = [...new Set([...dcr.props.assoc, vm.name])];
  vm.props.ama = true;
  if (dcr.props.kind === 'VMInsights') vm.props.vmInsights = dcr.props.workspace;
  w.emit('adm.dcr.assoc', { dcr: dcr.name, vm: vm.name, kind: dcr.props.kind, workspace: dcr.props.workspace });
  return { out: json({ name: one(p, '--name'), dataCollectionRuleId: dcr.id, provisioningState: 'Succeeded' }) + `\nℹ The Azure Monitor Agent extension was installed on ${vm.name} for you. In real Azure, the portal's VM insights > Enable does this; from the CLI you'd also run 'az vm extension set --name AzureMonitorLinuxAgent --publisher Microsoft.Azure.Monitor'.` };
};

/* ---------------- Network Watcher: Connection monitor ---------------- */
function cmPass(w: World, c: any) {
  const dst = w.res.find((r) => r.type === 'vm' && r.name === c.dst);
  if (!dst) return c.dstAddress ? true : false;
  if (dst.props.power !== 'running') return false;
  const nsg = w.res.find((r) => r.type === 'nsg' && r.name === dst.props.nsg && r.rg === dst.rg);
  const rule = (nsg?.props.rules ?? []).filter((r: any) => lc(r.direction) === 'inbound' && (r.port === '*' || String(r.port).split(',').includes(String(c.port))) && (lc(r.protocol) === 'tcp' || r.protocol === '*' || lc(r.protocol) === 'any'))[0];
  return !rule || lc(rule.access) === 'allow';
}
const cmCreate: Handler = (p, w) => {
  req(p, [['--name', '-n'], ['--endpoint-source-resource-id', ''], ['--test-config-name', '']]);
  const src = vmByRef(w, one(p, '--endpoint-source-resource-id'));
  const dstRef = one(p, '--endpoint-dest-resource-id'), dstAddr = one(p, '--endpoint-dest-address');
  if (!dstRef && !dstAddr) throw new SimError('Add a destination: --endpoint-dest-resource-id (an Azure VM) or --endpoint-dest-address (an FQDN or IP).', 'MissingArgs');
  const dst = dstRef ? vmByRef(w, dstRef) : undefined;
  const loc = lc(one(p, '--location') ?? src.location);
  if (!w.rg('NetworkWatcherRG')) w.createRg('NetworkWatcherRG', loc, {}, 'cli');
  if (!w.find('netwatcher', 'NetworkWatcherRG', `NetworkWatcher_${loc}`)) w.addRes('netwatcher', 'NetworkWatcherRG', `NetworkWatcher_${loc}`, {}, { location: loc });
  const proto = lc(one(p, '--protocol') ?? 'tcp');
  const port = Number(one(p, '--tcp-port', '--http-port') ?? (proto === 'http' ? 80 : 443));
  const wsRef = many(p, '--workspace-ids')[0];
  const ws = wsRef ? resolve(w, wsRef, ['law']).res.name : '';
  const c = { name: one(p, '--name')!, src: src.name, dst: dst?.name ?? dstAddr!, dstAddress: dstAddr, port, protocol: proto, freq: Number(one(p, '--frequency') ?? 30), workspace: ws, location: loc };
  const list = (adm(w).cms ??= []) as any[];
  if (list.some((x) => lc(x.name) === lc(c.name))) throw new SimError(`Connection monitor '${c.name}' already exists in NetworkWatcher_${loc}.`, 'Conflict');
  list.push(c);
  src.props.nwAgent = true;
  w.emit('adm.cm.create', { name: c.name, src: c.src, dst: c.dst, port, protocol: proto, workspace: ws });
  return { out: json({ name: c.name, location: loc, endpoints: [{ name: c.src, type: 'AzureVM' }, { name: c.dst, type: dst ? 'AzureVM' : 'ExternalAddress' }], testConfigurations: [{ name: one(p, '--test-config-name'), protocol: proto.toUpperCase(), testFrequencySec: c.freq, tcpConfiguration: { port } }], outputs: ws ? [{ type: 'Workspace', workspaceSettings: { workspaceResourceId: ws } }] : [], provisioningState: 'Succeeded' }) + `\nℹ The Network Watcher Agent extension was added to ${src.name} so it can run the tests.` };
};
const cmShow: Handler = (p, w) => {
  req(p, [['--name', '-n']]);
  const c = ((adm(w).cms ?? []) as any[]).find((x) => lc(x.name) === lc(one(p, '--name')));
  if (!c) throw new SimError(`Connection monitor '${one(p, '--name')}' was not found.`, 'NotFound');
  const ok = cmPass(w, c);
  const dst = w.res.find((r) => r.type === 'vm' && r.name === c.dst);
  const nsg = dst && w.res.find((r) => r.type === 'nsg' && r.name === dst.props.nsg);
  const deny = !ok && nsg ? (nsg.props.rules ?? []).find((r: any) => lc(r.access) === 'deny') : undefined;
  w.emit('adm.cm.show', { name: c.name, status: ok ? 'Pass' : 'Fail' });
  const rows = [{ Source: c.src, Destination: `${c.dst}:${c.port}`, Protocol: c.protocol.toUpperCase(), ChecksFailedPct: ok ? 0 : 100, AvgRttMs: ok ? 2 : '-', Status: ok ? 'Pass' : 'Fail' }];
  return { out: table(rows, Object.keys(rows[0])) + (ok ? '' : `\n🔴 Hop 2 drops the traffic${deny ? `: NSG '${nsg!.name}' rule '${deny.name}' (priority ${deny.priority}) denies port ${deny.port}` : ''}. Use IP flow verify or NSG diagnostics to confirm.`) };
};
const cmList: Handler = (p, w) => {
  const rows = ((adm(w).cms ?? []) as any[]).map((c) => ({ Name: c.name, Source: c.src, Destination: c.dst, Port: c.port, Status: cmPass(w, c) ? 'Pass' : 'Fail' }));
  return out(p, rows, rows, ['Name', 'Source', 'Destination', 'Port', 'Status']);
};

/* ---------------- Azure Backup: Recovery Services vaults ---------------- */
const RED: Record<string, string> = { locallyredundant: 'LocallyRedundant', georedundant: 'GeoRedundant', zoneredundant: 'ZoneRedundant' };
const rsvOf = (p: Parsed, w: World) => w.need('rsv', rgOf(p) ?? '', one(p, '--vault-name', '--name') ?? '');
const defaultPolicies = () => [
  { name: 'DefaultPolicy', type: 'Standard', freq: 'Daily', time: '19:30', daily: 30, weekly: 0, instant: 2 },
  { name: 'EnhancedPolicy', type: 'Enhanced', freq: 'Hourly', time: '08:00', daily: 30, weekly: 0, instant: 7, every: 4 },
];
const vaultCreate: Handler = (p, w) => {
  req(p, [['--resource-group', '-g'], ['--name', '-n'], ['--location', '-l']]);
  const v = w.addRes('rsv', rgOf(p)!, one(p, '--name')!, { redundancy: 'GeoRedundant', crr: false, softDelete: 'Enabled', softDays: 14, items: [], policies: defaultPolicies(), jobs: [] }, { location: one(p, '--location') });
  w.emit('adm.rsv.create', { rg: v.rg, name: v.name, location: v.location });
  return out(p, { id: v.id, location: v.location, name: v.name, properties: { provisioningState: 'Succeeded', redundancySettings: { standardTierStorageRedundancy: 'GeoRedundant', crossRegionRestore: 'Disabled' }, securitySettings: { softDeleteSettings: { softDeleteState: 'Enabled', softDeleteRetentionPeriodInDays: 14 } } }, sku: { name: 'Standard' }, type: 'Microsoft.RecoveryServices/vaults' });
};
const vaultProps: Handler = (p, w) => {
  const v = rsvOf(p, w);
  w.assertWritable(v.rg, 'update vault properties');
  const red = one(p, '--backup-storage-redundancy');
  if (red) {
    const val = RED[lc(red)];
    if (!val) throw new SimError('--backup-storage-redundancy must be LocallyRedundant, GeoRedundant or ZoneRedundant.', 'BadRequest');
    if (v.props.items.length && val !== v.props.redundancy) throw emitBlocked(w, 'redundancy', `Storage redundancy can't be changed after items are protected in the vault. '${v.name}' already protects ${v.props.items.length} item(s). Set redundancy on a new, empty vault before you configure backup.`);
    v.props.redundancy = val;
  }
  if (has(p, '--cross-region-restore-flag')) {
    const on = bool(p, '--cross-region-restore-flag', false);
    if (on && v.props.redundancy !== 'GeoRedundant') throw new SimError('Cross Region Restore needs GeoRedundant storage.', 'BadRequest');
    v.props.crr = on;
  }
  const sd = one(p, '--soft-delete-feature-state');
  if (sd) { if (v.props.softDelete === 'AlwaysON' && !/always/i.test(sd)) throw new SimError('Soft delete is set to Always on, which is irreversible. It can\'t be turned off.', 'BadRequest'); v.props.softDelete = /always/i.test(sd) ? 'AlwaysON' : /^enable/i.test(sd) ? 'Enabled' : 'Disabled'; }
  if (one(p, '--soft-delete-duration')) { const d = Number(one(p, '--soft-delete-duration')); if (d < 14 || d > 180) throw new SimError('Soft delete retention must be 14 to 180 days.', 'BadRequest'); v.props.softDays = d; }
  w.emit('adm.rsv.props', { name: v.name, redundancy: v.props.redundancy, crr: v.props.crr, softDelete: v.props.softDelete, softDays: v.props.softDays });
  return out(p, { name: v.name, storageModelType: v.props.redundancy, crossRegionRestoreFlag: v.props.crr, softDeleteFeatureState: v.props.softDelete, softDeleteRetentionPeriodInDays: v.props.softDays });
};
const vaultShowProps: Handler = (p, w) => { const v = rsvOf(p, w); return out(p, { storageModelType: v.props.redundancy, crossRegionRestoreFlag: v.props.crr, softDeleteFeatureState: v.props.softDelete, softDeleteRetentionPeriodInDays: v.props.softDays }); };
const vaultDelete: Handler = (p, w) => {
  const v = rsvOf(p, w);
  if (v.props.items.length) throw emitBlocked(w, 'vault.delete', `Vault '${v.name}' can't be deleted while it has protected or soft-deleted items (${v.props.items.map((i: any) => `${i.name}: ${i.state}`).join(', ')}). Stop protection, delete the backup data, wait for soft delete to expire (or undelete and delete again), then delete the vault.`);
  w.deleteRes(v, 'cli');
  w.emit('adm.rsv.delete', { name: v.name });
  return { out: '' };
};

const policyRow = (x: any) => ({ Name: x.name, Type: x.type, Frequency: x.freq === 'Hourly' ? `Every ${x.every} h` : `Daily ${x.time}`, DailyRetentionDays: x.daily, WeeklyRetentionWeeks: x.weekly || '-', InstantRestoreDays: x.instant });
const policyList: Handler = (p, w) => { const v = rsvOf(p, w); const rows = v.props.policies.map(policyRow); return out(p, v.props.policies.map((x: any) => ({ name: x.name, properties: { backupManagementType: 'AzureIaasVM', policyType: x.type === 'Enhanced' ? 'V2' : 'V1' } })), rows, Object.keys(rows[0])); };
const policyShow: Handler = (p, w) => {
  const v = rsvOf(p, w);
  const x = v.props.policies.find((y: any) => lc(y.name) === lc(one(p, '--name', '-n') ?? ''));
  if (!x) throw new SimError(`Policy '${one(p, '--name')}' was not found in '${v.name}'.`, 'NotFound');
  return out(p, policyJson(x));
};
const policyJson = (x: any) => ({ name: x.name, properties: { backupManagementType: 'AzureIaasVM', policyType: x.type === 'Enhanced' ? 'V2' : 'V1', instantRpRetentionRangeInDays: x.instant, schedulePolicy: { scheduleRunFrequency: x.freq, scheduleRunTimes: [`2026-11-24T${x.time}:00Z`], hourlySchedule: x.every ? { interval: x.every } : undefined }, retentionPolicy: { dailySchedule: { retentionDuration: { count: x.daily, durationType: 'Days' } }, weeklySchedule: x.weekly ? { retentionDuration: { count: x.weekly, durationType: 'Weeks' } } : null }, timeZone: 'UTC' } });
function readPolicy(raw: string, name: string, base?: any) {
  const n = (re: RegExp) => { const m = re.exec(raw); return m ? Number(m[1]) : undefined; };
  const enhanced = /"policyType"\s*:\s*"V2"/i.test(raw) || /"scheduleRunFrequency"\s*:\s*"Hourly"/i.test(raw);
  const x = { ...(base ?? { type: 'Standard', freq: 'Daily', time: '19:30', daily: 30, weekly: 0, instant: 2 }), name };
  if (enhanced) { x.type = 'Enhanced'; x.freq = /"Hourly"/i.test(raw) ? 'Hourly' : 'Daily'; x.every = n(/"interval"\s*:\s*(\d+)/) ?? 4; }
  x.time = /"scheduleRunTimes"\s*:\s*\[\s*"[^"T]*T(\d\d:\d\d)/.exec(raw)?.[1] ?? /"time"\s*:\s*"(\d\d:\d\d)/.exec(raw)?.[1] ?? x.time;
  x.daily = n(/"dailySchedule"[\s\S]*?"count"\s*:\s*(\d+)/) ?? n(/"daily(?:RetentionDays)?"\s*:\s*(\d+)/) ?? x.daily;
  x.weekly = n(/"weeklySchedule"[\s\S]*?"count"\s*:\s*(\d+)/) ?? n(/"weekly(?:RetentionWeeks)?"\s*:\s*(\d+)/) ?? x.weekly;
  x.instant = n(/"instantRpRetentionRangeInDays"\s*:\s*(\d+)/) ?? x.instant;
  if (x.daily < 7 || x.daily > 9999) throw new SimError(`Daily retention must be 7 to 9999 days for Azure VM backup (you asked for ${x.daily}).`, 'BMSUserErrorInvalidPolicyInput');
  const maxInstant = x.type === 'Enhanced' ? 30 : 5;
  if (x.instant < 1 || x.instant > maxInstant) throw new SimError(`Instant restore snapshots can be kept 1 to ${maxInstant} days with a ${x.type} policy (you asked for ${x.instant}).`, 'BMSUserErrorInvalidPolicyInput');
  return x;
}
const policyCreate: Handler = (p, w) => {
  req(p, [['--resource-group', '-g'], ['--vault-name', ''], ['--name', '-n'], ['--policy', '']]);
  const v = rsvOf(p, w);
  w.assertWritable(v.rg, 'create backup policy');
  if (v.props.policies.some((x: any) => lc(x.name) === lc(one(p, '--name')))) throw new SimError(`Policy '${one(p, '--name')}' already exists. Use 'az backup policy set' to change it.`, 'Conflict');
  const x = readPolicy(one(p, '--policy')!, one(p, '--name')!);
  v.props.policies.push(x);
  w.emit('adm.backup.policy', { vault: v.name, name: x.name, type: x.type, time: x.time, daily: x.daily, weekly: x.weekly, instant: x.instant, op: 'create' });
  return out(p, policyJson(x));
};
const policySet: Handler = (p, w) => {
  req(p, [['--resource-group', '-g'], ['--vault-name', ''], ['--policy', '']]);
  const v = rsvOf(p, w);
  w.assertWritable(v.rg, 'update backup policy');
  const name = one(p, '--name') ?? /"name"\s*:\s*"([^"]+)"/.exec(one(p, '--policy')!)?.[1] ?? '';
  const i = v.props.policies.findIndex((x: any) => lc(x.name) === lc(name));
  if (i < 0) throw new SimError(`Policy '${name}' was not found. Pass --name or include "name" in the JSON.`, 'NotFound');
  const x = readPolicy(one(p, '--policy')!, v.props.policies[i].name, v.props.policies[i]);
  v.props.policies[i] = x;
  w.emit('adm.backup.policy', { vault: v.name, name: x.name, type: x.type, time: x.time, daily: x.daily, weekly: x.weekly, instant: x.instant, op: 'set' });
  return { out: json(policyJson(x)) + `\nℹ Every item that uses '${x.name}' (${v.props.items.filter((it: any) => it.policy === x.name).length}) now follows the new schedule and retention.` };
};

const itemOf = (p: Parsed, w: World, v: Res) => {
  const name = one(p, '--item-name', '--container-name') ?? '';
  const it = v.props.items.find((x: any) => lc(x.name) === lc(name));
  if (!it) throw new SimError(`Backup item '${name}' was not found in vault '${v.name}'. Run 'az backup item list -g ${v.rg} --vault-name ${v.name} -o table'.`, 'BMSUserErrorItemNotFound');
  return it;
};
const job = (w: World, v: Res, op: string, item: string, status = 'Completed') => {
  const j = { id: uuid(), op, item, status, start: now(), dur: op === 'Backup' ? '00:14:21' : op.startsWith('Restore') ? '00:22:05' : '00:00:31' };
  v.props.jobs.push(j);
  return j;
};
const enableVm: Handler = (p, w) => {
  req(p, [['--resource-group', '-g'], ['--vault-name', ''], ['--vm', ''], ['--policy-name', '']]);
  const v = rsvOf(p, w);
  const vm = vmByRef(w, one(p, '--vm'));
  if (vm.location !== v.location) throw emitBlocked(w, 'backup.region', `Vault '${v.name}' is in ${v.location} but VM '${vm.name}' is in ${vm.location}. To back up an Azure VM, the Recovery Services vault must be in the same region as the VM. Create a vault in ${vm.location}.`);
  const pol = v.props.policies.find((x: any) => lc(x.name) === lc(one(p, '--policy-name')));
  if (!pol) throw new SimError(`Policy '${one(p, '--policy-name')}' was not found in '${v.name}'. Run 'az backup policy list'.`, 'NotFound');
  const other = w.res.find((r) => r.type === 'rsv' && r !== v && r.props.items.some((i: any) => i.name === vm.name && i.state !== 'SoftDeleted'));
  if (other) throw new SimError(`VM '${vm.name}' is already protected by vault '${other.name}'. A VM can be backed up by only one vault at a time.`, 'BMSUserErrorAlreadyProtected');
  w.assertWritable(v.rg, 'configure protection');
  v.props.items.push({ name: vm.name, rg: vm.rg, policy: pol.name, state: 'Protected', rps: [] as any[], health: 'Passed' });
  job(w, v, 'ConfigureBackup', vm.name);
  w.emit('adm.backup.protect', { vault: v.name, vm: vm.name, policy: pol.name, rg: v.rg });
  return out(p, { name: vm.name, properties: { protectedItemType: 'Microsoft.Compute/virtualMachines', policyName: pol.name, protectionState: 'IRPending', lastBackupStatus: '', healthStatus: 'Passed' }, note: `The first backup runs at ${pol.time} UTC, or now with 'az backup protection backup-now'.` });
};
const backupNow: Handler = (p, w) => {
  req(p, [['--resource-group', '-g'], ['--vault-name', ''], ['--item-name', '']]);
  const v = rsvOf(p, w);
  const it = itemOf(p, w, v);
  if (it.state !== 'Protected') throw new SimError(`'${it.name}' is ${it.state}. Resume protection first.`, 'BMSUserErrorProtectionStopped');
  const n = it.rps.length + 1;
  const rp = { name: String(70000000000000 + n * 1111 + it.name.length), time: `2026-11-24T23:0${n}:00Z`, type: n === 1 ? 'AppConsistent' : 'CrashConsistent', tier: 'Snapshot and Vault-Standard' };
  it.rps.unshift(rp);
  const j = job(w, v, 'Backup', it.name);
  w.emit('adm.backup.now', { vault: v.name, item: it.name, rp: rp.name });
  return out(p, { name: j.id, properties: { activityId: j.id, entityFriendlyName: it.name, operation: 'Backup', status: 'InProgress', backupManagementType: 'AzureIaasVM' }, note: 'Phase 1 takes a snapshot (instant restore is ready in minutes). Phase 2 copies it to the vault.' });
};
const rpList: Handler = (p, w) => {
  const v = rsvOf(p, w);
  const it = itemOf(p, w, v);
  const value = it.rps.map((r: any) => ({ name: r.name, properties: { recoveryPointTime: r.time, recoveryPointType: r.type, recoveryPointTierDetails: r.tier } }));
  w.emit('adm.rp.list', { vault: v.name, item: it.name, count: it.rps.length });
  const qq = q(p, it.rps); if (qq) return qq;
  const rows = it.rps.map((r: any) => ({ Name: r.name, Time: r.time, Consistency: r.type, Tier: r.tier }));
  return out(p, value, rows, ['Name', 'Time', 'Consistency', 'Tier']);
};
const rpOf = (p: Parsed, it: any) => {
  const name = one(p, '--rp-name') ?? '';
  const rp = it.rps.find((r: any) => r.name === name);
  if (!rp) throw new SimError(`Recovery point '${name}' was not found for '${it.name}'. Run 'az backup recoverypoint list … -o table'.`, 'BMSUserErrorRecoveryPointNotFound');
  return rp;
};
const restoreDisks: Handler = (p, w) => {
  req(p, [['--resource-group', '-g'], ['--vault-name', ''], ['--item-name', ''], ['--rp-name', ''], ['--storage-account', '']]);
  const v = rsvOf(p, w);
  const it = itemOf(p, w, v);
  const rp = rpOf(p, it);
  const st = resolve(w, one(p, '--storage-account'), ['storage']).res;
  if (st.location !== v.location) throw new SimError(`The staging storage account must be in the vault's region (${v.location}). '${st.name}' is in ${st.location}.`, 'BMSUserErrorStorageAccountRegion');
  const modeRaw = lc(one(p, '--restore-mode') ?? 'alternatelocation');
  const targetVm = one(p, '--target-vm-name');
  let mode = modeRaw === 'originallocation' ? 'replace' : targetVm ? 'newvm' : 'disks';
  let extra = '';
  if (mode === 'replace') {
    const vm = w.need('vm', it.rg, it.name);
    w.assertWritable(vm.rg, 'replace disks');
    extra = `Replaced the disks of ${vm.name} with recovery point ${rp.name}. A snapshot of the old disks was kept first.`;
  } else if (mode === 'newvm') {
    const trg = one(p, '--target-resource-group') ?? it.rg;
    const src = w.res.find((r) => r.type === 'vm' && r.name === it.name);
    w.createVm({ rg: trg, name: targetVm!, image: src?.props.image ?? 'Ubuntu2204', size: src?.props.size, location: v.location }, 'cli');
    extra = `Created VM '${targetVm}' in ${trg} from recovery point ${rp.name}.`;
  } else {
    const trg = one(p, '--target-resource-group') ?? it.rg;
    w.needRg(trg);
    extra = `Restored managed disks for ${it.name} into ${trg}, plus a template (azuredeploy.json) in '${st.name}' you can deploy to build a VM.`;
  }
  const j = job(w, v, 'Restore', it.name);
  w.emit('adm.restore', { vault: v.name, item: it.name, mode, rp: rp.name, target: targetVm ?? '' });
  return { out: json({ name: j.id, properties: { entityFriendlyName: it.name, operation: 'Restore', status: 'InProgress' } }) + `\n${extra}` };
};
const mountRp: Handler = (p, w) => {
  req(p, [['--resource-group', '-g'], ['--vault-name', ''], ['--item-name', ''], ['--rp-name', '']]);
  const v = rsvOf(p, w);
  const it = itemOf(p, w, v);
  const rp = rpOf(p, it);
  job(w, v, 'Mount', it.name);
  w.emit('adm.restore', { vault: v.name, item: it.name, mode: 'files', rp: rp.name, target: '' });
  return { out: `File recovery script for ${it.name} (recovery point ${rp.name}) saved as ${it.name}_${rp.name.slice(-4)}_ILR.py.\nRun it on the VM (or any machine with the same OS family) to mount the recovery point as local drives:\n  /tmp/ilr/Volume1 -> OS disk\n  /tmp/ilr/Volume2 -> data disk\nCopy the files you need, then run 'az backup restore files unmount-rp'. The mount closes by itself after 12 hours.` };
};
const unmountRp: Handler = (p, w) => { const v = rsvOf(p, w); const it = itemOf(p, w, v); w.emit('adm.restore.unmount', { vault: v.name, item: it.name }); return { out: 'Recovery point unmounted.' }; };
const jobList: Handler = (p, w) => {
  const v = rsvOf(p, w);
  const rows = [...v.props.jobs].reverse().map((j: any) => ({ Name: j.id.slice(0, 8), Operation: j.op, Status: j.status, Item: j.item, StartTime: j.start, Duration: j.dur }));
  w.emit('adm.jobs', { vault: v.name, count: rows.length });
  return out(p, v.props.jobs, rows, ['Name', 'Operation', 'Status', 'Item', 'StartTime', 'Duration']);
};
const itemList: Handler = (p, w) => {
  const v = rsvOf(p, w);
  const rows = v.props.items.map((i: any) => ({ Name: i.name, Policy: i.policy || '-', State: i.state, LastBackup: i.rps[0]?.time ?? '-', RecoveryPoints: i.rps.length, Health: i.health }));
  w.emit('adm.items', { vault: v.name, states: v.props.items.map((i: any) => i.state) });
  return out(p, v.props.items, rows, ['Name', 'Policy', 'State', 'LastBackup', 'RecoveryPoints', 'Health']);
};
const disable: Handler = (p, w) => {
  req(p, [['--resource-group', '-g'], ['--vault-name', ''], ['--item-name', '']]);
  const v = rsvOf(p, w);
  const it = itemOf(p, w, v);
  w.assertWritable(v.rg, 'stop protection');
  const del = bool(p, '--delete-backup-data', false);
  const go = (): AdminOut => {
    if (!del) { it.state = 'ProtectionStopped'; w.emit('adm.backup.stop', { vault: v.name, item: it.name }); return { out: `Protection stopped for ${it.name}. Existing recovery points are kept until you delete them.` }; }
    if (v.props.softDelete === 'Disabled') { v.props.items = v.props.items.filter((x: any) => x !== it); w.emit('adm.backup.purge', { vault: v.name, item: it.name }); return { out: `⚠ Soft delete is off, so the backup data for ${it.name} was deleted permanently.` }; }
    it.state = 'SoftDeleted';
    w.emit('adm.backup.softdelete', { vault: v.name, item: it.name, days: v.props.softDays });
    return { out: `Backup data for ${it.name} is soft-deleted. It's kept for ${v.props.softDays} more days at no cost and can be undeleted until then.` };
  };
  return go();
};
const undelete: Handler = (p, w) => {
  req(p, [['--resource-group', '-g'], ['--vault-name', ''], ['--item-name', '']]);
  const v = rsvOf(p, w);
  const it = itemOf(p, w, v);
  if (it.state !== 'SoftDeleted') throw new SimError(`'${it.name}' isn't soft-deleted (state: ${it.state}).`, 'BadRequest');
  it.state = 'ProtectionStopped';
  w.emit('adm.backup.undelete', { vault: v.name, item: it.name });
  return { out: `${it.name} is undeleted with all ${it.rps.length} recovery point(s). Protection is stopped: resume it with 'az backup protection resume -g ${v.rg} --vault-name ${v.name} -c ${it.name} -i ${it.name} --policy-name ${it.policy}'.` };
};
const resume: Handler = (p, w) => {
  req(p, [['--resource-group', '-g'], ['--vault-name', ''], ['--item-name', ''], ['--policy-name', '']]);
  const v = rsvOf(p, w);
  const it = itemOf(p, w, v);
  if (it.state === 'SoftDeleted') throw new SimError(`'${it.name}' is soft-deleted. Undelete it first.`, 'BadRequest');
  it.state = 'Protected'; it.policy = one(p, '--policy-name')!;
  w.emit('adm.backup.resume', { vault: v.name, item: it.name, policy: it.policy });
  return out(p, { name: it.name, protectionState: 'Protected', policyName: it.policy });
};

/* ---------------- Azure Backup: Backup vaults (Data Protection) ---------------- */
const bvOf = (p: Parsed, w: World) => w.need('bvault', rgOf(p) ?? '', one(p, '--vault-name') ?? '');
const dsType = (s?: string) => { const v = lc(s); if (v.includes('blob')) return 'AzureBlob'; if (v.includes('disk')) return 'AzureDisk'; if (v.includes('postgres')) return 'AzureDatabaseForPostgreSQLFlexibleServer'; if (v.includes('kubernetes') || v.includes('aks')) return 'AzureKubernetesService'; return ''; };
const bvCreate: Handler = (p, w) => {
  req(p, [['--resource-group', '-g'], ['--vault-name', ''], ['--storage-setting', '']]);
  const ss = one(p, '--storage-setting')!;
  const red = /zone/i.test(ss) ? 'ZoneRedundant' : /geo/i.test(ss) ? 'GeoRedundant' : 'LocallyRedundant';
  const v = w.addRes('bvault', rgOf(p)!, one(p, '--vault-name')!, { redundancy: red, identity: lc(one(p, '--type') ?? 'SystemAssigned'), policies: [] as any[], instances: [] as any[], msi: [] as string[] }, { location: one(p, '--location') });
  w.emit('adm.bvault.create', { rg: v.rg, name: v.name, redundancy: red, location: v.location });
  return out(p, { id: v.id, name: v.name, location: v.location, identity: { type: 'SystemAssigned', principalId: `${hex(8)}-${hex(4)}-4${hex(3)}-a${hex(3)}-${hex(12)}` }, properties: { storageSettings: [{ datastoreType: 'VaultStore', type: red }], securitySettings: { softDeleteSettings: { state: 'On', retentionDurationInDays: 14 } }, provisioningState: 'Succeeded' }, type: 'Microsoft.DataProtection/backupVaults' });
};
const bpTemplate: Handler = (p, w) => {
  req(p, [['--datasource-type', '']]);
  const t = dsType(one(p, '--datasource-type'));
  if (!t) throw new SimError('--datasource-type must be AzureBlob, AzureDisk, AzureDatabaseForPostgreSQLFlexibleServer or AzureKubernetesService.', 'BadRequest');
  w.emit('adm.bpolicy.template', { type: t });
  return { out: json(t === 'AzureBlob'
    ? { datasourceTypes: ['Microsoft.Storage/storageAccounts/blobServices'], objectType: 'BackupPolicy', policyRules: [{ name: 'Default', objectType: 'AzureRetentionRule', isDefault: true, lifecycles: [{ deleteAfter: { duration: 'P30D', objectType: 'AbsoluteDeleteOption' }, sourceDataStore: { dataStoreType: 'OperationalStore' } }] }] }
    : { datasourceTypes: [t === 'AzureDisk' ? 'Microsoft.Compute/disks' : t], objectType: 'BackupPolicy', policyRules: [{ name: 'BackupHourly', objectType: 'AzureBackupRule', trigger: { schedule: { repeatingTimeIntervals: ['R/2026-11-24T23:00:00+00:00/P1D'] } } }, { name: 'Default', objectType: 'AzureRetentionRule', isDefault: true, lifecycles: [{ deleteAfter: { duration: 'P7D', objectType: 'AbsoluteDeleteOption' }, sourceDataStore: { dataStoreType: 'OperationalStore' } }] }] }) + '\nSave this as a file, edit the retention, then pass it to az dataprotection backup-policy create --policy <file>.' };
};
const bpCreate: Handler = (p, w) => {
  req(p, [['--resource-group', '-g'], ['--vault-name', ''], ['--name', '-n'], ['--policy', '']]);
  const v = bvOf(p, w);
  const raw = one(p, '--policy')!;
  const t = dsType(raw) || dsType(one(p, '--name'));
  if (!t) throw new SimError('Couldn\'t tell which data source the policy is for. Start from az dataprotection backup-policy get-default-policy-template --datasource-type AzureBlob (or AzureDisk) and save it as a file named for it, such as blob-policy.json.', 'BadRequest');
  const days = Number(/P(\d+)D/.exec(raw)?.[1] ?? (t === 'AzureBlob' ? 30 : 7));
  w.assertWritable(v.rg, 'create backup policy');
  v.props.policies.push({ name: one(p, '--name'), type: t, days });
  w.emit('adm.bpolicy', { vault: v.name, name: one(p, '--name'), type: t, days });
  return out(p, { name: one(p, '--name'), properties: { datasourceTypes: [t], objectType: 'BackupPolicy' }, retentionDays: days });
};
const biInit: Handler = (p, w) => {
  req(p, [['--datasource-type', ''], ['--datasource-id', ''], ['--datasource-location', ''], ['--policy-id', '']]);
  const t = dsType(one(p, '--datasource-type'));
  const src = resolve(w, one(p, '--datasource-id'), t === 'AzureDisk' ? ['disk'] : ['storage']).res;
  const polName = one(p, '--policy-id')!.split('/').pop()!;
  ops(w).biPending = { type: t, src: src.name, srcRg: src.rg, policy: polName };
  w.emit('adm.bi.init', { type: t, src: src.name, policy: polName });
  return { out: json({ datasourceInfo: { datasourceType: t, resourceID: src.id, resourceName: src.name, resourceLocation: one(p, '--datasource-location') }, policyInfo: { policyId: polName }, objectType: 'BackupInstance' }) + '\nSave this output as backup_instance.json and pass it to az dataprotection backup-instance create.' };
};
const biMsi: Handler = (p, w) => {
  req(p, [['--resource-group', '-g'], ['--vault-name', ''], ['--datasource-type', '']]);
  const v = bvOf(p, w);
  const pend = ops(w).biPending;
  if (!pend) throw new SimError('Run az dataprotection backup-instance initialize first so the command knows the data source.', 'BadRequest');
  const role = pend.type === 'AzureBlob' ? 'Storage Account Backup Contributor' : 'Disk Backup Reader (on the disk) and Disk Snapshot Contributor (on the snapshot resource group)';
  v.props.msi = [...new Set([...v.props.msi, pend.src])];
  w.emit('adm.bi.msi', { vault: v.name, src: pend.src, role });
  return { out: `Assigned ${role} to the managed identity of '${v.name}' for '${pend.src}'.` };
};
const biCreate: Handler = (p, w) => {
  req(p, [['--resource-group', '-g'], ['--vault-name', ''], ['--backup-instance', '']]);
  const v = bvOf(p, w);
  const pend = ops(w).biPending;
  if (!pend) throw new SimError('Run az dataprotection backup-instance initialize first and save its output as the --backup-instance file.', 'BadRequest');
  if (!v.props.policies.some((x: any) => lc(x.name) === lc(pend.policy))) throw new SimError(`Backup policy '${pend.policy}' was not found in '${v.name}'.`, 'NotFound');
  if (!v.props.msi.includes(pend.src)) throw emitBlocked(w, 'bi.permission', `UserErrorMissingRequiredPermissions: the Backup vault's managed identity can't read '${pend.src}'. Give it the ${pend.type === 'AzureBlob' ? 'Storage Account Backup Contributor' : 'Disk Backup Reader'} role, for example with az dataprotection backup-instance update-msi-permissions.`);
  const inst = { name: `${pend.src}-${pend.src}`, type: pend.type, src: pend.src, policy: pend.policy, state: 'ProtectionConfigured' };
  v.props.instances.push(inst);
  w.emit('adm.bi.create', { vault: v.name, src: pend.src, type: pend.type, policy: pend.policy });
  return out(p, { name: inst.name, properties: { dataSourceInfo: { datasourceType: pend.type, resourceName: pend.src }, policyInfo: { policyId: pend.policy }, protectionStatus: { status: 'ProtectionConfigured' }, currentProtectionState: 'ProtectionConfigured' } });
};
const biList: Handler = (p, w) => { const v = bvOf(p, w); const rows = v.props.instances.map((i: any) => ({ Name: i.name, DatasourceType: i.type, Policy: i.policy, State: i.state })); return out(p, v.props.instances, rows, ['Name', 'DatasourceType', 'Policy', 'State']); };

/* ---------------- Site Recovery (practice shortcuts) ---------------- */
const asrItems = (w: World) => (ops(w).asr ??= {}) as Record<string, any>;
const asrItem = (p: Parsed, w: World) => {
  const v = rsvOf(p, w);
  const it = asrItems(w)[`${lc(v.name)}/${lc(one(p, '--name') ?? '')}`];
  if (!it) throw new SimError(`Replicated item '${one(p, '--name')}' was not found in vault '${v.name}'. Enable replication first.`, 'NotFound');
  return { v, it };
};
const asrEnable: Handler = (p, w) => {
  req(p, [['--resource-group', '-g'], ['--vault-name', ''], ['--name', '-n'], ['--source-vm-id', '']]);
  const v = rsvOf(p, w);
  const vm = vmByRef(w, one(p, '--source-vm-id'));
  if (vm.location === v.location) throw emitBlocked(w, 'asr.region', `Vault '${v.name}' is in ${v.location}, the same region as '${vm.name}'. For Azure-to-Azure disaster recovery, put the Recovery Services vault in the TARGET region (for example West US 2), not next to the VM you're protecting.`);
  const key = `${lc(v.name)}/${lc(one(p, '--name'))}`;
  if (asrItems(w)[key]) throw new SimError(`'${vm.name}' is already replicating to ${v.location}.`, 'Conflict');
  w.assertWritable(v.rg, 'enable replication');
  const targetRg = one(p, '--target-resource-group') ?? `${vm.rg}-asr`;
  if (!w.rg(targetRg)) w.createRg(targetRg, v.location, {}, 'cli');
  asrItems(w)[key] = { name: one(p, '--name'), vm: vm.name, vmRg: vm.rg, from: vm.location, to: v.location, targetRg, state: 'Protected', health: 'Normal', rpo: '4 min', policy: one(p, '--policy-name') ?? '24-hour-retention-policy', test: '' };
  w.emit('adm.asr.enable', { vault: v.name, vm: vm.name, from: vm.location, to: v.location });
  return { out: json({ name: one(p, '--name'), properties: { friendlyName: vm.name, protectionState: 'Protected', replicationHealth: 'Normal', primaryFabricFriendlyName: vm.location, recoveryFabricFriendlyName: v.location, policyFriendlyName: asrItems(w)[key].policy, providerSpecificDetails: { instanceType: 'A2A', recoveryAzureResourceGroupId: targetRg, rpoInSeconds: 240 } } }) + `\nInitial replication finished. Changes now replicate continuously from ${vm.location} to ${v.location}: crash-consistent points every 5 minutes, app-consistent every 4 hours, kept 24 hours.\n${SHORTCUT}` };
};
const asrShow: Handler = (p, w) => {
  const { it } = asrItem(p, w);
  const rows = [{ Name: it.name, Source: it.from, Target: it.to, State: it.state, Health: it.health, RPO: it.rpo, TestFailover: it.test || '-' }];
  w.emit('adm.asr.show', { name: it.name, state: it.state });
  return out(p, it, rows, Object.keys(rows[0]));
};
const asrList: Handler = (p, w) => { const v = rsvOf(p, w); const rows = Object.values(asrItems(w)).filter((i: any) => lc(i.to) === lc(v.location)).map((i: any) => ({ Name: i.name, Source: i.from, Target: i.to, State: i.state })); return out(p, rows, rows, ['Name', 'Source', 'Target', 'State']); };
const asrTest: Handler = (p, w) => {
  req(p, [['--network-id', '']]);
  const { v, it } = asrItem(p, w);
  if (!/^(Protected|Reprotected)$/.test(it.state)) throw new SimError(`Test failover needs a healthy replicated item. '${it.name}' is ${it.state}.`, 'BadRequest');
  if (it.test) throw new SimError(`A test failover for '${it.name}' is still running. Run test-failover-cleanup first.`, 'BadRequest');
  const net = resolve(w, one(p, '--network-id'), ['vnet']).res;
  if (net.location !== it.to) throw new SimError(`The test network must be in the target region (${it.to}). '${net.name}' is in ${net.location}.`, 'BadRequest');
  const name = `${it.vm}-test`;
  w.createVm({ rg: net.rg, name, image: 'Ubuntu2204', location: it.to }, 'cli');
  it.test = name;
  w.emit('adm.asr.test', { vault: v.name, item: it.name, network: net.name, vm: name });
  return { out: `Test failover started from the latest processed recovery point.\nCreated '${name}' in ${net.name} (${it.to}). Production keeps running and replicating; nothing in ${it.from} changed.\nWhen you've checked the app, run test-failover-cleanup.` };
};
const asrCleanup: Handler = (p, w) => {
  const { v, it } = asrItem(p, w);
  if (!it.test) throw new SimError(`There's no test failover to clean up for '${it.name}'.`, 'BadRequest');
  const vm = w.res.find((r) => r.type === 'vm' && r.name === it.test);
  if (vm) w.deleteVm(vm.rg, vm.name, 'cli');
  w.emit('adm.asr.cleanup', { vault: v.name, item: it.name, notes: one(p, '--comments') ?? '' });
  it.test = '';
  return { out: `Test failover cleaned up: '${vm?.name ?? 'test VM'}' was deleted.` };
};
const asrFailover: Handler = (p, w) => {
  const { v, it } = asrItem(p, w);
  if (!/^(Protected|Reprotected)$/.test(it.state)) throw new SimError(`'${it.name}' is ${it.state}; it can't fail over now.`, 'BadRequest');
  const dir = lc(one(p, '--failover-direction') ?? 'primarytorecovery');
  const src = w.res.find((r) => r.type === 'vm' && r.name === it.vm && lc(r.location) === lc(it.from));
  if (src && src.props.power === 'running') w.powerVm(src.rg, src.name, 'deallocate', 'cli');
  if (!w.find('vm', it.targetRg, it.vm)) w.createVm({ rg: it.targetRg, name: it.vm, image: src?.props.image ?? 'Ubuntu2204', size: src?.props.size, location: it.to }, 'cli');
  it.state = 'FailedOver';
  w.emit('adm.asr.failover', { vault: v.name, item: it.name, to: it.to, direction: dir, planned: has(p, '--planned') });
  return { out: `Failover to ${it.to} succeeded using the latest processed recovery point. '${it.vm}' is running in ${it.targetRg}.\nNext: failover-commit to make it final (you can still pick a different recovery point before you commit), then reprotect.\n${SHORTCUT}` };
};
const asrCommit: Handler = (p, w) => {
  const { v, it } = asrItem(p, w);
  if (it.state !== 'FailedOver') throw emitBlocked(w, 'asr.commit', `Commit only applies after a failover. '${it.name}' is ${it.state}.`);
  it.state = 'FailoverCommitted';
  w.emit('adm.asr.commit', { vault: v.name, item: it.name });
  return { out: 'Failover committed. The other recovery points were removed and you can no longer change the recovery point. Run reprotect to start replicating back.' };
};
const asrReprotect: Handler = (p, w) => {
  const { v, it } = asrItem(p, w);
  if (it.state !== 'FailoverCommitted') throw new SimError(`Commit the failover before you reprotect. '${it.name}' is ${it.state}.`, 'BadRequest');
  it.state = 'Reprotected'; [it.from, it.to] = [it.to, it.from]; it.health = 'Normal';
  w.emit('adm.asr.reprotect', { vault: v.name, item: it.name, from: it.from, to: it.to });
  return { out: `Re-protect started: '${it.vm}' now replicates from ${it.from} back to ${it.to}. When ${it.to} is healthy, fail back the same way, then reprotect again.` };
};

/* ---------------- command table ---------------- */
const SR = 'site-recovery protected-item';
const T: Record<string, Cmd | Handler> = {
  'monitor metrics list': metricsList,
  'monitor metrics list-definitions': metricDefs,
  'monitor metrics alert create': alertCreate,
  'monitor diagnostic-settings create': diagCreate,
  'monitor diagnostic-settings list': diagList,
  'monitor diagnostic-settings categories list': diagCats,
  'monitor diagnostic-settings subscription create': diagSub,
  'monitor activity-log list': activity,
  'monitor log-analytics query': kqlRun,
  'monitor action-group create': agCreate,
  'monitor action-group list': agList,
  'monitor alert-processing-rule create': aprCreate,
  'monitor alert-processing-rule update': aprUpdate,
  'monitor alert-processing-rule list': aprList,
  'monitor data-collection rule create': dcrCreate,
  'monitor data-collection rule association create': dcrAssoc,
  'network watcher connection-monitor create': cmCreate,
  'network watcher connection-monitor show': cmShow,
  'network watcher connection-monitor list': cmList,
  'backup vault create': vaultCreate,
  'backup vault delete': vaultDelete,
  'backup vault backup-properties set': vaultProps,
  'backup vault backup-properties show': vaultShowProps,
  'backup policy list': policyList,
  'backup policy show': policyShow,
  'backup policy create': policyCreate,
  'backup policy set': policySet,
  'backup protection enable-for-vm': enableVm,
  'backup protection backup-now': { run: backupNow, extra: { '-c': '--container-name', '-i': '--item-name' } },
  'backup protection disable': { run: disable, extra: { '-c': '--container-name', '-i': '--item-name' } },
  'backup protection undelete': { run: undelete, extra: { '-c': '--container-name', '-i': '--item-name' } },
  'backup protection resume': { run: resume, extra: { '-c': '--container-name', '-i': '--item-name' } },
  'backup item list': itemList,
  'backup recoverypoint list': { run: rpList, extra: { '-c': '--container-name', '-i': '--item-name' } },
  'backup restore restore-disks': { run: restoreDisks, extra: { '-c': '--container-name', '-i': '--item-name', '-r': '--rp-name' } },
  'backup restore files mount-rp': { run: mountRp, extra: { '-c': '--container-name', '-i': '--item-name', '-r': '--rp-name' } },
  'backup restore files unmount-rp': { run: unmountRp, extra: { '-c': '--container-name', '-i': '--item-name' } },
  'backup job list': jobList,
  'dataprotection backup-vault create': bvCreate,
  'dataprotection backup-policy get-default-policy-template': bpTemplate,
  'dataprotection backup-policy create': bpCreate,
  'dataprotection backup-instance initialize': biInit,
  'dataprotection backup-instance update-msi-permissions': biMsi,
  'dataprotection backup-instance create': biCreate,
  'dataprotection backup-instance list': biList,
  [`${SR} create`]: asrEnable,
  [`${SR} show`]: asrShow,
  [`${SR} list`]: asrList,
  [`${SR} test-failover`]: asrTest,
  [`${SR} test-failover-cleanup`]: asrCleanup,
  [`${SR} unplanned-failover`]: asrFailover,
  [`${SR} planned-failover`]: (p, w) => { p.flags['--planned'] = ['true']; return asrFailover(p, w); },
  [`${SR} failover-commit`]: asrCommit,
  [`${SR} reprotect`]: asrReprotect,
};

export function az(tokens: string[], w: World): AdminOut | null {
  const words = parse(tokens).words.slice(0, 3).join(' ');
  if (words === 'vm run-command invoke' && ops(w).alerting) return run({ 'vm run-command invoke': runCommand }, tokens, w);
  return run(T, tokens, w);
}
export function shell(_tokens: string[], _w: World): AdminOut | null { return null; }
export const COMPLETIONS: string[] = Object.keys(T).map((k) => `az ${k}`);
