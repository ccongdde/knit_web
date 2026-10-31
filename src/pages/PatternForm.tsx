import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CloseIcon } from '../components/icons'
import { parseTags } from '../lib/patternList'
import { useDeletePattern, usePattern, useSavePattern } from '../lib/queries/patterns'
import type { PatternDetail } from '../lib/types'

/** 새 도안(/patterns/new)과 도안 수정(/patterns/:id/edit)이 함께 쓰는 화면 */
export default function PatternForm() {
  const { id } = useParams()
  const { data: existing, isLoading } = usePattern(id)

  if (id && isLoading) return <p className="px-5 py-10 text-center text-sm text-muted">불러오는 중…</p>
  if (id && !existing) return <p className="px-5 py-10 text-center text-sm text-muted">도안을 찾을 수 없어요.</p>
  return <FormBody existing={existing ?? null} />
}

function FormBody({ existing }: { existing: PatternDetail | null }) {
  const navigate = useNavigate()
  const save = useSavePattern()
  const remove = useDeletePattern()

  const [title, setTitle] = useState(existing?.title ?? '')
  const [source, setSource] = useState(existing?.source ?? '')
  const [tagsText, setTagsText] = useState(existing?.tags.map((t) => `#${t}`).join(' ') ?? '')
  const [gauge, setGauge] = useState(existing?.pattern_gauge ?? '')
  const [note, setNote] = useState(existing?.pattern_note ?? '')
  const [error, setError] = useState<string | null>(null)

  const busy = save.isPending || remove.isPending
  const back = existing ? `/patterns/${existing.id}` : '/'

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('도안 이름을 적어 주세요.')
      return
    }
    setError(null)
    try {
      const savedId = await save.mutateAsync({
        id: existing?.id,
        input: {
          title: title.trim(),
          source: source.trim() || null,
          tags: parseTags(tagsText),
          pattern_note: note,
          pattern_gauge: gauge.trim() || null,
        },
      })
      navigate(`/patterns/${savedId}`, { replace: true })
    } catch {
      setError('저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
    }
  }

  async function onDelete() {
    if (!existing) return
    if (!window.confirm('이 도안과 제작 기록, 메모가 모두 지워져요. 지울까요?')) return
    try {
      await remove.mutateAsync(existing.id)
      navigate('/', { replace: true })
    } catch {
      setError('지우지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex min-h-full max-w-3xl flex-col">
      <div className="flex items-center justify-between pt-2 pr-5 pl-2.5">
        <button
          type="button"
          aria-label="닫기"
          onClick={() => navigate(back)}
          className="flex size-11 items-center justify-center"
        >
          <CloseIcon />
        </button>
        <div className="text-base font-bold">{existing ? '도안 수정' : '새 도안'}</div>
        <span className="w-11" />
      </div>

      <div className="flex flex-1 flex-col gap-5 px-5 pt-3 pb-6">
        <Field label="도안 이름" htmlFor="title">
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 라글란 가디건"
            autoFocus={!existing}
            className="h-[50px] w-full rounded-xl bg-surface px-4 text-[15px]"
          />
        </Field>

        <Field label="출처 (선택)" htmlFor="source">
          <input
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="디자이너, 구매처 등"
            className="h-[50px] w-full rounded-xl bg-surface px-4 text-[15px]"
          />
        </Field>

        <Field label="태그 (선택)" htmlFor="tags" hint="쉼표나 띄어쓰기로 나눠요. 예: #가디건 #울">
          <input
            id="tags"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="#가디건 #라글란"
            className="h-[50px] w-full rounded-xl bg-surface px-4 text-[15px]"
          />
        </Field>

        <Field label="도안 게이지 (선택)" htmlFor="gauge">
          <input
            id="gauge"
            value={gauge}
            onChange={(e) => setGauge(e.target.value)}
            placeholder="예: 20코 × 28단 / 10cm"
            className="h-[50px] w-full rounded-xl bg-surface px-4 text-[15px]"
          />
        </Field>

        <Field label="도안 메모 (선택)" htmlFor="note" hint="난이도, 헷갈린 부분, 다음에 고칠 점. 모든 제작 기록이 함께 봐요.">
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={6}
            className="w-full resize-y rounded-xl bg-surface px-4 py-3 text-[15px] leading-relaxed"
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        {existing && (
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="min-h-11 self-start text-sm font-semibold text-danger disabled:opacity-60"
          >
            이 도안 지우기
          </button>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-line bg-white px-5 py-2.5">
        <button
          type="submit"
          disabled={busy}
          className="min-h-[52px] w-full rounded-xl bg-primary text-base font-semibold text-white disabled:opacity-60"
        >
          {save.isPending ? '저장 중…' : '저장'}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-muted">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}
