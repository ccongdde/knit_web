import { describe, expect, it } from 'vitest'
import { fitWithin, squareCrop } from './image'

describe('squareCrop', () => {
  it('가로로 긴 사진은 가운데를 정사각형으로 자른다', () => {
    expect(squareCrop(400, 200)).toEqual({ sx: 100, sy: 0, size: 200 })
  })
  it('세로로 긴 쪽은 focus 로 위치를 고른다 (0=위, 1=아래)', () => {
    expect(squareCrop(200, 600, 0)).toEqual({ sx: 0, sy: 0, size: 200 })
    expect(squareCrop(200, 600, 0.5)).toEqual({ sx: 0, sy: 200, size: 200 })
    expect(squareCrop(200, 600, 1)).toEqual({ sx: 0, sy: 400, size: 200 })
  })
  it('이미 정사각형이면 그대로', () => {
    expect(squareCrop(300, 300, 0.2)).toEqual({ sx: 0, sy: 0, size: 300 })
  })
  it('범위를 벗어난 focus 는 0~1 로 맞춘다', () => {
    expect(squareCrop(200, 600, 5).sy).toBe(400)
    expect(squareCrop(200, 600, -1).sy).toBe(0)
  })
})

describe('fitWithin', () => {
  it('작은 사진은 그대로 둔다', () => {
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 })
  })
  it('긴 변을 기준으로 비율을 지켜 줄인다', () => {
    expect(fitWithin(4032, 3024, 1600)).toEqual({ width: 1600, height: 1200 })
    expect(fitWithin(3024, 4032, 1600)).toEqual({ width: 1200, height: 1600 })
  })
})
