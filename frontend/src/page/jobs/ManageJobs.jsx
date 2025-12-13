import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { jobService } from '@/services';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Eye, FileText, Edit, Trash2, Search, Plus, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const ManageJobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [postedJobs, setPostedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadJobs();
  }, [user.id]);

  const loadJobs = async () => {
    setError(null);
    setLoading(true);
    try {
      // Load jobs posted by this recruiter
      const jobsResponse = await jobService.getMyJobs(user.id);
      if (!jobsResponse.success) {
        throw new Error(jobsResponse.error || 'Failed to load jobs');
      }
      const jobs = jobsResponse.data || [];
      setPostedJobs(jobs);
      
      // No need to load applications separately - use applications_count from jobs table
    } catch (error) {
      console.error('Error loading jobs:', error);
      setError(error.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      try {
        const response = await jobService.deleteJob(jobId);
        if (response.success) {
          setPostedJobs(prev => prev.filter(j => j.id !== jobId));
        } else {
          alert('Failed to delete job: ' + (response.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error deleting job:', error);
        alert('Failed to delete job');
      }
    }
  };

  const handleEditJob = (jobId) => {
    navigate(`/jobs/edit/${jobId}`);
  };

  const handleViewApplications = (jobId) => {
    navigate(`/jobs/${jobId}/applications`);
  };

  const filteredJobs = postedJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Show error state
  if (error && !loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <MainNavbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 text-red-800">
                    <AlertCircle className="h-6 w-6 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">Error Loading Jobs</h3>
                      <p className="text-sm mt-1">{error}</p>
                      <div className="flex gap-2 mt-4">
                        <Button onClick={loadJobs} variant="outline" size="sm" className="bg-white">
                          Try Again
                        </Button>
                        <Button onClick={() => navigate('/jobs')} variant="ghost" size="sm">
                          Browse Jobs
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainNavbar />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Jobs</h1>
                <p className="text-gray-600 mt-1">View and manage all your job postings</p>
              </div>
              <Button asChild data-testid="post-new-job-btn">
                <Link to="/jobs/post">
                  <Plus className="w-4 h-4 mr-2" />
                  Post New Job
                </Link>
              </Button>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search jobs by title or company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        data-testid="search-jobs-input"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={statusFilter === 'all' ? 'default' : 'outline'}
                      onClick={() => setStatusFilter('all')}
                      size="sm"
                      data-testid="filter-all-btn"
                    >
                      All ({postedJobs.length})
                    </Button>
                    <Button
                      variant={statusFilter === 'active' ? 'default' : 'outline'}
                      onClick={() => setStatusFilter('active')}
                      size="sm"
                      data-testid="filter-active-btn"
                    >
                      Active ({postedJobs.filter(j => j.status === 'active').length})
                    </Button>
                    <Button
                      variant={statusFilter === 'closed' ? 'default' : 'outline'}
                      onClick={() => setStatusFilter('closed')}
                      size="sm"
                      data-testid="filter-closed-btn"
                    >
                      Closed ({postedJobs.filter(j => j.status === 'closed').length})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Jobs List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading jobs...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Briefcase className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchTerm || statusFilter !== 'all' ? 'No jobs found' : 'No jobs posted yet'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Start by posting your first job'}
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <Button asChild data-testid="post-first-job-btn">
                      <Link to="/jobs/post">Post Your First Job</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map(job => {
                  // Use applications_count from jobs table directly
                  const applicationsCount = job.applications_count || 0;

                  return (
                    <Card key={job.id} data-testid={`job-card-${job.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <CardTitle className="text-xl">{job.title}</CardTitle>
                              <Badge
                                variant={job.status === 'active' ? 'default' : 'secondary'}
                                data-testid={`job-status-${job.id}`}
                              >
                                {job.status}
                              </Badge>
                            </div>
                            <CardDescription className="mt-1">
                              {job.company} • {job.location} • {job.job_type}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Stats */}
                        <div className="flex gap-6 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Eye className="w-4 h-4" />
                            <span>{job.views_count || 0} views</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FileText className="w-4 h-4" />
                            <span>{applicationsCount} applications</span>
                          </div>
                        </div>

                        {/* Description Preview */}
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {job.description}
                        </p>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleViewApplications(job.id)}
                            data-testid={`view-applications-btn-${job.id}`}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View Applications ({applicationsCount})
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditJob(job.id)}
                            data-testid={`edit-job-btn-${job.id}`}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteJob(job.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`delete-job-btn-${job.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default ManageJobs;