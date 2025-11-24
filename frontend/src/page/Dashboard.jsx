import { useAuth } from '@/contexts/AuthContext';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, Calendar, Award } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Profile Views',
      value: '1,234',
      icon: Users,
      change: '+12%',
      changeType: 'positive',
    },
    {
      title: 'Applications',
      value: '8',
      icon: Briefcase,
      change: '+3 new',
      changeType: 'positive',
    },
    {
      title: 'Events Attended',
      value: '15',
      icon: Calendar,
      change: '2 upcoming',
      changeType: 'neutral',
    },
    {
      title: 'Engagement Score',
      value: '485',
      icon: Award,
      change: 'Rank #1',
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
              <p className="text-gray-600 mt-1">
                Logged in as <span className="font-medium">{user?.email}</span> ({user?.role})
              </p>
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
                <CardDescription>
                  Get started with these common tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <div className="text-sm font-medium text-gray-900">Complete Profile</div>
                    <div className="text-xs text-gray-500 mt-1">Add your experience and skills</div>
                  </button>
                  <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <div className="text-sm font-medium text-gray-900">Browse Jobs</div>
                    <div className="text-xs text-gray-500 mt-1">Find your next opportunity</div>
                  </button>
                  <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <div className="text-sm font-medium text-gray-900">Find a Mentor</div>
                    <div className="text-xs text-gray-500 mt-1">Connect with experienced alumni</div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest interactions on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Profile updated</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Applied to Frontend Developer position</p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">RSVP'd to Machine Learning Workshop</p>
                      <p className="text-xs text-gray-500">3 days ago</p>
                    </div>
                  </div>
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

export default Dashboard;
