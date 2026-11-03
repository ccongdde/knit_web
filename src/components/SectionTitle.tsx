import type { ReactNode } from 'react'

/**
 * 화면의 큰 구역 제목 (도안 메모, 제작 기록, 일정, 실, 바늘 …).
 * 설명 글자보다 눈에 띄도록 크고 굵게, 남색과 왼쪽 막대로 표시한다.
 * 개수가 있으면 제목 옆에 작은 알약으로 붙인다.
 */
export default function SectionTitle({
  id,
  count,
  className = '',
  children,
}: {
  id?: string
  count?: number
  className?: string
  children: ReactNode
}) {
  return (
    <h2 id={id} className={`flex items-center gap-2 text-[17px] leading-snug font-bold text-primary ${className}`}>
      <span aria-hidden="true" className="h-[18px] w-1 flex-none rounded-full bg-primary" />
      {children}
      {count !== undefined && (
        <span className="rounded-full bg-primary-soft px-2 py-px text-[13px] font-semibold tabular-nums">{count}</span>
      )}
    </h2>
  )
}
