import { useState, useEffect } from 'react';
import { Brain, TrendingUp, Users, Target, AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import apiCareerDataService from '@/services/apiCareerDataService';

const MLDataStatusWidget = ({ onUploadClick }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await apiCareerDataService.getCareerDataStats();
      setStats(response.data);
    } catch (error) {
      if (!silent) {
        toast.error('Failed to load ML data statistics');
      }
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      setRefreshing(true);
      fetchStats(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats(true);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <div className="flex items-center text-red-800">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>Failed to load ML data statistics</span>
        </div>
      </Card>
    );
  }

  const { 
    total_transitions, 
    ml_ready, 
    progress_percentage, 
    ml_target,
    remaining_needed,
    unique_from_roles,
    unique_to_roles,
    contributing_alumni,
    recent_additions,
    top_transitions
  } = stats;

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50" data-testid="ml-data-status-widget">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg mr-3">
            <Brain className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              ML Training Data Status
            </h3>
            <p className="text-sm text-gray-600">
              Career prediction model readiness
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`text-gray-500 hover:text-gray-700 ${refreshing ? 'animate-spin' : ''}`}
          data-testid="refresh-stats-btn"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        {ml_ready ? (
          <div className="flex items-center px-3 py-2 bg-green-100 border border-green-300 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800">
              ✅ Ready for ML Training!
            </span>
          </div>
        ) : (
          <div className="flex items-center px-3 py-2 bg-yellow-100 border border-yellow-300 rounded-lg">
            <Target className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-sm font-medium text-yellow-800">
              {remaining_needed} more transition{remaining_needed !== 1 ? 's' : ''} needed
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress to ML Training</span>
          <span className="text-sm font-semibold text-purple-600" data-testid="progress-text">
            {total_transitions} / {ml_target}
          </span>
        </div>
        <Progress 
          value={progress_percentage} 
          className="h-3"
          data-testid="ml-progress-bar"
        />
        <p className="text-xs text-gray-500 mt-1">
          {progress_percentage.toFixed(1)}% complete
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Transitions</p>
              <p className="text-2xl font-bold text-gray-900" data-testid="total-transitions">
                {total_transitions}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Contributors</p>
              <p className="text-2xl font-bold text-gray-900" data-testid="contributing-alumni">
                {contributing_alumni}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Unique Roles</p>
              <p className="text-2xl font-bold text-gray-900">
                {unique_from_roles + unique_to_roles}
              </p>
            </div>
            <div className="text-xs text-gray-400">
              {unique_from_roles} → {unique_to_roles}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {recent_additions}
              </p>
            </div>
            <div className={`text-xs px-2 py-1 rounded ${
              recent_additions > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              +{recent_additions}
            </div>
          </div>
        </div>
      </div>

      {/* Top Transitions */}
      {top_transitions && top_transitions.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Transitions</h4>
          <div className="space-y-2">
            {top_transitions.slice(0, 3).map((transition, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-gray-700 truncate flex-1">
                  {transition.from_role} → {transition.to_role}
                </span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                  {transition.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
      <Button
        onClick={onUploadClick}
        variant={ml_ready ? 'default' : 'outline'}
        className="w-full"
        data-testid="upload-career-data-btn"
      >
        <Upload className="h-4 w-4 mr-2" />
        {ml_ready ? 'Upload More Data' : 'Upload Career Data'}
      </Button>

      {/* ML Ready Actions */}
      {ml_ready && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-800 mb-2">
            🎉 You have sufficient data to train the ML model!
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-green-300 text-green-700 hover:bg-green-100"
            onClick={() => toast.info('Training feature coming soon')}
          >
            🤖 Train ML Model Now
          </Button>
        </div>
      )}
    </Card>
  );
};

export default MLDataStatusWidget;
