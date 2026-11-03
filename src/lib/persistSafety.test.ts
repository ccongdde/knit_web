import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * 조회 결과는 기기에 JSON 으로 저장되었다가 앱을 다시 켤 때 되살려진다.
 * Map, Set, Date 는 JSON 으로 저장하면 빈 객체나 글자가 되어 되살린 뒤 오류를 일으킨다.
 * (실제로 Map 때문에 앱을 껐다 켜면 "문제가 생겼어요"가 떴다.) 그래서 조회 결과에는 쓰지 않는다.
 */
const dir = join(import.meta.dirname, 'queries')
const files = readdirSync(dir).filter((f) => f.endsWith('.ts'))
const storage = readFileSync(join(import.meta.dirname, 'storage.ts'), 'utf8')

describe('저장되는 조회 결과는 JSON 으로 저장해도 안전하다', () => {
  for (const file of files) {
    it(`${file} 에 Map, Set, Date 를 돌려주는 조회가 없다`, () => {
      const source = readFileSync(join(dir, file), 'utf8')
      expect(source).not.toMatch(/new Map\(/)
      // [...new Set(목록)] 처럼 바로 배열로 펼쳐 쓰는 것은 괜찮고, Set 자체를 돌려주는 것만 막는다.
      expect(source).not.toMatch(/(?<!\.\.\.)new Set\(/)
      expect(source).not.toMatch(/Promise<[^>]*\b(Map|Set)</)
      expect(source).not.toMatch(/new Date\(/)
    })
  }

  it('사진 임시 주소를 만드는 함수는 일반 객체를 돌려준다', () => {
    const body = storage.slice(storage.indexOf('export async function signedUrls'))
    expect(body).toContain('Promise<Record<string, string>>')
    expect(body).not.toMatch(/new Map/)
  })

  it('JSON 으로 저장했다 되살려도 같은 값이다', () => {
    const urls: Record<string, string> = { 'u/a.jpg': 'https://example.com/a?token=1' }
    expect(JSON.parse(JSON.stringify(urls))).toEqual(urls)
    // 이전에 문제였던 모양: Map 은 저장하면 빈 객체가 된다.
    expect(JSON.parse(JSON.stringify(new Map(Object.entries(urls))))).toEqual({})
  })
})
