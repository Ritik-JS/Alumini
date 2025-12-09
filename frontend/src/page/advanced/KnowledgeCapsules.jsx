import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { knowledgeService } from '@/services';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Search, Heart, Bookmark, Eye, Clock, Plus, TrendingUp, Star, Sparkles, Target } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const KnowledgeCapsules = () => {
  const navigate = useNavigate();
  const [capsules, setCapsules] = useState([]);
  const [personalizedCapsules, setPersonalizedCapsules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPersonalized, setLoadingPersonalized] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    sort: 'recent'
  });
  const [likedCapsules, setLikedCapsules] = useState(new Set());
  const [bookmarkedCapsules, setBookmarkedCapsules] = useState(new Set());

  useEffect(() => {
    loadData();
    loadUserInteractions();
  }, []);

  useEffect(() => {
    if (activeTab === 'for-you') {
      loadPersonalizedCapsules();
    }
  }, [activeTab]);

  const loadUserInteractions = () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!currentUser.id) return;

    // Load user's likes
    const userLikes = JSON.parse(localStorage.getItem('user_capsule_likes') || '{}');
    if (userLikes[currentUser.id]) {
      setLikedCapsules(new Set(userLikes[currentUser.id]));
    }

    // Load user's bookmarks
    const userBookmarks = JSON.parse(localStorage.getItem('user_capsule_bookmarks') || '{}');
    if (userBookmarks[currentUser.id]) {
      setBookmarkedCapsules(new Set(userBookmarks[currentUser.id]));
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [capsulesRes, categoriesRes] = await Promise.all([
        knowledgeService.getKnowledgeCapsules(filters),
        knowledgeService.getCategories()
      ]);

      if (capsulesRes.success) setCapsules(capsulesRes.data);
      if (categoriesRes.success) setCategories(categoriesRes.data);
    } catch (error) {
      toast.error('Failed to load knowledge capsules');
    } finally {
      setLoading(false);
    }
  };

  const loadPersonalizedCapsules = async () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!currentUser.id) {
      toast.info('Please login to see personalized recommendations');
      return;
    }

    try {
      setLoadingPersonalized(true);
      const res = await knowledgeService.getPersonalizedCapsules(currentUser.id);
      if (res.success) {
        setPersonalizedCapsules(res.data);
      }
    } catch (error) {
      toast.error('Failed to load personalized capsules');
    } finally {
      setLoadingPersonalized(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const res = await knowledgeService.getKnowledgeCapsules(filters);
      if (res.success) {
        setCapsules(res.data);
        if (res.data.length === 0) {
          toast.info('No capsules found matching your criteria');
        }
      }
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (capsuleId) => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!currentUser.id) {
      toast.error('Please login to like capsules');
      return;
    }

    try {
      if (likedCapsules.has(capsuleId)) {
        await knowledgeService.unlikeCapsule(capsuleId);
        setLikedCapsules(prev => {
          const newSet = new Set(prev);
          newSet.delete(capsuleId);
          return newSet;
        });
        
        // Update localStorage
        const userLikes = JSON.parse(localStorage.getItem('user_capsule_likes') || '{}');
        if (userLikes[currentUser.id]) {
          userLikes[currentUser.id] = userLikes[currentUser.id].filter(id => id !== capsuleId);
          localStorage.setItem('user_capsule_likes', JSON.stringify(userLikes));
        }
        
        // Update capsule counts in local state
        setCapsules(prev => prev.map(c => 
          c.id === capsuleId ? { ...c, likes_count: Math.max(0, (c.likes_count || 0) - 1) } : c
        ));
        
        toast.success('Like removed');
      } else {
        await knowledgeService.likeCapsule(capsuleId);
        setLikedCapsules(prev => new Set(prev).add(capsuleId));
        
        // Update localStorage
        const userLikes = JSON.parse(localStorage.getItem('user_capsule_likes') || '{}');
        if (!userLikes[currentUser.id]) userLikes[currentUser.id] = [];
        userLikes[currentUser.id].push(capsuleId);
        localStorage.setItem('user_capsule_likes', JSON.stringify(userLikes));
        
        // Update capsule counts in local state
        setCapsules(prev => prev.map(c => 
          c.id === capsuleId ? { ...c, likes_count: (c.likes_count || 0) + 1 } : c
        ));
        
        toast.success('Capsule liked!');
      }
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleBookmark = async (capsuleId) => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!currentUser.id) {
      toast.error('Please login to bookmark capsules');
      return;
    }

    try {
      await knowledgeService.bookmarkCapsule(capsuleId);
      
      if (bookmarkedCapsules.has(capsuleId)) {
        setBookmarkedCapsules(prev => {
          const newSet = new Set(prev);
          newSet.delete(capsuleId);
          return newSet;
        });
        
        // Update localStorage
        const userBookmarks = JSON.parse(localStorage.getItem('user_capsule_bookmarks') || '{}');
        if (userBookmarks[currentUser.id]) {
          userBookmarks[currentUser.id] = userBookmarks[currentUser.id].filter(id => id !== capsuleId);
          localStorage.setItem('user_capsule_bookmarks', JSON.stringify(userBookmarks));
        }
        
        // Update capsule counts in local state
        setCapsules(prev => prev.map(c => 
          c.id === capsuleId ? { ...c, bookmarks_count: Math.max(0, (c.bookmarks_count || 0) - 1) } : c
        ));
        
        toast.success('Bookmark removed');
      } else {
        setBookmarkedCapsules(prev => new Set(prev).add(capsuleId));
        
        // Update localStorage
        const userBookmarks = JSON.parse(localStorage.getItem('user_capsule_bookmarks') || '{}');
        if (!userBookmarks[currentUser.id]) userBookmarks[currentUser.id] = [];
        userBookmarks[currentUser.id].push(capsuleId);
        localStorage.setItem('user_capsule_bookmarks', JSON.stringify(userBookmarks));
        
        // Update capsule counts in local state
        setCapsules(prev => prev.map(c => 
          c.id === capsuleId ? { ...c, bookmarks_count: (c.bookmarks_count || 0) + 1 } : c
        ));
        
        toast.success('Capsule bookmarked!');
      }
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      technical: 'bg-blue-500',
      career: 'bg-green-500',
      leadership: 'bg-purple-500',
      design: 'bg-pink-500',
      business: 'bg-orange-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const canCreateCapsule = currentUser.role === 'alumni' || currentUser.role === 'admin';

  return (
    <MainLayout>
      <div className="container mx-auto p-6 max-w-7xl" data-testid="knowledge-capsules-page">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
                <BookOpen className="h-10 w-10 text-blue-600" />
                Knowledge Capsules
              </h1>
              <p className="text-gray-600 text-lg">
                Learn from alumni experiences and share your knowledge with the community.
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/knowledge/learning-path')} variant="outline" size="lg">
                <Target className="mr-2 h-5 w-5" />
                Learning Paths
              </Button>
              {canCreateCapsule && (
                <Button onClick={() => navigate('/knowledge/create')} size="lg" data-testid="create-capsule-button">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Capsule
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              All Capsules
            </TabsTrigger>
            <TabsTrigger value="for-you" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              For You (AI)
            </TabsTrigger>
          </TabsList>

          {/* All Capsules Tab */}
          <TabsContent value="all" className="space-y-6">
          {/* Search and Filters */}
          <Card data-testid="capsules-filters">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search capsules..."
                        className="pl-10"
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        data-testid="capsule-search-input"
                      />
                    </div>
                    <Button onClick={handleSearch} data-testid="search-button">
                      Search
                    </Button>
                  </div>
                </div>

                <Select
                  value={filters.category}
                  onValueChange={(value) => {
                    setFilters({...filters, category: value});
                    handleSearch();
                  }}
                >
                  <SelectTrigger data-testid="category-filter">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.sort}
                  onValueChange={(value) => {
                    setFilters({...filters, sort: value});
                    handleSearch();
                  }}
                >
                  <SelectTrigger data-testid="sort-filter">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="trending">Trending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Capsules Grid */}
          {loading ? (
          <Card>
            <CardContent className="py-20 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-4 text-gray-600">Loading capsules...</p>
            </CardContent>
          </Card>
        ) : capsules.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <BookOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Capsules Found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search criteria</p>
              {canCreateCapsule && (
                <Button onClick={() => navigate('/knowledge/create')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Capsule
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="capsules-grid">
            {capsules.map(capsule => (
              <Card
                key={capsule.id}
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => navigate(`/knowledge/${capsule.id}`)}
                data-testid={`capsule-card-${capsule.id}`}
              >
                {/* Featured Image */}
                {capsule.featured_image && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={capsule.featured_image}
                      alt={capsule.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {capsule.is_featured && (
                      <Badge className="absolute top-3 right-3 bg-yellow-500">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-white text-xs font-semibold ${
                      getCategoryColor(capsule.category)
                    }`}>
                      {capsule.category}
                    </div>
                  </div>
                )}

                <CardContent className="p-6">
                  {/* Title */}
                  <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {capsule.title}
                  </h3>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{capsule.duration_minutes} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{capsule.views_count}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {capsule.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {capsule.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{capsule.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(capsule.id);
                        }}
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-500 transition-colors"
                        data-testid={`like-button-${capsule.id}`}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            likedCapsules.has(capsule.id) ? 'fill-red-500 text-red-500' : ''
                          }`}
                        />
                        <span>{capsule.likes_count}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookmark(capsule.id);
                        }}
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-500 transition-colors"
                        data-testid={`bookmark-button-${capsule.id}`}
                      >
                        <Bookmark
                          className={`h-4 w-4 ${
                            bookmarkedCapsules.has(capsule.id) ? 'fill-blue-500 text-blue-500' : ''
                          }`}
                        />
                        <span>{capsule.bookmarks_count}</span>
                      </button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/knowledge/${capsule.id}`);
                      }}
                    >
                      Read More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </TabsContent>

        {/* For You (AI-Ranked) Tab */}
        <TabsContent value="for-you" className="space-y-6">
          {/* Info Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Sparkles className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Personalized Just For You</h3>
                  <p className="text-gray-700 text-sm">
                    These capsules are ranked by AI based on your skills, interests, and career goals. 
                    Match reasons show why each capsule is recommended.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personalized Capsules Grid */}
          {loadingPersonalized ? (
            <Card>
              <CardContent className="py-20 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                <p className="mt-4 text-gray-600">Loading personalized recommendations...</p>
              </CardContent>
            </Card>
          ) : !currentUser.id ? (
            <Card>
              <CardContent className="py-20 text-center">
                <Sparkles className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Login Required</h3>
                <p className="text-gray-600 mb-4">
                  Please login to see personalized recommendations based on your profile
                </p>
                <Button onClick={() => navigate('/login')}>
                  Login to Continue
                </Button>
              </CardContent>
            </Card>
          ) : personalizedCapsules.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <Sparkles className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Recommendations Yet</h3>
                <p className="text-gray-600 mb-4">
                  Complete your profile with skills to get personalized recommendations
                </p>
                <Button onClick={() => navigate('/profile/edit')}>
                  Complete Profile
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personalizedCapsules.map(capsule => (
                <Card
                  key={capsule.id}
                  className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-2"
                  onClick={() => navigate(`/knowledge/${capsule.id}`)}
                  data-testid={`personalized-capsule-${capsule.id}`}
                >
                  {/* Relevance Score Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {capsule.relevance_score}% Match
                    </Badge>
                  </div>

                  {/* Featured Image */}
                  {capsule.featured_image && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={capsule.featured_image}
                        alt={capsule.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {capsule.is_featured && (
                        <Badge className="absolute top-3 left-3 bg-yellow-500">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      <div className={`absolute bottom-3 left-3 px-3 py-1 rounded-full text-white text-xs font-semibold ${
                        getCategoryColor(capsule.category)
                      }`}>
                        {capsule.category}
                      </div>
                    </div>
                  )}

                  <CardContent className="p-6">
                    {/* Match Reasons */}
                    {capsule.match_reasons && capsule.match_reasons.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {capsule.match_reasons.map((reason, idx) => (
                          <Badge 
                            key={idx} 
                            className={cn(
                              "text-xs",
                              reason === "Matches your skills" && "bg-green-100 text-green-700 border-green-300",
                              reason === "Popular in your network" && "bg-blue-100 text-blue-700 border-blue-300",
                              reason === "Trending in your industry" && "bg-orange-100 text-orange-700 border-orange-300",
                              reason === "Featured content" && "bg-purple-100 text-purple-700 border-purple-300"
                            )}
                            variant="outline"
                          >
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {capsule.title}
                    </h3>

                    {/* Skill Overlap */}
                    {capsule.skill_overlap && capsule.skill_overlap.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-gray-600 mb-1">
                          Matching Skills ({capsule.skill_overlap_percentage}%):
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {capsule.skill_overlap.slice(0, 3).map((skill, idx) => (
                            <Badge key={idx} className="text-xs bg-green-500">
                              {skill}
                            </Badge>
                          ))}
                          {capsule.skill_overlap.length > 3 && (
                            <Badge className="text-xs bg-green-500">
                              +{capsule.skill_overlap.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{capsule.duration_minutes} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{capsule.views_count}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {capsule.tags.slice(0, 3).map(tag => {
                        const isMatching = capsule.skill_overlap?.some(
                          skill => skill.toLowerCase().includes(tag.toLowerCase()) || 
                                   tag.toLowerCase().includes(skill.toLowerCase())
                        );
                        return (
                          <Badge 
                            key={tag} 
                            variant="outline" 
                            className={cn("text-xs", isMatching && "border-green-500 bg-green-50")}
                          >
                            {tag}
                          </Badge>
                        );
                      })}
                      {capsule.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{capsule.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(capsule.id);
                          }}
                          className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-500 transition-colors"
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              likedCapsules.has(capsule.id) ? 'fill-red-500 text-red-500' : ''
                            }`}
                          />
                          <span>{capsule.likes_count}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookmark(capsule.id);
                          }}
                          className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-500 transition-colors"
                        >
                          <Bookmark
                            className={`h-4 w-4 ${
                              bookmarkedCapsules.has(capsule.id) ? 'fill-blue-500 text-blue-500' : ''
                            }`}
                          />
                          <span>{capsule.bookmarks_count}</span>
                        </button>
                      </div>
                      <Button size="sm" variant="ghost">
                        Read More →
                      </Button>
                    </div>
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

export default KnowledgeCapsules;
