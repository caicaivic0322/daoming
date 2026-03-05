/**
 * 道名 — Express Backend Server
 * Proxies DeepSeek API calls to protect API key
 */

import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

config(); // Load .env

const app = express();
const PORT = 3001;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

app.use(cors());
app.use(express.json());

/**
 * POST /api/analyze-name
 * Analyze a name based on Chinese metaphysics
 */
app.post('/api/analyze-name', async (req, res) => {
  try {
    const { name, zodiac } = req.body;

    if (!name || !zodiac) {
      return res.status(400).json({ error: '请提供姓名和属相' });
    }

    const prompt = buildAnalysisPrompt(name, zodiac);

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一位精通中国传统命理学的大师，学贯易经、连山、归藏三易，深谙九宫八卦、五行生克、星象命理之道。你擅长从字形、字义、字音、五行属性等多个维度分析姓名，并结合十二生肖属相进行综合评判。

请严格按照 JSON 格式返回分析结果，不要返回任何其他内容。JSON 格式如下：
{
  "score": 85,
  "summary": "综合概述（一句话）",
  "analysis": [
    {
      "icon": "☯",
      "title": "分析维度名称",
      "content": "具体分析内容"
    }
  ]
}

分析维度必须包含以下6项（顺序固定）：
1. 字形分析（icon: 📝）— 从汉字结构、笔画、偏旁部首分析
2. 字义解读（icon: 📖）— 从字的含义、典故、寓意分析
3. 五行属性（icon: 🔥）— 分析姓名各字的五行属性及生克关系
4. 属相相合（icon: 🐲）— 分析姓名与所属生肖的相合度
5. 八卦方位（icon: ☯）— 从九宫八卦角度分析姓名的方位吉凶
6. 星象命理（icon: ⭐）— 从易经、连山、归藏的角度综合论述

score 为 0-100 的整数，表示姓名与属相的综合契合度。
每项分析的 content 需要详细充实，至少3-4句话。`
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.75,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      return res.status(502).json({ error: 'AI 服务暂时不可用，请稍后再试' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(502).json({ error: 'AI 返回内容为空' });
    }

    // Parse JSON from response
    const result = parseJsonResponse(content);
    res.json(result);
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

    const prompt = buildSuggestionPrompt(name, zodiac);

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一位精通中国传统命理学的起名大师。请根据用户的属相和当前姓名，推荐更合适的名字。

请严格按照 JSON 格式返回，不要返回任何其他内容：
{
  "suggestions": [
    {
      "name": "推荐的名字",
      "reason": "推荐理由（包含五行、字义、属相相合度等分析）"
    }
  ]
}

请推荐 3-5 个名字，每个名字的理由需要包含：
- 字义寓意
- 五行属性与属相的相合度
- 八卦方位的吉祥程度
理由至少 2-3 句话，详细而有说服力。`
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      return res.status(502).json({ error: 'AI 服务暂时不可用' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(502).json({ error: 'AI 返回内容为空' });
    }

    const result = parseJsonResponse(content);
    res.json(result);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * Build the analysis prompt
 */
function buildAnalysisPrompt(name, zodiac) {
  return `请详细分析以下姓名与属相的命理契合度：

姓名：${name}
属相：${zodiac}

请从以下维度进行深入分析：
1. 字形分析：分析「${name}」每个字的结构、笔画特征、偏旁部首的五行属性
2. 字义解读：分析每个字的含义、文化典故、历史渊源
3. 五行属性：分析姓名各字的五行（金木水火土）属性，以及与属相「${zodiac}」五行的生克关系
4. 属相相合：分析「${name}」与生肖「${zodiac}」的命理相合度，是否存在冲克
5. 八卦方位：从九宫八卦的角度，分析此姓名所处的卦位及吉凶
6. 星象命理：综合易经、连山、归藏三易之理，论述此姓名的整体命理走势

请给出 0-100 的综合评分，并提供一句话的总结概述。`;
}

/**
 * Build the name suggestion prompt
 */
function buildSuggestionPrompt(name, zodiac) {
  return `当前姓名为「${name}」，属相为「${zodiac}」。

经分析，当前姓名可能存在与属相不够契合的情况。请根据以下原则推荐 3-5 个更合适的名字：

1. 与属相「${zodiac}」的五行相合
2. 字形优美，笔画调和
3. 字义吉祥，寓意深远
4. 符合九宫八卦的吉位
5. 兼顾易经、连山、归藏之理

请注意：
- 保持姓氏「${name.charAt(0)}」不变
- 推荐的名字应当典雅大方，具有中国传统文化底蕴
- 每个名字都要详细说明推荐理由`;
}

/**
 * Parse JSON from LLM response (handles markdown code blocks)
 */
function parseJsonResponse(content) {
  try {
    // Try direct parse
    return JSON.parse(content);
  } catch (e) {
    // Try extracting from markdown code block
    const match = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e2) {
        console.error('Failed to parse extracted JSON:', e2);
      }
    }

    // Fallback: try to find JSON object
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e3) {
        console.error('Failed to parse found JSON:', e3);
      }
    }

    // Return a fallback response
    return {
      score: 70,
      summary: '分析完成',
      analysis: [
        {
          icon: '📝',
          title: '综合分析',
          content: content,
        },
      ],
    };
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`🏛️ 道名后端服务已启动: http://localhost:${PORT}`);
  if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'your_key_here') {
    console.warn('⚠️  请在 .env 文件中设置 DEEPSEEK_API_KEY');
  }
});
