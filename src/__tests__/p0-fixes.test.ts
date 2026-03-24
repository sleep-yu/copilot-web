import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const PROJECT_ROOT = resolve(__dirname, '../..')

describe('P0 修复验证', () => {
  describe('1. src/api/auth.ts - logout 返回类型', () => {
    it('logout 应返回 { message: string } 类型', () => {
      const authTsPath = resolve(PROJECT_ROOT, 'src/api/auth.ts')
      const content = readFileSync(authTsPath, 'utf-8')
      
      // 检查 logout 函数返回类型
      expect(content).toMatch(/export async function logout\(\): Promise<\{ message: string \}/)
    })
  })

  describe('2. src/pages/Register.tsx - 确认密码字段', () => {
    it('应有 confirmPassword 状态变量', () => {
      const registerPath = resolve(PROJECT_ROOT, 'src/pages/Register.tsx')
      const content = readFileSync(registerPath, 'utf-8')
      
      expect(content).toMatch(/const \[confirmPassword, setConfirmPassword\]/)
    })

    it('应有确认密码输入框', () => {
      const registerPath = resolve(PROJECT_ROOT, 'src/pages/Register.tsx')
      const content = readFileSync(registerPath, 'utf-8')
      
      expect(content).toMatch(/id="confirmPassword"/)
      expect(content).toMatch(/确认密码/)
    })

    it('应有密码一致性校验', () => {
      const registerPath = resolve(PROJECT_ROOT, 'src/pages/Register.tsx')
      const content = readFileSync(registerPath, 'utf-8')
      
      expect(content).toMatch(/password !== confirmPassword/)
      expect(content).toMatch(/两次输入的密码不一致/)
    })
  })

  describe('3. src/pages/Auth.css - loading 样式', () => {
    it('应有 .loading-screen 样式', () => {
      const authCssPath = resolve(PROJECT_ROOT, 'src/pages/Auth.css')
      const content = readFileSync(authCssPath, 'utf-8')
      
      expect(content).toMatch(/\.loading-screen\s*\{/)
    })

    it('应有 .loading-spinner 样式', () => {
      const authCssPath = resolve(PROJECT_ROOT, 'src/pages/Auth.css')
      const content = readFileSync(authCssPath, 'utf-8')
      
      expect(content).toMatch(/\.loading-spinner\s*\{/)
    })
  })

  describe('4. src/context/AuthContext.tsx - logout finally 块', () => {
    it('logout 应在 finally 中 clearToken', () => {
      const authContextPath = resolve(PROJECT_ROOT, 'src/context/AuthContext.tsx')
      const content = readFileSync(authContextPath, 'utf-8')
      
      // 检查 logout 函数结构
      const logoutMatch = content.match(/const logout = useCallback\(async \(\) => \{[\s\S]*?\n  \}, \[\]\)/)
      expect(logoutMatch).not.toBeNull()
      
      const logoutContent = logoutMatch?.[0] || ''
      expect(logoutContent).toMatch(/finally\s*\{[\s\S]*?clearToken\(\)[\s\S]*?\}/)
    })
  })
})
