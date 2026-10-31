import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cloneMakeDraft } from '../makes'
import { requireSupabase } from '../supabase'
import type { Make, MakeInput, MakeNeedle, MakeWithStats } from '../types'

const MAKE_STATS_SELECT =
  '*,counters(label,value,target,sort_order),make_yarns(grams_used),cover:photos!makes_cover_photo_fk(storage_path)'

/** 한 도안의 제작 기록 (만든 순서대로, 목록에 쓸 카운터·실 사용량·대표 사진 포함) */
export function useMakes(patternId: string | undefined) {
  return useQuery({
    queryKey: ['makes', patternId],
    enabled: Boolean(patternId),
    queryFn: async (): Promise<MakeWithStats[]> => {
      const { data, error } = await requireSupabase()
        .from('makes')
        .select(MAKE_STATS_SELECT)
        .eq('pattern_id', patternId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as MakeWithStats[]
    },
  })
}

export function useMake(id: string | undefined) {
  return useQuery({
    queryKey: ['make', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Make | null> => {
      const { data, error } = await requireSupabase().from('makes').select('*').eq('id', id!).maybeSingle()
      if (error) throw error
      return data as Make | null
    },
  })
}

type CreateMakeArgs = {
  patternId: string
  input: MakeInput
  /** 이전 제작에서 복사해서 시작할 때 그 제작의 id */
  copyFromId?: string
}

/** 제작 기록을 만들고, 기본 단수 카운터를 붙이고, 필요하면 이전 제작의 바늘·사이즈를 복사한다. */
export function useCreateMake() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ patternId, input, copyFromId }: CreateMakeArgs): Promise<string> => {
      const db = requireSupabase()

      let draftMake: { size_made: string | null; actual_gauge: string | null } | null = null
      let draftNeedles: ReturnType<typeof cloneMakeDraft>['needles'] = []
      if (copyFromId) {
        const [{ data: source, error: e1 }, { data: needles, error: e2 }] = await Promise.all([
          db.from('makes').select('*').eq('id', copyFromId).single(),
          db.from('make_needles').select('*').eq('make_id', copyFromId).order('sort_order'),
        ])
        if (e1) throw e1
        if (e2) throw e2
        const draft = cloneMakeDraft(source as Make, (needles ?? []) as MakeNeedle[])
        draftMake = draft.make
        draftNeedles = draft.needles
      }

      const { data, error } = await db
        .from('makes')
        .insert({
          pattern_id: patternId,
          ...input,
          // 폼에서 비워 둔 값은 복사해 온 값으로 채운다.
          size_made: input.size_made ?? draftMake?.size_made ?? null,
          actual_gauge: input.actual_gauge ?? draftMake?.actual_gauge ?? null,
        })
        .select('id')
        .single()
      if (error) throw error
      const makeId = data.id as string

      const { error: counterError } = await db.from('counters').insert({ make_id: makeId, label: '단수', value: 0 })
      if (counterError) throw counterError

      if (draftNeedles.length > 0) {
        const { error: needleError } = await db
          .from('make_needles')
          .insert(draftNeedles.map((n) => ({ ...n, make_id: makeId })))
        if (needleError) throw needleError
      }
      return makeId
    },
    onSuccess: (_id, { patternId }) => {
      void queryClient.invalidateQueries({ queryKey: ['makes', patternId] })
      void queryClient.invalidateQueries({ queryKey: ['patterns'] })
    },
  })
}

export function useUpdateMake() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<MakeInput> & { cover_photo_id?: string | null } }) => {
      const { error } = await requireSupabase().from('makes').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['make', id] })
      void queryClient.invalidateQueries({ queryKey: ['makes'] })
      void queryClient.invalidateQueries({ queryKey: ['patterns'] })
    },
  })
}

export function useDeleteMake() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await requireSupabase().from('makes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: ['make', id] })
      void queryClient.invalidateQueries({ queryKey: ['makes'] })
      void queryClient.invalidateQueries({ queryKey: ['patterns'] })
    },
  })
}
