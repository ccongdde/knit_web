/** 긴 변이 max 를 넘지 않게 비율을 지켜 줄인 크기. 이미 작으면 그대로 둔다. */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const longest = Math.max(width, height)
  if (longest <= max) return { width, height }
  const scale = max / longest
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

/**
 * 올리기 전에 사진을 줄이고 JPEG로 바꿔 저장 공간을 아낀다.
 * 브라우저가 처리하지 못하면(예: 지원하지 않는 형식) 원본을 그대로 돌려준다.
 */
export async function prepareImage(file: File, maxEdge = 1600, quality = 0.82): Promise<{ blob: Blob; type: string; ext: string }> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const { width, height } = fitWithin(bitmap.width, bitmap.height, maxEdge)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas')
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob) throw new Error('encode')
    return { blob, type: 'image/jpeg', ext: 'jpg' }
  } catch {
    const ext = /\.(png|webp|gif|jpe?g)$/i.exec(file.name)?.[1]?.toLowerCase().replace('jpeg', 'jpg') ?? 'jpg'
    return { blob: file, type: file.type || 'image/jpeg', ext }
  }
}
