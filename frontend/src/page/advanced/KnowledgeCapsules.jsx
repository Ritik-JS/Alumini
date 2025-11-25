import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockKnowledgeService } from '@/services/mockKnowledgeService';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Search, Heart, Bookmark, Eye, Clock, Plus, TrendingUp, Star } from 'lucide-react';
import { toast } from 'sonner';

const KnowledgeCapsules = () => {
  const navigate = useNavigate();
  const [capsules, setCapsules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    sort: 'recent'
  });
  const [likedCapsules, setLikedCapsules] = useState(new Set());
  const [bookmarkedCapsules, setBookmarkedCapsules] = useState(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [capsulesRes, categoriesRes] = await Promise.all([
        mockKnowledgeService.getKnowledgeCapsules(filters),
        mockKnowledgeService.getCategories()
      ]);

      if (capsulesRes.success) setCapsules(capsulesRes.data);
      if (categoriesRes.success) setCategories(categoriesRes.data);
    } catch (error) {
      toast.error('Failed to load knowledge capsules');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const res = await mockKnowledgeService.getKnowledgeCapsules(filters);
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
    try {
      if (likedCapsules.has(capsuleId)) {
        await mockKnowledgeService.unlikeCapsule(capsuleId);
        setLikedCapsules(prev => {
          const newSet = new Set(prev);
          newSet.delete(capsuleId);
          return newSet;
        });
        toast.success('Removed like');
      } else {
        await mockKnowledgeService.likeCapsule(capsuleId);
        setLikedCapsules(prev => new Set(prev).add(capsuleId));
        toast.success('Capsule liked!');
      }
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleBookmark = async (capsuleId) => {
    try {
      await mockKnowledgeService.bookmarkCapsule(capsuleId);
      setBookmarkedCapsules(prev => {
        const newSet = new Set(prev);
        if (newSet.has(capsuleId)) {
          newSet.delete(capsuleId);
          toast.success('Bookmark removed');
        } else {
          newSet.add(capsuleId);
          toast.success('Capsule bookmarked!');
        }
        return newSet;
      });
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
            {canCreateCapsule && (
              <Button onClick={() => navigate('/knowledge/create')} size="lg" data-testid="create-capsule-button">
                <Plus className="mr-2 h-5 w-5" />
                Create Capsule
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8" data-testid="capsules-filters">
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
      </div>
    </MainLayout>
  );
};

export default KnowledgeCapsules;
