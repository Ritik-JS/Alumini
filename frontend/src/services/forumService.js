import axios from 'axios';
import mockData from '../mockdata.json';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

const getCurrentUser = () => {
  const userData = localStorage.getItem('user') || localStorage.getItem('auth_user');
  return userData ? JSON.parse(userData) : null;
};

class ForumService {
  constructor() {
    this.posts = [...mockData.forum_posts];
    this.comments = [...mockData.forum_comments];
    this.postLikes = [];
    this.commentLikes = [];
  }

  async getPosts(filters = {}) {
    if (USE_MOCK_DATA) {
      await delay();
      let filtered = [...this.posts].filter(p => !p.is_deleted);
      
      if (filters.tag) {
        filtered = filtered.filter(post => post.tags.includes(filters.tag));
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(post => 
          post.title?.toLowerCase().includes(searchLower) ||
          post.content.toLowerCase().includes(searchLower)
        );
      }
      
      if (filters.sort === 'popular') {
        filtered.sort((a, b) => b.likes_count - a.likes_count);
      } else {
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
      
      filtered = filtered.map(post => {
        const author = mockData.users.find(u => u.id === post.author_id);
        const authorProfile = mockData.alumni_profiles.find(p => p.user_id === post.author_id);
        return { ...post, author: { ...author, profile: authorProfile } };
      });
      
      return { success: true, data: filtered };
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/forum/posts`, { params: filters });
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }

  async getPostById(postId) {
    if (USE_MOCK_DATA) {
      await delay();
      const post = this.posts.find(p => p.id === postId && !p.is_deleted);
      
      if (!post) {
        return { success: false, message: 'Post not found' };
      }
      
      const author = mockData.users.find(u => u.id === post.author_id);
      const authorProfile = mockData.alumni_profiles.find(p => p.user_id === post.author_id);
      const postComments = await this.getComments(postId);
      
      return {
        success: true,
        data: { ...post, author: { ...author, profile: authorProfile }, comments: postComments.data }
      };
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/forum/posts/${postId}`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async createPost(postData) {
    if (USE_MOCK_DATA) {
      await delay();
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return { success: false, message: 'Not authenticated' };
      }
      
      const newPost = {
        id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: postData.title || null,
        content: postData.content,
        author_id: currentUser.id,
        tags: postData.tags || [],
        likes_count: 0,
        comments_count: 0,
        views_count: 0,
        is_pinned: false,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      this.posts.unshift(newPost);
      return { success: true, data: newPost, message: 'Post created successfully' };
    } else {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/forum/posts`, postData);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async updatePost(postId, postData) {
    if (USE_MOCK_DATA) {
      await delay();
      const index = this.posts.findIndex(p => p.id === postId);
      
      if (index === -1) {
        return { success: false, message: 'Post not found' };
      }
      
      this.posts[index] = { ...this.posts[index], ...postData, updated_at: new Date().toISOString() };
      return { success: true, data: this.posts[index], message: 'Post updated successfully' };
    } else {
      try {
        const response = await axios.put(`${BACKEND_URL}/api/forum/posts/${postId}`, postData);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async deletePost(postId) {
    if (USE_MOCK_DATA) {
      await delay();
      const index = this.posts.findIndex(p => p.id === postId);
      
      if (index === -1) {
        return { success: false, message: 'Post not found' };
      }
      
      this.posts[index].is_deleted = true;
      this.posts[index].updated_at = new Date().toISOString();
      return { success: true, message: 'Post deleted successfully' };
    } else {
      try {
        const response = await axios.delete(`${BACKEND_URL}/api/forum/posts/${postId}`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async likePost(postId) {
    if (USE_MOCK_DATA) {
      await delay();
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return { success: false, message: 'Not authenticated' };
      }
      
      const post = this.posts.find(p => p.id === postId);
      if (!post) {
        return { success: false, message: 'Post not found' };
      }
      
      const likeIndex = this.postLikes.findIndex(
        l => l.post_id === postId && l.user_id === currentUser.id
      );
      
      if (likeIndex > -1) {
        this.postLikes.splice(likeIndex, 1);
        post.likes_count = Math.max(0, post.likes_count - 1);
        return { success: true, data: { liked: false }, message: 'Post unliked' };
      } else {
        this.postLikes.push({ post_id: postId, user_id: currentUser.id, created_at: new Date().toISOString() });
        post.likes_count += 1;
        return { success: true, data: { liked: true }, message: 'Post liked' };
      }
    } else {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/forum/posts/${postId}/like`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async getComments(postId) {
    if (USE_MOCK_DATA) {
      await delay();
      const postComments = this.comments.filter(c => c.post_id === postId && !c.is_deleted);
      
      const commentsWithAuthor = postComments.map(comment => {
        const author = mockData.users.find(u => u.id === comment.author_id);
        const authorProfile = mockData.alumni_profiles.find(p => p.user_id === comment.author_id);
        return { ...comment, author: { ...author, profile: authorProfile }, replies: [] };
      });
      
      const topLevelComments = [];
      const commentMap = {};
      
      commentsWithAuthor.forEach(comment => {
        commentMap[comment.id] = comment;
        if (comment.parent_comment_id === null) {
          topLevelComments.push(comment);
        }
      });
      
      commentsWithAuthor.forEach(comment => {
        if (comment.parent_comment_id !== null) {
          const parent = commentMap[comment.parent_comment_id];
          if (parent) {
            parent.replies.push(comment);
          }
        }
      });
      
      return { success: true, data: topLevelComments };
    } else {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/forum/posts/${postId}/comments`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message, data: [] };
      }
    }
  }

  async addComment(postId, commentData) {
    if (USE_MOCK_DATA) {
      await delay();
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return { success: false, message: 'Not authenticated' };
      }
      
      const post = this.posts.find(p => p.id === postId);
      if (!post) {
        return { success: false, message: 'Post not found' };
      }
      
      const newComment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        post_id: postId,
        author_id: currentUser.id,
        parent_comment_id: commentData.parent_comment_id || null,
        content: commentData.content,
        likes_count: 0,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      this.comments.push(newComment);
      post.comments_count += 1;
      
      return { success: true, data: newComment, message: 'Comment posted successfully' };
    } else {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/forum/posts/${postId}/comments`, commentData);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async updateComment(commentId, commentData) {
    if (USE_MOCK_DATA) {
      await delay();
      const comment = this.comments.find(c => c.id === commentId);
      if (!comment) {
        return { success: false, message: 'Comment not found' };
      }
      
      Object.assign(comment, commentData, { updated_at: new Date().toISOString() });
      return { success: true, data: comment, message: 'Comment updated successfully' };
    } else {
      try {
        const response = await axios.put(`${BACKEND_URL}/api/forum/comments/${commentId}`, commentData);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async deleteComment(commentId) {
    if (USE_MOCK_DATA) {
      await delay();
      const comment = this.comments.find(c => c.id === commentId);
      
      if (!comment) {
        return { success: false, message: 'Comment not found' };
      }
      
      comment.is_deleted = true;
      comment.updated_at = new Date().toISOString();
      
      const post = this.posts.find(p => p.id === comment.post_id);
      if (post) {
        post.comments_count = Math.max(0, post.comments_count - 1);
      }
      
      return { success: true, message: 'Comment deleted successfully' };
    } else {
      try {
        const response = await axios.delete(`${BACKEND_URL}/api/forum/comments/${commentId}`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }

  async likeComment(commentId) {
    if (USE_MOCK_DATA) {
      await delay();
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return { success: false, message: 'Not authenticated' };
      }
      
      const comment = this.comments.find(c => c.id === commentId);
      if (!comment) {
        return { success: false, message: 'Comment not found' };
      }
      
      const likeIndex = this.commentLikes.findIndex(
        l => l.comment_id === commentId && l.user_id === currentUser.id
      );
      
      if (likeIndex > -1) {
        this.commentLikes.splice(likeIndex, 1);
        comment.likes_count = Math.max(0, comment.likes_count - 1);
        return { success: true, data: { liked: false }, message: 'Comment unliked' };
      } else {
        this.commentLikes.push({ comment_id: commentId, user_id: currentUser.id, created_at: new Date().toISOString() });
        comment.likes_count += 1;
        return { success: true, data: { liked: true }, message: 'Comment liked' };
      }
    } else {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/forum/comments/${commentId}/like`);
        return response.data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }
}

export default new ForumService();
