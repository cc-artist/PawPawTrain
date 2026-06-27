import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { SwapCard, CreateSwapModal, ApplySwapModal, SwapManagement, CoopCard, CreateCoopModal, ApplyCoopModal } from '../components/SwapCareSystem'
import ChatRooms from '../components/ChatRoom'
import { t } from '../utils/i18n'

const mockFriends = [
  { id: 1, name: '小明', pet: '🐱', level: 12, isOnline: true },
  { id: 2, name: '花花', pet: '🐶', level: 8, isOnline: false },
  { id: 3, name: '阿杰', pet: '🐰', level: 15, isOnline: true },
]

const mockSwaps = [
  {
    id: 1,
    petName: '小橘猫',
    petAvatar: '🐱',
    petLevel: 8,
    ownerName: '小明',
    type: 'temporary',
    duration: 5,
    price: 50,
    currentParticipants: 2,
    maxParticipants: 3,
    startDate: '2026-05-10',
    endDate: '2026-05-15',
    description: '性格温顺，喜欢晒太阳',
    status: 'active',
    isOwner: false,
    applied: false,
    applicants: []
  },
  {
    id: 2,
    petName: '柯基',
    petAvatar: '🐶',
    petLevel: 12,
    ownerName: '阿杰',
    type: 'vacation',
    duration: 7,
    price: 80,
    currentParticipants: 1,
    maxParticipants: 2,
    startDate: '2026-05-20',
    endDate: '2026-05-27',
    description: '活泼好动，需要每天遛弯',
    status: 'active',
    isOwner: true,
    applied: true,
    appliedDays: 3,
    applicationStatus: 'pending',
    applicants: []
  },
  {
    id: 3,
    petName: '小白兔',
    petAvatar: '🐰',
    petLevel: 5,
    ownerName: '花花',
    type: 'care',
    duration: 3,
    price: 30,
    currentParticipants: 1,
    maxParticipants: 1,
    startDate: '2026-05-05',
    endDate: '2026-05-08',
    description: '需要帮忙喂食和打扫笼子',
    status: 'active',
    isOwner: false,
    applied: false,
    applicants: []
  }
]

const mockUserPets = [
  { id: 1, name: '小橘猫', type: 'cat', level: 5 },
  { id: 2, name: '小白', type: 'dog', level: 3 }
]

const mockCoops = [
  {
    id: 1,
    petName: '金毛犬',
    petAvatar: '🐕',
    petLevel: 10,
    ownerName: '阿强',
    coOwnerName: null,
    type: 'shared',
    shareRatio: 50,
    requiredPoints: 200,
    startDate: '2026-05-28',
    endDate: '2026-08-28',
    description: '寻找合养伙伴，共同照顾金毛犬，分享日常开支和时间',
    status: 'looking',
    isOwner: false,
    applied: false,
    applicants: []
  },
  {
    id: 2,
    petName: '布偶猫',
    petAvatar: '🐱',
    petLevel: 6,
    ownerName: '小美',
    coOwnerName: '小华',
    type: 'shared',
    shareRatio: 60,
    requiredPoints: 150,
    startDate: '2026-05-10',
    endDate: '2026-11-10',
    description: '已找到合养伙伴，共同照顾可爱的布偶猫',
    status: 'active',
    isOwner: true,
    applied: false,
    applicants: []
  },
  {
    id: 3,
    petName: '仓鼠',
    petAvatar: '🐹',
    petLevel: 3,
    ownerName: '小刚',
    coOwnerName: null,
    type: 'shared',
    shareRatio: 50,
    requiredPoints: 50,
    startDate: '2026-06-01',
    endDate: '2026-07-01',
    description: '寻找临时合养伙伴，暑假期间一起照顾仓鼠',
    status: 'looking',
    isOwner: false,
    applied: true,
    applicants: []
  }
]

const Social = () => {
  const [activeTab, setActiveTab] = useState('swap')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSwap, setSelectedSwap] = useState(null)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [showCreateCoopModal, setShowCreateCoopModal] = useState(false)
  const [selectedCoop, setSelectedCoop] = useState(null)
  const [showApplyCoopModal, setShowApplyCoopModal] = useState(false)

  const userPoints = 888

  const handleCreateSwap = (data) => {
    console.log('创建换养:', data)
    alert(t('social.swapSuccess'))
  }

  const handleApplySwap = (swap) => {
    setSelectedSwap(swap)
    setShowApplyModal(true)
  }

  const handleConfirmApply = (application) => {
    console.log('申请换养:', application)
    alert(t('social.applySuccess'))
  }

  const handleCreateCoop = (data) => {
    console.log('创建合养:', data)
    alert(t('social.coopSuccess'))
  }

  const handleApplyCoop = (coop) => {
    setSelectedCoop(coop)
    setShowApplyCoopModal(true)
  }

  const handleConfirmApplyCoop = (application) => {
    console.log('申请合养:', application)
    alert(t('social.coopApplySuccess'))
  }

  return (
    <div className="h-screen gradient-bg overflow-y-auto">
      <div>
        <div className="w-full">
          <div className="text-center mb-6 pt-4">
            <h1 className="text-2xl font-bold text-orange-600 mb-2">{t('social.title')}</h1>
            <p className="text-orange-500">{t('social.subtitle')}✨</p>
          </div>

          <div className="flex mb-6 glass-effect rounded-2xl p-4">
            <div className="grid grid-cols-3 gap-4 w-full">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{mockFriends.length}</div>
                <div className="text-gray-500 text-xs">{t('social.friends')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">3</div>
                <div className="text-gray-500 text-xs">{t('social.swap')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-500">2</div>
                <div className="text-gray-500 text-xs">{t('social.coop')}</div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('swap')}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${activeTab === 'swap' ? 'bg-orange-400 text-white' : 'glass-effect text-orange-500'}`}
            >
              🔄 {t('social.swap')}
            </button>
            <button
              onClick={() => setActiveTab('coop')}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${activeTab === 'coop' ? 'bg-pink-400 text-white' : 'glass-effect text-pink-500'}`}
            >
              🤝 {t('social.coop')}
            </button>
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${activeTab === 'friends' ? 'bg-orange-400 text-white' : 'glass-effect text-orange-500'}`}
            >
              👥 {t('social.friends')}
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${activeTab === 'events' ? 'bg-orange-400 text-white' : 'glass-effect text-orange-500'}`}
            >
              🎉 {t('social.events')}
            </button>
          </div>

          {activeTab === 'swap' && (
            <>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex-1 py-3 gradient-bg text-white rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <span>➕</span>
                  <span>{t('social.publishSwap')}</span>
                </button>
                <button
                  onClick={() => setActiveTab('my-swaps')}
                  className="py-3 px-4 glass-effect text-orange-500 rounded-xl font-medium"
                >
                  📋 {t('social.mySwaps')}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {mockSwaps.filter(s => !s.isOwner).map(swap => (
                  <SwapCard
                    key={swap.id}
                    swap={swap}
                    onApply={handleApplySwap}
                  />
                ))}
              </div>

              {mockSwaps.filter(s => !s.isOwner).length === 0 && (
                <div className="text-center py-12">
                        <div className="text-6xl mb-4">🔄</div>
                        <p className="text-orange-400">{t('social.noSwap')}</p>
                        <p className="text-sm text-gray-400 mt-2">{t('social.firstSwap')}</p>
                      </div>
              )}
            </>
          )}

          {activeTab === 'my-swaps' && (
            <SwapManagement
              swaps={mockSwaps}
              onCancel={(id) => console.log('取消换养:', id)}
              onComplete={(id) => console.log('完成换养:', id)}
            />
          )}

          {activeTab === 'coop' && (
            <>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setShowCreateCoopModal(true)}
                  className="flex-1 py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <span>➕</span>
                  <span>{t('social.publishCoop')}</span>
                </button>
                <button
                  onClick={() => setActiveTab('my-coops')}
                  className="py-3 px-4 glass-effect text-pink-500 rounded-xl font-medium"
                >
                  📋 {t('social.myCoops')}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {mockCoops.filter(c => c.status === 'looking').map(coop => (
                  <CoopCard
                    key={coop.id}
                    coop={coop}
                    onApply={handleApplyCoop}
                  />
                ))}
              </div>

              {mockCoops.filter(c => c.status === 'looking').length === 0 && (
                <div className="text-center py-12">
                        <div className="text-6xl mb-4">🤝</div>
                        <p className="text-pink-400">{t('social.noCoop')}</p>
                        <p className="text-sm text-gray-400 mt-2">{t('social.firstCoop')}</p>
                      </div>
              )}
            </>
          )}

          {activeTab === 'my-coops' && (
            <div className="space-y-6">
              <div>
              <h3 className="font-bold text-gray-800 mb-3">🤝 {t('social.myPublish')}</h3>
              {mockCoops.filter(c => c.isOwner).length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">🤝</div>
                  <p>{t('social.noPublish')}</p>
                </div>
                ) : (
                  <div className="space-y-3">
                    {mockCoops.filter(c => c.isOwner).map(coop => (
                      <div key={coop.id} className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{coop.petAvatar}</span>
                            <div>
                              <div className="font-bold text-gray-800">{coop.petName}</div>
                              <div className="text-xs text-gray-400">
                            {coop.coOwnerName ? t('swapCare.alreadyCoop') : t('social.looking')}
                          </div>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            coop.status === 'active' ? 'bg-green-100 text-green-600' :
                            coop.status === 'looking' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {coop.status === 'active' ? t('social.active') :
                             coop.status === 'looking' ? t('social.looking') : t('social.ended')}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="flex-1 py-2 bg-pink-100 text-pink-600 rounded-lg text-sm font-medium">
                            {t('social.viewApplications')} ({coop.applicants?.length || 0})
                          </button>
                          {coop.status === 'active' && (
                            <button className="flex-1 py-2 bg-green-100 text-green-600 rounded-lg text-sm font-medium">
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
              <h3 className="font-bold text-gray-800 mb-3">📋 {t('social.myApplication')}</h3>
              {mockCoops.filter(c => !c.isOwner && c.applied).length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">📋</div>
                  <p>{t('social.noApplication')}</p>
                </div>
                ) : (
                  <div className="space-y-3">
                    {mockCoops.filter(c => !c.isOwner && c.applied).map(coop => (
                      <div key={coop.id} className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{coop.petAvatar}</span>
                          <div className="flex-1">
                            <div className="font-bold text-gray-800">{coop.petName}</div>
                            <div className="text-xs text-gray-400">申请合养</div>
                          </div>
                          <div className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600">
                          {t('social.pending')}
                        </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'friends' && (
            <div className="space-y-3">
              {mockFriends.map((friend, idx) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-effect rounded-2xl p-4 flex items-center gap-4"
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-300 to-orange-400 flex items-center justify-center text-3xl">
                      {friend.pet}
                    </div>
                    {friend.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-700">{friend.name}</div>
                    <div className="text-sm text-orange-500">Lv.{friend.level}</div>
                  </div>
                  <button className="px-4 py-2 bg-orange-100 text-orange-500 rounded-xl font-medium">
                    {t('social.coopNow')}
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'events' && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">🐾 {t('social.petChatrooms')}</h2>
                <p className="text-gray-500">{t('social.chatWithFriends')}</p>
              </div>
              <ChatRooms />
            </div>
          )}

          <div className="mt-6 glass-effect rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-700 mb-4">🎁 {t('social.inviteReward')}</h2>
            <p className="text-gray-500 text-sm mb-4">{t('social.inviteDesc')}</p>
            <button className="w-full py-3 bg-gradient-to-r from-green-400 to-green-500 text-white font-medium rounded-xl">
              {t('social.shareLink')}
            </button>
          </div>
        </div>
      </div>

      <CreateSwapModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateSwap}
        userPets={mockUserPets}
      />

      <ApplySwapModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        swap={selectedSwap}
        onConfirm={handleConfirmApply}
        userPoints={userPoints}
      />

      <CreateCoopModal
        isOpen={showCreateCoopModal}
        onClose={() => setShowCreateCoopModal(false)}
        onSubmit={handleCreateCoop}
        userPets={mockUserPets}
      />

      <ApplyCoopModal
        isOpen={showApplyCoopModal}
        onClose={() => setShowApplyCoopModal(false)}
        coop={selectedCoop}
        onConfirm={handleConfirmApplyCoop}
        userPoints={userPoints}
      />
    </div>
  )
}

export default Social
