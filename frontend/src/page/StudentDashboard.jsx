import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { profileService, leaderboardService, mentorshipService, eventService, jobService } from '@/services';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Briefcase, Calendar, MessageSquare, Award, TrendingUp, Eye, FileText, UserCheck, Trophy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import usePolling from '@/hooks/usePolling';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [mentorshipRequests, setMentorshipRequests] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recommendedMentors, setRecommendedMentors] = useState([]);
  const [engagementScore, setEngagementScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestGoals, setRequestGoals] = useState('');

  const loadData = async () => {
    try {
      const [profileData, appsData, mentorRequests, scoreData, eventsData, mentorsData] = await Promise.all([
        profileService.getProfileByUserId(user.id),
        profileService.getJobApplicationsByUser(user.id),
        profileService.getMentorshipRequestsByStudent(user.id),
        leaderboardService.getMyScore(user.id),
        eventService.getAllEvents({ is_upcoming: true }),
        mentorshipService.getMentors(),
      ]);

      setProfile(profileData?.data || profileData);
      setApplications(appsData || []);
      setMentorshipRequests(mentorRequests || []);
      if (scoreData.success) setEngagementScore(scoreData.data);
      
      // Get upcoming events
      const events = eventsData?.data?.slice(0, 3) || [];
      setUpcomingEvents(events);

      // Get recommended mentors
      const mentors = mentorsData?.data?.slice(0, 3) || [];
      setRecommendedMentors(mentors);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  // Poll dashboard data every 60 seconds
  usePolling(loadData, 60000);

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
      const result = await mentorshipService.createMentorshipRequest({
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
        const mentorRequests = await profileService.getMentorshipRequestsByStudent(user.id);
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/30">
      <MainNavbar />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-700 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 animate-fade-in">
                    <h1 className="text-4xl font-bold tracking-tight">Welcome back, Student! 👋</h1>
                    <p className="mt-2 text-blue-100 text-lg max-w-2xl leading-relaxed">
                      Ready to advance your career? Check out your personalized recommendations below.
                    </p>
                  </div>
                  {engagementScore && engagementScore.total_score > 0 && (
                    <Badge 
                      className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30 text-lg px-5 py-3 cursor-pointer flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-lg"
                      onClick={() => navigate('/leaderboard')}
                      data-testid="engagement-points-badge"
                    >
                      <Trophy className="h-5 w-5" />
                      {engagementScore.total_score} pts
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Completion */}
            <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-xl">
                  <span className="text-gray-900">Profile Completion</span>
                  <span className="text-3xl font-bold text-blue-600">{profileCompletion}%</span>
                </CardTitle>
                <CardDescription className="text-base">
                  Complete your profile to unlock all features and get better recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="relative">
                  <Progress value={profileCompletion} className="h-3 transition-all duration-500" />
                  <div className="absolute top-0 left-0 h-3 w-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
                </div>
                {profileCompletion < 100 && (
                  <div className="flex gap-2 pt-2">
                    <Button asChild size="default" className="bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:shadow-md" data-testid="complete-profile-btn">
                      <Link to="/profile">Complete Profile</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-xl">Quick Actions</CardTitle>
                <CardDescription className="text-base">Get started with these common tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <Link to="/mentorship/find" className="group p-5 border-2 border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 hover:shadow-md hover:-translate-y-1" data-testid="find-mentor-btn">
                    <div className="p-3 bg-blue-100 rounded-xl w-fit group-hover:bg-blue-200 transition-colors duration-300 mb-3">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">Find a Mentor</div>
                    <div className="text-xs text-gray-600 mt-2 leading-relaxed">Connect with experienced alumni</div>
                  </Link>
                  <Link to="/mentorship/dashboard" className="group p-5 border-2 border-gray-100 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 hover:shadow-md hover:-translate-y-1" data-testid="my-mentorship-btn">
                    <div className="p-3 bg-purple-100 rounded-xl w-fit group-hover:bg-purple-200 transition-colors duration-300 mb-3">
                      <UserCheck className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="text-sm font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">My Mentorship</div>
                    <div className="text-xs text-gray-600 mt-2 leading-relaxed">View sessions and requests</div>
                  </Link>
                  <Link to="/jobs" className="group p-5 border-2 border-gray-100 rounded-xl hover:bg-green-50 hover:border-green-300 transition-all duration-300 hover:shadow-md hover:-translate-y-1" data-testid="browse-jobs-btn">
                    <div className="p-3 bg-green-100 rounded-xl w-fit group-hover:bg-green-200 transition-colors duration-300 mb-3">
                      <Briefcase className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-sm font-semibold text-gray-900 group-hover:text-green-700 transition-colors">Browse Jobs</div>
                    <div className="text-xs text-gray-600 mt-2 leading-relaxed">Find your next opportunity</div>
                  </Link>
                  <Link to="/jobs/my-applications" className="group p-5 border-2 border-gray-100 rounded-xl hover:bg-orange-50 hover:border-orange-300 transition-all duration-300 hover:shadow-md hover:-translate-y-1" data-testid="my-applications-btn">
                    <div className="p-3 bg-orange-100 rounded-xl w-fit group-hover:bg-orange-200 transition-colors duration-300 mb-3">
                      <FileText className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="text-sm font-semibold text-gray-900 group-hover:text-orange-700 transition-colors">My Applications</div>
                    <div className="text-xs text-gray-600 mt-2 leading-relaxed">Track your applications</div>
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
                        return (
                          <div 
                            key={app.id} 
                            className="flex items-start justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => navigate(`/jobs/${app.job_id}`)}
                            data-testid={`application-${app.id}`}
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">{app.job_title || 'Job Title'}</p>
                              <p className="text-xs text-gray-500">{app.job_company || app.company || 'Company'}</p>
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
                      const hasRequested = mentorshipRequests.some(r => r.mentor_id === mentor.user_id && r.status === 'pending');
                      const isConnected = mentorshipRequests.some(r => r.mentor_id === mentor.user_id && r.status === 'accepted');
                      
                      return (
                        <div key={mentor.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <img
                              src={mentor.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.email || mentor.user_email || 'mentor'}`}
                              alt={mentor.name}
                              className="h-10 w-10 rounded-full"
                            />
                            <div>
                              <p className="font-medium text-sm">{mentor.name}</p>
                              <p className="text-xs text-gray-500">{mentor.current_role}</p>
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
                      return (
                        <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <MessageSquare className="h-8 w-8 text-blue-600" />
                            <div>
                              <p className="font-medium text-sm">Session with {session.mentor_name || 'Mentor'}</p>
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
              Send a mentorship request to {selectedMentor?.name || 'Mentor'}
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
