import { useState } from 'react';
import { FileText, Download, Eye, Calendar, TrendingUp, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const getStatusIcon = (status) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    case 'processing':
      return <Clock className="h-4 w-4" />;
    case 'failed':
      return <XCircle className="h-4 w-4" />;
    case 'cancelled':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getStatusVariant = (status) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'processing':
      return 'secondary';
    case 'failed':
      return 'destructive';
    case 'cancelled':
      return 'outline';
    default:
      return 'outline';
  }
};

const getDatasetTypeLabel = (type) => {
  switch (type) {
    case 'alumni':
      return 'Alumni Data';
    case 'job_market':
      return 'Job Market';
    case 'educational':
      return 'Educational';
    default:
      return type;
  }
};

const DatasetTable = ({ uploads = [] }) => {
  const navigate = useNavigate();

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const handleViewReport = (uploadId) => {
    navigate(`/admin/datasets/upload/${uploadId}/report`);
  };

  if (uploads.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No uploads yet</h3>
          <p className="text-sm text-gray-500">Upload your first dataset to get started.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Rows</TableHead>
              <TableHead>Quality</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {uploads.map((upload) => (
              <TableRow key={upload.id}>
                <TableCell>
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{upload.fileName}</p>
                      {upload.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                          {upload.description}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {getDatasetTypeLabel(upload.datasetType)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(upload.status)} className="flex items-center space-x-1 w-fit">
                    {getStatusIcon(upload.status)}
                    <span className="capitalize">{upload.status}</span>
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(upload.uploadDate)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {formatFileSize(upload.fileSize)}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">{upload.validRows?.toLocaleString()}</span>
                    <span className="text-gray-500"> / {upload.totalRows?.toLocaleString()}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {upload.dataQualityScore > 0 ? (
                    <div className="flex items-center space-x-2">
                      <TrendingUp className={`h-4 w-4 ${
                        upload.dataQualityScore >= 95 ? 'text-green-600' :
                        upload.dataQualityScore >= 85 ? 'text-yellow-600' : 'text-red-600'
                      }`} />
                      <span className="text-sm font-medium">
                        {upload.dataQualityScore.toFixed(1)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {upload.status === 'processing' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/datasets/upload/${upload.id}/progress`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Progress
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReport(upload.id)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      View Report
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default DatasetTable;
