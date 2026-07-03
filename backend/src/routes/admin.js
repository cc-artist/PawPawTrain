import express from 'express';
import { adminAuthMiddleware, adminLogin, adminVerify, addAuditLog, getAuditLogs, getAuditLogCount, getRawAuditLogs, restoreAuditLogs } from '../middleware/adminAuth.js';
import bcrypt from 'bcryptjs';
import storageService from '../services/storageService.js';

export default function createAdminRoutes(dataStore) {
  const router = express.Router();

  // Get admin password hash from env or use default
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || null;

  // ========== 从持久化数据恢复审计日志 ==========
  restoreAuditLogs(dataStore.auditLogs || []);

  // ========== 持久化辅助函数 ==========
  function persistUsers() {
    storageService.saveUsers(dataStore.users);
  }
  function persistPets() {
    storageService.savePets(dataStore.pets);
  }
  function persistPosts() {
    storageService.savePosts(dataStore.posts);
  }
  function persistTraining() {
    storageService.saveTrainingTasks(dataStore.trainingTasks);
    storageService.saveTrainingPosts(dataStore.trainingPosts);
  }
  function persistWorkshop() {
    storageService.saveWorkshopCreations(dataStore.workshopCreations);
  }
  function syncAndPersistAuditLogs() {
    dataStore.auditLogs = getRawAuditLogs();
    storageService.saveAuditLogs(dataStore.auditLogs);
  }
  function persistAll() {
    persistUsers();
    persistPets();
    persistPosts();
    persistTraining();
    persistWorkshop();
    syncAndPersistAuditLogs();
  }

  // ========== PUBLIC: Login ==========
  router.post('/login', (req, res) => {
    adminLogin(req, res, adminPasswordHash);
    // Sync audit logs after login attempt
    dataStore.auditLogs = getRawAuditLogs();
    storageService.saveAuditLogs(dataStore.auditLogs);
  });

  // ========== PROTECTED: Verify token ==========
  router.get('/verify', adminAuthMiddleware, adminVerify);

  // ========== PROTECTED: Dashboard Stats ==========
  router.get('/dashboard', adminAuthMiddleware, (req, res) => {
    try {
      const users = dataStore.users || {};
      const pets = dataStore.pets || {};
      const posts = dataStore.posts || [];
      const trainingTasks = dataStore.trainingTasks || {};
      const trainingPosts = dataStore.trainingPosts || {};
      const workshopCreations = dataStore.workshopCreations || {};
      const taskCompletions = dataStore.taskCompletions || [];
      const userTasks = dataStore.userTasks || {};

      const userList = Object.values(users);
      const petList = Object.values(pets);
      const trainingTaskList = Object.values(trainingTasks);
      const workshopCreationList = Object.values(workshopCreations);

      // Compute stats
      const totalUsers = userList.length;
      const totalPets = petList.length;
      const totalPosts = posts.length + (() => {
        let count = 0;
        Object.values(trainingPosts).forEach(arr => {
          if (Array.isArray(arr)) count += arr.length;
        });
        return count;
      })();
      const totalTrainingTasks = trainingTaskList.length;
      const totalWorkshopCreations = (() => {
        let count = 0;
        Object.values(workshopCreations).forEach(arr => {
          if (Array.isArray(arr)) count += arr.length;
        });
        return count;
      })();
      const totalTaskCompletions = taskCompletions.length;

      // Active users today (users created today or who have recent activity)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeToday = userList.filter(u => {
        return u.lastActive && new Date(u.lastActive) >= today;
      }).length;

      // Points stats
      const totalPoints = userList.reduce((sum, u) => sum + (u.points || 0), 0);
      const avgPoints = totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0;

      res.json({
        success: true,
        stats: {
          users: { total: totalUsers, activeToday },
          pets: { total: totalPets },
          posts: { total: totalPosts },
          training: { totalTasks: totalTrainingTasks, totalCompletions: totalTaskCompletions },
          workshop: { totalCreations: totalWorkshopCreations },
          points: { total: totalPoints, average: avgPoints }
        },
        serverTime: new Date().toISOString()
      });
    } catch (err) {
      console.error('Dashboard error:', err);
      res.status(500).json({ success: false, error: 'Failed to load dashboard' });
    }
  });

  // ========== PROTECTED: User Management ==========
  router.get('/users', adminAuthMiddleware, (req, res) => {
    try {
      const { page = 1, limit = 20, search = '', status = 'all' } = req.query;
      const users = dataStore.users || {};
      let userList = Object.values(users);

      // Search filter
      if (search) {
        const q = search.toLowerCase();
        userList = userList.filter(u =>
          (u.username && u.username.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.id && u.id.toLowerCase().includes(q))
        );
      }

      // Status filter
      if (status === 'banned') {
        userList = userList.filter(u => u.isBanned);
      } else if (status === 'active') {
        userList = userList.filter(u => !u.isBanned);
      }

      // Sort by creation date
      userList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      const total = userList.length;
      const paged = userList.slice((page - 1) * limit, page * limit);

      // Sanitize sensitive data
      const sanitized = paged.map(u => ({
        id: u.id,
        username: u.username || 'Unknown',
        email: u.email || '',
        points: u.points || 0,
        createdAt: u.createdAt || null,
        lastActive: u.lastActive || null,
        isBanned: !!u.isBanned,
        petCount: Object.values(dataStore.pets || {}).filter(p => p.ownerId === u.id).length,
        postCount: (dataStore.posts || []).filter(p => p.userId === u.id || p.ownerId === u.id).length
      }));

      res.json({
        success: true,
        users: sanitized,
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) }
      });
    } catch (err) {
      console.error('Users list error:', err);
      res.status(500).json({ success: false, error: 'Failed to load users' });
    }
  });

  router.get('/users/:userId', adminAuthMiddleware, (req, res) => {
    try {
      const users = dataStore.users || {};
      const user = users[req.params.userId];
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const pets = Object.values(dataStore.pets || {}).filter(p => p.ownerId === user.id);
      const userPosts = (dataStore.posts || []).filter(p => p.userId === user.id || p.ownerId === user.id);

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username || 'Unknown',
          email: user.email || '',
          points: user.points || 0,
          createdAt: user.createdAt || null,
          lastActive: user.lastActive || null,
          isBanned: !!user.isBanned,
          pets: pets.map(p => ({ id: p.id, name: p.name, type: p.type, level: p.level })),
          posts: userPosts.length
        }
      });
    } catch (err) {
      console.error('User detail error:', err);
      res.status(500).json({ success: false, error: 'Failed to load user' });
    }
  });

  router.post('/users/:userId/ban', adminAuthMiddleware, (req, res) => {
    try {
      const users = dataStore.users || {};
      const user = users[req.params.userId];
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      user.isBanned = true;
      user.bannedAt = new Date().toISOString();
      user.banReason = req.body.reason || 'Administrative action';
      addAuditLog('USER_BANNED', { userId: user.id, reason: user.banReason }, req.admin.username);
      persistUsers();
      syncAndPersistAuditLogs();
      res.json({ success: true, message: 'User banned successfully' });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to ban user' });
    }
  });

  router.post('/users/:userId/unban', adminAuthMiddleware, (req, res) => {
    try {
      const users = dataStore.users || {};
      const user = users[req.params.userId];
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      user.isBanned = false;
      user.bannedAt = null;
      user.banReason = null;
      addAuditLog('USER_UNBANNED', { userId: user.id }, req.admin.username);
      persistUsers();
      syncAndPersistAuditLogs();
      res.json({ success: true, message: 'User unbanned successfully' });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to unban user' });
    }
  });

  router.put('/users/:userId/points', adminAuthMiddleware, (req, res) => {
    try {
      const { points, operation = 'set' } = req.body; // set, add, subtract
      const users = dataStore.users || {};
      const user = users[req.params.userId];
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      const oldPoints = user.points || 0;
      if (operation === 'add') {
        user.points = oldPoints + (Number(points) || 0);
      } else if (operation === 'subtract') {
        user.points = Math.max(0, oldPoints - (Number(points) || 0));
      } else {
        user.points = Number(points) || 0;
      }
      addAuditLog('USER_POINTS_UPDATED', {
        userId: user.id, oldPoints, newPoints: user.points, operation
      }, req.admin.username);
      persistUsers();
      syncAndPersistAuditLogs();
      res.json({ success: true, message: 'Points updated', points: user.points });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to update points' });
    }
  });

  // ========== PROTECTED: Pet Management ==========
  router.get('/pets', adminAuthMiddleware, (req, res) => {
    try {
      const { page = 1, limit = 20, type = '', search = '' } = req.query;
      const pets = dataStore.pets || {};
      let petList = Object.values(pets);

      if (type) {
        petList = petList.filter(p => p.type === type);
      }
      if (search) {
        const q = search.toLowerCase();
        petList = petList.filter(p =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.type && p.type.toLowerCase().includes(q))
        );
      }

      petList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      const total = petList.length;
      const paged = petList.slice((page - 1) * limit, page * limit);

      // Pre-collect all training data for efficient lookup
      const allTrainingTasks = Object.values(dataStore.trainingTasks || {});
      const allTaskCompletions = Object.values(dataStore.taskCompletions || {});
      const users = dataStore.users || {};

      const sanitized = paged.map(p => {
        // 🔗 获取主人完整信息
        const owner = users[p.ownerId] || {};

        // 📊 统计该宠物的训练数据
        const petTasks = allTrainingTasks.filter(
          t => t.petName === p.name && t.userId === p.ownerId
        );
        const petTaskIds = new Set(petTasks.map(t => t.id));

        // 训练帖子统计
        const allTrainingPosts = dataStore.trainingPosts || {};
        let postCount = 0;
        const ownerPosts = allTrainingPosts[p.ownerId];
        if (Array.isArray(ownerPosts)) {
          postCount = ownerPosts.filter(post => petTaskIds.has(post.taskId)).length;
        }

        // 任务完成统计
        const completionCount = allTaskCompletions.filter(c => petTaskIds.has(c.taskId)).length;

        // 任务状态分布
        const taskStatusCounts = { pending: 0, training: 0, completed: 0, failed: 0 };
        petTasks.forEach(t => {
          const status = t.status || 'pending';
          if (taskStatusCounts[status] !== undefined) taskStatusCounts[status]++;
        });

        return {
          id: p.id,
          name: p.name || 'Unnamed',
          type: p.type || 'unknown',
          emoji: p.emoji || '🐾',
          level: p.level || 1,
          health: p.health || 100,
          hunger: p.hunger || 100,
          energy: p.energy || 100,
          joy: p.joy || 100,
          affection: p.affection || 0,
          intimacy: p.intimacy || 0,
          discipline: p.discipline || 0,
          exploration: p.exploration || 0,
          points: p.points || 0,
          photoCount: p.photoCount || 0,
          badges: p.badges || [],
          learnedSkills: p.learnedSkills || [],
          color: p.color || null,
          ownerId: p.ownerId || 'unknown',
          ownerName: p.ownerName || 'Unknown',
          owner: {
            username: owner.username || 'Unknown',
            email: owner.email || '',
            points: owner.points || 0,
            isBanned: !!owner.isBanned,
            createdAt: owner.createdAt || null,
            lastActive: owner.lastActive || null
          },
          avatar: p.avatar || null,
          imageUrl: p.imageUrl || null,
          loraStatus: p.loraStatus || null,
          createdAt: p.createdAt || null,
          artStyle: p.artStyle || null,
          trainingStats: {
            taskCount: petTasks.length,
            completionCount,
            postCount,
            taskStatusCounts,
            totalTrainingPosts: postCount
          }
        };
      });

      res.json({
        success: true,
        pets: sanitized,
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) }
      });
    } catch (err) {
      console.error('Pets list error:', err);
      res.status(500).json({ success: false, error: 'Failed to load pets' });
    }
  });

  router.get('/pets/:petId', adminAuthMiddleware, (req, res) => {
    try {
      const pets = dataStore.pets || {};
      const pet = pets[req.params.petId];
      if (!pet) {
        return res.status(404).json({ success: false, error: 'Pet not found' });
      }
      res.json({ success: true, pet });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to load pet' });
    }
  });

  router.delete('/pets/:petId', adminAuthMiddleware, (req, res) => {
    try {
      const pets = dataStore.pets || {};
      const pet = pets[req.params.petId];
      if (!pet) {
        return res.status(404).json({ success: false, error: 'Pet not found' });
      }
      delete pets[req.params.petId];
      addAuditLog('PET_DELETED', { petId: req.params.petId, petName: pet.name }, req.admin.username);
      persistPets();
      syncAndPersistAuditLogs();
      res.json({ success: true, message: 'Pet deleted successfully' });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to delete pet' });
    }
  });

  router.post('/pets/:petId/stats', adminAuthMiddleware, (req, res) => {
    try {
      const pets = dataStore.pets || {};
      const pet = pets[req.params.petId];
      if (!pet) {
        return res.status(404).json({ success: false, error: 'Pet not found' });
      }
      const { health, hunger, energy, joy, affection, level } = req.body;
      const oldStats = { health: pet.health, hunger: pet.hunger, energy: pet.energy, joy: pet.joy, level: pet.level };
      if (health !== undefined) pet.health = Number(health);
      if (hunger !== undefined) pet.hunger = Number(hunger);
      if (energy !== undefined) pet.energy = Number(energy);
      if (joy !== undefined) pet.joy = Number(joy);
      if (affection !== undefined) pet.affection = Number(affection);
      if (level !== undefined) pet.level = Number(level);
      addAuditLog('PET_STATS_UPDATED', { petId: pet.id, oldStats, newStats: req.body }, req.admin.username);
      persistPets();
      syncAndPersistAuditLogs();
      res.json({ success: true, message: 'Pet stats updated', pet: { id: pet.id, name: pet.name, ...req.body } });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to update pet stats' });
    }
  });

  // ========== PROTECTED: Post/Content Moderation ==========
  router.get('/posts', adminAuthMiddleware, (req, res) => {
    try {
      const { page = 1, limit = 20, status = 'all', search = '' } = req.query;
      let allPosts = [];

      // Collect all posts
      const feedPosts = (dataStore.posts || []).map(p => ({ ...p, source: 'feed' }));
      const trainingPostsObj = dataStore.trainingPosts || {};
      const trainingPosts = [];
      Object.values(trainingPostsObj).forEach(arr => {
        if (Array.isArray(arr)) {
          arr.forEach(p => trainingPosts.push({ ...p, source: 'training' }));
        }
      });
      allPosts = [...feedPosts, ...trainingPosts];

      if (status !== 'all') {
        // Map status to actual fields
        if (status === 'pending') {
          allPosts = allPosts.filter(p => p.status === 'pending' || !p.status);
        } else if (status === 'approved') {
          allPosts = allPosts.filter(p => p.status === 'approved');
        } else if (status === 'rejected') {
          allPosts = allPosts.filter(p => p.status === 'rejected');
        }
      }

      if (search) {
        const q = search.toLowerCase();
        allPosts = allPosts.filter(p =>
          (p.content && p.content.toLowerCase().includes(q)) ||
          (p.userName && p.userName.toLowerCase().includes(q))
        );
      }

      allPosts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      const total = allPosts.length;
      const paged = allPosts.slice((page - 1) * limit, page * limit);

      res.json({
        success: true,
        posts: paged,
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) }
      });
    } catch (err) {
      console.error('Posts list error:', err);
      res.status(500).json({ success: false, error: 'Failed to load posts' });
    }
  });

  router.post('/posts/:postId/approve', adminAuthMiddleware, (req, res) => {
    try {
      const allPosts = [
        ...(dataStore.posts || []),
        ...flattenTrainingPosts(dataStore.trainingPosts || {})
      ];
      const post = allPosts.find(p => p.id === req.params.postId);
      if (!post) {
        return res.status(404).json({ success: false, error: 'Post not found' });
      }
      post.status = 'approved';
      post.approvedAt = new Date().toISOString();
      post.approvedBy = req.admin.username;
      addAuditLog('POST_APPROVED', { postId: post.id }, req.admin.username);
      persistPosts();
      syncAndPersistAuditLogs();
      res.json({ success: true, message: 'Post approved' });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to approve post' });
    }
  });

  router.post('/posts/:postId/reject', adminAuthMiddleware, (req, res) => {
    try {
      const allPosts = [
        ...(dataStore.posts || []),
        ...flattenTrainingPosts(dataStore.trainingPosts || {})
      ];
      const post = allPosts.find(p => p.id === req.params.postId);
      if (!post) {
        return res.status(404).json({ success: false, error: 'Post not found' });
      }
      post.status = 'rejected';
      post.rejectedAt = new Date().toISOString();
      post.rejectedBy = req.admin.username;
      post.rejectReason = req.body.reason || 'Content violation';
      addAuditLog('POST_REJECTED', { postId: post.id, reason: post.rejectReason }, req.admin.username);
      persistPosts();
      syncAndPersistAuditLogs();
      res.json({ success: true, message: 'Post rejected' });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to reject post' });
    }
  });

  router.delete('/posts/:postId', adminAuthMiddleware, (req, res) => {
    try {
      // Remove from feed posts
      const posts = dataStore.posts || [];
      const idx = posts.findIndex(p => p.id === req.params.postId);
      if (idx !== -1) {
        posts.splice(idx, 1);
        addAuditLog('POST_DELETED', { postId: req.params.postId, source: 'feed' }, req.admin.username);
        persistPosts();
        syncAndPersistAuditLogs();
        return res.json({ success: true, message: 'Post deleted' });
      }
      // Check training posts
      const trainingPosts = dataStore.trainingPosts || {};
      if (trainingPosts[req.params.postId]) {
        delete trainingPosts[req.params.postId];
        addAuditLog('POST_DELETED', { postId: req.params.postId, source: 'training' }, req.admin.username);
        persistTraining();
        syncAndPersistAuditLogs();
        return res.json({ success: true, message: 'Post deleted' });
      }
      res.status(404).json({ success: false, error: 'Post not found' });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to delete post' });
    }
  });

  // ========== PROTECTED: Training Tasks Management ==========
  router.get('/training', adminAuthMiddleware, (req, res) => {
    try {
      const tasks = dataStore.trainingTasks || {};
      const taskList = Object.values(tasks).sort((a, b) =>
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

      res.json({
        success: true,
        tasks: taskList,
        total: taskList.length
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to load training tasks' });
    }
  });

  router.delete('/training/:taskId', adminAuthMiddleware, (req, res) => {
    try {
      const tasks = dataStore.trainingTasks || {};
      if (!tasks[req.params.taskId]) {
        return res.status(404).json({ success: false, error: 'Task not found' });
      }
      delete tasks[req.params.taskId];
      addAuditLog('TRAINING_DELETED', { taskId: req.params.taskId }, req.admin.username);
      persistTraining();
      syncAndPersistAuditLogs();
      res.json({ success: true, message: 'Training task deleted' });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to delete task' });
    }
  });

  // ========== PROTECTED: System Configuration ==========
  router.get('/config', adminAuthMiddleware, (req, res) => {
    try {
      // Return masked config for security - never expose raw API keys
      const config = {
        server: {
          port: process.env.PORT || 8082,
          nodeEnv: process.env.NODE_ENV || 'development',
          defaultImageModel: process.env.DEFAULT_IMAGE_MODEL || 'doubao'
        },
        aiModels: {
          openai: {
            configured: !!process.env.OPENAI_API_KEY,
            keyPreview: maskKey(process.env.OPENAI_API_KEY),
            baseUrl: process.env.OPENAI_BASE_URL || ''
          },
          doubao: {
            configured: !!process.env.ARK_API_KEY,
            keyPreview: maskKey(process.env.ARK_API_KEY),
            baseUrl: process.env.DOUBAO_BASE_URL || ''
          },
          hunyuan: {
            configured: !!process.env.HUNYUAN_API_KEY,
            keyPreview: maskKey(process.env.HUNYUAN_API_KEY)
          },
          stability: {
            configured: !!process.env.STABILITY_API_KEY,
            keyPreview: maskKey(process.env.STABILITY_API_KEY)
          }
        },
        cloudStorage: {
          cloudinary: {
            configured: !!process.env.CLOUDINARY_CLOUD_NAME,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
            keyPreview: maskKey(process.env.CLOUDINARY_API_KEY)
          }
        },
        dataStore: {
          type: 'JSON file persistence',
          location: 'backend/data/',
          autoSaveInterval: '30 seconds'
        }
      };

      res.json({ success: true, config });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to load config' });
    }
  });

  // ========== PROTECTED: Audit Logs ==========
  router.get('/audit-logs', adminAuthMiddleware, (req, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const logs = getAuditLogs(Number(limit), Number(offset));
      const total = getAuditLogCount();
      res.json({ success: true, logs, total });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to load audit logs' });
    }
  });

  // ========== PROTECTED: Data Backup ==========
  router.post('/data/backup', adminAuthMiddleware, (req, res) => {
    try {
      // Sync audit logs before backup
      dataStore.auditLogs = getRawAuditLogs();
      
      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {
          users: dataStore.users,
          pets: dataStore.pets,
          posts: dataStore.posts,
          trainingTasks: dataStore.trainingTasks,
          trainingPosts: dataStore.trainingPosts,
          taskAnalysis: dataStore.taskAnalysis,
          userTasks: dataStore.userTasks,
          taskCompletions: dataStore.taskCompletions,
          adviceHistory: dataStore.adviceHistory,
          userPreferences: dataStore.userPreferences,
          workshopCreations: dataStore.workshopCreations,
          auditLogs: dataStore.auditLogs,
        },
        stats: {
          users: Object.keys(dataStore.users || {}).length,
          pets: Object.keys(dataStore.pets || {}).length,
          posts: (dataStore.posts || []).length,
          trainingTasks: Object.keys(dataStore.trainingTasks || {}).length
        }
      };

      addAuditLog('DATA_BACKUP_CREATED', { size: JSON.stringify(backup).length }, req.admin.username);

      res.json({
        success: true,
        message: 'Backup created successfully',
        backup: {
          timestamp: backup.timestamp,
          stats: backup.stats,
          sizeBytes: JSON.stringify(backup).length,
          // Send the actual backup data for download
          data: backup
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to create backup' });
    }
  });

  // ========== PROTECTED: Workshop Creations ==========
  router.get('/workshop', adminAuthMiddleware, (req, res) => {
    try {
      const creations = dataStore.workshopCreations || {};
      // 扁平化：每用户下是数组，合并为总列表
      let list = [];
      Object.values(creations).forEach(arr => {
        if (Array.isArray(arr)) list.push(...arr);
      });
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      res.json({
        success: true,
        creations: list,
        total: list.length
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to load workshop creations' });
    }
  });

  router.delete('/workshop/:creationId', adminAuthMiddleware, (req, res) => {
    try {
      const creations = dataStore.workshopCreations || {};
      let found = false;
      // 遍历所有用户的创作列表查找并删除
      for (const [userId, arr] of Object.entries(creations)) {
        if (Array.isArray(arr)) {
          const idx = arr.findIndex(c => c.id === req.params.creationId);
          if (idx !== -1) {
            arr.splice(idx, 1);
            found = true;
            break;
          }
        }
      }
      if (!found) {
        return res.status(404).json({ success: false, error: 'Creation not found' });
      }
      addAuditLog('WORKSHOP_DELETED', { creationId: req.params.creationId }, req.admin.username);
      persistWorkshop();
      syncAndPersistAuditLogs();
      res.json({ success: true, message: 'Workshop creation deleted' });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to delete creation' });
    }
  });

  return router;
}

// Helper: Mask sensitive keys
function maskKey(key) {
  if (!key) return '';
  if (key.length <= 8) return '****';
  return key.substring(0, 4) + '****' + key.substring(key.length - 4);
}

// Helper: Flatten training posts (stored as { userId: [post1, post2] } -> [post1, post2])
function flattenTrainingPosts(trainingPostsObj) {
  const result = [];
  Object.values(trainingPostsObj).forEach(arr => {
    if (Array.isArray(arr)) result.push(...arr);
  });
  return result;
}
