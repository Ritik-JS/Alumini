/**
 * Settings Component - User Settings Management
 * 
 * DATABASE COMPATIBILITY:
 * This component is designed to work with the backend database structure.
 * 
 * Tables used:
 * - alumni_profiles: name, bio, headline, location, batch_year, social_links (JSON)
 * - privacy_settings: profile_visibility, show_email, show_phone, allow_messages, 
 *                     allow_mentorship_requests, show_in_directory, show_activity
 * - notification_preferences: email_notifications, push_notifications, 
 *                            notification_types (JSON), notification_frequency
 * - users: password_hash (for password changes)
 * 
 * When switching from mockdata to backend:
 * 1. Replace toast.success with actual API calls to save data
 * 2. Load initial state from backend API instead of hardcoded values
 * 3. Use user.id to fetch/update user-specific settings
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authService, profileService, notificationService } from '@/services';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Bell, Shield, User, Eye, Lock, Mail, Smartphone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const { user } = useAuth();
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Profile data from alumni_profiles table
  const [profileSettings, setProfileSettings] = useState({
    name: user?.email?.split('@')[0] || '',
    email: user?.email || '',
    bio: '',
    headline: '',
    location: '',
    batch_year: new Date().getFullYear(),
    social_links: {
      phone: '',
      website: '',
      linkedin: '',
      github: '',
      twitter: ''
    }
  });

  // Privacy settings from privacy_settings table
  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: 'public',
    show_email: false,
    show_phone: false,
    allow_messages: true,
    allow_mentorship_requests: true,
    show_in_directory: true,
    show_activity: true
  });

  // Notification preferences from notification_preferences table
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    notification_frequency: 'instant',
    notification_types: {
      job: true,
      event: true,
      mentorship: true,
      forum: true,
      profile: true,
      system: true,
      verification: true
    }
  });

  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load privacy settings
      const privacyResult = await profileService.getPrivacySettings();
      if (privacyResult.success && privacyResult.data) {
        setPrivacySettings(prevState => ({
          ...prevState,
          ...privacyResult.data
        }));
      }

      // Load notification preferences
      const notificationResult = await notificationService.getPreferences();
      if (notificationResult.success && notificationResult.data) {
        setNotificationSettings(prevState => ({
          ...prevState,
          ...notificationResult.data
        }));
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load settings. Using default values.');
      setLoading(false);
    }
  };

  const handleProfileSave = () => {
    // Profile editing moved to /profile page
    toast.info('Please visit the My Profile page to edit your profile');
  };

  const handlePrivacySave = async () => {
    try {
      setSavingPrivacy(true);
      const result = await profileService.updatePrivacySettings(privacySettings);
      
      if (result.success) {
        toast.success('Privacy settings saved successfully');
      } else {
        toast.error(result.error || 'Failed to save privacy settings');
      }
    } catch (err) {
      console.error('Error saving privacy settings:', err);
      toast.error('Failed to save privacy settings. Please try again.');
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleNotificationSave = async () => {
    try {
      setSavingNotifications(true);
      const result = await notificationService.updatePreferences(notificationSettings);
      
      if (result.success) {
        toast.success('Notification preferences saved successfully');
      } else {
        toast.error(result.error || 'Failed to save notification preferences');
      }
    } catch (err) {
      console.error('Error saving notification preferences:', err);
      toast.error('Failed to save notification preferences. Please try again.');
    } finally {
      setSavingNotifications(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!securitySettings.currentPassword || !securitySettings.newPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (securitySettings.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      setChangingPassword(true);
      const result = await authService.changePassword(
        securitySettings.currentPassword,
        securitySettings.newPassword
      );
      
      if (result.success) {
        toast.success('Password changed successfully');
        setSecuritySettings({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        toast.error(result.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      toast.error('Failed to change password. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const togglePrivacy = (key) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleNotification = (key) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
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
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
              <h1 className="text-3xl font-bold" data-testid="settings-header">Settings ⚙️</h1>
              <p className="mt-2 opacity-90">Manage your account settings and preferences</p>
            </div>

            {/* Loading State */}
            {loading && (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading settings...</span>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {error && !loading && (
              <Card className="border-yellow-300 bg-yellow-50">
                <CardContent className="py-4">
                  <p className="text-yellow-800">{error}</p>
                </CardContent>
              </Card>
            )}

            {!loading && (
            <Tabs defaultValue="privacy" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="privacy" data-testid="tab-privacy">
                  <Eye className="w-4 h-4 mr-2" />
                  Privacy
                </TabsTrigger>
                <TabsTrigger value="notifications" data-testid="tab-notifications">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="security" data-testid="tab-security">
                  <Shield className="w-4 h-4 mr-2" />
                  Security
                </TabsTrigger>
              </TabsList>

              {/* Note: Profile editing has been moved to /profile page */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> To edit your profile information, please visit the <a href="/profile" className="underline font-medium">My Profile</a> page.
                </p>
              </div>

              {/* Privacy Settings */}
              <TabsContent value="privacy" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Privacy Settings</CardTitle>
                    <CardDescription>Control who can see your information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="profileVisibility">Profile Visibility</Label>
                      <select
                        id="profileVisibility"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={privacySettings.profile_visibility}
                        onChange={(e) =>
                          setPrivacySettings((prev) => ({ ...prev, profile_visibility: e.target.value }))
                        }
                        data-testid="select-profile-visibility"
                      >
                        <option value="public">Public - Everyone can view</option>
                        <option value="alumni">Alumni Only - Verified alumni can view</option>
                        <option value="connections">Connections Only - Only your connections</option>
                        <option value="private">Private - Only you can view</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Show Email Address</Label>
                        <p className="text-sm text-gray-500">Allow others to see your email</p>
                      </div>
                      <Switch
                        checked={privacySettings.show_email}
                        onCheckedChange={() => togglePrivacy('show_email')}
                        data-testid="toggle-show-email"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Show Phone Number</Label>
                        <p className="text-sm text-gray-500">Allow others to see your phone</p>
                      </div>
                      <Switch
                        checked={privacySettings.show_phone}
                        onCheckedChange={() => togglePrivacy('show_phone')}
                        data-testid="toggle-show-phone"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Show in Directory</Label>
                        <p className="text-sm text-gray-500">Appear in alumni directory search</p>
                      </div>
                      <Switch
                        checked={privacySettings.show_in_directory}
                        onCheckedChange={() => togglePrivacy('show_in_directory')}
                        data-testid="toggle-show-directory"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Show Activity</Label>
                        <p className="text-sm text-gray-500">Display your recent activity to others</p>
                      </div>
                      <Switch
                        checked={privacySettings.show_activity}
                        onCheckedChange={() => togglePrivacy('show_activity')}
                        data-testid="toggle-show-activity"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Allow Direct Messages</Label>
                        <p className="text-sm text-gray-500">Let others send you messages</p>
                      </div>
                      <Switch
                        checked={privacySettings.allow_messages}
                        onCheckedChange={() => togglePrivacy('allow_messages')}
                        data-testid="toggle-allow-messages"
                      />
                    </div>
                    
                    {(user?.role === 'alumni' || user?.role === 'student') && (
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Allow Mentorship Requests</Label>
                          <p className="text-sm text-gray-500">
                            {user?.role === 'alumni' 
                              ? 'Let students request mentorship from you' 
                              : 'Allow mentors to see your profile'}
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.allow_mentorship_requests}
                          onCheckedChange={() => togglePrivacy('allow_mentorship_requests')}
                          data-testid="toggle-mentorship-requests"
                        />
                      </div>
                    )}
                    
                    <Button onClick={handlePrivacySave} disabled={savingPrivacy} data-testid="save-privacy-btn">
                      {savingPrivacy ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notification Settings */}
              <TabsContent value="notifications" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>Choose how you want to be notified</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email Notifications
                        </Label>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                      <Switch
                        checked={notificationSettings.email_notifications}
                        onCheckedChange={() => toggleNotification('email_notifications')}
                        data-testid="toggle-email-notifications"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          Push Notifications
                        </Label>
                        <p className="text-sm text-gray-500">Receive push notifications in browser</p>
                      </div>
                      <Switch
                        checked={notificationSettings.push_notifications}
                        onCheckedChange={() => toggleNotification('push_notifications')}
                        data-testid="toggle-push-notifications"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notificationFrequency">Notification Frequency</Label>
                      <select
                        id="notificationFrequency"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={notificationSettings.notification_frequency}
                        onChange={(e) =>
                          setNotificationSettings((prev) => ({ ...prev, notification_frequency: e.target.value }))
                        }
                        data-testid="select-notification-frequency"
                      >
                        <option value="instant">Instant - As they happen</option>
                        <option value="daily">Daily - Once per day digest</option>
                        <option value="weekly">Weekly - Weekly summary</option>
                      </select>
                    </div>
                    
                    <div className="border-t pt-4 space-y-4">
                      <h3 className="font-semibold text-sm text-gray-700">Notification Types</h3>
                      
                      {/* notification_types JSON field */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Profile Updates</Label>
                          <p className="text-sm text-gray-500">Profile verification and changes</p>
                        </div>
                        <Switch
                          checked={notificationSettings.notification_types.profile}
                          onCheckedChange={() => 
                            setNotificationSettings(prev => ({
                              ...prev,
                              notification_types: { ...prev.notification_types, profile: !prev.notification_types.profile }
                            }))
                          }
                          data-testid="toggle-profile-notifications"
                        />
                      </div>
                      
                      {user?.role !== 'admin' && (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label>Job Notifications</Label>
                              <p className="text-sm text-gray-500">New job postings and application updates</p>
                            </div>
                            <Switch
                              checked={notificationSettings.notification_types.job}
                              onCheckedChange={() => 
                                setNotificationSettings(prev => ({
                                  ...prev,
                                  notification_types: { ...prev.notification_types, job: !prev.notification_types.job }
                                }))
                              }
                              data-testid="toggle-job-notifications"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label>Event Notifications</Label>
                              <p className="text-sm text-gray-500">Event reminders and updates</p>
                            </div>
                            <Switch
                              checked={notificationSettings.notification_types.event}
                              onCheckedChange={() => 
                                setNotificationSettings(prev => ({
                                  ...prev,
                                  notification_types: { ...prev.notification_types, event: !prev.notification_types.event }
                                }))
                              }
                              data-testid="toggle-event-notifications"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label>Mentorship Notifications</Label>
                              <p className="text-sm text-gray-500">Mentorship session updates and requests</p>
                            </div>
                            <Switch
                              checked={notificationSettings.notification_types.mentorship}
                              onCheckedChange={() => 
                                setNotificationSettings(prev => ({
                                  ...prev,
                                  notification_types: { ...prev.notification_types, mentorship: !prev.notification_types.mentorship }
                                }))
                              }
                              data-testid="toggle-mentorship-notifications"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label>Forum Notifications</Label>
                              <p className="text-sm text-gray-500">Replies to your posts and comments</p>
                            </div>
                            <Switch
                              checked={notificationSettings.notification_types.forum}
                              onCheckedChange={() => 
                                setNotificationSettings(prev => ({
                                  ...prev,
                                  notification_types: { ...prev.notification_types, forum: !prev.notification_types.forum }
                                }))
                              }
                              data-testid="toggle-forum-notifications"
                            />
                          </div>
                        </>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>System Notifications</Label>
                          <p className="text-sm text-gray-500">Important system announcements</p>
                        </div>
                        <Switch
                          checked={notificationSettings.notification_types.system}
                          onCheckedChange={() => 
                            setNotificationSettings(prev => ({
                              ...prev,
                              notification_types: { ...prev.notification_types, system: !prev.notification_types.system }
                            }))
                          }
                          data-testid="toggle-system-notifications"
                        />
                      </div>
                      
                      {user?.role === 'admin' && (
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label>Verification Requests</Label>
                            <p className="text-sm text-gray-500">New verification and moderation requests</p>
                          </div>
                          <Switch
                            checked={notificationSettings.notification_types.verification}
                            onCheckedChange={() => 
                              setNotificationSettings(prev => ({
                                ...prev,
                                notification_types: { ...prev.notification_types, verification: !prev.notification_types.verification }
                              }))
                            }
                            data-testid="toggle-verification-notifications"
                          />
                        </div>
                      )}
                    </div>
                    
                    <Button onClick={handleNotificationSave} disabled={savingNotifications} data-testid="save-notifications-btn">
                      {savingNotifications ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Settings */}
              <TabsContent value="security" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Update your account password</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={securitySettings.currentPassword}
                        onChange={(e) =>
                          setSecuritySettings((prev) => ({ ...prev, currentPassword: e.target.value }))
                        }
                        data-testid="input-current-password"
                        placeholder="Enter your current password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={securitySettings.newPassword}
                        onChange={(e) =>
                          setSecuritySettings((prev) => ({ ...prev, newPassword: e.target.value }))
                        }
                        data-testid="input-new-password"
                        placeholder="Enter new password (min. 8 characters)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={securitySettings.confirmPassword}
                        onChange={(e) =>
                          setSecuritySettings((prev) => ({ ...prev, confirmPassword: e.target.value }))
                        }
                        data-testid="input-confirm-password"
                        placeholder="Confirm your new password"
                      />
                    </div>
                    
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-900">
                        <strong>Password Requirements:</strong>
                      </p>
                      <ul className="list-disc list-inside text-sm text-yellow-900 mt-2 space-y-1">
                        <li>At least 8 characters long</li>
                        <li>Contains uppercase and lowercase letters</li>
                        <li>Contains at least one number</li>
                        <li>Contains at least one special character</li>
                      </ul>
                    </div>
                    
                    <Button onClick={handlePasswordChange} disabled={changingPassword} data-testid="change-password-btn">
                      {changingPassword ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        'Change Password'
                      )}
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Account Security</CardTitle>
                    <CardDescription>Additional security options</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <strong>Last Login:</strong> {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                      </p>
                      <p className="text-sm text-blue-900 mt-1">
                        <strong>Account Created:</strong> {new Date(user?.created_at || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <Button variant="outline" data-testid="view-login-history-btn">
                      View Login History
                    </Button>
                    <Button variant="outline" className="ml-2" data-testid="enable-2fa-btn">
                      Enable Two-Factor Authentication
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Settings;
