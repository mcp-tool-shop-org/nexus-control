# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅ Yes    |
| < 1.0   | ❌ No     |

## Reporting a Vulnerability

Email: **64996768+mcp-tool-shop@users.noreply.github.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Version affected
- Potential impact

### Response timeline

| Action | Target |
|--------|--------|
| Acknowledge report | 48 hours |
| Assess severity | 7 days |
| Release fix | 30 days |

## Scope

This tool is an **orchestration and approval layer** for nexus-router executions.

- **Data touched:** in-memory approval policies, execution audit logs (SHA-256 integrity), tool call metadata. All data is ephemeral unless explicitly exported.
- **Data NOT touched:** no network requests beyond nexus-router communication, no filesystem writes (audit exports go to caller-specified paths), no OS credentials, no user data collection.
- **No telemetry** is collected or sent.
- **No secrets handling** — does not read, store, or transmit credentials.
