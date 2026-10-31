import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 설정이 없어도 앱이 죽지 않고 안내 화면을 보여주도록, 클라이언트는 설정이 있을 때만 만든다.
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured ? createClient(url!, anonKey!) : null

export function requireSupabase() {
  if (!supabase) throw new Error('Supabase 설정이 없어요. .env.local 을 확인해 주세요.')
  return supabase
}
