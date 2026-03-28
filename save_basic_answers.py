import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 在calculateAndShowResults函数中添加保存基础答案的逻辑
pattern = r'// 计算并显示结果\s+function calculateAndShowResults\(\) \{[\s\S]*?// 更新结果页\s+updateResultPage\(\)'

def replace_function(match):
    func_part = match.group(0)
    
    # 在适当位置添加保存基础答案的逻辑
    new_func_part = func_part.replace(
        '// 🎯 注意：testId将在第二层（进阶评估）完成后生成',
        '''// 🎯 注意：testId将在第二层（进阶评估）完成后生成
    // 💾 保存基础答案到localStorage，供第二层使用
    try {
        const basicAnswers = {};
        userAnswers.forEach((answer, index) => {
            basicAnswers[\`BQ\${index + 1}\`] = answer;
        });
        localStorage.setItem('laa_basic_answers', JSON.stringify(basicAnswers));
        console.log('💾 基础答案已保存:', Object.keys(basicAnswers).length, '个答案');
    } catch (e) {
        console.warn('保存基础答案失败:', e);
    }'''
    )
    
    return new_func_part

new_content = re.sub(pattern, replace_function, content, flags=re.DOTALL)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ app.js已修改：保存基础答案到localStorage")
