import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { tasksAPI } from '../services/api';
import { t } from '../utils/i18n';

const MAX_VIDEOS = 3;
const MAX_DURATION = 60;

const DailyUploadPage = () => {
  const navigate = useNavigate();
  const { pet, setPet, updatePetStats, isLoggedIn } = useStore();
  const [videos, setVideos] = useState([]);
  const [step, setStep] = useState('upload');
  const [analysisData, setAnalysisData] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [advice, setAdvice] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisId, setAnalysisId] = useState(null);

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
          alert(`${t('taskGenerator.videoTooLong_')}${MAX_DURATION}${t('training.sec')}\nVideo cannot exceed ${MAX_DURATION}sec`);
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

  const handleAnalyze = async () => {
    if (videos.length === 0) {
      alert(t('taskGenerator.minVideoReq'));
      return;
    }
    setIsLoading(true);
    setStep('analyzing');
    setError(null);
    try {
      const formData = new FormData();
      formData.append('petType', petType);
      formData.append('petName', petName);
      videos.forEach(v => formData.append('videos', v.file));
      const response = await tasksAPI.analyze(formData);
      const data = response.data;
      if (data.success) {
        setAnalysisId(data.analysisId);
        setAnalysisData(data);
        setAdvice(data.advice || []);
        setSelectedTags(data.tags?.map(t => t.id) || []);
        setStep('select-tags');
      }
    } catch (err) {
      setError(err.response?.data?.error || t('taskGenerator.analysisFailed'));
      setStep('upload');
    } finally { setIsLoading(false); }
  };

  const toggleTag = (tagId) => {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
  };

  const toggleAllTags = () => {
    if (!analysisData?.tags) return;
    if (selectedTags.length === analysisData.tags.length) { setSelectedTags([]); }
    else { setSelectedTags(analysisData.tags.map(t => t.id)); }
  };

  const handleGenerateTasks = async () => {
    setIsLoading(true);
    try {
      const response = await tasksAPI.generate({ analysisId, selectedTags, petType, petName });
      const data = response.data;
      if (data.success) {
        setGeneratedTasks(data.tasks || []);
        const today = new Date().toDateString();
        const taskItems = (data.tasks || []).map(t => ({
          id: t.id || Date.now() + Math.random(),
          nameKey: t.name || t.nameKey || 'task_custom',
          descKey: t.description || t.descKey || '',
          icon: t.icon || '📋',
          points: t.points || 10,
          exp: t.exp || 5,
          custom: true,
        }));
        localStorage.setItem('paw_train_tasks', JSON.stringify({ date: today, tasks: taskItems, completedTasks: [], source: 'video_analysis', analysisId }));
        setStep('result');
      }
    } catch (err) {
      setError(err.response?.data?.error || t('taskGenerator.taskGenFailed'));
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    return () => { videos.forEach(v => { if (v.preview) URL.revokeObjectURL(v.preview); }); };
  }, []);

  if (!isLoggedIn) { navigate('/login'); return null; }

  return (
    <div className="min-h-screen gradient-bg p-4 pb-28">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <motion.div className="text-6xl mb-4">📋</motion.div>
          <h1 className="text-2xl font-bold text-violet-400 mb-2">{t('taskGenerator.title')}</h1>
          <p className="text-gray-400 text-sm">
            {step === 'upload' && t('taskGenerator.uploadDesc')}
            {step === 'analyzing' && t('taskGenerator.analyzingDesc')}
            {step === 'select-tags' && t('taskGenerator.selectTagsDesc')}
            {step === 'result' && t('taskGenerator.resultDesc')}
          </p>
        </div>

        {/* 步骤指示器 */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {['upload', 'analyzing', 'select-tags', 'result'].map((s, i) => {
            const steps = ['upload', 'analyzing', 'select-tags', 'result'];
            const currentIdx = steps.indexOf(step);
            const isActive = i === currentIdx;
            const isDone = i < currentIdx;
            return (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  isActive ? 'bg-violet-500 text-white scale-110' : isDone ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-500'}`}>
                  {isDone ? '✓' : i + 1}
                </div>
                {i < 3 && <div className={`w-8 h-0.5 ${i < currentIdx ? 'bg-green-500' : 'bg-gray-700'}`} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* 步骤1: 上传视频 */}
        {step === 'upload' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-xs text-white/50 mb-2">🧬 {t('taskGenerator.techDesc')}</div>
              <div className="flex flex-wrap gap-2">
                {[
                  t('taskGenerator.deepSVDD'),
                  t('taskGenerator.metaPseudoLabels'),
                  t('taskGenerator.promptTemplate'),
                  t('taskGenerator.feedbackLoop'),
                ].map(tech => (
                  <span key={tech} className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-xs border border-violet-500/20">{tech}</span>
                ))}
              </div>
            </div>
            <div className="mb-4" onDrop={e => { e.preventDefault(); addVideos(e.dataTransfer.files); }} onDragOver={e => e.preventDefault()}>
              {videos.length > 0 ? (
                <div className="space-y-3">
                  {videos.map((v, i) => (
                    <motion.div key={v.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="relative rounded-xl overflow-hidden bg-gray-800">
                      <video src={v.preview} className="w-full aspect-video object-cover" controls />
                      <button onClick={() => removeVideo(i)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/90 text-white flex items-center justify-center">×</button>
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-white text-xs">
                        {t('training.videoDuration')} {i + 1} · {v.duration}{t('training.sec')}
                      </div>
                    </motion.div>
                  ))}
                  {videos.length < MAX_VIDEOS && (
                    <label className="block rounded-xl border-2 border-dashed border-violet-500/30 p-6 text-center cursor-pointer hover:border-violet-500/60 hover:bg-violet-500/5 transition-all">
                      <input type="file" accept="video/*" multiple className="hidden" onChange={e => addVideos(e.target.files)} />
                      <span className="text-2xl text-violet-400/50">+</span>
                      <p className="text-violet-400/50 text-sm mt-1">{t('training.addMoreVideos')} ({videos.length}/{MAX_VIDEOS})</p>
                    </label>
                  )}
                </div>
              ) : (
                <label className="block rounded-2xl border-2 border-dashed border-violet-500/30 p-12 text-center cursor-pointer hover:border-violet-500/60 hover:bg-violet-500/5 transition-all">
                  <input type="file" accept="video/*" multiple className="hidden" onChange={e => addVideos(e.target.files)} />
                  <span className="text-5xl mb-3 block">🎬</span>
                  <p className="text-violet-400 font-medium">{t('taskGenerator.uploadDailyVideo')}</p>
                  <p className="text-gray-500 text-sm mt-2">{t('taskGenerator.aiAnalyzeHint')}</p>
                  <p className="text-gray-600 text-xs mt-1">{t('taskGenerator.videoFormatSupport')}{MAX_DURATION}{t('training.sec')}</p>
                </label>
              )}
            </div>
            {videos.length > 0 && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleAnalyze}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold text-lg shadow-lg shadow-violet-500/30">
                🔍 {t('taskGenerator.startAnalysis')} ({videos.length} videos / 个视频)
              </motion.button>
            )}
          </motion.div>
        )}

        {/* 分析中 */}
        {step === 'analyzing' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-effect rounded-2xl p-8 text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="text-6xl mb-4 inline-block">🔍</motion.div>
            <h3 className="text-white font-bold text-lg mb-2">{t('taskGenerator.analyzing_')}</h3>
            <p className="text-gray-400 text-sm">{t('taskGenerator.analyzingPetBehavior')}{petName}{t('taskGenerator.behaviorPattern')}</p>
            <div className="mt-4 space-y-2">
              {[
                t('taskGenerator.extractFrames'),
                t('taskGenerator.detectPose'),
                t('taskGenerator.recognizeActions'),
                t('taskGenerator.analyzeHabits'),
                t('taskGenerator.generateTags'),
              ].map((msg, i) => (
                <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ delay: i * 0.4, duration: 2, repeat: Infinity }} className="text-violet-400/60 text-xs">{msg}</motion.p>
              ))}
            </div>
          </motion.div>
        )}

        {/* 步骤2: 选择标签 */}
        {step === 'select-tags' && analysisData && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-4 p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
              <h3 className="text-violet-400 font-medium mb-1">📊 {t('taskGenerator.behaviorSummary')}</h3>
              <p className="text-white/80 text-sm">{analysisData.behaviorSummary}</p>
              <p className="text-white/50 text-xs mt-1">
                {t('taskGenerator.detectedStats')} {analysisData.detectedActions?.length || 0} {t('taskGenerator.behaviorsCount')} · {analysisData.detectedHabits?.length || 0} {t('taskGenerator.habitsCount')}
              </p>
            </div>
            {analysisData.detectedActions?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-white font-medium mb-2 text-sm">🎯 {t('taskGenerator.detectedActions')}</h3>
                <div className="flex flex-wrap gap-2">
                  {analysisData.detectedActions.map((a, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full bg-violet-500/20 text-violet-300 text-sm border border-violet-500/30">
                      {a.icon} {a.name} ({(a.confidence * 100).toFixed(0)}%)
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium text-sm">🏷️ {t('taskGenerator.selectFeatureTags')}</h3>
                <button onClick={toggleAllTags} className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/60 hover:bg-white/20 transition-colors">
                  {selectedTags.length === (analysisData.tags?.length || 0) ? t('taskGenerator.deselectAll') : t('taskGenerator.selectAll')}
                </button>
              </div>
              <p className="text-gray-500 text-xs mb-3">{t('taskGenerator.tagSelectHint')}</p>
              <div className="flex flex-wrap gap-2">
                {analysisData.tags?.map(tag => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <button key={tag.id} onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-2 rounded-xl text-sm transition-all ${
                        isSelected ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30 scale-105' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'}`}>
                      {isSelected ? '✓ ' : ''}{tag.label || tag.id}
                      <span className="text-xs opacity-60 ml-1">({(tag.confidence * 100).toFixed(0)}%)</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {advice.length > 0 && (
              <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <h3 className="text-amber-400 font-medium mb-2 text-sm">💡 {t('taskGenerator.aiAdvice')}</h3>
                <div className="space-y-2">
                  {advice.map((a, i) => (
                    <p key={i} className="text-amber-300/80 text-sm">• {a.content || a}</p>
                  ))}
                </div>
              </div>
            )}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleGenerateTasks} disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold text-lg shadow-lg shadow-violet-500/30 disabled:opacity-50">
              {isLoading ? `⏳ ${t('taskGenerator.generating')}` : `✨ ${t('taskGenerator.generateTasks')} (${selectedTags.length}${t('taskGenerator.tagsCount')})`}
            </motion.button>
            <button onClick={() => { setStep('upload'); setAnalysisData(null); }}
              className="w-full mt-3 py-3 rounded-xl text-gray-400 text-sm hover:text-white transition-colors">
              ← {t('taskGenerator.reuploadVideo')}
            </button>
          </motion.div>
        )}

        {/* 步骤3: 结果展示 */}
        {step === 'result' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass-effect rounded-2xl overflow-hidden mb-4">
              <div className="bg-gradient-to-r from-violet-500 to-purple-500 p-6 text-white text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="text-6xl mb-3">🎉</motion.div>
                <h2 className="text-2xl font-bold mb-1">{t('taskGenerator.taskSuccess')}</h2>
                <p className="opacity-90 text-sm">{t('taskGenerator.generatedFor')}{petName} {generatedTasks.length} {t('taskGenerator.dailyTasksCount')}</p>
              </div>
              <div className="p-6">
                <div className="space-y-3 mb-6">
                  {generatedTasks.map((task, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-xl flex-shrink-0">{task.icon || '📋'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium">{task.name || task.title}</div>
                        <div className="text-gray-400 text-xs">{task.description || task.descKey}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-amber-400 text-sm font-bold">+{task.points} 💰 {t('taskGenerator.points')}</div>
                        <div className="text-violet-400 text-xs">+{task.exp} {t('taskGenerator.exp')}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <h3 className="text-green-400 font-medium text-sm mb-2">🔄 {t('taskGenerator.feedbackLoopTitle')}</h3>
                  <div className="space-y-1 text-xs text-green-400/70">
                    <p>✅ {t('taskGenerator.observeDone')}{petName}{t('taskGenerator.behaviorPattern')}</p>
                    <p>✅ {t('taskGenerator.suggestDone')}{generatedTasks.length}{t('taskGenerator.dailyTasksCount')}</p>
                    <p>⏳ {t('taskGenerator.executePending')}</p>
                    <p>🔜 {t('taskGenerator.reobservePending')}</p>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/')}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold text-lg shadow-lg shadow-violet-500/30 mb-3">
                  🏠 {t('taskGenerator.goHome')}
                </motion.button>
                <button onClick={() => { setStep('upload'); setVideos([]); setAnalysisData(null); setSelectedTags([]); setGeneratedTasks([]); }}
                  className="w-full py-3 rounded-xl text-gray-400 text-sm hover:text-white transition-colors">
                  🔄 {t('taskGenerator.reanalyze')}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-3 bg-red-500/20 rounded-xl text-red-400 text-sm text-center">{error}</motion.div>
        )}
      </div>
    </div>
  );
};

export default DailyUploadPage;
