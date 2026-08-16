import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import { gameAPI } from '../services/api'

// ========== 宠物数据（对手从弱到强，8 级难度递增） ==========
const OPPONENTS = [
  { id: 'kitten', name: '奶猫', emoji: '🐱', hp: 60, atk: 8,  tier: 1, desc: '软萌新星，叫声奶声奶气', color: 'from-pink-400 to-rose-500' },
  { id: 'puppy',  name: '奶狗', emoji: '🐶', hp: 80, atk: 11, tier: 2, desc: '活力汪汪，初生牛犊不怕虎', color: 'from-amber-400 to-orange-500' },
  { id: 'chick',  name: '战斗鸡', emoji: '🐔', hp: 95, atk: 14, tier: 3, desc: '咯咯咯，啄得你找不着北', color: 'from-yellow-400 to-lime-500' },
  { id: 'fox',    name: '赤狐', emoji: '🦊', hp: 110, atk: 17, tier: 4, desc: '狡猾猎手，叫声狡黠', color: 'from-orange-400 to-red-500' },
  { id: 'wolf',   name: '灰狼', emoji: '🐺', hp: 130, atk: 21, tier: 5, desc: '月下长嚎，荒野之王', color: 'from-gray-400 to-slate-600' },
  { id: 'tiger',  name: '猛虎', emoji: '🐯', hp: 150, atk: 26, tier: 6, desc: '森林霸主，一声虎啸震山林', color: 'from-amber-500 to-orange-600' },
  { id: 'dino',   name: '霸王龙', emoji: '🦖', hp: 175, atk: 32, tier: 7, desc: '远古霸主，嘶吼如雷', color: 'from-emerald-500 to-green-700' },
  { id: 'dragon', name: '神龙', emoji: '🐉', hp: 200, atk: 40, tier: 8, desc: '终极传说，龙吟震九天', color: 'from-cyan-400 to-blue-600' },
]

// 玩家默认宠物（可用用户宠物 emoji 覆盖）
const PLAYER_DEFAULT = { name: '我的宠物', emoji: '🐾', hp: 150, atk: 20, color: 'from-cyber-blue to-cyber-purple' }

const SOUND_WORDS = ['汪汪汪！', '喵呜~！', '嗷呜——！', '吼吼吼！', '哇啊——！', '呱！呱！']

export default function GamePage() {
  const { user, pet } = useStore()
  const [stage, setStage] = useState('select') // select | battle | result
  const [opponent, setOpponent] = useState(null)
  const [playerHp, setPlayerHp] = useState(0)
  const [oppHp, setOppHp] = useState(0)
  const [energy, setEnergy] = useState(0)       // 蓄力能量 0-100
  const [charging, setCharging] = useState(false)
  const [volume, setVolume] = useState(0)       // 实时音量 0-1
  const [round, setRound] = useState(0)
  const [aiThinking, setAiThinking] = useState(false)
  const [waves, setWaves] = useState([])        // 攻击波动画
  const [log, setLog] = useState([])
  const [result, setResult] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [myRecords, setMyRecords] = useState([])
  const [loadingLb, setLoadingLb] = useState(false)
  const [micReady, setMicReady] = useState(false)
  const [saving, setSaving] = useState(false)

  const playerRef = useRef({ ...PLAYER_DEFAULT, emoji: pet?.emoji || pet?.type || '🐾', name: pet?.name || '我的宠物' })
  const energyRef = useRef(0)
  const chargingRef = useRef(false)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const rafRef = useRef(null)
  const oppHpRef = useRef(0)
  const playerHpRef = useRef(0)
  const gameOverRef = useRef(false)
  const [isOver, setIsOver] = useState(false)

  // ========== 麦克风音量检测 ==========
  const stopMic = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {})
    }
    audioCtxRef.current = null
    analyserRef.current = null
    setMicReady(false)
  }, [])

  const initMic = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)
      audioCtxRef.current = audioCtx
      analyserRef.current = analyser
      setMicReady(true)

      const data = new Uint8Array(analyser.frequencyBinCount)
      const sample = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) sum += data[i]
        const vol = Math.min(1, (sum / data.length) / 128)
        setVolume(vol)
        if (chargingRef.current && vol > 0.12) {
          energyRef.current = Math.min(100, energyRef.current + vol * 3.2)
          setEnergy(energyRef.current)
        }
        rafRef.current = requestAnimationFrame(sample)
      }
      rafRef.current = requestAnimationFrame(sample)
    } catch (err) {
      console.warn('Mic unavailable, fallback to press-hold mode:', err)
      setMicReady(false)
    }
  }, [])

  useEffect(() => {
    return () => {
      stopMic()
    }
  }, [stopMic])

  // ========== 开始战斗 ==========
  const startBattle = (opp) => {
    setOpponent(opp)
    setPlayerHp(150)
    setOppHp(opp.hp)
    playerHpRef.current = 150
    oppHpRef.current = opp.hp
    setRound(1)
    setLog([{ who: 'system', text: `⚔️ 挑战开始！你的宠物 vs ${opp.name}` }])
    setResult(null)
    setWaves([])
    gameOverRef.current = false
    setIsOver(false)
    setStage('battle')
    initMic()
  }

  // ========== 攻击波 ==========
  const fireWave = (from, power) => {
    const id = Date.now() + Math.random()
    setWaves((w) => [...w, { id, from, power }])
    setTimeout(() => setWaves((w) => w.filter((x) => x.id !== id)), 900)
  }

  const dealDamage = (side, dmg) => {
    if (side === 'opp') {
      oppHpRef.current = Math.max(0, oppHpRef.current - dmg)
      setOppHp(oppHpRef.current)
    } else {
      playerHpRef.current = Math.max(0, playerHpRef.current - dmg)
      setPlayerHp(playerHpRef.current)
    }
  }

  const checkGameOver = () => {
    if (gameOverRef.current) return true
    if (oppHpRef.current <= 0) {
      gameOverRef.current = true
      finishGame('win')
      return true
    }
    if (playerHpRef.current <= 0) {
      gameOverRef.current = true
      finishGame('lose')
      return true
    }
    return false
  }

  // ========== AI 回合 ==========
  const aiTurn = useCallback(() => {
    setAiThinking(true)
    const opp = OPPONENTS.find((o) => o.id === opponent?.id) || opponent
    setTimeout(() => {
      setLog((l) => [...l, { who: 'opp', text: `${SOUND_WORDS[Math.floor(Math.random() * SOUND_WORDS.length)]}（${opp?.name}）` }])
      fireWave('opp', 1)
      const dmg = Math.round(opp.atk * (0.75 + Math.random() * 0.6))
      dealDamage('player', dmg)
      setLog((l) => [...l, { who: 'info', text: `💥 你受到 ${dmg} 点伤害！` }])
      setAiThinking(false)
      setRound((r) => r + 1)
      setTimeout(() => checkGameOver(), 300)
    }, 1200)
  }, [opponent])

  // ========== 玩家攻击（松开按钮） ==========
  const releaseAttack = () => {
    if (!chargingRef.current) return
    chargingRef.current = false
    setCharging(false)
    const e = Math.max(5, energyRef.current)
    energyRef.current = 0
    setEnergy(0)
    setVolume(0)

    // 攻击力 = 基础攻击 × (0.6 + 蓄力/100 × 2.4)
    const power = Math.round(playerRef.current.atk * (0.6 + (e / 100) * 2.4))
    fireWave('player', e / 100)
    dealDamage('opp', power)
    setLog((l) => [...l, { who: 'player', text: `${SOUND_WORDS[Math.floor(Math.random() * SOUND_WORDS.length)]} 声浪攻击！` }])
    setLog((l) => [...l, { who: 'info', text: `💥 造成 ${power} 点伤害！` }])
    setTimeout(() => {
      if (!checkGameOver()) aiTurn()
    }, 500)
  }

  const startCharging = () => {
    if (isOver || gameOverRef.current || aiThinking) return
    chargingRef.current = true
    setCharging(true)
    // 无声卡兜底：按住也能缓慢蓄力
    const fallback = setInterval(() => {
      if (chargingRef.current) {
        energyRef.current = Math.min(100, energyRef.current + 1.6)
        setEnergy(energyRef.current)
      }
    }, 120)
    window.__chargeTimer = fallback
  }

  const endCharging = () => {
    if (window.__chargeTimer) clearInterval(window.__chargeTimer)
    releaseAttack()
  }

  // ========== 结算 ==========
  const finishGame = (win) => {
    setIsOver(true)
    setAiThinking(false)
    const score = win
      ? 100 * opponent.tier + Math.round(playerHpRef.current * 1.5)
      : Math.round(opponent.hp - oppHpRef.current) * 2
    const res = { win, score, opponentId: opponent.id, opponentName: opponent.name }
    setResult(res)
    setStage('result')
    stopMic()
    saveRecord(res)
  }

  const saveRecord = async (res) => {
    setSaving(true)
    try {
      await gameAPI.saveRecord({
        opponentId: res.opponentId,
        opponentName: res.opponentName,
        result: res.win ? 'win' : 'lose',
        damageDealt: Math.round(opponent.hp - oppHpRef.current),
        damageTaken: Math.round(150 - playerHpRef.current),
        score: res.score,
      })
    } catch (err) {
      console.warn('Save record failed:', err.message)
    } finally {
      setSaving(false)
      loadLeaderboard()
    }
  }

  const loadLeaderboard = useCallback(async () => {
    setLoadingLb(true)
    try {
      const [lb, my] = await Promise.all([gameAPI.getLeaderboard(), gameAPI.getMyRecords()])
      setLeaderboard(lb.data.leaderboard || [])
      setMyRecords(my.data.records || [])
    } catch (err) {
      console.warn('Load leaderboard failed:', err.message)
    } finally {
      setLoadingLb(false)
    }
  }, [])

  useEffect(() => {
    if (stage === 'select') loadLeaderboard()
  }, [stage, loadLeaderboard])

  const retry = () => {
    setStage('select')
    setOpponent(null)
    setResult(null)
  }

  const formatTime = (iso) => {
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  // ========== 选择对手界面 ==========
  if (stage === 'select') {
    return (
      <div className="min-h-screen gradient-bg text-white pb-28">
        <div className="p-4">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold neon-text text-center"
          >
            🎮 宠物叫声大作战
          </motion.h1>
          <p className="text-center text-cyber-blue/70 text-sm mt-1 mb-4">
            对准麦克风，吼得越响，攻击波越强！
          </p>

          {/* 难度关卡选择 */}
          <div className="grid grid-cols-2 gap-3">
            {OPPONENTS.map((opp, i) => (
              <motion.button
                key={opp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => startBattle(opp)}
                className={`relative p-4 rounded-2xl bg-gradient-to-br ${opp.color} bg-white/5 border border-white/10 overflow-hidden group text-left`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-3xl drop-shadow-lg">{opp.emoji}</span>
                  <span className="px-2 py-0.5 rounded-full bg-black/30 text-[10px] font-bold">LV.{opp.tier}</span>
                </div>
                <div className="font-bold text-sm">{opp.name}</div>
                <div className="text-[11px] opacity-80 mt-0.5">{opp.desc}</div>
                <div className="flex gap-2 mt-2 text-[10px] text-white/80">
                  <span className="px-1.5 py-0.5 rounded bg-black/25">❤️ {opp.hp}</span>
                  <span className="px-1.5 py-0.5 rounded bg-black/25">⚔️ {opp.atk}</span>
                </div>
                {i < 3 && (
                  <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/80 text-white">新手</span>
                )}
                {i >= 5 && (
                  <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/80 text-white">BOSS</span>
                )}
              </motion.button>
            ))}
          </div>

          {/* 排行榜 */}
          <div className="mt-6 glass-effect rounded-2xl border border-cyber-blue/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold neon-text">🏆 全服排行榜</h3>
              <span className="text-xs text-cyber-blue/60">{micReady ? '🎙️ 麦克风已就绪' : ''}</span>
            </div>
            {loadingLb ? (
              <p className="text-center text-white/40 text-sm py-4">加载中...</p>
            ) : leaderboard.length === 0 ? (
              <p className="text-center text-white/40 text-sm py-4">还没有对战记录，快来拿下第一名！</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((entry) => (
                  <div key={entry.userId} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${entry.rank === 1 ? 'bg-yellow-500' : entry.rank === 2 ? 'bg-gray-300 text-gray-700' : entry.rank === 3 ? 'bg-amber-600' : 'bg-white/10'}`}>
                      {entry.rank}
                    </span>
                    <span className="text-sm font-medium flex-1 truncate">{entry.username}</span>
                    <span className="text-xs text-cyber-blue/80">{entry.wins}胜</span>
                    <span className="text-sm font-bold text-cyber-yellow">⭐{entry.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 我的战绩 */}
          {myRecords.length > 0 && (
            <div className="mt-4 glass-effect rounded-2xl border border-cyber-blue/30 p-4">
              <h3 className="font-bold neon-text mb-3">📜 我的战绩</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {myRecords.slice(0, 10).map((r) => (
                  <div key={r.id} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-white/5">
                    <span>{r.result === 'win' ? '✅' : '❌'}</span>
                    <span className="flex-1 truncate">vs {r.opponentName}</span>
                    <span className="text-cyber-yellow">+{r.score}</span>
                    <span className="text-white/30">{formatTime(r.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ========== 战斗界面 ==========
  if (stage === 'battle') {
    const opp = opponent
    const hpPercent = (p) => Math.max(0, Math.min(100, p))
    return (
      <div className="min-h-screen gradient-bg text-white pb-40 relative overflow-hidden">
        {/* 背景声波装饰 */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 3, repeat: Infinity }} className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full border-2 border-cyber-blue" />
          <motion.div animate={{ scale: [1.3, 1, 1.3] }} transition={{ duration: 4, repeat: Infinity }} className="absolute bottom-1/3 right-1/4 w-56 h-56 rounded-full border-2 border-cyber-pink" />
        </div>

        <div className="relative p-4">
          <div className="flex items-center justify-between mb-2">
            <button onClick={retry} className="text-white/40 hover:text-white text-sm px-3 py-1 rounded-lg bg-white/5 border border-white/10">← 退出</button>
            <span className="text-sm text-cyber-blue/70">第 {round} 回合</span>
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${micReady ? 'bg-emerald-500/30 text-emerald-300' : 'bg-amber-500/30 text-amber-300'}`}>
              {micReady ? '🎙️ 麦克风在线' : '🫦 按住蓄力'}
            </span>
          </div>

          {/* 对战区域 */}
          <div className="relative flex items-center justify-between px-2 pt-6 pb-2">
            {/* 玩家 */}
            <div className="text-center flex-1">
              <motion.div
                animate={aiThinking ? { x: [-8, 8, -8], transition: { duration: 0.3, repeat: Infinity } } : {}}
                className="text-6xl drop-shadow-2xl"
              >
                {playerRef.current.emoji}
              </motion.div>
              <div className="text-xs font-bold mt-1">{playerRef.current.name}</div>
            </div>

            {/* 战场中央：VS */}
            <div className="relative flex-1 flex flex-col items-center">
              <motion.div
                animate={{ scale: aiThinking ? 1.2 : 1 }}
                className="text-2xl font-black text-cyber-pink neon-text my-2"
              >
                VS
              </motion.div>

              {/* 攻击波 */}
              <div className="absolute inset-0 pointer-events-none">
                {waves.map((w) => (
                  <motion.div
                    key={w.id}
                    initial={{ x: w.from === 'player' ? -90 : 90, opacity: 0, scale: 0.3 }}
                    animate={{ x: w.from === 'player' ? 90 : -90, opacity: [0, 1, 1, 0], scale: [0.3, 1.4, 1.8, 2.2] }}
                    transition={{ duration: 0.85, ease: 'easeOut' }}
                    className={`absolute top-1/2 -translate-y-1/2 w-16 h-16 rounded-full blur-sm ${w.from === 'player' ? 'bg-cyber-blue/80' : 'bg-red-500/80'}`}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-xl">🌊</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 对手 */}
            <div className="text-center flex-1">
              <motion.div
                animate={waves.length > 0 && !isOver ? { x: [-6, 6, -6], transition: { duration: 0.2, repeat: 2 } } : {}}
                className="text-6xl drop-shadow-2xl"
              >
                {opp.emoji}
              </motion.div>
              <div className="text-xs font-bold mt-1">{opp.name}</div>
            </div>
          </div>

          {/* 血量条 */}
          <div className="flex gap-3 mt-4">
            <div className="flex-1">
              <div className="flex justify-between text-[10px] mb-1">
                <span>{playerRef.current.name}</span>
                <span>{Math.ceil(playerHp)}</span>
              </div>
              <div className="h-3 rounded-full bg-black/40 overflow-hidden border border-white/10">
                <motion.div
                  animate={{ width: `${hpPercent(playerHp / 150 * 100)}%` }}
                  className="h-full bg-gradient-to-r from-cyber-blue to-cyber-purple transition-all"
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[10px] mb-1">
                <span>{opp.name}</span>
                <span>{Math.ceil(oppHp)}</span>
              </div>
              <div className="h-3 rounded-full bg-black/40 overflow-hidden border border-white/10">
                <motion.div
                  animate={{ width: `${hpPercent(oppHp / opp.hp * 100)}%` }}
                  className="h-full bg-gradient-to-r from-red-500 to-pink-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* 蓄力能量条 */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] mb-1">
              <span>⚡ 蓄力能量</span>
              <span>{Math.round(energy)}%</span>
            </div>
            <div className="h-4 rounded-full bg-black/40 overflow-hidden border border-cyber-blue/30">
              <motion.div
                animate={{ width: `${energy}%` }}
                transition={{ duration: 0.05 }}
                className={`h-full bg-gradient-to-r ${energy > 70 ? 'from-red-500 to-orange-500' : energy > 35 ? 'from-yellow-400 to-orange-500' : 'from-emerald-400 to-cyber-blue'}`}
              />
            </div>
          </div>

          {/* 战斗信息流 */}
          <div className="mt-3 h-24 glass-effect rounded-xl border border-white/10 p-2 overflow-y-auto">
            {log.slice(-4).map((l, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`text-xs mb-1 ${l.who === 'player' ? 'text-cyber-blue' : l.who === 'opp' ? 'text-red-400' : 'text-white/50'}`}
              >
                {l.text}
              </motion.p>
            ))}
          </div>

          {/* 吼叫按钮 */}
          <div className="mt-4 flex flex-col items-center">
            {aiThinking ? (
              <div className="py-5 px-8 rounded-2xl bg-white/5 border border-red-500/30 text-center">
                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.4, repeat: Infinity }} className="text-3xl">👂</motion.span>
                <p className="text-sm text-red-300 mt-1">对方正在吼叫攻击...</p>
              </div>
            ) : charging ? (
              <motion.button
                onPointerUp={endCharging}
                onPointerLeave={endCharging}
                animate={{ scale: 1 + energy / 100 * 0.25 }}
                className="w-40 h-40 rounded-full bg-gradient-to-br from-cyber-blue to-cyber-purple flex flex-col items-center justify-center shadow-2xl shadow-cyber-blue/50 border-4 border-white/20 active:from-cyber-pink active:to-red-500"
              >
                <span className="text-4xl">📢</span>
                <span className="font-bold text-sm mt-1">吼！！！</span>
                <span className="text-[10px] opacity-80">{Math.round(energy)}% 松开发射</span>
              </motion.button>
            ) : (
              <motion.button
                onPointerDown={startCharging}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-40 h-40 rounded-full bg-gradient-to-br from-emerald-400 to-cyber-blue flex flex-col items-center justify-center shadow-2xl border-4 border-white/20"
              >
                <span className="text-4xl">🐾</span>
                <span className="font-bold text-sm mt-1">按住吼叫！</span>
                <span className="text-[10px] opacity-80">用力学它的叫声</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ========== 结算界面 ==========
  if (stage === 'result' && result) {
    return (
      <div className="min-h-screen gradient-bg text-white pb-28">
        <div className="p-6 flex flex-col items-center pt-16">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12 }}
            className="text-8xl mb-4"
          >
            {result.win ? '🏆' : '💔'}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold neon-text"
          >
            {result.win ? '胜利！' : '惜败...'}
          </motion.h1>
          <p className="text-white/50 mt-2 text-sm">对战 {result.opponentName}</p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 glass-effect rounded-2xl border border-cyber-blue/30 p-6 text-center w-full max-w-xs"
          >
            <div className="text-4xl font-black text-cyber-yellow">⭐ {result.score}</div>
            <div className="text-xs text-cyber-blue/70 mt-1">得分已保存到云端</div>
            {saving && <div className="text-xs text-white/40 mt-2">保存中...</div>}
          </motion.div>

          <div className="flex gap-3 mt-8 w-full max-w-xs">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={retry}
              className="flex-1 py-3 rounded-xl bg-white/10 border border-white/15 text-sm font-bold"
            >
              🎯 再战一场
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => { setOpponent(result.win && opponent ? OPPONENTS.find((o) => o.tier === opponent.tier + 1) || opponent : opponent); startBattle(result.win && opponent ? OPPONENTS.find((o) => o.tier === opponent.tier + 1) || opponent : opponent) }}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyber-blue to-cyber-purple text-sm font-bold shadow-lg"
            >
              ⬆️ 挑战更强
            </motion.button>
          </div>

          {/* 排行榜 */}
          <div className="mt-8 w-full max-w-xs glass-effect rounded-2xl border border-cyber-blue/30 p-4">
            <h3 className="font-bold neon-text mb-3 text-center">🏆 全服排行榜</h3>
            {loadingLb ? (
              <p className="text-center text-white/40 text-sm">加载中...</p>
            ) : leaderboard.length === 0 ? (
              <p className="text-center text-white/40 text-sm">暂无记录</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((entry) => (
                  <div key={entry.userId} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${entry.rank === 1 ? 'bg-yellow-500' : entry.rank === 2 ? 'bg-gray-300 text-gray-700' : entry.rank === 3 ? 'bg-amber-600' : 'bg-white/10'}`}>
                      {entry.rank}
                    </span>
                    <span className="text-sm font-medium flex-1 truncate">{entry.username}</span>
                    <span className="text-xs text-cyber-blue/80">{entry.wins}胜</span>
                    <span className="text-sm font-bold text-cyber-yellow">⭐{entry.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
