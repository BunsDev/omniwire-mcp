---
name: omniwire
version: 2.1.0
description: "Control your entire server mesh from chat. Execute commands, transfer files, manage Docker, sync configs, and monitor all your nodes — VPS, Raspberry Pi, laptop, desktop — through one unified interface. 30 MCP tools. Works on any architecture (x64, ARM, Apple Silicon). SSH2 with compression, encrypted config sync, 1Password secrets backend. Just say what you need and your agent runs it across every machine."
tags: [infrastructure, mesh, ssh, devops, servers, vps, docker, remote, mcp, file-transfer, monitoring, config-sync, secrets, multi-node, raspberry-pi, arm]
author: VoidChecksum
homepage: https://github.com/VoidChecksum/omniwire
metadata:
  openclaw:
    emoji: "🌐"
    requires:
      bins: ["node", "ssh"]
      env: []
    stateDirs: ["~/.omniwire"]
    persistence: "This skill uses OmniWire (npm package) to manage SSH connections to your mesh nodes. Config lives in ~/.omniwire/mesh.json. Encrypted secrets in ~/.omniwire/secret.key. No data leaves your network — all operations run over your own SSH connections."
---

# OmniWire — Mesh Control for OpenClaw

> **Your entire infrastructure, controlled from chat.**

Tell your agent to run commands on any server, transfer files between nodes, manage Docker containers, check system health, sync configurations, and manage secrets — across every machine you own. One skill. Any architecture.

```
You: check disk usage on all my servers

Agent: [runs across all nodes simultaneously]

  [server1] (142ms)
  /dev/sda1    1.2T  178G   16%  /

  [server2] (198ms)
  /dev/sda1    50G   31G    61%  /

  [rpi] (215ms)
  /dev/mmcblk0  32G   6.4G  20%  /
```

---

## What It Does

OmniWire connects all your machines (VPS, laptops, Raspberry Pis, desktops) into one mesh that your OpenClaw agent can control. It provides **30 tools** across 8 categories:

| Category | What your agent can do |
|----------|----------------------|
| **Execute** | Run any command on any node or all nodes at once |
| **Files** | Read, write, list, search files on any machine |
| **Transfer** | Move files between nodes (auto-selects fastest method) |
| **Docker** | Manage containers, images, logs across nodes |
| **Monitor** | CPU, memory, disk, network, processes — live |
| **Services** | Start/stop/restart systemd services remotely |
| **Secrets** | Store, retrieve, sync secrets (1Password or file-based) |
| **Sync** | Keep configs synchronized across all machines |

---

## Setup — 3 Steps

### Step 1: Install OmniWire

> **AGENT: Run this via exec. User just clicks Approve.**

```
npm install -g omniwire
```

Works on: Linux (x64, ARM, armv7l), macOS (Intel + Apple Silicon), Windows, Raspberry Pi.

### Step 2: Configure Your Mesh

Create the mesh config. Ask the user for their server details:

> **AGENT: Ask the user:**
> "What servers do you want to control? I need for each one:
> - A name (e.g., `server1`, `rpi`, `laptop`)
> - IP address or hostname
> - SSH user (usually `root`)
> - SSH key filename in ~/.ssh/ (e.g., `id_ed25519`)"

Then create the config via exec:

```
mkdir -p ~/.omniwire
cat > ~/.omniwire/mesh.json << 'EOF'
{
  "nodes": [
    {
      "id": "SERVER_NAME",
      "host": "SERVER_IP",
      "user": "root",
      "identityFile": "id_ed25519",
      "role": "storage",
      "tags": ["vps"]
    }
  ]
}
EOF
```

**Roles:** `storage` (file server/DB), `compute` (heavy processing), `gpu+browser` (GPU/display), or omit for general.

### Step 3: Verify

```
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}' | omniwire --stdio --no-sync 2>/dev/null | head -1
```

Should show `omniwire v2.1.0`. Done.

---

## How to Use — Just Talk

Once set up, just tell your agent what you need. It uses OmniWire's MCP tools automatically.

### Run commands anywhere

```
You: restart nginx on server1

Agent: [exec on server1] systemctl restart nginx
  ✓ nginx restarted

You: show me what's using the most CPU on all servers

Agent: [broadcast to all nodes]
  [server1] node (45% CPU) — omnibus-hub
  [server2] python3 (23% CPU) — training job
  [rpi] chromium (12% CPU) — dashboard
```

### Transfer files between machines

```
You: copy /var/log/app.log from server1 to server2

Agent: Transferred 4.2MB via netcat+gzip in 180ms (23.3 MB/s)
```

OmniWire auto-selects the fastest transfer mode:
- **SFTP** for files under 10MB (zero overhead)
- **netcat+gzip** for 10MB-1GB (compressed TCP stream)
- **aria2c** for files over 1GB (16 parallel connections)

### Manage Docker

```
You: what containers are running on server1?

Agent: [server1] docker ps
  12 running · 3 stopped
  kali-htb  redamon-agent  omnibus-hub  neo4j  postgres ...

You: restart the neo4j container

Agent: [server1] docker restart neo4j
  ✓ neo4j restarted (healthy)
```

### Monitor everything

```
You: how are my servers doing?

Agent: [mesh status — all nodes parallel]

  server1 (storage)    | 10.0.0.1 | ONLINE | 142ms | load=2.3 | mem=26% | disk=16%
  server2 (compute)    | 10.0.0.2 | ONLINE | 198ms | load=1.4 | mem=27% | disk=61%
  rpi     (gpu)        | 10.0.0.3 | ONLINE | 215ms | load=0.7 | mem=21% | disk=20%
```

### Manage secrets across nodes

```
You: store my API key across all servers

Agent: What's the key name and value?

You: OPENAI_KEY = sk-proj-abc123...

Agent: [omniwire_secrets set + sync]
  server1: OK
  server2: OK
  rpi: OK
  ✓ Synced OPENAI_KEY to 3 nodes
```

Supports **1Password** backend — configure in `~/.omniwire/secrets.json`:
```json
{"backend": "onepassword", "vault": "Infrastructure"}
```

### Sync configurations

CyberSync keeps your AI tool configs (Claude Code, OpenCode, OpenClaw, Codex, Gemini) synchronized across all machines:

```
You: sync my claude code settings to all servers

Agent: [cybersync_sync_now]
  Reconciled: pushed=3, pulled=0, conflicts=0
  ✓ All nodes up to date
```

Sensitive files (settings.json, credentials, memory) are encrypted at rest with **XChaCha20-Poly1305**.

---

## All 30 Tools

Your agent has access to these automatically via MCP:

### Core (22 tools)
| Tool | Description |
|------|-------------|
| `omniwire_exec` | Execute command on a specific node |
| `omniwire_broadcast` | Execute on all nodes simultaneously |
| `omniwire_mesh_status` | Health + resources for all nodes |
| `omniwire_node_info` | Detailed info for one node |
| `omniwire_read_file` | Read file from any node |
| `omniwire_write_file` | Write file to any node |
| `omniwire_transfer_file` | Copy files between nodes (auto mode) |
| `omniwire_list_files` | List directory on any node |
| `omniwire_find_files` | Search files across all nodes |
| `omniwire_tail_log` | Read last N lines of a log |
| `omniwire_process_list` | List processes (filterable) |
| `omniwire_disk_usage` | Disk usage across nodes |
| `omniwire_install_package` | Install via apt/npm/pip |
| `omniwire_service_control` | systemd start/stop/restart/status |
| `omniwire_docker` | Docker commands on any node |
| `omniwire_open_browser` | Open URL on GUI node |
| `omniwire_port_forward` | SSH tunnel management |
| `omniwire_deploy` | Push files to multiple nodes |
| `omniwire_kernel` | dmesg, sysctl, modprobe, strace, perf |
| `omniwire_shell` | Persistent shell sessions (preserves state) |
| `omniwire_stream` | Real-time streaming output |
| `omniwire_live_monitor` | Live system metrics snapshot |

### CyberSync (8 tools)
| Tool | Description |
|------|-------------|
| `cybersync_status` | Sync status, item counts, heartbeats |
| `cybersync_sync_now` | Force immediate reconciliation |
| `cybersync_diff` | Show what needs syncing |
| `cybersync_history` | Sync event log |
| `cybersync_search_knowledge` | Search unified knowledge base |
| `cybersync_get_memory` | Query Claude memory from DB |
| `cybersync_manifest` | Show tracked files per tool |
| `cybersync_force_push` | Push specific file to all nodes |

### Secrets + Update
| Tool | Description |
|------|-------------|
| `omniwire_secrets` | Get/set/delete/list/sync secrets |
| `omniwire_update` | Check for updates + self-update |

---

## Performance

| Operation | Speed |
|-----------|-------|
| Command execution | ~120ms per node |
| File read (< 1MB) | ~80ms (SFTP) |
| File transfer (10MB) | ~200ms (gzip netcat) |
| Config sync (push all) | ~200ms (parallel) |
| Mesh status check | ~150ms (cached 5s) |

All connections use **SSH2 with zlib compression** over your existing network (WireGuard, Tailscale, direct SSH — anything works).

---

## Architecture & Platform Support

| Platform | Architecture | Status |
|----------|-------------|--------|
| Linux | x64 | ✅ |
| Linux | arm64 (RPi 4/5, AWS Graviton) | ✅ |
| Linux | armv7l (RPi 3, older ARM) | ✅ |
| macOS | Intel (x64) | ✅ |
| macOS | Apple Silicon (arm64) | ✅ |
| Windows | x64 | ✅ |

No native compilation required — pure JavaScript + SSH2. `npm install -g omniwire` works everywhere Node.js runs.

---

## Security

- **Transport**: SSH2 with zlib compression (encrypted by default)
- **At-rest encryption**: XChaCha20-Poly1305 for sensitive sync items
- **Secrets**: 1Password, file-based, or env var backends
- **No external services**: Everything runs on your own infrastructure
- **Key management**: Master key in `~/.omniwire/secret.key` (generated locally, never transmitted)

---

## Agent Instructions

### When to use OmniWire tools

Use OmniWire tools when the user:
- Mentions servers, VPS, nodes, infrastructure, or "my machines"
- Wants to run commands remotely ("run X on server1", "check Y on all servers")
- Needs to transfer, read, or write files on remote machines
- Asks about Docker containers on remote nodes
- Wants to monitor system resources across machines
- Needs to manage secrets or sync configurations
- Mentions "deploy", "restart service", "install package" on remote targets

### How to pick the right tool

- **Single node command** → `omniwire_exec`
- **All nodes at once** → `omniwire_broadcast`
- **Read a remote file** → `omniwire_read_file`
- **Copy between nodes** → `omniwire_transfer_file`
- **Docker anything** → `omniwire_docker`
- **Check health** → `omniwire_mesh_status`
- **Store a secret** → `omniwire_secrets` (action: set)
- **Sync configs** → `cybersync_sync_now`

### Default node selection

If the user doesn't specify a node:
- File storage operations → use the node with `role: "storage"`
- Docker operations → use the node with `role: "storage"` (usually the Docker host)
- Browser operations → use the node with `role: "gpu+browser"`
- Heavy compute → use `role: "compute"`
- If unclear, ask: "Which server should I run this on?"

### Error handling

- If a node is offline, tell the user and offer to try another node
- If a command fails, show the error and suggest fixes
- If transfer fails, retry with a different mode

---

## Links

- **GitHub**: https://github.com/VoidChecksum/omniwire
- **NPM**: https://www.npmjs.com/package/omniwire
- **Issues**: https://github.com/VoidChecksum/omniwire/issues

---

## License

MIT — Use freely, modify, distribute.

---

*OmniWire — Every machine, one agent, zero friction.*
