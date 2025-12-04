import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Real Forum Service API
class ApiForumService {
  // Get all posts
  async getPosts(filters = {}) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/forum/posts`, { params: filters });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get post by ID
  async getPostById(postId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/forum/posts/${postId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Create post
  async createPost(postData) {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/forum/posts`, postData);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Update post
  async updatePost(postId, postData) {
    try {
      const response = await axios.put(`${BACKEND_URL}/api/forum/posts/${postId}`, postData);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Delete post
  async deletePost(postId) {
    try {
      const response = await axios.delete(`${BACKEND_URL}/api/forum/posts/${postId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Like post
  async likePost(postId) {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/forum/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get comments for a post
  async getComments(postId) {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/forum/posts/${postId}/comments`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Add comment
  async addComment(postId, commentData) {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/forum/posts/${postId}/comments`,
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
        `${BACKEND_URL}/api/forum/comments/${commentId}`,
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
      const response = await axios.delete(`${BACKEND_URL}/api/forum/comments/${commentId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Like comment
  async likeComment(commentId) {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/forum/comments/${commentId}/like`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export default new ApiForumService();
