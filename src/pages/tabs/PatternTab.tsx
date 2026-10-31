export default function PatternTab({ patternId }: { patternId: string }) {
  return <p className="px-5 py-10 text-center text-sm text-muted">도안 PDF는 다음 단계에서 만들어요. ({patternId.slice(0, 4)})</p>
}
