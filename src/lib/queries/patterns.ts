import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { requireSupabase } from '../supabase'
import type { PatternDetail, PatternInput, PatternListItem } from '../types'

export function usePatterns() {
  return useQuery({
    queryKey: ['patterns'],
    queryFn: async (): Promise<PatternListItem[]> => {
      const { data, error } = await requireSupabase()
        .from('patterns')
        .select('id,title,source,tags,cover_path,updated_at,makes(id,status,updated_at,cover:photos!makes_cover_photo_fk(storage_path,thumb_path))')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as PatternListItem[]
    },
  })
}

export function usePattern(id: string | undefined) {
  return useQuery({
    queryKey: ['pattern', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<PatternDetail | null> => {
      const { data, error } = await requireSupabase()
        .from('patterns')
        .select('id,title,source,tags,pattern_note,pattern_gauge,cover_path,created_at,updated_at')
        .eq('id', id!)
        .maybeSingle()
      if (error) throw error
      return data as PatternDetail | null
    },
  })
}

/** id가 있으면 고치고, 없으면 새로 만든다. 저장된 도안의 id를 돌려준다. */
export function useSavePattern() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: PatternInput }): Promise<string> => {
      const db = requireSupabase()
      if (id) {
        const { error } = await db.from('patterns').update(input).eq('id', id)
        if (error) throw error
        return id
      }
      const { data, error } = await db.from('patterns').insert(input).select('id').single()
      if (error) throw error
      return data.id as string
    },
    onSuccess: (id) => {
      void queryClient.invalidateQueries({ queryKey: ['patterns'] })
      void queryClient.invalidateQueries({ queryKey: ['pattern', id] })
    },
  })
}

export function useDeletePattern() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await requireSupabase().from('patterns').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: ['pattern', id] })
      void queryClient.invalidateQueries({ queryKey: ['patterns'] })
    },
  })
}
