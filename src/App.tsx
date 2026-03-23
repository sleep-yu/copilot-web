import { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

type Theme = 'dark' | 'light'

// 主题类型
const API_URL = 'http://localhost:62345/copilot/hook'

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'dark'
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 主题切换
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev)
  }

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // 发送消息到后端
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // 重置 textarea 高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
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

      // 解析后端返回
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
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('请求失败:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ 请求失败，请检查后端是否运行\n\n错误: ' + (error as Error).message,
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, errorMessage])
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

  // 自动调整 textarea 高度
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
  }

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  // 复制消息
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      showToast('已复制到剪贴板')
    }).catch(() => {
      showToast('复制失败')
    })
  }

  // 显示 Toast
  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  // 新建对话
  const newChat = () => {
    setMessages([])
    setSidebarOpen(false)
  }

  // 渲染消息内容 (简化版 Markdown)
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => (
      <p key={i}>{line}</p>
    ))
  }

  return (
    <div className="app-container">
      {/* 移动端遮罩 */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* 侧边栏 */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={newChat}>
            <svg viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            新对话
          </button>
        </div>

        <div className="history-list">
          <div className="history-section">
            <div className="history-section-title">今天</div>
            <button className="history-item active">
              <svg viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>当前会话</span>
            </button>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-footer-content">
            <button className="theme-toggle" onClick={toggleTheme}>
              <svg viewBox="0 0 24 24">
                {theme === 'dark' ? (
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round"/>
                ) : (
                  <>
                    <circle cx="12" cy="12" r="5"/>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" strokeLinejoin="round"/>
                  </>
                )}
              </svg>
              {theme === 'dark' ? '浅色模式' : '深色模式'}
            </button>
          </div>
        </div>
      </aside>

      {/* 主聊天区域 */}
      <main className="chat-main">
        {/* 标题栏 */}
        <header className="chat-header">
          <div className="chat-header-left">
            <button className="menu-btn" onClick={toggleSidebar}>
              <svg viewBox="0 0 24 24">
                <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <h1 className="chat-title">Copilot</h1>
          </div>
          <div className="chat-header-right">
            <button className="header-btn" onClick={toggleTheme} title="切换主题">
              <svg viewBox="0 0 24 24">
                {theme === 'dark' ? (
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round"/>
                ) : (
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round"/>
                )}
              </svg>
            </button>
          </div>
        </header>

        {/* 消息区域 */}
        <div className="messages-container">
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-logo">
                <svg viewBox="0 0 24 24">
                  <path d="M22.281 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-7.245l-4.779-2.758-.142.08a4.485 4.485 0 0 1 3.798-2.866V4.288a.066.066 0 0 1 .028-.061l4.83 2.791a4.5 4.5 0 0 1-.767 8.104zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.954a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
                </svg>
              </div>
              <h2>有什么可以帮你？</h2>
              <p>发送消息开始对话，我可以帮你解答问题、写代码、分析数据等</p>
              
              <div className="empty-state-suggestions">
                <button className="suggestion-btn">
                  <svg viewBox="0 0 24 24">
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  帮我解释这段代码
                </button>
                <button className="suggestion-btn">
                  <svg viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  写一个算法题解
                </button>
                <button className="suggestion-btn">
                  <svg viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  分析这份数据
                </button>
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`message-wrapper ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? (
                  <svg viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24">
                    <path d="M22.281 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073z"/>
                  </svg>
                )}
              </div>
              <div className="message-body">
                <div className="message-content">
                  {renderContent(msg.content)}
                </div>
                <div className="message-footer">
                  <span className="message-time">{formatTime(msg.timestamp)}</span>
                  <div className="message-actions">
                    <button 
                      className="action-btn" 
                      onClick={() => copyMessage(msg.content)}
                      title="复制"
                    >
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
            <div className="loading-indicator">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="input-container">
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
            <button 
              className="send-btn"
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
            >
              <svg viewBox="0 0 24 24">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="input-footer">
            <span className="input-hint">Copilot 可以出错，请谨慎使用。</span>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

export default App