import { describe, expect, it } from 'vitest'
import { gramsLeft, leftPercent, matchesNeedle, matchesYarn, needleLabel, sortYarns } from './inventory'
import type { Needle, Yarn, YarnStock } from './types'

const yarn = (over: Partial<Yarn>): Yarn => ({
  id: 'y1',
  brand: null,
  name: '코튼 블렌드 DK',
  color_name: '세이지',
  color_hex: null,
  fiber: '면 60 / 울 40',
  weight_class: 'DK',
  gauge: null,
  grams_owned: 600,
  skeins_owned: null,
  note: null,
  created_at: '2025-01-01T00:00:00Z',
  ...over,
})

const stockOf = (...rows: [string, number][]): Record<string, YarnStock> =>
  Object.fromEntries(rows.map(([id, left]) => [id, { yarn_id: id, grams_owned: 0, grams_used: 0, grams_left: left }]))

describe('남은 양', () => {
  it('사용 기록이 있으면 계산된 남은 양, 없으면 보유량', () => {
    expect(gramsLeft(yarn({ id: 'a' }), stockOf(['a', 180]))).toBe(180)
    expect(gramsLeft(yarn({ id: 'b', grams_owned: 150 }), stockOf())).toBe(150)
  })
  it('막대 길이는 0~100으로 맞춘다', () => {
    expect(leftPercent(600, 180)).toBe(30)
    expect(leftPercent(100, -20)).toBe(0)
    expect(leftPercent(100, 500)).toBe(100)
    expect(leftPercent(0, 0)).toBe(0)
  })
})

describe('실 목록', () => {
  const a = yarn({ id: 'a', name: '나 실', grams_owned: 800 })
  const b = yarn({ id: 'b', name: '가 실', grams_owned: 150 })
  const c = yarn({ id: 'c', name: '다 실', grams_owned: 300 })
  const stock = stockOf(['a', 20], ['b', 150], ['c', 300])

  it('남은 양이 적은 순', () => {
    expect(sortYarns([b, c, a], stock, 'left').map((y) => y.id)).toEqual(['a', 'b', 'c'])
  })
  it('이름순', () => {
    expect(sortYarns([a, b, c], stock, 'name').map((y) => y.id)).toEqual(['b', 'a', 'c'])
  })
  it('이름, 색, 혼용률로 찾는다', () => {
    expect(matchesYarn(yarn({}), '세이지')).toBe(true)
    expect(matchesYarn(yarn({}), '울 40')).toBe(true)
    expect(matchesYarn(yarn({}), '모헤어')).toBe(false)
  })
})

describe('바늘', () => {
  const needle: Needle = {
    id: 'n1',
    type: '줄바늘',
    size_mm: 5,
    length_cm: 80,
    material: '대나무',
    quantity: 1,
    note: null,
    created_at: '2025-01-01T00:00:00Z',
  }
  it('표시 이름', () => {
    expect(needleLabel(needle)).toBe('5.0mm 줄바늘 80cm')
    expect(needleLabel({ size_mm: 3.5, type: '코바늘', length_cm: null })).toBe('3.5mm 코바늘')
  })
  it('검색', () => {
    expect(matchesNeedle(needle, '대나무')).toBe(true)
    expect(matchesNeedle(needle, '5')).toBe(true)
    expect(matchesNeedle(needle, '금속')).toBe(false)
  })
})
