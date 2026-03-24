import { describe, it, expect, beforeAll } from 'vitest'

const API_BASE = 'http://localhost:62345'

interface ApiResponse<T = unknown> {
  errorCode: number
  data?: {
    code: number
    message: string
    data?: T
  }
  message?: string
}

describe('Auth API Tests', () => {
  let authToken: string

  beforeAll(async () => {
    // 登录获取有效 token
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: '123456'
      })
    })
    const json: ApiResponse = await response.json()
    authToken = json.data?.data?.token || ''
  })

  // ==================== POST /api/auth/register ====================
  describe('POST /api/auth/register', () => {
    it('正常注册流程 - 应该返回 userId 和 email', async () => {
      const uniqueEmail = `register${Date.now()}@example.com`
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: uniqueEmail,
          password: '123456',
          nickname: 'Test User'
        })
      })

      const json: ApiResponse = await response.json()
      expect(response.status).toBe(201)
      expect(json.data?.code).toBe(0)
      expect(json.data?.data).toHaveProperty('userId')
      expect(json.data?.data?.email).toBe(uniqueEmail)
      expect(json.data?.data?.nickname).toBe('Test User')
    })

    it('邮箱已存在 - 应该返回 code 400', async () => {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: '123456'
        })
      })

      const json: ApiResponse = await response.json()
      expect(json.data?.code).toBe(400)
      expect(json.data?.message).toContain('邮箱已存在')
    })

    it('密码太短 - 应该返回 validation error', async () => {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `shortpw${Date.now()}@example.com`,
          password: '123'
        })
      })

      const json: ApiResponse = await response.json()
      expect(json.errorCode).toBe(600)
      expect(json.message).toContain('Validation Error')
    })
  })

  // ==================== POST /api/auth/login ====================
  describe('POST /api/auth/login', () => {
    it('正常登录 - 应该返回 token 和 user', async () => {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: '123456'
        })
      })

      const json: ApiResponse = await response.json()
      expect(response.status).toBe(200)
      expect(json.data?.code).toBe(0)
      expect(json.data?.data).toHaveProperty('token')
      expect(json.data?.data).toHaveProperty('user')
      expect(json.data?.data?.user?.email).toBe('admin@example.com')
    })

    it('密码错误 - 应该返回 code 401', async () => {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'wrongpassword'
        })
      })

      const json: ApiResponse = await response.json()
      expect(json.data?.code).toBe(401)
      expect(json.data?.message).toContain('邮箱或密码错误')
    })
  })

  // ==================== GET /api/auth/me ====================
  describe('GET /api/auth/me', () => {
    it('带正确 token - 应该返回用户信息', async () => {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })

      const json: ApiResponse = await response.json()
      expect(response.status).toBe(200)
      expect(json.data?.code).toBe(0)
      expect(json.data?.data).toHaveProperty('email')
      expect(json.data?.data).toHaveProperty('userId')
    })

    it('不带 token - 应该返回 code 401', async () => {
      const response = await fetch(`${API_BASE}/api/auth/me`)

      const json: ApiResponse = await response.json()
      expect(json.data?.code).toBe(401)
      expect(json.data?.message).toContain('未登录')
    })

    it('带无效 token - 应该返回 code 401', async () => {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: 'Bearer invalid_token_123' }
      })

      const json: ApiResponse = await response.json()
      expect(json.data?.code).toBe(401)
      expect(json.data?.message).toContain('Token无效')
    })
  })

  // ==================== POST /api/auth/logout ====================
  describe('POST /api/auth/logout', () => {
    it('正常登出 - 应该返回成功', async () => {
      const response = await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` }
      })

      const json: ApiResponse = await response.json()
      expect(json.data?.code).toBe(0)
      expect(json.data?.message).toContain('登出成功')
    })
  })
})
