import { requireSupabase } from './supabase'

export const PDF_BUCKET = 'pdfs'
export const PHOTO_BUCKET = 'photos'

/** Supabase 무료 플랜의 파일 하나당 올릴 수 있는 최대 크기 */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

/** 저장소 정책이 "첫 폴더 = 내 user_id" 를 요구해서 경로를 항상 그렇게 만든다. */
export async function ownedPath(...parts: string[]): Promise<string> {
  // 서버에 다시 묻지 않고 이 기기에 저장된 로그인 정보에서 id를 읽는다.
  const { data, error } = await requireSupabase().auth.getSession()
  const userId = data.session?.user.id
  if (error || !userId) throw new Error('로그인이 필요해요.')
  return [userId, ...parts].join('/')
}

/** 올리기를 기다려 주는 최대 시간 */
export const UPLOAD_TIMEOUT_MS = 3 * 60_000

/** Error 뿐 아니라 Supabase가 돌려주는 { message } 모양 오류에서도 메시지를 꺼낸다. */
export function errorMessage(error: unknown): string {
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message
  return ''
}

export class UploadTimeoutError extends Error {
  constructor() {
    super('upload timeout')
  }
}

/** 올리기가 끝없이 기다리지 않도록 시간 제한을 둔다. */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new UploadTimeoutError()), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

/** 올리기 오류를 화면에 보여줄 한국어 설명으로 바꾼다. 원래 메시지는 괄호 안에 남겨서 원인을 찾을 수 있게 한다. */
export function describeUploadError(error: unknown): string {
  if (error instanceof UploadTimeoutError) return '시간이 너무 오래 걸려서 멈췄어요. 연결 상태를 확인하고 다시 해 주세요'
  const raw = errorMessage(error)
  const detail = raw ? ` [${raw}]` : ''
  if (/row-level security|not authorized|unauthorized|jwt/i.test(raw)) return `권한이 없어요. 로그아웃 후 다시 로그인해 보세요${detail}`
  if (/bucket not found/i.test(raw)) return `파일 저장소가 아직 만들어지지 않았어요${detail}`
  if (/too large|maximum allowed|exceeded|413/i.test(raw)) return `파일이 너무 커요${detail}`
  if (/failed to fetch|network|load failed|fetch failed/i.test(raw)) return `네트워크 연결이 끊겼어요${detail}`
  return `올리지 못했어요${detail}`
}

export function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
}

/** 확장자를 뺀 파일 이름 */
export function baseName(filename: string): string {
  return filename.replace(/\.[^.]+$/, '')
}

export async function uploadFile(bucket: string, path: string, body: Blob, contentType: string) {
  const { error } = await requireSupabase().storage.from(bucket).upload(path, body, { contentType, upsert: false })
  if (error) throw error
}

export async function removeFiles(bucket: string, paths: string[]) {
  if (paths.length === 0) return
  const { error } = await requireSupabase().storage.from(bucket).remove(paths)
  if (error) throw error
}

export async function downloadBlob(bucket: string, path: string): Promise<Blob> {
  const { data, error } = await requireSupabase().storage.from(bucket).download(path)
  if (error) throw error
  return data
}

/** 화면에 보여줄 임시 주소 (1시간) */
export async function signedUrlMap(bucket: string, paths: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(paths)]
  if (unique.length === 0) return new Map()
  const { data, error } = await requireSupabase().storage.from(bucket).createSignedUrls(unique, 3600)
  if (error) throw error
  const map = new Map<string, string>()
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map.set(item.path, item.signedUrl)
  }
  return map
}
