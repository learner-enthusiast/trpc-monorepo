import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";
import { AppError, toTRPCError } from "@repo/errors";
import { logger } from "@repo/logger";
import { createContext } from "./context";

export const tRPCContext = initTRPC
  .meta<OpenApiMeta>()
  .context<typeof createContext>()
  .create({
    errorFormatter({ shape, error }) {
      const appError = error.cause instanceof AppError ? error.cause : null;

      return {
        ...shape,
        data: {
          ...shape.data,
          appCode: appError?.code,
          details: appError?.details,
        },
      };
    },
  });

const baseProcedure = tRPCContext.procedure.use(async ({ path, type, next }) => {
  try {
    return await next();
  } catch (error) {
    logger.error("tRPC procedure failed", { path, type, error });
    throw toTRPCError(error);
  }
});

export const router = tRPCContext.router;
export const publicProcedure = baseProcedure;

export const authenticatedProcedure = baseProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
      cause: new AppError({ code: "UNAUTHORIZED", message: "Not authenticated" }),
    });
  }

  return next({
    ctx: { ...ctx, user: ctx.user.id, session: ctx.session! },
  });
});
