# Contract Analyzer

Understand contracts before you sign — upload a PDF, run an agent pipeline, read an evidence-backed summary, and ask up to 10 grounded questions. This project is my assignment for Devscale AI Product Engineering Week 4

## Stack

- **Frontend:** React 19 + Vite + TanStack Router + Tailwind v4 + shadcn/ui + [Kibo UI](https://www.kibo-ui.com/)
- **API:** Hono + Prisma + BullMQ + Anvia (`@anvia/*`)
- **Infra:** your own Postgres + Redis (ports from root `.env`)

## Setup

1. Copy env and fill values:

```bash
cp .env-example .env
```

Required:

- `DATABASE_URL` — Postgres connection string
- `REDIS_HOST` / `REDIS_PORT` / `REDIS_DB`
- `OPENAI_BASE_URL` / `OPENAI_API_KEY`

2. Start your Postgres and Redis containers so they match `.env`.

3. Install and migrate:

```bash
pnpm install
pnpm --filter=api db:deploy
pnpm --filter=api db:generate
```

## Run

Use three processes (or two terminals + worker):

```bash
# API + frontend (parallel)
pnpm dev

# BullMQ worker (required for analysis)
pnpm worker:dev
```

- Frontend: http://localhost:3000
- API: http://localhost:8000

## Demo flow

1. Open `/` and upload a PDF contract.
2. Wait until status is **Ready** (worker runs parse → risk → verify → markdown).
3. Open the contract dashboard: overview, risks with evidence quotes, markdown report.
4. Ask questions in the chat panel (max **10** per contract).

### Quick API checks

```bash
# Upload
curl -F "file=@./sample.pdf" http://localhost:8000/contracts

# Detail
curl http://localhost:8000/contracts/<id>
```

Non-PDF uploads should return `400`. After 10 chat questions, further chat requests return `403`.

## Notes

- Uploaded PDFs are stored under `apps/api/uploads/`.
- `docker-compose.dev.yml` is not required; use the ports in your `.env`.
- Product plan: `PLAN.md`. Task checklist: `PLAN_TASK.md`.
