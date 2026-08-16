import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'

const pagePreviews = {
  '/': {
    title: '🐾 My Pet',
    titleEn: 'My Pet',
    description: 'Interact with your virtual pet',
    descriptionEn: 'Interact with your virtual pet',
    preview: (
      <div className="p-3">
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-4 mb-2">
          <div className="text-center">
            <span className="text-4xl">🐱</span>
            <div className="text-white text-sm font-medium mt-1">Kitty</div>
            <div className="text-white/70 text-xs">Lv.10 Growing</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1">
          <div className="bg-pink-100 rounded-lg p-1 text-center">
            <span className="text-xs">💖</span>
            <div className="text-xs text-pink-600">50%</div>
          </div>
          <div className="bg-orange-100 rounded-lg p-1 text-center">
            <span className="text-xs">🍖</span>
            <div className="text-xs text-orange-600">70%</div>
          </div>
          <div className="bg-purple-100 rounded-lg p-1 text-center">
            <span className="text-xs">⚡</span>
            <div className="text-xs text-purple-600">80%</div>
          </div>
          <div className="bg-green-100 rounded-lg p-1 text-center">
            <span className="text-xs">😊</span>
            <div className="text-xs text-green-600">60%</div>
          </div>
        </div>
      </div>
    )
  },
  '/feed': {
    title: '📖 Posts',
    titleEn: 'Posts',
    description: 'Browse pet community',
    descriptionEn: 'Browse pet community',
    preview: (
      <div className="p-3">
        <div className="bg-white rounded-xl shadow-sm p-3 mb-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">👤</span>
            <div>
              <div className="text-xs font-medium text-gray-800">Pet Lover</div>
              <div className="text-xs text-gray-400">2 hours ago</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg aspect-square flex items-center justify-center">
            <span className="text-4xl">🐾</span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>❤️ 128</span>
            <span>💬 23</span>
            <span>🔗 12</span>
          </div>
        </div>
      </div>
    )
  },
  '/shop': {
    title: '🛍️ Shop',
    titleEn: 'Shop',
    description: 'Buy pet supplies',
    descriptionEn: 'Buy pet supplies',
    preview: (
      <div className="p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl p-2 text-center text-white">
            <span className="text-2xl">🍖</span>
            <div className="text-xs">Cat Food</div>
            <div className="text-xs font-bold">¥29.9</div>
          </div>
          <div className="bg-gradient-to-br from-pink-400 to-red-500 rounded-xl p-2 text-center text-white">
            <span className="text-2xl">🎾</span>
            <div className="text-xs">Toy Ball</div>
            <div className="text-xs font-bold">¥15.9</div>
          </div>
          <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl p-2 text-center text-white">
            <span className="text-2xl">💊</span>
            <div className="text-xs">Healthy Treats</div>
            <div className="text-xs font-bold">¥19.9</div>
          </div>
          <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl p-2 text-center text-white">
            <span className="text-2xl">🛏️</span>
            <div className="text-xs">Pet Bed</div>
            <div className="text-xs font-bold">¥49.9</div>
          </div>
        </div>
      </div>
    )
  },
  '/social': {
    title: '👥 Social',
    titleEn: 'Social',
    description: 'Meet pet lovers',
    descriptionEn: 'Meet pet lovers',
    preview: (
      <div className="p-3">
        <div className="space-y-2">
          <div className="bg-white rounded-xl shadow-sm p-2 flex items-center gap-2">
            <span className="text-2xl">🐕</span>
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-800">Dog Lover</div>
              <div className="text-xs text-gray-400">Has a Golden Retriever</div>
            </div>
            <button className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">Follow</button>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-2 flex items-center gap-2">
            <span className="text-2xl">🐱</span>
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-800">Cat Paradise</div>
              <div className="text-xs text-gray-400">Has 3 cute cats</div>
            </div>
            <button className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">Follow</button>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-2 flex items-center gap-2">
            <span className="text-2xl">🐰</span>
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-800">Bunny Home</div>
              <div className="text-xs text-gray-400">Lop-eared rabbit lover</div>
            </div>
            <button className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Following</button>
          </div>
        </div>
      </div>
    )
  },
  '/game': {
    title: '🎮 Game',
    titleEn: 'Game',
    description: 'Pet roar battle arena',
    descriptionEn: 'Pet roar battle arena',
    preview: (
      <div className="p-3">
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-500 rounded-xl p-3 text-center text-white mb-2">
          <span className="text-3xl">🐉</span>
          <div className="text-xs font-medium mt-1">Roar Battle Arena</div>
          <div className="text-[10px] opacity-70">Match your voice to defeat rivals</div>
        </div>
        <div className="grid grid-cols-3 gap-1">
          <div className="bg-purple-100 rounded-lg p-1 text-center">
            <span className="text-sm">🐱</span>
            <div className="text-[10px] text-purple-600">Kitten</div>
          </div>
          <div className="bg-purple-100 rounded-lg p-1 text-center">
            <span className="text-sm">🐯</span>
            <div className="text-[10px] text-purple-600">Tiger</div>
          </div>
          <div className="bg-purple-100 rounded-lg p-1 text-center">
            <span className="text-sm">🐉</span>
            <div className="text-[10px] text-purple-600">Dragon</div>
          </div>
        </div>
      </div>
    )
  },
  '/profile': {
    title: '👤 Profile',
    titleEn: 'Profile',
    description: 'Personal center',
    descriptionEn: 'Personal center',
    preview: (
      <div className="p-3">
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-4 mb-2 text-center text-white">
          <span className="text-4xl">👤</span>
          <div className="font-medium mt-1">Pet Lover</div>
          <div className="text-xs opacity-70">Lv.25 · 1280 Points</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-50 rounded-xl p-2 text-center">
            <div className="text-lg font-bold text-gray-800">12</div>
            <div className="text-xs text-gray-500">Posts</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-2 text-center">
            <div className="text-lg font-bold text-gray-800">256</div>
            <div className="text-xs text-gray-500">Followers</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-2 text-center">
            <div className="text-lg font-bold text-gray-800">189</div>
            <div className="text-xs text-gray-500">Following</div>
          </div>
        </div>
      </div>
    )
  }
}

// "+" Button menu items
const plusMenuItems = [
  {
    id: 'pet-creator',
    icon: '🐾',
    label: 'Virtual Pet Image Generator',
    description: 'AI generates exclusive virtual pet images',
    path: '/create-pet',
    gradient: 'from-amber-500 to-orange-500',
    bgLight: 'bg-amber-50',
  },
  {
    id: 'pet-trainer',
    icon: '🎯',
    label: 'Virtual Pet Action Trainer',
    description: 'Train pet actions and skills',
    path: '/training',
    gradient: 'from-emerald-500 to-teal-500',
    bgLight: 'bg-emerald-50',
  },
  {
    id: 'task-generator',
    icon: '📋',
    label: 'Pet Task Generator',
    description: 'Daily pet tasks and interactions',
    path: '/daily',
    gradient: 'from-violet-500 to-purple-500',
    bgLight: 'bg-violet-50',
  },
  {
    id: 'ai-workshop',
    icon: '🤖',
    label: 'AI Creation Workshop',
    description: 'Create products from pet photos',
    path: '/ai-workshop',
    gradient: 'from-cyan-500 to-blue-500',
    bgLight: 'bg-cyan-50',
  },
]

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn, logout, user, pet } = useStore()
  const [hoveredPath, setHoveredPath] = useState(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
  const [showPlusMenu, setShowPlusMenu] = useState(false)
  const [showRechargeBanner, setShowRechargeBanner] = useState(true)

  // 积分：优先用 user.points，兜底 pet.points
  const points = user?.points ?? pet?.points ?? 0
  
  // Auto-hide feature state
  const [isNavbarVisible, setIsNavbarVisible] = useState(true)
  const [isScrolling, setIsScrolling] = useState(false)
  const hideTimeoutRef = useRef(null)
  const lastScrollTop = useRef(0)
  const scrollThreshold = 10 // Scroll threshold, only triggers if exceeded
  
  // Use ref to track latest showPlusMenu value, avoid closure issues
  const showPlusMenuRef = useRef(showPlusMenu)
  useEffect(() => {
    showPlusMenuRef.current = showPlusMenu
  }, [showPlusMenu])

  const navItems = [
    { path: '/', icon: '🏠', label: 'Home', labelEn: 'Home', locked: true },
    { path: '/feed', icon: '📖', label: 'Posts', labelEn: 'Posts', locked: false },
    { path: '/shop', icon: '🛍️', label: 'Shop', labelEn: 'Shop', locked: true },
    { path: '/game', icon: '🎮', label: 'Game', labelEn: 'Game', locked: true },
    { path: '/social', icon: '👥', label: 'Social', labelEn: 'Social', locked: true },
    { path: '/profile', icon: '👤', label: 'Profile', labelEn: 'Profile', locked: true },
  ]

  const handleClick = (path) => {
    // Public page: Only Feed is accessible without login
    if (path === '/feed') {
      navigate(path)
      return
    }
    
    // Features requiring login
    if (!isLoggedIn) {
      if (window.confirm('This feature requires login. Go to sign in page?')) {
        navigate('/login')
      }
      return
    }
    
    if (path === '/upload') {
      // Click "+" to open feature selection panel
      setShowPlusMenu(true)
      return
    } else {
      navigate(path)
    }
  }

  const handlePlusMenuItem = (path) => {
    setShowPlusMenu(false)
    navigate(path)
  }

  const handleAuthClick = () => {
    if (isLoggedIn) {
      logout()
      navigate('/feed')
    } else {
      navigate('/login')
    }
  }

  const handleMouseEnter = (path, e) => {
    if (path === '/upload') return
    const rect = e.currentTarget.getBoundingClientRect()
    setHoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    })
    setHoveredPath(path)
  }

  // Auto-hide feature: listen to scroll and click events
  useEffect(() => {
    // Function to show navbar
    const showNavbar = () => {
      setIsNavbarVisible(true)
      setIsScrolling(false)
      
      // Clear previous hide timer
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
      
      // Auto-hide after 3 seconds of inactivity
      hideTimeoutRef.current = setTimeout(() => {
        // If no menu is open, hide navbar
        if (!showPlusMenuRef.current) {
          setIsNavbarVisible(false)
        }
      }, 3000)
    }

    // Function to hide navbar
    const hideNavbar = () => {
      // If menu is open, don't hide navbar
      if (showPlusMenuRef.current) return
      
      setIsNavbarVisible(false)
      setIsScrolling(false)
    }

    // Scroll event handler
    const handleScroll = () => {
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollDiff = Math.abs(currentScrollTop - lastScrollTop.current)
      
      // Only trigger if scroll distance exceeds threshold
      if (scrollDiff > scrollThreshold) {
        // Hide navbar when scrolling down
        if (currentScrollTop > lastScrollTop.current && currentScrollTop > 100) {
          hideNavbar()
        } 
        // Show navbar when scrolling up
        else if (currentScrollTop < lastScrollTop.current) {
          showNavbar()
        }
        
        setIsScrolling(true)
      }
      
      lastScrollTop.current = currentScrollTop
    }

    // Click event handler - show navbar when user clicks screen
    const handleClick = (e) => {
      // If clicking on navbar itself, don't handle
      if (e.target.closest('.fixed.bottom-0')) return
      
      showNavbar()
    }

    // Touch event handler - mobile swipe
    const handleTouchStart = () => {
      setIsScrolling(true)
    }

    const handleTouchMove = () => {
      // Hide navbar on touch swipe
      hideNavbar()
    }

    const handleTouchEnd = () => {
      // Show navbar after touch ends
      setTimeout(() => {
        showNavbar()
      }, 500)
    }

    // Keyboard event handler - show navbar when user presses any key
    const handleKeyDown = () => {
      showNavbar()
    }

    // Mouse move handler - show navbar when mouse moves to bottom area
    const handleMouseMove = (e) => {
      // If mouse moves to bottom area, show navbar
      if (e.clientY > window.innerHeight - 100) {
        showNavbar()
      }
    }

    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true })
    document.addEventListener('click', handleClick)
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousemove', handleMouseMove)

    // Initially show navbar
    showNavbar()

    // Cleanup function
    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('click', handleClick)
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousemove', handleMouseMove)
      
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, []) // Empty dependency array because we use ref to track state

  return (
    <>
      {/* Page preview tooltip */}
      <AnimatePresence>
        {hoveredPath && pagePreviews[hoveredPath] && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed z-50 pointer-events-none"
            style={{
              left: `${hoverPosition.x}px`,
              bottom: '80px',
              transform: 'translateX(-50%)'
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-48 overflow-hidden">
              <div className="bg-gradient-to-r from-cyber-blue to-cyber-purple p-2 text-center">
                <div className="text-white text-xs font-medium">
                  {pagePreviews[hoveredPath].title}
                  <span className="block text-white/70">{pagePreviews[hoveredPath].titleEn}</span>
                </div>
                <div className="text-white/70 text-xs">
                  {pagePreviews[hoveredPath].description}
                </div>
                <div className="text-white/50 text-[10px]">
                  {pagePreviews[hoveredPath].descriptionEn}
                </div>
              </div>
              {pagePreviews[hoveredPath].preview}
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute left-1/2 -translate-x-1/2 bottom-0"
              style={{ transform: 'translateX(-50%) rotate(45deg)' }}
            >
              <div className="w-3 h-3 bg-white border-r border-b border-gray-200" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "+" Button feature selection panel */}
      <AnimatePresence>
        {showPlusMenu && (
          <>
            {/* Semi-transparent overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
              onClick={() => setShowPlusMenu(false)}
            />
            {/* Bottom popup panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[10001] bg-gradient-to-t from-[#0a0a2e] to-[#1a1a4e] rounded-t-3xl border-t border-cyber-blue/30 shadow-2xl"
            >
              {/* Drag indicator */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              {/* Title */}
              <div className="px-6 pb-1">
                <h3 className="text-lg font-bold text-white text-center">✨ Select Feature</h3>
                <p className="text-xs text-white/50 text-center mt-0.5">Click to select a tool</p>
              </div>

              {/* Menu items */}
              <div className="px-4 pb-6 pt-3 space-y-3">
                {plusMenuItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handlePlusMenuItem(item.path)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyber-blue/50 hover:bg-white/10 transition-all duration-200 text-left group"
                  >
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                      <span className="text-2xl">{item.icon}</span>
                    </div>
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold text-sm whitespace-pre-line">{item.label}</div>
                      <div className="text-white/40 text-xs mt-0.5 whitespace-pre-line">{item.description}</div>
                    </div>
                    {/* Arrow */}
                    <span className="text-white/30 text-lg flex-shrink-0 group-hover:text-cyber-blue group-hover:translate-x-1 transition-all duration-200">→</span>
                  </motion.button>
                ))}
              </div>

              {/* Close button */}
              <div className="px-4 pb-8">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowPlusMenu(false)}
                  className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:text-white hover:border-white/20 transition-all duration-200"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom navigation bar - supports auto-hide */}
      <AnimatePresence>
        <motion.div 
          initial={{ y: 0 }}
          animate={{ y: isNavbarVisible ? 0 : 100 }}
          exit={{ y: 100 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.3 
          }}
          className="fixed bottom-0 left-0 right-0 glass-effect border-t border-cyber-blue/50 z-[10000]"
        >
          {/* Hidden state indicator - shows a small hint to user */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: !isNavbarVisible ? 1 : 0, 
              y: !isNavbarVisible ? 0 : 10 
            }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full px-3 py-1 bg-cyber-dark/80 backdrop-blur-sm rounded-t-lg text-xs text-cyber-blue/70 pointer-events-none"
          >
            👆 Tap to restore
          </motion.div>
          {/* ========== 积分充值条（登录后可见） ========== */}
          <AnimatePresence>
            {isLoggedIn && showRechargeBanner && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-2 border-b border-cyber-blue/20 bg-gradient-to-r from-yellow-500/5 to-orange-500/5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">⭐</span>
                    <span className="text-xs text-cyber-blue/70">
                      Balance: <span className="font-bold text-cyber-yellow">{points.toLocaleString()}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/recharge')}
                      className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-white text-xs font-bold shadow-md"
                    >
                      <span>💎</span>
                      <span>Recharge</span>
                    </motion.button>
                    <button
                      onClick={() => setShowRechargeBanner(false)}
                      className="text-white/30 hover:text-white/60 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full flex items-center justify-around">
          {/* Left 3 nav items: Home, Feed, Shop */}
          {navItems.slice(0, 3).map((item) => {
            const isActive = location.pathname === item.path
            const isLocked = item.locked && !isLoggedIn
            
            return (
              <motion.button
                key={item.path}
                whileHover={!isLocked ? { scale: 1.05 } : {}}
                whileTap={!isLocked ? { scale: 0.95 } : {}}
                onClick={() => handleClick(item.path)}
                onMouseEnter={(e) => !isLocked && handleMouseEnter(item.path, e)}
                onMouseLeave={() => setHoveredPath(null)}
                disabled={isLocked}
                className={`
                  flex-1 py-3 flex flex-col items-center gap-1 transition-colors duration-200 relative min-h-[60px]
                  ${isActive && !isLocked ? 'text-cyber-blue' : ''}
                  ${isLocked ? 'text-gray-600 cursor-not-allowed' : ''}
                  ${!isLocked && !isActive ? 'text-cyber-blue/50' : ''}
                `}
              >
                {isLocked ? (
                  <div className="relative">
                    <span className="text-2xl opacity-40">{item.icon}</span>
                    <span className="absolute -top-1 -right-1 text-xs text-gray-500">🔒</span>
                  </div>
                ) : (
                  <>
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-xs font-medium opacity-70">{item.label}</span>
                    <span className="text-[10px] opacity-40">{item.labelEn}</span>
                  </>
                )}
                {isActive && !isLocked && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 w-10 h-1 bg-gradient-to-r from-cyber-blue to-cyber-purple rounded-full shadow-lg shadow-cyber-blue/50"
                  />
                )}
              </motion.button>
            )
          })}

          {/* Center "+" button - opens feature selection panel */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleClick('/upload')}
            className="relative -mt-6 z-10 flex-none w-auto"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={showPlusMenu ? { rotate: 45 } : { rotate: 0 }}
              transition={{ duration: 0.25 }}
              className="w-16 h-16 bg-gradient-to-br from-cyber-blue to-cyber-purple rounded-full flex items-center justify-center shadow-lg shadow-cyber-blue/50 border-4 border-cyber-dark"
            >
              <span className="text-4xl text-cyber-dark font-bold leading-none -mt-1 neon-text">+</span>
            </motion.div>
          </motion.button>

          {/* Right 4 nav items: Game, Social, Profile + Login/Logout */}
          {navItems.slice(3, 6).map((item) => {
            const isActive = location.pathname === item.path
            const isLocked = item.locked && !isLoggedIn
            
            return (
              <motion.button
                key={item.path}
                whileHover={!isLocked ? { scale: 1.05 } : {}}
                whileTap={!isLocked ? { scale: 0.95 } : {}}
                onClick={() => handleClick(item.path)}
                onMouseEnter={(e) => !isLocked && handleMouseEnter(item.path, e)}
                onMouseLeave={() => setHoveredPath(null)}
                disabled={isLocked}
                className={`
                  flex-1 py-3 flex flex-col items-center gap-1 transition-colors duration-200 relative min-h-[60px]
                  ${isActive && !isLocked ? 'text-cyber-blue' : ''}
                  ${isLocked ? 'text-gray-600 cursor-not-allowed' : ''}
                  ${!isLocked && !isActive ? 'text-cyber-blue/50' : ''}
                `}
              >
                {isLocked ? (
                  <div className="relative">
                    <span className="text-2xl opacity-40">{item.icon}</span>
                    <span className="absolute -top-1 -right-1 text-xs text-gray-500">🔒</span>
                  </div>
                ) : (
                  <>
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-xs font-medium opacity-70">{item.label}</span>
                    <span className="text-[10px] opacity-40">{item.labelEn}</span>
                  </>
                )}
                {isActive && !isLocked && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 w-10 h-1 bg-gradient-to-r from-cyber-blue to-cyber-purple rounded-full shadow-lg shadow-cyber-blue/50"
                  />
                )}
              </motion.button>
            )
          })}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAuthClick}
            className={`
              flex-1 py-3 flex flex-col items-center gap-1 transition-colors duration-200 relative min-h-[60px]
              ${isLoggedIn ? 'text-red-500 hover:text-red-400' : 'text-orange-500 hover:text-orange-400'}
            `}
          >
            <span className="text-2xl">{isLoggedIn ? '🚪' : '👤'}</span>
            <span className="text-xs font-medium opacity-70">{isLoggedIn ? 'Logout' : 'Sign In'}</span>
            <span className="text-[10px] opacity-40">{isLoggedIn ? 'Logout' : 'Sign In'}</span>
          </motion.button>
        </div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}

export default Navbar