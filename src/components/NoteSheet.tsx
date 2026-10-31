import { useState, type FormEvent } from 'react'
import { useDeleteNote, useSaveNote, type WorkNoteWithPhotos } from '../lib/queries/makeDetails'
import { Field, SheetActions, inputClass } from './Field'
import Sheet from './Sheet'

/** 작업 메모 한 건을 고치거나 지우는 창 */
export default function NoteSheet({
  makeId,
  note,
  onClose,
}: {
  makeId: string
  note: WorkNoteWithPhotos
  onClose: () => void
}) {
  const save = useSaveNote(makeId)
  const remove = useDeleteNote(makeId)
  const [title, setTitle] = useState(note.title ?? '')
  const [body, setBody] = useState(note.body)
  const [row, setRow] = useState(note.row_ref != null ? String(note.row_ref) : '')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const rowNumber = row.trim() === '' ? null : Number(row)
    if (rowNumber !== null && (!Number.isInteger(rowNumber) || rowNumber < 0)) {
      setError('단수는 0 이상의 정수로 적어 주세요.')
      return
    }
    setError(null)
    try {
      await save.mutateAsync({ id: note.id, input: { title: title.trim() || null, body, row_ref: rowNumber } })
      onClose()
    } catch {
      setError('저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
    }
  }

  async function onDelete() {
    if (!window.confirm('이 메모를 지울까요? 붙인 사진도 함께 지워져요.')) return
    try {
      await remove.mutateAsync(note.id)
      onClose()
    } catch {
      setError('지우지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
    }
  }

  const busy = save.isPending || remove.isPending

  return (
    <Sheet title="메모 수정" onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 pb-2">
        <Field label="제목 (선택)" htmlFor="ntitle">
          <input id="ntitle" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </Field>
        <Field label="내용" htmlFor="nbody">
          <textarea
            id="nbody"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="w-full resize-y rounded-xl bg-surface px-4 py-3 text-[15px] leading-relaxed"
          />
        </Field>
        <Field label="기록한 단수 (선택)" htmlFor="nrow">
          <input
            id="nrow"
            inputMode="numeric"
            value={row}
            onChange={(e) => setRow(e.target.value)}
            className={inputClass}
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <SheetActions saving={save.isPending} disabled={busy} onDelete={() => void onDelete()} deleteLabel="메모 지우기" />
      </form>
    </Sheet>
  )
}
