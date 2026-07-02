import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import imageService from '../services/imageService.js';

/**
 * AI创作工坊路由
 * 用宠物图片/视频制作各种商品类型
 */
const createWorkshopRoutes = (dataStore) => {
  const router = Router();

  // 初始化 workshop creations 存储
  if (!dataStore.workshopCreations) {
    dataStore.workshopCreations = new Map();
  }

  // OPTIONS 预检处理（确保 CORS 预检通过）
  router.options('/generate', (req, res) => {
    res.sendStatus(204);
  });

  /**
   * 产品类型的专业 prompt 模板
   */
  const PRODUCT_PROMPTS = {
    portrait: (petName, petType, petColor) => 
      `professional pet portrait photography, adorable ${petColor} ${petType} named ${petName}, studio lighting, elegant composition, soft bokeh background, award-winning pet photography, 8K ultra detailed, magazine cover quality, warm golden hour lighting`,

    sticker: (petName, petType, petColor) =>
      `cute ${petColor} ${petType} sticker pack design, kawaii style, multiple expressive poses, clean white background, emoji-style illustrations, vibrant colors, social media sticker set, Japanese LINE sticker style, simple vector art, adorable cartoon expressions happy angry surprised sleepy`,

    wallpaper: (petName, petType, petColor) =>
      `beautiful ${petColor} ${petType} wallpaper design, minimalist aesthetic, phone wallpaper 9:16 ratio, dreamy pastel colors, ${petName} as the main subject, elegant decorative elements, clean composition with ample negative space, modern flat design, soothing color palette`,

    merch: (petName, petType, petColor) =>
      `product mockup featuring ${petColor} ${petType} named ${petName}, merchandise design mockup on t-shirt mug and phone case, commercial product photography, clean white background, professional e-commerce style, high quality print-ready design, trendy merchandise collection`,

    story: (petName, petType, petColor) =>
      `childrens book illustration of a ${petColor} ${petType} named ${petName}, storybook art style, whimsical fairytale scene, soft watercolor texture, magical atmosphere, cute animal characters, warm storytelling mood, picture book quality, enchanting garden setting`,

    avatar: (petName, petType, petColor) =>
      `custom ${petColor} ${petType} avatar for social media profile picture, circular composition, cute cartoon style, vibrant colors, clean design, ${petName} centered portrait, modern avatar aesthetic, high contrast, suitable for all platforms`,

    badge: (petName, petType, petColor) =>
      `achievement badge design featuring ${petColor} ${petType} named ${petName}, gaming achievement style, metallic gold and silver effects, ornate border design, medal ribbon, prestigious award badge, 3D rendered with shine effects, collectible token design`,

    video: (petName, petType, petColor) =>
      `cinematic video thumbnail of ${petColor} ${petType} named ${petName}, dynamic action shot, motion blur effect, YouTube thumbnail style, vibrant energetic composition, exciting pet moment, professional video production quality, eye-catching thumbnail design`,
  };

  /**
   * 将 base64 图片转存为可用的 URL
   */
  const processImageForGeneration = (imageBase64, productType) => {
    // 如果是 URL 字符串直接返回
    if (imageBase64 && !imageBase64.startsWith('data:')) {
      return imageBase64;
    }
    return imageBase64;  // 保持 base64 格式传给 imageService
  };

  /**
   * POST /api/workshop/generate
   * 基于上传图片 + 产品类型生成 AI 商品
   */
  router.post('/generate', async (req, res) => {
    try {
      // 兼容：body 可能未被 express.json() 正常解析的情况
      let body = req.body;
      if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
        return res.status(400).json({ success: false, error: '请求体为空，请确认以 JSON 格式发送数据' });
      }

      const { imageBase64, productType = 'portrait', petName = '宠物', petType = 'cat', petColor = '花色' } = body;

      if (!imageBase64) {
        return res.status(400).json({ success: false, error: '请上传宠物图片' });
      }

      if (typeof imageBase64 !== 'string' || imageBase64.length < 50) {
        return res.status(400).json({ success: false, error: '图片数据无效，请重新上传' });
      }

      const validTypes = Object.keys(PRODUCT_PROMPTS);
      if (!validTypes.includes(productType)) {
        return res.status(400).json({ success: false, error: `不支持的产品类型，可选: ${validTypes.join(', ')}` });
      }

      console.log(`🎨 AI创作工坊: 生成 ${productType} for ${petName}`);

      const promptBuilder = PRODUCT_PROMPTS[productType];
      const prompt = promptBuilder(petName, petType, petColor);

      const petData = {
        type: petType,
        name: petName,
        color: petColor,
        artStyle: productType === 'sticker' ? 'flat_design' :
                  productType === 'story' ? 'ghibli' :
                  productType === 'badge' ? 'cyberpunk' :
                  productType === 'avatar' ? 'anime_cel' :
                  '3d_cartoon'
      };

      const result = await imageService.generateImage(petData);

      const creationId = uuidv4();
      const creation = {
        id: creationId,
        productType,
        productName: getProductName(productType),
        petName,
        petType,
        petColor,
        imageUrl: result.imageUrl,
        provider: result.provider || 'local',
        createdAt: new Date().toISOString(),
        isPlaceholder: result.isPlaceholder || false,
      };

      // 存储到内存
      const userId = req.user?.id || 'anonymous';
      if (!dataStore.workshopCreations.has(userId)) {
        dataStore.workshopCreations.set(userId, []);
      }
      dataStore.workshopCreations.get(userId).push(creation);

      res.json({
        success: true,
        creation,
        message: `${creation.productName} 生成成功！`,
      });
    } catch (error) {
      console.error('AI Workshop 生成失败:', error.message);
      res.status(500).json({
        success: false,
        error: 'AI 生成失败，请稍后重试',
        detail: error.message,
      });
    }
  });

  /**
   * GET /api/workshop/creations
   * 获取用户所有创作记录
   */
  router.get('/creations', (req, res) => {
    const userId = req.user?.id || 'anonymous';
    const creations = dataStore.workshopCreations.get(userId) || [];
    res.json({
      success: true,
      creations: creations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    });
  });

  /**
   * GET /api/workshop/product-types
   * 返回所有可用产品类型
   */
  router.get('/product-types', (req, res) => {
    res.json({
      success: true,
      types: [
        { id: 'portrait', name: '艺术写真', nameEn: 'Art Portrait', icon: '🎨', desc: '专业级宠物写真照', price: 50 },
        { id: 'sticker', name: '专属表情包', nameEn: 'Sticker Pack', icon: '📱', desc: '16款萌宠表情包', price: 80 },
        { id: 'wallpaper', name: '定制壁纸', nameEn: 'Wallpaper', icon: '🖼️', desc: '专属手机/电脑壁纸', price: 60 },
        { id: 'merch', name: '实体周边', nameEn: 'Merch Design', icon: '🧸', desc: 'T恤/杯子/手机壳设计', price: 120 },
        { id: 'story', name: '故事绘本', nameEn: 'Story Book', icon: '📖', desc: '宠物主题插画故事', price: 150 },
        { id: 'avatar', name: '个性头像', nameEn: 'Avatar', icon: '🎭', desc: '社交媒体专属头像', price: 40 },
        { id: 'badge', name: '荣誉勋章', nameEn: 'Badge', icon: '🏅', desc: '创作里程碑徽章', price: 30 },
        { id: 'video', name: '趣味视频', nameEn: 'Fun Clip', icon: '🎬', desc: 'AI生成宠物短视频', price: 200 },
      ],
    });
  });

  return router;
};

const PRODUCT_NAMES = {
  portrait: '艺术写真',
  sticker: '专属表情包',
  wallpaper: '定制壁纸',
  merch: '实体周边设计',
  story: '故事绘本',
  avatar: '个性头像',
  badge: '荣誉勋章',
  video: '趣味视频',
};

function getProductName(type) {
  return PRODUCT_NAMES[type] || 'AI创作';
}

export default createWorkshopRoutes;
