import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'

const pagePreviews = {
  '/': {
    title: '🐾 我的宠物',
    description: '与你的虚拟宠物互动',
    preview: (
      <div className="p-3">
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-4 mb-2">
          <div className="text-center">
            <span className="text-4xl">🐱</span>
            <div className="text-white text-sm font-medium mt-1">小猫咪</div>
            <div className="text-white/70 text-xs">Lv.10 成长中</div>
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
    title: '📖 动态',
    description: '浏览宠物社区',
    preview: (
      <div className="p-3">
        <div className="bg-white rounded-xl shadow-sm p-3 mb-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">👤</span>
            <div>
              <div className="text-xs font-medium text-gray-800">宠物爱好者</div>
              <div className="text-xs text-gray-400">2小时前</div>
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
    title: '🛍️ 商城',
    description: '购买宠物用品',
    preview: (
      <div className="p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl p-2 text-center text-white">
            <span className="text-2xl">🍖</span>
            <div className="text-xs">高级猫粮</div>
            <div className="text-xs font-bold">¥29.9</div>
          </div>
          <div className="bg-gradient-to-br from-pink-400 to-red-500 rounded-xl p-2 text-center text-white">
            <span className="text-2xl">🎾</span>
            <div className="text-xs">玩具球</div>
            <div className="text-xs font-bold">¥15.9</div>
          </div>
          <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl p-2 text-center text-white">
            <span className="text-2xl">💊</span>
            <div className="text-xs">健康零食</div>
            <div className="text-xs font-bold">¥19.9</div>
          </div>
          <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl p-2 text-center text-white">
            <span className="text-2xl">🛏️</span>
            <div className="text-xs">舒适窝</div>
            <div className="text-xs font-bold">¥49.9</div>
          </div>
        </div>
      </div>
    )
  },
  '/social': {
    title: '👥 社交',
    description: '结识宠物爱好者',
    preview: (
      <div className="p-3">
        <div className="space-y-2">
          <div className="bg-white rounded-xl shadow-sm p-2 flex items-center gap-2">
            <span className="text-2xl">🐕</span>
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-800">铲屎官日记</div>
              <div className="text-xs text-gray-400">有一只金毛犬</div>
            </div>
            <button className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">关注</button>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-2 flex items-center gap-2">
            <span className="text-2xl">🐱</span>
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-800">猫咪乐园</div>
              <div className="text-xs text-gray-400">有三只可爱猫咪</div>
            </div>
            <button className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">关注</button>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-2 flex items-center gap-2">
            <span className="text-2xl">🐰</span>
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-800">兔宝宝之家</div>
              <div className="text-xs text-gray-400">垂耳兔爱好者</div>
            </div>
            <button className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">已关注</button>
          </div>
        </div>
      </div>
    )
  },
  '/profile': {
    title: '👤 我的',
    description: '个人中心',
    preview: (
      <div className="p-3">
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-4 mb-2 text-center text-white">
          <span className="text-4xl">👤</span>
          <div className="font-medium mt-1">宠物爱好者</div>
          <div className="text-xs opacity-70">Lv.25 · 1280积分</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-50 rounded-xl p-2 text-center">
            <div className="text-lg font-bold text-gray-800">12</div>
            <div className="text-xs text-gray-500">动态</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-2 text-center">
            <div className="text-lg font-bold text-gray-800">256</div>
            <div className="text-xs text-gray-500">粉丝</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-2 text-center">
            <div className="text-lg font-bold text-gray-800">189</div>
            <div className="text-xs text-gray-500">关注</div>
          </div>
        </div>
      </div>
    )
  }
}

// "+"按钮弹出的功能菜单项
const plusMenuItems = [
  {
    id: 'pet-creator',
    icon: '🐾',
    label: '虚拟宠物形象生成器',
    description: 'AI生成专属虚拟宠物形象',
    path: '/create-pet',
    gradient: 'from-amber-500 to-orange-500',
    bgLight: 'bg-amber-50',
  },
  {
    id: 'pet-trainer',
    icon: '🎯',
    label: '虚拟宠物动作训练器',
    description: '训练宠物动作与技能',
    path: '/training',
    gradient: 'from-emerald-500 to-teal-500',
    bgLight: 'bg-emerald-50',
  },
  {
    id: 'task-generator',
    icon: '📋',
    label: '养宠任务生成器',
    description: '每日养宠任务与互动',
    path: '/daily',
    gradient: 'from-violet-500 to-purple-500',
    bgLight: 'bg-violet-50',
  },
]

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn, logout, user } = useStore()
  const [hoveredPath, setHoveredPath] = useState(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
  const [showPlusMenu, setShowPlusMenu] = useState(false)

  const navItems = [
    { path: '/', icon: '🏠', label: '首页', locked: true },
    { path: '/feed', icon: '📖', label: '动态', locked: false },
    { path: '/shop', icon: '🛍️', label: '商城', locked: true },
    { path: '/social', icon: '👥', label: '社交', locked: true },
    { path: '/profile', icon: '👤', label: '我的', locked: true },
  ]

  const handleClick = (path) => {
    if (path === '/feed') {
      navigate('/feed')
      return
    }
    
    if (!isLoggedIn) {
      return
    }
    
    if (path === '/upload') {
      // 点击"+"弹出功能选择面板
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

  return (
    <>
      {/* 页面预览悬浮提示 */}
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
                </div>
                <div className="text-white/70 text-xs">
                  {pagePreviews[hoveredPath].description}
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

      {/* "+"按钮功能选择面板 */}
      <AnimatePresence>
        {showPlusMenu && (
          <>
            {/* 半透明遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
              onClick={() => setShowPlusMenu(false)}
            />
            {/* 底部弹出面板 */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[10001] bg-gradient-to-t from-[#0a0a2e] to-[#1a1a4e] rounded-t-3xl border-t border-cyber-blue/30 shadow-2xl"
            >
              {/* 拖拽指示条 */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              {/* 标题 */}
              <div className="px-6 pb-1">
                <h3 className="text-lg font-bold text-white text-center">✨ 选择功能</h3>
                <p className="text-xs text-white/50 text-center mt-0.5">点击选择要使用的工具</p>
              </div>

              {/* 菜单项 */}
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
                    {/* 图标 */}
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                      <span className="text-2xl">{item.icon}</span>
                    </div>
                    {/* 文字 */}
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold text-sm">{item.label}</div>
                      <div className="text-white/40 text-xs mt-0.5">{item.description}</div>
                    </div>
                    {/* 箭头 */}
                    <span className="text-white/30 text-lg flex-shrink-0 group-hover:text-cyber-blue group-hover:translate-x-1 transition-all duration-200">→</span>
                  </motion.button>
                ))}
              </div>

              {/* 关闭按钮 */}
              <div className="px-4 pb-8">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowPlusMenu(false)}
                  className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:text-white hover:border-white/20 transition-all duration-200"
                >
                  取消
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 glass-effect border-t border-cyber-blue/50 z-[10000]">
        <div className="w-full flex items-center justify-around">
          {/* 左侧3个导航项：首页、动态、商城 */}
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

          {/* 中央 + 按钮 - 点击弹出功能选择面板 */}
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

          {/* 右侧3个导航项：社交、我的 + 登录/注册 */}
          {navItems.slice(3, 5).map((item) => {
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
            <span className="text-2xl">{isLoggedIn ? '🚪' : ''}</span>
            <span className="text-xs font-medium opacity-70">{isLoggedIn ? '登出' : '注册/登录'}</span>
          </motion.button>
        </div>
      </div>
    </>
  )
}

export default Navbar