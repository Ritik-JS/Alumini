import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

const ApplicationStatusBadge = ({ status }) => {
  const statusConfig = {
    pending: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      icon: Clock,
    },
    reviewed: {
      label: 'Reviewed',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      icon: Eye,
    },
    shortlisted: {
      label: 'Shortlisted',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      icon: CheckCircle,
    },
    rejected: {
      label: 'Rejected',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      icon: XCircle,
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} flex items-center gap-1`} data-testid={`status-badge-${status}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};

export default ApplicationStatusBadge;
