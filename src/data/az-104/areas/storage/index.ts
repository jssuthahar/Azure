/**
 * AZ-104 "storage" area: everything this part of the course plugs into the
 * shared engines (3D scene text, portal tours, problem cards, exam items,
 * games, comparisons and service cards). Items are original, written from the
 * official skills outline.
 */
import type { LessonSims } from '../../../az-900/lesson-sims';
import type { Sim3D } from '../../../az-900/sims3d';
import type { Tour } from '../../tour-kit';
import type { ProblemSolution } from '../../../az-900/problem-solution';
import type { FormatItem } from '../../../az-900/exam-items';
import type { SortSet, Riddle } from '../../../az-900/games';
import type { Comparison } from '../../../az-900/compare';
import type { Service } from '../../../az-900/services';
import { TOURS as T } from './tours';

const d3 = (start: number, intro: string) => ({ mode: 'adminstorage' as const, start, intro });

/** Lesson slug → 3D step and portal tour. */
export const SIMS: Record<string, LessonSims> = {
  'storage-firewalls-and-virtual-networks': { d3: d3(0, 'Send four callers at the firewall. Only three get in.'), tour: { id: 'adm-storage-firewall', intro: 'Switch the account to selected networks and add a VNet rule, an IP rule and the exception.' } },
  'sas-tokens-and-stored-access-policies': { d3: d3(2, 'Use the SAS, delete its policy, then use it again.'), tour: { id: 'adm-storage-sas-policy', intro: 'Add a stored access policy and generate a SAS that points at it.' } },
  'storage-access-keys': { d3: d3(3, 'Rotate the wrong way first, then the right way.'), tour: { id: 'adm-storage-keys', intro: 'Set a rotation reminder, rotate key1 and turn off key access.' } },
  'azure-files-identity-based-access': { d3: d3(1, 'Try all four ways in, ending with the staff PC.'), tour: { id: 'adm-files-identity', intro: 'Turn on Microsoft Entra Kerberos and give HR a share-level role.' } },
  'configure-storage-accounts-and-encryption': { d3: d3(4, 'Switch to your own key, then disable it.'), tour: { id: 'adm-storage-create', intro: 'Create a locked-down account, then move it to a customer-managed key.' } },
  'storage-redundancy-and-object-replication': { d3: d3(5, 'Pick a redundancy option and fail a zone, then a region.'), tour: { id: 'adm-storage-redundancy', intro: 'Change redundancy, then add an object replication rule.' } },
  'storage-explorer-and-azcopy': { d3: d3(6, 'Run AzCopy, then turn on object replication.'), tour: { id: 'adm-storage-explorer', intro: 'Upload in Storage browser, open Storage Explorer, then use AzCopy.' } },
  'azure-file-shares-snapshots-soft-delete': { d3: d3(8, 'Wipe a folder on the share and restore it from a snapshot.'), tour: { id: 'adm-file-share-snapshots', intro: 'Create a share, take a snapshot and undelete the share.' } },
  'blob-containers-tiers-and-lifecycle': { d3: d3(7, 'Let the lifecycle rule run, then ask for the file back.'), tour: { id: 'adm-blob-lifecycle', intro: 'Create a private container, change a tier and add a lifecycle rule.' } },
  'blob-soft-delete-and-versioning': { d3: d3(8, 'Delete with no protection, then with soft delete and versioning.'), tour: { id: 'adm-blob-soft-delete', intro: 'Turn on soft delete and versioning, then undelete and restore a version.' } },
};

/** Narration for the 'adminstorage' 3D scene. Step order matches src/lib/dc3d/admin/adminstorage.ts. */
export const SCENE: Sim3D = {
  title: 'Azure Storage for administrators: access, protection and data movement',
  steps: [
    { title: 'The front door: the storage firewall', text: 'Every account has a public endpoint that accepts **all networks** by default. Set the **default action to Deny** and only what you list gets in: **virtual network rules** (subnets with the Microsoft.Storage service endpoint), **IP rules** (public addresses only) and **trusted Azure services** if you tick the exception.', actions: [{ id: 'internet', label: '🌍 …a random internet caller with a valid key tries?', kind: 'danger' }, { id: 'vnet', label: '🖥️ …a VM in the allowed subnet calls?', kind: 'ok' }, { id: 'ip', label: '🏢 …the office’s public IP calls?', kind: 'ok' }, { id: 'trusted', label: '🗃️ …Azure Backup (a trusted service) calls?', kind: 'ok' }] },
    { title: 'Three ways in, plus one for file shares', text: 'Callers prove who they are with an **account key** (full control), a **SAS** (limited rights for limited time) or a **Microsoft Entra ID** token checked against **RBAC data roles**. For SMB file shares, users bring a **Kerberos** ticket from AD DS, Microsoft Entra Domain Services or Microsoft Entra Kerberos.', actions: [{ id: 'key', label: '🔑 …the app uses the account key?', kind: 'danger' }, { id: 'sas', label: '🎫 …the app uses a SAS?', kind: 'ok' }, { id: 'entra', label: '🆔 …the app uses Microsoft Entra ID?', kind: 'ok' }, { id: 'smb', label: '💻 …a staff PC maps the file share?', kind: 'ok' }] },
    { title: 'SAS tokens and stored access policies', text: 'A **service SAS** can point at a **stored access policy** on the container (up to 5 per container). The policy holds the permissions and expiry, so deleting or editing it revokes every SAS that names it. An **ad hoc SAS** can only be revoked by regenerating the key that signed it.', actions: [{ id: 'sasuse', label: '🎫 …the auditor uses the SAS?', kind: 'ok' }, { id: 'revoke', label: '🗑️ …we delete the stored access policy?', kind: 'danger' }, { id: 'adhoc', label: '⚠️ …the SAS had no policy?', kind: 'plain' }] },
    { title: 'Rotate access keys', text: 'Each account has **two keys** so you can rotate without downtime: move apps to key2, regenerate key1, and next time do the reverse. A **key expiration policy** flags old keys. Regenerating a key kills every SAS signed with it.', actions: [{ id: 'naive', label: '💥 …we regenerate key1 while the app still uses it?', kind: 'danger' }, { id: 'swap', label: '🔄 …we move the app to key2 first?', kind: 'ok' }] },
    { title: 'Encryption at rest', text: 'Azure Storage always encrypts data with **AES-256**. By default Microsoft manages the key. With a **customer-managed key** in Key Vault (soft delete and purge protection on), the account’s **managed identity** wraps and unwraps its data key with your key, and you can revoke it.', actions: [{ id: 'mmk', label: '🔒 …we keep Microsoft-managed keys?', kind: 'ok' }, { id: 'cmk', label: '🔐 …we switch to a customer-managed key?', kind: 'ok' }, { id: 'revokekey', label: '🚫 …we disable the key in Key Vault?', kind: 'danger' }] },
    { title: 'Redundancy and a region outage', text: '**LRS** keeps 3 copies in one datacenter, **ZRS** spreads 3 across availability zones, **GRS** adds an async copy in the paired region and **GZRS** combines both. RA- versions let you read the secondary. A **customer-managed failover** promotes the secondary when the primary region is down.', actions: [{ id: 'lrs', label: 'LRS', kind: 'plain' }, { id: 'zrs', label: 'ZRS', kind: 'plain' }, { id: 'grs', label: 'GRS', kind: 'plain' }, { id: 'gzrs', label: 'GZRS', kind: 'plain' }, { id: 'zonefail', label: '💥 …zone 1 fails?', kind: 'danger' }, { id: 'outage', label: '🌩️ …the whole region goes down?', kind: 'danger' }] },
    { title: 'Moving data: AzCopy and object replication', text: '**AzCopy** moves files in parallel from the command line, signed in with Microsoft Entra ID (and a Storage Blob Data role) or with a SAS. **Storage Explorer** does the same with a GUI. **Object replication** keeps copying new block blobs to another account by itself.', actions: [{ id: 'azcopy', label: '🚚 …we azcopy the file server’s folder up?', kind: 'ok' }, { id: 'objrep', label: '🔁 …we turn on object replication?', kind: 'ok' }] },
    { title: 'Access tiers and lifecycle management', text: 'Blobs sit in **Hot**, **Cool** (30-day minimum), **Cold** (90 days) or **Archive** (180 days, offline). A **lifecycle management** rule moves or deletes blobs by age or last access, about once a day. Reading an archived blob means **rehydrating** it first.', actions: [{ id: 'lifecycle', label: '📉 …the lifecycle rule runs for six months?', kind: 'ok' }, { id: 'rehydrate', label: '⏳ …finance needs the archived file today?', kind: 'plain' }] },
    { title: 'Undo buttons: soft delete, versioning and snapshots', text: '**Blob soft delete** and **container soft delete** keep deleted items for 1 to 365 days. **Versioning** keeps every previous version of a blob. For Azure Files, **share snapshots** are read-only point-in-time copies and **share soft delete** keeps a deleted share.', actions: [{ id: 'nodel', label: '🗑️ …we delete with no protection?', kind: 'danger' }, { id: 'softdel', label: '♻️ …we delete with soft delete on?', kind: 'ok' }, { id: 'version', label: '🕘 …someone overwrites the contract?', kind: 'ok' }, { id: 'snapshot', label: '📸 …a script wipes a folder on the share?', kind: 'ok' }] },
  ],
};

export const TOURS: Record<string, Tour> = T;

const ps = (problem: string, solution: string, tool: string, pairs: [string, string, string][]): ProblemSolution => ({ problem, solution, tool, pairs: pairs.map(([icon, pain, fix]) => ({ icon, pain, fix })) });
export const PROBLEMS: Record<string, ProblemSolution> = {
  'storage-firewalls-and-virtual-networks': ps('Anyone on the internet with a leaked key can read your invoices.', 'Set the storage firewall to Deny and allow only your subnets and office IPs.', 'Storage firewall', [['🌍', 'Open to every network', 'Default action Deny'], ['🖥️', 'App VMs need access', 'Virtual network rules'], ['🗃️', 'Azure Backup gets blocked', 'Trusted services exception']]),
  'sas-tokens-and-stored-access-policies': ps('An auditor needs a month of read access, and you may need to cut it off early.', 'Give a service SAS tied to a stored access policy you can delete.', 'SAS + stored access policy', [['🔑', 'Sharing the account key', 'Scoped, expiring SAS'], ['⏰', 'Access must end early', 'Delete the policy'], ['🆔', 'Want no key at all', 'User delegation SAS']]),
  'storage-access-keys': ps('The same storage key has sat in five apps for two years.', 'Rotate with two keys, get reminders, then move to Entra ID.', 'Access keys', [['🕰️', 'Keys never change', 'Key expiration policy'], ['💥', 'Rotation breaks apps', 'Swap to key2 first'], ['🙈', 'Keys leak', 'Disable key access']]),
  'azure-files-identity-based-access': ps('Staff mount the HR share with a storage key taped to a monitor.', 'Let them sign in with their own identity and control access with roles and ACLs.', 'Identity-based access for Azure Files', [['🔑', 'One shared key for all', 'Kerberos sign-in'], ['👥', 'Everyone sees everything', 'Share-level RBAC roles'], ['📂', 'Folder rights matter', 'Windows ACLs']]),
  'configure-storage-accounts-and-encryption': ps('Compliance wants your own encryption key and no anonymous access, from day one.', 'Create the account with secure settings and switch to a customer-managed key.', 'Storage account settings + CMK', [['🌐', 'Containers made public by mistake', 'Anonymous access off'], ['🔐', 'Need control of the key', 'Customer-managed key'], ['🧱', 'Want a second layer', 'Infrastructure encryption']]),
  'storage-redundancy-and-object-replication': ps('One datacenter fire would take every product photo offline.', 'Pick ZRS, GRS or GZRS and replicate key containers to another account.', 'Redundancy + object replication', [['🔥', 'Datacenter failure', 'ZRS across zones'], ['🌩️', 'Region outage', 'GRS/GZRS and failover'], ['📍', 'Copy near other users', 'Object replication']]),
  'storage-explorer-and-azcopy': ps('20,000 files need to move to Blob Storage and the portal upload keeps timing out.', 'Use AzCopy for bulk and scripts, Storage Explorer for point-and-click.', 'AzCopy + Storage Explorer', [['🐢', 'Portal uploads are slow', 'Parallel AzCopy jobs'], ['🔁', 'Re-copying everything', 'azcopy sync'], ['🖱️', 'Admins want a GUI', 'Storage Explorer']]),
  'azure-file-shares-snapshots-soft-delete': ps('A script deleted a folder on the finance share, then someone deleted the share.', 'Restore files from a share snapshot and the share from soft delete.', 'Share snapshots + soft delete', [['📂', 'Files deleted', 'Share snapshots'], ['🗑️', 'Whole share deleted', 'Share soft delete'], ['📅', 'Need a schedule', 'Azure Backup']]),
  'blob-containers-tiers-and-lifecycle': ps('Seven years of invoices sit in Hot storage and the bill keeps growing.', 'Move old blobs to Cool, Cold and Archive automatically with a lifecycle rule.', 'Access tiers + lifecycle management', [['💸', 'Paying Hot prices for old files', 'Cool, Cold, Archive'], ['🖐️', 'Moving blobs by hand', 'Lifecycle rules'], ['⏳', 'Archive is offline', 'Plan for rehydration']]),
  'blob-soft-delete-and-versioning': ps('A contract was deleted on Monday and another overwritten on Tuesday.', 'Turn on soft delete and versioning so both are a two-minute fix.', 'Blob soft delete + versioning', [['🗑️', 'Deleted blob', 'Undelete'], ['✏️', 'Overwritten blob', 'Restore a version'], ['📦', 'Deleted container', 'Container soft delete']]),
};

/** Exam-format items for domain 2 (original). */
export const ITEMS: FormatItem[] = [
  { kind: 'yesno', id: 'adm-x2-yn-firewall', domain: 2, objective: '2.1.1', statements: [
    { text: 'When the default network action of a storage account is set to Deny, a request that presents a valid account key from an IP address that is not allowed is rejected.', answer: true },
    { text: 'An IP network rule for a storage account can contain the address range 10.1.0.0/16.', answer: false },
    { text: 'A virtual network rule for a storage account requires the Microsoft.Storage service endpoint on the subnet.', answer: true },
  ], explanation: 'The firewall is checked before authorization, so a valid key does not help from a blocked network. IP rules accept **public** addresses only. VNet rules rely on the **Microsoft.Storage** service endpoint on the subnet.' },
  { kind: 'dropdown', id: 'adm-x2-dd-sas', domain: 2, objective: '2.1.3', question: 'Complete the statement.', parts: [
    'You must be able to revoke a group of SAS tokens for a container without regenerating the account keys. Create a ',
    { options: ['stored access policy on the container', 'user delegation key', 'new account SAS', 'resource lock'], answer: 0 },
    ' and generate each token as a ',
    { options: ['service SAS that references the policy', 'account SAS', 'user delegation SAS that references the policy'], answer: 0 },
    '.',
  ], explanation: 'Stored access policies apply to **service SAS** tokens only. Deleting or changing the policy revokes every SAS that names it. Account SAS and user delegation SAS cannot reference a stored access policy.' },
  { kind: 'order', id: 'adm-x2-order-keys', domain: 2, objective: '2.1.4', question: 'Applications use key1 of a storage account. You need to rotate both keys without downtime. Which four actions should you perform in sequence?', actions: ['Update the applications to use key2', 'Regenerate key1', 'Update the applications to use the new key1', 'Regenerate key2', 'Disable storage account key access'], answer: [0, 1, 2, 3], explanation: 'Move every client off the key you are about to regenerate, regenerate it, move clients back, then regenerate the other key. Disabling key access would break the applications.' },
  { kind: 'match', id: 'adm-x2-match-redundancy', domain: 2, objective: '2.2.2', question: 'Match each requirement to the redundancy option with the lowest cost that meets it.', itemsLabel: 'Redundancy options', items: ['LRS', 'ZRS', 'GRS', 'RA-GZRS'], targets: [
    { text: 'Protect against a single server rack failure only', answer: 0 },
    { text: 'Stay writable if one availability zone fails', answer: 1 },
    { text: 'Keep a copy in the paired region for disaster recovery', answer: 2 },
    { text: 'Survive a zone failure and read from the secondary region during a regional outage', answer: 3 },
  ], explanation: '**LRS** protects within one datacenter. **ZRS** spreads copies across zones. **GRS** adds a secondary region. **RA-GZRS** combines zones in the primary with readable geo-replication.' },
  { kind: 'yesno', id: 'adm-x2-yn-protect', domain: 2, objective: '2.3.4', statements: [
    { text: 'Blob soft delete can retain deleted blobs for up to 365 days.', answer: true },
    { text: 'Object replication requires blob versioning on both the source and destination accounts.', answer: true },
    { text: 'You can set the Archive access tier on blobs in an account that uses zone-redundant storage (ZRS).', answer: false },
  ], explanation: 'Soft delete retention is **1 to 365 days**. Object replication needs **versioning on both accounts** and the **change feed on the source**. **Archive** is supported for LRS, GRS and RA-GRS accounts only.' },
  { kind: 'dropdown', id: 'adm-x2-dd-lifecycle', domain: 2, objective: '2.3.6', question: 'Complete the lifecycle management rule.', parts: [
    'Block blobs that have not been modified for 30 days must move to ',
    { options: ['tierToCool', 'tierToArchive', 'enableAutoTierToHotFromCool', 'delete'], answer: 0 },
    ' and blobs that have not been read for 90 days must move to Archive, which requires ',
    { options: ['last access time tracking', 'blob versioning', 'the change feed', 'a stored access policy'], answer: 0 },
    ' to be enabled on the account.',
  ], explanation: 'Use **tierToCool** with daysAfterModificationGreaterThan 30. Rules based on **daysAfterLastAccessTimeGreaterThan** need **last access time tracking** turned on first.' },
];

export const SORT: SortSet[] = [
  {
    id: 'adm-storage-undo', title: 'Which feature gets it back?', icon: '♻️', topic: 'blob-soft-delete-and-versioning',
    intro: 'Each line is something that went wrong in a storage account. Sort it into the feature that recovers it.',
    buckets: ['Blob soft delete', 'Blob versioning', 'Share snapshot or share soft delete', 'Geo-redundancy and failover'],
    items: [
      { text: 'A blob was deleted yesterday (versioning off)', bucket: 0, why: 'Soft delete keeps deleted blobs for the retention period, and undelete restores them.' },
      { text: 'A container was deleted by mistake', bucket: 0, why: 'Container soft delete, set on the same Data protection page, restores the container and its blobs.' },
      { text: 'A user saved a bad edit over a blob', bucket: 1, why: 'Versioning kept the previous content as a version you can make current again.' },
      { text: 'An app overwrote a config blob three times', bucket: 1, why: 'Each write created a new version, so you can pick the right one.' },
      { text: 'A script deleted a folder on an SMB file share', bucket: 2, why: 'Share snapshots let you restore files and folders from a point in time.' },
      { text: 'Someone deleted the whole finance file share', bucket: 2, why: 'Share soft delete keeps the deleted share, with its snapshots, for the retention period.' },
      { text: 'The primary region is down for hours', bucket: 3, why: 'With GRS or GZRS you can fail over to the secondary region.' },
      { text: 'Users must keep reading data during a regional outage', bucket: 3, why: 'RA-GRS or RA-GZRS let you read from the secondary endpoint.' },
    ],
  },
];

export const RIDDLES: Riddle[] = [
  { answer: 'Stored access policy', topic: 'sas-tokens-and-stored-access-policies', clues: ['I live on a container, a share, a queue or a table.', 'A container can hold five of me at most.', 'Delete me and every service SAS that names me stops working.'] },
  { answer: 'User delegation SAS', topic: 'sas-tokens-and-stored-access-policies', clues: ['I am a shared access signature with no account key behind me.', 'Microsoft Entra ID signs the key that signs me.', 'I last seven days at most and I am the one Microsoft recommends.'] },
  { answer: 'AzCopy', topic: 'storage-explorer-and-azcopy', clues: ['I am a command-line tool already installed in Cloud Shell.', 'I copy and sync files to and from Azure Storage in parallel.', 'I sign in with Microsoft Entra ID or read a SAS from the URL.'] },
  { answer: 'Share snapshot', topic: 'azure-file-shares-snapshots-soft-delete', clues: ['I am read-only and incremental.', 'A file share can keep up to 200 of me.', 'Windows shows me as Previous Versions.'] },
  { answer: 'Lifecycle management policy', topic: 'blob-containers-tiers-and-lifecycle', clues: ['I am a JSON document of rules on a storage account.', 'I move blobs to Cool, Cold or Archive as they age.', 'I run about once a day and can delete old versions too.'] },
  { answer: 'Object replication', topic: 'storage-redundancy-and-object-replication', clues: ['I copy block blobs from one account to another, on my own.', 'I need versioning on both sides and the change feed on the source.', 'A source account can send me to two destination accounts.'] },
];

export const COMPARE: Comparison[] = [
  {
    slug: 'storage-account-key-vs-sas-vs-entra-id',
    title: 'Storage Account Key vs SAS vs Microsoft Entra ID',
    seoTitle: 'Storage Account Key vs SAS vs Entra ID | AZ-104',
    description: 'Account keys, SAS tokens and Microsoft Entra ID compared for Azure Storage: scope, expiry, revocation and when to use each one, with exam rules of thumb.',
    answer: 'An **account key** is the master key to all data in the account. A **SAS** grants limited permissions on limited resources until an expiry time. **Microsoft Entra ID** authorizes users and managed identities with **RBAC data roles**, with no secret to leak, and is the option Microsoft recommends.',
    cols: ['Account key', 'SAS token', 'Microsoft Entra ID'],
    rows: [
      ['Scope', 'Everything in the account', 'Chosen services, containers or blobs', 'What the RBAC data role allows, at its scope'],
      ['Expiry', 'Never (rotate it yourself)', 'Required, set in the token or a stored access policy', 'Token refreshed automatically'],
      ['Revoke', 'Regenerate the key', 'Delete the stored access policy, or regenerate the signing key', 'Remove the role assignment'],
      ['Works when key access is disabled', 'No', 'Only a user delegation SAS', 'Yes'],
      ['Typical use', 'Legacy apps, admin mounts of file shares', 'Short-lived access for partners and clients', 'Apps with managed identities, staff with roles'],
    ],
    pick: [['Account key', 'nothing else is supported, and only if the key lives in Key Vault and is rotated'], ['SAS token', 'someone outside your tenant needs time-limited access to specific data'], ['Microsoft Entra ID', 'the caller is your own app, user or managed identity']],
    examTip: '"Revoke without changing keys" = **stored access policy**. "No keys at all" = **Microsoft Entra ID** or a **user delegation SAS**. "Read data with --auth-mode login fails for an Owner" = assign a **Storage Blob Data** role.',
    sim: { mode: 'adminstorage', start: 1, tour: 'adm-storage-sas-policy', intro: 'Send a key, a SAS and a token at the account.' },
    lessons: ['sas-tokens-and-stored-access-policies', 'storage-access-keys', 'azure-files-identity-based-access'],
    faq: [['Can I disable the account keys?', 'Yes. Set Allow storage account key access to Disabled. Account keys, account SAS and service SAS stop working; Entra ID and user delegation SAS keep working.'], ['Is a SAS safer than a key?', 'Yes, because it is scoped and expires, but anyone holding it can use it. Keep expiry short and require HTTPS.']],
  },
  {
    slug: 'blob-soft-delete-vs-versioning-vs-snapshots',
    title: 'Blob Soft Delete vs Versioning vs Snapshots',
    seoTitle: 'Blob Soft Delete vs Versioning vs Snapshots | AZ-104',
    description: 'Blob soft delete, blob versioning, blob snapshots and share snapshots compared: what each protects, how you restore, and which to enable for the AZ-104 exam.',
    answer: '**Soft delete** keeps deleted blobs and containers for 1 to 365 days. **Versioning** automatically keeps every previous version of a blob when it changes. **Snapshots** are read-only copies you take on purpose, of a blob or of a whole Azure Files share. Microsoft recommends soft delete plus versioning for blobs.',
    cols: ['Soft delete', 'Versioning', 'Snapshots'],
    rows: [
      ['Protects against', 'Deletes (blobs, containers, file shares)', 'Overwrites and deletes of blobs', 'Changes after a point in time you chose'],
      ['Automatic', 'Yes, once enabled', 'Yes, on every write', 'No, you or a schedule (Azure Backup) take them'],
      ['Restore with', 'Undelete', 'Copy a previous version over the blob', 'Copy from the snapshot, or Previous Versions on a share'],
      ['Applies to', 'Blobs, containers, file shares', 'Block blobs (not with a hierarchical namespace)', 'Blobs and file shares (up to 200 per share)'],
      ['Cost', 'Deleted data billed until purged', 'Every version is billed', 'Incremental changes billed'],
    ],
    pick: [['Soft delete', 'you want a safety net for accidental deletes'], ['Versioning', 'people or apps overwrite blobs and you need older content back'], ['Snapshots', 'you need a known-good copy before a change, or point-in-time copies of a file share']],
    examTip: '"Recover an overwritten blob automatically" = **versioning**. "Recover a deleted file share" = **share soft delete**. "Recover files deleted from a share last Tuesday" = **share snapshot**. Object replication and point-in-time restore both need **versioning**.',
    sim: { mode: 'adminstorage', start: 8, tour: 'adm-blob-soft-delete', intro: 'Delete, overwrite and wipe, then recover each one.' },
    lessons: ['blob-soft-delete-and-versioning', 'azure-file-shares-snapshots-soft-delete', 'blob-containers-tiers-and-lifecycle'],
    faq: [['Does soft delete protect against deleting the storage account?', 'No. Use a CanNotDelete resource lock on the account for that.'], ['Do versions pile up forever?', 'Yes, unless a lifecycle rule deletes versions older than a set number of days.']],
  },
];

export const SERVICES: Service[] = [
  { slug: 'azure-storage-accounts', name: 'Azure Storage accounts', cat: 'Storage', icon: '🗄️', model: 'PaaS', what: 'One namespace for Blob, Files, Queue and Table storage, with one redundancy setting, one firewall, one set of keys and one encryption configuration.', use: ['Any app data that isn’t a database', 'File shares and backups', 'Data that needs geo-redundancy'], avoid: ['Relational data with joins (use a database)'], feel: 1, price: '1 TB Hot LRS ≈ $20.80/month plus operations; GRS roughly doubles storage cost', sim: { mode: 'adminstorage', start: 0, tour: 'adm-storage-create', intro: 'Create a locked-down account.' }, similar: ['azure-blob-storage', 'azure-files'], aws: 'Amazon S3 (+ EFS)', lesson: 'configure-storage-accounts-and-encryption', compare: 'storage-account-key-vs-sas-vs-entra-id' },
  { slug: 'azure-blob-storage', name: 'Azure Blob Storage', cat: 'Storage', icon: '🪣', model: 'Object storage', what: 'Containers of blobs with Hot, Cool, Cold and Archive tiers, lifecycle rules, soft delete, versioning and object replication.', use: ['Documents, media and backups', 'Long-term archives', 'Data lakes'], avoid: ['A mapped drive for Windows users (use Azure Files)'], feel: 1, price: 'Hot ≈ $0.02/GB-month, Archive ≈ $0.002/GB-month plus rehydration', sim: { mode: 'adminstorage', start: 7, tour: 'adm-blob-lifecycle', intro: 'Age a blob through the tiers.' }, similar: ['azure-storage-accounts', 'azure-files'], aws: 'Amazon S3', lesson: 'blob-containers-tiers-and-lifecycle', compare: 'blob-soft-delete-vs-versioning-vs-snapshots' },
  { slug: 'azure-files', name: 'Azure Files', cat: 'Storage', icon: '📁', model: 'Managed file shares', what: 'SMB and NFS file shares in the cloud, with identity-based access through AD DS, Microsoft Entra Domain Services or Microsoft Entra Kerberos, share snapshots and share soft delete.', use: ['Replacing Windows file servers', 'Shared folders for lift-and-shift apps', 'User profiles for virtual desktops'], avoid: ['Serving web content at huge scale (use Blob)'], feel: 2, price: 'Transaction optimized ≈ $0.06/GB-month; premium SSD shares cost more', sim: { mode: 'adminstorage', start: 1, tour: 'adm-files-identity', intro: 'Map a share with your own sign-in.' }, similar: ['azure-blob-storage', 'azure-storage-accounts'], aws: 'Amazon FSx for Windows / EFS', lesson: 'azure-files-identity-based-access', compare: 'blob-soft-delete-vs-versioning-vs-snapshots' },
  { slug: 'azcopy', name: 'AzCopy', cat: 'Storage', icon: '🚚', model: 'Command-line tool', what: 'A free command-line tool that copies and syncs data to, from and between storage accounts in parallel, authenticating with Microsoft Entra ID or SAS tokens.', use: ['Bulk uploads and migrations', 'Scheduled sync jobs', 'Server-to-server copies between accounts'], avoid: ['Very large offline transfers over slow links (Azure Data Box)'], feel: 1, price: 'Free tool; you pay for storage operations and data out', sim: { mode: 'adminstorage', start: 6, tour: 'adm-storage-explorer', intro: 'Copy a folder up with AzCopy.' }, similar: ['azure-storage-explorer', 'azure-blob-storage'], aws: 'AWS CLI s3 cp / s3 sync', lesson: 'storage-explorer-and-azcopy' },
  { slug: 'azure-storage-explorer', name: 'Azure Storage Explorer', cat: 'Storage', icon: '🧭', model: 'Desktop app', what: 'A free app for Windows, macOS and Linux to browse and manage blobs, files, queues and tables. Connects with Microsoft Entra ID, keys, connection strings or SAS URLs and uses AzCopy for transfers.', use: ['Admins who want a GUI', 'Generating SAS and managing access policies', 'Checking soft-deleted blobs and snapshots'], avoid: ['Repeatable automation (use AzCopy or the CLI)'], feel: 1, price: 'Free', sim: { mode: 'adminstorage', start: 6, tour: 'adm-storage-explorer', intro: 'Open the account in Storage Explorer.' }, similar: ['azcopy'], aws: 'Amazon S3 console', lesson: 'storage-explorer-and-azcopy' },
];
