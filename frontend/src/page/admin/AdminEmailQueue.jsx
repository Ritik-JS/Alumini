import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Mail, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const AdminEmailQueue = () => {
  const { user } = useAuth();
  const [emails, setEmails] = useState([]);
  const [filteredEmails, setFilteredEmails] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    // Mock email queue data
    const mockEmails = [
      {
      id: '1',
      recipient_email: 'student@alumni.edu',
      subject: 'Welcome to AlumUnity',
      body: 'Thank you for joining our alumni network...',
        template_name: 'welcome',
        status: 'pending',
        retry_count: 0,
        scheduled_at: new Date(Date.now() + 3600000).toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        recipient_email: 'alumni@example.com',
        subject: 'Password Reset Request',
        body: 'You requested a password reset...',
        template_name: 'password_reset',
        status: 'sent',
        retry_count: 0,
        scheduled_at: new Date(Date.now() - 3600000).toISOString(),
        sent_at: new Date(Date.now() - 3000000).toISOString(),
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: '3',
        recipient_email: 'recruiter@company.com',
        subject: 'New Job Application Received',
        body: 'A student has applied to your job posting...',
        template_name: 'job_application',
        status: 'sent',
        retry_count: 0,
        scheduled_at: new Date(Date.now() - 7200000).toISOString(),
        sent_at: new Date(Date.now() - 6000000).toISOString(),
        created_at: new Date(Date.now() - 14400000).toISOString(),
      },
      {
        id: '4',
        recipient_email: 'invalid@email',
        subject: 'Event Reminder',
        body: 'Your event starts tomorrow...',
        template_name: 'event_reminder',
        status: 'failed',
        retry_count: 3,
        error_message: 'Invalid email address format',
        scheduled_at: new Date(Date.now() - 10800000).toISOString(),
        created_at: new Date(Date.now() - 14400000).toISOString(),
      },
      {
        id: '5',
        recipient_email: 'mentor@alumni.edu',
        subject: 'New Mentorship Request',
        body: 'A student has requested you as a mentor...',
        template_name: 'mentorship_request',
        status: 'pending',
        retry_count: 0,
        scheduled_at: new Date(Date.now() + 1800000).toISOString(),
        created_at: new Date().toISOString(),
      },
    ];

    setEmails(mockEmails);
    setFilteredEmails(mockEmails);
  }, []);

  useEffect(() => {
    let filtered = emails;

    if (searchQuery) {
      filtered = filtered.filter(
        (e) =>
          e.recipient_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    setFilteredEmails(filtered);
  }, [searchQuery, statusFilter, emails]);

  const handleViewEmail = (emailId) => {
    const email = emails.find((e) => e.id === emailId);
    setSelectedEmail(email);
    setShowEmailModal(true);
  };

  const handleRetryEmail = (emailId) => {
    setEmails(
      emails.map((e) =>
        e.id === emailId ? { ...e, status: 'pending', retry_count: (e.retry_count || 0) + 1 } : e
      )
    );
    toast.success('Email queued for retry');
  };

  const handleDeleteEmail = (emailId) => {
    if (window.confirm('Are you sure you want to delete this email from the queue?')) {
      setEmails(emails.filter((e) => e.id !== emailId));
      toast.success('Email removed from queue');
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'failed':
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  const stats = [
    {
      label: 'Total Queued',
      value: emails.length,
      color: 'text-blue-600',
      icon: Mail,
    },
    {
      label: 'Pending',
      value: emails.filter((e) => e.status === 'pending').length,
      color: 'text-yellow-600',
      icon: Clock,
    },
    {
      label: 'Sent',
      value: emails.filter((e) => e.status === 'sent').length,
      color: 'text-green-600',
      icon: CheckCircle,
    },
    {
      label: 'Failed',
      value: emails.filter((e) => e.status === 'failed').length,
      color: 'text-red-600',
      icon: XCircle,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainNavbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-6 text-white">
              <h1 className="text-3xl font-bold">Email Queue ✉️</h1>
              <p className="mt-2 opacity-90">Monitor and manage email delivery</p>
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

            {/* Email Queue List */}
            <Card>
              <CardHeader>
                <CardTitle>Email Queue</CardTitle>
                <CardDescription>View and manage queued emails</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search by recipient or subject..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="email-search-input"
                      />
                    </div>
                    <div className="flex gap-2">
                      {['all', 'pending', 'sent', 'failed'].map((status) => (
                        <Button
                          key={status}
                          variant={statusFilter === status ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setStatusFilter(status)}
                          className="capitalize"
                          data-testid={`filter-${status}-btn`}
                        >
                          {status}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="pb-3 font-medium text-gray-700">Recipient</th>
                        <th className="pb-3 font-medium text-gray-700">Subject</th>
                        <th className="pb-3 font-medium text-gray-700">Template</th>
                        <th className="pb-3 font-medium text-gray-700">Status</th>
                        <th className="pb-3 font-medium text-gray-700">Scheduled</th>
                        <th className="pb-3 font-medium text-gray-700">Retries</th>
                        <th className="pb-3 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmails.map((email) => {
                        const StatusIcon = getStatusIcon(email.status);
                        return (
                          <tr
                            key={email.id}
                            className="border-b hover:bg-gray-50"
                            data-testid={`email-row-${email.id}`}
                          >
                            <td className="py-4 text-sm font-medium">{email.recipient_email}</td>
                            <td className="py-4 text-sm">{email.subject}</td>
                            <td className="py-4">
                              <Badge variant="outline" className="capitalize">
                                {email.template_name.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="py-4">
                              <Badge className={`capitalize ${getStatusBadgeColor(email.status)}`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {email.status}
                              </Badge>
                            </td>
                            <td className="py-4 text-sm text-gray-600">
                              {new Date(email.scheduled_at).toLocaleString()}
                            </td>
                            <td className="py-4 text-sm">
                              {email.retry_count > 0 ? (
                                <span className="text-orange-600 font-medium">{email.retry_count}</span>
                              ) : (
                                <span className="text-gray-400">0</span>
                              )}
                            </td>
                            <td className="py-4">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewEmail(email.id)}
                                  data-testid={`view-email-${email.id}`}
                                >
                                  View
                                </Button>
                                {email.status === 'failed' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRetryEmail(email.id)}
                                    data-testid={`retry-email-${email.id}`}
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {filteredEmails.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No emails in queue</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Footer />

      {/* Email Details Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Details</DialogTitle>
            <DialogDescription>Complete email information</DialogDescription>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recipient</p>
                  <p className="text-sm mt-1">{selectedEmail.recipient_email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <Badge className={`mt-1 ${getStatusBadgeColor(selectedEmail.status)}`}>
                    {selectedEmail.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Template</p>
                  <p className="text-sm mt-1 capitalize">{selectedEmail.template_name.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Retry Count</p>
                  <p className="text-sm mt-1">{selectedEmail.retry_count}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Subject</p>
                <p className="text-sm mt-1 font-medium">{selectedEmail.subject}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Body</p>
                <div className="p-3 bg-gray-50 rounded border text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedEmail.body}
                </div>
              </div>

              {selectedEmail.error_message && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm font-medium text-red-800 mb-1">Error Message</p>
                  <p className="text-sm text-red-700">{selectedEmail.error_message}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm">{new Date(selectedEmail.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Scheduled</p>
                  <p className="text-sm">{new Date(selectedEmail.scheduled_at).toLocaleString()}</p>
                </div>
                {selectedEmail.sent_at && (
                  <div>
                    <p className="text-xs text-gray-500">Sent</p>
                    <p className="text-sm">{new Date(selectedEmail.sent_at).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {selectedEmail.status === 'failed' && (
                <Button
                  className="w-full"
                  onClick={() => {
                    handleRetryEmail(selectedEmail.id);
                    setShowEmailModal(false);
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Sending
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEmailQueue;