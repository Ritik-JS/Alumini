import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Search, TrendingUp, Clock, Filter, Sparkles, MessageSquare } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import PostCard from '@/components/forum/PostCard';
import CreatePostModal from '@/components/forum/CreatePostModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { forumService } from '@/services';
import { toast } from 'sonner';

const Forum = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
  const [allTags, setAllTags] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadPosts();
    loadTags();
  }, [sortBy, selectedTag, searchTerm]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const filters = {
        sort: sortBy,
        search: searchTerm
      };
      
      if (selectedTag) {
        filters.tags = selectedTag;
      }

      const response = await forumService.getPosts(filters);
      
      if (response.success) {
        setPosts(response.data);
      } else {
        toast.error('Failed to load posts');
      }
    } catch (error) {
      toast.error('Error loading posts');
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const response = await forumService.getAllTags();
      if (response.success) {
        setAllTags(response.data);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleTagClick = (tag) => {
    if (selectedTag === tag) {
      setSelectedTag('');
      searchParams.delete('tag');
    } else {
      setSelectedTag(tag);
      searchParams.set('tag', tag);
    }
    setSearchParams(searchParams);
  };

  const handlePostCreated = () => {
    loadPosts();
  };

  const tagColors = [
    'from-violet-500 to-purple-500',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500',
    'from-pink-500 to-rose-500',
    'from-indigo-500 to-blue-500',
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
        <div className="container mx-auto px-4 py-10 max-w-6xl" data-testid="forum-page">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-200 rounded-full mb-4">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">Share Knowledge & Connect</span>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <MessageSquare className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Community Forum</h1>
                </div>
                <p className="text-lg text-gray-600">
                  Share knowledge, ask questions, and connect with the community
                </p>
              </div>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg shadow-orange-500/50 h-12 px-6"
                data-testid="create-post-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search posts..."
                className="pl-12 h-12 border-2 border-gray-200 focus:border-orange-400 rounded-xl shadow-sm bg-white"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                data-testid="search-posts-input"
              />
            </div>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="mb-8 p-6 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-gray-600" />
                <span className="text-base font-semibold text-gray-900">Filter by tag:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 15).map((tag, index) => {
                  const gradient = tagColors[index % tagColors.length];
                  return (
                    <Badge
                      key={tag}
                      variant={selectedTag === tag ? 'default' : 'outline'}
                      className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                        selectedTag === tag
                          ? `bg-gradient-to-r ${gradient} text-white border-0 shadow-md`
                          : 'border-2 border-gray-300 hover:border-orange-400 text-gray-700'
                      }`}
                      onClick={() => handleTagClick(tag)}
                    >
                      #{tag}
                    </Badge>
                  );
                })}
                {selectedTag && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    onClick={() => handleTagClick(selectedTag)}
                  >
                    Clear filter
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Sort Tabs */}
          <Tabs value={sortBy} onValueChange={setSortBy} className="mb-8">
            <TabsList className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 p-1 rounded-xl shadow-sm">
              <TabsTrigger value="recent" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-amber-600 data-[state=active]:text-white" data-testid="recent-tab">
                <Clock className="h-4 w-4 mr-2" />
                Recent
              </TabsTrigger>
              <TabsTrigger value="popular" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-amber-600 data-[state=active]:text-white" data-testid="popular-tab">
                <TrendingUp className="h-4 w-4 mr-2" />
                Popular
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="mt-8">
              {loading ? (
                <div className="space-y-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.map(post => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border-2 border-orange-200">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm || selectedTag
                      ? 'Try adjusting your filters'
                      : 'Be the first to start a discussion!'}
                  </p>
                  <Button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700">
                    Create First Post
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="popular" className="mt-8">
              {loading ? (
                <div className="space-y-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.map(post => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border-2 border-orange-200">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No popular posts yet</h3>
                  <p className="text-gray-600 mb-6">
                    Start engaging with posts to see popular content here
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Manage Posts Link */}
          <div className="mt-10 text-center">
            <Button 
              variant="outline" 
              onClick={() => navigate('/forum/manage')}
              className="h-12 px-8 border-2 border-gray-300 hover:border-orange-400 rounded-xl"
              data-testid="manage-posts-button"
            >
              Manage My Posts
            </Button>
          </div>

          {/* Create Post Modal */}
          <CreatePostModal
            open={showCreateModal}
            onOpenChange={setShowCreateModal}
            onPostCreated={handlePostCreated}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default Forum;