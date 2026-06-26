BEGIN;

-- 12 条 rename（跳过 remark 和 updatedat，它们已经是小写）
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

-- 触发器改成驼峰
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$ language plpgsql;

delete from public.assessments where resultid like 'test%';

COMMIT;

select column_name from information_schema.columns
  where table_schema = 'public' and table_name = 'assessments'
  order by ordinal_position;