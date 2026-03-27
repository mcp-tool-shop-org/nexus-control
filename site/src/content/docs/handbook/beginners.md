---
title: Beginners Guide
description: Plain-language introduction to Nexus Control for newcomers to governed execution.
sidebar:
  order: 99
---

This page explains Nexus Control in plain language. No prior experience with governance tooling or the Model Context Protocol is required.

## What is Nexus Control?

Nexus Control is a Python library that adds an approval and audit layer on top of automated executions. Think of it as a gatekeeper: before any automated action runs, Nexus Control requires that someone (or multiple people) formally approve it, and after it runs, it produces cryptographic proof of what happened and why it was allowed.

Without Nexus Control, automated systems can execute freely. With it, every execution goes through a governed pipeline: request, approve, execute, audit.

## Why would I use it?

Nexus Control solves a common problem in teams that use automation: accountability. When a script rotates API keys, deploys code, or modifies infrastructure, you need answers to three questions:

1. **Who asked for this?** -- The request captures the goal and the person or system that initiated it.
2. **Who approved it?** -- The approval trail records every approver, when they approved, and any comments.
3. **What actually happened?** -- The audit package binds the governance decision to the execution result with a cryptographic digest.

Use Nexus Control when you need auditable, policy-enforced automation -- for example, production deployments, credential rotation, or any action where you want a paper trail.

## Core vocabulary

These five terms appear throughout the handbook. Understanding them makes everything else straightforward.

| Term | What it means |
|------|--------------|
| **Decision** | The central object. It bundles a request (what you want to do), a policy (the rules), approvals (who said yes), and an execution result (what happened). |
| **Policy** | A set of constraints: how many approvers are needed, which execution modes are allowed, what capabilities the adapter must have, and an optional step limit. Policies are enforced at execution time. |
| **Approval** | A record that a specific person or system endorsed the decision. Approvals are counted by distinct actor ID, can expire, and can be revoked before execution starts. |
| **Template** | A named, immutable policy bundle. Templates let you define standard policies (like "production deploy requires 2 approvals") and reuse them across many decisions. Once created, a template cannot be changed. |
| **Audit package** | A single JSON artifact that cryptographically binds the governance decision to the router execution. It can be verified independently by anyone who holds it. |

## How a decision flows from start to finish

Every governed execution follows the same five-step flow:

**Step 1 -- Create a request.** You describe what needs to happen (the goal), pick an execution mode (`dry_run` or `apply`), and set the policy constraints (minimum approvals, allowed modes, labels).

**Step 2 -- Collect approvals.** Other actors (people or systems) approve the request. Each approval is tracked by actor ID and can include a comment or an expiration time. Duplicate approvals from the same actor are ignored.

**Step 3 -- Execute.** Once the approval threshold is met and the policy is satisfied, the request can be executed through a router. The system checks all constraints at execution time, not before.

**Step 4 -- Record the result.** The execution outcome (success or failure) is recorded as an event. The run ID links back to the router for full traceability.

**Step 5 -- Export an audit package.** The audit package combines the decision, the policy, the approvals, and the execution result into one verifiable artifact with a SHA-256 binding digest.

## Minimal working example

This example creates a decision, approves it, and prints the request ID. It uses in-memory storage so nothing is written to disk.

```python
from nexus_control import NexusControlTools
from nexus_control.events import Actor

# Create the control plane (in-memory by default)
tools = NexusControlTools()

# Step 1: Create a request
result = tools.request(
    goal="Rotate staging API keys",
    actor=Actor(type="human", id="alice@example.com"),
    mode="dry_run",
    min_approvals=1,
)
request_id = result.data["request_id"]
print(f"Created request: {request_id}")

# Step 2: Approve it
tools.approve(
    request_id,
    actor=Actor(type="human", id="alice@example.com"),
    comment="Looks good to me",
)

# Step 3: Check status
status = tools.status(request_id)
print(f"State: {status.data['state']}")
# Output: State: approved
```

To run this, install Nexus Control (`pip install nexus-control`) and save the code to a `.py` file.

## Common mistakes and how to avoid them

**Executing before enough approvals.** If you call `tools.execute()` before the approval count meets the policy threshold, the call will fail with a structured error. Always check `tools.status()` or use `compute_lifecycle()` to see blocking reasons before attempting execution.

**Expecting mutable templates.** Templates are immutable by design. If you need a different policy, create a new template with a new name. You can also pass override parameters (like `min_approvals`) when creating a request from a template.

**Using `override_min_approvals` instead of `min_approvals`.** When creating a request from a template, use the standard parameter names (`min_approvals`, `allowed_modes`, etc.) directly. There is no `override_` prefix -- explicit parameters simply override the template defaults.

**Forgetting that state is computed, not stored.** Nexus Control is event-sourced. The current state of a decision is always derived by replaying its event log. There is no mutable "state" column. This means you can export the events, import them elsewhere, and get exactly the same state.

**Assuming approvals are permanent.** Approvals can be revoked before execution and can expire if an `expires_at` timestamp was set. The system checks active (non-revoked, non-expired) approvals at execution time.

## Where to go next

| If you want to... | Read this |
|-------------------|-----------|
| Run a full end-to-end example with execution and audit | [Getting Started](/nexus-control/handbook/getting-started/) |
| See every MCP tool and its parameters | [MCP Tools](/nexus-control/handbook/mcp-tools/) |
| Understand templates, lifecycle, and blocking reasons | [Templates & Lifecycle](/nexus-control/handbook/templates-lifecycle/) |
| Learn about the event-sourced data model and audit packages | [Data Model](/nexus-control/handbook/data-model/) |
| Set up a development environment or review the project structure | [Reference](/nexus-control/handbook/reference/) |
