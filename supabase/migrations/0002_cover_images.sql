-- 대표 이미지와 사진 썸네일
-- 사용법: Supabase 대시보드 > SQL Editor 에 통째로 붙여 넣고 실행해요. 여러 번 실행해도 괜찮아요.

-- 도안마다 목록에 보여줄 대표 이미지 경로 (photos 저장소 안의 작은 JPEG)
alter table patterns add column if not exists cover_path text;

-- 사진마다 작은 썸네일 경로. 목록에서는 큰 사진 대신 이것을 쓴다. 예전 사진은 비어 있어도 괜찮아요.
alter table photos add column if not exists thumb_path text;
