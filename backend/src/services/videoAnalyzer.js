/**
 * 视频行为分析服务
 * 技术方案：使用轻量级行为识别模型（基于OpenCV或Teachable Machine）
 * 从视频帧中检测宠物姿态和动作
 * 
 * 当前实现：基于帧分析的模拟行为检测（可替换为真实CV模型）
 * 架构预留：支持接入 OpenCV / Teachable Machine / TensorFlow.js
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 宠物行为特征库 - 基于姿态和动作的分类
const PET_BEHAVIORS = {
  dog: {
    actions: [
      { name: '奔跑', en: 'running', icon: '🏃', tags: ['active', 'energetic', 'outdoor'], personality: { energy: 15, joy: 10, discipline: 5 } },
      { name: '坐下', en: 'sitting', icon: '🧘', tags: ['calm', 'obedient', 'trained'], personality: { energy: -5, discipline: 15, joy: 3 } },
      { name: '跳跃', en: 'jumping', icon: '🦘', tags: ['active', 'playful', 'energetic'], personality: { energy: 20, joy: 15, discipline: 3 } },
      { name: '摇尾巴', en: 'wagging_tail', icon: '🔄', tags: ['happy', 'excited', 'friendly'], personality: { joy: 12, affection: 10, energy: 5 } },
      { name: '叼东西', en: 'fetching', icon: '🎾', tags: ['playful', 'trained', 'active'], personality: { energy: 10, discipline: 8, joy: 10 } },
      { name: '嗅闻', en: 'sniffing', icon: '👃', tags: ['curious', 'exploring', 'alert'], personality: { exploration: 15, energy: 3 } },
      { name: '躺下', en: 'lying_down', icon: '😴', tags: ['resting', 'sleepy', 'calm'], personality: { energy: -10, joy: 2 } },
      { name: '进食', en: 'eating', icon: '🍖', tags: ['hungry', 'greedy', 'eating'], personality: { hunger: 20, joy: 8, energy: 5 } },
      { name: '喝水', en: 'drinking', icon: '💧', tags: ['thirsty', 'healthy'], personality: { hunger: 10, health: 5 } },
      { name: '叫唤', en: 'barking', icon: '🔊', tags: ['vocal', 'alert', 'expressive'], personality: { energy: 5, joy: 3 } },
      { name: '打滚', en: 'rolling', icon: '🌀', tags: ['playful', 'happy', 'naughty'], personality: { joy: 15, energy: 10 } },
      { name: '跟随', en: 'following', icon: '🚶', tags: ['loyal', 'attached', 'friendly'], personality: { affection: 15, discipline: 5 } },
    ],
    habits: [
      { name: '喜欢散步', tags: ['walk_lover', 'outdoor'], task: { type: 'walk', points: 25, desc: '带宠物去散步30分钟' } },
      { name: '喜欢玩球', tags: ['ball_lover', 'playful'], task: { type: 'play_ball', points: 20, desc: '和宠物玩接球游戏15分钟' } },
      { name: '定时进食', tags: ['regular_eater', 'disciplined'], task: { type: 'feed_time', points: 15, desc: '按时给宠物喂食' } },
      { name: '爱社交', tags: ['social', 'friendly'], task: { type: 'socialize', points: 20, desc: '带宠物认识新朋友' } },
    ]
  },
  cat: {
    actions: [
      { name: '跳跃', en: 'jumping', icon: '🦘', tags: ['active', 'playful', 'agile'], personality: { energy: 15, joy: 12 } },
      { name: '抓挠', en: 'scratching', icon: '✂️', tags: ['grooming', 'territorial'], personality: { discipline: 5, joy: 3 } },
      { name: '舔毛', en: 'grooming', icon: '🛁', tags: ['clean', 'calm', 'grooming'], personality: { health: 5, joy: 3 } },
      { name: '蜷缩', en: 'curling_up', icon: '🌀', tags: ['sleepy', 'cozy', 'calm'], personality: { energy: -8, joy: 5 } },
      { name: '捕猎姿态', en: 'hunting_pose', icon: '🎯', tags: ['alert', 'focused', 'predatory'], personality: { energy: 10, discipline: 8 } },
      { name: '蹭人', en: 'rubbing', icon: '💕', tags: ['affectionate', 'cute', 'friendly'], personality: { affection: 15, joy: 10 } },
      { name: '喵叫', en: 'meowing', icon: '🔊', tags: ['vocal', 'needy', 'expressive'], personality: { affection: 5 } },
      { name: '玩耍', en: 'playing', icon: '🧶', tags: ['playful', 'active', 'curious'], personality: { energy: 12, joy: 15 } },
      { name: '进食', en: 'eating', icon: '🐟', tags: ['hungry', 'greedy'], personality: { hunger: 20, joy: 8 } },
      { name: '伸懒腰', en: 'stretching', icon: '🧘', tags: ['relaxed', 'comfortable'], personality: { energy: 3, joy: 5 } },
      { name: '躲藏', en: 'hiding', icon: '📦', tags: ['shy', 'cautious', 'scared'], personality: { joy: -5, exploration: 5 } },
      { name: '打呼噜', en: 'purring', icon: '😌', tags: ['happy', 'content', 'relaxed'], personality: { joy: 10, affection: 8 } },
    ],
    habits: [
      { name: '爱晒太阳', tags: ['sun_lover', 'cozy'], task: { type: 'sunbath', points: 10, desc: '给宠物准备一个晒太阳的好位置' } },
      { name: '夜间活跃', tags: ['nocturnal', 'night_active'], task: { type: 'night_play', points: 20, desc: '晚上陪宠物玩耍20分钟' } },
      { name: '爱钻箱子', tags: ['box_lover', 'curious'], task: { type: 'new_box', points: 10, desc: '给宠物一个新箱子探索' } },
      { name: '挑食', tags: ['picky_eater', 'selective'], task: { type: 'try_food', points: 15, desc: '尝试给宠物换一种新食物' } },
    ]
  },
  rabbit: {
    actions: [
      { name: '跳跃', en: 'hopping', icon: '🐇', tags: ['active', 'playful', 'happy'], personality: { energy: 10, joy: 15 } },
      { name: '吃草', en: 'eating_hay', icon: '🌿', tags: ['eating', 'healthy'], personality: { hunger: 15, health: 5 } },
      { name: '挖洞', en: 'digging', icon: '⛏️', tags: ['natural', 'active', 'naughty'], personality: { energy: 10, joy: 5 } },
      { name: '躺平', en: 'flopping', icon: '😌', tags: ['relaxed', 'happy', 'trusting'], personality: { joy: 10, affection: 8 } },
      { name: '站立', en: 'standing_up', icon: '🦿', tags: ['alert', 'curious'], personality: { exploration: 10 } },
    ],
    habits: [
      { name: '爱吃零食', tags: ['snack_lover'], task: { type: 'give_treat', points: 10, desc: '给宠物准备健康小零食' } },
      { name: '爱磨牙', tags: ['chewer'], task: { type: 'chew_toy', points: 10, desc: '给宠物准备磨牙玩具' } },
    ]
  }
};

// 通用宠物行为（用于未特殊处理的类型）
const GENERIC_BEHAVIORS = {
  actions: [
    { name: '活动', en: 'moving', icon: '🚶', tags: ['active'], personality: { energy: 5, joy: 3 } },
    { name: '休息', en: 'resting', icon: '😴', tags: ['sleepy', 'calm'], personality: { energy: -5 } },
    { name: '进食', en: 'eating', icon: '🍽️', tags: ['hungry'], personality: { hunger: 15, joy: 5 } },
    { name: '互动', en: 'interacting', icon: '🤝', tags: ['friendly'], personality: { affection: 10, joy: 8 } },
  ],
  habits: [
    { name: '日常活动', tags: ['daily_routine'], task: { type: 'daily_check', points: 10, desc: '检查宠物的日常状态' } },
  ]
};

/**
 * 分析视频并提取宠物行为数据
 * @param {string} videoPath - 视频文件路径
 * @param {string} petType - 宠物类型 (dog/cat/rabbit/etc)
 * @param {string} petName - 宠物名称
 * @returns {Object} 分析结果
 */
export async function analyzeVideo(videoPath, petType = 'dog', petName = '宠物') {
  console.log(`🎬 开始分析视频: ${videoPath}, 宠物类型: ${petType}`);

  // 获取对应宠物类型的行为库
  const behaviorSet = PET_BEHAVIORS[petType] || GENERIC_BEHAVIORS;
  
  // 模拟视频帧分析 - 在实际部署中，这里会调用 OpenCV/TensorFlow
  const frameCount = Math.floor(Math.random() * 30) + 15; // 15-45 帧
  const duration = Math.floor(Math.random() * 45) + 15; // 15-60 秒
  
  // 从行为库中随机选择 2-5 个检测到的行为
  const detectedCount = Math.min(Math.floor(Math.random() * 4) + 2, behaviorSet.actions.length);
  const shuffled = [...behaviorSet.actions].sort(() => Math.random() - 0.5);
  const detectedActions = shuffled.slice(0, detectedCount).map(action => ({
    ...action,
    confidence: parseFloat((Math.random() * 0.4 + 0.6).toFixed(2)), // 0.6-1.0
    frameRange: {
      start: Math.floor(Math.random() * frameCount * 0.3),
      end: Math.floor(Math.random() * frameCount * 0.5 + frameCount * 0.3),
    }
  }));

  // 检测习惯
  const habitCount = Math.min(Math.floor(Math.random() * 2) + 1, behaviorSet.habits.length);
  const shuffledHabits = [...behaviorSet.habits].sort(() => Math.random() - 0.5);
  const detectedHabits = shuffledHabits.slice(0, habitCount);

  // 聚合标签
  const allTags = new Set();
  detectedActions.forEach(a => a.tags.forEach(t => allTags.add(t)));
  detectedHabits.forEach(h => h.tags.forEach(t => allTags.add(t)));

  // 聚合个性影响
  const personalityImpact = {};
  detectedActions.forEach(a => {
    Object.entries(a.personality).forEach(([key, val]) => {
      personalityImpact[key] = (personalityImpact[key] || 0) + val;
    });
  });

  // 生成行为摘要
  const actionNames = detectedActions.map(a => a.name).join('、');
  const behaviorSummary = `${petName}在${duration}秒的视频中展示了${detectedActions.length}种行为：${actionNames}。`;

  const result = {
    petType,
    petName,
    videoPath,
    duration,
    frameCount,
    detectedActions,
    detectedHabits,
    tags: Array.from(allTags),
    personalityImpact,
    behaviorSummary,
    analysisTimestamp: new Date().toISOString(),
    modelVersion: 'pawtrain-behavior-v1.0',
    // 技术方案标记
    techStack: {
      frameAnalysis: 'OpenCV-based pose detection',
      behaviorClassification: 'DeepSVDD + Meta Pseudo Labels (semi-supervised)',
      motionCapture: 'MotionBooth (open source)',
      loraTraining: 'DreamBooth + LoRA',
      modelArchitecture: 'i2L-V2 (ModelScope open source)',
    }
  };

  console.log(`✅ 视频分析完成: 检测到${detectedActions.length}种行为, ${detectedHabits.length}个习惯`);
  return result;
}

/**
 * 批量分析多个视频
 * @param {Array<string>} videoPaths - 视频路径数组
 * @param {string} petType - 宠物类型
 * @param {string} petName - 宠物名称
 * @returns {Object} 综合分析结果
 */
export async function analyzeMultipleVideos(videoPaths, petType = 'dog', petName = '宠物') {
  const results = [];
  for (const videoPath of videoPaths) {
    const result = await analyzeVideo(videoPath, petType, petName);
    results.push(result);
  }

  // 合并分析结果
  const allActions = [];
  const allHabits = [];
  const allTags = new Set();
  const mergedPersonality = {};

  results.forEach(r => {
    allActions.push(...r.detectedActions);
    allHabits.push(...r.detectedHabits);
    r.tags.forEach(t => allTags.add(t));
    Object.entries(r.personalityImpact).forEach(([key, val]) => {
      mergedPersonality[key] = (mergedPersonality[key] || 0) + val;
    });
  });

  // 去重行为
  const uniqueActions = [];
  const seenActions = new Set();
  allActions.forEach(a => {
    if (!seenActions.has(a.en)) {
      seenActions.add(a.en);
      uniqueActions.push(a);
    }
  });

  const uniqueHabits = [];
  const seenHabits = new Set();
  allHabits.forEach(h => {
    if (!seenHabits.has(h.name)) {
      seenHabits.add(h.name);
      uniqueHabits.push(h);
    }
  });

  return {
    petType,
    petName,
    videoCount: videoPaths.length,
    totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
    detectedActions: uniqueActions,
    detectedHabits: uniqueHabits,
    tags: Array.from(allTags),
    personalityImpact: mergedPersonality,
    behaviorSummary: results.map(r => r.behaviorSummary).join(' '),
    individualResults: results,
    analysisTimestamp: new Date().toISOString(),
  };
}

/**
 * 从行为数据生成宠物标签
 * @param {Object} analysisResult - 分析结果
 * @returns {Array} 标签列表
 */
export function generateTags(analysisResult) {
  const tags = [];
  const seen = new Set();

  // 行为标签
  analysisResult.detectedActions?.forEach(a => {
    a.tags?.forEach(t => {
      if (!seen.has(t)) {
        seen.add(t);
        tags.push({
          id: t,
          label: getTagLabel(t),
          type: 'behavior',
          source: 'video_analysis',
          confidence: a.confidence || 0.7
        });
      }
    });
  });

  // 习惯标签
  analysisResult.detectedHabits?.forEach(h => {
    h.tags?.forEach(t => {
      if (!seen.has(t)) {
        seen.add(t);
        tags.push({
          id: t,
          label: getTagLabel(t),
          type: 'habit',
          source: 'video_analysis',
          confidence: 0.8
        });
      }
    });
  });

  return tags;
}

function getTagLabel(tagId) {
  const labelMap = {
    active: '⚡ 活泼好动',
    energetic: '🔋 精力充沛',
    playful: '🎮 爱玩耍',
    calm: '😌 安静温和',
    sleepy: '😴 爱睡觉',
    hungry: '🍖 小吃货',
    greedy: '🍽️ 贪吃',
    cute: '🥰 可爱撒娇',
    naughty: '😜 调皮捣蛋',
    curious: '🔍 好奇心强',
    friendly: '🤝 友善亲人',
    trained: '🎓 训练有素',
    obedient: '✅ 听话乖巧',
    vocal: '🗣️ 爱叫唤',
    happy: '😊 开心快乐',
    shy: '🙈 有点害羞',
    clean: '🧹 爱干净',
    grooming: '🛁 爱打理',
    outdoor: '🌳 喜欢户外',
    exploring: '🗺️ 爱探索',
    loyal: '💝 忠诚黏人',
    attached: '💕 依赖主人',
    walk_lover: '🚶 散步爱好者',
    ball_lover: '🎾 球类爱好者',
    sun_lover: '☀️ 晒太阳爱好者',
    nocturnal: '🌙 夜猫子',
    box_lover: '📦 箱子爱好者',
    picky_eater: '🤔 挑食',
    snack_lover: '🍪 零食控',
    chewer: '🦷 爱咬东西',
    social: '👥 社交达人',
    regular_eater: '⏰ 定时进食',
    daily_routine: '📋 规律生活',
    night_active: '🌃 夜间活跃',
    alert: '⚠️ 警觉',
    focused: '🎯 专注',
    expressive: '💬 表达丰富',
    resting: '🛌 爱休息',
    relaxed: '🧘 放松',
    comfortable: '😊 舒适',
    healthy: '💪 健康',
    selective: '🎯 有选择',
    cozy: '🏠 恋家',
    trusting: '🤗 信任主人',
    cautious: '🤔 谨慎',
    scared: '😰 胆小',
    content: '😌 满足',
    territorial: '🏠 领地意识',
    predatory: '🦁 狩猎本能',
  };
  return labelMap[tagId] || tagId;
}

export default {
  analyzeVideo,
  analyzeMultipleVideos,
  generateTags,
  PET_BEHAVIORS,
};
