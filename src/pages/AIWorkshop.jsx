import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const PRODUCT_TYPES = [
  { id: 'portrait', name: '艺术写真', nameEn: 'Art Portrait', icon: '🎨', desc: '专业级宠物写真', descEn: 'Professional pet photos', gradient: 'from-pink-500 to-rose-500', price: 50 },
  { id: 'sticker', name: '表情包', nameEn: 'Sticker Pack', icon: '📱', desc: '16款萌宠表情', descEn: '16 cute stickers', gradient: 'from-orange-500 to-amber-500', price: 80 },
  { id: 'wallpaper', name: '定制壁纸', nameEn: 'Wallpaper', icon: '🖼️', desc: '手机电脑壁纸', descEn: 'Phone & PC wallpaper', gradient: 'from-purple-500 to-violet-500', price: 60 },
  { id: 'merch', name: '实体周边', nameEn: 'Merch Design', icon: '🧸', desc: 'T恤/杯/壳设计', descEn: 'T-shirt/mug/case', gradient: 'from-cyan-500 to-blue-500', price: 120 },
  { id: 'story', name: '故事绘本', nameEn: 'Story Book', icon: '📖', desc: '插画故事页', descEn: 'Illustrated stories', gradient: 'from-emerald-500 to-teal-500', price: 150 },
  { id: 'avatar', name: '个性头像', nameEn: 'Avatar', icon: '🎭', desc: '社交媒体头像', descEn: 'Social media avatar', gradient: 'from-fuchsia-500 to-pink-500', price: 40 },
  { id: 'badge', name: '荣誉勋章', nameEn: 'Badge', icon: '🏅', desc: '里程碑徽章', descEn: 'Achievement badge', gradient: 'from-yellow-500 to-amber-500', price: 30 },
  { id: 'video', name: '趣味视频', nameEn: 'Fun Clip', icon: '🎬', desc: 'AI生成短视频', descEn: 'AI-generated clip', gradient: 'from-red-500 to-pink-500', price: 200 },
];

const GENERATION_STEPS = [
  { icon: '🔍', text: 'AI分析宠物特征...', textEn: 'Analyzing pet features...' },
  { icon: '🎨', text: '匹配最佳设计风格...', textEn: 'Matching best style...' },
  { icon: '✨', text: '生成创意内容...', textEn: 'Generating creative content...' },
  { icon: '🎁', text: '打包输出成品...', textEn: 'Packaging final product...' },
];

function getProductById(id) {
  return PRODUCT_TYPES.find(p => p.id === id) || PRODUCT_TYPES[0];
}

function AIWorkshop() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('create');
  const [selectedType, setSelectedType] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generatedProducts, setGeneratedProducts] = useState([]);
  const [myCreations, setMyCreations] = useState([]);
  const [showPetGallery, setShowPetGallery] = useState(false);
  const [petPosts, setPetPosts] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [previewIndex, setPreviewIndex] = useState(0);

  const CREATIONS_KEY = 'paw_workshop_creations';

  useEffect(() => {
    loadCreations();
    loadPetPosts();
  }, []);

  const loadCreations = () => {
    try {
      const saved = localStorage.getItem(CREATIONS_KEY);
      if (saved) setMyCreations(JSON.parse(saved));
    } catch (e) { /* ignore */ }
  };

  const saveCreation = (creation) => {
    const updated = [creation, ...myCreations].slice(0, 100);
    setMyCreations(updated);
    localStorage.setItem(CREATIONS_KEY, JSON.stringify(updated));
  };

  const loadPetPosts = () => {
    try {
      const saved = localStorage.getItem('paw_train_all_posts');
      if (saved) {
        const all = JSON.parse(saved);
        setPetPosts(all.filter(p => p.isMine && (p.media || p.image)).slice(0, 20));
      }
    } catch (e) { /* ignore */ }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result);
      setImagePreview(URL.createObjectURL(file));
      setUploadedVideo(null);
      setVideoPreview(null);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert('视频文件不能超过50MB');
      return;
    }
    setUploadedVideo(file);
    setVideoPreview(URL.createObjectURL(file));
    setUploadedImage(null);
    setImagePreview(null);
  };

  const selectFromGallery = (post) => {
    const media = post.media || post.image;
    if (media) {
      setUploadedImage(media);
      setImagePreview(media);
      setUploadedVideo(null);
      setVideoPreview(null);
      setShowPetGallery(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedType) return;
    if (!uploadedImage && !uploadedVideo) return;

    const product = getProductById(selectedType);
    setIsGenerating(true);
    setGenerationStep(0);

    // 先检查后端是否可达
    let backendAvailable = false;
    try {
      await api.get('/health', { timeout: 3000 });
      backendAvailable = true;
    } catch (e) {
      console.log('⚠️ 后端未启动，直接使用本地生成');
    }

    // 先执行前两步模拟（同时等待后端准备）
    for (let i = 0; i < 2; i++) {
      setGenerationStep(i);
      await new Promise(r => setTimeout(r, 600 + Math.random() * 300));
    }

    // 尝试调用后端 API
    let result = null;
    if (backendAvailable) {
      try {
        setGenerationStep(2);
        const requestBody = {
          imageBase64: uploadedImage,
          productType: selectedType,
          petName: localStorage.getItem('paw_train_pet_state') 
            ? JSON.parse(localStorage.getItem('paw_train_pet_state')).name || '宠物'
            : '宠物',
          petType: localStorage.getItem('paw_train_pet_state')
            ? JSON.parse(localStorage.getItem('paw_train_pet_state')).type || 'cat'
            : 'cat',
          petColor: '花色',
        };

        const res = await api.post('/workshop/generate', requestBody, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 90000,
        });
        if (res.data?.success && res.data?.creation) {
          result = res.data.creation;
          console.log('✅ 后端生成成功');
        }
      } catch (err) {
        const status = err.response?.status;
        console.log(`⚠️ 后端生成失败 (HTTP ${status || 'network error'}), 回退到本地生成`);
      }
    }

    // 执行第4步模拟
    setGenerationStep(3);
    await new Promise(r => setTimeout(r, 400 + Math.random() * 300));

    // 降级：本地 mock 生成
    if (!result) {
      result = generateMockProduct(selectedType, uploadedImage);
    }

    const newProduct = {
      ...result,
      id: Date.now().toString(),
      productType: selectedType,
      productIcon: product.icon,
      productName: product.name,
      productNameEn: product.nameEn,
      productGradient: product.gradient,
      createdAt: new Date().toISOString(),
    };

    setGeneratedProducts(prev => [newProduct, ...prev]);
    saveCreation(newProduct);
    setIsGenerating(false);
    setSuccessMessage(`${product.name} 生成成功！`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const generateMockProduct = (type, imageSrc) => {
    const colors = [
      ['#667eea', '#764ba2'], ['#f093fb', '#f5576c'], ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7'], ['#fa709a', '#fee140'], ['#a18cd1', '#fbc2eb'],
    ];
    const [c1, c2] = colors[Math.floor(Math.random() * colors.length)];

    const artwork = generateArtworkSVG(type, c1, c2, imageSrc);

    return {
      imageUrl: artwork,
      productName: getProductById(type)?.name || '创作',
      provider: 'local',
    };
  };

  const generateArtworkSVG = (type, c1, c2, imageSrc) => {
    const icons = { portrait: '🎨🖼️', sticker: '😺😸😹😻', wallpaper: '🌅🌸✨', merch: '👕☕📱',
      story: '📖🌈🐾', avatar: '😎💫🌟', badge: '🏅⭐👑', video: '🎬▶️🎥' };

    const w = 512, h = 512;
    let contentSvg = '';

    if (imageSrc && imageSrc.startsWith('data:image')) {
      contentSvg = `<image href="${imageSrc.replace(/"/g, '&quot;')}" x="86" y="56" width="340" height="340" preserveAspectRatio="xMidYMid slice" clip-path="url(#imgClip)" opacity="0.85"/>
      <rect x="86" y="56" width="340" height="340" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="3" rx="16"/>`;
    } else {
      contentSvg = `<text x="256" y="200" text-anchor="middle" font-size="140">${icons[type] || '🎨'}</text>
      <text x="256" y="300" text-anchor="middle" font-size="28" fill="rgba(255,255,255,0.85)" font-weight="bold">${getProductById(type).name}</text>`;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c1}"/>
      <stop offset="100%" style="stop-color:${c2}"/>
    </linearGradient>
    <clipPath id="imgClip"><rect x="86" y="56" width="340" height="340" rx="16"/></clipPath>
    <filter id="shadow"><feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.3)"/></filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)" rx="0"/>
  <circle cx="80" cy="80" r="60" fill="rgba(255,255,255,0.06)"/>
  <circle cx="430" cy="420" r="80" fill="rgba(255,255,255,0.04)"/>
  ${contentSvg}
  <text x="256" y="${imageSrc ? 440 : 380}" text-anchor="middle" font-size="18" fill="rgba(255,255,255,0.5)">PawPaw Train · AI Workshop</text>
  ${imageSrc ? '' : `<text x="256" y="420" text-anchor="middle" font-size="16" fill="rgba(255,255,255,0.35)">${getProductById(type).desc || ''}</text>`}
</svg>`;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  };

  const handleDownload = (product) => {
    const link = document.createElement('a');
    link.download = `PawPaw_${product.productType}_${Date.now()}.png`;
    link.href = product.imageUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreviewNavigate = (direction) => {
    if (generatedProducts.length === 0) return;
    setPreviewIndex(prev => {
      const next = prev + direction;
      if (next < 0) return generatedProducts.length - 1;
      if (next >= generatedProducts.length) return 0;
      return next;
    });
  };

  return (
    <div className="min-h-screen gradient-bg pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white text-center">🤖 AI创作工坊</h1>
          <p className="text-white/50 text-center text-sm mt-1">AI Creation Workshop · 用宠物照片生成各种商品</p>
        </motion.div>
      </div>

      {/* Tab switcher */}
      <div className="px-4 mb-4">
        <div className="glass-effect rounded-2xl p-1.5 flex gap-1">
          {[
            { id: 'create', icon: '✨', label: 'AI创作', labelEn: 'Create' },
            { id: 'gallery', icon: '🖼️', label: '作品画廊', labelEn: 'Gallery' },
            { id: 'history', icon: '📦', label: '我的作品', labelEn: 'My Works' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyber-blue to-cyber-purple text-white shadow-lg'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== CREATE TAB ===== */}
      {activeTab === 'create' && (
        <div className="px-4 space-y-4">
          {/* Step 1: Select Product Type */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-effect rounded-2xl p-4">
            <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-gradient-to-r from-cyber-blue to-cyber-purple flex items-center justify-center text-sm">1</span>
              选择商品类型 / Select Product Type
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {PRODUCT_TYPES.map(type => (
                <motion.button
                  key={type.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedType(type.id === selectedType ? null : type.id)}
                  className={`relative p-3 rounded-xl text-center transition-all border-2 ${
                    selectedType === type.id
                      ? 'border-cyber-blue bg-cyber-blue/15 shadow-lg shadow-cyber-blue/20'
                      : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}
                >
                  <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center text-xl mb-1.5`}>
                    {type.icon}
                  </div>
                  <div className="text-white text-xs font-medium leading-tight">{type.name}</div>
                  <div className="text-white/40 text-[10px] mt-0.5">{type.nameEn}</div>
                  <div className="text-cyber-blue text-[10px] mt-1">⭐{type.price}</div>
                  {selectedType === type.id && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyber-blue flex items-center justify-center text-white text-[10px]">✓</div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Step 2: Upload Image/Video */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-effect rounded-2xl p-4">
            <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-gradient-to-r from-cyber-blue to-cyber-purple flex items-center justify-center text-sm">2</span>
              上传宠物素材 / Upload Pet Media
            </h3>

            {/* Upload tabs */}
            <div className="flex gap-2 mb-3">
              <button onClick={() => setShowPetGallery(false)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!showPetGallery ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/50' : 'bg-white/5 text-white/50 border border-white/10'}`}>
                📷 上传新图片
              </button>
              <button onClick={() => setShowPetGallery(true)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${showPetGallery ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/50' : 'bg-white/5 text-white/50 border border-white/10'}`}>
                📚 选择已上传
              </button>
            </div>

            {!showPetGallery ? (
              <div className="space-y-3">
                {/* Image upload */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-cyber-blue/50 transition-all group"
                >
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-contain rounded-lg mx-auto" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition-all flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 transition-all text-sm bg-black/50 px-3 py-1 rounded-full">点击更换</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-2">📷</div>
                      <p className="text-white/60 text-sm">点击上传宠物图片</p>
                      <p className="text-white/30 text-xs mt-1">支持 JPG/PNG/WebP</p>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>

                {/* Video upload */}
                <div
                  onClick={() => videoInputRef.current?.click()}
                  className="relative border-2 border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer hover:border-pink-400/50 transition-all group"
                >
                  {videoPreview ? (
                    <div className="relative">
                      <video src={videoPreview} className="w-full max-h-48 rounded-lg mx-auto" controls />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition-all flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 transition-all text-sm bg-black/50 px-3 py-1 rounded-full">点击更换</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl mb-1">🎬</div>
                      <p className="text-white/60 text-sm">或上传宠物视频（可选）</p>
                      <p className="text-white/30 text-xs mt-1">最大 50MB，MP4/MOV</p>
                    </div>
                  )}
                  <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                </div>
              </div>
            ) : (
              /* Pet gallery */
              <div>
                {petPosts.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {petPosts.map((post, i) => (
                      <motion.div
                        key={post.id || i}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => selectFromGallery(post)}
                        className="aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer hover:border-cyber-blue/50 transition-all"
                      >
                        {post.media || post.image ? (
                          <img src={post.media || post.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🐾</div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/40">
                    <div className="text-4xl mb-2">📭</div>
                    <p className="text-sm">还没有上传过宠物照片</p>
                    <button onClick={() => setShowPetGallery(false)} className="mt-2 text-cyber-blue text-sm underline">去上传新图片</button>
                  </div>
                )}
              </div>
            )}

            {/* Cost info */}
            {selectedType && (uploadedImage || uploadedVideo) && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">消耗积分</span>
                  <span className="text-cyber-yellow font-bold">⭐ {getProductById(selectedType).price}</span>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Step 3: Generate Button */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <motion.button
              whileHover={{ scale: selectedType && (uploadedImage || uploadedVideo) ? 1.02 : 1 }}
              whileTap={{ scale: selectedType && (uploadedImage || uploadedVideo) ? 0.98 : 1 }}
              onClick={handleGenerate}
              disabled={!selectedType || (!uploadedImage && !uploadedVideo) || isGenerating}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
                selectedType && (uploadedImage || uploadedVideo) && !isGenerating
                  ? 'bg-gradient-to-r from-cyber-blue via-purple-500 to-cyber-purple text-white shadow-xl shadow-cyber-blue/30 hover:shadow-cyber-blue/50'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  AI 创作中...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>✨</span>
                  开始 AI 创作
                  <span>✨</span>
                </span>
              )}
            </motion.button>
          </motion.div>

          {/* Generation progress */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="glass-effect rounded-2xl p-4 space-y-3">
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyber-blue to-cyber-purple rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${((generationStep + 1) / GENERATION_STEPS.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                {GENERATION_STEPS.map((step, i) => (
                  <div key={i} className={`flex items-center gap-3 transition-all ${i <= generationStep ? 'opacity-100' : 'opacity-30'}`}>
                    <span className={`text-xl ${i <= generationStep ? 'animate-bounce' : ''}`}>{step.icon}</span>
                    <span className="text-white text-sm">{i <= generationStep ? step.text : '等待中...'}</span>
                    {i < generationStep && <span className="ml-auto text-green-400 text-sm">✓</span>}
                    {i === generationStep && <span className="ml-auto"><svg className="animate-spin h-4 w-4 text-cyber-blue" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></span>}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Latest generation preview */}
          <AnimatePresence>
            {generatedProducts.length > 0 && !isGenerating && (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass-effect rounded-2xl p-4">
                <h3 className="text-white font-bold text-lg mb-3">🎉 最新生成 / Latest Creation</h3>
                {generatedProducts[previewIndex] && (
                  <div>
                    <div className="relative rounded-xl overflow-hidden bg-white/5 border border-white/10 mb-3">
                      <img
                        src={generatedProducts[previewIndex].imageUrl}
                        alt="Generated"
                        className="w-full aspect-square object-contain"
                      />
                      <div className="absolute top-2 left-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${generatedProducts[previewIndex].productGradient}`}>
                          {generatedProducts[previewIndex].productIcon} {generatedProducts[previewIndex].productName}
                        </span>
                      </div>
                    </div>

                    {generatedProducts.length > 1 && (
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <button onClick={() => handlePreviewNavigate(-1)} className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all">◀</button>
                        <span className="text-white/60 text-sm">{previewIndex + 1} / {generatedProducts.length}</span>
                        <button onClick={() => handlePreviewNavigate(1)} className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all">▶</button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDownload(generatedProducts[previewIndex])}
                        className="flex-1 py-2.5 bg-gradient-to-r from-cyber-blue to-cyber-purple text-white rounded-xl font-bold text-sm"
                      >
                        📥 下载保存
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setSelectedType(null); setUploadedImage(null); setImagePreview(null); setUploadedVideo(null); setVideoPreview(null); }}
                        className="flex-1 py-2.5 bg-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/20"
                      >
                        🔄 继续创作
                      </motion.button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ===== GALLERY TAB ===== */}
      {activeTab === 'gallery' && (
        <div className="px-4">
          {generatedProducts.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-effect rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">🎨</div>
              <p className="text-white/60 text-lg mb-2">作品画廊是空的</p>
              <p className="text-white/30 text-sm mb-4">去创作你的第一个 AI 作品吧！</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('create')}
                className="px-6 py-3 bg-gradient-to-r from-cyber-blue to-cyber-purple text-white rounded-xl font-bold"
              >
                ✨ 开始创作
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {generatedProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-effect rounded-xl overflow-hidden group"
                >
                  <div className="aspect-square relative bg-white/5">
                    <img src={product.imageUrl} alt={product.productName} className="w-full h-full object-contain" />
                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${product.productGradient}`}>
                      {product.productIcon} {product.productName}
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDownload(product)}
                        className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-lg"
                        title="下载"
                      >📥</motion.button>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <div className="text-white text-xs font-medium truncate">{product.productName}</div>
                    <div className="text-white/30 text-[10px]">{new Date(product.createdAt).toLocaleDateString()}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== HISTORY TAB ===== */}
      {activeTab === 'history' && (
        <div className="px-4">
          {myCreations.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-effect rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-white/60 text-lg mb-2">还没有创作记录</p>
              <p className="text-white/30 text-sm mb-4">你的所有 AI 创作都会保存在这里</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('create')}
                className="px-6 py-3 bg-gradient-to-r from-cyber-blue to-cyber-purple text-white rounded-xl font-bold"
              >
                ✨ 开始创作
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/50 text-sm">共 {myCreations.length} 件作品</span>
                <button onClick={() => { localStorage.removeItem(CREATIONS_KEY); setMyCreations([]); }} className="text-red-400/60 text-xs hover:text-red-400 transition-colors">
                  清空记录
                </button>
              </div>
              {myCreations.map((creation, i) => (
                <motion.div
                  key={creation.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass-effect rounded-xl p-3 flex items-center gap-3"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${creation.productGradient} flex items-center justify-center text-2xl flex-shrink-0`}>
                    {creation.productIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm">{creation.productName}</div>
                    <div className="text-white/40 text-xs">{new Date(creation.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-1">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDownload(creation)}
                      className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center text-sm hover:bg-cyber-blue/30 transition-all"
                      title="下载"
                    >📥</motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== INFO SECTION ===== */}
      <div className="px-4 mt-6 mb-4">
        <div className="glass-effect rounded-2xl p-4 border border-cyber-blue/20">
          <h3 className="text-white font-bold text-sm mb-2">💡 使用提示 / Tips</h3>
          <ul className="space-y-1.5 text-white/40 text-xs">
            <li>📷 上传清晰、光照良好的宠物照片可获得最佳效果</li>
            <li>🎬 也可以上传宠物短视频，AI 会截取最佳帧</li>
            <li>⭐ 每种商品类型消耗不同积分，生成失败不扣积分</li>
            <li>💾 所有作品自动保存，可随时下载查看</li>
            <li>🔄 不满意可重新选择类型、更换素材再次生成</li>
          </ul>
        </div>
      </div>

      {/* Success toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-2">
              <span>✅</span> {successMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AIWorkshop;
