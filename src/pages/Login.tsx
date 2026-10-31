import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import SetupNotice from '../components/SetupNotice'
import { useAuth } from '../lib/auth'
import { isSupabaseConfigured } from '../lib/supabase'

export default function Login() {
  const { session, loading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!isSupabaseConfigured) return <SetupNotice />
  if (!loading && session) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const message = await signIn(email.trim(), password)
    if (message) setError(message)
    setSubmitting(false)
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-6 py-10">
      <div>
        <h1 className="text-[28px] font-bold text-primary">뜨개 기록</h1>
        <p className="mt-1 text-sm text-muted">내 계정으로 로그인해요.</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-[13px] font-semibold text-muted">
            이메일
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-[50px] rounded-xl bg-surface px-4 text-[15px]"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-[13px] font-semibold text-muted">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-[50px] rounded-xl bg-surface px-4 text-[15px]"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 min-h-[52px] rounded-xl bg-primary text-base font-semibold text-white disabled:opacity-60"
        >
          {submitting ? '로그인 중…' : '로그인'}
        </button>
      </form>
    </div>
  )
}
