import { STATUS_LABEL, type MakeStatus } from '../lib/types'

const STYLE: Record<MakeStatus, string> = {
  in_progress: 'bg-primary-soft text-primary',
  finished: 'bg-done-soft text-done',
  planned: 'bg-planned-soft text-planned',
  paused: 'bg-paused-soft text-paused',
}

/** 상태 칩처럼 보이지만 눌러서 바꿀 수 있는 선택 상자 */
export default function StatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: MakeStatus
  onChange: (next: MakeStatus) => void
  disabled?: boolean
}) {
  return (
    <select
      aria-label="상태 변경"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as MakeStatus)}
      className={`min-h-8 self-start rounded-md px-2.5 text-xs font-semibold ${STYLE[value]}`}
    >
      {(Object.keys(STATUS_LABEL) as MakeStatus[]).map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  )
}
