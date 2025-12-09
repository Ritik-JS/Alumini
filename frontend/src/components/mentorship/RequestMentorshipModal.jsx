import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { mentorshipService } from '@/services';

const RequestMentorshipModal = ({ mentor, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    request_message: '',
    goals: '',
    preferred_topics: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.request_message.trim()) {
      toast.error('Please write a message to the mentor');
      return;
    }
    if (!formData.goals.trim()) {
      toast.error('Please describe your goals');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get current user
      const userData = localStorage.getItem('user');
      if (!userData) {
        toast.error('Please login to request mentorship');
        return;
      }
      const user = JSON.parse(userData);

      // Parse topics (comma-separated)
      const topicsArray = formData.preferred_topics
        .split(',')
        .map(t => t.trim())
        .filter(t => t);

      // Create request
      const result = await mentorshipService.createMentorshipRequest({
        student_id: user.id,
        mentor_id: mentor.user_id,
        request_message: formData.request_message,
        goals: formData.goals,
        preferred_topics: topicsArray,
      });

      if (result.success) {
        toast.success('Mentorship request sent successfully!');
        if (onSuccess) onSuccess(result.data);
        onClose();
      } else {
        toast.error(result.error || 'Failed to send request');
      }
    } catch (error) {
      console.error('Error sending mentorship request:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" data-testid="request-mentorship-modal">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Request Mentorship</h2>
            <p className="text-sm text-gray-600 mt-1">
              Send a mentorship request to {mentor.profile?.name}
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
          {/* Mentor Info */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{mentor.profile?.name}</h3>
                <p className="text-sm text-gray-600">{mentor.profile?.headline}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {mentor.expertise_areas?.slice(0, 5).map((area, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {area}
                </Badge>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="request_message" className="required">
              Your Message
            </Label>
            <Textarea
              id="request_message"
              name="request_message"
              value={formData.request_message}
              onChange={handleChange}
              placeholder="Introduce yourself and explain why you'd like this person to be your mentor..."
              rows={4}
              required
              data-testid="request-message-input"
            />
            <p className="text-xs text-gray-500">
              Tip: Mention specific areas you'd like guidance on and what you hope to achieve.
            </p>
          </div>

          {/* Goals */}
          <div className="space-y-2">
            <Label htmlFor="goals" className="required">
              Your Goals
            </Label>
            <Textarea
              id="goals"
              name="goals"
              value={formData.goals}
              onChange={handleChange}
              placeholder="What do you hope to achieve through this mentorship?"
              rows={3}
              required
              data-testid="goals-input"
            />
          </div>

          {/* Preferred Topics */}
          <div className="space-y-2">
            <Label htmlFor="preferred_topics">
              Preferred Topics (Optional)
            </Label>
            <Input
              id="preferred_topics"
              name="preferred_topics"
              value={formData.preferred_topics}
              onChange={handleChange}
              placeholder="e.g., Career guidance, Technical skills, Interview prep (comma-separated)"
              data-testid="topics-input"
            />
            <p className="text-xs text-gray-500">
              Separate multiple topics with commas
            </p>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>What happens next?</strong><br />
              The mentor will review your request and respond within a few days. You'll receive a notification when they accept or decline.
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
              data-testid="send-request-btn"
            >
              {isSubmitting ? (
                'Sending...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestMentorshipModal;