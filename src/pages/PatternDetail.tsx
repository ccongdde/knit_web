import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeftIcon, PlusIcon } from '../components/icons'
import MakeRow from '../components/MakeRow'
import PatternFiles from '../components/PatternFiles'
import { useMakes } from '../lib/queries/makes'
import { usePattern } from '../lib/queries/patterns'
import { usePhotoUrls } from '../lib/queries/photos'

export default function PatternDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: pattern, isLoading, error } = usePattern(id)
  const { data: makes } = useMakes(id)
  const { data: coverUrls } = usePhotoUrls((makes ?? []).map((m) => m.cover?.storage_path).filter((p): p is string => !!p))

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col">
      <div className="flex items-center justify-between pt-2 pr-5 pl-2.5">
        <button
          type="button"
          aria-label="도안 목록으로"
          onClick={() => navigate('/')}
          className="flex size-11 items-center justify-center"
        >
          <ChevronLeftIcon />
        </button>
        {pattern && (
          <Link to={`/patterns/${pattern.id}/edit`} className="flex min-h-11 items-center px-1 text-sm">
            수정
          </Link>
        )}
      </div>

      {isLoading && <p className="px-5 py-10 text-center text-sm text-muted">불러오는 중…</p>}

      {error && (
        <p role="alert" className="px-5 py-10 text-center text-sm text-danger">
          도안을 불러오지 못했어요. 잠시 뒤에 다시 시도해 주세요.
        </p>
      )}

      {!isLoading && !error && !pattern && (
        <p className="px-5 py-10 text-center text-sm text-muted">도안을 찾을 수 없어요.</p>
      )}

      {pattern && (
        <>
          <div className="flex flex-1 flex-col gap-5 px-5 pt-1 pb-6">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-bold">{pattern.title}</h1>
              {pattern.source && <div className="text-sm text-muted">{pattern.source}</div>}
              {pattern.tags.length > 0 && (
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {pattern.tags.map((t) => (
                    <li key={t} className="rounded-full bg-surface px-2.5 py-[3px] text-[13px] text-[#4a4d55]">
                      #{t}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <section aria-labelledby="note" className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <h2 id="note" className="text-[13px] font-semibold text-muted">
                  도안 메모
                </h2>
                <span className="text-xs text-muted">모든 제작 기록이 함께 봐요</span>
              </div>
              <div className="rounded-xl bg-surface px-4 py-3.5 text-[15px] leading-relaxed whitespace-pre-wrap">
                {pattern.pattern_note || <span className="text-muted">아직 메모가 없어요. 수정에서 적어 보세요.</span>}
              </div>
            </section>

            {pattern.pattern_gauge && (
              <section aria-labelledby="gauge" className="flex items-center justify-between">
                <h2 id="gauge" className="text-sm text-muted">
                  도안 게이지
                </h2>
                <span className="text-[15px]">{pattern.pattern_gauge}</span>
              </section>
            )}

            <PatternFiles patternId={pattern.id} />

            <section aria-labelledby="makes" className="flex flex-col">
              <div className="mb-1 flex items-center justify-between">
                <h2 id="makes" className="text-[13px] font-semibold text-muted">
                  제작 기록 {makes?.length ?? 0}
                </h2>
                <Link
                  to={`/patterns/${pattern.id}/makes/new`}
                  className="flex min-h-11 items-center gap-1 text-sm font-semibold text-primary"
                >
                  <PlusIcon width={16} height={16} strokeWidth={2.4} />새 제작
                </Link>
              </div>
              {makes && makes.length === 0 && (
                <p className="border-t border-hair py-6 text-center text-sm text-muted">
                  아직 제작 기록이 없어요. 뜨기 시작하면 "새 제작 시작"을 눌러 주세요.
                </p>
              )}
              {makes?.map((m, i) => (
                <MakeRow
                  key={m.id}
                  make={m}
                  index={i}
                  patternTitle={pattern.title}
                  coverUrl={m.cover ? coverUrls?.get(m.cover.storage_path) : undefined}
                />
              ))}
            </section>
          </div>

          <div className="sticky bottom-0 border-t border-line bg-white px-5 py-2.5">
            <Link
              to={`/patterns/${pattern.id}/makes/new`}
              className="flex min-h-[50px] items-center justify-center rounded-xl bg-primary text-base font-semibold text-white"
            >
              새 제작 시작
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
