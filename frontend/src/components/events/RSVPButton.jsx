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
        toast.success(response.message);
        if (onRSVPChange) onRSVPChange(status);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error('Failed to update RSVP');
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