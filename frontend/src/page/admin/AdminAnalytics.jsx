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
} from 'lucide-react';
import mockData from '@/mockdata.json';

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

  useEffect(() => {
    // Calculate analytics from mock data
    const calculateAnalytics = () => {
      const users = mockData.users || [];
      const jobs = mockData.jobs || [];
      const events = mockData.events || [];
      const posts = mockData.forum_posts || [];
      const profiles = mockData.alumni_profiles || [];

      setAnalyticsData({
        totalUsers: users.length,
        activeUsers: Math.floor(users.length * 0.7), // Mock: 70% active
        totalJobs: jobs.length,
        totalEvents: events.length,
        totalPosts: posts.length,
        verifiedAlumni: profiles.filter((p) => p.is_verified).length,
      });
    };

    calculateAnalytics();
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
              <TabsList>
                <TabsTrigger value="overview" data-testid="tab-overview">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="users" data-testid="tab-users">
                  Users
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

              <TabsContent value="users" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Distribution</CardTitle>
                    <CardDescription>Breakdown by user roles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['student', 'alumni', 'recruiter', 'admin'].map((role) => {
                        const count = mockData.users?.filter((u) => u.role === role).length || 0;
                        const percentage =
                          analyticsData.totalUsers > 0
                            ? Math.round((count / analyticsData.totalUsers) * 100)
                            : 0;
                        return (
                          <div key={role} className="text-center p-6 border rounded-lg">
                            <div className="text-3xl font-bold text-blue-600">{count}</div>
                            <div className="text-sm text-gray-600 mt-2 capitalize">{role}s</div>
                            <div className="text-xs text-gray-500 mt-1">{percentage}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
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