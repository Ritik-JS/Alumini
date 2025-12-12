import { useState, useEffect } from 'react';
import { heatmapService } from '@/services';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Briefcase, TrendingUp, Building2, Layers } from 'lucide-react';
import { toast } from 'sonner';
import ClusterDetailsModal from '@/components/heatmap/ClusterDetailsModal';
import EmergingHubsPanel from '@/components/heatmap/EmergingHubsPanel';

const TalentHeatmap = () => {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [skills, setSkills] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('talent'); // 'talent' or 'jobs'
  const [showClusters, setShowClusters] = useState(true);
  const [clusters, setClusters] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [isClusterModalOpen, setIsClusterModalOpen] = useState(false);
  const [emergingHubs, setEmergingHubs] = useState([]);
  const [filters, setFilters] = useState({
    skill: '',
    industry: '',
    experienceLevel: 'all'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [locationsRes, skillsRes, industriesRes, clustersRes, emergingRes] = await Promise.all([
        heatmapService.getGeographicData(),
        heatmapService.getSkills(),
        heatmapService.getIndustries(),
        heatmapService.getTalentClusters(),
        heatmapService.getEmergingHubs()
      ]);

      if (locationsRes.success) setLocations(locationsRes.data || []);
      if (skillsRes.success) {
        // Extract skill names from array of objects {name, location_count}
        const skillNames = (skillsRes.data || []).map(s => s.name);
        setSkills(skillNames);
      }
      if (industriesRes.success) {
        const industryData = industriesRes.data || {};
        let industryNames = [];
        
        // Extract from top_industries_global array first (primary source)
        if (industryData.top_industries_global && Array.isArray(industryData.top_industries_global)) {
          industryNames = industryData.top_industries_global.map(item => item.industry);
        } 
        // Fallback: extract from by_location
        else if (industryData.by_location && Array.isArray(industryData.by_location)) {
          const allIndustries = new Set();
          industryData.by_location.forEach(loc => {
            if (loc.industries && Array.isArray(loc.industries)) {
              loc.industries.forEach(ind => allIndustries.add(ind));
            }
          });
          industryNames = Array.from(allIndustries);
        }
        // Final fallback: if data is directly an array
        else if (Array.isArray(industryData)) {
          industryNames = industryData.map(ind => ind.name || ind.industry || ind);
        }
        
        setIndustries(industryNames || []);
      }
      if (clustersRes.success) {
        // Extract clusters array from nested data structure
        setClusters(clustersRes.data?.clusters || clustersRes.data || []);
      }
      if (emergingRes.success) setEmergingHubs(emergingRes.data || []);
    } catch (error) {
      console.error('Error loading heatmap data:', error);
      toast.error('Failed to load heatmap data. Please try again.');
      // Set safe defaults to prevent undefined errors
      setLocations([]);
      setSkills([]);
      setIndustries([]);
      setClusters([]);
      setEmergingHubs([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      const [locationsRes, clustersRes] = await Promise.all([
        heatmapService.getGeographicData(filters),
        heatmapService.getTalentClusters(filters)
      ]);
      
      if (locationsRes.success) {
        setLocations(locationsRes.data);
        if (locationsRes.data.length === 0) {
          toast.info('No locations found matching your criteria');
        }
      }
      
      if (clustersRes.success) {
        setClusters(clustersRes.data?.clusters || clustersRes.data || []);
      }
    } catch (error) {
      toast.error('Failed to apply filters');
    } finally {
      setLoading(false);
    }
  };

  const handleClusterClick = async (cluster) => {
    setSelectedCluster(cluster);
    setIsClusterModalOpen(true);
  };

  const handleViewClusterFromHub = (hub) => {
    setSelectedCluster(hub);
    setIsClusterModalOpen(true);
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
            <CardTitle>Advanced Filters</CardTitle>
            <CardDescription>Filter locations by skill, industry, or experience level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <Select
                value={filters.skill || 'all'}
                onValueChange={(value) => {
                  setFilters({...filters, skill: value === 'all' ? '' : value});
                  applyFilters();
                }}
              >
                <SelectTrigger data-testid="skill-filter">
                  <SelectValue placeholder="Filter by skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Skills</SelectItem>
                  {skills.map(skill => (
                    <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.industry || 'all'}
                onValueChange={(value) => {
                  setFilters({...filters, industry: value === 'all' ? '' : value});
                  applyFilters();
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

              <Select
                value={filters.experienceLevel}
                onValueChange={(value) => {
                  setFilters({...filters, experienceLevel: value});
                  applyFilters();
                }}
              >
                <SelectTrigger data-testid="experience-filter">
                  <SelectValue placeholder="Experience Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                  <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                  <SelectItem value="senior">Senior (6-10 years)</SelectItem>
                  <SelectItem value="lead">Lead (10+ years)</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button
                  variant={showClusters ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setShowClusters(!showClusters)}
                  data-testid="toggle-clusters-btn"
                >
                  <Layers className="h-4 w-4 mr-2" />
                  {showClusters ? 'Hide' : 'Show'} Clusters
                </Button>
              </div>
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
            {/* Map View with Clusters */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>
                  {viewMode === 'talent' ? 'Alumni locations' : 'Job opportunity hotspots'}
                  {showClusters && ' with talent clusters'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8 min-h-[500px] relative" data-testid="map-visualization">
                  {/* Simplified map representation with location markers and clusters */}
                  <div className="relative h-full">
                    {/* Cluster circles (background layer) */}
                    {showClusters && (
                      <div className="absolute inset-0 flex flex-wrap gap-8 justify-center items-center">
                        {clusters.map((cluster) => {
                          const clusterSize = cluster.alumni_count >= 250 ? 'w-48 h-48' : 
                                            cluster.alumni_count >= 180 ? 'w-40 h-40' : 
                                            cluster.alumni_count >= 120 ? 'w-36 h-36' : 'w-32 h-32';
                          const intensity = cluster.alumni_count >= 250 ? 'bg-purple-200/40' :
                                          cluster.alumni_count >= 180 ? 'bg-blue-200/40' :
                                          cluster.alumni_count >= 120 ? 'bg-green-200/40' : 'bg-yellow-200/40';
                          
                          return (
                            <button
                              key={cluster.id}
                              onClick={() => handleClusterClick(cluster)}
                              className={`${clusterSize} ${intensity} rounded-full border-4 border-dashed border-blue-400 hover:border-blue-600 transition-all cursor-pointer flex flex-col items-center justify-center hover:scale-105 relative group`}
                              data-testid={`cluster-${cluster.id}`}
                            >
                              <Layers className="h-8 w-8 text-blue-600 mb-2" />
                              <span className="text-sm font-bold text-gray-700 text-center px-2">
                                {cluster.cluster_name || cluster.center_location?.city || 'Cluster'}
                              </span>
                              <span className="text-xs text-gray-600">Cluster</span>
                              <span className="text-lg font-bold text-blue-600">{cluster.alumni_count}</span>
                              
                              {/* Hover tooltip */}
                              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                Click for details
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Location markers (foreground layer) */}
                    {!showClusters && (
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
                    )}
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

            {/* Two Column Layout: List View + Emerging Hubs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
              {/* List View */}
              <Card className="lg:col-span-2">
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

              {/* Emerging Hubs Panel */}
              <div className="lg:col-span-1">
                <EmergingHubsPanel 
                  emergingHubs={emergingHubs}
                  onViewCluster={handleViewClusterFromHub}
                />
              </div>
            </div>
          </>
        )}

        {/* Cluster Details Modal */}
        <ClusterDetailsModal
          isOpen={isClusterModalOpen}
          onClose={() => setIsClusterModalOpen(false)}
          cluster={selectedCluster}
        />
      </div>
    </MainLayout>
  );
};

export default TalentHeatmap;
