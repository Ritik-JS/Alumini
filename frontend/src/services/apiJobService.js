import axios from './axiosConfig';
import { handleApiError } from './apiErrorHandler';

// Real Job Service API
export const apiJobService = {
  // Get all jobs with optional filters
  async getAllJobs(filters = {}) {
    try {
      const response = await axios.get('/api/jobs', { params: filters });
      return this.normalizeResponse(response.data);
    } catch (error) {
      return handleApiError(error, []);
    }
  },

  // Get job by ID
  async getJobById(jobId) {
    try {
      const response = await axios.get(`/api/jobs/${jobId}`);
      return this.normalizeResponse(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Create new job
  async createJob(jobData) {
    try {
      const response = await axios.post('/api/jobs', jobData);
      return this.normalizeResponse(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Update job
  async updateJob(jobId, jobData) {
    try {
      const response = await axios.put(`/api/jobs/${jobId}`, jobData);
      return this.normalizeResponse(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Delete job
  async deleteJob(jobId) {
    try {
      const response = await axios.delete(`/api/jobs/${jobId}`);
      return this.normalizeResponse(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Apply for job
  async applyForJob(jobId, applicationData) {
    try {
      const response = await axios.post(
        `/api/jobs/${jobId}/apply`,
        applicationData
      );
      return this.normalizeResponse(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get my applications
  async getMyApplications(userId) {
    try {
      const response = await axios.get(`/api/applications/user/${userId}`);
      return this.normalizeResponse(response.data);
    } catch (error) {
      return handleApiError(error, []);
    }
  },

  // Get applications for a specific job
  async getJobApplications(jobId) {
    try {
      const response = await axios.get(`/api/jobs/${jobId}/applications`);
      return this.normalizeResponse(response.data);
    } catch (error) {
      return handleApiError(error, []);
    }
  },

  // Update application status
  async updateApplicationStatus(applicationId, status, message = '') {
    try {
      const response = await axios.put(
        `/api/applications/${applicationId}`,
        { status, response_message: message }
      );
      return this.normalizeResponse(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get jobs posted by current user
  async getMyJobs(userId) {
    try {
      const response = await axios.get(`/api/jobs/user/${userId}`);
      return this.normalizeResponse(response.data);
    } catch (error) {
      return handleApiError(error, []);
    }
  },

  // Get all applications for jobs posted by a recruiter
  async getAllRecruiterApplications(recruiterId) {
    try {
      const response = await axios.get(`/api/applications/recruiter/${recruiterId}`);
      return this.normalizeResponse(response.data);
    } catch (error) {
      return handleApiError(error, []);
    }
  },

  // Filter jobs - OPTIMIZED: Uses backend filtering with axios params array support
  async filterJobs(filters = {}) {
    try {
      // Build query params for backend filtering
      const params = new URLSearchParams();
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      
      // Handle location filters - send all to backend
      if (filters.locations && filters.locations.length > 0) {
        // For single location, use simpler param
        if (filters.locations.length === 1) {
          params.append('location', filters.locations[0]);
        } else {
          // For multiple locations, use first one (backend limitation)
          params.append('location', filters.locations[0]);
        }
      } else if (filters.location) {
        params.append('location', filters.location);
      }
      
      // Handle job type filters
      if (filters.jobTypes && filters.jobTypes.length > 0) {
        if (filters.jobTypes.length === 1) {
          params.append('job_type', filters.jobTypes[0]);
        } else {
          // Use first job type for backend
          params.append('job_type', filters.jobTypes[0]);
        }
      }
      
      // Handle company filters
      if (filters.companies && filters.companies.length > 0) {
        if (filters.companies.length === 1) {
          params.append('company', filters.companies[0]);
        } else {
          // Use first company for backend
          params.append('company', filters.companies[0]);
        }
      } else if (filters.company) {
        params.append('company', filters.company);
      }
      
      // OPTIMIZED: Send all skills to backend (backend now supports multiple)
      if (filters.skills && filters.skills.length > 0) {
        filters.skills.forEach(skill => {
          params.append('skills', skill);
        });
      }
      
      // Get filtered jobs from backend
      const response = await axios.get('/api/jobs', { 
        params: params,
        paramsSerializer: params => {
          // Ensure params are properly serialized for array support
          return params.toString();
        }
      });
      
      let jobs = this.normalizeResponse(response.data).data || [];
      
      // Apply minimal client-side filters only for multiple selections
      // (where backend only supports single value)
      if (filters.locations && filters.locations.length > 1) {
        jobs = jobs.filter(job => 
          filters.locations.some(loc => 
            job.location?.toLowerCase().includes(loc.toLowerCase())
          )
        );
      }
      
      if (filters.jobTypes && filters.jobTypes.length > 1) {
        jobs = jobs.filter(job => filters.jobTypes.includes(job.job_type));
      }
      
      if (filters.companies && filters.companies.length > 1) {
        jobs = jobs.filter(job => 
          filters.companies.some(comp => 
            job.company?.toLowerCase().includes(comp.toLowerCase())
          )
        );
      }
      
      // Experience level filtering (client-side only)
      if (filters.experienceLevels && filters.experienceLevels.length > 0) {
        jobs = jobs.filter(job => 
          filters.experienceLevels.some(exp => 
            job.experience_required?.toLowerCase().includes(exp.toLowerCase())
          )
        );
      }
      
      return jobs;
    } catch (error) {
      console.error('Error filtering jobs:', error);
      return [];
    }
  },

  // Sort jobs
  async sortJobs(jobs, sortBy = 'recent') {
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
  },

  // Paginate results
  async paginateResults(items, page = 1, perPage = 12) {
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
  },

  // Get filter options
  async getFilterOptions() {
    try {
      const response = await this.getAllJobs();
      const jobs = response.data || [];
      
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
    } catch (error) {
      console.error('Error getting filter options:', error);
      return {
        locations: [],
        jobTypes: [],
        companies: [],
        skills: [],
      };
    }
  },

  // Cache for user applications (to avoid repeated API calls)
  _applicationCache: {},

  // Check if user has applied to a job (used by JobDetails.jsx) - OPTIMIZED with caching
  async hasUserApplied(jobId, userId) {
    try {
      // Check if cache exists and is fresh (less than 2 minutes old)
      const cached = this._applicationCache[userId];
      const cacheAge = cached ? Date.now() - cached.timestamp : Infinity;
      const isCacheFresh = cacheAge < 120000; // 2 minutes
      
      let applications;
      
      if (cached && isCacheFresh) {
        // Use cached data
        applications = cached.applications;
      } else {
        // Fetch fresh data and cache it
        const response = await this.getMyApplications(userId);
        applications = response.data || [];
        this._applicationCache[userId] = {
          applications,
          timestamp: Date.now()
        };
      }
      
      return applications.some(app => app.job_id === jobId);
    } catch (error) {
      console.error('Error checking application status:', error);
      return false;
    }
  },

  // Clear application cache for a user (call after new application submitted)
  clearApplicationCache(userId) {
    if (userId) {
      delete this._applicationCache[userId];
    } else {
      this._applicationCache = {};
    }
  },

  // Alias for createJob (used by PostJob.jsx)
  async postJob(jobData) {
    return await this.createJob(jobData);
  },

  // Alias for getJobApplications (used by ApplicationsManager.jsx)
  async getApplicationsForJob(jobId) {
    return await this.getJobApplications(jobId);
  },

  // Alias for applyForJob (used by ApplicationModal.jsx)
  async submitApplication(applicationData) {
    const { job_id, ...restData } = applicationData;
    return await this.applyForJob(job_id, restData);
  },

  // OPTIMIZED: Get job with applications in single call
  async getJobWithApplications(jobId) {
    try {
      // Make parallel requests to get both job and applications
      const [jobResponse, appsResponse] = await Promise.all([
        this.getJobById(jobId),
        this.getJobApplications(jobId)
      ]);

      return {
        success: jobResponse.success && appsResponse.success,
        data: {
          job: jobResponse.data,
          applications: appsResponse.data || []
        },
        error: jobResponse.error || appsResponse.error
      };
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Normalize response to ensure consistent format
  normalizeResponse(response) {
    // If response is null/undefined
    if (!response) {
      return { success: false, data: null, error: 'No response' };
    }
    
    // If already normalized with success flag
    if (response.hasOwnProperty('success')) {
      return response;
    }
    
    // If it's a direct data response
    return {
      success: true,
      data: response.data || response,
      error: null
    };
  },

  // Format date consistently across all components
  formatDate(dateString, format = 'long') {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    switch (format) {
      case 'short':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      case 'long':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      case 'relative':
        return this.getRelativeTime(date);
      default:
        return date.toLocaleDateString('en-US');
    }
  },

  // Get relative time (e.g., "2 days ago")
  getRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  },
};

export default apiJobService;
