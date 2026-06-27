import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import useStore from '../store/useStore';
import api from '../services/api';
import { t, zh, en } from '../utils/i18n';
import ArtStyleSelector from '../components/ArtStyleSelector';
import PointsNotificationModal from '../components/PointsNotificationModal';

const UploadPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pet, user, setUser } = useStore();
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [taskId, setTaskId] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [showHistoryView, setShowHistoryView] = useState(false);
  const [historyData, setHistoryData] = useState(null);

  const MAX_PHOTOS = 5;
  const MIN_PHOTOS = 1;
  const MAX_VIDEOS = 3;
  const REGENERATE_COST = 100;

  useEffect(() => {
    const fetchUserPoints = async () => {
      try {
        const res = await api.get('/user/profile');
        if (res.data.success && res.data.user) {
          setUserPoints(res.data.user.points || 0);
          setUser(res.data.user);
        }
      } catch (err) {
        console.error('Failed to fetch user points:', err);
      }
    };
    fetchUserPoints();
  }, [setUser]);

  const fetchHistoryData = async () => {
    try {
      const res = await api.get('/train/history');
      if (res.data.success) {
        setHistoryData(res.data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const uploadMode = location.state?.mode || 'auto';
  const isRegenerating = location.state?.isRegenerating || false;
  
  let showPhotoUpload = false;
  if (uploadMode === 'photo') {
    showPhotoUpload = true;
  } else if (uploadMode === 'video') {
    showPhotoUpload = false;
  } else {
    showPhotoUpload = !pet || isRegenerating;
  }

  const addPhotos = (newFiles) => {
    const newPhotos = newFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending'
    }));
    setPhotos(prev => [...prev, ...newPhotos].slice(0, MAX_PHOTOS));
  };

  const addVideos = (newFiles) => {
    const newVideos = newFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending'
    }));
    setVideos(prev => [...prev, ...newVideos].slice(0, MAX_VIDEOS));
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('petName', !showPhotoUpload ? '优化宠物动态' : '创建虚拟宠物');
      
      if (showPhotoUpload && selectedStyle) {
        formData.append('artStyle', selectedStyle.id);
        formData.append('artStyleName', selectedStyle.name);
      }
      
      if (!showPhotoUpload) {
        videos.forEach((video, index) => {
          formData.append('images', video.file, `video_${index}.mp4`);
        });
      } else {
        photos.forEach((photo, index) => {
          formData.append('images', photo.file, `pet_${index}.jpg`);
        });
      }

      const response = await api.post('/train/create-task', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setTaskId(response.data.taskId);
        setIsSubmitting(false);
        setStep(3);
      } else {
        throw new Error(response.data.error || '上传失败');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setIsSubmitting(false);
      const errorMsg = error.response?.data?.error || error.message || '上传失败，请重试';
      alert(errorMsg);
    }
  };

  const handleStartTraining = async () => {
    if (!taskId) {
      alert('任务ID不存在');
      return;
    }
    
    try {
      const response = await api.post(`/train/start-training/${taskId}`);
      
      if (response.data.success) {
        setTimeout(() => navigate('/training'), 100);
      } else {
        throw new Error(response.data.error || t('uploadPage.startTrainingFailed'));
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || t('uploadPage.startTrainingFailed');
      alert(errorMsg);
    }
  };

  const handleRegenerate = async () => {
    if (userPoints < REGENERATE_COST) {
      alert(`积分不足！重新生成需要 ${REGENERATE_COST} 积分，您当前有 ${userPoints} 积分。`);
      return;
    }

    try {
      const response = await api.post('/user/deduct-points', { points: REGENERATE_COST });
      if (response.data.success) {
        setUserPoints(userPoints - REGENERATE_COST);
        setShowRegenerateConfirm(false);
        navigate('/upload', { state: { mode: 'photo', isRegenerating: true } });
      } else {
        throw new Error(response.data.error || '积分扣除失败');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || '操作失败';
      alert(errorMsg);
    }
  };

  const handleViewHistory = () => {
    setShowHistoryView(true);
    fetchHistoryData();
  };

  if (step === 3) {
    return (
      <div className="min-h-full gradient-bg pb-20 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-effect rounded-3xl p-8 max-w-md w-full text-center warm-shadow"
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="text-6xl mb-4">✨</motion.div>
          <h2 className="text-2xl font-bold text-orange-600 mb-2 whitespace-pre-line">{t('uploadPage.uploadSuccess')}</h2>
          <p className="text-orange-500 mb-6 whitespace-pre-line">
            {!showPhotoUpload ? t('uploadPage.videoProcessed', { count: videos.length }) : t('uploadPage.photoProcessed', { count: photos.length })}
          </p>

          {selectedStyle && showPhotoUpload && (
            <div className="bg-purple-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-lg">🎨</span>
                <span className="text-sm text-purple-600">艺术风格</span>
              </div>
              <div className="text-center">
                <span className="text-xl">{selectedStyle.icon}</span>
                <span className="font-bold text-purple-700 ml-2">{selectedStyle.name}</span>
              </div>
            </div>
          )}

          {photos.length > 0 && (
            <div className="bg-orange-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-lg">📷</span>
                <span className="text-sm text-orange-600">照片预览</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {photos.slice(0, 5).map((photo, index) => (
                  <img key={photo.id} src={photo.preview} alt={`预览 ${index + 1}`} className="w-full aspect-square object-cover rounded-lg" />
                ))}
              </div>
            </div>
          )}

          {videos.length > 0 && (
            <div className="bg-orange-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-lg">🎬</span>
                <span className="text-sm text-orange-600 whitespace-pre-line">{t('uploadPage.videoMaterials')}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {videos.map((video, index) => (
                  <div key={video.id} className="aspect-video bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">▶️</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(1)} className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold whitespace-pre-line">
              {t('uploadPage.modify')}
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleStartTraining} className="flex-1 py-4 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-xl font-bold whitespace-pre-line">
              {!showPhotoUpload ? t('uploadPage.optimizeDynamic') : t('uploadPage.startGenerate')}
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === 2 && showPhotoUpload) {
    return (
      <div className="min-h-full gradient-bg pb-28">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6 pt-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="text-6xl mb-4">🎨</motion.div>
          <h1 className="text-2xl font-bold text-purple-600 mb-2">选择艺术风格</h1>
          <p className="text-purple-500">从10种风格中选择一种，生成专属虚拟宠物形象</p>
        </motion.div>

        <div className="glass-effect rounded-3xl p-6 warm-shadow mx-4">
          <ArtStyleSelector selectedStyle={selectedStyle} onSelectStyle={setSelectedStyle} disabled={false} />
        </div>

        <div className="mx-4 mt-6">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(1)} className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-bold mb-3">
            ← 返回上传照片
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!selectedStyle || isSubmitting}
            className={`w-full py-4 rounded-xl font-bold transition-all ${selectedStyle && !isSubmitting ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⏳</motion.div>
                处理中...
              </span>
            ) : (
              `确认选择「${selectedStyle?.name || '请选择风格'}」`
            )}
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full gradient-bg pb-28 relative">
      <div className="w-full">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6 pt-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="text-6xl mb-4">🐾</motion.div>
          <h1 className="text-2xl font-bold text-orange-600 mb-2">
            {isRegenerating ? '重新生成宠物形象' : showPhotoUpload ? '创建虚拟宠物' : '优化宠物动态'}
          </h1>
          <p className="text-orange-500">
            {isRegenerating ? '上传新的宠物照片，重新生成AI宠物形象✨' : showPhotoUpload ? '上传宠物照片，生成专属AI宠物✨' : '上传宠物视频，优化虚拟宠物的动作表现✨'}
          </p>
        </motion.div>

        {showPhotoUpload && (
          <form className="glass-effect rounded-3xl p-6 warm-shadow mx-4">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-bold text-gray-800">📷 上传宠物照片</h3>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
                {MIN_PHOTOS}-{MAX_PHOTOS}张
              </span>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              请上传 <strong className="text-orange-500">1-5张不同角度</strong> 的宠物照片，系统将自动生成专属虚拟宠物形象
            </p>

            <div className="grid grid-cols-5 gap-3">
              {photos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative aspect-square rounded-2xl overflow-hidden shadow-lg cursor-pointer"
                >
                  <img src={photo.preview} alt={t('uploadPage.petPhoto', { index: index + 1 })} className="w-full h-full object-cover" />
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => removePhoto(index)} className="absolute top-1 right-1 w-7 h-7 rounded-full bg-red-400 text-white flex items-center justify-center text-sm">
                    ×
                  </motion.button>
                  <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-white/90 flex items-center justify-center text-xs font-bold text-gray-800">
                    {index + 1}
                  </div>
                </motion.div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="aspect-square rounded-2xl flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-orange-300 hover:border-orange-400 hover:bg-orange-50 transition-all">
                  <input type="file" accept="image/*" multiple onChange={(e) => addPhotos(Array.from(e.target.files))} className="hidden" />
                  <motion.div whileHover={{ scale: 1.1 }} className="text-3xl text-orange-400">+</motion.div>
                </label>
              )}
            </div>
          </form>
        )}

        {!showPhotoUpload && (
          <form className="glass-effect rounded-3xl p-6 warm-shadow mx-4">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-bold text-gray-800 whitespace-pre-line">{t('uploadPage.uploadPetVideos')}</h3>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs font-medium whitespace-pre-line">
                {t('uploadPage.maxVideos', { max: MAX_VIDEOS })}
              </span>
            </div>
            
            <p className="text-sm text-gray-500 mb-4 whitespace-pre-line">{t('uploadPage.videoRequirement')}</p>

            <div className="grid grid-cols-3 gap-3">
              {videos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative aspect-video rounded-xl overflow-hidden shadow-lg bg-orange-50"
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl">▶️</span>
                  </div>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => removeVideo(index)} className="absolute top-1 right-1 w-7 h-7 rounded-full bg-red-400 text-white flex items-center justify-center text-sm">
                    ×
                  </motion.button>
                </motion.div>
              ))}
              {videos.length < MAX_VIDEOS && (
                <label className="aspect-video rounded-xl flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-orange-300 hover:border-orange-400 hover:bg-orange-50 transition-all">
                  <input type="file" accept="video/*" multiple onChange={(e) => addVideos(Array.from(e.target.files))} className="hidden" />
                  <motion.div whileHover={{ scale: 1.1 }} className="text-3xl text-orange-400">+</motion.div>
                </label>
              )}
            </div>
          </form>
        )}

        <div className="mx-4 mt-6">
          {showPhotoUpload ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { if (photos.length >= MIN_PHOTOS && photos.length <= MAX_PHOTOS) setStep(2); }}
              disabled={photos.length < MIN_PHOTOS || photos.length > MAX_PHOTOS || isSubmitting}
              className={`w-full py-4 rounded-2xl font-bold transition-all ${photos.length >= MIN_PHOTOS && photos.length <= MAX_PHOTOS && !isSubmitting ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⏳</motion.div>
                  处理中...
                </span>
              ) : (
                '下一步：选择艺术风格 →'
              )}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={videos.length === 0 || isSubmitting}
              className={`w-full py-4 rounded-2xl font-bold transition-all ${videos.length > 0 && !isSubmitting ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⏳</motion.div>
                  处理中...
                </span>
              ) : (
                '🎬 上传视频素材'
              )}
            </motion.button>
          )}
        </div>

        <p className="text-center text-sm text-gray-400 mt-4">
          {!showPhotoUpload ? `已选择 ${videos.length}/${MAX_VIDEOS} 个视频` : `已选择 ${photos.length}/${MAX_PHOTOS} 张照片 (最少${MIN_PHOTOS}张)`}
        </p>

        {!showPhotoUpload && !isRegenerating && (
          <>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/create-pet')}
              className="fixed bottom-[220px] left-4 z-40 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl text-sm text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
            >
              <span>✨</span>
              <span className="font-bold whitespace-pre-line">创建虚拟宠物</span>
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/daily')}
              className="fixed bottom-[170px] left-4 z-40 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-sm text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all"
            >
              <span>🐾</span>
              <span className="font-bold whitespace-pre-line">发布宠物日常</span>
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleViewHistory}
              className="fixed bottom-[120px] left-4 z-40 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-sm text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
            >
              <span>📷</span>
              <span className="font-bold whitespace-pre-line">查看宠物日常</span>
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/training-history')}
              className="fixed bottom-[70px] left-4 z-40 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-sm text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
            >
              <span>📋</span>
              <span className="font-bold whitespace-pre-line">{t('uploadPage.trainingHistory')}</span>
            </motion.button>
          </>
        )}

        <AnimatePresence>
      {showHistoryView && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
          onClick={() => setShowHistoryView(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="w-full max-w-lg bg-white rounded-t-3xl p-6 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">📷 宠物日常记录</h2>
              <button onClick={() => setShowHistoryView(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            
            {historyData && historyData.length > 0 ? (
              <div className="space-y-4">
                {historyData.map((item, index) => (
                  <div key={item.taskId || index} className="border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">
                        {item.petName === '创建虚拟宠物' ? '初始宠物形象' : item.petName}
                      </span>
                      <span className="text-xs text-gray-500">{item.createdAt || '未知时间'}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.videoCount > 0 ? `${item.videoCount} 个视频素材` : `${item.imageCount || 0} 张照片素材`}
                    </div>
                    {item.petName === '创建虚拟宠物' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowHistoryView(false);
                          setShowRegenerateConfirm(true);
                        }}
                        className="mt-3 w-full py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg font-medium"
                      >
                        🔄 重新生成宠物形象 ({REGENERATE_COST}积分)
                      </motion.button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl mb-2">📭</span>
                <p className="text-gray-500">暂无宠物日常记录</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {showRegenerateConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowRegenerateConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm bg-white rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="text-5xl mb-4"
              >
                ⚠️
              </motion.div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">确认重新生成？</h3>
              <p className="text-gray-600 mb-4">
                重新生成虚拟宠物形象需要消耗 <strong className="text-orange-500">{REGENERATE_COST} 积分</strong>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                当前积分: <span className="font-bold text-purple-600">{userPoints}</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRegenerateConfirm(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={userPoints < REGENERATE_COST}
                  className={`flex-1 py-3 rounded-xl font-medium ${userPoints >= REGENERATE_COST ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  确认消耗积分
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      <PointsNotificationModal
        isOpen={showPointsModal}
        onClose={() => setShowPointsModal(false)}
        points={earnedPoints}
        source="other"
        onConfirm={() => setShowPointsModal(false)}
      />
    </AnimatePresence>
      </div>
    </div>
  );
};

export default UploadPage;