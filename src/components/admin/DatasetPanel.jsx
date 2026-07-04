import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';
import {
  getDatasetOverview, getDatasetPets, getDatasetTraining,
  getDatasetTags, getDatasetTypes, exportDataset,
} from '../../services/adminAPI';

// ==================== 子组件 ====================

function StatCard({ title, value, subtitle, color, icon }) {
  return (
    <div className={`bg-gray-800 rounded-xl p-5 border ${color} transition-all hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-xs font-medium">{title}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}

function ProgressBar({ label, value, max, color, suffix = '' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-400 w-28 truncate">{label}</span>
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-gray-300 w-16 text-right">{value}{suffix}</span>
    </div>
  );
}

function TagBadge({ label, count, color = 'cyan' }) {
  const colorMap = {
    cyan: 'bg-cyan-900/30 text-cyan-300 border-cyan-700/30',
    purple: 'bg-purple-900/30 text-purple-300 border-purple-700/30',
    green: 'bg-green-900/30 text-green-300 border-green-700/30',
    yellow: 'bg-yellow-900/30 text-yellow-300 border-yellow-700/30',
    pink: 'bg-pink-900/30 text-pink-300 border-pink-700/30',
    orange: 'bg-orange-900/30 text-orange-300 border-orange-700/30',
    blue: 'bg-blue-900/30 text-blue-300 border-blue-700/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs ${colorMap[color] || colorMap.cyan}`}>
      {label}
      {count !== undefined && <span className="opacity-60">({count})</span>}
    </span>
  );
}

// ==================== 概览面板 ====================
function OverviewTab({ overview, loading }) {
  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (!overview) return <div className="text-center py-12 text-gray-500">No data available</div>;

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Pet Entries" value={overview.totalPets} subtitle={`${overview.petsWithImages} with AI images`} color="border-cyan-500/30" icon="🐾" />
        <StatCard title="Training Sessions" value={overview.totalTrainingTasks} subtitle={`${overview.totalVideosUploaded} videos uploaded`} color="border-purple-500/30" icon="🏋️" />
        <StatCard title="Dataset Users" value={overview.activeDatasetUsers} subtitle={`of ${overview.totalUsers} total users`} color="border-green-500/30" icon="👥" />
        <StatCard title="Completion Rate" value={`${overview.completedTrainingRate}%`} subtitle={`${overview.trainingStatusDistribution?.completed || 0} completed`} color="border-yellow-500/30" icon="✅" />
      </div>

      {/* 数据质量 */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Data Quality Indicators</h3>
        <div className="space-y-3">
          <ProgressBar label="AI Image Coverage" value={overview.dataQuality?.imageRate || 0} max={100} color="bg-gradient-to-r from-cyan-500 to-blue-500" suffix="%" />
          <ProgressBar label="Training Coverage" value={overview.dataQuality?.trainingRate || 0} max={100} color="bg-gradient-to-r from-purple-500 to-pink-500" suffix="%" />
          <ProgressBar label="Task Completion" value={overview.dataQuality?.completionRate || 0} max={100} color="bg-gradient-to-r from-green-500 to-emerald-500" suffix="%" />
        </div>
      </div>

      {/* 类型分布 & 标签分布 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">Pet Type Distribution</h3>
          <div className="space-y-2">
            {Object.entries(overview.typeDistribution || {}).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
              <ProgressBar key={type} label={type} value={count} max={overview.totalPets} color="bg-cyan-500" />
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">Art Style Distribution</h3>
          <div className="space-y-2">
            {Object.entries(overview.artStyleDistribution || {}).sort((a, b) => b[1] - a[1]).map(([style, count]) => (
              <ProgressBar key={style} label={style} value={count} max={overview.totalPets} color="bg-purple-500" />
            ))}
          </div>
        </div>
      </div>

      {/* 热门标签 */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Top Behavior Tags</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(overview.topTags || {}).slice(0, 30).map(([tag, count], i) => (
            <TagBadge key={tag} label={tag} count={count} color={['cyan', 'purple', 'green', 'yellow', 'pink', 'orange'][i % 6]} />
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-600 text-right">
        Last updated: {overview.lastUpdated ? new Date(overview.lastUpdated).toLocaleString() : 'N/A'} · Generated: {new Date(overview.timestamp).toLocaleString()}
      </div>
    </div>
  );
}

// ==================== 宠物数据面板 ====================
function PetsTab({ types }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('training');
  const [pagination, setPagination] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const limit = 12;

  useEffect(() => { loadData(); }, [page, type, sortBy]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getDatasetPets({ page, limit, type, search, sortBy });
      if (res.success) { setData(res.dataset); setPagination(res.pagination); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <input type="text" placeholder="Search by name, color, style..." value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (setPage(1), loadData())}
          className="flex-1 min-w-[200px] px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500" />
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm">
          <option value="">All Types</option>
          {(types?.petTypes || []).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm">
          <option value="training">Most Training</option>
          <option value="recent">Most Recent</option>
          <option value="level">Highest Level</option>
          <option value="actions">Most Actions</option>
        </select>
        <button onClick={() => { setPage(1); loadData(); }}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-500">Search</button>
      </div>

      {loading && <div className="flex justify-center py-12"><LoadingSpinner /></div>}
      {!loading && data.length === 0 && <div className="text-center py-12 text-gray-500">No pet data found</div>}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {data.map(entry => (
            <motion.div key={entry.petId} layout
              className={`bg-gray-800 rounded-xl border ${expandedId === entry.petId ? 'border-cyan-500/50' : 'border-gray-700'} overflow-hidden cursor-pointer`}
              onClick={() => setExpandedId(expandedId === entry.petId ? null : entry.petId)}>
              {/* 头部 */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gray-700 border border-gray-600 flex items-center justify-center text-3xl">
                    {entry.appearance?.imageUrl
                      ? <img src={entry.appearance.imageUrl} alt={entry.petName} className="w-full h-full object-cover" />
                      : (entry.petEmoji || '🐾')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white truncate">{entry.petName}</span>
                      <span className="text-xs text-gray-500">Lv.{entry.petLevel}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <TagBadge label={entry.petType} color="cyan" />
                      {entry.appearance?.color && <TagBadge label={entry.appearance.color} color="purple" />}
                      {entry.appearance?.artStyle && <TagBadge label={entry.appearance.artStyle} color="green" />}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="text-gray-500">Training: <b className="text-cyan-400">{entry.training?.totalTasks || 0}</b></span>
                      <span className="text-gray-500">Actions: <b className="text-purple-400">{entry.habits?.detectedActions?.length || 0}</b></span>
                      <span className="text-gray-500">Tags: <b className="text-green-400">{entry.habits?.tags?.length || 0}</b></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 展开详情 */}
              <AnimatePresence>
                {expandedId === entry.petId && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="px-4 pb-4 border-t border-gray-700/50 space-y-4">
                      {/* 状态 */}
                      <div className="mt-3">
                        <h4 className="text-xs font-semibold text-gray-400 mb-2">📊 Pet Stats</h4>
                        <div className="grid grid-cols-4 gap-2">
                          {Object.entries(entry.stats || {}).map(([k, v]) => (
                            <div key={k} className="bg-gray-700/50 rounded-lg p-2 text-center">
                              <div className="text-sm font-bold text-white">{v}</div>
                              <div className="text-xs text-gray-500 capitalize">{k}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 检测到的行为 */}
                      {entry.habits?.detectedActions?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-400 mb-2">🎬 Detected Actions</h4>
                          <div className="flex flex-wrap gap-2">
                            {entry.habits.detectedActions.map((a, i) => (
                              <TagBadge key={i} label={`${a.icon || ''} ${a.name}`} color="purple" />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 习惯标签 */}
                      {entry.habits?.tags?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-400 mb-2">🏷️ Habit Tags</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {entry.habits.tags.map((t, i) => (
                              <TagBadge key={i} label={t} color={['cyan', 'green', 'yellow', 'pink', 'orange', 'blue'][i % 6]} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 训练统计 */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 mb-2">📈 Training Summary</h4>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div className="bg-gray-700/50 rounded-lg p-2"><div className="text-sm font-bold text-cyan-400">{entry.training?.totalTasks || 0}</div><div className="text-xs text-gray-500">Tasks</div></div>
                          <div className="bg-gray-700/50 rounded-lg p-2"><div className="text-sm font-bold text-green-400">{entry.training?.completedTasks || 0}</div><div className="text-xs text-gray-500">Completed</div></div>
                          <div className="bg-gray-700/50 rounded-lg p-2"><div className="text-sm font-bold text-purple-400">{entry.training?.totalVideosUploaded || 0}</div><div className="text-xs text-gray-500">Videos</div></div>
                          <div className="bg-gray-700/50 rounded-lg p-2"><div className="text-sm font-bold text-yellow-400">{Math.round(entry.training?.averageConfidence * 100 || 0)}%</div><div className="text-xs text-gray-500">Avg Confidence</div></div>
                        </div>
                      </div>

                      {/* 技能 */}
                      {(entry.skills?.learnedSkills?.length > 0 || entry.skills?.badges?.length > 0) && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-400 mb-2">🏅 Skills & Badges</h4>
                          <div className="flex flex-wrap gap-2">
                            {(entry.skills.learnedSkills || []).map((s, i) => <TagBadge key={`s${i}`} label={s} color="yellow" />)}
                            {(entry.skills.badges || []).map((b, i) => <TagBadge key={`b${i}`} label={b} color="orange" />)}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-gray-600">
                        Created: {entry.petCreatedAt ? new Date(entry.petCreatedAt).toLocaleDateString() : '-'}
                        · Owner active: {entry.owner?.isActive ? 'Yes' : 'No'}
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
          {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded text-sm ${p === page ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== 标签分析面板 ====================
function TagsTab() {
  const [tagsData, setTagsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const res = await getDatasetTags(); if (res.success) setTagsData(res); } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (!tagsData) return <div className="text-center py-12 text-gray-500">No tag data available</div>;

  const maxTagCount = Math.max(1, ...(tagsData.tags || []).map(t => t.count));
  const maxActionCount = Math.max(1, ...(tagsData.actions || []).map(a => a.count));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 标签频率 */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">🏷️ Tag Frequency ({tagsData.tags?.length || 0} unique)</h3>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {(tagsData.tags || []).map(t => (
            <div key={t.name} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-24 truncate">{t.name}</span>
              <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${Math.round((t.count / maxTagCount) * 100)}%` }} />
              </div>
              <span className="text-xs text-gray-300 w-8 text-right">{t.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 行为频率 */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">🎬 Action Frequency ({tagsData.actions?.length || 0} types)</h3>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {(tagsData.actions || []).map(a => (
            <div key={a.name} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-24 truncate">{a.icon} {a.name}</span>
              <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${Math.round((a.count / maxActionCount) * 100)}%` }} />
              </div>
              <span className="text-xs text-gray-300 w-8 text-right">{a.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 习惯分布 */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 md:col-span-2">
        <h3 className="text-lg font-bold text-white mb-4">📋 Habit Distribution</h3>
        <div className="flex flex-wrap gap-2">
          {(tagsData.habits || []).map((h, i) => (
            <TagBadge key={h.name} label={`${h.name} (${h.count})`} color={['cyan', 'purple', 'green', 'yellow', 'pink', 'orange'][i % 6]} />
          ))}
          {(!tagsData.habits || tagsData.habits.length === 0) && (
            <span className="text-gray-500 text-sm">No habit data collected yet</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== 导出面板 ====================
function ExportTab() {
  const [exporting, setExporting] = useState(false);
  const [lastExport, setLastExport] = useState(null);
  const [status, setStatus] = useState('');

  const handleExport = async (format, category) => {
    setExporting(true);
    setStatus(`Exporting ${category} as ${format.toUpperCase()}...`);
    try {
      const result = await exportDataset(format, category);
      setLastExport({ format, category, filename: result.filename, time: new Date().toLocaleString() });
      setStatus(`Exported: ${result.filename}`);
    } catch (err) {
      setStatus('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">📦 Export Pre-trained Dataset</h3>
        <p className="text-gray-400 text-sm mb-6">
          Export the full pet appearance, behavior habits, and training data as a structured dataset. 
          Ready for model training and data marketplace.
        </p>

        {/* JSON 导出 */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-cyan-400">JSON Format (Full Data)</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { category: 'all', label: 'Complete Dataset', desc: 'All categories', icon: '📦' },
              { category: 'appearance', label: 'Appearance Only', desc: 'Type, color, style, image', icon: '🎨' },
              { category: 'habits', label: 'Habits & Behavior', desc: 'Actions, tags, personality', icon: '🏷️' },
              { category: 'training', label: 'Training Data', desc: 'Tasks, analysis, videos', icon: '🏋️' },
            ].map(item => (
              <button key={item.category} disabled={exporting} onClick={() => handleExport('json', item.category)}
                className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 rounded-xl border border-gray-600 hover:border-cyan-500 hover:bg-gray-700 transition-all disabled:opacity-50">
                <span className="text-3xl">{item.icon}</span>
                <span className="text-sm font-medium text-white">{item.label}</span>
                <span className="text-xs text-gray-500">{item.desc}</span>
                <span className="text-xs text-cyan-400 mt-1">.json ↓</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-semibold text-purple-400 mb-3">CSV Format (Structured Table)</h4>
          <button disabled={exporting} onClick={() => handleExport('csv', 'all')}
            className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-xl border border-gray-600 hover:border-purple-500 hover:bg-gray-700 transition-all disabled:opacity-50">
            <span className="text-3xl">📊</span>
            <div className="text-left">
              <span className="text-sm font-medium text-white block">Export as CSV</span>
              <span className="text-xs text-gray-500">Core fields: pet type, color, stats, actions, tags, training count</span>
            </div>
            <span className="ml-auto text-xs text-purple-400">.csv ↓</span>
          </button>
        </div>

        {exporting && (
          <div className="mt-4 flex items-center gap-3 text-yellow-400 text-sm">
            <LoadingSpinner small /> {status}
          </div>
        )}

        {lastExport && !exporting && (
          <div className="mt-4 p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
            <p className="text-green-400 text-sm">
              Exported: <b>{lastExport.filename}</b> ({lastExport.format.toUpperCase()}, {lastExport.category})
            </p>
            <p className="text-green-500 text-xs mt-1">{lastExport.time}</p>
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
          <h4 className="text-yellow-400 font-medium text-sm mb-1">Dataset Usage Notes</h4>
          <ul className="text-yellow-300/70 text-xs space-y-1">
            <li>• All user-identifiable data (IDs, emails) is anonymized</li>
            <li>• Pet appearance data includes AI-generated images and style references</li>
            <li>• Behavior data includes detected actions, habit tags, and personality impacts</li>
            <li>• Training data includes full analysis results with confidence scores</li>
            <li>• For commercial use, ensure compliance with data protection regulations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ==================== 训练数据面板 ====================
function TrainingTab({ types }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [petType, setPetType] = useState('');
  const [pagination, setPagination] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const limit = 12;

  useEffect(() => { loadData(); }, [page, status, petType]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getDatasetTraining({ page, limit, status, petType });
      if (res.success) { setData(res.dataset); setPagination(res.pagination); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const statusColors = {
    completed: 'bg-green-900/50 text-green-300',
    training: 'bg-blue-900/50 text-blue-300',
    failed: 'bg-red-900/50 text-red-300',
    analyzing: 'bg-yellow-900/50 text-yellow-300',
    pending: 'bg-gray-700 text-gray-300',
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm">
          <option value="">All Status</option>
          {(types?.trainingStatuses || []).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={petType} onChange={e => { setPetType(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm">
          <option value="">All Pet Types</option>
          {(types?.petTypes || []).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={() => { setPage(1); loadData(); }}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-500">Refresh</button>
      </div>

      {loading && <div className="flex justify-center py-12"><LoadingSpinner /></div>}
      {!loading && data.length === 0 && <div className="text-center py-12 text-gray-500">No training data found</div>}
      {!loading && data.length > 0 && (
        <div className="space-y-3">
          {data.map(entry => (
            <motion.div key={entry.taskId} layout
              className={`bg-gray-800 rounded-xl border ${expandedId === entry.taskId ? 'border-cyan-500/50' : 'border-gray-700'} overflow-hidden cursor-pointer`}
              onClick={() => setExpandedId(expandedId === entry.taskId ? null : entry.taskId)}>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏋️</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{entry.petName}</span>
                        <TagBadge label={entry.petType} color="cyan" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>{entry.videoCount} videos</span>
                        {entry.analysis && <><span>·</span><span>{entry.analysis.detectedActions?.length || 0} actions</span></>}
                        <span>·</span><span>{entry.trainingPhases?.length || 0} phases</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[entry.status] || statusColors.pending}`}>
                    {entry.status}
                  </span>
                </div>
              </div>

              <AnimatePresence>
                {expandedId === entry.taskId && entry.analysis && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="px-4 pb-4 border-t border-gray-700/50 space-y-3">
                      <div className="mt-3">
                        <h4 className="text-xs font-semibold text-gray-400 mb-2">🎬 Detected Actions</h4>
                        <div className="flex flex-wrap gap-2">
                          {entry.analysis.detectedActions.map((a, i) => (
                            <TagBadge key={i} label={`${a.icon} ${a.name} (${Math.round(a.confidence * 100)}%)`} color="purple" />
                          ))}
                        </div>
                      </div>
                      {entry.analysis.tags?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-400 mb-2">🏷️ Tags</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {entry.analysis.tags.map((t, i) => (
                              <TagBadge key={i} label={t} color={['cyan', 'green', 'yellow', 'pink'][i % 4]} />
                            ))}
                          </div>
                        </div>
                      )}
                      {entry.analysis.detectedHabits?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-400 mb-2">📋 Habits</h4>
                          <div className="flex flex-wrap gap-2">
                            {entry.analysis.detectedHabits.map((h, i) => (
                              <TagBadge key={i} label={h.name} color="orange" />
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="text-xs text-gray-600">Created: {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '-'}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded text-sm ${p === page ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== 主导出组件 ====================
export default function DatasetPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [types, setTypes] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ovRes, tpRes] = await Promise.all([getDatasetOverview(), getDatasetTypes()]);
        if (ovRes.success) setOverview(ovRes.overview);
        if (tpRes.success) setTypes(tpRes);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'pets', name: 'Pet Data', icon: '🐾' },
    { id: 'tags', name: 'Tags & Actions', icon: '🏷️' },
    { id: 'training', name: 'Training', icon: '🏋️' },
    { id: 'export', name: 'Export', icon: '📦' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-1">📊 Training Dataset</h2>
        <p className="text-gray-400 text-sm">
          Manage and export pet appearance, behavior habits & training data for pre-trained model datasets
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === t.id
                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
            }`}>
            <span>{t.icon}</span><span>{t.name}</span>
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab overview={overview} loading={loading} />}
      {activeTab === 'pets' && <PetsTab types={types} />}
      {activeTab === 'tags' && <TagsTab />}
      {activeTab === 'training' && <TrainingTab types={types} />}
      {activeTab === 'export' && <ExportTab />}
    </div>
  );
}
