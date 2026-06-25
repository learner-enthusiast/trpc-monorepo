import { AppError } from "./app-error";
import { ErrorCode } from "./codes";

function throwApp(code: ErrorCode, message: string, details?: unknown): never {
  throw new AppError({ code, message, details });
}

export const errors = {
  unauthorized: (message = "Not authenticated") => throwApp(ErrorCode.UNAUTHORIZED, message),

  forbidden: (message = "Forbidden") => throwApp(ErrorCode.FORBIDDEN, message),

  notFound: (resource: string) => throwApp(ErrorCode.NOT_FOUND, `${resource} not found`),

  conflict: (message: string) => throwApp(ErrorCode.CONFLICT, message),

  validation: (message: string, details?: unknown) =>
    throwApp(ErrorCode.VALIDATION, message, details),

  badRequest: (message: string, details?: unknown) =>
    throwApp(ErrorCode.BAD_REQUEST, message, details),

  internal: (message = "Something went wrong", cause?: unknown): never => {
    throw new AppError({
      code: ErrorCode.INTERNAL,
      message,
      cause,
    });
  },
};
