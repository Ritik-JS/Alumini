import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Shield, User, Settings, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import apiAdminService from '@/services/apiAdminService';

const AdminAuditLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [total, setTotal] = useState(0);

  // Fetch audit logs from API
  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        limit: 100,
        offset: 0,
        days: 30,
      };

      // Add filters if set
      if (actionTypeFilter !== 'all') {
        params.action_type = actionTypeFilter;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await apiAdminService.getAuditLogs(params);
      
      if (response.success) {
        setLogs(response.data || []);
        setTotal(response.total || 0);
      } else {
        toast.error('Failed to fetch audit logs');
        setLogs([]);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error(error.response?.data?.detail || 'Failed to fetch audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, actionTypeFilter]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const handleExportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Admin', 'Action Type', 'Target', 'Description', 'IP Address'],
      ...logs.map((log) => [
        new Date(log.timestamp).toLocaleString(),
        log.admin_email || 'N/A',
        log.action_type,
        `${log.target_type}:${log.target_id}`,
        log.description,
        log.ip_address || 'N/A',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Audit logs exported successfully');
  };

  const getActionTypeColor = (actionType) => {
    switch (actionType) {
      case 'user_management':
        return 'bg-blue-100 text-blue-800';
      case 'content_moderation':
        return 'bg-red-100 text-red-800';
      case 'verification':
        return 'bg-green-100 text-green-800';
      case 'system_config':
        return 'bg-purple-100 text-purple-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionTypeIcon = (actionType) => {
    switch (actionType) {
      case 'user_management':
        return User;
      case 'content_moderation':
        return Shield;
      case 'verification':
        return FileText;
      case 'system_config':
        return Settings;
      default:
        return FileText;
    }
  };

  const stats = [
    {
      label: 'Total Actions',
      value: logs.length,
      color: 'text-blue-600',
      icon: FileText,
    },
    {
      label: 'User Management',
      value: logs.filter((l) => l.action_type === 'user_management').length,
      color: 'text-green-600',
      icon: User,
    },
    {
      label: 'Moderation',
      value: logs.filter((l) => l.action_type === 'content_moderation').length,
      color: 'text-red-600',
      icon: Shield,
    },
    {
      label: 'Today',
      value: logs.filter((l) => new Date(l.timestamp).toDateString() === new Date().toDateString()).length,
      color: 'text-purple-600',
      icon: FileText,
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
            <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-lg p-6 text-white">
              <h1 className="text-3xl font-bold">Audit Logs 📋</h1>
              <p className="mt-2 opacity-90">Track all administrative actions</p>
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

            {/* Logs List */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Audit Log History</CardTitle>
                    <CardDescription>Complete history of administrative actions</CardDescription>
                  </div>
                  <Button onClick={handleExportLogs} variant="outline" data-testid="export-logs-btn">
                    <Download className="w-4 h-4 mr-2" />
                    Export Logs
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search by description or admin..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="log-search-input"
                      />
                    </div>
                    <div className="flex gap-2">
                      {['all', 'user_management', 'content_moderation', 'verification', 'system_config', 'other'].map(
                        (type) => (
                          <Button
                            key={type}
                            variant={actionTypeFilter === type ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActionTypeFilter(type)}
                            className="capitalize"
                            data-testid={`filter-${type}-btn`}
                          >
                            {type.replace('_', ' ')}
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading audit logs...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log) => {
                      const ActionIcon = getActionTypeIcon(log.action_type);
                      return (
                        <div
                          key={log.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          data-testid={`log-item-${log.id}`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg ${getActionTypeColor(log.action_type)} bg-opacity-20`}>
                              <ActionIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-medium text-gray-900">{log.description}</p>
                                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                    <span>by {log.admin_email || log.admin_name || 'Unknown Admin'}</span>
                                    <span>•</span>
                                    <span>IP: {log.ip_address || 'N/A'}</span>
                                    <span>•</span>
                                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                                  </div>
                                </div>
                                <Badge className={getActionTypeColor(log.action_type)}>
                                  {log.action_type.replace('_', ' ')}
                                </Badge>
                              </div>
                              {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                  <span className="font-medium text-gray-600">Metadata:</span>
                                  <code className="ml-2 text-gray-700">
                                    {JSON.stringify(log.metadata)}
                                  </code>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {logs.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No audit logs found</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default AdminAuditLogs;