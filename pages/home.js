/**
 * Homepage — 首页
 */

export function renderHomePage(container) {
  container.innerHTML = `
    <!-- Hero Section -->
    <section class="hero">
      <p class="hero-subtitle">传承中华文化 · 探究姓名玄机</p>
      <h1 class="hero-title">道　名</h1>
      <div class="hero-divider"></div>
      <p class="hero-desc">
        融合易经、连山、归藏、九宫八卦之智慧<br>
        以星象命理、字形字义之学<br>
        为您揭示姓名中蕴藏的天地之道
      </p>
    </section>

    <hr class="ink-divider" />

    <!-- Sections Area -->
    <section class="sections-area">
      <div class="sections-heading">
        <h2>三 · 大 · 板 · 块</h2>
      </div>

      <div class="sections-grid">
        <a href="#/name-analysis" class="section-card fade-in fade-in-delay-1">
          <span class="section-card-icon">☯</span>
          <h3 class="section-card-title">道家测名</h3>
          <p class="section-card-desc">
            依据星象、易经、连山、归藏、九宫八卦<br>
            结合字形字义，为您解析姓名吉凶
          </p>
          <span class="section-card-arrow">探究 →</span>
        </a>

        <a href="#/filial-piety" class="section-card fade-in fade-in-delay-2">
          <span class="section-card-icon">🏛️</span>
          <h3 class="section-card-title">宗亲孝道</h3>
          <p class="section-card-desc">
            弘扬中华孝道文化<br>
            传承宗族祭祀礼仪
          </p>
          <span class="section-card-arrow">了解 →</span>
        </a>

        <a href="#/health-life" class="section-card fade-in fade-in-delay-3">
          <span class="section-card-icon">🌿</span>
          <h3 class="section-card-title">健康与生命</h3>
          <p class="section-card-desc">
            养生之道，天人合一<br>
            探索生命的自然法则
          </p>
          <span class="section-card-arrow">探索 →</span>
        </a>
      </div>
    </section>
  `;
}
