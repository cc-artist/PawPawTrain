import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import api from '../services/api';
import { t } from '../utils/i18n';

const TrainingHistory = () => {
  const navigate = useNavigate();
  const { user, pet } = useStore();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [originalPhotos, setOriginalPhotos] = useState([]);
  const [isConsumingPoints, setIsConsumingPoints] = useState(false);

  const REGENERATE_COST = 500;

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/train/history');
      if (response.data.success) {
        setHistory(response.data.history || []);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Fetch history error:', error);
      setHistory([
        {
          taskId: 'task_001',
          petName: '创建虚拟宠物',
          status: 'completed',
          createdAt: '2024-01-15T10:30:00',
          mediaCount: 5,
          published: true,
          photos: [
            'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
            'https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=400',
            'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400',
            'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400',
            'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400'
          ]
        },
        {
          taskId: 'task_002',
          petName: '优化宠物动态',
          status: 'completed',
          createdAt: '2024-01-16T14:20:00',
          mediaCount: 3,
          published: true
        },
        {
          taskId: 'task_003',
          petName: '优化宠物动态',
          status: 'completed',
          createdAt: '2024-01-17T09:15:00',
          mediaCount: 2,
          published: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (record) => {
    setSelectedRecord(record);
    
    // 获取原始上传的照片记录
    try {
      const response = await api.get(`/train/photos/${record.taskId}`);
      if (response.data.success && response.data.photos) {
        setOriginalPhotos(response.data.photos);
      } else {
        // 如果API没有返回照片，使用mock数据
        setOriginalPhotos([
          'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
          'https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=400',
          'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400',
          'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400',
          'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400'
        ]);
      }
    } catch (error) {
      console.error('Fetch original photos error:', error);
      // 使用mock数据
      setOriginalPhotos([
        'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
        'https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=400',
        'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400',
        'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400',
        'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400'
      ]);
    }
    
    setShowPreview(true);
  };

  const handleConsumePointsAndEdit = async () => {
    if (!selectedRecord) return;
    
    const userPoints = user?.points || pet?.points || 0;
    if (userPoints < REGENERATE_COST) {
      alert(`积分不足！重新生成需要 ${REGENERATE_COST} 积分，您当前有 ${userPoints} 积分`);
      return;
    }

    setIsConsumingPoints(true);
    
    try {
      const response = await api.post(`/train/regenerate/${selectedRecord.taskId}`, {
        cost: REGENERATE_COST
      });
      
      if (response.data.success) {
        setShowPreview(false);
        setShowRegenerateConfirm(false);
        alert(`成功消耗 ${REGENERATE_COST} 积分！现在您可以重新上传照片来生成新的虚拟宠物形象。`);
        // 跳转到上传页面
        navigate('/upload', { state: { isRegenerating: true, originalRecord: selectedRecord } });
      } else {
        alert(response.data.error || '积分消耗失败');
      }
    } catch (error) {
      console.error('Consume points error:', error);
      alert(error.response?.data?.error || '积分消耗失败');
    } finally {
      setIsConsumingPoints(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTaskType = (name) => {
    if (name.includes('优化') || name.includes('optimize')) return { label: t('training.optimizePet'), icon: '🎬', color: 'text-cyan-400' };
    if (name.includes('创建') || name.includes('create')) return { label: t('training.createVirtual'), icon: '✨', color: 'text-purple-400' };
    return { label: t('training.history'), icon: '🐾', color: 'text-gray-400' };
  };

  return (
    <div className="min-h-full gradient-bg pb-20">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl glass-effect flex items-center justify-center text-gray-300 hover:text-white"
          >
            ←
          </motion.button>
          <div>
            <h1 className="text-xl font-bold text-white">📋 {t('training.history')}</h1>
            <p className="text-sm text-gray-400">{t('training.viewRecords')}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="text-4xl"
            >
              🐾
            </motion.div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-400">{t('training.noRecords')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {history.map((record, index) => {
                const taskType = getTaskType(record.petName);
                const isCreatePet = record.petName.includes('创建虚拟宠物') || record.petName.includes('create');
                
                return (
                  <motion.div
                    key={record.taskId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-effect rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-2xl`}>
                          {taskType.icon}
                        </div>
                        <div>
                          <div className={`font-medium ${taskType.color}`}>
                            {taskType.label}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatDate(record.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        record.status === 'completed' 
                          ? 'bg-green-900/50 text-green-400' 
                          : record.status === 'training'
                            ? 'bg-cyan-900/50 text-cyan-400'
                            : 'bg-gray-700 text-gray-400'
                      }`}>
                        {record.status === 'completed' ? t('training.complete') : record.status === 'training' ? t('training.inProgress') : 'Pending'}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                      <span>🐱 {record.petName}</span>
                      {record.mediaCount && (
                        <span>📦 {record.mediaCount} {t('training.materials')}</span>
                      )}
                      {record.published && (
                        <span className="text-green-400">✓ {t('training.published')}</span>
                      )}
                    </div>

                    {record.photos && record.photos.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-2">{t('training.originalPhotos')}:</div>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {record.photos.slice(0, 4).map((photo, idx) => (
                            <img
                              key={idx}
                              src={photo}
                              alt={`照片 ${idx + 1}`}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                          ))}
                          {record.photos.length > 4 && (
                            <div className="w-16 h-16 rounded-lg bg-gray-700 flex items-center justify-center text-gray-400 flex-shrink-0">
                              +{record.photos.length - 4}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {isCreatePet && record.status === 'completed' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleRegenerate(record)}
                          className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium"
                        >
                          🔄 {t('training.regenerate')} ({REGENERATE_COST}{t('training.points')})
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/feed')}
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-xl text-sm"
                      >
                        👀 {t('training.viewFeed')}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 查看之前上传照片的弹窗 */}
      <AnimatePresence>
        {showPreview && selectedRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-effect rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">📷</div>
                <h3 className="text-lg font-bold text-white mb-2">之前上传的照片</h3>
                <p className="text-gray-400 text-sm">
                  这是您创建虚拟宠物时上传的照片
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                {originalPhotos.map((photo, idx) => (
                  <img
                    key={idx}
                    src={photo}
                    alt={`原照片 ${idx + 1}`}
                    className="w-full aspect-square rounded-lg object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x400?text=Photo';
                    }}
                  />
                ))}
              </div>

              <div className="bg-purple-900/30 rounded-xl p-3 mb-4 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-purple-400">💡</span>
                  <span className="text-purple-300 text-sm font-medium">温馨提示</span>
                </div>
                <p className="text-gray-400 text-xs">
                  重新生成虚拟宠物形象需要消耗 <span className="text-yellow-400 font-bold">{REGENERATE_COST}</span> 积分。消耗积分后，您可以重新上传新的照片来生成全新的虚拟宠物形象。
                </p>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPreview(false)}
                  className="flex-1 py-3 bg-gray-700 text-gray-300 rounded-xl font-medium"
                >
                  返回
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConsumePointsAndEdit}
                  disabled={isConsumingPoints}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium disabled:opacity-50"
                >
                  {isConsumingPoints ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        ⏳
                      </motion.div>
                      消耗中...
                    </span>
                  ) : (
                    `消耗${REGENERATE_COST}积分重新上传`
                  )}
                </motion.button>
              </div>

              <div className="mt-3 text-center">
                <p className="text-gray-500 text-xs">
                  当前积分: <span className="text-yellow-400">{user?.points || pet?.points || 0}</span>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 积分不足提示弹窗 */}
      <AnimatePresence>
        {showRegenerateConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
            onClick={() => setShowRegenerateConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-effect rounded-2xl p-6 max-w-sm w-full"
            >
              <div className="text-center mb-4">
                <div className="text-4xl mb-3">💎</div>
                <h3 className="text-lg font-bold text-white mb-2">积分不足</h3>
                <p className="text-gray-400 text-sm">
                  重新生成需要 <span className="text-yellow-400 font-bold">{REGENERATE_COST}</span> 积分
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  您当前有: <span className="text-yellow-400">{user?.points || pet?.points || 0}</span> 积分
                </p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowRegenerateConfirm(false)}
                  className="flex-1 py-3 bg-gray-700 text-gray-300 rounded-xl font-medium"
                >
                  返回
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/recharge')}
                  className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-medium"
                >
                  去充值
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrainingHistory;
