import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { isAdminLoggedIn, adminLogout, getAdminUser } from '../../services/adminAPI';
import DashboardPanel from './DashboardPanel';
import UsersPanel from './UsersPanel';
import PetsPanel from './PetsPanel';
import PostsPanel from './PostsPanel';
import TrainingPanel from './TrainingPanel';
import WorkshopPanel from './WorkshopPanel';
import ConfigPanel from './ConfigPanel';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    if (!isAdminLoggedIn()) { navigate('/admin/login', { replace: true }); return; }
    setAdminUser(getAdminUser());
  }, [navigate]);

  const handleLogout = () => { adminLogout(); navigate('/admin/login', { replace: true }); };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'users', name: 'Users', icon: '👥' },
    { id: 'pets', name: 'Pets', icon: '🐾' },
    { id: 'posts', name: 'Content', icon: '📝' },
    { id: 'training', name: 'Training', icon: '🏋️' },
    { id: 'workshop', name: 'Workshop', icon: '🎨' },
    { id: 'config', name: 'System', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="flex">
        <aside className="w-64 bg-gray-800/80 backdrop-blur min-h-screen p-6 border-r border-gray-700 flex flex-col">
          <div className="mb-8">
            <h1 className="text-xl font-bold text-white flex items-center gap-2"><span>🛡️</span> Admin Panel</h1>
            {adminUser && <p className="text-gray-400 text-xs mt-1 ml-7">{adminUser.username} (superadmin)</p>}
          </div>
          <nav className="space-y-1 flex-1">
            {menuItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-all text-sm ${
                  activeTab === item.id ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-700/50'
                }`}>
                <span>{item.icon}</span><span>{item.name}</span>
              </button>
            ))}
          </nav>
          <button onClick={handleLogout} className="w-full px-4 py-2 bg-red-900/30 text-red-300 rounded-lg text-sm font-medium hover:bg-red-900/50 mt-4">
            🚪 Sign Out
          </button>
        </aside>
        <main className="flex-1 p-8 overflow-auto max-h-screen">
          {activeTab === 'dashboard' && <DashboardPanel />}
          {activeTab === 'users' && <UsersPanel />}
          {activeTab === 'pets' && <PetsPanel />}
          {activeTab === 'posts' && <PostsPanel />}
          {activeTab === 'training' && <TrainingPanel />}
          {activeTab === 'workshop' && <WorkshopPanel />}
          {activeTab === 'config' && <ConfigPanel />}
        </main>
      </div>
    </div>
  );
}
