import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ART_STYLES = [
  {
    id: '3d_cartoon',
    name: '3D卡通动画',
    icon: '🎬',
    description: '画面立体精致，角色动作流畅自然，色彩明快饱和',
    reference: '冰雪奇缘、寻梦环游记、神偷奶爸',
    color: 'from-blue-400 to-purple-500',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'anime_cel',
    name: '日系赛璐璐',
    icon: '🎨',
    description: '线条清晰简洁，色彩对比鲜明，角色比例适度夸张',
    reference: '海贼王、鬼灭之刃、火影忍者',
    color: 'from-pink-400 to-red-500',
    bgColor: 'bg-pink-50'
  },
  {
    id: 'makoto_shinkai',
    name: '新海诚风格',
    icon: '🌌',
    description: '极致写实的画面质感，光影刻画细腻，色彩通透梦幻',
    reference: '你的名字、天气之子、铃芽之旅',
    color: 'from-indigo-400 to-purple-600',
    bgColor: 'bg-indigo-50'
  },
  {
    id: 'flat_design',
    name: '扁平设计',
    icon: '📐',
    description: '极简设计语言，线条简洁、色块分明',
    reference: '抖音创意短动画、品牌宣传广告',
    color: 'from-green-400 to-teal-500',
    bgColor: 'bg-green-50'
  },
  {
    id: 'cyberpunk',
    name: '赛博朋克',
    icon: '💜',
    description: '霓虹灯光与破败街巷并存的反乌托邦美学',
    reference: '赛博朋克：边缘行者、攻壳机动队',
    color: 'from-purple-500 to-pink-600',
    bgColor: 'bg-purple-50'
  },
  {
    id: 'healing',
    name: '治愈系',
    icon: '🌸',
    description: '色彩柔和低饱和，角色圆润可爱，温馨日常',
    reference: '夏目友人帐、紫罗兰永恒花园',
    color: 'from-yellow-300 to-orange-400',
    bgColor: 'bg-yellow-50'
  },
  {
    id: 'ghibli',
    name: '吉卜力风格',
    icon: '🌿',
    description: '传统手绘质感，擅长自然与奇幻融合',
    reference: '龙猫、千与千寻、幽灵公主',
    color: 'from-emerald-400 to-green-600',
    bgColor: 'bg-emerald-50'
  },
  {
    id: 'adult_swim',
    name: '美式动画',
    icon: '🤪',
    description: '粗线条画风，表情动作夸张，充满黑色幽默',
    reference: '瑞克和莫蒂、辛普森一家',
    color: 'from-orange-400 to-red-500',
    bgColor: 'bg-orange-50'
  },
  {
    id: 'chinese_style',
    name: '国风动画',
    icon: '🏮',
    description: '融合工笔画、水墨画等传统艺术，东方文化符号',
    reference: '哪吒之魔童降世、秦时明月',
    color: 'from-red-500 to-amber-600',
    bgColor: 'bg-red-50'
  },
  {
    id: 'dark_fantasy',
    name: '暗黑奇幻',
    icon: '🦇',
    description: '色调阴郁暗沉，哥特式建筑、悬疑元素',
    reference: '进击的巨人、死亡笔记',
    color: 'from-gray-600 to-slate-800',
    bgColor: 'bg-gray-100'
  }
];

const StyleCard = ({ style, isSelected, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(style)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
        isSelected
          ? 'ring-4 ring-purple-500 shadow-xl'
          : 'shadow-md hover:shadow-lg'
      }`}
    >
      <div className={`${style.bgColor} p-4`}>
        <div className={`w-full aspect-square rounded-xl bg-gradient-to-br ${style.color} flex items-center justify-center text-5xl mb-3`}>
          {style.icon}
        </div>
        
        <div className="text-center">
          <h4 className={`font-bold text-gray-800 text-sm ${isSelected ? 'text-purple-600' : ''}`}>
            {style.name}
          </h4>
        </div>

        {isSelected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs"
          >
            ✓
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm p-3 flex flex-col justify-center"
          >
            <div className="text-center">
              <div className="text-3xl mb-2">{style.icon}</div>
              <h4 className="text-white font-bold text-sm mb-1">{style.name}</h4>
              <p className="text-white/80 text-xs line-clamp-2 mb-2">{style.description}</p>
              <p className="text-white/60 text-xs">
                参考: {style.reference.split('、')[0]} 等
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ArtStyleSelector = ({ selectedStyle, onSelectStyle, disabled }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">🎨 选择艺术风格</h3>
        <span className="text-sm text-gray-500">
          已选: {selectedStyle?.name || '请选择'}
        </span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {ART_STYLES.map(style => (
          <StyleCard
            key={style.id}
            style={style}
            isSelected={selectedStyle?.id === style.id}
            onSelect={disabled ? () => {} : onSelectStyle}
          />
        ))}
      </div>

      {selectedStyle && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedStyle.color} flex items-center justify-center text-2xl`}>
              {selectedStyle.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-800">{selectedStyle.name}</h4>
              <p className="text-sm text-gray-600">{selectedStyle.description}</p>
              <p className="text-xs text-gray-400 mt-1">参考作品: {selectedStyle.reference}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export { ArtStyleSelector, ART_STYLES };
export default ArtStyleSelector;
