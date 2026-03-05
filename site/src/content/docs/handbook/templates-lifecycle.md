---
title: Templates & Lifecycle
description: Create reusable policy templates and understand decision lifecycle in Nexus Control.
sidebar:
  order: 3
---

## Decision templates

Introduced in v0.3.0, decision templates are named, immutable policy bundles that can be reused across decisions. They reduce duplication and enforce organizational standards.

### Creating a template

Templates define the default policy for a category of decisions:

```python
tools.template_create(
    name="prod-deploy",
    actor=Actor(type="human", id="platform-team"),
    min_approvals=2,
    allowed_modes=["dry_run", "apply"],
    require_adapter_capabilities=["timeout"],
    labels=["prod"],
)
```

### Template properties

| Property | Description |
|----------|-------------|
| `name` | Unique identifier; cannot be reused after creation |
| `min_approvals` | Default approval threshold |
| `allowed_modes` | Which execution modes are permitted |
| `require_adapter_capabilities` | Capabilities the router adapter must declare |
| `max_steps` | Optional step limit for bounded execution |
| `labels` | Tags for discovery and filtering |

### Immutability guarantee

Once created, a template **cannot be modified**. This is a deliberate design choice: decisions that reference a template have stable, auditable semantics. If you need different settings, create a new template with a new name.

### Using templates with overrides

When creating a request, reference a template and optionally override specific fields:

```python
result = tools.request(
    goal="Deploy v2.1.0",
    actor=actor,
    template_name="prod-deploy",
    override_min_approvals=3,  # Stricter for this deploy
)
```

Override fields are applied on top of the template defaults. The original template remains unchanged.

### Listing and discovering templates

```python
# List all templates
all_templates = tools.template_list()

# Filter by label
prod_templates = tools.template_list(labels=["prod"])
```

## Decision lifecycle

Introduced in v0.4.0, the lifecycle system provides computed state, blocking reasons, and a human-readable timeline for every decision.

### Computing lifecycle

```python
from nexus_control import compute_lifecycle

lifecycle = compute_lifecycle(decision, events, policy)
```

### Blocking reasons

When a decision cannot proceed, the lifecycle returns structured blocking reasons ordered by a triage ladder. Each reason includes a machine-readable code and a human-readable message:

```python
for reason in lifecycle.blocking_reasons:
    print(f"{reason.code}: {reason.message}")
```

Common blocking reasons:

| Code | Meaning |
|------|---------|
| `APPROVALS_INSUFFICIENT` | Not enough approvals to meet the policy threshold |
| `APPROVAL_EXPIRED` | One or more required approvals have lapsed |
| `MODE_NOT_ALLOWED` | The requested execution mode is not in the policy's allowed list |
| `ADAPTER_CAPABILITY_MISSING` | The router adapter does not declare a required capability |
| `ALREADY_EXECUTED` | The decision has already been executed (no re-execution) |

### Timeline

The lifecycle includes a chronological timeline of all events, useful for audit displays and debugging:

```python
for entry in lifecycle.timeline:
    print(f"  {entry.seq}  {entry.label}")
```

Timeline entries include sequence numbers for ordering and truncation support for long histories.

### Decision states

A decision progresses through these states:

```
CREATED → POLICY_ATTACHED → APPROVALS_COLLECTING → APPROVED → EXECUTING → COMPLETED
                                                                       ↘ FAILED
```

State transitions are driven by events in the append-only log. The current state is always computed by replaying all events from the beginning, never stored as mutable state.
