import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusIcon, SearchIcon } from '../components/icons'
import PatternThumb from '../components/PatternThumb'
import StatusChip from '../components/StatusChip'
import { formatYearMonth } from '../lib/format'
import {
  allTags,
  filterPatterns,
  hasStatus,
  sortPatterns,
  summarizeStatus,
  type SortKey,
  type StatusFilter,
} from '../lib/patternList'
import { usePatterns } from '../lib/queries/patterns'

const TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'in_progress', label: '진행 중' },
  { key: 'finished', label: '완성' },
  { key: 'planned', label: '예정' },
  { key: 'paused', label: '보류' },
]

export default function PatternList() {
  const { data, isLoading, error } = usePatterns()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [tag, setTag] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('recent')

  const items = useMemo(() => data ?? [], [data])
  const tags = useMemo(() => allTags(items), [items])
  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = {
      all: items.length,
      in_progress: 0,
      finished: 0,
      planned: 0,
      paused: 0,
    }
    for (const item of items) {
      for (const s of ['in_progress', 'finished', 'planned', 'paused'] as const) {
        if (hasStatus(item, s)) result[s] += 1
      }
    }
    return result
  }, [items])
  const visible = useMemo(
    () => sortPatterns(filterPatterns(items, { query, status, tag }), sort),
    [items, query, status, tag, sort],
  )

  return (
    <div className="mx-auto flex max-w-3xl flex-col">
      <header className="flex items-center justify-between px-5 pt-6 pb-3">
        <h1 className="text-2xl font-bold">내 도안</h1>
        <Link
          to="/patterns/new"
          aria-label="새 도안 만들기"
          className="flex size-11 items-center justify-center rounded-[10px] bg-primary text-white"
        >
          <PlusIcon width={22} height={22} />
        </Link>
      </header>

      <div className="relative px-5 pb-3">
        <label htmlFor="q" className="sr-only">
          도안 검색
        </label>
        <SearchIcon width={20} height={20} className="absolute top-3.5 left-9 text-muted" />
        <input
          id="q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="도안 이름 · 출처 · 태그 검색"
          className="h-12 w-full rounded-3xl bg-surface pr-4 pl-11 text-[15px]"
        />
      </div>

      <div className="flex gap-[18px] overflow-x-auto border-b border-line px-5" role="tablist">
        {TABS.map(({ key, label }) => {
          const active = status === key
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setStatus(key)}
              className={[
                'min-h-11 flex-none border-b-2 text-[15px] whitespace-nowrap',
                active ? 'border-ink font-bold text-ink' : 'border-transparent font-medium text-muted',
              ].join(' ')}
            >
              {label} <span className={active ? 'font-medium text-muted' : ''}>{counts[key]}</span>
            </button>
          )
        })}
      </div>

      {tags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-5 pt-3" aria-label="태그 필터">
          {tags.map((t) => {
            const active = tag === t
            return (
              <button
                key={t}
                type="button"
                aria-pressed={active}
                onClick={() => setTag(active ? null : t)}
                className={[
                  'min-h-9 flex-none rounded-full px-3 text-[13px] whitespace-nowrap',
                  active ? 'bg-primary text-white' : 'bg-surface text-[#4a4d55]',
                ].join(' ')}
              >
                #{t}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex justify-end px-5 pt-2">
        <label className="sr-only" htmlFor="sort">
          정렬
        </label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="min-h-9 bg-transparent text-[13px] text-muted"
        >
          <option value="recent">최근 수정순</option>
          <option value="name">이름순</option>
        </select>
      </div>

      {isLoading && <p className="px-5 py-10 text-center text-sm text-muted">불러오는 중…</p>}

      {error && (
        <p role="alert" className="px-5 py-10 text-center text-sm text-danger">
          도안을 불러오지 못했어요. 잠시 뒤에 다시 시도해 주세요.
        </p>
      )}

      {data && items.length === 0 && (
        <div className="px-5 py-16 text-center">
          <p className="text-base font-semibold">아직 도안이 없어요</p>
          <p className="mt-1 text-sm text-muted">첫 도안을 추가해서 기록을 시작해요.</p>
          <Link
            to="/patterns/new"
            className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-primary px-6 text-[15px] font-semibold text-white"
          >
            도안 추가
          </Link>
        </div>
      )}

      {data && items.length > 0 && visible.length === 0 && (
        <p className="px-5 py-12 text-center text-sm text-muted">조건에 맞는 도안이 없어요.</p>
      )}

      <ul>
        {visible.map((p) => (
          <li key={p.id}>
            <Link to={`/patterns/${p.id}`} className="flex items-center gap-3.5 border-b border-hair px-5 py-3">
              <PatternThumb title={p.title} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-bold">{p.title}</div>
                <div className="mt-[3px] truncate text-[13px] text-muted">
                  {p.makes.length > 0
                    ? `${p.makes.length}회 제작 · 최근 ${formatYearMonth(p.updated_at)}`
                    : '아직 제작 기록 없음'}
                </div>
              </div>
              <StatusChip status={summarizeStatus(p.makes.map((m) => m.status))} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
