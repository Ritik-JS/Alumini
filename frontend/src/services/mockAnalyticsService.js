import mockData from '../mockdata.json';

// Mock Analytics Service - calculates analytics from mock data
export const mockAnalyticsService = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = mockData.users || [];
        const jobs = mockData.jobs || [];
        const events = mockData.events || [];
        const posts = mockData.forum_posts || [];
        const profiles = mockData.alumni_profiles || [];

        resolve({
          success: true,
          data: {
            totalUsers: users.length,
            activeUsers: Math.floor(users.length * 0.7),
            verifiedAlumni: profiles.filter((p) => p.is_verified).length,
            totalJobs: jobs.length,
            activeJobs: jobs.filter((j) => j.status === 'active').length,
            totalEvents: events.length,
            upcomingEvents: events.filter(
              (e) => new Date(e.start_date) > new Date() && e.status === 'published'
            ).length,
            forumPosts: posts.length,
            totalApplications: mockData.job_applications?.length || 0,
            mentorshipRequests: mockData.mentorship_requests?.length || 0,
            mentorshipSessions: mockData.mentorship_sessions?.length || 0,
          },
        });
      }, 300);
    });
  },

  // Get user growth over time
  getUserGrowth: async (period = 'monthly') => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock monthly growth data
        const growthData = [
          { month: 'Jan', users: 45, date: '2024-01' },
          { month: 'Feb', users: 52, date: '2024-02' },
          { month: 'Mar', users: 61, date: '2024-03' },
          { month: 'Apr', users: 70, date: '2024-04' },
          { month: 'May', users: 85, date: '2024-05' },
          { month: 'Jun', users: 98, date: '2024-06' },
        ];

        resolve({
          success: true,
          data: growthData,
        });
      }, 300);
    });
  },

  // Get engagement metrics
  getEngagementMetrics: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = mockData.users || [];

        resolve({
          success: true,
          data: {
            dailyActiveUsers: Math.floor(users.length * 0.65),
            weeklyActiveUsers: Math.floor(users.length * 0.82),
            monthlyActiveUsers: Math.floor(users.length * 0.94),
            dailyActivePercentage: 65,
            weeklyActivePercentage: 82,
            monthlyActivePercentage: 94,
          },
        });
      }, 300);
    });
  },

  // Get top contributors
  getTopContributors: async (limit = 10) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock top contributors data
        const contributors = [
          { name: 'John Doe', email: 'john.doe@alumni.edu', contributions: 45, type: 'Posts' },
          { name: 'Jane Smith', email: 'jane.smith@alumni.edu', contributions: 38, type: 'Events' },
          {
            name: 'Mike Johnson',
            email: 'mike.j@alumni.edu',
            contributions: 32,
            type: 'Mentorship',
          },
          { name: 'Sarah Williams', email: 'sarah.w@alumni.edu', contributions: 28, type: 'Jobs' },
          { name: 'David Brown', email: 'david.b@alumni.edu', contributions: 25, type: 'Posts' },
        ].slice(0, limit);

        resolve({
          success: true,
          data: contributors,
        });
      }, 300);
    });
  },

  // Get platform activity breakdown
  getPlatformActivity: async (days = 30) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const activity = [
          { activity: 'New user registration', count: 156, trend: '+12%' },
          { activity: 'Job applications', count: 234, trend: '+18%' },
          { activity: 'Event RSVPs', count: 189, trend: '+8%' },
          { activity: 'Forum posts created', count: 92, trend: '+25%' },
          { activity: 'Mentorship requests', count: 67, trend: '+15%' },
          { activity: 'Profile views', count: 1243, trend: '+10%' },
        ];

        resolve({
          success: true,
          data: activity,
        });
      }, 300);
    });
  },

  // Get analytics by category
  getAnalyticsByCategory: async (category) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            category,
            metrics: {},
          },
        });
      }, 300);
    });
  },

  // Get alumni analytics
  getAlumniAnalytics: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const profiles = mockData.alumni_profiles || [];

        // Calculate location distribution
        const locationCounts = {};
        profiles.forEach((p) => {
          const loc = p.current_location || 'Unknown';
          locationCounts[loc] = (locationCounts[loc] || 0) + 1;
        });

        const locationData = Object.entries(locationCounts)
          .map(([location, count]) => ({ location, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Calculate company distribution
        const companyCounts = {};
        profiles.forEach((p) => {
          const company = p.current_company || 'Unknown';
          companyCounts[company] = (companyCounts[company] || 0) + 1;
        });

        const companyData = Object.entries(companyCounts)
          .map(([company, count]) => ({ company, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Calculate batch distribution
        const batchCounts = {};
        profiles.forEach((p) => {
          const batch = p.graduation_year || 'Unknown';
          batchCounts[batch] = (batchCounts[batch] || 0) + 1;
        });

        const batchData = Object.entries(batchCounts)
          .map(([year, count]) => ({ year, count }))
          .sort((a, b) => a.year - b.year);

        // Top skills
        const skillCounts = {};
        profiles.forEach((p) => {
          const skills = p.skills || [];
          skills.forEach((skill) => {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          });
        });

        const skillData = Object.entries(skillCounts)
          .map(([skill, count]) => ({ skill, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);

        resolve({
          success: true,
          data: {
            totalAlumni: profiles.length,
            verifiedAlumni: profiles.filter((p) => p.is_verified).length,
            locationDistribution: locationData,
            topCompanies: companyData,
            batchDistribution: batchData,
            topSkills: skillData,
          },
        });
      }, 300);
    });
  },

  // Get job analytics
  getJobAnalytics: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const jobs = mockData.jobs || [];
        const applications = mockData.job_applications || [];

        // Job type distribution
        const typeCounts = {};
        jobs.forEach((j) => {
          const type = j.job_type || 'Unknown';
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });

        const typeData = Object.entries(typeCounts).map(([name, value]) => ({
          name,
          value,
          color: name === 'Full-time' ? '#3b82f6' : name === 'Internship' ? '#10b981' : name === 'Part-time' ? '#f59e0b' : '#8b5cf6',
        }));

        // Location distribution
        const locationCounts = {};
        jobs.forEach((j) => {
          const loc = j.location || 'Unknown';
          locationCounts[loc] = (locationCounts[loc] || 0) + 1;
        });

        const locationData = Object.entries(locationCounts)
          .map(([location, jobs]) => ({ location, jobs }))
          .sort((a, b) => b.jobs - a.jobs)
          .slice(0, 5);

        // Application trends (mock weekly data)
        const applicationTrends = [
          { week: 'Week 1', applications: 3 },
          { week: 'Week 2', applications: 8 },
          { week: 'Week 3', applications: 12 },
          { week: 'Week 4', applications: 18 },
        ];

        // Top skills
        const skillCounts = {};
        jobs.forEach((j) => {
          const skills = j.required_skills || [];
          skills.forEach((skill) => {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          });
        });

        const skillData = Object.entries(skillCounts)
          .map(([skill, count]) => ({ skill, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        resolve({
          success: true,
          data: {
            totalJobs: jobs.length,
            totalApplications: applications.length,
            averageApplicationsPerJob: jobs.length > 0 ? (applications.length / jobs.length).toFixed(1) : 0,
            averageDaysToHire: 3.2,
            jobsByType: typeData,
            jobsByLocation: locationData,
            applicationTrends,
            topSkillsRequired: skillData,
          },
        });
      }, 300);
    });
  },

  // Get mentorship analytics
  getMentorshipAnalytics: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const requests = mockData.mentorship_requests || [];
        const sessions = mockData.mentorship_sessions || [];
        const mentors = mockData.mentor_profiles || [];

        // Request status distribution
        const statusCounts = {};
        requests.forEach((r) => {
          const status = r.status || 'Unknown';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        const statusData = Object.entries(statusCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: name === 'accepted' ? '#10b981' : name === 'pending' ? '#f59e0b' : '#ef4444',
        }));

        // Sessions over time (mock monthly data)
        const sessionTrends = [
          { month: 'Jul', sessions: 5 },
          { month: 'Aug', sessions: 8 },
          { month: 'Sep', sessions: 12 },
          { month: 'Oct', sessions: 15 },
          { month: 'Nov', sessions: 20 },
          { month: 'Dec', sessions: 25 },
        ];

        // Top expertise areas (mock data)
        const expertiseData = [
          { area: 'Career', count: 12 },
          { area: 'Technical', count: 10 },
          { area: 'Leadership', count: 6 },
          { area: 'Networking', count: 5 },
          { area: 'Interview', count: 8 },
        ];

        // Rating distribution (mock data)
        const ratingData = [
          { stars: '5 stars', count: 18 },
          { stars: '4 stars', count: 5 },
          { stars: '3 stars', count: 2 },
          { stars: '2 stars', count: 0 },
          { stars: '1 star', count: 0 },
        ];

        resolve({
          success: true,
          data: {
            totalRequests: requests.length,
            activeMentors: mentors.length,
            completedSessions: sessions.length,
            averageRating: 4.8,
            requestsByStatus: statusData,
            sessionsOverTime: sessionTrends,
            topExpertiseAreas: expertiseData,
            ratingDistribution: ratingData,
          },
        });
      }, 300);
    });
  },

  // Get event analytics
  getEventAnalytics: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const events = mockData.events || [];
        const registrations = mockData.event_registrations || mockData.event_rsvps || [];

        // Event type distribution
        const typeCounts = {};
        events.forEach((e) => {
          const type = e.event_type || 'Unknown';
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });

        const typeData = Object.entries(typeCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: name === 'workshop' ? '#3b82f6' : name === 'webinar' ? '#10b981' : name === 'meetup' ? '#f59e0b' : '#8b5cf6',
        }));

        // Participation trend (mock monthly data)
        const participationTrend = [
          { month: 'Jul', registrations: 35 },
          { month: 'Aug', registrations: 48 },
          { month: 'Sep', registrations: 62 },
          { month: 'Oct', registrations: 78 },
          { month: 'Nov', registrations: 95 },
          { month: 'Dec', registrations: 112 },
        ];

        // Format distribution
        const formatCounts = {
          Virtual: 0,
          'In-person': 0,
          Hybrid: 0,
        };
        events.forEach((e) => {
          if (e.is_virtual) formatCounts['Virtual']++;
          else formatCounts['In-person']++;
        });

        const formatData = Object.entries(formatCounts).map(([format, count]) => ({
          format,
          count,
        }));

        // Popular topics (mock data)
        const topicData = [
          { topic: 'Career Development', count: 145, color: 'bg-blue-500' },
          { topic: 'Technology Trends', count: 128, color: 'bg-green-500' },
          { topic: 'Networking', count: 112, color: 'bg-purple-500' },
          { topic: 'Entrepreneurship', count: 98, color: 'bg-orange-500' },
          { topic: 'Industry Insights', count: 85, color: 'bg-pink-500' },
        ];

        resolve({
          success: true,
          data: {
            totalEvents: events.length,
            totalRegistrations: registrations.length,
            attendanceRate: 78,
            averageAttendance: events.length > 0 ? Math.round(registrations.length / events.length) : 0,
            eventsByType: typeData,
            participationTrend,
            eventsByFormat: formatData,
            popularTopics: topicData,
          },
        });
      }, 300);
    });
  },
};

export default mockAnalyticsService;
