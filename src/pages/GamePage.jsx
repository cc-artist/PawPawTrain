import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import { gameAPI } from '../services/api'
import { getSharedContext, unlockAudio, getAudioStatus, ensureAudio, subscribeAudioStatus } from '../utils/audio'

// ========== 宠物数据（对手从弱到强，8 级难度递增） ==========
// sounds: 该宠物标准叫声关键词（SpeechRecognition 命中判定"叫声像"）
// soundsLabel: 展示给玩家模仿的目标叫声
const OPPONENTS = [
  { id: 'kitten', name: 'Kitten', emoji: '🐱', hp: 60, atk: 8,  tier: 1, desc: 'Soft rookie with a squeaky call', color: 'from-pink-400 to-rose-500', sounds: ['喵', '咪'], soundsLabel: '喵~喵~' },
  { id: 'puppy',  name: 'Puppy', emoji: '🐶', hp: 80, atk: 11, tier: 2, desc: 'Energetic barker, bold as a rookie', color: 'from-amber-400 to-orange-500', sounds: ['汪', '旺'], soundsLabel: '汪汪汪！' },
  { id: 'chick',  name: 'Battle Chick', emoji: '🐔', hp: 95, atk: 14, tier: 3, desc: 'Clucks & pecks, spins you around', color: 'from-yellow-400 to-lime-500', sounds: ['咯', '咕', '喔'], soundsLabel: '咯咯咯！' },
  { id: 'fox',    name: 'Red Fox', emoji: '🦊', hp: 110, atk: 17, tier: 4, desc: 'Cunning hunter with a sly call', color: 'from-orange-400 to-red-500', sounds: ['呜', '嗷', '喔'], soundsLabel: '嗷呜~' },
  { id: 'wolf',   name: 'Grey Wolf', emoji: '🐺', hp: 130, atk: 21, tier: 5, desc: 'Howls at the moon, king of the wild', color: 'from-gray-400 to-slate-600', sounds: ['嗷', '呜'], soundsLabel: '嗷呜——！' },
  { id: 'tiger',  name: 'Fierce Tiger', emoji: '🐯', hp: 150, atk: 26, tier: 6, desc: 'Forest apex, a roar that shakes the woods', color: 'from-amber-500 to-orange-600', sounds: ['吼', '嗷', '唬'], soundsLabel: '吼吼吼！' },
  { id: 'dino',   name: 'T-Rex', emoji: '🦖', hp: 175, atk: 32, tier: 7, desc: 'Ancient apex predator, thunderous roar', color: 'from-emerald-500 to-green-700', sounds: ['吼', '嘶', '哈'], soundsLabel: '吼嘶——！' },
  { id: 'dragon', name: 'Dragon', emoji: '🐉', hp: 200, atk: 40, tier: 8, desc: 'Final legend, a cry that shakes the skies', color: 'from-cyan-400 to-blue-600', sounds: ['嗷', '吼', '鸣'], soundsLabel: '嗷呜吼——！' },
]

// 玩家默认宠物（可用用户宠物 emoji 覆盖）
const PLAYER_DEFAULT = { name: 'My Pet', emoji: '🐾', hp: 150, atk: 20, color: 'from-cyber-blue to-cyber-purple' }

const SOUND_WORDS = ['汪汪汪！', '喵呜~！', '嗷呜——！', '吼吼吼！', '哇啊——！', '呱！呱！']

// ========== 积分规则（与后端 backend/src/routes/game.js 保持一致） ==========
const ENTRY_FEE = 20   // 每局开局消耗积分
const WIN_REWARD = 40  // 每局胜利奖励积分

// ========== 宠物叫声合成参数（Web Audio 合成，零音频资源） ==========
// freq/freqEnd: 起始/结束频率(Hz)；dur: 单音时长(s)；count: 重复次数；gap: 间隔；
// noise: 噪声强度(虎啸/龙吼等低频咆哮感)；vol: 相对响度
const SOUND_PATTERNS = {
  kitten: { type: 'sine',     freq: 620,  freqEnd: 980,  dur: 0.26, count: 2, gap: 0.14, vol: 0.5 },
  puppy:  { type: 'square',   freq: 430,  freqEnd: 260,  dur: 0.16, count: 2, gap: 0.16, vol: 0.4 },
  chick:  { type: 'triangle', freq: 1500, freqEnd: 1750, dur: 0.06, count: 5, gap: 0.09, vol: 0.35 },
  fox:    { type: 'sawtooth', freq: 480,  freqEnd: 820,  dur: 0.55, count: 1, gap: 0,    vol: 0.35 },
  wolf:   { type: 'sawtooth', freq: 380,  freqEnd: 760,  dur: 1.0,  count: 1, gap: 0,    vol: 0.4 },
  tiger:  { type: 'sawtooth', freq: 95,   freqEnd: 135,  dur: 0.7,  count: 2, gap: 0.25, noise: 0.5, vol: 0.5 },
  dino:   { type: 'sawtooth', freq: 70,   freqEnd: 110,  dur: 0.9,  count: 1, gap: 0,    noise: 0.7, vol: 0.5 },
  dragon: { type: 'sawtooth', freq: 180,  freqEnd: 950,  dur: 1.2,  count: 2, gap: 0.12, noise: 0.4, vol: 0.5 },
  // 小型宠物 / 特殊宠物的叫声合成模式（供玩家宠物按 type 映射使用）
  squeak: { type: 'sine',     freq: 2100, freqEnd: 2600, dur: 0.07, count: 4, gap: 0.06, vol: 0.32 },
  glub:   { type: 'sine',     freq: 220,  freqEnd: 120,  dur: 0.12, count: 3, gap: 0.1,  vol: 0.35 },
  croak:  { type: 'sawtooth', freq: 320,  freqEnd: 200,  dur: 0.18, count: 2, gap: 0.22, vol: 0.35 },
  hiss:   { type: 'triangle', freq: 2800, freqEnd: 3000, dur: 0.5,  count: 1, gap: 0,    noise: 0.5, vol: 0.3 },
}

// 玩家宠物 type → 叫声合成模式映射。
// 若用户在宠物页采集/上传了真实叫声（pet.voice），优先播放真实录音，否则按此映射合成。
const PLAYER_SOUND_MAP = {
  cat: 'kitten',
  dog: 'puppy',
  bird: 'chick',
  parrot: 'chick',
  rabbit: 'squeak',
  hamster: 'squeak',
  chinchilla: 'squeak',
  guinea_pig: 'squeak',
  ferret: 'squeak',
  hedgehog: 'squeak',
  fish: 'glub',
  goldfish: 'glub',
  axolotl: 'glub',
  frog: 'croak',
  turtle: 'croak',
  lizard: 'hiss',
  gecko: 'hiss',
  snake: 'hiss',
  crab: 'hiss',
  scorpion: 'hiss',
  tarantula: 'hiss',
}

export default function GamePage() {
  const { user, pet, updateUserPoints } = useStore()
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
  const [pointsInfo, setPointsInfo] = useState(null) // 结算积分变动信息 { earned, balance }
  const [speechSupported, setSpeechSupported] = useState(false) // 浏览器是否支持叫声识别
  const [heardText, setHeardText] = useState('')               // 实时识别到的文本
  const [matchMsg, setMatchMsg] = useState(null)               // "叫声像"命中提示
  const [menuVoiceOn, setMenuVoiceOn] = useState(false)        // 菜单声控是否开启
  const [menuHeard, setMenuHeard] = useState('')               // 菜单声控识别到的文本
  const [menuMsg, setMenuMsg] = useState('')                   // 菜单声控状态提示
  const [selIdx, setSelIdx] = useState(0)                      // 菜单当前高亮对手
  const [bgMuted, setBgMuted] = useState(false)                // 背景叫声提示是否静音
  const [audioInfo, setAudioInfo] = useState('')               // 音频状态诊断信息
  const audioInfoRef = useRef('')                              // 去重：避免后台叫声循环每 2.8s 触发 setState 重渲染
  const setAudioInfoDedup = useCallback((msg) => {
    if (audioInfoRef.current !== msg) {
      audioInfoRef.current = msg
      setAudioInfo(msg)
    }
  }, [])

  const playerRef = useRef({ ...PLAYER_DEFAULT, emoji: pet?.emoji || pet?.type || '🐾', name: pet?.name || 'My Pet' })
  const petTypeRef = useRef(pet?.type || 'cat')  // 玩家宠物类型（同步 ref，供背景叫声合成使用）
  const petVoiceRef = useRef(pet?.voice || null) // 玩家宠物真实叫声 URL（优先播放）
  const energyRef = useRef(0)
  const chargingRef = useRef(false)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const rafRef = useRef(null)
  const recognitionRef = useRef(null) // 战斗 SpeechRecognition 实例
  const lastHitRef = useRef(0)        // 上次命中时间戳
  const sfxCtxRef = useRef(null)      // 叫声合成 AudioContext
  const bgCallTimerRef = useRef(null) // 背景叫声循环定时器
  const bgMutedRef = useRef(false)    // 背景叫声静音（同步 ref，供定时器读取）
  const menuRecRef = useRef(null)     // 菜单声控 SpeechRecognition 实例
  const menuVoiceOnRef = useRef(false)// 菜单声控是否开启（同步 ref）
  const menuHandleRef = useRef(false) // 菜单指令防抖
  const selIdxRef = useRef(0)         // 当前高亮索引（同步 ref，供识别回调读取）
  const oppHpRef = useRef(0)
  const playerHpRef = useRef(0)
  const gameOverRef = useRef(false)
  const [isOver, setIsOver] = useState(false)
  const stageRef = useRef('select')  // 当前阶段（同步 ref，供音频解锁订阅读取）
  const opponentRef = useRef(null)   // 当前对手（同步 ref，供音频解锁订阅读取）
  const startingRef = useRef(false)  // 开局防重入：等待后端扣积分期间禁止重复开局

  // ========== 宠物叫声合成播放（背景提示音 + 试听） ==========
  // 使用全局共享 AudioContext（src/utils/audio.js）：任意页面/手势解锁后，本页立即有声
  const ensureSfxCtx = useCallback(() => {
    try {
      unlockAudio() // 手势内解锁全局音频
      const ctx = getSharedContext()
      if (!ctx) {
        setAudioInfoDedup('⚠️ Web Audio is not supported by this browser')
        return null
      }
      const st = getAudioStatus()
      setAudioInfoDedup(st.msg)
      if (st.state === 'running') console.log('[GameAudio] shared AudioContext running')
      return ctx
    } catch (err) {
      console.warn('[GameAudio] init failed:', err)
      setAudioInfoDedup('⚠️ Audio initialization failed')
      return null
    }
  }, [setAudioInfoDedup])

  const playedOnceRef = useRef(false) // 首次播放日志标记
  // 异步播放宠物叫声：先确保共享 AudioContext 处于 running（手势内可解锁），
  // 整个合成逻辑包在 try-catch 中——任何异常都只返回 false，绝不向上抛出，
  // 从而保证 startBattle 后续流程 / 背景叫声循环不被中断。
  const playPetCall = useCallback(async (opp, volume = 0.16) => {
    if (!opp || volume <= 0) return false
    const ctx = await ensureAudio()
    if (!ctx) {
      setAudioInfoDedup('⚠️ Audio was blocked by the browser. Tap the ROAR button to enable sound')
      return false
    }
    if (!playedOnceRef.current) {
      playedOnceRef.current = true
      console.log('[GameAudio] first play:', opp.name, 'state:', ctx.state)
    }
    try {
      const p = SOUND_PATTERNS[opp.id] || SOUND_PATTERNS.kitten
      const t0 = ctx.currentTime
      const master = ctx.createGain()
      master.gain.value = volume
      master.connect(ctx.destination)
      // 噪声层：虎啸/龙吼等低频咆哮感
      if (p.noise) {
        const dur = p.dur * 1.3
        const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate)
        const data = buf.getChannelData(0)
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
        const src = ctx.createBufferSource()
        src.buffer = buf
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 450
        const g = ctx.createGain()
        g.gain.setValueAtTime(p.noise * volume * 2, t0)
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
        src.connect(filter).connect(g).connect(master)
        src.start(t0)
      }
      // 主音层
      const count = p.count || 1
      for (let i = 0; i < count; i++) {
        const t = t0 + i * (p.dur + (p.gap || 0.05))
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = p.type
        osc.frequency.setValueAtTime(Math.max(30, p.freq), t)
        if (p.freqEnd && p.freqEnd !== p.freq) {
          osc.frequency.exponentialRampToValueAtTime(Math.max(30, p.freqEnd), t + p.dur)
        }
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime((p.vol || 0.4) * volume * 3, t + 0.02)
        g.gain.exponentialRampToValueAtTime(0.0001, t + p.dur)
        osc.connect(g).connect(master)
        osc.start(t)
        osc.stop(t + p.dur + 0.06)
      }
      setAudioInfoDedup('🔊 Audio ready')
      return true
    } catch (err) {
      console.warn('[GameAudio] play failed:', err)
      return false
    }
  }, [setAudioInfoDedup])

  // 战斗界面：低音量循环播放对手叫声提示用户模仿。
  // 循环永不中断：即使播放失败（音频被拦截/未解锁），setTimeout 仍会重新安排，
  // 用户任意一次点击（手势）解锁后，下一轮即可自动恢复播放。
  const startBgCalls = useCallback((opp) => {
    if (bgCallTimerRef.current) {
      clearTimeout(bgCallTimerRef.current)
      bgCallTimerRef.current = null
    }
    if (!opp) return
    const loop = () => {
      if (!bgMutedRef.current) playPetCall(opp, 0.25) // fire-and-forget，内部已捕获所有异常
      bgCallTimerRef.current = setTimeout(loop, 2800)
    }
    bgCallTimerRef.current = setTimeout(loop, 300)
  }, [playPetCall])

  const stopBgCalls = useCallback(() => {
    if (bgCallTimerRef.current) {
      clearTimeout(bgCallTimerRef.current)
      bgCallTimerRef.current = null
    }
  }, [])

  const toggleBgMute = useCallback(() => {
    const next = !bgMutedRef.current
    bgMutedRef.current = next
    setBgMuted(next)
  }, [])

  // ========== 叫声识别（SpeechRecognition，"像不像"判定） ==========
  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null
        recognitionRef.current.onend = null
        recognitionRef.current.onerror = null
        recognitionRef.current.stop()
      } catch (err) { /* already stopped */ }
      recognitionRef.current = null
    }
    setHeardText('')
  }, [])

  // ========== 声控菜单（用模拟叫声 / 语音命令控制选择与开始） ==========
  const stopMenuRec = useCallback(() => {
    if (menuRecRef.current) {
      try {
        menuRecRef.current.onresult = null
        menuRecRef.current.onend = null
        menuRecRef.current.onerror = null
        menuRecRef.current.stop()
      } catch (err) { /* already stopped */ }
      menuRecRef.current = null
    }
    menuVoiceOnRef.current = false
    setMenuVoiceOn(false)
    setMenuHeard('')
  }, [])

  const moveSel = useCallback((delta) => {
    const n = (selIdxRef.current + delta + OPPONENTS.length) % OPPONENTS.length
    selIdxRef.current = n
    setSelIdx(n)
    // 切换后自动试听新宠物叫声，帮助用户模仿
    playPetCall(OPPONENTS[n], 0.3)
    setMenuMsg(`🎯 Selected ${OPPONENTS[n].name} ${OPPONENTS[n].emoji} — say "Start" or mimic its call to battle`)
  }, [playPetCall])

  const initMenuRec = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return false
    try {
      const rec = new SR()
      rec.lang = 'zh-CN'
      rec.continuous = true
      rec.interimResults = true
      rec.maxAlternatives = 3

      rec.onresult = (e) => {
        let text = ''
        for (let i = e.resultIndex; i < e.results.length; i++) text += e.results[i][0].transcript
        const t = text.trim()
        setMenuHeard(t)
        if (!t || menuHandleRef.current || !menuVoiceOnRef.current) return
        // 1) 直接命中某只宠物的叫声关键词 → 立即挑战（用模拟叫声控制开始）
        const bySound = OPPONENTS.find((o) => o.sounds.some((s) => t.includes(s)))
        if (bySound) {
          menuHandleRef.current = true
          setTimeout(() => { menuHandleRef.current = false }, 1500)
          selIdxRef.current = OPPONENTS.indexOf(bySound)
          setSelIdx(selIdxRef.current)
          startBattle(bySound)
          return
        }
        // 2) 命中宠物名字 → 选中该宠物
        const byName = OPPONENTS.find((o) => t.includes(o.name))
        if (byName) {
          menuHandleRef.current = true
          setTimeout(() => { menuHandleRef.current = false }, 1500)
          selIdxRef.current = OPPONENTS.indexOf(byName)
          setSelIdx(selIdxRef.current)
          playPetCall(byName, 0.2)
          setMenuMsg(`🎯 Selected ${byName.name} ${byName.emoji} — say "Start" or mimic its call to battle`)
          return
        }
        // 3) 通用语音命令
        if (/start|begin|go|confirm|fight|开始|开战|确认|选中/.test(t)) {
          const target = OPPONENTS[selIdxRef.current]
          if (target) {
            menuHandleRef.current = true
            setTimeout(() => { menuHandleRef.current = false }, 1500)
            startBattle(target)
          }
          return
        }
        if (/next|下一个|换一个|换|下一/.test(t)) {
          menuHandleRef.current = true
          setTimeout(() => { menuHandleRef.current = false }, 1500)
          moveSel(1)
          return
        }
        if (/prev|previous|上一个|返回|上一/.test(t)) {
          menuHandleRef.current = true
          setTimeout(() => { menuHandleRef.current = false }, 1500)
          moveSel(-1)
          return
        }
      }

      rec.onerror = () => { stopMenuRec() }
      rec.onend = () => {
        if (menuVoiceOnRef.current && menuRecRef.current) {
          try {
            if (menuRecRef.current === rec) rec.start()
          } catch (err) { /* ignore */ }
        }
      }
      menuRecRef.current = rec
      rec.start()
      menuVoiceOnRef.current = true
      setMenuVoiceOn(true)
      setMenuMsg('👂 Voice control ON: mimic a call to battle, say "Next" to switch, "Start" to confirm')
      return true
    } catch (err) {
      console.warn('Menu voice control init failed:', err)
      return false
    }
  }

  const toggleMenuVoice = () => {
    if (menuVoiceOnRef.current) {
      stopMenuRec()
      return
    }
    const ok = initMenuRec()
    if (!ok) {
      setMenuMsg('⚠️ Speech recognition is not supported by this browser')
    } else {
      ensureSfxCtx() // 预热 AudioContext：语音触发的战斗也要能出声
    }
  }

  const initRecognition = useCallback((opp) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setSpeechSupported(false)
      return
    }
    try {
      const rec = new SR()
      rec.lang = 'zh-CN'
      rec.continuous = true
      rec.interimResults = true
      rec.maxAlternatives = 3

      rec.onresult = (e) => {
        if (gameOverRef.current || !chargingRef.current) return
        let text = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          text += e.results[i][0].transcript
        }
        setHeardText(text.trim())
        // 命中目标叫声关键词 → 判定"叫声像" → 能量大幅加成
        const hit = opp.sounds.find((s) => text.includes(s))
        if (hit && energyRef.current < 100) {
          const now = Date.now()
          // 1 秒内重复命中不重复计（防止 interim 结果重复触发）
          if (now - lastHitRef.current > 1000) {
            lastHitRef.current = now
            const bonus = Math.min(30, 100 - energyRef.current)
            energyRef.current = Math.min(100, energyRef.current + bonus)
            setEnergy(energyRef.current)
            setMatchMsg(`🎯 Great call for "${opp.name}"! Energy +${Math.round(bonus)}`)
            setTimeout(() => setMatchMsg(null), 2000)
            setLog((l) => [...l, { who: 'player', text: `🎯 Heard "${text.trim()}" — great mimicry of ${opp.name}! Energy +${Math.round(bonus)}` }])
          }
        }
      }

      rec.onerror = (e) => {
        // not-allowed / service-not-allowed：权限拒绝，静默降级为音量模式
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          stopRecognition()
          setSpeechSupported(false)
        }
      }

      rec.onend = () => {
        // 浏览器超时自动结束后自动重启（战斗未结束且未手动停止）
        if (!gameOverRef.current && recognitionRef.current) {
          try {
            if (recognitionRef.current === rec) rec.start()
          } catch (err) { /* ignore */ }
        }
      }

      recognitionRef.current = rec
      rec.start()
      setSpeechSupported(true)
    } catch (err) {
      console.warn('SpeechRecognition init failed:', err)
      setSpeechSupported(false)
    }
  }, [stopRecognition])

  // ========== 麦克风音量检测 ==========
  const stopMic = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {})
    }
    audioCtxRef.current = null
    analyserRef.current = null
    stopRecognition()
    setMicReady(false)
  }, [stopRecognition])

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

  // 宠物数据可能异步加载（fetchPet / localStorage），同步到 ref 供背景叫声合成使用
  useEffect(() => {
    petTypeRef.current = pet?.type || 'cat'
    petVoiceRef.current = pet?.voice || null
  }, [pet])

  useEffect(() => {
    return () => {
      stopMic()
      stopBgCalls()
      stopMenuRec()
      // 共享 AudioContext 由全局模块管理（其他页面复用），此处不关闭
    }
  }, [stopMic, stopBgCalls, stopMenuRec])

  // ========== 开始战斗 ==========
  const startBattle = async (opp) => {
    if (!opp || startingRef.current) return
    startingRef.current = true
    try {
      // 开局消耗积分（后端校验余额并扣减，积分不足则拒绝开局）
      const resp = await gameAPI.startGame({ tier: opp.tier })
      if (!resp.data?.success) {
        throw new Error(resp.data?.error || `Starting a battle costs ${ENTRY_FEE} points`)
      }
      if (typeof resp.data.points === 'number') {
        updateUserPoints(resp.data.points)
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || `Not enough points. Starting a battle requires ${ENTRY_FEE} points`
      setMenuMsg(`⚠️ ${msg}`)
      alert(`⚠️ ${msg}`)
      startingRef.current = false
      return
    }
    startingRef.current = false
    setPointsInfo(null)
    stopMenuRec()      // 关闭菜单声控，避免与战斗识别冲突
    stopBgCalls()      // 清掉旧的背景叫声循环
    bgMutedRef.current = false
    setBgMuted(false)
    setOpponent(opp)
    setPlayerHp(150)
    setOppHp(opp.hp)
    playerHpRef.current = 150
    oppHpRef.current = opp.hp
    setRound(1)
    setLog([{ who: 'system', text: `⚔️ Battle started! Mimic "${opp.name}"'s call to attack it!` }])
    setResult(null)
    setWaves([])
    setMatchMsg(null)
    setHeardText('')
    gameOverRef.current = false
    setIsOver(false)
    setStage('battle')
    stageRef.current = 'battle'   // 供音频解锁订阅判断当前阶段
    opponentRef.current = opp
    stopMic()                     // 先关闭旧麦克风 AudioContext，避免多次战斗累积超限（Chrome 上限 6 个）
    initMic()
    initRecognition(opp)
    playPetCall(opp, 0.28)  // 手势内立即播放一次（内部先确保 AudioContext running）；被拦截时返回 false，不抛异常
    startBgCalls(opp)       // 背景低音量循环播放对手叫声，提示用户模仿；循环永不中断，解锁后自动恢复
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
      setLog((l) => [...l, { who: 'opp', text: `${SOUND_WORDS[Math.floor(Math.random() * SOUND_WORDS.length)]} (${opp?.name})` }])
      fireWave('opp', 1)
      const dmg = Math.round(opp.atk * (0.75 + Math.random() * 0.6))
      dealDamage('player', dmg)
      setLog((l) => [...l, { who: 'info', text: `💥 You took ${dmg} damage!` }])
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
    setLog((l) => [...l, { who: 'player', text: `${SOUND_WORDS[Math.floor(Math.random() * SOUND_WORDS.length)]} Sonic attack!` }])
    setLog((l) => [...l, { who: 'info', text: `💥 Dealt ${power} damage!` }])
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
    stopBgCalls()
    const score = win
      ? 100 * opponent.tier + Math.round(playerHpRef.current * 1.5)
      : Math.round(opponent.hp - oppHpRef.current) * 2
    const res = { win, score, opponentId: opponent.id, opponentName: opponent.name }
    setResult(res)
    setStage('result')
    stageRef.current = 'result'
    stopMic()
    saveRecord(res)
  }

  const saveRecord = async (res) => {
    setSaving(true)
    try {
      const resp = await gameAPI.saveRecord({
        opponentId: res.opponentId,
        opponentName: res.opponentName,
        result: res.win ? 'win' : 'lose',
        damageDealt: Math.round(opponent.hp - oppHpRef.current),
        damageTaken: Math.round(150 - playerHpRef.current),
        score: res.score,
      })
      const pd = resp.data || {}
      // 胜利奖励积分：同步最新余额
      if (typeof pd.points === 'number') {
        updateUserPoints(pd.points)
      }
      setPointsInfo({
        earned: pd.pointsEarned || 0,
        balance: typeof pd.points === 'number' ? pd.points : (useStore.getState().user?.points ?? 0),
      })
    } catch (err) {
      console.warn('Save record failed:', err.message)
      setPointsInfo({ earned: 0, balance: useStore.getState().user?.points ?? 0, error: true })
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

  // 音频解锁订阅：当用户手势解锁音频（suspended→running）时，
  // 若正处于战斗且背景叫声循环尚未启动，则立即启动。
  // 覆盖「通过声控/非手势进入战斗导致音频被拦截」的场景，确保用户一点击立即恢复背景提示音。
  useEffect(() => {
    const unsub = subscribeAudioStatus((st) => {
      if (st.state === 'running' && stageRef.current === 'battle' && !bgMutedRef.current && !bgCallTimerRef.current) {
        startBgCalls(opponentRef.current)
      }
    })
    return unsub
  }, [startBgCalls])

  const retry = () => {
    stopMic()
    stopRecognition()
    stopBgCalls()
    stopMenuRec()
    setStage('select')
    stageRef.current = 'select'
    setOpponent(null)
    opponentRef.current = null
    setResult(null)
    setPointsInfo(null)
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
            🎮 Pet Call Battle
          </motion.h1>
          <p className="text-center text-cyber-blue/70 text-sm mt-1 mb-4">
            Point at the mic and roar louder for a stronger attack wave!
          </p>

          {/* 积分余额 */}
          <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-cyber-yellow/30 bg-cyber-yellow/10 px-4 py-2">
            <span className="text-xs text-white/70">⭐ My Points</span>
            <span className="text-lg font-black text-cyber-yellow">{user?.points ?? 0}</span>
            <span className="text-[10px] text-white/50">{ENTRY_FEE} pts per battle · {WIN_REWARD} pts on win</span>
          </div>

          {/* 声控菜单 */}
          <div className={`mb-4 rounded-2xl border p-3 transition-colors ${menuVoiceOn ? 'bg-emerald-500/10 border-emerald-400/40' : 'bg-white/5 border-white/10'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-lg ${menuVoiceOn ? 'animate-pulse' : ''}`}>🎤</span>
                <div>
                  <div className="text-sm font-bold">{menuVoiceOn ? 'Voice Menu ON' : 'Voice Menu'}</div>
                  <div className="text-[10px] text-white/50 mt-0.5">
                    {menuVoiceOn ? 'Listening... speak a command or mimic a call' : 'Control selection & start with your own call'}
                  </div>
                </div>
              </div>
              <button
                onClick={toggleMenuVoice}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border flex-shrink-0 ${menuVoiceOn ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-cyber-blue/20 text-cyber-blue border-cyber-blue/40'}`}
              >
                {menuVoiceOn ? '⏹ OFF' : '🎙 ON'}
              </button>
            </div>
            {menuVoiceOn ? (
              <>
                {menuHeard && (
                  <div className="mt-2 text-[11px] text-emerald-300/90">Heard: "{menuHeard}"</div>
                )}
                {menuMsg && (
                  <div className="mt-1 text-[11px] text-cyber-yellow">{menuMsg}</div>
                )}
              </>
            ) : (
              <div className="mt-1.5 text-[10px] text-white/35">
                Commands: mimic a call to battle directly (e.g. "Meow" → Kitten) · say "Next" to switch · say "Start" to confirm
              </div>
            )}
          </div>

          {/* 音频自检 */}
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <span className={`text-xs ${audioInfo.includes('⚠️') ? 'text-red-400' : audioInfo ? 'text-emerald-300' : 'text-white/40'}`}>
              {audioInfo || '🎵 Audio: not initialized'}
            </span>
            <button
              onClick={() => playPetCall(OPPONENTS[selIdxRef.current], 0.4)}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/40 hover:bg-cyber-blue/40 transition-colors flex-shrink-0"
            >
              🔊 Test Sound
            </button>
          </div>

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
                className={`relative p-4 rounded-2xl bg-gradient-to-br ${opp.color} bg-white/5 border overflow-hidden group text-left ${selIdx === i ? 'border-cyber-yellow ring-2 ring-cyber-yellow/70 shadow-lg shadow-cyber-yellow/20' : 'border-white/10'}`}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); playPetCall(opp, 0.35) }}
                  className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/30 flex items-center justify-center text-xs hover:bg-black/50 transition-colors z-10"
                  title="Preview call"
                >🔊</button>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-3xl drop-shadow-lg">{opp.emoji}</span>
                  <span className="px-2 py-0.5 rounded-full bg-black/30 text-[10px] font-bold">LV.{opp.tier}</span>
                </div>
                <div className="font-bold text-sm">{opp.name}</div>
                <div className="text-[11px] opacity-80 mt-0.5">{opp.desc}</div>
                <div className="flex gap-2 mt-2 text-[10px] text-white/80">
                  <span className="px-1.5 py-0.5 rounded bg-black/25">❤️ {opp.hp}</span>
                  <span className="px-1.5 py-0.5 rounded bg-black/25">⚔️ {opp.atk}</span>
                  <span className="px-1.5 py-0.5 rounded bg-cyber-yellow/20 text-cyber-yellow">🎟️ -{ENTRY_FEE}</span>
                </div>
                {i < 3 && (
                  <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/80 text-white">NEW</span>
                )}
                {i >= 5 && (
                  <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/80 text-white">BOSS</span>
                )}
                {selIdx === i && (
                  <span className="absolute bottom-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full bg-cyber-yellow text-black font-bold">🎯 SELECTED</span>
                )}
              </motion.button>
            ))}
          </div>

          {/* 排行榜 */}
          <div className="mt-6 glass-effect rounded-2xl border border-cyber-blue/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold neon-text">🏆 Global Leaderboard</h3>
              <span className="text-xs text-cyber-blue/60">{micReady ? '🎙️ Mic ready' : ''}</span>
            </div>
            {loadingLb ? (
              <p className="text-center text-white/40 text-sm py-4">Loading...</p>
            ) : leaderboard.length === 0 ? (
              <p className="text-center text-white/40 text-sm py-4">No battles yet — be the first to take #1!</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((entry) => (
                  <div key={entry.userId} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${entry.rank === 1 ? 'bg-yellow-500' : entry.rank === 2 ? 'bg-gray-300 text-gray-700' : entry.rank === 3 ? 'bg-amber-600' : 'bg-white/10'}`}>
                      {entry.rank}
                    </span>
                    <span className="text-sm font-medium flex-1 truncate">{entry.username}</span>
                    <span className="text-xs text-cyber-blue/80">{entry.wins} wins</span>
                    <span className="text-sm font-bold text-cyber-yellow">⭐{entry.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 我的战绩 */}
          {myRecords.length > 0 && (
            <div className="mt-4 glass-effect rounded-2xl border border-cyber-blue/30 p-4">
              <h3 className="font-bold neon-text mb-3">📜 My Records</h3>
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
            <button onClick={retry} className="text-white/40 hover:text-white text-sm px-3 py-1 rounded-lg bg-white/5 border border-white/10">← Exit</button>
            <span className="text-sm text-cyber-blue/70">Round {round}</span>
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${micReady ? 'bg-emerald-500/30 text-emerald-300' : 'bg-amber-500/30 text-amber-300'}`}>
              {micReady ? '🎙️ Mic Online' : '🫦 Hold to Charge'}
            </span>
            <button
              onClick={toggleBgMute}
              title={bgMuted ? 'Enable call hint' : 'Mute call hint'}
              className={`px-2 py-1 rounded-full text-[10px] font-bold border ${bgMuted ? 'bg-white/10 text-white/40 border-white/10' : 'bg-cyber-blue/20 text-cyber-blue border-cyber-blue/40'}`}
            >
              {bgMuted ? '🔇' : '🔊'} Sound
            </button>
          </div>
          {audioInfo.includes('⚠️') && (
            <div className="mb-2 text-center text-[10px] text-red-400/90">{audioInfo}</div>
          )}

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

          {/* 目标叫声提示 */}
          <div className="mt-4 text-center">
            <div className="text-[11px] text-white/50">
              Imitate its call — the closer the match, the stronger the attack{bgMuted ? '' : ' (🔊 background playing, follow along)'}:
            </div>
            <div className={`inline-block mt-1 px-4 py-1 rounded-full bg-gradient-to-r ${opp.color} text-white font-bold text-base tracking-widest`}>
              {opp.soundsLabel}
            </div>
            {speechSupported && heardText && (
              <div className="mt-1.5 text-[11px] text-cyber-blue/80">
                Heard: <span className="text-cyber-yellow font-bold">"{heardText}"</span>
              </div>
            )}
            {!speechSupported && (
              <div className="mt-1.5 text-[10px] text-white/35">Speech recognition unsupported in this browser. Attack power is based on volume only</div>
            )}
          </div>

          {/* 蓄力能量条 */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] mb-1">
              <span>⚡ Charge Power</span>
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

          {/* "叫声像"命中提示 */}
          <AnimatePresence>
            {matchMsg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mt-3 text-center"
              >
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-sm shadow-lg shadow-orange-500/30"
                >
                  {matchMsg}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

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
                <p className="text-sm text-red-300 mt-1">Opponent is roaring...</p>
              </div>
            ) : charging ? (
              <motion.button
                onPointerUp={endCharging}
                onPointerLeave={endCharging}
                animate={{ scale: 1 + energy / 100 * 0.25 }}
                className="w-40 h-40 rounded-full bg-gradient-to-br from-cyber-blue to-cyber-purple flex flex-col items-center justify-center shadow-2xl shadow-cyber-blue/50 border-4 border-white/20 active:from-cyber-pink active:to-red-500"
              >
                <span className="text-4xl">📢</span>
                <span className="font-bold text-sm mt-1">Mimic it!</span>
                <span className="text-[10px] opacity-80">{Math.round(energy)}% Release to attack</span>
              </motion.button>
            ) : (
              <motion.button
                onPointerDown={startCharging}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-40 h-40 rounded-full bg-gradient-to-br from-emerald-400 to-cyber-blue flex flex-col items-center justify-center shadow-2xl border-4 border-white/20"
              >
                <span className="text-4xl">🐾</span>
                <span className="font-bold text-sm mt-1">Hold & mimic it!</span>
                <span className="text-[10px] opacity-80">Closer match = stronger attack</span>
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
            {result.win ? 'Victory!' : 'Defeat...'}
          </motion.h1>
          <p className="text-white/50 mt-2 text-sm">vs {result.opponentName}</p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 glass-effect rounded-2xl border border-cyber-blue/30 p-6 text-center w-full max-w-xs"
          >
            <div className="text-4xl font-black text-cyber-yellow">⭐ {result.score}</div>
            <div className="text-xs text-cyber-blue/70 mt-1">Score saved to cloud</div>
            {saving && <div className="text-xs text-white/40 mt-2">Saving...</div>}
            {pointsInfo && (
              <div className="mt-3 text-sm">
                <div className={pointsInfo.earned > 0 ? 'text-emerald-300' : 'text-red-300'}>
                  {pointsInfo.earned > 0 ? `🎉 Victory reward +${pointsInfo.earned}` : `💸 Entry cost -${ENTRY_FEE}`}
                </div>
                <div className="text-xs text-white/50 mt-1">⭐ Points balance: {pointsInfo.balance}</div>
              </div>
            )}
          </motion.div>

          <div className="flex gap-3 mt-8 w-full max-w-xs">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={retry}
              className="flex-1 py-3 rounded-xl bg-white/10 border border-white/15 text-sm font-bold"
            >
              🎯 Rematch
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => { setOpponent(result.win && opponent ? OPPONENTS.find((o) => o.tier === opponent.tier + 1) || opponent : opponent); startBattle(result.win && opponent ? OPPONENTS.find((o) => o.tier === opponent.tier + 1) || opponent : opponent) }}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyber-blue to-cyber-purple text-sm font-bold shadow-lg"
            >
              ⬆️ Stronger Opponent
            </motion.button>
          </div>

          {/* 排行榜 */}
          <div className="mt-8 w-full max-w-xs glass-effect rounded-2xl border border-cyber-blue/30 p-4">
            <h3 className="font-bold neon-text mb-3 text-center">🏆 Global Leaderboard</h3>
            {loadingLb ? (
              <p className="text-center text-white/40 text-sm">Loading...</p>
            ) : leaderboard.length === 0 ? (
              <p className="text-center text-white/40 text-sm">No records yet</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((entry) => (
                  <div key={entry.userId} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${entry.rank === 1 ? 'bg-yellow-500' : entry.rank === 2 ? 'bg-gray-300 text-gray-700' : entry.rank === 3 ? 'bg-amber-600' : 'bg-white/10'}`}>
                      {entry.rank}
                    </span>
                    <span className="text-sm font-medium flex-1 truncate">{entry.username}</span>
                    <span className="text-xs text-cyber-blue/80">{entry.wins} wins</span>
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
