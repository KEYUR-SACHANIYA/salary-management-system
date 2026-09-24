# Frontend App

Next.js + React + TypeScript frontend for the ACME salary management assessment.

## Prerequisites

- Node.js and npm installed
- Backend API running locally or reachable over HTTP
- A `.env.local` file created from `.env.example`

## Local setup

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev -- --port 3001
```

The frontend expects:

- `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:3000`)

## Available scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
```

## Stack used

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Recharts for chart visualizations
- Jest + React Testing Library for UI tests

## Major screens

- `/` — salary overview dashboard
- `/employees` — employee directory with search, filters, sorting, and pagination
- `/employees/[id]` — employee profile, future salary scheduling, compensation history, and update form

## Notes

The frontend is intentionally lightweight and follows the requirement set closely: no Redux store, no custom state framework, and no unnecessary abstraction beyond API helpers and component structure.

## Local run expectations

To work correctly with the backend, the API should be available on the URL defined in `NEXT_PUBLIC_API_BASE_URL`. The default local setup is:

- Frontend: `http://localhost:3001`
- Backend: `http://localhost:3000`

This matches the repository’s local development flow for the assessment.
