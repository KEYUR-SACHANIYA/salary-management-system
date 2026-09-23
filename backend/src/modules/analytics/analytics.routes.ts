import { Router } from "express";
import { AnalyticsController } from "./analytics.controller";

export function createAnalyticsRouter(controller: AnalyticsController): Router {
  const router = Router();

  router.get("/salary", (request, response, next) => {
    void controller.getSalaryAnalytics(request, response).catch(next);
  });

  return router;
}
