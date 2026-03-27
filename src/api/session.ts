// 会话 API
import { get, post, put, del } from './index'

// 消息类型
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

// 会话类型
export interface Session {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

// 会话列表项 (简化版)
export interface SessionListItem {
  id: string
  title: string
  messageCount: number
  createdAt: string
  updatedAt: string
}

// 分页响应
export interface Pagination {
  page: number
  pageSize: number
  total: number
}

// 会话列表响应
export interface SessionListResponse {
  sessions: SessionListItem[]
  pagination: Pagination
}

// 创建会话请求
export interface CreateSessionRequest {
  title?: string
}

// 获取会话列表
export async function getSessions(
  page: number = 1,
  pageSize: number = 20
): Promise<SessionListResponse> {
  return get<SessionListResponse>(
    `/api/sessions?page=${page}&pageSize=${pageSize}`
  )
}

// 获取会话详情
export async function getSession(id: string): Promise<Session> {
  return get<Session>(`/api/sessions/${id}`)
}

// 创建会话
export async function createSession(
  data: CreateSessionRequest = {}
): Promise<Session> {
  return post<Session>('/api/sessions', data)
}

// 更新会话
export async function updateSession(
  id: string,
  data: { title?: string }
): Promise<void> {
  return put<void>(`/api/sessions/${id}`, data)
}

// 删除会话
export async function deleteSession(id: string): Promise<void> {
  return del<void>(`/api/sessions/${id}`)
}

// 添加消息响应类型（用户消息会同时返回 AI 回复）
export interface AddMessageResponse {
  user: Message
  assistant?: Message  // 用户消息时返回，助手消息时不返回
}

// 添加消息
export async function addMessage(
  sessionId: string,
  data: { role: 'user' | 'assistant'; content: string }
): Promise<AddMessageResponse> {
  return post<AddMessageResponse>(`/api/sessions/${sessionId}/messages`, data)
}

// 清空消息
export async function clearMessages(sessionId: string): Promise<void> {
  return del<void>(`/api/sessions/${sessionId}/messages`)
}
