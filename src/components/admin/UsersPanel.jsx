import React, { useState, useEffect } from 'react';
import { getUsers, banUser, unbanUser, updateUserPoints, exportUsersCsv, getUserDetail } from '../../services/adminAPI';
import LoadingSpinner, { LoadingOverlay } from './LoadingSpinner';

export default function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [pagination, setPagination] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const limit = 15;

  useEffect(() => { loadUsers(); }, [page, status]);

  const loadUsers = async () => {
    setLoading(true);
    try { const res = await getUsers({ page, limit, search, status }); if (res.success) { setUsers(res.users); setPagination(res.pagination); } }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSearch = () => { setPage(1); loadUsers(); };

  const handleBan = async (userId, isBanned) => {
    try {
      if (isBanned) { await unbanUser(userId); }
      else { const reason = prompt('Ban reason:'); if (reason === null) return; await banUser(userId, reason); }
      loadUsers();
    } catch (err) { alert('Operation failed'); }
  };

  const handlePoints = async (userId) => {
    const op = prompt('Operation (set/add/subtract):', 'set'); if (!op) return;
    const val = prompt('Points amount:'); if (!val) return;
    try { await updateUserPoints(userId, Number(val), op); loadUsers(); } catch (err) { alert('Operation failed'); }
  };

  const showDetail = async (userId) => {
    setDetailLoading(true); setSelectedUser(null);
    try { const res = await getUserDetail(userId); if (res.success) setSelectedUser(res.user); }
    catch (err) { alert('Failed to load'); }
    finally { setDetailLoading(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white">User Management</h2>
          <p className="text-gray-400 text-sm">{pagination?.total || 0} total users</p>
        </div>
        <button onClick={exportUsersCsv} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-500 transition">📥 Export CSV</button>
      </div>

      <div className="flex gap-3 mb-4">
        <input type="text" placeholder="Search username or email..." value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500" />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm">
          <option value="all">All Status</option><option value="active">Active</option><option value="banned">Banned</option>
        </select>
        <button onClick={handleSearch} className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-500">Search</button>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="px-5 py-3 text-left text-gray-300 font-medium">User</th>
              <th className="px-5 py-3 text-left text-gray-300 font-medium">Email</th>
              <th className="px-5 py-3 text-left text-gray-300 font-medium">Points</th>
              <th className="px-5 py-3 text-left text-gray-300 font-medium">Pets</th>
              <th className="px-5 py-3 text-left text-gray-300 font-medium">Status</th>
              <th className="px-5 py-3 text-left text-gray-300 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="6" className="px-5 py-8 text-center"><LoadingSpinner small /></td></tr>
              : users.length === 0 ? <tr><td colSpan="6" className="px-5 py-8 text-center text-gray-500">No users found</td></tr>
              : users.map(user => (
                <tr key={user.id} className="border-t border-gray-700/50 hover:bg-gray-750">
                  <td className="px-5 py-3">
                    <div className="font-medium text-white">{user.username}</div>
                    <div className="text-xs text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{user.email || '-'}</td>
                  <td className="px-5 py-3 text-yellow-400 font-bold">{user.points}</td>
                  <td className="px-5 py-3 text-gray-300">{user.petCount}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isBanned ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
                      {user.isBanned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => showDetail(user.id)} className="px-2 py-1 bg-gray-600 text-gray-200 rounded text-xs hover:bg-gray-500">Detail</button>
                      <button onClick={() => handlePoints(user.id)} className="px-2 py-1 bg-yellow-700/50 text-yellow-300 rounded text-xs hover:bg-yellow-700">Points</button>
                      <button onClick={() => handleBan(user.id, user.isBanned)}
                        className={`px-2 py-1 rounded text-xs ${user.isBanned ? 'bg-green-700/50 text-green-300 hover:bg-green-700' : 'bg-red-700/50 text-red-300 hover:bg-red-700'}`}>
                        {user.isBanned ? 'Unban' : 'Ban'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded text-sm ${p === page ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{p}</button>
          ))}
        </div>
      )}

      {detailLoading && <LoadingOverlay />}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-600" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">👤 {selectedUser.username}</h3>
            <div className="space-y-2 text-sm">
              <Row label="ID" value={selectedUser.id} mono />
              <Row label="Email" value={selectedUser.email || '-'} />
              <Row label="Points" value={selectedUser.points} className="text-yellow-400 font-bold" />
              <Row label="Status" value={selectedUser.isBanned ? 'Banned' : 'Active'} className={selectedUser.isBanned ? 'text-red-400' : 'text-green-400'} />
              <Row label="Pets" value={selectedUser.pets?.length || 0} />
              <Row label="Posts" value={selectedUser.posts || 0} />
              <Row label="Registered" value={new Date(selectedUser.createdAt).toLocaleString()} />
            </div>
            <button onClick={() => setSelectedUser(null)} className="w-full mt-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono, className }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}:</span>
      <span className={`text-gray-200 ${className || ''} ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
