// Mock Skill Recommendation Service
// This provides AI-powered skill recommendations and trends

import mockData from '../mockdata.json';

const SKILL_RECOMMENDATIONS_KEY = 'skill_recommendations';
const SKILL_TRENDS_KEY = 'skill_trends';

// Helper to get data from localStorage or fallback to mock data
const getStoredData = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return fallback;
  }
};

// Get all skill recommendations
const getAllRecommendationsData = () => {
  return getStoredData(SKILL_RECOMMENDATIONS_KEY, mockData.skill_recommendations || []);
};

// Get all skill trends
const getAllTrendsData = () => {
  return getStoredData(SKILL_TRENDS_KEY, mockData.skill_trends || []);
};

// Calculate job match score for a user
const calculateJobMatchScore = (userSkills = [], jobSkills = []) => {
  if (!userSkills || userSkills.length === 0 || !jobSkills || jobSkills.length === 0) {
    return 0;
  }

  // Normalize to lowercase for comparison
  const userSkillsLower = userSkills.map(s => s.toLowerCase());
  const jobSkillsLower = jobSkills.map(s => s.toLowerCase());

  // Count matching skills
  const matchingSkills = jobSkillsLower.filter(skill => 
    userSkillsLower.includes(skill)
  );

  // Calculate base score (percentage of job skills matched)
  const matchPercentage = (matchingSkills.length / jobSkillsLower.length) * 100;

  // Bonus for having all required skills
  const perfectMatchBonus = matchingSkills.length === jobSkillsLower.length ? 10 : 0;

  // Bonus for having extra skills
  const extraSkillsBonus = Math.min((userSkills.length - matchingSkills.length) * 2, 10);

  return Math.min(Math.round(matchPercentage + perfectMatchBonus + extraSkillsBonus), 100);
};

// Get skill overlap between user and job
const getSkillOverlap = (userSkills = [], jobSkills = []) => {
  if (!userSkills || !jobSkills) {
    return {
      matching: [],
      missing: jobSkills || []
    };
  }

  const userSkillsLower = userSkills.map(s => s.toLowerCase());
  const jobSkillsLower = jobSkills.map(s => s.toLowerCase());

  const matching = jobSkills.filter(skill => 
    userSkillsLower.includes(skill.toLowerCase())
  );
  
  const missing = jobSkills.filter(skill => 
    !userSkillsLower.includes(skill.toLowerCase())
  );

  return {
    matching,
    missing,
    matchPercentage: jobSkills.length > 0 
      ? Math.round((matching.length / jobSkills.length) * 100) 
      : 0
  };
};

export const skillRecommendationService = {
  // Get skill recommendations for a user
  async getRecommendations(userId) {
    try {
      const recommendations = getAllRecommendationsData();
      const userRec = recommendations.find(rec => rec.user_id === userId);
      
      if (userRec) {
        return {
          success: true,
          data: userRec.recommended_skills || []
        };
      }

      // If no specific recommendations, return empty array
      return {
        success: true,
        data: []
      };
    } catch (error) {
      console.error('Error fetching skill recommendations:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Get skill trends
  async getSkillTrends(filters = {}) {
    try {
      let trends = getAllTrendsData();

      // Filter by category if provided
      if (filters.category) {
        trends = trends.filter(t => t.category === filters.category);
      }

      // Filter by industry if provided
      if (filters.industry) {
        trends = trends.filter(t => 
          t.industries.some(ind => ind.toLowerCase().includes(filters.industry.toLowerCase()))
        );
      }

      // Sort by growth rate (highest first) by default
      trends.sort((a, b) => b.growth_rate - a.growth_rate);

      // Limit results if requested
      if (filters.limit) {
        trends = trends.slice(0, filters.limit);
      }

      return {
        success: true,
        data: trends
      };
    } catch (error) {
      console.error('Error fetching skill trends:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Get top trending skills (limit 5 by default)
  async getTopTrendingSkills(limit = 5) {
    try {
      const trends = getAllTrendsData();
      const topTrending = trends
        .sort((a, b) => b.growth_rate - a.growth_rate)
        .slice(0, limit);

      return {
        success: true,
        data: topTrending
      };
    } catch (error) {
      console.error('Error fetching top trending skills:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Calculate job match score
  calculateJobMatch(userSkills, jobSkills) {
    const matchScore = calculateJobMatchScore(userSkills, jobSkills);
    const skillOverlap = getSkillOverlap(userSkills, jobSkills);
    
    return {
      matchScore,
      ...skillOverlap
    };
  },

  // Get skill recommendations based on career goal
  async getRecommendationsByCareerGoal(userId, targetRole) {
    try {
      const recommendations = await this.getRecommendations(userId);
      
      if (!recommendations.success) {
        return recommendations;
      }

      // Filter recommendations relevant to target role
      // This is simplified - in real app, would use ML model
      return {
        success: true,
        data: recommendations.data.slice(0, 5)
      };
    } catch (error) {
      console.error('Error fetching career goal recommendations:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Get trending skills in user's field
  async getTrendingInField(industry) {
    try {
      const trends = getAllTrendsData();
      const fieldTrends = trends.filter(t => 
        t.industries.some(ind => ind.toLowerCase() === industry.toLowerCase())
      );

      return {
        success: true,
        data: fieldTrends.slice(0, 5)
      };
    } catch (error) {
      console.error('Error fetching field trends:', error);
      return { success: false, error: error.message, data: [] };
    }
  }
};

// Export individual functions for easier imports
export const getSkillRecommendations = skillRecommendationService.getRecommendations;
export const getSkillTrends = skillRecommendationService.getSkillTrends;
export const getTopTrendingSkills = skillRecommendationService.getTopTrendingSkills;
export const calculateJobMatch = skillRecommendationService.calculateJobMatch;
export const getTrendingInField = skillRecommendationService.getTrendingInField;

export default skillRecommendationService;
