import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { t } from '../utils/i18n'

const FriendCard = ({ friend, onViewPet, onCoCare }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-3xl">
          {friend.avatar || '🐾'}
        </div>
        <div className="flex-1">
          <div className="font-bold text-gray-800">{friend.nickname}</div>
          <div className="text-sm text-gray-500">Lv.{friend.level || 1}</div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">
              {friend.petCount || 1}{t('social.pets')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onViewPet && onViewPet(friend)}
          className="flex-1 py-2 bg-orange-100 text-orange-600 rounded-xl text-sm font-medium"
        >
          👀 {t('social.viewPet')}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onCoCare && onCoCare(friend)}
          className="flex-1 py-2 gradient-bg text-white rounded-xl text-sm font-medium"
        >
          🤝 {t('social.coop')}
        </motion.button>
      </div>
    </motion.div>
  )
}

const CoCareModal = ({ isOpen, onClose, friend, onStartCoCare }) => {
  const [selectedPet, setSelectedPet] = useState(null)
  const [step, setStep] = useState(1)

  const myPets = [
    { id: 1, name: '小橘猫', type: 'cat', level: 5 },
    { id: 2, name: '小白', type: 'dog', level: 3 }
  ]

  const handleStart = () => {
    if (selectedPet) {
      onStartCoCare && onStartCoCare(selectedPet)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
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
          className="bg-white rounded-3xl max-w-md w-full overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="gradient-bg p-6 text-white">
            <h2 className="text-2xl font-bold mb-1">🤝 {t('social.coopPet')}</h2>
            <p className="text-white/80">{t('social.coopWithFriend')}</p>
          </div>

          <div className="p-6">
            {step === 1 && (
              <>
                <div className="text-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 mx-auto flex items-center justify-center text-5xl mb-3">
                    {friend?.avatar || '🐾'}
                  </div>
                  <div className="font-bold text-xl">{friend?.nickname}</div>
                  <div className="text-gray-500 text-sm mt-1">
                    {friend?.petCount || 1} 只宠物 · Lv.{friend?.level || 1}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <h3 className="font-bold text-gray-800 mb-3">{t('social.coopGuide')}</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      {t('social.coopBenefit1')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      {t('social.coopBenefit2')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      {t('social.coopBenefit3')}
                    </li>
                  </ul>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(2)}
                  className="w-full py-4 gradient-bg text-white rounded-2xl font-bold text-lg"
                >
                  {t('social.selectMyPet')}
                </motion.button>
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="font-bold text-gray-800 mb-4">{t('social.selectCoopPet')}</h3>

                <div className="space-y-3 mb-6">
                  {myPets.map(pet => (
                    <motion.div
                      key={pet.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedPet(pet)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        selectedPet?.id === pet.id
                          ? 'border-orange-400 bg-orange-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-300 to-orange-400 flex items-center justify-center text-2xl">
                          {pet.type === 'cat' ? '🐱' : pet.type === 'dog' ? '🐶' : '🐰'}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-800">{pet.name}</div>
                          <div className="text-sm text-gray-500">Lv.{pet.level}</div>
                        </div>
                        {selectedPet?.id === pet.id && (
                          <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center text-white text-sm">
                            ✓
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold"
                  >
                    {t('common.back')}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStart}
                    disabled={!selectedPet}
                    className={`flex-1 py-4 rounded-2xl font-bold text-lg ${
                      selectedPet
                        ? 'gradient-bg text-white'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {t('social.startCoop')}
                  </motion.button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const EventCard = ({ event, onRegister }) => {
  const isOnline = event.event_type === 'online'
  const isFull = event.current_participants >= event.max_participants
  const daysUntil = Math.ceil((new Date(event.event_date) - new Date()) / (1000 * 60 * 60 * 24))

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
    >
      <div className="h-32 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-6xl relative">
        {event.cover_image_url || (isOnline ? '🏆' : '☕')}
        <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 rounded-full text-xs font-bold">
          {isOnline ? t('social.online') : t('social.offline')}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-gray-800 mb-1">{event.title}</h3>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{event.description}</p>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <span>📅</span>
            <span>{daysUntil > 0 ? `${daysUntil}${t('social.daysLater')}` : t('social.today')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>👥</span>
            <span>{event.current_participants}/{event.max_participants}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🎁</span>
            <span className="text-orange-500">+{event.reward_points}{t('shop.points')}</span>
          </div>
        </div>

        {!isOnline && event.location && (
          <div className="text-sm text-gray-500 mb-4 flex items-center gap-1">
            <span>📍</span>
            <span className="line-clamp-1">{event.location}</span>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => !isFull && onRegister && onRegister(event)}
          disabled={isFull}
          className={`w-full py-3 rounded-xl font-bold text-sm ${
            isFull
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'gradient-bg text-white'
          }`}
        >
          {isFull ? t('social.full') : t('social.registerNow')}
        </motion.button>
      </div>
    </motion.div>
  )
}

const SocialStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <div className="bg-white rounded-xl p-3 text-center shadow-sm">
        <div className="text-2xl font-bold text-orange-500">{stats.friends}</div>
        <div className="text-xs text-gray-500">{t('social.friends')}</div>
      </div>
      <div className="bg-white rounded-xl p-3 text-center shadow-sm">
        <div className="text-2xl font-bold text-purple-500">{stats.coCares}</div>
        <div className="text-xs text-gray-500">{t('social.coopOngoing')}</div>
      </div>
      <div className="bg-white rounded-xl p-3 text-center shadow-sm">
        <div className="text-2xl font-bold text-green-500">{stats.events}</div>
        <div className="text-xs text-gray-500">{t('social.participated')}</div>
      </div>
    </div>
  )
}

export { FriendCard, CoCareModal, EventCard, SocialStats }
