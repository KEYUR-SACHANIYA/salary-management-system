import express, { type Express, type Router } from "express";

import { errorHandler } from "./shared/error-handler";

export function createApp(options?: {
  employeeRouter?: Router;
  compensationRouter?: Router;
  analyticsRouter?: Router;
}): Express {
  const app = express();

  const allowedOrigins = new Set(
    (process.env.CORS_ORIGINS ?? "http://localhost:3001")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );

  app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }

    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Accept",
    );

    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }

    next();
  });

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