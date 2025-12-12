/**
 * Service Switcher - Toggles between Mock Data and Real Backend API
 * 
 * This file automatically exports either mock services or real API services
 * based on the REACT_APP_USE_MOCK_DATA environment variable.
 * 
 * Usage:
 * import { authService, jobService, eventService } from '@/services';
 * 
 * To switch between mock and real backend:
 * 1. Update .env file: REACT_APP_USE_MOCK_DATA=true (mock) or false (backend)
 * 2. Restart the development server
 */

// Check environment variable to determine which service to use
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

console.log(`🔄 Service Mode: ${USE_MOCK_DATA ? 'MOCK DATA' : 'BACKEND API'}`);

// Import mock services
import { mockAuthService as mockAuth } from './mockAuth';
import mockJobService from './mockJobService';
import mockEventService from './mockEventService';
import mockMentorshipService from './mockMentorshipService';
import mockForumService from './mockForumService';
import mockProfileService from './mockProfileService';
import mockDirectoryService from './mockDirectoryService';
import { notificationService as mockNotificationService } from './mockNotificationService';
import { mockLeaderboardService } from './mockLeaderboardService';
import { mockAlumniCardService } from './mockAlumniCardService';
import { mockCareerPathService } from './mockCareerPathService';
import { mockHeatmapService } from './mockHeatmapService';
import { mockSkillGraphService } from './mockSkillGraphService';
import { mockKnowledgeService } from './mockKnowledgeService';
import mockDatasetService from './mockDatasetService';
import mockAIMonitorService from './mockAIMonitorService';
import { mockCareerPredictionService } from './mockCareerPredictionService';
import { mockEngagementAIService } from './mockEngagementAIService';
import mockSkillRecommendationService from './mockSkillRecommendationService';
import mockBadgeService from './mockBadgeService';
import mockAnalyticsService from './mockAnalyticsService';
import mockAdminService from './mockAdminService';

// Import real API services
import { apiAuth } from './apiAuth';
import apiJobService from './apiJobService';
import apiEventService from './apiEventService';
import apiMentorshipService from './apiMentorshipService';
import apiForumService from './apiForumService';
import apiProfileService from './apiProfileService';
import apiDirectoryService from './apiDirectoryService';
import apiNotificationService from './apiNotificationService';
import apiLeaderboardService from './apiLeaderboardService';
import apiAlumniCardService from './apiAlumniCardService';
import apiCareerPathService from './apiCareerPathService';
import apiHeatmapService from './apiHeatmapService';
import apiSkillGraphService from './apiSkillGraphService';
import apiKnowledgeService from './apiKnowledgeService';
import apiDatasetService from './apiDatasetService';
import apiAIMonitorService from './apiAIMonitorService';
import apiCareerPredictionService from './apiCareerPredictionService';
import apiEngagementAIService from './apiEngagementAIService';
import apiSkillRecommendationService from './apiSkillRecommendationService';
import apiBadgeService from './apiBadgeService';
import apiAnalyticsService from './apiAnalyticsService';
import apiAdminService from './apiAdminService';

// Export the appropriate service based on environment variable
export const authService = USE_MOCK_DATA ? mockAuth : apiAuth;
export const jobService = USE_MOCK_DATA ? mockJobService : apiJobService;
export const eventService = USE_MOCK_DATA ? mockEventService : apiEventService;
export const mentorshipService = USE_MOCK_DATA ? mockMentorshipService : apiMentorshipService;
export const forumService = USE_MOCK_DATA ? mockForumService : apiForumService;
export const profileService = USE_MOCK_DATA ? mockProfileService : apiProfileService;
export const directoryService = USE_MOCK_DATA ? mockDirectoryService : apiDirectoryService;
export const notificationService = USE_MOCK_DATA ? mockNotificationService : apiNotificationService;
export const leaderboardService = USE_MOCK_DATA ? mockLeaderboardService : apiLeaderboardService;
export const alumniCardService = USE_MOCK_DATA ? mockAlumniCardService : apiAlumniCardService;
export const careerPathService = USE_MOCK_DATA ? mockCareerPathService : apiCareerPathService;
export const heatmapService = USE_MOCK_DATA ? mockHeatmapService : apiHeatmapService;
export const skillGraphService = USE_MOCK_DATA ? mockSkillGraphService : apiSkillGraphService;
export const knowledgeService = USE_MOCK_DATA ? mockKnowledgeService : apiKnowledgeService;
export const datasetService = USE_MOCK_DATA ? mockDatasetService : apiDatasetService;
export const aiMonitorService = USE_MOCK_DATA ? mockAIMonitorService : apiAIMonitorService;
export const careerPredictionService = USE_MOCK_DATA ? mockCareerPredictionService : apiCareerPredictionService;
export const engagementAIService = USE_MOCK_DATA ? mockEngagementAIService : apiEngagementAIService;
export const skillRecommendationService = USE_MOCK_DATA ? mockSkillRecommendationService : apiSkillRecommendationService;
export const badgeService = USE_MOCK_DATA ? mockBadgeService : apiBadgeService;
export const analyticsService = USE_MOCK_DATA ? mockAnalyticsService : apiAnalyticsService;
export const adminService = USE_MOCK_DATA ? mockAdminService : apiAdminService;

// Export service mode for debugging
export const isUsingMockData = USE_MOCK_DATA;

// Default export with all services
export default {
  authService,
  jobService,
  eventService,
  mentorshipService,
  forumService,
  profileService,
  directoryService,
  notificationService,
  leaderboardService,
  alumniCardService,
  careerPathService,
  heatmapService,
  skillGraphService,
  knowledgeService,
  datasetService,
  aiMonitorService,
  careerPredictionService,
  engagementAIService,
  skillRecommendationService,
  badgeService,
  analyticsService,
  adminService,
  isUsingMockData,
};
