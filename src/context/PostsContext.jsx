import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const STORAGE_KEY = 'paw_train_all_posts'

const PostsContext = createContext()

export const usePosts = () => {
  const context = useContext(PostsContext)
  if (!context) {
    throw new Error('usePosts must be used within a PostsProvider')
  }
  return context
}

export function PostsProvider({ children }) {
  const [posts, setPosts] = useState(() => {
    // 从 localStorage 恢复用户帖子（不删除！）
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (e) {
      console.error('Failed to parse saved posts:', e)
    }
    return []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        console.log('Fetching posts from API...')
        const response = await api.get('/posts/feed')
        console.log('API response:', response.data)
        
        if (response.data.success && response.data.posts) {
          const apiPosts = response.data.posts.map(post => {
            let features = {
              breed: '宠物',
              color: '未知',
              expression: '开心',
              emotion: 'positive',
              personalityBoost: { energy: 5, affection: 5, joy: 5, hunger: 5, discipline: 5 },
              petType: 'cat'
            }
            
            try {
              if (post.ai_features_json) {
                features = JSON.parse(post.ai_features_json)
              }
            } catch (e) {
              console.error('Failed to parse ai_features_json:', e)
            }
            
            return {
              id: post.id,
              user: { 
                name: post.user_nickname || '用户', 
                avatar: '👤' 
              },
              media: post.media_url || '🐾',
              content: post.content || '',
              likes: post.likes || 0,
              comments: post.comments || 0,
              shares: post.shares || 0,
              favorites: 0,
              time: '刚刚',
              features: features,
              isMine: post.isMine || false
            }
          })
          
          console.log('Processed API posts:', apiPosts)
          
          setPosts(prevPosts => {
            const combinedPosts = [...apiPosts, ...prevPosts]
            const uniquePosts = combinedPosts.filter((post, index, self) =>
              index === self.findIndex(p => p.id === post.id)
            )
            console.log('Combined posts:', uniquePosts.length)
            return uniquePosts
          })
        }
      } catch (error) {
        console.error('Failed to fetch posts from API:', error)
        console.error('Error details:', error.response?.data || error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  const addPost = (newPost) => {
    const updatedPosts = [newPost, ...posts]
    setPosts(updatedPosts)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts))
  }

  return (
    <PostsContext.Provider value={{ posts, addPost, setPosts, loading }}>
      {children}
    </PostsContext.Provider>
  )
}

export default PostsContext
