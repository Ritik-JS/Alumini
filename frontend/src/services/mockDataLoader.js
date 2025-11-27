// Mock Data Loader - Loads data from mockdata.json

let mockDataCache = null;

export const loadMockData = async () => {
  // Return cached data if available
  if (mockDataCache) {
    return mockDataCache;
  }

  try {
    // Fetch the mockdata.json from the public folder
    const response = await fetch('/mockdata.json');
    if (!response.ok) {
      throw new Error(`Failed to load mock data: ${response.statusText}`);
    }
    
    mockDataCache = await response.json();
    return mockDataCache;
  } catch (error) {
    console.error('Error loading mock data:', error);
    
    // Return empty structure if loading fails
    return {
      users: [],
      alumni_profiles: [],
      jobs: [],
      job_applications: [],
      mentor_profiles: [],
      mentorship_requests: [],
      mentorship_sessions: [],
      events: [],
      event_rsvps: [],
      forum_posts: [],
      forum_comments: [],
      notifications: [],
      engagement_scores: [],
      badges: [],
      user_badges: [],
      skill_graph: [],
      knowledge_capsules: [],
      leaderboard: [],
      ai_engagement_insights: []
    };
  }
};

// Clear cache if needed (useful for testing)
export const clearMockDataCache = () => {
  mockDataCache = null;
};
