import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import MainNavbar from '@/components/layout/MainNavbar';
import Footer from '@/components/layout/Footer';
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerChildren';
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
      <section className="flex-1 flex items-center justify-center px-4 py-12 md:py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50" data-testid="hero-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl text-center space-y-8"
        >
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900" data-testid="hero-title">
              Connect, Grow, and Succeed Together
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto" data-testid="hero-description">
              Join thousands of alumni, students, and recruiters in building a stronger professional community
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/register')} 
              className="text-base sm:text-lg px-6 sm:px-8"
              data-testid="get-started-btn"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/login')} 
              className="text-base sm:text-lg px-6 sm:px-8"
              data-testid="sign-in-btn"
            >
              Sign In
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="pt-8"
          >
            <p className="text-sm text-gray-500 mb-4">Trusted by alumni worldwide</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-8 opacity-70">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600" data-testid="stat-alumni">5,000+</div>
                <div className="text-sm text-gray-600">Alumni</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600" data-testid="stat-jobs">500+</div>
                <div className="text-sm text-gray-600">Jobs Posted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600" data-testid="stat-events">200+</div>
                <div className="text-sm text-gray-600">Events</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20 px-4 bg-white" data-testid="features-section">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4" data-testid="features-title">
              Everything You Need in One Place
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Powerful features to help you connect and grow professionally
            </p>
          </motion.div>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <StaggerItem key={index}>
                  <motion.div
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow h-full"
                    data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 px-4 bg-gradient-to-br from-blue-600 to-blue-700" data-testid="cta-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white" data-testid="cta-title">
            Ready to Get Started?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100">
            Join our community today and unlock endless opportunities
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/register')}
              className="text-base sm:text-lg px-6 sm:px-8"
              data-testid="cta-register-btn"
            >
              Create Free Account
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/login')}
              className="text-base sm:text-lg px-6 sm:px-8 bg-transparent text-white border-white hover:bg-white hover:text-blue-600"
              data-testid="cta-signin-btn"
            >
              Sign In
            </Button>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
