import { dotDate, durationDays, todayIso } from '../../lib/makes'
import type { Make } from '../../lib/types'

export default function OverviewTab({ make }: { make: Make }) {
  const days = durationDays(make.started_at, make.finished_at, todayIso())
  const durationLabel = days === null ? '-' : make.finished_at ? `${days}일` : `${days}일째`

  return (
    <div className="flex flex-col gap-6 px-5 pt-5 pb-6">
      <section aria-labelledby="schedule" className="flex flex-col">
        <h2 id="schedule" className="mb-1.5 text-[13px] font-semibold text-muted">
          일정
        </h2>
        <Row label="시작일" value={dotDate(make.started_at)} />
        <Row label="완성일" value={dotDate(make.finished_at)} />
        <Row label="기간" value={durationLabel} />
        <Row label="사이즈" value={make.size_made || '-'} />
        <Row label="내 게이지" value={make.actual_gauge || '-'} />
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
    </div>
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
