---
title: Nexus Control Handbook
description: Complete guide to Nexus Control — the orchestration and approval layer for nexus-router executions.
sidebar:
  order: 0
---

Welcome to the **Nexus Control** handbook. This guide covers everything you need to govern, approve, and audit automated executions with cryptographic proof.

## What is Nexus Control?

Nexus Control is a thin control plane that turns "router can execute" into "org can safely decide to execute." Every execution is tied to:

- A **decision** — the request combined with its policy
- A **policy** — approval rules, allowed modes, and constraints
- An **approval trail** — who approved, when, and with what comment
- A **nexus-router run_id** — for full execution audit
- An **audit package** — cryptographic binding of governance to execution

Everything is exportable, verifiable, and replayable.

## Handbook contents

| Chapter | What you will learn |
|---------|-------------------|
| [Getting Started](/nexus-control/handbook/getting-started/) | Install nexus-control and run your first governed execution |
| [MCP Tools](/nexus-control/handbook/mcp-tools/) | Reference for all 11 MCP tools exposed by the server |
| [Templates & Lifecycle](/nexus-control/handbook/templates-lifecycle/) | Create reusable policy templates and understand decision lifecycle |
| [Data Model](/nexus-control/handbook/data-model/) | Event-sourced architecture, export/import bundles, and audit packages |
| [Reference](/nexus-control/handbook/reference/) | Development setup, security model, exit codes, and project structure |
| [Beginners Guide](/nexus-control/handbook/beginners/) | Plain-language introduction for newcomers to governed execution |

## Key identifiers

| Key | Value |
|-----|-------|
| Brand / repo | `nexus-control` |
| Python package | `nexus_control` |
| Author | [mcp-tool-shop](https://github.com/mcp-tool-shop) |
| License | MIT |

## Core design principles

1. **Governance before execution** — nothing runs without a decision that satisfies its policy
2. **Immutable event log** — all state is derived by replaying append-only events; no mutable state
3. **Cryptographic binding** — audit packages link what was allowed, what ran, and why into a single verifiable digest
4. **Portable decisions** — export bundles carry everything needed to import, verify, and replay a decision elsewhere
5. **Template reuse** — named, immutable policy bundles can be shared across decisions with optional overrides
