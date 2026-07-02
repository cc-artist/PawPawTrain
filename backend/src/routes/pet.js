import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth.js';
import imageService from '../services/imageService.js';
import cloudinaryService from '../services/cloudinaryService.js';
import storageService from '../services/storageService.js';

/**
 * 创建宠物路由
 * @param {Object} dataStore - 持久化数据存储
 */
function createPetRoutes(dataStore) {
  const router = Router();

  // 从持久化数据初始化宠物 Map
  const pets = new Map();
  if (dataStore.pets && typeof dataStore.pets === 'object') {
    Object.entries(dataStore.pets).forEach(([userId, userPets]) => {
      pets.set(userId, userPets);
    });
  }

  // 保存宠物数据到磁盘
  function persistPets() {
    const obj = {};
    pets.forEach((value, key) => { obj[key] = value; });
    storageService.savePets(obj);
    dataStore.pets = obj;
  }

  // ============================================================
  //  具名路由 (必须定义在参数化 /:id 路由之前)
  // ============================================================

  /**
   * POST /api/pet/adopt
   * 领养/创建虚拟宠物 - 调用AI生成宠物形象并上传到Cloudinary
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

      // 调用多模型图像生成服务
      console.log('🎨 开始生成宠物形象图片...');
      let imageResult;
      try {
        imageResult = await imageService.generateImage(petData);
        console.log(`✅ 图像生成成功: ${imageResult.generationId} (Provider: ${imageResult.provider || 'local'})`);
      } catch (imageError) {
        console.error('⚠️ 图像生成出错，使用降级方案:', imageError.message);
        imageResult = imageService.generateEnhancedSVG(petData);
      }

      // 上传生成的图片到 Cloudinary（永久存储）
      let cloudinaryUrl = imageResult.imageUrl;
      try {
        if (imageResult.imageUrl && !imageResult.isPlaceholder) {
          // 非本地SVG的图片，上传到Cloudinary
          const uploadResult = await cloudinaryService.uploadFromUrl(imageResult.imageUrl, userId);
          if (!uploadResult.fallback) {
            cloudinaryUrl = uploadResult.url;
            console.log(`☁️ 宠物图片已上传到Cloudinary: ${cloudinaryUrl}`);
          }
        } else if (imageResult.imageUrl && imageResult.imageUrl.startsWith('data:image/svg+xml')) {
          // SVG占位图也尝试上传到Cloudinary
          const uploadResult = await cloudinaryService.uploadFromUrl(imageResult.imageUrl, userId);
          if (!uploadResult.fallback) {
            cloudinaryUrl = uploadResult.url;
          }
        }
      } catch (uploadErr) {
        console.warn('⚠️ Cloudinary上传失败，使用原始URL:', uploadErr.message);
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
        imageUrl: cloudinaryUrl,
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
      persistPets();

      console.log('✅ 宠物创建完成:', { petId: pet.id, name: pet.name, type: pet.type, cloudinaryImage: !!cloudinaryUrl });

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
   * GET /api/pet/stats - 获取宠物状态
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
    persistPets();
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
    persistPets();
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
      persistPets();
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
    persistPets();
    res.json({ success: true, message: `${action} 成功！`, pet });
  });

  /**
   * POST /api/pets/:id/chat - 宠物 AI 聊天 (English responses + emotion/animation)
   */
  router.post('/:id/chat', authMiddleware, (req, res) => {
    const { message } = req.body;
    const userId = req.user.id;
    const petId = req.params.id;
    const userPets = pets.get(userId) || [];
    const pet = userPets.find(p => p.id === petId);
    if (!pet) return res.status(404).json({ error: 'Pet not found' });

    const msg = (message || '').toLowerCase();

    // Keyword-based response matching for a more "AI-like" feel
    let category = 'greeting';
    if (/hungry|food|eat|feed|snack|treat|yum|dinner|lunch|breakfast/i.test(msg)) {
      category = 'hungry';
    } else if (/play|game|toy|ball|run|fetch|fun|bored/i.test(msg)) {
      category = 'play';
    } else if (/tired|sleep|nap|rest|yawn|bed/i.test(msg)) {
      category = 'sleepy';
    } else if (/love|like|miss|cute|adorable|favorite|best|good|sweet/i.test(msg)) {
      category = 'affection';
    } else if (/hello|hi|hey|howdy|morning|evening|good/i.test(msg)) {
      category = 'greeting';
    } else if (/name|who|what are you|your name/i.test(msg)) {
      category = 'intro';
    } else if (/walk|outside|park|out|adventure|go/i.test(msg)) {
      category = 'walk';
    } else if (/sad|upset|bad|angry|mad|sorry|cry/i.test(msg)) {
      category = 'comfort';
    } else if (/trick|skill|dance|sing|jump|roll|sit|stay/i.test(msg)) {
      category = 'tricks';
    } else if (/joke|laugh|funny|haha|lol/i.test(msg)) {
      category = 'funny';
    } else if (/weather|rain|sun|hot|cold|snow/i.test(msg)) {
      category = 'weather';
    } else if (/thank|thanks|thx/i.test(msg)) {
      category = 'thanks';
    }

    const replyBanks = {
      greeting: [
        `${pet.emoji} ${pet.name}: Hey there, pal! So happy to see you~`,
        `${pet.emoji} ${pet.name}: Hi hi! I was waiting for you! *wags tail*`,
        `${pet.emoji} ${pet.name}: Oh! You're back! I missed you so much~`,
        `${pet.emoji} ${pet.name}: Woohoo! My favorite human is here!`,
        `${pet.emoji} ${pet.name}: Hello hello! Ready for some fun today? ^_^`,
        `${pet.emoji} ${pet.name}: Yay! You came to chat with me!`,
      ],
      hungry: [
        `${pet.emoji} ${pet.name}: Ooh, is that food I smell? I'm starving! 🍖`,
        `${pet.emoji} ${pet.name}: You read my mind! My tummy is rumbling...`,
        `${pet.emoji} ${pet.name}: Treats? Treats?! Did someone say treats?! *excited bouncing*`,
        `${pet.emoji} ${pet.name}: Yummy yummy! Can I have a snack please? Pretty please?`,
        `${pet.emoji} ${pet.name}: Food time is the BEST time! Feed me feed me!`,
      ],
      play: [
        `${pet.emoji} ${pet.name}: YES! Playtime is my favorite! Let's go! 🎾`,
        `${pet.emoji} ${pet.name}: Throw the ball! Throw it throw it throw it!`,
        `${pet.emoji} ${pet.name}: Finally! I've been so bored... Time to have some fun!`,
        `${pet.emoji} ${pet.name}: Chase me if you can! Bet you won't catch me~ teehee~`,
        `${pet.emoji} ${pet.name}: Game on! I'm the champion of playtime, you know!`,
      ],
      sleepy: [
        `${pet.emoji} ${pet.name}: *yawn* So... sleepy... can we cuddle instead?`,
        `${pet.emoji} ${pet.name}: Zzz... huh? Oh, sorry, I was napping. What's up?`,
        `${pet.emoji} ${pet.name}: Five more minutes... please... so cozy here...`,
        `${pet.emoji} ${pet.name}: Nap time is the second best time after food time~`,
        `${pet.emoji} ${pet.name}: *stretches and yawns* Okay okay, I'm awake now! Sort of...`,
      ],
      affection: [
        `${pet.emoji} ${pet.name}: Aww, you're the best human ever! *heart eyes* 💕`,
        `${pet.emoji} ${pet.name}: You know I love you more than treats, right? Well... almost!`,
        `${pet.emoji} ${pet.name}: *purrs happily* You make me so happy! Don't ever leave~`,
        `${pet.emoji} ${pet.name}: Blushing! Nobody has ever been this sweet to me before~`,
        `${pet.emoji} ${pet.name}: Hehe, I love you too! Can I get a head pat? Please please?`,
      ],
      intro: [
        `${pet.emoji} ${pet.name}: I'm ${pet.name}, your loyal and adorable companion! Nice to meet you~`,
        `${pet.emoji} ${pet.name}: That's me! ${pet.name} the ${pet.type}, at your service! *salutes paw*`,
        `${pet.emoji} ${pet.name}: I'm your virtual pet ${pet.name}! I'm here to make you smile every day~`,
      ],
      walk: [
        `${pet.emoji} ${pet.name}: ADVENTURE TIME! I love going outside! Let's go let's go!`,
        `${pet.emoji} ${pet.name}: Ooh, the park? Can we chase squirrels? Please? 🐿️`,
        `${pet.emoji} ${pet.name}: Fresh air! New smells! This is the best day ever!`,
        `${pet.emoji} ${pet.name}: Wait wait, let me get ready! *runs in circles excitedly*`,
      ],
      comfort: [
        `${pet.emoji} ${pet.name}: Hey, don't be sad... I'm right here beside you.`,
        `${pet.emoji} ${pet.name}: *nuzzles against you* Everything will be okay, I promise.`,
        `${pet.emoji} ${pet.name}: Hug time! Nothing bad can reach you when I'm here~ 🤗`,
        `${pet.emoji} ${pet.name}: It's okay to be upset sometimes. I still think you're amazing!`,
      ],
      tricks: [
        `${pet.emoji} ${pet.name}: Watch this! *does a perfect roll* Ta-da! Impressed?`,
        `${pet.emoji} ${pet.name}: I've been practicing! Check out my new spin move! Wheee~`,
        `${pet.emoji} ${pet.name}: Sit. Stay. Roll over. Shake paw. I know them all! Treat please?`,
        `${pet.emoji} ${pet.name}: Talent show time! *dances in a circle* How was that?`,
      ],
      funny: [
        `${pet.emoji} ${pet.name}: Why did the ${pet.type} cross the road? ...I forget, but it was funny!`,
        `${pet.emoji} ${pet.name}: Haha! You're funny! *rolls on back laughing*`,
        `${pet.emoji} ${pet.name}: Knock knock! ...Who's there? ...${pet.name}! ...${pet.name} who? ...${pet.name} let me in, I'm hungry! 😂`,
        `${pet.emoji} ${pet.name}: I tried to tell a joke once... but I forgot the punchline. Still funny though!`,
      ],
      weather: [
        `${pet.emoji} ${pet.name}: I don't mind the weather as long as I'm with you!`,
        `${pet.emoji} ${pet.name}: Perfect day for an adventure! Or... a nap. Either works!`,
        `${pet.emoji} ${pet.name}: Rainy days are the best for cuddles, don't you think?`,
        `${pet.emoji} ${pet.name}: Too hot? Too cold? I'm good at regulating... by sitting on your lap!`,
      ],
      thanks: [
        `${pet.emoji} ${pet.name}: You're welcome! Anything for you, my favorite human!`,
        `${pet.emoji} ${pet.name}: No need to thank me, your smile is all the reward I need~`,
        `${pet.emoji} ${pet.name}: Anytime! That's what buddies are for! *happy tail wag*`,
        `${pet.emoji} ${pet.name}: Aww, you're so polite! Now, about those treats we discussed...`,
      ],
    };

    // Emotion mapping for each category
    const emotionMap = {
      greeting: 'happy',
      hungry: 'excited',
      play: 'playful',
      sleepy: 'sleepy',
      affection: 'gentle',
      intro: 'happy',
      walk: 'excited',
      comfort: 'gentle',
      tricks: 'playful',
      funny: 'excited',
      weather: 'calm',
      thanks: 'gentle',
    };

    // Animation mapping for each category
    const animationMap = {
      greeting: ['bounce', 'wiggle', 'pulse'],
      hungry: ['jump', 'bounce', 'spin'],
      play: ['spin', 'jump', 'flip'],
      sleepy: ['pulse', 'bounce'],
      affection: ['pulse', 'wiggle'],
      intro: ['bounce', 'spin'],
      walk: ['jump', 'spin', 'flip'],
      comfort: ['pulse', 'wiggle'],
      tricks: ['spin', 'flip', 'jump'],
      funny: ['flip', 'spin', 'bounce'],
      weather: ['pulse', 'wiggle'],
      thanks: ['bounce', 'wiggle'],
    };

    const replies = replyBanks[category] || replyBanks.greeting;
    const reply = replies[Math.floor(Math.random() * replies.length)];
    const emotion = emotionMap[category] || 'happy';
    const animations = animationMap[category] || ['bounce', 'wiggle'];
    const animation = animations[Math.floor(Math.random() * animations.length)];

    // Update pet joy slightly on chat
    pet.joy = Math.min(100, (pet.joy || 50) + 1);
    pet.intimacy = Math.min(100, (pet.intimacy || 50) + 1);
    pet.updatedAt = new Date().toISOString();
    pets.set(userId, userPets);
    persistPets();

    res.json({
      success: true,
      response: reply,
      emotion,
      animation,
      pet: {
        joy: pet.joy,
        intimacy: pet.intimacy,
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/pets/:id - 获取单个宠物详情
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

  return router;
}

export default createPetRoutes;
