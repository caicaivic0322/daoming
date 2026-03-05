import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

import { mockResponses } from './mock-responses.js';

config(); // Load .env

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

// --- Persistent Storage ---
const DB_FILE = join(__dirname, 'db.json');
let dbData = { 
  requestCounts: {}, 
  paidIPs: [],
  dailyGlobalCount: 0,
  lastResetDate: new Date().toISOString().split('T')[0]
};

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      // Ensure defaults
      dbData.requestCounts = dbData.requestCounts || {};
      dbData.paidIPs = dbData.paidIPs || [];
      dbData.dailyGlobalCount = dbData.dailyGlobalCount || 0;
      dbData.lastResetDate = dbData.lastResetDate || getTodayKey();

      // Reset global count if date changed
      if (dbData.lastResetDate !== getTodayKey()) {
        dbData.dailyGlobalCount = 0;
        dbData.lastResetDate = getTodayKey();
        saveDB();
      }
    }
  } catch (e) {
    console.error('Failed to load DB:', e);
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2));
  } catch (e) {
    console.error('Failed to save DB:', e);
  }
}

// Initial load
loadDB();

const FREE_LIMIT = 2;
const GLOBAL_DAILY_LIMIT = 20;

app.set('trust proxy', true); // Trust the first proxy (e.g., Render, Nginx)
app.use(cors());
app.use(express.json());

// Helper to get client IP
function getClientIp(req) {
  return req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
}

// Serve static files from Vite build output (production)
app.use(express.static(join(__dirname, '..', 'dist')));


/**
 * POST /api/analyze-name
 * Analyze a name based on Chinese metaphysics
 */
app.post('/api/analyze-name', async (req, res) => {
  try {
    const { name, zodiac } = req.body;
    const ip = getClientIp(req);

    // Refresh DB check for date reset
    if (dbData.lastResetDate !== getTodayKey()) {
      dbData.dailyGlobalCount = 0;
      dbData.lastResetDate = getTodayKey();
      saveDB();
    }

    // Check request limit
    const isIPPaid = dbData.paidIPs.includes(ip);
    const count = dbData.requestCounts[ip] || 0;
    
    // 1. Check IP limit first (only for non-paid)
    if (!isIPPaid && count >= FREE_LIMIT) {
      return res.status(402).json({ 
        error: '免费测名次数已达上限', 
        limitExceeded: true,
        remainingTries: 0
      });
    }

    // 2. Check Global Daily limit (only for non-paid)
    if (!isIPPaid && dbData.dailyGlobalCount >= GLOBAL_DAILY_LIMIT) {
      return res.status(402).json({
        error: '今日全站免费名额已用完',
        globalLimitExceeded: true,
        remainingTries: 0
      });
    }

    if (!name || !zodiac) {
      return res.status(400).json({ error: '请提供姓名 and 属相' });
    }

    // --- Switch to Mock Responses Branding (API Paused) ---
    console.log(`Using Simulated Response for IP: ${ip}, Name: ${name}`);
    
    // Increment counts
    if (!isIPPaid) {
      dbData.requestCounts[ip] = count + 1;
      dbData.dailyGlobalCount += 1;
      saveDB();
    }

    // Pick a random mock response
    const randomIndex = Math.floor(Math.random() * mockResponses.length);
    const baseResult = JSON.parse(JSON.stringify(mockResponses[randomIndex]));
    
    // Personalize the response
    const result = {
      ...baseResult,
      summary: `「道名推演」：${name} 先生/女士，${baseResult.summary}`,
      remainingTries: isIPPaid ? 999 : Math.max(0, FREE_LIMIT - (count + 1)),
      isPaid: isIPPaid
    };

    // Ensure zodiac personalization in specific items
    result.analysis = result.analysis.map(item => {
      if (item.title === '属相相合') {
        return {
          ...item,
          content: `针对属相「${zodiac}」：${item.content}`
        };
      }
      return item;
    });

    return res.json(result);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * POST /api/suggest-names
 * Suggest better names based on zodiac
 */
app.post('/api/suggest-names', async (req, res) => {
  try {
    const { name, zodiac } = req.body;

    if (!zodiac) {
      return res.status(400).json({ error: '请提供属相信息' });
    }

    // Provide mock suggestions
    const suggestions = [
      { name: `${name.charAt(0)}子墨`, reason: "字意深远，金水相生。" },
      { name: `${name.charAt(0)}若虚`, reason: "大智若愚，道法自然。" },
      { name: `${name.charAt(0)}承德`, reason: "厚德载物，基业常青。" }
    ];

    res.json({ suggestions });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * GET /api/check-limit
 * Check remaining free tries for the current IP
 */
app.get('/api/check-limit', (req, res) => {
  const ip = getClientIp(req);
  const isIPPaid = dbData.paidIPs.includes(ip);
  const count = dbData.requestCounts[ip] || 0;
  
  // Refresh global check
  if (dbData.lastResetDate !== getTodayKey()) {
    dbData.dailyGlobalCount = 0;
    dbData.lastResetDate = getTodayKey();
    saveDB();
  }

  res.json({
    limit: FREE_LIMIT,
    count: count,
    remainingTries: isIPPaid ? 999 : Math.max(0, FREE_LIMIT - count),
    isPaid: isIPPaid,
    globalRemaining: Math.max(0, GLOBAL_DAILY_LIMIT - dbData.dailyGlobalCount)
  });
});

/**
 * POST /api/unlock
 * Unlock the limit for the current IP (Simulated Payment)
 */
app.post('/api/unlock', (req, res) => {
  const ip = getClientIp(req);
  if (!dbData.paidIPs.includes(ip)) {
    dbData.paidIPs.push(ip);
    saveDB();
  }
  res.json({ success: true, message: '已成功解锁该 IP 的永久访问权限' });
});

// SPA catch-all: serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🏛️ 道名后端服务已启动: http://localhost:${PORT}`);
});
