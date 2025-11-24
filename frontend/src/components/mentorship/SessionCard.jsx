import { Calendar, Clock, Video, FileText, Star, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, isPast, isFuture } from 'date-fns';

const SessionCard = ({ session, onViewDetails, onJoinMeeting, onProvideFeedback }) => {
  const sessionDate = new Date(session.scheduled_date);
  const isUpcoming = isFuture(sessionDate);
  const isCompleted = session.status === 'completed';
  const isCancelled = session.status === 'cancelled';

  const getStatusBadge = () => {
    if (isCancelled) {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    if (isCompleted) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
    }
    if (isUpcoming) {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Upcoming</Badge>;
    }
    return <Badge variant="secondary">Past</Badge>;
  };

  return (
    <Card data-testid={`session-card-${session.id}`} className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">
              {session.agenda || 'Mentorship Session'}
            </h4>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{format(sessionDate, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <Clock className="h-4 w-4" />
              <span>{format(sessionDate, 'h:mm a')} • {session.duration} minutes</span>
            </div>
          </div>
          <div>{getStatusBadge()}</div>
        </div>

        {session.meeting_link && !isCancelled && (
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-md mb-3">
            <Video className="h-4 w-4" />
            <span className="text-xs">Meeting link available</span>
          </div>
        )}

        {session.notes && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
              <p className="text-sm text-gray-700 line-clamp-2">{session.notes}</p>
            </div>
          </div>
        )}

        {session.feedback && session.rating && (
          <div className="mt-3 p-3 bg-green-50 rounded-md">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm font-semibold">{session.rating}/5</span>
            </div>
            <p className="text-sm text-gray-700 line-clamp-2">{session.feedback}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-5 pt-0 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(session)}
          className="flex-1"
          data-testid={`view-session-details-${session.id}`}
        >
          View Details
        </Button>
        {isUpcoming && session.meeting_link && (
          <Button
            size="sm"
            onClick={() => onJoinMeeting(session)}
            className="flex-1"
            data-testid={`join-meeting-${session.id}`}
          >
            <Video className="h-4 w-4 mr-1" />
            Join Meeting
          </Button>
        )}
        {isCompleted && !session.feedback && onProvideFeedback && (
          <Button
            size="sm"
            onClick={() => onProvideFeedback(session)}
            className="flex-1"
            data-testid={`provide-feedback-${session.id}`}
          >
            <Star className="h-4 w-4 mr-1" />
            Rate Session
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default SessionCard;