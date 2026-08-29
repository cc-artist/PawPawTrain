/**
 * Vercel Serverless Function — 媒体代理
 * 
 * 绕过浏览器代理/网络限制，由 Vercel 后端直接拉取 Cloudinary/Unsplash 等外部视频和图片。
 * 调用方式: GET /api/media-proxy?url=<encoded_external_url>
 */

import axios from 'axios';

// 白名单域名
const ALLOWED_HOSTS = [
  'res.cloudinary.com',
  'images.unsplash.com',
  'plus.unsplash.com',
];

export default async function handler(req, res) {
  // 对所有请求设置 CORS（浏览器 video 元素在跨域场景中也需要）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
  res.setHeader('Timing-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Vercel serverless 使用标准 Node.js req，没有 req.query，需手动解析
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const targetUrl = parsedUrl.searchParams.get('url');
    if (!targetUrl) {
      console.error('[MediaProxy] Missing url parameter');
      res.status(400).json({ error: 'Missing url parameter' });
      return;
    }

    // 安全校验：URL 解析
    let urlObj;
    try {
      urlObj = new URL(targetUrl);
    } catch {
      console.error('[MediaProxy] Invalid URL:', targetUrl.substring(0, 100));
      res.status(400).json({ error: 'Invalid URL' });
      return;
    }

    // 安全校验：只允许白名单域名
    if (!ALLOWED_HOSTS.some(h => urlObj.hostname === h || urlObj.hostname.endsWith('.' + h))) {
      console.error('[MediaProxy] Host not allowed:', urlObj.hostname);
      res.status(403).json({ error: 'Host not allowed' });
      return;
    }

    console.log(`[MediaProxy] -> ${urlObj.hostname}${urlObj.pathname.substring(0, 80)}`);

    const upstream = await axios({
      method: req.method,
      url: targetUrl,
      responseType: 'stream',
      timeout: 45000,
      headers: req.headers.range ? { Range: req.headers.range } : {},
      validateStatus: () => true,
    });

    console.log(`[MediaProxy] <- status=${upstream.status} type=${upstream.headers['content-type']} len=${upstream.headers['content-length'] || '?'}`);

    if (upstream.status >= 400) {
      if (upstream.data && typeof upstream.data.destroy === 'function') {
        upstream.data.destroy();
      }
      res.status(upstream.status).json({ error: 'Upstream error', upstreamStatus: upstream.status });
      return;
    }

    // HEAD 请求只返回头信息
    if (req.method === 'HEAD') {
      res.status(upstream.status);
      if (upstream.headers['content-type']) res.setHeader('Content-Type', upstream.headers['content-type']);
      if (upstream.headers['content-length']) res.setHeader('Content-Length', upstream.headers['content-length']);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.end();
      if (upstream.data && typeof upstream.data.destroy === 'function') upstream.data.destroy();
      return;
    }

    // 设置响应头
    const contentType = upstream.headers['content-type'] || 'application/octet-stream';
    const contentLength = upstream.headers['content-length'];

    // ====== 同步 backend/src/server.js 的 MIME 修复：
    // 前端 <video> 的 src 是同源 /api/media-proxy?url=...（无 .mp4 扩展名），
    // 当上游 Cloudinary 返回 application/octet-stream 等模糊 MIME 时，
    // Chromium MIME sniff 会优先按音频解（只有声音 videoWidth=0）。
    // 修复：按真实目标 URL 的扩展名/路径特征强制指定准确 MIME。
    const pathname = urlObj.pathname || '';
    const isVideoPath = pathname.includes('/video/upload/') || /\.(mp4|mov|webm|ogg|m4v|mkv|3gp)(\?|$)/i.test(pathname);
    const isImagePath = pathname.includes('/image/upload/') || /\.(jpg|jpeg|png|gif|webp|avif)(\?|$)/i.test(pathname);
    let fixedContentType = contentType || '';
    if (isVideoPath) {
      const ext = (pathname.match(/\.(mp4|mov|webm|ogg|m4v|mkv|3gp)(\?|$)/i) || [])[1]?.toLowerCase() || 'mp4';
      const mimeMap = { mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', ogg: 'video/ogg', m4v: 'video/x-m4v', mkv: 'video/x-matroska', '3gp': 'video/3gpp' };
      fixedContentType = mimeMap[ext] || 'video/mp4';
    } else if (isImagePath) {
      const ext = (pathname.match(/\.(jpg|jpeg|png|gif|webp|avif)(\?|$)/i) || [])[1]?.toLowerCase() || 'jpeg';
      const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif' };
      fixedContentType = mimeMap[ext] || 'image/jpeg';
    } else if (!fixedContentType) {
      fixedContentType = 'application/octet-stream';
    }

    if (req.headers.range && upstream.status === 206) {
      res.status(206);
      if (upstream.headers['content-range']) {
        res.setHeader('Content-Range', upstream.headers['content-range']);
      }
    } else {
      res.status(200);
    }

    res.setHeader('Content-Type', fixedContentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Disposition', 'inline');

    // 流式传输，并等待完成（防止 Vercel 提前终止函数）
    await new Promise((resolve, reject) => {
      upstream.data.pipe(res);
      upstream.data.on('end', () => {
        console.log(`[MediaProxy] stream complete`);
        resolve();
      });
      upstream.data.on('error', (err) => {
        console.error('[MediaProxy] stream error:', err.message);
        if (!res.headersSent) {
          res.status(502).json({ error: 'Stream error' });
        }
        reject(err);
      });
      req.on('close', () => {
        console.log('[MediaProxy] client disconnected');
        upstream.data.destroy();
        resolve();
      });
    });

  } catch (err) {
    console.error('[MediaProxy] Error:', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Media proxy error', detail: err.message });
    }
  }
}
