import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import SEO from '../components/SEO';

// ===== 主题化 SVG 图标组件 =====
const ProductIcon = ({ type, size = 40 }) => {
  const icons = {
    // 艺术写真 - 相机镜头
    portrait: (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="2.5"/>
        <circle cx="20" cy="20" r="9" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="20" cy="20" r="4" fill="currentColor"/>
        <circle cx="32" cy="10" r="3" fill="currentColor" opacity="0.6"/>
        <path d="M6 14l4-4" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
    // 表情包 - 彩虹便签
    sticker: (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <rect x="4" y="8" width="14" height="14" rx="3" fill="currentColor" transform="rotate(-10 4 8)"/>
        <rect x="14" y="4" width="14" height="14" rx="3" fill="currentColor" transform="rotate(5 14 4)" opacity="0.7"/>
        <rect x="22" y="16" width="14" height="14" rx="3" fill="currentColor" transform="rotate(-5 22 16)" opacity="0.5"/>
        <circle cx="10" cy="14" r="2" fill="white"/>
        <circle cx="20" cy="10" r="2" fill="white"/>
        <circle cx="28" cy="22" r="2" fill="white"/>
      </svg>
    ),
    // 壁纸 - 显示器
    wallpaper: (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <rect x="4" y="6" width="32" height="22" rx="3" stroke="currentColor" strokeWidth="2"/>
        <rect x="8" y="10" width="10" height="7" rx="1" fill="currentColor" opacity="0.3"/>
        <rect x="20" y="10" width="12" height="7" rx="1" fill="currentColor" opacity="0.5"/>
        <rect x="8" y="19" width="24" height="5" rx="1" fill="currentColor" opacity="0.4"/>
        <rect x="16" y="32" width="8" height="3" rx="1" fill="currentColor"/>
      </svg>
    ),
    // 周边 - 购物袋
    merch: (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M8 14h24l-3 18H11L8 14z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M14 14V10a6 6 0 1112 0v4" stroke="currentColor" strokeWidth="2" fill="none"/>
        <rect x="16" y="20" width="8" height="6" rx="1" fill="currentColor" opacity="0.5"/>
      </svg>
    ),
    // 故事 - 魔法书
    story: (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M6 8h28v24H6a2 2 0 01-2-2V10a2 2 0 012-2z" stroke="currentColor" strokeWidth="2"/>
        <path d="M6 8l4-4h20l4 4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M10 16h6v8h-6zM18 16h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="30" cy="12" r="4" fill="currentColor" opacity="0.3"/>
        <path d="M28 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
    // 头像 - 魔法光环
    avatar: (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3"/>
        <circle cx="20" cy="20" r="12" stroke="currentColor" strokeWidth="2"/>
        <circle cx="20" cy="16" r="5" fill="currentColor" opacity="0.7"/>
        <path d="M10 30c0-5 4.5-8 10-8s10 3 10 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    // 勋章 - 星际徽章
    badge: (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M20 4l3 8 8 1-6 6 2 8-7-4-7 4 2-8-6-6 8-1 3-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <circle cx="20" cy="20" r="6" fill="currentColor" opacity="0.5"/>
        <circle cx="20" cy="20" r="3" fill="currentColor"/>
      </svg>
    ),
    // 视频 - 电影胶片
    video: (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <rect x="6" y="10" width="28" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M28 16l8-4v16l-8-4V16z" fill="currentColor"/>
        <circle cx="10" cy="14" r="2" fill="currentColor"/>
        <circle cx="10" cy="20" r="2" fill="currentColor"/>
        <circle cx="10" cy="26" r="2" fill="currentColor"/>
        <circle cx="18" cy="14" r="2" fill="currentColor"/>
        <circle cx="18" cy="20" r="2" fill="currentColor"/>
        <circle cx="18" cy="26" r="2" fill="currentColor"/>
      </svg>
    ),
    // 赛博朋克
    cyber: (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <polygon points="20,4 36,12 36,28 20,36 4,28 4,12" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
        <path d="M10 20h6v6h-6zM24 14h6v12h-6z" fill="currentColor"/>
        <path d="M10 14h4v2h-4zM26 24h4v2h-4z" fill="currentColor" opacity="0.6"/>
        <circle cx="20" cy="20" r="4" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
    // 像素游戏
    pixel: (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <rect x="8" y="8" width="6" height="6" fill="currentColor"/>
        <rect x="16" y="8" width="6" height="6" fill="currentColor" opacity="0.8"/>
        <rect x="24" y="8" width="6" height="6" fill="currentColor" opacity="0.6"/>
        <rect x="8" y="16" width="6" height="6" fill="currentColor" opacity="0.7"/>
        <rect x="16" y="16" width="6" height="6" fill="currentColor"/>
        <rect x="24" y="16" width="6" height="6" fill="currentColor" opacity="0.9"/>
        <rect x="8" y="24" width="6" height="6" fill="currentColor" opacity="0.5"/>
        <rect x="16" y="24" width="6" height="6" fill="currentColor" opacity="0.8"/>
        <rect x="24" y="24" width="6" height="6" fill="currentColor" opacity="0.6"/>
      </svg>
    ),
    // 童话绘本
    fairytale: (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M20 6c-8 0-14 6-14 14 0 10 14 16 14 16s14-6 14-16c0-8-6-14-14-14z" stroke="currentColor" strokeWidth="2"/>
        <circle cx="20" cy="18" r="6" fill="currentColor" opacity="0.4"/>
        <path d="M20 10v4M16 14l4 4 4-4" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="14" cy="26" r="2" fill="currentColor" opacity="0.3"/>
        <circle cx="26" cy="24" r="1.5" fill="currentColor" opacity="0.4"/>
      </svg>
    ),
    // 水晶球
    crystal: (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <ellipse cx="20" cy="32" rx="10" ry="4" fill="currentColor" opacity="0.3"/>
        <circle cx="20" cy="18" r="12" stroke="currentColor" strokeWidth="2"/>
        <circle cx="20" cy="18" r="8" fill="currentColor" opacity="0.2"/>
        <circle cx="16" cy="14" r="3" fill="white" opacity="0.6"/>
        <path d="M12 28l8-10 8 10" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    ),
    // 变身机甲
    mecha: (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <rect x="12" y="8" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
        <rect x="14" y="10" width="4" height="3" fill="currentColor"/>
        <rect x="22" y="10" width="4" height="3" fill="currentColor"/>
        <rect x="8" y="20" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
        <rect x="4" y="22" width="6" height="10" rx="1" stroke="currentColor" strokeWidth="2"/>
        <rect x="30" y="22" width="6" height="10" rx="1" stroke="currentColor" strokeWidth="2"/>
        <circle cx="20" cy="28" r="4" fill="currentColor" opacity="0.5"/>
      </svg>
    ),
    // 节日贺卡
    holiday: (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <rect x="8" y="6" width="24" height="28" rx="3" stroke="currentColor" strokeWidth="2"/>
        <path d="M14 6v6M20 6v8M26 6v6" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="20" cy="24" r="8" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2"/>
        <text x="20" y="27" textAnchor="middle" fontSize="10" fill="currentColor">★</text>
      </svg>
    ),
    // 星座卡
    zodiac: (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="2"/>
        <circle cx="20" cy="20" r="12" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2"/>
        <circle cx="20" cy="8" r="2" fill="currentColor"/>
        <circle cx="20" cy="32" r="2" fill="currentColor"/>
        <circle cx="8" cy="20" r="2" fill="currentColor"/>
        <circle cx="32" cy="20" r="2" fill="currentColor"/>
        <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.6"/>
        <circle cx="28" cy="28" r="1.5" fill="currentColor" opacity="0.6"/>
        <circle cx="20" cy="20" r="4" fill="currentColor" opacity="0.3"/>
      </svg>
    ),
    // 搞笑表情
    meme: (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="2.5"/>
        <circle cx="13" cy="15" r="3" fill="currentColor"/>
        <circle cx="27" cy="15" r="3" fill="currentColor"/>
        <path d="M12 26c3 4 6 6 8 6s5-2 8-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M10 10l4 4M30 10l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  };
  return icons[type] || icons.portrait;
};

// ===== 新颖有趣的商品类型 =====
const PRODUCT_TYPES = [
  // Basic
  { id: 'portrait', name: 'Art Portrait', nameEn: 'Art Portrait', desc: 'Professional pet portrait', gradient: 'from-pink-500 to-rose-500', price: 50, tag: '🔥 Hot', tagStyle: 'bg-gradient-to-r from-pink-500 to-rose-500' },
  { id: 'avatar', name: 'Magic Avatar', nameEn: 'Magic Avatar', desc: 'Dreamy halo avatar', gradient: 'from-violet-500 to-purple-500', price: 40, tag: '✨ Featured', tagStyle: 'bg-gradient-to-r from-violet-500 to-purple-500' },
  { id: 'sticker', name: 'Rainbow Stickers', nameEn: 'Rainbow Stickers', desc: '16 rainbow stickers', gradient: 'from-orange-500 to-yellow-500', price: 80, tag: '', tagStyle: '' },
  
  // Style
  { id: 'cyber', name: 'Cyberpunk', nameEn: 'Cyberpunk', desc: 'Neon future style', gradient: 'from-cyan-400 to-blue-600', price: 60, tag: '⚡ Cool', tagStyle: 'bg-gradient-to-r from-cyan-400 to-blue-600' },
  { id: 'pixel', name: 'Pixel Art', nameEn: 'Pixel Art', desc: '8-bit retro game', gradient: 'from-green-500 to-emerald-500', price: 45, tag: '🎮 Retro', tagStyle: 'bg-gradient-to-r from-green-500 to-emerald-500' },
  { id: 'fairytale', name: 'Fairytale', nameEn: 'Fairytale', desc: 'Dreamy illustration', gradient: 'from-fuchsia-500 to-pink-400', price: 120, tag: '🌟 Dreamy', tagStyle: 'bg-gradient-to-r from-fuchsia-500 to-pink-400' },
  
  // Fun
  { id: 'crystal', name: 'Crystal Ball', nameEn: 'Crystal Ball', desc: 'Mystic fortune card', gradient: 'from-indigo-500 to-violet-500', price: 55, tag: '🔮 Mystic', tagStyle: 'bg-gradient-to-r from-indigo-500 to-violet-500' },
  { id: 'mecha', name: 'Mecha', nameEn: 'Mecha', desc: 'Cool mecha style', gradient: 'from-slate-600 to-zinc-500', price: 88, tag: '🤖 Hardcore', tagStyle: 'bg-gradient-to-r from-slate-600 to-zinc-500' },
  { id: 'meme', name: 'Funny Meme', nameEn: 'Funny Meme', desc: 'Hilarious meme pack', gradient: 'from-yellow-400 to-orange-500', price: 35, tag: '😂 Funny', tagStyle: 'bg-gradient-to-r from-yellow-400 to-orange-500' },
  
  // Theme
  { id: 'holiday', name: 'Holiday Card', nameEn: 'Holiday Card', desc: 'Festival special card', gradient: 'from-red-500 to-pink-500', price: 50, tag: '🎉 Festive', tagStyle: 'bg-gradient-to-r from-red-500 to-pink-500' },
  { id: 'zodiac', name: 'Zodiac Card', nameEn: 'Zodiac Card', desc: 'Personal constellation', gradient: 'from-blue-500 to-cyan-400', price: 42, tag: '⭐ Fortune', tagStyle: 'bg-gradient-to-r from-blue-500 to-cyan-400' },
  
  // Util
  { id: 'wallpaper', name: 'Wallpaper', nameEn: 'Wallpaper', desc: 'HD wallpaper', gradient: 'from-purple-500 to-violet-500', price: 60, tag: '', tagStyle: '' },
  { id: 'merch', name: 'Merch Design', nameEn: 'Merch Design', desc: 'T-shirt/mug/case', gradient: 'from-teal-500 to-cyan-500', price: 100, tag: '', tagStyle: '' },
  { id: 'story', name: 'Story Book', nameEn: 'Story Book', desc: 'Illustrated story', gradient: 'from-amber-500 to-orange-500', price: 150, tag: '', tagStyle: '' },
  { id: 'badge', name: 'Badge', nameEn: 'Badge', desc: 'Achievement badge', gradient: 'from-yellow-500 to-amber-500', price: 30, tag: '', tagStyle: '' },
  { id: 'video', name: 'Fun Video', nameEn: 'Fun Video', desc: 'AI short video', gradient: 'from-rose-500 to-red-500', price: 200, tag: 'NEW', tagStyle: 'bg-gradient-to-r from-rose-500 to-red-500' },
];

const GENERATION_STEPS = [
  { icon: '🔍', text: 'Analyzing pet features...', textEn: 'Analyzing pet features...' },
  { icon: '🎨', text: 'Matching best style...', textEn: 'Matching best style...' },
  { icon: '✨', text: 'Generating creative content...', textEn: 'Generating creative content...' },
  { icon: '🎁', text: 'Packaging final product...', textEn: 'Packaging final product...' },
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
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const CREATIONS_KEY = 'paw_workshop_creations';

  // 分类映射
  const categoryMap = {
    style: ['portrait', 'avatar', 'cyber', 'pixel', 'fairytale'],
    fun: ['crystal', 'mecha', 'meme', 'sticker'],
    theme: ['holiday', 'zodiac'],
    util: ['wallpaper', 'merch', 'story', 'badge', 'video'],
  };

  // 筛选后的产品列表
  const filteredProducts = categoryFilter === 'all' 
    ? PRODUCT_TYPES 
    : PRODUCT_TYPES.filter(p => categoryMap[categoryFilter]?.includes(p.id));

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
      alert('Video file cannot exceed 50MB');
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
    let backendConnected = false;
    try {
      await api.get('/health', { timeout: 3000 });
      backendConnected = true;
      setBackendAvailable(true);
    } catch (e) {
      console.log('⚠️ Backend not running, using local generation');
      setBackendAvailable(false);
    }

    // 先执行前两步模拟（同时等待后端准备）
    for (let i = 0; i < 2; i++) {
      setGenerationStep(i);
      await new Promise(r => setTimeout(r, 600 + Math.random() * 300));
    }

    // 尝试调用后端 API
    let result = null;
    if (backendConnected) {
      try {
        setGenerationStep(2);
        const requestBody = {
          imageBase64: uploadedImage,
          productType: selectedType,
          petName: localStorage.getItem('paw_train_pet_state') 
            ? JSON.parse(localStorage.getItem('paw_train_pet_state')).name || 'Pet'
            : 'Pet',
          petType: localStorage.getItem('paw_train_pet_state')
            ? JSON.parse(localStorage.getItem('paw_train_pet_state')).type || 'cat'
            : 'cat',
          petColor: 'variegated',
        };

        const res = await api.post('/workshop/generate', requestBody, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 90000,
        });
        if (res.data?.success && res.data?.creation) {
          result = res.data.creation;
          console.log('✅ Backend generation successful');
        }
      } catch (err) {
        const status = err.response?.status;
        const errorCode = err.response?.data?.error?.code;
        const errorMsg = err.response?.data?.error?.message || err.message;
        
        // 检查是否是配额错误（14003）
        if (errorCode === 14003 || errorMsg?.includes('限额') || errorMsg?.includes('quota')) {
          console.warn('⚠️ AI model quota insufficient, switched to local generation mode');
          setSuccessMessage('AI model resources temporarily unavailable, using local engine generation');
        } else {
          console.log(`⚠️ Backend generation failed (HTTP ${status || 'network error'}), falling back to local generation`);
        }
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
      productName: product.name,
      productNameEn: product.nameEn,
      productGradient: product.gradient,
      createdAt: new Date().toISOString(),
    };

    setGeneratedProducts(prev => [newProduct, ...prev]);
    saveCreation(newProduct);
    setIsGenerating(false);
    setSuccessMessage(`${product.nameEn} Created!`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const generateMockProduct = (type, imageSrc) => {
    const product = getProductById(type);
    // 根据模板类型选择匹配的配色
    const colorMap = {
      portrait: ['#ec4899', '#f43f5e'],
      cyber: ['#06b6d4', '#3b82f6'],
      pixel: ['#22c55e', '#10b981'],
      fairytale: ['#d946ef', '#ec4899'],
      crystal: ['#6366f1', '#8b5cf6'],
      mecha: ['#64748b', '#475569'],
      meme: ['#facc15', '#f97316'],
      sticker: ['#f97316', '#fbbf24'],
      zodiac: ['#3b82f6', '#06b6d4'],
      holiday: ['#ef4444', '#f43f5e'],
      avatar: ['#8b5cf6', '#a855f7'],
      wallpaper: ['#a855f7', '#d946ef'],
      merch: ['#14b8a6', '#06b6d4'],
      story: ['#f59e0b', '#f97316'],
      badge: ['#eab308', '#facc15'],
      video: ['#f43f5e', '#ec4899'],
    };
    const [c1, c2] = colorMap[type] || ['#667eea', '#764ba2'];

    const artwork = generateArtworkSVG(type, c1, c2, imageSrc);

    return {
      imageUrl: artwork,
      productName: product?.name || 'Creation',
      productNameEn: product?.nameEn || 'Creation',
      provider: 'local',
    };
  };

  // ===== 生成主题化 SVG 模板 =====
  const generateArtworkSVG = (type, c1, c2, imageSrc) => {
    const product = getProductById(type);
    const w = 512, h = 512;
    const safeImageSrc = imageSrc ? imageSrc.replace(/"/g, '&quot;') : '';
    
    // 基础 SVG 定义
    const defs = `
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c1}"/>
      <stop offset="100%" style="stop-color:${c2}"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>`;
    
    // 生成图片内容
    const getImageContent = (clipId, clipPath, x, y, w, h) => {
      if (imageSrc) {
        return `<g clip-path="${clipId}">
          <image href="${safeImageSrc}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>
        </g>`;
      }
      return '';
    };
    
    // 不同模板的形状和装饰
    const templateConfigs = {
      portrait: { // 艺术写真 - 椭圆形相框
        shape: 'ellipse', cx: 256, cy: 220, rx: 180, ry: 190,
        decorations: `<ellipse cx="256" cy="220" rx="190" ry="200" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="6"/>
                     <ellipse cx="256" cy="220" rx="210" ry="220" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" stroke-dasharray="8 4"/>`,
        label: 'ART PORTRAIT',
        footer: 'Professional Pet Photography'
      },
      cyber: { // 赛博朋克 - 六边形
        shape: 'hexagon', points: '256,30 430,140 430,370 256,480 82,370 82,140',
        decorations: `<polygon points="256,20 440,135 440,375 256,490 72,375 72,135" fill="none" stroke="#00ffff" stroke-width="4"/>
                     <polygon points="256,40 420,145 420,365 256,470 92,365 92,145" fill="none" stroke="#ff00ff" stroke-width="2" opacity="0.5"/>`,
        label: '⚡ CYBERPUNK',
        footer: 'Neon Future Style'
      },
      pixel: { // 像素游戏 - 方形像素风
        shape: 'rect', x: 66, y: 66, width: 380, height: 380,
        decorations: `<rect x="56" y="56" width="400" height="400" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="12"/>
                     <rect x="40" y="40" width="40" height="40" fill="${c1}" opacity="0.7"/>
                     <rect x="88" y="40" width="40" height="40" fill="${c2}" opacity="0.7"/>
                     <rect x="136" y="40" width="40" height="40" fill="${c1}" opacity="0.7"/>
                     <rect x="432" y="40" width="40" height="40" fill="${c2}" opacity="0.7"/>
                     <rect x="432" y="88" width="40" height="40" fill="${c1}" opacity="0.7"/>
                     <rect x="432" y="136" width="40" height="40" fill="${c2}" opacity="0.7"/>
                     <rect x="432" y="432" width="40" height="40" fill="${c1}" opacity="0.7"/>
                     <rect x="384" y="432" width="40" height="40" fill="${c2}" opacity="0.7"/>
                     <rect x="40" y="432" width="40" height="40" fill="${c2}" opacity="0.7"/>`,
        label: '🎮 PIXEL ART',
        footer: '8-bit Retro Game Style'
      },
      fairytale: { // 童话绘本 - 圆形魔法镜
        shape: 'circle', cx: 256, cy: 220, r: 175,
        decorations: `<circle cx="256" cy="220" r="185" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="4"/>
                     <circle cx="256" cy="220" r="200" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" stroke-dasharray="6 4"/>
                     <path d="M256 15 L268 42 L296 42 L273 60 L282 88 L256 72 L230 88 L239 60 L216 42 L244 42 Z" fill="rgba(255,255,255,0.4)"/>`,
        label: '✨ FAIRYTALE',
        footer: 'Magical Dream Style'
      },
      crystal: { // 水晶球占卜 - 球形
        shape: 'circle', cx: 256, cy: 210, r: 165,
        decorations: `<circle cx="256" cy="210" r="175" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="6"/>
                     <ellipse cx="256" cy="405" rx="110" ry="25" fill="rgba(255,255,255,0.15)"/>
                     <circle cx="215" cy="155" r="30" fill="rgba(255,255,255,0.25)"/>
                     <circle cx="205" cy="148" r="12" fill="rgba(255,255,255,0.5)"/>`,
        label: '🔮 CRYSTAL BALL',
        footer: 'Mystic Fortune Telling'
      },
      mecha: { // 机甲变身 - 科技边框
        shape: 'bevel', points: '116,56 396,56 456,116 456,396 396,456 116,456 56,396 56,116',
        decorations: `<polygon points="116,56 396,56 456,116 456,396 396,456 116,456 56,396 56,116" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="5"/>
                     <polygon points="106,46 406,46 466,106 466,406 406,466 106,466 46,406 46,106" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
                     <rect x="56" y="190" width="25" height="10" fill="${c1}"/>
                     <rect x="56" y="210" width="18" height="6" fill="${c1}" opacity="0.6"/>
                     <rect x="431" y="290" width="25" height="10" fill="${c1}"/>
                     <rect x="438" y="270" width="18" height="6" fill="${c1}" opacity="0.6"/>`,
        label: '🤖 MECHA',
        footer: 'Futuristic Robot Style'
      },
      meme: { // 搞笑表情 - 大圆脸
        shape: 'circle', cx: 256, cy: 235, r: 185,
        decorations: `<circle cx="256" cy="235" r="195" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="5"/>
                     <path d="M100 85 L125 110 M412 85 L387 110" stroke="rgba(255,255,255,0.4)" stroke-width="5" stroke-linecap="round"/>
                     <path d="M100 385 L125 360 M412 385 L387 360" stroke="rgba(255,255,255,0.4)" stroke-width="5" stroke-linecap="round"/>`,
        label: '😂 FUNNY MEME',
        footer: 'Hilarious Expression'
      },
      sticker: { // 彩虹表情包 - 多格拼图
        shape: 'grid',
        gridCells: [
          { x: 66, y: 66, w: 170, h: 170 },
          { x: 276, y: 66, w: 170, h: 170 },
          { x: 66, y: 276, w: 170, h: 170 },
          { x: 276, y: 276, w: 170, h: 170 }
        ],
        decorations: '',
        label: '🎉 STICKER PACK',
        footer: '16 Cute Expressions'
      },
      zodiac: { // 星座运势 - 星盘
        shape: 'circle', cx: 256, cy: 225, r: 175,
        decorations: `<circle cx="256" cy="225" r="185" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
                     <circle cx="256" cy="225" r="205" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1" stroke-dasharray="8 4"/>
                     <circle cx="256" cy="225" r="155" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
                     <line x1="256" y1="20" x2="256" y2="60" stroke="rgba(255,255,255,0.5)" stroke-width="3"/>
                     <line x1="256" y1="390" x2="256" y2="430" stroke="rgba(255,255,255,0.5)" stroke-width="3"/>
                     <line x1="51" y1="225" x2="91" y2="225" stroke="rgba(255,255,255,0.5)" stroke-width="3"/>
                     <line x1="421" y1="225" x2="461" y2="225" stroke="rgba(255,255,255,0.5)" stroke-width="3"/>
                     <circle cx="256" cy="20" r="7" fill="rgba(255,255,255,0.6)"/>
                     <circle cx="256" cy="430" r="7" fill="rgba(255,255,255,0.6)"/>
                     <circle cx="51" cy="225" r="7" fill="rgba(255,255,255,0.6)"/>
                     <circle cx="461" cy="225" r="7" fill="rgba(255,255,255,0.6)"/>`,
        label: '⭐ ZODIAC CARD',
        footer: 'Personal Constellation'
      },
      holiday: { // 节日贺卡 - 信封
        shape: 'envelope', x: 66, y: 100, width: 380, height: 280,
        decorations: `<rect x="66" y="100" width="380" height="280" rx="20" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="4"/>
                     <path d="M66 150 L256 280 L446 150" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                     <rect x="226" y="60" width="60" height="45" rx="8" fill="rgba(255,255,255,0.2)"/>
                     <circle cx="130" y="410" r="18" fill="rgba(255,255,255,0.2)"/>
                     <circle cx="382" cy="410" r="14" fill="rgba(255,255,255,0.15)"/>`,
        label: '🎊 HOLIDAY CARD',
        footer: 'Festival Special Edition'
      },
      avatar: { // 魔法头像 - 魔法光环
        shape: 'circle', cx: 256, cy: 225, r: 170,
        decorations: `<circle cx="256" cy="225" r="180" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="3"/>
                     <circle cx="256" cy="225" r="200" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" stroke-dasharray="10 5"/>
                     <circle cx="256" cy="225" r="160" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>`,
        label: '✨ MAGIC AVATAR',
        footer: 'Dreamy Halo Style'
      },
      wallpaper: { // 手机壁纸 - 宽屏
        shape: 'phone', x: 106, y: 56, width: 300, height: 400,
        decorations: `<rect x="106" y="56" width="300" height="400" rx="25" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="4"/>
                     <rect x="116" y="66" width="280" height="380" rx="20" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
                     <rect x="196" y="56" width="120" height="16" rx="8" fill="rgba(255,255,255,0.15)"/>
                     <circle cx="306" cy="430" r="20" fill="rgba(255,255,255,0.1)"/>`,
        label: '📱 WALLPAPER',
        footer: 'Mobile & Desktop'
      },
      merch: { // 周边设计 - 马克杯
        shape: 'mug', cx: 256, cy: 256, r: 140,
        decorations: `<ellipse cx="256" cy="380" rx="100" ry="20" fill="rgba(255,255,255,0.15)"/>
                     <ellipse cx="256" cy="130" rx="100" ry="20" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="4"/>
                     <path d="M356 180 Q410 180 410 256 Q410 332 356 332" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="5"/>
                     <path d="M356 195 Q395 195 395 256 Q395 317 356 317" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>`,
        label: '🎁 MERCH DESIGN',
        footer: 'T-Shirt · Mug · Phone Case'
      },
      story: { // 故事绘本 - 书本
        shape: 'book', x: 56, y: 66, width: 400, height: 340,
        decorations: `<rect x="56" y="66" width="400" height="340" rx="15" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="4"/>
                     <line x1="256" y1="66" x2="256" y2="406" stroke="rgba(255,255,255,0.3)" stroke-width="3"/>
                     <rect x="66" y="56" width="100" height="20" rx="5" fill="rgba(255,255,255,0.2)"/>
                     <rect x="346" y="396" width="100" height="20" rx="5" fill="rgba(255,255,255,0.2)"/>`,
        label: '📖 STORY BOOK',
        footer: 'Illustrated Adventure'
      },
      badge: { // 荣誉徽章 - 盾牌
        shape: 'shield',
        decorations: `<path d="M256 30 L420 100 L420 280 Q420 380 256 460 Q92 380 92 280 L92 100 Z" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="5"/>
                     <path d="M256 50 L400 110 L400 275 Q400 360 256 430 Q112 360 112 275 L112 110 Z" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
                     <circle cx="256" cy="200" r="80" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
                     <path d="M256 120 L270 160 L315 160 L280 185 L292 230 L256 205 L220 230 L232 185 L197 160 L242 160 Z" fill="rgba(255,255,255,0.3)"/>`,
        label: '🏆 BADGE',
        footer: 'Achievement Unlocked'
      },
      video: { // 趣味视频 - 胶片
        shape: 'film', x: 56, y: 66, width: 400, height: 340,
        decorations: `<rect x="56" y="66" width="400" height="340" rx="10" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="4"/>
                     <rect x="56" y="56" width="400" height="20" rx="10" fill="rgba(255,255,255,0.15)"/>
                     <rect x="56" y="396" width="400" height="20" rx="10" fill="rgba(255,255,255,0.15)"/>
                     <circle cx="80" cy="66" r="8" fill="rgba(255,255,255,0.3)"/>
                     <circle cx="432" cy="66" r="8" fill="rgba(255,255,255,0.3)"/>
                     <circle cx="80" cy="406" r="8" fill="rgba(255,255,255,0.3)"/>
                     <circle cx="432" cy="406" r="8" fill="rgba(255,255,255,0.3)"/>
                     <rect x="86" y="96" width="30" height="20" rx="3" fill="rgba(255,255,255,0.15)"/>
                     <rect x="86" y="126" width="30" height="20" rx="3" fill="rgba(255,255,255,0.15)"/>
                     <rect x="86" y="156" width="30" height="20" rx="3" fill="rgba(255,255,255,0.15)"/>`,
        label: '🎬 FUN VIDEO',
        footer: 'AI-Generated Short Clip'
      },
    };
    
    const config = templateConfigs[type] || templateConfigs.portrait;
    
    // 构建内容 SVG
    let contentSvg = '';
    let clipId = 'mainClip';
    
    if (config.shape === 'circle') {
      contentSvg = `
    <clipPath id="${clipId}"><circle cx="${config.cx}" cy="${config.cy}" r="${config.r}"/></clipPath>
    <circle cx="${config.cx}" cy="${config.cy}" r="${config.r}" fill="url(#bg)"/>
    ${imageSrc ? `<g clip-path="url(#${clipId})"><image href="${safeImageSrc}" x="${config.cx - config.r}" y="${config.cy - config.r}" width="${config.r * 2}" height="${config.r * 2}" preserveAspectRatio="xMidYMid slice"/></g>` : ''}
    ${config.decorations || ''}`;
    } else if (config.shape === 'ellipse') {
      contentSvg = `
    <clipPath id="${clipId}"><ellipse cx="${config.cx}" cy="${config.cy}" rx="${config.rx}" ry="${config.ry}"/></clipPath>
    <ellipse cx="${config.cx}" cy="${config.cy}" rx="${config.rx}" ry="${config.ry}" fill="url(#bg)"/>
    ${imageSrc ? `<g clip-path="url(#${clipId})"><image href="${safeImageSrc}" x="${config.cx - config.rx}" y="${config.cy - config.ry}" width="${config.rx * 2}" height="${config.ry * 2}" preserveAspectRatio="xMidYMid slice"/></g>` : ''}
    ${config.decorations || ''}`;
    } else if (config.shape === 'rect') {
      contentSvg = `
    <clipPath id="${clipId}"><rect x="${config.x}" y="${config.y}" width="${config.width}" height="${config.height}" rx="8"/></clipPath>
    <rect x="${config.x}" y="${config.y}" width="${config.width}" height="${config.height}" rx="8" fill="url(#bg)"/>
    ${imageSrc ? `<g clip-path="url(#${clipId})"><image href="${safeImageSrc}" x="${config.x}" y="${config.y}" width="${config.width}" height="${config.height}" preserveAspectRatio="xMidYMid slice"/></g>` : ''}
    ${config.decorations || ''}`;
    } else if (config.shape === 'hexagon') {
      contentSvg = `
    <clipPath id="${clipId}"><polygon points="${config.points}"/></clipPath>
    <polygon points="${config.points}" fill="url(#bg)"/>
    ${imageSrc ? `<g clip-path="url(#${clipId})"><image href="${safeImageSrc}" x="82" y="140" width="348" height="340" preserveAspectRatio="xMidYMid slice"/></g>` : ''}
    ${config.decorations || ''}`;
    } else if (config.shape === 'bevel') {
      contentSvg = `
    <clipPath id="${clipId}"><polygon points="${config.points}"/></clipPath>
    <polygon points="${config.points}" fill="url(#bg)"/>
    ${imageSrc ? `<g clip-path="url(#${clipId})"><image href="${safeImageSrc}" x="116" y="116" width="280" height="280" preserveAspectRatio="xMidYMid slice"/></g>` : ''}
    ${config.decorations || ''}`;
    } else if (config.shape === 'shield') {
      contentSvg = `
    <clipPath id="${clipId}"><path d="M256 80 L380 140 L380 300 Q380 380 256 440 Q132 380 132 300 L132 140 Z"/></clipPath>
    <path d="M256 50 L420 120 L420 290 Q420 390 256 470 Q92 390 92 290 L92 120 Z" fill="url(#bg)"/>
    ${imageSrc ? `<g clip-path="url(#${clipId})"><image href="${safeImageSrc}" x="132" y="120" width="248" height="320" preserveAspectRatio="xMidYMid slice"/></g>` : ''}
    ${config.decorations || ''}`;
    } else if (config.shape === 'grid') {
      // 多格表情包
      const cells = config.gridCells || [];
      contentSvg = cells.map((cell, i) => `
    <clipPath id="clip${i}"><rect x="${cell.x}" y="${cell.y}" width="${cell.w}" height="${cell.h}" rx="20"/></clipPath>
    <rect x="${cell.x}" y="${cell.y}" width="${cell.w}" height="${cell.h}" rx="20" fill="${i % 2 === 0 ? c1 : c2}" opacity="0.7"/>
    ${imageSrc ? `<g clip-path="url(#clip${i})"><image href="${safeImageSrc}" x="${cell.x}" y="${cell.y}" width="${cell.w}" height="${cell.h}" preserveAspectRatio="xMidYMid slice" opacity="0.9"/></g>` : `<text x="${cell.x + cell.w/2}" y="${cell.y + cell.h/2 + 30}" text-anchor="middle" font-size="80" fill="rgba(255,255,255,0.8)">😺</text>`}
    <rect x="${cell.x}" y="${cell.y}" width="${cell.w}" height="${cell.h}" rx="20" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="3"/>`).join('');
    } else if (config.shape === 'film') {
      contentSvg = `
    <clipPath id="${clipId}"><rect x="${config.x}" y="${config.y}" width="${config.width}" height="${config.height}" rx="10"/></clipPath>
    <rect x="${config.x}" y="${config.y}" width="${config.width}" height="${config.height}" rx="10" fill="url(#bg)"/>
    ${imageSrc ? `<g clip-path="url(#${clipId})"><image href="${safeImageSrc}" x="${config.x + 140}" y="${config.y + 30}" width="${config.width - 200}" height="${config.height - 80}" preserveAspectRatio="xMidYMid slice"/></g>` : ''}
    ${config.decorations || ''}`;
    } else if (config.shape === 'phone') {
      contentSvg = `
    <clipPath id="${clipId}"><rect x="${config.x + 15}" y="${config.y + 30}" width="${config.width - 30}" height="${config.height - 60}" rx="15"/></clipPath>
    <rect x="${config.x}" y="${config.y}" width="${config.width}" height="${config.height}" rx="25" fill="url(#bg)"/>
    ${imageSrc ? `<g clip-path="url(#${clipId})"><image href="${safeImageSrc}" x="${config.x + 15}" y="${config.y + 30}" width="${config.width - 30}" height="${config.height - 60}" preserveAspectRatio="xMidYMid slice"/></g>` : ''}
    ${config.decorations || ''}`;
    } else if (config.shape === 'mug') {
      contentSvg = `
    <ellipse cx="256" cy="380" rx="100" ry="25" fill="url(#bg)" opacity="0.5"/>
    <ellipse cx="256" cy="130" rx="100" ry="25" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="4"/>
    ${imageSrc ? `<ellipse cx="256" cy="256" rx="80" ry="110" fill="url(#bg)"/><ellipse cx="256" cy="256" rx="70" ry="100" fill="rgba(255,255,255,0.1)"/>` : ''}
    ${config.decorations || ''}`;
    } else if (config.shape === 'book') {
      contentSvg = `
    <clipPath id="${clipId}"><rect x="${config.x + 5}" y="${config.y}" width="${config.width - 10}" height="${config.height}" rx="10"/></clipPath>
    <rect x="${config.x}" y="${config.y}" width="${config.width}" height="${config.height}" rx="15" fill="url(#bg)"/>
    ${imageSrc ? `<g clip-path="url(#${clipId})"><image href="${safeImageSrc}" x="${config.x + 140}" y="${config.y + 30}" width="${config.width - 200}" height="${config.height - 60}" preserveAspectRatio="xMidYMid slice"/></g>` : ''}
    ${config.decorations || ''}`;
    } else if (config.shape === 'envelope') {
      contentSvg = `
    <clipPath id="${clipId}"><rect x="${config.x}" y="${config.y}" width="${config.width}" height="${config.height}" rx="20"/></clipPath>
    <rect x="${config.x}" y="${config.y}" width="${config.width}" height="${config.height}" rx="20" fill="url(#bg)"/>
    ${imageSrc ? `<g clip-path="url(#${clipId})"><image href="${safeImageSrc}" x="${config.x + 20}" y="${config.y + 50}" width="${config.width - 40}" height="${config.height - 100}" preserveAspectRatio="xMidYMid slice"/></g>` : ''}
    ${config.decorations || ''}`;
    } else {
      // 默认矩形
      contentSvg = `
    <clipPath id="${clipId}"><rect x="86" y="86" width="340" height="340" rx="16"/></clipPath>
    <rect x="86" y="86" width="340" height="340" rx="16" fill="url(#bg)"/>
    ${imageSrc ? `<g clip-path="url(#${clipId})"><image href="${safeImageSrc}" x="86" y="86" width="340" height="340" preserveAspectRatio="xMidYMid slice"/></g>` : ''}
    <rect x="86" y="86" width="340" height="340" rx="16" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="3"/>`;
    }
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${defs}
  <rect width="${w}" height="${h}" fill="#1a1a2e"/>
  <circle cx="70" cy="70" r="80" fill="rgba(255,255,255,0.03)"/>
  <circle cx="442" cy="442" r="100" fill="rgba(255,255,255,0.02)"/>
  ${contentSvg}
  <text x="256" y="485" text-anchor="middle" font-size="16" fill="rgba(255,255,255,0.5)" font-weight="bold" letter-spacing="3">${config.label}</text>
  <text x="256" y="505" text-anchor="middle" font-size="12" fill="rgba(255,255,255,0.35)">${config.footer}</text>
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
      <SEO title="AI Creation Workshop" description="Transform your pet photos into AI-generated art, stickers, wallpapers, and more. Choose from 16 creative styles on PawPawTrain." keywords="AI pet art, pet portrait, AI stickers, pet wallpaper generator, AI pet creation" />
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white text-center">🤖 AI Creation Workshop</h1>
          <p className="text-white/50 text-center text-sm mt-1">
            Generate creative works from pet photos
          </p>
        </motion.div>
      </div>

      {/* Tab switcher */}
      <div className="px-4 mb-4">
        <div className="glass-effect rounded-2xl p-1.5 flex gap-1">
          {[
            { id: 'create', icon: '✨', label: 'Create', labelEn: 'Create' },
            { id: 'gallery', icon: '🖼️', label: 'Gallery', labelEn: 'Gallery' },
            { id: 'history', icon: '📦', label: 'My Works', labelEn: 'My Works' },
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
              <span className="sm:hidden text-xs opacity-60">{tab.labelEn}</span>
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
              <span>Select Template</span>
            </h3>
            {/* 分类标签 */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { id: 'all', label: 'All', labelEn: 'All' },
                { id: 'style', label: 'Style', labelEn: 'Style', icon: '🎨' },
                { id: 'fun', label: 'Fun', labelEn: 'Fun', icon: '🎮' },
                { id: 'theme', label: 'Theme', labelEn: 'Theme', icon: '🎉' },
                { id: 'util', label: 'Util', labelEn: 'Util', icon: '📦' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    categoryFilter === cat.id 
                      ? 'bg-white/20 text-white border border-white/30' 
                      : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {cat.icon && <span className="mr-1">{cat.icon}</span>}
                  <span>{cat.label}</span>
                  <span className="text-white/40 ml-1 hidden sm:inline">{cat.labelEn}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {filteredProducts.map((type, index) => (
                <motion.button
                  key={type.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03, type: 'spring', stiffness: 200 }}
                  whileHover={{ scale: 1.08, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedType(type.id === selectedType ? null : type.id)}
                  className={`relative p-3 rounded-2xl text-center transition-all duration-300 border-2 overflow-hidden ${
                    selectedType === type.id
                      ? `border-white/50 bg-gradient-to-br ${type.gradient} shadow-xl`
                      : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                  }`}
                >
                  {/* 动态背景光效 */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${type.gradient} ${selectedType === type.id ? 'opacity-30' : 'opacity-0'} transition-opacity duration-300`} />
                  
                  {/* 特色角标 */}
                  {type.tag && (
                    <div className={`absolute -top-0.5 -right-0.5 ${type.tagStyle} text-white text-[9px] px-2 py-0.5 rounded-bl-lg rounded-tr-2xl font-bold shadow-lg z-10 flex items-center gap-0.5`}>
                      {type.tag}
                    </div>
                  )}
                  
                  {/* 主图标容器 */}
                  <div className={`relative mx-auto mb-2 ${selectedType === type.id ? 'scale-110' : ''} transition-transform duration-300`}>
                    <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${type.gradient} flex items-center justify-center shadow-lg transition-shadow ${selectedType === type.id ? 'shadow-xl' : ''}`}>
                      <ProductIcon type={type.id} size={36} />
                    </div>
                    {/* 选中时的脉冲光环 */}
                    {selectedType === type.id && (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${type.gradient} blur-lg -z-10`}
                      />
                    )}
                  </div>
                  
                  {/* 文字内容 */}
                  <div className="relative">
                    <div className="text-white text-sm font-bold mb-0.5">{type.name}</div>
                    <div className="text-white/40 text-[10px] mb-2">{type.nameEn}</div>
                    
                    {/* 价格 */}
                    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      selectedType === type.id 
                        ? 'bg-white/25 text-white backdrop-blur-sm' 
                        : 'bg-white/10 text-white/70'
                    }`}>
                      ⭐ {type.price}
                    </div>
                  </div>
                  
                  {/* 选中动画 */}
                  {selectedType === type.id && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-lg"
                    >
                      <svg className="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-white/40">
                <div className="text-4xl mb-2">🔍</div>
                <p>No templates in this category</p>
              </div>
            )}
          </motion.div>

          {/* Step 2: Upload Image/Video */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-effect rounded-2xl p-4">
            <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-gradient-to-r from-cyber-blue to-cyber-purple flex items-center justify-center text-sm">2</span>
              <span>Upload Media</span>
            </h3>

            {/* Upload tabs */}
            <div className="flex gap-2 mb-3">
              <button onClick={() => setShowPetGallery(false)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!showPetGallery ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/50' : 'bg-white/5 text-white/50 border border-white/10'}`}>
                📷 <span>Upload Photo</span>
              </button>
              <button onClick={() => setShowPetGallery(true)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${showPetGallery ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/50' : 'bg-white/5 text-white/50 border border-white/10'}`}>
                📚 <span>From Gallery</span>
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
                        <span className="text-white opacity-0 group-hover:opacity-100 transition-all text-sm bg-black/50 px-3 py-1 rounded-full">
                          Tap to Replace
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-2">📷</div>
                      <p className="text-white/60 text-sm">
                        <span>Click to upload pet photo</span>
                      </p>
                      <p className="text-white/30 text-xs mt-1">
                        <span>Supports JPG / PNG / WebP</span>
                      </p>
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
                        <span className="text-white opacity-0 group-hover:opacity-100 transition-all text-sm bg-black/50 px-3 py-1 rounded-full">
                          Tap to Replace
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl mb-1">🎬</div>
                      <p className="text-white/60 text-sm">
                        <span>Or upload pet video (optional)</span>
                      </p>
                      <p className="text-white/30 text-xs mt-1">
                        <span>Max 50MB, MP4 / MOV</span>
                      </p>
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
                    <p className="text-sm">
                      <span>No pet photos uploaded yet</span>
                    </p>
                    <button onClick={() => setShowPetGallery(false)} className="mt-2 text-cyber-blue text-sm underline">
                      <span>Upload New</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Cost info */}
            {selectedType && (uploadedImage || uploadedVideo) && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">
                    <span>Points Cost</span>
                  </span>
                  <span className="text-cyber-yellow font-bold">⭐ {getProductById(selectedType).price}</span>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* API Status Indicator */}
            {backendAvailable === false && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-3 p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                <span className="text-yellow-200">
                  <span>Local Mode: AI unavailable, using local engine</span>
                </span>
              </motion.div>
            )}

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
                  <span>AI Creating...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>✨</span>
                  <span>Start AI Creation</span>
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
                    <span className="text-white text-sm">
                      {i <= generationStep ? (
                        <span>{step.text}</span>
                      ) : (
                        <span>Waiting...</span>
                      )}
                    </span>
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
                <h3 className="text-white font-bold text-lg mb-3">
                  <span>🎉 Latest Creation</span>
                </h3>
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
                          {generatedProducts[previewIndex].productName}
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
                        📥 <span>Download</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setSelectedType(null); setUploadedImage(null); setImagePreview(null); setUploadedVideo(null); setVideoPreview(null); }}
                        className="flex-1 py-2.5 bg-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/20"
                      >
                        🔄 <span>Create More</span>
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
              <p className="text-white/60 text-lg mb-2">
                <span>Gallery is empty</span>
              </p>
              <p className="text-white/30 text-sm mb-4">
                <span>Create your first AI masterpiece!</span>
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('create')}
                className="px-6 py-3 bg-gradient-to-r from-cyber-blue to-cyber-purple text-white rounded-xl font-bold"
              >
                ✨ <span>Start Creating</span>
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
                      {product.productName}
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDownload(product)}
                        className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-lg"
                        title="Download"
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
              <p className="text-white/60 text-lg mb-2">
                <span>No creation records yet</span>
              </p>
              <p className="text-white/30 text-sm mb-4">
                <span>All your AI creations are saved here</span>
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('create')}
                className="px-6 py-3 bg-gradient-to-r from-cyber-blue to-cyber-purple text-white rounded-xl font-bold"
              >
                ✨ <span>Start Creating</span>
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/50 text-sm">
                  <span>{myCreations.length} Works</span>
                </span>
                <button onClick={() => { localStorage.removeItem(CREATIONS_KEY); setMyCreations([]); }} className="text-red-400/60 text-xs hover:text-red-400 transition-colors">
                  <span>Clear</span>
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
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${creation.productGradient} flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden`}>
                    <img src={creation.imageUrl} alt="" className="w-full h-full object-cover" />
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
                      title="Download"
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
          <h3 className="text-white font-bold text-sm mb-2">
            <span>💡 Tips</span>
          </h3>
          <ul className="space-y-2 text-xs">
            <li className="flex items-start gap-2">
              <span className="text-base">📷</span>
              <div className="text-white/40">
                <span>Upload clear, well-lit pet photos for best results</span>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-base">🎬</span>
              <div className="text-white/40">
                <span>You can also upload pet videos; AI will capture the best frame</span>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-base">⭐</span>
              <div className="text-white/40">
                <span>Each template costs different points; failed generations are free</span>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-base">💾</span>
              <div className="text-white/40">
                <span>All creations are auto-saved and can be downloaded anytime</span>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-base">🔄</span>
              <div className="text-white/40">
                <span>Not satisfied? Reselect template or change materials to regenerate</span>
              </div>
            </li>
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
