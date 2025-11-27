import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle, Clock, Database } from 'lucide-react';
import { toast } from 'sonner';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ValidationReport from '@/components/datasets/ValidationReport';
import ProcessingLog from '@/components/datasets/ProcessingLog';
import mockDatasetService from '@/services/mockDatasetService';
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
      const data = await mockDatasetService.getUploadReport(uploadId);
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
      await mockDatasetService.downloadErrorReport(uploadId);
      toast.success('Error report downloaded');
    } catch (error) {
      toast.error(error.message || 'Failed to download report');
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
    } catch {
      return dateString;
    }
  };

  const formatTime = (seconds) => {
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
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Upload Report</h1>
              <p className="text-gray-600 mt-2">{reportData?.fileName}</p>
            </div>
            <Badge className={getStatusColor(reportData?.status)}>
              {reportData?.status}
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Processing Time</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {formatTime(reportData?.processingTime || 0)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {((reportData?.validRows / reportData?.totalRows) * 100).toFixed(1)}%
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Data Quality Score</p>
                  <p className="text-2xl font-bold text-primary mt-2">
                    {reportData?.dataQualityScore?.toFixed(1) || 0}%
                  </p>
                </div>
                <Database className="h-8 w-8 text-primary" />
              </div>
            </Card>
          </div>

          {/* Upload Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Upload Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Dataset Type</p>
                <p className="font-medium text-gray-900 mt-1 capitalize">
                  {reportData?.datasetType?.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Upload Date</p>
                <p className="font-medium text-gray-900 mt-1">
                  {formatDate(reportData?.uploadDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Uploaded By</p>
                <p className="font-medium text-gray-900 mt-1">
                  {reportData?.uploadedByName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">File Size</p>
                <p className="font-medium text-gray-900 mt-1">
                  {(reportData?.fileSize / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              {reportData?.description && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium text-gray-900 mt-1">
                    {reportData?.description}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* AI Systems Triggered */}
          {reportData?.aiSystemsTriggered && reportData.aiSystemsTriggered.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">AI Processing Triggered</h3>
              <div className="space-y-3">
                {reportData.aiSystemsTriggered.map((system, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        system.status === 'completed' ? 'bg-green-500' :
                        system.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                        'bg-gray-400'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{system.system}</p>
                        <p className="text-xs text-gray-500">
                          Updated: {formatDate(system.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={system.status === 'completed' ? 'default' : 'secondary'}>
                      {system.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Separator />

          {/* Validation Report */}
          <ValidationReport
            report={{
              validationErrors: reportData?.validationErrors || [],
              dataQualityScore: reportData?.dataQualityScore,
              validRows: reportData?.validRows,
              errorRows: reportData?.errorRows,
              totalRows: reportData?.totalRows,
            }}
            onDownloadReport={handleDownloadErrorReport}
          />

          {/* Processing Log */}
          <ProcessingLog logs={reportData?.logs || []} />

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/datasets/history')}
            >
              Back to History
            </Button>
            {reportData?.validationErrors && reportData.validationErrors.length > 0 && (
              <Button onClick={handleDownloadErrorReport}>
                <Download className="h-4 w-4 mr-2" />
                Download Error Report
              </Button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DatasetReport;
