import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';

const ContributionImpactChart = ({ impactHistory, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading impact data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!impactHistory || impactHistory.length === 0) {
    return (
      <Card>
        <CardContent className="py-20 text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No contribution history available yet.</p>
          <p className="text-sm text-gray-500 mt-2">Start engaging to see your impact!</p>
        </CardContent>
      </Card>
    );
  }

  // Format data for chart
  const chartData = impactHistory.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    points: item.points,
    type: item.type,
    fullDate: item.date
  }));

  // Calculate statistics
  const totalPoints = impactHistory.reduce((sum, item) => sum + item.points, 0);
  const avgPoints = Math.round(totalPoints / impactHistory.length);
  const maxPoints = Math.max(...impactHistory.map(item => item.points));
  const peakDay = impactHistory.find(item => item.points === maxPoints);

  // Count by type
  const typeCounts = impactHistory.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});

  const typeColors = {
    mentorship: '#8b5cf6',
    forum: '#3b82f6',
    event: '#10b981',
    job_application: '#f59e0b',
    profile: '#ec4899'
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-indigo-200">
          <p className="font-semibold text-gray-900 mb-1">{payload[0].payload.date}</p>
          <p className="text-indigo-600 font-bold text-lg">+{payload[0].value} points</p>
          <p className="text-sm text-gray-600 capitalize mt-1">
            Type: {payload[0].payload.type.replace('_', ' ')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-2 border-indigo-100" data-testid="contribution-impact-chart">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          Contribution Impact Over Time
        </CardTitle>
        <CardDescription>Track your engagement activity and identify peak periods</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <p className="text-xs text-gray-600 mb-1">Total Points</p>
            <p className="text-2xl font-bold text-purple-600">{totalPoints}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
            <p className="text-xs text-gray-600 mb-1">Average</p>
            <p className="text-2xl font-bold text-blue-600">{avgPoints}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <p className="text-xs text-gray-600 mb-1">Peak Day</p>
            <p className="text-2xl font-bold text-green-600">{maxPoints}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200">
            <p className="text-xs text-gray-600 mb-1">Activities</p>
            <p className="text-2xl font-bold text-orange-600">{impactHistory.length}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="points" 
                stroke="#6366f1" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorPoints)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* AI Insights */}
        {peakDay && (
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 mb-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 mb-1">Peak Activity Identified</p>
                <p className="text-sm text-gray-600">
                  Your highest impact was on{' '}
                  <span className="font-semibold">
                    {new Date(peakDay.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                  </span>
                  {' '}with <span className="font-bold text-indigo-600">{peakDay.points} points</span> from{' '}
                  <span className="capitalize">{peakDay.type.replace('_', ' ')}</span> activities.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contribution Types Breakdown */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-gray-600" />
            <p className="font-semibold text-sm">Contribution Types Distribution</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(typeCounts).map(([type, count]) => (
              <Badge 
                key={type} 
                variant="outline"
                className="capitalize"
                style={{ 
                  borderColor: typeColors[type] || '#6b7280',
                  color: typeColors[type] || '#6b7280'
                }}
              >
                <div 
                  className="w-2 h-2 rounded-full mr-2" 
                  style={{ backgroundColor: typeColors[type] || '#6b7280' }}
                />
                {type.replace('_', ' ')}: {count}
              </Badge>
            ))}
          </div>
        </div>

        {/* Recommendation */}
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">💡 AI Recommendation:</span> Based on your activity pattern, 
            focus on your most effective contribution type:{' '}
            <span className="font-bold capitalize">
              {Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0].replace('_', ' ')}
            </span>
            {' '}to maximize your engagement score.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContributionImpactChart;
