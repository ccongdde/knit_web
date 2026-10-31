import { useState, type FormEvent } from 'react'
import NoteSheet from '../../components/NoteSheet'
import { noteDateLabel } from '../../lib/makes'
import { useCounters } from '../../lib/queries/counters'
import { useSaveNote, useWorkNotes, type WorkNoteWithPhotos } from '../../lib/queries/makeDetails'

export default function NotesTab({ makeId }: { makeId: string }) {
  const { data: notes, isLoading, error } = useWorkNotes(makeId)
  const { data: counters } = useCounters(makeId)
  const save = useSaveNote(makeId)
  const [text, setText] = useState('')
  const [withRow, setWithRow] = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [editing, setEditing] = useState<WorkNoteWithPhotos | null>(null)

  const mainCounter = counters?.[0]

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const body = text.trim()
    if (!body) return
    setSaveError(null)
    try {
      await save.mutateAsync({
        input: { title: null, body, row_ref: withRow && mainCounter ? mainCounter.value : null },
      })
      setText('')
    } catch {
      setSaveError('저장하지 못했어요. 쓴 내용은 그대로 두었어요.')
    }
  }

  return (
    <div className="flex flex-col gap-5 px-5 pt-4 pb-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-2 rounded-xl bg-surface p-3">
        <label htmlFor="new-note" className="sr-only">
          새 기록
        </label>
        <textarea
          id="new-note"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="기록을 남겨보세요"
          className="w-full resize-none bg-transparent px-1 py-1 text-[15px] leading-relaxed"
        />
        <div className="flex items-center justify-between gap-3">
          {mainCounter ? (
            <label className="flex min-h-11 items-center gap-2 text-[13px] text-muted">
              <input
                type="checkbox"
                checked={withRow}
                onChange={(e) => setWithRow(e.target.checked)}
                className="size-5 accent-primary"
              />
              현재 {mainCounter.value}단 함께 기록
            </label>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={save.isPending || !text.trim()}
            className="min-h-11 rounded-xl bg-primary px-5 text-[15px] font-semibold text-white disabled:opacity-50"
          >
            {save.isPending ? '저장 중…' : '기록'}
          </button>
        </div>
        {saveError && (
          <p role="alert" className="text-sm text-danger">
            {saveError}
          </p>
        )}
      </form>

      {isLoading && <p className="py-6 text-center text-sm text-muted">불러오는 중…</p>}
      {error && (
        <p role="alert" className="py-6 text-center text-sm text-danger">
          메모를 불러오지 못했어요.
        </p>
      )}
      {notes && notes.length === 0 && (
        <p className="py-6 text-center text-sm text-muted">뜨면서 떠오르는 것을 자유롭게 적어 보세요.</p>
      )}

      <ol className="flex flex-col">
        {notes?.map((n, i) => (
          <li key={n.id} className="flex gap-3">
            <div className="flex flex-none flex-col items-center pt-1.5">
              <span className="size-2 rounded-full bg-primary" />
              {i < notes.length - 1 && <span className="mt-1 w-px flex-1 bg-[#e4e6eb]" />}
            </div>
            <button
              type="button"
              onClick={() => setEditing(n)}
              className="flex min-w-0 flex-1 flex-col gap-1 pb-5 text-left"
              aria-label="메모 수정"
            >
              <span className="flex items-center gap-2">
                <span className="text-[13px] text-muted">{noteDateLabel(n.created_at)}</span>
                {n.row_ref != null && (
                  <span className="rounded border border-[#c8cbd3] px-1.5 text-[11px] text-[#4a4d55]">{n.row_ref}단</span>
                )}
              </span>
              {n.title && <span className="text-[15px] font-bold">{n.title}</span>}
              {n.body && <span className="text-sm leading-relaxed whitespace-pre-wrap">{n.body}</span>}
            </button>
          </li>
        ))}
      </ol>

      {editing && <NoteSheet makeId={makeId} note={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
