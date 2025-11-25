import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import MainNavbar from '@/components/layout/MainNavbar';
import Footer from '@/components/layout/Footer';
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerChildren';
import { ArrowRight, Users, Briefcase, Calendar, Award, MessageSquare, UserCheck, Target, Heart, TrendingUp } from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const stats = [
    { label: 'Active Alumni', value: '5,000+', icon: Users },
    { label: 'Success Stories', value: '1,200+', icon: Award },
    { label: 'Job Placements', value: '800+', icon: Briefcase },
    { label: 'Events Hosted', value: '200+', icon: Calendar },
  ];

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

  const values = [
    {
      icon: Users,
      title: 'Community First',
      description: 'We believe in the power of community and fostering meaningful connections between alumni, students, and recruiters.',
    },
    {
      icon: Target,
      title: 'Career Growth',
      description: 'Empowering members to achieve their professional goals through mentorship, job opportunities, and skill development.',
    },
    {
      icon: Heart,
      title: 'Give Back',
      description: 'Encouraging alumni to share their knowledge and experiences with the next generation of professionals.',
    },
    {
      icon: TrendingUp,
      title: 'Continuous Learning',
      description: 'Providing access to resources, events, and knowledge that help our community stay ahead in their careers.',
    },
  ];

  const detailedFeatures = [
    {
      icon: Users,
      title: 'Alumni Directory',
      description: 'Connect with thousands of alumni across various industries, locations, and career stages. Build your professional network.',
    },
    {
      icon: Briefcase,
      title: 'Job Portal',
      description: 'Access exclusive job opportunities posted by alumni and top recruiters. Get referrals and increase your chances of landing your dream job.',
    },
    {
      icon: MessageSquare,
      title: 'Mentorship Program',
      description: 'Get personalized guidance from experienced alumni. Book one-on-one sessions and accelerate your career growth.',
    },
    {
      icon: Calendar,
      title: 'Events & Workshops',
      description: 'Attend networking events, technical workshops, webinars, and conferences organized by the community.',
    },
    {
      icon: MessageSquare,
      title: 'Community Forum',
      description: 'Engage in discussions, ask questions, share knowledge, and learn from the collective wisdom of the community.',
    },
    {
      icon: Award,
      title: 'Recognition & Badges',
      description: 'Earn badges and recognition for your contributions. Climb the leaderboard and showcase your engagement.',
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

      {/* Stats Section */}
      <section className="py-16 px-4 bg-gray-50" data-testid="stats-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                  data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 md:py-20 px-4 bg-white" data-testid="features-section">
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

      {/* Mission & Values Section */}
      <section id="about" className="py-20 px-4 bg-white" data-testid="mission-section">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              To create a vibrant ecosystem where alumni can give back, students can learn and grow, 
              and recruiters can find exceptional talent. We're building more than just a platform – 
              we're nurturing a community that thrives on collaboration, mentorship, and mutual success.
            </p>
          </motion.div>

          {/* Values */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4"
                  data-testid={`value-${value.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                    <p className="text-gray-600">{value.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-20 px-4 bg-gray-50" data-testid="detailed-features-section">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">What We Offer</h2>
            <p className="text-lg text-gray-600">
              Comprehensive tools and features to support your professional journey
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {detailedFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow"
                  data-testid={`detailed-feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
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
            Join Our Community Today
          </h2>
          <p className="text-lg sm:text-xl text-blue-100">
            Be part of a network that's shaping the future of professional growth
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
