/**
 * 任务路由
 * 养宠任务生成器
 * 
 * 流程：
 * 1. 用户上传1-3个视频
 * 2. 自动抓取宠物生活习惯和特殊癖好 → 形成标签
 * 3. 用户勾选/删除标签
 * 4. 根据勾选数据生成日常任务 → 推送到首页
 * 5. 用户完成任务获得积分奖励
 * 6. "观察→建议→执行→再观察"闭环
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// 配置 multer 用于视频上传
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

// 内存存储
const taskAnalysisResults = new Map(); // 分析结果
const userGeneratedTasks = new Map();  // 用户生成的任务
const userTaskCompletions = new Map(); // 任务完成记录
const userAdviceHistory = new Map();   // 建议历史

/**
 * POST /api/tasks/analyze
 * 上传视频并分析，返回行为标签供用户选择
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

    const videoPaths = files.map(f => f.path);

    // 视频行为分析
    const analysisResult = await videoAnalyzer.analyzeMultipleVideos(
      videoPaths,
      petType || 'dog',
      petName || '宠物'
    );

    // 生成标签（行为标签 + 习惯标签）
    const tags = videoAnalyzer.generateTags(analysisResult);

    // 生成养宠建议（AI Prompt模板）
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
      videos: files.map(f => ({
        originalName: f.originalname,
        path: f.path,
      })),
      createdAt: new Date().toISOString(),
    };

    if (!taskAnalysisResults.has(userId)) {
      taskAnalysisResults.set(userId, []);
    }
    taskAnalysisResults.get(userId).push(analysisRecord);

    // 存储建议历史
    if (!userAdviceHistory.has(userId)) {
      userAdviceHistory.set(userId, []);
    }
    userAdviceHistory.get(userId).push({
      analysisId,
      advice,
      timestamp: new Date().toISOString(),
    });

    // 更新推荐系统的用户偏好
    recommendationService.updatePreferencesFromAnalysis(userId, analysisResult);

    res.json({
      success: true,
      analysisId,
      petType: analysisResult.petType,
      petName: analysisResult.petName,
      tags, // 供用户勾选/删除
      advice, // AI生成的养宠建议
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
 * 根据用户勾选的标签生成日常任务
 */
router.post('/generate', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    const { analysisId, selectedTags, petType, petName } = req.body;

    if (!analysisId) {
      return res.status(400).json({ error: '缺少分析ID' });
    }

    // 获取分析结果
    const userAnalyses = taskAnalysisResults.get(userId) || [];
    const analysis = userAnalyses.find(a => a.id === analysisId);

    if (!analysis) {
      return res.status(404).json({ error: '分析结果不存在，请重新上传视频' });
    }

    // 根据用户选择的标签生成任务
    const tasks = taskGenerator.generateTasks(
      analysis.analysis,
      { name: petName || analysis.petName, type: petType || analysis.petType },
      selectedTags || []
    );

    // 存储生成的任务
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

    // 同时更新到localStorage可读取的格式（通过API返回）
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
 * 完成任务并获取积分奖励
 */
router.post('/complete', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId, taskBatchId } = req.body;

    if (!taskId) {
      return res.status(400).json({ error: '缺少任务ID' });
    }

    // 查找任务
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

    // 记录完成
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
 * 获取用户当前活跃任务
 */
router.get('/current', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const allBatches = userGeneratedTasks.get(userId) || [];
  
  // 获取最近的任务批次
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
 * 获取任务完成历史
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
 * 获取最新的AI养宠建议
 */
router.get('/advice', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const adviceList = userAdviceHistory.get(userId) || [];
  const latest = adviceList[adviceList.length - 1];

  res.json({
    success: true,
    latestAdvice: latest?.advice || [],
    adviceHistory: adviceList.slice(-5), // 最近5条
  });
});

/**
 * GET /api/tasks/feedback-loop
 * 获取"观察→建议→执行→再观察"闭环反馈
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

export default router;
