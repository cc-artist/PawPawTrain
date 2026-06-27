import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const DEFAULT_TASKS = [
  { id: 1, name: '和宠物玩耍', icon: '🎮', points: 10, exp: 5 },
  { id: 2, name: '喂养宠物', icon: '🍖', points: 15, exp: 8 },
  { id: 3, name: '抚摸宠物', icon: '🤗', points: 8, exp: 4 },
  { id: 4, name: '发布动态', icon: '📷', points: 20, exp: 10 },
  { id: 5, name: '聊天互动', icon: '💬', points: 12, exp: 6 },
  { id: 6, name: '遛弯散步', icon: '🚶', points: 25, exp: 12 }
]

const TaskHistory = () => {
  const navigate = useNavigate()
  const [taskHistory, setTaskHistory] = useState([])

  useEffect(() => {
    const saved = localStorage.getItem('paw_train_task_history')
    if (saved) {
      setTaskHistory(JSON.parse(saved))
    }
  }, [])

  const getTaskInfo = useCallback((taskId) => {
    return DEFAULT_TASKS.find(t => t.id === taskId) || { name: '未知任务', icon: '❓', points: 0, exp: 0 }
  }, [])

  const formatDate = useCallback((dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }, [])

  const groupByDate = useCallback(() => {
    const grouped = {}
    taskHistory.forEach(record => {
      const dateKey = record.date
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(record)
    })
    return grouped
  }, [taskHistory])

  const groupedHistory = groupByDate()
  const dates = Object.keys(groupedHistory).sort().reverse()

  const totalPoints = taskHistory.reduce((sum, record) => sum + getTaskInfo(record.taskId).points, 0)
  const totalExp = taskHistory.reduce((sum, record) => sum + getTaskInfo(record.taskId).exp, 0)

  return (
    <div className="min-h-full gradient-bg">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-xl glass-effect flex items-center justify-center text-cyber-blue hover:bg-cyber-blue/20 transition-colors"
          >
            ←
          </button>
          <div>
            <h1 className="text-white font-bold text-xl">📊 任务历史</h1>
            <p className="text-gray-400 text-sm">查看您的任务完成记录</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="glass-effect rounded-2xl p-4 border border-cyber-yellow/30">
            <div className="text-cyber-yellow text-sm mb-1">总积分</div>
            <div className="text-white font-bold text-2xl">💰 {totalPoints}</div>
          </div>
          <div className="glass-effect rounded-2xl p-4 border border-cyber-purple/30">
            <div className="text-cyber-purple text-sm mb-1">总经验</div>
            <div className="text-white font-bold text-2xl">✨ {totalExp}</div>
          </div>
        </div>

        {dates.length === 0 ? (
          <div className="glass-effect rounded-2xl p-8 text-center border border-gray-600">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-white font-bold text-lg mb-2">暂无任务记录</h3>
            <p className="text-gray-400 mb-4">完成每日任务后，记录会显示在这里</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gradient-to-r from-cyber-blue to-cyber-purple text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              返回首页
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {dates.map((dateKey, dateIdx) => {
              const records = groupedHistory[dateKey]
              const datePoints = records.reduce((sum, record) => sum + getTaskInfo(record.taskId).points, 0)
              const dateExp = records.reduce((sum, record) => sum + getTaskInfo(record.taskId).exp, 0)

              return (
                <motion.div
                  key={dateKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: dateIdx * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-white font-bold">{formatDate(dateKey)}</h3>
                      <p className="text-gray-400 text-sm">
                        完成 {records.length} 个任务 · +{datePoints} 💰 · +{dateExp} ✨
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {records.map((record, idx) => {
                      const task = getTaskInfo(record.taskId)
                      return (
                        <motion.div
                          key={record.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: dateIdx * 0.1 + idx * 0.05 }}
                          className="glass-effect rounded-xl p-4 border border-gray-600 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-2xl">
                              {task.icon}
                            </div>
                            <div>
                              <div className="text-white font-medium">{task.name}</div>
                              <div className="text-gray-400 text-xs">
                                {new Date(record.completedAt).toLocaleTimeString('zh-CN')}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-cyber-yellow text-sm font-bold">+{task.points}</div>
                            <div className="text-cyber-purple text-xs">+{task.exp} EXP</div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskHistory