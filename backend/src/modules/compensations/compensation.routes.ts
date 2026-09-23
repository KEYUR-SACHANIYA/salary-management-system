import { Router } from "express";
import { CompensationController } from "./compensation.controller";

export function createCompensationRouter(controller: CompensationController): Router {
  const router = Router();

  router.get("/:id/compensations", (request, response, next) => {
    void controller.getHistory(request, response).catch(next);
  });

  router.post("/:id/compensations", (request, response, next) => {
    void controller.addCompensation(request, response).catch(next);
  });

  return router;
}
