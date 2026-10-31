import { useEffect, useId, type ReactNode } from 'react'
import { CloseIcon } from './icons'

/** 폰에서는 아래에서 올라오고 넓은 화면에서는 가운데에 뜨는 입력 창 */
export default function Sheet({
  title,
  onClose,
  children,
  footer,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  const titleId = useId()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button
        type="button"
        aria-label="닫기"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-2xl bg-white md:rounded-2xl"
      >
        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <h2 id={titleId} className="text-base font-bold">
            {title}
          </h2>
          <button type="button" aria-label="닫기" onClick={onClose} className="-mr-2.5 flex size-11 items-center justify-center">
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pt-2 pb-4">{children}</div>
        {footer && (
          <div className="border-t border-line px-5 pt-2.5 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>
        )}
      </div>
    </div>
  )
}
