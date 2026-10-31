import { useMemo, useState } from 'react'
import { NeedleInventorySheet, YarnInventorySheet } from '../components/InventorySheets'
import { PlusIcon, SearchIcon } from '../components/icons'
import YarnSwatch from '../components/YarnSwatch'
import { gramsLeft, leftPercent, matchesNeedle, matchesYarn, needleLabel, sortYarns, type YarnSort } from '../lib/inventory'
import { formatGrams } from '../lib/makes'
import { useNeedles, useYarns, useYarnStock } from '../lib/queries/inventory'
import type { Needle, Yarn } from '../lib/types'

type Tab = 'yarn' | 'needle'
type Editing = { kind: 'yarn'; item?: Yarn } | { kind: 'needle'; item?: Needle } | null

export default function Inventory() {
  const [tab, setTab] = useState<Tab>('yarn')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<YarnSort>('left')
  const [editing, setEditing] = useState<Editing>(null)

  const yarns = useYarns()
  const needles = useNeedles()
  const { data: stock } = useYarnStock()

  const visibleYarns = useMemo(
    () => sortYarns((yarns.data ?? []).filter((y) => matchesYarn(y, query)), stock, sort),
    [yarns.data, stock, query, sort],
  )
  const visibleNeedles = useMemo(
    () => (needles.data ?? []).filter((n) => matchesNeedle(n, query)),
    [needles.data, query],
  )

  const loading = tab === 'yarn' ? yarns.isLoading : needles.isLoading
  const failed = tab === 'yarn' ? yarns.error : needles.error
  const total = tab === 'yarn' ? (yarns.data?.length ?? 0) : (needles.data?.length ?? 0)
  const shown = tab === 'yarn' ? visibleYarns.length : visibleNeedles.length

  return (
    <div className="mx-auto flex max-w-3xl flex-col">
      <header className="flex items-center justify-between px-5 pt-6 pb-1">
        <div role="tablist" aria-label="재고 종류" className="flex gap-5">
          {(
            [
              ['yarn', '실'],
              ['needle', '바늘'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => {
                setTab(key)
                setQuery('')
              }}
              className={[
                'min-h-11 border-b-[3px] text-[22px] font-bold',
                tab === key ? 'border-primary text-ink' : 'border-transparent text-muted',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label={tab === 'yarn' ? '실 추가' : '바늘 추가'}
          onClick={() => setEditing({ kind: tab })}
          className="flex size-11 items-center justify-center rounded-[10px] bg-primary text-white"
        >
          <PlusIcon width={22} height={22} />
        </button>
      </header>

      <div className="relative px-5 pt-3">
        <label htmlFor="iq" className="sr-only">
          재고 검색
        </label>
        <SearchIcon width={20} height={20} className="absolute top-[26px] left-9 text-muted" />
        <input
          id="iq"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tab === 'yarn' ? '이름 · 브랜드 · 색 검색' : '호수 · 종류 · 재질 검색'}
          className="h-12 w-full rounded-3xl bg-surface pr-4 pl-11 text-[15px]"
        />
      </div>

      <div className="flex items-center justify-between px-5 pt-3 pb-1">
        <span className="text-[13px] text-muted">
          {tab === 'yarn' ? '실' : '바늘'} {shown}
          {shown !== total ? ` / ${total}` : ''}개
        </span>
        {tab === 'yarn' && (
          <>
            <label htmlFor="isort" className="sr-only">
              정렬
            </label>
            <select
              id="isort"
              value={sort}
              onChange={(e) => setSort(e.target.value as YarnSort)}
              className="min-h-9 bg-transparent text-[13px] text-muted"
            >
              <option value="left">남은 양 적은 순</option>
              <option value="name">이름순</option>
            </select>
          </>
        )}
      </div>

      {loading && <p className="px-5 py-10 text-center text-sm text-muted">불러오는 중…</p>}
      {failed && (
        <p role="alert" className="px-5 py-10 text-center text-sm text-danger">
          재고를 불러오지 못했어요. 잠시 뒤에 다시 시도해 주세요.
        </p>
      )}
      {!loading && !failed && total === 0 && (
        <div className="px-5 py-14 text-center">
          <p className="text-base font-semibold">{tab === 'yarn' ? '가진 실을 적어 보세요' : '가진 바늘을 적어 보세요'}</p>
          <p className="mt-1 text-sm text-muted">
            {tab === 'yarn'
              ? '제작 기록에서 고르면 쓴 만큼 남은 양이 자동으로 줄어요.'
              : '제작 기록에서 바로 골라 쓸 수 있어요.'}
          </p>
        </div>
      )}
      {!loading && total > 0 && shown === 0 && (
        <p className="px-5 py-10 text-center text-sm text-muted">찾는 조건에 맞는 재고가 없어요.</p>
      )}

      {tab === 'yarn' && (
        <ul>
          {visibleYarns.map((y) => {
            const left = gramsLeft(y, stock)
            const sub = [y.color_name, y.fiber, y.brand].filter(Boolean).join(' · ')
            return (
              <li key={y.id}>
                <button
                  type="button"
                  onClick={() => setEditing({ kind: 'yarn', item: y })}
                  className="flex w-full items-center gap-3.5 border-b border-hair px-5 py-3 text-left"
                >
                  <YarnSwatch hex={y.color_hex} name={y.name} size={52} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-bold">{y.name}</div>
                    <div className="mt-0.5 truncate text-[13px] text-muted">
                      {sub || '정보 없음'} · 가진 양 {formatGrams(y.grams_owned)}
                    </div>
                    <div className="mt-2 h-1 rounded-full bg-line">
                      <div
                        className={`h-1 rounded-full ${left <= 0 ? 'bg-danger' : 'bg-primary'}`}
                        style={{ width: `${leftPercent(y.grams_owned, left)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex-none text-right">
                    <div className={`text-base font-bold ${left <= 0 ? 'text-danger' : ''}`}>{formatGrams(left)}</div>
                    <div className="text-xs text-muted">남음</div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {tab === 'needle' && (
        <ul>
          {visibleNeedles.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => setEditing({ kind: 'needle', item: n })}
                className="flex w-full items-center gap-3.5 border-b border-hair px-5 py-3 text-left"
              >
                <div className="flex size-[52px] flex-none items-center justify-center rounded-[10px] bg-surface text-sm font-bold text-primary">
                  {Number(n.size_mm).toFixed(1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold">{needleLabel({ ...n, size_mm: null })}</div>
                  <div className="mt-0.5 truncate text-[13px] text-muted">{[n.material, n.note].filter(Boolean).join(' · ') || '-'}</div>
                </div>
                <span className="flex-none text-sm text-muted">{n.quantity}개</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {editing?.kind === 'yarn' && <YarnInventorySheet yarn={editing.item} onClose={() => setEditing(null)} />}
      {editing?.kind === 'needle' && <NeedleInventorySheet needle={editing.item} onClose={() => setEditing(null)} />}
    </div>
  )
}
