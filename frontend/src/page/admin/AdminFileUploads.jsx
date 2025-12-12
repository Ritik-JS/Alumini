import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, File, Image, FileText, Trash2, Download, ExternalLink, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services';

const AdminFileUploads = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getAllFiles({ file_type: fileTypeFilter, search: searchQuery });
      if (response.success) {
        const filesData = response.data || [];
        setFiles(filesData);
        setFilteredFiles(filesData);
      } else {
        setError(response.message || 'Failed to load files');
        toast.error(response.message || 'Failed to load files');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load files';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      loadFiles();
    }
  }, [searchQuery, fileTypeFilter]);

  useEffect(() => {
    let filtered = files;

    if (searchQuery) {
      filtered = filtered.filter(
        (f) =>
          f.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.user_email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (fileTypeFilter !== 'all') {
      filtered = filtered.filter((f) => f.file_type === fileTypeFilter);
    }

    setFilteredFiles(filtered);
  }, [searchQuery, fileTypeFilter, files]);

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(fileId);
    try {
      const response = await adminService.deleteFile(fileId);
      if (response.success) {
        setFiles(files.filter((f) => f.id !== fileId));
        setFilteredFiles(filteredFiles.filter((f) => f.id !== fileId));
        toast.success('File deleted successfully');
      } else {
        toast.error(response.message || 'Failed to delete file');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete file');
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatFileSize = (kb) => {
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  const getFileTypeIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType === 'application/pdf') return FileText;
    return File;
  };

  const getFileTypeColor = (fileType) => {
    switch (fileType) {
      case 'cv':
        return 'bg-blue-100 text-blue-800';
      case 'photo':
        return 'bg-green-100 text-green-800';
      case 'banner':
        return 'bg-purple-100 text-purple-800';
      case 'document':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalSize = files.reduce((sum, f) => sum + f.file_size_kb, 0);

  const stats = [
    {
      label: 'Total Files',
      value: files.length,
      color: 'text-blue-600',
      icon: File,
    },
    {
      label: 'CVs',
      value: files.filter((f) => f.file_type === 'cv').length,
      color: 'text-green-600',
      icon: FileText,
    },
    {
      label: 'Photos',
      value: files.filter((f) => f.file_type === 'photo').length,
      color: 'text-purple-600',
      icon: Image,
    },
    {
      label: 'Total Size',
      value: formatFileSize(totalSize),
      color: 'text-orange-600',
      icon: File,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainNavbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg p-6 text-white">
              <h1 className="text-3xl font-bold">File Upload Manager 📁</h1>
              <p className="mt-2 opacity-90">Track and manage all uploaded files</p>
            </div>

            {/* Loading State */}
            {loading && (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                    <p className="text-gray-600">Loading files...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {error && !loading && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-6 h-6 text-red-600" />
                      <div>
                        <p className="font-medium text-red-900">Failed to load files</p>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                      </div>
                    </div>
                    <Button onClick={loadFiles} variant="outline" size="sm">
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            {!loading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                          <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
                        </div>
                        <Icon className={`w-8 h-8 ${stat.color} opacity-50`} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              </div>
            )}

            {/* Files List */}
            {!loading && !error && (
              <Card>
              <CardHeader>
                <CardTitle>Uploaded Files</CardTitle>
                <CardDescription>All files uploaded to the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search by filename or user..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="file-search-input"
                      />
                    </div>
                    <div className="flex gap-2">
                      {['all', 'cv', 'photo', 'banner', 'document'].map((type) => (
                        <Button
                          key={type}
                          variant={fileTypeFilter === type ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFileTypeFilter(type)}
                          className="capitalize"
                          data-testid={`filter-${type}-btn`}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="pb-3 font-medium text-gray-700">File Name</th>
                        <th className="pb-3 font-medium text-gray-700">Type</th>
                        <th className="pb-3 font-medium text-gray-700">Size</th>
                        <th className="pb-3 font-medium text-gray-700">Uploaded By</th>
                        <th className="pb-3 font-medium text-gray-700">Upload Date</th>
                        <th className="pb-3 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFiles.map((file) => {
                        const FileIcon = getFileTypeIcon(file.mime_type);
                        return (
                          <tr
                            key={file.id}
                            className="border-b hover:bg-gray-50"
                            data-testid={`file-row-${file.id}`}
                          >
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <FileIcon className="w-5 h-5 text-gray-400" />
                                <span className="text-sm font-medium">{file.file_name}</span>
                              </div>
                            </td>
                            <td className="py-4">
                              <Badge className={getFileTypeColor(file.file_type)}>
                                {file.file_type}
                              </Badge>
                            </td>
                            <td className="py-4 text-sm text-gray-600">{formatFileSize(file.file_size_kb)}</td>
                            <td className="py-4 text-sm">{file.user_email}</td>
                            <td className="py-4 text-sm text-gray-600">
                              {new Date(file.uploaded_at).toLocaleDateString()}
                            </td>
                            <td className="py-4">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(file.file_url, '_blank')}
                                  data-testid={`view-file-${file.id}`}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600"
                                  onClick={() => handleDeleteFile(file.id)}
                                  disabled={deleteLoading === file.id}
                                  data-testid={`delete-file-${file.id}`}
                                >
                                  {deleteLoading === file.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {filteredFiles.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <File className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No files found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default AdminFileUploads;