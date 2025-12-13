import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { profileService, leaderboardService, eventService } from '@/services';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Users, Briefcase, Calendar, TrendingUp, Award, Trophy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import usePolling from '@/hooks/usePolling';

const AlumniDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [mentorProfile, setMentorProfile] = useState(null);
  const [mentorshipRequests, setMentorshipRequests] = useState([]);
  const [postedJobs, setPostedJobs] = useState([]);
  const [engagementScore, setEngagementScore] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [profileData, mentorData, mentorRequests, jobsData, scoreData, eventsData] = await Promise.all([
        profileService.getProfileByUserId(user.id),
        profileService.getMentorProfile(user.id),
        profileService.getMentorshipRequestsByMentor(user.id),
        profileService.getJobsByPoster(user.id),
        leaderboardService.getMyScore(user.id),
        eventService.getUpcomingEvents(),
      ]);

      if (profileData?.success) setProfile(profileData.data);
      if (mentorData?.success) setMentorProfile(mentorData.data);
      
      setMentorshipRequests(Array.isArray(mentorRequests) ? mentorRequests : []);
      setPostedJobs(Array.isArray(jobsData) ? jobsData : []);
      
      if (scoreData?.success) setEngagementScore(scoreData.data);
      
      // Get upcoming events
      if (eventsData?.success) {
        const events = (eventsData.data || []).slice(0, 3);
        setUpcomingEvents(events);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Some dashboard data could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  // Poll dashboard data every 60 seconds
  usePolling(loadData, 60000);

  const pendingRequests = mentorshipRequests.filter(r => r.status === 'pending');
  const activeJobs = postedJobs.filter(j => j.status === 'active');

  const stats = [
    {
      title: 'Profile Views',
      value: '1,234',
      icon: Eye,
      change: '+12% this month',
      changeType: 'positive',
    },
    {
      title: 'Connections',
      value: profile?.profile_completion_percentage || 0,
      icon: Users,
      change: 'Profile completion',
      changeType: 'neutral',
    },
    {
      title: 'Posted Jobs',
      value: postedJobs.length,
      icon: Briefcase,
      change: `${activeJobs.length} active`,
      changeType: 'positive',
    },
    {
      title: 'Engagement Score',
      value: engagementScore?.total_score || 0,
      icon: Award,
      change: `Rank #${engagementScore?.rank_position || '-'}`,
      changeType: 'positive',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainNavbar />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6 text-white relative">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Welcome back, {profile?.name || 'Alumni'}! 🎓</h1>
                  <p className="mt-2 opacity-90">
                    Thank you for giving back to the community. Your contributions make a difference!
                  </p>
                </div>
                {engagementScore && engagementScore.total_score > 0 && (
                  <Badge 
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-lg px-4 py-2 cursor-pointer flex items-center gap-2"
                    onClick={() => navigate('/leaderboard')}
                    data-testid="engagement-points-badge"
                  >
                    <Trophy className="h-5 w-5" />
                    {engagementScore.total_score} pts
                  </Badge>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {stat.title}
                      </CardTitle>
                      <Icon className="h-4 w-4 text-gray-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className={`text-xs mt-1 ${
                        stat.changeType === 'positive' ? 'text-green-600' :
                        stat.changeType === 'negative' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {stat.change}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your contributions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link to="/jobs/post" className="p-4 border rounded-lg hover:bg-gray-50 hover:border-purple-500 transition-all">
                    <Briefcase className="h-8 w-8 text-purple-600 mb-2" />
                    <div className="text-sm font-medium text-gray-900">Post a Job</div>
                    <div className="text-xs text-gray-500 mt-1">Help students find opportunities</div>
                  </Link>
                  <Link to="/events/create" className="p-4 border rounded-lg hover:bg-gray-50 hover:border-purple-500 transition-all">
                    <Calendar className="h-8 w-8 text-blue-600 mb-2" />
                    <div className="text-sm font-medium text-gray-900">Create Event</div>
                    <div className="text-xs text-gray-500 mt-1">Organize workshops and meetups</div>
                  </Link>
                  <Link to="/mentorship/dashboard" className="p-4 border rounded-lg hover:bg-gray-50 hover:border-purple-500 transition-all">
                    <Users className="h-8 w-8 text-green-600 mb-2" />
                    <div className="text-sm font-medium text-gray-900">Mentorship</div>
                    <div className="text-xs text-gray-500 mt-1">Guide the next generation</div>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mentorship Requests */}
              <Card>
                <CardHeader>
                  <CardTitle>Mentorship Requests</CardTitle>
                  <CardDescription>
                    {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {mentorshipRequests.length > 0 ? (
                    <div className="space-y-3">
                      {mentorshipRequests.slice(0, 3).map(request => (
                          <div key={request.id} className="flex items-start justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{request.student_name || request.student_email || 'Student'}</p>
                              <p className="text-xs text-gray-500 mt-1">{request.request_message?.substring(0, 60)}...</p>
                              <div className="mt-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {request.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      <Button asChild variant="outline" className="w-full" size="sm">
                        <Link to="/mentorship/dashboard">View All Requests</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No mentorship requests yet</p>
                      <p className="text-xs mt-1">Enable mentorship in your profile settings</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Posted Jobs Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Posted Jobs</CardTitle>
                  <CardDescription>Performance of your job postings</CardDescription>
                </CardHeader>
                <CardContent>
                  {postedJobs.length > 0 ? (
                    <div className="space-y-3">
                      {postedJobs.slice(0, 3).map(job => (
                        <div key={job.id} className="flex items-start justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{job.title}</p>
                            <p className="text-xs text-gray-500">{job.company}</p>
                            <div className="flex gap-4 mt-2 text-xs text-gray-600">
                              <span>👁️ {job.views_count} views</span>
                              <span>📄 {job.applications_count} applications</span>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {job.status}
                          </span>
                        </div>
                      ))}
                      <Button asChild variant="outline" className="w-full" size="sm">
                        <Link to="/jobs/manage">Manage Jobs</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No jobs posted yet</p>
                      <Button asChild size="sm" className="mt-3">
                        <Link to="/jobs/post">Post a Job</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Events you might be interested in</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.start_date).toLocaleDateString()} • {event.is_virtual ? 'Virtual' : event.location}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">View</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default AlumniDashboard;