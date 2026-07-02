/**
 * 任务追踪工具 — 防止"点击按钮即完成"的作弊行为
 * 流程：用户点击"前往完成" → 导航到目标页面 → 实际执行操作 → 触发任务完成
 */

const TRIGGER_KEY = 'paw_train_task_triggers'
const PENDING_COMPLETION_KEY = 'paw_train_pending_completions'

/** 用户点击任务按钮时设置触发器，记录要去完成哪个任务 */
export const setTaskTrigger = (actionKey, taskId) => {
  const data = { taskId, actionKey, timestamp: Date.now() }
  localStorage.setItem(`${TRIGGER_KEY}_${actionKey}`, JSON.stringify(data))
}

/** 检查是否有对应任务的触发器（用于判断用户是否从任务入口过来） */
export const getTrigger = (actionKey) => {
  const raw = localStorage.getItem(`${TRIGGER_KEY}_${actionKey}`)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

/** 消费触发器——操作完成后调用，清除触发器并记录待完成 */
export const claimTrigger = (actionKey) => {
  const trigger = getTrigger(actionKey)
  if (!trigger) return null

  localStorage.removeItem(`${TRIGGER_KEY}_${actionKey}`)

  // 写入待完成列表，供 PetTasks 消费
  const pending = JSON.parse(localStorage.getItem(PENDING_COMPLETION_KEY) || '[]')
  const today = new Date().toDateString()
  if (!pending.find(p => p.taskId === trigger.taskId && p.date === today)) {
    pending.push({ taskId: trigger.taskId, actionKey, date: today })
  }
  localStorage.setItem(PENDING_COMPLETION_KEY, JSON.stringify(pending))

  return trigger.taskId
}

/** PetTasks 消费所有待完成项，返回 taskId 数组 */
export const consumePendingCompletions = () => {
  const pending = JSON.parse(localStorage.getItem(PENDING_COMPLETION_KEY) || '[]')
  if (pending.length === 0) return []

  const today = new Date().toDateString()
  const todaysIds = pending
    .filter(p => p.date === today)
    .map(p => p.taskId)

  // 移除今日已消费的，保留其他日期的
  const remaining = pending.filter(p => p.date !== today)
  localStorage.setItem(PENDING_COMPLETION_KEY, JSON.stringify(remaining))

  return todaysIds
}
