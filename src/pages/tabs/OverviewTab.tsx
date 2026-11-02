import { useEffect, useRef, useState } from 'react'
import NeedleSheet from '../../components/NeedleSheet'
import YarnSheet from '../../components/YarnSheet'
import YarnSwatch from '../../components/YarnSwatch'
import { durationDays, formatGrams, sumGrams, todayIso, validateDates } from '../../lib/makes'
import { useYarnStock } from '../../lib/queries/inventory'
import { useMakeNeedles, useMakeYarns } from '../../lib/queries/makeDetails'
import { useUpdateMake } from '../../lib/queries/makes'
import type { Make, MakeNeedle, MakeYarn } from '../../lib/types'

type Editing = { kind: 'yarn'; item?: MakeYarn } | { kind: 'needle'; item?: MakeNeedle } | null

export default function OverviewTab({ make }: { make: Make }) {
  const days = durationDays(make.started_at, make.finished_at, todayIso())
  const durationLabel = days === null ? '-' : make.finished_at ? `${days}일` : `${days}일째`
  const { data: yarns } = useMakeYarns(make.id)
  const { data: needles } = useMakeNeedles(make.id)
  const { data: stock } = useYarnStock()
  const [editing, setEditing] = useState<Editing>(null)
  const [dateError, setDateError] = useState<string | null>(null)
  const update = useUpdateMake()

  /** 시작일·완성일을 고친다. 순서가 맞지 않으면 저장하지 않고 안내한다. */
  function commitDate(patch: { started_at?: string | null; finished_at?: string | null; status?: 'finished' }) {
    const started = 'started_at' in patch ? (patch.started_at ?? null) : make.started_at
    const finished = 'finished_at' in patch ? (patch.finished_at ?? null) : make.finished_at
    const problem = validateDates(started, finished)
    setDateError(problem)
    if (problem) return
    update.mutate({ id: make.id, patch })
  }

  return (
    <div className="flex flex-col gap-6 px-5 pt-5 pb-6">
      <section aria-labelledby="schedule" className="flex flex-col">
        <h2 id="schedule" className="mb-1.5 text-[13px] font-semibold text-muted">
          일정
        </h2>
        <DateRow
          label="시작일"
          value={make.started_at}
          onCommit={(v) => commitDate({ started_at: v })}
          conflict={validateDates(make.started_at, make.finished_at)}
        />
        <DateRow
          label="완성일"
          value={make.finished_at}
          onCommit={(v) => commitDate(v ? { finished_at: v, status: 'finished' } : { finished_at: null })}
          clearable
        />
        {dateError && (
          <p role="alert" className="py-1 text-sm text-danger">
            {dateError}
          </p>
        )}
        <Row label="기간" value={durationLabel} />
        <Row label="사이즈" value={make.size_made || '-'} />
        <Row label="내 게이지" value={make.actual_gauge || '-'} />
      </section>

      <section aria-labelledby="yarns" className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h2 id="yarns" className="text-[13px] font-semibold text-muted">
            실
          </h2>
          <button
            type="button"
            onClick={() => setEditing({ kind: 'yarn' })}
            className="min-h-11 text-sm font-semibold text-primary"
          >
            + 추가
          </button>
        </div>
        {yarns && yarns.length === 0 && (
          <p className="rounded-xl bg-surface px-4 py-5 text-center text-sm text-muted">
            쓴 실을 추가하면 무게도 함께 기록돼요.
          </p>
        )}
        {yarns?.map((y) => {
          const left = y.yarn_id ? stock?.get(y.yarn_id)?.grams_left : undefined
          const sub = [y.color, y.fiber, y.weight_class].filter(Boolean).join(' · ')
          return (
            <button
              key={y.id}
              type="button"
              onClick={() => setEditing({ kind: 'yarn', item: y })}
              className="flex items-center gap-3 rounded-xl bg-surface px-3.5 py-3 text-left"
            >
              <YarnSwatch name={y.name ?? ''} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[15px] font-bold">{y.name}</span>
                  {y.role && (
                    <span className="flex-none rounded border border-[#c8cbd3] px-1.5 text-[11px] text-[#4a4d55]">
                      {y.role}
                    </span>
                  )}
                </div>
                {sub && <div className="mt-0.5 truncate text-[13px] text-muted">{sub}</div>}
              </div>
              <div className="flex-none text-right">
                <div className="text-base font-bold">{formatGrams(y.grams_used)}</div>
                {left !== undefined && <div className="text-xs text-muted">남은 {formatGrams(left)}</div>}
              </div>
            </button>
          )
        })}
        {yarns && yarns.length > 0 && (
          <div className="flex items-center justify-between px-0.5">
            <span className="text-sm text-muted">총 사용량</span>
            <span className="text-base font-bold">{formatGrams(sumGrams(yarns))}</span>
          </div>
        )}
      </section>

      <section aria-labelledby="needles" className="flex flex-col">
        <div className="mb-1 flex items-center justify-between">
          <h2 id="needles" className="text-[13px] font-semibold text-muted">
            바늘
          </h2>
          <button
            type="button"
            onClick={() => setEditing({ kind: 'needle' })}
            className="min-h-11 text-sm font-semibold text-primary"
          >
            + 추가
          </button>
        </div>
        {needles && needles.length === 0 && (
          <p className="rounded-xl bg-surface px-4 py-5 text-center text-sm text-muted">쓴 바늘을 추가해 보세요.</p>
        )}
        {needles?.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => setEditing({ kind: 'needle', item: n })}
            className="flex min-h-11 items-center justify-between border-b border-hair py-2 text-left"
          >
            <span className="text-[15px]">
              {n.size_mm}mm {n.type}
              {n.length_cm ? ` ${n.length_cm}cm` : ''}
            </span>
            <span className="text-[13px] text-muted">{n.note}</span>
          </button>
        ))}
      </section>

      {make.review_note && (
        <section aria-labelledby="review" className="flex flex-col gap-2">
          <h2 id="review" className="text-[13px] font-semibold text-muted">
            완성 후기
          </h2>
          <div className="rounded-xl bg-surface px-4 py-3.5 text-[15px] leading-relaxed whitespace-pre-wrap">
            {make.review_note}
          </div>
        </section>
      )}

      {editing?.kind === 'yarn' && (
        <YarnSheet makeId={make.id} yarn={editing.item} onClose={() => setEditing(null)} />
      )}
      {editing?.kind === 'needle' && (
        <NeedleSheet makeId={make.id} needle={editing.item} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

/**
 * 날짜를 그 자리에서 고치는 줄. 날짜 선택 창에서 값이 여러 번 바뀌어도 서버에는 마지막 값만 한 번 보낸다.
 * 서버 값이 바뀌면(다른 곳에서 고쳤거나 되돌려졌을 때) 화면 값도 따라간다.
 */
function DateRow({
  label,
  value,
  onCommit,
  clearable,
  conflict,
}: {
  label: string
  value: string | null
  onCommit: (value: string | null) => void
  clearable?: boolean
  conflict?: string | null
}) {
  const [draft, setDraft] = useState(value ?? '')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef(onCommit)
  latest.current = onCommit

  useEffect(() => setDraft(value ?? ''), [value])
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), [])

  function change(next: string) {
    setDraft(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => latest.current(next || null), 700)
  }

  return (
    <label className="flex min-h-11 items-center justify-between gap-3">
      <span className="text-sm text-muted">{label}</span>
      <span className="flex items-center gap-1">
        {clearable && draft && (
          <button type="button" onClick={() => change('')} className="min-h-11 px-2 text-[13px] text-muted">
            지우기
          </button>
        )}
        <input
          type="date"
          value={draft}
          onChange={(e) => change(e.target.value)}
          aria-invalid={Boolean(conflict)}
          className="h-10 rounded-lg bg-surface px-2.5 text-[15px]"
        />
      </span>
    </label>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-9 items-center justify-between">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-[15px]">{value}</span>
    </div>
  )
}
