import { THREE, C, v, mat, box, cyl, tube, building, person, ground, plate, glow, Packets, every, after, type V3 } from './kit';
import { stepLabels, type Ctx, type Ctl } from './types';

const curve = (...p: V3[]) => new THREE.CatmullRomCurve3(p.map((x) => v(...x)));

/** A VNet with subnets, NSG, peering, VPN, ExpressRoute, private endpoint and DNS. */
const NET_COST: [number, 'hour' | 'month', string][] = [
  [0, 'month', 'virtual networks and subnets are free'],
  [0, 'month', 'subnets are free; you pay for what runs inside them'],
  [0, 'month', 'NSGs are free'],
  [20, 'month', 'peering ≈ $0.01 per GB in and out: here ~1 TB a month'],
  [0.19, 'hour', 'VPN gateway (VpnGw1), billed every hour it exists, plus data out'],
  [436, 'month', 'ExpressRoute 1 Gbps Standard metered port, plus the provider’s own fees'],
  [7.3, 'month', 'private endpoint ≈ $0.01/hour + ~$0.01 per GB processed'],
  [0.5, 'month', 'DNS zone ≈ $0.50/month + $0.40 per million queries'],
];

export function network({ stage, hud, cost }: Ctx): Ctl {
  const S = stage.scene;
  ground(stage, 170, 0xcfe3c4);
  const packets = new Packets(stage, 0.34);
  const later = after(stage);

  // Azure VNet
  S.add(plate(70, 56, 0xdbe9f7, [12, 0, -6]));
  const vnetMat = mat(C.azure, { transparent: true, opacity: 0.1, depthWrite: false });
  const vnet = box(28, 7, 22, vnetMat, [8, 0.1, 0.5]);
  S.add(vnet);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(28, 7, 22)), new THREE.LineBasicMaterial({ color: C.azure }));
  edges.position.set(8, 3.6, 0.5);
  S.add(edges);
  S.add(plate(26, 9, 0x9cc9f0, [8, 0.15, -5]), plate(26, 8, 0xd2c4ee, [8, 0.15, 6]));
  const vmMat = mat(0x34495e, { metalness: 0.3, roughness: 0.4 });
  S.add(box(1.8, 2.2, 1.8, vmMat, [3, 0.3, -5]), box(1.8, 2.2, 1.8, vmMat, [11, 0.3, -5]), cyl(1.1, 2.2, mat(C.purple), [6, 0.3, 6]));
  const shieldMat = mat(C.amber, { transparent: true, opacity: 0.35, emissive: C.amber, emissiveIntensity: 0.3, side: THREE.DoubleSide, depthWrite: false });
  const shield = new THREE.Mesh(new THREE.PlaneGeometry(9, 6), shieldMat);
  shield.position.set(-5.8, 3.2, -5);
  shield.rotation.y = Math.PI / 2;
  S.add(shield);
  const gw = box(2.6, 1.6, 2, mat(0x2b6cb0), [-3, 0.3, 9]);
  S.add(gw);

  // office, internet, provider
  const office = building(8, 6, 5, [-32, 0.1, 4], 0xf2e8d5);
  S.add(office.group);
  const cloud = new THREE.Group();
  const cm = mat(0xffffff, { roughness: 1 });
  for (const [x, y, z, r] of [[0, 0, 0, 2.4], [2.4, 0.3, 0, 1.9], [-2.4, 0.2, 0.3, 1.8], [0.8, 1.4, 0, 1.7], [-1, 1.2, -0.4, 1.6]]) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), cm);
    s.position.set(x, y, z);
    cloud.add(s);
  }
  cloud.position.set(-16, 11, -10);
  S.add(cloud);
  const provider = box(3, 2.2, 3, mat(C.purple), [-18, 0.1, 18]);
  S.add(provider);

  // peered VNet
  const vnet2 = new THREE.Group();
  vnet2.add(box(20, 6, 10, mat(C.green, { transparent: true, opacity: 0.12, depthWrite: false }), [8, 0.1, -30]));
  const e2 = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(20, 6, 10)), new THREE.LineBasicMaterial({ color: C.green }));
  e2.position.set(8, 3.1, -30);
  vnet2.add(e2, box(1.8, 2.2, 1.8, vmMat, [8, 0.2, -30]));
  const peerLink = tube([v(8, 0.6, -10.5), v(8, 0.6, -25)], 0.3, C.green);
  vnet2.add(peerLink.mesh);
  S.add(vnet2);

  // connections
  const vpnTube = tube([v(-28, 5, 4), v(-22, 9, -4), v(-16, 11, -10), v(-8, 7, 2), v(-3, 1.5, 9)], 0.45, C.green, 0.35);
  const erTube = tube([v(-28, 0.6, 6), v(-18, 0.6, 18), v(-3, 0.6, 10)], 0.3, C.purple);
  S.add(vpnTube.mesh, erTube.mesh);

  // storage + private endpoint
  const stor = new THREE.Group();
  for (let i = 0; i < 3; i++) stor.add(cyl(1.6, 1, mat(0x2f8f9d), [34, 0.1 + i * 1.15, 12]));
  S.add(stor);
  const pe = box(1.2, 1.2, 1.2, mat(C.green, { emissive: C.green, emissiveIntensity: 0.5 }), [16, 0.3, 7]);
  S.add(pe);
  const peLink = tube([v(16.6, 0.9, 7.4), v(25, 0.9, 10), v(32.4, 1.2, 12)], 0.15, C.green);
  S.add(peLink.mesh);

  // DNS + laptop user
  const dns = box(2.4, 2.4, 2.4, mat(C.azure, { emissive: C.azure, emissiveIntensity: 0.3 }), [-12, 0.1, -26]);
  S.add(dns, person(0xe3008c, [-30, 0.1, -20], 1.6));

  const L = stepLabels(stage);
  L.add('🔷 VNet 10.0.0.0/16', [8, 8.4, -10], 'all', 'd3-label-strong');
  L.add('Subnet web · 10.0.1.0/24', [18, 1.5, -8], [1, 2]);
  L.add('Subnet data · 10.0.2.0/24', [18, 1.5, 9], [1, 6]);
  L.add('VM 10.0.1.4', [3, 3.2, -5], [1]);
  L.add('VM 10.0.1.5', [11, 3.2, -5], [1]);
  L.add('Database 10.0.2.4', [6, 3.2, 6], [1]);
  L.add('🛡️ NSG: allow 443 · deny 3389', [-5.8, 7, -5], [2]);
  L.add('☁️ Public internet', [-16, 15, -10], [2, 4, 6, 7]);
  L.add('🔷 Peered VNet 10.1.0.0/16', [8, 7, -30], [3]);
  L.add('🔗 Peering (Microsoft backbone)', [8, 2, -18], [3]);
  L.add('🏢 Your office', [-32, 7, 4], [4, 5]);
  L.add('🔐 VPN gateway', [-3, 3, 9], [4, 5]);
  L.add('🔐 Encrypted tunnel over the internet', [-22, 10, -4], [4]);
  L.add('🛣️ ExpressRoute private circuit', [-18, 3.4, 18], [5]);
  L.add('🗄️ Storage account (PaaS)', [34, 5, 12], [6]);
  const peLabel = L.add('🔒 Private endpoint 10.0.2.5', [16, 2.4, 7], [6]);
  L.add('🔎 DNS', [-12, 3.6, -26], [7]);
  L.add('💻 You', [-30, 3.2, -20], [7]);

  const VM: V3 = [3, 1.6, -5];
  const internetIn = curve([-16, 10, -10], [-10, 5, -6], [-5.8, 2.5, -5], VM);
  let step = 0;
  let peOn = false;
  every(stage, 0.8, () => {
    if (step <= 1) packets.send(curve(VM, [5, 2.5, 0], [6, 1.6, 6]), C.azureLight, 1);
    if (step === 3) packets.send(curve(VM, [7, 1.5, -12], [8, 1.5, -25], [8, 1.5, -30]), C.green, 1.2);
  });

  const show = (i: number) => {
    shield.visible = i === 2;
    vnet2.visible = i === 3;
    vpnTube.mesh.visible = i === 4;
    erTube.mesh.visible = i === 5;
    provider.visible = i === 5;
    gw.visible = i === 4 || i === 5;
    office.group.visible = i === 4 || i === 5;
    stor.visible = i === 6;
    pe.visible = i === 6 && peOn;
    peLink.mesh.visible = i === 6 && peOn;
    peLabel.show(i === 6 && peOn);
    dns.visible = i === 7;
    cloud.visible = [2, 4, 6, 7].includes(i);
  };

  return {
    go(i) {
      step = i;
      peOn = false;
      later.cancelAll();
      packets.clear();
      hud('');
      L.show(i);
      show(i);
      cost(...NET_COST[i]);
      glow(shieldMat, C.amber, 0.3);
      const cams: [V3, V3][] = [
        [[26, 26, 34], [6, 1, 0]], [[20, 22, 26], [8, 0, 0]], [[-18, 11, 10], [-3, 2.5, -5]], [[34, 26, 6], [8, 0, -14]],
        [[-26, 24, 34], [-14, 3, 0]], [[-20, 20, 40], [-14, 0, 8]], [[32, 22, 34], [18, 1, 4]], [[-34, 20, 4], [-14, 3, -14]],
      ];
      stage.fly(...cams[i]);
    },
    act(id) {
      if (id === 'https') {
        packets.send(internetIn, C.green, 1.4, () => { hud('✅ HTTPS 443 matched rule "AllowHTTPS". It reaches the web VM.', 'ok'); packets.send(curve(VM, [5, 2.5, 0], [6, 1.6, 6]), C.azureLight, 0.8); });
      }
      if (id === 'rdp') {
        packets.send(internetIn, C.red, 1.4, undefined, 0.62);
        later(0.85, () => { glow(shieldMat, C.red, 0.8); hud('⛔ RDP 3389 denied by rule "DenyRDP". The packet never reaches the VM.', 'bad'); });
        later(1.8, () => glow(shieldMat, C.amber, 0.3));
      }
      if (id === 'peer') { for (let k = 0; k < 4; k++) later(k * 0.25, () => packets.send(curve(VM, [7, 1.5, -12], [8, 1.5, -25], [8, 1.5, -30]), C.green, 1)); hud('🔗 10.0.1.4 → 10.1.0.4 over the peering: private IPs, Microsoft backbone, no internet.', 'ok'); }
      if (id === 'vpn') { for (let k = 0; k < 4; k++) later(k * 0.3, () => packets.send(vpnTube.curve, C.green, 1.8)); hud('🔐 IPsec-encrypted traffic crosses the internet inside the tunnel. Anyone watching sees only scrambled data.', 'ok'); }
      if (id === 'er') { for (let k = 0; k < 4; k++) later(k * 0.3, () => packets.send(erTube.curve, C.purple, 1.4)); hud('🛣️ ExpressRoute: through the provider’s private circuit straight to Microsoft. The internet is never touched.', 'ok'); }
      if (id === 'public') {
        peOn = false; show(6);
        packets.send(curve(VM, [0, 6, -6], [-16, 10, -10], [10, 12, 4], [34, 4, 12]), C.amber, 2.4);
        hud('🌐 Without a private endpoint the VM reaches storage through its public endpoint on the internet.', 'info');
      }
      if (id === 'private') {
        peOn = true; show(6);
        packets.send(curve([6, 1.4, -5], [12, 1, 3], [16, 1, 7], [25, 1, 10], [33, 1.2, 12]), C.green, 1.4);
        hud('🔒 Private endpoint: storage now has a private IP (10.0.2.5) inside your VNet. Traffic stays private.', 'ok');
      }
      if (id === 'dns') {
        packets.send(curve([-30, 2, -20], [-21, 4, -24], [-12, 2, -26]), C.azure, 0.9, () => {
          hud('🔎 DNS answers: www.contoso.com → <strong>20.50.1.4</strong>', 'info');
          packets.send(curve([-12, 2, -26], [-21, 4, -24], [-30, 2, -20]), C.green, 0.9, () => {
            packets.send(curve([-30, 2, -20], [-16, 10, -10], [-5.8, 2.5, -5], VM), C.green, 1.4, () => hud('✅ The browser connected to 20.50.1.4. Names for people, numbers for networks.', 'ok'));
          });
        });
      }
    },
  };
}
