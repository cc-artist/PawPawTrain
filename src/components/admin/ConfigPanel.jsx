import React, { useState, useEffect } from 'react';
import { getSystemConfig, getAuditLogs, createBackup } from '../../services/adminAPI';
import LoadingSpinner from './LoadingSpinner';

export default function ConfigPanel() {
  const [config, setConfig] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubtab, setActiveSubtab] = useState('config');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [configRes, auditRes] = await Promise.all([getSystemConfig(), getAuditLogs({ limit: 50 })]);
      if (configRes.success) setConfig(configRes.config);
      if (auditRes.success) setAuditLogs(auditRes.logs || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleBackup = async () => {
    try {
      const res = await createBackup();
      if (res.success) {
        const blob = new Blob([JSON.stringify(res.backup.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pawpawtrain_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        alert(`Backup created! ${res.backup.stats.users} users, ${res.backup.stats.pets} pets`);
        loadData();
      }
    } catch (err) { alert('Backup failed'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-2">System Configuration</h2>
      <p className="text-gray-400 text-sm mb-6">Server settings, AI models, audit logs & data backup</p>

      <div className="flex gap-3 mb-6">
        {[{ id: 'config', label: 'Config' }, { id: 'audit', label: 'Audit Logs' }, { id: 'backup', label: 'Backup' }].map(t => (
          <button key={t.id} onClick={() => setActiveSubtab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSubtab === t.id ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}>{t.label}</button>
        ))}
      </div>

      {activeSubtab === 'config' && config && (
        <div className="space-y-6">
          <Section title="Server">
            <Row label="Port" value={config.server.port} />
            <Row label="Environment" value={config.server.nodeEnv} />
            <Row label="Default AI Model" value={config.server.defaultImageModel} />
          </Section>

          <Section title="AI Models">
            {Object.entries(config.aiModels).map(([name, model]) => (
              <div key={name} className="bg-gray-750 rounded-lg p-3 mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium capitalize">{name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${model.configured ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                    {model.configured ? 'Configured' : 'Not Configured'}
                  </span>
                </div>
                <Row label="Key Preview" value={model.keyPreview || '-'} mono />
                {model.baseUrl && <Row label="Base URL" value={model.baseUrl} mono />}
              </div>
            ))}
          </Section>

          <Section title="Cloud Storage">
            <div className="bg-gray-750 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Cloudinary</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${config.cloudStorage.cloudinary.configured ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                  {config.cloudStorage.cloudinary.configured ? 'Configured' : 'Not Configured'}
                </span>
              </div>
              <Row label="Cloud Name" value={config.cloudStorage.cloudinary.cloudName || '-'} />
              <Row label="Key Preview" value={config.cloudStorage.cloudinary.keyPreview || '-'} mono />
            </div>
          </Section>

          <Section title="Data Storage">
            <Row label="Type" value={config.dataStore.type} />
            <Row label="Location" value={config.dataStore.location} />
            <Row label="Auto Save" value={config.dataStore.autoSaveInterval} />
          </Section>
        </div>
      )}

      {activeSubtab === 'audit' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-gray-300">Time</th>
                <th className="px-4 py-3 text-left text-gray-300">Action</th>
                <th className="px-4 py-3 text-left text-gray-300">By</th>
                <th className="px-4 py-3 text-left text-gray-300">Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">No audit logs yet</td></tr>
              ) : (
                auditLogs.map(log => (
                  <tr key={log.id} className="border-t border-gray-700/50">
                    <td className="px-4 py-2 text-gray-400 text-xs whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        log.action.includes('FAILED') ? 'bg-red-900/30 text-red-300' :
                        log.action.includes('DELETED') ? 'bg-orange-900/30 text-orange-300' :
                        'bg-cyan-900/30 text-cyan-300'
                      }`}>{log.action}</span>
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">{log.performedBy}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs font-mono">{JSON.stringify(log.details).slice(0, 60)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-gray-700 text-gray-500 text-xs">{auditLogs.length} entries</div>
        </div>
      )}

      {activeSubtab === 'backup' && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Data Backup</h3>
          <p className="text-gray-400 text-sm mb-6">
            Create a full backup of all platform data including users, pets, posts, training tasks, workshop creations, and system preferences.
            The backup will be downloaded as a JSON file.
          </p>
          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 mb-6">
            <p className="text-yellow-300 text-sm">
              ⚠️ Important: Backup files contain all platform data. Store them securely and do not share them.
              Sensitive API keys are NOT included in the backup.
            </p>
          </div>
          <button onClick={handleBackup}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-lg transition-all">
            📦 Create Backup & Download
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-3 border-b border-gray-700 pb-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className={`text-gray-200 text-sm ${mono ? 'font-mono text-xs' : ''}`}>{String(value)}</span>
    </div>
  );
}
