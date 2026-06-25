'use strict';

/**
 * LAA 第二层引擎 v1.2
 * 输入：16 题答案（5组×3题 + 1道主诉题 Q16）
 * 输出：mainType + secondaryType + minorTendencies + sideHint + complexityHint + trainingPriority 双格式 + resultSummary
 *
 * 严禁：
 *  - 不输出用户可见分数
 *  - 不把旧 T5 作为兜底 mainType
 *  - 不使用旧 Q1-Q4
 *  - 不把 PDF 25 题结构写进来
 *  - 不进入 Layer 3
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'second-layer-config-v1.2.json');
const CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

const T_CODES = ['T1', 'T2', 'T3', 'T4', 'T5'];
const T_QUESTIONS = {
  T1: ['T1_Q1', 'T1_Q2', 'T1_Q3'],
  T2: ['T2_Q1', 'T2_Q2', 'T2_Q3'],
  T3: ['T3_Q1', 'T3_Q2', 'T3_Q3'],
  T4: ['T4_Q1', 'T4_Q2', 'T4_Q3'],
  T5: ['T5_Q1', 'T5_Q2', 'T5_Q3'],
};
const EVIDENCE_RANK = { none: 0, weak: 1, medium: 2, strong: 3 };

/**
 * 1. validateInput - 验证输入结构
 */
function validateInput(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Input must be an object');
  }
  if (!input.answers || typeof input.answers !== 'object') {
    throw new Error('Input.answers is required');
  }
  // 验证 15 个 T 组题
  for (const t of T_CODES) {
    for (const q of T_QUESTIONS[t]) {
      const a = input.answers[q];
      if (!a) {
        throw new Error(`Missing answer: ${q}`);
      }
      if (!(a.severity in EVIDENCE_RANK)) {
        throw new Error(`Invalid severity for ${q}: ${a.severity}`);
      }
      if (!CONFIG.SIDE_VALUES.includes(a.side)) {
        throw new Error(`Invalid side for ${q}: ${a.side}`);
      }
    }
  }
  // 验证 Q16_focus（可缺省，缺省视为无主诉加成）
  if (input.q16Focus !== undefined && input.q16Focus !== null) {
    if (!(input.q16Focus in CONFIG.Q16_FOCUS_MAP)) {
      throw new Error(`Invalid q16Focus: ${input.q16Focus}`);
    }
  }
  return true;
}

/**
 * 2. normalizeAnswers - 标准化输入
 */
function normalizeAnswers(input) {
  const out = {};
  for (const t of T_CODES) {
    out[t] = {};
    for (const q of T_QUESTIONS[t]) {
      out[t][q] = {
        severity: input.answers[q].severity,
        side: input.answers[q].side,
        value: CONFIG.SEVERITY_MAP[input.answers[q].severity],
      };
    }
  }
  return out;
}

/**
 * 3. calculateEvidenceByType - 计算每个 T 的 total 和 evidenceLevel
 */
function calculateEvidenceByType(normalized, q16Focus) {
  const result = {};
  const q16T = (q16Focus && CONFIG.Q16_FOCUS_MAP[q16Focus]) ? CONFIG.Q16_FOCUS_MAP[q16Focus].defaultT : null;

  for (const t of T_CODES) {
    const qs = Object.values(normalized[t]);
    const total = qs.reduce((s, q) => s + q.value, 0);
    const strongCount = qs.filter((q) => q.severity === 'strong').length;
    const mediumOrStrongCount = qs.filter((q) => q.severity === 'medium' || q.severity === 'strong').length;

    // 多路径 evidenceLevel
    let level;
    if (total === 0) {
      level = 'none';
    } else if (q16T === t && mediumOrStrongCount >= 1) {
      // q16Focus 加成（需保护：至少 1 题 medium/strong 才生效，避免纯主诉驱动）
      if (total >= 4) {
        level = 'strong';
      } else if (total >= 2) {
        level = 'medium';
      } else {
        level = 'weak';
      }
    } else if (strongCount >= 2) {
      level = 'strong';
    } else if (total >= 6) {
      level = 'strong';
    } else if (total >= 3) {
      level = 'medium';
    } else if (total >= 1) {
      level = 'weak';
    } else {
      level = 'none';
    }

    result[t] = {
      total,
      strongCount,
      mediumOrStrongCount,
      evidenceLevel: level,
    };
  }
  return result;
}

/**
 * 4. determineCandidates - 判定哪些 T 成立 / 哪些是轻度候选
 */
function determineCandidates(evidence) {
  const established = [];
  const minor = [];
  for (const t of T_CODES) {
    const e = evidence[t].evidenceLevel;
    if (e === 'medium' || e === 'strong') {
      established.push(t);
    } else if (e === 'weak') {
      minor.push(t);
    }
  }
  return { established, minor };
}

/**
 * 5. determineMainSecondaryMinor - 排序并分配 main/secondary/minor
 */
function determineMainSecondaryMinor(evidence, candidates, q16Focus, firstLayerDirection) {
  const STRUCTURAL_PRIORITY = CONFIG.STRUCTURAL_ROOT_PRIORITY;
  const structuralRank = (t) => STRUCTURAL_PRIORITY.indexOf(t);

  // 排序函数
  function sortKey(t) {
    const e = evidence[t];
    const q16Match = q16Focus && CONFIG.Q16_FOCUS_MAP[q16Focus] && CONFIG.Q16_FOCUS_MAP[q16Focus].defaultT === t ? 1 : 0;
    const firstLayerMatch = (() => {
      if (!firstLayerDirection || !CONFIG.Q16_FOCUS_MAP[firstLayerDirection]) return 0;
      return CONFIG.Q16_FOCUS_MAP[firstLayerDirection].defaultT === t ? 1 : 0;
    })();
    // 倒序：evidenceLevel 强优先，total 倒序优先，q16Match 倒序优先
    return [
      -EVIDENCE_RANK[e.evidenceLevel], // 强优先（负数越大越前）
      -e.total,
      -q16Match,
      -firstLayerMatch,
      structuralRank(t), // T5 排前，index 小
    ];
  }

  // 已成立类型
  const establishedSorted = [...candidates.established].sort((a, b) => {
    const ka = sortKey(a);
    const kb = sortKey(b);
    for (let i = 0; i < ka.length; i++) {
      if (ka[i] !== kb[i]) return ka[i] - kb[i];
    }
    return 0;
  });

  // 轻度候选
  const minorSorted = [...candidates.minor].sort((a, b) => {
    const ka = sortKey(a);
    const kb = sortKey(b);
    for (let i = 0; i < ka.length; i++) {
      if (ka[i] !== kb[i]) return ka[i] - kb[i];
    }
    return 0;
  });

  return {
    mainType: establishedSorted[0] || null,
    secondaryType: establishedSorted[1] || null,
    minorTendencies: minorSorted.slice(0, 2),
  };
}

/**
 * 6. resolveConflictWithQ16 - 情形 A/B/C/D 决策
 *   - 情形 A：Q16_focus 命中的 T 与 T_total 最高的 T 一致 → mainType=该 T
 *   - 情形 B：Q16_focus 命中的 T 强，另一 T 成立但未压过 → mainType=Q16_focus T
 *   - 情形 C：Q16_focus=T1 但 T5 压过 → mainType=T5
 *   - 情形 D：多个 T 都成立但无主因 → high_complexity
 */
function resolveConflictWithQ16(evidence, current, q16Focus) {
  let mainType = current.mainType;
  let secondaryType = current.secondaryType;
  let complexityHint = null;

  if (!q16Focus || !CONFIG.Q16_FOCUS_MAP[q16Focus]) {
    return { mainType, secondaryType, complexityHint };
  }

  const q16T = CONFIG.Q16_FOCUS_MAP[q16Focus].defaultT;
  const q16Evidence = evidence[q16T];

  // 防护：q16T 本身不是 established（none/weak）时不因 q16Focus 提升
  if (q16Evidence.evidenceLevel === 'none' || q16Evidence.evidenceLevel === 'weak') {
    return { mainType, secondaryType, complexityHint };
  }

  // 计算 topT（按 evidenceLevel + total + strongCount 严格排序）
  const topT = Object.keys(evidence).reduce((best, t) => {
    if (!best) return t;
    const a = evidence[t];
    const b = evidence[best];
    const ra = EVIDENCE_RANK[a.evidenceLevel];
    const rb = EVIDENCE_RANK[b.evidenceLevel];
    if (ra !== rb) return ra > rb ? t : best;
    if (a.total !== b.total) return a.total > b.total ? t : best;
    if (a.strongCount !== b.strongCount) return a.strongCount > b.strongCount ? t : best;
    return best;
  }, null);

  const topEvidence = evidence[topT];

  // 情形 A：Q16_focus T 与 topT 一致
  if (q16T === topT) {
    return { mainType: q16T, secondaryType, complexityHint: null };
  }

  // 情形 C：topT_total - q16T_total ≥ 2 或 topT 有 ≥2 题 strong
  const totalDiff = topEvidence.total - q16Evidence.total;
  if (totalDiff >= 2 || topEvidence.strongCount >= 2) {
    return {
      mainType: topT,
      secondaryType: q16T,
      complexityHint: 'conflicting_evidence',
    };
  }

  // 情形 B：Q16_focus T 强，差距小，主诉优先
  return { mainType: q16T, secondaryType: topT, complexityHint: null };
}

/**
 * 7. determineSideHint - 由 mainType + 各题 side 决定
 */
function determineSideHint(normalized, mainType) {
  if (!mainType) {
    // 看所有题 side，决定主方向
    const sides = [];
    for (const t of T_CODES) {
      for (const q of T_QUESTIONS[t]) {
        sides.push(normalized[t][q].side);
      }
    }
    return resolveSides(sides, null);
  }

  const qsides = T_QUESTIONS[mainType].map((q) => normalized[mainType][q].side);
  return resolveSides(qsides, mainType);
}

function resolveSides(sides, mainType) {
  const leftCount = sides.filter((s) => s === 'left').length;
  const rightCount = sides.filter((s) => s === 'right').length;
  const bilateralCount = sides.filter((s) => s === 'bilateral').length;
  const unclearCount = sides.filter((s) => s === 'unclear').length;

  if (bilateralCount >= 2) return 'bilateral';
  if (leftCount === 0 && rightCount === 0) return 'unclear';

  const dominantSide = leftCount > rightCount ? 'left' : (rightCount > leftCount ? 'right' : null);
  if (!dominantSide) return 'bilateral';

  // T1/T3/T4 用 weak，T2/T5 用 tension
  const weakTypes = ['T1', 'T3', 'T4'];
  const tensionTypes = ['T2', 'T5'];

  if (mainType) {
    if (weakTypes.includes(mainType)) {
      return dominantSide === 'left' ? 'left_weak' : 'right_weak';
    }
    if (tensionTypes.includes(mainType)) {
      return dominantSide === 'left' ? 'left_tension' : 'right_tension';
    }
  }
  // 无 mainType 时按比例判断
  return dominantSide === 'left' ? 'left_weak' : 'right_weak';
}

/**
 * 8. determineComplexityHint
 *   优先级：high_complexity > conflicting_evidence > mixed_evidence > low_evidence > side_unclear > null
 */
function determineComplexityHint(evidence, establishedCount, sideHint, currentHint) {
  // high_complexity：4-5 个 T 都 established
  if (establishedCount >= 4) {
    return 'high_complexity';
  }

  // conflicting_evidence 已经由 resolveConflictWithQ16 设置
  if (currentHint === 'conflicting_evidence') {
    return 'conflicting_evidence';
  }

  // low_evidence：没有任何 T 达到 medium/strong
  if (establishedCount === 0) {
    return 'low_evidence';
  }

  // mixed_evidence：top1 与 top2 差距小，且无 strong 类型
  const sorted = Object.values(evidence).sort((a, b) => {
    if (a.evidenceLevel !== b.evidenceLevel) {
      return EVIDENCE_RANK[b.evidenceLevel] - EVIDENCE_RANK[a.evidenceLevel];
    }
    return b.total - a.total;
  });
  const top1 = sorted[0];
  const top2 = sorted[1];
  const hasStrong = sorted.some((e) => e.evidenceLevel === 'strong');
  if (!hasStrong && top2 && (top1.total - top2.total <= 1) && establishedCount >= 2) {
    return 'mixed_evidence';
  }

  // side_unclear
  if (sideHint === 'unclear') {
    return 'side_unclear';
  }

  return null;
}

/**
 * 9. generateTrainingPriorityTextAndTags - 双格式输出
 */
function generateTrainingPriorityTextAndTags(mainType, secondaryType) {
  if (!mainType) {
    const fallback = CONFIG.TRAINING_PRIORITY_TAGS.FALLBACK_MAIN_NULL;
    return {
      trainingPriorityTags: [...fallback.tags],
      trainingPriorityText: [...fallback.texts],
    };
  }

  const set = [mainType, secondaryType].filter(Boolean);
  const P1 = CONFIG.TRAINING_PRIORITY_TAGS.P1;

  // P1 优先级
  let p1;
  if (set.includes('T5')) {
    p1 = P1.T5_in_set;
  } else if (set.includes('T2')) {
    p1 = P1.T2_in_set_excludes_T5;
  } else if (set.includes('T4')) {
    p1 = P1.T4_in_set_excludes_T5_T2;
  } else {
    p1 = P1.only_T1_T3;
  }

  // P2
  const p2 = CONFIG.TRAINING_PRIORITY_TAGS.P2[mainType];

  // P3
  const p3 = secondaryType ? CONFIG.TRAINING_PRIORITY_TAGS.P3[secondaryType] : null;

  // P4
  const p4 = CONFIG.TRAINING_PRIORITY_TAGS.P4.fixed;

  const tags = [p1.tag, p2.tag];
  const texts = [p1.text, p2.text];
  if (p3) {
    tags.push(p3.tag);
    texts.push(p3.text);
  }
  tags.push(p4.tag);
  texts.push(p4.text);

  return {
    trainingPriorityTags: tags,
    trainingPriorityText: texts,
  };
}

/**
 * 10. generateResultSummary - 文案汇总
 */
function generateResultSummary(mainType, secondaryType, complexityHint) {
  const templates = CONFIG.RESULT_SUMMARY_TEMPLATES;
  if (!mainType) {
    if (complexityHint === 'low_evidence') return templates.main_null_low_evidence;
    if (complexityHint === 'mixed_evidence') return templates.main_null_mixed_evidence;
    return templates.main_null_low_evidence;
  }
  if (complexityHint === 'high_complexity') {
    return templates.main_with_high_complexity;
  }
  if (complexityHint === 'conflicting_evidence') {
    return templates.main_with_conflicting_evidence;
  }
  if (secondaryType) {
    const key = `${mainType}_main_${secondaryType}_secondary`;
    if (templates[key]) return templates[key];
  }
  const keyNoSec = `${mainType}_main_no_secondary`;
  if (templates[keyNoSec]) return templates[keyNoSec];
  return templates.main_null_low_evidence;
}

/**
 * 11. main: runSecondLayer - 入口
 */
function runSecondLayer(input) {
  validateInput(input);
  const q16Focus = input.q16Focus || null;
  const firstLayerDirection = input.firstLayerDirection || null;

  const normalized = normalizeAnswers(input);
  const evidence = calculateEvidenceByType(normalized, q16Focus);
  const candidates = determineCandidates(evidence);
  const initialSort = determineMainSecondaryMinor(evidence, candidates, q16Focus, firstLayerDirection);
  const conflict = resolveConflictWithQ16(evidence, initialSort, q16Focus);

  const mainType = conflict.mainType || initialSort.mainType;
  const secondaryType = conflict.secondaryType !== undefined ? conflict.secondaryType : initialSort.secondaryType;
  const complexityHintFromConflict = conflict.complexityHint;

  // 重新计算 minor（排除 main 和 secondary）
  const usedSet = new Set([mainType, secondaryType].filter(Boolean));
  const minorFiltered = initialSort.minorTendencies.filter((t) => !usedSet.has(t));

  const sideHint = determineSideHint(normalized, mainType);
  const establishedCount = candidates.established.length;
  const complexityHint = determineComplexityHint(evidence, establishedCount, sideHint, complexityHintFromConflict);

  // 重新判定 minor（如果 high_complexity，把剩余 established 也放进 minorTendencies 候选）
  let minorTendencies = minorFiltered;
  if (complexityHint === 'high_complexity') {
    const allEstablished = candidates.established;
    const remaining = allEstablished.filter((t) => !usedSet.has(t));
    minorTendencies = remaining.slice(0, 2);
  }

  const { trainingPriorityTags, trainingPriorityText } = generateTrainingPriorityTextAndTags(mainType, secondaryType);
  const resultSummary = generateResultSummary(mainType, secondaryType, complexityHint);

  const mainTypeName = mainType ? CONFIG.T_TYPES[mainType].name : null;
  const secondaryTypeName = secondaryType ? CONFIG.T_TYPES[secondaryType].name : null;

  const output = {
    mainType,
    mainTypeName,
    secondaryType,
    secondaryTypeName,
    minorTendencies,
    truthTendency: input.truthTendency || null,  // 透传 legacy
    q16Focus: q16Focus,
    sideHint,
    complexityHint,
    trainingPriorityText,
    trainingPriorityTags,
    resultSummary,
  };
  return output;
}

module.exports = {
  runSecondLayer,
  // 暴露子函数便于测试
  validateInput,
  normalizeAnswers,
  calculateEvidenceByType,
  determineCandidates,
  determineMainSecondaryMinor,
  resolveConflictWithQ16,
  determineSideHint,
  determineComplexityHint,
  generateTrainingPriorityTextAndTags,
  generateResultSummary,
  CONFIG,
};
