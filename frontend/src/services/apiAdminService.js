/**
 * Admin API Service
 * Handles all API calls for admin operations
 */

import axios from './axiosConfig';

const apiAdminService = {
  // ==================== USER MANAGEMENT ====================
  
  /**
   * Get all users with filters and pagination
   */
  async getAllUsers(params = {}) {
    const { role, search, limit = 100, offset = 0 } = params;
    const queryParams = new URLSearchParams();
    
    if (role) queryParams.append('role', role);
    if (search) queryParams.append('search', search);
    queryParams.append('limit', limit);
    queryParams.append('offset', offset);
    
    const response = await axios.get(`/api/admin/users?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get detailed user information
   */
  async getUserDetails(userId) {
    const response = await axios.get(`/api/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Ban a user
   */
  async banUser(userId) {
    const response = await axios.put(`/api/admin/users/${userId}/ban`);
    return response.data;
  },

  /**
   * Delete a user
   */
  async deleteUser(userId) {
    const response = await axios.delete(`/api/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Reset user password
   */
  async resetUserPassword(userId) {
    const response = await axios.post(`/api/admin/users/${userId}/reset-password`);
    return response.data;
  },

  /**
   * Issue alumni card for a user
   */
  async issueAlumniCard(userId) {
    const response = await axios.post(`/api/admin/users/${userId}/issue-card`);
    return response.data;
  },

  /**
   * Get card status for a user
   */
  async getUserCardStatus(userId) {
    const response = await axios.get(`/api/admin/users/${userId}/card-status`);
    return response.data;
  },

  // ==================== JOBS MANAGEMENT ====================
  
  /**
   * Get all jobs with filters and pagination
   */
  async getAllJobs(params = {}) {
    const { status, search, limit = 100, offset = 0 } = params;
    const queryParams = new URLSearchParams();
    
    if (status) queryParams.append('status', status);
    if (search) queryParams.append('search', search);
    queryParams.append('limit', limit);
    queryParams.append('offset', offset);
    
    const response = await axios.get(`/api/admin/jobs?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get detailed job information
   */
  async getJobDetails(jobId) {
    const response = await axios.get(`/api/admin/jobs/${jobId}`);
    return response.data;
  },

  /**
   * Update job details
   */
  async updateJob(jobId, data) {
    const response = await axios.put(`/api/admin/jobs/${jobId}`, data);
    return response.data;
  },

  /**
   * Delete a job
   */
  async deleteJob(jobId) {
    const response = await axios.delete(`/api/admin/jobs/${jobId}`);
    return response.data;
  },

  /**
   * Get all applications for a job
   */
  async getJobApplications(jobId) {
    const response = await axios.get(`/api/admin/jobs/${jobId}/applications`);
    return response.data;
  },

  // ==================== EVENTS MANAGEMENT ====================
  
  /**
   * Get all events with filters and pagination
   */
  async getAllEvents(params = {}) {
    const { status, search, limit = 100, offset = 0 } = params;
    const queryParams = new URLSearchParams();
    
    if (status) queryParams.append('status', status);
    if (search) queryParams.append('search', search);
    queryParams.append('limit', limit);
    queryParams.append('offset', offset);
    
    const response = await axios.get(`/api/admin/events?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get detailed event information
   */
  async getEventDetails(eventId) {
    const response = await axios.get(`/api/admin/events/${eventId}`);
    return response.data;
  },

  /**
   * Get event attendees
   */
  async getEventAttendees(eventId) {
    const response = await axios.get(`/api/admin/events/${eventId}/attendees`);
    return response.data;
  },

  /**
   * Update event details
   */
  async updateEvent(eventId, data) {
    const response = await axios.put(`/api/admin/events/${eventId}`, data);
    return response.data;
  },

  /**
   * Delete an event
   */
  async deleteEvent(eventId) {
    const response = await axios.delete(`/api/admin/events/${eventId}`);
    return response.data;
  },

  // ==================== ANALYTICS ====================
  
  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const response = await axios.get('/api/admin/analytics/dashboard');
    return response.data?.data || response.data;
  },

  /**
   * Get user growth data
   */
  async getUserGrowth(period = 'monthly') {
    const response = await axios.get(`/api/admin/analytics/user-growth?period=${period}`);
    return response.data;
  },

  /**
   * Get top contributors
   */
  async getTopContributors(limit = 10) {
    const response = await axios.get(`/api/admin/analytics/top-contributors?limit=${limit}`);
    return response.data;
  },

  /**
   * Get platform activity
   */
  async getPlatformActivity(days = 30) {
    const response = await axios.get(`/api/admin/analytics/platform-activity?days=${days}`);
    return response.data;
  },

  /**
   * Get alumni analytics
   */
  async getAlumniAnalytics() {
    const response = await axios.get('/api/admin/analytics/alumni');
    return response.data?.data || response.data;
  },

  /**
   * Get job analytics
   */
  async getJobAnalytics() {
    const response = await axios.get('/api/admin/analytics/jobs');
    return response.data?.data || response.data;
  },

  /**
   * Get mentorship analytics
   */
  async getMentorshipAnalytics() {
    const response = await axios.get('/api/admin/analytics/mentorship');
    return response.data?.data || response.data;
  },

  /**
   * Get event analytics
   */
  async getEventAnalytics() {
    const response = await axios.get('/api/admin/analytics/events');
    return response.data?.data || response.data;
  },

  /**
   * Get engagement metrics
   */
  async getEngagementMetrics() {
    const response = await axios.get('/api/admin/analytics/engagement');
    return response.data?.data || response.data;
  },

  // ==================== MENTORSHIP MANAGEMENT ====================
  
  /**
   * Get all mentorship requests
   */
  async getMentorshipRequests(params = {}) {
    const { limit = 100, offset = 0 } = params;
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit);
    queryParams.append('offset', offset);
    
    const response = await axios.get(`/api/admin/mentorship/requests?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get all mentorship sessions
   */
  async getMentorshipSessions(params = {}) {
    const { limit = 100, offset = 0 } = params;
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit);
    queryParams.append('offset', offset);
    
    const response = await axios.get(`/api/admin/mentorship/sessions?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get all mentors with stats
   */
  async getMentors(params = {}) {
    const { limit = 100, offset = 0 } = params;
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit);
    queryParams.append('offset', offset);
    
    const response = await axios.get(`/api/admin/mentorship/mentors?${queryParams.toString()}`);
    return response.data;
  },

  // ==================== BADGES MANAGEMENT ====================
  
  /**
   * Get all badges
   */
  async getAllBadges(params = {}) {
    const { limit = 100, offset = 0 } = params;
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit);
    queryParams.append('offset', offset);
    
    const response = await axios.get(`/api/admin/badges?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Create a new badge
   */
  async createBadge(data) {
    const response = await axios.post('/api/admin/badges', data);
    return response.data;
  },

  /**
   * Update a badge
   */
  async updateBadge(badgeId, data) {
    const response = await axios.put(`/api/admin/badges/${badgeId}`, data);
    return response.data;
  },

  /**
   * Delete a badge
   */
  async deleteBadge(badgeId) {
    const response = await axios.delete(`/api/admin/badges/${badgeId}`);
    return response.data;
  },

  // ==================== NOTIFICATIONS MANAGEMENT ====================
  
  /**
   * Get all notifications
   */
  async getAllNotifications(params = {}) {
    const { type, limit = 100, offset = 0 } = params;
    const queryParams = new URLSearchParams();
    
    if (type) queryParams.append('type', type);
    queryParams.append('limit', limit);
    queryParams.append('offset', offset);
    
    const response = await axios.get(`/api/admin/notifications?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Create and send a notification
   */
  async createNotification(data) {
    const response = await axios.post('/api/admin/notifications', data);
    return response.data;
  },

  /**
   * Update a notification
   */
  async updateNotification(notificationId, data) {
    const response = await axios.put(`/api/admin/notifications/${notificationId}`, data);
    return response.data;
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId) {
    const response = await axios.delete(`/api/admin/notifications/${notificationId}`);
    return response.data;
  },

  /**
   * Resend a notification
   */
  async resendNotification(notificationId) {
    const response = await axios.post(`/api/admin/notifications/${notificationId}/resend`);
    return response.data;
  },

  // ==================== CONTENT MODERATION ====================
  
  /**
   * Get all flagged content
   */
  async getFlaggedContent(params = {}) {
    const { type, limit = 100, offset = 0 } = params;
    const queryParams = new URLSearchParams();
    
    if (type) queryParams.append('type', type);
    queryParams.append('limit', limit);
    queryParams.append('offset', offset);
    
    const response = await axios.get(`/api/admin/moderation/flagged?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Approve flagged content (remove flag)
   */
  async approveContent(contentId, contentType) {
    const response = await axios.post('/api/admin/moderation/approve', {
      content_id: contentId,
      content_type: contentType,
    });
    return response.data;
  },

  /**
   * Remove flagged content
   */
  async removeContent(contentId, contentType) {
    const response = await axios.post('/api/admin/moderation/remove', {
      content_id: contentId,
      content_type: contentType,
    });
    return response.data;
  },

  /**
   * Warn content author
   */
  async warnAuthor(contentId, contentType, reason) {
    const response = await axios.post('/api/admin/moderation/warn', {
      content_id: contentId,
      content_type: contentType,
      reason,
    });
    return response.data;
  },

  // ==================== FILE UPLOADS MANAGEMENT ====================
  
  /**
   * Get all uploaded files
   */
  async getAllFiles(params = {}) {
    const { file_type, search, limit = 100, offset = 0 } = params;
    const queryParams = new URLSearchParams();
    
    if (file_type) queryParams.append('file_type', file_type);
    if (search) queryParams.append('search', search);
    queryParams.append('limit', limit);
    queryParams.append('offset', offset);
    
    const response = await axios.get(`/api/admin/files?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get file details
   */
  async getFileDetails(fileId) {
    const response = await axios.get(`/api/admin/files/${fileId}`);
    return response.data;
  },

  /**
   * Delete a file
   */
  async deleteFile(fileId) {
    const response = await axios.delete(`/api/admin/files/${fileId}`);
    return response.data;
  },

  /**
   * Get file statistics
   */
  async getFileStats() {
    const response = await axios.get('/api/admin/files/stats');
    return response.data;
  },

  // ==================== AUDIT LOGS ====================
  
  /**
   * Get audit logs with filters and pagination
   */
  async getAuditLogs(params = {}) {
    const { action_type, admin_id, target_type, search, days = 30, limit = 100, offset = 0 } = params;
    const queryParams = new URLSearchParams();
    
    if (action_type) queryParams.append('action_type', action_type);
    if (admin_id) queryParams.append('admin_id', admin_id);
    if (target_type) queryParams.append('target_type', target_type);
    if (search) queryParams.append('search', search);
    if (days) queryParams.append('days', days);
    queryParams.append('limit', limit);
    queryParams.append('offset', offset);
    
    const response = await axios.get(`/api/admin/audit-logs?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get audit log statistics
   */
  async getAuditStats() {
    const response = await axios.get('/api/admin/audit-logs/stats');
    return response.data;
  },
};

export default apiAdminService;
