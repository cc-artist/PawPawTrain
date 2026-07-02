/**
 * 个性化推荐算法服务
 * 根据每个用户的喜好算法，进行针对性的推送
 */

import storageService from './storageService.js';

// 内存中的用户偏好数据（启动时从JSON恢复）
let userPreferences = new Map();

/** 保存回调 */
let onPersistCallback = null;

/**
 * 从持久化数据初始化用户偏好
 * @param {Object} persistedData - dataStore.userPreferences
 */
export function initPreferences(persistedData) {
  userPreferences = new Map();
  if (persistedData && typeof persistedData === 'object') {
    Object.entries(persistedData).forEach(([key, value]) => {
      userPreferences.set(key, value);
    });
  }
  console.log(`📊 推荐系统: 已加载 ${userPreferences.size} 个用户画像`);
}

/**
 * 设置持久化回调
 */
export function setPersistCallback(callback) {
  onPersistCallback = callback;
}

/** 触发保存 */
function persistPreferences() {
  const obj = {};
  userPreferences.forEach((v, k) => { obj[k] = v; });
  storageService.saveUserPreferences(obj);
  if (onPersistCallback) onPersistCallback(obj);
}

/**
 * 计算内容与用户偏好的匹配度
 */
export function calculateMatchScore(post, userProfile) {
  if (!post || !userProfile) return 50;

  let score = 0;
  const features = post.features || {};
  const postTags = features.tags || [];
  const userTags = userProfile.preferredTags || [];
  const userPetType = userProfile.petType;
  const userPersonality = userProfile.personality || {};

  // 1. 宠物类型匹配 (权重: 30)
  if (features.petType === userPetType) {
    score += 30;
  } else if (features.petType && userPetType) {
    const relatedTypes = {
      dog: ['dog'],
      cat: ['cat'],
      rabbit: ['rabbit', 'hamster', 'guinea_pig'],
      bird: ['bird', 'parrot'],
    };
    const related = relatedTypes[userPetType] || [];
    if (related.includes(features.petType)) {
      score += 15;
    }
  }

  // 2. 标签匹配 (权重: 25)
  if (postTags.length > 0 && userTags.length > 0) {
    const matchedTags = postTags.filter(t => userTags.includes(t));
    const tagRatio = matchedTags.length / Math.max(postTags.length, 1);
    score += tagRatio * 25;
  }

  // 3. 情感匹配 (权重: 15)
  if (features.emotion) {
    const preferredEmotion = userProfile.preferredEmotion || 'positive';
    if (features.emotion === preferredEmotion) {
      score += 15;
    } else if (features.emotion === 'positive') {
      score += 8;
    }
  }

  // 4. 互动分数 (权重: 20)
  const engagement = (post.likes || 0) + (post.comments || 0) * 2 + (post.shares || 0) * 3;
  if (engagement > 1000) score += 20;
  else if (engagement > 500) score += 15;
  else if (engagement > 100) score += 10;
  else score += 5;

  // 5. 个性加成匹配 (权重: 10)
  if (features.personalityBoost && userPersonality) {
    const needsEnergy = (userPersonality.energy || 50) < 40;
    const needsJoy = (userPersonality.joy || 50) < 40;
    const needsAffection = (userPersonality.affection || 50) < 40;
    
    let boostScore = 0;
    if (needsEnergy && (features.personalityBoost.energy || 0) > 5) boostScore += 4;
    if (needsJoy && (features.personalityBoost.joy || 0) > 5) boostScore += 3;
    if (needsAffection && (features.personalityBoost.affection || 0) > 5) boostScore += 3;
    score += boostScore;
  }

  // 6. 新鲜度惩罚
  if (userProfile.viewedPosts?.includes(post.id)) {
    score *= 0.5;
  }

  return Math.min(100, Math.round(score));
}

/**
 * 对帖子列表进行个性化排序
 */
export function personalizedSort(posts, userId, userProfile) {
  if (!posts || posts.length === 0) return posts;

  const profile = userProfile || getUserProfile(userId);

  const scored = posts.map(post => ({
    ...post,
    recommendationScore: calculateMatchScore(post, profile),
  }));

  scored.sort((a, b) => b.recommendationScore - a.recommendationScore);

  return scored;
}

/**
 * 获取/创建用户画像
 */
export function getUserProfile(userId) {
  if (userPreferences.has(userId)) {
    return userPreferences.get(userId);
  }
  
  const defaultProfile = {
    userId,
    petType: 'dog',
    preferredTags: ['active', 'playful', 'cute'],
    preferredEmotion: 'positive',
    personality: { energy: 50, joy: 50, affection: 50 },
    viewedPosts: [],
    likedPosts: [],
    interactionCount: 0,
    lastUpdated: new Date().toISOString(),
  };
  
  userPreferences.set(userId, defaultProfile);
  persistPreferences();
  return defaultProfile;
}

/**
 * 更新用户画像
 */
export function updateUserProfile(userId, updates) {
  const profile = getUserProfile(userId);
  const updated = {
    ...profile,
    ...updates,
    lastUpdated: new Date().toISOString(),
  };
  userPreferences.set(userId, updated);
  persistPreferences();
  return updated;
}

/**
 * 记录用户浏览行为
 */
export function recordView(userId, postId, postFeatures = {}) {
  const profile = getUserProfile(userId);
  
  const viewedPosts = profile.viewedPosts || [];
  if (!viewedPosts.includes(postId)) {
    viewedPosts.push(postId);
    if (viewedPosts.length > 100) viewedPosts.shift();
  }

  if (postFeatures.tags && postFeatures.tags.length > 0) {
    const preferredTags = [...(profile.preferredTags || [])];
    postFeatures.tags.forEach(tag => {
      if (!preferredTags.includes(tag)) {
        preferredTags.push(tag);
      }
    });
    if (preferredTags.length > 20) {
      preferredTags.splice(0, preferredTags.length - 20);
    }

    updateUserProfile(userId, {
      viewedPosts,
      preferredTags,
      interactionCount: (profile.interactionCount || 0) + 1,
    });
  } else {
    updateUserProfile(userId, {
      viewedPosts,
      interactionCount: (profile.interactionCount || 0) + 1,
    });
  }
}

/**
 * 基于宠物分析数据更新用户偏好
 */
export function updatePreferencesFromAnalysis(userId, analysisResult) {
  const profile = getUserProfile(userId);
  
  updateUserProfile(userId, {
    petType: analysisResult.petType || profile.petType,
    preferredTags: [
      ...new Set([
        ...(analysisResult.tags || []),
        ...(profile.preferredTags || []),
      ])
    ].slice(0, 20),
    personality: {
      ...profile.personality,
      ...(analysisResult.personalityImpact || {}),
    },
  });
}

export default {
  calculateMatchScore,
  personalizedSort,
  getUserProfile,
  updateUserProfile,
  recordView,
  updatePreferencesFromAnalysis,
  initPreferences,
  setPersistCallback,
};
