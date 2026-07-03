import React, { useState, useEffect } from 'react';
import { getTrainingTasks, deleteTrainingTask } from '../../services/adminAPI';
import LoadingSpinner from './LoadingSpinner';

export default function TrainingPanel() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    setLoading(true);
    try { const res = await getTrainingTasks(); if (res.success) setTasks(res.tasks); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this training task?')) return;
    try { await deleteTrainingTask(taskId); loadTasks(); } catch (err) { alert('Failed'); }
  };

  const getStatusBadge = (task) => {
    if (task.status === 'completed') return 'bg-green-900/50 text-green-300';
    if (task.status === 'failed') return 'bg-red-900/50 text-red-300';
    if (task.status === 'processing') return 'bg-blue-900/50 text-blue-300';
    return 'bg-yellow-900/50 text-yellow-300';
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-2">Training Tasks</h2>
      <p className="text-gray-400 text-sm mb-6">{tasks.length} total training tasks</p>

      {loading ? <LoadingSpinner />
        : tasks.length === 0 ? <p className="text-gray-500 text-center py-8">No training tasks found</p>
        : (
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-white font-medium">Task {task.id?.slice(-8)}</span>
                    <span className="text-gray-500 text-xs ml-3">{task.petName || 'Unknown pet'}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(task)}`}>
                    {task.status || 'pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-gray-500">
                    Created: {new Date(task.createdAt).toLocaleString()}
                  </div>
                  <div className="flex gap-2">
                    {task.progress !== undefined && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500" style={{ width: `${Math.min(task.progress, 100)}%` }}></div>
                        </div>
                        {task.progress}%
                      </div>
                    )}
                    <button onClick={() => handleDelete(task.id)}
                      className="px-2 py-1 bg-red-700/50 text-red-300 rounded text-xs hover:bg-red-700">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
