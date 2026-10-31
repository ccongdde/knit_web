import { requireSupabase } from './supabase'

/** 백업에 담을 표들. 순서는 의존 관계를 따라 도안 → 제작 기록 → 세부 기록 순이다. */
export const BACKUP_TABLES = [
  'patterns',
  'pattern_files',
  'yarns',
  'needles',
  'makes',
  'make_yarns',
  'make_needles',
  'work_notes',
  'counters',
  'photos',
] as const

export type Backup = {
  app: 'knit-web'
  version: 1
  exported_at: string
  /** PDF와 사진 파일 자체는 담지 않고, 저장소 경로만 담는다. */
  note: string
  tables: Record<(typeof BACKUP_TABLES)[number], unknown[]>
}

export function backupFilename(date: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `뜨개기록-백업-${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}.json`
}

export function buildBackupJson(tables: Backup['tables'], now: Date = new Date()): string {
  const backup: Backup = {
    app: 'knit-web',
    version: 1,
    exported_at: now.toISOString(),
    note: 'PDF와 사진 파일은 포함되지 않아요. 경로(storage_path)만 담겨 있어요.',
    tables,
  }
  return JSON.stringify(backup, null, 2)
}

/** 모든 표를 읽어서 백업 JSON 글자를 만든다. */
export async function exportAll(): Promise<string> {
  const db = requireSupabase()
  const entries = await Promise.all(
    BACKUP_TABLES.map(async (table) => {
      // 한 번에 1000행이 한계라서 끝날 때까지 나눠서 읽는다.
      const rows: unknown[] = []
      for (let from = 0; ; from += 1000) {
        const { data, error } = await db.from(table).select('*').range(from, from + 999)
        if (error) throw error
        rows.push(...(data ?? []))
        if (!data || data.length < 1000) break
      }
      return [table, rows] as const
    }),
  )
  return buildBackupJson(Object.fromEntries(entries) as Backup['tables'])
}

export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
