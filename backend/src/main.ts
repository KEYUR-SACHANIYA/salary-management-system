import { Pool } from "pg";
import { createApp } from "./app";
import { PostgresAnalyticsRepository } from "./modules/analytics/analytics.postgres-repository";
import { AnalyticsService } from "./modules/analytics/analytics.service";
import { AnalyticsController } from "./modules/analytics/analytics.controller";
import { createAnalyticsRouter } from "./modules/analytics/analytics.routes";
import { PostgresCompensationRepository } from "./modules/compensations/compensation.postgres-repository";
import { CompensationService } from "./modules/compensations/compensation.service";
import { CompensationController } from "./modules/compensations/compensation.controller";
import { createCompensationRouter } from "./modules/compensations/compensation.routes";
import { PostgresEmployeeRepository } from "./modules/employees/employee.postgres-repository";
import { EmployeeService } from "./modules/employees/employee.service";
import { EmployeeController } from "./modules/employees/employee.controller";
import { createEmployeeRouter } from "./modules/employees/employee.routes";

const port = Number(process.env.PORT ?? 3000);
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

function createPoolConfig(connectionString: string) {
  const hostname = new URL(connectionString).hostname;
  const usesRemoteDatabase = !["localhost", "127.0.0.1", "::1"].includes(hostname);

  return {
    connectionString,
    ...(usesRemoteDatabase ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}

const pool = new Pool(createPoolConfig(databaseUrl));

const employeeRepository = new PostgresEmployeeRepository(pool);
const employeeService = new EmployeeService(employeeRepository);
const employeeController = new EmployeeController(employeeService);

const compensationRepository = new PostgresCompensationRepository(pool);
const compensationService = new CompensationService(compensationRepository);
const compensationController = new CompensationController(compensationService);

const analyticsRepository = new PostgresAnalyticsRepository(pool);
const analyticsService = new AnalyticsService(analyticsRepository);
const analyticsController = new AnalyticsController(analyticsService);

createApp({
  employeeRouter: createEmployeeRouter(employeeController),
  compensationRouter: createCompensationRouter(compensationController),
  analyticsRouter: createAnalyticsRouter(analyticsController),
}).listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
});
