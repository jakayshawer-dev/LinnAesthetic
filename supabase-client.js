/**
 * LAA · Supabase 客户端（共享工具）
 *
 * 加载顺序（HTML）：
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="supabase-config.js"></script>
 *   <script src="supabase-client.js"></script>
 *
 * 暴露 API（window.laaSupabase）：
 *   client                Supabase 客户端实例
 *   generateResultId()    生成 UUID（用 crypto.randomUUID）
 *   saveAssessment(r)     写一行评估到 Supabase
 *   getAssessment(id)     按 resultid 查一行
 *   updateAssessment(id, patch)  老师后台用：改状态/订单号等
 *   listAssessments(filter)      老师后台用：列出评估
 *   subscribeAssessment(id, cb)  实时订阅一行变化
 */

(function () {
  'use strict';

  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    console.error('[supabase-client] SUPABASE_URL 或 ANON_KEY 未配置');
  }

  // 初始化 Supabase 客户端
  // supabase-js v2 通过 CDN 全局变量暴露 window.supabase
  const supabaseLib = window.supabase;
  if (!supabaseLib || typeof supabaseLib.createClient !== 'function') {
    console.error('[supabase-client] supabase-js 未加载，请检查 <script src="...@supabase/supabase-js@2">');
    return;
  }

  const client = supabaseLib.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY,
    {
      auth: { persistSession: true, autoRefreshToken: true },
    }
  );

  // ============================================================
  // 工具
  // ============================================================

  /** 生成 resultid（UUID v4） */
  function generateResultId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // 兜底：老浏览器用 Math.random 拼一个
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // ============================================================
  // 评估记录 CRUD
  // ============================================================

  /**
   * 写一行评估记录到 Supabase
   * @param {object} record { resultid, maintype, secondarytype, sidehint, complexityhint, trainingprioritytext }
   * @returns {Promise<{ok: boolean, error?: string, data?: object}>}
   */
  async function saveAssessment(record) {
    try {
      const { data, error } = await client
        .from('assessments')
        .upsert(record, { onConflict: 'resultid' })
        .select()
        .single();
      if (error) {
        console.error('[saveAssessment] error:', error);
        return { ok: false, error: error.message };
      }
      return { ok: true, data };
    } catch (e) {
      console.error('[saveAssessment] exception:', e);
      return { ok: false, error: e.message };
    }
  }

  /**
   * 按 resultid 查一行
   *
   * 抗抖动设计(2026-10-30):
   *   国内手机直连 Supabase 实测 2-4 秒,偶发 10 秒+,supabase-js 默认无超时
   *   → 一次网络抖动就整页失败,客户看到「评估记录未找到」(假的)
   *   修复三层:
   *   1) REST 直连 fetch(不用 supabase-js 的 query builder,少一层不确定性)
   *   2) 单次请求 8 秒超时(AbortController)
   *   3) 失败重试 2 次,退避 0.8s / 2s
   *   4) REST 直连也失败时,再回落到 supabase-js
   *
   * @param {string} resultid
   * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
   */
  const FETCH_TIMEOUT_MS = 8000;
  const FETCH_RETRIES = 2;

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  /**
   * REST 直连兜底:不经过 supabase-js
   * @returns {Promise<{ok: boolean, data?: object|null, error?: string}>}
   */
  async function getAssessmentViaRest(resultid) {
    const base = window.SUPABASE_URL;
    const key = window.SUPABASE_ANON_KEY;
    if (!base || !key) {
      return { ok: false, error: 'Supabase 配置缺失' };
    }
    const url = base.replace(/\/+$/, '') + '/rest/v1/assessments'
      + '?resultid=eq.' + encodeURIComponent(resultid)
      + '&select=*';
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
      const resp = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': key,
          'Authorization': 'Bearer ' + key,
          'Accept': 'application/json',
        },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!resp.ok) {
        return { ok: false, error: '查询失败(HTTP ' + resp.status + ')' };
      }
      const rows = await resp.json();
      if (!Array.isArray(rows) || rows.length === 0) {
        // 请求成功但没数据 = 记录真的不存在
        return { ok: true, data: null };
      }
      return { ok: true, data: rows[0] };
    } catch (e) {
      const msg = (e && e.name === 'AbortError')
        ? '网络超时(' + FETCH_TIMEOUT_MS + 'ms)'
        : ('网络异常: ' + (e && e.message ? e.message : String(e)));
      return { ok: false, error: msg };
    }
  }

  async function getAssessment(resultid) {
    // 第一层:REST 直连 + 重试(最快的路径,且不依赖 SDK)
    let lastErr = null;
    for (let attempt = 0; attempt <= FETCH_RETRIES; attempt++) {
      const res = await getAssessmentViaRest(resultid);
      if (res.ok) return res;
      lastErr = res.error;
      if (attempt < FETCH_RETRIES) {
        await sleep(attempt === 0 ? 800 : 2000);
      }
    }
    // 第二层:回落 supabase-js
    try {
      const { data, error } = await client
        .from('assessments')
        .select('*')
        .eq('resultid', resultid)
        .maybeSingle();
      if (error) {
        console.error('[getAssessment] error:', error);
        return { ok: false, error: lastErr || error.message };
      }
      return { ok: true, data };
    } catch (e) {
      console.error('[getAssessment] exception:', e);
      return { ok: false, error: lastErr || (e && e.message ? e.message : String(e)) };
    }
  }

  /**
   * 老师后台：更新评估状态/订单号等
   * 注意：当前用户必须是 linlinchang313@gmail.com（RLS 限制）
   * @param {string} resultid
   * @param {object} patch { thirdlayerstatus, paidamount, payplatform, orderno, remark, openedat? }
   * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
   */
  async function updateAssessment(resultid, patch) {
    try {
      const { data, error } = await client
        .from('assessments')
        .update(patch)
        .eq('resultid', resultid)
        .select()
        .single();
      if (error) {
        console.error('[updateAssessment] error:', error);
        return { ok: false, error: error.message };
      }
      return { ok: true, data };
    } catch (e) {
      console.error('[updateAssessment] exception:', e);
      return { ok: false, error: e.message };
    }
  }

  /**
   * 老师后台：列出评估（可选过滤）
   * @param {object} filter { status?: 'unpaid'|'pending'|'opened'|'closed', limit?: number, orderBy?: 'createdat' }
   * @returns {Promise<{ok: boolean, data?: object[], error?: string}>}
   */
  async function listAssessments(filter = {}) {
    try {
      let query = client.from('assessments').select('*');
      if (filter.status) query = query.eq('thirdlayerstatus', filter.status);
      query = query.order(filter.orderBy || 'createdat', { ascending: false });
      if (filter.limit) query = query.limit(filter.limit);
      const { data, error } = await query;
      if (error) {
        console.error('[listAssessments] error:', error);
        return { ok: false, error: error.message };
      }
      return { ok: true, data: data || [] };
    } catch (e) {
      console.error('[listAssessments] exception:', e);
      return { ok: false, error: e.message };
    }
  }

  /**
   * 实时订阅一行评估的变化
   * 用户在前端 pay.html "我已付款"按钮 → 老师后台改状态 → 用户页面自动刷新
   * @param {string} resultid
   * @param {function} callback (payload) => void
   * @returns {object} subscription { unsubscribe() }
   */
  function subscribeAssessment(resultid, callback) {
    return client
      .channel('assessment-' + resultid)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assessments', filter: 'resultid=eq.' + resultid },
        callback
      )
      .subscribe();
  }

  /**
   * 老师登入（用于 teacher.html 后台）
   * @param {string} email
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  async function teacherSignIn(email) {
    try {
      const { error } = await client.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: window.EMAIL_REDIRECT_TO || (window.location.origin + '/teacher.html'),
        },
      });
      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  /**
   * 老师登出
   */
  async function teacherSignOut() {
    return client.auth.signOut();
  }

  /**
   * 取当前登入的 user
   */
  async function getCurrentTeacher() {
    const { data } = await client.auth.getUser();
    return data && data.user;
  }

  // 暴露到 window
  window.laaSupabase = {
    client,
    generateResultId,
    saveAssessment,
    getAssessment,
    updateAssessment,
    listAssessments,
    subscribeAssessment,
    teacherSignIn,
    teacherSignOut,
    getCurrentTeacher,
  };
})();