import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { authAPI } from '../services/api'
import { t } from '../utils/i18n'

// 生成模拟 JWT token（用于无后端场景）
const generateMockToken = (userId, email) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({
    sub: userId,
    email: email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 30
  }))
  return `${header}.${payload}.mock-signature`
}

// 客户端模拟登录（后端不可用时使用）
const mockLogin = (email, password) => {
  const savedUsers = JSON.parse(localStorage.getItem('paw_train_users') || '{}')
  const user = savedUsers[email]
  if (!user) {
    throw new Error('账号不存在，请先注册')
  }
  if (user.password !== password) {
    throw new Error('密码错误')
  }
  const token = generateMockToken(user.id, email)
  return { token, user: { id: user.id, name: user.name, email, avatar: user.avatar, points: user.points || 0 } }
}

// 客户端模拟注册（后端不可用时使用）
const mockRegister = (email, password, name, avatar) => {
  const savedUsers = JSON.parse(localStorage.getItem('paw_train_users') || '{}')
  if (savedUsers[email]) {
    throw new Error('该邮箱已注册')
  }
  const userId = 'user_' + Date.now()
  const newUser = { id: userId, name, email, password, avatar, points: 500 }
  savedUsers[email] = newUser
  localStorage.setItem('paw_train_users', JSON.stringify(savedUsers))
  const token = generateMockToken(userId, email)
  return { token, user: { id: userId, name, email, avatar, points: 500 } }
}

const Login = () => {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(null)
  const [previewAvatar, setPreviewAvatar] = useState(null)
  const [loading, setLoading] = useState(false)
  const { setUser, setPet, setToken } = useStore()
  const navigate = useNavigate()

  const avatarOptions = [
    '🐱', '🐶', '🐰', '🐻', '🐼', '🐨', 
    '🦊', '🦁', '🐯', '🐮', '🐷', '🐸'
  ]

  const handleAvatarSelect = (avatar) => {
    setAvatar(avatar)
    setPreviewAvatar(avatar)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (mode === 'register') {
        if (!name.trim()) {
          alert('请输入用户名')
          setLoading(false)
          return
        }
        if (!email || !password) {
          alert('请填写邮箱和密码')
          setLoading(false)
          return
        }
        
        let result
        // 先尝试后端API，失败则用客户端模拟
        try {
          const res = await authAPI.register({ email, password, name: name.trim(), avatar })
          result = { token: res.data.token, user: res.data.user }
        } catch (apiErr) {
          console.log('后端API不可用，使用客户端注册')
          result = mockRegister(email, password, name.trim(), avatar || '🐾')
        }
        
        localStorage.setItem('token', result.token)
        setUser(result.user)
        setTimeout(() => { window.location.href = '/' }, 300)
      } else {
        if (!email || !password) {
          alert('请填写邮箱和密码')
          setLoading(false)
          return
        }
        
        let result
        // 先尝试后端API，失败则用客户端模拟
        try {
          const res = await authAPI.login({ email, password })
          result = { token: res.data.token, user: res.data.user, pet: res.data.pet }
        } catch (apiErr) {
          console.log('后端API不可用，使用客户端登录')
          result = mockLogin(email, password)
        }
        
        localStorage.setItem('token', result.token)
        setUser(result.user)
        if (result.pet) setPet(result.pet)
        setTimeout(() => { window.location.href = '/' }, 300)
      }
    } catch (err) {
      console.error('Auth error:', err)
      alert(err.message || '操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setLoading(true)
    try {
      let result
      try {
        const res = await authAPI.login({ email: 'demo@example.com', password: 'demo123' })
        result = { token: res.data.token, user: res.data.user, pet: res.data.pet }
      } catch (apiErr) {
        console.log('后端API不可用，使用客户端演示登录')
        // 确保demo账号存在
        const savedUsers = JSON.parse(localStorage.getItem('paw_train_users') || '{}')
        if (!savedUsers['demo@example.com']) {
          savedUsers['demo@example.com'] = { id: 'demo-user', name: '演示用户', email: 'demo@example.com', password: 'demo123', avatar: '🐾', points: 1000 }
          localStorage.setItem('paw_train_users', JSON.stringify(savedUsers))
        }
        result = mockLogin('demo@example.com', 'demo123')
      }
      
      localStorage.setItem('token', result.token)
      setUser(result.user)
      if (result.pet) setPet(result.pet)
      
      setTimeout(() => { window.location.href = '/' }, 300)
    } catch (err) {
      console.error('Demo login error:', err)
      alert('演示登录失败: ' + (err.message || '未知错误'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center gradient-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ float: true }}
            className="text-6xl mb-4"
          >
            🐾
          </motion.div>
          <h1 className="text-3xl font-bold text-orange-600 mb-2">{t('login.title')}</h1>
          <p className="text-orange-50">{t('login.subtitle')}</p>
        </div>

        <div className="glass-effect rounded-3xl p-8 warm-shadow">
          <div className="flex mb-6 bg-orange-50 rounded-2xl p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-xl font-medium transition-all ${mode === 'login' ? 'bg-white shadow-md text-orange-500' : 'text-orange-400'}`}
            >
              {t('login.login')}
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-xl font-medium transition-all ${mode === 'register' ? 'bg-white shadow-md text-orange-500' : 'text-orange-400'}`}
            >
              {t('login.register')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{mode === 'login' ? '用户名/邮箱' : '邮箱'}</label>
              <input
                type={mode === 'login' ? 'text' : 'email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                placeholder={mode === 'login' ? '输入用户名或邮箱' : t('login.enterEmail')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{t('login.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                placeholder={t('login.enterPassword')}
                required
              />
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">用户名</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                    placeholder="设置您的用户名"
                    required
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">选择头像</label>
                  <div className="grid grid-cols-6 gap-2">
                    {avatarOptions.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleAvatarSelect(emoji)}
                        className={`text-3xl p-2 rounded-xl transition-all ${
                          previewAvatar === emoji 
                            ? 'bg-orange-100 scale-110 ring-2 ring-orange-400' 
                            : 'bg-gray-50 hover:bg-orange-50'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  {previewAvatar && (
                    <div className="mt-2 text-center text-sm text-gray-500">
                      已选择: <span className="text-2xl">{previewAvatar}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold rounded-xl hover:from-orange-500 hover:to-orange-600 transition-all warm-shadow disabled:opacity-50"
            >
              {loading ? t('login.loading') : mode === 'login' ? t('login.login') : t('login.register')}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-orange-200" />
            <span className="text-orange-400 text-sm">或</span>
            <div className="flex-1 h-px bg-orange-200" />
          </div>

          <div className="space-y-3">
            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyber-blue to-cyber-purple text-white font-bold rounded-xl hover:from-cyber-blue/80 hover:to-cyber-purple/80 transition-all flex items-center justify-center gap-2 neon-text disabled:opacity-50"
            >
              <span className="text-xl">🐾</span>
              快速登录演示账号
            </button>

            <button
              onClick={() => alert('Facebook登录功能正在开发中，敬请期待！')}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-xl">📘</span>
              用Facebook登录
            </button>

            <button
              onClick={() => alert('WhatsApp登录功能正在开发中，敬请期待！')}
              className="w-full py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-xl">💬</span>
              用WhatsApp登录
            </button>

            <button
              onClick={() => alert('Google登录功能正在开发中，敬请期待！')}
              className="w-full py-3 bg-white text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 border border-gray-200"
            >
              <span className="text-xl">🔍</span>
              用Google登录
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/feed')}
            className="text-orange-400 hover:text-orange-300 font-medium transition-colors underline"
          >
            📖 先浏览POSTS看看
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
