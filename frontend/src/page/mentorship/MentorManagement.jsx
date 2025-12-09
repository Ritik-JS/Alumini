import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Settings, Users, MessageSquare, Calendar, Plus, Edit } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import RequestCard from '@/components/mentorship/RequestCard';
import SessionCard from '@/components/mentorship/SessionCard';
import ScheduleSessionModal from '@/components/mentorship/ScheduleSessionModal';
import { mentorshipService } from '@/services';

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
    <p className="text-gray-600">Loading mentor management...</p>
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
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Data</h3>
    <p className="text-gray-600 mb-4 text-center max-w-md">{message}</p>
    {onRetry && (
      <Button onClick={onRetry}>Try Again</Button>
    )}
  </div>
);

const MentorManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mentorProfile, setMentorProfile] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeMentees, setActiveMentees] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedMentorship, setSelectedMentorship] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    is_available: true,
    max_mentees: 5,
    mentorship_approach: '',
    expertise_areas: [],
  });
  const [newExpertise, setNewExpertise] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadMentorData();
    }
  }, [user?.id]);

  const loadMentorData = async () => {
    try {
      setLoading(true);
      setError(null);

      const mentorResult = await mentorshipService.getMentorByUserId(user.id);

      if (mentorResult.success && mentorResult.data) {
        const mentor = mentorResult.data;
        setMentorProfile(mentor);
        setFormData({
          is_available: mentor.is_available,
          max_mentees: mentor.max_mentees,
          mentorship_approach: mentor.mentorship_approach || '',
          expertise_areas: mentor.expertise_areas || [],
        });

        // Load mentor-specific data
        const requestsResult = await mentorshipService.getMentorRequests(user.id);
        if (requestsResult.success) {
          setPendingRequests(requestsResult.data.filter(r => r.status === 'pending'));
        }

        const menteesResult = await mentorshipService.getActiveMentees(user.id);
        if (menteesResult.success) {
          setActiveMentees(menteesResult.data);
        }

        const sessionsResult = await mentorshipService.getUpcomingSessions(user.id);
        if (sessionsResult.success) {
          setUpcomingSessions(sessionsResult.data);
        }
      } else {
        setIsRegistering(true);
      }
    } catch (err) {
      console.error('Error loading mentor data:', err);
      setError('Failed to load mentor data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAsMentor = async () => {
    if (formData.expertise_areas.length === 0) {
      toast.error('Please add at least one expertise area');
      return;
    }

    const result = await mentorshipService.registerAsMentor(user.id, formData);
    if (result.success) {
      toast.success('Successfully registered as a mentor!');
      setIsRegistering(false);
      loadMentorData();
    } else {
      toast.error(result.error || 'Failed to register as mentor');
    }
  };

  const handleUpdateProfile = async () => {
    const result = await mentorshipService.updateMentorProfile(user.id, formData);
    if (result.success) {
      toast.success('Mentor profile updated successfully');
      setEditMode(false);
      loadMentorData();
    } else {
      toast.error(result.error || 'Failed to update profile');
    }
  };

  const handleAddExpertise = () => {
    if (newExpertise.trim() && !formData.expertise_areas.includes(newExpertise.trim())) {
      setFormData(prev => ({
        ...prev,
        expertise_areas: [...prev.expertise_areas, newExpertise.trim()],
      }));
      setNewExpertise('');
    }
  };

  const handleRemoveExpertise = (expertise) => {
    setFormData(prev => ({
      ...prev,
      expertise_areas: prev.expertise_areas.filter(e => e !== expertise),
    }));
  };

  const handleAcceptRequest = async (request) => {
    const result = await mentorshipService.acceptMentorshipRequest(request.id);
    if (result.success) {
      toast.success('Mentorship request accepted!');
      loadMentorData();
    } else {
      toast.error(result.error || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (request) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    const result = await mentorshipService.rejectMentorshipRequest(request.id, reason || '');
    if (result.success) {
      toast.success('Mentorship request rejected');
      loadMentorData();
    } else {
      toast.error(result.error || 'Failed to reject request');
    }
  };

  const handleScheduleSession = (mentorship) => {
    setSelectedMentorship(mentorship);
    setShowScheduleModal(true);
  };

  const handleViewProfile = (profile) => {
    navigate(`/profile/${profile.user_id}`);
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
          <ErrorMessage message={error} onRetry={loadMentorData} />
        </div>
      </MainLayout>
    );
  }

  // If not registered as mentor, show registration form
  if (isRegistering) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Become a Mentor</CardTitle>
              <CardDescription>
                Share your knowledge and experience by mentoring students and early-career professionals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Availability */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Available for Mentorship</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Toggle your availability to receive mentorship requests
                  </p>
                </div>
                <Switch
                  checked={formData.is_available}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, is_available: checked }))
                  }
                />
              </div>

              {/* Max Mentees */}
              <div>
                <Label>Maximum Mentees</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.max_mentees}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, max_mentees: parseInt(e.target.value) }))
                  }
                  className="mt-1 max-w-xs"
                />
                <p className="text-sm text-gray-500 mt-1">
                  How many mentees can you handle at once?
                </p>
              </div>

              {/* Expertise Areas */}
              <div>
                <Label>Expertise Areas *</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newExpertise}
                    onChange={(e) => setNewExpertise(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExpertise())}
                    placeholder="e.g., Software Engineering, Career Development"
                    className="flex-1"
                  />
                  <Button type="button" onClick={handleAddExpertise}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.expertise_areas.map((expertise) => (
                    <Badge
                      key={expertise}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleRemoveExpertise(expertise)}
                    >
                      {expertise}
                      <span className="ml-1 text-red-500 hover:text-red-700">×</span>
                    </Badge>
                  ))}
                </div>
                {formData.expertise_areas.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">Add at least one expertise area</p>
                )}
              </div>

              {/* Mentorship Approach */}
              <div>
                <Label>Mentorship Approach</Label>
                <Textarea
                  value={formData.mentorship_approach}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, mentorship_approach: e.target.value }))
                  }
                  placeholder="Describe your mentorship style, what mentees can expect, and how you like to structure sessions..."
                  rows={4}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Help students understand your mentorship style
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={handleRegisterAsMentor} data-testid="register-mentor-btn">
                  Register as Mentor
                </Button>
                <Button variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!mentorProfile) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500">Loading...</p>
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
            Mentor Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your mentorship profile and mentees
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">
              <Users className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="requests">
              <MessageSquare className="h-4 w-4 mr-2" />
              Requests
              {pendingRequests.length > 0 && (
                <Badge className="ml-2 bg-red-500">{pendingRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="mentees">
              <Users className="h-4 w-4 mr-2" />
              My Mentees
            </TabsTrigger>
            <TabsTrigger value="sessions">
              <Calendar className="h-4 w-4 mr-2" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="profile">
              <Settings className="h-4 w-4 mr-2" />
              Profile Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Mentees</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {mentorProfile.current_mentees_count}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">of {mentorProfile.max_mentees}</p>
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
                      <p className="text-3xl font-bold text-gray-900 mt-1">{pendingRequests.length}</p>
                    </div>
                    <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-yellow-600" />
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
                        {mentorProfile.total_sessions}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Rating</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {mentorProfile.rating.toFixed(1)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {mentorProfile.total_reviews} reviews
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">⭐</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/mentorship/dashboard')}
                  >
                    View Full Dashboard
                  </Button>
                  <Button
                    variant={mentorProfile.is_available ? 'destructive' : 'default'}
                    onClick={async () => {
                      const result = await mentorshipService.updateMentorProfile(user.id, {
                        ...formData,
                        is_available: !mentorProfile.is_available,
                      });
                      if (result.success) {
                        toast.success(
                          mentorProfile.is_available
                            ? 'You are now unavailable for new mentorship requests'
                            : 'You are now available for new mentorship requests'
                        );
                        loadMentorData();
                      }
                    }}
                  >
                    {mentorProfile.is_available ? 'Go Unavailable' : 'Go Available'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mentorship Requests</CardTitle>
                <CardDescription>
                  Review and respond to mentorship requests from students
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRequests.length > 0 ? (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
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
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No pending requests</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mentees Tab */}
          <TabsContent value="mentees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Mentees ({activeMentees.length})</CardTitle>
                <CardDescription>
                  Students you are currently mentoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeMentees.length > 0 ? (
                  <div className="space-y-4">
                    {activeMentees.map((mentee) => (
                      <Card key={mentee.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">
                                {mentee.student?.profile?.name || mentee.student?.email}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {mentee.student?.profile?.headline || 'Student'}
                              </p>
                              <p className="text-sm text-gray-700 mt-2">
                                <strong>Goals:</strong> {mentee.goals}
                              </p>
                            </div>
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
                                Schedule Session
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No active mentees yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions ({upcomingSessions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingSessions.length > 0 ? (
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
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No upcoming sessions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Settings Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Mentor Profile Settings
                  {!editMode && (
                    <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Availability */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Available for Mentorship</Label>
                    <p className="text-sm text-gray-500 mt-1">
                      {mentorProfile.is_available
                        ? 'You are accepting new mentorship requests'
                        : 'You are not accepting new requests'}
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_available}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, is_available: checked }))
                    }
                    disabled={!editMode}
                  />
                </div>

                {/* Max Mentees */}
                <div>
                  <Label>Maximum Mentees</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.max_mentees}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, max_mentees: parseInt(e.target.value) }))
                    }
                    className="mt-1 max-w-xs"
                    disabled={!editMode}
                  />
                </div>

                {/* Expertise Areas */}
                <div>
                  <Label>Expertise Areas</Label>
                  {editMode && (
                    <div className="flex gap-2 mt-1 mb-3">
                      <Input
                        value={newExpertise}
                        onChange={(e) => setNewExpertise(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === 'Enter' && (e.preventDefault(), handleAddExpertise())
                        }
                        placeholder="Add new expertise area"
                        className="flex-1"
                      />
                      <Button type="button" onClick={handleAddExpertise}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {formData.expertise_areas.map((expertise) => (
                      <Badge
                        key={expertise}
                        variant="secondary"
                        className={editMode ? 'cursor-pointer' : ''}
                        onClick={() => editMode && handleRemoveExpertise(expertise)}
                      >
                        {expertise}
                        {editMode && <span className="ml-1 text-red-500">×</span>}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Mentorship Approach */}
                <div>
                  <Label>Mentorship Approach</Label>
                  <Textarea
                    value={formData.mentorship_approach}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, mentorship_approach: e.target.value }))
                    }
                    rows={4}
                    className="mt-1"
                    disabled={!editMode}
                  />
                </div>

                {/* Action Buttons */}
                {editMode && (
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateProfile}>Save Changes</Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditMode(false);
                        setFormData({
                          is_available: mentorProfile.is_available,
                          max_mentees: mentorProfile.max_mentees,
                          mentorship_approach: mentorProfile.mentorship_approach || '',
                          expertise_areas: mentorProfile.expertise_areas || [],
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
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
            loadMentorData();
          }}
        />
      )}
    </MainLayout>
  );
};

export default MentorManagement;
