import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import storageService from './services/storageService.js';
import { initPreferences, setPersistCallback } from './services/recommendationService.js';
import createAuthRoutes from './routes/auth.js';
import createPetRoutes from './routes/pet.js';
import createTrainingRoutes from './routes/training.js';
import createTasksRoutes from './routes/tasks.js';
import createPostsRoutes from './routes/posts.js';
import createWorkshopRoutes from './routes/workshop.js';
import createAdminRoutes from './routes/admin.js';
import createDatasetRoutes from './routes/dataset.js';
import createGameRoutes from './routes/game.js';

// 加载环境变量（兼容 Vercel 和本地环境）
try {
  const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
  dotenv.config({ path: envPath });
} catch {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 8082;

// ========== 启动时从磁盘恢复所有数据 ==========
console.log('🔄 PawPawTrain 后端启动中...');
const persistedData = storageService.loadAll();

// 初始化推荐系统用户画像（从持久化数据恢复）
initPreferences(persistedData.userPreferences);

// 将持久化数据注入到路由创建函数
// 路由内部使用这些数据初始化内存Map
const dataStore = {
  users: persistedData.users,
  pets: persistedData.pets,
  trainingTasks: persistedData.trainingTasks,
  trainingPosts: persistedData.trainingPosts,
  taskAnalysis: persistedData.taskAnalysis,
  userTasks: persistedData.userTasks,
  taskCompletions: persistedData.taskCompletions,
  adviceHistory: persistedData.adviceHistory,
  posts: persistedData.posts,
  userPreferences: persistedData.userPreferences,
  workshopCreations: persistedData.workshopCreations || {},
  auditLogs: persistedData.auditLogs || [],
  gameRecords: persistedData.gameRecords || [],
};

// 设置推荐系统的持久化回调（当推荐数据变更时同步到 dataStore）
setPersistCallback((prefsObj) => {
  dataStore.userPreferences = prefsObj;
});

// 中间件
app.use(cors({
  origin: [
    'http://localhost:3001', 'http://localhost:5173', 'http://127.0.0.1:3001',
    'https://pawpawtrain.vercel.app', 'https://paw-paw-train.vercel.app',
  ],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// 路由（传入持久化数据存储）
app.use('/api/auth', createAuthRoutes(dataStore));
app.use('/api/pet', createPetRoutes(dataStore));
app.use('/api/pets', createPetRoutes(dataStore));
app.use('/api/training', createTrainingRoutes(dataStore));
app.use('/api/tasks', createTasksRoutes(dataStore));
app.use('/api/posts', createPostsRoutes(dataStore));
app.use('/api/workshop', createWorkshopRoutes(dataStore));
app.use('/api/admin', createAdminRoutes(dataStore));
app.use('/api/admin/dataset', createDatasetRoutes(dataStore));
app.use('/api/game', createGameRoutes(dataStore));

// ========== 媒体代理：绕过浏览器代理限制，由后端直接拉取 Cloudinary/Unsplash 等外部资源 ==========
app.get('/api/media-proxy', async (req, res) => {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    // 安全校验：只允许白名单域名
    const allowedHosts = [
      'res.cloudinary.com',
      'images.unsplash.com',
      'plus.unsplash.com',
    ];
    let urlObj;
    try {
      urlObj = new URL(targetUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid URL' });
    }
    if (!allowedHosts.some(h => urlObj.hostname === h || urlObj.hostname.endsWith('.' + h))) {
      return res.status(403).json({ error: 'Host not allowed' });
    }

    const range = req.headers.range;
    const response = await axios.get(targetUrl, {
      responseType: 'stream',
      timeout: 30000,
      headers: range ? { Range: range } : {},
      validateStatus: () => true,
    });

    if (response.status >= 400) {
      response.data.destroy();
      return res.status(response.status).json({ error: 'Upstream error' });
    }

    const contentType = response.headers['content-type'];
    const contentLength = response.headers['content-length'];

    if (range && response.status === 206) {
      res.status(206);
      res.set('Content-Range', response.headers['content-range']);
    } else {
      res.status(200);
    }

    if (contentType) res.set('Content-Type', contentType);
    if (contentLength) res.set('Content-Length', contentLength);
    res.set('Accept-Ranges', 'bytes');
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('Access-Control-Allow-Origin', '*');

    response.data.pipe(res);

    req.on('close', () => {
      response.data.destroy();
    });
  } catch (err) {
    console.error('[MediaProxy] Error:', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Media proxy error' });
    }
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: 'JSON file persistence',
    cloudStorage: 'Cloudinary',
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// ========== 定期持久化：每30秒自动保存所有数据 ==========
// Vercel serverless 环境不运行持久化定时器
if (!process.env.VERCEL) {
  setInterval(() => {
    storageService.saveUsers(dataStore.users);
    storageService.savePets(dataStore.pets);
    storageService.saveTrainingTasks(dataStore.trainingTasks);
    storageService.saveTrainingPosts(dataStore.trainingPosts);
    storageService.saveTaskAnalysis(dataStore.taskAnalysis);
    storageService.saveUserTasks(dataStore.userTasks);
    storageService.saveTaskCompletions(dataStore.taskCompletions);
    storageService.saveAdviceHistory(dataStore.adviceHistory);
    storageService.savePosts(dataStore.posts);
    storageService.saveUserPreferences(dataStore.userPreferences);
    storageService.saveWorkshopCreations(dataStore.workshopCreations);
    storageService.saveAuditLogs(dataStore.auditLogs);
    storageService.saveGameRecords(dataStore.gameRecords);
  }, 30000);
}

// 非 Vercel 环境下监听端口（本地开发）
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✅ PawPawTrain 后端服务已启动，端口: ${PORT}`);
    console.log(`📡 API 地址: http://localhost:${PORT}/api`);
    console.log(`🛡️ Admin 管理后台: http://localhost:${PORT}/api/admin`);
    console.log(`☁️ Cloudinary 云存储: 已配置`);
    console.log(`💾 JSON 持久化: 已启用 (每30秒自动保存)`);
  });
}

export default app;
