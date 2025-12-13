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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Users, Calendar, Star, TrendingUp } from 'lucide-react';
import { adminService } from '@/services';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { toast } from 'sonner';

const AdminMentorship = () => {
  const { user } = useAuth();
  const [mentorships, setMentorships] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [filteredMentorships, setFilteredMentorships] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMentorship, setSelectedMentorship] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all mentorship data
      const [requestsResult, sessionsResult, mentorsResult] = await Promise.all([
        adminService.getMentorshipRequests(),
        adminService.getMentorshipSessions(),
        adminService.getMentors()
      ]);
      
      setMentorships(requestsResult.data || []);
      setFilteredMentorships(requestsResult.data || []);
      
      setSessions(sessionsResult.data || []);
      
      setMentors(mentorsResult.data || []);
    } catch (error) {
      console.error('Error loading mentorship data:', error);
      setError('Unable to connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = mentorships;

    if (searchQuery) {
      filtered = filtered.filter(
        (m) =>
          m.student?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.mentor?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.studentProfile?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.mentorProfile?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((m) => m.status === statusFilter);
    }

    setFilteredMentorships(filtered);
  }, [searchQuery, statusFilter, mentorships]);

  const handleViewDetails = (mentorshipId) => {
    const mentorship = mentorships.find((m) => m.id === mentorshipId);
    setSelectedMentorship(mentorship);
    setShowModal(true);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSessionStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'missed':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = [
    {
      label: 'Total Mentorships',
      value: mentorships.length,
      color: 'text-blue-600',
      icon: Users,
    },
    {
      label: 'Active Mentors',
      value: mentors.filter(m => m.is_available).length,
      color: 'text-green-600',
      icon: Users,
    },
    {
      label: 'Total Sessions',
      value: sessions.length,
      color: 'text-purple-600',
      icon: Calendar,
    },
    {
      label: 'Avg Rating',
      value: sessions.length > 0 ? (sessions.filter(s => s.rating).reduce((sum, s) => sum + s.rating, 0) / sessions.filter(s => s.rating).length).toFixed(1) : '0.0',
      color: 'text-yellow-600',
      icon: Star,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <MainNavbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6">
            <LoadingSpinner message="Loading mentorship data..." />
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
            <ErrorMessage message={error} onRetry={loadData} />
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
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
              <h1 className="text-3xl font-bold">Mentorship Management 🤝</h1>
              <p className="mt-2 opacity-90">Manage mentorships and sessions</p>
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

            <Tabs defaultValue="mentorships" className="w-full">
              <TabsList>
                <TabsTrigger value="mentorships" data-testid="tab-mentorships">
                  Mentorship Requests
                </TabsTrigger>
                <TabsTrigger value="sessions" data-testid="tab-sessions">
                  All Sessions
                </TabsTrigger>
                <TabsTrigger value="mentors" data-testid="tab-mentors">
                  Active Mentors
                </TabsTrigger>
              </TabsList>

              {/* Mentorships Tab */}
              <TabsContent value="mentorships" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>All Mentorship Requests</CardTitle>
                    <CardDescription>View and manage mentorship connections</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 mb-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            placeholder="Search by student or mentor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                            data-testid="mentorship-search-input"
                          />
                        </div>
                        <div className="flex gap-2">
                          {['all', 'pending', 'accepted', 'rejected'].map((status) => (
                            <Button
                              key={status}
                              variant={statusFilter === status ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setStatusFilter(status)}
                              className="capitalize"
                              data-testid={`filter-${status}-btn`}
                            >
                              {status}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {filteredMentorships.map((mentorship) => (
                        <div
                          key={mentorship.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          data-testid={`mentorship-item-${mentorship.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex gap-4 flex-1">
                              <div className="flex items-center gap-3">
                                <img
                                  src={
                                    mentorship.studentProfile?.photo_url ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentorship.student?.email}`
                                  }
                                  alt="Student"
                                  className="w-12 h-12 rounded-full"
                                />
                                <div>
                                  <p className="font-medium text-sm">
                                    {mentorship.studentProfile?.name || mentorship.student?.email}
                                  </p>
                                  <p className="text-xs text-gray-500">Student</p>
                                </div>
                              </div>
                              <div className="text-gray-400 self-center">→</div>
                              <div className="flex items-center gap-3">
                                <img
                                  src={
                                    mentorship.mentorProfile?.photo_url ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentorship.mentor?.email}`
                                  }
                                  alt="Mentor"
                                  className="w-12 h-12 rounded-full"
                                />
                                <div>
                                  <p className="font-medium text-sm">
                                    {mentorship.mentorProfile?.name || mentorship.mentor?.email}
                                  </p>
                                  <p className="text-xs text-gray-500">Mentor</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <Badge className={`mb-2 ${getStatusBadgeColor(mentorship.status)}`}>
                                  {mentorship.status}
                                </Badge>
                                <p className="text-xs text-gray-500">
                                  {mentorship.sessions?.length || 0} sessions
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDetails(mentorship.id)}
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {filteredMentorships.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No mentorships found</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Sessions Tab */}
              <TabsContent value="sessions" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>All Mentorship Sessions</CardTitle>
                    <CardDescription>View all scheduled and completed sessions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b">
                          <tr className="text-left">
                            <th className="pb-3 font-medium text-gray-700">Date</th>
                            <th className="pb-3 font-medium text-gray-700">Duration</th>
                            <th className="pb-3 font-medium text-gray-700">Status</th>
                            <th className="pb-3 font-medium text-gray-700">Rating</th>
                            <th className="pb-3 font-medium text-gray-700">Agenda</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions.map((session) => (
                            <tr key={session.id} className="border-b hover:bg-gray-50">
                              <td className="py-4 text-sm">
                                {new Date(session.scheduled_date).toLocaleString()}
                              </td>
                              <td className="py-4 text-sm">{session.duration} min</td>
                              <td className="py-4">
                                <Badge className={getSessionStatusColor(session.status)}>
                                  {session.status}
                                </Badge>
                              </td>
                              <td className="py-4">
                                {session.rating ? (
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm font-medium">{session.rating}</span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">N/A</span>
                                )}
                              </td>
                              <td className="py-4 text-sm text-gray-600">
                                {session.agenda || 'No agenda'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {sessions.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No sessions found</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mentors Tab */}
              <TabsContent value="mentors" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Mentors</CardTitle>
                    <CardDescription>All mentors on the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mentors.map((mentor) => (
                        <div
                          key={mentor.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <img
                                src={
                                  mentor.photo_url ||
                                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.email}`
                                }
                                alt={mentor.name}
                                className="w-14 h-14 rounded-full"
                              />
                              <div>
                                <h3 className="font-semibold">{mentor.name || mentor.email}</h3>
                                <p className="text-sm text-gray-600">{mentor.current_role || 'Mentor'}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline">
                                    {mentor.is_available ? 'Available' : 'Unavailable'}
                                  </Badge>
                                  {mentor.rating && (
                                    <div className="flex items-center gap-1 text-sm">
                                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                      <span className="font-medium">
                                        {(typeof mentor.rating === 'number' ? mentor.rating : parseFloat(mentor.rating) || 0).toFixed(1)}
                                      </span>
                                      {mentor.total_reviews && (
                                        <span className="text-gray-500">({mentor.total_reviews})</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              {mentor.current_mentees_count !== undefined && mentor.max_mentees && (
                                <p className="text-sm font-medium">
                                  {mentor.current_mentees_count} / {mentor.max_mentees} mentees
                                </p>
                              )}
                              {mentor.total_sessions !== undefined && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {mentor.total_sessions} sessions completed
                                </p>
                              )}
                            </div>
                          </div>
                          {mentor.expertise_areas && mentor.expertise_areas.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {mentor.expertise_areas.map((area, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {area}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {mentors.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No mentors found</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <Footer />

      {/* Mentorship Details Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mentorship Details</DialogTitle>
            <DialogDescription>Complete mentorship information</DialogDescription>
          </DialogHeader>
          {selectedMentorship && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <img
                    src={
                      selectedMentorship.studentProfile?.photo_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedMentorship.student?.email}`
                    }
                    alt="Student"
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-medium">
                      {selectedMentorship.studentProfile?.name || selectedMentorship.student?.email}
                    </p>
                    <p className="text-sm text-gray-500">Student</p>
                  </div>
                </div>
                <div className="text-2xl text-gray-400">→</div>
                <div className="flex items-center gap-4">
                  <img
                    src={
                      selectedMentorship.mentorProfile?.photo_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedMentorship.mentor?.email}`
                    }
                    alt="Mentor"
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-medium">
                      {selectedMentorship.mentorProfile?.name || selectedMentorship.mentor?.email}
                    </p>
                    <p className="text-sm text-gray-500">Mentor</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <Badge className={`mt-1 ${getStatusBadgeColor(selectedMentorship.status)}`}>
                  {selectedMentorship.status}
                </Badge>
              </div>

              {selectedMentorship.request_message && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Request Message</p>
                  <p className="text-sm mt-1 text-gray-700">{selectedMentorship.request_message}</p>
                </div>
              )}

              {selectedMentorship.goals && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Goals</p>
                  <p className="text-sm mt-1 text-gray-700">{selectedMentorship.goals}</p>
                </div>
              )}

              {selectedMentorship.preferred_topics && selectedMentorship.preferred_topics.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Preferred Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMentorship.preferred_topics.map((topic, idx) => (
                      <Badge key={idx} variant="outline">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedMentorship.sessions && selectedMentorship.sessions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Sessions ({selectedMentorship.sessions.length})</p>
                  <div className="space-y-2">
                    {selectedMentorship.sessions.map((session) => (
                      <div key={session.id} className="border rounded p-3 text-sm">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium">{new Date(session.scheduled_date).toLocaleString()}</p>
                          <Badge className={getSessionStatusColor(session.status)}>
                            {session.status}
                          </Badge>
                        </div>
                        {session.agenda && <p className="text-gray-600 mb-1">{session.agenda}</p>}
                        {session.rating && (
                          <div className="flex items-center gap-1 mt-2">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{session.rating}/5</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-xs text-gray-500">
                  Requested on {new Date(selectedMentorship.requested_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMentorship;