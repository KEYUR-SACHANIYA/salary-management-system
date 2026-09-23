import request from "supertest";
import { createApp } from "../src/app";

describe("GET /health", () => {
  it("returns ok", async () => {
    const response = await request(createApp()).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
