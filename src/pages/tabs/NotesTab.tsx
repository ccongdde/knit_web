import { useMemo, useRef, useState, type FormEvent } from 'react'
import NoteSheet from '../../components/NoteSheet'
import PhotoLightbox from '../../components/PhotoLightbox'
import { noteDateLabel } from '../../lib/makes'
import { useCounters } from '../../lib/queries/counters'
import { useSaveNote, useWorkNotes, type WorkNoteWithPhotos } from '../../lib/queries/makeDetails'
import { usePhotos, usePhotoUrls, useUploadPhotos } from '../../lib/queries/photos'
import { useMake } from '../../lib/queries/makes'
import type { Photo } from '../../lib/types'

export default function NotesTab({ makeId }: { makeId: string }) {
  const { data: notes, isLoading, error } = useWorkNotes(makeId)
  const { data: counters } = useCounters(makeId)
  const { data: make } = useMake(makeId)
  const { data: photos } = usePhotos(makeId)
  const { data: urls } = usePhotoUrls((photos ?? []).flatMap((p) => (p.thumb_path ? [p.storage_path, p.thumb_path] : [p.storage_path])))
  const save = useSaveNote(makeId)
  const upload = useUploadPhotos(makeId)
  const fileInput = useRef<HTMLInputElement>(null)

  const [text, setText] = useState('')
  const [picked, setPicked] = useState<File[]>([])
  const [withRow, setWithRow] = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [editing, setEditing] = useState<WorkNoteWithPhotos | null>(null)
  const [viewer, setViewer] = useState<{ photos: Photo[]; index: number } | null>(null)

  const mainCounter = counters?.[0]
  const photosByNote = useMemo(() => {
    const map = new Map<string, Photo[]>()
    for (const p of photos ?? []) {
      if (!p.note_id) continue
      map.set(p.note_id, [...(map.get(p.note_id) ?? []), p])
    }
    return map
  }, [photos])

  const busy = save.isPending || upload.isPending
  const canSubmit = !busy && (text.trim() !== '' || picked.length > 0)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSaveError(null)
    try {
      const noteId = await save.mutateAsync({
        input: { title: null, body: text.trim(), row_ref: withRow && mainCounter ? mainCounter.value : null },
      })
      setText('')
      if (picked.length > 0) {
        const files = picked
        setPicked([])
        await upload.mutateAsync({ files, noteId })
      }
    } catch {
      setSaveError('저장하지 못한 것이 있어요. 메모는 목록에서 다시 확인해 주세요.')
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
        {picked.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-1 text-[13px] text-muted">
            사진 {picked.length}장을 함께 올려요
            <button type="button" onClick={() => setPicked([])} className="min-h-9 font-semibold text-primary">
              취소
            </button>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1">
            <button
              type="button"
              aria-label="사진 붙이기"
              onClick={() => fileInput.current?.click()}
              className="flex size-11 flex-none items-center justify-center rounded-full text-muted"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = [...(e.target.files ?? [])]
                e.target.value = ''
                if (files.length > 0) setPicked((prev) => [...prev, ...files])
              }}
            />
            {mainCounter && (
              <label className="flex min-h-11 items-center gap-2 text-[13px] text-muted">
                <input
                  type="checkbox"
                  checked={withRow}
                  onChange={(e) => setWithRow(e.target.checked)}
                  className="size-5 accent-primary"
                />
                {mainCounter.value}단 함께 기록
              </label>
            )}
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="min-h-11 flex-none rounded-xl bg-primary px-5 text-[15px] font-semibold text-white disabled:opacity-50"
          >
            {busy ? '저장 중…' : '기록'}
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
        {notes?.map((n, i) => {
          const notePhotos = photosByNote.get(n.id) ?? []
          return (
            <li key={n.id} className="flex gap-3">
              <div className="flex flex-none flex-col items-center pt-1.5">
                <span className="size-2 rounded-full bg-primary" />
                {i < notes.length - 1 && <span className="mt-1 w-px flex-1 bg-[#e4e6eb]" />}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5 pb-5">
                <button
                  type="button"
                  onClick={() => setEditing(n)}
                  className="flex flex-col gap-1 text-left"
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
                {notePhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {notePhotos.map((p, pi) => (
                      <button
                        key={p.id}
                        type="button"
                        aria-label={`사진 ${pi + 1} 크게 보기`}
                        onClick={() => setViewer({ photos: notePhotos, index: pi })}
                        className="size-16 overflow-hidden rounded-lg bg-surface"
                      >
                        {urls?.[p.thumb_path ?? p.storage_path] && (
                          <img src={urls[p.thumb_path ?? p.storage_path]} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {editing && <NoteSheet makeId={makeId} note={editing} onClose={() => setEditing(null)} />}
      {viewer && urls && (
        <PhotoLightbox
          makeId={makeId}
          photos={viewer.photos}
          urls={urls}
          startIndex={viewer.index}
          coverId={make?.cover_photo_id ?? null}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  )
}
