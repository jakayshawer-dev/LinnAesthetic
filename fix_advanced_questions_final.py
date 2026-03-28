import re

# 读取advanced-questions.html
with open('advanced-questions.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 添加second-layer-testid.js引用
if 'second-layer-testid.js' not in content:
    # 在test-id.js之后添加
    content = content.replace(
        '<script src="js/test-id.js"></script>',
        '<script src="js/test-id.js"></script>\n    <script src="js/second-layer-testid.js"></script>'
    )

# 2. 修改showNextAdvancedQuestion函数，在最后一题完成后生成testId
# 找到函数定义
func_start = content.find('function showNextAdvancedQuestion() {')
if func_start != -1:
    # 找到函数结束
    brace_count = 0
    func_end = func_start
    
    for i in range(func_start, len(content)):
        if content[i] == '{':
            brace_count += 1
        elif content[i] == '}':
            brace_count -= 1
            if brace_count == 0:
                func_end = i + 1
                break
    
    if func_end > func_start:
        func_content = content[func_start:func_end]
        
        # 在跳转到照片上传页之前添加testId生成逻辑
        if 'window.location.href = \'advanced-photo.html\'' in func_content:
            # 在跳转之前插入testId生成代码
            new_func_content = func_content.replace(
                'window.location.href = \'advanced-photo.html\';',
                '''// 🎯 生成第二层testId
                try {
                    // 收集所有进阶答案
                    const advancedAnswers = {};
                    advancedUserAnswers.forEach((answer, index) => {
                        advancedAnswers['AQ' + (index + 1)] = answer;
                    });
                    
                    // 获取基础答案（从第一层）
                    let basicAnswers = {};
                    try {
                        const basicData = localStorage.getItem('laa_basic_answers');
                        if (basicData) {
                            basicAnswers = JSON.parse(basicData);
                        }
                    } catch (e) {
                        console.warn('无法获取基础答案:', e);
                    }
                    
                    // 生成第二层testId
                    if (window.generateSecondLayerTestId) {
                        const testId = window.generateSecondLayerTestId(basicAnswers, advancedAnswers);
                        
                        // 保存到localStorage
                        localStorage.setItem('current_second_layer_test_id', testId);
                        localStorage.setItem('current_test_id', testId);
                        
                        console.log('✅ 第二层testId已生成:', testId);
                        console.log('基础答案数量:', Object.keys(basicAnswers).length);
                        console.log('进阶答案数量:', Object.keys(advancedAnswers).length);
                        
                        // 显示提示
                        alert('🎯 第二层评估完成！\\n\\n您的测试编号：' + testId + '\\n\\n请继续上传照片完成评估。');
                    } else {
                        console.warn('generateSecondLayerTestId函数未加载');
                    }
                } catch (error) {
                    console.error('生成第二层testId失败:', error);
                }
                
                // 跳转到照片上传页
                window.location.href = 'advanced-photo.html';'''
            )
            
            # 替换原函数
            content = content[:func_start] + new_func_content + content[func_end:]
            
            print("✅ advanced-questions.html已修改：在最后一题完成后生成testId")
        else:
            print("⚠️ 未找到跳转到advanced-photo.html的代码")
    else:
        print("⚠️ 无法找到函数结束")
else:
    print("⚠️ 未找到showNextAdvancedQuestion函数")

# 保存修改
with open('advanced-questions.html', 'w', encoding='utf-8') as f:
    f.write(content)