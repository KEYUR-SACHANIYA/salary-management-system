# Backend API

Express + TypeScript backend for the ACME salary management assessment.

## Prerequisites

- Node.js and npm installed
- PostgreSQL running locally or a valid remote database URL
- A `.env` file created from `.env.example`

## Local setup

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run dev
```

The app expects these environment variables:

- `PORT` (default: `3000`)
- `DATABASE_URL` (required PostgreSQL connection string)
- `CORS_ORIGINS` (default: `http://localhost:3001`)

## Available scripts

```bash
npm run dev
npm run build
npm test
npm run db:seed
```

## API entry points

- `GET /health`
- `GET /api/v1/employees`
- `GET /api/v1/employees/:id`
- `GET /api/v1/employees/:id/compensations`
- `POST /api/v1/employees/:id/compensations`
- `GET /api/v1/analytics/salary`

## Notes

The backend uses a modular monolith design with separate employee, compensation, and analytics modules. Salary rules and reporting logic are shared server-side and validated by automated tests.
