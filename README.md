# 뜨개 기록 (knit_web)

도안별로 여러 번의 제작 기록(실, 바늘, 메모, 사진, 단수)을 남기는 개인용 웹앱이에요. 폰·아이패드·PC에서 같은 데이터를 보고, 홈 화면에 설치해 앱처럼 써요.

- 프론트: Vite + React + TypeScript + Tailwind, HashRouter, PWA
- 백엔드: Supabase (로그인, Postgres, 파일 저장소)
- 배포: GitHub Pages (`https://<계정>.github.io/knit_web/`)

## 할 수 있는 일
- **도안**: 이름·출처·태그·게이지·도안 메모, 검색·상태 필터·정렬, 도안 PDF 여러 개 올리기와 앱 안에서 보기
- **제작 기록**: 한 도안에 여러 번(a실 버전, b실 버전 …), 이전 제작에서 바늘·사이즈 복사해서 시작
- **한 번의 제작 안에서**: 사용한 실(색상·무게)과 바늘, 작업 메모 타임라인, 사진, 단수 카운터(여러 개)
- **재고**: 실·바늘 목록, 실 남은 양은 모든 제작 기록의 사용량 합산으로 자동 계산
- **설정**: 화면 켜짐 유지, 백업 JSON 내려받기, 홈 화면 설치 안내

구현 계획은 `C:\Users\kkosh\.claude\plans\radiant-waddling-pillow.md` 에 있어요.

## 처음 한 번 설정하기

### 1. Supabase 프로젝트 만들기
1. [supabase.com](https://supabase.com) 에서 프로젝트를 새로 만들어요 (무료 플랜).
2. **SQL Editor** 에 `supabase/migrations/0001_init.sql` 내용을 통째로 붙여 넣고 실행해요.
   이후 기능이 늘어날 때마다 `0002_cover_images.sql` 처럼 번호가 큰 파일을 순서대로 한 번씩 더 실행해요. (여러 번 실행해도 괜찮아요.)
3. **Authentication > Users > Add user** 로 내 계정을 만들어요 (이메일 + 비밀번호, "Auto Confirm User" 체크).
4. **Authentication > Sign In / Providers > Email** 에서 **"Allow new users to sign up"** 을 꺼요. 다른 사람이 가입하지 못하게 하려는 거예요.
5. **Project Settings > API** 에서 `Project URL` 과 `anon public` 키를 확인해요. `service_role` 키는 절대 쓰지 않아요.

### 2. 내 컴퓨터에서 실행하기
```bash
cp .env.example .env.local   # 값을 채워요
npm install
npm run dev
```

### 3. GitHub Pages로 배포하기
1. 저장소를 만들어 `main` 에 올려요 (무료 Pages는 공개 저장소가 필요해요).
2. 저장소 **Settings > Pages > Source** 를 **GitHub Actions** 로 바꿔요.
3. 저장소 **Settings > Secrets and variables > Actions > Variables** 에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 를 추가해요.
4. `main` 에 push 하면 자동으로 배포돼요. `keepalive.yml` 이 3일마다 Supabase를 깨워요.

## 명령어
| 명령 | 하는 일 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 타입 검사 + 배포용 빌드 |
| `npm test` | 단위 테스트 |
