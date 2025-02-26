export interface AppErrorType {
  statusCode: number;
  type: string;
  message: string;
  details?: any;
}

// Error factory functions
export const createValidationError = (
  message: string,
  details?: any
): AppErrorType => ({
  statusCode: 400,
  type: "VALIDATION_ERROR",
  message,
  details,
});

export const createAuthenticationError = (
  message: string = "Authentication failed"
): AppErrorType => ({
  statusCode: 401,
  type: "AUTHENTICATION_ERROR",
  message,
});

export const createAuthorizationError = (
  message: string = "Not authorized"
): AppErrorType => ({
  statusCode: 403,
  type: "AUTHORIZATION_ERROR",
  message,
});

export const createNotFoundError = (resource: string): AppErrorType => ({
  statusCode: 404,
  type: "NOT_FOUND_ERROR",
  message: `${resource} not found`,
});

export const createConflictError = (message: string): AppErrorType => ({
  statusCode: 409,
  type: "CONFLICT_ERROR",
  message,
});
