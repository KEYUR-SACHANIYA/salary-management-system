-- Salary management schema.
-- Current vs future pay is decided in the application from these dates.
-- A future salary is allowed: effective_from may be after today.

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  country VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  role VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE employee_compensations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees (id) ON DELETE CASCADE,
  amount NUMERIC(14, 2) NOT NULL,
  currency CHAR(3) NOT NULL,
  pay_frequency VARCHAR(20) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  change_reason VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT employee_compensations_amount_positive
    CHECK (amount > 0),

  CONSTRAINT employee_compensations_currency_supported
    CHECK (currency IN ('USD', 'INR', 'GBP', 'EUR', 'CAD', 'SGD')),

  CONSTRAINT employee_compensations_pay_frequency_supported
    CHECK (pay_frequency IN ('ANNUALLY', 'MONTHLY', 'WEEKLY', 'HOURLY')),

  CONSTRAINT employee_compensations_change_reason_supported
    CHECK (
      change_reason IS NULL
      OR change_reason IN (
        'HIRE',
        'ANNUAL_REVIEW',
        'PROMOTION',
        'MARKET_ADJUSTMENT',
        'CORRECTION',
        'ROLE_CHANGE'
      )
    ),

  CONSTRAINT employee_compensations_period_valid
    CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

-- At most one open-ended compensation per employee.
-- Scheduling a future change closes the previous row and inserts a new open row.
CREATE UNIQUE INDEX employee_compensations_one_open_per_employee
  ON employee_compensations (employee_id)
  WHERE effective_to IS NULL;

CREATE INDEX employees_country_idx
  ON employees (country);

CREATE INDEX employees_department_idx
  ON employees (department);

-- History reads and "which row is active" lookups. Also covers employee_id alone.
CREATE INDEX employee_compensations_employee_effective_from_idx
  ON employee_compensations (employee_id, effective_from DESC);
