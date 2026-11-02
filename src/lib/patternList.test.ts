import { describe, expect, it } from 'vitest'
import {
  allTags,
  coverPathOf,
  filterPatterns,
  hasStatus,
  matchesQuery,
  parseTags,
  sortPatterns,
  summarizeStatus,
  swatchFor,
} from './patternList'
import type { PatternListItem } from './types'

const item = (over: Partial<PatternListItem> = {}): PatternListItem => ({
  id: 'p1',
  title: '라글란 가디건',
  source: '○○ 디자이너',
  tags: ['가디건', '울'],
  cover_path: null,
  updated_at: '2025-10-01T00:00:00Z',
  makes: [],
  ...over,
})

describe('summarizeStatus', () => {
  it('제작 기록이 없으면 예정', () => {
    expect(summarizeStatus([])).toBe('planned')
  })
  it('진행 중이 있으면 다른 상태보다 우선', () => {
    expect(summarizeStatus(['finished', 'in_progress', 'paused'])).toBe('in_progress')
  })
  it('완성과 보류가 섞이면 완성', () => {
    expect(summarizeStatus(['paused', 'finished'])).toBe('finished')
  })
  it('완성과 예정이 섞이면 완성', () => {
    expect(summarizeStatus(['planned', 'finished'])).toBe('finished')
  })
})

describe('hasStatus', () => {
  it('제작 기록이 없는 도안은 예정 탭에만 나온다', () => {
    const p = item()
    expect(hasStatus(p, 'planned')).toBe(true)
    expect(hasStatus(p, 'finished')).toBe(false)
  })
  it('완성 1회 + 예정 1회면 두 탭에 모두 나온다', () => {
    const p = item({
      makes: [
        { id: 'm1', status: 'finished' },
        { id: 'm2', status: 'planned' },
      ],
    })
    expect(hasStatus(p, 'finished')).toBe(true)
    expect(hasStatus(p, 'planned')).toBe(true)
    expect(hasStatus(p, 'in_progress')).toBe(false)
  })
})

describe('parseTags', () => {
  it('쉼표와 공백으로 나누고 #을 떼고 중복을 지운다', () => {
    expect(parseTags('#가디건, 울 라글란 #울')).toEqual(['가디건', '울', '라글란'])
  })
  it('빈 입력은 빈 배열', () => {
    expect(parseTags('  , ## ')).toEqual([])
  })
})

describe('matchesQuery', () => {
  it('제목, 출처, 태그에서 대소문자 구분 없이 찾는다', () => {
    const p = item({ title: 'Olga Sweater', source: 'PetiteKnit', tags: ['스웨터'] })
    expect(matchesQuery(p, 'olga')).toBe(true)
    expect(matchesQuery(p, 'petite')).toBe(true)
    expect(matchesQuery(p, '스웨')).toBe(true)
    expect(matchesQuery(p, '베레모')).toBe(false)
  })
  it('빈 검색어는 모두 통과', () => {
    expect(matchesQuery(item(), '   ')).toBe(true)
  })
})

describe('filterPatterns / sortPatterns / allTags', () => {
  const a = item({ id: 'a', title: '가 도안', tags: ['모자'], updated_at: '2025-01-01T00:00:00Z' })
  const b = item({
    id: 'b',
    title: '나 도안',
    tags: ['모자', '울'],
    updated_at: '2025-03-01T00:00:00Z',
    makes: [{ id: 'm', status: 'in_progress' }],
  })

  it('상태와 태그를 함께 걸러낸다', () => {
    const out = filterPatterns([a, b], { query: '', status: 'in_progress', tag: '울' })
    expect(out.map((x) => x.id)).toEqual(['b'])
  })
  it('최근 수정순과 이름순', () => {
    expect(sortPatterns([a, b], 'recent').map((x) => x.id)).toEqual(['b', 'a'])
    expect(sortPatterns([b, a], 'name').map((x) => x.id)).toEqual(['a', 'b'])
  })
  it('태그는 많이 쓴 순서', () => {
    expect(allTags([a, b])).toEqual(['모자', '울'])
  })
})

describe('swatchFor', () => {
  it('같은 제목은 같은 색', () => {
    expect(swatchFor('라글란 가디건')).toEqual(swatchFor('라글란 가디건'))
  })
})

describe('coverPathOf', () => {
  it('도안에 정한 대표 이미지가 가장 먼저', () => {
    const p = item({
      cover_path: 'u/covers/p1/a.jpg',
      makes: [{ id: 'm', status: 'finished', updated_at: '2025-05-01T00:00:00Z', cover: { storage_path: 'big.jpg', thumb_path: 'small.jpg' } }],
    })
    expect(coverPathOf(p)).toBe('u/covers/p1/a.jpg')
  })
  it('없으면 가장 최근 제작의 대표 사진, 작은 것이 있으면 작은 것', () => {
    const p = item({
      makes: [
        { id: 'a', status: 'finished', updated_at: '2025-01-01T00:00:00Z', cover: { storage_path: 'old.jpg', thumb_path: null } },
        { id: 'b', status: 'finished', updated_at: '2025-06-01T00:00:00Z', cover: { storage_path: 'new.jpg', thumb_path: 'new_t.jpg' } },
      ],
    })
    expect(coverPathOf(p)).toBe('new_t.jpg')
  })
  it('작은 사진이 없던 예전 사진은 큰 것을 쓴다', () => {
    const p = item({ makes: [{ id: 'a', status: 'finished', cover: { storage_path: 'old.jpg', thumb_path: null } }] })
    expect(coverPathOf(p)).toBe('old.jpg')
  })
  it('아무것도 없으면 null', () => {
    expect(coverPathOf(item())).toBeNull()
  })
})
