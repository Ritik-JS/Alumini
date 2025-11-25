import mockData from '../mockdata.json';

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockKnowledgeService = {
  // Get all knowledge capsules
  getKnowledgeCapsules: async (filters = {}) => {
    await delay(300);
    
    let capsules = [...mockData.knowledge_capsules];
    
    // Filter by category
    if (filters.category && filters.category !== 'all') {
      capsules = capsules.filter(c => c.category === filters.category);
    }
    
    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      capsules = capsules.filter(c => 
        filters.tags.some(tag => c.tags.includes(tag))
      );
    }
    
    // Search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      capsules = capsules.filter(c => 
        c.title.toLowerCase().includes(searchLower) ||
        c.content.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort
    if (filters.sort === 'popular') {
      capsules.sort((a, b) => b.likes_count - a.likes_count);
    } else if (filters.sort === 'trending') {
      capsules.sort((a, b) => b.views_count - a.views_count);
    } else {
      // Default: recent
      capsules.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    return {
      success: true,
      data: capsules,
      total: capsules.length
    };
  },

  // Get single capsule by ID
  getCapsule: async (capsuleId) => {
    await delay(200);
    
    const capsule = mockData.knowledge_capsules.find(c => c.id === capsuleId);
    
    if (!capsule) {
      return {
        success: false,
        error: 'Knowledge capsule not found'
      };
    }
    
    // Get author info
    const author = mockData.alumni_profiles.find(p => p.user_id === capsule.author_id);
    
    return {
      success: true,
      data: {
        ...capsule,
        author
      }
    };
  },

  // Create new capsule
  createCapsule: async (capsuleData) => {
    await delay(500);
    
    const newCapsule = {
      id: `capsule-${Date.now()}`,
      ...capsuleData,
      likes_count: 0,
      views_count: 0,
      bookmarks_count: 0,
      is_featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return {
      success: true,
      data: newCapsule,
      message: 'Knowledge capsule created successfully'
    };
  },

  // Like capsule
  likeCapsule: async (capsuleId) => {
    await delay(200);
    
    return {
      success: true,
      message: 'Capsule liked'
    };
  },

  // Unlike capsule
  unlikeCapsule: async (capsuleId) => {
    await delay(200);
    
    return {
      success: true,
      message: 'Capsule unliked'
    };
  },

  // Bookmark capsule
  bookmarkCapsule: async (capsuleId) => {
    await delay(200);
    
    return {
      success: true,
      message: 'Capsule bookmarked'
    };
  },

  // Get all categories
  getCategories: async () => {
    await delay(100);
    
    return {
      success: true,
      data: ['technical', 'career', 'leadership', 'design', 'business']
    };
  },

  // Get all tags
  getTags: async () => {
    await delay(100);
    
    const tags = new Set();
    mockData.knowledge_capsules.forEach(capsule => {
      capsule.tags.forEach(tag => tags.add(tag));
    });
    
    return {
      success: true,
      data: Array.from(tags).sort()
    };
  }
};
