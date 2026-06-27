import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { petAPI, chatAPI, aiAPI } from '../services/api'
import Pet3D from '../components/Pet3D'
import PetTasks from '../components/PetTasks'
import { useUpload } from '../context/UploadContext'
import { t } from '../utils/i18n'

const petTypeEmojis = {
  dog: '🐶',
  cat: '🐱',
  rabbit: '🐰',
  bird: '🐦',
  fish: '🐟',
  hamster: '🐹',
  turtle: '🐢',
  lizard: '🦎',
  snake: '🐍',
  guinea_pig: '🐹',
  ferret: '🦦',
  hedgehog: '🦔',
  chinchilla: '🐹',
  parrot: '🦜',
  goldfish: '🐠',
  axolotl: '🦎',
  frog: '🐸',
  crab: '🦀',
  gecko: '🦎',
  tarantula: '🕷️',
  scorpion: '🦂'
}

const getPetEmoji = (petType) => {
  return petTypeEmojis[petType] || '🐾'
}

const getStageName = (level) => {
  if (level >= 91) return { stage: 'ultimate', name: t('home.ultimate'), color: 'from-purple-500 to-pink-500' }
  if (level >= 61) return { stage: 'perfect', name: t('home.perfect'), color: 'from-blue-500 to-purple-500' }
  if (level >= 31) return { stage: 'mature', name: t('home.mature'), color: 'from-cyan-500 to-blue-500' }
  if (level >= 11) return { stage: 'growing', name: t('home.growing'), color: 'from-green-500 to-cyan-500' }
  return { stage: 'baby', name: t('home.baby'), color: 'from-orange-500 to-yellow-500' }
}

const Home = () => {
  const { pet, updatePetStats, setPet, fetchPet, setUser } = useStore()
  const { showUpload } = useUpload()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [petExpression, setPetExpression] = useState(null)
  const [petSound, setPetSound] = useState(null)
  const [showSound, setShowSound] = useState(false)
  const [currentAnimation, setCurrentAnimation] = useState(null)
  const [cooldowns, setCooldowns] = useState({ pet: 0, feed: 0, play: 0, walk: 0 })
  const [dailyChatCount, setDailyChatCount] = useState(3)
  const [remainingChats, setRemainingChats] = useState(2)
  const [interactionMessage, setInteractionMessage] = useState(null)
  const [postCount, setPostCount] = useState(0)
  const [previousPostCount, setPreviousPostCount] = useState(0)
  const [isResetting, setIsResetting] = useState(false)
  const [isPlayingVoice, setIsPlayingVoice] = useState(false)
  const [activeSkill, setActiveSkill] = useState(null)
  const chatEndRef = useRef(null)
  const audioRef = useRef(null)

  // 如果宠物还未加载，显示创建宠物引导
  if (!pet || !pet.id) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gradient-bg p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="text-6xl mb-6">🐾</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">欢迎来到 PawPaw Train!</h2>
          <p className="text-gray-600 mb-6">还没有宠物？快来创建你的专属虚拟宠物吧！</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/create-pet')}
            className="w-full py-4 bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold rounded-2xl shadow-lg"
          >
            🎨 创建虚拟宠物
          </motion.button>
        </motion.div>
      </div>
    )
  }

  const learnedSkills = pet?.learnedSkills || []

  const performSkill = (skill) => {
    setActiveSkill(skill)
    showInteraction(`${pet.name}在表演${skill.name}！`, getPetSound(pet.type), skill.animation)
    setTimeout(() => setActiveSkill(null), 3000)
  }

  const getMyPostCount = () => {
    try {
      const saved = localStorage.getItem('paw_train_all_posts')
      if (saved) {
        const allPosts = JSON.parse(saved)
        return allPosts.filter(post => post.isMine).length
      }
    } catch (e) {
      console.error('Error loading posts:', e)
    }
    return 0
  }

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (showUpload) return
      
      if (e.key === 'paw_train_pet_state') {
        try {
          const updatedPet = JSON.parse(e.newValue)
          if (updatedPet && updatedPet.type) {
            setPet(updatedPet)
          }
        } catch (err) {
          console.error('Failed to parse pet state from localStorage')
        }
      } else if (e.key === 'paw_train_all_posts') {
        const newCount = getMyPostCount()
        setPostCount(newCount)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [setPet, showUpload])

  useEffect(() => {
    const savedPet = localStorage.getItem('paw_train_pet_state')
    if (savedPet) {
      try {
        const parsedPet = JSON.parse(savedPet)
        if (parsedPet.type && (!pet || parsedPet.type !== pet.type)) {
          setPet(parsedPet)
        }
      } catch (err) {
        console.error('Failed to parse saved pet')
      }
    }
    
    if (localStorage.getItem('token')) {
      fetchPet()
    }
    
    const count = getMyPostCount()
    setPostCount(count)
    setPreviousPostCount(count)
  }, [pet?.type, setPet, fetchPet])

  useEffect(() => {
    if (postCount === 0 && previousPostCount > 0) {
      setIsResetting(true)
      setTimeout(() => setIsResetting(false), 3000)
    }
    setPreviousPostCount(postCount)
  }, [postCount, previousPostCount])

  useEffect(() => {
    const timer = setInterval(() => {
      setCooldowns(prev => ({
        pet: Math.max(0, prev.pet - 1),
        feed: Math.max(0, prev.feed - 1),
        play: Math.max(0, prev.play - 1),
        walk: Math.max(0, prev.walk - 1)
      }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const expressions = {
    happy: ['😊', '😄', '🥰', '😆'],
    excited: ['😆', '🤩', '🎉', '🌟'],
    playful: ['😜', '🐾', '✨', '😝'],
    gentle: ['😌', '💕', '🌸', '💫'],
    thinking: ['🤔', '💭', '❓', '🧐'],
    tsundere: ['😤', '🙄', '😒', '😝'],
    sleepy: ['😴', '🥱', '😪', '💤'],
    hungry: ['😋', '🤤', '🍖', '🐟'],
    sad: ['😢', '🥺', '😿', '💧'],
    calm: ['😌', '😇', '🌟', '💫']
  }

  const sounds = {
    cat: ['喵~', '喵喵~', '喵呜~', '咕噜咕噜~', '嘶~', '喵嗷~', '咪~'],
    dog: ['汪汪汪！', '汪！', '汪汪！', '呜~', '嗷呜~', '汪汪汪！', '旺~'],
    rabbit: ['吱吱~', '咕噜~', '噗噗~', '蹦~'],
    bird: ['啾啾~', '叽叽喳喳~', '咕咕~', '唱歌~'],
    fish: ['咕嘟~', '泡泡~', '啵啵~'],
    hamster: ['吱吱~', '啾啾~', '噗噗~'],
    turtle: ['爬爬~', '慢慢~', '扑通~'],
    lizard: ['嘶~', '爬爬~', '眨眨~'],
    snake: ['嘶~', '沙沙~', '滑滑~'],
    guinea_pig: ['吱吱~', '咕噜~', '哼哼~'],
    ferret: ['叽叽~', '嘶嘶~', '啾啾~'],
    hedgehog: ['噗噗~', '哼哼~', '缩成球~'],
    chinchilla: ['吱吱~', '啾啾~', '噗噗~'],
    frog: ['呱呱~', '咕呱~', '扑通~'],
    crab: ['咔哒~', '爬爬~', '钳子~'],
    tarantula: ['爬~', '静静~', '织网~'],
    scorpion: ['咔哒~', '爬~', '尾巴~'],
    parrot: ['你好~', '模仿~', '喳喳~'],
    goldfish: ['泡泡~', '游游~', '闪闪~'],
    axolotl: ['游游~', '萌萌~', '摇摇~'],
    gecko: ['爬爬~', '舔舔~', '眨眨~']
  }

  const getPetSound = (petType) => {
    const typeSounds = sounds[petType] || sounds.cat
    return typeSounds[Math.floor(Math.random() * typeSounds.length)]
  }

  const playAnimation = (animationType) => {
    setCurrentAnimation(animationType)
    setTimeout(() => setCurrentAnimation(null), 2000)
  }

  const showInteraction = (message, sound, animation) => {
    setInteractionMessage(message)
    setPetSound(sound)
    setShowSound(true)
    if (animation) {
      playAnimation(animation)
    }
    setTimeout(() => {
      setInteractionMessage(null)
      setPetSound(null)
      setShowSound(false)
    }, 3000)
  }

  const handlePet = async () => {
    if (cooldowns.pet > 0) return
    
    const newIntimacy = Math.min(100, (pet.intimacy || 50) + 1)
    const newJoy = Math.min(100, (pet.joy || 50) + 5)
    updatePetStats({ intimacy: newIntimacy, joy: newJoy })

    try {
      const res = await petAPI.interact('pet')
      if (res.data.success) {
        updatePetStats(res.data.pet)
        if (res.data.message) {
          showInteraction(res.data.message, res.data.sound, res.data.animation?.animation)
        }
        if (res.data.cooldown) {
          setCooldowns(prev => ({ ...prev, pet: res.data.cooldown }))
        }
      }
    } catch (err) {
      showInteraction(t('home.petting'), getPetSound(pet.type), 'rub')
      setCooldowns(prev => ({ ...prev, pet: 10 }))
    }
  }

  const handleFeed = async () => {
    if (cooldowns.feed > 0) return
    
    const newHunger = Math.min(100, (pet.hunger || 50) + 10)
    const newJoy = Math.min(100, (pet.joy || 50) + 3)
    updatePetStats({ hunger: newHunger, joy: newJoy })

    try {
      const res = await petAPI.interact('feed')
      if (res.data.success) {
        updatePetStats(res.data.pet)
        if (res.data.message) {
          showInteraction(res.data.message, res.data.sound, res.data.animation?.animation)
        }
        if (res.data.cooldown) {
          setCooldowns(prev => ({ ...prev, feed: res.data.cooldown }))
        }
      }
    } catch (err) {
      showInteraction(t('home.feeding'), getPetSound(pet.type), 'squint')
      setCooldowns(prev => ({ ...prev, feed: 30 * 60 }))
    }
  }

  const handlePlay = async () => {
    if (cooldowns.play > 0) return
    if ((pet.energy || 50) < 5) {
      showInteraction(t('home.tired'), getPetSound(pet.type), 'yawn')
      return
    }
    
    const newEnergy = Math.max(0, (pet.energy || 50) - 5)
    const newJoy = Math.min(100, (pet.joy || 50) + 8)
    updatePetStats({ energy: newEnergy, joy: newJoy })

    try {
      const res = await petAPI.interact('play')
      if (res.data.success) {
        updatePetStats(res.data.pet)
        if (res.data.message) {
          showInteraction(res.data.message, res.data.sound, res.data.animation?.animation)
        }
        if (res.data.cooldown) {
          setCooldowns(prev => ({ ...prev, play: res.data.cooldown }))
        }
      } else if (res.data.error) {
        showInteraction(res.data.error, getPetSound(pet.type), 'yawn')
      }
    } catch (err) {
      showInteraction(t('home.playing'), getPetSound(pet.type), 'spin')
      setCooldowns(prev => ({ ...prev, play: 5 * 60 }))
    }
  }

  const handleWalk = async () => {
    if (cooldowns.walk > 0) return
    
    const newHealth = Math.min(100, (pet.health || 100) + 3)
    const newExploration = Math.min(100, (pet.exploration || 0) + 1)
    const newJoy = Math.min(100, (pet.joy || 50) + 5)
    const newEnergy = Math.max(0, (pet.energy || 50) - 10)
    updatePetStats({ health: newHealth, exploration: newExploration, joy: newJoy, energy: newEnergy })

    try {
      const res = await petAPI.interact('walk')
      if (res.data.success) {
        updatePetStats(res.data.pet)
        if (res.data.message) {
          showInteraction(res.data.message, res.data.sound, res.data.animation?.animation)
        }
        setCooldowns(prev => ({ ...prev, walk: 24 * 60 * 60 }))
      } else if (res.data.error) {
        showInteraction(res.data.error, getPetSound(pet.type), null)
      }
    } catch (err) {
      showInteraction(t('home.walking'), getPetSound(pet.type), 'run')
      setCooldowns(prev => ({ ...prev, walk: 24 * 60 * 60 }))
    }
  }

  const handlePlayVoice = () => {
    if (!pet.voice || isPlayingVoice) return
    
    setIsPlayingVoice(true)
    const audio = new Audio(pet.voice)
    audio.onended = () => {
      setIsPlayingVoice(false)
    }
    audio.onerror = () => {
      setIsPlayingVoice(false)
      showInteraction('音频播放失败', getPetSound(pet.type), null)
    }
    audio.play()
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputText.trim()) return
    
    const userMsg = { role: 'user', content: inputText, time: new Date().toLocaleTimeString() }
    setMessages(prev => [...prev, userMsg])
    setInputText('')
    setIsLoading(true)

    try {
      const res = await chatAPI.sendMessage(inputText)
      
      if (!res.data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `提示: ${res.data.error}`,
          action: '',
          time: new Date().toLocaleTimeString()
        }])
        setIsLoading(false)
        return
      }

      const replyMsg = {
        role: 'assistant',
        content: res.data.response,
        action: res.data.action,
        emotion: res.data.emotion,
        time: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, replyMsg])
      setDailyChatCount(res.data.dailyChatCount || dailyChatCount + 1)
      setRemainingChats(res.data.remainingChats || Math.max(0, remainingChats - 1))

      const expressionType = res.data.emotion || 'happy'
      const expressionList = expressions[expressionType] || expressions.happy
      const randomExpression = expressionList[Math.floor(Math.random() * expressionList.length)]
      
      setPetExpression(randomExpression)
      setPetSound(res.data.sound || getPetSound(pet.type))
      setShowSound(true)

      if (res.data.animation) {
        playAnimation(res.data.animation.animation)
      }

      setTimeout(() => {
        setPetExpression(null)
        setPetSound(null)
        setShowSound(false)
      }, 5000)

    } catch (err) {
      const personality = pet.personality || 'gentle'
      const mockReplies = {
        active: ['汪汪汪！', '陪我玩！', '好开心！'],
        tsundere: ['哼！', '才不是呢！', '...'],
        gentle: ['喵~', '主人好~', '咕噜咕噜'],
        mischievous: ['嘿嘿~', '来抓我呀！', '这个归我了！'],
        lazy: ['zzz...', '好累啊...', '不想动...'],
        curious: ['这是什么？', '让我看看！', '外面有声音！']
      }
      const replies = mockReplies[personality] || mockReplies.gentle
      const randomReply = replies[Math.floor(Math.random() * replies.length)]
      
      const replyMsg = {
        role: 'assistant',
        content: randomReply,
        action: '摇尾巴',
        emotion: 'happy',
        time: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, replyMsg])

      const expressionType = personality === 'tsundere' ? 'tsundere' : personality === 'gentle' ? 'gentle' : 'happy'
      const expressionList = expressions[expressionType] || expressions.happy
      const randomExpression = expressionList[Math.floor(Math.random() * expressionList.length)]
      const randomSound = getPetSound(pet.type)
      
      setPetExpression(randomExpression)
      setPetSound(randomSound)
      setShowSound(true)

      setTimeout(() => {
        setPetExpression(null)
        setPetSound(null)
        setShowSound(false)
      }, 5000)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCooldown = (seconds) => {
    if (seconds < 60) return `${seconds}秒`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}分钟`
    const hours = Math.floor(minutes / 60)
    return `${hours}小时`
  }

  const stageInfo = getStageName(pet.level || 1)

  return (
    <div className="h-screen gradient-bg overflow-y-auto">
      <audio ref={audioRef} />
      
      <div className="p-4 glass-effect border-b border-cyber-blue/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${stageInfo.color} flex items-center justify-center text-2xl shadow-lg`}>
              {getPetEmoji(pet.type)}
            </div>
            <div>
              <div className="font-bold neon-text">{pet.name}</div>
              <div className="text-sm text-cyber-blue flex items-center gap-2">
                <span>Lv.{pet.level}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs bg-gradient-to-r ${stageInfo.color} text-white`}>
                  {stageInfo.name}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-cyber-dark/80 px-4 py-2 rounded-full border border-cyber-blue/50">
            <span className="text-cyber-yellow">⭐</span>
            <span className="font-bold text-cyber-yellow">{pet.points || 0}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-5 gap-2 mb-4">
          <div className="glass-effect rounded-2xl p-2 text-center border border-cyber-pink/30">
            <div className="text-2xl mb-1">💖</div>
            <div className="text-sm text-cyber-pink/70">{t('home.intimacy')}</div>
            <div className="font-bold text-cyber-pink neon-text-pink">{pet.intimacy || 0}%</div>
          </div>
          <div className="glass-effect rounded-2xl p-2 text-center border border-cyber-orange/30">
            <div className="text-2xl mb-1">🍖</div>
            <div className="text-sm text-cyber-orange/70">{t('home.hunger')}</div>
            <div className="font-bold text-cyber-orange">{pet.hunger || 0}%</div>
          </div>
          <div className="glass-effect rounded-2xl p-2 text-center border border-cyber-purple/30">
            <div className="text-2xl mb-1">✨</div>
            <div className="text-sm text-cyber-purple/70">{t('home.exp')}</div>
            <div className="font-bold text-cyber-purple">{pet.exp || 0}/{pet.expToNext || 200}</div>
          </div>
          <div className="glass-effect rounded-2xl p-2 text-center border border-cyber-yellow/30">
            <div className="text-2xl mb-1">⚡</div>
            <div className="text-sm text-cyber-yellow/70">{t('home.energy')}</div>
            <div className="font-bold text-cyber-yellow">{pet.energy || 0}%</div>
          </div>
          <div className="glass-effect rounded-2xl p-2 text-center border border-cyber-green/30">
            <div className="text-2xl mb-1">😊</div>
            <div className="text-sm text-cyber-green/70">{t('home.joy')}</div>
            <div className="font-bold text-cyber-green">{pet.joy || 0}%</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="glass-effect rounded-xl p-2 text-center border border-neon-blue/30">
            <div className="text-xl mb-1">📚</div>
            <div className="text-xs text-neon-blue/70">{t('home.discipline')}</div>
            <div className="font-bold text-neon-blue text-sm">{pet.discipline || 0}%</div>
          </div>
          <div className="glass-effect rounded-xl p-2 text-center border border-emerald-500/30">
            <div className="text-xl mb-1">❤️</div>
            <div className="text-xs text-emerald-500/70">{t('home.health')}</div>
            <div className="font-bold text-emerald-500 text-sm">{pet.health || 100}%</div>
          </div>
          <div className="glass-effect rounded-xl p-2 text-center border border-amber-500/30">
            <div className="text-xl mb-1">🗺️</div>
            <div className="text-xs text-amber-500/70">{t('home.exploration')}</div>
            <div className="font-bold text-amber-500 text-sm">{pet.exploration || 0}%</div>
          </div>
        </div>

        <div className="glass-effect rounded-3xl p-4 mb-4 warm-shadow overflow-hidden border border-cyber-blue/30" style={{ height: '350px', position: 'relative' }}>
          <Pet3D petType={pet.type} onPet={handlePet} postCount={postCount} isResetting={isResetting} />

          <AnimatePresence>
            {petExpression && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                className="absolute top-4 right-4 z-[70]"
              >
                <div className="bg-cyber-dark/90 rounded-full px-4 py-2 shadow-lg shadow-cyber-pink/50 border border-cyber-pink/50 flex items-center gap-2">
                  <span className="text-3xl">{petExpression}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showSound && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.5, x: 20 }}
                className="absolute bottom-4 left-4 z-[70]"
              >
                <div className="bg-gradient-to-r from-cyber-dark to-cyber-blue/50 rounded-2xl px-5 py-3 shadow-xl shadow-cyber-blue/80 border border-cyber-blue animate-pulse">
                  <span className="text-cyan-300 font-bold text-xl">{petSound}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {interactionMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70]"
              >
                <div className="bg-black/70 backdrop-blur-sm rounded-xl px-6 py-3 text-white font-medium text-lg shadow-2xl border border-white/20">
                  {interactionMessage}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePet}
            disabled={cooldowns.pet > 0}
            className={`py-4 rounded-xl font-bold flex flex-col items-center gap-1 transition-all ${
              cooldowns.pet > 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyber-pink to-cyber-purple text-white shadow-lg shadow-cyber-pink/50'
            }`}
          >
            <span className="text-3xl">🫶</span>
            <span className="text-sm">{t('home.pet')}</span>
            {cooldowns.pet > 0 && (
              <span className="text-xs text-cyber-yellow">{formatCooldown(cooldowns.pet)}</span>
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleFeed}
            disabled={cooldowns.feed > 0}
            className={`py-4 rounded-xl font-bold flex flex-col items-center gap-1 transition-all ${
              cooldowns.feed > 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyber-orange to-cyber-yellow text-cyber-dark shadow-lg shadow-cyber-orange/50'
            }`}
          >
            <span className="text-3xl">🍖</span>
            <span className="text-sm">{t('home.feed')}</span>
            {cooldowns.feed > 0 && (
              <span className="text-xs text-cyber-yellow">{formatCooldown(cooldowns.feed)}</span>
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlay}
            disabled={cooldowns.play > 0 || (pet.energy || 50) < 5}
            className={`py-4 rounded-xl font-bold flex flex-col items-center gap-1 transition-all ${
              cooldowns.play > 0 || (pet.energy || 50) < 5
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyber-green to-emerald-500 text-white shadow-lg shadow-cyber-green/50'
            }`}
          >
            <span className="text-3xl">🎾</span>
            <span className="text-sm">{t('home.play')}</span>
            {cooldowns.play > 0 && (
              <span className="text-xs text-cyber-yellow">{formatCooldown(cooldowns.play)}</span>
            )}
            {!cooldowns.play && (pet.energy || 50) < 5 && (
              <span className="text-xs text-red-400">累了</span>
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayVoice}
            disabled={!pet.voice || isPlayingVoice}
            className={`py-4 rounded-xl font-bold flex flex-col items-center gap-1 transition-all ${
              !pet.voice || isPlayingVoice
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50'
            }`}
          >
            <span className="text-3xl">🔊</span>
            <span className="text-sm">{t('home.voice')}</span>
            {isPlayingVoice && (
              <span className="text-xs text-cyber-yellow">播放中...</span>
            )}
            {!pet.voice && (
              <span className="text-xs text-gray-400">上传后可用</span>
            )}
          </motion.button>
        </div>

        {learnedSkills.length > 0 && (
          <div className="mb-4">
            <div className="text-sm text-cyber-blue/70 mb-2">🎪 {t('home.skills')}</div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {learnedSkills.map((skill, idx) => (
                <motion.button
                  key={skill.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => performSkill(skill)}
                  className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                    activeSkill?.id === skill.id
                      ? 'bg-gradient-to-r from-cyber-pink to-cyber-purple text-white shadow-lg shadow-cyber-pink/50'
                      : 'glass-effect text-cyber-blue border border-cyber-blue/30 hover:border-cyber-pink/50'
                  }`}
                >
                  {skill.name}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-full py-4 glass-effect rounded-2xl font-bold text-cyber-blue flex items-center justify-center gap-2 border border-cyber-blue/50 hover:shadow-lg hover:shadow-cyber-blue/30 mb-4"
        >
          💬 {isChatOpen ? t('home.closeChat') : t('home.chat')}
          {!isChatOpen && (
            <span className="text-xs bg-cyber-yellow/20 text-cyber-yellow px-2 py-1 rounded-full">
              {remainingChats}{t('home.freeChat')}
            </span>
          )}
        </motion.button>

        <PetTasks />
      </div>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="fixed bottom-20 left-0 right-0 glass-effect border-t border-cyber-blue/50 z-[60]"
          >
            <div className="w-full p-4" style={{ height: '280px' }}>
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-cyber-blue font-medium">{t('home.chat')} {pet.name}</span>
                  <span className="text-xs text-gray-400">
                    {t('home.remainingChats')} <span className="text-cyber-yellow font-bold">{remainingChats}</span> {t('home.freeChat')}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl p-3 ${msg.role === 'user' ? 'bg-gradient-to-r from-cyber-blue to-cyber-purple text-cyber-dark rounded-tr-sm' : 'bg-cyber-dark/80 text-cyber-blue rounded-tl-sm border border-cyber-blue/30'}`}>
                        <div>{msg.content}</div>
                        {msg.action && <div className="text-xs opacity-70 mt-1">*{msg.action}*</div>}
                        <div className="text-xs opacity-50 mt-1 text-right">{msg.time}</div>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-cyber-dark/80 rounded-2xl rounded-tl-sm p-3 border border-cyber-blue/30">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-cyber-blue rounded-full animate-bounce shadow-lg shadow-cyber-blue/50" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-cyber-blue rounded-full animate-bounce shadow-lg shadow-cyber-blue/50" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-cyber-blue rounded-full animate-bounce shadow-lg shadow-cyber-blue/50" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="flex gap-2 mt-3">
                  <input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={t('home.typeSomething')}
                    className="flex-1 px-4 py-3 rounded-xl bg-cyber-dark/80 border border-cyber-blue/50 text-cyber-blue focus:border-cyber-blue focus:ring-2 focus:ring-cyber-blue/20 outline-none placeholder:text-cyber-blue/50"
                  />
                  <button type="submit" className="px-6 py-3 bg-gradient-to-r from-cyber-blue to-cyber-purple text-cyber-dark rounded-xl font-medium hover:shadow-lg hover:shadow-cyber-blue/50">
                    {t('home.send')}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 pb-24">
      </div>
    </div>
  )
}

export default Home