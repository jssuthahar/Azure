/**
 * Azure portal simulator (EDUCATION ONLY). A free-to-navigate copy of the
 * current Azure portal experience — global search, the ☰ portal menu, Home,
 * All services, Create a resource, list blades, multi-tab create wizards,
 * deployments, notifications, resource blades with left menus, Cost
 * Management, Advisor and Copilot — backed by the shared simulated Azure
 * (engine.ts), so whatever you do here also shows up in Cloud Shell.
 * Not affiliated with Microsoft. Nothing here touches real Azure.
 */
import { Sim, SimError, REGIONS, VM_SIZES, IMAGES, STORAGE_SKUS, PLAN_SKUS, RUNTIMES, TYPE_INFO, SUB_NAME, SUB_ID, type Res, type ResType } from './engine';
import { money as fmtMoney } from '../currency';

/* ------------------------------------------------------------------ */
/* types                                                               */
/* ------------------------------------------------------------------ */
type WizKind = 'rg' | 'vm' | 'storage' | 'webapp' | 'vmss';
type View =
  | { page: 'home' } | { page: 'services' } | { page: 'create' } | { page: 'dashboard' }
  | { page: 'rgs' } | { page: 'all' } | { page: 'list'; type: ResType }
  | { page: 'wizard'; kind: WizKind }
  | { page: 'deploy'; name: string; rg: string; target?: string; done: boolean }
  | { page: 'rg'; name: string; tab?: string } | { page: 'res'; id: string; tab?: string }
  | { page: 'cost' } | { page: 'subs' } | { page: 'monitor' } | { page: 'advisor' } | { page: 'entra' } | { page: 'defender' } | { page: 'policy' };
interface Wiz { kind: WizKind; tab: number; d: Record<string, string>; review?: { ok: boolean; errors: string[] } }
interface Note { kind: 'ok' | 'bad' | 'info'; title: string; text: string; at: number }
interface PaneState { kind: 'notes' | 'copilot' | 'json' | 'connect' | 'del-rg' | 'del-res' | 'settings' | 'info'; arg?: string; title?: string; html?: string }

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const md = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>');
const A = (act: string, arg = '') => `data-act="${act}"${arg ? ` data-arg="${esc(arg)}"` : ''}`;
const NAV = (v: View) => A('nav', JSON.stringify(v));
const money = (usd: number) => fmtMoney(usd);
const ago = (t: number) => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? 'a few seconds ago' : s < 3600 ? `${Math.round(s / 60)} min ago` : `${Math.round(s / 3600)} h ago`; };
const ico = (e: string, c = '#0078d4', size = '') => `<span class="pt-ico ${size}" style="--ic:${c}" aria-hidden="true">${e}</span>`;
const regionLabel = (k: string) => REGIONS[k] ?? k;

/** Services the simulator knows. `view` = navigable; otherwise it explains and points to Cloud Shell. */
const SVC: { k: string; label: string; icon: string; color: string; cat: string; view?: View; kw?: string }[] = [
  { k: 'create', label: 'Create a resource', icon: '＋', color: '#0f6cbd', cat: 'General', view: { page: 'create' } },
  { k: 'home', label: 'Home', icon: '🏠', color: '#0078d4', cat: 'General', view: { page: 'home' } },
  { k: 'dashboard', label: 'Dashboard', icon: '▤', color: '#0078d4', cat: 'General', view: { page: 'dashboard' } },
  { k: 'all', label: 'All resources', icon: '▦', color: '#0078d4', cat: 'General', view: { page: 'all' } },
  { k: 'rgs', label: 'Resource groups', icon: '📦', color: '#5c2d91', cat: 'General', view: { page: 'rgs' }, kw: 'rg folder' },
  { k: 'subs', label: 'Subscriptions', icon: '🔑', color: '#c19c00', cat: 'General', view: { page: 'subs' } },
  { k: 'vm', label: 'Virtual machines', icon: '🖥️', color: '#0078d4', cat: 'Compute', view: { page: 'list', type: 'vm' }, kw: 'vm iaas server ec2' },
  { k: 'vmss', label: 'Virtual machine scale sets', icon: '🧮', color: '#5c2d91', cat: 'Compute', view: { page: 'list', type: 'vmss' }, kw: 'vmss autoscale' },
  { k: 'webapp', label: 'App Services', icon: '🌐', color: '#0078d4', cat: 'Web', view: { page: 'list', type: 'webapp' }, kw: 'web app paas website' },
  { k: 'plan', label: 'App Service plans', icon: '📋', color: '#0078d4', cat: 'Web', view: { page: 'list', type: 'plan' } },
  { k: 'functionapp', label: 'Function App', icon: '⚡', color: '#c19c00', cat: 'Compute', view: { page: 'list', type: 'functionapp' }, kw: 'functions serverless lambda' },
  { k: 'aks', label: 'Kubernetes services', icon: '☸️', color: '#326ce5', cat: 'Containers', view: { page: 'list', type: 'aks' }, kw: 'aks kubernetes' },
  { k: 'aci', label: 'Container instances', icon: '📦', color: '#0078d4', cat: 'Containers', view: { page: 'list', type: 'aci' }, kw: 'aci docker' },
  { k: 'storage', label: 'Storage accounts', icon: '🗄️', color: '#2f8f9d', cat: 'Storage', view: { page: 'list', type: 'storage' }, kw: 'blob files s3' },
  { k: 'disk', label: 'Disks', icon: '💽', color: '#0078d4', cat: 'Storage', view: { page: 'list', type: 'disk' } },
  { k: 'vnet', label: 'Virtual networks', icon: '🔷', color: '#0078d4', cat: 'Networking', view: { page: 'list', type: 'vnet' }, kw: 'vnet vpc subnet' },
  { k: 'nsg', label: 'Network security groups', icon: '🛡️', color: '#5c2d91', cat: 'Networking', view: { page: 'list', type: 'nsg' }, kw: 'nsg firewall rules' },
  { k: 'pip', label: 'Public IP addresses', icon: '📍', color: '#0078d4', cat: 'Networking', view: { page: 'list', type: 'pip' } },
  { k: 'nic', label: 'Network interfaces', icon: '🔌', color: '#0078d4', cat: 'Networking', view: { page: 'list', type: 'nic' } },
  { k: 'dnszone', label: 'DNS zones', icon: '🔎', color: '#0078d4', cat: 'Networking', view: { page: 'list', type: 'dnszone' } },
  { k: 'vpngw', label: 'Virtual network gateways', icon: '🔐', color: '#0078d4', cat: 'Networking', view: { page: 'list', type: 'vpngw' }, kw: 'vpn' },
  { k: 'cost', label: 'Cost Management', icon: '💲', color: '#107c10', cat: 'Management', view: { page: 'cost' }, kw: 'billing budget cost' },
  { k: 'monitor', label: 'Monitor', icon: '📈', color: '#0078d4', cat: 'Management', view: { page: 'monitor' }, kw: 'metrics logs alerts' },
  { k: 'advisor', label: 'Advisor', icon: '💡', color: '#c19c00', cat: 'Management', view: { page: 'advisor' }, kw: 'recommendations' },
  { k: 'policy', label: 'Policy', icon: '📜', color: '#5c2d91', cat: 'Management', view: { page: 'policy' }, kw: 'governance compliance' },
  { k: 'entra', label: 'Microsoft Entra ID', icon: '👤', color: '#0078d4', cat: 'Identity', view: { page: 'entra' }, kw: 'azure ad users identity' },
  { k: 'defender', label: 'Microsoft Defender for Cloud', icon: '🛡️', color: '#107c10', cat: 'Security', view: { page: 'defender' }, kw: 'security secure score' },
  { k: 'shell', label: 'Cloud Shell', icon: '⌨️', color: '#1b1a19', cat: 'General', kw: 'cli powershell bash terminal' },
];
const svcFor = (t: ResType) => SVC.find((s) => s.k === t);
const typeIcon = (t: ResType) => { const s = svcFor(t); return ico(s?.icon ?? TYPE_INFO[t]?.icon ?? '▫️', s?.color); };

const WIZ: Record<WizKind, { title: string; crumb: View; tabs: string[] }> = {
  rg: { title: 'Create a resource group', crumb: { page: 'rgs' }, tabs: ['Basics', 'Tags', 'Review + create'] },
  vm: { title: 'Create a virtual machine', crumb: { page: 'list', type: 'vm' }, tabs: ['Basics', 'Disks', 'Networking', 'Management', 'Monitoring', 'Advanced', 'Tags', 'Review + create'] },
  storage: { title: 'Create a storage account', crumb: { page: 'list', type: 'storage' }, tabs: ['Basics', 'Advanced', 'Networking', 'Data protection', 'Encryption', 'Tags', 'Review + create'] },
  webapp: { title: 'Create Web App', crumb: { page: 'list', type: 'webapp' }, tabs: ['Basics', 'Database', 'Deployment', 'Networking', 'Monitor + secure', 'Tags', 'Review + create'] },
  vmss: { title: 'Create a virtual machine scale set', crumb: { page: 'list', type: 'vmss' }, tabs: ['Basics', 'Spot', 'Disks', 'Networking', 'Scaling', 'Management', 'Health', 'Advanced', 'Tags', 'Review + create'] },
};
const MARKET: { n: string; d: string; icon: string; kind?: WizKind; cli?: string }[] = [
  { n: 'Virtual machine', d: 'IaaS: Linux or Windows server, you manage the OS.', icon: '🖥️', kind: 'vm' },
  { n: 'Storage account', d: 'Blobs, files, queues and tables.', icon: '🗄️', kind: 'storage' },
  { n: 'Web App', d: 'PaaS: host websites and APIs, no servers to manage.', icon: '🌐', kind: 'webapp' },
  { n: 'Resource group', d: 'A folder for resources that share a lifecycle.', icon: '📦', kind: 'rg' },
  { n: 'Virtual machine scale set', d: 'Identical VMs that scale out and in.', icon: '🧮', kind: 'vmss' },
  { n: 'Function App', d: 'Serverless: run code on events, pay per execution.', icon: '⚡', cli: 'az functionapp create -g <rg> -n <name>' },
  { n: 'Kubernetes Service', d: 'Managed Kubernetes clusters.', icon: '☸️', cli: 'az aks create -g <rg> -n <name> --node-count 2' },
  { n: 'Container Instances', d: 'Run a container in seconds.', icon: '📦', cli: 'az container create -g <rg> -n <name> --image mcr.microsoft.com/azuredocs/aci-helloworld' },
  { n: 'DNS zone', d: 'Host DNS records for your domain.', icon: '🔎', cli: 'az network dns zone create -g <rg> -n contoso.com' },
  { n: 'Virtual network gateway', d: 'Site-to-site VPN to your office.', icon: '🔐', cli: 'az network vnet-gateway create …' },
];

/* ------------------------------------------------------------------ */
/* Portal                                                              */
/* ------------------------------------------------------------------ */
export class Portal {
  view: View = { page: 'home' };
  wiz: Wiz | null = null;
  pane: PaneState | null = null;
  menuOpen = false;
  q = '';
  searchOpen = false;
  notes: Note[] = [];
  unread = 0;
  toast: Note | null = null;
  dark = false;
  eduHidden = false;
  /** Set by the host page: open the Cloud Shell tab. */
  onShell?: () => void;
  private toastTimer = 0;

  constructor(private root: HTMLElement, private sim: Sim) {
    root.classList.add('pa');
    try { this.eduHidden = sessionStorage.getItem('pa-edu') === '1'; } catch {}
    sim.onChange(() => this.render());
    root.addEventListener('click', (e) => this.onClick(e));
    root.addEventListener('input', (e) => this.onInput(e));
    root.addEventListener('change', (e) => this.onChange(e));
    root.addEventListener('submit', (e) => { e.preventDefault(); this.onSubmit(e.target as HTMLFormElement); });
    root.addEventListener('keydown', (e) => this.onKey(e));
    window.addEventListener('currency-change', () => this.render());
    this.render();
  }

  /* ---------------- navigation ---------------- */
  go(v: View) {
    this.view = v;
    this.pane = null;
    this.menuOpen = false;
    this.searchOpen = false;
    this.q = '';
    this.root.querySelector('.pa-scroll')?.scrollTo(0, 0);
    this.sim.emit('view', { ...v }); // triggers render
  }
  openResource(id: string) { this.go({ page: 'res', id }); }
  private startWizard(kind: WizKind, preset: Record<string, string> = {}) {
    const firstRg = this.sim.rgs[0]?.name ?? '';
    const base: Record<WizKind, Record<string, string>> = {
      rg: { region: 'westeurope' },
      vm: { rg: firstRg, region: this.sim.rgs[0]?.location ?? 'westeurope', avail: 'none', zone: '1', image: 'Ubuntu2204', size: 'Standard_B1s', auth: 'ssh', admin: 'azureuser', inbound: 'allow', port: '22', osdisk: 'Premium SSD (locally-redundant storage)', shutdown: '' },
      storage: { rg: firstRg, region: this.sim.rgs[0]?.location ?? 'westeurope', perf: 'Standard', sku: 'Standard_GRS', tier: 'Hot' },
      webapp: { rg: firstRg, region: this.sim.rgs[0]?.location ?? 'westeurope', runtime: RUNTIMES[0], plansku: 'B1', os: 'Linux', publish: 'Code' },
      vmss: { rg: firstRg, image: 'Ubuntu2204', size: 'Standard_B1s', count: '2' },
    };
    this.wiz = { kind, tab: 0, d: { ...base[kind], ...preset } };
    this.go({ page: 'wizard', kind });
  }
  private notify(kind: Note['kind'], title: string, text: string) {
    const n = { kind, title, text, at: Date.now() };
    this.notes.unshift(n);
    this.unread++;
    this.toast = n;
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => { this.toast = null; this.render(); }, 5000);
    this.render();
  }
  private fail(err: unknown) {
    const msg = err instanceof SimError ? err.message : String((err as Error)?.message ?? err);
    this.notify('bad', 'Operation failed', msg);
  }
  private cur(): Res | undefined {
    return this.view.page === 'res' ? this.sim.res.find((r) => r.id === (this.view as { id: string }).id) : undefined;
  }

  /* ---------------- events ---------------- */
  private onClick(e: Event) {
    const t = e.target as HTMLElement;
    if (this.searchOpen && !t.closest('.pa-searchwrap')) { this.searchOpen = false; this.renderDrop(); }
    const el = t.closest<HTMLElement>('[data-act]');
    if (!el) { if (this.menuOpen && !t.closest('.pa-flyout')) { this.menuOpen = false; this.render(); } return; }
    const act = el.dataset.act!, arg = el.dataset.arg ?? '';
    const sim = this.sim;
    try {
      switch (act) {
        case 'nav': return this.go(JSON.parse(arg));
        case 'svc': return this.openSvc(arg);
        case 'menu': this.menuOpen = !this.menuOpen; return this.render();
        case 'edu-hide': this.eduHidden = true; try { sessionStorage.setItem('pa-edu', '1'); } catch {} return this.render();
        case 'pane': this.pane = { kind: arg as PaneState['kind'] }; if (arg === 'notes') this.unread = 0; return this.render();
        case 'pane-close': this.pane = null; return this.render();
        case 'shell': this.onShell ? this.onShell() : this.notify('info', 'Cloud Shell', 'Open the Cloud Shell tab above the portal.'); return;
        case 'theme': this.dark = !this.dark; return this.render();
        case 'res': return this.go({ page: 'res', id: arg });
        case 'rg': return this.go({ page: 'rg', name: arg });
        case 'blade': {
          const v = this.view as { page: 'res' | 'rg'; tab?: string };
          this.view = { ...(this.view as any), tab: arg };
          this.pane = null;
          sim.emit('view', { ...this.view, tab: arg });
          void v;
          return;
        }
        case 'market': { const m = MARKET.find((x) => x.n === arg)!; if (m.kind) return this.startWizard(m.kind); this.pane = { kind: 'info', title: m.n, html: `<p>${esc(m.d)}</p><p class="pt-p" style="margin-top:10px">In this education simulator, create a <strong>${esc(m.n)}</strong> from <strong>Cloud Shell</strong>:</p><pre class="pt-code">${esc(m.cli ?? '')}</pre><button class="pt-btn pt-primary" ${A('shell')}>Open Cloud Shell</button>` }; return this.render(); }
        case 'create': {
          const k = arg as WizKind;
          if (k in WIZ) return this.startWizard(k, this.view.page === 'rg' ? { rg: (this.view as { name: string }).name } : {});
          return this.go({ page: 'create' });
        }
        // wizard
        case 'wtab': this.wiz!.tab = Number(arg); this.wiz!.review = undefined; if (this.wiz!.tab === WIZ[this.wiz!.kind].tabs.length - 1) this.validate(); return this.render();
        case 'wnext': { const w = this.wiz!; w.tab = Math.min(w.tab + 1, WIZ[w.kind].tabs.length - 1); if (w.tab === WIZ[w.kind].tabs.length - 1) this.validate(); this.root.querySelector('.pt-wiz-body')?.scrollTo(0, 0); return this.render(); }
        case 'wprev': this.wiz!.tab = Math.max(0, this.wiz!.tab - 1); return this.render();
        case 'wreview': this.wiz!.tab = WIZ[this.wiz!.kind].tabs.length - 1; this.validate(); return this.render();
        case 'wcreate': return this.create();
        case 'newrg': { const n = prompt('Name of the new resource group:', `rg-${this.wiz!.kind}-lab`); if (n?.trim()) { this.wiz!.d.newRg = n.trim(); this.wiz!.d.rg = `__new__`; } return this.render(); }
        // resources
        case 'vm-power': { const r = this.cur()!; sim.powerVm(r.rg, r.name, arg as any, 'portal'); this.notify('ok', arg === 'deallocate' ? 'Stopped virtual machine' : `${arg[0].toUpperCase()}${arg.slice(1)}ed virtual machine`, arg === 'deallocate' ? `'${r.name}' is stopped (deallocated). Compute billing stopped; disks are still billed.` : `'${r.name}' ${arg === 'start' ? 'is running' : 'restarted'}.`); return; }
        case 'vm-os-stop': { const r = this.cur()!; sim.powerVm(r.rg, r.name, 'stop', 'portal'); this.pane = null; this.notify('info', 'Shut down from inside the OS', `'${r.name}' is Stopped but still ALLOCATED, so compute is still billed. Use Stop in the portal to deallocate.`); return; }
        case 'vm-resize': { const r = this.cur()!; const from = r.props.size; r.props.size = arg; sim.emit('vm.resize', { rg: r.rg, name: r.name, from, to: arg, via: 'portal' }); this.notify('ok', 'Resized virtual machine', `'${r.name}' was resized to ${arg}. The VM restarted.`); return; }
        case 'browse': { const r = this.cur()!; sim.emit('webapp.browse', { rg: r.rg, name: r.name, via: 'portal' }); this.pane = { kind: 'info', title: `https://${r.props.host}`, html: `<div style="text-align:center;padding:30px 10px"><p style="font-size:48px">🚀</p><p style="font-size:18px;font-weight:600">Your web app is running and waiting for your content</p><p class="pt-p">${esc(r.name)} · ${esc(r.props.runtime)} · App Service</p></div>` }; return this.render(); }
        case 'webapp-state': { const r = this.cur()!; r.props.state = arg; sim.emit(`webapp.${arg === 'Running' ? 'start' : 'stop'}`, { rg: r.rg, name: r.name, via: 'portal' }); this.notify('ok', `Web app ${arg === 'Running' ? 'started' : 'stopped'}`, `'${r.name}' is ${arg}.`); return; }
        case 'plan-sku': { const r = this.cur()!; const plan = r.type === 'plan' ? r : sim.find('plan', r.rg, r.props.plan); if (!plan) return; plan.props.sku = arg; sim.emit('plan.scale', { rg: plan.rg, name: plan.name, sku: arg, via: 'portal' }); this.notify('ok', 'Scaled up App Service plan', `'${plan.name}' is now ${PLAN_SKUS[arg].label}.`); return; }
        case 'del-res-go': { const r = this.cur()!; sim.deleteRes(r, 'portal'); this.pane = null; this.notify('ok', 'Deleted resource', `'${r.name}' was deleted.${r.type === 'vm' ? ' Its disk, network interface, public IP and NSG are still in the resource group, and the disk still costs money.' : ''}`); return this.go({ page: 'rg', name: r.rg }); }
        case 'del-rg-go': {
          const name = arg;
          const typed = (this.root.querySelector<HTMLInputElement>('#pa-del-confirm')?.value ?? '').trim();
          if (typed.toLowerCase() !== name.toLowerCase()) { this.notify('bad', 'Name did not match', 'Type the resource group name exactly to confirm. Nothing was deleted.'); return; }
          try { sim.deleteRg(name, 'portal'); } catch (err) { this.pane = null; this.fail(err); return; }
          this.pane = null;
          this.notify('ok', 'Deleted resource group', `'${name}' and everything inside it was deleted.`);
          return this.go({ page: 'rgs' });
        }
        case 'lock-del': { const v = this.view as { name: string }; sim.removeLock(v.name, arg, 'portal'); this.notify('ok', 'Lock deleted', `Lock '${arg}' removed.`); return; }
        case 'tag-del': {
          if (this.view.page === 'rg') { const g = sim.needRg(this.view.name); const t = { ...g.tags }; delete t[arg]; sim.tagRg(g.name, t, 'portal', true); }
          else { const r = this.cur()!; delete r.tags[arg]; sim.emit('res.tag', { rg: r.rg, name: r.name, via: 'portal' }); }
          return;
        }
        case 'container-del': { const r = this.cur()!; r.props.containers = (r.props.containers ?? []).filter((c: string) => c !== arg); sim.emit('storage.container.delete', { name: arg, via: 'portal' }); return; }
        case 'cp': return this.copilot(arg);
        case 'unsupported': this.notify('info', 'Not in this simulator', `${arg} is not simulated yet. Explore it in the lessons, or try Cloud Shell.`); return;
      }
    } catch (err) {
      this.fail(err);
    }
  }

  private openSvc(k: string) {
    const s = SVC.find((x) => x.k === k);
    if (!s) return;
    if (k === 'shell') return this.onShell?.();
    if (s.view) return this.go(s.view);
  }

  private onInput(e: Event) {
    const t = e.target as HTMLInputElement;
    if (t.id === 'pa-q') { this.q = t.value; this.searchOpen = true; this.renderDrop(); return; }
    if (t.id === 'pa-menu-q' || t.id === 'pa-list-q') { this.filterRows(t); return; }
    if (this.wiz && t.name) {
      this.wiz.d[t.name] = t.type === 'checkbox' ? (t.checked ? 'on' : '') : t.value;
      this.wiz.review = undefined;
      const hint = this.root.querySelector<HTMLElement>(`[data-hint="${t.name}"]`);
      if (hint) { const [ok, text] = this.liveHint(t.name, t.value); hint.textContent = text; hint.className = `pt-note ${ok ? 'pa-ok' : 'pa-bad'}`; }
    }
  }
  private onChange(e: Event) {
    const t = e.target as HTMLInputElement;
    if (this.wiz && t.name && (t.tagName === 'SELECT' || t.type === 'radio' || t.type === 'checkbox')) {
      this.wiz.d[t.name] = t.type === 'checkbox' ? (t.checked ? 'on' : '') : t.value;
      if (t.name === 'rg' && t.value !== '__new__') { const g = this.sim.rg(t.value); if (g && this.wiz.kind !== 'rg') this.wiz.d.region = g.location; }
      if (t.name === 'perf') this.wiz.d.sku = t.value === 'Premium' ? 'Premium_LRS' : 'Standard_GRS';
      if (t.name === 'image') this.wiz.d.port = IMAGES[t.value].os === 'Windows' ? '3389' : '22';
      this.render();
    }
  }
  private onKey(e: KeyboardEvent) {
    const t = e.target as HTMLElement;
    if (t.id === 'pa-q' && e.key === 'Enter') {
      const first = this.root.querySelector<HTMLElement>('.pa-drop [data-act]');
      first?.click();
    }
    if (t.id === 'pa-q' && e.key === 'Escape') { this.searchOpen = false; this.renderDrop(); }
  }
  private filterRows(t: HTMLInputElement) {
    const v = t.value.trim().toLowerCase();
    const scope = t.id === 'pa-menu-q' ? '.pt-menu .pt-mi' : '.pa-rows tbody tr';
    this.root.querySelectorAll<HTMLElement>(scope).forEach((el) => (el.hidden = !!v && !el.textContent!.toLowerCase().includes(v)));
  }

  private onSubmit(f: HTMLFormElement) {
    const d = Object.fromEntries(new FormData(f)) as Record<string, string>;
    const sim = this.sim;
    try {
      switch (f.dataset.form) {
        case 'lock': { const v = this.view as { name: string }; sim.addLock(v.name, d.name.trim(), d.level, 'portal'); this.notify('ok', 'Lock added', `'${d.name}' (${d.level === 'CanNotDelete' ? 'Delete' : 'Read-only'}) added to ${v.name}.`); return; }
        case 'tag': {
          if (!d.key?.trim()) return;
          if (this.view.page === 'rg') sim.tagRg(this.view.name, { [d.key.trim()]: d.value ?? '' }, 'portal');
          else { const r = this.cur()!; r.tags[d.key.trim()] = d.value ?? ''; sim.emit('res.tag', { rg: r.rg, name: r.name, tags: r.tags, via: 'portal' }); }
          this.notify('ok', 'Tags updated', `${d.key} : ${d.value}`);
          return;
        }
        case 'sku': { const r = this.cur()!; sim.updateStorageSku(r.rg, r.name, d.sku, 'portal'); this.notify('ok', 'Redundancy updated', `'${r.name}' now uses ${STORAGE_SKUS[d.sku].label}.`); return; }
        case 'scale': { const r = this.cur()!; sim.scaleVmss(r.rg, r.name, Math.max(0, Math.min(100, Number(d.count) || 0)), 'portal'); this.notify('ok', 'Scaled scale set', `'${r.name}' now has ${d.count} instance(s).`); return; }
        case 'container': { const r = this.cur()!; const n = d.name.trim().toLowerCase(); if (!/^[a-z0-9](?!.*--)[a-z0-9-]{1,61}[a-z0-9]$/.test(n)) { this.notify('bad', 'Invalid container name', 'Use 3–63 lowercase letters, numbers and hyphens, starting and ending with a letter or number.'); return; } r.props.containers = [...new Set([...(r.props.containers ?? []), n])]; sim.emit('storage.container.create', { name: n, via: 'portal' }); this.notify('ok', 'Container created', `'${n}' created.`); return; }
        case 'cp': return this.copilot(d.q ?? '');
      }
    } catch (err) {
      this.fail(err);
    }
  }

  /* ---------------- wizard logic ---------------- */
  private liveHint(name: string, value: string): [boolean, string] {
    const v = value.trim();
    if (!v) return [true, ''];
    if (name === 'name' && this.wiz?.kind === 'storage') { const p = this.sim.storageNameProblem(v); return [!p, p ?? `✓ https://${v}.blob.core.windows.net`]; }
    if (name === 'name' && this.wiz?.kind === 'webapp') { const p = this.sim.webappNameProblem(v); return [!p, p ?? `✓ https://${v.toLowerCase()}.azurewebsites.net`]; }
    if (name === 'name' && this.wiz?.kind === 'rg') { const exists = this.sim.rg(v); return [!exists && /^[-\w._()]+$/.test(v) && !v.endsWith('.'), exists ? 'A resource group with this name already exists.' : /^[-\w._()]+$/.test(v) && !v.endsWith('.') ? '✓' : 'Only letters, numbers, underscores, periods, hyphens and parentheses; cannot end in a period.'] }
    return [true, ''];
  }
  private rgOf(d: Record<string, string>) { return d.rg === '__new__' ? d.newRg : d.rg; }
  private validate() {
    const w = this.wiz!, d = w.d, errors: string[] = [];
    const rg = this.rgOf(d);
    if (w.kind !== 'rg' && !rg) errors.push('Resource group: select an existing resource group or create a new one.');
    if (!d.name?.trim()) errors.push(`${w.kind === 'rg' ? 'Resource group' : 'Name'}: this field is required.`);
    else {
      const [ok, text] = this.liveHint('name', d.name);
      if (!ok) errors.push(`Name: ${text}`);
      if (w.kind === 'storage' && !ok) this.sim.emit('storage.invalid', { name: d.name, problem: text, via: 'portal' });
    }
    w.review = { ok: !errors.length, errors };
  }
  private create() {
    const w = this.wiz!, d = w.d, sim = this.sim;
    this.validate();
    if (!w.review!.ok) return this.render();
    const rgName = this.rgOf(d);
    let target = '';
    let deployName = '';
    try {
      if (w.kind !== 'rg' && d.rg === '__new__' && !sim.rg(rgName)) sim.createRg(rgName, d.region, {}, 'portal');
      const tags = d.tagKey ? { [d.tagKey]: d.tagValue ?? '' } : {};
      if (w.kind === 'rg') { sim.createRg(d.name.trim(), d.region, tags, 'portal'); deployName = `ResourceGroup-${d.name}`; }
      if (w.kind === 'vm') {
        const vm = sim.createVm({ rg: rgName, name: d.name.trim(), image: d.image, size: d.size, location: d.region, zone: d.avail === 'zone' ? d.zone : '', admin: d.admin, ports: d.inbound === 'none' ? 'none' : d.port }, 'portal');
        Object.assign(vm.tags, tags); target = vm.id; deployName = `CreateVm-${d.image}-${Date.now().toString().slice(-8)}`;
      }
      if (w.kind === 'storage') { const st = sim.createStorage({ rg: rgName, name: d.name.trim(), location: d.region, sku: d.sku }, 'portal'); st.props.accessTier = d.tier; Object.assign(st.tags, tags); target = st.id; deployName = `Microsoft.StorageAccount-${Date.now().toString().slice(-8)}`; }
      if (w.kind === 'webapp') {
        const plan = sim.createPlan({ rg: rgName, name: `ASP-${rgName}-${d.name.trim()}`.slice(0, 40), sku: d.plansku, location: d.region }, 'portal');
        const app = sim.createWebapp({ rg: rgName, plan: plan.name, name: d.name.trim(), runtime: d.runtime }, 'portal');
        Object.assign(app.tags, tags); target = app.id; deployName = `Microsoft.Web-WebApp-Portal-${Date.now().toString().slice(-6)}`;
      }
      if (w.kind === 'vmss') { const s = sim.createVmss({ rg: rgName, name: d.name.trim(), image: d.image, count: Number(d.count) || 2, size: d.size }, 'portal'); target = s.id; deployName = `CreateVmss-${Date.now().toString().slice(-8)}`; }
    } catch (err) {
      w.review = { ok: false, errors: [err instanceof SimError ? err.message : String(err)] };
      return this.render();
    }
    const done = { page: 'deploy' as const, name: deployName, rg: w.kind === 'rg' ? d.name.trim() : rgName, target, done: false };
    this.wiz = null;
    this.notify('info', 'Deployment in progress…', `Deployment to resource group '${done.rg}' is in progress.`);
    this.go(done);
    window.setTimeout(() => {
      if (this.view.page === 'deploy' && this.view.name === done.name) { this.view = { ...done, done: true }; }
      this.notify('ok', 'Deployment succeeded', `Deployment '${done.name}' to resource group '${done.rg}' was successful.`);
    }, 1800);
  }

  /* ---------------- copilot ---------------- */
  private copilot(q: string) {
    const s = q.toLowerCase();
    const vms = this.sim.res.filter((r) => r.type === 'vm');
    let a = 'I can help with resource groups, VMs, storage, web apps, costs, locks and tags in this simulator. Try one of the suggestions.';
    if (/cost|bill|spend|expensive|price/.test(s)) {
      const top = [...this.sim.res].sort((x, y) => this.sim.hourly(y) - this.sim.hourly(x)).filter((r) => this.sim.hourly(r) > 0).slice(0, 3);
      a = top.length ? `Your estimated spend is **${money(this.sim.totalHourly() * 730)}/month**. Biggest: ${top.map((r) => `**${r.name}** (${money(this.sim.hourly(r) * 730)})`).join(', ')}. Stop (deallocate) VMs you aren’t using and check **Advisor**.` : 'Nothing is costing money right now. 🎉';
    } else if (/stop|running|deallocat/.test(s)) {
      const run = vms.filter((v) => v.props.power === 'running');
      const stoppedAlloc = vms.filter((v) => v.props.power === 'stopped');
      a = `${run.length ? `Running: ${run.map((v) => `**${v.name}**`).join(', ')}.` : 'No running VMs.'} ${stoppedAlloc.length ? `⚠️ ${stoppedAlloc.map((v) => `**${v.name}**`).join(', ')} ${stoppedAlloc.length > 1 ? 'are' : 'is'} stopped from inside the OS but still **allocated**, so still billed. Use **Stop** in the portal.` : ''}`;
    } else if (/vm|virtual machine/.test(s)) {
      a = 'To create a VM: **Create a resource → Virtual machine**. Pick a resource group, name, region, image and size, then **Review + create**. Opening the wizard for you now.';
      window.setTimeout(() => this.startWizard('vm'), 900);
    } else if (/storage|blob/.test(s)) {
      a = 'Storage account names must be **3–24 lowercase letters and numbers** and **globally unique**, because the name becomes part of a URL. Choose **redundancy** (LRS, ZRS, GRS, GZRS) on the Basics tab.';
    } else if (/lock|delete/.test(s)) {
      a = 'A **Delete** lock blocks deletion for everyone, even Owners; a **Read-only** lock blocks all changes. Add one in a resource group under **Settings → Locks**.';
    } else if (/tag/.test(s)) {
      a = 'Tags are **name : value** pairs (e.g. env : prod) used for cost reports and filtering. Open any resource or resource group → **Tags**.';
    } else if (/resource group|rg/.test(s)) {
      a = 'A **resource group** is a folder for resources that share a lifecycle. Delete the group and everything inside goes. Create one from **Resource groups → + Create**.';
    }
    this.pane = { kind: 'copilot', html: `<div class="pt-bub me">${esc(q)}</div><div class="pt-bub ai">${md(a)}</div>` };
    this.render();
  }

  /* ---------------- render ---------------- */
  render() {
    const active = document.activeElement as HTMLElement | null;
    const keepId = active && this.root.contains(active) ? active.id || (active as HTMLInputElement).name : '';
    const scroll = this.root.querySelector('.pa-scroll')?.scrollTop ?? 0;
    this.root.classList.toggle('pa-dark', this.dark);
    this.root.innerHTML = `${this.topbar()}
      ${this.eduHidden ? '' : `<div class="pa-edu" role="note"><span>🎓 <strong>Education-only simulation</strong> of the Azure portal. Not affiliated with or endorsed by Microsoft. Nothing here touches real Azure or costs money.</span><button ${A('edu-hide')} aria-label="Dismiss">✕</button></div>`}
      <div class="pt-body">${this.main()}${this.pane ? this.paneHtml() : ''}${this.menuOpen ? this.flyout() : ''}${this.toast ? `<div class="pt-toast pa-toast-${this.toast.kind}"><strong>${esc(this.toast.title)}</strong><br>${esc(this.toast.text)}</div>` : ''}</div>`;
    this.renderDrop();
    const sc = this.root.querySelector('.pa-scroll');
    if (sc && this.view.page !== 'deploy') sc.scrollTop = scroll;
    if (keepId) {
      const el = this.root.querySelector<HTMLInputElement>(`#${CSS.escape(keepId)}`) ?? this.root.querySelector<HTMLInputElement>(`[name="${CSS.escape(keepId)}"]`);
      if (el && el.tagName === 'INPUT' && el.type !== 'radio' && el.type !== 'checkbox') { el.focus(); const n = el.value.length; try { el.setSelectionRange(n, n); } catch {} }
    }
  }

  private topbar() {
    return `<div class="pt-top">
      <button class="pt-tb" ${A('menu')} aria-label="Portal menu" title="Show portal menu">☰</button>
      <button class="pt-brand" ${NAV({ page: 'home' })}>Microsoft Azure</button><span class="pt-sim" title="Education-only simulation">EDU SIMULATOR</span>
      <div class="pa-searchwrap"><label class="pt-search pa-search"><span aria-hidden="true">🔍</span><input id="pa-q" autocomplete="off" placeholder="Search resources, services, and docs (G+/)" value="${esc(this.q)}" aria-label="Search the portal"></label><div class="pa-drop" hidden></div></div>
      <button class="pt-copilot" ${A('pane', 'copilot')}><span aria-hidden="true">✨</span> Copilot</button>
      <span class="pt-tbs">
        <button class="pt-tb" ${A('shell')} title="Cloud Shell" aria-label="Cloud Shell">⌨️</button>
        <button class="pt-tb pa-bell" ${A('pane', 'notes')} title="Notifications" aria-label="Notifications">🔔${this.unread ? `<b class="pa-badge">${this.unread}</b>` : ''}</button>
        <button class="pt-tb" ${A('pane', 'settings')} title="Settings" aria-label="Settings">⚙️</button>
        <button class="pt-tb" ${A('unsupported', 'Help + support')} title="Help" aria-label="Help">？</button>
        <span class="pt-acct"><span class="pt-acct-n">learner@contoso.com</span><span class="pt-acct-d">DEFAULT DIRECTORY</span></span>
        <span class="pt-avatar">L</span>
      </span></div>`;
  }

  private renderDrop() {
    const box = this.root.querySelector<HTMLElement>('.pa-drop');
    if (!box) return;
    const q = this.q.trim().toLowerCase();
    if (!this.searchOpen || !q) { box.hidden = true; return; }
    const svcs = SVC.filter((s) => `${s.label} ${s.kw ?? ''}`.toLowerCase().includes(q)).slice(0, 6);
    const rgs = this.sim.rgs.filter((g) => g.name.toLowerCase().includes(q)).slice(0, 4);
    const res = this.sim.res.filter((r) => r.name.toLowerCase().includes(q)).slice(0, 6);
    const mk = MARKET.filter((m) => m.n.toLowerCase().includes(q)).slice(0, 3);
    const row = (act: string, html: string) => `<button class="pt-drop-r" ${act}>${html}</button>`;
    let h = '';
    if (svcs.length) h += `<p class="pt-drop-g">Services</p>${svcs.map((s) => row(A('svc', s.k), `${ico(s.icon, s.color, 'sm')}${esc(s.label)}`)).join('')}`;
    if (rgs.length || res.length) h += `<p class="pt-drop-g">Resources</p>${rgs.map((g) => row(A('rg', g.name), `${ico('📦', '#5c2d91', 'sm')}${esc(g.name)} <span class="pt-sub">Resource group</span>`)).join('')}${res.map((r) => row(A('res', r.id), `${typeIcon(r.type).replace('pt-ico', 'pt-ico sm')}${esc(r.name)} <span class="pt-sub">${esc(TYPE_INFO[r.type].label)}</span>`)).join('')}`;
    if (mk.length) h += `<p class="pt-drop-g">Marketplace</p>${mk.map((m) => row(A('market', m.n), `${ico('🛍️', '#0078d4', 'sm')}${esc(m.n)}`)).join('')}`;
    if (!h) h = `<p class="pt-p" style="padding:12px 14px">No results for “${esc(this.q)}”. Try “virtual”, “storage” or a resource name.</p>`;
    box.innerHTML = h;
    box.hidden = false;
  }

  private flyout() {
    const item = (k: string) => { const s = SVC.find((x) => x.k === k)!; return `<button class="pa-fly-i" ${A('svc', k)}>${ico(s.icon, s.color, 'sm')}${esc(s.label)}</button>`; };
    return `<nav class="pa-flyout" aria-label="Portal menu">
      ${item('create')}${item('home')}${item('dashboard')}<button class="pa-fly-i" ${NAV({ page: 'services' })}>${ico('☰', '#0078d4', 'sm')}All services</button>
      <p class="pa-fly-h">FAVORITES</p>
      ${['all', 'rgs', 'vm', 'storage', 'webapp', 'vnet', 'nsg', 'vmss', 'cost', 'monitor', 'advisor', 'entra', 'defender', 'policy', 'subs'].map(item).join('')}
    </nav>`;
  }

  private crumbs(c: [string, View | null][]) {
    return `<nav class="pt-crumbs"><button ${NAV({ page: 'home' })}>Home</button>${c.map(([t, v]) => `<span class="pt-sep">›</span>${v ? `<button ${NAV(v)}>${esc(t)}</button>` : `<span>${esc(t)}</span>`}`).join('')}</nav>`;
  }
  private title(icon: string, color: string, t: string, sub: string) {
    return `<div class="pt-title">${ico(icon, color, 'lg')}<div><h3>${esc(t)} <span class="pt-pin">☆ ⋯</span></h3><p class="pt-sub">${esc(sub)}</p></div></div>`;
  }
  private cmds(list: [string, string][]) {
    return `<div class="pt-cmds">${list.map(([label, act]) => `<button class="pt-cmd" ${act}>${esc(label)}</button>`).join('')}</div>`;
  }
  private table(cols: string[], rows: string[][], acts?: string[]) {
    if (!rows.length) return '';
    return `<div class="pt-tablewrap pa-rows"><table class="pt-table"><thead><tr><th class="pt-cb"><i></i></th>${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows
      .map((r, i) => `<tr><td class="pt-cb"><i></i></td>${r.map((c, j) => `<td>${j === 0 && acts?.[i] ? `<button class="pt-link" ${acts[i]}>${c}</button>` : c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  private status(s: string) {
    const k = /running|succeeded|available|enabled|connected|ready|online/i.test(s) ? 'ok' : /stopped|deallocated|failed|disabled/i.test(s) ? 'bad' : 'warn';
    return `<span class="pt-dot ${k}"></span>${esc(s)}`;
  }

  private main(): string {
    const v = this.view;
    switch (v.page) {
      case 'home': return this.home();
      case 'services': return this.services();
      case 'create': return this.market();
      case 'dashboard': return this.dashboard();
      case 'rgs': return this.rgList();
      case 'all': return this.resList(null);
      case 'list': return this.resList(v.type);
      case 'wizard': return this.wiz ? this.wizard() : this.home();
      case 'deploy': return this.deploy(v);
      case 'rg': return this.sim.rg(v.name) ? this.rgBlade(v.name, v.tab ?? 'Overview') : this.gone();
      case 'res': { const r = this.sim.res.find((x) => x.id === v.id); return r ? this.resBlade(r, v.tab ?? 'Overview') : this.gone(); }
      case 'cost': return this.cost();
      case 'subs': return this.subs();
      case 'advisor': return this.advisor();
      default: return this.infoPage(v.page);
    }
  }
  private gone() {
    return `<div class="pt-page pa-scroll"><div class="pt-empty">${ico('🗑️', '#c50f1f', 'xl')}<p class="pt-empty-h">This resource no longer exists</p><p class="pt-p">It may have been deleted (perhaps from Cloud Shell).</p><button class="pt-btn pt-primary" ${NAV({ page: 'home' })}>Go home</button></div></div>`;
  }

  private home() {
    const svcs = ['create', 'vm', 'rgs', 'storage', 'webapp', 'vnet', 'cost', 'monitor', 'advisor', 'services'];
    const recent = [...this.sim.res].sort((a, b) => b.created - a.created).slice(0, 6);
    return `<div class="pt-page pt-home pa-scroll">
      <p class="pt-h2">Azure services</p>
      <div class="pt-svcs">${svcs.map((k) => k === 'services' ? `<button class="pt-svc" ${NAV({ page: 'services' })}>${ico('→', '#0078d4', 'lg')}<span>More services</span></button>` : (() => { const s = SVC.find((x) => x.k === k)!; return `<button class="pt-svc" ${A('svc', k)}>${ico(s.icon, s.color, 'lg')}<span>${esc(s.label)}</span></button>`; })()).join('')}</div>
      <p class="pt-h2">Resources</p>
      <div class="pt-tabs-s"><span class="on">Recent</span><span>Favorite</span></div>
      ${recent.length ? this.table(['Name', 'Type', 'Last viewed'], recent.map((r) => [esc(r.name), esc(TYPE_INFO[r.type].label), ago(r.created)]), recent.map((r) => A('res', r.id)))
        : `<div class="pt-empty" style="padding:24px 0">${ico('📦', '#5c2d91', 'xl')}<p class="pt-empty-h">No resources to display</p><p class="pt-p">Create a resource group, then a VM or storage account. Everything here is simulated and free.</p><button class="pt-btn pt-primary" ${NAV({ page: 'create' })}>Create a resource</button></div>`}
      <p class="pt-h2">Navigate</p>
      <div class="pt-navs">${['subs', 'rgs', 'all', 'dashboard'].map((k) => { const s = SVC.find((x) => x.k === k)!; return `<button class="pt-nav" ${A('svc', k)}>${ico(s.icon, s.color, 'sm')}${esc(s.label)}</button>`; }).join('')}</div>
      <p class="pt-h2">Tools</p>
      <div class="pt-navs">${['monitor', 'defender', 'cost', 'advisor'].map((k) => { const s = SVC.find((x) => x.k === k)!; return `<button class="pt-nav" ${A('svc', k)}>${ico(s.icon, s.color, 'sm')}${esc(s.label)}</button>`; }).join('')}<button class="pt-nav" ${A('shell')}>${ico('⌨️', '#1b1a19', 'sm')}Cloud Shell</button></div>
    </div>`;
  }

  private services() {
    const cats = [...new Set(SVC.map((s) => s.cat))];
    return `<div class="pt-page pa-scroll">${this.crumbs([['All services', null]])}${this.title('☰', '#0078d4', 'All services', 'Browse every service in this simulator')}
      <label class="pt-filter" style="display:inline-flex;gap:6px;margin-bottom:10px">🔍<input id="pa-list-q" class="pa-inline" placeholder="Filter services"></label>
      <div class="pa-cats">${cats.map((c) => `<section><p class="pt-sec-h">${esc(c)}</p>${SVC.filter((s) => s.cat === c).map((s) => `<button class="pt-nav pa-svc-row" ${A('svc', s.k)}>${ico(s.icon, s.color, 'sm')}${esc(s.label)}</button>`).join('')}</section>`).join('')}</div></div>`;
  }

  private market() {
    return `<div class="pt-page pa-scroll">${this.crumbs([['Create a resource', null]])}${this.title('＋', '#0f6cbd', 'Create a resource', 'Marketplace')}
      <div class="pt-mkt">${MARKET.map((m) => `<div class="pt-mkt-i">${ico(m.icon, '#0078d4', 'lg')}<div><p class="pt-mkt-n">${esc(m.n)}</p><p class="pt-mkt-b">Microsoft | Azure Service</p><p class="pt-mkt-d">${esc(m.d)}</p><button class="pt-link" ${A('market', m.n)}>Create</button></div></div>`).join('')}</div></div>`;
  }

  private dashboard() {
    const vms = this.sim.res.filter((r) => r.type === 'vm');
    const run = vms.filter((v) => v.props.power === 'running').length;
    return `<div class="pt-page pa-scroll">${this.title('▤', '#0078d4', 'My Dashboard', 'Private dashboard')}
      ${this.cmds([['+ Create', A('unsupported', 'Custom dashboards')], ['Refresh', NAV({ page: 'dashboard' })], ['Edit', A('unsupported', 'Dashboard editing')], ['Share', A('unsupported', 'Dashboard sharing')]])}
      <div class="pt-cards">
        <button class="pt-card pt-kpi info" ${NAV({ page: 'all' })}><p class="pt-card-h">All resources</p><p class="pt-kpi-v">${this.sim.res.length}</p><p class="pt-kpi-s">${this.sim.rgs.length} resource groups</p></button>
        <button class="pt-card pt-kpi ${run ? 'warn' : 'ok'}" ${NAV({ page: 'list', type: 'vm' })}><p class="pt-card-h">Virtual machines</p><p class="pt-kpi-v">${run} running</p><p class="pt-kpi-s">${vms.length - run} stopped</p></button>
        <button class="pt-card pt-kpi" ${NAV({ page: 'cost' })}><p class="pt-card-h">Estimated cost</p><p class="pt-kpi-v">${money(this.sim.totalHourly() * 730)}</p><p class="pt-kpi-s">per month at current usage</p></button>
        <div class="pt-card pt-kpi ok"><p class="pt-card-h">Service Health</p><p class="pt-kpi-v">No issues</p><p class="pt-kpi-s">in your regions</p></div>
      </div></div>`;
  }

  private rgList() {
    const rows = this.sim.rgs.map((g) => [esc(g.name), esc(SUB_NAME), esc(regionLabel(g.location)), String(this.sim.inRg(g.name).length)]);
    return `<div class="pt-page pa-scroll">${this.crumbs([['Resource groups', null]])}${this.title('📦', '#5c2d91', 'Resource groups', 'Default Directory')}
      ${this.cmds([['+ Create', A('create', 'rg')], ['Manage view', A('unsupported', 'Manage view')], ['Refresh', NAV({ page: 'rgs' })], ['Export to CSV', A('unsupported', 'Export to CSV')], ['Assign tags', A('unsupported', 'Bulk tagging')]])}
      <div class="pt-filters"><label class="pt-filter">🔍 <input id="pa-list-q" class="pa-inline" placeholder="Filter for any field..."></label><span class="pt-filter">Subscription equals <b>all</b></span><span class="pt-filter">Location equals <b>all</b> ×</span><span class="pt-filter pt-add">+ Add filter</span></div>
      <p class="pt-count">Showing ${rows.length} of ${rows.length} records.</p>
      ${rows.length ? this.table(['Name', 'Subscription', 'Location', 'Resources'], rows, this.sim.rgs.map((g) => A('rg', g.name))) : this.empty('📦', '#5c2d91', 'No resource groups to display', 'Resource groups hold related resources. Create your first one.', A('create', 'rg'))}
    </div>`;
  }
  private empty(icon: string, color: string, h: string, p: string, act: string) {
    return `<div class="pt-empty">${ico(icon, color, 'xl')}<p class="pt-empty-h">${esc(h)}</p><p class="pt-p">${esc(p)}</p><button class="pt-btn pt-primary" ${act}>+ Create</button></div>`;
  }

  private resList(type: ResType | null) {
    const list = this.sim.res.filter((r) => !type || r.type === type);
    const s = type ? svcFor(type) : SVC.find((x) => x.k === 'all')!;
    const label = s?.label ?? (type ? TYPE_INFO[type].label : 'All resources');
    const creatable: Partial<Record<ResType, WizKind>> = { vm: 'vm', storage: 'storage', webapp: 'webapp', vmss: 'vmss' };
    const mk = type ? MARKET.find((m) => m.n.toLowerCase().startsWith(label.toLowerCase().slice(0, 6))) : undefined;
    const createAct = type && creatable[type] ? A('create', creatable[type]) : mk ? A('market', mk.n) : NAV({ page: 'create' });
    const extra = (r: Res) => r.type === 'vm' ? this.status(r.props.power === 'running' ? 'Running' : r.props.power === 'stopped' ? 'Stopped' : 'Stopped (deallocated)') : r.type === 'webapp' ? this.status(r.props.state ?? 'Running') : r.type === 'vmss' ? `${r.props.capacity} instances` : r.type === 'storage' ? esc(r.props.sku) : '';
    const rows = list.map((r) => [esc(r.name), esc(TYPE_INFO[r.type].label), `<button class="pt-link" ${A('rg', r.rg)}>${esc(r.rg)}</button>`, esc(regionLabel(r.location)), extra(r)]);
    return `<div class="pt-page pa-scroll">${this.crumbs([[label, null]])}${this.title(s?.icon ?? '▦', s?.color ?? '#0078d4', label, 'Default Directory')}
      ${this.cmds([['+ Create', createAct], ['Manage view', A('unsupported', 'Manage view')], ['Refresh', NAV(this.view)], ['Export to CSV', A('unsupported', 'Export to CSV')], ['Open query', A('unsupported', 'Resource Graph queries')]])}
      <div class="pt-filters"><label class="pt-filter">🔍 <input id="pa-list-q" class="pa-inline" placeholder="Filter for any field..."></label><span class="pt-filter">Subscription equals <b>all</b></span><span class="pt-filter">Resource group equals <b>all</b> ×</span><span class="pt-filter pt-add">+ Add filter</span></div>
      <p class="pt-count">Showing ${rows.length} of ${rows.length} records.</p>
      ${rows.length ? this.table(['Name', 'Type', 'Resource group', 'Location', type === 'vm' || type === 'webapp' ? 'Status' : type === 'storage' ? 'Replication' : type === 'vmss' ? 'Instances' : ''], rows, list.map((r) => A('res', r.id))) : this.empty(s?.icon ?? '▦', s?.color ?? '#0078d4', `No ${label.toLowerCase()} to display`, 'Create one, or try Cloud Shell.', createAct)}
    </div>`;
  }

  /* ---------------- wizard ---------------- */
  private f(label: string, ctl: string, opts: { req?: boolean; note?: string; hint?: string } = {}) {
    return `<div class="pt-field"><span class="pt-label">${esc(label)}${opts.req ? '<b class="pt-req"> *</b>' : ''} <span class="pt-info" title="More information">ⓘ</span></span><span class="pt-ctl">${ctl}${opts.hint ? `<span class="pt-note" data-hint="${opts.hint}"></span>` : ''}${opts.note ? `<span class="pt-note">${md(opts.note)}</span>` : ''}</span></div>`;
  }
  private sel(name: string, options: [string, string][], value: string) {
    return `<select class="pa-in" name="${name}">${options.map(([v, l]) => `<option value="${esc(v)}" ${v === value ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  }
  private txt(name: string, value = '', ph = '') { return `<input class="pa-in" name="${name}" value="${esc(value)}" placeholder="${esc(ph)}" autocomplete="off" spellcheck="false">`; }
  private radios(name: string, options: [string, string][], value: string) {
    return `<span class="pt-radios">${options.map(([v, l]) => `<label class="pa-radio"><input type="radio" name="${name}" value="${esc(v)}" ${v === value ? 'checked' : ''}> ${esc(l)}</label>`).join('')}</span>`;
  }
  private g(h: string, body: string, p = '') { return `<section class="pt-group"><h4>${esc(h)}</h4>${p ? `<p class="pt-p">${md(p)}</p>` : ''}${body}</section>`; }
  private projGroup(d: Record<string, string>) {
    const opts: [string, string][] = [['', 'Select a resource group'], ...this.sim.rgs.map((g) => [g.name, g.name] as [string, string])];
    if (d.newRg) opts.push(['__new__', `(New) ${d.newRg}`]);
    return this.g('Project details', this.f('Subscription', this.sel('sub', [[SUB_ID, SUB_NAME]], SUB_ID), { req: true }) +
      this.f('Resource group', `${this.sel('rg', opts, d.rg)}<button class="pt-link pa-small" ${A('newrg')}>Create new</button>`, { req: true }),
      'Select the subscription to manage deployed resources and costs. Use resource groups like folders to organize and manage all your resources.');
  }
  private regionSel(d: Record<string, string>) { return this.sel('region', Object.entries(REGIONS).map(([k, l]) => [k, `(${['eastus', 'westus2', 'brazilsouth'].includes(k) ? (k === 'brazilsouth' ? 'South America' : 'US') : ['uksouth', 'northeurope', 'westeurope'].includes(k) ? 'Europe' : k === 'australiaeast' ? 'Asia Pacific' : 'Asia Pacific'}) ${l}`]), d.region); }
  private tagsTab(d: Record<string, string>) {
    return this.g('Tags', `<div class="pa-tagrow">${this.txt('tagKey', d.tagKey, 'Name')}<span>:</span>${this.txt('tagValue', d.tagValue, 'Value')}</div>`, 'Tags are name/value pairs that enable you to categorize resources and view consolidated billing by applying the same tag to multiple resources and resource groups.');
  }
  private vmHourly(d: Record<string, string>) { return VM_SIZES[d.size]?.hr * (IMAGES[d.image]?.os === 'Windows' ? 1.4 : 1); }

  private wizBody(w: Wiz): string {
    const d = w.d, tab = WIZ[w.kind].tabs[w.tab];
    if (tab === 'Review + create') return this.reviewBody(w);
    if (tab === 'Tags') return this.tagsTab(d);
    switch (w.kind) {
      case 'rg':
        return this.g('Project details', this.f('Subscription', this.sel('sub', [[SUB_ID, SUB_NAME]], SUB_ID), { req: true }) + this.f('Resource group', this.txt('name', d.name, 'e.g. rg-learn'), { req: true, hint: 'name' })) +
          this.g('Resource details', this.f('Region', this.regionSel(d), { req: true, note: 'Where the group’s **metadata** is stored. Resources inside can be in any region.' }));
      case 'vm': {
        if (tab === 'Basics') {
          const sizes = Object.entries(VM_SIZES).map(([k, s]) => [k, `${k} - ${s.cpu} vcpu${s.cpu > 1 ? 's' : ''}, ${s.ram} GiB memory (${money(s.hr * (IMAGES[d.image]?.os === 'Windows' ? 1.4 : 1) * 730)}/month)`] as [string, string]);
          return this.projGroup(d) +
            this.g('Instance details', this.f('Virtual machine name', this.txt('name', d.name, 'e.g. web01'), { req: true }) + this.f('Region', this.regionSel(d), { req: true }) +
              this.f('Availability options', this.sel('avail', [['none', 'No infrastructure redundancy required'], ['zone', 'Availability zone']], d.avail), { note: d.avail === 'zone' ? '' : 'One VM in one place. If that datacenter fails, the VM is down. Choose **Availability zone** for resilience.' }) +
              (d.avail === 'zone' ? this.f('Availability zone', this.sel('zone', [['1', 'Zone 1'], ['2', 'Zone 2'], ['3', 'Zone 3']], d.zone), { req: true }) : '') +
              this.f('Security type', this.sel('sec', [['tl', 'Trusted launch virtual machines'], ['std', 'Standard']], d.sec ?? 'tl')) +
              this.f('Image', this.sel('image', Object.entries(IMAGES).map(([k, i]) => [k, `${i.label} - x64 Gen2`]), d.image), { req: true }) +
              this.f('Size', this.sel('size', sizes, d.size), { req: true, note: `💰 ${money(this.vmHourly(d) * 730)} per month (${money(this.vmHourly(d))}/hour) while running. See all sizes.` })) +
            this.g('Administrator account', this.f('Authentication type', this.radios('auth', [['ssh', 'SSH public key'], ['password', 'Password']], d.auth)) + this.f('Username', this.txt('admin', d.admin), { req: true })) +
            this.g('Inbound port rules', this.f('Public inbound ports', this.radios('inbound', [['none', 'None'], ['allow', 'Allow selected ports']], d.inbound), { req: true }) +
              (d.inbound === 'allow' ? this.f('Select inbound ports', this.sel('port', [['22', 'SSH (22)'], ['3389', 'RDP (3389)'], ['80', 'HTTP (80)'], ['443', 'HTTPS (443)']], d.port), { req: true, note: d.port === '22' || d.port === '3389' ? '⚠️ This will allow all IP addresses to access your virtual machine. This is only recommended for testing.' : '' }) : ''));
        }
        if (tab === 'Disks') return this.g('OS disk', this.f('OS disk size', this.sel('osdisksize', [['default', `Image default (${IMAGES[d.image]?.os === 'Windows' ? 127 : 30} GiB)`]], 'default')) + this.f('OS disk type', this.sel('osdisk', [['Premium SSD (locally-redundant storage)', 'Premium SSD (locally-redundant storage)'], ['Standard SSD (locally-redundant storage)', 'Standard SSD (locally-redundant storage)'], ['Standard HDD (locally-redundant storage)', 'Standard HDD (locally-redundant storage)']], d.osdisk), { req: true, note: 'Disks are billed even when the VM is stopped.' })) + this.g('Data disks', '', 'You can add and configure additional data disks for your virtual machine.');
        if (tab === 'Networking') return this.g('Network interface', this.f('Virtual network', this.sel('vnet', [['new', `(new) ${d.name || 'vm'}VNET`]], 'new'), { req: true }) + this.f('Subnet', this.sel('subnet', [['default', '(new) default (10.0.0.0/24)']], 'default'), { req: true }) + this.f('Public IP', this.sel('pip', [['new', `(new) ${d.name || 'vm'}PublicIP`]], 'new')) + this.f('NIC network security group', this.radios('nsgmode', [['basic', 'Basic'], ['advanced', 'Advanced']], 'basic')) + this.f('Public inbound ports', this.radios('inbound', [['none', 'None'], ['allow', 'Allow selected ports']], d.inbound)), 'Define network connectivity for your virtual machine by configuring network interface card (NIC) settings.');
        if (tab === 'Management') return this.g('Auto-shutdown', this.f('Enable auto-shutdown', `<label class="pa-radio"><input type="checkbox" name="shutdown" ${d.shutdown ? 'checked' : ''}> Shut down every day at 19:00</label>`, { note: '💡 Auto-shutdown avoids paying for test VMs overnight.' }));
        return this.g(tab, `<p class="pt-p">Defaults are fine for this lab. Select <strong>Review + create</strong> when ready.</p>`);
      }
      case 'storage': {
        if (tab === 'Basics') {
          const skus = Object.entries(STORAGE_SKUS).filter(([k]) => (d.perf === 'Premium') === k.startsWith('Premium')).map(([k, s]) => [k, s.label] as [string, string]);
          return this.projGroup(d) + this.g('Instance details', this.f('Storage account name', this.txt('name', d.name, 'e.g. stlearn2026'), { req: true, hint: 'name', note: '3–24 characters, **lowercase letters and numbers** only, globally unique.' }) + this.f('Region', this.regionSel(d), { req: true }) +
            this.f('Performance', this.radios('perf', [['Standard', 'Standard: Recommended for most scenarios'], ['Premium', 'Premium: low latency']], d.perf), { req: true }) + this.f('Redundancy', this.sel('sku', skus, d.sku), { req: true }));
        }
        if (tab === 'Advanced') return this.g('Security', this.f('Require secure transfer for REST API operations', '<label class="pa-radio"><input type="checkbox" checked disabled> Enabled</label>') + this.f('Minimum TLS version', this.sel('tls', [['1.2', 'Version 1.2']], '1.2'))) + this.g('Blob storage', this.f('Access tier', this.radios('tier', [['Hot', 'Hot: frequently accessed data'], ['Cool', 'Cool: infrequently accessed data'], ['Cold', 'Cold: rarely accessed data']], d.tier)));
        if (tab === 'Networking') return this.g('Network connectivity', this.f('Public network access', this.radios('netaccess', [['all', 'Enable from all networks'], ['selected', 'Enable from selected virtual networks and IP addresses'], ['off', 'Disable']], d.netaccess ?? 'all')));
        return this.g(tab, `<p class="pt-p">Defaults are fine for this lab.</p>`);
      }
      case 'webapp': {
        if (tab === 'Basics') return this.projGroup(d) + this.g('Instance Details', this.f('Name', this.txt('name', d.name, 'e.g. contoso-shop-123'), { req: true, hint: 'name', note: 'Becomes https://&lt;name&gt;.azurewebsites.net, so it must be globally unique.' }) + this.f('Publish', this.radios('publish', [['Code', 'Code'], ['Container', 'Container']], d.publish), { req: true }) + this.f('Runtime stack', this.sel('runtime', RUNTIMES.map((r) => [r, r.replace(':', ' ')]), d.runtime), { req: true }) + this.f('Operating System', this.radios('os', [['Linux', 'Linux'], ['Windows', 'Windows']], d.os), { req: true }) + this.f('Region', this.regionSel(d), { req: true })) +
          this.g('Pricing plans', this.f('Pricing plan', this.sel('plansku', Object.entries(PLAN_SKUS).map(([k, p]) => [k, `${p.label} · ${money(p.hr * 730)}/month`]), d.plansku), { req: true }), 'App Service plan pricing tier determines the location, features, cost and compute resources associated with your app.');
        if (tab === 'Deployment') return this.g('Continuous deployment', this.f('Continuous deployment', this.radios('cd', [['off', 'Disable'], ['on', 'Enable']], d.cd ?? 'off'), { note: 'Connect GitHub so every push deploys automatically.' }));
        return this.g(tab, `<p class="pt-p">Defaults are fine for this lab.</p>`);
      }
      case 'vmss': {
        if (tab === 'Basics') return this.projGroup(d) + this.g('Scale set details', this.f('Virtual machine scale set name', this.txt('name', d.name, 'e.g. shop-web'), { req: true }) + this.f('Orchestration mode', this.radios('orch', [['Flexible', 'Flexible'], ['Uniform', 'Uniform']], d.orch ?? 'Flexible'))) + this.g('Instance details', this.f('Image', this.sel('image', Object.entries(IMAGES).map(([k, i]) => [k, i.label]), d.image), { req: true }) + this.f('Size', this.sel('size', Object.entries(VM_SIZES).map(([k, s]) => [k, `${k} (${money(s.hr * 730)}/month each)`]), d.size), { req: true }));
        if (tab === 'Scaling') return this.g('Scaling', this.f('Initial instance count', this.txt('count', d.count), { req: true }) + this.f('Scaling policy', this.radios('policy', [['manual', 'Manual'], ['auto', 'Autoscaling']], d.policy ?? 'manual')));
        return this.g(tab, `<p class="pt-p">Defaults are fine for this lab.</p>`);
      }
    }
  }
  private reviewBody(w: Wiz) {
    const d = w.d, r = w.review ?? { ok: true, errors: [] };
    const rows: [string, string][] = [['Subscription', SUB_NAME], ...(w.kind === 'rg' ? [] : [['Resource group', this.rgOf(d) || '—'] as [string, string]]), ['Region', regionLabel(d.region ?? this.sim.rg(this.rgOf(d))?.location ?? '')]];
    let price = '';
    if (w.kind === 'rg') rows.unshift(['Resource group', d.name || '—']);
    if (w.kind === 'vm') { rows.push(['Virtual machine name', d.name || '—'], ['Availability', d.avail === 'zone' ? `Zone ${d.zone}` : 'No infrastructure redundancy'], ['Image', IMAGES[d.image].label], ['Size', d.size], ['Inbound ports', d.inbound === 'none' ? 'None' : d.port], ['Auto-shutdown', d.shutdown ? 'On, 19:00' : 'Off']); price = `1 X ${d.size} by Microsoft · <strong>${money(this.vmHourly(d))}/hr</strong> (≈ ${money(this.vmHourly(d) * 730)}/month)`; }
    if (w.kind === 'storage') { rows.push(['Storage account name', d.name || '—'], ['Performance', d.perf], ['Replication', STORAGE_SKUS[d.sku].label], ['Access tier', d.tier]); }
    if (w.kind === 'webapp') { rows.push(['Name', d.name || '—'], ['Runtime stack', d.runtime], ['Operating System', d.os], ['Pricing plan', PLAN_SKUS[d.plansku].label]); price = `${PLAN_SKUS[d.plansku].label} · <strong>${money(PLAN_SKUS[d.plansku].hr * 730)}/month</strong>`; }
    if (w.kind === 'vmss') { rows.push(['Name', d.name || '—'], ['Image', IMAGES[d.image].label], ['Size', d.size], ['Instances', d.count]); price = `${d.count} X ${d.size} · <strong>${money(VM_SIZES[d.size].hr * (Number(d.count) || 0) * 730)}/month</strong>`; }
    if (d.tagKey) rows.push(['Tags', `${d.tagKey} : ${d.tagValue ?? ''}`]);
    return `${r.ok ? '<div class="pt-note-bar ok">✔ Validation passed</div>' : `<div class="pt-note-bar bad"><strong>✖ Validation failed.</strong> Required information is missing or not valid.<ul class="pa-errs">${r.errors.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>`}
      ${price ? this.g('Price', `<p>${price}</p>`) : ''}
      ${this.g('Basics', rows.map(([k, v]) => `<div class="pt-field"><span class="pt-label">${esc(k)}</span><span class="pt-ro">${esc(v)}</span></div>`).join(''))}`;
  }
  private wizard() {
    const w = this.wiz!, meta = WIZ[w.kind], last = w.tab === meta.tabs.length - 1;
    const crumbLabel = w.kind === 'rg' ? 'Resource groups' : svcFor(w.kind as ResType)?.label ?? '';
    return `<div class="pt-page pt-wiz">${this.crumbs([[crumbLabel, meta.crumb], [meta.title, null]])}
      <div class="pt-title"><div><h3>${esc(meta.title)} <span class="pt-pin">⋯</span></h3></div></div>
      <div class="pt-tabs" role="tablist">${meta.tabs.map((t, i) => `<button class="pt-tab ${i === w.tab ? 'on' : ''}" role="tab" aria-selected="${i === w.tab}" ${A('wtab', String(i))}>${esc(t)}${w.review && !w.review.ok && i === 0 && !last ? ' <span class="pa-bad">●</span>' : ''}</button>`).join('')}</div>
      <div class="pt-wiz-body pa-scroll">${this.wizBody(w)}</div>
      <div class="pt-wiz-foot">
        ${last ? `<button class="pt-btn pt-primary" ${A('wcreate')} ${w.review?.ok ? '' : 'disabled'}>Create</button>` : `<button class="pt-btn pt-primary" ${A('wreview')}>Review + create</button>`}
        <button class="pt-btn" ${A('wprev')} ${w.tab === 0 ? 'disabled' : ''}>&lt; Previous</button>
        <button class="pt-btn" ${A('wnext')} ${last ? 'disabled' : ''}>Next${last ? '' : ` : ${esc(meta.tabs[w.tab + 1])}`} &gt;</button>
        ${last ? '<span class="pt-dl">Download a template for automation</span>' : ''}
      </div></div>`;
  }

  private deploy(v: Extract<View, { page: 'deploy' }>) {
    return `<div class="pt-page pa-scroll">${this.crumbs([[v.name, null]])}${this.title('🚀', '#0078d4', `${v.name} | Overview`, 'Deployment')}
      ${this.cmds([['Delete', A('unsupported', 'Deleting deployment records')], ['Cancel', A('unsupported', 'Cancel')], ['Redeploy', A('unsupported', 'Redeploy')], ['Refresh', NAV(v)]])}
      <div class="pt-deploy"><div class="pt-deploy-h">${v.done ? '<span class="pt-big ok">✔</span><span>Your deployment is complete</span>' : '<span class="pt-spinner"></span><span>Deployment is in progress</span>'}</div>
        <dl class="pt-ess"><dt>Deployment name</dt><dd>${esc(v.name)}</dd><dt>Subscription</dt><dd>${esc(SUB_NAME)}</dd><dt>Resource group</dt><dd><button class="pt-link" ${A('rg', v.rg)}>${esc(v.rg)}</button></dd><dt>Start time</dt><dd>${new Date().toLocaleString()}</dd></dl>
        ${v.done ? `<p class="pt-sec-h">Next steps</p><button class="pt-btn pt-primary" ${v.target ? A('res', v.target) : A('rg', v.rg)}>Go to resource${v.target ? '' : ' group'}</button>` : '<p class="pt-p">Azure Resource Manager is creating your resources. You can leave this page; a notification tells you when it finishes.</p>'}
      </div></div>`;
  }

  /* ---------------- blades ---------------- */
  private blade(icon: string, color: string, crumbs: [string, View | null][], title: string, sub: string, menu: (string | [string, string[]])[], active: string, body: string) {
    const mi = (m: string, inner = false) => `<button class="pt-mi ${inner ? 'pt-mi-in' : ''} ${m === active ? 'on' : ''}" ${A('blade', m)}>${esc(m)}</button>`;
    return `<div class="pt-page pt-res">${this.crumbs(crumbs)}
      <div class="pt-title">${ico(icon, color, 'lg')}<div><h3>${esc(active === 'Overview' ? title : `${title} | ${active}`)} <span class="pt-pin">☆ ⋯</span></h3><p class="pt-sub">${esc(sub)}</p></div></div>
      <div class="pt-res-grid"><aside class="pt-menu"><label class="pt-menu-s">🔍 <input id="pa-menu-q" class="pa-inline" placeholder="Search"></label>${menu.map((m) => typeof m === 'string' ? mi(m) : `<p class="pt-mg">⌄ ${esc(m[0])}</p>${m[1].map((x) => mi(x, true)).join('')}`).join('')}</aside>
      <div class="pt-res-main pa-scroll">${body}</div></div></div>`;
  }
  private ess(rows: [string, string][]) {
    return `<p class="pt-sec-h pt-ess-h">⌄ Essentials <button class="pt-json pt-link" ${A('pane', 'json')}>JSON View</button></p><dl class="pt-ess pt-ess2">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('')}</dl>`;
  }
  private activity(filter: (d: Record<string, any>) => boolean) {
    const ev = this.sim.events.filter((e) => !['view', 'cli'].includes(e.type) && filter(e.data)).slice(-30).reverse();
    return ev.length ? this.table(['Operation name', 'Status', 'Time', 'Event initiated by'], ev.map((e) => [esc(e.type.replace('.', ' · ')), this.status(/blocked|invalid/.test(e.type) ? 'Failed' : 'Succeeded'), new Date(e.at).toLocaleTimeString(), e.data.via === 'cli' ? 'learner@contoso.com (Cloud Shell)' : 'learner@contoso.com'])) : '<p class="pt-p">No activity yet.</p>';
  }
  private iam() {
    return `${this.cmds([['+ Add', A('unsupported', 'Role assignments')], ['Download role assignments', A('unsupported', 'Download')], ['Refresh', NAV(this.view)]])}
      <div class="pt-tabs-s"><span>Check access</span><span class="on">Role assignments</span><span>Roles</span><span>Deny assignments</span></div>
      ${this.table(['Name', 'Type', 'Role', 'Scope'], [['Learner', 'User', 'Owner', 'Subscription (Inherited)'], ['Ana Silva', 'User', 'Reader', 'Subscription (Inherited)']])}
      <div class="pt-note-bar info">Role assignments are inherited downward: subscription → resource group → resource. Practise this in the RBAC lesson walkthrough.</div>`;
  }
  private tagsBody(tags: Record<string, string>) {
    return `<p class="pt-p">Tags are name/value pairs that enable you to categorize resources and view consolidated billing.</p>
      <form data-form="tag" class="pa-tagrow"><input class="pa-in" name="key" placeholder="Name" required><span>:</span><input class="pa-in" name="value" placeholder="Value"><button class="pt-btn pt-primary">Add</button></form>
      ${Object.keys(tags).length ? this.table(['Name', 'Value', ''], Object.entries(tags).map(([k, v]) => [esc(k), esc(v), `<button class="pt-link" ${A('tag-del', k)}>Delete</button>`])) : '<p class="pt-p" style="margin-top:10px">No tags yet.</p>'}`;
  }

  private rgBlade(name: string, tab: string) {
    const g = this.sim.rg(name)!;
    const res = this.sim.inRg(name);
    const menu: (string | [string, string[]])[] = ['Overview', 'Activity log', 'Access control (IAM)', 'Tags', 'Resource visualizer', 'Events', ['Settings', ['Deployments', 'Security', 'Policies', 'Properties', 'Locks']], ['Cost Management', ['Cost analysis', 'Budgets']], ['Monitoring', ['Insights (preview)', 'Alerts', 'Metrics', 'Diagnostic settings', 'Logs']]];
    let body = '';
    if (tab === 'Overview') {
      body = `${this.cmds([['+ Create', NAV({ page: 'create' })], ['Manage view', A('unsupported', 'Manage view')], ['Delete resource group', A('pane', 'del-rg')], ['Refresh', NAV(this.view)], ['Export to CSV', A('unsupported', 'Export')], ['Move', A('unsupported', 'Move resources')]])}
        ${this.ess([['Subscription', esc(SUB_NAME)], ['Subscription ID', esc(SUB_ID)], ['Deployments', `${this.sim.events.filter((e) => /\.create$/.test(e.type) && e.data.rg === name).length} Succeeded`], ['Location', esc(regionLabel(g.location))], ['Tags', Object.entries(g.tags).map(([k, v]) => `<span class="pt-pill">${esc(k)} : ${esc(v)}</span>`).join(' ') || `<button class="pt-link" ${A('blade', 'Tags')}>Add tags</button>`], ['Locks', g.locks.length ? g.locks.map((l) => `🔒 ${esc(l.name)}`).join(', ') : 'None']])}
        <div class="pt-tabs-s"><span class="on">Resources</span><span>Recommendations</span></div>
        <label class="pt-filter" style="display:inline-flex;margin:6px 0">🔍 <input id="pa-list-q" class="pa-inline" placeholder="Filter for any field..."></label>
        ${res.length ? this.table(['Name', 'Type', 'Location'], res.map((r) => [esc(r.name), esc(TYPE_INFO[r.type].label), esc(regionLabel(r.location))]), res.map((r) => A('res', r.id))) : `<div class="pt-empty">${ico('📦', '#5c2d91', 'xl')}<p class="pt-empty-h">No resources to display</p><p class="pt-p">Try changing your filters if you don't see what you're looking for.</p><button class="pt-btn pt-primary" ${NAV({ page: 'create' })}>Create resources</button></div>`}`;
    } else if (tab === 'Activity log') body = this.activity((d) => d.rg === name || d.name === name);
    else if (tab === 'Access control (IAM)') body = this.iam();
    else if (tab === 'Tags') body = this.tagsBody(g.tags);
    else if (tab === 'Locks') body = `${this.cmds([['+ Add', A('unsupported', 'Use the form below to add a lock')], ['Subscription', A('unsupported', 'Subscription locks')], ['Refresh', NAV(this.view)]])}
        <form data-form="lock" class="pa-lockform"><input class="pa-in" name="name" placeholder="Lock name" required><select class="pa-in" name="level"><option value="CanNotDelete">Delete</option><option value="ReadOnly">Read-only</option></select><input class="pa-in" name="notes" placeholder="Notes"><button class="pt-btn pt-primary">Add lock</button></form>
        ${g.locks.length ? this.table(['Lock name', 'Lock type', 'Scope', ''], g.locks.map((l) => [esc(l.name), l.level === 'CanNotDelete' ? 'Delete' : 'Read-only', esc(name), `<button class="pt-link" ${A('lock-del', l.name)}>Delete</button>`])) : '<p class="pt-p" style="margin-top:10px">This resource group has no locks.</p>'}
        <div class="pt-note-bar info"><strong>Delete</strong>: authorized users can read and modify, but not delete. <strong>Read-only</strong>: authorized users can only read. Locks apply to everyone, even Owners.</div>`;
    else if (tab === 'Deployments') { const ev = this.sim.events.filter((e) => /\.create$/.test(e.type) && e.data.rg === name).reverse(); body = ev.length ? this.table(['Deployment name', 'Status', 'Last modified'], ev.map((e) => [esc(`${e.type.split('.')[0]}-${e.data.name ?? ''}`), this.status('Succeeded'), new Date(e.at).toLocaleTimeString()])) : '<p class="pt-p">No deployments yet.</p>'; }
    else if (tab === 'Cost analysis') body = this.costTable(res, `Cost by resource in ${name}`);
    else if (tab === 'Properties') body = this.ess([['Name', esc(name)], ['Location', esc(regionLabel(g.location))], ['Resource ID', esc(`/subscriptions/${SUB_ID}/resourceGroups/${name}`)], ['Created', new Date(g.created).toLocaleString()]]);
    else body = this.notInSim(tab);
    return this.blade('📦', '#5c2d91', [['Resource groups', { page: 'rgs' }], [name, null]], name, 'Resource group', menu, tab, body);
  }
  private notInSim(tab: string) {
    return `<div class="pt-empty">${ico('🧪', '#0078d4', 'xl')}<p class="pt-empty-h">${esc(tab)}</p><p class="pt-p">This blade isn’t simulated yet. In the real portal it lives right here. Try Overview, Tags, Locks or Activity log.</p></div>`;
  }

  private resBlade(r: Res, tab: string) {
    const crumbs: [string, View | null][] = [[r.rg, { page: 'rg', name: r.rg }], [r.name, null]];
    const s = svcFor(r.type);
    const common = ['Overview', 'Activity log', 'Access control (IAM)', 'Tags', 'Diagnose and solve problems'];
    let menu: (string | [string, string[]])[] = [...common, ['Settings', ['Properties', 'Locks']]];
    let body = '';
    const essBase: [string, string][] = [['Resource group', `<button class="pt-link" ${A('rg', r.rg)}>${esc(r.rg)}</button>`], ['Location', esc(regionLabel(r.location))], ['Subscription', esc(SUB_NAME)], ['Subscription ID', esc(SUB_ID)], ['Tags', Object.entries(r.tags).map(([k, v]) => `<span class="pt-pill">${esc(k)} : ${esc(v)}</span>`).join(' ') || `<button class="pt-link" ${A('blade', 'Tags')}>Add tags</button>`]];
    const cost = this.sim.hourly(r);
    const costNote = `<div class="pt-note-bar ${cost ? 'warn' : 'ok'}">💰 Estimated cost right now: <strong>${money(cost * 730)}/month</strong> (${money(cost)}/hour).</div>`;

    if (r.type === 'vm') {
      menu = [...common, ['Connect', ['Connect', 'Bastion']], ['Networking', ['Network settings']], ['Settings', ['Disks', 'Extensions + applications', 'Configuration', 'Properties', 'Locks']], ['Availability + scale', ['Size', 'Availability + scaling']], ['Monitoring', ['Insights', 'Alerts', 'Metrics']], ['Automation', ['Auto-shutdown']]];
      const power = r.props.power === 'running' ? 'Running' : r.props.power === 'stopped' ? 'Stopped' : 'Stopped (deallocated)';
      if (tab === 'Overview') body = `${this.cmds([['Connect', A('pane', 'connect')], ['Start', A('vm-power', 'start')], ['Restart', A('vm-power', 'restart')], ['Stop', A('vm-power', 'deallocate')], ['Hibernate', A('unsupported', 'Hibernate')], ['Capture', A('unsupported', 'Capture')], ['Delete', A('pane', 'del-res')], ['Refresh', NAV(this.view)]])}
        ${this.ess([...essBase.slice(0, 1), ['Status', this.status(power)], ...essBase.slice(1, 4), ['Operating system', `${esc(r.props.os)} (${esc(IMAGES[r.props.image]?.label)})`], ['Size', `${esc(r.props.size)} (${VM_SIZES[r.props.size].cpu} vcpus, ${VM_SIZES[r.props.size].ram} GiB memory)`], ['Public IP address', esc(r.props.publicIp)], ['Private IP address', esc(r.props.privateIp)], ['Availability zone', r.props.zone ? esc(r.props.zone) : '—'], essBase[4]])}${costNote}
        <div class="pt-tabs-s"><span class="on">Properties</span><span>Monitoring</span><span>Capabilities</span><span>Recommendations</span><span>Tutorials</span></div>
        <div class="pt-cards"><div class="pt-card"><p class="pt-card-h">Networking</p><p>NIC: ${esc(r.props.nic)}<br>NSG: ${esc(r.props.nsg)}<br>Inbound: ${esc(r.props.ports === 'none' ? 'none' : r.props.ports)}</p></div><div class="pt-card"><p class="pt-card-h">Disk</p><p>${esc(r.props.disk)}<br>Premium SSD LRS</p></div><div class="pt-card"><p class="pt-card-h">Administrator</p><p>${esc(r.props.admin)}</p></div></div>`;
      else if (tab === 'Size') body = `<div class="pt-note-bar warn">⚠️ If the virtual machine is currently running, changing its size will cause it to be restarted.</div>${this.table(['VM Size', 'vCPUs', 'RAM (GiB)', 'Cost/month', ''], Object.entries(VM_SIZES).map(([k, v]) => [esc(k) + (k === r.props.size ? ' <span class="pt-pill">current</span>' : ''), String(v.cpu), String(v.ram), money(v.hr * (r.props.os === 'Windows' ? 1.4 : 1) * 730), k === r.props.size ? '' : `<button class="pt-btn pt-primary" ${A('vm-resize', k)}>Resize</button>`]))}`;
      else if (tab === 'Network settings') { const nsg = this.sim.find('nsg', r.rg, r.props.nsg); body = `${this.ess([['Network interface', esc(r.props.nic)], ['Public IP', esc(r.props.publicIp)], ['Private IP', esc(r.props.privateIp)], ['Network security group', nsg ? `<button class="pt-link" ${A('res', nsg.id)}>${esc(nsg.name)}</button>` : '—']])}<p class="pt-sec-h">Inbound port rules</p>${this.table(['Priority', 'Port', 'Source', 'Action'], [...(r.props.ports && r.props.ports !== 'none' ? [['300', esc(r.props.ports), 'Any', this.status('Allow')]] : []), ['65000', 'Any', 'VirtualNetwork', 'Allow'], ['65500', 'Any', 'Any', this.status('Deny')]])}`; }
      else if (tab === 'Disks') { const disk = this.sim.find('disk', r.rg, r.props.disk); body = this.table(['Disk name', 'Storage type', 'Size (GiB)'], disk ? [[`<button class="pt-link" ${A('res', disk.id)}>${esc(disk.name)}</button>`, 'Premium SSD LRS', String(disk.props.sizeGb)]] : []) + '<div class="pt-note-bar info">Disks are billed while they exist, even if the VM is stopped (deallocated).</div>'; }
      else if (tab === 'Connect') body = this.connectHtml(r);
      else if (tab === 'Auto-shutdown') body = `<div class="pt-note-bar info">💡 Auto-shutdown stops (deallocates) the VM every day at a set time, so you don't pay for idle test machines overnight.</div>${this.f('Enabled', '<span class="pt-toggle on"><i></i>On</span>')}${this.f('Scheduled shutdown', '19:00:00')}${this.f('Time zone', '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi')}`;
      else if (tab === 'Metrics') body = this.fakeChart(`Percentage CPU (Avg) · ${r.name}`, r.props.power === 'running');
    } else if (r.type === 'storage') {
      menu = [...common, 'Storage browser', ['Data storage', ['Containers', 'File shares', 'Queues', 'Tables']], ['Security + networking', ['Networking', 'Access keys', 'Shared access signature', 'Encryption']], ['Data management', ['Redundancy', 'Data protection', 'Lifecycle management']], ['Settings', ['Configuration', 'Properties', 'Locks']]];
      if (tab === 'Overview') body = `${this.cmds([['Upload', A('blade', 'Containers')], ['Open in Explorer', A('unsupported', 'Storage Explorer')], ['Delete', A('pane', 'del-res')], ['Move', A('unsupported', 'Move')], ['Refresh', NAV(this.view)]])}
        ${this.ess([...essBase.slice(0, 2), ['Primary/Secondary Location', /GRS|GZRS/.test(r.props.sku) ? `Primary: ${esc(regionLabel(r.location))}, Secondary: paired region` : `Primary: ${esc(regionLabel(r.location))}`], ['Performance', r.props.sku.startsWith('Premium') ? 'Premium' : 'Standard'], ['Replication', esc(STORAGE_SKUS[r.props.sku].label)], ['Account kind', 'StorageV2 (general purpose v2)'], ['Blob endpoint', esc(`https://${r.name}.blob.core.windows.net/`)], essBase[4]])}${costNote}
        <div class="pt-cards">${['Containers', 'File shares', 'Queues', 'Tables'].map((x) => `<button class="pt-card pt-kpi" ${A('blade', x)}><p class="pt-card-h">${x}</p><p class="pt-kpi-v">${x === 'Containers' ? (r.props.containers ?? []).length : 0}</p></button>`).join('')}</div>`;
      else if (tab === 'Redundancy') body = `<form data-form="sku">${this.f('Redundancy', `<select class="pa-in" name="sku">${Object.entries(STORAGE_SKUS).filter(([k]) => k.startsWith('Premium') === r.props.sku.startsWith('Premium')).map(([k, s]) => `<option value="${k}" ${k === r.props.sku ? 'selected' : ''}>${esc(s.label)}</option>`).join('')}</select>`)}${this.f('Primary location', `${esc(regionLabel(r.location))} · ${this.status('Available')}`)}${/GRS|GZRS/.test(r.props.sku) ? this.f('Secondary location', `Paired region · ${this.status('Available')}`) : ''}<div class="pt-savebar"><button class="pt-btn pt-primary">Save</button><button type="button" class="pt-btn" ${NAV(this.view)}>Discard</button></div></form>
        <div class="pt-note-bar info">LRS: 3 copies in one datacenter · ZRS: 3 zones · GRS: + paired region · GZRS: zones + paired region.</div>`;
      else if (tab === 'Containers' || tab === 'Storage browser') body = `<form data-form="container" class="pa-tagrow"><input class="pa-in" name="name" placeholder="New container name (e.g. images)" required><button class="pt-btn pt-primary">+ Container</button></form>
        ${(r.props.containers ?? []).length ? this.table(['Name', 'Last modified', 'Anonymous access level', ''], (r.props.containers as string[]).map((c) => [esc(c), new Date().toLocaleDateString(), 'Private', `<button class="pt-link" ${A('container-del', c)}>Delete</button>`])) : '<p class="pt-p" style="margin-top:10px">No containers yet. Blobs (files) live inside containers.</p>'}`;
      else if (tab === 'Access keys') body = `<div class="pt-note-bar warn">⚠️ Access keys give full access to the account. Prefer Microsoft Entra ID and managed identities; rotate keys regularly.</div>${this.f('key1', '<span class="pt-input">••••••••••••••••••••••••••••••••</span>')}${this.f('Connection string', '<span class="pt-input">••••••••••••••••••••••••••••</span>')}`;
      else if (tab === 'Networking') body = this.f('Public network access', this.radios('na', [['all', 'Enabled from all networks'], ['sel', 'Enabled from selected virtual networks and IP addresses'], ['off', 'Disabled']], 'all')) + '<div class="pt-note-bar info">Add a <strong>private endpoint</strong> to reach the account on a private IP inside your VNet.</div>';
    } else if (r.type === 'webapp') {
      menu = [...common, ['Deployment', ['Deployment slots', 'Deployment Center']], ['Settings', ['Environment variables', 'Configuration', 'Custom domains', 'Scale up (App Service plan)', 'Scale out (App Service plan)', 'Properties', 'Locks']], ['Monitoring', ['Application Insights', 'Metrics', 'Log stream']]];
      const plan = this.sim.find('plan', r.rg, r.props.plan);
      if (tab === 'Overview') body = `${this.cmds([['Browse', A('browse')], ['Stop', A('webapp-state', 'Stopped')], ['Start', A('webapp-state', 'Running')], ['Restart', A('webapp-state', 'Running')], ['Delete', A('pane', 'del-res')], ['Refresh', NAV(this.view)]])}
        ${this.ess([...essBase.slice(0, 1), ['Status', this.status(r.props.state ?? 'Running')], ['Default domain', `<button class="pt-link" ${A('browse')}>${esc(r.props.host)}</button>`], ...essBase.slice(1, 3), ['App Service plan', plan ? `<button class="pt-link" ${A('res', plan.id)}>${esc(plan.name)}</button> (${esc(plan.props.sku)})` : '—'], ['Runtime Stack', esc(r.props.runtime)], essBase[4]])}${costNote}`;
      else if (tab === 'Scale up (App Service plan)') body = this.planSkus(plan);
      else if (tab === 'Scale out (App Service plan)') body = this.f('Scale out method', this.radios('so', [['manual', 'Manual'], ['auto', 'Automatic'], ['rules', 'Rules Based']], 'manual')) + this.f('Instance count', '1') + '<div class="pt-note-bar info">Scale out adds instances of your app behind the built-in load balancer. Free/Basic plans have low limits.</div>';
      else if (tab === 'Metrics') body = this.fakeChart(`Requests · ${r.name}`, (r.props.state ?? 'Running') === 'Running');
    } else if (r.type === 'plan') {
      menu = [...common, ['Settings', ['Scale up (App Service plan)', 'Apps', 'Properties', 'Locks']]];
      if (tab === 'Overview') body = this.ess([...essBase.slice(0, 2), ['Pricing tier', esc(PLAN_SKUS[r.props.sku].label)], ['Operating System', esc(r.props.os)], ['Apps', String(this.sim.res.filter((x) => x.type === 'webapp' && x.props.plan === r.name).length)], essBase[4]]) + costNote;
      else if (tab === 'Scale up (App Service plan)') body = this.planSkus(r);
    } else if (r.type === 'vmss') {
      menu = [...common, ['Settings', ['Instances', 'Networking', 'Scaling', 'Size', 'Properties', 'Locks']], ['Monitoring', ['Metrics']]];
      if (tab === 'Overview') body = `${this.cmds([['Start', A('unsupported', 'Start all')], ['Restart', A('unsupported', 'Restart all')], ['Stop', A('unsupported', 'Stop all')], ['Delete', A('pane', 'del-res')], ['Refresh', NAV(this.view)]])}${this.ess([...essBase.slice(0, 2), ['Instances', `${r.props.capacity}`], ['Size', esc(r.props.size)], ['Image', esc(IMAGES[r.props.image]?.label)], ['Orchestration mode', 'Flexible'], essBase[4]])}${costNote}`;
      else if (tab === 'Instances') body = this.table(['Name', 'Computer name', 'Status', 'Health state'], Array.from({ length: r.props.capacity }, (_, i) => [`${esc(r.name)}_${i}`, `${esc(r.name.replace(/\W/g, '').slice(0, 9))}00000${i}`, this.status('Running'), this.status('Healthy')])) || '<p class="pt-p">0 instances.</p>';
      else if (tab === 'Scaling') body = `<form data-form="scale">${this.f('Choose how to scale your resource', this.radios('mode', [['manual', 'Manual scale'], ['auto', 'Custom autoscale']], 'manual'))}${this.f('Instance count', `<input class="pa-in" type="number" min="0" max="100" name="count" value="${r.props.capacity}">`, { note: `Each instance ≈ ${money(VM_SIZES[r.props.size].hr * 730)}/month.` })}<div class="pt-savebar"><button class="pt-btn pt-primary">Save</button></div></form>`;
    } else if (r.type === 'nsg') {
      menu = [...common, ['Settings', ['Inbound security rules', 'Outbound security rules', 'Network interfaces', 'Subnets', 'Properties', 'Locks']]];
      const rules = [...(r.props.inbound ?? []).map((p: string, i: number) => [String(300 + i * 10), `Allow-${p}`, esc(p), 'TCP', 'Any', this.status('Allow')]), ['65000', 'AllowVnetInBound', 'Any', 'Any', 'VirtualNetwork', this.status('Allow')], ['65001', 'AllowAzureLoadBalancerInBound', 'Any', 'Any', 'AzureLoadBalancer', this.status('Allow')], ['65500', 'DenyAllInBound', 'Any', 'Any', 'Any', this.status('Deny')]];
      if (tab === 'Overview' || tab === 'Inbound security rules') body = `${tab === 'Overview' ? this.ess(essBase) : ''}<p class="pt-sec-h">Inbound security rules</p>${this.table(['Priority', 'Name', 'Port', 'Protocol', 'Source', 'Action'], rules)}<div class="pt-note-bar info">Rules are checked from the lowest priority number up; the first match wins.</div>`;
    }
    if (!body) {
      if (tab === 'Overview') body = `${this.cmds([['Delete', A('pane', 'del-res')], ['Refresh', NAV(this.view)]])}${this.ess([...essBase, ...Object.entries(r.props).filter(([, v]) => typeof v !== 'object').slice(0, 6).map(([k, v]) => [k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()), esc(v)] as [string, string])])}${cost ? costNote : ''}`;
      else if (tab === 'Activity log') body = this.activity((d) => d.name === r.name || d.rg === r.rg);
      else if (tab === 'Access control (IAM)') body = this.iam();
      else if (tab === 'Tags') body = this.tagsBody(r.tags);
      else if (tab === 'Locks') { const g = this.sim.rg(r.rg)!; body = (g.locks.length ? this.table(['Lock name', 'Lock type', 'Scope'], g.locks.map((l) => [esc(l.name), l.level === 'CanNotDelete' ? 'Delete' : 'Read-only', `Resource group (${esc(r.rg)}) · inherited`])) : '<p class="pt-p">No locks. Locks added to the resource group apply here too.</p>') + `<button class="pt-btn" ${A('rg', r.rg)} style="margin-top:10px">Manage locks on ${esc(r.rg)}</button>`; }
      else if (tab === 'Properties') body = this.ess([['Name', esc(r.name)], ['Type', esc(TYPE_INFO[r.type].arm)], ['Resource ID', esc(r.id)], ['Created', new Date(r.created).toLocaleString()]]);
      else body = this.notInSim(tab);
    }
    return this.blade(s?.icon ?? TYPE_INFO[r.type].icon, s?.color ?? '#0078d4', crumbs, r.name, TYPE_INFO[r.type].label, menu, tab, body);
  }
  private planSkus(plan?: Res) {
    if (!plan) return '<p class="pt-p">Plan not found.</p>';
    return `<div class="pt-cards">${Object.entries(PLAN_SKUS).map(([k, p]) => `<div class="pt-card pt-kpi ${k === plan.props.sku ? 'info' : ''}"><p class="pt-card-h">${esc(p.label)}</p><p class="pt-kpi-v">${money(p.hr * 730)}</p><p class="pt-kpi-s">per month</p>${k === plan.props.sku ? '<span class="pt-pill">Current</span>' : `<button class="pt-btn pt-primary" ${A('plan-sku', k)}>Select</button>`}</div>`).join('')}</div><div class="pt-note-bar info"><strong>Scale up</strong> = a bigger plan (more CPU/memory, more features). <strong>Scale out</strong> = more instances.</div>`;
  }
  private fakeChart(title: string, on: boolean) {
    const data = on ? [12, 18, 15, 30, 42, 38, 25, 20, 22, 17] : [12, 18, 15, 3, 0, 0, 0, 0, 0, 0];
    const W = 520, H = 140, max = 50;
    const pts = data.map((d, i) => `${(i / (data.length - 1)) * W},${H - (d / max) * H}`).join(' ');
    return `<div class="pt-card"><p class="pt-card-h">${esc(title)}</p><svg viewBox="-4 -8 ${W + 8} ${H + 20}" class="pt-chart"><polyline points="0,${H} ${pts} ${W},${H}" fill="#0f6cbd" opacity=".12"/><polyline points="${pts}" fill="none" stroke="#0f6cbd" stroke-width="2.5"/><text x="0" y="${H + 16}" class="pt-chart-l">Last 24 hours (simulated)</text></svg></div>`;
  }
  private connectHtml(r: Res) {
    const win = r.props.os === 'Windows';
    return `<p class="pt-p">Connect to <strong>${esc(r.name)}</strong> (${esc(r.props.publicIp)}).</p>
      <pre class="pt-code">${win ? `mstsc /v:${esc(r.props.publicIp)}` : `ssh ${esc(r.props.admin)}@${esc(r.props.publicIp)}`}</pre>
      <div class="pt-note-bar info">More secure: <strong>Azure Bastion</strong> connects from the browser without exposing ${win ? 'RDP 3389' : 'SSH 22'} to the internet.</div>
      <p class="pt-sec-h">Try a common mistake</p><p class="pt-p">Shutting down from <em>inside</em> the operating system stops the VM but keeps it <strong>allocated</strong>, so compute is still billed.</p>
      <button class="pt-btn" ${A('vm-os-stop')}>🖥️ Shut down from inside the OS</button>`;
  }

  /* ---------------- tools pages ---------------- */
  private costTable(list: Res[], title: string) {
    const rows = list.map((r) => [r, this.sim.hourly(r)] as const).sort((a, b) => b[1] - a[1]);
    const total = rows.reduce((s, [, h]) => s + h, 0);
    return `<div class="pt-cards"><div class="pt-card pt-kpi info"><p class="pt-card-h">Forecast (this month)</p><p class="pt-kpi-v">${money(total * 730)}</p><p class="pt-kpi-s">at current usage</p></div><div class="pt-card pt-kpi"><p class="pt-card-h">Per hour now</p><p class="pt-kpi-v">${money(total)}</p></div></div>
      <p class="pt-sec-h">${esc(title)}</p>${rows.length ? this.table(['Resource', 'Type', 'Resource group', 'Cost / month'], rows.map(([r, h]) => [esc(r.name), esc(TYPE_INFO[r.type].label), esc(r.rg), h ? money(h * 730) : `${money(0)} <span class="pt-sub">(free or stopped)</span>`]), rows.map(([r]) => A('res', r.id))) : '<p class="pt-p">No resources yet.</p>'}
      <p class="pt-p" style="margin-top:8px">Illustrative prices in your chosen currency.</p>`;
  }
  private cost() {
    return `<div class="pt-page pa-scroll">${this.crumbs([['Cost Management', null]])}${this.title('💲', '#107c10', 'Cost Management | Cost analysis', SUB_NAME)}
      ${this.cmds([['Scope: subscription', A('unsupported', 'Scopes')], ['Budgets', A('unsupported', 'Budgets (see the Cost Management lesson walkthrough)')], ['Download', A('unsupported', 'Download')]])}
      ${this.costTable(this.sim.res, 'Cost by resource')}</div>`;
  }
  private subs() {
    return `<div class="pt-page pa-scroll">${this.crumbs([['Subscriptions', null]])}${this.title('🔑', '#c19c00', 'Subscriptions', 'Default Directory')}
      ${this.table(['Subscription name', 'Subscription ID', 'My role', 'Current cost', 'Status'], [[esc(SUB_NAME), esc(SUB_ID), 'Owner', `${money(this.sim.totalHourly() * 730)}/month`, this.status('Active')]])}
      <div class="pt-note-bar info">A subscription is a <strong>billing and access boundary</strong>. Resource groups live inside it.</div></div>`;
  }
  private advisor() {
    const recs: [string, string, string, string][] = [];
    for (const r of this.sim.res) {
      if (r.type === 'vm' && r.props.power === 'running') recs.push(['Cost', 'Medium', `Enable auto-shutdown or deallocate ${r.name} when not in use`, A('res', r.id)]);
      if (r.type === 'vm' && r.props.power === 'stopped') recs.push(['Cost', 'High', `${r.name} is stopped inside the OS but still allocated (still billed)`, A('res', r.id)]);
      if (r.type === 'vm' && !r.props.zone) recs.push(['Reliability', 'Medium', `Use availability zones for ${r.name}`, A('res', r.id)]);
      if (r.type === 'vm' && ['22', '3389'].includes(r.props.ports)) recs.push(['Security', 'High', `Management port ${r.props.ports} is open to the internet on ${r.name}`, A('res', r.id)]);
      if (r.type === 'storage' && r.props.sku === 'Standard_LRS') recs.push(['Reliability', 'Low', `Consider ZRS or GRS for ${r.name}`, A('res', r.id)]);
      if (r.type === 'disk' && !this.sim.res.some((v) => v.type === 'vm' && v.props.disk === r.name)) recs.push(['Cost', 'High', `Delete unattached disk ${r.name}`, A('res', r.id)]);
    }
    for (const g of this.sim.rgs) if (!Object.keys(g.tags).length) recs.push(['Operational excellence', 'Low', `Add tags (owner, env) to ${g.name}`, A('rg', g.name)]);
    const score = Math.max(20, 100 - recs.length * 7);
    const cats = ['Cost', 'Security', 'Reliability', 'Operational excellence', 'Performance'];
    return `<div class="pt-page pa-scroll">${this.crumbs([['Advisor', null]])}${this.title('💡', '#c19c00', 'Advisor | Overview', 'Recommendations for your simulated resources')}
      <div class="pt-cards"><div class="pt-card pt-kpi ${score > 80 ? 'ok' : 'warn'}"><p class="pt-card-h">Advisor score</p><p class="pt-kpi-v">${score}%</p></div>${cats.map((c) => `<div class="pt-card pt-kpi"><p class="pt-card-h">${c}</p><p class="pt-kpi-v">${recs.filter((x) => x[0] === c).length}</p></div>`).join('')}</div>
      ${recs.length ? this.table(['Recommendation', 'Category', 'Impact'], recs.map(([c, i, t]) => [esc(t), esc(c), this.status(i === 'High' ? 'High' : i === 'Medium' ? 'Medium' : 'Low')]), recs.map((x) => x[3])) : '<div class="pt-note-bar ok">✔ No recommendations. Create some resources and come back.</div>'}</div>`;
  }
  private infoPage(page: string) {
    const s = SVC.find((x) => x.k === page)!;
    const text: Record<string, string> = {
      monitor: 'Azure Monitor collects **metrics** and **logs** from every resource and raises **alerts**. In this simulator, open any VM → Metrics to see a sample chart.',
      entra: 'Microsoft Entra ID is the identity service behind every sign-in. Users, groups, MFA and Conditional Access live here. Practise it in the Entra ID lesson walkthroughs.',
      defender: 'Defender for Cloud gives a **secure score** and recommendations. This simulator’s **Advisor** page flags open management ports from your own resources.',
      policy: 'Azure Policy enforces rules such as **Allowed locations**. Practise assigning one in the Azure Policy lesson walkthrough.',
    };
    return `<div class="pt-page pa-scroll">${this.crumbs([[s.label, null]])}${this.title(s.icon, s.color, s.label, 'Overview')}
      <div class="pt-note-bar info">${md(text[page] ?? 'This area is not simulated yet.')}</div>
      ${page === 'monitor' ? this.fakeChart('Percentage CPU (Avg) · all VMs', this.sim.res.some((r) => r.type === 'vm' && r.props.power === 'running')) : ''}
      ${page === 'defender' ? `<button class="pt-btn pt-primary" ${NAV({ page: 'advisor' })}>Open Advisor recommendations</button>` : ''}</div>`;
  }

  /* ---------------- panes ---------------- */
  private paneHtml() {
    const p = this.pane!;
    const wrap = (title: string, body: string, foot = '', cls = '') => `<aside class="pt-pane ${cls}"><div class="pt-pane-h"><div><h4>${title}</h4></div><button ${A('pane-close')} aria-label="Close">✕</button></div><div class="pt-pane-b">${body}</div>${foot ? `<div class="pt-pane-f">${foot}</div>` : ''}</aside>`;
    const r = this.cur();
    switch (p.kind) {
      case 'notes': return wrap('Notifications', this.notes.length ? this.notes.map((n) => `<div class="pt-note-bar ${n.kind}"><strong>${esc(n.title)}</strong><br>${esc(n.text)}<br><span class="pt-sub">${ago(n.at)}</span></div>`).join('') : '<p class="pt-p">No notifications.</p>', this.notes.length ? `<button class="pt-btn" ${A('pane-close')}>Dismiss</button>` : '');
      case 'copilot': {
        const sugg = ['Why is my bill high?', 'Which VMs are still running?', 'How do I create a VM?', 'How do resource locks work?', 'Rules for storage account names'];
        return wrap('✨ Copilot', `<div class="pt-chat">${p.html ?? '<div class="pt-bub ai">Hi! I’m a <strong>simulated</strong> Copilot. Ask about your resources in this practice portal.</div>'}
          <div class="pa-sugg">${sugg.map((s) => `<button class="pt-filter" ${A('cp', s)}>${esc(s)}</button>`).join('')}</div>
          <form data-form="cp" class="pa-tagrow"><input class="pa-in" name="q" placeholder="Ask a question or describe a task…"><button class="pt-btn pt-primary">Send</button></form>
          <p class="pt-chat-f">Simulated assistant for education. AI-generated content may be incorrect.</p></div>`, '', 'pt-copane');
      }
      case 'settings': return wrap('Portal settings', `${this.f('Theme', `<button class="pt-btn" ${A('theme')}>${this.dark ? '☀️ Switch to light' : '🌙 Switch to dark'}</button>`)}${this.f('Language', 'English')}${this.f('Directory', 'Default Directory (contoso.onmicrosoft.com)')}<div class="pt-note-bar info">🎓 This is an education-only simulation of the Azure portal.</div>`);
      case 'json': {
        const target = r ?? (this.view.page === 'rg' ? this.sim.rg(this.view.name) : undefined);
        const json = r ? { id: r.id, name: r.name, type: TYPE_INFO[r.type].arm, location: r.location, tags: r.tags, properties: r.props } : target ? { id: `/subscriptions/${SUB_ID}/resourceGroups/${(target as any).name}`, name: (target as any).name, type: 'Microsoft.Resources/resourceGroups', location: (target as any).location, tags: (target as any).tags } : {};
        return wrap('Resource JSON', `<pre class="pt-code">${esc(JSON.stringify(json, null, 2))}</pre><p class="pt-p">Every resource is described by JSON like this in Azure Resource Manager. ARM templates and Bicep use the same shape.</p>`);
      }
      case 'connect': return r ? wrap(`Connect · ${esc(r.name)}`, this.connectHtml(r)) : '';
      case 'del-res': return r ? wrap('Delete resource', `<div class="pt-note-bar bad">Are you sure you want to delete <strong>${esc(r.name)}</strong>? This cannot be undone.</div>${r.type === 'vm' ? '<p class="pt-p">Note: deleting a VM does not delete its disk, network interface, public IP or NSG unless you choose to.</p>' : ''}`, `<button class="pt-btn pa-danger" ${A('del-res-go')}>Delete</button><button class="pt-btn" ${A('pane-close')}>Cancel</button>`) : '';
      case 'del-rg': {
        const name = (this.view as { name: string }).name;
        const n = this.sim.inRg(name).length;
        return wrap('Delete a resource group', `<div class="pt-note-bar bad">The following resource group and <strong>all its dependent resources (${n})</strong> will be permanently deleted.</div>${this.f('Enter resource group name to confirm deletion', `<input id="pa-del-confirm" class="pa-in" placeholder="${esc(name)}" autocomplete="off">`, { req: true })}`, `<button class="pt-btn pa-danger" ${A('del-rg-go', name)}>Delete</button><button class="pt-btn" ${A('pane-close')}>Cancel</button>`);
      }
      case 'info': return wrap(esc(p.title ?? ''), p.html ?? '');
    }
  }
}
