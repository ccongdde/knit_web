import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { wipeLocalData } from './queryClient'
import { supabase } from './supabase'

type AuthState = {
  session: Session | null
  loading: boolean
  /** 성공하면 null, 실패하면 화면에 보여줄 한국어 메시지를 돌려준다. */
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

function toKoreanMessage(message: string): string {
  if (/invalid login credentials/i.test(message)) return '이메일 또는 비밀번호가 맞지 않아요.'
  if (/email not confirmed/i.test(message)) return '이메일 확인이 아직 안 됐어요.'
  if (/rate limit|too many/i.test(message)) return '시도가 너무 많아요. 잠시 뒤에 다시 해 주세요.'
  return '로그인하지 못했어요. 잠시 뒤에 다시 해 주세요.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))

  useEffect(() => {
    if (!supabase) return
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      session,
      loading,
      signIn: async (email, password) => {
        if (!supabase) return 'Supabase 설정이 없어요.'
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return error ? toKoreanMessage(error.message) : null
      },
      signOut: async () => {
        await supabase?.auth.signOut()
        // 이 기기에 저장해 둔 화면과 사진도 함께 지운다.
        await wipeLocalData()
      },
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('AuthProvider 안에서만 쓸 수 있어요.')
  return ctx
}
