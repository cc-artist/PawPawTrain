import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-8">
          {activeTab === 'dashboard' && <Dashboard analytics={analytics} />}
          {activeTab === 'users' && <UsersManagement />}
          {activeTab === 'pets' && <PetsManagement />}
          {activeTab === 'products' && <ProductsManagement />}
          {activeTab === 'content' && <ContentModeration />}
          {activeTab === 'tasks' && <TasksActivities />}
        </main>
      </div>
    </div>
  );
};

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', name: '数据看板', icon: '📊' },
    { id: 'users', name: '用户管理', icon: '👥' },
    { id: 'pets', name: '宠物管理', icon: '🐾' },
    { id: 'products', name: '商品管理', icon: '🛍️' },
    { id: 'content', name: '内容审核', icon: '✅' },
    { id: 'tasks', name: '活动配置', icon: '⚙️' }
  ];

  return (
    <aside className="w-64 bg-gray-800 min-h-screen p-6 border-r border-gray-700">
      <h1 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
        <span>🎛️</span> PawPawTrain 后台
      </h1>
      <nav className="space-y-2">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
              activeTab === item.id 
                ? 'bg-gradient-to-r from-cyber-blue to-cyber-purple text-white shadow-lg' 
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

const Dashboard = ({ analytics }) => {
  const StatCard = ({ title, value, trend, icon, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-3xl">{icon}</span>
        {trend && (
          <span className={`text-sm px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </motion.div>
  );

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-8">数据看板</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="今日活跃 (DAU)" value={analytics?.dau?.today || 0} trend={analytics?.dau?.trend} icon="📱" color="text-cyber-blue" />
        <StatCard title="月活跃 (MAU)" value={analytics?.mau?.current || 0} trend={analytics?.mau?.trend} icon="👥" color="text-cyber-purple" />
        <StatCard title="付费率" value={`${analytics?.payment?.rate}%`} icon="💰" color="text-cyber-yellow" />
        <StatCard title="ARPU" value={`¥${analytics?.payment?.arpu}`} icon="📈" color="text-cyber-green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-xl font-bold text-white mb-4">营收趋势</h3>
          <div className="h-64 flex items-end gap-2">
            {analytics?.revenue?.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-cyber-blue to-cyber-purple rounded-t"
                  style={{ height: `${(item.amount / 50000) * 100}%`, minHeight: '20px' }}
                ></div>
                <span className="text-xs text-gray-400 mt-2">{item.date}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-xl font-bold text-white mb-4">用户增长</h3>
          <div className="space-y-4">
            {analytics?.user_growth?.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">{item.date}</span>
                  <span className="text-cyber-blue">+{item.new}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyber-green to-cyber-blue" style={{ width: `${(item.active / 2000) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">宠物统计</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">总宠物数</span>
              <span className="text-cyber-blue font-bold">{analytics?.pets?.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">活跃宠物</span>
              <span className="text-cyber-green font-bold">{analytics?.pets?.active}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">今日新增</span>
              <span className="text-cyber-yellow font-bold">{analytics?.pets?.new_today}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">内容统计</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">总内容</span>
              <span className="text-cyber-blue font-bold">{analytics?.posts?.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">待审核</span>
              <span className="text-cyber-yellow font-bold">{analytics?.posts?.pending}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">已通过</span>
              <span className="text-cyber-green font-bold">{analytics?.posts?.approved}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">营收指标</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">LTV</span>
              <span className="text-cyber-purple font-bold">¥{analytics?.payment?.ltv}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">总营收</span>
              <span className="text-cyber-green font-bold">¥{analytics?.payment?.total_revenue?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [page, search, status]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users?page=${page}&limit=10&search=${search}&status=${status}`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (userId, isBanned) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/${isBanned ? 'unban' : 'ban'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Administrative action' })
      });
      const data = await response.json();
      if (data.success) {
        loadUsers();
      }
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/users/export');
      const data = await response.json();
      if (data.success) {
        const csv = [
          ['ID', '手机号', '昵称', '积分', '等级', '帖子数', '好友数', '状态', '注册时间'].join(','),
          ...data.data.map(u => [u.id, u.phone, u.nickname, u.points, u.level, u.total_posts, u.total_friends, u.is_banned ? '封禁' : '正常', u.created_at].join(','))
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users.csv';
        a.click();
      }
    } catch (error) {
      console.error('Failed to export users:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white">用户管理</h2>
        <button
          onClick={handleExport}
          className="px-6 py-2 bg-gradient-to-r from-cyber-green to-cyber-blue rounded-lg text-white font-medium hover:shadow-lg transition-all"
        >
          📥 导出数据
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="搜索昵称或手机号..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyber-blue"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyber-blue"
        >
          <option value="all">全部状态</option>
          <option value="active">正常用户</option>
          <option value="banned">封禁用户</option>
        </select>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-gray-300 font-medium">用户</th>
              <th className="px-6 py-4 text-left text-gray-300 font-medium">等级</th>
              <th className="px-6 py-4 text-left text-gray-300 font-medium">积分</th>
              <th className="px-6 py-4 text-left text-gray-300 font-medium">帖子数</th>
              <th className="px-6 py-4 text-left text-gray-300 font-medium">状态</th>
              <th className="px-6 py-4 text-left text-gray-300 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyber-blue mx-auto mb-2"></div>
                  加载中...
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="border-t border-gray-700">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyber-blue to-cyber-purple rounded-full flex items-center justify-center text-white font-bold">
                        {user.nickname[0]}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.nickname}</p>
                        <p className="text-gray-400 text-sm">{user.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-cyber-blue font-bold">Lv.{user.level}</td>
                  <td className="px-6 py-4 text-cyber-yellow font-bold">{user.points}</td>
                  <td className="px-6 py-4 text-gray-300">{user.total_posts}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${user.is_banned ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
                      {user.is_banned ? '封禁' : '正常'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleBan(user.id, user.is_banned)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        user.is_banned 
                          ? 'bg-green-900 text-green-300 hover:bg-green-800' 
                          : 'bg-red-900 text-red-300 hover:bg-red-800'
                      }`}
                    >
                      {user.is_banned ? '解封' : '封禁'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PetsManagement = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/pets');
      const data = await response.json();
      if (data.success) {
        setPets(data.pets);
      }
    } catch (error) {
      console.error('Failed to load pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPersonality = async (petId, personality) => {
    try {
      const response = await fetch(`/api/admin/pets/${petId}/reset-personality`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personality })
      });
      const data = await response.json();
      if (data.success) {
        loadPets();
        setSelectedPet(null);
      }
    } catch (error) {
      console.error('Failed to reset personality:', error);
    }
  };

  const handleAdjustLevel = async (petId, level) => {
    try {
      const response = await fetch(`/api/admin/pets/${petId}/adjust-level`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level })
      });
      const data = await response.json();
      if (data.success) {
        loadPets();
        setSelectedPet(null);
      }
    } catch (error) {
      console.error('Failed to adjust level:', error);
    }
  };

  const handleForceEvolve = async (petId, stage) => {
    try {
      const response = await fetch(`/api/admin/pets/${petId}/force-evolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_stage: stage })
      });
      const data = await response.json();
      if (data.success) {
        loadPets();
        setSelectedPet(null);
      }
    } catch (error) {
      console.error('Failed to force evolve:', error);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-8">宠物管理</h2>
      
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-gray-300 font-medium">宠物</th>
              <th className="px-6 py-4 text-left text-gray-300 font-medium">类型</th>
              <th className="px-6 py-4 text-left text-gray-300 font-medium">等级</th>
              <th className="px-6 py-4 text-left text-gray-300 font-medium">性格</th>
              <th className="px-6 py-4 text-left text-gray-300 font-medium">健康</th>
              <th className="px-6 py-4 text-left text-gray-300 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {pets.map(pet => (
              <tr key={pet.id} className="border-t border-gray-700">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{pet.type === 'dog' ? '🐶' : pet.type === 'cat' ? '🐱' : pet.type === 'rabbit' ? '🐰' : '🐾'}</span>
                    <span className="text-white font-medium">{pet.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-300">{pet.type}</td>
                <td className="px-6 py-4 text-cyber-blue font-bold">Lv.{pet.level}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-cyber-blue/20 text-cyber-blue rounded-full text-sm">
                    {pet.personality}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-cyber-green" style={{ width: `${pet.health}%` }}></div>
                    </div>
                    <span className="text-gray-300 text-sm">{pet.health}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setSelectedPet(pet)}
                    className="px-4 py-2 bg-cyber-blue/20 text-cyber-blue rounded-lg text-sm font-medium hover:bg-cyber-blue/30 transition-all"
                  >
                    管理
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-8 w-full max-w-lg border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-6">编辑宠物 - {selectedPet.name}</h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-gray-400 mb-2 block">重置性格</label>
                <select
                  defaultValue={selectedPet.personality}
                  onChange={(e) => handleResetPersonality(selectedPet.id, e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="active">活泼</option>
                  <option value="proud">傲娇</option>
                  <option value="gentle">温柔</option>
                  <option value="mischievous">调皮</option>
                  <option value="lazy">慵懒</option>
                  <option value="curious">好奇</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 mb-2 block">调整等级</label>
                <input
                  type="number"
                  defaultValue={selectedPet.level}
                  min="1"
                  max="100"
                  onChange={(e) => handleAdjustLevel(selectedPet.id, parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-gray-400 mb-2 block">强制进化</label>
                <select
                  onChange={(e) => handleForceEvolve(selectedPet.id, e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="">选择阶段</option>
                  <option value="baby">幼年期</option>
                  <option value="growing">成长期</option>
                  <option value="mature">成熟期</option>
                  <option value="perfect">完全体</option>
                  <option value="ultimate">究极体</option>
                </select>
              </div>

              <button
                onClick={() => setSelectedPet(null)}
                className="w-full py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-500"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadProducts();
    loadStats();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/admin/products');
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/products/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleToggle = async (productId) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/toggle`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        loadProducts();
      }
    } catch (error) {
      console.error('Failed to toggle product:', error);
    }
  };

  const handleUpdatePrice = async (productId, price) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price })
      });
      const data = await response.json();
      if (data.success) {
        loadProducts();
      }
    } catch (error) {
      console.error('Failed to update price:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white">商品管理</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="px-6 py-2 bg-gradient-to-r from-cyber-green to-cyber-blue rounded-lg text-white font-medium hover:shadow-lg transition-all"
        >
          + 添加商品
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">总销量</p>
            <p className="text-2xl font-bold text-cyber-blue">{stats.total_sales.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">总营收</p>
            <p className="text-2xl font-bold text-cyber-green">¥{stats.total_revenue.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">上架商品</p>
            <p className="text-2xl font-bold text-cyber-yellow">{stats.active_products}</p>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-gray-300 font-medium">商品</th>
              <th className="px-6 py-4 text-left text-gray-300 font-medium">类型</th>
              <th className="px-6 py-4 text-left text-gray-300 font-medium">价格</th>
              <th className="px-6 py-4 text-left text-gray-300 font-medium">销量</th>
              <th className="px-6 py-4 text-left text-gray-300 font-medium">状态</th>
              <th className="px-6 py-4 text-left text-gray-300 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} className="border-t border-gray-700">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{product.image_url || '📦'}</span>
                    <div>
                      <p className="text-white font-medium">{product.name}</p>
                      <p className="text-gray-400 text-sm">{product.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-300">
                  <span className="px-2 py-1 bg-gray-700 rounded text-xs">{product.product_type}</span>
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    defaultValue={product.price}
                    onBlur={(e) => handleUpdatePrice(product.id, parseInt(e.target.value))}
                    className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-cyber-yellow text-center font-bold"
                  />
                </td>
                <td className="px-6 py-4 text-cyber-green font-bold">{product.sales_count}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${product.is_active ? 'bg-green-900 text-green-300' : 'bg-gray-600 text-gray-300'}`}>
                    {product.is_active ? '上架' : '下架'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggle(product.id)}
                    className="px-4 py-2 bg-cyber-blue/20 text-cyber-blue rounded-lg text-sm font-medium hover:bg-cyber-blue/30 transition-all"
                  >
                    {product.is_active ? '下架' : '上架'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ContentModeration = () => {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    loadContent();
  }, [status]);

  const loadContent = async () => {
    try {
      const response = await fetch(`/api/admin/content?status=${status}`);
      const data = await response.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Failed to load content:', error);
    }
  };

  const handleApprove = async (postId) => {
    try {
      const response = await fetch(`/api/admin/content/${postId}/approve`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        loadContent();
      }
    } catch (error) {
      console.error('Failed to approve post:', error);
    }
  };

  const handleReject = async (postId, reason) => {
    try {
      const response = await fetch(`/api/admin/content/${postId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const data = await response.json();
      if (data.success) {
        loadContent();
      }
    } catch (error) {
      console.error('Failed to reject post:', error);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-8">内容审核</h2>
      
      <div className="flex gap-4 mb-6">
        {['pending', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              status === s 
                ? 'bg-gradient-to-r from-cyber-blue to-cyber-purple text-white shadow-lg' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {s === 'pending' ? '待审核' : s === 'approved' ? '已通过' : '已拒绝'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyber-blue to-cyber-purple rounded-full flex items-center justify-center text-white font-bold">
                  {post.user_nickname[0]}
                </div>
                <div>
                  <p className="text-white font-medium">{post.user_nickname}</p>
                  <p className="text-gray-400 text-sm">{post.pet_name}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                post.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                post.status === 'approved' ? 'bg-green-900 text-green-300' :
                'bg-red-900 text-red-300'
              }`}>
                {post.status === 'pending' ? '待审核' : post.status === 'approved' ? '已通过' : '已拒绝'}
              </span>
            </div>
            
            <p className="text-gray-300 mb-4">{post.content}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-gray-400 text-sm">
                <span>❤️ {post.likes}</span>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
              
              {post.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReject(post.id, '内容违规')}
                    className="px-4 py-2 bg-red-900/50 text-red-300 rounded-lg font-medium hover:bg-red-900"
                  >
                    拒绝
                  </button>
                  <button
                    onClick={() => handleApprove(post.id)}
                    className="px-4 py-2 bg-gradient-to-r from-cyber-green to-cyber-blue text-white rounded-lg font-medium hover:shadow-lg"
                  >
                    通过
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TasksActivities = () => {
  const [activeSubTab, setActiveSubTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [redeemCodes, setRedeemCodes] = useState([]);
  const [showGenerateCodes, setShowGenerateCodes] = useState(false);

  useEffect(() => {
    if (activeSubTab === 'tasks') loadTasks();
    else if (activeSubTab === 'activities') loadActivities();
    else loadRedeemCodes();
  }, [activeSubTab]);

  const loadTasks = async () => {
    try {
      const response = await fetch('/api/admin/tasks');
      const data = await response.json();
      if (data.success) setTasks(data.tasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const loadActivities = async () => {
    try {
      const response = await fetch('/api/admin/activities');
      const data = await response.json();
      if (data.success) setActivities(data.activities);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const loadRedeemCodes = async () => {
    try {
      const response = await fetch('/api/admin/redeem-codes');
      const data = await response.json();
      if (data.success) setRedeemCodes(data.redeem_codes);
    } catch (error) {
      console.error('Failed to load redeem codes:', error);
    }
  };

  const handleToggleTask = async (taskId) => {
    try {
      const response = await fetch(`/api/admin/tasks/${taskId}/toggle`, { method: 'POST' });
      const data = await response.json();
      if (data.success) loadTasks();
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const handleGenerateCodes = async (config) => {
    try {
      const response = await fetch('/api/admin/redeem-codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await response.json();
      if (data.success) {
        loadRedeemCodes();
        setShowGenerateCodes(false);
      }
    } catch (error) {
      console.error('Failed to generate codes:', error);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-8">活动配置</h2>
      
      <div className="flex gap-4 mb-6">
        {[
          { id: 'tasks', name: '任务管理', icon: '📋' },
          { id: 'activities', name: '线下活动', icon: '🎉' },
          { id: 'redeem', name: '兑换码', icon: '🎁' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeSubTab === tab.id 
                ? 'bg-gradient-to-r from-cyber-blue to-cyber-purple text-white shadow-lg' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tab.icon} {tab.name}
          </button>
        ))}
      </div>

      {activeSubTab === 'tasks' && (
        <div className="space-y-4">
          {tasks.map(task => (
            <div key={task.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg mb-2">{task.name}</h3>
                <p className="text-gray-400 text-sm mb-2">类型: {task.type}</p>
                <p className="text-cyber-green text-sm">
                  奖励: {JSON.stringify(task.rewards)}
                </p>
              </div>
              <button
                onClick={() => handleToggleTask(task.id)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  task.is_active ? 'bg-green-900/50 text-green-300' : 'bg-gray-600 text-gray-300'
                }`}
              >
                {task.is_active ? '已启用' : '已禁用'}
              </button>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'activities' && (
        <div className="space-y-4">
          {activities.map(activity => (
            <div key={activity.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">{activity.name}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  activity.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                }`}>
                  {activity.status === 'active' ? '进行中' : '即将开始'}
                </span>
              </div>
              <p className="text-gray-400 mb-2">{activity.description}</p>
              <p className="text-cyber-blue text-sm">
                {new Date(activity.start_date).toLocaleDateString()} - {new Date(activity.end_date).toLocaleDateString()}
              </p>
              <p className="text-cyber-yellow text-sm mt-2">参与人数: {activity.participants}</p>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'redeem' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">兑换码管理</h3>
            <button
              onClick={() => setShowGenerateCodes(true)}
              className="px-6 py-2 bg-gradient-to-r from-cyber-green to-cyber-blue rounded-lg text-white font-medium hover:shadow-lg transition-all"
            >
              + 生成兑换码
            </button>
          </div>
          
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">兑换码</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">类型</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">面值</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">使用情况</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">过期时间</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {redeemCodes.map(code => (
                  <tr key={code.id} className="border-t border-gray-700">
                    <td className="px-6 py-4 font-mono text-cyber-yellow font-bold">{code.code}</td>
                    <td className="px-6 py-4 text-gray-300">{code.type}</td>
                    <td className="px-6 py-4 text-cyber-green font-bold">{code.type === 'points' ? `+${code.value}` : code.value}</td>
                    <td className="px-6 py-4 text-gray-300">{code.used_count} / {code.max_uses}</td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{new Date(code.expires_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        code.is_active && new Date(code.expires_at) > new Date() ? 'bg-green-900 text-green-300' : 'bg-gray-600 text-gray-300'
                      }`}>
                        {code.is_active ? '有效' : '无效'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showGenerateCodes && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-8 w-full max-w-md border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-6">生成兑换码</h3>
            <GenerateCodesForm onSubmit={handleGenerateCodes} onCancel={() => setShowGenerateCodes(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

const GenerateCodesForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    type: 'points',
    value: '100',
    max_uses: '1',
    expires_in: '30',
    count: '1'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-gray-400 mb-2 block">类型</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
        >
          <option value="points">积分</option>
          <option value="item">物品</option>
        </select>
      </div>
      <div>
        <label className="text-gray-400 mb-2 block">面值</label>
        <input
          type="number"
          value={formData.value}
          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
        />
      </div>
      <div>
        <label className="text-gray-400 mb-2 block">最大使用次数</label>
        <input
          type="number"
          value={formData.max_uses}
          onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
        />
      </div>
      <div>
        <label className="text-gray-400 mb-2 block">有效期(天)</label>
        <input
          type="number"
          value={formData.expires_in}
          onChange={(e) => setFormData({ ...formData, expires_in: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
        />
      </div>
      <div>
        <label className="text-gray-400 mb-2 block">生成数量</label>
        <input
          type="number"
          value={formData.count}
          onChange={(e) => setFormData({ ...formData, count: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
        />
      </div>
      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-500"
        >
          取消
        </button>
        <button
          type="submit"
          className="flex-1 py-3 bg-gradient-to-r from-cyber-green to-cyber-blue text-white rounded-lg font-medium hover:shadow-lg"
        >
          生成
        </button>
      </div>
    </form>
  );
};

export default AdminDashboard;
