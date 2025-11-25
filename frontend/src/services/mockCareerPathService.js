import mockData from '../mockdata.json';

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockCareerPathService = {
  // Get all career paths
  getCareerPaths: async (filters = {}) => {
    await delay(300);
    
    let paths = [...mockData.career_paths];
    
    // Filter by starting role
    if (filters.startingRole) {
      paths = paths.filter(path => 
        path.starting_role.toLowerCase().includes(filters.startingRole.toLowerCase())
      );
    }
    
    // Filter by target role
    if (filters.targetRole) {
      paths = paths.filter(path => 
        path.target_role.toLowerCase().includes(filters.targetRole.toLowerCase())
      );
    }
    
    return {
      success: true,
      data: paths
    };
  },

  // Get specific career path
  getCareerPath: async (pathId) => {
    await delay(200);
    
    const path = mockData.career_paths.find(p => p.id === pathId);
    
    if (!path) {
      return {
        success: false,
        error: 'Career path not found'
      };
    }
    
    return {
      success: true,
      data: path
    };
  },

  // Get all unique roles
  getRoles: async () => {
    await delay(100);
    
    const roles = new Set();
    mockData.career_paths.forEach(path => {
      roles.add(path.starting_role);
      roles.add(path.target_role);
    });
    
    return {
      success: true,
      data: Array.from(roles).sort()
    };
  },

  // Get alumni profile for success story
  getAlumniProfile: async (alumniId) => {
    await delay(200);
    
    const profile = mockData.alumni_profiles.find(p => p.user_id === alumniId);
    
    return {
      success: true,
      data: profile
    };
  }
};
