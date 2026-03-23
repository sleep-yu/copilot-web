# copilot-web 新人学习手册

> 从零开始搭建 AI 聊天界面 ✨

## 目录
- [项目介绍](#项目介绍)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [代码详解](#代码详解)
- [后端对接](#后端对接)
- [常见问题](#常见问题)

---

## 项目介绍

### 什么是 copilot-web？

copilot-web 是为 **copilot-mini** 后端开发的纯前端聊天界面，让用户可以通过网页与 AI 进行对话。

### 技术栈

| 技术 | 说明 | 官网 |
|------|------|------|
| React | UI 框架 | https://react.dev |
| TypeScript | 类型安全 | https://www.typescriptlang.org |
| Vite | 构建工具 | https://vitejs.dev |

### 项目特点

- ✨ ChatGPT 风格 UI
- 📱 响应式设计，支持手机和电脑
- 🔌 HTTP POST 对接后端
- 📖 详细的新人学习手册

---

## 快速开始

### 前置要求

在开始之前，你需要安装：

1. **Node.js** (18 或更高版本)
   - 检查版本: `node -v`
   - 官网: https://nodejs.org

2. **Git** (可选，用于版本管理)
   - 官网: https://git-scm.com

### 安装步骤

#### 第一步：克隆项目

打开终端，执行以下命令：

```bash
# 进入项目目录
cd ~/myownProject

# 克隆仓库
git clone https://github.com/sleep-yu/copilot-web.git

# 进入项目目录
cd copilot-web
```

#### 第二步：安装依赖

```bash
npm install
```

> 这会根据 package.json 安装所有需要的包

#### 第三步：启动开发服务器

```bash
npm run dev
```

#### 第四步：打开浏览器访问

浏览器打开 http://localhost:5173

---

## 项目结构

```
copilot-web/
├── src/
│   ├── App.tsx          # 主要的 React 组件（聊天界面逻辑）
│   ├── App.css          # 样式文件（ChatGPT 风格）
│   ├── main.tsx         # 入口文件
│   └── index.css        # 全局样式
├── public/              # 静态资源
├── index.html           # HTML 入口
├── package.json         # 项目配置
├── vite.config.ts       # Vite 配置
└── tsconfig.json        # TypeScript 配置
```

---

## 代码详解

### 1. App.tsx 核心代码

```tsx
import { useState, useRef, useEffect } from 'react'
import './App.css'

// 定义消息类型
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

// 后端 API 地址
const API_URL = 'http://localhost:62345/copilot/hook'

function App() {
  // 状态管理
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 每次消息更新时滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 发送消息到后端
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // 调用后端 API
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: 'web-client-' + Date.now(),
          data: {
            fromUser: 'user_001',
            type: 'text',
            content: userMessage.content
          }
        })
      })

      const result = await response.json()
      console.log('后端返回:', result)

      // ... 处理返回结果
      
    } catch (error) {
      console.error('请求失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chat-container">
      {/* 消息列表 */}
      <div className="messages-area">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-body">
              <div className="message-content">
                {msg.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 输入框 */}
      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="发送消息..."
        />
        <button onClick={sendMessage}>发送</button>
      </div>
    </div>
  )
}

export default App
```

### 2. 样式文件 App.css

样式采用类似 ChatGPT 的深色主题：

```css
:root {
  --bg-primary: #343541;    /* 主背景 */
  --bg-secondary: #434654;  /* 次要背景 */
  --text-primary: #ececf1;  /* 主文字 */
  --accent-color: #10a37f;  /* 主题色 */
}
```

---

## 后端对接

### 后端信息

| 项目 | 值 |
|------|-----|
| 后端地址 | http://localhost:62345 |
| API 路径 | /copilot/hook |
| 协议 | HTTP POST |

### 请求格式

```json
{
  "sessionId": "web-client-123456789",
  "data": {
    "fromUser": "user_001",
    "type": "text",
    "content": "你好，请介绍一下自己"
  }
}
```

### 响应格式

后端会返回消息列表，具体格式取决于后端实现。

---

## 常见问题

### Q: 后端没有响应怎么办？

1. 检查后端是否启动：`lsof -i :62345`
2. 检查网络请求是否正确
3. 查看浏览器控制台的错误信息

### Q: 如何修改后端地址？

修改 `App.tsx` 中的 `API_URL` 常量：

```tsx
const API_URL = 'http://你的后端地址:端口/copilot/hook'
```

### Q: 如何添加新功能？

1. 修改 `App.tsx` 添加组件逻辑
2. 修改 `App.css` 添加样式
3. 提交更改：`git add . && git commit -m "feat: 新功能描述"`

---

## 更新日志

### 2026-03-23 - UI 深度美化

- **feat**: 完成 ChatGPT 风格 UI 重构
  - 完整色彩系统 (深色/浅色主题)
  - 更精致的侧边栏设计 (历史记录、用户信息)
  - 消息组件优化 (头像、悬停操作、复制功能)
  - 打字机效果动画
  - 移动端响应式适配 + 侧边栏抽屉式菜单
  - Toast 提示组件
  - 空状态引导界面 + 快捷建议按钮
  - 自定义滚动条样式
  - 平滑过渡动画
- **docs**: 新增 SPEC.md 产品规格文档
- **style**: 全局样式重构，更干净的 CSS 架构

### 2026-03-21

- **feat**: 实现基础聊天界面，对接 HTTP POST 接口
- **feat**: 美化 UI 为 ChatGPT 风格
- **feat**: 添加响应式布局，适配手机和电脑
- **docs**: 添加详细的新人学习手册

### 初始化

- **feat**: 初始化 Vite + React + TypeScript 项目

---

## 下一步

想继续完善？可以尝试：

1. 添加消息撤回功能
2. 添加会话历史保存
3. 添加打字机效果
4. 部署到生产环境

---

> 祝你开发愉快！🚀