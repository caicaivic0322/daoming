/**
 * 测名字 — Name Analysis Page
 * Core feature: name analysis with DeepSeek API integration
 */

import { zodiacData } from './zodiac-data.js';

let selectedZodiac = null;
let isPaid = false; // 模拟付费状态
let remainingTries = 2;

export function renderNameAnalysis(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>道 家 测 名</h1>
      <p class="page-header-desc">融合星象 · 易经 · 连山 · 归藏 · 九宫八卦 · 字形字义</p>
    </div>

    <div class="page-section">
      <!-- Input Form -->
      <form class="analysis-form" id="name-form">
        <div id="tries-container" style="text-align:center;"></div>
        
        <div class="form-group">
          <label class="form-label">请输入姓名</label>
          <input
            type="text"
            class="form-input"
            id="name-input"
            placeholder="请输入您的姓名"
            maxlength="6"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">请选择属相</label>
          <div class="zodiac-grid" id="zodiac-grid">
            ${zodiacData.map((z, i) => `
              <button type="button" class="zodiac-item" data-index="${i}" data-name="${z.name}">
                <span class="zodiac-emoji">${z.emoji}</span>
                <span class="zodiac-name">${z.name}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <button type="submit" class="btn-primary" id="submit-btn">
          开 始 测 名
        </button>
      </form>

      <!-- Results Area (hidden by default) -->
      <div class="results-area" id="results-area" style="display:none;"></div>
    </div>
  `;

  initFormHandlers();
  checkLimit(); // Initial limit check
}

/**
 * 获取剩余次数
 */
async function checkLimit() {
  try {
    const response = await fetch('/api/check-limit');
    if (response.ok) {
      const data = await response.json();
      remainingTries = data.remainingTries;
      isPaid = data.isPaid;
      updateTriesUI();
    }
  } catch (err) {
    console.error('Failed to check limit:', err);
  }
}

function updateTriesUI() {
  const container = document.getElementById('tries-container');
  if (!container) return;

  if (isPaid) {
    container.innerHTML = '';
    return;
  }

  const isLimit = remainingTries <= 0;
  container.innerHTML = `
    <div class="tries-badge ${isLimit ? 'tries-badge-limit' : ''}">
      ${isLimit ? '免费次数已用完' : `剩余免费次数: ${remainingTries}`}
    </div>
  `;
}

/**
 * 显示次数上限提示
 */
function showLimitExceeded(container, isGlobal = false) {
  const title = isGlobal ? '今日全站免费名额已满' : '免费测算次数已用完';
  const desc = isGlobal 
    ? '今日测算天机次数过多，全站免费名额已用完。如需继续深度解读，请支持我们的传承工作。' 
    : '每个设备限两次免费测算。您已体验过道家命理推演的玄妙，如需继续深度解读，请支持我们的传承工作。';

  container.innerHTML = `
    <div class="paywall-banner fade-in" style="margin-top:0;">
      <div style="font-size:3rem; margin-bottom:var(--space-md);">☯</div>
      <h3>${title}</h3>
      <p>${desc}</p>
      
      <div class="qr-container">
        <div class="qr-price-badge">¥ 9.9 / 次</div>
        <img src="/assets/wechat_pay_qr.jpg" class="qr-image" alt="微信支付二维码" />
        <div class="qr-tips">
          <strong>付款流程：</strong><br>
          1. 截屏或长按保存二维码<br>
          2. 使用微信「扫一扫」识别支付<br>
          3. 支付成功后点击下方「我已支付」
        </div>
      </div>

      <div style="margin-top:var(--space-xl);">
        <button class="btn-gold" id="limit-pay-btn">
          我已支付 ✦
        </button>
      </div>
      
      <p style="margin-top:var(--space-md); font-size:0.8rem; color:var(--color-ink-muted);">
        * 演示模式：点击按钮即可模拟支付成功
      </p>
    </div>
  `;

  document.getElementById('limit-pay-btn').addEventListener('click', async (e) => {
    const btn = e.target;
    btn.disabled = true;
    btn.textContent = '正在支付...';
    
    try {
      // Notify server about payment
      await fetch('/api/unlock', { method: 'POST' });
      
      isPaid = true;
      remainingTries = 999;
      updateTriesUI();
      
      alert('已成功模拟付费解锁！');
      // Hide results area so user can submit again
      const rs = document.getElementById('results-area');
      rs.style.display = 'none';
      
      // Smooth scroll back to form
      document.getElementById('name-form').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      alert('支付连接失败，请稍后重试');
    } finally {
      btn.disabled = false;
      btn.textContent = '立即解锁 ✦';
    }
  });
}

function initFormHandlers() {
  // Zodiac selection
  const grid = document.getElementById('zodiac-grid');
  grid.addEventListener('click', (e) => {
    const item = e.target.closest('.zodiac-item');
    if (!item) return;

    grid.querySelectorAll('.zodiac-item').forEach(el => el.classList.remove('selected'));
    item.classList.add('selected');
    selectedZodiac = zodiacData[parseInt(item.dataset.index)];
  });

  // Form submission
  const form = document.getElementById('name-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name-input').value.trim();
    if (!name) return;
    if (!selectedZodiac) {
      alert('请选择您的属相');
      return;
    }

    await analyzeName(name, selectedZodiac);
  });
}

async function analyzeName(name, zodiac) {
  const resultsArea = document.getElementById('results-area');
  const submitBtn = document.getElementById('submit-btn');

  // Show loading
  submitBtn.disabled = true;
  submitBtn.textContent = '正在推演命理···';
  resultsArea.style.display = 'block';

  // Deduction steps for the 10-second wait
  const loadingSteps = [
    '正在排布九宫八卦方位...',
    '依据易经推演乾坤之德...',
    '正在分析字形五行生克...',
    '调取连山易、归藏易典籍...',
    '深度解析属相天干地支契合度...',
    '融合星象命理最终定稿...'
  ];

  resultsArea.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner">☯</div>
      <p class="loading-text" id="loading-step-text">
        正在依据星象、易经、九宫八卦推演<span class="loading-dots"></span>
      </p>
    </div>
  `;

  // Start rotating loading text
  let stepIndex = 0;
  const stepInterval = setInterval(() => {
    const textEl = document.getElementById('loading-step-text');
    if (textEl) {
      textEl.innerHTML = `${loadingSteps[stepIndex % loadingSteps.length]}<span class="loading-dots"></span>`;
      stepIndex++;
    }
  }, 1600);

  // Scroll to results
  resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Record start time
  const startTime = Date.now();

  try {
    // API call starts immediately
    const response = await fetch('/api/analyze-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, zodiac: zodiac.name }),
    });

    // Check paywall
    if (response.status === 402) {
       clearInterval(stepInterval);
       const data = await response.json();
       showLimitExceeded(resultsArea, data.globalLimitExceeded);
       return;
    }

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }

    const data = await response.json();

    // Ensure at least 10 seconds (10000ms) have passed
    const elapsedTime = Date.now() - startTime;
    const remainingWait = Math.max(0, 10000 - elapsedTime);
    
    await new Promise(resolve => setTimeout(resolve, remainingWait));
    
    // Stop loading text rotation
    clearInterval(stepInterval);

    if (data.isPaid) isPaid = true;
    if (data.remainingTries !== undefined) {
      remainingTries = data.remainingTries;
      updateTriesUI();
    }

    renderResults(name, zodiac, data);
  } catch (error) {
    clearInterval(stepInterval);
    console.error('Analysis error:', error);
    resultsArea.innerHTML = `
      <div class="loading-container">
        <div style="font-size:3rem; margin-bottom:1rem;">⚠️</div>
        <p class="loading-text">推演过程中出现异常，请稍后再试</p>
        <p style="font-size:0.8rem; color:var(--color-ink-muted); margin-top:1rem;">${error.message}</p>
      </div>
    `;
    alert('推演过程中出现异常，请稍后再试');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '开 始 测 名';
  }
}

function getScoreInfo(score) {
  if (score >= 90) return { label: '大吉', class: 'level-v-good' };
  if (score >= 80) return { label: '吉', class: 'level-good' };
  if (score >= 65) return { label: '凶', class: 'level-bad' };
  return { label: '大凶', class: 'level-v-bad' };
}

function renderResults(name, zodiac, data) {
  const resultsArea = document.getElementById('results-area');
  const analysisItems = data.analysis || [];
  const score = data.score || 75;
  const summary = data.summary || '';
  const suggestions = data.suggestions || [];
  const scoreInfo = getScoreInfo(score);

  // Determine how many items to show for free
  const freeItemCount = 2;

  resultsArea.innerHTML = `
    <!-- Result Header -->
    <div class="result-header fade-in">
      <div class="result-name">${name}</div>
      <div class="result-zodiac">属相：${zodiac.emoji} ${zodiac.name} · 五行：${zodiac.element} · 地支：${zodiac.branch}</div>

      <!-- Score -->
      <div class="score-display">
        <div class="score-circle ${scoreInfo.class}">
          <span class="score-number">${scoreInfo.label}</span>
        </div>
        <div class="score-label">命理评定</div>
      </div>

      ${summary ? `<p style="font-family:var(--font-serif); color:var(--color-ink-light); line-height:2; font-size:0.9rem;">${summary}</p>` : ''}
    </div>

    <hr class="ink-divider" />

    <!-- Analysis Cards -->
    ${analysisItems.map((item, index) => {
      const isLocked = !isPaid && index >= freeItemCount;
      return `
        <div class="analysis-card fade-in fade-in-delay-${Math.min(index + 1, 4)} ${isLocked ? 'content-locked' : ''}">
          <div class="analysis-card-header">
            <div class="analysis-card-icon">${item.icon || '☯'}</div>
            <h3 class="analysis-card-title">${item.title}</h3>
          </div>
          <div class="analysis-card-content">
            ${item.content}
          </div>
          ${isLocked ? `
            <div class="lock-overlay">
              <div class="lock-icon">🔒</div>
              <div class="lock-text">付费后解锁完整分析</div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('')}

    <!-- Paywall Banner -->
    ${!isPaid ? `
      <div class="paywall-banner fade-in">
        <h3>解锁完整命理报告</h3>
        <p>
          包含完整的字形分析、五行详解、八卦方位解读、<br>
          属相相合度分析以及专属改名建议
        </p>
        
        <div class="qr-container">
          <div class="qr-price-badge">¥ 9.9 / 次</div>
          <img src="/assets/wechat_pay_qr.jpg" class="qr-image" alt="微信支付二维码" />
        </div>

        <div>
          <button class="btn-gold" id="pay-btn">
            我已支付 ✦
          </button>
        </div>
        
        <p style="margin-top:var(--space-md); font-size:0.8rem; color:var(--color-ink-muted);">
          * 付款后点击按钮解锁。当前为演示模式，点击即可模拟解锁。
        </p>
      </div>
    ` : ''}

    <!-- Name Suggestions (paid only) -->
    ${isPaid && suggestions.length > 0 ? `
      <div class="name-suggestions">
        <hr class="ink-divider" />
        <div style="text-align:center; margin-bottom:var(--space-xl);">
          <h2>改名建议</h2>
          <p style="font-family:var(--font-serif); color:var(--color-ink-muted); font-size:0.9rem; margin-top:var(--space-sm);">
            以下名字更加适合您的属相与命理
          </p>
        </div>
        ${suggestions.map(s => `
          <div class="suggestion-card fade-in">
            <div class="suggestion-name">${s.name}</div>
            <div class="suggestion-reason">${s.reason}</div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- Suggest names CTA (paid but no suggestions loaded yet) -->
    ${isPaid && suggestions.length === 0 ? `
      <div style="text-align:center; margin-top:var(--space-2xl);">
        <hr class="ink-divider" />
        <h3 style="margin-bottom:var(--space-md);">需要改名建议？</h3>
        <p style="font-family:var(--font-serif); color:var(--color-ink-muted); font-size:0.9rem; margin-bottom:var(--space-lg);">
          根据您的属相与命理，为您推荐更合适的名字
        </p>
        <button class="btn-secondary" id="suggest-btn">
          获取改名建议 →
        </button>
      </div>
    ` : ''}
  `;

  // Bind pay button
  const payBtn = document.getElementById('pay-btn');
  if (payBtn) {
    payBtn.addEventListener('click', async () => {
      // Notify server about payment
      try {
        await fetch('/api/unlock', { method: 'POST' });
        isPaid = true;
        remainingTries = 999;
        updateTriesUI();
        // Reload with suggestions
        fetchSuggestionsAndRerender(name, zodiac, analysisItems, score, summary);
      } catch (err) {
        alert('支付连接失败，请稍后重试');
      }
    });
  }

  // Bind suggest button
  const suggestBtn = document.getElementById('suggest-btn');
  if (suggestBtn) {
    suggestBtn.addEventListener('click', () => {
      fetchSuggestionsAndRerender(name, zodiac, analysisItems, score, summary);
    });
  }
}

async function fetchSuggestionsAndRerender(name, zodiac, analysisItems, score, summary) {
  const resultsArea = document.getElementById('results-area');

  // Show loading briefly
  const suggestBtn = document.getElementById('suggest-btn');
  if (suggestBtn) {
    suggestBtn.disabled = true;
    suggestBtn.textContent = '正在推演···';
  }

  try {
    const response = await fetch('/api/suggest-names', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, zodiac: zodiac.name }),
    });

    if (!response.ok) throw new Error('请求失败');

    const data = await response.json();
    const suggestions = data.suggestions || [];

    renderResults(name, zodiac, {
      analysis: analysisItems,
      score,
      summary,
      suggestions,
    });
  } catch (error) {
    console.error('Suggest error:', error);
    if (suggestBtn) {
      suggestBtn.disabled = false;
      suggestBtn.textContent = '获取改名建议 →';
    }
    alert('获取改名建议失败，请稍后重试');
  }
}
