import { httpLink, httpBatchStreamLink } from "@repo/trpc/client";
import { env } from "~/env.js";

interface CreateTRPCHttpBatchClientClientOpts {
  enableStreaming?: boolean;
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : undefined;
}

function withCsrfHeader(headers: HeadersInit | undefined): HeadersInit {
  const csrfToken = readCookie("csrf_token");
  if (!csrfToken) return headers ?? {};

  const base: Record<string, string> = {};
  if (headers) {
    const h = new Headers(headers);
    h.forEach((value, key) => {
      base[key] = value;
    });
  }

  base["x-csrf-token"] = csrfToken;
  return base;
}

export const createTRPCHttpBatchClientClient = (opts?: CreateTRPCHttpBatchClientClientOpts) => {
  const c = opts?.enableStreaming ? httpBatchStreamLink : httpLink;

  return c({
    url: env.NEXT_PUBLIC_API_URL ?? "/trpc",
    fetch(url, options) {
      return fetch(url, {
        ...options,
        credentials: "include",
        headers: withCsrfHeader(options?.headers),
      });
    },
  });
};
