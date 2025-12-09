import { useState, useEffect } from 'react';
import { Settings, Save, Bell } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { notificationService } from '@/services';
import { toast } from 'sonner';

const NotificationPreferences = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    email: true,
    push: false,
    categories: {
      profile: { email: true, push: false },
      mentorship: { email: true, push: true },
      jobs: { email: true, push: true },
      events: { email: true, push: false },
      forum: { email: false, push: false }
    },
    frequency: 'instant',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const response = await notificationService.getPreferences();
      if (response.success) {
        setPreferences(response.data);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast.error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await notificationService.savePreferences(preferences);
      if (response.success) {
        toast.success('Preferences saved successfully');
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const updateGlobalPreference = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateCategoryPreference = (category, channel, value) => {
    setPreferences(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: {
          ...prev.categories[category],
          [channel]: value
        }
      }
    }));
  };

  const updateQuietHours = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
            <p className="text-gray-500">Loading preferences...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const categories = [
    { id: 'profile', label: 'Profile Updates', description: 'Verification status and profile changes' },
    { id: 'mentorship', label: 'Mentorship', description: 'Mentorship requests, sessions, and updates' },
    { id: 'jobs', label: 'Job Applications', description: 'Application status and new job matches' },
    { id: 'events', label: 'Events', description: 'Event reminders and updates' },
    { id: 'forum', label: 'Forum Activity', description: 'Comments, replies, and mentions' }
  ];

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="notification-preferences-title">
            Notification Preferences
          </h1>
          <p className="text-gray-600">
            Manage how you receive notifications
          </p>
        </div>

        <div className="space-y-6">
          {/* Global Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Global Settings</CardTitle>
              <CardDescription>
                Master controls for all notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-global">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <Switch
                  id="email-global"
                  checked={preferences.email}
                  onCheckedChange={(checked) => updateGlobalPreference('email', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-global">Push Notifications</Label>
                  <p className="text-sm text-gray-500">Receive push notifications in browser</p>
                </div>
                <Switch
                  id="push-global"
                  checked={preferences.push}
                  onCheckedChange={(checked) => updateGlobalPreference('push', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Category Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Categories</CardTitle>
              <CardDescription>
                Choose which types of notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {categories.map((category, index) => (
                <div key={category.id}>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{category.label}</h4>
                      <p className="text-sm text-gray-500">{category.description}</p>
                    </div>
                    <div className="flex items-center gap-6 ml-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`${category.id}-email`}
                          checked={preferences.categories[category.id].email}
                          onCheckedChange={(checked) => updateCategoryPreference(category.id, 'email', checked)}
                          disabled={!preferences.email}
                        />
                        <Label htmlFor={`${category.id}-email`} className="text-sm">Email</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`${category.id}-push`}
                          checked={preferences.categories[category.id].push}
                          onCheckedChange={(checked) => updateCategoryPreference(category.id, 'push', checked)}
                          disabled={!preferences.push}
                        />
                        <Label htmlFor={`${category.id}-push`} className="text-sm">Push</Label>
                      </div>
                    </div>
                  </div>
                  {index < categories.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Frequency Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Frequency</CardTitle>
              <CardDescription>
                Control how often you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label htmlFor="frequency">Send me notifications</Label>
                <Select
                  value={preferences.frequency}
                  onValueChange={(value) => updateGlobalPreference('frequency', value)}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">Instantly (as they happen)</SelectItem>
                    <SelectItem value="daily">Daily Digest (once per day)</SelectItem>
                    <SelectItem value="weekly">Weekly Summary (once per week)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Quiet Hours</CardTitle>
              <CardDescription>
                Pause notifications during specific hours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="quiet-hours">Enable Quiet Hours</Label>
                  <p className="text-sm text-gray-500">Don't send notifications during these hours</p>
                </div>
                <Switch
                  id="quiet-hours"
                  checked={preferences.quietHours.enabled}
                  onCheckedChange={(checked) => updateQuietHours('enabled', checked)}
                />
              </div>
              {preferences.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4 ml-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-time">Start Time</Label>
                    <input
                      type="time"
                      id="start-time"
                      value={preferences.quietHours.start}
                      onChange={(e) => updateQuietHours('start', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time">End Time</Label>
                    <input
                      type="time"
                      id="end-time"
                      value={preferences.quietHours.end}
                      onChange={(e) => updateQuietHours('end', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2"
              data-testid="save-preferences-btn"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default NotificationPreferences;
