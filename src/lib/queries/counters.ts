import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { requireSupabase } from '../supabase'
import type { Counter } from '../types'

export function useCounters(makeId: string | undefined) {
  return useQuery({
    queryKey: ['counters', makeId],
    enabled: Boolean(makeId),
    queryFn: async (): Promise<Counter[]> => {
      const { data, error } = await requireSupabase()
        .from('counters')
        .select('*')
        .eq('make_id', makeId!)
        .order('sort_order')
        .order('id')
      if (error) throw error
      return (data ?? []) as Counter[]
    },
  })
}

type CounterInput = { label: string; target: number | null }

export function useSaveCounter(makeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input, sortOrder }: { id?: string; input: CounterInput; sortOrder?: number }) => {
      const db = requireSupabase()
      const { error } = id
        ? await db.from('counters').update(input).eq('id', id)
        : await db.from('counters').insert({ ...input, make_id: makeId, sort_order: sortOrder ?? 0 })
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['counters', makeId] })
      void queryClient.invalidateQueries({ queryKey: ['makes'] })
    },
  })
}

export function useDeleteCounter(makeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await requireSupabase().from('counters').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['counters', makeId] })
      void queryClient.invalidateQueries({ queryKey: ['makes'] })
    },
  })
}
