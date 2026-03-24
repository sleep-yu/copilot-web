// 认证 API
import { post, get } from './index'

// 用户信息
export interface UserInfo {
  userId: string
  email: string
  nickname?: string
  avatar?: string
}

// 注册请求
export interface RegisterRequest {
  email: string
  password: string
  nickname?: string
}

// 登录请求
export interface LoginRequest {
  email: string
  password: string
}

// 注册响应
export interface RegisterResponse {
  userId: string
  email: string
  nickname?: string
}

// 登录响应
export interface LoginResponse {
  token: string
  user: UserInfo
}

// 注册
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  return post<RegisterResponse>('/api/auth/register', data)
}

// 登录
export async function login(data: LoginRequest): Promise<LoginResponse> {
  return post<LoginResponse>('/api/auth/login', data)
}

// 获取当前用户
export async function getCurrentUser(): Promise<UserInfo> {
  return get<UserInfo>('/api/auth/me')
}

// 登出
export async function logout(): Promise<{ message: string }> {
  return post<{ message: string }>('/api/auth/logout')
}
