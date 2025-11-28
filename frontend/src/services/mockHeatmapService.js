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
    
    console.log('mockHeatmapService.getGeographicData - mockData:', mockData);
    console.log('mockHeatmapService.getGeographicData - geographic_data:', mockData?.geographic_data?.length || 0);
    
    if (!mockData || !mockData.geographic_data || !Array.isArray(mockData.geographic_data)) {
      console.error('Geographic data is missing or invalid');
      return {
        success: false,
        data: [],
        error: 'Geographic data is not available'
      };
    }
    
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
    
    console.log('mockHeatmapService.getGeographicData - returning:', geoData.length, 'locations');
    
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
    const mockData = await getMockData();
    
    const skills = new Set();
    if (mockData.geographic_data) {
      mockData.geographic_data.forEach(geo => {
        if (geo.top_skills) {
          geo.top_skills.forEach(skill => skills.add(skill));
        }
      });
    }
    
    return {
      success: true,
      data: Array.from(skills).sort()
    };
  },

  // Get all unique industries
  getIndustries: async () => {
    await delay(100);
    const mockData = await getMockData();
    
    const industries = new Set();
    if (mockData.geographic_data) {
      mockData.geographic_data.forEach(geo => {
        if (geo.top_industries) {
          geo.top_industries.forEach(industry => industries.add(industry));
        }
      });
    }
    
    return {
      success: true,
      data: Array.from(industries).sort()
    };
  },

  // Get talent clusters
  getTalentClusters: async (filters = {}) => {
    await delay(300);
    const mockData = await getMockData();
    
    console.log('mockHeatmapService.getTalentClusters - talent_clusters:', mockData?.talent_clusters?.length || 0);
    
    let clusters = mockData.talent_clusters ? [...mockData.talent_clusters] : [];
    
    // Filter by skill
    if (filters.skill && clusters.length > 0) {
      clusters = clusters.filter(cluster => 
        cluster.top_skills && cluster.top_skills.includes(filters.skill)
      );
    }
    
    // Filter by industry
    if (filters.industry && clusters.length > 0) {
      clusters = clusters.filter(cluster => 
        cluster.dominant_industries && cluster.dominant_industries.some(ind => ind.name === filters.industry)
      );
    }
    
    // Filter by experience level (simulated - in real app would filter alumni by experience)
    if (filters.experienceLevel && filters.experienceLevel !== 'all') {
      // For mock, we'll just return all clusters but in real implementation
      // this would filter based on alumni experience levels in the cluster
    }
    
    console.log('mockHeatmapService.getTalentClusters - returning:', clusters.length, 'clusters');
    
    return {
      success: true,
      data: clusters
    };
  },

  // Get cluster details
  getClusterDetails: async (clusterId) => {
    await delay(200);
    const mockData = await getMockData();
    
    const clusters = mockData.talent_clusters || [];
    const cluster = clusters.find(c => c.id === clusterId);
    
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
    const mockData = await getMockData();
    
    const clusters = mockData.talent_clusters || [];
    
    // Sort clusters by growth rate
    const emergingHubs = [...clusters]
      .sort((a, b) => (b.growth_rate || 0) - (a.growth_rate || 0))
      .slice(0, 5)
      .map(cluster => ({
        ...cluster,
        growth_label: (cluster.growth_rate || 0) > 30 ? 'Rapid' : 
                     (cluster.growth_rate || 0) > 20 ? 'High' : 
                     (cluster.growth_rate || 0) > 10 ? 'Moderate' : 'Slow'
      }));
    
    return {
      success: true,
      data: emergingHubs
    };
  },

  // Export cluster data
  exportClusterData: async (clusterId) => {
    await delay(500);
    const mockData = await getMockData();
    
    const clusters = mockData.talent_clusters || [];
    const cluster = clusters.find(c => c.id === clusterId);
    
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
