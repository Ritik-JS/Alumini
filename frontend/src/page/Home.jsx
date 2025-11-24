import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import MainNavbar from '@/components/layout/MainNavbar';
import Footer from '@/components/layout/Footer';
import { ArrowRight, Users, Briefcase, Calendar, Award, MessageSquare, UserCheck } from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const features = [
    {
      icon: Users,
      title: 'Alumni Directory',
      description: 'Connect with thousands of alumni from various industries and locations',
    },
    {
      icon: Briefcase,
      title: 'Job Portal',
      description: 'Discover exclusive job opportunities posted by alumni and recruiters',
    },
    {
      icon: Calendar,
      title: 'Events & Webinars',
      description: 'Attend workshops, conferences, and networking events',
    },
    {
      icon: UserCheck,
      title: 'Mentorship Program',
      description: 'Get guidance from experienced alumni in your field of interest',
    },
    {
      icon: MessageSquare,
      title: 'Community Forum',
      description: 'Engage in discussions, share knowledge, and build connections',
    },
    {
      icon: Award,
      title: 'Achievements & Badges',
      description: 'Earn recognition for your contributions and engagement',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <MainNavbar />

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
              Connect, Grow, and Succeed Together
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of alumni, students, and recruiters in building a stronger professional community
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/register')} className="text-lg px-8">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="text-lg px-8">
              Sign In
            </Button>
          </div>

          <div className="pt-8">
            <p className="text-sm text-gray-500 mb-4">Trusted by alumni worldwide</p>
            <div className="flex justify-center items-center space-x-8 opacity-70">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">5,000+</div>
                <div className="text-sm text-gray-600">Alumni</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">500+</div>
                <div className="text-sm text-gray-600">Jobs Posted</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">200+</div>
                <div className="text-sm text-gray-600">Events</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features to help you connect and grow professionally
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold text-white">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100">
            Join our community today and unlock endless opportunities
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/register')}
              className="text-lg px-8"
            >
              Create Free Account
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/login')}
              className="text-lg px-8 bg-transparent text-white border-white hover:bg-white hover:text-blue-600"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
