import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import Footer from '@/components/layout/Footer';
import { jobService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const PostJob = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
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
  });

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
        posted_by: user.id,
        skills_required: formData.skills_required.split(',').map(s => s.trim()).filter(s => s),
      };

      const result = await jobService.postJob(jobData);

      if (result.success) {
        toast.success(result.message);
        navigate('/jobs/manage');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to post job');
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
            <p className="text-gray-600 mb-4">Only alumni and recruiters can post jobs</p>
            <Button onClick={() => navigate('/jobs')}>Browse Jobs</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" data-testid="post-job-page">
      <MainNavbar />
      
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
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
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold">Post a New Job</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Share job opportunities with the alumni network
            </p>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g. Senior Full-Stack Engineer"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      required
                      data-testid="job-title-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="company">Company *</Label>
                    <Input
                      id="company"
                      placeholder="e.g. Tech Corp"
                      value={formData.company}
                      onChange={(e) => handleChange('company', e.target.value)}
                      required
                      data-testid="company-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      placeholder="e.g. San Francisco, CA or Remote"
                      value={formData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      required
                      data-testid="location-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="job_type">Job Type *</Label>
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
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="experience">Experience Required</Label>
                    <Input
                      id="experience"
                      placeholder="e.g. 3-5 years"
                      value={formData.experience_required}
                      onChange={(e) => handleChange('experience_required', e.target.value)}
                      data-testid="experience-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="salary">Salary Range</Label>
                    <Input
                      id="salary"
                      placeholder="e.g. $100,000 - $150,000"
                      value={formData.salary_range}
                      onChange={(e) => handleChange('salary_range', e.target.value)}
                      data-testid="salary-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="deadline">Application Deadline</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.application_deadline}
                      onChange={(e) => handleChange('application_deadline', e.target.value)}
                      data-testid="deadline-input"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Job Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the role, responsibilities, requirements, and qualifications..."
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={10}
                    required
                    data-testid="description-textarea"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use line breaks to format your description
                  </p>
                </div>

                {/* Skills */}
                <div>
                  <Label htmlFor="skills">Required Skills *</Label>
                  <Input
                    id="skills"
                    placeholder="e.g. JavaScript, React, Node.js, Python (comma-separated)"
                    value={formData.skills_required}
                    onChange={(e) => handleChange('skills_required', e.target.value)}
                    required
                    data-testid="skills-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate skills with commas
                  </p>
                </div>

                {/* Application Link */}
                <div>
                  <Label htmlFor="apply_link">Application Link (Optional)</Label>
                  <Input
                    id="apply_link"
                    type="url"
                    placeholder="https://company.com/apply"
                    value={formData.apply_link}
                    onChange={(e) => handleChange('apply_link', e.target.value)}
                    data-testid="apply-link-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    External application URL (if any)
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/jobs/manage')}
                    disabled={loading}
                    data-testid="cancel-btn"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    data-testid="submit-job-btn"
                  >
                    {loading ? 'Posting...' : 'Post Job'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PostJob;
