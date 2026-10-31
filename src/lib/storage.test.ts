import { describe, expect, it } from 'vitest'
import { UploadTimeoutError, describeUploadError, errorMessage, withTimeout } from './storage'

describe('describeUploadError', () => {
  it('권한 오류는 다시 로그인하라고 안내하고 원래 메시지를 남긴다', () => {
    const text = describeUploadError({ message: 'new row violates row-level security policy' })
    expect(text).toContain('권한이 없어요')
    expect(text).toContain('row-level security')
  })
  it('저장소가 없을 때', () => {
    expect(describeUploadError(new Error('Bucket not found'))).toContain('저장소')
  })
  it('네트워크 오류', () => {
    expect(describeUploadError(new TypeError('Failed to fetch'))).toContain('네트워크')
  })
  it('시간 초과', () => {
    expect(describeUploadError(new UploadTimeoutError())).toContain('오래 걸려서')
  })
  it('알 수 없는 오류도 원래 메시지를 보여준다', () => {
    expect(describeUploadError(new Error('boom'))).toBe('올리지 못했어요 [boom]')
    expect(describeUploadError(null)).toBe('올리지 못했어요')
  })
})

describe('errorMessage', () => {
  it('문자열, Error, { message } 모두 읽는다', () => {
    expect(errorMessage('a')).toBe('a')
    expect(errorMessage(new Error('b'))).toBe('b')
    expect(errorMessage({ message: 'c' })).toBe('c')
    expect(errorMessage(42)).toBe('')
  })
})

describe('withTimeout', () => {
  it('제때 끝나면 결과를 돌려준다', async () => {
    await expect(withTimeout(Promise.resolve(1), 50)).resolves.toBe(1)
  })
  it('오래 걸리면 시간 초과 오류로 끝낸다', async () => {
    await expect(withTimeout(new Promise(() => undefined), 10)).rejects.toBeInstanceOf(UploadTimeoutError)
  })
  it('원래 오류는 그대로 전달한다', async () => {
    await expect(withTimeout(Promise.reject(new Error('x')), 50)).rejects.toThrow('x')
  })
})
