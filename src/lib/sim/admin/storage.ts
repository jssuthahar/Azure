/**
 * AZ-104 "storage" Cloud Shell commands (EDUCATION ONLY): the storage
 * firewall, access keys, SAS tokens and stored access policies, encryption,
 * redundancy conversion and failover, object replication, blob soft delete
 * and versioning, lifecycle rules, Azure Files shares with snapshots and soft
 * delete, identity-based access for Azure Files, and AzCopy.
 *
 * Paths the base CLI already knows (storage account create/update, container
 * create, blob upload/list/set-tier) are only claimed through `when`, when a
 * flag or account setting this module owns is involved (a Deny firewall, a
 * SAS token, versioning…). Everything else returns null.
 */
import type { World } from '../world';
import { run, one, has, bool, req, lc, json, now, hex, uuid, adm, out, SimError, SUB_ID, type AdminOut, type Parsed, type Cmd, type Res } from './kit';

/** The simulated Cloud Shell's public IP (a documentation range, never a real address). */
export const SHELL_IP = '203.0.113.25';
const SV = '2022-11-02';
const DAY = 864e5;
const Z_SKUS = ['Standard_ZRS', 'Standard_GZRS'];
const GEO_SKUS = ['Standard_GRS', 'Standard_RAGRS', 'Standard_GZRS'];
const PAIR: Record<string, string> = { eastus: 'westus', westus2: 'westcentralus', northeurope: 'westeurope', westeurope: 'northeurope', uksouth: 'ukwest', centralindia: 'southindia', southeastasia: 'eastasia', japaneast: 'japanwest', australiaeast: 'australiasoutheast', brazilsouth: 'southcentralus' };
const LOCAL: Record<string, string[]> = { 'hr-docs': ['handbook.pdf', 'leave-policy.docx', 'payroll-2026.xlsx'] };
const SHARE_ROLES = /^Storage File Data (SMB Share (Reader|Contributor|Elevated Contributor)|SMB Admin|Privileged (Reader|Contributor))$/i;
const SHARE_PERMS = ['None', 'StorageFileDataSmbShareReader', 'StorageFileDataSmbShareContributor', 'StorageFileDataSmbShareElevatedContributor'];

export const FILES: Record<string, string> = {
  'lifecycle.json': `{
  "rules": [
    {
      "enabled": true,
      "name": "age-out-invoices",
      "type": "Lifecycle",
      "definition": {
        "filters": { "blobTypes": [ "blockBlob" ], "prefixMatch": [ "invoices/" ] },
        "actions": {
          "baseBlob": {
            "tierToCool":    { "daysAfterModificationGreaterThan": 30 },
            "tierToCold":    { "daysAfterModificationGreaterThan": 90 },
            "tierToArchive": { "daysAfterModificationGreaterThan": 180 },
            "delete":        { "daysAfterModificationGreaterThan": 2555 }
          },
          "version": { "delete": { "daysAfterCreationGreaterThan": 90 } }
        }
      }
    }
  ]
}`,
};

/* ------------------------------------------------------------------ */
/* Per-account state                                                   */
/* ------------------------------------------------------------------ */
interface Ver { id: string; size: number; tier: string }
interface Sas { account: string; kind: 'service' | 'account' | 'user'; container?: string; blob?: string; perms: string; expiry?: string; policy?: string; keyName?: 'key1' | 'key2'; keyGen?: number; udGen?: number; signer?: string; https: boolean }
interface X {
  net: { defaultAction: 'Allow' | 'Deny'; bypass: string[]; ip: string[]; vnet: string[] };
  keys: { key1: string; key2: string; gen1: number; gen2: number; expDays?: number; created1: string; created2: string };
  sharedKey: boolean; publicBlob: boolean; tls: string; https: boolean; crossTenant: boolean;
  identity?: string;
  enc: { source: 'Microsoft.Storage' | 'Microsoft.Keyvault'; vault?: string; key?: string; version?: string; infra: boolean; scopes: string[] };
  files: { auth: 'None' | 'AADKERB' | 'AD' | 'AADDS'; share: string; domain?: string };
  blob: { deleteDays: number; containerDays: number; versioning: boolean; changeFeed: boolean; lastAccess: boolean; restoreDays: number };
  shareDays: number;
  policies: Record<string, Record<string, { permissions?: string; expiry?: string; start?: string }>>;
  shares: Record<string, { quota: number; tier: string; protocol: string; snapshots: string[] }>;
  deletedShares: { name: string; version: string; quota: number; tier: string; protocol: string; snapshots: string[]; at: string }[];
  deletedBlobs: Record<string, { name: string; tier: string; size: number; at: string; versionId?: string }[]>;
  versions: Record<string, Ver[]>;
  deletedContainers: { name: string; version: string; blobs: any[]; at: string }[];
  lifecycle?: any;
  udGen: number;
  primary?: string;
}
const st$ = (w: World) => ((adm(w).storage ??= { acct: {} as Record<string, X>, sas: {} as Record<string, Sas>, azLogin: '' as string }) as { acct: Record<string, X>; sas: Record<string, Sas>; azLogin: string });
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const b64 = (n: number) => Array.from({ length: n }, () => B64[Math.floor(Math.random() * 64)]).join('') + '==';

function X0(): X {
  return {
    net: { defaultAction: 'Allow', bypass: ['AzureServices'], ip: [], vnet: [] },
    keys: { key1: b64(86), key2: b64(86), gen1: 1, gen2: 1, created1: now(), created2: now() },
    sharedKey: true, publicBlob: false, tls: 'TLS1_2', https: true, crossTenant: false,
    enc: { source: 'Microsoft.Storage', infra: false, scopes: [] },
    files: { auth: 'None', share: 'None' },
    blob: { deleteDays: 0, containerDays: 0, versioning: false, changeFeed: false, lastAccess: false, restoreDays: 0 },
    shareDays: 7,
    policies: {}, shares: {}, deletedShares: [], deletedBlobs: {}, versions: {}, deletedContainers: [], udGen: 1,
  };
}
/** Find an account by name (and resource group when given) plus its admin state. */
function acct(w: World, name: string | undefined, rg?: string): { st: Res; x: X } {
  if (!name) throw new SimError('the following arguments are required: --account-name/-n', 'MissingArgs');
  const st = w.storageByName(name);
  if (rg && lc(st.rg) !== lc(rg)) throw new SimError(`The Resource 'Microsoft.Storage/storageAccounts/${name}' under resource group '${rg}' was not found.`, 'ResourceNotFound');
  const s = st$(w);
  s.acct[st.name] ??= X0();
  return { st, x: s.acct[st.name] };
}
const known = (w: World, name?: string) => !!name && w.res.some((r) => r.type === 'storage' && r.name === lc(name));
const xOf = (w: World, name?: string): X | undefined => (known(w, name) ? acct(w, name).x : undefined);
const nameOf = (p: Parsed) => one(p, '--account-name', '--name', '--storage-account');
const rgOf = (p: Parsed) => one(p, '--resource-group');
const containers = (st: Res) => st.props.containers as Record<string, { name: string; tier: string; size: number; versionId?: string }[]>;
let seq = 0;
const versionId = () => { const d = new Date(Date.now() + seq++); return `${d.toISOString().slice(0, 19)}.${String(1000000 + Math.floor(Math.random() * 8999999)).slice(0, 7)}Z`; };
const me = (w: World) => ((w as any).current as string) ?? 'learner@msdevbuild.com';

/* ------------------------------------------------------------------ */
/* The front door and the three ways in                                */
/* ------------------------------------------------------------------ */
const blockedByFirewall = (x: X) => x.net.defaultAction === 'Deny' && !x.net.ip.includes(SHELL_IP);
function firewall(w: World, st: Res, x: X, op: string) {
  if (!blockedByFirewall(x)) return;
  w.emit('adm.st.blocked', { account: st.name, ip: SHELL_IP, op });
  throw new SimError(`This request is not authorized to perform this operation.\nThe storage firewall on '${st.name}' is set to Deny, and this Cloud Shell's public IP (${SHELL_IP}) isn't in its IP rules or an allowed virtual network. Management commands (az storage account …) still work; data commands (blobs, containers, files) don't.\nFix: az storage account network-rule add -g ${st.rg} --account-name ${st.name} --ip-address ${SHELL_IP}`, 'AuthorizationFailure');
}
/** Did the current user get a data role on this account (from any module's role.assign event)? */
function hasDataRole(w: World, account: string, write: boolean, re = /^Storage Blob Data (Owner|Contributor|Reader)$/i) {
  const u = lc(me(w));
  return w.events.some((e) => e.type === 'role.assign' && re.test(String(e.data.role ?? '')) && (!write || !/Reader/i.test(String(e.data.role)))
    && [e.data.principalName, e.data.principal].some((v) => lc(String(v ?? '')) === u)
    && (!String(e.data.scope ?? '').includes('/providers/') || lc(String(e.data.scope)).includes(`/storageaccounts/${account}`) || String(e.data.scope).startsWith('rg/') || e.data.scope === 'subscription'));
}
function parseSas(token: string) {
  const q = new URLSearchParams(token.replace(/^\?/, ''));
  return { sig: q.get('sig') ?? '', q };
}
/** Check a SAS token for one data operation; throws a realistic 403 when it doesn't fit. */
function useSas(w: World, st: Res, x: X, token: string, need: string, container?: string): Sas {
  const { sig } = parseSas(token);
  const s = st$(w).sas[sig];
  const fail = (reason: string, msg: string, code = 'AuthenticationFailed') => { w.emit('adm.st.sas.use', { account: st.name, ok: false, reason, policy: s?.policy }); throw new SimError(msg, code); };
  if (!s || s.account !== st.name) fail('signature', 'Server failed to authenticate the request. Make sure the value of Authorization header is formed correctly including the signature. (The SAS signature does not match any key of this account.)');
  if (s.kind !== 'user' && !x.sharedKey) fail('sharedkey', 'Key based authentication is not permitted on this storage account. Service and account SAS tokens are signed with an account key, so they stop working when "Allow storage account key access" is off. Use a user delegation SAS instead.', 'KeyBasedAuthenticationNotPermitted');
  if (s.kind === 'user' && s.udGen !== x.udGen) fail('revoked', 'Server failed to authenticate the request. The user delegation key that signed this SAS was revoked (az storage account revoke-delegation-keys).');
  if (s.keyName && (s.keyName === 'key1' ? x.keys.gen1 : x.keys.gen2) !== s.keyGen) fail('rotated', `Server failed to authenticate the request. Signature did not match. This SAS was signed with ${s.keyName}, and ${s.keyName} has been regenerated since, so every SAS signed with the old key is dead.`);
  let perms = s.perms, expiry = s.expiry;
  if (s.policy) {
    const pol = x.policies[s.container ?? '']?.[s.policy];
    if (!pol) fail('policy', `Server failed to authenticate the request. The stored access policy '${s.policy}' on container '${s.container}' no longer exists, so every SAS that points at it is revoked.`);
    perms = pol!.permissions ?? perms; expiry = pol!.expiry ?? expiry;
  }
  if (expiry && Date.parse(expiry) < Date.now()) fail('expired', `Server failed to authenticate the request. Signed expiry time [${expiry}] must be after signed start time [${now()}]. The SAS has expired.`);
  if (s.kind !== 'account' && container && s.container && s.container !== container) fail('scope', `This request is not authorized to perform this operation. The SAS is for container '${s.container}', not '${container}'.`, 'AuthorizationFailure');
  if (!need.split('').every((c) => perms.includes(c))) fail('permission', `This request is not authorized to perform this operation using this permission. The SAS allows '${perms}' but this needs '${need}'.`, 'AuthorizationPermissionMismatch');
  if (s.kind === 'user' && !hasDataRole(w, st.name, /[wcda]/.test(need))) fail('rbac', 'This request is not authorized to perform this operation using this permission. A user delegation SAS can never do more than its signer is allowed to do, and the signer has no Storage Blob Data role on this account.', 'AuthorizationPermissionMismatch');
  w.emit('adm.st.sas.use', { account: st.name, ok: true, kind: s.kind, policy: s.policy, perms });
  return s;
}
/** Firewall, then whichever credential the command used. */
function gate(w: World, p: Parsed, st: Res, x: X, need: string, op: string, container?: string) {
  firewall(w, st, x, op);
  const sas = one(p, '--sas-token');
  if (sas) return useSas(w, st, x, sas, need, container);
  if (lc(one(p, '--auth-mode')) === 'login') {
    if (!hasDataRole(w, st.name, /[wcda]/.test(need))) {
      w.emit('adm.st.denied', { account: st.name, op, auth: 'login' });
      throw new SimError(`This request is not authorized to perform this operation using this permission.\n--auth-mode login uses your Microsoft Entra identity, which needs a data role such as Storage Blob Data ${/[wcda]/.test(need) ? 'Contributor' : 'Reader'} on the account. Owner and Contributor manage the account but don't include data access.`, 'AuthorizationPermissionMismatch');
    }
    return;
  }
  if (!x.sharedKey) {
    w.emit('adm.st.denied', { account: st.name, op, auth: 'key' });
    throw new SimError("Key based authentication is not permitted on this storage account. Run the command with --auth-mode login (and a Storage Blob Data role) instead.", 'KeyBasedAuthenticationNotPermitted');
  }
}
const tokenOf = (q: [string, string | undefined][]) => q.filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `${k}=${encodeURIComponent(v!).replace(/%2C/g, ',')}`).join('&');

/* ------------------------------------------------------------------ */
/* Lifecycle policy parsing                                            */
/* ------------------------------------------------------------------ */
function readPolicy(raw: string) {
  const text = raw.startsWith('@') ? FILES[raw.slice(1).replace(/^\.\//, '')] : raw;
  if (text === undefined) throw new SimError(`File '${raw.slice(1)}' was not found. Try 'cat lifecycle.json' to see the sample policy.`, 'FileNotFound');
  try { return JSON.parse(text); } catch { throw new SimError('The policy is not valid JSON.', 'InvalidJson'); }
}
function summarise(policy: any) {
  const rules = policy?.rules;
  if (!Array.isArray(rules) || !rules.length) throw new SimError('A lifecycle policy needs a "rules" array with at least one rule.', 'InvalidPolicy');
  if (rules.length > 100) throw new SimError('A lifecycle management policy can have at most 100 rules.', 'InvalidPolicy');
  return rules.map((r: any) => {
    const a = r?.definition?.actions ?? {};
    const b = a.baseBlob ?? {};
    const d = (o: any) => o?.daysAfterModificationGreaterThan ?? o?.daysAfterLastAccessTimeGreaterThan ?? o?.daysAfterCreationGreaterThan;
    const usesAccess = JSON.stringify(a).includes('daysAfterLastAccessTimeGreaterThan');
    return { name: r.name, enabled: r.enabled !== false, prefix: r?.definition?.filters?.prefixMatch ?? [], cool: d(b.tierToCool), cold: d(b.tierToCold), archive: d(b.tierToArchive), delete: d(b.delete), versions: !!a.version, snapshots: !!a.snapshot, usesAccess };
  });
}

/* ------------------------------------------------------------------ */
/* Commands                                                            */
/* ------------------------------------------------------------------ */
const UPD_FLAGS = ['--default-action', '--bypass', '--allow-shared-key-access', '--key-exp-days', '--min-tls-version', '--allow-blob-public-access', '--https-only', '--assign-identity', '--identity-type', '--encryption-key-source', '--encryption-key-vault', '--encryption-key-name', '--encryption-key-version', '--encryption-services', '--enable-files-aadkerb', '--enable-files-adds', '--enable-files-aadds', '--default-share-permission', '--access-tier', '--allow-cross-tenant-replication', '--require-infrastructure-encryption', '--sas-expiration-period'];
const CREATE_FLAGS = ['--require-infrastructure-encryption', '--min-tls-version', '--allow-blob-public-access', '--allow-shared-key-access', '--default-action', '--bypass', '--https-only', '--enable-hierarchical-namespace', '--access-tier', '--key-exp-days', '--enable-large-file-share', '--allow-cross-tenant-replication', '--encryption-key-source'];

function applyUpdate(w: World, st: Res, x: X, p: Parsed, creating: boolean) {
  const ch: Record<string, unknown> = {};
  if (has(p, '--require-infrastructure-encryption')) {
    if (!creating) throw new SimError('Infrastructure encryption can only be turned on when the storage account is created. Create a new account with --require-infrastructure-encryption and copy the data across.', 'InvalidOperation');
    x.enc.infra = bool(p, '--require-infrastructure-encryption', true); ch.infrastructureEncryption = x.enc.infra;
  }
  if (has(p, '--default-action')) {
    const v = lc(one(p, '--default-action'));
    if (v !== 'deny' && v !== 'allow') throw new SimError("--default-action must be 'Allow' or 'Deny'.", 'InvalidArgumentValue');
    x.net.defaultAction = v === 'deny' ? 'Deny' : 'Allow'; ch.defaultAction = x.net.defaultAction;
  }
  if (has(p, '--bypass')) {
    const vals = (p.flags['--bypass'] ?? []).flatMap((s) => s.split(/[ ,]+/)).filter(Boolean);
    const okv = ['AzureServices', 'Logging', 'Metrics', 'None'];
    const bad = vals.find((v) => !okv.some((o) => lc(o) === lc(v)));
    if (bad) throw new SimError(`--bypass accepts AzureServices, Logging, Metrics or None (got '${bad}').`, 'InvalidArgumentValue');
    x.net.bypass = vals.map((v) => okv.find((o) => lc(o) === lc(v))!).filter((v) => v !== 'None'); ch.bypass = x.net.bypass.join(', ') || 'None';
  }
  if (has(p, '--allow-shared-key-access')) { x.sharedKey = bool(p, '--allow-shared-key-access', true); ch.allowSharedKeyAccess = x.sharedKey; }
  if (has(p, '--key-exp-days')) {
    const n = Number(one(p, '--key-exp-days'));
    if (!Number.isInteger(n) || n < 1) throw new SimError('--key-exp-days must be a whole number of days, for example 90.', 'InvalidArgumentValue');
    x.keys.expDays = n; ch.keyExpirationPeriodInDays = n;
  }
  if (has(p, '--min-tls-version')) {
    const v = (one(p, '--min-tls-version') ?? '').toUpperCase().replace('.', '_');
    if (!['TLS1_0', 'TLS1_1', 'TLS1_2', 'TLS1_3'].includes(v)) throw new SimError('--min-tls-version accepts TLS1_0, TLS1_1, TLS1_2 or TLS1_3.', 'InvalidArgumentValue');
    x.tls = v; ch.minimumTlsVersion = v;
  }
  if (has(p, '--allow-blob-public-access')) { x.publicBlob = bool(p, '--allow-blob-public-access', true); ch.allowBlobPublicAccess = x.publicBlob; }
  if (has(p, '--https-only')) { x.https = bool(p, '--https-only', true); ch.enableHttpsTrafficOnly = x.https; }
  if (has(p, '--allow-cross-tenant-replication')) { x.crossTenant = bool(p, '--allow-cross-tenant-replication', false); ch.allowCrossTenantReplication = x.crossTenant; }
  if (has(p, '--access-tier')) {
    const t = ['Hot', 'Cool', 'Cold'].find((v) => lc(v) === lc(one(p, '--access-tier')));
    if (!t) throw new SimError('The account default --access-tier can be Hot, Cool or Cold. Archive is set per blob, never as the account default.', 'InvalidArgumentValue');
    st.props.accessTier = t; ch.accessTier = t;
  }
  if (has(p, '--sas-expiration-period')) ch.sasExpirationPeriod = one(p, '--sas-expiration-period');
  if (has(p, '--assign-identity') || /systemassigned/i.test(one(p, '--identity-type') ?? '')) { x.identity ??= uuid(); ch.identity = { type: 'SystemAssigned', principalId: x.identity }; }
  // Identity-based access for Azure Files: one source per account.
  const src = (['--enable-files-aadkerb', '--enable-files-adds', '--enable-files-aadds'] as const).find((f) => has(p, f) && bool(p, f, true));
  const off = (['--enable-files-aadkerb', '--enable-files-adds', '--enable-files-aadds'] as const).filter((f) => has(p, f) && !bool(p, f, true));
  if (off.length && !src) { x.files.auth = 'None'; ch.azureFilesIdentityBasedAuthentication = 'None'; }
  if (src) {
    const want = src === '--enable-files-aadkerb' ? 'AADKERB' : src === '--enable-files-adds' ? 'AD' : 'AADDS';
    if (x.files.auth !== 'None' && x.files.auth !== want) throw new SimError(`Azure Files identity-based access is already set to ${x.files.auth}. A storage account can use only one identity source at a time: turn the current one off first.`, 'InvalidOperation');
    if (want === 'AD' && (!has(p, '--domain-name') || !has(p, '--domain-guid'))) throw new SimError('On-premises AD DS needs --domain-name, --net-bios-domain-name, --forest-name, --domain-guid, --domain-sid and --azure-storage-sid (the AzFilesHybrid module Join-AzStorageAccount fills these in for you).', 'MissingArgs');
    x.files.auth = want; x.files.domain = one(p, '--domain-name'); ch.azureFilesIdentityBasedAuthentication = want;
  }
  if (has(p, '--default-share-permission')) {
    const v = SHARE_PERMS.find((s) => lc(s) === lc(one(p, '--default-share-permission')));
    if (!v) throw new SimError(`--default-share-permission accepts ${SHARE_PERMS.join(', ')}.`, 'InvalidArgumentValue');
    x.files.share = v; ch.defaultSharePermission = v;
  }
  if (has(p, '--encryption-key-source')) {
    const s = lc(one(p, '--encryption-key-source'));
    if (s === 'microsoft.storage') { x.enc = { ...x.enc, source: 'Microsoft.Storage', vault: undefined, key: undefined, version: undefined }; ch.encryption = 'Microsoft-managed keys'; }
    else if (s === 'microsoft.keyvault') {
      req(p, [['--encryption-key-vault', ''], ['--encryption-key-name', '']]);
      if (!x.identity) {
        w.emit('adm.st.encryption.blocked', { account: st.name, reason: 'identity' });
        throw new SimError(`The storage account '${st.name}' has no managed identity, so it can't reach the key vault to wrap and unwrap its encryption key.\nFix: az storage account update -g ${st.rg} -n ${st.name} --assign-identity, then give that identity the "Key Vault Crypto Service Encryption User" role on the vault.`, 'IdentityNotFound');
      }
      const uri = one(p, '--encryption-key-vault')!;
      const host = lc(uri.replace(/^https?:\/\//, '').split('.')[0]);
      const kv = w.res.find((r) => /^(kv|keyvault)$/.test(r.type) && lc(r.name) === host);
      if (!kv) throw new SimError(`Key vault '${host}' was not found. Create it with soft delete and purge protection: az keyvault create -g ${st.rg} -n ${host} --enable-purge-protection true`, 'KeyVaultNotFound');
      const purge = kv.props.purgeProtection ?? kv.props.enablePurgeProtection;
      if (purge === false) {
        w.emit('adm.st.encryption.blocked', { account: st.name, reason: 'purge' });
        throw new SimError(`Key vault '${kv.name}' must have soft delete and purge protection turned on before it can hold a customer-managed key for Azure Storage. Run: az keyvault update -n ${kv.name} --enable-purge-protection true`, 'KeyVaultPurgeProtectionRequired');
      }
      x.enc = { ...x.enc, source: 'Microsoft.Keyvault', vault: uri, key: one(p, '--encryption-key-name'), version: one(p, '--encryption-key-version') };
      ch.encryption = `Customer-managed key ${x.enc.key} in ${kv.name}${x.enc.version ? ` (pinned to version ${x.enc.version})` : ' (latest version, rotated automatically)'}`;
    } else throw new SimError('--encryption-key-source accepts Microsoft.Storage or Microsoft.Keyvault.', 'InvalidArgumentValue');
    w.emit('adm.st.encryption', { account: st.name, source: x.enc.source, vault: x.enc.vault, key: x.enc.key, autoRotate: x.enc.source === 'Microsoft.Keyvault' && !x.enc.version });
  }
  return ch;
}

function skuChange(w: World, st: Res, sku: string) {
  const to = Object.keys({ Standard_LRS: 1, Standard_ZRS: 1, Standard_GRS: 1, Standard_RAGRS: 1, Standard_GZRS: 1, Premium_LRS: 1 }).find((k) => lc(k) === lc(sku));
  if (to && !Z_SKUS.includes(st.props.sku) && Z_SKUS.includes(to)) {
    w.emit('adm.st.sku.blocked', { account: st.name, from: st.props.sku, to });
    const step = st.props.sku === 'Standard_LRS' && to === 'Standard_GZRS' ? `Go LRS → GRS first (az storage account update --sku Standard_GRS), then convert GRS → GZRS.` : `Run: az storage account migration start -g ${st.rg} --account-name ${st.name} --sku ${st.props.sku === 'Standard_LRS' ? 'Standard_ZRS' : 'Standard_GZRS'} --no-wait`;
    throw new SimError(`Changing ${st.props.sku} to ${to} adds availability zones, which moves your data between datacenters. That's a conversion, not a simple update. ${step}`, 'StorageAccountConversionRequired');
  }
}

function table(w: World): Record<string, Cmd | ((p: Parsed) => AdminOut)> {
  const firewallBlocks = (p: Parsed) => { const x = xOf(w, one(p, '--account-name')); return !!x && blockedByFirewall(x); };
  const keyless = (p: Parsed) => { const x = xOf(w, one(p, '--account-name')); return !!x && !x.sharedKey; };
  const credFlags = (p: Parsed) => has(p, '--sas-token') || lc(one(p, '--auth-mode')) === 'login';
  return {
    /* ---------- account create / update (claimed only for flags this module owns) ---------- */
    'storage account create': {
      when: (p) => CREATE_FLAGS.some((f) => has(p, f)),
      run: (p) => {
        req(p, [['--name', '-n'], ['--resource-group', '-g']]);
        if (has(p, '--encryption-key-source') && lc(one(p, '--encryption-key-source')) === 'microsoft.keyvault') throw new SimError('Create the account first, give it a managed identity and key vault access, then switch it to a customer-managed key with az storage account update.', 'InvalidOperation');
        const created = w.createStorage({ rg: rgOf(p)!, name: one(p, '--name')!, location: one(p, '--location'), sku: one(p, '--sku') ?? 'Standard_RAGRS', kind: one(p, '--kind') }, 'cli');
        const { st, x } = acct(w, created.name);
        const ch = applyUpdate(w, st, x, p, true);
        if (bool(p, '--enable-hierarchical-namespace', false)) st.props.hns = true;
        w.emit('adm.st.create', { account: st.name, rg: st.rg, sku: st.props.sku, kind: st.props.kind, infra: x.enc.infra, tls: x.tls, publicBlob: x.publicBlob, sharedKey: x.sharedKey, defaultAction: x.net.defaultAction });
        return out(p, { name: st.name, location: st.location, kind: st.props.kind, sku: { name: st.props.sku }, accessTier: st.props.accessTier, isHnsEnabled: !!st.props.hns, minimumTlsVersion: x.tls, allowBlobPublicAccess: x.publicBlob, allowSharedKeyAccess: x.sharedKey, enableHttpsTrafficOnly: x.https, encryption: { keySource: 'Microsoft.Storage', requireInfrastructureEncryption: x.enc.infra, services: { blob: { enabled: true }, file: { enabled: true } } }, networkRuleSet: { defaultAction: x.net.defaultAction, bypass: x.net.bypass.join(', ') || 'None' }, provisioningState: 'Succeeded', changes: ch });
      },
    },
    'storage account update': {
      when: (p) => UPD_FLAGS.some((f) => has(p, f)) || (has(p, '--sku') && known(w, one(p, '--name', '--account-name')) && (() => { const st = w.storageByName(one(p, '--name', '--account-name')!); const to = Object.keys({ Standard_ZRS: 1, Standard_GZRS: 1 }).find((k) => lc(k) === lc(one(p, '--sku'))); return !!to && !Z_SKUS.includes(st.props.sku); })()),
      run: (p) => {
        const { st, x } = acct(w, one(p, '--name', '--account-name'), rgOf(p));
        w.assertWritable(st.rg, 'update storage account');
        if (has(p, '--sku')) skuChange(w, st, one(p, '--sku')!);
        const ch = applyUpdate(w, st, x, p, false);
        if (has(p, '--public-network-access')) (w as any).setPublicAccess(st.rg, st.name, one(p, '--public-network-access') ?? '', 'cli');
        if (has(p, '--sku')) w.updateStorageSku(st.rg, st.name, one(p, '--sku')!, 'cli');
        if (ch.defaultAction || ch.bypass) w.emit('adm.st.network', { account: st.name, defaultAction: x.net.defaultAction, bypass: x.net.bypass });
        w.emit('adm.st.update', { account: st.name, ...ch });
        const notes: string[] = [];
        if (ch.defaultAction === 'Deny') notes.push(`Firewall is now Deny. Only allowed IPs, allowed virtual networks${x.net.bypass.includes('AzureServices') ? ' and trusted Azure services' : ''} get in. Try a data command from here to see it bite.`);
        if (ch.allowSharedKeyAccess === false) notes.push('Shared Key is off: the account keys, account SAS and service SAS all stop working. Microsoft Entra ID and user delegation SAS still work.');
        if (ch.keyExpirationPeriodInDays) notes.push(`Key expiration policy: ${x.keys.expDays} days. Azure doesn't rotate the keys for you; it flags keys older than this so you (or Azure Policy and Azure Monitor) notice.`);
        if (ch.azureFilesIdentityBasedAuthentication && ch.azureFilesIdentityBasedAuthentication !== 'None') notes.push('Identity source set. Users still need share-level permission: an RBAC role such as Storage File Data SMB Share Contributor, or a default share-level permission.');
        const body = { name: st.name, sku: { name: st.props.sku }, networkRuleSet: { defaultAction: x.net.defaultAction, bypass: x.net.bypass.join(', ') || 'None', ipRules: x.net.ip.map((v) => ({ value: v, action: 'Allow' })), virtualNetworkRules: x.net.vnet.map((id) => ({ id, action: 'Allow' })) }, allowSharedKeyAccess: x.sharedKey, minimumTlsVersion: x.tls, allowBlobPublicAccess: x.publicBlob, identity: x.identity ? { type: 'SystemAssigned', principalId: x.identity } : null, encryption: { keySource: x.enc.source, keyVaultProperties: x.enc.vault ? { keyVaultUri: x.enc.vault, keyName: x.enc.key, keyVersion: x.enc.version ?? null } : null, requireInfrastructureEncryption: x.enc.infra }, azureFilesIdentityBasedAuthentication: { directoryServiceOptions: x.files.auth, defaultSharePermission: x.files.share }, keyPolicy: x.keys.expDays ? { keyExpirationPeriodInDays: x.keys.expDays } : null, provisioningState: 'Succeeded' };
        return { out: json(body) + (notes.length ? `\n${notes.map((n) => `ℹ ${n}`).join('\n')}` : '') };
      },
    },

    /* ---------- firewall rules ---------- */
    'storage account network-rule add': (p) => {
      const { st, x } = acct(w, nameOf(p), rgOf(p));
      w.assertWritable(st.rg, 'update storage account network rules');
      const ip = one(p, '--ip-address');
      if (ip) {
        if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip)) throw new SimError(`IP rules accept public addresses only. ${ip} is a private (RFC 1918) address: allow its virtual network with a VNet rule or use a private endpoint instead.`, 'InvalidIpRule');
        if (/\/(31|32)$/.test(ip)) throw new SimError(`Address ranges with a /31 or /32 prefix aren't supported in IP rules. Add the single address without the prefix (for example ${ip.split('/')[0]}).`, 'InvalidIpRule');
        if (x.net.ip.length >= 400) throw new SimError('A storage account supports up to 400 IP network rules.', 'LimitExceeded');
        if (!x.net.ip.includes(ip)) x.net.ip.push(ip);
        w.emit('adm.st.netrule', { account: st.name, kind: 'ip', value: ip });
        return out(p, { ipRules: x.net.ip.map((v) => ({ value: v, action: 'Allow' })), virtualNetworkRules: x.net.vnet.map((id) => ({ id, action: 'Allow' })), defaultAction: x.net.defaultAction });
      }
      const sub = one(p, '--subnet');
      if (!sub) throw new SimError('Give --ip-address <public IP or CIDR>, or --vnet-name <vnet> --subnet <subnet> (or --subnet <subnet resource ID>).', 'MissingArgs');
      let id = sub, note = '';
      if (!sub.startsWith('/')) {
        const vn = one(p, '--vnet-name');
        if (!vn) throw new SimError('--subnet given by name also needs --vnet-name.', 'MissingArgs');
        const v = w.vnetOf(st.rg, vn);
        const s = (v.props.subnetList ?? []).find((z: any) => lc(z.name) === lc(sub));
        if (!s) throw new SimError(`Subnet '${sub}' was not found in virtual network '${vn}'.`, 'NotFound');
        const eps: string[] = [...(s.serviceEndpoints ?? []), ...(s.endpoints ?? [])].map((e: any) => String(e?.service ?? e));
        if (!eps.some((e) => /^Microsoft\.Storage/i.test(e))) note = `ℹ Subnet '${sub}' had no Microsoft.Storage service endpoint. The portal adds it for you when you add the rule; with the CLI, run 'az network vnet subnet update -g ${st.rg} --vnet-name ${vn} -n ${sub} --service-endpoints Microsoft.Storage' first (the practice shell let this one through).`;
        id = `/subscriptions/${SUB_ID}/resourceGroups/${v.rg}/providers/Microsoft.Network/virtualNetworks/${v.name}/subnets/${s.name}`;
      }
      if (!x.net.vnet.includes(id)) x.net.vnet.push(id);
      w.emit('adm.st.netrule', { account: st.name, kind: 'vnet', value: id });
      return { out: json({ ipRules: x.net.ip.map((v) => ({ value: v, action: 'Allow' })), virtualNetworkRules: x.net.vnet.map((v) => ({ id: v, action: 'Allow', state: 'Succeeded' })), defaultAction: x.net.defaultAction }) + (note ? `\n${note}` : '') };
    },
    'storage account network-rule list': (p) => {
      const { x } = acct(w, nameOf(p), rgOf(p));
      return out(p, { ipRules: x.net.ip.map((v) => ({ ipAddressOrRange: v, action: 'Allow' })), virtualNetworkRules: x.net.vnet.map((id) => ({ virtualNetworkResourceId: id, action: 'Allow' })) });
    },
    'storage account network-rule remove': (p) => {
      const { st, x } = acct(w, nameOf(p), rgOf(p));
      const ip = one(p, '--ip-address'), sub = one(p, '--subnet');
      if (ip) x.net.ip = x.net.ip.filter((v) => v !== ip);
      if (sub) x.net.vnet = x.net.vnet.filter((v) => !lc(v).endsWith(`/subnets/${lc(sub)}`) && lc(v) !== lc(sub));
      w.emit('adm.st.netrule.remove', { account: st.name, ip, subnet: sub });
      return out(p, { ipRules: x.net.ip, virtualNetworkRules: x.net.vnet });
    },

    /* ---------- access keys ---------- */
    'storage account keys list': (p) => {
      const { st, x } = acct(w, nameOf(p), rgOf(p));
      w.emit('adm.st.keys.list', { account: st.name });
      const rows = [{ keyName: 'key1', permissions: 'FULL', value: x.keys.key1, creationTime: x.keys.created1 }, { keyName: 'key2', permissions: 'FULL', value: x.keys.key2, creationTime: x.keys.created2 }];
      const r = out(p, rows, rows.map((k) => ({ KeyName: k.keyName, Permissions: k.permissions, CreationTime: k.creationTime, Value: k.value.slice(0, 12) + '…' })), ['KeyName', 'Permissions', 'CreationTime', 'Value']);
      return { out: `${r.out}\n${x.sharedKey ? '' : 'ℹ Shared Key access is turned off on this account, so these keys are listed but requests signed with them are refused.\n'}ℹ Either key gives full control of all data. Keep them in Azure Key Vault, never in code.` };
    },
    'storage account keys renew': (p) => {
      const { st, x } = acct(w, nameOf(p), rgOf(p));
      w.assertWritable(st.rg, 'regenerate storage account key');
      const k = lc(one(p, '--key'));
      const which = k === 'primary' || k === 'key1' ? 'key1' : k === 'secondary' || k === 'key2' ? 'key2' : '';
      if (!which) throw new SimError("--key must be 'primary' (key1) or 'secondary' (key2).", 'InvalidArgumentValue');
      if (which === 'key1') { x.keys.key1 = b64(86); x.keys.gen1++; x.keys.created1 = now(); } else { x.keys.key2 = b64(86); x.keys.gen2++; x.keys.created2 = now(); }
      const dead = Object.values(st$(w).sas).filter((s) => s.account === st.name && s.keyName === which).length;
      w.emit('adm.st.keys.renew', { account: st.name, key: which, sasInvalidated: dead });
      const rows = [{ keyName: 'key1', permissions: 'FULL', value: x.keys.key1 }, { keyName: 'key2', permissions: 'FULL', value: x.keys.key2 }];
      return { out: json(rows) + `\nℹ ${which} was regenerated. Anything still using the old ${which} (connection strings, and ${dead} SAS token${dead === 1 ? '' : 's'} signed with it) now fails. Safe rotation: move apps to the other key first, then regenerate this one.` };
    },

    /* ---------- SAS tokens and stored access policies ---------- */
    'storage container policy create': (p) => {
      req(p, [['--account-name', ''], ['--container-name', '-c'], ['--name', '-n']]);
      const { st, x } = acct(w, one(p, '--account-name'));
      gate(w, p, st, x, 'w', 'set container ACL');
      const c = one(p, '--container-name')!;
      if (!containers(st)[c]) throw new SimError(`The specified container '${c}' does not exist.`, 'ContainerNotFound');
      const list = (x.policies[c] ??= {});
      const n = one(p, '--name')!;
      if (!list[n] && Object.keys(list).length >= 5) { w.emit('adm.st.policy.blocked', { account: st.name, container: c }); throw new SimError(`A container can have at most 5 stored access policies, and '${c}' already has ${Object.keys(list).join(', ')}. Delete or reuse one.`, 'InvalidXmlDocument'); }
      const perms = one(p, '--permissions');
      if (perms && !/^[racwdl]+$/.test(perms)) throw new SimError('Container policy --permissions use the letters r (read), a (add), c (create), w (write), d (delete) and l (list).', 'InvalidArgumentValue');
      list[n] = { permissions: perms, expiry: one(p, '--expiry'), start: one(p, '--start') };
      w.emit('adm.st.policy', { account: st.name, container: c, name: n, action: 'create', permissions: perms, expiry: list[n].expiry });
      return { out: json({ etag: `"0x${hex(15).toUpperCase()}"`, lastModified: now() }) + '\nℹ Stored access policy saved. A service SAS that names it (--policy-name) takes its permissions and expiry from here, so you can change or revoke every such SAS in one place. Changes can take up to 30 seconds to apply.' };
    },
    'storage container policy update': (p) => {
      req(p, [['--account-name', ''], ['--container-name', '-c'], ['--name', '-n']]);
      const { st, x } = acct(w, one(p, '--account-name'));
      gate(w, p, st, x, 'w', 'set container ACL');
      const c = one(p, '--container-name')!, n = one(p, '--name')!;
      const pol = x.policies[c]?.[n];
      if (!pol) throw new SimError(`Stored access policy '${n}' was not found on container '${c}'.`, 'PolicyNotFound');
      if (has(p, '--permissions')) pol.permissions = one(p, '--permissions');
      if (has(p, '--expiry')) pol.expiry = one(p, '--expiry');
      w.emit('adm.st.policy', { account: st.name, container: c, name: n, action: 'update', permissions: pol.permissions, expiry: pol.expiry });
      return out(p, { name: n, ...pol });
    },
    'storage container policy delete': (p) => {
      req(p, [['--account-name', ''], ['--container-name', '-c'], ['--name', '-n']]);
      const { st, x } = acct(w, one(p, '--account-name'));
      gate(w, p, st, x, 'w', 'set container ACL');
      const c = one(p, '--container-name')!, n = one(p, '--name')!;
      if (!x.policies[c]?.[n]) throw new SimError(`Stored access policy '${n}' was not found on container '${c}'.`, 'PolicyNotFound');
      delete x.policies[c][n];
      w.emit('adm.st.policy', { account: st.name, container: c, name: n, action: 'delete' });
      return { out: `ℹ Policy '${n}' deleted. Every SAS that pointed at it is now revoked, without touching the account keys.` };
    },
    'storage container policy list': (p) => {
      req(p, [['--account-name', ''], ['--container-name', '-c']]);
      const { st, x } = acct(w, one(p, '--account-name'));
      gate(w, p, st, x, 'r', 'get container ACL');
      const pol = x.policies[one(p, '--container-name')!] ?? {};
      const rows = Object.entries(pol).map(([name, v]) => ({ Name: name, Permissions: v.permissions ?? '', Expiry: v.expiry ?? '' }));
      return out(p, pol, rows, ['Name', 'Permissions', 'Expiry']);
    },
    'storage container generate-sas': (p) => sasCmd(w, p, 'container'),
    'storage blob generate-sas': (p) => sasCmd(w, p, 'blob'),
    'storage account generate-sas': (p) => {
      req(p, [['--permissions', ''], ['--expiry', '']]);
      const { st, x } = acct(w, one(p, '--account-name', '--name'));
      const services = one(p, '--services') ?? 'b';
      const types = one(p, '--resource-types') ?? 'sco';
      const keyName = one(p, '--account-key') === x.keys.key2 ? 'key2' : 'key1';
      const sig = hex(32);
      st$(w).sas[sig] = { account: st.name, kind: 'account', perms: one(p, '--permissions')!, expiry: one(p, '--expiry'), keyName, keyGen: keyName === 'key1' ? x.keys.gen1 : x.keys.gen2, https: has(p, '--https-only') };
      const token = tokenOf([['se', one(p, '--expiry')], ['sp', one(p, '--permissions')], ['spr', has(p, '--https-only') ? 'https' : undefined], ['sv', SV], ['ss', services], ['srt', types], ['sig', sig]]);
      w.emit('adm.st.sas', { account: st.name, kind: 'account', perms: one(p, '--permissions'), expiry: one(p, '--expiry'), https: has(p, '--https-only'), services, types });
      return lc(one(p, '--output')) === 'tsv' ? { out: token } : { out: json(token) };
    },
    'storage account revoke-delegation-keys': (p) => {
      const { st, x } = acct(w, nameOf(p), rgOf(p));
      x.udGen++;
      w.emit('adm.st.ud.revoke', { account: st.name });
      return { out: 'ℹ Every user delegation key on this account was revoked, so every user delegation SAS signed with them stops working. Account keys and service SAS are not affected.' };
    },

    /* ---------- data commands that check the firewall and the credential ---------- */
    'storage container create': {
      when: (p) => has(p, '--public-access') || firewallBlocks(p) || credFlags(p) || keyless(p),
      run: (p) => {
        req(p, [['--account-name', ''], ['--name', '-n']]);
        const { st, x } = acct(w, one(p, '--account-name'));
        gate(w, p, st, x, 'c', 'create container');
        const level = lc(one(p, '--public-access') ?? 'off');
        if (!['off', 'blob', 'container'].includes(level)) throw new SimError("--public-access accepts off, blob or container.", 'InvalidArgumentValue');
        if (level !== 'off' && !x.publicBlob) {
          w.emit('adm.st.publicaccess.blocked', { account: st.name, container: one(p, '--name'), level });
          throw new SimError(`Public access is not permitted on this storage account.\n'Allow Blob anonymous access' is off on ${st.name} (the default for new accounts), so no container can be made anonymous. Keep it private and share with a SAS, or turn it on with --allow-blob-public-access true if you really mean to publish.`, 'PublicAccessNotPermitted');
        }
        const r = w.createContainer(st.name, one(p, '--name')!, 'cli');
        (st.props.publicLevel ??= {})[one(p, '--name')!] = level;
        w.emit('adm.st.container', { account: st.name, name: one(p, '--name'), level });
        return out(p, r);
      },
    },
    'storage container delete': (p) => {
      req(p, [['--account-name', ''], ['--name', '-n']]);
      const { st, x } = acct(w, one(p, '--account-name'));
      gate(w, p, st, x, 'd', 'delete container');
      const n = one(p, '--name')!;
      const c = containers(st)[n];
      if (!c) throw new SimError(`The specified container '${n}' does not exist.`, 'ContainerNotFound');
      delete containers(st)[n];
      const soft = x.blob.containerDays > 0;
      if (soft) x.deletedContainers.push({ name: n, version: `01DA${hex(12).toUpperCase()}`, blobs: c, at: now() });
      w.emit('adm.st.container.delete', { account: st.name, name: n, soft });
      return out(p, { deleted: true, note: soft ? `Soft-deleted: restorable for ${x.blob.containerDays} days with 'az storage container restore'.` : 'Container soft delete is off: the container and its blobs are gone for good.' });
    },
    'storage container list': (p) => {
      req(p, [['--account-name', '']]);
      const { st, x } = acct(w, one(p, '--account-name'));
      gate(w, p, st, x, 'l', 'list containers');
      const rows = Object.keys(containers(st)).map((n) => ({ name: n, deleted: false, version: null as string | null, publicAccess: (st.props.publicLevel ?? {})[n] ?? 'off' }));
      if (has(p, '--include-deleted')) rows.push(...x.deletedContainers.map((d) => ({ name: d.name, deleted: true, version: d.version, publicAccess: 'off' })));
      if (one(p, '--query')?.includes('version') && lc(one(p, '--output')) === 'tsv') return { out: x.deletedContainers.at(-1)?.version ?? '' };
      return out(p, rows, rows.map((r) => ({ Name: r.name, Deleted: r.deleted ? 'True' : '', Version: r.version ?? '', PublicAccess: r.publicAccess })), ['Name', 'Deleted', 'Version', 'PublicAccess']);
    },
    'storage container restore': (p) => {
      req(p, [['--account-name', ''], ['--name', '-n'], ['--deleted-version', '']]);
      const { st, x } = acct(w, one(p, '--account-name'));
      gate(w, p, st, x, 'w', 'restore container');
      const n = one(p, '--name')!, ver = one(p, '--deleted-version')!;
      const i = x.deletedContainers.findIndex((d) => d.name === n && d.version === ver);
      if (i < 0) throw new SimError(`No soft-deleted container '${n}' with version '${ver}'. Run 'az storage container list --account-name ${st.name} --include-deleted -o table'.`, 'ContainerNotFound');
      if (containers(st)[n]) throw new SimError(`A container named '${n}' already exists. Delete or rename it before restoring.`, 'ContainerAlreadyExists');
      containers(st)[n] = x.deletedContainers[i].blobs;
      x.deletedContainers.splice(i, 1);
      w.emit('adm.st.container.restore', { account: st.name, name: n });
      return out(p, { containerName: n, restored: true });
    },
    'storage blob upload': {
      when: (p) => { const x = xOf(w, one(p, '--account-name')); return !!x && (blockedByFirewall(x) || !x.sharedKey || x.blob.versioning || x.blob.deleteDays > 0 || orFor(w, one(p, '--account-name')!).length > 0) || credFlags(p); },
      run: (p) => {
        req(p, [['--account-name', ''], ['--container-name', '-c']]);
        const { st, x } = acct(w, one(p, '--account-name'));
        const c = one(p, '--container-name')!;
        gate(w, p, st, x, 'cw', 'upload blob', c);
        const name = one(p, '--name') ?? one(p, '--file')?.split('/').pop() ?? '';
        const existing = (containers(st)[c] ?? []).find((b) => b.name === name);
        if (existing && !has(p, '--overwrite')) throw new SimError(`The specified blob '${name}' already exists. Add --overwrite to replace it.`, 'BlobAlreadyExists');
        let note = '';
        if (existing && x.blob.versioning) {
          const key = `${c}/${name}`;
          (x.versions[key] ??= []).push({ id: existing.versionId ?? versionId(), size: existing.size, tier: existing.tier });
          note = `ℹ Versioning is on: the old content was kept as a previous version. See it with --include v.`;
        } else if (existing && x.blob.deleteDays > 0) note = 'ℹ Overwritten. With soft delete on (and versioning off), Azure keeps the old data as a soft-deleted snapshot for the retention period.';
        w.uploadBlob(st.name, c, name, one(p, '--tier') ?? 'Hot', 'cli');
        const b = containers(st)[c].find((z) => z.name === name)!;
        if (x.blob.versioning) { b.versionId = versionId(); if (existing) w.emit('adm.st.blob.version', { account: st.name, container: c, name, versions: x.versions[`${c}/${name}`].length }); }
        const rep = replicate(w, st.name, c, name);
        return { out: json({ name, container: c, lastModified: new Date().toISOString(), versionId: b.versionId ?? null }) + (note ? `\n${note}` : '') + (rep ? `\n${rep}` : '') };
      },
    },
    'storage blob list': {
      when: (p) => has(p, '--include') || firewallBlocks(p) || credFlags(p) || keyless(p),
      run: (p) => {
        req(p, [['--account-name', ''], ['--container-name', '-c']]);
        const { st, x } = acct(w, one(p, '--account-name'));
        const c = one(p, '--container-name')!;
        gate(w, p, st, x, 'l', 'list blobs', c);
        if (!containers(st)[c]) throw new SimError(`The specified container '${c}' does not exist.`, 'ContainerNotFound');
        const inc = lc(one(p, '--include'));
        const rows: { name: string; tier: string; size: number; deleted: boolean; versionId: string | null; isCurrentVersion: boolean | null; remainingRetentionDays?: number }[] = containers(st)[c].map((b) => ({ name: b.name, tier: b.tier, size: b.size, deleted: false, versionId: b.versionId ?? null, isCurrentVersion: b.versionId ? true : null }));
        if (inc.includes('v')) for (const [k, vs] of Object.entries(x.versions)) if (k.startsWith(`${c}/`)) rows.push(...vs.map((v) => ({ name: k.slice(c.length + 1), tier: v.tier, size: v.size, deleted: false, versionId: v.id, isCurrentVersion: false })));
        if (inc.includes('d')) rows.push(...(x.deletedBlobs[c] ?? []).map((b) => ({ name: b.name, tier: b.tier, size: b.size, deleted: true, versionId: null, isCurrentVersion: null, remainingRetentionDays: Math.max(1, x.blob.deleteDays - Math.floor((Date.now() - Date.parse(b.at)) / DAY)) })));
        const q = one(p, '--query') ?? '';
        if (q.includes('versionId') && lc(one(p, '--output')) === 'tsv') {
          const prev = rows.filter((r) => r.isCurrentVersion === false).sort((a, b) => (a.versionId! < b.versionId! ? 1 : -1));
          return { out: prev[0]?.versionId ?? '' };
        }
        w.emit('adm.st.blob.list', { account: st.name, container: c, include: inc, deleted: rows.filter((r) => r.deleted).length, versions: rows.filter((r) => r.isCurrentVersion === false).length });
        return out(p, rows, rows.map((r) => ({ Name: r.name, Tier: r.tier, Length: r.size, Deleted: r.deleted ? 'True' : '', VersionId: r.versionId ?? '', IsCurrentVersion: r.isCurrentVersion === null ? '' : String(r.isCurrentVersion) })), ['Name', 'Tier', 'Length', 'Deleted', 'VersionId', 'IsCurrentVersion']);
      },
    },
    'storage blob set-tier': {
      when: (p) => firewallBlocks(p) || credFlags(p) || keyless(p) || (lc(one(p, '--tier')) === 'archive' && (() => { const n = one(p, '--account-name'); return known(w, n) && Z_SKUS.includes(w.storageByName(n!).props.sku); })()),
      run: (p) => {
        req(p, [['--account-name', ''], ['--container-name', '-c'], ['--name', '-n'], ['--tier', '']]);
        const { st, x } = acct(w, one(p, '--account-name'));
        gate(w, p, st, x, 'w', 'set blob tier', one(p, '--container-name'));
        if (lc(one(p, '--tier')) === 'archive' && Z_SKUS.includes(st.props.sku)) {
          w.emit('adm.st.archive.blocked', { account: st.name, sku: st.props.sku });
          throw new SimError(`The Archive tier isn't supported on ${st.props.sku} accounts. Archive is available for LRS, GRS and RA-GRS accounts only. Use Cold here, or keep archives in an LRS or GRS account.`, 'BlobTierNotSupported');
        }
        const r = w.setTier(st.name, one(p, '--container-name')!, one(p, '--name')!, one(p, '--tier')!, 'cli');
        return out(p, r);
      },
    },
    'storage blob download': (p) => {
      req(p, [['--account-name', ''], ['--container-name', '-c'], ['--name', '-n']]);
      const { st, x } = acct(w, one(p, '--account-name'));
      const c = one(p, '--container-name')!;
      const s = gate(w, p, st, x, 'r', 'download blob', c);
      const b = w.downloadBlob(st.name, c, one(p, '--name')!);
      w.emit('adm.st.read', { account: st.name, container: c, name: b.name, auth: s ? 'sas' : lc(one(p, '--auth-mode')) === 'login' ? 'entra' : 'key', policy: s?.policy });
      return { out: `Finished[#############################################################]  100.0000%\n${json({ name: b.name, container: c, properties: { contentLength: b.size, blobTier: b.tier }, savedTo: one(p, '--file') ?? b.name })}` };
    },
    'storage blob delete': (p) => {
      req(p, [['--account-name', ''], ['--container-name', '-c'], ['--name', '-n']]);
      const { st, x } = acct(w, one(p, '--account-name'));
      const c = one(p, '--container-name')!, n = one(p, '--name')!;
      gate(w, p, st, x, 'd', 'delete blob', c);
      const list = containers(st)[c];
      const i = list ? list.findIndex((b) => b.name === n) : -1;
      if (i < 0) throw new SimError(`The specified blob '${n}' does not exist.`, 'BlobNotFound');
      const [b] = list.splice(i, 1);
      let note: string;
      if (x.blob.versioning) {
        (x.versions[`${c}/${n}`] ??= []).push({ id: b.versionId ?? versionId(), size: b.size, tier: b.tier });
        note = 'Versioning is on, so the current version became a previous version. Restore it by copying that version back over the blob.';
      } else if (x.blob.deleteDays > 0) {
        (x.deletedBlobs[c] ??= []).push({ name: b.name, tier: b.tier, size: b.size, at: now() });
        note = `Soft-deleted. You have ${x.blob.deleteDays} days to run 'az storage blob undelete'.`;
      } else note = 'Blob soft delete and versioning are both off: this blob is gone for good.';
      w.emit('adm.st.blob.delete', { account: st.name, container: c, name: n, soft: x.blob.deleteDays > 0 && !x.blob.versioning, versioned: x.blob.versioning });
      return { out: `ℹ ${note}` };
    },
    'storage blob undelete': (p) => {
      req(p, [['--account-name', ''], ['--container-name', '-c'], ['--name', '-n']]);
      const { st, x } = acct(w, one(p, '--account-name'));
      const c = one(p, '--container-name')!, n = one(p, '--name')!;
      gate(w, p, st, x, 'w', 'undelete blob', c);
      const del = x.deletedBlobs[c] ?? [];
      const i = del.findIndex((b) => b.name === n);
      if (i < 0) {
        w.emit('adm.st.blob.undelete', { account: st.name, container: c, name: n, ok: false });
        const why = x.versions[`${c}/${n}`]?.length ? 'With versioning on, a deleted blob lives on as a previous version: restore it with az storage blob copy start and the version ID.' : 'Blob soft delete was off when it was deleted, so there was nothing to keep. Turn it on now so the next mistake is recoverable: az storage account blob-service-properties update --enable-delete-retention true --delete-retention-days 14';
        throw new SimError(`The specified blob '${n}' does not exist (no soft-deleted copy found).\n${why}`, 'BlobNotFound');
      }
      const [b] = del.splice(i, 1);
      containers(st)[c].push({ name: b.name, tier: b.tier, size: b.size });
      w.emit('adm.st.blob.undelete', { account: st.name, container: c, name: n, ok: true });
      return { out: `ℹ '${n}' is back in '${c}'.` };
    },
    'storage blob copy start': (p) => {
      req(p, [['--account-name', ''], ['--destination-container', ''], ['--destination-blob', ''], ['--source-uri', '']]);
      const { st, x } = acct(w, one(p, '--account-name'));
      const c = one(p, '--destination-container')!, n = one(p, '--destination-blob')!;
      gate(w, p, st, x, 'cw', 'copy blob', c);
      const uri = one(p, '--source-uri')!;
      const m = uri.match(/^https:\/\/([a-z0-9]+)\.blob\.core\.windows\.net\/([^/?]+)\/([^?]+)(\?.*)?$/i);
      if (!m) throw new SimError('--source-uri must look like https://<account>.blob.core.windows.net/<container>/<blob>[?versionid=<id>]', 'InvalidUri');
      const vid = new URLSearchParams(m[4] ?? '').get('versionid') ?? new URLSearchParams(m[4] ?? '').get('versionId');
      if (vid) {
        if (lc(m[1]) !== st.name) throw new SimError('Restore a version inside the same account.', 'InvalidUri');
        const key = `${m[2]}/${m[3]}`;
        const v = (x.versions[key] ?? []).find((z) => z.id === vid);
        if (!v) throw new SimError(`Version '${vid}' of '${m[3]}' was not found. List versions with --include v.`, 'BlobNotFound');
        const list = (containers(st)[c] ??= []);
        const cur = list.find((b) => b.name === n);
        if (cur && x.blob.versioning) (x.versions[`${c}/${n}`] ??= []).push({ id: cur.versionId ?? versionId(), size: cur.size, tier: cur.tier });
        if (cur) Object.assign(cur, { size: v.size, tier: v.tier, versionId: versionId() }); else list.push({ name: n, size: v.size, tier: v.tier, versionId: versionId() });
        w.emit('adm.st.blob.restore-version', { account: st.name, container: c, name: n, versionId: vid });
        return out(p, { copyId: uuid(), copyStatus: 'success', note: `Version ${vid} is the current version again. The content you replaced was kept as another version.` });
      }
      const src = acct(w, m[1]);
      const sb = (containers(src.st)[m[2]] ?? []).find((b) => b.name === m[3]);
      if (!sb) throw new SimError(`The source blob '${m[3]}' does not exist.`, 'BlobNotFound');
      w.uploadBlob(st.name, c, n, sb.tier === 'Archive' ? 'Hot' : sb.tier, 'cli');
      w.emit('adm.st.blob.copy', { from: src.st.name, to: st.name, container: c, name: n });
      return out(p, { copyId: uuid(), copyStatus: 'success' });
    },

    /* ---------- blob and file service properties ---------- */
    'storage account blob-service-properties update': (p) => {
      const { st, x } = acct(w, nameOf(p), rgOf(p));
      w.assertWritable(st.rg, 'update blob service properties');
      const days = (f: string, d: number) => { const n = Number(one(p, f) ?? d); if (!Number.isInteger(n) || n < 1 || n > 365) throw new SimError(`${f} must be between 1 and 365.`, 'InvalidArgumentValue'); return n; };
      if (has(p, '--enable-delete-retention')) x.blob.deleteDays = bool(p, '--enable-delete-retention', true) ? days('--delete-retention-days', 7) : 0;
      else if (has(p, '--delete-retention-days')) x.blob.deleteDays = days('--delete-retention-days', 7);
      if (has(p, '--enable-container-delete-retention')) x.blob.containerDays = bool(p, '--enable-container-delete-retention', true) ? days('--container-delete-retention-days', 7) : 0;
      else if (has(p, '--container-delete-retention-days')) x.blob.containerDays = days('--container-delete-retention-days', 7);
      if (has(p, '--enable-versioning')) {
        if (bool(p, '--enable-versioning', true) && st.props.hns) throw new SimError('Blob versioning is not supported on accounts with a hierarchical namespace (Data Lake Storage).', 'FeatureNotSupported');
        x.blob.versioning = bool(p, '--enable-versioning', true);
      }
      if (has(p, '--enable-change-feed')) x.blob.changeFeed = bool(p, '--enable-change-feed', true);
      if (has(p, '--enable-last-access-tracking')) x.blob.lastAccess = bool(p, '--enable-last-access-tracking', true);
      if (has(p, '--enable-restore-policy')) {
        if (bool(p, '--enable-restore-policy', true)) {
          const rd = Number(one(p, '--restore-days') ?? 0);
          if (!x.blob.versioning || !x.blob.changeFeed || !x.blob.deleteDays) throw new SimError('Point-in-time restore needs blob versioning, the change feed and blob soft delete turned on first.', 'FeatureDependency');
          if (!(rd > 0 && rd < x.blob.deleteDays)) throw new SimError(`--restore-days must be at least 1 and less than the blob soft delete retention (${x.blob.deleteDays} days).`, 'InvalidArgumentValue');
          x.blob.restoreDays = rd;
        } else x.blob.restoreDays = 0;
      }
      if (!['--enable-delete-retention', '--delete-retention-days', '--enable-container-delete-retention', '--container-delete-retention-days', '--enable-versioning', '--enable-change-feed', '--enable-last-access-tracking', '--enable-restore-policy'].some((f) => has(p, f))) throw new SimError('Nothing to update. Try --enable-delete-retention true --delete-retention-days 14, --enable-container-delete-retention true, --enable-versioning true or --enable-change-feed true.', 'MissingArgs');
      w.emit('adm.st.blobsvc', { account: st.name, deleteDays: x.blob.deleteDays, containerDays: x.blob.containerDays, versioning: x.blob.versioning, changeFeed: x.blob.changeFeed, lastAccess: x.blob.lastAccess, restoreDays: x.blob.restoreDays });
      return out(p, blobProps(x));
    },
    'storage account blob-service-properties show': (p) => out(p, blobProps(acct(w, nameOf(p), rgOf(p)).x)),
    'storage account file-service-properties update': (p) => {
      const { st, x } = acct(w, nameOf(p), rgOf(p));
      w.assertWritable(st.rg, 'update file service properties');
      if (!has(p, '--enable-delete-retention') && !has(p, '--delete-retention-days')) throw new SimError('Try --enable-delete-retention true --delete-retention-days 14', 'MissingArgs');
      const n = Number(one(p, '--delete-retention-days') ?? 7);
      if (!Number.isInteger(n) || n < 1 || n > 365) throw new SimError('--delete-retention-days must be between 1 and 365.', 'InvalidArgumentValue');
      x.shareDays = bool(p, '--enable-delete-retention', true) ? n : 0;
      w.emit('adm.st.filesvc', { account: st.name, shareDays: x.shareDays });
      return out(p, { shareDeleteRetentionPolicy: { enabled: x.shareDays > 0, days: x.shareDays || null } });
    },
    'storage account file-service-properties show': (p) => { const { x } = acct(w, nameOf(p), rgOf(p)); return out(p, { shareDeleteRetentionPolicy: { enabled: x.shareDays > 0, days: x.shareDays || null } }); },

    /* ---------- encryption scopes, redundancy, failover ---------- */
    'storage account encryption-scope create': (p) => {
      req(p, [['--account-name', ''], ['--name', '-n']]);
      const { st, x } = acct(w, one(p, '--account-name'), rgOf(p));
      const src = one(p, '--key-source') ?? 'Microsoft.Storage';
      if (lc(src) === 'microsoft.keyvault' && !has(p, '--key-uri')) throw new SimError('A Key Vault encryption scope needs --key-uri.', 'MissingArgs');
      if (!x.enc.scopes.includes(one(p, '--name')!)) x.enc.scopes.push(one(p, '--name')!);
      w.emit('adm.st.scope', { account: st.name, name: one(p, '--name'), source: src });
      return out(p, { name: one(p, '--name'), source: src, state: 'Enabled', requireInfrastructureEncryption: bool(p, '--require-infrastructure-encryption', false) });
    },
    'storage account encryption-scope list': (p) => { const { x } = acct(w, one(p, '--account-name'), rgOf(p)); return out(p, x.enc.scopes.map((n) => ({ name: n, state: 'Enabled' }))); },
    'storage account migration start': (p) => {
      req(p, [['--sku', '']]);
      const { st } = acct(w, nameOf(p), rgOf(p));
      w.assertWritable(st.rg, 'convert storage account');
      const to = ['Standard_LRS', 'Standard_ZRS', 'Standard_GRS', 'Standard_GZRS'].find((k) => lc(k) === lc(one(p, '--sku')));
      const ok: Record<string, string[]> = { Standard_LRS: ['Standard_ZRS'], Standard_ZRS: ['Standard_LRS'], Standard_GRS: ['Standard_GZRS'], Standard_GZRS: ['Standard_GRS'] };
      if (!to || !(ok[st.props.sku] ?? []).includes(to)) throw new SimError(`A conversion changes the zone setting only: LRS ↔ ZRS or GRS ↔ GZRS. ${st.props.sku} → ${one(p, '--sku')} isn't one of those. Change the geo setting with 'az storage account update --sku' first.`, 'InvalidConversion');
      const from = st.props.sku;
      w.updateStorageSku(st.rg, st.name, to, 'cli');
      const x = acct(w, st.name).x;
      w.emit('adm.st.migration', { account: st.name, from, sku: to });
      const arch = x.lifecycle && summarise(x.lifecycle).some((r: any) => r.archive) && Z_SKUS.includes(to);
      return { out: json({ name: 'default', targetSkuName: to, migrationStatus: 'Complete', note: 'In real Azure a conversion runs in the background and can take days. The account stays online the whole time.' }) + (arch ? `\nℹ Heads-up: your lifecycle policy has a tierToArchive action, and Archive isn't supported on ${to}. Those blobs will stay in their current tier.` : '') };
    },
    'storage account failover': (p) => {
      const { st, x } = acct(w, nameOf(p), rgOf(p));
      w.assertWritable(st.rg, 'fail over storage account');
      if (!GEO_SKUS.includes(st.props.sku)) { w.emit('adm.st.failover.blocked', { account: st.name, sku: st.props.sku }); throw new SimError(`Failover needs a geo-redundant account (GRS, RA-GRS, GZRS). ${st.name} is ${st.props.sku}, so there's no secondary region to fail over to.`, 'FailoverNotSupported'); }
      const planned = lc(one(p, '--failover-type')) === 'planned';
      const from = x.primary ?? st.location;
      x.primary = from === st.location ? (PAIR[st.location] ?? 'the paired region') : st.location;
      const sku = st.props.sku;
      if (!planned) w.updateStorageSku(st.rg, st.name, 'Standard_LRS', 'cli');
      w.emit('adm.st.failover', { account: st.name, type: planned ? 'Planned' : 'Unplanned', from, to: x.primary, sku: st.props.sku });
      return { out: json({ name: st.name, primaryLocation: x.primary, secondaryLocation: planned ? from : null, sku: { name: st.props.sku }, failoverType: planned ? 'Planned' : 'Unplanned' }) + `\nℹ ${planned ? `Planned failover swapped primary and secondary and kept ${sku}.` : `The secondary (${x.primary}) is now the primary, and the account is LRS there. Writes that hadn't replicated before the outage (after Last Sync Time) are lost. Turn geo-redundancy back on when you're ready.`}` };
    },

    /* ---------- lifecycle management and object replication ---------- */
    'storage account management-policy create': (p) => mgmtPolicy(w, p),
    'storage account management-policy update': (p) => mgmtPolicy(w, p),
    'storage account management-policy show': (p) => {
      const { x } = acct(w, nameOf(p), rgOf(p));
      if (!x.lifecycle) throw new SimError('No lifecycle management policy is set on this account.', 'ManagementPolicyNotFound');
      return out(p, { policy: x.lifecycle });
    },
    'storage account management-policy delete': (p) => {
      const { st, x } = acct(w, nameOf(p), rgOf(p));
      x.lifecycle = undefined;
      w.emit('adm.st.lifecycle.delete', { account: st.name });
      return { out: '' };
    },
    'storage account or-policy create': (p) => {
      const dstName = one(p, '--destination-account') ?? nameOf(p);
      const srcName = one(p, '--source-account');
      if (!srcName || !dstName) throw new SimError('the following arguments are required: --source-account, --destination-account (or --account-name), --source-container, --destination-container', 'MissingArgs');
      const src = acct(w, srcName), dst = acct(w, dstName);
      w.assertWritable(dst.st.rg, 'create object replication policy');
      req(p, [['--source-container', ''], ['--destination-container', '']]);
      const sc = one(p, '--source-container')!, dc = one(p, '--destination-container')!;
      const why: string[] = [];
      if (!src.x.blob.versioning) why.push(`blob versioning is off on the source account ${src.st.name}`);
      if (!dst.x.blob.versioning) why.push(`blob versioning is off on the destination account ${dst.st.name}`);
      if (!src.x.blob.changeFeed) why.push(`the change feed is off on the source account ${src.st.name}`);
      if (src.st.props.hns || dst.st.props.hns) why.push('object replication is not supported on accounts with a hierarchical namespace');
      if (why.length) {
        w.emit('adm.st.or.blocked', { source: src.st.name, destination: dst.st.name, reasons: why });
        throw new SimError(`Object replication can't be set up yet: ${why.join('; ')}.\nFix: az storage account blob-service-properties update -g ${src.st.rg} -n ${src.st.name} --enable-versioning true --enable-change-feed true, and --enable-versioning true on ${dst.st.name}.`, 'FeatureDependency');
      }
      if (!containers(src.st)[sc]) throw new SimError(`Source container '${sc}' does not exist in ${src.st.name}.`, 'ContainerNotFound');
      if (!containers(dst.st)[dc]) throw new SimError(`Destination container '${dc}' does not exist in ${dst.st.name}. Create it first.`, 'ContainerNotFound');
      const targets = new Set((adm(w).orPolicies ?? []).filter((o: any) => o.source === src.st.name).map((o: any) => o.destination));
      if (!targets.has(dst.st.name) && targets.size >= 2) throw new SimError(`${src.st.name} already replicates to two destination accounts, which is the limit for one source account.`, 'LimitExceeded');
      const pol = { policyId: uuid(), source: src.st.name, destination: dst.st.name, rules: [{ ruleId: uuid(), sourceContainer: sc, destinationContainer: dc, filters: { prefixMatch: one(p, '--prefix-match') ? [one(p, '--prefix-match')] : [], minCreationTime: one(p, '--min-creation-time') ?? null } }] };
      (adm(w).orPolicies ??= []).push(pol);
      w.emit('adm.st.or', { source: src.st.name, destination: dst.st.name, sourceContainer: sc, destinationContainer: dc, prefix: one(p, '--prefix-match') });
      return { out: json({ policyId: pol.policyId, sourceAccount: pol.source, destinationAccount: pol.destination, rules: pol.rules }) + `\nℹ Policy created on the destination, then applied to the source with the same policy ID. New and changed block blobs in '${sc}' now copy to '${dc}' asynchronously. Blobs that existed before the policy copy only if you set --min-creation-time earlier than they were created.` };
    },
    'storage account or-policy list': (p) => {
      const n = lc(nameOf(p));
      const list = (adm(w).orPolicies ?? []).filter((o: any) => o.source === n || o.destination === n);
      return out(p, list, list.map((o: any) => ({ PolicyId: o.policyId, Source: o.source, Destination: o.destination, Rules: o.rules.length })), ['PolicyId', 'Source', 'Destination', 'Rules']);
    },

    /* ---------- Azure Files (management plane: share-rm) ---------- */
    'storage share-rm create': (p) => {
      req(p, [['--storage-account', ''], ['--name', '-n']]);
      const { st, x } = acct(w, one(p, '--storage-account', '--account-name'), rgOf(p));
      w.assertWritable(st.rg, 'create file share');
      const n = one(p, '--name')!;
      if (!/^[a-z0-9](?!.*--)[a-z0-9-]{1,61}[a-z0-9]$/.test(n)) throw new SimError(`Share name '${n}' is invalid. Use 3-63 lowercase letters, numbers and single hyphens.`, 'InvalidResourceName');
      if (x.shares[n]) throw new SimError(`A share named '${n}' already exists.`, 'ShareAlreadyExists');
      const premium = st.props.sku.startsWith('Premium') || lc(st.props.kind) === 'filestorage';
      const quota = Number(one(p, '--quota') ?? (premium ? 100 : 5120));
      if (!Number.isInteger(quota) || quota < 1 || quota > 102400) throw new SimError('--quota is in GiB, from 1 to 102400 (100 TiB).', 'InvalidArgumentValue');
      const tier = ['TransactionOptimized', 'Hot', 'Cool', 'Premium'].find((t) => lc(t) === lc(one(p, '--access-tier') ?? (premium ? 'Premium' : 'TransactionOptimized')));
      if (!tier) throw new SimError('--access-tier accepts TransactionOptimized, Hot, Cool or Premium.', 'InvalidArgumentValue');
      if (tier === 'Premium' && !premium) throw new SimError('The Premium tier needs a premium FileStorage account (SSD). On a standard general-purpose v2 account pick TransactionOptimized, Hot or Cool.', 'InvalidArgumentValue');
      const proto = (one(p, '--enabled-protocols') ?? 'SMB').toUpperCase();
      if (proto === 'NFS' && !premium) { w.emit('adm.st.share.blocked', { account: st.name, reason: 'nfs' }); throw new SimError('NFS shares need a premium FileStorage account, and they are reached only from virtual networks. Use SMB on this account.', 'FeatureNotSupported'); }
      x.shares[n] = { quota, tier, protocol: proto, snapshots: [] };
      w.createShare(st.name, n, 'cli');
      w.emit('adm.st.share', { account: st.name, name: n, quota, tier, protocol: proto });
      return out(p, { name: n, shareQuota: quota, accessTier: tier, enabledProtocols: proto, id: `${st.id}/fileServices/default/shares/${n}` });
    },
    'storage share-rm list': (p) => {
      const { x } = acct(w, one(p, '--storage-account', '--account-name'), rgOf(p));
      const rows: any[] = Object.entries(x.shares).map(([name, s]) => ({ name, shareQuota: s.quota, accessTier: s.tier, deleted: false, version: null, snapshot: null }));
      if (has(p, '--include-snapshot')) for (const [name, s] of Object.entries(x.shares)) rows.push(...s.snapshots.map((t) => ({ name, shareQuota: s.quota, accessTier: s.tier, deleted: false, version: null, snapshot: t })));
      if (has(p, '--include-deleted')) rows.push(...x.deletedShares.map((d) => ({ name: d.name, shareQuota: d.quota, accessTier: d.tier, deleted: true, version: d.version, snapshot: null })));
      if ((one(p, '--query') ?? '').includes('version') && lc(one(p, '--output')) === 'tsv') return { out: x.deletedShares.at(-1)?.version ?? '' };
      return out(p, rows, rows.map((r) => ({ Name: r.name, Quota: r.shareQuota, AccessTier: r.accessTier, Snapshot: r.snapshot ?? '', Deleted: r.deleted ? 'True' : '', Version: r.version ?? '' })), ['Name', 'Quota', 'AccessTier', 'Snapshot', 'Deleted', 'Version']);
    },
    'storage share-rm show': (p) => {
      const { x } = acct(w, one(p, '--storage-account', '--account-name'), rgOf(p));
      const s = x.shares[one(p, '--name') ?? ''];
      if (!s) throw new SimError(`The specified share '${one(p, '--name')}' does not exist.`, 'ShareNotFound');
      return out(p, { name: one(p, '--name'), shareQuota: s.quota, accessTier: s.tier, enabledProtocols: s.protocol, snapshots: s.snapshots.length });
    },
    'storage share-rm snapshot': (p) => {
      req(p, [['--storage-account', ''], ['--name', '-n']]);
      const { st, x } = acct(w, one(p, '--storage-account', '--account-name'), rgOf(p));
      const n = one(p, '--name')!;
      const s = x.shares[n];
      if (!s) throw new SimError(`The specified share '${n}' does not exist.`, 'ShareNotFound');
      if (s.snapshots.length >= 200) throw new SimError('A share can have at most 200 snapshots. Delete old ones first (Azure Backup can keep more in a vault).', 'ShareSnapshotCountExceeded');
      const t = new Date(Date.now() + s.snapshots.length * 1000).toISOString().replace(/\.\d+Z$/, '.0000000Z');
      s.snapshots.push(t);
      w.emit('adm.st.snapshot', { account: st.name, share: n, snapshot: t, count: s.snapshots.length });
      return { out: json({ name: n, snapshotTime: t }) + `\nℹ Read-only, incremental snapshot of the whole share. Windows shows it under Previous Versions; you can restore single files or the share from it. ${s.snapshots.length}/200 used.` };
    },
    'storage share-rm delete': (p) => {
      req(p, [['--storage-account', ''], ['--name', '-n']]);
      const { st, x } = acct(w, one(p, '--storage-account', '--account-name'), rgOf(p));
      w.assertWritable(st.rg, 'delete file share');
      const n = one(p, '--name')!;
      const s = x.shares[n];
      if (!s) throw new SimError(`The specified share '${n}' does not exist.`, 'ShareNotFound');
      if (s.snapshots.length && !/snapshots/i.test(one(p, '--include') ?? '')) { w.emit('adm.st.share.delete.blocked', { account: st.name, share: n }); throw new SimError(`The share has snapshots and the operation requires no snapshots. Add --include snapshots to delete '${n}' with its ${s.snapshots.length} snapshot(s).`, 'ShareHasSnapshots'); }
      delete x.shares[n];
      st.props.shares = (st.props.shares as string[]).filter((z) => z !== n);
      const soft = x.shareDays > 0;
      const version = `01DA${hex(12).toUpperCase()}`;
      if (soft) x.deletedShares.push({ name: n, version, quota: s.quota, tier: s.tier, protocol: s.protocol, snapshots: s.snapshots, at: now() });
      w.emit('adm.st.share.delete', { account: st.name, name: n, soft });
      return { out: `ℹ ${soft ? `Share '${n}' is soft-deleted (with its snapshots). Restore it within ${x.shareDays} days with 'az storage share-rm restore'. Deleted version: ${version}` : `Share soft delete is off: '${n}' and its snapshots are gone for good.`}` };
    },
    'storage share-rm restore': (p) => {
      req(p, [['--storage-account', ''], ['--name', '-n'], ['--deleted-version', '']]);
      const { st, x } = acct(w, one(p, '--storage-account', '--account-name'), rgOf(p));
      const n = one(p, '--name')!, ver = one(p, '--deleted-version')!;
      const i = x.deletedShares.findIndex((d) => d.name === n && d.version === ver);
      if (i < 0) throw new SimError(`No soft-deleted share '${n}' with version '${ver}'. Run 'az storage share-rm list --storage-account ${st.name} --include-deleted -o table'.`, 'ShareNotFound');
      const to = one(p, '--restored-name') ?? n;
      if (x.shares[to]) throw new SimError(`A share named '${to}' already exists. Use --restored-name to restore under another name.`, 'ShareAlreadyExists');
      const d = x.deletedShares.splice(i, 1)[0];
      x.shares[to] = { quota: d.quota, tier: d.tier, protocol: d.protocol, snapshots: d.snapshots };
      w.createShare(st.name, to, 'cli');
      w.emit('adm.st.share.restore', { account: st.name, name: to, snapshots: d.snapshots.length });
      return out(p, { name: to, restored: true, snapshots: d.snapshots.length });
    },

    /* ---------- share-level RBAC roles for Azure Files (only these role names) ---------- */
    'role assignment create': {
      when: (p) => SHARE_ROLES.test(one(p, '--role') ?? ''),
      run: (p) => {
        req(p, [['--role', ''], ['--scope', '']]);
        const who = one(p, '--assignee', '--assignee-object-id');
        if (!who) throw new SimError('the following arguments are required: --assignee', 'MissingArgs');
        const u = w.users.find((z) => lc(z.upn) === lc(who) || lc(z.upn.split('@')[0]) === lc(who));
        if (!u) throw new SimError(`Cannot find user or group '${who}'. Share-level roles go to identities that exist in Microsoft Entra ID (synced from AD DS for hybrid users).`, 'PrincipalNotFound');
        const scope = one(p, '--scope')!;
        const m = scope.match(/\/storageAccounts\/([^/]+)(?:\/fileServices\/default\/fileshares\/([^/]+))?\/?$/i);
        if (!m) throw new SimError('Use a storage account or file share scope, for example /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/<account>/fileServices/default/fileshares/<share>', 'InvalidScope');
        const { st, x } = acct(w, m[1]);
        if (m[2] && !x.shares[m[2]]) throw new SimError(`File share '${m[2]}' was not found in ${st.name}.`, 'ResourceNotFound');
        const role = (one(p, '--role') ?? '').replace(/\b\w/g, (c) => c.toUpperCase()).replace(/Smb/g, 'SMB');
        w.emit('role.assign', { role, scope, scopeType: m[2] ? 'share' : 'storage', scopeName: m[2] ?? st.name, principal: u.upn, principalName: u.upn, principalKind: 'user' });
        return out(p, { principalName: u.upn, principalType: 'User', roleDefinitionName: role, scope, note: 'Share-level permission set. Directory and file permissions (Windows ACLs) still apply on top.' });
      },
    },
  };
}

function blobProps(x: X) {
  return { deleteRetentionPolicy: { enabled: x.blob.deleteDays > 0, days: x.blob.deleteDays || null }, containerDeleteRetentionPolicy: { enabled: x.blob.containerDays > 0, days: x.blob.containerDays || null }, isVersioningEnabled: x.blob.versioning, changeFeed: { enabled: x.blob.changeFeed }, lastAccessTimeTrackingPolicy: { enable: x.blob.lastAccess }, restorePolicy: { enabled: x.blob.restoreDays > 0, days: x.blob.restoreDays || null } };
}
function orFor(w: World, account: string) { return (adm(w).orPolicies ?? []).filter((o: any) => o.source === lc(account)); }
function replicate(w: World, account: string, container: string, name: string): string {
  const hits: string[] = [];
  for (const o of orFor(w, account)) for (const r of o.rules) if (r.sourceContainer === container && (!r.filters.prefixMatch.length || r.filters.prefixMatch.some((pf: string) => name.startsWith(pf)))) {
    const d = w.storageByName(o.destination);
    if (!d.props.containers[r.destinationContainer]) continue;
    w.uploadBlob(o.destination, r.destinationContainer, name, 'Hot', 'cli');
    w.emit('adm.st.or.copy', { source: account, destination: o.destination, name });
    hits.push(`${o.destination}/${r.destinationContainer}`);
  }
  return hits.length ? `ℹ Object replication copied '${name}' to ${hits.join(', ')} (asynchronously in real Azure).` : '';
}
function mgmtPolicy(w: World, p: Parsed): AdminOut {
  req(p, [['--policy', '']]);
  const { st, x } = acct(w, nameOf(p), rgOf(p));
  w.assertWritable(st.rg, 'set lifecycle management policy');
  const pol = readPolicy(one(p, '--policy')!);
  const rules = summarise(pol);
  if (rules.some((r: any) => r.usesAccess) && !x.blob.lastAccess) {
    w.emit('adm.st.lifecycle.blocked', { account: st.name, reason: 'lastAccess' });
    throw new SimError(`This policy uses daysAfterLastAccessTimeGreaterThan, which needs last access time tracking: az storage account blob-service-properties update -g ${st.rg} -n ${st.name} --enable-last-access-tracking true`, 'LastAccessTimeTrackingNotEnabled');
  }
  x.lifecycle = pol;
  w.emit('adm.st.lifecycle', { account: st.name, rules });
  const lines = rules.map((r: any) => `  ${r.name}: ${[r.cool && `Cool after ${r.cool} d`, r.cold && `Cold after ${r.cold} d`, r.archive && `Archive after ${r.archive} d`, r.delete && `delete after ${r.delete} d`].filter(Boolean).join(' → ')}${r.prefix.length ? ` (only ${r.prefix.join(', ')})` : ''}`);
  const z = Z_SKUS.includes(st.props.sku) && rules.some((r: any) => r.archive) ? `\nℹ ${st.props.sku} accounts don't support Archive, so the tierToArchive step won't move anything here.` : '';
  return { out: json({ policy: pol, lastModifiedTime: now() }) + `\nℹ Lifecycle rules saved:\n${lines.join('\n')}\nℹ The policy runs about once a day, and a new or changed policy can take up to 24 hours before the first actions happen.${z}` };
}
function sasCmd(w: World, p: Parsed, scope: 'container' | 'blob'): AdminOut {
  const { st, x } = acct(w, one(p, '--account-name'));
  const container = scope === 'container' ? one(p, '--name') : one(p, '--container-name');
  if (!container) throw new SimError(scope === 'container' ? 'the following arguments are required: --name/-n (the container)' : 'the following arguments are required: --container-name/-c', 'MissingArgs');
  const blob = scope === 'blob' ? one(p, '--name') : undefined;
  if (scope === 'blob' && !blob) throw new SimError('the following arguments are required: --name/-n (the blob)', 'MissingArgs');
  const policy = one(p, '--policy-name', '--id');
  const perms = one(p, '--permissions');
  const expiry = one(p, '--expiry');
  const asUser = has(p, '--as-user');
  if (asUser && lc(one(p, '--auth-mode')) !== 'login') throw new SimError('--as-user needs --auth-mode login: a user delegation SAS is signed with a key that Microsoft Entra ID issues to you.', 'MissingArgs');
  if (asUser && policy) throw new SimError('A user delegation SAS cannot use a stored access policy. Stored access policies work with service SAS only.', 'InvalidArgumentValue');
  if (!policy && (!perms || !expiry)) throw new SimError('Give --permissions and --expiry, or --policy-name to take them from a stored access policy.', 'MissingArgs');
  if (policy) {
    const pol = x.policies[container]?.[policy];
    if (pol?.permissions && perms) throw new SimError(`Policy '${policy}' already sets permissions. Specify them in the policy or in the SAS, not both.`, 'InvalidArgumentValue');
    if (pol?.expiry && expiry) throw new SimError(`Policy '${policy}' already sets the expiry. Specify it in the policy or in the SAS, not both.`, 'InvalidArgumentValue');
  }
  if (perms && !/^[racwdlxtmeopi]+$/.test(perms)) throw new SimError('Unknown permission letter. Common ones: r read, a add, c create, w write, d delete, l list.', 'InvalidArgumentValue');
  if (asUser && expiry && Date.parse(expiry) - Date.now() > 7 * DAY) { w.emit('adm.st.sas.blocked', { account: st.name, reason: '7days' }); throw new SimError('A user delegation SAS can be valid for at most 7 days from now, because the user delegation key behind it lasts at most 7 days.', 'InvalidArgumentValue'); }
  if (expiry && Number.isNaN(Date.parse(expiry))) throw new SimError(`--expiry '${expiry}' is not a valid UTC time. Use the format 2026-12-31T23:59Z.`, 'InvalidArgumentValue');
  const keyName: 'key1' | 'key2' = one(p, '--account-key') === x.keys.key2 ? 'key2' : 'key1';
  const sig = hex(32);
  const kind = asUser ? 'user' : 'service';
  st$(w).sas[sig] = { account: st.name, kind, container, blob, perms: perms ?? '', expiry, policy, keyName: asUser ? undefined : keyName, keyGen: asUser ? undefined : keyName === 'key1' ? x.keys.gen1 : x.keys.gen2, udGen: asUser ? x.udGen : undefined, signer: asUser ? me(w) : undefined, https: has(p, '--https-only') };
  const q: [string, string | undefined][] = [['st', one(p, '--start')], ['se', expiry], ['sp', perms], ['spr', has(p, '--https-only') ? 'https' : undefined], ['sip', one(p, '--ip')], ['sv', SV], ['sr', scope === 'container' ? 'c' : 'b'], ['si', policy]];
  if (asUser) q.push(['skoid', uuid()], ['sktid', '11111111-2222-3333-4444-555555555555'], ['skt', now()], ['ske', expiry], ['sks', 'b'], ['skv', SV]);
  q.push(['sig', sig]);
  const token = tokenOf(q);
  w.emit('adm.st.sas', { account: st.name, kind, container, blob, perms, expiry, policy, https: has(p, '--https-only') });
  const full = has(p, '--full-uri') ? `https://${st.name}.blob.core.windows.net/${container}${blob ? `/${blob}` : ''}?${token}` : token;
  return lc(one(p, '--output')) === 'tsv' ? { out: full } : { out: json(full) };
}

/* ------------------------------------------------------------------ */
/* Shell tools: azcopy, net use, Test-NetConnection, cat, ls           */
/* ------------------------------------------------------------------ */
interface Loc { account?: string; container?: string; path?: string; sas?: string; local?: string; files?: string[] }
function where(w: World, arg: string): Loc {
  const m = arg.match(/^https:\/\/([a-z0-9]+)\.(blob|dfs|file)\.core\.windows\.net\/([^/?]*)\/?([^?]*)(\?(.*))?$/i);
  if (m) return { account: lc(m[1]), container: m[3], path: m[4] || undefined, sas: m[6] };
  const local = arg.replace(/^\.\//, '').replace(/\/\*?$/, '').replace(/\/\*$/, '');
  const files = LOCAL[local];
  if (!files) throw new SimError(`failed to perform copy command due to error: cannot start job due to error: cannot scan the path ${arg}, please verify that it is a valid path. (Folders in this practice shell: ${Object.keys(LOCAL).join(', ')}.)`, 'PathNotFound');
  return { local, files };
}
function azAuth(w: World, l: Loc, need: string) {
  const { st, x } = acct(w, l.account);
  firewall(w, st, x, 'azcopy');
  if (l.sas) { useSas(w, st, x, l.sas, need, l.container); return 'SAS'; }
  if (!st$(w).azLogin) throw new SimError(`failed to perform copy command due to error: no SAS token or OAuth token is present and the resource is not public.\nRun 'azcopy login' (Microsoft Entra ID) or add a SAS token to the URL.`, 'NoCredential');
  if (!hasDataRole(w, st.name, /[wcd]/.test(need))) {
    w.emit('adm.azcopy', { op: 'copy', ok: false, reason: 'rbac', account: st.name });
    throw new SimError(`RESPONSE Status: 403 This request is not authorized to perform this operation using this permission.\nAuthorizationPermissionMismatch: azcopy login uses your Microsoft Entra identity, and that identity has no Storage Blob Data ${/[wcd]/.test(need) ? 'Contributor' : 'Reader'} role on ${st.name}. Owner or Contributor on the subscription isn't enough: they manage the account, not the data inside it. Assign the data role (it can take a few minutes to apply) or use a SAS token.`, 'AuthorizationPermissionMismatch');
  }
  return 'Microsoft Entra ID';
}
function summary(n: number, extra = '') {
  const job = uuid();
  return `INFO: Scanning...\n${extra}Job ${job} has started\nLog file is located at: /home/learner/.azcopy/${job}.log\n\n100.0 %, ${n} Done, 0 Failed, 0 Pending, 0 Skipped, ${n} Total, 2-sec Throughput (Mb/s): ${(4 + Math.random() * 20).toFixed(1)}\n\nJob ${job} summary\nElapsed Time (Minutes): 0.0334\nNumber of File Transfers: ${n}\nNumber of File Transfers Completed: ${n}\nNumber of File Transfers Failed: 0\nNumber of File Transfers Skipped: 0\nTotalBytesTransferred: ${n * 412311}\nFinal Job Status: Completed`;
}
function azcopy(rest: string[], w: World): AdminOut {
  const words = rest.filter((t) => !t.startsWith('-'));
  const flag = (f: string) => { const i = rest.findIndex((t) => t === f || t.startsWith(`${f}=`)); if (i < 0) return undefined; const t = rest[i]; return t.includes('=') ? t.split('=').slice(1).join('=') : rest[i + 1] && !rest[i + 1].startsWith('-') ? rest[i + 1] : 'true'; };
  const sub = lc(words[0]);
  const s = st$(w);
  if (!sub || sub === '--version' || rest[0] === '-v' || rest[0] === '--version') return { out: 'azcopy version 10.27.1' };
  if (sub === 'login') { s.azLogin = me(w); w.emit('adm.azcopy', { op: 'login', ok: true, identity: rest.includes('--identity') ? 'managed identity' : me(w) }); return { out: `INFO: ${rest.includes('--identity') ? 'Logged in with the managed identity of this machine.' : `Logging in with Microsoft Entra ID as ${me(w)}.`}\nINFO: Login succeeded.\nℹ AzCopy now sends an OAuth token. For blob data that identity needs Storage Blob Data Reader (to read) or Contributor (to write).` }; }
  if (sub === 'logout') { s.azLogin = ''; return { out: 'INFO: Logout succeeded.' }; }
  try {
    if (sub === 'make') {
      const l = where(w, words[1] ?? '');
      if (!l.account || !l.container) throw new SimError('Usage: azcopy make "https://<account>.blob.core.windows.net/<container>?<SAS>"', 'InvalidUri');
      const auth = azAuth(w, l, 'c');
      w.createContainer(l.account, l.container, 'cli');
      w.emit('adm.azcopy', { op: 'make', ok: true, account: l.account, container: l.container, auth });
      return { out: 'Successfully created the resource.' };
    }
    if (sub === 'copy' || sub === 'cp' || sub === 'sync') {
      const sync = sub === 'sync';
      if (words.length < 3) throw new SimError(`Usage: azcopy ${sub} "<source>" "<destination>"${sync ? ' [--delete-destination true]' : ' --recursive'}`, 'MissingArgs');
      const src = where(w, words[1]), dst = where(w, words[2]);
      if (src.local && dst.local) throw new SimError('One side must be an Azure Storage URL.', 'InvalidUri');
      if (src.local && dst.account) {
        if (!dst.container) throw new SimError('The destination URL needs a container: https://<account>.blob.core.windows.net/<container>', 'InvalidUri');
        const auth = azAuth(w, dst, sync ? 'rwl' : 'cw');
        const { st } = acct(w, dst.account);
        const c = containers(st)[dst.container];
        if (!c) throw new SimError(`RESPONSE Status: 404 The specified container does not exist (${dst.container}). Create it first: azcopy make or az storage container create.`, 'ContainerNotFound');
        const tier = flag('--block-blob-tier');
        if (flag('--dry-run') === 'true') return { out: src.files!.map((f) => `DRYRUN: copy ${src.local}/${f} to ${dst.container}/${f}`).join('\n') };
        let todo = src.files!;
        let removed: string[] = [];
        if (sync) {
          todo = src.files!.filter((f) => !c.some((b) => b.name === f));
          if (flag('--delete-destination') === 'true') { removed = c.filter((b) => !src.files!.includes(b.name)).map((b) => b.name); for (const r of removed) c.splice(c.findIndex((b) => b.name === r), 1); }
        }
        for (const f of todo) w.uploadBlob(st.name, dst.container, f, tier ?? 'Hot', 'cli');
        w.emit('adm.azcopy', { op: sync ? 'sync' : 'copy', ok: true, files: todo.length, removed: removed.length, account: st.name, container: dst.container, auth, direction: 'upload' });
        const pre = `INFO: Authenticating to destination using ${auth}\n${sync ? `INFO: Compared ${src.files!.length} local files with ${c.length + removed.length - todo.length} blobs. ${todo.length} new or changed${removed.length ? `, ${removed.length} deleted from the destination (--delete-destination true)` : ''}.\n` : ''}`;
        return { out: todo.length || removed.length ? summary(todo.length, pre) : `${pre}The source and destination are already in sync. Nothing to transfer.` };
      }
      if (src.account && dst.account) {
        const a1 = azAuth(w, src, 'rl'), a2 = azAuth(w, dst, 'cw');
        const s1 = acct(w, src.account).st, s2 = acct(w, dst.account).st;
        const from = containers(s1)[src.container ?? ''] ?? [];
        if (!containers(s2)[dst.container ?? '']) throw new SimError(`RESPONSE Status: 404 The specified container does not exist (${dst.container}).`, 'ContainerNotFound');
        const items = src.path ? from.filter((b) => b.name === src.path) : from;
        for (const b of items) w.uploadBlob(s2.name, dst.container!, b.name, b.tier === 'Archive' ? 'Hot' : b.tier, 'cli');
        w.emit('adm.azcopy', { op: sync ? 'sync' : 'copy', ok: true, files: items.length, account: s2.name, container: dst.container, auth: `${a1}/${a2}`, direction: 'server-to-server' });
        return { out: summary(items.length, `INFO: Authenticating to source using ${a1}, destination using ${a2}\nINFO: Server-to-server copy: the data moves between the storage accounts directly, not through this shell.\n`) };
      }
      if (src.account && dst.local) {
        const a = azAuth(w, src, 'rl');
        const st = acct(w, src.account).st;
        const n = (containers(st)[src.container ?? ''] ?? []).length;
        w.emit('adm.azcopy', { op: 'copy', ok: true, files: n, account: st.name, auth: a, direction: 'download' });
        return { out: summary(n, `INFO: Authenticating to source using ${a}\n`) };
      }
    }
    if (sub === 'list') {
      const l = where(w, words[1] ?? '');
      const a = azAuth(w, l, 'l');
      const st = acct(w, l.account).st;
      const items = containers(st)[l.container ?? ''] ?? [];
      w.emit('adm.azcopy', { op: 'list', ok: true, account: st.name, auth: a });
      return { out: items.map((b) => `INFO: ${b.name};  Content Length: ${(b.size / 1024).toFixed(2)} KiB`).join('\n') || 'INFO: (empty)' };
    }
    if (sub === 'jobs') return { out: 'Existing Jobs\nJobId: (see the job IDs in the copy output above)\nStatus: Completed\nℹ azcopy jobs resume <job-id> picks up a job that was interrupted, without re-sending finished files.' };
    if (sub === 'remove' || sub === 'rm') {
      const l = where(w, words[1] ?? '');
      azAuth(w, l, 'd');
      const st = acct(w, l.account).st;
      const c = containers(st)[l.container ?? ''] ?? [];
      const n = l.path ? c.filter((b) => b.name === l.path).length : c.length;
      if (l.path) { const i = c.findIndex((b) => b.name === l.path); if (i >= 0) c.splice(i, 1); } else c.length = 0;
      w.emit('adm.azcopy', { op: 'remove', ok: true, files: n, account: st.name });
      return { out: summary(n) };
    }
    return { error: `azcopy: unknown command '${words[0]}'. Try: azcopy login, azcopy make, azcopy copy, azcopy sync, azcopy list, azcopy remove, azcopy jobs list` };
  } catch (e) {
    if (e instanceof SimError) return { error: e.message };
    throw e;
  }
}
function netUse(rest: string[], w: World): AdminOut {
  const path = rest.find((t) => /file\.core\.windows\.net/i.test(t)) ?? '';
  const m = path.match(/^[\\/]{2}([a-z0-9]+)\.file\.core\.windows\.net[\\/]([\w-]+)/i);
  if (!m) return { error: 'Usage: net use Z: \\\\<account>.file.core.windows.net\\<share>   (add /user:localhost\\<account> <key> to mount with the storage account key)' };
  const user = rest.find((t) => /^\/user:/i.test(t));
  const key = user ? rest[rest.indexOf(user) + 1] : undefined;
  let st: Res, x: X;
  try { ({ st, x } = acct(w, m[1])); } catch { return { error: 'System error 53 has occurred.\n\nThe network path was not found.' }; }
  const share = m[2];
  const fail = (reason: string, why: string) => { w.emit('adm.st.mount', { account: st.name, share, ok: false, reason, user: me(w) }); return { error: `System error 5 has occurred.\n\nAccess is denied.\n\nℹ ${why}` }; };
  if (blockedByFirewall(x)) return fail('firewall', `The storage firewall blocks this client's IP. Allow it with an IP or virtual network rule.`);
  if (!x.shares[share] && !(st.props.shares as string[]).includes(share)) return { error: 'System error 67 has occurred.\n\nThe network name cannot be found.' };
  if (user) {
    if (!x.sharedKey) return fail('sharedkey', 'Storage account key access is turned off on this account, so key-based mounts are refused.');
    if (key !== x.keys.key1 && key !== x.keys.key2) return fail('badkey', 'That key does not match key1 or key2 of the account (was it rotated?).');
    w.emit('adm.st.mount', { account: st.name, share, ok: true, auth: 'key', user: 'storage account key' });
    return { out: 'The command completed successfully.\nℹ Mounted with the storage account key. That bypasses identity-based permissions entirely and acts like a superuser, so keep it for admins setting Windows ACLs.' };
  }
  if (x.files.auth === 'None') return fail('noidentity', `Identity-based access isn't turned on for ${st.name}, so your Kerberos ticket means nothing to it. Turn on an identity source (Microsoft Entra Kerberos, AD DS or Microsoft Entra Domain Services), or mount with the account key.`);
  const smbRole = w.events.some((e) => e.type === 'role.assign' && /^Storage File Data SMB/i.test(String(e.data.role ?? '')) && [e.data.principalName, e.data.principal].some((v) => lc(String(v ?? '')) === lc(me(w))) && lc(String(e.data.scope ?? '')).includes(`/storageaccounts/${st.name}`) && (!/fileshares\//i.test(String(e.data.scope)) || lc(String(e.data.scope)).endsWith(`/fileshares/${lc(share)}`)));
  if (x.files.share === 'None' && !smbRole) return fail('noshare', `Your identity is known (${x.files.auth === 'AADKERB' ? 'Microsoft Entra Kerberos' : x.files.auth === 'AD' ? 'AD DS' : 'Microsoft Entra Domain Services'}), but it has no share-level permission. Assign a role such as Storage File Data SMB Share Contributor on the share, or set a default share-level permission for all authenticated identities.`);
  const via = smbRole ? 'an RBAC share-level role' : `the default share-level permission (${x.files.share})`;
  w.emit('adm.st.mount', { account: st.name, share, ok: true, auth: 'identity', source: x.files.auth, via: smbRole ? 'rbac' : 'default', user: me(w) });
  return { out: `The command completed successfully.\nℹ Mounted as ${me(w)} using ${x.files.auth === 'AADKERB' ? 'Microsoft Entra Kerberos' : x.files.auth === 'AD' ? 'AD DS' : 'Microsoft Entra Domain Services'}. Share access came from ${via}; Windows ACLs on folders and files apply next.` };
}

export function az(tokens: string[], w: World): AdminOut | null {
  return run(table(w), tokens, w);
}
export function shell(tokens: string[], w: World): AdminOut | null {
  const [cmd, ...rest] = tokens;
  const c = lc(cmd);
  if (c === 'azcopy') { w.emit('cli', { command: `azcopy ${lc(rest[0] ?? '')}`, path: 'azcopy', line: tokens.join(' ') }); return azcopy(rest, w); }
  if (c === 'net' && lc(rest[0]) === 'use') return netUse(rest.slice(1), w);
  if (c === 'test-netconnection') {
    const host = rest[rest.findIndex((t) => /computername/i.test(t)) + 1] ?? rest[0] ?? '';
    if (!/\.file\.core\.windows\.net$/i.test(host)) return null;
    return { out: `ComputerName     : ${host}\nRemoteAddress    : 20.60.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}\nRemotePort       : 445\nTcpTestSucceeded : True\nℹ SMB uses TCP port 445. Many home ISPs and some company firewalls block it outbound; then use a VPN, ExpressRoute or Azure File Sync.` };
  }
  if (c === 'cat' && FILES[(rest[0] ?? '').replace(/^\.\//, '')]) { w.emit('file.view', { file: rest[0].replace(/^\.\//, '') }); return { out: FILES[rest[0].replace(/^\.\//, '')] }; }
  if (c === 'ls' && LOCAL[(rest[0] ?? '').replace(/^\.\//, '').replace(/\/$/, '')]) return { out: LOCAL[rest[0].replace(/^\.\//, '').replace(/\/$/, '')].join('  ') };
  return null;
}
export const COMPLETIONS: string[] = [
  'az storage account network-rule add', 'az storage account network-rule list', 'az storage account keys list', 'az storage account keys renew',
  'az storage container generate-sas', 'az storage blob generate-sas', 'az storage account generate-sas', 'az storage container policy create', 'az storage container policy delete',
  'az storage blob download', 'az storage blob delete', 'az storage blob undelete', 'az storage blob copy start', 'az storage container delete', 'az storage container restore',
  'az storage account blob-service-properties update', 'az storage account file-service-properties update', 'az storage account management-policy create',
  'az storage account or-policy create', 'az storage account migration start', 'az storage account failover', 'az storage account encryption-scope create',
  'az storage share-rm create', 'az storage share-rm snapshot', 'az storage share-rm delete', 'az storage share-rm restore', 'az storage share-rm list',
  'azcopy login', 'azcopy copy', 'azcopy sync', 'azcopy make', 'azcopy list', 'net use', 'cat lifecycle.json', 'ls hr-docs',
];
