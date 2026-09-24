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
  if (prevBtnBottom) prevBtnBottom.addEventListener('click', goPrev);
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

  // 储存第一层结果，供第二层结果页读取
  try {
    localStorage.setItem('laa_layer1_results', JSON.stringify({
      tendency: currentResults.tendency,
      direction: currentResults.direction,
      side: currentResults.side,
      complexity: currentResults.complexity
    }));
  } catch(e) {}

  // 同步评估结果到 Supabase（2026-09-24 修复：之前只写 localStorage，老师后台看不到）
  insertToSupabase(currentResults, currentScores);

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

/**
 * 把第一层评估结果插入 Supabase assessments 表
 * 字段映射：
 *   - resultid = uuid（crypto.randomUUID 浏览器原生支持）
 *   - maintype = currentResults.direction（T1-T5）
 *   - sidehint = currentResults.side
 *   - complexityhint = currentResults.complexity
 *   - trainingprioritytext = 自动生成的训练重点文字
 *   - thirdlayerstatus = 'unpaid'（默认，等 mike 后台开通）
 */
async function insertToSupabase(results, scores) {
  try {
    if (!window.supabase || !window.supabase.createClient) {
      console.warn('[laa] supabase-js 未加载，跳过云端同步（仅 localStorage）');
      return;
    }
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
      console.warn('[laa] supabase-config 未加载，跳过云端同步');
      return;
    }

    // 客户端（复用 window.laaSupabase，如果 teacher.html 之前已创建过）
    const client = window.laaSupabase || window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    );
    window.laaSupabase = client;

    const resultid = crypto.randomUUID();

    // 生成 trainingprioritytext
    const trainingPriority = generateTrainingPriorityText(results);

    const { data, error } = await client
      .from('assessments')
      .insert({
        resultid: resultid,
        maintype: results.direction,
        sidehint: results.side,
        complexityhint: results.complexity,
        trainingprioritytext: trainingPriority,
        thirdlayerstatus: window.STATUS_UNPAID || 'unpaid',
      })
      .select();

    if (error) {
      console.error('[laa] Supabase 插入失败：', error);
    } else {
      console.log('[laa] 评估已同步到云端，resultid：', resultid);
      // 把 resultid 存到 localStorage，方便第二层关联
      try {
        localStorage.setItem('laa_result_id', resultid);
      } catch(e) {}
    }
  } catch (e) {
    console.error('[laa] insertToSupabase 异常：', e);
  }
}

function generateTrainingPriorityText(results) {
  const sideLabel = {
    left_weak: '左侧偏弱',
    right_weak: '右侧偏弱',
    left_tension: '左侧偏紧',
    right_tension: '右侧偏紧',
    bilateral: '双侧均衡',
    unclear: '暂不判断',
  }[results.side] || results.side;

  return `${results.tendency} · 主方向 ${results.direction} · ${sideLabel} · 复杂度 ${results.complexity}`;
}

function goToAdvanced() {
  window.location.href = 'advanced-intro.html';
}

document.addEventListener('DOMContentLoaded', initApp);
