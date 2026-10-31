import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { requireSupabase } from '../supabase'
import type { Needle, NeedleInput, Yarn, YarnInput, YarnStock } from '../types'

export function useYarns() {
  return useQuery({
    queryKey: ['yarns'],
    queryFn: async (): Promise<Yarn[]> => {
      const { data, error } = await requireSupabase().from('yarns').select('*').order('name')
      if (error) throw error
      return (data ?? []) as Yarn[]
    },
  })
}

export function useNeedles() {
  return useQuery({
    queryKey: ['needles'],
    queryFn: async (): Promise<Needle[]> => {
      const { data, error } = await requireSupabase().from('needles').select('*').order('size_mm')
      if (error) throw error
      return (data ?? []) as Needle[]
    },
  })
}

/** 실마다 남은 양 (보유량 − 모든 제작 기록의 사용량 합계). 데이터베이스의 yarn_stock 뷰가 계산한다. */
export function useYarnStock() {
  return useQuery({
    queryKey: ['yarn_stock'],
    queryFn: async (): Promise<Map<string, YarnStock>> => {
      const { data, error } = await requireSupabase().from('yarn_stock').select('*')
      if (error) throw error
      return new Map(((data ?? []) as YarnStock[]).map((s) => [s.yarn_id, s]))
    },
  })
}

export function useSaveYarn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: YarnInput }) => {
      const db = requireSupabase()
      const { error } = id ? await db.from('yarns').update(input).eq('id', id) : await db.from('yarns').insert(input)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['yarns'] })
      void queryClient.invalidateQueries({ queryKey: ['yarn_stock'] })
    },
  })
}

export function useDeleteYarn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await requireSupabase().from('yarns').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['yarns'] })
      void queryClient.invalidateQueries({ queryKey: ['yarn_stock'] })
      void queryClient.invalidateQueries({ queryKey: ['make_yarns'] })
    },
  })
}

export function useSaveNeedle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: NeedleInput }) => {
      const db = requireSupabase()
      const { error } = id ? await db.from('needles').update(input).eq('id', id) : await db.from('needles').insert(input)
      if (error) throw error
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['needles'] }),
  })
}

export function useDeleteNeedle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await requireSupabase().from('needles').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['needles'] })
      void queryClient.invalidateQueries({ queryKey: ['make_needles'] })
    },
  })
}

/** 이 실을 쓴 제작 기록들 (재고 화면에서 "어디에 썼는지" 보여줄 때) */
export type YarnUsage = {
  grams_used: number
  makes: { id: string; label: string | null; created_at: string; patterns: { id: string; title: string } | null } | null
}

export function useYarnUsage(yarnId: string | undefined) {
  return useQuery({
    queryKey: ['yarn_usage', yarnId],
    enabled: Boolean(yarnId),
    queryFn: async (): Promise<YarnUsage[]> => {
      const { data, error } = await requireSupabase()
        .from('make_yarns')
        .select('grams_used,makes(id,label,created_at,patterns(id,title))')
        .eq('yarn_id', yarnId!)
      if (error) throw error
      return (data ?? []) as unknown as YarnUsage[]
    },
  })
}
