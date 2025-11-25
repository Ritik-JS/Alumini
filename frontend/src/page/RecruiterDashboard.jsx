import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockProfileService } from '@/services/mockProfileService';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, Eye, TrendingUp, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import mockData from '../mockdata.json';

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [postedJobs, setPostedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const jobsData = await mockProfileService.getJobsByPoster(user.id);
        setPostedJobs(jobsData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user.id]);

  const activeJobs = postedJobs.filter(j => j.status === 'active');
  const totalApplications = postedJobs.reduce((sum, job) => sum + (job.applications_count || 0), 0);
  const totalViews = postedJobs.reduce((sum, job) => sum + (job.views_count || 0), 0);
  
  // Get recent applications across all jobs
  const recentApplications = mockData.job_applications?.filter(app =>
    postedJobs.some(job => job.id === app.job_id)
  ).slice(0, 5) || [];

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link to="/jobs/post" className="p-4 border rounded-lg hover:bg-gray-50 hover:border-green-500 transition-all">
                    <Briefcase className="h-8 w-8 text-green-600 mb-2" />
                    <div className="text-sm font-medium text-gray-900">Post New Job</div>
                    <div className="text-xs text-gray-500 mt-1">Create a new job posting</div>
                  </Link>
                  <Link to="/directory" className="p-4 border rounded-lg hover:bg-gray-50 hover:border-green-500 transition-all">
                    <Users className="h-8 w-8 text-blue-600 mb-2" />
                    <div className="text-sm font-medium text-gray-900">Browse Alumni</div>
                    <div className="text-xs text-gray-500 mt-1">Find qualified candidates</div>
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
                  {postedJobs.length > 0 ? (
                    <div className="space-y-3">
                      {postedJobs.slice(0, 5).map(job => (
                        <div key={job.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{job.title}</p>
                              <p className="text-xs text-gray-500">{job.company}</p>
                              <div className="flex gap-4 mt-2 text-xs text-gray-600">
                                <span>👁️ {job.views_count} views</span>
                                <span>📄 {job.applications_count} applications</span>
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
                              onClick={() => navigate(`/jobs/applications/${job.id}`)}
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
                      ))}
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
                  {recentApplications.length > 0 ? (
                    <div className="space-y-3">
                      {recentApplications.map(app => {
                        const job = postedJobs.find(j => j.id === app.job_id);
                        const applicant = mockData.users?.find(u => u.id === app.applicant_id);
                        return (
                          <div key={app.id} className="flex items-start justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{applicant?.email || 'Applicant'}</p>
                              <p className="text-xs text-gray-500">{job?.title || 'Job'}</p>
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
                              onClick={() => navigate(`/jobs/applications/${app.job_id}`)}
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
                      {activeJobs.length > 0 ? Math.round((totalApplications / totalViews) * 100) : 0}%
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