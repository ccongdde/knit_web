import { useState, type FormEvent } from 'react'
import { useCounters, useDeleteCounter, useSaveCounter } from '../lib/queries/counters'
import { useCounterControl } from '../lib/useCounterControl'
import type { Counter } from '../lib/types'
import { Field, inputClass } from './Field'
import { PlusIcon } from './icons'
import Sheet from './Sheet'

function MinusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  )
}

/** 제작 기록 화면 아래에 늘 붙어 있는 단수 카운터. 첫 번째 카운터를 크게 보여주고, 나머지는 "더보기"에서 다룬다. */
export default function CounterBar({ makeId }: { makeId: string }) {
  const { data: counters } = useCounters(makeId)
  const [open, setOpen] = useState(false)
  const main = counters?.[0]
  const control = useCounterControl(main, makeId)

  if (!counters) return null

  return (
    <div className="sticky bottom-0 z-10 flex items-center gap-3 border-t border-line bg-white px-5 py-2">
      {main ? (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="카운터 더보기"
            className="flex min-h-11 flex-none flex-col items-start justify-center text-left"
          >
            <span className="text-[13px] font-semibold text-muted">{main.label}</span>
            {counters.length > 1 && <span className="text-[11px] text-primary">+{counters.length - 1}개 더</span>}
          </button>
          <span aria-live="polite" className="flex-1 text-[30px] leading-none font-bold tabular-nums">
            {control.value}
            {main.target ? <span className="ml-1 text-sm font-medium text-muted">/ {main.target}</span> : null}
          </span>
          {control.saveFailed && (
            <button type="button" onClick={() => void control.retry()} className="text-xs font-semibold text-danger">
              저장 안 됨 · 다시 시도
            </button>
          )}
          <button
            type="button"
            aria-label={`${main.label} 1 감소`}
            onClick={() => control.change(-1)}
            className="flex size-12 flex-none items-center justify-center rounded-full border border-edge bg-white"
          >
            <MinusIcon />
          </button>
          <button
            type="button"
            aria-label={`${main.label} 1 증가`}
            onClick={() => control.change(1)}
            className="flex size-12 flex-none items-center justify-center rounded-full bg-primary text-white"
          >
            <PlusIcon width={22} height={22} strokeWidth={2.2} />
          </button>
        </>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="min-h-12 flex-1 text-sm font-semibold text-primary">
          + 카운터 추가
        </button>
      )}
      {open && <CounterSheet makeId={makeId} counters={counters} onClose={() => setOpen(false)} />}
    </div>
  )
}

/** 화면에서 쓰는 모든 카운터를 한곳에서 다루는 창: 값 조절, 목표 정하기, 이름 바꾸기, 추가, 삭제 */
function CounterSheet({ makeId, counters, onClose }: { makeId: string; counters: Counter[]; onClose: () => void }) {
  const save = useSaveCounter(makeId)
  const [label, setLabel] = useState('')
  const [target, setTarget] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onAdd(e: FormEvent) {
    e.preventDefault()
    if (!label.trim()) {
      setError('카운터 이름을 적어 주세요. 예: 소매 줄임')
      return
    }
    const t = target.trim() === '' ? null : Number(target)
    if (t !== null && (!Number.isInteger(t) || t <= 0)) {
      setError('목표는 1 이상의 정수로 적어 주세요.')
      return
    }
    setError(null)
    try {
      await save.mutateAsync({
        input: { label: label.trim(), target: t },
        sortOrder: Math.max(-1, ...counters.map((c) => c.sort_order)) + 1,
      })
      setLabel('')
      setTarget('')
    } catch {
      setError('추가하지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
    }
  }

  return (
    <Sheet title="카운터" onClose={onClose}>
      <div className="flex flex-col gap-4 pb-2">
        {counters.map((c) => (
          <CounterRow key={c.id} makeId={makeId} counter={c} />
        ))}

        <form onSubmit={onAdd} className="flex flex-col gap-3 border-t border-line pt-4">
          <h3 className="text-[13px] font-semibold text-muted">카운터 추가</h3>
          <div className="flex gap-3">
            <Field label="이름" htmlFor="clabel" className="flex-[2]">
              <input
                id="clabel"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="예: 소매 줄임"
                className={inputClass}
              />
            </Field>
            <Field label="목표 (선택)" htmlFor="ctarget" className="flex-1">
              <input
                id="ctarget"
                inputMode="numeric"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={save.isPending}
            className="min-h-12 rounded-xl bg-primary text-base font-semibold text-white disabled:opacity-60"
          >
            추가
          </button>
        </form>
      </div>
    </Sheet>
  )
}

function CounterRow({ makeId, counter }: { makeId: string; counter: Counter }) {
  const control = useCounterControl(counter, makeId)
  const save = useSaveCounter(makeId)
  const remove = useDeleteCounter(makeId)
  const [label, setLabel] = useState(counter.label)
  const [target, setTarget] = useState(counter.target != null ? String(counter.target) : '')

  function commitMeta() {
    const t = target.trim() === '' ? null : Number(target)
    if (t !== null && (!Number.isInteger(t) || t <= 0)) return
    if (label.trim() === counter.label && t === counter.target) return
    if (!label.trim()) return
    save.mutate({ id: counter.id, input: { label: label.trim(), target: t } })
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface p-3.5">
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`cl-${counter.id}`}>
          카운터 이름
        </label>
        <input
          id={`cl-${counter.id}`}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={commitMeta}
          className="h-11 min-w-0 flex-1 rounded-lg bg-white px-3 text-[15px] font-semibold"
        />
        <label className="flex items-center gap-1.5 text-[13px] text-muted">
          목표
          <input
            aria-label={`${counter.label} 목표`}
            inputMode="numeric"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onBlur={commitMeta}
            className="h-11 w-16 rounded-lg bg-white px-2 text-right text-[15px]"
          />
        </label>
      </div>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label={`${counter.label} 1 감소`}
          onClick={() => control.change(-1)}
          className="flex size-12 items-center justify-center rounded-full border border-edge bg-white"
        >
          <MinusIcon />
        </button>
        <span aria-live="polite" className="flex-1 text-center text-[34px] leading-none font-bold tabular-nums">
          {control.value}
        </span>
        <button
          type="button"
          aria-label={`${counter.label} 1 증가`}
          onClick={() => control.change(1)}
          className="flex size-12 items-center justify-center rounded-full bg-primary text-white"
        >
          <PlusIcon width={22} height={22} strokeWidth={2.2} />
        </button>
      </div>
      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`${counter.label}을(를) 0으로 되돌릴까요?`)) control.set(0)
          }}
          className="min-h-11 text-sm text-muted"
        >
          0으로 되돌리기
        </button>
        <button
          type="button"
          disabled={remove.isPending}
          onClick={() => {
            if (window.confirm(`${counter.label} 카운터를 지울까요?`)) remove.mutate(counter.id)
          }}
          className="min-h-11 text-sm font-semibold text-danger disabled:opacity-60"
        >
          지우기
        </button>
      </div>
    </div>
  )
}

/** PDF 위에 떠 있는 작은 카운터 (첫 번째 카운터만) */
export function CounterPill({ makeId }: { makeId: string }) {
  const { data: counters } = useCounters(makeId)
  const main = counters?.[0]
  const control = useCounterControl(main, makeId)
  if (!main) return null

  return (
    <div className="pointer-events-auto flex items-center gap-2 self-center rounded-full bg-white py-1.5 pr-2 pl-[18px] text-ink shadow-lg">
      <span className="text-[13px] font-semibold text-muted">{main.label}</span>
      <span aria-live="polite" className="min-w-[52px] text-center text-[26px] leading-none font-bold tabular-nums">
        {control.value}
      </span>
      <button
        type="button"
        aria-label={`${main.label} 1 감소`}
        onClick={() => control.change(-1)}
        className="flex size-12 items-center justify-center rounded-full border border-edge bg-white"
      >
        <MinusIcon />
      </button>
      <button
        type="button"
        aria-label={`${main.label} 1 증가`}
        onClick={() => control.change(1)}
        className="flex size-12 items-center justify-center rounded-full bg-primary text-white"
      >
        <PlusIcon width={22} height={22} strokeWidth={2.2} />
      </button>
    </div>
  )
}
