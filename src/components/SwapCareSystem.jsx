import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { t } from '../utils/i18n'

const SWAP_TYPES = {
  temporary: {
    name: t('swapCare.temporary'),
    icon: '⏰',
    color: '#3B82F6',
    description: 'Short-term pet care exchange'
  },
  care: {
    name: t('swapCare.care'),
    icon: '🍖',
    color: '#F59E0B',
    description: 'Help feed and care for others\' pets'
  },
  vacation: {
    name: t('swapCare.vacation'),
    icon: '🏖️',
    color: '#10B981',
    description: 'Exchange pet care during travel'
  }
}

const SwapCard = ({ swap, onApply }) => {
  const swapType = SWAP_TYPES[swap.type] || SWAP_TYPES.temporary
  const isExpired = new Date(swap.endDate) < new Date()
  const isFull = swap.currentParticipants >= swap.maxParticipants

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
    >
      <div className="h-24 bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center relative">
        <div className="text-5xl">{swap.petAvatar || '🐾'}</div>
        <div
          className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: swapType.color }}
        >
          {swapType.icon} {swapType.name}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="font-bold text-gray-800">{swap.petName}</div>
          <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">
            Lv.{swap.petLevel}
          </span>
        </div>

        <div className="text-sm text-gray-500 mb-3">
          {t('swapCare.duration')}：{swap.duration}{t('swapCare.days')}
        </div>

        <div className="flex items-center justify-between text-sm mb-3">
          <div className="flex items-center gap-1">
            <span className="text-gray-400">💰</span>
            <span className="font-bold text-orange-500">{swap.price}</span>
            <span className="text-gray-400">{t('shop.points')}/{t('swapCare.days')}</span>
          </div>
          <div className="text-gray-400">
            {swap.currentParticipants}/{swap.maxParticipants}人
          </div>
        </div>

        <div className="text-xs text-gray-400 mb-3">
          Owner：{swap.ownerName}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => !isExpired && !isFull && onApply && onApply(swap)}
          disabled={isExpired || isFull}
          className={`w-full py-3 rounded-xl font-bold text-sm ${
            isExpired
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isFull
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'gradient-bg text-white'
          }`}
        >
          {isExpired ? 'Expired' : isFull ? 'Full' : t('swapCare.apply')}
        </motion.button>
      </div>
    </motion.div>
  )
}

const CreateSwapModal = ({ isOpen, onClose, onSubmit, userPets }) => {
  const [formData, setFormData] = useState({
    petId: '',
    type: 'temporary',
    duration: 3,
    price: 50,
    description: '',
    maxParticipants: 1,
    startDate: new Date().toISOString().split('T')[0],
    requirements: ''
  })

  const selectedPet = userPets.find(p => p.id === formData.petId)

  const handleSubmit = () => {
    if (!formData.petId) {
      alert(t('swapCare.selectPet'))
      return
    }
    if (formData.price < 10) {
      alert(t('swapCare.dailyPoints'))
      return
    }
    onSubmit && onSubmit(formData)
    onClose()
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
          className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="gradient-bg p-6 text-white flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">🔄 {t('swapCare.createSwap')}</h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-2xl"
              >
                ×
              </button>
            </div>
            <p className="text-white/80">{t('swapCare.postSwapInfo')}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('swapCare.selectPet')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {userPets.map(pet => (
                  <motion.div
                    key={pet.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFormData({ ...formData, petId: pet.id })}
                    className={`p-3 rounded-xl border-2 cursor-pointer text-center transition-all ${
                      formData.petId === pet.id
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="text-3xl mb-1">
                      {pet.type === 'cat' ? '🐱' : pet.type === 'dog' ? '🐶' : '🐰'}
                    </div>
                    <div className="text-xs font-medium text-gray-700">{pet.name}</div>
                    <div className="text-xs text-gray-400">Lv.{pet.level}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('swapCare.swapType')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(SWAP_TYPES).map(([key, config]) => (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFormData({ ...formData, type: key })}
                    className={`p-3 rounded-xl border-2 cursor-pointer text-center transition-all ${
                      formData.type === key
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="text-2xl mb-1">{config.icon}</div>
                    <div className="text-xs font-medium text-gray-700">{config.name}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('swapCare.duration')}
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.duration}
                  onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('swapCare.dailyPoints')}
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 10 })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('swapCare.startDate')}
              </label>
              <input
                type="date"
                value={formData.startDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('swapCare.description')}
              </label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('swapCare.description')}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('swapCare.swapPartnerReq')} ({t('common.optional')})
              </label>
              <textarea
                rows="2"
                value={formData.requirements}
                onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                placeholder={t('swapCare.swapPartnerReq')}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none resize-none"
              />
            </div>

            <div className="bg-orange-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{t('swapCare.estimatedIncome')}</span>
                <span className="text-2xl font-bold text-orange-500">
                  {formData.duration * formData.price}
                </span>
                <span className="text-sm text-gray-500">{t('shop.points')}</span>
              </div>
              <div className="text-xs text-gray-400">
                {formData.duration}{t('swapCare.days')} × {formData.price}{t('shop.points')}/{t('swapCare.days')}
              </div>
            </div>
          </div>

          <div className="p-6 pt-0 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              className="w-full py-4 gradient-bg text-white rounded-2xl font-bold text-lg"
            >
              {t('swapCare.postSwapInfo')}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const ApplySwapModal = ({ isOpen, onClose, swap, onConfirm, userPoints }) => {
  const [message, setMessage] = useState('')
  const [selectedDays, setSelectedDays] = useState(1)

  if (!isOpen || !swap) return null

  const totalCost = selectedDays * swap.price
  const canAfford = userPoints >= totalCost

  const handleApply = () => {
    if (!canAfford) {
      alert(t('swapCare.insufficientPoints'))
      return
    }
    onConfirm && onConfirm({ swapId: swap.id, days: selectedDays, message })
    onClose()
  }

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
            <h2 className="text-2xl font-bold mb-1">🔄 {t('swapCare.confirmApply')}</h2>
            <p className="text-white/80">{t('swapCare.confirmApply')}{swap.petName}</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="text-5xl">{swap.petAvatar || '🐾'}</div>
              <div className="flex-1">
                <div className="font-bold text-gray-800">{swap.petName}</div>
                <div className="text-sm text-gray-500">
                  {swap.duration}{t('swapCare.days')}{t('swapCare.duration')} · {swap.price}{t('shop.points')}/{t('swapCare.days')}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('swapCare.duration')} (1-{swap.duration}{t('swapCare.days')})
              </label>
              <input
                type="number"
                min="1"
                max={swap.duration}
                value={selectedDays}
                onChange={e => setSelectedDays(Math.min(swap.duration, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('swapCare.messageToOwner')}
              </label>
              <textarea
                rows="3"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t('swapCare.messageToOwner')}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none resize-none"
              />
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{t('swapCare.requiredPoints')}</span>
                <span className="text-2xl font-bold text-orange-500">{totalCost}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{t('shop.myPoints')}</span>
                <span className={canAfford ? 'text-green-500' : 'text-red-500'}>
                  {userPoints} {canAfford ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 pt-0">
            <motion.button
              whileHover={{ scale: canAfford ? 1.02 : 1 }}
              whileTap={{ scale: canAfford ? 0.98 : 1 }}
              onClick={handleApply}
              disabled={!canAfford}
              className={`w-full py-4 rounded-2xl font-bold text-lg ${
                canAfford
                  ? 'gradient-bg text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {canAfford ? `${t('swapCare.payPointsApply')} ${totalCost} ${t('shop.points')}` : t('swapCare.insufficientPoints')}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const SwapManagement = ({ swaps, onCancel, onComplete }) => {
  const mySwaps = swaps.filter(s => s.isOwner)
  const myApplications = swaps.filter(s => !s.isOwner && s.applied)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-gray-800 mb-3">🔄 {t('social.myPublish')}</h3>
        {mySwaps.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">🔄</div>
            <p>{t('social.noPublish')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mySwaps.map(swap => (
              <div key={swap.id} className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{swap.petAvatar}</span>
                    <div>
                      <div className="font-bold text-gray-800">{swap.petName}</div>
                      <div className="text-xs text-gray-400">
                        {swap.currentParticipants}/{swap.maxParticipants}{t('common.people')}{t('swapCare.apply')}
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    swap.status === 'active' ? 'bg-green-100 text-green-600' :
                    swap.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {swap.status === 'active' ? t('social.active') :
                     swap.status === 'pending' ? t('swapCare.pending') : t('social.ended')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 bg-blue-100 text-blue-600 rounded-lg text-sm font-medium">
                    {t('social.viewApplications')} ({swap.applicants?.length || 0})
                  </button>
                  {swap.status === 'active' && (
                    <button
                      onClick={() => onComplete && onComplete(swap.id)}
                      className="flex-1 py-2 bg-green-100 text-green-600 rounded-lg text-sm font-medium"
                    >
                      {t('social.confirmComplete')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-bold text-gray-800 mb-3">📋 {t('swapCare.myApplications')}</h3>
        {myApplications.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">📋</div>
            <p>{t('swapCare.noApplications')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myApplications.map(swap => (
              <div key={swap.id} className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{swap.petAvatar}</span>
                  <div className="flex-1">
                    <div className="font-bold text-gray-800">{swap.petName}</div>
                    <div className="text-xs text-gray-400">{t('swapCare.apply')}{swap.appliedDays}{t('swapCare.days')}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    swap.applicationStatus === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                    swap.applicationStatus === 'accepted' ? 'bg-green-100 text-green-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {swap.applicationStatus === 'pending' ? t('swapCare.pending') :
                     swap.applicationStatus === 'accepted' ? t('swapCare.approved') : t('swapCare.rejected')}
                  </div>
                </div>
                {swap.applicationStatus === 'accepted' && (
                  <div className="text-sm text-green-600 mb-2">
                    ✓ {t('swapCare.approved')}! {t('swapCare.startDate')}: {swap.startDate}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const CoopCard = ({ coop, onApply }) => {
  const isExpired = new Date(coop.endDate) < new Date()
  const isActive = coop.status === 'active'

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
    >
      <div className="h-24 bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center relative">
        <div className="text-5xl">{coop.petAvatar || '🐾'}</div>
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: isActive ? '#10B981' : '#F59E0B' }}
        >
          {isActive ? t('swapCare.alreadyCoop') : t('social.looking')}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="font-bold text-gray-800">{coop.petName}</div>
          <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-600 rounded-full">
            Lv.{coop.petLevel}
          </span>
        </div>

        <div className="text-sm text-gray-500 mb-3">
          {t('swapCare.coopPeriod')}: {coop.startDate} {t('common.to')} {coop.endDate}
        </div>

        <div className="flex items-center justify-between text-sm mb-3">
          <div className="flex items-center gap-1">
            <span className="text-gray-400">💰</span>
            <span className="font-bold text-pink-500">{coop.requiredPoints}</span>
            <span className="text-gray-400">{t('swapCare.requiredPoints')}</span>
          </div>
          <div className="text-gray-400">
            {coop.coOwnerName ? t('swapCare.hasPartner') : t('social.looking')}
          </div>
        </div>

        <div className="text-xs text-gray-400 mb-2">
          {t('swapCare.shareRatio')}: {coop.shareRatio}% / {100 - coop.shareRatio}%
        </div>

        <div className="text-xs text-gray-400 mb-3">
          {t('common.publisher')}: {coop.ownerName}
          {coop.coOwnerName && ` · ${t('swapCare.coopPartner')}: ${coop.coOwnerName}`}
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {coop.description}
        </p>

        {!isActive && !coop.isOwner && !coop.applied && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onApply && onApply(coop)}
            disabled={isExpired}
            className={`w-full py-3 rounded-xl font-bold text-sm ${
              isExpired
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'gradient-bg text-white'
            }`}
          >
            {isExpired ? t('common.expired') : t('feed.coop')}
          </motion.button>
        )}

        {coop.applied && (
          <div className="w-full py-3 bg-yellow-100 text-yellow-600 rounded-xl font-bold text-sm text-center">
            {t('swapCare.applying')}
          </div>
        )}

        {isActive && (
          <div className="w-full py-3 bg-green-100 text-green-600 rounded-xl font-bold text-sm text-center">
            {t('swapCare.coopOngoing')}
          </div>
        )}
      </div>
    </motion.div>
  )
}

const CreateCoopModal = ({ isOpen, onClose, onSubmit, userPets }) => {
  const [formData, setFormData] = useState({
    petId: '',
    shareRatio: 50,
    requiredPoints: 100,
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    requirements: ''
  })

  const selectedPet = userPets.find(p => p.id === formData.petId)

  const handleSubmit = () => {
    if (!formData.petId) {
      alert('请选择要合养的宠物')
      return
    }
    if (!formData.endDate) {
      alert('请选择结束日期')
      return
    }
    if (formData.requiredPoints < 10) {
      alert('积分要求不能少于10')
      return
    }
    onSubmit && onSubmit(formData)
    onClose()
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
          className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-pink-400 to-purple-400 p-6 text-white flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">🤝 创建合养</h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-2xl"
              >
                ×
              </button>
            </div>
            <p className="text-white/80">发布你的合养需求，找到合适的伙伴</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择要合养的宠物
              </label>
              <div className="grid grid-cols-3 gap-2">
                {userPets.map(pet => (
                  <motion.div
                    key={pet.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFormData({ ...formData, petId: pet.id })}
                    className={`p-3 rounded-xl border-2 cursor-pointer text-center transition-all ${
                      formData.petId === pet.id
                        ? 'border-pink-400 bg-pink-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="text-3xl mb-1">
                      {pet.type === 'cat' ? '🐱' : pet.type === 'dog' ? '🐶' : '🐰'}
                    </div>
                    <div className="text-xs font-medium text-gray-700">{pet.name}</div>
                    <div className="text-xs text-gray-400">Lv.{pet.level}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                分成比例 (%)
              </label>
                <input
                  type="number"
                  min="10"
                  max="90"
                  value={formData.shareRatio}
                  onChange={e => setFormData({ ...formData, shareRatio: parseInt(e.target.value) || 50 })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-pink-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                积分要求
              </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={formData.requiredPoints}
                  onChange={e => setFormData({ ...formData, requiredPoints: parseInt(e.target.value) || 100 })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-pink-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  开始日期
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-pink-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  结束日期
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  min={formData.startDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-pink-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                合养说明
              </label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="描述你的宠物习惯、合养安排..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-pink-400 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                对合养伙伴的要求（可选）
              </label>
              <textarea
                rows="2"
                value={formData.requirements}
                onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                placeholder="希望对方有养宠经验、住在附近等..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-pink-400 focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="p-6 pt-0 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              className="w-full py-4 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-2xl font-bold text-lg"
            >
              发布合养信息
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const ApplyCoopModal = ({ isOpen, onClose, coop, onConfirm, userPoints }) => {
  const [message, setMessage] = useState('')

  if (!isOpen || !coop) return null

  const canAfford = userPoints >= coop.requiredPoints

  const handleApply = () => {
    if (!canAfford) {
      alert('积分不足！')
      return
    }
    onConfirm && onConfirm({ coopId: coop.id, message })
    onClose()
  }

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
          <div className="bg-gradient-to-r from-pink-400 to-purple-400 p-6 text-white">
            <h2 className="text-2xl font-bold mb-1">🤝 申请合养</h2>
            <p className="text-white/80">申请与{coop.petName}合养</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="text-5xl">{coop.petAvatar || '🐾'}</div>
              <div className="flex-1">
                <div className="font-bold text-gray-800">{coop.petName}</div>
                <div className="text-sm text-gray-500">
                  {coop.startDate} 至 {coop.endDate}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                给对方留言
              </label>
              <textarea
                rows="3"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="介绍一下自己，为什么想合养这只宠物..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-pink-400 focus:outline-none resize-none"
              />
            </div>

            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">所需积分</span>
                <span className="text-2xl font-bold text-pink-500">{coop.requiredPoints}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">我的积分</span>
                <span className={canAfford ? 'text-green-500' : 'text-red-500'}>
                  {userPoints} {canAfford ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 pt-0">
            <motion.button
              whileHover={{ scale: canAfford ? 1.02 : 1 }}
              whileTap={{ scale: canAfford ? 0.98 : 1 }}
              onClick={handleApply}
              disabled={!canAfford}
              className={`w-full py-4 rounded-2xl font-bold text-lg ${
                canAfford
                  ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {canAfford ? '申请合养' : '积分不足'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export { SwapCard, CreateSwapModal, ApplySwapModal, SwapManagement, SWAP_TYPES, CoopCard, CreateCoopModal, ApplyCoopModal }
