import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.env') });

const ARK_API_KEY = process.env.ARK_API_KEY || process.env.DOUBAO_API_KEY;
const DOUBAO_BASE_URL = process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
const DOUBAO_MODEL = 'doubao-seedream-5.0-250630';

/**
 * 豆包 (Doubao) / 火山方舟 ARK API - Seedream 5.0 图像生成服务
 * 
 * API 文档: https://www.volcengine.com/docs/82379/1569458
 */
class DoubaoService {
  constructor() {
    this.apiKey = ARK_API_KEY;
    this.baseUrl = DOUBAO_BASE_URL;
    this.model = DOUBAO_MODEL;
  }

  /**
   * 构建宠物图像生成的 prompt
   * @param {Object} petData - 宠物属性数据
   * @returns {string} 生成 prompt
   */
  buildPetPrompt(petData) {
    const {
      type = 'cat',
      name = '宠物',
      color = '花色',
      artStyle = '3d_cartoon',
      intimacy = 50,
      energy = 50,
      joy = 50
    } = petData;

    // 宠物类型的英文映射
    const petTypeNames = {
      dog: 'dog', cat: 'cat', rabbit: 'rabbit', hamster: 'hamster',
      bird: 'bird', fish: 'fish', turtle: 'turtle', snake: 'snake',
      lizard: 'lizard', frog: 'frog', hedgehog: 'hedgehog',
      guinea_pig: 'guinea pig', chinchilla: 'chinchilla', ferret: 'ferret',
      parrot: 'parrot', tropical_fish: 'tropical fish',
      spider: 'spider', crab: 'crab', scorpion: 'scorpion',
      axolotl: 'axolotl', penguin: 'penguin', panda: 'panda',
      fox: 'fox', sugar_glider: 'sugar glider'
    };

    const petTypeEn = petTypeNames[type] || type;
    const petColor = color === '花色' ? 'colorful patterned' : color;

    // 表情描述（根据属性）
    let expression = 'neutral and cute';
    if (joy > 70) expression = 'very happy and smiling';
    else if (joy < 30) expression = 'slightly sad';
    else if (energy > 70) expression = 'energetic and playful';

    // 风格映射
    const stylePrompts = {
      '3d_cartoon': '3D cartoon render, Pixar-style, cute big eyes, soft lighting, smooth textures, adorable proportions, rendered in Blender, highly detailed fur',
      'anime_cel': 'anime cel-shaded style, Japanese animation aesthetic, clean lines, vibrant colors, Studio Trigger style',
      'makoto_shinkai': 'Makoto Shinkai style, beautiful lighting, photorealistic background with soft focus, emotional atmosphere, cinematic composition',
      'flat_design': 'flat vector illustration style, minimal design, clean geometric shapes, pastel colors, modern aesthetic',
      'cyberpunk': 'cyberpunk style, neon lights, futuristic city background, glowing accents, dark atmospheric, synthwave aesthetic',
      'healing': 'soft healing illustration style, warm pastel tones, gentle watercolor textures, cozy atmosphere, surrounded by flowers and soft light',
      'ghibli': 'Studio Ghibli inspired, hand-drawn animation style, soft watercolor backgrounds, warm nostalgic feel, magical atmosphere',
      'american': 'American cartoon style, exaggerated expressions, bold outlines, vibrant colors, dynamic posing, comic book energy',
      'chinese': 'traditional Chinese ink wash painting style, elegant brushstrokes, classical aesthetic, flowing lines, ethereal atmosphere',
      'dark_fantasy': 'dark fantasy illustration, gothic aesthetic, dramatic lighting, mysterious atmosphere, intricate details, ethereal glow'
    };

    const stylePrompt = stylePrompts[artStyle] || stylePrompts['3d_cartoon'];

    // 构建完整 prompt
    let prompt = `A cute ${petColor} ${petTypeEn} named ${name}, ${expression}, ${stylePrompt}`;

    // 添加属性细节
    if (intimacy > 70) prompt += ', looking affectionately at viewer';
    if (energy > 70) prompt += ', dynamic playful pose, mid-action';

    prompt += ', pet portrait, centered composition, high quality, masterpiece, 4K, ultra detailed, professional digital art';

    return prompt;
  }

  /**
   * 调用豆包 Seedream 5.0 生成图像
   * @param {Object} petData - 宠物属性数据
   * @returns {Promise<{imageUrl: string, generationId: string}>}
   */
  async generatePetImage(petData) {
    if (!this.apiKey) {
      throw new Error('ARK API Key 未配置，请在 backend/.env 中设置 ARK_API_KEY');
    }

    const prompt = this.buildPetPrompt(petData);
    console.log('🎨 生成 Prompt:', prompt);
    console.log('🎨 使用模型:', this.model);

    try {
      const response = await axios.post(
        `${this.baseUrl}/images/generations`,
        {
          model: this.model,
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          response_format: 'url',
          quality: 'standard'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      console.log('✅ 豆包 API 响应:', JSON.stringify(response.data).slice(0, 500));

      const data = response.data;
      
      // ARK API 返回格式: { data: [{ url: '...' }] }
      if (data.data && data.data.length > 0 && data.data[0].url) {
        return {
          imageUrl: data.data[0].url,
          generationId: data.data[0].id || `gen_${Date.now()}`
        };
      }

      throw new Error('豆包 API 返回数据格式异常: ' + JSON.stringify(data));
    } catch (error) {
      console.error('❌ 豆包 API 调用失败:', error.response?.data || error.message);
      
      // 如果是 401/403，说明 API Key 无效
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('⚠️  API Key 认证失败，使用占位图像');
        return this.generatePlaceholderImage(petData);
      }
      
      // 如果是 429 限流
      if (error.response?.status === 429) {
        console.warn('⚠️  API 限流，使用占位图像');
        return this.generatePlaceholderImage(petData);
      }

      // 其他错误，使用占位图像
      console.warn('⚠️  图像生成失败，使用占位图像');
      return this.generatePlaceholderImage(petData);
    }
  }

  /**
   * 生成占位图像 - 当 API 不可用时的降级方案
   * 使用 SVG data URI 生成有意义的宠物占位图
   */
  generatePlaceholderImage(petData) {
    const { type = 'cat', name = '宠物', color = '花色', artStyle = '3d_cartoon' } = petData;
    
    const petEmojis = {
      dog: '🐶', cat: '🐱', rabbit: '🐰', hamster: '🐹',
      bird: '🐦', fish: '🐟', turtle: '🐢', snake: '🐍',
      lizard: '🦎', frog: '🐸', hedgehog: '🦔',
      guinea_pig: '🐹', chinchilla: '🐭', ferret: '🦨',
      parrot: '🦜', tropical_fish: '🐠', spider: '🕷️',
      crab: '🦀', scorpion: '🦂', axolotl: '🦎',
      penguin: '🐧', panda: '🐼', fox: '🦊'
    };

    const emoji = petEmojis[type] || '🐾';

    // 根据风格选择背景色
    const styleColors = {
      '3d_cartoon': ['#667eea', '#764ba2'],
      'anime_cel': ['#f093fb', '#f5576c'],
      'makoto_shinkai': ['#4facfe', '#00f2fe'],
      'flat_design': ['#43e97b', '#38f9d7'],
      'cyberpunk': ['#0c0c1d', '#1a0033'],
      'healing': ['#ffecd2', '#fcb69f'],
      'ghibli': ['#a8edea', '#fed6e3'],
      'american': ['#ff0844', '#ffb199'],
      'chinese': ['#e8d5b7', '#c9a96e'],
      'dark_fantasy': ['#1a1a2e', '#16213e']
    };

    const [grad1, grad2] = styleColors[artStyle] || styleColors['3d_cartoon'];

    // 生成 SVG 占位图
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${grad1}"/>
            <stop offset="100%" style="stop-color:${grad2}"/>
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="2" dy="4" stdDeviation="8" flood-opacity="0.3"/>
          </filter>
        </defs>
        <rect width="1024" height="1024" fill="url(#bg)" rx="32"/>
        <circle cx="512" cy="400" r="250" fill="rgba(255,255,255,0.15)" filter="url(#shadow)"/>
        <text x="512" y="440" text-anchor="middle" font-size="280" filter="url(#shadow)">${emoji}</text>
        <text x="512" y="700" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" opacity="0.95">${name}</text>
        <text x="512" y="760" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="white" opacity="0.8">🐾 虚拟宠物 · ${color} · ${artStyle}</text>
        <text x="512" y="820" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="white" opacity="0.5">PawPaw Train AI Generated</text>
      </svg>
    `.trim();

    const svgBase64 = Buffer.from(svgContent).toString('base64');
    const imageUrl = `data:image/svg+xml;base64,${svgBase64}`;

    return {
      imageUrl,
      generationId: `placeholder_${Date.now()}`,
      isPlaceholder: true
    };
  }

  /**
   * 检查 API 连接是否可用
   */
  async checkConnection() {
    if (!this.apiKey) {
      return { available: false, reason: 'API Key 未配置' };
    }

    try {
      // 尝试获取模型列表来验证连接
      const response = await axios.get(
        `${this.baseUrl}/models`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 10000
        }
      );
      return { available: true, models: response.data };
    } catch (error) {
      return {
        available: false,
        reason: `连接失败: ${error.response?.status} ${error.response?.data?.error?.message || error.message}`
      };
    }
  }
}

// 单例导出
const doubaoService = new DoubaoService();
export default doubaoService;
