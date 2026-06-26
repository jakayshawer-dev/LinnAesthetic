/**
 * LAA 第三层 v0.1｜预览原型 — 应用主逻辑（修复版）
 *
 * 4 个页面（SPA，hash 路由）：
 *   #/entry         入口选择（4 个参数）
 *   #/intro         总体训练计划说明
 *   #/overview      14 天计划总览
 *   #/day/N         Day N 训练页
 *
 * 记录卡（嵌入 Day 1 / Day 7 / Day 14 内）
 *
 * localStorage key: laa_layer3_v01_preview（与 v1.2 命名空间完全隔离）
 *
 * v0.1.4：纯 v1.2 对接模式
 *   - 删除手动选择 4 个参数入口
 *   - 入口只从 v1.2 payload 读参数
 *   - 无 v1.2 payload 时显示引导：去第二层完成评估
 *
 * 修复记录：
 *   v0.1.1: 记录卡照片位 <div> → <button>，避免点击后焦点跳动
 *   v0.1.2: 改用 <label> 包裹 file input（解决 iOS Safari 文件选择器无法触发）
 *   v0.1.3: 接入第二层 v1.2（双模式入口）
 *   v0.1.4: 删手动选择 4 个参数入口，纯 v1.2 对接模式
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'laa_layer3_v01_preview';
  const STORAGE_VERSION = 'v0.1.5';

  // v1.2 第二层输出 keys
  // payload_v12: 题目答案（questions 页写，result 页读）
  // result_v12:  引擎输出（result 页写，含 mainType/secondaryType/sideHint/complexityHint）
  const V12_PAYLOAD_KEY = 'laa_second_layer_payload_v12';
  const V12_RESULT_KEY  = 'laa_second_layer_result_v12';

  // ============================================================
  // 状态管理
  // ============================================================

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      if (parsed.__v !== STORAGE_VERSION) {
        // 旧版本数据清掉重来（避免字段不兼容）
        return defaultState();
      }
      return parsed;
    } catch (e) {
      return defaultState();
    }
  }

  function saveState(s) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch (e) { /* ignore */ }
  }

  function defaultState() {
    return {
      __v: STORAGE_VERSION,
      params: null,
      plan: null,
      dayData: {},
    };
  }

  function setState(patch) {
    const s = { ...loadState(), ...patch };
    saveState(s);
    return s;
  }

  // ============================================================
  // v1.2 接入：从第二层 localStorage 读 payload
  // ============================================================

  /**
   * 尝试从 v1.2 读 4 个参数
   *
   * 优先读 laa_second_layer_result_v12（引擎输出，已计算好 mainType 等）
   * 兜底读 laa_second_layer_payload_v12（题目答案，但不一定有 mainType）
   *
   * @returns {object|null} 4 个参数的对象；解析失败返回 null
   */
  function readV12Params() {
    try {
      // 1) 优先：result_v12（引擎输出，结构固定）
      const resultRaw = localStorage.getItem(V12_RESULT_KEY);
      if (resultRaw) {
        const r = JSON.parse(resultRaw);
        // 引擎输出字段（v1.2 spec）：mainType, secondaryType, sideHint, complexityHint
        if (r && r.mainType && /T[1-5]/.test(r.mainType)) {
          return {
            mainType: r.mainType,
            secondaryType: r.secondaryType || null,
            sideHint: r.sideHint || 'unclear',
            complexityHint: r.complexityHint || null,
          };
        }
      }
      // 2) 兜底：payload_v12（题目答案，可能在嵌套字段里）
      const payloadRaw = localStorage.getItem(V12_PAYLOAD_KEY);
      if (payloadRaw) {
        const p = JSON.parse(payloadRaw);
        const candidates = [p, p.engineResult, p.result, p.payload, p.answers];
        for (const c of candidates) {
          if (!c) continue;
          if (c.mainType && /T[1-5]/.test(c.mainType)) {
            return {
              mainType: c.mainType,
              secondaryType: c.secondaryType || null,
              sideHint: c.sideHint || 'unclear',
              complexityHint: c.complexityHint || null,
            };
          }
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // ============================================================
  // 工具
  // ============================================================

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'className') node.className = v;
      else if (k === 'innerHTML') node.innerHTML = v;
      else if (k === 'onClick') node.addEventListener('click', v);
      else if (k === 'onChange') node.addEventListener('change', v);
      else if (k === 'onInput') node.addEventListener('input', v);
      else if (k === 'type' || k === 'placeholder' || k === 'id' || k === 'accept' || k === 'for' || k === 'value') {
        if (v != null) node.setAttribute(k, v);
      }
      else if (k === 'checked') {
        if (v) node.checked = true;
      }
      else if (k === 'disabled') {
        if (v) node.disabled = true;
      }
      else if (k === 'src') {
        node.setAttribute('src', v);
      }
      else if (k === 'style' && typeof v === 'object') {
        Object.assign(node.style, v);
      }
      else if (v != null) {
        node.setAttribute(k, v);
      }
    });
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (c == null) return;
      if (typeof c === 'string' || typeof c === 'number') node.appendChild(document.createTextNode(String(c)));
      else node.appendChild(c);
    });
    return node;
  }

  function findAction(id) {
    return window.ACTIONS.find(a => a.id === id);
  }

  // 工具：读取文件为 base64（照片上传用）
  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ============================================================
  // 路由
  // ============================================================

  function parseRoute() {
    const hash = location.hash || '#/entry';
    const m = hash.match(/^#\/day\/(\d+)$/);
    if (m) return { name: 'day', day: parseInt(m[1], 10) };
    if (hash === '#/intro') return { name: 'intro' };
    if (hash === '#/overview') return { name: 'overview' };
    return { name: 'entry' };
  }

  function go(hash) { location.hash = hash; }

  // ============================================================
  // 入口选择页
  // ============================================================

  const OPTIONS = {
    mainType: {
      T1: { sub: '口角启动型' },
      T2: { sub: '下颌偏移型' },
      T3: { sub: '面中支撑弱型' },
      T4: { sub: '下颌缘松垮型' },
      T5: { sub: '头颈牵拉型' },
    },
    secondaryType: {
      __null: { sub: '暂未发现' },
      T1: { sub: '口角启动型' },
      T2: { sub: '下颌偏移型' },
      T3: { sub: '面中支撑弱型' },
      T4: { sub: '下颌缘松垮型' },
      T5: { sub: '头颈牵拉型' },
    },
    sideHint: {
      left_weak: { sub: '左侧弱' },
      right_weak: { sub: '右侧弱' },
      left_tension: { sub: '左侧紧' },
      right_tension: { sub: '右侧紧' },
      bilateral: { sub: '双侧' },
      unclear: { sub: '不明确' },
    },
    complexityHint: {
      __null: { sub: '暂未发现' },
      low_evidence: { sub: '证据较单一' },
      mixed_evidence: { sub: '证据混合' },
      conflicting_evidence: { sub: '证据冲突' },
      high_complexity: { sub: '复杂度高' },
    },
  };

  function renderEntry() {
    const state = loadState();
    const selected = state.params || {};

    const app = el('div', { className: 'app' });
    app.appendChild(el('div', { className: 'topbar' }, [
      el('div', { className: 'topbar-title' }, '第三层 · 14 天跟练'),
      el('div', { className: 'topbar-tag' }, 'v0.1.5'),
    ]));

    // v1.2 接入：检测是否有第二层结果
    const v12 = readV12Params();

    if (v12) {
      // 情况 A：检测到 v1.2 payload
      const autoCard = el('div', { className: 'entry-section' });
      const card = el('div', {
        className: 'auto-card',
        style: {
          background: 'linear-gradient(135deg, #e8f0ed 0%, #d4e4dc 100%)',
          border: '1.5px solid #4a7d70',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '16px',
        },
      });
      card.appendChild(el('div', {
        style: {
          fontSize: '12px',
          color: '#2d5b4f',
          fontWeight: '600',
          marginBottom: '10px',
          letterSpacing: '0.5px',
        },
      }, '✨ 已读取你的第二层评估结果'));
      const mainName = window.MAIN_TYPE_NAMES[v12.mainType] || v12.mainType;
      const secName = v12.secondaryType
        ? (window.MAIN_TYPE_NAMES[v12.secondaryType] || v12.secondaryType)
        : '暂未发现明显次因';
      card.appendChild(el('div', { style: { fontSize: '13px', color: '#1a1a1a', lineHeight: '1.8', marginBottom: '14px' } }, [
        el('div', {}, '主因：' + mainName),
        el('div', {}, '次因：' + secName),
        el('div', { style: { color: '#6b6b6b', fontSize: '12px', marginTop: '4px' } },
          '侧别：' + v12.sideHint + '  ·  复杂度：' + (v12.complexityHint || '—')),
      ]));
      const autoBtn = el('button', {
        className: 'auto-btn',
        type: 'button',
        style: {
          width: '100%',
          padding: '14px',
          background: '#2d5b4f',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '15px',
          fontWeight: '600',
          cursor: 'pointer',
          fontFamily: 'inherit',
        },
        onClick: () => {
          setState({ params: v12 });
          const plan = window.generatePlan(v12);
          setState({ plan });
          go('#/intro');
        },
      }, '生成我的 14 天跟练计划');
      card.appendChild(autoBtn);
      autoCard.appendChild(card);
      app.appendChild(autoCard);

      // 副标题
      app.appendChild(el('div', { className: 'entry-header' }, [
        el('div', { className: 'entry-subtitle' },
          '点击上方按钮，将根据你的第二层结果自动生成 14 天计划'),
      ]));
    } else {
      // 情况 B：未检测到 v1.2 payload — 引导用户去完成第二层
      const emptyCard = el('div', { className: 'entry-section' });
      const card = el('div', {
        className: 'empty-card',
        style: {
          background: '#fff8e6',
          border: '1.5px solid #e8b75a',
          borderRadius: '10px',
          padding: '24px 20px',
          marginBottom: '16px',
          textAlign: 'center',
        },
      });
      card.appendChild(el('div', { style: { fontSize: '36px', marginBottom: '12px' } }, '🔒'));
      card.appendChild(el('div', {
        style: {
          fontSize: '15px',
          color: '#1a1a1a',
          fontWeight: '600',
          marginBottom: '8px',
        },
      }, '需要先完成第二层评估'));
      card.appendChild(el('div', {
        style: {
          fontSize: '13px',
          color: '#6b6b6b',
          lineHeight: '1.7',
          marginBottom: '16px',
        },
      }, '第三层 14 天跟练计划是基于你的第二层评估结果生成的。请先到第二层完成 16 题评估，然后回到这里。'));
      const backBtn = el('a', {
        href: '../advanced-result.html',
        className: 'back-btn',
        style: {
          display: 'inline-block',
          padding: '12px 24px',
          background: '#2d5b4f',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '600',
          textDecoration: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
        },
      }, '回到第二层结果页');
      card.appendChild(backBtn);
      emptyCard.appendChild(card);
      app.appendChild(emptyCard);

      // 副标题
      app.appendChild(el('div', { className: 'entry-header' }, [
        el('div', { className: 'entry-subtitle' },
          '第三层 v0.1 独立预览 · 需先完成第二层评估'),
      ]));
    }

    return app;
  }

  // 删掉 renderOptionSection（手动模式已废弃，保留函数定义但内部不再调用）
  // 未来如果想恢复手动模式，把这段还原即可
  function renderOptionSection() { return el('div'); }

  // ============================================================
  // 总体训练计划说明页
  // ============================================================

  function renderIntro() {
    const state = loadState();
    if (!state.plan) { go('#/entry'); return renderEntry(); }
    const { params, plan } = state;
    const mainName = window.MAIN_TYPE_NAMES[params.mainType];
    const secName = params.secondaryType
      ? window.MAIN_TYPE_NAMES[params.secondaryType]
      : '暂未发现明显次因';
    const mainAction = findAction(window.MAIN_TYPE_TO_ACTION[params.mainType]);
    const trainingFocus = mainAction ? mainAction.purpose : '';

    const app = el('div', { className: 'app' });
    app.appendChild(el('div', { className: 'topbar' }, [
      el('button', { className: 'topbar-back', type: 'button', onClick: () => go('#/entry') }, '‹'),
      el('div', { className: 'topbar-title' }, '你的 14 天跟练计划'),
      el('div', { className: 'topbar-tag' }, 'v0.1.1'),
    ]));

    const intro = el('div', { className: 'intro-card' });
    intro.appendChild(el('div', { className: 'intro-section-title' }, '根据你的第二层评估结果'));
    intro.appendChild(el('div', { className: 'intro-result' }, [
      el('div', { className: 'intro-result-line' }, [
        el('div', { className: 'intro-result-label' }, '主因：'),
        el('div', { className: 'intro-result-value' }, mainName),
      ]),
      el('div', { className: 'intro-result-line' }, [
        el('div', { className: 'intro-result-label' }, '次因：'),
        el('div', { className: 'intro-result-value' }, secName),
      ]),
      el('div', { className: 'intro-result-line' }, [
        el('div', { className: 'intro-result-label' }, '训练重点：'),
        el('div', { className: 'intro-result-value' }, trainingFocus),
      ]),
    ]));
    intro.appendChild(el('div', { className: 'intro-section' },
      '接下来 14 天，你会按照自己的评估结果，完成一套循序渐进的居家跟练。'));
    intro.appendChild(el('div', { className: 'intro-section' },
      '这套计划会先从头颈、下颌和面部张力开始整理，再根据你的主因加入对应的重点动作，最后通过每日收尾和阶段复测，帮助你观察脸部状态的变化。'));
    intro.appendChild(el('div', { className: 'intro-section' },
      '每天只需要跟着动作卡完成训练，不需要专业基础。'));
    app.appendChild(intro);

    const expect = el('div', { className: 'card' });
    expect.appendChild(el('div', { className: 'card-title' }, '你可以重点感受这几类变化'));
    const list = el('ol', { className: 'intro-list' });
    [
      '头颈和肩颈没有那么紧；',
      '下巴和咬肌没有那么容易用力；',
      '脸侧的牵拉感减轻；',
      '笑起来更自然；',
      '拍照时头更容易摆正；',
      '下颌线、法令纹、嘴角高低等问题的视觉偏差变轻。',
    ].forEach(t => list.appendChild(el('li', {}, t)));
    expect.appendChild(list);
    expect.appendChild(el('div', { className: 'intro-section', style: 'margin-top:14px;color:var(--color-text-secondary);font-size:13px;' },
      '这不是一套复杂的专业矫正课，而是一套根据你当前结果设计的 14 天居家改善路径。'));
    app.appendChild(expect);

    app.appendChild(el('button', { className: 'intro-cta', type: 'button', onClick: () => go('#/overview') }, '进入我的 14 天计划'));

    return app;
  }

  // ============================================================
  // 14 天计划总览页
  // ============================================================

  function renderOverview() {
    const state = loadState();
    if (!state.plan) { go('#/entry'); return renderEntry(); }

    const app = el('div', { className: 'app' });
    app.appendChild(el('div', { className: 'topbar' }, [
      el('button', { className: 'topbar-back', type: 'button', onClick: () => go('#/intro') }, '‹'),
      el('div', { className: 'topbar-title' }, '14 天计划'),
      el('div', { className: 'topbar-tag' }, 'v0.1.1'),
    ]));

    app.appendChild(el('div', { className: 'overview-header' }, [
      el('div', { className: 'overview-title' }, '你的 14 天阶段安排'),
      el('div', { className: 'overview-subtitle' }, '点开任意一天开始训练'),
    ]));

    const phaseRanges = [
      { days: 'Day 1-2', name: '基础放松期', desc: '先让头颈、下巴和口周没那么紧。' },
      { days: 'Day 3-6', name: '主因改善期', desc: '加入和你主因相关的重点动作。' },
      { days: 'Day 7',   name: '中期观察',   desc: '记录脸有没有变轻，头有没有更容易摆正。', record: true },
      { days: 'Day 8-11', name: '主因 + 次因整合期', desc: '把主因和次因一起整理。' },
      { days: 'Day 12-13', name: '生活稳定期', desc: '学习睡前、拍照前、低头后怎么快速整理。' },
      { days: 'Day 14', name: '复测对比', desc: '重新拍照，观察 14 天变化。', record: true },
    ];
    phaseRanges.forEach(p => {
      const card = el('div', { className: 'phase-card' });
      const daysLine = el('div', { className: 'phase-days' });
      daysLine.appendChild(document.createTextNode(p.days));
      if (p.record) {
        daysLine.appendChild(el('span', { className: 'phase-record-tag' }, '记录日'));
      }
      card.appendChild(daysLine);
      card.appendChild(el('div', { className: 'phase-name' }, p.name));
      card.appendChild(el('div', { className: 'phase-desc' }, p.desc));
      app.appendChild(card);
    });

    const list = el('div', { className: 'day-list', style: 'margin-top:8px;' });
    state.plan.forEach(dayPlan => {
      const actionNames = dayPlan.actionIds.map(id => findAction(id)?.name).filter(Boolean);
      const summary = actionNames.length + ' 个动作';
      const item = el('button', {
        className: 'day-item',
        type: 'button',
        onClick: () => go('#/day/' + dayPlan.day),
      });
      item.appendChild(el('div', { className: 'day-item-day' }, 'Day ' + dayPlan.day));
      const info = el('div', { className: 'day-item-info' });
      const phaseLine = el('div', { className: 'day-item-phase' });
      phaseLine.appendChild(document.createTextNode(dayPlan.phase));
      if (dayPlan.isRecordDay) {
        phaseLine.appendChild(document.createTextNode(' · '));
        const tag = el('span', { style: 'color:var(--color-record);font-weight:500;' }, '● 记录日');
        phaseLine.appendChild(tag);
      }
      info.appendChild(phaseLine);
      info.appendChild(el('div', { className: 'day-item-actions' }, summary));
      item.appendChild(info);
      item.appendChild(el('div', { className: 'day-item-arrow' }, '›'));
      list.appendChild(item);
    });
    app.appendChild(list);

    return app;
  }

  // ============================================================
  // Day 训练页
  // ============================================================

  function renderDay(dayNum) {
    const state = loadState();
    if (!state.plan) { go('#/entry'); return renderEntry(); }
    const dayPlan = state.plan.find(d => d.day === dayNum);
    if (!dayPlan) { go('#/overview'); return renderOverview(); }

    const dayData = state.dayData[dayNum] || {};
    const isCompleted = !!dayData.completedAt;

    const app = el('div', { className: 'app' });

    app.appendChild(el('div', { className: 'topbar' }, [
      el('button', { className: 'topbar-back', type: 'button', onClick: () => go('#/overview') }, '‹'),
      el('div', { className: 'topbar-title' }, 'Day ' + dayNum),
      el('div', { className: 'topbar-tag' }, 'v0.1.1'),
    ]));

    const header = el('div', { className: 'day-header' });
    header.appendChild(el('div', { className: 'day-header-title' }, 'Day ' + dayNum));
    header.appendChild(el('div', { className: 'day-header-phase' },
      dayPlan.phase + ' · ' + dayPlan.phaseDesc));
    app.appendChild(header);

    // 今日目标
    const goal = el('div', { className: 'day-section' });
    goal.appendChild(el('div', { className: 'day-section-title' }, '今日目标'));
    goal.appendChild(el('div', { className: 'day-goal-text' }, buildDayGoal(dayPlan)));
    app.appendChild(goal);

    // 动作卡
    const actionsSection = el('div', { className: 'day-section' });
    actionsSection.appendChild(el('div', { className: 'day-section-title' },
      '今日动作卡 · ' + dayPlan.actionIds.length + ' 个动作'));
    dayPlan.actionIds.forEach(id => {
      const a = findAction(id);
      if (!a) return;
      const card = el('div', { className: 'action-card' });
      card.appendChild(el('div', { className: 'action-card-name' }, a.name));
      card.appendChild(renderActionRow('适合你的原因', a.reason));
      card.appendChild(renderActionRow('作用区域', a.area));
      card.appendChild(renderActionRow('最终目的', a.purpose));
      const videoRow = el('div', { style: 'margin-top:6px;' });
      videoRow.appendChild(el('div', { className: 'action-card-row' }, [
        el('span', { className: 'action-card-row-label' }, '视频：'),
      ]));
      videoRow.appendChild(el('div', { className: 'action-card-video empty' },
        a.videoUrl ? '观看视频' : '视频待上传'));
      card.appendChild(videoRow);
      actionsSection.appendChild(card);
    });
    app.appendChild(actionsSection);

    // 打卡
    const checkinSection = el('div', { className: 'day-section' });
    checkinSection.appendChild(el('div', { className: 'day-section-title' }, '今日打卡'));
    const checkinRow = el('div', { className: 'checkin-row' });
    const checkbox = el('input', {
      type: 'checkbox',
      className: 'checkin-checkbox',
      id: 'checkin-done-' + dayNum,
    });
    checkbox.checked = isCompleted;
    checkbox.addEventListener('change', () => {
      const cur = loadState();
      const dd = cur.dayData[dayNum] || {};
      dd.completedAt = checkbox.checked ? new Date().toISOString() : null;
      cur.dayData[dayNum] = dd;
      saveState(cur);
      // 局部更新：只刷新按钮文字
      if (checkbox.checked) {
        saveBtn.textContent = '已打卡 · 再保存';
        saveBtn.classList.add('done');
      } else {
        saveBtn.textContent = '保存感受';
        saveBtn.classList.remove('done');
      }
    });
    checkinRow.appendChild(checkbox);
    const label = el('label', { for: 'checkin-done-' + dayNum, style: 'flex:1;cursor:pointer;' },
      '已完成今日所有动作');
    checkinRow.appendChild(label);
    checkinSection.appendChild(checkinRow);
    app.appendChild(checkinSection);

    // 感受记录
    const feelSection = el('div', { className: 'day-section' });
    feelSection.appendChild(el('div', { className: 'day-section-title' }, '今日感受记录'));
    const textarea = el('textarea', {
      className: 'checkin-input',
      placeholder: '今天练完后哪里比较松？哪里还是紧的？有没有不舒服？',
    });
    textarea.value = dayData.feelings || '';
    textarea.addEventListener('input', () => {
      const cur = loadState();
      const dd = cur.dayData[dayNum] || {};
      dd.feelings = textarea.value;
      cur.dayData[dayNum] = dd;
      saveState(cur);
    });
    feelSection.appendChild(textarea);
    const saveBtn = el('button', {
      className: 'day-save-btn' + (isCompleted ? ' done' : ''),
      type: 'button',
      onClick: () => {
        const cur = loadState();
        const dd = cur.dayData[dayNum] || {};
        dd.feelings = textarea.value;
        dd.savedAt = new Date().toISOString();
        cur.dayData[dayNum] = dd;
        saveState(cur);
        const orig = saveBtn.textContent;
        saveBtn.textContent = '已保存 ✓';
        saveBtn.disabled = true;
        setTimeout(() => {
          saveBtn.textContent = orig;
          saveBtn.disabled = false;
        }, 1200);
      },
    }, isCompleted ? '已打卡 · 再保存' : '保存感受');
    feelSection.appendChild(saveBtn);
    app.appendChild(feelSection);

    // 记录卡（仅 Day 1 / 7 / 14）
    if (dayPlan.isRecordDay) {
      app.appendChild(renderRecordCard(dayNum, dayPlan));
    }

    // Day 之间导航
    const nav = el('div', { className: 'day-nav' });
    const prevBtn = el('button', {
      className: 'day-nav-btn',
      type: 'button',
      onClick: () => go('#/day/' + (dayNum - 1)),
    }, '‹ 上一天');
    if (dayNum <= 1) prevBtn.disabled = true;
    const nextBtn = el('button', {
      className: 'day-nav-btn primary',
      type: 'button',
    }, dayNum >= 14 ? '回到总览' : '下一天 ›');
    nextBtn.onclick = () => go(dayNum >= 14 ? '#/overview' : '#/day/' + (dayNum + 1));
    nav.appendChild(prevBtn);
    nav.appendChild(nextBtn);
    app.appendChild(nav);

    return app;
  }

  function buildDayGoal(dayPlan) {
    const actionCount = dayPlan.actionIds.length;
    const hasRecord = dayPlan.isRecordDay;
    let s = '今天一共 ' + actionCount + ' 个动作。';
    s += '先做基础放松，再做主因对应的重点动作，最后用收尾动作把面部张力整理回来。';
    if (hasRecord) s += '\n今天是记录日，记得拍照记录脸的状态。';
    return s;
  }

  function renderActionRow(label, value) {
    return el('div', { className: 'action-card-row' }, [
      el('span', { className: 'action-card-row-label' }, label + '：'),
      el('span', { className: 'action-card-row-value' }, value),
    ]);
  }

  // ============================================================
  // 记录卡（修复版：照片位用 <button> + 真支持选文件）
  // ============================================================

  function renderRecordCard(dayNum, dayPlan) {
    const state = loadState();
    const record = (state.dayData[dayNum] && state.dayData[dayNum].record) || {};

    const card = el('div', { className: 'record-card' });
    const title = dayNum === 1 ? 'Day 1 初始记录卡'
      : dayNum === 7 ? 'Day 7 中期观察卡'
      : 'Day 14 复测对比卡';
    const subtitle = dayNum === 1 ? '记录开始前的初始状态'
      : dayNum === 7 ? '记录 7 天后脸和头颈的变化'
      : '记录 14 天后整体改善情况';

    card.appendChild(el('div', { className: 'record-day-title' }, title));
    card.appendChild(el('div', { className: 'record-day-subtitle' }, subtitle));

    const req = el('div', { className: 'record-requirements' });
    req.appendChild(el('div', { className: 'record-requirements-title' }, '📸 拍照要求'));
    req.appendChild(el('div', {}, '请保持：同一光线 · 同一距离 · 同一角度'));
    req.appendChild(el('div', { style: 'margin-top:6px;color:var(--color-text-secondary);' },
      '在自然光下拍 3 张：正脸放松 / 正脸微笑 / 侧脸 45°'));
    card.appendChild(req);

    // 3 个照片位（用 <button> 触发 file input + 局部更新）
    const shots = [
      { key: 'front_relaxed', label: '正脸放松', icon: '🙂' },
      { key: 'front_smile',   label: '正脸微笑', icon: '😊' },
      { key: 'side_45',       label: '侧脸 45°', icon: '📷' },
    ];

    const shotsGrid = el('div', { className: 'record-shots' });
    shots.forEach(s => {
      // 关键：file input 不能用 display:none 隐藏（iOS Safari 会拒绝触发）
      // 用 position:absolute; opacity:0; pointer-events:none 把 input 直接覆盖在 button 上
      // 这样用户点 button = 直接点 input，浏览器认为是真实手势
      const fileInput = el('input', {
        type: 'file',
        accept: 'image/*',
        capture: 'environment',
        className: 'record-shot-input',
      });

      const shot = el('label', {
        className: 'record-shot',
        // 用 <label> 包裹 input + 内容，iOS 上点 label 自动触发 file 选择
      });
      shot.appendChild(fileInput);

      // 渲染内容（照片缩略图 or 占位）
      const renderShotContent = (dataUrl) => {
        shot.innerHTML = '';  // 清空
        if (dataUrl) {
          // 已上传：显示缩略图
          const img = el('img', {
            src: dataUrl,
            style: 'width:100%;height:80px;object-fit:cover;border-radius:4px;margin-bottom:4px;',
          });
          shot.appendChild(img);
          shot.appendChild(el('div', { className: 'record-shot-label' }, s.label));
          shot.appendChild(el('div', { className: 'record-shot-uploaded' }, '✓ 已上传 · 点替换'));
        } else {
          // 占位
          shot.appendChild(el('div', { className: 'record-shot-icon' }, s.icon));
          shot.appendChild(el('div', { className: 'record-shot-label' }, s.label));
          shot.appendChild(el('div', { style: 'color:var(--color-text-light);font-size:11px;' }, '点击上传'));
        }
        shot.appendChild(fileInput);  // 隐藏 input 重新挂回
      };

      renderShotContent(record[s.key]);

      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
          const dataUrl = await readFileAsDataURL(file);
          const cur = loadState();
          const dd = cur.dayData[dayNum] || {};
          const rec = dd.record || {};
          rec[s.key] = dataUrl;
          dd.record = rec;
          cur.dayData[dayNum] = dd;
          saveState(cur);
          renderShotContent(dataUrl);  // 局部更新这个 shot，不重渲染页面
        } catch (err) {
          alert('图片读取失败：' + err.message);
        }
      });

      shotsGrid.appendChild(shot);
    });
    card.appendChild(shotsGrid);

    // 备注
    const noteInput = el('textarea', {
      className: 'record-input',
      placeholder: dayNum === 1 ? '今天的脸部状态、头颈感受、整体印象…'
        : dayNum === 7 ? '这 7 天的变化、感觉变轻的地方、还紧的地方…'
        : '14 天整体对比、家人朋友反馈、自己的感受…',
    });
    noteInput.value = record.note || '';
    noteInput.addEventListener('input', () => {
      const cur = loadState();
      const dd = cur.dayData[dayNum] || {};
      const rec = dd.record || {};
      rec.note = noteInput.value;
      dd.record = rec;
      cur.dayData[dayNum] = dd;
      saveState(cur);
    });
    card.appendChild(noteInput);

    const saveBtn = el('button', {
      className: 'record-save-btn',
      type: 'button',
      onClick: () => {
        const cur = loadState();
        const dd = cur.dayData[dayNum] || {};
        const rec = dd.record || {};
        rec.note = noteInput.value;
        rec.savedAt = new Date().toISOString();
        dd.record = rec;
        cur.dayData[dayNum] = dd;
        saveState(cur);
        const orig = saveBtn.textContent;
        saveBtn.textContent = '已保存 ✓';
        saveBtn.disabled = true;
        setTimeout(() => {
          saveBtn.textContent = orig;
          saveBtn.disabled = false;
        }, 1200);
      },
    }, '保存记录');
    card.appendChild(saveBtn);

    return card;
  }

  // ============================================================
  // 入口 + 路由分发
  // ============================================================

  function render() {
    const route = parseRoute();
    let page;
    if (route.name === 'entry') page = renderEntry();
    else if (route.name === 'intro') page = renderIntro();
    else if (route.name === 'overview') page = renderOverview();
    else if (route.name === 'day') page = renderDay(route.day);
    else page = renderEntry();

    const root = document.getElementById('app-root');
    if (root) {
      root.innerHTML = '';
      root.appendChild(page);
    }
    // 修复：不再 scrollTo(0, 0)
  }

  window.addEventListener('hashchange', render);
  document.addEventListener('DOMContentLoaded', render);
  if (document.readyState !== 'loading') render();
})();
