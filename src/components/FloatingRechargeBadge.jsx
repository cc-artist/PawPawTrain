import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'

/**
 * 浮动充值入口组件
 * 统一在页面显眼位置展示积分余额 + 快捷充值入口
 * 适用于没有底部 Navbar 的页面
 */
const FloatingRechargeBadge = ({ className = '', variant = 'default' }) => {
  const navigate = useNavigate()
  const { user, pet } = useStore()

  // 优先使用 user.points，兜底使用 pet.points
  const points = user?.points ?? pet?.points ?? 0

  const handleRecharge = () => {
    navigate('/recharge')
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`fixed top-4 right-4 z-[9999] ${className}`}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRecharge}
          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-md rounded-full border border-yellow-400/50 shadow-lg shadow-orange-500/25 cursor-pointer"
        >
          {/* 积分余额 */}
          <span className="text-white font-bold text-sm flex items-center gap-1">
            <span className="text-base">⭐</span>
            <span>{points.toLocaleString()}</span>
          </span>
          {/* 分割线 */}
          <span className="w-px h-4 bg-white/30" />
          {/* 充值按钮 */}
          <span className="text-white font-semibold text-sm flex items-center gap-1">
            <span>💎</span>
            <span>Recharge</span>
          </span>
        </motion.button>
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * 紧凑型积分充值条 —— 适合嵌入页面头部
 */
export const RechargeBar = ({ onRecharge, points, className = '' }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onRecharge) {
      onRecharge()
    } else {
      navigate('/recharge')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${className}`}
    >
      <button
        onClick={handleClick}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-400/30 rounded-xl hover:bg-yellow-500/20 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">⭐</span>
          <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
            Balance: <span className="font-bold">{points.toLocaleString()}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg text-white text-sm font-bold shadow-md">
          <span>💎</span>
          <span>Recharge</span>
        </div>
      </button>
    </motion.div>
  )
}

export default FloatingRechargeBadge
