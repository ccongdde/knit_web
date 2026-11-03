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

/** 사진 임시 주소를 오래 쓰도록 7일로 만든다. (자주 새로 받지 않아도 되고, 저장해 둔 화면에서도 그대로 보인다.) */
export const SIGNED_URL_SECONDS = 7 * 24 * 60 * 60

export async function uploadFile(bucket: string, path: string, body: Blob, contentType: string) {
  // 파일 이름이 매번 새로 만들어져서 내용이 바뀌지 않으므로 오래 캐시해도 된다.
  const { error } = await requireSupabase()
    .storage.from(bucket)
    .upload(path, body, { contentType, upsert: false, cacheControl: '31536000' })
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

/** 열어 본 PDF를 이 기기에 담아 두는 보관함 이름 */
export const PDF_CACHE = 'pdf-files'
const pdfCacheRequest = (path: string) => new Request(`/__pdf__/${path}`)

/**
 * PDF를 내려받되, 한 번 받은 것은 기기에 담아 두고 다음부터는 바로 연다.
 * (큰 스캔본도 두 번째부터는 기다리지 않고, 인터넷이 없어도 열린다.)
 */
export async function downloadPdfCached(path: string): Promise<Blob> {
  try {
    const cache = await caches.open(PDF_CACHE)
    const hit = await cache.match(pdfCacheRequest(path))
    if (hit) return await hit.blob()
  } catch {
    // 보관함을 못 쓰는 환경이면 매번 내려받는다.
  }
  const blob = await downloadBlob(PDF_BUCKET, path)
  try {
    const cache = await caches.open(PDF_CACHE)
    await cache.put(pdfCacheRequest(path), new Response(blob, { headers: { 'Content-Type': 'application/pdf' } }))
  } catch {
    // 용량이 모자라면 담지 않고 이번에만 보여준다.
  }
  return blob
}

export async function forgetCachedPdf(path: string) {
  try {
    const cache = await caches.open(PDF_CACHE)
    await cache.delete(pdfCacheRequest(path))
  } catch {
    // 지울 것이 없다.
  }
}

/**
 * 화면에 보여줄 임시 주소 (경로 → 주소).
 * Map 이 아니라 일반 객체로 돌려준다. 이 값은 기기에 JSON 으로 저장되는데, Map 은 저장하면 빈 객체가 되어
 * 앱을 껐다 켰을 때 "get 이 함수가 아니다" 오류로 화면이 멈추기 때문이다.
 */
export async function signedUrls(bucket: string, paths: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(paths)]
  if (unique.length === 0) return {}
  const { data, error } = await requireSupabase().storage.from(bucket).createSignedUrls(unique, SIGNED_URL_SECONDS)
  if (error) throw error
  const urls: Record<string, string> = {}
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urls[item.path] = item.signedUrl
  }
  return urls
}
