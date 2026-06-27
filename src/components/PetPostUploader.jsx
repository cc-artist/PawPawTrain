import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import PetTypeSelector from './PetTypeSelector'
import Step4Content from './Step4Content'
import { getPetTypes } from '../data/petTypes'
import { t } from '../utils/i18n'
import axios from 'axios'
import api from '../services/api'

const PetPostUploader = React.memo(({ isOpen, onClose, onPost, currentPet }) => {
  const setPet = useStore(state => state.setPet)
  const updatePetPersonality = useStore(state => state.updatePetPersonality)

  const PERSONALITY_DIMENSIONS = [
    { key: 'energy', name: t('home.energy'), emoji: '⚡', color: 'from-yellow-400 to-orange-500' },
    { key: 'affection', name: t('home.intimacy'), emoji: '💖', color: 'from-pink-400 to-rose-500' },
    { key: 'joy', name: t('home.joy'), emoji: '😊', color: 'from-green-400 to-emerald-500' },
    { key: 'hunger', name: t('home.hunger'), emoji: '🍖', color: 'from-amber-400 to-yellow-500' },
    { key: 'discipline', name: t('home.discipline'), emoji: '📚', color: 'from-blue-400 to-indigo-500' },
  ]

  const commonPetTypes = [
    { type: 'dog', name: t('adopt.dog'), emoji: '🐕' },
    { type: 'cat', name: t('adopt.cat'), emoji: '🐱' },
    { type: 'rabbit', name: t('adopt.rabbit'), emoji: '🐰' },
    { type: 'hamster', name: t('upload.hamster'), emoji: '🐹' },
    { type: 'bird', name: t('upload.bird'), emoji: '🐦' },
    { type: 'fish', name: t('upload.fish'), emoji: '🐟' },
  ]
  const [petTypesData, setPetTypesData] = useState([])
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedPetType, setSelectedPetType] = useState(null)
  const [selectedBreed, setSelectedBreed] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [personalityScores, setPersonalityScores] = useState({
    energy: 5,
    affection: 5,
    joy: 5,
    hunger: 5,
    discipline: 5,
  })
  const [uploadedImage, setUploadedImage] = useState(null)
  const [uploadedVideo, setUploadedVideo] = useState(null)
  const [uploadedAudio, setUploadedAudio] = useState(null)
  const [description, setDescription] = useState('')
  const [habitDescription, setHabitDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioDuration, setAudioDuration] = useState(0)
  const [artStyles, setArtStyles] = useState([])
  const [selectedArtStyle, setSelectedArtStyle] = useState('')
  const [stylePreview, setStylePreview] = useState(null)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  // 获取当前宠物阶段
  const getMyPostCount = () => {
    try {
      const saved = localStorage.getItem('paw_train_all_posts')
      if (saved) {
        const allPosts = JSON.parse(saved)
        return allPosts.filter(post => post.isMine).length
      }
    } catch (err) {
      console.error('Failed to get post count')
    }
    return 0
  }

  const getGrowthStage = () => {
    const postCount = getMyPostCount()
    if (postCount >= 15) return 3
    if (postCount >= 5) return 2
    return 1
  }

  const currentStage = getGrowthStage()

  useEffect(() => {
    setPetTypesData(getPetTypes())
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchArtStyles()
    }
  }, [isOpen])

  const fetchArtStyles = async () => {
    try {
      const response = await api.get('/art-style/styles', { params: { stage: 1 } })
      if (response.data.success) {
        setArtStyles(response.data.styles)
        setSelectedArtStyle(response.data.styles[0]?.id || '')
      }
    } catch (error) {
      console.error('Failed to fetch art styles:', error)
      setArtStyles([
        { id: '3d_cartoon', name: { en: '3D Cartoon', zh: '3D卡通动画风格' }, description: { en: '3D animated style', zh: '3D卡通风格' }, visual_tags: ['3D', '卡通'], representative_works: ['冰雪奇缘', '寻梦环游记'] },
        { id: 'anime_cel', name: { en: 'Anime Cel', zh: '日系赛璐璐风' }, description: { en: 'Japanese anime style', zh: '日系动画风格' }, visual_tags: ['动画', '赛璐璐'], representative_works: ['海贼王', '鬼灭之刃'] },
        { id: 'ghibli', name: { en: 'Studio Ghibli', zh: '吉卜力风格' }, description: { en: 'Ghibli animation style', zh: '吉卜力动画风格' }, visual_tags: ['手绘', '自然'], representative_works: ['龙猫', '千与千寻'] },
        { id: 'chinese_style', name: { en: 'Chinese Style', zh: '国风动画风格' }, description: { en: 'Traditional Chinese art', zh: '中国传统艺术风格' }, visual_tags: ['水墨', '国风'], representative_works: ['哪吒', '秦时明月'] },
      ])
      setSelectedArtStyle('3d_cartoon')
    }
  }

  const generateStylePreview = async () => {
    if (!selectedArtStyle) {
      alert('请先选择艺术风格')
      return
    }

    setIsGeneratingPreview(true)
    setStylePreview(null)
    try {
      const requestData = {
        styleId: selectedArtStyle,
        stage: 1
      }

      if (selectedPetType) {
        requestData.petType = selectedPetType.type
      }
      if (selectedColor) {
        requestData.color = selectedColor
      }
      if (uploadedImage) {
        requestData.imageUrl = uploadedImage
      }

      console.log('Generating preview with:', requestData)

      const response = await api.post('/art-style/generate', requestData, {
        timeout: 60000
      })

      console.log('API Response:', response.data)

      // 检查后端返回的业务错误
      if (response.data.success === false) {
        const errorCode = response.data.code
        const errorMessage = response.data.error || '生成预览失败'

        // 根据错误代码提供更具体的提示
        let userMessage = errorMessage
        if (errorCode === 'AI_SERVICE_UNAVAILABLE') {
          userMessage = `${errorMessage}\n\n可能的原因：\n• Stability API Key 未配置\n• API 服务暂时不可用\n\n请稍后重试，或联系管理员检查 API 配置。`
        } else if (errorCode === 'INVALID_IMAGE') {
          userMessage = `${errorMessage}\n\n请确保上传的图片格式正确（JPG、PNG）。`
        } else if (errorCode === 'RATE_LIMIT_EXCEEDED') {
          userMessage = `${errorMessage}\n\n请稍后再试。`
        }

        console.error('API business error:', { code: errorCode, message: errorMessage })
        alert(userMessage)
        setIsGeneratingPreview(false)
        return
      }

      // 成功情况
      if (response.data.success && response.data.url) {
        const previewUrl = response.data.url
        
        // 检查 previewUrl 是否为字符串
        if (typeof previewUrl !== 'string') {
          console.error('Invalid preview URL type:', typeof previewUrl, previewUrl)
          alert('生成预览失败：服务器返回了无效的图片格式')
          setIsGeneratingPreview(false)
          return
        }
        
        console.log('Preview URL received:', previewUrl.substring(0, 100) + '...')
        console.log('URL length:', previewUrl.length)
        console.log('Response source:', response.data.source)
        
        // 验证base64数据是否有效
        if (previewUrl.startsWith('data:image/') && previewUrl.includes('base64,')) {
          const base64Data = previewUrl.split(',')[1]
          // 最小有效PNG图片大约需要2000字节base64
          if (base64Data && base64Data.length > 2000) {
            setStylePreview(previewUrl)
            if (response.data.warning) {
              console.log('Preview warning:', response.data.warning)
            }
            setIsGeneratingPreview(false)
          } else {
            console.error('Invalid or too small base64 data:', base64Data?.length)
            alert('生成预览失败：返回的图片数据无效或尺寸过小')
            setIsGeneratingPreview(false)
          }
        } else {
          // 普通URL，直接使用
          setStylePreview(previewUrl)
          setIsGeneratingPreview(false)
        }
      } else {
        // 未知响应格式
        console.error('Unexpected API response format:', response.data)
        alert('生成预览失败：服务器返回了意外的响应格式，请重试')
        setIsGeneratingPreview(false)
      }
    } catch (error) {
      console.error('Failed to generate preview:', error.response || error.message || error)

      // 处理网络错误或服务器错误
      let errorMessage = '生成预览失败'

      if (error.response) {
        // 服务器返回了错误响应
        const status = error.response.status
        const data = error.response.data

        if (status === 500) {
          errorMessage = '服务器内部错误，请稍后重试'
        } else if (status === 401 || status === 403) {
          errorMessage = 'API 认证失败，请检查 API Key 配置'
        } else if (data?.error) {
          errorMessage = data.error
        }
      } else if (error.request) {
        // 请求已发送但没有收到响应
        errorMessage = '网络连接失败，请检查网络后重试'
      } else {
        errorMessage = error.message || '未知错误'
      }

      alert(`${errorMessage}\n\n请稍后重试，或联系管理员获取帮助。`)
    } finally {
      setIsGeneratingPreview(false)
    }
  }

  const steps = useMemo(() => [
    { number: 1, title: t('upload.selectPet'), required: true },
    { number: 2, title: t('styles.title'), required: true },
    { number: 3, title: t('upload.personality'), required: true },
    { number: 4, title: t('upload.uploadMedia'), required: false },
    { number: 5, title: t('upload.behavior'), required: false },
    { number: 6, title: '习惯描述', required: false },
    { number: 7, title: t('upload.confirm'), required: true },
  ], [])

  const isStepComplete = useCallback((step) => {
    switch (step) {
      case 1:
        return selectedPetType && selectedBreed && selectedColor
      case 2:
        return selectedArtStyle
      case 3:
        return true
      case 4:
        return true
      case 5:
        return true
      case 6:
        return true
      default:
        return false
    }
  }, [selectedPetType, selectedBreed, selectedColor, selectedArtStyle])

  const canProceed = useCallback(() => isStepComplete(currentStep), [currentStep, isStepComplete])

  const handleNextStep = useCallback(() => {
    if (currentStep < steps.length && canProceed()) {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep, canProceed, steps.length])

  const handlePrevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleCommonPetSelect = useCallback((petType) => {
    const fullPetType = petTypesData.find(t => t.type === petType.type)
    if (fullPetType) {
      setSelectedPetType(fullPetType)
      setSelectedBreed(fullPetType.breeds[0])
      setSelectedColor(fullPetType.colors[0])
    }
  }, [petTypesData])

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.type.startsWith('video/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedVideo(reader.result)
        setUploadedImage(null)
      }
      reader.readAsDataURL(file)
    } else {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedImage(reader.result)
        setUploadedVideo(null)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const audioUrl = URL.createObjectURL(audioBlob)
        setUploadedAudio(audioUrl)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setAudioDuration(0)

      const startTime = Date.now()
      const timer = setInterval(() => {
        if (isRecording) {
          setAudioDuration(Math.floor((Date.now() - startTime) / 1000))
        } else {
          clearInterval(timer)
        }
      }, 1000)
    } catch (error) {
      console.error('录音失败:', error)
      alert('无法访问麦克风，请检查权限设置')
    }
  }, [isRecording])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const deleteAudio = useCallback(() => {
    if (uploadedAudio) {
      URL.revokeObjectURL(uploadedAudio)
      setUploadedAudio(null)
      setAudioDuration(0)
    }
  }, [uploadedAudio])

  const handleAudioUpload = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) {
      const fileSizeInMB = file.size / (1024 * 1024)
      if (fileSizeInMB > 10) {
        alert('音频文件大小不能超过10MB')
        return
      }

      const audioUrl = URL.createObjectURL(file)
      setUploadedAudio(audioUrl)

      const audio = new Audio(audioUrl)
      audio.onloadedmetadata = () => {
        setAudioDuration(Math.floor(audio.duration))
      }
    }
  }, [])

  const handlePersonalityChange = useCallback((key, value) => {
    setPersonalityScores(prev => ({
      ...prev,
      [key]: parseInt(value),
    }))
  }, [])

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 500))

    const petEmoji = selectedPetType?.emoji || '🐾'
    const petTypeName = selectedBreed || '宠物'

    const personalityBoost = {
      energy: personalityScores.energy,
      affection: personalityScores.affection,
      joy: personalityScores.joy,
      hunger: personalityScores.hunger,
      discipline: personalityScores.discipline,
    }

    const petFeatures = {
      type: selectedPetType?.type || currentPet?.type || 'cat',
      breed: selectedBreed,
      color: selectedColor,
      name: petTypeName,
      artStyle: selectedArtStyle,
    }

    // 如果用户还没有宠物，自动生成虚拟宠物
    if (!currentPet || !currentPet.id) {
      try {
        const petRes = await api.post('/pet/adopt', {
          petType: selectedPetType?.type || 'cat',
          personality: personalityScores.affection > 7 ? 'gentle' : personalityScores.energy > 7 ? 'active' : 'tsundere',
          name: petTypeName,
          fromDaily: true
        })
        
        if (petRes.data && petRes.data.pet) {
          setPet(petRes.data.pet)
          console.log('虚拟宠物已生成:', petRes.data.pet)
        }
      } catch (err) {
        console.error('生成虚拟宠物失败:', err)
      }
    } else {
      updatePetPersonality(personalityBoost, petFeatures)
    }

    const newPost = {
      id: Date.now(),
      user: { name: `${petEmoji} ${petTypeName}`, avatar: petEmoji },
      media: uploadedImage || uploadedVideo || petEmoji,
      audio: uploadedAudio,
      content: description || `分享我的${petTypeName}～`,
      habitDescription: habitDescription,
      likes: 0,
      comments: 0,
      shares: 0,
      time: '刚刚',
      features: {
        petType: selectedPetType?.type,
        breed: selectedBreed,
        color: selectedColor,
        artStyle: selectedArtStyle,
        expression: '开心',
        emotion: 'positive',
        personalityBoost,
      },
      vectorId: `vec_${Date.now()}`,
      isMine: true,
      analysisSource: uploadedImage || uploadedVideo ? 'image_analysis' : 'manual',
      confidence: 0.95,
    }

    if (currentPet) {
      const updatedPet = {
        ...currentPet,
        voice: uploadedAudio || currentPet.voice,
      }
      setPet(updatedPet)
      localStorage.setItem('paw_train_pet_state', JSON.stringify(updatedPet))
    }

    setIsSubmitting(false)
    onPost(newPost)
    resetForm()
  }, [selectedPetType, selectedBreed, selectedColor, personalityScores, description, habitDescription, uploadedImage, uploadedVideo, uploadedAudio, currentPet, updatePetPersonality, onPost, setPet])

  const resetForm = useCallback(() => {
    setCurrentStep(1)
    setSelectedPetType(null)
    setSelectedBreed('')
    setSelectedColor('')
    setPersonalityScores({ energy: 5, affection: 5, joy: 5, hunger: 5, discipline: 5 })
    setUploadedImage(null)
    setUploadedVideo(null)
    setUploadedAudio(null)
    setAudioDuration(0)
    setDescription('')
    setHabitDescription('')
    onClose()
  }, [onClose])

  const StepIndicator = useCallback(() => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <button
              type="button"
              onClick={() => {
                if (step.number < currentStep || isStepComplete(step.number - 1)) {
                  setCurrentStep(step.number)
                }
              }}
              className={`flex flex-col items-center cursor-pointer transition-all ${
                currentStep === step.number ? 'scale-110' : ''
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  currentStep === step.number
                    ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : currentStep > step.number
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {currentStep > step.number ? '✓' : step.number}
              </div>
              <div className={`text-xs mt-1 transition-all whitespace-pre-line ${
                currentStep === step.number ? 'text-orange-400 font-medium' : 'text-gray-500'
              }`}>
                {step.title}
              </div>
              {step.required && <span className="text-[10px] text-red-400">*</span>}
            </button>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-2 rounded transition-all ${
                currentStep > step.number ? 'bg-green-500' : 'bg-gray-700'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  ), [steps, currentStep, isStepComplete])

  const Step1Content = useCallback(() => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h4 className="text-white text-lg font-bold mb-1">🐾 {t('upload.selectPetType')}</h4>
        <p className="text-gray-400 text-sm whitespace-pre-line">{t('upload.selectOrCreate')}</p>
      </div>

      <div className="mb-4">
        <div className="text-gray-400 text-xs mb-2 whitespace-pre-line">{t('upload.commonPetTypes')}</div>
        <div className="grid grid-cols-3 gap-2">
          {commonPetTypes.map((pet) => (
            <button
              key={pet.type}
              type="button"
              onClick={() => handleCommonPetSelect(pet)}
              className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                selectedPetType?.type === pet.type
                  ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span className="text-2xl">{pet.emoji}</span>
              <span className="text-xs font-medium whitespace-pre-line">{pet.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-gray-400 text-xs mb-2 whitespace-pre-line">{t('upload.otherPetTypes')}</div>
        <PetTypeSelector
          selectedPetType={selectedPetType}
          onSelect={setSelectedPetType}
          selectedBreed={selectedBreed}
          onBreedChange={setSelectedBreed}
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
        />
      </div>

      <AnimatePresence>
        {selectedPetType && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <div className="p-4 bg-gray-700/50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{selectedPetType.emoji}</span>
                <span className="text-white font-medium">{selectedPetType.name}</span>
              </div>

              <div className="mb-3">
                <label className="text-gray-400 text-sm mb-2 block">{t('upload.selectBreed')}：</label>
                <div className="flex flex-wrap gap-2">
                  {selectedPetType.breeds.map((breed) => (
                    <button
                      key={breed}
                      type="button"
                      onClick={() => setSelectedBreed(breed)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        selectedBreed === breed
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      {breed}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">{t('upload.selectColor')}：</label>
                <div className="flex flex-wrap gap-2">
                  {selectedPetType.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        selectedColor === color
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-3 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
        <div className="flex items-center gap-2 text-yellow-400 text-sm">
          <span>💡</span>
          <span className="whitespace-pre-line">{t('upload.petDataImportant')}</span>
        </div>
      </div>
    </div>
  ), [selectedPetType, selectedBreed, selectedColor, handleCommonPetSelect])

  const Step2Content = useCallback(() => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h4 className="text-white text-lg font-bold mb-1">🎨 {t('styles.title')}</h4>
        <p className="text-gray-400 text-sm whitespace-pre-line">{t('styles.description')}</p>
      </div>

      <div className="border-2 border-dashed border-blue-600/50 rounded-2xl p-4 text-center hover:border-blue-500 transition-colors">
        {uploadedImage || uploadedVideo ? (
          <div className="relative">
            {uploadedVideo ? (
              <video src={uploadedVideo} className="max-h-32 mx-auto rounded-xl" controls />
            ) : (
              <img src={uploadedImage} alt="Preview" className="max-h-32 mx-auto rounded-xl" />
            )}
            <button
              type="button"
              onClick={() => {
                setUploadedImage(null)
                setUploadedVideo(null)
              }}
              className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              ×
            </button>
            <div className="mt-2 text-green-400 text-sm">✓ {t('upload.mediaUploaded')}</div>
          </div>
        ) : (
          <label className="cursor-pointer block">
            <div className="text-4xl mb-2">📷</div>
            <div className="text-gray-300 mb-1">{t('upload.uploadPetPhoto')}</div>
            <div className="text-gray-500 text-xs">支持 JPG、PNG 格式</div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {artStyles.map((style) => (
          <button
            key={style.id}
            type="button"
            onClick={() => {
              setSelectedArtStyle(style.id)
              setStylePreview(null)
            }}
            className={`p-3 rounded-xl text-left transition-all ${
              selectedArtStyle === style.id
                ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <div className="font-medium whitespace-pre-line">{style.name.en}</div>
            <div className="text-xs opacity-70 whitespace-pre-line">{style.name.zh}</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {style.visual_tags?.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    selectedArtStyle === style.id ? 'bg-white/20' : 'bg-gray-600'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="p-4 bg-gray-700/50 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">{t('styles.preview')}</span>
            <button
              type="button"
              onClick={generateStylePreview}
              disabled={isGeneratingPreview || !selectedArtStyle}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isGeneratingPreview || !selectedArtStyle
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              }`}
            >
              {isGeneratingPreview ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block"
                  >
                    ⏳
                  </motion.span>
                  {t('styles.generate')}
                </span>
              ) : (
                t('styles.generate')
              )}
            </button>
          </div>
          
          {!selectedArtStyle && (
            <div className="flex items-center justify-center h-32 bg-gray-800 rounded-xl">
              <div className="text-red-400 text-center">
                <div className="text-3xl mb-2">⚠️</div>
                <div className="text-sm">请先选择艺术风格</div>
              </div>
            </div>
          )}
          
          {selectedArtStyle && !stylePreview && (
            <div className="flex items-center justify-center h-32 bg-gray-800 rounded-xl">
              <div className="text-gray-500 text-center">
                <div className="text-3xl mb-2">🎨</div>
                <div className="text-sm">{t('styles.generate')}</div>
                {uploadedImage && (
                  <div className="text-xs mt-2 text-green-400">将基于您上传的宠物图片进行风格转换</div>
                )}
                {!uploadedImage && (
                  <div className="text-xs mt-2 text-orange-400">建议上传宠物图片以生成个性化预览</div>
                )}
              </div>
            </div>
          )}
          
          {selectedArtStyle && stylePreview && (
            <div className="flex justify-center p-2 bg-gray-800 rounded-xl">
              <img
                src={stylePreview}
                alt="Style Preview"
                className="max-h-48 rounded-lg border-2 border-gray-600 bg-gray-900"
                style={{ minWidth: '150px', minHeight: '150px', objectFit: 'contain' }}
                onError={(e) => {
                  console.error('Failed to load style preview:', stylePreview)
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23374151" width="200" height="200"/%3E%3Ctext fill="%239CA3AF" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E图片加载失败%3C/text%3E%3C/svg%3E'
                }}
              />
            </div>
          )}
        </div>

      <div className="p-3 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
        <div className="flex items-center gap-2 mb-2 text-yellow-400 text-sm">
          <span>💡</span>
          <span className="font-medium">宠物成长阶段说明</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className={`flex items-center gap-2 ${currentStage >= 1 ? 'text-yellow-400' : 'text-gray-500'}`}>
            <span>{currentStage >= 1 ? '✓' : '○'}</span>
            <span className={`font-medium ${currentStage >= 1 ? '' : 'opacity-50'}`}>{t('styles.stage1')}</span>
            <span className={currentStage >= 1 ? '' : 'opacity-50'}>: {t('styles.stage1Locked')}</span>
          </div>
          <div className={`flex items-center gap-2 ${currentStage >= 2 ? 'text-yellow-400' : 'text-gray-500'}`}>
            <span>{currentStage >= 2 ? '✓' : '○'}</span>
            <span className={`font-medium ${currentStage >= 2 ? '' : 'opacity-50'}`}>{t('styles.stage2')}</span>
            <span className={currentStage >= 2 ? '' : 'opacity-50'}>: {t('styles.stage2Locked')}</span>
          </div>
          <div className={`flex items-center gap-2 ${currentStage >= 3 ? 'text-yellow-400' : 'text-gray-500'}`}>
            <span>{currentStage >= 3 ? '✓' : '○'}</span>
            <span className={`font-medium ${currentStage >= 3 ? '' : 'opacity-50'}`}>{t('styles.stage3')}</span>
            <span className={currentStage >= 3 ? '' : 'opacity-50'}>: {t('styles.stage3Locked')}</span>
          </div>
        </div>
      </div>
    </div>
  ), [artStyles, selectedArtStyle, selectedPetType, stylePreview, isGeneratingPreview, generateStylePreview, uploadedImage, uploadedVideo, handleImageUpload, currentStage])

  const Step3Content = useCallback(() => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h4 className="text-white text-lg font-bold mb-1">📊 {t('upload.fiveDimensions')}</h4>
        <p className="text-gray-400 text-sm whitespace-pre-line">{t('upload.assessPersonality')}</p>
      </div>

      <div className="space-y-4">
        {PERSONALITY_DIMENSIONS.map((dim) => (
          <div key={dim.key} className="p-3 bg-gray-700/50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{dim.emoji}</span>
                <span className="text-white font-medium whitespace-pre-line">{dim.name}</span>
              </div>
              <span className={`text-lg font-bold bg-gradient-to-r ${dim.color} bg-clip-text text-transparent`}>
                {personalityScores[dim.key]}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={personalityScores[dim.key]}
              onChange={(e) => handlePersonalityChange(dim.key, e.target.value)}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #f97316 0%, #f97316 ${(personalityScores[dim.key] - 1) * 11.11}%, #374151 ${(personalityScores[dim.key] - 1) * 11.11}%, #374151 100%)`,
              }}
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
        <div className="flex items-center gap-2 text-yellow-400 text-sm">
          <span>🧠</span>
          <span className="whitespace-pre-line">{t('upload.personalityHelp')}</span>
        </div>
      </div>
    </div>
  ), [personalityScores, handlePersonalityChange])

  const Step4Content = useCallback(() => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h4 className="text-white text-lg font-bold mb-1">📷 {t('upload.uploadMedia')}</h4>
        <p className="text-gray-400 text-sm whitespace-pre-line">{t('upload.shareMoments')}</p>
      </div>

      <div className="border-2 border-dashed border-gray-600 rounded-2xl p-6 text-center hover:border-orange-500 transition-colors">
        {uploadedImage || uploadedVideo ? (
          <div className="relative">
            {uploadedVideo ? (
              <video src={uploadedVideo} className="max-h-64 mx-auto rounded-xl" controls />
            ) : (
              <img src={uploadedImage} alt="Preview" className="max-h-64 mx-auto rounded-xl" />
            )}
            <button
              type="button"
              onClick={() => {
                setUploadedImage(null)
                setUploadedVideo(null)
              }}
              className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              ×
            </button>
            <div className="mt-3 text-green-400 text-sm">✓ {t('upload.mediaUploaded')}</div>
          </div>
        ) : (
          <label className="cursor-pointer block">
            <div className="text-6xl mb-3">🐾</div>
            <div className="text-gray-300 mb-2 whitespace-pre-line">{t('upload.clickUpload')}</div>
            <div className="text-gray-500 text-sm whitespace-pre-line">{t('upload.supportFormats')}</div>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      <div className="border-2 border-dashed border-purple-600/50 rounded-2xl p-6 text-center hover:border-purple-500 transition-colors">
        <div className="text-center">
          <div className="text-gray-400 text-xs mb-2">🎤 {t('upload.collectVoice')}</div>
          {uploadedAudio ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    const audio = new Audio(uploadedAudio)
                    audio.play()
                  }}
                  className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors"
                >
                  ▶️
                </button>
                <button
                  type="button"
                  onClick={deleteAudio}
                  className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  🗑️
                </button>
              </div>
              <div className="text-green-400 text-sm">✓ {t('upload.voiceCollected')} ({audioDuration}秒)</div>
            </div>
          ) : isRecording ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-red-500 animate-pulse flex items-center justify-center text-white">
                  🎤
                </div>
              </div>
              <div className="text-red-400 text-lg font-bold">{t('upload.recording')}... {audioDuration}秒</div>
              <button
                type="button"
                onClick={stopRecording}
                className="px-6 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
              >
                {t('upload.stopRecording')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={startRecording}
                className="px-6 py-2 bg-purple-500/80 text-white rounded-xl font-medium hover:bg-purple-500 transition-colors"
              >
                🎤 {t('upload.startRecording')}
              </button>
              <label className="px-6 py-2 bg-blue-500/80 text-white rounded-xl font-medium hover:bg-blue-500 transition-colors cursor-pointer">
                📁 {t('upload.uploadAudio')}
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
        <div className="flex items-center gap-2 text-yellow-400 text-sm">
          <span>💡</span>
          <span className="whitespace-pre-line">{t('upload.mediaHelp')}</span>
        </div>
      </div>
    </div>
  ), [uploadedImage, uploadedVideo, uploadedAudio, audioDuration, isRecording, handleImageUpload, startRecording, stopRecording, deleteAudio])

  const [selectedBehaviors, setSelectedBehaviors] = useState([])
  const [customBehavior, setCustomBehavior] = useState('')

  const allBehaviors = [
    { id: 'daily_eat', label: '🍚 定时吃饭', category: 'daily' },
    { id: 'daily_sleep', label: '😴 规律睡眠', category: 'daily' },
    { id: 'daily_walk', label: '🚶 每日散步', category: 'daily' },
    { id: 'daily_play', label: '🎾 玩耍互动', category: 'daily' },
    { id: 'daily_groom', label: '🛁 定期洗澡', category: 'daily' },
    { id: 'daily_cuddle', label: '🤗 喜欢被抱抱', category: 'daily' },
    { id: 'daily_vocal', label: '🐦 爱叫/爱喵喵', category: 'daily' },
    { id: 'special_trick', label: '🎩 会表演特技', category: 'special' },
    { id: 'special_travel', label: '✈️ 喜欢旅行', category: 'special' },
    { id: 'special_swim', label: '🏊 会游泳', category: 'special' },
    { id: 'special_hunt', label: '🐭 喜欢抓老鼠/虫子', category: 'special' },
    { id: 'special_dance', label: '💃 听到音乐跳舞', category: 'special' },
    { id: 'special_talk', label: '🗣️ 会模仿说话', category: 'special' },
    { id: 'special_snuggle', label: '🥰 喜欢依偎', category: 'special' },
    { id: 'special_fetch', label: '🎾 会捡球', category: 'special' },
    { id: 'special_climb', label: '🧗 喜欢爬高', category: 'special' },
    { id: 'special_bury', label: '🏴 喜欢藏东西', category: 'special' },
    { id: 'special_pounce', label: '🐾 喜欢扑人/玩具', category: 'special' },
  ]

  const dailyBehaviors = allBehaviors.filter(b => b.category === 'daily')
  const specialBehaviors = allBehaviors.filter(b => b.category === 'special')

  const toggleBehavior = (behaviorId) => {
    setSelectedBehaviors(prev => 
      prev.includes(behaviorId) 
        ? prev.filter(id => id !== behaviorId)
        : [...prev, behaviorId]
    )
  }

  const Step5Wrapper = useCallback(() => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h4 className="text-white text-lg font-bold mb-1">🐾 行为描述</h4>
        <p className="text-gray-400 text-sm">选择您宠物的日常和特殊行为</p>
      </div>

      <div className="space-y-4">
        <div>
          <h5 className="text-gray-300 font-medium mb-2 flex items-center gap-2">
            <span>🌙</span> 日常行为
          </h5>
          <div className="grid grid-cols-3 gap-2">
            {dailyBehaviors.map(behavior => (
              <button
                key={behavior.id}
                type="button"
                onClick={() => toggleBehavior(behavior.id)}
                className={`px-3 py-2 rounded-xl text-sm transition-all ${
                  selectedBehaviors.includes(behavior.id)
                    ? 'bg-cyber-blue text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {behavior.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h5 className="text-gray-300 font-medium mb-2 flex items-center gap-2">
            <span>⭐</span> 特殊行为
          </h5>
          <div className="grid grid-cols-3 gap-2">
            {specialBehaviors.map(behavior => (
              <button
                key={behavior.id}
                onClick={() => toggleBehavior(behavior.id)}
                className={`px-3 py-2 rounded-xl text-sm transition-all ${
                  selectedBehaviors.includes(behavior.id)
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {behavior.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h5 className="text-gray-300 font-medium mb-2 flex items-center gap-2">
          <span>📝</span> 其他描述
        </h5>
        <textarea
          value={customBehavior}
          onChange={(e) => setCustomBehavior(e.target.value)}
          placeholder="描述您宠物的其他行为或特点...

例如：喜欢追自己的尾巴；听到开罐头的声音会跑过来；下雨天特别兴奋等..."
          className="w-full h-32 bg-gray-700 text-white rounded-2xl p-4 resize-none outline-none focus:ring-2 focus:ring-cyber-blue placeholder-gray-500 text-sm"
          autoComplete="off"
          spellCheck="false"
        />
      </div>

      {selectedBehaviors.length > 0 && (
        <div className="mt-2 text-green-400 text-sm">
          ✓ 已选择 {selectedBehaviors.length} 项行为
        </div>
      )}
    </div>
  ), [selectedBehaviors, customBehavior])

  const Step6HabitDescription = useCallback(() => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h4 className="text-white text-lg font-bold mb-1">🎯 习惯描述</h4>
        <p className="text-gray-400 text-sm">记录您宠物的日常习惯，帮助更好地了解它们</p>
      </div>

      <textarea
        value={habitDescription}
        onChange={(e) => setHabitDescription(e.target.value)}
        placeholder="描述您宠物的日常习惯...

例如：每天早上7点会准时叫我起床；喜欢在阳台上晒太阳；最爱玩逗猫棒等..."
        className="w-full h-40 bg-gray-700 text-white rounded-2xl p-4 resize-none outline-none focus:ring-2 focus:ring-cyber-blue placeholder-gray-500"
        autoComplete="off"
        spellCheck="false"
        style={{ 
          imeMode: 'active', 
          WebkitUserModify: 'read-write', 
          userSelect: 'text',
          WebkitLineClamp: 'unset'
        }}
      />
    </div>
  ), [habitDescription])

  const Step7Content = useCallback(() => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h4 className="text-white text-lg font-bold mb-1">✅ {t('upload.confirmPublish')}</h4>
        <p className="text-gray-400 text-sm whitespace-pre-line">{t('upload.checkInfo')}</p>
      </div>

      <div className="space-y-3">
        <div className="p-4 bg-gray-700/50 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🐾</span>
            <span className="text-white font-medium whitespace-pre-line">{t('upload.petInfo')}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedPetType?.emoji}</span>
              <div>
                <div className="text-gray-400 text-xs whitespace-pre-line">{t('upload.type')}</div>
                <div className="text-white">{selectedPetType?.name}</div>
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-xs whitespace-pre-line">{t('upload.breed')}</div>
              <div className="text-white">{selectedBreed}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs whitespace-pre-line">{t('upload.color')}</div>
              <div className="text-white">{selectedColor}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs whitespace-pre-line">{t('styles.title')}</div>
              <div className="text-white">
                {artStyles.find(s => s.id === selectedArtStyle)?.name.zh || selectedArtStyle}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-700/50 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📊</span>
            <span className="text-white font-medium whitespace-pre-line">{t('upload.personalityAssessment')}</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {PERSONALITY_DIMENSIONS.map((dim) => (
              <div key={dim.key} className="text-center">
                <div className="text-lg">{dim.emoji}</div>
                <div className="text-white font-bold">{personalityScores[dim.key]}</div>
                <div className="text-gray-500 text-xs whitespace-pre-line">{dim.name}</div>
              </div>
            ))}
          </div>
        </div>

        {(uploadedImage || uploadedVideo) && (
          <div className="p-4 bg-gray-700/50 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">📷</span>
              <span className="text-white font-medium whitespace-pre-line">{t('upload.mediaFiles')}</span>
            </div>
            <div className="flex justify-center">
              {uploadedVideo ? (
                <video src={uploadedVideo} className="max-h-32 rounded-lg" controls />
              ) : (
                <img src={uploadedImage} alt="Preview" className="max-h-32 rounded-lg" />
              )}
            </div>
          </div>
        )}

        {uploadedAudio && (
          <div className="p-4 bg-gray-700/50 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🎤</span>
              <span className="text-white font-medium whitespace-pre-line">{t('upload.petVoice')}</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const audio = new Audio(uploadedAudio)
                  audio.play()
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                ▶️ {t('upload.play')}
              </button>
              <span className="text-gray-400 text-sm">{audioDuration}秒</span>
            </div>
          </div>
        )}

        {description && (
          <div className="p-4 bg-gray-700/50 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">✏️</span>
              <span className="text-white font-medium whitespace-pre-line">{t('upload.description')}</span>
            </div>
            <p className="text-gray-300">{description}</p>
          </div>
        )}

        {habitDescription && (
          <div className="p-4 bg-gray-700/50 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🎯</span>
              <span className="text-white font-medium">习惯描述</span>
            </div>
            <p className="text-gray-300">{habitDescription}</p>
          </div>
        )}
      </div>
    </div>
  ), [selectedPetType, selectedBreed, selectedColor, personalityScores, uploadedImage, uploadedVideo, uploadedAudio, audioDuration, description, habitDescription])

  const getStepContent = useCallback(() => {
    switch (currentStep) {
      case 1:
        return <Step1Content />
      case 2:
        return <Step2Content />
      case 3:
        return <Step3Content />
      case 4:
        return <Step4Content />
      case 5:
        return <Step5Wrapper />
      case 6:
        return <Step6HabitDescription />
      case 7:
        return <Step7Content />
      default:
        return null
    }
  }, [currentStep, Step1Content, Step2Content, Step3Content, Step4Content, Step5Wrapper, Step6HabitDescription, Step7Content])

  const handleClose = useCallback(() => {
    resetForm()
  }, [resetForm])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-gray-800 rounded-t-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
                <h3 className="text-white font-bold text-lg">
                  {t('upload.publishPet')}
                </h3>
                <div className="w-8" />
              </div>
              <StepIndicator />
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {getStepContent()}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="p-4 border-t border-gray-700 flex gap-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-600 transition-colors"
                >
                  {t('upload.previous')}
                </button>
              )}
              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!canProceed()}
                  className={`flex-1 px-6 py-3 rounded-xl font-medium transition-colors ${
                    canProceed()
                      ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white hover:opacity-90'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {t('upload.next')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`flex-1 px-6 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-xl font-medium hover:opacity-90 transition-colors ${
                    isSubmitting ? 'cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="inline-block"
                      >
                        ⏳
                      </motion.span>
                      {t('upload.publishing')}
                    </span>
                  ) : (
                    t('upload.publish')
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

export default PetPostUploader
