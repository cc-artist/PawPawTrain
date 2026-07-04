/**
 * 训练数据集管理路由
 * 
 * 收集并管理所有用户上传的宠物数据和训练数据，用于未来出售预训练数据集。
 * 
 * 数据集主题分类：
 * - 宠物外形 (Appearance): 类型、颜色、艺术风格、AI生成形象
 * - 宠物生活习性 (Habits): 检测到的行为、习惯标签、性格影响
 * - 训练行为 (Training): 训练任务、视频分析结果、动作捕捉数据
 * 
 * @param {Object} dataStore - 持久化数据存储
 */

import { Router } from 'express';
import { adminAuthMiddleware, addAuditLog } from '../middleware/adminAuth.js';

export default function createDatasetRoutes(dataStore) {
  const router = Router();

  // ========== 辅助函数：组装完整的宠物数据集 ==========
  function buildPetDatasetEntry(pet, users, trainingTasks, trainingPosts, taskCompletions) {
    const owner = users[pet.ownerId] || {};
    const petTasks = Object.values(trainingTasks || {}).filter(
      t => t.petName === pet.name && t.userId === pet.ownerId
    );
    const petTaskIds = new Set(petTasks.map(t => t.id));

    // 训练帖子
    const ownerTrainingPosts = trainingPosts?.[pet.ownerId] || [];
    const petPosts = Array.isArray(ownerTrainingPosts)
      ? ownerTrainingPosts.filter(p => petTaskIds.has(p.taskId))
      : [];

    // 任务完成记录
    const completions = Object.values(taskCompletions || {}).filter(
      c => petTaskIds.has(c.taskId)
    );

    // 聚合分析数据
    const allAnalysis = petTasks
      .filter(t => t.analysis)
      .map(t => t.analysis);

    // 合并所有检测到的行为
    const mergedActions = [];
    const seenActions = new Set();
    allAnalysis.forEach(a => {
      (a.detectedActions || []).forEach(action => {
        if (!seenActions.has(action.en || action.name)) {
          seenActions.add(action.en || action.name);
          mergedActions.push(action);
        }
      });
    });

    // 合并标签
    const mergedTags = new Set();
    allAnalysis.forEach(a => {
      (a.tags || []).forEach(t => mergedTags.add(t));
    });

    // 合并性格影响
    const mergedPersonality = {};
    allAnalysis.forEach(a => {
      Object.entries(a.personalityImpact || {}).forEach(([k, v]) => {
        mergedPersonality[k] = (mergedPersonality[k] || 0) + v;
      });
    });

    return {
      // === 宠物身份 ===
      petId: pet.id,
      petName: pet.name,
      petType: pet.type,
      petEmoji: pet.emoji,
      petColor: pet.color,
      petLevel: pet.level || 1,
      petCreatedAt: pet.createdAt,

      // === 宠物外形数据 ===
      appearance: {
        type: pet.type,
        color: pet.color || '默认',
        emoji: pet.emoji || '🐾',
        artStyle: pet.artStyle || '3d_cartoon',
        imageUrl: pet.imageUrl || null,
        loraStatus: pet.loraStatus || 'pending',
        isPlaceholder: pet.isPlaceholder || false,
        generationId: pet.generationId || null,
        photoCount: pet.photoCount || 0,
      },

      // === 宠物状态属性 ===
      stats: {
        intimacy: pet.intimacy || 50,
        hunger: pet.hunger || 70,
        energy: pet.energy || 50,
        joy: pet.joy || 50,
        discipline: pet.discipline || 50,
        health: pet.health || 100,
        exploration: pet.exploration || 0,
        affection: pet.affection || 50,
      },

      // === 宠物技能与成就 ===
      skills: {
        learnedSkills: pet.learnedSkills || [],
        badges: pet.badges || [],
        points: pet.points || 0,
      },

      // === 宠物生活习性数据 ===
      habits: {
        detectedActions: mergedActions.map(a => ({
          name: a.name,
          en: a.en,
          icon: a.icon,
          tags: a.tags || [],
          confidence: a.confidence || 0.7,
        })),
        tags: Array.from(mergedTags),
        personalityImpact: mergedPersonality,
      },

      // === 训练统计 ===
      training: {
        totalTasks: petTasks.length,
        completedTasks: petTasks.filter(t => t.status === 'completed').length,
        totalTrainingPosts: petPosts.length,
        totalCompletions: completions.length,
        totalVideosUploaded: petTasks.reduce((sum, t) => sum + (t.videos?.length || 0), 0),
        trainingDuration: petTasks.reduce((sum, t) => sum + (t.analysis?.totalDuration || 0), 0),
        averageConfidence: mergedActions.length > 0
          ? mergedActions.reduce((s, a) => s + (a.confidence || 0.7), 0) / mergedActions.length
          : 0,
        statusDistribution: {
          pending: petTasks.filter(t => t.status === 'pending' || t.status === 'analyzing').length,
          training: petTasks.filter(t => {
            const s = t.status || '';
            return ['training', 'in_progress', 'motion_capture', 'lora_training', 'model_optimization', 'post_generation'].includes(s);
          }).length,
          completed: petTasks.filter(t => t.status === 'completed').length,
          failed: petTasks.filter(t => t.status === 'failed').length,
        },
      },

      // === 训练帖子概要 ===
      posts: petPosts.map(p => ({
        id: p.id,
        content: (p.content || '').substring(0, 100),
        likes: p.likes || 0,
        comments: p.comments || 0,
        shares: p.shares || 0,
        createdAt: p.createdAt,
        features: p.features || null,
      })),

      // === 主人匿名信息 ===
      owner: {
        ownerId: pet.ownerId || 'unknown',
        isActive: !!owner.lastActive,
        lastActive: owner.lastActive || null,
        userCreatedAt: owner.createdAt || null,
      },

      updatedAt: pet.updatedAt || pet.createdAt,
    };
  }

  // ========== 辅助函数：组装训练任务数据集 ==========
  function buildTrainingDatasetEntry(task, users) {
    const owner = users[task.userId] || {};
    return {
      taskId: task.id,
      petType: task.petType,
      petName: task.petName,
      status: task.status,
      phase: task.phase,
      videoCount: task.videos?.length || 0,
      videoUrls: (task.videos || []).map(v => ({
        name: v.originalName,
        url: v.url,
        size: v.size,
        error: !v.url,
      })),
      analysis: task.analysis ? {
        detectedActions: (task.analysis.detectedActions || []).map(a => ({
          name: a.name,
          en: a.en,
          icon: a.icon,
          tags: a.tags,
          confidence: a.confidence,
        })),
        detectedHabits: task.analysis.detectedHabits || [],
        tags: task.analysis.tags || [],
        personalityImpact: task.analysis.personalityImpact || {},
        totalDuration: task.analysis.totalDuration,
        videoCount: task.analysis.videoCount,
      } : null,
      techStack: task.techStack || null,
      trainingPhases: task.trainingPhases || [],
      ownerId: task.userId,
      isActive: !!owner.lastActive,
      createdAt: task.createdAt,
    };
  }

  // ========== GET /api/admin/dataset/overview ==========
  router.get('/overview', adminAuthMiddleware, (req, res) => {
    try {
      const users = dataStore.users || {};
      const pets = dataStore.pets || {};
      const trainingTasks = dataStore.trainingTasks || {};
      const trainingPosts = dataStore.trainingPosts || {};
      const taskCompletions = dataStore.taskCompletions || {};

      const petList = Object.values(pets);
      const taskList = Object.values(trainingTasks);
      const userList = Object.values(users);

      // 宠物类型分布
      const typeDistribution = {};
      petList.forEach(p => {
        const t = p.type || 'unknown';
        typeDistribution[t] = (typeDistribution[t] || 0) + 1;
      });

      // 颜色分布
      const colorDistribution = {};
      petList.forEach(p => {
        const c = p.color || '默认';
        colorDistribution[c] = (colorDistribution[c] || 0) + 1;
      });

      // 艺术风格分布
      const artStyleDistribution = {};
      petList.forEach(p => {
        const s = p.artStyle || '3d_cartoon';
        artStyleDistribution[s] = (artStyleDistribution[s] || 0) + 1;
      });

      // 标签频率（从训练分析中聚合）
      const tagFrequency = {};
      taskList.forEach(t => {
        if (t.analysis?.tags) {
          t.analysis.tags.forEach(tag => {
            tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
          });
        }
      });

      // 行为频率
      const actionFrequency = {};
      taskList.forEach(t => {
        if (t.analysis?.detectedActions) {
          t.analysis.detectedActions.forEach(a => {
            const key = a.en || a.name;
            actionFrequency[key] = (actionFrequency[key] || 0) + 1;
          });
        }
      });

      // 训练状态分布
      const trainingStatusDistribution = { pending: 0, training: 0, completed: 0, failed: 0 };
      taskList.forEach(t => {
        const s = t.status || 'pending';
        if (['pending', 'analyzing'].includes(s)) trainingStatusDistribution.pending++;
        else if (['training', 'in_progress', 'motion_capture', 'lora_training', 'model_optimization', 'post_generation'].includes(s)) trainingStatusDistribution.training++;
        else if (s === 'completed') trainingStatusDistribution.completed++;
        else if (s === 'failed') trainingStatusDistribution.failed++;
      });

      // 数据质量指标
      const petsWithImage = petList.filter(p => p.imageUrl && !p.isPlaceholder).length;
      const petsWithTraining = petList.filter(p => {
        return taskList.some(t => t.petName === p.name && t.userId === p.ownerId);
      }).length;
      const completedTrainingRate = taskList.length > 0
        ? Math.round((trainingStatusDistribution.completed / taskList.length) * 100)
        : 0;

      // 最后更新时间
      const timestamps = [
        ...petList.map(p => p.updatedAt || p.createdAt),
        ...taskList.map(t => t.createdAt),
      ].filter(Boolean).sort();
      const lastUpdated = timestamps.length > 0 ? timestamps[timestamps.length - 1] : null;

      // 活跃用户（有宠物且有训练记录）
      const activeDatasetUsers = new Set();
      petList.forEach(p => { activeDatasetUsers.add(p.ownerId); });
      taskList.forEach(t => { activeDatasetUsers.add(t.userId); });

      res.json({
        success: true,
        overview: {
          totalPets: petList.length,
          totalTrainingTasks: taskList.length,
          totalVideosUploaded: taskList.reduce((sum, t) => sum + (t.videos?.length || 0), 0),
          petsWithImages: petsWithImage,
          petsWithTraining: petsWithTraining,
          completedTrainingRate,
          activeDatasetUsers: activeDatasetUsers.size,
          totalUsers: userList.length,
          typeDistribution,
          topColors: Object.entries(colorDistribution)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {}),
          artStyleDistribution,
          topTags: Object.entries(tagFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {}),
          topActions: Object.entries(actionFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {}),
          trainingStatusDistribution,
          dataQuality: {
            imageRate: petList.length > 0 ? Math.round((petsWithImage / petList.length) * 100) : 0,
            trainingRate: petList.length > 0 ? Math.round((petsWithTraining / petList.length) * 100) : 0,
            completionRate: completedTrainingRate,
          },
          lastUpdated,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error('[Dataset] Overview error:', err);
      res.status(500).json({ success: false, error: 'Failed to load dataset overview' });
    }
  });

  // ========== GET /api/admin/dataset/pets ==========
  router.get('/pets', adminAuthMiddleware, (req, res) => {
    try {
      const { page = 1, limit = 20, type = '', search = '', sortBy = 'training' } = req.query;
      const users = dataStore.users || {};
      const pets = dataStore.pets || {};
      const trainingTasks = dataStore.trainingTasks || {};
      const trainingPosts = dataStore.trainingPosts || {};
      const taskCompletions = dataStore.taskCompletions || {};

      let petList = Object.values(pets);

      // 过滤
      if (type) {
        petList = petList.filter(p => p.type === type);
      }
      if (search) {
        const q = search.toLowerCase();
        petList = petList.filter(p =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.type && p.type.toLowerCase().includes(q)) ||
          (p.color && p.color.toLowerCase().includes(q)) ||
          (p.artStyle && p.artStyle.toLowerCase().includes(q))
        );
      }

      // 构建完整数据集条目
      let dataset = petList.map(p => buildPetDatasetEntry(p, users, trainingTasks, trainingPosts, taskCompletions));

      // 排序
      if (sortBy === 'training') {
        dataset.sort((a, b) => b.training.totalTasks - a.training.totalTasks);
      } else if (sortBy === 'recent') {
        dataset.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      } else if (sortBy === 'level') {
        dataset.sort((a, b) => b.petLevel - a.petLevel);
      } else if (sortBy === 'actions') {
        dataset.sort((a, b) => b.habits.detectedActions.length - a.habits.detectedActions.length);
      }

      const total = dataset.length;
      const paged = dataset.slice((page - 1) * limit, page * limit);

      res.json({
        success: true,
        dataset: paged,
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
      });
    } catch (err) {
      console.error('[Dataset] Pets error:', err);
      res.status(500).json({ success: false, error: 'Failed to load pet dataset' });
    }
  });

  // ========== GET /api/admin/dataset/training ==========
  router.get('/training', adminAuthMiddleware, (req, res) => {
    try {
      const { page = 1, limit = 20, status = '', petType = '' } = req.query;
      const users = dataStore.users || {};
      const trainingTasks = dataStore.trainingTasks || {};

      let taskList = Object.values(trainingTasks);

      if (status) {
        taskList = taskList.filter(t => t.status === status);
      }
      if (petType) {
        taskList = taskList.filter(t => t.petType === petType);
      }

      taskList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      const total = taskList.length;
      const paged = taskList.slice((page - 1) * limit, page * limit).map(t =>
        buildTrainingDatasetEntry(t, users)
      );

      res.json({
        success: true,
        dataset: paged,
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
      });
    } catch (err) {
      console.error('[Dataset] Training error:', err);
      res.status(500).json({ success: false, error: 'Failed to load training dataset' });
    }
  });

  // ========== GET /api/admin/dataset/tags ==========
  router.get('/tags', adminAuthMiddleware, (req, res) => {
    try {
      const trainingTasks = dataStore.trainingTasks || {};

      // 聚合所有行为标签和习惯
      const allTags = {};
      const allActions = {};
      const allHabits = {};

      Object.values(trainingTasks).forEach(t => {
        if (t.analysis) {
          (t.analysis.tags || []).forEach(tag => {
            allTags[tag] = (allTags[tag] || 0) + 1;
          });
          (t.analysis.detectedActions || []).forEach(a => {
            const key = a.name || a.en;
            if (!allActions[key]) {
              allActions[key] = { name: key, en: a.en, icon: a.icon, count: 0, avgConfidence: 0, confidences: [] };
            }
            allActions[key].count++;
            allActions[key].confidences.push(a.confidence || 0.7);
          });
          (t.analysis.detectedHabits || []).forEach(h => {
            allHabits[h.name] = (allHabits[h.name] || 0) + 1;
          });
        }
      });

      // 计算平均置信度
      Object.values(allActions).forEach(a => {
        a.avgConfidence = a.confidences.length > 0
          ? Math.round((a.confidences.reduce((s, c) => s + c, 0) / a.confidences.length) * 100)
          : 0;
        delete a.confidences;
      });

      res.json({
        success: true,
        tags: Object.entries(allTags)
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => ({ name, count })),
        actions: Object.values(allActions).sort((a, b) => b.count - a.count),
        habits: Object.entries(allHabits)
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => ({ name, count })),
      });
    } catch (err) {
      console.error('[Dataset] Tags error:', err);
      res.status(500).json({ success: false, error: 'Failed to load tag statistics' });
    }
  });

  // ========== GET /api/admin/dataset/export ==========
  router.get('/export', adminAuthMiddleware, (req, res) => {
    try {
      const { format = 'json', category = 'all' } = req.query;
      const users = dataStore.users || {};
      const pets = dataStore.pets || {};
      const trainingTasks = dataStore.trainingTasks || {};
      const trainingPosts = dataStore.trainingPosts || {};
      const taskCompletions = dataStore.taskCompletions || {};

      // 组装完整数据集
      const petDataset = Object.values(pets).map(p =>
        buildPetDatasetEntry(p, users, trainingTasks, trainingPosts, taskCompletions)
      );

      const trainingDataset = Object.values(trainingTasks).map(t =>
        buildTrainingDatasetEntry(t, users)
      );

      // 聚合标签统计
      const tagStats = {};
      const actionStats = {};
      Object.values(trainingTasks).forEach(t => {
        if (t.analysis) {
          (t.analysis.tags || []).forEach(tag => {
            tagStats[tag] = (tagStats[tag] || 0) + 1;
          });
          (t.analysis.detectedActions || []).forEach(a => {
            const key = a.name || a.en;
            if (!actionStats[key]) {
              actionStats[key] = { name: key, icon: a.icon, count: 0 };
            }
            actionStats[key].count++;
          });
        }
      });

      const fullDataset = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        metadata: {
          description: 'PawPawTrain 宠物外形与生活习性预训练数据集',
          themes: ['pet_appearance', 'pet_habits', 'pet_behaviors', 'pet_training'],
          totalPets: petDataset.length,
          totalTrainingSessions: trainingDataset.length,
          uniqueTags: Object.keys(tagStats).length,
          uniqueActions: Object.keys(actionStats).length,
        },
        statistics: {
          tagFrequency: tagStats,
          actionFrequency: actionStats,
        },
      };

      if (category === 'all' || category === 'appearance') {
        fullDataset.appearanceDataset = petDataset.map(d => ({
          petId: d.petId,
          petName: d.petName,
          petType: d.petType,
          appearance: d.appearance,
          stats: d.stats,
          skills: d.skills,
        }));
      }

      if (category === 'all' || category === 'habits') {
        fullDataset.habitsDataset = petDataset
          .filter(d => d.habits.detectedActions.length > 0)
          .map(d => ({
            petId: d.petId,
            petType: d.petType,
            petName: d.petName,
            habits: d.habits,
            training: d.training,
          }));
      }

      if (category === 'all' || category === 'training') {
        fullDataset.trainingDataset = trainingDataset;
      }

      addAuditLog('DATASET_EXPORTED', {
        format,
        category,
        petCount: petDataset.length,
        trainingCount: trainingDataset.length,
      }, req.admin.username);

      if (format === 'csv') {
        // 导出为CSV（仅核心字段）
        const headers = [
          'petId', 'petName', 'petType', 'petColor', 'artStyle',
          'level', 'intimacy', 'hunger', 'energy', 'joy', 'discipline', 'health',
          'learnedSkills_count', 'badges_count',
          'detectedActions', 'tags', 'habitCount',
          'totalTrainingTasks', 'completedTasks', 'totalVideos',
          'createdAt',
        ];
        const rows = petDataset.map(d => [
          d.petId, d.petName, d.petType, d.appearance.color, d.appearance.artStyle,
          d.petLevel, d.stats.intimacy, d.stats.hunger, d.stats.energy, d.stats.joy, d.stats.discipline, d.stats.health,
          d.skills.learnedSkills.length, d.skills.badges.length,
          d.habits.detectedActions.map(a => a.name).join(';'),
          d.habits.tags.join(';'),
          d.habits.detectedActions.length,
          d.training.totalTasks, d.training.completedTasks, d.training.totalVideosUploaded,
          d.petCreatedAt,
        ]);
        const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="pawpawtrain_dataset_${new Date().toISOString().slice(0, 10)}.csv"`);
        return res.send(csv);
      }

      // 默认JSON
      const jsonStr = JSON.stringify(fullDataset, null, 2);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="pawpawtrain_dataset_${new Date().toISOString().slice(0, 10)}.json"`);
      res.setHeader('Content-Length', Buffer.byteLength(jsonStr, 'utf-8'));
      res.status(200).send(jsonStr);
    } catch (err) {
      console.error('[Dataset] Export error:', err);
      res.status(500).json({ success: false, error: 'Failed to export dataset' });
    }
  });

  // ========== GET /api/admin/dataset/types ==========
  router.get('/types', adminAuthMiddleware, (req, res) => {
    try {
      const pets = dataStore.pets || {};
      const trainingTasks = dataStore.trainingTasks || {};

      const petTypes = new Set();
      Object.values(pets).forEach(p => { if (p.type) petTypes.add(p.type); });
      Object.values(trainingTasks).forEach(t => { if (t.petType) petTypes.add(t.petType); });

      const trainingStatuses = [...new Set(Object.values(trainingTasks).map(t => t.status))];

      res.json({
        success: true,
        petTypes: Array.from(petTypes).sort(),
        trainingStatuses: trainingStatuses.filter(Boolean).sort(),
        artStyles: ['3d_cartoon', 'anime_cel', 'makoto_shinkai', 'flat_design', 'cyberpunk', 'healing', 'ghibli', 'american', 'chinese', 'dark_fantasy'],
      });
    } catch (err) {
      console.error('[Dataset] Types error:', err);
      res.status(500).json({ success: false, error: 'Failed to load types' });
    }
  });

  return router;
}
