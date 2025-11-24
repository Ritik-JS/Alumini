import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, CheckCircle2, Calendar, MessageSquare, Plus } from 'lucide-react';
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
import {
  getActiveMentorships,
  getActiveMentees,
  getStudentRequests,
  getMentorRequests,
  getUpcomingSessions,
  getPastSessions,
  acceptMentorshipRequest,
  rejectMentorshipRequest,
  cancelMentorshipRequest,
  getMentorByUserId,
} from '@/services/mockMentorshipService';
import mockData from '@/mockdata.json';

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

  useEffect(() => {
    // Get current user
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserData(user);

    // Check if user is also a mentor
    const mentorProfile = getMentorByUserId(user.id);
    setIsMentor(!!mentorProfile);

    loadData(user.id);
  }, []);

  const loadData = (userId) => {
    // Student data
    const mentorships = getActiveMentorships(userId);
    setActiveMentorships(mentorships);

    const stuRequests = getStudentRequests(userId);
    setStudentRequests(stuRequests);

    // Mentor data
    const mentees = getActiveMentees(userId);
    setActiveMentees(mentees);

    const menRequests = getMentorRequests(userId);
    setMentorRequests(menRequests);

    // Sessions
    const upcoming = getUpcomingSessions(userId);
    setUpcomingSessions(upcoming);

    const past = getPastSessions(userId);
    setPastSessions(past);
  };

  const handleAcceptRequest = async (request) => {
    const result = await acceptMentorshipRequest(request.id);
    if (result.success) {
      toast.success('Mentorship request accepted!');
      loadData(userData.id);
    } else {
      toast.error(result.error || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (request) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    const result = await rejectMentorshipRequest(request.id, reason || '');
    if (result.success) {
      toast.success('Mentorship request rejected');
      loadData(userData.id);
    } else {
      toast.error(result.error || 'Failed to reject request');
    }
  };

  const handleCancelRequest = async (request) => {
    if (window.confirm('Are you sure you want to cancel this request?')) {
      const result = await cancelMentorshipRequest(request.id);
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

  // Get request details with profiles
  const getRequestWithProfile = (request, isStudentView) => {
    const userId = isStudentView ? request.mentor_id : request.student_id;
    const profile = mockData.alumni_profiles.find(p => p.user_id === userId);
    return { request, profile };
  };

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
                    .map((request) => {
                      const { profile } = getRequestWithProfile(request, true);
                      return (
                        <RequestCard
                          key={request.id}
                          request={request}
                          userProfile={profile}
                          isStudentView={true}
                          onCancel={handleCancelRequest}
                          onViewProfile={handleViewProfile}
                        />
                      );
                    })}
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
                      .map((request) => {
                        const { profile } = getRequestWithProfile(request, false);
                        return (
                          <RequestCard
                            key={request.id}
                            request={request}
                            userProfile={profile}
                            isStudentView={false}
                            onAccept={handleAcceptRequest}
                            onReject={handleRejectRequest}
                            onViewProfile={handleViewProfile}
                          />
                        );
                      })}
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
