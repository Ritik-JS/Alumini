/**
 * Real API Skill Recommendation Service
 * Connects to backend API endpoints for AI-powered skill recommendations
 */

import axios from './axiosConfig';

// Calculate job match score for a user (client-side helper)
const calculateJobMatchScore = (userSkills = [], jobSkills = []) => {
  if (!userSkills || userSkills.length === 0 || !jobSkills || jobSkills.length === 0) {
    return 0;
  }

  const userSkillsLower = userSkills.map((s) => s.toLowerCase());
  const jobSkillsLower = jobSkills.map((s) => s.toLowerCase());

  const matchingSkills = jobSkillsLower.filter((skill) => userSkillsLower.includes(skill));

  const matchPercentage = (matchingSkills.length / jobSkillsLower.length) * 100;
  const perfectMatchBonus = matchingSkills.length === jobSkillsLower.length ? 10 : 0;
  const extraSkillsBonus = Math.min((userSkills.length - matchingSkills.length) * 2, 10);

  return Math.min(Math.round(matchPercentage + perfectMatchBonus + extraSkillsBonus), 100);
};

// Get skill overlap between user and job (client-side helper)
const getSkillOverlap = (userSkills = [], jobSkills = []) => {
  if (!userSkills || !jobSkills) {
    return {
      matching: [],
      missing: jobSkills || [],
    };
  }

  const userSkillsLower = userSkills.map((s) => s.toLowerCase());
  const jobSkillsLower = jobSkills.map((s) => s.toLowerCase());

  const matching = jobSkills.filter((skill) => userSkillsLower.includes(skill.toLowerCase()));

  const missing = jobSkills.filter((skill) => !userSkillsLower.includes(skill.toLowerCase()));

  return {
    matching,
    missing,
    matchPercentage:
      jobSkills.length > 0 ? Math.round((matching.length / jobSkills.length) * 100) : 0,
  };
};

export const apiSkillRecommendationService = {
  // Get skill recommendations for a user
  async getRecommendations(userId) {
    try {
      const response = await axios.get(`/api/skill-recommendations/recommendations/${userId}`);
      return {
        success: true,
        data: response.data.data || response.data || [],
      };
    } catch (error) {
      console.error('Error fetching skill recommendations:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
        data: [],
      };
    }
  },

  // Get skill trends
  async getSkillTrends(filters = {}) {
    try {
      const response = await axios.get('/api/recommendations/skill-trends', {
        params: filters,
      });
      return {
        success: true,
        data: response.data.data || response.data || [],
      };
    } catch (error) {
      console.error('Error fetching skill trends:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
        data: [],
      };
    }
  },

  // Get top trending skills
  async getTopTrendingSkills(limit = 5) {
    try {
      const response = await axios.get('/api/skill-recommendations/trending', {
        params: { limit },
      });
      return {
        success: true,
        data: response.data.data || response.data || [],
      };
    } catch (error) {
      console.error('Error fetching top trending skills:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
        data: [],
      };
    }
  },

  // Calculate job match score (client-side)
  calculateJobMatch(userSkills, jobSkills) {
    const matchScore = calculateJobMatchScore(userSkills, jobSkills);
    const skillOverlap = getSkillOverlap(userSkills, jobSkills);

    return {
      matchScore,
      ...skillOverlap,
    };
  },

  // Get skill recommendations based on career goal
  async getRecommendationsByCareerGoal(userId, targetRole) {
    try {
      const response = await axios.get(
        `/api/recommendations/skills/${userId}/career-goal`,
        {
          params: { target_role: targetRole },
        }
      );
      return {
        success: true,
        data: response.data.data || response.data || [],
      };
    } catch (error) {
      console.error('Error fetching career goal recommendations:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
        data: [],
      };
    }
  },

  // Get trending skills in user's field
  async getTrendingInField(industry) {
    try {
      const response = await axios.get('/api/recommendations/skill-trends/by-industry', {
        params: { industry },
      });
      return {
        success: true,
        data: response.data.data || response.data || [],
      };
    } catch (error) {
      console.error('Error fetching field trends:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
        data: [],
      };
    }
  },
};

// Export individual functions for easier imports
export const getSkillRecommendations = apiSkillRecommendationService.getRecommendations;
export const getSkillTrends = apiSkillRecommendationService.getSkillTrends;
export const getTopTrendingSkills = apiSkillRecommendationService.getTopTrendingSkills;
export const calculateJobMatch = apiSkillRecommendationService.calculateJobMatch;
export const getTrendingInField = apiSkillRecommendationService.getTrendingInField;

export default apiSkillRecommendationService;
