import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockKnowledgeService } from '@/services/mockKnowledgeService';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Heart, Bookmark, Eye, Clock, Calendar, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const KnowledgeCapsuleDetail = () => {
  const { capsuleId } = useParams();
  const navigate = useNavigate();
  const [capsule, setCapsule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [bookmarksCount, setBookmarksCount] = useState(0);

  useEffect(() => {
    loadCapsule();
    checkUserInteractions();
  }, [capsuleId]);

  const loadCapsule = async () => {
    try {
      setLoading(true);
      const res = await mockKnowledgeService.getCapsule(capsuleId);
      
      if (res.success && res.data) {
        setCapsule(res.data);
        setLikesCount(res.data.likes_count || 0);
        setBookmarksCount(res.data.bookmarks_count || 0);
        
        // Increment view count
        incrementViewCount();
      } else {
        toast.error('Knowledge capsule not found');
        navigate('/knowledge');
      }
    } catch (error) {
      console.error('Error loading capsule:', error);
      toast.error('Failed to load capsule');
      navigate('/knowledge');
    } finally {
      setLoading(false);
    }
  };

  const checkUserInteractions = () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!currentUser.id) return;

    // Check if user has liked this capsule
    const userLikes = JSON.parse(localStorage.getItem('user_capsule_likes') || '{}');
    setIsLiked(userLikes[currentUser.id]?.includes(capsuleId) || false);

    // Check if user has bookmarked this capsule
    const userBookmarks = JSON.parse(localStorage.getItem('user_capsule_bookmarks') || '{}');
    setIsBookmarked(userBookmarks[currentUser.id]?.includes(capsuleId) || false);
  };

  const incrementViewCount = () => {
    // Increment view count in localStorage (for mockdata)
    const viewedCapsules = JSON.parse(localStorage.getItem('viewed_capsules') || '{}');
    if (!viewedCapsules[capsuleId]) {
      viewedCapsules[capsuleId] = true;
      localStorage.setItem('viewed_capsules', JSON.stringify(viewedCapsules));
    }
  };

  const handleLike = async () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!currentUser.id) {
      toast.error('Please login to like capsules');
      return;
    }

    try {
      if (isLiked) {
        await mockKnowledgeService.unlikeCapsule(capsuleId);
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        
        // Update localStorage
        const userLikes = JSON.parse(localStorage.getItem('user_capsule_likes') || '{}');
        if (userLikes[currentUser.id]) {
          userLikes[currentUser.id] = userLikes[currentUser.id].filter(id => id !== capsuleId);
          localStorage.setItem('user_capsule_likes', JSON.stringify(userLikes));
        }
        
        toast.success('Like removed');
      } else {
        await mockKnowledgeService.likeCapsule(capsuleId);
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        
        // Update localStorage
        const userLikes = JSON.parse(localStorage.getItem('user_capsule_likes') || '{}');
        if (!userLikes[currentUser.id]) userLikes[currentUser.id] = [];
        userLikes[currentUser.id].push(capsuleId);
        localStorage.setItem('user_capsule_likes', JSON.stringify(userLikes));
        
        toast.success('Capsule liked!');
      }
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleBookmark = async () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!currentUser.id) {
      toast.error('Please login to bookmark capsules');
      return;
    }

    try {
      await mockKnowledgeService.bookmarkCapsule(capsuleId);
      
      if (isBookmarked) {
        setIsBookmarked(false);
        setBookmarksCount(prev => Math.max(0, prev - 1));
        
        // Update localStorage
        const userBookmarks = JSON.parse(localStorage.getItem('user_capsule_bookmarks') || '{}');
        if (userBookmarks[currentUser.id]) {
          userBookmarks[currentUser.id] = userBookmarks[currentUser.id].filter(id => id !== capsuleId);
          localStorage.setItem('user_capsule_bookmarks', JSON.stringify(userBookmarks));
        }
        
        toast.success('Bookmark removed');
      } else {
        setIsBookmarked(true);
        setBookmarksCount(prev => prev + 1);
        
        // Update localStorage
        const userBookmarks = JSON.parse(localStorage.getItem('user_capsule_bookmarks') || '{}');
        if (!userBookmarks[currentUser.id]) userBookmarks[currentUser.id] = [];
        userBookmarks[currentUser.id].push(capsuleId);
        localStorage.setItem('user_capsule_bookmarks', JSON.stringify(userBookmarks));
        
        toast.success('Capsule bookmarked!');
      }
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: capsule?.title,
        text: `Check out this knowledge capsule: ${capsule?.title}`,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      technical: 'bg-blue-500',
      career: 'bg-green-500',
      leadership: 'bg-purple-500',
      design: 'bg-pink-500',
      business: 'bg-orange-500',
      entrepreneurship: 'bg-yellow-500',
      life_lessons: 'bg-indigo-500',
      industry_insights: 'bg-teal-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!capsule) {
    return null;
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 max-w-4xl" data-testid="capsule-detail-page">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/knowledge')}
          className="mb-4"
          data-testid="back-to-capsules-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Knowledge Capsules
        </Button>

        {/* Main Content Card */}
        <Card>
          {/* Featured Image */}
          {capsule.featured_image && (
            <div className="relative h-64 md:h-96 overflow-hidden rounded-t-lg">
              <img
                src={capsule.featured_image}
                alt={capsule.title}
                className="w-full h-full object-cover"
              />
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-white text-sm font-semibold ${
                getCategoryColor(capsule.category)
              }`}>
                {capsule.category}
              </div>
            </div>
          )}

          <CardHeader>
            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="capsule-title">
              {capsule.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(capsule.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{capsule.duration_minutes} min read</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{capsule.views_count} views</span>
              </div>
            </div>

            {/* Author Info */}
            {capsule.author && (
              <div className="flex items-center gap-3 py-4 border-y">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={capsule.author.photo_url} alt={capsule.author.name} />
                  <AvatarFallback>{capsule.author.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{capsule.author.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {capsule.author.current_role} at {capsule.author.current_company}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-4">
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
                data-testid="like-button"
              >
                <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
              </Button>
              <Button
                variant={isBookmarked ? "default" : "outline"}
                size="sm"
                onClick={handleBookmark}
                data-testid="bookmark-button"
              >
                <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
                {bookmarksCount}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                data-testid="share-button"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            {/* Tags */}
            {capsule.tags && capsule.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {capsule.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" data-testid={`tag-${index}`}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator className="my-6" />

            {/* Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <div 
                className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed"
                data-testid="capsule-content"
              >
                {capsule.content}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default KnowledgeCapsuleDetail;
