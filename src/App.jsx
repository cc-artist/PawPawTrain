import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Feed from './pages/Feed'
import Shop from './pages/Shop'
import Social from './pages/Social'
import Profile from './pages/Profile'
import Adopt from './pages/Adopt'
import Login from './pages/Login'
import AIGoodsDesigner from './pages/AIGoodsDesigner'
import TaskHistory from './pages/TaskHistory'
import UploadPage from './pages/UploadPage'
import DailyUploadPage from './pages/DailyUploadPage'
import CreatePetPage from './pages/CreatePetPage'
import RechargePage from './pages/RechargePage'
import TrainingPage from './pages/TrainingPage'
import TrainingHistory from './pages/TrainingHistory'
import PetsPage from './pages/PetsPage'
import GenerationHistory from './pages/GenerationHistory'
import { UploadProvider } from './context/UploadContext'
import PetPostUploader from './components/PetPostUploader'
import { useUpload } from './context/UploadContext'
import useStore from './store/useStore'
import { authAPI } from './services/api'
import { PostsProvider, usePosts } from './context/PostsContext'

function UploadModal() {
  const { showUpload, closeUpload, openUpload } = useUpload()
  const { addPost } = usePosts()
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('showUpload') === 'true') {
      openUpload()
      setSearchParams({})
    }
  }, [searchParams, openUpload, setSearchParams])

  const handlePost = (newPost) => {
    addPost(newPost)
    closeUpload()
  }

  return (
    <PetPostUploader
      isOpen={showUpload}
      onClose={closeUpload}
      onPost={handlePost}
      currentPet={null}
    />
  )
}

function PublicLayout({ children }) {
  return (
    <div className="min-h-full">
      {children}
      <Navbar />
    </div>
  )
}

function AppLayout({ children }) {
  return (
    <div className="min-h-full">
      {children}
      <Navbar />
      <UploadModal />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { isLoggedIn, setUser, setPet } = useStore()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      
      if (!token) {
        setIsCheckingAuth(false)
        return
      }
      
      if (isLoggedIn) {
        setIsCheckingAuth(false)
        return
      }
      
      try {
        const res = await authAPI.getProfile()
        if (isMounted) {
          setUser(res.data.user)
          if (res.data.pet) {
            setPet(res.data.pet)
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        // 后端不可用时，尝试从localStorage恢复用户
        const savedUser = localStorage.getItem('paw_train_user_state')
        if (savedUser) {
          try {
            const user = JSON.parse(savedUser)
            if (isMounted) {
              setUser(user)
            }
            console.log('从本地恢复用户信息')
          } catch (parseErr) {
            // 数据损坏才清除
            localStorage.removeItem('token')
            localStorage.removeItem('paw_train_user_state')
            localStorage.removeItem('paw_train_pet_state')
          }
        }
        // 如果token存在但无法恢复，不清除token，允许降级处理
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false)
        }
      }
    }

    const timeout = setTimeout(() => {
      console.warn('Auth check timeout, proceeding with token-based login state')
      const token = localStorage.getItem('token')
      if (token && !isLoggedIn) {
        setUser({ id: 'temp-user', name: '用户', points: 0 })
      }
      setIsCheckingAuth(false)
    }, 5000)

    checkAuth()

    return () => {
      isMounted = false
      clearTimeout(timeout)
    }
  }, [isLoggedIn, setUser, setPet])

  if (isCheckingAuth) {
    return (
      <div className="min-h-full flex items-center justify-center gradient-bg">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-4xl"
        >
          🐾
        </motion.div>
      </div>
    )
  }

  if (!isLoggedIn && !localStorage.getItem('token')) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gradient-bg p-4">
        <div className="text-6xl mb-4 opacity-30">🔒</div>
        <p className="text-white/40 text-center text-sm">此功能需要登录后使用</p>
      </div>
    )
  }

  return children
}

function AppContent() {
  const { initializeSession } = useStore()
  
  useEffect(() => {
    initializeSession()
  }, [initializeSession])
  
  return (
    <PostsProvider>
      <UploadProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route 
            path="/feed" 
            element={<PublicLayout><Feed /></PublicLayout>}
          />
          
          <Route 
            path="/" 
            element={<PublicLayout><Home /></PublicLayout>}
          />
          <Route 
            path="/shop" 
            element={
              <ProtectedRoute>
                <AppLayout><Shop /></AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/social" 
            element={
              <ProtectedRoute>
                <AppLayout><Social /></AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <AppLayout><Profile /></AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/adopt" 
            element={
              <ProtectedRoute>
                <Adopt />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ai-goods" 
            element={
              <ProtectedRoute>
                <AppLayout><AIGoodsDesigner /></AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/task-history" 
            element={
              <ProtectedRoute>
                <AppLayout><TaskHistory /></AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/upload" 
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/create-pet" 
            element={
              <ProtectedRoute>
                <AppLayout><CreatePetPage /></AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/daily" 
            element={
              <ProtectedRoute>
                <DailyUploadPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/training" 
            element={
              <ProtectedRoute>
                <TrainingPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/training-history" 
            element={
              <ProtectedRoute>
                <TrainingHistory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pets" 
            element={
              <ProtectedRoute>
                <PetsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/history" 
            element={
              <ProtectedRoute>
                <GenerationHistory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recharge" 
            element={
              <ProtectedRoute>
                <RechargePage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </UploadProvider>
    </PostsProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App