import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { t } from '../utils/i18n'
import PointsNotificationModal from './PointsNotificationModal'

const DEFAULT_TASKS = [
  { id: 1, nameKey: 'tasks.playWithPet', descKey: 'tasks.playWithPetDesc', icon: '🎮', points: 10, exp: 5 },
  { id: 2, nameKey: 'tasks.feedPet', descKey: 'tasks.feedPetDesc', icon: '🍖', points: 15, exp: 8 },
  { id: 3, nameKey: 'tasks.petPet', descKey: 'tasks.petPetDesc', icon: '🤗', points: 8, exp: 4 },
  { id: 4, nameKey: 'tasks.postFeed', descKey: 'tasks.postFeedDesc', icon: '📷', points: 20, exp: 10 },
  { id: 5, nameKey: 'tasks.chatPet', descKey: 'tasks.chatPetDesc', icon: '💬', points: 12, exp: 6 },
  { id: 6, nameKey: 'tasks.walkPet', descKey: 'tasks.walkPetDesc', icon: '🚶', points: 25, exp: 12 }
]

const PetTasks = () => {
  const { pet, updatePetStats, setPet } = useStore()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [completedTasks, setCompletedTasks] = useState([])
  const [showPointsModal, setShowPointsModal] = useState(false)
  const [earnedPoints, setEarnedPoints] = useState(0)

  useEffect(() => {
    const today = new Date().toDateString()
    const saved = localStorage.getItem('paw_train_tasks')
    
    if (saved) {
      const data = JSON.parse(saved)
      if (data.date === today) {
        setTasks(data.tasks || DEFAULT_TASKS)
        setCompletedTasks(data.completedTasks || [])
        return
      }
    }
    
    setTasks(DEFAULT_TASKS)
    setCompletedTasks([])
  }, [])

  const saveTasks = useCallback((updatedTasks, updatedCompleted) => {
    const today = new Date().toDateString()
    localStorage.setItem('paw_train_tasks', JSON.stringify({
      date: today,
      tasks: updatedTasks,
      completedTasks: updatedCompleted
    }))
  }, [])

  const saveTaskToHistory = useCallback((taskId) => {
    const today = new Date().toISOString().split('T')[0]
    const savedHistory = localStorage.getItem('paw_train_task_history')
    const history = savedHistory ? JSON.parse(savedHistory) : []

    history.push({
      id: Date.now(),
      taskId,
      date: today,
      completedAt: new Date().toISOString()
    })

    localStorage.setItem('paw_train_task_history', JSON.stringify(history))
  }, [])

  const completeTask = useCallback((taskId) => {
    if (completedTasks.includes(taskId)) return

    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const newCompleted = [...completedTasks, taskId]
    setCompletedTasks(newCompleted)
    saveTasks(tasks, newCompleted)
    saveTaskToHistory(taskId)

    const newPet = {
      ...pet,
      points: (pet.points || 0) + task.points,
      exp: (pet.exp || 0) + task.exp,
      intimacy: Math.min(100, (pet.intimacy || 0) + 1)
    }

    if (newPet.exp >= (newPet.expToNext || 200)) {
      newPet.level = (newPet.level || 1) + 1
      newPet.exp = newPet.exp - (newPet.expToNext || 200)
      newPet.expToNext = Math.floor((newPet.expToNext || 200) * 1.2)
    }

    setPet(newPet)
    localStorage.setItem('paw_train_pet_state', JSON.stringify(newPet))
    updatePetStats({
      points: newPet.points,
      exp: newPet.exp,
      level: newPet.level,
      intimacy: newPet.intimacy
    })

    setEarnedPoints(task.points)
    setTimeout(() => setShowPointsModal(true), 300)
  }, [completedTasks, tasks, pet, setPet, updatePetStats, saveTasks])

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
                    onClick={() => completeTask(task.id)}
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