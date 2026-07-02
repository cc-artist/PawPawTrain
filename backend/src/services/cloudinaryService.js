/**
 * Cloudinary 媒体上传服务
 * 处理图片、视频上传到 Cloudinary 云存储
 * 返回永久 CDN URL 供前端使用
 */
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryService = {
  /**
   * 上传图片到 Cloudinary
   * @param {string} filePath - 本地文件路径
   * @param {string} userId - 用户ID（作为文件夹名）
   * @param {string} category - 分类 (pets/training/posts)
   * @returns {{ url: string, publicId: string }}
   */
  async uploadImage(filePath, userId, category = 'pets') {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `pawpawtrain/${category}/${userId}`,
        resource_type: 'image',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });
      console.log(`☁️ Cloudinary 图片上传成功: ${result.public_id}`);
      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      };
    } catch (error) {
      console.error('❌ Cloudinary 图片上传失败:', error.message);
      throw error;
    }
  },

  /**
   * 上传视频到 Cloudinary
   * @param {string} filePath - 本地文件路径
   * @param {string} userId - 用户ID
   * @param {string} category - 分类
   * @returns {{ url: string, publicId: string }}
   */
  async uploadVideo(filePath, userId, category = 'training') {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `pawpawtrain/${category}/${userId}`,
        resource_type: 'video',
        eager: [
          { streaming_profile: 'hd', format: 'mp4' },
        ],
        eager_async: true,
      });
      console.log(`☁️ Cloudinary 视频上传成功: ${result.public_id}`);
      return {
        url: result.secure_url,
        publicId: result.public_id,
        duration: result.duration,
        format: result.format,
        size: result.bytes,
      };
    } catch (error) {
      console.error('❌ Cloudinary 视频上传失败:', error.message);
      throw error;
    }
  },

  /**
   * 上传 SVG/Base64 Image URL 到 Cloudinary
   * （用于AI生成的宠物图片，从外部URL或data URI中转存）
   * @param {string} imageData - URL 或 data URI
   * @param {string} userId - 用户ID
   * @returns {{ url: string, publicId: string }}
   */
  async uploadFromUrl(imageData, userId) {
    try {
      const result = await cloudinary.uploader.upload(imageData, {
        folder: `pawpawtrain/pets/${userId}`,
        resource_type: 'image',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });
      console.log(`☁️ Cloudinary 从URL上传成功: ${result.public_id}`);
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error('❌ Cloudinary URL上传失败:', error.message);
      // 降级：返回原始URL
      return { url: imageData, publicId: null, fallback: true };
    }
  },

  /**
   * 删除 Cloudinary 资源
   * @param {string} publicId
   */
  async deleteResource(publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
      console.log(`🗑️ Cloudinary 资源删除: ${publicId}`);
    } catch (error) {
      console.error('❌ Cloudinary 资源删除失败:', error.message);
    }
  },

  /**
   * 批量上传多个文件
   * @param {Array<{path: string, type: 'image'|'video'}>} files
   * @param {string} userId
   * @param {string} category
   * @returns {Array<{url: string, publicId: string}>}
   */
  async uploadMultiple(files, userId, category) {
    const results = await Promise.allSettled(
      files.map(file => {
        if (file.type === 'video') {
          return this.uploadVideo(file.path, userId, category);
        }
        return this.uploadImage(file.path, userId, category);
      })
    );

    return results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      console.error(`文件 ${files[i].path} 上传失败`);
      return { url: null, publicId: null, error: true };
    });
  },
};

export default cloudinaryService;
