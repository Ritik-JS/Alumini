import mockData from '../mockdata.json';

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockHeatmapService = {
  // Get geographic data for heatmap
  getGeographicData: async (filters = {}) => {
    await delay(300);
    
    let geoData = [...mockData.geographic_data];
    
    // Filter by skill
    if (filters.skill) {
      geoData = geoData.filter(geo => 
        geo.top_skills.includes(filters.skill)
      );
    }
    
    // Filter by industry
    if (filters.industry) {
      geoData = geoData.filter(geo => 
        geo.top_industries.includes(filters.industry)
      );
    }
    
    return {
      success: true,
      data: geoData
    };
  },

  // Get location details
  getLocationDetails: async (locationId) => {
    await delay(200);
    
    const location = mockData.geographic_data.find(geo => geo.id === locationId);
    
    if (!location) {
      return {
        success: false,
        error: 'Location not found'
      };
    }
    
    return {
      success: true,
      data: location
    };
  },

  // Get all unique skills
  getSkills: async () => {
    await delay(100);
    
    const skills = new Set();
    mockData.geographic_data.forEach(geo => {
      geo.top_skills.forEach(skill => skills.add(skill));
    });
    
    return {
      success: true,
      data: Array.from(skills).sort()
    };
  },

  // Get all unique industries
  getIndustries: async () => {
    await delay(100);
    
    const industries = new Set();
    mockData.geographic_data.forEach(geo => {
      geo.top_industries.forEach(industry => industries.add(industry));
    });
    
    return {
      success: true,
      data: Array.from(industries).sort()
    };
  }
};
