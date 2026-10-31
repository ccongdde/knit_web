import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CounterPill } from '../components/CounterBar'
import { ChevronLeftIcon, ChevronRightIcon } from '../components/icons'
import { usePatternFile, usePdfBlob, useUpdatePatternFile } from '../lib/queries/files'
import { getWakeLockDefault, useWakeLock } from '../lib/useWakeLock'

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

const GAP = 12
const MIN_ZOOM = 0.5
const MAX_ZOOM = 3

/** 도안 PDF를 앱 안에서 직접 그려서 보여준다. (아이폰 Safari는 기본 PDF 보기가 첫 페이지만 보여줘서 쓰지 않는다.) */
export default function PdfViewer() {
  const { fileId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const makeId = params.get('make')

  const { data: file, isLoading: fileLoading } = usePatternFile(fileId)
  const { data: blob, isLoading: blobLoading, error } = usePdfBlob(file?.storage_path)
  const updateFile = useUpdatePatternFile(file?.pattern_id ?? '')

  const scrollRef = useRef<HTMLDivElement>(null)
  const [boxWidth, setBoxWidth] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [page, setPage] = useState(1)
  const [ratio, setRatio] = useState(1.414)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewHeight, setViewHeight] = useState(800)
  const [awake, setAwake] = useState(getWakeLockDefault)
  useWakeLock(awake)

  // 화면 폭에 맞춘 기본 쪽 너비
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const measure = () => {
      setBoxWidth(el.clientWidth)
      setViewHeight(el.clientHeight)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [blob])

  const pageWidth = Math.max(240, Math.min(boxWidth - 24, 900)) * zoom
  const stride = pageWidth * ratio + GAP

  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setScrollTop(el.scrollTop)
    setPage(Math.min(numPages || 1, Math.max(1, Math.floor((el.scrollTop + el.clientHeight / 3) / stride) + 1)))
  }, [numPages, stride])

  function goTo(target: number) {
    const el = scrollRef.current
    if (!el) return
    const next = Math.min(numPages, Math.max(1, target))
    el.scrollTo({ top: (next - 1) * stride, behavior: 'smooth' })
  }

  // 지금 보이는 쪽 앞뒤만 실제로 그려서 메모리를 아낀다.
  const firstVisible = Math.max(1, Math.floor(scrollTop / stride) + 1 - 1)
  const lastVisible = Math.min(numPages, Math.ceil((scrollTop + viewHeight) / stride) + 1)

  const pages = useMemo(() => Array.from({ length: numPages }, (_, i) => i + 1), [numPages])
  const title = file?.label || file?.filename || 'PDF'

  return (
    <div className="flex h-dvh flex-col bg-[#17181c] text-[#f2f3f5]">
      <header className="flex flex-none items-center gap-1.5 py-2 pr-3.5 pl-2.5">
        <button
          type="button"
          aria-label="뒤로"
          onClick={() => navigate(-1)}
          className="flex size-11 flex-none items-center justify-center"
        >
          <ChevronLeftIcon />
        </button>
        <div className="min-w-0 flex-1 truncate text-[15px] font-semibold">{title}</div>
        {numPages > 0 && (
          <div className="flex-none rounded-2xl bg-[#2a2c33] px-3 py-1.5 text-[13px] font-semibold tabular-nums">
            {page} / {numPages}
          </div>
        )}
      </header>

      <div ref={scrollRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-auto px-3 pb-40">
        {(fileLoading || blobLoading) && <p className="py-16 text-center text-sm text-[#a8acb5]">불러오는 중…</p>}
        {error && (
          <p role="alert" className="py-16 text-center text-sm text-[#ff9b8c]">
            PDF를 불러오지 못했어요. 잠시 뒤에 다시 시도해 주세요.
          </p>
        )}
        {!fileLoading && !file && <p className="py-16 text-center text-sm text-[#a8acb5]">PDF를 찾을 수 없어요.</p>}

        {blob && (
          <Document
            file={blob}
            loading={<p className="py-16 text-center text-sm text-[#a8acb5]">여는 중…</p>}
            error={<p className="py-16 text-center text-sm text-[#ff9b8c]">이 PDF는 열 수 없어요.</p>}
            onLoadSuccess={({ numPages: n }) => {
              setNumPages(n)
              if (file && file.page_count !== n) updateFile.mutate({ id: file.id, patch: { page_count: n } })
            }}
            className="flex flex-col items-center"
            // 아래 두 값은 객체를 새로 만들면 문서를 다시 읽으므로 고정한다.
            options={DOCUMENT_OPTIONS}
          >
            {pages.map((n) => (
              <div
                key={n}
                data-page={n}
                className="mb-3 flex-none bg-white"
                style={{ width: pageWidth, minHeight: pageWidth * ratio }}
              >
                {n >= firstVisible && n <= lastVisible && (
                  <Page
                    pageNumber={n}
                    width={pageWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    onLoadSuccess={(p) => {
                      if (n === 1) {
                        const v = p.getViewport({ scale: 1 })
                        setRatio(v.height / v.width)
                      }
                    }}
                  />
                )}
              </div>
            ))}
          </Document>
        )}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 flex flex-col gap-2.5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {makeId && <CounterPill makeId={makeId} />}
        <div className="pointer-events-auto flex items-center justify-between rounded-2xl bg-[#2a2c33] px-2.5 py-1.5">
          <ToolButton label="이전 쪽" onClick={() => goTo(page - 1)} disabled={page <= 1}>
            <ChevronLeftIcon />
          </ToolButton>
          <ToolButton label="다음 쪽" onClick={() => goTo(page + 1)} disabled={page >= numPages}>
            <ChevronRightIcon />
          </ToolButton>
          <span className="h-7 w-px bg-[#444851]" />
          <ToolButton label="축소" onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.25).toFixed(2)))} disabled={zoom <= MIN_ZOOM}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="6" />
              <path d="M20 20l-4-4M8.5 11h5" />
            </svg>
          </ToolButton>
          <ToolButton label="확대" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.25).toFixed(2)))} disabled={zoom >= MAX_ZOOM}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="6" />
              <path d="M20 20l-4-4M8.5 11h5M11 8.5v5" />
            </svg>
          </ToolButton>
          <span className="h-7 w-px bg-[#444851]" />
          <label className="flex min-h-12 items-center gap-1.5 px-1.5 text-[13px]">
            <input
              type="checkbox"
              role="switch"
              checked={awake}
              onChange={(e) => setAwake(e.target.checked)}
              className="size-[22px] accent-[#8fa8d8]"
            />
            화면 켜짐
          </label>
        </div>
      </div>
    </div>
  )
}

const DOCUMENT_OPTIONS = {}

function ToolButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-12 items-center justify-center rounded-full text-[#f2f3f5] disabled:opacity-35"
    >
      {children}
    </button>
  )
}
