import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { COMPETITION_STATUS } from '../../utils/constants';

const CompetitionSettings = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await adminService.getConfig();
      setConfig(data.config || data.data || {});
    } catch (err) {
      setError('Failed to load competition configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: Number(value) || value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await adminService.updateConfig(config);
      setSuccess('Configuration saved successfully!');
    } catch (err) {
      setError('Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setError('');
      setSuccess('');
      const data = await adminService.changeCompetitionStatus(newStatus);
      setConfig(data.config || data.data || config);
      setSuccess(`Competition status changed to ${newStatus}`);
      fetchConfig();
    } catch (err) {
      setError('Failed to change competition status.');
    }
  };

  if (loading) return <div className="text-white text-center py-8">Loading settings...</div>;
  if (!config) return <div className="text-red-400 text-center py-8">No configuration found.</div>;

  return (
    <div className="max-w-4xl w-full mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Competition Settings</h1>

      {error && <div className="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-lg mb-6">{error}</div>}
      {success && <div className="bg-green-900/30 border border-green-500 text-green-400 p-4 rounded-lg mb-6">{success}</div>}

      <div className="card mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Competition Status Control</h2>
        <div className="flex gap-4">
          <button 
            onClick={() => handleStatusChange(COMPETITION_STATUS.NOT_STARTED)}
            disabled={config.competitionStatus === COMPETITION_STATUS.NOT_STARTED}
            className={`px-4 py-2 rounded font-bold ${config.competitionStatus === COMPETITION_STATUS.NOT_STARTED ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
          >
            Reset (Not Started)
          </button>
          <button 
            onClick={() => handleStatusChange(COMPETITION_STATUS.ACTIVE)}
            disabled={config.competitionStatus === COMPETITION_STATUS.ACTIVE}
            className={`px-4 py-2 rounded font-bold ${config.competitionStatus === COMPETITION_STATUS.ACTIVE ? 'bg-green-600 text-white cursor-not-allowed' : 'bg-green-700 hover:bg-green-600 text-white'}`}
          >
            Start Competition
          </button>
          <button 
            onClick={() => handleStatusChange(COMPETITION_STATUS.PAUSED)}
            disabled={config.competitionStatus === COMPETITION_STATUS.PAUSED}
            className={`px-4 py-2 rounded font-bold ${config.competitionStatus === COMPETITION_STATUS.PAUSED ? 'bg-yellow-600 text-white cursor-not-allowed' : 'bg-yellow-700 hover:bg-yellow-600 text-white'}`}
          >
            Pause Competition
          </button>
          <button 
            onClick={() => handleStatusChange(COMPETITION_STATUS.ENDED)}
            disabled={config.competitionStatus === COMPETITION_STATUS.ENDED}
            className={`px-4 py-2 rounded font-bold ${config.competitionStatus === COMPETITION_STATUS.ENDED ? 'bg-red-600 text-white cursor-not-allowed' : 'bg-red-700 hover:bg-red-600 text-white'}`}
          >
            End Competition
          </button>
        </div>
        <div className="mt-4 text-sm text-gray-400">
          Current Status: <strong className="text-white uppercase tracking-wider">{config.competitionStatus}</strong>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-white mb-6">Game Parameters</h2>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-indigo-400 border-b border-gray-700 pb-2">Level 1 (MCQ)</h3>
              <div>
                <label className="label">Question Count</label>
                <input type="number" name="level1QuestionCount" className="input-field" value={config.level1QuestionCount || 0} onChange={handleChange} min="1" />
              </div>
              <div>
                <label className="label">Points Per Question</label>
                <input type="number" name="level1PointsPerQuestion" className="input-field" value={config.level1PointsPerQuestion || 0} onChange={handleChange} min="1" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-400 border-b border-gray-700 pb-2">Level 2 (Exit Room)</h3>
              <div>
                <label className="label">Step Count</label>
                <input type="number" name="level2StepCount" className="input-field" value={config.level2StepCount || 0} onChange={handleChange} min="1" />
              </div>
              <div>
                <label className="label">Points Per Step</label>
                <input type="number" name="level2PointsPerStep" className="input-field" value={config.level2PointsPerStep || 0} onChange={handleChange} min="1" />
              </div>
              <div>
                <label className="label">Starting Lives</label>
                <input type="number" name="level2Lives" className="input-field" value={config.level2Lives || 0} onChange={handleChange} min="1" />
              </div>
            </div>

            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-semibold text-yellow-500 border-b border-gray-700 pb-2">Level 3 (Guess Output)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Question Count</label>
                  <input type="number" name="level3QuestionCount" className="input-field" value={config.level3QuestionCount || 0} onChange={handleChange} min="1" />
                </div>
                <div>
                  <label className="label">Points Per Question</label>
                  <input type="number" name="level3PointsPerQuestion" className="input-field" value={config.level3PointsPerQuestion || 0} onChange={handleChange} min="1" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-800">
            <button type="submit" disabled={saving} className="btn-primary w-full md:w-auto px-8">
              {saving ? 'Saving...' : 'Save Parameters'}
            </button>
            <p className="text-xs text-gray-500 mt-2">Note: Parameter changes only affect new sessions started after the change.</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompetitionSettings;
