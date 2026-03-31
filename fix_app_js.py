import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 找到calculateAndShowResults函数
pattern = r'// 计算并显示结果\s+function calculateAndShowResults\(\) \{[\s\S]*?\n\}'

# 替换为正确的版本（移除testId生成）
new_function = '''// 计算并显示结果
function calculateAndShowResults() {
    // 计算分数
    currentScores = calculateScores(userAnswers);
    
    // 计算结果
    currentResults = calculateResults(currentScores);
    
    // 🎯 注意：testId将在第二层（进阶评估）完成后生成
    // 这里只显示基础评估结果
    
    // 更新结果页
    updateResultPage();
    
    // 显示结果页
    showPage('result');
}'''

# 执行替换
new_content = re.sub(pattern, new_function, content, flags=re.DOTALL)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ app.js已修复：移除了第一层的testId生成逻辑")
