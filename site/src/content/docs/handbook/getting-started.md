---
title: Getting Started
description: Install Nexus Control and run your first governed execution in under five minutes.
sidebar:
  order: 1
---

## Installation

Install from PyPI:

```bash
pip install nexus-control
```

Or install from source for development:

```bash
git clone https://github.com/mcp-tool-shop-org/nexus-control
cd nexus-control
pip install -e ".[dev]"
```

## Quick start

The following walkthrough creates a decision, collects approvals, executes through a router, and exports a cryptographic audit package.

### 1. Initialize the control plane

```python
from nexus_control import NexusControlTools
from nexus_control.events import Actor

# Uses in-memory SQLite by default; pass a path to persist
tools = NexusControlTools(db_path="decisions.db")
```

### 2. Create an execution request

Every governed execution begins with a request. The request captures the goal, the actor making the request, the execution mode, and the policy constraints.

```python
result = tools.request(
    goal="Rotate production API keys",
    actor=Actor(type="human", id="alice@example.com"),
    mode="apply",
    min_approvals=2,
    labels=["prod", "security"],
)
request_id = result.data["request_id"]
```

### 3. Collect approvals

Approvals are counted by distinct `actor.id`. The policy's `min_approvals` threshold must be satisfied before execution is allowed.

```python
tools.approve(request_id, actor=Actor(type="human", id="alice@example.com"))
tools.approve(request_id, actor=Actor(type="human", id="bob@example.com"))
```

Approvals support optional fields:

- `comment` — human-readable reason for the approval
- `expires_at` — ISO 8601 timestamp after which the approval lapses
- Approvals can be **revoked** at any time before execution begins

### 4. Execute the request

Once the approval threshold is met, execute through your router. The router must implement the `RouterProtocol` interface.

```python
result = tools.execute(
    request_id=request_id,
    adapter_id="subprocess:mcpt:key-rotation",
    actor=Actor(type="system", id="scheduler"),
    router=your_router,  # RouterProtocol implementation
)

print(f"Run ID: {result.data['run_id']}")
```

### 5. Export an audit package

An audit package is a single JSON artifact that cryptographically binds the control decision to the router execution.

```python
audit = tools.export_audit_package(request_id)
print(audit.data["digest"])  # sha256:...
```

The resulting package can be verified independently by anyone who holds it, without access to the original database.

## What to read next

- **[MCP Tools](/nexus-control/handbook/mcp-tools/)** — full reference for all 11 tools
- **[Templates & Lifecycle](/nexus-control/handbook/templates-lifecycle/)** — reuse policy bundles across decisions
- **[Data Model](/nexus-control/handbook/data-model/)** — understand the event-sourced architecture
