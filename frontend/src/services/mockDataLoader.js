// Mock Data Loader - Loads data from mockdata.json

let mockDataCache = null;

export const loadMockData = async () => {
  // Return cached data if available
  if (mockDataCache) {
    console.log('Returning cached mock data');
    return mockDataCache;
  }

  try {
    // Fetch the mockdata.json from the public folder
    console.log('Fetching mock data from /mockdata.json');
    const response = await fetch('/mockdata.json');
    if (!response.ok) {
      throw new Error(`Failed to load mock data: ${response.statusText}`);
    }
    
    mockDataCache = await response.json();
    console.log('Mock data loaded successfully:', {
      leaderboard: mockDataCache.leaderboard?.length || 0,
      geographic_data: mockDataCache.geographic_data?.length || 0,
      talent_clusters: mockDataCache.talent_clusters?.length || 0,
      badges: mockDataCache.badges?.length || 0
    });
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
      geographic_data: [],
      talent_clusters: [],
      ai_engagement_insights: [],
      alumni_cards: [],
      card_verifications: [],
      career_paths: [],
      career_predictions: [],
      datasetUploads: [],
      system_config: []
    };
  }
};

// Clear cache if needed (useful for testing)
export const clearMockDataCache = () => {
  mockDataCache = null;
};
