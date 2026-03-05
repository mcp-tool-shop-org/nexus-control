---
title: Reference
description: Development setup, security model, exit codes, and project structure for Nexus Control.
sidebar:
  order: 5
---

## Development

### Prerequisites

- Python 3.11 or later
- pip with editable install support

### Setup

```bash
# Clone the repository
git clone https://github.com/mcp-tool-shop-org/nexus-control
cd nexus-control

# Install with dev dependencies
pip install -e ".[dev]"
```

### Running tests

Nexus Control has 203 tests across 9 test files:

```bash
# Run the full test suite
pytest

# Type check (strict mode)
pyright

# Lint
ruff check .
```

### Storage

By default, `NexusControlTools` uses in-memory SQLite. Pass a `db_path` to persist decisions to disk:

```python
tools = NexusControlTools(db_path="decisions.db")
```

The SQLite store is implemented in `store.py` and manages both the `decisions` header table and the `decision_events` append-only log.

## Security and data scope

### Data touched

- In-memory approval policies
- Execution audit logs with SHA-256 integrity
- Tool call metadata

All data is ephemeral unless explicitly exported via bundles or audit packages.

### Data NOT touched

- No network requests beyond nexus-router communication
- No filesystem writes (audit exports go to caller-specified paths)
- No OS credentials
- No telemetry

### Permissions required

None beyond standard Python process permissions. Nexus Control does not require elevated privileges, network access, or filesystem write access for its core operations.

### Vulnerability reporting

See [SECURITY.md](https://github.com/mcp-tool-shop-org/nexus-control/blob/main/SECURITY.md) for the vulnerability reporting process.

## Project structure

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

### Key modules

| Module | Responsibility |
|--------|---------------|
| `tool.py` | MCP tool entrypoints — all 11 tools are defined here |
| `store.py` | SQLite event store with append-only semantics |
| `events.py` | Typed event definitions (`DECISION_CREATED`, `APPROVAL_GRANTED`, etc.) |
| `policy.py` | Policy validation and router constraint compilation |
| `decision.py` | State machine with event replay — computes current state from events |
| `lifecycle.py` | Blocking reasons (triage-ladder ordered), timeline, and progress |
| `template.py` | Named immutable policy templates with creation metadata |
| `export.py` / `import_.py` | Bundle export and import with conflict modes |
| `bundle.py` | Bundle types and SHA-256 digest computation |
| `audit_package.py` | Audit package types and 6-check verification |
| `audit_export.py` | Audit package export with reference and embedded modes |
| `canonical_json.py` | Deterministic JSON serialization for digest stability |
| `integrity.py` | SHA-256 helpers for content-addressable hashing |

## Scorecard

Nexus Control passes all shipcheck gates:

| Category | Score |
|----------|-------|
| A. Security | 10/10 |
| B. Error Handling | 10/10 |
| C. Operator Docs | 10/10 |
| D. Shipping Hygiene | 10/10 |
| E. Identity (soft) | 10/10 |
| **Overall** | **50/50** |

Assessed with [`@mcptoolshop/shipcheck`](https://github.com/mcp-tool-shop-org/shipcheck).
