import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Clock, DollarSign, Users, Target, ChevronRight } from 'lucide-react';

const PredictionCard = ({ prediction, onClick }) => {
  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Card 
      className="hover:shadow-lg transition-all cursor-pointer border-l-4" 
      style={{ borderLeftColor: `hsl(${prediction.probability * 1.2}, 70%, 50%)` }}
      onClick={onClick}
      data-testid={`prediction-card-${prediction.role_name.replace(/\s/g, '-').toLowerCase()}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              {prediction.role_name}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge className={getConfidenceColor(prediction.confidence)} variant="outline">
                {prediction.confidence} confidence
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {prediction.timeframe}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {prediction.probability}%
            </div>
            <div className="text-xs text-gray-500">Match</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Probability Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Probability Score</span>
            <span className="font-semibold">{prediction.probability}%</span>
          </div>
          <Progress value={prediction.probability} className="h-2" />
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <div className="text-xs text-gray-600">Salary</div>
            <div className="text-xs font-semibold mt-1">{prediction.salary_range.split(' - ')[0]}</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <Users className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <div className="text-xs text-gray-600">Alumni</div>
            <div className="text-xs font-semibold mt-1">{prediction.similar_alumni_count}</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-purple-600" />
            <div className="text-xs text-gray-600">Success</div>
            <div className="text-xs font-semibold mt-1">{prediction.transition_success_rate}%</div>
          </div>
        </div>

        {/* Skills Gap */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Skills Gap</span>
            <Badge variant="outline" className="text-xs">
              {prediction.skills_gap.length} skills needed
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1">
            {prediction.skills_gap.slice(0, 4).map((skill, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {prediction.skills_gap.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{prediction.skills_gap.length - 4} more
              </Badge>
            )}
          </div>
        </div>

        {/* View Details Button */}
        <Button className="w-full" variant="outline" data-testid="view-details-button">
          View Learning Path
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default PredictionCard;
