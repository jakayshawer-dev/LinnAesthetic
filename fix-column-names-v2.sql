-- ============================================================
-- 修复字段名：一次跑完所有 rename（用 BEGIN/COMMIT 包裹）
-- 在 Supabase Studio → SQL Editor → New query 粘贴 → Run
-- ============================================================

BEGIN;

alter table public.assessments rename column resultid             to "resultId";
alter table public.assessments rename column maintype             to "mainType";
alter table public.assessments rename column secondarytype        to "secondaryType";
alter table public.assessments rename column sidehint             to "sideHint";
alter table public.assessments rename column complexityhint       to "complexityHint";
alter table public.assessments rename column trainingprioritytext to "trainingPriorityText";
alter table public.assessments rename column createdat            to "createdAt";
alter table public.assessments rename column thirdlayerstatus     to "thirdLayerStatus";
alter table public.assessments rename column paidamount           to "paidAmount";
alter table public.assessments rename column payplatform          to "payPlatform";
alter table public.assessments rename column orderno              to "orderNo";
alter table public.assessments rename column openedat             to "openedAt";
alter table public.assessments rename column remark               to "remark";
alter table public.assessments rename column updatedat            to "updatedAt";

-- 触发器函数改成驼峰
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$ language plpgsql;

-- 清测试数据
delete from public.assessments where "resultId" like 'test%' or "resultId" like 'test-curl-%';

COMMIT;

-- 验证（在 BEGIN/COMMIT 之外另起一个 query 也行，这里能看到结果）
select column_name from information_schema.columns
  where table_schema = 'public' and table_name = 'assessments'
  order by ordinal_position;