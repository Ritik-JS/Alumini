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
import mockDatasetService from '@/services/mockDatasetService';

const DatasetProgress = () => {
  const { uploadId } = useParams();
  const navigate = useNavigate();
  const [uploadData, setUploadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchProgress();
    
    // Poll for updates every 2 seconds if still processing
    const interval = setInterval(() => {
      if (uploadData?.status === 'processing') {
        fetchProgress();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [uploadId, uploadData?.status]);

  const fetchProgress = async () => {
    try {
      const data = await mockDatasetService.getUploadProgress(uploadId);
      setUploadData(data);
      
      // If completed, redirect to report after a short delay
      if (data.status === 'completed' && loading) {
        setTimeout(() => {
          toast.success('Upload completed successfully!');
          navigate(`/admin/datasets/upload/${uploadId}/report`);
        }, 2000);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch progress');
      navigate('/admin/datasets/history');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await mockDatasetService.cancelUpload(uploadId);
      toast.success('Upload cancelled');
      navigate('/admin/datasets/history');
    } catch (error) {
      toast.error(error.message || 'Failed to cancel upload');
      setCancelling(false);
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
              <p className="text-gray-600 mt-2">{uploadData?.fileName}</p>
            </div>
            {uploadData?.status === 'processing' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={cancelling}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Upload
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Upload?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel this upload? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No, Continue</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel} className="bg-red-600 hover:bg-red-700">
                      Yes, Cancel Upload
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {uploadData?.status === 'completed' && (
              <Button onClick={() => navigate(`/admin/datasets/upload/${uploadId}/report`)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                View Report
              </Button>
            )}
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="space-y-6">
          <ProgressTracker
            currentStage={uploadData?.currentStage}
            progress={uploadData?.progress}
            stats={{
              totalRows: uploadData?.totalRows,
              processedRows: uploadData?.processedRows,
              validRows: uploadData?.validRows,
              errorRows: uploadData?.errorRows,
              processingTime: uploadData?.processingTime,
            }}
          />

          {/* Processing Log */}
          <ProcessingLog logs={uploadData?.logs || []} />

          {/* Status Message */}
          {uploadData?.status === 'completed' && (
            <Card className="p-6 bg-green-50 border-green-200">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900">Upload Completed Successfully!</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Your dataset has been processed and stored. AI systems have been triggered for analysis.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-3 border-green-300 hover:bg-green-100"
                    onClick={() => navigate(`/admin/datasets/upload/${uploadId}/report`)}
                  >
                    View Detailed Report
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default DatasetProgress;
