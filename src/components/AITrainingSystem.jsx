import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MEMORY_TYPES = {
  interaction: {
    name: '互动记忆',
    icon: '🎮',
    color: '#3B82F6',
    description: '记录宠物与主人的互动'
  },
  emotion: {
    name: '情感记忆',
    icon: '💝',
    color: '#EC4899',
    description: '记录宠物的情感变化'
  },
  personality: {
    name: '性格特征',
    icon: '🧠',
    color: '#8B5CF6',
    description: '宠物独特的性格特点'
  },
  preference: {
    name: '喜好习惯',
    icon: '⭐',
    color: '#F59E0B',
    description: '宠物的偏好和行为习惯'
  }
}

const MemoryCard = ({ memory }) => {
  const typeConfig = MEMORY_TYPES[memory.type] || MEMORY_TYPES.interaction

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ backgroundColor: typeConfig.color + '20' }}
        >
          {typeConfig.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-800">
              {typeConfig.name}
            </span>
            <span className="text-xs text-gray-400">
              {memory.time || '刚刚'}
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {memory.content}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-xs px-2 py-1 rounded-full"
              style={{ backgroundColor: typeConfig.color + '20', color: typeConfig.color }}
            >
              相似度 {memory.similarity || '95'}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const MemoryPanel = ({ isOpen, onClose, pet }) => {
  const [memories, setMemories] = useState([
    {
      id: 1,
      type: 'interaction',
      content: '今天主人第一次给我取了名字叫小橘猫，我好开心！',
      time: '2小时前',
      similarity: 98
    },
    {
      id: 2,
      type: 'personality',
      content: '小橘猫似乎特别喜欢吃鱼，每次闻到鱼的味道都会很兴奋',
      time: '1天前',
      similarity: 92
    },
    {
      id: 3,
      type: 'emotion',
      content: '今天主人不在家，小橘猫看起来有点孤单，趴在窗台上等主人',
      time: '3天前',
      similarity: 89
    },
    {
      id: 4,
      type: 'preference',
      content: '小橘猫喜欢在阳光充足的地方睡觉，尤其是中午时分',
      time: '5天前',
      similarity: 85
    }
  ])

  const [selectedType, setSelectedType] = useState(null)

  const filteredMemories = selectedType
    ? memories.filter(m => m.type === selectedType)
    : memories

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-t-3xl w-full max-w-lg max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="gradient-bg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">🧠 宠物记忆库</h2>
                  <p className="text-white/80 text-sm">
                    {pet?.name || '小橘猫'}的记忆正在被AI学习
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-4 border-b border-gray-100">
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedType(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    !selectedType
                      ? 'gradient-bg text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  全部 ({memories.length})
                </button>
                {Object.entries(MEMORY_TYPES).map(([key, config]) => {
                  const count = memories.filter(m => m.type === key).length
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedType(key)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                        selectedType === key
                          ? 'text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                      style={{
                        backgroundColor: selectedType === key ? config.color : undefined
                      }}
                    >
                      {config.icon} {count}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-[50vh] space-y-3">
              {filteredMemories.map(memory => (
                <MemoryCard key={memory.id} memory={memory} />
              ))}

              {filteredMemories.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-5xl mb-4">🧠</div>
                  <p>暂无记忆数据</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex-1 text-sm text-gray-500">
                  <span className="font-medium text-gray-700">{memories.length}</span> 条记忆已学习
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 gradient-bg text-white rounded-full text-sm font-medium"
                >
                  🧠 训练AI
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const TrainProgressModal = ({ isOpen, onClose, pet, onComplete }) => {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('initializing')

  React.useEffect(() => {
    if (isOpen) {
      setProgress(0)
      setPhase('initializing')

      const phases = [
        { name: 'initializing', duration: 1500, label: '正在初始化训练环境...' },
        { name: 'loading_data', duration: 2000, label: '加载宠物记忆数据...' },
        { name: 'processing', duration: 3000, label: '处理性格特征...' },
        { name: 'training', duration: 4000, label: 'AI模型训练中...' },
        { name: 'optimizing', duration: 2000, label: '优化模型参数...' },
        { name: 'saving', duration: 1500, label: '保存训练结果...' },
        { name: 'complete', duration: 500, label: '训练完成！' }
      ]

      let currentProgress = 0
      const totalDuration = phases.reduce((sum, p) => sum + p.duration, 0)

      phases.forEach((p, index) => {
        setTimeout(() => {
          setPhase(p.name)
          currentProgress += (p.duration / totalDuration) * 100
          setProgress(Math.min(currentProgress, 100))

          if (p.name === 'complete') {
            setTimeout(() => {
              onComplete && onComplete()
              onClose()
            }, 1000)
          }
        }, phases.slice(0, index).reduce((sum, ph) => sum + ph.duration, 0))
      })
    }
  }, [isOpen, onComplete, onClose])

  const phaseLabels = {
    initializing: '🔧 初始化中...',
    loading_data: '📚 加载数据...',
    processing: '🧠 分析性格...',
    training: '⚡ 训练中...',
    optimizing: '✨ 优化中...',
    saving: '💾 保存中...',
    complete: '🎉 训练完成！'
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-6xl mb-6"
        >
          🧠
        </motion.div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {pet?.name || '小橘猫'} AI训练中
        </h2>
        <p className="text-gray-500 mb-6">
          {phaseLabels[phase]}
        </p>

        <div className="mb-4">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full gradient-bg rounded-full"
            />
          </div>
        </div>

        <div className="text-sm text-gray-400">
          {Math.round(progress)}% Complete
        </div>

        <div className="mt-6 text-left">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`p-2 rounded-lg ${progress >= 14 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
              ✅ 数据收集
            </div>
            <div className={`p-2 rounded-lg ${progress >= 28 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
              ✅ 特征提取
            </div>
            <div className={`p-2 rounded-lg ${progress >= 56 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
              ✅ 模型训练
            </div>
            <div className={`p-2 rounded-lg ${progress >= 100 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
              ✅ 模型优化
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export { MEMORY_TYPES, MemoryCard, MemoryPanel, TrainProgressModal }
