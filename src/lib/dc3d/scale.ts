import { THREE, C, v, mat, box, person, ground, plate, glow, Packets, every, type V3 } from './kit';
import { stepLabels, type Ctx, type Ctl } from './types';

const MAX = 10;

/** Users → load balancer → servers. Scale up, scale out, autoscale and serverless with a live cost meter. */
export function scale({ stage, hud, setControl, meter: setMeter, cost, money }: Ctx): Ctl {
  const S = stage.scene;
  ground(stage, 160, 0xcfe3c4);
  S.add(plate(22, 22, 0xe4ddf3, [-17, 0, 0]), plate(26, 22, 0xb9d3ea, [9, 0, 0]));
  const packets = new Packets(stage, 0.3);

  const crowd = Array.from({ length: 30 }, (_, i) => {
    const p = person([C.purple, C.azure, 0xe3008c, C.green][i % 4], [-24 + (i % 6) * 2.6, 0.12, -7 + Math.floor(i / 6) * 3.4], 1.2);
    S.add(p);
    return p;
  });
  const lbM = mat(C.azure, { emissive: C.azure, emissiveIntensity: 0.5 });
  const lb = new THREE.Mesh(new THREE.OctahedronGeometry(1.4), lbM);
  lb.position.set(-5, 2, 0);
  S.add(lb);

  const servers = Array.from({ length: MAX }, (_, k) => {
    const m = mat(C.green, { emissive: C.green, emissiveIntensity: 0.25, roughness: 0.4, metalness: 0.3 });
    const g = new THREE.Group();
    g.position.set(1 + (k % 5) * 4, 0.12, -4.5 + Math.floor(k / 5) * 9);
    g.add(box(1.8, 2.6, 1.8, m));
    S.add(g);
    return { g, m, alive: false, scale: 0 };
  });

  /* bill shock: fast-forward a month */
  let bill: { day: number; total: number; auto: boolean } | null = null;
  const VM_HOUR = 0.192; // D4s v5, pay-as-you-go (illustrative)
  stage.onTick((_, dt) => {
    if (!bill || bill.day >= 30) return;
    const prev = bill.day;
    bill.day = Math.min(30, bill.day + dt * 4.5);
    for (let h = Math.floor(prev * 24); h < Math.floor(bill.day * 24); h++) {
      const dow = Math.floor(h / 24) % 7, hr = h % 24;
      const on = !bill.auto || (dow < 5 && hr >= 10 && hr < 19);
      if (on) bill.total += VM_HOUR;
      servers[0].m.color.setHex(on ? C.green : 0x8a99a8);
    }
    const d = Math.floor(bill.day);
    setMeter?.(`📅 Day ${d} of 30 · ${bill.auto ? '⏰ auto-shutdown ON (weekdays 10:00–19:00 only)' : '😴 running 24/7, nobody using it'}`);
    cost(bill.total, 'month', 'bill so far for one forgotten D4s v5 VM');
    if (bill.day >= 30) {
      const full = VM_HOUR * 720;
      hud(bill.auto
        ? `✅ With auto-shutdown the month costs <strong>${money(bill.total)}</strong> instead of ${money(full)}. You saved <strong>${money(full - bill.total)}</strong> (${Math.round((1 - bill.total / full) * 100)}%).`
        : `😱 Month-end bill: <strong>${money(bill.total)}</strong> for a VM nobody used. Stop (deallocate) VMs you aren’t using, set auto-shutdown and a budget alert.`, bill.auto ? 'ok' : 'bad');
    }
  });

  const st = { users: 40, n: 1, size: 1, auto: false, serverless: false, restarting: 0, cool: 0, burst: false };
  const cap = () => 100 * st.size;
  const cpu = () => (st.n ? st.users / (st.n * cap()) : 0);

  const L = stepLabels(stage);
  L.add('👥 Users', [-17, 4.5, -8], 'all');
  L.add('⚖️ Load balancer', [-5, 4.2, 0], [3, 4]);

  const paint = () => {
    const c = cpu();
    servers.forEach((s, k) => {
      s.alive = k < st.n;
      const col = st.restarting > 0 ? 0x8a99a8 : st.serverless ? C.amber : c > 0.9 ? C.red : c > 0.7 ? C.amber : C.green;
      s.m.color.setHex(col);
      glow(s.m, col, 0.25);
    });
    const shown = st.users === 0 ? 0 : Math.max(1, Math.round((st.users / 1000) * 30));
    crowd.forEach((p, i) => (p.visible = i < shown));
    const cpuTxt = st.serverless ? `${st.n} function instance${st.n === 1 ? '' : 's'}` : `${st.n} server${st.n > 1 ? 's' : ''}${st.size > 1 ? ` (size ×${st.size})` : ''} · CPU ${Math.round(c * 100)}%`;
    if (bill) return;
    setMeter?.(`👥 ${st.users} users · 🖥️ ${cpuTxt}${st.auto ? ' · 🤖 autoscale ON' : ''}`);
    if (st.serverless) cost(st.users * 0.0000016 * 3600, 'hour', 'pay per execution (illustrative). Zero events = zero compute bill');
    else cost(st.n * st.size * 0.1, 'hour', `${st.n} × VM${st.size > 1 ? ` (size ×${st.size})` : ''}, billed per hour while running`);
  };

  stage.onTick((_, dt) => {
    for (const s of servers) {
      const target = s.alive ? (st.serverless ? 0.5 : 0.8 + 0.25 * st.size) : 0;
      s.scale += (target - s.scale) * Math.min(1, dt * 5);
      s.g.scale.setScalar(Math.max(0.0001, s.scale));
      s.g.visible = s.scale > 0.02;
    }
    lb.rotation.y += dt;
    if (st.restarting > 0) { st.restarting -= dt; if (st.restarting <= 0) { paint(); hud(`✅ Restarted as a bigger VM (×${st.size}). Capacity is now ${cap()} users.`, 'ok'); } }
  });

  // autoscale / serverless loop
  every(stage, 1.2, () => {
    if (st.burst) {
      st.users = Math.round(st.users * 0.8);
      if (st.users < 5) { st.users = 0; st.burst = false; hud('😴 No more events: 0 instances running, $0 being billed.', 'ok'); }
      setControl?.('users', st.users);
    }
    if (st.serverless) { st.n = Math.min(MAX, Math.ceil(st.users / 80)); paint(); return; }
    if (!st.auto) return;
    const c = cpu();
    if (c > 0.7 && st.n < MAX) { st.n++; hud(`🤖 CPU ${Math.round(c * 100)}% > 70%: autoscale added server ${st.n}.`, 'info'); }
    else if (c < 0.3 && st.n > 1) { st.n--; hud(`🤖 CPU ${Math.round(c * 100)}% < 30%: autoscale removed a server. You stop paying for it.`, 'ok'); }
    paint();
  });

  // traffic
  every(stage, 0.12, () => {
    if (Math.random() > Math.min(1, st.users / 250) || st.n === 0) return;
    const from = v(-17 + (Math.random() - 0.5) * 10, 1.2, (Math.random() - 0.5) * 10);
    packets.send(new THREE.CatmullRomCurve3([from, v(-10, 2, from.z * 0.4), lb.position.clone()]), C.purple, 0.6, () => {
      const alive = servers.filter((s) => s.alive);
      const s = alive[Math.floor(Math.random() * alive.length)];
      if (!s) return;
      const dest = s.g.position.clone().add(v(0, 1.4, 0));
      const failing = st.restarting > 0 || (!st.serverless && cpu() > 1 && Math.random() < 1 - 1 / cpu());
      packets.send(new THREE.CatmullRomCurve3([lb.position.clone(), v((lb.position.x + dest.x) / 2, 2.6, dest.z * 0.6), dest]), failing ? C.red : C.green, 0.55, undefined, failing ? 0.85 : undefined);
    });
  });

  const set = (p: Partial<typeof st>) => { Object.assign(st, p); setControl?.('users', st.users); paint(); };

  return {
    go(i) {
      hud('');
      bill = null;
      packets.clear();
      L.show(i);
      const presets: Partial<typeof st>[] = [
        { users: 40, n: 1, size: 1, auto: false, serverless: false, burst: false },
        { users: 40, n: 1, size: 1, auto: false, serverless: false, burst: false },
        { users: 300, n: 1, size: 1, auto: false, serverless: false, burst: false },
        { users: 300, n: 1, size: 1, auto: false, serverless: false, burst: false },
        { users: 300, n: 1, size: 1, auto: true, serverless: false, burst: false },
        { users: 0, n: 0, size: 1, auto: false, serverless: true, burst: false },
        { users: 0, n: 1, size: 1, auto: false, serverless: false, burst: false },
      ];
      set(presets[i]);
      if (i === 2 || i === 3) hud('🔥 300 users on one small server: CPU 300%. Red dots are failed requests.', 'bad');
      if (i === 5) hud('No events, no instances, no bill. Send a burst.', 'info');
      if (i === 6) { hud('One test VM, created on Monday… and forgotten. Ask the what-if questions below.', 'info'); cost(VM_HOUR, 'hour', 'D4s v5 test VM, billed every hour it runs'); }
      const cams: [V3, V3][] = [[[-4, 22, 34], [-2, 0, 0]], [[-4, 22, 34], [-2, 0, 0]], [[6, 16, 26], [4, 1, 0]], [[0, 24, 34], [2, 0, 0]], [[0, 26, 36], [0, 0, 0]], [[0, 24, 34], [0, 0, 0]], [[4, 9, 14], [1, 1, -4]]];
      stage.fly(...cams[i]);
    },
    act(id) {
      if (id === 'spike') { set({ users: st.auto ? 650 : 300 }); hud(st.auto ? '📈 Spike! Watch autoscale add servers one by one.' : '🔥 Spike! One server cannot cope: CPU way over 100%, requests fail (red).', st.auto ? 'info' : 'bad'); }
      if (id === 'quiet') { set({ users: 15 }); hud('🌙 Night time: traffic drops, autoscale removes servers to save money.', 'info'); }
      if (id === 'up') {
        if (st.size >= 4) { hud('⛔ Largest size reached. Scaling up has a ceiling. Time to scale out instead.', 'bad'); return; }
        st.size *= 2; st.restarting = 1.6; paint();
        hud('⏳ Resizing… the VM restarts, so requests fail for a moment (red).', 'info');
      }
      if (id === 'down') { if (st.size > 1) { st.size /= 2; st.restarting = 1.2; paint(); hud('⏳ Resizing down (restart)…', 'info'); } }
      if (id === 'out') { if (st.n < MAX) { set({ n: st.n + 1 }); hud(`➕ Server ${st.n} added. No restart, the load balancer shares the work.`, 'ok'); } }
      if (id === 'in') { if (st.n > 1) { set({ n: st.n - 1 }); hud('➖ Server removed. You stop paying for it.', 'info'); } }
      if (id === 'auto') { set({ auto: !st.auto }); hud(st.auto ? '🤖 Autoscale ON: +1 server when CPU > 70%, −1 when CPU < 30%.' : 'Autoscale OFF.', 'info'); }
      if (id === 'forget' || id === 'autoshut') { bill = { day: 0, total: 0, auto: id === 'autoshut' }; hud(id === 'forget' ? '⏩ Fast-forwarding 30 days…' : '⏩ Same month, with auto-shutdown at 7 PM and weekends off…', 'info'); }
      if (id === 'events') { set({ users: 800, burst: true }); hud('⚡ 800 events arrive: instances spin up automatically…', 'info'); }
    },
    input(name, value) {
      if (name !== 'users') return;
      st.users = value;
      if (st.serverless && value > 0) st.burst = false;
      paint();
    },
  };
}
