import { Component, type ErrorInfo, type ReactNode } from 'react'
import { PERSIST_KEY } from '../lib/queryClient'

/**
 * 예상하지 못한 오류가 나도 하얀 화면 대신 안내와 다시 불러오기 버튼을 보여준다.
 * 버튼은 기기에 저장해 둔 화면 기록도 함께 지우고 다시 불러온다. 저장된 기록이 오류의 원인이어도 스스로 낫게 하려는 것이다.
 * (기록은 서버에 있어서 지워지지 않고, 다시 받아 온다.)
 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  private reload = () => {
    try {
      window.localStorage.removeItem(PERSIST_KEY)
    } catch {
      // 저장소를 못 쓰는 환경이면 그냥 다시 불러온다.
    }
    window.location.reload()
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-bold">문제가 생겼어요</h1>
        <p className="text-sm text-muted">기록은 안전해요. 화면을 다시 불러와 주세요.</p>
        <button
          type="button"
          onClick={this.reload}
          className="mt-2 min-h-12 rounded-xl bg-primary px-6 text-[15px] font-semibold text-white"
        >
          다시 불러오기
        </button>
      </div>
    )
  }
}
