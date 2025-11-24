import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockProfileService } from '@/services/mockProfileService';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users, Briefcase, Calendar, MessageSquare, Award, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import mockData from '@/mockdata.json';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [mentorshipRequests, setMentorshipRequests] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recommendedMentors, setRecommendedMentors] = useState([]);
  const [loading, setLoading] = useState(true);

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
                    <Button asChild size="sm">
                      <Link to="/profile/edit">Complete Profile</Link>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link to="/mentorship/find" className="p-4 border rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all">
                    <Users className="h-8 w-8 text-blue-600 mb-2" />
                    <div className="text-sm font-medium text-gray-900">Find a Mentor</div>
                    <div className="text-xs text-gray-500 mt-1">Connect with experienced alumni</div>
                  </Link>
                  <Link to="/jobs" className="p-4 border rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all">
                    <Briefcase className="h-8 w-8 text-green-600 mb-2" />
                    <div className="text-sm font-medium text-gray-900">Browse Jobs</div>
                    <div className="text-xs text-gray-500 mt-1">Find your next opportunity</div>
                  </Link>
                  <Link to="/events" className="p-4 border rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all">
                    <Calendar className="h-8 w-8 text-purple-600 mb-2" />
                    <div className="text-sm font-medium text-gray-900">Upcoming Events</div>
                    <div className="text-xs text-gray-500 mt-1">Join workshops and meetups</div>
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
                          <div key={app.id} className="flex items-start justify-between p-3 border rounded-lg">
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
                          </div>
                        );
                      })}
                      <Button asChild variant="outline" className="w-full" size="sm">
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
                          <Button size="sm" variant="outline">Connect</Button>
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
                          <Button size="sm">View Details</Button>
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
      
      <Footer />
    </div>
  );
};

export default StudentDashboard;