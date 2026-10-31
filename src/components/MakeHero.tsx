import { swatchFor } from '../lib/patternList'

/** 제작 기록 맨 위의 큰 사진 영역. 사진이 없으면 뜨개 무늬 줄무늬를 보여준다. */
export default function MakeHero({ seed }: { seed: string }) {
  const [main, light] = swatchFor(seed)
  return (
    <div
      aria-hidden="true"
      className="h-[210px] w-full flex-none md:rounded-xl"
      style={{ backgroundImage: `repeating-linear-gradient(0deg, ${main} 0 14px, ${light} 14px 28px)` }}
    />
  )
}
