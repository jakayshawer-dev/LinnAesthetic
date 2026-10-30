/**
 * LAA · Supabase 配置(新项目版本 - 2026-09-11 修复)
 *
 * 修复历史:
 *   - 2026-09-08:迁移到新 Supabase 项目 areakwzznuxjdmyyqujn
 *   - 2026-09-11:同步到 linnaesthetic.cn COS 部署(linn-pay 共用桶)
 *
 * 用法:
 *   - 用真实 URL + publishable key 替换下面 2 个常量
 *   - anon key 在 Supabase Dashboard → Settings → API → "anon public" 复制
 *
 * 安全性:
 *   - publishable key 设计上就是给前端用的,公开安全
 *   - 但绝对不要用 secret key(那个能绕过所有权限)
 *
 * 老师邮箱(RLS 用):
 *   - 把 TEACHER_EMAIL 改成老师实际登 Supabase 用的邮箱
 *   - 不区分大小写
 */

const SUPABASE_URL = 'https://areakwzznuxjdmyyqujn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pdeZGUVk32I7rgRmG1ISBg_KnJ9e3NC';

// 老师邮箱(用于 RLS:只有这个邮箱登的账号能改评估状态)
const TEACHER_EMAIL = 'linlinchang313@gmail.com';

// 付费金额(元)
const PAY_AMOUNT = 299;

// 评估状态常量
const STATUS_UNPAID  = 'unpaid';
const STATUS_PENDING = 'pending';
const STATUS_OPENED  = 'opened';
const STATUS_CLOSED  = 'closed';

// 魔法链接跳转地址(用户点邮件链接后回到这里)
// ⚠️ 必须和实际部署域名一致,否则链接会跳到 localhost
const EMAIL_REDIRECT_TO = 'https://www.linnaesthetic.cn/teacher.html';

// 暴露到 window
if (typeof window !== 'undefined') {
  window.SUPABASE_URL = SUPABASE_URL;
  window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
  window.TEACHER_EMAIL = TEACHER_EMAIL;
  window.PAY_AMOUNT = PAY_AMOUNT;
  window.STATUS_UNPAID = STATUS_UNPAID;
  window.STATUS_PENDING = STATUS_PENDING;
  window.STATUS_OPENED = STATUS_OPENED;
  window.STATUS_CLOSED = STATUS_CLOSED;
  window.EMAIL_REDIRECT_TO = EMAIL_REDIRECT_TO;
}
