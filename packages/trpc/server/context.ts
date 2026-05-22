import { clearCookieFactory, createCookieFactory, getCookieFactory } from "./cookie";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";

export interface TRPCContext {
  createCookie: ReturnType<typeof createCookieFactory>;
  getCookie: ReturnType<typeof getCookieFactory>;
  clearCookie: ReturnType<typeof clearCookieFactory>;
}

export async function createContext({
  req,
  res,
}: CreateExpressContextOptions): Promise<TRPCContext> {
  const ctx: TRPCContext = {
    createCookie: createCookieFactory(res),
    getCookie: getCookieFactory(req),
    clearCookie: clearCookieFactory(res),
  };
  return ctx;
}
export type Context = Awaited<ReturnType<typeof createContext>>;
