import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock,
  TrendingUp,
  Zap 
} from 'lucide-react';

const AISystemCard = ({ system, onViewDetails, onTriggerUpdate }) => {
  const getStatusConfig = (status) => {
    const configs = {
      active: {
        icon: CheckCircle,
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        badgeVariant: 'default',
        label: 'Active',
      },
      processing: {
        icon: Activity,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        badgeVariant: 'secondary',
        label: 'Processing',
      },
      idle: {
        icon: Clock,
        color: 'text-gray-500',
        bgColor: 'bg-gray-50',
        badgeVariant: 'outline',
        label: 'Idle',
      },
      warning: {
        icon: AlertTriangle,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50',
        badgeVariant: 'warning',
        label: 'Warning',
      },
      error: {
        icon: XCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        badgeVariant: 'destructive',
        label: 'Error',
      },
    };
    
    return configs[status] || configs.idle;
  };
  
  const statusConfig = getStatusConfig(system.status);
  const StatusIcon = statusConfig.icon;
  
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className={`h-1 ${statusConfig.bgColor}`} />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
              <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900" data-testid={`ai-system-${system.id}-name`}>
                {system.name}
              </h3>
              <p className="text-sm text-gray-500">{system.description}</p>
            </div>
          </div>
          <Badge variant={statusConfig.badgeVariant} data-testid={`ai-system-${system.id}-status`}>
            {statusConfig.label}
          </Badge>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Success Rate */}
          <div className="space-y-1">
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Success Rate
            </div>
            <div className="text-lg font-semibold text-gray-900" data-testid={`ai-system-${system.id}-success-rate`}>
              {(system.successRate * 100).toFixed(1)}%
            </div>
          </div>

          {/* Queue Size */}
          <div className="space-y-1">
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Queue Size
            </div>
            <div className="text-lg font-semibold text-gray-900" data-testid={`ai-system-${system.id}-queue-size`}>
              {system.queueSize}
            </div>
          </div>

          {/* Predictions (if available) */}
          {system.predictions !== undefined && (
            <div className="space-y-1">
              <div className="text-xs text-gray-500">Total Predictions</div>
              <div className="text-lg font-semibold text-gray-900">
                {system.predictions.toLocaleString()}
              </div>
            </div>
          )}

          {/* Accuracy (if available) */}
          {system.accuracy !== undefined && (
            <div className="space-y-1">
              <div className="text-xs text-gray-500">Accuracy</div>
              <div className="text-lg font-semibold text-gray-900">
                {(system.accuracy * 100).toFixed(1)}%
              </div>
            </div>
          )}

          {/* Processing Time (if available) */}
          {system.avgProcessingTime !== undefined && (
            <div className="space-y-1">
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Avg. Time
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {system.avgProcessingTime.toFixed(2)}s
              </div>
            </div>
          )}
        </div>

        {/* Last Updated */}
        <div className="text-xs text-gray-400 mb-4">
          Last updated: {formatTime(system.lastUpdated)}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails(system)}
            data-testid={`ai-system-${system.id}-view-details-btn`}
          >
            View Details
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onTriggerUpdate(system.id)}
            disabled={system.status === 'processing'}
            data-testid={`ai-system-${system.id}-trigger-update-btn`}
          >
            <Activity className="h-4 w-4 mr-1" />
            Update
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AISystemCard;
