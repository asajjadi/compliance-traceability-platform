# Roadmap / Next Iterations

This tracks what's built vs. what's next, so nothing discussed gets lost
between sessions.

## Done (this scaffold)

- [x] Core sector-agnostic schema (Prisma): RequirementNode, DesignElement,
      VerificationRecord, RiskControl, EvidenceArtifact, TraceLink
- [x] Compliance pack layer: CompliancePack, TerminologyMap, ArtifactTemplate,
      GapRule, ReportTemplate, ProjectCompliancePack
- [x] Immutable AuditEvent log
- [x] Express API skeleton: projects, traceability nodes/links, readiness score
- [x] Scheduled AI agent (`scheduler.js`) — evaluates GapRules generically,
      writes results to AuditEvent, computes an audit-readiness score
- [x] Seed data for two starter packs: ISO 13485 (medtech), DO-178C (aerospace)
- [x] React/Vite frontend shell showing projects + attached packs
- [x] Strategy doc capturing positioning, competitors, differentiation,
      and known gaps (docs/STRATEGY.md)

## Done (this iteration)

- [x] Auth: JWT signup/login/invite, `requireAuth` + `requireRole` middleware,
      org-scoped queries on `projects` and `traceability` routes (was
      previously stubbed — no auth middleware existed)
- [x] Fixed a routing bug in `traceability.js` where sub-routes redeclared
      `:projectId` instead of using `mergeParams`, making every trace route
      unreachable without a duplicated ID segment in the URL
- [x] Fixed a schema bug: `TraceLink.fromId`/`toId` had hard foreign keys
      into `RequirementNode` even though `TraceLink` is meant to be a
      polymorphic edge between any two node types — this made every link
      whose endpoint wasn't a `RequirementNode` fail with a DB constraint
      error (i.e. most real links). Removed the FKs; integrity is now
      enforced at the application layer in `traceability.js`.
- [x] Fixed a reliability bug: async route handlers weren't wrapped, so an
      unhandled rejection (e.g. the FK violation above) crashed the whole
      Node process for every tenant. Added `asyncHandler` + a central Express
      error handler that maps known Prisma errors to proper 4xx responses.
- [x] Flesh out GapRule sets per pack beyond the one demo rule each — real
      chains now: ISO 13485 (design input → design output → verification,
      hazard → mitigation → verification) and DO-178C (system requirement →
      software requirement → code module → verification, plus failure
      condition → derived system requirement). Verified end-to-end against a
      real Postgres instance with fully-linked projects scoring 100.

## Next up (not yet built)
- [ ] ArtifactTemplate content: actual required-section structures for
      DDF/MDF (medtech) and DO-178C life-cycle data
- [ ] Frontend: trace graph visualization (not just a project list),
      gap-report view, project creation UI, pack-attachment UI
- [ ] Migration/import path from spreadsheets, DOORS/ReqIF, CSV — flagged
      in strategy doc as a hard requirement for real adoption
- [ ] Hosting/deployment setup so the app is live and usable from a phone
      browser (e.g. Railway/Render for backend+DB, Vercel/Netlify for
      frontend) — separate account/token needed when we get there
- [ ] 21 CFR Part 11-style e-signature/audit controls if evidence sign-off
      becomes a feature (validation gate noted in strategy doc)
- [ ] On-prem/air-gapped deployment story for aerospace/defense customers
      (parity with Trace.Space, who already offer this)
- [ ] Decide software-only vs. software+expert-review hybrid GTM model

## Open strategic questions (carried from discussion)

- Which vertical gets full GapRule/ArtifactTemplate depth first — still
  deferred; core engine was prioritized instead (see STRATEGY.md).
- Pure SaaS vs. hybrid software+consulting motion, given regulated-industry
  procurement is slow and relationship-driven.
- How to compete with Trace.Space's existing multi-sector AI-native
  positioning — likely via founder-market fit + price/segment + hybrid
  delivery model rather than architecture alone.
