import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, MoreVertical, Eye, Trash2, Calendar, Users, MapPin } from 'lucide-react';
import { adminService } from '@/services';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { toast } from 'sonner';

const AdminEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminService.getAllEvents();
      setEvents(result.data || []);
      setFilteredEvents(result.data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      setError('Unable to connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    let filtered = events;

    if (searchQuery) {
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    setFilteredEvents(filtered);
  }, [searchQuery, statusFilter, events]);

  const handleViewEvent = async (eventId) => {
    try {
      const result = await adminService.getEventDetails(eventId);
      setSelectedEvent(result.data);
      setShowEventModal(true);
    } catch (error) {
      console.error('Error loading event:', error);
      toast.error('Unable to load event details. Please try again.');
    }
  };

  const handleViewAttendees = async (eventId) => {
    try {
      const result = await adminService.getEventDetails(eventId);
      setSelectedEvent(result.data);
      setShowAttendeesModal(true);
    } catch (error) {
      console.error('Error loading event attendees:', error);
      toast.error('Unable to load event attendees. Please try again.');
    }
  };

  const handleChangeStatus = async (eventId, newStatus) => {
    try {
      await adminService.updateEvent(eventId, { status: newStatus });
      setEvents(events.map(e => e.id === eventId ? { ...e, status: newStatus } : e));
      toast.success(`Event status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating event status:', error);
      toast.error('Unable to update event status. Please try again.');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await adminService.deleteEvent(eventId);
        setEvents(events.filter((e) => e.id !== eventId));
        toast.success('Event deleted successfully');
      } catch (error) {
        console.error('Error deleting event:', error);
        toast.error('Unable to delete event. Please try again.');
      }
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = [
    { label: 'Total Events', value: events.length, color: 'text-blue-600', icon: Calendar },
    { label: 'Published', value: events.filter((e) => e.status === 'published').length, color: 'text-green-600', icon: Calendar },
    { label: 'Completed', value: events.filter((e) => e.status === 'completed').length, color: 'text-purple-600', icon: Calendar },
    { label: 'Total Attendees', value: events.reduce((sum, e) => sum + (e.current_attendees_count || 0), 0), color: 'text-orange-600', icon: Users },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <MainNavbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6">
            <LoadingSpinner message="Loading events..." />
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <MainNavbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6">
            <ErrorMessage message={error} onRetry={loadEvents} />
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainNavbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
              <h1 className="text-3xl font-bold">Event Management 📅</h1>
              <p className="mt-2 opacity-90">Manage all events on the platform</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                          <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
                        </div>
                        <Icon className={`w-8 h-8 ${stat.color} opacity-50`} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Events List */}
            <Card>
              <CardHeader>
                <CardTitle>All Events</CardTitle>
                <CardDescription>View and manage all events on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search by title or location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="event-search-input"
                      />
                    </div>
                    <div className="flex gap-2">
                      {['all', 'published', 'completed', 'cancelled', 'draft'].map((status) => (
                        <Button
                          key={status}
                          variant={statusFilter === status ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setStatusFilter(status)}
                          className="capitalize"
                          data-testid={`filter-${status}-btn`}
                        >
                          {status}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="pb-3 font-medium text-gray-700">Event Title</th>
                        <th className="pb-3 font-medium text-gray-700">Type</th>
                        <th className="pb-3 font-medium text-gray-700">Location</th>
                        <th className="pb-3 font-medium text-gray-700">Date</th>
                        <th className="pb-3 font-medium text-gray-700">Status</th>
                        <th className="pb-3 font-medium text-gray-700">Attendees</th>
                        <th className="pb-3 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.map((event) => (
                        <tr key={event.id} className="border-b hover:bg-gray-50" data-testid={`event-row-${event.id}`}>
                          <td className="py-4 font-medium">{event.title}</td>
                          <td className="py-4">
                            <Badge variant="outline" className="capitalize">
                              {event.event_type}
                            </Badge>
                          </td>
                          <td className="py-4 text-sm">
                            <div className="flex items-center gap-1">
                              {event.is_virtual ? (
                                <Badge variant="outline" className="bg-blue-50">Virtual</Badge>
                              ) : (
                                <span>{event.location}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 text-sm">
                            {new Date(event.start_date).toLocaleDateString()}
                          </td>
                          <td className="py-4">
                            <Badge className={`capitalize ${getStatusBadgeColor(event.status)}`}>
                              {event.status}
                            </Badge>
                          </td>
                          <td className="py-4 text-sm">
                            {event.current_attendees_count || 0} / {event.max_attendees || '∞'}
                          </td>
                          <td className="py-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" data-testid={`event-actions-${event.id}`}>
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleViewEvent(event.id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewAttendees(event.id)}>
                                  <Users className="mr-2 h-4 w-4" />
                                  View Attendees
                                </DropdownMenuItem>
                                {event.status === 'published' && (
                                  <DropdownMenuItem onClick={() => handleChangeStatus(event.id, 'completed')}>
                                    Mark as Completed
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteEvent(event.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Event
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredEvents.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No events found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Footer />

      {/* Event Details Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>Complete event information</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold">{selectedEvent.title}</h3>
                <div className="flex gap-2 mt-2">
                  <Badge className={getStatusBadgeColor(selectedEvent.status)}>
                    {selectedEvent.status}
                  </Badge>
                  <Badge variant="outline">{selectedEvent.event_type}</Badge>
                  {selectedEvent.is_virtual && <Badge variant="outline" className="bg-blue-50">Virtual</Badge>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b py-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Start Date</p>
                  <p className="text-sm mt-1">{new Date(selectedEvent.start_date).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">End Date</p>
                  <p className="text-sm mt-1">{new Date(selectedEvent.end_date).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Location</p>
                  <p className="text-sm mt-1">{selectedEvent.is_virtual ? 'Virtual Event' : selectedEvent.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Capacity</p>
                  <p className="text-sm mt-1">{selectedEvent.max_attendees ? `${selectedEvent.current_attendees_count} / ${selectedEvent.max_attendees}` : 'Unlimited'}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedEvent.description}</p>
              </div>

              {selectedEvent.meeting_link && (
                <div>
                  <h4 className="font-semibold mb-2">Meeting Link</h4>
                  <a href={selectedEvent.meeting_link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                    {selectedEvent.meeting_link}
                  </a>
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Created By</p>
                <p className="text-sm">{selectedEvent.creator_email || 'Unknown'}</p>
                <p className="text-xs text-gray-500 mt-1">on {new Date(selectedEvent.created_at).toLocaleDateString()}</p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEventModal(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  handleViewAttendees(selectedEvent.id);
                  setShowEventModal(false);
                }}>
                  <Users className="w-4 h-4 mr-2" />
                  View Attendees
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Attendees Modal */}
      <Dialog open={showAttendeesModal} onOpenChange={setShowAttendeesModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Attendees</DialogTitle>
            <DialogDescription>
              {selectedEvent?.attendees?.length || 0} attending
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-3">
              {selectedEvent.attendees && selectedEvent.attendees.length > 0 ? (
                selectedEvent.attendees.map(attendee => (
                  <div key={attendee.id || attendee.user_id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <img
                      src={attendee.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${attendee.email}`}
                      alt={attendee.name || attendee.email}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{attendee.name || attendee.email}</p>
                      <p className="text-xs text-gray-500">{attendee.email}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">{attendee.role || 'User'}</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No attendees yet</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEvents;