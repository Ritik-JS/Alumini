import mockData from '../mockdata.json';

// Simulate API delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Get current user from localStorage
const getCurrentUser = () => {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};

// Mock Forum Service
class MockForumService {
  constructor() {
    // Initialize with mock data
    this.posts = [...mockData.forum_posts];
    this.comments = [...mockData.forum_comments];
    this.postLikes = []; // Track likes
    this.commentLikes = []; // Track comment likes
  }

  // Get all posts with optional filters
  async getPosts(filters = {}) {
    await delay();
    
    let filtered = [...this.posts].filter(p => !p.is_deleted);
    
    // Filter by tag
    if (filters.tag) {
      filtered = filtered.filter(post => post.tags.includes(filters.tag));
    }
    
    // Search by title or content
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(post => 
        post.title?.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort
    if (filters.sort === 'popular') {
      filtered.sort((a, b) => b.likes_count - a.likes_count);
    } else {
      // Default: recent first
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    // Add author info
    filtered = filtered.map(post => {
      const author = mockData.users.find(u => u.id === post.author_id);
      const authorProfile = mockData.alumni_profiles.find(p => p.user_id === post.author_id);
      
      return {
        ...post,
        author: {
          ...author,
          profile: authorProfile
        }
      };
    });
    
    return {
      success: true,
      data: filtered
    };
  }

  // Get single post by ID
  async getPostById(postId) {
    await delay();
    
    const post = this.posts.find(p => p.id === postId && !p.is_deleted);
    
    if (!post) {
      return {
        success: false,
        message: 'Post not found'
      };
    }
    
    // Get author info
    const author = mockData.users.find(u => u.id === post.author_id);
    const authorProfile = mockData.alumni_profiles.find(p => p.user_id === post.author_id);
    
    // Get comments for this post
    const postComments = await this.getPostComments(postId);
    
    return {
      success: true,
      data: {
        ...post,
        author: {
          ...author,
          profile: authorProfile
        },
        comments: postComments.data
      }
    };
  }

  // Create new post
  async createPost(postData) {
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
    
    return {
      success: true,
      data: newPost,
      message: 'Post created successfully'
    };
  }

  // Update post
  async updatePost(postId, postData) {
    await delay();
    
    const index = this.posts.findIndex(p => p.id === postId);
    
    if (index === -1) {
      return { success: false, message: 'Post not found' };
    }
    
    this.posts[index] = {
      ...this.posts[index],
      ...postData,
      updated_at: new Date().toISOString()
    };
    
    return {
      success: true,
      data: this.posts[index],
      message: 'Post updated successfully'
    };
  }

  // Delete post (soft delete)
  async deletePost(postId) {
    await delay();
    
    const index = this.posts.findIndex(p => p.id === postId);
    
    if (index === -1) {
      return { success: false, message: 'Post not found' };
    }
    
    this.posts[index].is_deleted = true;
    this.posts[index].updated_at = new Date().toISOString();
    
    return {
      success: true,
      message: 'Post deleted successfully'
    };
  }

  // Like/Unlike post
  async togglePostLike(postId) {
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
      // Unlike
      this.postLikes.splice(likeIndex, 1);
      post.likes_count = Math.max(0, post.likes_count - 1);
      
      return {
        success: true,
        data: { liked: false },
        message: 'Post unliked'
      };
    } else {
      // Like
      this.postLikes.push({
        post_id: postId,
        user_id: currentUser.id,
        created_at: new Date().toISOString()
      });
      post.likes_count += 1;
      
      return {
        success: true,
        data: { liked: true },
        message: 'Post liked'
      };
    }
  }

  // Check if user liked a post
  async checkPostLike(postId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return { success: true, data: { liked: false } };
    
    const liked = this.postLikes.some(
      l => l.post_id === postId && l.user_id === currentUser.id
    );
    
    return { success: true, data: { liked } };
  }

  // Get comments for a post
  async getPostComments(postId) {
    await delay();
    
    const postComments = this.comments.filter(
      c => c.post_id === postId && !c.is_deleted
    );
    
    // Build nested comment structure
    const commentsWithAuthor = postComments.map(comment => {
      const author = mockData.users.find(u => u.id === comment.author_id);
      const authorProfile = mockData.alumni_profiles.find(p => p.user_id === comment.author_id);
      
      return {
        ...comment,
        author: {
          ...author,
          profile: authorProfile
        },
        replies: []
      };
    });
    
    // Organize replies
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
    
    return {
      success: true,
      data: topLevelComments
    };
  }

  // Create comment
  async createComment(postId, commentData) {
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
    
    return {
      success: true,
      data: newComment,
      message: 'Comment posted successfully'
    };
  }

  // Delete comment
  async deleteComment(commentId) {
    await delay();
    
    const comment = this.comments.find(c => c.id === commentId);
    
    if (!comment) {
      return { success: false, message: 'Comment not found' };
    }
    
    comment.is_deleted = true;
    comment.updated_at = new Date().toISOString();
    
    // Update post comment count
    const post = this.posts.find(p => p.id === comment.post_id);
    if (post) {
      post.comments_count = Math.max(0, post.comments_count - 1);
    }
    
    return {
      success: true,
      message: 'Comment deleted successfully'
    };
  }

  // Like/Unlike comment
  async toggleCommentLike(commentId) {
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
      // Unlike
      this.commentLikes.splice(likeIndex, 1);
      comment.likes_count = Math.max(0, comment.likes_count - 1);
      
      return {
        success: true,
        data: { liked: false },
        message: 'Comment unliked'
      };
    } else {
      // Like
      this.commentLikes.push({
        comment_id: commentId,
        user_id: currentUser.id,
        created_at: new Date().toISOString()
      });
      comment.likes_count += 1;
      
      return {
        success: true,
        data: { liked: true },
        message: 'Comment liked'
      };
    }
  }

  // Get all unique tags
  async getAllTags() {
    await delay();
    
    const allTags = new Set();
    this.posts.forEach(post => {
      if (post.tags) {
        post.tags.forEach(tag => allTags.add(tag));
      }
    });
    
    return {
      success: true,
      data: Array.from(allTags).sort()
    };
  }

  // Get posts by current user
  async getMyPosts() {
    await delay();
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' };
    }
    
    let myPosts = this.posts.filter(p => p.author_id === currentUser.id && !p.is_deleted);
    
    // Sort by most recent first
    myPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Add author info
    myPosts = myPosts.map(post => {
      const author = mockData.users.find(u => u.id === post.author_id);
      const authorProfile = mockData.alumni_profiles.find(p => p.user_id === post.author_id);
      
      return {
        ...post,
        author: {
          ...author,
          profile: authorProfile
        }
      };
    });
    
    return {
      success: true,
      data: myPosts
    };
  }
}

export default new MockForumService();
