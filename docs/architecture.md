# Architecture

This application implements the salary-management assessment for ACME’s HR workflow. The repository contains a working full-stack solution built around a small modular backend and a three-page Next.js frontend.

## System overview

```text
Browser
  └── Next.js UI
        ├── /                Dashboard
        ├── /employees       Employee directory
        └── /employees/[id]  Employee detail and salary change form
              │
              └── HTTP JSON
                    │
                    v
              Express API
                    ├── Employees module
                    ├── Compensations module
                    └── Analytics module
                            │
                            v
                        PostgreSQL
```

## Frontend

The frontend is a Next.js app that renders three major screens:

- `/` — dashboard overview with reporting currency, summary cards, breakdown charts, and FX-rate reference data
- `/employees` — searchable, filterable, sortable employee directory with server-side pagination
- `/employees/[id]` — employee profile, active and future compensation, salary history, and compensation form

The UI uses app-router pages, reusable components, typed API helpers, and a small shared formatting layer.

## Backend

The backend is a modular monolith in `backend/src`:

- `modules/employees` — employee listing and detail queries
- `modules/compensations` — salary change creation and validation logic
- `modules/analytics` — aggregate salary dashboard data
- `shared/pay-rules.ts` — annualized pay and reporting-currency calculations
- `db` — PostgreSQL schema and seed utilities

Requests flow through controller → service → repository, with raw SQL implemented in PostgreSQL repositories.

## Data model

The data model is intentionally small and relational:

```text
employees
    1
    |
    many
employee_compensations
```

- Each employee has a unique code.
- Compensation rows store the original amount, currency, pay frequency, and effective dates.
- Only the current and future records are active for compensation decisions.
- Salary changes are atomic and committed as a single transaction.

## Pay rules

The business rules are implemented in shared logic and remain deterministic:

- Frequencies: `ANNUALLY`, `MONTHLY`, `WEEKLY`, `HOURLY`
- Annualized amount uses the fixed full-time assumptions from the assessment
- Reporting-currency conversion uses the fixed FX table as of 2026-09-23
- Future-dated compensation does not affect current analytics until its effective date

## Local development flow

- Frontend runs separately from the API on different ports: backend defaults to `3000`, frontend is run on `3001` during local development.
- Backend uses `DATABASE_URL` and `CORS_ORIGINS` from `.env`.
- Frontend uses `NEXT_PUBLIC_API_BASE_URL` to target the backend.

## Verification status

The implementation has been verified with the project’s actual test and build commands:

- Backend test suite: 12 passing suites, 152 passing tests
- Frontend build: compiled successfully
- Frontend test suite: 9 passing suites, 28 passing tests
