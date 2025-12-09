// Mock Job Service for AlumUnity
// This provides mock data and API calls for job-related features

import mockData from '../mockdata.json';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Storage key
const JOBS_KEY = 'jobs';
const JOB_APPLICATIONS_KEY = 'job_applications';

// Helper to get data from localStorage or fallback to mock data
const getStoredData = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return fallback;
  }
};

// Helper to save data to localStorage
const saveData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Get all jobs
const getAllJobsData = () => {
  return getStoredData(JOBS_KEY, mockData.jobs || []);
};

// Get all applications
const getAllApplicationsData = () => {
  return getStoredData(JOB_APPLICATIONS_KEY, mockData.job_applications || []);
};

// Job Service API
export const jobService = {
  // Get all jobs with optional filters
  async getAllJobs(filters = {}) {
    try {
      const jobs = getAllJobsData();
      return {
        success: true,
        data: jobs,
        total: jobs.length,
      };
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Filter jobs (utility function)
  async filterJobs(filters = {}) {
    return filterJobs(filters);
  },

  // Sort jobs (utility function)
  async sortJobs(jobs, sortBy = 'recent') {
    return sortJobs(jobs, sortBy);
  },

  // Paginate results (utility function)
  async paginateResults(items, page = 1, perPage = 12) {
    return paginateResults(items, page, perPage);
  },

  // Get filter options (utility function)
  async getFilterOptions() {
    return getFilterOptions();
  },

  // Get job by ID
  async getJobById(jobId) {
    try {
      const jobs = getAllJobsData();
      const job = jobs.find(j => j.id === jobId);
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
      const jobs = getAllJobsData();
      const newJob = {
        id: `job-${Date.now()}`,
        ...jobData,
        created_at: new Date().toISOString(),
        applications_count: 0,
        views_count: 0,
        status: 'active'
      };
      jobs.push(newJob);
      saveData(JOBS_KEY, jobs);
      return { success: true, data: newJob };
    } catch (error) {
      console.error('Error creating job:', error);
      return { success: false, error: error.message };
    }
  },

  // Update job
  async updateJob(jobId, jobData) {
    try {
      const jobs = getAllJobsData();
      const index = jobs.findIndex(j => j.id === jobId);
      if (index !== -1) {
        jobs[index] = { ...jobs[index], ...jobData, updated_at: new Date().toISOString() };
        saveData(JOBS_KEY, jobs);
        return { success: true, data: jobs[index] };
      }
      return { success: false, error: 'Job not found' };
    } catch (error) {
      console.error('Error updating job:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete job
  async deleteJob(jobId) {
    try {
      const jobs = getAllJobsData();
      const filtered = jobs.filter(j => j.id !== jobId);
      saveData(JOBS_KEY, filtered);
      return { success: true, message: 'Job deleted successfully' };
    } catch (error) {
      console.error('Error deleting job:', error);
      return { success: false, error: error.message };
    }
  },

  // Apply for job
  async applyForJob(jobId, applicationData) {
    try {
      const applications = getAllApplicationsData();
      const application = {
        id: `app-${Date.now()}`,
        job_id: jobId,
        ...applicationData,
        status: 'pending',
        applied_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      applications.push(application);
      saveData(JOB_APPLICATIONS_KEY, applications);
      return { success: true, data: application };
    } catch (error) {
      console.error('Error applying for job:', error);
      return { success: false, error: error.message };
    }
  },

  // Get my applications
  async getMyApplications(userId) {
    try {
      const applications = getAllApplicationsData();
      const userApps = applications.filter(app => app.applicant_id === userId);
      return { success: true, data: userApps };
    } catch (error) {
      console.error('Error fetching applications:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Get applications for a specific job (for recruiters)
  async getJobApplications(jobId) {
    try {
      const applications = getAllApplicationsData();
      const jobApps = applications.filter(app => app.job_id === jobId);
      return { success: true, data: jobApps };
    } catch (error) {
      console.error('Error fetching job applications:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Update application status (for recruiters)
  async updateApplicationStatus(applicationId, status, message = '') {
    try {
      const applications = getAllApplicationsData();
      const index = applications.findIndex(app => app.id === applicationId);
      if (index !== -1) {
        applications[index] = {
          ...applications[index],
          status,
          response_message: message,
          updated_at: new Date().toISOString()
        };
        saveData(JOB_APPLICATIONS_KEY, applications);
        return { success: true, data: applications[index] };
      }
      return { success: false, error: 'Application not found' };
    } catch (error) {
      console.error('Error updating application:', error);
      return { success: false, error: error.message };
    }
  },

  // Get jobs posted by current user
  async getMyJobs(userId) {
    try {
      const jobs = getAllJobsData();
      const userJobs = jobs.filter(j => j.posted_by === userId);
      return { success: true, data: userJobs };
    } catch (error) {
      console.error('Error fetching my jobs:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Get all applications for jobs posted by a recruiter
  async getAllRecruiterApplications(recruiterId) {
    try {
      const jobs = getAllJobsData();
      const recruiterJobs = jobs.filter(j => j.posted_by === recruiterId);
      const jobIds = recruiterJobs.map(j => j.id);
      
      const applications = getAllApplicationsData();
      const recruiterApplications = applications.filter(app => jobIds.includes(app.job_id));
      
      return { success: true, data: recruiterApplications };
    } catch (error) {
      console.error('Error fetching recruiter applications:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
};

// Utility functions
export const hasUserApplied = (jobId, userId) => {
  const applications = getAllApplicationsData();
  return applications.some(app => app.job_id === jobId && app.applicant_id === userId);
};

export const filterJobs = (filters = {}) => {
  const jobs = getAllJobsData();
  return jobs.filter(job => {
    // Search filter
    if (filters.search && filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      const matchTitle = job.title?.toLowerCase().includes(searchLower);
      const matchCompany = job.company?.toLowerCase().includes(searchLower);
      const matchDescription = job.description?.toLowerCase().includes(searchLower);
      if (!matchTitle && !matchCompany && !matchDescription) return false;
    }

    // Location filter
    if (filters.locations && filters.locations.length > 0) {
      if (!filters.locations.some(loc => job.location?.toLowerCase().includes(loc.toLowerCase()))) {
        return false;
      }
    }

    // Job type filter
    if (filters.jobTypes && filters.jobTypes.length > 0) {
      if (!filters.jobTypes.includes(job.job_type)) {
        return false;
      }
    }

    // Company filter
    if (filters.companies && filters.companies.length > 0) {
      if (!filters.companies.some(comp => job.company?.toLowerCase().includes(comp.toLowerCase()))) {
        return false;
      }
    }

    // Skills filter
    if (filters.skills && filters.skills.length > 0) {
      if (!filters.skills.some(skill => job.skills_required?.includes(skill))) {
        return false;
      }
    }

    // Experience level filter
    if (filters.experienceLevels && filters.experienceLevels.length > 0) {
      if (!filters.experienceLevels.some(exp => job.experience_required?.toLowerCase().includes(exp.toLowerCase()))) {
        return false;
      }
    }

    return true;
  });
};

export const sortJobs = (jobs, sortBy = 'recent') => {
  const sorted = [...jobs];
  switch (sortBy) {
    case 'recent':
    case 'date':
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
    case 'applications':
      sorted.sort((a, b) => (b.applications_count || 0) - (a.applications_count || 0));
      break;
    case 'views':
      sorted.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
      break;
    case 'company':
      sorted.sort((a, b) => (a.company || '').localeCompare(b.company || ''));
      break;
    default:
      break;
  }
  return sorted;
};

export const paginateResults = (items, page = 1, perPage = 12) => {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const paginatedItems = items.slice(start, end);
  
  return {
    data: paginatedItems,
    totalPages: Math.ceil(items.length / perPage),
    totalResults: items.length,
    currentPage: page,
    hasMore: end < items.length,
  };
};

export const submitApplication = jobService.applyForJob; // Alias

export const getFilterOptions = () => {
  const jobs = getAllJobsData();
  const locations = [...new Set(jobs.map(j => j.location).filter(Boolean))];
  const jobTypes = [...new Set(jobs.map(j => j.job_type).filter(Boolean))];
  const companies = [...new Set(jobs.map(j => j.company).filter(Boolean))];
  const allSkills = jobs.flatMap(j => j.skills_required || []);
  const skills = [...new Set(allSkills)];
  
  return {
    locations,
    jobTypes,
    companies,
    skills,
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
export const getAllRecruiterApplications = jobService.getAllRecruiterApplications;

export default jobService;
