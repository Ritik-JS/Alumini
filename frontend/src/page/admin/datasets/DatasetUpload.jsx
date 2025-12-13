import { useState } from 'react';
import { Upload, Info, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FileUploader from '@/components/datasets/FileUploader';
import apiDatasetService from '@/services/apiDatasetService';

const DatasetUpload = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [datasetType, setDatasetType] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  // Updated dataset types to match backend schema
  const datasetTypes = [
    {
      value: 'alumni',
      label: 'Alumni Data',
      description: 'Alumni profiles with career history, skills, and professional information',
      schema: ['email', 'name', 'batch_year', 'department', 'current_company', 'current_role', 'location', 'skills', 'linkedin_url'],
    },
    {
      value: 'job_market',
      label: 'Job Market Data',
      description: 'Job postings with requirements, salary ranges, and market trends',
      schema: ['job_title', 'company', 'industry', 'location', 'salary_min', 'salary_max', 'required_skills', 'experience_level'],
    },
    {
      value: 'educational',
      label: 'Educational Programs',
      description: 'Student records, courses, grades, and skills learned',
      schema: ['student_id', 'email', 'course_name', 'grade', 'completion_date', 'skills_learned', 'instructor'],
    },
    {
      value: 'career_paths',
      label: 'Career Paths Data (ML Training)',
      description: 'Career transition data for ML model training - helps predict career trajectories',
      schema: ['email', 'from_role', 'to_role', 'from_company', 'to_company', 'transition_date', 'skills_acquired', 'success_rating'],
    },
  ];

  const selectedTypeInfo = datasetTypes.find(t => t.value === datasetType);

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!datasetType) {
      toast.error('Please select a dataset type');
      return;
    }

    setUploading(true);

    try {
      // Call real backend API
      const result = await apiDatasetService.uploadDataset(selectedFile, datasetType, description);
      
      if (result.success) {
        toast.success('Upload started successfully!');
        // Navigate to progress page
        navigate(`/admin/datasets/upload/${result.data.upload_id}/progress`);
      }
    } catch (error) {
      toast.error(error.message || 'Upload failed');
      setUploading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
          <h1 className="text-3xl font-bold text-gray-900">Upload Dataset</h1>
          <p className="text-gray-600 mt-2">
            Upload datasets for AI processing and system updates
          </p>
        </div>

        <div className="space-y-6">
          {/* File Upload Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Select File</h2>
            <FileUploader
              onFileSelect={setSelectedFile}
              acceptedTypes=".csv,.xlsx,.xls,.json"
              maxSize={50}
            />
          </Card>

          {/* Dataset Type Selection */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Dataset Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dataset-type" className="text-base">
                  Dataset Type <span className="text-red-500">*</span>
                </Label>
                <Select value={datasetType} onValueChange={setDatasetType}>
                  <SelectTrigger id="dataset-type" className="mt-2">
                    <SelectValue placeholder="Select dataset type" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasetTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTypeInfo && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">{selectedTypeInfo.description}</p>
                    <p className="text-xs text-gray-600 mb-1">Expected fields:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedTypeInfo.schema.map((field) => (
                        <code key={field} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                          {field}
                        </code>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="description" className="text-base">
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Add a description for this dataset..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* Dataset Type Info Cards */}
          {!datasetType && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Dataset Type Information
              </h3>
              <div className="space-y-3">
                {datasetTypes.map((type) => (
                  <div key={type.value} className="bg-white p-3 rounded-md border border-blue-100">
                    <h4 className="font-medium text-gray-900">{type.label}</h4>
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Upload Button */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/datasets/history')}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !datasetType || uploading}
              className="min-w-32"
            >
              {uploading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Dataset
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DatasetUpload;
