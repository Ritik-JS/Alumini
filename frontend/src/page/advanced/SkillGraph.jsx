import { useState, useEffect } from 'react';
import { skillGraphService, skillRecommendationService } from '@/services';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Network, Users, Briefcase, TrendingUp, Lightbulb, TrendingUpIcon, ExternalLink, Zap, ArrowUpCircle } from 'lucide-react';
import { toast } from 'sonner';

const SkillGraph = () => {
  const [skills, setSkills] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [trendingSkills, setTrendingSkills] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    industry: ''
  });

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [skillsRes, industriesRes, recommendationsRes, trendsRes] = await Promise.all([
        skillGraphService.getSkillGraph(),
        skillGraphService.getIndustries(),
        skillRecommendationService.getRecommendations(currentUser.id),
        skillRecommendationService.getTopTrendingSkills(10)
      ]);

      // Handle skills response - ensure it's an array
      if (skillsRes?.success && Array.isArray(skillsRes.data)) {
        setSkills(skillsRes.data);
      } else {
        setSkills([]);
      }
      
      // Handle industries response - ensure it's an array
      if (industriesRes?.success && Array.isArray(industriesRes.data)) {
        setIndustries(industriesRes.data);
      } else {
        setIndustries([]);
      }
      
      // Handle recommendations response - ensure it's an array
      if (recommendationsRes?.success && Array.isArray(recommendationsRes.data)) {
        setRecommendations(recommendationsRes.data);
      } else {
        setRecommendations([]);
      }
      
      // Handle trends response - ensure it's an array
      if (trendsRes?.success && Array.isArray(trendsRes.data)) {
        setTrendingSkills(trendsRes.data);
      } else {
        setTrendingSkills([]);
      }
    } catch (error) {
      console.error('Error loading skill graph data:', error);
      toast.error('Failed to load skill graph data');
      // Set empty arrays on error
      setSkills([]);
      setIndustries([]);
      setRecommendations([]);
      setTrendingSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const res = await skillGraphService.getSkillGraph(filters);
      if (res?.success && Array.isArray(res.data)) {
        setSkills(res.data);
        if (res.data.length === 0) {
          toast.info('No skills found matching your criteria');
        }
      } else {
        setSkills([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSkillClick = async (skill) => {
    setSelectedSkill(skill);
    try {
      const res = await skillGraphService.getAlumniBySkill(skill.skill_name);
      if (res.success) {
        toast.success(`Found ${res.count} alumni with ${skill.skill_name}`);
      }
    } catch (error) {
      toast.error('Failed to load alumni data');
    }
  };

  const getSkillColor = (popularity) => {
    if (popularity >= 90) return 'bg-purple-500 hover:bg-purple-600';
    if (popularity >= 80) return 'bg-blue-500 hover:bg-blue-600';
    if (popularity >= 70) return 'bg-green-500 hover:bg-green-600';
    return 'bg-gray-500 hover:bg-gray-600';
  };

  const getSkillSize = (alumniCount) => {
    if (alumniCount >= 150) return 'text-2xl p-8';
    if (alumniCount >= 100) return 'text-xl p-6';
    if (alumniCount >= 50) return 'text-lg p-5';
    return 'text-base p-4';
  };

  const getDemandColor = (demand) => {
    const colors = {
      'very-high': 'bg-red-100 text-red-800 border-red-300',
      'high': 'bg-orange-100 text-orange-800 border-orange-300',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'low': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[demand] || colors['medium'];
  };

  const getRelevanceColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 max-w-7xl" data-testid="skill-graph-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
            <Network className="h-10 w-10 text-purple-600" />
            Skill Graph Visualization
          </h1>
          <p className="text-gray-600 text-lg">
            Explore the network of skills, their connections, and the alumni who possess them.
          </p>
        </div>

        {/* AI-Powered Recommendations Panel */}
        {recommendations.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Skills You Should Learn */}
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white" data-testid="skill-recommendations-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-purple-600" />
                  Skills You Should Learn
                </CardTitle>
                <CardDescription>
                  AI-powered recommendations based on your profile and career goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendations.slice(0, 3).map((rec, index) => (
                    <div 
                      key={index} 
                      className="p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                      data-testid={`recommendation-${index}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-lg">{rec.skill_name}</h4>
                        <Badge className={getDemandColor(rec.job_demand)} data-testid="demand-badge">
                          {rec.job_demand.replace('-', ' ')} demand
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-2 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">Relevance:</span>
                          <span className={`font-semibold ${getRelevanceColor(rec.relevance_score)}`}>
                            {rec.relevance_score}%
                          </span>
                        </div>
                        {rec.trending && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <TrendingUpIcon className="h-3 w-3" />
                            +{rec.growth_rate}%
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{rec.reason}</p>

                      {rec.learning_resources && rec.learning_resources.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {rec.learning_resources.slice(0, 2).map((resource, idx) => (
                            <a
                              key={idx}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {resource.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trending Skills */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white" data-testid="trending-skills-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Trending Skills in Tech
                </CardTitle>
                <CardDescription>
                  Fastest growing skills with emerging opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trendingSkills.slice(0, 5).map((trend, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow"
                      data-testid={`trending-skill-${index}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-semibold">{trend.skill_name}</h5>
                          <Badge variant="outline" className="text-xs">
                            {trend.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {trend.job_count} jobs
                          </span>
                          <span className="text-green-600 font-medium">
                            {trend.avg_salary_increase} avg increase
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-green-600 font-semibold">
                        <ArrowUpCircle className="h-4 w-4" />
                        {trend.growth_rate}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-8" data-testid="skill-graph-filters">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find skills by name or filter by industry</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search skills (e.g., JavaScript, Python)..."
                      className="pl-10"
                      value={filters.search}
                      onChange={(e) => setFilters({...filters, search: e.target.value})}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      data-testid="skill-search-input"
                    />
                  </div>
                  <Button onClick={handleSearch} data-testid="skill-search-button">
                    Search
                  </Button>
                </div>
              </div>
              <Select
                value={filters.industry}
                onValueChange={(value) => {
                  setFilters({...filters, industry: value === 'all' ? '' : value});
                  handleSearch();
                }}
              >
                <SelectTrigger data-testid="industry-filter">
                  <SelectValue placeholder="Filter by industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {industries.map(industry => (
                    <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <span className="font-semibold">Legend:</span>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-purple-500" />
                <span className="text-sm">Popularity 90+</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <span className="text-sm">Popularity 80-89</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <span className="text-sm">Popularity 70-79</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-500" />
                <span className="text-sm">Below 70</span>
              </div>
              <span className="text-sm text-gray-600 ml-4">• Size indicates alumni count</span>
            </div>
          </CardContent>
        </Card>

        {/* Skill Graph Visualization */}
        {loading ? (
          <Card>
            <CardContent className="py-20 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
              <p className="mt-4 text-gray-600">Loading skill graph...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Skills Network</CardTitle>
                <CardDescription>
                  Click on any skill to see related alumni. Larger nodes have more alumni.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 justify-center p-8 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg min-h-[400px]" data-testid="skill-nodes-container">
                  {Array.isArray(skills) && skills.map(skill => (
                    <button
                      key={skill.id}
                      onClick={() => handleSkillClick(skill)}
                      className={`rounded-full text-white font-semibold transition-all transform hover:scale-110 shadow-lg ${
                        getSkillColor(skill.popularity_score)
                      } ${
                        getSkillSize(skill.alumni_count)
                      } ${
                        selectedSkill?.id === skill.id ? 'ring-4 ring-yellow-400 scale-110' : ''
                      }`}
                      data-testid={`skill-node-${skill.id}`}
                    >
                      {skill.skill_name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Selected Skill Details */}
            {selectedSkill && (
              <Card data-testid="skill-details-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {selectedSkill.skill_name}
                    <Badge variant="secondary" className="ml-2">
                      Popularity: {selectedSkill.popularity_score.toFixed(1)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Stats */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                      <Users className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Alumni Count</p>
                        <p className="text-2xl font-bold">{selectedSkill.alumni_count}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                      <Briefcase className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Job Openings</p>
                        <p className="text-2xl font-bold">{selectedSkill.job_count}</p>
                      </div>
                    </div>
                  </div>

                  {/* Related Skills */}
                  {selectedSkill.related_skills && Array.isArray(selectedSkill.related_skills) && selectedSkill.related_skills.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Related Skills
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedSkill.related_skills.map(skill => (
                          <Badge key={skill} variant="outline" className="text-sm">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Industry Connections */}
                  {selectedSkill.industry_connections && Array.isArray(selectedSkill.industry_connections) && selectedSkill.industry_connections.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Industry Connections</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedSkill.industry_connections.map(industry => (
                          <Badge key={industry} className="text-sm">
                            {industry}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default SkillGraph;
