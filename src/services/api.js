import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000  // 增加到2分钟，图像生成API可能需要较长时间
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  wechatLogin: (code) => api.post('/auth/wechat', { code }),
  getProfile: () => api.get('/auth/profile')
}

export const petAPI = {
  adopt: (data) => api.post('/pet/adopt', data),
  getPet: () => api.get('/pet/my'),
  feed: () => api.post('/pet/feed'),
  pet: () => api.post('/pet/pet'),
  getStats: () => api.get('/pet/stats'),
  getPets: () => api.get('/pets'),
  getPetById: (id) => api.get(`/pets/${id}`),
  createPet: (data) => api.post('/pets', data),
  interact: (action) => api.post('/pets/pet-1/interact', { action })
}

export const contentAPI = {
  upload: (formData) => api.post('/content/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getList: (params) => api.get('/content/list', { params }),
  getMyContent: () => api.get('/content/my')
}

export const socialAPI = {
  getFriends: () => api.get('/social/friends'),
  addFriend: (userId) => api.post('/social/friends', { userId }),
  getCoopPets: () => api.get('/social/coop'),
  startCoop: (friendId, petId) => api.post('/social/coop', { friendId, petId })
}

export const shopAPI = {
  getItems: () => api.get('/shop/items'),
  buyItem: (itemId, usePoints) => api.post('/shop/buy', { itemId, usePoints }),
  getInventory: () => api.get('/shop/inventory')
}

export const chatAPI = {
  sendMessage: (message) => api.post('/pets/pet-1/chat', { message }),
  getHistory: () => api.get('/chat/history')
}

export const aiAPI = {
  analyzeImage: (imageBase64, content) => api.post('/ai/analyze-image', { image_base64: imageBase64, content }),
  getPetTypes: () => api.get('/ai/pet-types')
}

// 训练相关API
export const trainingAPI = {
  uploadVideos: (formData) => api.post('/training/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 180000,
  }),
  getStatus: (taskId) => api.get(`/training/status/${taskId}`),
  getHistory: () => api.get('/training/history'),
  getPosts: () => api.get('/training/posts'),
  getAnalysis: (taskId) => api.get(`/training/analysis/${taskId}`),
}

// 任务相关API
export const tasksAPI = {
  analyze: (formData) => api.post('/tasks/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 180000,
  }),
  generate: (data) => api.post('/tasks/generate', data),
  complete: (taskId, taskBatchId) => api.post('/tasks/complete', { taskId, taskBatchId }),
  getCurrent: () => api.get('/tasks/current'),
  getHistory: () => api.get('/tasks/history'),
  getAdvice: () => api.get('/tasks/advice'),
  getFeedbackLoop: () => api.get('/tasks/feedback-loop'),
}

// 帖子相关API
export const postsAPI = {
  create: (formData) => api.post('/posts/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getFeed: (params) => api.get('/posts/feed', { params }),
  recordView: (postId, postFeatures) => api.post('/posts/record-view', { postId, postFeatures }),
  getUserPreferences: () => api.get('/posts/user-preferences'),
}

export default api
