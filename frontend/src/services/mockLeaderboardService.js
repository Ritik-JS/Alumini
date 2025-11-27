import { loadMockData } from './mockDataLoader';

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to get mock data
const getMockData = async () => {
  return await loadMockData();
};

export const mockLeaderboardService = {
  // Get leaderboard with filters
  getLeaderboard: async (filters = {}) => {
    await delay(300);
    const mockData = await getMockData();
    
    let leaderboard = [...mockData.leaderboard];
    
    // Filter by role
    if (filters.role && filters.role !== 'all') {
      leaderboard = leaderboard.filter(entry => entry.role === filters.role);
    }
    
    // Filter by time period (for demo, return same data)
    // In real app, this would filter based on this_week_points or this_month_points
    
    return {
      success: true,
      data: leaderboard
    };
  },

  // Get user's own score and rank
  getMyScore: async (userId) => {
    await delay(200);
    const mockData = await getMockData();
    
    const userEntry = mockData.leaderboard.find(entry => entry.user_id === userId);
    
    if (!userEntry) {
      // User not in leaderboard yet, return default
      return {
        success: true,
        data: {
          rank: null,
          total_score: 0,
          score_breakdown: {
            profile_completeness: 0,
            mentorship: 0,
            forum_activity: 0,
            job_applications: 0,
            event_participation: 0
          },
          badges: [],
          this_week_points: 0,
          this_month_points: 0
        }
      };
    }
    
    return {
      success: true,
      data: userEntry
    };
  },

  // Get all badges
  getAllBadges: async () => {
    await delay(200);
    const mockData = await getMockData();
    
    return {
      success: true,
      data: mockData.badges
    };
  },

  // Get user's badges
  getUserBadges: async (userId) => {
    await delay(200);
    const mockData = await getMockData();
    
    const userEntry = mockData.leaderboard.find(entry => entry.user_id === userId);
    
    if (!userEntry) {
      return {
        success: true,
        data: []
      };
    }
    
    // Get full badge info for user's badges
    const userBadges = mockData.badges.filter(badge => 
      userEntry.badges.includes(badge.name)
    );
    
    return {
      success: true,
      data: userBadges
    };
  }
};
