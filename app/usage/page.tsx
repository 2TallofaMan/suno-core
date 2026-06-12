'use client';

import { useState, useEffect } from 'react';
import {
  getUsageStats,
  clearUsageData,
  fetchReplicateUsage,
  formatCurrency,
  estimateReplicateCreditsUsed,
} from '../../lib/usageTracker';

interface UsageStats {
  totalCost: number;
  todayCost: number;
  thisWeekCost: number;
  thisMonthCost: number;
  totalGenerations: number;
  breakdown: {
    music: { count: number; cost: number };
    vocals: { count: number; cost: number };
    stems: { count: number; cost: number };
    trim: { count: number; cost: number };
  };
  recent: any[];
}

export default function UsagePage() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [replicateStats, setReplicateStats] = useState<{
    remainingCredits: number;
    totalCost: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replicateApiKey, setReplicateApiKey] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const loadStats = () => {
      setStats(getUsageStats());
      setLoading(false);
    };
    
    loadStats();
    
    // Refresh every 5 seconds
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleFetchReplicateStats = async () => {
    if (!replicateApiKey) {
      setError('Please enter your Replicate API key');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchReplicateUsage(replicateApiKey);
      if (result) {
        setReplicateStats(result);
      } else {
        setError('Could not fetch Replicate usage (API not available yet)');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch Replicate usage');
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = () => {
    clearUsageData();
    setStats(getUsageStats());
    setShowClearConfirm(false);
  };

  if (loading && !stats) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">Loading usage data...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Usage Statistics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your API usage and costs
          </p>
        </header>

        {/* Replicate API Stats */}
        <div className="card mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Replicate API</h2>
            <button
              onClick={() => setShowClearConfirm(!showClearConfirm)}
              className="text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Clear Local Data
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Replicate API Key (for live usage data)
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={replicateApiKey}
                onChange={(e) => setReplicateApiKey(e.target.value)}
                placeholder="Enter your Replicate API key"
                className="flex-1 input"
              />
              <button
                onClick={handleFetchReplicateStats}
                disabled={loading || !replicateApiKey}
                className="btn btn-primary px-4"
              >
                {loading ? 'Loading...' : 'Fetch Live Data'}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Note: Replicate doesn't have a public usage API yet. This will be enabled when available.
            </p>
          </div>

          {replicateStats && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Remaining Credits
                </label>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {replicateStats.remainingCredits?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Estimated Total Cost
                </label>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(replicateStats.totalCost || 0)}
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        {/* Internal Tracking Stats */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-6">Internal Tracking (Local)</h2>
          
          {stats ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Total Cost
                  </label>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats.totalCost)}
                  </p>
                </div>
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Today
                  </label>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats.todayCost)}
                  </p>
                </div>
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    This Week
                  </label>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats.thisWeekCost)}
                  </p>
                </div>
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    This Month
                  </label>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats.thisMonthCost)}
                  </p>
                </div>
              </div>

              {/* Breakdown */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Breakdown by Type</h3>
                <div className="space-y-3">
                  {Object.entries(stats.breakdown).map(([type, data]) => (
                    <div
                      key={type}
                      className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <span className="font-medium capitalize">{type}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                          ({data.count} generations)
                        </span>
                      </div>
                      <span className="font-medium">{formatCurrency(data.cost)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
                {stats.recent.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No recent activity yet
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {stats.recent.map((record: any) => (
                      <div
                        key={record.id}
                        className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm"
                      >
                        <div>
                          <span className="font-medium capitalize">{record.type}</span>
                          {record.prompt && (
                            <span className="text-gray-500 dark:text-gray-400 ml-2">
                              - {record.prompt.substring(0, 40)}...
                            </span>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(record.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <span className="font-medium">
                          {formatCurrency(record.costEstimate)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Estimate */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Estimated Replicate Credits Used: <strong>{estimateReplicateCreditsUsed()}</strong>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Based on internal tracking. Actual Replicate usage may vary slightly.
                </p>
              </div>
            </>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No usage data yet. Start generating music to see your stats!
            </p>
          )}
        </div>

        {/* Clear Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4">Clear Usage Data?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This will delete all locally tracked usage data. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearData}
                  className="btn btn-danger flex-1"
                >
                  Clear Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add link to usage page in nav */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          Tip: Add a link to this page in your navigation menu
        </p>
      </div>
    </main>
  );
}
