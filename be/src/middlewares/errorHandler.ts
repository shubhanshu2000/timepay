import { Request, Response, NextFunction } from "express";
import { AppErrorType } from "../types/errors";
import { logger } from "../utils/logger";

interface ErrorResponse {
  success: false;
  error: {
    type: string;
    message: string;
    details?: any;
  };
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
) => {
  logger.error({
    error: {
      type: err.type || "UNKNOWN_ERROR",
      message: err.message,
      stack: err.stack,
    },
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      user: req.user?.id,
    },
  });

  // Handle our custom error type
  if (err.type && err.statusCode) {
    const appError = err as AppErrorType;
    return res.status(appError.statusCode).json({
      success: false,
      error: {
        type: appError.type,
        message: appError.message,
        details: appError.details,
      },
    });
  }

  // Handle Elasticsearch errors
  if (err.name === "ResponseError" && err.meta?.body?.error) {
    return res.status(400).json({
      success: false,
      error: {
        type: "ELASTICSEARCH_ERROR",
        message: "Database operation failed",
        details: err.meta.body.error,
      },
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: {
        type: "AUTHENTICATION_ERROR",
        message: "Invalid token",
      },
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    error: {
      type: "SERVER_ERROR",
      message: "Internal server error",
    },
  });
};
