-- ============================================================
-- LAA · Supabase 表结构（B 方案：手动跑 SQL）
--
-- 执行位置：Supabase Dashboard → SQL Editor → New query
-- 全文复制粘贴 → 点 Run
-- ============================================================

-- 1. 建 assessments 表
create table if not exists public.assessments (
  resultId              text primary key,
  mainType              text not null,
  secondaryType         text,
  sideHint              text,
  complexityHint        text,
  trainingPriorityText  text,
  createdAt             timestamptz default now(),

  -- 支付 / 开通状态字段
  thirdLayerStatus      text not null default 'unpaid'
                          check (thirdLayerStatus in ('unpaid','pending','opened','closed')),
  paidAmount            numeric default 299,
  payPlatform           text,                      -- 'wechat' / 'alipay' / 'xiaohongshu' / 'taobao'
  orderNo               text,                      -- 订单号（用户告诉老师）
  openedAt              timestamptz,               -- 老师开通时间
  remark                text,                      -- 老师备注
  updatedAt             timestamptz default now()
);

-- 2. 索引（按 resultId 查 + 按 status 列表）
create index if not exists idx_assessments_status on public.assessments(thirdLayerStatus);
create index if not exists idx_assessments_created on public.assessments(createdAt desc);

-- 3. updatedAt 自动更新触发器
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_assessments_updated_at on public.assessments;
create trigger trg_assessments_updated_at
  before update on public.assessments
  for each row execute function public.set_updated_at();

-- 4. 启用 RLS
alter table public.assessments enable row level security;

-- 5. RLS 策略
--    a) 任何人可读 assessments（前端要 GET 自己的 resultId 状态）
drop policy if exists "anyone can read assessments" on public.assessments;
create policy "anyone can read assessments"
  on public.assessments for select
  using (true);

--    b) 任何人可插入新评估（前端 v1.2 完成时 POST 自己的 resultId）
drop policy if exists "anyone can insert assessments" on public.assessments;
create policy "anyone can insert assessments"
  on public.assessments for insert
  with check (true);

--    c) 只有老师邮箱登的账号能改状态
drop policy if exists "teacher can update assessments" on public.assessments;
--    ⚠️ 重要：把 CHANGE_ME@example.com 替换成真实老师邮箱
--              当前 SQL 已使用 linlinchang313@gmail.com
create policy "teacher can update assessments"
  on public.assessments for update
  using (
    auth.email() = 'linlinchang313@gmail.com'
  )
  with check (
    auth.email() = 'linlinchang313@gmail.com'
  );

-- ============================================================
-- 跑完后验证：
--   Supabase Dashboard → Table Editor → 应该看到 public.assessments 表
--   字段：resultId, mainType, secondaryType, sideHint, complexityHint,
--         trainingPriorityText, createdAt, thirdLayerStatus, paidAmount,
--         payPlatform, orderNo, openedAt, remark, updatedAt
--
-- ⚠️ 重要：第 5c 条策略里的 email 已设为 linlinchang313@gmail.com
--    老师首次登 Supabase 用这个邮箱，魔法链接登
-- ============================================================