import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, XCircle, MessageSquare, Briefcase, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services';

const AdminModeration = () => {
  const { user } = useAuth();
  const [flaggedContent, setFlaggedContent] = useState({
    posts: [],
    jobs: [],
    comments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadFlaggedContent();
  }, []);

  const loadFlaggedContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getFlaggedContent();
      if (response.success) {
        // Ensure data structure is always correct with default empty arrays
        const data = response.data || {};
        setFlaggedContent({
          posts: Array.isArray(data.posts) ? data.posts : [],
          jobs: Array.isArray(data.jobs) ? data.jobs : [],
          comments: Array.isArray(data.comments) ? data.comments : []
        });
      } else {
        setError(response.message || 'Failed to load flagged content');
        toast.error(response.message || 'Failed to load flagged content');
        // Set empty structure on error
        setFlaggedContent({ posts: [], jobs: [], comments: [] });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load flagged content';
      setError(errorMsg);
      toast.error(errorMsg);
      // Set empty structure on error
      setFlaggedContent({ posts: [], jobs: [], comments: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (contentType, contentId) => {
    setActionLoading(`approve-${contentId}`);
    try {
      const response = await adminService.approveContent(contentId, contentType);
      if (response.success) {
        setFlaggedContent((prev) => ({
          ...prev,
          [contentType]: prev[contentType].filter((item) => item.id !== contentId),
        }));
        toast.success('Content approved and flag removed');
      } else {
        toast.error(response.message || 'Failed to approve content');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve content');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (contentType, contentId) => {
    setActionLoading(`remove-${contentId}`);
    try {
      const response = await adminService.removeContent(contentId, contentType);
      if (response.success) {
        setFlaggedContent((prev) => ({
          ...prev,
          [contentType]: prev[contentType].filter((item) => item.id !== contentId),
        }));
        toast.success('Content removed successfully');
      } else {
        toast.error(response.message || 'Failed to remove content');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove content');
    } finally {
      setActionLoading(null);
    }
  };

  const handleWarn = async (contentType, contentId) => {
    setActionLoading(`warn-${contentId}`);
    try {
      const response = await adminService.warnAuthor(contentId, contentType, 'Policy violation');
      if (response.success) {
        toast.success('Warning sent to user');
      } else {
        toast.error(response.message || 'Failed to send warning');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send warning');
    } finally {
      setActionLoading(null);
    }
  };

  const getContentIcon = (type) => {
    switch (type) {
      case 'forum_post':
        return <MessageSquare className="w-5 h-5" />;
      case 'job_posting':
        return <Briefcase className="w-5 h-5" />;
      case 'event':
        return <Calendar className="w-5 h-5" />;
      default:
        return <MessageSquare className="w-5 h-5" />;
    }
  };

  const getReasonBadgeColor = (reason) => {
    switch (reason.toLowerCase()) {
      case 'spam':
        return 'bg-orange-100 text-orange-800';
      case 'inappropriate content':
        return 'bg-red-100 text-red-800';
      case 'suspicious/scam':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalFlagged =
    (flaggedContent.posts?.length || 0) + (flaggedContent.jobs?.length || 0) + (flaggedContent.comments?.length || 0);

  const renderContentCard = (item, contentType) => (
    <div
      key={item.id}
      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
      data-testid={`moderation-item-${item.id}`}
    >
      <div className="flex items-start gap-4">
        <div className="p-2 bg-red-100 rounded-lg text-red-600">{getContentIcon(item.type)}</div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <p className="text-sm text-gray-600 mt-1">By: {item.author}</p>
            </div>
            <Badge className={getReasonBadgeColor(item.reason)}>{item.reason}</Badge>
          </div>
          <p className="text-sm text-gray-700 mt-2 line-clamp-2">{item.content}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span>Reported by: {item.reportedBy}</span>
            <span>•</span>
            <span>{new Date(item.timestamp).toLocaleDateString()}</span>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 border-green-600 hover:bg-green-50"
              onClick={() => handleApprove(contentType, item.id)}
              disabled={actionLoading === `approve-${item.id}`}
              data-testid={`approve-btn-${item.id}`}
            >
              {actionLoading === `approve-${item.id}` ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-1" />
              )}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
              onClick={() => handleWarn(contentType, item.id)}
              disabled={actionLoading === `warn-${item.id}`}
              data-testid={`warn-btn-${item.id}`}
            >
              {actionLoading === `warn-${item.id}` ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <AlertTriangle className="w-4 h-4 mr-1" />
              )}
              Warn Author
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
              onClick={() => handleRemove(contentType, item.id)}
              disabled={actionLoading === `remove-${item.id}`}
              data-testid={`remove-btn-${item.id}`}
            >
              {actionLoading === `remove-${item.id}` ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-1" />
              )}
              Remove
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainNavbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-6 text-white">
              <h1 className="text-3xl font-bold">Content Moderation 🛡️</h1>
              <p className="mt-2 opacity-90">Review and moderate flagged content on the platform</p>
            </div>

            {/* Loading State */}
            {loading && (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                    <p className="text-gray-600">Loading flagged content...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {error && !loading && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-6 h-6 text-red-600" />
                      <div>
                        <p className="font-medium text-red-900">Failed to load flagged content</p>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                      </div>
                    </div>
                    <Button onClick={loadFlaggedContent} variant="outline" size="sm">
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            {!loading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-600">{totalFlagged}</div>
                    <p className="text-sm text-gray-600 mt-1">Total Flagged</p>
                  </CardContent>
                </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-orange-600">{flaggedContent.posts?.length || 0}</div>
                  <p className="text-sm text-gray-600 mt-1">Forum Posts</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-purple-600">{flaggedContent.jobs?.length || 0}</div>
                  <p className="text-sm text-gray-600 mt-1">Job Postings</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">{flaggedContent.comments?.length || 0}</div>
                  <p className="text-sm text-gray-600 mt-1">Comments</p>
                </CardContent>
              </Card>
              </div>
            )}

            {/* Flagged Content */}
            {!loading && !error && (
              <Card>
              <CardHeader>
                <CardTitle>Flagged Content</CardTitle>
                <CardDescription>Review reported content and take appropriate action</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList>
                    <TabsTrigger value="all" data-testid="tab-all">
                      All ({totalFlagged})
                    </TabsTrigger>
                    <TabsTrigger value="posts" data-testid="tab-posts">
                      Posts ({flaggedContent.posts?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="jobs" data-testid="tab-jobs">
                      Jobs ({flaggedContent.jobs?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="comments" data-testid="tab-comments">
                      Comments ({flaggedContent.comments?.length || 0})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4 mt-4">
                    {[...(flaggedContent.posts || []), ...(flaggedContent.jobs || []), ...(flaggedContent.comments || [])].map(
                      (item) => {
                        const contentType = item.type === 'forum_post' ? 'posts' : item.type === 'comment' ? 'comments' : 'jobs';
                        return renderContentCard(item, contentType);
                      }
                    )}
                    {totalFlagged === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">All clear!</p>
                        <p className="text-sm mt-1">No flagged content to review</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="posts" className="space-y-4 mt-4">
                    {(flaggedContent.posts || []).map((item) => renderContentCard(item, 'posts'))}
                    {(flaggedContent.posts?.length || 0) === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <p>No flagged posts</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="jobs" className="space-y-4 mt-4">
                    {(flaggedContent.jobs || []).map((item) => renderContentCard(item, 'jobs'))}
                    {(flaggedContent.jobs?.length || 0) === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <p>No flagged jobs</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="comments" className="space-y-4 mt-4">
                    {(flaggedContent.comments || []).map((item) => renderContentCard(item, 'comments'))}
                    {(flaggedContent.comments?.length || 0) === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <p>No flagged comments</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default AdminModeration;