export type TabItem<K extends string> = { key: K; label: string }

export default function TabBar<K extends string>({
  tabs,
  active,
  onChange,
  label,
}: {
  tabs: TabItem<K>[]
  active: K
  onChange: (key: K) => void
  label: string
}) {
  return (
    <div role="tablist" aria-label={label} className="flex border-b border-line">
      {tabs.map(({ key, label: text }) => {
        const selected = key === active
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(key)}
            className={[
              'min-h-12 flex-1 border-b-2 text-[15px]',
              selected ? 'border-primary font-bold text-ink' : 'border-transparent font-medium text-muted',
            ].join(' ')}
          >
            {text}
          </button>
        )
      })}
    </div>
  )
}
