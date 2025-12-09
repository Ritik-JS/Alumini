import { useState, useEffect } from 'react';
import { Search, Plus, Filter, Calendar as CalendarIcon } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import EventCard from '@/components/events/EventCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { eventService } from '@/services';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [activeTab, setActiveTab] = useState('upcoming');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const canCreateEvent = ['admin', 'alumni'].includes(currentUser.role);

  useEffect(() => {
    loadEvents();
  }, [activeTab, selectedType, searchTerm]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const filters = {
        status: activeTab,
        search: searchTerm
      };
      
      if (selectedType !== 'all') {
        filters.type = selectedType;
      }

      const response = await eventService.getEvents(filters);
      
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

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl" data-testid="events-page">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Events</h1>
              <p className="text-gray-600">
                Discover and join upcoming workshops, webinars, and networking events
              </p>
            </div>
            {canCreateEvent && (
              <div className="flex gap-3">
                <Button 
                  onClick={() => navigate('/events/create')}
                  data-testid="create-event-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/events/manage')}
                  data-testid="manage-events-button"
                >
                  Manage My Events
                </Button>
              </div>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search events..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                data-testid="search-events-input"
              />
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-[200px]" data-testid="event-type-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="webinar">Webinar</SelectItem>
                <SelectItem value="conference">Conference</SelectItem>
                <SelectItem value="networking">Networking</SelectItem>
                <SelectItem value="meetup">Meetup</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="upcoming" data-testid="upcoming-tab">
              Upcoming Events
            </TabsTrigger>
            <TabsTrigger value="past" data-testid="past-tab">
              Past Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-96 bg-gray-200 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CalendarIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedType !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Check back later for new events'}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-96 bg-gray-200 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CalendarIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No past events</h3>
                <p className="text-gray-600">Past events will appear here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Events;