import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  Users,
  Briefcase,
  Calendar,
  MessageSquare,
  UserCheck,
  Activity,
  Eye,
  MapPin,
  Award,
  Heart,
} from 'lucide-react';
import { adminService } from '@/services';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminAnalytics = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalJobs: 0,
    totalEvents: 0,
    totalPosts: 0,
    verifiedAlumni: 0,
  });
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [topContributors, setTopContributors] = useState([]);
  const [platformActivity, setPlatformActivity] = useState([]);
  const [alumniData, setAlumniData] = useState(null);
  const [jobsData, setJobsData] = useState(null);
  const [mentorshipData, setMentorshipData] = useState(null);
  const [eventsData, setEventsData] = useState(null);
  const [engagementData, setEngagementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAllAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all analytics in parallel
      const [
        dashboardResult,
        userGrowthResult,
        contributorsResult,
        activityResult,
        alumniResult,
        jobsResult,
        mentorshipResult,
        eventsResult,
        engagementResult
      ] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getUserGrowth('monthly'),
        adminService.getTopContributors(5),
        adminService.getPlatformActivity(30),
        adminService.getAlumniAnalytics(),
        adminService.getJobAnalytics(),
        adminService.getMentorshipAnalytics(),
        adminService.getEventAnalytics(),
        adminService.getEngagementMetrics()
      ]);

      // Set dashboard stats
      setAnalyticsData(dashboardResult || {
        totalUsers: 0,
        activeUsers: 0,
        totalJobs: 0,
        totalEvents: 0,
        totalPosts: 0,
        verifiedAlumni: 0,
      });

      // Set user growth data
      setUserGrowthData(userGrowthResult?.data || []);

      // Set top contributors
      setTopContributors(contributorsResult?.data || []);

      // Set platform activity
      setPlatformActivity(activityResult?.data || []);

      // Set alumni analytics
      setAlumniData(alumniResult);

      // Set jobs analytics
      setJobsData(jobsResult);

      // Set mentorship analytics
      setMentorshipData(mentorshipResult);

      // Set events analytics
      setEventsData(eventsResult);

      // Set engagement metrics
      setEngagementData(engagementResult);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Unable to connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAnalytics();
  }, []);

  const engagementMetrics = [
    {
      title: 'Total Users',
      value: analyticsData.totalUsers || 0,
      change: '+12%',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Users',
      value: analyticsData.activeUsers || 0,
      change: '+8%',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Verified Alumni',
      value: analyticsData.verifiedAlumni || 0,
      change: '+15%',
      icon: UserCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Total Jobs',
      value: analyticsData.totalJobs || 0,
      change: '+20%',
      icon: Briefcase,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Total Events',
      value: analyticsData.totalEvents || 0,
      change: '+5%',
      icon: Calendar,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
    {
      title: 'Forum Posts',
      value: analyticsData.forumPosts || analyticsData.totalPosts || 0,
      change: '+25%',
      icon: MessageSquare,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <MainNavbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6">
            <LoadingSpinner message="Loading analytics..." />
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <MainNavbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6">
            <ErrorMessage message={error} onRetry={loadAllAnalytics} />
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainNavbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
              <h1 className="text-3xl font-bold">Analytics Dashboard 📊</h1>
              <p className="mt-2 opacity-90">Platform insights and performance metrics</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {engagementMetrics.map((metric, index) => {
                const Icon = metric.icon;
                return (
                  <Card key={index} data-testid={`metric-card-${index}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{metric.title}</p>
                          <div className="text-3xl font-bold mt-2">{metric.value}</div>
                          <p className="text-sm text-green-600 mt-1">{metric.change} from last month</p>
                        </div>
                        <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                          <Icon className={`w-6 h-6 ${metric.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                <TabsTrigger value="overview" data-testid="tab-overview">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="users" data-testid="tab-users">
                  Alumni
                </TabsTrigger>
                <TabsTrigger value="jobs" data-testid="tab-jobs">
                  Jobs
                </TabsTrigger>
                <TabsTrigger value="mentorship" data-testid="tab-mentorship">
                  Mentorship
                </TabsTrigger>
                <TabsTrigger value="events" data-testid="tab-events">
                  Events
                </TabsTrigger>
                <TabsTrigger value="engagement" data-testid="tab-engagement">
                  Engagement
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* User Growth Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                    <CardDescription>Monthly user registration trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-end justify-between gap-4">
                      {(userGrowthData && userGrowthData.length > 0) ? userGrowthData.map((data, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:opacity-80"
                            style={{ height: `${(data.users / 100) * 100}%` }}
                          ></div>
                          <div className="text-sm font-medium mt-2">{data.month}</div>
                          <div className="text-xs text-gray-600">{data.users}</div>
                        </div>
                      )) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-500">
                          No growth data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Platform Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Platform Activity</CardTitle>
                      <CardDescription>Recent activity breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(platformActivity && platformActivity.length > 0) ? platformActivity.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{item.activity}</p>
                              <p className="text-xs text-gray-500">Last 30 days</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">{item.count}</p>
                              <p className="text-xs text-green-600">{item.trend}</p>
                            </div>
                          </div>
                        )) : (
                          <div className="text-center text-gray-500">No activity data available</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Contributors */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Contributors</CardTitle>
                      <CardDescription>Most active users this month</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(topContributors && topContributors.length > 0) ? topContributors.map((contributor, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <img
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${contributor.email}`}
                              alt={contributor.name}
                              className="w-10 h-10 rounded-full"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{contributor.name}</p>
                              <p className="text-xs text-gray-500">{contributor.type}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold">{contributor.contributions}</p>
                              <p className="text-xs text-gray-500">actions</p>
                            </div>
                          </div>
                        )) : (
                          <div className="text-center text-gray-500">No contributor data available</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Alumni Analytics Tab */}
              <TabsContent value="users" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Alumni by Location */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Alumni by Location</CardTitle>
                      <CardDescription>Geographic distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={alumniData?.locationDistribution || []} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="location" type="category" width={100} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Top Companies */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Companies</CardTitle>
                      <CardDescription>Where our alumni work</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={alumniData?.topCompanies || []} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="company" type="category" width={80} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Top Skills */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Skills</CardTitle>
                      <CardDescription>Most common skills among alumni</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(alumniData?.topSkills && alumniData.topSkills.length > 0) ? alumniData.topSkills.map((item, index) => {
                          const colors = ['bg-yellow-500', 'bg-blue-500', 'bg-cyan-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500'];
                          const maxCount = Math.max(...alumniData.topSkills.map(s => s.count));
                          return (
                            <div key={index} className="flex items-center gap-3">
                              <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium">{item.skill}</span>
                                  <span className="text-sm text-gray-600">{item.count} alumni</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div className={`${colors[index % colors.length]} h-2 rounded-full`} style={{ width: `${(item.count / maxCount) * 100}%` }}></div>
                                </div>
                              </div>
                            </div>
                          );
                        }) : (
                          <div className="text-center text-gray-500">No skill data available</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Batch Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Batch Distribution</CardTitle>
                      <CardDescription>Alumni by graduation year</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={alumniData?.batchDistribution || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8b5cf6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Jobs Analytics Tab */}
              <TabsContent value="jobs" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-blue-600">{jobsData?.totalJobs || 0}</div>
                      <p className="text-sm text-gray-600 mt-1">Total Jobs Posted</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">{jobsData?.totalApplications || 0}</div>
                      <p className="text-sm text-gray-600 mt-1">Applications</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-purple-600">
                        {jobsData?.averageApplicationsPerJob || 0}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Avg Applications/Job</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-orange-600">{jobsData?.averageDaysToHire || 0}</div>
                      <p className="text-sm text-gray-600 mt-1">Days to Hire (Avg)</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Job Categories */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Jobs by Category</CardTitle>
                      <CardDescription>Distribution of job types</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={jobsData?.jobsByType || []}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {(jobsData?.jobsByType || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Jobs by Location */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Jobs by Location</CardTitle>
                      <CardDescription>Geographic job distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={jobsData?.jobsByLocation || []} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="location" type="category" width={100} />
                          <Tooltip />
                          <Bar dataKey="jobs" fill="#f59e0b" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Application Trends */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Application Trends</CardTitle>
                      <CardDescription>Applications over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={jobsData?.applicationTrends || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Top Skills Required */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Most Demanded Skills</CardTitle>
                      <CardDescription>Skills required in job postings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={jobsData?.topSkillsRequired || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="skill" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Mentorship Analytics Tab */}
              <TabsContent value="mentorship" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-purple-600">{mentorshipData?.totalRequests || 0}</div>
                      <p className="text-sm text-gray-600 mt-1">Total Mentorships</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-blue-600">{mentorshipData?.activeMentors || 0}</div>
                      <p className="text-sm text-gray-600 mt-1">Active Mentors</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">{mentorshipData?.completedSessions || 0}</div>
                      <p className="text-sm text-gray-600 mt-1">Sessions Completed</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-yellow-600">{mentorshipData?.averageRating || 0}</div>
                      <p className="text-sm text-gray-600 mt-1">Average Rating</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Mentorship Requests Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Mentorship Requests</CardTitle>
                      <CardDescription>Status breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={mentorshipData?.requestsByStatus || []}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {(mentorshipData?.requestsByStatus || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Sessions Over Time */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Sessions Over Time</CardTitle>
                      <CardDescription>Monthly session trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={mentorshipData?.sessionsOverTime || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="sessions" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Top Expertise Areas */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Expertise Areas</CardTitle>
                      <CardDescription>Most popular mentorship topics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={mentorshipData?.topExpertiseAreas || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="area" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8b5cf6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Mentor Ratings Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Mentor Ratings</CardTitle>
                      <CardDescription>Rating distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={mentorshipData?.ratingDistribution || []} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="stars" type="category" width={80} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#f59e0b" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Events Analytics Tab */}
              <TabsContent value="events" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-pink-600">{eventsData?.totalEvents || 0}</div>
                      <p className="text-sm text-gray-600 mt-1">Total Events</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-purple-600">{eventsData?.totalRegistrations || 0}</div>
                      <p className="text-sm text-gray-600 mt-1">Total Registrations</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">{eventsData?.attendanceRate || 0}%</div>
                      <p className="text-sm text-gray-600 mt-1">Attendance Rate</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-blue-600">
                        {eventsData?.averageAttendance || 0}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Avg Attendance/Event</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Events by Type */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Events by Type</CardTitle>
                      <CardDescription>Distribution of event categories</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={eventsData?.eventsByType || []}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {(eventsData?.eventsByType || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Event Participation Trend */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Participation Trend</CardTitle>
                      <CardDescription>Monthly event registrations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={eventsData?.participationTrend || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="registrations" stroke="#ec4899" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Virtual vs In-Person */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Event Format</CardTitle>
                      <CardDescription>Virtual vs In-person events</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={eventsData?.eventsByFormat || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="format" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#ec4899" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Top Event Topics */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Popular Topics</CardTitle>
                      <CardDescription>Most attended event topics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(eventsData?.popularTopics && eventsData.popularTopics.length > 0) ? eventsData.popularTopics.map((item, index) => {
                          const maxCount = Math.max(...eventsData.popularTopics.map(t => t.count));
                          return (
                            <div key={index} className="flex items-center gap-3">
                              <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium">{item.topic}</span>
                                  <span className="text-sm text-gray-600">{item.count} attendees</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div className={`${item.color} h-2 rounded-full`} style={{ width: `${(item.count / maxCount) * 100}%` }}></div>
                                </div>
                              </div>
                            </div>
                          );
                        }) : (
                          <div className="text-center text-gray-500">No topic data available</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="engagement" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Engagement Metrics</CardTitle>
                    <CardDescription>User engagement and activity levels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Daily Active Users</span>
                          <span className="text-sm text-gray-600">{engagementData?.dailyActivePercentage || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${engagementData?.dailyActivePercentage || 0}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Weekly Active Users</span>
                          <span className="text-sm text-gray-600">{engagementData?.weeklyActivePercentage || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-green-600 h-3 rounded-full" style={{ width: `${engagementData?.weeklyActivePercentage || 0}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Monthly Active Users</span>
                          <span className="text-sm text-gray-600">{engagementData?.monthlyActivePercentage || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-purple-600 h-3 rounded-full" style={{ width: `${engagementData?.monthlyActivePercentage || 0}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default AdminAnalytics;