import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Mail, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import MainNavbar from '@/components/layout/MainNavbar';
import Footer from '@/components/layout/Footer';
import ApplicationStatusBadge from '@/components/jobs/ApplicationStatusBadge';
import { jobService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ApplicationsManager = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!user || (user.role !== 'alumni' && user.role !== 'recruiter')) {
      navigate('/jobs');
      return;
    }

    loadData();
  }, [jobId, user, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const jobResult = await jobService.getJobById(jobId);
      if (!jobResult.success || !jobResult.data) {
        toast.error('Job not found');
        navigate('/jobs/manage');
        return;
      }

      const jobData = jobResult.data;

      // Check if user owns this job
      if (jobData.posted_by !== user.id) {
        toast.error('You do not have permission to view these applications');
        navigate('/jobs/manage');
        return;
      }

      setJob(jobData);

      // Load applications with consistent response handling
      const appsResult = await jobService.getApplicationsForJob(jobId);
      if (appsResult.success) {
        setApplications(appsResult.data || []);
      } else {
        console.error('Failed to load applications:', appsResult.error);
        toast.error('Failed to load applications');
        setApplications([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      const result = await jobService.updateApplicationStatus(applicationId, newStatus, 
        newStatus === 'shortlisted' ? 'Congratulations! We would like to move forward with your application.' :
        newStatus === 'rejected' ? 'Thank you for your interest. Unfortunately, we have decided to move forward with other candidates.' :
        null
      );

      if (result.success) {
        toast.success('Application status updated');
        loadData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filterApplications = (status) => {
    if (status === 'all') return applications;
    return applications.filter(app => app.status === status);
  };

  const getStatusCounts = () => {
    return {
      all: applications.length,
      pending: applications.filter(a => a.status === 'pending').length,
      reviewed: applications.filter(a => a.status === 'reviewed').length,
      shortlisted: applications.filter(a => a.status === 'shortlisted').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
    };
  };

  const counts = getStatusCounts();
  const filteredApplications = filterApplications(activeTab);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainNavbar />
        <main className="flex-1 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" data-testid="applications-manager-page">
      <MainNavbar />
      
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <Button
            variant="ghost"
            onClick={() => navigate('/jobs/manage')}
            className="mb-4"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Manage Jobs
          </Button>

          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">{job?.title}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {job?.company} • Manage applications for this position
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="all" data-testid="tab-all">
                All <span className="ml-2 text-xs">({counts.all})</span>
              </TabsTrigger>
              <TabsTrigger value="pending" data-testid="tab-pending">
                Pending <span className="ml-2 text-xs">({counts.pending})</span>
              </TabsTrigger>
              <TabsTrigger value="reviewed" data-testid="tab-reviewed">
                Reviewed <span className="ml-2 text-xs">({counts.reviewed})</span>
              </TabsTrigger>
              <TabsTrigger value="shortlisted" data-testid="tab-shortlisted">
                Shortlisted <span className="ml-2 text-xs">({counts.shortlisted})</span>
              </TabsTrigger>
              <TabsTrigger value="rejected" data-testid="tab-rejected">
                Rejected <span className="ml-2 text-xs">({counts.rejected})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredApplications.length > 0 ? (
                <div className="space-y-4" data-testid="applications-list">
                  {filteredApplications.map((application) => (
                    <Card key={application.id} data-testid={`application-card-${application.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={application.applicant?.photo_url} />
                              <AvatarFallback>
                                {application.applicant?.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold" data-testid="applicant-name">
                                {application.applicant?.name || 'Unknown Applicant'}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {application.applicant?.headline || application.applicant?.email}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                <span>Applied {formatDate(application.applied_at)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <ApplicationStatusBadge status={application.status} />
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        {/* Cover Letter */}
                        {application.cover_letter && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Cover Letter:
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                              {application.cover_letter}
                            </p>
                          </div>
                        )}

                        {/* CV Link */}
                        {application.cv_url && (
                          <div className="mb-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(application.cv_url, '_blank')}
                              data-testid="view-cv-btn"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              View CV
                              <ExternalLink className="w-3 h-3 ml-2" />
                            </Button>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-4 border-t">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Change Status:
                            </span>
                            <Select
                              value={application.status}
                              onValueChange={(value) => handleStatusChange(application.id, value)}
                            >
                              <SelectTrigger className="w-[180px]" data-testid="status-select">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="reviewed">Reviewed</SelectItem>
                                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/profile/${application.applicant_id}`)}
                            data-testid="view-profile-btn"
                          >
                            View Profile
                          </Button>
                        </div>

                        {/* Response Message */}
                        {application.response_message && (
                          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                              Your Response:
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-400">
                              {application.response_message}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12" data-testid="no-applications-message">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    No applications yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {activeTab === 'all'
                      ? 'No one has applied to this job yet'
                      : `No ${activeTab} applications`}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ApplicationsManager;
