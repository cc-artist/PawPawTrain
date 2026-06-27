import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ART_STYLES } from '../components/ArtStyleSelector';

const mockHistory = [
  {
    id: 'gen_001',
    petName: '小橘猫',
    styleId: '3d_cartoon',
    imageUrl: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20orange%20cat%203D%20cartoon%20Pixar%20style&image_size=square_hd',
    createdAt: '2024-01-15 14:30',
    likes: 128,
    shares: 23
  },
  {
    id: 'gen_002',
    petName: '小橘猫',
    styleId: 'makoto_shinkai',
    imageUrl: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20cat%20Makoto%20Shinkai%20anime%20style%20beautiful%20lighting&image_size=square_hd',
    createdAt: '2024-01-15 15:45',
    likes: 256,
    shares: 45
  },
  {
    id: 'gen_003',
    petName: '小橘猫',
    styleId: 'ghibli',
    imageUrl: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20cat%20Studio%20Ghibli%20Hayao%20Miyazaki%20watercolor%20style&image_size=square_hd',
    createdAt: '2024-01-14 10:20',
    likes: 384,
    shares: 67
  },
  {
    id: 'gen_004',
    petName: '小橘猫',
    styleId: 'cyberpunk',
    imageUrl: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20cat%20cyberpunk%20neon%20lights%20futuristic%20city&image_size=square_hd',
    createdAt: '2024-01-14 16:00',
    likes: 192,
    shares: 34
  },
  {
    id: 'gen_005',
    petName: '小橘猫',
    styleId: 'chinese_style',
    imageUrl: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20cat%20Chinese%20traditional%20ink%20painting%20style&image_size=square_hd',
    createdAt: '2024-01-13 09:30',
    likes: 512,
    shares: 89
  },
  {
    id: 'gen_006',
    petName: '小橘猫',
    styleId: 'healing',
    imageUrl: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20cat%20healing%20anime%20style%20soft%20colors%20cozy&image_size=square_hd',
    createdAt: '2024-01-13 11:20',
    likes: 448,
    shares: 72
  }
];

const GenerationCard = ({ item, onRegenerate }) => {
  const [isHovered, setIsHovered] = useState(false);
  const style = ART_STYLES.find(s => s.id === item.styleId);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative rounded-2xl overflow-hidden shadow-lg group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-square">
        <img
          src={item.imageUrl}
          alt={`${item.petName} - ${style?.name}`}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{item.petName}</span>
              <span className="text-xs px-2 py-0.5 bg-white/20 rounded-full text-white">
                {style?.name}
              </span>
            </div>
            <div className="text-xs text-white/60 mt-1">{item.createdAt}</div>
          </div>
          <div className="flex items-center gap-3 text-white/80">
            <span className="text-sm">❤️ {item.likes}</span>
            <span className="text-sm">🔗 {item.shares}</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => window.open(item.imageUrl, '_blank')}
              className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center"
            >
              👁️
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigator.clipboard.writeText(item.imageUrl)}
              className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center"
            >
              📋
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onRegenerate(item)}
              className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center"
            >
              🔄
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const GenerationHistory = () => {
  const [history, setHistory] = useState(mockHistory);
  const [filterStyle, setFilterStyle] = useState(null);

  const filteredHistory = filterStyle
    ? history.filter(item => item.styleId === filterStyle)
    : history;

  const handleRegenerate = (item) => {
    alert(`正在使用 ${ART_STYLES.find(s => s.id === item.styleId)?.name} 风格重新生成 ${item.petName}...`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📸 生成历史</h1>
            <p className="text-gray-500 text-sm">查看您创作的所有虚拟宠物形象</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">{history.length}</div>
            <div className="text-xs text-gray-400">生成作品</div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          <button
            onClick={() => setFilterStyle(null)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
              !filterStyle
                ? 'gradient-bg text-white'
                : 'bg-white text-gray-600 shadow-sm'
            }`}
          >
            全部
          </button>
          {ART_STYLES.map(style => (
            <button
              key={style.id}
              onClick={() => setFilterStyle(style.id)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all flex items-center gap-1 ${
                filterStyle === style.id
                  ? 'gradient-bg text-white'
                  : 'bg-white text-gray-600 shadow-sm'
              }`}
            >
              {style.icon} {style.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filteredHistory.map(item => (
            <GenerationCard
              key={item.id}
              item={item}
              onRegenerate={handleRegenerate}
            />
          ))}
        </div>

        {filteredHistory.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">暂无生成记录</h3>
            <p className="text-gray-500">去创作您的第一个虚拟宠物形象吧！</p>
          </div>
        )}

        <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">📊 生成统计</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{history.length}</div>
              <div className="text-xs text-gray-500">总作品</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">
                {history.reduce((sum, h) => sum + h.likes, 0)}
              </div>
              <div className="text-xs text-gray-500">总点赞</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {history.reduce((sum, h) => sum + h.shares, 0)}
              </div>
              <div className="text-xs text-gray-500">总分享</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{new Set(history.map(h => h.styleId)).size}</div>
              <div className="text-xs text-gray-500">使用风格</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerationHistory;
