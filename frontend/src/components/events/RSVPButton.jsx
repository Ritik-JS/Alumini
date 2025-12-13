import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Calendar } from 'lucide-react';
import { eventService } from '@/services';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const RSVPButton = ({ eventId, onRSVPChange }) => {
  const [rsvpStatus, setRsvpStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserRsvp();
  }, [eventId]);

  const loadUserRsvp = async () => {
    try {
      const response = await eventService.getUserRsvp(eventId);
      if (response.success && response.data) {
        setRsvpStatus(response.data.status);
      }
    } catch (error) {
      console.error('Error loading RSVP:', error);
    }
  };

  const handleRSVP = async (status) => {
    setLoading(true);
    try {
      const response = await eventService.rsvpToEvent(eventId, status);
      
      if (response.success) {
        setRsvpStatus(status);
        
        // Better success messages based on status
        const messages = {
          'attending': 'You\'re going to this event! 🎉',
          'maybe': 'You might attend this event',
          'not_attending': 'RSVP cancelled'
        };
        toast.success(messages[status] || response.message);
        
        if (onRSVPChange) onRSVPChange(status);
      } else {
        // Handle specific error cases
        const message = response.message || '';
        if (message.toLowerCase().includes('full')) {
          toast.error('Sorry, this event is now full');
        } else if (message.toLowerCase().includes('deadline')) {
          toast.error('Registration deadline has passed');
        } else if (message.toLowerCase().includes('authentication') || message.toLowerCase().includes('login')) {
          toast.error('Please log in to RSVP');
        } else {
          toast.error(message || 'Failed to update RSVP');
        }
      }
    } catch (error) {
      console.error('RSVP error:', error);
      
      // Handle different error types
      if (error.response?.status === 401) {
        toast.error('Please log in to RSVP to events');
      } else if (error.response?.status === 400) {
        const errorMsg = error.response.data?.detail || 'Unable to RSVP';
        if (errorMsg.toLowerCase().includes('full')) {
          toast.error('This event is full');
        } else {
          toast.error(errorMsg);
        }
      } else if (error.response?.status === 404) {
        toast.error('Event not found');
      } else {
        toast.error('Failed to update RSVP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getRSVPButtonText = () => {
    if (rsvpStatus === 'attending') return 'Going';
    if (rsvpStatus === 'maybe') return 'Maybe';
    if (rsvpStatus === 'not_attending') return 'Not Going';
    return 'RSVP';
  };

  const getRSVPButtonVariant = () => {
    if (rsvpStatus === 'attending') return 'default';
    if (rsvpStatus === 'maybe') return 'secondary';
    return 'outline';
  };

  const getRSVPIcon = () => {
    if (rsvpStatus === 'attending') return <Check className="h-4 w-4 mr-2" />;
    if (rsvpStatus === 'maybe') return <Calendar className="h-4 w-4 mr-2" />;
    if (rsvpStatus === 'not_attending') return <X className="h-4 w-4 mr-2" />;
    return <Calendar className="h-4 w-4 mr-2" />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={getRSVPButtonVariant()}
          disabled={loading}
          data-testid="rsvp-button"
        >
          {getRSVPIcon()}
          {getRSVPButtonText()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleRSVP('attending')}
          data-testid="rsvp-attending"
        >
          <Check className="h-4 w-4 mr-2" />
          Going
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleRSVP('maybe')}
          data-testid="rsvp-maybe"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Maybe
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleRSVP('not_attending')}
          data-testid="rsvp-not-attending"
        >
          <X className="h-4 w-4 mr-2" />
          Not Going
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RSVPButton;