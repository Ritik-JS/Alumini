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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-green-50/30">
      <MainNavbar />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-700 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none"></div>
              <div className="relative z-10">
                <div className="space-y-3 animate-fade-in">
                  <h1 className="text-4xl font-bold tracking-tight">Welcome back, Recruiter! 💼</h1>
                  <p className="mt-2 text-green-100 text-lg max-w-2xl leading-relaxed">
                    Manage your job postings and connect with talented candidates.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-green-200 group cursor-pointer" style={{ animationDelay: `${index * 100}ms` }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 group-hover:text-green-600 transition-colors">
                        {stat.title}
                      </CardTitle>
                      <div className="p-2.5 bg-green-50 rounded-xl group-hover:bg-green-100 transition-all duration-300 group-hover:scale-110">
                        <Icon className="h-5 w-5 text-green-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="text-3xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">{stat.value}</div>
                      <p className={`text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-green-600' :
                        stat.changeType === 'negative' ? 'text-red-600' :
                        'text-gray-500'
                      }`}>
                        {stat.change}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick Actions */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-xl">Quick Actions</CardTitle>
                <CardDescription className="text-base">Manage your recruitment activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Link to="/jobs/post" className="group p-6 border-2 border-gray-100 rounded-xl hover:bg-green-50 hover:border-green-300 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                    <div className="p-3 bg-green-100 rounded-xl w-fit group-hover:bg-green-200 transition-colors duration-300 mb-3">
                      <Briefcase className="h-7 w-7 text-green-600" />
                    </div>
                    <div className="text-base font-semibold text-gray-900 group-hover:text-green-700 transition-colors">Post New Job</div>
                    <div className="text-sm text-gray-600 mt-2 leading-relaxed">Create a new job posting</div>
                  </Link>
                  <Link to="/directory" className="group p-6 border-2 border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                    <div className="p-3 bg-blue-100 rounded-xl w-fit group-hover:bg-blue-200 transition-colors duration-300 mb-3">
                      <Users className="h-7 w-7 text-blue-600" />
                    </div>
                    <div className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">Browse Alumni</div>
                    <div className="text-sm text-gray-600 mt-2 leading-relaxed">Find qualified candidates</div>
                  </Link>
                  <Link to="/jobs/all-applications" className="group p-6 border-2 border-gray-100 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 hover:shadow-md hover:-translate-y-1" data-testid="view-all-applications-card">
                    <div className="p-3 bg-purple-100 rounded-xl w-fit group-hover:bg-purple-200 transition-colors duration-300 mb-3">
                      <FileText className="h-7 w-7 text-purple-600" />
                    </div>
                    <div className="text-base font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">View All Applications</div>
                    <div className="text-sm text-gray-600 mt-2 leading-relaxed">Manage all job applications</div>
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