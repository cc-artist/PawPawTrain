import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const MIN_PHOTOS = 1;
const MAX_PHOTOS = 5;
const PHOTO_SIZE = 1024;
const PhotoPreviewCard = ({ photo, index, onRemove }) => {
 const [isHovered, setIsHovered] = useState(false);
 return (<motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative aspect-square rounded-2xl overflow-hidden shadow-lg cursor-pointer" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
 <img src={photo.preview} alt={`宠物照片 ${index + 1}`} className="w-full h-full object-cover"/>
 <AnimatePresence>
 {isHovered && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
 <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onRemove(index)} className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center text-xl">
 ×
 </motion.button>
 </motion.div>)}
 </AnimatePresence>
 {photo.status === 'uploading' && (<div className="absolute inset-0 bg-black/50 flex items-center justify-center">
 <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full"/>
 </div>)}
 {photo.status === 'error' && (<div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
 <span className="text-white text-2xl">⚠️</span>
 </div>)}
 <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-xs font-bold text-gray-800">
 {index + 1}
 </div>
 </motion.div>);
};
const UploadZone = ({ onFilesAdded, disabled }) => {
 const inputRef = useRef(null);
 const [isDragging, setIsDragging] = useState(false);
 const handleDragOver = (e) => {
 e.preventDefault();
 setIsDragging(true);
 };
 const handleDragLeave = () => {
 setIsDragging(false);
 };
 const handleDrop = (e) => {
 e.preventDefault();
 setIsDragging(false);
 const files = Array.from(e.dataTransfer.files);
 handleFiles(files);
 };
 const handleFiles = (files) => {
 const validFiles = files.filter(file => {
 const isValidType = file.type.startsWith('image/');
 const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
 return isValidType && isValidSize;
 });
 onFilesAdded(validFiles);
 };
 const handleClick = () => {
 inputRef.current?.click();
 };
 const handleChange = (e) => {
 const files = Array.from(e.target.files || []);
 handleFiles(files);
 };
 return (<motion.div ref={inputRef} onClick={handleClick} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} whileHover={!disabled ? { scale: 1.02 } : {}} whileTap={!disabled ? { scale: 0.98 } : {}} className={`relative aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer ${isDragging
 ? 'border-purple-500 bg-purple-50'
 : disabled
 ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
 : 'border-gray-300 hover:border-purple-400 bg-white'}`}>
 <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleChange}/>
 <motion.div animate={isDragging ? { scale: 1.2 } : {}} className="text-5xl mb-3">
 📷
 </motion.div>
 <p className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
 点击或拖拽上传照片
 </p>
 <p className="text-xs text-gray-400 mt-1">
 支持 JPG、PNG 格式，建议尺寸 1024×1024
 </p>
 </motion.div>);
};
const MultiPhotoUploader = ({ photos, setPhotos, videos, setVideos, petName, setPetName, onSubmit, disabled }) => {
 const addPhotos = (newFiles) => {
 const newPhotos = newFiles.map(file => ({
 id: Date.now() + Math.random(),
 file,
 preview: URL.createObjectURL(file),
 status: 'pending'
 }));
 setPhotos(prev => [...prev, ...newPhotos].slice(0, MAX_PHOTOS));
 };

 const addVideos = (newFiles) => {
 const newVideos = newFiles.map(file => ({
 id: Date.now() + Math.random(),
 file,
 preview: URL.createObjectURL(file),
 status: 'pending'
 }));
 setVideos(prev => [...prev, ...newVideos].slice(0, 3));
 };

 const removePhoto = (index) => {
 setPhotos(prev => prev.filter((_, i) => i !== index));
 };

 const removeVideo = (index) => {
 setVideos(prev => prev.filter((_, i) => i !== index));
 };

 const canSubmit = photos.length >= MIN_PHOTOS && photos.length <= MAX_PHOTOS && petName.trim();

 const VideoPreviewCard = ({ video, index, onRemove }) => {
 const [isHovered, setIsHovered] = useState(false);
 return (
 <motion.div
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.9 }}
 className="relative aspect-video rounded-2xl overflow-hidden shadow-lg cursor-pointer"
 onMouseEnter={() => setIsHovered(true)}
 onMouseLeave={() => setIsHovered(false)}
 >
 <video src={video.preview} className="w-full h-full object-cover" muted />
 <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
 <span className="text-4xl">▶️</span>
 </div>
 <AnimatePresence>
 {isHovered && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"
 >
 <motion.button
 whileHover={{ scale: 1.1 }}
 whileTap={{ scale: 0.9 }}
 onClick={() => onRemove(index)}
 className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center text-xl"
 >
 ×
 </motion.button>
 </motion.div>
 )}
 </AnimatePresence>
 <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-xs font-bold text-gray-800">
 {index + 1}
 </div>
 </motion.div>
 );
 };

 const VideoUploadZone = ({ onFilesAdded, disabled }) => {
 const inputRef = useRef(null);
 const [isDragging, setIsDragging] = useState(false);

 const handleDragOver = (e) => {
 e.preventDefault();
 setIsDragging(true);
 };

 const handleDragLeave = () => {
 setIsDragging(false);
 };

 const handleDrop = (e) => {
 e.preventDefault();
 setIsDragging(false);
 const files = Array.from(e.dataTransfer.files);
 handleFiles(files);
 };

 const handleFiles = (files) => {
 const validFiles = files.filter(file => {
 const isValidType = file.type.startsWith('video/');
 const isValidSize = file.size <= 50 * 1024 * 1024;
 return isValidType && isValidSize;
 });
 onFilesAdded(validFiles);
 };

 const handleClick = () => {
 inputRef.current?.click();
 };

 const handleChange = (e) => {
 const files = Array.from(e.target.files || []);
 handleFiles(files);
 };

 return (
 <motion.div
 onClick={handleClick}
 onDragOver={handleDragOver}
 onDragLeave={handleDragLeave}
 onDrop={handleDrop}
 whileHover={!disabled ? { scale: 1.02 } : {}}
 whileTap={!disabled ? { scale: 0.98 } : {}}
 className={`relative aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer ${isDragging
 ? 'border-blue-500 bg-blue-50'
 : disabled
 ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
 : 'border-gray-300 hover:border-blue-400 bg-white'}`}
 >
 <input ref={inputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleChange}/>
 <motion.div animate={isDragging ? { scale: 1.2 } : {}} className="text-5xl mb-3">
 🎬
 </motion.div>
 <p className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
 点击或拖拽上传视频
 </p>
 <p className="text-xs text-gray-400 mt-1">
 支持 MP4、MOV 格式，最大50MB
 </p>
 </motion.div>
 );
 };

 return (<div className="space-y-6">
 <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-4 text-white">
 <div className="flex items-center gap-3">
 <span className="text-3xl">✨</span>
 <div>
 <h3 className="font-bold text-lg">i2L 技术驱动</h3>
 <p className="text-sm opacity-90">上传1-5张照片，秒级生成专属LoRA模型，无需传统训练流程</p>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-2xl p-6 shadow-sm">
 <div className="flex items-center gap-2 mb-4">
 <h3 className="text-lg font-bold text-gray-800">📷 上传宠物照片</h3>
 <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full text-xs font-medium">
 {MIN_PHOTOS}-{MAX_PHOTOS}张
 </span>
 </div>
 <p className="text-sm text-gray-500 mb-4">
 上传不同角度的宠物照片，系统将使用i2L技术直接生成LoRA权重，快速创建专属虚拟宠物形象
 </p>
 
 <div className="grid grid-cols-5 gap-3">
 {photos.map((photo, index) => (<PhotoPreviewCard key={photo.id} photo={photo} index={index} onRemove={removePhoto}/>))}
 {photos.length < MAX_PHOTOS && (<UploadZone onFilesAdded={addPhotos} disabled={disabled || photos.length >= MAX_PHOTOS}/>)}
 </div>
 
 <div className="mt-4 flex items-center justify-between text-sm">
 <div className={`flex items-center gap-2 ${photos.length >= MIN_PHOTOS ? 'text-green-600' : 'text-orange-500'}`}>
 <span>{photos.length}/{MAX_PHOTOS}</span>
 <span className="text-gray-400">|</span>
 <span>{photos.length >= MIN_PHOTOS ? '✓ 数量达标' : `还需 ${MIN_PHOTOS - photos.length} 张`}</span>
 </div>
 <div className="text-gray-400">
 建议不同角度、姿态、光照
 </div>
 </div>
 </div>

 <div className="bg-white rounded-2xl p-6 shadow-sm">
 <div className="flex items-center gap-2 mb-4">
 <h3 className="text-lg font-bold text-gray-800">🎬 上传训练视频（可选）</h3>
 <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
 增强动态
 </span>
 </div>
 <p className="text-sm text-gray-500 mb-4">
 上传宠物视频，后续将使用MotionBooth技术持续优化虚拟宠物的动作表现
 </p>
 
 <div className="grid grid-cols-3 gap-3">
 {videos.map((video, index) => (<VideoPreviewCard key={video.id} video={video} index={index} onRemove={removeVideo}/>))}
 {videos.length < 3 && (<VideoUploadZone onFilesAdded={addVideos} disabled={disabled || videos.length >= 3}/>)}
 </div>
 
 <div className="mt-4 text-sm text-gray-400">
 已上传 {videos.length}/3 个视频 · 用于后续动态优化训练
 </div>
 </div>

 <div className="bg-white rounded-2xl p-6 shadow-sm">
 <h3 className="text-lg font-bold text-gray-800 mb-4">🐾 宠物名称</h3>
 <input type="text" value={petName} onChange={(e) => setPetName(e.target.value)} placeholder="请为您的宠物取一个名字" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all" maxLength={20}/>
 <p className="text-xs text-gray-400 mt-2">
 此名称将作为您宠物的唯一标识符，用于训练和生成
 </p>
 </div>

 <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onSubmit} disabled={!canSubmit || disabled} className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${canSubmit && !disabled
 ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg hover:shadow-xl'
 : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
 ⚡ 生成专属虚拟宠物
 </motion.button>

 <div className="grid grid-cols-2 gap-4">
 <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4">
 <h4 className="font-medium text-gray-800 mb-2">🔮 i2L 技术</h4>
 <ul className="text-sm text-gray-600 space-y-1">
 <li>• 一次前向推理</li>
 <li>• 直接预测LoRA权重</li>
 <li>• 秒级响应速度</li>
 </ul>
 </div>
 <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4">
 <h4 className="font-medium text-gray-800 mb-2">🎬 MotionBooth</h4>
 <ul className="text-sm text-gray-600 space-y-1">
 <li>• 视频驱动优化</li>
 <li>• 动态动作捕捉</li>
 <li>• 持续模型升级</li>
 </ul>
 </div>
 </div>
 </div>);
};
export { MultiPhotoUploader, MIN_PHOTOS, MAX_PHOTOS, PHOTO_SIZE };
export default MultiPhotoUploader;