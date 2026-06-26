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
 *   getAssessment(id)     按 resultId 查一行
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

  /** 生成 resultId（UUID v4） */
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
   * @param {object} record { resultId, mainType, secondaryType, sideHint, complexityHint, trainingPriorityText }
   * @returns {Promise<{ok: boolean, error?: string, data?: object}>}
   */
  async function saveAssessment(record) {
    try {
      const { data, error } = await client
        .from('assessments')
        .insert(record)
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
   * 按 resultId 查一行
   * @param {string} resultId
   * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
   */
  async function getAssessment(resultId) {
    try {
      const { data, error } = await client
        .from('assessments')
        .select('*')
        .eq('resultId', resultId)
        .maybeSingle();
      if (error) {
        console.error('[getAssessment] error:', error);
        return { ok: false, error: error.message };
      }
      return { ok: true, data };
    } catch (e) {
      console.error('[getAssessment] exception:', e);
      return { ok: false, error: e.message };
    }
  }

  /**
   * 老师后台：更新评估状态/订单号等
   * 注意：当前用户必须是 linlinchang313@gmail.com（RLS 限制）
   * @param {string} resultId
   * @param {object} patch { thirdLayerStatus, paidAmount, payPlatform, orderNo, remark, openedAt? }
   * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
   */
  async function updateAssessment(resultId, patch) {
    try {
      const { data, error } = await client
        .from('assessments')
        .update(patch)
        .eq('resultId', resultId)
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
   * @param {object} filter { status?: 'unpaid'|'pending'|'opened'|'closed', limit?: number, orderBy?: 'createdAt' }
   * @returns {Promise<{ok: boolean, data?: object[], error?: string}>}
   */
  async function listAssessments(filter = {}) {
    try {
      let query = client.from('assessments').select('*');
      if (filter.status) query = query.eq('thirdLayerStatus', filter.status);
      query = query.order(filter.orderBy || 'createdAt', { ascending: false });
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
   * @param {string} resultId
   * @param {function} callback (payload) => void
   * @returns {object} subscription { unsubscribe() }
   */
  function subscribeAssessment(resultId, callback) {
    return client
      .channel('assessment-' + resultId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assessments', filter: 'resultId=eq.' + resultId },
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