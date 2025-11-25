import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, MoreVertical, UserCheck, UserX, Mail, Shield, Trash2, Download, Eye } from 'lucide-react';
import mockData from '@/mockdata.json';
import { toast } from 'sonner';

const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    // Load users from mock data
    const loadUsers = () => {
      try {
        const allUsers = mockData.users || [];
        setUsers(allUsers);
        setFilteredUsers(allUsers);
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search and role
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.role && u.role.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, users]);

  const handleBanUser = (userId) => {
    toast.success(`User ${userId} has been banned`);
    // In real app, this would call an API
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setUsers(users.filter((u) => u.id !== userId));
      toast.success('User deleted successfully');
    }
  };

  const handleResetPassword = (userId) => {
    toast.success('Password reset email sent');
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id));
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
      setUsers(users.filter((u) => !selectedUsers.includes(u.id)));
      setSelectedUsers([]);
      toast.success(`${selectedUsers.length} users deleted`);
    }
  };

  const handleBulkBan = () => {
    toast.success(`${selectedUsers.length} users banned`);
    setSelectedUsers([]);
  };

  const handleExportUsers = () => {
    const csvContent = [
      ['Email', 'Role', 'Status', 'Created At'],
      ...filteredUsers.map((u) => [
        u.email,
        u.role,
        u.is_active ? 'Active' : 'Inactive',
        new Date(u.created_at).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Users exported successfully');
  };

  const handleViewUserDetails = (userId) => {
    const user = users.find((u) => u.id === userId);
    const profile = mockData.alumni_profiles?.find((p) => p.user_id === userId);
    setSelectedUserDetails({ ...user, profile });
    setShowUserModal(true);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'alumni':
        return 'bg-blue-100 text-blue-800';
      case 'recruiter':
        return 'bg-purple-100 text-purple-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = [
    { label: 'Total Users', value: users.length, color: 'text-blue-600' },
    { label: 'Students', value: users.filter((u) => u.role === 'student').length, color: 'text-green-600' },
    { label: 'Alumni', value: users.filter((u) => u.role === 'alumni').length, color: 'text-purple-600' },
    { label: 'Recruiters', value: users.filter((u) => u.role === 'recruiter').length, color: 'text-orange-600' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainNavbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-6 text-white">
              <h1 className="text-3xl font-bold">User Management 👥</h1>
              <p className="mt-2 opacity-90">Manage all platform users and their permissions</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold {stat.color}">{stat.value}</div>
                    <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>User List</CardTitle>
                <CardDescription>Search and filter users by role</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search by email or role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="user-search-input"
                      />
                    </div>
                    <div className="flex gap-2">
                      {['all', 'student', 'alumni', 'recruiter', 'admin'].map((role) => (
                        <Button
                          key={role}
                          variant={roleFilter === role ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setRoleFilter(role)}
                          className="capitalize"
                          data-testid={`filter-${role}-btn`}
                        >
                          {role}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Bulk Actions */}
                  {selectedUsers.length > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="text-sm font-medium text-blue-900">
                        {selectedUsers.length} user(s) selected
                      </span>
                      <div className="flex gap-2 ml-auto">
                        <Button size="sm" variant="outline" onClick={handleBulkBan} data-testid="bulk-ban-btn">
                          <UserX className="w-4 h-4 mr-1" />
                          Ban Selected
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={handleBulkDelete}
                          data-testid="bulk-delete-btn"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete Selected
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Export Button */}
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={handleExportUsers} data-testid="export-users-btn">
                      <Download className="w-4 h-4 mr-2" />
                      Export Users
                    </Button>
                  </div>
                </div>

                {/* User Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="pb-3 w-12">
                          <Checkbox
                            checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                            onCheckedChange={handleSelectAll}
                            data-testid="select-all-checkbox"
                          />
                        </th>
                        <th className="pb-3 font-medium text-gray-700">Email</th>
                        <th className="pb-3 font-medium text-gray-700">Role</th>
                        <th className="pb-3 font-medium text-gray-700">Status</th>
                        <th className="pb-3 font-medium text-gray-700">Joined</th>
                        <th className="pb-3 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="border-b hover:bg-gray-50" data-testid={`user-row-${u.id}`}>
                          <td className="py-4">
                            <Checkbox
                              checked={selectedUsers.includes(u.id)}
                              onCheckedChange={() => handleSelectUser(u.id)}
                              data-testid={`select-user-${u.id}`}
                            />
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`}
                                alt={u.email}
                                className="w-8 h-8 rounded-full"
                              />
                              <span className="font-medium">{u.email}</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <Badge className={`capitalize ${getRoleBadgeColor(u.role)}`}>
                              {u.role}
                            </Badge>
                          </td>
                          <td className="py-4">
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Active
                            </Badge>
                          </td>
                          <td className="py-4 text-sm text-gray-600">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" data-testid={`user-actions-${u.id}`}>
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleViewUserDetails(u.id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleResetPassword(u.id)}>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBanUser(u.id)}>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Ban User
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No users found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Footer />

      {/* User Details Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Complete user information and profile</DialogDescription>
          </DialogHeader>
          {selectedUserDetails && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <img
                  src={
                    selectedUserDetails.profile?.photo_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUserDetails.email}`
                  }
                  alt={selectedUserDetails.email}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedUserDetails.profile?.name || selectedUserDetails.email}
                  </h3>
                  <p className="text-sm text-gray-600">{selectedUserDetails.email}</p>
                  <Badge className={`mt-1 capitalize ${getRoleBadgeColor(selectedUserDetails.role)}`}>
                    {selectedUserDetails.role}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <p className="text-sm mt-1">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {selectedUserDetails.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Verified</p>
                  <p className="text-sm mt-1">
                    <Badge variant="outline" className={selectedUserDetails.is_verified ? 'text-green-600 border-green-600' : 'text-red-600 border-red-600'}>
                      {selectedUserDetails.is_verified ? 'Verified' : 'Not Verified'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Joined</p>
                  <p className="text-sm mt-1">{new Date(selectedUserDetails.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Login</p>
                  <p className="text-sm mt-1">
                    {selectedUserDetails.last_login
                      ? new Date(selectedUserDetails.last_login).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
              </div>

              {selectedUserDetails.profile && (
                <>
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Profile Information</h4>
                    {selectedUserDetails.profile.headline && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-600">Headline</p>
                        <p className="text-sm mt-1">{selectedUserDetails.profile.headline}</p>
                      </div>
                    )}
                    {selectedUserDetails.profile.bio && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-600">Bio</p>
                        <p className="text-sm mt-1">{selectedUserDetails.profile.bio}</p>
                      </div>
                    )}
                    {selectedUserDetails.profile.current_company && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-600">Current Company</p>
                        <p className="text-sm mt-1">
                          {selectedUserDetails.profile.current_role} at {selectedUserDetails.profile.current_company}
                        </p>
                      </div>
                    )}
                    {selectedUserDetails.profile.location && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-600">Location</p>
                        <p className="text-sm mt-1">{selectedUserDetails.profile.location}</p>
                      </div>
                    )}
                    {selectedUserDetails.profile.batch_year && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-600">Batch Year</p>
                        <p className="text-sm mt-1">{selectedUserDetails.profile.batch_year}</p>
                      </div>
                    )}
                  </div>

                  {selectedUserDetails.profile.skills && selectedUserDetails.profile.skills.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedUserDetails.profile.skills.map((skill, index) => (
                          <Badge key={index} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Profile Completion</h4>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${selectedUserDetails.profile.profile_completion_percentage || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {selectedUserDetails.profile.profile_completion_percentage || 0}%
                      </span>
                    </div>
                  </div>
                </>
              )}

              <div className="border-t pt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleResetPassword(selectedUserDetails.id)}>
                  <Mail className="w-4 h-4 mr-1" />
                  Reset Password
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBanUser(selectedUserDetails.id)}>
                  <UserX className="w-4 h-4 mr-1" />
                  Ban User
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600"
                  onClick={() => {
                    handleDeleteUser(selectedUserDetails.id);
                    setShowUserModal(false);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;