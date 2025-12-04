/**
 * Service Index - Unified Services for Mock Data and Real Backend API
 * 
 * All services now internally handle switching between mock data and real API
 * based on the REACT_APP_USE_MOCK_DATA environment variable.
 * 
 * Usage:
 * import { authService, jobService, eventService } from '@/services';
 * 
 * To switch between mock and real backend:
 * 1. Update .env file: REACT_APP_USE_MOCK_DATA=true (mock) or false (backend)
 * 2. Restart the development server
 */

// Check environment variable to determine which service mode to use
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

console.log(`🔄 Service Mode: ${USE_MOCK_DATA ? 'MOCK DATA' : 'BACKEND API'}`);

// Import unified services
import authService from './authService';
import jobService from './jobService';
import eventService from './eventService';
import mentorshipService from './mentorshipService';
import forumService from './forumService';
import profileService from './profileService';
import directoryService from './directoryService';
import notificationService from './notificationService';
import leaderboardService from './leaderboardService';
import alumniCardService from './alumniCardService';
import careerPathService from './careerPathService';
import heatmapService from './heatmapService';
import skillGraphService from './skillGraphService';
import knowledgeService from './knowledgeService';

// Export all services
export {
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
};

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
  isUsingMockData,
};
