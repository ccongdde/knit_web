import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { prepareImage } from '../image'
import { PHOTO_BUCKET, MAX_UPLOAD_BYTES, ownedPath, removeFiles, signedUrlMap, uploadFile } from '../storage'
import { requireSupabase } from '../supabase'
import type { Photo } from '../types'

export function usePhotos(makeId: string | undefined) {
  return useQuery({
    queryKey: ['photos', makeId],
    enabled: Boolean(makeId),
    queryFn: async (): Promise<Photo[]> => {
      const { data, error } = await requireSupabase()
        .from('photos')
        .select('*')
        .eq('make_id', makeId!)
        .order('taken_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Photo[]
    },
  })
}

/** 사진 경로들의 임시 주소. 같은 경로 묶음이면 다시 받지 않는다. */
export function usePhotoUrls(paths: string[]) {
  const key = [...new Set(paths)].sort()
  return useQuery({
    queryKey: ['photo_urls', key],
    enabled: key.length > 0,
    staleTime: 50 * 60_000,
    queryFn: () => signedUrlMap(PHOTO_BUCKET, key),
  })
}

function refresh(queryClient: ReturnType<typeof useQueryClient>, makeId: string) {
  void queryClient.invalidateQueries({ queryKey: ['photos', makeId] })
  void queryClient.invalidateQueries({ queryKey: ['work_notes', makeId] })
  void queryClient.invalidateQueries({ queryKey: ['make', makeId] })
  void queryClient.invalidateQueries({ queryKey: ['makes'] })
  void queryClient.invalidateQueries({ queryKey: ['patterns'] })
}

/** 사진을 줄여서 올리고 제작 기록(필요하면 메모)에 붙인다. 대표 사진이 없으면 첫 사진이 대표가 된다. */
export function useUploadPhotos(makeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ files, noteId }: { files: File[]; noteId?: string }) => {
      const db = requireSupabase()
      const failures: string[] = []
      const createdIds: string[] = []
      for (const file of files) {
        try {
          if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|heic|heif|gif)$/i.test(file.name)) {
            throw new Error('not image')
          }
          const prepared = await prepareImage(file)
          if (prepared.blob.size > MAX_UPLOAD_BYTES) throw new Error('too large')
          const path = await ownedPath(makeId, `${crypto.randomUUID()}.${prepared.ext}`)
          await uploadFile(PHOTO_BUCKET, path, prepared.blob, prepared.type)
          const { data, error } = await db
            .from('photos')
            .insert({ make_id: makeId, note_id: noteId ?? null, storage_path: path })
            .select('id')
            .single()
          if (error) {
            await removeFiles(PHOTO_BUCKET, [path]).catch(() => undefined)
            throw error
          }
          createdIds.push(data.id as string)
        } catch {
          failures.push(file.name)
        }
      }

      if (createdIds.length > 0) {
        const { data: make } = await db.from('makes').select('cover_photo_id').eq('id', makeId).single()
        if (make && !make.cover_photo_id) {
          await db.from('makes').update({ cover_photo_id: createdIds[0] }).eq('id', makeId)
        }
      }
      if (failures.length > 0) throw new Error(failures.join(', '))
    },
    onSettled: () => refresh(queryClient, makeId),
  })
}

export function useSetCover(makeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (photoId: string) => {
      const { error } = await requireSupabase().from('makes').update({ cover_photo_id: photoId }).eq('id', makeId)
      if (error) throw error
    },
    onSuccess: () => refresh(queryClient, makeId),
  })
}

export function useUpdatePhotoCaption(makeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, caption }: { id: string; caption: string | null }) => {
      const { error } = await requireSupabase().from('photos').update({ caption }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => refresh(queryClient, makeId),
  })
}

/** 사진을 지운다. 지운 사진이 대표였다면 남은 사진 중 가장 최근 것이 대표가 된다. */
export function useDeletePhoto(makeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (photo: Photo) => {
      const db = requireSupabase()
      const { error } = await db.from('photos').delete().eq('id', photo.id)
      if (error) throw error
      await removeFiles(PHOTO_BUCKET, [photo.storage_path]).catch(() => undefined)

      const { data: make } = await db.from('makes').select('cover_photo_id').eq('id', makeId).single()
      if (make && !make.cover_photo_id) {
        const { data: next } = await db
          .from('photos')
          .select('id')
          .eq('make_id', makeId)
          .order('taken_at', { ascending: false })
          .limit(1)
        if (next && next.length > 0) await db.from('makes').update({ cover_photo_id: next[0].id }).eq('id', makeId)
      }
    },
    onSuccess: () => refresh(queryClient, makeId),
  })
}
