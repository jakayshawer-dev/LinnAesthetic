// 答案哈希工具 - 将问题答案映射到唯一测试编号
class AnswerHash {
    constructor() {
        // 基础问题映射表（12个问题）
        this.baseQuestions = [
            "q1_truth", "q2_truth", "q3_truth", "q4_truth", "q5_truth",
            "q6_truth", "q7_truth", "q8_truth", "q9_truth", "q10_truth",
            "q11_truth", "q12_truth"
        ];
        
        // 进阶问题映射表（4个问题）
        this.advancedQuestions = [
            "adv_q1", "adv_q2", "adv_q3", "adv_q4"
        ];
    }
    
    // 生成答案哈希（基于所有答案）
    generateAnswerHash(answers) {
        if (!answers || Object.keys(answers).length === 0) {
            return null;
        }
        
        // 将答案转换为字符串
        const answerString = JSON.stringify(answers);
        
        // 使用简单的哈希函数（生产环境可以使用更安全的哈希）
        let hash = 0;
        for (let i = 0; i < answerString.length; i++) {
            const char = answerString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        
        // 返回正数哈希值
        return Math.abs(hash).toString(16).toUpperCase().substring(0, 8);
    }
    
    // 根据答案生成测试编号
    generateTestIdFromAnswers(answers) {
        const hash = this.generateAnswerHash(answers);
        if (!hash) {
            return null;
        }
        
        // 使用哈希前4位作为编号部分
        const hashPart = hash.substring(0, 4);
        
        // 获取当前日期部分（年月日）
        const now = new Date();
        const datePart = now.getFullYear().toString().substring(2) + 
                        (now.getMonth() + 1).toString().padStart(2, '0') + 
                        now.getDate().toString().padStart(2, '0');
        
        // 生成唯一测试编号：LAA + 日期 + 哈希
        return `LAA${datePart}${hashPart}`;
    }
    
    // 验证答案与测试编号的匹配
    verifyAnswerMatch(testId, answers) {
        if (!testId || !answers) {
            return false;
        }
        
        // 从测试编号提取哈希部分
        const hashFromId = testId.substring(11); // LAA + 6位日期 = 9位，取后4位
        
        // 计算答案的哈希
        const hashFromAnswers = this.generateAnswerHash(answers);
        if (!hashFromAnswers) {
            return false;
        }
        
        // 比较哈希
        return hashFromAnswers.startsWith(hashFromId);
    }
    
    // 获取基础问题的答案（从localStorage）
    getBasicAnswers() {
        const answers = {};
        
        this.baseQuestions.forEach((question, index) => {
            const answer = localStorage.getItem(`answer_${index + 1}`);
            if (answer) {
                answers[question] = answer;
            }
        });
        
        return answers;
    }
    
    // 获取进阶问题的答案
    getAdvancedAnswers() {
        const answers = {};
        
        this.advancedQuestions.forEach((question, index) => {
            const answer = localStorage.getItem(`adv_answer_${index + 1}`);
            if (answer) {
                answers[question] = answer;
            }
        });
        
        return answers;
    }
    
    // 保存答案到localStorage
    saveBasicAnswers(answers) {
        if (!answers) return;
        
        Object.keys(answers).forEach((key, index) => {
            localStorage.setItem(`answer_${index + 1}`, answers[key]);
        });
        
        // 保存答案哈希
        const hash = this.generateAnswerHash(answers);
        if (hash) {
            localStorage.setItem('basic_answers_hash', hash);
        }
    }
    
    // 保存进阶答案
    saveAdvancedAnswers(answers) {
        if (!answers) return;
        
        Object.keys(answers).forEach((key, index) => {
            localStorage.setItem(`adv_answer_${index + 1}`, answers[key]);
        });
        
        // 保存答案哈希
        const hash = this.generateAnswerHash(answers);
        if (hash) {
            localStorage.setItem('advanced_answers_hash', hash);
        }
    }
    
    // 生成并保存测试编号
    generateAndSaveTestId(answers) {
        const testId = this.generateTestIdFromAnswers(answers);
        if (!testId) {
            return null;
        }
        
        // 保存到localStorage
        localStorage.setItem('current_test_id', testId);
        localStorage.setItem('current_test_id_hash', this.generateAnswerHash(answers));
        
        // 保存答案
        this.saveBasicAnswers(answers);
        
        return testId;
    }
    
    // 获取当前测试编号（基于答案）
    getCurrentTestId() {
        // 先尝试从localStorage获取
        let testId = localStorage.getItem('current_test_id');
        
        // 如果没有，尝试基于答案生成
        if (!testId) {
            const answers = this.getBasicAnswers();
            if (Object.keys(answers).length > 0) {
                testId = this.generateTestIdFromAnswers(answers);
                if (testId) {
                    localStorage.setItem('current_test_id', testId);
                }
            }
        }
        
        return testId;
    }
    
    // 检查测试编号是否有效（基于答案）
    validateTestId(testId) {
        if (!testId) return false;
        
        // 检查格式
        if (!testId.startsWith('LAA') || testId.length !== 13) {
            return false;
        }
        
        // 检查日期部分是否有效
        const datePart = testId.substring(3, 9);
        const year = parseInt('20' + datePart.substring(0, 2));
        const month = parseInt(datePart.substring(2, 4)) - 1;
        const day = parseInt(datePart.substring(4, 6));
        
        const date = new Date(year, month, day);
        if (isNaN(date.getTime())) {
            return false;
        }
        
        // 检查哈希部分
        const hashPart = testId.substring(9);
        if (!/^[0-9A-F]{4}$/.test(hashPart)) {
            return false;
        }
        
        return true;
    }
}

// 创建全局实例
window.AnswerHash = new AnswerHash();

// 工具函数
window.generateTestIdFromAnswers = function(answers) {
    return window.AnswerHash.generateTestIdFromAnswers(answers);
};

window.verifyAnswerMatch = function(testId, answers) {
    return window.AnswerHash.verifyAnswerMatch(testId, answers);
};

window.getCurrentTestIdFromAnswers = function() {
    return window.AnswerHash.getCurrentTestId();
};

window.validateTestIdFormat = function(testId) {
    return window.AnswerHash.validateTestId(testId);
};