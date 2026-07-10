# Strategy & Positioning

_Last updated: 2026-07-09_

## Vision

A multi-sector compliance traceability platform — starting with medical device
and aerospace — that replaces spreadsheet-based design control / requirements
traceability with a single core engine, configured per industry via
"compliance packs" rather than separate codebases.

## The problem

Regulated engineering orgs (medtech, aerospace/defense) must maintain
bidirectional traceability across:

`requirement → design → verification/validation → risk control → evidence`

Today this is mostly done in spreadsheets, legacy ALM tools (IBM DOORS), or
expensive enterprise QMS/ALM suites. Gaps in that chain are invisible until an
auditor samples them — rebuilding trace before a review is one of the most
expensive kinds of unplanned engineering work.

## Regulatory context (as of 2026)

- **Medtech**: FDA's QMSR took effect Feb 2, 2026, replacing the legacy QSR
  (21 CFR 820) and formally incorporating ISO 13485:2016. Terminology changed:
  DHF → DDF (Design and Development File), DMR → MDF (Medical Device File).
  Most existing tools are still catching up to this terminology shift — a
  timing wedge for a QMSR-native product.
- **Aerospace**: ARP4754A (system/aircraft-level development assurance,
  FDAL/IDAL levels) sits above DO-178C (software) and DO-254 (complex
  electronic hardware). AS9100 is the aerospace quality-management layer
  (aerospace's analogue to ISO 13485).
- The underlying pattern — requirement/design/verification/risk/evidence with
  bidirectional traceability — is structurally identical across both sectors.
  Only vocabulary, required artifacts, and gap-check rules differ.

## Competitive landscape

**Medtech-focused eQMS / DHF-DDF tools**
- Greenlight Guru — medtech-native, strong traceability, but rigid workflows
  and expensive (~$30K+/year, mandatory 3-year contracts).
- MasterControl — enterprise scale, $25K/year scaling to $100K+/year, heavy
  recent AI investment (Deviation Analyzer, Batch Assessor).
- Veeva Vault Quality, ETQ Reliance, QT9, Qualio — enterprise/configurable
  options, often overkill for small teams.
- Cost reality: one-time QMS setup can run €50K–€150K, with €50K–€200K/year
  ongoing for mid-sized companies.

**Aerospace/defense ALM & traceability tools**
- IBM DOORS/ELM, Siemens Polarion, PTC Codebeamer, Visure — engineering-side
  requirements/traceability tools; not full QMS. DOORS remains a heavyweight
  but many teams seek alternatives due to its steep learning curve.

**Direct positioning threat**
- **Trace.Space** — an AI-native requirements/traceability platform already
  spanning aerospace, automotive, and medical, claiming AI-driven gap
  detection and VPC/air-gapped/on-prem deployment. This is the closest
  existing competitor to our multi-sector thesis and should be tracked
  closely. "Multi-sector + AI-native traceability" alone is not, by itself,
  a differentiator anymore — it's becoming the category baseline.

## What's genuinely defensible

1. **Founder-market fit.** Direct, personal program-ownership experience in
   both medtech design controls (DFMEA, ECR/ECO, DHF/DDF) and aerospace-
   adjacent systems/CFD engineering. Rare combination; hard to copy.
2. **QMSR timing window** — being DDF/MDF-native while incumbents retrofit
   legacy DHF-based systems.
3. **Underserved price/segment gap** — lean, AI-native, affordable tooling for
   the 1–50 person device/aerospace startup segment currently priced out of
   Greenlight Guru / DOORS-class tools.
4. **Config-driven compliance-pack architecture** — a technically cleaner
   approach than incumbents who bolted AI onto legacy platforms rather than
   building gap-detection as a core primitive.

## Sharper positioning statement

> A compliance platform built and initially delivered by someone who has
> personally carried DHF/design-control risk in regulated engineering
> programs — priced and scoped for teams too small for Greenlight Guru or
> DOORS, with an expert-in-the-loop onboarding model competitors don't offer.

## Known gaps / blind spots to address before scaling

- **Software validation burden.** Any tool touching DHF/DDF evidence or
  DO-178C artifacts needs to survive customer-side software validation
  (IQ/OQ/PQ), and e-signature features need 21 CFR Part 11-style controls.
  This is a go-to-market gate, not just a feature.
- **Migration path.** Target customers already have data in DOORS, Polarion,
  or spreadsheets. The compliance-pack architecture is only useful if there's
  a realistic import path from existing tools/formats (ReqIF, CSV, XML).
- **ITAR / air-gapped deployment.** Aerospace/defense customers often require
  on-prem or air-gapped deployment, not just cloud SaaS. Trace.Space already
  claims this — parity is required, not optional, for that segment.
- **Sales cycle reality.** Regulated-industry procurement is slow and
  relationship-driven; a pure self-serve SaaS motion likely won't work.
  Consider a software + expert-review/onboarding hybrid model instead of
  pure SaaS, at least initially.

## MVP sequencing decision

Build the **core engine first** (sector-agnostic traceability graph + AI gap
detection), prove the compliance-pack plug-in architecture holds up by
implementing one pack, then add a second pack later to validate the "same
core, new vertical in weeks not months" story.
