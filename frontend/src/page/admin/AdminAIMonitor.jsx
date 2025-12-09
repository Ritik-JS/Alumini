import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AISystemCard from '@/components/admin/AISystemCard';
import { aiMonitorService } from '@/services';
import { toast } from 'sonner';
import {
  Activity,
  Brain,
  AlertCircle,
  Download,
  RefreshCw,
  Trash2,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const AdminAIMonitor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [systems, setSystems] = useState([]);
  const [overallHealth, setOverallHealth] = useState(0);
  const [processingQueue, setProcessingQueue] = useState(null);
  const [errorLogs, setErrorLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [systemDetails, setSystemDetails] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    queue: true,
    errors: false,
    alerts: true,
  });

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [systemsRes, queueRes, errorsRes, alertsRes] = await Promise.all([
        aiMonitorService.getAllSystemsStatus(),
        aiMonitorService.getProcessingQueue(),
        aiMonitorService.getErrorLogs(),
        aiMonitorService.getSystemAlerts(),
      ]);

      if (systemsRes.success) {
        setSystems(systemsRes.data.systems);
        setOverallHealth(systemsRes.data.overallHealth);
      }

      if (queueRes.success) {
        setProcessingQueue(queueRes.data);
      }

      if (errorsRes.success) {
        setErrorLogs(errorsRes.data.errors.slice(0, 10));
      }

      if (alertsRes.success) {
        setAlerts(alertsRes.data.alerts);
      }
    } catch (error) {
      console.error('Error loading AI monitor data:', error);
      toast.error('Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    toast.info('Refreshing data...');
    loadAllData();
  };

  const handleViewDetails = async (system) => {
    setSelectedSystem(system);
    try {
      const [detailsRes, perfRes] = await Promise.all([
        aiMonitorService.getSystemDetails(system.id),
        aiMonitorService.getModelPerformance(system.id, 7),
      ]);

      if (detailsRes.success) {
        setSystemDetails(detailsRes.data);
      }

      if (perfRes.success) {
        setPerformanceData(perfRes.data);
      }
    } catch (error) {
      console.error('Error loading system details:', error);
      toast.error('Failed to load system details');
    }
  };

  const handleTriggerUpdate = async (systemId) => {
    try {
      const result = await aiMonitorService.triggerAIUpdate(systemId);
      if (result.success) {
        toast.success('AI update triggered successfully');
        loadAllData();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Error triggering update:', error);
      toast.error('Failed to trigger update');
    }
  };

  const handleClearQueue = async () => {
    try {
      const result = await aiMonitorService.clearQueue();
      if (result.success) {
        toast.success(result.data.message);
        loadAllData();
      }
    } catch (error) {
      console.error('Error clearing queue:', error);
      toast.error('Failed to clear queue');
    }
  };

  const handleDownloadReport = async () => {
    try {
      toast.info('Generating report...');
      const result = await aiMonitorService.downloadMetricsReport('json');
      if (result.success) {
        // In real scenario, this would download a file
        const dataStr = JSON.stringify(result.data.report, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ai-metrics-report-${new Date().toISOString()}.json`;
        link.click();
        toast.success('Report downloaded successfully');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      const result = await aiMonitorService.acknowledgeAlert(alertId);
      if (result.success) {
        toast.success('Alert acknowledged');
        loadAllData();
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getHealthColor = (health) => {
    if (health >= 0.9) return 'text-green-600';
    if (health >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'text-blue-600 bg-blue-50',
      medium: 'text-yellow-600 bg-yellow-50',
      high: 'text-orange-600 bg-orange-50',
      critical: 'text-red-600 bg-red-50',
    };
    return colors[severity] || colors.low;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading AI monitoring data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="admin-ai-monitor-page">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI System Health Monitor</h1>
                <p className="text-gray-600 mt-1">Monitor and manage AI/ML systems performance</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh} data-testid="refresh-btn">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="default" onClick={handleDownloadReport} data-testid="download-report-btn">
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          </div>
        </div>

        {/* Overall Health Card */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-purple-50" data-testid="overall-health-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Overall System Health</h3>
              <div className={`text-4xl font-bold ${getHealthColor(overallHealth)}`}>
                {(overallHealth * 100).toFixed(0)}%
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-600">
                  {systems.filter(s => s.status === 'active' || s.status === 'processing').length} / {systems.length} Active
                </span>
              </div>
              {alerts.filter(a => !a.acknowledged).length > 0 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span className="text-sm text-gray-600">
                    {alerts.filter(a => !a.acknowledged).length} Unacknowledged Alerts
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <Card className="mb-6">
            <div 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSection('alerts')}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold text-gray-900">System Alerts</h3>
                <Badge variant="destructive">{alerts.filter(a => !a.acknowledged).length}</Badge>
              </div>
              {expandedSections.alerts ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
            {expandedSections.alerts && (
              <div className="p-4 border-t space-y-2">
                {alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${alert.acknowledged ? 'bg-gray-50' : 'bg-orange-50 border-orange-200'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <span className="text-xs text-gray-500">{alert.systemId}</span>
                        </div>
                        <p className="text-sm text-gray-700">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* AI Systems Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Systems Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systems.map(system => (
              <AISystemCard
                key={system.id}
                system={system}
                onViewDetails={handleViewDetails}
                onTriggerUpdate={handleTriggerUpdate}
              />
            ))}
          </div>
        </div>

        {/* Processing Queue */}
        {processingQueue && (
          <Card className="mb-6">
            <div 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSection('queue')}
            >
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Processing Queue</h3>
                <Badge>{processingQueue.totalItems} tasks</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearQueue();
                  }}
                  disabled={processingQueue.totalItems === 0}
                  data-testid="clear-queue-btn"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear Queue
                </Button>
                {expandedSections.queue ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>
            {expandedSections.queue && (
              <div className="p-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{processingQueue.totalItems}</div>
                    <div className="text-sm text-gray-600">Total Tasks</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{processingQueue.processing}</div>
                    <div className="text-sm text-gray-600">Processing</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{processingQueue.queued}</div>
                    <div className="text-sm text-gray-600">Queued</div>
                  </div>
                </div>

                {processingQueue.queue.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700 mb-2">Recent Tasks</h4>
                    {processingQueue.queue.slice(0, 5).map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={task.status === 'processing' ? 'default' : 'outline'}>
                              {task.status}
                            </Badge>
                            <span className="text-sm font-medium">{task.taskType}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{task.systemId}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">Priority: {task.priority}</div>
                          <div className="text-xs text-gray-500">{task.estimatedTime}s</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Error Logs */}
        {errorLogs.length > 0 && (
          <Card>
            <div 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSection('errors')}
            >
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-gray-900">Recent Errors</h3>
                <Badge variant="destructive">
                  {errorLogs.filter(e => !e.resolved).length} unresolved
                </Badge>
              </div>
              {expandedSections.errors ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
            {expandedSections.errors && (
              <div className="p-4 border-t">
                <div className="space-y-2">
                  {errorLogs.map(error => (
                    <div
                      key={error.id}
                      className={`p-3 rounded-lg border ${error.resolved ? 'bg-gray-50' : 'bg-red-50 border-red-200'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getSeverityColor(error.severity)}>
                              {error.severity}
                            </Badge>
                            <span className="text-xs text-gray-500">{error.systemId}</span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">{error.errorType}</span>
                          </div>
                          <p className="text-sm text-gray-700">{error.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(error.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {error.resolved && (
                          <Badge variant="outline" className="text-green-600">
                            Resolved
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* System Details Modal (Simplified) */}
        {selectedSystem && systemDetails && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">{systemDetails.name} Details</h2>
                  <Button variant="outline" onClick={() => {
                    setSelectedSystem(null);
                    setSystemDetails(null);
                  }}>
                    Close
                  </Button>
                </div>

                {/* Model Info */}
                {systemDetails.modelInfo && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3">Model Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Version</div>
                        <div className="font-medium">{systemDetails.modelInfo.version}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Training Data Size</div>
                        <div className="font-medium">{systemDetails.modelInfo.trainingDataSize.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Last Trained</div>
                        <div className="font-medium">{new Date(systemDetails.modelInfo.lastTrained).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Next Retraining</div>
                        <div className="font-medium">{new Date(systemDetails.modelInfo.nextRetraining).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Performance Chart */}
                {performanceData && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3">Performance Metrics (Last 7 Days)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceData.metrics}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" name="Accuracy" />
                          <Line type="monotone" dataKey="avgConfidence" stroke="#10b981" name="Confidence" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                {systemDetails.recentActivity && (
                  <div>
                    <h3 className="font-semibold mb-3">Recent Activity</h3>
                    <div className="space-y-2">
                      {systemDetails.recentActivity.slice(0, 5).map(activity => (
                        <div key={activity.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="text-sm font-medium">{activity.type}</span>
                            <span className="text-xs text-gray-500 ml-2">{activity.message}</span>
                          </div>
                          <span className="text-xs text-gray-500">{activity.duration}s</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AdminAIMonitor;
