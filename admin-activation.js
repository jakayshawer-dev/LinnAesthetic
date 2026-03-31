// 管理员后台逻辑

// 管理员密码（实际应用中应从安全配置中获取）
const ADMIN_PASSWORD = 'LAA2024Admin';

// 数据存储键
const ACTIVATION_DATA_KEY = 'laa_activation_data';

// 初始化管理员后台
function initAdminActivation() {
    // DOM元素
    const loginSection = document.getElementById('login-section');
    const managementSection = document.getElementById('management-section');
    const loginForm = document.getElementById('login-form');
    const adminPasswordInput = document.getElementById('admin-password');
    const refreshBtn = document.getElementById('refresh-btn');
    const addTestIdBtn = document.getElementById('add-test-id-btn');
    const addTestIdForm = document.getElementById('add-test-id-form');
    const newTestIdForm = document.getElementById('new-test-id-form');
    const cancelAddBtn = document.getElementById('cancel-add-btn');
    const testIdTableBody = document.getElementById('test-id-table-body');
    
    // 统计元素
    const totalCountEl = document.getElementById('total-count');
    const activeCountEl = document.getElementById('active-count');
    const inactiveCountEl = document.getElementById('inactive-count');
    const todayCountEl = document.getElementById('today-count');
    
    // 检查是否已登录
    const isLoggedIn = localStorage.getItem('laa_admin_logged_in') === 'true';
    
    if (isLoggedIn) {
        showManagementSection();
    }
    
    // 登录表单提交
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const password = adminPasswordInput.value.trim();
        
        if (password === ADMIN_PASSWORD) {
            // 登录成功
            localStorage.setItem('laa_admin_logged_in', 'true');
            showManagementSection();
            adminPasswordInput.value = '';
        } else {
            alert('密码错误，请重试');
            adminPasswordInput.focus();
        }
    });
    
    // 刷新按钮
    refreshBtn.addEventListener('click', loadActivationData);
    
    // 新增测试编号按钮
    addTestIdBtn.addEventListener('click', function() {
        addTestIdForm.style.display = 'block';
        addTestIdBtn.style.display = 'none';
        
        // 自动生成测试编号
        const newTestId = generateNewTestId();
        document.getElementById('new-test-id').value = newTestId;
    });
    
    // 取消新增
    cancelAddBtn.addEventListener('click', function() {
        addTestIdForm.style.display = 'none';
        addTestIdBtn.style.display = 'block';
        newTestIdForm.reset();
    });
    
    // 新增测试编号表单提交
    newTestIdForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const testId = document.getElementById('new-test-id').value.trim().toUpperCase();
        const resultType = document.getElementById('new-result-type').value;
        const status = document.getElementById('new-status').value;
        const notes = document.getElementById('new-notes').value.trim();
        
        // 验证测试编号格式
        if (!isValidTestId(testId)) {
            alert('测试编号格式不正确，应为 LAA+5位数字（如 LAA24001）');
            return;
        }
        
        // 保存测试编号
        saveTestIdRecord(testId, resultType, status, notes);
        
        // 重置表单并隐藏
        newTestIdForm.reset();
        addTestIdForm.style.display = 'none';
        addTestIdBtn.style.display = 'block';
        
        // 重新加载数据
        loadActivationData();
        
        alert('测试编号已保存');
    });
    
    // 显示管理区域
    function showManagementSection() {
        loginSection.style.display = 'none';
        managementSection.classList.add('active');
        loadActivationData();
    }
    
    // 加载开通数据
    function loadActivationData() {
        const data = getActivationData();
        const today = new Date().toDateString();
        let todayCount = 0;
        
        // 清空表格
        testIdTableBody.innerHTML = '';
        
        // 统计变量
        let totalCount = 0;
        let activeCount = 0;
        let inactiveCount = 0;
        
        // 按创建时间倒序排序
        const sortedTestIds = Object.keys(data).sort((a, b) => {
            const timeA = data[a].createdAt || 0;
            const timeB = data[b].createdAt || 0;
            return timeB - timeA;
        });
        
        if (sortedTestIds.length === 0) {
            // 显示空状态
            testIdTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-database" style="font-size: 32px; margin-bottom: 15px; display: block; opacity: 0.5;"></i>
                        暂无测试编号数据
                    </td>
                </tr>
            `;
        } else {
            // 填充表格数据
            sortedTestIds.forEach(testId => {
                const record = data[testId];
                totalCount++;
                
                if (record.activated) {
                    activeCount++;
                } else {
                    inactiveCount++;
                }
                
                // 检查是否是今天创建的
                if (record.createdAt) {
                    const createdDate = new Date(record.createdAt).toDateString();
                    if (createdDate === today) {
                        todayCount++;
                    }
                }
                
                // 创建表格行
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="test-id-number">${testId}</td>
                    <td>
                        <span class="status-badge ${record.activated ? 'status-active' : 'status-inactive'}">
                            ${record.activated ? '已开通' : '未开通'}
                        </span>
                    </td>
                    <td class="result-type">${record.resultType || '未设置'}</td>
                    <td>${formatDate(record.createdAt)}</td>
                    <td>${record.notes || '-'}</td>
                    <td class="action-cell">
                        ${!record.activated ? 
                            `<button class="table-btn activate-btn" onclick="activateTestId('${testId}')">
                                <i class="fas fa-check"></i> 开通
                            </button>` : 
                            `<button class="table-btn deactivate-btn" onclick="deactivateTestId('${testId}')">
                                <i class="fas fa-times"></i> 关闭
                            </button>`
                        }
                        <button class="table-btn edit-btn" onclick="editTestId('${testId}')">
                            <i class="fas fa-edit"></i> 编辑
                        </button>
                    </td>
                `;
                
                testIdTableBody.appendChild(row);
            });
        }
        
        // 更新统计信息
        totalCountEl.textContent = totalCount;
        activeCountEl.textContent = activeCount;
        inactiveCountEl.textContent = inactiveCount;
        todayCountEl.textContent = todayCount;
    }
    
    // 初始加载数据
    if (isLoggedIn) {
        loadActivationData();
    }
}

// 获取开通数据
function getActivationData() {
    const data = localStorage.getItem(ACTIVATION_DATA_KEY);
    return data ? JSON.parse(data) : {};
}

// 保存开通数据
function saveActivationData(data) {
    localStorage.setItem(ACTIVATION_DATA_KEY, JSON.stringify(data));
}

// 生成新的测试编号
function generateNewTestId() {
    const data = getActivationData();
    const existingIds = Object.keys(data);
    
    // 查找最大的编号
    let maxId = 24000;
    existingIds.forEach(id => {
        const match = id.match(/LAA(\d+)/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > maxId) {
                maxId = num;
            }
        }
    });
    
    // 生成新编号
    const newIdNum = maxId + 1;
    return `LAA${newIdNum}`;
}

// 验证测试编号格式
function isValidTestId(testId) {
    const pattern = /^LAA\d{5}$/;
    return pattern.test(testId);
}

// 保存测试编号记录
function saveTestIdRecord(testId, resultType, status, notes) {
    const data = getActivationData();
    
    data[testId] = {
        testId: testId,
        resultType: resultType,
        activated: status === 'active',
        notes: notes,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    
    saveActivationData(data);
}

// 开通测试编号
function activateTestId(testId) {
    if (confirm(`确定要开通测试编号 ${testId} 吗？`)) {
        const data = getActivationData();
        
        if (data[testId]) {
            data[testId].activated = true;
            data[testId].updatedAt = Date.now();
            saveActivationData(data);
            
            // 重新加载数据
            if (typeof loadActivationData === 'function') {
                loadActivationData();
            }
            
            alert(`测试编号 ${testId} 已开通`);
        } else {
            alert('未找到该测试编号');
        }
    }
}

// 关闭测试编号
function deactivateTestId(testId) {
    if (confirm(`确定要关闭测试编号 ${testId} 吗？`)) {
        const data = getActivationData();
        
        if (data[testId]) {
            data[testId].activated = false;
            data[testId].updatedAt = Date.now();
            saveActivationData(data);
            
            // 重新加载数据
            if (typeof loadActivationData === 'function') {
                loadActivationData();
            }
            
            alert(`测试编号 ${testId} 已关闭`);
        } else {
            alert('未找到该测试编号');
        }
    }
}

// 编辑测试编号
function editTestId(testId) {
    const data = getActivationData();
    const record = data[testId];
    
    if (!record) {
        alert('未找到该测试编号');
        return;
    }
    
    const newResultType = prompt('请输入新的结果类型（A/B/C/自定义）：', record.resultType || '');
    if (newResultType === null) return;
    
    const newNotes = prompt('请输入新的备注信息：', record.notes || '');
    if (newNotes === null) return;
    
    record.resultType = newResultType.trim();
    record.notes = newNotes.trim();
    record.updatedAt = Date.now();
    
    saveActivationData(data);
    
    // 重新加载数据
    if (typeof loadActivationData === 'function') {
        loadActivationData();
    }
    
    alert('测试编号已更新');
}

// 格式化日期
function formatDate(timestamp) {
    if (!timestamp) return '-';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initAdminActivation);