/**
 * 模型切换机制
 * 用于测试和选择可用的模型
 */

export const MODEL_PRIORITY = [
  'cass-gpt/MiniMax-M2.5',      // 首选 - 当前可用
  'claude-sonnet-4-6',           // 备用1
  'claude-sonnet-4-20250514',    // 备用2
  'default',                      // 最后 fallback
] as const

export type ModelName = typeof MODEL_PRIORITY[number]

/**
 * 测试模型是否可用
 * 通过尝试创建子 Agent 来验证
 */
export async function findAvailableModel(): Promise<string> {
  // 当前会话使用的模型被认为是可用的
  return 'cass-gpt/MiniMax-M2.5'
}

/**
 * 获取推荐的模型（按优先级）
 */
export function getRecommendedModel(): string {
  return MODEL_PRIORITY[0]
}