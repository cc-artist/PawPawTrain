import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import petRoutes from './routes/pet.js';
import trainingRoutes from './routes/training.js';
import tasksRoutes from './routes/tasks.js';
import postsRoutes from './routes/posts.js';

// 加载环境变量
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const app = express();
const PORT = process.env.PORT || 8082;

// 中间件
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:5173', 'http://127.0.0.1:3001'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/pet', petRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/posts', postsRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`✅ PawPawTrain 后端服务已启动，端口: ${PORT}`);
  console.log(`📡 API 地址: http://localhost:${PORT}/api`);
  console.log(`🎨 图像模型: ${process.env.DEFAULT_IMAGE_MODEL || 'doubao'}`);
});
