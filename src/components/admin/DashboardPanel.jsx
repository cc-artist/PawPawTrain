import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getDashboard } from '../../services/adminAPI';
import LoadingSpinner from './LoadingSpinner';

export default function DashboardPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);
  const loadStats = async () => {
    setLoading(true);
    try { const res = await getDashboard(); if (res.success) setStats(res.stats); } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <LoadingSpinner />;

  const cards = [
    { title: 'Total Users', value: stats?.users?.total || 0, icon: '👥', color: 'text-cyan-400' },
    { title: 'Active Today', value: stats?.users?.activeToday || 0, icon: '📱', color: 'text-green-400' },
    { title: 'Total Pets', value: stats?.pets?.total || 0, icon: '🐾', color: 'text-purple-400' },
    { title: 'Total Posts', value: stats?.posts?.total || 0, icon: '📝', color: 'text-yellow-400' },
    { title: 'Training Tasks', value: stats?.training?.totalTasks || 0, icon: '🏋️', color: 'text-orange-400' },
    { title: 'Workshop Items', value: stats?.workshop?.totalCreations || 0, icon: '🎨', color: 'text-pink-400' },
    { title: 'Total Points', value: stats?.points?.total || 0, icon: '⭐', color: 'text-amber-400' },
    { title: 'Avg Points/User', value: stats?.points?.average || 0, icon: '📊', color: 'text-indigo-400' }
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
      <p className="text-gray-400 mb-8">Platform overview and key metrics</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-3"><span className="text-2xl">{card.icon}</span></div>
            <h3 className="text-gray-400 text-sm mb-1">{card.title}</h3>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value.toLocaleString()}</p>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 text-gray-500 text-xs">Server time: {stats?.serverTime || 'N/A'}</div>
    </div>
  );
}
