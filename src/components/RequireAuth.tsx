import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { isSupabaseConfigured } from '../lib/supabase'
import SetupNotice from './SetupNotice'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()

  if (!isSupabaseConfigured) return <SetupNotice />
  if (loading) return <div className="min-h-dvh" aria-busy="true" />
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}
