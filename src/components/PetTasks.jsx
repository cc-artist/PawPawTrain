import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { t } from '../utils/i18n'
import { setTaskTrigger, consumePendingCompletions } from '../utils/taskTracker'
import PointsNotificationModal from './PointsNotificationModal'

const DEFAULT_TASKS = [
  { id: 1, nameKey: 'tasks.playWithPet', descKey: 'tasks.playWithPetDesc', icon: '🎮', points: 10, exp: 5, actionKey: 'play', path: null },
  { id: 2, nameKey: 'tasks.feedPet', descKey: 'tasks.feedPetDesc', icon: '🍖', points: 15, exp: 8, actionKey: 'feed', path: null },
  { id: 3, nameKey: 'tasks.petPet', descKey: 'tasks.petPetDesc', icon: '🤗', points: 8, exp: 4, actionKey: 'pet', path: null },
  { id: 4, nameKey: 'tasks.postFeed', descKey: 'tasks.postFeedDesc', icon: '📷', points: 20, exp: 10, actionKey: 'post', path: '/upload' },
  { id: 5, nameKey: 'tasks.chatPet', descKey: 'tasks.chatPetDesc', icon: '💬', points: 12, exp: 6, actionKey: 'chat', path: null },
  { id: 6, nameKey: 'tasks.walkPet', descKey: 'tasks.walkPetDesc', icon: '🚶', points: 25, exp: 12, actionKey: 'walk', path: '/training' }
]

const PetTasks = ({ onTriggerPlay, onTriggerFeed, onTriggerPet, onTriggerChat }) => {
  const { pet, updatePetStats, setPet } = useStore()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [completedTasks, setCompletedTasks] = useState([])
  const [showPointsModal, setShowPointsModal] = useState(false)
  const [earnedPoints, setEarnedPoints] = useState(0)

  // 加载 + 消费待完成项
  useEffect(() => {
    const today = new Date().toDateString()
    const saved = localStorage.getItem('paw_train_tasks')

    let loadedTasks = DEFAULT_TASKS
    let loadedCompleted = []

    if (saved) {
      const data = JSON.parse(saved)
      if (data.date === today) {
        loadedTasks = data.tasks || DEFAULT_TASKS
        loadedCompleted = data.completedTasks || []
      }
    }

    // 消费从其他页面传回的待完成项
    const pendingIds = consumePendingCompletions()
    if (pendingIds.length > 0) {
      const newCompleted = [...loadedCompleted]
      pendingIds.forEach(taskId => {
        if (!newCompleted.includes(taskId)) {
          newCompleted.push(taskId)
          // 给予奖励
          processReward(taskId)
        }
      })
      loadedCompleted = newCompleted
      saveTasksToStorage(loadedTasks, loadedCompleted)
    }

    setTasks(loadedTasks)
    setCompletedTasks(loadedCompleted)
  }, [])

  // 轮询检查待完成项（用户从其他页面返回时）
  useEffect(() => {
    const interval = setInterval(() => {
      const pendingIds = consumePendingCompletions()
      if (pendingIds.length > 0) {
        setCompletedTasks(prev => {
          const next = [...prev]
          let changed = false
          pendingIds.forEach(taskId => {
            if (!next.includes(taskId)) {
              next.push(taskId)
              changed = true
              processReward(taskId)
            }
          })
          if (changed) {
            saveTasksToStorage(tasks, next)
          }
          return changed ? next : prev
        })
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [tasks, pet])

  const saveTasksToStorage = (updatedTasks, updatedCompleted) => {
    const today = new Date().toDateString()
    localStorage.setItem('paw_train_tasks', JSON.stringify({
      date: today,
      tasks: updatedTasks,
      completedTasks: updatedCompleted
    }))
  }

  const processReward = useCallback((taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // 记录历史
    const today = new Date().toISOString().split('T')[0]
    const savedHistory = localStorage.getItem('paw_train_task_history')
    const history = savedHistory ? JSON.parse(savedHistory) : []
    history.push({ id: Date.now(), taskId, date: today, completedAt: new Date().toISOString() })
    localStorage.setItem('paw_train_task_history', JSON.stringify(history))

    // 更新宠物属性
    const currentPet = JSON.parse(localStorage.getItem('paw_train_pet_state') || '{}')
    const newPet = {
      ...currentPet,
      points: (currentPet.points || 0) + task.points,
      exp: (currentPet.exp || 0) + task.exp,
      intimacy: Math.min(100, (currentPet.intimacy || 0) + 1)
    }

    if (newPet.exp >= (newPet.expToNext || 200)) {
      newPet.level = (newPet.level || 1) + 1
      newPet.exp = newPet.exp - (newPet.expToNext || 200)
      newPet.expToNext = Math.floor((newPet.expToNext || 200) * 1.2)
    }

    localStorage.setItem('paw_train_pet_state', JSON.stringify(newPet))
    setPet(newPet)
    updatePetStats({
      points: newPet.points,
      exp: newPet.exp,
      level: newPet.level,
      intimacy: newPet.intimacy
    })

    setEarnedPoints(task.points)
    setTimeout(() => setShowPointsModal(true), 300)
  }, [tasks, setPet, updatePetStats])

  const handleTaskClick = useCallback((task) => {
    if (completedTasks.includes(task.id)) return

    // 设置触发器
    setTaskTrigger(task.actionKey, task.id)

    if (task.path) {
      // 有目标页面 → 导航过去
      navigate(task.path)
    } else {
      // 首页操作 → 触发对应行为
      switch (task.actionKey) {
        case 'play': onTriggerPlay?.(); break
        case 'feed': onTriggerFeed?.(); break
        case 'pet': onTriggerPet?.(); break
        case 'chat': onTriggerChat?.(); break
        default: break
      }
    }
  }, [completedTasks, navigate, onTriggerPlay, onTriggerFeed, onTriggerPet, onTriggerChat])

  const completedCount = completedTasks.length
  const totalCount = tasks.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div>
      <div className="glass-effect rounded-2xl p-4 border border-cyber-blue/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-lg">📋 {t('home.dailyTasks')}</h3>
            <p className="text-gray-400 text-sm">{t('home.completeTasks')}</p>
          </div>
          <button
            onClick={() => navigate('/task-history')}
            className="px-3 py-1.5 bg-cyber-blue/20 text-cyber-blue rounded-lg text-sm font-medium hover:bg-cyber-blue/30 transition-colors"
          >
            {t('home.taskHistory')}
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-cyber-blue text-sm">{t('home.todayProgress')}</span>
            <span className="text-cyber-yellow font-bold">{completedCount}/{totalCount}</span>
          </div>
          <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-cyber-blue to-cyber-purple rounded-full"
            />
          </div>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => {
            const isCompleted = completedTasks.includes(task.id)
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-green-500/20 border-green-500/30'
                    : 'bg-gray-700/50 border-gray-600 hover:border-cyber-blue/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                      isCompleted ? 'bg-green-500/30' : 'bg-cyber-blue/20'
                    }`}>
                      {isCompleted ? '✅' : task.icon}
                    </div>
                    <div>
                      <h4 className={`font-medium ${isCompleted ? 'text-green-400 line-through' : 'text-white'}`}>
                        {t(task.nameKey)}
                      </h4>
                      <p className="text-gray-400 text-sm">{t(task.descKey)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-cyber-yellow text-sm font-bold">+{task.points} 💰</div>
                    <div className="text-cyber-purple text-xs">+{task.exp} EXP</div>
                  </div>
                </div>
                {!isCompleted && (
                  <button
                    onClick={() => handleTaskClick(task)}
                    className="mt-2 w-full py-2 bg-gradient-to-r from-cyber-blue to-cyber-purple text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    {t('home.completeTask')}
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      <PointsNotificationModal
        isOpen={showPointsModal}
        onClose={() => setShowPointsModal(false)}
        points={earnedPoints}
        source="task"
        onConfirm={() => {}}
      />
    </div>
  )
}

export default PetTasks
