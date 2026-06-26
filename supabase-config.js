/**
 * LAA · Supabase 配置（占位符版本 B 方案）
 *
 * 怎么用：
 *   1. 用你的真实 URL 和 anon key 替换下面 2 个常量
 *   2. anon key 在 Supabase Dashboard → Settings → API → "anon public" 复制
 *   3. URL 是 Project URL（如 https://xxxxx.supabase.co）
 *
 * 安全性：
 *   - anon key 设计上就是给前端用的，公开安全
 *   - 但绝对不要用 service_role key（那个能绕过所有权限）
 *
 * 老师邮箱（RLS 用）：
 *   - 把 TEACHER_EMAIL 改成老师实际登 Supabase 用的邮箱
 *   - 不区分大小写
 */

const SUPABASE_URL = 'https://kcxijunkljhmckuazwms.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjeGlqdW5rbGpobWNrdWF6d21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NDI1ODAsImV4cCI6MjA5ODAxODU4MH0.77pE0nx_zD0S9QROf4a7YUwtDknxABQRZDvWjnPpGk8';

// 老师邮箱（用于 RLS：只有这个邮箱登的账号能改评估状态）
const TEACHER_EMAIL = 'linlinchang313@gmail.com';

// 付费金额（元）
const PAY_AMOUNT = 299;

// 评估状态常量
const STATUS_UNPAID  = 'unpaid';
const STATUS_PENDING = 'pending';
const STATUS_OPENED  = 'opened';
const STATUS_CLOSED  = 'closed';

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
}