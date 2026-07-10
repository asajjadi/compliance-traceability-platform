# Self-Hosting / On-Prem Deployment

For customers who need on-prem or air-gapped deployment (common in
aerospace/defense procurement — see `docs/STRATEGY.md`) rather than the
hosted SaaS. Runs the whole stack (Postgres + backend + frontend) via Docker
Compose on infrastructure you control.

## Prerequisites

Docker and Docker Compose (v2, i.e. the `docker compose` subcommand).

## Setup

```bash
cp .env.example .env
# edit .env: set a real POSTGRES_PASSWORD and a long random JWT_SECRET
docker compose up -d --build
```

This starts three services:

- `db` — Postgres 16, data persisted in the `db-data` named volume.
- `backend` — Express API on port `4000`. Runs `prisma migrate deploy` on
  container start, so schema migrations apply automatically on upgrade —
  no manual migration step needed after `docker compose pull && docker
  compose up -d`.
- `frontend` — the built React SPA served by nginx on port `8080`, which
  reverse-proxies `/api/*` to the `backend` service over the internal
  Docker network (see `frontend/nginx.conf`).

Once it's up, seed the two starter compliance packs (one-time, or after
adding new packs — safe to re-run, see `backend/prisma/seed.js`):

```bash
docker compose exec backend node prisma/seed.js
```

Then open `http://<host>:8080` and sign up (creates your organization).

## Air-gapped notes

- The images pull from public registries (`node:22-alpine`,
  `postgres:16-alpine`, `nginx:alpine`) and `npm ci` fetches packages from
  the registry configured in your environment during `docker compose build`
  — for a fully air-gapped environment, build the images on a
  network-connected host first, then transfer the built images (`docker
  save` / `docker load`) rather than building on the air-gapped host
  directly.
- No outbound network calls happen at runtime — the backend only talks to
  its own Postgres container, and the frontend only talks to the backend
  container. (There is no telemetry/analytics call anywhere in this
  codebase to disable.)

## Known limitation

This setup has been validated by parsing `docker-compose.yml` with `docker
compose config` (confirms syntax and variable interpolation) and by running
each container's underlying commands directly on the host (`npm ci`, `npx
prisma generate`, `npx prisma migrate deploy`, `npm run build`) — all
verified working. The actual `docker compose up --build` has **not** been
run end-to-end, because no Docker daemon was available in the environment
this was built in. Run it once in a real Docker environment before relying
on it for a customer deployment.
