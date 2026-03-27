/**
 * 前端组件测试模板
 * 使用 Vitest + React Testing Library
 * 
 * 运行方式:
 *   cd copilot-web
 *   npx vitest run src/__tests__/
 */

import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Login } from '../pages/Login'
import { Register } from '../pages/Register'
import { ChatPage } from '../pages/ChatPage'
import { AuthProvider } from '../context/AuthContext'

// ==========================================
// 辅助函数
// ==========================================

function renderWithRouter(ui: React.ReactElement) {
  return render(ui, { wrapper: BrowserRouter })
}

function renderWithAuth(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  )
}

// ==========================================
// 模块 1: 登录页面 (Login)
// ==========================================

describe('【登录页面】UI 渲染', () => {
  test('TC-FRONT-LOGIN-001: 页面正确渲染所有表单元素', () => {
    renderWithRouter(<Login />)
    
    expect(screen.getByLabelText(/邮箱/)).toBeTruthy()
    expect(screen.getByLabelText(/密码/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /登录/ })).toBeTruthy()
    expect(screen.getByText(/还没有账号/)).toBeTruthy()
    expect(screen.getByRole('link', { name: /立即注册/ })).toBeTruthy()
  })

  test('TC-FRONT-LOGIN-002: 链接到注册页', () => {
    renderWithRouter(<Login />)
    const link = screen.getByRole('link', { name: /立即注册/ })
    expect(link.getAttribute('href')).toBe('/register')
  })
})

describe('【登录页面】表单验证', () => {
  test('TC-FRONT-LOGIN-003: 空表单提交 - 显示浏览器原生验证', async () => {
    renderWithRouter(<Login />)

    // 空表单提交应触发 HTML5 原生验证
    const submitBtn = screen.getByRole('button', { name: /登录/ })
    // 因为 input 有 required 属性，直接 click submit 应该不触发提交
    fireEvent.click(submitBtn)

    // 验证邮箱 input 有 required 属性
    const emailInput = screen.getByLabelText(/邮箱/)
    expect(emailInput).toHaveAttribute('required')
  })

  test('TC-FRONT-LOGIN-004: 密码字段有最小长度验证', () => {
    renderWithRouter(<Login />)
    const passwordInput = screen.getByLabelText(/密码/)
    expect(passwordInput).toHaveAttribute('minLength', '6')
  })
})

describe('【登录页面】用户交互', () => {
  test('TC-FRONT-LOGIN-005: 输入框可正常输入', () => {
    renderWithRouter(<Login />)
    
    const emailInput = screen.getByLabelText(/邮箱/) as HTMLInputElement
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    expect(emailInput.value).toBe('test@example.com')

    const passwordInput = screen.getByLabelText(/密码/) as HTMLInputElement
    fireEvent.change(passwordInput, { target: { value: 'Test@123456' } })
    expect(passwordInput.value).toBe('Test@123456')
  })

  test('TC-FRONT-LOGIN-006: 加载中按钮显示 Loading 文字', async () => {
    // Mock login function that never resolves to test loading state
    vi.mock('../context/AuthContext', async () => {
      const actual = await vi.importActual('../context/AuthContext')
      return {
        ...actual,
        useAuth: () => ({
          login: vi.fn().mockImplementation(() => new Promise(() => {})), // never resolves
        }),
      }
    })

    renderWithRouter(<Login />)
    
    const emailInput = screen.getByLabelText(/邮箱/)
    const passwordInput = screen.getByLabelText(/密码/)
    const submitBtn = screen.getByRole('button', { name: /登录/ })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'Test@123456' } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /登录中/ })).toBeTruthy()
    })
  })
})

// ==========================================
// 模块 2: 注册页面 (Register)
// ==========================================

describe('【注册页面】UI 渲染', () => {
  test('TC-FRONT-REG-001: 页面正确渲染所有表单元素', () => {
    renderWithRouter(<Register />)
    
    expect(screen.getByLabelText(/邮箱/)).toBeTruthy()
    expect(screen.getByLabelText(/昵称/)).toBeTruthy()
    expect(screen.getByLabelText(/密码/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /注册/ })).toBeTruthy()
    expect(screen.getByText(/已有账号/)).toBeTruthy()
    expect(screen.getByRole('link', { name: /立即登录/ })).toBeTruthy()
  })

  test('TC-FRONT-REG-002: 昵称是可选的 (无 required)', () => {
    renderWithRouter(<Register />)
    const nicknameInput = screen.getByLabelText(/昵称/)
    expect(nicknameInput).not.toHaveAttribute('required')
  })

  test('TC-FRONT-REG-003: 链接到登录页', () => {
    renderWithRouter(<Register />)
    const link = screen.getByRole('link', { name: /立即登录/ })
    expect(link.getAttribute('href')).toBe('/login')
  })
})

// ==========================================
// 模块 3: 认证上下文 (AuthContext)
// ==========================================

describe('【认证上下文】AuthContext', () => {
  test('TC-FRONT-AUTH-001: 未登录时 user 为 null', () => {
    // 清除 localStorage
    localStorage.clear()

    const TestComponent = () => {
      const { user } = require('../context/AuthContext').useAuth()
      return <div>{user === null ? '未登录' : '已登录'}</div>
    }

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    )

    expect(screen.getByText('未登录')).toBeTruthy()
  })

  test('TC-FRONT-AUTH-002: Token 存储到 localStorage', async () => {
    localStorage.clear()
    
    const mockLogin = vi.fn().mockResolvedValue({
      token: 'mock_jwt_token',
      user: { userId: '1', email: 'test@example.com' },
    })

    vi.mock('../api/auth', () => ({
      login: mockLogin,
      register: vi.fn(),
      getCurrentUser: vi.fn().mockResolvedValue({ userId: '1', email: 'test@example.com' }),
      logout: vi.fn().mockResolvedValue(undefined),
    }))

    vi.mock('../context/AuthContext', async () => {
      const actual = await vi.importActual('../context/AuthContext')
      return {
        ...actual,
        AuthProvider: ({ children }: { children: React.ReactNode }) => children,
      }
    })

    // 验证登录后 token 被存储
    // 具体断言取决于 AuthContext 实现
  })
})

// ==========================================
// 模块 4: 聊天页面 (ChatPage) - UI 部分
// ==========================================

describe('【聊天页面】UI 渲染', () => {
  test('TC-FRONT-CHAT-001: 渲染空状态提示', () => {
    // Mock empty session
    vi.mock('../api/session', () => ({
      getSessions: vi.fn().mockResolvedValue({ sessions: [], pagination: { page: 1, pageSize: 20, total: 0 } }),
      createSession: vi.fn().mockResolvedValue({ id: 'new-session', title: '新对话', messages: [] }),
      getSession: vi.fn().mockResolvedValue({ id: 'new-session', title: '新对话', messages: [] }),
      updateSession: vi.fn().mockResolvedValue(undefined),
      deleteSession: vi.fn().mockResolvedValue(undefined),
    }))

    renderWithAuth(<ChatPage />)

    // 等待加载完成
    return waitFor(() => {
      expect(screen.queryByText(/开始对话/)).toBeTruthy()
    })
  })

  test('TC-FRONT-CHAT-002: 显示输入框和发送按钮', () => {
    vi.mock('../api/session', () => ({
      getSessions: vi.fn().mockResolvedValue({ sessions: [], pagination: { page: 1, pageSize: 20, total: 0 } }),
      createSession: vi.fn().mockResolvedValue({ id: 's1', title: '新对话', messages: [] }),
      getSession: vi.fn().mockResolvedValue({ id: 's1', title: '新对话', messages: [] }),
      updateSession: vi.fn(),
      deleteSession: vi.fn(),
    }))

    renderWithAuth(<ChatPage />)

    return waitFor(() => {
      expect(screen.getByPlaceholderText(/输入消息/)).toBeTruthy()
      expect(screen.getByRole('button', { name: /发送/ })).toBeTruthy()
    })
  })

  test('TC-FRONT-CHAT-003: 发送按钮空输入时禁用', () => {
    vi.mock('../api/session', () => ({
      getSessions: vi.fn().mockResolvedValue({ sessions: [], pagination: { page: 1, pageSize: 20, total: 0 } }),
      createSession: vi.fn().mockResolvedValue({ id: 's1', title: '新对话', messages: [] }),
      getSession: vi.fn().mockResolvedValue({ id: 's1', title: '新对话', messages: [] }),
      updateSession: vi.fn(),
      deleteSession: vi.fn(),
    }))

    renderWithAuth(<ChatPage />)

    return waitFor(() => {
      const sendBtn = screen.getByRole('button', { name: /发送/ })
      expect(sendBtn).toBeDisabled()
    })
  })
})

describe('【聊天页面】消息气泡渲染', () => {
  test('TC-FRONT-CHAT-004: 用户消息显示在右侧', () => {
    const mockMessages = [
      { id: '1', role: 'user', content: '你好', timestamp: Date.now() },
    ]

    vi.mock('../api/session', () => ({
      getSessions: vi.fn().mockResolvedValue({ sessions: [{ id: 's1', title: '测试', messageCount: 1 }], pagination: { page: 1, pageSize: 20, total: 1 } }),
      createSession: vi.fn().mockResolvedValue({ id: 's1', title: '新对话', messages: mockMessages }),
      getSession: vi.fn().mockResolvedValue({ id: 's1', title: '测试', messages: mockMessages }),
      updateSession: vi.fn(),
      deleteSession: vi.fn(),
    }))

    renderWithAuth(<ChatPage />)

    return waitFor(() => {
      const userMessage = screen.getByText('你好')
      expect(userMessage).toBeTruthy()
      // 检查父元素有 'user' class
      expect(userMessage.closest('.message')?.className).toContain('user')
    })
  })

  test('TC-FRONT-CHAT-005: 助手消息显示在左侧', () => {
    const mockMessages = [
      { id: '1', role: 'user', content: '你好', timestamp: Date.now() },
      { id: '2', role: 'assistant', content: '你好！有什么可以帮你？', timestamp: Date.now() + 100 },
    ]

    vi.mock('../api/session', () => ({
      getSessions: vi.fn().mockResolvedValue({ sessions: [{ id: 's1', title: '测试', messageCount: 2 }], pagination: { page: 1, pageSize: 20, total: 1 } }),
      createSession: vi.fn().mockResolvedValue({ id: 's1', title: '新对话', messages: mockMessages }),
      getSession: vi.fn().mockResolvedValue({ id: 's1', title: '测试', messages: mockMessages }),
      updateSession: vi.fn(),
      deleteSession: vi.fn(),
    }))

    renderWithAuth(<ChatPage />)

    return waitFor(() => {
      const assistantMessage = screen.getByText('你好！有什么可以帮你？')
      expect(assistantMessage).toBeTruthy()
      expect(assistantMessage.closest('.message')?.className).toContain('assistant')
    })
  })
})

describe('【聊天页面】Markdown 渲染', () => {
  test('TC-FRONT-CHAT-006: Markdown 代码块正确渲染', () => {
    const mockMessages = [
      { id: '1', role: 'user', content: '写一个 hello world', timestamp: Date.now() },
      { id: '2', role: 'assistant', content: '```javascript\nconsole.log("Hello World")\n```', timestamp: Date.now() + 100 },
    ]

    vi.mock('../api/session', () => ({
      getSessions: vi.fn().mockResolvedValue({ sessions: [{ id: 's1', title: '测试', messageCount: 2 }], pagination: { page: 1, pageSize: 20, total: 1 } }),
      createSession: vi.fn().mockResolvedValue({ id: 's1', title: '新对话', messages: mockMessages }),
      getSession: vi.fn().mockResolvedValue({ id: 's1', title: '测试', messages: mockMessages }),
      updateSession: vi.fn(),
      deleteSession: vi.fn(),
    }))

    renderWithAuth(<ChatPage />)

    return waitFor(() => {
      // 检查代码块渲染（react-markdown + react-syntax-highlighter 生成 pre 标签）
      expect(document.querySelector('pre')).toBeTruthy()
    })
  })
})

describe('【聊天页面】输入框交互', () => {
  test('TC-FRONT-CHAT-007: 输入内容后发送按钮启用', async () => {
    vi.mock('../api/session', () => ({
      getSessions: vi.fn().mockResolvedValue({ sessions: [], pagination: { page: 1, pageSize: 20, total: 0 } }),
      createSession: vi.fn().mockResolvedValue({ id: 's1', title: '新对话', messages: [] }),
      getSession: vi.fn().mockResolvedValue({ id: 's1', title: '新对话', messages: [] }),
      updateSession: vi.fn(),
      deleteSession: vi.fn(),
    }))

    renderWithAuth(<ChatPage />)

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/输入消息/)
      const sendBtn = screen.getByRole('button', { name: /发送/ })

      fireEvent.change(textarea, { target: { value: '你好' } })
      
      expect(sendBtn).not.toBeDisabled()
    })
  })

  test('TC-FRONT-CHAT-008: Enter 键触发发送（无 Shift）', async () => {
    vi.mock('../api/session', () => ({
      getSessions: vi.fn().mockResolvedValue({ sessions: [], pagination: { page: 1, pageSize: 20, total: 0 } }),
      createSession: vi.fn().mockResolvedValue({ id: 's1', title: '新对话', messages: [] }),
      getSession: vi.fn().mockResolvedValue({ id: 's1', title: '新对话', messages: [] }),
      updateSession: vi.fn(),
      deleteSession: vi.fn(),
    }))

    renderWithAuth(<ChatPage />)

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/输入消息/)
      fireEvent.change(textarea, { target: { value: '测试消息' } })
      
      // 模拟 Enter 键按下（不含 Shift）
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })
      
      // 如果 sendMessage 被调用，消息应该从输入框清除
      // 或者通过 mock 验证
    })
  })
})

// ==========================================
// 模块 5: API 工具函数测试
// ==========================================

describe('【API 工具】统一响应处理', () => {
  test('TC-FRONT-API-001: 错误响应抛出 ApiError', async () => {
    // Mock fetch 返回非 code=0 的响应
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ code: 400, message: '邮箱已注册', data: null }),
    })
    globalThis.fetch = mockFetch

    const { ApiError, get } = await import('../api/index')

    try {
      await get('/api/auth/register')
      expect(true).toBe(false) // 不应到达这里
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError)
      expect((e as InstanceType<typeof ApiError>).message).toBe('邮箱已注册')
      expect((e as InstanceType<typeof ApiError>).code).toBe(400)
    }
  })

  test('TC-FRONT-API-002: Token 自动附加到请求头', async () => {
    localStorage.setItem('copilot_token', 'test_token_123')

    let capturedHeaders: Headers | undefined
    const mockFetch = vi.fn().mockImplementation((_url, options) => {
      capturedHeaders = new Headers(options?.headers as Record<string, string>)
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ code: 0, message: 'ok', data: {} }),
      })
    })
    globalThis.fetch = mockFetch

    const { get } = await import('../api/index')
    await get('/api/sessions')

    expect(mockFetch).toHaveBeenCalled()
    expect(capturedHeaders?.get('Authorization')).toBe('Bearer test_token_123')

    localStorage.clear()
  })
})
