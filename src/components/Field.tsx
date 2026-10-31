import type { ReactNode } from 'react'

export const inputClass = 'h-[50px] w-full rounded-xl bg-surface px-4 text-[15px]'
export const selectClass = 'h-[50px] w-full rounded-xl bg-surface px-3.5 text-[15px]'

export function Field({
  label,
  htmlFor,
  hint,
  className = '',
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-muted">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}

/** 시트 맨 아래에 놓는 저장·삭제 버튼 묶음 */
export function SheetActions({
  onDelete,
  deleteLabel,
  saving,
  disabled,
}: {
  onDelete?: () => void
  deleteLabel?: string
  saving: boolean
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          className="min-h-12 px-2 text-sm font-semibold text-danger disabled:opacity-60"
        >
          {deleteLabel ?? '지우기'}
        </button>
      )}
      <button
        type="submit"
        disabled={disabled}
        className="min-h-12 flex-1 rounded-xl bg-primary text-base font-semibold text-white disabled:opacity-60"
      >
        {saving ? '저장 중…' : '저장'}
      </button>
    </div>
  )
}
