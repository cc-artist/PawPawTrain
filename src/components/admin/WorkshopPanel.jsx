import React, { useState, useEffect } from 'react';
import { getWorkshopCreations, deleteWorkshopCreation } from '../../services/adminAPI';
import LoadingSpinner from './LoadingSpinner';

export default function WorkshopPanel() {
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadCreations(); }, []);

  const loadCreations = async () => {
    setLoading(true);
    try { const res = await getWorkshopCreations(); if (res.success) setCreations(res.creations); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this workshop creation?')) return;
    try { await deleteWorkshopCreation(id); loadCreations(); } catch (err) { alert('Failed'); }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-2">AI Workshop Creations</h2>
      <p className="text-gray-400 text-sm mb-6">{creations.length} total creations</p>

      {loading ? <LoadingSpinner />
        : creations.length === 0 ? <p className="text-gray-500 text-center py-8">No workshop creations found</p>
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creations.map(c => (
              <div key={c.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium text-sm">{c.name || c.title || 'Untitled'}</span>
                  <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-400">{c.type || 'unknown'}</span>
                </div>
                <p className="text-gray-500 text-xs mb-3">{(c.description || '').slice(0, 80)}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</span>
                  <button onClick={() => handleDelete(c.id)}
                    className="px-2 py-1 bg-red-700/50 text-red-300 rounded text-xs hover:bg-red-700">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
