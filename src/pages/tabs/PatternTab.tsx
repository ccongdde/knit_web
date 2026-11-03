import { Link } from 'react-router-dom'
import PatternFiles from '../../components/PatternFiles'
import SectionTitle from '../../components/SectionTitle'

/** 제작 기록 안의 "도안" 탭: 도안 PDF와 도안 메모를 함께 보여준다. (올리기·수정은 도안 화면에서 한다.) */
export default function PatternTab({
  patternId,
  makeId,
  patternNote,
}: {
  patternId: string
  makeId: string
  patternNote: string
}) {
  return (
    <div className="flex flex-col gap-6 px-5 pt-5 pb-6">
      <PatternFiles patternId={patternId} makeId={makeId} editable={false} />
      <p className="-mt-3 text-[13px] leading-normal text-muted">
        열면 단수 카운터가 PDF 위에 같이 떠요.{' '}
        <Link to={`/patterns/${patternId}`} className="font-semibold text-primary">
          도안에서 PDF 추가
        </Link>
      </p>

      <section aria-labelledby="pnote" className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <SectionTitle id="pnote">도안 메모</SectionTitle>
          <Link to={`/patterns/${patternId}/edit`} className="flex min-h-11 items-center text-[13px] font-semibold text-primary">
            도안에서 수정
          </Link>
        </div>
        <div className="rounded-xl bg-surface px-4 py-3.5 text-[15px] leading-relaxed whitespace-pre-wrap">
          {patternNote || <span className="text-muted">아직 메모가 없어요.</span>}
        </div>
        <p className="text-[13px] text-muted">같은 도안의 다른 제작 기록도 이 메모를 함께 봐요.</p>
      </section>
    </div>
  )
}
