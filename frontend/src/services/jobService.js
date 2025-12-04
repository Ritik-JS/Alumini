import axios from 'axios';
import mockData from '../mockdata.json';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

// Storage keys for mock
const JOBS_KEY = 'jobs';
const JOB_APPLICATIONS_KEY = 'job_applications';

// Mock helpers
const getStoredData = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return fallback;
  }
};

const saveData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

const getAllJobsData = () => getStoredData(JOBS_KEY, mockData.jobs || []);
const getAllApplicationsData = () => getStoredData(JOB_APPLICATIONS_KEY, mockData.job_applications || []);

// Unified Job Service
export const jobService = {
  // Get all jobs with optional filters
  async getAllJobs(filters = {}) {
    if (USE_MOCK_DATA) {
      try {
        const jobs = getAllJobsData();
        return {
          success: true,
          data: jobs,
          total: jobs.length,
        };
      } catch (error) {
        return { success: false, error: error.message, data: [] };
      }
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/jobs`, { params: filters });
        return response.data;
      } catch (error) {
        return { success: false, error: error.message, data: [] };
      }
    }
  },

  // Get job by ID
  async getJobById(jobId) {
    if (USE_MOCK_DATA) {
      try {
        const jobs = getAllJobsData();
        const job = jobs.find(j => j.id === jobId);
        return { success: true, data: job || null };
      } catch (error) {
        return { success: false, error: error.message };
      }
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/jobs/${jobId}`);
        return response.data;
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Create new job
  async createJob(jobData) {
    if (USE_MOCK_DATA) {
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
        return { success: false, error: error.message };
      }
    } else {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/jobs`, jobData);
        return response.data;
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Update job
  async updateJob(jobId, jobData) {
    if (USE_MOCK_DATA) {
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
        return { success: false, error: error.message };
      }
    } else {
      try {
        const response = await axios.put(`${BACKEND_URL}/api/jobs/${jobId}`, jobData);
        return response.data;
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Delete job
  async deleteJob(jobId) {
    if (USE_MOCK_DATA) {
      try {
        const jobs = getAllJobsData();
        const filtered = jobs.filter(j => j.id !== jobId);
        saveData(JOBS_KEY, filtered);
        return { success: true, message: 'Job deleted successfully' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    } else {
      try {
        const response = await axios.delete(`${BACKEND_URL}/api/jobs/${jobId}`);
        return response.data;
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Apply for job
  async applyForJob(jobId, applicationData) {
    if (USE_MOCK_DATA) {
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
        return { success: false, error: error.message };
      }
    } else {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/jobs/${jobId}/apply`, applicationData);
        return response.data;
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Get my applications
  async getMyApplications(userId) {
    if (USE_MOCK_DATA) {
      try {
        const applications = getAllApplicationsData();
        const userApps = applications.filter(app => app.applicant_id === userId);
        return { success: true, data: userApps };
      } catch (error) {
        return { success: false, error: error.message, data: [] };
      }
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/applications/user/${userId}`);
        return response.data;
      } catch (error) {
        return { success: false, error: error.message, data: [] };
      }
    }
  },

  // Get applications for a specific job
  async getJobApplications(jobId) {
    if (USE_MOCK_DATA) {
      try {
        const applications = getAllApplicationsData();
        const jobApps = applications.filter(app => app.job_id === jobId);
        return { success: true, data: jobApps };
      } catch (error) {
        return { success: false, error: error.message, data: [] };
      }
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/jobs/${jobId}/applications`);
        return response.data;
      } catch (error) {
        return { success: false, error: error.message, data: [] };
      }
    }
  },

  // Update application status
  async updateApplicationStatus(applicationId, status, message = '') {
    if (USE_MOCK_DATA) {
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
        return { success: false, error: error.message };
      }
    } else {
      try {
        const response = await axios.put(
          `${BACKEND_URL}/api/applications/${applicationId}`,
          { status, response_message: message }
        );
        return response.data;
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Get jobs posted by current user
  async getMyJobs(userId) {
    if (USE_MOCK_DATA) {
      try {
        const jobs = getAllJobsData();
        const userJobs = jobs.filter(j => j.posted_by === userId);
        return { success: true, data: userJobs };
      } catch (error) {
        return { success: false, error: error.message, data: [] };
      }
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/jobs/user/${userId}`);
        return response.data;
      } catch (error) {
        return { success: false, error: error.message, data: [] };
      }
    }
  },

  // Get all applications for jobs posted by a recruiter
  async getAllRecruiterApplications(recruiterId) {
    if (USE_MOCK_DATA) {
      try {
        const jobs = getAllJobsData();
        const recruiterJobs = jobs.filter(j => j.posted_by === recruiterId);
        const jobIds = recruiterJobs.map(j => j.id);
        
        const applications = getAllApplicationsData();
        const recruiterApplications = applications.filter(app => jobIds.includes(app.job_id));
        
        return { success: true, data: recruiterApplications };
      } catch (error) {
        return { success: false, error: error.message, data: [] };
      }
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/applications/recruiter/${recruiterId}`);
        return response.data;
      } catch (error) {
        return { success: false, error: error.message, data: [] };
      }
    }
  },
};

export default jobService;
