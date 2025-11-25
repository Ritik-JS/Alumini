import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockProfileService } from '@/services/mockProfileService';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import mockData from '@/mockdata.json';
import { toast } from 'sonner';

const AdminVerifications = () => {
  const { user } = useAuth();
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVerifications = async () => {
      try {
        const verifications = await mockProfileService.getPendingVerifications();
        setPendingVerifications(verifications);
      } catch (error) {
        console.error('Error loading verifications:', error);
        toast.error('Failed to load verifications');
      } finally {
        setLoading(false);
      }
    };

    loadVerifications();
  }, []);

  const handleApprove = async (profileId) => {
    try {
      // In real app, this would call the API
      setPendingVerifications(pendingVerifications.filter((p) => p.id !== profileId));
      toast.success('Profile verified successfully');
    } catch (error) {
      console.error('Error approving profile:', error);
      toast.error('Failed to approve profile');
    }
  };

  const handleReject = async (profileId) => {
    try {
      // In real app, this would call the API
      setPendingVerifications(pendingVerifications.filter((p) => p.id !== profileId));
      toast.success('Profile rejected');
    } catch (error) {
      console.error('Error rejecting profile:', error);
      toast.error('Failed to reject profile');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainNavbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-6 text-white">
              <h1 className="text-3xl font-bold">Profile Verifications ✅</h1>
              <p className="mt-2 opacity-90">
                Review and approve alumni profile verification requests
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">{pendingVerifications.length}</div>
                      <p className="text-sm text-gray-600 mt-1">Pending</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-600">0</div>
                      <p className="text-sm text-gray-600 mt-1">Approved Today</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-red-600">0</div>
                      <p className="text-sm text-gray-600 mt-1">Rejected Today</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Verifications */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Verifications</CardTitle>
                <CardDescription>Review alumni profiles waiting for verification</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingVerifications.length > 0 ? (
                  <div className="space-y-4">
                    {pendingVerifications.map((profile) => {
                      const profileUser = mockData.users?.find((u) => u.id === profile.user_id);
                      return (
                        <div
                          key={profile.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          data-testid={`verification-item-${profile.id}`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <img
                                src={
                                  profile.photo_url ||
                                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser?.email}`
                                }
                                alt={profile.name}
                                className="w-16 h-16 rounded-full object-cover"
                              />
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{profile.name}</h3>
                                <p className="text-sm text-gray-600">{profileUser?.email}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {profile.graduation_year && (
                                    <Badge variant="outline">Class of {profile.graduation_year}</Badge>
                                  )}
                                  {profile.department && (
                                    <Badge variant="outline">{profile.department}</Badge>
                                  )}
                                  {profile.current_company && (
                                    <Badge variant="outline" className="bg-blue-50">
                                      {profile.current_company}
                                    </Badge>
                                  )}
                                </div>
                                {profile.bio && (
                                  <p className="text-sm text-gray-700 mt-2 line-clamp-2">{profile.bio}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => handleApprove(profile.id)}
                                data-testid={`approve-btn-${profile.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => handleReject(profile.id)}
                                data-testid={`reject-btn-${profile.id}`}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">All caught up!</p>
                    <p className="text-sm mt-1">No pending verifications at the moment</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default AdminVerifications;