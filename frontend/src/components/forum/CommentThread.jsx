import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Heart, Reply, Trash2, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { forumService } from '@/services';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const CommentItem = ({ comment, onReply, onDelete, depth = 0 }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [liked, setLiked] = useState(comment.user_has_liked || false);
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAuthor = currentUser.id === comment.author_id;

  const handleLike = async () => {
    try {
      const response = await forumService.toggleCommentLike(comment.id);
      if (response.success) {
        setLiked(response.data.liked);
        setLikesCount(response.data.likes_count);
      }
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }

    setSubmitting(true);
    try {
      await onReply(comment.id, replyContent);
      setReplyContent('');
      setShowReplyForm(false);
      toast.success('Reply posted');
    } catch (error) {
      toast.error('Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(comment.id);
      toast.success('Comment deleted');
      setShowDeleteDialog(false);
    } catch (error) {
      toast.error('Failed to delete comment');
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

  const authorName = comment.author?.profile?.name || comment.author?.email || 'Anonymous';
  const authorRole = comment.author?.role || 'user';
  const authorPhoto = comment.author?.profile?.photo_url;

  return (
    <div className={`${depth > 0 ? 'ml-8 pl-4 border-l-2 border-gray-200' : ''}`}>
      <div className="py-4" data-testid={`comment-${comment.id}`}>
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={authorPhoto} alt={authorName} />
            <AvatarFallback className="text-xs">{getInitials(authorName)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Author Info */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{authorName}</span>
              <Badge variant="outline" className="text-xs">
                {authorRole}
              </Badge>
              <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
            </div>

            {/* Comment Content */}
            <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
              {comment.content}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={handleLike}
              >
                <Heart className={`h-3 w-3 ${liked ? 'fill-red-600 text-red-600' : ''}`} />
                {likesCount > 0 && <span>{likesCount}</span>}
              </Button>

              {depth < 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  data-testid={`reply-button-${comment.id}`}
                >
                  <Reply className="h-3 w-3" />
                  Reply
                </Button>
              )}

              {isAuthor && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-red-600 hover:text-red-700"
                  onClick={() => setShowDeleteDialog(true)}
                  data-testid={`delete-comment-${comment.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </Button>
              )}
            </div>

            {/* Reply Form */}
            {showReplyForm && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Write your reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[80px]"
                  data-testid={`reply-textarea-${comment.id}`}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleReplySubmit}
                    disabled={submitting || !replyContent.trim()}
                    data-testid={`submit-reply-${comment.id}`}
                  >
                    Post Reply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowReplyForm(false);
                      setReplyContent('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onReply={onReply}
                onDelete={onDelete}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const CommentThread = ({ comments, onReply, onDelete }) => {
  if (!comments || comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {comments.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onReply={onReply}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default CommentThread;
