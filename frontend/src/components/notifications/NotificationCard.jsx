import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle,
  Users,
  Briefcase,
  Target,
  Calendar,
  MessageSquare,
  Clock,
  Trash2,
  Mail,
  MailOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const NotificationCard = ({ notification, onMarkAsRead, onMarkAsUnread, onDelete, compact = false }) => {
  const getNotificationIcon = (type) => {
    const iconClass = 'w-5 h-5';
    switch (type) {
      case 'profile':
        return <CheckCircle className={iconClass} />;
      case 'mentorship':
        return <Users className={iconClass} />;
      case 'job':
        return <Briefcase className={iconClass} />;
      case 'event':
        return <Calendar className={iconClass} />;
      case 'forum':
        return <MessageSquare className={iconClass} />;
      case 'session':
        return <Clock className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'profile':
        return 'bg-green-100 text-green-600';
      case 'mentorship':
        return 'bg-blue-100 text-blue-600';
      case 'job':
        return 'bg-purple-100 text-purple-600';
      case 'event':
        return 'bg-orange-100 text-orange-600';
      case 'forum':
        return 'bg-pink-100 text-pink-600';
      case 'session':
        return 'bg-indigo-100 text-indigo-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleCardClick = () => {
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  if (compact) {
    return (
      <div
        onClick={handleCardClick}
        className={cn(
          'p-3 hover:bg-gray-50 cursor-pointer transition-colors border-l-2',
          notification.is_read ? 'border-transparent' : 'border-blue-500 bg-blue-50/30'
        )}
      >
        <div className="flex items-start space-x-3">
          <div className={cn('p-2 rounded-full flex-shrink-0', getIconColor(notification.type))}>
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium text-gray-900', !notification.is_read && 'font-semibold')}>
              {notification.title}
            </p>
            <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
            <p className="text-xs text-gray-500 mt-1">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </p>
          </div>
          {!notification.is_read && (
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-4 bg-white border rounded-lg transition-all hover:shadow-md',
        notification.is_read ? 'border-gray-200' : 'border-blue-200 bg-blue-50/30'
      )}
      data-testid="notification-card"
    >
      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div className={cn('p-3 rounded-full flex-shrink-0', getIconColor(notification.type))}>
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={cn('text-sm font-medium text-gray-900', !notification.is_read && 'font-semibold')}>
                  {notification.title}
                </h4>
                {notification.priority && notification.priority !== 'low' && (
                  <Badge variant="secondary" className={cn('text-xs', getPriorityColor(notification.priority))}>
                    {notification.priority}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                <span className="capitalize">{notification.type}</span>
              </div>
            </div>
          </div>

          {/* Link */}
          {notification.link && (
            <Link
              to={notification.link}
              onClick={handleCardClick}
              className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View Details →
            </Link>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {notification.is_read ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onMarkAsUnread && onMarkAsUnread(notification.id)}
              className="h-8 w-8"
              title="Mark as unread"
            >
              <Mail className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onMarkAsRead && onMarkAsRead(notification.id)}
              className="h-8 w-8"
              title="Mark as read"
            >
              <MailOpen className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete && onDelete(notification.id)}
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Delete notification"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;
