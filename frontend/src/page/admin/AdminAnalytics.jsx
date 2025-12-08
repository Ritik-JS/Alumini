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
import { analyticsService } from '@/services';
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
    jobsData: {},
    eventsData: {},
    mentorshipData: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await analyticsService.getDashboardStats();
      
      if (result.success) {
        setAnalyticsData(result.data || {
          totalUsers: 0,
          activeUsers: 0,
          totalJobs: 0,
          totalEvents: 0,
          totalPosts: 0,
          verifiedAlumni: 0,
          jobsData: {},
          eventsData: {},
          mentorshipData: {},
        });
      } else {
        setError(result.error || 'Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Unable to connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const engagementMetrics = [
    {
      title: 'Total Users',
      value: analyticsData.totalUsers,
      change: '+12%',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Users',
      value: analyticsData.activeUsers,
      change: '+8%',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Verified Alumni',
      value: analyticsData.verifiedAlumni,
      change: '+15%',
      icon: UserCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Total Jobs',
      value: analyticsData.totalJobs,
      change: '+20%',
      icon: Briefcase,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Total Events',
      value: analyticsData.totalEvents,
      change: '+5%',
      icon: Calendar,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
    {
      title: 'Forum Posts',
      value: analyticsData.totalPosts,
      change: '+25%',
      icon: MessageSquare,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
  ];

  const userGrowthData = [
    { month: 'Jan', users: 45 },
    { month: 'Feb', users: 52 },
    { month: 'Mar', users: 61 },
    { month: 'Apr', users: 70 },
    { month: 'May', users: 85 },
    { month: 'Jun', users: 98 },
  ];

  const topContributors = [
    { name: 'John Doe', email: 'john.doe@alumni.edu', contributions: 45, type: 'Posts' },
    { name: 'Jane Smith', email: 'jane.smith@alumni.edu', contributions: 38, type: 'Events' },
    { name: 'Mike Johnson', email: 'mike.j@alumni.edu', contributions: 32, type: 'Mentorship' },
    { name: 'Sarah Williams', email: 'sarah.w@alumni.edu', contributions: 28, type: 'Jobs' },
    { name: 'David Brown', email: 'david.b@alumni.edu', contributions: 25, type: 'Posts' },
  ];

  const platformActivity = [
    { activity: 'New user registration', count: 156, trend: '+12%' },
    { activity: 'Job applications', count: 234, trend: '+18%' },
    { activity: 'Event RSVPs', count: 189, trend: '+8%' },
    { activity: 'Forum posts created', count: 92, trend: '+25%' },
    { activity: 'Mentorship requests', count: 67, trend: '+15%' },
    { activity: 'Profile views', count: 1243, trend: '+10%' },
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
            <ErrorMessage message={error} onRetry={loadAnalytics} />
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
                      {userGrowthData.map((data, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:opacity-80"
                            style={{ height: `${(data.users / 100) * 100}%` }}
                          ></div>
                          <div className="text-sm font-medium mt-2">{data.month}</div>
                          <div className="text-xs text-gray-600">{data.users}</div>
                        </div>
                      ))}
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
                        {platformActivity.map((item, index) => (
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
                        ))}
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
                        {topContributors.map((contributor, index) => (
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
                        ))}
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
                        <BarChart data={[
                          { location: 'San Francisco', count: 3 },
                          { location: 'Seattle', count: 1 },
                          { location: 'Los Angeles', count: 1 },
                          { location: 'Boston', count: 0 },
                          { location: 'New York', count: 0 },
                        ]} layout="vertical">
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
                        <BarChart data={[
                          { company: 'Google', count: 1 },
                          { company: 'Amazon', count: 1 },
                          { company: 'Airbnb', count: 1 },
                          { company: 'Netflix', count: 1 },
                          { company: 'Other', count: 1 },
                        ]} layout="vertical">
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
                        {[
                          { skill: 'JavaScript', count: 3, color: 'bg-yellow-500' },
                          { skill: 'Python', count: 4, color: 'bg-blue-500' },
                          { skill: 'React', count: 2, color: 'bg-cyan-500' },
                          { skill: 'Machine Learning', count: 2, color: 'bg-purple-500' },
                          { skill: 'UX Design', count: 2, color: 'bg-pink-500' },
                          { skill: 'AWS', count: 2, color: 'bg-orange-500' },
                        ].map((item, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium">{item.skill}</span>
                                <span className="text-sm text-gray-600">{item.count} alumni</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className={`${item.color} h-2 rounded-full`} style={{ width: `${(item.count / 4) * 100}%` }}></div>
                              </div>
                            </div>
                          </div>
                        ))}
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
                        <BarChart data={[
                          { year: '2018', count: 2 },
                          { year: '2019', count: 2 },
                          { year: '2020', count: 0 },
                          { year: '2021', count: 0 },
                          { year: '2022', count: 0 },
                        ]}>
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
                      <div className="text-2xl font-bold text-blue-600">{analyticsData.totalJobs}</div>
                      <p className="text-sm text-gray-600 mt-1">Total Jobs Posted</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">{analyticsData.jobsData?.totalApplications || 0}</div>
                      <p className="text-sm text-gray-600 mt-1">Applications</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-purple-600">
                        {analyticsData.totalJobs > 0 ? ((analyticsData.jobsData?.totalApplications || 0) / analyticsData.totalJobs).toFixed(1) : 0}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Avg Applications/Job</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-orange-600">{analyticsData.jobsData?.avgDaysToHire || 3.2}</div>
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
                            data={[
                              { name: 'Full-time', value: 4, color: '#3b82f6' },
                              { name: 'Internship', value: 1, color: '#10b981' },
                              { name: 'Part-time', value: 0, color: '#f59e0b' },
                              { name: 'Contract', value: 0, color: '#8b5cf6' },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[
                              { name: 'Full-time', value: 4, color: '#3b82f6' },
                              { name: 'Internship', value: 1, color: '#10b981' },
                              { name: 'Part-time', value: 0, color: '#f59e0b' },
                              { name: 'Contract', value: 0, color: '#8b5cf6' },
                            ].map((entry, index) => (
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
                        <BarChart data={[
                          { location: 'San Francisco', jobs: 1 },
                          { location: 'Remote', jobs: 1 },
                          { location: 'Boston', jobs: 1 },
                          { location: 'Austin', jobs: 1 },
                          { location: 'New York', jobs: 1 },
                        ]} layout="vertical">
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
                        <LineChart data={[
                          { week: 'Week 1', applications: 3 },
                          { week: 'Week 2', applications: 8 },
                          { week: 'Week 3', applications: 12 },
                          { week: 'Week 4', applications: 18 },
                        ]}>
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
                        <BarChart data={[
                          { skill: 'JavaScript', count: 3 },
                          { skill: 'Python', count: 4 },
                          { skill: 'React', count: 3 },
                          { skill: 'AWS', count: 3 },
                          { skill: 'Docker', count: 2 },
                        ]}>
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
                      <div className="text-2xl font-bold text-purple-600">{analyticsData.mentorshipData?.totalRequests || 0}</div>
                      <p className="text-sm text-gray-600 mt-1">Total Mentorships</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-blue-600">{analyticsData.mentorshipData?.activeMentors || 0}</div>
                      <p className="text-sm text-gray-600 mt-1">Active Mentors</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">{analyticsData.mentorshipData?.totalSessions || 0}</div>
                      <p className="text-sm text-gray-600 mt-1">Sessions Completed</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-yellow-600">{analyticsData.mentorshipData?.avgRating || 4.8}</div>
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
                            data={[
                              { name: 'Accepted', value: 8, color: '#10b981' },
                              { name: 'Pending', value: 3, color: '#f59e0b' },
                              { name: 'Rejected', value: 1, color: '#ef4444' },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[
                              { name: 'Accepted', value: 8, color: '#10b981' },
                              { name: 'Pending', value: 3, color: '#f59e0b' },
                              { name: 'Rejected', value: 1, color: '#ef4444' },
                            ].map((entry, index) => (
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
                        <AreaChart data={[
                          { month: 'Jul', sessions: 5 },
                          { month: 'Aug', sessions: 8 },
                          { month: 'Sep', sessions: 12 },
                          { month: 'Oct', sessions: 15 },
                          { month: 'Nov', sessions: 20 },
                          { month: 'Dec', sessions: 25 },
                        ]}>
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
                        <BarChart data={[
                          { area: 'Career', count: 12 },
                          { area: 'Technical', count: 10 },
                          { area: 'Leadership', count: 6 },
                          { area: 'Networking', count: 5 },
                          { area: 'Interview', count: 8 },
                        ]}>
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
                        <BarChart data={[
                          { stars: '5 stars', count: 18 },
                          { stars: '4 stars', count: 5 },
                          { stars: '3 stars', count: 2 },
                          { stars: '2 stars', count: 0 },
                          { stars: '1 star', count: 0 },
                        ]} layout="vertical">
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
                      <div className="text-2xl font-bold text-pink-600">{analyticsData.totalEvents}</div>
                      <p className="text-sm text-gray-600 mt-1">Total Events</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-purple-600">{analyticsData.eventsData?.totalRegistrations || 0}</div>
                      <p className="text-sm text-gray-600 mt-1">Total Registrations</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">{analyticsData.eventsData?.attendanceRate || 78}%</div>
                      <p className="text-sm text-gray-600 mt-1">Attendance Rate</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-blue-600">
                        {analyticsData.totalEvents > 0 ? Math.round((analyticsData.eventsData?.totalRegistrations || 0) / analyticsData.totalEvents) : 0}
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
                            data={[
                              { name: 'Workshop', value: 2, color: '#3b82f6' },
                              { name: 'Webinar', value: 2, color: '#10b981' },
                              { name: 'Meetup', value: 2, color: '#f59e0b' },
                              { name: 'Conference', value: 1, color: '#8b5cf6' },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[
                              { name: 'Workshop', value: 2, color: '#3b82f6' },
                              { name: 'Webinar', value: 2, color: '#10b981' },
                              { name: 'Meetup', value: 2, color: '#f59e0b' },
                              { name: 'Conference', value: 1, color: '#8b5cf6' },
                            ].map((entry, index) => (
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
                        <LineChart data={[
                          { month: 'Jul', registrations: 35 },
                          { month: 'Aug', registrations: 48 },
                          { month: 'Sep', registrations: 62 },
                          { month: 'Oct', registrations: 78 },
                          { month: 'Nov', registrations: 95 },
                          { month: 'Dec', registrations: 112 },
                        ]}>
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
                        <BarChart data={[
                          { format: 'Virtual', count: 4 },
                          { format: 'In-person', count: 2 },
                          { format: 'Hybrid', count: 1 },
                        ]}>
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
                        {[
                          { topic: 'Career Development', count: 145, color: 'bg-blue-500' },
                          { topic: 'Technology Trends', count: 128, color: 'bg-green-500' },
                          { topic: 'Networking', count: 112, color: 'bg-purple-500' },
                          { topic: 'Entrepreneurship', count: 98, color: 'bg-orange-500' },
                          { topic: 'Industry Insights', count: 85, color: 'bg-pink-500' },
                        ].map((item, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium">{item.topic}</span>
                                <span className="text-sm text-gray-600">{item.count} attendees</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className={`${item.color} h-2 rounded-full`} style={{ width: `${(item.count / 145) * 100}%` }}></div>
                              </div>
                            </div>
                          </div>
                        ))}
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
                          <span className="text-sm text-gray-600">65%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-blue-600 h-3 rounded-full" style={{ width: '65%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Weekly Active Users</span>
                          <span className="text-sm text-gray-600">82%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-green-600 h-3 rounded-full" style={{ width: '82%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Monthly Active Users</span>
                          <span className="text-sm text-gray-600">94%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-purple-600 h-3 rounded-full" style={{ width: '94%' }}></div>
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