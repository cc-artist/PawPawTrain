import React from 'react'
import { motion } from 'framer-motion'
import { t } from '../utils/i18n'

const PersonalityBar = ({ label, value, maxValue = 100, icon, color }) => {
  const percentage = (value / maxValue) * 100

  const getColor = (val) => {
    if (val >= 80) return 'bg-green-500'
    if (val >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-medium text-gray-600">{label}</span>
        </div>
        <span className="text-sm font-bold" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${getColor(value)}`}
        />
      </div>
    </div>
  )
}

const PetStatusPanel = ({ pet }) => {
  return (
    <div className="space-y-4">
      <PersonalityBar
        label={t('home.intimacy')}
        value={pet.affection || 50}
        icon="💖"
        color="#EC4899"
      />
      <PersonalityBar
        label={t('home.hunger')}
        value={pet.hunger || 50}
        icon="🍖"
        color="#F59E0B"
      />
      <PersonalityBar
        label={t('home.energy')}
        value={pet.energy || 50}
        icon="⚡"
        color="#10B981"
      />
      <PersonalityBar
        label={t('home.joy')}
        value={pet.joy || 50}
        icon="😊"
        color="#8B5CF6"
      />
      <PersonalityBar
        label={t('home.discipline')}
        value={pet.discipline || 50}
        icon="📚"
        color="#3B82F6"
      />
    </div>
  )
}

const LevelProgress = ({ level, exp, expToNext }) => {
  const percentage = (exp / expToNext) * 100

  return (
    <div className="glass-effect rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold">
            {level}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">Lv.{level}</div>
            <div className="text-xs text-gray-400">{t('home.expToNext')} {expToNext - exp} {t('home.experience')}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-orange-500">{exp}</div>
          <div className="text-xs text-gray-400">/ {expToNext} {t('home.experience')}</div>
        </div>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full gradient-bg rounded-full relative"
        >
          <motion.div
            animate={{ x: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute right-0 top-0 w-3 h-3 bg-white rounded-full shadow-lg"
          />
        </motion.div>
      </div>
    </div>
  )
}

const InteractButton = ({ icon, label, onClick, disabled, boost }) => {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.9 }}
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1 p-4 rounded-2xl transition-all ${
        disabled
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-white hover:shadow-lg text-gray-700'
      }`}
    >
      <div className="text-3xl">{icon}</div>
      <div className="text-sm font-medium">{label}</div>
      {boost && (
        <div className="text-xs text-green-500">
          +{boost.exp} {t('home.experience')}
        </div>
      )}
    </motion.button>
  )
}

export { PersonalityBar, PetStatusPanel, LevelProgress, InteractButton }
