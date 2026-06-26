/**
 * LAA 第三层 v0.1｜14 天计划生成器
 *
 * 严格按 v0.1 指令包第十二节：
 *   - 统一基础动作 + mainType 对应重点动作 + secondaryType 辅助动作
 *   - 所有人基础都包含：A1（颈侧筋膜减压）+ A3（口腔静息位）+ A4（收尾）
 *   - mainType 对应动作（A5~A9，5 选 1）
 *   - T5 用户额外常用 A2（头颈轴线延展）
 *   - 次因辅助动作：非每天都有
 *
 * 不做：20 套复杂计划 / 智能排课引擎 / 固定时长次数
 *
 * 14 天阶段（按指令包第六节）：
 *   Day 1-2   基础放松期
 *   Day 3-6   主因改善期
 *   Day 7     中期观察（记录卡）
 *   Day 8-11  主因+次因整合期
 *   Day 12-13 生活稳定期
 *   Day 14    复测对比（记录卡）
 */

const PLAN_PHASES = {
  1:  { name: '基础放松期',   desc: '先让头颈、下巴和口周没那么紧。' },
  2:  { name: '基础放松期',   desc: '先让头颈、下巴和口周没那么紧。' },
  3:  { name: '主因改善期',   desc: '加入和你主因相关的重点动作。' },
  4:  { name: '主因改善期',   desc: '加入和你主因相关的重点动作。' },
  5:  { name: '主因改善期',   desc: '加入和你主因相关的重点动作。' },
  6:  { name: '主因改善期',   desc: '加入和你主因相关的重点动作。' },
  7:  { name: '中期观察',     desc: '记录脸有没有变轻，头有没有更容易摆正。' },
  8:  { name: '主因+次因整合期', desc: '把主因和次因一起整理。' },
  9:  { name: '主因+次因整合期', desc: '把主因和次因一起整理。' },
  10: { name: '主因+次因整合期', desc: '把主因和次因一起整理。' },
  11: { name: '主因+次因整合期', desc: '把主因和次因一起整理。' },
  12: { name: '生活稳定期',   desc: '学习睡前、拍照前、低头后怎么快速整理。' },
  13: { name: '生活稳定期',   desc: '学习睡前、拍照前、低头后怎么快速整理。' },
  14: { name: '复测对比',     desc: '重新拍照，观察 14 天变化。' },
};

// 记录卡日
const RECORD_DAYS = new Set([1, 7, 14]);

/**
 * 生成单日动作序列
 *
 * @param {number} day          1~14
 * @param {string} mainType     T1~T5
 * @param {string|null} secondaryType  T1~T5 或 null
 * @returns {string[]} 动作 ID 列表
 */
function buildDayActions(day, mainType, secondaryType) {
  // 1. 每天必有的基础：A1 + A3 + A4（收尾）
  const ids = ['A1', 'A3'];

  // 2. T5 用户额外常用 A2
  if (mainType === 'T5' || secondaryType === 'T5') {
    ids.push('A2');
  }

  // 3. mainType 对应重点动作
  const mainActionId = window.MAIN_TYPE_TO_ACTION[mainType];
  if (mainActionId && !ids.includes(mainActionId)) {
    ids.push(mainActionId);
  }

  // 4. 次因辅助动作（"非每天都有"）
  //    规则：仅在主因+次因整合期（Day 8-11）和生活稳定期（Day 12-13）出现
  //    早期（Day 1-6）只做基础+主因，让用户先适应
  if (secondaryType && secondaryType !== mainType) {
    const secActionId = window.SECONDARY_TYPE_TO_ACTION[secondaryType];
    const isIntegrationPhase = day >= 8 && day <= 11;
    const isStablePhase = day === 12 || day === 13;
    if (secActionId && (isIntegrationPhase || isStablePhase)) {
      if (!ids.includes(secActionId)) {
        ids.push(secActionId);
      }
    }
  }

  // 5. 收尾动作 A4 永远放最后
  ids.push('A4');

  return ids;
}

/**
 * 生成完整 14 天计划
 *
 * @param {object} params
 * @param {string} params.mainType
 * @param {string|null} params.secondaryType
 * @param {string} params.sideHint
 * @param {string} params.complexityHint
 * @returns {Array<{day:number, phase:string, phaseDesc:string, actionIds:string[], isRecordDay:boolean}>}
 */
function generatePlan({ mainType, secondaryType, sideHint, complexityHint }) {
  const plan = [];
  for (let day = 1; day <= 14; day++) {
    const phase = PLAN_PHASES[day];
    plan.push({
      day,
      phase: phase.name,
      phaseDesc: phase.desc,
      actionIds: buildDayActions(day, mainType, secondaryType),
      isRecordDay: RECORD_DAYS.has(day),
    });
  }
  return plan;
}

if (typeof window !== 'undefined') {
  window.PLAN_PHASES = PLAN_PHASES;
  window.RECORD_DAYS = RECORD_DAYS;
  window.buildDayActions = buildDayActions;
  window.generatePlan = generatePlan;
}
