# BCIS - Subscription Billing and Collection System

A desktop application for Bukidnon Cable and Internet Services (BCIS) to manage subscriber billing, payments, collections, and receivables across three simultaneous office PCs.

## Architecture

Three Electron desktop clients connect over a LAN to a central Fastify API, which is the only component that talks to PostgreSQL. See `docs/architecture.md` for the full diagram.

```
PC 1: Owner/Admin ─┐
PC 2: Cashier ──────┼── LAN ──> BCIS API Server ──> PostgreSQL
PC 3: Operations ───┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron + electron-vite |
| UI | React 19 + TypeScript (strict) |
| API | Fastify 5 + TypeScript |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Testing | Vitest |

## Prerequisites

- Node.js (LTS)
- PostgreSQL 16+ installed and running locally
- Git

## Project Structure

```
bcis/
├── apps/
│   ├── api/        # Fastify backend + Drizzle ORM
│   └── desktop/     # Electron + React desktop client
├── eslint.config.mjs
├── .prettierrc.json
└── README.md
```

## Setup

### 1. Clone and install root tooling

```cmd
git clone <repo-url>
cd bcis
npm install
```

### 2. Set up the API

```cmd
cd apps\api
npm install
```

Create `apps\api\.env`:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/bcis_dev
PORT=4000
```

Create the database (if it doesn't exist):

```cmd
psql -U postgres -c "CREATE DATABASE bcis_dev;"
```

Run migrations:

```cmd
npx drizzle-kit migrate
```

Start the API:

```cmd
npm run dev
```

Confirm it's working: open `http://localhost:4000/health/db` — should return `{"status":"ok","database":"connected"}`.

### 3. Set up the desktop client

In a separate terminal:

```cmd
cd apps\desktop
npm install
npm run dev
```

An Electron window should open and, with the API running, display `API: ok, DB: connected`.

## Development Scripts

Root:
- `npm run lint` — lint the whole project
- `npm run format` — auto-format with Prettier
- `npm run format:check` — check formatting without changing files

Inside `apps\api`:
- `npm run dev` — start the API in watch mode
- `npm test` — run Vitest tests
- `npx drizzle-kit generate` — generate a new migration from schema changes
- `npx drizzle-kit migrate` — apply pending migrations

Inside `apps\desktop`:
- `npm run dev` — start Electron in dev mode with hot reload
- `npm run build:win` — build a Windows installer

## Status

Phase 1 (project foundation) complete: repository structure, Fastify API with a live database-backed health check, PostgreSQL + Drizzle migrations, and an Electron + React client that successfully calls the API end to end.