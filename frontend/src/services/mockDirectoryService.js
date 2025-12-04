import mockData from '../mockdata.json';

// Storage keys
const PROFILES_KEY = 'alumni_profiles';
const SEARCH_HISTORY_KEY = 'search_history';

// Helper to get data from localStorage or fallback to mock data
const getStoredData = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return fallback;
  }
};

// Helper to save data to localStorage
const saveData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Get all alumni profiles with user data
export const getAllAlumniProfiles = () => {
  const profiles = getStoredData(PROFILES_KEY, mockData.alumni_profiles);
  const users = mockData.users;
  
  return profiles.map(profile => ({
    ...profile,
    user: users.find(u => u.id === profile.user_id)
  }));
};

// Search alumni by name, company, or skills
export const searchAlumni = (query) => {
  if (!query || query.trim() === '') {
    return getAllAlumniProfiles();
  }
  
  const profiles = getAllAlumniProfiles();
  const searchTerm = query.toLowerCase();
  
  return profiles.filter(profile => {
    const nameMatch = profile.name?.toLowerCase().includes(searchTerm);
    const companyMatch = profile.current_company?.toLowerCase().includes(searchTerm);
    const roleMatch = profile.current_role?.toLowerCase().includes(searchTerm);
    const locationMatch = profile.location?.toLowerCase().includes(searchTerm);
    const skillsMatch = profile.skills?.some(skill => 
      skill.toLowerCase().includes(searchTerm)
    );
    
    return nameMatch || companyMatch || roleMatch || locationMatch || skillsMatch;
  });
};

// Filter alumni based on multiple criteria
export const filterAlumni = (filters) => {
  let profiles = getAllAlumniProfiles();
  
  // Search query
  if (filters.search && filters.search.trim()) {
    profiles = searchAlumni(filters.search);
  }
  
  // Company filter
  if (filters.companies && filters.companies.length > 0) {
    profiles = profiles.filter(p => 
      filters.companies.includes(p.current_company)
    );
  }
  
  // Skills filter
  if (filters.skills && filters.skills.length > 0) {
    profiles = profiles.filter(p => 
      filters.skills.some(skill => p.skills?.includes(skill))
    );
  }
  
  // Location filter
  if (filters.locations && filters.locations.length > 0) {
    profiles = profiles.filter(p => 
      filters.locations.includes(p.location)
    );
  }
  
  // Batch year filter
  if (filters.batchYears && filters.batchYears.length > 0) {
    profiles = profiles.filter(p => 
      filters.batchYears.includes(p.batch_year)
    );
  }
  
  // Year range filter
  if (filters.yearRange) {
    const [min, max] = filters.yearRange;
    profiles = profiles.filter(p => 
      p.batch_year >= min && p.batch_year <= max
    );
  }
  
  // Role filter
  if (filters.roles && filters.roles.length > 0) {
    profiles = profiles.filter(p => 
      filters.roles.includes(p.current_role)
    );
  }
  
  // Verified only filter
  if (filters.verifiedOnly === true) {
    profiles = profiles.filter(p => p.is_verified === true);
  }
  
  return profiles;
};

// Sort alumni
export const sortAlumni = (profiles, sortBy) => {
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
};

// Paginate results
export const paginateResults = (profiles, page = 1, pageSize = 12) => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  return {
    data: profiles.slice(startIndex, endIndex),
    totalPages: Math.ceil(profiles.length / pageSize),
    totalResults: profiles.length,
    currentPage: page,
    hasMore: endIndex < profiles.length
  };
};

// Get unique companies
export const getUniqueCompanies = () => {
  const profiles = getAllAlumniProfiles();
  const companies = profiles
    .map(p => p.current_company)
    .filter(Boolean);
  return [...new Set(companies)].sort();
};

// Get unique skills
export const getUniqueSkills = () => {
  const profiles = getAllAlumniProfiles();
  const allSkills = profiles.flatMap(p => p.skills || []);
  return [...new Set(allSkills)].sort();
};

// Get unique locations
export const getUniqueLocations = () => {
  const profiles = getAllAlumniProfiles();
  const locations = profiles
    .map(p => p.location)
    .filter(Boolean);
  return [...new Set(locations)].sort();
};

// Get unique roles
export const getUniqueRoles = () => {
  const profiles = getAllAlumniProfiles();
  const roles = profiles
    .map(p => p.current_role)
    .filter(Boolean);
  return [...new Set(roles)].sort();
};

// Get batch year range
export const getBatchYearRange = () => {
  const profiles = getAllAlumniProfiles();
  const years = profiles
    .map(p => p.batch_year)
    .filter(Boolean);
  
  if (years.length === 0) return [2015, 2024];
  
  return [Math.min(...years), Math.max(...years)];
};

// Get profile by ID
export const getProfileById = (profileId) => {
  const profiles = getAllAlumniProfiles();
  return profiles.find(p => p.id === profileId);
};

// Get profile by user ID
export const getProfileByUserId = (userId) => {
  const profiles = getAllAlumniProfiles();
  return profiles.find(p => p.user_id === userId);
};

// Save search to history
export const saveSearchHistory = (query) => {
  if (!query || query.trim() === '') return;
  
  const history = getStoredData(SEARCH_HISTORY_KEY, []);
  const newHistory = [query, ...history.filter(q => q !== query)].slice(0, 10);
  saveData(SEARCH_HISTORY_KEY, newHistory);
};

// Get search history
export const getSearchHistory = () => {
  return getStoredData(SEARCH_HISTORY_KEY, []);
};

// Clear search history
export const clearSearchHistory = () => {
  saveData(SEARCH_HISTORY_KEY, []);
};

// Get suggestions based on query
export const getSearchSuggestions = (query) => {
  if (!query || query.trim() === '') return [];
  
  const profiles = getAllAlumniProfiles();
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
};

export default {
  getAllAlumniProfiles,
  searchAlumni,
  filterAlumni,
  sortAlumni,
  paginateResults,
  getUniqueCompanies,
  getUniqueSkills,
  getUniqueLocations,
  getUniqueRoles,
  getBatchYearRange,
  getProfileById,
  getProfileByUserId,
  saveSearchHistory,
  getSearchHistory,
  clearSearchHistory,
  getSearchSuggestions
};