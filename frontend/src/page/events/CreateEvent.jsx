import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { eventService } from '@/services';
import { toast } from 'sonner';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'workshop',
    location: '',
    is_virtual: false,
    meeting_link: '',
    start_date: '',
    end_date: '',
    registration_deadline: '',
    max_attendees: 50,
    banner_image: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Event title is required');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Event description is required');
      return;
    }
    if (!formData.start_date) {
      toast.error('Start date is required');
      return;
    }
    if (!formData.end_date) {
      toast.error('End date is required');
      return;
    }
    if (!formData.is_virtual && !formData.location.trim()) {
      toast.error('Location is required for non-virtual events');
      return;
    }
    if (formData.is_virtual && !formData.meeting_link.trim()) {
      toast.error('Meeting link is required for virtual events');
      return;
    }

    setSubmitting(true);
    try {
      // Prepare data: convert empty strings to null for optional fields
      const payload = {
        ...formData,
        meeting_link: formData.meeting_link.trim() || null,
        location: formData.location.trim() || null,
        banner_image: formData.banner_image.trim() || null,
        registration_deadline: formData.registration_deadline || null,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null
      };
      
      const response = await eventService.createEvent(payload);
      
      if (response.success) {
        toast.success('Event created successfully!');
        navigate(`/events/${response.data.id}`);
      } else {
        toast.error(response.error || response.message || 'Failed to create event');
      }
    } catch (error) {
      console.error('Event creation error:', error);
      toast.error('Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl" data-testid="create-event-page">
        {/* Header */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/events')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>

        <h1 className="text-3xl font-bold mb-2">Create New Event</h1>
        <p className="text-gray-600 mb-8">
          Fill in the details below to create a new event for the community
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Web Development Workshop"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  required
                  data-testid="event-title-input"
                />
              </div>

              {/* Event Type */}
              <div className="space-y-2">
                <Label htmlFor="event_type">Event Type *</Label>
                <Select 
                  value={formData.event_type} 
                  onValueChange={(value) => handleChange('event_type', value)}
                >
                  <SelectTrigger data-testid="event-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="webinar">Webinar</SelectItem>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="networking">Networking</SelectItem>
                    <SelectItem value="meetup">Meetup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your event..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="min-h-[150px]"
                  required
                  data-testid="event-description-input"
                />
              </div>

              {/* Banner Image URL */}
              <div className="space-y-2">
                <Label htmlFor="banner_image">Banner Image URL (Optional)</Label>
                <Input
                  id="banner_image"
                  placeholder="https://example.com/image.jpg"
                  value={formData.banner_image}
                  onChange={(e) => handleChange('banner_image', e.target.value)}
                  data-testid="event-banner-input"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Location & Format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Virtual Event Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Virtual Event</Label>
                  <p className="text-sm text-gray-500">Is this event online?</p>
                </div>
                <Switch
                  checked={formData.is_virtual}
                  onCheckedChange={(checked) => handleChange('is_virtual', checked)}
                  data-testid="virtual-event-toggle"
                />
              </div>

              {/* Location or Meeting Link */}
              {formData.is_virtual ? (
                <div className="space-y-2">
                  <Label htmlFor="meeting_link">Meeting Link *</Label>
                  <Input
                    id="meeting_link"
                    placeholder="https://zoom.us/j/..."
                    value={formData.meeting_link}
                    onChange={(e) => handleChange('meeting_link', e.target.value)}
                    required={formData.is_virtual}
                    data-testid="meeting-link-input"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Main Campus Auditorium"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    required={!formData.is_virtual}
                    data-testid="location-input"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Schedule & Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date & Time *</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  required
                  data-testid="start-date-input"
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date & Time *</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                  min={formData.start_date}
                  required
                  data-testid="end-date-input"
                />
              </div>

              {/* Registration Deadline */}
              <div className="space-y-2">
                <Label htmlFor="registration_deadline">Registration Deadline (Optional)</Label>
                <Input
                  id="registration_deadline"
                  type="datetime-local"
                  value={formData.registration_deadline}
                  onChange={(e) => handleChange('registration_deadline', e.target.value)}
                  data-testid="registration-deadline-input"
                />
              </div>

              {/* Max Attendees */}
              <div className="space-y-2">
                <Label htmlFor="max_attendees">Maximum Attendees *</Label>
                <Input
                  id="max_attendees"
                  type="number"
                  min="1"
                  value={formData.max_attendees}
                  onChange={(e) => handleChange('max_attendees', parseInt(e.target.value) || 0)}
                  required
                  data-testid="max-attendees-input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/events')}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1"
              data-testid="submit-event-button"
            >
              {submitting ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default CreateEvent;