---
title: MCP Tools
description: Complete reference for the 11 MCP tools exposed by Nexus Control.
sidebar:
  order: 2
---

Nexus Control exposes 11 tools via the [Model Context Protocol](https://modelcontextprotocol.io/). Each tool is namespaced under `nexus-control.*` and follows structured input/output schemas defined in the `schemas/` directory.

## Tool reference

### nexus-control.request

Create an execution request with a goal, policy, and approvers.

This is the entry point for every governed execution. The request captures what needs to happen (the goal), how it should happen (the mode), and what constraints must be satisfied (the policy).

**Key parameters:**
- `goal` — human-readable description of what the execution should accomplish
- `actor` — the person or system creating the request (`{type, id}`)
- `mode` — execution mode (e.g., `"dry_run"`, `"apply"`)
- `min_approvals` — number of distinct approvers required
- `labels` — optional tags for filtering and organization
- `template_name` — optional reference to a policy template
- `plan` — optional pre-defined execution plan
- `allowed_modes` — which modes are allowed by policy
- `require_adapter_capabilities` — capabilities the router adapter must declare
- `max_steps` — maximum execution steps

When `template_name` is provided, explicit policy parameters (`min_approvals`, `allowed_modes`, etc.) act as overrides on top of the template defaults.

### nexus-control.approve

Approve a request. Supports N-of-M approval workflows.

Approvals are counted by distinct `actor.id`. Duplicate approvals from the same actor are deduplicated. Approvals can include a comment, an expiration timestamp, and can be revoked before execution.

**Key parameters:**
- `request_id` — the decision to approve
- `actor` — the approver (`{type, id}`)
- `comment` — optional human-readable reason
- `expires_at` — optional ISO 8601 expiration

### nexus-control.execute

Execute an approved request via nexus-router.

This tool enforces the policy at execution time: it verifies that the approval count meets the threshold, that the mode is allowed, and that the adapter satisfies any required capabilities. On success, it records the `run_id` linking to the router execution.

**Key parameters:**
- `request_id` — the approved decision to execute
- `adapter_id` — identifies which router adapter to use
- `actor` — the actor triggering execution
- `router` — a `RouterProtocol` implementation

### nexus-control.status

Get the current state of a request and its linked run status.

Returns the decision header, current state (pending, approved, executing, completed, failed), approval count, and any linked router execution status.

**Key parameters:**
- `request_id` — the decision to inspect

### nexus-control.inspect

Read-only introspection with human-readable output.

Similar to `status` but formatted for human consumption. Includes the full approval trail, policy details, and execution timeline in a readable format.

**Key parameters:**
- `request_id` — the decision to inspect

### nexus-control.template.create

Create a named, immutable policy template.

Templates define reusable policy bundles: approval thresholds, allowed modes, required adapter capabilities, step limits, and labels. Once created, a template cannot be modified — this ensures that decisions referencing a template have stable semantics.

**Key parameters:**
- `name` — unique template identifier
- `actor` — the creator
- `min_approvals` — default approval threshold
- `allowed_modes` — list of permitted execution modes
- `require_adapter_capabilities` — capabilities the router adapter must declare
- `max_steps` — optional step limit for the execution
- `labels` — optional tags

### nexus-control.template.get

Retrieve a template by name.

Returns the full template definition including all policy fields, creation metadata, and labels.

**Key parameters:**
- `name` — the template to retrieve

### nexus-control.template.list

List all templates with optional label filtering.

Returns all templates, optionally filtered to those matching specific labels. Useful for discovering available policy bundles.

**Key parameters:**
- `labels` — optional list of labels to filter by

### nexus-control.export_bundle

Export a decision as a portable, integrity-verified bundle.

The bundle contains the decision header, all events, the policy, approvals, and a SHA-256 digest. Bundles can be imported into another Nexus Control instance for verification or replay.

**Key parameters:**
- `decision_id` — the decision to export

### nexus-control.import_bundle

Import a bundle with conflict modes and replay validation.

When importing, you choose how to handle conflicts with existing decisions:

| Conflict mode | Behavior |
|---------------|----------|
| `reject_on_conflict` | Fail if the decision ID already exists |
| `new_decision_id` | Import under a fresh ID, preserving history |
| `overwrite` | Replace the existing decision (use with caution) |

The `replay_after_import` option re-derives state from the imported events to verify consistency.

**Key parameters:**
- `bundle_json` — the exported bundle data
- `conflict_mode` — how to handle ID conflicts
- `replay_after_import` — whether to verify by replaying events

### nexus-control.export_audit_package

Export an audit package binding governance to execution.

An audit package is a single JSON artifact that cryptographically binds three things:
1. **What was allowed** — the control bundle (decision + policy + approvals)
2. **What actually ran** — the router execution result
3. **Why it was allowed** — the control-router link

The result is a `binding_digest` that can be verified independently.

**Router modes:**

| Mode | Description | Use case |
|------|-------------|----------|
| **Reference** | `run_id` + `router_digest` | CI pipelines, internal systems |
| **Embedded** | Full router bundle included | Regulators, long-term archival |

**Key parameters:**
- `request_id` — the executed decision to package

## Verification

Audit packages can be verified programmatically:

```python
from nexus_control import export_audit_package, verify_audit_package

# Export
result = export_audit_package(store, decision_id)
package = result.package

# Verify (6 independent checks, no short-circuiting)
verification = verify_audit_package(package)
assert verification.ok
```

The verification runs 6 independent checks and never short-circuits, ensuring that all integrity properties are evaluated regardless of earlier failures.
