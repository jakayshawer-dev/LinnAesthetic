// 答案哈希生成器 - 确保testId与16题答案1对1绑定
class AnswerHashGenerator {
    constructor() {
        this.storageKey = 'laa_answer_hashes';
    }
    
    // 生成基于答案的哈希ID
    generateTestIdFromAnswers(answers) {
        if (!answers || typeof answers !== 'object') {
            throw new Error('答案数据无效');
        }
        
        // 1. 将答案转换为标准化的JSON字符串
        const sortedAnswers = this.sortObjectKeys(answers);
        const answerStr = JSON.stringify(sortedAnswers);
        
        // 2. 生成基础哈希（使用您的算法）
        let hash = 0;
        for (let i = 0; i < answerStr.length; i++) {
            hash = ((hash << 5) - hash) + answerStr.charCodeAt(i);
            hash |= 0;
        }
        
        // 3. 生成基础ID
        const baseId = 'T' + Math.abs(hash).toString().substring(0, 9);
        
        // 4. 检查是否已存在相同的答案哈希
        const existingId = this.findExistingHash(answerStr);
        if (existingId) {
            return existingId; // 返回已存在的testId
        }
        
        // 5. 添加随机后缀避免碰撞
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const testId = baseId + '-' + randomSuffix;
        
        // 6. 保存哈希映射
        this.saveHashMapping(testId, answerStr);
        
        return testId;
    }
    
    // 排序对象键以确保一致性
    sortObjectKeys(obj) {
        const sorted = {};
        Object.keys(obj).sort().forEach(key => {
            sorted[key] = obj[key];
        });
        return sorted;
    }
    
    // 保存哈希映射
    saveHashMapping(testId, answerHash) {
        const data = this.getStorageData();
        data.hashMap[answerHash] = testId;
        data.testIdMap[testId] = answerHash;
        this.saveStorageData(data);
    }
    
    // 查找已存在的哈希
    findExistingHash(answerHash) {
        const data = this.getStorageData();
        return data.hashMap[answerHash] || null;
    }
    
    // 根据testId获取答案哈希
    getAnswerHash(testId) {
        const data = this.getStorageData();
        return data.testIdMap[testId] || null;
    }
    
    // 验证testId与答案是否匹配
    verifyTestIdAnswers(testId, answers) {
        const storedHash = this.getAnswerHash(testId);
        if (!storedHash) return false;
        
        const sortedAnswers = this.sortObjectKeys(answers);
        const currentHash = JSON.stringify(sortedAnswers);
        
        return storedHash === currentHash;
    }
    
    // 获取存储数据
    getStorageData() {
        const defaultData = {
            hashMap: {},    // 答案哈希 -> testId
            testIdMap: {},  // testId -> 答案哈希
            lastGenerated: null
        };
        
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : defaultData;
        } catch (e) {
            return defaultData;
        }
    }
    
    // 保存存储数据
    saveStorageData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存哈希数据失败:', e);
            return false;
        }
    }
    
    // 清除所有数据（仅用于测试）
    clearAllData() {
        localStorage.removeItem(this.storageKey);
    }
}

// 创建全局实例
window.AnswerHashGenerator = new AnswerHashGenerator();

// 工具函数
window.generateTestIdFromAnswers = function(answers) {
    return window.AnswerHashGenerator.generateTestIdFromAnswers(answers);
};

window.verifyTestIdAnswers = function(testId, answers) {
    return window.AnswerHashGenerator.verifyTestIdAnswers(testId, answers);
};

window.getAnswerHash = function(testId) {
    return window.AnswerHashGenerator.getAnswerHash(testId);
};