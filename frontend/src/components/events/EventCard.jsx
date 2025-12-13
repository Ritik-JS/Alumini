import { Calendar, MapPin, Users, Video } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const EventCard = ({ event }) => {
  const navigate = useNavigate();

  // Validate event data
  if (!event || !event.id) {
    console.error('Invalid event data:', event);
    return null;
  }

  const getEventTypeBadgeColor = (type) => {
    const colors = {
      'workshop': 'bg-purple-100 text-purple-700',
      'webinar': 'bg-blue-100 text-blue-700',
      'conference': 'bg-red-100 text-red-700',
      'networking': 'bg-green-100 text-green-700',
      'meetup': 'bg-yellow-100 text-yellow-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const formatEventDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy • h:mm a');
    } catch (e) {
      return dateString;
    }
  };

  const maxAttendees = event.max_attendees || Infinity;
  const currentAttendees = event.current_attendees_count || 0;
  const isSpotsAvailable = maxAttendees > currentAttendees;
  const spotsLeft = maxAttendees === Infinity ? 'Unlimited' : maxAttendees - currentAttendees;

  const handleViewDetails = (e) => {
    e.stopPropagation();
    if (event && event.id) {
      console.log('Navigating to event:', event.id);
      navigate(`/events/${event.id}`);
    } else {
      console.error('Event ID is missing:', event);
    }
  };

  const handleCardClick = () => {
    if (event && event.id) {
      console.log('Card clicked, navigating to event:', event.id);
      navigate(`/events/${event.id}`);
    } else {
      console.error('Event ID is missing:', event);
    }
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={handleCardClick}
      data-testid={`event-card-${event.id}`}
    >
      {/* Event Banner */}
      {event.banner_image && (
        <div className="h-48 overflow-hidden bg-gray-200">
          <img
            src={event.banner_image}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <CardContent className="p-4">
        {/* Event Type Badge */}
        <div className="flex items-center justify-between mb-2">
          <Badge className={getEventTypeBadgeColor(event.event_type)}>
            {event.event_type}
          </Badge>
          {event.is_virtual && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Video className="h-3 w-3" />
              Virtual
            </Badge>
          )}
        </div>

        {/* Event Title */}
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {event.title}
        </h3>

        {/* Event Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {event.description}
        </p>

        {/* Event Details */}
        <div className="space-y-2 mb-3">
          {/* Date & Time */}
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{formatEventDate(event.start_date)}</span>
          </div>

          {/* Location */}
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">
              {event.is_virtual ? 'Virtual Event' : event.location}
            </span>
          </div>

          {/* Attendees */}
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>
              {currentAttendees} / {event.max_attendees || 'Unlimited'} attendees
            </span>
          </div>
        </div>

        {/* Spots Status */}
        {event.max_attendees ? (
          isSpotsAvailable ? (
            <div className="text-xs text-green-600 mb-3">
              {typeof spotsLeft === 'number' ? `${spotsLeft} spots remaining` : spotsLeft}
            </div>
          ) : (
            <div className="text-xs text-red-600 mb-3">
              Event is full
            </div>
          )
        ) : (
          <div className="text-xs text-blue-600 mb-3">
            Unlimited spots available
          </div>
        )}

        {/* View Details Button */}
        <Button 
          className="w-full" 
          variant="outline"
          onClick={handleViewDetails}
          data-testid={`view-event-details-${event.id}`}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};

export default EventCard;
