import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import CounterBar from '../components/CounterBar'
import { ChevronLeftIcon } from '../components/icons'
import MakeHero from '../components/MakeHero'
import StatusSelect from '../components/StatusSelect'
import TabBar from '../components/TabBar'
import { makeTitle, statusPatch, todayIso } from '../lib/makes'
import { usePatternFiles } from '../lib/queries/files'
import { useWorkNotes } from '../lib/queries/makeDetails'
import { useDeleteMake, useMake, useMakes, useUpdateMake } from '../lib/queries/makes'
import { usePattern } from '../lib/queries/patterns'
import { usePhotos } from '../lib/queries/photos'
import NotesTab from './tabs/NotesTab'
import OverviewTab from './tabs/OverviewTab'
import PatternTab from './tabs/PatternTab'

type TabKey = 'overview' | 'pattern' | 'notes'
const TAB_KEYS: TabKey[] = ['overview', 'pattern', 'notes']

export default function MakeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { data: make, isLoading, error } = useMake(id)
  const { data: pattern } = usePattern(make?.pattern_id)
  const { data: makes } = useMakes(make?.pattern_id)
  const { data: photos } = usePhotos(make?.id)
  const { data: files } = usePatternFiles(make?.pattern_id)
  const { data: notes } = useWorkNotes(make?.id)
  const update = useUpdateMake()
  const remove = useDeleteMake()

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: '개요' },
    { key: 'pattern', label: files?.length ? `도안 (${files.length})` : '도안' },
    { key: 'notes', label: notes?.length ? `메모 (${notes.length})` : '메모' },
  ]
  const requested = params.get('tab') as TabKey | null
  const tab: TabKey = requested && TAB_KEYS.includes(requested) ? requested : 'overview'
  const backTo = make ? `/patterns/${make.pattern_id}` : '/'

  if (isLoading) return <p className="px-5 py-10 text-center text-sm text-muted">불러오는 중…</p>
  if (error)
    return (
      <p role="alert" className="px-5 py-10 text-center text-sm text-danger">
        제작 기록을 불러오지 못했어요. 잠시 뒤에 다시 시도해 주세요.
      </p>
    )
  if (!make) return <p className="px-5 py-10 text-center text-sm text-muted">제작 기록을 찾을 수 없어요.</p>

  const index = Math.max(0, makes?.findIndex((m) => m.id === make.id) ?? 0)
  const title = makeTitle(make, index)

  async function onDelete() {
    if (!make) return
    if (!window.confirm('이 제작 기록과 메모, 사진, 카운터가 모두 지워져요. 지울까요?')) return
    await remove.mutateAsync(make.id)
    navigate(backTo, { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col">
      <div className="flex items-center justify-between pt-2 pr-5 pl-2.5">
        <button
          type="button"
          aria-label="도안으로 돌아가기"
          onClick={() => navigate(backTo)}
          className="flex size-11 items-center justify-center"
        >
          <ChevronLeftIcon />
        </button>
        <div className="flex gap-1.5">
          <Link to={`/makes/${make.id}/edit`} className="flex min-h-11 items-center px-2 text-sm">
            수정
          </Link>
          <button
            type="button"
            onClick={() => void onDelete()}
            disabled={remove.isPending}
            className="min-h-11 px-2 text-sm text-danger disabled:opacity-60"
          >
            삭제
          </button>
        </div>
      </div>

      <MakeHero
        makeId={make.id}
        seed={`${pattern?.title ?? ''}${index}`}
        photos={photos ?? []}
        coverId={make.cover_photo_id}
      />

      <div className="flex flex-col gap-1.5 px-5 pt-3.5">
        <StatusSelect
          value={make.status}
          disabled={update.isPending}
          onChange={(next) =>
            update.mutate({
              id: make.id,
              patch: statusPatch(next, { started_at: make.started_at, finished_at: make.finished_at }, todayIso()),
            })
          }
        />
        <h1 className="text-[22px] font-bold">{title}</h1>
        <div className="text-sm text-muted">
          {pattern?.title}
          {make.size_made ? ` · ${make.size_made} 사이즈` : ''}
        </div>
      </div>

      <div className="mt-3.5">
        <TabBar
          label="제작 기록 구역"
          tabs={tabs}
          active={tab}
          onChange={(key) => setParams(key === 'overview' ? {} : { tab: key }, { replace: true })}
        />
      </div>

      <div className="flex-1">
        {tab === 'overview' && <OverviewTab make={make} />}
        {tab === 'pattern' && <PatternTab patternId={make.pattern_id} makeId={make.id} />}
        {tab === 'notes' && <NotesTab makeId={make.id} />}
      </div>

      <CounterBar makeId={make.id} />
    </div>
  )
}
