import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { requireSupabase } from '../supabase'
import type { MakeNeedle, MakeNeedleInput, MakeYarn, MakeYarnInput, Photo, WorkNote } from '../types'

// ───────────── 실 ─────────────

export function useMakeYarns(makeId: string | undefined) {
  return useQuery({
    queryKey: ['make_yarns', makeId],
    enabled: Boolean(makeId),
    queryFn: async (): Promise<MakeYarn[]> => {
      const { data, error } = await requireSupabase()
        .from('make_yarns')
        .select('*')
        .eq('make_id', makeId!)
        .order('sort_order')
        .order('role', { ascending: false, nullsFirst: false })
      if (error) throw error
      return (data ?? []) as MakeYarn[]
    },
  })
}

export function useSaveMakeYarn(makeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: MakeYarnInput }) => {
      const db = requireSupabase()
      const { error } = id
        ? await db.from('make_yarns').update(input).eq('id', id)
        : await db.from('make_yarns').insert({ ...input, make_id: makeId })
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['make_yarns', makeId] })
      void queryClient.invalidateQueries({ queryKey: ['makes'] })
      void queryClient.invalidateQueries({ queryKey: ['yarn_stock'] })
      void queryClient.invalidateQueries({ queryKey: ['yarn_usage'] })
    },
  })
}

export function useDeleteMakeYarn(makeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await requireSupabase().from('make_yarns').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['make_yarns', makeId] })
      void queryClient.invalidateQueries({ queryKey: ['makes'] })
      void queryClient.invalidateQueries({ queryKey: ['yarn_stock'] })
      void queryClient.invalidateQueries({ queryKey: ['yarn_usage'] })
    },
  })
}

// ───────────── 바늘 ─────────────

export function useMakeNeedles(makeId: string | undefined) {
  return useQuery({
    queryKey: ['make_needles', makeId],
    enabled: Boolean(makeId),
    queryFn: async (): Promise<MakeNeedle[]> => {
      const { data, error } = await requireSupabase()
        .from('make_needles')
        .select('*')
        .eq('make_id', makeId!)
        .order('sort_order')
      if (error) throw error
      return (data ?? []) as MakeNeedle[]
    },
  })
}

export function useSaveMakeNeedle(makeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: MakeNeedleInput }) => {
      const db = requireSupabase()
      const { error } = id
        ? await db.from('make_needles').update(input).eq('id', id)
        : await db.from('make_needles').insert({ ...input, make_id: makeId })
      if (error) throw error
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['make_needles', makeId] }),
  })
}

export function useDeleteMakeNeedle(makeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await requireSupabase().from('make_needles').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['make_needles', makeId] }),
  })
}

// ───────────── 작업 메모 ─────────────

export type WorkNoteWithPhotos = WorkNote & { photos: Pick<Photo, 'id' | 'storage_path' | 'caption' | 'taken_at'>[] }

export function useWorkNotes(makeId: string | undefined) {
  return useQuery({
    queryKey: ['work_notes', makeId],
    enabled: Boolean(makeId),
    queryFn: async (): Promise<WorkNoteWithPhotos[]> => {
      const { data, error } = await requireSupabase()
        .from('work_notes')
        .select('*,photos(id,storage_path,caption,taken_at)')
        .eq('make_id', makeId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as WorkNoteWithPhotos[]
    },
  })
}

type NoteInput = { title: string | null; body: string; row_ref: number | null }

/** 새 메모를 만들거나 고친다. 저장된 메모의 id를 돌려준다. */
export function useSaveNote(makeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: NoteInput }): Promise<string> => {
      const db = requireSupabase()
      if (id) {
        const { error } = await db.from('work_notes').update(input).eq('id', id)
        if (error) throw error
        return id
      }
      const { data, error } = await db
        .from('work_notes')
        .insert({ ...input, make_id: makeId })
        .select('id')
        .single()
      if (error) throw error
      return data.id as string
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['work_notes', makeId] }),
  })
}

export function useDeleteNote(makeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await requireSupabase().from('work_notes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['work_notes', makeId] })
      void queryClient.invalidateQueries({ queryKey: ['photos', makeId] })
    },
  })
}
