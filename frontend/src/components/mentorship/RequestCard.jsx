import { Clock, CheckCircle2, XCircle, User, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';

const RequestCard = ({ request, userProfile, onAccept, onReject, onCancel, onViewProfile, isStudentView = true }) => {
  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
  };

  const getStatusBadge = () => {
    switch (request.status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{request.status}</Badge>;
    }
  };

  return (
    <Card data-testid={`request-card-${request.id}`} className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        {/* Header with profile info */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={userProfile?.photo_url} alt={userProfile?.name} />
            <AvatarFallback>{getInitials(userProfile?.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">{userProfile?.name}</h4>
                <p className="text-sm text-gray-600">{userProfile?.headline || userProfile?.current_role}</p>
              </div>
              {getStatusBadge()}
            </div>
          </div>
        </div>

        {/* Request Details */}
        <div className="space-y-3">
          {/* Goals */}
          {request.goals && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Goals</p>
              <p className="text-sm text-gray-700">{request.goals}</p>
            </div>
          )}

          {/* Message */}
          {request.request_message && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Message</p>
              <p className="text-sm text-gray-700 line-clamp-3">{request.request_message}</p>
            </div>
          )}

          {/* Preferred Topics */}
          {request.preferred_topics && request.preferred_topics.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Interested In</p>
              <div className="flex flex-wrap gap-1.5">
                {request.preferred_topics.map((topic, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Rejection Reason */}
          {request.status === 'rejected' && request.rejection_reason && (
            <div className="p-3 bg-red-50 rounded-md">
              <p className="text-xs font-semibold text-red-700 uppercase mb-1">Reason</p>
              <p className="text-sm text-red-600">{request.rejection_reason}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>Requested {format(new Date(request.requested_at), 'MMM d, yyyy')}</span>
            </div>
            {request.accepted_at && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Accepted {format(new Date(request.accepted_at), 'MMM d, yyyy')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          {onViewProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewProfile(userProfile)}
              className="flex-1"
              data-testid={`view-profile-${request.id}`}
            >
              <User className="h-4 w-4 mr-1" />
              View Profile
            </Button>
          )}

          {request.status === 'pending' && !isStudentView && onAccept && onReject && (
            <>
              <Button
                size="sm"
                onClick={() => onAccept(request)}
                className="flex-1 bg-green-600 hover:bg-green-700"
                data-testid={`accept-request-${request.id}`}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onReject(request)}
                className="flex-1"
                data-testid={`reject-request-${request.id}`}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          )}

          {request.status === 'pending' && isStudentView && onCancel && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCancel(request)}
              className="flex-1"
              data-testid={`cancel-request-${request.id}`}
            >
              Cancel Request
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RequestCard;