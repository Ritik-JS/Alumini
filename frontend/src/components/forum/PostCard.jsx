import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Pin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { forumService } from '@/services';
import { toast } from 'sonner';

const PostCard = ({ post, showFullContent = false }) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.user_has_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);

  const handleLike = async (e) => {
    e.stopPropagation();
    
    try {
      const response = await forumService.togglePostLike(post.id);
      if (response.success) {
        setLiked(response.data.liked);
        setLikesCount(response.data.likes_count);
      }
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  };

  const authorName = post.author?.profile?.name || post.author?.email || 'Anonymous';
  const authorRole = post.author?.role || 'user';
  const authorPhoto = post.author?.profile?.photo_url;

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/forum/posts/${post.id}`)}
      data-testid={`post-card-${post.id}`}
    >
      <CardContent className="p-4">
        {/* Author Info & Timestamp */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={authorPhoto} alt={authorName} />
            <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm truncate">{authorName}</span>
              <Badge variant="outline" className="text-xs">
                {authorRole}
              </Badge>
              {post.is_pinned && (
                <Pin className="h-3 w-3 text-blue-600" />
              )}
            </div>
            <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
          </div>
        </div>

        {/* Post Title */}
        {post.title && (
          <h3 className="font-semibold text-lg mb-2">
            {post.title}
          </h3>
        )}

        {/* Post Content */}
        <div className="text-gray-700 mb-3">
          {showFullContent ? (
            <div className="whitespace-pre-wrap">{post.content}</div>
          ) : (
            <p className="line-clamp-3">{post.content}</p>
          )}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs cursor-pointer hover:bg-gray-200"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/forum?tag=${tag}`);
                }}
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 hover:text-red-600"
            onClick={handleLike}
            data-testid={`like-post-${post.id}`}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-red-600 text-red-600' : ''}`} />
            <span>{likesCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/forum/posts/${post.id}`);
            }}
            data-testid={`comment-post-${post.id}`}
          >
            <MessageCircle className="h-4 w-4" />
            <span>{post.comments_count || 0}</span>
          </Button>

          <span className="ml-auto text-xs">
            {post.views_count || 0} views
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard;
