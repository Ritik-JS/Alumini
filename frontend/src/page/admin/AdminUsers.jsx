import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, MoreVertical, UserCheck, UserX, Mail, Shield, Trash2 } from 'lucide-react';
import mockData from '@/mockdata.json';
import { toast } from 'sonner';

const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);

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
                <div className="flex flex-col md:flex-row gap-4 mb-6">
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

                {/* User Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
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
    </div>
  );
};

export default AdminUsers;