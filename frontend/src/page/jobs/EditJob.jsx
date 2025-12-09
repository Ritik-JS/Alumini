import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { jobService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const EditJob = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingJob, setLoadingJob] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: '',
    location: '',
    job_type: 'full-time',
    experience_required: '',
    skills_required: '',
    salary_range: '',
    apply_link: '',
    application_deadline: '',
    status: 'active',
  });

  useEffect(() => {
    loadJobData();
  }, [jobId]);

  const loadJobData = async () => {
    try {
      setLoadingJob(true);
      const result = await jobService.getJobById(jobId);
      
      if (result.success && result.data) {
        const job = result.data;
        
        // Check if user is the owner
        if (job.posted_by !== user.id) {
          toast.error('You do not have permission to edit this job');
          navigate('/jobs/manage');
          return;
        }

        setFormData({
          title: job.title || '',
          description: job.description || '',
          company: job.company || '',
          location: job.location || '',
          job_type: job.job_type || 'full-time',
          experience_required: job.experience_required || '',
          skills_required: Array.isArray(job.skills_required) ? job.skills_required.join(', ') : '',
          salary_range: job.salary_range || '',
          apply_link: job.apply_link || '',
          application_deadline: job.application_deadline || '',
          status: job.status || 'active',
        });
      } else {
        toast.error('Job not found');
        navigate('/jobs/manage');
      }
    } catch (error) {
      console.error('Error loading job:', error);
      toast.error('Failed to load job details');
      navigate('/jobs/manage');
    } finally {
      setLoadingJob(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.description || !formData.company || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.skills_required) {
      toast.error('Please add at least one required skill');
      return;
    }

    setLoading(true);
    try {
      const jobData = {
        ...formData,
        skills_required: formData.skills_required.split(',').map(s => s.trim()).filter(s => s),
      };

      const result = await jobService.updateJob(jobId, jobData);

      if (result.success) {
        toast.success('Job updated successfully!');
        navigate('/jobs/manage');
      } else {
        toast.error(result.error || 'Failed to update job');
      }
    } catch (error) {
      console.error('Error updating job:', error);
      toast.error('Failed to update job');
    } finally {
      setLoading(false);
    }
  };

  if (!user || (user.role !== 'alumni' && user.role !== 'recruiter')) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainNavbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">Only alumni and recruiters can edit jobs</p>
            <Button onClick={() => navigate('/jobs')}>Browse Jobs</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loadingJob) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <MainNavbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading job details...</p>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" data-testid="edit-job-page">
      <MainNavbar />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => navigate('/jobs/manage')}
              className="mb-4"
              data-testid="back-to-jobs-btn"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Briefcase className="w-8 h-8 text-blue-600" />
                  <div>
                    <CardTitle className="text-2xl">Edit Job Posting</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Update your job posting details
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Job Title */}
                  <div>
                    <Label htmlFor="title">
                      Job Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g., Senior Software Engineer"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      required
                      data-testid="job-title-input"
                    />
                  </div>

                  {/* Company */}
                  <div>
                    <Label htmlFor="company">
                      Company Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="company"
                      placeholder="e.g., Tech Corp"
                      value={formData.company}
                      onChange={(e) => handleChange('company', e.target.value)}
                      required
                      data-testid="company-input"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <Label htmlFor="location">
                      Location <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="location"
                      placeholder="e.g., San Francisco, CA or Remote"
                      value={formData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      required
                      data-testid="location-input"
                    />
                  </div>

                  {/* Job Type & Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="job_type">Job Type</Label>
                      <Select
                        value={formData.job_type}
                        onValueChange={(value) => handleChange('job_type', value)}
                      >
                        <SelectTrigger id="job_type" data-testid="job-type-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="remote">Remote</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => handleChange('status', value)}
                      >
                        <SelectTrigger id="status" data-testid="status-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Experience & Salary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="experience_required">Experience Required</Label>
                      <Input
                        id="experience_required"
                        placeholder="e.g., 3-5 years"
                        value={formData.experience_required}
                        onChange={(e) => handleChange('experience_required', e.target.value)}
                        data-testid="experience-input"
                      />
                    </div>

                    <div>
                      <Label htmlFor="salary_range">Salary Range</Label>
                      <Input
                        id="salary_range"
                        placeholder="e.g., $100k - $150k"
                        value={formData.salary_range}
                        onChange={(e) => handleChange('salary_range', e.target.value)}
                        data-testid="salary-input"
                      />
                    </div>
                  </div>

                  {/* Skills Required */}
                  <div>
                    <Label htmlFor="skills_required">
                      Required Skills <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="skills_required"
                      placeholder="e.g., JavaScript, React, Node.js (comma separated)"
                      value={formData.skills_required}
                      onChange={(e) => handleChange('skills_required', e.target.value)}
                      required
                      data-testid="skills-input"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate multiple skills with commas
                    </p>
                  </div>

                  {/* Job Description */}
                  <div>
                    <Label htmlFor="description">
                      Job Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      rows={8}
                      placeholder="Describe the role, responsibilities, requirements, and benefits..."
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      required
                      data-testid="description-input"
                    />
                  </div>

                  {/* Application Link */}
                  <div>
                    <Label htmlFor="apply_link">Application Link</Label>
                    <Input
                      id="apply_link"
                      type="url"
                      placeholder="e.g., https://company.com/careers/apply"
                      value={formData.apply_link}
                      onChange={(e) => handleChange('apply_link', e.target.value)}
                      data-testid="apply-link-input"
                    />
                  </div>

                  {/* Application Deadline */}
                  <div>
                    <Label htmlFor="application_deadline">Application Deadline</Label>
                    <Input
                      id="application_deadline"
                      type="date"
                      value={formData.application_deadline}
                      onChange={(e) => handleChange('application_deadline', e.target.value)}
                      data-testid="deadline-input"
                    />
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1"
                      data-testid="update-job-btn"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        'Update Job Posting'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/jobs/manage')}
                      disabled={loading}
                      data-testid="cancel-btn"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default EditJob;
