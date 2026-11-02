import { describe, expect, it } from 'vitest'
import {
  cloneMakeDraft,
  dotDate,
  durationDays,
  formatBytes,
  formatGrams,
  makeTitle,
  noteDateLabel,
  statusPatch,
  sumGrams,
  todayIso,
  validateDates,
} from './makes'
import type { Make, MakeNeedle } from './types'

const make = (over: Partial<Make> = {}): Make => ({
  id: 'm1',
  pattern_id: 'p1',
  label: null,
  status: 'finished',
  size_made: 'M',
  actual_gauge: '20코 × 28단 / 10cm',
  started_at: '2024-03-09',
  finished_at: '2024-05-05',
  review_note: '후기',
  cover_photo_id: 'photo1',
  created_at: '2024-03-09T00:00:00Z',
  updated_at: '2024-05-05T00:00:00Z',
  ...over,
})

describe('makeTitle', () => {
  it('이름이 없으면 만든 순서로 N회차', () => {
    expect(makeTitle({ label: null }, 0)).toBe('1회차')
    expect(makeTitle({ label: '  ' }, 1)).toBe('2회차')
  })
  it('이름이 있으면 그대로', () => {
    expect(makeTitle({ label: 'b실 버전' }, 1)).toBe('b실 버전')
  })
})

describe('durationDays', () => {
  it('시작일부터 완성일까지', () => {
    expect(durationDays('2026-03-09', '2026-04-05', '2026-10-01')).toBe(27)
  })
  it('완성일이 없으면 오늘까지', () => {
    expect(durationDays('2025-09-14', null, '2025-10-31')).toBe(47)
  })
  it('시작일이 없으면 null, 미래 시작일은 0', () => {
    expect(durationDays(null, null, '2025-10-31')).toBeNull()
    expect(durationDays('2025-12-01', null, '2025-10-31')).toBe(0)
  })
})

describe('validateDates', () => {
  it('완성일이 시작일보다 빠르면 안내 문구', () => {
    expect(validateDates('2025-05-01', '2025-04-30')).toContain('빨라요')
  })
  it('같은 날이거나 나중이면 통과', () => {
    expect(validateDates('2025-05-01', '2025-05-01')).toBeNull()
    expect(validateDates('2025-05-01', '2025-06-01')).toBeNull()
  })
  it('한쪽이 비어 있으면 검사하지 않는다', () => {
    expect(validateDates(null, '2025-05-01')).toBeNull()
    expect(validateDates('2025-05-01', null)).toBeNull()
  })
})

describe('statusPatch', () => {
  it('진행 중으로 바꾸면 비어 있던 시작일을 오늘로 채운다', () => {
    expect(statusPatch('in_progress', { started_at: null, finished_at: null }, '2025-10-31')).toEqual({
      status: 'in_progress',
      started_at: '2025-10-31',
      finished_at: null,
    })
  })
  it('이미 시작일이 있으면 유지한다', () => {
    const p = statusPatch('in_progress', { started_at: '2025-09-14', finished_at: '2025-10-01' }, '2025-10-31')
    expect(p.started_at).toBe('2025-09-14')
    expect(p.finished_at).toBeNull()
  })
  it('완성으로 바꾸면 완성일을 오늘로 채우되 있으면 유지', () => {
    expect(statusPatch('finished', { started_at: '2025-09-14', finished_at: null }, '2025-10-31').finished_at).toBe(
      '2025-10-31',
    )
    expect(
      statusPatch('finished', { started_at: '2025-09-14', finished_at: '2025-10-01' }, '2025-10-31').finished_at,
    ).toBe('2025-10-01')
  })
  it('보류와 예정은 완성일을 비운다', () => {
    expect(statusPatch('paused', { started_at: '2025-09-14', finished_at: '2025-10-01' }, '2025-10-31').finished_at).toBeNull()
  })
})

describe('noteDateLabel', () => {
  const now = new Date(2025, 9, 30, 12)
  it('오늘, 어제, N일 전', () => {
    expect(noteDateLabel(new Date(2025, 9, 30, 9).toISOString(), now)).toBe('10월 30일 · 오늘')
    expect(noteDateLabel(new Date(2025, 9, 29, 23).toISOString(), now)).toBe('10월 29일 · 어제')
    expect(noteDateLabel(new Date(2025, 9, 27, 22).toISOString(), now)).toBe('10월 27일 · 3일 전')
  })
  it('일주일이 넘으면 날짜만', () => {
    expect(noteDateLabel(new Date(2025, 9, 1, 22).toISOString(), now)).toBe('10월 1일')
  })
})

describe('무게 계산', () => {
  it('합계는 소수 오차 없이 계산한다', () => {
    expect(sumGrams([{ grams_used: 420 }, { grams_used: 35 }])).toBe(455)
    expect(sumGrams([{ grams_used: 0.1 }, { grams_used: 0.2 }])).toBe(0.3)
  })
  it('표시 형식', () => {
    expect(formatGrams(455)).toBe('455g')
    expect(formatGrams(12.5)).toBe('12.5g')
  })
})

describe('cloneMakeDraft', () => {
  const needles: MakeNeedle[] = [
    { id: 'n1', make_id: 'm1', needle_id: 'inv1', type: '줄바늘', size_mm: 5, length_cm: 80, note: '몸판', sort_order: 0 },
  ]
  it('사이즈, 게이지, 바늘만 복사하고 id는 가져오지 않는다', () => {
    const draft = cloneMakeDraft(make(), needles)
    expect(draft.make).toEqual({ size_made: 'M', actual_gauge: '20코 × 28단 / 10cm' })
    expect(draft.needles).toEqual([
      { needle_id: 'inv1', type: '줄바늘', size_mm: 5, length_cm: 80, note: '몸판', sort_order: 0 },
    ])
    expect(draft.needles[0]).not.toHaveProperty('id')
    expect(draft.needles[0]).not.toHaveProperty('make_id')
  })
  it('후기, 날짜, 상태, 대표 사진은 복사하지 않는다', () => {
    const draft = cloneMakeDraft(make(), [])
    expect(Object.keys(draft.make).sort()).toEqual(['actual_gauge', 'size_made'])
  })
})

describe('날짜와 용량 표시', () => {
  it('todayIso', () => {
    expect(todayIso(new Date(2025, 0, 5))).toBe('2025-01-05')
  })
  it('dotDate', () => {
    expect(dotDate('2025-09-14')).toBe('2025.09.14')
    expect(dotDate(null)).toBe('-')
  })
  it('formatBytes', () => {
    expect(formatBytes(400 * 1024)).toBe('400KB')
    expect(formatBytes(3.2 * 1024 * 1024)).toBe('3.2MB')
    expect(formatBytes(null)).toBe('')
  })
})
