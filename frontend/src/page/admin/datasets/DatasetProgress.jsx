import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, XCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import ProgressTracker from '@/components/datasets/ProgressTracker';
import ProcessingLog from '@/components/datasets/ProcessingLog';
import apiDatasetService from '@/services/apiDatasetService';

const DatasetProgress = () => {
  const { uploadId } = useParams();
  const navigate = useNavigate();
  const [uploadData, setUploadData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
    
    // Poll for updates every 3 seconds if still processing
    const interval = setInterval(() => {
      if (uploadData && !['completed', 'failed'].includes(uploadData.status)) {
        fetchProgress();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [uploadId]);

  useEffect(() => {
    // If completed or failed, redirect to report after a short delay
    if (uploadData && uploadData.status === 'completed') {
      setTimeout(() => {
        toast.success('Upload completed successfully!');
        navigate(`/admin/datasets/upload/${uploadId}/report`);
      }, 2000);
    }
  }, [uploadData?.status]);

  const fetchProgress = async () => {
    try {
      const data = await apiDatasetService.getUploadProgress(uploadId);
      setUploadData(data);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch progress');
      if (!uploadData) {
        navigate('/admin/datasets/history');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading progress...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!uploadData) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Upload Not Found</h2>
            <p className="text-gray-600 mb-6">The upload you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/admin/datasets/history')}>
              Back to History
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Upload Progress</h1>
              <p className="text-gray-600 mt-2">
                Tracking: {uploadData.upload_id}
              </p>
            </div>
            {uploadData.status === 'failed' && (
              <div className="flex items-center text-red-600">
                <XCircle className="h-6 w-6 mr-2" />
                <span className="font-medium">Processing Failed</span>
              </div>
            )}
            {uploadData.status === 'completed' && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-6 w-6 mr-2" />
                <span className="font-medium">Processing Complete</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Progress Tracker */}
          <Card className="p-6">
            <ProgressTracker data={uploadData} />
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-gray-600">Total Rows</p>
              <p className="text-2xl font-bold text-gray-900">
                {uploadData.total_rows?.toLocaleString() || 0}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Processed</p>
              <p className="text-2xl font-bold text-blue-600">
                {uploadData.processed_rows?.toLocaleString() || 0}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Valid Rows</p>
              <p className="text-2xl font-bold text-green-600">
                {uploadData.valid_rows?.toLocaleString() || 0}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Errors</p>
              <p className="text-2xl font-bold text-red-600">
                {uploadData.error_rows?.toLocaleString() || 0}
              </p>
            </Card>
          </div>

          {/* Actions */}
          {uploadData.status === 'completed' && (
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/datasets/history')}
              >
                Back to History
              </Button>
              <Button
                onClick={() => navigate(`/admin/datasets/upload/${uploadId}/report`)}
              >
                View Full Report
              </Button>
            </div>
          )}

          {uploadData.status === 'failed' && (
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/datasets/upload')}
              >
                Upload New Dataset
              </Button>
              <Button
                onClick={() => navigate(`/admin/datasets/upload/${uploadId}/report`)}
              >
                View Error Report
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default DatasetProgress;
