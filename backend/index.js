// 引入依赖
require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');
const cors = require('cors');

// 初始化
const app = express();
const port = 3000; // 后端服务器运行的端口

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 中间件配置
app.use(cors()); // 允许所有来源的跨域请求，用于开发
app.use(express.json()); // 解析JSON格式的请求体

// API路由
app.post('/api/analyze', async (req, res) => {
  try {
    // 从前端请求中获取系统指令(prompt)和用户输入(text)
    const { systemPrompt, userText } = req.body;

    if (!systemPrompt || !userText) {
      return res.status(400).json({ error: '缺少 systemPrompt 或 userText' });
    }

    console.log('正在调用OpenAI API...');

    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText },
      ],
      model: 'gpt-4o', // 你可以使用 gpt-4, gpt-4o, 或 gpt-3.5-turbo 等模型
    });

    console.log('API调用成功！');
    // 将AI返回的结果发送给前端
    res.json({ result: completion.choices[0].message.content });

  } catch (error) {
    console.error('调用OpenAI API时出错:', error);
    res.status(500).json({ error: '调用AI服务失败' });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`后端服务器已启动，正在监听 http://localhost:${port}`);
});
