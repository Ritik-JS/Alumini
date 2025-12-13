import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Video, ExternalLink, Share2, ArrowLeft, Edit } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import RSVPButton from '@/components/events/RSVPButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { eventService } from '@/services';
import { toast } from 'sonner';
import { format } from 'date-fns';

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendees, setAttendees] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadEvent();
    loadAttendees();
  }, [eventId]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const response = await eventService.getEventById(eventId);
      
      if (response.success) {
        setEvent(response.data);
      } else {
        console.error('Failed to load event:', response.message);
        toast.error('Unable to load event. Please try again later.');
        navigate('/events');
      }
    } catch (error) {
      console.error('Error loading event:', error);
      toast.error('An error occurred while loading the event.');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendees = async () => {
    try {
      const response = await eventService.getEventAttendees(eventId);
      if (response.success) {
        setAttendees(response.data.slice(0, 10)); // Show first 10
      } else {
        console.error('Failed to load attendees:', response.message);
      }
    } catch (error) {
      console.error('Error loading attendees:', error);
    }
  };

  const handleRSVPChange = () => {
    loadEvent();
    loadAttendees();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'EEEE, MMMM dd, yyyy • h:mm a');
    } catch (e) {
      return dateString;
    }
  };

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

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isEventCreator = event && currentUser.id === event.created_by;
  const canEdit = isEventCreator || currentUser.role === 'admin';

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-96 bg-gray-200 rounded-lg" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!event) return null;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl" data-testid="event-details-page">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/events')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>

        {/* Event Banner */}
        {event.banner_image && (
          <div className="mb-6 rounded-lg overflow-hidden">
            <img
              src={event.banner_image}
              alt={event.title}
              className="w-full h-96 object-cover"
            />
          </div>
        )}

        {/* Event Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
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
              <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
            </div>
            
            <div className="flex gap-2">
              {canEdit && (
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => navigate(`/events/${event.id}/edit`)}
                  data-testid="edit-event-button"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Info */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Date & Time</p>
                    <p className="text-sm text-gray-600">{formatDate(event.start_date)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  {event.is_virtual ? (
                    <Video className="h-5 w-5 text-gray-500 mt-0.5" />
                  ) : (
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold text-sm">Location</p>
                    <p className="text-sm text-gray-600">
                      {event.is_virtual ? 'Virtual Event' : event.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Attendees</p>
                    <p className="text-sm text-gray-600">
                      {event.current_attendees_count || 0} / {event.max_attendees || 'Unlimited'} registered
                    </p>
                  </div>
                </div>

                {event.is_virtual && event.meeting_link && (
                  <div className="flex items-start gap-3">
                    <ExternalLink className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Meeting Link</p>
                      <a 
                        href={event.meeting_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Join Event
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-between">
                <div>
                  {event.max_attendees ? (
                    (event.current_attendees_count || 0) >= event.max_attendees ? (
                      <p className="text-sm text-red-600 font-semibold">Event is full</p>
                    ) : (
                      <p className="text-sm text-green-600">
                        {event.max_attendees - (event.current_attendees_count || 0)} spots remaining
                      </p>
                    )
                  ) : (
                    <p className="text-sm text-blue-600">Unlimited spots available</p>
                  )}
                </div>
                <RSVPButton eventId={event.id} onRSVPChange={handleRSVPChange} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Description */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-3">About This Event</h2>
            <div className="text-gray-700 whitespace-pre-wrap">
              {event.description}
            </div>
          </CardContent>
        </Card>

        {/* Attendees */}
        {attendees.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Attendees ({event.current_attendees_count})</h2>
                {event.current_attendees_count > 10 && (
                  <Button 
                    variant="link" 
                    onClick={() => navigate(`/events/${event.id}/attendees`)}
                  >
                    View All
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-4">
                {attendees.map((attendee) => {
                  const profile = attendee.profile;
                  const name = profile?.name || attendee.user?.email || 'Anonymous';
                  const photo = profile?.photo_url;
                  
                  return (
                    <div 
                      key={attendee.id} 
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                      onClick={() => navigate(`/profile/${attendee.user_id}`)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={photo} alt={name} />
                        <AvatarFallback>{getInitials(name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{name}</p>
                        {profile?.current_role && (
                          <p className="text-xs text-gray-600">{profile.current_role}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default EventDetails;
