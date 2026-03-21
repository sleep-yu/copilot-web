import { useState, useRef, useEffect } from 'react'
import './App.css'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const API_URL = 'http://localhost:62345/copilot/hook'

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

      // 处理后端返回的消息
      let assistantContent = '无回复'
      
      // 正确解析后端返回结构：result.data.messages
      const messagesData = result.data?.messages || result.messages || []
      if (Array.isArray(messagesData) && messagesData.length > 0) {
        const aiMessages = messagesData
          .filter((m: any) => m.fromUser === 'system' && m.content)
          .map((m: any) => m.content)
        if (aiMessages.length > 0) {
          assistantContent = aiMessages.join('\n')
        }
      } else if (result.data?.msgId) {
        // 后端返回了 msgId 说明成功
        assistantContent = '消息已收到'
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

  // 回车发送
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="chat-container">
      {/* 头部 */}
      <header className="chat-header">
        <div className="header-content">
          <div className="logo">🤖</div>
          <h1>Copilot Chat</h1>
        </div>
      </header>

      {/* 消息区域 */}
      <div className="messages-area">
        {messages.length === 0 && (
          <div className="welcome-message">
            <div className="welcome-icon">✨</div>
            <h2>欢迎使用 Copilot Chat</h2>
            <p>开始你的对话吧</p>
          </div>
        )}
        
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-body">
              <div className="message-content">
                {msg.content.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              <div className="message-time">{formatTime(msg.timestamp)}</div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message assistant">
            <div className="avatar">🤖</div>
            <div className="message-body">
              <div className="message-content loading">
                <span className="dot">.</span>
                <span className="dot">.</span>
                <span className="dot">.</span>
                <span>正在思考</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="发送消息... (Shift+Enter 换行)"
          disabled={isLoading}
          rows={1}
        />
        <button 
          onClick={sendMessage} 
          disabled={isLoading || !input.trim()}
          className="send-btn"
        >
          {isLoading ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  )
}

export default App