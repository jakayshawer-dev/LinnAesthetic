-- ============================================================
-- 修复字段名（v3 - 跳过 remark 和 updatedAt 这两个全小写词）
-- ============================================================

BEGIN;

-- 13 条 rename（注意：remark 和 updatedAt 这两个字段名已经是小写，不需要 rename）
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

-- remark 和 updatedAt 不改（小写已经是想要的）

-- 触发器改成驼峰
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$ language plpgsql;

-- 清测试数据
delete from public.assessments where "resultid" like 'test%';

COMMIT;

-- 验证：列出所有列名
select column_name from information_schema.columns
  where table_schema = 'public' and table_name = 'assessments'
  order by ordinal_position;