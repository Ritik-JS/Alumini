import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  ArrowRight, 
  Clock, 
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';

const SmartSuggestionsCard = ({ suggestions, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading smart suggestions...</p>
        </CardContent>
      </Card>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card>
        <CardContent className="py-20 text-center">
          <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No suggestions available at the moment.</p>
        </CardContent>
      </Card>
    );
  }

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getImpactIcon = (impact) => {
    switch (impact) {
      case 'high':
        return <Zap className="h-5 w-5" />;
      case 'medium':
        return <Target className="h-5 w-5" />;
      default:
        return <TrendingUp className="h-5 w-5" />;
    }
  };

  return (
    <Card className="border-2 border-orange-100" data-testid="smart-suggestions-card">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-orange-600" />
          Smart Suggestions
        </CardTitle>
        <CardDescription>AI-powered actions to boost your engagement score</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {suggestions.map((suggestion, idx) => (
            <div
              key={suggestion.id}
              className="relative p-5 rounded-lg border-2 border-gray-200 hover:border-orange-300 transition-all hover:shadow-md group"
              data-testid={`suggestion-${suggestion.id}`}
            >
              {/* Priority Badge */}
              <div className="absolute top-3 right-3">
                <Badge variant="outline" className="text-xs">
                  Priority #{suggestion.priority}
                </Badge>
              </div>

              {/* Impact Badge */}
              <div className="flex items-center gap-2 mb-3">
                <Badge className={`${getImpactColor(suggestion.impact)} border flex items-center gap-1`}>
                  {getImpactIcon(suggestion.impact)}
                  <span className="capitalize">{suggestion.impact} Impact</span>
                </Badge>
              </div>

              {/* Action */}
              <h3 className="font-bold text-lg mb-2 pr-20">{suggestion.action}</h3>
              
              {/* Reason */}
              <p className="text-sm text-gray-600 mb-4">{suggestion.reason}</p>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-full">
                    <TrendingUp className="h-4 w-4 text-green-700" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Estimated Points</p>
                    <p className="font-bold text-green-700">+{suggestion.estimated_points}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Clock className="h-4 w-4 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Time Investment</p>
                    <p className="font-bold text-blue-700">{suggestion.time_investment}</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button 
                className="w-full group-hover:bg-orange-600 transition-colors"
                variant="default"
              >
                Take Action
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <Sparkles className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 mb-1">Potential Score Boost</p>
              <p className="text-sm text-gray-600">
                Complete all suggestions to earn up to{' '}
                <span className="font-bold text-orange-600">
                  +{suggestions.reduce((sum, s) => sum + s.estimated_points, 0)} points
                </span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartSuggestionsCard;
