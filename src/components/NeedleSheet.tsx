import { useState, type FormEvent } from 'react'
import { NEEDLE_TYPES } from '../lib/constants'
import { useNeedles } from '../lib/queries/inventory'
import { useDeleteMakeNeedle, useSaveMakeNeedle } from '../lib/queries/makeDetails'
import type { MakeNeedle } from '../lib/types'
import { Field, SheetActions, inputClass, selectClass } from './Field'
import Sheet from './Sheet'

/** 제작 기록에 쓴 바늘을 더하거나 고치는 창 */
export default function NeedleSheet({
  makeId,
  needle,
  onClose,
}: {
  makeId: string
  needle?: MakeNeedle
  onClose: () => void
}) {
  const { data: stockNeedles } = useNeedles()
  const save = useSaveMakeNeedle(makeId)
  const remove = useDeleteMakeNeedle(makeId)

  const [needleId, setNeedleId] = useState<string | null>(needle?.needle_id ?? null)
  const [type, setType] = useState(needle?.type ?? NEEDLE_TYPES[1])
  const [size, setSize] = useState(needle?.size_mm != null ? String(needle.size_mm) : '')
  const [length, setLength] = useState(needle?.length_cm != null ? String(needle.length_cm) : '')
  const [note, setNote] = useState(needle?.note ?? '')
  const [error, setError] = useState<string | null>(null)

  function pickFromStock(id: string) {
    if (!id) {
      setNeedleId(null)
      return
    }
    const s = stockNeedles?.find((n) => n.id === id)
    if (!s) return
    setNeedleId(s.id)
    setType(s.type)
    setSize(String(s.size_mm))
    setLength(s.length_cm != null ? String(s.length_cm) : '')
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const sizeNumber = Number(size)
    if (!size.trim() || !Number.isFinite(sizeNumber) || sizeNumber <= 0) {
      setError('바늘 호수(mm)를 숫자로 적어 주세요.')
      return
    }
    const lengthNumber = length.trim() === '' ? null : Number(length)
    if (lengthNumber !== null && (!Number.isFinite(lengthNumber) || lengthNumber <= 0)) {
      setError('길이는 숫자로 적어 주세요.')
      return
    }
    setError(null)
    try {
      await save.mutateAsync({
        id: needle?.id,
        input: {
          needle_id: needleId,
          type,
          size_mm: sizeNumber,
          length_cm: lengthNumber,
          note: note.trim() || null,
        },
      })
      onClose()
    } catch {
      setError('저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
    }
  }

  async function onDelete() {
    if (!needle || !window.confirm('이 바늘을 제작 기록에서 지울까요?')) return
    try {
      await remove.mutateAsync(needle.id)
      onClose()
    } catch {
      setError('지우지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
    }
  }

  const busy = save.isPending || remove.isPending

  return (
    <Sheet title={needle ? '바늘 수정' : '바늘 추가'} onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 pb-2">
        {stockNeedles && stockNeedles.length > 0 && (
          <Field label="재고에서 고르기" htmlFor="nstock">
            <select
              id="nstock"
              value={needleId ?? ''}
              onChange={(e) => pickFromStock(e.target.value)}
              className={selectClass}
            >
              <option value="">직접 입력</option>
              {stockNeedles.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.size_mm}mm {n.type}
                  {n.length_cm ? ` ${n.length_cm}cm` : ''}
                  {n.material ? ` · ${n.material}` : ''}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="종류" htmlFor="ntype">
          <select id="ntype" value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
            {NEEDLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex gap-3">
          <Field label="호수 (mm)" htmlFor="nsize" className="flex-1">
            <input
              id="nsize"
              inputMode="decimal"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="예: 5.0"
              className={inputClass}
            />
          </Field>
          <Field label="길이 (cm, 선택)" htmlFor="nlength" className="flex-1">
            <input
              id="nlength"
              inputMode="numeric"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="예: 80"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="쓴 곳 (선택)" htmlFor="nnote">
          <input
            id="nnote"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예: 몸판, 소매 끝"
            className={inputClass}
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <SheetActions
          saving={save.isPending}
          disabled={busy}
          onDelete={needle ? () => void onDelete() : undefined}
          deleteLabel="이 바늘 지우기"
        />
      </form>
    </Sheet>
  )
}
