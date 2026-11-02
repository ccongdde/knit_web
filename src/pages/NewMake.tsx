import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CloseIcon } from '../components/icons'
import { makeTitle, todayIso, validateDates } from '../lib/makes'
import { useCreateMake, useMakes } from '../lib/queries/makes'
import { usePattern } from '../lib/queries/patterns'
import type { MakeStatus, MakeWithStats } from '../lib/types'

export default function NewMake() {
  const { id: patternId } = useParams()
  const { data: pattern, isLoading } = usePattern(patternId)
  const { data: makes, isLoading: makesLoading } = useMakes(patternId)

  if (isLoading || makesLoading) return <p className="px-5 py-10 text-center text-sm text-muted">불러오는 중…</p>
  if (!pattern) return <p className="px-5 py-10 text-center text-sm text-muted">도안을 찾을 수 없어요.</p>
  return <Body patternId={pattern.id} patternTitle={pattern.title} makes={makes ?? []} />
}

function Body({ patternId, patternTitle, makes }: { patternId: string; patternTitle: string; makes: MakeWithStats[] }) {
  const navigate = useNavigate()
  const create = useCreateMake()
  const hasPrevious = makes.length > 0

  const [label, setLabel] = useState('')
  const [mode, setMode] = useState<'copy' | 'blank'>(hasPrevious ? 'copy' : 'blank')
  const [copyFromId, setCopyFromId] = useState(makes[makes.length - 1]?.id ?? '')
  const [size, setSize] = useState('')
  const [status, setStatus] = useState<MakeStatus>('in_progress')
  const [startedAt, setStartedAt] = useState(todayIso())
  const [finishedAt, setFinishedAt] = useState('')
  const [error, setError] = useState<string | null>(null)

  const source = makes.find((m) => m.id === copyFromId)
  const planned = status === 'planned'
  const finished = status === 'finished'

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const started = planned ? null : startedAt || null
    const ended = finished ? finishedAt || null : null
    const problem = validateDates(started, ended)
    if (problem) {
      setError(problem)
      return
    }
    setError(null)
    try {
      const id = await create.mutateAsync({
        patternId,
        copyFromId: mode === 'copy' && copyFromId ? copyFromId : undefined,
        input: {
          label: label.trim() || null,
          status,
          size_made: size.trim() || null,
          actual_gauge: null,
          started_at: started,
          finished_at: ended,
          review_note: '',
        },
      })
      navigate(`/makes/${id}`, { replace: true })
    } catch {
      setError('만들지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex min-h-full max-w-3xl flex-col">
      <div className="flex items-center justify-between pt-2 pr-5 pl-2.5">
        <button
          type="button"
          aria-label="닫기"
          onClick={() => navigate(`/patterns/${patternId}`)}
          className="flex size-11 items-center justify-center"
        >
          <CloseIcon />
        </button>
        <div className="text-base font-bold">새 제작 시작</div>
        <span className="w-11" />
      </div>

      <div className="flex flex-1 flex-col gap-5 px-5 pt-3 pb-6">
        <div>
          <div className="text-[13px] text-muted">도안</div>
          <div className="text-base font-bold">{patternTitle}</div>
        </div>

        <Field label={`이름 (비우면 ${makes.length + 1}회차)`} htmlFor="label">
          <input
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="예: b실 버전"
            className="h-[50px] w-full rounded-xl bg-surface px-4 text-[15px]"
          />
        </Field>

        {hasPrevious && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[13px] font-semibold text-muted">시작 방식</legend>
            <div className="flex rounded-xl bg-surface p-1">
              {(
                [
                  ['blank', '빈 기록으로'],
                  ['copy', '이전 제작에서 복사'],
                ] as const
              ).map(([key, text]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={mode === key}
                  onClick={() => setMode(key)}
                  className={[
                    'min-h-11 flex-1 rounded-[9px] text-sm font-semibold',
                    mode === key ? 'bg-white text-primary' : 'text-muted',
                  ].join(' ')}
                >
                  {text}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {hasPrevious && mode === 'copy' && (
          <div className="flex flex-col gap-3">
            <Field label="복사할 제작 기록" htmlFor="source">
              <select
                id="source"
                value={copyFromId}
                onChange={(e) => setCopyFromId(e.target.value)}
                className="h-[50px] w-full rounded-xl bg-surface px-3.5 text-[15px]"
              >
                {makes.map((m, i) => (
                  <option key={m.id} value={m.id}>
                    {makeTitle(m, i)}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex flex-col gap-2 rounded-xl bg-surface px-4 py-3.5 text-sm">
              <p className="font-semibold text-done">
                ✓ 복사돼요 · 사이즈{source?.size_made ? `(${source.size_made})` : ''}, 내 게이지, 사용 바늘
              </p>
              <p className="text-muted">✕ 복사 안 돼요 · 실(새 실을 고르세요), 메모, 카운터, 사진</p>
            </div>
          </div>
        )}

        <Field label="상태" htmlFor="status">
          <select
            id="status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as MakeStatus)
              setError(null)
            }}
            className="h-[50px] w-full rounded-xl bg-surface px-3.5 text-[15px]"
          >
            <option value="in_progress">진행 중 (지금 뜨고 있어요)</option>
            <option value="finished">완성 (이미 다 뜬 것을 기록해요)</option>
            <option value="planned">예정 (아직 시작 전이에요)</option>
            <option value="paused">보류</option>
          </select>
        </Field>

        <Field label="사이즈" htmlFor="size">
          <input
            id="size"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder={mode === 'copy' && source?.size_made ? source.size_made : '예: M'}
            className="h-[50px] w-full rounded-xl bg-surface px-4 text-[15px]"
          />
        </Field>

        {!planned && (
          <div className="flex gap-3">
            <Field label="시작일" htmlFor="started" className="flex-1">
              <input
                id="started"
                type="date"
                value={startedAt}
                onChange={(e) => {
                  setStartedAt(e.target.value)
                  setError(null)
                }}
                className="h-[50px] w-full rounded-xl bg-surface px-3.5 text-[15px]"
              />
            </Field>
            {finished && (
              <Field label="완성일" htmlFor="finished" className="flex-1">
                <input
                  id="finished"
                  type="date"
                  value={finishedAt}
                  onChange={(e) => {
                    setFinishedAt(e.target.value)
                    setError(null)
                  }}
                  className="h-[50px] w-full rounded-xl bg-surface px-3.5 text-[15px]"
                />
              </Field>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-line bg-white px-5 py-2.5">
        <button
          type="submit"
          disabled={create.isPending}
          className="min-h-[52px] w-full rounded-xl bg-primary text-base font-semibold text-white disabled:opacity-60"
        >
          {create.isPending ? '만드는 중…' : finished ? '기록하기' : '제작 시작'}
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
