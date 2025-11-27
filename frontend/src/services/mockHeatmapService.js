import { loadMockData } from './mockDataLoader';

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to get mock data
const getMockData = async () => {
  return await loadMockData();
};

export const mockHeatmapService = {
  // Get geographic data for heatmap
  getGeographicData: async (filters = {}) => {
    await delay(300);
    const mockData = await getMockData();
    
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
    const mockData = await getMockData();
    
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
  },

  // Get talent clusters
  getTalentClusters: async (filters = {}) => {
    await delay(300);
    
    let clusters = [...mockData.talent_clusters];
    
    // Filter by skill
    if (filters.skill) {
      clusters = clusters.filter(cluster => 
        cluster.top_skills.includes(filters.skill)
      );
    }
    
    // Filter by industry
    if (filters.industry) {
      clusters = clusters.filter(cluster => 
        cluster.dominant_industries.some(ind => ind.name === filters.industry)
      );
    }
    
    // Filter by experience level (simulated - in real app would filter alumni by experience)
    if (filters.experienceLevel && filters.experienceLevel !== 'all') {
      // For mock, we'll just return all clusters but in real implementation
      // this would filter based on alumni experience levels in the cluster
    }
    
    return {
      success: true,
      data: clusters
    };
  },

  // Get cluster details
  getClusterDetails: async (clusterId) => {
    await delay(200);
    
    const cluster = mockData.talent_clusters.find(c => c.id === clusterId);
    
    if (!cluster) {
      return {
        success: false,
        error: 'Cluster not found'
      };
    }
    
    return {
      success: true,
      data: cluster
    };
  },

  // Get emerging hubs (fastest growing locations)
  getEmergingHubs: async () => {
    await delay(300);
    
    // Sort clusters by growth rate
    const emergingHubs = [...mockData.talent_clusters]
      .sort((a, b) => b.growth_rate - a.growth_rate)
      .slice(0, 5)
      .map(cluster => ({
        ...cluster,
        growth_label: cluster.growth_rate > 30 ? 'Rapid' : 
                     cluster.growth_rate > 20 ? 'High' : 
                     cluster.growth_rate > 10 ? 'Moderate' : 'Slow'
      }));
    
    return {
      success: true,
      data: emergingHubs
    };
  },

  // Export cluster data
  exportClusterData: async (clusterId) => {
    await delay(500);
    
    const cluster = mockData.talent_clusters.find(c => c.id === clusterId);
    
    if (!cluster) {
      return {
        success: false,
        error: 'Cluster not found'
      };
    }
    
    // In real implementation, this would generate a CSV/Excel file
    // For mock, we'll return the data as JSON
    return {
      success: true,
      data: cluster,
      format: 'json'
    };
  }
};
