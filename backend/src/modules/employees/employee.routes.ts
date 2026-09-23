import { Router } from "express";
import { EmployeeController } from "./employee.controller";

export function createEmployeeRouter(controller: EmployeeController): Router {
  const router = Router();

  router.get("/", (request, response, next) => {
    void controller.list(request, response).catch(next);
  });

  router.get("/:id", (request, response, next) => {
    void controller.getById(request, response).catch(next);
  });

  return router;
}
