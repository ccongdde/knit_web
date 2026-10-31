import { useEffect } from 'react'

const KEY = 'knit.wakeLock'

/** 설정에서 고른 "화면 켜짐 유지" 기본값 (처음에는 켜짐) */
export function getWakeLockDefault(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

export function setWakeLockDefault(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    // 저장소를 못 쓰는 환경이면 이번 방문에만 적용된다.
  }
}

type WakeLockSentinelLike = { release: () => Promise<void> }

/** enabled 인 동안 화면이 꺼지지 않게 한다. 지원하지 않는 기기에서는 아무 일도 하지 않는다. */
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    const api = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<WakeLockSentinelLike> } }).wakeLock
    if (!enabled || !api) return
    let sentinel: WakeLockSentinelLike | null = null
    let cancelled = false

    const acquire = async () => {
      try {
        const s = await api.request('screen')
        if (cancelled) void s.release()
        else sentinel = s
      } catch {
        // 배터리 절약 모드 등으로 거절될 수 있다.
      }
    }
    // 앱을 다른 화면으로 갔다 돌아오면 잠금이 풀리므로 다시 건다.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire()
    }

    void acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      void sentinel?.release()
    }
  }, [enabled])
}
