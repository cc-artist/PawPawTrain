import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPets, deletePet, updatePetStats } from '../../services/adminAPI';
import LoadingSpinner from './LoadingSpinner';

// 宠物属性进度条组件
function StatBar({ label, value, max, color }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="text-gray-500 w-12 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-gray-400 w-7 text-right">{value}</span>
    </div>
  );
}

export default function PetsPanel() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [pagination, setPagination] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const limit = 12;

  useEffect(() => { loadPets(); }, [page, type]);

  const loadPets = async () => {
    setLoading(true);
    try { const res = await getPets({ page, limit, search, type }); if (res.success) { setPets(res.pets); setPagination(res.pagination); } }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async (petId, name) => {
    if (!confirm(`Delete pet "${name}"? This cannot be undone.`)) return;
    try { await deletePet(petId); loadPets(); } catch (err) { alert('Delete failed'); }
  };

  const handleStatEdit = async (petId, field, currentVal) => {
    const val = prompt(`New value for ${field}:`, currentVal);
    if (val === null) return;
    try { await updatePetStats(petId, { [field]: Number(val) }); loadPets(); } catch (err) { alert('Update failed'); }
  };

  const toggleExpand = (petId) => {
    setExpandedId(expandedId === petId ? null : petId);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">🐾 Pet Management</h2>
          <p className="text-gray-400 text-sm">{pagination?.total || 0} total pets · showing owner details & training stats</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <input type="text" placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && loadPets()}
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500" />
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }} className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm">
          <option value="">All Types</option><option value="dog">Dog</option><option value="cat">Cat</option><option value="rabbit">Rabbit</option>
        </select>
        <button onClick={loadPets} className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-500">Search</button>
      </div>

      {loading && <div className="flex justify-center py-12"><LoadingSpinner /></div>}
      {!loading && pets.length === 0 && <div className="text-center py-12 text-gray-500">No pets found</div>}
      {!loading && pets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pets.map(pet => (
            <motion.div
              key={pet.id}
              layout
              className={`bg-gray-800 rounded-xl border ${expandedId === pet.id ? 'border-cyan-500/50' : 'border-gray-700'} overflow-hidden hover:border-gray-600 transition-colors cursor-pointer`}
              onClick={() => toggleExpand(pet.id)}
            >
              {/* 宠物卡片头部：形象 + 基础信息 */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* 宠物形象 */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gray-700 border border-gray-600">
                    {pet.imageUrl ? (
                      <img src={pet.imageUrl} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        {pet.emoji || '🐾'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white truncate">{pet.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${pet.loraStatus === 'trained' ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                        {pet.loraStatus || 'pending'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400 capitalize">{pet.type}</span>
                      <span className="text-xs text-gray-600">·</span>
                      <span className="text-xs text-cyan-400 font-bold cursor-pointer hover:underline"
                        onClick={e => { e.stopPropagation(); handleStatEdit(pet.id, 'level', pet.level); }}>
                        Lv.{pet.level || 1}
                      </span>
                      {pet.artStyle && (
                        <>
                          <span className="text-xs text-gray-600">·</span>
                          <span className="text-xs text-purple-400">{pet.artStyle}</span>
                        </>
                      )}
                    </div>

                    {/* 主人信息 */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-cyan-900/50 flex items-center justify-center text-xs text-cyan-400">
                        👤
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-gray-300 truncate block">
                          {pet.owner?.username || pet.ownerName || 'Unknown'}
                        </span>
                        {pet.owner?.email && (
                          <span className="text-xs text-gray-600 block truncate">{pet.owner.email}</span>
                        )}
                      </div>
                      {pet.owner?.isBanned && (
                        <span className="px-1.5 py-0.5 bg-red-900/50 text-red-400 rounded text-xs">Banned</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 展开详情 */}
              <AnimatePresence>
                {expandedId === pet.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-gray-700/50">
                      {/* 属性状态条 */}
                      <div className="mt-3 space-y-1.5">
                        <StatBar label="Health" value={pet.health || 100} max={100} color="bg-green-500" />
                        <StatBar label="Hunger" value={pet.hunger || 100} max={100} color="bg-orange-500" />
                        <StatBar label="Energy" value={pet.energy || 100} max={100} color="bg-yellow-500" />
                        <StatBar label="Joy" value={pet.joy || 100} max={100} color="bg-pink-500" />
                        <StatBar label="Affection" value={pet.affection || 0} max={100} color="bg-red-500" />
                      </div>

                      {/* 训练数据统计 */}
                      {pet.trainingStats && (
                        <div className="mt-3 pt-3 border-t border-gray-700/50">
                          <h4 className="text-xs font-semibold text-gray-400 mb-2">📊 Training Statistics</h4>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                              <div className="text-lg font-bold text-cyan-400">{pet.trainingStats.taskCount || 0}</div>
                              <div className="text-xs text-gray-500">Tasks</div>
                            </div>
                            <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                              <div className="text-lg font-bold text-green-400">{pet.trainingStats.completionCount || 0}</div>
                              <div className="text-xs text-gray-500">Completed</div>
                            </div>
                            <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                              <div className="text-lg font-bold text-purple-400">{pet.trainingStats.postCount || 0}</div>
                              <div className="text-xs text-gray-500">Posts</div>
                            </div>
                          </div>
                          {/* 任务状态分布 */}
                          {pet.trainingStats.taskStatusCounts && pet.trainingStats.taskCount > 0 && (
                            <div className="mt-2 flex gap-1.5 text-xs">
                              {pet.trainingStats.taskStatusCounts.pending > 0 && (
                                <span className="px-2 py-0.5 bg-yellow-900/30 text-yellow-400 rounded">
                                  {pet.trainingStats.taskStatusCounts.pending} pending
                                </span>
                              )}
                              {pet.trainingStats.taskStatusCounts.training > 0 && (
                                <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded">
                                  {pet.trainingStats.taskStatusCounts.training} training
                                </span>
                              )}
                              {pet.trainingStats.taskStatusCounts.completed > 0 && (
                                <span className="px-2 py-0.5 bg-green-900/30 text-green-400 rounded">
                                  {pet.trainingStats.taskStatusCounts.completed} done
                                </span>
                              )}
                              {pet.trainingStats.taskStatusCounts.failed > 0 && (
                                <span className="px-2 py-0.5 bg-red-900/30 text-red-400 rounded">
                                  {pet.trainingStats.taskStatusCounts.failed} failed
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 额外信息 */}
                      <div className="mt-3 pt-3 border-t border-gray-700/50 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <span className="text-gray-500">Created</span>
                        <span className="text-gray-400">{pet.createdAt ? new Date(pet.createdAt).toLocaleDateString() : '-'}</span>
                        <span className="text-gray-500">Photos</span>
                        <span className="text-gray-400">{pet.photoCount || 0}</span>
                        <span className="text-gray-500">Points</span>
                        <span className="text-gray-400">{pet.points || 0}</span>
                        <span className="text-gray-500">Skills</span>
                        <span className="text-gray-400">{(pet.learnedSkills || []).length}</span>
                      </div>

                      {/* 操作按钮 */}
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={e => { e.stopPropagation(); handleStatEdit(pet.id, 'health', pet.health); }}
                          className="flex-1 px-2 py-1.5 bg-gray-700 text-gray-300 rounded text-xs hover:bg-gray-600 transition-colors"
                        >
                          ✏️ Edit Stats
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(pet.id, pet.name); }}
                          className="px-3 py-1.5 bg-red-700/30 text-red-400 rounded text-xs hover:bg-red-700/50 transition-colors"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded text-sm ${p === page ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
