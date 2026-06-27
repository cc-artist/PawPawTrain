import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../utils/i18n';

const PointsNotificationModal = ({ isOpen, onClose, points, source, onConfirm }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm && onConfirm();
    onClose();
  };

  const sourceLabels = {
    purchase: t('points.purchase'),
    task: t('points.task'),
    training: t('points.training'),
    swap: t('points.swap'),
    coop: t('points.coop'),
    dailyReward: t('points.dailyReward'),
    achievement: t('points.achievement'),
    other: t('points.other')
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20 }}
          className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="gradient-bg p-6 text-white text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-white/20 mx-auto flex items-center justify-center text-5xl mb-4"
            >
              ✨
            </motion.div>
            <h2 className="text-2xl font-bold mb-1">🎁 {t('points.earnedPoints')}</h2>
            <p className="text-white/80">{sourceLabels[source] || sourceLabels.other}</p>
          </div>

          <div className="p-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15, delay: 0.3 }}
              className="mb-6"
            >
              <div className="text-sm text-gray-500 mb-2">{t('points.youGot')}</div>
              <div className="text-5xl font-bold text-orange-500 flex items-center justify-center gap-2">
                <span>💰</span>
                <span>+{points}</span>
                <span className="text-lg text-gray-400">{t('shop.points')}</span>
              </div>
            </motion.div>

            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-gray-500">{t('points.walletUpdate')}</span>
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  🔄
                </motion.span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConfirm}
              className="w-full py-4 gradient-bg text-white rounded-2xl font-bold text-lg"
            >
              {t('points.confirm')}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PointsNotificationModal;
