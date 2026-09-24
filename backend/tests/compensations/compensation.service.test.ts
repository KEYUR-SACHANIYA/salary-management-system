import { EmployeeNotFoundError, ValidationError } from "../../src/shared/errors";
import type { CompensationRepository } from "../../src/modules/compensations/compensation.repository";
import { CompensationService } from "../../src/modules/compensations/compensation.service";
import type { Compensation, CreateCompensationInput } from "../../src/modules/compensations/compensation.types";

const EMPLOYEE_ID = "11111111-1111-4111-8111-111111111111";
const TODAY = "2026-09-24";

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

function change(overrides: Partial<CreateCompensationInput> = {}): CreateCompensationInput {
  return {
    amount: "120000.00",
    currency: "USD",
    payFrequency: "ANNUALLY",
    effectiveFrom: TODAY,
    changeReason: "PROMOTION",
    ...overrides,
  };
}

class FakeCompensationRepository implements CompensationRepository {
  history: Compensation[] = [];
  addResult = compensation({
    id: "33333333-3333-4333-8333-333333333333",
    amount: "120000.00",
    effectiveFrom: TODAY,
    changeReason: "PROMOTION",
  });
  getHistoryError: Error | undefined;
  addError: Error | undefined;
  addCalls: Array<{ employeeId: string; input: CreateCompensationInput }> = [];

  async getHistory(): Promise<Compensation[]> {
    if (this.getHistoryError) throw this.getHistoryError;
    return this.history;
  }

  async addCompensation(employeeId: string, input: CreateCompensationInput): Promise<Compensation> {
    if (this.addError) throw this.addError;
    this.addCalls.push({ employeeId, input });
    return this.addResult;
  }
}

describe("CompensationService", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(`${TODAY}T12:00:00.000Z`));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("getHistory", () => {
    it("returns empty history when the repository returns no rows", async () => {
      const repository = new FakeCompensationRepository();
      const service = new CompensationService(repository);

      await expect(service.getHistory(EMPLOYEE_ID)).resolves.toEqual([]);
    });

    it("maps an in-force compensation to CURRENT", async () => {
      const repository = new FakeCompensationRepository();
      repository.history = [compensation({ effectiveFrom: "2025-01-01", effectiveTo: null })];
      const service = new CompensationService(repository);

      const [item] = await service.getHistory(EMPLOYEE_ID);
      expect(item?.status).toBe("CURRENT");
    });

    it("maps a compensation starting after today to FUTURE", async () => {
      const repository = new FakeCompensationRepository();
      repository.history = [compensation({ effectiveFrom: "2026-10-01", effectiveTo: null })];
      const service = new CompensationService(repository);

      const [item] = await service.getHistory(EMPLOYEE_ID);
      expect(item?.status).toBe("FUTURE");
    });

    it("maps a compensation that ended before today to HISTORICAL", async () => {
      const repository = new FakeCompensationRepository();
      repository.history = [compensation({ effectiveFrom: "2025-01-01", effectiveTo: "2026-09-23" })];
      const service = new CompensationService(repository);

      const [item] = await service.getHistory(EMPLOYEE_ID);
      expect(item?.status).toBe("HISTORICAL");
    });

    it("treats a compensation ending today as CURRENT", async () => {
      const repository = new FakeCompensationRepository();
      repository.history = [compensation({ effectiveFrom: "2025-01-01", effectiveTo: TODAY })];
      const service = new CompensationService(repository);

      const [item] = await service.getHistory(EMPLOYEE_ID);
      expect(item?.status).toBe("CURRENT");
    });

    it("treats a compensation starting today as CURRENT", async () => {
      const repository = new FakeCompensationRepository();
      repository.history = [compensation({ effectiveFrom: TODAY, effectiveTo: null })];
      const service = new CompensationService(repository);

      const [item] = await service.getHistory(EMPLOYEE_ID);
      expect(item?.status).toBe("CURRENT");
    });

    it("preserves repository ordering", async () => {
      const repository = new FakeCompensationRepository();
      repository.history = [
        compensation({ id: "future", effectiveFrom: "2026-10-01", effectiveTo: null }),
        compensation({ id: "current", effectiveFrom: "2025-01-01", effectiveTo: "2026-09-30" }),
        compensation({ id: "historical", effectiveFrom: "2024-01-01", effectiveTo: "2024-12-31" }),
      ];
      const service = new CompensationService(repository);

      const history = await service.getHistory(EMPLOYEE_ID);
      expect(history.map((item) => item.id)).toEqual(["future", "current", "historical"]);
      expect(history.map((item) => item.status)).toEqual(["FUTURE", "CURRENT", "HISTORICAL"]);
    });

    it("propagates EmployeeNotFoundError", async () => {
      const repository = new FakeCompensationRepository();
      repository.getHistoryError = new EmployeeNotFoundError();
      const service = new CompensationService(repository);

      await expect(service.getHistory(EMPLOYEE_ID)).rejects.toBeInstanceOf(EmployeeNotFoundError);
    });

    it("propagates unexpected repository errors", async () => {
      const repository = new FakeCompensationRepository();
      repository.getHistoryError = new Error("connection lost");
      const service = new CompensationService(repository);

      await expect(service.getHistory(EMPLOYEE_ID)).rejects.toThrow("connection lost");
    });
  });

  describe("addCompensation", () => {
    it("accepts a valid change effective today", async () => {
      const repository = new FakeCompensationRepository();
      const service = new CompensationService(repository);
      const input = change({ effectiveFrom: TODAY });

      await expect(service.addCompensation(EMPLOYEE_ID, input)).resolves.toBe(repository.addResult);
      expect(repository.addCalls).toEqual([{ employeeId: EMPLOYEE_ID, input }]);
    });

    it("accepts a valid future change", async () => {
      const repository = new FakeCompensationRepository();
      const service = new CompensationService(repository);
      const input = change({ effectiveFrom: "2026-10-01" });

      await expect(service.addCompensation(EMPLOYEE_ID, input)).resolves.toBe(repository.addResult);
      expect(repository.addCalls).toEqual([{ employeeId: EMPLOYEE_ID, input }]);
    });

    it("rejects an effective date before today", async () => {
      const repository = new FakeCompensationRepository();
      const service = new CompensationService(repository);

      await expect(
        service.addCompensation(EMPLOYEE_ID, change({ effectiveFrom: "2026-09-23" })),
      ).rejects.toMatchObject({
        name: "ValidationError",
        message: "Compensation effective date cannot be in the past",
      });
      expect(repository.addCalls).toEqual([]);
    });

    it("rejects an invalid amount", async () => {
      const repository = new FakeCompensationRepository();
      const service = new CompensationService(repository);

      await expect(
        service.addCompensation(EMPLOYEE_ID, change({ amount: "0.00" })),
      ).rejects.toBeInstanceOf(ValidationError);
      expect(repository.addCalls).toEqual([]);
    });

    it("rejects an invalid currency", async () => {
      const repository = new FakeCompensationRepository();
      const service = new CompensationService(repository);

      await expect(
        service.addCompensation(EMPLOYEE_ID, change({ currency: "JPY" as never })),
      ).rejects.toBeInstanceOf(ValidationError);
      expect(repository.addCalls).toEqual([]);
    });

    it("rejects an invalid pay frequency", async () => {
      const repository = new FakeCompensationRepository();
      const service = new CompensationService(repository);

      await expect(
        service.addCompensation(EMPLOYEE_ID, change({ payFrequency: "DAILY" as never })),
      ).rejects.toBeInstanceOf(ValidationError);
      expect(repository.addCalls).toEqual([]);
    });

    it("rejects an invalid change reason", async () => {
      const repository = new FakeCompensationRepository();
      const service = new CompensationService(repository);

      await expect(
        service.addCompensation(EMPLOYEE_ID, change({ changeReason: "BONUS" as never })),
      ).rejects.toBeInstanceOf(ValidationError);
      expect(repository.addCalls).toEqual([]);
    });

    it("does not call the repository when validation fails", async () => {
      const repository = new FakeCompensationRepository();
      const service = new CompensationService(repository);

      await expect(
        service.addCompensation(EMPLOYEE_ID, change({ amount: "-1", currency: "JPY" as never })),
      ).rejects.toBeInstanceOf(ValidationError);
      expect(repository.addCalls).toHaveLength(0);
    });

    it("returns the repository result for a valid change", async () => {
      const repository = new FakeCompensationRepository();
      const created = compensation({ id: "created", amount: "150000.00", effectiveFrom: TODAY });
      repository.addResult = created;
      const service = new CompensationService(repository);

      await expect(service.addCompensation(EMPLOYEE_ID, change())).resolves.toBe(created);
    });

    it("propagates repository errors", async () => {
      const repository = new FakeCompensationRepository();
      repository.addError = new EmployeeNotFoundError();
      const service = new CompensationService(repository);

      await expect(service.addCompensation(EMPLOYEE_ID, change())).rejects.toBeInstanceOf(
        EmployeeNotFoundError,
      );
    });
  });
});
