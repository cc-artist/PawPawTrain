import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { trainingAPI } from '../services/api';
import { t } from '../utils/i18n';
import { claimTrigger } from '../utils/taskTracker';
import { usePosts } from '../context/PostsContext';
import { checkDuplicate, addMediaRecord, UPLOAD_SOURCE } from '../utils/mediaLibrary';

const MAX_VIDEOS = 3;
const MAX_DURATION = 60;

const TRAINING_PHASES = [
  { id: 'video_analysis', label: t('training.videoAnalysis'), icon: '🔍', desc: t('training.videoAnalysisDesc') },
  { id: 'motion_capture', label: t('training.motionCapture'), icon: '🎯', desc: t('training.motionCaptureDesc') },
  { id: 'lora_training', label: t('training.loraTraining'), icon: '🧠', desc: t('training.loraTrainingDesc') },
  { id: 'model_optimization', label: t('training.modelOptimization'), icon: '⚡', desc: t('training.modelOptimizationDesc') },
  { id: 'attribute_update', label: '📊 宠物资质更新 / Attribute Update', icon: '📊', desc: '将训练数据应用到宠物属性中 / Apply training data to pet attributes' },
];

const TrainingPage = () => {
  const navigate = useNavigate();
  const { pet, isLoggedIn, updatePetPersonality } = useStore();
  const { addPost } = usePosts();
  const [videos, setVideos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [phases, setPhases] = useState(TRAINING_PHASES.map(p => ({ ...p, status: 'pending', progress: 0 })));
  const [currentPhase, setCurrentPhase] = useState(-1);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [pendingResults, setPendingResults] = useState(null);
  const [syncingToHome, setSyncingToHome] = useState(false);
  const [beforePetSnapshot, setBeforePetSnapshot] = useState(null);
  const pollRef = useRef(null);
  const isMountedRef = useRef(false);
  const savedStateRef = useRef(false);

  const petName = pet?.name || t('training.pet');
  const petType = pet?.type || 'dog';

  // 恢复页面状态：切换页面时保留训练痕迹
  useEffect(() => {
    if (savedStateRef.current) return;
    const saved = useStore.getState().getPageState('training');
    if (saved) {
      if (saved.taskId) setTaskId(saved.taskId);
      if (saved.phases) setPhases(saved.phases);
      if (saved.currentPhase !== undefined) setCurrentPhase(saved.currentPhase);
      if (saved.analysisResult) setAnalysisResult(saved.analysisResult);
      if (saved.isComplete) setIsComplete(saved.isComplete);
      if (saved.isConfirmed) setIsConfirmed(saved.isConfirmed);
      if (saved.pendingResults) setPendingResults(saved.pendingResults);
      if (saved.beforePetSnapshot) setBeforePetSnapshot(saved.beforePetSnapshot);
      console.log('📋 训练页面状态已恢复 / Training state restored');
    }
    isMountedRef.current = true;
    savedStateRef.current = true;
  }, []);

  // 保存页面状态：离开页面时不丢失训练进度
  useEffect(() => {
    if (!isMountedRef.current) return;
    useStore.getState().savePageState('training', {
      taskId, phases, currentPhase, analysisResult,
      isComplete, isConfirmed, pendingResults, beforePetSnapshot
    });
  }, [taskId, phases, currentPhase, analysisResult, isComplete, isConfirmed, pendingResults, beforePetSnapshot]);

  // 训练完成后清除保存的状态
  const clearTrainingState = useCallback(() => {
    useStore.getState().clearPageState('training');
    savedStateRef.current = false;
  }, []);

  const addVideos = useCallback((files) => {
    const skippedDuplicates = [];
    const newVideos = [];
    let checkedCount = 0;
    const filesArray = Array.from(files);
    
    filesArray.forEach(file => {
      if (!file.type.startsWith('video/')) return;
      
      // 检查重复 — 与所有已上传（含本次和已有记录）比对
      const duplicate = checkDuplicate(file);
      if (duplicate) {
        skippedDuplicates.push(file.name);
        return;
      }
      
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.src = url;
      video.onloadedmetadata = () => {
        checkedCount++;
        if (video.duration > MAX_DURATION) {
          URL.revokeObjectURL(url);
          alert(`${t('training.videoTooLong')}${MAX_DURATION}${t('training.sec')}\nVideo cannot exceed ${MAX_DURATION}sec`);
          video.remove();
          return;
        }
        newVideos.push({ id: Date.now() + Math.random(), file, preview: url, duration: Math.floor(video.duration) });
        video.remove();
        if (checkedCount === filesArray.length - skippedDuplicates.length) {
          if (newVideos.length > 0) {
            setVideos(prev => [...prev, ...newVideos].slice(0, MAX_VIDEOS));
          }
        }
      };
    });
    
    // 提示重复视频
    if (skippedDuplicates.length > 0) {
      const warningMsg = `⚠️ 以下视频已上传过，已跳过：\n${skippedDuplicates.map(n => '  · ' + n).join('\n')}\n\n视频可在"动态"和"我的"页面查看。\nVideo already uploaded, skipped. Check Feed or Profile page.`;
      setTimeout(() => alert(warningMsg), 300);
    }
  }, []);

  const removeVideo = useCallback((index) => {
    setVideos(prev => {
      const video = prev[index];
      if (video?.preview) URL.revokeObjectURL(video.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleDrop = useCallback((e) => { e.preventDefault(); addVideos(e.dataTransfer.files); }, [addVideos]);

  const handleUpload = async () => {
    if (videos.length === 0) {
      alert(t('training.minVideoRequired'));
      return;
    }
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('petType', petType);
      formData.append('petName', petName);
      videos.forEach(v => formData.append('videos', v.file));
      const response = await trainingAPI.uploadVideos(formData);
      const data = response.data;
      if (data.success) {
        setTaskId(data.task.id);
        setAnalysisResult(data.task.analysis);
        
        // 保存视频到媒体库
        const mediaPromises = videos.map(v => 
          addMediaRecord(v.file, UPLOAD_SOURCE.TRAINING, {
            petType,
            petName,
            tags: data.task.analysis?.tags || [],
          })
        );
        await Promise.allSettled(mediaPromises);
        
        const initialPhases = data.task.trainingPhases.map(p => ({
          ...TRAINING_PHASES.find(tp => tp.id === p.id) || { id: p.id, label: p.label, icon: '🔄', desc: '' },
          status: p.status, progress: p.progress,
        }));
        setPhases(initialPhases);
        setCurrentPhase(0);
        startPolling(data.task.id);
      }
    } catch (err) {
      setError(err.response?.data?.error || t('training.uploadFailed'));
      setIsUploading(false);
    }
  };

  const startPolling = (id) => {
    // 保存训练前的宠物快照，用于对比展示
    if (pet) {
      setBeforePetSnapshot({
        energy: pet.energy || 50,
        affection: pet.affection || 50,
        joy: pet.joy || 50,
        hunger: pet.hunger || 70,
        discipline: pet.discipline || 50,
        level: pet.level || 1,
        exp: pet.exp || 0,
        points: pet.points || 0,
      });
    }
    
    pollRef.current = setInterval(async () => {
      try {
        const response = await trainingAPI.getStatus(id);
        const task = response.data.task;
        if (task) {
          const updatedPhases = task.trainingPhases.map(p => ({
            ...TRAINING_PHASES.find(tp => tp.id === p.id) || { id: p.id, label: p.label, icon: '🔄', desc: '' },
            status: p.status, progress: p.progress,
          }));
          setPhases(updatedPhases);
          const inProgressIdx = updatedPhases.findIndex(p => p.status === 'in_progress');
          setCurrentPhase(inProgressIdx >= 0 ? inProgressIdx : updatedPhases.length - 1);
          if (task.status === 'completed') {
            clearInterval(pollRef.current);
            setIsComplete(true);
            setIsUploading(false);
            claimTrigger('walk');
            
            // 构建人格影响数据
            const impact = task.analysis?.personalityImpact || {};
            const personalityBoost = {
              energy: impact.energy || impact.活力 || 0,
              affection: impact.affection || impact.亲密度 || 0,
              joy: impact.joy || impact.快乐 || 0,
              hunger: impact.hunger || impact.饥饿 || 0,
              discipline: impact.discipline || impact.纪律 || 0,
            };
            
            // 根据检测到的动作数量给予额外加成
            const actionBonus = (task.analysis?.detectedActions?.length || 0) * 2;
            personalityBoost.energy = (personalityBoost.energy || 0) + actionBonus;
            personalityBoost.discipline = (personalityBoost.discipline || 0) + actionBonus;
            
            // 暂存结果，等待用户确认
            setPendingResults({
              ...task,
              personalityBoost,
              petFeatures: {
                breed: task.petType || petType,
                color: '训练强化 / Training Enhanced',
                learnedSkills: task.analysis?.detectedActions?.map(a => ({
                  id: `skill_${Date.now()}_${Math.random().toString(36).substr(2,4)}`,
                  name: a.name,
                  icon: a.icon || '🎯',
                })) || [],
              },
            });
          }
        }
      } catch (err) { console.error('Polling error:', err); }
    }, 1500);
  };

  // 用户确认训练结果并同步到首页 + 发布视频到动态
  const handleConfirmAndSync = useCallback(async () => {
    if (!pendingResults) return;
    setSyncingToHome(true);
    
    try {
      // 1) 同步到首页：更新宠物属性
      const pr = pendingResults;
      if (Object.values(pr.personalityBoost).some(v => v !== 0)) {
        updatePetPersonality(pr.personalityBoost, {
          ...pr.petFeatures,
          learnedSkills: pr.petFeatures.learnedSkills,
        });
      }
      
      // 2) 将训练原视频发布到"动态"（如果尚未发布）
      videos.forEach(v => {
        if (!v.preview) return;
        const postId = 'training_confirmed_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        addPost({
          id: postId,
          user: { name: `🐾 ${petName} 的训练成果`, avatar: '🎯' },
          media: v.preview,
          content: `🎬 ${petName}训练完成！检测到 ${pr.analysis?.detectedActions?.length || 0} 个动作，${pr.analysis?.tags?.length || 0} 个习惯标签。\nTraining done! Detected ${pr.analysis?.detectedActions?.length || 0} actions, ${pr.analysis?.tags?.length || 0} habit tags.`,
          likes: 5,
          comments: 1,
          shares: 2,
          favorites: 3,
          time: '刚刚 / Just now',
          features: {
            petType,
            breed: pr.petFeatures?.breed || petType,
            color: '训练强化',
            expression: '自信',
            emotion: 'positive',
            tags: pr.analysis?.tags || [],
            personalityBoost: pr.personalityBoost,
          },
          isMine: true,
          isTrainingPost: true,
          source: 'training_result',
          createdAt: new Date().toISOString(),
          trainingActions: pr.analysis?.detectedActions?.map(a => a.name).join('、'),
        });
      });
      
      setIsConfirmed(true);
      clearTrainingState();
      
      // 3s 后自动返回首页
      setTimeout(() => {
        navigate('/home');
      }, 3000);
    } catch (err) {
      console.error('Confirm sync failed:', err);
      setError('同步失败，请重试 / Sync failed, please retry');
    } finally {
      setSyncingToHome(false);
    }
  }, [pendingResults, videos, petName, petType, updatePetPersonality, addPost, navigate]);
  
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      videos.forEach(v => { if (v.preview) URL.revokeObjectURL(v.preview); });
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-full flex items-center justify-center gradient-bg">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="text-4xl">🎯</motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg p-4 pb-28">
      <div className="max-w-lg mx-auto">
        {/* 头部 */}
        <div className="text-center mb-6">
          <motion.div
            animate={isUploading ? { rotate: 360 } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="text-6xl mb-4"
          >🎯</motion.div>
          <h1 className="text-2xl font-bold text-emerald-400 mb-2 whitespace-pre-line">{t('training.virtualPetTrainer')}</h1>
          <p className="text-gray-400 text-sm whitespace-pre-line">{t('training.trainerDesc')}</p>
        </div>

        {/* 技术栈展示 */}
        {!isUploading && !isComplete && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-white/50 mb-2">🧬 Tech Stack / 技术方案</div>
            <div className="flex flex-wrap gap-2">
              {['DreamBooth+LoRA', 'MotionBooth', 'i2L-V2', 'OpenCV', 'DeepSVDD'].map(tech => (
                <span key={tech} className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">{tech}</span>
              ))}
            </div>
          </motion.div>
        )}

        {/* 视频上传区 */}
        {!isUploading && !isComplete && (
          <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4" onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
              {videos.length > 0 ? (
                <div className="space-y-3">
                  {videos.map((v, i) => (
                    <motion.div key={v.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative rounded-xl overflow-hidden bg-gray-800">
                      <video src={v.preview} className="w-full aspect-video object-cover" controls />
                      <button onClick={() => removeVideo(i)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/90 text-white flex items-center justify-center">×</button>
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-white text-xs">
                        {t('training.videoDuration')} {i + 1} · {v.duration}{t('training.sec')}
                      </div>
                    </motion.div>
                  ))}
                  {videos.length < MAX_VIDEOS && (
                    <label className="block rounded-xl border-2 border-dashed border-emerald-500/30 p-8 text-center cursor-pointer hover:border-emerald-500/60 hover:bg-emerald-500/5 transition-all">
                      <input type="file" accept="video/*" multiple className="hidden" onChange={e => addVideos(e.target.files)} />
                      <span className="text-3xl text-emerald-400/50">+</span>
                      <p className="text-emerald-400/50 text-sm mt-1">{t('training.addMoreVideos')} ({videos.length}/{MAX_VIDEOS})</p>
                    </label>
                  )}
                </div>
              ) : (
                <label className="block rounded-2xl border-2 border-dashed border-emerald-500/30 p-12 text-center cursor-pointer hover:border-emerald-500/60 hover:bg-emerald-500/5 transition-all">
                  <input type="file" accept="video/*" multiple className="hidden" onChange={e => addVideos(e.target.files)} />
                  <span className="text-5xl mb-3 block">📤</span>
                  <p className="text-emerald-400 font-medium">{t('training.clickOrDropVideo')}</p>
                  <p className="text-gray-500 text-sm mt-2">{t('training.videoFormatHint')}{MAX_DURATION}{t('training.sec')}</p>
                </label>
              )}
            </motion.div>

            {videos.length > 0 && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleUpload}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg shadow-lg shadow-emerald-500/30"
              >
                🚀 {t('training.startTraining')} ({videos.length} videos)
              </motion.button>
            )}

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 p-3 bg-red-500/20 rounded-xl text-red-400 text-sm text-center">{error}</motion.div>
            )}
          </>
        )}

        {/* 训练进度 */}
        {isUploading && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-effect rounded-2xl overflow-hidden">
            <div className="gradient-bg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-80">Training Target / 训练对象</div>
                  <div className="font-bold text-lg">{petName}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-80">Video Count / 视频数量</div>
                  <div className="font-bold">{videos.length}</div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Training Progress / 训练进度</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {Math.round(phases.reduce((sum, p) => sum + (p.progress || 0), 0) / phases.length)}%
                  </span>
                </div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    animate={{ width: `${phases.reduce((sum, p) => sum + (p.progress || 0), 0) / phases.length}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                {phases.map((phase, index) => {
                  const isCompleted = phase.status === 'completed';
                  const isInProgress = phase.status === 'in_progress';
                  const isPending = phase.status === 'pending';
                  return (
                    <div key={phase.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                      isInProgress ? 'bg-emerald-900/30 border-emerald-500/30' :
                      isCompleted ? 'bg-green-900/20 border-green-500/20' : 'bg-gray-800/30 border-gray-700'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                        isCompleted ? 'bg-green-500 text-white' :
                        isInProgress ? 'bg-emerald-500 text-white animate-pulse' : 'bg-gray-600 text-gray-400'}`}>
                        {isCompleted ? '✓' : phase.icon}
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${isCompleted ? 'text-green-400' : isInProgress ? 'text-emerald-400' : 'text-gray-500'}`}>
                          {phase.label}
                        </div>
                        <div className="text-xs text-gray-500">{phase.desc}</div>
                        {isInProgress && (
                          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
                            className="text-xs text-emerald-400 mt-1">{t('training.processing_')}</motion.div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* 训练完成 —— 结果预览（等待用户确认） */}
        <AnimatePresence>
          {isComplete && pendingResults && !isConfirmed && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              
              {/* 成功横幅 */}
              <div className="glass-effect rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }} className="text-6xl mb-3">🎉</motion.div>
                  <h2 className="text-2xl font-bold mb-1">训练完成！/ Training Complete!</h2>
                  <p className="opacity-90 text-sm">
                    {petName} 学习了 {pendingResults.analysis?.detectedActions?.length || 0} 个新动作
                  </p>
                </div>
              </div>

              {/* 训练视频预览 */}
              {videos.length > 0 && (
                <div className="glass-effect rounded-2xl p-4">
                  <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                    🎬 训练视频预览 / Training Video Preview
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">{videos.length} 个</span>
                  </h3>
                  <div className={`grid gap-3 ${videos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {videos.map((v, i) => (
                      <motion.div
                        key={v.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * i }}
                        className="relative rounded-xl overflow-hidden bg-gray-800 shadow-lg"
                      >
                        <video
                          src={v.preview}
                          className="w-full aspect-video object-cover"
                          controls
                          preload="metadata"
                        />
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-white text-xs">
                          视频 {i + 1} · {v.duration || '?'}s
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* 检测到的行为 */}
              {pendingResults.analysis?.detectedActions?.length > 0 && (
                <div className="glass-effect rounded-2xl p-4">
                  <h3 className="text-white font-bold text-lg mb-3">🎯 检测到的行为 / Detected Behaviors</h3>
                  <div className="flex flex-wrap gap-2">
                    {pendingResults.analysis.detectedActions.map((a, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + i * 0.05 }}
                        className="px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 text-sm border border-emerald-500/30 flex items-center gap-1.5"
                      >
                        <span className="text-lg">{a.icon || '🎯'}</span>
                        <span>{a.name}</span>
                        <span className="text-xs bg-emerald-500/20 px-1.5 py-0.5 rounded-full ml-1">
                          {(a.confidence * 100).toFixed(0)}%
                        </span>
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}

              {/* 习惯标签 */}
              {pendingResults.analysis?.tags?.length > 0 && (
                <div className="glass-effect rounded-2xl p-4">
                  <h3 className="text-white font-bold text-lg mb-3">🏷️ 习惯标签 / Habit Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {pendingResults.analysis.tags.slice(0, 12).map((tag, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-teal-500/10 text-teal-400 text-sm border border-teal-500/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 宠物属性变化对比表 */}
              {beforePetSnapshot && Object.keys(pendingResults.personalityBoost || {}).length > 0 && (
                <div className="glass-effect rounded-2xl p-4">
                  <h3 className="text-white font-bold text-lg mb-3">📊 宠物资质变化 / Attribute Changes</h3>
                  <p className="text-gray-500 text-xs mb-4">以下变更将在确认后同步到首页宠物 / Changes will sync to Home page after confirmation</p>
                  
                  <div className="overflow-hidden rounded-xl border border-white/10">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white/5">
                          <th className="p-3 text-left text-gray-400 font-medium">属性</th>
                          <th className="p-3 text-center text-gray-400 font-medium">当前</th>
                          <th className="p-3 text-center text-gray-400 font-medium">变化</th>
                          <th className="p-3 text-center text-gray-400 font-medium">训练后</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {[
                          { key: 'energy', label: '⚡ 活力/Energy', prev: beforePetSnapshot.energy },
                          { key: 'affection', label: '💖 亲密度/Affection', prev: beforePetSnapshot.affection },
                          { key: 'joy', label: '😊 快乐/Joy', prev: beforePetSnapshot.joy },
                          { key: 'hunger', label: '🍖 饱腹/Hunger', prev: beforePetSnapshot.hunger },
                          { key: 'discipline', label: '📚 纪律/Discipline', prev: beforePetSnapshot.discipline },
                        ].map((attr) => {
                          const change = pendingResults.personalityBoost[attr.key] || 0;
                          const after = Math.min(100, Math.max(0, attr.prev + change));
                          return (
                            <tr key={attr.key} className="hover:bg-white/5 transition-colors">
                              <td className="p-3 text-white">{attr.label}</td>
                              <td className="p-3 text-center text-white font-mono">{attr.prev}</td>
                              <td className={`p-3 text-center font-mono font-bold ${change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                                {change > 0 ? '+' : ''}{change}
                              </td>
                              <td className="p-3 text-center text-emerald-400 font-mono font-bold">{after}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* 额外加成信息 */}
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <div className="text-xs text-gray-500">经验值</div>
                      <div className="text-green-400 font-bold">+10</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <div className="text-xs text-gray-500">积分</div>
                      <div className="text-yellow-400 font-bold">+5</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <div className="text-xs text-gray-500">动作加成</div>
                      <div className="text-purple-400 font-bold">
                        +{(pendingResults.analysis?.detectedActions?.length || 0) * 2}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 技能解锁预告 */}
              {pendingResults.petFeatures?.learnedSkills?.length > 0 && (
                <div className="glass-effect rounded-2xl p-4">
                  <h3 className="text-white font-bold text-lg mb-3">🎪 解锁技能 / Unlocked Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {pendingResults.petFeatures.learnedSkills.map((s, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-400 text-sm border border-purple-500/20 flex items-center gap-1">
                        <span>{s.icon}</span> {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 技术流程完成确认 */}
              <div className="glass-effect rounded-2xl p-4">
                <h3 className="text-white font-bold text-lg mb-3">✅ 已完成的技术流程 / Completed Tech Flow</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex items-center gap-2"><span className="text-green-400">✓</span> 视频逐帧分析 / Video Frame Analysis</div>
                  <div className="flex items-center gap-2"><span className="text-green-400">✓</span> 运动捕捉(MotionBooth) / Motion Capture</div>
                  <div className="flex items-center gap-2"><span className="text-green-400">✓</span> LoRA微调训练 / LoRA Fine-tuning</div>
                  <div className="flex items-center gap-2"><span className="text-green-400">✓</span> i2L-V2模型优化 / i2L-V2 Optimization</div>
                  <div className="flex items-center gap-2"><span className="text-green-400">✓</span> 行为分类(DeepSVDD) / Behavior Classification</div>
                  <div className="flex items-center gap-2"><span className="text-green-400">✓</span> 宠物资质评估 / Pet Attribute Evaluation</div>
                </div>
              </div>

              {/* 操作按钮 - 确认 / 重训 */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmAndSync}
                  disabled={syncingToHome}
                  className="flex-[2] py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                >
                  {syncingToHome ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      同步中...
                    </span>
                  ) : (
                    '✅ 确认并同步到首页 / Confirm & Sync to Home'
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setVideos([]);
                    setIsUploading(false);
                    setTaskId(null);
                    setIsComplete(false);
                    setIsConfirmed(false);
                    setPendingResults(null);
                    setBeforePetSnapshot(null);
                    setPhases(TRAINING_PHASES.map(p => ({ ...p, status: 'pending', progress: 0 })));
                    setCurrentPhase(-1);
                    setAnalysisResult(null);
                  }}
                  className="flex-1 py-4 bg-gray-700 text-gray-300 rounded-2xl font-bold"
                >
                  🔄 重新训练 / Retrain
                </motion.button>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-red-500/20 rounded-xl text-red-400 text-sm text-center">
                  {error}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 确认成功 */}
        <AnimatePresence>
          {isConfirmed && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="glass-effect rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-8 text-white text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="w-20 h-20 rounded-full bg-white/20 mx-auto mb-4 flex items-center justify-center text-5xl"
                  >✨</motion.div>
                  <h2 className="text-2xl font-bold mb-2">同步成功！/ Synced!</h2>
                  <p className="opacity-90 text-sm mb-2">
                    宠物属性已更新，视频已发布到动态 / Pet attributes updated, videos published to Feed
                  </p>
                  <p className="opacity-70 text-xs">3秒后自动返回首页 / Returning to Home in 3s...</p>
                  <div className="mt-4">
                    <motion.div
                      className="h-1 bg-white/30 rounded-full overflow-hidden w-48 mx-auto"
                      initial={{ width: 0 }}
                      animate={{ width: '12rem' }}
                    >
                      <motion.div
                        className="h-full bg-white rounded-full"
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: 3, ease: 'linear' }}
                      />
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 完成界面（无结果时的兜底） */}
        <AnimatePresence>
          {isComplete && !pendingResults && !isConfirmed && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-effect rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="text-6xl mb-3">🎉</motion.div>
                <h2 className="text-2xl font-bold mb-1 whitespace-pre-line">{t('training.trainingDone')}</h2>
              </div>
              <div className="p-6 text-center text-gray-400">
                <p>训练已完成，正在获取结果...</p>
                <p className="text-xs mt-2">Training complete, fetching results...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TrainingPage;
