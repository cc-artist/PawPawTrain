import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const useStore = () => {
  const [user, setUser] = React.useState({
    id: 'user-1',
    name: '铲屎官',
    phone: '13800138000',
    points: 888,
    level: 5
  })

  return { user }
}

const AIPersonaCard = ({ persona, isSelected, onSelect }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect && onSelect(persona)}
      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-purple-400 bg-purple-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-3xl">
          {persona.avatar || '🤖'}
        </div>
        <div className="flex-1">
          <div className="font-bold text-gray-800">{persona.name}</div>
          <div className="text-sm text-gray-500">{persona.type}</div>
        </div>
        {isSelected && (
          <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center text-white text-sm">
            ✓
          </div>
        )}
      </div>
      <p className="text-sm text-gray-600">{persona.description}</p>
      <div className="flex gap-2 mt-3">
        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded-full">
          {persona.postCount} 帖子
        </span>
        <span className="text-xs px-2 py-1 bg-pink-100 text-pink-600 rounded-full">
          {persona.fanCount} 粉丝
        </span>
      </div>
    </motion.div>
  )
}

const GeneratedIPDisplay = ({ ip, onDownload, onUseAsAvatar }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl overflow-hidden shadow-lg"
    >
      <div className="h-64 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 flex items-center justify-center relative">
        <div className="text-9xl">{ip.avatar || '🤖'}</div>
        <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 rounded-full text-xs font-bold">
          AI生成
        </div>
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-white rounded-full shadow-lg text-sm font-bold"
        >
          {ip.name}
        </motion.div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{ip.name}</h3>
        <p className="text-sm text-gray-600 mb-4">{ip.description}</p>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">{ip.likes}</div>
            <div className="text-xs text-gray-500">喜欢</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-500">{ip.shares}</div>
            <div className="text-xs text-gray-500">分享</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">{ip.uses}</div>
            <div className="text-xs text-gray-500">使用</div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {ip.tags.map((tag, idx) => (
            <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDownload && onDownload(ip)}
            className="flex-1 py-3 bg-purple-100 text-purple-600 rounded-xl font-bold text-sm"
          >
            📥 下载
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onUseAsAvatar && onUseAsAvatar(ip)}
            className="flex-1 py-3 gradient-bg text-white rounded-xl font-bold text-sm"
          >
            ✨ 使用
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

const IPGenerator = ({ isOpen, onClose, pet }) => {
  const { user } = useStore()
  const [step, setStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedIP, setGeneratedIP] = useState(null)
  const [selectedStyle, setSelectedStyle] = useState(null)
  const [selectedPersona, setSelectedPersona] = useState(null)

  const ipStyles = [
    {
      id: 'anime',
      name: '二次元风格',
      icon: '🎨',
      description: '可爱的二次元卡通形象',
      color: '#EC4899'
    },
    {
      id: 'realistic',
      name: '写实风格',
      icon: '📸',
      description: '接近真实照片的效果',
      color: '#3B82F6'
    },
    {
      id: 'pixel',
      name: '像素风格',
      icon: '👾',
      description: '复古像素游戏风格',
      color: '#8B5CF6'
    },
    {
      id: 'cartoon',
      name: 'Q版风格',
      icon: '😊',
      description: '圆润可爱的Q版形象',
      color: '#F59E0B'
    }
  ]

  const personas = [
    {
      id: 1,
      name: '元气萌宠',
      type: '活泼可爱',
      avatar: '🐱',
      description: '充满活力，总是有无穷的能量',
      postCount: 128,
      fanCount: 1024
    },
    {
      id: 2,
      name: '高冷喵星人',
      type: '傲娇高冷',
      avatar: '😼',
      description: '表面冷漠，内心渴望被关注',
      postCount: 89,
      fanCount: 2048
    },
    {
      id: 3,
      name: '温柔小天使',
      type: '温柔治愈',
      avatar: '🐰',
      description: '总是给人温暖和治愈的感觉',
      postCount: 256,
      fanCount: 4096
    }
  ]

  const handleGenerate = async () => {
    if (!selectedStyle || !selectedPersona) return

    setIsGenerating(true)
    setStep(3)

    await new Promise(resolve => setTimeout(resolve, 3000))

    const newIP = {
      id: Date.now(),
      name: `${pet?.name || '宠物'}的${selectedStyle.name}形象`,
      avatar: selectedPersona.avatar,
      description: `基于${pet?.name || '宠物'}的${selectedPersona.type}性格和${selectedStyle.name}生成的专属IP形象`,
      style: selectedStyle.id,
      personality: selectedPersona.type,
      tags: [selectedStyle.name, selectedPersona.type, pet?.type || '宠物'],
      likes: Math.floor(Math.random() * 1000) + 100,
      shares: Math.floor(Math.random() * 500) + 50,
      uses: Math.floor(Math.random() * 200) + 20
    }

    setGeneratedIP(newIP)
    setIsGenerating(false)
  }

  const handleGenerateProducts = () => {
    alert('🎉 已基于您的IP形象生成商品！\n\n商品包括：\n- 专属表情包\n- 定制壁纸\n- 人设卡片\n- 毛绒公仔设计稿')
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="gradient-bg p-6 text-white flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">🤖 AI IP生成器</h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-2xl"
              >
                ×
              </button>
            </div>
            <p className="text-white/80">
              基于{pet?.name || '宠物'}{step === 1 ? '选择风格' : step === 2 ? '选择人设' : '生成中...'}
            </p>

            <div className="flex gap-2 mt-4">
              {[1, 2, 3].map(s => (
                <div
                  key={s}
                  className={`h-2 flex-1 rounded-full ${
                    s <= step ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {step === 1 && (
              <div className="space-y-3">
                <h3 className="font-bold text-gray-800 mb-4">选择IP风格</h3>
                {ipStyles.map(style => (
                  <motion.div
                    key={style.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedStyle(style)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedStyle?.id === style.id
                        ? 'border-purple-400 bg-purple-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                        style={{ backgroundColor: style.color + '20' }}
                      >
                        {style.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-800">{style.name}</div>
                        <div className="text-sm text-gray-500">{style.description}</div>
                      </div>
                      {selectedStyle?.id === style.id && (
                        <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center text-white text-sm">
                          ✓
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <h3 className="font-bold text-gray-800 mb-4">选择IP人设</h3>
                {personas.map(persona => (
                  <AIPersonaCard
                    key={persona.id}
                    persona={persona}
                    isSelected={selectedPersona?.id === persona.id}
                    onSelect={setSelectedPersona}
                  />
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-8">
                {isGenerating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="text-7xl mb-6"
                    >
                      🤖
                    </motion.div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      AI正在创作中...
                    </h3>
                    <p className="text-gray-500 mb-6">
                      基于{selectedStyle?.name}风格和{selectedPersona?.name}人设生成专属IP
                    </p>
                    <div className="space-y-2 text-sm text-gray-400">
                      <div>✓ 分析宠物特征</div>
                      <div>✓ 生成IP形象</div>
                      <div className="animate-pulse">○ 优化细节...</div>
                    </div>
                  </>
                ) : generatedIP ? (
                  <GeneratedIPDisplay
                    ip={generatedIP}
                    onDownload={() => alert('图片已保存到相册')}
                    onUseAsAvatar={() => alert('已设置为宠物头像')}
                  />
                ) : null}
              </div>
            )}
          </div>

          {step < 3 && (
            <div className="p-6 pt-0 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (step === 1 && selectedStyle) setStep(2)
                  else if (step === 2 && selectedPersona) handleGenerate()
                }}
                disabled={(step === 1 && !selectedStyle) || (step === 2 && !selectedPersona)}
                className={`w-full py-4 rounded-2xl font-bold text-lg ${
                  (step === 1 && selectedStyle) || (step === 2 && selectedPersona)
                    ? 'gradient-bg text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {step === 1 ? '下一步' : '开始生成'}
              </motion.button>
            </div>
          )}

          {step === 3 && generatedIP && (
            <div className="p-6 pt-0 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerateProducts}
                className="w-full py-4 gradient-bg text-white rounded-2xl font-bold text-lg"
              >
                🎁 基于此IP生成商品
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export { IPGenerator, AIPersonaCard, GeneratedIPDisplay }
