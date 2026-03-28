// API 基础配置
// 读取环境变量 VITE_API_BASE_URL，未配置时仅本地开发使用 fallback
// 生产环境请配置 .env.production 或在 CI/CD 中注入环境变量
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:62345'
const TOKEN_KEY = 'copilot_token'

// 获取 Token
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

// 设置 Token
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

// 清除 Token
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// 统一响应类型
export type ApiResponse<T = unknown> = {
  code: number
  message: string
  data: T
}

// 错误类型
export class ApiError extends Error {
  constructor(
    message: string,
    public code: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// 基础请求工具
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  const result = await response.json()

  // 后端返回格式：{ errorCode: number, data: { code, message, data }, message?, data? }
  // 统一错误检查：外层 errorCode > 0 或内层 data.code !== 0 都算错误
  const errorCode = result.errorCode ?? result.data?.code
  const errorMessage = result.message || result.data?.message || '请求失败'
  
  if (errorCode !== 0) {
    throw new ApiError(errorMessage, errorCode || 500)
  }

  return result.data?.data ?? result.data
}

// GET 请求
export function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' })
}

// POST 请求
export function post<T>(path: string, data?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

// PUT 请求
export function put<T>(path: string, data?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

// DELETE 请求
export function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' })
}

export { API_BASE_URL, TOKEN_KEY }
