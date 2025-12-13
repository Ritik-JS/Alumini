import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Search, TrendingUp, Clock, Filter } from 'lucide-react';
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

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl" data-testid="forum-page">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Community Forum</h1>
              <p className="text-gray-600">
                Share knowledge, ask questions, and connect with the community
              </p>
            </div>
            <Button 
              onClick={() => setShowCreateModal(true)}
              data-testid="create-post-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search posts..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              data-testid="search-posts-input"
            />
          </div>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Filter by tag:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.slice(0, 15).map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTag === tag ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleTagClick(tag)}
                >
                  #{tag}
                </Badge>
              ))}
              {selectedTag && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => handleTagClick(selectedTag)}
                >
                  Clear filter
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Sort Tabs */}
        <Tabs value={sortBy} onValueChange={setSortBy} className="mb-6">
          <TabsList>
            <TabsTrigger value="recent" data-testid="recent-tab">
              <Clock className="h-4 w-4 mr-2" />
              Recent
            </TabsTrigger>
            <TabsTrigger value="popular" data-testid="popular-tab">
              <TrendingUp className="h-4 w-4 mr-2" />
              Popular
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="mt-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedTag
                    ? 'Try adjusting your filters'
                    : 'Be the first to start a discussion!'}
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  Create First Post
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="popular" className="mt-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">No popular posts yet</h3>
                <p className="text-gray-600 mb-4">
                  Start engaging with posts to see popular content here
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Manage Posts Link */}
        <div className="mt-8 text-center">
          <Button 
            variant="outline" 
            onClick={() => navigate('/forum/manage')}
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
    </MainLayout>
  );
};

export default Forum;
