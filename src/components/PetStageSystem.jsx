import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/useStore'

const STAGE_CONFIG = {
  pixel: {
    name: '像素宠物',
    icon: '👾',
    color: '#8B5CF6',
    description: '经典像素风格，怀旧可爱',
    requirements: { level: 1, points: 0, price: 0 },
    features: ['基础互动', '简单动画', '基础聊天'],
    model: 'pixel'
  },
  anime: {
    name: '二次元宠物',
    icon: '🎨',
    color: '#EC4899',
    description: '卡通渲染风格，活泼可爱',
    requirements: { level: 10, points: 1000, price: 9.9 },
    features: ['丰富动作', '表情变化', '个性对话', '虚拟装扮'],
    model: 'anime'
  },
  realistic: {
    name: '真实感宠物',
    icon: '✨',
    color: '#F59E0B',
    description: '3D真实毛发，沉浸体验',
    requirements: { level: 30, points: 5000, price: 39.9 },
    features: ['真实毛发', '物理交互', 'AI个性化', '专属技能', 'IP衍生品'],
    model: 'realistic'
  }
}

const UpgradeModal = ({ isOpen, onClose, currentStage, onUpgrade }) => {
  const { user, pet } = useStore()
  const [selectedStage, setSelectedStage] = useState(null)
  const [isUpgrading, setIsUpgrading] = useState(false)

  const stages = Object.entries(STAGE_CONFIG).filter(([key]) => {
    const order = ['pixel', 'anime', 'realistic']
    const currentIndex = order.indexOf(currentStage)
    const targetIndex = order.indexOf(key)
    return targetIndex > currentIndex
  })

  useEffect(() => {
    if (stages.length > 0) {
      setSelectedStage(stages[0][0])
    }
  }, [currentStage])

  const canUpgrade = (stageKey) => {
    const stage = STAGE_CONFIG[stageKey]
    const req = stage.requirements
    return pet.level >= req.level && user.points >= req.points
  }

  const handleUpgrade = async () => {
    if (!selectedStage || !canUpgrade(selectedStage)) return

    setIsUpgrading(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    onUpgrade(selectedStage)
    setIsUpgrading(false)
    onClose()
  }

  if (stages.length === 0) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="gradient-bg p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">🌟 宠物进化</h2>
              <p className="text-white/80">升级宠物形态，解锁更多技能</p>
            </div>

            <div className="p-6 space-y-4">
              {stages.map(([key, stage]) => {
                const affordable = canUpgrade(key)
                const req = stage.requirements

                return (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => affordable && setSelectedStage(key)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedStage === key
                        ? 'border-orange-400 bg-orange-50'
                        : affordable
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-gray-100 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
                        style={{ backgroundColor: stage.color + '20' }}
                      >
                        {stage.icon}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{stage.name}</h3>
                        <p className="text-sm text-gray-500">{stage.description}</p>
                        <div className="flex gap-2 mt-2">
                          {req.level > pet.level && (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">
                              需{req.level}级
                            </span>
                          )}
                          {user.points < req.points && (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">
                              需{req.points}积分
                            </span>
                          )}
                          {affordable && (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">
                              可升级
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        {req.price > 0 && (
                          <div className="text-orange-500 font-bold">¥{req.price}</div>
                        )}
                        <div className="text-gray-400 text-sm">
                          {req.points}积分
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {stage.features.map(feature => (
                        <span
                          key={feature}
                          className="text-xs px-2 py-1 rounded-full"
                          style={{ backgroundColor: stage.color + '20', color: stage.color }}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <div className="p-6 pt-0">
              <motion.button
                whileHover={{ scale: canUpgrade(selectedStage) ? 1.02 : 1 }}
                whileTap={{ scale: canUpgrade(selectedStage) ? 0.98 : 1 }}
                onClick={handleUpgrade}
                disabled={!canUpgrade(selectedStage) || isUpgrading}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
                  canUpgrade(selectedStage)
                    ? 'gradient-bg text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isUpgrading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    进化中...
                  </span>
                ) : (
                  `立即进化为 ${STAGE_CONFIG[selectedStage]?.name || ''}`
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const PetStageDisplay = ({ stage, size = 'large' }) => {
  const config = STAGE_CONFIG[stage]

  const sizeClasses = {
    small: 'w-12 h-12 text-2xl',
    medium: 'w-20 h-20 text-4xl',
    large: 'w-32 h-32 text-6xl'
  }

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center`}
      style={{ backgroundColor: config.color + '20' }}
    >
      {config.icon}
    </motion.div>
  )
}

const ProgressToNextStage = ({ currentStage, pet, user }) => {
  const stages = ['pixel', 'anime', 'realistic']
  const currentIndex = stages.indexOf(currentStage)

  if (currentIndex >= stages.length - 1) {
    return (
      <div className="text-center py-4">
        <div className="text-2xl mb-2">🎉</div>
        <div className="text-gray-600 font-medium">已达到最高阶段！</div>
      </div>
    )
  }

  const nextStage = stages[currentIndex + 1]
  const config = STAGE_CONFIG[nextStage]
  const req = config.requirements

  const levelProgress = Math.min(100, (pet.level / req.level) * 100)
  const pointsProgress = Math.min(100, (user.points / req.points) * 100)

  return (
    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{config.icon}</span>
        <div>
          <div className="font-bold text-gray-800">下一阶段：{config.name}</div>
          <div className="text-sm text-gray-500">还差 {req.level - pet.level} 级</div>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>等级进度</span>
            <span>{pet.level} / {req.level}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress}%` }}
              className="h-full gradient-bg rounded-full"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>积分需求</span>
            <span>{user.points} / {req.points}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pointsProgress}%` }}
              className="h-full bg-purple-400 rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export { STAGE_CONFIG, UpgradeModal, PetStageDisplay, ProgressToNextStage }
