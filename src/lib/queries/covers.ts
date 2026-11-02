import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PHOTO_BUCKET, ownedPath, removeFiles, uploadFile } from '../storage'
import { requireSupabase } from '../supabase'

/**
 * 도안의 대표 이미지를 바꾸거나 지운다.
 * 새 이미지를 올린 뒤에 기록을 바꾸고, 그다음에 옛 파일을 지운다. 중간에 실패해도 이미지가 없어지는 일이 없다.
 */
export function useSetPatternCover(patternId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ image, previousPath }: { image: Blob | null; previousPath: string | null }) => {
      const db = requireSupabase()
      let newPath: string | null = null
      if (image) {
        newPath = await ownedPath('covers', patternId, `${crypto.randomUUID()}.jpg`)
        await uploadFile(PHOTO_BUCKET, newPath, image, 'image/jpeg')
      }
      const { error } = await db.from('patterns').update({ cover_path: newPath }).eq('id', patternId)
      if (error) {
        if (newPath) await removeFiles(PHOTO_BUCKET, [newPath]).catch(() => undefined)
        throw error
      }
      if (previousPath) await removeFiles(PHOTO_BUCKET, [previousPath]).catch(() => undefined)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pattern', patternId] })
      void queryClient.invalidateQueries({ queryKey: ['patterns'] })
    },
  })
}
