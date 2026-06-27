/**
 * 共享媒体库 - 管理所有用户上传的图片和视频
 * Shared Media Library - manages all user-uploaded images and videos
 * 
 * 用于:
 * 1. 检测重复上传 (compare by fileName + fileSize)
 * 2. 存储所有上传记录供"我的"页面展示
 * 3. 跨页面(TrainingPage/DailyUploadPage)共享上传历史
 */

const MEDIA_LIBRARY_KEY = 'paw_train_media_library';

export const UPLOAD_SOURCE = {
  TRAINING: 'training',       // 虚拟宠物动作训练器
  DAILY_TASKS: 'daily_tasks', // 养宠任务生成器
  POST: 'post',               // 直接发帖
  AVATAR: 'avatar',           // 头像/宠物形象
};

/**
 * 获取所有媒体记录
 */
export const getMediaLibrary = () => {
  try {
    const saved = localStorage.getItem(MEDIA_LIBRARY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('读取媒体库失败:', e);
    return [];
  }
};

/**
 * 保存媒体记录
 */
export const saveMediaLibrary = (library) => {
  try {
    localStorage.setItem(MEDIA_LIBRARY_KEY, JSON.stringify(library));
  } catch (e) {
    console.error('保存媒体库失败:', e);
  }
};

/**
 * 检查文件是否已上传过（根据文件名+大小判断）
 * @returns {object|null} 如果重复则返回已有记录，否则返回null
 */
export const checkDuplicate = (file) => {
  const library = getMediaLibrary();
  return library.find(item => 
    item.fileName === file.name && 
    item.fileSize === file.size
  ) || null;
};

/**
 * 添加媒体记录
 * @param {File} file - 原始文件
 * @param {string} source - 来源（training/daily_tasks/post/avatar）
 * @param {object} extra - 额外信息（petType, analysisId 等）
 * @returns {object} 新创建的记录
 */
export const addMediaRecord = async (file, source, extra = {}) => {
  const library = getMediaLibrary();
  
  const record = {
    id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    source: source,
    sourceLabel: getSourceLabel(source),
    petType: extra.petType || '',
    petName: extra.petName || '',
    analysisId: extra.analysisId || '',
    tags: extra.tags || [],
    thumbnailUrl: extra.thumbnailUrl || '',
    uploadedAt: new Date().toISOString(),
    uploadedAtDisplay: new Date().toLocaleString('zh-CN'),
  };
  
  // 视频生成缩略图
  if (file.type.startsWith('video/') && !record.thumbnailUrl) {
    try {
      record.thumbnailUrl = await generateVideoThumbnail(file);
    } catch (e) {
      // 缩略图生成失败，使用默认占位
    }
  }
  
  // 图片直接读取为预览
  if (file.type.startsWith('image/') && !record.thumbnailUrl) {
    try {
      record.thumbnailUrl = await readFileAsDataURL(file);
    } catch (e) {
      // 读取失败
    }
  }
  
  library.unshift(record);
  
  // 限制最多保留200条记录
  if (library.length > 200) {
    library.splice(200);
  }
  
  saveMediaLibrary(library);
  return record;
};

/**
 * 生成视频缩略图
 */
const generateVideoThumbnail = (file) => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = url;
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    
    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration / 2);
    };
    
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
      URL.revokeObjectURL(url);
      video.remove();
      resolve(thumbnail);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(url);
      video.remove();
      reject(new Error('缩略图生成失败'));
    };
    
    // 超时处理
    setTimeout(() => {
      URL.revokeObjectURL(url);
      video.remove();
      reject(new Error('缩略图生成超时'));
    }, 5000);
  });
};

/**
 * 读取文件为 Data URL
 */
const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * 获取来源标签
 */
const getSourceLabel = (source) => {
  const labels = {
    [UPLOAD_SOURCE.TRAINING]: '🎯 动作训练器',
    [UPLOAD_SOURCE.DAILY_TASKS]: '📋 任务生成器',
    [UPLOAD_SOURCE.POST]: '📝 直接发帖',
    [UPLOAD_SOURCE.AVATAR]: '🐾 宠物形象',
  };
  return labels[source] || source;
};

/**
 * 根据来源筛选记录
 */
export const getMediaBySource = (source) => {
  const library = getMediaLibrary();
  return source ? library.filter(item => item.source === source) : library;
};

/**
 * 按类型筛选（video/image）
 */
export const getMediaByType = (type) => {
  const library = getMediaLibrary();
  if (type === 'video') return library.filter(item => item.fileType.startsWith('video/'));
  if (type === 'image') return library.filter(item => item.fileType.startsWith('image/'));
  return library;
};

/**
 * 删除媒体记录
 */
export const removeMediaRecord = (recordId) => {
  const library = getMediaLibrary();
  const updated = library.filter(item => item.id !== recordId);
  saveMediaLibrary(updated);
  return updated;
};

/**
 * 清空所有记录
 */
export const clearMediaLibrary = () => {
  localStorage.removeItem(MEDIA_LIBRARY_KEY);
};

export default {
  getMediaLibrary,
  checkDuplicate,
  addMediaRecord,
  getMediaBySource,
  getMediaByType,
  removeMediaRecord,
  clearMediaLibrary,
  UPLOAD_SOURCE,
};
