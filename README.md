### **项目概述与架构**

这个工具的运行逻辑很简单：

1.  **前端 (你的浏览器):** 提供一个用户界面，包含一个文本输入框（用于粘贴小说原文）、一个下拉菜单（选择要使用的工具，如“章纲拆解器”）、一个“开始分析”按钮和一个结果显示区域。
2.  **后端 (你的服务器):** 作为一个中间人。它接收前端发来的请求（包含小说原文和选择的工具），然后将这些信息安全地与你的AI API密钥组合，发送给AI服务。
3.  **AI服务 (OpenAI):** 接收后端发来的指令和文本，进行分析，然后返回结果。
4.  **返回流程:** AI结果返回给后端 -> 后端再返回给前端 -> 前端将结果显示在页面上。

**为什么需要后端？**
**绝对不能将AI API密钥直接放在前端代码里！** 这样做会被别有用心的人在你的浏览器里看到，盗用你的密钥，造成你的资金损失。后端可以完美地保护你的密钥。

---

### **第一步：环境准备 (Environment Setup)**

在开始之前，请确保你的电脑上安装了以下软件：

1.  **Node.js:** 这是我们运行前后端的基础。访问 [Node.js官网](https://nodejs.org/) 下载并安装LTS（长期支持）版本。安装后，打开你的终端（Windows上是CMD或PowerShell，Mac上是Terminal），输入 `node -v` 和 `npm -v`，如果能看到版本号，说明安装成功。
2.  **代码编辑器:** 推荐使用 [VS Code](https://code.visualstudio.com/)，免费且功能强大。
3.  **AI API Key:**
    *   前往 [OpenAI Platform](https://platform.openai.com/api-keys) 注册并登录。
    *   进入 API Keys 页面，点击 “Create new secret key” 创建一个你的专属密钥。**这个密钥非常重要，请立即复制并保存在一个安全的地方，它只会出现一次。**

---

### **第二步：后端搭建 (Node.js + Express)**

我们的后端服务器负责两件事：接收前端请求和调用AI。

1.  **创建项目文件夹:**
    在你的电脑上创建一个新文件夹，比如 `novelist-workbench`。在其中再创建两个文件夹：`backend` 和 `frontend`。

2.  **初始化后端项目:**
    *   打开终端，进入 `backend` 文件夹: `cd path/to/novelist-workbench/backend`
    *   初始化一个新的Node.js项目: `npm init -y`
    *   这会创建一个 `package.json` 文件。

3.  **安装依赖包:**
    我们需要三个核心包：
    *   `express`: 我们的Web服务器框架。
    *   `openai`: OpenAI官方提供的库，方便调用API。
    *   `cors`: 解决前端和后端跨域请求的问题。
    *   `dotenv`: 用于管理环境变量，安全地存放我们的API密钥。

    在终端中运行以下命令来安装它们：
    ```bash
    npm install express openai cors dotenv
    ```

4.  **编写后端代码:**
    *   在 `backend` 文件夹中，创建一个名为 `index.js` 的文件。
    *   再创建一个名为 `.env` 的文件。**注意，文件名就是一个点加env**。

    **编辑 `.env` 文件:**
    将你的OpenAI API密钥粘贴进去，格式如下：
    ```
    OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    ```
    (将 `sk-xxx...` 替换成你自己的密钥)

    **编辑 `index.js` 文件:**
    将以下代码完整地复制粘贴到 `index.js` 文件中。

    ```javascript
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
    ```

5.  **启动后端服务器:**
    在 `backend` 文件夹的终端中，运行：
    ```bash
    node index.js
    ```
    如果你看到 “后端服务器已启动...” 的消息，说明你的后端已经成功运行在 `http://localhost:3000` 上了！先让这个终端窗口开着。

---

### **第三步：前端搭建 (Vue.js + Element Plus)**

现在我们来创建用户能看到和操作的界面。

1.  **安装 Vue CLI:**
    Vue CLI 是一个快速搭建Vue项目的工具。如果没装过，先在终端里全局安装：
    ```bash
    npm install -g @vue/cli
    ```

2.  **创建前端项目:**
    *   打开一个新的终端窗口。
    *   进入 `novelist-workbench` 文件夹: `cd path/to/novelist-workbench`
    *   使用Vue CLI创建 `frontend` 项目:
        ```bash
        vue create frontend
        ```
    *   在弹出的选项中，选择 **"Manually select features" (手动选择功能)**。
    *   按空格键勾选 **"Babel"** 和 **"Router"** (虽然本次教程简单用不上Router，但这是个好习惯)。
    *   选择 **Vue 3**。
    *   后续选项一路按回车选择默认即可。等待项目创建完成。

3.  **安装前端依赖:**
    *   进入 `frontend` 文件夹: `cd frontend`
    *   我们需要两个包：
        *   `axios`: 用于从前端向后端发送HTTP请求。
        *   `element-plus`: UI组件库。

    运行以下命令：
    ```bash
    npm install axios element-plus
    ```

4.  **配置和编写前端代码:**
    *   **引入Element Plus:**
        打开 `frontend/src/main.js` 文件，用以下代码替换其全部内容：
        ```javascript
        import { createApp } from 'vue'
        import App from './App.vue'
        import ElementPlus from 'element-plus'
        import 'element-plus/dist/index.css'

        const app = createApp(App)

        app.use(ElementPlus)
        app.mount('#app')
        ```

    *   **编写核心界面:**
        打开 `frontend/src/App.vue` 文件，用以下代码替换其全部内容。这是我们应用的唯一也是核心的组件。

        ```vue
        <template>
          <el-container class="main-container">
            <el-header class="header">
              <h1>小说家AI工作台</h1>
            </el-header>
            <el-main>
              <el-row :gutter="20">
                <!-- 左侧：输入与控制 -->
                <el-col :span="10">
                  <el-card>
                    <template #header>
                      <div class="card-header">
                        <span>操作区</span>
                      </div>
                    </template>
                    
                    <el-form label-position="top">
                      <el-form-item label="选择分析工具">
                        <el-select v-model="selectedTool" placeholder="请选择一个工具" style="width: 100%;">
                          <el-option
                            v-for="item in tools"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value"
                          />
                        </el-select>
                      </el-form-item>
                      
                      <el-form-item label="粘贴小说原文或输入你的想法">
                        <el-input
                          v-model="inputText"
                          :rows="15"
                          type="textarea"
                          placeholder="在这里粘贴内容..."
                        />
                      </el-form-item>
                      
                      <el-form-item>
                        <el-button type="primary" @click="handleAnalysis" :loading="isLoading" style="width: 100%;">
                          {{ isLoading ? '分析中...' : '开始分析' }}
                        </el-button>
                      </el-form-item>
                    </el-form>
                  </el-card>
                </el-col>
                
                <!-- 右侧：结果显示 -->
                <el-col :span="14">
                  <el-card class="result-card" v-loading="isLoading">
                    <template #header>
                      <div class="card-header">
                        <span>分析结果</span>
                      </div>
                    </template>
                    <div class="result-content" v-html="formattedResult"></div>
                  </el-card>
                </el-col>
              </el-row>
            </el-main>
          </el-container>
        </template>

        <script setup>
        import { ref, computed } from 'vue';
        import axios from 'axios';
        import { ElMessage } from 'element-plus';
        import { marked } from 'marked'; // 用于将Markdown转为HTML

        const selectedTool = ref('');
        const inputText = ref('');
        const analysisResult = ref('');
        const isLoading = ref(false);

        // --- 这是我们的核心指令库 ---
        const prompts = {
          plotDeconstruction: `...`, // 内容太长，下面单独提供
          chapterOutlineDeconstruction: `...`,
          chapterOutlineImitation: `...`,
          novelOutlineGenerator: `...`,
          // ... 更多工具
        };
        // 在这里填入上一回答中提供的详细Prompt模板
        prompts.plotDeconstruction = `# 角色：小说结构分析师 ... (此处省略，请从上一回答复制)`;
        prompts.chapterOutlineDeconstruction = `# 角色：网文章节节奏分析师\n\n# 任务：\n请将以下小说章节拆解成一份结构化的“章纲”。这份章纲需要体现出网文写作的节奏感和钩子，请包含以下要素：\n\n1.  **章节标题/核心事件：** 用一句话概括本章发生了什么。\n2.  **开端（黄金三句）：** 描述本章的开场场景，以及如何快速吸引读者注意力。\n3.  **情节发展：** 按顺序梳理本章发生的核心事件，每一步如何推进剧情。\n4.  **矛盾冲突/高潮：** 明确指出本章的核心冲突点是什么？是打斗、是争辩、还是内心挣扎？高潮部分在哪里？\n5.  **信息增量：** 本章揭露了哪些新信息、新人物、新设定，或者挖了什么新坑？\n6.  **人物表现：** 主角在本章展现了什么性格或能力？配角起到了什么作用？\n7.  **结尾悬念（钩子）：** 本章的结尾是如何留下悬念，吸引读者点击下一章的？\n\n# 章节原文：`;
        prompts.chapterOutlineImitation = `# 角色：网文写作模仿大师\n\n# 任务：\n我将提供一个“范本章纲”和一个“新情节核心”。请你严格模仿“范本章纲”的结构、节奏和叙事模式，为我的“新情节核心”创作一份全新的章纲。\n\n# 要求：\n1.  严格遵循范本的“开端-发展-冲突-高潮-结尾钩子”的节奏。\n2.  如果范本中有“信息增量”或“人物表现”的环节，请在新章纲中也设计相应的内容。\n3.  保持紧张感和悬念感。\n\n# 范本章纲与新情节核心：`;
        prompts.novelOutlineGenerator = `# 角色：金牌网文编剧\n\n# 任务：\n请根据我提供的核心创意元素，为我生成一部全新的小说大纲。大纲需要有创意、逻辑自洽且情节吸引人。\n\n# 生成要求：\n请输出一份包含“核心故事线”、“主要人物设定（主角/反派）”、“世界观及力量体系简介”和“故事分卷（至少三卷）梗概”的完整大纲。\n\n# 核心创意元素：`;


        const tools = ref([
          { label: '拆解小说大纲', value: 'plotDeconstruction' },
          { label: '拆解单章章纲', value: 'chapterOutlineDeconstruction' },
          { label: '仿写章纲', value: 'chapterOutlineImitation' },
          { label: '生成新小说大纲', value: 'novelOutlineGenerator' },
        ]);

        const formattedResult = computed(() => {
          if (!analysisResult.value) {
            return '<p style="color: #999;">等待分析结果...</p>';
          }
          // 使用marked库将返回的Markdown格式文本转换为HTML
          return marked(analysisResult.value);
        });

        const handleAnalysis = async () => {
          if (!selectedTool.value || !inputText.value) {
            ElMessage.error('请选择一个工具并输入内容！');
            return;
          }

          isLoading.value = true;
          analysisResult.value = '';
          
          const systemPrompt = prompts[selectedTool.value];
          const userText = inputText.value;

          try {
            // 注意：这里的URL必须是你后端服务器的地址
            const response = await axios.post('http://localhost:3000/api/analyze', {
              systemPrompt,
              userText,
            });
            analysisResult.value = response.data.result;
          } catch (error) {
            console.error('请求失败:', error);
            ElMessage.error('分析失败，请检查后端服务或API Key。');
            analysisResult.value = '分析时发生错误，请查看控制台信息。';
          } finally {
            isLoading.value = false;
          }
        };
        </script>

        <style>
        body {
          background-color: #f4f4f5;
        }
        .main-container {
          max-width: 1400px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          padding: 20px 0;
          color: #303133;
        }
        .result-card {
          height: 100%;
        }
        .result-content {
          height: 500px;
          overflow-y: auto;
          white-space: pre-wrap; /* 保持换行 */
          word-wrap: break-word;
          line-height: 1.8;
        }
        /* 美化Markdown输出的样式 */
        .result-content h1, .result-content h2, .result-content h3 {
          margin-top: 20px;
          margin-bottom: 10px;
          color: #303133;
        }
        .result-content strong {
          color: #409EFF;
        }
        .result-content ul, .result-content ol {
          padding-left: 20px;
        }
        </style>
        ```
    *   **安装`marked`库**：我们在代码中用到了`marked`来美化输出，需要安装它：
        ```bash
        npm install marked
        ```

5.  **启动前端开发服务器:**
    在 `frontend` 文件夹的终端中，运行：
    ```bash
    npm run serve
    ```
    等待编译完成后，你会看到一个本地地址，通常是 `http://localhost:8080`。

---

### **第四步：整合与运行**

现在，你的两个服务都已经准备好了：
*   **后端** 运行在 `http://localhost:3000`
*   **前端** 运行在 `http://localhost:8080`

打开你的浏览器，访问 `http://localhost:8080`。你应该就能看到“小说家AI工作台”的界面了！

**使用方法：**
1.  从下拉菜单中选择一个工具，比如“拆解单章章纲”。
2.  在文本框中，粘贴你想要分析的小说章节。
3.  点击“开始分析”按钮。
4.  等待几秒钟，右侧的结果区域就会显示出AI为你精心拆解的章纲！

---

### **进阶功能与后续展望**

这个基础版本已经非常强大了。如果你想继续深入，可以考虑以下功能：

1.  **添加更多工具:** 在 `App.vue` 的 `prompts` 对象和 `tools` 数组中，加入我们之前设计的所有工具（如人物拆解、功法拆解等）。
2.  **保存和加载项目:** 引入数据库（如MongoDB或Firebase），让用户可以保存他们的分析结果和创作的大纲。
3.  **流式输出:** 让AI的结果一个字一个字地显示出来，就像ChatGPT那样，体验更好。这需要修改后端和前端的通信方式（使用Server-Sent Events）。
4.  **用户系统:** 添加登录注册功能，让每个用户拥有自己的工作空间。
5.  **部署上线:** 将你的前后端项目部署到云服务器上（如Vercel, Netlify, AWS, 阿里云等），这样你就可以在任何地方访问你的工具了。

恭喜你！你已经成功地将一个创意变成了一个实际可用的强大工具。现在，开始你的创作之旅吧！
