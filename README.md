# SpendWise

SpendWise is a responsive, dashboard-first expense management application. The frontend includes a local demo workspace for immediate exploration; the Express API and PostgreSQL schema provide the authenticated persistence foundation.

## Features

- Income and expense dashboard with cash-flow and category charts
- Add transactions, search, type filters, responsive transaction list, and CSV export
- Budget tracking, reports, recurring payment overview, and profile preferences
- Responsive layout, dark mode, toast feedback, accessible labels, keyboard-friendly controls
- PostgreSQL schema with user-scoped financial records, validation, secure password hashes, JWT in HTTP-only cookie, rate limiting, and parameterized SQL
- Docker Compose, Nginx reverse-proxy example, CI workflow, migration, and demo seed

## Stack and architecture

React 18, Vite, JavaScript, Recharts, Lucide, Express, PostgreSQL, Zod, bcrypt, JWT.

```
src/                         React dashboard
server/src/routes/            Auth and transaction REST routes
server/src/migrations/        PostgreSQL schema migration
server/seed.js                Idempotent demo seed
nginx/spendwise.conf          Reverse proxy example
```

## Run locally

1. Install Node.js 20+ and PostgreSQL 15+.
2. Copy `.env.example` to `.env`; set `DATABASE_URL` and a random `JWT_SECRET` of at least 32 characters.
3. Install dependencies: `npm install`.
4. Apply schema: `node server/migrate.js`.
5. Add the development account: `node server/seed.js`.
6. Start API and Vite: `npm run dev`.
7. Visit `http://localhost:5180`. API health: `http://localhost:4000/api/health`; API docs: `http://localhost:4000/api/docs`.

Sign in with the seeded demo account. Demo transactions persist in this browser's local storage. The sign-in/register screen calls the authenticated API for non-demo accounts; use `npm run dev` or Docker to run the API.

## Docker

Set `JWT_SECRET` in a local `.env` file. Then run `docker compose up --build`. The API and built SPA are served on port 4000; PostgreSQL is private to the Compose network. For a fresh database, run `docker compose exec app node server/migrate.js`, then `docker compose exec app node server/seed.js` for the demo data.

## Environment

`NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL`, and optional `AI_API_KEY` / `AI_MODEL`. Never commit `.env` or production secrets.

## REST API

All financial endpoints require a valid session cookie or Bearer token.

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Clear session cookie |
| GET/PATCH | `/api/auth/me` | Read/update profile |
| GET/POST | `/api/transactions` | List/create transactions |
| PATCH/DELETE | `/api/transactions/:id` | Update/delete own transaction |
| GET | `/api/transactions/analytics/summary` | Aggregate own income/expenses |
| GET | `/api/health` | Database-backed health status |
| GET | `/api/docs` | API route overview |

Transaction listing supports `search`, `type`, `category`, `method`, `from`, `to`, `min`, `max`, `page`, `limit`, `sort`, and `order`. Responses use `{success,data,pagination?}`. PostgreSQL `NUMERIC` amounts are returned as decimal strings. IDs and `user_id` constraints enforce account isolation.

## Database and seed

The migration creates users, categories, transactions, budgets, recurring transactions, and notifications with constraints and indexes. `node server/seed.js` creates `demo@spendwise.local` / `DemoPassword123!` and sample records. This development credential must never be used in production.

## Tests and build

`npm test` runs the budget threshold and decimal-safe sum unit tests. `npm run build` creates the production SPA bundle. The GitHub Actions workflow runs tests, frontend build, and Docker image build on pushes and pull requests.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for AWS EC2 setup, Nginx, TLS, operations, and future deployment secrets. `nginx/spendwise.conf` proxies `/api` and serves SPA routes through the app container. For a public deployment, terminate TLS at Nginx or a managed load balancer and set secure environment values.

## Security notes

Passwords are hashed with bcrypt; auth tokens use HTTP-only, SameSite=Lax cookies; request bodies are limited; auth endpoints are rate-limited; Helmet adds security headers; API SQL is parameterized; financial queries are scoped to the authenticated user. Rotate secrets and use a managed database and TLS in production.

## Known limitations

The demo dashboard uses browser-local sample data and is not yet connected to live transaction APIs. Budget and recurring screens are presentation-level while their relational schema is ready. Category CRUD, full OpenAPI/Swagger schemas, AI insights, notifications, and account-registration UI are natural next implementation steps. The app does not call an external AI service.

## Future improvements

Connect the dashboard data layer to the authenticated API; implement full budgets and recurring CRUD with idempotent generation; add category management, refresh-token rotation, MFA, alert delivery, OpenAPI schemas, and integration/visual regression coverage.

