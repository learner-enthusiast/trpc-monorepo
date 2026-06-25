import { TRPCClientError } from '@repo/trpc/client'

export type AppErrorPayload = {
    code: string
    message: string
    details?: unknown
    source: 'trpc' | 'auth' | 'unknown'
}

type TRPCErrorData = {
    appCode?: string
    code?: string
    details?: unknown
}

export function normalizeTRPCError(error: unknown): AppErrorPayload {
    if (error instanceof TRPCClientError) {
        const data = error.data as TRPCErrorData | undefined
        return {
            code: data?.appCode ?? data?.code ?? 'INTERNAL',
            message: error.message,
            details: data?.details,
            source: 'trpc',
        }
    }

    if (error instanceof Error) {
        return { code: 'INTERNAL', message: error.message, source: 'unknown' }
    }

    return {
        code: 'INTERNAL',
        message: 'Something went wrong',
        source: 'unknown',
    }
}

export function normalizeAuthError(error: {
    message?: string
    code?: string
    status?: number
}): AppErrorPayload {
    return {
        code: error.code ?? 'BAD_REQUEST',
        message: error.message ?? 'Authentication failed',
        source: 'auth',
    }
}

export function getErrorMessage(error: unknown): string {
    return normalizeTRPCError(error).message
}
