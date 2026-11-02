/** 긴 변이 max 를 넘지 않게 비율을 지켜 줄인 크기. 이미 작으면 그대로 둔다. */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const longest = Math.max(width, height)
  if (longest <= max) return { width, height }
  const scale = max / longest
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

/**
 * 정사각형으로 잘라 낼 영역. 짧은 변 길이만큼의 정사각형을 잡고,
 * 긴 쪽에서 어느 위치를 쓸지는 focus(0=앞쪽 끝, 0.5=가운데, 1=뒤쪽 끝)로 정한다.
 * 세로로 긴 도안 표지는 위쪽에 사진이 있는 경우가 많아서 focus 를 낮추면 위쪽이 잡힌다.
 */
export function squareCrop(width: number, height: number, focus = 0.5): { sx: number; sy: number; size: number } {
  const f = Math.max(0, Math.min(1, focus))
  const size = Math.min(width, height)
  return { sx: Math.round((width - size) * (width > height ? f : 0.5)), sy: Math.round((height - size) * (height > width ? f : 0.5)), size }
}

type Drawable = CanvasImageSource & { width: number; height: number }

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', quality),
  )
}

/** 원본에서 정사각형 영역을 잘라 size 픽셀 JPEG 로 만든다. 도안 대표 이미지와 사진 썸네일에 쓴다. */
export async function squareJpeg(source: Drawable, size = 480, focus = 0.5, quality = 0.82): Promise<Blob> {
  const crop = squareCrop(source.width, source.height, focus)
  const out = Math.min(size, crop.size) // 작은 원본을 억지로 키우지 않는다.
  const canvas = document.createElement('canvas')
  canvas.width = out
  canvas.height = out
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')
  ctx.fillStyle = '#ffffff' // 투명한 PNG가 검게 나오지 않도록
  ctx.fillRect(0, 0, out, out)
  ctx.drawImage(source, crop.sx, crop.sy, crop.size, crop.size, 0, 0, out, out)
  return toBlob(canvas, quality)
}

/** 사진 파일을 화면에서 쓸 수 있게 읽는다. (아이폰이 찍은 방향 정보도 반영한다.) */
export async function decodeImage(file: Blob): Promise<ImageBitmap> {
  return createImageBitmap(file, { imageOrientation: 'from-image' })
}

export type PreparedImage = { blob: Blob; type: string; ext: string }

/**
 * 올리기 전에 사진을 줄이고 JPEG로 바꿔 저장 공간을 아끼고, 목록용 작은 썸네일도 함께 만든다.
 * 브라우저가 읽지 못하는 형식이면 원본을 그대로 돌려주고 썸네일은 없다.
 */
export async function prepareImage(
  file: File,
  maxEdge = 1600,
  quality = 0.82,
): Promise<PreparedImage & { thumb: Blob | null }> {
  try {
    const bitmap = await decodeImage(file)
    try {
      const { width, height } = fitWithin(bitmap.width, bitmap.height, maxEdge)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('canvas')
      ctx.drawImage(bitmap, 0, 0, width, height)
      const blob = await toBlob(canvas, quality)
      const thumb = await squareJpeg(bitmap, 400, 0.5, 0.8).catch(() => null)
      return { blob, type: 'image/jpeg', ext: 'jpg', thumb }
    } finally {
      bitmap.close()
    }
  } catch {
    const ext = /\.(png|webp|gif|jpe?g)$/i.exec(file.name)?.[1]?.toLowerCase().replace('jpeg', 'jpg') ?? 'jpg'
    return { blob: file, type: file.type || 'image/jpeg', ext, thumb: null }
  }
}
