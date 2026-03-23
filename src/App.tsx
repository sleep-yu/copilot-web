import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import './App.css'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

type Theme = 'dark' | 'light'

const API_URL = 'http://localhost:62345/copilot/hook'

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'light'
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

  // 发送消息
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
      console.log('后端返回:', result)

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

  // 自动调整输入框高度
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px'
  }

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  // 复制消息
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      showToast('已复制')
    }).catch(() => {
      showToast('复制失败')
    })
  }

  // Toast 提示
  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  // 新建对话
  const newChat = () => {
    setMessages([])
    setSidebarOpen(false)
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

        <div className="sidebar-content">
          <div className="sidebar-section">
            <div className="sidebar-section-title">今天</div>
            <button className="sidebar-item active">
              <svg viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>当前会话</span>
            </button>
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-footer-item" onClick={toggleTheme}>
            <svg viewBox="0 0 24 24">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {theme === 'dark' ? '浅色模式' : '深色模式'}
          </button>
        </div>
      </aside>

      {/* 主聊天区域 */}
      <main className="main-content">
        {/* 顶部导航 */}
        <header className="header">
          <div className="header-left">
            <button className="menu-btn" onClick={toggleSidebar}>
              <svg viewBox="0 0 24 24">
                <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <h1 className="header-title">Copilot</h1>
          </div>
          <div className="header-actions">
            <button className="header-btn" onClick={toggleTheme} title="切换主题">
              <svg viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </header>

        {/* 消息区域 */}
        <div className="chat-container">
          <div className="messages-area">
            {messages.length === 0 && (
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

            {messages.map(msg => (
              <div key={msg.id} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? (
                    <svg viewBox="0 0 24 24">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
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
                              <SyntaxHighlighter
                                style={oneDark}
                                language={match ? match[1] : 'text'}
                                PreTag="div"
                              >
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
              <div className="typing-indicator">
                <div className="message-avatar">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
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
            <p className="input-hint">按 Enter 发送 · Shift + Enter 换行</p>
          </div>
        </div>
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

export default App