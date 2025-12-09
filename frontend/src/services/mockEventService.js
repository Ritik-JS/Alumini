import mockData from '../mockdata.json';

// Simulate API delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Get current user from localStorage
const getCurrentUser = () => {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};

// Mock Event Service
class MockEventService {
  constructor() {
    // Initialize with mock data
    this.events = [...mockData.events];
    this.rsvps = [...mockData.event_rsvps];
  }

  // Get all events with optional filters
  async getEvents(filters = {}) {
    await delay();
    
    let filtered = [...this.events];
    
    // Filter by event type
    if (filters.type) {
      filtered = filtered.filter(event => event.event_type === filters.type);
    }
    
    // Filter by status (upcoming/past)
    if (filters.status) {
      const now = new Date();
      if (filters.status === 'upcoming') {
        filtered = filtered.filter(event => new Date(event.start_date) >= now);
      } else if (filters.status === 'past') {
        filtered = filtered.filter(event => new Date(event.start_date) < now);
      }
    }
    
    // Search by title
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by date
    filtered.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    
    return {
      success: true,
      data: filtered
    };
  }

  // Get single event by ID
  async getEventById(eventId) {
    await delay();
    
    const event = this.events.find(e => e.id === eventId);
    
    if (!event) {
      return {
        success: false,
        message: 'Event not found'
      };
    }
    
    // Get RSVPs for this event
    const eventRsvps = this.rsvps.filter(r => r.event_id === eventId);
    
    return {
      success: true,
      data: {
        ...event,
        rsvps: eventRsvps
      }
    };
  }

  // Create new event
  async createEvent(eventData) {
    await delay();
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' };
    }
    
    const newEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...eventData,
      created_by: currentUser.id,
      status: 'published',
      current_attendees_count: 0,
      views_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.events.push(newEvent);
    
    return {
      success: true,
      data: newEvent,
      message: 'Event created successfully'
    };
  }

  // Update event
  async updateEvent(eventId, eventData) {
    await delay();
    
    const index = this.events.findIndex(e => e.id === eventId);
    
    if (index === -1) {
      return { success: false, message: 'Event not found' };
    }
    
    this.events[index] = {
      ...this.events[index],
      ...eventData,
      updated_at: new Date().toISOString()
    };
    
    return {
      success: true,
      data: this.events[index],
      message: 'Event updated successfully'
    };
  }

  // Delete event
  async deleteEvent(eventId) {
    await delay();
    
    const index = this.events.findIndex(e => e.id === eventId);
    
    if (index === -1) {
      return { success: false, message: 'Event not found' };
    }
    
    this.events.splice(index, 1);
    
    return {
      success: true,
      message: 'Event deleted successfully'
    };
  }

  // RSVP to event
  async rsvpToEvent(eventId, status = 'attending') {
    await delay();
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' };
    }
    
    // Check if event exists
    const event = this.events.find(e => e.id === eventId);
    if (!event) {
      return { success: false, message: 'Event not found' };
    }
    
    // Check if already RSVP'd
    const existingRsvp = this.rsvps.find(
      r => r.event_id === eventId && r.user_id === currentUser.id
    );
    
    if (existingRsvp) {
      // Update existing RSVP
      existingRsvp.status = status;
      existingRsvp.updated_at = new Date().toISOString();
      
      return {
        success: true,
        data: existingRsvp,
        message: 'RSVP updated successfully'
      };
    }
    
    // Create new RSVP
    const newRsvp = {
      id: `rsvp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      event_id: eventId,
      user_id: currentUser.id,
      status: status,
      rsvp_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.rsvps.push(newRsvp);
    
    // Update attendee count
    if (status === 'attending') {
      event.current_attendees_count += 1;
    }
    
    return {
      success: true,
      data: newRsvp,
      message: 'RSVP successful'
    };
  }

  // Get user's RSVP for an event
  async getUserRsvp(eventId) {
    await delay();
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' };
    }
    
    const rsvp = this.rsvps.find(
      r => r.event_id === eventId && r.user_id === currentUser.id
    );
    
    return {
      success: true,
      data: rsvp || null
    };
  }

  // Get attendees for an event
  async getEventAttendees(eventId) {
    await delay();
    
    const eventRsvps = this.rsvps.filter(
      r => r.event_id === eventId && r.status === 'attending'
    );
    
    // Get user details for attendees
    const attendees = eventRsvps.map(rsvp => {
      const user = mockData.users.find(u => u.id === rsvp.user_id);
      const profile = mockData.alumni_profiles.find(p => p.user_id === rsvp.user_id);
      
      return {
        ...rsvp,
        user: user,
        profile: profile
      };
    });
    
    return {
      success: true,
      data: attendees
    };
  }

  // Get events created by current user
  async getMyEvents() {
    await delay();
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' };
    }
    
    const myEvents = this.events.filter(e => e.created_by === currentUser.id);
    
    return {
      success: true,
      data: myEvents
    };
  }

  // Get upcoming events
  async getUpcomingEvents(limit = 10) {
    await delay();
    
    const now = new Date();
    const upcomingEvents = this.events
      .filter(event => new Date(event.start_date) >= now && event.status === 'published')
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
      .slice(0, limit);
    
    return {
      success: true,
      data: upcomingEvents
    };
  }
}

export default new MockEventService();
