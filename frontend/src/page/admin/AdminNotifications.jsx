import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Plus, Edit, Trash2, MoreVertical, Eye, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { adminService } from '@/services';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { toast } from 'sonner';

const AdminNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'system',
    title: '',
    message: '',
    link: '',
    priority: 'medium',
    targetUsers: 'all',
  });

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminService.getAllNotifications();
      setNotifications(result.data || []);
      setFilteredNotifications(result.data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError('Unable to connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    let filtered = notifications;

    if (searchQuery) {
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((n) => n.type === typeFilter);
    }

    setFilteredNotifications(filtered);
  }, [searchQuery, typeFilter, notifications]);

  const handleCreateNotification = async () => {
    if (!formData.title || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const notificationData = {
        user_id: formData.targetUsers === 'all' ? 'broadcast' : formData.targetUsers,
        type: formData.type,
        title: formData.title,
        message: formData.message,
        link: formData.link,
        priority: formData.priority,
      };

      await adminService.createNotification(notificationData);
      toast.success('Notification created and sent successfully');
      setShowCreateModal(false);
      resetForm();
      loadNotifications();
    } catch (error) {
      console.error('Error creating notification:', error);
      toast.error('Unable to create notification. Please try again.');
    }
  };

  const handleEditNotification = (notification) => {
    setEditingNotification(notification);
    setFormData({
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link || '',
      priority: notification.priority,
      targetUsers: notification.user_id === 'broadcast' ? 'all' : notification.user_id,
    });
    setShowCreateModal(true);
  };

  const handleUpdateNotification = async () => {
    if (!formData.title || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const updateData = {
        type: formData.type,
        title: formData.title,
        message: formData.message,
        link: formData.link,
        priority: formData.priority,
      };

      await adminService.updateNotification(editingNotification.id, updateData);
      toast.success('Notification updated successfully');
      setShowCreateModal(false);
      setEditingNotification(null);
      resetForm();
      loadNotifications();
    } catch (error) {
      console.error('Error updating notification:', error);
      toast.error('Unable to update notification. Please try again.');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await adminService.deleteNotification(notificationId);
        toast.success('Notification deleted successfully');
        loadNotifications();
      } catch (error) {
        console.error('Error deleting notification:', error);
        toast.error('Unable to delete notification. Please try again.');
      }
    }
  };

  const handleViewDetails = (notification) => {
    setSelectedNotification(notification);
    setShowDetailsModal(true);
  };

  const handleResendNotification = async (notificationId) => {
    try {
      await adminService.resendNotification(notificationId);
      toast.success('Notification resent successfully');
    } catch (error) {
      console.error('Error resending notification:', error);
      toast.error('Unable to resend notification. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'system',
      title: '',
      message: '',
      link: '',
      priority: 'medium',
      targetUsers: 'all',
    });
    setEditingNotification(null);
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'profile':
        return 'bg-blue-100 text-blue-800';
      case 'mentorship':
        return 'bg-green-100 text-green-800';
      case 'job':
        return 'bg-purple-100 text-purple-800';
      case 'event':
        return 'bg-orange-100 text-orange-800';
      case 'forum':
        return 'bg-pink-100 text-pink-800';
      case 'system':
        return 'bg-red-100 text-red-800';
      case 'verification':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = [
    { label: 'Total Sent', value: notifications.length, color: 'text-blue-600', icon: Bell },
    { label: 'System', value: notifications.filter((n) => n.type === 'system').length, color: 'text-red-600', icon: AlertCircle },
    { label: 'High Priority', value: notifications.filter((n) => n.priority === 'high').length, color: 'text-red-600', icon: AlertCircle },
    { label: 'Read', value: notifications.filter((n) => n.is_read).length, color: 'text-green-600', icon: CheckCircle },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <MainNavbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6">
            <LoadingSpinner message="Loading notifications..." />
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
            <ErrorMessage message={error} onRetry={loadNotifications} />
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
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg p-6 text-white">
              <h1 className="text-3xl font-bold">Notification Management 🔔</h1>
              <p className="mt-2 opacity-90">Create and manage system notifications</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                          <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
                        </div>
                        <Icon className={`w-8 h-8 ${stat.color} opacity-50`} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Notifications List */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>System Notifications</CardTitle>
                    <CardDescription>Create and manage notifications for users</CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      resetForm();
                      setShowCreateModal(true);
                    }}
                    data-testid="create-notification-btn"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Notification
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="space-y-4 mb-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Search notifications..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        data-testid="notification-search-input"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {['all', 'system', 'profile', 'mentorship', 'job', 'event', 'forum', 'verification'].map((type) => (
                        <Button
                          key={type}
                          variant={typeFilter === type ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTypeFilter(type)}
                          className="capitalize"
                          data-testid={`filter-${type}-btn`}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Notifications Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="pb-3 font-medium text-gray-700">Title</th>
                        <th className="pb-3 font-medium text-gray-700">Type</th>
                        <th className="pb-3 font-medium text-gray-700">Priority</th>
                        <th className="pb-3 font-medium text-gray-700">Recipient</th>
                        <th className="pb-3 font-medium text-gray-700">Status</th>
                        <th className="pb-3 font-medium text-gray-700">Created</th>
                        <th className="pb-3 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredNotifications.map((notification) => (
                        <tr
                          key={notification.id}
                          className="border-b hover:bg-gray-50"
                          data-testid={`notification-row-${notification.id}`}
                        >
                          <td className="py-4">
                            <div>
                              <p className="font-medium">{notification.title}</p>
                              <p className="text-xs text-gray-500 truncate max-w-xs">
                                {notification.message}
                              </p>
                            </div>
                          </td>
                          <td className="py-4">
                            <Badge className={`capitalize ${getTypeBadgeColor(notification.type)}`}>
                              {notification.type}
                            </Badge>
                          </td>
                          <td className="py-4">
                            <Badge className={`capitalize ${getPriorityBadgeColor(notification.priority)}`}>
                              {notification.priority}
                            </Badge>
                          </td>
                          <td className="py-4 text-sm">
                            {notification.user_id === 'broadcast'
                              ? 'All Users'
                              : notification.user?.email || 'Unknown'}
                          </td>
                          <td className="py-4">
                            <Badge variant={notification.is_read ? 'outline' : 'default'}>
                              {notification.is_read ? 'Read' : 'Unread'}
                            </Badge>
                          </td>
                          <td className="py-4 text-sm text-gray-600">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" data-testid={`notification-actions-${notification.id}`}>
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleViewDetails(notification)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditNotification(notification)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleResendNotification(notification.id)}>
                                  <Send className="mr-2 h-4 w-4" />
                                  Resend
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteNotification(notification.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredNotifications.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No notifications found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Footer />

      {/* Create/Edit Notification Modal */}
      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingNotification ? 'Edit Notification' : 'Create New Notification'}</DialogTitle>
            <DialogDescription>
              {editingNotification ? 'Update notification details' : 'Send a new notification to users'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger data-testid="notification-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="profile">Profile</SelectItem>
                    <SelectItem value="mentorship">Mentorship</SelectItem>
                    <SelectItem value="job">Job</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="forum">Forum</SelectItem>
                    <SelectItem value="verification">Verification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger data-testid="notification-priority-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Notification title"
                data-testid="notification-title-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Notification message"
                rows={4}
                data-testid="notification-message-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link">Link (Optional)</Label>
              <Input
                id="link"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="/page/path or https://..."
                data-testid="notification-link-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetUsers">Send To</Label>
              <Select value={formData.targetUsers} onValueChange={(value) => setFormData({ ...formData, targetUsers: value })}>
                <SelectTrigger data-testid="notification-target-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="students">All Students</SelectItem>
                  <SelectItem value="alumni">All Alumni</SelectItem>
                  <SelectItem value="recruiters">All Recruiters</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={editingNotification ? handleUpdateNotification : handleCreateNotification}
              data-testid="save-notification-btn"
            >
              <Send className="w-4 h-4 mr-2" />
              {editingNotification ? 'Update' : 'Send'} Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Notification Details</DialogTitle>
            <DialogDescription>Complete notification information</DialogDescription>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Type</p>
                  <Badge className={`mt-1 ${getTypeBadgeColor(selectedNotification.type)}`}>
                    {selectedNotification.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Priority</p>
                  <Badge className={`mt-1 ${getPriorityBadgeColor(selectedNotification.priority)}`}>
                    {selectedNotification.priority}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Title</p>
                <p className="text-lg font-bold mt-1">{selectedNotification.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Message</p>
                <p className="text-sm mt-1">{selectedNotification.message}</p>
              </div>
              {selectedNotification.link && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Link</p>
                  <p className="text-sm mt-1 text-blue-600">{selectedNotification.link}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-500">Recipient</p>
                  <p className="text-sm">
                    {selectedNotification.user_id === 'broadcast'
                      ? 'All Users'
                      : selectedNotification.user?.email || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <Badge variant={selectedNotification.is_read ? 'outline' : 'default'}>
                    {selectedNotification.is_read ? 'Read' : 'Unread'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm">{new Date(selectedNotification.created_at).toLocaleString()}</p>
                </div>
                {selectedNotification.read_at && (
                  <div>
                    <p className="text-xs text-gray-500">Read At</p>
                    <p className="text-sm">{new Date(selectedNotification.read_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNotifications;
