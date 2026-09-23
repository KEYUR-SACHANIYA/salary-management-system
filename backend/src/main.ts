import { Pool } from "pg";
import { createApp } from "./app";
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

const pool = new Pool({ connectionString: databaseUrl });
const employeeRepository = new PostgresEmployeeRepository(pool);
const employeeService = new EmployeeService(employeeRepository);
const employeeController = new EmployeeController(employeeService);

createApp({
  employeeRouter: createEmployeeRouter(employeeController),
}).listen(port);
