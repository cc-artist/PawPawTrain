import { Router } from 'express';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.env') });

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pawtrain-secret-key';

// 简单的用户数据库（内存存储，实际项目应使用数据库）
const users = new Map();

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', (req, res) => {
  const { username, password, email } = req.body;
  
  if (!username && !email) {
    return res.status(400).json({ error: '请提供用户名或邮箱' });
  }

  // 简化版：自动注册/登录
  const userId = username || email;
  
  if (!users.has(userId)) {
    users.set(userId, {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      username: username || email.split('@')[0],
      email: email || `${username}@pawtrain.com`,
      points: 500,
      createdAt: new Date().toISOString()
    });
  }

  const user = users.get(userId);
  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      points: user.points,
      avatar: null
    }
  });
});

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email) {
    return res.status(400).json({ error: '请提供用户名和邮箱' });
  }

  if (users.has(username) || users.has(email)) {
    return res.status(409).json({ error: '用户已存在' });
  }

  const user = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    username,
    email,
    points: 500,
    createdAt: new Date().toISOString()
  };

  users.set(username, user);
  users.set(email, user);

  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      points: user.points,
      avatar: null
    }
  });
});

/**
 * GET /api/auth/profile
 * 获取用户信息（需要认证）
 */
router.get('/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    let user = users.get(decoded.username) || users.get(decoded.email);
    if (!user) {
      user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        points: 500
      };
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        points: user.points,
        avatar: user.avatar || null
      }
    });
  } catch (error) {
    return res.status(401).json({ error: '认证令牌无效' });
  }
});

/**
 * POST /api/auth/wechat
 * 微信登录（简化版）
 */
router.post('/wechat', (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: '缺少微信授权码' });
  }

  // 简化版：生成模拟用户
  const mockUserId = 'wx_' + Date.now().toString(36);
  const user = {
    id: mockUserId,
    username: '微信用户',
    email: `${mockUserId}@wechat.pawtrain.com`,
    points: 500,
    createdAt: new Date().toISOString()
  };

  users.set(mockUserId, user);

  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      points: user.points,
      avatar: null
    }
  });
});

export default router;
