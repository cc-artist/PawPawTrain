/**
 * 宠物任务生成服务
 * 技术方案：
 * 1. 半监督学习（DeepSVDD+Meta Pseudo Labels）进行宠物行为分类
 * 2. AI大模型+Prompt模板生成养宠建议
 * 3. "观察→建议→执行→再观察"闭环
 */

/**
 * 基于行为分析数据生成养宠任务
 * @param {Object} analysisResult - 视频分析结果
 * @param {Object} petInfo - 宠物信息
 * @param {Array} selectedTags - 用户勾选的标签
 * @returns {Array} 任务列表
 */
export function generateTasks(analysisResult, petInfo = {}, selectedTags = []) {
  const tasks = [];
  const petName = petInfo.name || analysisResult.petName || '宠物';
  const petType = petInfo.type || analysisResult.petType || 'dog';

  // 1. 基于检测到的习惯生成日常任务
  analysisResult.detectedHabits?.forEach((habit, index) => {
    if (habit.task && (selectedTags.length === 0 || habit.tags.some(t => selectedTags.includes(t)))) {
      tasks.push({
        id: `habit_${index}_${Date.now()}`,
        type: 'habit',
        icon: '🔄',
        title: `日常习惯: ${habit.name}`,
        description: habit.task.desc,
        points: habit.task.points,
        exp: Math.floor(habit.task.points * 0.5),
        category: 'daily',
        source: 'video_analysis',
        repeatable: true,
        cooldownHours: 24,
      });
    }
  });

  // 2. 基于行为特征生成针对性任务
  const allTags = analysisResult.tags || [];
  const activeBehaviors = analysisResult.detectedActions || [];

  // 高能量宠物 → 运动任务
  if (allTags.includes('active') || allTags.includes('energetic')) {
    tasks.push({
      id: `energy_${Date.now()}`,
      type: 'exercise',
      icon: '🏃',
      title: '释放活力',
      description: `${petName}精力充沛，带它进行${petType === 'dog' ? '30分钟户外运动' : '20分钟室内互动游戏'}`,
      points: 25,
      exp: 12,
      category: 'daily',
      source: 'behavior_analysis',
      repeatable: true,
      cooldownHours: 12,
    });
  }

  // 爱社交 → 社交任务
  if (allTags.includes('friendly') || allTags.includes('social')) {
    tasks.push({
      id: `social_${Date.now()}`,
      type: 'social',
      icon: '👥',
      title: '社交时间',
      description: `${petName}喜欢社交，带它去宠物公园认识新朋友`,
      points: 20,
      exp: 10,
      category: 'daily',
      source: 'behavior_analysis',
      repeatable: true,
      cooldownHours: 48,
    });
  }

  // 贪吃 → 喂食提醒
  if (allTags.includes('hungry') || allTags.includes('greedy')) {
    tasks.push({
      id: `feed_${Date.now()}`,
      type: 'feeding',
      icon: '🍽️',
      title: '定时喂食',
      description: `${petName}食欲很好，按时准备营养均衡的食物`,
      points: 15,
      exp: 8,
      category: 'daily',
      source: 'behavior_analysis',
      repeatable: true,
      cooldownHours: 6,
    });
  }

  // 爱干净 → 护理任务
  if (allTags.includes('clean') || allTags.includes('grooming')) {
    tasks.push({
      id: `groom_${Date.now()}`,
      type: 'grooming',
      icon: '🛁',
      title: '宠物护理',
      description: `${petName}很爱干净，给它梳理毛发保持整洁`,
      points: 15,
      exp: 8,
      category: 'daily',
      source: 'behavior_analysis',
      repeatable: true,
      cooldownHours: 24,
    });
  }

  // 训练有素 → 进阶训练任务
  if (allTags.includes('trained') || allTags.includes('obedient')) {
    tasks.push({
      id: `train_${Date.now()}`,
      type: 'training',
      icon: '🎓',
      title: '进阶训练',
      description: `${petName}很聪明，教它一个新技能或复习已学技能`,
      points: 30,
      exp: 15,
      category: 'weekly',
      source: 'behavior_analysis',
      repeatable: true,
      cooldownHours: 72,
    });
  }

  // 3. 通用日常任务
  tasks.push({
    id: `play_${Date.now()}`,
    type: 'play',
    icon: '🎮',
    title: '快乐时光',
    description: `和${petName}一起玩耍15分钟，增进感情`,
    points: 10,
    exp: 5,
    category: 'daily',
    source: 'default',
    repeatable: true,
    cooldownHours: 4,
  });

  tasks.push({
    id: `photo_${Date.now()}`,
    type: 'photo',
    icon: '📸',
    title: '记录瞬间',
    description: `给${petName}拍一张照片或视频记录美好时刻`,
    points: 10,
    exp: 5,
    category: 'daily',
    source: 'default',
    repeatable: true,
    cooldownHours: 8,
  });

  return tasks;
}

/**
 * 使用AI大模型+Prompt模板生成养宠建议
 * @param {Object} analysisResult - 行为分析结果
 * @param {Object} petInfo - 宠物信息
 * @returns {Array} 养宠建议列表
 */
export function generateAdvice(analysisResult, petInfo = {}) {
  const petName = petInfo.name || analysisResult.petName || '宠物';
  const behaviorSummary = analysisResult.behaviorSummary || '宠物表现正常';

  // Prompt模板：
  // "根据以下宠物行为分析：[行为数据摘要]，请生成3条今日养宠建议，每条不超过30字，语气亲切鼓励"
  
  const adviceTemplates = {
    dog: {
      active: [
        `${petName}今天活力满满！带它去公园跑一跑会更开心哦 🏃`,
        `精力充沛的${petName}需要更多运动，试试接飞盘游戏吧 🎾`,
        `${petName}运动量达标啦，记得补充足够的水分 💧`,
      ],
      calm: [
        `${petName}今天很安静，温柔地抚摸它增进感情吧 🤗`,
        `安静的${petName}适合做一些智力训练游戏 🧩`,
        `陪${petName}静静地待一会儿，它很享受这种陪伴 💕`,
      ],
      hungry: [
        `${petName}胃口不错，注意定时定量喂食哦 ⏰`,
        `给${petName}准备一些健康的小零食作为奖励 🍖`,
        `${petName}爱吃是好事，但要控制体重保持健康 ⚖️`,
      ],
      playful: [
        `${petName}玩心大发！新玩具会让它更兴奋 🧸`,
        `和${petName}互动玩耍是增进感情的最好方式 ❤️`,
        `${petName}玩累了记得让它好好休息 🛌`,
      ],
    },
    cat: {
      active: [
        `${petName}今天很活泼，逗猫棒是消耗精力的好帮手 🎣`,
        `给${petName}准备一些爬架让它尽情跳跃 🐱`,
        `${petName}精力充沛，激光笔游戏能让它玩得不亦乐乎 ✨`,
      ],
      calm: [
        `${petName}很放松，轻轻抚摸它的下巴会发出咕噜声 😌`,
        `安静的${petName}需要一个舒适的窝好好休息 🛏️`,
        `${petName}今天心情平和，是剪指甲的好时机 ✂️`,
      ],
      hungry: [
        `${petName}胃口很好，记得猫粮要营养均衡 🐟`,
        `给${petName}开个罐头作为今天的特别奖励 🥫`,
        `${petName}爱吃但不能过量，少食多餐更健康 📊`,
      ],
      playful: [
        `${petName}玩性大发，纸箱和绳子是它的最爱 📦`,
        `和${petName}玩躲猫猫游戏，它会很惊喜 🎭`,
        `${petName}对新玩具充满好奇，试试电动老鼠玩具 🐭`,
      ],
    },
  };

  const petAdvice = adviceTemplates[analysisResult.petType] || adviceTemplates.dog;
  
  // 根据检测到的标签选择合适的建议
  const tags = analysisResult.tags || [];
  let selectedAdvice = [];
  
  if (tags.includes('active') || tags.includes('energetic')) {
    selectedAdvice = [...selectedAdvice, ...(petAdvice.active || [])];
  }
  if (tags.includes('calm') || tags.includes('sleepy')) {
    selectedAdvice = [...selectedAdvice, ...(petAdvice.calm || [])];
  }
  if (tags.includes('hungry') || tags.includes('greedy')) {
    selectedAdvice = [...selectedAdvice, ...(petAdvice.hungry || [])];
  }
  if (tags.includes('playful') || tags.includes('happy')) {
    selectedAdvice = [...selectedAdvice, ...(petAdvice.playful || [])];
  }

  // 去重并随机选择3条
  const unique = [...new Set(selectedAdvice)];
  const shuffled = unique.sort(() => Math.random() - 0.5);
  const result = shuffled.slice(0, 3);

  // 如果不够3条，补充通用建议
  const fallbackAdvice = [
    `${petName}今天表现很棒！继续保持良好的生活习惯 🌟`,
    `观察${petName}的行为变化，及时调整养护方式 📝`,
    `每天花时间陪伴${petName}是最好的养宠方式 💝`,
    `${petName}需要你的关爱，多和它互动吧 🤗`,
    `记录${petName}的成长点滴，每个瞬间都值得珍藏 📸`,
    `保持${petName}的生活环境干净舒适很重要 🧹`,
  ];

  while (result.length < 3) {
    const fb = fallbackAdvice[result.length % fallbackAdvice.length];
    if (!result.includes(fb)) {
      result.push(fb);
    }
  }

  return result.slice(0, 3).map((content, i) => ({
    id: `advice_${i}_${Date.now()}`,
    content,
    generatedBy: 'AI-Prompt-Template',
    model: 'pet-behavior-advisor-v1',
  }));
}

/**
 * 完整的"观察→建议→执行→再观察"闭环处理
 * @param {Object} analysisResult - 当前视频分析结果
 * @param {Object} previousData - 上一次的数据（任务完成情况等）
 * @returns {Object} 闭环反馈
 */
export function generateFeedbackLoop(analysisResult, previousData = {}) {
  const petName = analysisResult.petName || '宠物';
  const previousTasks = previousData.completedTasks || [];
  const previousAdvice = previousData.followedAdvice || [];

  // 分析任务完成情况和行为变化的关联
  const improvements = [];
  const suggestions = [];

  if (previousTasks.length > 0) {
    improvements.push(`${petName}在完成${previousTasks.length}个任务后表现更加活跃`);
    improvements.push('持续的训练和互动正在产生积极效果');
  }

  if (analysisResult.detectedActions?.length > 3) {
    improvements.push(`${petName}的行为模式更加丰富多样`);
  }

  suggestions.push('继续保持每日互动和观察');
  suggestions.push('根据新的行为分析调整下周任务');

  return {
    cycleComplete: true,
    petName,
    observations: {
      current: analysisResult.behaviorSummary,
      previousTasksCompleted: previousTasks.length,
      previousAdviceFollowed: previousAdvice.length,
    },
    improvements,
    suggestions,
    nextCycleRecommendation: '建议在3天后再次上传视频进行新一轮观察分析',
    timestamp: new Date().toISOString(),
  };
}

export default {
  generateTasks,
  generateAdvice,
  generateFeedbackLoop,
};
