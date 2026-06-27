import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { t } from '../utils/i18n';
import api from '../services/api';
const MAX_PHOTOS = 9;
const MAX_VIDEO_DURATION = 60;
const DailyUploadPage = () => {
 const navigate = useNavigate();
 const { pet, setPet, isLoggedIn } = useStore();
 const [photos, setPhotos] = useState([]);
 const [video, setVideo] = useState(null);
 const [description, setDescription] = useState('');
 const [selectedTags, setSelectedTags] = useState([]);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [showSuccess, setShowSuccess] = useState(false);
 const fileInputRef = useRef(null);
 const quickTags = [
 { id: 'happy', label: '😊 开心', color: 'bg-yellow-500' },
 { id: 'active', label: '⚡ 活泼', color: 'bg-green-500' },
 { id: 'quiet', label: '😌 安静', color: 'bg-blue-500' },
 { id: 'greedy', label: '🍖 贪吃', color: 'bg-orange-500' },
 { id: 'cute', label: '🥰 撒娇', color: 'bg-pink-500' },
 { id: 'naughty', label: '😜 调皮', color: 'bg-purple-500' },
 { id: 'good', label: '乖', color: 'bg-teal-500' },
 { id: 'sleepy', label: '😴 困倦', color: 'bg-indigo-500' },
 ];
 const addPhotos = useCallback((newFiles) => {
 const newPhotos = newFiles.map(file => ({
 id: Date.now() + Math.random(),
 file,
 preview: URL.createObjectURL(file),
 }));
 setPhotos(prev => [...prev, ...newPhotos].slice(0, MAX_PHOTOS));
 }, []);
 const removePhoto = useCallback((index, previewUrl) => {
 if (previewUrl) {
 URL.revokeObjectURL(previewUrl);
 }
 setPhotos(prev => prev.filter((_, i) => i !== index));
 }, []);
 const handleVideoUpload = useCallback((e) => {
 const file = e.target.files?.[0];
 if (file) {
 const videoUrl = URL.createObjectURL(file);
 const videoElement = document.createElement('video');
 videoElement.src = videoUrl;
 videoElement.onloadedmetadata = () => {
 if (videoElement.duration > MAX_VIDEO_DURATION) {
 URL.revokeObjectURL(videoUrl);
 alert(`视频时长不能超过 ${MAX_VIDEO_DURATION} 秒`);
 }
 else {
 if (video) {
 URL.revokeObjectURL(video.preview);
 }
 setVideo({
 id: Date.now(),
 file,
 preview: videoUrl,
 duration: Math.floor(videoElement.duration),
 });
 }
 videoElement.remove();
 };
 }
 }, [video]);
 const removeVideo = useCallback(() => {
 if (video?.preview) {
 URL.revokeObjectURL(video.preview);
 }
 setVideo(null);
 }, [video]);
 const toggleTag = useCallback((tagId) => {
 setSelectedTags(prev => prev.includes(tagId)
 ? prev.filter(id => id !== tagId)
 : [...prev, tagId]);
 }, []);
 const handleSubmit = useCallback(async () => {
 if (!description.trim() && photos.length === 0 && !video) {
 alert('请至少添加照片、视频或文字描述');
 return;
 }
 setIsSubmitting(true);
 try {
 const formData = new FormData();
 formData.append('content', description);
 formData.append('tags', JSON.stringify(selectedTags));
 formData.append('petId', pet?.id || '');
 formData.append('petName', pet?.name || '我的宠物');
 photos.forEach((photo, index) => {
 formData.append('photos', photo.file, `photo_${index}.jpg`);
 });
 if (video) {
 formData.append('video', video.file, `video.mp4`);
 }
 const response = await api.post('/posts/create', formData, {
 headers: { 'Content-Type': 'multipart/form-data' },
 });
 if (response.data.success) {
 setShowSuccess(true);
 setTimeout(() => {
 navigate('/feed');
 }, 2000);
 }
 else {
 throw new Error(response.data.error || '发布失败');
 }
 }
 catch (error) {
 console.error('发布失败:', error);
 alert(error.response?.data?.error || error.message || '发布失败');
 }
 finally {
 setIsSubmitting(false);
 }
 }, [description, selectedTags, photos, video, pet, navigate]);
 const handleFileChange = useCallback((e) => {
 const files = Array.from(e.target.files || []);
 const images = files.filter(f => f.type.startsWith('image/'));
 const videos = files.filter(f => f.type.startsWith('video/'));
 if (images.length > 0) {
 addPhotos(images);
 }
 if (videos.length > 0) {
 const videoFile = videos[0];
 const videoUrl = URL.createObjectURL(videoFile);
 const videoElement = document.createElement('video');
 videoElement.src = videoUrl;
 videoElement.onloadedmetadata = () => {
 if (videoElement.duration > MAX_VIDEO_DURATION) {
 URL.revokeObjectURL(videoUrl);
 alert(`视频时长不能超过 ${MAX_VIDEO_DURATION} 秒`);
 }
 else {
 if (video) {
 URL.revokeObjectURL(video.preview);
 }
 setVideo({
 id: Date.now(),
 file: videoFile,
 preview: videoUrl,
 duration: Math.floor(videoElement.duration),
 });
 }
 videoElement.remove();
 };
 }
 }, [addPhotos, video]);
 const canSubmit = (description.trim().length > 0 || photos.length > 0 || video);
 if (!isLoggedIn) {
 navigate('/login');
 return null;
 }
 if (showSuccess) {
 return (<div className="min-h-full gradient-bg flex flex-col items-center justify-center p-4">
 <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="text-8xl mb-4">
 🎉
 </motion.div>
 <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-white mb-2">
 发布成功！
 </motion.h2>
 <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-white/70">
 正在跳转到动态页面...
 </motion.p>
 </div>);
 }
 return (<div className="min-h-full gradient-bg pb-28">
 <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="sticky top-0 z-40 glass-effect border-b border-cyber-blue/30 px-4 py-3">
 <div className="flex items-center gap-4">
 <button onClick={() => navigate(-1)} className="text-white/80 hover:text-white transition-colors">
 <span className="text-xl">←</span>
 </button>
 <h1 className="text-xl font-bold text-white">🐾 {t('upload.publishPet')}</h1>
 </div>
 </motion.div>

 <div className="p-4 space-y-4">
 {pet && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl p-4 border border-cyan-500/30">
 <div className="flex items-center gap-3">
 <span className="text-3xl">{pet.emoji}</span>
 <div>
 <div className="text-white font-medium">{pet.name}</div>
 <div className="text-white/60 text-sm">Lv.{pet.level} · {pet.experience}成长值</div>
 </div>
 </div>
 </motion.div>)}

 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
 <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('post.placeholder')} className="w-full bg-transparent text-white placeholder-gray-400 resize-none outline-none min-h-[100px]" autoComplete="off" spellCheck="false"/>
 </motion.div>

 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
 <div className="flex items-center gap-2 mb-3">
 <span className="text-gray-300 text-sm">{t('post.quickTags')}</span>
 </div>
 <div className="flex flex-wrap gap-2">
 {quickTags.map((tag) => (<button key={tag.id} onClick={() => toggleTag(tag.id)} className={`px-3 py-1.5 rounded-full text-sm transition-all ${selectedTags.includes(tag.id)
 ? `${tag.color} text-white`
 : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>
 {tag.label}
 </button>))}
 </div>
 </motion.div>

 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
 <div className="flex items-center gap-2 mb-3">
 <span className="text-gray-300 text-sm">📷 {t('upload.uploadMedia')}</span>
 {photos.length > 0 && (<span className="text-xs text-white/60">{photos.length}/{MAX_PHOTOS}</span>)}
 </div>
 
 <div className="grid grid-cols-3 gap-2">
 {photos.map((photo, index) => (<motion.div key={photo.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative aspect-square rounded-xl overflow-hidden">
 <img src={photo.preview} alt={`照片 ${index + 1}`} className="w-full h-full object-cover"/>
 <button onClick={() => removePhoto(index, photo.preview)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/90 text-white flex items-center justify-center text-sm">
 ×
 </button>
 </motion.div>))}
 
 {photos.length < MAX_PHOTOS && !video && (<label className="aspect-square rounded-xl border-2 border-dashed border-white/30 flex flex-col items-center justify-center cursor-pointer hover:border-white/50 hover:bg-white/5 transition-all">
 <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleFileChange} className="hidden"/>
 <span className="text-3xl text-white/50">+</span>
 </label>)}
 </div>
 
 {video && (<motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative rounded-xl overflow-hidden">
 <video src={video.preview} className="w-full aspect-video" controls/>
 <button onClick={removeVideo} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/90 text-white flex items-center justify-center">
 ×
 </button>
 <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 rounded text-white text-xs">
 {video.duration}秒
 </div>
 </motion.div>)}
 
 {photos.length === 0 && !video && (<div className="text-center text-gray-500 text-sm py-4">
 点击上方+号上传照片或视频
 </div>)}
 </motion.div>

 {selectedTags.length > 0 && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2">
 {selectedTags.map(tagId => {
 const tag = quickTags.find(t => t.id === tagId);
 return tag ? (<span key={tag.id} className={`px-3 py-1 rounded-full text-sm ${tag.color} text-white`}>
 {tag.label}
 </span>) : null;
 })}
 </motion.div>)}
 </div>

 <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={!canSubmit || isSubmitting} className={`fixed bottom-[80px] left-4 right-4 py-4 rounded-2xl font-bold text-lg transition-all ${canSubmit && !isSubmitting
 ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-500/30'
 : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}>
 {isSubmitting ? (<span className="flex items-center justify-center gap-2">
 <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
 ⏳
 </motion.div>
 {t('upload.posting')}
 </span>) : ('📤 ' + t('upload.publish'))}
 </motion.button>
 </div>);
};
export default DailyUploadPage;