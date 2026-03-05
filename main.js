/**
 * 道名 — Main Application Entry
 * SPA Router + Page Rendering
 */

import { renderHomePage } from './pages/home.js';
import { renderNameAnalysis } from './pages/name-analysis.js';
import { renderFilialPiety } from './pages/filial-piety.js';
import { renderHealthLife } from './pages/health-life.js';

// === Router ===
const routes = {
  '/': renderHomePage,
  '/name-analysis': renderNameAnalysis,
  '/filial-piety': renderFilialPiety,
  '/health-life': renderHealthLife,
};

function getPath() {
  const hash = window.location.hash.slice(1) || '/';
  return hash;
}

function router() {
  const path = getPath();
  const main = document.getElementById('main-content');
  const render = routes[path] || routes['/'];

  // Fade out
  main.style.opacity = '0';
  main.style.transform = 'translateY(10px)';

  setTimeout(() => {
    render(main);
    // Update active nav
    document.querySelectorAll('.nav-link').forEach(link => {
      const page = link.getAttribute('data-page');
      const isActive = path === `/${page}`;
      link.classList.toggle('active', isActive);
    });

    // Fade in
    requestAnimationFrame(() => {
      main.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      main.style.opacity = '1';
      main.style.transform = 'translateY(0)';
    });
  }, 200);
}

// === Header Scroll Effect ===
function initHeaderScroll() {
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  });
}

// === Mobile Menu ===
function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const nav = document.getElementById('main-nav');

  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    nav.classList.toggle('open');
  });

  // Close menu on nav link click
  nav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      btn.classList.remove('open');
      nav.classList.remove('open');
    });
  });
}

// === Theme System (Day/Night Auto-Switch) ===
let userOverride = false; // Track if user manually toggled

function getAutoTheme() {
  const hour = new Date().getHours();
  // Day: 6:00 - 17:59, Night: 18:00 - 5:59
  return hour >= 6 && hour < 18 ? 'day' : 'night';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.textContent = theme === 'night' ? '🌙' : '☀️';
    btn.title = theme === 'night' ? '当前：夜间模式（点击切换）' : '当前：日间模式（点击切换）';
  }
}

function initTheme() {
  // Apply auto theme on load
  const theme = getAutoTheme();
  applyTheme(theme);

  // Toggle button
  const btn = document.getElementById('theme-toggle');
  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'day';
    const next = current === 'night' ? 'day' : 'night';
    applyTheme(next);
    userOverride = true;

    // Reset override after 30 minutes so auto-switch can resume
    setTimeout(() => { userOverride = false; }, 30 * 60 * 1000);
  });

  // Auto-check every 10 minutes
  setInterval(() => {
    if (!userOverride) {
      applyTheme(getAutoTheme());
    }
  }, 10 * 60 * 1000);
}

// === Init ===
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initMobileMenu();
  initTheme();
  router();
});
