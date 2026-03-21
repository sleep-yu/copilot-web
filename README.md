# copilot-web

copilot-mini 的纯前端聊天界面，基于 React + TypeScript + Vite。

## 技术栈

| 技术 | 说明 |
|------|------|
| React 19 | UI 框架 |
| TypeScript | 类型安全 |
| Vite | 构建工具 |
| WebSocket | 与后端通信 |

## 项目目的

为 `copilot-mini` 后端（WebSocket 接口）开发一个轻量级的纯前端聊天界面，便于：
- 与 AI 进行实时对话
- 后续扩展和定制

## 后端对接

- **后端地址**: `ws://localhost:62345/copilot/hook`
- **通信协议**: WebSocket
- **数据格式**: JSON

## 开发指南

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 更新日志

### 2026-03-21

- **feat**: 初始化项目，克隆仓库并配置 Vite + React + TypeScript 环境
- **commit**: 7e7592e - feat: 初始化 Vite + React + TypeScript 项目

---

> 对接后端 copilot-mini (端口 62345)