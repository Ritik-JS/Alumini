import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { profileService } from '@/services';
import { jobService } from '@/services';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText, Mail, Calendar, ArrowLeft, Download, CheckCircle, XCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

const JobApplicationsManager = () => {
  const { user } = useAuth();
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadData();
  }, [jobId]);

  const loadData = async () => {
    try {
      // OPTIMIZED: Load job and applications in parallel using single method
      const response = await jobService.getJobWithApplications(jobId);
      
      if (!response.success) {
        console.error('Failed to load data:', response.error);
        toast.error('Unable to load job details and applications. Please try again later.');
        setLoading(false);
        return;
      }
      
      setJob(response.data.job);
      setApplications(response.data.applications || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('An error occurred while loading data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      const response = await jobService.updateApplicationStatus(applicationId, newStatus);
      if (response.success) {
        setApplications(prev =>
          prev.map(app =>
            app.id === applicationId
              ? { ...app, status: newStatus, updated_at: new Date().toISOString() }
              : app
          )
        );
        toast.success('Application status updated successfully');
      } else {
        console.error('Failed to update status:', response.error);
        toast.error('Failed to update status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('An error occurred. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'shortlisted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'accepted':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filterApplications = (apps) => {
    if (activeTab === 'all') return apps;
    return apps.filter(app => app.status === activeTab);
  };

  const filteredApplications = filterApplications(applications);

  const stats = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    reviewed: applications.filter(a => a.status === 'reviewed').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <MainNavbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading applications...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <MainNavbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center">
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Job not found</h3>
                <Button onClick={() => navigate('/jobs/manage')}>Back to Jobs</Button>
              </CardContent>
            </Card>
          </main>
        </div>
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
            <div>
              <Button
                variant="ghost"
                onClick={() => navigate('/jobs/manage')}
                className="mb-4"
                data-testid="back-to-jobs-btn"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Jobs
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-gray-600 mt-1">
                {job.company} • {job.location} • {applications.length} applications
              </p>
            </div>

            {/* Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>Applications</CardTitle>
                <CardDescription>Review and manage candidate applications</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="all" data-testid="tab-all">
                      All ({stats.all})
                    </TabsTrigger>
                    <TabsTrigger value="pending" data-testid="tab-pending">
                      Pending ({stats.pending})
                    </TabsTrigger>
                    <TabsTrigger value="reviewed" data-testid="tab-reviewed">
                      Reviewed ({stats.reviewed})
                    </TabsTrigger>
                    <TabsTrigger value="shortlisted" data-testid="tab-shortlisted">
                      Shortlisted ({stats.shortlisted})
                    </TabsTrigger>
                    <TabsTrigger value="rejected" data-testid="tab-rejected">
                      Rejected ({stats.rejected})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab} className="mt-6">
                    {filteredApplications.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No applications {activeTab !== 'all' ? `in ${activeTab} status` : 'yet'}
                        </h3>
                        <p className="text-gray-600">
                          {activeTab === 'all'
                            ? 'Applications will appear here when candidates apply'
                            : 'No applications match this filter'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredApplications.map(app => (
                          <Card key={app.id} data-testid={`application-card-${app.id}`}>
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between">
                                <div className="flex gap-4 flex-1">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={app.profile?.photo_url} />
                                    <AvatarFallback>
                                      {app.profile?.name?.split(' ').map(n => n[0]).join('') || 'NA'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-semibold text-lg">
                                        {app.profile?.name || app.applicant?.email || 'Unknown'}
                                      </h3>
                                      <Badge className={getStatusColor(app.status)}>
                                        {app.status}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                      {app.profile?.headline || 'No headline'}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      <span className="flex items-center gap-1">
                                        <Mail className="w-3 h-3" />
                                        {app.applicant?.email}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Applied {new Date(app.applied_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    {app.cover_letter && (
                                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-700 line-clamp-3">
                                          {app.cover_letter}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2 mt-4 pt-4 border-t">
                                {app.cv_url && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(app.cv_url, '_blank')}
                                    data-testid={`download-cv-btn-${app.id}`}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download CV
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/profile/${app.applicant_id}`)}
                                  data-testid={`view-profile-btn-${app.id}`}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Profile
                                </Button>
                                {app.status === 'pending' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleStatusUpdate(app.id, 'reviewed')}
                                    data-testid={`mark-reviewed-btn-${app.id}`}
                                  >
                                    Mark as Reviewed
                                  </Button>
                                )}
                                {(app.status === 'pending' || app.status === 'reviewed') && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleStatusUpdate(app.id, 'shortlisted')}
                                    className="bg-green-600 hover:bg-green-700"
                                    data-testid={`shortlist-btn-${app.id}`}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Shortlist
                                  </Button>
                                )}
                                {app.status !== 'rejected' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleStatusUpdate(app.id, 'rejected')}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    data-testid={`reject-btn-${app.id}`}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default JobApplicationsManager;
