import { apiClient, ApiError } from "./api-client";

describe("apiClient", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("returns JSON for a successful response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    }) as unknown as typeof fetch;

    await expect(apiClient("/api/v1/employees")).resolves.toEqual({ data: [] });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/employees",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("surfaces the backend error message for non-2xx responses", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: { code: "VALIDATION_ERROR", message: "Amount must be greater than zero." },
      }),
    }) as unknown as typeof fetch;

    await expect(apiClient("/api/v1/employees/1/compensations")).rejects.toMatchObject({
      name: "ApiError",
      message: "Amount must be greater than zero.",
      status: 400,
      code: "VALIDATION_ERROR",
    });
  });

  it("uses a generic 404 message when the body has no error message", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => {
        throw new Error("not json");
      },
    }) as unknown as typeof fetch;

    await expect(apiClient("/api/v1/employees/missing")).rejects.toEqual(
      new ApiError("The requested record was not found.", 404),
    );
  });

  it("does not expose raw network internals on fetch failure", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch")) as unknown as typeof fetch;

    await expect(apiClient("/api/v1/analytics/salary")).rejects.toEqual(
      new ApiError("Unable to reach the API. Confirm the backend is running.", 0),
    );
  });
});
