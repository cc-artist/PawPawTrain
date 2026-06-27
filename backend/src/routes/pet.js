import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import imageService from '../services/imageService.js';

const router = Router();

// 内存宠物数据库
const pets = new Map();

// ============================================================
//  具名路由 (必须定义在参数化 /:id 路由之前)
// ============================================================

/**
 * POST /api/pet/adopt
 * 领养/创建虚拟宠物 - 调用豆包 SEEDREAM 5.0 生成宠物形象
 * 这是 CreatePetPage 第5步"确认生成"调用的核心 API
 */
router.post('/adopt', authMiddleware, async (req, res) => {
  try {
    const petData = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    console.log('🐾 收到宠物创建请求:', {
      userId,
      type: petData.type,
      name: petData.name,
      artStyle: petData.artStyle,
      color: petData.color
    });

    if (!petData.type || !petData.name) {
      return res.status(400).json({ error: '缺少必要参数: type 和 name' });
    }

    // 调用多模型图像生成服务（豆包 SEEDREAM 5.0 > Stability AI > 本地SVG）
    console.log('🎨 开始生成宠物形象图片...');
    let imageResult;
    try {
      imageResult = await imageService.generateImage(petData);
      console.log(`✅ 图像生成成功: ${imageResult.generationId} (Provider: ${imageResult.provider || 'local'})`);
    } catch (imageError) {
      console.error('⚠️ 图像生成出错，使用降级方案:', imageError.message);
      imageResult = imageService.generateEnhancedSVG(petData);
    }

    const petId = 'pet_' + uuidv4().slice(0, 8);
    const pet = {
      id: petId,
      type: petData.type,
      name: petData.name,
      emoji: petData.emoji || '🐾',
      avatar: petData.emoji || '🐾',
      color: petData.color || '默认',
      artStyle: petData.artStyle || '3d_cartoon',
      intimacy: petData.intimacy ?? 50,
      hunger: petData.hunger ?? 70,
      energy: petData.energy ?? 50,
      joy: petData.joy ?? 50,
      discipline: petData.discipline ?? 50,
      health: petData.health ?? 100,
      exploration: petData.exploration ?? 0,
      affection: petData.intimacy ?? 50,
      level: petData.level ?? 1,
      exp: petData.exp ?? 0,
      expToNext: petData.expToNext ?? 100,
      points: petData.points ?? 0,
      imageUrl: imageResult.imageUrl,
      generationId: imageResult.generationId,
      isPlaceholder: imageResult.isPlaceholder || false,
      photoCount: 0,
      voiceCollected: false,
      learnedSkills: [],
      loraStatus: imageResult.isPlaceholder ? 'pending' : 'trained',
      badges: [],
      ownerId: userId,
      ownerName: username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const userPets = pets.get(userId) || [];
    userPets.push(pet);
    pets.set(userId, userPets);

    console.log('✅ 宠物创建完成:', { petId: pet.id, name: pet.name, type: pet.type, hasImage: !!pet.imageUrl });

    res.status(201).json({ success: true, message: '虚拟宠物创建成功！', pet });
  } catch (error) {
    console.error('❌ 创建宠物失败:', error);
    res.status(500).json({ error: '创建宠物失败: ' + (error.message || '未知错误') });
  }
});

/**
 * GET /api/pet/my - 获取当前用户的宠物
 */
router.get('/my', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const userPets = pets.get(userId) || [];
  const latestPet = userPets.length > 0 ? userPets[userPets.length - 1] : null;
  res.json({ success: true, pet: latestPet, pets: userPets });
});

/**
 * GET /api/pet/stats - 获取宠物状态（必须在 /:id 之前）
 */
router.get('/stats', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const userPets = pets.get(userId) || [];
  const pet = userPets.length > 0 ? userPets[userPets.length - 1] : null;
  if (!pet) return res.json({ success: true, pet: null, stats: null });

  res.json({
    success: true,
    stats: {
      intimacy: pet.intimacy, hunger: pet.hunger, energy: pet.energy,
      joy: pet.joy, discipline: pet.discipline, health: pet.health,
      exploration: pet.exploration, level: pet.level, exp: pet.exp,
      expToNext: pet.expToNext
    }
  });
});

/**
 * POST /api/pet/feed - 喂食宠物
 */
router.post('/feed', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const userPets = pets.get(userId) || [];
  if (userPets.length === 0) return res.status(404).json({ error: '没有宠物' });
  const pet = userPets[userPets.length - 1];
  pet.hunger = Math.min(100, (pet.hunger || 70) + 10);
  pet.joy = Math.min(100, (pet.joy || 50) + 5);
  pet.updatedAt = new Date().toISOString();
  pets.set(userId, userPets);
  res.json({ success: true, message: '喂食成功！', pet: { hunger: pet.hunger, joy: pet.joy } });
});

/**
 * POST /api/pet/pet - 抚摸宠物
 */
router.post('/pet', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const userPets = pets.get(userId) || [];
  if (userPets.length === 0) return res.status(404).json({ error: '没有宠物' });
  const pet = userPets[userPets.length - 1];
  pet.intimacy = Math.min(100, (pet.intimacy || 50) + 5);
  pet.affection = Math.min(100, (pet.affection || 50) + 5);
  pet.joy = Math.min(100, (pet.joy || 50) + 3);
  pet.updatedAt = new Date().toISOString();
  pets.set(userId, userPets);
  res.json({ success: true, message: '抚摸成功！', pet: { intimacy: pet.intimacy, affection: pet.affection, joy: pet.joy } });
});

// ============================================================
//  API 宠物列表路由
// ============================================================

/**
 * GET /api/pets - 获取所有宠物（展示页用）
 */
router.get('/', (req, res) => {
  const allPets = [];
  pets.forEach((userPets) => { allPets.push(...userPets); });
  res.json({
    success: true,
    pets: allPets.map(p => ({
      id: p.id, name: p.name, type: p.type, emoji: p.emoji, avatar: p.avatar,
      imageUrl: p.imageUrl, level: p.level, intimacy: p.intimacy, affection: p.affection,
      loraStatus: p.loraStatus, photoCount: p.photoCount || 0, artStyle: p.artStyle, color: p.color
    }))
  });
});

/**
 * POST /api/pets - 创建宠物（简化版，无图像生成）
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const petData = req.body;
    const userId = req.user.id;
    const petId = 'pet_' + uuidv4().slice(0, 8);
    const pet = {
      id: petId,
      ...petData,
      imageUrl: petData.imageUrl || null,
      ownerId: userId,
      learnedSkills: [],
      loraStatus: 'pending',
      photoCount: 0,
      voiceCollected: false,
      badges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const userPets = pets.get(userId) || [];
    userPets.push(pet);
    pets.set(userId, userPets);
    res.status(201).json({ success: true, pet });
  } catch (error) {
    console.error('创建宠物失败:', error);
    res.status(500).json({ error: '创建失败' });
  }
});

// ============================================================
//  参数化路由 (必须定义在具名路由之后)
// ============================================================

/**
 * POST /api/pets/:id/interact - 与宠物交互
 */
router.post('/:id/interact', authMiddleware, (req, res) => {
  const { action } = req.body;
  const userId = req.user.id;
  const petId = req.params.id;
  const userPets = pets.get(userId) || [];
  const pet = userPets.find(p => p.id === petId);
  if (!pet) return res.status(404).json({ error: '宠物不存在' });

  const interactions = {
    feed: () => { pet.hunger = Math.min(100, pet.hunger + 15); pet.joy = Math.min(100, pet.joy + 5); },
    pet: () => { pet.intimacy = Math.min(100, pet.intimacy + 10); pet.affection = Math.min(100, pet.affection + 10); },
    play: () => { pet.joy = Math.min(100, pet.joy + 15); pet.energy = Math.max(0, pet.energy - 10); },
    walk: () => { pet.exploration = Math.min(100, pet.exploration + 10); pet.energy = Math.max(0, pet.energy - 15); },
    heal: () => { pet.health = Math.min(100, pet.health + 20); }
  };

  if (!interactions[action]) return res.status(400).json({ error: `未知的交互动作: ${action}` });

  interactions[action]();
  pet.updatedAt = new Date().toISOString();
  pets.set(userId, userPets);
  res.json({ success: true, message: `${action} 成功！`, pet });
});

/**
 * POST /api/pets/:id/chat - 宠物 AI 聊天
 */
router.post('/:id/chat', authMiddleware, (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;
  const petId = req.params.id;
  const userPets = pets.get(userId) || [];
  const pet = userPets.find(p => p.id === petId);
  if (!pet) return res.status(404).json({ error: '宠物不存在' });

  const replies = [
    `${pet.emoji} ${pet.name}: 汪汪！主人你来了~`,
    `${pet.emoji} ${pet.name}: 好想和主人一起玩耍呢！`,
    `${pet.emoji} ${pet.name}: 今天天气真好，带我出去散步吧~`,
    `${pet.emoji} ${pet.name}: 主人主人，我饿了！`,
    `${pet.emoji} ${pet.name}: (*╹▽╹*) 最喜欢主人了！`,
    `${pet.emoji} ${pet.name}: 主人说我可爱吗？`,
    `${pet.emoji} ${pet.name}: 我们一起玩游戏吧！`
  ];
  const reply = replies[Math.floor(Math.random() * replies.length)];
  res.json({ success: true, reply, timestamp: new Date().toISOString() });
});

/**
 * GET /api/pets/:id - 获取单个宠物详情（必须放在所有命名路由之后）
 */
router.get('/:id', (req, res) => {
  let foundPet = null;
  pets.forEach((userPets) => {
    const pet = userPets.find(p => p.id === req.params.id);
    if (pet) foundPet = pet;
  });
  if (!foundPet) return res.status(404).json({ error: '宠物不存在' });
  res.json({ success: true, pet: foundPet });
});

export default router;
