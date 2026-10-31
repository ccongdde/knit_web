import { describe, expect, it } from 'vitest'
import { percentOf, resumableEndpoint } from './resumableUpload'

describe('percentOf', () => {
  it('내림해서 0~100 정수로 돌려준다', () => {
    expect(percentOf(0, 100)).toBe(0)
    expect(percentOf(333, 1000)).toBe(33)
    expect(percentOf(1000, 1000)).toBe(100)
    expect(percentOf(2000, 1000)).toBe(100)
  })
  it('전체 크기가 0이면 0', () => {
    expect(percentOf(5, 0)).toBe(0)
  })
})

describe('resumableEndpoint', () => {
  it('프로젝트 주소에서 저장소 이어올리기 주소를 만든다', () => {
    expect(resumableEndpoint('https://abcdefgh.supabase.co')).toBe(
      'https://abcdefgh.storage.supabase.co/storage/v1/upload/resumable',
    )
  })
})
