import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Menu, X, Bell, User, LogOut, Settings, LayoutDashboard, ChevronDown, Network, TrendingUp, Trophy, CreditCard, MapPin, BookOpen } from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';

const MainNavbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Role-based navigation links
  const getRoleBasedNavLinks = () => {
    if (!isAuthenticated) {
      // Unauthenticated users - basic navigation
      return [
        { name: 'Home', path: '/' },
        { name: 'Features', path: '/#features' },
        { name: 'About', path: '/#about' },
      ];
    }

    const role = user?.role;

    switch (role) {
      case 'admin':
        // Admin: Full access to all features
        return [
          { name: 'Dashboard', path: '/dashboard' },
          { name: 'Users', path: '/admin/users' },
          { name: 'Directory', path: '/directory' },
          { name: 'Analytics', path: '/admin/analytics' },
          { name: 'Verifications', path: '/admin/verifications' },
          { name: 'Moderation', path: '/admin/moderation' },
        ];

      case 'alumni':
        // Alumni: Mentorship (as mentor), Directory, Events, Forum, Career features
        return [
          { name: 'Dashboard', path: '/dashboard' },
          { name: 'Directory', path: '/directory' },
          { name: 'Mentorship', path: '/mentorship/dashboard' },
          { name: 'Events', path: '/events' },
          { name: 'Forum', path: '/forum' },
          { name: 'Knowledge', path: '/knowledge' },
        ];

      case 'student':
        // Student: Jobs, Mentorship (as mentee), Events, Forum, Learning
        return [
          { name: 'Dashboard', path: '/dashboard' },
          { name: 'Directory', path: '/directory' },
          { name: 'Jobs', path: '/jobs' },
          { name: 'Mentorship', path: '/mentorship/find' },
          { name: 'Events', path: '/events' },
          { name: 'Forum', path: '/forum' },
        ];

      case 'recruiter':
        // Recruiter: Job management, Directory (for recruitment), Applications
        return [
          { name: 'Dashboard', path: '/dashboard' },
          { name: 'Directory', path: '/directory' },
          { name: 'Post Job', path: '/jobs/post' },
          { name: 'Manage Jobs', path: '/jobs/manage' },
          { name: 'Events', path: '/events' },
        ];

      default:
        return [
          { name: 'Home', path: '/' },
          { name: 'Directory', path: '/directory' },
        ];
    }
  };

  // Role-based advanced features for "More" dropdown
  const getRoleBasedAdvancedFeatures = () => {
    if (!isAuthenticated) {
      return []; // No advanced features for unauthenticated users
    }

    const role = user?.role;
    const allFeatures = [
      { name: 'Skill Graph', path: '/skills/graph', icon: Network, roles: ['admin', 'alumni', 'student', 'recruiter'] },
      { name: 'Career Paths', path: '/career/paths', icon: TrendingUp, roles: ['admin', 'alumni', 'student', 'recruiter'] },
      { name: 'Leaderboard', path: '/leaderboard', icon: Trophy, roles: ['admin', 'alumni', 'student'] },
      { name: 'Alumni Card', path: '/alumni-card', icon: CreditCard, roles: ['admin', 'alumni'] },
      { name: 'Talent Heatmap', path: '/heatmap', icon: MapPin, roles: ['admin', 'alumni', 'student', 'recruiter'] },
      { name: 'Knowledge', path: '/knowledge', icon: BookOpen, roles: ['admin', 'alumni', 'student', 'recruiter'] },
    ];

    // Filter features based on user role
    return allFeatures.filter(feature => feature.roles.includes(role));
  };

  const navLinks = getRoleBasedNavLinks();
  const advancedFeatures = getRoleBasedAdvancedFeatures();

  const isActive = (path) => location.pathname === path;

  const getInitials = (email) => {
    return email ? email.substring(0, 2).toUpperCase() : 'U';
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm" data-testid="main-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" data-testid="navbar-logo">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Alumni Portal</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                data-testid={`nav-${link.name.toLowerCase()}-link`}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            {/* More Dropdown - Only show for authenticated users with advanced features */}
            {isAuthenticated && advancedFeatures.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 flex items-center gap-1"
                    data-testid="nav-more-dropdown"
                  >
                    More
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Advanced Features</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {advancedFeatures.map((feature) => (
                    <DropdownMenuItem key={feature.path} onClick={() => navigate(feature.path)}>
                      <feature.icon className="mr-2 h-4 w-4" />
                      {feature.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Right Side - Auth & User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <NotificationBell />

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center space-x-2 focus:outline-none">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src="" alt={user?.email} />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {getInitials(user?.email)}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user?.email}</span>
                        <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings/notifications')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Notification Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="text-gray-700"
                >
                  Login
                </Button>
                <Button onClick={() => navigate('/register')}>
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-blue-600"
              data-testid="mobile-menu-toggle"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-gray-200"
            data-testid="mobile-menu"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.path)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            {/* Advanced Features Section - Only show for authenticated users with features */}
            {isAuthenticated && advancedFeatures.length > 0 && (
              <div className="pt-4">
                <div className="px-3 py-2 text-sm font-semibold text-gray-500">
                  Advanced Features
                </div>
                {advancedFeatures.map((feature) => (
                  <Link
                    key={feature.path}
                    to={feature.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  >
                    <feature.icon className="mr-2 h-4 w-4" />
                    {feature.name}
                  </Link>
                ))}
              </div>
            )}
            
            {!isAuthenticated && (
              <div className="pt-4 space-y-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full"
                >
                  Login
                </Button>
                <Button
                  onClick={() => {
                    navigate('/register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default MainNavbar;
