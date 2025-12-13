import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  BookOpen,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

const PredictionDetailsModal = ({ open, onClose, prediction, userId }) => {
  if (!prediction) return null;

  const probabilityPercent = Math.round(prediction.probability * 100);
  const skillMatchPercent = prediction.skill_match_percentage || 50;
  const successRate = Math.round((prediction.success_rate || 0.7) * 100);

  // Categorize skills by importance
  const criticalSkills = prediction.skills_gap?.filter(
    (skill) => prediction.skill_importance?.[skill] === 'critical'
  ) || [];
  const highSkills = prediction.skills_gap?.filter(
    (skill) => prediction.skill_importance?.[skill] === 'high'
  ) || [];
  const mediumSkills = prediction.skills_gap?.filter(
    (skill) => prediction.skill_importance?.[skill] === 'medium'
  ) || [];

  const getImportanceColor = (importance) => {
    switch (importance) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            {prediction.role_name}
          </DialogTitle>
          <DialogDescription>
            Detailed career path analysis and recommendations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-3xl font-bold text-blue-600">
                    {probabilityPercent}%
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Match Probability</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-3xl font-bold text-purple-600">
                    {prediction.timeframe_months}m
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Est. Timeframe</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-3xl font-bold text-green-600">
                    {successRate}%
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Success Rate</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skills Readiness */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Skills Readiness
                </h3>
                <Badge variant="secondary">{skillMatchPercent}% Ready</Badge>
              </div>
              <Progress value={skillMatchPercent} className="h-3 mb-2" />
              <p className="text-sm text-gray-600">
                You have {skillMatchPercent}% of the skills needed for this role
              </p>
            </CardContent>
          </Card>

          {/* Skills Gap Analysis */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Skills Gap Analysis
              </h3>

              {/* Critical Skills */}
              {criticalSkills.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Critical Priority
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {criticalSkills.map((skill, idx) => (
                      <Badge
                        key={idx}
                        className={getImportanceColor('critical')}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* High Priority Skills */}
              {highSkills.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-orange-700 mb-2 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    High Priority
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {highSkills.map((skill, idx) => (
                      <Badge key={idx} className={getImportanceColor('high')}>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Medium Priority Skills */}
              {mediumSkills.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-yellow-700 mb-2 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    Medium Priority
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {mediumSkills.map((skill, idx) => (
                      <Badge key={idx} className={getImportanceColor('medium')}>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {prediction.skills_gap?.length === 0 && (
                <p className="text-sm text-gray-600 text-center py-4">
                  Great! You already have most of the required skills.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Alumni Insights */}
          {prediction.similar_alumni_count > 0 && (
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Alumni Success Stories
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  <span className="font-bold text-lg text-blue-600">
                    {prediction.similar_alumni_count}
                  </span>{' '}
                  alumni have successfully transitioned to {prediction.role_name}
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => (window.location.href = '/directory')}
                >
                  Connect with Alumni
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Learning Resources */}
          <Card className="bg-gradient-to-br from-green-50 to-teal-50">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                Recommended Learning Path
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                Start building the skills you need for this career transition
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => (window.location.href = '/knowledge')}
              >
                Browse Learning Resources
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => (window.location.href = '/profile')}>
              Update My Skills
            </Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PredictionDetailsModal;
