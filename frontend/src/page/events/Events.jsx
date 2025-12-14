import { useState, useEffect } from 'react';
import { Search, Plus, Filter, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50/30">
        <div className="container mx-auto px-4 py-10 max-w-7xl" data-testid="events-page">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-100 to-rose-100 border border-pink-200 rounded-full mb-4">
                  <Sparkles className="w-4 h-4 text-pink-600" />
                  <span className="text-sm font-medium text-pink-900">Connect & Learn Together</span>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <CalendarIcon className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Events</h1>
                </div>
                <p className="text-lg text-gray-600">
                  Discover and join upcoming workshops, webinars, and networking events
                </p>
              </div>
              {canCreateEvent && (
                <div className="flex gap-3">
                  <Button 
                    onClick={() => navigate('/events/create')}
                    className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 shadow-lg shadow-pink-500/50 h-12 px-6"
                    data-testid="create-event-button"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/events/manage')}
                    className="h-12 px-6 border-2 border-gray-300 hover:border-pink-400 rounded-xl"
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
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search events..."
                  className="pl-12 h-12 border-2 border-gray-200 focus:border-pink-400 rounded-xl shadow-sm bg-white"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  data-testid="search-events-input"
                />
              </div>
              
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-[200px] h-12 border-2 border-gray-200 focus:border-pink-400 rounded-xl shadow-sm bg-white" data-testid="event-type-filter">
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
            <TabsList className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 p-1 rounded-xl shadow-sm">
              <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-600 data-[state=active]:to-rose-600 data-[state=active]:text-white" data-testid="upcoming-tab">
                Upcoming Events
              </TabsTrigger>
              <TabsTrigger value="past" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-600 data-[state=active]:to-rose-600 data-[state=active]:text-white" data-testid="past-tab">
                Past Events
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-8">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-96 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border-2 border-pink-200">
                  <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No upcoming events</h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm || selectedType !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Check back later for new events'}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-8">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-96 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border-2 border-pink-200">
                  <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No past events</h3>
                  <p className="text-gray-600">Past events will appear here</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default Events;