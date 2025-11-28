import { loadMockData } from './mockDataLoader';

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to get mock data
const getMockData = async () => {
  return await loadMockData();
};

export const mockEngagementAIService = {
  // Get AI engagement insights for a user
  getEngagementInsights: async (userId) => {
    await delay(400);
    const mockData = await getMockData();
    
    const insights = mockData.ai_engagement_insights?.find(
      insight => insight.user_id === userId
    );
    
    if (!insights) {
      // Return default insights for users not in mock data
      return {
        success: true,
        data: {
          user_id: userId,
          current_score: 0,
          current_rank: null,
          engagement_prediction: {
            predicted_trend: "stable",
            confidence: 0.75,
            predicted_score_7days: 0,
            predicted_score_30days: 0,
            risk_factors: ["Low activity"],
            opportunities: ["Start participating in forums", "Attend events"]
          },
          activity_patterns: {
            best_posting_times: [],
            most_effective_contributions: [],
            peak_activity_periods: []
          },
          comparison_with_similar_users: {
            percentile: 50,
            avg_score_similar_users: 0,
            your_advantage: "None yet",
            improvement_areas: ["Get started with engagement"]
          },
          smart_suggestions: [
            {
              id: "sug-default-1",
              action: "Complete your profile",
              impact: "high",
              estimated_points: 20,
              time_investment: "30 minutes",
              priority: 1,
              reason: "A complete profile is the foundation for engagement."
            }
          ],
          contribution_impact_history: [],
          last_updated: new Date().toISOString()
        }
      };
    }
    
    return {
      success: true,
      data: insights
    };
  },

  // Get engagement prediction
  getEngagementPrediction: async (userId) => {
    await delay(300);
    const mockData = await getMockData();
    
    const insights = mockData.ai_engagement_insights?.find(
      insight => insight.user_id === userId
    );
    
    if (!insights) {
      return {
        success: true,
        data: {
          predicted_trend: "stable",
          confidence: 0.75,
          predicted_score_7days: 0,
          predicted_score_30days: 0
        }
      };
    }
    
    return {
      success: true,
      data: insights.engagement_prediction
    };
  },

  // Get activity patterns analysis
  getActivityPatterns: async (userId) => {
    await delay(300);
    const mockData = await getMockData();
    
    const insights = mockData.ai_engagement_insights?.find(
      insight => insight.user_id === userId
    );
    
    if (!insights) {
      return {
        success: true,
        data: {
          best_posting_times: [],
          most_effective_contributions: [],
          peak_activity_periods: []
        }
      };
    }
    
    return {
      success: true,
      data: insights.activity_patterns
    };
  },

  // Get smart suggestions
  getSmartSuggestions: async (userId) => {
    await delay(250);
    const mockData = await getMockData();
    
    const insights = mockData.ai_engagement_insights?.find(
      insight => insight.user_id === userId
    );
    
    if (!insights) {
      return {
        success: true,
        data: []
      };
    }
    
    return {
      success: true,
      data: insights.smart_suggestions
    };
  },

  // Get contribution impact history
  getContributionImpact: async (userId, days = 30) => {
    await delay(300);
    const mockData = await getMockData();
    
    const insights = mockData.ai_engagement_insights?.find(
      insight => insight.user_id === userId
    );
    
    if (!insights) {
      return {
        success: true,
        data: []
      };
    }
    
    // Filter by days if needed
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const filteredHistory = insights.contribution_impact_history.filter(
      item => new Date(item.date) >= cutoffDate
    );
    
    return {
      success: true,
      data: filteredHistory
    };
  },

  // Get comparison with similar users
  getUserComparison: async (userId) => {
    await delay(250);
    const mockData = await getMockData();
    
    const insights = mockData.ai_engagement_insights?.find(
      insight => insight.user_id === userId
    );
    
    if (!insights) {
      return {
        success: true,
        data: {
          percentile: 50,
          avg_score_similar_users: 0,
          your_advantage: "None yet",
          improvement_areas: []
        }
      };
    }
    
    return {
      success: true,
      data: insights.comparison_with_similar_users
    };
  }
};
