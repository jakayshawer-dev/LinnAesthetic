/**
 * LAA 第二层引擎 v1.2 - 浏览器版本
 * 基于 second-layer-engine-v1.2.js，去掉 Node.js 依赖（fs/path）
 *
 * 加载方式：
 *   <script src="js/second-layer-config-v1.2.js"></script>
 *   <script src="js/second-layer-engine-v1.2-browser.js"></script>
 *   const result = runSecondLayer(input);
 *
 * 也可以通过 fetch 异步加载 config：
 *   await loadEngineV12()
 */

(function(global) {
  'use strict';

  // config 优先从全局变量读取（同步），否则通过 fetch 异步加载
  let CONFIG = global.secondLayerConfigV12 || null;

  const T_CODES = ['T1', 'T2', 'T3', 'T4', 'T5'];
  const T_QUESTIONS = {
    T1: ['T1_Q1', 'T1_Q2', 'T1_Q3'],
    T2: ['T2_Q1', 'T2_Q2', 'T2_Q3'],
    T3: ['T3_Q1', 'T3_Q2', 'T3_Q3'],
    T4: ['T4_Q1', 'T4_Q2', 'T4_Q3'],
    T5: ['T5_Q1', 'T5_Q2', 'T5_Q3'],
  };
  const EVIDENCE_RANK = { none: 0, weak: 1, medium: 2, strong: 3 };

  async function loadEngineV12() {
    try {
      const resp = await fetch('js/second-layer-config-v1.2.json');
      if (!resp.ok) throw new Error(`config fetch failed: ${resp.status}`);
      CONFIG = await resp.json();
      global.secondLayerConfigV12 = CONFIG;
      console.log('[v1.2] config loaded');
      return true;
    } catch (e) {
      console.error('[v1.2] config load failed', e);
      return false;
    }
  }

  function validateInput(input) {
    if (!input || typeof input !== 'object') {
      throw new Error('Input must be an object');
    }
    if (!input.answers || typeof input.answers !== 'object') {
      throw new Error('Input.answers is required');
    }
    if (!CONFIG) {
      throw new Error('CONFIG not loaded, call loadEngineV12() first');
    }
    for (const t of T_CODES) {
      for (const q of T_QUESTIONS[t]) {
        const a = input.answers[q];
        if (!a) throw new Error(`Missing answer: ${q}`);
        if (!(a.severity in EVIDENCE_RANK)) {
          throw new Error(`Invalid severity for ${q}: ${a.severity}`);
        }
        if (!CONFIG.SIDE_VALUES.includes(a.side)) {
          throw new Error(`Invalid side for ${q}: ${a.side}`);
        }
      }
    }
    if (input.q16Focus !== undefined && input.q16Focus !== null) {
      if (!(input.q16Focus in CONFIG.Q16_FOCUS_MAP)) {
        throw new Error(`Invalid q16Focus: ${input.q16Focus}`);
      }
    }
    return true;
  }

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

  function calculateEvidenceByType(normalized, q16Focus) {
    const result = {};
    const q16T = (q16Focus && CONFIG.Q16_FOCUS_MAP[q16Focus]) ? CONFIG.Q16_FOCUS_MAP[q16Focus].defaultT : null;

    for (const t of T_CODES) {
      const qs = Object.values(normalized[t]);
      const total = qs.reduce((s, q) => s + q.value, 0);
      const strongCount = qs.filter((q) => q.severity === 'strong').length;
      const mediumOrStrongCount = qs.filter((q) => q.severity === 'medium' || q.severity === 'strong').length;

      let level;
      if (total === 0) {
        level = 'none';
      } else if (q16T === t && mediumOrStrongCount >= 1) {
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

      result[t] = { total, strongCount, mediumOrStrongCount, evidenceLevel: level };
    }
    return result;
  }

  function determineCandidates(evidence) {
    const established = [];
    const minor = [];
    for (const t of T_CODES) {
      const e = evidence[t].evidenceLevel;
      if (e === 'medium' || e === 'strong') established.push(t);
      else if (e === 'weak') minor.push(t);
    }
    return { established, minor };
  }

  function determineMainSecondaryMinor(evidence, candidates, q16Focus, firstLayerDirection) {
    const STRUCTURAL_PRIORITY = CONFIG.STRUCTURAL_ROOT_PRIORITY;
    const structuralRank = (t) => STRUCTURAL_PRIORITY.indexOf(t);

    function sortKey(t) {
      const e = evidence[t];
      const q16Match = q16Focus && CONFIG.Q16_FOCUS_MAP[q16Focus] && CONFIG.Q16_FOCUS_MAP[q16Focus].defaultT === t ? 1 : 0;
      const firstLayerMatch = (() => {
        if (!firstLayerDirection || !CONFIG.Q16_FOCUS_MAP[firstLayerDirection]) return 0;
        return CONFIG.Q16_FOCUS_MAP[firstLayerDirection].defaultT === t ? 1 : 0;
      })();
      return [
        -EVIDENCE_RANK[e.evidenceLevel],
        -e.total,
        -q16Match,
        -firstLayerMatch,
        structuralRank(t),
      ];
    }

    const establishedSorted = [...candidates.established].sort((a, b) => {
      const ka = sortKey(a);
      const kb = sortKey(b);
      for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i];
      return 0;
    });

    const minorSorted = [...candidates.minor].sort((a, b) => {
      const ka = sortKey(a);
      const kb = sortKey(b);
      for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i];
      return 0;
    });

    return {
      mainType: establishedSorted[0] || null,
      secondaryType: establishedSorted[1] || null,
      minorTendencies: minorSorted.slice(0, 2),
    };
  }

  function resolveConflictWithQ16(evidence, current, q16Focus) {
    let mainType = current.mainType;
    let secondaryType = current.secondaryType;
    let complexityHint = null;

    if (!q16Focus || !CONFIG.Q16_FOCUS_MAP[q16Focus]) {
      return { mainType, secondaryType, complexityHint };
    }

    const q16T = CONFIG.Q16_FOCUS_MAP[q16Focus].defaultT;
    const q16Evidence = evidence[q16T];

    if (q16Evidence.evidenceLevel === 'none' || q16Evidence.evidenceLevel === 'weak') {
      return { mainType, secondaryType, complexityHint };
    }

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

    if (q16T === topT) {
      return { mainType: q16T, secondaryType, complexityHint: null };
    }

    const totalDiff = topEvidence.total - q16Evidence.total;
    if (totalDiff >= 2 || topEvidence.strongCount >= 2) {
      return {
        mainType: topT,
        secondaryType: q16T,
        complexityHint: 'conflicting_evidence',
      };
    }

    return { mainType: q16T, secondaryType: topT, complexityHint: null };
  }

  function determineSideHint(normalized, mainType) {
    if (!mainType) {
      const sides = [];
      for (const t of T_CODES) {
        for (const q of T_QUESTIONS[t]) sides.push(normalized[t][q].side);
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

    if (bilateralCount >= 2) return 'bilateral';
    if (leftCount === 0 && rightCount === 0) return 'unclear';

    const dominantSide = leftCount > rightCount ? 'left' : (rightCount > leftCount ? 'right' : null);
    if (!dominantSide) return 'bilateral';

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
    return dominantSide === 'left' ? 'left_weak' : 'right_weak';
  }

  function determineComplexityHint(evidence, establishedCount, sideHint, currentHint) {
    if (establishedCount >= 4) return 'high_complexity';
    if (currentHint === 'conflicting_evidence') return 'conflicting_evidence';
    if (establishedCount === 0) return 'low_evidence';

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

    if (sideHint === 'unclear') return 'side_unclear';
    return null;
  }

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

    let p1;
    if (set.includes('T5')) p1 = P1.T5_in_set;
    else if (set.includes('T2')) p1 = P1.T2_in_set_excludes_T5;
    else if (set.includes('T4')) p1 = P1.T4_in_set_excludes_T5_T2;
    else p1 = P1.only_T1_T3;

    const p2 = CONFIG.TRAINING_PRIORITY_TAGS.P2[mainType];
    const p3 = secondaryType ? CONFIG.TRAINING_PRIORITY_TAGS.P3[secondaryType] : null;
    const p4 = CONFIG.TRAINING_PRIORITY_TAGS.P4.fixed;

    const tags = [p1.tag, p2.tag];
    const texts = [p1.text, p2.text];
    if (p3) {
      tags.push(p3.tag);
      texts.push(p3.text);
    }
    tags.push(p4.tag);
    texts.push(p4.text);

    return { trainingPriorityTags: tags, trainingPriorityText: texts };
  }

  function generateResultSummary(mainType, secondaryType, complexityHint) {
    const templates = CONFIG.RESULT_SUMMARY_TEMPLATES;
    if (!mainType) {
      if (complexityHint === 'low_evidence') return templates.main_null_low_evidence;
      if (complexityHint === 'mixed_evidence') return templates.main_null_mixed_evidence;
      return templates.main_null_low_evidence;
    }
    if (complexityHint === 'high_complexity') return templates.main_with_high_complexity;
    if (complexityHint === 'conflicting_evidence') return templates.main_with_conflicting_evidence;
    if (secondaryType) {
      const key = `${mainType}_main_${secondaryType}_secondary`;
      if (templates[key]) return templates[key];
    }
    const keyNoSec = `${mainType}_main_no_secondary`;
    if (templates[keyNoSec]) return templates[keyNoSec];
    return templates.main_null_low_evidence;
  }

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

    const usedSet = new Set([mainType, secondaryType].filter(Boolean));
    const minorFiltered = initialSort.minorTendencies.filter((t) => !usedSet.has(t));

    const sideHint = determineSideHint(normalized, mainType);
    const establishedCount = candidates.established.length;
    const complexityHint = determineComplexityHint(evidence, establishedCount, sideHint, complexityHintFromConflict);

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

    return {
      mainType,
      mainTypeName,
      secondaryType,
      secondaryTypeName,
      minorTendencies,
      truthTendency: input.truthTendency || null,
      q16Focus: q16Focus,
      sideHint,
      complexityHint,
      trainingPriorityText,
      trainingPriorityTags,
      resultSummary,
    };
  }

  // 暴露到全局
  global.runSecondLayerV12 = runSecondLayer;
  global.loadEngineV12 = loadEngineV12;
  global.SecondLayerEngineV12 = {
    runSecondLayer,
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
    loadEngineV12,
    CONFIG: () => CONFIG,
  };
})(typeof window !== 'undefined' ? window : globalThis);