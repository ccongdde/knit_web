import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { requireSupabase } from './supabase'
import type { Counter } from './types'

const SAVE_DELAY_MS = 500

/**
 * 카운터 한 개의 값을 즉시 바꾸고(화면은 바로 반응), 눌림이 멈춘 뒤 한 번에 저장한다.
 * 빠르게 여러 번 눌러도 요청이 쏟아지지 않고, 화면을 떠나거나 앱을 내려도 마지막 값을 저장한다.
 */
export function useCounterControl(counter: Counter | undefined, makeId: string) {
  const queryClient = useQueryClient()
  const [value, setValue] = useState(counter?.value ?? 0)
  const [saveFailed, setSaveFailed] = useState(false)
  const valueRef = useRef(value)
  const pending = useRef<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const counterRef = useRef(counter)
  counterRef.current = counter

  // 서버 값이 바뀌었고 아직 저장 안 된 내 변경이 없으면 따라간다 (다른 기기에서 바꾼 경우 등).
  useEffect(() => {
    if (!counter || pending.current !== null) return
    valueRef.current = counter.value
    setValue(counter.value)
  }, [counter])

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    const target = counterRef.current
    const next = pending.current
    if (!target || next === null) return
    pending.current = null
    const { error } = await requireSupabase().from('counters').update({ value: next }).eq('id', target.id)
    if (error) {
      pending.current = next
      setSaveFailed(true)
      return
    }
    setSaveFailed(false)
    queryClient.setQueryData<Counter[]>(['counters', makeId], (old) =>
      old?.map((c) => (c.id === target.id ? { ...c, value: next } : c)),
    )
    // 카운터를 한 번 누를 때마다 목록을 다시 받으면 느려진다. 목록은 "오래됨"으로만 표시하고, 다음에 열 때 새로 받는다.
    void queryClient.invalidateQueries({ queryKey: ['makes'], refetchType: 'none' })
  }, [makeId, queryClient])

  const set = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.round(next))
      valueRef.current = clamped
      pending.current = clamped
      setValue(clamped)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => void flush(), SAVE_DELAY_MS)
    },
    [flush],
  )

  const change = useCallback((delta: number) => set(valueRef.current + delta), [set])

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flush()
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onHide)
      void flush()
    }
  }, [flush])

  return { value, change, set, saveFailed, retry: flush }
}
