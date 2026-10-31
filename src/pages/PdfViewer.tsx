import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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
/** 보이는 쪽 앞뒤로 미리 그려 두는 쪽 수 */
const PRELOAD_BEHIND = 1
const PRELOAD_AHEAD = 2
/** 한 쪽의 캔버스 가로 픽셀 상한. 확대해도 이 이상으로는 그리지 않아서 스크롤이 무거워지지 않는다. */
const MAX_CANVAS_PX = 1800

const DOCUMENT_OPTIONS = {}

type Viewport = { width: number; height: number }

/** 한 쪽. memo 덕분에 스크롤 중에도 그릴 필요가 바뀐 쪽만 다시 그려진다. */
const PdfPage = memo(function PdfPage({
  n,
  width,
  ratio,
  dpr,
  render,
  onFirstPage,
}: {
  n: number
  width: number
  ratio: number
  dpr: number
  render: boolean
  onFirstPage: (v: Viewport) => void
}) {
  return (
    <div
      data-page={n}
      className="mb-3 flex-none bg-white"
      style={{ width, height: width * ratio, contain: 'strict' }}
    >
      {render && (
        <Page
          pageNumber={n}
          width={width}
          devicePixelRatio={dpr}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          loading={null}
          onLoadSuccess={n === 1 ? (p) => onFirstPage(p.getViewport({ scale: 1 })) : undefined}
        />
      )}
    </div>
  )
})

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
  const [range, setRange] = useState({ first: 1, last: 3 })
  const [awake, setAwake] = useState(getWakeLockDefault)
  useWakeLock(awake)

  // 확대 단추를 연달아 눌러도 화면은 바로 반응하고, 무거운 다시 그리기는 한 박자 뒤에 한 번만 한다.
  const settledZoom = useDeferredValue(zoom)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const measure = () => setBoxWidth(el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [blob])

  const pageWidth = Math.round(Math.max(240, Math.min(boxWidth - 24, 900)) * settledZoom)
  const stride = pageWidth * ratio + GAP
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1, MAX_CANVAS_PX / Math.max(1, pageWidth)))

  // 스크롤 처리에 필요한 값은 ref로 들고 있어서 스크롤 핸들러가 매번 새로 만들어지지 않게 한다.
  const live = useRef({ stride, numPages })
  live.current = { stride, numPages }
  const raf = useRef(0)

  const update = useCallback(() => {
    const el = scrollRef.current
    const { stride: s, numPages: total } = live.current
    if (!el || total === 0) return
    const top = el.scrollTop
    const first = Math.max(1, Math.floor(top / s) + 1 - PRELOAD_BEHIND)
    const last = Math.min(total, Math.ceil((top + el.clientHeight) / s) + PRELOAD_AHEAD)
    // 값이 같으면 같은 객체를 돌려줘서 다시 그리지 않는다.
    setRange((r) => (r.first === first && r.last === last ? r : { first, last }))
    setPage(Math.min(total, Math.max(1, Math.floor((top + el.clientHeight / 3) / s) + 1)))
  }, [])

  const onScroll = useCallback(() => {
    if (raf.current) return
    raf.current = requestAnimationFrame(() => {
      raf.current = 0
      update()
    })
  }, [update])

  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  // 확대·축소나 쪽 크기가 바뀌면 보이는 범위를 다시 계산한다.
  useEffect(() => update(), [stride, numPages, update])

  function goTo(target: number) {
    const el = scrollRef.current
    if (!el) return
    const next = Math.min(numPages, Math.max(1, target))
    el.scrollTo({ top: (next - 1) * stride, behavior: 'smooth' })
  }

  const onFirstPage = useCallback((v: Viewport) => setRatio(v.height / v.width), [])

  const pages = useMemo(
    () =>
      Array.from({ length: numPages }, (_, i) => {
        const n = i + 1
        return (
          <PdfPage
            key={n}
            n={n}
            width={pageWidth}
            ratio={ratio}
            dpr={dpr}
            render={n >= range.first && n <= range.last}
            onFirstPage={onFirstPage}
          />
        )
      }),
    [numPages, pageWidth, ratio, dpr, range, onFirstPage],
  )

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

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-auto overscroll-contain px-3 pb-40"
      >
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
              setRange({ first: 1, last: Math.min(n, 1 + PRELOAD_AHEAD) })
              if (file && file.page_count !== n) updateFile.mutate({ id: file.id, patch: { page_count: n } })
            }}
            // 객체를 새로 만들면 문서를 다시 읽으므로 고정해 둔다.
            options={DOCUMENT_OPTIONS}
            className="flex flex-col items-center"
          >
            {pages}
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

function ToolButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
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
