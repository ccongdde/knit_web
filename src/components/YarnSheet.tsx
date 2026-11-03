import { useState, type FormEvent } from 'react'
import { WEIGHT_CLASSES, YARN_ROLES } from '../lib/constants'
import { useYarns, useYarnStock } from '../lib/queries/inventory'
import { useDeleteMakeYarn, useSaveMakeYarn } from '../lib/queries/makeDetails'
import { formatGrams } from '../lib/makes'
import type { MakeYarn } from '../lib/types'
import { Field, SheetActions, inputClass, selectClass } from './Field'
import Sheet from './Sheet'

/** 제작 기록에 쓴 실을 더하거나 고치는 창. 재고에서 고르거나 직접 입력할 수 있다. */
export default function YarnSheet({
  makeId,
  yarn,
  onClose,
}: {
  makeId: string
  yarn?: MakeYarn
  onClose: () => void
}) {
  const { data: stockYarns } = useYarns()
  const { data: stock } = useYarnStock()
  const save = useSaveMakeYarn(makeId)
  const remove = useDeleteMakeYarn(makeId)

  const [yarnId, setYarnId] = useState<string | null>(yarn?.yarn_id ?? null)
  const [brand, setBrand] = useState(yarn?.brand ?? '')
  const [name, setName] = useState(yarn?.name ?? '')
  const [color, setColor] = useState(yarn?.color ?? '')
  const [fiber, setFiber] = useState(yarn?.fiber ?? '')
  const [weight, setWeight] = useState(yarn?.weight_class ?? '')
  const [gauge, setGauge] = useState(yarn?.gauge ?? '')
  const [role, setRole] = useState(yarn?.role ?? '')
  const [grams, setGrams] = useState(yarn ? String(yarn.grams_used) : '')
  const [note, setNote] = useState(yarn?.note ?? '')
  const [error, setError] = useState<string | null>(null)

  const left = yarnId ? stock?.[yarnId]?.grams_left : undefined

  function pickFromStock(id: string) {
    if (!id) {
      setYarnId(null)
      return
    }
    const s = stockYarns?.find((y) => y.id === id)
    if (!s) return
    setYarnId(s.id)
    setBrand(s.brand ?? '')
    setName(s.name)
    setColor(s.color_name ?? '')
    setFiber(s.fiber ?? '')
    setWeight(s.weight_class ?? '')
    setGauge(s.gauge ?? '')
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('실 이름을 적어 주세요.')
      return
    }
    const gramsNumber = grams.trim() === '' ? 0 : Number(grams)
    if (!Number.isFinite(gramsNumber) || gramsNumber < 0) {
      setError('사용량은 0 이상의 숫자로 적어 주세요.')
      return
    }
    setError(null)
    try {
      await save.mutateAsync({
        id: yarn?.id,
        input: {
          yarn_id: yarnId,
          brand: brand.trim() || null,
          name: name.trim(),
          color: color.trim() || null,
          fiber: fiber.trim() || null,
          weight_class: weight || null,
          gauge: gauge.trim() || null,
          role: role || null,
          grams_used: gramsNumber,
          note: note.trim() || null,
        },
      })
      onClose()
    } catch {
      setError('저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
    }
  }

  async function onDelete() {
    if (!yarn || !window.confirm('이 실을 제작 기록에서 지울까요? (재고는 그대로예요)')) return
    try {
      await remove.mutateAsync(yarn.id)
      onClose()
    } catch {
      setError('지우지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
    }
  }

  const busy = save.isPending || remove.isPending

  return (
    <Sheet title={yarn ? '실 수정' : '실 추가'} onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 pb-2">
        {stockYarns && stockYarns.length > 0 && (
          <Field label="재고에서 고르기" htmlFor="stock" hint="고르면 아래 칸이 채워지고, 재고 남은 양이 자동으로 줄어요.">
            <select
              id="stock"
              value={yarnId ?? ''}
              onChange={(e) => pickFromStock(e.target.value)}
              className={selectClass}
            >
              <option value="">직접 입력</option>
              {stockYarns.map((y) => (
                <option key={y.id} value={y.id}>
                  {[y.brand, y.name, y.color_name].filter(Boolean).join(' · ')}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="실 이름" htmlFor="yname">
          <input
            id="yname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 코튼 블렌드 DK"
            className={inputClass}
          />
        </Field>

        <div className="flex gap-3">
          <Field label="색상" htmlFor="ycolor" className="flex-1">
            <input id="ycolor" value={color} onChange={(e) => setColor(e.target.value)} className={inputClass} />
          </Field>
          <Field label="브랜드" htmlFor="ybrand" className="flex-1">
            <input id="ybrand" value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass} />
          </Field>
        </div>

        <div className="flex gap-3">
          <Field label="종류(혼용률)" htmlFor="yfiber" className="flex-1">
            <input
              id="yfiber"
              value={fiber}
              onChange={(e) => setFiber(e.target.value)}
              placeholder="예: 면 60 / 울 40"
              className={inputClass}
            />
          </Field>
          <Field label="굵기" htmlFor="yweight" className="flex-1">
            <select id="yweight" value={weight} onChange={(e) => setWeight(e.target.value)} className={selectClass}>
              <option value="">선택 안 함</option>
              {WEIGHT_CLASSES.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="게이지" htmlFor="ygauge">
          <input
            id="ygauge"
            value={gauge}
            onChange={(e) => setGauge(e.target.value)}
            placeholder="예: 22코 × 30단 / 10cm"
            className={inputClass}
          />
        </Field>

        <div className="flex gap-3">
          <Field label="쓴 양 (g)" htmlFor="ygrams" className="flex-1">
            <input
              id="ygrams"
              inputMode="decimal"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              placeholder="0"
              className={inputClass}
            />
          </Field>
          <Field label="역할" htmlFor="yrole" className="flex-1">
            <select id="yrole" value={role} onChange={(e) => setRole(e.target.value)} className={selectClass}>
              <option value="">선택 안 함</option>
              {YARN_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {left !== undefined && (
          <p className="-mt-2 text-xs text-muted">이 실의 재고는 지금 {formatGrams(left)} 남아 있어요.</p>
        )}

        <Field label="메모 (선택)" htmlFor="ynote">
          <input id="ynote" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <SheetActions
          saving={save.isPending}
          disabled={busy}
          onDelete={yarn ? () => void onDelete() : undefined}
          deleteLabel="이 실 지우기"
        />
      </form>
    </Sheet>
  )
}
