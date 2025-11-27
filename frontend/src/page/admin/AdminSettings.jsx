import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Bell, Shield, Database, Mail, Globe } from 'lucide-react';
import { toast } from 'sonner';

const AdminSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    // General Settings
    platformName: 'AlumUnity',
    platformUrl: 'https://alumunity.com',
    supportEmail: 'support@alumunity.com',
    // Notification Settings
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    // Security Settings
    twoFactorAuth: false,
    passwordExpiry: 90,
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    // Feature Flags
    enableJobPosting: true,
    enableMentorship: true,
    enableEvents: true,
    enableForum: true,
    requireProfileVerification: true,
  });

  const handleSave = (section) => {
    toast.success(`${section} settings saved successfully`);
  };

  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleInputChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainNavbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-lg p-6 text-white">
              <h1 className="text-3xl font-bold">Admin Settings ⚙️</h1>
              <p className="mt-2 opacity-90">Configure platform settings and preferences</p>
            </div>

            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
                <TabsTrigger value="general" data-testid="tab-general">
                  <Globe className="w-4 h-4 mr-2" />
                  General
                </TabsTrigger>
                <TabsTrigger value="notifications" data-testid="tab-notifications">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="security" data-testid="tab-security">
                  <Shield className="w-4 h-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="features" data-testid="tab-features">
                  <Settings className="w-4 h-4 mr-2" />
                  Features
                </TabsTrigger>
                <TabsTrigger value="database" data-testid="tab-database">
                  <Database className="w-4 h-4 mr-2" />
                  Database
                </TabsTrigger>
              </TabsList>

              {/* General Settings */}
              <TabsContent value="general" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>Basic platform configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="platformName">Platform Name</Label>
                      <Input
                        id="platformName"
                        value={settings.platformName}
                        onChange={(e) => handleInputChange('platformName', e.target.value)}
                        data-testid="input-platform-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="platformUrl">Platform URL</Label>
                      <Input
                        id="platformUrl"
                        type="url"
                        value={settings.platformUrl}
                        onChange={(e) => handleInputChange('platformUrl', e.target.value)}
                        data-testid="input-platform-url"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supportEmail">Support Email</Label>
                      <Input
                        id="supportEmail"
                        type="email"
                        value={settings.supportEmail}
                        onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                        data-testid="input-support-email"
                      />
                    </div>
                    <Button onClick={() => handleSave('General')} data-testid="save-general-btn">
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notification Settings */}
              <TabsContent value="notifications" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>Configure notification settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-gray-500">Send notifications via email</p>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={() => handleToggle('emailNotifications')}
                        data-testid="toggle-email-notifications"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-gray-500">Enable browser push notifications</p>
                      </div>
                      <Switch
                        checked={settings.pushNotifications}
                        onCheckedChange={() => handleToggle('pushNotifications')}
                        data-testid="toggle-push-notifications"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Weekly Digest</Label>
                        <p className="text-sm text-gray-500">Send weekly activity summary</p>
                      </div>
                      <Switch
                        checked={settings.weeklyDigest}
                        onCheckedChange={() => handleToggle('weeklyDigest')}
                        data-testid="toggle-weekly-digest"
                      />
                    </div>
                    <Button onClick={() => handleSave('Notification')} data-testid="save-notifications-btn">
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Settings */}
              <TabsContent value="security" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Configure security and authentication</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Two-Factor Authentication</Label>
                        <p className="text-sm text-gray-500">Require 2FA for all users</p>
                      </div>
                      <Switch
                        checked={settings.twoFactorAuth}
                        onCheckedChange={() => handleToggle('twoFactorAuth')}
                        data-testid="toggle-2fa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                      <Input
                        id="passwordExpiry"
                        type="number"
                        value={settings.passwordExpiry}
                        onChange={(e) => handleInputChange('passwordExpiry', e.target.value)}
                        data-testid="input-password-expiry"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                      <Input
                        id="maxLoginAttempts"
                        type="number"
                        value={settings.maxLoginAttempts}
                        onChange={(e) => handleInputChange('maxLoginAttempts', e.target.value)}
                        data-testid="input-max-login-attempts"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => handleInputChange('sessionTimeout', e.target.value)}
                        data-testid="input-session-timeout"
                      />
                    </div>
                    <Button onClick={() => handleSave('Security')} data-testid="save-security-btn">
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Feature Flags */}
              <TabsContent value="features" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Feature Management</CardTitle>
                    <CardDescription>Enable or disable platform features</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Job Posting</Label>
                        <p className="text-sm text-gray-500">Allow users to post jobs</p>
                      </div>
                      <Switch
                        checked={settings.enableJobPosting}
                        onCheckedChange={() => handleToggle('enableJobPosting')}
                        data-testid="toggle-job-posting"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Mentorship System</Label>
                        <p className="text-sm text-gray-500">Enable mentorship features</p>
                      </div>
                      <Switch
                        checked={settings.enableMentorship}
                        onCheckedChange={() => handleToggle('enableMentorship')}
                        data-testid="toggle-mentorship"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Events</Label>
                        <p className="text-sm text-gray-500">Allow event creation</p>
                      </div>
                      <Switch
                        checked={settings.enableEvents}
                        onCheckedChange={() => handleToggle('enableEvents')}
                        data-testid="toggle-events"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Community Forum</Label>
                        <p className="text-sm text-gray-500">Enable forum discussions</p>
                      </div>
                      <Switch
                        checked={settings.enableForum}
                        onCheckedChange={() => handleToggle('enableForum')}
                        data-testid="toggle-forum"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Profile Verification</Label>
                        <p className="text-sm text-gray-500">Require admin verification for profiles</p>
                      </div>
                      <Switch
                        checked={settings.requireProfileVerification}
                        onCheckedChange={() => handleToggle('requireProfileVerification')}
                        data-testid="toggle-profile-verification"
                      />
                    </div>
                    <Button onClick={() => handleSave('Feature')} data-testid="save-features-btn">
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Database Settings */}
              <TabsContent value="database" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Database Management</CardTitle>
                    <CardDescription>Database maintenance and backups</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <strong>Last Backup:</strong> 2 hours ago
                      </p>
                      <p className="text-sm text-blue-900 mt-1">
                        <strong>Database Size:</strong> 2.4 GB
                      </p>
                      <p className="text-sm text-blue-900 mt-1">
                        <strong>Status:</strong> Healthy
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" data-testid="backup-now-btn">
                        Backup Now
                      </Button>
                      <Button variant="outline" data-testid="optimize-db-btn">
                        Optimize Database
                      </Button>
                      <Button variant="outline" className="text-red-600" data-testid="clear-cache-btn">
                        Clear Cache
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default AdminSettings;