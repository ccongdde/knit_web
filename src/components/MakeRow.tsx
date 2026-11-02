import { Link } from 'react-router-dom'
import { dotDate, formatGrams, makeTitle, sumGrams } from '../lib/makes'
import type { MakeWithStats } from '../lib/types'
import PatternThumb from './PatternThumb'
import StatusChip from './StatusChip'

/** 도안 상세에서 보여주는 제작 기록 한 줄 */
export default function MakeRow({
  make,
  index,
  patternTitle,
  coverUrl,
}: {
  make: MakeWithStats
  index: number
  patternTitle: string
  coverUrl?: string
}) {
  const title = makeTitle(make, index)
  const counter = [...make.counters].sort((a, b) => a.sort_order - b.sort_order)[0]
  const grams = sumGrams(make.make_yarns)
  const dates = make.started_at
    ? `${dotDate(make.started_at)} ~${make.finished_at ? ` ${dotDate(make.finished_at)}` : ''}`
    : '날짜 미정'
  const progress = counter?.target ? Math.min(100, Math.round((counter.value / counter.target) * 100)) : null

  return (
    <Link to={`/makes/${make.id}`} className="flex items-start gap-3.5 border-t border-hair py-3">
      {coverUrl ? (
        <img src={coverUrl} alt="" loading="lazy" decoding="async" className="size-14 flex-none rounded-lg object-cover" />
      ) : (
        <PatternThumb title={`${patternTitle}${index}`} size={56} />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-bold">{title}</div>
        <div className="mt-[3px] truncate text-[13px] text-muted">
          {dates}
          {make.size_made ? ` · ${make.size_made} 사이즈` : ''}
        </div>
        {make.status === 'in_progress' && counter && (
          <div className="mt-2 flex items-center gap-2">
            {progress !== null && (
              <div className="h-1 flex-1 rounded-full bg-line">
                <div className="h-1 rounded-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
            )}
            <span className="text-xs text-muted tabular-nums">
              {counter.target ? `${counter.value} / ${counter.target}단` : `${counter.value}단`}
            </span>
          </div>
        )}
        {make.status !== 'in_progress' && grams > 0 && (
          <div className="mt-1.5 text-[13px] text-muted">실 {formatGrams(grams)} 사용</div>
        )}
      </div>
      <StatusChip status={make.status} />
    </Link>
  )
}
