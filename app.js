let currentQuestionIndex = 0;
let userAnswers = [];
let currentScores = null;
let currentResults = null;

const homePage = document.getElementById('home-page');
const questionPage = document.getElementById('question-page');
const resultPage = document.getElementById('result-page');

const startBtn = document.getElementById('start-btn');
const prevBtn = document.getElementById('prev-btn');
const prevBtnBottom = document.getElementById('prev-btn-bottom');
const nextBtn = document.getElementById('next-btn');

const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const questionTitle = document.getElementById('question-title');
const observation = document.getElementById('observation');
const optionsContainer = document.getElementById('options-container');

const resultTendency = document.getElementById('result-tendency');
const resultTendencyDesc = document.getElementById('result-tendency-desc');
const resultDirection = document.getElementById('result-direction');
const resultDirectionDesc = document.getElementById('result-direction-desc');
const resultSide = document.getElementById('result-side');
const resultSummary = document.getElementById('result-summary');

const retestBtn = document.getElementById('retest-btn');
const detailBtn = document.getElementById('detail-btn');

function initApp() {
  if (!window.questions || !Array.isArray(window.questions) || window.questions.length !== 12) {
    alert('题库加载失败，请刷新页面重试。');
    return;
  }
  userAnswers = new Array(window.questions.length).fill(null);
  startBtn.addEventListener('click', startTest);
  prevBtn.addEventListener('click', goPrev);
  prevBtnBottom.addEventListener('click', goPrev);
  nextBtn.addEventListener('click', goNext);
  retestBtn.addEventListener('click', restartTest);
  detailBtn.addEventListener('click', goToAdvanced);
  showPage('home');
}

function showPage(name) {
  homePage.classList.remove('active');
  questionPage.classList.remove('active');
  resultPage.classList.remove('active');
  if (name === 'home') homePage.classList.add('active');
  if (name === 'question') questionPage.classList.add('active');
  if (name === 'result') resultPage.classList.add('active');
}

function startTest() {
  currentQuestionIndex = 0;
  userAnswers = new Array(window.questions.length).fill(null);
  currentScores = null;
  currentResults = null;
  showPage('question');
  renderQuestion();
}

function renderQuestion() {
  const question = window.questions[currentQuestionIndex];
  if (!question || !Array.isArray(question.options) || question.options.length === 0) {
    optionsContainer.innerHTML = '<div class="observation-box">题目选项加载失败，请检查 questions.js</div>';
    return;
  }

  questionTitle.textContent = question.title;
  observation.textContent = question.observation;
  progressText.textContent = `第 ${currentQuestionIndex + 1}/${window.questions.length} 题`;
  progressFill.style.width = `${((currentQuestionIndex + 1) / window.questions.length) * 100}%`;
  optionsContainer.innerHTML = '';

  question.options.forEach((option, idx) => {
    const optionElement = document.createElement('button');
    optionElement.type = 'button';
    optionElement.className = 'option';
    if (userAnswers[currentQuestionIndex] === option.value) optionElement.classList.add('selected');
    optionElement.innerHTML = `<span class="option-indicator">${String.fromCharCode(65 + idx)}</span><span class="option-text">${option.text}</span>`;
    optionElement.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      userAnswers[currentQuestionIndex] = option.value;
      renderQuestion();
    });
    optionsContainer.appendChild(optionElement);
  });

  prevBtn.disabled = currentQuestionIndex === 0;
  prevBtnBottom.disabled = currentQuestionIndex === 0;
  nextBtn.disabled = !userAnswers[currentQuestionIndex];
  nextBtn.textContent = currentQuestionIndex === window.questions.length - 1 ? '查看结果' : '下一题';
}

function goPrev() {
  if (currentQuestionIndex === 0) return;
  currentQuestionIndex -= 1;
  renderQuestion();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goNext() {
  if (!userAnswers[currentQuestionIndex]) {
    alert('请先选择一个答案');
    return;
  }
  if (currentQuestionIndex < window.questions.length - 1) {
    currentQuestionIndex += 1;
    renderQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  finishTest();
}

function finishTest() {
  currentScores = calculateScores(userAnswers);
  currentResults = calculateResults(currentScores);

  // 获取详细描述
  const descriptions = getDetailedDescriptions(currentResults, currentScores);

  // 更新结果页
  resultTendency.textContent = currentResults.tendency;
  resultTendencyDesc.textContent = descriptions.tendency;
  resultDirection.textContent = currentResults.direction;
  resultDirectionDesc.textContent = descriptions.direction;
  resultSide.textContent = currentResults.side;
  resultSummary.textContent = descriptions.summary;

  showPage('result');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function restartTest() {
  showPage('home');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToAdvanced() {
  window.location.href = 'advanced-intro.html';
}

document.addEventListener('DOMContentLoaded', initApp);
