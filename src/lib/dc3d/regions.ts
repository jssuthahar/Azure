import { THREE, C, v, mat, latLon, Packets, every, isDark } from './kit';
import type { Ctx, Ctl } from './types';

const R = 20;
type Reg = { n: string; lat: number; lon: number; sov?: boolean; geo: string; lo?: [number, number] };
const REGIONS: Reg[] = [
  { n: 'East US', lat: 37.4, lon: -79, geo: 'US' }, { n: 'West US', lat: 37.8, lon: -122.4, geo: 'US' },
  { n: 'South Central US', lat: 29.4, lon: -98.5, geo: 'US' }, { n: 'Canada Central', lat: 43.7, lon: -79.4, geo: 'CA' },
  { n: 'Brazil South', lat: -23.5, lon: -46.6, geo: 'BR' }, { n: 'North Europe', lat: 53.3, lon: -6.3, geo: 'EU', lo: [3, -9] },
  { n: 'West Europe', lat: 52.4, lon: 4.9, geo: 'EU', lo: [-2, 9] }, { n: 'UK South', lat: 50.9, lon: -0.8, geo: 'UK', lo: [-4, -4] },
  { n: 'UK West', lat: 53.4, lon: -3, geo: 'UK', lo: [5, 2] }, { n: 'South Africa North', lat: -25.7, lon: 28.2, geo: 'ZA' },
  { n: 'Central India', lat: 18.6, lon: 73.9, geo: 'IN' }, { n: 'South India', lat: 12.9, lon: 80.2, geo: 'IN' }, { n: 'West India', lat: 19.1, lon: 72.9, geo: 'IN', lo: [3, -6] },
  { n: 'Southeast Asia', lat: 1.3, lon: 103.8, geo: 'AP' }, { n: 'Japan East', lat: 35.7, lon: 139.7, geo: 'JP' },
  { n: 'Japan West', lat: 34.7, lon: 135.5, geo: 'JP' }, { n: 'Australia East', lat: -33.9, lon: 151.2, geo: 'AU' },
  { n: 'Australia Southeast', lat: -37.8, lon: 145, geo: 'AU' },
  { n: 'US Gov Virginia', lat: 37.5, lon: -77.5, sov: true, geo: 'GOV' }, { n: 'China East (21Vianet)', lat: 31.2, lon: 121.5, sov: true, geo: 'CN' },
];
const PAIRS: [string, string][] = [
  ['North Europe', 'West Europe'], ['East US', 'West US'], ['UK South', 'UK West'], ['Japan East', 'Japan West'],
  ['Australia East', 'Australia Southeast'], ['Central India', 'South India'], ['Brazil South', 'South Central US'],
];
const LAND: [number, number][][] = [
  [[70, -160], [70, -100], [75, -80], [60, -65], [47, -53], [45, -67], [35, -76], [25, -80], [30, -90], [20, -97], [15, -92], [8, -80], [18, -105], [32, -117], [40, -124], [48, -125], [58, -137], [60, -150], [55, -165], [65, -168], [70, -160]],
  [[12, -72], [8, -60], [0, -50], [-8, -35], [-23, -42], [-35, -55], [-52, -68], [-55, -70], [-45, -75], [-18, -71], [-5, -81], [5, -78], [12, -72]],
  [[36, -9], [43, -9], [48, -5], [51, 2], [54, 8], [57, 8], [58, 5], [62, 5], [70, 20], [71, 28], [65, 40], [55, 40], [45, 40], [41, 29], [37, 24], [40, 18], [38, 15], [44, 12], [43, 5], [36, -5], [36, -9]],
  [[35, -6], [37, 10], [32, 32], [30, 33], [12, 44], [11, 51], [-5, 40], [-15, 41], [-26, 33], [-34, 26], [-34, 18], [-17, 12], [-5, 12], [5, 8], [4, -8], [10, -15], [21, -17], [28, -13], [35, -6]],
  [[41, 29], [42, 45], [25, 57], [22, 60], [25, 67], [20, 73], [8, 77], [22, 90], [16, 95], [1, 103], [10, 107], [22, 108], [30, 122], [40, 122], [39, 128], [43, 131], [52, 141], [60, 150], [62, 165], [70, 180], [75, 120], [76, 100], [73, 70], [68, 55], [65, 40], [55, 40], [45, 40], [41, 29]],
  [[-11, 131], [-12, 137], [-11, 142], [-25, 153], [-38, 148], [-38, 140], [-32, 133], [-34, 116], [-22, 114], [-14, 127], [-11, 131]],
  [[31, 130], [34, 135], [36, 140], [41, 141], [45, 142], [43, 145], [38, 141], [35, 137], [33, 131], [31, 130]],
  [[50, -5], [51, 1], [53, 0], [56, -2], [58, -3], [58, -6], [55, -5], [53, -3], [52, -5], [50, -5]],
];

/** Great-circle-ish arc between two surface points, lifted above the globe. */
function gcArc(a: THREE.Vector3, b: THREE.Vector3, lift = 1.15) {
  const mid = a.clone().add(b).normalize().multiplyScalar(R * lift + a.distanceTo(b) * 0.25);
  return new THREE.QuadraticBezierCurve3(a.clone(), mid, b.clone());
}

export function regions({ stage, hud, cost }: Ctx): Ctl {
  const S = stage.scene;
  const ctl = stage.controls;
  ctl.maxPolarAngle = Math.PI;
  ctl.minDistance = 26;
  ctl.enablePan = false;
  const globe = new THREE.Group();
  S.add(globe);
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), mat(isDark() ? 0x1d3a5c : 0xd4e7f8, { roughness: 0.9 })));
  const landMat = new THREE.LineBasicMaterial({ color: isDark() ? 0x7fb6e6 : 0x3f78ab });
  for (const poly of LAND) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < poly.length - 1; i++) {
      for (let k = 0; k < 6; k++) {
        const t = k / 6;
        pts.push(latLon(poly[i][0] + (poly[i + 1][0] - poly[i][0]) * t, poly[i][1] + (poly[i + 1][1] - poly[i][1]) * t, R + 0.05));
      }
    }
    pts.push(pts[0]);
    globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), landMat));
  }
  const gridMat = new THREE.LineBasicMaterial({ color: 0x8fb3d4, transparent: true, opacity: 0.35 });
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts = Array.from({ length: 73 }, (_, i) => latLon(lat, i * 5 - 180, R + 0.02));
    globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
  }

  const packets = new Packets(stage, 0.28, globe);
  const markers = REGIONS.map((r) => {
    const p = latLon(r.lat, r.lon, R + 0.1);
    const color = r.sov ? C.green : C.azure;
    const m = new THREE.MeshBasicMaterial({ color });
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 12), m);
    dot.position.copy(p);
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.85, 28), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
    halo.position.copy(p.clone().multiplyScalar(1.002));
    halo.lookAt(p.clone().multiplyScalar(2));
    globe.add(dot, halo);
    const lp = latLon(r.lat + (r.lo?.[0] ?? 0), r.lon + (r.lo?.[1] ?? 0), R * 1.04);
    const lab = stage.label(r.n, () => lp.clone().applyMatrix4(globe.matrixWorld), r.sov ? 'd3-label-ok' : '');
    return { ...r, p, m, halo, lab, down: false, color };
  });
  const byName = (n: string) => markers.find((m) => m.n === n)!;
  const pairLines = PAIRS.map(([a, b]) => {
    const c = gcArc(byName(a).p, byName(b).p, 1.04);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(30)), new THREE.LineDashedMaterial({ color: C.amber, dashSize: 0.5, gapSize: 0.3 }));
    line.computeLineDistances();
    globe.add(line);
    return line;
  });

  // three zones around West Europe
  const we = byName('West Europe'), ne = byName('North Europe');
  const zoneDots = new THREE.Group();
  const tangent = new THREE.Vector3(0, 1, 0).cross(we.p).normalize();
  const up2 = we.p.clone().normalize().cross(tangent).normalize();
  [0, 1, 2].forEach((i) => {
    const a = (i / 3) * Math.PI * 2;
    const d = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), new THREE.MeshBasicMaterial({ color: C.azureLight }));
    d.position.copy(we.p.clone().multiplyScalar(1.01).add(tangent.clone().multiplyScalar(Math.cos(a) * 1.3)).add(up2.clone().multiplyScalar(Math.sin(a) * 1.3)));
    zoneDots.add(d);
  });
  zoneDots.visible = false;
  globe.add(zoneDots);
  const zoneLabel = stage.label('3 availability zones inside', () => we.p.clone().multiplyScalar(1.12).applyMatrix4(globe.matrixWorld), 'd3-label-strong');
  const geoLabel = stage.label('🇪🇺 Europe geography', () => latLon(57, 14, R * 1.12).applyMatrix4(globe.matrixWorld), 'd3-label-strong');

  let step = 0;
  let spin = true;
  const pulse = { t: 0 };
  const camDir = new THREE.Vector3();
  stage.onTick((_, dt) => {
    pulse.t += dt;
    if (spin) globe.rotation.y += dt * 0.08;
    const s = 1 + 0.25 * Math.sin(pulse.t * 3);
    camDir.copy(stage.camera.position).normalize();
    for (const m of markers) {
      m.halo.scale.setScalar(s);
      const world = m.p.clone().applyMatrix4(globe.matrixWorld).normalize();
      const front = world.dot(camDir) > 0.25;
      m.lab.show(front && labelRule(m));
    }
  });
  const labelRule = (m: (typeof markers)[number]) => {
    if (step === 0 || step === 6) return ['East US', 'West Europe', 'Southeast Asia', 'Brazil South', 'Australia East', 'Central India', 'Japan East', 'South Africa North'].includes(m.n);
    if (step === 1) return m.n === 'West Europe';
    if (step === 2) return PAIRS.some((p) => p.includes(m.n)) && ['EU', 'UK'].includes(m.geo);
    if (step === 3) return m.geo === 'EU';
    if (step === 4) return m.geo === 'EU';
    if (step === 5) return Boolean(m.sov);
    return false;
  };

  const europeUsers = [[48, 10], [45, 2], [55, -2], [40, -4], [59, 18], [47, 16]].map(([a, b]) => latLon(a, b, R + 0.1));
  const worldUsers = [[40, -100], [45, -75], [-15, -50], [50, 10], [5, 20], [-30, 25], [28, 77], [35, 105], [-25, 135], [60, 90], [20, -100], [64, -20]].map(([a, b]) => latLon(a, b, R + 0.1));

  every(stage, 0.4, () => {
    if (step === 4) {
      const target = we.down ? ne : we;
      const u = europeUsers[Math.floor(Math.random() * europeUsers.length)];
      packets.send(gcArc(u, target.p, 1.01), we.down ? C.amber : C.green, 0.9);
      if (!we.down && Math.random() < 0.4) packets.send(gcArc(we.p, ne.p, 1.03), C.purple, 1);
    }
    if (step === 6 && globalOn) {
      const u = worldUsers[Math.floor(Math.random() * worldUsers.length)];
      let best = markers[0], bd = Infinity;
      for (const m of markers) if (!m.sov && !m.down) { const d = m.p.distanceTo(u); if (d < bd) { bd = d; best = m; } }
      packets.send(gcArc(u, best.p, 1.02), C.green, 0.9);
    }
  });
  let globalOn = false;

  /* ---- latency: pick a city, see round-trip times ---- */
  const CITIES: Record<string, [number, number, string]> = {
    'from-chennai': [13.08, 80.27, 'Chennai'], 'from-london': [51.5, -0.12, 'London'],
    'from-newyork': [40.7, -74, 'New York'], 'from-sydney': [-33.87, 151.2, 'Sydney'],
  };
  const TARGETS = ['South India', 'West Europe', 'East US', 'Southeast Asia', 'Australia East'];
  const latGroup = new THREE.Group();
  globe.add(latGroup);
  const latLabels = TARGETS.map(() => {
    const pos = new THREE.Vector3();
    const h = stage.label('', () => pos.clone().applyMatrix4(globe.matrixWorld), 'd3-label-strong');
    h.show(false);
    return { h, pos };
  });
  const youLabel = (() => { const pos = new THREE.Vector3(); const h = stage.label('', () => pos.clone().applyMatrix4(globe.matrixWorld), 'd3-label-ok'); h.show(false); return { h, pos }; })();
  const km = (a: [number, number], b: [number, number]) => {
    const r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(h));
  };
  const clearLatency = () => { latGroup.clear(); latLabels.forEach((l) => l.h.show(false)); youLabel.h.show(false); };
  const showLatency = (id: string) => {
    clearLatency();
    const [la, lo, name] = CITIES[id];
    const from = latLon(la, lo, R + 0.1);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.6, 14, 12), new THREE.MeshBasicMaterial({ color: 0xe3008c }));
    dot.position.copy(from);
    latGroup.add(dot);
    youLabel.pos.copy(latLon(la - 4, lo, R * 1.04));
    youLabel.h.set(`📍 You: ${name}`);
    youLabel.h.show(true);
    const rows = TARGETS.map((t, k) => {
      const m = byName(t);
      const ms = Math.round((km([la, lo], [m.lat, m.lon]) / 100) * 1.3 + 2);
      const c = gcArc(from, m.p, 1.03);
      const col = ms < 40 ? C.green : ms < 120 ? C.amber : C.red;
      latGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(40)), new THREE.LineBasicMaterial({ color: col })));
      latLabels[k].pos.copy(c.getPoint(0.5));
      latLabels[k].h.set(`${t}: ~${ms} ms`);
      latLabels[k].h.show(true);
      for (let q = 0; q < 2; q++) packets.send(c, col, 0.4 + ms / 120);
      return { t, ms };
    }).sort((a, b) => a.ms - b.ms);
    hud(`📍 From ${name}: nearest is <strong>${rows[0].t}</strong> (~${rows[0].ms} ms round trip). Farthest: ${rows.at(-1)!.t} (~${rows.at(-1)!.ms} ms). Estimates from fibre distance.`, 'info');
    look(la, lo, 82);
  };

  const setDown = (m: (typeof markers)[number], down: boolean) => {
    m.down = down;
    m.m.color.setHex(down ? C.red : m.color);
    (m.halo.material as THREE.MeshBasicMaterial).color.setHex(down ? C.red : m.color);
  };

  /** Point the camera at a lat/lon, accounting for the globe's current spin. */
  const look = (lat: number, lon: number, dist: number) => {
    const p = latLon(lat, lon, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), globe.rotation.y).multiplyScalar(dist);
    stage.fly(p, [0, 0, 0], 1600);
  };

  return {
    go(i) {
      step = i;
      packets.clear();
      hud('');
      globalOn = i === 6;
      clearLatency();
      if (i === 4) cost(0.11, 'hour', 'app in West Europe + standby copy and replicated data in North Europe');
      else if (i === 6) cost(35, 'month', 'Front Door Standard base fee, plus requests and data');
      else cost(0, 'hour', '');
      setDown(we, false);
      spin = i === 0 || (i === 6 && !globalOn);
      zoneDots.visible = i === 1;
      zoneLabel.show(i === 1);
      geoLabel.show(i === 3);
      pairLines.forEach((l, k) => { l.visible = i === 2 || i === 4 ? (i === 2 || k === 0) : false; });
      for (const m of markers) {
        const show = i === 3 ? m.geo === 'EU' || m.geo === 'UK' : i === 5 ? true : true;
        m.halo.visible = show;
        if (i === 3) m.m.color.setHex(m.geo === 'EU' ? C.amber : m.color);
        else m.m.color.setHex(m.down ? C.red : m.color);
      }
      if (i === 4) hud('✅ Users → West Europe. Data is copied to North Europe (purple).', 'ok');
      if (i === 5) hud('🟢 Green = sovereign clouds, separate from public Azure.', 'info');
      const views: [number, number, number][] = [[20, 0, 72], [52, 5, 34], [52, 0, 40], [50, 8, 44], [52, 0, 36], [62, 20, 82], [20, 20, 80], [20, 75, 80]];
      look(...views[i]);
    },
    act(id) {
      if (id === 'failwe') { setDown(we, true); hud('🌪️ West Europe is down! Traffic fails over to its pair, North Europe, where the data was already copied.', 'bad'); }
      if (id === 'restore') { setDown(we, false); hud('✅ West Europe is back.', 'ok'); }
      if (id in CITIES) { spin = false; showLatency(id); }
      if (id === 'global') { globalOn = true; hud('🌍 Each user is routed to the nearest healthy region.', 'ok'); }
    },
  };
}
