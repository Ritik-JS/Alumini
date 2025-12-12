/**
 * Mock Admin Service
 * Provides mock data for admin operations when backend is not available
 */

import mockData from '@/mockdata.json';

const mockAdminService = {
  // ==================== CONTENT MODERATION ====================
  
  /**
   * Get all flagged content
   */
  async getFlaggedContent(params = {}) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const flaggedContent = {
      posts: [
        {
          id: 1,
          type: 'forum_post',
          title: 'Inappropriate job posting',
          content: 'This is a sample flagged forum post that needs review...',
          author: 'john.doe@alumni.edu',
          author_id: '550e8400-e29b-41d4-a716-446655440001',
          reportedBy: 'jane.smith@alumni.edu',
          reported_by_id: '660e8400-e29b-41d4-a716-446655440002',
          reason: 'Spam',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 2,
          type: 'forum_post',
          title: 'Offensive language in discussion',
          content: 'Sample content with reported offensive language...',
          author: 'user@example.com',
          author_id: '770e8400-e29b-41d4-a716-446655440003',
          reportedBy: 'moderator@alumni.edu',
          reported_by_id: '880e8400-e29b-41d4-a716-446655440004',
          reason: 'Inappropriate content',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
      jobs: [
        {
          id: 3,
          type: 'job_posting',
          title: 'Suspicious job offer',
          content: 'Work from home, earn $10000/month...',
          author: 'recruiter@company.com',
          author_id: '990e8400-e29b-41d4-a716-446655440005',
          reportedBy: 'student@alumni.edu',
          reported_by_id: 'aa0e8400-e29b-41d4-a716-446655440006',
          reason: 'Suspicious/Scam',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
        },
      ],
      comments: [],
    };

    const { type } = params;
    
    if (type && type !== 'all') {
      return {
        success: true,
        data: flaggedContent[type] || [],
        message: 'Flagged content retrieved successfully',
      };
    }

    return {
      success: true,
      data: flaggedContent,
      message: 'All flagged content retrieved successfully',
    };
  },

  /**
   * Approve flagged content (remove flag)
   */
  async approveContent(contentId, contentType) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true,
      message: 'Content approved and flag removed',
      data: { content_id: contentId, content_type: contentType },
    };
  },

  /**
   * Remove flagged content
   */
  async removeContent(contentId, contentType) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true,
      message: 'Content removed successfully',
      data: { content_id: contentId, content_type: contentType },
    };
  },

  /**
   * Warn content author
   */
  async warnAuthor(contentId, contentType, reason) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true,
      message: 'Warning sent to user',
      data: { content_id: contentId, content_type: contentType, reason },
    };
  },

  // ==================== FILE UPLOADS MANAGEMENT ====================
  
  /**
   * Get all uploaded files
   */
  async getAllFiles(params = {}) {
    await new Promise(resolve => setTimeout(resolve, 300));

    const mockFiles = [
      {
        id: '1',
        user_id: '660e8400-e29b-41d4-a716-446655440001',
        user_email: 'sarah.johnson@alumni.edu',
        user_name: 'Sarah Johnson',
        file_name: 'sarah-johnson-cv.pdf',
        file_url: 'https://storage.example.com/cvs/sarah-johnson-cv.pdf',
        file_type: 'cv',
        file_size_kb: 256,
        mime_type: 'application/pdf',
        uploaded_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: '2',
        user_id: '770e8400-e29b-41d4-a716-446655440002',
        user_email: 'michael.chen@alumni.edu',
        user_name: 'Michael Chen',
        file_name: 'profile-photo.jpg',
        file_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
        file_type: 'photo',
        file_size_kb: 128,
        mime_type: 'image/jpeg',
        uploaded_at: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: '3',
        user_id: 'aa0e8400-e29b-41d4-a716-446655440005',
        user_email: 'priya.patel@alumni.edu',
        user_name: 'Priya Patel',
        file_name: 'design-portfolio.pdf',
        file_url: 'https://storage.example.com/cvs/priya-patel-portfolio.pdf',
        file_type: 'cv',
        file_size_kb: 1024,
        mime_type: 'application/pdf',
        uploaded_at: new Date(Date.now() - 259200000).toISOString(),
      },
      {
        id: '4',
        user_id: 'event-banner-1',
        user_email: 'admin@alumni.edu',
        user_name: 'System Admin',
        file_name: 'career-fair-banner.png',
        file_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
        file_type: 'banner',
        file_size_kb: 512,
        mime_type: 'image/png',
        uploaded_at: new Date(Date.now() - 345600000).toISOString(),
      },
      {
        id: '5',
        user_id: 'cc0e8400-e29b-41d4-a716-446655440007',
        user_email: 'lisa.anderson@alumni.edu',
        user_name: 'Lisa Anderson',
        file_name: 'lisa-anderson-cv.pdf',
        file_url: 'https://storage.example.com/cvs/lisa-anderson-cv.pdf',
        file_type: 'cv',
        file_size_kb: 384,
        mime_type: 'application/pdf',
        uploaded_at: new Date(Date.now() - 432000000).toISOString(),
      },
      {
        id: '6',
        user_id: 'capsule-img-1',
        user_email: 'sarah.johnson@alumni.edu',
        user_name: 'Sarah Johnson',
        file_name: 'fullstack-tutorial.png',
        file_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
        file_type: 'document',
        file_size_kb: 256,
        mime_type: 'image/png',
        uploaded_at: new Date(Date.now() - 518400000).toISOString(),
      },
    ];

    let filtered = mockFiles;
    const { file_type, search } = params;

    if (file_type && file_type !== 'all') {
      filtered = filtered.filter(f => f.file_type === file_type);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        f =>
          f.file_name.toLowerCase().includes(searchLower) ||
          f.user_email.toLowerCase().includes(searchLower) ||
          (f.user_name && f.user_name.toLowerCase().includes(searchLower))
      );
    }

    return {
      success: true,
      data: filtered,
      total: filtered.length,
      message: 'Files retrieved successfully',
    };
  },

  /**
   * Get file details
   */
  async getFileDetails(fileId) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true,
      data: {
        id: fileId,
        file_name: 'example-file.pdf',
        file_type: 'cv',
        file_size_kb: 256,
      },
      message: 'File details retrieved',
    };
  },

  /**
   * Delete a file
   */
  async deleteFile(fileId) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true,
      message: 'File deleted successfully',
      data: { file_id: fileId },
    };
  },

  /**
   * Get file statistics
   */
  async getFileStats() {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const mockFiles = await this.getAllFiles({});
    const files = mockFiles.data || [];
    
    return {
      success: true,
      data: {
        total_files: files.length,
        total_size_kb: files.reduce((sum, f) => sum + f.file_size_kb, 0),
        by_type: {
          cv: files.filter(f => f.file_type === 'cv').length,
          photo: files.filter(f => f.file_type === 'photo').length,
          banner: files.filter(f => f.file_type === 'banner').length,
          document: files.filter(f => f.file_type === 'document').length,
        },
      },
      message: 'File statistics retrieved',
    };
  },

  // ==================== EXISTING METHODS (FOR COMPATIBILITY) ====================
  
  async getAllUsers(params = {}) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const users = mockData.users || [];
    return {
      success: true,
      data: users,
      total: users.length,
      message: 'Users retrieved successfully',
    };
  },

  async getAllJobs(params = {}) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const jobs = mockData.jobs || [];
    return {
      success: true,
      data: jobs,
      total: jobs.length,
      message: 'Jobs retrieved successfully',
    };
  },

  async getAllEvents(params = {}) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const events = mockData.events || [];
    return {
      success: true,
      data: events,
      total: events.length,
      message: 'Events retrieved successfully',
    };
  },
};

export default mockAdminService;
