/**
 * 个性化推荐算法服务
 * 根据每个用户的喜好算法，进行针对性的推送
 * 
 * 技术方案：
 * - 基于用户宠物特征 + 浏览历史 + 交互行为的协同过滤
 * - 用户画像：宠物类型、个性标签、互动偏好
 * - 内容画像：宠物类型、行为特征、情感标签
 */

// 内存中的用户偏好数据
const userPreferences = new Map();

/**
 * 计算内容与用户偏好的匹配度
 * @param {Object} post - 帖子内容（含features）
 * @param {Object} userProfile - 用户画像
 * @returns {number} 匹配分数 0-100
 */
export function calculateMatchScore(post, userProfile) {
  if (!post || !userProfile) return 50; // 默认分数

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
    // 相关类型给部分分
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
  // 热门内容加权
  const engagement = (post.likes || 0) + (post.comments || 0) * 2 + (post.shares || 0) * 3;
  if (engagement > 1000) score += 20;
  else if (engagement > 500) score += 15;
  else if (engagement > 100) score += 10;
  else score += 5;

  // 5. 个性加成匹配 (权重: 10)
  if (features.personalityBoost && userPersonality) {
    // 检查用户宠物是否需要某些属性加成
    const needsEnergy = (userPersonality.energy || 50) < 40;
    const needsJoy = (userPersonality.joy || 50) < 40;
    const needsAffection = (userPersonality.affection || 50) < 40;
    
    let boostScore = 0;
    if (needsEnergy && (features.personalityBoost.energy || 0) > 5) boostScore += 4;
    if (needsJoy && (features.personalityBoost.joy || 0) > 5) boostScore += 3;
    if (needsAffection && (features.personalityBoost.affection || 0) > 5) boostScore += 3;
    score += boostScore;
  }

  // 6. 新鲜度惩罚 - 避免重复推荐 (减分)
  if (userProfile.viewedPosts?.includes(post.id)) {
    score *= 0.5;
  }

  return Math.min(100, Math.round(score));
}

/**
 * 对帖子列表进行个性化排序
 * @param {Array} posts - 帖子列表
 * @param {string} userId - 用户ID
 * @param {Object} userProfile - 用户画像
 * @returns {Array} 排序后的帖子列表
 */
export function personalizedSort(posts, userId, userProfile) {
  if (!posts || posts.length === 0) return posts;

  const profile = userProfile || getUserProfile(userId);

  // 计算每个帖子的匹配分数
  const scored = posts.map(post => ({
    ...post,
    recommendationScore: calculateMatchScore(post, profile),
  }));

  // 按分数降序排列
  scored.sort((a, b) => b.recommendationScore - a.recommendationScore);

  return scored;
}

/**
 * 获取/创建用户画像
 * @param {string} userId - 用户ID
 * @returns {Object} 用户画像
 */
export function getUserProfile(userId) {
  if (userPreferences.has(userId)) {
    return userPreferences.get(userId);
  }
  
  // 默认画像
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
  return defaultProfile;
}

/**
 * 更新用户画像
 * @param {string} userId - 用户ID
 * @param {Object} updates - 更新数据
 */
export function updateUserProfile(userId, updates) {
  const profile = getUserProfile(userId);
  const updated = {
    ...profile,
    ...updates,
    lastUpdated: new Date().toISOString(),
  };
  userPreferences.set(userId, updated);
  return updated;
}

/**
 * 记录用户浏览行为
 * @param {string} userId - 用户ID
 * @param {string} postId - 帖子ID
 * @param {Object} postFeatures - 帖子特征
 */
export function recordView(userId, postId, postFeatures = {}) {
  const profile = getUserProfile(userId);
  
  // 更新浏览记录
  const viewedPosts = profile.viewedPosts || [];
  if (!viewedPosts.includes(postId)) {
    viewedPosts.push(postId);
    if (viewedPosts.length > 100) viewedPosts.shift(); // 保留最近100条
  }

  // 从浏览内容中学习偏好
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
 * @param {string} userId - 用户ID
 * @param {Object} analysisResult - 分析结果
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
};
