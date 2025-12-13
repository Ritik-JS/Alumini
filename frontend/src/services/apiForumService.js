import axios from './axiosConfig';

// Real Forum Service API
class ApiForumService {
  // Get all posts
  async getPosts(filters = {}) {
    try {
      const response = await axios.get('/api/forum/posts', { params: filters });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get post by ID
  async getPostById(postId) {
    try {
      const response = await axios.get(`/api/forum/posts/${postId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Create post
  async createPost(postData) {
    try {
      const response = await axios.post('/api/forum/posts', postData);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Update post
  async updatePost(postId, postData) {
    try {
      const response = await axios.put(`/api/forum/posts/${postId}`, postData);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Delete post
  async deletePost(postId) {
    try {
      const response = await axios.delete(`/api/forum/posts/${postId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Toggle post like
  async togglePostLike(postId) {
    try {
      const response = await axios.post(`/api/forum/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get comments for a post
  async getComments(postId) {
    try {
      const response = await axios.get(`/api/forum/posts/${postId}/comments`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Add comment
  async addComment(postId, commentData) {
    try {
      const response = await axios.post(
        `/api/forum/posts/${postId}/comments`,
        commentData
      );
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Update comment
  async updateComment(commentId, commentData) {
    try {
      const response = await axios.put(
        `/api/forum/comments/${commentId}`,
        commentData
      );
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Delete comment
  async deleteComment(commentId) {
    try {
      const response = await axios.delete(`/api/forum/comments/${commentId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Toggle comment like
  async toggleCommentLike(commentId) {
    try {
      const response = await axios.post(`/api/forum/comments/${commentId}/like`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get current user's posts
  async getMyPosts() {
    try {
      const response = await axios.get('/api/forum/my-posts');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get all unique tags
  async getAllTags() {
    try {
      const response = await axios.get('/api/forum/tags');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Create comment (alias for consistency with frontend usage)
  async createComment(postId, commentData) {
    try {
      const response = await axios.post(
        `/api/forum/posts/${postId}/comments`,
        commentData
      );
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export default new ApiForumService();
