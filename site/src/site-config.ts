import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Nexus Control',
  description: 'Orchestration and approval layer for nexus-router executions. Cryptographic audit packages binding governance to execution.',
  logoBadge: 'NC',
  brandName: 'Nexus Control',
  repoUrl: 'https://github.com/mcp-tool-shop-org/nexus-control',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'MCP Control Plane',
    headline: 'Governed execution',
    headlineAccent: 'with cryptographic proof.',
    description: 'A thin control plane that turns "router can execute" into "org can safely decide to execute" — with approval workflows, policy enforcement, and tamper-evident audit packages.',
    primaryCta: { href: '#usage', label: 'Get started' },
    secondaryCta: { href: '#tools', label: 'MCP tools' },
    previews: [
      { label: 'Install', code: 'pip install nexus-control' },
      { label: 'Import', code: 'from nexus_control import NexusControlTools' },
      { label: 'Decide', code: 'tools.request(goal="Deploy v2", mode="apply")' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Every execution is tied to a decision, a policy, an approval trail, and a cryptographic audit package.',
      features: [
        { title: 'Approval workflows', desc: 'N-of-M approvals with expiration, revocation, and per-actor deduplication. Policies enforce constraints at execution time.' },
        { title: 'Cryptographic audit', desc: 'Tamper-evident audit packages bind what was allowed, what ran, and why — into a single verifiable digest.' },
        { title: 'Event-sourced', desc: 'All state is derived by replaying an immutable event log. Decisions are exportable, importable, and fully replayable.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Usage',
      cards: [
        { title: 'Install', code: 'pip install nexus-control' },
        { title: 'Create a request', code: "from nexus_control import NexusControlTools\nfrom nexus_control.events import Actor\n\ntools = NexusControlTools(db_path=\"decisions.db\")\n\nresult = tools.request(\n    goal=\"Rotate production API keys\",\n    actor=Actor(type=\"human\", id=\"alice@acme.com\"),\n    mode=\"apply\",\n    min_approvals=2,\n)" },
      ],
    },
    {
      kind: 'data-table',
      id: 'tools',
      title: 'MCP Tools',
      subtitle: '11 tools exposed via Model Context Protocol.',
      columns: ['Tool', 'Description'],
      rows: [
        ['nexus-control.request', 'Create an execution request with goal, policy, and approvers'],
        ['nexus-control.approve', 'Approve a request (supports N-of-M approvals)'],
        ['nexus-control.execute', 'Execute approved request via nexus-router'],
        ['nexus-control.status', 'Get request state and linked run status'],
        ['nexus-control.inspect', 'Read-only introspection with human-readable output'],
        ['nexus-control.template.create', 'Create a named, immutable policy template'],
        ['nexus-control.template.get', 'Retrieve a template by name'],
        ['nexus-control.template.list', 'List all templates with optional label filtering'],
        ['nexus-control.export_bundle', 'Export a decision as a portable, integrity-verified bundle'],
        ['nexus-control.import_bundle', 'Import a bundle with conflict modes and replay validation'],
        ['nexus-control.export_audit_package', 'Export audit package binding governance to execution'],
      ],
    },
    {
      kind: 'api',
      id: 'api',
      title: 'Key Concepts',
      subtitle: 'Core building blocks of the control plane.',
      apis: [
        { signature: 'Decision', description: 'A request + policy + approval trail + execution result. The atomic unit of governed execution.' },
        { signature: 'Policy', description: 'Approval rules, allowed modes, adapter capabilities, max steps, and labels. Enforced at execution time.' },
        { signature: 'Template', description: 'Named, immutable policy bundle. Reusable across decisions with optional overrides.' },
        { signature: 'Audit Package', description: 'Cryptographic binding of control bundle + router execution + link digest. Two modes: reference (for CI) and embedded (for regulators).' },
        { signature: 'Bundle', description: 'Portable, integrity-verified export of a decision. Supports import with conflict modes: reject, new ID, or overwrite.' },
      ],
    },
  ],
};
