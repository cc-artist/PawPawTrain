import { Router } from 'express';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import storageService from '../services/storageService.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'pawtrain-secret-key';

/**
 * 创建认证路由
 * @param {Object} dataStore - 持久化数据存储（由 server.js 注入）
 */
function createAuthRoutes(dataStore) {
  const router = Router();

  // 从持久化数据初始化用户 Map
  const users = new Map();
  if (dataStore.users && typeof dataStore.users === 'object') {
    Object.entries(dataStore.users).forEach(([key, user]) => {
      users.set(key, user);
    });
  }

  // 保存用户数据到磁盘
  function persistUsers() {
    const obj = {};
    users.forEach((value, key) => { obj[key] = value; });
    storageService.saveUsers(obj);
    dataStore.users = obj;
  }

  /**
   * POST /api/auth/login
   * 用户登录（无密码模式，自动注册）
   */
  router.post('/login', (req, res) => {
    const { username, password, email } = req.body;
    
    if (!username && !email) {
      return res.status(400).json({ error: '请提供用户名或邮箱' });
    }

    const userId = username || email;
    
    if (!users.has(userId)) {
      users.set(userId, {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        username: username || email.split('@')[0],
        email: email || `${username}@pawtrain.com`,
        points: 500,
        createdAt: new Date().toISOString()
      });
      persistUsers();
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
    persistUsers();

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
        // token有效但用户不在内存（可能服务重启后从其他设备登录）
        // 尝试从持久化数据重建
        const savedData = dataStore.users || {};
        user = savedData[decoded.username] || savedData[decoded.email];
        
        if (user) {
          users.set(decoded.username, user);
          users.set(decoded.email, user);
        } else {
          // 完全重建用户（数据恢复）
          user = {
            id: decoded.id,
            username: decoded.username,
            email: decoded.email,
            points: 500,
            createdAt: new Date().toISOString()
          };
          users.set(decoded.username, user);
          users.set(decoded.email, user);
          persistUsers();
        }
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

    const mockUserId = 'wx_' + Date.now().toString(36);
    const user = {
      id: mockUserId,
      username: '微信用户',
      email: `${mockUserId}@wechat.pawtrain.com`,
      points: 500,
      createdAt: new Date().toISOString()
    };

    users.set(mockUserId, user);
    persistUsers();

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

  return router;
}

export default createAuthRoutes;
