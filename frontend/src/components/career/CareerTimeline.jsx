import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, MapPin, Flag } from 'lucide-react';

const CareerTimeline = ({ currentRole, predictions }) => {
  // Sort predictions by probability
  const sortedPredictions = [...predictions]
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3); // Top 3 predictions

  return (
    <Card className="h-full" data-testid="career-timeline">
      <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-purple-600" />
          Career Trajectory
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400" />

          {/* Current Position */}
          <div className="relative flex items-start gap-4 mb-8">
            <div className="relative z-10 flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <MapPin className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg">{currentRole}</h3>
                <Badge variant="default">Current</Badge>
              </div>
              <p className="text-sm text-gray-600">Your current position</p>
            </div>
          </div>

          {/* Predicted Roles */}
          {sortedPredictions.map((pred, index) => {
            const monthsFromNow = pred.timeframe_months || 24;
            const yearsFromNow = Math.floor(monthsFromNow / 12);
            const remainingMonths = monthsFromNow % 12;
            
            const timeLabel = yearsFromNow > 0
              ? `${yearsFromNow}y ${remainingMonths > 0 ? remainingMonths + 'm' : ''}`
              : `${remainingMonths}m`;

            const isLast = index === sortedPredictions.length - 1;

            return (
              <div key={index} className="relative flex items-start gap-4 mb-8">
                {/* Timeline Node */}
                <div className="relative z-10 flex-shrink-0">
                  {isLast ? (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <Flag className="h-6 w-6 text-white" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <ArrowRight className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-lg">{pred.role_name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(pred.probability * 100)}% match
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                    <span className="flex items-center gap-1">
                      <span className="font-medium">~{timeLabel}</span>
                    </span>
                    {pred.skill_match_percentage && (
                      <span className="text-xs">
                        • {Math.round(pred.skill_match_percentage)}% skills ready
                      </span>
                    )}
                  </div>
                  
                  {/* Skills Preview */}
                  {pred.skills_gap && pred.skills_gap.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {pred.skills_gap.slice(0, 4).map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-white">
                          {skill}
                        </Badge>
                      ))}
                      {pred.skills_gap.length > 4 && (
                        <Badge variant="outline" className="text-xs bg-white">
                          +{pred.skills_gap.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-gray-500 text-center">
            Timeline based on historical data and career transition patterns
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CareerTimeline;
