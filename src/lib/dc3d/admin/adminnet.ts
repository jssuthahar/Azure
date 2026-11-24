import { THREE, C, v, mat, box, cyl, person, ground, plate, glow, Packets, after, type V3 } from '../kit';
import { stepLabels, type Ctx, type Ctl } from '../types';

const curve = (...p: V3[]) => new THREE.CatmullRomCurve3(p.map((x) => v(...x)));
type M = THREE.MeshStandardMaterial;

/**
 * AZ-104 networking: a hub VNet and two spokes. Subnets and reserved IPs, a
 * Standard static public IP, non-transitive peering, a route table to the hub
 * NVA, subnet + NIC NSGs with an ASG, Azure Bastion, service vs private
 * endpoint, public vs private DNS, a Standard load balancer with a health
 * probe, and Network Watcher troubleshooting.
 */
export function adminnet({ stage, hud, cost }: Ctx): Ctl {
  const S = stage.scene;
  ground(stage, 190, 0xdde6ef);
  const packets = new Packets(stage, 0.38);
  const later = after(stage);
  const solid = (c: number, e = 0.25) => mat(c, { emissive: c, emissiveIntensity: e });
  const flash = (m: M, c: number, base: number, sec = 1.2) => { glow(m, c, 1); later(sec, () => glow(m, base, 0.25)); };
  const wall = (w: number, h: number, at: V3, rotY = 0) => { const m = mat(C.amber, { transparent: true, opacity: 0.3, emissive: C.amber, emissiveIntensity: 0.3, side: THREE.DoubleSide, depthWrite: false }); const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(at[0], at[1], at[2]); p.rotation.y = rotY; S.add(p); return m; };

  // VNets: hub in the middle, two spokes either side
  const HUB: V3 = [0, 0, 0], SP1: V3 = [-36, 0, -2], SP2: V3 = [36, 0, -2];
  S.add(plate(28, 22, 0xd6e6f5, HUB), plate(26, 22, 0xe1ecf8, SP1), plate(26, 22, 0xe1ecf8, SP2));
  S.add(plate(24, 6, 0x9cc9f0, [-36, 0.12, -6]), plate(24, 6, 0xd2c4ee, [-36, 0.12, 4]), plate(24, 7, 0x9cc9f0, [36, 0.12, -6]));
  // hub: firewall/NVA, Bastion, VPN gateway, public IP
  const fwM = solid(0xd9822b, 0.3), basM = solid(C.purple, 0.25), gwM = solid(0x2b6cb0, 0.25), pipM = solid(C.green, 0.3);
  S.add(box(4, 3, 3, fwM, [0, 0.12, -4]), box(3, 2.2, 3, basM, [-7, 0.12, 6]), box(3, 1.8, 2.4, gwM, [7, 0.12, 6]), cyl(0.3, 5, pipM, [3, 0.12, -6]));
  const pipHead = new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 12), pipM); pipHead.position.set(3, 5.6, -6); S.add(pipHead);
  // spoke 1: app VM with NIC shield, PE lock; spoke 2: three web VMs behind a load balancer
  const vmM = () => mat(0x34495e, { metalness: 0.3, roughness: 0.4, emissive: 0x000000 });
  const app1M = vmM(); S.add(box(2, 2.4, 2, app1M, [-36, 0.12, -6]));
  const peM = solid(C.green, 0.3); S.add(box(1.6, 1.6, 1.6, peM, [-30, 0.12, 4]));
  const webM = [vmM(), vmM(), vmM()];
  const WEB: V3[] = [[30, 0.12, -6], [36, 0.12, -6], [42, 0.12, -6]];
  WEB.forEach((p, k) => S.add(box(2, 2.4, 2, webM[k], p)));
  const app2M = vmM(); S.add(box(2, 2.4, 2, app2M, [36, 0.12, 4]));
  const lbM = solid(C.azure, 0.3); S.add(box(5, 1.6, 2.4, lbM, [36, 0.12, 6.5 + 2]));
  // NSGs: subnet wall in front of spoke 1's web subnet, small NIC shield near the VM
  const subNsg = wall(24, 4, [-36, 2, -2.6]);
  const nicNsg = wall(3, 3, [-36, 1.6, -4.2]);
  // storage account outside the VNets, DNS books, internet user, admin, watcher
  const stM = solid(0x2f8f9d, 0.3); S.add(cyl(2.4, 3, stM, [-14, 0.12, -28]));
  const fwStM = wall(8, 4, [-14, 2, -24.5]);
  const pubZ = solid(C.azureLight, 0.3), privZ = solid(C.purple, 0.3);
  S.add(box(3, 2, 2.4, pubZ, [18, 0.12, 26]), box(3, 2, 2.4, privZ, [14, 0.12, -14]));
  const user = person(C.green, [36, 0.1, 28], 1.8), admin = person(C.purple, [-10, 0.1, 28], 1.8), net = person(C.red, [-36, 0.1, 28], 1.8);
  S.add(user, admin, net);
  const nwM = solid(C.amber, 0.4);
  const nw = new THREE.Mesh(new THREE.TorusGeometry(2, 0.35, 10, 28), nwM); nw.position.set(0, 13, 0); S.add(nw);
  // a /29 subnet as 8 address blocks: 5 reserved, 3 usable
  const ipM = Array.from({ length: 8 }, (_, k) => solid(k < 4 || k === 7 ? 0x8a99a8 : C.green, 0.2));
  const ipB = ipM.map((m, k) => { const b = box(1.3, 0.8, 1.3, m, [-5.6 + k * 1.6, 0.14, 9]); S.add(b); return b; });
  // peering tubes
  const tube = (a: V3, b: V3, c: number) => { const m = mat(c, { emissive: c, emissiveIntensity: 0.35, transparent: true, opacity: 0.8 }); const t = new THREE.Mesh(new THREE.TubeGeometry(curve(a, [(a[0] + b[0]) / 2, 4, (a[2] + b[2]) / 2], b), 32, 0.3, 8, false), m); S.add(t); return m; };
  const peer1 = tube([-23, 1, 0], [-14, 1, 0], C.azure), peer2 = tube([14, 1, 0], [23, 1, 0], C.azure);

  const L = stepLabels(stage);
  L.add('🏢 Hub VNet 10.0.0.0/16', [0, 1, -11], 'all', 'd3-label-strong');
  L.add('📦 Spoke 1 · 10.1.0.0/16', [-36, 1, -13], 'all', 'd3-label-strong');
  L.add('📦 Spoke 2 · 10.2.0.0/16', [36, 1, -13], 'all', 'd3-label-strong');
  L.add('snet-app 10.1.1.0/24', [-36, 3, -8], [0, 3]);
  L.add('snet-pe 10.1.2.0/24', [-36, 1, 7], [0, 5]);
  L.add('📍 pip-hub · Standard · Static · zones 1-2-3', [3, 7.2, -6], [0]);
  const ipLbl = L.add('snet-tiny 10.0.9.0/29: 8 addresses', [0, 2.2, 9], [0]);
  L.add('🔗 hub ↔ spoke 1 peering', [-18, 5, 0], [1]);
  L.add('🔗 hub ↔ spoke 2 peering', [18, 5, 0], [1]);
  L.add('❌ no spoke 1 ↔ spoke 2 peering', [0, 9, 6], [1]);
  L.add('🔥 Firewall / NVA 10.0.2.4', [0, 4, -4], [1, 2, 8]);
  const rtLbl = L.add('🧭 rt-spoke1: 10.2.0.0/16 → VirtualAppliance 10.0.2.4 · 0.0.0.0/0 → VirtualAppliance', [-36, 6, -2], [2], 'd3-label-strong');
  L.add('🛡️ Subnet NSG · 200 Allow 443 → asg-web', [-36, 4.6, -2.6], [3]);
  const nicLbl = L.add('🛡️ NIC NSG', [-36, 3.6, -4.2], [3]);
  L.add('🏷️ app1 in asg-web', [-36, 3, -7.5], [3]);
  L.add('👤 Internet client', [-36, 3.6, 28], [3]);
  L.add('🏰 Azure Bastion · AzureBastionSubnet /26', [-7, 3, 6], [4], 'd3-label-strong');
  L.add('👩‍💻 Admin (browser or native client)', [-10, 3.6, 28], [4]);
  L.add('🖥️ app1 · 10.1.1.4 · no public IP', [-36, 3.2, -6], [4, 5, 6]);
  L.add('🗄️ Storage account · public endpoint', [-14, 4, -28], [5], 'd3-label-strong');
  L.add('🧱 Storage firewall', [-14, 4.4, -24.5], [5]);
  L.add('🔒 Private endpoint 10.1.2.4', [-30, 2.4, 4], [5]);
  const peLbl = L.add('', [-24, 6, -14], [5]);
  L.add('🌐 Public zone contoso.com · www → alias pip', [18, 3, 26], [6]);
  L.add('🔐 Private zone contoso.internal · linked to spokes', [14, 3, -14], [6]);
  const dnsLbl = L.add('', [0, 8, 14], [6]);
  L.add('⚖️ Standard load balancer · probe HTTP :80 /health', [36, 3, 8.5], [7], 'd3-label-strong');
  const webLbl = WEB.map((p, k) => L.add(`web0${k + 1} ✅`, [p[0], 3.4, p[2]], [7]));
  L.add('👤 Customers', [36, 3.6, 28], [7]);
  L.add('🔍 Network Watcher', [0, 15.4, 0], [8], 'd3-label-strong');
  const nwLbl = L.add('', [0, 11, 6], [8]);

  let step = 0, internal = false, rr = 0;
  const failed = new Set<number>();
  const hubIn: V3 = [0, 2, -4];
  const paintWeb = () => WEB.forEach((_, k) => { glow(webM[k], failed.has(k) ? C.red : C.green, failed.has(k) ? 0.8 : 0.2); webLbl[k].set(`web0${k + 1} ${failed.has(k) ? '❌ probe failed · out of pool' : '✅ healthy'}`); });
  const paintIps = (up = false) => ipB.forEach((b, k) => { b.position.y = up && (k < 4 || k === 7) ? 1.4 : 0.14; });

  return {
    go(i) {
      step = i;
      later.cancelAll(); packets.clear(); hud(''); L.show(i);
      failed.clear(); internal = false; paintWeb(); paintIps();
      ipB.forEach((b) => (b.visible = i === 0));
      [fwM, gwM, basM, pipM, peM, stM, pubZ, privZ, lbM].forEach((m) => glow(m, m.color.getHex(), 0.25));
      [app1M, app2M].forEach((m) => glow(m, null));
      if (i !== 7) webM.forEach((m) => glow(m, null));
      glow(peer1, C.azure, 0.35); glow(peer2, C.azure, 0.35);
      subNsg.opacity = nicNsg.opacity = i === 3 ? 0.35 : 0.08; fwStM.opacity = i === 5 ? 0.35 : 0.05;
      nicLbl.set('🛡️ NIC NSG'); rtLbl.set('🧭 rt-spoke1: 10.2.0.0/16 → VirtualAppliance 10.0.2.4 · 0.0.0.0/0 → VirtualAppliance');
      peLbl.set(''); dnsLbl.set(''); nwLbl.set('');
      nw.visible = i === 8; user.visible = i === 6 || i === 7; admin.visible = i === 4; net.visible = i === 3;
      ipLbl.set('snet-tiny 10.0.9.0/29: 8 addresses');
      const C3: [number, string][] = [[3.65, 'Standard static public IP ≈ $0.005/hour (illustrative); VNets and subnets are free'], [20, 'peering ≈ $0.01 per GB each way: ~1 TB a month here (illustrative)'], [0, 'route tables are free; the NVA or firewall is not'], [0, 'NSGs and ASGs are free'], [140, 'Bastion Basic ≈ $0.19/hour (illustrative), Standard costs more'], [7.3, 'private endpoint ≈ $0.01/hour + per GB; service endpoints are free'], [0.5, 'DNS zone ≈ $0.50/month + per million queries (illustrative)'], [18, 'Standard load balancer ≈ $0.025/hour for the first 5 rules + data (illustrative)'], [0, 'IP flow verify and next hop are free; connection monitor is billed per test']];
      cost(C3[i][0], 'month', C3[i][1]);
      const cams: [V3, V3][] = [[[4, 16, 26], [0, 1, 2]], [[0, 40, 46], [0, 1, 0]], [[-14, 34, 38], [-14, 1, -2]], [[-36, 14, 24], [-36, 2, 0]], [[-20, 22, 36], [-18, 1, 6]], [[-24, 26, 22], [-20, 1, -10]], [[16, 28, 40], [14, 1, 6]], [[36, 16, 30], [36, 1, 0]], [[0, 34, 46], [0, 4, 0]]];
      stage.fly(...cams[i]);
    },
    act(id) {
      if (id === 'reserved') {
        paintIps(true); ipB.forEach((b, k) => k < 4 || k === 7 ? flash(ipM[k], C.red, 0x8a99a8, 2) : flash(ipM[k], C.green, C.green, 2));
        ipLbl.set('.0 network · .1 gateway · .2 .3 Azure DNS · .7 broadcast → 3 usable');
        hud('🔢 Azure keeps 5 addresses in every subnet: the network address, the default gateway (.1), two for Azure DNS (.2, .3) and the broadcast address. A /29 has 8, so only 3 are yours. A /24 gives 251.', 'info');
      }
      if (id === 'pip') {
        flash(pipM, C.red, C.green, 0.8);
        later(1, () => { flash(pipM, C.green, C.green, 2); packets.send(curve([3, 6, -6], [3, 10, 10], [0, 2, 28]), C.green, 1.4); });
        hud('📍 Basic public IPs were retired on 30 September 2025, so that request fails. A Standard public IP is always static, zone-redundant where the region has zones, and closed to inbound traffic until an NSG allows it.', 'ok');
      }
      if (id === 'peer') {
        flash(peer1, C.green, C.azure, 1.6);
        packets.send(curve([-36, 2, -6], [-18, 5, 0], hubIn), C.green, 1.2, () => packets.send(curve(hubIn, [-18, 5, 0], [-36, 2, -6]), C.green, 1.2, () => hud('🔗 Hub and spoke 1 talk over private IPs on the Microsoft backbone. A peering is two links, one each way; both must show Connected. Address spaces can\'t overlap.', 'ok')));
      }
      if (id === 'transit') {
        packets.send(curve([-36, 2, -6], [-18, 5, 0], [0, 6, 4], [18, 5, 0], [36, 2, 4]), C.red, 2, () => {}, 0.48);
        later(1.3, () => { flash(peer2, C.red, C.azure); hud('🚫 Spoke 1 → spoke 2 dies in the hub. Peering isn\'t transitive: spoke 1 learns the hub\'s range, not spoke 2\'s. Peer the spokes directly, or route through an NVA in the hub.', 'bad'); });
      }
      if (id === 'udr') {
        packets.send(curve([-36, 2, -6], [-18, 5, -2], hubIn), C.green, 1.2, () => { flash(fwM, C.green, 0xd9822b);
          packets.send(curve(hubIn, [18, 5, -2], [36, 2, 4]), C.green, 1.2, () => { flash(app2M, C.green, 0x000000); hud('🧭 The user route sends 10.2.0.0/16 to VirtualAppliance 10.0.2.4. The NVA has IP forwarding on, inspects the packet and forwards it over the other peering. Spoke 2 needs the mirror route back.', 'ok'); }); });
      }
      if (id === 'nofwd') {
        packets.send(curve([-36, 2, -6], [-18, 5, -2], hubIn), C.red, 1.2, () => { flash(fwM, C.red, 0xd9822b, 2); rtLbl.set('🧭 route OK · ❌ IP forwarding off on the NVA NIC'); hud('🛑 The route works, but the NVA\'s NIC has IP forwarding off, so Azure drops any packet not addressed to the NVA itself. Turn it on in Azure (NIC → IP configurations) and in the guest OS.', 'bad'); });
      }
      if (id === 'internet') {
        packets.send(curve([-36, 2, -6], [-18, 5, -4], hubIn), C.amber, 1.2, () => { flash(fwM, C.amber, 0xd9822b);
          packets.send(curve([0, 3, -4], [0, 12, 12], [0, 2, 30]), C.amber, 1.4, () => hud('🌍 0.0.0.0/0 → VirtualAppliance forces all internet-bound traffic through the firewall (forced tunnelling to an NVA). Longest prefix wins, and a user route beats the system route on the same prefix.', 'ok')); });
      }
      if (id === 'https' || id === 'rdp' || id === 'nicblock') {
        const port = id === 'rdp' ? 3389 : 443;
        const stop = id === 'rdp' ? 0.83 : id === 'nicblock' ? 0.93 : undefined;
        if (id === 'nicblock') nicLbl.set('🛡️ NIC NSG · no 443 rule → DenyAllInBound');
        packets.send(curve([-36, 2, 28], [-36, 3, 10], [-36, 2, -2.6], [-36, 2, -6]), id === 'https' ? C.green : C.red, 2, () => {
          if (id === 'https') { flash(app1M, C.green, 0x000000); hud('✅ TCP 443 from the internet: the subnet NSG matches rule 200 (destination asg-web, and app1 is in asg-web), then the NIC NSG allows it too. Inbound checks the subnet NSG first, then the NIC NSG.', 'ok'); }
        }, stop);
        later(1.7, () => {
          if (id === 'rdp') { glow(subNsg, C.red, 1); later(1.5, () => glow(subNsg, C.amber, 0.3)); hud(`⛔ TCP ${port}: no allow rule matches, so DenyAllInBound (65500) in the subnet NSG drops it. The NIC NSG never sees it.`, 'bad'); }
          if (id === 'nicblock') { glow(nicNsg, C.red, 1); later(1.5, () => glow(nicNsg, C.amber, 0.3)); hud('⛔ The subnet NSG allowed 443, but someone attached an empty NSG to the NIC. Its DenyAllInBound drops the packet. Both NSGs must allow. IP flow verify names the exact rule.', 'bad'); }
        });
      }
      if (id === 'bastion') {
        packets.send(curve([-10, 2, 28], [-9, 6, 16], [-7, 2, 6]), C.purple, 1.2, () => { flash(basM, C.green, C.purple);
          packets.send(curve([-7, 2, 6], [-20, 5, 2], [-36, 2, -6]), C.green, 1.4, () => { flash(app1M, C.green, 0x000000); hud('🏰 The admin connects to Bastion over TLS 443. Bastion opens RDP/SSH to app1\'s private IP across the peering. app1 needs no public IP and no open 3389 or 22 to the internet.', 'ok'); }); });
      }
      if (id === 'direct') {
        packets.send(curve([-10, 2, 28], [-24, 6, 14], [-36, 2, -6]), C.red, 1.8, () => {}, 0.8);
        later(1.5, () => hud('🚫 Straight RDP to app1 fails: it has no public IP, and that\'s the point. Exposing 3389 to the internet invites brute-force attacks. Bastion (or a VPN) is the way in.', 'bad'));
      }
      if (id === 'se') {
        packets.send(curve([-36, 2, -6], [-28, 6, -18], [-14, 2, -24.5], [-14, 2, -28]), C.azure, 1.6, () => { flash(stM, C.green, 0x2f8f9d); peLbl.set('Service endpoint: source = subnet, target = public IP'); hud('🛣️ Service endpoint: the subnet reaches the storage account\'s public IP over the Microsoft backbone, and the storage firewall allows that subnet. Free, but the account still has a public endpoint and on-premises can\'t use it.', 'ok'); });
      }
      if (id === 'pe') {
        packets.send(curve([-36, 2, -6], [-33, 3, 0], [-30, 2, 4]), C.green, 0.9, () => { flash(peM, C.green, C.green);
          packets.send(curve([-30, 2, 4], [-22, 6, -12], [-14, 2, -28]), C.green, 1.4, () => { flash(stM, C.green, 0x2f8f9d); peLbl.set('Private endpoint: account answers on 10.1.2.4'); hud('🔒 Private endpoint: the account gets a NIC with a private IP in snet-pe, and the privatelink.blob.core.windows.net zone resolves its name to 10.1.2.4. You can switch off public access completely, and peered VNets and on-premises can use it too.', 'ok'); }); });
      }
      if (id === 'nodns') {
        packets.send(curve([-36, 2, -6], [-28, 6, -18], [-14, 2, -24.5], [-14, 2, -28]), C.red, 1.6, () => {}, 0.75);
        later(1.3, () => { glow(fwStM, C.red, 1); later(1.5, () => glow(fwStM, C.amber, 0.3)); peLbl.set('No private DNS zone → name resolves to the public IP'); hud('🧭 The private endpoint exists, but without the linked privatelink DNS zone the name still resolves to the public IP. Public access is disabled, so the firewall rejects it. Fix the DNS, not the endpoint.', 'bad'); });
      }
      if (id === 'public') {
        packets.send(curve([36, 2, 28], [27, 5, 28], [18, 2, 26]), C.azureLight, 0.9, () => { flash(pubZ, C.green, C.azureLight);
          packets.send(curve([18, 2, 26], [27, 6, 18], [36, 2, 9]), C.green, 1.1, () => { dnsLbl.set('www.contoso.com → A (alias) → pip-lb 20.85.4.10'); hud('🌐 A public zone answers anyone on the internet. You delegate the domain by putting Azure\'s four name servers at your registrar. An alias A record points at the public IP resource, so it follows the IP if it changes, and it works at the zone apex where a CNAME can\'t.', 'ok'); }); });
      }
      if (id === 'private') {
        packets.send(curve([-36, 2, -6], [-10, 6, -12], [14, 2, -14]), C.purple, 1.3, () => { flash(privZ, C.green, C.purple);
          packets.send(curve([14, 2, -14], [-10, 6, -12], [-36, 2, -6]), C.green, 1.3, () => { dnsLbl.set('db.contoso.internal → 10.2.1.4 (via 168.63.129.16)'); hud('🔐 A private zone answers only VMs in virtual networks linked to it, through Azure DNS at 168.63.129.16. With auto-registration on, VMs in the registration VNet get their A records added and removed for you.', 'ok'); }); });
      }
      if (id === 'unlinked') {
        packets.send(curve([36, 2, 4], [26, 6, -10], [14, 2, -14]), C.red, 1.3, () => {}, 0.85);
        later(1.2, () => { flash(privZ, C.red, C.purple); dnsLbl.set('NXDOMAIN: spoke 2 isn\'t linked to contoso.internal'); hud('❓ The zone has the record, but this VNet has no virtual network link to it, so the lookup returns NXDOMAIN. Add a link (registration off if you only need to resolve).', 'bad'); });
      }
      if (id === 'traffic') {
        const live = [0, 1, 2].filter((k) => !failed.has(k));
        for (let n = 0; n < 6; n++) later(n * 0.35, () => { const k = live[rr++ % live.length]; const src: V3 = internal ? [36, 2, 4] : [36, 2, 28]; packets.send(curve(src, [36, 3, 12], [36, 2, 8.5]), C.azure, 0.6, () => packets.send(curve([36, 2, 8.5], [(36 + WEB[k][0]) / 2, 4, 0], [WEB[k][0], 2, -6]), C.green, 0.6, () => flash(webM[k], C.green, C.green, 0.4))); });
        later(2.6, () => hud(`⚖️ ${internal ? 'Internal frontend (a private IP in the VNet)' : 'Public frontend (a Standard public IP)'}: the rule maps port 80 to the backend pool and spreads new flows with a 5-tuple hash across healthy VMs only.`, 'ok'));
      }
      if (id === 'fail') {
        failed.add(1); paintWeb();
        packets.send(curve([36, 2, 8.5], [36, 4, 0], [36, 2, -6]), C.amber, 0.8, () => packets.send(curve([36, 2, -6], [36, 4, 0], [36, 2, 8.5]), C.red, 0.8, () => hud('❌ The probe asks web02 for /health every 5 seconds and gets no 200, so the load balancer marks it Down and sends it no new flows. Common causes: the app isn\'t listening on the probe port, or an NSG blocks 168.63.129.16 (the AzureLoadBalancer tag). Press Send traffic again.', 'bad')));
      }
      if (id === 'internal') { internal = !internal; hud(internal ? '🏠 Now an internal load balancer: the frontend is a private IP, so only VNet, peered and on-premises clients can reach it. Perfect for a database or API tier.' : '🌍 Back to a public frontend.', 'info'); }
      if (id === 'ipflow') {
        glow(nwM, C.amber, 1);
        packets.send(curve([0, 12, 0], [-20, 10, 10], [-36, 2, -2.6]), C.red, 1.4, () => { glow(subNsg, C.red, 1); later(1.5, () => glow(subNsg, C.amber, 0.08)); nwLbl.set('IP flow verify: Deny · nsg-snet-web/DenyAllInBound'); hud('🔍 IP flow verify tests one 5-tuple (protocol, local IP:port, remote IP:port) against the effective NSG rules and names the rule that allows or denies it.', 'bad'); });
      }
      if (id === 'nexthop') {
        packets.send(curve([-36, 2, -6], [-18, 5, 0], [0, 6, 4], [18, 5, 0], [36, 2, 4]), C.red, 2, () => {}, 0.45);
        later(1.2, () => { nwLbl.set('Next hop app1 → 10.2.1.4: None (System Route)'); hud('🧭 Next hop says None: there\'s no route from spoke 1 to spoke 2, so the packet is dropped. That\'s non-transitive peering, not an NSG problem. Effective routes on the NIC show the same thing.', 'bad'); });
      }
      if (id === 'connect') {
        packets.send(curve([-36, 2, -6], [-18, 5, -2], hubIn), C.green, 1.1, () => { flash(fwM, C.green, 0xd9822b); packets.send(curve(hubIn, [18, 5, -2], [36, 2, 4]), C.green, 1.1, () => { flash(app2M, C.green, 0x000000); nwLbl.set('Connection troubleshoot: Reachable · 4 hops via 10.0.2.4'); hud('✅ Connection troubleshoot follows the real path hop by hop: source NIC, NSGs, routes, the NVA, the peering and the destination port. When it fails it tells you which hop and why.', 'ok'); }); });
      }
    },
  };
}
