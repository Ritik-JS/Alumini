import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import MainNavbar from '@/components/layout/MainNavbar';
import Footer from '@/components/layout/Footer';
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerChildren';
import { ArrowRight, Users, Briefcase, Calendar, Award, MessageSquare, UserCheck, Target, Heart, TrendingUp, Network, Route, Map, CreditCard, BookOpen, BarChart3, Sparkles } from 'lucide-react';

const Home = () => {
  const { isAuth } = useAuth();
  const navigate = useNavigate();

  const stats = [
    { label: 'Active Alumni', value: '5,000+', icon: Users, gradient: 'from-violet-500 to-purple-500' },
    { label: 'Success Stories', value: '1,200+', icon: Award, gradient: 'from-amber-500 to-orange-500' },
    { label: 'Job Placements', value: '800+', icon: Briefcase, gradient: 'from-emerald-500 to-teal-500' },
    { label: 'Events Hosted', value: '200+', icon: Calendar, gradient: 'from-blue-500 to-cyan-500' },
  ];

  const features = [
    {
      icon: Users,
      title: 'Alumni Directory',
      description: 'Connect with thousands of alumni from various industries and locations',
      gradient: 'from-violet-500 to-purple-500',
    },
    {
      icon: Briefcase,
      title: 'Job Portal',
      description: 'Discover exclusive job opportunities posted by alumni and recruiters',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Calendar,
      title: 'Events & Webinars',
      description: 'Attend workshops, conferences, and networking events',
      gradient: 'from-pink-500 to-rose-500',
    },
    {
      icon: UserCheck,
      title: 'Mentorship Program',
      description: 'Get guidance from experienced alumni in your field of interest',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      icon: MessageSquare,
      title: 'Community Forum',
      description: 'Engage in discussions, share knowledge, and build connections',
      gradient: 'from-orange-500 to-amber-500',
    },
    {
      icon: Award,
      title: 'Achievements & Badges',
      description: 'Earn recognition for your contributions and engagement',
      gradient: 'from-indigo-500 to-blue-500',
    },
  ];

  const values = [
    {
      icon: Users,
      title: 'Community First',
      description: 'We believe in the power of community and fostering meaningful connections between alumni, students, and recruiters.',
      color: 'text-violet-600',
      bg: 'bg-violet-100',
    },
    {
      icon: Target,
      title: 'Career Growth',
      description: 'Empowering members to achieve their professional goals through mentorship, job opportunities, and skill development.',
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      icon: Heart,
      title: 'Give Back',
      description: 'Encouraging alumni to share their knowledge and experiences with the next generation of professionals.',
      color: 'text-pink-600',
      bg: 'bg-pink-100',
    },
    {
      icon: TrendingUp,
      title: 'Continuous Learning',
      description: 'Providing access to resources, events, and knowledge that help our community stay ahead in their careers.',
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
  ];

  const innovativeFeatures = [
    {
      icon: Network,
      title: 'Skill Graph AI',
      description: 'Skill matching + relationship network model',
      marketValue: 'Smart talent discovery',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Route,
      title: 'Career Path Engine',
      description: 'Predictive role-transition algorithm',
      marketValue: 'Student success insights',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Map,
      title: 'Talent Heatmap',
      description: 'Spatio-temporal career intelligence',
      marketValue: 'Recruiter targeting',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: CreditCard,
      title: 'Digital Alumni ID',
      description: 'Dynamic credential verification + QR security',
      marketValue: 'Trusted identity layer',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: BookOpen,
      title: 'Knowledge Capsules',
      description: 'Content validation tied to skill graph',
      marketValue: 'Micro-learning marketplace',
      gradient: 'from-indigo-500 to-blue-500',
    },
    {
      icon: BarChart3,
      title: 'Engagement Scoring',
      description: 'Contribution impact measurement',
      marketValue: 'Gamification & retention',
      gradient: 'from-yellow-500 to-orange-500',
    },
  ];

  const detailedFeatures = [
    {
      icon: Users,
      title: 'Alumni Directory',
      description: 'Connect with thousands of alumni across various industries, locations, and career stages. Build your professional network.',
      gradient: 'from-violet-500 to-purple-500',
    },
    {
      icon: Briefcase,
      title: 'Job Portal',
      description: 'Access exclusive job opportunities posted by alumni and top recruiters. Get referrals and increase your chances of landing your dream job.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: UserCheck,
      title: 'Mentorship Program',
      description: 'Get personalized guidance from experienced alumni. Book one-on-one sessions and accelerate your career growth.',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Calendar,
      title: 'Events & Workshops',
      description: 'Attend networking events, technical workshops, webinars, and conferences organized by the community.',
      gradient: 'from-pink-500 to-rose-500',
    },
    {
      icon: MessageSquare,
      title: 'Community Forum',
      description: 'Engage in discussions, ask questions, share knowledge, and learn from the collective wisdom of the community.',
      gradient: 'from-orange-500 to-amber-500',
    },
    {
      icon: Award,
      title: 'Recognition & Badges',
      description: 'Earn badges and recognition for your contributions. Climb the leaderboard and showcase your engagement.',
      gradient: 'from-indigo-500 to-blue-500',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <MainNavbar />

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20 md:py-28 relative overflow-hidden" data-testid="hero-section">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-300/30 to-purple-300/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-300/30 to-cyan-300/30 rounded-full blur-3xl"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl text-center space-y-8 relative z-10"
        >
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-violet-200 rounded-full shadow-sm">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-medium text-violet-900">Welcome to the Future of Alumni Networking</span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight" data-testid="hero-title">
              Connect, Grow, and Succeed Together
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed" data-testid="hero-description">
              Join thousands of alumni, students, and recruiters in building a stronger professional community
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Button 
                size="lg" 
                onClick={() => navigate('/dashboard')} 
                className="text-lg px-8 py-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/50"
                data-testid="go-to-dashboard-btn"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/register')} 
                  className="text-lg px-8 py-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/50"
                  data-testid="get-started-btn"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate('/login')} 
                  className="text-lg px-8 py-6 border-2 border-violet-300 hover:bg-violet-50 hover:border-violet-400"
                  data-testid="sign-in-btn"
                >
                  Sign In
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-white" data-testid="stats-section">
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
                  className="relative group"
                  data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-lg hover:shadow-xl transition-all">
                    <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${stat.gradient} rounded-2xl mb-4 shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-4xl font-bold bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent mb-2">{stat.value}</div>
                    <div className="text-gray-600 font-medium">{stat.label}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Innovative Features Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden" data-testid="innovative-features-section">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-medium text-violet-300">Next-Generation Innovation</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6" data-testid="innovative-features-title">
              Patentable Technology Stack
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Revolutionary features that set us apart with cutting-edge algorithms and intelligent systems
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {innovativeFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                  data-testid={`innovative-feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="relative h-full bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all">
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-gray-400 mb-4 leading-relaxed">{feature.description}</p>
                    <div className="flex items-start gap-2 pt-4 border-t border-white/10">
                      <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mt-1.5"></div>
                      <p className="text-violet-400 font-medium text-sm">{feature.marketValue}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-gradient-to-br from-white via-violet-50/30 to-white" data-testid="features-section">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-4" data-testid="features-title">
              Everything You Need in One Place
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features to help you connect and grow professionally
            </p>
          </motion.div>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <StaggerItem key={index}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="relative h-full p-8 bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all"
                    data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* Mission & Values Section */}
      <section id="about" className="py-24 px-4 bg-white" data-testid="mission-section">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-xl text-gray-600 leading-relaxed max-w-4xl mx-auto">
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
                  className="flex gap-6 p-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all"
                  data-testid={`value-${value.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex-shrink-0">
                    <div className={`w-14 h-14 ${value.bg} rounded-xl flex items-center justify-center shadow-md`}>
                      <Icon className={`w-7 h-7 ${value.color}`} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{value.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50" data-testid="detailed-features-section">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-6">What We Offer</h2>
            <p className="text-xl text-gray-600">
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
                  className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-white/60 shadow-xl hover:shadow-2xl transition-all"
                  data-testid={`detailed-feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-violet-600 via-purple-600 to-blue-600 relative overflow-hidden" data-testid="cta-section">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center space-y-8 relative z-10"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white" data-testid="cta-title">
            Join Our Community Today
          </h2>
          <p className="text-xl text-white/90">
            Be part of a network that's shaping the future of professional growth
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('/dashboard')}
                className="text-lg px-8 py-6 bg-white text-violet-600 hover:bg-gray-100 shadow-xl"
                data-testid="cta-dashboard-btn"
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  onClick={() => navigate('/register')}
                  className="text-lg px-8 py-6 bg-white text-violet-600 hover:bg-gray-100 shadow-xl"
                  data-testid="cta-register-btn"
                >
                  Create Free Account
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="text-lg px-8 py-6 bg-transparent text-white border-2 border-white hover:bg-white/10"
                  data-testid="cta-signin-btn"
                >
                  Sign In
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;