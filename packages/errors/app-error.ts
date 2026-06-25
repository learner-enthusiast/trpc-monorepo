// packages/errors/app-error.ts
import { ErrorCode, statusFromCode } from "./codes";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(opts: {
    code: ErrorCode;
    message: string;
    status?: number;
    details?: unknown;
    cause?: unknown;
  }) {
    super(opts.message, { cause: opts.cause });
    this.name = "AppError";
    this.code = opts.code;
    this.status = opts.status ?? statusFromCode(opts.code);
    this.details = opts.details;
  }
}
