import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Clock, Target, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const PredictionCard = ({ prediction, onClick }) => {
  const probabilityPercent = Math.round(prediction.probability * 100);
  const skillMatchPercent = prediction.skill_match_percentage || 50;

  // Determine confidence level color
  const getConfidenceColor = (probability) => {
    if (probability >= 0.7) return 'text-green-600 bg-green-50 border-green-200';
    if (probability >= 0.5) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  };

  // Determine badge variant
  const getBadgeVariant = (probability) => {
    if (probability >= 0.7) return 'success';
    if (probability >= 0.5) return 'default';
    return 'secondary';
  };

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer group relative overflow-hidden"
      onClick={onClick}
      data-testid="prediction-card"
    >
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl font-bold group-hover:text-blue-600 transition-colors">
            {prediction.role_name}
          </CardTitle>
          <Badge
            variant={getBadgeVariant(prediction.probability)}
            className="shrink-0 ml-2"
          >
            {probabilityPercent}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Probability Bar */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Match Probability
            </span>
            <span className="font-semibold">{probabilityPercent}%</span>
          </div>
          <Progress value={probabilityPercent} className="h-2" />
        </div>

        {/* Skill Match */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 flex items-center gap-1">
              <Target className="h-3 w-3" />
              Skills Match
            </span>
            <span className="font-semibold">{skillMatchPercent}%</span>
          </div>
          <Progress value={skillMatchPercent} className="h-2" />
        </div>

        {/* Timeframe */}
        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Timeframe</span>
          </div>
          <span className="font-medium">
            {prediction.timeframe_months} months
          </span>
        </div>

        {/* Similar Alumni */}
        {prediction.similar_alumni_count > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-4 w-4" />
              <span>Alumni in role</span>
            </div>
            <span className="font-medium">{prediction.similar_alumni_count}</span>
          </div>
        )}

        {/* Skills Gap Preview */}
        {prediction.skills_gap && prediction.skills_gap.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs text-gray-600 mb-2">Top Skills Needed:</p>
            <div className="flex flex-wrap gap-1">
              {prediction.skills_gap.slice(0, 3).map((skill, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {prediction.skills_gap.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{prediction.skills_gap.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* View Details Button */}
        <Button
          className="w-full mt-2 group-hover:bg-blue-600 transition-colors"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};

export default PredictionCard;
