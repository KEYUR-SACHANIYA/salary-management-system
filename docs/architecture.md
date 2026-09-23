# Architecture

Salary management for ACME’s HR manager: find people, record salary changes, and see how the company pays 10,000 employees. The behavior is defined in `docs/requirements.md`. This document describes how that product will be built. No application code is included yet.

## Applications

Two deployable applications.

| Application | Stack | Host |
| --- | --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS | Vercel |
| Backend | Node.js, Express, TypeScript, PostgreSQL | Render |

PostgreSQL runs on Render PostgreSQL, with the API. The browser talks to the API over HTTPS and JSON. Environment variables, including the API URL and the database connection string, will be set when deployment is configured.

```text
Browser
   |
   v
Next.js / React
   |
   | HTTPS / JSON
   v
Express API
   |
   +-- Employees
   +-- Compensations
   +-- Analytics
   |
   v
PostgreSQL
```

Next.js renders the web UI. Express serves the API. The backend is one process: a modular monolith. Employees, Compensations, and Analytics are modules inside that process. They call each other in memory. They are not separate services and do not call each other over HTTP.

## Backend

Planned layout:

```text
backend/
└── src/
    ├── main.ts
    ├── app.ts
    ├── modules/
    │   ├── employees/
    │   ├── compensations/
    │   └── analytics/
    ├── shared/
    │   └── pay-rules.ts
    └── db/
```

`main.ts` is the composition root. It creates the concrete objects and starts the server. `app.ts` mounts the HTTP routes. `modules/` holds the three business areas. `shared/pay-rules.ts` holds salary math. `db/` holds the pool, migrations, and the seed script.

Dependencies inside a module point one way:

```text
Controller
    ↓
Service
    ↓
Repository interface
    ↓
PostgreSQL repository
    ↓
PostgreSQL
```

The controller handles the request and the response. The service runs the use case: validation, decisions, and the steps of a transaction. The repository interface is the persistence contract the service depends on. The PostgreSQL repository is the only place that contains SQL.

Pay rules are pure functions. They do not read HTTP or the database, so the same inputs always produce the same outputs and can be unit tested directly.

Repository interfaces isolate application services from PostgreSQL-specific persistence details. A persistence technology change would primarily affect repository implementations and the composition root, while database-specific schema, queries, transactions, and migrations would still require corresponding changes.

The module boundaries provide reasonable seams for future evolution if independent scaling or deployment becomes necessary, but the current assessment does not require that complexity.

## Frontend

Three pages. The UI stays flat: routes, components, API helpers, and types. Feature folders, Redux, and a `hooks/` directory are not part of the plan. A hook can be added later if a real screen needs one.

```text
frontend/
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── employees/
    │       ├── page.tsx
    │       └── [id]/
    │           └── page.tsx
    ├── components/
    │   ├── ui/
    │   ├── employees/
    │   └── dashboard/
    ├── lib/
    │   ├── api-client.ts
    │   ├── employees-api.ts
    │   ├── analytics-api.ts
    │   ├── formatting.ts
    │   └── constants.ts
    └── types/
```

`app/` defines the routes and composes each page. `components/ui/` is for controls reused across screens. `components/employees/` and `components/dashboard/` are specific to those screens. `lib/` is how the UI reaches the API, plus formatting and shared constants. Components do not call `fetch` themselves. `types/` holds the frontend TypeScript types. Search, filters, and paging will live in the URL query string.

### Routes

`/` is the dashboard. It shows a reporting currency (USD by default), headcount, total annualized pay, average, median, lowest, and highest. It breaks those figures down by country and by department, shows yearly totals in each original currency, and shows the fixed rate table. It links to the employee list.

`/employees` is the directory. HR can search by name or employee code and filter by country, department, native currency, and pay frequency. Paging and sorting run on the server. Sort fields are name, employee code, and salary. Each row shows the original amount, currency, and frequency.

`/employees/[id]` shows the person, current pay, a future pay row when one is scheduled, and the full history. A salary change adds a record. History is not edited or deleted. A correction is a new compensation record. Name, country, department, and role stay read-only.

## API

| Method | Path |
| --- | --- |
| `GET` | `/api/v1/employees` |
| `GET` | `/api/v1/employees/:id` |
| `GET` | `/api/v1/employees/:id/compensations` |
| `POST` | `/api/v1/employees/:id/compensations` |
| `GET` | `/api/v1/analytics/salary` |

The employee list accepts `page`, `pageSize`, `search`, `country`, `department`, `currency`, `payFrequency`, `sortBy`, `sortOrder`, and `reportingCurrency`. Defaults are page 1, page size 20, maximum page size 100, and reporting currency USD. Salary sort uses the annualized amount in that reporting currency. These routes are not implemented yet.

## Data model

```text
employees
    1
    |
    many
employee_compensations
```

Employee code is unique. Each compensation row belongs to one employee. Periods for the same employee do not overlap. Current pay is the row whose effective dates cover today. A future start date does not change current analytics until that day. Past rows are not edited or deleted. A correction is a new row. A salary change commits in one transaction or not at all. The database stores the original amount, currency, and frequency. The annualized amount is calculated when a screen or sort needs it. A later seed will load exactly 10,000 employees. No SQL is written in this step.

## Pay rules

Frequencies are `ANNUALLY`, `MONTHLY`, `WEEKLY`, and `HOURLY`. Everyone is full-time: 40 hours a week, 52 weeks a year.

| Frequency | Yearly amount |
| --- | --- |
| `ANNUALLY` | amount |
| `MONTHLY` | amount × 12 |
| `WEEKLY` | amount × 52 |
| `HOURLY` | amount × 40 × 52 |

Currencies are USD, INR, GBP, EUR, CAD, and SGD. Rates are units per 1 USD, fixed on 2026-09-23: USD 1, INR 95.72, GBP 0.75, EUR 0.88, CAD 1.41, SGD 1.28.

`annualInTarget = annualAmount × rate[target] / rate[source]`

There is no live FX API. The dashboard shows the table so the conversion is visible.

## Testing

Backend tests use Jest. Pay rules are unit tested with no database. Services are tested with fake repositories. Supertest covers the API. Selected repository tests will run against PostgreSQL where the SQL itself needs a check.

Frontend tests use React Testing Library for search and filters, validation, loading, empty, and error states, compensation history, and dashboard behavior.

A behavior is written test first: red, green, refactor, then a commit. The goal is a small set of tests that describe the product, not a coverage percentage. Test files are not created in this step.

## Why this shape

**Modular monolith.** One product, five endpoints, 10,000 employees. One process avoids distributed-system complexity. Three modules still separate directory, salary changes, and analytics.

**PostgreSQL.** Employees and compensation history are relational. Salary changes need a transaction. Uniqueness, date rules, filters, sort, and paging fit a relational database.

**Raw SQL.** The model is two tables and a small set of queries. Explicit SQL is enough. An ORM is not required for this assessment.

**Simple frontend.** A few routes do not need feature folders or a global store. `app/`, `components/`, `lib/`, and `types/` are enough until a screen actually gets more complicated.

## Left out

Microservices, Redis, Kafka, GraphQL, Prisma, CQRS, event sourcing, authentication, and RBAC. Also payroll, tax, benefits, bonuses, notifications, a live FX API, CSV import or export, extra caching, and global client state. None of these are needed to replace the spreadsheet or explain how the company pays.
