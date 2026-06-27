import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { trainingAPI } from '../services/api';
import { t } from '../utils/i18n';

const MAX_VIDEOS = 3;
const MAX_DURATION = 60;

const TRAINING_PHASES = [
  { id: 'video_analysis', label: t('training.videoAnalysis'), icon: '🔍', desc: t('training.videoAnalysisDesc') },
  { id: 'motion_capture', label: t('training.motionCapture'), icon: '🎯', desc: t('training.motionCaptureDesc') },
  { id: 'lora_training', label: t('training.loraTraining'), icon: '🧠', desc: t('training.loraTrainingDesc') },
  { id: 'model_optimization', label: t('training.modelOptimization'), icon: '⚡', desc: t('training.modelOptimizationDesc') },
  { id: 'post_generation', label: t('training.postGeneration'), icon: '📝', desc: t('training.postGenerationDesc') },
];

const TrainingPage = () => {
  const navigate = useNavigate();
  const { pet, isLoggedIn } = useStore();
  const [videos, setVideos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [phases, setPhases] = useState(TRAINING_PHASES.map(p => ({ ...p, status: 'pending', progress: 0 })));
  const [currentPhase, setCurrentPhase] = useState(-1);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const pollRef = useRef(null);

  const petName = pet?.name || t('training.pet');
  const petType = pet?.type || 'dog';

  const addVideos = useCallback((files) => {
    const newVideos = [];
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('video/')) return;
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.src = url;
      video.onloadedmetadata = () => {
        if (video.duration > MAX_DURATION) {
          URL.revokeObjectURL(url);
          alert(`${t('training.videoTooLong')}${MAX_DURATION}${t('training.sec')}\nVideo cannot exceed ${MAX_DURATION}sec`);
          video.remove();
          return;
        }
        newVideos.push({ id: Date.now() + Math.random(), file, preview: url, duration: Math.floor(video.duration) });
        video.remove();
        if (newVideos.length > 0) {
          setVideos(prev => [...prev, ...newVideos].slice(0, MAX_VIDEOS));
        }
      };
    });
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
          }
        }
      } catch (err) { console.error('Polling error:', err); }
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      videos.forEach(v => { if (v.preview) URL.revokeObjectURL(v.preview); });
    };
  }, []);

  if (!isLoggedIn) { navigate('/login'); return null; }

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
          <h1 className="text-2xl font-bold text-emerald-400 mb-2">{t('training.virtualPetTrainer')}</h1>
          <p className="text-gray-400 text-sm">{t('training.trainerDesc')}</p>
        </div>

        {/* 技术栈展示 */}
        {!isUploading && !isComplete && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-white/50 mb-2">🧬 {t('training.techStack')} / Tech Stack</div>
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
                🚀 {t('training.startTraining')} ({videos.length} videos / 个视频)
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
                  <div className="text-sm opacity-80">{t('training.trainingTarget')} / Training Target</div>
                  <div className="font-bold text-lg">{petName}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-80">{t('training.videoCount')} / Video Count</div>
                  <div className="font-bold">{videos.length}</div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">{t('training.trainingProgress')} / Training Progress</span>
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

        {/* 完成界面 */}
        <AnimatePresence>
          {isComplete && analysisResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-effect rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="text-6xl mb-3">🎉</motion.div>
                <h2 className="text-2xl font-bold mb-1">{t('training.trainingDone')}</h2>
                <p className="opacity-90 text-sm">{petName} {t('training.learnedActions')} {analysisResult.detectedActions?.length || 0} {t('training.newActions')}</p>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-white font-medium mb-2">📊 {t('training.detectedBehaviors')} / Detected Behaviors</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.detectedActions?.map((a, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm border border-emerald-500/30">
                        {a.icon} {a.name} ({(a.confidence * 100).toFixed(0)}%)
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <h3 className="text-white font-medium mb-2">🏷️ {t('training.habitTags')} / Habit Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.tags?.slice(0, 8).map((t, i) => (
                      <span key={i} className="px-2 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs border border-teal-500/20">{t}</span>
                    ))}
                  </div>
                </div>
                {analysisResult.personalityImpact && Object.keys(analysisResult.personalityImpact).length > 0 && (
                  <div className="mb-6 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <h3 className="text-purple-400 text-sm font-medium mb-2">📈 {t('training.trainingImpact')} / Training Impact</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(analysisResult.personalityImpact).map(([key, val]) => (
                        <div key={key} className="text-center">
                          <div className={`text-lg font-bold ${val > 0 ? 'text-green-400' : 'text-red-400'}`}>{val > 0 ? '+' : ''}{val}</div>
                          <div className="text-xs text-gray-500">{key}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mb-6 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs text-white/40 mb-2">✅ {t('training.completedTechFlow')} / Completed Tech Flow</div>
                  <div className="space-y-1 text-xs text-white/60">
                    <div>✓ {t('training.videoFrameAnalysis')}</div>
                    <div>✓ {t('training.motionBoothCapture')}</div>
                    <div>✓ {t('training.loraTrainStep')}</div>
                    <div>✓ {t('training.i2lv2Optimization')}</div>
                    <div>✓ {t('training.behaviorClassification')}</div>
                    <div>✓ {t('training.autoPublish')}</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/feed')}
                    className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold">
                    📖 {t('training.viewFeedBtn')}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { setVideos([]); setIsUploading(false); setTaskId(null); setIsComplete(false); setPhases(TRAINING_PHASES.map(p => ({ ...p, status: 'pending', progress: 0 }))); setCurrentPhase(-1); setAnalysisResult(null); }}
                    className="flex-1 py-4 bg-gray-700 text-gray-300 rounded-xl font-bold">
                    🔄 {t('training.retrainBtn')}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TrainingPage;
