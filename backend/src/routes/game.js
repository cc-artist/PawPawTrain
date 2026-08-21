import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import storageService from '../services/storageService.js';

/**
 * 宠物叫声对战游戏路由
 * - POST /api/game/start       开局消耗积分
 * - POST /api/game/record      保存对局记录（胜利奖励积分）
 * - GET  /api/game/leaderboard 全服排行榜
 * - GET  /api/game/my          我的对战记录
 */

// ========== 积分规则 ==========
// 每局开局消耗的入场积分
const ENTRY_FEE = 20;
// 每局胜利奖励的积分
const WIN_REWARD = 40;

const createGameRoutes = (dataStore) => {
  const router = Router();

  // 从持久化数据初始化（普通数组，非 Map）
  if (!Array.isArray(dataStore.gameRecords)) {
    dataStore.gameRecords = [];
  }

  function persistGameRecords() {
    storageService.saveGameRecords(dataStore.gameRecords);
  }

  function persistUsers() {
    storageService.saveUsers(dataStore.users);
  }

  // 在持久化用户数据中定位当前用户（users 以 username / email 为键，同一用户可能是两个键）
  function findUser(authUser) {
    const usersObj = dataStore.users || {};
    return (
      usersObj[authUser.username] ||
      usersObj[authUser.email] ||
      Object.values(usersObj).find((u) => u.id === authUser.id) ||
      null
    );
  }

  // OPTIONS 预检处理（确保 CORS 预检通过）
  router.options('/start', (req, res) => res.sendStatus(204));
  router.options('/record', (req, res) => res.sendStatus(204));
  router.options('/leaderboard', (req, res) => res.sendStatus(204));
  router.options('/my', (req, res) => res.sendStatus(204));

  /**
   * POST /api/game/start
   * 开局：扣除入场积分（积分不足则拒绝开局）
   */
  router.post('/start', authMiddleware, (req, res) => {
    try {
      const { tier = 0 } = req.body || {};
      const user = findUser(req.user);
      if (!user) {
        return res.status(404).json({ success: false, error: '用户不存在' });
      }
      const balance = Number(user.points) || 0;
      if (balance < ENTRY_FEE) {
        return res.status(400).json({
          success: false,
          error: `积分不足，开局需要消耗 ${ENTRY_FEE} 积分（当前仅 ${balance} 积分）`,
          need: ENTRY_FEE,
          balance,
        });
      }
      user.points = balance - ENTRY_FEE;
      persistUsers();
      res.json({ success: true, points: user.points, entryFee: ENTRY_FEE, tier: Number(tier) || 0 });
    } catch (error) {
      console.error('Game start failed:', error.message);
      res.status(500).json({ success: false, error: '开局失败，请稍后再试' });
    }
  });

  /**
   * POST /api/game/record
   * 保存一局游戏记录
   */
  router.post('/record', authMiddleware, (req, res) => {
    try {
      const { opponentId = 'unknown', opponentName = '神秘对手', result = 'lose', damageDealt = 0, damageTaken = 0, score = 0 } = req.body || {};

      const record = {
        id: uuidv4(),
        userId: String(req.user.id),
        username: req.user.username || req.user.name || '玩家',
        opponentId: String(opponentId),
        opponentName: String(opponentName),
        result, // 'win' | 'lose' | 'draw'
        damageDealt: Number(damageDealt) || 0,
        damageTaken: Number(damageTaken) || 0,
        score: Number(score) || 0,
        createdAt: new Date().toISOString(),
      };

      dataStore.gameRecords.push(record);
      // 仅保留最近 5000 条，避免无限增长
      if (dataStore.gameRecords.length > 5000) {
        dataStore.gameRecords = dataStore.gameRecords.slice(-5000);
      }
      persistGameRecords();

      // 积分奖励：胜利额外奖励 WIN_REWARD 积分
      let points = null;
      let pointsEarned = 0;
      if (result === 'win') {
        const user = findUser(req.user);
        if (user) {
          pointsEarned = WIN_REWARD;
          user.points = (Number(user.points) || 0) + pointsEarned;
          persistUsers();
          points = user.points;
        }
      }

      res.json({ success: true, record, points, pointsEarned });
    } catch (error) {
      console.error('Game record save failed:', error.message);
      res.status(500).json({ success: false, error: '保存对局记录失败' });
    }
  });

  /**
   * GET /api/game/leaderboard
   * 全服排行榜（按累计得分排序，取前 50）
   */
  router.get('/leaderboard', (req, res) => {
    const stats = {};
    dataStore.gameRecords.forEach((r) => {
      const key = r.userId;
      if (!stats[key]) {
        stats[key] = {
          userId: key,
          username: r.username || '玩家',
          games: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          score: 0,
          bestOpponentName: null,
          lastPlayedAt: r.createdAt,
        };
      }
      const s = stats[key];
      s.games += 1;
      if (r.result === 'win') s.wins += 1;
      else if (r.result === 'lose') s.losses += 1;
      else s.draws += 1;
      s.score += Number(r.score) || 0;
      if (r.result === 'win' && (!s.bestOpponentName || r.score > s.bestScore)) {
        s.bestOpponentName = r.opponentName;
        s.bestScore = r.score;
      }
      if (new Date(r.createdAt) > new Date(s.lastPlayedAt)) {
        s.lastPlayedAt = r.createdAt;
      }
    });

    const leaderboard = Object.values(stats)
      .sort((a, b) => b.score - a.score || b.wins - a.wins)
      .slice(0, 50)
      .map((entry, index) => ({ rank: index + 1, ...entry }));

    res.json({ success: true, leaderboard, totalPlayers: leaderboard.length });
  });

  /**
   * GET /api/game/my
   * 当前用户最近的对局记录
   */
  router.get('/my', authMiddleware, (req, res) => {
    const records = dataStore.gameRecords
      .filter((r) => r.userId === String(req.user.id))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50);
    res.json({ success: true, records });
  });

  return router;
};

export default createGameRoutes;
