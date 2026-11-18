import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const spec: ExplainerSpec = {
  id: 'virtual-network',
  lesson: 'virtual-networks-and-subnets',
  title: {
    main: 'Your own private network <em>inside Azure</em>',
    sub: 'Virtual networks, subnets, private IP addresses and network security groups, with real traffic.',
  },
  summary: 'An animation of a virtual network with a 10.0.0.0/16 address space split into a web subnet and a database subnet, VMs receiving private IPs, traffic flowing inside the network, customers reaching the web server on port 443, and a direct attempt on the database being blocked.',
  html: `
  <div class="vn">
    <div class="vn-net">
      <div class="msd-label">${I.globe}<span>Internet</span></div>
      <div class="vn-who vn-cust msd-reveal"><span class="vn-av">${I.users}</span><b>Customers</b><span class="msd-chip">HTTPS · 443</span></div>
      <div class="vn-who vn-bad msd-reveal"><span class="vn-av">${I.user}</span><b>Unknown host</b><span class="msd-chip">SQL · 1433</span></div>
    </div>
    <div class="vn-vnet msd-card">
      <div class="vn-vh">${I.net}<b>vnet-shop</b><span class="msd-chip vn-space">10.0.0.0/16</span></div>
      <div class="vn-subs">
        <div class="vn-sub s-web msd-reveal">
          <div class="vn-sh"><b>snet-web</b><span class="msd-mono">10.0.1.0/24</span><span class="vn-nsg msd-pill ok msd-reveal">${I.shield}NSG · allow 443</span></div>
          <div class="vn-vm msd-node msd-pop"><span class="ic">${I.server}</span><span>web-vm<small class="vn-ip">10.0.1.4</small></span></div>
          <span class="vn-pip msd-chip msd-reveal">public IP</span>
        </div>
        <div class="vn-sub s-db msd-reveal">
          <div class="vn-sh"><b>snet-db</b><span class="msd-mono">10.0.2.0/24</span><span class="vn-nsg msd-pill ok msd-reveal">${I.shield}NSG · web subnet only</span></div>
          <div class="vn-vm msd-node msd-pop"><span class="ic">${I.db}</span><span>db-vm<small class="vn-ip">10.0.2.4</small></span></div>
          <span class="vn-block msd-pill bad msd-reveal">${I.x}Denied</span>
        </div>
      </div>
    </div>
    <div class="vn-sum msd-stagger">
      <span class="msd-pill accent">VNet = isolation</span><span class="msd-pill accent">Subnet = segment</span><span class="msd-pill ok">NSG = allow / deny rules</span>
    </div>
    <div class="vn-flow"></div>
  </div>`,
  css: `
  @S .vn{ position:relative; height:100%; display:grid; grid-template-columns:300px 1fr; grid-template-rows:1fr auto; gap:20px; }
  @S .vn-net{ display:flex; flex-direction:column; gap:18px; justify-content:center; }
  @S .vn-net .msd-label{ display:flex; align-items:center; gap:10px; }
  @S .vn-net .msd-label svg{ width:26px; height:26px; color:var(--x-a1); }
  @S .vn-who{ display:flex; flex-direction:column; gap:10px; align-items:flex-start; padding:18px; border-radius:20px; background:linear-gradient(180deg, var(--x-panel), var(--x-panel-2)); border:1.5px solid var(--x-line); }
  @S .vn-who b{ color:#fff; font-size:25px; }
  @S .vn-av{ width:52px; height:52px; border-radius:14px; display:grid; place-items:center; background:rgb(58 160 255 / .14); color:var(--x-a1); }
  @S .vn-av svg{ width:30px; height:30px; }
  @S .vn-bad .vn-av{ background:rgb(244 74 106 / .14); color:var(--x-bad); }
  @S .vn-vnet{ padding:24px; display:flex; flex-direction:column; gap:18px; border-style:dashed; border-color:rgb(58 160 255 / .5); min-height:0; }
  @S .vn-vh{ display:flex; align-items:center; gap:14px; color:#fff; font-size:30px; flex-wrap:wrap; }
  @S .vn-vh svg{ width:40px; height:40px; color:var(--x-a1); }
  @S .vn-subs{ flex:1; display:grid; grid-template-columns:1fr 1fr; gap:20px; min-height:0; }
  @S .vn-sub{ position:relative; display:flex; flex-direction:column; gap:18px; padding:20px; border-radius:20px; border:1.5px solid rgb(34 211 238 / .45); background:rgb(34 211 238 / .05); }
  @S .vn-sh{ display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
  @S .vn-sh b{ color:var(--x-cyan); font-size:26px; }
  @S .vn-sh .msd-mono{ color:var(--x-dim); font-size:21px; }
  @S .vn-nsg{ font-size:18px; padding:7px 12px; }
  @S .vn-nsg svg{ width:22px; height:22px; }
  @S .vn-vm{ font-size:25px; }
  @S .vn-vm small{ display:block; font-family:var(--x-mono); font-size:20px; color:var(--x-cyan); font-weight:600; margin-top:4px; opacity:0; transition:opacity .3s; }
  @S .vn.ips .vn-vm small{ opacity:1; }
  @S .vn-pip, @S .vn-block{ align-self:flex-start; }
  @S .vn-block svg{ width:22px; height:22px; }
  @S .vn-sum{ grid-column:1 / -1; display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }
  @S .vn-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  @P .vn{ grid-template-columns:1fr; grid-template-rows:auto 1fr auto; }
  @P .vn-net{ flex-direction:row; flex-wrap:wrap; justify-content:center; }
  @P .vn-net .msd-label{ width:100%; }
  @P .vn-who{ flex:1; padding:14px; }
  @P .vn-subs{ grid-template-columns:1fr; }
  @P .vn-sub{ gap:12px; padding:16px; }
  `,
  stages: [
    {
      title: 'A private network in Azure',
      key: 'private network',
      desc: 'A virtual network (VNet) is yours alone. You give it an address range.',
      status: 'vnet-shop · 10.0.0.0/16',
      say: 'A virtual network is your own private network inside Azure. You give it an address range, written like ten dot zero dot zero dot zero, slash sixteen.',
      run: (m) => {
        m.punch('.vn-space', 2);
      },
    },
    {
      title: 'Split it into subnets',
      key: 'subnets',
      desc: 'Subnets are smaller ranges for different jobs: one for web, one for data.',
      status: 'snet-web · snet-db',
      say: 'You divide it into subnets, smaller ranges for different jobs. Here there is one subnet for web servers and one for the database.',
      run: (m) => {
        m.show('.vn-sub', 300);
      },
    },
    {
      title: 'Every VM gets a private IP',
      key: 'private IP',
      desc: 'Addresses come from the subnet’s range. Azure reserves the first four.',
      status: 'web-vm 10.0.1.4 · db-vm 10.0.2.4',
      say: 'Every VM you place in a subnet gets a private IP address from its range. Azure keeps the first four addresses in each subnet for itself.',
      run: (m) => {
        m.show('.vn-vm', 300);
        m.after(800, () => { m.cls('.vn', 'ips'); m.sfx.lock(); });
      },
    },
    {
      title: 'Inside, they talk freely',
      key: 'talk freely',
      desc: 'By default, resources in the same VNet can reach each other, even across subnets.',
      status: 'web-vm → db-vm · allowed',
      say: 'By default, resources in the same virtual network can talk to each other, even across subnets.',
      run: (m) => {
        m.stream('.vn-flow', { from: '.s-web .vn-vm', to: '.s-db .vn-vm', count: 5, duration: 900, gap: 700 });
      },
    },
    {
      title: 'Customers come in on 443',
      key: '443',
      desc: 'A public IP plus a network security group rule lets HTTPS reach the web server.',
      status: 'inbound 443 → web-vm · allowed',
      say: 'Customers reach the web server from the internet through a public IP, and a network security group lets HTTPS traffic in on port 443.',
      run: (m) => {
        m.show('.vn-cust', 0);
        m.show('.s-web .vn-nsg, .vn-pip', 200);
        m.after(500, () => m.stream('.vn-flow', { from: '.vn-cust .vn-av', to: '.s-web .vn-vm', count: 6, duration: 1000, gap: 650 }));
      },
    },
    {
      title: 'Straight at the database? Denied',
      key: 'Denied',
      desc: 'The database has no public IP, and its NSG only allows traffic from the web subnet.',
      status: 'inbound 1433 from internet · DENY',
      say: 'Someone on the internet tries to reach the database directly. It has no public IP, and the security group on its subnet only allows the web subnet, so the attempt goes nowhere.',
      run: (m) => {
        m.show('.vn-bad', 0);
        m.show('.s-db .vn-nsg', 0, true);
        m.after(300, () => m.particles('.vn-flow', { from: '.vn-bad .vn-av', to: '.s-db .vn-sh', count: 5, duration: 900, color: '#f44a6a' }));
        m.after(1200, () => { m.show('.vn-block', 0, true); m.shake('.s-db'); });
      },
    },
    {
      title: 'Isolated by default',
      key: 'Isolated',
      desc: 'VNets isolate, subnets organise, and NSGs decide which traffic gets in.',
      status: 'summary · VNet · subnet · NSG',
      say: 'So a virtual network isolates your resources, subnets organise them, and network security groups decide which traffic gets in.',
      run: (m) => {
        m.show('.vn-sum > *', 250);
        m.after(900, () => m.sfx.chime());
      },
    },
  ],
  end: {
    title: 'VNet isolates. Subnets organise. NSGs guard.',
    sub: 'Plan the address range first, split it by job, then allow only the traffic each subnet needs.',
  },
};

export default spec;
