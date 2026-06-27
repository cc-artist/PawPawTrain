import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { petAPI } from '../services/api'
import { t } from '../utils/i18n'

const petTypes = [
  { id: 'cat', emoji: '🐱', color: 'from-amber-300 to-orange-400', label: 'adopt.cat' },
  { id: 'dog', emoji: '🐶', color: 'from-yellow-300 to-amber-400', label: 'adopt.dog' },
  { id: 'rabbit', emoji: '🐰', color: 'from-pink-300 to-rose-400', label: 'adopt.rabbit' },
]

const personalities = [
  { id: 'active', label: 'adopt.active', descLabel: 'adopt.activeDesc' },
  { id: 'tsundere', label: 'adopt.tsundere', descLabel: 'adopt.tsundereDesc' },
  { id: 'gentle', label: 'adopt.gentle', descLabel: 'adopt.gentleDesc' },
]

const Adopt = () => {
  const navigate = useNavigate()
  const [selectedPet, setSelectedPet] = useState(null)
  const [selectedPersonality, setSelectedPersonality] = useState(null)
  const [petName, setPetName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { setPet } = useStore()

  const handleAdopt = async () => {
    if (!selectedPet || !selectedPersonality || !petName.trim()) {
      alert('请完善信息')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('开始领养...')
      const res = await petAPI.adopt({
        petType: selectedPet.id,
        personality: selectedPersonality.id,
        name: petName.trim()
      })
      
      console.log('API响应:', res)
      
      const petData = res.data?.pet || res.data
      
      if (!petData) {
        throw new Error('宠物数据格式错误')
      }
      
      console.log('设置宠物:', petData)
      setPet(petData)
      
      console.log('跳转到首页')
      navigate('/', { replace: true })
      
    } catch (err) {
      console.error('领养错误:', err)
      setError(err.response?.data?.message || err.message || '领养失败，请重试')
      alert(err.response?.data?.message || '领养失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full gradient-bg">
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 pt-8"
        >
          <h1 className="text-3xl font-bold text-orange-600 mb-2">{t('adopt.title')}</h1>
          <p className="text-orange-500">{t('adopt.subtitle')}</p>
        </motion.div>

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6"
          >
            {error}
          </motion.div>
        )}

        <div className="glass-effect rounded-3xl p-6 warm-shadow mb-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">🐾 {t('adopt.selectPet')}</h2>
          <div className="grid grid-cols-3 gap-4">
            {petTypes.map((pet, idx) => (
              <motion.button
                key={pet.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedPet(pet)}
                className={`p-6 rounded-2xl transition-all ${selectedPet?.id === pet.id ? `bg-gradient-to-br ${pet.color} text-white scale-105 warm-shadow` : 'bg-white hover:bg-orange-50'}`}
              >
                <div className="text-5xl mb-2">{pet.emoji}</div>
                <div className={`font-medium ${selectedPet?.id === pet.id ? '' : 'text-gray-700'}`}>{t(pet.label)}</div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="glass-effect rounded-3xl p-6 warm-shadow mb-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">✨ {t('adopt.selectPersonality')}</h2>
          <div className="space-y-3">
            {personalities.map((p, idx) => (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                onClick={() => setSelectedPersonality(p)}
                className={`w-full p-4 rounded-2xl text-left transition-all ${selectedPersonality?.id === p.id ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white warm-shadow' : 'bg-white hover:bg-orange-50'}`}
              >
                <div className="font-bold text-lg">{t(p.label)}</div>
                <div className={`text-sm ${selectedPersonality?.id === p.id ? 'text-orange-100' : 'text-gray-500'}`}>{t(p.descLabel)}</div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="glass-effect rounded-3xl p-6 warm-shadow mb-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">📝 {t('adopt.enterName', '给它起个名字')}</h2>
          <input
            type="text"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            placeholder={t('adopt.petNamePlaceholder', '例如：小白、豆豆...')}
            className="w-full px-4 py-3 rounded-xl border border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
            maxLength={20}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAdopt}
          disabled={!selectedPet || !selectedPersonality || !petName.trim() || loading}
          className="w-full py-4 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold rounded-2xl text-lg warm-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('adopt.adopting') : `🎉 ${t('adopt.adopt')}`}
        </motion.button>
      </div>
    </div>
  )
}

export default Adopt
