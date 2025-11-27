import mockData from '../mockdata.json';

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockCareerPredictionService = {
  // Get career prediction for a user
  getUserPrediction: async (userId) => {
    await delay(300);
    
    const prediction = mockData.career_predictions.find(p => p.user_id === userId);
    
    if (!prediction) {
      return {
        success: false,
        error: 'No predictions available for this user'
      };
    }
    
    return {
      success: true,
      data: prediction
    };
  },

  // Get all career predictions (admin)
  getAllPredictions: async () => {
    await delay(400);
    
    return {
      success: true,
      data: mockData.career_predictions
    };
  },

  // Get prediction by role
  getPredictionsByRole: async (role) => {
    await delay(300);
    
    const predictions = mockData.career_predictions.filter(p => p.user_role === role);
    
    return {
      success: true,
      data: predictions
    };
  },

  // Get specific predicted role details
  getPredictedRoleDetails: async (userId, roleName) => {
    await delay(200);
    
    const prediction = mockData.career_predictions.find(p => p.user_id === userId);
    
    if (!prediction) {
      return {
        success: false,
        error: 'Prediction not found'
      };
    }
    
    const role = prediction.predicted_roles.find(r => r.role_name === roleName);
    
    if (!role) {
      return {
        success: false,
        error: 'Role not found in predictions'
      };
    }
    
    return {
      success: true,
      data: role
    };
  },

  // Get alumni who made similar transitions
  getSimilarAlumni: async (roleName) => {
    await delay(300);
    
    // Find alumni profiles who have the target role
    const alumni = mockData.alumni_profiles.filter(profile => 
      profile.current_role && profile.current_role.toLowerCase().includes(roleName.toLowerCase())
    );
    
    return {
      success: true,
      data: alumni.slice(0, 5) // Return top 5
    };
  },

  // Get recommended learning resources
  getLearningResources: async (skills) => {
    await delay(200);
    
    // Mock learning resources
    const resources = {
      success: true,
      data: skills.map(skill => ({
        skill: skill,
        resources: [
          { name: `${skill} Documentation`, type: 'docs', url: '#' },
          { name: `${skill} Course`, type: 'course', url: '#' },
          { name: `${skill} Tutorial`, type: 'tutorial', url: '#' }
        ]
      }))
    };
    
    return resources;
  }
};
