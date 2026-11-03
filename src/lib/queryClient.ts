import { QueryClient } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { PDF_CACHE } from './storage'

/** 저장된 화면을 이 기간까지 다시 쓴다. 사진 임시 주소(7일)보다 짧게 둔다. */
export const CACHE_MAX_AGE = 3 * 24 * 60 * 60 * 1000
export const PERSIST_KEY = 'knit.queryCache'
/** 데이터 모양이 바뀌는 배포 때 올려서, 옛 모양으로 저장된 화면을 쓰지 않게 한다. */
export const CACHE_BUSTER = 'v3'
/** 서비스워커가 사진을 담아 두는 보관함 이름 (vite.config.ts 와 같아야 한다) */
export const IMAGE_CACHE = 'photo-images'

/**
 * 서버가 한 번 응답하는 데 0.4초쯤 걸려서, 화면을 열 때마다 새로 받으면 느리다.
 * 그래서 받은 데이터를 오래 쓰고(5분은 새것으로 취급), 앱을 껐다 켜도 저장해 둔 것을 먼저 보여준 뒤 뒤에서 새로고친다.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: CACHE_MAX_AGE,
      retry: 1,
    },
  },
})

export const persister = createSyncStoragePersister({
  storage: typeof window === 'undefined' ? undefined : window.localStorage,
  key: PERSIST_KEY,
  throttleTime: 1500,
})

/** PDF 파일 같은 큰 것은 저장하지 않는다. */
export function shouldPersist(queryKey: readonly unknown[]): boolean {
  return queryKey[0] !== 'pdf_blob'
}

/** 로그아웃할 때 이 기기에 남은 기록, 저장된 화면, 사진 보관함을 지운다. */
export async function wipeLocalData() {
  queryClient.clear()
  try {
    window.localStorage.removeItem(PERSIST_KEY)
  } catch {
    // 저장소를 못 쓰는 환경이면 지울 것도 없다.
  }
  try {
    await Promise.all([caches.delete(IMAGE_CACHE), caches.delete(PDF_CACHE)])
  } catch {
    // 보관함을 지원하지 않는 환경
  }
}
