/**
 * Simulated Azure portal (practice only). Renders into a container from the
 * shared Sim state and re-renders whenever the state changes.
 */
import { Sim, SimError, REGIONS, VM_SIZES, IMAGES, STORAGE_SKUS, PLAN_SKUS, RUNTIMES, TYPE_INFO, SUB_NAME, type Res } from './engine';

type View =
  | { page: 'home' } | { page: 'create' } | { page: 'create-rg' } | { page: 'create-vm' } | { page: 'create-storage' } | { page: 'create-webapp' }
  | { page: 'rgs' } | { page: 'all' } | { page: 'list'; type: 'vm' | 'storage' | 'webapp' | 'vmss' } | { page: 'cost' }
  | { page: 'rg'; name: string } | { page: 'res'; id: string };

const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const money = (n: number) => `$${n.toFixed(n < 1 ? 3 : 2)}`;
const regionOpts = (sel = 'westeurope') => Object.entries(REGIONS).map(([k, v]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${v}</option>`).join('');
const field = (label: string, input: string, help = '') => `<label class="block"><span class="text-sm font-semibold">${label}</span>${input}${help ? `<span class="mt-1 block text-xs text-muted">${help}</span>` : ''}</label>`;
const inputCls = 'mt-1 w-full rounded-md border border-default bg-[var(--bg)] px-3 py-2 text-sm';
const btn = (label: string, action: string, extra = '', kind: 'primary' | 'plain' | 'danger' = 'plain') =>
  `<button type="button" data-act="${action}" ${extra} class="rounded-md px-3 py-1.5 text-sm font-semibold ${kind === 'primary' ? 'bg-[#0078d4] text-white hover:bg-[#005a9e]' : kind === 'danger' ? 'border border-[var(--bad)] text-[var(--bad)] hover:bg-[var(--bad-soft)]' : 'border border-default hover:bg-[var(--pastel-grey)]'}">${label}</button>`;

export class Portal {
  view: View = { page: 'home' };
  notice: { kind: 'ok' | 'bad' | 'info'; text: string } | null = null;
  deploying = false;

  constructor(private root: HTMLElement, private sim: Sim) {
    sim.onChange(() => this.render());
    root.addEventListener('click', (e) => this.onClick(e));
    root.addEventListener('submit', (e) => { e.preventDefault(); this.onSubmit(e.target as HTMLFormElement); });
    root.addEventListener('input', (e) => this.onInput(e));
    this.render();
  }

  go(v: View) {
    this.view = v;
    this.notice = null;
    this.sim.emit('view', { ...v });
  }
  openResource(id: string) { this.go({ page: 'res', id }); }

  /* ---------------- events ---------------- */
  private onClick(e: Event) {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!el) return;
    const [act, arg] = [el.dataset.act!, el.dataset.arg ?? ''];
    const sim = this.sim;
    try {
      switch (act) {
        case 'nav': return this.go(JSON.parse(arg));
        case 'vm-power': { const r = this.cur(); if (r) sim.powerVm(r.rg, r.name, arg as any); this.flash('ok', `Virtual machine '${r?.name}' ${arg === 'deallocate' ? 'stopped (deallocated)' : arg + 'ed'}.`); return; }
        case 'vm-stop-os': { const r = this.cur(); if (r) sim.powerVm(r.rg, r.name, 'stop'); this.flash('info', 'Shut down from inside the OS: the VM is Stopped but still ALLOCATED, so compute is still billed. Use Stop in the portal to deallocate.'); return; }
        case 'del-res': { const r = this.cur(); if (!r) return; if (!confirm(`Delete ${TYPE_INFO[r.type].label.toLowerCase()} '${r.name}'?`)) return; sim.deleteRes(r); this.go({ page: 'rg', name: r.rg }); this.flash('ok', `Deleted '${r.name}'.${r.type === 'vm' ? ' Its disk, network interface and public IP are still in the resource group, and the disk still costs money.' : ''}`); return; }
        case 'del-rg': {
          const typed = prompt(`Type the resource group name to confirm deletion:\n${arg}`);
          if (typed === null) return;
          if (typed.trim().toLowerCase() !== arg.toLowerCase()) return this.flash('bad', 'The name did not match. Nothing was deleted.');
          sim.deleteRg(arg);
          this.go({ page: 'rgs' });
          this.flash('ok', `Resource group '${arg}' and everything inside it was deleted.`);
          return;
        }
        case 'del-lock': { const v = this.view as { name: string }; sim.removeLock(v.name, arg); this.flash('ok', `Lock '${arg}' removed.`); return; }
        case 'del-tag': { const v = this.view as { name: string }; const g = sim.needRg(v.name); const t = { ...g.tags }; delete t[arg]; sim.tagRg(v.name, t, 'portal', true); return; }
        case 'browse': { const r = this.cur(); if (r) { sim.emit('webapp.browse', { rg: r.rg, name: r.name, via: 'portal' }); this.browse(r); } return; }
        case 'close-modal': this.root.querySelector('.p-modal')?.remove(); return;
      }
    } catch (err) {
      this.flash('bad', err instanceof SimError ? err.message : String(err));
    }
  }

  private onInput(e: Event) {
    const t = e.target as HTMLInputElement;
    if (t.name === 'st-name') {
      const p = this.sim.storageNameProblem(t.value.trim());
      const h = this.root.querySelector('#st-hint')!;
      h.textContent = t.value ? (p ?? `✓ '${t.value}' is available`) : '';
      h.className = `mt-1 block text-xs ${p ? 'verdict-bad' : 'verdict-ok'}`;
    }
    if (t.name === 'wa-name') {
      const h = this.root.querySelector('#wa-hint')!;
      const p = this.sim.webappNameProblem(t.value.trim());
      h.textContent = t.value ? (p ?? `✓ https://${t.value.toLowerCase()}.azurewebsites.net`) : '';
      h.className = `mt-1 block text-xs ${p ? 'verdict-bad' : 'verdict-ok'}`;
    }
    if (t.name === 'vm-size' || t.name === 'vm-image') this.render(true);
  }

  private onSubmit(f: HTMLFormElement) {
    const d = Object.fromEntries(new FormData(f)) as Record<string, string>;
    const sim = this.sim;
    const deploy = (label: string, fn: () => void, then: () => View) => {
      try {
        // validate by doing it; deployment animation is cosmetic
        fn();
        this.deploying = true;
        this.render();
        setTimeout(() => { this.deploying = false; this.go(then()); this.flash('ok', `✅ Deployment succeeded: ${label}`); }, 1400);
      } catch (err) {
        this.flash('bad', err instanceof SimError ? err.message : String(err));
      }
    };
    switch (f.dataset.form) {
      case 'rg': {
        const t = d['tag-key'] ? { [d['tag-key']]: d['tag-value'] ?? '' } : {};
        return deploy(`resource group '${d.name}'`, () => sim.createRg(d.name.trim(), d.region, t), () => ({ page: 'rg', name: d.name.trim() }));
      }
      case 'vm': {
        let vm: Res;
        return deploy(`virtual machine '${d.name}'`, () => { vm = sim.createVm({ rg: d.rg, name: d.name.trim(), image: d['vm-image'], size: d['vm-size'], location: d.region, zone: d.zone, admin: d.admin, ports: d.ports }); }, () => ({ page: 'res', id: vm!.id }));
      }
      case 'storage': {
        let st: Res;
        return deploy(`storage account '${d['st-name']}'`, () => { st = sim.createStorage({ rg: d.rg, name: d['st-name'].trim(), location: d.region, sku: d.sku }); }, () => ({ page: 'res', id: st!.id }));
      }
      case 'webapp': {
        let w: Res;
        return deploy(`web app '${d['wa-name']}'`, () => {
          const plan = sim.createPlan({ rg: d.rg, name: `${d['wa-name'].trim()}-plan`, sku: d.sku, location: d.region });
          w = sim.createWebapp({ rg: d.rg, plan: plan.name, name: d['wa-name'].trim(), runtime: d.runtime });
        }, () => ({ page: 'res', id: w!.id }));
      }
      case 'lock': {
        const v = this.view as { name: string };
        try { sim.addLock(v.name, d.name.trim(), d.level); this.flash('ok', `Lock '${d.name}' added.`); } catch (err) { this.flash('bad', (err as Error).message); }
        return;
      }
      case 'tag': {
        const v = this.view as { name: string };
        if (!d.key) return;
        try { sim.tagRg(v.name, { [d.key.trim()]: d.value ?? '' }); this.flash('ok', `Tag ${d.key}=${d.value} added.`); } catch (err) { this.flash('bad', (err as Error).message); }
        return;
      }
      case 'sku': {
        const r = this.cur();
        if (!r) return;
        try { sim.updateStorageSku(r.rg, r.name, d.sku); this.flash('ok', `Redundancy changed to ${STORAGE_SKUS[d.sku].label}.`); } catch (err) { this.flash('bad', (err as Error).message); }
        return;
      }
    }
  }

  private flash(kind: 'ok' | 'bad' | 'info', text: string) {
    this.notice = { kind, text };
    this.render();
  }
  private cur(): Res | undefined {
    return this.view.page === 'res' ? this.sim.res.find((r) => r.id === (this.view as { id: string }).id) : undefined;
  }

  private browse(r: Res) {
    const m = document.createElement('div');
    m.className = 'p-modal absolute inset-0 z-20 grid place-items-center bg-black/40 p-4';
    m.innerHTML = `<div class="w-full max-w-md overflow-hidden rounded-xl bg-white text-[#0b1020] shadow-2xl">
      <div class="flex items-center gap-2 bg-[#e8eef5] px-3 py-2 text-xs"><span>🔒</span><span class="flex-1 truncate rounded bg-white px-2 py-1">https://${esc(r.props.host)}</span>${btn('✕', 'close-modal')}</div>
      <div class="p-6 text-center"><p class="text-5xl">🚀</p><p class="mt-3 text-xl font-bold">Your web app is running and waiting for your content</p><p class="mt-2 text-sm text-[#4a5163]">${esc(r.name)} · ${esc(r.props.runtime)} · App Service (simulated)</p></div></div>`;
    this.root.append(m);
  }

  /* ---------------- render ---------------- */
  render(keepForm = false) {
    if (keepForm && this.view.page === 'create-vm') {
      // live cost preview without losing typed values
      const f = this.root.querySelector<HTMLFormElement>('form[data-form="vm"]');
      if (f) {
        const d = Object.fromEntries(new FormData(f)) as Record<string, string>;
        const hr = VM_SIZES[d['vm-size']].hr * (IMAGES[d['vm-image']].os === 'Windows' ? 1.4 : 1);
        this.root.querySelector('#vm-cost')!.textContent = `${money(hr * 730)} per month (${money(hr)}/hour) while running`;
        return;
      }
    }
    const v = this.view;
    const navItem = (label: string, icon: string, to: View, active: boolean) =>
      `<button type="button" data-act="nav" data-arg='${JSON.stringify(to)}' class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${active ? 'bg-[#deecf9] font-semibold text-[#005a9e]' : 'hover:bg-[var(--pastel-grey)]'}"><span>${icon}</span><span class="truncate">${label}</span></button>`;
    const isList = (t: string) => v.page === 'list' && v.type === t;
    this.root.innerHTML = `
      <div class="flex h-10 items-center gap-3 bg-[#0078d4] px-3 text-sm text-white">
        <span class="font-semibold">Microsoft Azure</span><span class="rounded bg-white/20 px-1.5 text-[0.65rem] font-bold">PRACTICE</span>
        <span class="hidden flex-1 truncate rounded bg-white/15 px-3 py-1 text-xs text-white/80 sm:block">Search resources, services and docs</span>
        <span class="ml-auto text-xs">💰 ${money(this.sim.totalHourly() * 730)}/mo</span>
      </div>
      <div class="flex min-h-[30rem]">
        <nav class="hidden w-44 shrink-0 space-y-0.5 border-r border-default bg-[var(--card)] p-2 sm:block" aria-label="Portal menu">
          ${navItem('Home', '🏠', { page: 'home' }, v.page === 'home')}
          ${navItem('Create a resource', '➕', { page: 'create' }, v.page.startsWith('create'))}
          ${navItem('Resource groups', '📦', { page: 'rgs' }, v.page === 'rgs' || v.page === 'rg')}
          ${navItem('All resources', '🗂️', { page: 'all' }, v.page === 'all')}
          ${navItem('Virtual machines', '🖥️', { page: 'list', type: 'vm' }, isList('vm'))}
          ${navItem('Storage accounts', '🗄️', { page: 'list', type: 'storage' }, isList('storage'))}
          ${navItem('App Services', '🌍', { page: 'list', type: 'webapp' }, isList('webapp'))}
          ${navItem('Cost Management', '💰', { page: 'cost' }, v.page === 'cost')}
        </nav>
        <div class="min-w-0 flex-1 p-4">
          <div class="mb-3 flex gap-1 overflow-x-auto sm:hidden">${[['🏠', { page: 'home' }], ['➕', { page: 'create' }], ['📦', { page: 'rgs' }], ['🗂️', { page: 'all' }], ['💰', { page: 'cost' }]].map(([i, to]) => `<button type="button" data-act="nav" data-arg='${JSON.stringify(to)}' class="rounded-md border border-default px-3 py-1.5">${i}</button>`).join('')}</div>
          ${this.notice ? `<div class="mb-3 rounded-md px-3 py-2 text-sm ${this.notice.kind === 'ok' ? 'bg-[var(--ok-soft)] text-[var(--ok)]' : this.notice.kind === 'bad' ? 'bg-[var(--bad-soft)] text-[var(--bad)]' : 'bg-[var(--pastel-yellow)]'}" role="status">${esc(this.notice.text)}</div>` : ''}
          ${this.deploying ? this.deployingView() : this.page()}
        </div>
      </div>`;
  }

  private deployingView() {
    return `<div class="grid place-items-center py-16 text-center"><div class="size-12 animate-spin rounded-full border-4 border-[#deecf9] border-t-[#0078d4]"></div><p class="mt-4 font-semibold">Deployment is in progress…</p><p class="text-sm text-muted">Azure Resource Manager is creating your resources.</p></div>`;
  }

  private page(): string {
    const v = this.view;
    const sim = this.sim;
    const h1 = (t: string, sub = '') => `<h3 class="text-xl font-semibold">${t}</h3>${sub ? `<p class="text-sm text-muted">${sub}</p>` : ''}`;
    const rgOpts = () => sim.rgs.map((g) => `<option value="${esc(g.name)}">${esc(g.name)}</option>`).join('');
    const needRg = () => (sim.rgs.length ? '' : `<p class="rounded-md bg-[var(--pastel-yellow)] p-3 text-sm">Every resource lives in a resource group. ${btn('Create a resource group first', 'nav', `data-arg='{"page":"create-rg"}'`, 'primary')}</p>`);
    const resTable = (list: Res[]) =>
      list.length
        ? `<div class="mt-3 overflow-x-auto rounded-md border border-default"><table class="w-full text-sm"><thead class="bg-[var(--pastel-grey)] text-left"><tr><th class="p-2">Name</th><th class="p-2">Type</th><th class="p-2">Resource group</th><th class="p-2">Location</th><th class="p-2">Cost/mo*</th></tr></thead><tbody>${list.map((r) => `<tr class="border-t border-default"><td class="p-2"><button type="button" class="text-[#0078d4] hover:underline" data-act="nav" data-arg='${JSON.stringify({ page: 'res', id: r.id })}'>${TYPE_INFO[r.type].icon} ${esc(r.name)}</button></td><td class="p-2">${TYPE_INFO[r.type].label}</td><td class="p-2">${esc(r.rg)}</td><td class="p-2">${REGIONS[r.location]}</td><td class="p-2">${money(sim.hourly(r) * 730)}</td></tr>`).join('')}</tbody></table></div>`
        : `<p class="mt-3 text-sm text-muted">No resources yet.</p>`;

    switch (v.page) {
      case 'home':
        return `${h1('Welcome to Azure (practice)', SUB_NAME)}
          <div class="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            ${[['➕', 'Create a resource', { page: 'create' }], ['📦', 'Resource groups', { page: 'rgs' }], ['🖥️', 'Virtual machines', { page: 'list', type: 'vm' }], ['🗄️', 'Storage accounts', { page: 'list', type: 'storage' }], ['🌍', 'App Services', { page: 'list', type: 'webapp' }], ['💰', 'Cost Management', { page: 'cost' }]]
              .map(([i, t, to]) => `<button type="button" data-act="nav" data-arg='${JSON.stringify(to)}' class="rounded-lg border border-default bg-[var(--card)] p-3 text-left hover:border-[#0078d4]"><span class="text-2xl">${i}</span><span class="mt-1 block text-sm font-semibold">${t}</span></button>`).join('')}
          </div>
          <h4 class="mt-6 font-semibold">Recent resources</h4>${resTable(sim.res.slice(-6).reverse())}`;
      case 'create':
        return `${h1('Create a resource')}<div class="mt-4 grid gap-3 sm:grid-cols-2">
          ${[['📦', 'Resource group', 'A folder that holds related resources.', 'create-rg'], ['🖥️', 'Virtual machine', 'IaaS: a computer in the cloud.', 'create-vm'], ['🗄️', 'Storage account', 'Store files, blobs, queues and tables.', 'create-storage'], ['🌍', 'Web App', 'PaaS: host a website without managing servers.', 'create-webapp']]
            .map(([i, t, d, p]) => `<button type="button" data-act="nav" data-arg='{"page":"${p}"}' class="flex gap-3 rounded-lg border border-default bg-[var(--card)] p-4 text-left hover:border-[#0078d4]"><span class="text-3xl">${i}</span><span><span class="block font-semibold">${t}</span><span class="text-sm text-muted">${d}</span></span></button>`).join('')}</div>`;
      case 'create-rg':
        return `${h1('Create a resource group')}<form data-form="rg" class="mt-4 max-w-lg space-y-3">
          ${field('Subscription', `<input class="${inputCls}" value="${SUB_NAME}" disabled>`)}
          ${field('Resource group name *', `<input name="name" required class="${inputCls}" placeholder="rg-learn-azure">`, 'Tip: start with rg- so it is easy to recognise.')}
          ${field('Region *', `<select name="region" class="${inputCls}">${regionOpts()}</select>`, 'Where the resource group’s metadata is stored. Resources inside can be in other regions.')}
          <div class="grid grid-cols-2 gap-2">${field('Tag name', `<input name="tag-key" class="${inputCls}" placeholder="env">`)}${field('Tag value', `<input name="tag-value" class="${inputCls}" placeholder="learning">`)}</div>
          <button class="rounded-md bg-[#0078d4] px-4 py-2 text-sm font-semibold text-white">Review + create</button></form>`;
      case 'create-vm':
        return `${h1('Create a virtual machine', 'IaaS: you manage the operating system, Microsoft manages the hardware.')}${needRg()}${sim.rgs.length ? `<form data-form="vm" class="mt-4 grid max-w-2xl gap-3 sm:grid-cols-2">
          ${field('Resource group *', `<select name="rg" class="${inputCls}">${rgOpts()}</select>`)}
          ${field('Virtual machine name *', `<input name="name" required class="${inputCls}" placeholder="web01">`)}
          ${field('Region', `<select name="region" class="${inputCls}">${regionOpts(sim.rgs[0].location)}</select>`)}
          ${field('Availability options', `<select name="zone" class="${inputCls}"><option value="">No infrastructure redundancy required</option><option value="1">Availability zone 1</option><option value="2">Availability zone 2</option><option value="3">Availability zone 3</option></select>`)}
          ${field('Image', `<select name="vm-image" class="${inputCls}">${Object.entries(IMAGES).map(([k, i]) => `<option value="${k}">${i.label}</option>`).join('')}</select>`)}
          ${field('Size', `<select name="vm-size" class="${inputCls}">${Object.entries(VM_SIZES).map(([k, s]) => `<option value="${k}">${k} · ${s.cpu} vCPU, ${s.ram} GiB</option>`).join('')}</select>`)}
          ${field('Administrator username', `<input name="admin" class="${inputCls}" value="azureuser">`)}
          ${field('Public inbound ports', `<select name="ports" class="${inputCls}"><option value="none">None (most secure)</option><option value="22">Allow SSH (22)</option><option value="3389">Allow RDP (3389)</option></select>`, '⚠️ Opening ports exposes the VM to the internet. In real projects use Azure Bastion instead.')}
          <p class="rounded-md bg-[var(--pastel-blue)] p-3 text-sm sm:col-span-2">💰 Estimated: <strong id="vm-cost">${money(VM_SIZES.Standard_B1s.hr * 730)} per month (${money(VM_SIZES.Standard_B1s.hr)}/hour) while running</strong> <span class="text-xs text-muted">(illustrative prices)</span></p>
          <div class="sm:col-span-2"><button class="rounded-md bg-[#0078d4] px-4 py-2 text-sm font-semibold text-white">Review + create</button></div></form>` : ''}`;
      case 'create-storage':
        return `${h1('Create a storage account')}${needRg()}${sim.rgs.length ? `<form data-form="storage" class="mt-4 grid max-w-2xl gap-3 sm:grid-cols-2">
          ${field('Resource group *', `<select name="rg" class="${inputCls}">${rgOpts()}</select>`)}
          ${field('Storage account name *', `<input name="st-name" required class="${inputCls}" placeholder="stlearn12345" autocomplete="off"><span id="st-hint" class="mt-1 block text-xs"></span>`, '3–24 lowercase letters and numbers, unique across all of Azure.')}
          ${field('Region', `<select name="region" class="${inputCls}">${regionOpts(sim.rgs[0].location)}</select>`)}
          ${field('Redundancy', `<select name="sku" class="${inputCls}">${Object.entries(STORAGE_SKUS).map(([k, s]) => `<option value="${k}" ${k === 'Standard_LRS' ? 'selected' : ''}>${s.label}</option>`).join('')}</select>`, 'LRS = 3 copies in one datacenter · ZRS = across 3 zones · GRS = plus a copy in another region.')}
          <div class="sm:col-span-2"><button class="rounded-md bg-[#0078d4] px-4 py-2 text-sm font-semibold text-white">Review + create</button></div></form>` : ''}`;
      case 'create-webapp':
        return `${h1('Create a Web App', 'PaaS: Microsoft runs the servers and OS. You bring your code.')}${needRg()}${sim.rgs.length ? `<form data-form="webapp" class="mt-4 grid max-w-2xl gap-3 sm:grid-cols-2">
          ${field('Resource group *', `<select name="rg" class="${inputCls}">${rgOpts()}</select>`)}
          ${field('Name *', `<input name="wa-name" required class="${inputCls}" placeholder="my-first-app-123" autocomplete="off"><span id="wa-hint" class="mt-1 block text-xs"></span>`, 'Becomes name.azurewebsites.net, so it must be globally unique.')}
          ${field('Runtime stack', `<select name="runtime" class="${inputCls}">${RUNTIMES.map((r) => `<option>${r}</option>`).join('')}</select>`)}
          ${field('Region', `<select name="region" class="${inputCls}">${regionOpts(sim.rgs[0].location)}</select>`)}
          ${field('Pricing plan', `<select name="sku" class="${inputCls}">${Object.entries(PLAN_SKUS).map(([k, s]) => `<option value="${k}">${s.label} · ${money(s.hr * 730)}/mo</option>`).join('')}</select>`)}
          <div class="sm:col-span-2"><button class="rounded-md bg-[#0078d4] px-4 py-2 text-sm font-semibold text-white">Review + create</button></div></form>` : ''}`;
      case 'rgs':
        return `<div class="flex items-center justify-between">${h1('Resource groups')}${btn('➕ Create', 'nav', `data-arg='{"page":"create-rg"}'`, 'primary')}</div>
          ${sim.rgs.length ? `<div class="mt-3 overflow-x-auto rounded-md border border-default"><table class="w-full text-sm"><thead class="bg-[var(--pastel-grey)] text-left"><tr><th class="p-2">Name</th><th class="p-2">Location</th><th class="p-2">Resources</th><th class="p-2">Locks</th></tr></thead><tbody>${sim.rgs.map((g) => `<tr class="border-t border-default"><td class="p-2"><button type="button" class="text-[#0078d4] hover:underline" data-act="nav" data-arg='${JSON.stringify({ page: 'rg', name: g.name })}'>📦 ${esc(g.name)}</button></td><td class="p-2">${REGIONS[g.location]}</td><td class="p-2">${sim.inRg(g.name).length}</td><td class="p-2">${g.locks.map((l) => `🔒 ${l.level}`).join(', ') || '–'}</td></tr>`).join('')}</tbody></table></div>` : `<p class="mt-3 text-sm text-muted">No resource groups yet.</p>`}`;
      case 'all':
        return `${h1('All resources')}${resTable(sim.res)}`;
      case 'list': {
        const label = TYPE_INFO[v.type].label + 's';
        const create = v.type === 'vm' ? 'create-vm' : v.type === 'storage' ? 'create-storage' : v.type === 'webapp' ? 'create-webapp' : '';
        return `<div class="flex items-center justify-between">${h1(label)}${create ? btn('➕ Create', 'nav', `data-arg='{"page":"${create}"}'`, 'primary') : ''}</div>${resTable(sim.res.filter((r) => r.type === v.type))}`;
      }
      case 'cost': {
        const total = sim.totalHourly();
        return `${h1('Cost Management (simulated)', 'Illustrative prices to show how cloud costs work. Not real Azure prices.')}
          <div class="mt-4 grid gap-3 sm:grid-cols-2"><div class="rounded-lg bg-[var(--pastel-blue)] p-4"><p class="text-sm">Estimated per month</p><p class="text-3xl font-bold">${money(total * 730)}</p></div><div class="rounded-lg bg-[var(--pastel-green)] p-4"><p class="text-sm">Per hour right now</p><p class="text-3xl font-bold">${money(total)}</p></div></div>
          ${resTable(sim.res.filter((r) => sim.hourly(r) > 0 || r.type === 'vm'))}
          <p class="mt-3 text-xs text-muted">💡 Deallocated VMs cost nothing for compute, but their disks still cost money. Deleting a resource group removes everything inside it.</p>`;
      }
      case 'rg': {
        const g = sim.rg(v.name);
        if (!g) return `<p>Resource group not found.</p>`;
        return `<div class="flex flex-wrap items-center justify-between gap-2">${h1(`📦 ${esc(g.name)}`, `Resource group · ${REGIONS[g.location]}`)}${btn('🗑️ Delete resource group', 'del-rg', `data-arg="${esc(g.name)}"`, 'danger')}</div>
          <h4 class="mt-4 font-semibold">Resources (${sim.inRg(g.name).length})</h4>${resTable(sim.inRg(g.name))}
          <div class="mt-5 grid gap-4 md:grid-cols-2">
            <div class="rounded-lg border border-default p-3"><h4 class="font-semibold">🏷️ Tags</h4>
              <p class="mt-2 flex flex-wrap gap-1.5">${Object.entries(g.tags).map(([k, val]) => `<span class="chip">${esc(k)} : ${esc(val)} <button type="button" data-act="del-tag" data-arg="${esc(k)}" aria-label="Remove tag">✕</button></span>`).join('') || '<span class="text-sm text-muted">No tags</span>'}</p>
              <form data-form="tag" class="mt-2 flex gap-2"><input name="key" placeholder="name" class="${inputCls} !mt-0"><input name="value" placeholder="value" class="${inputCls} !mt-0"><button class="rounded-md border border-default px-3 text-sm">Add</button></form></div>
            <div class="rounded-lg border border-default p-3"><h4 class="font-semibold">🔒 Locks</h4>
              <ul class="mt-2 space-y-1 text-sm">${g.locks.map((l) => `<li class="flex items-center justify-between rounded bg-[var(--pastel-yellow)] px-2 py-1">${esc(l.name)} · ${l.level} ${btn('Delete', 'del-lock', `data-arg="${esc(l.name)}"`)}</li>`).join('') || '<li class="text-muted">No locks</li>'}</ul>
              <form data-form="lock" class="mt-2 flex gap-2"><input name="name" required placeholder="lock name" class="${inputCls} !mt-0"><select name="level" class="${inputCls} !mt-0"><option value="CanNotDelete">Delete</option><option value="ReadOnly">Read-only</option></select><button class="rounded-md border border-default px-3 text-sm">Add</button></form></div>
          </div>`;
      }
      case 'res': {
        const r = this.cur();
        if (!r) return `<p>This resource no longer exists. ${btn('Back to resource groups', 'nav', `data-arg='{"page":"rgs"}'`)}</p>`;
        const row = (k: string, val: unknown) => `<div class="flex justify-between gap-3 border-b border-default py-1.5 text-sm"><span class="text-muted">${k}</span><span class="text-right font-medium">${esc(val)}</span></div>`;
        const cost = `<p class="mt-3 rounded-md bg-[var(--pastel-blue)] p-2 text-sm">💰 ${money(sim.hourly(r))}/hour · ${money(sim.hourly(r) * 730)}/month <span class="text-xs text-muted">(illustrative)</span></p>`;
        let body = '';
        if (r.type === 'vm') {
          const p = r.props;
          const status = p.power === 'running' ? '🟢 Running' : p.power === 'stopped' ? '🟠 Stopped (still allocated, still billed)' : '⚪ Stopped (deallocated)';
          body = `<div class="mt-3 flex flex-wrap gap-2">${btn('▶ Start', 'vm-power', 'data-arg="start"')}${btn('⏹ Stop', 'vm-power', 'data-arg="deallocate"')}${btn('🔁 Restart', 'vm-power', 'data-arg="restart"')}${btn('Shut down inside OS', 'vm-stop-os')}${btn('🗑️ Delete', 'del-res', '', 'danger')}</div>
            <div class="mt-3 grid gap-x-6 md:grid-cols-2">${row('Status', status)}${row('Size', `${p.size} (${VM_SIZES[p.size].cpu} vCPU, ${VM_SIZES[p.size].ram} GiB)`)}${row('Operating system', `${p.os} · ${IMAGES[p.image].label}`)}${row('Public IP', p.publicIp)}${row('Private IP', p.privateIp)}${row('Availability zone', p.zone || 'None')}${row('Inbound ports', p.ports === 'none' ? 'None' : p.ports)}${row('OS disk', p.disk)}${row('Network interface', p.nic)}</div>
            <p class="mt-3 rounded-md bg-[var(--pastel-yellow)] p-2 text-xs">🧩 To run this VM, Azure also created a disk, a network interface, a virtual network, a public IP and a network security group. Open the resource group to see them.</p>`;
        } else if (r.type === 'storage') {
          body = `<div class="mt-3 grid gap-x-6 md:grid-cols-2">${row('Redundancy', STORAGE_SKUS[r.props.sku].label)}${row('Kind', r.props.kind)}${row('Access tier', r.props.accessTier)}${row('Blob endpoint', r.props.endpoint)}</div>
            <form data-form="sku" class="mt-3 flex flex-wrap items-end gap-2">${field('Change redundancy', `<select name="sku" class="${inputCls}">${Object.entries(STORAGE_SKUS).map(([k, s]) => `<option value="${k}" ${k === r.props.sku ? 'selected' : ''}>${s.label}</option>`).join('')}</select>`)}<button class="rounded-md bg-[#0078d4] px-3 py-2 text-sm font-semibold text-white">Save</button></form>
            <div class="mt-3">${btn('🗑️ Delete', 'del-res', '', 'danger')}</div>`;
        } else if (r.type === 'webapp') {
          body = `<div class="mt-3 flex flex-wrap gap-2">${btn('🌐 Browse', 'browse', '', 'primary')}${btn('🗑️ Delete', 'del-res', '', 'danger')}</div><div class="mt-3 grid gap-x-6 md:grid-cols-2">${row('URL', `https://${r.props.host}`)}${row('Runtime', r.props.runtime)}${row('App Service plan', r.props.plan)}${row('State', r.props.state)}</div>`;
        } else {
          body = `<div class="mt-3 grid gap-x-6 md:grid-cols-2">${Object.entries(r.props).map(([k, val]) => row(k, Array.isArray(val) ? val.join(', ') || '–' : val)).join('')}</div><div class="mt-3">${btn('🗑️ Delete', 'del-res', '', 'danger')}</div>`;
        }
        return `${h1(`${TYPE_INFO[r.type].icon} ${esc(r.name)}`, `${TYPE_INFO[r.type].label} · ${REGIONS[r.location]} · resource group <button type="button" class="text-[#0078d4] hover:underline" data-act="nav" data-arg='${JSON.stringify({ page: 'rg', name: r.rg })}'>${esc(r.rg)}</button>`)}${body}${cost}`;
      }
    }
    return '';
  }
}
