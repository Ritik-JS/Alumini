import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  MessageSquare,
  Settings,
  Award,
  UserCheck,
  Bell,
  Mail,
  FileText,
  Upload,
  Activity,
  BookOpen,
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const studentLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', path: '/profile', icon: UserCheck },
    { name: 'Find Mentors', path: '/mentorship/find', icon: Users },
    { name: 'Browse Jobs', path: '/jobs', icon: Briefcase },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Forum', path: '/forum', icon: MessageSquare },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const alumniLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', path: '/profile', icon: UserCheck },
    { name: 'Mentorship', path: '/mentorship/dashboard', icon: Users },
    { name: 'Mentor Management', path: '/mentorship/manage', icon: Users },
    { name: 'Post Jobs', path: '/jobs/post', icon: Briefcase },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Forum', path: '/forum', icon: MessageSquare },
    { name: 'Leaderboard', path: '/leaderboard', icon: Award },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const recruiterLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Post Job', path: '/jobs/post', icon: Briefcase },
    { name: 'Manage Jobs', path: '/jobs/manage', icon: Briefcase },
    { name: 'Browse Alumni', path: '/directory', icon: Users },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const adminLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Verifications', path: '/admin/verifications', icon: UserCheck },
    { name: 'Content Moderation', path: '/admin/moderation', icon: MessageSquare },
    { name: 'Jobs Management', path: '/admin/jobs', icon: Briefcase },
    { name: 'Events Management', path: '/admin/events', icon: Calendar },
    { name: 'Mentorship Management', path: '/admin/mentorship', icon: Users },
    { name: 'Badge Management', path: '/admin/badges', icon: Award },
    { name: 'Knowledge Capsules', path: '/admin/knowledge-capsules', icon: BookOpen },
    { name: 'Email Queue', path: '/admin/email-queue', icon: Mail },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: FileText },
    { name: 'File Uploads', path: '/admin/file-uploads', icon: Upload },
    { name: 'Analytics', path: '/admin/analytics', icon: Activity },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const getLinks = () => {
    switch (user?.role) {
      case 'student':
        return studentLinks;
      case 'alumni':
        return alumniLinks;
      case 'recruiter':
        return recruiterLinks;
      case 'admin':
        return adminLinks;
      default:
        return studentLinks;
    }
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(link.path)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
