import type { MakeStatus, PatternListItem } from './types'

export type StatusFilter = 'all' | MakeStatus
export type SortKey = 'recent' | 'name'

/**
 * 도안 카드에 보여줄 대표 상태.
 * 진행 중인 제작이 있으면 진행 중 > 완성한 적 있으면 완성 > 예정 > 보류 순이고,
 * 제작 기록이 하나도 없는 도안은 "예정"으로 본다.
 */
export function summarizeStatus(statuses: MakeStatus[]): MakeStatus {
  if (statuses.length === 0) return 'planned'
  for (const s of ['in_progress', 'finished', 'planned', 'paused'] as const) {
    if (statuses.includes(s)) return s
  }
  return 'planned'
}

/** 필터용: 도안에 해당 상태의 제작이 하나라도 있으면 그 상태 탭에도 나온다. */
export function hasStatus(item: PatternListItem, status: MakeStatus): boolean {
  if (item.makes.length === 0) return status === 'planned'
  return item.makes.some((m) => m.status === status)
}

/** "#가디건, 울 라글란" 처럼 적은 글을 태그 배열로 바꾼다. 쉼표·공백 구분, 앞의 # 제거, 중복 제거. */
export function parseTags(input: string): string[] {
  const seen = new Set<string>()
  for (const raw of input.split(/[,\s]+/)) {
    const tag = raw.replace(/^#+/, '').trim()
    if (tag) seen.add(tag)
  }
  return [...seen]
}

export function matchesQuery(item: PatternListItem, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [item.title, item.source ?? '', ...item.tags].join(' ').toLowerCase()
  return haystack.includes(q)
}

export function filterPatterns(
  items: PatternListItem[],
  opts: { query: string; status: StatusFilter; tag: string | null },
): PatternListItem[] {
  return items.filter(
    (item) =>
      matchesQuery(item, opts.query) &&
      (opts.status === 'all' || hasStatus(item, opts.status)) &&
      (opts.tag === null || item.tags.includes(opts.tag)),
  )
}

export function sortPatterns(items: PatternListItem[], key: SortKey): PatternListItem[] {
  const copy = [...items]
  if (key === 'name') return copy.sort((a, b) => a.title.localeCompare(b.title, 'ko'))
  return copy.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
}

export function allTags(items: PatternListItem[]): string[] {
  const counts = new Map<string, number>()
  for (const item of items) for (const t of item.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
    .map(([tag]) => tag)
}

/**
 * 도안 목록 썸네일로 쓸 사진 경로.
 * 도안에 직접 정한 대표 이미지가 먼저이고, 없으면 가장 최근에 고친 제작 기록의 대표 사진(작은 것이 있으면 작은 것)을 쓴다.
 */
export function coverPathOf(item: PatternListItem): string | null {
  if (item.cover_path) return item.cover_path
  const withCover = item.makes.filter((m) => m.cover?.storage_path)
  withCover.sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''))
  const cover = withCover[0]?.cover
  return cover ? (cover.thumb_path ?? cover.storage_path) : null
}

const SWATCHES: [string, string][] = [
  ['#9DB8A5', '#F1EFE8'],
  ['#D9C7A8', '#F6F2EA'],
  ['#E7A6B8', '#FBF3F5'],
  ['#8FB3C9', '#F2F6F8'],
  ['#C9CBD3', '#F5F5F7'],
]

/** 사진이 없는 도안의 썸네일 색. 제목이 같으면 항상 같은 색이 나온다. */
export function swatchFor(title: string): [string, string] {
  let hash = 0
  for (const ch of title) hash = (hash * 31 + ch.codePointAt(0)!) >>> 0
  return SWATCHES[hash % SWATCHES.length]
}
