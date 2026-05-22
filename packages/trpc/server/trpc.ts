import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";
import * as JWT from "jsonwebtoken";
import { createContext } from "./context";
import { AUTHENTICATION_COOKIE_NAME_ACCESS, getAuthenticationCookie } from "./cookie";
import { GenerateUSerTokenPayload } from "@repo/services/user/model";
import { env } from "@repo/services/env";

export const tRPCContext = initTRPC.meta<OpenApiMeta>().context<typeof createContext>().create({});

export const router = tRPCContext.router;

export const publicProcedure = tRPCContext.procedure;
export const authenticatedProcedure = tRPCContext.procedure.use((options) => {
  const { ctx } = options;

  const userToken = getAuthenticationCookie(ctx, AUTHENTICATION_COOKIE_NAME_ACCESS);
  if (!userToken) throw new Error("User is not logged in");
  const decoded = JWT.verify(userToken, env.ACCESS_TOKEN_SECRET) as GenerateUSerTokenPayload;

  return options.next({
    ctx: { ...ctx, user: decoded.id },
  });
});
