import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const stages = [
  { id: 'validating', label: 'Validating', description: 'Checking data integrity' },
  { id: 'cleaning', label: 'Cleaning', description: 'Processing and cleaning data' },
  { id: 'ai_processing', label: 'AI Processing', description: 'Running AI analysis' },
  { id: 'storing', label: 'Storing', description: 'Saving to database' },
];

const ProgressTracker = ({ currentStage, progress, stats }) => {
  const getCurrentStageIndex = () => {
    return stages.findIndex(s => s.id === currentStage);
  };

  const isStageComplete = (stageId) => {
    const currentIndex = getCurrentStageIndex();
    const stageIndex = stages.findIndex(s => s.id === stageId);
    return stageIndex < currentIndex || (stageIndex === currentIndex && progress === 100);
  };

  const isStageActive = (stageId) => {
    return stageId === currentStage;
  };

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const estimateTimeRemaining = () => {
    if (!stats?.processingTime || progress === 0) return null;
    const timePerPercent = stats.processingTime / progress;
    const remainingPercent = 100 - progress;
    const estimatedSeconds = Math.ceil(timePerPercent * remainingPercent);
    return formatTime(estimatedSeconds);
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Overall Progress</h3>
              <p className="text-sm text-gray-500 mt-1">
                Processing your dataset...
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{progress}%</p>
              {estimateTimeRemaining() && (
                <p className="text-xs text-gray-500 mt-1">
                  ~{estimateTimeRemaining()} remaining
                </p>
              )}
            </div>
          </div>
          <Progress value={progress} className="h-3" />
        </div>
      </Card>

      {/* Processing Stages */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6">Processing Stages</h3>
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const isComplete = isStageComplete(stage.id);
            const isActive = isStageActive(stage.id);

            return (
              <div key={stage.id} className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  {isComplete ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : isActive ? (
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  ) : (
                    <Circle className="h-6 w-6 text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={cn(
                        'font-medium',
                        isComplete && 'text-green-600',
                        isActive && 'text-primary',
                        !isComplete && !isActive && 'text-gray-400'
                      )}>
                        {stage.label}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {stage.description}
                      </p>
                    </div>
                    {isActive && (
                      <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                        In Progress
                      </span>
                    )}
                    {isComplete && (
                      <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-600 rounded-full">
                        Complete
                      </span>
                    )}
                  </div>
                  {index < stages.length - 1 && (
                    <div className={cn(
                      'h-8 w-0.5 ml-3 mt-2',
                      isComplete ? 'bg-green-500' : 'bg-gray-200'
                    )} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Stats */}
      {stats && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Processing Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Rows</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.totalRows?.toLocaleString() || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Processed</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {stats.processedRows?.toLocaleString() || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Valid</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.validRows?.toLocaleString() || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Errors</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {stats.errorRows?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProgressTracker;
