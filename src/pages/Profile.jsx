import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { t } from '../utils/i18n'
import { getMediaLibrary, removeMediaRecord, getMediaBySource, UPLOAD_SOURCE } from '../utils/mediaLibrary'

const STORAGE_KEY = 'paw_train_all_posts'
const PET_STORAGE_KEY = 'paw_train_pet_state'

const getMyPosts = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const allPosts = JSON.parse(saved)
      return allPosts.filter(post => post.isMine)
    }
  } catch (e) {
    console.error('Error loading posts:', e)
  }
  return []
}

const savePosts = (posts) => {
  try {
    const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const otherPosts = allPosts.filter(post => !post.isMine)
    const updatedAllPosts = [...otherPosts, ...posts]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAllPosts))
  } catch (e) {
    console.error('Error saving posts:', e)
  }
}

const resetPetToDefault = () => {
  const defaultPet = {
    id: 1,
    type: 'cat',
    name: '小橘猫',
    personality: 'gentle',
    level: 5,
    exp: 150,
    expToNext: 200,
    intimacy: 80,
    hunger: 70,
    energy: 50,
    affection: 50,
    joy: 50,
    discipline: 50,
    points: 888,
    stage: 'pixel',
    breed: '橘猫',
    color: '橙色'
  }
  localStorage.setItem(PET_STORAGE_KEY, JSON.stringify(defaultPet))
  return defaultPet
}

const Profile = () => {
  const { user, pet, logout, setPet } = useStore()
  const [myPosts, setMyPosts] = useState([])
  const [viewMode, setViewMode] = useState('grid')
  const [selectedPost, setSelectedPost] = useState(null)
  const [currentScrollIndex, setCurrentScrollIndex] = useState(0)
  const [editingPost, setEditingPost] = useState(null)
  const [mediaRecords, setMediaRecords] = useState([])
  const [mediaFilter, setMediaFilter] = useState('all') // all/video/image
  const [mediaViewExpanded, setMediaViewExpanded] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setMyPosts(getMyPosts())
    setMediaRecords(getMediaLibrary())
  }, [])

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === PET_STORAGE_KEY) {
        try {
          const updatedPet = JSON.parse(e.newValue)
          if (updatedPet && updatedPet.type) {
            setPet(updatedPet)
          }
        } catch (err) {
          console.error('Failed to parse pet state from localStorage')
        }
      } else if (e.key === STORAGE_KEY) {
        const posts = getMyPosts()
        if (JSON.stringify(posts) !== JSON.stringify(myPosts)) {
          setMyPosts(posts)
        }
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [myPosts, setPet])

  // 定期刷新媒体库（同一窗口内的变化）
  useEffect(() => {
    const interval = setInterval(() => {
      setMediaRecords(getMediaLibrary())
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // 刷新媒体库
  const refreshMediaLibrary = () => {
    setMediaRecords(getMediaLibrary())
  }

  // 删除媒体记录
  const handleDeleteMedia = (recordId) => {
    if (confirm('确认删除此上传记录？/ Delete this upload record?')) {
      removeMediaRecord(recordId)
      refreshMediaLibrary()
    }
  }

  // 筛选媒体记录
  const filteredMedia = mediaFilter === 'all' 
    ? mediaRecords 
    : mediaFilter === 'video' 
      ? mediaRecords.filter(r => r.fileType.startsWith('video/'))
      : mediaRecords.filter(r => r.fileType.startsWith('image/'));

  const videoCount = mediaRecords.filter(r => r.fileType.startsWith('video/')).length;
  const imageCount = mediaRecords.filter(r => r.fileType.startsWith('image/')).length;

  const handleLogout = () => {
    if (confirm(t('profile.confirmLogout'))) {
      localStorage.removeItem('token')
      logout()
    }
  }

  const goToPrev = () => {
    if (myPosts.length > 1) {
      setCurrentScrollIndex(prev => (prev - 1 + myPosts.length) % myPosts.length)
    }
  }

  const goToNext = () => {
    if (myPosts.length > 1) {
      setCurrentScrollIndex(prev => (prev + 1) % myPosts.length)
    }
  }

  const handleDelete = (index) => {
    const postToDelete = myPosts[index]
    if (!postToDelete) return
    
    const newPosts = myPosts.filter((_, i) => i !== index)
    setMyPosts(newPosts)
    savePosts(newPosts)
    
    if (selectedPost && selectedPost.id === postToDelete.id) {
      setSelectedPost(null)
    }
    if (editingPost === index) {
      setEditingPost(null)
    }
    if (currentScrollIndex >= newPosts.length && newPosts.length > 0) {
      setCurrentScrollIndex(newPosts.length - 1)
    }
    
    if (newPosts.length === 0) {
      const defaultPet = resetPetToDefault()
      setPet(defaultPet)
    }
  }

  const handleMoveUp = (index) => {
    if (index > 0) {
      const newPosts = [...myPosts]
      ;[newPosts[index], newPosts[index - 1]] = [newPosts[index - 1], newPosts[index]]
      setMyPosts(newPosts)
      savePosts(newPosts)
    }
  }

  const handleMoveDown = (index) => {
    if (index < myPosts.length - 1) {
      const newPosts = [...myPosts]
      ;[newPosts[index], newPosts[index + 1]] = [newPosts[index + 1], newPosts[index]]
      setMyPosts(newPosts)
      savePosts(newPosts)
    }
  }

  const getMediaContent = (post) => {
    if (!post) return { type: 'emoji', content: '🐾' }
    if (post.media?.startsWith('data:video')) return { type: 'video', content: post.media }
    if (post.media?.startsWith('data:image')) return { type: 'image', content: post.media }
    if (post.media) return { type: 'emoji', content: post.media }
    return { type: 'emoji', content: '🐾' }
  }

  const getPetInfo = (post) => {
    if (!post) return { breed: '未知', color: '未知', expression: '开心' }
    const features = post.features || {}
    return {
      breed: features.breed || post.breed || '未知',
      color: features.color || post.color || '未知',
      expression: features.expression || '开心'
    }
  }

  const getPersonality = (post) => {
    if (!post) return { energy: 0, affection: 0, joy: 0, hunger: 0, discipline: 0 }
    const personality = post.features?.personalityBoost || post.personality || {}
    return {
      energy: personality.energy || 0,
      affection: personality.affection || 0,
      joy: personality.joy || 0,
      hunger: personality.hunger || 0,
      discipline: personality.discipline || 0
    }
  }

  const currentViewPost = myPosts[currentScrollIndex]

  return (
    <div className="h-screen gradient-bg overflow-y-auto">
      <div>
        <div className="w-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-3xl p-6 warm-shadow mb-6 mt-4"
          >
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 mx-auto flex items-center justify-center text-5xl mb-4">
                {pet?.type === 'cat' ? '🐱' : pet?.type === 'dog' ? '🐶' : '🐰'}
              </div>
              <h2 className="text-xl font-bold text-white">{user?.name || '铲屎官'}</h2>
              <p className="text-orange-500">ID: {user?.id || '123456'}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center relative">
                <div className="text-2xl font-bold text-orange-500">{user?.points || 0}</div>
                <div className="text-sm text-gray-300">{t('shop.points')}</div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/recharge')}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-orange-400 to-pink-400 text-white text-xs font-bold rounded-full shadow-md hover:shadow-lg transition-all"
                >
                  💰 充值
                </motion.button>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-500">{myPosts.length}</div>
                <div className="text-sm text-gray-300">{t('profile.posts')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">12</div>
                <div className="text-sm text-gray-300">{t('social.friends')}</div>
              </div>
            </div>
          </motion.div>

          {myPosts.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-effect rounded-3xl p-6 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">📸 {t('profile.myDaily')}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1 rounded-lg text-sm ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                  >
                    {t('profile.grid')}
                  </button>
                  <button
                    onClick={() => setViewMode('story')}
                    className={`px-3 py-1 rounded-lg text-sm ${viewMode === 'story' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                  >
                    {t('profile.story')}
                  </button>
                </div>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-3 gap-2">
                  {myPosts.map((post, idx) => {
                    const media = getMediaContent(post)
                    return (
                      <motion.div
                        key={post.id || idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-orange-200 to-orange-300 cursor-pointer relative group"
                      >
                        {media.type === 'video' ? (
                          <video src={media.content} className="w-full h-full object-cover" />
                        ) : media.type === 'image' ? (
                          <img src={media.content} alt="Pet" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-5xl">{media.content}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="flex gap-4 text-white">
                            <span>❤️ {post.likes || 0}</span>
                            <span>💬 {post.comments || 0}</span>
                          </div>
                        </div>
                        <div 
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingPost(editingPost === idx ? null : idx)
                          }}
                        >
                          <div className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white text-xs cursor-pointer hover:bg-black/80">
                            ✏️
                          </div>
                        </div>
                        {editingPost === idx && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleMoveUp(idx)}
                              disabled={idx === 0}
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                                idx === 0 ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-white/20 text-white hover:bg-white/30'
                              }`}
                            >
                              ⬆️
                            </button>
                            <button
                              onClick={() => handleMoveDown(idx)}
                              disabled={idx === myPosts.length - 1}
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                                idx === myPosts.length - 1 ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-white/20 text-white hover:bg-white/30'
                              }`}
                            >
                              ⬇️
                            </button>
                            <button
                              onClick={() => handleDelete(idx)}
                              className="w-10 h-10 rounded-full bg-red-500/80 text-white flex items-center justify-center text-lg hover:bg-red-500 transition-all"
                            >
                              🗑️
                            </button>
                            <button
                              onClick={() => setEditingPost(null)}
                              className="text-gray-300 text-sm hover:text-white"
                            >
                              {t('profile.cancel')}
                            </button>
                          </motion.div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="relative">
                  {currentViewPost && (
                    <div
                      className="relative overflow-hidden rounded-2xl bg-gray-900"
                      style={{ aspectRatio: '9/16' }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        {(() => {
                          const media = getMediaContent(currentViewPost)
                          const petInfo = getPetInfo(currentViewPost)
                          const personality = getPersonality(currentViewPost)
                          
                          if (media.type === 'video') {
                            return <video src={media.content} className="max-w-full max-h-full object-contain" controls />
                          }
                          if (media.type === 'image') {
                            return <img src={media.content} alt="Pet" className="max-w-full max-h-full object-contain" />
                          }
                          return (
                            <div className="text-center">
                              <div className="text-9xl mb-8 animate-pulse">{media.content}</div>
                              <div className="px-4 space-y-2">
                                <div className="text-gray-400 text-sm">
                                  🐾 {petInfo.breed} | {petInfo.color} | {petInfo.expression}
                                </div>
                                <div className="flex justify-center gap-3 text-sm">
                                  <span className="text-yellow-400">⚡{personality.energy}</span>
                                  <span className="text-pink-400">💖{personality.affection}</span>
                                  <span className="text-green-400">😊{personality.joy}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })()}
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-16">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-2xl">
                            {currentViewPost.user?.avatar || '🐾'}
                          </div>
                          <div>
                            <div className="text-white font-bold text-sm">{currentViewPost.user?.name || '宠物主人'}</div>
                            <div className="text-gray-400 text-xs">{currentViewPost.time || '刚刚'}</div>
                          </div>
                        </div>
                        <p className="text-white text-sm leading-relaxed">{currentViewPost.content || '分享我的宠物～'}</p>
                      </div>

                      {myPosts.length > 1 && (
                        <>
                          <button
                            onClick={goToPrev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all"
                          >
                            ‹
                          </button>
                          <button
                            onClick={goToNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all"
                          >
                            ›
                          </button>
                        </>
                      )}

                      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1">
                        {myPosts.map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all ${idx === currentScrollIndex ? 'bg-white w-6' : 'bg-white/40'}`}
                          />
                        ))}
                      </div>

                      <button
                        onClick={() => handleDelete(currentScrollIndex)}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center text-white text-sm hover:bg-red-500 transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-effect rounded-3xl p-6 mb-6 text-center"
            >
              <div className="text-6xl mb-4">📸</div>
              <p className="text-gray-300">{t('profile.noPosts')}</p>
              <p className="text-gray-400 text-sm mt-2">{t('profile.goShare')}</p>
            </motion.div>
          )}

          {/* 媒体库 - 所有上传的图片和视频记录 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-3xl p-4 mb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setMediaViewExpanded(!mediaViewExpanded)}
                className="flex items-center gap-2 text-left"
              >
                <span className="text-xl">🎬</span>
                <h3 className="text-lg font-bold text-white">
                  Media Library / 媒体库
                </h3>
                <span className={`text-sm text-gray-300 transition-transform ${mediaViewExpanded ? 'rotate-180' : ''}`}>▼</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">🎬{videoCount}</span>
                <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">🖼️{imageCount}</span>
                <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">📦{mediaRecords.length}</span>
              </div>
            </div>

            {mediaViewExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {/* 筛选按钮 */}
                <div className="flex gap-2 mb-3">
                  {[
                    { key: 'all', label: 'All / 全部', icon: '📦' },
                    { key: 'video', label: 'Video / 视频', icon: '🎬' },
                    { key: 'image', label: 'Image / 图片', icon: '🖼️' },
                  ].map(f => (
                    <button
                      key={f.key}
                      onClick={() => setMediaFilter(f.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        mediaFilter === f.key
                          ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {f.icon} {f.label}
                    </button>
                  ))}
                </div>

                {filteredMedia.length > 0 ? (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {filteredMedia.map((record) => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                      >
                        {/* 缩略图 */}
                        <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden bg-gray-200 flex items-center justify-center">
                          {record.fileType.startsWith('video/') ? (
                            record.thumbnailUrl ? (
                              <img src={record.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-2xl">🎬</span>
                            )
                          ) : record.thumbnailUrl ? (
                            <img src={record.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">🖼️</span>
                          )}
                        </div>

                        {/* 信息 */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-700 truncate" title={record.fileName}>
                            {record.fileName}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            <span>{record.sourceLabel}</span>
                            <span>·</span>
                            <span>{(record.fileSize / 1024 / 1024).toFixed(1)}MB</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {record.uploadedAtDisplay}
                          </div>
                        </div>

                        {/* 删除按钮 */}
                        <button
                          onClick={() => handleDeleteMedia(record.id)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                          title="删除 / Delete"
                        >
                          🗑️
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    {mediaFilter === 'all' 
                      ? '还没有上传记录 / No upload records yet'
                      : mediaFilter === 'video'
                        ? '还没有视频记录 / No video records yet'
                        : '还没有图片记录 / No image records yet'
                    }
                  </div>
                )}

                {/* 刷新按钮 */}
                <button
                  onClick={refreshMediaLibrary}
                  className="mt-3 w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  🔄 Refresh / 刷新
                </button>
              </motion.div>
            )}
          </motion.div>

          <div className="glass-effect rounded-2xl overflow-hidden mb-4">
            {[
              { icon: '🐾', label: '虚拟宠物', path: '/pets', highlight: true },
              { icon: '💎', label: '购买积分', path: '/recharge', highlight: true },
              { icon: '📸', label: '生成历史', path: '/history', highlight: false },
              { icon: '🎨', label: t('profile.aiWorkshop'), path: '/ai-goods', highlight: false },
              { icon: '⚙️', label: t('profile.settings'), path: '/settings', highlight: false },
              { icon: '🔔', label: t('profile.notifications'), path: '/notifications', highlight: false },
              { icon: '💬', label: t('profile.feedback'), path: '/feedback', highlight: false },
              { icon: '📋', label: t('profile.about'), path: '/about', highlight: false },
            ].map((item, idx) => (
              item.highlight ? (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, x: -20, scale: 0.9 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0, 
                    scale: 1,
                    boxShadow: ['0 0 0px rgba(249, 115, 22, 0)', '0 0 20px rgba(249, 115, 22, 0.4)', '0 0 0px rgba(249, 115, 22, 0)']
                  }}
                  transition={{ 
                    delay: idx * 0.1,
                    boxShadow: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                  onClick={() => navigate(item.path)}
                  className="w-full px-6 py-5 flex items-center gap-3 bg-gradient-to-r from-orange-50 to-pink-50 transition-all border-b-2 border-orange-200 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%', animation: 'shimmer 2s infinite' }} />
                  <motion.span 
                    className="text-3xl relative z-10"
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {item.icon}
                  </motion.span>
                  <span className="text-gray-800 font-bold relative z-10">{item.label}</span>
                  <span className="ml-auto text-orange-500 font-bold relative z-10 animate-pulse">✨ {t('profile.enter')}</span>
                </motion.button>
              ) : (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => item.path.startsWith('/ai') && navigate(item.path)}
                  className="w-full px-6 py-4 flex items-center gap-3 hover:bg-orange-50 transition-all border-b border-orange-100 last:border-0"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-white font-medium">{item.label}</span>
                  <span className="ml-auto text-gray-300">→</span>
                </motion.button>
              )
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full py-4 glass-effect rounded-2xl font-bold text-red-500"
          >
            🚪 {t('profile.logout')}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full bg-gray-800 rounded-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 flex items-center justify-between bg-gradient-to-r from-gray-700 to-gray-800">
                <h3 className="text-white font-bold">📸 {t('profile.details')}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const idx = myPosts.findIndex(p => p.id === selectedPost.id)
                      if (idx !== -1) {
                        handleDelete(idx)
                      }
                    }}
                    className="px-3 py-1 rounded-lg bg-red-500/80 text-white text-sm hover:bg-red-500 transition-all"
                  >
                    {t('profile.delete')}
                  </button>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="text-gray-400 text-2xl hover:text-white"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="aspect-video rounded-xl overflow-hidden mb-4">
                  {(() => {
                    const media = getMediaContent(selectedPost)
                    if (media.type === 'video') {
                      return <video src={media.content} className="w-full h-full object-cover" controls />
                    }
                    if (media.type === 'image') {
                      return <img src={media.content} alt="Pet" className="w-full h-full object-cover" />
                    }
                    return (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-200 to-orange-300">
                        <span className="text-8xl">{media.content}</span>
                      </div>
                    )
                  })()}
                </div>

                <div className="text-white mb-4">
                  <p className="text-lg">{selectedPost.content || t('profile.shareMyPet')}</p>
                </div>

                <div className="bg-gray-700/50 rounded-xl p-4 space-y-3">
                  <h4 className="text-white font-medium">📊 {t('profile.featureAnalysis')}</h4>
                  {(() => {
                    const petInfo = getPetInfo(selectedPost)
                    const personality = getPersonality(selectedPost)
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-gray-300">{t('profile.breed')}: <span className="text-orange-400">{petInfo.breed}</span></div>
                          <div className="text-gray-300">{t('profile.color')}: <span className="text-orange-400">{petInfo.color}</span></div>
                          <div className="text-gray-300">{t('profile.expression')}: <span className="text-orange-400">{petInfo.expression}</span></div>
                        </div>
                        <div className="grid grid-cols-5 gap-2 mt-2">
                          {Object.entries(personality).map(([key, value]) => (
                            <div key={key} className="text-center">
                              <div className="text-lg mb-1">
                                {key === 'energy' && '⚡'}
                                {key === 'affection' && '💖'}
                                {key === 'joy' && '😊'}
                                {key === 'hunger' && '🍖'}
                                {key === 'discipline' && '📚'}
                              </div>
                              <div className="text-green-400 font-bold">+{value}</div>
                              <div className="text-gray-400 text-xs">
                                {key === 'energy' && t('home.energy')}
                                {key === 'affection' && t('home.intimacy')}
                                {key === 'joy' && t('home.joy')}
                                {key === 'hunger' && t('home.hunger')}
                                {key === 'discipline' && t('home.discipline')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Profile