import axios from './axiosConfig';

// Real Directory Service API
class ApiDirectoryService {
  // Get all alumni with filters
  async getAlumni(filters = {}) {
    try {
      const response = await axios.get('/api/directory/alumni', { params: filters });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get all alumni profiles
  async getAllAlumniProfiles() {
    try {
      const response = await axios.get('/api/profiles/directory');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching alumni profiles:', error);
      return [];
    }
  }

  // Search alumni
  async searchAlumni(query) {
    try {
      const response = await axios.get('/api/directory/search', {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get alumni by batch year
  async getAlumniByBatch(batchYear) {
    try {
      const response = await axios.get(`/api/directory/batch/${batchYear}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get alumni by company
  async getAlumniByCompany(company) {
    try {
      const response = await axios.get(`/api/directory/company/${company}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  }

  // Get filter options
  async getFilterOptions() {
    try {
      const response = await axios.get('/api/directory/filters');
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Search profiles with filters (Backend API)
  async searchProfiles(params) {
    try {
      const response = await axios.get('/api/profiles/search', {
        params: {
          name: params.name || undefined,
          company: params.company || undefined,
          skills: params.skills || undefined,
          batch_year: params.batch_year || undefined,
          job_role: params.job_role || undefined,
          location: params.location || undefined,
          verified_only: params.verified_only || false,
          page: params.page || 1,
          limit: params.limit || 20
        }
      });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      return { 
        success: false, 
        message: error.message || 'Network error',
        data: null 
      };
    }
  }

  // Filter alumni based on multiple criteria
  filterAlumni(filters) {
    try {
      const profiles = this.getAllAlumniProfiles();
      
      // Handle promise if getAllAlumniProfiles returns a promise
      if (profiles instanceof Promise) {
        return profiles.then(profilesData => {
          return this._filterProfilesSync(profilesData, filters);
        });
      }
      
      return this._filterProfilesSync(profiles, filters);
    } catch (error) {
      console.error('Error filtering alumni:', error);
      return [];
    }
  }

  // Synchronous filter helper
  _filterProfilesSync(profiles, filters) {
    let filtered = Array.isArray(profiles) ? profiles : [];

      // Search query
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase();
        filtered = filtered.filter(profile => {
          const nameMatch = profile.name?.toLowerCase().includes(searchTerm);
          const companyMatch = profile.current_company?.toLowerCase().includes(searchTerm);
          const roleMatch = profile.current_role?.toLowerCase().includes(searchTerm);
          const locationMatch = profile.location?.toLowerCase().includes(searchTerm);
          const skillsMatch = profile.skills?.some(skill => 
            skill.toLowerCase().includes(searchTerm)
          );
          return nameMatch || companyMatch || roleMatch || locationMatch || skillsMatch;
        });
      }

      // Company filter
      if (filters.companies && filters.companies.length > 0) {
        filtered = filtered.filter(p => 
          filters.companies.includes(p.current_company)
        );
      }

      // Skills filter
      if (filters.skills && filters.skills.length > 0) {
        filtered = filtered.filter(p => 
          filters.skills.some(skill => p.skills?.includes(skill))
        );
      }

      // Location filter
      if (filters.locations && filters.locations.length > 0) {
        filtered = filtered.filter(p => 
          filters.locations.includes(p.location)
        );
      }

      // Batch year filter
      if (filters.batchYears && filters.batchYears.length > 0) {
        filtered = filtered.filter(p => 
          filters.batchYears.includes(p.batch_year)
        );
      }

      // Year range filter
      if (filters.yearRange) {
        const [min, max] = filters.yearRange;
        filtered = filtered.filter(p => 
          p.batch_year >= min && p.batch_year <= max
        );
      }

      // Role filter
      if (filters.roles && filters.roles.length > 0) {
        filtered = filtered.filter(p => 
          filters.roles.includes(p.current_role)
        );
      }

      // Verified only filter
      if (filters.verifiedOnly === true) {
        filtered = filtered.filter(p => p.is_verified === true);
      }

      return filtered;
  }

  // Sort alumni
  sortAlumni(profiles, sortBy) {
    if (!Array.isArray(profiles)) {
      console.error('sortAlumni: profiles is not an array', profiles);
      return [];
    }
    const sorted = [...profiles];

    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));

      case 'recent':
        return sorted.sort((a, b) => 
          new Date(b.updated_at) - new Date(a.updated_at)
        );

      case 'experience':
        return sorted.sort((a, b) => {
          const aExp = a.experience_timeline?.length || 0;
          const bExp = b.experience_timeline?.length || 0;
          return bExp - aExp;
        });

      case 'batch':
        return sorted.sort((a, b) => b.batch_year - a.batch_year);

      default:
        return sorted;
    }
  }

  // Paginate results
  paginateResults(profiles, page = 1, pageSize = 12) {
    if (!Array.isArray(profiles)) {
      console.error('paginateResults: profiles is not an array', profiles);
      return {
        data: [],
        totalPages: 0,
        totalResults: 0,
        currentPage: page,
        hasMore: false
      };
    }
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      data: profiles.slice(startIndex, endIndex),
      totalPages: Math.ceil(profiles.length / pageSize),
      totalResults: profiles.length,
      currentPage: page,
      hasMore: endIndex < profiles.length
    };
  }

  // Get unique companies
  async getUniqueCompanies() {
    try {
      const profiles = await this.getAllAlumniProfiles();
      const companies = profiles
        .map(p => p.current_company)
        .filter(Boolean);
      return [...new Set(companies)].sort();
    } catch (error) {
      console.error('Error getting unique companies:', error);
      return [];
    }
  }

  // Get unique skills
  async getUniqueSkills() {
    try {
      const profiles = await this.getAllAlumniProfiles();
      const allSkills = profiles.flatMap(p => p.skills || []);
      return [...new Set(allSkills)].sort();
    } catch (error) {
      console.error('Error getting unique skills:', error);
      return [];
    }
  }

  // Get unique locations
  async getUniqueLocations() {
    try {
      const profiles = await this.getAllAlumniProfiles();
      const locations = profiles
        .map(p => p.location)
        .filter(Boolean);
      return [...new Set(locations)].sort();
    } catch (error) {
      console.error('Error getting unique locations:', error);
      return [];
    }
  }

  // Get unique roles
  async getUniqueRoles() {
    try {
      const profiles = await this.getAllAlumniProfiles();
      const roles = profiles
        .map(p => p.current_role)
        .filter(Boolean);
      return [...new Set(roles)].sort();
    } catch (error) {
      console.error('Error getting unique roles:', error);
      return [];
    }
  }

  // Get batch year range
  async getBatchYearRange() {
    try {
      const profiles = await this.getAllAlumniProfiles();
      const years = profiles
        .map(p => p.batch_year)
        .filter(Boolean);

      if (years.length === 0) return [2015, 2024];

      return [Math.min(...years), Math.max(...years)];
    } catch (error) {
      console.error('Error getting batch year range:', error);
      return [2015, 2024];
    }
  }

  // Get profile by ID
  async getProfileById(profileId) {
    try {
      const response = await axios.get(`/api/profiles/${profileId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting profile by ID:', error);
      return null;
    }
  }

  // Get profile by user ID
  async getProfileByUserId(userId) {
    try {
      const response = await axios.get(`/api/profiles/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting profile by user ID:', error);
      return null;
    }
  }

  // Get search suggestions
  async getSearchSuggestions(query) {
    if (!query || query.trim() === '') return [];

    try {
      const profiles = await this.getAllAlumniProfiles();
      const searchTerm = query.toLowerCase();
      const suggestions = new Set();

      profiles.forEach(profile => {
        // Name suggestions
        if (profile.name?.toLowerCase().includes(searchTerm)) {
          suggestions.add(profile.name);
        }

        // Company suggestions
        if (profile.current_company?.toLowerCase().includes(searchTerm)) {
          suggestions.add(profile.current_company);
        }

        // Role suggestions
        if (profile.current_role?.toLowerCase().includes(searchTerm)) {
          suggestions.add(profile.current_role);
        }

        // Skill suggestions
        profile.skills?.forEach(skill => {
          if (skill.toLowerCase().includes(searchTerm)) {
            suggestions.add(skill);
          }
        });
      });

      return Array.from(suggestions).slice(0, 8);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  // Search history methods (stored in localStorage)
  saveSearchHistory(query) {
    if (!query || query.trim() === '') return;

    try {
      const history = JSON.parse(localStorage.getItem('search_history') || '[]');
      const newHistory = [query, ...history.filter(q => q !== query)].slice(0, 10);
      localStorage.setItem('search_history', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  getSearchHistory() {
    try {
      return JSON.parse(localStorage.getItem('search_history') || '[]');
    } catch (error) {
      console.error('Error getting search history:', error);
      return [];
    }
  }

  clearSearchHistory() {
    try {
      localStorage.setItem('search_history', '[]');
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }
}

export default new ApiDirectoryService();
