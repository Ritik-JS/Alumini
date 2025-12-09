import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Video, FileText, Star, Edit, X as XIcon } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import FeedbackModal from '@/components/mentorship/FeedbackModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format, isPast, isFuture } from 'date-fns';
import { mentorshipService } from '@/services';

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
    <p className="text-gray-600">Loading session details...</p>
  </div>
);

const ErrorMessage = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="text-red-500 mb-4">
      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Session</h3>
    <p className="text-gray-600 mb-4 text-center max-w-md">{message}</p>
    {onRetry && (
      <Button onClick={onRetry}>Try Again</Button>
    )}
  </div>
);

const SessionDetails = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [request, setRequest] = useState(null);
  const [mentor, setMentor] = useState(null);
  const [student, setStudent] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      setError(null);

      const sessionResult = await mentorshipService.getSessionById(sessionId);
      if (!sessionResult.success) {
        setError(sessionResult.error || 'Session not found');
        return;
      }

      const sessionData = sessionResult.data;
      setSession(sessionData);

      // Get request
      const requestResult = await mentorshipService.getRequestById(sessionData.mentorship_request_id);
      if (requestResult.success && requestResult.data) {
        const requestData = requestResult.data;
        setRequest(requestData);

        // Get mentor and student profiles - service should provide enriched data
        const mentorResult = await mentorshipService.getMentorByUserId(requestData.mentor_id);
        if (mentorResult.success) {
          setMentor(mentorResult.data);
        }

        // Student data should be included in request or session data from service
        if (sessionData.student) {
          setStudent(sessionData.student);
        } else if (requestData.student) {
          setStudent(requestData.student);
        }
      }
    } catch (err) {
      console.error('Error loading session data:', err);
      setError('Failed to load session details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = async () => {
    if (window.confirm('Are you sure you want to cancel this session?')) {
      const result = await mentorshipService.cancelSession(sessionId);
      if (result.success) {
        toast.success('Session cancelled');
        loadSessionData();
      } else {
        toast.error(result.error || 'Failed to cancel session');
      }
    }
  };

  const handleJoinMeeting = () => {
    if (session?.meeting_link) {
      window.open(session.meeting_link, '_blank');
    } else {
      toast.error('No meeting link available');
    }
  };

  const handleAddToCalendar = () => {
    // Generate .ics file for calendar
    const event = {
      title: session.agenda,
      start: new Date(session.scheduled_date),
      duration: session.duration,
      location: session.meeting_link || 'Virtual',
    };

    toast.info('Calendar export coming soon!');
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorMessage message={error} onRetry={loadSessionData} />
        </div>
      </MainLayout>
    );
  }

  if (!session || !request) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500">Session not found</p>
        </div>
      </MainLayout>
    );
  }

  const sessionDate = new Date(session.scheduled_date);
  const isUpcoming = isFuture(sessionDate);
  const isCompleted = session.status === 'completed';
  const isCancelled = session.status === 'cancelled';
  const isStudent = currentUser?.id === request.student_id;

  const getStatusBadge = () => {
    if (isCancelled) {
      return <Badge variant="destructive" className="text-lg">Cancelled</Badge>;
    }
    if (isCompleted) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-lg">Completed</Badge>;
    }
    if (isUpcoming) {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-lg">Upcoming</Badge>;
    }
    return <Badge variant="secondary" className="text-lg">Past</Badge>;
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/mentorship/dashboard')}
          className="mb-6"
          data-testid="back-btn"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header Card */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="session-title">
                  {session.agenda || 'Mentorship Session'}
                </h1>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span>{format(sessionDate, 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>{format(sessionDate, 'h:mm a')} ({session.duration} min)</span>
                  </div>
                </div>
              </div>
              {getStatusBadge()}
            </div>

            {/* Meeting Link */}
            {session.meeting_link && !isCancelled && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg mb-4">
                <Video className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Meeting Link</p>
                  <p className="text-xs text-gray-600 truncate">{session.meeting_link}</p>
                </div>
                {isUpcoming && (
                  <Button onClick={handleJoinMeeting} data-testid="join-meeting-btn">
                    Join Now
                  </Button>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              {isUpcoming && !isCancelled && (
                <>
                  <Button variant="outline" onClick={handleAddToCalendar}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Add to Calendar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelSession}
                    className="text-red-600 hover:text-red-700"
                    data-testid="cancel-session-btn"
                  >
                    <XIcon className="h-4 w-4 mr-2" />
                    Cancel Session
                  </Button>
                </>
              )}
              {isCompleted && !session.feedback && isStudent && (
                <Button onClick={() => setShowFeedbackModal(true)} data-testid="rate-session-btn">
                  <Star className="h-4 w-4 mr-2" />
                  Rate Session
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Participants</h2>
            <div className="space-y-4">
              {/* Mentor */}
              {mentor && (
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={mentor?.profile?.photo_url} alt={mentor?.profile?.name} />
                    <AvatarFallback>{getInitials(mentor?.profile?.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{mentor?.profile?.name}</h3>
                    <p className="text-sm text-gray-600">{mentor?.profile?.headline}</p>
                    <Badge variant="secondary" className="text-xs mt-1">Mentor</Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/profile/${mentor?.user_id}`)}
                  >
                    View Profile
                  </Button>
                </div>
              )}

              <Separator />

              {/* Student */}
              {student && (
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={student?.profile?.photo_url} alt={student?.profile?.name} />
                    <AvatarFallback>{getInitials(student?.profile?.name || student?.email)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{student?.profile?.name || student?.email}</h3>
                    <p className="text-sm text-gray-600">{student?.profile?.headline || 'Student'}</p>
                    <Badge variant="secondary" className="text-xs mt-1">Mentee</Badge>
                  </div>
                  {student?.profile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/profile/${student?.id}`)}
                    >
                      View Profile
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Session Details */}
        {session.notes && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-2">
                <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">Session Notes</h2>
                  <p className="text-gray-700 whitespace-pre-line">{session.notes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feedback */}
        {session.feedback && session.rating && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-yellow-500 fill-current mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-bold text-gray-900">Feedback</h2>
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold text-gray-900">{session.rating}</span>
                      <span className="text-gray-500">/5</span>
                    </div>
                  </div>
                  <p className="text-gray-700 whitespace-pre-line">{session.feedback}</p>
                  <p className="text-xs text-gray-500 mt-3">
                    Submitted by {isStudent ? 'you' : student?.profile?.name || 'mentee'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state for upcoming sessions */}
        {isUpcoming && !session.notes && (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">This session hasn't started yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Come back after the session to add notes and feedback
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          session={session}
          onClose={() => setShowFeedbackModal(false)}
          onSuccess={() => {
            loadSessionData();
          }}
        />
      )}
    </MainLayout>
  );
};

export default SessionDetails;
