/**
 * 测名字 — Name Analysis Page
 * Core feature: name analysis with DeepSeek API integration
 */

import { zodiacData } from './zodiac-data.js';

let selectedZodiac = null;
let isPaid = false; // 模拟付费状态

export function renderNameAnalysis(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>道 家 测 名</h1>
      <p class="page-header-desc">融合星象 · 易经 · 连山 · 归藏 · 九宫八卦 · 字形字义</p>
    </div>

    <div class="page-section">
      <!-- Input Form -->
      <form class="analysis-form" id="name-form">
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
  resultsArea.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner">☯</div>
      <p class="loading-text">
        正在依据星象、易经、九宫八卦推演<span class="loading-dots"></span>
      </p>
    </div>
  `;

  // Scroll to results
  resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    const response = await fetch('/api/analyze-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, zodiac: zodiac.name }),
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    renderResults(name, zodiac, data);
  } catch (error) {
    console.error('Analysis error:', error);
    resultsArea.innerHTML = `
      <div class="loading-container">
        <div style="font-size:3rem; margin-bottom:1rem;">⚠️</div>
        <p class="loading-text">推演过程中出现异常，请稍后再试</p>
        <p style="font-size:0.8rem; color:var(--color-ink-muted); margin-top:1rem;">${error.message}</p>
      </div>
    `;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '开 始 测 名';
  }
}

function renderResults(name, zodiac, data) {
  const resultsArea = document.getElementById('results-area');
  const analysisItems = data.analysis || [];
  const score = data.score || 75;
  const summary = data.summary || '';
  const suggestions = data.suggestions || [];

  // Determine how many items to show for free
  const freeItemCount = 2;

  resultsArea.innerHTML = `
    <!-- Result Header -->
    <div class="result-header fade-in">
      <div class="result-name">${name}</div>
      <div class="result-zodiac">属相：${zodiac.emoji} ${zodiac.name} · 五行：${zodiac.element} · 地支：${zodiac.branch}</div>

      <!-- Score -->
      <div class="score-display">
        <div class="score-circle">
          <span class="score-number">${score}</span>
        </div>
        <div class="score-label">综合命理评分</div>
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
        <div class="paywall-price">
          ¥ 39.9 <small>/ 一次</small>
        </div>
        <button class="btn-gold" id="pay-btn">
          立即解锁 ✦
        </button>
        <p style="margin-top:var(--space-md); font-size:0.8rem; color:var(--color-ink-muted);">
          * 当前为演示模式，点击即可模拟付费解锁
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
    payBtn.addEventListener('click', () => {
      isPaid = true;
      // Reload with suggestions
      fetchSuggestionsAndRerender(name, zodiac, analysisItems, score, summary);
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
