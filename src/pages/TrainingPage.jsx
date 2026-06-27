import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { t } from '../utils/i18n';

const TRAINING_PHASES = [
  { id: 'initializing', labelKey: 'training.initializing', icon: '🔧', progress: 10 },
  { id: 'uploading', labelKey: 'training.uploading', icon: '📤', progress: 20 },
  { id: 'processing', labelKey: 'training.processing', icon: '🖼️', progress: 30 },
  { id: 'training', labelKey: 'training.trainingModel', icon: '🧠', progress: 60 },
  { id: 'optimizing', labelKey: 'training.optimizing', icon: '⚡', progress: 80 },
  { id: 'saving', labelKey: 'training.saving', icon: '💾', progress: 95 },
  { id: 'complete', labelKey: 'training.completed', icon: '🎉', progress: 100 }
];

const TrainingPage = () => {
  const navigate = useNavigate();
  const [trainingState, setTrainingState] = useState({
    status: 'training',
    currentPhase: 0,
    progress: 0,
    eta: '15分钟',
    petName: '小橘猫',
    taskId: 'sks_pet_user123_小橘猫',
    photoCount: 8
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTrainingState(prev => {
        if (prev.currentPhase >= TRAINING_PHASES.length - 1) {
          clearInterval(interval);
          return { ...prev, status: 'complete', progress: 100 };
        }
        
        const phaseProgress = TRAINING_PHASES[prev.currentPhase].progress;
        const nextPhaseProgress = TRAINING_PHASES[prev.currentPhase + 1].progress;
        const increment = (nextPhaseProgress - phaseProgress) / 20;
        
        if (prev.progress + increment >= nextPhaseProgress) {
          const timeRemaining = Math.max(0, (TRAINING_PHASES.length - prev.currentPhase - 2) * 2);
          return {
            ...prev,
            currentPhase: prev.currentPhase + 1,
            progress: nextPhaseProgress,
            eta: `${timeRemaining}分钟`
          };
        }
        
        return { ...prev, progress: prev.progress + increment };
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleComplete = () => {
    navigate('/pets');
  };

  const handleRegenerate = () => {
    navigate('/upload');
  };

  return (
    <div className="min-h-screen gradient-bg p-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="text-6xl mb-4"
          >
            🐾
          </motion.div>
          <h1 className="text-2xl font-bold text-cyan-400 mb-2">{t('training.title')}</h1>
          <p className="text-gray-400">{t('training.trainingFor')} {trainingState.petName} {t('training.trainingLora')}</p>
        </div>

        <div className="glass-effect rounded-2xl overflow-hidden">
          <div className="gradient-bg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-80">{t('training.task')}</div>
                <div className="font-mono text-sm opacity-90">{trainingState.taskId}</div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-80">{t('training.eta')}</div>
                <div className="font-bold">{trainingState.eta}</div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">{t('training.progress')}</span>
                <span className="text-sm font-bold text-cyan-400">
                  {Math.round(trainingState.progress)}%
                </span>
              </div>
              <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${trainingState.progress}%` }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="text-2xl font-bold text-cyan-400">{trainingState.photoCount}</div>
                <div className="text-xs text-gray-400">{t('training.photos')}</div>
              </div>
              <div className="text-center p-3 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="text-2xl font-bold text-purple-400">LoRA</div>
                <div className="text-xs text-gray-400">{t('training.modelType')}</div>
              </div>
              <div className="text-center p-3 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="text-2xl font-bold text-pink-400">16</div>
                <div className="text-xs text-gray-400">Rank</div>
              </div>
            </div>

            <div className="space-y-2">
              {TRAINING_PHASES.map((phase, index) => {
                const isCompleted = index < trainingState.currentPhase;
                const isCurrent = index === trainingState.currentPhase;
                
                return (
                  <motion.div
                    key={phase.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${
                      isCurrent ? 'bg-cyan-900/50 border-cyan-500/30' : isCompleted ? 'bg-green-900/50 border-green-500/30' : 'bg-gray-800/50 border-gray-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isCurrent 
                          ? 'bg-cyan-500 text-white animate-pulse' 
                          : 'bg-gray-600 text-gray-300'
                    }`}>
                      {isCompleted ? '✓' : phase.icon}
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${
                        isCompleted ? 'text-green-400' : isCurrent ? 'text-cyan-400' : 'text-gray-400'
                      }`}>
                        {t(phase.labelKey)}
                      </div>
                      {isCurrent && (
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="text-xs text-cyan-400"
                        >
                          {t('training.inProgress')}
                        </motion.div>
                      )}
                    </div>
                    {isCompleted && (
                      <span className="text-xs text-green-400">{t('training.complete')}</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {trainingState.status === 'complete' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 glass-effect rounded-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-6 text-white text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="text-6xl mb-3"
                >
                  🎉
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">{t('training.trainingComplete')}</h2>
                <p className="opacity-90">{t('training.loraComplete')}</p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                    <div className="text-3xl mb-2">🐱</div>
                    <div className="text-sm font-bold text-cyan-400">{trainingState.petName}</div>
                    <div className="text-xs text-gray-400">{t('training.petName')}</div>
                  </div>
                  <div className="text-center p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                    <div className="text-3xl mb-2">📊</div>
                    <div className="text-sm font-bold text-cyan-400">{t('training.aboutSize')}</div>
                    <div className="text-xs text-gray-400">{t('training.modelSize')}</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleComplete}
                    className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold"
                  >
                    🎨 {t('training.startCreate')}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRegenerate}
                    className="flex-1 py-4 bg-gray-700 text-gray-300 rounded-xl font-bold"
                  >
                    🔄 {t('training.retrain')}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 text-center text-sm text-gray-400">
          <p>{t('training.keepPageOpen')}</p>
          <p className="mt-1">{t('training.closeNoEffect')}</p>
        </div>
      </div>
    </div>
  );
};

export default TrainingPage;
