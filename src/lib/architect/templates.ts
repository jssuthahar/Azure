/**
 * Starter designs for the Architecture Builder. Two are deliberately broken
 * ("find and fix") so learners use the Check and Traffic tabs. Positions are
 * in the builder's canvas units (1600 × 1000).
 */
import type { Design, ArchNode, ArchLink, Kind, NsgRule } from './model';
import { CATALOG } from './model';

const n = (id: string, kind: Kind, name: string, x: number, y: number, parent?: string, props: Record<string, any> = {}): ArchNode => ({ id, kind, name, x, y, parent, props: { ...CATALOG[kind].defaults(), ...props } });
const l = (from: string, to: string, kind: ArchLink['kind']): ArchLink => ({ id: `l-${from}-${to}`, from, to, kind });
const rule = (name: string, priority: number, source: NsgRule['source'], port: NsgRule['port'], access: NsgRule['access'] = 'Allow'): NsgRule => ({ name, priority, source, port, access });

export interface Template { id: string; title: string; blurb: string; goal?: string; design: () => Design }

export const TEMPLATES: Template[] = [
  { id: 'blank', title: 'Blank canvas', blurb: 'Start from nothing.', design: () => ({ v: 1, name: 'My design', nodes: [], links: [] }) },
  {
    id: 'web-ha', title: 'Highly available web app', blurb: 'Two VMs in two zones behind a Standard public load balancer, with an NSG and Bastion.',
    design: () => ({
      v: 1, name: 'Highly available web app',
      nodes: [
        n('v1', 'vnet', 'vnet-web', 40, 40, undefined, { addressSpace: '10.10.0.0/16' }),
        n('s1', 'subnet', 'snet-web', 60, 90, 'v1', { prefix: '10.10.1.0/24' }),
        n('vm1', 'vm', 'vm-web-01', 80, 140, 's1', { zone: '1' }),
        n('vm2', 'vm', 'vm-web-02', 270, 140, 's1', { zone: '2' }),
        n('s2', 'subnet', 'AzureBastionSubnet', 490, 90, 'v1', { prefix: '10.10.2.0/26' }),
        n('b1', 'bastion', 'bastion-web', 510, 140, 's2'),
        n('nsg1', 'nsg', 'nsg-snet-web', 60, 330, undefined, { rules: [rule('Allow-HTTP-Internet', 100, 'Internet', 80)] }),
        n('lb1', 'lb', 'lb-web', 290, 330),
        n('p1', 'pip', 'pip-lb-web', 520, 330),
        n('p2', 'pip', 'pip-bastion', 760, 160),
      ],
      links: [l('nsg1', 's1', 'nsg'), l('lb1', 'vm1', 'backend'), l('lb1', 'vm2', 'backend'), l('p1', 'lb1', 'pip'), l('p2', 'b1', 'pip')],
    }),
  },
  {
    id: 'hub-spoke-broken', title: 'Hub and spoke (find 2 problems)', blurb: 'Two spokes peered to a hub with Azure Firewall. The spokes can’t talk, and one VM is wide open.', goal: 'Make vm-app1 reach vm-app2 on port 443 through the firewall, and close RDP to the internet.',
    design: () => ({
      v: 1, name: 'Hub and spoke',
      nodes: [
        n('h', 'vnet', 'vnet-hub', 250, 30, undefined, { addressSpace: '10.0.0.0/16' }),
        n('hs1', 'subnet', 'AzureFirewallSubnet', 270, 80, 'h', { prefix: '10.0.1.0/26' }),
        n('fw', 'firewall', 'afw-hub', 290, 130, 'hs1'),
        n('a', 'vnet', 'vnet-spoke1', 20, 330, undefined, { addressSpace: '10.1.0.0/16' }),
        n('as1', 'subnet', 'snet-app', 40, 380, 'a', { prefix: '10.1.1.0/24' }),
        n('vma', 'vm', 'vm-app1', 60, 430, 'as1', { os: 'Windows', appPort: '443' }),
        n('b', 'vnet', 'vnet-spoke2', 470, 330, undefined, { addressSpace: '10.2.0.0/16' }),
        n('bs1', 'subnet', 'snet-app', 490, 380, 'b', { prefix: '10.2.1.0/24' }),
        n('vmb', 'vm', 'vm-app2', 510, 430, 'bs1', { appPort: '443' }),
        n('pfw', 'pip', 'pip-afw', 660, 120),
        n('pvm', 'pip', 'pip-vm-app1', 20, 590),
        n('nsga', 'nsg', 'nsg-app1', 220, 590, undefined, { rules: [rule('Allow-RDP-Any', 100, 'Internet', 3389)] }),
      ],
      links: [l('h', 'a', 'peer'), l('h', 'b', 'peer'), l('pfw', 'fw', 'pip'), l('pvm', 'vma', 'pip'), l('nsga', 'vma', 'nsg')],
    }),
  },
  {
    id: 'private-storage-broken', title: 'Private storage (find 3 problems)', blurb: 'A VM that should read a storage account privately. It doesn’t, yet.', goal: 'Make vm-reports reach stcontosoreports privately with public access Disabled.',
    design: () => ({
      v: 1, name: 'Private storage',
      nodes: [
        n('v', 'vnet', 'vnet-data', 40, 40, undefined, { addressSpace: '10.30.0.0/16' }),
        n('s1', 'subnet', 'snet-app', 60, 90, 'v', { prefix: '10.30.1.0/24' }),
        n('vm', 'vm', 'vm-reports', 80, 140, 's1'),
        n('s2', 'subnet', 'snet-pe', 320, 90, 'v', { prefix: '10.31.2.0/24' }),
        n('pe', 'pe', 'pe-reports-blob', 340, 140, 's2'),
        n('st', 'storage', 'stcontosoreports', 640, 150, undefined, { publicAccess: 'Enabled' }),
      ],
      links: [l('pe', 'st', 'pe')],
    }),
  },
];
