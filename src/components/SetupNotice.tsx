/** .env.local 에 Supabase 설정이 없을 때 보여주는 안내 */
export default function SetupNotice() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-3 p-6">
      <h1 className="text-2xl font-bold">연결 설정이 필요해요</h1>
      <p className="text-[15px] leading-relaxed text-muted">
        Supabase 주소와 공개 키가 아직 없어요. 프로젝트 폴더의 <code>.env.example</code> 을{' '}
        <code>.env.local</code> 로 복사하고 값을 채운 뒤 다시 실행해 주세요. 자세한 순서는{' '}
        <code>README.md</code> 에 있어요.
      </p>
    </div>
  )
}
