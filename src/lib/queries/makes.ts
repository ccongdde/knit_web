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

/**
 * 제작 기록 한 건과, 화면 위쪽에 필요한 도안 정보(이름, 도안 메모, 같은 도안의 제작 순서, PDF 개수)를
 * 한 번의 요청으로 가져온다. 요청을 여러 번 이어서 하면 서버 응답을 그만큼 기다려야 해서 느려진다.
 */
export type MakeBundle = Make & {
  pattern: {
    id: string
    title: string
    pattern_note: string
    makes: { id: string; created_at: string }[]
    pattern_files: { id: string }[]
  } | null
}

export function useMake(id: string | undefined) {
  return useQuery({
    queryKey: ['make', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<MakeBundle | null> => {
      const { data, error } = await requireSupabase()
        .from('makes')
        .select('*,pattern:patterns(id,title,pattern_note,makes(id,created_at),pattern_files(id))')
        .eq('id', id!)
        .maybeSingle()
      if (error) throw error
      return data as unknown as MakeBundle | null
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

      // 카운터와 바늘 복사는 서로 기다릴 필요가 없어서 함께 보낸다.
      const [counterResult, needleResult] = await Promise.all([
        db.from('counters').insert({ make_id: makeId, label: '단수', value: 0 }),
        draftNeedles.length > 0
          ? db.from('make_needles').insert(draftNeedles.map((n) => ({ ...n, make_id: makeId })))
          : Promise.resolve({ error: null }),
      ])
      if (counterResult.error) throw counterResult.error
      if (needleResult.error) throw needleResult.error
      return makeId
    },
    onSuccess: (_id, { patternId }) => {
      void queryClient.invalidateQueries({ queryKey: ['makes', patternId] })
      void queryClient.invalidateQueries({ queryKey: ['patterns'] })
    },
  })
}

type MakePatch = Partial<MakeInput> & { cover_photo_id?: string | null }

/**
 * 제작 기록을 고친다. 서버 응답을 기다리지 않고 화면에 먼저 반영하고(상태, 날짜가 바로 바뀐다),
 * 실패하면 원래대로 되돌린다.
 */
export function useUpdateMake() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: MakePatch }) => {
      const { error } = await requireSupabase().from('makes').update(patch).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ['make', id] })
      const previous = queryClient.getQueryData<MakeBundle | null>(['make', id])
      if (previous) queryClient.setQueryData<MakeBundle | null>(['make', id], { ...previous, ...patch })
      return { previous }
    },
    onError: (_error, { id }, context) => {
      if (context?.previous) queryClient.setQueryData(['make', id], context.previous)
    },
    onSettled: (_data, _error, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['make', id] })
      // 목록은 지금 보고 있지 않으므로 다시 불러오지 않고 "오래됨"으로만 표시해 둔다. 다음에 열 때 새로 받는다.
      void queryClient.invalidateQueries({ queryKey: ['makes'], refetchType: 'none' })
      void queryClient.invalidateQueries({ queryKey: ['patterns'], refetchType: 'none' })
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
