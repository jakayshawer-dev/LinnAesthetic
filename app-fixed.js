// 主应用逻辑 - 修复版

// 全局状态
let currentQuestionIndex = 0;
let userAnswers = new Array(questions.length).fill(null);
let currentScores = null;
let currentResults = null;

// DOM元素
const homePage = document.getElementById('home-page');
const questionPage = document.getElementById('question-page');
const resultPage = document.getElementById('result-page');
const startBtn = document.getElementById('start-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const questionTitle = document.getElementById('question-title');
const observation = document.getElementById('observation');
const optionsContainer = document.getElementById('options-container');

// 结果页元素
const resultTendency = document.getElementById('result-tendency');
const resultTendencyDesc = document.getElementById('result-tendency-desc');
const resultDirection = document.getElementById('result-direction');
const resultDirectionDesc = document.getElementById('result-direction-desc');
const resultSide = document.getElementById('result-side');
const resultSideDesc = document.getElementById('result-side-desc');
const resultSummary = document.getElementById('result-summary');

// 初始化应用
function initApp() {
    console.log('初始化应用...');
    
    // 绑定事件监听器
    startBtn.addEventListener('click', startTest);
    prevBtn.addEventListener('click', showPreviousQuestion);
    nextBtn.addEventListener('click', showNextQuestion);
    
    // 安全地获取结果页按钮
    const retestBtn = document.getElementById('retest-btn');
    const detailBtn = document.getElementById('detail-btn');
    
    if (retestBtn) {
        retestBtn.addEventListener('click', restartTest);
        console.log('✅ retestBtn事件绑定成功');
    }
    
    if (detailBtn) {
        detailBtn.addEventListener('click', showAdvancedAssessment);
        console.log('✅ detailBtn事件绑定成功');
    }
    
    // 显示首页
    showPage('home');
    console.log('✅ 应用初始化完成');
}

// 开始测试
function startTest() {
    console.log('开始测试按钮被点击');
    // 重置状态
    currentQuestionIndex = 0;
    userAnswers.fill(null);
    currentScores = null;
    currentResults = null;
    
    // 显示第一题
    showQuestion(0);
    showPage('question');
}

// 显示指定页面
function showPage(pageName) {
    console.log('显示页面:', pageName);
    // 隐藏所有页面
    homePage.classList.remove('active');
    questionPage.classList.remove('active');
    resultPage.classList.remove('active');
    
    // 显示目标页面
    switch(pageName) {
        case 'home':
            homePage.classList.add('active');
            break;
        case 'question':
            questionPage.classList.add('active');
            break;
        case 'result':
            resultPage.classList.add('active');
            break;
    }
}

// 显示指定题目
function showQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    
    currentQuestionIndex = index;
    const question = questions[index];
    
    questionTitle.textContent = question.title;
    observation.textContent = question.observation;
    
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, optionIndex) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        if (userAnswers[index] === optionIndex) {
            optionElement.classList.add('selected');
        }
        
        optionElement.innerHTML = `
            <div class="option-content">
                <div class="option-text">${option}</div>
            </div>
        `;
        
        optionElement.addEventListener('click', () => {
            selectOption(index, optionIndex);
        });
        
        optionsContainer.appendChild(optionElement);
    });
    
    updateProgress();
    updateButtonStates();
}

// 选择选项
function selectOption(questionIndex, optionIndex) {
    userAnswers[questionIndex] = optionIndex;
    
    // 更新UI
    const options = document.querySelectorAll('#options-container .option');
    options.forEach((option, idx) => {
        if (idx === optionIndex) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
    
    updateButtonStates();
}

// 显示上一题
function showPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        showQuestion(currentQuestionIndex - 1);
    }
}

// 显示下一题
function showNextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        showQuestion(currentQuestionIndex);
    } else {
        calculateAndShowResults();
    }
}

// 更新进度
function updateProgress() {
    const answeredCount = userAnswers.filter(answer => answer !== null).length;
    const progress = (answeredCount / questions.length) * 100;
    
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${currentQuestionIndex + 1}/${questions.length}`;
}

// 更新按钮状态
function updateButtonStates() {
    // 上一题按钮
    prevBtn.disabled = currentQuestionIndex === 0;
    
    // 下一题按钮
    const hasAnswer = userAnswers[currentQuestionIndex] !== null;
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    
    if (isLastQuestion) {
        nextBtn.innerHTML = '查看结果 <i class="fas fa-arrow-right"></i>';
        nextBtn.disabled = !hasAnswer;
    } else {
        nextBtn.innerHTML = '下一题 <i class="fas fa-arrow-right"></i>';
        nextBtn.disabled = !hasAnswer;
    }
}

// 计算并显示结果
function calculateAndShowResults() {
    // 计算分数
    currentScores = calculateScores(userAnswers);
    
    // 计算结果
    currentResults = calculateResults(currentScores);
    
    // 🎯 注意：testId将在第二层（进阶评估）完成后生成
    // 💾 保存基础答案到localStorage，供第二层使用
    try {
        const basicAnswers = {};
        userAnswers.forEach((answer, index) => {
            basicAnswers['BQ' + (index + 1)] = questions[index].options[answer];
        });
        localStorage.setItem('laa_basic_answers', JSON.stringify(basicAnswers));
        console.log('💾 基础答案已保存:', Object.keys(basicAnswers).length, '个答案');
    } catch (e) {
        console.warn('保存基础答案失败:', e);
    }
    
    // 更新结果页
    updateResultPage();
    
    // 显示结果页
    showPage('result');
}

// 更新结果页
function updateResultPage() {
    // 获取详细描述
    const descriptions = getDetailedDescriptions(currentResults, currentScores);
    
    // 更新真假倾向
    resultTendency.textContent = currentResults.tendency;
    resultTendencyDesc.textContent = descriptions.tendency;
    
    // 更新主问题方向
    resultDirection.textContent = currentResults.direction;
    resultDirectionDesc.textContent = descriptions.direction;
    
    // 更新左右侧提示
    resultSide.textContent = currentResults.side;
    resultSideDesc.textContent = descriptions.side;
    
    // 更新结果说明
    resultSummary.textContent = descriptions.summary;
}

// 重新测试
function restartTest() {
    // 重置状态
    currentQuestionIndex = 0;
    userAnswers.fill(null);
    currentScores = null;
    currentResults = null;
    
    // 返回首页
    showPage('home');
}

// 进入第二层进阶评估
function showAdvancedAssessment() {
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
}

// 生成基础测试编号（已弃用 - testId现在在第二层生成）
// 保留函数是为了兼容性，但不再使用
function generateBasicTestId() {
    console.warn('⚠️ generateBasicTestId已弃用：testId现在在第二层生成');
    return 'DEPRECATED';
}

// 直接跳转到淘宝
// 生成测试编号（在advanced-unlock.html中使用）
function generateTestId() {
    // 从localStorage获取最后一个编号，如果没有则从24001开始
    let lastId = localStorage.getItem('last_test_id');
    if (!lastId) {
        lastId = '24000';
    }
    
    // 生成新编号
    const newIdNum = parseInt(lastId) + 1;
    const newId = 'LAA' + newIdNum;
    
    localStorage.setItem('last_test_id', newIdNum.toString());
    
    return newId;
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);

// 添加键盘支持
document.addEventListener('keydown', (e) => {
    if (questionPage.classList.contains('active')) {
        switch(e.key) {
            case 'ArrowLeft':
                if (!prevBtn.disabled) showPreviousQuestion();
                break;
            case 'ArrowRight':
            case 'Enter':
                if (!nextBtn.disabled) showNextQuestion();
                break;
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
                const optionIndex = parseInt(e.key) - 1;
                if (optionIndex < questions[currentQuestionIndex].options.length) {
                    selectOption(currentQuestionIndex, optionIndex);
                }
                break;
        }
    }
});

// 添加触摸支持（移动端）
let touchStartX = 0;
document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].screenX;
});

document.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const swipeThreshold = 50;
    
    if (touchStartX - touchEndX > swipeThreshold) {
        // 向左滑动 - 下一题
        if (!nextBtn.disabled) showNextQuestion();
    } else if (touchEndX - touchStartX > swipeThreshold) {
        // 向右滑动 - 上一题
        if (!prevBtn.disabled) showPreviousQuestion();
    }
});

// 调试功能：在控制台显示当前状态
window.debugState = function() {
    console.log('当前状态:');
    console.log('当前题目:', currentQuestionIndex + 1);
    console.log('用户答案:', userAnswers);
    console.log('当前分数:', currentScores);
    console.log('当前结果:', currentResults);
};