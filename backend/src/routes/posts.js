/**
 * 帖子/动态路由
 * 支持视频/图片上传到Cloudinary和Feed推荐
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import recommendationService from '../services/recommendationService.js';
import cloudinaryService from '../services/cloudinaryService.js';
import storageService from '../services/storageService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 创建帖子路由
 * @param {Object} dataStore - 持久化数据存储
 */
function createPostsRoutes(dataStore) {
  const router = Router();

  // 本地临时上传目录
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

  // 从持久化数据初始化帖子数组
  const posts = Array.isArray(dataStore.posts) ? dataStore.posts : [];

  function persistPosts() {
    storageService.savePosts(posts);
    dataStore.posts = posts;
  }

  /**
   * POST /api/posts/create
   * 创建帖子 → 媒体文件上传Cloudinary
   */
  router.post('/create', authMiddleware, upload.fields([
    { name: 'photos', maxCount: 9 },
    { name: 'video', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const userId = req.user.id;
      const { content, tags, petId, petName } = req.body;

      // 收集所有文件路径
      const allFiles = [];
      if (req.files?.photos) {
        req.files.photos.forEach(f => allFiles.push({ path: f.path, type: 'image' }));
      }
      if (req.files?.video) {
        req.files.video.forEach(f => allFiles.push({ path: f.path, type: 'video' }));
      }

      // 上传到 Cloudinary
      let mediaFiles = [];
      if (allFiles.length > 0) {
        const uploadResults = await cloudinaryService.uploadMultiple(allFiles, userId, 'posts');
        mediaFiles = uploadResults.map(r => r.url).filter(Boolean);

        // 清理本地临时文件
        allFiles.forEach(f => {
          try { fs.unlinkSync(f.path); } catch (e) { /* ignore */ }
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
      persistPosts();

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

    const allPosts = [...posts];
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
   */
  router.post('/record-view', authMiddleware, (req, res) => {
    const userId = req.user.id;
    const { postId, postFeatures } = req.body;

    recommendationService.recordView(userId, postId, postFeatures || {});

    res.json({ success: true });
  });

  /**
   * GET /api/posts/user-preferences
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

  return router;
}

export default createPostsRoutes;
