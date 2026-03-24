// 认证 Context
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { getToken, clearToken, ApiError } from '../api'
import { getCurrentUser, type UserInfo } from '../api/auth'

interface AuthContextType {
  user: UserInfo | null
  isLoading: boolean
  isAuthenticated: boolean
  theme: 'light' | 'dark'
  toggleTheme: () => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, nickname?: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  })

  // 主题初始化
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // 切换主题
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', next)
      document.documentElement.setAttribute('data-theme', next)
      return next
    })
  }, [])

  // 检查登录状态
  const checkAuth = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const userInfo = await getCurrentUser()
      setUser(userInfo)
    } catch (error) {
      // Token 失效，清除
      if (error instanceof ApiError && error.code === 401) {
        clearToken()
        setUser(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 初始化时检查
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // 登录
  const login = useCallback(async (email: string, password: string) => {
    const { login: loginApi } = await import('../api/auth')
    const { setToken } = await import('../api')
    
    const result = await loginApi({ email, password })
    setToken(result.token)
    setUser(result.user)
  }, [])

  // 注册
  const register = useCallback(async (email: string, password: string, nickname?: string) => {
    const { register: registerApi } = await import('../api/auth')
    await registerApi({ email, password, nickname })
  }, [])

  // 登出
  const logout = useCallback(async () => {
    try {
      const { logout: logoutApi } = await import('../api/auth')
      await logoutApi()
    } finally {
      clearToken()
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        theme,
        toggleTheme,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
