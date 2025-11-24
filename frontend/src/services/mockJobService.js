// Mock Job Service for Alumni Portal
// This provides mock data and API calls for job-related features

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Mock jobs data
const mockJobs = [
  {
    id: '1',
    title: 'Senior Software Engineer',
    company: 'Tech Corp',
    location: 'San Francisco, CA',
    job_type: 'full-time',
    description: 'We are looking for an experienced software engineer...',
    experience_required: '5+ years',
    skills_required: ['JavaScript', 'React', 'Node.js', 'Python'],
    salary_range: '$120,000 - $160,000',
    posted_by: 'user-1',
    status: 'active',
    created_at: new Date().toISOString(),
    applications_count: 15,
    views_count: 120,
  },
  {
    id: '2',
    title: 'Product Manager',
    company: 'Innovation Labs',
    location: 'New York, NY',
    job_type: 'full-time',
    description: 'Seeking a product manager to lead our team...',
    experience_required: '3+ years',
    skills_required: ['Product Management', 'Agile', 'Data Analysis'],
    salary_range: '$100,000 - $140,000',
    posted_by: 'user-2',
    status: 'active',
    created_at: new Date().toISOString(),
    applications_count: 23,
    views_count: 200,
  },
];

// Mock applications data
const mockApplications = [
  {
    id: 'app-1',
    job_id: '1',
    applicant_id: 'current-user',
    status: 'pending',
    applied_at: new Date().toISOString(),
    job: mockJobs[0],
  },
];

// Job Service API
export const jobService = {
  // Get all jobs with optional filters
  async getAllJobs(filters = {}) {
    try {
      // TODO: Replace with real API call
      // const response = await fetch(`${BACKEND_URL}/api/jobs?${new URLSearchParams(filters)}`);
      // return await response.json();
      
      return {
        success: true,
        data: mockJobs,
        total: mockJobs.length,
      };
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Get job by ID
  async getJobById(jobId) {
    try {
      // TODO: Replace with real API call
      // const response = await fetch(`${BACKEND_URL}/api/jobs/${jobId}`);
      // return await response.json();
      
      const job = mockJobs.find(j => j.id === jobId);
      return {
        success: true,
        data: job || null,
      };
    } catch (error) {
      console.error('Error fetching job:', error);
      return { success: false, error: error.message };
    }
  },

  // Create new job
  async createJob(jobData) {
    try {
      // TODO: Replace with real API call
      // const response = await fetch(`${BACKEND_URL}/api/jobs`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(jobData),
      // });
      // return await response.json();
      
      const newJob = {
        id: `job-${Date.now()}`,
        ...jobData,
        created_at: new Date().toISOString(),
        applications_count: 0,
        views_count: 0,
      };
      mockJobs.push(newJob);
      return { success: true, data: newJob };
    } catch (error) {
      console.error('Error creating job:', error);
      return { success: false, error: error.message };
    }
  },

  // Update job
  async updateJob(jobId, jobData) {
    try {
      // TODO: Replace with real API call
      return { success: true, data: { id: jobId, ...jobData } };
    } catch (error) {
      console.error('Error updating job:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete job
  async deleteJob(jobId) {
    try {
      // TODO: Replace with real API call
      return { success: true, message: 'Job deleted successfully' };
    } catch (error) {
      console.error('Error deleting job:', error);
      return { success: false, error: error.message };
    }
  },

  // Apply for job
  async applyForJob(jobId, applicationData) {
    try {
      // TODO: Replace with real API call
      const application = {
        id: `app-${Date.now()}`,
        job_id: jobId,
        ...applicationData,
        status: 'pending',
        applied_at: new Date().toISOString(),
      };
      mockApplications.push(application);
      return { success: true, data: application };
    } catch (error) {
      console.error('Error applying for job:', error);
      return { success: false, error: error.message };
    }
  },

  // Get my applications
  async getMyApplications() {
    try {
      // TODO: Replace with real API call
      return { success: true, data: mockApplications };
    } catch (error) {
      console.error('Error fetching applications:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Get applications for a specific job (for recruiters)
  async getJobApplications(jobId) {
    try {
      // TODO: Replace with real API call
      const applications = mockApplications.filter(app => app.job_id === jobId);
      return { success: true, data: applications };
    } catch (error) {
      console.error('Error fetching job applications:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Update application status (for recruiters)
  async updateApplicationStatus(applicationId, status, message = '') {
    try {
      // TODO: Replace with real API call
      return {
        success: true,
        data: { id: applicationId, status, response_message: message },
      };
    } catch (error) {
      console.error('Error updating application:', error);
      return { success: false, error: error.message };
    }
  },

  // Get jobs posted by current user
  async getMyJobs() {
    try {
      // TODO: Replace with real API call
      return { success: true, data: mockJobs.slice(0, 2) };
    } catch (error) {
      console.error('Error fetching my jobs:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
};

// Utility functions
export const hasUserApplied = (jobId, userId) => {
  return mockApplications.some(app => app.job_id === jobId && app.applicant_id === userId);
};

export const filterJobs = (jobs, filters) => {
  return jobs.filter(job => {
    if (filters.location && !job.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    if (filters.job_type && job.job_type !== filters.job_type) {
      return false;
    }
    if (filters.company && !job.company.toLowerCase().includes(filters.company.toLowerCase())) {
      return false;
    }
    return true;
  });
};

export const sortJobs = (jobs, sortBy = 'date') => {
  const sorted = [...jobs];
  if (sortBy === 'date') {
    sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else if (sortBy === 'applications') {
    sorted.sort((a, b) => b.applications_count - a.applications_count);
  }
  return sorted;
};

export const paginateResults = (items, page = 1, perPage = 10) => {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  return items.slice(start, end);
};

export const submitApplication = jobService.applyForJob; // Alias

export const getFilterOptions = () => {
  const locations = [...new Set(mockJobs.map(j => j.location))];
  const jobTypes = [...new Set(mockJobs.map(j => j.job_type))];
  const companies = [...new Set(mockJobs.map(j => j.company))];
  
  return {
    locations,
    jobTypes,
    companies,
  };
};

// Export individual functions for easier imports
export const getAllJobs = jobService.getAllJobs;
export const getJobById = jobService.getJobById;
export const createJob = jobService.createJob;
export const postJob = jobService.createJob; // Alias
export const updateJob = jobService.updateJob;
export const deleteJob = jobService.deleteJob;
export const applyForJob = jobService.applyForJob;
export const getMyApplications = jobService.getMyApplications;
export const getAllApplicationsWithUserApps = jobService.getMyApplications; // Alias
export const getJobApplications = jobService.getJobApplications;
export const getApplicationsForJob = jobService.getJobApplications; // Alias
export const updateApplicationStatus = jobService.updateApplicationStatus;
export const getMyJobs = jobService.getMyJobs;
export const getJobsByUser = jobService.getMyJobs; // Alias

export default jobService;
