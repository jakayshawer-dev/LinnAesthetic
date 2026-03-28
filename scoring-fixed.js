// 评分规则配置 - 修复版

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

// 根据答案索引计算分数
function calculateScores(answerIndices) {
    const scores = initializeScores();
    
    // 将索引转换为值
    const answerValues = answerIndices.map((index, qIndex) => {
        if (index === null) return null;
        const option = questions[qIndex].options[index];
        return typeof option === 'object' ? option.value : index.toString();
    });
    
    // Q1: 哪一侧脸整体看起来更「大」
    if (answerValues[0] === 'left_bigger') {
        scores.leftScore += 2;
    } else if (answerValues[0] === 'right_bigger') {
        scores.rightScore += 2;
    }
    
    // Q2: 哪一侧更「紧、硬、鼓」
    if (answerValues[1] === 'left_tight') {
        scores.leftScore += 2;
        scores.muscleScore += 2;
    } else if (answerValues[1] === 'right_tight') {
        scores.rightScore += 2;
        scores.muscleScore += 2;
    }
    
    // Q3: 哪一侧更像「被拉偏」
    if (answerValues[2] === 'left_pulled') {
        scores.leftScore += 1;
        scores.fasciaScore += 2;
    } else if (answerValues[2] === 'right_pulled') {
        scores.rightScore += 1;
        scores.fasciaScore += 2;
    }
    
    // Q4: 哪一侧更像「被压扁」
    if (answerValues[3] === 'left_flat') {
        scores.leftScore += 1;
        scores.postureScore += 2;
    } else if (answerValues[3] === 'right_flat') {
        scores.rightScore += 1;
        scores.postureScore += 2;
    }
    
    // Q5: 哪一侧眼睛更「大、开、亮」
    if (answerValues[4] === 'left_eye') {
        scores.leftScore += 1;
        scores.dynamicScore += 2;
    } else if (answerValues[4] === 'right_eye') {
        scores.rightScore += 1;
        scores.dynamicScore += 2;
    }
    
    // Q6: 哪一侧眉毛更高或更挑
    if (answerValues[5] === 'left_brow') {
        scores.leftScore += 1;
        scores.habitScore += 2;
    } else if (answerValues[5] === 'right_brow') {
        scores.rightScore += 1;
        scores.habitScore += 2;
    }
    
    // Q7: 哪一侧嘴角更「高、翘、提」
    if (answerValues[6] === 'left_mouth') {
        scores.leftScore += 1;
        scores.habitScore += 2;
    } else if (answerValues[6] === 'right_mouth') {
        scores.rightScore += 1;
        scores.habitScore += 2;
    }
    
    // Q8: 哪一侧法令纹更「深、长、明显」
    if (answerValues[7] === 'left_nasolabial') {
        scores.leftScore += 1;
        scores.complexityScore += 1;
    } else if (answerValues[7] === 'right_nasolabial') {
        scores.rightScore += 1;
        scores.complexityScore += 1;
    }
    
    // Q9: 哪一侧下颌缘更「模糊、下垂、不清晰」
    if (answerValues[8] === 'left_jawline') {
        scores.leftScore += 1;
        scores.complexityScore += 1;
    } else if (answerValues[8] === 'right_jawline') {
        scores.rightScore += 1;
        scores.complexityScore += 1;
    }
    
    // Q10: 哪一侧耳朵位置更「高、前、外」
    if (answerValues[9] === 'left_ear') {
        scores.leftScore += 1;
        scores.complexityScore += 1;
    } else if (answerValues[9] === 'right_ear') {
        scores.rightScore += 1;
        scores.complexityScore += 1;
    }
    
    // Q11: 哪一侧头更「偏、歪、斜」
    if (answerValues[10] === 'left_head') {
        scores.leftScore += 1;
        scores.postureScore += 2;
    } else if (answerValues[10] === 'right_head') {
        scores.rightScore += 1;
        scores.postureScore += 2;
    }
    
    // Q12: 哪一侧肩膀更「高、耸、紧」
    if (answerValues[11] === 'left_shoulder') {
        scores.leftScore += 1;
        scores.postureScore += 2;
    } else if (answerValues[11] === 'right_shoulder') {
        scores.rightScore += 1;
        scores.postureScore += 2;
    }
    
    // 计算真假分
    const totalSideScore = scores.leftScore + scores.rightScore;
    if (totalSideScore > 0) {
        // 如果一侧明显高于另一侧，倾向于真性
        const diff = Math.abs(scores.leftScore - scores.rightScore);
        if (diff >= 4) {
            scores.trueScore = Math.min(8, diff * 1.5);
        } else {
            scores.falseScore = Math.min(8, (4 - diff) * 2);
        }
    }
    
    return scores;
}