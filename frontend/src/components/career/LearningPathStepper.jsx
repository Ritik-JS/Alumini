import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Clock, BookOpen, ExternalLink } from 'lucide-react';

const LearningPathStepper = ({ learningPath }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const totalTime = learningPath.reduce((acc, step) => {
    const weeks = parseInt(step.estimated_time.match(/\d+/)?.[0] || 0);
    return acc + weeks;
  }, 0);

  return (
    <Card data-testid="learning-path-stepper">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Step-by-Step Learning Path
          </span>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {totalTime} weeks total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6">
          {/* Timeline Line */}
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-500 to-blue-200" />
          
          {learningPath.map((step, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === learningPath.length - 1;
            
            return (
              <div key={step.step} className="relative" data-testid={`learning-step-${step.step}`}>
                <div className="flex gap-4">
                  {/* Step Number */}
                  <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${
                    isFirst ? 'bg-blue-600 text-white' : 'bg-white border-2 border-blue-600 text-blue-600'
                  } font-bold shadow-md`}>
                    {step.step}
                  </div>
                  
                  {/* Step Content */}
                  <div className="flex-1 pb-6">
                    <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{step.skill}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {step.estimated_time}
                            </Badge>
                            <Badge className={`${getPriorityColor(step.priority)} text-xs`} variant="outline">
                              {step.priority} priority
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {/* Resources */}
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Recommended Resources:</p>
                        <div className="space-y-1">
                          {step.resources.map((resource, ridx) => (
                            <div key={ridx} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                              <ExternalLink className="h-3 w-3" />
                              <span>{resource}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Total Learning Time:</strong> {totalTime} weeks ({Math.round(totalTime / 4)} months)
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Following this structured path will help you acquire all necessary skills efficiently.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LearningPathStepper;
