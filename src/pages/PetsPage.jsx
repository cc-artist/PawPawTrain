import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ArtStyleSelector from '../components/ArtStyleSelector';

const mockPets = [
  {
    id: 'pet_001',
    name: '小橘猫',
    avatar: '🐱',
    type: 'cat',
    breed: '橘猫',
    color: '橘色',
    loraStatus: 'trained',
    photoCount: 8,
    createdAt: '2024-01-10',
    generations: 12
  },
  {
    id: 'pet_002',
    name: '旺财',
    avatar: '🐕',
    type: 'dog',
    breed: '金毛犬',
    color: '金黄色',
    loraStatus: 'training',
    photoCount: 6,
    createdAt: '2024-01-14',
    generations: 0,
    trainingProgress: 65
  },
  {
    id: 'pet_003',
    name: '球球',
    avatar: '🐰',
    type: 'rabbit',
    breed: '垂耳兔',
    color: '白色',
    loraStatus: 'pending',
    photoCount: 0,
    createdAt: '2024-01-15',
    generations: 0
  }
];

const PetCard = ({ pet, onSelect }) => {
  const statusConfig = {
    trained: { label: '已训练', color: 'bg-green-500', textColor: 'text-green-600', bgBg: 'bg-green-50' },
    training: { label: '训练中', color: 'bg-purple-500', textColor: 'text-purple-600', bgBg: 'bg-purple-50' },
    pending: { label: '待上传', color: 'bg-gray-400', textColor: 'text-gray-600', bgBg: 'bg-gray-50' }
  };

  const status = statusConfig[pet.loraStatus];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(pet)}
      className={`bg-white rounded-2xl p-5 shadow-lg cursor-pointer transition-all ${pet.loraStatus === 'trained' ? 'hover:shadow-xl' : ''}`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-16 h-16 rounded-2xl ${status.bgBg} flex items-center justify-center text-4xl`}>
          {pet.avatar}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-800 text-lg">{pet.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bgBg} ${status.textColor}`}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {pet.breed} · {pet.color}
          </p>
          <div className="flex items-center gap-4 mt-3">
            <div className="text-xs">
              <span className="text-gray-400">照片</span>
              <span className="ml-1 font-bold text-gray-700">{pet.photoCount}</span>
            </div>
            <div className="text-xs">
              <span className="text-gray-400">生成</span>
              <span className="ml-1 font-bold text-gray-700">{pet.generations}</span>
            </div>
            <div className="text-xs text-gray-400">
              {pet.createdAt}
            </div>
          </div>

          {pet.loraStatus === 'training' && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">训练进度</span>
                <span className="font-medium text-purple-600">{pet.trainingProgress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pet.trainingProgress}%` }}
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const PetsPage = () => {
  const navigate = useNavigate();
  const [pets, setPets] = useState(mockPets);
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);

  const handleGenerate = () => {
    if (!selectedPet || !selectedStyle) return;

    setIsGenerating(true);
    
    setTimeout(() => {
      const imageUrl = `https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20${encodeURIComponent(selectedPet.name)}%20${encodeURIComponent(selectedStyle.name)}%20style%20pet%20portrait&image_size=square_hd`;
      setGeneratedImage(imageUrl);
      setIsGenerating(false);
    }, 3000);
  };

  const handleAddPet = () => {
    navigate('/upload');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🐾 我的宠物</h1>
            <p className="text-gray-500 text-sm">管理您的虚拟宠物和AI模型</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddPet}
            className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-white text-xl shadow-lg"
          >
            +
          </motion.button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{pets.length}</div>
            <div className="text-xs text-gray-500">宠物总数</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {pets.filter(p => p.loraStatus === 'trained').length}
            </div>
            <div className="text-xs text-gray-500">已训练</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-orange-600">
              {pets.reduce((sum, p) => sum + p.generations, 0)}
            </div>
            <div className="text-xs text-gray-500">生成作品</div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {pets.map(pet => (
            <PetCard
              key={pet.id}
              pet={pet}
              onSelect={(p) => {
                setSelectedPet(p);
                setSelectedStyle(null);
                setGeneratedImage(null);
              }}
            />
          ))}
        </div>

        {selectedPet && selectedPet.loraStatus === 'trained' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-3xl">
                {selectedPet.avatar}
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{selectedPet.name}</h3>
                <p className="text-sm text-gray-500">选择艺术风格生成图片</p>
              </div>
            </div>

            <ArtStyleSelector
              selectedStyle={selectedStyle}
              onSelectStyle={setSelectedStyle}
            />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              disabled={!selectedStyle || isGenerating}
              className={`w-full mt-4 py-4 rounded-xl font-bold text-lg transition-all ${
                selectedStyle && !isGenerating
                  ? 'gradient-bg text-white shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  AI生成中...
                </span>
              ) : (
                '🎨 生成虚拟宠物形象'
              )}
            </motion.button>

            <AnimatePresence>
              {generatedImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6"
                >
                  <h4 className="font-medium text-gray-800 mb-3">生成结果</h4>
                  <div className="relative rounded-2xl overflow-hidden">
                    <img
                      src={generatedImage}
                      alt={`${selectedPet.name} - ${selectedStyle?.name}`}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{selectedPet.name}</span>
                        <span className="text-xs px-2 py-1 bg-white/20 rounded-full text-white">
                          {selectedStyle?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => window.open(generatedImage, '_blank')}
                      className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                    >
                      👁️ 查看大图
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedImage)}
                      className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                    >
                      📋 复制链接
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStyle(null);
                        setGeneratedImage(null);
                      }}
                      className="flex-1 py-3 gradient-bg text-white rounded-xl font-medium"
                    >
                      🔄 换风格
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {selectedPet && selectedPet.loraStatus === 'training' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-center">
              <div className="text-5xl mb-4">⏳</div>
              <h3 className="font-bold text-gray-800 mb-2">模型训练中</h3>
              <p className="text-gray-500 text-sm">
                {selectedPet.name}的LoRA模型正在训练，完成后即可生成风格化图片
              </p>
            </div>
          </div>
        )}

        {selectedPet && selectedPet.loraStatus === 'pending' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-center">
              <div className="text-5xl mb-4">📷</div>
              <h3 className="font-bold text-gray-800 mb-2">需要上传照片</h3>
              <p className="text-gray-500 text-sm mb-4">
                请为{selectedPet.name}上传5-10张照片以训练专属AI模型
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddPet}
                className="w-full py-4 gradient-bg text-white rounded-xl font-bold"
              >
                🚀 开始上传
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PetsPage;
