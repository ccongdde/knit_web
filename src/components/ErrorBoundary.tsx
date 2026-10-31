import { Component, type ErrorInfo, type ReactNode } from 'react'

/** 예상하지 못한 오류가 나도 하얀 화면 대신 안내와 다시 불러오기 버튼을 보여준다. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-bold">문제가 생겼어요</h1>
        <p className="text-sm text-muted">기록은 안전해요. 화면을 다시 불러와 주세요.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 min-h-12 rounded-xl bg-primary px-6 text-[15px] font-semibold text-white"
        >
          다시 불러오기
        </button>
      </div>
    )
  }
}
