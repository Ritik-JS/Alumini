import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Search, Filter, TrendingUp, Clock, Database, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DatasetTable from '@/components/datasets/DatasetTable';
import apiDatasetService from '@/services/apiDatasetService';

const DatasetHistory = () => {
  const navigate = useNavigate();
  const [uploads, setUploads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    file_type: '',
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, [filters]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await apiDatasetService.getUploadHistory(filters);
      setUploads(data.uploads);
      setPagination(data.pagination);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch upload history');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiDatasetService.getStatistics();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      file_type: '',
      page: 1,
      limit: 20,
    });
  };

  const handleRefresh = () => {
    fetchHistory();
    fetchStats();
    toast.success('Data refreshed');
  };

  const hasActiveFilters = filters.status || filters.file_type;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dataset Upload History</h1>
              <p className="text-gray-600 mt-2">
                Manage and monitor your dataset uploads and AI processing
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => navigate('/admin/datasets/upload')}>
                <Upload className="h-4 w-4 mr-2" />
                Upload New Dataset
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Uploads</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.total_uploads || 0}
                  </p>
                </div>
                <Database className="h-10 w-10 text-gray-400" />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {stats.by_status?.completed || 0}
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-400" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Processing</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {(stats.by_status?.validating || 0) + 
                     (stats.by_status?.cleaning || 0) + 
                     (stats.by_status?.processing || 0)}
                  </p>
                </div>
                <Clock className="h-10 w-10 text-blue-400" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Recent (24h)</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {stats.recent_24h || 0}
                  </p>
                </div>
                <Upload className="h-10 w-10 text-purple-400" />
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="validating">Validating</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.file_type}
                onValueChange={(value) => handleFilterChange('file_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Dataset Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="alumni">Alumni Data</SelectItem>
                  <SelectItem value="job_market">Job Market</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        </Card>

        {/* Table */}
        <Card>
          <DatasetTable 
            uploads={uploads} 
            loading={loading}
            onRefresh={fetchHistory}
          />
        </Card>

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Showing {uploads.length} of {pagination.total} uploads
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.total_pages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default DatasetHistory;
