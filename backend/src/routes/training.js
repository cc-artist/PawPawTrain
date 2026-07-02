/**
 * 训练路由
 * 虚拟宠物动作训练器
 * 
 * 流程：
 * 1. 用户上传1-3个视频 → Cloudinary云存储
 * 2. 视频分析（行为识别）
 * 3. DreamBooth+LoRA训练模拟
 * 4. 自动发布到动态Feed
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { authMiddleware } from '../middleware/auth.js';
import videoAnalyzer from '../services/videoAnalyzer.js';
import recommendationService from '../services/recommendationService.js';
import cloudinaryService from '../services/cloudinaryService.js';
import storageService from '../services/storageService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 创建训练路由
 * @param {Object} dataStore - 持久化数据存储
 */
function createTrainingRoutes(dataStore) {
  const router = Router();

  // 配置本地 multer（临时存储后上传Cloudinary）
  const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'training');
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
      cb(null, `train_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`);
    }
  });

  const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('不支持的文件格式，请上传视频文件'), false);
      }
    }
  });

  // 从持久化数据初始化 Map
  const trainingTasks = new Map();
  const trainingPosts = new Map();

  if (dataStore.trainingTasks && typeof dataStore.trainingTasks === 'object') {
    Object.entries(dataStore.trainingTasks).forEach(([key, value]) => {
      trainingTasks.set(key, value);
    });
  }
  if (dataStore.trainingPosts && typeof dataStore.trainingPosts === 'object') {
    Object.entries(dataStore.trainingPosts).forEach(([key, value]) => {
      trainingPosts.set(key, value);
    });
  }

  // 持久化方法
  function persistTraining() {
    const tasksObj = {};
    trainingTasks.forEach((v, k) => { tasksObj[k] = v; });
    storageService.saveTrainingTasks(tasksObj);
    dataStore.trainingTasks = tasksObj;

    const postsObj = {};
    trainingPosts.forEach((v, k) => { postsObj[k] = v; });
    storageService.saveTrainingPosts(postsObj);
    dataStore.trainingPosts = postsObj;
  }

  /**
   * POST /api/training/upload
   * 上传训练视频（1-3个）→ 上传Cloudinary → 分析 → 训练
   */
  router.post('/upload', authMiddleware, upload.array('videos', 3), async (req, res) => {
    try {
      const userId = req.user.id;
      const files = req.files;
      const { petType, petName } = req.body;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: '请至少上传1个视频' });
      }
      if (files.length > 3) {
        return res.status(400).json({ error: '最多上传3个视频' });
      }

      // 上传视频到 Cloudinary
      console.log(`☁️ 上传 ${files.length} 个视频到 Cloudinary...`);
      const uploadResults = await Promise.allSettled(
        files.map(f => cloudinaryService.uploadVideo(f.path, userId, 'training'))
      );

      const cloudinaryVideos = uploadResults.map((r, i) => {
        if (r.status === 'fulfilled') {
          return { originalName: files[i].originalname, url: r.value.url, publicId: r.value.publicId, size: files[i].size };
        }
        return { originalName: files[i].originalname, url: null, publicId: null, size: files[i].size, error: true };
      });

      // 清理本地临时文件
      files.forEach(f => {
        try { fs.unlinkSync(f.path); } catch (e) { /* ignore */ }
      });

      const videoPaths = files.map(f => f.path);

      // 视频行为分析
      console.log(`🎬 开始分析 ${files.length} 个训练视频...`);
      const analysisResult = await videoAnalyzer.analyzeMultipleVideos(
        videoPaths,
        petType || 'dog',
        petName || '宠物'
      );

      // 更新用户偏好
      recommendationService.updatePreferencesFromAnalysis(userId, analysisResult);

      // 创建训练任务
      const taskId = uuidv4();
      const task = {
        id: taskId,
        userId,
        petType: analysisResult.petType,
        petName: analysisResult.petName,
        status: 'analyzing',
        phase: 'video_analysis_complete',
        videos: cloudinaryVideos,
        analysis: analysisResult,
        createdAt: new Date().toISOString(),
        techStack: {
          motionCapture: 'MotionBooth (open source)',
          loraTraining: 'DreamBooth + LoRA',
          modelArchitecture: 'i2L-V2 (ModelScope open source)',
          behaviorClassification: 'DeepSVDD + Meta Pseudo Labels',
          frameAnalysis: 'OpenCV-based pose detection',
        },
        trainingPhases: [
          { id: 'video_analysis', label: '视频分析', status: 'completed', progress: 100 },
          { id: 'motion_capture', label: '动作捕捉 (MotionBooth)', status: 'pending', progress: 0 },
          { id: 'lora_training', label: 'LoRA训练 (DreamBooth)', status: 'pending', progress: 0 },
          { id: 'model_optimization', label: '模型优化 (i2L-V2)', status: 'pending', progress: 0 },
          { id: 'post_generation', label: '生成动态内容', status: 'pending', progress: 0 },
        ]
      };

      trainingTasks.set(taskId, task);
      persistTraining();

      // 模拟训练过程
      simulateTrainingProcess(taskId, userId);

      res.status(201).json({
        success: true,
        task,
        message: `视频分析完成！检测到${analysisResult.detectedActions.length}种行为，训练已启动`,
      });
    } catch (error) {
      console.error('训练上传失败:', error);
      res.status(500).json({ error: error.message || '训练处理失败' });
    }
  });

  /**
   * 模拟训练过程
   */
  function simulateTrainingProcess(taskId, userId) {
    const task = trainingTasks.get(taskId);
    if (!task) return;

    let phaseIndex = 1;

    const interval = setInterval(() => {
      const currentTask = trainingTasks.get(taskId);
      if (!currentTask) {
        clearInterval(interval);
        return;
      }

      if (phaseIndex < currentTask.trainingPhases.length) {
        currentTask.trainingPhases[phaseIndex].status = 'completed';
        currentTask.trainingPhases[phaseIndex].progress = 100;
        currentTask.status = currentTask.trainingPhases[phaseIndex].id;
        
        if (phaseIndex + 1 < currentTask.trainingPhases.length) {
          currentTask.trainingPhases[phaseIndex + 1].status = 'in_progress';
          currentTask.trainingPhases[phaseIndex + 1].progress = 50;
        }
        
        trainingTasks.set(taskId, currentTask);
        persistTraining();
        phaseIndex++;
      } else {
        clearInterval(interval);
        currentTask.status = 'completed';
        currentTask.phase = 'completed';
        currentTask.trainingPhases.forEach(p => { p.status = 'completed'; p.progress = 100; });
        trainingTasks.set(taskId, currentTask);
        persistTraining();
        generateTrainingPost(taskId, userId);
      }
    }, 2000);
  }

  /**
   * 训练完成后自动生成动态帖子
   */
  function generateTrainingPost(taskId, userId) {
    const task = trainingTasks.get(taskId);
    if (!task) return;

    const postId = uuidv4();
    const post = {
      id: postId,
      userId,
      taskId,
      type: 'training_result',
      user: {
        name: `🐾 ${task.petName}的训练日记`,
        avatar: '🏋️',
      },
      content: `🎉 ${task.petName}的训练完成！通过DreamBooth+LoRA训练，已学会${task.analysis.detectedActions.length}种动作！\n\n检测到的行为：${task.analysis.detectedActions.map(a => a.icon + a.name).join(' ')}\n习惯标签：${task.analysis.tags.slice(0, 5).join(' ')}\n\n#宠物训练 #AI训练 #${task.petType}`,
      media: task.videos[0]?.url || null,
      likes: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 20),
      shares: Math.floor(Math.random() * 10),
      favorites: Math.floor(Math.random() * 50),
      time: '刚刚',
      features: {
        petType: task.petType,
        breed: task.petType,
        color: '训练中',
        expression: '专注',
        emotion: 'positive',
        tags: task.analysis.tags || [],
        personalityBoost: task.analysis.personalityImpact || {},
      },
      isTrainingPost: true,
      createdAt: new Date().toISOString(),
    };

    if (!trainingPosts.has(userId)) {
      trainingPosts.set(userId, []);
    }
    trainingPosts.get(userId).push(post);
    persistTraining();

    console.log(`📝 训练动态已生成(Cloudinary): ${postId}`);
  }

  /**
   * GET /api/training/status/:taskId
   */
  router.get('/status/:taskId', authMiddleware, (req, res) => {
    const task = trainingTasks.get(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: '训练任务不存在' });
    }
    res.json({ success: true, task });
  });

  /**
   * GET /api/training/history
   * 获取用户训练历史（从持久化数据中查询）
   */
  router.get('/history', authMiddleware, (req, res) => {
    const userId = req.user.id;
    const userTasks = [];
    
    trainingTasks.forEach(task => {
      if (task.userId === userId) {
        userTasks.push({
          id: task.id,
          petName: task.petName,
          petType: task.petType,
          status: task.status,
          videoCount: task.videos?.length || 0,
          actionCount: task.analysis?.detectedActions?.length || 0,
          createdAt: task.createdAt,
          techStack: task.techStack,
        });
      }
    });

    res.json({ success: true, tasks: userTasks });
  });

  /**
   * GET /api/training/posts
   */
  router.get('/posts', authMiddleware, (req, res) => {
    const userId = req.user.id;
    const allPosts = [];

    trainingPosts.forEach((posts) => {
      allPosts.push(...posts);
    });

    const userProfile = recommendationService.getUserProfile(userId);
    const sorted = recommendationService.personalizedSort(allPosts, userId, userProfile);

    res.json({ success: true, posts: sorted });
  });

  /**
   * GET /api/training/analysis/:taskId
   */
  router.get('/analysis/:taskId', authMiddleware, (req, res) => {
    const task = trainingTasks.get(req.params.taskId);
    if (!task || !task.analysis) {
      return res.status(404).json({ error: '分析数据不存在' });
    }
    res.json({ success: true, analysis: task.analysis });
  });

  return router;
}

export default createTrainingRoutes;
