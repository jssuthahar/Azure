import { THREE, C, v, mat, box, cyl, person, ground, plate, glow, Packets, after, type V3 } from '../kit';
import { stepLabels, type Ctx, type Ctl } from '../types';

const curve = (...p: V3[]) => new THREE.CatmullRomCurve3(p.map((x) => v(...x)));
type M = THREE.MeshStandardMaterial;

/**
 * AZ-104 storage: the account's front door (firewall), keys vs SAS vs Entra ID,
 * stored access policies, key rotation, encryption keys, redundancy and a
 * region outage, AzCopy and object replication, tiers and lifecycle, and the
 * undo buttons (soft delete, versioning, share snapshots).
 */
export function adminstorage({ stage, hud, cost }: Ctx): Ctl {
  const S = stage.scene;
  ground(stage, 200, 0xdde6ef);
  const packets = new Packets(stage, 0.38);
  const later = after(stage);
  const solid = (c: number, e = 0.25) => mat(c, { emissive: c, emissiveIntensity: e });
  const flash = (m: M, c: number, base: number, sec = 1.2) => { glow(m, c, 1); later(sec, () => glow(m, base, 0.25)); };
  const TEAL = 0x2f8f9d;

  // The storage account and its front door
  S.add(plate(30, 22, 0xd6ebee, [0, 0, 4]));
  const acM = solid(TEAL, 0.25);
  S.add(box(10, 4, 8, acM, [0, 0.12, 0]));
  const wallM = solid(C.red, 0.3);
  const wall = box(18, 2.6, 0.6, wallM, [0, 0.12, 7]);
  S.add(wall);
  const keyM = [solid(C.amber, 0.3), solid(C.amber, 0.3)];
  const keys = keyM.map((m, k) => { const b = box(1.6, 0.6, 0.8, m, [-1.4 + k * 2.8, 4.3, 0]); S.add(b); return b; });
  // Callers at the gate
  const thief = person(C.red, [-12, 0.1, 20], 1.6);
  const vmM = solid(C.azure, 0.3);
  S.add(plate(6, 6, 0xcfe0f5, [-4, 0, 20]), box(2, 1.6, 2, vmM, [-4, 0.12, 20]));
  const officeM = solid(0x8a99a8, 0.2);
  S.add(thief, box(3, 3, 3, officeM, [4, 0.12, 20]));
  const bakM = solid(C.purple, 0.3);
  S.add(box(2.4, 2.4, 2.4, bakM, [12, 0.12, 20]));
  // Who's calling: app, Entra ID, a staff PC
  const appM = solid(C.azure, 0.3), entraM = solid(0x0f6cbd, 0.3), pcM = solid(0x34495e, 0.2);
  const app = box(3, 2.4, 3, appM, [-18, 0.12, 0]);
  const entra = cyl(1.4, 2.4, entraM, [-18, 0.12, -10]);
  const pc = box(2.4, 1.6, 2, pcM, [-18, 0.12, 10]);
  const staff = person(C.green, [-21, 0.1, 10], 1.6);
  S.add(app, entra, pc, staff);
  // Encryption: Key Vault
  const kvM = solid(C.amber, 0.3);
  const kv = cyl(1.6, 3, kvM, [16, 0.12, -4]);
  S.add(kv);
  const lockM = solid(C.green, 0.4);
  const lock = box(1.4, 1.2, 1.4, lockM, [0, 4.2, 3.6]);
  S.add(lock);

  // Redundancy: primary region with three zones, secondary region
  S.add(plate(18, 14, 0xe1ecf7, [44, 0, 0]), plate(12, 14, 0xe8e1f5, [70, 0, 0]));
  const zoneM = [0, 1, 2].map(() => solid(0x9fb2c6, 0.15));
  zoneM.forEach((m, k) => S.add(box(4, 2.6, 8, m, [38 + k * 6, 0.12, 0])));
  const dc2M = solid(0x9fb2c6, 0.15);
  S.add(box(6, 2.6, 8, dc2M, [70, 0.12, 0]));
  const copyM = solid(C.green, 0.4);
  const copies = Array.from({ length: 6 }, () => { const b = box(1, 1, 1, copyM, [0, 2.8, 0]); S.add(b); return b; });
  const placeCopies = (mode: string) => {
    const at: V3[] = mode === 'lrs' ? [[37, 2.8, -2], [38, 2.8, 0], [39, 2.8, 2]] : mode === 'zrs' ? [[38, 2.8, 0], [44, 2.8, 0], [50, 2.8, 0]] : mode === 'grs' ? [[37, 2.8, -2], [38, 2.8, 0], [39, 2.8, 2], [69, 2.8, -2], [70, 2.8, 0], [71, 2.8, 2]] : [[38, 2.8, 0], [44, 2.8, 0], [50, 2.8, 0], [69, 2.8, -2], [70, 2.8, 0], [71, 2.8, 2]];
    copies.forEach((b, k) => { b.visible = k < at.length; if (at[k]) b.position.set(...at[k]); });
  };

  // Moving data: on-premises server, second account
  const onpremM = solid(0x5c2d91, 0.25), acBM = solid(TEAL, 0.25);
  const onprem = box(3, 3.4, 2.4, onpremM, [-30, 0.12, 10]);
  const acB = box(7, 3, 6, acBM, [-30, 0.12, -14]);
  S.add(onprem, acB);

  // Tiers: four shelves and a blob that slides along them
  S.add(plate(40, 10, 0xeef1e6, [0, 0, -30]));
  const TIERS: [string, number][] = [['🔥 Hot', C.hot], ['❄️ Cool', C.cold], ['🧊 Cold', 0x2b5ea8], ['🗄️ Archive', 0x6b7b8c]];
  const shelfM = TIERS.map(([, c]) => solid(c, 0.2));
  shelfM.forEach((m, k) => S.add(box(7, 1, 5, m, [-15 + k * 10, 0.12, -30])));
  const blobM = solid(C.amber, 0.5);
  const blob = box(1.6, 1.6, 1.6, blobM, [-15, 1.2, -30]);
  S.add(blob);
  const slideTo = (k: number, sec = 0.6) => { const x0 = blob.position.x, x1 = -15 + k * 10; const n = 15; for (let i = 1; i <= n; i++) later((sec * i) / n, () => (blob.position.x = x0 + ((x1 - x0) * i) / n)); };

  // Undo corner: a blob, a recycle bin, a version stack, a file share with snapshots
  S.add(plate(26, 14, 0xf3e8e8, [34, 0, -30]));
  const docM = solid(C.azure, 0.4), binM = solid(0x6b7b8c, 0.2), shareM = solid(TEAL, 0.3);
  const doc = box(1.6, 2, 0.4, docM, [26, 0.12, -30]);
  const bin = cyl(1.2, 1.8, binM, [32, 0.12, -30]);
  const vers = [0, 1, 2].map((k) => { const m = solid(0x8a99a8, 0.15); const b = box(1.6, 0.4, 1.6, m, [38, 0.2 + k * 0.5, -30]); S.add(b); return { b, m }; });
  const share = box(3, 2, 3, shareM, [44, 0.12, -30]);
  const snaps = [0, 1, 2].map((k) => { const b = box(3, 0.3, 3, solid(0xa6d4dc, 0.2), [44, 2.3 + k * 0.4, -30]); S.add(b); return b; });
  S.add(doc, bin, share);

  const L = stepLabels(stage);
  L.add('🗄️ stcontoso (storage account)', [0, 5.6, 0], [0, 1, 2, 3, 4, 6], 'd3-label-strong');
  const wallLbl = L.add('', [0, 3.4, 7], [0]);
  L.add('🌍 Internet caller', [-12, 3.2, 20], [0]);
  L.add('🖥️ VM in snet-app (VNet rule)', [-4, 3, 20], [0]);
  L.add('🏢 Office 203.0.113.0/24 (IP rule)', [4, 4, 20], [0]);
  L.add('🗃️ Azure Backup (trusted service)', [12, 3.4, 20], [0]);
  L.add('🔑 key1', [-1.4, 5.3, 0], [1, 3]); L.add('🔑 key2', [1.4, 5.3, 0], [1, 3]);
  const appLbl = L.add('📦 Invoice app', [-18, 3.4, 0], [1, 2, 3]);
  L.add('🆔 Microsoft Entra ID', [-18, 3.4, -10], [1]);
  L.add('💻 Staff PC (Kerberos)', [-18, 2.6, 10], [1]);
  const sasLbl = L.add('', [-9, 4.8, 0], [2]);
  L.add('🔐 Key Vault · cmk-storage', [16, 4, -4], [4], 'd3-label-strong');
  const encLbl = L.add('', [0, 6.8, 3.6], [4]);
  L.add('📍 Primary region · 3 availability zones', [44, 4.4, -5], [5], 'd3-label-strong');
  L.add('📍 Paired secondary region', [70, 4.4, -5], [5], 'd3-label-strong');
  const redLbl = L.add('', [56, 7, 0], [5]);
  L.add('🏭 On-premises file server', [-30, 4.4, 10], [6]);
  L.add('🗄️ streplica (another region)', [-30, 4, -14], [6]);
  TIERS.forEach(([n], k) => L.add(n, [-15 + k * 10, 2.2, -27], [7]));
  const tierLbl = L.add('', [0, 5, -30], [7]);
  L.add('📄 contract.docx', [26, 2.8, -30], [8]); L.add('🗑️ Soft delete', [32, 2.6, -30], [8]);
  L.add('🕘 Versions', [38, 2.4, -30], [8]); L.add('📁 Share + snapshots', [44, 4.2, -30], [8]);

  let step = 0, gen = [1, 1], policy = true, encOn = true;
  const door = (open: boolean) => { glow(wallM, open ? C.green : C.red, 0.4); wallLbl.set(open ? '🚪 Firewall: Allow (all networks)' : '🛡️ Firewall: default Deny · VNet rule · IP rule · trusted services'); };
  const toAcct = (from: V3, color: number, ok: boolean, msg: string, tone: 'ok' | 'bad') => packets.send(curve(from, [(from[0]) / 2, 4, (from[2] + 7) / 2], [0, 2, 1]), color, 1.4, () => { flash(acM, ok ? C.green : C.red, TEAL); hud(msg, tone); }, ok ? undefined : 0.62);

  return {
    go(i) {
      step = i; later.cancelAll(); packets.clear(); hud(''); L.show(i);
      gen = [1, 1]; policy = true; encOn = true;
      door(false); wall.visible = i <= 2;
      thief.visible = i === 0;
      app.visible = i >= 1 && i <= 3; entra.visible = pc.visible = staff.visible = i === 1;
      keys.forEach((k) => (k.visible = i === 1 || i === 3)); keyM.forEach((m) => glow(m, C.amber, 0.3));
      appLbl.set(i === 3 ? '📦 Invoice app · uses key1' : '📦 Invoice app');
      sasLbl.set(i === 2 ? '🎫 SAS: sp=rl · si=auditors-read · se=+30 days' : '');
      kv.visible = lock.visible = i === 4; glow(lockM, C.green, 0.4);
      encLbl.set(i === 4 ? '🔒 AES-256 · Microsoft-managed key' : '');
      placeCopies('lrs'); copies.forEach((b) => (b.visible = b.visible && i === 5)); glow(copyM, C.green, 0.4);
      zoneM.forEach((m) => glow(m, 0x9fb2c6, 0.15)); glow(dc2M, 0x9fb2c6, 0.15);
      redLbl.set(i === 5 ? 'LRS: 3 copies in one datacenter' : '');
      onprem.visible = acB.visible = i === 6;
      blob.position.x = -15; blob.visible = i === 7; tierLbl.set(i === 7 ? 'invoice-2025.pdf · Hot' : '');
      doc.visible = true; vers.forEach((x, k) => { x.b.visible = k < 1; glow(x.m, 0x8a99a8, 0.15); }); snaps.forEach((s, k) => (s.visible = k < 2));
      cost(i === 5 ? 20.8 : i === 7 ? 20.8 : 0, 'month', i === 5 ? 'About $20.80 a month for 1 TB on Hot LRS; GRS roughly doubles it (illustrative)' : i === 7 ? '1 TB on Hot ≈ $20.80 a month; on Archive ≈ $2 (illustrative)' : '');
      const cams: [V3, V3][] = [[[0, 18, 38], [0, 1, 10]], [[-8, 16, 24], [-8, 1, 0]], [[-6, 14, 18], [-8, 1, 0]], [[-6, 12, 16], [-6, 2, 0]], [[8, 12, 18], [8, 2, -1]], [[54, 24, 28], [54, 1, 0]], [[-16, 18, 26], [-16, 1, -2]], [[0, 16, -8], [0, 1, -30]], [[35, 12, -12], [35, 1, -30]]];
      stage.fly(...cams[i]);
      if (i === 0) hud('The account’s public endpoint is open by default. Set the default action to Deny and add the exceptions you need.', 'info');
    },
    act(id) {
      if (id === 'internet') toAcct([-12, 2, 20], C.red, false, '⛔ 198.51.100.7 isn’t in any IP rule and isn’t in an allowed subnet, so the firewall answers 403 even if the caller has a valid key or SAS.', 'bad');
      if (id === 'vnet') toAcct([-4, 2, 20], C.green, true, '✅ The VM sits in snet-app, which has the Microsoft.Storage service endpoint and a virtual network rule. It gets in from its private address.', 'ok');
      if (id === 'ip') toAcct([4, 2, 20], C.green, true, '✅ The office’s public range is in the IP rules. IP rules take public addresses only, and they don’t apply to clients in the same Azure region as the account.', 'ok');
      if (id === 'trusted') toAcct([12, 2, 20], C.purple, true, '✅ Azure Backup is on the trusted services list, and “Allow trusted Microsoft services” is ticked, so it gets through without an IP or VNet rule.', 'ok');
      if (id === 'key') { flash(keyM[0], C.amber, C.amber); packets.send(curve([-18, 2, 0], [-9, 5, 0], [0, 2, 0]), C.amber, 1.2, () => { flash(acM, C.amber, TEAL); hud('🔑 The account key is the master key: full control of every container, share, queue and table, no expiry, no scope. Anyone who copies it is you.', 'bad'); }); }
      if (id === 'sas') packets.send(curve([-18, 2, 0], [-9, 4, 2], [0, 2, 0]), C.green, 1.2, () => { flash(acM, C.green, TEAL); hud('🎫 The SAS allows read and list on one container until a set time, over HTTPS only. It’s signed with a key, but it can’t do more than it says.', 'ok'); });
      if (id === 'entra') packets.send(curve([-18, 2, -10], [-18, 4, -5], [-18, 2, 0]), 0x0f6cbd, 0.8, () => packets.send(curve([-18, 2, 0], [-9, 4, -2], [0, 2, 0]), C.green, 1.1, () => { flash(acM, C.green, TEAL); hud('🆔 The app got an OAuth token from Microsoft Entra ID and Storage checked its RBAC role (Storage Blob Data Reader). No secret to leak, and it’s the option Microsoft recommends.', 'ok'); }));
      if (id === 'smb') packets.send(curve([-18, 1.6, 10], [-9, 4, 7], [0, 2, 3]), C.green, 1.3, () => { flash(acM, C.green, TEAL); hud('💻 The staff PC presents a Kerberos ticket (Microsoft Entra Kerberos here). Azure Files checks the share-level RBAC role, then the Windows ACLs on folders and files.', 'ok'); });
      if (id === 'sasuse') packets.send(curve([-18, 2, 0], [-9, 4, 0], [0, 2, 0]), policy ? C.green : C.red, 1.2, () => { flash(acM, policy ? C.green : C.red, TEAL); hud(policy ? '✅ The SAS names the stored access policy auditors-read, so Storage reads the permissions and expiry from the policy on the container. Download allowed.' : '⛔ 403: the policy the SAS points at is gone, so the SAS is dead. Nobody had to touch the account keys.', policy ? 'ok' : 'bad'); }, policy ? undefined : 0.85);
      if (id === 'revoke') { policy = false; sasLbl.set('🎫 SAS: si=auditors-read ❌ (policy deleted)'); hud('🗑️ Policy deleted. Try the same SAS again. (Changes can take up to 30 seconds in real Azure.)', 'info'); }
      if (id === 'adhoc') hud('⚠️ An ad hoc SAS (no policy) carries its own permissions and expiry. The only way to kill it early is to regenerate the key that signed it, which breaks everything else using that key. That’s why you tie long-lived SAS to a stored access policy.', 'bad');
      if (id === 'naive') { gen[0]++; flash(keyM[0], C.red, C.amber, 2); later(0.5, () => packets.send(curve([-18, 2, 0], [-9, 5, 0], [0, 2, 0]), C.red, 1.1, () => { flash(appM, C.red, C.azure, 2); hud('💥 You regenerated key1 while the app still used it. Every request now fails with 403, and every SAS signed with key1 died too. Outage.', 'bad'); }, 0.85)); }
      if (id === 'swap') { appLbl.set('📦 Invoice app · uses key2'); packets.send(curve([-18, 2, 0], [-9, 5, 0], [1.4, 4.4, 0]), C.green, 1, () => { glow(keyM[1], C.green, 0.8); gen[0]++; flash(keyM[0], C.amber, C.amber, 2); later(0.8, () => hud('🔄 Safe rotation: point the app at key2, regenerate key1, and next time do the reverse. Two keys exist exactly so you can rotate with no downtime. Better still, use Entra ID and drop the keys.', 'ok')); }); }
      if (id === 'mmk') { encLbl.set('🔒 AES-256 · Microsoft-managed key'); flash(lockM, C.green, C.green); hud('🔒 Every byte is encrypted at rest with AES-256 before it’s written, always, at no cost. With Microsoft-managed keys you do nothing.', 'ok'); }
      if (id === 'cmk') { encLbl.set('🔒 AES-256 · customer-managed key in Key Vault'); packets.send(curve([0, 4.6, 3.6], [8, 6, 0], [16, 3, -4]), C.amber, 1, () => { flash(kvM, C.green, C.amber); packets.send(curve([16, 3, -4], [8, 6, 0], [0, 4.6, 3.6]), C.green, 1, () => hud('🔐 The account’s managed identity asks Key Vault to unwrap its data key with your key (cmk-storage). The vault needs soft delete and purge protection, and the identity needs Key Vault Crypto Service Encryption User.', 'ok')); }); }
      if (id === 'revokekey') { encOn = false; glow(kvM, C.red, 0.8); glow(lockM, C.red, 0.8); encLbl.set('🔒 Key disabled in Key Vault'); later(0.6, () => hud('🚫 You disabled the key in the vault. Storage can no longer unwrap the data key, so reads and writes fail until you re-enable it. That control is the whole point of a customer-managed key.', 'bad')); }
      if (id === 'lrs' || id === 'zrs' || id === 'grs' || id === 'gzrs') { placeCopies(id); zoneM.forEach((m) => glow(m, 0x9fb2c6, 0.15)); glow(dc2M, 0x9fb2c6, 0.15); redLbl.set({ lrs: 'LRS: 3 copies in one datacenter', zrs: 'ZRS: 3 copies across 3 zones', grs: 'GRS: LRS here + LRS in the paired region', gzrs: 'GZRS: ZRS here + LRS in the paired region' }[id]); hud({ lrs: 'LRS keeps three synchronous copies in one datacenter. Cheapest, but a datacenter or zone failure takes it offline.', zrs: 'ZRS spreads three copies across three availability zones. A whole zone can fail and reads and writes carry on.', grs: 'GRS adds an asynchronous copy in the paired region. The secondary isn’t readable unless you pick RA-GRS or fail over.', gzrs: 'GZRS: zone-redundant in the primary and geo-replicated to the pair. The most resilient option.' }[id], 'info'); }
      if (id === 'zonefail') { glow(zoneM[0], C.red, 0.9); const z = copies.filter((b) => b.visible && b.position.x < 41).length; const left = copies.filter((b) => b.visible && b.position.x >= 41 && b.position.x < 60).length; hud(left ? `💥 Zone 1 failed. ${left} copies in the other zones keep serving requests.` : `💥 Zone 1 failed and all ${z} primary copies were in it. The account is down in this region${copies.some((b) => b.visible && b.position.x > 60) ? ', but the paired region still has a copy you can fail over to' : ''}.`, left ? 'ok' : 'bad'); }
      if (id === 'outage') { zoneM.forEach((m) => glow(m, C.red, 0.9)); const geo = copies.some((b) => b.visible && b.position.x > 60); if (geo) later(1, () => { glow(dc2M, C.green, 0.8); hud('🌩️ Whole region down. You start a customer-managed failover: the secondary becomes primary (and LRS). Anything written after the Last Sync Time is lost, so check it first.', 'ok'); }); else hud('🌩️ Whole region down and there’s no geo copy. You wait for the region to come back.', 'bad'); }
      if (id === 'azcopy') [0, 1, 2, 3, 4].forEach((k) => later(k * 0.25, () => packets.send(curve([-30, 2, 10], [-15, 5, 6], [0, 2, 1]), C.purple, 1.2, k === 4 ? () => { flash(acM, C.green, TEAL); hud('🚚 azcopy copy "./hr-docs/*" "https://…/hr-archive?<SAS>" --recursive. AzCopy runs many transfers in parallel, resumes failed jobs, and authenticates with a SAS or Microsoft Entra ID (with a Storage Blob Data role).', 'ok'); } : undefined)));
      if (id === 'objrep') [0, 1, 2].forEach((k) => later(k * 0.4, () => packets.send(curve([0, 2, -2], [-15, 6, -10], [-30, 2, -14]), C.green, 1.4, k === 2 ? () => { flash(acBM, C.green, TEAL); hud('🔁 Object replication copies new block blobs from the source container to a container in another account, asynchronously. It needs versioning on both accounts and the change feed on the source.', 'ok'); } : undefined)));
      if (id === 'lifecycle') { slideTo(1); later(0.7, () => tierLbl.set('Day 30 · Cool')); later(1.0, () => slideTo(2)); later(1.7, () => tierLbl.set('Day 90 · Cold')); later(2.0, () => slideTo(3)); later(2.7, () => { tierLbl.set('Day 180 · Archive (offline)'); hud('📉 One lifecycle rule moved the blob Hot → Cool (30 days) → Cold (90) → Archive (180) by days since last modified. The policy runs about once a day. Early deletion charges apply if you move or delete before 30, 90 or 180 days.', 'ok'); }); }
      if (id === 'rehydrate') { if (blob.position.x < 14) { hud('Run the lifecycle rule first so the blob reaches Archive.', 'info'); return; } hud('⏳ Archived blobs are offline. Rehydrating to Hot takes up to 15 hours at Standard priority, or under an hour for most blobs under 10 GB at High priority (at a higher price).', 'bad'); later(2.2, () => { slideTo(0, 0.8); tierLbl.set('Rehydrated · Hot'); }); }
      if (id === 'nodel') { packets.send(curve([26, 2, -30], [29, 4, -30], [32, 2, -30]), C.red, 0.8, () => { doc.visible = false; hud('🗑️ Deleted with soft delete and versioning both off. There’s nothing to restore. Gone.', 'bad'); }); }
      if (id === 'softdel') { doc.visible = true; packets.send(curve([26, 2, -30], [29, 4, -30], [32, 2, -30]), C.amber, 0.8, () => { doc.visible = false; glow(binM, C.amber, 0.6); later(1, () => packets.send(curve([32, 2, -30], [29, 4, -30], [26, 2, -30]), C.green, 0.8, () => { doc.visible = true; glow(binM, 0x6b7b8c, 0.2); hud('♻️ Blob soft delete (1 to 365 days) kept it, and az storage blob undelete brought it back. Container soft delete does the same for a whole container.', 'ok'); })); }); }
      if (id === 'version') { vers.forEach((x, k) => (x.b.visible = k < 2)); glow(docM, C.red, 0.8); hud('✏️ Someone saved a bad edit over contract.docx. Versioning kept the previous version automatically…', 'bad'); later(1.2, () => { glow(vers[1].m, C.green, 0.8); packets.send(curve([38, 1.2, -30], [32, 4, -30], [26, 2, -30]), C.green, 0.9, () => { vers[2].b.visible = true; glow(docM, C.azure, 0.4); hud('🕘 Copy the previous version back over the blob and it’s current again. The bad edit isn’t lost either: it became another version.', 'ok'); }); }); }
      if (id === 'snapshot') { snaps.forEach((s) => (s.visible = true)); glow(shareM, C.red, 0.8); hud('📁 A script wiped a folder on the file share…', 'bad'); later(1.2, () => packets.send(curve([44, 3.4, -30], [42, 5, -28], [44, 2, -30]), C.green, 0.8, () => { glow(shareM, TEAL, 0.3); hud('📸 Restored from a share snapshot: read-only, incremental, up to 200 per share, visible in Windows as Previous Versions. Share soft delete protects the whole share if it’s deleted.', 'ok'); })); }
      void encOn; void gen; void step;
    },
  };
}
