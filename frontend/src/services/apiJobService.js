import axios from './axiosConfig';
import { handleApiError } from './apiErrorHandler';

// Real Job Service API
export const apiJobService = {
  // Get all jobs with optional filters
  async getAllJobs(filters = {}) {
    try {
      const response = await axios.get('/api/jobs', { params: filters });
      return response.data;
    } catch (error) {
      return handleApiError(error, []);
    }
  },

  // Get job by ID
  async getJobById(jobId) {
    try {
      const response = await axios.get(`/api/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Create new job
  async createJob(jobData) {
    try {
      const response = await axios.post('/api/jobs', jobData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Update job
  async updateJob(jobId, jobData) {
    try {
      const response = await axios.put(`/api/jobs/${jobId}`, jobData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Delete job
  async deleteJob(jobId) {
    try {
      const response = await axios.delete(`/api/jobs/${jobId}`);
      return response.data;
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
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get my applications
  async getMyApplications(userId) {
    try {
      const response = await axios.get(`/api/applications/user/${userId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, []);
    }
  },

  // Get applications for a specific job
  async getJobApplications(jobId) {
    try {
      const response = await axios.get(`/api/jobs/${jobId}/applications`);
      return response.data;
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
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get jobs posted by current user
  async getMyJobs(userId) {
    try {
      const response = await axios.get(`/api/jobs/user/${userId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, []);
    }
  },

  // Get all applications for jobs posted by a recruiter
  async getAllRecruiterApplications(recruiterId) {
    try {
      const response = await axios.get(`/api/applications/recruiter/${recruiterId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, []);
    }
  },

  // Filter jobs (client-side filtering for API response)
  async filterJobs(filters = {}) {
    try {
      const response = await this.getAllJobs();
      const jobs = response.data || [];
      
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
};

export default apiJobService;
