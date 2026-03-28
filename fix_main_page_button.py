import re

# 读取app.js
with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 修改showAdvancedAssessment函数，确保跳转到第二层
pattern = r'function showAdvancedAssessment\(\) \{[\s\S]*?window\.location\.href = \'advanced-intro\.html\'[\s\S]*?\n\}'

new_function = '''function showAdvancedAssessment() {
    // 获取当前用户的测试编号（检查是否有第二层testId）
    let testId = localStorage.getItem('current_second_layer_test_id');
    
    if (!testId) {
        // 没有第二层testId，跳转到第二层说明页
        console.log('🔄 没有第二层testId，跳转到第二层说明页');
        window.location.href = 'advanced-intro.html';
        return;
    }
    
    // 检查测试编号状态
    try {
        if (!window.checkTestIdStatus) {
            // 如果TestIDManager未加载，跳转到说明页
            window.location.href = 'advanced-intro.html';
            return;
        }
        
        const status = window.checkTestIdStatus(testId);
        
        if (!status.exists) {
            // 测试编号不存在，跳转到说明页
            window.location.href = 'advanced-intro.html';
            return;
        }
        
        // 检查支付状态
        if (!status.paid) {
            // 未支付，跳转到支付页面
            window.location.href = 'payment-page.html?testId=' + encodeURIComponent(testId);
            return;
        }
        
        // 检查开通状态
        if (!status.opened) {
            // 已支付但未开通，跳转到解锁页面
            window.location.href = 'advanced-unlock.html?testId=' + encodeURIComponent(testId);
            return;
        }
        
        // 检查第二层完成状态
        const secondLayerCompleted = window.isSecondLayerCompleted ? window.isSecondLayerCompleted(testId) : false;
        if (!secondLayerCompleted) {
            // 第二层未完成，跳转到第二层问卷
            window.location.href = 'advanced-questions.html?testId=' + encodeURIComponent(testId);
            return;
        }
        
        // 所有条件满足，跳转到结果页面
        window.location.href = 'result-viewer.html?testId=' + encodeURIComponent(testId);
        
    } catch (error) {
        console.error('检查测试编号状态时出错:', error);
        // 出错时跳转到说明页
        window.location.href = 'advanced-intro.html';
    }
}'''

# 执行替换
new_content = re.sub(pattern, new_function, content, flags=re.DOTALL)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ app.js中的showAdvancedAssessment函数已修复：正确跳转到第二层")
