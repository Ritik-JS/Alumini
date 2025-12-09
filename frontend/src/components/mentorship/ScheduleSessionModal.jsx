import { useState } from 'react';
import { X, Calendar as CalendarIcon, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { mentorshipService } from '@/services';

const ScheduleSessionModal = ({ mentorshipRequest, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    scheduled_date: '',
    scheduled_time: '',
    duration: 60,
    meeting_link: '',
    agenda: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.scheduled_date || !formData.scheduled_time) {
      toast.error('Please select date and time');
      return;
    }
    if (!formData.agenda.trim()) {
      toast.error('Please provide an agenda for the session');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Combine date and time into ISO string
      const scheduledDateTime = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);
      
      if (scheduledDateTime <= new Date()) {
        toast.error('Please select a future date and time');
        setIsSubmitting(false);
        return;
      }

      // Create session
      const result = await mentorshipService.createSession({
        mentorship_request_id: mentorshipRequest.id,
        scheduled_date: scheduledDateTime.toISOString(),
        duration: parseInt(formData.duration),
        meeting_link: formData.meeting_link || null,
        agenda: formData.agenda,
      });

      if (result.success) {
        toast.success('Session scheduled successfully!');
        if (onSuccess) onSuccess(result.data);
        onClose();
      } else {
        toast.error(result.error || 'Failed to schedule session');
      }
    } catch (error) {
      console.error('Error scheduling session:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" data-testid="schedule-session-modal">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Schedule Mentorship Session</h2>
            <p className="text-sm text-gray-600 mt-1">
              Set up a session time and agenda
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            data-testid="close-modal-btn"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_date" className="required">
                Date
              </Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="scheduled_date"
                  name="scheduled_date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  data-testid="date-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_time" className="required">
                Time
              </Label>
              <Input
                id="scheduled_time"
                name="scheduled_time"
                type="time"
                value={formData.scheduled_time}
                onChange={handleChange}
                required
                data-testid="time-input"
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="required">
              Duration (minutes)
            </Label>
            <select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              data-testid="duration-select"
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          {/* Meeting Link */}
          <div className="space-y-2">
            <Label htmlFor="meeting_link">
              Meeting Link (Optional)
            </Label>
            <div className="relative">
              <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="meeting_link"
                name="meeting_link"
                type="url"
                value={formData.meeting_link}
                onChange={handleChange}
                placeholder="https://meet.google.com/..."
                className="pl-10"
                data-testid="meeting-link-input"
              />
            </div>
            <p className="text-xs text-gray-500">
              Zoom, Google Meet, Teams, or any video conferencing link
            </p>
          </div>

          {/* Agenda */}
          <div className="space-y-2">
            <Label htmlFor="agenda" className="required">
              Session Agenda
            </Label>
            <Textarea
              id="agenda"
              name="agenda"
              value={formData.agenda}
              onChange={handleChange}
              placeholder="What will you cover in this session? e.g., Code review, Career discussion, Interview practice..."
              rows={4}
              required
              data-testid="agenda-input"
            />
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Both you and your mentor/mentee will receive a notification about this scheduled session. Make sure to add the meeting link before the session starts.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
              data-testid="schedule-btn"
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Session'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleSessionModal;