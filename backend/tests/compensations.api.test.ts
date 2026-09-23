import request from "supertest";
import { createApp } from "../src/app";
import { CompensationController } from "../src/modules/compensations/compensation.controller";
import { createCompensationRouter } from "../src/modules/compensations/compensation.routes";
import { CompensationService } from "../src/modules/compensations/compensation.service";
import type { CompensationRepository } from "../src/modules/compensations/compensation.repository";
import type { Compensation, CreateCompensationInput } from "../src/modules/compensations/compensation.types";
import { EmployeeNotFoundError } from "../src/shared/errors";

const EMPLOYEE_ID = "11111111-1111-4111-8111-111111111111";
const MISSING_ID = "00000000-0000-4000-8000-000000000000";
const INVALID_ID = "not-a-uuid";

function compensation(overrides: Partial<Compensation> = {}): Compensation {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    employeeId: EMPLOYEE_ID,
    amount: "100000.00",
    currency: "USD",
    payFrequency: "ANNUALLY",
    effectiveFrom: "2025-01-01",
    effectiveTo: null,
    changeReason: "HIRE",
    createdAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    amount: "120000.00",
    currency: "USD",
    payFrequency: "ANNUALLY",
    effectiveFrom: new Date().toISOString().slice(0, 10),
    changeReason: "PROMOTION",
    ...overrides,
  };
}

class FakeCompensationRepository implements CompensationRepository {
  history: Compensation[] = [];
  addResult = compensation({
    id: "33333333-3333-4333-8333-333333333333",
    amount: "120000.00",
    effectiveFrom: "2026-10-01",
    changeReason: "PROMOTION",
  });
  getHistoryError: Error | undefined;
  addError: Error | undefined;
  addCalls: Array<{ employeeId: string; input: CreateCompensationInput }> = [];

  async getHistory(_employeeId: string): Promise<Compensation[]> {
    if (this.getHistoryError) throw this.getHistoryError;
    return this.history;
  }

  async addCompensation(employeeId: string, input: CreateCompensationInput): Promise<Compensation> {
    if (this.addError) throw this.addError;
    this.addCalls.push({ employeeId, input });
    return this.addResult;
  }
}

function appWith(repository: FakeCompensationRepository) {
  const controller = new CompensationController(new CompensationService(repository));
  return createApp({ compensationRouter: createCompensationRouter(controller) });
}

describe("Compensation HTTP API", () => {
  describe("GET /api/v1/employees/:id/compensations", () => {
    it("returns 200 and history in a data envelope", async () => {
      const repository = new FakeCompensationRepository();
      repository.history = [
        compensation({
          id: "future",
          effectiveFrom: "2099-01-01",
          effectiveTo: null,
          amount: "130000.00",
        }),
        compensation({ effectiveTo: "2098-12-31" }),
      ];

      const response = await request(appWith(repository)).get(
        `/api/v1/employees/${EMPLOYEE_ID}/compensations`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toMatchObject({
        id: "future",
        status: "FUTURE",
        amount: "130000.00",
      });
      expect(response.body.data[1]).toMatchObject({
        id: repository.history[1]?.id,
        status: "CURRENT",
      });
      expect(Object.keys(response.body)).toEqual(["data"]);
    });

    it("returns 200 with an empty data array", async () => {
      const response = await request(appWith(new FakeCompensationRepository())).get(
        `/api/v1/employees/${EMPLOYEE_ID}/compensations`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: [] });
    });

    it("returns 400 VALIDATION_ERROR for an invalid UUID", async () => {
      const response = await request(appWith(new FakeCompensationRepository())).get(
        `/api/v1/employees/${INVALID_ID}/compensations`,
      );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: { code: "VALIDATION_ERROR", message: "Employee id must be a valid UUID." },
      });
    });

    it("returns 404 EMPLOYEE_NOT_FOUND when the employee is missing", async () => {
      const repository = new FakeCompensationRepository();
      repository.getHistoryError = new EmployeeNotFoundError();
      const response = await request(appWith(repository)).get(
        `/api/v1/employees/${MISSING_ID}/compensations`,
      );

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: { code: "EMPLOYEE_NOT_FOUND", message: "Employee not found" },
      });
    });

    it("maps unexpected errors to INTERNAL_SERVER_ERROR without internal details", async () => {
      const repository = new FakeCompensationRepository();
      repository.getHistoryError = new Error("password=super-secret connection lost");
      const response = await request(appWith(repository)).get(
        `/api/v1/employees/${EMPLOYEE_ID}/compensations`,
      );

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" },
      });
      expect(JSON.stringify(response.body)).not.toContain("super-secret");
    });
  });

  describe("POST /api/v1/employees/:id/compensations", () => {
    it("returns 201 for a valid immediate compensation", async () => {
      const repository = new FakeCompensationRepository();
      const body = validBody();
      const response = await request(appWith(repository))
        .post(`/api/v1/employees/${EMPLOYEE_ID}/compensations`)
        .send(body);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ data: repository.addResult });
      expect(repository.addCalls).toEqual([{ employeeId: EMPLOYEE_ID, input: body }]);
    });

    it("returns 201 for a valid future compensation", async () => {
      const repository = new FakeCompensationRepository();
      const body = validBody({ effectiveFrom: "2099-01-01" });
      const response = await request(appWith(repository))
        .post(`/api/v1/employees/${EMPLOYEE_ID}/compensations`)
        .send(body);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ data: repository.addResult });
      expect(repository.addCalls[0]?.input.effectiveFrom).toBe("2099-01-01");
    });

    it("returns 400 VALIDATION_ERROR for an invalid UUID", async () => {
      const repository = new FakeCompensationRepository();
      const response = await request(appWith(repository))
        .post(`/api/v1/employees/${INVALID_ID}/compensations`)
        .send(validBody());

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(repository.addCalls).toEqual([]);
    });

    it("returns 400 VALIDATION_ERROR when the body is missing", async () => {
      const repository = new FakeCompensationRepository();
      const response = await request(appWith(repository)).post(
        `/api/v1/employees/${EMPLOYEE_ID}/compensations`,
      );

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(repository.addCalls).toEqual([]);
    });

    it("returns 400 VALIDATION_ERROR for a malformed body", async () => {
      const repository = new FakeCompensationRepository();
      const response = await request(appWith(repository))
        .post(`/api/v1/employees/${EMPLOYEE_ID}/compensations`)
        .send(["not", "an", "object"]);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(repository.addCalls).toEqual([]);
    });

    it("returns 400 VALIDATION_ERROR for an invalid amount", async () => {
      const repository = new FakeCompensationRepository();
      const response = await request(appWith(repository))
        .post(`/api/v1/employees/${EMPLOYEE_ID}/compensations`)
        .send(validBody({ amount: "0.00" }));

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(repository.addCalls).toEqual([]);
    });

    it("returns 400 VALIDATION_ERROR for an invalid currency", async () => {
      const repository = new FakeCompensationRepository();
      const response = await request(appWith(repository))
        .post(`/api/v1/employees/${EMPLOYEE_ID}/compensations`)
        .send(validBody({ currency: "JPY" }));

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(repository.addCalls).toEqual([]);
    });

    it("returns 400 VALIDATION_ERROR for an invalid pay frequency", async () => {
      const repository = new FakeCompensationRepository();
      const response = await request(appWith(repository))
        .post(`/api/v1/employees/${EMPLOYEE_ID}/compensations`)
        .send(validBody({ payFrequency: "DAILY" }));

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(repository.addCalls).toEqual([]);
    });

    it("returns 400 VALIDATION_ERROR for an invalid change reason", async () => {
      const repository = new FakeCompensationRepository();
      const response = await request(appWith(repository))
        .post(`/api/v1/employees/${EMPLOYEE_ID}/compensations`)
        .send(validBody({ changeReason: "BONUS" }));

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(repository.addCalls).toEqual([]);
    });

    it("returns 400 VALIDATION_ERROR for a past effective date", async () => {
      const repository = new FakeCompensationRepository();
      const response = await request(appWith(repository))
        .post(`/api/v1/employees/${EMPLOYEE_ID}/compensations`)
        .send(validBody({ effectiveFrom: "2020-01-01" }));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: {
          code: "VALIDATION_ERROR",
          message: "Compensation effective date cannot be in the past",
        },
      });
      expect(repository.addCalls).toEqual([]);
    });

    it("ignores employeeId in the body and uses the URL id", async () => {
      const repository = new FakeCompensationRepository();
      const response = await request(appWith(repository))
        .post(`/api/v1/employees/${EMPLOYEE_ID}/compensations`)
        .send({ ...validBody(), employeeId: MISSING_ID });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(repository.addCalls).toEqual([]);
    });

    it("rejects effectiveTo from the request body", async () => {
      const repository = new FakeCompensationRepository();
      const response = await request(appWith(repository))
        .post(`/api/v1/employees/${EMPLOYEE_ID}/compensations`)
        .send({ ...validBody(), effectiveTo: "2099-12-31" });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(repository.addCalls).toEqual([]);
    });

    it("returns 404 EMPLOYEE_NOT_FOUND when the employee is missing", async () => {
      const repository = new FakeCompensationRepository();
      repository.addError = new EmployeeNotFoundError();
      const response = await request(appWith(repository))
        .post(`/api/v1/employees/${MISSING_ID}/compensations`)
        .send(validBody());

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: { code: "EMPLOYEE_NOT_FOUND", message: "Employee not found" },
      });
    });

    it("maps unexpected errors to INTERNAL_SERVER_ERROR without internal details", async () => {
      const repository = new FakeCompensationRepository();
      repository.addError = new Error("password=super-secret connection lost");
      const response = await request(appWith(repository))
        .post(`/api/v1/employees/${EMPLOYEE_ID}/compensations`)
        .send(validBody());

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" },
      });
      expect(JSON.stringify(response.body)).not.toContain("super-secret");
    });
  });
});
