import { useState, useEffect } from 'react';
import { mockHeatmapService } from '@/services/mockHeatmapService';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Users, Briefcase, TrendingUp, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const TalentHeatmap = () => {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [skills, setSkills] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('talent'); // 'talent' or 'jobs'
  const [filters, setFilters] = useState({
    skill: '',
    industry: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [locationsRes, skillsRes, industriesRes] = await Promise.all([
        mockHeatmapService.getGeographicData(),
        mockHeatmapService.getSkills(),
        mockHeatmapService.getIndustries()
      ]);

      if (locationsRes.success) setLocations(locationsRes.data);
      if (skillsRes.success) setSkills(skillsRes.data);
      if (industriesRes.success) setIndustries(industriesRes.data);
    } catch (error) {
      toast.error('Failed to load heatmap data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      const res = await mockHeatmapService.getGeographicData(filters);
      if (res.success) {
        setLocations(res.data);
        if (res.data.length === 0) {
          toast.info('No locations found matching your criteria');
        }
      }
    } catch (error) {
      toast.error('Failed to apply filters');
    } finally {
      setLoading(false);
    }
  };

  const getHeatIntensity = (count) => {
    if (count >= 200) return 'bg-red-600';
    if (count >= 150) return 'bg-orange-500';
    if (count >= 100) return 'bg-yellow-500';
    if (count >= 50) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const sortedLocations = [...locations].sort((a, b) => {
    return viewMode === 'talent' 
      ? b.alumni_count - a.alumni_count
      : b.jobs_count - a.jobs_count;
  });

  return (
    <MainLayout>
      <div className="container mx-auto p-6 max-w-7xl" data-testid="talent-heatmap-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
            <MapPin className="h-10 w-10 text-blue-600" />
            Talent & Opportunity Heatmap
          </h1>
          <p className="text-gray-600 text-lg">
            Explore where our alumni are located and discover job opportunities worldwide.
          </p>
        </div>

        {/* View Mode Toggle */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <span className="font-semibold">View:</span>
              <Tabs value={viewMode} onValueChange={setViewMode} className="flex-1">
                <TabsList>
                  <TabsTrigger value="talent" data-testid="talent-view-toggle">
                    <Users className="h-4 w-4 mr-2" />
                    Talent Distribution
                  </TabsTrigger>
                  <TabsTrigger value="jobs" data-testid="jobs-view-toggle">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Job Opportunities
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-8" data-testid="heatmap-filters">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter locations by skill or industry</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Select
                value={filters.skill}
                onValueChange={(value) => {
                  setFilters({...filters, skill: value});
                  applyFilters();
                }}
              >
                <SelectTrigger data-testid="skill-filter">
                  <SelectValue placeholder="Filter by skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Skills</SelectItem>
                  {skills.map(skill => (
                    <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.industry}
                onValueChange={(value) => {
                  setFilters({...filters, industry: value});
                  applyFilters();
                }}
              >
                <SelectTrigger data-testid="industry-filter">
                  <SelectValue placeholder="Filter by industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Industries</SelectItem>
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
              <span className="font-semibold">Intensity:</span>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-600" />
                <span className="text-sm">200+</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500" />
                <span className="text-sm">150-199</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500" />
                <span className="text-sm">100-149</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500" />
                <span className="text-sm">50-99</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500" />
                <span className="text-sm">1-49</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="py-20 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-4 text-gray-600">Loading map data...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Map View (Simplified) */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>
                  {viewMode === 'talent' ? 'Alumni locations' : 'Job opportunity hotspots'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8 min-h-[400px] relative" data-testid="map-visualization">
                  {/* Simplified map representation with location markers */}
                  <div className="flex flex-wrap gap-6 justify-center items-center h-full">
                    {sortedLocations.slice(0, 10).map((location, idx) => {
                      const count = viewMode === 'talent' ? location.alumni_count : location.jobs_count;
                      const size = count >= 200 ? 'w-32 h-32' : count >= 150 ? 'w-24 h-24' : count >= 100 ? 'w-20 h-20' : 'w-16 h-16';
                      
                      return (
                        <button
                          key={location.id}
                          onClick={() => setSelectedLocation(location)}
                          className={`${
                            getHeatIntensity(count)
                          } ${size} rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer flex flex-col items-center justify-center text-white p-2 ${
                            selectedLocation?.id === location.id ? 'ring-4 ring-yellow-400' : ''
                          }`}
                          data-testid={`location-marker-${location.id}`}
                        >
                          <MapPin className="h-6 w-6 mb-1" />
                          <span className="text-xs font-bold text-center">{location.city}</span>
                          <span className="text-lg font-bold">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Details */}
            {selectedLocation && (
              <Card data-testid="location-details-card">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">{selectedLocation.location_name}</CardTitle>
                      <CardDescription>{selectedLocation.country}</CardDescription>
                    </div>
                    <MapPin className="h-10 w-10 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Stats */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                      <Users className="h-10 w-10 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Alumni Count</p>
                        <p className="text-3xl font-bold">{selectedLocation.alumni_count}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                      <Briefcase className="h-10 w-10 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Job Openings</p>
                        <p className="text-3xl font-bold">{selectedLocation.jobs_count}</p>
                      </div>
                    </div>
                  </div>

                  {/* Top Skills */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Top Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedLocation.top_skills.map(skill => (
                        <Badge key={skill} variant="outline" className="text-sm">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Top Companies */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Top Companies
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedLocation.top_companies.map(company => (
                        <Badge key={company} className="text-sm">
                          {company}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Top Industries */}
                  <div>
                    <h3 className="font-semibold mb-3">Top Industries</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedLocation.top_industries.map(industry => (
                        <Badge key={industry} variant="secondary" className="text-sm">
                          {industry}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* List View */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>All Locations</CardTitle>
                <CardDescription>Sorted by {viewMode === 'talent' ? 'alumni count' : 'job count'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3" data-testid="locations-list">
                  {sortedLocations.map((location, idx) => (
                    <button
                      key={location.id}
                      onClick={() => setSelectedLocation(location)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                        selectedLocation?.id === location.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      data-testid={`location-item-${location.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-12 rounded ${getHeatIntensity(viewMode === 'talent' ? location.alumni_count : location.jobs_count)}`} />
                          <div>
                            <h3 className="font-bold text-lg">{location.location_name}</h3>
                            <p className="text-sm text-gray-600">{location.country}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Alumni</p>
                              <p className="text-xl font-bold text-blue-600">{location.alumni_count}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Jobs</p>
                              <p className="text-xl font-bold text-green-600">{location.jobs_count}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default TalentHeatmap;
