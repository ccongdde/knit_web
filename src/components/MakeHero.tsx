import { useRef, useState } from 'react'
import { swatchFor } from '../lib/patternList'
import { usePhotoUrls, useUploadPhotos } from '../lib/queries/photos'
import type { Photo } from '../lib/types'
import PhotoLightbox from './PhotoLightbox'

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}

/**
 * 제작 기록 맨 위의 큰 사진 영역. 옆으로 넘기며 사진을 보고, 누르면 크게 열린다.
 * 사진이 없으면 뜨개 무늬 줄무늬를 보여주고, 카메라 버튼으로 바로 올릴 수 있다.
 */
export default function MakeHero({
  makeId,
  seed,
  photos,
  coverId,
}: {
  makeId: string
  seed: string
  photos: Photo[]
  coverId: string | null
}) {
  const upload = useUploadPhotos(makeId)
  const inputRef = useRef<HTMLInputElement>(null)
  const [current, setCurrent] = useState(0)
  const [viewer, setViewer] = useState<number | null>(null)

  // 대표 사진을 맨 앞에 둔다.
  const ordered = [...photos].sort((a, b) => Number(b.id === coverId) - Number(a.id === coverId))
  const { data: urls } = usePhotoUrls(ordered.map((p) => p.storage_path))
  const [main, light] = swatchFor(seed)

  return (
    <div className="relative h-[210px] w-full flex-none overflow-hidden md:rounded-xl">
      {ordered.length === 0 ? (
        <div
          aria-hidden="true"
          className="h-full w-full"
          style={{ backgroundImage: `repeating-linear-gradient(0deg, ${main} 0 14px, ${light} 14px 28px)` }}
        />
      ) : (
        <div
          className="flex h-full snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => {
            const el = e.currentTarget
            setCurrent(Math.round(el.scrollLeft / el.clientWidth))
          }}
        >
          {ordered.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-label={`사진 ${i + 1} 크게 보기`}
              onClick={() => setViewer(i)}
              className="h-full w-full flex-none snap-center bg-surface"
            >
              {urls?.[p.storage_path] && (
                <img src={urls[p.storage_path]} alt={p.caption || ''} className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="absolute right-3.5 bottom-3 flex items-center gap-2">
        <button
          type="button"
          aria-label="사진 추가"
          disabled={upload.isPending}
          onClick={() => inputRef.current?.click()}
          className="flex size-11 items-center justify-center rounded-full bg-[rgba(27,28,32,.62)] text-white disabled:opacity-60"
        >
          <CameraIcon />
        </button>
        {ordered.length > 0 && (
          <span className="rounded-full bg-[rgba(27,28,32,.62)] px-3.5 py-2 text-[13px] font-semibold text-white tabular-nums">
            {Math.min(current, ordered.length - 1) + 1} / {ordered.length}
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const picked = [...(e.target.files ?? [])]
          e.target.value = ''
          if (picked.length > 0) upload.mutate({ files: picked })
        }}
      />
      {upload.isError && (
        <p role="alert" className="absolute inset-x-3 top-3 rounded-lg bg-[#fbeceb] px-3 py-2 text-xs text-danger">
          올리지 못한 사진이 있어요: {upload.error.message}
        </p>
      )}
      {upload.isPending && (
        <p className="absolute top-3 left-3 rounded-full bg-[rgba(27,28,32,.62)] px-3 py-1.5 text-xs text-white">올리는 중…</p>
      )}

      {viewer !== null && urls && (
        <PhotoLightbox
          makeId={makeId}
          photos={ordered}
          urls={urls}
          startIndex={viewer}
          coverId={coverId}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  )
}
