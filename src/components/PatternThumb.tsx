import { swatchFor } from '../lib/patternList'

/** 사진이 없을 때 뜨개 무늬 줄무늬로 대신 보여주는 썸네일 */
export default function PatternThumb({ title, size = 52 }: { title: string; size?: number }) {
  const [main, light] = swatchFor(title)
  return (
    <div
      aria-hidden="true"
      className="flex-none rounded-lg"
      style={{
        width: size,
        height: size,
        backgroundImage: `repeating-linear-gradient(0deg, ${main} 0 7px, ${light} 7px 14px)`,
      }}
    />
  )
}
