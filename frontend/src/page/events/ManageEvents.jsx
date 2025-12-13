import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Users, Eye } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { eventService } from '@/services';
import { toast } from 'sonner';
import { format } from 'date-fns';

const ManageEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  useEffect(() => {
    loadMyEvents();
  }, []);

  const loadMyEvents = async () => {
    setLoading(true);
    try {
      const response = await eventService.getMyEvents();
      
      if (response.success) {
        setEvents(response.data);
      } else {
        toast.error('Failed to load events');
      }
    } catch (error) {
      toast.error('Error loading events');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (event) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;

    try {
      const response = await eventService.deleteEvent(eventToDelete.id);
      
      if (response.success) {
        toast.success('Event deleted successfully');
        setEvents(events.filter(e => e.id !== eventToDelete.id));
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error('Failed to delete event');
    } finally {
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy • h:mm a');
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

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl" data-testid="manage-events-page">
        {/* Header */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/events')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage My Events</h1>
            <p className="text-gray-600">
              View and manage events you've created
            </p>
          </div>
          <Button onClick={() => navigate('/events/create')}>
            Create New Event
          </Button>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-gray-200 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-4">
            {events.map(event => (
              <Card key={event.id} data-testid={`manage-event-card-${event.id}`}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Event Thumbnail */}
                    {event.banner_image && (
                      <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                        <img
                          src={event.banner_image}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getEventTypeBadgeColor(event.event_type)}>
                              {event.event_type}
                            </Badge>
                            {event.status === 'published' ? (
                              <Badge variant="outline" className="text-green-600">
                                Published
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-600">
                                Draft
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {formatDate(event.start_date)}
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {event.description}
                          </p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{event.current_attendees_count} / {event.max_attendees}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{event.views_count || 0} views</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/events/${event.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/events/${event.id}/attendees`)}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Attendees
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/events/${event.id}/edit`)}
                          data-testid={`edit-event-button-${event.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(event)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-semibold mb-2">No events yet</h3>
              <p className="text-gray-600 mb-4">
                You haven't created any events. Start by creating your first event!
              </p>
              <Button onClick={() => navigate('/events/create')}>
                Create Your First Event
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Event</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{eventToDelete?.title}"? This action cannot be undone
                and all registrations will be cancelled.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Event
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
};

export default ManageEvents;