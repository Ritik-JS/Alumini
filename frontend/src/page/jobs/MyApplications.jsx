import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, Eye, Building, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MainNavbar from '@/components/layout/MainNavbar';
import Footer from '@/components/layout/Footer';
import ApplicationStatusBadge from '@/components/jobs/ApplicationStatusBadge';
import { jobService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';

const MyApplications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadApplications();
  }, [user, navigate]);

  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get user's applications - backend already includes nested job data
      const response = await jobService.getMyApplications(user.id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to load applications');
      }
      const userApplications = response.data || [];
      
      // Backend already returns applications with nested job object
      // No need to load jobs separately - this was causing N+1 query problem
      
      // Sort by applied date (most recent first)
      userApplications.sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at));
      
      setApplications(userApplications);
    } catch (error) {
      console.error('Error loading applications:', error);
      setError(error.message || 'Failed to load applications');
    } finally {
      setLoading(false);
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

  // Show error state
  if (error && !loading) {
    return (
      <div className="min-h-screen flex flex-col" data-testid="my-applications-page">
        <MainNavbar />
        <main className="flex-1 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-8">
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-red-800 dark:text-red-300">
                  <AlertCircle className="h-6 w-6 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Error Loading Applications</h3>
                    <p className="text-sm mt-1">{error}</p>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={loadApplications} variant="outline" size="sm" className="bg-white dark:bg-gray-800">
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
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" data-testid="my-applications-page">
      <MainNavbar />
      
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold">My Applications</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Track the status of your job applications
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
              ) : filteredApplications.length > 0 ? (
                <div className="space-y-4" data-testid="applications-list">
                  {filteredApplications.map((application) => (
                    <Card
                      key={application.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => navigate(`/jobs/${application.job_id}`)}
                      data-testid={`application-card-${application.id}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold mb-1" data-testid="application-job-title">
                              {application.job?.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Building className="w-4 h-4" />
                              <span>{application.job?.company}</span>
                            </div>
                          </div>
                          <ApplicationStatusBadge status={application.status} />
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>Applied on {formatDate(application.applied_at)}</span>
                          </div>
                          {application.viewed_at && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Eye className="w-4 h-4" />
                              <span>Viewed on {formatDate(application.viewed_at)}</span>
                            </div>
                          )}
                        </div>

                        {/* Cover Letter Preview */}
                        {application.cover_letter && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Cover Letter:
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {application.cover_letter}
                            </p>
                          </div>
                        )}

                        {/* Response Message */}
                        {application.response_message && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                              Response from Employer:
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-400">
                              {application.response_message}
                            </p>
                          </div>
                        )}

                        <div className="mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/jobs/${application.job_id}`);
                            }}
                            data-testid="view-job-btn"
                          >
                            View Job Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12" data-testid="no-applications-message">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    No applications found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {activeTab === 'all'
                      ? "You haven't applied to any jobs yet"
                      : `No ${activeTab} applications`}
                  </p>
                  <Button onClick={() => navigate('/jobs')}>
                    Browse Jobs
                  </Button>
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

export default MyApplications;