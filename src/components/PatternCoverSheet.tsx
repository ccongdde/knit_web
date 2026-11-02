import { useEffect, useRef, useState } from 'react'
import { decodeImage, squareJpeg } from '../lib/image'
import { usePatternFiles } from '../lib/queries/files'
import { useSetPatternCover } from '../lib/queries/covers'
import { usePhotoUrls } from '../lib/queries/photos'
import { downloadPdfCached } from '../lib/storage'
import type { PatternDetail } from '../lib/types'
import { Field, inputClass, selectClass } from './Field'
import Sheet from './Sheet'

type Source = { drawable: CanvasImageSource & { width: number; height: number }; defaultFocus: number }

/**
 * 도안의 대표 이미지를 정하는 창.
 * 사진(JPEG, PNG, 아이폰 사진 등)을 고르거나, 올려 둔 도안 PDF의 원하는 쪽을 이미지로 만든다.
 * 어느 쪽이든 마지막에는 작은 정사각형 JPEG 하나로 저장해서, 어떤 기기에서도 열리고 목록이 가볍다.
 */
export default function PatternCoverSheet({ pattern, onClose }: { pattern: PatternDetail; onClose: () => void }) {
  const save = useSetPatternCover(pattern.id)
  const { data: files } = usePatternFiles(pattern.id)
  const { data: currentUrls } = usePhotoUrls(pattern.cover_path ? [pattern.cover_path] : [])

  const photoInput = useRef<HTMLInputElement>(null)
  const [source, setSource] = useState<Source | null>(null)
  const [focus, setFocus] = useState(0.5)
  const [preview, setPreview] = useState<{ blob: Blob; url: string } | null>(null)
  const [fileId, setFileId] = useState('')
  const [pageText, setPageText] = useState('1')
  const [numPages, setNumPages] = useState<number | null>(null)
  const [busy, setBusy] = useState<'photo' | 'pdf' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedFileId = fileId || files?.[0]?.id || ''

  // 원본이나 위치가 바뀌면 미리보기를 다시 만든다. (슬라이더를 끌 때마다 만들지 않도록 잠깐 기다린다.)
  useEffect(() => {
    if (!source) return
    let cancelled = false
    const timer = setTimeout(() => {
      squareJpeg(source.drawable, 480, focus)
        .then((blob) => {
          if (cancelled) return
          setPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev.url)
            return { blob, url: URL.createObjectURL(blob) }
          })
        })
        .catch(() => !cancelled && setError('이미지를 만들지 못했어요. 다른 사진으로 해 보세요.'))
    }, 120)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [source, focus])

  useEffect(
    () => () => {
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev.url)
        return null
      })
    },
    [],
  )

  async function pickPhoto(file: File) {
    setBusy('photo')
    setError(null)
    try {
      const bitmap = await decodeImage(file)
      setSource({ drawable: bitmap, defaultFocus: 0.5 })
      setFocus(0.5)
    } catch {
      setError('이 사진은 읽을 수 없어요. JPEG나 PNG로 다시 골라 주세요.')
    } finally {
      setBusy(null)
    }
  }

  async function loadPdfPage() {
    const file = files?.find((f) => f.id === selectedFileId)
    if (!file) return
    setBusy('pdf')
    setError(null)
    try {
      const [blob, { renderPdfPage }] = await Promise.all([downloadPdfCached(file.storage_path), import('../lib/pdfPageImage')])
      const { canvas, numPages: total, page } = await renderPdfPage(blob, Number(pageText) || 1)
      setNumPages(total)
      setPageText(String(page))
      // 세로로 긴 도안 표지는 위쪽에 사진이 있는 경우가 많아서 위쪽을 기본으로 잡는다.
      setSource({ drawable: canvas, defaultFocus: 0.2 })
      setFocus(0.2)
    } catch {
      setError('PDF의 이 쪽을 가져오지 못했어요. 잠시 뒤에 다시 해 주세요.')
    } finally {
      setBusy(null)
    }
  }

  async function onSave() {
    if (!preview) return
    setError(null)
    try {
      await save.mutateAsync({ image: preview.blob, previousPath: pattern.cover_path })
      onClose()
    } catch {
      setError('저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
    }
  }

  async function onRemove() {
    if (!window.confirm('대표 이미지를 지울까요?')) return
    try {
      await save.mutateAsync({ image: null, previousPath: pattern.cover_path })
      onClose()
    } catch {
      setError('지우지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
    }
  }

  const shownUrl = preview?.url ?? (pattern.cover_path ? currentUrls?.get(pattern.cover_path) : undefined)

  return (
    <Sheet
      title="대표 이미지"
      onClose={onClose}
      footer={
        <div className="flex items-center gap-3">
          {pattern.cover_path && (
            <button
              type="button"
              onClick={() => void onRemove()}
              disabled={save.isPending}
              className="min-h-12 px-2 text-sm font-semibold text-danger disabled:opacity-60"
            >
              지우기
            </button>
          )}
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={!preview || save.isPending}
            className="min-h-12 flex-1 rounded-xl bg-primary text-base font-semibold text-white disabled:opacity-50"
          >
            {save.isPending ? '저장 중…' : '이 이미지로 정하기'}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <div className="flex flex-col items-center gap-2">
          <div className="size-40 overflow-hidden rounded-2xl bg-surface">
            {shownUrl ? (
              <img src={shownUrl} alt="대표 이미지 미리보기" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center px-4 text-center text-[13px] text-muted">
                아직 대표 이미지가 없어요
              </div>
            )}
          </div>
          <p className="text-xs text-muted">목록에서 이 도안을 한눈에 알아보는 데 쓰여요.</p>
        </div>

        {source && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cover-focus" className="text-[13px] font-semibold text-muted">
              보이는 부분 (위 ↔ 아래)
            </label>
            <input
              id="cover-focus"
              type="range"
              min={0}
              max={100}
              value={Math.round(focus * 100)}
              onChange={(e) => setFocus(Number(e.target.value) / 100)}
              className="h-11 w-full accent-primary"
            />
          </div>
        )}

        <section aria-labelledby="cover-photo" className="flex flex-col gap-2">
          <h3 id="cover-photo" className="text-[13px] font-semibold text-muted">
            사진에서 고르기
          </h3>
          <button
            type="button"
            onClick={() => photoInput.current?.click()}
            disabled={busy !== null}
            className="min-h-12 rounded-xl border border-edge bg-white text-[15px] font-semibold disabled:opacity-60"
          >
            {busy === 'photo' ? '여는 중…' : '사진 고르기'}
          </button>
          <input
            ref={photoInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) void pickPhoto(file)
            }}
          />
        </section>

        <section aria-labelledby="cover-pdf" className="flex flex-col gap-3">
          <h3 id="cover-pdf" className="text-[13px] font-semibold text-muted">
            도안 PDF에서 가져오기
          </h3>
          {files && files.length === 0 && (
            <p className="rounded-xl bg-surface px-4 py-3 text-sm text-muted">
              먼저 도안 화면에서 PDF를 올리면 여기서 원하는 쪽을 이미지로 쓸 수 있어요.
            </p>
          )}
          {files && files.length > 0 && (
            <>
              <div className="flex gap-3">
                <Field label="PDF" htmlFor="cover-file" className="flex-[2]">
                  <select
                    id="cover-file"
                    value={selectedFileId}
                    onChange={(e) => {
                      setFileId(e.target.value)
                      setNumPages(null)
                    }}
                    className={selectClass}
                  >
                    {files.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label || f.filename}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={numPages ? `쪽 (1~${numPages})` : '쪽'} htmlFor="cover-page" className="flex-1">
                  <input
                    id="cover-page"
                    inputMode="numeric"
                    value={pageText}
                    onChange={(e) => setPageText(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
              <button
                type="button"
                onClick={() => void loadPdfPage()}
                disabled={busy !== null}
                className="min-h-12 rounded-xl border border-edge bg-white text-[15px] font-semibold disabled:opacity-60"
              >
                {busy === 'pdf' ? '가져오는 중…' : '이 쪽 가져오기'}
              </button>
            </>
          )}
        </section>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </Sheet>
  )
}
