import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { formatBytes } from '../lib/makes'
import { useDeletePatternFile, usePatternFiles, useUpdatePatternFile, useUploadPatternFiles } from '../lib/queries/files'
import type { PatternFile } from '../lib/types'
import { Field, SheetActions, inputClass } from './Field'
import { ChevronRightIcon, PlusIcon } from './icons'
import Sheet from './Sheet'

function FileIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="flex-none text-primary"
    >
      <path d="M6 3h8l4 4v14H6V3z" />
      <path d="M14 3v4h4" />
    </svg>
  )
}

/**
 * 도안 PDF 목록. 한 도안에 PDF를 여러 개 올릴 수 있다 (본 도안, 사이즈표, 정오표 …).
 * makeId 를 주면 PDF를 열 때 그 제작 기록의 단수 카운터가 함께 따라온다.
 * editable 이 아니면 올리기·이름 바꾸기·지우기 없이 보기만 한다.
 */
export default function PatternFiles({
  patternId,
  makeId,
  editable = true,
}: {
  patternId: string
  makeId?: string
  editable?: boolean
}) {
  const { data: files, isLoading, error } = usePatternFiles(patternId)
  const upload = useUploadPatternFiles(patternId)
  const inputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState<PatternFile | null>(null)

  const href = (f: PatternFile) => `/pdf/${f.id}${makeId ? `?make=${makeId}` : ''}`

  return (
    <section aria-labelledby="pdfs" className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 id="pdfs" className="text-[13px] font-semibold text-muted">
          도안 PDF {files?.length ?? 0}
        </h2>
        {editable && (
          <>
            <button
              type="button"
              disabled={upload.isPending}
              onClick={() => inputRef.current?.click()}
              className="flex min-h-11 items-center gap-1 text-sm font-semibold text-primary disabled:opacity-60"
            >
              <PlusIcon width={16} height={16} strokeWidth={2.4} />
              {upload.isPending ? '올리는 중…' : 'PDF 추가'}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                const picked = [...(e.target.files ?? [])]
                e.target.value = ''
                if (picked.length > 0) upload.mutate(picked)
              }}
            />
          </>
        )}
      </div>

      {upload.isError && (
        <p role="alert" className="rounded-xl bg-[#fbeceb] px-4 py-3 text-sm whitespace-pre-line text-danger">
          다음 파일은 올리지 못했어요:{'\n'}
          {upload.error.message}
        </p>
      )}

      {isLoading && <p className="py-3 text-sm text-muted">불러오는 중…</p>}
      {error && (
        <p role="alert" className="py-3 text-sm text-danger">
          PDF 목록을 불러오지 못했어요.
        </p>
      )}
      {files && files.length === 0 && (
        <p className="rounded-xl bg-surface px-4 py-5 text-center text-sm text-muted">
          {editable ? '도안 PDF를 올리면 뜨면서 바로 열어볼 수 있어요.' : '이 도안에는 아직 PDF가 없어요.'}
        </p>
      )}

      {files?.map((f) => (
        <div key={f.id} className="flex items-center rounded-xl bg-surface">
          <Link to={href(f)} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 py-3 pr-2 pl-3.5">
            <FileIcon />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-semibold">{f.label || f.filename}</div>
              <div className="mt-0.5 text-[13px] text-muted">
                {[f.page_count ? `${f.page_count}쪽` : null, formatBytes(f.size_bytes) || null].filter(Boolean).join(' · ')}
              </div>
            </div>
            <ChevronRightIcon width={20} height={20} className="flex-none text-muted" />
          </Link>
          {editable && (
            <button
              type="button"
              aria-label={`${f.label || f.filename} 이름 바꾸기·지우기`}
              onClick={() => setEditing(f)}
              className="flex size-11 flex-none items-center justify-center text-muted"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="5" cy="12" r="1.7" />
                <circle cx="12" cy="12" r="1.7" />
                <circle cx="19" cy="12" r="1.7" />
              </svg>
            </button>
          )}
        </div>
      ))}

      {editing && <FileSheet patternId={patternId} file={editing} onClose={() => setEditing(null)} />}
    </section>
  )
}

function FileSheet({ patternId, file, onClose }: { patternId: string; file: PatternFile; onClose: () => void }) {
  const update = useUpdatePatternFile(patternId)
  const remove = useDeletePatternFile(patternId)
  const [label, setLabel] = useState(file.label || file.filename)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!label.trim()) {
      setError('이름을 적어 주세요.')
      return
    }
    try {
      await update.mutateAsync({ id: file.id, patch: { label: label.trim() } })
      onClose()
    } catch {
      setError('저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
    }
  }

  async function onDelete() {
    if (!window.confirm('이 PDF를 지울까요? 올려 둔 파일도 함께 지워져요.')) return
    try {
      await remove.mutateAsync(file)
      onClose()
    } catch {
      setError('지우지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
    }
  }

  return (
    <Sheet title="PDF 이름 바꾸기" onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 pb-2">
        <Field label="화면에 보일 이름" htmlFor="flabel" hint={`원래 파일 이름: ${file.filename}`}>
          <input id="flabel" value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} />
        </Field>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <SheetActions
          saving={update.isPending}
          disabled={update.isPending || remove.isPending}
          onDelete={() => void onDelete()}
          deleteLabel="PDF 지우기"
        />
      </form>
    </Sheet>
  )
}
