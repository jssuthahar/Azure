import { THREE, C, v, mat, box, building, ground, plate, glow, Packets, arc, every, type V3 } from './kit';
import { stepLabels, type Ctx, type Ctl } from './types';

type Opt = 'LRS' | 'ZRS' | 'GRS' | 'GZRS';

/** Primary region (3 zones) + paired region; shows where each storage redundancy option keeps copies. */
const PER_GB: Record<string, number> = { LRS: 0.02, ZRS: 0.025, GRS: 0.04, GZRS: 0.045 };

export function redundancy({ stage, hud, cost }: Ctx): Ctl {
  const S = stage.scene;
  ground(stage, 200, 0xcfe3c4);
  const packets = new Packets(stage, 0.3);
  S.add(plate(48, 30, 0xb9d3ea, [-14, 0, 0]), plate(20, 20, 0xd9cfee, [34, 0, 0]));
  const sites: { key: string; x: number; z: number; b: ReturnType<typeof building>; pm: THREE.MeshStandardMaterial }[] = [];
  const addSite = (key: string, x: number, z: number) => {
    const pm = mat(0xdbe9f7);
    S.add(box(12, 0.15, 12, pm, [x, 0.12, z]));
    const b = building(7, 5, 3.6, [x, 0.27, z - 1.5]);
    S.add(b.group);
    sites.push({ key, x, z, b, pm });
  };
  addSite('z1', -28, 0); addSite('z2', -14, 0); addSite('z3', 0, 0); addSite('sec', 34, 0);

  // up to 6 copies
  const copies = Array.from({ length: 6 }, () => {
    const m = mat(C.azure, { emissive: C.azure, emissiveIntensity: 0.5 });
    const c = box(1, 1, 1, m);
    c.visible = false;
    S.add(c);
    return { c, m, site: '', lost: false };
  });

  const L = stepLabels(stage);
  L.add('📍 Primary region', [-14, 8.5, -13], 'all', 'd3-label-strong');
  L.add('📍 Paired (secondary) region', [34, 8.5, -9], 'all', 'd3-label-strong');
  L.add('Zone 1 · datacenter', [-28, 5.6, -1.5], 'all');
  L.add('Zone 2', [-14, 5.6, -1.5], 'all');
  L.add('Zone 3', [0, 5.6, -1.5], 'all');
  L.add('Datacenter', [34, 5.6, -1.5], 'all');
  const optLabel = stage.label('', [-14, 1, 12], 'd3-label-strong');

  let opt: Opt = 'LRS';
  let readAccess = false;
  const place = (o: Opt) => {
    opt = o;
    cost(PER_GB[o] * 1024, 'month', `1 TB of hot blob data with ${o}. More copies in more places cost more`);
    const at: [string, V3][] = [];
    const site = (k: string) => sites.find((s) => s.key === k)!;
    const near = (k: string, i: number): V3 => { const s = site(k); return [s.x - 2 + i * 2, 0.27, s.z + 3.4]; };
    if (o === 'LRS') [0, 1, 2].forEach((i) => at.push(['z1', near('z1', i)]));
    if (o === 'ZRS') ['z1', 'z2', 'z3'].forEach((k) => at.push([k, near(k, 1)]));
    if (o === 'GRS') { [0, 1, 2].forEach((i) => at.push(['z1', near('z1', i)])); [0, 1, 2].forEach((i) => at.push(['sec', near('sec', i)])); }
    if (o === 'GZRS') { ['z1', 'z2', 'z3'].forEach((k) => at.push([k, near(k, 1)])); [0, 1, 2].forEach((i) => at.push(['sec', near('sec', i)])); }
    copies.forEach((c, i) => {
      c.lost = false;
      c.c.visible = i < at.length;
      if (i < at.length) { c.site = at[i][0]; c.c.position.set(...at[i][1]); }
      const sec = c.site === 'sec';
      c.m.color.setHex(sec ? C.purple : C.azure);
      glow(c.m, sec ? C.purple : C.azure, 0.5);
    });
    optLabel.set(`${o}: ${at.length} copies · ${{ LRS: 'one datacenter', ZRS: 'three zones', GRS: 'one datacenter + paired region', GZRS: 'three zones + paired region' }[o]}`);
    sites.forEach((s) => { s.pm.color.setHex(0xdbe9f7); s.b.wallMat.color.setHex(C.wall); });
  };

  const hit = (keys: string[], what: string) => {
    place(opt);
    for (const s of sites) if (keys.includes(s.key)) { s.pm.color.setHex(0xf3b6b8); s.b.wallMat.color.setHex(0x7b5555); }
    let left = 0, primaryLeft = 0;
    for (const c of copies) {
      if (!c.c.visible) continue;
      c.lost = keys.includes(c.site);
      c.m.color.setHex(c.lost ? C.red : c.site === 'sec' ? C.purple : C.azure);
      glow(c.m, c.lost ? C.red : null, 0.5);
      if (!c.lost) { left++; if (c.site !== 'sec') primaryLeft++; }
    }
    if (left === 0) hud(`❌ ${what}: every copy was there. With ${opt} your data is unavailable, possibly lost.`, 'bad');
    else if (primaryLeft === 0) hud(`⚠️ ${what}: the primary region is gone, but ${left} copies survive in the paired region. After a failover your data is back.`, 'info');
    else hud(`✅ ${what}: ${left} copies survive. Your data is still available with ${opt}.`, 'ok');
  };

  const sync = [arc(v(-28, 1, 3.4), v(34, 1, 3.4), 9), arc(v(0, 1, 3.4), v(34, 1, 3.4), 7)];
  every(stage, 0.7, () => {
    if (!copies.some((c) => c.c.visible && c.site === 'sec')) return;
    packets.send(opt === 'GZRS' ? sync[1] : sync[0], C.purple, 1.6);
    if (readAccess) packets.send(new THREE.QuadraticBezierCurve3(v(34, 1, 12), v(30, 4, 18), v(34, 1, 3.4)), C.green, 1, undefined, 0.98);
  });

  const STEP_OPT: Opt[] = ['LRS', 'LRS', 'ZRS', 'GRS', 'GZRS', 'GZRS'];
  return {
    go(i) {
      hud('');
      packets.clear();
      readAccess = false;
      L.show(i);
      place(STEP_OPT[i]);
      if (i === 0) hud('Azure Storage keeps at least 3 copies. Click Next to see where each option puts them.', 'info');
      if (i === 3 || i === 4) hud('Purple dots: data copied asynchronously to the paired region.', 'info');
      stage.fly(i === 5 ? [44, 20, 40] : [6, 44, 70], i === 5 ? [30, 0, 2] : [6, 0, 0]);
    },
    act(id) {
      if (id === 'dc') hit(['z1'], 'Datacenter fire in Zone 1');
      if (id === 'zone') hit(['z1'], 'Zone 1 outage');
      if (id === 'region') hit(['z1', 'z2', 'z3'], 'Whole primary region outage');
      if (id === 'reset') { place(opt); readAccess = false; hud('Reset.', 'info'); }
      if (id === 'read') { readAccess = true; cost(0.056 * 1024, 'month', '1 TB with RA-GZRS: the read-access option costs a little more'); hud('📖 RA-GZRS: your app reads from the secondary region at any time (green), without waiting for a failover.', 'ok'); }
    },
  };
}
