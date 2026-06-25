/**
 * LAA第二层进阶评估结果引擎 - final-v3 (浏览器版本)
 * 基于确认版执行口径实现
 * 文件来源：
 * 1. LAA_第二层组合调用表_OPENCLAW执行初版_v3.docx
 * 2. LAA_第二层进阶评估整理总表_续写版.docx
 * 3. LAA_第二层进阶评估整理总表_执行补充版.docx
 * 
 * 重要原则：
 * - 完全使用文档原词，不进行任何归纳、改写或创造
 * - 遵循"可执行骨架 + 已有示例行 + 待补空位"的设计
 * - 实现"主模板 + 变量系统"的压缩架构
 */

// 导入配置文件 - final-v3 (浏览器版本)
import config from './second-layer-config-final-v3.json' assert { type: 'json' };

class SecondLayerEngine {
  constructor() {
    this.templates = config.templates.templates;
    this.firstLayerVars = config.firstLayerVariables.variables;
    this.secondLayerQuestions = config.secondLayerVariables.questions;
    this.priorityRules = config.priorityRules.rules;
    this.callTableFields = config.callTableStructure.fields;
    
    // 初始化规则库（基于确认版执行口径）
    this.ruleLibrary = this.initializeRuleLibrary();
  }
  
  /**
   * 初始化规则库 - 基于确认版执行口径
   * 包含已确认的正式规则主线
   */
  initializeRuleLibrary() {
    return {
      // T1动态控制线规则 - 已实现
      "T1-R01": {
        ruleId: "T1-R01",
        truthTendency: "待匹配",
        mainProblemDirection: "动态控制方向",
        sideHint: "待匹配",
        complexityHint: "待匹配",
        Q1: "微笑或说话时更明显",
        Q2: "某一侧表情或发力更常用",
        Q3: "静态还好，但一动起来就更明显",
        Q4: "待匹配",
        mainTemplate: "T1",
        mainLabel: "口周/口角动态控制失衡型",
        priorityDirection: "先处理动态控制失衡",
        remark: "T1动态控制线 - 基础规则",
        source: "确认版执行口径 T1-R01",
        status: "implemented"
      },
      "T1-R02": {
        ruleId: "T1-R02",
        truthTendency: "待匹配",
        mainProblemDirection: "待匹配",
        sideHint: "待匹配",
        complexityHint: "待匹配",
        Q1: "微笑或说话时更明显",
        Q2: "某一侧表情或发力更常用",
        Q3: ["静态还好，但一动起来就更明显", "长期都比较稳定，位置和感觉差不多"],
        Q4: "待匹配",
        mainTemplate: "T1",
        mainLabel: "口周/口角动态控制失衡型",
        priorityDirection: "先处理动态控制失衡",
        remark: "T1动态控制线 - 第一层方向不强时",
        source: "确认版执行口径 T1-R02",
        status: "implemented"
      },
      "T1-R05": {
        ruleId: "T1-R05",
        truthTendency: "待匹配",
        mainProblemDirection: "待匹配",
        sideHint: "待匹配",
        complexityHint: "待匹配",
        Q1: "微笑或说话时更明显",
        Q2: "待匹配",
        Q3: "有时觉得左边明显，有时又觉得右边明显",
        Q4: "待匹配",
        mainTemplate: "T5",
        mainLabel: "复合波动型",
        priorityDirection: "先理清波动原因",
        remark: "T1动态控制线 - Q3=C时直升T5",
        source: "确认版执行口径 T1-R05",
        status: "implemented"
      },
      
      // T1动态控制线规则 - TODO（结构保留）
      "T1-R03": {
        ruleId: "T1-R03",
        truthTendency: "待匹配",
        mainProblemDirection: "待匹配",
        sideHint: "待匹配",
        complexityHint: "待匹配",
        Q1: "微笑或说话时更明显",
        Q2: "待匹配",
        Q3: "静态还好，但一动起来就更明显",
        Q4: "待匹配",
        mainTemplate: "T1",
        mainLabel: "口周/口角动态控制失衡型",
        priorityDirection: "先处理动态控制失衡",
        remark: "T1动态控制线 - 缺乏咀嚼或位置牵拉证据 (TODO: excludeConditions未实现)",
        source: "确认版执行口径 T1-R03",
        status: "todo",
        todoNote: "excludeConditions当前匹配器不支持"
      },
      "T1-R04": {
        ruleId: "T1-R04",
        truthTendency: "待匹配",
        mainProblemDirection: "待匹配",
        sideHint: "待匹配",
        complexityHint: "待匹配",
        Q1: "微笑或说话时更明显",
        Q2: "某一侧表情或发力更常用",
        Q3: "待匹配",
        Q4: "待匹配",
        mainTemplate: "T1",
        mainLabel: "口周/口角动态控制失衡型",
        priorityDirection: "先处理动态控制失衡",
        remark: "T1动态控制线 - 无明确单侧咀嚼证据 (TODO: excludeConditions未实现)",
        source: "确认版执行口径 T1-R04",
        status: "todo",
        todoNote: "excludeConditions当前匹配器不支持"
      },
      
      // T2咀嚼代偿线规则 - 已实现
      "T2-R01": {
        ruleId: "T2-R01",
        truthTendency: "待匹配",
        mainProblemDirection: "待匹配",
        sideHint: "待匹配",
        complexityHint: "待匹配",
        Q1: "咀嚼或用力时更明显",
        Q2: "单侧咀嚼比较明显",
        Q3: ["长期都比较稳定，位置和感觉差不多", "静态还好，但一动起来就更明显"],
        Q4: "待匹配",
        mainTemplate: "T2",
        mainLabel: "咀嚼/下颌使用代偿型",
        priorityDirection: "先处理咀嚼代偿",
        remark: "T2咀嚼代偿线 - 基础规则",
        source: "确认版执行口径 T2-R01",
        status: "implemented"
      },
      "T2-R04": {
        ruleId: "T2-R04",
        truthTendency: "待匹配",
        mainProblemDirection: "肌肉-软组织方向",
        sideHint: "待匹配",
        complexityHint: "待匹配",
        Q1: "咀嚼或用力时更明显",
        Q2: "没有明显感觉，或不确定",
        Q3: "待匹配",
        Q4: "待匹配",
        mainTemplate: "T3",
        mainLabel: "静态轮廓/软组织张力偏差型",
        priorityDirection: "先处理软组织张力",
        remark: "T2咀嚼代偿线 - 退回T3",
        source: "确认版执行口径 T2-R04",
        status: "implemented"
      },
      "T2-R05": {
        ruleId: "T2-R05",
        truthTendency: "待匹配",
        mainProblemDirection: "待匹配",
        sideHint: "待匹配",
        complexityHint: "待匹配",
        Q1: "咀嚼或用力时更明显",
        Q2: "单侧咀嚼比较明显",
        Q3: "有时觉得左边明显，有时又觉得右边明显",
        Q4: "待匹配",
        mainTemplate: "T5",
        mainLabel: "复合波动型",
        priorityDirection: "先理清波动原因",
        remark: "T2咀嚼代偿线 - Q3=C时直升T5",
        source: "确认版执行口径 T2-R05",
        status: "implemented"
      },
      
      // T2咀嚼代偿线规则 - TODO（结构保留）
      "T2-R02": {
        ruleId: "T2-R02",
        truthTendency: "待匹配",
        mainProblemDirection: "待匹配",
        sideHint: "待匹配",
        complexityHint: "待匹配",
        Q1: "咀嚼或用力时更明显",
        Q2: "单侧咀嚼比较明显",
        Q3: "待匹配",
        Q4: "待匹配",
        mainTemplate: "T2",
        mainLabel: "咀嚼/下颌使用代偿型",
        priorityDirection: "先处理咀嚼代偿",
        remark: "T2咀嚼代偿线 - 即使Q4=A也留T2 (TODO: strength字段未实现)",
        source: "确认版执行口径 T2-R02",
        status: "todo",
        todoNote: "strength字段当前匹配器不支持"
      },
      "T2-R03": {
        ruleId: "T2-R03",
        truthTendency: "待匹配",
        mainProblemDirection: "待匹配",
        sideHint: "待匹配",
        complexityHint: "待匹配",
        Q1: ["静态拍照时更明显", "咀嚼或用力时更明显"],
        Q2: "单侧咀嚼比较明显",
        Q3: "待匹配",
        Q4: "为什么一边脸看起来更大",
        mainTemplate: "T2",
        mainLabel: "咀嚼/下颌使用代偿型",
        priorityDirection: "先处理咀嚼代偿",
        remark: "T2咀嚼代偿线 - 第一层方向模糊但Q2=A明确 (TODO: mainProblemDirection=模糊)",
        source: "确认版执行口径 T2-R03",
        status: "todo",
        todoNote: "mainProblemDirection=模糊不在配置允许范围内"
      },
      
      // 旧示例规则（标记为legacy，不参与当前确认版匹配）
      "R102-LEGACY": {
        ruleId: "R102-LEGACY",
        truthTendency: "真性倾向",
        mainProblemDirection: "肌肉-软组织方向",
        sideHint: "右侧更明显",
        complexityHint: "建议进一步评估",
        Q1: "静态拍照时更明显",
        Q2: "单侧托脸、侧睡或偏向一侧支撑比较明显",
        Q3: "长期都比较稳定",
        Q4: "我更想先知道问题主次和处理顺序",
        mainTemplate: "T3",
        mainLabel: "稳定型偏差",
        priorityDirection: "先处理右侧高张层，再减支撑牵连",
        remark: "来源：模板3 示例B（legacy规则，不参与确认版匹配）",
        source: "文件1第9行",
        status: "legacy"
      }
    };
  }
  
  /**
   * 根据输入数据确定主模板
   * 遵循文件2中的分流优先级规则
   * @param {Object} inputData - 包含第一层和第二层数据
   * @returns {Object} 匹配结果
   */
  determineMainTemplate(inputData) {
    const result = {
      matched: false,
      template: null,
      rule: null,
      priorityLog: []
    };
    
    // 记录分流过程
    result.priorityLog.push("开始第二层模板分流...");
    
    // 第一优先级：先看 Q1（文件2第14行）
    result.priorityLog.push("第一优先级：先看 Q1 - 决定问题最容易在什么状态下暴露");
    const q1Value = inputData.Q1;
    
    // 第二优先级：再看第一层主问题方向（文件2第14行）
    result.priorityLog.push("第二优先级：再看第一层主问题方向 - 校正 Q1，避免只凭一个场景就误分模板");
    const mainDirection = inputData.mainProblemDirection;
    
    // 第三优先级：再看 Q2（文件2第14行）
    result.priorityLog.push("第三优先级：再看 Q2 - 帮助把结果落到更具体的参与层");
    const q2Value = inputData.Q2;
    
    // 第四优先级：再看 Q3（文件2第14行）
    result.priorityLog.push("第四优先级：再看 Q3 - 决定是否需要升级为'复合波动型'");
    const q3Value = inputData.Q3;
    
    // 第五优先级：最后看 Q4（文件2第10行）
    result.priorityLog.push("第五优先级：最后看 Q4 - 修正文案重心和结果页前置顺序");
    const q4Value = inputData.Q4;
    
    // 第一优先级：检查T5直升条件
    const t5TriggerResult = this.checkT5DirectTrigger(inputData);
    if (t5TriggerResult.triggered) {
      result.matched = true;
      result.rule = this.getT5Rule();
      result.template = this.getTemplateById("T5");
      result.priorityLog.push(`触发T5条件: ${t5TriggerResult.reason}`);
      return result;
    }
    
    // 第二优先级：按规则库顺序匹配（跳过todo和legacy规则）
    for (const ruleId in this.ruleLibrary) {
      const rule = this.ruleLibrary[ruleId];
      
      if (this.isRuleMatch(rule, inputData)) {
        result.matched = true;
        result.rule = rule;
        result.template = this.getTemplateById(rule.mainTemplate);
        result.priorityLog.push(`匹配到规则: ${rule.ruleId}`);
        return result;
      }
    }
    
    // 无匹配规则，使用统一兜底
    result.matched = false;
    result.template = this.getDefaultTemplate();
    result.priorityLog.push("未找到完全匹配的规则，使用统一兜底模板");
    
    return result;
  }
  
  /**
   * 检查T5直接触发条件
   * @param {Object} inputData - 输入数据
   * @returns {Object} 触发结果
   */
  checkT5DirectTrigger(inputData) {
    // T5触发条件1: Q3=C（已实现）
    if (inputData.Q3 === "有时觉得左边明显，有时又觉得右边明显") {
      return {
        triggered: true,
        reason: "Q3=C（有时觉得左边明显，有时又觉得右边明显）",
        condition: "implemented"
      };
    }
    
    // T5触发条件2: Q1 / 第一层方向 / Q2 三者打架（TODO）
    // 当前未实现，需要复杂逻辑判断
    
    // T5触发条件3: 明显动态问题与单侧咀嚼/支撑问题并存（TODO）
    // 当前未实现，需要复杂逻辑判断
    
    return {
      triggered: false,
      reason: "未触发T5条件",
      condition: "none"
    };
  }
  
  /**
   * 获取T5规则
   * @returns {Object} T5规则对象
   */
  getT5Rule() {
    return {
      ruleId: "T5-FALLBACK",
      truthTendency: "待匹配",
      mainProblemDirection: "待匹配",
      sideHint: "待匹配",
      complexityHint: "待匹配",
      Q1: "待匹配",
      Q2: "待匹配",
      Q3: "待匹配",
      Q4: "待匹配",
      mainTemplate: "T5",
      mainLabel: "复合波动型",
      priorityDirection: "先理清整体逻辑，再决定处理顺序",
      remark: "统一兜底规则 - 无明显命中或多条条件都像时",
      source: "确认版执行口径 - 统一兜底",
      status: "implemented"
    };
  }
  
  /**
   * 检查规则是否匹配
   * @param {Object} rule - 规则对象
   * @param {Object} inputData - 输入数据
   * @returns {boolean} 是否匹配
   */
  isRuleMatch(rule, inputData) {
    // 跳过legacy和todo规则
    if (rule.status === "legacy" || rule.status === "todo") {
      return false;
    }
    
    // 检查必需字段匹配
    const requiredFields = ['Q1', 'Q2', 'Q3', 'mainProblemDirection'];
    
    for (const field of requiredFields) {
      if (rule[field] === "待匹配") {
        // 规则中该字段为"待匹配"，跳过检查
        continue;
      }
      
      if (Array.isArray(rule[field])) {
        // 规则中该字段为数组，检查是否包含输入值
        if (!rule[field].includes(inputData[field])) {
          return false;
        }
      } else {
        // 规则中该字段为单一值，检查是否相等
        if (rule[field] !== inputData[field]) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * 根据模板ID获取模板
   * @param {string} templateId - 模板ID
   * @returns {Object|null} 模板对象
   */
  getTemplateById(templateId) {
    // 完整模板映射
    const templateMap = {
      'T1': 'template1', // 口周 / 口角动态控制失衡型
      'T2': 'template2', // 咀嚼 / 下颌使用代偿型
      'T3': 'template3', // 静态轮廓 / 软组织张力偏差型
      'T4': 'template4', // 位置牵拉 / 头颈支撑牵连型
      'T5': 'template5'  // 复合波动型
    };
    
    const mappedId = templateMap[templateId];
    if (mappedId) {
      return this.templates.find(t => t.id === mappedId);
    }
    
    return null;
  }
  
  /**
   * 获取默认模板（兜底逻辑）
   * @returns {Object} 默认模板
   */
  getDefaultTemplate() {
    // 统一兜底规则：无明显命中，或多条条件都像时，统一走T5
    return this.templates.find(t => t.id === 'template5');
  }
  
  /**
   * 生成第二层结果
   * 遵循"主模板 + 变量系统"原则
   * @param {Object} inputData - 输入数据
   * @param {Object} templateResult - 模板匹配结果
   * @returns {Object} 第二层结果
   */
  generateSecondLayerResult(inputData, templateResult) {
    const result = {
      // 基础信息
      assessmentId: this.generateAssessmentId(),
      timestamp: new Date().toISOString(),
      
      // 第一层数据（保持不变）
      firstLayer: {
        truthTendency: inputData.truthTendency,
        mainProblemDirection: inputData.mainProblemDirection,
        sideHint: inputData.sideHint,
        complexityHint: inputData.complexityHint
      },
      
      // 第二层数据
      secondLayer: {
        Q1: inputData.Q1,
        Q2: inputData.Q2,
        Q3: inputData.Q3,
        Q4: inputData.Q4
      },
      
      // 模板匹配结果
      templateMatch: {
        matched: templateResult.matched,
        templateId: templateResult.template ? templateResult.template.id : null,
        templateName: templateResult.template ? templateResult.template.name : null,
        ruleId: templateResult.rule ? templateResult.rule.ruleId : null,
        ruleStatus: templateResult.rule ? templateResult.rule.status : null
      },
      
      // 生成的结果内容（基于模板和变量替换）
      generatedResult: this.generateResultContent(templateResult, inputData),
      
      // 分流过程日志
      priorityLog: templateResult.priorityLog,
      
      // 系统信息
      systemInfo: {
        version: config.version,
        dataSource: config.dataSource,
        implementationStatus: config.implementationStatus.currentPhase
      }
    };
    
    return result;
  }
  
  /**
   * 生成评估ID
   * @returns {string} 评估ID
   */
  generateAssessmentId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `LAA2-${timestamp}-${random}`;
  }
  
  /**
   * 生成结果内容（基于模板和变量替换）
   * @param {Object} templateResult - 模板匹配结果
   * @param {Object} inputData - 输入数据
   * @returns {Object} 生成的结果内容
   */
  generateResultContent(templateResult, inputData) {
    const template = templateResult.template;
    const rule = templateResult.rule;
    
    if (!template) {
      return {
        error: "未找到匹配的模板",
        fallbackMessage: "系统正在处理您的评估结果，请稍后查看..."
      };
    }
    
    // 基础结果结构
    const result = {
      // 主标题（基于模板名称）
      mainTitle: template.name,
      
      // 主描述（基于模板描述）
      mainDescription: template.description,
      
      // 具体分析（基于规则和输入数据）
      analysis: this.generateAnalysisContent(rule, inputData),
      
      // 优先处理方向（如果有规则）
      priorityDirection: rule ? rule.priorityDirection : "待系统进一步分析",
      
      // 备注信息
      remarks: rule ? rule.remark : "系统自动生成结果",
      
      // 变量替换标记
      variableReplacements: this.getVariableReplacements(inputData)
    };
    
    return result;
  }
  
  /**
   * 生成分析内容
   * @param {Object} rule - 匹配的规则
   * @param {Object} inputData - 输入数据
   * @returns {string} 分析内容
   */
  generateAnalysisContent(rule, inputData) {
    if (!rule) {
      return "根据您提供的信息，系统正在进行分析...";
    }
    
    // 基于确认版执行口径生成分析内容
    let analysis = `根据您的评估结果：\n\n`;
    
    // 添加变量替换句库内容
    analysis += this.getVariableSentence('truthTendency', inputData.truthTendency) + '\n';
    analysis += this.getVariableSentence('sideHint', inputData.sideHint) + '\n';
    analysis += this.getVariableSentence('complexityHint', inputData.complexityHint) + '\n\n';
    
    // 添加主模板信息
    analysis += `主要分析方向：${rule.mainLabel}\n`;
    analysis += `• 问题暴露场景：${inputData.Q1}\n`;
    analysis += `• 偏侧使用习惯：${inputData.Q2}\n`;
    analysis += `• 不对称感受变化：${inputData.Q3}\n`;
    
    // 添加Q4重心（只改前两段重心，不改主模板）
    if (inputData.Q4 && inputData.Q4 !== "待定") {
      analysis += `\n${this.getVariableSentence('q4Focus', inputData.Q4)}\n`;
    }
    
    // 添加优先处理方向
    if (rule.priorityDirection && rule.priorityDirection !== "待定") {
      analysis += `\n💡 优先处理方向：${rule.priorityDirection}\n`;
    }
    
    return analysis;
  }
  
  /**
   * 获取变量替换句子
   * @param {string} variableType - 变量类型
   * @param {string} value - 变量值
   * @returns {string} 对应的句子
   */
  getVariableSentence(variableType, value) {
    // 从配置中获取变量句库
    const sentences = config.variableSentences;
    
    switch(variableType) {
      case 'truthTendency':
        return sentences.truthTendency[value] || `倾向类型：${value}`;
      case 'sideHint':
        return sentences.sideHint[value] || `表现侧别：${value}`;
      case 'complexityHint':
        return sentences.complexityHint[value] || `复杂程度：${value}`;
      case 'q4Focus':
        return sentences.q4Focus[value] || `优先关注：${value}`;
      default:
        return '';
    }
  }
  
  /**
   * 获取变量替换列表
   * @param {Object} inputData - 输入数据
   * @returns {Array} 变量替换列表
   */
  getVariableReplacements(inputData) {
    return [
      { variable: "真假倾向", value: inputData.truthTendency },
      { variable: "左右侧提示", value: inputData.sideHint },
      { variable: "复杂度提示", value: inputData.complexityHint },
      { variable: "Q4重心", value: inputData.Q4 || "待定" }
    ];
  }
  
  /**
   * 验证输入数据
   * @param {Object} inputData - 输入数据
   * @returns {Object} 验证结果
   */
  validateInputData(inputData) {
    const errors = [];
    const warnings = [];
    
    // 检查必需的第一层字段
    const requiredFirstLayerFields = [
      'truthTendency',
      'mainProblemDirection',
      'sideHint',
      'complexityHint'
    ];
    
    requiredFirstLayerFields.forEach(field => {
      if (!inputData[field]) {
        errors.push(`缺少必需的第一层字段: ${field}`);
      }
    });
    
    // 检查第二层字段（Q4可能为空）
    const secondLayerFields = ['Q1', 'Q2', 'Q3'];
    secondLayerFields.forEach(field => {
      if (!inputData[field]) {
        warnings.push(`第二层字段 ${field} 为空，可能影响匹配精度`);
      }
    });
    
    // 检查字段值是否在允许范围内
    if (inputData.truthTendency) {
      const allowedTruthTendencies = ["假性倾向", "混合倾向", "真性倾向"];
      if (!allowedTruthTendencies.includes(inputData.truthTendency)) {
        errors.push(`真假倾向值无效: ${inputData.truthTendency}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors,
      warnings: warnings
    };
  }
}

// 导出引擎类
export default SecondLayerEngine;