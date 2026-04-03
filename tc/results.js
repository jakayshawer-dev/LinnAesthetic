// 結果文案配置 - 與 scoring.js 匹配版本

const resultTexts = {
    // A句：真假傾向
    // scoring.js 輸出: '假性傾向' | '混合傾向' | '真性傾向'
    tendency: {
        '假性傾向': {
            title: "假性傾向",
            descriptions: [
                "從這次自測結果看，你目前更偏向假性大小臉。",
                "你現在看到的左右差異，更像是受頭位、體態或日常使用習慣影響的類型。",
                "目前這類不對稱更偏向假性表現，也就是差異會受到姿勢和用力方式放大。"
            ]
        },
        '混合傾向': {
            title: "混合傾向",
            descriptions: [
                "從這次自測結果看，你目前更偏向真假性混合傾向。",
                "你現在看到的左右差異，可能不只是單純姿勢問題，也不完全只是穩定結構差異。",
                "目前這類不對稱更像是多種因素一起參與，既有代償放大，也可能已經疊加了更穩定的面部失衡。"
            ]
        },
        '真性傾向': {
            title: "真性傾向",
            descriptions: [
                "從這次自測結果看，你目前更偏向真性大小臉。",
                "你現在看到的左右差異，更像已經固定在面部本身，而不只是拍照角度或暫時頭位造成的視覺偏差。",
                "目前這類不對稱更偏向穩定存在的面部失衡，說明問題可能不只是姿勢變化帶來的表面差異。"
            ]
        }
    },

    // B句：主方向
    direction: {
        "習慣偏側方向": {
            descriptions: [
                "結合你的回答，問題更像長期單側使用慢慢積累出來的不對稱表現。",
                "這類情況常見的放大因素，包括單側咀嚼、固定側睡、托腮，或長期偏向一邊用力。",
                "從目前的表現看，你的問題更偏向習慣偏側參與較多，而不是單一塊組織突然變化。"
            ]
        },
        "肌肉軟組織方向": {
            descriptions: [
                "結合你的回答，問題更偏向面部軟組織和肌肉主動發力不均。",
                "這類情況通常會表現爲一側更厚、更硬、更鼓，另一側則更松或更弱。",
                "從目前的表現看，你的問題重點更像在肌肉募集不均和軟組織厚薄差上。"
            ]
        },
        "筋膜位置牽拉方向": {
            descriptions: [
                "結合你的回答，問題更偏向位置和牽拉鍊偏移較明顯的類型。",
                "這類情況的重點不只是「哪邊更大」，而是哪邊更像被整條張力鏈拉偏了位置。",
                "從目前的表現看，你的問題更像方向和位置發生了偏移，而不只是單純厚薄差。"
            ]
        },
        "動態控制方向": {
            descriptions: [
                "結合你的回答，問題更偏向動態控制不平衡較明顯的類型。",
                "這類情況往往靜態不一定最突出，但一到微笑、說話或做表情時，左右差異會更明顯。",
                "從目前的表現看，你的問題重點更像左右兩邊的啓動速度和控制程序不夠一致。"
            ]
        },
        "體態代償方向": {
            descriptions: [
                "結合你的回答，問題更偏向頭頸體態參與較多的類型。",
                "這類情況常見的特點是，臉上看到的差異不一定全是臉本身造成的，還可能和脖子、肩膀及整體代償有關。",
                "從目前的表現看，你的問題更像是頭頸位置和代償鏈，把面部不對稱進一步放大了。"
            ]
        }
    },

    // C句：左右側
    // scoring.js 輸出: '左側更明顯' | '右側更明顯' | '暫不明確'
    side: {
        '左側更明顯': {
            title: "左側更明顯",
            descriptions: [
                "從你的回答看，當前左側表現可能更明顯。",
                "目前的差異更可能集中在左側的緊張、厚度、偏移或控制變化上。"
            ]
        },
        '右側更明顯': {
            title: "右側更明顯",
            descriptions: [
                "從你的回答看，當前右側表現可能更明顯。",
                "目前的差異更可能集中在右側的緊張、厚度、偏移或控制變化上。"
            ]
        },
        '暫不明確': {
            title: "暫不明確",
            descriptions: [
                "目前左右側方向還不夠穩定，說明你的問題不太像單一一側特別突出。",
                "從目前的回答看，你的差異更像是多個因素一起參與，而不是單一塊狀問題。"
            ]
        }
    },

    // D句：複雜度
    // scoring.js 輸出: '一般初篩' | '建議進一步評估'
    complexity: {
        '一般初篩': {
            title: "一般初篩",
            descriptions: [
                "現階段更適合先做初步觀察和習慣調整，線上測試僅作基礎篩查參考。",
                "目前可以先把這份結果當作初步方向判斷，後續再根據變化決定是否繼續深入評估。",
                "這類結果通常適合作爲入門篩查使用，不建議只憑一次自測就下很重的結論。"
            ]
        },
        '建議進一步評估': {
            title: "建議進一步評估",
            descriptions: [
                "你的結果裏提示了較多複合因素，後續更適合進一步查看詳細評估說明。",
                "如果你想知道問題主次關係和處理順序，後面需要更細的分析，而不只是停留在免費自測層。",
                "這類結果更適合繼續往下看主因、輔因和處理方向，不建議只根據表面表現自行判斷。"
            ]
        }
    },

    // 動態異常提醒（當動態控制分 >= 4 時優先使用）
    dynamicAlert: {
        descriptions: [
            "如果你在微笑、說話或閉口時左右差異特別明顯，後續更建議做更細的動態評估。",
            "這類情況不適合只看靜態照片，後面更需要結合動態表現來判斷主因。",
            "當差異主要出現在表情和動作裏時，單看外觀往往不夠，後續更適合進入詳細層。"
        ]
    }
};

/**
 * 獲取詳細描述對象
 * @param {Object} results — scoring.js 輸出的結果對象 { tendency, direction, side, complexity }
 * @param {Object} scores — scoring.js 輸出的分數對象
 * @returns {Object} { tendency, direction, side, complexity, summary }
 */
function getDetailedDescriptions(results, scores) {
    const tendencyText = resultTexts.tendency[results.tendency] || resultTexts.tendency['混合傾向'];
    const directionText = resultTexts.direction[results.direction] || resultTexts.direction['習慣偏側方向'];
    const sideText = resultTexts.side[results.side] || resultTexts.side['暫不明確'];
    const complexityText = resultTexts.complexity[results.complexity] || resultTexts.complexity['一般初篩'];

    const descriptions = {
        tendency: tendencyText.descriptions[1] || tendencyText.descriptions[0],
        direction: directionText.descriptions[1] || directionText.descriptions[0],
        side: sideText.descriptions[1] || sideText.descriptions[0],
        complexity: ''
    };

    // 動態分 >= 4 時優先顯示動態提醒
    if (scores.dynamicScore >= 4) {
        descriptions.complexity = resultTexts.dynamicAlert.descriptions[1] || resultTexts.dynamicAlert.descriptions[0];
    } else {
        descriptions.complexity = complexityText.descriptions[1] || complexityText.descriptions[0];
    }

    // 彙總摘要
    descriptions.summary = [
        tendencyText.descriptions[0],
        directionText.descriptions[0],
        sideText.descriptions[0],
        '所以這份免費評估更適合幫你先看方向。若想進一步知道問題主次關係和處理順序，還需要更細的評估分析。'
    ].join('\n\n');

    return descriptions;
}

/**
 * 生成結果摘要（兼容舊接口）
 */
function generateResultSummary(results, scores) {
    const descriptions = getDetailedDescriptions(results, scores);
    return descriptions.summary;
}

// 導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        resultTexts,
        generateResultSummary,
        getDetailedDescriptions
    };
}

// 確保全局可用
window.getDetailedDescriptions = getDetailedDescriptions;
window.generateResultSummary = generateResultSummary;
