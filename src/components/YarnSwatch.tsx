import { swatchFor } from '../lib/patternList'

/** 실 색상 원. 색 값이 있으면 그 색, 없으면 이름으로 정한 줄무늬 */
export default function YarnSwatch({
  hex,
  name,
  size = 44,
}: {
  hex?: string | null
  name: string
  size?: number
}) {
  const [main, light] = swatchFor(name || '실')
  return (
    <div
      aria-hidden="true"
      className="flex-none rounded-full border border-black/5"
      style={{
        width: size,
        height: size,
        background: hex || undefined,
        backgroundImage: hex ? undefined : `repeating-linear-gradient(0deg, ${main} 0 5px, ${light} 5px 10px)`,
      }}
    />
  )
}
