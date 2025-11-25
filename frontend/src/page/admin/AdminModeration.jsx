import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, XCircle, MessageSquare, Briefcase, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const AdminModeration = () => {
  const { user } = useAuth();
  const [flaggedContent, setFlaggedContent] = useState({
    posts: [
      {
        id: 1,
        type: 'forum_post',
        title: 'Inappropriate job posting',
        content: 'This is a sample flagged forum post that needs review...',
        author: 'john.doe@alumni.edu',
        reportedBy: 'jane.smith@alumni.edu',
        reason: 'Spam',
        timestamp: new Date().toISOString(),
      },
      {
        id: 2,
        type: 'forum_post',
        title: 'Offensive language in discussion',
        content: 'Sample content with reported offensive language...',
        author: 'user@example.com',
        reportedBy: 'moderator@alumni.edu',
        reason: 'Inappropriate content',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    jobs: [
      {
        id: 3,
        type: 'job_posting',
        title: 'Suspicious job offer',
        content: 'Work from home, earn $10000/month...',
        author: 'recruiter@company.com',
        reportedBy: 'student@alumni.edu',
        reason: 'Suspicious/Scam',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
      },
    ],
    comments: [],
  });

  const handleApprove = (contentType, contentId) => {
    setFlaggedContent((prev) => ({
      ...prev,
      [contentType]: prev[contentType].filter((item) => item.id !== contentId),
    }));
    toast.success('Content approved and flag removed');
  };

  const handleRemove = (contentType, contentId) => {
    setFlaggedContent((prev) => ({
      ...prev,
      [contentType]: prev[contentType].filter((item) => item.id !== contentId),
    }));
    toast.success('Content removed successfully');
  };

  const handleWarn = (contentType, contentId) => {
    toast.success('Warning sent to user');
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
    flaggedContent.posts.length + flaggedContent.jobs.length + flaggedContent.comments.length;

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
              data-testid={`approve-btn-${item.id}`}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
              onClick={() => handleWarn(contentType, item.id)}
              data-testid={`warn-btn-${item.id}`}
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              Warn Author
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
              onClick={() => handleRemove(contentType, item.id)}
              data-testid={`remove-btn-${item.id}`}
            >
              <XCircle className="w-4 h-4 mr-1" />
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

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">{totalFlagged}</div>
                  <p className="text-sm text-gray-600 mt-1">Total Flagged</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-orange-600">{flaggedContent.posts.length}</div>
                  <p className="text-sm text-gray-600 mt-1">Forum Posts</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-purple-600">{flaggedContent.jobs.length}</div>
                  <p className="text-sm text-gray-600 mt-1">Job Postings</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">{flaggedContent.comments.length}</div>
                  <p className="text-sm text-gray-600 mt-1">Comments</p>
                </CardContent>
              </Card>
            </div>

            {/* Flagged Content */}
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
                      Posts ({flaggedContent.posts.length})
                    </TabsTrigger>
                    <TabsTrigger value="jobs" data-testid="tab-jobs">
                      Jobs ({flaggedContent.jobs.length})
                    </TabsTrigger>
                    <TabsTrigger value="comments" data-testid="tab-comments">
                      Comments ({flaggedContent.comments.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4 mt-4">
                    {[...flaggedContent.posts, ...flaggedContent.jobs, ...flaggedContent.comments].map(
                      (item) => {
                        const contentType = item.type === 'forum_post' ? 'posts' : 'jobs';
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
                    {flaggedContent.posts.map((item) => renderContentCard(item, 'posts'))}
                    {flaggedContent.posts.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <p>No flagged posts</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="jobs" className="space-y-4 mt-4">
                    {flaggedContent.jobs.map((item) => renderContentCard(item, 'jobs'))}
                    {flaggedContent.jobs.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <p>No flagged jobs</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="comments" className="space-y-4 mt-4">
                    {flaggedContent.comments.map((item) => renderContentCard(item, 'comments'))}
                    {flaggedContent.comments.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <p>No flagged comments</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default AdminModeration;