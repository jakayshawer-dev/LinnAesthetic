// 评分规则配置 - 与 questions.js 匹配的版本

function initializeScores() {
    return {
        falseScore: 0,      // 假性分
        trueScore: 0,       // 真性分
        muscleScore: 0,     // 肌肉软组织方向
        fasciaScore: 0,     // 筋膜位置牵拉方向
        dynamicScore: 0,    // 动态控制方向
        postureScore: 0,    // 体态代偿方向
        habitScore: 0,      // 习惯偏侧方向
        complexityScore: 0, // 复杂度
        leftScore: 0,       // 左侧总分
        rightScore: 0       // 右侧总分
    };
}

// 计算分数
// answerValues: 用户选择的选项 value 字符串数组，例如 ['left_bigger', 'right_tight', 'not_sure', ...]
function calculateScores(answerValues) {
    const scores = initializeScores();

    // Q1: 哪一侧脸整体看起来更「大」
    if (answerValues[0] === 'left_bigger') scores.leftScore += 2;
    if (answerValues[0] === 'right_bigger') scores.rightScore += 2;

    // Q2: 哪一侧更「紧、硬、鼓」
    if (answerValues[1] === 'left_tight') { scores.leftScore += 2; scores.muscleScore += 2; }
    else if (answerValues[1] === 'right_tight') { scores.rightScore += 2; scores.muscleScore += 2; }

    // Q3: 哪一侧更像「被拉偏」
    if (answerValues[2] === 'left_pulled') { scores.leftScore += 1; scores.fasciaScore += 2; }
    else if (answerValues[2] === 'right_pulled') { scores.rightScore += 1; scores.fasciaScore += 2; }

    // Q4: 把头自然摆正后，左右差异会不会减轻？
    if (answerValues[3] === 'significantly_reduced') { scores.falseScore += 2; scores.postureScore += 1; }
    else if (answerValues[3] === 'slightly_reduced') { scores.falseScore += 1; scores.postureScore += 1; }
    else if (answerValues[3] === 'no_change') { scores.trueScore += 2; }

    // Q5: 平躺后，左右差异会不会减轻？
    if (answerValues[4] === 'significantly_reduced_lying') scores.falseScore += 2;
    else if (answerValues[4] === 'slightly_reduced_lying') scores.falseScore += 1;
    else if (answerValues[4] === 'no_change_lying') scores.trueScore += 2;

    // Q6: 微笑或说话时，两边差异会不会更明显？
    if (answerValues[5] === 'significantly_more_obvious') { scores.dynamicScore += 3; scores.complexityScore += 2; }
    else if (answerValues[5] === 'slightly_more_obvious') { scores.dynamicScore += 2; scores.complexityScore += 1; }

    // Q7: 更像A厚硬鼓 还是 B被拉偏
    if (answerValues[6] === 'type_a') scores.muscleScore += 2;
    else if (answerValues[6] === 'type_b') scores.fasciaScore += 2;
    else if (answerValues[6] === 'both_types') { scores.muscleScore += 1; scores.fasciaScore += 1; scores.complexityScore += 1; }

    // Q8: 是否长期有一侧咀嚼更多、咬得更用力？
    if (answerValues[7] === 'often_chew') { scores.habitScore += 2; scores.muscleScore += 1; scores.complexityScore += 1; }
    else if (answerValues[7] === 'sometimes_chew') { scores.habitScore += 1; scores.muscleScore += 1; }

    // Q9: 是否感觉一侧表情启动更慢、控制更差？
    if (answerValues[8] === 'obvious_control') { scores.dynamicScore += 3; scores.complexityScore += 2; }
    else if (answerValues[8] === 'slight_control') { scores.dynamicScore += 2; scores.complexityScore += 1; }

    // Q10: 是否长期固定同一侧侧睡、托腮或歪头？
    if (answerValues[9] === 'often_posture') { scores.falseScore += 1; scores.habitScore += 2; scores.postureScore += 1; }
    else if (answerValues[9] === 'sometimes_posture') { scores.habitScore += 1; scores.postureScore += 1; }

    // Q11: 是否明显有高低肩、歪脖子或一侧颈部总更紧？
    if (answerValues[10] === 'obvious_posture_issue') { scores.postureScore += 3; scores.falseScore += 1; scores.complexityScore += 1; }
    else if (answerValues[10] === 'sometimes_posture_issue') { scores.postureScore += 2; scores.falseScore += 1; }

    // Q12: 是否有旧伤史、正畸史，或咬合/下巴轨迹长期不顺？
    if (answerValues[11] === 'obvious_history') { scores.complexityScore += 3; scores.trueScore += 1; }
    else if (answerValues[11] === 'slight_history') { scores.complexityScore += 1; }

    return scores;
}

// 计算结果
function calculateResults(scores) {
    // 1. 真假倾向
    let tendency = '混合倾向';
    if (scores.falseScore >= 4 && scores.falseScore - scores.trueScore >= 2) tendency = '假性倾向';
    else if (scores.trueScore >= 4 && scores.trueScore - scores.falseScore >= 2) tendency = '真性倾向';

    // 2. 主问题方向（取分数最高的方向）
    const directions = [
        { label: '动态控制方向', value: scores.dynamicScore, priority: 5 },
        { label: '体态代偿方向', value: scores.postureScore, priority: 4 },
        { label: '筋膜位置牵拉方向', value: scores.fasciaScore, priority: 3 },
        { label: '肌肉软组织方向', value: scores.muscleScore, priority: 2 },
        { label: '习惯偏侧方向', value: scores.habitScore, priority: 1 }
    ].sort((a, b) => b.value !== a.value ? b.value - a.value : b.priority - a.priority);

    // 3. 左右侧
    let side = '暂不明确';
    if (scores.leftScore >= 3 && scores.leftScore > scores.rightScore) side = '左侧更明显';
    else if (scores.rightScore >= 3 && scores.rightScore > scores.leftScore) side = '右侧更明显';

    // 4. 复杂度
    const complexity = (scores.complexityScore >= 4 || scores.dynamicScore >= 4 || (scores.trueScore >= 4 && scores.dynamicScore >= 2))
        ? '建议进一步评估'
        : '一般初筛';

    return { tendency, direction: directions[0].label, side, complexity };
}
