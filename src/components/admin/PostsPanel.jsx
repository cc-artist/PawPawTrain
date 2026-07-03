import React, { useState, useEffect } from 'react';
import { getPosts, approvePost, rejectPost, deletePost } from '../../services/adminAPI';
import LoadingSpinner from './LoadingSpinner';

export default function PostsPanel() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const limit = 15;

  useEffect(() => { loadPosts(); }, [status, page]);

  const loadPosts = async () => {
    setLoading(true);
    try { const res = await getPosts({ page, limit, status }); if (res.success) { setPosts(res.posts); setPagination(res.pagination); } }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleApprove = async (postId) => {
    try { await approvePost(postId); loadPosts(); } catch (err) { alert('Failed'); }
  };

  const handleReject = async (postId) => {
    const reason = prompt('Rejection reason:');
    if (reason === null) return;
    try { await rejectPost(postId, reason); loadPosts(); } catch (err) { alert('Failed'); }
  };

  const handleDelete = async (postId) => {
    if (!confirm('Delete this post permanently?')) return;
    try { await deletePost(postId); loadPosts(); } catch (err) { alert('Failed'); }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-2">Content Moderation</h2>
      <p className="text-gray-400 text-sm mb-6">{pagination?.total || 0} total posts</p>

      <div className="flex gap-3 mb-4">
        {['all', 'pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              status === s ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}>
            {s === 'all' ? 'All' : s === 'pending' ? 'Pending' : s === 'approved' ? 'Approved' : 'Rejected'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? <LoadingSpinner /> : posts.length === 0 ? <p className="text-gray-500 text-center py-8">No posts found</p>
          : posts.map(post => (
            <div key={post.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {post.userName ? post.userName[0] : '?'}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{post.userName || 'Unknown'}</p>
                    {post.source && <p className="text-gray-500 text-xs">Source: {post.source}</p>}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  post.status === 'approved' ? 'bg-green-900/50 text-green-300' :
                  post.status === 'rejected' ? 'bg-red-900/50 text-red-300' : 'bg-yellow-900/50 text-yellow-300'
                }`}>
                  {post.status || 'pending'}
                </span>
              </div>
              <p className="text-gray-300 text-sm mb-3">{(post.content || post.caption || '').slice(0, 200)}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-3 text-xs text-gray-500">
                  {post.likes !== undefined && <span>❤️ {post.likes}</span>}
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2">
                  {(post.status === 'pending' || !post.status) && (
                    <>
                      <button onClick={() => handleReject(post.id)} className="px-3 py-1 bg-red-700/50 text-red-300 rounded text-xs hover:bg-red-700">Reject</button>
                      <button onClick={() => handleApprove(post.id)} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-500">Approve</button>
                    </>
                  )}
                  <button onClick={() => handleDelete(post.id)} className="px-3 py-1 bg-gray-600 text-gray-300 rounded text-xs hover:bg-gray-500">Delete</button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
