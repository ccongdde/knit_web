import { useEffect, useState } from 'react'
import { useDeletePhoto, useSetCover } from '../lib/queries/photos'
import { noteDateLabel } from '../lib/makes'
import type { Photo } from '../lib/types'
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from './icons'

/** 사진을 크게 보는 전체 화면. 대표 사진으로 정하거나 지울 수 있다. */
export default function PhotoLightbox({
  makeId,
  photos,
  urls,
  startIndex,
  coverId,
  onClose,
}: {
  makeId: string
  photos: Photo[]
  urls: Map<string, string>
  startIndex: number
  coverId: string | null
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const setCover = useSetCover(makeId)
  const remove = useDeletePhoto(makeId)
  const photo = photos[Math.min(index, photos.length - 1)]

  useEffect(() => {
    if (photos.length === 0) onClose()
  }, [photos.length, onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(photos.length - 1, i + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, photos.length])

  if (!photo) return null
  const isCover = photo.id === coverId

  return (
    <div role="dialog" aria-modal="true" aria-label="사진 크게 보기" className="fixed inset-0 z-50 flex flex-col bg-[#101114] text-[#f2f3f5]">
      <div className="flex flex-none items-center justify-between py-2 pr-3.5 pl-2.5">
        <button type="button" aria-label="닫기" onClick={onClose} className="flex size-11 items-center justify-center">
          <CloseIcon />
        </button>
        <span className="text-sm font-semibold tabular-nums">
          {index + 1} / {photos.length}
        </span>
        <button
          type="button"
          disabled={isCover || setCover.isPending}
          onClick={() => setCover.mutate(photo.id)}
          className="min-h-11 rounded-[10px] border border-[#4a4e58] px-3 text-[13px] font-semibold disabled:opacity-60"
        >
          {isCover ? '대표 사진' : '대표로 설정'}
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        {urls.get(photo.storage_path) ? (
          <img src={urls.get(photo.storage_path)} alt={photo.caption || '제작 사진'} className="max-h-full max-w-full object-contain" />
        ) : (
          <p className="text-sm text-[#a8acb5]">사진을 불러오는 중…</p>
        )}
        {index > 0 && (
          <button
            type="button"
            aria-label="이전 사진"
            onClick={() => setIndex(index - 1)}
            className="absolute left-2 flex size-11 items-center justify-center rounded-full bg-black/40"
          >
            <ChevronLeftIcon />
          </button>
        )}
        {index < photos.length - 1 && (
          <button
            type="button"
            aria-label="다음 사진"
            onClick={() => setIndex(index + 1)}
            className="absolute right-2 flex size-11 items-center justify-center rounded-full bg-black/40"
          >
            <ChevronRightIcon />
          </button>
        )}
      </div>

      <div className="flex flex-none items-center justify-between gap-3 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="min-w-0 text-[13px] text-[#a8acb5]">
          {noteDateLabel(photo.taken_at)}
          {photo.caption ? ` · ${photo.caption}` : ''}
        </div>
        <button
          type="button"
          disabled={remove.isPending}
          onClick={() => {
            if (window.confirm('이 사진을 지울까요?')) remove.mutate(photo)
          }}
          className="min-h-11 flex-none px-2 text-sm font-semibold text-[#ff9b8c] disabled:opacity-60"
        >
          사진 지우기
        </button>
      </div>
    </div>
  )
}
