import { requireSupabase } from './supabase'

export const PDF_BUCKET = 'pdfs'
export const PHOTO_BUCKET = 'photos'

/** Supabase 무료 플랜의 파일 하나당 올릴 수 있는 최대 크기 */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

/** 저장소 정책이 "첫 폴더 = 내 user_id" 를 요구해서 경로를 항상 그렇게 만든다. */
export async function ownedPath(...parts: string[]): Promise<string> {
  const { data, error } = await requireSupabase().auth.getUser()
  if (error || !data.user) throw new Error('로그인이 필요해요.')
  return [data.user.id, ...parts].join('/')
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
