import { STATUS_LABEL, type MakeStatus } from '../lib/types'

const STYLE: Record<MakeStatus, string> = {
  in_progress: 'bg-primary-soft text-primary',
  finished: 'bg-done-soft text-done',
  planned: 'bg-planned-soft text-planned',
  paused: 'bg-paused-soft text-paused',
}

export default function StatusChip({ status }: { status: MakeStatus }) {
  return (
    <span className={`flex-none rounded-md px-[9px] py-[3px] text-xs font-semibold ${STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  )
}
