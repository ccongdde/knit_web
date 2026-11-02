import { useState, type FormEvent } from 'react'
import { dotDate, todayIso, validateDates } from '../lib/makes'
import { Field, SheetActions, inputClass } from './Field'
import Sheet from './Sheet'

/** "완성"을 고를 때 뜨는 창. 오래전에 만든 것도 기록할 수 있게 완성일을 직접 정한다. */
export default function FinishSheet({
  startedAt,
  finishedAt,
  saving,
  onConfirm,
  onClose,
}: {
  startedAt: string | null
  finishedAt: string | null
  saving: boolean
  onConfirm: (finishedAt: string) => void
  onClose: () => void
}) {
  const [date, setDate] = useState(finishedAt ?? todayIso())
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!date) {
      setError('완성일을 골라 주세요.')
      return
    }
    const problem = validateDates(startedAt, date)
    if (problem) {
      setError(problem)
      return
    }
    onConfirm(date)
  }

  return (
    <Sheet title="언제 완성했나요?" onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 pb-2">
        <p className="text-sm text-muted">시작일: {dotDate(startedAt)}</p>
        <Field label="완성일" htmlFor="finish-date">
          <input
            id="finish-date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              setError(null)
            }}
            className={inputClass}
          />
        </Field>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <SheetActions saving={saving} disabled={saving} />
      </form>
    </Sheet>
  )
}
