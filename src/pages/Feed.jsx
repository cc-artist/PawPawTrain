import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import { useUpload } from '../context/UploadContext'
import { usePosts } from '../App'
import { t } from '../utils/i18n'

const systemVideos = [
  { id: 'sys-video-1', user: { name: '🐾 精彩瞬间', avatar: '🎬' }, media: 'https://res.cloudinary.com/dsa4t0soq/video/upload/v1781608864/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912026-06-16_191827_879_dlcj5h.mp4', content: '宠物精彩表演时刻！🐕', likes: 1256, comments: 89, shares: 45, favorites: 321, time: '1小时前', features: { breed: '狗狗', color: '花色', expression: '开心', emotion: 'positive', personalityBoost: { energy: 10, affection: 8, joy: 12, hunger: -3, discipline: 5 }, petType: 'dog' }, isMine: false },
  { id: 'sys-video-2', user: { name: '🐾 萌宠日常', avatar: '🐱' }, media: 'https://res.cloudinary.com/dsa4t0soq/video/upload/v1781608857/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912026-06-16_191833_927_lgjwn5.mp4', content: '可爱猫咪的日常玩耍 🐱', likes: 890, comments: 67, shares: 32, favorites: 234, time: '2小时前', features: { breed: '猫咪', color: '橙色', expression: '好奇', emotion: 'positive', personalityBoost: { energy: 8, affection: 10, joy: 10, hunger: -2, discipline: 3 }, petType: 'cat' }, isMine: false },
  { id: 'sys-video-3', user: { name: '🐾 快乐时光', avatar: '🐕' }, media: 'https://res.cloudinary.com/dsa4t0soq/video/upload/v1781608845/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912026-06-16_191852_670_bdvfrd.mp4', content: '宠物互动的美好时刻 💕', likes: 1567, comments: 145, shares: 78, favorites: 456, time: '3小时前', features: { breed: '狗狗', color: '黑色', expression: '兴奋', emotion: 'positive', personalityBoost: { energy: 12, affection: 6, joy: 15, hunger: -5, discipline: 4 }, petType: 'dog' }, isMine: false },
  { id: 'sys-video-4', user: { name: '🐾 小可爱', avatar: '🐰' }, media: 'https://res.cloudinary.com/dsa4t0soq/video/upload/v1781608837/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912026-06-16_191857_392_xnsyf6.mp4', content: '小兔子的幸福生活 🐰', likes: 789, comments: 56, shares: 23, favorites: 189, time: '4小时前', features: { breed: '兔子', color: '白色', expression: '满足', emotion: 'positive', personalityBoost: { energy: 5, affection: 12, joy: 8, hunger: 8, discipline: 2 }, petType: 'rabbit' }, isMine: false },
  { id: 'sys-video-5', user: { name: '🐾 萌宠乐园', avatar: '🐾' }, media: 'https://res.cloudinary.com/dsa4t0soq/video/upload/v1781608837/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912026-06-16_191838_670_bdf1ig.mp4', content: '宠物们的欢乐聚会 🎉', likes: 2345, comments: 234, shares: 156, favorites: 876, time: '5小时前', features: { breed: '猫咪', color: '灰色', expression: '调皮', emotion: 'positive', personalityBoost: { energy: 9, affection: 7, joy: 11, hunger: -4, discipline: 6 }, petType: 'cat' }, isMine: false },
  { id: 'sys-video-6', user: { name: '🐾 训练时刻', avatar: '🏋️' }, media: 'https://res.cloudinary.com/dsa4t0soq/video/upload/v1781608825/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912026-06-16_191816_096_e3nbsv.mp4', content: '宠物训练的精彩瞬间 🏆', likes: 1876, comments: 178, shares: 89, favorites: 567, time: '6小时前', features: { breed: '狗狗', color: '金色', expression: '专注', emotion: 'positive', personalityBoost: { energy: 10, affection: 9, joy: 7, hunger: -6, discipline: 10 }, petType: 'dog' }, isMine: false },
  { id: 'sys-video-7', user: { name: '🐾 温馨时刻', avatar: '💝' }, media: 'https://res.cloudinary.com/dsa4t0soq/video/upload/v1781608823/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912026-06-16_191847_801_fixhen.mp4', content: '人与宠物的温馨互动 💝', likes: 3456, comments: 456, shares: 234, favorites: 1234, time: '7小时前', features: { breed: '猫咪', color: '白色', expression: '温柔', emotion: 'positive', personalityBoost: { energy: 3, affection: 15, joy: 9, hunger: -1, discipline: 4 }, petType: 'cat' }, isMine: false },
  { id: 'sys-video-8', user: { name: '🐾 欢乐时光', avatar: '🎉' }, media: 'https://res.cloudinary.com/dsa4t0soq/video/upload/v1781608823/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912026-06-16_191843_526_jmohgf.mp4', content: '宠物们的欢乐时光！🎊', likes: 2123, comments: 321, shares: 167, favorites: 789, time: '8小时前', features: { breed: '狗狗', color: '棕色', expression: '开心', emotion: 'positive', personalityBoost: { energy: 11, affection: 8, joy: 14, hunger: -4, discipline: 7 }, petType: 'dog' }, isMine: false },
]

const mockPosts = [
  { id: 'mock-1', user: { name: '🐾 宠物爱好者', avatar: '👩' }, media: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=800&fit=crop', content: '今天天气真好，和我的小猫咪一起晒太阳～☀️', likes: 234, comments: 45, shares: 12, favorites: 89, time: '2小时前', features: { breed: '猫咪', color: '橙色', expression: '开心', emotion: 'positive', personalityBoost: { energy: 5, affection: 3, joy: 8, hunger: -2, discipline: 1 }, petType: 'cat' }, isMine: false },
  { id: 'mock-2', user: { name: '🐾 铲屎官日记', avatar: '👨' }, media: 'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=800&h=800&fit=crop', content: '今天带狗狗去公园玩，玩得好开心！', likes: 567, comments: 89, shares: 34, favorites: 156, time: '4小时前', features: { breed: '狗狗', color: '黄色', expression: '兴奋', emotion: 'positive', personalityBoost: { energy: 10, affection: 5, joy: 12, hunger: -5, discipline: 8 }, petType: 'dog' }, isMine: false },
  { id: 'mock-3', user: { name: '🐾 萌宠日常', avatar: '👧' }, media: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=800&h=800&fit=crop', content: '小兔子今天吃得很满足～', likes: 890, comments: 123, shares: 56, favorites: 234, time: '6小时前', features: { breed: '兔子', color: '白色', expression: '满足', emotion: 'positive', personalityBoost: { energy: 2, affection: 8, joy: 6, hunger: 10, discipline: 3 }, petType: 'rabbit' }, isMine: false },
  { id: 'mock-4', user: { name: '🐾 猫咪星球', avatar: '👩‍🦰' }, media: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop', content: '猫咪睡觉的样子真可爱～', likes: 1203, comments: 234, shares: 78, favorites: 456, time: '8小时前', features: { breed: '猫咪', color: '白色', expression: '安详', emotion: 'calm', personalityBoost: { energy: -3, affection: 10, joy: 4, hunger: -1, discipline: 2 }, petType: 'cat' }, isMine: false },
  { id: 'mock-5', user: { name: '🐾 汪汪队', avatar: '👨‍🦱' }, media: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=800&h=800&fit=crop', content: '训练狗狗的一天，进步很大！', likes: 1567, comments: 345, shares: 123, favorites: 567, time: '10小时前', features: { breed: '狗狗', color: '金色', expression: '认真', emotion: 'positive', personalityBoost: { energy: 8, affection: 12, joy: 7, hunger: -8, discipline: 6 }, petType: 'dog' }, isMine: false },
]



const aiProducts = [
  { id: 1, name: 'AI专属头像', icon: '🎨', price: 200, description: 'AI为你的宠物生成专属二次元头像', sales: 128 },
  { id: 2, name: '表情包套装', icon: '😺', price: 300, description: '16款AI生成的宠物表情包', sales: 89 },
  { id: 3, name: '虚拟装扮', icon: '👗', price: 150, description: 'AI设计的宠物专属装扮', sales: 256 },
  { id: 4, name: '艺术壁纸', icon: '🖼️', price: 100, description: 'AI创作的宠物艺术壁纸', sales: 167 },
  { id: 5, name: '故事绘本', icon: '📖', price: 500, description: 'AI编写的宠物专属故事', sales: 45 },
  { id: 6, name: '个性签名', icon: '✍️', price: 50, description: 'AI生成的宠物个性签名', sales: 312 },
]

const getPetAvatar = (petType) => {
  const avatars = {
    dog: '🐕',
    cat: '🐱',
    rabbit: '🐰',
    bird: '🐦',
    fish: '🐟',
    hamster: '🐹',
    turtle: '🐢',
    guinea_pig: '🐹',
  }
  return avatars[petType] || '🐾'
}

const Feed = () => {
  const { posts: userPosts } = usePosts()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mediaFilter, setMediaFilter] = useState('video')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const containerRef = useRef(null)
  const videoRef = useRef(null)
  const touchStartY = useRef(0)
  const touchEndY = useRef(0)
  const wheelTimeoutRef = useRef(null)
  const { showUpload } = useUpload()
  const currentPet = useStore(state => state.currentPet)
  const { user } = useStore()

  const sharePlatforms = [
    { id: 'facebook', name: 'Facebook', icon: '📘', color: 'from-blue-600 to-blue-800' },
    { id: 'instagram', name: 'Instagram', icon: '📷', color: 'from-purple-500 to-pink-500' },
    { id: 'twitter', name: 'X', icon: '🐦', color: 'from-slate-400 to-slate-600' },
    { id: 'whatsapp', name: 'WhatsApp', icon: '💚', color: 'from-green-500 to-green-700' },
    { id: 'reddit', name: 'Reddit', icon: '🔴', color: 'from-orange-500 to-orange-700' },
    { id: 'discord', name: 'Discord', icon: '💜', color: 'from-indigo-500 to-purple-600' },
  ]

  const handleShare = (platform) => {
    const shareText = encodeURIComponent(`${currentPost.user.name} - ${currentPost.content}`)
    const shareUrl = encodeURIComponent(window.location.href)
    
    let url = ''
    switch (platform.id) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareText}`
        break
      case 'instagram':
        url = `https://www.instagram.com/share?text=${shareText}`
        break
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`
        break
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`
        break
      case 'reddit':
        url = `https://www.reddit.com/submit?url=${shareUrl}&title=${shareText}`
        break
      case 'discord':
        url = `https://discord.com/channels/@me`
        break
      default:
        return
    }
    
    window.open(url, '_blank', 'width=600,height=400')
    setShowShareMenu(false)
  }

  const isVideo = (media) => {
    if (!media) return false
    return media.match(/\.(mp4|mov|webm)$/i) || media.startsWith('data:video')
  }

  const isImage = (media) => {
    if (!media) return false
    return media.match(/\.(jpg|jpeg|png|gif|webp)$/i) || media.startsWith('data:image')
  }

  const allPosts = useMemo(() => {
    return [...systemVideos, ...userPosts, ...mockPosts].filter(post => {
      if (mediaFilter === 'all') return true
      if (mediaFilter === 'image') return isImage(post.media)
      if (mediaFilter === 'video') return isVideo(post.media)
      return true
    })
  }, [mediaFilter, userPosts])

  const handlePrev = useCallback(() => {
    setVideoError(false)
    setCurrentIndex(prev => (prev - 1 + allPosts.length) % allPosts.length)
  }, [allPosts.length])

  const handleNext = useCallback(() => {
    setVideoError(false)
    setCurrentIndex(prev => (prev + 1) % allPosts.length)
  }, [allPosts.length])

  const handleKeyDown = useCallback((e) => {
    if (showUpload) return
    if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      handlePrev()
    } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      handleNext()
    }
  }, [handlePrev, handleNext, showUpload])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    if (showUpload) return
    touchEndY.current = e.changedTouches[0].clientY
    const diff = touchStartY.current - touchEndY.current
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext()
      } else {
        handlePrev()
      }
    }
  }

  const handleWheel = useCallback((e) => {
    if (showUpload) return
    e.preventDefault()
    
    if (wheelTimeoutRef.current) {
      clearTimeout(wheelTimeoutRef.current)
    }
    
    const deltaY = e.deltaY
    
    wheelTimeoutRef.current = setTimeout(() => {
      if (deltaY > 0) {
        handleNext()
      } else {
        handlePrev()
      }
    }, 100)
  }, [handlePrev, handleNext, showUpload])

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => container.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  useEffect(() => {
    const video = videoRef.current
    const currentMedia = allPosts[currentIndex]?.media
    
    if (!video || !currentMedia || !isVideo(currentMedia)) {
      setVideoPlaying(false)
      return
    }
    
    console.log('Attempting to play video:', currentMedia)
    
    setVideoPlaying(false)
    video.muted = true
    video.volume = 0
    
    const playVideo = () => {
      video.play().then(() => {
        console.log('Video started playing successfully')
        setVideoPlaying(true)
        setVideoError(false)
      }).catch(err => {
        console.error('Auto-play failed:', err)
        setVideoError(true)
      })
    }
    
    if (video.readyState >= 2) {
      playVideo()
    } else {
      const handleCanPlay = () => {
        video.removeEventListener('canplay', handleCanPlay)
        playVideo()
      }
      video.addEventListener('canplay', handleCanPlay)
      return () => video.removeEventListener('canplay', handleCanPlay)
    }
  }, [currentIndex, allPosts])

  const handlePurchase = async () => {
    if (!selectedProduct) return
    const userPoints = user?.points || 0
    if (userPoints < selectedProduct.price) {
      alert(t('feed.insufficientPoints'))
      return
    }
    
    setIsPurchasing(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsPurchasing(false)
    setPurchaseSuccess(true)
    
    setTimeout(() => {
      setSelectedProduct(null)
      setPurchaseSuccess(false)
    }, 2000)
  }

  const currentPost = allPosts[currentIndex]
  const petEmoji = currentPost?.features?.petType ? getPetAvatar(currentPost.features.petType) : currentPost?.user?.avatar || '🐾'
  const isCurrentVideo = isVideo(currentPost?.media)

  useEffect(() => {
    const handlePageLoad = async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      const video = videoRef.current
      if (video && isVideo(allPosts[0]?.media)) {
        video.muted = true
        video.play().catch(err => console.log('Initial play failed:', err))
      }
    }
    
    const loadHandler = handlePageLoad()
    return () => {}
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      const video = videoRef.current
      if (video && document.hidden) {
        video.pause()
      } else if (video && !document.hidden) {
        const currentMedia = allPosts[currentIndex]?.media
        if (isVideo(currentMedia)) {
          video.muted = true
          video.play().catch(err => console.log('Play on visibility change:', err))
        }
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [currentIndex, allPosts])

  return (
    <div className="min-h-full bg-black">
      <div 
        ref={containerRef}
        className="relative h-full overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPost.id}
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0">
              {typeof currentPost.media === 'string' && (currentPost.media.startsWith('http') || currentPost.media.startsWith('data:image') || currentPost.media.startsWith('data:video')) ? (
                isCurrentVideo ? (
                  <div className="absolute inset-0 bg-black">
                    <video 
                      ref={videoRef}
                      src={currentPost.media}
                      className="w-full h-full object-cover" 
                      style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', objectFit: 'cover', zIndex: 1 }}
                      autoPlay={true}
                      muted={true}
                      loop={true}
                      playsInline={true}
                      preload="auto"
                      controls={false}
                      disablePictureInPicture={true}
                      playsInline={true}
                      onLoadedMetadata={() => {
                        console.log('Video metadata loaded')
                      }}
                      onCanPlayThrough={() => {
                        console.log('Video can play through')
                        videoRef.current?.play().catch(err => console.log('Play on canplaythrough:', err))
                      }}
                      onPlay={() => {
                        console.log('Video is playing')
                        setVideoPlaying(true)
                        setVideoError(false)
                      }}
                      onPause={() => {
                        console.log('Video paused')
                      }}
                      onEnded={() => {
                        console.log('Video ended, looping...')
                        videoRef.current?.play().catch(err => console.log('Loop play failed:', err))
                      }}
                      onError={(e) => {
                        console.error('Video load error:', e)
                        console.error('Video URL:', currentPost.media)
                        setVideoError(true)
                      }}
                    />
                    {(!videoPlaying || videoError) && (
                      <div 
                        className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer bg-black/50"
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.muted = true
                            videoRef.current.play().then(() => {
                              setVideoPlaying(true)
                              setVideoError(false)
                            }).catch(err => {
                              console.log('Manual play also failed:', err)
                            })
                          }
                        }}
                      >
                        <div className="w-24 h-24 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                          <span className="text-5xl text-white">▶️</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <motion.img 
                    src={currentPost.media} 
                    alt="Pet" 
                    className="w-full h-full object-cover"
                    initial={{ scale: 1 }}
                    animate={{ scale: 1.08 }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  />
                )
              ) : (
                <motion.div 
                  className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center"
                  animate={{
                    background: [
                      'linear-gradient(to bottom right, #1f1f2e, #2d2d44)',
                      'linear-gradient(to bottom right, #2d2d44, #1f1f2e)',
                      'linear-gradient(to bottom right, #1f1f2e, #2d2d44)',
                    ]
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                >
                  <motion.span 
                    className="text-[30vh] opacity-50"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [-5, 5, -5]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {currentPost.media || '🐾'}
                  </motion.span>
                </motion.div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-end justify-between">
                  <div className="flex flex-col gap-3">
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-1 shadow-lg shadow-purple-500/50"
                    >
                      <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-2xl">
                        {petEmoji}
                      </div>
                    </motion.div>
                    <div className="text-white text-sm leading-relaxed max-w-xs">
                      {currentPost.content}
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.1 }}
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/50"
                    >
                      {currentPost.user.avatar}
                    </motion.div>
                    <div className="flex flex-col items-center">
                      <button type="button" className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl hover:bg-white/30 transition-all hover:scale-110">
                        ❤️
                      </button>
                      <span className="text-white text-xs mt-1 font-medium">{currentPost.likes || 0}</span>
                    </div>
                    <div className="flex flex-col items-center relative">
                      <button 
                        type="button" 
                        onClick={() => setShowShareMenu(!showShareMenu)}
                        className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center text-2xl transition-all hover:scale-110 ${
                          showShareMenu ? 'bg-white/30' : 'bg-white/20 hover:bg-white/30'
                        }`}
                      >
                        ↗️
                      </button>
                      <span className="text-white text-xs mt-1 font-medium">{currentPost.shares || 0}</span>
                      
                      <AnimatePresence>
                        {showShareMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            className="absolute bottom-full mb-2 right-0 bg-gray-900/95 backdrop-blur-lg rounded-xl p-2 border border-white/10 shadow-xl"
                          >
                            <div className="grid grid-cols-3 gap-2">
                              {sharePlatforms.map((platform) => (
                                <motion.button
                                  key={platform.id}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleShare(platform)}
                                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center text-xl shadow-md`}
                                  title={platform.name}
                                >
                                  {platform.icon}
                                </motion.button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="flex flex-col items-center">
                      <button type="button" className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl hover:bg-white/30 transition-all hover:scale-110">
                        💾
                      </button>
                      <span className="text-white text-xs mt-1 font-medium">{currentPost.favorites || 0}</span>
                    </div>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex justify-center gap-2"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-md shadow-orange-500/30"
                    title={t('feed.adopt')}
                  >
                    🐱
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-8 h-8 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-md shadow-blue-500/30"
                    title={t('feed.swap')}
                  >
                    🔄
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-md shadow-purple-500/30"
                    title={t('feed.coop')}
                  >
                    🤝
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-md shadow-green-500/30"
                    title={t('feed.addFriend')}
                  >
                    👥
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute top-2 left-2 z-20 flex gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setMediaFilter('all')
              setCurrentIndex(0)
            }}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all hover:scale-110 ${
              mediaFilter === 'all'
                ? 'bg-white text-black'
                : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
            }`}
            title={t('feed.all')}
          >
            📷
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setMediaFilter('image')
              setCurrentIndex(0)
            }}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all hover:scale-110 ${
              mediaFilter === 'image'
                ? 'bg-white text-black'
                : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
            }`}
            title={t('feed.image')}
          >
            🖼️
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setMediaFilter('video')
              setCurrentIndex(0)
            }}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all hover:scale-110 ${
              mediaFilter === 'video'
                ? 'bg-white text-black'
                : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
            }`}
            title={t('feed.video')}
          >
            🎬
          </button>
        </div>

        <div className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2">
            <div className="flex items-center justify-center mb-2">
              <span className="text-sm" title={t('feed.aiWorkshop')}>🛠️</span>
            </div>
            <div className="space-y-1">
              {aiProducts.slice(0, 3).map((product, index) => (
                <motion.button
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedProduct(product)
                  }}
                  className="w-full bg-white/10 hover:bg-white/20 rounded-lg p-1.5 transition-all flex items-center justify-center"
                  title={product.name}
                >
                  <span className="text-sm">{product.icon}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl w-full overflow-hidden border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              {!purchaseSuccess ? (
                <>
                  <div className="p-6 text-center">
                    <div className="text-6xl mb-4">{selectedProduct.icon}</div>
                    <h3 className="text-xl font-bold text-white mb-2">{selectedProduct.name}</h3>
                    <p className="text-gray-400 text-sm mb-6">{selectedProduct.description}</p>
                    
                    <div className="flex items-center justify-center gap-6 mb-6">
                      <div className="text-center">
                        <div className="text-gray-400 text-xs">{t('shop.points')}</div>
                        <div className="text-2xl font-bold text-yellow-400">{selectedProduct.price} <span className="text-sm">{t('shop.points')}</span></div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400 text-xs">{t('feed.sales')}</div>
                        <div className="text-lg font-medium text-white">{selectedProduct.sales}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400 text-xs">{t('shop.myPoints')}</div>
                        <div className="text-lg font-medium text-green-400">{user?.points || 0}</div>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePurchase}
                      disabled={isPurchasing || (user?.points || 0) < selectedProduct.price}
                      className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
                        (user?.points || 0) >= selectedProduct.price
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isPurchasing ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          {t('feed.buying')}
                        </span>
                      ) : (
                        `${t('feed.buyNow')} (${selectedProduct.price}${t('shop.points')})`
                      )}
                    </motion.button>
                  </div>
                </>
              ) : (
                <div className="p-10 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 mx-auto flex items-center justify-center text-4xl mb-4"
                  >
                    ✨
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2">{t('feed.purchaseSuccess')}</h3>
                    <p className="text-gray-400 text-sm">{t('feed.itemSent')}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Feed