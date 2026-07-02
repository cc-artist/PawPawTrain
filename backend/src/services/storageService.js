/**
 * JSON 文件持久化存储服务
 * 
 * 将内存中的结构化数据（用户/宠物/训练/任务/帖子）定期写入 JSON 文件，
 * 服务重启时自动加载恢复，确保数据不丢失。
 * 
 * 存储位置: backend/data/
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

// 确保 data 目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 数据文件映射
const DATA_FILES = {
  users: 'users.json',
  pets: 'pets.json',
  trainingTasks: 'training_tasks.json',
  trainingPosts: 'training_posts.json',
  taskAnalysis: 'task_analysis.json',
  userTasks: 'user_tasks.json',
  taskCompletions: 'task_completions.json',
  adviceHistory: 'advice_history.json',
  posts: 'posts.json',
  userPreferences: 'user_preferences.json',
};

/**
 * 从 JSON 文件加载数据
 * @param {string} key - 数据键名
 * @returns {Array|Object} 加载的数据
 */
function loadData(key) {
  const filePath = path.join(DATA_DIR, DATA_FILES[key]);
  if (!fs.existsSync(filePath)) {
    return key === 'posts' ? [] : {};
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`⚠️ 加载 ${key} 数据失败:`, err.message);
    return key === 'posts' ? [] : {};
  }
}

/**
 * 保存数据到 JSON 文件
 * @param {string} key - 数据键名
 * @param {*} data - 要保存的数据
 */
function saveData(key, data) {
  const filePath = path.join(DATA_DIR, DATA_FILES[key]);
  try {
    // 先写入临时文件，再原子性替换
    const tmpPath = filePath + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    console.error(`❌ 保存 ${key} 数据失败:`, err.message);
  }
}

// ============ 公共 API ============

const storageService = {
  /**
   * 初始化：从磁盘加载所有数据到内存 Map
   * @returns {Object} 包含所有数据的对象
   */
  loadAll() {
    console.log('📂 从磁盘加载持久化数据...');
    
    const rawUsers = loadData('users');
    const rawPets = loadData('pets');
    const rawTrainingTasks = loadData('trainingTasks');
    const rawTrainingPosts = loadData('trainingPosts');
    const rawTaskAnalysis = loadData('taskAnalysis');
    const rawUserTasks = loadData('userTasks');
    const rawTaskCompletions = loadData('taskCompletions');
    const rawAdviceHistory = loadData('adviceHistory');
    const rawPosts = loadData('posts');
    const rawUserPreferences = loadData('userPreferences');

    console.log(`  ✅ 用户: ${Object.keys(rawUsers).length} | 宠物记录: ${Object.keys(rawPets).length} | 帖子: ${rawPosts.length}`);

    return {
      users: rawUsers,
      pets: rawPets,
      trainingTasks: rawTrainingTasks,
      trainingPosts: rawTrainingPosts,
      taskAnalysis: rawTaskAnalysis,
      userTasks: rawUserTasks,
      taskCompletions: rawTaskCompletions,
      adviceHistory: rawAdviceHistory,
      posts: rawPosts,
      userPreferences: rawUserPreferences,
    };
  },

  /**
   * 保存用户数据
   */
  saveUsers(usersObj) {
    saveData('users', usersObj);
  },

  /**
   * 保存宠物数据
   */
  savePets(petsObj) {
    saveData('pets', petsObj);
  },

  /**
   * 保存训练任务
   */
  saveTrainingTasks(tasksObj) {
    saveData('trainingTasks', tasksObj);
  },

  /**
   * 保存训练帖子
   */
  saveTrainingPosts(postsObj) {
    saveData('trainingPosts', postsObj);
  },

  /**
   * 保存任务分析结果
   */
  saveTaskAnalysis(dataObj) {
    saveData('taskAnalysis', dataObj);
  },

  /**
   * 保存用户生成的任务
   */
  saveUserTasks(tasksObj) {
    saveData('userTasks', tasksObj);
  },

  /**
   * 保存任务完成记录
   */
  saveTaskCompletions(completionsObj) {
    saveData('taskCompletions', completionsObj);
  },

  /**
   * 保存建议历史
   */
  saveAdviceHistory(historyObj) {
    saveData('adviceHistory', historyObj);
  },

  /**
   * 保存帖子（全局数组）
   */
  savePosts(postsArray) {
    saveData('posts', postsArray);
  },

  /**
   * 保存用户偏好
   */
  saveUserPreferences(prefsObj) {
    saveData('userPreferences', prefsObj);
  },

  /**
   * 增量保存：仅当数据变更时调用
   * 自动防抖：5秒内多次调用只执行最后一次
   */
  _saveQueue: new Map(),
  _saveTimer: null,

  scheduleSave(key, saveFn, data) {
    this._saveQueue.set(key, { saveFn, data });
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      this._saveQueue.forEach(({ saveFn, data }) => saveFn(data));
      this._saveQueue.clear();
      this._saveTimer = null;
    }, 3000);
  },
};

export default storageService;
