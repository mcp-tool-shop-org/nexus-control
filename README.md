<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/nexus-control/readme.png" alt="Nexus Control" width="400" />
</p>

<p align="center">
  Orchestration and approval layer for nexus-router executions.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/nexus-control/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/nexus-control/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/nexus-control"><img src="https://codecov.io/gh/mcp-tool-shop-org/nexus-control/branch/main/graph/badge.svg" alt="Codecov" /></a>
  <a href="https://pypi.org/project/nexus-control/"><img src="https://img.shields.io/pypi/v/nexus-control" alt="PyPI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/nexus-control/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

---



A thin control plane that turns "router can execute" into "org can safely decide to execute" — with cryptographic proof.

## Brand + Tool ID

| Key | Value |
|-----|-------|
| Brand / repo | `nexus-control` |
| Python package | `nexus_control` |
| Author | [mcp-tool-shop](https://github.com/mcp-tool-shop) |
| License | MIT |

## Core Promise

Every execution is tied to:
- A **decision** (the request + policy)
- A **policy** (approval rules, allowed modes, constraints)
- An **approval trail** (who approved, when, with what comment)
- A **nexus-router run_id** (for full execution audit)
- An **audit package** (cryptographic binding of governance to execution)

Everything is exportable, verifiable, and replayable.

> See [ARCHITECTURE.md](ARCHITECTURE.md) for the full mental model and design guarantees.

## Installation

```bash
pip install nexus-control
```

Or from source:
```bash
git clone https://github.com/mcp-tool-shop-org/nexus-control
cd nexus-control
pip install -e ".[dev]"
```

## Quick Start

```python
from nexus_control import NexusControlTools
from nexus_control.events import Actor

# Initialize (uses in-memory SQLite by default)
tools = NexusControlTools(db_path="decisions.db")

# 1. Create a request
result = tools.request(
    goal="Rotate production API keys",
    actor=Actor(type="human", id="alice@example.com"),
    mode="apply",
    min_approvals=2,
    labels=["prod", "security"],
)
request_id = result.data["request_id"]

# 2. Get approvals
tools.approve(request_id, actor=Actor(type="human", id="alice@example.com"))
tools.approve(request_id, actor=Actor(type="human", id="bob@example.com"))

# 3. Execute (with your router)
result = tools.execute(
    request_id=request_id,
    adapter_id="subprocess:mcpt:key-rotation",
    actor=Actor(type="system", id="scheduler"),
    router=your_router,  # RouterProtocol implementation
)

print(f"Run ID: {result.data['run_id']}")

# 4. Export audit package (cryptographic proof of governance + execution)
audit = tools.export_audit_package(request_id)
print(audit.data["digest"])  # sha256:...
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `nexus-control.request` | Create an execution request with goal, policy, and approvers |
| `nexus-control.approve` | Approve a request (supports N-of-M approvals) |
| `nexus-control.execute` | Execute approved request via nexus-router |
| `nexus-control.status` | Get request state and linked run status |
| `nexus-control.inspect` | Read-only introspection with human-readable output |
| `nexus-control.template.create` | Create a named, immutable policy template |
| `nexus-control.template.get` | Retrieve a template by name |
| `nexus-control.template.list` | List all templates with optional label filtering |
| `nexus-control.export_bundle` | Export a decision as a portable, integrity-verified bundle |
| `nexus-control.import_bundle` | Import a bundle with conflict modes and replay validation |
| `nexus-control.export_audit_package` | Export audit package binding governance to execution |

## Audit Packages (v0.6.0)

A single JSON artifact that cryptographically binds:
- **What was allowed** (control bundle)
- **What actually ran** (router execution)
- **Why it was allowed** (control-router link)

Into one verifiable `binding_digest`.

```python
from nexus_control import export_audit_package, verify_audit_package

# Export
result = export_audit_package(store, decision_id)
package = result.package

# Verify (6 independent checks, no short-circuiting)
verification = verify_audit_package(package)
assert verification.ok
```

Two router modes:

| Mode | Description | Use Case |
|------|-------------|----------|
| **Reference** | `run_id` + `router_digest` | CI, internal systems |
| **Embedded** | Full router bundle included | Regulators, long-term archival |

## Decision Templates (v0.3.0)

Named, immutable policy bundles that can be reused across decisions:

```python
tools.template_create(
    name="prod-deploy",
    actor=Actor(type="human", id="platform-team"),
    min_approvals=2,
    allowed_modes=["dry_run", "apply"],
    require_adapter_capabilities=["timeout"],
    labels=["prod"],
)

# Use template with optional overrides
result = tools.request(
    goal="Deploy v2.1.0",
    actor=actor,
    template_name="prod-deploy",
    override_min_approvals=3,  # Stricter for this deploy
)
```

## Decision Lifecycle (v0.4.0)

Computed lifecycle with blocking reasons and timeline:

```python
from nexus_control import compute_lifecycle

lifecycle = compute_lifecycle(decision, events, policy)

# Blocking reasons (triage-ladder ordered)
for reason in lifecycle.blocking_reasons:
    print(f"{reason.code}: {reason.message}")

# Timeline with truncation
for entry in lifecycle.timeline:
    print(f"  {entry.seq}  {entry.label}")
```

## Export/Import Bundles (v0.5.0)

Portable, integrity-verified decision bundles:

```python
# Export
bundle_result = tools.export_bundle(decision_id)
bundle_json = bundle_result.data["canonical_json"]

# Import with conflict handling
import_result = tools.import_bundle(
    bundle_json,
    conflict_mode="new_decision_id",
    replay_after_import=True,
)
```

Conflict modes: `reject_on_conflict`, `new_decision_id`, `overwrite`

## Data Model

### Event-Sourced Design

All state is derived by replaying an immutable event log:

```
decisions (header)
  └── decision_events (append-only log)
        ├── DECISION_CREATED
        ├── POLICY_ATTACHED
        ├── APPROVAL_GRANTED
        ├── APPROVAL_REVOKED
        ├── EXECUTION_REQUESTED
        ├── EXECUTION_STARTED
        ├── EXECUTION_COMPLETED
        └── EXECUTION_FAILED
```

### Policy Model

```python
Policy(
    min_approvals=2,
    allowed_modes=["dry_run", "apply"],
    require_adapter_capabilities=["timeout"],
    max_steps=50,
    labels=["prod", "finance"],
)
```

### Approval Model

- Counted by distinct `actor.id`
- Can include `comment` and optional `expires_at`
- Can be revoked (before execution)
- Execution requires approvals to satisfy policy **at execution time**

## Development

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests (203 tests)
pytest

# Type check (strict mode)
pyright

# Lint
ruff check .
```

## Project Structure

```
nexus-control/
├── nexus_control/
│   ├── __init__.py          # Public API + version
│   ├── tool.py              # MCP tool entrypoints (11 tools)
│   ├── store.py             # SQLite event store
│   ├── events.py            # Event type definitions
│   ├── policy.py            # Policy validation + router compilation
│   ├── decision.py          # State machine + replay
│   ├── lifecycle.py         # Blocking reasons, timeline, progress
│   ├── template.py          # Named immutable policy templates
│   ├── export.py            # Decision bundle export
│   ├── import_.py           # Bundle import with conflict modes
│   ├── bundle.py            # Bundle types + digest computation
│   ├── audit_package.py     # Audit package types + verification
│   ├── audit_export.py      # Audit package export + rendering
│   ├── canonical_json.py    # Deterministic serialization
│   └── integrity.py         # SHA-256 helpers
├── schemas/                 # JSON schemas for tool inputs
├── tests/                   # 203 tests across 9 test files
├── ARCHITECTURE.md          # Mental model + design guarantees
├── QUICKSTART.md
├── README.md
└── pyproject.toml
```

## Security & Data Scope

- **Data touched:** in-memory approval policies, execution audit logs (SHA-256 integrity), tool call metadata. All data is ephemeral unless explicitly exported.
- **Data NOT touched:** no network requests beyond nexus-router communication, no filesystem writes (audit exports go to caller-specified paths), no OS credentials, no telemetry.
- **Permissions required:** none beyond Python process permissions.

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10/10 |
| B. Error Handling | 10/10 |
| C. Operator Docs | 10/10 |
| D. Shipping Hygiene | 10/10 |
| E. Identity (soft) | 10/10 |
| **Overall** | **50/50** |

> Assessed with [`@mcptoolshop/shipcheck`](https://github.com/mcp-tool-shop-org/shipcheck)

## License

MIT — see [LICENSE](LICENSE) for details.

---

Built by [MCP Tool Shop](https://mcp-tool-shop.github.io/)
