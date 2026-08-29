import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import { useUpload } from '../context/UploadContext'
import { usePosts } from '../context/PostsContext'
import SEO from '../components/SEO'
import { t } from '../utils/i18n'
import { unlockAudio } from '../utils/audio'

const systemVideos = [
  // ⚠️ 以下 URL 均已通过服务端 HTTP HEAD 探测校验（status=200 / Accept-Ranges=bytes / Content-Type=video）：
  //   - 不使用 Cloudinary 实时转码 vc_h264（大码率会被 CDN 超时中断 → ERR_ABORTED）
  //   - 回退为用户最初提供的中文文件名（URL 编码）直连 raw upload，该路径真实存在于 Cloudinary
  //   - video3/video6/video8 在服务端探测时 200 但 HEAD 无 Content-Length，浏览器若加载失败会进入 onError：
  //     UI 会自动展示错误信息并提供"跳过 / 重播"按钮
  { id: 'sys-video-1', user: { name: '🐾 Highlights', avatar: '🎬' }, media: 'https://res.cloudinary.com/dsa4t0soq/video/upload/v1781608864/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912026-06-16_191827_879_dlcj5h.mp4', content: 'Pet wonderful performance! 🐕 / 宠物精彩表演时刻！🐕', likes: 1256, comments: 89, shares: 45, favorites: 321, time: '1h ago / 1小时前', features: { breed: 'dog / 狗狗', color: 'pattern / 花色', expression: 'happy / 开心', emotion: 'positive', personalityBoost: { energy: 10, affection: 8, joy: 12, hunger: -3, discipline: 5 }, petType: 'dog' }, isMine: false },
  { id: 'sys-video-2', user: { name: '🐾 Cute Daily / 萌宠日常', avatar: '🐱' }, media: 'https://res.cloudinary.com/dsa4t0soq/video/upload/v1781608857/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912026-06-16_191833_927_lgjwn5.mp4', content: 'Cute cat daily play 🐱 / 可爱猫咪的日常玩耍 🐱', likes: 890, comments: 67, shares: 32, favorites: 234, time: '2h ago / 2小时前', features: { breed: 'cat / 猫咪', color: 'orange / 橙色', expression: 'curious / 好奇', emotion: 'positive', personalityBoost: { energy: 8, affection: 10, joy: 10, hunger: -2, discipline: 3 }, petType: 'cat' }, isMine: false },
  { id: 'sys-video-3', user: { name: '🐾 Happy Time / 快乐时光', avatar: '🐕' }, media: 'https://res.cloudinary.com/dsa4t0soq/video/upload/v1781608845/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912026-06-16_191852_670_bdvfrd.mp4', content: 'Beautiful pet interaction 💕 / 宠物互动的美好时刻 💕', likes: 1567, comments: 145, shares: 78, favorites: 456, time: '3h ago / 3小时前', features: { breed: 'dog / 狗狗', color: 'black / 黑色', expression: 'excited / 兴奋', emotion: 'positive', personalityBoost: { energy: 12, affection: 6, joy: 15, hunger: -5, discipline: 4 }, petType: 'dog' }, isMine: false },
  { id: 'sys-video-4', user: { name: '🐾 Little Cutie / 小可爱', avatar: '🐰' }, media: 'https://res.cloudinary.com/dsa4t0soq/video/upload/v1781608837/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912026-06-16_191857_392_xnsyf6.mp4', content: 'Happy bunny life 🐰 / 小兔子的幸福生活 🐰', likes: 789, comments: 56, shares: 23, favorites: 189, time: '4h ago / 4小时前', features: { breed: 'rabbit / 兔子', color: 'white / 白色', expression: 'content / 满足', emotion: 'positive', personalityBoost: { energy: 5, affection: 12, joy: 8, hunger: 8, discipline: 2 }, petType: 'rabbit' }, isMine: false },
  { id: 'sys-video-5', user: { name: '🐾 Pet Paradise / 萌宠乐园', avatar: '🐾' }, media: 'https://res.cloudinary.com/dsa4t0soq/video/upload/v1781608837/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912026-06-16_191838_670_bdf1ig.mp4', content: 'Pets happy gathering 🎉 / 宠物们的欢乐聚会 🎉', likes: 2345, comments: 234, shares: 156, favorites: 876, time: '5h ago / 5小时前', features: { breed: 'cat / 猫咪', color: 'gray / 灰色', expression: 'playful / 调皮', emotion: 'positive', personalityBoost: { energy: 9, affection: 7, joy: 11, hunger: -4, discipline: 6 }, petType: 'cat' }, isMine: false },
  { id: 'sys-video-6', user: { name: '🐾 Training / 训练时刻', avatar: '🏋️' }, media: 'https://res.cloudinary.com/dsa4t0soq/video/upload/v1781608825/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912026-06-16_191816_096_e3nbsv.mp4', content: 'Amazing pet training 🏆 / 宠物训练的精彩瞬间 🏆', likes: 1876, comments: 178, shares: 89, favorites: 567, time: '6h ago / 6小时前', features: { breed: 'dog / 狗狗', color: 'golden / 金色', expression: 'focused / 专注', emotion: 'positive', personalityBoost: { energy: 10, affection: 9, joy: 7, hunger: -6, discipline: 10 }, petType: 'dog' }, isMine: false },
  { id: 'sys-video-7', user: { name: '🐾 Warm Moment / 温馨时刻', avatar: '💝' }, media: 'https://res.cloudinary.com/dsa4t0soq/video/upload/v1781608823/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912026-06-16_191847_801_fixhen.mp4', content: 'Human-pet warm interaction 💝 / 人与宠物的温馨互动 💝', likes: 3456, comments: 456, shares: 234, favorites: 1234, time: '7h ago / 7小时前', features: { breed: 'cat / 猫咪', color: 'white / 白色', expression: 'gentle / 温柔', emotion: 'positive', personalityBoost: { energy: 3, affection: 15, joy: 9, hunger: -1, discipline: 4 }, petType: 'cat' }, isMine: false },
  { id: 'sys-video-8', user: { name: '🐾 Joy Time / 欢乐时光', avatar: '🎉' }, media: 'https://res.cloudinary.com/dsa4t0soq/video/upload/v1781608823/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912026-06-16_191843_526_jmohgf.mp4', content: 'Pets joyful time! 🎊 / 宠物们的欢乐时光！🎊', likes: 2123, comments: 321, shares: 167, favorites: 789, time: '8h ago / 8小时前', features: { breed: 'dog / 狗狗', color: 'brown / 棕色', expression: 'happy / 开心', emotion: 'positive', personalityBoost: { energy: 11, affection: 8, joy: 14, hunger: -4, discipline: 7 }, petType: 'dog' }, isMine: false },
  { id: 'sys-video-9', user: { name: '🐾 Paw Paw Star / 爪爪明星', avatar: '⭐' }, media: 'https://res.cloudinary.com/dsa4t0soq/video/upload/v1782537437/1995813682_iy6q6g.mp4', content: 'Superstar pet moment! 🌟 / 明星宠物闪耀时刻！🌟', likes: 1890, comments: 234, shares: 156, favorites: 567, time: '9h ago / 9小时前', features: { breed: 'dog / 狗狗', color: 'white / 白色', expression: 'playful / 调皮', emotion: 'positive', personalityBoost: { energy: 12, affection: 9, joy: 15, hunger: -5, discipline: 8 }, petType: 'dog' }, isMine: false },
  { id: 'sys-video-10', user: { name: '🐾 Sweet Home / 甜蜜之家', avatar: '🏠' }, media: 'https://res.cloudinary.com/dsa4t0soq/video/upload/v1782537417/930545201_scbn5a.mp4', content: 'Cozy home with my pet 🏡 / 和宠物宅家的温馨时光 🏡', likes: 1345, comments: 189, shares: 98, favorites: 432, time: '10h ago / 10小时前', features: { breed: 'cat / 猫咪', color: 'orange / 橙色', expression: 'relaxed / 放松', emotion: 'calm', personalityBoost: { energy: 4, affection: 14, joy: 10, hunger: -3, discipline: 5 }, petType: 'cat' }, isMine: false },
  { id: 'sys-video-11', user: { name: '🐾 Outdoor Fun / 户外乐趣', avatar: '🌳' }, media: 'https://res.cloudinary.com/dsa4t0soq/video/upload/v1782537412/535416673_w2mefz.mp4', content: 'Exploring the great outdoors! 🌿 / 探索户外大自然！🌿', likes: 2100, comments: 312, shares: 189, favorites: 678, time: '11h ago / 11小时前', features: { breed: 'dog / 狗狗', color: 'golden / 金色', expression: 'excited / 兴奋', emotion: 'positive', personalityBoost: { energy: 15, affection: 7, joy: 18, hunger: -8, discipline: 6 }, petType: 'dog' }, isMine: false },
  { id: 'sys-video-12', user: { name: '🐾 Cute Attack / 可爱暴击', avatar: '💕' }, media: 'https://res.cloudinary.com/dsa4t0soq/video/upload/v1782537409/167735843_ji9gla.mp4', content: 'Cuteness overload! 💖 / 可爱暴击！💖', likes: 3456, comments: 567, shares: 345, favorites: 1234, time: '12h ago / 12小时前', features: { breed: 'cat / 猫咪', color: 'white / 白色', expression: 'curious / 好奇', emotion: 'positive', personalityBoost: { energy: 7, affection: 15, joy: 13, hunger: -2, discipline: 4 }, petType: 'cat' }, isMine: false },
  { id: 'sys-video-13', user: { name: '🐾 Play Time / 玩乐时光', avatar: '🎾' }, media: 'https://res.cloudinary.com/dsa4t0soq/video/upload/v1782537396/1622777298_jkj5am.mp4', content: 'Play hard, nap harder! 😴 / 尽情玩耍，尽情睡觉！😴', likes: 2678, comments: 456, shares: 234, favorites: 890, time: '13h ago / 13小时前', features: { breed: 'dog / 狗狗', color: 'brown / 棕色', expression: 'energetic / 活力', emotion: 'positive', personalityBoost: { energy: 14, affection: 10, joy: 16, hunger: -6, discipline: 7 }, petType: 'dog' }, isMine: false },
]

const mockPosts = [
  { id: 'mock-1', user: { name: '🐾 Pet Lover / 宠物爱好者', avatar: '👩' }, media: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=800&fit=crop', content: 'Sunbathing with my cat～☀️ / 今天天气真好，和我的小猫咪一起晒太阳～☀️', likes: 234, comments: 45, shares: 12, favorites: 89, time: '2h ago / 2小时前', features: { breed: 'cat / 猫咪', color: 'orange / 橙色', expression: 'happy / 开心', emotion: 'positive', personalityBoost: { energy: 5, affection: 3, joy: 8, hunger: -2, discipline: 1 }, petType: 'cat' }, isMine: false },
  { id: 'mock-2', user: { name: '🐾 Scooper Diary / 铲屎官日记', avatar: '👨' }, media: 'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=800&h=800&fit=crop', content: 'Took my dog to the park, so much fun! / 今天带狗狗去公园玩，玩得好开心！', likes: 567, comments: 89, shares: 34, favorites: 156, time: '4h ago / 4小时前', features: { breed: 'dog / 狗狗', color: 'yellow / 黄色', expression: 'excited / 兴奋', emotion: 'positive', personalityBoost: { energy: 10, affection: 5, joy: 12, hunger: -5, discipline: 8 }, petType: 'dog' }, isMine: false },
  { id: 'mock-3', user: { name: '🐾 Pet Daily / 萌宠日常', avatar: '👧' }, media: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=800&h=800&fit=crop', content: 'Bunny ate well today～ / 小兔子今天吃得很满足～', likes: 890, comments: 123, shares: 56, favorites: 234, time: '6h ago / 6小时前', features: { breed: 'rabbit / 兔子', color: 'white / 白色', expression: 'content / 满足', emotion: 'positive', personalityBoost: { energy: 2, affection: 8, joy: 6, hunger: 10, discipline: 3 }, petType: 'rabbit' }, isMine: false },
  { id: 'mock-4', user: { name: '🐾 Cat Planet / 猫咪星球', avatar: '👩‍🦰' }, media: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop', content: 'Sleeping cat is so cute～ / 猫咪睡觉的样子真可爱～', likes: 1203, comments: 234, shares: 78, favorites: 456, time: '8h ago / 8小时前', features: { breed: 'cat / 猫咪', color: 'white / 白色', expression: 'peaceful / 安详', emotion: 'calm', personalityBoost: { energy: -3, affection: 10, joy: 4, hunger: -1, discipline: 2 }, petType: 'cat' }, isMine: false },
  { id: 'mock-5', user: { name: '🐾 Woof Team / 汪汪队', avatar: '👨‍🦱' }, media: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=800&h=800&fit=crop', content: 'Dog training day, great progress! / 训练狗狗的一天，进步很大！', likes: 1567, comments: 345, shares: 123, favorites: 567, time: '10h ago / 10小时前', features: { breed: 'dog / 狗狗', color: 'golden / 金色', expression: 'serious / 认真', emotion: 'positive', personalityBoost: { energy: 8, affection: 12, joy: 7, hunger: -8, discipline: 6 }, petType: 'dog' }, isMine: false },
]

const aiProducts = [
  { id: 1, name: 'AI Avatar / AI专属头像', icon: '🎨', price: 200, description: 'AI generates exclusive anime avatar for your pet / AI为你的宠物生成专属二次元头像', sales: 128 },
  { id: 2, name: 'Sticker Pack / 表情包套装', icon: '😺', price: 300, description: '16 AI-generated pet stickers / 16款AI生成的宠物表情包', sales: 89 },
  { id: 3, name: 'Virtual Outfit / 虚拟装扮', icon: '👗', price: 150, description: 'AI-designed exclusive pet outfit / AI设计的宠物专属装扮', sales: 256 },
  { id: 4, name: 'Art Wallpaper / 艺术壁纸', icon: '🖼️', price: 100, description: 'AI-created pet art wallpaper / AI创作的宠物艺术壁纸', sales: 167 },
  { id: 5, name: 'Story Book / 故事绘本', icon: '📖', price: 500, description: 'AI-written exclusive pet story / AI编写的宠物专属故事', sales: 45 },
  { id: 6, name: 'Signature / 个性签名', icon: '✍️', price: 50, description: 'AI-generated pet signature / AI生成的宠物个性签名', sales: 312 },
]

const getPetAvatar = (petType) => {
  const avatars = { dog: '🐕', cat: '🐱', rabbit: '🐰', bird: '🐦', fish: '🐟', hamster: '🐹', turtle: '🐢', guinea_pig: '🐹' }
  return avatars[petType] || '🐾'
}

// 🔴 2026-08-29 关键修正：
// 之前让 Cloudinary 视频直连，但浏览器侧实测多个视频 GET 请求返回 net::ERR_ABORTED（CDN 对大码率 mp4/中文文件名的 Range 请求不稳定）。
// 现在：所有外部视频（Cloudinary video/upload / 其它 http(s) .mp4 等）默认走同源 /api/media-proxy?url=。
//   - 本项目是本机 dev / 自建 Node 后端（非 Vercel Serverless），stream 转发**没有 4.5MB 响应体限制**（这是 Vercel 独有限制）。
//   - 后端已转发 Accept-Ranges/Content-Range，浏览器的 Range 请求能正确走到上游，从而支持拖动进度条 / 跳帧 / 渐进式加载。
//   - 同源路由，彻底规避 CORS、证书、CDN 地域限制。
// 仅 Unsplash 图片 → 依然走代理（不影响）；blob:/data: → 直连。
const IMG_PROXY_HOSTS = ['images.unsplash.com', 'plus.unsplash.com']
const VIDEO_EXTS = /\.(mp4|mov|webm|ogg|m4v|mkv|3gp)(\?|$)/i

// ====== 🔧 Cloudinary 转码兜底源生成（用于「只有声音没画面 / videoWidth=0 / MEDIA_ERR_DECODE」时自动切换）
// 思路：不换架构、不换存储，只在 Cloudinary 的 /video/upload/<version>/ 前面插入强制 H.264 转码参数：
//   vc_h264  → 强制输出 H.264 baseline（Chromium 所有平台都能硬解）
//   w_720,h_720,c_limit  → 最大 720p，降低码率/解码压力
//   q_auto  → 自动码率，保证传输流畅
// 并且仍然通过 proxyMediaUrl 套 /api/media-proxy（零直连 Cloudinary，规避 CORS/CDN 截断）。
// 额外提供 480p 降级档（w_480,h_480）用于 720p 依然解码失败时再降一级。
const CLOUDINARY_BASE = 'https://res.cloudinary.com/dsa4t0soq'
const getCloudinaryTranscodeFallback = (inputUrl, preset = '720p') => {
  if (!inputUrl || typeof inputUrl !== 'string') return inputUrl
  // 1) 如果已经是代理 URL → 先 decode 拿到真实 Cloudinary raw URL
  let raw = inputUrl
  if (raw.startsWith('/api/media-proxy?url=')) {
    try {
      const enc = raw.slice(raw.indexOf('?url=') + 5)
      raw = decodeURIComponent(enc)
    } catch (_) {
      raw = inputUrl
    }
  }
  // 2) 非 Cloudinary → 原样返回
  if (!raw.startsWith(CLOUDINARY_BASE)) return inputUrl
  // 3) 已经带 vc_h264（之前切换过）→ 避免重复套
  if (raw.includes('/vc_h264') || raw.includes('vc_h264/')) return inputUrl
  // 4) 在 /video/upload/ 和 /v<number>/ 之间插入转码参数
  const sizePreset = preset === '480p' ? 'w_480,h_480,c_limit,q_auto' : 'w_720,h_720,c_limit,q_auto'
  // 匹配 /video/upload/v123456/ 或 /video/upload/
  const re = /(\/video\/upload\/)(v[^/]+\b)?/
  if (!re.test(raw)) return inputUrl
  const transcodeRaw = raw.replace(re, (_m, p1, p2) => {
    // p2 存在：/video/upload/v123456/  →  /video/upload/vc_h264,w_720,.../v123456/
    // p2 不存在：/video/upload/        →  /video/upload/vc_h264,w_720,.../
    const insert = `vc_h264,${sizePreset}`
    return p2 ? `${p1}${insert}/${p2}` : `${p1}${insert}/`
  })
  // 5) 返回裸 Cloudinary 转码 URL（不再套 proxy）
  // 由 proxyMediaUrl 根据 import.meta.env.PROD 决定是否套 /api/media-proxy：
  //   - 生产(Vercel)：直连 Cloudinary CDN（规避 serverless 4.5MB 响应体限制）
  //   - 开发：走本地 /api/media-proxy（无大小限制）
  return transcodeRaw
}

// Vite 生产构建 = Vercel 部署；开发模式 DEV
const IS_PROD = import.meta.env.PROD
const wrapProxy = (rawUrl) => `/api/media-proxy?url=${encodeURIComponent(rawUrl)}`

const proxyMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return url
  if (url.startsWith('blob:') || url.startsWith('data:')) return url
  if (url.startsWith('/api/media-proxy')) return url
  try {
    const u = new URL(url)
    const isVideo = VIDEO_EXTS.test(u.pathname) || url.includes('/video/upload/')
    if (isVideo) {
      // Cloudinary 视频默认先套 vc_h264 720p 转码（解决软解 videoWidth=0），
      // 再根据环境决定是否套 /api/media-proxy：
      //   生产：直连 Cloudinary CDN（Vercel serverless 有 4.5MB 响应体限制，大视频必被截断）
      //   开发：走本地后端 proxy（无大小限制，且便于调试）
      if (u.hostname === 'res.cloudinary.com' || u.hostname.endsWith('.res.cloudinary.com')) {
        const transcodeRaw = getCloudinaryTranscodeFallback(url, '720p')
        if (transcodeRaw && transcodeRaw !== url) {
          return IS_PROD ? transcodeRaw : wrapProxy(transcodeRaw)
        }
      }
      // 非 Cloudinary 外部视频：生产直连，开发走 proxy
      return IS_PROD ? url : wrapProxy(url)
    }
    // Cloudinary 图片 → 生产直连 CDN（图片小），开发走 proxy
    if ((u.hostname === 'res.cloudinary.com' || u.hostname.endsWith('.res.cloudinary.com')) && url.includes('/image/upload/')) {
      return IS_PROD ? url : wrapProxy(url)
    }
    // Cloudinary 其它资源
    if (u.hostname === 'res.cloudinary.com' || u.hostname.endsWith('.res.cloudinary.com')) {
      return IS_PROD ? url : wrapProxy(url)
    }
    if (IMG_PROXY_HOSTS.some(h => u.hostname === h || u.hostname.endsWith('.' + h))) {
      return IS_PROD ? url : wrapProxy(url)
    }
  } catch {}
  return url
}

const Feed = () => {
  const { posts: userPosts } = usePosts()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mediaFilter, setMediaFilter] = useState('video')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [videoErrorMsg, setVideoErrorMsg] = useState('') // 错误详情（MediaError.code + 文本），展示给用户便于定位
  // 视频静音为「受控状态」：JSX 中写死 muted 会导致点击取消静音后，
  // setState 触发重渲染时被 React 重新置回 true（视频永远静音）。
  // 改为受控后，点击视频即可真正开启声音。
  const [videoMuted, setVideoMuted] = useState(true)
  const [showPlayIndicator, setShowPlayIndicator] = useState(false)
  // UI 始终可见
  const [showUI, setShowUI] = useState(true)
  const [showPlayPauseBtn, setShowPlayPauseBtn] = useState(false)
  const hideUITimer = useRef(null)
  const playIndicatorTimer = useRef(null)
  const playPauseBtnTimer = useRef(null)
  const containerRef = useRef(null)
  const videoRef = useRef(null)
  const autoRetryRef = useRef({}) // 自动播放失败后仅重试一次，防无限循环：key=postId
  const touchStartY = useRef(0)
  const touchEndY = useRef(0)
  const touchStartTime = useRef(0)
  const wheelTimeoutRef = useRef(null)
  const { showUpload } = useUpload()
  const currentPet = useStore(state => state.currentPet)
  const { user } = useStore()

  // 互动状态：点赞、收藏
  const [likedPosts, setLikedPosts] = useState({})
  const [favoritedPosts, setFavoritedPosts] = useState({})
  const [postLikes, setPostLikes] = useState({})
  const [postFavorites, setPostFavorites] = useState({})

  const isVideo = (media) => {
    if (!media) return false
    if (media.startsWith('data:video')) return true
    if (media.startsWith('blob:')) return true
    // 代理 URL → 解码真实 URL 后判断
    if (media.includes('/api/media-proxy')) {
      try {
        const idx = media.indexOf('?url=')
        if (idx !== -1) {
          const encoded = media.slice(idx + 5)
          const realUrl = decodeURIComponent(encoded)
          if (realUrl.match(/\.(mp4|mov|webm|ogg|m4v)(\?|$)/i)) return true
          if (realUrl.includes('/video/upload/')) return true
        }
      } catch {}
      return false
    }
    if (media.match(/\.(mp4|mov|webm|ogg|m4v)($|\?)/i)) return true
    if (media.includes('/video/upload/')) return true
    return false
  }

  const isImage = (media) => {
    if (!media) return false
    if (media.startsWith('blob:')) return false // blob URL 视为视频
    // 代理 URL → 解码真实 URL 后判断
    if (media.includes('/api/media-proxy')) {
      try {
        const idx = media.indexOf('?url=')
        if (idx !== -1) {
          const encoded = media.slice(idx + 5)
          const realUrl = decodeURIComponent(encoded)
          return realUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)
        }
      } catch {}
      return false
    }
    return media.match(/\.(jpg|jpeg|png|gif|webp)($|\?)/i) || media.startsWith('data:image')
  }

  const sharePlatforms = [
    { id: 'facebook', name: 'Facebook', icon: '📘', color: 'from-blue-600 to-blue-800' },
    { id: 'instagram', name: 'Instagram', icon: '📷', color: 'from-purple-500 to-pink-500' },
    { id: 'twitter', name: 'X', icon: '🐦', color: 'from-slate-400 to-slate-600' },
    { id: 'whatsapp', name: 'WhatsApp', icon: '💚', color: 'from-green-500 to-green-700' },
    { id: 'reddit', name: 'Reddit', icon: '🔴', color: 'from-orange-500 to-orange-700' },
    { id: 'discord', name: 'Discord', icon: '💜', color: 'from-indigo-500 to-purple-600' },
  ]

  const allPosts = useMemo(() => {
    const combined = [...systemVideos, ...userPosts, ...mockPosts].map(post => ({
      ...post,
      media: proxyMediaUrl(post.media)
    })).filter(post => {
      if (mediaFilter === 'all') return true
      if (mediaFilter === 'image') return isImage(post.media)
      if (mediaFilter === 'video') return isVideo(post.media)
      return true
    })
    const userPet = currentPet || {}
    const userPetType = userPet.type || 'dog'
    const userPetTags = userPet.tags || []
    return combined.sort((a, b) => {
      let scoreA = 0, scoreB = 0
      const fa = a.features || {}, fb = b.features || {}
      if (fa.petType === userPetType) scoreA += 30
      if (fb.petType === userPetType) scoreB += 30
      const engA = (a.likes || 0) + (a.comments || 0) * 2 + (a.shares || 0) * 3
      const engB = (b.likes || 0) + (b.comments || 0) * 2 + (b.shares || 0) * 3
      if (engA > 500) scoreA += 20; else if (engA > 100) scoreA += 10
      if (engB > 500) scoreB += 20; else if (engB > 100) scoreB += 10
      if (a.isTrainingPost) scoreA += 15
      if (b.isTrainingPost) scoreB += 15
      if (fa.tags && userPetTags.length > 0) {
        const matchedA = fa.tags.filter(t => userPetTags.includes(t)).length
        scoreA += matchedA * 3
      }
      if (fb.tags && userPetTags.length > 0) {
        const matchedB = fb.tags.filter(t => userPetTags.includes(t)).length
        scoreB += matchedB * 3
      }
      return scoreB - scoreA
    })
  }, [mediaFilter, userPosts, currentPet])

  // 切换帖子时强制显示 UI
  useEffect(() => {
    setShowUI(true)
  }, [currentIndex])

  const [videoVolume, setVideoVolume] = useState(0.8) // 用户偏好音量（0~1），只在未静音时生效
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  // ====== 🔧「只有声音没画面」专用状态：画面就绪看门狗 + object-fit 切换
  const [frameFit, setFrameFit] = useState('cover') // 默认 cover（9:16竖屏不留黑边，不被用户误判为"全黑"）
  // Cloudinary 视频默认先走 proxyMediaUrl 套 vc_h264,w_720（见 proxyMediaUrl 内的默认转码逻辑），
  // 所以初始 tier=720p（非 raw），避免画面看门狗误判再重复套转码参数。
  const [transcodeTier, setTranscodeTier] = useState('720p')
  const soundHintTimer = useRef(null)
  const playWatchdogRef = useRef(null) // 自动播放看门狗：6s 后仍 paused→显示▶提示
  const frameWatchdogRef = useRef(null) // 画面就绪看门狗：canplay 后 2s 仍 videoWidth==0 → 弹错误 + 切转码源

  // ====== 🔊 统一声音/静音同步：每次渲染 + 每次 videoMuted 变化都强制对齐 DOM ======
  // 背景：React 的 muted / volume 属性是"受控"且存在 known bug (facebook/react#10389)：
  //       仅写 <video muted={videoMuted}> 不保证真实 DOM.video.muted 与之同步（重渲染时会被 reset 回 JSX 初值）。
  //       所以我们永远显式改 DOM 3 处：muted / defaultMuted / volume。
  const applyVideoMuted = useCallback((muted) => {
    const video = videoRef.current
    if (!video) return
    video.defaultMuted = !!muted
    video.muted = !!muted
    try { video.volume = muted ? 0 : Math.max(0, Math.min(1, Number(videoVolume) || 0.8)) } catch (_) {}
  }, [videoVolume])

  // ====== 🔧「用户明确要求：切视频不要自动静音」专用：play() 成功后统一恢复用户静音偏好
  // 背景：浏览器策略：**代码触发的非手势自动播放，必须 muted=true 才会成功**（否则 play() 会被 reject）。
  //      所以所有 autoplay 路径依然必须"先 applyVideoMuted(true) → play()" 保证通过浏览器校验。
  //      play 成功后（then()）若用户之前的 videoMuted 偏好是 false（即用户点过🔊要出声）→ 立刻恢复为 applyVideoMuted(false)
  //      （注意：这里**不能**再 setState(videoMuted) 触发重新渲染，React 的 useEffect(videoMuted) 会把它同步；直接 applyVideoMuted 即"切到正确状态"）。
  //      由于 video 已经在 playing，再设置 muted=false 只是开关音轨输出，不会再触发浏览器"非静音自动播放"检查，用户体感就是"切换视频没静音，继续有声"。
  const restoreUserMutedAfterPlay = useCallback(() => {
    if (videoMuted === false) { // 用户偏好：🔊 要出声
      // 1 tick 延迟：保证浏览器已判定"这次 play 已经作为 muted autoplay 通过了"，再切 unmuted 才不影响
      setTimeout(() => {
        applyVideoMuted(false)
        // 某些 Chromium 需要再 play() 一次，用来拉取取消静音后的实际 audio output 管线（无副作用）
        const v = videoRef.current
        if (v && !v.paused) { v.play().catch(() => {}) }
      }, 0)
    }
  }, [videoMuted, applyVideoMuted])

  // 1) 只要 videoMuted 状态变，立刻同步 DOM（切视频不再覆盖用户偏好）
  useEffect(() => {
    applyVideoMuted(videoMuted)
  }, [videoMuted, applyVideoMuted])

  // 2) 只要 videoVolume 变且未静音，也立刻同步 DOM
  useEffect(() => {
    if (!videoMuted) applyVideoMuted(false)
  }, [videoVolume, videoMuted, applyVideoMuted])

  // 3) 每次 React 渲染节拍末尾兜底：保证 JSX 渲染后 DOM 属性正确
  useLayoutEffect(() => {
    applyVideoMuted(videoMuted)
  })

  // 用户交互时显示 UI（视频播放时延迟后自动隐藏）
  const showUIWithTimeout = useCallback(() => {
    setShowUI(true)
    if (hideUITimer.current) clearTimeout(hideUITimer.current)
  }, [])

  // 点赞功能
  const handleLike = useCallback((e) => {
    e.stopPropagation()
    const postId = allPosts[currentIndex]?.id
    if (!postId) return
    const key = postId
    const currentLikes = postLikes[key] || allPosts[currentIndex]?.likes || 0
    if (likedPosts[key]) {
      setLikedPosts(prev => ({ ...prev, [key]: false }))
      setPostLikes(prev => ({ ...prev, [key]: currentLikes - 1 }))
    } else {
      setLikedPosts(prev => ({ ...prev, [key]: true }))
      setPostLikes(prev => ({ ...prev, [key]: currentLikes + 1 }))
    }
    showUIWithTimeout()
  }, [currentIndex, allPosts, likedPosts, postLikes, showUIWithTimeout])

  // 收藏功能
  const handleFavorite = useCallback((e) => {
    e.stopPropagation()
    const postId = allPosts[currentIndex]?.id
    if (!postId) return
    const key = postId
    const currentFavs = postFavorites[key] || allPosts[currentIndex]?.favorites || 0
    if (favoritedPosts[key]) {
      setFavoritedPosts(prev => ({ ...prev, [key]: false }))
      setPostFavorites(prev => ({ ...prev, [key]: currentFavs - 1 }))
    } else {
      setFavoritedPosts(prev => ({ ...prev, [key]: true }))
      setPostFavorites(prev => ({ ...prev, [key]: currentFavs + 1 }))
    }
    showUIWithTimeout()
  }, [currentIndex, allPosts, favoritedPosts, postFavorites, showUIWithTimeout])

  const handleShare = (platform) => {
    const shareText = encodeURIComponent(`${currentPost.user.name} - ${currentPost.content}`)
    const shareUrl = encodeURIComponent(window.location.href)
    let url = ''
    switch (platform.id) {
      case 'facebook': url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareText}`; break
      case 'instagram': url = `https://www.instagram.com/share?text=${shareText}`; break
      case 'twitter': url = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`; break
      case 'whatsapp': url = `https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`; break
      case 'reddit': url = `https://www.reddit.com/submit?url=${shareUrl}&title=${shareText}`; break
      case 'discord': url = `https://discord.com/channels/@me`; break
      default: return
    }
    window.open(url, '_blank', 'width=600,height=400')
    setShowShareMenu(false)
    showUIWithTimeout()
  }

  const isCurrentVideo = isVideo(allPosts[currentIndex]?.media)

  const handlePrev = useCallback(() => {
    // 暂停当前视频
    const video = videoRef.current
    if (video && !video.paused) {
      video.pause()
    }
    setVideoPlaying(false)
    setVideoError(false)
    // 🔧 用户明确要求："切换播放视频的时候不要自动静音" → 不再强制 setVideoMuted(true) 覆盖用户之前点🔊开的声音。
    // （下一条视频为了满足浏览器 autoplay 策略，仍会先 muted=true 起播；等 play 成功后在 then() 里判断用户偏好是 🔊 就立刻 applyVideoMuted(false) 恢复）
    setCurrentIndex(prev => (prev - 1 + allPosts.length) % allPosts.length)
  }, [allPosts.length])

  const handleNext = useCallback(() => {
    // 暂停当前视频
    const video = videoRef.current
    if (video && !video.paused) {
      video.pause()
    }
    setVideoPlaying(false)
    setVideoError(false)
    // 🔧 同上：不再 setVideoMuted(true)，保留用户的🔊/🔇选择
    setCurrentIndex(prev => (prev + 1) % allPosts.length)
  }, [allPosts.length])

  // 播放/暂停功能（不再耦合取消静音，声音状态由 🔊 按钮/滑条独立控制）
  const handleVideoClick = useCallback(() => {
    unlockAudio() // 🔧 先解锁音频上下文（浏览器自动播放策略要求 user gesture 内）
    const video = videoRef.current
    const currentMedia = allPosts[currentIndex]?.media
    if (!video || !isVideo(currentMedia)) return

    showUIWithTimeout()

    if (video.paused || video.ended) {
      // 先按用户当前的静音偏好把 DOM 对齐（React muted bug 兜底），再 play
      applyVideoMuted(videoMuted)
      video.play().then(() => {
        setVideoPlaying(true)
      }).catch(() => {})
    } else {
      video.pause()
      setVideoPlaying(false)
    }

    setShowPlayIndicator(true)
    if (playIndicatorTimer.current) clearTimeout(playIndicatorTimer.current)
    playIndicatorTimer.current = setTimeout(() => setShowPlayIndicator(false), 800)

    // 显示播放/暂停按钮，1.5s 后自动隐藏
    setShowPlayPauseBtn(true)
    if (playPauseBtnTimer.current) clearTimeout(playPauseBtnTimer.current)
    playPauseBtnTimer.current = setTimeout(() => setShowPlayPauseBtn(false), 1500)
  }, [currentIndex, allPosts, showUIWithTimeout, videoMuted, applyVideoMuted])

  // 🔊/🔇 独立静音开关（视频播放中也能点；取消静音后会借本次用户手势触发一次有声 play，规避自动播放策略）
  const toggleVideoMute = useCallback((e) => {
    e.stopPropagation()
    unlockAudio() // 🔧 点击🔊时先激活 AudioContext，保证浏览器"有用户手势"后允许 HTMLVideoElement 输出音轨
    const video = videoRef.current
    if (!video) return
    const next = !videoMuted
    setVideoMuted(next)      // React state -> 会触发上面的 useEffect 同步 DOM
    applyVideoMuted(next)    // 立刻同步 DOM（不等下一帧）
    showUIWithTimeout()

    // 静音提示 1.5s 内只显示一次
    if (soundHintTimer.current) clearTimeout(soundHintTimer.current)
    soundHintTimer.current = setTimeout(() => {}, 0) // placeholder: 提示靠 UI 内的静音提示气泡

    // 取消静音的关键动作：
    // 1) 已在播放但"被策略性静音"的视频：取消静音后 volume 会直接生效（通常无需再 play）
    // 2) 视频在 paused/ended：必须在本次用户手势内调用 play()，否则"非静音自动播放"会被浏览器拒绝
    // 3) 即便已在播放，也再走一次 play()，用于修正某些 Chromium 版本取消静音后仍保持无声的异常
    if (!next) {
      const p = video.paused || video.ended
      if (p) {
        video.play().catch(() => {})
      } else {
        // 有些浏览器取消静音后需要重新触发一次 playback 才能让音频输出"拉起来"
        // 安全做法：直接 promise.play().catch(noop)，不影响画面
        video.play().catch(() => {})
      }
    }
  }, [videoMuted, showUIWithTimeout, applyVideoMuted])

  // 点击🔊旁边的音量图标：展开/收起音量滑条（用于用户侧兜底："就算代码逻辑都对，系统音量被拉到0也能让用户知道怎么改"）
  const handleVolumeChange = (e) => {
    e.stopPropagation()
    unlockAudio() // 🔧 滑动也激活一次 AudioContext（有的浏览器拖动才是第一次用户手势）
    const val = Number(e.target.value) || 0
    setVideoVolume(val)
    if (val > 0 && videoMuted) {
      setVideoMuted(false)
      applyVideoMuted(false)
      // 滑动时也是用户手势，顺手 play 一下
      const video = videoRef.current
      if (video && (video.paused || video.ended)) video.play().catch(() => {})
    } else {
      applyVideoMuted(videoMuted)
    }
    setShowVolumeSlider(true)
    // 2s 后自动收起
    if (soundHintTimer.current) clearTimeout(soundHintTimer.current)
    soundHintTimer.current = setTimeout(() => setShowVolumeSlider(false), 2000)
  }

  const handleKeyDown = useCallback((e) => {
    if (showUpload) return
    // 忽略在输入框中的按键
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return
    if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'k') {
      e.preventDefault()
      handlePrev()
    } else if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'j') {
      e.preventDefault()
      handleNext()
    } else if (e.key === ' ') {
      // 空格键暂停/播放
      e.preventDefault()
      handleVideoClick()
    }
  }, [handlePrev, handleNext, showUpload, handleVideoClick])

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY
    touchStartTime.current = Date.now()
  }

  const handleTouchEnd = (e) => {
    if (showUpload) return
    touchEndY.current = e.changedTouches[0].clientY
    const diffY = touchStartY.current - touchEndY.current
    const diffTime = Date.now() - (touchStartTime.current || 0)

    // 滑动距离超过阈值 → 切换视频
    if (Math.abs(diffY) > 50 && diffTime < 500) {
      if (diffY > 0) { handleNext() } else { handlePrev() }
      return
    }

    // 轻触（短时间 + 小距离）→ 播放/暂停
    if (Math.abs(diffY) < 15 && diffTime < 300) {
      handleVideoClick()
    }
  }

  const handleWheel = useCallback((e) => {
    if (showUpload) return
    e.preventDefault()
    e.stopPropagation()
    if (wheelTimeoutRef.current) { clearTimeout(wheelTimeoutRef.current) }
    const deltaY = e.deltaY
    wheelTimeoutRef.current = setTimeout(() => {
      if (Math.abs(deltaY) > 30) {
        if (deltaY > 0) { handleNext() } else { handlePrev() }
      }
    }, 80)
  }, [handlePrev, handleNext, showUpload])

  // 滚轮事件绑定在 window 上以避免被视频元素拦截
  useEffect(() => {
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // 切换帖子时自动播放视频（useLayoutEffect 确保在浏览器触发 canplay 前挂好监听器）
  useLayoutEffect(() => {
    const video = videoRef.current
    const currentMedia = allPosts[currentIndex]?.media
    const postId = allPosts[currentIndex]?.id || ('idx-' + currentIndex)
    if (!video || !currentMedia || !isVideo(currentMedia)) {
      setVideoPlaying(false)
      return
    }

    // 切到新视频时清除"自动重试一次"的标志（允许下一条也有一次重试机会）
    if (autoRetryRef.current[postId]) delete autoRetryRef.current[postId]

    // React 的 muted 属性有已知 bug（facebook/react#10389），通过统一 applyVideoMuted 直接在 DOM 上设置
    applyVideoMuted(true)

    const tryPlay = () => {
      // 再次确保 muted（某些浏览器在 load() 后会重置）——浏览器策略：非手势 autoplay 必须 muted 才能通过
      applyVideoMuted(true)
      video.play().then(() => {
        setVideoPlaying(true)
        setVideoError(false)
        setShowPlayPauseBtn(true)
        if (playPauseBtnTimer.current) clearTimeout(playPauseBtnTimer.current)
        playPauseBtnTimer.current = setTimeout(() => setShowPlayPauseBtn(false), 2000)
        // 🔧「切视频不要自动静音」：起播通过浏览器 muted 校验后，立刻恢复用户真实静音偏好
        restoreUserMutedAfterPlay()
      }).catch(err => {
        console.error('[VIDEO] play() rejected:', err && err.name, err && err.message, 'postId=', postId)
        // readyState >= 2 但浏览器拒绝 play → 1 秒后再试一次（视频数据在途中，等缓冲完成）
        if (!autoRetryRef.current[postId]) {
          autoRetryRef.current[postId] = true
          setTimeout(() => {
            try {
              if (videoRef.current === video && !video.paused) return // 已经在播放就不用再试
              applyVideoMuted(true)
              video.play().then(() => {
                setVideoPlaying(true)
                setVideoError(false)
                // 🔧 同上：重试成功后也恢复用户静音偏好
                restoreUserMutedAfterPlay()
              }).catch(e => {
                console.warn('[VIDEO] auto retry also failed:', e && e.message)
                setVideoError(true)
              })
            } catch (_) {}
          }, 1000)
        } else {
          setVideoError(true)
        }
      })
    }

    // 如果浏览器已缓存且数据就绪，直接播放，无需等事件
    if (video.readyState >= 2) {
      tryPlay()
      return
    }

    // 等待 canplay 事件
    video.addEventListener('canplay', tryPlay, { once: true })

    // 超时兜底：8 秒后强制尝试
    const fallbackTimer = setTimeout(() => {
      video.removeEventListener('canplay', tryPlay)
      tryPlay()
    }, 8000)

    return () => {
      video.removeEventListener('canplay', tryPlay)
      clearTimeout(fallbackTimer)
    }
  }, [currentIndex, applyVideoMuted, allPosts, restoreUserMutedAfterPlay])

  const handlePurchase = async () => {
    if (!selectedProduct) return
    const userPoints = user?.points || 0
    if (userPoints < selectedProduct.price) {
      if (window.confirm(`${t('feed.insufficientPoints')}\n\nCurrent Points: ${userPoints} ⭐\nRequired: ${selectedProduct.price} ⭐\n\nGo to recharge?`)) {
        window.location.href = '/recharge'
      }
      return
    }
    setIsPurchasing(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsPurchasing(false)
    setPurchaseSuccess(true)
    setTimeout(() => {
      setSelectedProduct(null)
      setPurchaseSuccess(false)
    }, 2000)
  }

  // 初始自动播放（useLayoutEffect 确保监听器先于浏览器 canplay 事件挂载）
  useLayoutEffect(() => {
    const video = videoRef.current
    const firstId = allPosts[0]?.id || 'idx-0'
    if (!video || !isVideo(allPosts[0]?.media)) return

    // 清除该条目的重试标志，让首次也有 1 次重试机会
    if (autoRetryRef.current[firstId]) delete autoRetryRef.current[firstId]

    // React muted bug 修复：通过 applyVideoMuted 统一对齐 DOM
    applyVideoMuted(true)

    const tryPlay = () => {
      applyVideoMuted(true)
      video.play().then(() => {
        setVideoPlaying(true)
        setShowPlayPauseBtn(true)
        if (playPauseBtnTimer.current) clearTimeout(playPauseBtnTimer.current)
        playPauseBtnTimer.current = setTimeout(() => setShowPlayPauseBtn(false), 2000)
        // 🔧「切视频不要自动静音」：初始起播 muted 通过浏览器策略后，按用户偏好恢复
        restoreUserMutedAfterPlay()
      }).catch(err => {
        console.error('[VIDEO] initial play failed:', err && err.name, err && err.message)
        // 自动再试一次（同源代理首次加载视频元数据可能比 readyState 就绪更早，延迟 1s 等数据到齐）
        if (!autoRetryRef.current[firstId]) {
          autoRetryRef.current[firstId] = true
          setTimeout(() => {
            try {
              applyVideoMuted(true)
              video.play().then(() => {
                setVideoPlaying(true)
                setVideoError(false)
                // 🔧 重试也恢复用户静音偏好
                restoreUserMutedAfterPlay()
              }).catch(e => {
                console.warn('[VIDEO] initial play retry also failed:', e && e.message)
                setVideoError(true)
              })
            } catch (_) {}
          }, 1000)
        } else {
          setVideoError(true)
        }
      })
    }
    if (video.readyState >= 2) {
      tryPlay()
    } else {
      video.addEventListener('canplay', tryPlay, { once: true })
    }
    return () => {
      video.removeEventListener('canplay', tryPlay)
    }
  }, [applyVideoMuted, allPosts, restoreUserMutedAfterPlay])

  const currentPost = allPosts[currentIndex]
  const petEmoji = currentPost?.features?.petType ? getPetAvatar(currentPost.features.petType) : currentPost?.user?.avatar || '🐾'
  const postId = currentPost?.id || ''
  const displayLikes = postLikes[postId] || currentPost?.likes || 0
  const displayFavorites = postFavorites[postId] || currentPost?.favorites || 0



  // 页面可见性处理
  useEffect(() => {
    const handleVisibilityChange = () => {
      const video = videoRef.current
      if (video && document.hidden) {
        video.pause()
      } else if (video && !document.hidden) {
        const currentMedia = allPosts[currentIndex]?.media
        if (isVideo(currentMedia)) {
          // 回到前台：先 muted=true 保证浏览器策略通过，起播后再按用户真实偏好恢复静音状态
          applyVideoMuted(true)
          video.play().then(() => { restoreUserMutedAfterPlay(); }).catch(() => {})
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [currentIndex, allPosts, applyVideoMuted, restoreUserMutedAfterPlay])

  // ====== 🔧 切帖时重置转码层级（每条视频都从默认的 720p 转码源开始，画面看门狗自动再降级到 480p）+ object-fit 归位
  useEffect(() => {
    setTranscodeTier('720p')
    setFrameFit('cover')
    if (frameWatchdogRef.current) { clearTimeout(frameWatchdogRef.current); frameWatchdogRef.current = null }
  }, [currentIndex])

  // ====== 🔧 画面就绪看门狗（核心：解决"只有声音没画面"根因）
  // 触发时机：canplay / onLoadedData 后起 2 秒定时器（此时 readyState>=3，若视频轨健康则 videoWidth 必然 >0）
  // 检测：videoWidth===0 || videoHeight===0
  //   → 第一次：自动把 src 切到 Cloudinary vc_h264,w_720,h_720,c_limit,q_auto 转码源（仍然走 proxy）
  //   → 第二次（720p 也失败）：再切 480p 降级档
  //   → 仍失败：弹错误面板 + 显示「VIDEO_TRACK_NO_OUTPUT」中文解释 + 三按钮手动兜底
  useEffect(() => {
    const scheduleFrameWatchdog = () => {
      if (frameWatchdogRef.current) { clearTimeout(frameWatchdogRef.current); frameWatchdogRef.current = null }
      if (!isCurrentVideo || videoError) return
      frameWatchdogRef.current = setTimeout(() => {
        const v = videoRef.current
        if (!v) return
        const vW = v.videoWidth || 0
        const vH = v.videoHeight || 0
        // 拿盒子信息（在不能用 browser_evaluate 的环境下靠日志曲线验证）
        let boxW = 0, boxH = 0
        try { const r = v.getBoundingClientRect(); boxW = r.width; boxH = r.height } catch (_) {}
        const hasFrame = vW > 0 && vH > 0
        const pid = currentPost?.id || ('idx-' + currentIndex)
        console.log(`[VIDEO] frameWatchdog 2s check post=${pid}: videoW=${vW} x H=${vH}; box=${boxW.toFixed(0)}x${boxH.toFixed(0)}; readyState=${v.readyState}; errorCode=${v.error?.code ?? 'none'}; muted=${v.muted}; paused=${v.paused}; src=${(v.currentSrc||'').slice(0,80)}`)
        if (!hasFrame) {
          // 视频轨无输出 → 按 transcodeTier 逐级自动降级（默认 720p→仍失败再 480p→还不行就弹面板）
          const currentSrc = v.currentSrc || v.getAttribute('src') || currentPost?.media || ''
          const nextTier = transcodeTier === '720p' ? '480p' : 'deadend'
          console.warn(`[VIDEO] frameWatchdog: NO VIDEO OUTPUT (${vW}x${vH}) tier=${transcodeTier}→${nextTier} post=${pid}`)
          if (nextTier !== 'deadend') {
            const fallbackSrc = getCloudinaryTranscodeFallback(currentSrc, nextTier)
            // 如果没有变化（非 Cloudinary），没必要重复 load，直接报错
            if (fallbackSrc && fallbackSrc !== currentSrc) {
              setTranscodeTier(nextTier)
              // 🔧 强制绕过浏览器 disk cache（旧的坏 MIME 响应被 Cache-Control max-age=86400 缓存了一天）
              // 后端修复后首次清缓存必须靠新 URL 不同（否则 frame 仍然走旧 0x0 的解析结果）
              const cacheBust = fallbackSrc + (fallbackSrc.includes('?') ? '&' : '?') + '__r=' + Date.now() + '&tier=' + nextTier
              // 不要触发错误面板（这是自动降级的 happy path），直接 load+play
              try {
                v.src = cacheBust
                applyVideoMuted(true)
                v.load()
                v.play().then(() => {
                  setVideoPlaying(true)
                  setVideoError(false)
                  // 🔧「切视频不要自动静音」：画面看门狗降级转码后起播也恢复用户偏好
                  restoreUserMutedAfterPlay()
                }).catch(() => {})
              } catch (_) {}
              // 切源后再等 4 秒再看一次画面（等转码源拉数据）
              if (frameWatchdogRef.current) clearTimeout(frameWatchdogRef.current)
              frameWatchdogRef.current = setTimeout(() => {
                const v2 = videoRef.current
                if (!v2) return
                const w = v2.videoWidth || 0, h = v2.videoHeight || 0
                console.log(`[VIDEO] frameWatchdog 4s after transcode(${nextTier}): ${w}x${h} post=${pid}`)
                if (w === 0 || h === 0) {
                  // 自动降级还是不行 → 弹错误面板（给用户三按钮手动入口）
                  setVideoErrorMsg(`VIDEO_TRACK_NO_OUTPUT（${nextTier} 转码后 2s 内仍无画面输出 ${w}x${h}）→ 建议点击「🔁 转码源重试」或手动切换 Fit`)
                  setVideoError(true)
                }
              }, 4000)
              return
            }
          }
          // deadend 或 非 Cloudinary → 直接弹错误面板
          setVideoErrorMsg(`VIDEO_TRACK_NO_OUTPUT（视频轨 2s 内无画面输出 ${vW}x${vH}）→ 编码不兼容或源无视频轨；建议「跳过到下一条」或手动 Fit`)
          setVideoError(true)
        }
      }, 2000)
    }
    if (!isCurrentVideo) return
    // 初始起一个（canplay 事件里也会再调一次，但 useLayoutEffect 的 tryPlay 可能在挂载后直接触发 playing）
    scheduleFrameWatchdog()
    return () => {
      if (frameWatchdogRef.current) { clearTimeout(frameWatchdogRef.current); frameWatchdogRef.current = null }
    }
  }, [currentIndex, isCurrentVideo, transcodeTier, applyVideoMuted, currentPost?.media, currentPost?.id, videoError, restoreUserMutedAfterPlay])

  // 🔧 看门狗：切换视频 6s 后如果仍 paused=true 且无错误 → 强制 reload() + 显示中间大▶，保证用户任何网络情况都有手动播放入口
  useEffect(() => {
    if (playWatchdogRef.current) clearTimeout(playWatchdogRef.current)
    if (!isCurrentVideo) return
    playWatchdogRef.current = setTimeout(() => {
      const v = videoRef.current
      if (v && v.paused && !videoError) {
        console.warn('[VIDEO] watchdog: still paused after 6s, force reload + play attempt')
        try {
          applyVideoMuted(true)
          v.load()
          v.play().then(() => {
            setVideoPlaying(true)
            // 🔧「切视频不要自动静音」：6s 看门狗强制起播也恢复用户偏好
            restoreUserMutedAfterPlay()
          }).catch(() => setVideoError(true))
        } catch (_) {}
      }
    }, 6000)
    return () => {
      if (playWatchdogRef.current) clearTimeout(playWatchdogRef.current)
    }
  }, [currentIndex, isCurrentVideo, videoError, applyVideoMuted, restoreUserMutedAfterPlay])

  // 视频播放时自动隐藏悬浮按钮，暂停时显示
  useEffect(() => {
    if (videoPlaying && isCurrentVideo) {
      if (hideUITimer.current) clearTimeout(hideUITimer.current)
      hideUITimer.current = setTimeout(() => setShowUI(false), 2000)
    } else {
      if (hideUITimer.current) clearTimeout(hideUITimer.current)
      setShowUI(true)
    }
  }, [videoPlaying, isCurrentVideo])

  if (!currentPost) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white text-xl">Loading posts...</p>
      </div>
    )
  }

  return (
    <>
    <SEO title="Community Posts" description="Browse pet videos, photos, and posts from the PawPawTrain community. Discover adorable pets and trending content." />
    <div 
      ref={containerRef}
      className="fixed inset-0 overflow-hidden select-none bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => {
        // 点击视频区域以外的地方也显示 UI
        if (e.target === containerRef.current) {
          showUIWithTimeout()
        }
      }}
    >
        <AnimatePresence>
          <motion.div
            key={currentPost.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0">
              {currentPost && typeof currentPost.media === 'string' && (currentPost.media.startsWith('http') || currentPost.media.startsWith('/') || currentPost.media.startsWith('data:image') || currentPost.media.startsWith('data:video') || currentPost.media.startsWith('blob:')) ? (
                isCurrentVideo ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black" style={{ zIndex: 10 }} onClick={(e) => { e.stopPropagation(); handleVideoClick(); }}>
                    <video
                      key={currentPost?.id || currentIndex + '-' + transcodeTier}
                      ref={videoRef}
                      src={currentPost.media}
                      autoPlay
                      muted={videoMuted}
                      loop
                      playsInline
                      crossOrigin="anonymous"
                      preload="auto"
                      style={{ width: '100%', height: '100%', objectFit: frameFit, backgroundColor: '#000' }}
                      onLoadedMetadata={(e) => {
                        const v = e.currentTarget || videoRef.current
                        const vW = v?.videoWidth || 0, vH = v?.videoHeight || 0
                        let boxW = 0, boxH = 0
                        try { const r = v?.getBoundingClientRect(); boxW = r.width; boxH = r.height } catch (_) {}
                        console.log(`[VIDEO] metadata loaded: ${currentPost?.id} frame=${vW}x${vH}; box=${boxW.toFixed(0)}x${boxH.toFixed(0)}; tier=${transcodeTier}; fit=${frameFit}; muted=${v?.muted}; paused=${v?.paused}; readyState=${v?.readyState}; err=${v?.error?.code ?? 'none'}`)
                        // 🔧 兜底：有些 Chromium 版本 readyState>=2 但 React useLayoutEffect 的 tryPlay catch 后自动重试仍被拒 → 数据就绪后最后再试一次 play（静音）
                        if (v && v.paused) {
                          try { applyVideoMuted(true); v.play().then(() => { setVideoPlaying(true); restoreUserMutedAfterPlay(); }).catch(() => {}) } catch (_) {}
                        }
                      }}
                      onLoadedData={(e) => {
                        const v = e.currentTarget || videoRef.current
                        const vW = v?.videoWidth || 0, vH = v?.videoHeight || 0
                        console.log(`[VIDEO] data loaded: ${currentPost?.id} frame=${vW}x${vH}; tier=${transcodeTier}`)
                        // 🔧 再兜底：loadeddata 后视频缓冲已就绪，此时 99% 能成功 play（即便 canplay 监听器因 once:true 被 readyState 分支提前消费）
                        if (v && v.paused && !videoError) {
                          try { applyVideoMuted(true); v.play().then(() => { setVideoPlaying(true); restoreUserMutedAfterPlay(); }).catch(() => {}) } catch (_) {}
                        }
                      }}
                      onCanPlay={(e) => {
                        const v = e.currentTarget || videoRef.current
                        const vW = v?.videoWidth || 0, vH = v?.videoHeight || 0
                        console.log(`[VIDEO] can play: ${currentPost?.id} frame=${vW}x${vH}; tier=${transcodeTier}`)
                        // 🔧 canplay 后再试一次（有的浏览器 useLayoutEffect 里 canplay 事件比 addEventListener 先到，导致 once:true 的 listener 漏触发）
                        if (v && v.paused && !videoError) {
                          try { applyVideoMuted(true); v.play().then(() => { setVideoPlaying(true); restoreUserMutedAfterPlay(); }).catch(() => {}) } catch (_) {}
                        }
                      }}
                      onPlay={() => { setVideoPlaying(true); setVideoError(false); setShowPlayPauseBtn(true); }}
                      onPause={() => setVideoPlaying(false)}
                      onEnded={() => { videoRef.current?.play().catch(() => {}); }}
                      onError={(e) => {
                        const err = e.currentTarget.error
                        const src = e.currentTarget.src || ''
                        const codeName = ({ 1: 'MEDIA_ERR_ABORTED', 2: 'MEDIA_ERR_NETWORK', 3: 'MEDIA_ERR_DECODE', 4: 'MEDIA_ERR_SRC_NOT_SUPPORTED' })[err?.code || 0] || 'UNKNOWN'
                        const vW = e.currentTarget.videoWidth || 0, vH = e.currentTarget.videoHeight || 0
                        console.error('[VIDEO] error code:', err?.code, '(' + codeName + ') message:', err?.message, 'frame=', vW + 'x' + vH, 'tier=', transcodeTier, 'src head:', src.substring(0, 140))
                        setVideoErrorMsg(`${codeName} (${err?.code ?? '?'}) ${err?.message ? '→ ' + err.message : ''}`)
                        // ====== 🔧 MEDIA_ERR_DECODE(3) 或 SRC_NOT_SUPPORTED(4) + videoWidth==0：
                        // 这也是"只有声音没画面"的变体（浏览器直接把它当错误抛出），走同一套转码自动兜底逻辑。
                        if ((err?.code === 3 || err?.code === 4) && (vW === 0 || vH === 0)) {
                          const nextTier = transcodeTier === '720p' ? '480p' : 'deadend'
                          if (nextTier !== 'deadend') {
                            const fallbackSrc = getCloudinaryTranscodeFallback(src, nextTier)
                            if (fallbackSrc && fallbackSrc !== src) {
                              console.warn(`[VIDEO] onError DECODE/SRC: auto fallback tier ${transcodeTier}→${nextTier}`)
                              setTranscodeTier(nextTier)
                              const v = videoRef.current
                              try {
                                if (v) {
                                  v.src = fallbackSrc
                                  applyVideoMuted(true)
                                  v.load()
                                  v.play().then(() => { setVideoPlaying(true); setVideoError(false); setVideoErrorMsg(''); restoreUserMutedAfterPlay(); }).catch(() => { setVideoError(true) })
                                }
                              } catch (_) { setVideoError(true) }
                              return // 不要立刻把错误面板弹出来（等下一次 4s 看门狗兜底再弹）
                            }
                          }
                        }
                        setVideoError(true)
                        setVideoPlaying(false)
                      }}
                    />
                    {/* 播放/暂停控制按钮（自动隐藏） */}
                    <AnimatePresence>
                      {showPlayPauseBtn && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ zIndex: 20, pointerEvents: 'none' }}
                        >
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleVideoClick(); }}
                            className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-all hover:scale-110 active:scale-90"
                            style={{ pointerEvents: 'auto' }}
                            title={videoPlaying ? 'Pause / 暂停' : 'Play / 播放'}
                          >
                            <span className="text-3xl">{videoPlaying ? '⏸' : '▶'}</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* 播放/暂停指示器 */}
                    <AnimatePresence>
                      {showPlayIndicator && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                          style={{ zIndex: 20 }}
                        >
                          <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-4xl">{videoPlaying ? '⏸' : '▶'}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* 视频错误提示：展示 MediaError.code + 中文解释 + 重播/跳过两个按钮 */}
                    <AnimatePresence>
                      {videoError && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75 px-4"
                          style={{ zIndex: 25 }}
                        >
                          <div className="text-4xl">⚠️</div>
                          <p className="text-white text-base font-semibold">{t('feed.videoError')}</p>
                          {videoErrorMsg && (
                            <div className="w-full max-w-sm rounded-lg bg-white/10 px-3 py-2 text-xs text-white/90 break-all ring-1 ring-white/10">
                              <div className="mb-1 font-medium text-orange-300">Error / 错误码：{videoErrorMsg}</div>
                              <div className="text-white/70 leading-5">
                                • VIDEO_TRACK_NO_OUTPUT：<b className="text-white">「只有声音没画面」</b>专属错误，视频轨在 2s 内无任何像素输出 → 已自动尝试 Cloudinary H.264 转码源；仍不显示请点下方「🔁 H.264 转码源重试」或切换 Fit。
                                <br />• MEDIA_ERR_ABORTED(1)：请求被中断，可能是 CDN 临时限流，点「重试」一般可恢复。
                                <br />• MEDIA_ERR_NETWORK(2)：网络错误/跨域失败，建议「跳过到下一条」。
                                <br />• MEDIA_ERR_DECODE(3)：视频流损坏或浏览器不支持该编码（高码率/10bit/H.265 都可能），<b className="text-white">点「🔁 转码源」</b>可强制切 H.264 720p/480p 解码兼容源。
                                <br />• MEDIA_ERR_SRC_NOT_SUPPORTED(4)：格式不支持或该资源在云端不存在。
                              </div>
                            </div>
                          )}
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setVideoError(false)
                                setVideoErrorMsg('')
                                const v = videoRef.current
                                if (v) {
                                  applyVideoMuted(true)
                                  // 强制重新 load + 带时间戳绕过 CDN 坏缓存
                                  try {
                                    const raw = v.getAttribute('src') || v.currentSrc || currentPost?.media || ''
                                    const sep = raw.includes('?') ? '&' : '?'
                                    v.src = raw + sep + '__r=' + Date.now()
                                  } catch (_) {}
                                  v.load()
                                  v.play().then(() => { setVideoPlaying(true); restoreUserMutedAfterPlay(); }).catch(() => setVideoError(true))
                                }
                              }}
                              className="px-4 py-2 bg-orange-500/90 hover:bg-orange-500 text-white rounded-full text-sm transition-all shadow-lg"
                            >
                              🔄 Retry / 重试
                            </button>
                            {/* ====== 🔧「只有声音没画面」专属按钮 1：手动强制切 Cloudinary H.264 转码源（vc_h264,w_720,h_720,c_limit,q_auto） */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                // 当前默认 720p → 再点就换 480p；480p 再点就回 720p（循环尝试）
                                const preset = transcodeTier === '720p' ? '480p' : '720p'
                                const v = videoRef.current
                                const src = (v?.currentSrc || currentPost?.media || '')
                                const fallback = getCloudinaryTranscodeFallback(src, preset)
                                setVideoError(false)
                                setVideoErrorMsg('')
                                setTranscodeTier(preset)
                                if (v && fallback) {
                                  v.src = proxyMediaUrl(fallback)
                                  applyVideoMuted(true)
                                  v.load()
                                  v.play().then(() => { setVideoPlaying(true); restoreUserMutedAfterPlay(); }).catch(() => setVideoError(true))
                                }
                              }}
                              className="px-4 py-2 bg-purple-500/90 hover:bg-purple-500 text-white rounded-full text-sm transition-all shadow-lg"
                              title="强制切 Cloudinary vc_h264 H.264 转码源（720p → 480p），专治「只有声音没画面 / 编码不兼容」"
                            >
                              🔁 H.264 转码源重试
                            </button>
                            {/* ====== 🔧「只有声音没画面」专属按钮 2：object-fit 手动切换 cover ↔ contain（极端横纵比时 contain 两侧留黑边看起来"没画面"，cover 会铺满） */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setFrameFit(prev => (prev === 'cover' ? 'contain' : 'cover'))
                                const v = videoRef.current
                                if (v) {
                                  try { v.style.objectFit = (frameFit === 'cover' ? 'contain' : 'cover') } catch (_) {}
                                }
                              }}
                              className="px-4 py-2 bg-slate-600/80 hover:bg-slate-600 text-white rounded-full text-sm transition-all shadow-lg"
                              title="视频画面铺满方式：cover=裁剪留画面(不黑边) / contain=保留全画面(可能黑边)"
                            >
                              🖼️ Fit: {frameFit === 'cover' ? 'Cover(铺满)' : 'Contain(全显)'}↔
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setVideoError(false)
                                setVideoErrorMsg('')
                                handleNext()
                              }}
                              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-full text-sm transition-all ring-1 ring-white/20"
                            >
                              ⏭ Skip / 跳过到下一条
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                // 用后端 media-proxy 兜底走同源：跨域/证书问题一般可通过代理绕过
                                setVideoError(false)
                                setVideoErrorMsg('')
                                const v = videoRef.current
                                const src = currentPost?.media || ''
                                if (v && src.startsWith('http')) {
                                  // 用 vc_h264 转码源走 proxy（更小，更可能低于 Vercel 4.5MB 限制）
                                  const transcodeSrc = getCloudinaryTranscodeFallback(src, transcodeTier === '480p' ? '480p' : '720p')
                                  const proxyUrl = '/api/media-proxy?url=' + encodeURIComponent(transcodeSrc && transcodeSrc !== src ? transcodeSrc : src)
                                  v.src = proxyUrl
                                  applyVideoMuted(true)
                                  v.load()
                                  v.play().then(() => { setVideoPlaying(true); restoreUserMutedAfterPlay(); }).catch(() => setVideoError(true))
                                }
                              }}
                              className="px-4 py-2 bg-blue-500/80 hover:bg-blue-500 text-white rounded-full text-sm transition-all shadow-lg"
                            >
                              🔁 Try via Proxy / 后端代理重试
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* 🔊 声音控制面板：右上角，永远可见；悬停/点击后展开音量滑条（系统音量拉到 0 的兜底） */}
                    {/* 用户要求删除一个喇叭 → 已移除全局 AudioStatusBadge，这里保留唯一的🔊控件，放回右上角用户习惯位置 */}
                    <div className="absolute top-3 right-3 z-[21000] flex items-start gap-2">
                      <button
                        type="button"
                        onClick={toggleVideoMute}
                        onMouseEnter={() => setShowVolumeSlider(true)}
                        onMouseLeave={() => {
                          if (soundHintTimer.current) clearTimeout(soundHintTimer.current)
                          soundHintTimer.current = setTimeout(() => setShowVolumeSlider(false), 600)
                        }}
                        title={videoMuted ? 'Unmute / 打开声音' : 'Mute / 静音'}
                        className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm text-2xl text-white shadow-lg ring-2 ring-white/20 hover:scale-110 active:scale-90 transition-all ${videoMuted ? 'bg-red-700/70 hover:bg-red-700/90' : 'bg-black/50 hover:bg-black/60'}`}
                      >
                        {videoMuted ? '🔇' : (videoVolume < 0.33 ? '🔈' : videoVolume < 0.66 ? '🔉' : '🔊')}
                      </button>
                      <AnimatePresence>
                        {showVolumeSlider && (
                          <motion.div
                            key="vol"
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 140, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            onMouseEnter={() => {
                              if (soundHintTimer.current) clearTimeout(soundHintTimer.current)
                            }}
                            onMouseLeave={() => {
                              if (soundHintTimer.current) clearTimeout(soundHintTimer.current)
                              soundHintTimer.current = setTimeout(() => setShowVolumeSlider(false), 500)
                            }}
                            className="flex h-11 items-center gap-2 rounded-full bg-black/60 backdrop-blur-sm px-3 shadow-lg ring-2 ring-white/20 overflow-hidden"
                          >
                            <span className="text-sm text-white/80 shrink-0">
                              {Math.round(videoVolume * 100)}
                            </span>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={videoMuted ? 0 : videoVolume}
                              onChange={handleVolumeChange}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 h-1 accent-orange-500 cursor-pointer w-full min-w-0"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {/* 首次进入提示用户需要点击🔊开声音（静音状态时显示，并给出 音量滑条 的提示） */}
                    {/* 🔊控件已移回 top-3 right-3，提示气泡紧贴在下方 top-16 */}
                    {videoMuted && (
                      <div className="absolute top-16 right-3 z-[21000] max-w-[240px] rounded-lg bg-black/80 backdrop-blur-sm px-3 py-2 text-xs text-white shadow-lg border border-white/10 leading-5"
                        style={{ pointerEvents: 'none' }}>
                        <div>🔇 Click 🔊 to turn on sound</div>
                        <div className="text-white/60 mt-0.5">点击🔊播放声音；悬停可调节音量</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <motion.img 
                    src={currentPost.media} 
                    alt="Pet" 
                    className="w-full h-full object-cover"
                    initial={{ scale: 1 }}
                    animate={{ scale: 1.08 }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  />
                )
              ) : (
                <motion.div 
                  className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center"
                  animate={{ background: ['linear-gradient(to bottom right, #1f1f2e, #2d2d44)', 'linear-gradient(to bottom right, #2d2d44, #1f1f2e)', 'linear-gradient(to bottom right, #1f1f2e, #2d2d44)'] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                >
                  <motion.span className="text-[30vh] opacity-50" animate={{ scale: [1, 1.1, 1], rotate: [-5, 5, -5] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                    {currentPost.media || '🐾'}
                  </motion.span>
                </motion.div>
              )}
              {!isCurrentVideo && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
              )}
            </div>

            {/* 左下侧悬浮 - 宠物头像+发布文字 */}
            <AnimatePresence>
              {showUI && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute bottom-6 left-4 z-20"
                >
                  <div className="flex flex-col gap-3">
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-1 shadow-lg shadow-purple-500/50"
                    >
                      <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-2xl">
                        {petEmoji}
                      </div>
                    </motion.div>
                    <div className="text-white text-sm leading-relaxed max-w-[200px] drop-shadow-lg">
                      {currentPost.content}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 右侧悬浮按钮区 - 用户头像、点赞、分享、收藏 */}
            <AnimatePresence>
              {showUI && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute right-4 bottom-28 z-20 flex flex-col items-center gap-5"
                >
                  {/* 用户头像 */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.05 }}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/50"
                  >
                    {currentPost.user.avatar}
                  </motion.div>
                  {/* 点赞按钮 */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.1 }}
                    className="flex flex-col items-center"
                  >
                    <button
                      type="button"
                      onClick={handleLike}
                      className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-90 ${
                        likedPosts[postId] ? 'bg-red-500/60 text-white scale-110' : 'bg-white/20 hover:bg-white/30'
                      }`}
                      title={t('feed.like')}
                    >
                      {likedPosts[postId] ? '❤️' : '🤍'}
                    </button>
                    <span className="text-white text-xs mt-1 font-medium drop-shadow-lg">{displayLikes}</span>
                  </motion.div>
                  {/* 分享按钮 */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.15 }}
                    className="flex flex-col items-center relative"
                  >
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setShowShareMenu(!showShareMenu); showUIWithTimeout(); }}
                      className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center text-2xl transition-all hover:scale-110 ${
                        showShareMenu ? 'bg-white/30' : 'bg-white/20 hover:bg-white/30'
                      }`}
                      title={t('feed.share')}
                    >
                      ↗️
                    </button>
                    <span className="text-white text-xs mt-1 font-medium drop-shadow-lg">{currentPost.shares || 0}</span>
                    <AnimatePresence>
                      {showShareMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                          className="absolute bottom-full mb-2 right-0 bg-gray-900/95 backdrop-blur-lg rounded-xl p-2 border border-white/10 shadow-xl"
                        >
                          <div className="grid grid-cols-3 gap-2">
                            {sharePlatforms.map((platform) => (
                              <motion.button
                                key={platform.id}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); handleShare(platform); }}
                                className={`w-12 h-12 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center text-xl shadow-md`}
                                title={platform.name}
                              >
                                {platform.icon}
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  {/* 收藏按钮 */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.2 }}
                    className="flex flex-col items-center"
                  >
                    <button
                      type="button"
                      onClick={handleFavorite}
                      className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-90 ${
                        favoritedPosts[postId] ? 'bg-yellow-500/60 text-white scale-110' : 'bg-white/20 hover:bg-white/30'
                      }`}
                      title={t('feed.save')}
                    >
                      {favoritedPosts[postId] ? '⭐' : '💾'}
                    </button>
                    <span className="text-white text-xs mt-1 font-medium drop-shadow-lg">{displayFavorites}</span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 底部快捷操作栏 */}
            <AnimatePresence>
              {showUI && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20"
                >
                  <div className="flex justify-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => { e.stopPropagation(); showUIWithTimeout(); }}
                      className="w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-md shadow-orange-500/30"
                      title={t('feed.adopt')}
                    >🐱</motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => { e.stopPropagation(); showUIWithTimeout(); }}
                      className="w-8 h-8 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-md shadow-blue-500/30"
                      title={t('feed.swap')}
                    >🔄</motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => { e.stopPropagation(); showUIWithTimeout(); }}
                      className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-md shadow-purple-500/30"
                      title={t('feed.coop')}
                    >🤝</motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => { e.stopPropagation(); showUIWithTimeout(); }}
                      className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-md shadow-green-500/30"
                      title={t('feed.addFriend')}
                    >👥</motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {/* 顶部筛选按钮 - 视频播放时隐藏 */}
        <AnimatePresence>
          {showUI && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute top-2 left-2 z-20 flex gap-1"
            >
              <button type="button" onClick={(e) => { e.stopPropagation(); setMediaFilter('all'); setCurrentIndex(0); showUIWithTimeout(); }}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all hover:scale-110 ${mediaFilter === 'all' ? 'bg-white text-black' : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'}`}
                title={t('feed.all')}>📷</button>
              <button type="button" onClick={(e) => { e.stopPropagation(); setMediaFilter('image'); setCurrentIndex(0); showUIWithTimeout(); }}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all hover:scale-110 ${mediaFilter === 'image' ? 'bg-white text-black' : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'}`}
                title={t('feed.image')}>🖼️</button>
              <button type="button" onClick={(e) => { e.stopPropagation(); setMediaFilter('video'); setCurrentIndex(0); showUIWithTimeout(); }}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all hover:scale-110 ${mediaFilter === 'video' ? 'bg-white text-black' : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'}`}
                title={t('feed.video')}>🎬</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 左侧 AI 工坊 - 视频播放时隐藏 */}
        <AnimatePresence>
          {showUI && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-16"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-sm" title={t('feed.aiWorkshop')}>🛠️</span>
                </div>
                <div className="space-y-1">
                  {aiProducts.slice(0, 3).map((product, index) => (
                    <motion.button
                      key={product.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); }}
                      className="w-full bg-white/10 hover:bg-white/20 rounded-lg p-1.5 transition-all flex items-center justify-center"
                      title={product.name}
                    >
                      <span className="text-sm">{product.icon}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 购买弹窗 */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl w-full max-w-sm overflow-hidden border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              {!purchaseSuccess ? (
                <>
                  <div className="p-6 text-center">
                    <div className="text-6xl mb-4">{selectedProduct.icon}</div>
                    <h3 className="text-xl font-bold text-white mb-2">{selectedProduct.name}</h3>
                    <p className="text-gray-400 text-sm mb-6">{selectedProduct.description}</p>
                    <div className="flex items-center justify-center gap-6 mb-6">
                      <div className="text-center">
                        <div className="text-gray-400 text-xs">{t('shop.points')}</div>
                        <div className="text-2xl font-bold text-yellow-400">{selectedProduct.price} <span className="text-sm">{t('shop.points')}</span></div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400 text-xs">{t('feed.sales')}</div>
                        <div className="text-lg font-medium text-white">{selectedProduct.sales}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400 text-xs">{t('shop.myPoints')}</div>
                        <div className="text-lg font-medium text-green-400">{user?.points || 0}</div>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePurchase}
                      disabled={isPurchasing || (user?.points || 0) < selectedProduct.price}
                      className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
                        (user?.points || 0) >= selectedProduct.price
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isPurchasing ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          {t('feed.buying')}
                        </span>
                      ) : (user?.points || 0) < selectedProduct.price ? (
                        'Insufficient Points'
                      ) : (
                        `${t('feed.buyNow')} (${selectedProduct.price}${t('shop.points')})`
                      )}
                    </motion.button>

                    {/* 积分不足时显示充值入口 */}
                    {(user?.points || 0) < selectedProduct.price && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setSelectedProduct(null); window.location.href = '/recharge'; }}
                        className="w-full mt-2 py-3 rounded-2xl font-bold text-base bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 text-yellow-400 transition-all"
                      >
                        💎 Recharge Now
                      </motion.button>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-10 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 mx-auto flex items-center justify-center text-4xl mb-4"
                  >✨</motion.div>
                  <h3 className="text-xl font-bold text-white mb-2">{t('feed.purchaseSuccess')}</h3>
                  <p className="text-gray-400 text-sm">{t('feed.itemSent')}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Feed
