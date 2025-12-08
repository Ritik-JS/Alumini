import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle, Clock, Database, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ValidationReport from '@/components/datasets/ValidationReport';
import ProcessingLog from '@/components/datasets/ProcessingLog';
import apiDatasetService from '@/services/apiDatasetService';
import { format } from 'date-fns';

const DatasetReport = () => {
  const { uploadId } = useParams();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [uploadId]);

  const fetchReport = async () => {
    try {
      const data = await apiDatasetService.getUploadReport(uploadId);
      setReportData(data);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch report');
      navigate('/admin/datasets/history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadErrorReport = async () => {
    try {
      await apiDatasetService.downloadErrorReport(uploadId);
      toast.success('Error report downloaded');
    } catch (error) {
      toast.error(error.message || 'Failed to download report');
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
    } catch {
      return dateString || 'N/A';
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading report...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
      case 'validating':
      case 'cleaning':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'processing':
      case 'validating':
      case 'cleaning':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/datasets/history')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to History
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Processing Report</h1>
              <p className="text-gray-600 mt-2">{reportData.file_name}</p>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusIcon(reportData.status)}
              <Badge className={getStatusColor(reportData.status)}>
                {reportData.status.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Summary */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Processing Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Rows</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData.summary?.total_rows?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Valid Rows</p>
                <p className="text-2xl font-bold text-green-600">
                  {reportData.summary?.valid_rows?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {reportData.summary?.total_rows > 0
                    ? `${((reportData.summary.valid_rows / reportData.summary.total_rows) * 100).toFixed(1)}%`
                    : '0%'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Error Rows</p>
                <p className="text-2xl font-bold text-red-600">
                  {reportData.summary?.error_rows?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {reportData.summary?.total_rows > 0
                    ? `${((reportData.summary.error_rows / reportData.summary.total_rows) * 100).toFixed(1)}%`
                    : '0%'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Processing Time</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatTime(reportData.summary?.processing_time_seconds)}
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Upload ID:</span>
                <p className="font-mono text-xs mt-1">{reportData.upload_id}</p>
              </div>
              <div>
                <span className="text-gray-600">Dataset Type:</span>
                <p className="font-medium mt-1 capitalize">{reportData.file_type}</p>
              </div>
              <div>
                <span className="text-gray-600">Upload Date:</span>
                <p className="font-medium mt-1">{formatDate(reportData.created_at)}</p>
              </div>
              <div>
                <span className="text-gray-600">Completed:</span>
                <p className="font-medium mt-1">{formatDate(reportData.completed_at)}</p>
              </div>
            </div>
          </Card>

          {/* AI Systems Triggered */}
          {reportData.ai_processing_triggered && reportData.ai_processing_triggered.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">AI Systems Triggered</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reportData.ai_processing_triggered.map((system, index) => (
                  <div key={index} className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium text-gray-900">{system}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Validation Report */}
          {reportData.validation_report && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Validation Report</h2>
                {reportData.summary?.error_rows > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadErrorReport}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Errors CSV
                  </Button>
                )}
              </div>
              <ValidationReport report={reportData.validation_report} />
            </Card>
          )}

          {/* Processing Logs */}
          {reportData.processing_logs && reportData.processing_logs.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Processing Logs</h2>
              <ProcessingLog logs={reportData.processing_logs} />
            </Card>
          )}

          {/* Error Log */}
          {reportData.error_log && (
            <Card className="p-6 bg-red-50 border-red-200">
              <h2 className="text-xl font-semibold mb-4 text-red-900 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Error Details
              </h2>
              <pre className="bg-white p-4 rounded-md border border-red-200 overflow-x-auto text-sm">
                {reportData.error_log}
              </pre>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/datasets/history')}
            >
              Back to History
            </Button>
            <Button onClick={() => navigate('/admin/datasets/upload')}>
              Upload New Dataset
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DatasetReport;
