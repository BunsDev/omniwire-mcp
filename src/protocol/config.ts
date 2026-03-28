// OmniWire mesh configuration — CyberNord infrastructure
// v2.1: Multi-path connectivity (WireGuard → Tailscale → Public IP)

import { homedir } from 'node:os';
import { join } from 'node:path';
import type { MeshConfig, MeshNode, NodeRole } from './types.js';

const home = homedir();
const sshDir = join(home, '.ssh');

// Fallback host resolution order: WireGuard → Tailscale → Public IP
// NodeManager tries each in order until one connects
export interface HostFallback {
  readonly wg: string;
  readonly tailscale?: string;
  readonly publicIp?: string;
}

export const HOST_FALLBACKS: Record<string, HostFallback> = {
  contabo:   { wg: '10.10.0.1', tailscale: process.env.OW_CONTABO_TS ?? '', publicIp: process.env.OW_CONTABO_PUB ?? '' },
  hostinger: { wg: '10.10.0.2', tailscale: process.env.OW_HOSTINGER_TS ?? '', publicIp: process.env.OW_HOSTINGER_PUB ?? '' },
  thinkpad:  { wg: '10.10.0.4', tailscale: process.env.OW_THINKPAD_TS ?? '' },
};

const NODES: MeshNode[] = [
  {
    id: 'windows',
    alias: 'win',
    host: '127.0.0.1',
    port: 0,
    user: 'Admin',
    identityFile: '',
    os: 'windows',
    isLocal: true,
    tags: ['workstation', 'desktop'],
  } as MeshNode,
  {
    id: 'contabo',
    alias: 'c1',
    host: '10.10.0.1',
    port: 22,
    user: 'root',
    identityFile: join(sshDir, 'cybernord_contabo'),
    os: 'linux',
    isLocal: false,
    tags: ['vps', 'hub', 'docker', 'primary'],
  } as MeshNode,
  {
    id: 'hostinger',
    alias: 'h1',
    host: '10.10.0.2',
    port: 22,
    user: 'root',
    identityFile: join(sshDir, 'cybernord_vps'),
    os: 'linux',
    isLocal: false,
    tags: ['vps', 'secondary'],
  } as MeshNode,
  {
    id: 'thinkpad',
    alias: 'tp',
    host: '10.10.0.4',
    port: 22,
    user: 'root',
    identityFile: join(sshDir, 'cybernord_contabo'),
    os: 'linux',
    isLocal: false,
    tags: ['laptop', 'mobile'],
  } as MeshNode,
];

export const NODE_ROLES: Record<string, NodeRole> = {
  windows: 'controller',
  contabo: 'storage',
  hostinger: 'compute',
  thinkpad: 'gpu+browser',
};

export function getNodeForRole(role: NodeRole): MeshNode | undefined {
  const id = Object.entries(NODE_ROLES).find(([, r]) => r === role)?.[0];
  return id ? NODES.find((n) => n.id === id) : undefined;
}

export function getDefaultNodeForTask(task: 'storage' | 'browser' | 'compute' | 'local'): string {
  switch (task) {
    case 'storage': return 'contabo';
    case 'browser': return 'thinkpad';
    case 'compute': return 'contabo';
    case 'local': return 'windows';
  }
}

export const CONFIG: MeshConfig = {
  nodes: NODES,
  defaultNode: 'local',
  meshSubnet: '10.10.0.0/24',
  claudePath: 'claude',
};

export function findNode(query: string): MeshNode | undefined {
  const q = query.toLowerCase();
  return CONFIG.nodes.find(
    (n) => n.id === q || n.alias === q || n.host === q
  );
}

export function remoteNodes(): MeshNode[] {
  return CONFIG.nodes.filter((n) => !n.isLocal);
}

export function allNodes(): MeshNode[] {
  return [...CONFIG.nodes];
}

// Get ordered list of hosts to try for a node
export function getHostCandidates(nodeId: string): string[] {
  const fb = HOST_FALLBACKS[nodeId];
  if (!fb) return [NODES.find((n) => n.id === nodeId)?.host ?? ''];
  const hosts = [fb.wg];
  if (fb.tailscale) hosts.push(fb.tailscale);
  if (fb.publicIp) hosts.push(fb.publicIp);
  return hosts;
}
