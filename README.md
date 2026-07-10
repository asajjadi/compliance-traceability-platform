# Compliance Traceability Platform

A multi-sector compliance traceability platform (starting with medical
device and aerospace) built around one sector-agnostic core engine,
configured per industry via "compliance packs" instead of forked codebases.

## Why this exists

Regulated engineering teams maintain traceability across
`requirement → design → verification/validation → risk control → evidence`
by hand in spreadsheets or in expensive, rigid enterprise tools. This
platform automates gap detection and audit-readiness scoring against that
chain, with an AI agent that runs on a schedule.

See **[docs/STRATEGY.md](docs/STRATEGY.md)** for positioning, competitive
landscape, and known gaps, and **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**
for the data model and system design.

## Status

Core engine scaffold — no compliance pack has full rule coverage yet. Two
starter packs (`iso13485`, `do178c`) are seeded to prove out the plug-in
architecture. See `docs/ROADMAP.md` for what's next.

## Project layout

```
compliance-platform/
├── docs/            strategy, architecture, roadmap
├── backend/         Express API + Prisma schema + scheduled AI agent
└── frontend/        React/Vite shell
```

## Getting started (backend)

```bash
cd backend
cp .env.example .env   # then set a real DATABASE_URL
npm install
npx prisma migrate dev --name init
node prisma/seed.js
npm run dev
```

## Getting started (frontend)

```bash
cd frontend
npm install
npm run dev
```

## Running the AI agent manually

```bash
cd backend
node src/agent/scheduler.js --once
```
