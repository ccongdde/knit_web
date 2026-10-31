import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  MAX_UPLOAD_BYTES,
  PDF_BUCKET,
  UPLOAD_TIMEOUT_MS,
  baseName,
  describeUploadError,
  downloadBlob,
  isPdf,
  ownedPath,
  removeFiles,
  uploadFile,
  withTimeout,
} from '../storage'
import { requireSupabase } from '../supabase'
import type { PatternFile } from '../types'

export function usePatternFiles(patternId: string | undefined) {
  return useQuery({
    queryKey: ['pattern_files', patternId],
    enabled: Boolean(patternId),
    queryFn: async (): Promise<PatternFile[]> => {
      const { data, error } = await requireSupabase()
        .from('pattern_files')
        .select('*')
        .eq('pattern_id', patternId!)
        .order('sort_order')
        .order('created_at')
      if (error) throw error
      return (data ?? []) as PatternFile[]
    },
  })
}

export function usePatternFile(fileId: string | undefined) {
  return useQuery({
    queryKey: ['pattern_file', fileId],
    enabled: Boolean(fileId),
    queryFn: async (): Promise<PatternFile | null> => {
      const { data, error } = await requireSupabase().from('pattern_files').select('*').eq('id', fileId!).maybeSingle()
      if (error) throw error
      return data as PatternFile | null
    },
  })
}

/** PDF 파일 내용. 한 번 받으면 다시 받지 않는다. */
export function usePdfBlob(path: string | undefined) {
  return useQuery({
    queryKey: ['pdf_blob', path],
    enabled: Boolean(path),
    staleTime: Infinity,
    gcTime: 10 * 60_000,
    queryFn: () => downloadBlob(PDF_BUCKET, path!),
  })
}

export class UploadError extends Error {}

/** 고른 PDF들을 올리고 도안에 붙인다. 하나라도 실패하면 어떤 파일이었는지 메시지에 담는다. */
export function useUploadPatternFiles(patternId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (files: File[]) => {
      const db = requireSupabase()
      const failures: string[] = []
      for (const file of files) {
        if (!isPdf(file)) {
          failures.push(`${file.name} (PDF가 아니에요)`)
          continue
        }
        if (file.size > MAX_UPLOAD_BYTES) {
          failures.push(`${file.name} (50MB가 넘어요)`)
          continue
        }
        try {
          const path = await ownedPath(patternId, `${crypto.randomUUID()}.pdf`)
          await withTimeout(uploadFile(PDF_BUCKET, path, file, 'application/pdf'), UPLOAD_TIMEOUT_MS)
          const { error } = await db.from('pattern_files').insert({
            pattern_id: patternId,
            storage_path: path,
            filename: file.name,
            label: baseName(file.name),
            size_bytes: file.size,
          })
          if (error) {
            await removeFiles(PDF_BUCKET, [path]).catch(() => undefined)
            throw error
          }
        } catch (e) {
          failures.push(`${file.name}: ${describeUploadError(e)}`)
        }
      }
      if (failures.length > 0) throw new UploadError(failures.join('\n'))
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['pattern_files', patternId] }),
  })
}

export function useUpdatePatternFile(patternId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Pick<PatternFile, 'label' | 'page_count'>> }) => {
      const { error } = await requireSupabase().from('pattern_files').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['pattern_files', patternId] })
      void queryClient.invalidateQueries({ queryKey: ['pattern_file', id] })
    },
  })
}

export function useDeletePatternFile(patternId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: PatternFile) => {
      const { error } = await requireSupabase().from('pattern_files').delete().eq('id', file.id)
      if (error) throw error
      // 기록이 먼저 지워진 뒤라 저장소 정리가 실패해도 화면에는 영향이 없다.
      await removeFiles(PDF_BUCKET, [file.storage_path]).catch(() => undefined)
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['pattern_files', patternId] }),
  })
}
