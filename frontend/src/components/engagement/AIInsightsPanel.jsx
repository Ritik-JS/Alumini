import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Brain, 
  Clock,
  Target,
  Users,
  Calendar,
  Lightbulb
} from 'lucide-react';

const AIInsightsPanel = ({ insights, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading AI insights...</p>
        </CardContent>
      </Card>
    );
  }

  if (!insights) return null;

  const engagement_prediction = insights.engagement_prediction || {};
  const activity_patterns = insights.activity_patterns || {};
  const comparison_with_similar_users = insights.comparison_with_similar_users || {};

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-6 w-6 text-green-600" />;
      case 'decreasing':
        return <TrendingDown className="h-6 w-6 text-red-600" />;
      default:
        return <Minus className="h-6 w-6 text-blue-600" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'increasing':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'decreasing':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-6" data-testid="ai-insights-panel">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
          <Brain className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">AI Engagement Insights</h2>
          <p className="text-gray-600">Personalized recommendations powered by AI</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Engagement Prediction */}
        {engagement_prediction.predicted_trend && (
          <Card className="border-2 border-purple-100" data-testid="engagement-prediction">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Engagement Prediction
              </CardTitle>
              <CardDescription>Your predicted engagement trend</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Trend Status */}
              <div className={`p-4 rounded-lg border-2 flex items-center justify-between ${getTrendColor(engagement_prediction.predicted_trend)}`}>
                <div>
                  <p className="text-sm font-medium">Predicted Trend</p>
                  <p className="text-2xl font-bold capitalize mt-1">{engagement_prediction.predicted_trend}</p>
                </div>
                {getTrendIcon(engagement_prediction.predicted_trend)}
              </div>

              {/* Confidence */}
              {engagement_prediction.confidence !== undefined && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">AI Confidence</span>
                    <span className="font-semibold">{Math.round((engagement_prediction.confidence || 0) * 100)}%</span>
                  </div>
                  <Progress value={(engagement_prediction.confidence || 0) * 100} className="h-3" />
                </div>
              )}

              {/* Predictions */}
              <div className="space-y-3 pt-2">
                {engagement_prediction.predicted_score_7days !== undefined && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">7 days</span>
                    </div>
                    <span className="font-bold text-lg text-purple-600">
                      {engagement_prediction.predicted_score_7days || 0} pts
                    </span>
                  </div>
                )}
                {engagement_prediction.predicted_score_30days !== undefined && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">30 days</span>
                    </div>
                    <span className="font-bold text-lg text-purple-600">
                      {engagement_prediction.predicted_score_30days || 0} pts
                    </span>
                  </div>
                )}
              </div>

              {/* Opportunities */}
              {engagement_prediction.opportunities && engagement_prediction.opportunities.length > 0 && (
                <div className="pt-2">
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-600" />
                    Opportunities
                  </p>
                  <div className="space-y-1">
                    {engagement_prediction.opportunities.map((opp, idx) => (
                      <Badge key={idx} variant="secondary" className="mr-1">
                        {opp}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Activity Patterns */}
        {(activity_patterns.best_posting_times?.length > 0 || activity_patterns.most_effective_contributions?.length > 0) && (
          <Card className="border-2 border-blue-100" data-testid="activity-patterns">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Activity Pattern Analysis
              </CardTitle>
              <CardDescription>When and how to maximize engagement</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Best Posting Times */}
              {activity_patterns.best_posting_times && activity_patterns.best_posting_times.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-3">Best Times to Post</p>
                  <div className="space-y-2">
                    {activity_patterns.best_posting_times.slice(0, 3).map((time, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-semibold">{time.day}s</p>
                          <p className="text-xs text-gray-600">Around {time.hour}:00</p>
                        </div>
                        <Badge variant="default" className="bg-blue-600">
                          +{Math.round((time.engagement_boost - 1) * 100)}% boost
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Most Effective Contributions */}
              {activity_patterns.most_effective_contributions && activity_patterns.most_effective_contributions.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-3">Most Effective Contributions</p>
                  <div className="space-y-2">
                    {activity_patterns.most_effective_contributions.map((contrib, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold capitalize">{contrib.type.replace('_', ' ')}</p>
                          <p className="text-xs text-gray-600">Avg. {contrib.avg_points} pts</p>
                        </div>
                        <Badge 
                          variant={contrib.effectiveness === 'high' ? 'default' : 'secondary'}
                          className={contrib.effectiveness === 'high' ? 'bg-green-600' : ''}
                        >
                          {contrib.effectiveness}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {(!activity_patterns.best_posting_times || activity_patterns.best_posting_times.length === 0) &&
               (!activity_patterns.most_effective_contributions || activity_patterns.most_effective_contributions.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <p>Start engaging to see your activity patterns!</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Comparison with Similar Users */}
        {comparison_with_similar_users.percentile !== undefined && (
          <Card className="border-2 border-green-100 md:col-span-2" data-testid="user-comparison">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Comparison with Similar Users
              </CardTitle>
              <CardDescription>How you compare to alumni in similar roles</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Percentile */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white mb-3">
                    <div>
                      <p className="text-3xl font-bold">{comparison_with_similar_users.percentile || 0}</p>
                      <p className="text-xs">percentile</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Your Ranking</p>
                </div>

                {/* Your Advantage */}
                <div className="space-y-3">
                  {comparison_with_similar_users.your_advantage && (
                    <div>
                      <p className="font-semibold text-sm text-gray-700 mb-2">Your Advantage</p>
                      <Badge variant="default" className="bg-green-600">
                        {comparison_with_similar_users.your_advantage}
                      </Badge>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">
                      Avg. score of similar users: 
                      <span className="font-bold ml-1">{comparison_with_similar_users.avg_score_similar_users || 0}</span>
                    </p>
                  </div>
                </div>

                {/* Improvement Areas */}
                <div>
                  <p className="font-semibold text-sm text-gray-700 mb-2">Areas to Improve</p>
                  <div className="space-y-1">
                    {comparison_with_similar_users.improvement_areas ? (
                      Array.isArray(comparison_with_similar_users.improvement_areas) 
                        ? comparison_with_similar_users.improvement_areas.map((area, idx) => (
                            <Badge key={idx} variant="outline" className="mr-1 mb-1">
                              {area}
                            </Badge>
                          ))
                        : <Badge variant="outline">{comparison_with_similar_users.improvement_areas}</Badge>
                    ) : (
                      <Badge variant="outline">Keep engaging!</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AIInsightsPanel;
