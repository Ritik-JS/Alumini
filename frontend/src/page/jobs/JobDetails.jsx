import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Briefcase, DollarSign, Calendar, Clock, Eye, Users, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import MainNavbar from '@/components/layout/MainNavbar';
import Footer from '@/components/layout/Footer';
import ApplicationModal from '@/components/jobs/ApplicationModal';
import { jobService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [similarJobs, setSimilarJobs] = useState([]);

  useEffect(() => {
    const loadJob = async () => {
      setLoading(true);
      try {
        // Load job by ID (no prefix cleaning needed - database uses UUIDs)
        const response = await jobService.getJobById(jobId);
        
        // Consistent response handling
        if (!response.success || !response.data) {
          console.error('Job response:', response);
          toast.error('Job not found');
          navigate('/jobs');
          return;
        }
        
        const jobData = response.data;
        
        if (jobData && jobData.id) {
          setJob(jobData);
          
          // Check if user has applied (uses optimized caching)
          if (user) {
            try {
              const applied = await jobService.hasUserApplied(jobId, user.id);
              setHasApplied(applied);
            } catch (error) {
              console.error('Error checking application status:', error);
              // Continue even if this fails
            }
          }

          // Load similar jobs based on skills
          try {
            if (jobData.skills_required && jobData.skills_required.length > 0) {
              const filtered = await jobService.filterJobs({
                skills: jobData.skills_required.slice(0, 2),
              });
              setSimilarJobs(filtered.filter(j => j.id !== jobId).slice(0, 3));
            }
          } catch (error) {
            console.error('Error loading similar jobs:', error);
            // Continue even if this fails
          }
        } else {
          toast.error('Job not found');
          navigate('/jobs');
        }
      } catch (error) {
        console.error('Error loading job:', error);
        toast.error('Failed to load job details: ' + (error.message || 'Unknown error'));
        // Navigate back after a short delay to allow user to see the error
        setTimeout(() => navigate('/jobs'), 2000);
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [jobId, user, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleApplyClick = () => {
    if (!user) {
      toast.error('Please login to apply for jobs');
      navigate('/login');
      return;
    }

    if (user.role === 'recruiter' || user.role === 'admin') {
      toast.error('Recruiters and admins cannot apply for jobs');
      return;
    }

    setShowApplicationModal(true);
  };

  const handleApplicationModalClose = (submitted) => {
    setShowApplicationModal(false);
    if (submitted) {
      setHasApplied(true);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: `Check out this job opportunity: ${job.title} at ${job.company}`,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainNavbar />
        <main className="flex-1 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!job) {
    return null;
  }

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
    <div className="min-h-screen flex flex-col" data-testid="job-details-page">
      <MainNavbar />
      
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/jobs')}
            className="mb-4"
            data-testid="back-to-jobs-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold mb-2" data-testid="job-title">{job.title}</h1>
                      <p className="text-xl text-gray-600 dark:text-gray-400" data-testid="job-company">
                        {job.company}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleShare}
                      data-testid="share-job-btn"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      <span>{job.experience_required}</span>
                    </div>
                    {job.salary_range && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>{job.salary_range}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Posted {formatDate(job.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <Badge className={getJobTypeColor(job.job_type)}>
                      {job.job_type}
                    </Badge>
                    {job.application_deadline && (
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        Apply by {formatDate(job.application_deadline)}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <Separator />

                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {/* Job Description */}
                    <div>
                      <h2 className="text-xl font-semibold mb-3">Job Description</h2>
                      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line" data-testid="job-description">
                        {job.description}
                      </div>
                    </div>

                    {/* Skills Required */}
                    <div>
                      <h2 className="text-xl font-semibold mb-3">Required Skills</h2>
                      <div className="flex flex-wrap gap-2">
                        {job.skills_required?.map((skill, index) => (
                          <Badge key={index} variant="secondary" data-testid={`skill-badge-${index}`}>
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Similar Jobs */}
              {similarJobs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Similar Jobs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {similarJobs.map((similarJob) => (
                        <div
                          key={similarJob.id}
                          className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                          onClick={() => navigate(`/jobs/${similarJob.id}`)}
                        >
                          <h3 className="font-semibold mb-1">{similarJob.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {similarJob.company} • {similarJob.location}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {similarJob.skills_required?.slice(0, 3).map((skill, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Apply Card */}
              <Card>
                <CardContent className="pt-6">
                  {hasApplied ? (
                    <div className="text-center py-4">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="w-8 h-8 text-green-600 dark:text-green-300" />
                      </div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Application Submitted
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        You have already applied to this job
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate('/jobs/my-applications')}
                      >
                        View My Applications
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleApplyClick}
                      data-testid="apply-now-btn"
                    >
                      Apply Now
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Job Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Eye className="w-4 h-4" />
                      <span>Views</span>
                    </div>
                    <span className="font-semibold">{job.views_count || 0}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>Applications</span>
                    </div>
                    <span className="font-semibold">{job.applications_count || 0}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Company Info */}
              <Card>
                <CardHeader>
                  <CardTitle>About the Company</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {job.company}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Location: {job.location}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Application Modal */}
      {showApplicationModal && (
        <ApplicationModal
          isOpen={showApplicationModal}
          onClose={handleApplicationModalClose}
          job={job}
          userId={user?.id}
        />
      )}
    </div>
  );
};

export default JobDetails;