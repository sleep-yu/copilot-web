// 聊天主页面
import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useAuth } from '../context/AuthContext'
import {
  getSessions,
  createSession,
  getSession,
  updateSession,
  deleteSession,
  type Session,
  type Message,
  type SessionListItem,
} from '../api/session'
import './ChatPage.css'

const API_URL = 'http://localhost:62345/copilot/hook'

export function ChatPage() {
  const { user, logout } = useAuth()
  const [sessions, setSessions] = useState<SessionListItem[]>([])
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 加载会话列表
  const loadSessions = useCallback(async () => {
    try {
      const data = await getSessions(1, 50)
      setSessions(data.sessions)
    } catch (error) {
      console.error('加载会话列表失败:', error)
    } finally {
      setIsLoadingSessions(false)
    }
  }, [])

  // 加载或创建当前会话
  const loadOrCreateSession = useCallback(async () => {
    try {
      // 尝试获取第一个会话
      const data = await getSessions(1, 1)
      if (data.sessions.length > 0) {
        const session = await getSession(data.sessions[0].id)
        setCurrentSession(session)
      } else {
        // 创建新会话
        const newSession = await createSession({ title: '新对话' })
        setCurrentSession(newSession)
      }
    } catch (error) {
      console.error('加载会话失败:', error)
      // 创建新会话作为后备
      try {
        const newSession = await createSession({ title: '新对话' })
        setCurrentSession(newSession)
      } catch {}
    }
    await loadSessions()
  }, [loadSessions])

  useEffect(() => {
    loadOrCreateSession()
  }, [loadOrCreateSession])

  // 自动滚动
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [currentSession?.messages, scrollToBottom])

  // 发送消息
  const sendMessage = async () => {
    if (!input.trim() || isLoading || !currentSession) return

    const userMessage: Message = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    }

    const newMessages = [...currentSession.messages, userMessage]
    setCurrentSession({ ...currentSession, messages: newMessages })
    setInput('')
    setIsLoading(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      let assistantContent = '无回复'
      const messagesData = result.data?.messages || result.messages || []
      if (Array.isArray(messagesData) && messagesData.length > 0) {
        const aiMessages = messagesData
          .filter((m: any) => m.fromUser === 'system' && m.content)
          .map((m: any) => m.content)
        if (aiMessages.length > 0) {
          assistantContent = aiMessages.join('\n')
        }
      }

      const assistantMessage: Message = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: assistantContent,
        timestamp: Date.now()
      }

      const finalMessages = [...newMessages, assistantMessage]
      setCurrentSession({ ...currentSession, messages: finalMessages })

      // 更新会话标题（第一条用户消息后）
      if (newMessages.length === 1) {
        const title = input.trim().slice(0, 20)
        try {
          await updateSession(currentSession.id, { title })
          await loadSessions()
        } catch {}
      }
    } catch (error) {
      console.error('请求失败:', error)
      const errorMessage: Message = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: '❌ 请求失败，请检查后端是否运行',
        timestamp: Date.now()
      }
      setCurrentSession({ ...currentSession, messages: [...newMessages, errorMessage] })
    } finally {
      setIsLoading(false)
    }
  }

  // 键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // 自动调整输入框
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px'
  }

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  // 格式化日期
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const dayMs = 24 * 60 * 60 * 1000

    if (diff < dayMs) return '今天'
    if (diff < 2 * dayMs) return '昨天'
    if (diff < 7 * dayMs) return '本周'
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  // 复制消息
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      showToast('已复制')
    }).catch(() => {
      showToast('复制失败')
    })
  }

  // Toast
  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  // 新建会话
  const handleNewChat = async () => {
    try {
      const newSession = await createSession({ title: '新对话' })
      setCurrentSession(newSession)
      await loadSessions()
      setSidebarOpen(false)
    } catch (error) {
      console.error('创建会话失败:', error)
    }
  }

  // 切换会话
  const handleSelectSession = async (id: string) => {
    try {
      const session = await getSession(id)
      setCurrentSession(session)
      setSidebarOpen(false)
    } catch (error) {
      console.error('加载会话失败:', error)
    }
  }

  // 删除会话
  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await deleteSession(id)
      if (currentSession?.id === id) {
        await loadOrCreateSession()
      } else {
        await loadSessions()
      }
    } catch (error) {
      console.error('删除会话失败:', error)
    }
  }

  // 登出
  const handleLogout = async () => {
    try {
      await logout()
    } catch {}
    window.location.href = '/login'
  }

  // 按日期分组
  const groupedSessions = sessions.reduce((groups, session) => {
    const date = formatDate(session.updatedAt)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(session)
    return groups
  }, {} as Record<string, SessionListItem[]>)

  return (
    <div className="app-container">
      <div className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* 侧边栏 */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={handleNewChat}>
            <svg viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            新对话
          </button>
        </div>

        <div className="sidebar-content">
          {isLoadingSessions ? (
            <div className="sidebar-loading">加载中...</div>
          ) : (
            Object.entries(groupedSessions).map(([date, sessionList]) => (
              <div className="sidebar-section" key={date}>
                <div className="sidebar-section-title">{date}</div>
                {sessionList.map(session => (
                  <button
                    key={session.id}
                    className={`sidebar-item ${currentSession?.id === session.id ? 'active' : ''}`}
                    onClick={() => handleSelectSession(session.id)}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{session.title}</span>
                    <button className="sidebar-item-delete" onClick={(e) => handleDeleteSession(e, session.id)}>
                      <svg viewBox="0 0 24 24">
                        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="user-email">{user?.email}</span>
            <button className="logout-btn" onClick={handleLogout}>退出</button>
          </div>
        </div>
      </aside>

      {/* 主内容 */}
      <main className="main-content">
        <header className="header">
          <div className="header-left">
            <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
              <svg viewBox="0 0 24 24">
                <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <h1 className="header-title">{currentSession?.title || 'Copilot'}</h1>
          </div>
        </header>

        <div className="chat-container">
          <div className="messages-area">
            {currentSession?.messages.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h2>开始对话</h2>
                <p>输入你的问题，AI 助手会帮你解答</p>
              </div>
            )}

            {currentSession?.messages.map(msg => (
              <div key={msg.id} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? (
                    <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  )}
                </div>
                <div className="message-content">
                  <div className="message-bubble">
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '')
                            const isInline = !match && !className
                            return isInline ? (
                              <code className={className} {...props}>{children}</code>
                            ) : (
                              <SyntaxHighlighter style={oneDark} language={match ? match[1] : 'text'} PreTag="div">
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            )
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                  <div className="message-footer">
                    <span className="message-time">{formatTime(msg.timestamp)}</span>
                    <div className="message-actions">
                      <button className="action-btn" onClick={() => copyMessage(msg.content)} title="复制">
                        <svg viewBox="0 0 24 24">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="typing-indicator">
                <div className="message-avatar">
                  <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <div className="typing-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <div className="input-wrapper">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="输入消息..."
                disabled={isLoading}
                rows={1}
              />
              <button className="send-btn" onClick={sendMessage} disabled={isLoading || !input.trim()}>
                <svg viewBox="0 0 24 24">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <p className="input-hint">按 Enter 发送 · Shift + Enter 换行</p>
          </div>
        </div>
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
