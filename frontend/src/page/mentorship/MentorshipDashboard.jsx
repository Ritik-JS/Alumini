import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, CheckCircle2, Calendar, MessageSquare, Plus, Settings } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import SessionCard from '@/components/mentorship/SessionCard';
import RequestCard from '@/components/mentorship/RequestCard';
import ScheduleSessionModal from '@/components/mentorship/ScheduleSessionModal';
import FeedbackModal from '@/components/mentorship/FeedbackModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { mentorshipService } from '@/services';

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
    <p className="text-gray-600">Loading mentorship dashboard...</p>
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
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h3>
    <p className="text-gray-600 mb-4 text-center max-w-md">{message}</p>
    {onRetry && (
      <Button onClick={onRetry}>Try Again</Button>
    )}
  </div>
);

const MentorshipDashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isMentor, setIsMentor] = useState(false);
  const [activeMentorships, setActiveMentorships] = useState([]);
  const [activeMentees, setActiveMentees] = useState([]);
  const [studentRequests, setStudentRequests] = useState([]);
  const [mentorRequests, setMentorRequests] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedMentorship, setSelectedMentorship] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserData(user);
    if (user.id) {
      initializeData(user.id);
    }
  }, []);

  const initializeData = async (userId) => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is also a mentor
      const mentorResult = await mentorshipService.getMentorByUserId(userId);
      setIsMentor(mentorResult.success && mentorResult.data);

      await loadData(userId);
    } catch (err) {
      console.error('Error initializing dashboard:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async (userId) => {
    try {
      // Student data
      const mentorshipsResult = await mentorshipService.getActiveMentorships(userId);
      if (mentorshipsResult.success) {
        setActiveMentorships(mentorshipsResult.data || []);
      }

      const stuRequestsResult = await mentorshipService.getStudentRequests(userId);
      if (stuRequestsResult.success) {
        setStudentRequests(stuRequestsResult.data || []);
      }

      // Mentor data
      const menteesResult = await mentorshipService.getActiveMentees(userId);
      if (menteesResult.success) {
        setActiveMentees(menteesResult.data || []);
      }

      const menRequestsResult = await mentorshipService.getMentorRequests(userId);
      if (menRequestsResult.success) {
        setMentorRequests(menRequestsResult.data || []);
      }

      // Sessions
      const upcomingResult = await mentorshipService.getUpcomingSessions(userId);
      if (upcomingResult.success) {
        setUpcomingSessions(upcomingResult.data || []);
      }

      const pastResult = await mentorshipService.getPastSessions(userId);
      if (pastResult.success) {
        setPastSessions(pastResult.data || []);
      }
    } catch (err) {
      console.error('Error loading mentorship data:', err);
      toast.error('Some data could not be loaded');
    }
  };

  const handleAcceptRequest = async (request) => {
    const result = await mentorshipService.acceptMentorshipRequest(request.id);
    if (result.success) {
      toast.success('Mentorship request accepted!');
      loadData(userData.id);
    } else {
      toast.error(result.error || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (request) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    const result = await mentorshipService.rejectMentorshipRequest(request.id, reason || '');
    if (result.success) {
      toast.success('Mentorship request rejected');
      loadData(userData.id);
    } else {
      toast.error(result.error || 'Failed to reject request');
    }
  };

  const handleCancelRequest = async (request) => {
    if (window.confirm('Are you sure you want to cancel this request?')) {
      const result = await mentorshipService.cancelMentorshipRequest(request.id);
      if (result.success) {
        toast.success('Mentorship request cancelled');
        loadData(userData.id);
      } else {
        toast.error(result.error || 'Failed to cancel request');
      }
    }
  };

  const handleScheduleSession = (mentorship) => {
    setSelectedMentorship(mentorship);
    setShowScheduleModal(true);
  };

  const handleViewSessionDetails = (session) => {
    navigate(`/mentorship/sessions/${session.id}`);
  };

  const handleJoinMeeting = (session) => {
    if (session.meeting_link) {
      window.open(session.meeting_link, '_blank');
    } else {
      toast.error('No meeting link available');
    }
  };

  const handleProvideFeedback = (session) => {
    setSelectedSession(session);
    setShowFeedbackModal(true);
  };

  const handleViewProfile = (profile) => {
    navigate(`/profile/${profile.user_id}`);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorMessage message={error} onRetry={() => initializeData(userData.id)} />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
            My Mentorship
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your mentorship relationships and sessions
          </p>
        </div>

        {/* Role Tabs */}
        <Tabs defaultValue={isMentor ? 'mentor' : 'student'} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="student" data-testid="student-tab">
              <Users className="h-4 w-4 mr-2" />
              As Mentee
            </TabsTrigger>
            {isMentor && (
              <TabsTrigger value="mentor" data-testid="mentor-tab">
                <Users className="h-4 w-4 mr-2" />
                As Mentor
              </TabsTrigger>
            )}
          </TabsList>

          {/* Student/Mentee View */}
          <TabsContent value="student" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Mentors</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{activeMentorships.length}</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending Requests</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {studentRequests.filter(r => r.status === 'pending').length}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Sessions</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {upcomingSessions.length + pastSessions.length}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Sessions */}
            {upcomingSessions.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Sessions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingSessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onViewDetails={handleViewSessionDetails}
                      onJoinMeeting={handleJoinMeeting}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Active Mentorships */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Active Mentorships</h2>
              {activeMentorships.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {activeMentorships.map((mentorship) => (
                    <Card key={mentorship.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={mentorship.mentor?.profile?.photo_url} alt={mentorship.mentor?.profile?.name} />
                            <AvatarFallback>{getInitials(mentorship.mentor?.profile?.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">
                                  {mentorship.mentor?.profile?.name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {mentorship.mentor?.profile?.headline}
                                </p>
                              </div>
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                Active
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {mentorship.mentor?.expertise_areas?.slice(0, 3).map((area, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {area}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewProfile(mentorship.mentor?.profile)}
                              >
                                View Profile
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleScheduleSession(mentorship)}
                                data-testid={`schedule-session-${mentorship.id}`}
                              >
                                <Calendar className="h-4 w-4 mr-1" />
                                Schedule Session
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No active mentorships</p>
                    <p className="text-sm text-gray-400 mb-4">Find a mentor to start your journey</p>
                    <Button onClick={() => navigate('/mentorship/find')}>
                      Find Mentors
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Pending Requests */}
            {studentRequests.filter(r => r.status === 'pending').length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Requests</h2>
                <div className="grid grid-cols-1 gap-4">
                  {studentRequests
                    .filter(r => r.status === 'pending')
                    .map((request) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        userProfile={request.mentorProfile}
                        isStudentView={true}
                        onCancel={handleCancelRequest}
                        onViewProfile={handleViewProfile}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Past Sessions */}
            {pastSessions.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Past Sessions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pastSessions.slice(0, 4).map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onViewDetails={handleViewSessionDetails}
                      onProvideFeedback={session.status === 'completed' && !session.feedback ? handleProvideFeedback : undefined}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Mentor View */}
          {isMentor && (
            <TabsContent value="mentor" className="space-y-6">
              {/* Quick Action Banner */}
              <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Mentor Profile Settings</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Update your expertise, availability, and mentorship approach
                      </p>
                    </div>
                    <Button onClick={() => navigate('/mentorship/manage')} data-testid="manage-profile-btn">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Active Mentees</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{activeMentees.length}</p>
                      </div>
                      <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Pending Requests</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">
                          {mentorRequests.filter(r => r.status === 'pending').length}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Upcoming Sessions</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{upcomingSessions.length}</p>
                      </div>
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pending Mentorship Requests */}
              {mentorRequests.filter(r => r.status === 'pending').length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Mentorship Requests</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {mentorRequests
                      .filter(r => r.status === 'pending')
                      .map((request) => (
                        <RequestCard
                          key={request.id}
                          request={request}
                          userProfile={request.studentProfile}
                          isStudentView={false}
                          onAccept={handleAcceptRequest}
                          onReject={handleRejectRequest}
                          onViewProfile={handleViewProfile}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Active Mentees */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Active Mentees</h2>
                {activeMentees.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {activeMentees.map((mentee) => (
                      <Card key={mentee.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={mentee.student?.profile?.photo_url} alt={mentee.student?.profile?.name} />
                              <AvatarFallback>{getInitials(mentee.student?.profile?.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold text-lg text-gray-900">
                                    {mentee.student?.profile?.name || mentee.student?.email}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {mentee.student?.profile?.headline || 'Student'}
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 mb-3">
                                <strong>Goals:</strong> {mentee.goals}
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewProfile(mentee.student?.profile)}
                                >
                                  View Profile
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleScheduleSession(mentee)}
                                >
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Schedule Session
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No active mentees yet</p>
                      <p className="text-sm text-gray-400 mt-2">Accept mentorship requests to start mentoring</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Upcoming Sessions */}
              {upcomingSessions.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Sessions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcomingSessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        onViewDetails={handleViewSessionDetails}
                        onJoinMeeting={handleJoinMeeting}
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Modals */}
      {showScheduleModal && selectedMentorship && (
        <ScheduleSessionModal
          mentorshipRequest={selectedMentorship}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedMentorship(null);
          }}
          onSuccess={() => {
            loadData(userData.id);
          }}
        />
      )}

      {showFeedbackModal && selectedSession && (
        <FeedbackModal
          session={selectedSession}
          onClose={() => {
            setShowFeedbackModal(false);
            setSelectedSession(null);
          }}
          onSuccess={() => {
            loadData(userData.id);
          }}
        />
      )}
    </MainLayout>
  );
};

export default MentorshipDashboard;
