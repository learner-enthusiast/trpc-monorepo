'use client'

import { useCallback } from 'react'
import type { RouterInputs, RouterOutputs } from '@repo/trpc/client'
import { trpc } from '~/trpc/client'

type AuthMeOutput = RouterOutputs['auth']['me']
type LoginInput = RouterInputs['auth']['loginUserWithEmailandPassword']
type SignUpInput = RouterInputs['auth']['createUserWithEmailandPassword']
type RefreshTokenInput = RouterInputs['auth']['refreshToken']
type VerifyEmailInput = RouterInputs['auth']['verifyEmail']
type ResetPasswordInput = RouterInputs['auth']['resetPassword']
type ChangePasswordInput = RouterInputs['auth']['changePassword']

function readCookie(name: string): string | null {
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
    return match ? decodeURIComponent(match[1]!) : null
}

export function useCsrfToken() {
    const csrfToken = readCookie('csrf_token')
    return { csrfToken }
}

const STANDARD_MUTATION_KEYS = [
    'mutateAsync',
    'mutate',
    'error',
    'isError',
    'isIdle',
    'isSuccess',
    'status',
    'data',
    'isPending',
    'reset',
] as const

type StandardMutationKey = (typeof STANDARD_MUTATION_KEYS)[number]

type StandardMutationResult<T extends Record<StandardMutationKey, unknown>> =
    Pick<T, StandardMutationKey>

function standardizeMutation<T extends Record<StandardMutationKey, unknown>>(
    mutation: T
): StandardMutationResult<T> {
    const {
        mutateAsync,
        mutate,
        error,
        isError,
        isIdle,
        isSuccess,
        status,
        data,
        isPending,
        reset,
    } = mutation

    return {
        mutateAsync,
        mutate,
        error,
        isError,
        isIdle,
        isSuccess,
        status,
        data,
        isPending,
        reset,
    }
}
/**
 * GET /authentication/me (authenticated)
 */
export function useAuthMeQuery(options?: { enabled?: boolean }) {
    return trpc.auth.me.useQuery(undefined, {
        enabled: options?.enabled ?? true,
        retry: false,
    })
}

/**
 * Convenience helper
 */
export function useIsAuthenticated() {
    const me = useAuthMeQuery()
    return {
        isAuthenticated: !!(me.data as AuthMeOutput | undefined)?.id,
        me,
    }
}

/**
 * POST /authentication/signUp
 */
export function useSignUpWithEmailAndPasswordMutation() {
    const utils = trpc.useUtils()

    const mutation = trpc.auth.createUserWithEmailandPassword.useMutation({
        onSuccess: async () => {
            await utils.auth.me.invalidate()
        },
    })

    return standardizeMutation(mutation)
}

/**
 * POST /authentication/login
 */
export function useLoginWithEmailAndPasswordMutation() {
    const utils = trpc.useUtils()

    const mutation = trpc.auth.loginUserWithEmailandPassword.useMutation({
        onSuccess: async () => {
            await utils.auth.me.invalidate()
        },
    })

    return standardizeMutation(mutation)
}

/**
 * POST /authentication/logout
 *
 * NOTE: your server defines logout as `.query(...)` not `.mutation(...)`,
 * so we call it via useQuery + refetch().
 */
export function useLogout() {
    const utils = trpc.useUtils()

    const logoutQuery = trpc.auth.logout.useQuery(undefined, {
        enabled: false,
        retry: false,
    })

    const logout = useCallback(async () => {
        const result = await logoutQuery.refetch()
        await utils.auth.me.invalidate()
        return result.data
    }, [logoutQuery, utils.auth.me])

    return {
        logout,
        ...logoutQuery,
    }
}

/**
 * POST /authentication/refresh-token
 */
export function useRefreshTokenMutation() {
    const utils = trpc.useUtils()

    const mutation = trpc.auth.refreshToken.useMutation({
        onSuccess: async () => {
            await utils.auth.me.invalidate()
        },
    })

    return standardizeMutation(mutation)
}

/**
 * POST /authentication/verify-email (authenticated)
 */
export function useVerifyEmailMutation() {
    const utils = trpc.useUtils()

    const mutation = trpc.auth.verifyEmail.useMutation({
        onSuccess: async () => {
            await utils.auth.me.invalidate()
        },
    })

    return standardizeMutation(mutation)
}

/**
 * POST /authentication/resend-verification (authenticated)
 */
export function useResendVerificationMutation() {
    const mutation = trpc.auth.resendVerification.useMutation()
    return standardizeMutation(mutation)
}

/**
 * POST /authentication/forgot-password (authenticated, per your router)
 */
export function useForgotPasswordMutation() {
    const mutation = trpc.auth.forgotPassword.useMutation()
    return standardizeMutation(mutation)
}

/**
 * POST /authentication/reset-password (authenticated, per your router)
 */
export function useResetPasswordMutation() {
    const mutation = trpc.auth.resetPassword.useMutation()
    return standardizeMutation(mutation)
}

/**
 * POST /authentication/change-password (authenticated)
 */
export function useChangePasswordMutation() {
    const mutation = trpc.auth.changePassword.useMutation()
    return standardizeMutation(mutation)
}

/**
 * Optional strongly-typed helpers (if you prefer calling with typed inputs)
 */
export function useAuthActions() {
    const login = useLoginWithEmailAndPasswordMutation()
    const signup = useSignUpWithEmailAndPasswordMutation()
    const refresh = useRefreshTokenMutation()
    const verifyEmail = useVerifyEmailMutation()
    const resetPassword = useResetPasswordMutation()
    const changePassword = useChangePasswordMutation()
    const forgotPassword = useForgotPasswordMutation()
    const resendVerification = useResendVerificationMutation()
    const logout = useLogout()

    return {
        login: (input: LoginInput) => login.mutateAsync(input),
        signup: (input: SignUpInput) => signup.mutateAsync(input),
        refreshToken: (input: RefreshTokenInput) => refresh.mutateAsync(input),
        verifyEmail: (input: VerifyEmailInput) =>
            verifyEmail.mutateAsync(input),
        resetPassword: (input: ResetPasswordInput) =>
            resetPassword.mutateAsync(input),
        changePassword: (input: ChangePasswordInput) =>
            changePassword.mutateAsync(input),

        forgotPassword: () => forgotPassword.mutateAsync(),
        resendVerification: () => resendVerification.mutateAsync(),

        logout: () => logout.logout(),
    }
}
