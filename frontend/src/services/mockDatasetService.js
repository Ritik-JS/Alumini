// Mock Dataset Service
// Handles dataset upload operations with mock data

import mockData from '../mockdata.json';

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory storage for simulating uploads
let uploadsInProgress = new Map();

export const mockDatasetService = {
  // Upload dataset
  async uploadDataset(file, datasetType, description) {
    await delay(500);

    // Validate file
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json'];
    const allowedExtensions = ['.csv', '.xls', '.xlsx', '.json'];
    
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error('Invalid file type. Only CSV, Excel, and JSON files are allowed.');
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size exceeds 50MB limit.');
    }

    // Create upload record
    const uploadId = `upload-${Date.now()}`;
    const upload = {
      id: uploadId,
      fileName: file.name,
      fileSize: file.size,
      datasetType,
      description,
      uploadedBy: '550e8400-e29b-41d4-a716-446655440000',
      uploadedByName: 'Admin User',
      uploadDate: new Date().toISOString(),
      status: 'processing',
      progress: 0,
      currentStage: 'validating',
      totalRows: Math.floor(Math.random() * 2000) + 500,
      processedRows: 0,
      validRows: 0,
      errorRows: 0,
      processingTime: 0,
      dataQualityScore: 0,
      validationErrors: [],
      aiSystemsTriggered: [],
      logs: [
        `${new Date().toISOString()} - Upload started`,
      ],
    };

    uploadsInProgress.set(uploadId, upload);

    // Simulate processing in background
    this._simulateProcessing(uploadId);

    return {
      success: true,
      uploadId,
      message: 'Upload started successfully',
    };
  },

  // Get upload progress
  async getUploadProgress(uploadId) {
    await delay(200);

    // Check in-progress uploads first
    if (uploadsInProgress.has(uploadId)) {
      return uploadsInProgress.get(uploadId);
    }

    // Check in mock data
    const upload = mockData.datasetUploads?.find(u => u.id === uploadId);
    
    if (!upload) {
      throw new Error('Upload not found');
    }

    return upload;
  },

  // Get upload report
  async getUploadReport(uploadId) {
    await delay(300);

    // Check in-progress uploads first
    if (uploadsInProgress.has(uploadId)) {
      return uploadsInProgress.get(uploadId);
    }

    // Check in mock data
    const upload = mockData.datasetUploads?.find(u => u.id === uploadId);
    
    if (!upload) {
      throw new Error('Upload not found');
    }

    return upload;
  },

  // Get upload history
  async getUploadHistory(filters = {}) {
    await delay(400);

    let uploads = [...mockData.datasetUploads];
    
    // Add in-progress uploads
    uploadsInProgress.forEach(upload => {
      uploads.unshift(upload);
    });

    // Apply filters
    if (filters.datasetType) {
      uploads = uploads.filter(u => u.datasetType === filters.datasetType);
    }

    if (filters.status) {
      uploads = uploads.filter(u => u.status === filters.status);
    }

    if (filters.dateFrom) {
      uploads = uploads.filter(u => new Date(u.uploadDate) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      uploads = uploads.filter(u => new Date(u.uploadDate) <= new Date(filters.dateTo));
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      uploads = uploads.filter(u => 
        u.fileName.toLowerCase().includes(searchLower) ||
        u.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort by date (newest first)
    uploads.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

    return {
      uploads,
      totalCount: uploads.length,
      stats: {
        totalUploads: uploads.length,
        successRate: (uploads.filter(u => u.status === 'completed').length / uploads.length * 100).toFixed(1),
        avgProcessingTime: Math.floor(uploads.reduce((sum, u) => sum + (u.processingTime || 0), 0) / uploads.length),
      },
    };
  },

  // Cancel upload
  async cancelUpload(uploadId) {
    await delay(300);

    if (!uploadsInProgress.has(uploadId)) {
      throw new Error('Upload not found or already completed');
    }

    const upload = uploadsInProgress.get(uploadId);
    upload.status = 'cancelled';
    upload.logs.push(`${new Date().toISOString()} - Upload cancelled by user`);
    
    uploadsInProgress.delete(uploadId);

    return {
      success: true,
      message: 'Upload cancelled successfully',
    };
  },

  // Download error report
  async downloadErrorReport(uploadId) {
    await delay(200);

    const upload = await this.getUploadReport(uploadId);
    
    if (!upload) {
      throw new Error('Upload not found');
    }

    // Create CSV content
    const headers = ['Row', 'Field', 'Error', 'Value'];
    const rows = upload.validationErrors.map(err => [
      err.row,
      err.field,
      err.error,
      err.value || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error_report_${uploadId}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    return {
      success: true,
      message: 'Error report downloaded',
    };
  },

  // Simulate processing (internal method)
  _simulateProcessing(uploadId) {
    let progress = 0;
    const stages = [
      { name: 'validating', duration: 2000, progressRange: [0, 25] },
      { name: 'cleaning', duration: 3000, progressRange: [25, 50] },
      { name: 'ai_processing', duration: 4000, progressRange: [50, 90] },
      { name: 'storing', duration: 1000, progressRange: [90, 100] },
    ];

    let currentStageIndex = 0;

    const processStage = () => {
      if (!uploadsInProgress.has(uploadId)) return;

      const upload = uploadsInProgress.get(uploadId);
      const stage = stages[currentStageIndex];

      if (progress < stage.progressRange[1]) {
        progress += Math.random() * 5 + 2;
        if (progress > stage.progressRange[1]) {
          progress = stage.progressRange[1];
        }

        upload.progress = Math.floor(progress);
        upload.currentStage = stage.name;
        upload.processedRows = Math.floor((upload.totalRows * progress) / 100);
        upload.validRows = Math.floor(upload.processedRows * 0.98);
        upload.errorRows = upload.processedRows - upload.validRows;
        upload.processingTime += 1;

        // Add log entries
        if (progress === stage.progressRange[0]) {
          upload.logs.push(`${new Date().toISOString()} - ${stage.name.charAt(0).toUpperCase() + stage.name.slice(1).replace('_', ' ')} started`);
        }

        setTimeout(processStage, 500);
      } else {
        currentStageIndex++;
        if (currentStageIndex < stages.length) {
          setTimeout(processStage, 500);
        } else {
          // Complete
          upload.status = 'completed';
          upload.progress = 100;
          upload.currentStage = 'stored';
          upload.dataQualityScore = 95 + Math.random() * 4;
          upload.logs.push(`${new Date().toISOString()} - Upload completed successfully`);
          
          // Add AI systems triggered
          if (upload.datasetType === 'alumni') {
            upload.aiSystemsTriggered = [
              { system: 'Skill Graph AI', status: 'completed', updatedAt: new Date().toISOString() },
              { system: 'Career Prediction', status: 'completed', updatedAt: new Date().toISOString() },
              { system: 'Talent Clustering', status: 'completed', updatedAt: new Date().toISOString() },
            ];
          } else if (upload.datasetType === 'job_market') {
            upload.aiSystemsTriggered = [
              { system: 'Career Prediction', status: 'completed', updatedAt: new Date().toISOString() },
            ];
          } else if (upload.datasetType === 'educational') {
            upload.aiSystemsTriggered = [
              { system: 'Capsule Ranking', status: 'completed', updatedAt: new Date().toISOString() },
            ];
          }

          // Add some random validation errors
          const errorCount = Math.floor(Math.random() * 3) + 1;
          for (let i = 0; i < errorCount; i++) {
            upload.validationErrors.push({
              row: Math.floor(Math.random() * upload.totalRows) + 1,
              field: ['email', 'user_id', 'skills', 'batch_year'][Math.floor(Math.random() * 4)],
              error: ['Invalid format', 'Missing required field', 'Invalid value'][Math.floor(Math.random() * 3)],
              value: 'sample_error_value',
            });
          }

          // Remove from in-progress after 30 seconds
          setTimeout(() => {
            uploadsInProgress.delete(uploadId);
          }, 30000);
        }
      }
    };

    setTimeout(processStage, 500);
  },
};

export default mockDatasetService;
