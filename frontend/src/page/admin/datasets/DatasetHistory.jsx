import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Search, Filter, Calendar, TrendingUp, Clock, Database } from 'lucide-react';
import { toast } from 'sonner';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DatasetTable from '@/components/datasets/DatasetTable';
import mockDatasetService from '@/services/mockDatasetService';

const DatasetHistory = () => {
  const navigate = useNavigate();
  const [uploads, setUploads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    datasetType: '',
    status: '',
  });

  useEffect(() => {
    fetchHistory();
  }, [filters]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await mockDatasetService.getUploadHistory(filters);
      setUploads(data.uploads);
      setStats(data.stats);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch upload history');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      datasetType: '',
      status: '',
    });
  };

  const hasActiveFilters = filters.search || filters.datasetType || filters.status;

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
            <Button onClick={() => navigate('/admin/datasets/upload')}>
              <Upload className="h-4 w-4 mr-2" />
              Upload New Dataset
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Uploads</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.totalUploads}
                  </p>
                </div>
                <Database className="h-10 w-10 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Success Rate</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {stats.successRate}%
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg Processing Time</p>
                  <p className="text-3xl font-bold text-primary mt-2">
                    {stats.avgProcessingTime}s
                  </p>
                </div>
                <Clock className="h-10 w-10 text-primary" />
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by file name or description..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filters.datasetType} onValueChange={(value) => handleFilterChange('datasetType', value)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Types</SelectItem>
                <SelectItem value="alumni">Alumni Data</SelectItem>
                <SelectItem value="job_market">Job Market</SelectItem>
                <SelectItem value="educational">Educational</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </Card>

        {/* Upload Table */}
        {loading ? (
          <Card className="p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading uploads...</p>
            </div>
          </Card>
        ) : (
          <DatasetTable uploads={uploads} />
        )}
      </div>
    </MainLayout>
  );
};

export default DatasetHistory;
