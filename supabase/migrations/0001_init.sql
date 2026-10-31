-- 뜨개 기록: 초기 스키마
-- 사용법: Supabase 대시보드 > SQL Editor 에 통째로 붙여 넣고 실행해요.
-- 모든 표는 user_id 로 주인을 가리고, RLS(행 단위 접근 제한)로 내 데이터만 읽고 쓸 수 있어요.

create type make_status as enum ('planned', 'in_progress', 'finished', 'paused');
create type photo_kind as enum ('progress', 'finished', 'reference');

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ───────────── 도안 ─────────────
create table patterns (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title        text not null,
  source       text,                              -- 디자이너·출처
  pattern_note text not null default '',          -- 도안 메모 (모든 제작 기록이 공유)
  tags         text[] not null default '{}',
  pattern_gauge text,                             -- 도안에 적힌 게이지
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 도안 PDF: 한 도안에 여러 개를 올릴 수 있다 (본 도안, 사이즈표, 정오표 …)
create table pattern_files (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pattern_id   uuid not null references patterns (id) on delete cascade,
  storage_path text not null,
  filename     text not null,
  label        text,                              -- 화면에 보여줄 이름 (비면 filename)
  size_bytes   bigint,
  page_count   int,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

-- ───────────── 재고 ─────────────
create table yarns (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  brand        text,
  name         text not null,
  color_name   text,
  color_hex    text,
  fiber        text,
  weight_class text,
  gauge        text,
  grams_owned  numeric(9, 1) not null default 0,
  skeins_owned int,
  note         text,
  photo_path   text,
  created_at   timestamptz not null default now()
);

create table needles (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type      text not null,                        -- 대바늘 / 줄바늘 / 장갑바늘 / 코바늘
  size_mm   numeric(4, 1) not null,
  length_cm int,
  material  text,
  quantity  int not null default 1,
  note      text,
  created_at timestamptz not null default now()
);

-- ───────────── 제작 기록 (도안 1 : 제작 기록 N) ─────────────
create table makes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pattern_id     uuid not null references patterns (id) on delete cascade,
  label          text,                            -- 예: "b실 버전" (비면 "N회차"로 표시)
  status         make_status not null default 'planned',
  size_made      text,
  actual_gauge   text,                            -- 내 게이지
  started_at     date,
  finished_at    date,
  review_note    text not null default '',        -- 완성 후기
  cover_photo_id uuid,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table make_yarns (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  make_id      uuid not null references makes (id) on delete cascade,
  yarn_id      uuid references yarns (id) on delete set null,   -- 재고와 연결 (없으면 직접 입력)
  -- 직접 입력용 스냅샷. 재고에서 지워도 기록이 남도록 값을 복사해 둔다.
  brand        text,
  name         text,
  color        text,
  fiber        text,
  weight_class text,
  gauge        text,
  role         text,                              -- 메인 / 배색
  grams_used   numeric(9, 1) not null default 0,
  note         text,
  sort_order   int not null default 0
);

create table make_needles (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  make_id   uuid not null references makes (id) on delete cascade,
  needle_id uuid references needles (id) on delete set null,
  type      text,
  size_mm   numeric(4, 1),
  length_cm int,
  note      text,
  sort_order int not null default 0
);

create table work_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  make_id    uuid not null references makes (id) on delete cascade,
  title      text,
  body       text not null default '',
  row_ref    int,                                 -- 기록할 때의 단수
  created_at timestamptz not null default now()
);

create table counters (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  make_id    uuid not null references makes (id) on delete cascade,
  label      text not null default '단수',
  value      int not null default 0,
  target     int,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  make_id      uuid not null references makes (id) on delete cascade,
  note_id      uuid references work_notes (id) on delete set null,   -- 메모에 붙은 사진
  storage_path text not null,
  caption      text,
  kind         photo_kind not null default 'progress',
  taken_at     timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

alter table makes
  add constraint makes_cover_photo_fk
  foreign key (cover_photo_id) references photos (id) on delete set null;

-- ───────────── 인덱스 ─────────────
create index on patterns (user_id, updated_at desc);
create index on pattern_files (pattern_id, sort_order);
create index on makes (pattern_id);
create index on make_yarns (make_id);
create index on make_yarns (yarn_id);
create index on make_needles (make_id);
create index on work_notes (make_id, created_at desc);
create index on counters (make_id, sort_order);
create index on photos (make_id, taken_at desc);

-- ───────────── updated_at 자동 갱신 ─────────────
create trigger patterns_updated before update on patterns for each row execute function set_updated_at();
create trigger makes_updated    before update on makes    for each row execute function set_updated_at();
create trigger counters_updated before update on counters for each row execute function set_updated_at();

-- ───────────── 재고 남은 양 (저장하지 않고 계산) ─────────────
-- 남은 양 = 보유량 − 모든 제작 기록의 사용량 합계. 제작 기록을 고치거나 지워도 어긋나지 않는다.
create view yarn_stock with (security_invoker = true) as
select
  y.id as yarn_id,
  y.grams_owned,
  coalesce(sum(m.grams_used), 0) as grams_used,
  y.grams_owned - coalesce(sum(m.grams_used), 0) as grams_left
from yarns y
left join make_yarns m on m.yarn_id = y.id
group by y.id;

-- ───────────── RLS: 내 행만 ─────────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'patterns', 'pattern_files', 'yarns', 'needles', 'makes',
    'make_yarns', 'make_needles', 'work_notes', 'counters', 'photos'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "own rows" on %I for all to authenticated
         using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end;
$$;

-- ───────────── 파일 저장소 (PDF, 사진) ─────────────
-- 비공개 버킷. 경로의 첫 폴더가 내 user_id 일 때만 접근할 수 있다. 예: pdfs/<user_id>/<파일>
insert into storage.buckets (id, name, public)
values ('pdfs', 'pdfs', false), ('photos', 'photos', false)
on conflict (id) do nothing;

create policy "own files read" on storage.objects for select to authenticated
  using (bucket_id in ('pdfs', 'photos') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files insert" on storage.objects for insert to authenticated
  with check (bucket_id in ('pdfs', 'photos') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files update" on storage.objects for update to authenticated
  using (bucket_id in ('pdfs', 'photos') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files delete" on storage.objects for delete to authenticated
  using (bucket_id in ('pdfs', 'photos') and (storage.foldername(name))[1] = auth.uid()::text);
