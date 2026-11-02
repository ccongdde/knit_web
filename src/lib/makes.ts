import type { Make, MakeNeedle, MakeStatus } from './types'

const pad = (n: number) => String(n).padStart(2, '0')

/** 오늘 날짜를 기기 시간대 기준 yyyy-mm-dd 로 */
export function todayIso(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseDay(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** 제작 기록의 표시 이름. 이름이 없으면 "N회차" (N은 만든 순서) */
export function makeTitle(make: { label: string | null }, index: number): string {
  return make.label?.trim() || `${index + 1}회차`
}

/** 시작일부터 완성일(없으면 오늘)까지 며칠인지. 시작일이 없으면 null */
export function durationDays(start: string | null, end: string | null, today: string): number | null {
  if (!start) return null
  const diff = Math.round((parseDay(end ?? today).getTime() - parseDay(start).getTime()) / 86_400_000)
  return Math.max(0, diff)
}

/** 완성일이 시작일보다 빠르면 안내 문구를, 괜찮으면 null 을 돌려준다. 한쪽이 비어 있으면 검사하지 않는다. */
export function validateDates(start: string | null, end: string | null): string | null {
  if (start && end && end < start) return '완성일이 시작일보다 빨라요. 날짜를 확인해 주세요.'
  return null
}

/** "2025.09.14" 형태로 보여준다 */
export function dotDate(iso: string | null): string {
  return iso ? iso.replaceAll('-', '.') : '-'
}

/**
 * 상태를 바꿀 때 함께 바뀌는 날짜.
 * 진행 중으로 바꾸면 시작일이 비어 있을 때 오늘로, 완성으로 바꾸면 완성일을 오늘로 채운다.
 */
export function statusPatch(
  next: MakeStatus,
  current: { started_at: string | null; finished_at: string | null },
  today: string,
): { status: MakeStatus; started_at: string | null; finished_at: string | null } {
  switch (next) {
    case 'in_progress':
      return { status: next, started_at: current.started_at ?? today, finished_at: null }
    case 'finished':
      return { status: next, started_at: current.started_at, finished_at: current.finished_at ?? today }
    case 'planned':
      return { status: next, started_at: current.started_at, finished_at: null }
    case 'paused':
      return { status: next, started_at: current.started_at, finished_at: null }
  }
}

/** 날짜 아래에 보여줄 "오늘 / 어제 / N일 전" */
export function relativeDay(iso: string, now: Date = new Date()): string {
  const d = new Date(iso)
  const days = Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) /
      86_400_000,
  )
  if (days <= 0) return '오늘'
  if (days === 1) return '어제'
  if (days < 7) return `${days}일 전`
  return ''
}

/** "10월 30일 · 오늘" 처럼 메모 위에 보여줄 날짜 */
export function noteDateLabel(iso: string, now: Date = new Date()): string {
  const d = new Date(iso)
  const base = `${d.getMonth() + 1}월 ${d.getDate()}일`
  const rel = relativeDay(iso, now)
  return rel ? `${base} · ${rel}` : base
}

export function sumGrams(items: { grams_used: number }[]): number {
  // 소수 첫째 자리까지 다루므로 부동소수 오차를 정리한다.
  return Math.round(items.reduce((sum, y) => sum + Number(y.grams_used || 0), 0) * 10) / 10
}

export function formatGrams(grams: number): string {
  return `${Number.isInteger(grams) ? grams : grams.toFixed(1)}g`
}

/**
 * "이전 제작에서 복사해서 시작"으로 새 제작을 만들 때 가져올 것.
 * 사이즈, 내 게이지, 사용 바늘만 복사한다. 실, 메모, 카운터, 사진은 복사하지 않는다.
 */
export function cloneMakeDraft(source: Make, needles: MakeNeedle[]) {
  return {
    make: { size_made: source.size_made, actual_gauge: source.actual_gauge },
    needles: needles.map((n) => ({
      needle_id: n.needle_id,
      type: n.type,
      size_mm: n.size_mm,
      length_cm: n.length_cm,
      note: n.note,
      sort_order: n.sort_order,
    })),
  }
}

export function formatBytes(bytes: number | null): string {
  if (bytes == null) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}
