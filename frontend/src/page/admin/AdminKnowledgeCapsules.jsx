import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, MoreVertical, Eye, Trash2, BookOpen, TrendingUp, Heart, Bookmark, Star } from 'lucide-react';
import { knowledgeService } from '@/services';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { toast } from 'sonner';

const AdminKnowledgeCapsules = () => {
  const { user } = useAuth();
  const [capsules, setCapsules] = useState([]);
  const [filteredCapsules, setFilteredCapsules] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedCapsule, setSelectedCapsule] = useState(null);
  const [showCapsuleModal, setShowCapsuleModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCapsules = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await knowledgeService.getCapsules();
      
      if (result.success) {
        // Ensure we always set an array
        const capsulesData = Array.isArray(result.data) ? result.data : [];
        setCapsules(capsulesData);
        setFilteredCapsules(capsulesData);
      } else {
        setError(result.error || 'Failed to load knowledge capsules');
        setCapsules([]);
        setFilteredCapsules([]);
      }
    } catch (error) {
      console.error('Error loading capsules:', error);
      setError('Unable to connect to server. Please try again later.');
      setCapsules([]);
      setFilteredCapsules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCapsules();
  }, []);

  useEffect(() => {
    // Ensure capsules is an array before filtering
    let filtered = Array.isArray(capsules) ? [...capsules] : [];

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.content?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((c) => c.category === categoryFilter);
    }

    setFilteredCapsules(filtered);
  }, [searchQuery, categoryFilter, capsules]);

  const handleViewCapsule = (capsuleId) => {
    const capsulesArray = Array.isArray(capsules) ? capsules : [];
    const capsule = capsulesArray.find((c) => c.id === capsuleId);
    setSelectedCapsule(capsule);
    setShowCapsuleModal(true);
  };

  const handleToggleFeatured = async (capsuleId) => {
    try {
      const capsulesArray = Array.isArray(capsules) ? capsules : [];
      const capsule = capsulesArray.find(c => c.id === capsuleId);
      
      if (!capsule) {
        toast.error('Capsule not found');
        return;
      }
      
      const result = await knowledgeService.updateCapsule(capsuleId, { is_featured: !capsule.is_featured });
      
      if (result.success) {
        setCapsules(
          capsulesArray.map((c) =>
            c.id === capsuleId ? { ...c, is_featured: !c.is_featured } : c
          )
        );
        toast.success('Featured status updated');
      } else {
        toast.error(result.error || 'Failed to update featured status');
      }
    } catch (error) {
      console.error('Error updating featured status:', error);
      toast.error('Unable to update featured status. Please try again.');
    }
  };

  const handleDeleteCapsule = async (capsuleId) => {
    if (window.confirm('Are you sure you want to delete this knowledge capsule?')) {
      try {
        const result = await knowledgeService.deleteCapsule(capsuleId);
        
        if (result.success) {
          const capsulesArray = Array.isArray(capsules) ? capsules : [];
          setCapsules(capsulesArray.filter((c) => c.id !== capsuleId));
          toast.success('Capsule deleted successfully');
        } else {
          toast.error(result.error || 'Failed to delete capsule');
        }
      } catch (error) {
        console.error('Error deleting capsule:', error);
        toast.error('Unable to delete capsule. Please try again.');
      }
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'technical':
        return 'bg-blue-100 text-blue-800';
      case 'career':
        return 'bg-green-100 text-green-800';
      case 'entrepreneurship':
        return 'bg-purple-100 text-purple-800';
      case 'life_lessons':
        return 'bg-orange-100 text-orange-800';
      case 'industry_insights':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Ensure capsules is always an array before using array methods
  const capsulesArray = Array.isArray(capsules) ? capsules : [];
  
  const stats = [
    { label: 'Total Capsules', value: capsulesArray.length, color: 'text-blue-600', icon: BookOpen },
    { label: 'Featured', value: capsulesArray.filter((c) => c.is_featured).length, color: 'text-yellow-600', icon: Star },
    { label: 'Total Views', value: capsulesArray.reduce((sum, c) => sum + (c.views_count || 0), 0), color: 'text-green-600', icon: TrendingUp },
    { label: 'Total Likes', value: capsulesArray.reduce((sum, c) => sum + (c.likes_count || 0), 0), color: 'text-red-600', icon: Heart },
  ];

  const categories = ['all', 'technical', 'career', 'entrepreneurship', 'life_lessons', 'industry_insights', 'other'];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <MainNavbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6">
            <LoadingSpinner message="Loading knowledge capsules..." />
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <MainNavbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6">
            <ErrorMessage message={error} onRetry={loadCapsules} />
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainNavbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-6 text-white">
              <h1 className="text-3xl font-bold">Knowledge Capsules 📖</h1>
              <p className="mt-2 opacity-90">Manage knowledge capsules and educational content</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                          <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
                        </div>
                        <Icon className={`w-8 h-8 ${stat.color} opacity-50`} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Capsules List */}
            <Card>
              <CardHeader>
                <CardTitle>All Knowledge Capsules</CardTitle>
                <CardDescription>View and manage educational content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search by title or content..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="capsule-search-input"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {categories.map((category) => (
                        <Button
                          key={category}
                          variant={categoryFilter === category ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCategoryFilter(category)}
                          className="capitalize"
                          data-testid={`filter-${category}-btn`}
                        >
                          {category.replace('_', ' ')}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredCapsules.map((capsule) => (
                    <div
                      key={capsule.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      data-testid={`capsule-item-${capsule.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{capsule.title}</h3>
                            {capsule.is_featured && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={getCategoryColor(capsule.category)}>
                              {capsule.category.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              by {capsule.author_name || 'Unknown'}
                            </span>
                            <span className="text-sm text-gray-500">• {capsule.duration_minutes} min read</span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{capsule.content.substring(0, 200)}...</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              {capsule.views_count} views
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              {capsule.likes_count} likes
                            </div>
                            <div className="flex items-center gap-1">
                              <Bookmark className="w-4 h-4" />
                              {capsule.bookmarks_count} bookmarks
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" data-testid={`capsule-actions-${capsule.id}`}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewCapsule(capsule.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Full Content
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleFeatured(capsule.id)}>
                              <Star className="mr-2 h-4 w-4" />
                              {capsule.is_featured ? 'Remove from Featured' : 'Mark as Featured'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteCapsule(capsule.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Capsule
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                  {filteredCapsules.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No knowledge capsules found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Footer />

      {/* Capsule Details Modal */}
      <Dialog open={showCapsuleModal} onOpenChange={setShowCapsuleModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCapsule?.title}</DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={selectedCapsule ? getCategoryColor(selectedCapsule.category) : ''}>
                  {selectedCapsule?.category.replace('_', ' ')}
                </Badge>
                <span>By {selectedCapsule?.author_name || 'Unknown'}</span>
                <span>• {selectedCapsule?.duration_minutes} min read</span>
              </div>
            </DialogDescription>
          </DialogHeader>
          {selectedCapsule && (
            <div className="space-y-4">
              {selectedCapsule.featured_image && (
                <img
                  src={selectedCapsule.featured_image}
                  alt={selectedCapsule.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedCapsule.content}</p>
              </div>

              {selectedCapsule.tags && selectedCapsule.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCapsule.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium">{selectedCapsule.views_count}</p>
                      <p className="text-xs text-gray-500">Views</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">{selectedCapsule.likes_count}</p>
                      <p className="text-xs text-gray-500">Likes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">{selectedCapsule.bookmarks_count}</p>
                      <p className="text-xs text-gray-500">Bookmarks</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm">{new Date(selectedCapsule.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCapsuleModal(false)}>
              Close
            </Button>
            {selectedCapsule && (
              <Button
                variant={selectedCapsule.is_featured ? 'outline' : 'default'}
                onClick={() => {
                  handleToggleFeatured(selectedCapsule.id);
                  setShowCapsuleModal(false);
                }}
              >
                <Star className="w-4 h-4 mr-2" />
                {selectedCapsule.is_featured ? 'Remove from Featured' : 'Mark as Featured'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminKnowledgeCapsules;