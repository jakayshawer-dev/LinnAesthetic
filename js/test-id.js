// 测试编号生成和管理系统

class TestIDManager {
    constructor() {
        this.storageKey = 'laa_test_ids';
        this.currentTestId = null;
        this.init();
    }

    // 初始化
    init() {
        // 从localStorage加载或初始化测试ID数据
        if (!localStorage.getItem(this.storageKey)) {
            this.initializeStorage();
        }
    }

    // 初始化存储
    initializeStorage() {
        const initialData = {
            lastId: 24000, // 从24001开始
            testRecords: {}
        };
        localStorage.setItem(this.storageKey, JSON.stringify(initialData));
    }

    // 获取存储数据
    getStorageData() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : this.initializeStorage();
    }

    // 保存存储数据
    saveStorageData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    // 生成新的测试编号
    generateNewTestId() {
        const data = this.getStorageData();
        data.lastId += 1;
        const newId = `LAA${data.lastId}`;
        
        // 创建新的测试记录
        data.testRecords[newId] = {
            id: newId,
            createdAt: new Date().toISOString(),
            status: 'pending', // pending, paid, activated, completed
            paymentMethod: null,
            paymentTime: null,
            activationTime: null,
            resultType: null,
            notes: '',
            userData: {}
        };

        this.saveStorageData(data);
        this.currentTestId = newId;
        
        // 也在sessionStorage中保存当前测试ID
        sessionStorage.setItem('current_test_id', newId);
        
        return newId;
    }

    // 获取当前测试ID（从sessionStorage）
    getCurrentTestId() {
        if (!this.currentTestId) {
            this.currentTestId = sessionStorage.getItem('current_test_id');
        }
        return this.currentTestId;
    }

    // 设置当前测试ID
    setCurrentTestId(testId) {
        this.currentTestId = testId;
        sessionStorage.setItem('current_test_id', testId);
    }

    // 获取测试记录
    getTestRecord(testId) {
        const data = this.getStorageData();
        return data.testRecords[testId] || null;
    }

    // 更新测试记录
    updateTestRecord(testId, updates) {
        const data = this.getStorageData();
        if (data.testRecords[testId]) {
            data.testRecords[testId] = {
                ...data.testRecords[testId],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveStorageData(data);
            return true;
        }
        return false;
    }

    // 检查测试编号状态
    checkTestStatus(testId) {
        const record = this.getTestRecord(testId);
        if (!record) {
            return {
                exists: false,
                status: 'not_found',
                message: '测试编号不存在'
            };
        }

        return {
            exists: true,
            status: record.status,
            resultType: record.resultType,
            activated: record.status === 'activated' || record.status === 'completed',
            message: this.getStatusMessage(record.status)
        };
    }

    // 获取状态消息
    getStatusMessage(status) {
        const messages = {
            'pending': '等待提交信息',
            'submitted': '信息已提交，等待支付',
            'paid': '已支付，等待开通',
            'activated': '已开通，可以查看结果',
            'completed': '已完成',
            'not_found': '测试编号不存在'
        };
        return messages[status] || '未知状态';
    }

    // 激活测试编号（管理员操作）
    activateTestId(testId, resultType = 'A', notes = '') {
        const record = this.getTestRecord(testId);
        if (!record) {
            return { success: false, message: '测试编号不存在' };
        }

        if (record.status === 'activated' || record.status === 'completed') {
            return { success: false, message: '该编号已激活' };
        }

        const updates = {
            status: 'activated',
            activationTime: new Date().toISOString(),
            resultType: resultType,
            notes: notes
        };

        this.updateTestRecord(testId, updates);
        
        return { 
            success: true, 
            message: '测试编号已激活',
            testId: testId,
            resultType: resultType
        };
    }

    // 获取所有测试记录（管理员用）
    getAllTestRecords() {
        const data = this.getStorageData();
        return Object.values(data.testRecords).sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
    }

    // 与管理员后台同步（兼容性函数）
    syncWithAdminBackend() {
        const records = this.getAllTestRecords();
        
        // 检查是否有管理员后台数据
        const adminData = localStorage.getItem('laa_test_records');
        if (!adminData) {
            // 如果没有管理员数据，从当前系统导入
            const adminRecords = records.map(record => ({
                id: record.id,
                createdAt: record.createdAt,
                status: this.convertStatusForAdmin(record.status),
                resultType: record.resultType
            }));
            
            localStorage.setItem('laa_test_records', JSON.stringify(adminRecords));
            return { imported: adminRecords.length, source: 'test-id-system' };
        }
        
        return { imported: 0, source: 'admin-backend' };
    }

    // 转换状态为管理员后台格式
    convertStatusForAdmin(status) {
        const statusMap = {
            'pending': 'pending',
            'submitted': 'pending',
            'paid': 'pending',
            'activated': 'active',
            'completed': 'completed'
        };
        return statusMap[status] || 'pending';
    }

    // 从管理员后台同步状态回来
    syncFromAdminBackend() {
        const adminData = localStorage.getItem('laa_test_records');
        if (!adminData) return { synced: 0 };
        
        const adminRecords = JSON.parse(adminData);
        const data = this.getStorageData();
        let syncedCount = 0;
        
        adminRecords.forEach(adminRecord => {
            if (data.testRecords[adminRecord.id]) {
                // 更新状态
                const newStatus = this.convertStatusFromAdmin(adminRecord.status);
                if (data.testRecords[adminRecord.id].status !== newStatus) {
                    data.testRecords[adminRecord.id].status = newStatus;
                    syncedCount++;
                }
                
                // 更新结果类型
                if (adminRecord.resultType && !data.testRecords[adminRecord.id].resultType) {
                    data.testRecords[adminRecord.id].resultType = adminRecord.resultType;
                    syncedCount++;
                }
            }
        });
        
        if (syncedCount > 0) {
            this.saveStorageData(data);
        }
        
        return { synced: syncedCount };
    }

    // 从管理员后台格式转换回原系统格式
    convertStatusFromAdmin(adminStatus) {
        const statusMap = {
            'pending': 'pending',
            'active': 'activated',
            'completed': 'completed'
        };
        return statusMap[adminStatus] || 'pending';
    }

    // 搜索测试记录
    searchTestRecords(searchTerm) {
        const records = this.getAllTestRecords();
        return records.filter(record => 
            record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (record.notes && record.notes.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }

    // 复制到剪贴板
    copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text).then(() => true);
        } else {
            // 备用方法
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return Promise.resolve(true);
            } catch (err) {
                document.body.removeChild(textArea);
                return Promise.resolve(false);
            }
        }
    }

    // 导出数据（管理员用）
    exportData() {
        const data = this.getStorageData();
        return JSON.stringify(data, null, 2);
    }

    // 导入数据（管理员用）
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return { success: true, message: '数据导入成功' };
        } catch (error) {
            return { success: false, message: '数据格式错误' };
        }
    }
}

// 创建全局实例
window.TestIDManager = new TestIDManager();

// 工具函数
window.generateTestId = function() {
    return window.TestIDManager.generateNewTestId();
};

window.getCurrentTestId = function() {
    return window.TestIDManager.getCurrentTestId();
};

window.copyTestId = function(testId) {
    if (!testId) testId = window.TestIDManager.getCurrentTestId();
    return window.TestIDManager.copyToClipboard(testId);
};

window.checkTestIdStatus = function(testId) {
    return window.TestIDManager.checkTestStatus(testId);
};