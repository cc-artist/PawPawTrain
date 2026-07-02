/**
 * 任务路由
 * 养宠任务生成器
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { authMiddleware } from '../middleware/auth.js';
import videoAnalyzer from '../services/videoAnalyzer.js';
import taskGenerator from '../services/taskGenerator.js';
import recommendationService from '../services/recommendationService.js';
import cloudinaryService from '../services/cloudinaryService.js';
import storageService from '../services/storageService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 创建任务路由
 * @param {Object} dataStore - 持久化数据存储
 */
function createTasksRoutes(dataStore) {
  const router = Router();

  // 本地临时上传目录
  const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'tasks');
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
      cb(null, `task_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`);
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
  const taskAnalysisResults = new Map();
  const userGeneratedTasks = new Map();
  const userTaskCompletions = new Map();
  const userAdviceHistory = new Map();

  function initMap(target, key) {
    const data = dataStore[key];
    if (data && typeof data === 'object') {
      Object.entries(data).forEach(([k, v]) => { target.set(k, v); });
    }
  }
  initMap(taskAnalysisResults, 'taskAnalysis');
  initMap(userGeneratedTasks, 'userTasks');
  initMap(userTaskCompletions, 'taskCompletions');
  initMap(userAdviceHistory, 'adviceHistory');

  // 持久化方法
  function persistTasks() {
    const toObj = (map) => { const o = {}; map.forEach((v, k) => { o[k] = v; }); return o; };
    storageService.saveTaskAnalysis(toObj(taskAnalysisResults));
    storageService.saveUserTasks(toObj(userGeneratedTasks));
    storageService.saveTaskCompletions(toObj(userTaskCompletions));
    storageService.saveAdviceHistory(toObj(userAdviceHistory));
    dataStore.taskAnalysis = toObj(taskAnalysisResults);
    dataStore.userTasks = toObj(userGeneratedTasks);
    dataStore.taskCompletions = toObj(userTaskCompletions);
    dataStore.adviceHistory = toObj(userAdviceHistory);
  }

  /**
   * POST /api/tasks/analyze
   * 上传视频并分析 → 上传Cloudinary → 返回行为标签
   */
  router.post('/analyze', authMiddleware, upload.array('videos', 3), async (req, res) => {
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

      // 上传到 Cloudinary
      const uploadResults = await Promise.allSettled(
        files.map(f => cloudinaryService.uploadVideo(f.path, userId, 'tasks'))
      );
      const cloudinaryVideos = uploadResults.map((r, i) => {
        if (r.status === 'fulfilled') {
          return { originalName: files[i].originalname, url: r.value.url, publicId: r.value.publicId };
        }
        return { originalName: files[i].originalname, url: null, publicId: null, error: true };
      });

      // 清理本地文件
      files.forEach(f => {
        try { fs.unlinkSync(f.path); } catch (e) { /* ignore */ }
      });

      const videoPaths = files.map(f => f.path);

      // 视频行为分析
      const analysisResult = await videoAnalyzer.analyzeMultipleVideos(
        videoPaths,
        petType || 'dog',
        petName || '宠物'
      );

      const tags = videoAnalyzer.generateTags(analysisResult);
      const advice = taskGenerator.generateAdvice(analysisResult, { name: petName, type: petType });

      // 存储分析结果
      const analysisId = uuidv4();
      const analysisRecord = {
        id: analysisId,
        userId,
        petType: analysisResult.petType,
        petName: analysisResult.petName,
        analysis: analysisResult,
        tags,
        advice,
        videos: cloudinaryVideos,
        createdAt: new Date().toISOString(),
      };

      if (!taskAnalysisResults.has(userId)) {
        taskAnalysisResults.set(userId, []);
      }
      taskAnalysisResults.get(userId).push(analysisRecord);

      if (!userAdviceHistory.has(userId)) {
        userAdviceHistory.set(userId, []);
      }
      userAdviceHistory.get(userId).push({
        analysisId,
        advice,
        timestamp: new Date().toISOString(),
      });

      recommendationService.updatePreferencesFromAnalysis(userId, analysisResult);
      persistTasks();

      res.json({
        success: true,
        analysisId,
        petType: analysisResult.petType,
        petName: analysisResult.petName,
        tags,
        advice,
        behaviorSummary: analysisResult.behaviorSummary,
        detectedActions: analysisResult.detectedActions,
        detectedHabits: analysisResult.detectedHabits,
        message: `分析完成！检测到${tags.length}个特征标签`,
      });
    } catch (error) {
      console.error('任务分析失败:', error);
      res.status(500).json({ error: error.message || '分析失败' });
    }
  });

  /**
   * POST /api/tasks/generate
   */
  router.post('/generate', authMiddleware, (req, res) => {
    try {
      const userId = req.user.id;
      const { analysisId, selectedTags, petType, petName } = req.body;

      if (!analysisId) {
        return res.status(400).json({ error: '缺少分析ID' });
      }

      const userAnalyses = taskAnalysisResults.get(userId) || [];
      const analysis = userAnalyses.find(a => a.id === analysisId);

      if (!analysis) {
        return res.status(404).json({ error: '分析结果不存在，请重新上传视频' });
      }

      const tasks = taskGenerator.generateTasks(
        analysis.analysis,
        { name: petName || analysis.petName, type: petType || analysis.petType },
        selectedTags || []
      );

      const taskBatchId = uuidv4();
      const taskBatch = {
        id: taskBatchId,
        userId,
        analysisId,
        tasks,
        selectedTags: selectedTags || [],
        createdAt: new Date().toISOString(),
        status: 'active',
      };

      if (!userGeneratedTasks.has(userId)) {
        userGeneratedTasks.set(userId, []);
      }
      userGeneratedTasks.get(userId).push(taskBatch);
      persistTasks();

      const localStorageTasks = tasks.map(t => ({
        id: t.id,
        name: t.title,
        nameKey: `task_${t.type}`,
        descKey: `task_${t.type}_desc`,
        description: t.description,
        icon: t.icon,
        points: t.points,
        exp: t.exp,
        category: t.category,
        repeatable: t.repeatable,
      }));

      res.json({
        success: true,
        taskBatchId,
        tasks: localStorageTasks,
        analysisTags: analysis.tags,
        selectedTags: selectedTags || [],
        advice: analysis.advice,
        message: `已生成${tasks.length}个日常养宠任务`,
      });
    } catch (error) {
      console.error('任务生成失败:', error);
      res.status(500).json({ error: error.message || '任务生成失败' });
    }
  });

  /**
   * POST /api/tasks/complete
   */
  router.post('/complete', authMiddleware, (req, res) => {
    try {
      const userId = req.user.id;
      const { taskId, taskBatchId } = req.body;

      if (!taskId) {
        return res.status(400).json({ error: '缺少任务ID' });
      }

      let foundTask = null;
      const userTasks = userGeneratedTasks.get(userId) || [];
      for (const batch of userTasks) {
        if (taskBatchId && batch.id !== taskBatchId) continue;
        const task = batch.tasks.find(t => t.id === taskId);
        if (task) {
          foundTask = task;
          break;
        }
      }

      if (!foundTask) {
        return res.status(404).json({ error: '任务不存在' });
      }

      if (!userTaskCompletions.has(userId)) {
        userTaskCompletions.set(userId, []);
      }
      userTaskCompletions.get(userId).push({
        taskId,
        taskName: foundTask.title,
        points: foundTask.points,
        exp: foundTask.exp,
        completedAt: new Date().toISOString(),
      });
      persistTasks();

      res.json({
        success: true,
        task: {
          id: foundTask.id,
          title: foundTask.title,
          points: foundTask.points,
          exp: foundTask.exp,
        },
        message: `任务完成！获得 ${foundTask.points} 积分和 ${foundTask.exp} 经验`,
      });
    } catch (error) {
      console.error('任务完成记录失败:', error);
      res.status(500).json({ error: error.message || '记录失败' });
    }
  });

  /**
   * GET /api/tasks/current
   */
  router.get('/current', authMiddleware, (req, res) => {
    const userId = req.user.id;
    const allBatches = userGeneratedTasks.get(userId) || [];
    const activeBatch = allBatches.filter(b => b.status === 'active').pop();
    
    if (!activeBatch) {
      return res.json({ success: true, tasks: [], message: '暂无活跃任务' });
    }

    res.json({
      success: true,
      taskBatchId: activeBatch.id,
      tasks: activeBatch.tasks,
      createdAt: activeBatch.createdAt,
    });
  });

  /**
   * GET /api/tasks/history
   */
  router.get('/history', authMiddleware, (req, res) => {
    const userId = req.user.id;
    const completions = userTaskCompletions.get(userId) || [];
    const analyses = taskAnalysisResults.get(userId) || [];

    res.json({
      success: true,
      completions,
      totalPoints: completions.reduce((sum, c) => sum + c.points, 0),
      totalExp: completions.reduce((sum, c) => sum + c.exp, 0),
      analysisCount: analyses.length,
    });
  });

  /**
   * GET /api/tasks/advice
   */
  router.get('/advice', authMiddleware, (req, res) => {
    const userId = req.user.id;
    const adviceList = userAdviceHistory.get(userId) || [];
    const latest = adviceList[adviceList.length - 1];

    res.json({
      success: true,
      latestAdvice: latest?.advice || [],
      adviceHistory: adviceList.slice(-5),
    });
  });

  /**
   * GET /api/tasks/feedback-loop
   */
  router.get('/feedback-loop', authMiddleware, (req, res) => {
    const userId = req.user.id;
    const analyses = taskAnalysisResults.get(userId) || [];
    const completions = userTaskCompletions.get(userId) || [];
    const adviceList = userAdviceHistory.get(userId) || [];

    if (analyses.length === 0) {
      return res.json({
        success: true,
        feedback: null,
        message: '请先上传视频进行分析，启动观察循环',
      });
    }

    const latestAnalysis = analyses[analyses.length - 1];
    const previousData = {
      completedTasks: completions,
      followedAdvice: adviceList.slice(-1)[0]?.advice || [],
    };

    const feedback = taskGenerator.generateFeedbackLoop(
      latestAnalysis.analysis,
      previousData
    );

    res.json({
      success: true,
      feedback,
      cycleCount: analyses.length,
      totalTasksCompleted: completions.length,
      nextStep: '建议3天后再次上传视频进行新一轮观察',
    });
  });

  return router;
}

export default createTasksRoutes;
