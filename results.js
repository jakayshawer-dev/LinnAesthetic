// 结果文案配置 - 与 scoring.js 匹配版本

const resultTexts = {
    // A句：真假倾向
    // scoring.js 输出: '假性倾向' | '混合倾向' | '真性倾向'
    tendency: {
        '假性倾向': {
            title: "假性倾向",
            descriptions: [
                "从这次自测结果看，你目前更偏向假性大小脸。",
                "你现在看到的左右差异，更像是受头位、体态或日常使用习惯影响的类型。",
                "目前这类不对称更偏向假性表现，也就是差异会受到姿势和用力方式放大。"
            ]
        },
        '混合倾向': {
            title: "混合倾向",
            descriptions: [
                "从这次自测结果看，你目前更偏向真假性混合倾向。",
                "你现在看到的左右差异，可能不只是单纯姿势问题，也不完全只是稳定结构差异。",
                "目前这类不对称更像是多种因素一起参与，既有代偿放大，也可能已经叠加了更稳定的面部失衡。"
            ]
        },
        '真性倾向': {
            title: "真性倾向",
            descriptions: [
                "从这次自测结果看，你目前更偏向真性大小脸。",
                "你现在看到的左右差异，更像已经固定在面部本身，而不只是拍照角度或暂时头位造成的视觉偏差。",
                "目前这类不对称更偏向稳定存在的面部失衡，说明问题可能不只是姿势变化带来的表面差异。"
            ]
        }
    },

    // B句：主方向
    direction: {
        "习惯偏侧方向": {
            descriptions: [
                "结合你的回答，问题更像长期单侧使用慢慢积累出来的不对称表现。",
                "这类情况常见的放大因素，包括单侧咀嚼、固定侧睡、托腮，或长期偏向一边用力。",
                "从目前的表现看，你的问题更偏向习惯偏侧参与较多，而不是单一块组织突然变化。"
            ]
        },
        "肌肉软组织方向": {
            descriptions: [
                "结合你的回答，问题更偏向面部软组织和肌肉主动发力不均。",
                "这类情况通常会表现为一侧更厚、更硬、更鼓，另一侧则更松或更弱。",
                "从目前的表现看，你的问题重点更像在肌肉募集不均和软组织厚薄差上。"
            ]
        },
        "筋膜位置牵拉方向": {
            descriptions: [
                "结合你的回答，问题更偏向位置和牵拉链偏移较明显的类型。",
                "这类情况的重点不只是「哪边更大」，而是哪边更像被整条张力链拉偏了位置。",
                "从目前的表现看，你的问题更像方向和位置发生了偏移，而不只是单纯厚薄差。"
            ]
        },
        "动态控制方向": {
            descriptions: [
                "结合你的回答，问题更偏向动态控制不平衡较明显的类型。",
                "这类情况往往静态不一定最突出，但一到微笑、说话或做表情时，左右差异会更明显。",
                "从目前的表现看，你的问题重点更像左右两边的启动速度和控制程序不够一致。"
            ]
        },
        "体态代偿方向": {
            descriptions: [
                "结合你的回答，问题更偏向头颈体态参与较多的类型。",
                "这类情况常见的特点是，脸上看到的差异不一定全是脸本身造成的，还可能和脖子、肩膀及整体代偿有关。",
                "从目前的表现看，你的问题更像是头颈位置和代偿链，把面部不对称进一步放大了。"
            ]
        }
    },

    // C句：左右侧
    // scoring.js 输出: '左侧更明显' | '右侧更明显' | '暂不明确'
    side: {
        '左侧更明显': {
            title: "左侧更明显",
            descriptions: [
                "从你的回答看，当前左侧表现可能更明显。",
                "目前的差异更可能集中在左侧的紧张、厚度、偏移或控制变化上。"
            ]
        },
        '右侧更明显': {
            title: "右侧更明显",
            descriptions: [
                "从你的回答看，当前右侧表现可能更明显。",
                "目前的差异更可能集中在右侧的紧张、厚度、偏移或控制变化上。"
            ]
        },
        '暂不明确': {
            title: "暂不明确",
            descriptions: [
                "目前左右侧方向还不够稳定，说明你的问题不太像单一一侧特别突出。",
                "从目前的回答看，你的差异更像是多个因素一起参与，而不是单一块状问题。"
            ]
        }
    },

    // D句：复杂度
    // scoring.js 输出: '一般初筛' | '建议进一步评估'
    complexity: {
        '一般初筛': {
            title: "一般初筛",
            descriptions: [
                "现阶段更适合先做初步观察和习惯调整，线上测试仅作基础筛查参考。",
                "目前可以先把这份结果当作初步方向判断，后续再根据变化决定是否继续深入评估。",
                "这类结果通常适合作为入门筛查使用，不建议只凭一次自测就下很重的结论。"
            ]
        },
        '建议进一步评估': {
            title: "建议进一步评估",
            descriptions: [
                "你的结果里提示了较多复合因素，后续更适合进一步查看详细评估说明。",
                "如果你想知道问题主次关系和处理顺序，后面需要更细的分析，而不只是停留在免费自测层。",
                "这类结果更适合继续往下看主因、辅因和处理方向，不建议只根据表面表现自行判断。"
            ]
        }
    },

    // 动态异常提醒（当动态控制分 >= 4 时优先使用）
    dynamicAlert: {
        descriptions: [
            "如果你在微笑、说话或闭口时左右差异特别明显，后续更建议做更细的动态评估。",
            "这类情况不适合只看静态照片，后面更需要结合动态表现来判断主因。",
            "当差异主要出现在表情和动作里时，单看外观往往不够，后续更适合进入详细层。"
        ]
    }
};

/**
 * 获取详细描述对象
 * @param {Object} results — scoring.js 输出的结果对象 { tendency, direction, side, complexity }
 * @param {Object} scores — scoring.js 输出的分数对象
 * @returns {Object} { tendency, direction, side, complexity, summary }
 */
function getDetailedDescriptions(results, scores) {
    const tendencyText = resultTexts.tendency[results.tendency] || resultTexts.tendency['混合倾向'];
    const directionText = resultTexts.direction[results.direction] || resultTexts.direction['习惯偏侧方向'];
    const sideText = resultTexts.side[results.side] || resultTexts.side['暂不明确'];
    const complexityText = resultTexts.complexity[results.complexity] || resultTexts.complexity['一般初筛'];

    const descriptions = {
        tendency: tendencyText.descriptions[1] || tendencyText.descriptions[0],
        direction: directionText.descriptions[1] || directionText.descriptions[0],
        side: sideText.descriptions[1] || sideText.descriptions[0],
        complexity: ''
    };

    // 动态分 >= 4 时优先显示动态提醒
    if (scores.dynamicScore >= 4) {
        descriptions.complexity = resultTexts.dynamicAlert.descriptions[1] || resultTexts.dynamicAlert.descriptions[0];
    } else {
        descriptions.complexity = complexityText.descriptions[1] || complexityText.descriptions[0];
    }

    // 汇总摘要
    descriptions.summary = [
        tendencyText.descriptions[0],
        directionText.descriptions[0],
        sideText.descriptions[0],
        '所以这份免费评估更适合帮你先看方向。若想进一步知道问题主次关系和处理顺序，还需要更细的评估分析。'
    ].join('\n\n');

    return descriptions;
}

/**
 * 生成结果摘要（兼容旧接口）
 */
function generateResultSummary(results, scores) {
    const descriptions = getDetailedDescriptions(results, scores);
    return descriptions.summary;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        resultTexts,
        generateResultSummary,
        getDetailedDescriptions
    };
}

// 确保全局可用
window.getDetailedDescriptions = getDetailedDescriptions;
window.generateResultSummary = generateResultSummary;
