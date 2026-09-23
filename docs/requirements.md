# Requirements

## Goal

ACME’s HR manager tracks pay for 10,000 employees in several countries, all in Excel. This app lets them find people, update salaries, and see how the company pays.

## What we will build

- **Employee list.** Code, name, country, department, role, and current pay. Search by name or employee code. Filter by country, department, currency, and pay frequency. Paging and sorting run on the server. Sort by name, employee code, or salary.
- **Employee page.** Current pay, a future change if one is scheduled, and salary history. Name, country, department, and role stay read-only.
- **Salary update.** Amount, currency, pay frequency, start date, and reason. Past salaries stay in history. The save either completes fully or not at all.
- **Pay frequency.** Annual, monthly, weekly, or hourly.
- **Dashboard.** Current pay only: headcount, total, average, median, lowest, and highest, overall and by country and department.
- **Seed data.** One script loads exactly 10,000 employees, with realistic local pay and the history cases above.

## How the numbers work

- We store the contract amount. Yearly and converted figures are calculated when shown.
- Everyone is full-time. Yearly pay equals the annual amount, monthly × 12, weekly × 52, or hourly × 40 × 52.
- The dashboard shows one reporting currency, USD by default. Rates are fixed as of 2026-09-23 and shown on the page. The employee list still shows the original amount and currency.
- The dashboard also shows yearly totals in each original currency.
- Salary sort uses the yearly amount in the selected currency.
- A future start date stays off current pay and the dashboard until that day.

## Left out, and why

- Payroll, tax, benefits, bonuses, leave, attendance, hiring, and reviews. The need is to find people, update base pay, and explain it.
- Editing name, country, department, or role, and screens to manage those lists. The seed supplies them.
- Login, roles, and approvals. One HR manager uses the app.
- Live exchange rates, part-time hours, CSV import or export, and notifications. Fixed rates keep the math easy to test. The rest is not needed to explain pay.

## Stack

Next.js and React for the UI. Express for the API. PostgreSQL for data. TypeScript throughout. Tests cover pay rules, the API, and the main screens.
