import express, { type Express, type Router } from "express";
import { errorHandler } from "./shared/error-handler";

export function createApp(options?: {
  employeeRouter?: Router;
  compensationRouter?: Router;
  analyticsRouter?: Router;
}): Express {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  if (options?.employeeRouter) {
    app.use("/api/v1/employees", options.employeeRouter);
  }

  if (options?.compensationRouter) {
    app.use("/api/v1/employees", options.compensationRouter);
  }

  if (options?.analyticsRouter) {
    app.use("/api/v1/analytics", options.analyticsRouter);
  }

  app.use(errorHandler);
  return app;
}
