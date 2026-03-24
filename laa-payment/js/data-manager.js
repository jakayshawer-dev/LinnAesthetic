// 数据管理器 - 管理用户数据和评估结果

class DataManager {
    constructor() {
        this.storageKey = 'laa_user_data';
        this.testIdManager = window.TestIDManager;
    }

    // 保存用户答案
    saveUserAnswers(answers, page = 'basic') {
        const testId = this.testIdManager.getCurrentTestId();
        if (!testId) {
            console.error('没有测试编号，无法保存答案');
            return false;
        }

        const updates = {
            userData: {
                ...this.getUserData(testId),
                [`${page}_answers`]: answers,
                [`${page}_completed_at`]: new Date().toISOString()
            }
        };

        // 如果完成了第二层评估，更新状态
        if (page === 'advanced' && answers.length >= 4) {
            updates.status = 'submitted';
        }

        return this.testIdManager.updateTestRecord(testId, updates);
    }

    // 获取用户数据
    getUserData(testId = null) {
        if (!testId) {
            testId = this.testIdManager.getCurrentTestId();
        }
        
        const record = this.testIdManager.getTestRecord(testId);
        return record ? record.userData : {};
    }

    // 保存照片信息
    savePhotoInfo(photoInfo) {
        const testId = this.testIdManager.getCurrentTestId();
        if (!testId) return false;

        const updates = {
            userData: {
                ...this.getUserData(testId),
                photo_info: photoInfo,
                photo_uploaded_at: new Date().toISOString()
            }
        };

        return this.testIdManager.updateTestRecord(testId, updates);
    }

    // 检查第二层完成状态
    checkAdvancedCompletion() {
        const userData = this.getUserData();
        return {
            questionsCompleted: !!userData.advanced_answers,
            photoUploaded: !!userData.photo_info,
            fullyCompleted: !!userData.advanced_answers && !!userData.photo_info
        };
    }

    // 获取评估结果
    getAssessmentResult(testId = null) {
        if (!testId) {
            testId = this.testIdManager.getCurrentTestId();
        }

        const record = this.testIdManager.getTestRecord(testId);
        if (!record) return null;

        // 这里应该根据resultType返回不同的结果
        // 暂时返回模拟数据
        return this.generateResult(record.resultType || 'A');
    }

    // 生成评估结果（模拟）
    generateResult(resultType) {
        const resultTemplates = {
            'A': {
                title: '复合型不对称 - 骨骼主导',
                summary: '你的不对称问题主要表现为骨骼结构差异，伴有轻微的软组织代偿。',
                sections: [
                    {
                        title: '主因与次因拆解',
                        content: '主要问题：下颌骨发育不对称（右侧偏大）\n次要代偿：右侧咬肌轻度肥大，左侧颞肌代偿性紧张'
                    },
                    {
                        title: '表现侧与驱动侧分析',
                        content: '表现侧：右侧（视觉上更明显）\n驱动侧：左侧（功能上主导咀嚼）\n分析：右侧骨骼发育过度是根本原因，左侧肌肉代偿是适应性变化'
                    },
                    {
                        title: '复合因素判断',
                        content: '属于骨骼主导的复合型不对称（骨骼70%，肌肉30%）\n叠加因素：长期单侧咀嚼习惯加重了肌肉不平衡'
                    },
                    {
                        title: '形成逻辑说明',
                        content: '可能源于青少年期下颌骨发育不均衡，成年后因咀嚼习惯固化了不对称模式。右侧骨骼过度发育是原发因素，左侧肌肉紧张是继发代偿。'
                    },
                    {
                        title: '处理顺序建议',
                        content: '1. 优先处理骨骼问题（正畸或正颌咨询）\n2. 同步进行肌肉平衡训练\n3. 纠正咀嚼习惯\n4. 定期评估调整'
                    }
                ],
                recommendations: [
                    '建议进行CBCT检查明确骨骼差异程度',
                    '可考虑肌功能训练平衡两侧肌肉',
                    '如有咬合问题需正畸评估',
                    '定期拍照跟踪变化'
                ]
            },
            'B': {
                title: '肌肉型不对称 - 习惯主导',
                summary: '你的不对称问题主要源于肌肉使用不平衡，骨骼结构基本对称。',
                sections: [
                    {
                        title: '主因与次因拆解',
                        content: '主要问题：右侧咬肌和颞肌过度发达\n次要因素：长期单侧咀嚼习惯'
                    },
                    {
                        title: '表现侧与驱动侧分析',
                        content: '表现侧：右侧（肌肉更发达）\n驱动侧：右侧（主导咀嚼功能）\n分析：右侧肌肉过度使用导致肥大，左侧相对萎缩'
                    },
                    {
                        title: '复合因素判断',
                        content: '属于肌肉主导的功能性不对称（肌肉80%，习惯20%）\n无明显骨骼结构问题'
                    },
                    {
                        title: '形成逻辑说明',
                        content: '长期单侧咀嚼习惯导致右侧咀嚼肌代偿性肥大，左侧肌肉使用不足逐渐萎缩，形成视觉上的不对称。'
                    },
                    {
                        title: '处理顺序建议',
                        content: '1. 纠正咀嚼习惯（强制双侧咀嚼）\n2. 右侧肌肉放松训练\n3. 左侧肌肉激活训练\n4. 定期按摩和拉伸'
                    }
                ],
                recommendations: [
                    '重点纠正单侧咀嚼习惯',
                    '可进行肉毒素注射放松肥大肌肉',
                    '配合肌肉平衡训练',
                    '注意睡眠姿势避免压迫'
                ]
            },
            'C': {
                title: '混合型不对称 - 多因素叠加',
                summary: '你的不对称问题涉及骨骼、肌肉、习惯多个层面，需要综合处理。',
                sections: [
                    {
                        title: '主因与次因拆解',
                        content: '主要问题：颧骨轻微不对称 + 咬肌不平衡\n次要因素：表情习惯和睡眠姿势影响'
                    },
                    {
                        title: '表现侧与驱动侧分析',
                        content: '表现侧：左侧（颧骨稍高，视觉突出）\n驱动侧：右侧（咀嚼和表情更活跃）\n分析：结构性和功能性因素叠加'
                    },
                    {
                        title: '复合因素判断',
                        content: '属于典型的混合型不对称（骨骼40%，肌肉40%，习惯20%）\n多因素相互影响'
                    },
                    {
                        title: '形成逻辑说明',
                        content: '先天性的颧骨不对称为基础，后天因右侧主导的咀嚼和表情习惯加重了肌肉不平衡，形成复合型表现。'
                    },
                    {
                        title: '处理顺序建议',
                        content: '1. 评估骨骼差异是否需处理\n2. 平衡两侧肌肉功能\n3. 纠正不良习惯\n4. 考虑微调改善视觉效果'
                    }
                ],
                recommendations: [
                    '建议全面评估骨骼和软组织情况',
                    '可考虑综合治疗方案',
                    '习惯纠正至关重要',
                    '可能需要多阶段处理'
                ]
            }
        };

        return resultTemplates[resultType] || resultTemplates['A'];
    }

    // 清除当前用户数据
    clearCurrentUserData() {
        sessionStorage.removeItem('current_test_id');
    }

    // 导出所有数据（管理员用）
    exportAllData() {
        return this.testIdManager.exportData();
    }

    // 获取统计数据（管理员用）
    getStatistics() {
        const records = this.testIdManager.getAllTestRecords();
        
        const stats = {
            total: records.length,
            byStatus: {},
            byResultType: {},
            last7Days: 0,
            last30Days: 0
        };

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        records.forEach(record => {
            // 按状态统计
            stats.byStatus[record.status] = (stats.byStatus[record.status] || 0) + 1;
            
            // 按结果类型统计
            if (record.resultType) {
                stats.byResultType[record.resultType] = (stats.byResultType[record.resultType] || 0) + 1;
            }
            
            // 时间统计
            const createdDate = new Date(record.createdAt);
            if (createdDate >= sevenDaysAgo) stats.last7Days++;
            if (createdDate >= thirtyDaysAgo) stats.last30Days++;
        });

        return stats;
    }
}

// 创建全局实例
window.DataManager = new DataManager();