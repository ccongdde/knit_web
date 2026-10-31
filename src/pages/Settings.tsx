import { useState } from 'react'
import { backupFilename, downloadText, exportAll } from '../lib/backup'
import { useAuth } from '../lib/auth'
import { getWakeLockDefault, setWakeLockDefault } from '../lib/useWakeLock'

const installSteps = [
  'Safari로 이 주소를 열고 아래쪽 공유 버튼을 눌러요',
  '홈 화면에 추가를 고르고 추가해요',
  '홈 화면 아이콘으로 열고 처음 한 번만 다시 로그인해요',
]

export default function Settings() {
  const { session, signOut } = useAuth()
  const [wakeLock, setWakeLock] = useState(getWakeLockDefault)
  const [backingUp, setBackingUp] = useState(false)
  const [backupError, setBackupError] = useState<string | null>(null)

  async function onBackup() {
    setBackingUp(true)
    setBackupError(null)
    try {
      downloadText(backupFilename(), await exportAll())
    } catch {
      setBackupError('백업하지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
    } finally {
      setBackingUp(false)
    }
  }

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
        <p className="text-[13px] text-muted">PC는 크롬이나 엣지 주소창 오른쪽의 설치 아이콘으로 설치할 수 있어요.</p>
      </section>

      <section aria-labelledby="general" className="flex flex-col">
        <h2 id="general" className="mb-1 text-[13px] font-semibold text-muted">
          일반
        </h2>
        <label className="flex min-h-[60px] items-center justify-between gap-4 border-b border-hair">
          <span>
            <span className="block text-[15px]">PDF 화면 켜짐 유지</span>
            <span className="mt-0.5 block text-[13px] text-muted">PDF를 보는 동안 화면이 꺼지지 않아요</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={wakeLock}
            onChange={(e) => {
              setWakeLock(e.target.checked)
              setWakeLockDefault(e.target.checked)
            }}
            className="size-6 flex-none accent-primary"
          />
        </label>
        <button
          type="button"
          onClick={() => void onBackup()}
          disabled={backingUp}
          className="flex min-h-[60px] items-center justify-between gap-4 border-b border-hair text-left disabled:opacity-60"
        >
          <span>
            <span className="block text-[15px]">{backingUp ? '백업 만드는 중…' : '백업 파일 내려받기'}</span>
            <span className="mt-0.5 block text-[13px] text-muted">
              모든 기록을 JSON 파일로 저장해요 (PDF와 사진 파일은 빠져요)
            </span>
          </span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-none text-muted">
            <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
          </svg>
        </button>
        {backupError && (
          <p role="alert" className="pt-2 text-sm text-danger">
            {backupError}
          </p>
        )}
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
