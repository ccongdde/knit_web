import { useAuth } from '../lib/auth'

const installSteps = [
  'Safari로 이 주소를 열고 아래쪽 공유 버튼을 눌러요',
  '홈 화면에 추가를 고르고 추가해요',
  '홈 화면 아이콘으로 열고 처음 한 번만 다시 로그인해요',
]

export default function Settings() {
  const { session, signOut } = useAuth()

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 pt-6 pb-8">
      <h1 className="text-2xl font-bold">설정</h1>

      <section aria-labelledby="install" className="flex flex-col gap-2.5">
        <h2 id="install" className="text-[13px] font-semibold text-muted">
          앱처럼 설치하기 (아이폰 · 아이패드)
        </h2>
        <ol className="flex flex-col gap-3 rounded-xl bg-surface p-4">
          {installSteps.map((text, i) => (
            <li key={text} className="flex items-start gap-3 text-[15px] leading-normal">
              <span className="flex size-6 flex-none items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white">
                {i + 1}
              </span>
              {text}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="account" className="flex flex-col gap-2.5">
        <h2 id="account" className="text-[13px] font-semibold text-muted">
          계정
        </h2>
        <p className="text-[15px]">{session?.user.email}</p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="min-h-[50px] rounded-xl border border-edge bg-white text-[15px] font-semibold"
        >
          로그아웃
        </button>
      </section>
    </div>
  )
}
