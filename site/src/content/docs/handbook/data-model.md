---
title: Data Model
description: Event-sourced architecture, export/import bundles, and audit packages in Nexus Control.
sidebar:
  order: 4
---

## Event-sourced design

All state in Nexus Control is derived by replaying an immutable event log. There is no mutable state. The event store has two layers:

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

The `decisions` table stores the header (ID, creation timestamp, goal). The `decision_events` table is an append-only log of typed events. Current state is always computed by replaying all events in sequence order.

### Why event sourcing?

- **Complete audit trail** — every state change is recorded as an immutable event
- **Replayability** — state can be reconstructed at any point in time
- **Portability** — export the event log and import it elsewhere for verification
- **Integrity** — digests are computed over the canonical event sequence

## Policy model

Policies define the constraints that must be satisfied before execution:

```python
Policy(
    min_approvals=2,
    allowed_modes=["dry_run", "apply"],
    require_adapter_capabilities=["timeout"],
    max_steps=50,
    labels=["prod", "finance"],
)
```

| Field | Purpose |
|-------|---------|
| `min_approvals` | Number of distinct approvers required |
| `allowed_modes` | Which execution modes the policy permits |
| `require_adapter_capabilities` | Capabilities the router adapter must declare |
| `max_steps` | Upper bound on execution steps (optional) |
| `labels` | Tags for filtering and organizational grouping |

Policies are enforced **at execution time**, not at request creation. This allows approvals to accumulate before the policy check.

## Approval model

- Approvals are counted by distinct `actor.id` — duplicate approvals are deduplicated
- Each approval can include a `comment` and an optional `expires_at` timestamp
- Approvals can be **revoked** at any time before execution begins
- At execution time, the system verifies that the current (non-expired, non-revoked) approval count meets the policy's `min_approvals` threshold

## Export/import bundles

Introduced in v0.5.0, bundles provide portable, integrity-verified decision packages.

### Exporting a bundle

```python
bundle_result = tools.export_bundle(decision_id)
bundle_json = bundle_result.data["canonical_json"]
```

The bundle includes:
- Decision header (ID, goal, timestamps)
- Complete event log in sequence order
- Policy snapshot
- Approval records
- SHA-256 digest computed over canonical JSON serialization

### Importing a bundle

```python
import_result = tools.import_bundle(
    bundle_json,
    conflict_mode="new_decision_id",
    replay_after_import=True,
)
```

### Conflict modes

| Mode | Behavior |
|------|----------|
| `reject_on_conflict` | Fail if the decision ID already exists in the target store |
| `new_decision_id` | Import under a fresh ID, preserving the full event history |
| `overwrite` | Replace the existing decision (use with caution) |

### Replay validation

When `replay_after_import=True`, the import process re-derives state from the imported events and verifies that the result matches the bundle's digest. This catches corruption or tampering during transport.

## Audit packages

Introduced in v0.6.0, audit packages are the highest-integrity artifact in Nexus Control.

An audit package cryptographically binds three things into one verifiable `binding_digest`:

1. **What was allowed** — the control bundle (decision + policy + approvals)
2. **What actually ran** — the router execution result
3. **Why it was allowed** — the control-router link connecting governance to execution

### Router modes

| Mode | Contents | Best for |
|------|----------|----------|
| **Reference** | `run_id` + `router_digest` | CI pipelines, internal systems with access to the router |
| **Embedded** | Full router bundle included | Regulators, compliance, long-term archival |

### Verification

```python
from nexus_control import export_audit_package, verify_audit_package

# Export
result = export_audit_package(store, decision_id)
package = result.package

# Verify (6 independent checks, no short-circuiting)
verification = verify_audit_package(package)
assert verification.ok
```

Verification runs 6 independent checks and **never short-circuits**. Even if the first check fails, all remaining checks are evaluated. This design ensures that a verification report always contains the complete set of issues, not just the first one encountered.

### Canonical JSON

Nexus Control uses deterministic JSON serialization for all digest computations. Keys are sorted, floats are normalized, and whitespace is standardized. This ensures that the same logical data always produces the same digest regardless of platform or serialization library.
