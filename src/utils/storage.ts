// 会话历史存储工具

const HISTORY_KEY = 'copilot-web-history'
const MAX_HISTORY = 50 // 最多保存 50 条会话

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

// 获取所有会话
export function getHistory(): Conversation[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

// 保存会话列表
function saveHistory(history: Conversation[]): void {
  try {
    // 限制数量
    const trimmed = history.slice(0, MAX_HISTORY)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
  } catch (e) {
    console.error('保存历史失败:', e)
  }
}

// 创建新会话
export function createConversation(): Conversation {
  const conversation: Conversation = {
    id: 'conv-' + Date.now(),
    title: '新对话',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  
  const history = getHistory()
  history.unshift(conversation)
  saveHistory(history)
  
  return conversation
}

// 更新会话
export function updateConversation(id: string, updates: Partial<Conversation>): void {
  const history = getHistory()
  const index = history.findIndex(c => c.id === id)
  
  if (index !== -1) {
    history[index] = { ...history[index], ...updates, updatedAt: Date.now() }
    
    // 如果更新了消息，重新排序（最新在前）
    if (updates.messages) {
      history.sort((a, b) => b.updatedAt - a.updatedAt)
    }
    
    saveHistory(history)
  }
}

// 获取单个会话
export function getConversation(id: string): Conversation | null {
  const history = getHistory()
  return history.find(c => c.id === id) || null
}

// 删除会话
export function deleteConversation(id: string): void {
  const history = getHistory()
  const filtered = history.filter(c => c.id !== id)
  saveHistory(filtered)
}

// 生成会话标题（基于第一条用户消息）
export function generateTitle(messages: Message[]): string {
  const firstUserMessage = messages.find(m => m.role === 'user')
  if (!firstUserMessage) return '新对话'
  
  const content = firstUserMessage.content
  // 取前 20 个字符作为标题
  const title = content.slice(0, 20)
  return title.length < content.length ? title + '...' : title
}
