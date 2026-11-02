export type MakeStatus = 'planned' | 'in_progress' | 'finished' | 'paused'

export const STATUS_LABEL: Record<MakeStatus, string> = {
  planned: '예정',
  in_progress: '진행 중',
  finished: '완성',
  paused: '보류',
}

// ───────────── 도안 ─────────────

/** 도안 목록에 필요한 만큼만 담은 도안 정보 (제작 기록은 상태와 대표 사진만) */
export type PatternListItem = {
  id: string
  title: string
  source: string | null
  tags: string[]
  updated_at: string
  /** 도안에 직접 정한 대표 이미지 (작은 JPEG 경로) */
  cover_path: string | null
  makes: {
    id: string
    status: MakeStatus
    updated_at?: string
    cover?: { storage_path: string; thumb_path: string | null } | null
  }[]
}

export type PatternDetail = {
  id: string
  title: string
  source: string | null
  tags: string[]
  pattern_note: string
  pattern_gauge: string | null
  cover_path: string | null
  created_at: string
  updated_at: string
}

/** 도안 만들기·고치기 폼이 보내는 값 */
export type PatternInput = {
  title: string
  source: string | null
  tags: string[]
  pattern_note: string
  pattern_gauge: string | null
}

export type PatternFile = {
  id: string
  pattern_id: string
  storage_path: string
  filename: string
  label: string | null
  size_bytes: number | null
  page_count: number | null
  sort_order: number
  created_at: string
}

// ───────────── 제작 기록 ─────────────

export type Make = {
  id: string
  pattern_id: string
  label: string | null
  status: MakeStatus
  size_made: string | null
  actual_gauge: string | null
  started_at: string | null
  finished_at: string | null
  review_note: string
  cover_photo_id: string | null
  created_at: string
  updated_at: string
}

/** 목록용: 제작 기록 + 카운터 + 실 사용량 */
export type MakeWithStats = Make & {
  counters: { label: string; value: number; target: number | null; sort_order: number }[]
  make_yarns: { grams_used: number }[]
  cover: { storage_path: string; thumb_path: string | null } | null
}

export type MakeInput = {
  label: string | null
  status: MakeStatus
  size_made: string | null
  actual_gauge: string | null
  started_at: string | null
  finished_at: string | null
  review_note: string
}

export type MakeYarn = {
  id: string
  make_id: string
  yarn_id: string | null
  brand: string | null
  name: string | null
  color: string | null
  fiber: string | null
  weight_class: string | null
  gauge: string | null
  role: string | null
  grams_used: number
  note: string | null
  sort_order: number
}

export type MakeYarnInput = Omit<MakeYarn, 'id' | 'make_id' | 'sort_order'>

export type MakeNeedle = {
  id: string
  make_id: string
  needle_id: string | null
  type: string | null
  size_mm: number | null
  length_cm: number | null
  note: string | null
  sort_order: number
}

export type MakeNeedleInput = Omit<MakeNeedle, 'id' | 'make_id' | 'sort_order'>

export type Photo = {
  id: string
  make_id: string
  note_id: string | null
  storage_path: string
  /** 목록에서 쓰는 작은 사진 (예전 사진은 없을 수 있다) */
  thumb_path: string | null
  caption: string | null
  kind: 'progress' | 'finished' | 'reference'
  taken_at: string
}

export type WorkNote = {
  id: string
  make_id: string
  title: string | null
  body: string
  row_ref: number | null
  created_at: string
}

export type Counter = {
  id: string
  make_id: string
  label: string
  value: number
  target: number | null
  sort_order: number
}

// ───────────── 재고 ─────────────

export type Yarn = {
  id: string
  brand: string | null
  name: string
  color_name: string | null
  color_hex: string | null
  fiber: string | null
  weight_class: string | null
  gauge: string | null
  grams_owned: number
  skeins_owned: number | null
  note: string | null
  created_at: string
}

export type YarnInput = Omit<Yarn, 'id' | 'created_at'>

export type Needle = {
  id: string
  type: string
  size_mm: number
  length_cm: number | null
  material: string | null
  quantity: number
  note: string | null
  created_at: string
}

export type NeedleInput = Omit<Needle, 'id' | 'created_at'>

export type YarnStock = {
  yarn_id: string
  grams_owned: number
  grams_used: number
  grams_left: number
}
