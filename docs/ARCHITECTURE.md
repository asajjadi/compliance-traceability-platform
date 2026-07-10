# Architecture

## Design principle

The core platform is **sector-agnostic**. Industry-specific behavior (medtech
vs. aerospace vs. future verticals) is expressed entirely through
**Compliance Packs** — configuration data, not separate code paths or forked
schemas. A project can have more than one pack attached at once (e.g. a
device with embedded software might need both a medtech pack and a
DO-178C-flavored software pack).

## Core entities

```
Organization (tenant)
  └─ Project (one per product/program, sector-agnostic)
       ├─ RequirementNode      (user need, system req, design input — generic "requirement")
       ├─ DesignElement        (spec, drawing, architecture item, code module)
       ├─ VerificationRecord   (test case, test result, review record)
       ├─ RiskControl          (hazard/failure mode + mitigation — generic across
       │                        ISO 14971 / MIL-STD-882 / ARP4761 style analyses)
       ├─ EvidenceArtifact     (uploaded doc/file tied to any node above)
       └─ TraceLink            (edge table: from_node, to_node, link_type, direction)

CompliancePack
  ├─ standard_id          (e.g. "iso13485", "do178c", "arp4754a")
  ├─ TerminologyMap       (label overrides: "DDF" vs "Design Assurance Data")
  ├─ ArtifactTemplate     (required doc types + structure per standard)
  ├─ GapRule              (e.g. "every RiskControl must link to >=1 VerificationRecord")
  └─ ReportTemplate       (audit export formatting)

ProjectCompliancePack   (join table — a project can use more than one pack)

AuditEvent (immutable log: who changed what, when — needed across every sector)
```

### Why generic node types (not per-standard tables)

`RequirementNode`, `DesignElement`, etc. are generic tables with a
`node_subtype` field (e.g. `"user_need"`, `"system_requirement"`,
`"design_input"`). The active CompliancePack's `TerminologyMap` decides what
label to render for a given subtype. This is what allows one schema to serve
multiple regulatory vocabularies without forking the database.

## AI agent responsibilities (sector-agnostic logic)

The scheduled agent (`backend/src/agent/scheduler.js`) runs the same logic
regardless of sector — it just reads whichever `CompliancePack.GapRule` set is
attached to a given project at runtime:

1. Run `GapRule` checks → flag missing/broken trace links
2. Compute an audit-readiness score per project
3. Draft a plain-language summary of what changed and what's now at risk
4. Never hardcodes standard-specific logic in code — all standard-specific
   behavior is data (GapRule rows), not branches in the agent code.

## Tech stack

| Layer      | Choice                  | Why |
|------------|-------------------------|-----|
| Database   | PostgreSQL              | Relational graph model wants real joins/constraints, not a document store |
| ORM        | Prisma                  | Typed schema, migrations, pairs well with Node/Express |
| Backend    | Express (Node)          | Simple, well understood, easy to deploy |
| Frontend   | React + Vite            | Fast dev loop, matches prior scaffold |
| Auth       | JWT + org-scoped roles  | Stub for MVP, harden later (SSO/SAML likely needed for enterprise sale) |

## Deployment note (from strategy discussion)

Aerospace/defense customers may require on-prem/air-gapped deployment, not
just cloud SaaS — this should influence infra choices (avoid tightly
coupling to a single cloud-only managed service where a self-hostable
alternative exists) as the platform matures past MVP.

## Directory layout

```
compliance-platform/
├── docs/
│   ├── STRATEGY.md
│   └── ARCHITECTURE.md
├── backend/
│   ├── prisma/schema.prisma
│   └── src/
│       ├── routes/
│       ├── agent/scheduler.js
│       └── lib/
└── frontend/
    └── src/
```
