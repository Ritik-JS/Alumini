import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { jobService } from '@/services';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, Eye, TrendingUp, FileText, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import usePolling from '@/hooks/usePolling';

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [postedJobs, setPostedJobs] = useState([]);
  const [allApplications, setAllApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setError(null);
      // Load jobs posted by this recruiter
      const jobsResponse = await jobService.getMyJobs(user.id);
      if (!jobsResponse.success) {
        throw new Error(jobsResponse.error || 'Failed to load jobs');
      }
      const jobs = jobsResponse.data || [];
      setPostedJobs(jobs);

      // Load all applications for recruiter's jobs
      const appsResponse = await jobService.getAllRecruiterApplications(user.id);
      if (!appsResponse.success) {
        throw new Error(appsResponse.error || 'Failed to load applications');
      }
      setAllApplications(appsResponse.data || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  // Poll dashboard data every 60 seconds
  usePolling(loadData, 60000);

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <MainNavbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <div>
                    <h3 className="font-semibold">Error Loading Dashboard</h3>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  const activeJobs = postedJobs.filter(j => j.status === 'active');
  const totalApplications = allApplications.length;
  const totalViews = postedJobs.reduce((sum, job) => sum + (job.views_count || 0), 0);
  const recentApplications = allApplications.slice(0, 5);

  const stats = [
    {
      title: 'Active Jobs',
      value: activeJobs.length,
      icon: Briefcase,
      change: `${postedJobs.length} total`,
      changeType: 'neutral',
    },
    {
      title: 'Total Applications',
      value: totalApplications,
      icon: FileText,
      change: `${recentApplications.length} new`,
      changeType: 'positive',
    },
    {
      title: 'Total Views',
      value: totalViews,
      icon: Eye,
      change: '+15% this week',
      changeType: 'positive',
    },
    {
      title: 'Avg. Applications',
      value: postedJobs.length > 0 ? Math.round(totalApplications / postedJobs.length) : 0,
      icon: TrendingUp,
      change: 'per job',
      changeType: 'neutral',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainNavbar />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-6 text-white">
              <h1 className="text-3xl font-bold">Welcome back, Recruiter! 💼</h1>
              <p className="mt-2 opacity-90">
                Manage your job postings and connect with talented candidates.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {stat.title}
                      </CardTitle>
                      <Icon className="h-4 w-4 text-gray-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className={`text-xs mt-1 ${
                        stat.changeType === 'positive' ? 'text-green-600' :
                        stat.changeType === 'negative' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {stat.change}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your recruitment activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link to="/jobs/post" className="p-4 border rounded-lg hover:bg-gray-50 hover:border-green-500 transition-all">
                    <Briefcase className="h-8 w-8 text-green-600 mb-2" />
                    <div className="text-sm font-medium text-gray-900">Post New Job</div>
                    <div className="text-xs text-gray-500 mt-1">Create a new job posting</div>
                  </Link>
                  <Link to="/directory" className="p-4 border rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all">
                    <Users className="h-8 w-8 text-blue-600 mb-2" />
                    <div className="text-sm font-medium text-gray-900">Browse Alumni</div>
                    <div className="text-xs text-gray-500 mt-1">Find qualified candidates</div>
                  </Link>
                  <Link to="/jobs/all-applications" className="p-4 border rounded-lg hover:bg-gray-50 hover:border-purple-500 transition-all" data-testid="view-all-applications-card">
                    <FileText className="h-8 w-8 text-purple-600 mb-2" />
                    <div className="text-sm font-medium text-gray-900">View All Applications</div>
                    <div className="text-xs text-gray-500 mt-1">Manage all job applications</div>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Posted Jobs */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Posted Jobs</CardTitle>
                  <CardDescription>Manage your active job postings</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-gray-600">Loading...</p>
                    </div>
                  ) : postedJobs.length > 0 ? (
                    <div className="space-y-3">
                      {postedJobs.slice(0, 5).map(job => {
                        const jobApplications = allApplications.filter(app => app.job_id === job.id);
                        return (
                          <div key={job.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{job.title}</p>
                                <p className="text-xs text-gray-500">{job.company}</p>
                                <div className="flex gap-4 mt-2 text-xs text-gray-600">
                                  <span>👁️ {job.views_count || 0} views</span>
                                  <span>📄 {jobApplications.length} applications</span>
                                </div>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {job.status}
                              </span>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => navigate(`/jobs/${job.id}/applications`)}
                                data-testid={`view-applications-btn-${job.id}`}
                              >
                                View Applications
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => navigate(`/jobs/edit/${job.id}`)}
                                data-testid={`edit-job-btn-${job.id}`}
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      <Button asChild variant="outline" className="w-full" size="sm">
                        <Link to="/jobs/manage">View All Jobs</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No jobs posted yet</p>
                      <Button asChild size="sm" className="mt-3">
                        <Link to="/jobs/post">Post Your First Job</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Applications */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Applications</CardTitle>
                  <CardDescription>Latest applications to your jobs</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-gray-600">Loading...</p>
                    </div>
                  ) : recentApplications.length > 0 ? (
                    <div className="space-y-3">
                      {recentApplications.map(app => {
                        const job = postedJobs.find(j => j.id === app.job_id);
                        return (
                          <div key={app.id} className="flex items-start justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-sm">Application for {job?.title || 'Job'}</p>
                              <p className="text-xs text-gray-500">Applicant ID: {app.applicant_id}</p>
                              <div className="mt-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  app.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                                  app.status === 'shortlisted' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {app.status}
                                </span>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigate(`/jobs/${app.job_id}/applications`)}
                              data-testid={`review-application-btn-${app.id}`}
                            >
                              Review
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No applications yet</p>
                      <p className="text-xs mt-1">Applications will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Job Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Job Performance Analytics</CardTitle>
                <CardDescription>Overview of your recruitment metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{activeJobs.length}</div>
                    <div className="text-sm text-gray-600 mt-1">Active Jobs</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{totalApplications}</div>
                    <div className="text-sm text-gray-600 mt-1">Total Applications</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">
                      {totalViews > 0 && activeJobs.length > 0 ? Math.round((totalApplications / totalViews) * 100) : 0}%
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Application Rate</div>
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
};

export default RecruiterDashboard;