import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Award, Plus, Edit, Trash2, Star } from 'lucide-react';
import { adminService } from '@/services';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { toast } from 'sonner';

const AdminBadges = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rarity: 'common',
    points: 10,
    requirements: '{}',
  });

  const loadBadges = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminService.getAllBadges();
      setBadges(result.data || []);
    } catch (error) {
      console.error('Error loading badges:', error);
      setError('Unable to connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBadges();
  }, []);

  const handleCreateBadge = async () => {
    if (!formData.name || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const badgeData = {
        ...formData,
        points: parseInt(formData.points),
        requirements: JSON.parse(formData.requirements || '{}'),
      };

      await adminService.createBadge(badgeData);
      toast.success('Badge created successfully');
      setShowCreateModal(false);
      resetForm();
      loadBadges();
    } catch (error) {
      console.error('Error creating badge:', error);
      toast.error('Unable to create badge. Please try again.');
    }
  };

  const handleEditBadge = (badge) => {
    setEditingBadge(badge);
    setFormData({
      name: badge.name,
      description: badge.description,
      rarity: badge.rarity,
      points: badge.points,
      requirements: JSON.stringify(badge.requirements, null, 2),
    });
    setShowCreateModal(true);
  };

  const handleUpdateBadge = async () => {
    if (!formData.name || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const badgeData = {
        ...formData,
        points: parseInt(formData.points),
        requirements: JSON.parse(formData.requirements || '{}'),
      };

      await adminService.updateBadge(editingBadge.id, badgeData);
      toast.success('Badge updated successfully');
      setShowCreateModal(false);
      setEditingBadge(null);
      resetForm();
      loadBadges();
    } catch (error) {
      console.error('Error updating badge:', error);
      toast.error('Unable to update badge. Please try again.');
    }
  };

  const handleDeleteBadge = async (badgeId) => {
    if (window.confirm('Are you sure you want to delete this badge?')) {
      try {
        await adminService.deleteBadge(badgeId);
        setBadges(badges.filter((b) => b.id !== badgeId));
        toast.success('Badge deleted successfully');
      } catch (error) {
        console.error('Error deleting badge:', error);
        toast.error('Unable to delete badge. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rarity: 'common',
      points: 10,
      requirements: '{}',
    });
    setEditingBadge(null);
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-100 text-gray-800';
      case 'rare':
        return 'bg-blue-100 text-blue-800';
      case 'epic':
        return 'bg-purple-100 text-purple-800';
      case 'legendary':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = [
    { label: 'Total Badges', value: badges.length, color: 'text-blue-600', icon: Award },
    { label: 'Common', value: badges.filter((b) => b.rarity === 'common').length, color: 'text-gray-600', icon: Star },
    { label: 'Rare', value: badges.filter((b) => b.rarity === 'rare').length, color: 'text-blue-600', icon: Star },
    { label: 'Epic+', value: badges.filter((b) => ['epic', 'legendary'].includes(b.rarity)).length, color: 'text-purple-600', icon: Star },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <MainNavbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6">
            <LoadingSpinner message="Loading badges..." />
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
            <ErrorMessage message={error} onRetry={loadBadges} />
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
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-6 text-white">
              <h1 className="text-3xl font-bold">Badge Management 🏆</h1>
              <p className="mt-2 opacity-90">Create and manage achievement badges</p>
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

            {/* Badges List */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>All Badges</CardTitle>
                    <CardDescription>Manage achievement badges for users</CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      resetForm();
                      setShowCreateModal(true);
                    }}
                    data-testid="create-badge-btn"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Badge
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      data-testid={`badge-card-${badge.id}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                            <Award className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{badge.name}</h3>
                            <Badge className={`text-xs ${getRarityColor(badge.rarity)}`}>
                              {badge.rarity}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditBadge(badge)}
                            data-testid={`edit-badge-${badge.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteBadge(badge.id)}
                            className="text-red-600"
                            data-testid={`delete-badge-${badge.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Points: {badge.points}</span>
                        <span className="text-gray-500">Earned by: {badge.earnedCount}</span>
                      </div>
                    </div>
                  ))}
                  {badges.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No badges created yet</p>
                      <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Badge
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Footer />

      {/* Create/Edit Badge Modal */}
      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingBadge ? 'Edit Badge' : 'Create New Badge'}</DialogTitle>
            <DialogDescription>
              {editingBadge ? 'Update badge information' : 'Create a new achievement badge'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Badge Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Active Contributor"
                data-testid="badge-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What does this badge represent?"
                rows={3}
                data-testid="badge-description-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rarity">Rarity</Label>
                <Select value={formData.rarity} onValueChange={(value) => setFormData({ ...formData, rarity: value })}>
                  <SelectTrigger data-testid="badge-rarity-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">Common</SelectItem>
                    <SelectItem value="rare">Rare</SelectItem>
                    <SelectItem value="epic">Epic</SelectItem>
                    <SelectItem value="legendary">Legendary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                  data-testid="badge-points-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements (JSON)</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                placeholder='{"type": "forum_posts", "count": 10}'
                rows={3}
                className="font-mono text-sm"
                data-testid="badge-requirements-input"
              />
              <p className="text-xs text-gray-500">Example: {'{"type": "mentorship", "sessions": 10}'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={editingBadge ? handleUpdateBadge : handleCreateBadge}
              data-testid="save-badge-btn"
            >
              {editingBadge ? 'Update' : 'Create'} Badge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBadges;