import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, Target } from 'lucide-react';

const SkillGapIndicator = ({ skillsMatch, skillsGap, skillImportance = {} }) => {
  const totalSkills = skillsMatch.length + skillsGap.length;
  const matchPercentage = Math.round((skillsMatch.length / totalSkills) * 100);

  const getImportanceColor = (importance) => {
    switch (importance) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Card data-testid="skill-gap-indicator">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Skills Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Match */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold">Overall Skills Match</span>
            <span className="text-2xl font-bold text-blue-600">{matchPercentage}%</span>
          </div>
          <Progress value={matchPercentage} className="h-3" />
          <p className="text-xs text-gray-500 mt-2">
            You have {skillsMatch.length} out of {totalSkills} required skills
          </p>
        </div>

        {/* Skills You Have */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Skills You Have ({skillsMatch.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {skillsMatch.map((skill, idx) => (
              <Badge key={idx} className="bg-green-100 text-green-800" variant="outline">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Skills Gap */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-orange-700">
            <AlertCircle className="h-4 w-4" />
            Skills to Learn ({skillsGap.length})
          </h4>
          <div className="space-y-2">
            {skillsGap.map((skill, idx) => {
              const importance = skillImportance[skill] || 'medium';
              return (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium">{skill}</span>
                  <Badge className={getImportanceColor(importance)} variant="outline">
                    {importance}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="pt-4 border-t">
          <p className="text-xs font-semibold mb-2">Priority Levels:</p>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-red-100 text-red-800" variant="outline">Critical</Badge>
            <Badge className="bg-orange-100 text-orange-800" variant="outline">High</Badge>
            <Badge className="bg-yellow-100 text-yellow-800" variant="outline">Medium</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillGapIndicator;
