import mockData from '../mockdata.json';

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockSkillGraphService = {
  // Get skill graph data
  getSkillGraph: async (filters = {}) => {
    await delay(300);
    
    let skills = [...mockData.skill_graph];
    
    // Filter by industry if provided
    if (filters.industry) {
      skills = skills.filter(skill => 
        skill.industry_connections.includes(filters.industry)
      );
    }
    
    // Search by skill name
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      skills = skills.filter(skill => 
        skill.skill_name.toLowerCase().includes(searchLower) ||
        skill.related_skills.some(s => s.toLowerCase().includes(searchLower))
      );
    }
    
    return {
      success: true,
      data: skills
    };
  },

  // Get alumni by skill
  getAlumniBySkill: async (skillName) => {
    await delay(300);
    
    // Find the skill in skill_graph to get the correct count
    const skillData = mockData.skill_graph.find(skill => 
      skill.skill_name === skillName
    );
    
    // Find alumni profiles with this skill
    const alumniWithSkill = mockData.alumni_profiles.filter(profile => 
      profile.skills && profile.skills.includes(skillName)
    );
    
    // Return the skill_graph count (which matches database) but also include found profiles
    return {
      success: true,
      data: alumniWithSkill,
      count: skillData ? skillData.alumni_count : alumniWithSkill.length
    };
  },

  // Get all unique industries
  getIndustries: async () => {
    await delay(100);
    
    const industries = new Set();
    mockData.skill_graph.forEach(skill => {
      skill.industry_connections.forEach(industry => industries.add(industry));
    });
    
    return {
      success: true,
      data: Array.from(industries).sort()
    };
  }
};
