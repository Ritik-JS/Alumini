import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Real Job Service API
export const apiJobService = {
  // Get all jobs with optional filters
  async getAllJobs(filters = {}) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/jobs`, { params: filters });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  },

  // Get job by ID
  async getJobById(jobId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Create new job
  async createJob(jobData) {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/jobs`, jobData);
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Update job
  async updateJob(jobId, jobData) {
    try {
      const response = await axios.put(`${BACKEND_URL}/api/jobs/${jobId}`, jobData);
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Delete job
  async deleteJob(jobId) {
    try {
      const response = await axios.delete(`${BACKEND_URL}/api/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Apply for job
  async applyForJob(jobId, applicationData) {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/jobs/${jobId}/apply`,
        applicationData
      );
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get my applications
  async getMyApplications(userId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/applications/user/${userId}`);
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  },

  // Get applications for a specific job
  async getJobApplications(jobId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/jobs/${jobId}/applications`);
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  },

  // Update application status
  async updateApplicationStatus(applicationId, status, message = '') {
    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/applications/${applicationId}`,
        { status, response_message: message }
      );
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get jobs posted by current user
  async getMyJobs(userId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/jobs/user/${userId}`);
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  },

  // Get all applications for jobs posted by a recruiter
  async getAllRecruiterApplications(recruiterId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/applications/recruiter/${recruiterId}`);
      return response.data;
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  },
};

export default apiJobService;
