import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.env') });

/**
 * 多模型图像生成服务
 * 支持: 豆包 Seedream 5.0 (ARK), Stability AI, 本地SVG生成(降级)
 */
class ImageService {
  constructor() {
    // 豆包/火山方舟 ARK API
    this.arkApiKey = process.env.ARK_API_KEY || process.env.DOUBAO_API_KEY;
    this.arkBaseUrl = process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
    
    // Stability AI
    this.stabilityApiKey = process.env.STABILITY_API_KEY;
    
    // 模型优先级
    this.modelPriority = [
      { name: 'doubao', endpoint: 'ark', models: [
        'doubao-seedream-5.0-250630',
        'doubao-seedream-4.0-250628',
        'doubao-seedream-4.5'
      ]},
      { name: 'stability', endpoint: 'stability', models: [
        'stable-diffusion-xl-1024-v1-0',
        'sd3.5-large'
      ]}
    ];
  }

  /**
   * 构建高质量宠物图像 prompt
   */
  buildPrompt(petData) {
    const { type = 'cat', name = '宠物', color = '花色', artStyle = '3d_cartoon' } = petData;

    const petNames = {
      dog: 'dog', cat: 'cat', rabbit: 'rabbit', hamster: 'hamster',
      bird: 'bird', fish: 'fish', turtle: 'turtle', snake: 'snake',
      lizard: 'lizard', frog: 'frog', hedgehog: 'hedgehog',
      guinea_pig: 'guinea pig', chinchilla: 'chinchilla', ferret: 'ferret',
      parrot: 'parrot', tropical_fish: 'tropical fish', penguin: 'penguin',
      panda: 'panda', fox: 'fox', axolotl: 'axolotl'
    };

    const petType = petNames[type] || type;
    const petColor = color === '花色' ? 'multicolored with beautiful patterns' : color;

    const stylePrompts = {
      '3d_cartoon': '3D cartoon render, Pixar-Disney style, cute large expressive eyes, soft ambient lighting, smooth textures, adorable chibi proportions, rendered with Blender quality, highly detailed soft fur, centered portrait on clean gradient background',
      'anime_cel': 'anime cel-shaded illustration, vibrant flat colors, clean linework, Japanese animation aesthetic',
      'makoto_shinkai': 'Makoto Shinkai style, photorealistic lighting with lens flares, soft focus dreamy atmosphere, beautiful sky background with clouds',
      'flat_design': 'flat vector illustration, clean minimalist design, geometric shapes, modern pastel color palette',
      'cyberpunk': 'cyberpunk aesthetic, neon lights reflecting, dark futuristic atmosphere, glowing accents',
      'healing': 'soft healing illustration, warm pastel watercolor texture, cozy atmosphere, gentle flowers, warm sunlight',
      'ghibli': 'Studio Ghibli style animation, hand-painted watercolor, warm nostalgic countryside, magical atmosphere',
      'american': 'American cartoon style, bold expressive features, thick outlines, comic book energy',
      'chinese': 'traditional Chinese ink painting style, elegant flowing brushstrokes, classical ink wash aesthetic',
      'dark_fantasy': 'dark fantasy art, mystical atmosphere, dramatic chiaroscuro lighting, gothic aesthetic'
    };

    const style = stylePrompts[artStyle] || stylePrompts['3d_cartoon'];

    let basePrompt = `A cute adorable ${petColor} ${petType} pet named ${name}, ${style}`;
    basePrompt += ', pet portrait, centered composition, high quality, 4K, ultra detailed, professional digital art, masterpiece';

    return basePrompt;
  }

  /**
   * 调用豆包 ARK API 生成图像
   */
  async callArkAPI(prompt, model) {
    if (!this.arkApiKey) {
      throw new Error('ARK API Key 未配置');
    }

    console.log(`🎨 调用 ARK API, Model: ${model}`);
    
    const response = await axios.post(
      `${this.arkBaseUrl}/images/generations`,
      {
        model: model,
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'url',
        quality: 'standard'
      },
      {
        headers: {
          'Authorization': `Bearer ${this.arkApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 45000
      }
    );

    if (response.data?.data?.length > 0 && response.data.data[0].url) {
      return {
        imageUrl: response.data.data[0].url,
        provider: 'doubao',
        model: model
      };
    }

    throw new Error('ARK API 返回数据格式异常');
  }

  /**
   * 调用 Stability AI API 生成图像
   */
  async callStabilityAPI(prompt) {
    if (!this.stabilityApiKey) {
      throw new Error('Stability API Key 未配置');
    }

    console.log('🎨 调用 Stability AI API...');

    const response = await axios.post(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
      {
        text_prompts: [{ text: prompt, weight: 1 }],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: 1,
        steps: 30,
        style_preset: 'fantasy-art'
      },
      {
        headers: {
          'Authorization': `Bearer ${this.stabilityApiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 60000
      }
    );

    if (response.data?.artifacts?.length > 0) {
      const base64 = response.data.artifacts[0].base64;
      return {
        imageUrl: `data:image/png;base64,${base64}`,
        provider: 'stability',
        model: 'SDXL-1.0'
      };
    }

    throw new Error('Stability API 返回数据为空');
  }

  /**
   * 主入口：生成宠物图像（按优先级尝试多个API）
   */
  async generateImage(petData) {
    const prompt = this.buildPrompt(petData);
    console.log(`🎨 生成 Prompt: "${prompt.substring(0, 100)}..."`);

    const errors = [];

    // 依次尝试各模型
    for (const provider of this.modelPriority) {
      if (provider.endpoint === 'ark') {
        for (const model of provider.models) {
          try {
            const result = await this.callArkAPI(prompt, model);
            console.log(`✅ ARK API 成功: ${model}`);
            return { ...result, generationId: `ark_${Date.now()}` };
          } catch (err) {
            const msg = `ARK(${model}): ${err.message}`;
            console.warn(`⚠️ ${msg}`);
            errors.push(msg);
          }
        }
      }

      if (provider.endpoint === 'stability') {
        try {
          const result = await this.callStabilityAPI(prompt);
          console.log('✅ Stability API 成功');
          return { ...result, generationId: `stab_${Date.now()}` };
        } catch (err) {
          const msg = `Stability: ${err.message}`;
          console.warn(`⚠️ ${msg}`);
          errors.push(msg);
        }
      }
    }

    // 所有 API 都失败，降级到本地生成
    console.warn('⚠️ 所有外部图像API均不可用，使用增强SVG占位图');
    console.warn('错误详情:', errors.join('; '));

    return {
      ...this.generateEnhancedSVG(petData),
      isPlaceholder: true,
      fallbackReason: errors.slice(0, 3).join('; ')
    };
  }

  /**
   * 生成增强版 SVG 占位图
   * 当所有外部 API 都不可用时的本地降级方案
   */
  generateEnhancedSVG(petData) {
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
    const colors = this.getStyleColors(artStyle);
    const [grad1, grad2] = colors.gradient;

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${grad1}"/>
      <stop offset="100%" style="stop-color:${grad2}"/>
    </linearGradient>
    <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.25)"/>
      <stop offset="100%" style="stop-color:rgba(255,255,255,0.08)"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="16" flood-color="rgba(0,0,0,0.25)"/>
    </filter>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.08)"/>
    </pattern>
  </defs>

  <!-- 背景 -->
  <rect width="1024" height="1024" fill="url(#bg)" rx="0"/>
  <rect width="1024" height="1024" fill="url(#dots)" rx="0"/>

  <!-- 装饰波纹 -->
  <ellipse cx="512" cy="400" rx="280" ry="280" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="3"/>
  <ellipse cx="512" cy="400" rx="320" ry="320" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="2"/>
  <ellipse cx="250" cy="800" rx="150" ry="150" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="2"/>
  <ellipse cx="800" cy="200" rx="120" ry="120" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="2"/>

  <!-- 十字星光 -->
  <g transform="translate(250, 250)" opacity="0.15">
    <line x1="-20" y1="0" x2="20" y2="0" stroke="white" stroke-width="2"/>
    <line x1="0" y1="-20" x2="0" y2="20" stroke="white" stroke-width="2"/>
  </g>
  <g transform="translate(780, 700)" opacity="0.12">
    <line x1="-15" y1="0" x2="15" y2="0" stroke="white" stroke-width="2"/>
    <line x1="0" y1="-15" x2="0" y2="15" stroke="white" stroke-width="2"/>
  </g>

  <!-- 主体圆形背景 -->
  <circle cx="512" cy="380" r="230" fill="url(#circleGrad)" filter="url(#shadow)"/>

  <!-- 主 Emoji -->
  <text x="512" y="430" text-anchor="middle" font-size="240" filter="url(#glow)">${emoji}</text>

  <!-- 宠物名称 -->
  <text x="512" y="680" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="52" font-weight="800" fill="white" opacity="0.95" filter="url(#shadow)">${name}</text>

  <!-- 标签信息 -->
  <rect x="350" y="720" rx="20" ry="20" width="324" height="50" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
  <text x="512" y="753" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.85)">🐾 虚拟宠物 · ${color} · ${this.getStyleName(artStyle)}</text>

  <!-- 底部水印 -->
  <text x="512" y="860" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="20" fill="rgba(255,255,255,0.3)">PawPaw Train · AI Generated</text>

  <!-- 小爪印装饰 -->
  <text x="180" y="450" font-size="30" opacity="0.15">🐾</text>
  <text x="800" y="300" font-size="25" opacity="0.12">🐾</text>
  <text x="350" y="550" font-size="20" opacity="0.10">🐾</text>
  <text x="700" y="550" font-size="22" opacity="0.10">🐾</text>
</svg>`.trim();

    return {
      imageUrl: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
      generationId: `svg_${Date.now()}`
    };
  }

  /**
   * 获取风格对应的渐变色
   */
  getStyleColors(style) {
    const palettes = {
      '3d_cartoon': { gradient: ['#667eea', '#764ba2'] },
      'anime_cel': { gradient: ['#f093fb', '#f5576c'] },
      'makoto_shinkai': { gradient: ['#4facfe', '#00f2fe'] },
      'flat_design': { gradient: ['#43e97b', '#38f9d7'] },
      'cyberpunk': { gradient: ['#1a1a2e', '#16213e'] },
      'healing': { gradient: ['#ffecd2', '#fcb69f'] },
      'ghibli': { gradient: ['#a8edea', '#fed6e3'] },
      'american': { gradient: ['#ff0844', '#ffb199'] },
      'chinese': { gradient: ['#d4c4a8', '#8b7355'] },
      'dark_fantasy': { gradient: ['#1a1a2e', '#0f3460'] }
    };
    return palettes[style] || palettes['3d_cartoon'];
  }

  getStyleName(style) {
    const names = {
      '3d_cartoon': '3D卡通', 'anime_cel': '日系赛璐璐', 'makoto_shinkai': '新海诚',
      'flat_design': '扁平设计', 'cyberpunk': '赛博朋克', 'healing': '治愈系',
      'ghibli': '吉卜力', 'american': '美式', 'chinese': '国风', 'dark_fantasy': '暗黑奇幻'
    };
    return names[style] || '3D卡通';
  }
}

const imageService = new ImageService();
export default imageService;
