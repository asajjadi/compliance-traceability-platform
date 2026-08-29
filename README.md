# ClearPath QMS — Traceability & Audit-Readiness Platform

A demonstration platform that helps regulated engineering teams turn fragmented development evidence into a traceable, reviewable product record.

**From requirement to evidence:**  
`Requirement → Design → Verification / Validation → Risk Control → Evidence`

🌐 Built as a public portfolio project by [Amir Sajjadi, Ph.D.](https://github.com/asajjadi), Engineering & R&D Technical Leader.

> **Important:** ClearPath QMS is a demonstration platform and is **not** a validated quality-management system, regulatory submission tool, or claim of ISO 13485 / FDA compliance. It uses illustrative workflows and must be independently validated and configured before use in a regulated environment.

## The Problem

Engineering teams in medical devices, aerospace, and other regulated industries often maintain traceability manually across spreadsheets, documents, and disconnected tools. The result is time-consuming evidence reviews, hidden gaps, and uncertainty about audit readiness.

## The Approach

ClearPath provides a sector-agnostic traceability engine configured through industry-specific **compliance packs**, rather than separate codebases for each sector. It connects the core engineering chain and identifies missing or incomplete links before a review.

## What It Demonstrates

- **End-to-end traceability** across requirements, design, verification / validation, risk controls, and evidence
- **Evidence-gap detection** to surface incomplete or missing relationships
- **Audit-readiness scoring** to focus teams on the most important gaps
- **Configurable compliance packs**, with starter packs for ISO 13485 and DO-178C
- **AI-assisted scheduled review workflow** for structured, repeatable evidence review
- **Scalable architecture** using a React/Vite frontend, Express API, Prisma data layer, and a scheduled agent

## Why It Matters

ClearPath illustrates how engineering intelligence can make product-development work more visible, traceable, and actionable—without replacing engineering judgment, quality oversight, or formal validation.

It is designed to demonstrate practical systems thinking at the intersection of:

- Regulated product development and design controls
- Risk management and verification planning
- Quality-system traceability
- Engineering data architecture
- Technical product leadership and workflow automation

## Architecture

```text
Frontend (React / Vite)
        ↓
Express API + Traceability Core
        ↓
Prisma Data Model
        ↓
Compliance Packs + Scheduled Review Agent
```

For detailed design information, see:

- [Strategy and positioning](docs/STRATEGY.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)

## Project Status

**Core-engineering scaffold.** The platform proves the plug-in architecture with starter `iso13485` and `do178c` packs. Full rule coverage, formal validation, and production hardening are intentionally out of scope for this portfolio version.

## Run Locally

### Backend

```bash
cd backend
cp .env.example .env
# Set DATABASE_URL in .env
npm install
npx prisma migrate dev --name init
node prisma/seed.js
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Run the review agent once

```bash
cd backend
node src/agent/scheduler.js --once
```

## Confidentiality & Responsible Use

This public repository contains demonstration materials only. It does not contain confidential client, employer, clinical, or proprietary data. Any regulated deployment would require appropriate requirements definition, risk assessment, cybersecurity controls, verification, validation, and quality-system governance.
