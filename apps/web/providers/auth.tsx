'use client'

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import {
    signInWithEmail,
    signOut,
    signUpWithEmail,
    useAuthSession,
} from '~/lib/auth-client'
import { normalizeAuthError, type AppErrorPayload } from '~/lib/error'

type AuthUser = NonNullable<ReturnType<typeof useAuthSession>['data']>['user']

type SignInInput = Parameters<typeof signInWithEmail>[0]
type SignUpInput = Parameters<typeof signUpWithEmail>[0]

type AuthContextValue = {
    session: ReturnType<typeof useAuthSession>['data']
    user: AuthUser | null
    isPending: boolean
    isAuthenticated: boolean
    error: ReturnType<typeof useAuthSession>['error']
    refetch: ReturnType<typeof useAuthSession>['refetch']
    signIn: (
        input: SignInInput
    ) => Promise<
        NonNullable<Awaited<ReturnType<typeof signInWithEmail>>['data']>
    >
    signUp: (
        input: SignUpInput
    ) => Promise<
        NonNullable<Awaited<ReturnType<typeof signUpWithEmail>>['data']>
    >
    signOut: (options?: { redirectTo?: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter()
    const { data: session, isPending, error, refetch } = useAuthSession()

    // Session fetch failures (e.g. get-session)
    useEffect(() => {
        if (!error) return
        const normalized = normalizeAuthError(error)
        toast.error(normalized.message)
    }, [error])

    const handleSignIn = useCallback(
        async (input: SignInInput) => {
            const { data, error: signInError } = await signInWithEmail(input)

            if (signInError) {
                const normalized: AppErrorPayload =
                    normalizeAuthError(signInError)
                toast.error(normalized.message)
                throw normalized
            }

            await refetch()
            return data!
        },
        [refetch]
    )

    const handleSignUp = useCallback(
        async (input: SignUpInput) => {
            const { data, error: signUpError } = await signUpWithEmail(input)

            if (signUpError) {
                const normalized: AppErrorPayload =
                    normalizeAuthError(signUpError)
                toast.error(normalized.message)
                throw normalized
            }

            await refetch()
            return data!
        },
        [refetch]
    )

    const handleSignOut = useCallback(
        async (options?: { redirectTo?: string }) => {
            const { error: signOutError } = await signOut()

            if (signOutError) {
                const normalized = normalizeAuthError(signOutError)
                toast.error(normalized.message)
                throw normalized
            }

            await refetch()

            if (options?.redirectTo) {
                router.push(options.redirectTo)
            }
        },
        [refetch, router]
    )

    const value = useMemo<AuthContextValue>(
        () => ({
            session,
            user: session?.user ?? null,
            isPending,
            isAuthenticated: !!session?.user,
            error,
            refetch,
            signIn: handleSignIn,
            signUp: handleSignUp,
            signOut: handleSignOut,
        }),
        [
            session,
            isPending,
            error,
            refetch,
            handleSignIn,
            handleSignUp,
            handleSignOut,
        ]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within <AuthProvider>')
    }
    return context
}
