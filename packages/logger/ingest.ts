import { logger } from "./index";

export type IngestLevel = "debug" | "info" | "warn" | "error";

export type IngestEvent = {
  level: IngestLevel;
  event: string; // e.g. "procedure.start", "http.request"
  message?: string;
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  durationMs?: number;
  status?: number;
  appCode?: string;
  error?: unknown;
  meta?: Record<string, unknown>;
};

type IngestSink = (event: IngestEvent & { ts: string }) => void | Promise<void>;

const sinks: IngestSink[] = [];

export function registerIngestSink(sink: IngestSink) {
  sinks.push(sink);
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return error;
}

export async function ingest(event: IngestEvent) {
  const payload = {
    ...event,
    ts: new Date().toISOString(),
    error: event.error ? serializeError(event.error) : undefined,
  };

  logger.log({
    ...payload,
    message: event.message ?? event.event,
  });

  await Promise.allSettled(sinks.map((sink) => sink(payload)));
}
// packages/logger/ingest.ts

type StepContext = {
  requestId?: string;
  userId?: string;
  controller: string;
  runId: string;
};

function createRunId() {
  return crypto.randomUUID();
}

/** One AI controller invocation — groups all steps */
export function ingestRun(opts: {
  controller: string;
  requestId?: string;
  userId?: string;
  meta?: Record<string, unknown>;
}) {
  const runId = createRunId();
  const base: StepContext = {
    controller: opts.controller,
    runId,
    requestId: opts.requestId,
    userId: opts.userId,
  };

  void ingest({
    level: "info",
    event: "ai.run.start",
    message: `${opts.controller} started`,
    requestId: opts.requestId,
    userId: opts.userId,
    meta: { runId, controller: opts.controller, ...opts.meta },
  });

  return {
    runId,

    /** Monitor a single step inside the AI controller */
    async step<T>(name: string, fn: () => Promise<T>, meta?: Record<string, unknown>): Promise<T> {
      const start = Date.now();
      void ingest({
        level: "debug",
        event: "ai.step.start",
        requestId: base.requestId,
        userId: base.userId,
        meta: { runId, controller: base.controller, step: name, ...meta },
      });

      try {
        const result = await fn();
        void ingest({
          level: "info",
          event: "ai.step.success",
          requestId: base.requestId,
          userId: base.userId,
          durationMs: Date.now() - start,
          meta: { runId, controller: base.controller, step: name, ...meta },
        });
        return result;
      } catch (error) {
        void ingest({
          level: "error",
          event: "ai.step.error",
          requestId: base.requestId,
          userId: base.userId,
          durationMs: Date.now() - start,
          appCode: error instanceof Error ? error.name : undefined,
          error,
          meta: { runId, controller: base.controller, step: name, ...meta },
        });
        throw error;
      }
    },

    async complete(meta?: Record<string, unknown>) {
      void ingest({
        level: "info",
        event: "ai.run.complete",
        message: `${opts.controller} completed`,
        requestId: opts.requestId,
        userId: opts.userId,
        meta: { runId, controller: opts.controller, ...meta },
      });
    },

    async fail(error: unknown, meta?: Record<string, unknown>) {
      void ingest({
        level: "error",
        event: "ai.run.failed",
        requestId: opts.requestId,
        userId: opts.userId,
        error,
        meta: { runId, controller: opts.controller, ...meta },
      });
    },
  };
}
