import re

# 读取advanced-questions.html
with open('advanced-questions.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 添加second-layer-testid.js引用
if 'second-layer-testid.js' not in content:
    # 在test-id.js之后添加
    content = content.replace(
        '<script src="js/test-id.js"></script>',
        '<script src="js/test-id.js"></script>\n    <script src="js/second-layer-testid.js"></script>'
    )

# 找到showNextAdvancedQuestion函数，在最后一题完成后添加testId生成逻辑
# 先找到函数定义
pattern = r'function showNextAdvancedQuestion\(\) \{[\s\S]*?\n\}'

def replace_function(match):
    func_content = match.group(0)
    
    # 在函数末尾添加testId生成逻辑（在最后一题完成后）
    if '最后一题' in func_content or 'currentAdvancedQuestionIndex === advancedQuestions.length - 1' in func_content:
        # 已经有一些逻辑，我们在适当位置添加
        pass
    
    # 直接在整个函数后面添加新逻辑
    new_func = func_content.rstrip('}') + '''
    // 🎯 如果是最后一题，生成testId
    if (currentAdvancedQuestionIndex === advancedQuestions.length - 1) {
        // 收集所有答案
        const advancedAnswers = {};
        advancedUserAnswers.forEach((answer, index) => {
            advancedAnswers[\`AQ\${index + 1}\`] = answer;
        });
        
        // 获取基础答案（从第一层）
        let basicAnswers = {};
        try {
            const basicData = localStorage.getItem(\'laa_basic_answers\');
            if (basicData) {
                basicAnswers = JSON.parse(basicData);
            }
        } catch (e) {
            console.warn(\'无法获取基础答案:\', e);
        }
        
        // 生成第二层testId
        setTimeout(() => {
            try {
                if (window.generateSecondLayerTestId) {
                    const testId = window.generateSecondLayerTestId(basicAnswers, advancedAnswers);
                    
                    // 保存到localStorage
                    localStorage.setItem(\'current_second_layer_test_id\', testId);
                    localStorage.setItem(\'current_test_id\', testId);
                    
                    console.log(\'✅ 第二层testId已生成:\', testId);
                    console.log(\'基础答案数量:\', Object.keys(basicAnswers).length);
                    console.log(\'进阶答案数量:\', Object.keys(advancedAnswers).length);
                    
                    // 显示提示
                    alert(\`🎯 第二层评估完成！\\n\\n您的测试编号：\${testId}\\n\\n请继续上传照片完成评估。\`);
                } else {
                    console.warn(\'generateSecondLayerTestId函数未加载\');
                }
            } catch (error) {
                console.error(\'生成第二层testId失败:\', error);
            }
        }, 100);
    }
}
'''
    
    return new_func

# 执行替换
new_content = re.sub(pattern, replace_function, content, flags=re.DOTALL)

with open('advanced-questions.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ advanced-questions.html已修改：在最后一题完成后生成testId")
