import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import CounterBar from '../components/CounterBar'
import FinishSheet from '../components/FinishSheet'
import { ChevronLeftIcon } from '../components/icons'
import MakeHero from '../components/MakeHero'
import StatusSelect from '../components/StatusSelect'
import TabBar from '../components/TabBar'
import { makeTitle, statusPatch, todayIso } from '../lib/makes'
import { useMakeNeedles, useMakeYarns, useWorkNotes } from '../lib/queries/makeDetails'
import { useCounters } from '../lib/queries/counters'
import { useYarnStock } from '../lib/queries/inventory'
import { useDeleteMake, useMake, useUpdateMake } from '../lib/queries/makes'
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
  const [finishing, setFinishing] = useState(false)

  // 도안 정보(이름, 제작 순서, PDF 개수)는 제작 기록과 한 번에 오고,
  // 나머지는 주소의 id 만으로 시작할 수 있어서 함께 요청한다. 하나씩 이어서 기다리지 않는다.
  const { data: make, isLoading, error } = useMake(id)
  const { data: photos } = usePhotos(id)
  const { data: notes } = useWorkNotes(id)
  useCounters(id)
  useMakeYarns(id)
  useMakeNeedles(id)
  useYarnStock()
  const update = useUpdateMake()
  const remove = useDeleteMake()

  const pattern = make?.pattern
  const fileCount = pattern?.pattern_files.length ?? 0
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: '개요' },
    { key: 'pattern', label: fileCount ? `도안 (${fileCount})` : '도안' },
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

  const siblings = [...(pattern?.makes ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at))
  const index = Math.max(0, siblings.findIndex((m) => m.id === make.id))
  const title = makeTitle(make, index)

  async function onDelete() {
    if (!make) return
    if (!window.confirm('이 제작 기록과 메모, 사진, 카운터가 모두 지워져요. 지울까요?')) return
    await remove.mutateAsync(make.id)
    navigate(backTo, { replace: true })
  }

  function onStatusChange(next: Parameters<typeof statusPatch>[0]) {
    if (!make) return
    // 완성은 날짜를 직접 정할 수 있게 창을 먼저 연다.
    if (next === 'finished') {
      setFinishing(true)
      return
    }
    update.mutate({
      id: make.id,
      patch: statusPatch(next, { started_at: make.started_at, finished_at: make.finished_at }, todayIso()),
    })
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
        <StatusSelect value={make.status} onChange={onStatusChange} />
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
        {tab === 'pattern' && (
          <PatternTab patternId={make.pattern_id} makeId={make.id} patternNote={pattern?.pattern_note ?? ''} />
        )}
        {tab === 'notes' && <NotesTab makeId={make.id} />}
      </div>

      <CounterBar makeId={make.id} />

      {finishing && (
        <FinishSheet
          startedAt={make.started_at}
          finishedAt={make.finished_at}
          saving={update.isPending}
          onClose={() => setFinishing(false)}
          onConfirm={(date) => {
            update.mutate({
              id: make.id,
              patch: { status: 'finished', started_at: make.started_at, finished_at: date },
            })
            setFinishing(false)
          }}
        />
      )}
    </div>
  )
}
