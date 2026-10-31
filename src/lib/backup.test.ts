import { describe, expect, it } from 'vitest'
import { BACKUP_TABLES, backupFilename, buildBackupJson, type Backup } from './backup'

describe('backup', () => {
  it('파일 이름에 날짜가 들어간다', () => {
    expect(backupFilename(new Date(2025, 9, 31))).toBe('뜨개기록-백업-20251031.json')
  })

  it('백업 JSON은 표 이름과 내보낸 시각을 담는다', () => {
    const tables = Object.fromEntries(BACKUP_TABLES.map((t) => [t, []])) as unknown as Backup['tables']
    tables.patterns = [{ id: 'p1', title: '라글란 가디건' }]
    const parsed = JSON.parse(buildBackupJson(tables, new Date('2025-10-31T00:00:00Z'))) as Backup
    expect(parsed.app).toBe('knit-web')
    expect(parsed.exported_at).toBe('2025-10-31T00:00:00.000Z')
    expect(parsed.tables.patterns).toEqual([{ id: 'p1', title: '라글란 가디건' }])
    expect(Object.keys(parsed.tables)).toEqual([...BACKUP_TABLES])
  })
})
