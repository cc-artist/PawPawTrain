import React, { useState } from 'react'
import { motion } from 'framer-motion'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('stats')

  const stats = {
    totalUsers: 12580,
    todayPosts: 856,
    activePets: 10890,
    totalRevenue: 456780,
    userGrowth: 12.5,
    postGrowth: 8.3,
    engagementRate: 78.5
  }

  const recentPosts = [
    { id: 1, user: '铲屎官小王', content: '今天带狗狗去公园玩...', status: 'published', likes: 234 },
    { id: 2, user: '猫奴日记', content: '小橘又在晒太阳了...', status: 'pending', likes: 0 },
    { id: 3, user: '兔兔爱好者', content: '奶茶今天学会握手了...', status: 'published', likes: 567 },
    { id: 4, user: '柯基控', content: '短腿又要拆家了...', status: 'rejected', likes: 0 }
  ]

  const recentUsers = [
    { id: 1, nickname: '铲屎官小王', phone: '138****1234', level: 15, points: 2500, status: 'active' },
    { id: 2, nickname: '猫奴日记', phone: '139****5678', level: 8, points: 890, status: 'active' },
    { id: 3, nickname: '兔兔爱好者', phone: '136****9012', level: 22, points: 5600, status: 'active' },
    { id: 4, nickname: '柯基控', phone: '137****3456', level: 5, points: 450, status: 'banned' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="gradient-bg p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">📊 管理后台</h1>
        <p className="text-white/80">实时监控平台运营状态</p>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <div className="text-sm text-gray-500 mb-1">总用户数</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsers.toLocaleString()}</div>
            <div className="text-xs text-green-500 mt-1">↑ {stats.userGrowth}%</div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <div className="text-sm text-gray-500 mb-1">今日发帖</div>
            <div className="text-2xl font-bold text-orange-600">{stats.todayPosts}</div>
            <div className="text-xs text-green-500 mt-1">↑ {stats.postGrowth}%</div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <div className="text-sm text-gray-500 mb-1">活跃宠物</div>
            <div className="text-2xl font-bold text-purple-600">{stats.activePets.toLocaleString()}</div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <div className="text-sm text-gray-500 mb-1">总收入</div>
            <div className="text-2xl font-bold text-green-600">¥{stats.totalRevenue.toLocaleString()}</div>
          </motion.div>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-6">
          <div className="flex border-b">
            {['stats', 'users', 'posts', 'products'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'gradient-bg text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab === 'stats' && '📊 数据'}
                {tab === 'users' && '👥 用户'}
                {tab === 'posts' && '📝 内容'}
                {tab === 'products' && '🛍️ 商品'}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === 'stats' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-800 mb-3">📈 核心指标</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                      <div className="text-sm text-gray-500">用户活跃度</div>
                      <div className="text-3xl font-bold text-blue-600">{stats.engagementRate}%</div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4">
                      <div className="text-sm text-gray-500">转化率</div>
                      <div className="text-3xl font-bold text-orange-600">3.2%</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-3">🏆 排行榜</h3>
                  <div className="space-y-2">
                    {['铲屎官小王', '猫奴日记', '兔兔爱好者'].map((name, idx) => (
                      <div key={name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          idx === 0 ? 'bg-yellow-400 text-white' :
                          idx === 1 ? 'bg-gray-400 text-white' :
                          'bg-orange-400 text-white'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 font-medium text-gray-800">{name}</div>
                        <div className="text-sm text-orange-500">12580积分</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-3">
                {recentUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-xl">
                      🐾
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-800">{user.nickname}</div>
                      <div className="text-sm text-gray-500">{user.phone}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-purple-600">Lv.{user.level}</div>
                      <div className="text-xs text-gray-400">{user.points}积分</div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {user.status === 'active' ? '正常' : '封禁'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'posts' && (
              <div className="space-y-3">
                {recentPosts.map(post => (
                  <div key={post.id} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">{post.user}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        post.status === 'published' ? 'bg-green-100 text-green-600' :
                        post.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {post.status === 'published' ? '已发布' : post.status === 'pending' ? '待审核' : '已拒绝'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{post.content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>❤️ {post.likes}</span>
                      {post.status === 'pending' && (
                        <>
                          <button className="text-green-600 font-medium">通过</button>
                          <button className="text-red-600 font-medium">拒绝</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'products' && (
              <div className="space-y-3">
                {[
                  { name: '可爱帽子套装', sales: 1234, revenue: 123400 },
                  { name: '升级到二次元', sales: 567, revenue: 567000 },
                  { name: '宠物毛绒公仔', sales: 89, revenue: 8811 }
                ].map((product, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-2xl">
                      🎁
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{product.name}</div>
                      <div className="text-sm text-gray-500">销量 {product.sales}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">¥{product.revenue.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export { AdminDashboard }
