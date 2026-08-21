import React, { useState, useEffect } from 'react'
import { subscribeAudioStatus, unlockAudio, playTestTone } from '../utils/audio'

// 全局音频自检浮标：右下角固定小按钮
//  - 点击播放测试音，可立即判断扬声器/音频链路是否正常
//  - 状态随解锁情况变化（灰色=未初始化，黄色=被浏览器拦截，绿色=已就绪）
export default function AudioStatusBadge() {
  const [status, setStatus] = useState({ ok: false, msg: '🎵 未初始化', state: 'none' })
  const [flash, setFlash] = useState(false)
  const [showTip, setShowTip] = useState(false)

  useEffect(() => {
    return subscribeAudioStatus(setStatus)
  }, [])

  const handleClick = async (e) => {
    e.stopPropagation()
    unlockAudio()
    const ok = await playTestTone(0.55)
    setFlash(true)
    setTimeout(() => setFlash(false), 500)
    if (!ok) {
      setStatus({ ok: false, msg: '⚠️ 未能播放测试音：点击后仍无声请检查系统音量/换 Chrome 打开', state: 'failed' })
    }
  }

  const color = status.ok ? 'bg-green-500' : status.state === 'suspended' ? 'bg-amber-500' : status.state === 'failed' ? 'bg-red-500' : 'bg-slate-500'

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex items-center gap-2">
      {showTip && (
        <div className="max-w-[240px] rounded-lg bg-slate-900/95 px-3 py-2 text-xs text-slate-100 shadow-xl ring-1 ring-white/10">
          {status.msg}
          <div className="mt-1 text-slate-400">点击按钮播放测试音（嘀-嘀），用于排查扬声器</div>
        </div>
      )}
      <button
        type="button"
        aria-label="音频自检"
        title="音频自检：点击播放测试音"
        onClick={handleClick}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        className={`relative flex h-11 w-11 items-center justify-center rounded-full text-xl text-white shadow-lg ring-2 ring-white/20 transition-all hover:scale-110 ${color} ${flash ? 'scale-125' : ''}`}
      >
        {status.ok ? '🔊' : '🔇'}
      </button>
    </div>
  )
}
