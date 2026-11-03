import type { Needle, Yarn, YarnStock } from './types'

export type YarnSort = 'left' | 'name'

/** 이 실의 남은 양. 사용 기록이 없으면 보유량 그대로 */
export function gramsLeft(yarn: Yarn, stock: Record<string, YarnStock> | undefined): number {
  return stock?.[yarn.id]?.grams_left ?? yarn.grams_owned
}

/** 남은 양 막대 길이(0~100). 보유량이 0이면 0 */
export function leftPercent(owned: number, left: number): number {
  if (owned <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((left / owned) * 100)))
}

export function matchesYarn(yarn: Yarn, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [yarn.name, yarn.brand, yarn.color_name, yarn.fiber, yarn.weight_class]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(q)
}

export function sortYarns(yarns: Yarn[], stock: Record<string, YarnStock> | undefined, key: YarnSort): Yarn[] {
  const copy = [...yarns]
  if (key === 'name') return copy.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  return copy.sort((a, b) => gramsLeft(a, stock) - gramsLeft(b, stock) || a.name.localeCompare(b.name, 'ko'))
}

export function matchesNeedle(needle: Needle, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [needle.type, String(needle.size_mm), needle.material, needle.note]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(q)
}

/** "5.0mm 줄바늘 80cm" */
export function needleLabel(n: { size_mm: number | null; type: string | null; length_cm: number | null }): string {
  const size = n.size_mm != null ? `${Number(n.size_mm).toFixed(1)}mm` : ''
  return [size, n.type, n.length_cm ? `${n.length_cm}cm` : ''].filter(Boolean).join(' ')
}
