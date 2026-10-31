import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CloseIcon } from '../components/icons'
import { useMake, useUpdateMake } from '../lib/queries/makes'
import { STATUS_LABEL, type Make, type MakeStatus } from '../lib/types'

/** 제작 기록 수정 화면 (/makes/:id/edit) */
export default function MakeForm() {
  const { id } = useParams()
  const { data: make, isLoading } = useMake(id)
  if (isLoading) return <p className="px-5 py-10 text-center text-sm text-muted">불러오는 중…</p>
  if (!make) return <p className="px-5 py-10 text-center text-sm text-muted">제작 기록을 찾을 수 없어요.</p>
  return <Body make={make} />
}

function Body({ make }: { make: Make }) {
  const navigate = useNavigate()
  const update = useUpdateMake()

  const [label, setLabel] = useState(make.label ?? '')
  const [status, setStatus] = useState<MakeStatus>(make.status)
  const [size, setSize] = useState(make.size_made ?? '')
  const [gauge, setGauge] = useState(make.actual_gauge ?? '')
  const [startedAt, setStartedAt] = useState(make.started_at ?? '')
  const [finishedAt, setFinishedAt] = useState(make.finished_at ?? '')
  const [review, setReview] = useState(make.review_note)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await update.mutateAsync({
        id: make.id,
        patch: {
          label: label.trim() || null,
          status,
          size_made: size.trim() || null,
          actual_gauge: gauge.trim() || null,
          started_at: startedAt || null,
          finished_at: finishedAt || null,
          review_note: review,
        },
      })
      navigate(`/makes/${make.id}`, { replace: true })
    } catch {
      setError('저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex min-h-full max-w-3xl flex-col">
      <div className="flex items-center justify-between pt-2 pr-5 pl-2.5">
        <button
          type="button"
          aria-label="닫기"
          onClick={() => navigate(`/makes/${make.id}`)}
          className="flex size-11 items-center justify-center"
        >
          <CloseIcon />
        </button>
        <div className="text-base font-bold">제작 기록 수정</div>
        <span className="w-11" />
      </div>

      <div className="flex flex-1 flex-col gap-5 px-5 pt-3 pb-6">
        <Field label="이름 (비우면 N회차로 보여요)" htmlFor="label">
          <input
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="예: b실 버전"
            className="h-[50px] w-full rounded-xl bg-surface px-4 text-[15px]"
          />
        </Field>

        <Field label="상태" htmlFor="status">
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as MakeStatus)}
            className="h-[50px] w-full rounded-xl bg-surface px-3.5 text-[15px]"
          >
            {(Object.keys(STATUS_LABEL) as MakeStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex gap-3">
          <Field label="시작일" htmlFor="started" className="flex-1">
            <input
              id="started"
              type="date"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              className="h-[50px] w-full rounded-xl bg-surface px-3.5 text-[15px]"
            />
          </Field>
          <Field label="완성일" htmlFor="finished" className="flex-1">
            <input
              id="finished"
              type="date"
              value={finishedAt}
              onChange={(e) => setFinishedAt(e.target.value)}
              className="h-[50px] w-full rounded-xl bg-surface px-3.5 text-[15px]"
            />
          </Field>
        </div>

        <div className="flex gap-3">
          <Field label="사이즈" htmlFor="size" className="flex-1">
            <input
              id="size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="예: M"
              className="h-[50px] w-full rounded-xl bg-surface px-4 text-[15px]"
            />
          </Field>
          <Field label="내 게이지" htmlFor="gauge" className="flex-[1.6]">
            <input
              id="gauge"
              value={gauge}
              onChange={(e) => setGauge(e.target.value)}
              placeholder="20코 × 28단 / 10cm"
              className="h-[50px] w-full rounded-xl bg-surface px-4 text-[15px]"
            />
          </Field>
        </div>

        <Field label="완성 후기" htmlFor="review">
          <textarea
            id="review"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={5}
            className="w-full resize-y rounded-xl bg-surface px-4 py-3 text-[15px] leading-relaxed"
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-line bg-white px-5 py-2.5">
        <button
          type="submit"
          disabled={update.isPending}
          className="min-h-[52px] w-full rounded-xl bg-primary text-base font-semibold text-white disabled:opacity-60"
        >
          {update.isPending ? '저장 중…' : '저장'}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  className = '',
  children,
}: {
  label: string
  htmlFor: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-muted">
        {label}
      </label>
      {children}
    </div>
  )
}
