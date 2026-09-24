import type { NextFunction, Request, Response } from "express";

import { EmployeeNotFoundError, ValidationError } from "./errors";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof EmployeeNotFoundError) {
    res.status(404).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  if (error instanceof ValidationError) {
    res.status(400).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  if (error instanceof Error) {
    console.error({
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  } else {
    console.error({
      message: "Unknown error",
      error,
    });
  }

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    },
  });
}