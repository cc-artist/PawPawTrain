import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { contentAPI } from '../services/api'
import useStore from '../store/useStore'

const Publish = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [todayCount] = useState(0)
  const { user, updateUserPoints, updatePetStats } = useStore()

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedFile) return
    setLoading(true)
    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('description', description)
    try {
      const res = await contentAPI.upload(formData)
      alert(`发布成功！获得 ${res.data.energy} 成长能量`)
      updatePetStats({ exp: res.data.newExp })
      updateUserPoints(res.data.newPoints)
      setSelectedFile(null)
      setPreview(null)
      setDescription('')
    } catch (err) {
      alert(err.response?.data?.message || '发布失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full gradient-bg pb-20">
      <div>
        <div className="w-full">
          <div className="text-center mb-6 pt-4">
            <h1 className="text-2xl font-bold text-orange-600 mb-2">发布内容</h1>
            <p className="text-orange-500">分享真实宠物，获得成长能量✨</p>
          </div>

          <div className="glass-effect rounded-2xl p-4 mb-4 text-center">
            <div className="text-gray-600">今日已发布 <span className="font-bold text-orange-500">{todayCount}</span>/5</div>
          </div>

          <div className="text-sm text-orange-400">每日上限5次，防止刷分</div>

          <form onSubmit={handleSubmit} className="glass-effect rounded-3xl p-6 warm-shadow">
            <div className="mb-6">
              {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="w-full h-64 object-cover rounded-2xl" />
                <button
                  type="button"
                  onClick={() => { setSelectedFile(null); setPreview(null) }}
                  className="absolute top-3 right-3 w-10 h-10 bg-red-400 text-white rounded-full flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="block w-full h-64 border-2 border-dashed border-orange-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all">
                <div className="text-5xl mb-2">📷</div>
                <div className="text-orange-500">点击或拖拽上传</div>
                <div className="text-sm text-orange-400 mt-1">支持图片和视频</div>
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
              </label>
            )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-2">描述一下吧</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="分享你和毛孩子的故事..."
                className="w-full h-32 px-4 py-3 rounded-xl border border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none resize-none"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={!selectedFile || loading}
              className="w-full py-4 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold rounded-2xl disabled:opacity-50"
            >
              {loading ? '发布中...' : '🎉 发布'}
            </motion.button>
          </form>

          <div className="mt-6">
            <h2 className="text-lg font-bold text-gray-700 mb-4">我的动态</h2>
            <div className="text-center text-orange-400 py-8">暂无内容</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Publish
