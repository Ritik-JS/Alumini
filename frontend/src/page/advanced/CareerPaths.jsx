import { useState, useEffect } from 'react';
import { careerPathService } from '@/services';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, ArrowRight, Users, Clock, Target, Star, Network } from 'lucide-react';
import { toast } from 'sonner';
import TransitionFlowDiagram from '@/components/career/TransitionFlowDiagram';

const CareerPaths = () => {
  const [careerPaths, setCareerPaths] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' or 'network'
  const [filters, setFilters] = useState({
    startingRole: '',
    targetRole: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pathsRes, rolesRes] = await Promise.all([
        careerPathService.getCareerPaths(),
        careerPathService.getRoles()
      ]);

      if (pathsRes.success) {
        // Extract career_paths array from nested data structure
        setCareerPaths(pathsRes.data?.career_paths || pathsRes.data || []);
      } else {
        setCareerPaths([]);
      }
      
      if (rolesRes.success) {
        // Extract role names from proper nested structure
        let roleNames = [];
        
        if (rolesRes.data?.roles && Array.isArray(rolesRes.data.roles)) {
          roleNames = rolesRes.data.roles.map(r => r.role || r);
        } else if (Array.isArray(rolesRes.data)) {
          roleNames = rolesRes.data.map(r => r.role || r);
        }
        
        setRoles(roleNames || []);
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.error('Error loading career paths:', error);
      toast.error('Failed to load career paths');
      // Set empty arrays on error to prevent undefined errors
      setCareerPaths([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const res = await careerPathService.getCareerPaths(filters);
      if (res.success) {
        const paths = res.data?.career_paths || res.data || [];
        setCareerPaths(paths);
        if (paths.length === 0) {
          toast.info('No career paths found matching your criteria');
        }
      } else {
        setCareerPaths([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
      setCareerPaths([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 max-w-7xl" data-testid="career-paths-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
            <TrendingUp className="h-10 w-10 text-blue-600" />
            Career Path Explorer
          </h1>
          <p className="text-gray-600 text-lg">
            Discover common career transitions and learn from alumni success stories.
          </p>
        </div>

        {/* Search Interface */}
        <Card className="mb-8" data-testid="career-path-filters">
          <CardHeader>
            <CardTitle>Explore Career Transitions</CardTitle>
            <CardDescription>Select starting role and target role to see possible paths</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Select
                value={filters.startingRole || 'any'}
                onValueChange={(value) => setFilters({...filters, startingRole: value === 'any' ? '' : value})}
              >
                <SelectTrigger data-testid="starting-role-select">
                  <SelectValue placeholder="Starting Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Role</SelectItem>
                  {Array.isArray(roles) && roles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.targetRole || 'any'}
                onValueChange={(value) => setFilters({...filters, targetRole: value === 'any' ? '' : value})}
              >
                <SelectTrigger data-testid="target-role-select">
                  <SelectValue placeholder="Target Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Role</SelectItem>
                  {Array.isArray(roles) && roles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={handleSearch} className="w-full" data-testid="search-paths-button">
                <Target className="mr-2 h-4 w-4" />
                Find Paths
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* View Tabs */}
        <Tabs value={view} onValueChange={setView} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="network" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Network View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="network" className="mt-6">
            {loading ? (
              <Card>
                <CardContent className="py-20 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                  <p className="mt-4 text-gray-600">Loading network visualization...</p>
                </CardContent>
              </Card>
            ) : careerPaths.length === 0 ? (
              <Card>
                <CardContent className="py-20 text-center">
                  <Network className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Data for Network</h3>
                  <p className="text-gray-600">Try adjusting your search criteria</p>
                </CardContent>
              </Card>
            ) : (
              <TransitionFlowDiagram careerPaths={careerPaths} />
            )}
          </TabsContent>

          <TabsContent value="list" className="mt-6">

        {/* Career Paths - List View */}
        {loading ? (
          <Card>
            <CardContent className="py-20 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-4 text-gray-600">Loading career paths...</p>
            </CardContent>
          </Card>
        ) : careerPaths.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <TrendingUp className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Career Paths Found</h3>
              <p className="text-gray-600">Try adjusting your search criteria</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6" data-testid="career-paths-list">
            {careerPaths.map(path => (
              <Card key={path.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`career-path-${path.id}`}>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-center">
                        <Badge variant="outline" className="mb-2">Start</Badge>
                        <p className="font-bold text-lg">{path.starting_role}</p>
                      </div>
                      <ArrowRight className="h-8 w-8 text-blue-600" />
                      <div className="text-center">
                        <Badge className="mb-2">Target</Badge>
                        <p className="font-bold text-lg">{path.target_role}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      {path.transition_percentage}% transition rate
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Stats */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                      <Clock className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Avg. Timeline</p>
                        <p className="text-xl font-bold">{path.avg_years} years</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                      <Users className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Alumni</p>
                        <p className="text-xl font-bold">{path.alumni_count}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                      <Star className="h-8 w-8 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Transition Rate</p>
                        <p className="text-xl font-bold">{path.transition_percentage}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Common Skills */}
                  <div>
                    <h3 className="font-semibold mb-3">Skills to Develop</h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(path.common_skills) && path.common_skills.map(skill => (
                        <Badge key={skill} variant="outline" className="text-sm">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Success Stories */}
                  {Array.isArray(path.success_stories) && path.success_stories.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Success Stories</h3>
                      <div className="space-y-3">
                        {path.success_stories.map((story, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                            <Avatar>
                              <AvatarImage src={`https://i.pravatar.cc/150?img=${idx + 1}`} />
                              <AvatarFallback>{story.alumni_name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold">{story.alumni_name}</p>
                              <p className="text-sm text-gray-600 mt-1">{story.journey}</p>
                              <Badge variant="secondary" className="mt-2">
                                {story.timeline_years} years timeline
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default CareerPaths;
