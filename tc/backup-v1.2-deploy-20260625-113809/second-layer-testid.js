// 第二层评估testId生成器
// 在4题+照片上传完成后生成testId

class SecondLayerTestIdGenerator {
    constructor() {
        this.storageKey = 'laa_second_layer_data';
    }
    
    // 生成第二层testId（基于16题答案：12基础 + 4进阶）
    generateSecondLayerTestId(basicAnswers, advancedAnswers, photoData = null) {
        if (!basicAnswers || !advancedAnswers) {
            throw new Error('需要基础答案和进阶答案');
        }
        
        // 合并所有答案（12基础 + 4进阶）
        const allAnswers = {
            ...basicAnswers,
            ...advancedAnswers
        };
        
        console.log('🎯 生成第二层testId，基于', Object.keys(allAnswers).length, '个答案');
        
        // 使用AnswerHashGenerator生成唯一testId
        if (window.AnswerHashGenerator && window.generateTestIdFromAnswers) {
            const testId = window.generateTestIdFromAnswers(allAnswers);
            
            // 创建完整记录
            this.createSecondLayerRecord(testId, {
                basicAnswers: basicAnswers,
                advancedAnswers: advancedAnswers,
                photoData: photoData,
                allAnswers: allAnswers,
                completedAt: new Date().toISOString()
            });
            
            return testId;
        } else {
            throw new Error('AnswerHashGenerator未加载');
        }
    }
    
    // 创建第二层记录
    createSecondLayerRecord(testId, data) {
        const storageData = this.getStorageData();
        storageData.records[testId] = data;
        this.saveStorageData(storageData);
        
        // 同时保存到TestIDManager
        if (window.TestIDManager && window.TestIDManager.createTestRecord) {
            window.TestIDManager.createTestRecord(testId, {
                id: testId,
                createdAt: new Date().toISOString(),
                status: 'pending',
                paid: false,
                opened: false,
                userData: {
                    basic_answers: data.basicAnswers ? Object.values(data.basicAnswers) : [],
                    advanced_answers: data.advancedAnswers ? Object.values(data.advancedAnswers) : [],
                    photo_data: data.photoData || null,
                    all_answers: data.allAnswers,
                    second_layer_completed: true
                }
            });
        }
        
        console.log('✅ 第二层记录已创建:', testId);
        return testId;
    }
    
    // 获取第二层数据
    getSecondLayerData(testId) {
        const storageData = this.getStorageData();
        return storageData.records[testId] || null;
    }
    
    // 获取存储数据
    getStorageData() {
        const defaultData = {
            records: {},
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
            console.error('保存第二层数据失败:', e);
            return false;
        }
    }
    
    // 检查第二层是否完成
    isSecondLayerCompleted(testId) {
        const record = this.getSecondLayerData(testId);
        return !!(record && record.completedAt);
    }
}

// 创建全局实例
window.SecondLayerTestIdGenerator = new SecondLayerTestIdGenerator();

// 工具函数
window.generateSecondLayerTestId = function(basicAnswers, advancedAnswers, photoData) {
    return window.SecondLayerTestIdGenerator.generateSecondLayerTestId(basicAnswers, advancedAnswers, photoData);
};

window.getSecondLayerData = function(testId) {
    return window.SecondLayerTestIdGenerator.getSecondLayerData(testId);
};

window.isSecondLayerCompleted = function(testId) {
    return window.SecondLayerTestIdGenerator.isSecondLayerCompleted(testId);
};
