import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Users, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import MainNavbar from '@/components/layout/MainNavbar';
import Footer from '@/components/layout/Footer';
import { getJobsByUser, deleteJob, updateJob, getApplicationsForJob } from '@/services/mockJobService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ManageJobs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);

  useEffect(() => {
    if (!user || (user.role !== 'alumni' && user.role !== 'recruiter')) {
      navigate('/jobs');
      return;
    }

    loadJobs();
  }, [user, navigate]);

  const loadJobs = () => {
    setLoading(true);
    try {
      // Get jobs from mock data
      const mockJobs = getJobsByUser(user.id);
      
      // Get jobs from localStorage (user's posted jobs)
      const storedJobs = JSON.parse(localStorage.getItem('posted_jobs') || '[]')
        .filter(job => job.posted_by === user.id);

      const allJobs = [...mockJobs, ...storedJobs];

      // Enrich with application counts
      const enriched = allJobs.map(job => {
        const applications = getApplicationsForJob(job.id);
        return {
          ...job,
          applications_count: applications.length,
        };
      });

      // Sort by created date (most recent first)
      enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setJobs(enriched);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (job) => {
    setJobToDelete(job);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return;

    try {
      const result = await deleteJob(jobToDelete.id);
      if (result.success) {
        toast.success('Job deleted successfully');
        loadJobs();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to delete job');
    } finally {
      setDeleteDialogOpen(false);
      setJobToDelete(null);
    }
  };

  const handleToggleStatus = async (job) => {
    const newStatus = job.status === 'active' ? 'closed' : 'active';
    try {
      const result = await updateJob(job.id, { status: newStatus });
      if (result.success) {
        toast.success(`Job ${newStatus === 'active' ? 'activated' : 'closed'}`);
        loadJobs();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to update job status');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getJobTypeColor = (type) => {
    const colors = {
      'full-time': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'part-time': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'internship': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'contract': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen flex flex-col" data-testid="manage-jobs-page">
      <MainNavbar />
      
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Manage Jobs</h1>
              <p className="text-gray-600 dark:text-gray-400">
                View and manage your posted job opportunities
              </p>
            </div>
            <Button
              onClick={() => navigate('/jobs/post')}
              data-testid="post-new-job-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Post New Job
            </Button>
          </div>

          {/* Jobs List */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : jobs.length > 0 ? (
            <div className="space-y-4" data-testid="jobs-list">
              {jobs.map((job) => (
                <Card key={job.id} data-testid={`job-card-${job.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold" data-testid="job-title">
                            {job.title}
                          </h3>
                          <Badge className={getJobTypeColor(job.job_type)}>
                            {job.job_type}
                          </Badge>
                          <Badge
                            variant={job.status === 'active' ? 'default' : 'secondary'}
                            data-testid="job-status"
                          >
                            {job.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {job.company} • {job.location}
                        </p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid="job-actions-menu">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/jobs/${job.id}`)}
                            data-testid="view-job-menu-item"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Job
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/jobs/${job.id}/applications`)}
                            data-testid="view-applications-menu-item"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            View Applications
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(job)}
                            data-testid="toggle-status-menu-item"
                          >
                            {job.status === 'active' ? 'Close Job' : 'Activate Job'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(job)}
                            className="text-red-600"
                            data-testid="delete-job-menu-item"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{job.views_count || 0} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{job.applications_count || 0} applications</span>
                      </div>
                      <div>
                        Posted {formatDate(job.created_at)}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.skills_required?.slice(0, 5).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {job.skills_required?.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{job.skills_required.length - 5} more
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        data-testid="view-details-btn"
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/jobs/${job.id}/applications`)}
                        data-testid="view-applications-btn"
                      >
                        <Users className="w-4 h-4 mr-1" />
                        View Applications ({job.applications_count || 0})
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12" data-testid="no-jobs-message">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No jobs posted yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Start by posting your first job opportunity
              </p>
              <Button onClick={() => navigate('/jobs/post')}>
                <Plus className="w-4 h-4 mr-2" />
                Post Your First Job
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{jobToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-btn">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-delete-btn"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageJobs;
