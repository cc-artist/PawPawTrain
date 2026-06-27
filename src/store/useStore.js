import { create } from 'zustand'

const PET_STORAGE_KEY = 'paw_train_pet_state'
const USER_STORAGE_KEY = 'paw_train_user_state'

const useStore = create((set, get) => ({
  user: null,
  pet: null,
  isLoggedIn: false,
  isLoadingPet: false,
  isLoadingUser: false,
  
  initializeSession: () => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem(USER_STORAGE_KEY)
    const savedPet = localStorage.getItem(PET_STORAGE_KEY)
    
    if (token) {
      try {
        if (savedUser) {
          const user = JSON.parse(savedUser)
          set({ user, isLoggedIn: true })
        } else {
          set({ isLoggedIn: true })
        }
        
        if (savedPet) {
          const pet = JSON.parse(savedPet)
          set({ pet })
        }
      } catch (e) {
        console.error('Failed to initialize session:', e)
        localStorage.removeItem('token')
        localStorage.removeItem(USER_STORAGE_KEY)
        localStorage.removeItem(PET_STORAGE_KEY)
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
    set({ user: null, pet: null, isLoggedIn: false })
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
  }))
}))

export default useStore