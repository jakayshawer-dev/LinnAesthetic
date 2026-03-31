function calculateScores(answerValues) {
  const scores = { falseScore:0, trueScore:0, muscleScore:0, fasciaScore:0, dynamicScore:0, postureScore:0, habitScore:0, complexityScore:0, leftScore:0, rightScore:0 };

  if (answerValues[0] === 'left_bigger') scores.leftScore += 2;
  if (answerValues[0] === 'right_bigger') scores.rightScore += 2;

  if (answerValues[1] === 'left_tight') { scores.leftScore += 2; scores.muscleScore += 2; }
  else if (answerValues[1] === 'right_tight') { scores.rightScore += 2; scores.muscleScore += 2; }

  if (answerValues[2] === 'left_pulled') { scores.leftScore += 1; scores.fasciaScore += 2; }
  else if (answerValues[2] === 'right_pulled') { scores.rightScore += 1; scores.fasciaScore += 2; }

  if (answerValues[3] === 'significantly_reduced') { scores.falseScore += 2; scores.postureScore += 1; }
  else if (answerValues[3] === 'slightly_reduced') { scores.falseScore += 1; scores.postureScore += 1; }
  else if (answerValues[3] === 'no_change') { scores.trueScore += 2; }

  if (answerValues[4] === 'significantly_reduced_lying') scores.falseScore += 2;
  else if (answerValues[4] === 'slightly_reduced_lying') scores.falseScore += 1;
  else if (answerValues[4] === 'no_change_lying') scores.trueScore += 2;

  if (answerValues[5] === 'significantly_more_obvious') { scores.dynamicScore += 3; scores.complexityScore += 2; }
  else if (answerValues[5] === 'slightly_more_obvious') { scores.dynamicScore += 2; scores.complexityScore += 1; }

  if (answerValues[6] === 'type_a') scores.muscleScore += 2;
  else if (answerValues[6] === 'type_b') scores.fasciaScore += 2;
  else if (answerValues[6] === 'both_types') { scores.muscleScore += 1; scores.fasciaScore += 1; scores.complexityScore += 1; }

  if (answerValues[7] === 'often_chew') { scores.habitScore += 2; scores.muscleScore += 1; scores.complexityScore += 1; }
  else if (answerValues[7] === 'sometimes_chew') { scores.habitScore += 1; scores.muscleScore += 1; }

  if (answerValues[8] === 'obvious_control') { scores.dynamicScore += 3; scores.complexityScore += 2; }
  else if (answerValues[8] === 'slight_control') { scores.dynamicScore += 2; scores.complexityScore += 1; }

  if (answerValues[9] === 'often_posture') { scores.falseScore += 1; scores.habitScore += 2; scores.postureScore += 1; }
  else if (answerValues[9] === 'sometimes_posture') { scores.habitScore += 1; scores.postureScore += 1; }

  if (answerValues[10] === 'obvious_posture_issue') { scores.postureScore += 3; scores.falseScore += 1; scores.complexityScore += 1; }
  else if (answerValues[10] === 'sometimes_posture_issue') { scores.postureScore += 2; scores.falseScore += 1; }

  if (answerValues[11] === 'obvious_history') { scores.complexityScore += 3; scores.trueScore += 1; }
  else if (answerValues[11] === 'slight_history') { scores.complexityScore += 1; }

  return scores;
}

function calculateResults(scores) {
  let tendency = '混合倾向';
  if (scores.falseScore >= 4 && scores.falseScore - scores.trueScore >= 2) tendency = '假性倾向';
  else if (scores.trueScore >= 4 && scores.trueScore - scores.falseScore >= 2) tendency = '真性倾向';

  const directions = [
    { label: '动态控制方向', value: scores.dynamicScore, priority: 5 },
    { label: '体态代偿方向', value: scores.postureScore, priority: 4 },
    { label: '筋膜位置牵拉方向', value: scores.fasciaScore, priority: 3 },
    { label: '肌肉软组织方向', value: scores.muscleScore, priority: 2 },
    { label: '习惯偏侧方向', value: scores.habitScore, priority: 1 }
  ].sort((a,b) => b.value !== a.value ? b.value - a.value : b.priority - a.priority);

  let side = '暂不明确';
  if (scores.leftScore >= 3 && scores.leftScore > scores.rightScore) side = '左侧更明显';
  else if (scores.rightScore >= 3 && scores.rightScore > scores.leftScore) side = '右侧更明显';

  const complexity = (scores.complexityScore >= 4 || scores.dynamicScore >= 4 || (scores.trueScore >= 4 && scores.dynamicScore >= 2))
    ? '建议进一步评估'
    : '一般初筛';

  return { tendency, direction: directions[0].label, side, complexity };
}
