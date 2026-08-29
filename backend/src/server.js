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

    // ====== 🔧 2026-08-29「只有声音没画面」根因修复：
    // 前端 <video> 的 src 是同源 /api/media-proxy?url=...（无 .mp4 扩展名），
    // 当上游 Cloudinary 偶尔返回「application/octet-stream / binary/octet-stream / 空」这类不明确 MIME 时，
    // Chromium MIME sniff 会优先把它当成音频（只解 audio track → 播放出来就是 "只有声音 videoWidth=0"）。
    // 修复：按真实目标 URL 的扩展名 + /video/upload/ 路径特征，强制指定准确 MIME（video/mp4、image/webp…），
    // 让浏览器 demuxer 走视频分支 → videoWidth/Height 立刻有值。
    const pathname = urlObj.pathname || '';
    const isVideoPath = pathname.includes('/video/upload/') || /\.(mp4|mov|webm|ogg|m4v|mkv|3gp)(\?|$)/i.test(pathname);
    const isImagePath = pathname.includes('/image/upload/') || /\.(jpg|jpeg|png|gif|webp|avif)(\?|$)/i.test(pathname);
    let fixedContentType = contentType || '';
    if (isVideoPath) {
      // 视频扩展名到 MIME 的精确映射
      const ext = (pathname.match(/\.(mp4|mov|webm|ogg|m4v|mkv|3gp)(\?|$)/i) || [])[1]?.toLowerCase() || 'mp4';
      const mimeMap = { mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', ogg: 'video/ogg', m4v: 'video/x-m4v', mkv: 'video/x-matroska', '3gp': 'video/3gpp' };
      fixedContentType = mimeMap[ext] || 'video/mp4';
    } else if (isImagePath) {
      const ext = (pathname.match(/\.(jpg|jpeg|png|gif|webp|avif)(\?|$)/i) || [])[1]?.toLowerCase() || 'jpeg';
      const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif' };
      fixedContentType = mimeMap[ext] || 'image/jpeg';
    } else if (!fixedContentType) {
      fixedContentType = 'application/octet-stream';
    }

    if (range && response.status === 206) {
      res.status(206);
      res.set('Content-Range', response.headers['content-range']);
    } else {
      res.status(200);
    }

    res.set('Content-Type', fixedContentType); // 🔧 用补全后的 MIME（不用上游的模糊值）
    if (contentLength) res.set('Content-Length', contentLength);
    res.set('Accept-Ranges', 'bytes');
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('Access-Control-Allow-Origin', '*');
    // 🔧 强制 inline（告诉浏览器直接用 video/img element 渲染，不要弹下载对话框）
    res.set('Content-Disposition', 'inline');

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
