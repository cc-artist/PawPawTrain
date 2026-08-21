// ========== 全局音频解锁与共享 AudioContext ==========
// 统一解决浏览器自动播放策略（Autoplay Policy）：
// 浏览器要求音频必须在「用户手势」（点击/按键/触摸）内触发。
// 本模块在任意用户手势时自动解锁 AudioContext，解锁后全站所有声音
// （Web Audio 合成、<audio>/<video> 元素）都可正常播放。
// 另提供 playTestTone() 测试音，用于诊断扬声器/音频链路：
//   - 能听到测试音 → 音频链路正常，问题在具体页面
//   - 听不到测试音 → 环境/设备问题（静音、无音频输出、预览沙箱限制）

let ctx = null
let unlocked = false
const listeners = new Set()

const getAC = () => window.AudioContext || window.webkitAudioContext

export function getSharedContext() {
  // 已关闭的上下文不可复用，自动重建
  if (ctx && ctx.state === 'closed') ctx = null
  if (!ctx) {
    const AC = getAC()
    if (!AC) return null
    try {
      ctx = new AC()
    } catch (err) {
      console.warn('[Audio] AudioContext creation failed:', err)
      return null
    }
  }
  return ctx
}

// 首次解锁时播放一段近乎无声（-80dB）的 10ms 信号。
// 部分浏览器（iOS Safari 等）需要真实输出一次才认为「已解锁」。
function activationPing() {
  const c = getSharedContext()
  if (!c || c.state !== 'running') return
  try {
    const osc = c.createOscillator()
    const g = c.createGain()
    g.gain.value = 0.0001
    osc.connect(g).connect(c.destination)
    const t = c.currentTime
    osc.start(t)
    osc.stop(t + 0.01)
  } catch (err) { /* ignore */ }
}

function notify() {
  const st = getAudioStatus()
  listeners.forEach((fn) => {
    try { fn(st) } catch (e) { /* ignore */ }
  })
}

function markUnlocked() {
  if (!unlocked) {
    unlocked = true
    activationPing()
  }
  notify()
}

// 确保共享 AudioContext 存在且处于 running 状态。
// 必须在「用户手势」内调用才能突破自动播放策略；返回 Promise<AudioContext|null>。
// 被浏览器拦截（非手势调用）时返回 null、不抛出；下一次用户手势会自动恢复。
export async function ensureAudio() {
  const c = getSharedContext()
  if (!c) return null
  if (c.state === 'running') {
    markUnlocked()
    return c
  }
  if (c.state === 'suspended') {
    try {
      await c.resume()
    } catch (err) {
      console.warn('[Audio] resume blocked by autoplay policy:', err)
      notify()
      return null
    }
  }
  if (c.state !== 'running') {
    notify()
    return null
  }
  markUnlocked()
  return c
}

export function unlockAudio() {
  // 同步触发解锁（fire-and-forget），返回当前上下文状态
  ensureAudio().catch(() => {})
  const c = ctx
  return c ? c.state : false
}

export function getAudioStatus() {
  const c = ctx
  if (!c) return { ok: false, msg: '🎵 未初始化', state: 'none' }
  if (c.state === 'running') return { ok: true, msg: '🔊 音频已就绪', state: 'running' }
  if (c.state === 'suspended') return { ok: false, msg: '⚠️ 音频被浏览器拦截，请点击页面任意位置解锁', state: 'suspended' }
  return { ok: false, msg: '⚠️ 音频不可用（' + c.state + '）', state: c.state }
}

export function subscribeAudioStatus(fn) {
  listeners.add(fn)
  try { fn(getAudioStatus()) } catch (e) { /* ignore */ }
  return () => listeners.delete(fn)
}

// 全站自检测试音：两段短音（880Hz → 1320Hz），用于确认扬声器/音频链路正常
export async function playTestTone(volume = 0.5) {
  const c = await ensureAudio()
  if (!c) return false
  try {
    const t0 = c.currentTime
    const master = c.createGain()
    master.gain.value = volume
    master.connect(c.destination)
    ;[880, 1320].forEach((freq, i) => {
      const osc = c.createOscillator()
      const g = c.createGain()
      const t = t0 + i * 0.18
      osc.type = 'sine'
      osc.frequency.value = freq
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.7, t + 0.015)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)
      osc.connect(g).connect(master)
      osc.start(t)
      osc.stop(t + 0.2)
    })
    return true
  } catch (err) {
    console.warn('[Audio] test tone failed:', err)
    return false
  }
}

// 全局自动解锁：监听任意用户手势，浏览器解锁后全站声音立即可用
let bound = false
export function bindGlobalUnlock() {
  if (bound) return
  bound = true
  const handler = () => unlockAudio()
  const evts = ['pointerdown', 'keydown', 'touchend']
  evts.forEach((evt) => window.addEventListener(evt, handler, { passive: true }))
}
