// 评分规则配置

// 初始化分数对象
function initializeScores() {
    return {
        // 左右侧分
        leftScore: 0,
        rightScore: 0,
        
        // 真假分
        falseScore: 0,  // 假性分
        trueScore: 0,   // 真性分
        
        // 主问题方向分
        habitScore: 0,      // 习惯偏侧分
        muscleScore: 0,     // 肌肉分
        fasciaScore: 0,     // 筋膜分
        dynamicScore: 0,    // 动态控制分
        postureScore: 0,    // 体态代偿分
        
        // 复杂度分
        complexityScore: 0
    };
}

// 根据答案计算分数
function calculateScores(answers) {
    const scores = initializeScores();
    
    // Q1: 哪一侧脸整体看起来更「大」
    if (answers[0] === 'left_bigger') {
        scores.leftScore += 2;
    } else if (answers[0] === 'right_bigger') {
        scores.rightScore += 2;
    }
    
    // Q2: 哪一侧更「紧、硬、鼓」
    if (answers[1] === 'left_tight') {
        scores.leftScore += 2;
        scores.muscleScore += 2;
    } else if (answers[1] === 'right_tight') {
        scores.rightScore += 2;
        scores.muscleScore += 2;
    }
    
    // Q3: 哪一侧更像「被拉偏」
    if (answers[2] === 'left_pulled') {
        scores.leftScore += 1;
        scores.fasciaScore += 2;
    } else if (answers[2] === 'right_pulled') {
        scores.rightScore += 1;
        scores.fasciaScore += 2;
    }
    
    // Q4: 头摆正后差异减轻
    if (answers[3] === 'significantly_reduced') {
        scores.falseScore += 2;
        scores.postureScore += 1;
    } else if (answers[3] === 'slightly_reduced') {
        scores.falseScore += 1;
        scores.postureScore += 1;
    } else if (answers[3] === 'no_change') {
        scores.trueScore += 2;
    }
    
    // Q5: 平躺后差异减轻
    if (answers[4] === 'significantly_reduced_lying') {
        scores.falseScore += 2;
    } else if (answers[4] === 'slightly_reduced_lying') {
        scores.falseScore += 1;
    } else if (answers[4] === 'no_change_lying') {
        scores.trueScore += 2;
    }
    
    // Q6: 微笑说话时差异更明显
    if (answers[5] === 'significantly_more_obvious') {
        scores.dynamicScore += 3;
        scores.complexityScore += 2;
    } else if (answers[5] === 'slightly_more_obvious') {
        scores.dynamicScore += 2;
        scores.complexityScore += 1;
    }
    
    // Q7: 更像哪种情况
    if (answers[6] === 'type_a') {
        scores.muscleScore += 2;
    } else if (answers[6] === 'type_b') {
        scores.fasciaScore += 2;
    } else if (answers[6] === 'both_types') {
        scores.muscleScore += 1;
        scores.fasciaScore += 1;
        scores.complexityScore += 1;
    }
    
    // Q8: 长期单侧咀嚼
    if (answers[7] === 'often_chew') {
        scores.habitScore += 2;
        scores.muscleScore += 1;
        scores.complexityScore += 1;
    } else if (answers[7] === 'sometimes_chew') {
        scores.habitScore += 1;
    }
    
    // Q9: 表情控制差异
    if (answers[8] === 'obvious_control') {
        scores.dynamicScore += 3;
        scores.complexityScore += 2;
    } else if (answers[8] === 'slight_control') {
        scores.dynamicScore += 2;
        scores.complexityScore += 1;
    }
    
    // Q10: 长期固定姿势
    if (answers[9] === 'often_posture') {
        scores.falseScore += 1;
        scores.habitScore += 2;
        scores.postureScore += 1;
    } else if (answers[9] === 'sometimes_posture') {
        scores.habitScore += 1;
        scores.postureScore += 1;
    }
    
    // Q11: 高低肩歪脖子
    if (answers[10] === 'obvious_posture_issue') {
        scores.postureScore += 3;
        scores.falseScore += 1;
        scores.complexityScore += 1;
    } else if (answers[10] === 'sometimes_posture_issue') {
        scores.postureScore += 2;
    }
    
    // Q12: 旧伤史正畸史
    if (answers[11] === 'obvious_history') {
        scores.complexityScore += 3;
        scores.trueScore += 1;
    } else if (answers[11] === 'slight_history') {
        scores.complexityScore += 1;
    }
    
    return scores;
}

// 根据分数计算结果
function calculateResults(scores) {
    const results = {};
    
    // 1. 真假倾向
    if (scores.falseScore >= 4 && (scores.falseScore - scores.trueScore) >= 2) {
        results.tendency = "假性倾向";
        results.tendencyType = "false";
    } else if (scores.trueScore >= 4 && (scores.trueScore - scores.falseScore) >= 2) {
        results.tendency = "真性倾向";
        results.tendencyType = "true";
    } else {
        results.tendency = "混合倾向";
        results.tendencyType = "mixed";
    }
    
    // 2. 主问题方向
    const directionScores = [
        { name: "习惯偏侧方向", score: scores.habitScore, priority: 1 },
        { name: "肌肉软组织方向", score: scores.muscleScore, priority: 4 },
        { name: "筋膜位置牵拉方向", score: scores.fasciaScore, priority: 3 },
        { name: "动态控制方向", score: scores.dynamicScore, priority: 5 },
        { name: "体态代偿方向", score: scores.postureScore, priority: 2 }
    ];
    
    // 按分数排序，分数相同按优先级排序
    directionScores.sort((a, b) => {
        if (b.score === a.score) {
            return b.priority - a.priority; // 优先级高的在前
        }
        return b.score - a.score;
    });
    
    results.direction = directionScores[0].name;
    results.directionType = directionScores[0].name.replace(/方向$/, "").toLowerCase();
    
    // 3. 左右侧提示
    if (scores.leftScore >= 3 && scores.leftScore > scores.rightScore) {
        results.side = "左侧更明显";
        results.sideType = "left";
    } else if (scores.rightScore >= 3 && scores.rightScore > scores.leftScore) {
        results.side = "右侧更明显";
        results.sideType = "right";
    } else {
        results.side = "暂不明确";
        results.sideType = "unclear";
    }
    
    // 4. 复杂度提示
    if (scores.complexityScore >= 4 || 
        scores.dynamicScore >= 4 || 
        (scores.trueScore >= 4 && scores.dynamicScore >= 2)) {
        results.complexity = "建议进一步评估";
        results.complexityType = "advanced";
    } else {
        results.complexity = "一般初筛";
        results.complexityType = "basic";
    }
    
    // 存储原始分数用于调试
    results.scores = scores;
    
    return results;
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeScores,
        calculateScores,
        calculateResults
    };
}