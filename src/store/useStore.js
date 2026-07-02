import { create } from 'zustand'

const PET_STORAGE_KEY = 'paw_train_pet_state'
const USER_STORAGE_KEY = 'paw_train_user_state'
const PAGE_STATES_KEY = 'paw_train_page_states'

const useStore = create((set, get) => ({
  user: null,
  pet: null,
  isLoggedIn: false,
  isLoadingPet: false,
  isLoadingUser: false,
  pageStates: {},
  
  initializeSession: () => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem(USER_STORAGE_KEY)
    let savedPet = localStorage.getItem(PET_STORAGE_KEY)
    
    // 如果没有宠物数据，创建一个默认宠物供展示
    if (!savedPet) {
      const defaultPet = {
        type: 'cat',
        name: '爪爪',
        personality: 'gentle',
        level: 5,
        exp: 45,
        expToNext: 200,
        points: 100,
        intimacy: 75,
        hunger: 80,
        joy: 85,
        energy: 90,
        health: 100,
        discipline: 60,
        exploration: 30,
        affection: 75,
        learnedSkills: [
          { id: 1, name: '撒娇', animation: 'squint' },
          { id: 2, name: '打滚', animation: 'roll' }
        ],
        imageUrl: null,
        voice: null
      }
      localStorage.setItem(PET_STORAGE_KEY, JSON.stringify(defaultPet))
      savedPet = JSON.stringify(defaultPet)
    }
    
    // 始终加载宠物数据（无需登录也可查看宠物主页）
    try {
      const pet = JSON.parse(savedPet)
      if (pet && pet.type) {
        set({ pet })
      }
    } catch (e) {
      console.error('Failed to parse pet data')
    }
    
    // 只有在 token 和 user 数据同时存在时才设置登录状态
    // 仅有 token 没有 user 数据时，交由 ProtectedRoute 做实际鉴权
    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser)
        if (user && user.id) {
          set({ user, isLoggedIn: true })
        }
      } catch (e) {
        console.error('Failed to parse saved user, clearing invalid data:', e)
        localStorage.removeItem('token')
        localStorage.removeItem(USER_STORAGE_KEY)
      }
    }
  },
  
  setUser: (user) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    set({ user, isLoggedIn: true })
  },
  
  setToken: (token) => {
    localStorage.setItem('token', token)
  },
  
  fetchPet: async () => {
    set({ isLoadingPet: true })
    try {
      const response = await fetch('/api/pet/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        if (data.pet) {
          const petData = data.pet
          localStorage.setItem(PET_STORAGE_KEY, JSON.stringify(petData))
          set({ pet: petData })
        }
      }
    } catch (error) {
      console.log('获取宠物信息失败')
    } finally {
      set({ isLoadingPet: false })
    }
  },
  
  setPet: (pet) => {
    localStorage.setItem(PET_STORAGE_KEY, JSON.stringify(pet))
    set({ pet })
  },
  
  logout: () => {
    localStorage.removeItem(PET_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
    localStorage.removeItem('token')
    localStorage.removeItem(PAGE_STATES_KEY)
    set({ user: null, pet: null, isLoggedIn: false, pageStates: {} })
  },
  
  updatePetStats: (stats) => {
    const currentPet = get().pet
    const updatedPet = currentPet ? { ...currentPet, ...stats } : null
    if (updatedPet) {
      localStorage.setItem(PET_STORAGE_KEY, JSON.stringify(updatedPet))
      set({ pet: updatedPet })
    }
  },
  
  updatePetPersonality: (personalityBoost, petFeatures) => {
    const currentPet = get().pet
    if (!currentPet) return

    const updatedPet = {
      ...currentPet,
      ...(petFeatures || {}),
      energy: Math.min(100, Math.max(0, (currentPet.energy || 50) + (personalityBoost.energy || 0))),
      affection: Math.min(100, Math.max(0, (currentPet.affection || 50) + (personalityBoost.affection || 0))),
      joy: Math.min(100, Math.max(0, (currentPet.joy || 50) + (personalityBoost.joy || 0))),
      hunger: Math.min(100, Math.max(0, (currentPet.hunger || 70) + (personalityBoost.hunger || 0))),
      discipline: Math.min(100, Math.max(0, (currentPet.discipline || 50) + (personalityBoost.discipline || 0))),
      exp: (currentPet.exp || 0) + 10,
      points: (currentPet.points || 0) + 5
    }

    if (updatedPet.exp >= (updatedPet.expToNext || 100)) {
      updatedPet.level = (updatedPet.level || 1) + 1
      updatedPet.exp = updatedPet.exp - (updatedPet.expToNext || 100)
      updatedPet.expToNext = Math.floor((updatedPet.expToNext || 100) * 1.2)
    }

    localStorage.setItem(PET_STORAGE_KEY, JSON.stringify(updatedPet))
    set({ pet: updatedPet })
  },
  
  updateUserPoints: (points) => set((state) => ({
    user: state.user ? { ...state.user, points } : null
  })),
  
  // 页面状态持久化：切换页面时保留录入/上传痕迹
  initializePageStates: () => {
    const savedStates = localStorage.getItem(PAGE_STATES_KEY)
    if (savedStates) {
      try {
        const states = JSON.parse(savedStates)
        set({ pageStates: states })
      } catch (e) {
        localStorage.removeItem(PAGE_STATES_KEY)
      }
    }
  },
  
  savePageState: (key, state) => {
    const current = get().pageStates
    const updated = { ...current, [key]: state }
    localStorage.setItem(PAGE_STATES_KEY, JSON.stringify(updated))
    set({ pageStates: updated })
  },
  
  getPageState: (key) => {
    return get().pageStates[key] || null
  },
  
  clearPageState: (key) => {
    const current = get().pageStates
    const updated = { ...current }
    delete updated[key]
    localStorage.setItem(PAGE_STATES_KEY, JSON.stringify(updated))
    set({ pageStates: updated })
  },
  
  clearAllPageStates: () => {
    localStorage.removeItem(PAGE_STATES_KEY)
    set({ pageStates: {} })
  }
}))

export default useStore