/**
 * 帖子/动态路由
 * 支持视频上传和Feed推荐
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import recommendationService from '../services/recommendationService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'posts');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user?.id || 'anonymous';
    const userDir = path.join(uploadDir, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `post_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
});

// 内存存储帖子
const posts = [];

/**
 * POST /api/posts/create
 * 创建帖子
 */
router.post('/create', authMiddleware, upload.fields([
  { name: 'photos', maxCount: 9 },
  { name: 'video', maxCount: 1 }
]), (req, res) => {
  try {
    const userId = req.user.id;
    const { content, tags, petId, petName } = req.body;

    const mediaFiles = [];
    
    if (req.files?.photos) {
      req.files.photos.forEach(f => {
        mediaFiles.push(`/uploads/posts/${userId}/${f.filename}`);
      });
    }
    if (req.files?.video) {
      req.files.video.forEach(f => {
        mediaFiles.push(`/uploads/posts/${userId}/${f.filename}`);
      });
    }

    const parsedTags = tags ? JSON.parse(tags) : [];

    const post = {
      id: uuidv4(),
      userId,
      user: {
        name: petName ? `🐾 ${petName}` : '🐾 宠物主人',
        avatar: '🐾',
      },
      content: content || '',
      media: mediaFiles[0] || null,
      mediaFiles,
      tags: parsedTags,
      petId: petId || '',
      likes: 0,
      comments: 0,
      shares: 0,
      favorites: 0,
      time: '刚刚',
      features: {
        petType: 'pet',
        tags: parsedTags,
        emotion: 'positive',
        personalityBoost: { energy: 5, affection: 5, joy: 8 },
      },
      isMine: true,
      createdAt: new Date().toISOString(),
    };

    posts.unshift(post);

    res.status(201).json({
      success: true,
      post,
    });
  } catch (error) {
    console.error('发布帖子失败:', error);
    res.status(500).json({ error: error.message || '发布失败' });
  }
});

/**
 * GET /api/posts/feed
 * 获取Feed流 - 带个性化推荐排序
 */
router.get('/feed', optionalAuth, (req, res) => {
  const userId = req.user?.id || 'guest';
  const { page = 1, limit = 20 } = req.query;

  // 获取训练生成的帖子
  const trainingPosts = [];
  // training posts are accessed via the training route module's memory
  // For now, use the local posts array

  const allPosts = [...posts];

  // 个性化排序
  const userProfile = recommendationService.getUserProfile(userId);
  const sorted = recommendationService.personalizedSort(allPosts, userId, userProfile);

  const start = (page - 1) * limit;
  const paged = sorted.slice(start, start + limit);

  res.json({
    success: true,
    posts: paged,
    page: Number(page),
    hasMore: start + limit < sorted.length,
    recommendationModel: 'personalized-collaborative-filtering',
  });
});

/**
 * POST /api/posts/record-view
 * 记录用户浏览行为
 */
router.post('/record-view', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { postId, postFeatures } = req.body;

  recommendationService.recordView(userId, postId, postFeatures || {});

  res.json({ success: true });
});

/**
 * GET /api/posts/user-preferences
 * 获取用户偏好画像
 */
router.get('/user-preferences', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const profile = recommendationService.getUserProfile(userId);

  res.json({
    success: true,
    profile: {
      petType: profile.petType,
      preferredTags: profile.preferredTags,
      preferredEmotion: profile.preferredEmotion,
      interactionCount: profile.interactionCount,
    },
  });
});

export default router;
