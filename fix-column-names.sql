-- ============================================================
-- 修复字段名大小写：全小写 → 驼峰
-- （与代码层一致：resultId, mainType, thirdLayerStatus 等）
--
-- 在 Supabase Studio → SQL Editor → New query 粘贴 → Run
-- ============================================================

-- 1) 重命名列（小写 → 驼峰）
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

-- 2) 触发器函数（之前引用了小写 updatedAt）— 改成驼峰
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$ language plpgsql;

-- 3) 删除测试数据（test / test1 等）— 字段名变了，这些行可能没法访问
delete from public.assessments where "resultId" like 'test%';

-- 4) 验证
select column_name from information_schema.columns
  where table_schema = 'public' and table_name = 'assessments'
  order by ordinal_position;

-- 期望看到：resultId, mainType, secondaryType, sideHint, complexityHint,
--          trainingPriorityText, createdAt, thirdLayerStatus, paidAmount,
--          payPlatform, orderNo, openedAt, remark, updatedAt