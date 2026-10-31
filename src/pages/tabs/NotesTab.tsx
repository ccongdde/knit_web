export default function NotesTab({ makeId }: { makeId: string }) {
  return <p className="px-5 py-10 text-center text-sm text-muted">메모는 다음 단계에서 만들어요. ({makeId.slice(0, 4)})</p>
}
