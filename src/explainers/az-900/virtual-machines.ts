import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const spec: ExplainerSpec = {
  id: 'virtual-machines',
  lesson: 'virtual-machines',
  title: {
    main: 'One physical server. <em>Many virtual ones.</em>',
    sub: 'What happens when you create an Azure virtual machine, and which parts are still your job.',
  },
  summary: 'An animation of a physical Azure host being split by a hypervisor into isolated virtual machines, choosing a VM size, image and disk, the IaaS responsibility split, and how stopping and deallocating a VM stops compute charges.',
  html: `
  <div class="vm">
    <div class="vm-host msd-card">
      <div class="vm-hh">${I.cpu}<b>Physical host</b><span class="msd-chip">64 cores · 512 GB RAM</span></div>
      <div class="vm-slots">
        <div class="vm-vm mine msd-pop">
          <div class="vm-vh">${I.app}<b>vm-web-01</b><span class="vm-state msd-pill ok">Running</span></div>
          <div class="vm-size msd-mono"></div>
          <div class="vm-parts">
            <span class="msd-chip vm-img msd-reveal">Ubuntu 24.04 image</span>
            <span class="msd-chip vm-disk msd-reveal">${I.disk}OS disk · managed</span>
          </div>
        </div>
        <div class="vm-vm other o1 msd-pop"><div class="vm-vh">${I.lock}<b>Another customer</b></div><span class="vm-iso">isolated</span></div>
        <div class="vm-vm other o2 msd-pop"><div class="vm-vh">${I.lock}<b>Another customer</b></div><span class="vm-iso">isolated</span></div>
      </div>
      <div class="vm-hyper msd-reveal">${I.layers}<span>Hypervisor</span></div>
      <div class="vm-hw">${I.server}<span>CPU · memory · network card · power</span></div>
    </div>
    <div class="vm-split msd-stagger">
      <div class="vm-you"><b>You manage</b><span>Operating system &amp; patches</span><span>Apps &amp; data</span><span>Firewall rules</span></div>
      <div class="vm-ms"><b>Microsoft manages</b><span>Host hardware</span><span>Hypervisor</span><span>Datacenter</span></div>
    </div>
    <div class="vm-bill msd-reveal">${I.meter}<span>Compute</span><b class="vm-rate">₹9/hr</b><span class="vm-disk-bill">Disk · small monthly charge</span></div>
  </div>`,
  css: `
  @S .vm{ height:100%; display:flex; flex-direction:column; gap:14px; }
  @S .vm-host{ flex:1; padding:20px 22px; display:flex; flex-direction:column; gap:12px; min-height:0; }
  @S .vm-hh{ display:flex; align-items:center; gap:14px; color:#fff; font-size:30px; flex-wrap:wrap; }
  @S .vm-hh svg{ width:42px; height:42px; color:var(--x-a1); }
  @S .vm-slots{ flex:1; display:grid; grid-template-columns:1.6fr 1fr 1fr; gap:16px; min-height:0; }
  @S .vm-vm{ display:flex; flex-direction:column; gap:10px; padding:16px; border-radius:20px; border:1.5px solid var(--x-line); background:rgb(14 20 32 / .92); }
  @S .vm-vm.mine{ border-color:var(--x-a1); box-shadow:0 0 0 1px var(--x-a1), 0 0 40px rgb(58 160 255 / .2); }
  @S .vm-vh{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; color:#fff; font-size:25px; }
  @S .vm-vh svg{ width:30px; height:30px; color:var(--x-a1); }
  @S .vm-state{ margin-left:auto; font-size:19px; padding:6px 14px; }
  @S .vm-state.stopped{ color:var(--x-dim); border-color:var(--x-line); }
  @S .vm-size{ font-size:28px; color:var(--x-cyan); min-height:38px; }
  @S .vm-parts{ display:flex; flex-wrap:wrap; gap:10px; align-items:flex-start; }
  @S .vm-parts svg{ width:22px; height:22px; margin-right:6px; }
  @S .vm-vm.other svg{ color:var(--x-dim); }
  @S .vm-iso{ margin-top:auto; font-family:var(--x-mono); font-size:19px; color:var(--x-dim); }
  @S .vm-hyper{ display:flex; align-items:center; justify-content:center; gap:12px; padding:10px; border-radius:16px; background:linear-gradient(90deg, rgb(58 160 255 / .25), rgb(34 211 238 / .15)); border:1.5px solid rgb(58 160 255 / .55); color:#fff; font-size:26px; font-weight:800; }
  @S .vm-hyper svg{ width:32px; height:32px; }
  @S .vm-hw{ display:flex; align-items:center; justify-content:center; gap:12px; padding:10px; border-radius:16px; background:rgb(255 255 255 / .04); color:var(--x-dim); font-size:22px; font-weight:700; }
  @S .vm-hw svg{ width:30px; height:30px; }
  @S .vm-split{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  @S .vm-split > div{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; padding:14px 18px; border-radius:18px; font-size:21px; }
  @S .vm-split b{ width:100%; font-size:22px; }
  @S .vm-split span{ padding:5px 12px; border-radius:10px; background:rgb(255 255 255 / .06); color:var(--x-text); }
  @S .vm-you{ border:1.5px solid rgb(180 140 255 / .6); background:rgb(180 140 255 / .08); } @S .vm-you b{ color:var(--x-you); }
  @S .vm-ms{ border:1.5px solid rgb(58 160 255 / .6); background:rgb(58 160 255 / .08); } @S .vm-ms b{ color:var(--x-a1); }
  @S .vm-bill{ display:flex; align-items:center; gap:14px; justify-content:center; font-size:24px; color:var(--x-dim); flex-wrap:wrap; }
  @S .vm-bill svg{ width:32px; height:32px; color:var(--x-ok); }
  @S .vm-rate{ font-family:var(--x-mono); font-size:32px; color:var(--x-ok); }
  @S .vm-rate.off{ color:var(--x-dim); text-decoration:line-through; }
  @S .vm-disk-bill{ font-size:20px; padding:6px 14px; border-radius:10px; background:rgb(255 255 255 / .05); }
  @P .vm-slots{ grid-template-columns:1fr 1fr; grid-template-rows:1.5fr 1fr; }
  @P .vm-vm.mine{ grid-column:1 / -1; }
  @P .vm-split{ grid-template-columns:1fr; gap:12px; }
  `,
  stages: [
    {
      title: 'Start with one big server',
      key: 'one big server',
      desc: 'Azure datacenters are full of physical hosts with dozens of cores and lots of memory.',
      status: 'host-1182 · idle',
      say: 'Inside an Azure datacenter sits a big physical server, with dozens of CPU cores and hundreds of gigabytes of memory.',
      run: (m) => {
        m.punch('.vm-hw');
      },
    },
    {
      title: 'A hypervisor slices it up',
      key: 'hypervisor',
      desc: 'Software splits one machine into several virtual machines that can’t see each other.',
      status: 'hypervisor · loaded',
      say: "A layer of software called a hypervisor splits that one machine into several virtual machines that can't see each other.",
      run: (m) => {
        m.show('.vm-hyper', 0);
        m.sfx.lock();
      },
    },
    {
      title: 'You choose a size',
      key: 'size',
      desc: 'The size sets your virtual CPUs and memory. Bigger sizes cost more per hour.',
      status: 'size · Standard_D2s_v5',
      say: 'When you create a VM, you choose a size. It sets how many virtual CPUs and how much memory you get.',
      run: (m) => {
        m.show('.vm-vm.mine', 0);
        m.after(400, () => m.type('.vm-size', 'D2s_v5 · 2 vCPU · 8 GiB', 45));
      },
    },
    {
      title: 'Then an image and a disk',
      key: 'image',
      desc: 'Pick Windows Server or Linux. A managed disk holds the operating system.',
      status: 'provisioning · image + OS disk',
      thinking: true,
      say: 'You also pick an image, such as Windows Server or Ubuntu, and Azure attaches a managed disk that holds the operating system.',
      run: (m) => {
        m.show('.vm-parts > *', 350);
      },
    },
    {
      title: 'Neighbours, safely apart',
      key: 'safely apart',
      desc: 'Other customers’ VMs may share the host, each fully isolated with its own OS.',
      status: 'host-1182 · 3 VMs · isolated',
      say: "Other customers' VMs may run on the same host, but each one is isolated, with its own operating system.",
      run: (m) => {
        m.show('.vm-vm.other', 250);
      },
    },
    {
      title: 'The OS is your job',
      key: 'your job',
      desc: 'This is IaaS. Microsoft runs the hardware. You patch the OS and everything above it.',
      status: 'model · infrastructure as a service',
      say: 'This is infrastructure as a service. Microsoft looks after the hardware and the hypervisor. Patching the operating system, and everything above it, is your job.',
      run: (m) => {
        m.show('.vm-split > *', 300);
      },
    },
    {
      title: 'Stopped means stopped paying',
      key: 'stopped paying',
      desc: 'Stop and deallocate the VM and compute charges stop. The disk is still billed.',
      status: 'vm-web-01 · stopped (deallocated)',
      say: 'When you stop and deallocate a VM, compute charges stop. You still pay a little for the disk that keeps your data.',
      run: (m) => {
        m.show('.vm-bill', 0);
        m.after(1200, () => {
          const st = m.q('.vm-state')!;
          st.textContent = 'Stopped';
          st.classList.add('stopped');
          m.cls('.vm-rate', 'off');
          m.sfx.whoosh(false);
          m.punch('.vm-disk-bill', 3);
        });
      },
    },
  ],
  end: {
    title: 'A VM is a slice of a real server',
    sub: 'You pick the size, image and disk, and you own the OS. Microsoft owns the hardware underneath.',
  },
};

export default spec;
