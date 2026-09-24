import { API_BASE_URL } from "./constants";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function apiClient<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const headers = new Headers(options?.headers);
  headers.set("Accept", "application/json");

  if (options?.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store",
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      "Unable to reach the API. Confirm the backend is running.",
      0,
    );
  }

  if (!response.ok) {
    let message = userFacingHttpMessage(response.status);
    let code: string | undefined;

    try {
      const body = (await response.json()) as {
        error?: { message?: string; code?: string };
      };

      if (body.error?.message) {
        message = body.error.message;
      }
      if (body.error?.code) {
        code = body.error.code;
      }
    } catch {
      // Keep the status-based message when the body is not JSON.
    }

    throw new ApiError(message, response.status, code);
  }

  return response.json() as Promise<T>;
}

function userFacingHttpMessage(status: number): string {
  if (status === 404) {
    return "The requested record was not found.";
  }
  if (status === 400) {
    return "The request could not be processed.";
  }
  if (status >= 500) {
    return "The server could not complete this request. Please try again.";
  }
  return `Request failed with status ${status}`;
}
