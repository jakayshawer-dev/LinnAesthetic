// 第一层修复脚本
console.log('🔧 修复第一层12题选项问题...');

// 检查所有必要的DOM元素
const requiredElements = [
    'home-page',
    'question-page',
    'result-page',
    'start-btn',
    'prev-btn',
    'next-btn',
    'progress-fill',
    'progress-text',
    'question-title',
    'observation',
    'options-container',
    'result-tendency',
    'result-tendency-desc',
    'result-direction',
    'result-direction-desc',
    'result-side',
    'result-side-desc',
    'result-summary',
    'retest-btn',
    'detail-btn'
];

console.log('📋 检查DOM元素...');
requiredElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
        console.log(`✅ ${id} 存在`);
    } else {
        console.warn(`⚠️ ${id} 不存在`);
    }
});

// 检查questions.js是否加载
if (typeof questions === 'undefined') {
    console.error('❌ questions变量未定义 - questions.js可能未加载');
} else {
    console.log(`✅ questions已加载，共${questions.length}题`);
    
    // 测试第一题数据
    if (questions.length > 0) {
        console.log(`📝 第1题标题: ${questions[0].title}`);
        console.log(`📝 第1题选项数量: ${questions[0].options.length}`);
        console.log(`📝 第1题选项示例: ${questions[0].options[0]}`);
    }
}

// 检查app.js函数
const requiredFunctions = [
    'initApp',
    'startTest',
    'showQuestion',
    'selectOption',
    'showPreviousQuestion',
    'showNextQuestion',
    'calculateAndShowResults',
    'restartTest',
    'showAdvancedAssessment'
];

console.log('📋 检查JavaScript函数...');
requiredFunctions.forEach(funcName => {
    if (typeof window[funcName] === 'function') {
        console.log(`✅ ${funcName} 函数存在`);
    } else {
        console.warn(`⚠️ ${funcName} 函数不存在`);
    }
});

// 测试选项生成
function testOptionGeneration() {
    console.log('🧪 测试选项生成...');
    
    const optionsContainer = document.getElementById('options-container');
    if (!optionsContainer) {
        console.error('❌ options-container元素不存在');
        return;
    }
    
    // 清空容器
    optionsContainer.innerHTML = '';
    
    // 模拟生成选项
    if (questions && questions.length > 0) {
        const question = questions[0];
        
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.innerHTML = `
                <div class="option-content">
                    <div class="option-text">${option}</div>
                </div>
            `;
            
            optionElement.addEventListener('click', () => {
                console.log(`点击了选项 ${index + 1}: ${option}`);
            });
            
            optionsContainer.appendChild(optionElement);
        });
        
        console.log(`✅ 成功生成 ${question.options.length} 个选项`);
    } else {
        console.error('❌ 无法获取题目数据');
    }
}

// 运行测试
setTimeout(() => {
    testOptionGeneration();
    
    // 检查是否已初始化
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        console.log('✅ start-btn元素存在，检查点击事件...');
        
        // 临时添加测试点击事件
        const originalClick = startBtn.onclick;
        startBtn.addEventListener('click', function() {
            console.log('🎯 start-btn被点击！');
            if (typeof startTest === 'function') {
                console.log('✅ startTest函数可调用');
            } else {
                console.error('❌ startTest函数不可调用');
            }
        });
    }
}, 1000);

console.log('🔧 修复脚本执行完成');