import { Upload } from 'tus-js-client'
import { UploadTimeoutError } from './storage'
import { requireSupabase } from './supabase'

export type UploadProgress = { loaded: number; total: number }

/** 0~100 사이 정수 퍼센트 */
export function percentOf(loaded: number, total: number): number {
  if (total <= 0) return 0
  return Math.max(0, Math.min(100, Math.floor((loaded / total) * 100)))
}

/** Supabase 프로젝트 주소에서 이어올리기 전용 주소를 만든다. */
export function resumableEndpoint(projectUrl: string): string {
  const host = new URL(projectUrl).hostname
  const ref = host.split('.')[0]
  return `https://${ref}.storage.supabase.co/storage/v1/upload/resumable`
}

/**
 * 큰 파일도 끊기지 않게 6MB씩 나눠 올리고(중간에 끊기면 이어서 다시 시도), 진행 정도를 알려준다.
 * stallMs 동안 한 바이트도 진행되지 않으면 멈춘 것으로 보고 시간 초과 오류로 끝낸다.
 */
export async function uploadResumable(opts: {
  bucket: string
  path: string
  file: Blob
  contentType: string
  onProgress?: (p: UploadProgress) => void
  stallMs?: number
}): Promise<void> {
  const { data } = await requireSupabase().auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('로그인이 필요해요.')
  const projectUrl = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!projectUrl || !anonKey) throw new Error('Supabase 설정이 없어요.')

  await new Promise<void>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        void upload.abort(true).catch(() => undefined)
        reject(new UploadTimeoutError())
      }, opts.stallMs ?? 60_000)
    }

    const upload = new Upload(opts.file, {
      endpoint: resumableEndpoint(projectUrl),
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: { authorization: `Bearer ${token}`, apikey: anonKey, 'x-upsert': 'false' },
      uploadDataDuringCreation: true,
      storeFingerprintForResuming: false,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024, // Supabase 저장소가 요구하는 크기
      metadata: {
        bucketName: opts.bucket,
        objectName: opts.path,
        contentType: opts.contentType,
        cacheControl: '3600',
      },
      onProgress: (loaded, total) => {
        arm()
        opts.onProgress?.({ loaded, total })
      },
      onError: (error) => {
        clearTimeout(timer)
        reject(error)
      },
      onSuccess: () => {
        clearTimeout(timer)
        resolve()
      },
    })

    arm()
    upload.start()
  })
}
