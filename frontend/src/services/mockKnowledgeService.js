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
  },

  // Get personalized capsules (AI-ranked)
  getPersonalizedCapsules: async (userId) => {
    await delay(400);
    
    if (!userId) {
      return {
        success: false,
        error: 'User ID required'
      };
    }

    // Get user's skills from their profile
    const userProfile = mockData.alumni_profiles.find(p => p.user_id === userId);
    const userSkills = userProfile?.skills || [];

    // Get all capsules
    let capsules = [...mockData.knowledge_capsules];

    // Calculate relevance score for each capsule based on skills match
    const personalizedCapsules = capsules.map(capsule => {
      // Calculate skill overlap
      const capsuleTags = capsule.tags || [];
      const matchingSkills = capsuleTags.filter(tag => 
        userSkills.some(skill => skill.toLowerCase().includes(tag.toLowerCase()) || 
                                 tag.toLowerCase().includes(skill.toLowerCase()))
      );
      
      const skillOverlapPercentage = capsuleTags.length > 0 
        ? Math.round((matchingSkills.length / capsuleTags.length) * 100)
        : 0;

      // Base relevance score on multiple factors
      let relevanceScore = 50; // Base score
      relevanceScore += skillOverlapPercentage * 0.3; // Up to 30 points for skill match
      relevanceScore += Math.min(capsule.views_count / 20, 15); // Up to 15 points for popularity
      relevanceScore += Math.min(capsule.likes_count / 5, 10); // Up to 10 points for likes
      
      // Determine match reasons
      const matchReasons = [];
      if (skillOverlapPercentage > 50) matchReasons.push('Matches your skills');
      if (capsule.views_count > 300) matchReasons.push('Trending in your industry');
      if (capsule.likes_count > 60) matchReasons.push('Popular in your network');
      if (capsule.is_featured) matchReasons.push('Featured content');

      return {
        ...capsule,
        relevance_score: Math.round(relevanceScore),
        match_reasons: matchReasons.length > 0 ? matchReasons : ['Recommended for you'],
        skill_overlap: matchingSkills,
        skill_overlap_percentage: skillOverlapPercentage
      };
    });

    // Sort by relevance score
    personalizedCapsules.sort((a, b) => b.relevance_score - a.relevance_score);

    return {
      success: true,
      data: personalizedCapsules
    };
  },

  // Get AI insights for a specific capsule
  getCapsuleAIInsights: async (capsuleId, userId) => {
    await delay(300);
    
    const capsule = mockData.knowledge_capsules.find(c => c.id === capsuleId);
    if (!capsule) {
      return {
        success: false,
        error: 'Capsule not found'
      };
    }

    // Get user profile for personalization
    const userProfile = mockData.alumni_profiles.find(p => p.user_id === userId);
    const userSkills = userProfile?.skills || [];

    // Find matching skills
    const matchingSkills = capsule.tags.filter(tag => 
      userSkills.some(skill => skill.toLowerCase().includes(tag.toLowerCase()) || 
                               tag.toLowerCase().includes(skill.toLowerCase()))
    );

    // Generate AI insights
    const insights = {
      why_recommended: matchingSkills.length > 0 
        ? `This capsule covers ${matchingSkills.join(', ')}, which align with your current skills and career goals.`
        : 'This capsule is trending in your industry and could help you expand your knowledge.',
      related_skills: capsule.tags,
      relevance_breakdown: {
        skill_match: Math.round((matchingSkills.length / (capsule.tags.length || 1)) * 100),
        popularity: Math.min(Math.round(capsule.views_count / 10), 100),
        engagement: Math.min(Math.round(capsule.likes_count * 2), 100)
      },
      similar_capsules: mockData.knowledge_capsules
        .filter(c => c.id !== capsuleId)
        .filter(c => c.tags.some(tag => capsule.tags.includes(tag)))
        .slice(0, 3)
        .map(c => ({
          id: c.id,
          title: c.title,
          similarity_score: Math.round(
            (c.tags.filter(tag => capsule.tags.includes(tag)).length / capsule.tags.length) * 100
          )
        }))
    };

    return {
      success: true,
      data: insights
    };
  },

  // Get all learning paths
  getLearningPaths: async () => {
    await delay(300);
    
    return {
      success: true,
      data: mockData.learning_paths || []
    };
  },

  // Get single learning path
  getLearningPath: async (pathId) => {
    await delay(200);
    
    const path = (mockData.learning_paths || []).find(p => p.id === pathId);
    
    if (!path) {
      return {
        success: false,
        error: 'Learning path not found'
      };
    }

    // Enrich with capsule details
    const enrichedPath = {
      ...path,
      capsules: path.capsules.map(pc => {
        const capsule = mockData.knowledge_capsules.find(c => c.id === pc.capsule_id);
        return {
          ...pc,
          capsule_details: capsule
        };
      })
    };

    return {
      success: true,
      data: enrichedPath
    };
  },

  // Generate learning path based on career goal
  generateLearningPath: async (targetRole, currentSkills = []) => {
    await delay(500);
    
    // Find existing paths that match the target role
    const matchingPaths = (mockData.learning_paths || []).filter(path => 
      path.target_role.toLowerCase().includes(targetRole.toLowerCase()) ||
      path.career_outcomes.some(outcome => outcome.toLowerCase().includes(targetRole.toLowerCase()))
    );

    if (matchingPaths.length > 0) {
      // Return the best matching path
      return {
        success: true,
        data: matchingPaths[0],
        message: 'Learning path found'
      };
    }

    // If no exact match, create a custom path based on capsule relevance
    const allCapsules = mockData.knowledge_capsules;
    const relevantCapsules = allCapsules
      .filter(capsule => {
        // Include capsules that might be relevant to the target role
        const roleKeywords = targetRole.toLowerCase().split(' ');
        return capsule.tags.some(tag => 
          roleKeywords.some(keyword => tag.toLowerCase().includes(keyword))
        ) || capsule.title.toLowerCase().includes(targetRole.toLowerCase());
      })
      .slice(0, 6);

    const customPath = {
      id: `path-custom-${Date.now()}`,
      title: `${targetRole} Learning Path`,
      description: `Custom learning path to help you become a ${targetRole}`,
      target_role: targetRole,
      difficulty: 'Mixed',
      estimated_duration: `${relevantCapsules.length * 2}-${relevantCapsules.length * 3} weeks`,
      total_capsules: relevantCapsules.length,
      skills_covered: [...new Set(relevantCapsules.flatMap(c => c.tags))],
      capsules: relevantCapsules.map((capsule, index) => ({
        capsule_id: capsule.id,
        order: index + 1,
        estimated_time: `${capsule.duration_minutes} minutes`,
        is_required: index < 3,
        completion_badge: index === 0 ? 'Getting Started' : null,
        capsule_details: capsule
      })),
      prerequisites: ['Basic understanding of the field'],
      career_outcomes: [targetRole],
      created_at: new Date().toISOString(),
      is_custom: true
    };

    return {
      success: true,
      data: customPath,
      message: 'Custom learning path generated'
    };
  },

  // Track learning path progress
  updatePathProgress: async (userId, pathId, capsuleId, completed) => {
    await delay(200);
    
    // In a real app, this would update the database
    // For mock, we'll just return success
    const progressKey = `learning_path_progress_${userId}_${pathId}`;
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
    
    if (!progress.completed_capsules) {
      progress.completed_capsules = [];
    }
    
    if (completed && !progress.completed_capsules.includes(capsuleId)) {
      progress.completed_capsules.push(capsuleId);
    } else if (!completed) {
      progress.completed_capsules = progress.completed_capsules.filter(id => id !== capsuleId);
    }
    
    localStorage.setItem(progressKey, JSON.stringify(progress));
    
    return {
      success: true,
      data: progress,
      message: 'Progress updated'
    };
  },

  // Get learning path progress
  getPathProgress: async (userId, pathId) => {
    await delay(200);
    
    const progressKey = `learning_path_progress_${userId}_${pathId}`;
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{"completed_capsules": []}');
    
    return {
      success: true,
      data: progress
    };
  },

  // ========== ADMIN METHODS ==========

  // Get all capsules (Admin only)
  getCapsules: async (filters = {}) => {
    await delay(300);
    
    const capsules = [...mockData.knowledge_capsules] || [];
    const users = mockData.users || [];
    const profiles = mockData.alumni_profiles || [];
    
    // Enrich with author data
    const enrichedCapsules = capsules.map(capsule => {
      const author = users.find(u => u.id === capsule.author_id);
      const authorProfile = profiles.find(p => p.user_id === capsule.author_id);
      
      return {
        ...capsule,
        author_name: authorProfile?.name || (author ? `${author.first_name} ${author.last_name}` : 'Unknown'),
        author_email: author?.email,
        author_photo: authorProfile?.photo_url,
        views_count: capsule.views_count || 0,
        likes_count: capsule.likes_count || 0,
        bookmarks_count: capsule.bookmarks_count || 0
      };
    });
    
    // Apply filters
    let filtered = enrichedCapsules;
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(c => c.category === filters.category);
    }
    if (filters.is_featured !== undefined) {
      filtered = filtered.filter(c => c.is_featured === filters.is_featured);
    }
    if (filters.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }
    
    return {
      success: true,
      data: filtered,
      total: filtered.length
    };
  },

  // Get capsule by ID
  getCapsuleById: async (capsuleId) => {
    await delay(200);
    
    const capsules = mockData.knowledge_capsules || [];
    const capsule = capsules.find(c => c.id === capsuleId);
    
    if (!capsule) {
      return {
        success: false,
        error: 'Knowledge capsule not found'
      };
    }
    
    // Get author info
    const users = mockData.users || [];
    const profiles = mockData.alumni_profiles || [];
    const author = users.find(u => u.id === capsule.author_id);
    const authorProfile = profiles.find(p => p.user_id === capsule.author_id);
    
    return {
      success: true,
      data: {
        ...capsule,
        author_name: authorProfile?.name || (author ? `${author.first_name} ${author.last_name}` : 'Unknown'),
        author_photo: authorProfile?.photo_url
      }
    };
  },

  // Update capsule (including featured status)
  updateCapsule: async (capsuleId, updateData) => {
    await delay(300);
    
    // Since we're in mock mode, we'll just return success
    // In a real app, this would update localStorage
    return {
      success: true,
      data: {
        id: capsuleId,
        ...updateData,
        updated_at: new Date().toISOString()
      },
      message: 'Capsule updated successfully'
    };
  },

  // Delete capsule
  deleteCapsule: async (capsuleId) => {
    await delay(300);
    
    // Since we're in mock mode, we'll just return success
    // In a real app, this would update localStorage
    return {
      success: true,
      message: 'Capsule deleted successfully'
    };
  }
};
