import { useState } from 'react';
import { Upload, Download, Info, ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FileUploader from '@/components/datasets/FileUploader';
import MLDataStatusWidget from '@/components/admin/MLDataStatusWidget';
import apiCareerDataService from '@/services/apiCareerDataService';

const AdminCareerDataUpload = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);

  const handleDownloadTemplate = async () => {
    try {
      const response = await apiCareerDataService.downloadCSVTemplate();
      
      // Create and download CSV file
      const blob = new Blob([response.data.template], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.data.filename || 'career_transitions_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Template downloaded successfully');
    } catch (error) {
      toast.error('Failed to download template');
      console.error('Download error:', error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a CSV file to upload');
      return;
    }

    setUploading(true);
    setUploadResults(null);

    try {
      const result = await apiCareerDataService.bulkUploadCareerData(selectedFile);
      
      if (result.success) {
        const { success_count, failed_count, errors } = result.data;
        
        setUploadResults(result.data);
        
        if (failed_count === 0) {
          toast.success(`✅ All ${success_count} records imported successfully!`);
        } else {
          toast.warning(
            `Partial success: ${success_count} imported, ${failed_count} failed`
          );
        }
        
        // Clear file selection
        setSelectedFile(null);
      }
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
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
            Back to Admin
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Career Data Upload</h1>
          <p className="text-gray-600 mt-2">
            Upload career transition data to train the ML career prediction model
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upload Interface */}
          <div className="lg:col-span-2 space-y-6">
            {/* Instructions */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Info className="h-5 w-5 mr-2" />
                CSV Upload Instructions
              </h3>
              <div className="space-y-2 text-sm text-blue-900">
                <p><strong>Required fields:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><code className="bg-blue-100 px-1 rounded">email</code> - User's email (auto-creates if not found)</li>
                  <li><code className="bg-blue-100 px-1 rounded">from_role</code> - Previous job role</li>
                  <li><code className="bg-blue-100 px-1 rounded">to_role</code> - New job role</li>
                  <li><code className="bg-blue-100 px-1 rounded">transition_date</code> - Date (YYYY-MM-DD)</li>
                  <li><code className="bg-blue-100 px-1 rounded">success_rating</code> - Rating from 1 to 5</li>
                </ul>
                <p className="mt-3"><strong>Optional fields:</strong> from_company, to_company, skills_acquired</p>
                <p className="text-xs mt-2">
                  💡 Tip: Skills should be separated by pipes (|), e.g., "Skill1|Skill2|Skill3"
                </p>
                <p className="text-xs mt-2 font-semibold text-green-800">
                  ✨ New users will be auto-created with basic profiles
                </p>
              </div>
            </Card>

            {/* Template Download */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-gray-600" />
                CSV Template
              </h2>
              <p className="text-gray-600 mb-4">
                Download the CSV template with example data and proper formatting
              </p>
              <Button
                onClick={handleDownloadTemplate}
                variant="outline"
                className="w-full sm:w-auto"
                data-testid="download-template-btn"
              >
                <Download className="h-4 w-4 mr-2" />
                Download CSV Template
              </Button>
            </Card>

            {/* File Upload */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Select CSV File</h2>
              <FileUploader
                onFileSelect={setSelectedFile}
                acceptedTypes=".csv"
                maxSize={10}
              />
              
              {selectedFile && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ File selected: <strong>{selectedFile.name}</strong>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Size: {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}
            </Card>

            {/* Upload Results */}
            {uploadResults && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Upload Results</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-800">
                      ✅ Successfully imported
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      {uploadResults.success_count}
                    </span>
                  </div>
                  
                  {uploadResults.failed_count > 0 && (
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span className="text-sm font-medium text-red-800">
                        ❌ Failed to import
                      </span>
                      <span className="text-lg font-bold text-red-600">
                        {uploadResults.failed_count}
                      </span>
                    </div>
                  )}

                  {uploadResults.errors && uploadResults.errors.length > 0 && (
                    <div className="mt-4">
                      <details className="cursor-pointer">
                        <summary className="text-sm font-medium text-gray-700 hover:text-gray-900">
                          View Errors ({uploadResults.errors.length})
                        </summary>
                        <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200 max-h-60 overflow-y-auto">
                          <ul className="text-xs text-gray-700 space-y-1">
                            {uploadResults.errors.map((error, idx) => (
                              <li key={idx} className="font-mono">• {error}</li>
                            ))}
                          </ul>
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Upload Button */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => navigate('/admin')}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="min-w-32"
                data-testid="upload-btn"
              >
                {uploading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Column - ML Status Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <MLDataStatusWidget 
                onUploadClick={() => {
                  // Already on upload page, just scroll to top
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminCareerDataUpload;
