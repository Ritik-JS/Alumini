import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockProfileService } from '@/services/mockProfileService';
import { createMentorshipRequest } from '@/services/mockMentorshipService';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Users, Briefcase, Calendar, MessageSquare, Award, TrendingUp, Eye, FileText, UserCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import mockData from '@/mockdata.json';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [mentorshipRequests, setMentorshipRequests] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recommendedMentors, setRecommendedMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestGoals, setRequestGoals] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileData, appsData, mentorRequests] = await Promise.all([
          mockProfileService.getProfileByUserId(user.id),
          mockProfileService.getJobApplicationsByUser(user.id),
          mockProfileService.getMentorshipRequestsByStudent(user.id),
        ]);

        setProfile(profileData);
        setApplications(appsData);
        setMentorshipRequests(mentorRequests);
        
        // Get upcoming events
        const events = mockData.events?.filter(e => 
          new Date(e.start_date) > new Date()
        ).slice(0, 3) || [];
        setUpcomingEvents(events);

        // Get recommended mentors
        const mentors = mockData.mentor_profiles?.slice(0, 3) || [];
        setRecommendedMentors(mentors);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user.id]);

  const handleConnectClick = (mentor) => {
    setSelectedMentor(mentor);
    setConnectDialogOpen(true);
    setRequestMessage('');
    setRequestGoals('');
  };

  const handleSendRequest = async () => {
    if (!requestMessage.trim() || !requestGoals.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const result = await createMentorshipRequest({
        student_id: user.id,
        mentor_id: selectedMentor.user_id,
        request_message: requestMessage,
        goals: requestGoals,
        preferred_topics: [],
      });

      if (result.success) {
        toast.success('Mentorship request sent successfully!');
        setConnectDialogOpen(false);
        setRequestMessage('');
        setRequestGoals('');
        // Reload mentorship requests
        const mentorRequests = await mockProfileService.getMentorshipRequestsByStudent(user.id);
        setMentorshipRequests(mentorRequests);
      } else {
        toast.error('Failed to send request');
      }
    } catch (error) {
      console.error('Error sending mentorship request:', error);
      toast.error('An error occurred');
    }
  };

  const handleViewMentorProfile = (mentorUserId) => {
    navigate(`/mentorship/mentor/${mentorUserId}`);
  };

  const profileCompletion = profile?.profile_completion_percentage || 0;
  const recentApplications = applications.slice(0, 3);
  const upcomingSessions = mentorshipRequests.filter(r => r.status === 'accepted').slice(0, 2);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainNavbar />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
              <h1 className="text-3xl font-bold">Welcome back, Student! 👋</h1>
              <p className="mt-2 opacity-90">
                Ready to advance your career? Check out your personalized recommendations below.
              </p>
            </div>

            {/* Profile Completion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Profile Completion</span>
                  <span className="text-2xl font-bold text-blue-600">{profileCompletion}%</span>
                </CardTitle>
                <CardDescription>
                  Complete your profile to unlock all features and get better recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={profileCompletion} className="h-3" />
                {profileCompletion < 100 && (
                  <div className="flex gap-2">
                    <Button asChild size="sm" data-testid="complete-profile-btn">
                      <Link to="/profile">Complete Profile</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get started with these common tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Link to="/mentorship/find" className="p-4 border rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all" data-testid="find-mentor-btn">
                    <Users className="h-8 w-8 text-blue-600 mb-2" />
                    <div className="text-sm font-medium text-gray-900">Find a Mentor</div>
                    <div className="text-xs text-gray-500 mt-1">Connect with experienced alumni</div>
                  </Link>
                  <Link to="/mentorship/dashboard" className="p-4 border rounded-lg hover:bg-gray-50 hover:border-purple-500 transition-all" data-testid="my-mentorship-btn">
                    <UserCheck className="h-8 w-8 text-purple-600 mb-2" />
                    <div className="text-sm font-medium text-gray-900">My Mentorship</div>
                    <div className="text-xs text-gray-500 mt-1">View sessions and requests</div>
                  </Link>
                  <Link to="/jobs" className="p-4 border rounded-lg hover:bg-gray-50 hover:border-green-500 transition-all" data-testid="browse-jobs-btn">
                    <Briefcase className="h-8 w-8 text-green-600 mb-2" />
                    <div className="text-sm font-medium text-gray-900">Browse Jobs</div>
                    <div className="text-xs text-gray-500 mt-1">Find your next opportunity</div>
                  </Link>
                  <Link to="/jobs/my-applications" className="p-4 border rounded-lg hover:bg-gray-50 hover:border-orange-500 transition-all" data-testid="my-applications-btn">
                    <FileText className="h-8 w-8 text-orange-600 mb-2" />
                    <div className="text-sm font-medium text-gray-900">My Applications</div>
                    <div className="text-xs text-gray-500 mt-1">Track your applications</div>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Applications */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Applications</CardTitle>
                  <CardDescription>Track your job application status</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentApplications.length > 0 ? (
                    <div className="space-y-3">
                      {recentApplications.map(app => {
                        const job = mockData.jobs?.find(j => j.id === app.job_id);
                        return (
                          <div 
                            key={app.id} 
                            className="flex items-start justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => navigate(`/jobs/${app.job_id}`)}
                            data-testid={`application-${app.id}`}
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">{job?.title || 'Job Title'}</p>
                              <p className="text-xs text-gray-500">{job?.company || 'Company'}</p>
                              <div className="mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  app.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                                  app.status === 'shortlisted' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {app.status}
                                </span>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" data-testid={`view-application-${app.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                      <Button asChild variant="outline" className="w-full" size="sm" data-testid="view-all-applications-btn">
                        <Link to="/jobs/my-applications">View All Applications</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No applications yet</p>
                      <Button asChild size="sm" className="mt-3">
                        <Link to="/jobs">Browse Jobs</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recommended Mentors */}
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Mentors</CardTitle>
                  <CardDescription>Connect with alumni in your field</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recommendedMentors.map(mentor => {
                      const mentorUser = mockData.users?.find(u => u.id === mentor.user_id);
                      const mentorProfile = mockData.alumni_profiles?.find(p => p.user_id === mentor.user_id);
                      const hasRequested = mentorshipRequests.some(r => r.mentor_id === mentor.user_id && r.status === 'pending');
                      const isConnected = mentorshipRequests.some(r => r.mentor_id === mentor.user_id && r.status === 'accepted');
                      
                      return (
                        <div key={mentor.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <img
                              src={mentorProfile?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentorUser?.email}`}
                              alt={mentorProfile?.name}
                              className="h-10 w-10 rounded-full"
                            />
                            <div>
                              <p className="font-medium text-sm">{mentorProfile?.name}</p>
                              <p className="text-xs text-gray-500">{mentorProfile?.current_role}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewMentorProfile(mentor.user_id)}
                              data-testid={`view-profile-${mentor.id}`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleConnectClick(mentor)}
                              disabled={hasRequested || isConnected}
                              data-testid={`connect-btn-${mentor.id}`}
                            >
                              {isConnected ? 'Connected' : hasRequested ? 'Requested' : 'Connect'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    <Button asChild variant="outline" className="w-full" size="sm">
                      <Link to="/mentorship/find">View All Mentors</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Sessions */}
            {upcomingSessions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Mentorship Sessions</CardTitle>
                  <CardDescription>Your scheduled sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingSessions.map(session => {
                      const mentor = mockData.alumni_profiles?.find(p => p.user_id === session.mentor_id);
                      return (
                        <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <MessageSquare className="h-8 w-8 text-blue-600" />
                            <div>
                              <p className="font-medium text-sm">Session with {mentor?.name}</p>
                              <p className="text-xs text-gray-500">Status: {session.status}</p>
                            </div>
                          </div>
                          <Button size="sm" asChild data-testid={`view-session-${session.id}`}>
                            <Link to="/mentorship/dashboard">View Details</Link>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
      
      {/* Connect Dialog */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Mentorship</DialogTitle>
            <DialogDescription>
              Send a mentorship request to {selectedMentor && mockData.alumni_profiles?.find(p => p.user_id === selectedMentor.user_id)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Introduce yourself and explain why you'd like this person as a mentor..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goals">Your Goals *</Label>
              <Textarea
                id="goals"
                placeholder="What do you hope to achieve with this mentorship?"
                value={requestGoals}
                onChange={(e) => setRequestGoals(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendRequest}>
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default StudentDashboard;
