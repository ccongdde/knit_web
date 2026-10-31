import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { NEEDLE_TYPES, WEIGHT_CLASSES } from '../lib/constants'
import { formatGrams, makeTitle } from '../lib/makes'
import { useDeleteNeedle, useDeleteYarn, useSaveNeedle, useSaveYarn, useYarnStock, useYarnUsage } from '../lib/queries/inventory'
import type { Needle, Yarn } from '../lib/types'
import { Field, SheetActions, inputClass, selectClass } from './Field'
import Sheet from './Sheet'

/** 재고 실을 더하거나 고치는 창. 고칠 때는 이 실을 쓴 제작 기록도 보여준다. */
export function YarnInventorySheet({ yarn, onClose }: { yarn?: Yarn; onClose: () => void }) {
  const save = useSaveYarn()
  const remove = useDeleteYarn()
  const { data: stock } = useYarnStock()
  const { data: usage } = useYarnUsage(yarn?.id)

  const [brand, setBrand] = useState(yarn?.brand ?? '')
  const [name, setName] = useState(yarn?.name ?? '')
  const [colorName, setColorName] = useState(yarn?.color_name ?? '')
  const [colorHex, setColorHex] = useState<string | null>(yarn?.color_hex ?? null)
  const [fiber, setFiber] = useState(yarn?.fiber ?? '')
  const [weight, setWeight] = useState(yarn?.weight_class ?? '')
  const [gauge, setGauge] = useState(yarn?.gauge ?? '')
  const [owned, setOwned] = useState(yarn ? String(yarn.grams_owned) : '')
  const [skeins, setSkeins] = useState(yarn?.skeins_owned != null ? String(yarn.skeins_owned) : '')
  const [note, setNote] = useState(yarn?.note ?? '')
  const [error, setError] = useState<string | null>(null)

  const left = yarn ? stock?.get(yarn.id)?.grams_left : undefined

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('실 이름을 적어 주세요.')
      return
    }
    const ownedNumber = owned.trim() === '' ? 0 : Number(owned)
    if (!Number.isFinite(ownedNumber) || ownedNumber < 0) {
      setError('가진 양은 0 이상의 숫자로 적어 주세요.')
      return
    }
    const skeinNumber = skeins.trim() === '' ? null : Number(skeins)
    if (skeinNumber !== null && (!Number.isInteger(skeinNumber) || skeinNumber < 0)) {
      setError('타래 수는 0 이상의 정수로 적어 주세요.')
      return
    }
    setError(null)
    try {
      await save.mutateAsync({
        id: yarn?.id,
        input: {
          brand: brand.trim() || null,
          name: name.trim(),
          color_name: colorName.trim() || null,
          color_hex: colorHex,
          fiber: fiber.trim() || null,
          weight_class: weight || null,
          gauge: gauge.trim() || null,
          grams_owned: ownedNumber,
          skeins_owned: skeinNumber,
          note: note.trim() || null,
        },
      })
      onClose()
    } catch {
      setError('저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
    }
  }

  async function onDelete() {
    if (!yarn) return
    if (!window.confirm('재고에서 이 실을 지울까요? 제작 기록에 적어 둔 실 정보는 그대로 남아요.')) return
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
        <Field label="실 이름" htmlFor="iname">
          <input
            id="iname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 코튼 블렌드 DK"
            className={inputClass}
          />
        </Field>

        <div className="flex gap-3">
          <Field label="브랜드" htmlFor="ibrand" className="flex-1">
            <input id="ibrand" value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass} />
          </Field>
          <Field label="색상 이름" htmlFor="icolor" className="flex-1">
            <input id="icolor" value={colorName} onChange={(e) => setColorName(e.target.value)} className={inputClass} />
          </Field>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold text-muted">색상 칩</span>
          {colorHex ? (
            <>
              <input
                type="color"
                aria-label="색상 칩 색"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="h-10 w-14 rounded-lg border-0 bg-transparent"
              />
              <button type="button" onClick={() => setColorHex(null)} className="min-h-11 text-sm text-muted">
                지우기
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setColorHex('#9db8a5')}
              className="min-h-11 text-sm font-semibold text-primary"
            >
              색 고르기
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <Field label="종류(혼용률)" htmlFor="ifiber" className="flex-1">
            <input
              id="ifiber"
              value={fiber}
              onChange={(e) => setFiber(e.target.value)}
              placeholder="예: 울 100"
              className={inputClass}
            />
          </Field>
          <Field label="굵기" htmlFor="iweight" className="flex-1">
            <select id="iweight" value={weight} onChange={(e) => setWeight(e.target.value)} className={selectClass}>
              <option value="">선택 안 함</option>
              {WEIGHT_CLASSES.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="게이지 (선택)" htmlFor="igauge">
          <input
            id="igauge"
            value={gauge}
            onChange={(e) => setGauge(e.target.value)}
            placeholder="예: 22코 × 30단 / 10cm"
            className={inputClass}
          />
        </Field>

        <div className="flex gap-3">
          <Field label="가진 양 (g)" htmlFor="iowned" className="flex-1">
            <input
              id="iowned"
              inputMode="decimal"
              value={owned}
              onChange={(e) => setOwned(e.target.value)}
              placeholder="0"
              className={inputClass}
            />
          </Field>
          <Field label="타래 수 (선택)" htmlFor="iskeins" className="flex-1">
            <input
              id="iskeins"
              inputMode="numeric"
              value={skeins}
              onChange={(e) => setSkeins(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="메모 (선택)" htmlFor="inote">
          <input id="inote" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
        </Field>

        {yarn && (
          <section aria-labelledby="usage" className="flex flex-col gap-1.5 rounded-xl bg-surface px-4 py-3.5">
            <h3 id="usage" className="text-[13px] font-semibold text-muted">
              이 실을 쓴 제작 기록
            </h3>
            {left !== undefined && (
              <p className="text-sm">
                남은 양 <b>{formatGrams(left)}</b> (가진 양 {formatGrams(yarn.grams_owned)})
              </p>
            )}
            {usage && usage.length === 0 && <p className="text-sm text-muted">아직 쓴 기록이 없어요.</p>}
            {usage?.map((u, i) =>
              u.makes ? (
                <Link
                  key={`${u.makes.id}-${i}`}
                  to={`/makes/${u.makes.id}`}
                  className="flex min-h-11 items-center justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 truncate">
                    {u.makes.patterns?.title ?? '도안'} · {makeTitle(u.makes, 0)}
                  </span>
                  <span className="flex-none font-semibold">{formatGrams(u.grams_used)}</span>
                </Link>
              ) : null,
            )}
          </section>
        )}

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <SheetActions
          saving={save.isPending}
          disabled={busy}
          onDelete={yarn ? () => void onDelete() : undefined}
          deleteLabel="재고에서 지우기"
        />
      </form>
    </Sheet>
  )
}

/** 재고 바늘을 더하거나 고치는 창 */
export function NeedleInventorySheet({ needle, onClose }: { needle?: Needle; onClose: () => void }) {
  const save = useSaveNeedle()
  const remove = useDeleteNeedle()

  const [type, setType] = useState(needle?.type ?? NEEDLE_TYPES[1])
  const [size, setSize] = useState(needle ? String(needle.size_mm) : '')
  const [length, setLength] = useState(needle?.length_cm != null ? String(needle.length_cm) : '')
  const [material, setMaterial] = useState(needle?.material ?? '')
  const [quantity, setQuantity] = useState(needle ? String(needle.quantity) : '1')
  const [note, setNote] = useState(needle?.note ?? '')
  const [error, setError] = useState<string | null>(null)

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
    const quantityNumber = Number(quantity)
    if (!Number.isInteger(quantityNumber) || quantityNumber < 0) {
      setError('개수는 0 이상의 정수로 적어 주세요.')
      return
    }
    setError(null)
    try {
      await save.mutateAsync({
        id: needle?.id,
        input: {
          type,
          size_mm: sizeNumber,
          length_cm: lengthNumber,
          material: material.trim() || null,
          quantity: quantityNumber,
          note: note.trim() || null,
        },
      })
      onClose()
    } catch {
      setError('저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
    }
  }

  async function onDelete() {
    if (!needle) return
    if (!window.confirm('재고에서 이 바늘을 지울까요? 제작 기록에 적어 둔 바늘 정보는 그대로 남아요.')) return
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
        <Field label="종류" htmlFor="itype">
          <select id="itype" value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
            {NEEDLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex gap-3">
          <Field label="호수 (mm)" htmlFor="isize" className="flex-1">
            <input
              id="isize"
              inputMode="decimal"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="예: 5.0"
              className={inputClass}
            />
          </Field>
          <Field label="길이 (cm, 선택)" htmlFor="ilength" className="flex-1">
            <input
              id="ilength"
              inputMode="numeric"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="예: 80"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="flex gap-3">
          <Field label="재질 (선택)" htmlFor="imaterial" className="flex-1">
            <input
              id="imaterial"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="예: 대나무"
              className={inputClass}
            />
          </Field>
          <Field label="개수" htmlFor="iquantity" className="flex-1">
            <input
              id="iquantity"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="메모 (선택)" htmlFor="inneedlenote">
          <input id="inneedlenote" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
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
          deleteLabel="재고에서 지우기"
        />
      </form>
    </Sheet>
  )
}
