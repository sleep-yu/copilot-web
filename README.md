# Copilot Web

> AI 聊天助手 - 简约现代风格 ✨

## 项目介绍

copilot-web 是为 **copilot-mini** 后端开发的纯前端聊天界面，采用简约现代设计风格。

### 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| React | ^19.2 | UI 框架 |
| TypeScript | ~5.9 | 类型安全 |
| Vite | ^8.0 | 构建工具 |
| react-markdown | ^9.0 | Markdown 渲染 |
| react-syntax-highlighter | ^11.0 | 代码高亮 |

### 项目特点

- 🎨 简约现代 UI - 大量留白，轻盈设计
- 🌓 深色/浅色主题 - 自动记忆用户偏好
- 📱 响应式设计 - 适配桌面和移动端
- ✍️ Markdown 支持 - 渲染代码、列表、加粗等
- 🔄 会话历史 - 本地存储，快速切换
- 🔌 HTTP API 对接后端

---

## 快速开始

### 前置要求

- **Node.js** 18+
- **npm** 或 **pnpm**

### 安装

```bash
# 克隆项目
git clone https://github.com/sleep-yu/copilot-web.git
cd copilot-web

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开 http://localhost:5173 查看效果。

### 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录。

---

## 项目结构

```
copilot-web/
├── src/
│   ├── App.tsx           # 主组件（状态管理、消息逻辑）
│   ├── App.css          # 样式（CSS 变量、组件样式）
│   ├── main.tsx         # 入口文件
│   └── index.css        # 全局重置样式
├── ui-design/           # UI 设计稿和评审文档
│   ├── mockup-*.html    # 高保真原型
│   └── DESIGN-REVIEW-*.md # 设计评审报告
├── public/              # 静态资源
├── SPEC.md              # 产品规格文档
└── README.md            # 本文档
```

---

## 功能清单

### 已完成 ✅

| 功能 | 说明 |
|------|------|
| 发送/接收消息 | Enter 发送，Shift+Enter 换行 |
| 主题切换 | 深色/浅色，自动记忆到 localStorage |
| Markdown 渲染 | 支持标题、列表、代码块、引用等 |
| 代码高亮 | 支持多语言代码块语法高亮 |
| 消息复制 | 点击复制消息内容 |
| 打字机动画 | AI 回复时的加载动画 |
| 空状态引导 | 欢迎界面设计 |
| 响应式布局 | 桌面/平板/手机适配 |
| 侧边栏 | 新建对话入口 |
| 会话历史 | 本地存储，自动恢复 |

### 规划中 🔄

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 后端历史同步 | 将历史存储到后端 API | P1 |
| 重新生成回复 | 重新请求 AI 回复 | P2 |
| 打字机效果 | AI 回复逐字显示 | P2 |

---

## 设计规范

### 色彩系统

#### 浅色主题
```css
--bg-primary: #ffffff
--bg-secondary: #f8f9fa
--accent-color: #10b981
--text-primary: #1a1a1a
```

#### 深色主题
```css
--bg-primary: #0f0f0f
--bg-secondary: #18181b
--accent-color: #34d399
--text-primary: #fafafa
```

### 布局

- **侧边栏宽度**: 260px
- **内容最大宽度**: 720px
- **顶部导航高度**: 56px

详细规范见 [SPEC.md](./SPEC.md)

---

## 后端对接

### API 配置

| 项目 | 默认值 |
|------|--------|
| 后端地址 | http://localhost:62345 |
| API 路径 | /copilot/hook |
| 协议 | HTTP POST |

### 修改后端地址

在 `src/App.tsx` 中修改：

```typescript
const API_URL = 'http://你的后端地址:端口/copilot/hook'
```

### 请求格式

```json
{
  "sessionId": "web-client-{timestamp}",
  "data": {
    "fromUser": "user_001",
    "type": "text",
    "content": "用户输入的消息"
  }
}
```

### 响应格式（预期）

```json
{
  "data": {
    "messages": [
      { "fromUser": "system", "content": "AI 回复内容" }
    ]
  }
}
```

---

## 架构说明

### 前端存储 vs 后端存储

**当前实现**：前端 localStorage 存储
- ✅ 快速上线，无需后端配合
- ✅ 离线可用
- ❌ 仅限当前浏览器

**未来规划**：后端 API 存储
- ✅ 跨设备同步
- ✅ 更安全
- ❌ 需要后端开发

建议：等后端 API 就绪后，扩展 `src/utils/storage.ts` 对接后端。

---

## 开发指南

### 添加新依赖

```bash
npm install <package-name>
```

### 代码规范

- 使用 TypeScript 类型
- CSS 变量定义在 `:root` 中
- 组件保持单一职责

### 提交规范

```bash
git add .
git commit -m "feat: 新功能描述"
```

---

## 常见问题

### Q: 后端没有响应？

1. 检查后端是否启动在 62345 端口
2. 检查 CORS 配置
3. 查看浏览器控制台 Network 面板

### Q: Markdown 不渲染？

确保后端返回的内容使用标准 Markdown 格式。

### Q: 如何清除历史？

在浏览器控制台执行：

```javascript
localStorage.clear()
location.reload()
```

---

## 更新日志

### 2026-03-23

- **feat**: 简约风 UI 重构上线
  - 侧边栏 + 顶部导航
  - 深/浅主题切换
  - Markdown 渲染 + 代码高亮
  - 消息发送/接收
  - Toast 提示 + 消息复制
  - 空状态引导
  - 打字机动画
  - 会话历史本地存储

---

## 登录注册模块

### 后端接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/register` | POST | 注册（需要 email, password, nickname） |
| `/api/auth/login` | POST | 登录（需要 email, password） |
| `/api/auth/me` | GET | 获取当前用户信息 |
| `/api/auth/logout` | POST | 登出 |

### 前端配置

- **前端地址**: `http://localhost:5173`
- **后端地址**: `http://localhost:62345`
- **API Base URL**: `http://localhost:62345`（可通过 `VITE_API_BASE_URL` 修改）

### 登录注册流程

1. 打开前端 `/login` 页面
2. 注册新账号 → 调用后端 `/api/auth/register`
3. 注册成功后自动登录 → 调用 `/api/auth/login`
4. 跳转到首页 `/`
5. 刷新页面验证登录状态保持

### 依赖服务

- **MongoDB**: `mongodb://localhost:27017/copilot`
- **后端**: `npm run dev`（端口 62345）

### 启动顺序

```bash
# 1. 启动 MongoDB
brew services start mongodb-community

# 2. 启动后端
cd ../copilot-mini && npm run dev

# 3. 启动前端
cd copilot-web && npm run dev
```

---

> 🚀 祝你开发愉快！