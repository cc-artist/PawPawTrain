import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import api from '../services/api';

const FREE_GENERATION_COUNT = 3;
const GENERATION_HISTORY_KEY = 'paw_train_generation_history';
const GENERATION_COUNT_KEY = 'paw_train_generation_count';

const CreatePetPage = () => {
  const navigate = useNavigate();
  const { setPet, isLoggedIn, user } = useStore();
  const [generationCount, setGenerationCount] = useState(0);
  const [generationHistory, setGenerationHistory] = useState([]);

  const MAX_PHOTOS = 5;
  const MIN_PHOTOS = 1;

  const PET_ATTRIBUTES = [
    { key: 'intimacy', name: 'Intimacy\n亲密度', enName: 'Intimacy', emoji: '💖', color: 'from-pink-400 to-rose-500', bgColor: 'bg-pink-500' },
    { key: 'hunger', name: 'Hunger\n饱食度', enName: 'Hunger', emoji: '🍖', color: 'from-amber-400 to-orange-500', bgColor: 'bg-orange-500' },
    { key: 'energy', name: 'Energy\n活力', enName: 'Energy', emoji: '⚡', color: 'from-yellow-400 to-amber-500', bgColor: 'bg-yellow-500' },
    { key: 'joy', name: 'Joy\n快乐', enName: 'Joy', emoji: '😊', color: 'from-green-400 to-emerald-500', bgColor: 'bg-green-500' },
    { key: 'discipline', name: 'Discipline\n纪律', enName: 'Discipline', emoji: '📚', color: 'from-blue-400 to-indigo-500', bgColor: 'bg-blue-500' },
    { key: 'health', name: 'Health\n健康', enName: 'Health', emoji: '❤️', color: 'from-red-400 to-pink-500', bgColor: 'bg-red-500' },
    { key: 'exploration', name: 'Exploration\n探索度', enName: 'Exploration', emoji: '🗺️', color: 'from-purple-400 to-violet-500', bgColor: 'bg-purple-500' },
  ];

  const commonPetTypes = [
    { type: 'dog', name: '小狗狗', enName: 'Dog', emoji: '🐕',
      breeds: ['金毛 / Golden Retriever', '泰迪 / Teddy Poodle', '哈士奇 / Husky', '柯基 / Corgi', '柴犬 / Shiba Inu', '拉布拉多 / Labrador', '萨摩耶 / Samoyed', '比熊 / Bichon Frise', '博美 / Pomeranian', '边牧 / Border Collie', '德牧 / German Shepherd', '法斗 / French Bulldog', '巴哥 / Pug', '吉娃娃 / Chihuahua', '雪纳瑞 / Schnauzer', '秋田 / Akita', '阿拉斯加 / Malamute', '贵宾 / Poodle', '约克夏 / Yorkie', '蝴蝶犬 / Papillon', '杜宾 / Doberman', '松狮 / Chow Chow', '罗威纳 / Rottweiler', '马尔济斯 / Maltese', '大麦町 / Dalmatian', '喜乐蒂 / Sheltie', '伯恩山 / Bernese', '可卡犬 / Cocker Spaniel', '腊肠犬 / Dachshund', '京巴 / Pekingese'],
      colors: ['金色 / Golden', '棕色 / Brown', '黑色 / Black', '白色 / White', '花色 / Multi-Color', '黑白 / Black & White', '灰色 / Gray', '黄白 / Yellow White', '红棕 / Red Brown', '奶油 / Cream', '巧克力 / Chocolate', '银灰 / Silver Gray', '三色 / Tricolor', '陨石 / Merle', '虎斑 / Tabby', '纯黑 / Pure Black', '纯白 / Pure White', '虎纹 / Brindle'] },
    { type: 'cat', name: '小猫咪', enName: 'Cat', emoji: '🐱',
      breeds: ['英短 / British Shorthair', '布偶 / Ragdoll', '橘猫 / Orange Tabby', '暹罗 / Siamese', '加菲 / Exotic Shorthair', '美短 / American Shorthair', '波斯 / Persian', '缅因 / Maine Coon', '无毛 / Sphynx', '折耳 / Scottish Fold', '德文 / Devon Rex', '阿比西尼亚 / Abyssinian', '孟加拉豹猫 / Bengal', '异短 / Exotic', '挪威森林 / Norwegian Forest', '俄罗斯蓝猫 / Russian Blue', '东方短毛 / Oriental', '苏格兰折耳 / Scottish Fold', '曼基康 / Munchkin', '褴褛猫 / Ragamuffin', '索马里 / Somali', '雪鞋猫 / Snowshoe', '土耳其梵 / Turkish Van', '新加坡猫 / Singapura', '柯尼斯卷毛 / Cornish Rex'],
      colors: ['白色 / White', '黑色 / Black', '橘色 / Orange', '灰色 / Gray', '花色 / Multi-Color', '三花 / Calico', '虎斑 / Tabby', '蓝灰 / Blue Gray', '玳瑁 / Tortoiseshell', '奶牛 / Cow Pattern', '纯黑 / Pure Black', '纯白 / Pure White', '银色 / Silver', '金色 / Golden', '乳白 / Cream', '巧克力 / Chocolate', '丁香 / Lilac', '红虎斑 / Red Tabby', '银虎斑 / Silver Tabby', '重点色 / Colorpoint'] },
    { type: 'rabbit', name: '小兔兔', enName: 'Rabbit', emoji: '🐰',
      breeds: ['垂耳兔 / Lop Eared', '侏儒兔 / Dwarf Rabbit', '狮子兔 / Lionhead', '安哥拉兔 / Angora', '海棠兔 / Hotot', '荷兰兔 / Dutch Rabbit', '雷克斯兔 / Rex', '喜马拉雅兔 / Himalayan', '巨型花明兔 / Giant Chinchilla', '波兰兔 / Polish Rabbit', '泽西长毛兔 / Jersey Wooly', '迷你垂耳兔 / Mini Lop', '道奇兔 / Dutch', '佛兰德巨兔 / Flemish Giant'],
      colors: ['白色 / White', '灰色 / Gray', '黑色 / Black', '花色 / Multi-Color', '棕色 / Brown', '米色 / Beige', '金色 / Golden', '黑白 / Black & White', '斑点 / Spotted', '银灰 / Silver Gray', '奶油 / Cream', '蓝灰 / Blue Gray', '巧克力 / Chocolate', '虎斑 / Tabby'] },
    { type: 'hamster', name: '仓鼠', enName: 'Hamster', emoji: '🐹',
      breeds: ['金丝熊 / Golden Bear', '银狐 / Silver Fox', '布丁 / Pudding', '三线 / Campbell', '公婆鼠 / Roborovski', '一线鼠 / Winter White', '奶茶 / Milk Tea', '紫仓 / Sapphire', '白熊 / White Bear', '黑熊 / Black Bear', '老公公 / Old Man', '老婆婆 / Old Woman'],
      colors: ['金色 / Golden', '白色 / White', '灰色 / Gray', '棕色 / Brown', '花色 / Multi-Color', '黑色 / Black', '奶油 / Cream', '银白 / Silver White', '紫灰 / Purple Gray', '黄白 / Yellow White'] },
    { type: 'bird', name: '小鸟', enName: 'Bird', emoji: '🐦',
      breeds: ['鹦鹉 / Parrot', '文鸟 / Java Sparrow', '珍珠鸟 / Zebra Finch', '金丝雀 / Canary', '百灵 / Lark', '画眉 / Thrush', '八哥 / Myna', '黄鹂 / Oriole', '绣眼 / White-Eye', '蜡嘴 / Waxbill', '蓝鹊 / Blue Magpie', '夜莺 / Nightingale'],
      colors: ['绿色 / Green', '黄色 / Yellow', '蓝色 / Blue', '彩色 / Rainbow', '红色 / Red', '白色 / White', '橙色 / Orange', '紫色 / Purple', '灰白 / Gray White', '黑白 / Black & White'] },
    { type: 'fish', name: '小鱼', enName: 'Fish', emoji: '🐟',
      breeds: ['金鱼 / Goldfish', '热带鱼 / Tropical Fish', '锦鲤 / Koi', '孔雀鱼 / Guppy', '斗鱼 / Betta', '神仙鱼 / Angelfish', '龙鱼 / Arowana', '罗汉鱼 / Flowerhorn', '蝶鱼 / Butterflyfish', '小丑鱼 / Clownfish', '天使鱼 / Angelfish', '虎皮鱼 / Tiger Barb', '剑尾鱼 / Swordtail', '斑马鱼 / Zebra Danio'],
      colors: ['红色 / Red', '金色 / Golden', '彩色 / Rainbow', '黑色 / Black', '蓝色 / Blue', '银色 / Silver', '橙色 / Orange', '白色 / White', '黄红 / Yellow Red', '蓝绿 / Blue Green'] },
  ];

  const uncommonPetTypes = [
    { type: 'turtle', name: '乌龟', enName: 'Turtle', emoji: '🐢',
      breeds: ['巴西龟 / Red-Eared Slider', '草龟 / Chinese Pond Turtle', '陆龟 / Tortoise', '金钱龟 / Golden Coin Turtle', '鳄龟 / Snapping Turtle', '麝香龟 / Musk Turtle', '地图龟 / Map Turtle', '猪鼻龟 / Pig-Nosed Turtle', '黄缘龟 / Yellow-Margined Box', '苏卡达陆龟 / Sulcata Tortoise', '红耳龟 / Red-Eared Slider', '锦龟 / Painted Turtle'],
      colors: ['绿色 / Green', '棕色 / Brown', '黑色 / Black', '黄色 / Yellow', '深绿 / Dark Green', '浅棕 / Light Brown'] },
    { type: 'snake', name: '蛇', enName: 'Snake', emoji: '🐍',
      breeds: ['玉米蛇 / Corn Snake', '球蟒 / Ball Python', '王蛇 / King Snake', '奶蛇 / Milk Snake', '绿森蚺 / Green Anaconda', '眼镜蛇 / Cobra', '红尾蚺 / Red-Tailed Boa', '猪鼻蛇 / Hognose Snake', '翠青蛇 / Green Vine Snake', '黑王蛇 / Black King Snake'],
      colors: ['绿色 / Green', '黄色 / Yellow', '黑色 / Black', '花色 / Multi-Color', '白色 / White', '红色 / Red', '橙色 / Orange', '灰色 / Gray'] },
    { type: 'lizard', name: '蜥蜴', enName: 'Lizard', emoji: '🦎',
      breeds: ['鬃狮蜥 / Bearded Dragon', '绿鬣蜥 / Green Iguana', '豹纹守宫 / Leopard Gecko', '睫角守宫 / Crested Gecko', '日行守宫 / Day Gecko', '蓝舌石龙子 / Blue-Tongued Skink', '犀牛鬣蜥 / Rhino Iguana', '变色龙 / Chameleon'],
      colors: ['绿色 / Green', '棕色 / Brown', '黄色 / Yellow', '橙色 / Orange', '红色 / Red', '蓝色 / Blue'] },
    { type: 'frog', name: '青蛙', enName: 'Frog', emoji: '🐸',
      breeds: ['角蛙 / Pacman Frog', '树蛙 / Tree Frog', '牛蛙 / Bullfrog', '箭毒蛙 / Poison Dart Frog', '雨蛙 / Tree Frog', '钟角蛙 / Horned Frog', '老爷树蛙 / Whites Tree Frog', '红眼树蛙 / Red-Eyed Tree Frog'],
      colors: ['绿色 / Green', '棕色 / Brown', '黄色 / Yellow', '红色 / Red', '蓝色 / Blue', '花色 / Multi-Color'] },
    { type: 'hedgehog', name: '刺猬', enName: 'Hedgehog', emoji: '🦔',
      breeds: ['非洲迷你刺猬 / African Pygmy Hedgehog', '欧洲刺猬 / European Hedgehog', '四趾刺猬 / Four-Toed Hedgehog', '长耳刺猬 / Long-Eared Hedgehog'],
      colors: ['棕色 / Brown', '白色 / White', '花色 / Multi-Color', '灰色 / Gray', '巧克力色 / Chocolate'] },
    { type: 'guinea_pig', name: '豚鼠', enName: 'Guinea Pig', emoji: '🐹',
      breeds: ['短顺 / American Shorthair', '长逆 / Abyssinian', '无毛 / Skinny Pig', '泰迪 / Teddy', '荷兰猪 / Dutch', '冠毛 / Crested', '喜马拉雅 / Himalayan', '阿比西尼亚 / Abyssinian'],
      colors: ['白色 / White', '黑色 / Black', '棕色 / Brown', '花色 / Multi-Color', '黄色 / Yellow', '三色 / Tricolor'] },
    { type: 'chinchilla', name: '龙猫', enName: 'Chinchilla', emoji: '🐭',
      breeds: ['标准灰 / Standard Gray', '米色 / Beige', '银斑 / Silver Mosaic', '紫灰 / Violet', '纯黑 / Ebony', '纯白 / White', '金粉 / Pink White', '丝绒黑 / Black Velvet', '咖色 / Brown'],
      colors: ['灰色 / Gray', '白色 / White', '米色 / Beige', '黑色 / Black', '紫色 / Violet', '金色 / Golden', '咖啡 / Brown'] },
    { type: 'ferret', name: '雪貂', enName: 'Ferret', emoji: '🦨',
      breeds: ['安格鲁 / Angora Ferret', '玛雪儿 / Marshall Ferret', '香槟貂 / Champagne Ferret', '黑眼白貂 / Black-Eyed White'],
      colors: ['白色 / White', '棕色 / Brown', '黑色 / Black', '花色 / Multi-Color', '香槟 / Champagne', '银色 / Silver'] },
    { type: 'parrot', name: '鹦鹉', enName: 'Parrot', emoji: '🦜',
      breeds: ['玄凤 / Cockatiel', '虎皮 / Budgerigar', '牡丹 / Lovebird', '金刚鹦鹉 / Macaw', '葵花鹦鹉 / Cockatoo', '灰鹦鹉 / African Grey', '小太阳 / Sun Conure', '吸蜜鹦鹉 / Lorikeet', '凯克鹦鹉 / Caique', '亚马逊鹦鹉 / Amazon Parrot'],
      colors: ['绿色 / Green', '黄色 / Yellow', '蓝色 / Blue', '彩色 / Rainbow', '红色 / Red', '白色 / White', '橙色 / Orange'] },
    { type: 'tropical_fish', name: '热带鱼', enName: 'Tropical Fish', emoji: '🐠',
      breeds: ['孔雀鱼 / Guppy', '神仙鱼 / Angelfish', '斗鱼 / Betta', '小丑鱼 / Clownfish', '蓝魔 / Blue Damsel', '蝶鱼 / Butterflyfish', '刺尾鱼 / Tang', '火焰虾虎 / Fire Goby', '雷达鱼 / Firefish', '海马 / Seahorse'],
      colors: ['红色 / Red', '蓝色 / Blue', '彩色 / Rainbow', '黄色 / Yellow', '橙色 / Orange', '紫色 / Purple'] },
  ];

  const ART_STYLES = [
    { id: '3d_cartoon', name: '3D卡通动画', enName: '3D Cartoon', icon: '🎬', description: '画面立体精致，角色动作流畅自然' },
    { id: 'anime_cel', name: '日系赛璐璐', enName: 'Anime Cel', icon: '🎨', description: '经典日式动画风格，色彩鲜明' },
    { id: 'makoto_shinkai', name: '新海诚风格', enName: 'Makoto Shinkai', icon: '✨', description: '唯美写实，光影细腻动人' },
    { id: 'flat_design', name: '扁平设计', enName: 'Flat Design', icon: '📐', description: '简约现代，色彩明快简洁' },
    { id: 'cyberpunk', name: '赛博朋克', enName: 'Cyberpunk', icon: '🌃', description: '未来科技感，霓虹灯光效果' },
    { id: 'healing', name: '治愈系', enName: 'Healing', icon: '🌸', description: '温馨柔和，让人心情放松' },
    { id: 'ghibli', name: '吉卜力风格', enName: 'Studio Ghibli', icon: '🏡', description: '手绘质感，充满童话气息' },
    { id: 'american', name: '美式动画', enName: 'American Cartoon', icon: '🎭', description: '夸张幽默，富有表现力' },
    { id: 'chinese', name: '国风动画', enName: 'Chinese Style', icon: '🏮', description: '水墨丹青，古典雅致' },
    { id: 'dark_fantasy', name: '暗黑奇幻', enName: 'Dark Fantasy', icon: '🦇', description: '神秘魔幻，独特视觉冲击' },
  ];

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPetType, setSelectedPetType] = useState(null);
  const [selectedBreed, setSelectedBreed] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [attributeValues, setAttributeValues] = useState({
    intimacy: 50,
    hunger: 70,
    energy: 50,
    joy: 50,
    discipline: 50,
    health: 100,
    exploration: 0,
  });
  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedArtStyle, setSelectedArtStyle] = useState('3d_cartoon');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCustomPetForm, setShowCustomPetForm] = useState(false);
  const [customPetName, setCustomPetName] = useState('');
  const [customPetEmoji, setCustomPetEmoji] = useState('🐾');
  const [showCustomBreedInput, setShowCustomBreedInput] = useState(false);
  const [showCustomColorInput, setShowCustomColorInput] = useState(false);
  const [customBreedValue, setCustomBreedValue] = useState('');
  const [customColorValue, setCustomColorValue] = useState('');
  const [customBreeds, setCustomBreeds] = useState([]);
  const [customColors, setCustomColors] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [lastGeneratedResult, setLastGeneratedResult] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(null);
  const [imageLoadedState, setImageLoadedState] = useState({ loading: false, error: false });

  const steps = useMemo(() => [
    { number: 1, title: 'Select Pet Type\n选择宠物类型', enTitle: 'Select Pet Type' },
    { number: 2, title: 'Set Attributes\n设定性格属性', enTitle: 'Set Attributes' },
    { number: 3, title: 'Upload Photos\n上传宠物照片', enTitle: 'Upload Photos' },
    { number: 4, title: 'Select Art Style\n选择艺术风格', enTitle: 'Select Art Style' },
    { number: 5, title: 'Confirm\n确认生成', enTitle: 'Confirm' },
  ], []);

  useEffect(() => {
    const count = localStorage.getItem(GENERATION_COUNT_KEY);
    const history = localStorage.getItem(GENERATION_HISTORY_KEY);
    
    setGenerationCount(count ? parseInt(count) : 0);
    setGenerationHistory(history ? JSON.parse(history) : []);
  }, []);

  const handleCommonPetSelect = useCallback((pet) => {
    setSelectedPetType(pet);
    setSelectedBreed(pet.breeds[0]);
    setSelectedColor(pet.colors[0]);
  }, []);

  const handleUncommonPetSelect = useCallback((pet) => {
    setSelectedPetType(pet);
    setSelectedBreed(pet.breeds[0]);
    setSelectedColor(pet.colors[0]);
  }, []);

  const handleCustomPetCreate = useCallback(() => {
    if (!customPetName.trim()) {
      alert('请输入自定义宠物名称');
      return;
    }

    const customType = {
      type: customPetName.toLowerCase().replace(/\s+/g, '_'),
      name: customPetName.trim(),
      enName: customPetName.trim(),
      emoji: customPetEmoji,
      breeds: [customPetName.trim()],
      colors: ['默认 / Default', '白色 / White', '黑色 / Black', '棕色 / Brown', '花色 / Multi-Color'],
      isCustom: true
    };

    setSelectedPetType(customType);
    setSelectedBreed(customPetName.trim());
    setSelectedColor('默认 / Default');
    setShowCustomPetForm(false);
    setCustomPetName('');
    setCustomPetEmoji('🐾');
  }, [customPetName, customPetEmoji]);

  const handleAddCustomBreed = useCallback(() => {
    const breed = customBreedValue.trim();
    if (!breed) {
      alert('请输入品种名称');
      return;
    }
    if (customBreeds.includes(breed) || selectedPetType?.breeds.includes(breed)) {
      alert('该品种已存在');
      return;
    }
    setCustomBreeds(prev => [...prev, breed]);
    setSelectedBreed(breed);
    setCustomBreedValue('');
    setShowCustomBreedInput(false);
  }, [customBreedValue, customBreeds, selectedPetType]);

  const handleAddCustomColor = useCallback(() => {
    const color = customColorValue.trim();
    if (!color) {
      alert('请输入毛色名称');
      return;
    }
    if (customColors.includes(color) || selectedPetType?.colors.includes(color)) {
      alert('该毛色已存在');
      return;
    }
    setCustomColors(prev => [...prev, color]);
    setSelectedColor(color);
    setCustomColorValue('');
    setShowCustomColorInput(false);
  }, [customColorValue, customColors, selectedPetType]);

  // 切换宠物类型时清空自定义品种和毛色
  useEffect(() => {
    setCustomBreeds([]);
    setCustomColors([]);
    setShowCustomBreedInput(false);
    setShowCustomColorInput(false);
    setCustomBreedValue('');
    setCustomColorValue('');
  }, [selectedPetType?.type]);

  const handleImageUpload = useCallback((e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_PHOTOS - uploadedImages.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImages(prev => [...prev, {
          id: Date.now() + Math.random(),
          url: reader.result,
          file
        }]);
      };
      reader.readAsDataURL(file);
    });
  }, [uploadedImages.length]);

  const removeImage = useCallback((index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleAttributeChange = useCallback((key, value) => {
    setAttributeValues(prev => ({
      ...prev,
      [key]: parseInt(value),
    }));
  }, []);

  const isStepComplete = useCallback((step) => {
    switch (step) {
      case 1:
        return selectedPetType && selectedBreed && selectedColor;
      case 2:
        return true;
      case 3:
        return uploadedImages.length >= MIN_PHOTOS;
      case 4:
        return selectedArtStyle;
      case 5:
        return true;
      default:
        return false;
    }
  }, [selectedPetType, selectedBreed, selectedColor, uploadedImages.length, selectedArtStyle]);

  const handleNextStep = useCallback(() => {
    if (currentStep < steps.length && isStepComplete(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, isStepComplete]);

  const handlePrevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    const remainingFreeGenerations = FREE_GENERATION_COUNT - generationCount;
    
    if (remainingFreeGenerations <= 0) {
      const userPoints = user?.points || 0;
      const costPerGeneration = 100;
      
      if (userPoints < costPerGeneration) {
        alert(`免费生成次数已用完！需要${costPerGeneration}积分才能继续生成，您当前有${userPoints}积分。`);
        navigate('/recharge');
        return;
      }
      
      const confirmUsePoints = confirm(`免费生成次数已用完，是否消耗${costPerGeneration}积分继续生成？`);
      if (!confirmUsePoints) {
        return;
      }
    }

    setIsSubmitting(true);
    setImageLoadedState({ loading: true, error: false });
    try {
      const petEmoji = selectedPetType?.emoji || '🐾';
      const petTypeName = selectedBreed || '宠物';

      const petData = {
        type: selectedPetType?.type || 'cat',
        name: petTypeName,
        emoji: petEmoji,
        artStyle: selectedArtStyle,
        color: selectedColor,
        intimacy: attributeValues.intimacy,
        hunger: attributeValues.hunger,
        energy: attributeValues.energy,
        joy: attributeValues.joy,
        discipline: attributeValues.discipline,
        health: attributeValues.health,
        exploration: attributeValues.exploration,
        level: 1,
        exp: 0,
        expToNext: 100,
        points: 0,
      };

      const response = await api.post('/pet/adopt', petData);
      
      if (response.data && response.data.pet) {
        const newCount = generationCount + 1;
        setGenerationCount(newCount);
        localStorage.setItem(GENERATION_COUNT_KEY, newCount.toString());
        
        const generatedImageUrl = response.data.pet?.imageUrl || '';
        const generationId = response.data.pet?.generationId || '';
        
        const newHistoryItem = {
          id: Date.now(),
          petName: petTypeName,
          petType: selectedPetType?.type,
          artStyle: selectedArtStyle,
          imageUrl: generatedImageUrl,
          generationId: generationId,
          color: selectedColor,
          emoji: petEmoji,
          createdAt: new Date().toLocaleString('zh-CN'),
          petData: { ...response.data.pet },
        };
        
        const updatedHistory = [newHistoryItem, ...generationHistory];
        setGenerationHistory(updatedHistory);
        localStorage.setItem(GENERATION_HISTORY_KEY, JSON.stringify(updatedHistory));
        
        setPet(response.data.pet);
        setLastGeneratedResult({ ...response.data.pet, imageUrl: generatedImageUrl });
        setShowPreview(true);
        
        if (remainingFreeGenerations <= 1) {
          // 如果用完免费次数，提示下一次需要积分
        }
      } else {
        throw new Error('创建宠物失败');
      }
    } catch (error) {
      console.error('创建宠物失败:', error);
      alert(error.response?.data?.error || error.message || '创建宠物失败');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedPetType, selectedBreed, selectedColor, selectedArtStyle, attributeValues, setPet, navigate, generationCount, generationHistory, user]);

  // 确认使用当前生成的图片并返回首页
  const handleConfirmImage = useCallback(() => {
    if (lastGeneratedResult) {
      setPet(lastGeneratedResult);
    }
    setShowPreview(false);
    setShowSuccess(true);
    setTimeout(() => {
      navigate('/');
    }, 1500);
  }, [lastGeneratedResult, setPet, navigate]);

  // 重新生成（使用相同参数重新调用API）
  const handleRegenerate = useCallback(() => {
    setShowPreview(false);
    setIsRegenerating(true);
    // 延迟调用确保状态更新
    setTimeout(() => {
      handleSubmit();
    }, 100);
  }, [handleSubmit]);

  // 从历史记录中选择一张图片作为当前宠物形象
  const handleSelectHistoryImage = useCallback((historyItem) => {
    if (!pet || !pet.type) {
      // 如果还没有宠物，直接用历史记录中的宠物数据
      if (historyItem.petData) {
        setPet(historyItem.petData);
      }
    } else {
      // 更新现有宠物的图片URL
      const updatedPet = { ...pet, imageUrl: historyItem.imageUrl, generationId: historyItem.generationId };
      setPet(updatedPet);
    }
    setShowHistoryPanel(false);
    // 显示简短的成功提示
    alert('Virtual pet image updated! / 虚拟宠物形象已更新！');
  }, [pet, setPet]);

  // 移除历史记录中的某一条
  const handleRemoveHistoryItem = useCallback((historyId) => {
    const updated = generationHistory.filter(item => item.id !== historyId);
    setGenerationHistory(updated);
    localStorage.setItem(GENERATION_HISTORY_KEY, JSON.stringify(updated));
  }, [generationHistory]);

  const StepIndicator = useCallback(() => (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <button
              type="button"
              onClick={() => {
                if (step.number < currentStep || isStepComplete(step.number - 1)) {
                  setCurrentStep(step.number);
                }
              }}
              className={`flex flex-col items-center cursor-pointer transition-all ${
                currentStep === step.number ? 'scale-110' : ''
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  currentStep === step.number
                    ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : currentStep > step.number
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {currentStep > step.number ? '✓' : step.number}
              </div>
              <span className={`text-xs mt-2 transition-colors whitespace-pre-line leading-tight text-center ${
                currentStep === step.number ? 'text-white font-medium' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
            </button>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-2 rounded-full transition-colors ${
                currentStep > step.number ? 'bg-gradient-to-r from-green-500 to-green-500' : 'bg-gray-700'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  ), [steps, currentStep, isStepComplete]);

  const Step1Content = useCallback(() => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">🐾 Select Your Pet Type / 选择您的宠物类型</h3>
        <p className="text-gray-400 text-sm">Please select or create your desired pet type / 请选择或创建您想要的宠物类型</p>
      </div>

      <div>
        <div className="text-gray-400 text-xs mb-3">Common Pets / 常见宠物</div>
        <div className="grid grid-cols-3 gap-3">
          {commonPetTypes.map((pet) => (
            <motion.button
              key={pet.type}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCommonPetSelect(pet)}
              className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                selectedPetType?.type === pet.type
                  ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span className="text-3xl">{pet.emoji}</span>
              <span className="text-sm font-medium">{pet.name}</span>
              <span className="text-xs opacity-70">{pet.enName}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-gray-400 text-xs mb-3">Other Pet Types / 其他宠物类型</div>
        <select
          onChange={(e) => {
            const selectedValue = e.target.value;
            if (selectedValue) {
              const petType = uncommonPetTypes.find(p => p.type === selectedValue);
              if (petType) {
                handleUncommonPetSelect(petType);
              }
            }
          }}
          value={selectedPetType?.type && uncommonPetTypes.find(p => p.type === selectedPetType.type) ? selectedPetType.type : ''}
          className="w-full px-4 py-3 bg-gray-700/50 text-white rounded-xl border border-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 outline-none appearance-none cursor-pointer"
        >
          <option value="">Select other pet type... / 选择其他宠物类型...</option>
          {uncommonPetTypes.map((pet) => (
            <option key={pet.type} value={pet.type}>
              {pet.emoji} {pet.name} ({pet.enName})
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="text-gray-400 text-xs mb-3">Custom Pet Type / 自定义宠物类型</div>
        {!showCustomPetForm ? (
          <button
            type="button"
            onClick={() => setShowCustomPetForm(true)}
            className="w-full py-4 bg-gray-700/50 text-gray-300 rounded-xl border-2 border-dashed border-gray-600 hover:border-orange-500 hover:text-white transition-all"
          >
            + Add Custom Pet Type / 添加自定义宠物类型
          </button>
        ) : (
          <div className="p-4 bg-gray-700/50 rounded-xl space-y-4">
            <div>
              <label className="text-gray-400 text-xs mb-2 block">Pet Name / 宠物名称</label>
              <input
                type="text"
                value={customPetName}
                onChange={(e) => setCustomPetName(e.target.value)}
                placeholder="Enter custom pet name / 输入自定义宠物名称"
                className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg outline-none focus:ring-2 focus:ring-orange-500/30"
                maxLength={20}
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-2 block">Select Icon / 选择图标</label>
              <div className="flex flex-wrap gap-2">
                {['🐾', '🦄', '🐲', '👽', '🎭', '🌟', '💎', '🎨', '🎵', '🌈'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setCustomPetEmoji(emoji)}
                    className={`text-3xl p-2 rounded-lg transition-all ${
                      customPetEmoji === emoji
                        ? 'bg-orange-500 text-white scale-110'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCustomPetForm(false);
                  setCustomPetName('');
                  setCustomPetEmoji('🐾');
                }}
                className="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel / 取消
              </button>
              <button
                type="button"
                onClick={handleCustomPetCreate}
                className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-400 transition-colors"
              >
                Create / 创建
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedPetType && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gray-700/50 rounded-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{selectedPetType.emoji}</span>
            <div>
              <div className="text-white font-bold text-lg">{selectedPetType.name}</div>
              <div className="text-gray-400 text-sm">{selectedPetType.enName}</div>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-gray-400 text-sm mb-2 block">Breed / 品种：</label>
            <div className="flex flex-wrap gap-2">
              {selectedPetType.breeds.map((breed) => (
                <button
                  key={breed}
                  type="button"
                  onClick={() => setSelectedBreed(breed)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    selectedBreed === breed
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  {breed}
                </button>
              ))}
              {customBreeds.map((breed) => (
                <button
                  key={'custom-' + breed}
                  type="button"
                  onClick={() => setSelectedBreed(breed)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all border border-dashed border-green-500/50 ${
                    selectedBreed === breed
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-600 text-green-400 hover:bg-gray-500'
                  }`}
                >
                  ✨ {breed}
                </button>
              ))}
              {!showCustomBreedInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomBreedInput(true)}
                  className="px-4 py-2 rounded-lg text-sm bg-gray-600/50 text-orange-400 border border-dashed border-orange-500/40 hover:bg-gray-500 hover:border-orange-500 transition-all"
                >
                  + Custom Breed / 自定义品种
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={customBreedValue}
                    onChange={(e) => setCustomBreedValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomBreed(); }}
                    placeholder="Enter breed name / 输入品种名"
                    className="w-28 px-3 py-2 bg-gray-600 text-white rounded-lg text-sm outline-none border border-orange-500/50 focus:border-orange-500"
                    maxLength={12}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomBreed}
                    className="px-2 py-2 bg-green-500 text-white rounded-lg text-xs hover:bg-green-400 transition-colors"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCustomBreedInput(false); setCustomBreedValue(''); }}
                    className="px-2 py-2 bg-gray-500 text-white rounded-lg text-xs hover:bg-gray-400 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Color / 毛色：</label>
            <div className="flex flex-wrap gap-2">
              {selectedPetType.colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    selectedColor === color
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  {color}
                </button>
              ))}
              {customColors.map((color) => (
                <button
                  key={'custom-' + color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all border border-dashed border-blue-500/50 ${
                    selectedColor === color
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-600 text-blue-400 hover:bg-gray-500'
                  }`}
                >
                  ✨ {color}
                </button>
              ))}
              {!showCustomColorInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomColorInput(true)}
                  className="px-4 py-2 rounded-lg text-sm bg-gray-600/50 text-orange-400 border border-dashed border-orange-500/40 hover:bg-gray-500 hover:border-orange-500 transition-all"
                >
                  + Custom Color / 自定义毛色
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={customColorValue}
                    onChange={(e) => setCustomColorValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomColor(); }}
                    placeholder="Enter color name / 输入毛色名"
                    className="w-28 px-3 py-2 bg-gray-600 text-white rounded-lg text-sm outline-none border border-orange-500/50 focus:border-orange-500"
                    maxLength={12}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomColor}
                    className="px-2 py-2 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-400 transition-colors"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCustomColorInput(false); setCustomColorValue(''); }}
                    className="px-2 py-2 bg-gray-500 text-white rounded-lg text-xs hover:bg-gray-400 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  ), [selectedPetType, selectedBreed, selectedColor, handleCommonPetSelect, handleUncommonPetSelect, handleCustomPetCreate, showCustomPetForm, customPetName, customPetEmoji, showCustomBreedInput, showCustomColorInput, customBreedValue, customColorValue, customBreeds, customColors, handleAddCustomBreed, handleAddCustomColor]);

  const Step2Content = useCallback(() => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">📊 Set Pet Attributes / 设定宠物性格属性</h3>
        <p className="text-gray-400 text-sm">Adjust attribute values to set your pet's initial state / 调整各项属性值，设定您宠物的初始状态</p>
      </div>

      <div className="space-y-4">
        {PET_ATTRIBUTES.map((attr) => (
          <div key={attr.key} className="p-4 bg-gray-700/50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{attr.emoji}</span>
                <div>
                  <div className="text-white font-medium whitespace-pre-line leading-tight">{attr.name}</div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${attr.bgColor} text-white`}>
                {attributeValues[attr.key]}%
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={attributeValues[attr.key]}
              onChange={(e) => handleAttributeChange(attr.key, e.target.value)}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #f97316 0%, #f97316 ${attributeValues[attr.key]}%, #374151 ${attributeValues[attr.key]}%, #374151 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
        <div className="flex items-start gap-2">
          <span className="text-xl">💡</span>
          <div className="text-yellow-400 text-sm">
            <p className="font-medium mb-1">Attribute Description / 属性说明</p>
            <p>💖 Intimacy: Closeness with owner / 亲密度：与主人的亲密程度</p>
            <p>🍖 Hunger: Pet's hunger state / 饱食度：宠物的饥饿状态</p>
            <p>⚡ Energy: Pet's energy level / 活力：宠物的精力值</p>
            <p>😊 Joy: Pet's mood / 快乐：宠物的心情</p>
            <p>📚 Discipline: Pet's obedience / 纪律：宠物的听话程度</p>
            <p>❤️ Health: Pet's health status / 健康：宠物的健康状态</p>
            <p>🗺️ Exploration: Pet's exploration ability / 探索度：宠物的探索能力</p>
          </div>
        </div>
      </div>
    </div>
  ), [attributeValues, handleAttributeChange]);

  const Step3Content = useCallback(() => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">📷 Upload Pet Photos / 上传宠物照片</h3>
        <p className="text-gray-400 text-sm">Upload {MIN_PHOTOS}-{MAX_PHOTOS} pet photos from different angles / 上传{MIN_PHOTOS}-{MAX_PHOTOS}张不同角度的宠物照片</p>
        <p className="text-orange-400 text-xs mt-2">Uploaded / 已上传 {uploadedImages.length} / {MAX_PHOTOS}</p>
      </div>

      <div className="border-2 border-dashed border-gray-600 rounded-2xl p-6">
        {uploadedImages.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {uploadedImages.map((image, index) => (
                <div key={image.id} className="relative aspect-square">
                  <img
                    src={image.url}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-sm"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
              {uploadedImages.length < MAX_PHOTOS && (
                <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-500 rounded-xl h-full hover:border-orange-500 transition-colors">
                  <span className="text-3xl">+</span>
                  <span className="text-sm text-gray-400">Add / 添加</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div className="text-green-400 text-sm text-center">✓ Uploaded / 已上传 {uploadedImages.length} photos / 张照片</div>
          </div>
        ) : (
          <label className="cursor-pointer block text-center">
            <div className="text-6xl mb-4">📸</div>
            <div className="text-gray-300 mb-2">Click to upload pet photos / 点击上传宠物照片</div>
            <div className="text-gray-500 text-sm">Supports JPG, PNG formats. Recommend uploading photos from different angles / 支持 JPG、PNG 格式，建议上传不同角度的照片</div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              multiple
            />
          </label>
        )}
      </div>

      <div className="p-4 bg-blue-500/20 rounded-xl border border-blue-500/30">
        <div className="flex items-start gap-2">
          <span className="text-xl">💡</span>
          <div className="text-blue-400 text-sm">
            <p>Uploading photos from different angles helps AI better understand your pet's features and generate more accurate virtual images. / 上传不同角度的照片可以帮助AI更好地理解您宠物的特征，生成更精准的虚拟形象。</p>
          </div>
        </div>
      </div>
    </div>
  ), [uploadedImages, handleImageUpload, removeImage]);

  const Step4Content = useCallback(() => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">🎨 Select Art Style / 选择艺术风格</h3>
        <p className="text-gray-400 text-sm">Choose your favorite art style to generate virtual pet image / 选择您喜欢的艺术风格来生成虚拟宠物形象</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ART_STYLES.map((style) => (
          <motion.button
            key={style.id}
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelectedArtStyle(style.id)}
            className={`p-4 rounded-xl text-left transition-all ${
              selectedArtStyle === style.id
                ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{style.icon}</span>
              <div>
                <div className="font-medium text-sm whitespace-pre-line leading-tight">{style.enName + '\n' + style.name}</div>
              </div>
            </div>
            <div className="text-xs opacity-70">{style.description}</div>
          </motion.button>
        ))}
      </div>

      <div className="p-4 bg-purple-500/20 rounded-xl border border-purple-500/30">
        <div className="flex items-start gap-2">
          <span className="text-xl">🎨</span>
          <div className="text-purple-400 text-sm">
            <p>Different art styles bring completely different visual effects to your virtual pet. Choose the one that best suits your pet! / 不同的艺术风格会给您的虚拟宠物带来截然不同的视觉效果，选择一个最适合您宠物的风格吧！</p>
          </div>
        </div>
      </div>
    </div>
  ), [selectedArtStyle]);

  const Step5Content = useCallback(() => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">✅ Confirm & Generate / 确认生成</h3>
        <p className="text-gray-400 text-sm">Please confirm the following information before generating your virtual pet / 请确认以下信息后生成您的虚拟宠物</p>
      </div>

      <div className="p-4 bg-gray-700/50 rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-5xl">{selectedPetType?.emoji || '🐾'}</span>
          <div>
            <div className="text-white font-bold text-xl">{selectedBreed || 'Pet / 宠物'}</div>
            <div className="text-gray-400 text-sm">{selectedPetType?.enName}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-600/50 rounded-lg p-3">
            <div className="text-gray-400 text-xs">Color / 毛色</div>
            <div className="text-white font-medium">{selectedColor}</div>
          </div>
          <div className="bg-gray-600/50 rounded-lg p-3">
            <div className="text-gray-400 text-xs">Art Style / 艺术风格</div>
            <div className="text-white font-medium">{ART_STYLES.find(s => s.id === selectedArtStyle)?.name || selectedArtStyle}</div>
          </div>
        </div>

        <div className="border-t border-gray-600 pt-4">
          <div className="text-gray-400 text-sm mb-3">Initial Attributes / 初始属性值</div>
          <div className="grid grid-cols-4 gap-2">
            {PET_ATTRIBUTES.slice(0, 8).map((attr) => (
              <div key={attr.key} className="text-center">
                <div className="text-xl">{attr.emoji}</div>
                <div className="text-white font-bold text-sm">{attributeValues[attr.key]}%</div>
                <div className="text-gray-500 text-xs">{attr.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {uploadedImages.length > 0 && (
        <div className="p-4 bg-gray-700/50 rounded-xl">
          <div className="text-gray-400 text-sm mb-3">Uploaded Photos / 已上传照片 ({uploadedImages.length} photos / 张)</div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {uploadedImages.map((image, index) => (
              <img
                key={image.id}
                src={image.url}
                alt={`Photo ${index + 1}`}
                className="w-20 h-20 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}

      <div className="p-4 bg-orange-500/20 rounded-xl border border-orange-500/30">
        <div className="flex items-start gap-2">
          <span className="text-xl">🎁</span>
          <div className="text-orange-400 text-sm">
            <p className="font-medium">Generation Count / 生成次数</p>
            <p>You can still generate <strong>{Math.max(0, FREE_GENERATION_COUNT - generationCount)}</strong> virtual pets for free / 您还可以免费生成 <strong>{Math.max(0, FREE_GENERATION_COUNT - generationCount)}</strong> 次虚拟宠物</p>
            {generationCount >= FREE_GENERATION_COUNT && (
              <p className="mt-1">Subsequent generations will cost <strong>100 Points</strong> each / 后续生成每次将消耗 <strong>100积分</strong></p>
            )}
          </div>
        </div>
      </div>

      {/* 生成历史记录 */}
      {generationHistory.length > 0 && (
        <div className="p-4 bg-gray-700/50 rounded-xl">
          <button
            type="button"
            onClick={() => setShowHistoryPanel(!showHistoryPanel)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">📸</span>
              <span className="text-white font-medium">Generation History / 生成历史 ({generationHistory.length})</span>
            </div>
            <span className={`text-gray-400 transition-transform ${showHistoryPanel ? 'rotate-180' : ''}`}>▼</span>
          </button>
          
          {showHistoryPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-3"
            >
              {generationHistory.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-600/30 rounded-xl hover:bg-gray-600/50 transition-colors">
                  <div 
                    className="w-16 h-16 rounded-xl flex-shrink-0 cursor-pointer border-2 border-transparent hover:border-orange-500 transition-all overflow-hidden bg-gray-500/50"
                    onClick={() => setPreviewImageIndex(previewImageIndex === idx ? null : idx)}
                  >
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.petName}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    <span 
                      className={`w-full h-full flex items-center justify-center text-2xl ${item.imageUrl ? 'hidden' : ''}`}
                    >
                      {item.emoji || '🐾'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{item.petName}</div>
                    <div className="text-gray-400 text-xs flex items-center gap-2">
                      <span>{ART_STYLES.find(s => s.id === item.artStyle)?.name || item.artStyle}</span>
                      <span>·</span>
                      <span>{item.createdAt}</span>
                    </div>
                    {previewImageIndex === idx && item.imageUrl && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2"
                      >
                        <img 
                          src={item.imageUrl} 
                          alt={item.petName}
                          className="w-full max-w-[200px] rounded-xl"
                        />
                      </motion.div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectHistoryImage(item)}
                    className="px-3 py-2 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-xs rounded-lg font-medium hover:opacity-90 transition-opacity flex-shrink-0"
                  >
                    Use / 使用
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemoveHistoryItem(item.id); }}
                    className="w-6 h-6 flex items-center justify-center rounded-full text-gray-500 hover:text-red-400 hover:bg-gray-600 transition-colors flex-shrink-0"
                    title="Delete / 删除"
                  >
                    ×
                  </button>
                </div>
              ))}
              <p className="text-gray-500 text-xs text-center">Click "Use" to set a past image as your pet's current look / 点击"使用"将历史图片设为宠物当前形象</p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  ), [selectedPetType, selectedBreed, selectedColor, selectedArtStyle, attributeValues, uploadedImages, generationCount, generationHistory, showHistoryPanel, previewImageIndex, handleSelectHistoryImage, handleRemoveHistoryItem]);

  const getStepContent = useCallback(() => {
    switch (currentStep) {
      case 1:
        return Step1Content();
      case 2:
        return Step2Content();
      case 3:
        return Step3Content();
      case 4:
        return Step4Content();
      case 5:
        return Step5Content();
      default:
        return null;
    }
  }, [currentStep, Step1Content, Step2Content, Step3Content, Step4Content, Step5Content]);

  // 安全兜底：如果 ProtectedRoute 未能拦截未登录用户，用 useEffect 跳转
  // 避免在 render 期间调用 navigate（React 反模式，可能导致白屏/黑屏）
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) {
    // 显示加载状态，等 navigate 生效
    return (
      <div className="min-h-full flex items-center justify-center gradient-bg">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="text-4xl"
        >
          🐾
        </motion.div>
      </div>
    );
  }

  // 预览模式：生成成功后展示图片供用户确认
  if (showPreview && lastGeneratedResult) {
    const artStyleName = ART_STYLES.find(s => s.id === selectedArtStyle)?.name || selectedArtStyle;
    const hasImage = lastGeneratedResult.imageUrl && lastGeneratedResult.imageUrl.length > 0;
    return (
      <div className="min-h-full gradient-bg flex flex-col items-center justify-center p-4 pb-28">
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }} className="w-full max-w-md">
          <div className="text-center mb-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="text-6xl mb-2">🎉</motion.div>
            <h2 className="text-2xl font-bold text-white mb-1">Virtual Pet Image Generated! / 虚拟宠物形象已生成！</h2>
            <p className="text-gray-400 text-sm">Preview and confirm your pet's look / 预览并确认宠物的外观</p>
          </div>
          
          {/* 图片预览 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative mb-6"
          >
            <div className="rounded-3xl overflow-hidden bg-gray-800/50 p-2 border-2 border-orange-500/30 shadow-2xl shadow-orange-500/20">
              {hasImage ? (
                <>
                  {/* 加载中指示器 */}
                  {imageLoadedState.loading && !imageLoadedState.error && (
                    <div className="w-full rounded-2xl flex flex-col items-center justify-center bg-gray-700/50" style={{ minHeight: '280px', maxHeight: '400px' }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="text-5xl mb-3">⏳</motion.div>
                      <p className="text-gray-400 text-sm">Loading image... / 图片加载中...</p>
                    </div>
                  )}
                  {/* 图片 */}
                  <img 
                    src={lastGeneratedResult.imageUrl} 
                    alt="Generated Pet"
                    className={`w-full rounded-2xl object-cover ${imageLoadedState.loading && !imageLoadedState.error ? 'hidden' : ''}`}
                    style={{ minHeight: '280px', maxHeight: '400px' }}
                    onLoad={() => setImageLoadedState({ loading: false, error: false })}
                    onError={(e) => { 
                      console.warn('⚠️ 图片加载失败，显示占位图');
                      setImageLoadedState({ loading: false, error: true });
                      e.target.style.display = 'none'; 
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; 
                    }}
                  />
                  {/* 图片加载失败的替换 */}
                  <div className={`w-full rounded-2xl items-center justify-center bg-gray-700/50 ${imageLoadedState.error ? 'flex' : 'hidden'}`} style={{ minHeight: '280px' }}>
                    <div className="text-center">
                      <span className="text-6xl block mb-2">{selectedPetType?.emoji || '🐾'}</span>
                      <p className="text-gray-400 text-sm">{lastGeneratedResult.name || 'Pet / 宠物'}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full rounded-2xl flex items-center justify-center bg-gray-700/50" style={{ minHeight: '280px' }}>
                  <span className="text-6xl">{selectedPetType?.emoji || '🐾'}</span>
                </div>
              )}
            </div>
            
            {/* 状态标签 */}
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="px-3 py-1 bg-cyan-600/30 text-cyan-300 rounded-full text-xs border border-cyan-500/30">
                {artStyleName}
              </span>
              {lastGeneratedResult.isPlaceholder && (
                <span className="px-3 py-1 bg-yellow-600/30 text-yellow-300 rounded-full text-xs border border-yellow-500/30">
                  Fallback / 降级图片
                </span>
              )}
            </div>
          </motion.div>

          {/* 操作按钮 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <button
              onClick={handleConfirmImage}
              className="w-full py-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-green-500/30 transition-all text-lg"
            >
              ✅ Use This Image & Go Home / 使用此形象返回首页
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleRegenerate}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-gray-600 text-white rounded-2xl font-medium hover:bg-gray-500 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⏳</motion.span>
                ) : (
                  <span>🔄 Regenerate / 重新生成</span>
                )}
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setImageLoadedState({ loading: false, error: false });
                  setCurrentStep(4);
                }}
                className="flex-1 py-3 bg-gray-700 text-gray-300 rounded-2xl font-medium hover:bg-gray-600 transition-all"
              >
                🎨 Change Style / 换风格
              </button>
            </div>
            <p className="text-gray-500 text-xs text-center mt-2">
              Remaining free generations: {Math.max(0, FREE_GENERATION_COUNT - generationCount)} / 剩余免费生成次数：{Math.max(0, FREE_GENERATION_COUNT - generationCount)}
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-full gradient-bg flex flex-col items-center justify-center p-4 pb-28">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="text-8xl mb-4">🎉</motion.div>
        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-white mb-2">Virtual Pet Created! / 虚拟宠物创建成功！</motion.h2>
        {lastGeneratedResult?.imageUrl && (
          <motion.img 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            src={lastGeneratedResult.imageUrl}
            alt="Pet"
            className="w-40 h-40 object-cover rounded-2xl mb-4 border-2 border-white/20 shadow-xl"
          />
        )}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-white/70">Redirecting to home... / 正在跳转到首页...</motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-full gradient-bg pb-28">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="sticky top-0 z-40 glass-effect border-b border-cyber-blue/30 px-4 py-3"
      >
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-white/80 hover:text-white transition-colors">
            <span className="text-xl">←</span>
          </button>
          <h1 className="text-xl font-bold text-white">✨ Create Virtual Pet / 创建虚拟宠物</h1>
        </div>
      </motion.div>

      <div className="p-4">
        <StepIndicator />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {getStepContent()}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 mt-6">
          {currentStep > 1 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePrevStep}
              className="flex-1 py-4 bg-gray-600 text-white rounded-2xl font-bold"
            >
              ← Prev / 上一步
            </motion.button>
          )}
          {currentStep < steps.length ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNextStep}
              disabled={!isStepComplete(currentStep)}
              className={`flex-1 py-4 rounded-2xl font-bold transition-all ${
                isStepComplete(currentStep)
                  ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next → / 下一步
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-4 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-2xl font-bold"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⏳</motion.div>
                  Generating... / 生成中...
                </span>
              ) : (
                '🚀 Generate Virtual Pet / 生成虚拟宠物'
              )}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePetPage;