import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import { t } from '../utils/i18n'

const quickTags = ['post.happy', 'post.active', 'post.quiet', 'post.greedy', 'post.cute', 'post.naughty', 'post.good', 'post.sleepy']

const STORAGE_KEY = 'paw_train_all_posts'

const getPetName = (petType) => {
  const petNames = {
    dog: '小黄狗',
    cat: '小橘猫',
    rabbit: '小兔兔',
    bird: '小鹦鹉',
    fish: '小金鱼',
    hamster: '小仓鼠',
    turtle: '小乌龟',
    guinea_pig: '小豚鼠',
  }
  return petNames[petType] || '小宠物'
}

const PostUploadModal = ({ isOpen, onClose }) => {
  const [description, setDescription] = useState('')
  const setPet = useStore(state => state.setPet)
  const updatePetPersonality = useStore(state => state.updatePetPersonality)

  const handleTagClick = useCallback((tag) => {
    setDescription(prev => prev ? `${prev} ${tag}` : tag)
  }, [])

  const handleChange = useCallback((e) => {
    setDescription(e.target.value)
  }, [])

  const handleSubmit = useCallback(() => {
    const savedPosts = localStorage.getItem(STORAGE_KEY)
    const existingPosts = savedPosts ? JSON.parse(savedPosts) : []
    
    const newPost = {
      id: Date.now(),
      user: { name: '🐾 我的宠物', avatar: '🐾' },
      media: '🐾',
      content: description || '分享我的宠物～',
      likes: 0,
      comments: 0,
      shares: 0,
      time: '刚刚',
      features: {
        petType: 'cat',
        breed: '橘猫',
        color: '橙色',
        expression: '开心',
        emotion: 'positive',
        personalityBoost: { energy: 5, affection: 5, joy: 5, hunger: 5, discipline: 5 },
      },
      vectorId: `vec_${Date.now()}`,
      isMine: true,
      analysisSource: 'manual',
      confidence: 0.95,
    }

    const updatedPosts = [newPost, ...existingPosts]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts))

    const currentPet = JSON.parse(localStorage.getItem('paw_train_pet_state')) || {
      type: 'cat',
      name: '小橘猫',
      energy: 50,
      affection: 50,
      joy: 50,
      hunger: 70,
      discipline: 50,
      exp: 0,
      points: 0,
      level: 1,
      expToNext: 200,
      intimacy: 50,
      personality: 'gentle',
      stage: 'pixel'
    }

    const updatedPet = {
      ...currentPet,
      exp: currentPet.exp + 10,
      points: currentPet.points + 5,
      joy: Math.min(100, Math.max(0, currentPet.joy + 5))
    }

    if (updatedPet.exp >= updatedPet.expToNext) {
      updatedPet.level = updatedPet.level + 1
      updatedPet.exp = updatedPet.exp - updatedPet.expToNext
      updatedPet.expToNext = updatedPet.expToNext * 1.2
    }

    localStorage.setItem('paw_train_pet_state', JSON.stringify(updatedPet))
    setPet(updatedPet)
    updatePetPersonality({ energy: 5, affection: 5, joy: 5, hunger: 5, discipline: 5 })

    setDescription('')
    onClose()
  }, [description, setPet, updatePetPersonality, onClose])

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg bg-gray-800 rounded-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white text-xl font-bold">📝 {t('post.describePet')}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 text-2xl hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        <textarea
          value={description}
          onChange={handleChange}
          placeholder={t('post.placeholder')}
          className="w-full h-40 bg-gray-700 text-white rounded-2xl p-4 resize-none outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500"
          autoComplete="off"
          spellCheck="false"
        />

        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-gray-400 text-sm">{t('post.quickTags')}</span>
          {quickTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(t(tag))}
              className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              {t(tag)}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full mt-6 py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-xl font-bold hover:from-green-500 hover:to-emerald-600 transition-all"
        >
          ✨ {t('post.publish')}
        </button>
      </motion.div>
    </motion.div>
  )
}

export default PostUploadModal