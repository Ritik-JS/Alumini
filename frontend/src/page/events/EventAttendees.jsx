import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Mail, Briefcase } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { eventService } from '@/services';
import { toast } from 'sonner';

const EventAttendees = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventAndAttendees();
  }, [eventId]);

  const loadEventAndAttendees = async () => {
    setLoading(true);
    try {
      // Load event details
      const eventResponse = await eventService.getEventById(eventId);
      if (eventResponse.success) {
        setEvent(eventResponse.data);
      }

      // Load attendees
      const attendeesResponse = await eventService.getEventAttendees(eventId);
      if (attendeesResponse.success) {
        setAttendees(attendeesResponse.data);
      }
    } catch (error) {
      toast.error('Error loading attendees');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      'alumni': 'bg-blue-100 text-blue-700',
      'student': 'bg-green-100 text-green-700',
      'recruiter': 'bg-purple-100 text-purple-700',
      'admin': 'bg-red-100 text-red-700'
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl" data-testid="event-attendees-page">
        {/* Header */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate(`/events/${eventId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Event
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {event?.title || 'Event'} - Attendees
          </h1>
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="h-5 w-5" />
            <span>{attendees.length} attendees registered</span>
          </div>
        </div>

        {/* Attendees Grid */}
        {attendees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {attendees.map((attendee) => {
              const profile = attendee.profile;
              const user = attendee.user;
              const name = profile?.name || user?.email || 'Anonymous';
              const photo = profile?.photo_url;
              const role = user?.role || 'user';
              
              return (
                <Card 
                  key={attendee.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/profile/${attendee.user_id}`)}
                  data-testid={`attendee-card-${attendee.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="h-20 w-20 mb-3">
                        <AvatarImage src={photo} alt={name} />
                        <AvatarFallback className="text-lg">
                          {getInitials(name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <h3 className="font-semibold text-lg mb-1">{name}</h3>
                      
                      <Badge className={getRoleBadgeColor(role) + ' mb-2'}>
                        {role}
                      </Badge>

                      {profile?.current_role && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                          <Briefcase className="h-3 w-3" />
                          <span className="truncate">{profile.current_role}</span>
                        </div>
                      )}

                      {profile?.current_company && (
                        <p className="text-sm text-gray-600 mb-2">
                          at {profile.current_company}
                        </p>
                      )}

                      {profile?.location && (
                        <p className="text-xs text-gray-500 mb-3">
                          {profile.location}
                        </p>
                      )}

                      {/* Skills (if any) */}
                      {profile?.skills && profile.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center mb-3">
                          {profile.skills.slice(0, 3).map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {profile.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{profile.skills.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/profile/${attendee.user_id}`);
                        }}
                      >
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No attendees yet</h3>
              <p className="text-gray-600">
                Be the first to RSVP to this event!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default EventAttendees;