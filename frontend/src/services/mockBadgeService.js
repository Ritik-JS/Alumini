import mockData from '../mockdata.json';

// Simulate localStorage for badges
const STORAGE_KEY = 'badges_data';
const USER_BADGES_KEY = 'user_badges_data';

const getStoredBadges = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize with mock data
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData.badges));
  return mockData.badges;
};

const getStoredUserBadges = () => {
  const stored = localStorage.getItem(USER_BADGES_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize with mock data
  localStorage.setItem(USER_BADGES_KEY, JSON.stringify(mockData.user_badges || []));
  return mockData.user_badges || [];
};

const saveBadges = (badges) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(badges));
};

const saveUserBadges = (userBadges) => {
  localStorage.setItem(USER_BADGES_KEY, JSON.stringify(userBadges));
};

export const mockBadgeService = {
  // Get all badges with earned counts
  getAllBadges: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const badges = getStoredBadges();
        const userBadges = getStoredUserBadges();
        
        // Add earned count to each badge
        const badgesWithCounts = badges.map(badge => ({
          ...badge,
          earned_count: userBadges.filter(ub => ub.badge_id === badge.id).length
        }));
        
        resolve({
          success: true,
          data: badgesWithCounts,
          total: badgesWithCounts.length
        });
      }, 300);
    });
  },

  // Get badge by ID
  getBadgeById: async (badgeId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const badges = getStoredBadges();
        const badge = badges.find(b => b.id === badgeId);
        
        if (badge) {
          const userBadges = getStoredUserBadges();
          const earnedCount = userBadges.filter(ub => ub.badge_id === badge.id).length;
          
          resolve({
            success: true,
            data: {
              ...badge,
              earned_count: earnedCount
            }
          });
        } else {
          resolve({
            success: false,
            error: 'Badge not found'
          });
        }
      }, 200);
    });
  },

  // Create new badge (admin)
  createBadge: async (badgeData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const badges = getStoredBadges();
        
        const newBadge = {
          id: `badge-${Date.now()}`,
          ...badgeData,
          unlocked_by: 0,
          created_at: new Date().toISOString()
        };
        
        badges.push(newBadge);
        saveBadges(badges);
        
        resolve({
          success: true,
          data: newBadge,
          message: 'Badge created successfully'
        });
      }, 300);
    });
  },

  // Update badge (admin)
  updateBadge: async (badgeId, badgeData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const badges = getStoredBadges();
        const index = badges.findIndex(b => b.id === badgeId);
        
        if (index !== -1) {
          badges[index] = {
            ...badges[index],
            ...badgeData,
            updated_at: new Date().toISOString()
          };
          saveBadges(badges);
          
          resolve({
            success: true,
            data: badges[index],
            message: 'Badge updated successfully'
          });
        } else {
          resolve({
            success: false,
            error: 'Badge not found'
          });
        }
      }, 300);
    });
  },

  // Delete badge (admin)
  deleteBadge: async (badgeId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let badges = getStoredBadges();
        const initialLength = badges.length;
        badges = badges.filter(b => b.id !== badgeId);
        
        if (badges.length < initialLength) {
          saveBadges(badges);
          
          // Also remove user badges for this badge
          let userBadges = getStoredUserBadges();
          userBadges = userBadges.filter(ub => ub.badge_id !== badgeId);
          saveUserBadges(userBadges);
          
          resolve({
            success: true,
            message: 'Badge deleted successfully'
          });
        } else {
          resolve({
            success: false,
            error: 'Badge not found'
          });
        }
      }, 300);
    });
  },

  // Get user badges
  getUserBadges: async (userId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const badges = getStoredBadges();
        const userBadges = getStoredUserBadges();
        
        // Get badges earned by this user
        const userBadgeIds = userBadges
          .filter(ub => ub.user_id === userId)
          .map(ub => ub.badge_id);
        
        const earnedBadges = badges.filter(b => userBadgeIds.includes(b.id));
        
        resolve({
          success: true,
          data: earnedBadges
        });
      }, 200);
    });
  },

  // Award badge to user (admin)
  awardBadge: async (userId, badgeId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const userBadges = getStoredUserBadges();
        
        // Check if already awarded
        const alreadyAwarded = userBadges.some(
          ub => ub.user_id === userId && ub.badge_id === badgeId
        );
        
        if (alreadyAwarded) {
          resolve({
            success: false,
            error: 'Badge already awarded to this user'
          });
          return;
        }
        
        const newUserBadge = {
          id: `user-badge-${Date.now()}`,
          user_id: userId,
          badge_id: badgeId,
          earned_at: new Date().toISOString()
        };
        
        userBadges.push(newUserBadge);
        saveUserBadges(userBadges);
        
        // Update badge unlocked_by count
        const badges = getStoredBadges();
        const badge = badges.find(b => b.id === badgeId);
        if (badge) {
          badge.unlocked_by = (badge.unlocked_by || 0) + 1;
          saveBadges(badges);
        }
        
        resolve({
          success: true,
          data: newUserBadge,
          message: 'Badge awarded successfully'
        });
      }, 300);
    });
  },

  // Get my badges (current user)
  getMyBadges: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) {
          resolve({
            success: false,
            error: 'User not logged in',
            data: []
          });
          return;
        }
        
        const badges = getStoredBadges();
        const userBadges = getStoredUserBadges();
        
        // Get badges earned by current user
        const myBadgeRecords = userBadges.filter(ub => ub.user_id === user.id);
        const myBadgeIds = myBadgeRecords.map(ub => ub.badge_id);
        
        const earnedBadges = badges
          .filter(b => myBadgeIds.includes(b.id))
          .map(badge => {
            const earnedRecord = myBadgeRecords.find(ub => ub.badge_id === badge.id);
            return {
              ...badge,
              earned_at: earnedRecord?.earned_at
            };
          });
        
        resolve({
          success: true,
          data: earnedBadges,
          total: earnedBadges.length
        });
      }, 200);
    });
  },

  // Check and award badges based on criteria
  checkAndAwardBadges: async (userId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // This would normally check user activity and award appropriate badges
        // For mock, just return success
        resolve({
          success: true,
          message: 'Badge check completed',
          new_badges: []
        });
      }, 200);
    });
  }
};

export default mockBadgeService;
