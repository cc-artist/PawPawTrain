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
    { key: 'intimacy', name: '亲密度', enName: 'Intimacy', emoji: '💖', color: 'from-pink-400 to-rose-500', bgColor: 'bg-pink-500' },
    { key: 'hunger', name: '饱食度', enName: 'Hunger', emoji: '🍖', color: 'from-amber-400 to-orange-500', bgColor: 'bg-orange-500' },
    { key: 'energy', name: '活力', enName: 'Energy', emoji: '⚡', color: 'from-yellow-400 to-amber-500', bgColor: 'bg-yellow-500' },
    { key: 'joy', name: '快乐', enName: 'Joy', emoji: '😊', color: 'from-green-400 to-emerald-500', bgColor: 'bg-green-500' },
    { key: 'discipline', name: '纪律', enName: 'Discipline', emoji: '📚', color: 'from-blue-400 to-indigo-500', bgColor: 'bg-blue-500' },
    { key: 'health', name: '健康', enName: 'Health', emoji: '❤️', color: 'from-red-400 to-pink-500', bgColor: 'bg-red-500' },
    { key: 'exploration', name: '探索度', enName: 'Exploration', emoji: '🗺️', color: 'from-purple-400 to-violet-500', bgColor: 'bg-purple-500' },
  ];

  const commonPetTypes = [
    { type: 'dog', name: '小狗狗', enName: 'Dog', emoji: '🐕',
      breeds: ['金毛', '泰迪', '哈士奇', '柯基', '柴犬', '拉布拉多', '萨摩耶', '比熊', '博美', '边牧', '德牧', '法斗', '巴哥', '吉娃娃', '雪纳瑞', '秋田', '阿拉斯加', '贵宾', '约克夏', '蝴蝶犬', '杜宾', '松狮', '罗威纳', '马尔济斯', '大麦町', '喜乐蒂', '伯恩山', '可卡犬', '腊肠犬', '京巴'],
      colors: ['金色', '棕色', '黑色', '白色', '花色', '黑白', '灰色', '黄白', '红棕', '奶油', '巧克力', '银灰', '三色', '陨石', '虎斑', '纯黑', '纯白', '虎纹'] },
    { type: 'cat', name: '小猫咪', enName: 'Cat', emoji: '🐱',
      breeds: ['英短', '布偶', '橘猫', '暹罗', '加菲', '美短', '波斯', '缅因', '无毛', '折耳', '德文', '阿比西尼亚', '孟加拉豹猫', '异短', '挪威森林', '俄罗斯蓝猫', '东方短毛', '苏格兰折耳', '曼基康', '褴褛猫', '索马里', '雪鞋猫', '土耳其梵', '新加坡猫', '柯尼斯卷毛'],
      colors: ['白色', '黑色', '橘色', '灰色', '花色', '三花', '虎斑', '蓝灰', '玳瑁', '奶牛', '纯黑', '纯白', '银色', '金色', '乳白', '巧克力', '丁香', '红虎斑', '银虎斑', '重点色'] },
    { type: 'rabbit', name: '小兔兔', enName: 'Rabbit', emoji: '🐰',
      breeds: ['垂耳兔', '侏儒兔', '狮子兔', '安哥拉兔', '海棠兔', '荷兰兔', '雷克斯兔', '喜马拉雅兔', '巨型花明兔', '波兰兔', '泽西长毛兔', '迷你垂耳兔', '道奇兔', '佛兰德巨兔'],
      colors: ['白色', '灰色', '黑色', '花色', '棕色', '米色', '金色', '黑白', '斑点', '银灰', '奶油', '蓝灰', '巧克力', '虎斑'] },
    { type: 'hamster', name: '仓鼠', enName: 'Hamster', emoji: '🐹',
      breeds: ['金丝熊', '银狐', '布丁', '三线', '公婆鼠', '一线鼠', '奶茶', '紫仓', '白熊', '黑熊', '老公公', '老婆婆'],
      colors: ['金色', '白色', '灰色', '棕色', '花色', '黑色', '奶油', '银白', '紫灰', '黄白'] },
    { type: 'bird', name: '小鸟', enName: 'Bird', emoji: '🐦',
      breeds: ['鹦鹉', '文鸟', '珍珠鸟', '金丝雀', '百灵', '画眉', '八哥', '黄鹂', '绣眼', '蜡嘴', '蓝鹊', '夜莺'],
      colors: ['绿色', '黄色', '蓝色', '彩色', '红色', '白色', '橙色', '紫色', '灰白', '黑白'] },
    { type: 'fish', name: '小鱼', enName: 'Fish', emoji: '🐟',
      breeds: ['金鱼', '热带鱼', '锦鲤', '孔雀鱼', '斗鱼', '神仙鱼', '龙鱼', '罗汉鱼', '蝶鱼', '小丑鱼', '天使鱼', '虎皮鱼', '剑尾鱼', '斑马鱼'],
      colors: ['红色', '金色', '彩色', '黑色', '蓝色', '银色', '橙色', '白色', '黄红', '蓝绿'] },
  ];

  const uncommonPetTypes = [
    { type: 'turtle', name: '乌龟', enName: 'Turtle', emoji: '🐢',
      breeds: ['巴西龟', '草龟', '陆龟', '金钱龟', '鳄龟', '麝香龟', '地图龟', '猪鼻龟', '黄缘龟', '苏卡达陆龟', '红耳龟', '锦龟'],
      colors: ['绿色', '棕色', '黑色', '黄色', '深绿', '浅棕'] },
    { type: 'snake', name: '蛇', enName: 'Snake', emoji: '🐍',
      breeds: ['玉米蛇', '球蟒', '王蛇', '奶蛇', '绿森蚺', '眼镜蛇', '红尾蚺', '猪鼻蛇', '翠青蛇', '黑王蛇'],
      colors: ['绿色', '黄色', '黑色', '花色', '白色', '红色', '橙色', '灰色'] },
    { type: 'lizard', name: '蜥蜴', enName: 'Lizard', emoji: '🦎',
      breeds: ['鬃狮蜥', '绿鬣蜥', '豹纹守宫', '睫角守宫', '日行守宫', '蓝舌石龙子', '犀牛鬣蜥', '变色龙'],
      colors: ['绿色', '棕色', '黄色', '橙色', '红色', '蓝色'] },
    { type: 'frog', name: '青蛙', enName: 'Frog', emoji: '🐸',
      breeds: ['角蛙', '树蛙', '牛蛙', '箭毒蛙', '雨蛙', '钟角蛙', '老爷树蛙', '红眼树蛙'],
      colors: ['绿色', '棕色', '黄色', '红色', '蓝色', '花色'] },
    { type: 'hedgehog', name: '刺猬', enName: 'Hedgehog', emoji: '🦔',
      breeds: ['非洲迷你刺猬', '欧洲刺猬', '四趾刺猬', '长耳刺猬'],
      colors: ['棕色', '白色', '花色', '灰色', '巧克力色'] },
    { type: 'guinea_pig', name: '豚鼠', enName: 'Guinea Pig', emoji: '🐹',
      breeds: ['短顺', '长逆', '无毛', '泰迪', '荷兰猪', '冠毛', '喜马拉雅', '阿比西尼亚'],
      colors: ['白色', '黑色', '棕色', '花色', '黄色', '三色'] },
    { type: 'chinchilla', name: '龙猫', enName: 'Chinchilla', emoji: '🐭',
      breeds: ['标准灰', '米色', '银斑', '紫灰', '纯黑', '纯白', '金粉', '丝绒黑', '咖色'],
      colors: ['灰色', '白色', '米色', '黑色', '紫色', '金色', '咖啡'] },
    { type: 'ferret', name: '雪貂', enName: 'Ferret', emoji: '🦨',
      breeds: ['安格鲁', '玛雪儿', '香槟貂', '黑眼白貂'],
      colors: ['白色', '棕色', '黑色', '花色', '香槟', '银色'] },
    { type: 'parrot', name: '鹦鹉', enName: 'Parrot', emoji: '🦜',
      breeds: ['玄凤', '虎皮', '牡丹', '金刚鹦鹉', '葵花鹦鹉', '灰鹦鹉', '小太阳', '吸蜜鹦鹉', '凯克鹦鹉', '亚马逊鹦鹉'],
      colors: ['绿色', '黄色', '蓝色', '彩色', '红色', '白色', '橙色'] },
    { type: 'tropical_fish', name: '热带鱼', enName: 'Tropical Fish', emoji: '🐠',
      breeds: ['孔雀鱼', '神仙鱼', '斗鱼', '小丑鱼', '蓝魔', '蝶鱼', '刺尾鱼', '火焰虾虎', '雷达鱼', '海马'],
      colors: ['红色', '蓝色', '彩色', '黄色', '橙色', '紫色'] },
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

  const steps = useMemo(() => [
    { number: 1, title: '选择宠物类型', enTitle: 'Select Pet Type' },
    { number: 2, title: '设定性格属性', enTitle: 'Set Attributes' },
    { number: 3, title: '上传宠物照片', enTitle: 'Upload Photos' },
    { number: 4, title: '选择艺术风格', enTitle: 'Select Art Style' },
    { number: 5, title: '确认生成', enTitle: 'Confirm' },
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
      colors: ['默认', '白色', '黑色', '棕色', '花色'],
      isCustom: true
    };

    setSelectedPetType(customType);
    setSelectedBreed(customPetName.trim());
    setSelectedColor('默认');
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
        
        const newHistoryItem = {
          id: Date.now(),
          petName: petTypeName,
          petType: selectedPetType?.type,
          artStyle: selectedArtStyle,
          createdAt: new Date().toLocaleString('zh-CN'),
        };
        
        const updatedHistory = [newHistoryItem, ...generationHistory];
        setGenerationHistory(updatedHistory);
        localStorage.setItem(GENERATION_HISTORY_KEY, JSON.stringify(updatedHistory));
        
        setPet(response.data.pet);
        setShowSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 2000);
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
              <span className={`text-xs mt-2 transition-colors ${
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
        <h3 className="text-xl font-bold text-white mb-2">🐾 选择您的宠物类型</h3>
        <p className="text-gray-400 text-sm">请选择或创建您想要的宠物类型</p>
      </div>

      <div>
        <div className="text-gray-400 text-xs mb-3">常见宠物</div>
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
        <div className="text-gray-400 text-xs mb-3">其他宠物类型</div>
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
          <option value="">选择其他宠物类型...</option>
          {uncommonPetTypes.map((pet) => (
            <option key={pet.type} value={pet.type}>
              {pet.emoji} {pet.name} ({pet.enName})
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="text-gray-400 text-xs mb-3">自定义宠物类型</div>
        {!showCustomPetForm ? (
          <button
            type="button"
            onClick={() => setShowCustomPetForm(true)}
            className="w-full py-4 bg-gray-700/50 text-gray-300 rounded-xl border-2 border-dashed border-gray-600 hover:border-orange-500 hover:text-white transition-all"
          >
            + 添加自定义宠物类型
          </button>
        ) : (
          <div className="p-4 bg-gray-700/50 rounded-xl space-y-4">
            <div>
              <label className="text-gray-400 text-xs mb-2 block">宠物名称</label>
              <input
                type="text"
                value={customPetName}
                onChange={(e) => setCustomPetName(e.target.value)}
                placeholder="输入自定义宠物名称"
                className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg outline-none focus:ring-2 focus:ring-orange-500/30"
                maxLength={20}
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-2 block">选择图标</label>
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
                取消
              </button>
              <button
                type="button"
                onClick={handleCustomPetCreate}
                className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-400 transition-colors"
              >
                创建
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
            <label className="text-gray-400 text-sm mb-2 block">品种：</label>
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
                  + 自定义品种
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={customBreedValue}
                    onChange={(e) => setCustomBreedValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomBreed(); }}
                    placeholder="输入品种名"
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
            <label className="text-gray-400 text-sm mb-2 block">毛色：</label>
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
                  + 自定义毛色
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={customColorValue}
                    onChange={(e) => setCustomColorValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomColor(); }}
                    placeholder="输入毛色名"
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
        <h3 className="text-xl font-bold text-white mb-2">📊 设定宠物性格属性</h3>
        <p className="text-gray-400 text-sm">调整各项属性值，设定您宠物的初始状态</p>
      </div>

      <div className="space-y-4">
        {PET_ATTRIBUTES.map((attr) => (
          <div key={attr.key} className="p-4 bg-gray-700/50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{attr.emoji}</span>
                <div>
                  <div className="text-white font-medium">{attr.name}</div>
                  <div className="text-gray-500 text-xs">{attr.enName}</div>
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
            <p className="font-medium mb-1">属性说明</p>
            <p>💖 亲密度：与主人的亲密程度</p>
            <p>🍖 饱食度：宠物的饥饿状态</p>
            <p>⚡ 活力：宠物的精力值</p>
            <p>😊 快乐：宠物的心情</p>
            <p>📚 纪律：宠物的听话程度</p>
            <p>❤️ 健康：宠物的健康状态</p>
            <p>🗺️ 探索度：宠物的探索能力</p>
          </div>
        </div>
      </div>
    </div>
  ), [attributeValues, handleAttributeChange]);

  const Step3Content = useCallback(() => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">📷 上传宠物照片</h3>
        <p className="text-gray-400 text-sm">上传{MIN_PHOTOS}-{MAX_PHOTOS}张不同角度的宠物照片</p>
        <p className="text-orange-400 text-xs mt-2">已上传 {uploadedImages.length} / {MAX_PHOTOS} 张</p>
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
                  <span className="text-sm text-gray-400">添加</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div className="text-green-400 text-sm text-center">✓ 已上传 {uploadedImages.length} 张照片</div>
          </div>
        ) : (
          <label className="cursor-pointer block text-center">
            <div className="text-6xl mb-4">📸</div>
            <div className="text-gray-300 mb-2">点击上传宠物照片</div>
            <div className="text-gray-500 text-sm">支持 JPG、PNG 格式，建议上传不同角度的照片</div>
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
            <p>上传不同角度的照片可以帮助AI更好地理解您宠物的特征，生成更精准的虚拟形象。</p>
          </div>
        </div>
      </div>
    </div>
  ), [uploadedImages, handleImageUpload, removeImage]);

  const Step4Content = useCallback(() => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">🎨 选择艺术风格</h3>
        <p className="text-gray-400 text-sm">选择您喜欢的艺术风格来生成虚拟宠物形象</p>
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
                <div className="font-medium">{style.name}</div>
                <div className="text-xs opacity-70">{style.enName}</div>
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
            <p>不同的艺术风格会给您的虚拟宠物带来截然不同的视觉效果，选择一个最适合您宠物的风格吧！</p>
          </div>
        </div>
      </div>
    </div>
  ), [selectedArtStyle]);

  const Step5Content = useCallback(() => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">✅ 确认生成</h3>
        <p className="text-gray-400 text-sm">请确认以下信息后生成您的虚拟宠物</p>
      </div>

      <div className="p-4 bg-gray-700/50 rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-5xl">{selectedPetType?.emoji || '🐾'}</span>
          <div>
            <div className="text-white font-bold text-xl">{selectedBreed || '宠物'}</div>
            <div className="text-gray-400 text-sm">{selectedPetType?.enName}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-600/50 rounded-lg p-3">
            <div className="text-gray-400 text-xs">毛色</div>
            <div className="text-white font-medium">{selectedColor}</div>
          </div>
          <div className="bg-gray-600/50 rounded-lg p-3">
            <div className="text-gray-400 text-xs">艺术风格</div>
            <div className="text-white font-medium">{ART_STYLES.find(s => s.id === selectedArtStyle)?.name || selectedArtStyle}</div>
          </div>
        </div>

        <div className="border-t border-gray-600 pt-4">
          <div className="text-gray-400 text-sm mb-3">初始属性值</div>
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
          <div className="text-gray-400 text-sm mb-3">已上传照片 ({uploadedImages.length}张)</div>
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
            <p className="font-medium">生成次数</p>
            <p>您还可以免费生成 <strong>{Math.max(0, FREE_GENERATION_COUNT - generationCount)}</strong> 次虚拟宠物</p>
            {generationCount >= FREE_GENERATION_COUNT && (
              <p className="mt-1">后续生成每次将消耗 <strong>100积分</strong></p>
            )}
          </div>
        </div>
      </div>
    </div>
  ), [selectedPetType, selectedBreed, selectedColor, selectedArtStyle, attributeValues, uploadedImages, generationCount]);

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

  if (!isLoggedIn) {
    navigate('/login');
    return null;
  }

  if (showSuccess) {
    return (
      <div className="min-h-full gradient-bg flex flex-col items-center justify-center p-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="text-8xl mb-4">🎉</motion.div>
        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-white mb-2">虚拟宠物创建成功！</motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-white/70">正在跳转到首页...</motion.p>
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
          <h1 className="text-xl font-bold text-white">✨ 创建虚拟宠物</h1>
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
              ← 上一步
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
              下一步 →
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
                  生成中...
                </span>
              ) : (
                '🚀 生成虚拟宠物'
              )}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePetPage;