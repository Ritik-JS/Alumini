import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

const CareerTimeline = ({ currentRole, predictions }) => {
  const sortedPredictions = [...predictions].sort((a, b) => {
    const getMonths = (timeframe) => {
      const match = timeframe.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    };
    return getMonths(a.timeframe) - getMonths(b.timeframe);
  });

  const timelineItems = [
    {
      title: currentRole,
      status: 'current',
      timeframe: 'Now',
      icon: CheckCircle2,
      color: 'green'
    },
    ...sortedPredictions.slice(0, 3).map((pred, idx) => ({
      title: pred.role_name,
      status: 'predicted',
      timeframe: pred.timeframe,
      probability: pred.probability,
      icon: idx === 0 ? Clock : Circle,
      color: idx === 0 ? 'blue' : 'gray'
    }))
  ];

  return (
    <Card data-testid="career-timeline">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-6">Career Growth Timeline</h3>
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-green-500 via-blue-500 to-gray-300" />
          
          {/* Timeline Items */}
          <div className="space-y-8">
            {timelineItems.map((item, idx) => {
              const Icon = item.icon;
              const colorClasses = {
                green: 'bg-green-500 text-white',
                blue: 'bg-blue-500 text-white',
                gray: 'bg-gray-300 text-gray-600'
              };
              
              return (
                <div key={idx} className="relative flex items-start gap-4" data-testid={`timeline-item-${idx}`}>
                  {/* Icon */}
                  <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${colorClasses[item.color]} shadow-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-lg">{item.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.status === 'current' ? 'Current Position' : `Target in ${item.timeframe}`}
                        </p>
                      </div>
                      <div className="text-right">
                        {item.status === 'current' ? (
                          <Badge className="bg-green-100 text-green-800">Current</Badge>
                        ) : (
                          <Badge variant="secondary">{item.probability}% match</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CareerTimeline;
